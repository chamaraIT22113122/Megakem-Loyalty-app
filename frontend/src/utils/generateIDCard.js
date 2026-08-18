import jsPDF from 'jspdf';
import frontTemplate from '../assets/WTC ID CARD front side Template.png';
import backTemplate from '../assets/WTC ID CARD F-Backside.png';

let cachedFrontImg = null;
let cachedBackImg = null;

const drawFittedText = (doc, text, x, y, maxWidth, initialFontSize, wrapWidth) => {
  // Offset to match the 2px padding in the Interactive Preview DraggableElement (2px / 10 SCALE = 0.2mm)
  const xOffset = 0.2;
  // Offset to match the 2px padding + HTML Typography line-height 1.15 half-leading
  const yOffset = 0.2 + (initialFontSize * (25.4 / 72) * ((1.15 - 1) / 2));

  if (wrapWidth > 0) {
    doc.setFontSize(initialFontSize);
    doc.text(text, x + xOffset, y + yOffset, { baseline: 'top', maxWidth: wrapWidth, lineHeightFactor: 1.15 });
  } else {
    let fontSize = initialFontSize;
    doc.setFontSize(fontSize);
    // Only shrink if it's literally hitting the edge of the card
    while (doc.getTextWidth(text) > maxWidth && fontSize > 5) {
      fontSize -= 0.5;
      doc.setFontSize(fontSize);
    }
    // Recalculate yOffset with the potentially smaller font size
    const adjustedYOffset = 0.2 + (fontSize * (25.4 / 72) * ((1.15 - 1) / 2));
    doc.text(text, x + xOffset, y + adjustedYOffset, { baseline: 'top' });
  }
};

