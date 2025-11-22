# 🚀 Quick Start Guide - Megakem Loyalty System

## Prerequisites Check
- [ ] Node.js v16+ installed
- [ ] MongoDB running (local or Atlas)
- [ ] Git installed

## Step 1: Install Backend Dependencies

```powershell
cd backend
npm install
```

## Step 2: Configure Backend

Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/megakem-loyalty
PORT=5000
JWT_SECRET=your_secret_key_here
```

## Step 3: Install Frontend Dependencies

```powershell
cd ../frontend
npm install
```

## Step 4: Configure Frontend

The `frontend/.env` is already configured:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Step 5: Start MongoDB

```powershell
# If MongoDB is a Windows service:
net start MongoDB

# Or start manually:
mongod --dbpath="C:\data\db"
```

## Step 6: Start Backend Server

```powershell
cd backend
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000
```

## Step 7: Start Frontend

Open a NEW terminal:

```powershell
cd frontend
npm start
```

Browser will open at `http://localhost:3000`

## ✅ Verify Installation

1. **Backend Health Check**:
   - Visit: `http://localhost:5000/api/health`
   - Should show: `{"status":"OK",...}`

2. **Frontend Loading**:
   - Visit: `http://localhost:3000`
   - Should see "New Session" screen

3. **Test Scanning**:
   - Click "Applicator"
   - Click any mock product
   - Enter name and ID
   - Click "Submit"

4. **Test Admin Panel**:
   - Click "Admin" button
   - Should see submitted scans

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running
- Verify `.env` file exists in backend/
- Check port 5000 is not in use

### Frontend won't start
- Verify backend is running first
- Check port 3000 is not in use
- Clear node_modules and reinstall

### Connection errors
- Verify CORS settings in backend
- Check API_URL in frontend/.env
- Ensure backend is accessible

### MongoDB errors
- Check MongoDB connection string
- Verify database permissions
- Try MongoDB Compass to test connection

## 📚 Next Steps

- Read full documentation in README.md
- Explore API endpoints in backend/README.md
- Check frontend architecture in frontend/README.md
- Customize the app for your needs

## 💡 Pro Tips

1. Use `npm run dev` in backend for auto-reload
2. Test with mock QR codes before using camera
3. Check browser console for errors
4. Use MongoDB Compass to view data

## 🎉 Success!

Your Megakem Loyalty System is now running!

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

Happy scanning! 📱✨
