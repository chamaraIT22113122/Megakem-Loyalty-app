import React, { useState, useRef } from 'react';
import { Box, Button, Fade } from '@mui/material';
import launchVideo from '../assets/lunch.mp4';

const LaunchPage = ({ onLaunch }) => {
  const [phase, setPhase] = useState('idle'); // 'idle' (button), 'playing' (video)
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  const handleStart = () => {
    setPhase('playing');
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoEnded = () => {
    // Immediately transition to Welcome page when video finishes
    onLaunch();
  };

  return (
    <Box sx={{ 
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
      zIndex: 9999, backgroundColor: '#000', overflow: 'hidden', 
      display: 'flex', alignItems: 'center', justifyContent: 'center' 
    }}>
      
      {/* 1. Idle Phase: The Starting Button */}
      <Fade in={phase === 'idle'} timeout={1000} unmountOnExit>
         <Button
            onClick={handleStart}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
               padding: '16px 40px',
               borderRadius: '12px',
               backgroundColor: isHovered ? '#08121a' : '#03080e',
               border: `1px solid ${isHovered ? '#00ffff' : '#007b8f'}`,
               color: '#fff',
               fontFamily: '"Orbitron", sans-serif',
               fontSize: '1.4rem',
               fontWeight: 600,
               letterSpacing: '5px',
               textTransform: 'uppercase',
               boxShadow: isHovered ? '0 0 25px rgba(0, 255, 255, 0.4)' : '0 0 10px rgba(0, 123, 143, 0.2)',
               transition: 'all 0.3s ease-in-out',
               zIndex: 20
            }}
         >
            ENTER SYSTEM
         </Button>
      </Fade>

      {/* 2. Playing Phase: Full Screen Video */}
      <Fade in={phase === 'playing'} timeout={500}>
         <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
            <video
              ref={videoRef}
              src={launchVideo}
              onEnded={handleVideoEnded}
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover', // Ensures the video covers the full screen
                backgroundColor: '#000'
              }}
            />
         </Box>
      </Fade>

    </Box>
  );
};

export default LaunchPage;
