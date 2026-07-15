const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'co-admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  totalScans: {
    type: Number,
    default: 0,
    min: 0
  },
  permissions: {
    canViewDashboard: {
      type: Boolean,
      default: true
    },
    canViewAdvancedInsights: {
      type: Boolean,
      default: false
    },
    canViewScans: {
      type: Boolean,
      default: false
    },
    canManageCoAdmins: {
      type: Boolean,
      default: false
    },
    canDelete: {
      type: Boolean,
      default: false
    },
    canExport: {
      type: Boolean,
      default: false
    },
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canViewRewards: {
      type: Boolean,
      default: false
    },
    canViewLeaderboard: {
      type: Boolean,
      default: false
    },
    canManageProducts: {
      type: Boolean,
      default: false
    },
    canManageQRCodes: {
      type: Boolean,
      default: false
    },
    canManageCoAdminRequests: {
      type: Boolean,
      default: false
    },
    canManageApplicators: {
      type: Boolean,
      default: false
    },
    canPrintQRCodes: {
      type: Boolean,
      default: false
    },
    canViewQRAnalytics: {
      type: Boolean,
      default: false
    }
  },
  adminType: {
    type: String,
    enum: ['super_admin', 'product_admin', 'qr_admin', 'analytics_admin'],
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
