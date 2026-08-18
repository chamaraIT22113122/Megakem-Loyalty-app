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

const ReprintRequestsPanel = ({ onShowNotification, onRequestsChanged, userInfo }) => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  const isMainAdmin = userInfo && (userInfo.email === 'admin@megakem.com' || (userInfo.role === 'admin' && !userInfo.permissions));

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
          currentReprint = (fresh.data?.data || []).map(r => ({ ...r, _source: 'reprint' }));
          updateCombined();
      }).catch(() => ({ data: { data: [] } }));
      
      const p2 = api.getWithCache('/cash-rewards/admin-notifications', {}, (fresh) => {
          currentNotif = (fresh.data?.data || []).map(r => ({ ...r, _source: 'notification' }));
          updateCombined();
      }).catch(() => ({ data: { data: [] } }));
      
      const p3 = api.getWithCache('/change-requests', {}, (fresh) => {
          currentChange = (fresh.data?.data || []).map(r => ({ ...r, _source: 'change' }));
          updateCombined();
      }).catch(() => ({ data: { data: [] } }));

      const [res1, res2, res3] = await Promise.all([p1, p2, p3]);
      currentReprint = (res1.data?.data || []).map(r => ({ ...r, _source: 'reprint' }));
      currentNotif = (res2.data?.data || []).map(r => ({ ...r, _source: 'notification' }));
      currentChange = (res3.data?.data || []).map(r => ({ ...r, _source: 'change' }));
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

  const handleApprove = async (req) => {
    try {
      setLoading(true);
      if (req._source === 'change' || req.actionType) {
        await api.put(`/change-requests/${req._id}/approve`);
        onShowNotification('Change request approved and executed successfully', 'success');
      } else {
        await api.put(`/qr-codes/reprint-requests/${req._id}/approve`);
        onShowNotification('Reprint request approved successfully', 'success');
      }
      loadRequests();
      if (onRequestsChanged) onRequestsChanged();
    } catch (error) {
      onShowNotification('Error approving request: ' + (error.response?.data?.error || error.message), 'error');
      setLoading(false);
    }
  };

  const handleReject = async (req) => {
    try {
      setLoading(true);
      if (req._source === 'change' || req.actionType) {
        await api.put(`/change-requests/${req._id}/reject`);
        onShowNotification('Change request rejected', 'success');
      } else {
        await api.put(`/qr-codes/reprint-requests/${req._id}/reject`);
        onShowNotification('Reprint request rejected successfully', 'success');
      }
      loadRequests();
      if (onRequestsChanged) onRequestsChanged();
    } catch (error) {
      onShowNotification('Error rejecting request: ' + (error.response?.data?.error || error.message), 'error');
      setLoading(false);
    }
  };

  const handleDelete = async (req) => {
    if (!isMainAdmin) {
      onShowNotification('Only the Main Admin can delete requests', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this record from history?')) return;
    try {
      setLoading(true);
      const id = req._id;

      if (req._source === 'change' || req.actionType) {
        await api.delete(`/change-requests/${id}`);
      } else if (req._source === 'notification' || req.type === 'payment' || req.type === 'info' || req.message) {
        await api.delete(`/cash-rewards/admin-notifications/${id}`);
      } else if (req._source === 'reprint' || req.qrCode) {
        await api.delete(`/qr-codes/reprint-requests/${id}`);
      } else {
        // Safe fallback: attempt in order
        try {
          await api.delete(`/qr-codes/reprint-requests/${id}`);
        } catch (e1) {
          try {
            await api.delete(`/change-requests/${id}`);
          } catch (e2) {
            await api.delete(`/cash-rewards/admin-notifications/${id}`);
          }
        }
      }

      onShowNotification('Request record deleted successfully', 'success');
      loadRequests();
      if (onRequestsChanged) onRequestsChanged();
    } catch (error) {
      onShowNotification('Error deleting request: ' + (error.response?.data?.error || error.response?.data?.message || error.message), 'error');
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
                    if (req.type === 'payment' || req.type === 'info') {
                      return (
                        <TableRow key={req._id} hover sx={{ bgcolor: req.type === 'payment' ? 'rgba(76, 175, 80, 0.08)' : 'inherit' }}>
                          <TableCell sx={{ fontSize: '0.875rem' }}>
                            {new Date(req.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell colSpan={4} sx={{ fontSize: '0.875rem' }}>
                            <strong>{req.type === 'payment' ? 'System Notification:' : 'Info:'}</strong> {req.message || req.reason || '-'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={(req.type || 'INFO').toUpperCase()} 
                              size="small" 
                              color={req.type === 'payment' ? 'success' : 'default'} 
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 3 }}>
                            {isMainAdmin ? (
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                                <Tooltip title="Delete Notification (Main Admin)">
                                  <IconButton
                                    color="default"
                                    onClick={() => handleDelete(req)}
                                    disabled={loading}
                                    size="small"
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="textSecondary">
                                Recorded
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    const isChangeRequest = req._source === 'change' || !!req.actionType;

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
                              {(req.actionType || 'Action').toUpperCase()} {req.entityType || ''}
                            </Typography>
                          ) : (
                            req.qrCode?.productName || '-'
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {isChangeRequest ? (
                            <Chip label={req.endpoint || '-'} size="small" variant="outlined" />
                          ) : (
                            <>
                              <Chip label={`B: ${req.qrCode?.batchNo || '-'}`} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                              <Chip label={`P: ${req.qrCode?.packageNo || '-'}`} size="small" variant="outlined" />
                            </>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Tooltip title={req.reason || '-'}>
                            <span>{req.reason || '-'}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip label={(req.status || 'INFO').toUpperCase()} size="small" color={statusColor} sx={{ fontWeight: 'bold' }} />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 3 }}>
                          {req.status === 'pending' ? (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Tooltip title="Approve">
                                <IconButton
                                  color="success"
                                  onClick={() => handleApprove(req)}
                                  disabled={loading}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  color="error"
                                  onClick={() => handleReject(req)}
                                  disabled={loading}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : isMainAdmin ? (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Tooltip title="Delete Record (Main Admin)">
                                <IconButton
                                  color="default"
                                  onClick={() => handleDelete(req)}
                                  disabled={loading}
                                  size="small"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : null}
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
