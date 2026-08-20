import React, { useState, useRef } from 'react';
import { Box, Button, Fade, Typography } from '@mui/material';
import launchVideo from '../assets/lunch_optimized.mp4';
import megakemBrandLogo from '../assets/MegakemBrandLogo2.png';

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
      backgroundColor: '#020408', 
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
          zIndex: 20,
          width: '100%',
          height: '100%'
        }}>
          {/* Faint Background Watermark Logo */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -55%)',
            opacity: 0.02,
            pointerEvents: 'none',
            zIndex: 1,
            width: { xs: '80%', sm: '500px', md: '700px' }
          }}>
            <img 
              src={megakemBrandLogo} 
              alt="Megakem Background" 
              style={{ width: '100%', height: 'auto', filter: 'grayscale(100%)' }} 
            />
          </Box>

          {/* Dynamic Ambient Background Glows */}
          <Box sx={{
            position: 'absolute',
            width: { xs: '300px', md: '800px' },
            height: { xs: '300px', md: '800px' },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 179, 0, 0.12) 0%, rgba(0, 180, 216, 0.05) 40%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: -1,
            animation: 'pulseGlow 5s ease-in-out infinite alternate',
            '@keyframes pulseGlow': {
              '0%': { transform: 'scale(0.8)', opacity: 0.4 },
              '100%': { transform: 'scale(1.2)', opacity: 0.8 }
            }
          }} />

          {/* Grand Ceremonial Launch Button */}
          <Button
            onClick={handleStart}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              position: 'relative',
              zIndex: 30,
              px: { xs: 5, sm: 8 },
              py: { xs: 2.5, sm: 3.5 },
              borderRadius: '16px',
              background: isHovered 
                ? 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)' 
                : 'linear-gradient(135deg, rgba(255, 179, 0, 0.15) 0%, rgba(255, 143, 0, 0.05) 100%)',
              border: '2px solid #ffb300',
              backdropFilter: 'blur(16px)',
              boxShadow: isHovered 
                ? '0 0 50px rgba(255, 179, 0, 0.8), 0 0 100px rgba(255, 179, 0, 0.4)' 
                : '0 0 30px rgba(255, 179, 0, 0.4)',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              cursor: 'pointer',
              animation: !isHovered ? 'buttonBreathe 3s infinite ease-in-out' : 'none',
              '@keyframes buttonBreathe': {
                '0%, 100%': { boxShadow: '0 0 25px rgba(255, 179, 0, 0.3)' },
                '50%': { boxShadow: '0 0 50px rgba(255, 179, 0, 0.6)' }
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{
                color: isHovered ? '#020408' : '#ffffff',
                fontFamily: '"Outfit", "Inter", sans-serif',
                fontSize: { xs: '1.4rem', sm: '2.2rem' },
                fontWeight: 800,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                transition: 'color 0.4s ease'
              }}>
                LAUNCH SYSTEM
              </Typography>
            </Box>
          </Button>

          {/* Subtitle Awaiting Initiation */}
          <Typography sx={{
            color: '#00ffff',
            fontFamily: '"Orbitron", "Inter", sans-serif',
            fontSize: { xs: '0.7rem', sm: '0.9rem' },
            letterSpacing: '5px',
            textTransform: 'uppercase',
            mt: 6,
            zIndex: 30,
            animation: 'textFlash 2s infinite ease-in-out',
            '@keyframes textFlash': {
              '0%, 100%': { opacity: 0.3 },
              '50%': { opacity: 1, textShadow: '0 0 10px #00ffff' }
            }
          }}>
            System Online • Awaiting Initiation...
          </Typography>

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
              transform: 'translateZ(0)',
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
