const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const crypto = require('crypto');
const QRCodeModel = require('../models/QRCode');
const ScanLog = require('../models/ScanLog');
const Product = require('../models/Product');
const { protect, qrAdmin, hasPermission } = require('../middleware/auth');

// ─── HMAC Signature Helpers (Upgrade 1: Anti-Fraud) ─────────────────────────
const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET || 'megakem-qr-default-secret-change-in-production';

/**
 * Signs the canonical QR params string and returns hex HMAC-SHA256.
 * Canonical string: "p=<productNo>&b=<batchNo>&pkg=<packageNo>"
 */
function signQRLink(productNo, batchNo, packageNo) {
  const canonical = `p=${productNo}&b=${batchNo}&pkg=${packageNo || ''}`;
  return crypto.createHmac('sha256', QR_HMAC_SECRET).update(canonical).digest('hex');
}

/**
 * Verifies an HMAC signature.
 * Returns: 'valid' | 'invalid' | 'missing'
 */
function verifyQRSignature(productNo, batchNo, packageNo, sig) {
  if (!sig) return 'missing';
  const expected = signQRLink(productNo, batchNo, packageNo);
  // Constant-time comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length) return 'invalid';
    return crypto.timingSafeEqual(sigBuf, expectedBuf) ? 'valid' : 'invalid';
  } catch {
    return 'invalid';
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Branded QR Helper (Upgrade 4: Navy Color) ───────────────────────────────
async function generateBrandedQR(link) {
  return await QRCode.toDataURL(link, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    width: 400,
    color: {
      dark: '#003366',  // Megakem primary navy
      light: '#FFFFFF'
    }
  });
}
// ─────────────────────────────────────────────────────────────────────────────

// Helper to extract date from batch number (returns Date object or null)
function extractDateFromBatch(batchNo) {
  if (!batchNo) return null;
  const cleanBatch = batchNo.trim();
  
  // 1. Look for YYYY-MM-DD or DD-MM-YYYY patterns first
  const datePattern = /(\d{2})[-/](\d{2})[-/](\d{4})/;
  const match = cleanBatch.match(datePattern);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const dateObj = new Date(year, month, day);
    if (!isNaN(dateObj.getTime())) return dateObj;
  }
  
  const isoPattern = /(\d{4})[-/](\d{2})[-/](\d{2})/;
  const matchIso = cleanBatch.match(isoPattern);
  if (matchIso) {
    const year = parseInt(matchIso[1], 10);
    const month = parseInt(matchIso[2], 10) - 1;
    const day = parseInt(matchIso[3], 10);
    const dateObj = new Date(year, month, day);
    if (!isNaN(dateObj.getTime())) return dateObj;
  }

  // 2. Look for 8 consecutive digits (e.g. YYYYMMDD in B2023120501 or DDMMYYYY in B05122023)
  const eightDigitMatch = cleanBatch.match(/\d{8}/);
  if (eightDigitMatch) {
    const d = eightDigitMatch[0];
    let day, month, year;
    if (d.startsWith('20') || d.startsWith('19')) {
      // YYYYMMDD
      year = parseInt(d.substring(0, 4), 10);
      month = parseInt(d.substring(4, 6), 10) - 1;
      day = parseInt(d.substring(6, 8), 10);
    } else {
      // DDMMYYYY
      day = parseInt(d.substring(0, 2), 10);
      month = parseInt(d.substring(2, 4), 10) - 1;
      year = parseInt(d.substring(4, 8), 10);
    }
    const dateObj = new Date(year, month, day);
    if (!isNaN(dateObj.getTime())) return dateObj;
  }
  
  // 3. Try split by underscore or space to find 6-digit date (DDMMYY)
  let parts = cleanBatch.split('_');
  if (parts.length < 3) {
    parts = cleanBatch.split(/\s+/);
  }
  
  let dateStr = '';
  // Check index 2 first (standard 4-part or 5-part Megakem formats)
  if (parts.length >= 3 && /^\d{6}$/.test(parts[2])) {
    dateStr = parts[2];
  } else {
    // Look for any part that is exactly 6 digits
    const sixDigitPart = parts.find(p => /^\d{6}$/.test(p));
    if (sixDigitPart) dateStr = sixDigitPart;
  }
  
  if (dateStr && dateStr.length === 6) {
    const day = parseInt(dateStr.substring(0, 2), 10);
    const month = parseInt(dateStr.substring(2, 4), 10) - 1;
    const year = parseInt('20' + dateStr.substring(4, 6), 10);
    const dateObj = new Date(year, month, day);
    if (!isNaN(dateObj.getTime())) return dateObj;
  }
  
  return null;
}

