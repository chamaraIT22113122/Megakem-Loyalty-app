const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const QRCodeModel = require('../models/QRCode');
const Product = require('../models/Product');
const { protect, qrAdmin, hasPermission } = require('../middleware/auth');

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

    const baseUrl = process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'https://chamarait22113122.github.io/Megakem-Loyalty-app';
    const generatedQRs = [];

    for (const productId of productIds) {
      const product = await Product.findById(productId);
      if (!product) continue;

      // Create unique QR ID
      const qrId = `${product.productNo}-${batchNo}-${packageNo || 'STD'}-${Date.now()}`;
      
      // Create QR link without path to prevent 404s on GitHub Pages
      const qrLink = customLink || `${baseUrl}/?p=${product.productNo}&b=${batchNo}&pkg=${packageNo}`;

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(qrLink, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 300
      });

      // Create QR code record
      const qrRecord = new QRCodeModel({
        qrId,
        product: productId,
        productName: product.name,
        productNo: product.productNo,
        batchNo,
        packageNo,
        manufactureDate,
        expiryDate,
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
          productCount: { $push: '$productNo' }
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

// Get QR code by ID for printing
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

    const baseUrl = process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'https://chamarait22113122.github.io/Megakem-Loyalty-app';
    const qrRecords = [];

    // Generate in chunks with the database to avoid memory issues and long transactions
    for (let i = start; i <= end; i++) {
      const pNo = `${packageNoPrefix}${i}`;
      const qrId = `${product.productNo}-${batchNo}-${pNo}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // The user wants the link and batch info in the QR without triggering 404s
      const qrLink = customLink || `${baseUrl}/?p=${product.productNo}&b=${batchNo}&pkg=${pNo}`;
      
      // Pipe delimited data as secondary info or for the scanner app
      const pipeData = `${product.productNo}|${product.name}|${batchNo}|${pNo}|${product.packSize || 'N/A'}`;

      const qrDataUrl = await QRCode.toDataURL(qrLink, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300
      });

      qrRecords.push({
        qrId,
        product: productId,
        productName: product.name,
        productNo: product.productNo,
        batchNo,
        packageNo: pNo,
        manufactureDate,
        expiryDate,
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

module.exports = router;