export const generateIDCard = async (member, apiUrl, config = null, options = {}) => {
  const defaults = {
    memberId: { x: 62, y: 25, fontSize: 12, color: '#1E3264', visible: true },
    name: { x: 48.5, y: 38.5, fontSize: 7.5, color: '#1E3264', visible: true },
    zone: { x: 51, y: 43, fontSize: 7.5, color: '#1E3264', visible: true },
    photo: { x: 5.6, y: 16.7, width: 26, height: 30.5, visible: true }
  };
  const settings = config || defaults;
  const frontOnly = options.frontOnly === true;

  // CR80 ID Card standard size: 85.6 mm x 53.98 mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 53.98]
  });

  // Load an image from URL
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (src && src.startsWith('http')) {
        img.crossOrigin = 'Anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  try {
    // 1. Draw Front of Card
    try {
      if (!cachedFrontImg) {
        cachedFrontImg = await loadImage(frontTemplate);
      }
      doc.addImage(cachedFrontImg, 'PNG', 0, 0, 85.6, 53.98);
    } catch (err) {
      console.warn("Could not load front template image. Drawing fallback background.", err);
      // Fallback background
      doc.setFillColor(240, 248, 255);
      doc.rect(0, 0, 85.6, 53.98, 'F');
      
      // Basic header
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 85.6, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("MEMBER ID CARD", 42.8, 8, { align: 'center' });
    }

    // 2. Add Profile Photo
    if (member.photo) {
      try {
        let photoUrl = member.photo;
        // If it's a relative path to uploads, prepend backend URL
        if (photoUrl.startsWith('/uploads')) {
          photoUrl = `${apiUrl}${photoUrl}`;
        }
        
        // Load photo
        const profileImg = await loadImage(photoUrl);
        
        // Approximate dimensions based on template:
        // Adjust these numbers if the photo doesn't fit exactly in the box
        if (settings.photo.visible !== false) {
          doc.addImage(profileImg, 'JPEG', settings.photo.x, settings.photo.y, settings.photo.width, settings.photo.height);
        }
      } catch (err) {
        console.error("Could not load profile picture for ID Card", err);
      }
    }

    // 3. Add Text Overlay
    doc.setFont("helvetica", "bold");
    // Member ID
    if (settings.memberId.visible !== false) {
      if (settings.memberId.color) doc.setTextColor(settings.memberId.color);
      else doc.setTextColor(30, 50, 100); 
      
      // Positioned right after "MEMBER ID :" in the green pill
      const memberId = settings.memberId.textOverride !== undefined && settings.memberId.textOverride !== '' ? settings.memberId.textOverride : (member.memberId || '');
      const maxW = 85.6 - settings.memberId.x - 2;
      drawFittedText(doc, memberId, settings.memberId.x, settings.memberId.y, maxW, settings.memberId.fontSize, settings.memberId.wrapWidth || 0);
    }

    // Full Name
    if (settings.name.visible !== false) {
      if (settings.name.color) doc.setTextColor(settings.name.color);
      else doc.setTextColor(30, 50, 100); 
      const fullName = settings.name.textOverride !== undefined && settings.name.textOverride !== '' ? settings.name.textOverride : (member.name || '').toUpperCase();
      // Positioned right after "FULL NAME :"
      const maxW = 85.6 - settings.name.x - 2;
      drawFittedText(doc, fullName, settings.name.x, settings.name.y, maxW, settings.name.fontSize, settings.name.wrapWidth || 0);
    }

    // Zone No
    if (settings.zone.visible !== false) {
      if (settings.zone.color) doc.setTextColor(settings.zone.color);
      else doc.setTextColor(30, 50, 100); 
      let zoneStr = (member.zone || '').toString();
      if (zoneStr.toLowerCase().startsWith('zone ')) {
        zoneStr = zoneStr.substring(5).trim();
      }
      const zoneText = settings.zone.textOverride !== undefined && settings.zone.textOverride !== '' ? settings.zone.textOverride : zoneStr;
      // Positioned right after "ZONE NO :"
      const maxW = 85.6 - settings.zone.x - 2;
      drawFittedText(doc, zoneText, settings.zone.x, settings.zone.y, maxW, settings.zone.fontSize, settings.zone.wrapWidth || 0);
    }

    // 4. Add Back of Card (Second Page) - Only if not frontOnly
    if (!frontOnly) {
      doc.addPage();
      try {
        if (!cachedBackImg) {
          cachedBackImg = await loadImage(backTemplate);
        }
        doc.addImage(cachedBackImg, 'PNG', 0, 0, 85.6, 53.98);
      } catch (err) {
        console.warn("Could not load back image. Drawing fallback back side.", err);
        doc.setFillColor(240, 248, 255);
        doc.rect(0, 0, 85.6, 53.98, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text("If found, please return to Megakem Loyalty.", 42.8, 27, { align: 'center' });
      }
    }

    // 5. Return the document
    const suffix = frontOnly ? '_Front' : '';
    return {
      doc: doc,
      dataUri: doc.output('datauristring'),
      filename: `${member.memberId || 'Member'}_ID_Card${suffix}.pdf`
    };
    
  } catch (error) {
    console.error("Error generating ID card:", error);
    throw error;
  }
};

/**
 * Generate High-Resolution Image (PNG or JPG) of ID Card Front
 */
