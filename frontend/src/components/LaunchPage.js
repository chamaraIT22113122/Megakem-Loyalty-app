import React, { useState, useRef } from 'react';
import { Box, Button, Fade, Typography, IconButton } from '@mui/material';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import launchVideo from '../assets/lunch.mp4';
import megakemRewardsLogo from '../assets/Megakem  Rewards logo .png';

const LaunchPage = ({ onLaunch }) => {
  const [phase, setPhase] = useState('idle'); // 'idle' (ceremony button), 'playing' (video)
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  const handleStart = () => {
    setPhase('playing');
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      videoRef.current.play().catch(err => {
        console.warn('Playback error, falling back:', err);
        // Fallback if browser requires muted autoplay
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play();
        }
      });
    }
  };

  const handleFinish = () => {
    // Clean URL query parameters so page refresh stays on live app
    try {
      window.history.replaceState({}, '', window.location.pathname);
    } catch (e) {
      console.warn('Could not replace history state', e);
    }
    onLaunch();
  };

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 99999, 
      backgroundColor: '#05070d', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      
      {/* 1. Idle Phase: Ceremonial Chairman Launch Screen */}
      <Fade in={phase === 'idle'} timeout={1000} unmountOnExit>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 3,
          zIndex: 20
        }}>
          {/* Subtle Ambient Background Glows */}
          <Box sx={{
            position: 'absolute',
            width: { xs: '300px', md: '600px' },
            height: { xs: '300px', md: '600px' },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 179, 0, 0.15) 0%, rgba(0, 180, 216, 0.08) 50%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: -1,
            animation: 'pulseGlow 4s ease-in-out infinite alternate',
            '@keyframes pulseGlow': {
              '0%': { transform: 'scale(0.9)', opacity: 0.5 },
              '100%': { transform: 'scale(1.15)', opacity: 0.9 }
            }
          }} />

          {/* Megakem Rewards Logo */}
          <Box sx={{ mb: 4, maxWidth: { xs: '260px', sm: '360px', md: '440px' } }}>
            <img 
              src={megakemRewardsLogo} 
              alt="Megakem Rewards" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                filter: 'drop-shadow(0 10px 25px rgba(255, 179, 0, 0.35))' 
              }} 
            />
          </Box>

          {/* Ceremony Header */}
          <Typography sx={{
            color: '#ffb300',
            fontSize: { xs: '0.8rem', sm: '1.05rem' },
            fontWeight: 700,
            letterSpacing: { xs: '3px', sm: '6px' },
            textTransform: 'uppercase',
            mb: 1,
            textShadow: '0 0 12px rgba(255, 179, 0, 0.5)'
          }}>
            Official System Launch Ceremony
          </Typography>

          <Typography sx={{
            color: 'rgba(255, 255, 255, 0.65)',
            fontSize: { xs: '0.85rem', sm: '1rem' },
            maxWidth: '520px',
            mb: 5,
            fontWeight: 400
          }}>
            Honoring the official digital inauguration of the Megakem Scan-Trak Loyalty Platform.
          </Typography>

          {/* Grand Ceremonial Launch Button */}
          <Button
            onClick={handleStart}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              position: 'relative',
              px: { xs: 4, sm: 6 },
              py: { xs: 2, sm: 2.5 },
              borderRadius: '16px',
              background: isHovered 
                ? 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)' 
                : 'linear-gradient(135deg, rgba(255, 179, 0, 0.12) 0%, rgba(255, 143, 0, 0.05) 100%)',
              border: '2px solid #ffb300',
              backdropFilter: 'blur(12px)',
              boxShadow: isHovered 
                ? '0 0 45px rgba(255, 179, 0, 0.75), 0 0 80px rgba(255, 179, 0, 0.3)' 
                : '0 0 25px rgba(255, 179, 0, 0.35)',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              cursor: 'pointer'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{
                color: isHovered ? '#000' : '#ffb300',
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                fontWeight: 700,
                letterSpacing: '4px',
                textTransform: 'uppercase',
                mb: 0.5,
                transition: 'color 0.3s ease'
              }}>
                PRESIDENTIAL INITIATION
              </Typography>
              <Typography sx={{
                color: isHovered ? '#05070d' : '#ffffff',
                fontFamily: '"Outfit", "Inter", sans-serif',
                fontSize: { xs: '1.25rem', sm: '1.65rem' },
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                transition: 'color 0.3s ease'
              }}>
                OFFICIALLY LAUNCH SYSTEM
              </Typography>
            </Box>
          </Button>
        </Box>
      </Fade>

      {/* 2. Playing Phase: Full Screen Cinematic Video */}
      <Fade in={phase === 'playing'} timeout={600}>
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 10,
          backgroundColor: '#000' 
        }}>
          <video
            ref={videoRef}
            src={launchVideo}
            onEnded={handleFinish}
            playsInline
            preload="auto"
            disablePictureInPicture
            controlsList="nodownload"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: '#000',
              transform: 'translateZ(0)', // Forces hardware acceleration
              backfaceVisibility: 'hidden',
              perspective: 1000
            }}
          />

          {/* Skip Button (Bottom Right) for safety during the presentation */}
          <Button
            onClick={handleFinish}
            endIcon={<SkipNextIcon />}
            sx={{
              position: 'absolute',
              bottom: 30,
              right: 30,
              zIndex: 30,
              color: 'rgba(255, 255, 255, 0.7)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              px: 2,
              py: 0.8,
              fontSize: '0.85rem',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#ffb300',
                borderColor: '#ffb300'
              }
            }}
          >
            Skip to Application
          </Button>
        </Box>
      </Fade>

    </Box>
  );
};

export default LaunchPage;
