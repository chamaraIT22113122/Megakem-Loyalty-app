# 🔐 Login Credentials

## Admin Login (Port 3001)

### Default Admin Credentials
```
Email: admin@megakem.com
Password: Admin@123
```

## Important Notes

### Backend Configuration
- ✅ Backend is running on: `http://localhost:5000`
- ✅ Frontend is running on: `http://localhost:3001`
- ✅ CORS has been updated to allow port 3001

### If Login Still Fails

1. **Restart the Backend Server**
   ```bash
   cd backend
   # Stop any running node processes
   taskkill /F /IM node.exe
   # Start the backend again
   node server.js
   ```

2. **Check Backend is Running**
   - Open: `http://localhost:5000/api/health`
   - You should see: `{ "status": "OK", "message": "Megakem Loyalty API is running" }`

3. **Verify Admin Account Exists**
   ```bash
   cd backend
   node scripts/checkAdmin.js
   ```

4. **Reset Admin Password (if needed)**
   ```bash
   cd backend
   node scripts/resetAdminPassword.js
   ```

### Browser Console Check
If login fails, open browser DevTools (F12) and check:
1. **Console Tab** - Look for API errors
2. **Network Tab** - Check if the API call to `/api/auth/admin/login` is:
   - Returning status 401 (invalid credentials)
   - Returning status 200 (success)
   - Blocked by CORS
   - Unable to connect

### Common Issues & Solutions

#### Issue 1: CORS Error
**Error**: `Access to fetch has been blocked by CORS policy`
**Solution**: 
- Backend needs to be restarted after updating CORS settings
- Run: `taskkill /F /IM node.exe` then `node server.js`

#### Issue 2: Connection Refused
**Error**: `Failed to fetch` or `net::ERR_CONNECTION_REFUSED`
**Solution**:
- Backend is not running
- Start backend: `cd backend && node server.js`

#### Issue 3: Invalid Credentials
**Error**: `Invalid admin credentials`
**Solution**:
- Use exact credentials (case-sensitive): `admin@megakem.com` / `Admin@123`
- If password was changed, reset it using `resetAdminPassword.js`

#### Issue 4: Port 3001 Not Allowed
**Error**: Backend CORS blocks port 3001
**Solution**:
- ✅ Already fixed! Backend `server.js` now allows port 3001
- Just restart the backend

### Testing the Setup

#### Test Backend API
```bash
# PowerShell
curl http://localhost:5000/api/health
```

#### Test Admin Login (PowerShell)
```powershell
$body = @{
    email = "admin@megakem.com"
    password = "Admin@123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/admin/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Password Requirements
- Minimum 6 characters
- Default password: `Admin@123`

### Security Reminder
⚠️ **Change the default password immediately after first login!**

Go to: Admin Panel → Profile → Change Password

---

## Quick Start Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3001
- [ ] CORS updated to allow port 3001
- [ ] Admin account exists in database
- [ ] Using correct email: `admin@megakem.com`
- [ ] Using correct password: `Admin@123`

## Support

If you still have issues:
1. Check backend console for error messages
2. Check browser console for API errors
3. Verify MongoDB connection is working
4. Make sure `.env` file exists with correct settings

**Backend .env should have:**
```env
MONGODB_URI=mongodb+srv://tcnbandara_db_user:megakeml@megakemloyalty.j5v1bbn.mongodb.net/megakem-loyalty
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
FRONTEND_URL=http://localhost:3001
```
