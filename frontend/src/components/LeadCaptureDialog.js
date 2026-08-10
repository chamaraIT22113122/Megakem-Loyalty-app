import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, CircularProgress, 
  InputAdornment
} from '@mui/material';
import { Person, Phone, Badge, AutoAwesome } from '@mui/icons-material';

const LeadCaptureDialog = ({ open, onClose, onSubmit, product, loading }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [memberId, setMemberId] = useState('');

  const handleSubmit = () => {
    onSubmit({ name, mobile, memberId });
  };

  const handleSkip = () => {
    onSubmit({ name: '', mobile: '', memberId: '' });
  };

  // Reset state when closed
  React.useEffect(() => {
    if (!open) {
      setName('');
      setMobile('');
      setMemberId('');
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : handleSkip}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
          background: 'linear-gradient(to bottom, #ffffff, #f8fafc)'
        }
      }}
    >
      <Box sx={{ p: 3, pb: 1, textAlign: 'center' }}>
        <Box 
          sx={{ 
            width: 56, height: 56, borderRadius: '50%', 
            bgcolor: 'primary.light', color: 'primary.main', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            mx: 'auto', mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <AutoAwesome fontSize="large" />
        </Box>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Unlock Exclusive Discounts & Promotions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, mb: 1 }}>
          Enter your details below to receive future offers and updates on Megakem products like the <b>{product?.name}</b>.
        </Typography>
        <Typography variant="caption" color="primary.main" fontWeight={600}>
          Already a member? Just enter your Member ID!
        </Typography>
      </Box>

      <DialogContent sx={{ px: 4, py: 2 }}>
        <TextField
          fullWidth
          label="Full Name (Optional)"
          variant="outlined"
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading || !!memberId}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment>,
          }}
        />
        <TextField
          fullWidth
          label="Mobile Number (Optional)"
          variant="outlined"
          margin="normal"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          disabled={loading || !!memberId}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Phone color="action" /></InputAdornment>,
          }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, fontWeight: 600 }}>OR</Typography>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        </Box>

        <TextField
          fullWidth
          label="Member ID (Optional)"
          variant="outlined"
          margin="normal"
          value={memberId}
          onChange={(e) => {
            setMemberId(e.target.value);
            if (e.target.value) {
              setName('');
              setMobile('');
            }
          }}
          disabled={loading || !!(name || mobile)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Badge color="primary" /></InputAdornment>,
          }}
          helperText="If you have a loyalty card, enter the ID here."
        />
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, flexDirection: 'column', gap: 1.5 }}>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          fullWidth 
          size="large"
          disabled={loading}
          sx={{ py: 1.5, borderRadius: 2, fontWeight: 800, textTransform: 'none', fontSize: '1.05rem' }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit & Continue to Shop'}
        </Button>
        <Button 
          onClick={handleSkip} 
          fullWidth 
          size="large"
          disabled={loading}
          sx={{ py: 1, color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}
        >
          Skip & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadCaptureDialog;
