const express = require('express');
const router = express.Router();
const Scan = require('../models/Scan');
const User = require('../models/User');
const Member = require('../models/Member');
const Product = require('../models/Product');
const LoyaltyConfig = require('../models/LoyaltyConfig');
const { optionalAuth, protect, authorize } = require('../middleware/auth');

// @route   GET /api/scans
// @desc    Get all scans (with pagination and filters)
// @access  Public (but optionally authenticated)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, role, memberId, phone } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (memberId) query.memberId = memberId.toUpperCase();
    if (phone) {
      // Search in both phone field and memberId field (for old records)
      query.$or = [
        { phone: phone.trim() },
        { memberId: { $regex: phone.trim(), $options: 'i' } }
      ];
    }

    const scans = await Scan.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Scan.countDocuments(query);

    res.json({
      success: true,
      data: scans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/scans/live
// @desc    Get recent scans for live feed (last 100)
// @access  Public
router.get('/live', async (req, res) => {
  try {
    const scans = await Scan.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: scans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/scans/:id
// @desc    Get single scan
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    res.json({
      success: true,
      data: scan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/scans
// @desc    Create new scan
// @access  Public (anonymous allowed)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      memberName,
      memberId,
      role,
      productName,
      productNo,
      batchNo,
      bagNo,
      qty
    } = req.body;

    // Check for duplicate scan - check if this batch number has been scanned by the same role
    const duplicateScan = await Scan.findOne({
      batchNo,
      role  // Check within the same role only
    });

    if (duplicateScan) {
      return res.status(400).json({
        success: false,
        message: `This batch number (${batchNo}) has already been scanned by a ${role}`,
        duplicate: true
      });
    }

    // Try to get product price and points if not provided
    let productPrice = req.body.price;
    let productPoints = 0;
    
    if (productNo) {
      // First try to find exact match with product code and pack size (category)
      let product = await Product.findOne({ 
        productNo: productNo.toUpperCase(),
        category: qty ? qty.toUpperCase() : undefined
      });
      
      // If no exact match, try to find by product code and check pack size pricing
      if (!product) {
        product = await Product.findOne({ 
          productNo: productNo.toUpperCase() 
        });
        
        if (product && qty) {
          // Check if product has pack size specific pricing
          if (product.packSizePricing && product.packSizePricing.length > 0) {
            const packSizePricing = product.packSizePricing.find(ps => 
              ps.packSize.toUpperCase() === qty.toUpperCase()
            );
            if (packSizePricing && (!productPrice || productPrice === 0)) {
              productPrice = packSizePricing.price;
            }
          }
        }
      }
      
      // Use default price if no specific pricing found
      if (product && (!productPrice || productPrice === 0)) {
        productPrice = product.price || 0;
      }
      
      // Calculate loyalty points based on product configuration
      if (product) {
        // Check if product has pack-size specific points
        if (product.pointsPerPackSize && product.pointsPerPackSize.length > 0 && qty) {
          const packPoints = product.pointsPerPackSize.find(ps => 
            ps.packSize.toUpperCase() === qty.toUpperCase()
          );
          if (packPoints) {
            productPoints = packPoints.points || 0;
          }
        }
        
        // If no pack-size points, check for fixed points per product
        if (productPoints === 0 && product.pointsPerProduct !== null && product.pointsPerProduct !== undefined) {
          productPoints = product.pointsPerProduct;
        }
        
        // If no fixed points, use price-based calculation (1 point per 1000 Rs)
        if (productPoints === 0 && productPrice > 0) {
          productPoints = Math.floor(productPrice / 1000);
        }
      }
    }

    const scanData = {
      memberName,
      memberId: memberId.toUpperCase(),
      role,
      productName,
      productNo,
      batchNo,
      bagNo,
      qty,
      price: productPrice || 0,
      points: productPoints
    };

    // Add user ID if authenticated
    if (req.user) {
      scanData.userId = req.user._id;
    }

    const scan = await Scan.create(scanData);

    // Create or update member from scan
    await updateMemberFromScan(scan);

    // Update scan count if user is authenticated
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.totalScans += 1;
        await user.save();
      }
    }

    res.status(201).json({
      success: true,
      data: scan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/scans/batch
// @desc    Create multiple scans at once
// @access  Public (anonymous allowed)
router.post('/batch', optionalAuth, async (req, res) => {
  try {
    const { scans } = req.body;

    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Scans array is required'
      });
    }

    // Check for duplicates and filter them out
    const validScans = [];
    const duplicates = [];

    for (const scan of scans) {
      const duplicateScan = await Scan.findOne({
        batchNo: scan.batchNo,
        role: scan.role  // Check within the same role only
      });

      if (duplicateScan) {
        duplicates.push({
          productName: scan.productName,
          batchNo: scan.batchNo,
          bagNo: scan.bagNo
        });
      } else {
        // Try to get product price and points if not provided
        let productPrice = scan.price;
        let productPoints = 0;
        
        if (scan.productNo) {
          // Try to find product
          let product = await Product.findOne({ 
            productNo: scan.productNo.toUpperCase(),
            category: scan.qty ? scan.qty.toUpperCase() : undefined
          });
          
          if (!product) {
            product = await Product.findOne({ 
              productNo: scan.productNo.toUpperCase() 
            });
          }
          
          if (product) {
            // Get price
            if (!productPrice || productPrice === 0) {
              if (product.packSizePricing && product.packSizePricing.length > 0 && scan.qty) {
                const packSizePricing = product.packSizePricing.find(ps => 
                  ps.packSize.toUpperCase() === scan.qty.toUpperCase()
                );
                if (packSizePricing) {
                  productPrice = packSizePricing.price;
                }
              }
              if (!productPrice) {
                productPrice = product.price || 0;
              }
            }
            
            // Calculate points
            if (product.pointsPerPackSize && product.pointsPerPackSize.length > 0 && scan.qty) {
              const packPoints = product.pointsPerPackSize.find(ps => 
                ps.packSize.toUpperCase() === scan.qty.toUpperCase()
              );
              if (packPoints) {
                productPoints = packPoints.points || 0;
              }
            }
            
            if (productPoints === 0 && product.pointsPerProduct !== null && product.pointsPerProduct !== undefined) {
              productPoints = product.pointsPerProduct;
            }
            
            if (productPoints === 0 && productPrice > 0) {
              productPoints = Math.floor(productPrice / 1000);
            }
          }
        }

        validScans.push({
          ...scan,
          memberId: scan.memberId.toUpperCase(),
          price: productPrice || 0,
          points: productPoints,
          userId: req.user ? req.user._id : undefined
        });
      }
    }

    if (validScans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All scans are duplicates. No new scans were added.',
        duplicates
      });
    }

    const createdScans = await Scan.insertMany(validScans);

    // Create or update members from scans
    for (const scan of createdScans) {
      await updateMemberFromScan(scan);
    }

    // Update scan count if user is authenticated
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.totalScans += createdScans.length;
        await user.save();
      }
    }

    res.status(201).json({
      success: true,
      count: createdScans.length,
      data: createdScans,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      message: duplicates.length > 0 
        ? `${createdScans.length} scans added successfully. ${duplicates.length} duplicates were skipped.`
        : undefined
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/scans/:id
// @desc    Delete scan
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    await scan.deleteOne();

    res.json({
      success: true,
      message: 'Scan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/scans/stats/summary
// @desc    Get scan statistics
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    const totalScans = await Scan.countDocuments();
    const applicatorScans = await Scan.countDocuments({ role: 'applicator' });
    const customerScans = await Scan.countDocuments({ role: 'customer' });
    
    // Get scans from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentScans = await Scan.countDocuments({ 
      timestamp: { $gte: yesterday } 
    });

    // Get scans from last 7 days
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyScans = await Scan.countDocuments({ 
      timestamp: { $gte: lastWeek } 
    });

    // Get daily breakdown for last 7 days
    const dailyStats = await Scan.aggregate([
      {
        $match: {
          timestamp: { $gte: lastWeek }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get top products
    const topProducts = await Scan.aggregate([
      {
        $group: {
          _id: "$productName",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalScans,
        applicator: applicatorScans,
        customer: customerScans,
        last24Hours: recentScans,
        lastWeek: weeklyScans,
        dailyStats,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper function to calculate points for a scan
async function calculatePointsForScan(scan) {
  try {
    // Get loyalty config
    const config = await LoyaltyConfig.getConfig();
    const pointsConfig = config.pointsCalculation || { method: 'price_based', priceDivisor: 1000, applicatorBonus: 0.1 };

    // Find product
    const product = await Product.findOne({ 
      productNo: scan.productNo.toUpperCase() 
    });

    let basePoints = 0;

    // Calculate base points based on method
    if (pointsConfig.method === 'product_based' && product) {
      // Use product-specific points
      if (product.pointsPerProduct) {
        basePoints = product.pointsPerProduct;
      } else if (product.pointsPerPackSize && scan.qty) {
        const packSizePoints = product.pointsPerPackSize.find(p => 
          p.packSize.toLowerCase() === scan.qty.toLowerCase()
        );
        if (packSizePoints) {
          basePoints = packSizePoints.points;
        }
      }
    } else if (pointsConfig.method === 'price_based' && scan.price) {
      // Price-based calculation
      basePoints = Math.floor(scan.price / (pointsConfig.priceDivisor || 1000));
    }

    // Add bonus for applicators
    let totalPoints = basePoints;
    if (scan.role === 'applicator' && pointsConfig.applicatorBonus) {
      const bonus = Math.floor(basePoints * pointsConfig.applicatorBonus);
      totalPoints = basePoints + bonus;
    }

    return totalPoints;
  } catch (error) {
    console.error('Error calculating points:', error);
    return 0;
  }
}

// Helper function to create or update member from scan
async function updateMemberFromScan(scan) {
  try {
    const memberId = scan.memberId.toUpperCase();
    
    // Find or create member
    let member = await Member.findOne({ memberId });
    
    if (!member) {
      // Create new member
      member = await Member.create({
        memberId,
        memberName: scan.memberName,
        phone: scan.phone || '',
        role: scan.role,
        points: 0,
        totalScans: 0,
        location: scan.location || ''
      });
    } else {
      // Update member info if needed
      if (scan.memberName && !member.memberName) {
        member.memberName = scan.memberName;
      }
      if (scan.phone && !member.phone) {
        member.phone = scan.phone;
      }
      if (scan.location && !member.location) {
        member.location = scan.location;
      }
    }

    // Use points from scan (already calculated during scan creation)
    const pointsEarned = scan.points || 0;
    member.points += pointsEarned;
    member.totalScans += 1;
    member.lastScanDate = scan.timestamp || new Date();

    // Track monthly purchase value for cash rewards (only for applicators)
    if (scan.role === 'applicator' && scan.price && scan.price > 0) {
      const scanDate = scan.timestamp || new Date();
      const year = scanDate.getFullYear();
      const month = scanDate.getMonth() + 1; // getMonth() returns 0-11
      member.addMonthlyPurchase(scan.price, year, month);
    }

    // Update tier
    const config = await LoyaltyConfig.getConfig();
    member.updateTier(config.tierThresholds);

    await member.save();
    return member;
  } catch (error) {
    console.error('Error updating member from scan:', error);
    throw error;
  }
}

// @route   POST /api/scans/sync-members
// @desc    Sync members from all existing scans (one-time operation)
// @access  Private/Admin
router.post('/sync-members', protect, authorize('admin'), async (req, res) => {
  try {
    const allScans = await Scan.find().sort({ timestamp: 1 });
    let created = 0;
    let updated = 0;

    for (const scan of allScans) {
      try {
        const memberId = scan.memberId.toUpperCase();
        let member = await Member.findOne({ memberId });

        if (!member) {
          // Create new member
          member = await Member.create({
            memberId,
            memberName: scan.memberName,
            phone: scan.phone || '',
            role: scan.role,
            points: 0,
            totalScans: 0,
            location: scan.location || ''
          });
          created++;
        } else {
          updated++;
        }

        // Recalculate points for this scan and add to member
        const pointsEarned = await calculatePointsForScan(scan);
        member.points += pointsEarned;
        member.totalScans += 1;
        
        if (scan.timestamp && (!member.lastScanDate || scan.timestamp > member.lastScanDate)) {
          member.lastScanDate = scan.timestamp;
        }

        // Update tier
        const config = await LoyaltyConfig.getConfig();
        member.updateTier(config.tierThresholds);

        await member.save();
      } catch (error) {
        console.error(`Error processing scan ${scan._id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Synced members from scans. Created: ${created}, Updated: ${updated}`,
      data: {
        created,
        updated,
        totalScans: allScans.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
