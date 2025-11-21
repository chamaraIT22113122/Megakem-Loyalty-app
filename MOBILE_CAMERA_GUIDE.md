# Mobile Camera Troubleshooting Guide

## Requirements for Camera Access on Mobile

### 1. **HTTPS Required**
- Camera access ONLY works on:
  - `https://` URLs (production)
  - `localhost` (development on same device)
  - Local network access may be blocked by some browsers

### 2. **Browser Support**
- ✅ **Chrome/Edge (Android)** - Best support
- ✅ **Safari (iOS)** - Works but may need permission grant
- ⚠️ **Firefox Mobile** - Limited support
- ❌ **In-app browsers** (Facebook, Instagram, etc.) - Often blocked

### 3. **Permission Settings**

**Android (Chrome/Edge):**
1. Tap the lock icon in address bar
2. Go to "Site settings"
3. Enable "Camera"
4. Refresh the page

**iOS (Safari):**
1. Go to Settings → Safari → Camera
2. Select "Ask" or "Allow"
3. Or tap "aA" in address bar → Website Settings → Camera → Allow

### 4. **Testing Locally on Mobile**

**Option A: Use ngrok or similar tunnel**
```bash
# Install ngrok
npm install -g ngrok

# Run your dev server first
npm run dev

# In another terminal, expose it
ngrok http 5174
```
Copy the `https://` URL provided by ngrok and open it on your mobile device.

**Option B: Deploy to hosting with HTTPS**
- Vercel: `npx vercel`
- Netlify: `npx netlify deploy`
- GitHub Pages (with custom domain for HTTPS)

### 5. **Common Issues**

**Camera not starting:**
- Ensure you're on HTTPS (not HTTP)
- Check browser permissions
- Try closing other apps using the camera
- Restart the browser

**Permission prompt not showing:**
- Clear browser cache and site data
- Try incognito/private mode first
- Some browsers require user gesture (tap button) before asking

**Black screen:**
- Another app might be using the camera
- Try the "Select Camera" option in the scanner
- Restart the device

### 6. **Fallback Option**
If camera still doesn't work, the app provides a manual QR input field where you can:
- Type/paste QR code data manually
- Use another QR scanner app and copy the result

### 7. **Production Deployment**
For production use, deploy to a service with HTTPS:
- Vercel (recommended for React apps)
- Netlify
- Firebase Hosting
- AWS Amplify

All these provide automatic HTTPS certificates.
