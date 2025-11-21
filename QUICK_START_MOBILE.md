# Quick Mobile Testing Guide

## Problem: Camera doesn't work on mobile

**Why?** Modern browsers require HTTPS for camera access on mobile devices.

## ✅ Solution: Use ngrok to create HTTPS tunnel

### Option 1: Quick Setup (Recommended)

```powershell
# Run the automated setup script
.\start-mobile.ps1
```

### Option 2: Manual Setup

**Step 1: Install ngrok**
```powershell
npm install -g ngrok
```

**Step 2: Start dev server**
```powershell
npm run dev -- --host
```

**Step 3: In another terminal, start ngrok**
```powershell
ngrok http 5173
```

**Step 4:** Copy the `https://` URL from ngrok and open it on your mobile device

---

## 📱 Testing on Mobile

1. Make sure your phone and computer are on the **same WiFi network**
2. Open the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
3. Allow camera permissions when prompted
4. Point camera at QR code to scan

---

## 🔧 Troubleshooting

### Camera still not working?

1. **Check browser permissions**
   - Android Chrome: Tap lock icon → Site settings → Camera → Allow
   - iOS Safari: Settings → Safari → Camera → Allow

2. **Try another browser**
   - Chrome/Edge works best on Android
   - Safari is required on iOS

3. **Clear cache and retry**
   - Close all browser tabs
   - Clear site data
   - Reopen the ngrok URL

4. **Use Manual Input**
   - Scroll down to "Manual QR Input"
   - Paste QR code data manually
   - Works without camera access

---

## 🚀 For Production

Deploy to a hosting service with automatic HTTPS:

- **Vercel** (Recommended): `npx vercel`
- **Netlify**: `npx netlify deploy`
- **Firebase**: `firebase deploy`

All provide free HTTPS certificates automatically!
