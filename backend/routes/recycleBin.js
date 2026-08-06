const express = require('express');
const router = express.Router();
const RecycleBin = require('../models/RecycleBin');
const { protect, mainAdmin } = require('../middleware/authMiddleware');
const QRCodeModel = require('../models/QRCode');
const Member = require('../models/Member');
const Product = require('../models/Product');
const User = require('../models/User');

// @route   GET /api/recycle-bin
// @desc    Get all items in recycle bin
// @access  Private/MainAdmin
router.get('/', protect, mainAdmin, async (req, res) => {
  try {
    const items = await RecycleBin.find({}).sort({ deletedAt: -1 }).populate('deletedBy', 'name email role');
    res.json(items);
  } catch (err) {
    console.error('Error fetching recycle bin items:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/recycle-bin/restore/:id
// @desc    Restore a deleted item
// @access  Private/MainAdmin
router.post('/restore/:id', protect, mainAdmin, async (req, res) => {
  try {
    const binItem = await RecycleBin.findById(req.params.id);
    if (!binItem) {
      return res.status(404).json({ msg: 'Item not found in recycle bin' });
    }

    const { originalCollection, documentData } = binItem;
    
    let Model;
    switch (originalCollection) {
      case 'qrcodes':
        Model = QRCodeModel;
        break;
      case 'members':
        Model = Member;
        break;
      case 'products':
        Model = Product;
        break;
      case 'users':
        Model = User;
        break;
      default:
        return res.status(400).json({ msg: 'Unknown collection type' });
    }

    // Insert back into original collection
    const restoredDoc = new Model(documentData);
    await restoredDoc.save();

    // Remove from recycle bin
    await RecycleBin.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Item restored successfully', restoredDoc });
  } catch (err) {
    console.error('Error restoring recycle bin item:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Cannot restore: A duplicate item already exists in the system.' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/recycle-bin/:id
// @desc    Permanently delete an item
// @access  Private/MainAdmin
router.delete('/:id', protect, mainAdmin, async (req, res) => {
  try {
    const binItem = await RecycleBin.findById(req.params.id);
    if (!binItem) {
      return res.status(404).json({ msg: 'Item not found in recycle bin' });
    }

    await RecycleBin.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Item permanently deleted' });
  } catch (err) {
    console.error('Error permanently deleting recycle bin item:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/recycle-bin/empty
// @desc    Empty the recycle bin
// @access  Private/MainAdmin
router.delete('/empty', protect, mainAdmin, async (req, res) => {
  try {
    await RecycleBin.deleteMany({});
    res.json({ msg: 'Recycle bin emptied' });
  } catch (err) {
    console.error('Error emptying recycle bin:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
