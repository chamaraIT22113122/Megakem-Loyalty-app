const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Uploads a file to Google Drive using Service Account credentials.
 * @param {string} filePath - Absolute path to the local file to upload.
 * @param {string} fileName - Name of the file as it should appear in Google Drive.
 * @returns {Promise<Object|null>} - Returns the uploaded file data or null if upload fails.
 */
const uploadToGoogleDrive = async (filePath, fileName) => {
  try {
    const KEY_PATH = path.join(__dirname, '../config/google-service-account.json');
    
    // Check if credentials file exists
    if (!fs.existsSync(KEY_PATH)) {
      console.warn('⚠️ Google Drive Sync Skipped: google-service-account.json not found.');
      return null;
    }

    let FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID_BACKUPS || process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Also try to get it from the database configuration if enabled
    try {
      const LoyaltyConfig = require('../models/LoyaltyConfig');
      const config = await LoyaltyConfig.getConfig();
      if (config && config.cloudSync && config.cloudSync.gcpEnabled && config.cloudSync.googleDriveFolderId) {
        FOLDER_ID = config.cloudSync.googleDriveFolderId;
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch LoyaltyConfig for Google Drive ID:', e.message);
    }

    if (!FOLDER_ID) {
      console.warn('⚠️ Google Drive Sync Skipped: GOOGLE_DRIVE_FOLDER_ID_BACKUPS not set in .env and not configured in DB.');
      return null;
    }

    // Authenticate
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // File metadata
    const fileMetadata = {
      name: fileName,
      parents: [FOLDER_ID]
    };

    // Media content
    const media = {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(filePath)
    };

    console.log(`☁️ Uploading ${fileName} to Google Drive...`);
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name'
    });

    console.log(`✅ Successfully uploaded ${fileName} to Google Drive (ID: ${response.data.id})`);
    return response.data;

  } catch (error) {
    console.error('❌ Failed to upload backup to Google Drive:', error.message);
    return null;
  }
};

/**
 * Uploads an image to Google Drive, makes it public, and returns the shareable link.
 * @param {string} filePath - Absolute path to the local file to upload.
 * @param {string} fileName - Name of the file as it should appear in Google Drive.
 * @param {string} mimeType - MIME type of the file.
 * @returns {Promise<Object|null>} - Returns { id, webViewLink, webContentLink } or null if fails.
 */
const uploadImageToGoogleDrive = async (filePath, fileName, mimeType = 'image/jpeg') => {
  try {
    const KEY_PATH = path.join(__dirname, '../config/google-service-account.json');
    
    if (!fs.existsSync(KEY_PATH)) {
      console.warn('⚠️ Google Drive Upload Skipped: google-service-account.json not found.');
      return null;
    }

    let FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID_FEEDBACK_IMAGES || process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Also try to get it from the database configuration if enabled
    try {
      const LoyaltyConfig = require('../models/LoyaltyConfig');
      const config = await LoyaltyConfig.getConfig();
      if (config && config.cloudSync && config.cloudSync.gcpEnabled && config.cloudSync.googleDriveFolderId) {
        FOLDER_ID = config.cloudSync.googleDriveFolderId;
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch LoyaltyConfig for Google Drive ID:', e.message);
    }

    if (!FOLDER_ID) {
      console.warn('⚠️ Google Drive Upload Skipped: GOOGLE_DRIVE_FOLDER_ID_FEEDBACK_IMAGES not set and not configured in DB.');
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      parents: [FOLDER_ID]
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath)
    };

    console.log(`☁️ Uploading image ${fileName} to Google Drive...`);
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink'
    });

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Fetch the file again to get the updated links after changing permissions
    const result = await drive.files.get({
      fileId: file.data.id,
      fields: 'id, name, webViewLink, webContentLink'
    });

    console.log(`✅ Successfully uploaded and shared ${fileName} (URL: ${result.data.webViewLink})`);
    return result.data;

  } catch (error) {
    console.error('❌ Failed to upload image to Google Drive:', error.message);
    return null;
  }
};

module.exports = {
  uploadToGoogleDrive,
  uploadImageToGoogleDrive
};
