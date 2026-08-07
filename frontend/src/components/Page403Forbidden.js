import React from 'react';
import { Box, Paper, Typography, Button, Chip, Container, Divider, Grid } from '@mui/material';
import { Lock, Security, VpnKey, Shield, Home, AdminPanelSettings, Feedback, Phone, Email } from '@mui/icons-material';

const Page403Forbidden = ({ 
  pageConfig = {}, 
  currentUserRole = 'Guest', 
  onNavigateHome, 
  onNavigateAdminLogin, 
  onRequestPermission 
}) => {
  const title = pageConfig.title || '403 — Access Restricted';
  const message = pageConfig.message || 'You do not have permission to access this page or feature. Contact your administrator if you require access.';
  const supportEmail = pageConfig.supportEmail || 'support@megakem.lk';
  const supportPhone = pageConfig.supportPhone || '+94 11 234 5678';
  const showRequestButton = pageConfig.showRequestButton !== false;
  const showRoleGuide = pageConfig.showRoleGuide !== false;
  const iconType = pageConfig.iconType || 'lock';

  const IconComponent = iconType === 'shield' ? Shield : iconType === 'key' ? VpnKey : iconType === 'security' ? Security : Lock;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 8 }, animation: 'fadeIn 0.4s ease-in' }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 3, sm: 5 }, 
          borderRadius: 4, 
          bgcolor: 'background.paper',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 45px rgba(0, 51, 102, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Decorative Header Accent */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }} />

        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box 
              sx={{ 
                width: 75, 
                height: 75, 
                borderRadius: '50%', 
                bgcolor: '#fee2e2', 
                color: '#dc2626', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mx: { xs: 'auto', md: '0' }, 
                mb: 2.5,
                boxShadow: '0 8px 25px rgba(220, 38, 38, 0.2)'
              }}
            >
              <IconComponent sx={{ fontSize: 42 }} />
            </Box>

            <Chip 
              label={`Current Role: ${currentUserRole}`} 
              size="small" 
              color="error" 
              variant="outlined" 
              sx={{ fontWeight: 800, mb: 1.5, px: 1 }} 
            />

            <Typography variant="h4" fontWeight="900" sx={{ color: '#003366', mb: 1.5, fontSize: { xs: '1.6rem', sm: '2.2rem' } }}>
              {title}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.6, mb: 3 }}>
              {message}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<Home />} 
                onClick={onNavigateHome}
                sx={{ 
                  borderRadius: 3, 
                  px: 3,
                  py: 1.2, 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #003366 0%, #005F73 100%)', 
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(0,51,102,0.3)'
                }}
              >
                Return to Homepage
              </Button>

              {showRequestButton && onRequestPermission && (
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="large" 
                  startIcon={<Feedback />} 
                  onClick={onRequestPermission}
                  sx={{ borderRadius: 3, py: 1.1, px: 3, fontWeight: 800 }}
                >
                  Request Permission
                </Button>
              )}

              {onNavigateAdminLogin && (
                <Button 
                  variant="text" 
                  color="secondary" 
                  size="small" 
                  startIcon={<AdminPanelSettings />} 
                  onClick={onNavigateAdminLogin}
                  sx={{ fontWeight: 700 }}
                >
                  Switch Account
                </Button>
              )}
            </Box>
          </Grid>

          {/* RIGHT SIDE PANEL: CONTACT & PERMISSION GUIDE */}
          <Grid item xs={12} md={5}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                bgcolor: '#f8fafc', 
                borderRadius: 3.5, 
                border: '1px solid #e2e8f0' 
              }}
            >
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#003366', mb: 2 }}>
                💬 Admin Help & Contacts
              </Typography>

              <Box sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Email color="primary" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Email Support</Typography>
                </Box>
                <Typography variant="body2" fontWeight={800} color="#003366">
                  <a href={`mailto:${supportEmail}`} style={{ color: '#005F73', textDecoration: 'none' }}>{supportEmail}</a>
                </Typography>
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Phone color="primary" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Phone Support</Typography>
                </Box>
                <Typography variant="body2" fontWeight={800} color="#003366">
                  {supportPhone}
                </Typography>
              </Box>

              {showRoleGuide && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 1 }}>
                    🔐 Role Access Matrix:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <Typography variant="caption" color="text.secondary">Main Admin / Co-Admin:</Typography>
                      <Typography variant="caption" fontWeight={800} color="success.main">Full Access</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <Typography variant="caption" color="text.secondary">Applicator / Hardware:</Typography>
                      <Typography variant="caption" fontWeight={800} color="error.main">Restricted</Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Page403Forbidden;
