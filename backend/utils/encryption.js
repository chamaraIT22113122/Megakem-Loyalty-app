const crypto = require('crypto');

// Get encryption key from environment variable or use a fallback for local development
// WARNING: In production, always set BACKUP_ENCRYPTION_KEY in .env to a secure 32-character string.
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'megakem-loyalty-fallback-key-32b'; 
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16 bytes

const zlib = require('zlib');

/**
 * Encrypts a string (e.g., JSON data)
 * @param {string} text - The text to encrypt
 * @param {boolean} compress - Whether to apply gzip compression before encrypting
 * @returns {string} - The IV, compression flag, and encrypted data separated by colons
 */
const encryptData = (text, compress = true) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
  
  let dataToEncrypt = text;
  if (compress) {
    dataToEncrypt = zlib.gzipSync(Buffer.from(text, 'utf8'));
  }

  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
  let encrypted = cipher.update(dataToEncrypt, compress ? null : 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + (compress ? ':1:' : ':0:') + encrypted;
};

/**
 * Decrypts data encrypted by encryptData
 * @param {string} encryptedText - The text to decrypt (format: iv:encryptedData OR iv:isCompressed:encryptedData)
 * @returns {string} - The decrypted text
 */
const decryptData = (encryptedText) => {
  const textParts = encryptedText.split(':');
  
  let iv, isCompressed, encryptedData;
  if (textParts.length === 2) {
    // Legacy uncompressed format (iv:encryptedData)
    iv = Buffer.from(textParts[0], 'hex');
    isCompressed = false;
    encryptedData = textParts[1];
  } else if (textParts.length === 3) {
    // New format (iv:isCompressed:encryptedData)
    iv = Buffer.from(textParts[0], 'hex');
    isCompressed = textParts[1] === '1';
    encryptedData = textParts[2];
  } else {
    throw new Error('Invalid encrypted format');
  }
  
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
  
  if (isCompressed) {
    let decryptedBuffer = decipher.update(encryptedData, 'hex');
    const finalBuffer = decipher.final();
    decryptedBuffer = Buffer.concat([decryptedBuffer, finalBuffer]);
    return zlib.gunzipSync(decryptedBuffer).toString('utf8');
  } else {
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
};

module.exports = {
  encryptData,
  decryptData
};