export const generateIDCardImage = async (member, apiUrl, config = null, format = 'png') => {
  const defaults = {
    memberId: { x: 62, y: 25, fontSize: 12, color: '#1E3264', visible: true },
    name: { x: 48.5, y: 38.5, fontSize: 7.5, color: '#1E3264', visible: true },
    zone: { x: 51, y: 43, fontSize: 7.5, color: '#1E3264', visible: true },
    photo: { x: 5.6, y: 16.7, width: 26, height: 30.5, visible: true }
  };
  const settings = config || defaults;
  
  // 3x High-DPI Resolution for crisp 300 DPI print quality
  const SCALE_FACTOR = 3; 
  const width = Math.round(85.6 * 10 * SCALE_FACTOR); // 2568px
  const height = Math.round(53.98 * 10 * SCALE_FACTOR); // 1619px
  const mmScale = 10 * SCALE_FACTOR; // 30px per mm

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Helper to load images
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (src && src.startsWith('http')) {
        img.crossOrigin = 'Anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  try {
    // 1. Draw Front Template
    if (!cachedFrontImg) {
      cachedFrontImg = await loadImage(frontTemplate);
    }
    ctx.drawImage(cachedFrontImg, 0, 0, width, height);

    // 2. Draw Profile Photo
    if (member.photo && settings.photo.visible !== false) {
      try {
        let photoUrl = member.photo;
        if (photoUrl.startsWith('/uploads')) {
          photoUrl = `${apiUrl}${photoUrl}`;
        }
        const profileImg = await loadImage(photoUrl);
        ctx.drawImage(
          profileImg,
          settings.photo.x * mmScale,
          settings.photo.y * mmScale,
          settings.photo.width * mmScale,
          settings.photo.height * mmScale
        );
      } catch (err) {
        console.error("Could not load profile photo for image export", err);
      }
    }

    // 3. Draw Text Overlays
    const drawCanvasText = (text, fieldX, fieldY, maxWmm, initialFontSize, color, wrapWmm = 0) => {
      const x = (fieldX + 0.2) * mmScale;
      const y = (fieldY + 0.2) * mmScale;
      const fontSizePx = initialFontSize * 3.527 * SCALE_FACTOR;

      ctx.fillStyle = color || '#1E3264';
      ctx.textBaseline = 'top';

      if (wrapWmm > 0) {
        ctx.font = `bold ${fontSizePx}px Helvetica, Arial, sans-serif`;
        const wrapWPx = wrapWmm * mmScale;
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        const lineHeight = fontSizePx * 1.15;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > wrapWPx && n > 0) {
            ctx.fillText(line.trim(), x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), x, currentY);
      } else {
        let currentFontSize = initialFontSize;
        let currentFontSizePx = fontSizePx;
        const maxWPx = maxWmm * mmScale;
        ctx.font = `bold ${currentFontSizePx}px Helvetica, Arial, sans-serif`;
        while (ctx.measureText(text).width > maxWPx && currentFontSize > 5) {
          currentFontSize -= 0.5;
          currentFontSizePx = currentFontSize * 3.527 * SCALE_FACTOR;
          ctx.font = `bold ${currentFontSizePx}px Helvetica, Arial, sans-serif`;
        }
        ctx.fillText(text, x, y);
      }
    };

    // Member ID
    if (settings.memberId.visible !== false) {
      const memberId = settings.memberId.textOverride !== undefined && settings.memberId.textOverride !== '' ? settings.memberId.textOverride : (member.memberId || '');
      const maxW = 85.6 - settings.memberId.x - 2;
      drawCanvasText(memberId, settings.memberId.x, settings.memberId.y, maxW, settings.memberId.fontSize, settings.memberId.color, settings.memberId.wrapWidth || 0);
    }

    // Full Name
    if (settings.name.visible !== false) {
      const fullName = settings.name.textOverride !== undefined && settings.name.textOverride !== '' ? settings.name.textOverride : (member.name || '').toUpperCase();
      const maxW = 85.6 - settings.name.x - 2;
      drawCanvasText(fullName, settings.name.x, settings.name.y, maxW, settings.name.fontSize, settings.name.color, settings.name.wrapWidth || 0);
    }

    // Zone No
    if (settings.zone.visible !== false) {
      let zoneStr = (member.zone || '').toString();
      if (zoneStr.toLowerCase().startsWith('zone ')) {
        zoneStr = zoneStr.substring(5).trim();
      }
      const zoneText = settings.zone.textOverride !== undefined && settings.zone.textOverride !== '' ? settings.zone.textOverride : zoneStr;
      const maxW = 85.6 - settings.zone.x - 2;
      drawCanvasText(zoneText, settings.zone.x, settings.zone.y, maxW, settings.zone.fontSize, settings.zone.color, settings.zone.wrapWidth || 0);
    }

    // 4. Export as PNG or JPG
    const isJpeg = format.toLowerCase() === 'jpg' || format.toLowerCase() === 'jpeg';
    const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
    const extension = isJpeg ? 'jpg' : 'png';
    const dataUri = canvas.toDataURL(mimeType, 0.95);
    const filename = `${member.memberId || 'Member'}_ID_Card_Front.${extension}`;

    return {
      dataUri,
      filename,
      download: () => {
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  } catch (error) {
    console.error("Error generating ID card image:", error);
    throw error;
  }
};

