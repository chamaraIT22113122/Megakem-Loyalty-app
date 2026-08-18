import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, CircularProgress, 
  InputAdornment, Zoom
} from '@mui/material';
import { Person, Phone, CardMembership, CardGiftcard, EmojiEvents } from '@mui/icons-material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Zoom ref={ref} {...props} />;
});

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
      TransitionComponent={Transition}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          background: 'linear-gradient(145deg, #ffffff 0%, #f4f7fb 100%)',
          overflow: 'hidden',
          position: 'relative'
        }
      }}
    >
      {/* Decorative top shape */}
      <Box sx={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,216,0.15) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,51,102,0.1) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }} />

      <Box sx={{ p: 4, pb: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Box 
          sx={{ 
            width: 80, height: 80, borderRadius: '50%', 
            background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)', color: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            mx: 'auto', mb: 3, boxShadow: '0 8px 25px rgba(255, 140, 0, 0.4)',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(255, 140, 0, 0.5)' },
              '70%': { boxShadow: '0 0 0 15px rgba(255, 140, 0, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(255, 140, 0, 0)' }
            }
          }}
        >
          <CardGiftcard sx={{ fontSize: 40, animation: 'bounce 2s infinite', '@keyframes bounce': { '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-8px)' }, '60%': { transform: 'translateY(-4px)' } } }} />
        </Box>
        <Typography variant="h4" fontWeight={900} gutterBottom sx={{ background: 'linear-gradient(90deg, #FF8C00 0%, #FF4500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Claim Your Rewards & Offers!
        </Typography>
        
        <Box sx={{ bgcolor: '#FFFBE6', border: '1px solid #FFE58F', borderRadius: 2, p: 1.5, mb: 3, display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
          <EmojiEvents sx={{ color: '#FAAD14', fontSize: 28 }} />
          <Typography variant="body2" fontWeight={700} color="#D46B08" textAlign="left" sx={{ lineHeight: 1.3 }}>
            Earn points on every purchase and <br /> unlock exclusive discounts!
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ px: { xs: 0, sm: 2 }, mb: 1, lineHeight: 1.5 }}>
          Enter your details below to get special offers on <b style={{ color: '#FF8C00' }}>{product?.name}</b> and join the Megakem family.
        </Typography>
      </Box>

      <DialogContent sx={{ px: { xs: 3, sm: 6 }, py: 2, position: 'relative', zIndex: 1, overflowX: 'hidden' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Full Name (Optional)"
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading || !!memberId}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Person sx={{ color: name ? 'primary.main' : 'action.active' }} /></InputAdornment>,
              sx: { borderRadius: '12px', bgcolor: 'white', '&.Mui-focused': { boxShadow: '0 4px 15px rgba(0, 180, 216, 0.15)' }, transition: 'all 0.3s' }
            }}
          />
          <TextField
            fullWidth
            label="Mobile Number (Optional)"
            variant="outlined"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            disabled={loading || !!memberId}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Phone sx={{ color: mobile ? 'primary.main' : 'action.active' }} /></InputAdornment>,
              sx: { borderRadius: '12px', bgcolor: 'white', '&.Mui-focused': { boxShadow: '0 4px 15px rgba(0, 180, 216, 0.15)' }, transition: 'all 0.3s' }
            }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
            <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%)' }} />
            <Typography variant="caption" sx={{ px: 2, fontWeight: 700, color: 'text.disabled', letterSpacing: 1 }}>OR</Typography>
            <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%)' }} />
          </Box>

          <TextField
            fullWidth
            label="Loyalty Member ID (Optional)"
            variant="outlined"
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
              startAdornment: <InputAdornment position="start"><CardMembership sx={{ color: memberId ? 'primary.main' : 'action.active' }} /></InputAdornment>,
              sx: { borderRadius: '12px', bgcolor: 'white', '&.Mui-focused': { boxShadow: '0 4px 15px rgba(0, 180, 216, 0.15)' }, transition: 'all 0.3s' }
            }}
            helperText="Already have a card? Just enter your ID!"
            FormHelperTextProps={{ sx: { color: 'primary.main', fontWeight: 600, mx: 1 } }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 3, sm: 6 }, pb: 5, pt: 2, flexDirection: 'column', gap: 2, position: 'relative', zIndex: 1 }}>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          fullWidth 
          size="large"
          disabled={loading}
          sx={{ 
            py: 1.8, 
            borderRadius: '12px', 
            fontWeight: 800, 
            textTransform: 'none', 
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #003366 0%, #00B4D8 100%)',
            boxShadow: '0 8px 25px rgba(0, 180, 216, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 30px rgba(0, 180, 216, 0.6)',
              background: 'linear-gradient(135deg, #002244 0%, #0096B8 100%)'
            }
          }}
        >
          {loading ? <CircularProgress size={28} sx={{ color: 'white' }} /> : 'Submit & Continue'}
        </Button>
        <Button 
          onClick={handleSkip} 
          fullWidth 
          size="large"
          disabled={loading}
          disableRipple
          sx={{ 
            py: 1, 
            color: 'text.secondary', 
            fontWeight: 700, 
            textTransform: 'none',
            fontSize: '0.95rem',
            '&:hover': { bgcolor: 'transparent', color: 'primary.main', textDecoration: 'underline' }
          }}
        >
          Skip & Continue to Product
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadCaptureDialog;
