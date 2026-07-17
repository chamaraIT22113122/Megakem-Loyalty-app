import jsPDF from 'jspdf';
import frontTemplate from '../assets/WTC ID CARD front side Template.png';
import backTemplate from '../assets/WTC ID CARD F-Backside.png';
import QRCode from 'qrcode';

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

export const generateIDCard = async (member, apiUrl, config = null) => {
  const defaults = {
    memberId: { x: 62, y: 25, fontSize: 12, color: '#1E3264', visible: true },
    name: { x: 48.5, y: 38.5, fontSize: 7.5, color: '#1E3264', visible: true },
    zone: { x: 51, y: 43, fontSize: 7.5, color: '#1E3264', visible: true },
    photo: { x: 5.6, y: 16.7, width: 26, height: 30.5, visible: true }
  };
  const settings = config || defaults;
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
      img.crossOrigin = 'Anonymous';
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

    // 4. Add Back of Card (Second Page)
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

    // 5. Return the document instead of saving immediately
    return {
      doc: doc,
      dataUri: doc.output('bloburl'),
      filename: `${member.memberId || 'Member'}_ID_Card.pdf`
    };
    
  } catch (error) {
    console.error("Error generating ID card:", error);
    throw error;
  }
};
