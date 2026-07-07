const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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

app.use(cookieParser());
const initializeApp = async () => {
  try {
    const conn = await connectDB();
    if (!conn) {
      console.error('❌ FATAL: Database connection failed. Server cannot run without a database.');
      process.exit(1);
    }
    
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


    // ── Auto-fix member/scan roles based on memberId prefix ──────────────────
    // MA* → applicator  |  MH* / CUS-* → customer
    // Safe to run on every startup (updateMany with $ne guard = no-op when already correct)
    try {
      const Member = require('./models/Member');
      const Scan   = require('./models/Scan');

      const [mApp, mCustMH, mCustCUS, sApp, sCustMH, sCustCUS, mHwEquip] = await Promise.all([
        Member.updateMany({ memberId: { $regex: '^MA', $options: 'i' }, role: { $ne: 'applicator' } }, { $set: { role: 'applicator' } }),
        Member.updateMany({ memberId: { $regex: '^MH', $options: 'i' }, role: { $ne: 'customer'   } }, { $set: { role: 'customer'   } }),
        Member.updateMany({ memberId: { $regex: '^CUS-', $options: 'i' }, role: { $ne: 'customer' } }, { $set: { role: 'customer'   } }),
        Scan.updateMany(  { memberId: { $regex: '^MA', $options: 'i' }, role: { $ne: 'applicator' } }, { $set: { role: 'applicator' } }),
        Scan.updateMany(  { memberId: { $regex: '^MH', $options: 'i' }, role: { $ne: 'customer'   } }, { $set: { role: 'customer'   } }),
        Scan.updateMany(  { memberId: { $regex: '^CUS-', $options: 'i' }, role: { $ne: 'customer' } }, { $set: { role: 'customer'   } }),
        // Ensure all MH members have equipment:'Hardware' so the Hardwares tab filter works
        Member.updateMany(
          { memberId: { $regex: '^MH', $options: 'i' }, equipment: { $in: [null, '', undefined] } },
          { $set: { equipment: 'Hardware' } }
        ),
      ]);

      const membersFixed = (mApp.modifiedCount || 0) + (mCustMH.modifiedCount || 0) + (mCustCUS.modifiedCount || 0);
      const scansFixed   = (sApp.modifiedCount || 0) + (sCustMH.modifiedCount || 0) + (sCustCUS.modifiedCount || 0);
      const equipFixed   = mHwEquip.modifiedCount || 0;

      if (membersFixed > 0 || scansFixed > 0 || equipFixed > 0) {
        console.log(`🔧 Role migration: fixed ${membersFixed} member(s), ${scansFixed} scan(s), ${equipFixed} hardware equipment field(s)`);
      } else {
        console.log('✅ Role migration: all member/scan roles are already correct');
      }
    } catch (roleFixError) {
      console.error('⚠️  Error during role auto-fix:', roleFixError.message);
    }
    // ─────────────────────────────────────────────────────────────────────────

  } catch (error) {
    console.error('❌ FATAL: Database initialization failed:', error.message);
    process.exit(1);
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
  'https://chamarait22113122.github.io',
  'https://chamarait22113122.github.io/Megakem-Loyalty-app',
  'https://www.megakemrewards.com',
  'https://megakemrewards.com',
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/scans', require('./routes/scans'));
app.use('/api/products', require('./routes/products'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/members', require('./routes/members'));
app.use('/api/loyalty', require('./routes/loyalty'));
app.use('/api/cash-rewards', require('./routes/cashRewards'));
app.use('/api/qr-codes', require('./routes/qrCode'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/redemptions', require('./routes/redemptions'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Megakem Rewards API is running',
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
