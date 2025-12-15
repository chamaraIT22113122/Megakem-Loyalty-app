const jwt = require('jsonwebtoken');

/**
 * Security Configuration
 * Centralized security settings for the application
 */

const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    issuer: 'megakem-loyalty',
    audience: 'megakem-users'
  },

  // Password Requirements
  password: {
    minLength: 6,
    requireUppercase: false,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  },

  // Session Configuration
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour default
    refreshThreshold: parseInt(process.env.TOKEN_REFRESH_THRESHOLD) || 300000, // 5 minutes
    maxConcurrentSessions: 3
  },

  // Rate Limiting
  rateLimit: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100
    },
    auth: {
      windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || 15) * 60 * 1000,
      max: parseInt(process.env.MAX_LOGIN_ATTEMPTS || 5)
    },
    create: {
      windowMs: 60 * 1000, // 1 minute
      max: 30
    },
    strict: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10
    }
  },

  // CORS Configuration
  cors: {
    origins: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.FRONTEND_URL_PROD
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Security Headers
  headers: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }
};

/**
 * Generate JWT Token
 * @param {Object} payload - Token payload
 * @param {String} expiresIn - Token expiration
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = securityConfig.jwt.expiresIn) => {
  return jwt.sign(
    payload,
    securityConfig.jwt.secret,
    {
      expiresIn,
      issuer: securityConfig.jwt.issuer,
      audience: securityConfig.jwt.audience
    }
  );
};

/**
 * Verify JWT Token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, securityConfig.jwt.secret, {
      issuer: securityConfig.jwt.issuer,
      audience: securityConfig.jwt.audience
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Validate Password Strength
 * @param {String} password - Password to validate
 * @returns {Object} Validation result
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < securityConfig.password.minLength) {
    errors.push(`Password must be at least ${securityConfig.password.minLength} characters`);
  }
  
  if (securityConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (securityConfig.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (securityConfig.password.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (securityConfig.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize user input
 * @param {String} input - Input to sanitize
 * @returns {String} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potential XSS characters
  return input
    .replace(/[<>]/g, '')
    .trim();
};

module.exports = {
  securityConfig,
  generateToken,
  verifyToken,
  validatePassword,
  sanitizeInput
};
