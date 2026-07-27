const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// @route   POST /api/upload
// @desc    Upload an image
// @access  Private (You can add protect middleware if needed)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    
    // Import Google Drive upload utility
    const { uploadImageToGoogleDrive } = require('../utils/googleDriveUpload');
    
    // Upload the file to Google Drive
    const driveResult = await uploadImageToGoogleDrive(
      req.file.path, 
      req.file.filename,
      req.file.mimetype
    );
    
    let imageUrl = `/uploads/${req.file.filename}`; // Fallback to local URL
    let isDriveUrl = false;
    
    if (driveResult && driveResult.id) {
      // Use the direct viewing URL format for Google Drive images
      imageUrl = `https://drive.google.com/uc?export=view&id=${driveResult.id}`;
      isDriveUrl = true;
      
      // Optional: Delete the local file after successful upload to Drive
      // fs.unlink(req.file.path, (err) => {
      //   if (err) console.error('Error deleting local file after Drive upload:', err);
      // });
    }
    
    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        isDriveUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});
// @route   GET /api/upload/proxy
// @desc    Proxy an image URL to bypass CORS for PDF generation
// @access  Public
router.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('URL is required');
    }
    
    // Fetch the image
    let fetchUrl = url;
    if (fetchUrl.includes('drive.google.com') && fetchUrl.includes('export=view')) {
      fetchUrl = fetchUrl.replace('export=view', 'export=download');
    }
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image');
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).send('Error proxying image');
  }
});

module.exports = router;
