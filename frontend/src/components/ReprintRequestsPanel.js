/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Cancel,
  Notifications,
  Delete
} from '@mui/icons-material';
import api from '../services/api';

const ReprintRequestsPanel = ({ onShowNotification, onRequestsChanged }) => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    try {
      if (!api.hasCache('/qr-codes/reprint-requests') || !api.hasCache('/cash-rewards/admin-notifications') || !api.hasCache('/change-requests')) {
        setLoading(true);
      }
      
      let currentReprint = [];
      let currentNotif = [];
      let currentChange = [];

      const updateCombined = () => {
         const combined = [...currentReprint, ...currentNotif, ...currentChange];
         combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
         setRequests(combined);
      };

      const p1 = api.getWithCache('/qr-codes/reprint-requests', {}, (fresh) => {
          currentReprint = fresh.data?.data || [];
          updateCombined();
      }).catch(() => ({ data: { data: [] } }));
      
      const p2 = api.getWithCache('/cash-rewards/admin-notifications', {}, (fresh) => {
          currentNotif = fresh.data?.data || [];
          updateCombined();
      }).catch(() => ({ data: { data: [] } }));
      
      const p3 = api.getWithCache('/change-requests', {}, (fresh) => {
          currentChange = fresh.data?.data || [];
          updateCombined();
      }).catch(() => ({ data: { data: [] } }));

      const [res1, res2, res3] = await Promise.all([p1, p2, p3]);
      currentReprint = res1.data?.data || [];
      currentNotif = res2.data?.data || [];
      currentChange = res3.data?.data || [];
      updateCombined();
    } catch (error) {
      console.error('Error loading requests:', error);
      onShowNotification('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    let socket;
    try {
      socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling']
      });
      socket.on('data_updated', (data) => {
        if (data && data.entity === 'reprint_requests') {
          loadRequests();
        }
      });
    } catch (err) {
      console.warn('Socket init failed:', err);
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleApprove = async (id, isChangeRequest = false) => {
    try {
      setLoading(true);
      if (isChangeRequest) {
        await api.put(`/change-requests/${id}/approve`);
        onShowNotification('Change request approved and executed successfully', 'success');
      } else {
        await api.put(`/qr-codes/reprint-requests/${id}/approve`);
        onShowNotification('Reprint request approved successfully', 'success');
      }
      loadRequests();
      if (onRequestsChanged) onRequestsChanged();
    } catch (error) {
      onShowNotification('Error approving request: ' + (error.response?.data?.error || error.message), 'error');
      setLoading(false);
    }
  };

  const handleReject = async (id, isChangeRequest = false) => {
    try {
      setLoading(true);
      if (isChangeRequest) {
        await api.put(`/change-requests/${id}/reject`);
        onShowNotification('Change request rejected', 'success');
      } else {
        await api.put(`/qr-codes/reprint-requests/${id}/reject`);
        onShowNotification('Reprint request rejected successfully', 'success');
      }
      loadRequests();
      if (onRequestsChanged) onRequestsChanged();
    } catch (error) {
      onShowNotification('Error rejecting request: ' + (error.response?.data?.error || error.message), 'error');
      setLoading(false);
    }
  };

  const handleDelete = async (id, isChangeRequest = false) => {
    if (!window.confirm('Are you sure you want to delete this request from history?')) return;
    try {
      setLoading(true);
      if (isChangeRequest) {
        await api.delete(`/change-requests/${id}`);
        onShowNotification('Change request deleted', 'success');
      } else {
        await api.delete(`/qr-codes/reprint-requests/${id}`);
        onShowNotification('Reprint request deleted successfully', 'success');
      }
      loadRequests();
      if (onRequestsChanged) onRequestsChanged();
    } catch (error) {
      onShowNotification('Error deleting request: ' + (error.response?.data?.error || error.message), 'error');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications color="primary" /> Requests
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadRequests}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Refresh'}
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Requested Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Requested By</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Batch & Pkg</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', pr: 3 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="textSecondary">No reprint requests found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => {
                    if (req.type === 'payment') {
                      return (
                        <TableRow key={req._id} hover sx={{ bgcolor: 'rgba(76, 175, 80, 0.08)' }}>
                          <TableCell sx={{ fontSize: '0.875rem' }}>
                            {new Date(req.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell colSpan={4} sx={{ fontSize: '0.875rem' }}>
                            <strong>System Notification:</strong> {req.message}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label="PAYMENT" 
                              size="small" 
                              color="success" 
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 3 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                              <Typography variant="caption" color="textSecondary">
                                Recorded
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    const isChangeRequest = !!req.actionType;

                    const statusColor =
                      req.status === 'approved'
                        ? 'success'
                        : req.status === 'rejected'
                        ? 'error'
                        : req.status === 'failed'
                        ? 'error'
                        : req.status === 'pending'
                        ? 'warning'
                        : 'default';

                    return (
                      <TableRow key={req._id} hover sx={isChangeRequest ? { bgcolor: 'rgba(25, 118, 210, 0.04)' } : {}}>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {new Date(req.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem', fontWeight: 'medium' }}>
                          {isChangeRequest ? req.requesterId?.email : (req.requestedByEmail || 'Co-Admin')}
                          {isChangeRequest && <Chip label="Action" size="small" color="info" sx={{ ml: 1, fontSize: '0.65rem', height: 18 }} />}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {isChangeRequest ? (
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {req.actionType.toUpperCase()} {req.entityType}
                            </Typography>
                          ) : (
                            req.qrCode?.productName || '-'
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {isChangeRequest ? (
                            <Chip label={req.endpoint} size="small" variant="outlined" />
                          ) : (
                            <>
                              <Chip label={`B: ${req.qrCode?.batchNo || '-'}`} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                              <Chip label={`P: ${req.qrCode?.packageNo || '-'}`} size="small" variant="outlined" />
                            </>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Tooltip title={req.reason}>
                            <span>{req.reason}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip label={req.status.toUpperCase()} size="small" color={statusColor} sx={{ fontWeight: 'bold' }} />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 3 }}>
                          {req.status === 'pending' ? (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Tooltip title="Approve">
                                <IconButton
                                  color="success"
                                  onClick={() => handleApprove(req._id, isChangeRequest)}
                                  disabled={loading}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  color="error"
                                  onClick={() => handleReject(req._id, isChangeRequest)}
                                  disabled={loading}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Tooltip title="Delete Record">
                                <IconButton
                                  color="default"
                                  onClick={() => handleDelete(req._id, isChangeRequest)}
                                  disabled={loading}
                                  size="small"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReprintRequestsPanel;
