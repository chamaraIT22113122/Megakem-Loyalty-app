import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Button, Paper, Chip, 
  TextField, InputAdornment, Grid 
} from '@mui/material';
import { 
  RocketLaunch, AutoAwesome, Email, 
  ArrowBack, CheckCircle, AccessTime 
} from '@mui/icons-material';

const PageComingSoon = ({ 
  config = {}, 
  onBack,
  isAdmin = false,
  onAdminBypass,
  isPreview = false 
}) => {
  const {
    title = 'Exciting Feature Coming Soon!',
    subtitle = 'We are working hard to build something amazing. This feature will be available shortly.',
    launchDate = '',
    featuresList = ['Enhanced Performance', 'Real-Time Insights', 'Seamless Integration'],
    buttonText = 'Return to Home',
    badgeText = 'UNDER DEVELOPMENT'
  } = config;

  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Calculate live countdown timer if launchDate is provided
  useEffect(() => {
    if (!launchDate) return;
    const calculateTime = () => {
      const target = new Date(launchDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [launchDate]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (subscribedEmail) {
      setIsSubscribed(true);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: isPreview ? 500 : '100vh',
        width: '100%',
        bgcolor: '#0b1329',
        background: 'radial-gradient(circle at 50% 20%, #1e293b 0%, #0f172a 60%, #030712 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        p: { xs: 2, sm: 4 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background glow circles */}
      <Box sx={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 180, 216, 0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 200, 83, 0.12) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      <Container maxWidth="md" sx={{ relative: 2, textAlign: 'center', my: 'auto' }}>
        {/* Top Rocket Icon Badge */}
        <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <Box 
            sx={{ 
              p: 2, 
              borderRadius: '24px', 
              background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.2) 0%, rgba(0, 51, 102, 0.4) 100%)',
              border: '1px solid rgba(0, 180, 216, 0.3)',
              boxShadow: '0 0 30px rgba(0, 180, 216, 0.25)',
              display: 'flex'
            }}
          >
            <RocketLaunch sx={{ fontSize: { xs: 40, sm: 54 }, color: '#00B4D8' }} />
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip 
            icon={<AutoAwesome style={{ color: '#00E676', fontSize: 16 }} />} 
            label={badgeText} 
            sx={{ 
              bgcolor: 'rgba(0, 230, 118, 0.12)', 
              color: '#00E676', 
              fontWeight: 800, 
              letterSpacing: 1, 
              border: '1px solid rgba(0, 230, 118, 0.3)',
              px: 1,
              py: 0.5
            }} 
          />
        </Box>

        {/* Main Title & Subtitle */}
        <Typography 
          variant="h3" 
          fontWeight={900} 
          sx={{ 
            fontSize: { xs: '1.8rem', sm: '2.8rem' },
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            lineHeight: 1.2
          }}
        >
          {title}
        </Typography>

        <Typography 
          variant="body1" 
          sx={{ 
            color: '#94a3b8', 
            maxWidth: 640, 
            mx: 'auto', 
            mb: 4, 
            fontSize: { xs: '0.95rem', sm: '1.1rem' },
            lineHeight: 1.6 
          }}
        >
          {subtitle}
        </Typography>

        {/* Countdown Timer (if launchDate set) */}
        {launchDate && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="caption" sx={{ color: '#00B4D8', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
              <AccessTime sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} /> Target Launch Countdown
            </Typography>
            <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 500, mx: 'auto' }}>
              {[
                { label: 'Days', val: timeLeft.days },
                { label: 'Hours', val: timeLeft.hours },
                { label: 'Minutes', val: timeLeft.minutes },
                { label: 'Seconds', val: timeLeft.seconds }
              ].map((item, idx) => (
                <Grid item xs={3} key={idx}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 3, 
                      bgcolor: 'rgba(30, 41, 59, 0.7)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#38ef7d', fontSize: { xs: '1.4rem', sm: '2rem' } }}>
                      {String(item.val).padStart(2, '0')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Feature Highlights Pills */}
        {Array.isArray(featuresList) && featuresList.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mb: 4, maxWidth: 650, mx: 'auto' }}>
            {featuresList.map((feat, idx) => (
              <Chip 
                key={idx}
                icon={<CheckCircle style={{ color: '#00B4D8', fontSize: 16 }} />}
                label={feat}
                sx={{ 
                  bgcolor: 'rgba(15, 23, 42, 0.8)', 
                  color: '#e2e8f0', 
                  fontWeight: 600, 
                  border: '1px solid rgba(255,255,255,0.08)',
                  py: 0.5
                }}
              />
            ))}
          </Box>
        )}

        {/* Notify Me / Contact Form */}
        <Box sx={{ maxWidth: 450, mx: 'auto', mb: 4 }}>
          {!isSubscribed ? (
            <form onSubmit={handleSubscribe}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter email for updates..."
                  value={subscribedEmail}
                  onChange={(e) => setSubscribedEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#94a3b8', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    sx: { 
                      bgcolor: 'rgba(15, 23, 42, 0.9)', 
                      color: 'white', 
                      borderRadius: 2.5,
                      border: '1px solid rgba(255,255,255,0.15)',
                      fontSize: '0.9rem'
                    }
                  }}
                />
                <Button 
                  type="submit"
                  variant="contained" 
                  sx={{ 
                    borderRadius: 2.5, 
                    fontWeight: 800, 
                    whiteSpace: 'nowrap',
                    px: 3,
                    background: 'linear-gradient(135deg, #003366 0%, #00B4D8 100%)',
                    boxShadow: '0 4px 15px rgba(0, 180, 216, 0.3)'
                  }}
                >
                  Notify Me
                </Button>
              </Box>
            </form>
          ) : (
            <Paper sx={{ p: 1.5, bgcolor: 'rgba(0, 200, 83, 0.15)', border: '1px solid rgba(0, 200, 83, 0.3)', borderRadius: 2.5, color: '#00E676' }}>
              <Typography variant="body2" fontWeight={700}>
                ✅ Thanks! We will notify you when this page goes live.
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Action Buttons */}
        {onBack && (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onBack}
            sx={{
              color: '#cbd5e1',
              borderColor: 'rgba(255,255,255,0.2)',
              borderRadius: 2.5,
              px: 3,
              py: 1,
              fontWeight: 700,
              '&:hover': {
                borderColor: '#00B4D8',
                color: '#00B4D8',
                bgcolor: 'rgba(0, 180, 216, 0.08)'
              }
            }}
          >
            {buttonText}
          </Button>
        )}
      </Container>
    </Box>
  );
};

export default PageComingSoon;
