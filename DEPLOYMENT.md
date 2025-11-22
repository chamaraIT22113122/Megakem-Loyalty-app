# Deploy Megakem Loyalty Backend to Render

## Prerequisites
- GitHub account
- Render account (sign up at https://render.com - free tier available)
- Your MongoDB connection string

## Step 1: Push Backend Code to GitHub

1. Make sure your backend code is committed:
```bash
cd backend
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

## Step 2: Deploy on Render

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `chamaraIT22113122/Megakem-Loyalty-app`
4. Configure the service:
   - **Name:** `megakem-loyalty-backend`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`

5. Add Environment Variables (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV = production
   MONGODB_URI = mongodb+srv://tcnbandara_db_user:megakeml@megakemloyalty.j5v1bbn.mongodb.net/megakem-loyalty
   JWT_SECRET = (Render will auto-generate this)
   FRONTEND_URL = https://chamaraIT22113122.github.io
   PORT = 5000
   ```

6. Click **"Create Web Service"**

7. Wait for deployment (5-10 minutes). Your backend URL will be something like:
   `https://megakem-loyalty-backend.onrender.com`

## Step 3: Update Frontend Configuration

After deployment, you'll need to update the frontend to use the new backend URL.

Note: Free tier on Render spins down after 15 minutes of inactivity and takes 30-50 seconds to restart.

## Troubleshooting

If deployment fails:
1. Check the logs in Render dashboard
2. Ensure all dependencies are in package.json
3. Verify MongoDB connection string is correct
4. Make sure PORT environment variable is set
