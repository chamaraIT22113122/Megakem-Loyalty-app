import React, { useState, useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Cancel,
  Notifications
} from '@mui/icons-material';
import api from '../services/api';

const ReprintRequestsPanel = ({ onShowNotification }) => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/qr-codes/reprint-requests');
      setRequests(response.data.data || []);
    } catch (error) {
      onShowNotification('Error loading reprint requests: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      setLoading(true);
      await api.put(`/qr-codes/reprint-requests/${id}/approve`);
      onShowNotification('Reprint request approved successfully', 'success');
      loadRequests();
    } catch (error) {
      onShowNotification('Error approving request: ' + (error.response?.data?.error || error.message), 'error');
      setLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setLoading(true);
      await api.put(`/qr-codes/reprint-requests/${id}/reject`);
      onShowNotification('Reprint request rejected successfully', 'success');
      loadRequests();
    } catch (error) {
      onShowNotification('Error rejecting request: ' + (error.response?.data?.error || error.message), 'error');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications color="primary" /> Co-Admin Reprint Requests
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
                    const statusColor =
                      req.status === 'approved'
                        ? 'success'
                        : req.status === 'rejected'
                        ? 'error'
                        : req.status === 'pending'
                        ? 'warning'
                        : 'default';

                    return (
                      <TableRow key={req._id} hover>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {new Date(req.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem', fontWeight: 'medium' }}>
                          {req.requestedByEmail || 'Co-Admin'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {req.qrCode?.productName || '-'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          <Chip label={`B: ${req.qrCode?.batchNo || '-'}`} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                          <Chip label={`P: ${req.qrCode?.packageNo || '-'}`} size="small" variant="outlined" />
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
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => handleApprove(req._id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => handleReject(req._id)}
                              >
                                Reject
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Resolved {req.approvedAt && `on ${new Date(req.approvedAt).toLocaleDateString()}`}
                            </Typography>
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
