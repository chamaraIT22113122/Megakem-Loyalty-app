import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Chip, Button, Dialog, Container } from '@mui/material';
import { Warning, Info, Close, Timer, Build, Launch, Lock } from '@mui/icons-material';

const MaintenanceNoticeBanner = ({ maintenanceNotice, socket, userRole = 'guest', currentView = '', isPreview = false }) => {
  const [notice, setNotice] = useState(maintenanceNotice || null);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    setNotice(maintenanceNotice);
  }, [maintenanceNotice]);

  useEffect(() => {
    if (!socket) return;

    const handleMaintenanceUpdate = (updatedNotice) => {
      setNotice(updatedNotice);
      setDismissed(false);
    };

    socket.on('MAINTENANCE_UPDATE', handleMaintenanceUpdate);

    return () => {
      socket.off('MAINTENANCE_UPDATE', handleMaintenanceUpdate);
    };
  }, [socket]);

  // Live Countdown Calculation (Days, Hours, Minutes, Seconds)
  useEffect(() => {
    if (!notice?.scheduledEndTime) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      try {
        const target = new Date(notice.scheduledEndTime);
        if (isNaN(target.getTime())) {
          setTimeLeft({ raw: notice.scheduledEndTime }); // Fallback for raw string
          return;
        }

        const now = new Date();
        const diffMs = target - now;

        if (diffMs <= 0) {
          setTimeLeft({ completed: true });
          return;
        }

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

        setTimeLeft({
          days: String(days).padStart(2, '0'),
          hours: String(hours).padStart(2, '0'),
          mins: String(mins).padStart(2, '0'),
          secs: String(secs).padStart(2, '0')
        });
      } catch (e) {
        setTimeLeft({ raw: notice.scheduledEndTime });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [notice?.scheduledEndTime]);

  if (!notice) return null;
  if (!isPreview && (!notice.enabled || dismissed)) return null;

  // Filter Assigned Pages
  const assignedPages = notice.assignedPages || [];
  if (!isPreview && assignedPages.length > 0 && currentView && !assignedPages.includes(currentView)) {
    return null;
  }

  // Filter Target Audience
  const audience = notice.targetAudience || 'all';
  if (audience !== 'all') {
    const currentRoleLower = (userRole || 'guest').toLowerCase();
    if (audience === 'applicator' && !currentRoleLower.includes('app')) return null;
    if (audience === 'hardware' && !currentRoleLower.includes('hard') && !currentRoleLower.includes('hw')) return null;
    if (audience === 'guest' && currentRoleLower !== 'guest') return null;
  }

  const isEmergency = notice.type === 'emergency';
  const isMaintenance = notice.type === 'maintenance';
  const isWarning = notice.type === 'warning';

  const bgColor = isEmergency
    ? 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)'
    : isMaintenance 
      ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' 
      : isWarning 
        ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' 
        : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';

  const IconComponent = isEmergency ? Lock : isMaintenance ? Build : isWarning ? Warning : Info;
  const displayMode = notice.displayMode || 'top_banner';

  const renderCountdownDisplay = () => {
    if (!timeLeft) return null;

    if (timeLeft.completed) {
      return (
        <Chip 
          label="✅ Maintenance Finishing Up..." 
          color="success" 
          size="small" 
          sx={{ fontWeight: 800, fontSize: '0.75rem', mt: 0.8 }} 
        />
      );
    }

    if (timeLeft.raw) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.8 }}>
          <Timer sx={{ fontSize: '0.95rem', opacity: 0.9 }} />
          <Typography variant="caption" fontWeight={800} sx={{ opacity: 0.95, bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.2, borderRadius: 1 }}>
            Completion: {timeLeft.raw}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mt: 0.8, bgcolor: 'rgba(0,0,0,0.35)', px: 1.5, py: 0.6, borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)' }}>
        <Timer sx={{ fontSize: '1rem', color: '#38bdf8' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.85rem' }}>
          {timeLeft.days !== '00' && (
            <>
              <Box component="span" sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 0.8, py: 0.2, borderRadius: 1 }}>{timeLeft.days}d</Box> :
            </>
          )}
          <Box component="span" sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 0.8, py: 0.2, borderRadius: 1 }}>{timeLeft.hours}h</Box> :
          <Box component="span" sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 0.8, py: 0.2, borderRadius: 1 }}>{timeLeft.mins}m</Box> :
          <Box component="span" sx={{ bgcolor: '#dc2626', color: 'white', px: 0.8, py: 0.2, borderRadius: 1, animation: 'pulse 1s infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } } }}>{timeLeft.secs}s</Box>
        </Box>
      </Box>
    );
  };

  // 1. FULLSCREEN OVERLAY MODE
  if (displayMode === 'fullscreen_overlay') {
    return (
      <Dialog 
        open={true} 
        fullScreen 
        PaperProps={{ 
          sx: { 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 3,
            position: 'relative'
          } 
        }}
      >
        <IconButton 
          onClick={() => setDismissed(true)} 
          sx={{ 
            position: 'absolute', 
            top: 24, 
            right: 24, 
            color: 'white', 
            bgcolor: 'rgba(255,255,255,0.15)', 
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } 
          }}
        >
          <Close fontSize="large" />
        </IconButton>

        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Box 
            sx={{ 
              width: 100, 
              height: 100, 
              borderRadius: '50%', 
              bgcolor: 'rgba(239, 68, 68, 0.2)', 
              color: '#ef4444', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mx: 'auto', 
              mb: 3,
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)'
            }}
          >
            <Build sx={{ fontSize: 54 }} />
          </Box>

          <Chip 
            label="🚨 SYSTEM MAINTENANCE IN PROGRESS" 
            color="error" 
            sx={{ fontWeight: 900, mb: 2, px: 1, py: 2, fontSize: '0.85rem' }} 
          />

          <Typography variant="h3" fontWeight="900" sx={{ mb: 2, fontSize: { xs: '1.8rem', sm: '2.5rem' } }}>
            {notice.title || 'System Under Maintenance'}
          </Typography>

          <Typography variant="body1" sx={{ color: 'grey.300', mb: 3, lineHeight: 1.7, fontSize: '1.05rem' }}>
            {notice.message}
          </Typography>

          {timeLeft && (
            <Box sx={{ mb: 4 }}>
              {renderCountdownDisplay()}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setDismissed(true)}
              sx={{ borderRadius: 3, px: 3.5, py: 1.2, fontWeight: 800, color: 'white', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Close / Return to App
            </Button>

            {notice.actionButtonText && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Launch />}
                onClick={() => window.open(notice.actionButtonUrl || '#', '_blank')}
                sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 800, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
              >
                {notice.actionButtonText}
              </Button>
            )}
          </Box>
        </Container>
      </Dialog>
    );
  }

  // 2. FLOATING BOTTOM CARD MODE
  if (displayMode === 'floating_bottom') {
    return (
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          maxWidth: 400,
          p: 2.5,
          borderRadius: 4,
          background: bgColor,
          color: 'white',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '@keyframes slideUp': {
            from: { transform: 'translateY(50px)', opacity: 0 },
            to: { transform: 'translateY(0)', opacity: 1 }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconComponent sx={{ fontSize: '1.4rem' }} />
            <Typography variant="subtitle1" fontWeight={800}>
              {notice.title || 'Notice'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setDismissed(true)} sx={{ color: 'white' }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <Typography variant="body2" sx={{ opacity: 0.95, mb: 1.5, fontSize: '0.85rem' }}>
          {notice.message}
        </Typography>

        {renderCountdownDisplay()}
      </Paper>
    );
  }

  // 3. TOP STICKY BANNER MODE (DEFAULT)
  return (
    <Paper
      elevation={4}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 3,
        borderRadius: 3,
        background: bgColor,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isMaintenance || isEmergency ? '0 8px 25px rgba(220, 38, 38, 0.35)' : '0 8px 25px rgba(0, 51, 102, 0.25)',
        animation: 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '@keyframes slideDown': {
          from: { transform: 'translateY(-20px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 }
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexGrow: 1 }}>
          <Box 
            sx={{ 
              p: 1, 
              borderRadius: 2, 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              backdropFilter: 'blur(4px)',
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              mt: 0.2
            }}
          >
            <IconComponent sx={{ fontSize: '1.5rem', color: 'white' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.3 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {notice.title || 'System Maintenance Notice'}
              </Typography>
              {notice.blockScanning && (
                <Chip 
                  label="⚠️ QR Scanning Temporarily Paused" 
                  size="small" 
                  sx={{ bgcolor: 'rgba(0,0,0,0.35)', color: 'white', fontWeight: 800, fontSize: '0.68rem', height: 20 }} 
                />
              )}
            </Box>

            <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.4, fontSize: '0.85rem' }}>
              {notice.message}
            </Typography>

            {renderCountdownDisplay()}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {notice.actionButtonText && (
            <Button
              size="small"
              variant="contained"
              onClick={() => window.open(notice.actionButtonUrl || '#', '_blank')}
              sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 800, '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' } }}
            >
              {notice.actionButtonText}
            </Button>
          )}

          <IconButton 
            size="small" 
            onClick={() => setDismissed(true)} 
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default MaintenanceNoticeBanner;
