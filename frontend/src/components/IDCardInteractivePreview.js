import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import frontTemplate from '../assets/WTC ID CARD front side Template.png';

const SCALE = 10; // 10px = 1mm

const DraggableElement = ({ field, config, children, onDragChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, configX: 0, configY: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      configX: config.x,
      configY: config.y
    };
    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      const canvasElement = document.getElementById('id-card-canvas');
      const zoom = canvasElement ? (canvasElement.getBoundingClientRect().width / 856) : 1;
      
      const newX = dragStart.current.configX + ((dx / zoom) / SCALE);
      const newY = dragStart.current.configY + ((dy / zoom) / SCALE);
      
      onDragChange(field, 'x', Math.round(newX * 10) / 10);
      onDragChange(field, 'y', Math.round(newY * 10) / 10);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, config.x, config.y, field, onDragChange]);

  if (config.visible === false) return null;

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: config.x * SCALE,
        top: config.y * SCALE,
        cursor: isDragging ? 'grabbing' : 'grab',
        border: isDragging ? '2px dashed #1976d2' : '2px dashed transparent',
        userSelect: 'none',
        padding: '2px', // Make it easier to grab
      }}
    >
      {children}
    </div>
  );
};

export default function IDCardInteractivePreview({ member, config, apiUrl, onChangeConfig }) {
  const photoUrl = member?.photo?.startsWith('/uploads') ? `${apiUrl}${member.photo}` : member?.photo;
  
  let zoneStr = (member?.zone || '').toString();
  if (zoneStr.toLowerCase().startsWith('zone ')) {
    zoneStr = zoneStr.substring(5).trim();
  }

  // A visual multiplier to make HTML font sizes look roughly identical to jsPDF's mm-based pt sizes (1pt = 0.3527mm * 10px/mm)
  const FONT_MULTIPLIER = 3.527; 

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', bgcolor: '#f0f0f0', p: 2 }}>
      <Box 
        id="id-card-canvas"
        sx={{ 
          width: 856, 
          height: 539.8, 
          position: 'relative', 
          transform: 'scale(0.8)',
          transformOrigin: 'top center',
          boxShadow: 3,
          bgcolor: 'white',
          backgroundImage: `url("${frontTemplate}")`,
          backgroundSize: '100% 100%'
        }}
      >
        {/* Photo */}
        {config?.photo?.visible !== false && photoUrl && (
          <DraggableElement field="photo" config={config.photo} onDragChange={onChangeConfig}>
            <img 
              src={photoUrl} 
              alt="Profile" 
              style={{ 
                width: config.photo.width * SCALE, 
                height: config.photo.height * SCALE,
                objectFit: 'fill',
                pointerEvents: 'none'
              }} 
            />
          </DraggableElement>
        )}

        {/* Member ID */}
        {config?.memberId?.visible !== false && (
          <DraggableElement field="memberId" config={config.memberId} onDragChange={onChangeConfig}>
            <Typography sx={{ 
              color: config.memberId.color || '#1E3264',
              fontSize: `${config.memberId.fontSize * FONT_MULTIPLIER}px`,
              fontWeight: 'bold',
              fontFamily: 'Helvetica, Arial, sans-serif',
              whiteSpace: config.memberId.wrapWidth > 0 ? 'pre-wrap' : 'pre',
              wordBreak: config.memberId.wrapWidth > 0 ? 'break-word' : 'normal',
              maxWidth: config.memberId.wrapWidth > 0 ? `${config.memberId.wrapWidth * SCALE}px` : 'none',
              lineHeight: 1.15
            }}>
              {config.memberId.textOverride !== undefined && config.memberId.textOverride !== '' ? config.memberId.textOverride : (member?.memberId || 'MEMBER ID')}
            </Typography>
          </DraggableElement>
        )}

        {/* Full Name */}
        {config?.name?.visible !== false && (
          <DraggableElement field="name" config={config.name} onDragChange={onChangeConfig}>
            <Typography sx={{ 
              color: config.name.color || '#1E3264',
              fontSize: `${config.name.fontSize * FONT_MULTIPLIER}px`,
              fontWeight: 'bold',
              fontFamily: 'Helvetica, Arial, sans-serif',
              whiteSpace: config.name.wrapWidth > 0 ? 'pre-wrap' : 'pre',
              wordBreak: config.name.wrapWidth > 0 ? 'break-word' : 'normal',
              maxWidth: config.name.wrapWidth > 0 ? `${config.name.wrapWidth * SCALE}px` : 'none',
              lineHeight: 1.15
            }}>
              {config.name.textOverride !== undefined && config.name.textOverride !== '' ? config.name.textOverride : (member?.name || 'FULL NAME').toUpperCase()}
            </Typography>
          </DraggableElement>
        )}

        {/* Zone No */}
        {config?.zone?.visible !== false && (
          <DraggableElement field="zone" config={config.zone} onDragChange={onChangeConfig}>
            <Typography sx={{ 
              color: config.zone.color || '#1E3264',
              fontSize: `${config.zone.fontSize * FONT_MULTIPLIER}px`,
              fontWeight: 'bold',
              fontFamily: 'Helvetica, Arial, sans-serif',
              whiteSpace: config.zone.wrapWidth > 0 ? 'pre-wrap' : 'pre',
              wordBreak: config.zone.wrapWidth > 0 ? 'break-word' : 'normal',
              maxWidth: config.zone.wrapWidth > 0 ? `${config.zone.wrapWidth * SCALE}px` : 'none',
              lineHeight: 1.15
            }}>
              {config.zone.textOverride !== undefined && config.zone.textOverride !== '' ? config.zone.textOverride : (zoneStr || 'ZONE 1')}
            </Typography>
          </DraggableElement>
        )}
      </Box>
    </Box>
  );
}
