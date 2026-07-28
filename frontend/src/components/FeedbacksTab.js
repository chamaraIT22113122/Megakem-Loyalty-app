import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  CircularProgress, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Tooltip, Chip, TextField, InputAdornment
} from '@mui/material';
import { Delete, Image as ImageIcon, ArrowBackIos, ArrowForwardIos, Save, Email, PictureAsPdf } from '@mui/icons-material';
import { feedbackAPI, API_BASE_URL } from '../services/api';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// Removed import of pdfTemplateUrl from assets

const FeedbacksTab = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', type: 'success' });
  const [selectedGallery, setSelectedGallery] = useState({ open: false, images: [], index: 0 });
  const [redirectEmail, setRedirectEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [pdfPreview, setPdfPreview] = useState({ open: false, url: '', filename: '' });

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

  const handleDownloadPDF = async (feedback) => {
    try {
      setSnackbar({ open: true, msg: 'Generating PDF...', type: 'info' });
      
      // Load template from public folder (v2 for cache busting)
      const pdfTemplateUrl = process.env.PUBLIC_URL + '/Megakem_Rewards_feedback_Template_v2.pdf';
      const templateBytes = await fetch(pdfTemplateUrl).then(res => {
        if (!res.ok) throw new Error(`Template fetch failed with status: ${res.status}`);
        return res.arrayBuffer();
      });
      const pdfDoc = await PDFDocument.load(templateBytes);
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const pages = pdfDoc.getPages();
      let page = pages[0];
      const { width, height } = page.getSize();
      
      let currentY = height - 160; // Start drawing below the header
      const marginX = 50;
      const lineHeight = 18;
      
      const drawText = (p, text, x, y, size = 11, isBold = false) => {
        p.drawText(text, { x, y, size, font: isBold ? fontBold : font, color: rgb(0.2, 0.2, 0.2) });
      };

      // Header
      drawText(page, 'Complaint / Feedback Report', marginX, currentY, 16, true);
      currentY -= 30;

      // Details
      drawText(page, 'Complaint No:', marginX, currentY, 11, true);
      drawText(page, feedback.complaintNumber || 'N/A', marginX + 120, currentY, 11);
      currentY -= lineHeight;
      
      drawText(page, 'Date:', marginX, currentY, 11, true);
      drawText(page, new Date(feedback.createdAt).toLocaleString(), marginX + 120, currentY, 11);
      currentY -= lineHeight;
      
      drawText(page, 'User Type:', marginX, currentY, 11, true);
      drawText(page, feedback.userType === 'customer' ? 'Customer' : 'Applicator', marginX + 120, currentY, 11);
      currentY -= lineHeight;
      
      drawText(page, 'Batch Number:', marginX, currentY, 11, true);
      drawText(page, feedback.batchNumber || 'N/A', marginX + 120, currentY, 11);
      currentY -= lineHeight;
      
      if (feedback.userType === 'customer') {
        drawText(page, 'Customer Name:', marginX, currentY, 11, true);
        drawText(page, feedback.name || 'N/A', marginX + 120, currentY, 11);
        currentY -= lineHeight;
        
        drawText(page, 'Customer Phone:', marginX, currentY, 11, true);
        drawText(page, feedback.phone || 'N/A', marginX + 120, currentY, 11);
        currentY -= lineHeight;
      } else {
        drawText(page, 'Applicator ID:', marginX, currentY, 11, true);
        drawText(page, feedback.applicatorId || 'N/A', marginX + 120, currentY, 11);
        currentY -= lineHeight;
      }
      
      currentY -= 15;
      drawText(page, 'Message / Details:', marginX, currentY, 12, true);
      currentY -= lineHeight;
      
      // Simple word wrap
      const message = feedback.message || 'No message provided';
      const words = message.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const testWidth = font.widthOfTextAtSize(testLine, 11);
        if (testWidth > width - marginX * 2 && n > 0) {
          drawText(page, line, marginX, currentY, 11);
          line = words[n] + ' ';
          currentY -= lineHeight;
        } else {
          line = testLine;
        }
      }
      drawText(page, line, marginX, currentY, 11);
      currentY -= 30;
      
      // Images
      const imagesToLoad = feedback.imageUrls && feedback.imageUrls.length > 0 ? feedback.imageUrls : (feedback.imageUrl ? [feedback.imageUrl] : []);
      
      if (imagesToLoad.length > 0) {
        drawText(page, 'Attached Images:', marginX, currentY, 12, true);
        currentY -= lineHeight;
        
        for (const src of imagesToLoad) {
          const normalizedSrc = src.replace(/\\/g, '/');
          const isExternal = normalizedSrc.startsWith('http');
          const originalImgUrl = isExternal ? normalizedSrc : `${API_BASE_URL.replace(/\/api$/, '')}${normalizedSrc.startsWith('/') ? '' : '/'}${normalizedSrc}`;
          
          // Proxy external URLs (like Google Drive) to bypass CORS when fetching bytes
          const fetchUrl = isExternal && !normalizedSrc.includes(API_BASE_URL)
            ? `${API_BASE_URL}/upload/proxy?url=${encodeURIComponent(originalImgUrl)}`
            : originalImgUrl;

          try {
            const res = await fetch(fetchUrl);
            if (!res.ok) {
              console.warn(`Failed to load image for PDF. Status: ${res.status}`);
              throw new Error(`HTTP Error ${res.status}`);
            }
            const imgBytes = await res.arrayBuffer();
            
            let pdfImage;
            if (originalImgUrl.toLowerCase().includes('.png')) {
              pdfImage = await pdfDoc.embedPng(imgBytes);
            } else {
              pdfImage = await pdfDoc.embedJpg(imgBytes);
            }
            
            const imgDims = pdfImage.scaleToFit(width - marginX * 2, 250);
            
            if (currentY - imgDims.height < 50) {
              // Add new page using template
              const [newPage] = await pdfDoc.copyPages(pdfDoc, [0]);
              pdfDoc.addPage(newPage);
              page = newPage;
              currentY = height - 150; // reset Y for new page
            }
            
            page.drawImage(pdfImage, {
              x: marginX,
              y: currentY - imgDims.height,
              width: imgDims.width,
              height: imgDims.height,
            });
            
            currentY -= (imgDims.height + 20);
          } catch (imgErr) {
            console.error('Failed to embed image in PDF:', imgErr);
            drawText(page, '(Image could not be loaded)', marginX, currentY, 10);
            currentY -= lineHeight;
          }
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfPreview({ open: true, url, filename: `Complaint_${feedback.complaintNumber || 'Report'}.pdf` });
      
      setSnackbar({ open: true, msg: 'PDF Preview Generated', type: 'success' });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setSnackbar({ open: true, msg: 'Failed to generate PDF', type: 'error' });
    }
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
              <TableCell>Complaint No</TableCell>
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
                <TableCell colSpan={8} align="center">No feedbacks found.</TableCell>
              </TableRow>
            ) : (
              feedbacks.map((fb) => (
                <TableRow key={fb._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {fb.complaintNumber || 'N/A'}
                    </Typography>
                  </TableCell>
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
                    <Tooltip title="Download PDF">
                      <IconButton color="primary" onClick={() => handleDownloadPDF(fb)}>
                        <PictureAsPdf />
                      </IconButton>
                    </Tooltip>
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
              src={(() => {
                const src = selectedGallery.images[selectedGallery.index];
                if (!src) return '';
                const normalizedSrc = src.replace(/\\/g, '/');
                const isExternal = normalizedSrc.startsWith('http');
                const originalImgUrl = isExternal ? normalizedSrc : `${API_BASE_URL.replace(/\/api$/, '')}${normalizedSrc.startsWith('/') ? '' : '/'}${normalizedSrc}`;
                return isExternal && !normalizedSrc.includes(API_BASE_URL)
                  ? `${API_BASE_URL}/upload/proxy?url=${encodeURIComponent(originalImgUrl)}`
                  : originalImgUrl;
              })()} 
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

      <Dialog 
        open={pdfPreview.open} 
        onClose={() => setPdfPreview({ open: false, url: '', filename: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>PDF Preview</DialogTitle>
        <DialogContent dividers sx={{ height: '70vh', p: 0 }}>
          {pdfPreview.url && (
            <iframe 
              src={pdfPreview.url} 
              width="100%" 
              height="100%" 
              style={{ border: 'none' }} 
              title="PDF Preview"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdfPreview({ open: false, url: '', filename: '' })}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              const link = document.createElement('a');
              link.href = pdfPreview.url;
              link.download = pdfPreview.filename;
              link.click();
              setSnackbar({ open: true, msg: 'PDF Downloaded Successfully', type: 'success' });
            }}
          >
            Download PDF
          </Button>
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