// Helper to format the batch number as [ProductCode] [BatchNo] [MfgDate] [PkgNo]
function getFormattedBatch(productNo, batchNo, mfgDate, packageNo) {
  if (!batchNo) return '';

  const cleanProduct = (productNo || '').trim().toUpperCase();
  const cleanBatch = (batchNo || '').trim();
  const cleanPkg = (packageNo || 'STD').trim();

  // If the batch number is already fully formatted (contains >= 4 space-separated parts or underscores), return it unchanged
  const spaceParts = cleanBatch.split(/\s+/);
  const underscoreParts = cleanBatch.split('_');
  if (spaceParts.length >= 4 || underscoreParts.length >= 4) {
    return cleanBatch;
  }

  // Format date to DDMMYY
  let dateObj = mfgDate ? new Date(mfgDate) : null;
  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = extractDateFromBatch(cleanBatch);
  }
  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date(); // Fallback to current date
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = String(dateObj.getFullYear()).slice(-2);
  const dateStr = `${day}${month}${year}`;

  // Pad batch number to 3 digits (e.g. 1 -> 001) if numeric
  let paddedBatch = cleanBatch;
  if (/^\d+$/.test(cleanBatch)) {
    paddedBatch = cleanBatch.padStart(3, '0');
  }

  // Pad package number to 3 digits (e.g. 20 -> 020) if numeric
  let paddedPkg = cleanPkg;
  if (/^\d+$/.test(cleanPkg)) {
    paddedPkg = cleanPkg.padStart(3, '0');
  }

  return `${cleanProduct} ${paddedBatch} ${dateStr} ${paddedPkg}`;
}

