const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize, hasPermission } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('📦 GET /api/products - Request received');
    const { search, category, isActive } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productNo: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    // Only filter by isActive if explicitly provided in query
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    console.log('📦 Query:', JSON.stringify(query));
    const products = await Product.find(query).sort({ name: 1 });
    console.log('📦 Found products:', products.length);
    console.log('📦 Products:', products.map(p => ({ name: p.name, code: p.productNo })));

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/products/sync-loyalty-status
// @desc    Sync loyalty status based on points (bulk action)
// @access  Private (Admin only)
router.post('/sync-loyalty-status', protect, hasPermission('canManageProducts'), async (req, res) => {
  try {
    const products = await Product.find({});
    let updatedCount = 0;

    for (const product of products) {
      const shouldBeEnabled = (product.pointsPerProduct !== null && product.pointsPerProduct !== undefined);
      if (product.isLoyaltyEnabled !== shouldBeEnabled) {
        product.isLoyaltyEnabled = shouldBeEnabled;
        await product.save();
        updatedCount++;
      }
    }

    // Audit Log
    await logAction(req, 'BULK_SYNC_LOYALTY', 'PRODUCTS', { 
      updatedCount 
    });

    res.status(200).json({
      success: true,
      message: `Successfully updated loyalty status for ${updatedCount} products.`,
      updatedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin only)
router.post('/', protect, hasPermission('canManageProducts'), async (req, res) => {
  try {
    const product = await Product.create(req.body);

    // Audit Log
    await logAction(req, 'CREATE_PRODUCT', 'PRODUCTS', { 
      productId: product._id, 
      productName: product.name,
      productNo: product.productNo 
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put('/:id', protect, hasPermission('canManageProducts'), async (req, res) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const newPrice = req.body.price !== undefined ? Number(req.body.price) : undefined;
    const oldPrice = oldProduct.price || 0;

    // RBAC: Only admins can alter prices
    if (newPrice !== undefined && newPrice !== oldPrice) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only administrators can alter prices.'
        });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // If price or packSizePricing changed, record history in the array
    const newPackSizePricing = req.body.packSizePricing;
    const oldPackSizePricing = oldProduct.packSizePricing || [];
    let packSizeChanged = false;
    if (newPackSizePricing) {
        packSizeChanged = JSON.stringify(oldPackSizePricing) !== JSON.stringify(newPackSizePricing);
    }

    if ((newPrice !== undefined && newPrice !== oldPrice) || packSizeChanged) {
      product.priceHistory.push({
        price: oldPrice,
        packSizePricing: oldPackSizePricing,
        changedAt: new Date(),
        changedBy: req.user ? req.user.id : null
      });
      await product.save();
    }

    // Audit Log
    await logAction(req, 'UPDATE_PRODUCT', 'PRODUCTS', { 
      productId: product._id, 
      updates: req.body 
    });

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id', protect, hasPermission('canManageProducts'), hasPermission('canDelete'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const productData = { 
      productId: product._id, 
      productName: product.name,
      productNo: product.productNo 
    };

    await product.deleteOne();

    // Audit Log
    await logAction(req, 'DELETE_PRODUCT', 'PRODUCTS', productData);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
