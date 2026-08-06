const express = require('express');
const router = express.Router();
const ChangeRequest = require('../models/ChangeRequest');
const RecycleBin = require('../models/RecycleBin');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Create a new change request
router.post('/', protect, async (req, res) => {
  try {
    const { actionType, entityType, entityId, endpoint, method, payload, reason } = req.body;
    
    // Find the manager for this user
    let managerAdminId = null;
    if (req.user.managerAdminId) {
      managerAdminId = req.user.managerAdminId;
    }

    const changeRequest = new ChangeRequest({
      requesterId: req.user._id,
      managerAdminId,
      actionType,
      entityType,
      entityId,
      endpoint,
      method,
      payload,
      reason
    });

    await changeRequest.save();

    // Notify logic can be added here if needed (e.g. socket.io)

    res.status(201).json({
      success: true,
      message: 'Change request submitted for approval',
      data: changeRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get change requests
router.get('/', protect, async (req, res) => {
  try {
    const isMainAdmin = req.user.email === 'admin@megakem.com' || (req.user.role === 'admin' && !req.user.permissions);
    
    let query = {};
    if (!isMainAdmin) {
      // If not main admin, only show requests assigned to this admin or where they are the requester
      query = { 
        $or: [
          { managerAdminId: req.user._id },
          { requesterId: req.user._id }
        ]
      };
    }

    const requests = await ChangeRequest.find(query)
      .populate('requesterId', 'username email role')
      .populate('managerAdminId', 'username email')
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve and execute request
router.put('/:id/approve', protect, async (req, res) => {
  try {
    const request = await ChangeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request is already ' + request.status });
    }

    const isMainAdmin = req.user.email === 'admin@megakem.com' || (req.user.role === 'admin' && !req.user.permissions);
    
    if (!isMainAdmin && request.managerAdminId && request.managerAdminId.toString() !== req.user._id.toString()) {
       return res.status(403).json({ success: false, error: 'You are not authorized to approve this request' });
    }

    // Execute the request
    // Generate a temporary admin token to bypass restrictions during execution
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const tempAdminToken = jwt.sign(
      { id: req.user._id, role: 'admin' }, 
      jwtSecret, 
      { expiresIn: '1m' }
    );

    const baseUrl = `http://localhost:${process.env.PORT || 5000}`;
    const url = `${baseUrl}${request.endpoint}`;

    try {
      const axiosConfig = {
        method: request.method,
        url: url,
        data: request.payload,
        headers: {
          'Authorization': `Bearer ${tempAdminToken}`,
          'X-Bypass-Approval': 'true' // Special header to prevent infinite loops
        }
      };

      const response = await axios(axiosConfig);

      request.status = 'approved';
      request.reviewedBy = req.user._id;
      request.reviewedAt = Date.now();
      await request.save();

      res.json({ 
        success: true, 
        message: 'Request approved and executed successfully',
        executionResult: response.data
      });
    } catch (execError) {
      request.status = 'failed';
      request.executionError = execError.response ? JSON.stringify(execError.response.data) : execError.message;
      request.reviewedBy = req.user._id;
      request.reviewedAt = Date.now();
      await request.save();

      res.status(500).json({ 
        success: false, 
        error: 'Request approved but execution failed', 
        details: request.executionError 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject request
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const request = await ChangeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request is already ' + request.status });
    }

    const isMainAdmin = req.user.email === 'admin@megakem.com' || (req.user.role === 'admin' && !req.user.permissions);
    
    if (!isMainAdmin && request.managerAdminId && request.managerAdminId.toString() !== req.user._id.toString()) {
       return res.status(403).json({ success: false, error: 'You are not authorized to reject this request' });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = Date.now();
    await request.save();

    res.json({ success: true, message: 'Request rejected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete request
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await ChangeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const isMainAdmin = req.user.email === 'admin@megakem.com' || (req.user.role === 'admin' && !req.user.permissions);
    
    if (!isMainAdmin && request.requesterId.toString() !== req.user._id.toString()) {
       return res.status(403).json({ success: false, error: 'You can only delete your own requests' });
    }

    if (request.status !== 'pending') {
       return res.status(400).json({ success: false, error: 'Cannot delete processed requests' });
    }

    // Save to recycle bin
    const binItem = new RecycleBin({
      originalCollection: 'changerequests',
      documentId: request._id,
      documentData: request.toObject(),
      summary: `Change Request: ${request.actionType || 'Action'} on ${request.entityType || 'Entity'}`,
      deletedBy: req.user._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    await binItem.save();

    await request.deleteOne();
    res.json({ success: true, message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
