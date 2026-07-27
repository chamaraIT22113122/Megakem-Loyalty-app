import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  CircularProgress, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Tooltip, Avatar, Chip, TextField, InputAdornment
} from '@mui/material';
import { Delete, Visibility, Image as ImageIcon, ArrowBackIos, ArrowForwardIos, Save, Email } from '@mui/icons-material';
import { feedbackAPI, API_BASE_URL } from '../services/api';

const FeedbacksTab = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', type: 'success' });
  const [selectedGallery, setSelectedGallery] = useState({ open: false, images: [], index: 0 });
  const [redirectEmail, setRedirectEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackAPI.getAll();
      if (response.data.success) {
        setFeedbacks(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('Failed to load feedbacks.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await feedbackAPI.getSettings();
      if (response.data.success) {
        setRedirectEmail(response.data.data.feedbackRedirectEmail || '');
      }
    } catch (err) {
      console.error('Error fetching feedback settings:', err);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    fetchSettings();
  }, []);

  const handleSaveEmail = async () => {
    try {
      setSavingEmail(true);
      await feedbackAPI.updateSettings({ feedbackRedirectEmail: redirectEmail });
      setSnackbar({ open: true, msg: 'Redirect email saved successfully', type: 'success' });
    } catch (err) {
      console.error('Error saving email:', err);
      setSnackbar({ open: true, msg: 'Failed to save redirect email', type: 'error' });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await feedbackAPI.delete(id);
        setSnackbar({ open: true, msg: 'Feedback deleted successfully', type: 'success' });
        fetchFeedbacks();
      } catch (err) {
        console.error('Error deleting feedback:', err);
        setSnackbar({ open: true, msg: 'Failed to delete feedback', type: 'error' });
      }
    }
  };

  const openGallery = (images) => {
    setSelectedGallery({ open: true, images: images || [], index: 0 });
  };

  const nextImage = () => {
    setSelectedGallery(prev => ({ ...prev, index: (prev.index + 1) % prev.images.length }));
  };

  const prevImage = () => {
    setSelectedGallery(prev => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }));
  };

  if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Box p={4}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">User Feedbacks</Typography>
        <Button variant="outlined" onClick={fetchFeedbacks}>Refresh</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
        <Typography variant="body1" fontWeight={500}>
          Forward Feedbacks To:
        </Typography>
        <Tooltip title="You can enter multiple email addresses separated by commas (e.g., admin1@example.com, admin2@example.com)">
          <TextField
            size="small"
            placeholder="e.g. admin1@email.com, admin2@email.com"
            value={redirectEmail}
            onChange={(e) => setRedirectEmail(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: 500 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Tooltip>
        <Button 
          variant="contained" 
          startIcon={savingEmail ? <CircularProgress size={20} color="inherit" /> : <Save />}
          onClick={handleSaveEmail}
          disabled={savingEmail}
        >
          Save
        </Button>
      </Paper>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>User Type</TableCell>
              <TableCell>User Details</TableCell>
              <TableCell>Batch Number</TableCell>
              <TableCell>Message</TableCell>
              <TableCell align="center">Images</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {feedbacks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No feedbacks found.</TableCell>
              </TableRow>
            ) : (
              feedbacks.map((fb) => (
                <TableRow key={fb._id} hover>
                  <TableCell>{new Date(fb.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={fb.userType === 'customer' ? 'Customer' : 'Applicator'} 
                      color={fb.userType === 'customer' ? 'secondary' : 'primary'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {fb.userType === 'customer' ? (
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{fb.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{fb.phone}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">{fb.applicatorId}</Typography>
                    )}
                  </TableCell>
                  <TableCell>{fb.batchNumber}</TableCell>
                  <TableCell sx={{ maxWidth: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{fb.message}</TableCell>
                  <TableCell align="center">
                    {fb.imageUrls && fb.imageUrls.length > 0 ? (
                      <Tooltip title={`View ${fb.imageUrls.length} Image(s)`}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          startIcon={<ImageIcon />}
                          onClick={() => openGallery(fb.imageUrls)}
                        >
                          {fb.imageUrls.length}
                        </Button>
                      </Tooltip>
                    ) : (fb.imageUrl ? (
                        <Tooltip title="View Image">
                          <Button 
                            variant="outlined" 
                            size="small"
                            startIcon={<ImageIcon />}
                            onClick={() => openGallery([fb.imageUrl])}
                          >
                            1
                          </Button>
                        </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">N/A</Typography>
                    ))}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(fb._id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Multiple Images Gallery Viewer Dialog */}
      <Dialog open={selectedGallery.open} onClose={() => setSelectedGallery({ open: false, images: [], index: 0 })} maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Feedback Images ({selectedGallery.images.length > 0 ? selectedGallery.index + 1 : 0} of {selectedGallery.images.length})</span>
        </DialogTitle>
        <DialogContent dividers sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          {selectedGallery.images.length > 1 && (
            <IconButton onClick={prevImage} sx={{ position: 'absolute', left: 10, zIndex: 1, bgcolor: 'rgba(255,255,255,0.7)' }}>
              <ArrowBackIos />
            </IconButton>
          )}
          
          {selectedGallery.images.length > 0 && (
            <img 
              src={selectedGallery.images[selectedGallery.index]?.startsWith('http') 
                ? selectedGallery.images[selectedGallery.index] 
                : `${API_BASE_URL.replace('/api', '')}${selectedGallery.images[selectedGallery.index]?.startsWith('/') ? '' : '/'}${selectedGallery.images[selectedGallery.index]}`
              } 
              alt="Feedback" 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }} 
            />
          )}

          {selectedGallery.images.length > 1 && (
            <IconButton onClick={nextImage} sx={{ position: 'absolute', right: 10, zIndex: 1, bgcolor: 'rgba(255,255,255,0.7)' }}>
              <ArrowForwardIos />
            </IconButton>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedGallery({ open: false, images: [], index: 0 })}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.type} variant="filled">{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FeedbacksTab;
