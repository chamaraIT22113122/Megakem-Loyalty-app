import jsPDF from 'jspdf';

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
    const frontImg = await loadImage('/images/id_front.png');
    doc.addImage(frontImg, 'PNG', 0, 0, 85.6, 53.98);

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
    try {
      const backImg = await loadImage('/images/id_back.png');
      doc.addPage();
      doc.addImage(backImg, 'PNG', 0, 0, 85.6, 53.98);
    } catch (err) {
      console.warn("Could not load back image (id_back.png). Make sure it's placed in public/images/", err);
    }

    // 5. Download the PDF
    doc.save(`${member.memberId || 'Member'}_ID_Card.pdf`);
    
  } catch (error) {
    console.error("Error generating ID card:", error);
    throw error;
  }
};
