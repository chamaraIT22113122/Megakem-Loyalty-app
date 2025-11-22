# Megakem Loyalty App - Complete Deployment Guide

## 🚀 Quick Deploy Both Frontend & Backend

### Backend Deployment (Render - Free Tier)

#### Step 1: Deploy Backend to Render

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Sign up/Login with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select repository: `Megakem-Loyalty-app`
   
3. **Configure Backend Service**
   ```
   Name: megakem-loyalty-backend
   Region: Choose closest to you
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable":
   ```
   MONGODB_URI = mongodb+srv://tcnbandara_db_user:megakeml@megakemloyalty.j5v1bbn.mongodb.net/megakem-loyalty
   JWT_SECRET = your-super-secret-jwt-key-here-change-this
   PORT = 5000
   NODE_ENV = production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Copy your backend URL (e.g., `https://megakem-loyalty-backend.onrender.com`)

#### Step 2: Seed Admin User

After backend is deployed, run the seed script:
- Go to Render dashboard → Your service → Shell
- Run: `node scripts/seedAdmin.js`

OR use this URL in browser:
`https://your-backend-url.onrender.com/api/auth/admin/login`

Default credentials:
- Email: admin@megakem.com
- Password: Admin@123

---

### Frontend Deployment (Already Done!)

✅ Frontend is deployed at: **https://chamaraIT22113122.github.io/Megakem-Loyalty-app**

#### Update Frontend to Use Backend

1. **Update API URL**
   Edit `frontend/.env.production`:
   ```
   REACT_APP_API_URL=https://megakem-loyalty-backend.onrender.com/api
   ```

2. **Redeploy Frontend**
   ```powershell
   cd frontend
   npm run deploy
   ```

---

## 🔧 Backend CORS Configuration

Make sure your backend allows requests from GitHub Pages:

Edit `backend/server.js` and update CORS:
```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://chamarait22113122.github.io'
  ],
  credentials: true
}));
```

---

## 📱 Complete Deployment Checklist

### Backend (Render):
- [ ] Create Web Service on Render
- [ ] Set root directory to `backend`
- [ ] Add environment variables (MONGODB_URI, JWT_SECRET)
- [ ] Deploy and wait for build
- [ ] Copy backend URL
- [ ] Seed admin user
- [ ] Test API: `https://your-backend-url.onrender.com/api/health`

### Frontend (GitHub Pages):
- [ ] Update `.env.production` with backend URL
- [ ] Run `npm run deploy` in frontend folder
- [ ] Wait 2-3 minutes
- [ ] Visit: https://chamarait22113122.github.io/Megakem-Loyalty-app
- [ ] Test login and scanning

---

## 🌐 Your Live URLs

**Frontend:** https://chamarait22113122.github.io/Megakem-Loyalty-app
**Backend:** https://your-backend-url.onrender.com (after deployment)

---

## 🎯 Quick Commands

### Deploy/Update Frontend:
```powershell
cd frontend
npm run deploy
```

### Update Backend:
Just push to GitHub main branch - Render auto-deploys!
```powershell
git add .
git commit -m "Update backend"
git push origin main
```

---

## 🐛 Troubleshooting

### Issue: API not connecting
- Check backend URL in `.env.production`
- Verify CORS settings in backend
- Check Render logs for errors

### Issue: MongoDB connection failed
- Verify MONGODB_URI in Render environment variables
- Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)

### Issue: Frontend shows old version
- Clear browser cache
- Run `npm run deploy` again
- Wait 2-3 minutes for GitHub Pages to update

---

## 🔒 Security Reminders

1. Change default admin password after first login
2. Generate strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. In MongoDB Atlas, add IP whitelist or use 0.0.0.0/0 for any IP
4. Enable HTTPS (automatic on Render and GitHub Pages)

---

## 💰 Cost

- **Frontend (GitHub Pages):** FREE ✅
- **Backend (Render):** FREE (sleeps after 15 min inactivity) ✅
- **Database (MongoDB Atlas):** FREE (512MB) ✅

**Total Cost: $0/month** 🎉

---

## 📞 Need Help?

1. Check Render logs: Dashboard → Your Service → Logs
2. Check browser console: F12 → Console tab
3. Test backend directly: Visit `https://your-backend-url.onrender.com/api/health`

---

## ⚡ Pro Tips

- Render free tier sleeps after 15 min - first request takes ~30 seconds
- Keep backend active: use UptimeRobot to ping every 14 minutes
- For production: upgrade Render to paid ($7/month) for always-on
