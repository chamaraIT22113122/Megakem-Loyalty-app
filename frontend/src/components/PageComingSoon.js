import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Button, Paper, Chip, Grid
} from '@mui/material';
import { 
  AutoAwesome, ArrowBack, CheckCircle, AccessTime, Build
} from '@mui/icons-material';
import megakemBrandLogo from '../assets/Megakem  Rewards logo .png';

const PageComingSoon = ({ 
  config = {}, 
  onBack,
  isPreview = false 
}) => {
  const {
    title = 'Exciting Feature Coming Soon!',
    subtitle = 'We are working hard to build something amazing for you. This feature will be available shortly.',
    launchDate = '',
    featuresList = ['Enhanced Performance', 'Real-Time Insights', 'Seamless Integration'],
    buttonText = 'Return to Home',
    badgeText = 'UNDER DEVELOPMENT'
  } = config;

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

  return (
    <Box 
      sx={{ 
        minHeight: isPreview ? 480 : '100vh',
        width: '100%',
        background: 'radial-gradient(ellipse at 60% 10%, #1a2744 0%, #0f172a 45%, #020817 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decorative glow circles */}
      <Box sx={{ position: 'absolute', top: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,51,102,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: -80, right: -80, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(164,210,51,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: '40%', right: '5%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,216,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Animated sparkle dots */}
      {[...Array(6)].map((_, i) => (
        <Box key={i} sx={{
          position: 'absolute',
          width: i % 2 === 0 ? 4 : 6,
          height: i % 2 === 0 ? 4 : 6,
          borderRadius: '50%',
          bgcolor: i % 3 === 0 ? '#A4D233' : i % 3 === 1 ? '#00B4D8' : '#ffffff',
          opacity: 0.4,
          top: `${10 + i * 14}%`,
          left: i % 2 === 0 ? `${8 + i * 5}%` : `${75 + i * 4}%`,
          animation: `pulse-dot-${i} ${2 + i * 0.4}s ease-in-out infinite alternate`,
          '@keyframes pulse-dot-0': { from: { opacity: 0.2 }, to: { opacity: 0.7 } },
          '@keyframes pulse-dot-1': { from: { opacity: 0.1 }, to: { opacity: 0.6 } },
          '@keyframes pulse-dot-2': { from: { opacity: 0.3 }, to: { opacity: 0.8 } },
          '@keyframes pulse-dot-3': { from: { opacity: 0.15 }, to: { opacity: 0.55 } },
          '@keyframes pulse-dot-4': { from: { opacity: 0.2 }, to: { opacity: 0.65 } },
          '@keyframes pulse-dot-5': { from: { opacity: 0.1 }, to: { opacity: 0.5 } },
          pointerEvents: 'none'
        }} />
      ))}

      <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>

        {/* Megakem Logo */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 1.5, sm: 2 },
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,51,102,0.3) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(0,51,102,0.3)',
            backdropFilter: 'blur(12px)'
          }}>
            <img 
              src={megakemBrandLogo} 
              alt="Megakem Logo" 
              style={{ 
                height: isPreview ? 44 : 60, 
                width: 'auto', 
                objectFit: 'contain',
                filter: 'brightness(1.1) drop-shadow(0 0 8px rgba(164,210,51,0.3))'
              }} 
            />
          </Box>
        </Box>

        {/* Status Badge */}
        <Box sx={{ mb: 2.5 }}>
          <Chip 
            icon={<Build style={{ color: '#A4D233', fontSize: 14 }} />} 
            label={badgeText} 
            sx={{ 
              bgcolor: 'rgba(164,210,51,0.1)', 
              color: '#A4D233', 
              fontWeight: 800, 
              letterSpacing: 1.5,
              fontSize: '0.72rem',
              border: '1px solid rgba(164,210,51,0.3)',
              px: 1,
              py: 0.5,
              '& .MuiChip-icon': { color: '#A4D233' }
            }} 
          />
        </Box>

        {/* Main Title */}
        <Typography 
          variant="h3" 
          fontWeight={900} 
          sx={{ 
            fontSize: { xs: '1.6rem', sm: '2.6rem', md: '3rem' },
            background: 'linear-gradient(135deg, #ffffff 0%, #A4D233 50%, #00B4D8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            lineHeight: 1.2,
            textShadow: 'none'
          }}
        >
          {title}
        </Typography>

        {/* Subtitle */}
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#94a3b8', 
            maxWidth: 580, 
            mx: 'auto', 
            mb: 4, 
            fontSize: { xs: '0.9rem', sm: '1.05rem' },
            lineHeight: 1.7
          }}
        >
          {subtitle}
        </Typography>

        {/* Divider line with glow */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 4 }}>
          <Box sx={{ height: '1px', width: 60, background: 'linear-gradient(90deg, transparent, rgba(164,210,51,0.5))' }} />
          <AutoAwesome sx={{ fontSize: 16, color: '#A4D233', opacity: 0.8 }} />
          <Box sx={{ height: '1px', width: 60, background: 'linear-gradient(90deg, rgba(164,210,51,0.5), transparent)' }} />
        </Box>

        {/* Countdown Timer */}
        {launchDate && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="caption" sx={{ color: '#00B4D8', fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', mb: 2, display: 'block' }}>
              <AccessTime sx={{ fontSize: 13, verticalAlign: 'middle', mr: 0.5 }} /> Launching In
            </Typography>
            <Grid container spacing={{ xs: 1, sm: 2 }} justifyContent="center" sx={{ maxWidth: 440, mx: 'auto' }}>
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
                      p: { xs: 1, sm: 1.5 }, 
                      borderRadius: 3, 
                      bgcolor: 'rgba(30, 41, 59, 0.8)', 
                      border: '1px solid rgba(164,210,51,0.2)',
                      backdropFilter: 'blur(10px)',
                      textAlign: 'center',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                    }}
                  >
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#A4D233', fontSize: { xs: '1.3rem', sm: '2rem' }, lineHeight: 1.1 }}>
                      {String(item.val).padStart(2, '0')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Features list pills */}
        {Array.isArray(featuresList) && featuresList.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 5, maxWidth: 620, mx: 'auto' }}>
            {featuresList.map((feat, idx) => (
              <Chip 
                key={idx}
                icon={<CheckCircle style={{ color: '#A4D233', fontSize: 14 }} />}
                label={feat}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(164,210,51,0.07)', 
                  color: '#cbd5e1', 
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  border: '1px solid rgba(164,210,51,0.18)',
                  py: 0.5,
                  '&:hover': { bgcolor: 'rgba(164,210,51,0.12)' }
                }}
              />
            ))}
          </Box>
        )}

        {/* Megakem Branding Bar */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          mb: 4,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(0,51,102,0.25) 0%, rgba(0,180,216,0.1) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          maxWidth: 460,
          mx: 'auto'
        }}>
          <img 
            src={megakemBrandLogo} 
            alt="Megakem" 
            style={{ height: 22, width: 'auto', opacity: 0.9 }} 
          />
          <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(255,255,255,0.15)' }} />
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>
            Megakem Loyalty & Rewards Platform
          </Typography>
        </Box>

        {/* Back Button */}
        {onBack && (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onBack}
            sx={{
              color: '#cbd5e1',
              borderColor: 'rgba(255,255,255,0.18)',
              borderRadius: 3,
              px: { xs: 3, sm: 4 },
              py: 1.2,
              fontWeight: 700,
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              backdropFilter: 'blur(8px)',
              background: 'rgba(255,255,255,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#A4D233',
                color: '#A4D233',
                bgcolor: 'rgba(164,210,51,0.06)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(164,210,51,0.15)'
              }
            }}
          >
            {buttonText}
          </Button>
        )}

        {/* Footer branding */}
        {!isPreview && (
          <Typography variant="caption" sx={{ color: '#1e293b', mt: 6, display: 'block', fontSize: '0.7rem', userSelect: 'none' }}>
            © {new Date().getFullYear()} Megakem Lanka (Pvt) Ltd. All rights reserved.
          </Typography>
        )}
      </Container>
    </Box>
  );
};

export default PageComingSoon;
