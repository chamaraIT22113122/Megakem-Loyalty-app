import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Typography, IconButton, CircularProgress,
  Snackbar, Alert, Divider
} from '@mui/material';
import { 
  Close, PhotoCamera, QrCodeScanner, CloudUpload 
} from '@mui/icons-material';
import { feedbackAPI, uploadAPI } from '../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';

const FeedbackDialog = ({ open, onClose, defaultApplicatorId, defaultRole }) => {
  const { t } = useTranslation();
  const [applicatorId, setApplicatorId] = useState(defaultApplicatorId || '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [message, setMessage] = useState('');
  
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', type: 'success' });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setApplicatorId(defaultApplicatorId || '');
      setName('');
      setPhone('');
      setBatchNumber('');
      setMessage('');
      setImageFiles([]);
      setImagePreviews([]);
      setScanning(false);
    }
  }, [open, defaultApplicatorId]);

  const scannerRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      const html5QrCode = new Html5Qrcode("feedback-qr-reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 12,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          try {
            const url = new URL(decodedText);
            const batch = url.searchParams.get('b') || url.searchParams.get('batch') || url.searchParams.get('batchNo');
            
            if (batch) {
              setBatchNumber(batch);
              setSnackbar({ open: true, msg: 'Batch number scanned successfully!', type: 'success' });
            } else {
              setBatchNumber(decodedText);
              setSnackbar({ open: true, msg: 'QR scanned!', type: 'info' });
            }
          } catch (e) {
            setBatchNumber(decodedText);
            setSnackbar({ open: true, msg: 'QR scanned!', type: 'info' });
          }
          
          if (scannerRef.current) {
            const instance = scannerRef.current;
            scannerRef.current = null;
            try {
              if (instance.isScanning) {
                instance.stop().then(() => {
                  try { instance.clear(); } catch(e) {}
                  setScanning(false);
                }).catch(() => { setScanning(false); });
              } else {
                try { instance.clear(); } catch(e) {}
                setScanning(false);
              }
            } catch(e) { setScanning(false); }
          } else {
             setScanning(false);
          }
        },
        (error) => {
          // Ignored, continuous scanning
        }
      ).catch((err) => {
        console.error("Camera access failed", err);
        setSnackbar({ open: true, msg: 'Camera access denied or unavailable', type: 'error' });
        setScanning(false);
      });
    }

    return () => {
      if (scannerRef.current) {
        const instance = scannerRef.current;
        scannerRef.current = null;
        try {
          if (instance.isScanning) {
            instance.stop().then(() => {
              try { instance.clear(); } catch(e) {}
            }).catch(() => {});
          } else {
            try { instance.clear(); } catch(e) {}
          }
        } catch (e) {}
      }
    };
  }, [scanning]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Limit to 5 images max
      if (imageFiles.length + newFiles.length > 5) {
        setSnackbar({ open: true, msg: 'Maximum 5 images allowed.', type: 'warning' });
        return;
      }
      
      setImageFiles(prev => [...prev, ...newFiles]);
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const isCustomerInfoFilled = !!(name || phone);
  const isApplicatorInfoFilled = !!applicatorId;

  const isFormValid = () => {
    if (!message) return false;
    // Must have complete Customer Info OR complete Applicator Info
    const hasCompleteCustomerInfo = !!(name && phone);
    const hasCompleteApplicatorInfo = !!applicatorId;
    
    if (!hasCompleteCustomerInfo && !hasCompleteApplicatorInfo) return false;
    
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setSnackbar({ open: true, msg: 'Please provide either Name & Phone OR Applicator ID, along with the required fields.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Upload all images in parallel for much faster submission
      const uploadPromises = imageFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const uploadRes = await uploadAPI.uploadImage(formData);
        if (uploadRes.data.success) {
          return uploadRes.data.data.url;
        } else {
          throw new Error('Image upload failed');
        }
      });
      let imageUrls = await Promise.all(uploadPromises);

      const finalUserType = applicatorId ? 'applicator' : 'customer';

      await feedbackAPI.create({
        userType: finalUserType,
        name: finalUserType === 'customer' ? name : undefined,
        phone: finalUserType === 'customer' ? phone : undefined,
        applicatorId: finalUserType === 'applicator' ? applicatorId : undefined,
        role: defaultRole || 'applicator',
        batchNumber,
        message,
        imageUrls
      });

      setSnackbar({ open: true, msg: 'Feedback submitted successfully!', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Feedback submit error:', error);
      setSnackbar({ open: true, msg: 'Failed to submit feedback. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">{t('submitFeedback')}</Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            
            <Typography variant="subtitle2" color="text.secondary">
              {t('feedbackInstruction')}
            </Typography>

            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
              <Typography variant="body2" fontWeight="bold" mb={1} color={isApplicatorInfoFilled ? 'text.disabled' : 'text.primary'}>
                {t('customerDetails')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label={t('fullName')}
                  variant="outlined"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isApplicatorInfoFilled}
                  required={!isApplicatorInfoFilled}
                />
                <TextField
                  label={t('phoneNumber')}
                  variant="outlined"
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isApplicatorInfoFilled}
                  required={!isApplicatorInfoFilled}
                />
              </Box>
            </Box>

            <Divider>OR</Divider>

            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
              <Typography variant="body2" fontWeight="bold" mb={1} color={isCustomerInfoFilled ? 'text.disabled' : 'text.primary'}>
                {t('applicatorDetails')}
              </Typography>
              <TextField
                label={t('applicatorIdNum')}
                variant="outlined"
                fullWidth
                value={applicatorId}
                onChange={(e) => setApplicatorId(e.target.value)}
                placeholder="e.g. MA000123"
                disabled={isCustomerInfoFilled}
                required={!isCustomerInfoFilled}
                autoComplete="off"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
              <TextField
                label={t('productBatchOpt')}
                variant="outlined"
                fullWidth
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
              <Button 
                variant="contained" 
                color={scanning ? "error" : "primary"}
                onClick={() => setScanning(!scanning)}
                sx={{ minWidth: '48px', height: '56px' }}
              >
                {scanning ? <Close /> : <QrCodeScanner />}
              </Button>
            </Box>

            {scanning && (
              <Box id="feedback-qr-reader" sx={{ width: '100%', mt: 1 }} />
            )}

            <TextField
              label={t('messageFeedback')}
              variant="outlined"
              fullWidth
              required
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('describeFeedback')}
            />

            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="feedback-image-upload"
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
                onClick={() => fileInputRef.current.click()}
                fullWidth
              >
                {t('uploadPhotos')}
              </Button>
              
              {imagePreviews.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {imagePreviews.map((preview, idx) => (
                    <Box key={idx} sx={{ position: 'relative', width: 'fit-content' }}>
                      <img src={preview} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ccc' }} />
                      <IconButton 
                        size="small" 
                        sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, width: 20, height: 20 }}
                        onClick={() => removeImage(idx)}
                      >
                        <Close sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
          <Button onClick={onClose} variant="outlined" color="inherit">
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading || !isFormValid()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
          >
            {t('submitFeedback')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.type} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FeedbackDialog;
