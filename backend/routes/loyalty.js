const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const LoyaltyConfig = require('../models/LoyaltyConfig');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// @route   GET /api/loyalty/config
// @desc    Get loyalty configuration
// @access  Private/Admin
router.get('/config', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const config = await LoyaltyConfig.getConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/loyalty/config
// @desc    Update loyalty configuration
// @access  Private/Admin
router.put('/config', protect, [
  body('tierThresholds.bronze').optional().isInt({ min: 0 }),
  body('tierThresholds.silver').optional().isInt({ min: 0 }),
  body('tierThresholds.gold').optional().isInt({ min: 0 }),
  body('tierThresholds.platinum').optional().isInt({ min: 0 }),
  body('pointsCalculation.method').optional().isIn(['price_based', 'product_based', 'fixed']),
  body('pointsCalculation.priceDivisor').optional().isFloat({ min: 1 }),
  body('pointsCalculation.applicatorBonus').optional().isFloat({ min: 0, max: 1 })
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const config = await LoyaltyConfig.getConfig();
    
    if (req.body.tierThresholds) {
      config.tierThresholds = { ...config.tierThresholds, ...req.body.tierThresholds };
    }
    
    if (req.body.pointsCalculation) {
      config.pointsCalculation = { ...config.pointsCalculation, ...req.body.pointsCalculation };
    }

    await config.save();

    res.json({
      success: true,
      data: config,
      message: 'Loyalty configuration updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/loyalty/products/:id/points
// @desc    Update product points configuration
// @access  Private/Admin
router.put('/products/:id/points', protect, [
  body('pointsPerProduct')
    .optional()
    .custom((value) => {
      if (value === null || value === '' || value === undefined) return true;
      return Number.isInteger(Number(value)) && Number(value) >= 0;
    })
    .withMessage('Points per product must be a non-negative integer or null'),
  body('pointsPerPackSize').optional().isArray()
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (req.body.pointsPerProduct !== undefined) {
      // Convert empty string or null to null
      const pointsValue = req.body.pointsPerProduct === '' || req.body.pointsPerProduct === null 
        ? null 
        : parseInt(req.body.pointsPerProduct);
      product.pointsPerProduct = pointsValue;
    }
    
    if (req.body.pointsPerPackSize !== undefined) {
      product.pointsPerPackSize = req.body.pointsPerPackSize;
    }

    await product.save();

    res.json({
      success: true,
      data: {
        id: product._id,
        name: product.name,
        productNo: product.productNo,
        pointsPerProduct: product.pointsPerProduct,
        pointsPerPackSize: product.pointsPerPackSize
      },
      message: 'Product points configuration updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

