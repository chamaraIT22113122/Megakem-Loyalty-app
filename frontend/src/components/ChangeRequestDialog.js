import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Typography, 
  Box 
} from '@mui/material';
import { Security, Send } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';

const ChangeRequestDialog = ({ showNotification }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [requestConfig, setRequestConfig] = useState(null);
  const [promiseCallbacks, setPromiseCallbacks] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleRequireChangeRequest = (event) => {
      const { config, resolve, reject } = event.detail;
      setRequestConfig(config);
      setPromiseCallbacks({ resolve, reject });
      setReason('');
      setOpen(true);
    };

    window.addEventListener('require_change_request', handleRequireChangeRequest);
    return () => {
      window.removeEventListener('require_change_request', handleRequireChangeRequest);
    };
  }, []);

  const handleCancel = () => {
    if (promiseCallbacks) {
      promiseCallbacks.reject(new axios.Cancel('CHANGE_REQUEST_CANCELLED'));
    }
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      if (showNotification) showNotification('Please provide a reason for this change', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Determine entity type and action from URL and method
      let actionType = 'update';
      if (requestConfig.method === 'post') actionType = 'create';
      if (requestConfig.method === 'delete') actionType = 'delete';

      const payload = {
        actionType,
        entityType: requestConfig.url.split('/')[1] || 'unknown',
        endpoint: requestConfig.url.replace(API_BASE_URL, '').replace('/api', ''),
        method: requestConfig.method,
        payload: requestConfig.data ? JSON.parse(requestConfig.data) : null,
        reason
      };

      await axios.post(`${API_BASE_URL}/change-requests`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (showNotification) showNotification('Change request submitted to admin for approval', 'success');
      
      if (promiseCallbacks) {
        promiseCallbacks.resolve({ submitted: true });
      }
      setOpen(false);
    } catch (error) {
      console.error('Failed to submit change request:', error);
      if (showNotification) showNotification('Failed to submit change request', 'error');
      if (promiseCallbacks) {
        promiseCallbacks.reject(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security color="warning" />
        Admin Approval Required
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <Typography variant="body1" gutterBottom>
            As a Co-Admin, your changes require approval from a Manager Admin or Main Admin.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Action: <strong>{requestConfig?.method?.toUpperCase()}</strong> {requestConfig?.url?.replace(API_BASE_URL, '')}
          </Typography>
          
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            label="Reason for change"
            placeholder="Please explain why this change is needed..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          endIcon={<Send />}
          disabled={!reason.trim() || submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeRequestDialog;
