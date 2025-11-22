# GitHub Pages Deployment Guide

## 🚀 Deploy Megakem Loyalty App to GitHub Pages

### Prerequisites
- GitHub account
- Repository: Megakem-Loyalty-app
- Backend API deployed (Render, Vercel, or Heroku)

---

## 📝 Deployment Steps

### Step 1: Enable GitHub Pages

1. Go to your GitHub repository: https://github.com/chamaraIT22113122/Megakem-Loyalty-app
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**

### Step 2: Add Backend URL Secret

1. In repository Settings → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - Name: `BACKEND_URL`
   - Value: Your deployed backend URL (e.g., `https://your-backend.onrender.com/api`)
4. Click **Add secret**

### Step 3: Deploy

#### Option A: Automatic Deployment (Recommended)
The GitHub Actions workflow will automatically deploy when you push to main branch:

```powershell
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

The site will be available at: **https://chamaraIT22113122.github.io/Megakem-Loyalty-app**

#### Option B: Manual Deployment
```powershell
cd frontend
npm run deploy
```

---

## 🔧 Local Testing Before Deployment

```powershell
# Build the production version
cd frontend
npm run build

# Test the build locally (optional)
npm install -g serve
serve -s build
```

---

## ⚙️ Configuration Files

### ✅ Already Configured:
- `frontend/package.json` - Added homepage and deploy scripts
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- Environment variables support

---

## 🌐 Access Your Deployed App

Once deployed, your app will be available at:
**https://chamaraIT22113122.github.io/Megakem-Loyalty-app**

---

## 📊 Monitor Deployment

1. Go to **Actions** tab in your GitHub repository
2. Watch the deployment progress
3. Check for any errors in the workflow logs

---

## 🔒 Important Notes

### Backend Deployment:
⚠️ **GitHub Pages only hosts the frontend (static files)**

You need to deploy your backend separately to:
- **Render** (Free tier): https://render.com
- **Railway** (Free tier): https://railway.app
- **Heroku** (Paid): https://heroku.com
- **Vercel** (Free tier, serverless): https://vercel.com

### Backend URL:
Update the `BACKEND_URL` secret in GitHub with your deployed backend API URL.

---

## 🐛 Troubleshooting

### Issue: 404 on page refresh
**Solution**: This is normal for single-page apps. The routing is handled client-side.

### Issue: API calls failing
**Solution**: 
1. Check backend URL in GitHub Secrets
2. Ensure CORS is enabled on backend for GitHub Pages domain
3. Update backend CORS configuration:

```javascript
// backend/server.js
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://chamaraIT22113122.github.io'
  ],
  credentials: true
}));
```

### Issue: Build fails
**Solution**:
1. Check the Actions tab for error logs
2. Ensure all dependencies are in package.json
3. Fix any TypeScript/ESLint errors

---

## 🔄 Updating Your Deployment

Any push to the `main` branch will automatically trigger a new deployment!

```powershell
git add .
git commit -m "Update app"
git push origin main
```

---

## 📱 Testing Checklist

After deployment, test:
- ✅ Landing page loads
- ✅ QR scanner works
- ✅ Cart functionality
- ✅ Admin login
- ✅ API connectivity
- ✅ Mobile responsiveness

---

## 🎯 Next Steps

1. ✅ Push code to GitHub
2. ✅ Enable GitHub Pages
3. ✅ Add backend URL secret
4. ✅ Wait for deployment (~2-5 minutes)
5. ✅ Visit your live site!
6. ✅ Share the URL with your team

---

## 💡 Pro Tips

- Use **Render** for backend (free tier, always-on)
- Set up custom domain (Settings → Pages → Custom domain)
- Monitor with Google Analytics
- Use environment variables for configuration

---

## 📞 Support

For issues:
1. Check GitHub Actions logs
2. Verify backend is running
3. Check browser console for errors
4. Review CORS settings

**Your app will be live at:**
🌐 https://chamaraIT22113122.github.io/Megakem-Loyalty-app
