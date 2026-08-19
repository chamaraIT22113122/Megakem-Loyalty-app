import React, { useState, useRef } from 'react';
import { Box, Button, Fade, Typography } from '@mui/material';
import launchVideo from '../assets/lunch.mp4';

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

          {/* Grand Ceremonial Launch Button */}
          <Button
            onClick={handleStart}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              position: 'relative',
              px: { xs: 5, sm: 8 },
              py: { xs: 2.5, sm: 3.5 },
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
                color: isHovered ? '#05070d' : '#ffffff',
                fontFamily: '"Outfit", "Inter", sans-serif',
                fontSize: { xs: '1.4rem', sm: '2rem' },
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
        </Box>
      </Fade>

    </Box>
  );
};

export default LaunchPage;
