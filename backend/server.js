const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const connectDB = require('./config/database');
const User = require('./models/User');
const Product = require('./models/Product');
const { performBackup } = require('./scripts/autoBackup');
const { restoreBackup } = require('./scripts/restoreBackup');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Initialize database and admin user
const initializeApp = async () => {
  try {
    const conn = await connectDB();
    if (!conn) return;
    
    try {
      // Check if products exist in database
      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        console.log('💡 Database is empty. Automatically restoring data from backup...');
        await restoreBackup(mongoose.connection);
      } else {
        console.log('📊 Existing database records found. Skipping automatic backup restore.');
      }
    } catch (restoreError) {
      console.error('⚠️  Error checking/restoring backup:', restoreError.message);
    }
    
    try {
      // Ensure admin user exists
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@megakem.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456!';
      
      const adminExists = await User.findOne({ email: adminEmail });
      if (!adminExists) {
        await User.create({
          username: 'admin',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          isActive: true
        });
        console.log('✅ Admin user created automatically');
        console.log(`📝 Admin login: ${adminEmail} | Password: ${adminPassword}`);
        console.log('⚠️  IMPORTANT: Change admin password after first login!');
      } else {
        console.log(`📝 Admin login: ${adminEmail}`);
      }
    } catch (error) {
      console.error('⚠️  Error with admin user:', error.message);
    }
  } catch (error) {
    console.warn('⚠️  Database not available, continuing without database');
  }
};

// Schedule daily backup at midnight (0 0 * * *)
cron.schedule('0 0 * * *', () => {
  performBackup();
});

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_PROD
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/scans', require('./routes/scans'));
app.use('/api/products', require('./routes/products'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/members', require('./routes/members'));
app.use('/api/loyalty', require('./routes/loyalty'));
app.use('/api/cash-rewards', require('./routes/cashRewards'));
app.use('/api/qr-codes', require('./routes/qrCode'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Megakem Loyalty API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Start server
const startServer = async () => {
  await initializeApp();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
  });
};

startServer();
// Trigger restart and verify database persistence
