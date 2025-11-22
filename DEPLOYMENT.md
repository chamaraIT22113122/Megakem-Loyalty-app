# Megakem Loyalty App - Deployment Guide

## 🚀 Deployment Options

### Option 1: Deploy to Render (Recommended - Free Tier Available)

#### Backend Deployment:
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: megakem-loyalty-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`
5. Add Environment Variables:
   - `MONGODB_URI`: mongodb+srv://tcnbandara_db_user:megakeml@megakemloyalty.j5v1bbn.mongodb.net/megakem-loyalty
   - `JWT_SECRET`: your-secret-key-here
   - `PORT`: 5000
6. Click "Create Web Service"
7. Copy the deployed URL (e.g., https://megakem-loyalty-backend.onrender.com)

#### Frontend Deployment:
1. Update `frontend/src/services/api.js` with your backend URL
2. In Render Dashboard, click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name**: megakem-loyalty-frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Root Directory**: `frontend`
5. Add Environment Variable:
   - `REACT_APP_API_URL`: https://megakem-loyalty-backend.onrender.com
6. Click "Create Static Site"

---

### Option 2: Deploy to Vercel

#### Backend:
```bash
cd backend
vercel
```
Follow prompts and add environment variables in Vercel dashboard.

#### Frontend:
```bash
cd frontend
vercel
```
Update API URL in environment variables.

---

### Option 3: Deploy to Heroku

#### Backend:
```bash
cd backend
heroku create megakem-loyalty-backend
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
git push heroku main
```

#### Frontend:
```bash
cd frontend
heroku create megakem-loyalty-frontend
heroku buildpacks:set mars/create-react-app
git push heroku main
```

---

### Option 4: Deploy with Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access the app at http://localhost
```

---

### Option 5: Deploy to Netlify (Frontend Only)

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy to Netlify:
   - Go to [Netlify](https://app.netlify.com/)
   - Drag and drop the `build` folder
   - Or use Netlify CLI: `netlify deploy --prod`

3. Add environment variable:
   - `REACT_APP_API_URL`: your-backend-url

---

## 📝 Pre-Deployment Checklist

### Backend:
- ✅ MongoDB Atlas connection string configured
- ✅ JWT secret generated
- ✅ CORS configured for frontend domain
- ✅ Environment variables set

### Frontend:
- ✅ API URL updated to point to deployed backend
- ✅ Logo image included in assets
- ✅ Build tested locally (`npm run build`)

---

## 🔧 Quick Local Test Before Deployment

```bash
# Backend
cd backend
npm start

# Frontend (new terminal)
cd frontend
npm start
```

Visit http://localhost:3000 to test.

---

## 🌐 Update API URL in Frontend

Edit `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

Then create `frontend/.env.production`:
```
REACT_APP_API_URL=https://your-backend-url.com/api
```

---

## 📱 Post-Deployment Steps

1. Seed admin user:
   ```bash
   node backend/scripts/seedAdmin.js
   ```

2. Test admin login:
   - Email: admin@megakem.com
   - Password: Admin@123

3. Test QR scanning functionality
4. Verify database connectivity
5. Check CORS settings

---

## 🔒 Security Notes

- Change default admin password after first login
- Use strong JWT_SECRET (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Enable HTTPS in production
- Set secure CORS origins

---

## 🐛 Troubleshooting

**CORS Error**: Update backend CORS settings with frontend URL
**MongoDB Connection**: Check connection string and network access in MongoDB Atlas
**Build Errors**: Clear node_modules and reinstall: `rm -rf node_modules && npm install`

---

## 📞 Support

For deployment issues, check:
- Backend logs for API errors
- Frontend console for client errors
- MongoDB Atlas network access settings
- Environment variables are correctly set