// Generate QR code for products
router.post('/generate', protect, qrAdmin, async (req, res) => {
  try {
    const {
      productIds,
      batchNo,
      packageNo,
      manufactureDate,
      expiryDate,
      customLink,
      printerModel = 'Zebra ZD320',
      printSettings
    } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Product IDs are required' });
    }

    if (!batchNo) {
      return res.status(400).json({ error: 'Batch number is required' });
    }

    // Extract manufactureDate and expiryDate from batch number if not provided
    let finalMfgDate = manufactureDate ? new Date(manufactureDate) : extractDateFromBatch(batchNo);
    let finalExpDate = expiryDate ? new Date(expiryDate) : null;

    if (finalMfgDate && isNaN(finalMfgDate.getTime())) {
      finalMfgDate = extractDateFromBatch(batchNo);
    }

    if (finalMfgDate && !finalExpDate) {
      // Default expiry date: 2 years after manufacture date
      finalExpDate = new Date(finalMfgDate);
      finalExpDate.setFullYear(finalExpDate.getFullYear() + 2);
    }

    const baseUrl = 'https://chamarait22113122.github.io/Megakem-Loyalty-app';
    const generatedQRs = [];

    for (const productId of productIds) {
      const product = await Product.findById(productId);
      if (!product) continue;

      // Format batch to: [ProductNo] [BatchNo] [DateCode] [PackageNo]
      const formattedBatch = getFormattedBatch(product.productNo, batchNo, finalMfgDate, packageNo);

      // Create unique QR ID - replace spaces with underscores for ID uniqueness
      const qrId = `${product.productNo}-${formattedBatch.replace(/\s+/g, '_')}-${packageNo || 'STD'}-${Date.now()}`;
      
      // Compute HMAC signature for anti-fraud (Upgrade 1)
      const sig = signQRLink(product.productNo, formattedBatch, packageNo || '');

      // Create QR link with signature appended
      const qrLink = customLink || `${baseUrl}/?p=${encodeURIComponent(product.productNo)}&b=${encodeURIComponent(formattedBatch)}&pkg=${encodeURIComponent(packageNo || '')}&sig=${sig}`;

      // Generate branded QR code (navy color) as data URL (Upgrade 4)
      const qrDataUrl = await generateBrandedQR(qrLink);

      // Create QR code record
      const qrRecord = new QRCodeModel({
        qrId,
        product: productId,
        productName: product.name,
        productNo: product.productNo,
        batchNo: formattedBatch,
        packageNo,
        manufactureDate: finalMfgDate,
        expiryDate: finalExpDate,
        qrLink,
        customLink,
        qrData: qrDataUrl,
        printerModel,
        printSettings: printSettings || {
          size: 'medium',
          dpi: 203,
          layout: 'standard'
        },
        status: 'generated'
      });

      await qrRecord.save();
      generatedQRs.push(qrRecord);
    }

    res.status(201).json({
      message: `Generated ${generatedQRs.length} QR codes`,
      count: generatedQRs.length,
      qrCodes: generatedQRs
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get QR codes with filters
router.get('/', protect, qrAdmin, async (req, res) => {
  try {
    const { batchNo, productNo, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    let filter = {};
    
    if (batchNo) filter.batchNo = batchNo;
    if (productNo) filter.productNo = productNo;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const qrCodes = await QRCodeModel.find(filter)
      .populate('product', 'name productNo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await QRCodeModel.countDocuments(filter);

    res.json({
      data: qrCodes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get batch summary (for tracking printed ranges)
router.get('/batches/summary', protect, qrAdmin, async (req, res) => {
  try {
    const batchSummary = await QRCodeModel.aggregate([
      {
        $group: {
          _id: '$batchNo',
          totalQRs: { $sum: 1 },
          printed: {
            $sum: { $cond: [{ $eq: ['$status', 'printed'] }, 1, 0] }
          },
          scanned: {
            $sum: { $cond: [{ $eq: ['$status', 'scanned'] }, 1, 0] }
          },
          generated: {
            $sum: { $cond: [{ $eq: ['$status', 'generated'] }, 1, 0] }
          },
          lastPrintDate: {
            $max: '$printedDate'
          },
          // Add expiry detection (Upgrade 5)
          minExpiryDate: { $min: '$expiryDate' },
          productCount: { $push: '$productNo' }
        }
      },
      // Compute isExpired and scanRate in a projection stage
      {
        $addFields: {
          isExpired: {
            $cond: [
              { $and: [
                { $ne: ['$minExpiryDate', null] },
                { $lt: ['$minExpiryDate', new Date()] }
              ]},
              true,
              false
            ]
          },
          scanRate: {
            $cond: [
              { $gt: ['$totalQRs', 0] },
              { $round: [{ $multiply: [{ $divide: ['$scanned', '$totalQRs'] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { lastPrintDate: -1 } }
    ]);

    res.json(batchSummary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark QR codes as printed
router.put('/mark-printed', protect, qrAdmin, async (req, res) => {
  try {
    const { qrIds, printerModel } = req.body;

    if (!qrIds || !Array.isArray(qrIds)) {
      return res.status(400).json({ error: 'QR IDs are required' });
    }

    const updated = await QRCodeModel.updateMany(
      { _id: { $in: qrIds } },
      {
        status: 'printed',
        printedDate: new Date(),
        printedBy: req.user.id,
        printerModel: printerModel || 'Zebra ZD320'
      }
    );

    res.json({
      message: `Marked ${updated.modifiedCount} QR codes as printed`,
      updated: updated.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOTE: /:id route moved to BOTTOM of file so named sub-routes
// (/scan-logs, /settings/printers, /record-scan) are not swallowed by it.

// Delete QR codes
router.delete('/', protect, qrAdmin, async (req, res) => {
  try {
    const { qrIds } = req.body;

    if (!qrIds || !Array.isArray(qrIds)) {
      return res.status(400).json({ error: 'QR IDs are required' });
    }

    const deleted = await QRCodeModel.deleteMany({ _id: { $in: qrIds } });

    res.json({
      message: `Deleted ${deleted.deletedCount} QR codes`,
      deleted: deleted.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk generate QR codes with range support and duplicate prevention
router.post('/bulk/generate', protect, qrAdmin, async (req, res) => {
  try {
    let {
      productId,
      quantity,
      batchNo,
      packageNoPrefix = '',
      startNo,
      endNo,
      manufactureDate,
      expiryDate,
      customLink,
      printerModel = 'Zebra ZD320',
      printSettings
    } = req.body;

    if (!productId || !batchNo) {
      return res.status(400).json({
        error: 'productId and batchNo are required'
      });
    }

    // Determine range
    let start = parseInt(startNo);
    let end = parseInt(endNo);
    let qty = parseInt(quantity);

    if (isNaN(start) || isNaN(end)) {
      start = 1;
      end = qty || 1;
    } else {
      qty = end - start + 1;
    }

    if (qty <= 0 || qty > 2000) {
      return res.status(400).json({ error: 'Invalid quantity or range (max 2000 per batch)' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Extract manufactureDate and expiryDate from batch number if not provided
    let finalMfgDate = manufactureDate ? new Date(manufactureDate) : extractDateFromBatch(batchNo);
    let finalExpDate = expiryDate ? new Date(expiryDate) : null;

    if (finalMfgDate && isNaN(finalMfgDate.getTime())) {
      finalMfgDate = extractDateFromBatch(batchNo);
    }

    if (finalMfgDate && !finalExpDate) {
      // Default expiry date: 2 years after manufacture date
      finalExpDate = new Date(finalMfgDate);
      finalExpDate.setFullYear(finalExpDate.getFullYear() + 2);
    }

    // Check for duplicates in the database first
    const existingQRs = await QRCodeModel.find({
      product: productId,
      batchNo: batchNo,
      status: { $ne: 'archived' }
    });

    const existingPackageNos = new Set(existingQRs.map(qr => qr.packageNo));
    const duplicates = [];
    for (let i = start; i <= end; i++) {
       const pNo = `${packageNoPrefix}${i}`;
       if (existingPackageNos.has(pNo)) {
         duplicates.push(pNo);
       }
    }

    if (duplicates.length > 0) {
      return res.status(400).json({
        error: `Duplicate package numbers detected in this batch: ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '...' : ''}`,
        duplicateCount: duplicates.length
      });
    }

    const baseUrl = 'https://chamarait22113122.github.io/Megakem-Loyalty-app';
    const qrRecords = [];

    // Generate in chunks with the database to avoid memory issues and long transactions
    for (let i = start; i <= end; i++) {
      const pNo = `${packageNoPrefix}${i}`;
      
      // Format batch to: [ProductNo] [BatchNo] [DateCode] [PackageNo]
      const formattedBatch = getFormattedBatch(product.productNo, batchNo, finalMfgDate, pNo);

      // Create unique QR ID - replace spaces with underscores for ID uniqueness
      const qrId = `${product.productNo}-${formattedBatch.replace(/\s+/g, '_')}-${pNo}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Compute HMAC signature for anti-fraud (Upgrade 1)
      const sig = signQRLink(product.productNo, formattedBatch, pNo);

      // Create QR link with signature
      const qrLink = customLink || `${baseUrl}/?p=${encodeURIComponent(product.productNo)}&b=${encodeURIComponent(formattedBatch)}&pkg=${encodeURIComponent(pNo)}&sig=${sig}`;

      // Generate branded QR code (navy color) as data URL (Upgrade 4)
      const qrDataUrl = await generateBrandedQR(qrLink);
      
      // Pipe delimited data as secondary info or for the scanner app
      const pipeData = `${product.productNo}|${product.name}|${formattedBatch}|${pNo}|${product.packSize || 'N/A'}`;

      qrRecords.push({
        qrId,
        product: productId,
        productName: product.name,
        productNo: product.productNo,
        batchNo: formattedBatch,
        packageNo: pNo,
        manufactureDate: finalMfgDate,
        expiryDate: finalExpDate,
        qrLink,
        customLink,
        qrData: qrDataUrl,
        printerModel,
        printSettings: printSettings || {
          size: 'medium',
          dpi: 203,
          layout: 'standard'
        },
        status: 'generated'
      });
    }

    // Bulk insert
    const savedCodes = await QRCodeModel.insertMany(qrRecords);

    res.status(201).json({
      message: `Generated ${savedCodes.length} QR codes for batch ${batchNo}`,
      count: savedCodes.length,
      range: `${packageNoPrefix}${start} to ${packageNoPrefix}${end}`,
      batchNo
    });
  } catch (error) {
    console.error('Bulk QR generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get printer settings
router.get('/settings/printers', protect, qrAdmin, (req, res) => {
  const printerSettings = {
    printers: [
      {
        model: 'Zebra ZD320',
        dpi: [203, 306],
        sizes: ['4x6', '4x4', '3x3', 'custom'],
        defaultDpi: 203,
        defaultSize: '4x6'
      },
      {
        model: 'Zebra ZD420',
        dpi: [203, 300],
        sizes: ['4x6', '4x4', '3x3'],
        defaultDpi: 203,
        defaultSize: '4x6'
      },
      {
        model: 'Generic Thermal',
        dpi: [203],
        sizes: ['4x6', '4x4'],
        defaultDpi: 203,
        defaultSize: '4x6'
      }
    ],
    layouts: [
      {
        name: 'standard',
        description: 'QR code with product info',
        includesText: true,
        textPosition: 'bottom'
      },
      {
        name: 'compact',
        description: 'QR code only',
        includesText: false
      },
      {
        name: 'detailed',
        description: 'QR code with detailed product info',
        includesText: true,
        textPosition: 'below'
      }
    ]
  };

  res.json(printerSettings);
});

// @route   POST /api/qr-codes/record-scan
// @desc    Record a QR code scan event (public, called when landing page is loaded via QR)
// @access  Public
router.post('/record-scan', async (req, res) => {
  try {
    const { productNo, batchNo, packageNo, sig } = req.body;

    if (!productNo || !batchNo) {
      return res.status(400).json({ error: 'productNo and batchNo are required' });
    }

    // ── Upgrade 1: HMAC Signature Verification (backwards-compatible) ──────
    const sigStatus = verifyQRSignature(productNo, batchNo, packageNo, sig);

    if (sigStatus === 'invalid') {
      // Log the fraud attempt
      await ScanLog.create({
        eventType: 'invalid_sig',
        productNo: productNo.toUpperCase(),
        batchNo,
        packageNo,
        signature: 'invalid',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(() => {});

      return res.status(403).json({
        error: 'Invalid QR signature. Counterfeit QR code detected.',
        counterfeit: true
      });
    }
    // ─────────────────────────────────────────────────────────────────────

    // Find the matching QR code
    const query = {
      productNo: productNo.toUpperCase(),
      batchNo: batchNo
    };

    if (packageNo) {
      query.packageNo = packageNo;
    }

    const qrCode = await QRCodeModel.findOne(query);

    if (!qrCode) {
      return res.status(404).json({ error: 'QR Code not found' });
    }

    // Update status and tracing info
    qrCode.status = 'scanned';
    qrCode.tracingInfo = qrCode.tracingInfo || {};
    qrCode.tracingInfo.qrScanned = true;
    qrCode.tracingInfo.scanCount = (qrCode.tracingInfo.scanCount || 0) + 1;
    qrCode.tracingInfo.lastScanDate = new Date();
    
    await qrCode.save();

    // Log successful scan event
    await ScanLog.create({
      eventType: 'success',
      productNo: productNo.toUpperCase(),
      batchNo,
      packageNo,
      signature: sigStatus,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {});

    res.json({
      success: true,
      message: 'QR scan recorded successfully',
      qrId: qrCode.qrId,
      status: qrCode.status
    });
  } catch (error) {
    console.error('Error recording QR scan:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/qr-codes/scan-logs
// @desc    Get all QR scan attempt logs (Upgrade 5: Traceability)
// @access  Private/Admin
router.get('/scan-logs', protect, qrAdmin, async (req, res) => {
  try {
    const { eventType, productNo, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (productNo) filter.productNo = productNo.toUpperCase();
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await ScanLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ScanLog.countDocuments(filter);

    res.json({
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get QR code by ID for printing
// ⚠️ MUST stay LAST among GET routes — wildcard /:id swallows any named route below it
router.get('/:id', protect, qrAdmin, async (req, res) => {
  try {
    const qrCode = await QRCodeModel.findById(req.params.id)
      .populate('product');

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json(qrCode);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
