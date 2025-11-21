# ScanTrak - MUI Demo

This small project recreates the ScanTrak MUI component you provided — a Scan + Simulator UI with optional Firebase integration.

Quick start (Windows PowerShell):

1. Install dependencies

```powershell
cd "c:/Users/Chamara/OneDrive/Documents/GitHub/Megakem Loyalty app"
npm install
```

2. Run dev server

```powershell
npm run dev
```

3. Open the URL printed by Vite (e.g. http://localhost:5173)

Notes:
- The app includes a mock QR simulator. Clicking an item simulates a scan.
- If you want Firebase uploads, add a script tag to `index.html` that sets `window.__firebase_config` to a JSON string containing your Firebase config (or update `src/firebase.js` to load from env). Example:

```html
<script>
  window.__firebase_config = '{"apiKey":"...","authDomain":"...","projectId":"..."}'
</script>
```

You can extend the `submitAll` function in `src/App.jsx` to push to Firestore using `addDoc`.
