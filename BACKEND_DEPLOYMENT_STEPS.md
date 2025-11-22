# Backend Deployment to Render - Step by Step Guide

## ✅ Prerequisites Checklist
- [x] Code pushed to GitHub
- [x] `render.yaml` configured in backend folder
- [x] MongoDB connection string ready
- [ ] Render account created

---

## 🚀 Deployment Steps

### Step 1: Create Render Account (if you haven't already)
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended) or email

---

### Step 2: Create New Web Service

1. **Access Render Dashboard**
   - Go to https://dashboard.render.com
   - Click **"New +"** button (top right)
   - Select **"Web Service"**

2. **Connect GitHub Repository**
   - Choose **"Build and deploy from a Git repository"**
   - Click **"Connect account"** if not already connected
   - Find and select: `chamaraIT22113122/Megakem-Loyalty-app`
   - Click **"Connect"**

---

### Step 3: Configure Web Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `megakem-loyalty-backend` |
| **Region** | Choose closest (e.g., `Oregon (US West)` or `Frankfurt (EU Central)`) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

---

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add each of these:

```env
NODE_ENV=production
```

```env
MONGODB_URI=mongodb+srv://tcnbandara_db_user:megakeml@megakemloyalty.j5v1bbn.mongodb.net/megakem-loyalty
```

```env
JWT_SECRET=
```
*For JWT_SECRET: Click "Generate" button to create a secure random secret*

```env
FRONTEND_URL=https://chamarait22113122.github.io
```

```env
PORT=5000
```

---

### Step 5: Deploy!

1. Click **"Create Web Service"** button at the bottom
2. Wait for deployment (typically 5-10 minutes for first deployment)
3. Monitor the build logs in real-time
4. Once complete, you'll see: ✅ "Live" with a green indicator

---

## 📍 Your Backend URL

After deployment, your backend will be available at:
```
https://megakem-loyalty-backend.onrender.com
```

Test it by visiting:
```
https://megakem-loyalty-backend.onrender.com/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Megakem Loyalty API is running",
  "timestamp": "2025-11-23T..."
}
```

---

## 🔄 Update Frontend to Use New Backend

After your backend is deployed, update the frontend:

1. Create or edit `frontend/.env` file:
```env
REACT_APP_API_URL=https://megakem-loyalty-backend.onrender.com/api
```

2. Rebuild and redeploy frontend:
```bash
cd frontend
npm run deploy
```

---

## 🎯 Alternative: Deploy Using render.yaml (Automatic)

If you prefer automatic deployment from `render.yaml`:

1. In Render Dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Render will automatically detect `backend/render.yaml`
4. You'll still need to add the environment variables manually
5. Click "Apply" to deploy

---

## ⚠️ Important Notes

- **Free Tier Limitation**: The free tier spins down after 15 minutes of inactivity
- **Cold Start**: First request after spin-down takes 30-50 seconds
- **Automatic Deploys**: Every push to `main` branch triggers automatic redeployment
- **Logs**: View logs in Render Dashboard → Your Service → Logs tab

---

## 🐛 Troubleshooting

### Deployment Failed?
- Check the logs in Render Dashboard
- Verify all environment variables are set correctly
- Ensure MongoDB URI is accessible from Render's servers

### Can't Connect to MongoDB?
- Check MongoDB Atlas Network Access settings
- Add `0.0.0.0/0` to IP whitelist (or Render's IP ranges)

### CORS Errors?
- Verify `FRONTEND_URL` matches your GitHub Pages URL
- Check server.js CORS configuration

---

## 📞 Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- MongoDB Atlas: https://www.mongodb.com/docs/atlas

---

## ✅ Deployment Checklist

- [ ] Render account created
- [ ] Repository connected
- [ ] Web service configured
- [ ] Environment variables added
- [ ] Service deployed successfully
- [ ] Health check endpoint working
- [ ] Frontend updated with backend URL
- [ ] Frontend redeployed
- [ ] End-to-end testing completed

Good luck! 🚀
