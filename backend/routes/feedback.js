const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const LoyaltyConfig = require('../models/LoyaltyConfig');
const nodemailer = require('nodemailer');
const dns = require('dns');

// Helper to create a nodemailer transporter bound to IPv4
const createIPv4Transporter = () => {
  return new Promise((resolve, reject) => {
    const smtpHost = (process.env.SMTP_HOST || 'smtp-mail.outlook.com').replace(/['"]/g, '').trim();
    const smtpPort = parseInt((process.env.SMTP_PORT || '587').toString().replace(/['"]/g, '').trim(), 10);
    const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.replace(/['"]/g, '').trim() : '';
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/['"]/g, '').trim() : '';

    dns.lookup(smtpHost, { family: 4 }, (err, address) => {
      if (err) {
        return reject(err);
      }
      const transporter = nodemailer.createTransport({
        host: address,
        port: smtpPort,
        secure: false, // true for 465, false for other ports
        auth: {
          user: smtpUser, 
          pass: smtpPass, 
        },
        tls: {
          ciphers: 'SSLv3',
          servername: smtpHost
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });
      resolve({ transporter, smtpUser });
    });
  });
};

// Helper function to send email
const sendFeedbackEmail = async (feedback, redirectEmail, baseUrl = '') => {
  if (!redirectEmail) {
    feedback.emailStatus = 'skipped';
    feedback.emailError = 'No redirect email configured';
    await feedback.save();
    return;
  }

  try {
    const { transporter, smtpUser } = await createIPv4Transporter();

    // Determine user info
    let userInfo = '';
    if (feedback.userType === 'customer') {
      userInfo = `<p><strong>Name:</strong> ${feedback.name}</p><p><strong>Phone:</strong> ${feedback.phone}</p>`;
    } else {
      userInfo = `<p><strong>Applicator ID:</strong> ${feedback.applicatorId}</p>`;
    }

    // Images
    let imagesHtml = '';
    if (feedback.imageUrls && feedback.imageUrls.length > 0) {
      imagesHtml = '<h3>Attached Images:</h3><div>' + 
        feedback.imageUrls.map(url => {
          const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
          return `<div style="margin-bottom: 15px;">
            <a href="${fullUrl}" target="_blank">
              <img src="${fullUrl}" alt="Attached Feedback Image" style="max-width: 400px; max-height: 400px; border: 1px solid #ddd; border-radius: 4px; display: block;" />
            </a>
          </div>`;
        }).join('') +
        '</div>';
    }

    const htmlContent = `
      <h2>New Feedback Received</h2>
      <p><strong>User Type:</strong> ${feedback.userType}</p>
      ${userInfo}
      <p><strong>Batch Number:</strong> ${feedback.batchNumber || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="background: #f9f9f9; border-left: 10px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px;">
        ${feedback.message}
      </blockquote>
      ${imagesHtml}
      <hr />
      <p><small>Sent from Megakem Loyalty App</small></p>
    `;

    await transporter.sendMail({
      from: `"Megakem Feedback" <${smtpUser || 'no-reply@megakem.com'}>`, // sender address
      to: redirectEmail, // list of receivers
      subject: `New Feedback from ${feedback.userType === 'customer' ? feedback.name : feedback.applicatorId}`, // Subject line
      html: htmlContent, // html body
    });
    
    console.log('Feedback email sent successfully to', redirectEmail);
    feedback.emailStatus = 'sent';
    feedback.emailError = '';
    await feedback.save();
  } catch (error) {
    console.error('Error sending feedback email:', error);
    feedback.emailStatus = 'failed';
    feedback.emailError = error.message;
    await feedback.save();
  }
};

// @route   GET /api/feedback/test-smtp
// @desc    Test SMTP connection directly
// @access  Public
router.get('/test-smtp', async (req, res) => {
  try {
    const { transporter, smtpUser } = await createIPv4Transporter();

    const info = await transporter.sendMail({
      from: `"Megakem Feedback" <${smtpUser || 'no-reply@megakem.com'}>`,
      to: 'lahin@megakemglobal.com',
      subject: 'SMTP Test from Render',
      text: 'This is a direct SMTP test from the Render backend.'
    });

    res.status(200).json({ success: true, info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});
// @desc    Get feedback settings
// @access  Private/Admin
router.get('/settings', async (req, res) => {
  try {
    const config = await LoyaltyConfig.getConfig();
    res.status(200).json({
      success: true,
      data: {
        feedbackRedirectEmail: config.feedbackRedirectEmail || ''
      }
    });
  } catch (error) {
    console.error('Error fetching feedback settings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/feedback/settings
// @desc    Update feedback settings
// @access  Private/Admin
router.post('/settings', async (req, res) => {
  try {
    const { feedbackRedirectEmail } = req.body;
    const config = await LoyaltyConfig.getConfig();
    config.feedbackRedirectEmail = feedbackRedirectEmail;
    await config.save();
    
    res.status(200).json({
      success: true,
      data: {
        feedbackRedirectEmail: config.feedbackRedirectEmail
      }
    });
  } catch (error) {
    console.error('Error updating feedback settings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/feedback
// @desc    Submit new feedback
// @access  Public (or protected based on needs, typically authenticated users)
router.post('/', async (req, res) => {
  try {
    const { userType, name, phone, applicatorId, role, batchNumber, message, imageUrls } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    if (userType === 'customer') {
      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and Phone Number are required for customers' });
      }
    } else {
      if (!applicatorId) {
        return res.status(400).json({ success: false, message: 'Applicator ID is required' });
      }
    }

    // Generate a unique complaint number: FB-YYMMDD-XXXX
    const now = new Date();
    const dateString = now.getFullYear().toString().slice(2) + 
                       String(now.getMonth() + 1).padStart(2, '0') + 
                       String(now.getDate()).padStart(2, '0');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const complaintNumber = `FB-${dateString}-${randomDigits}`;

    const feedback = new Feedback({
      userType: userType || 'applicator',
      name,
      phone,
      applicatorId,
      role,
      batchNumber,
      complaintNumber,
      message,
      imageUrls
    });

    await feedback.save();

    // Fetch config and send email if configured (Temporarily disabled due to Render firewall)
    // const config = await LoyaltyConfig.getConfig();
    // if (config && config.feedbackRedirectEmail) {
    //   const baseUrl = `${req.protocol}://${req.get('host')}`;
    //   // Run asynchronously without blocking the response
    //   sendFeedbackEmail(feedback, config.feedbackRedirectEmail, baseUrl);
    // }

    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/feedback
// @desc    Get all feedbacks
// @access  Private/Admin
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete a feedback
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    await feedback.deleteOne();
    res.status(200).json({ success: true, message: 'Feedback deleted' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
