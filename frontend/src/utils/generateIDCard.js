import jsPDF from 'jspdf';
import frontTemplate from '../assets/WTC ID CARD front side Template.png';
import backTemplate from '../assets/WTC ID CARD F-Backside.png';
import QRCode from 'qrcode';

export const generateIDCard = async (member, apiUrl) => {
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
      const frontImg = await loadImage(frontTemplate);
      doc.addImage(frontImg, 'PNG', 0, 0, 85.6, 53.98);
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
        doc.addImage(profileImg, 'JPEG', 5.4, 16.5, 26.3, 31);
      } catch (err) {
        console.error("Could not load profile picture for ID Card", err);
      }
    }

    // 3. Add Text Overlay
    doc.setFont("helvetica", "bold");
    
    // Member ID (Dark Blue)
    doc.setTextColor(30, 50, 100); 
    doc.setFontSize(12);
    // Positioned right after "MEMBER ID :" in the green pill
    doc.text(member.memberId || '', 60, 24.5);

    // Full Name
    doc.setFontSize(10);
    // Positioned right after "FULL NAME :"
    doc.text((member.name || '').toUpperCase(), 55, 32.5);

    // Zone No
    doc.setFontSize(10);
    // Positioned right after "ZONE NO :"
    doc.text((member.zone || '').toString(), 49, 42.5);

    // 4. Add Back of Card (Second Page)
    doc.addPage();
    try {
      const backImg = await loadImage(backTemplate);
      doc.addImage(backImg, 'PNG', 0, 0, 85.6, 53.98);
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
      filename: `${member.memberId || 'Member'}_ID_Card.pdf`
    };
    
  } catch (error) {
    console.error("Error generating ID card:", error);
    throw error;
  }
};
