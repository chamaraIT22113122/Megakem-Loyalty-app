import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import api, { recycleBinAPI } from '../services/api';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

const RecycleBin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      if (!api.hasCache('/recycle-bin')) setLoading(true);
      const response = await recycleBinAPI.getAll((fresh) => {
        setItems(fresh.data);
      });
      setItems(response.data);
    } catch (err) {
      setError('Failed to fetch recycle bin items');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      setActionLoading(true);
      await recycleBinAPI.restore(id);
      setItems(items.filter(item => item._id !== id));
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to restore item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionLoading(true);
      await recycleBinAPI.delete(id);
      setItems(items.filter(item => item._id !== id));
      setConfirmDialog(null);
    } catch (err) {
      setError('Failed to delete item permanently');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmpty = async () => {
    try {
      setActionLoading(true);
      await recycleBinAPI.empty();
      setItems([]);
      setConfirmDialog(null);
    } catch (err) {
      setError('Failed to empty recycle bin');
    } finally {
      setActionLoading(false);
    }
  };

  const getCollectionColor = (collection) => {
    switch (collection) {
      case 'qrcodes': return 'primary';
      case 'members': return 'success';
      case 'products': return 'warning';
      case 'users': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) return <Box p={3} display="flex" justifyContent="center"><CircularProgress /></Box>;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Recycle Bin</Typography>
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<DeleteForeverIcon />}
          onClick={() => setConfirmDialog({ type: 'empty' })}
          disabled={items.length === 0}
        >
          Empty Recycle Bin
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Summary</strong></TableCell>
              <TableCell><strong>Deleted By</strong></TableCell>
              <TableCell><strong>Deleted At</strong></TableCell>
              <TableCell><strong>Expires In</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="textSecondary">Recycle bin is empty.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const daysLeft = Math.ceil((new Date(item.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <TableRow key={item._id}>
                    <TableCell>
                      <Chip label={item.originalCollection.toUpperCase()} size="small" color={getCollectionColor(item.originalCollection)} />
                    </TableCell>
                    <TableCell>{item.summary}</TableCell>
                    <TableCell>
                      {item.deletedBy ? (
                        <Box>
                          <Typography variant="body2">{item.deletedBy.username || 'Admin'}</Typography>
                          {item.deletedBy.email && (
                            <Typography variant="caption" color="textSecondary">{item.deletedBy.email}</Typography>
                          )}
                        </Box>
                      ) : (
                        'Unknown'
                      )}
                    </TableCell>
                    <TableCell>{new Date(item.deletedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography color={daysLeft <= 3 ? 'error' : 'textSecondary'}>
                        {daysLeft > 0 ? `${daysLeft} days` : 'Expiring soon'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Restore">
                        <IconButton color="primary" onClick={() => handleRestore(item._id)}>
                          <RestoreIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Permanently">
                        <IconButton color="error" onClick={() => setConfirmDialog({ type: 'delete', id: item._id })}>
                          <DeleteForeverIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={Boolean(confirmDialog)} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>
          {confirmDialog?.type === 'empty' ? 'Empty Recycle Bin' : 'Delete Permanently'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog?.type === 'empty' 
              ? 'Are you sure you want to empty the recycle bin? All items will be permanently deleted. This action cannot be undone.'
              : 'Are you sure you want to permanently delete this item? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} disabled={actionLoading}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => confirmDialog?.type === 'empty' ? handleEmpty() : handleDelete(confirmDialog?.id)}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirm Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecycleBin;
