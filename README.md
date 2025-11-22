# Megakem Loyalty System

A modern QR code-based loyalty tracking system for Megakem products with separate frontend and backend.

## 🏗️ Project Structure

```
Megakem-Loyalty-app/
├── frontend/          # React frontend application
└── backend/           # Node.js + Express + MongoDB backend
```

## 🚀 Features

- ✅ QR Code Scanning (Camera + Mock Data for Testing)
- ✅ Real-time Data Dashboard
- ✅ Role-based Scanning (Applicator/Customer)
- ✅ Batch Submission
- ✅ MongoDB Database Storage
- ✅ RESTful API
- ✅ Beautiful Material-UI Interface

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **MongoDB** (v5 or higher) - either local or MongoDB Atlas

## 🛠️ Installation

### 1. Clone the Repository

```powershell
git clone https://github.com/chamaraIT22113122/Megakem-Loyalty-app.git
cd Megakem-Loyalty-app
```

### 2. Backend Setup

```powershell
cd backend
npm install
```

**Configure Environment Variables:**

```powershell
cp .env.example .env
```

Edit `.env` file with your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/megakem-loyalty
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/megakem-loyalty

PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup

```powershell
cd ../frontend
npm install
```

**Configure Environment Variables:**

```powershell
cp .env.example .env
```

The `.env` file should contain:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🎯 Running the Application

### Start MongoDB (if running locally)

```powershell
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or start mongod manually
mongod --dbpath="C:\data\db"
```

### Start Backend Server

```powershell
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

Backend will run on `http://localhost:5000`

### Start Frontend

```powershell
cd frontend
npm start
```

Frontend will run on `http://localhost:3000`

## 📱 Using the Application

1. **Welcome Screen**: Select your role (Applicator or Customer)
2. **Scanner**: Use camera to scan QR codes or test with mock data
3. **Cart**: Review scanned items
4. **Submit**: Enter member details and submit batch
5. **Admin Panel**: Click "Admin" button to view live data feed

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/anonymous` - Create anonymous session
- `GET /api/auth/me` - Get current user

### Scans
- `GET /api/scans` - Get all scans (with pagination)
- `GET /api/scans/live` - Get recent scans (last 100)
- `GET /api/scans/:id` - Get single scan
- `POST /api/scans` - Create new scan
- `POST /api/scans/batch` - Create multiple scans
- `GET /api/scans/stats/summary` - Get statistics

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

## 🧪 Testing

### Mock QR Codes

The application includes built-in mock QR codes for testing:
1. UltraSeal Waterproofing
2. Premium Wall Putty
3. Exterior Primer X
4. SuperBond Adhesive

Click any mock item in the scanner view to simulate a scan.

## 🔧 Development

### Backend Development

```powershell
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development

```powershell
cd frontend
npm start  # Create React App dev server
```

## 📦 Build for Production

### Backend

```powershell
cd backend
# Set NODE_ENV=production in .env
npm start
```

### Frontend

```powershell
cd frontend
npm run build
```

The build folder will contain optimized production files.

## 🗄️ Database Schema

### Scans Collection
```javascript
{
  memberName: String,
  memberId: String,
  role: 'applicator' | 'customer',
  productName: String,
  productNo: String,
  batchNo: String,
  bagNo: String,
  qty: String,
  timestamp: Date,
  userId: ObjectId
}
```

### Users Collection
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: 'user' | 'admin',
  isActive: Boolean,
  lastLogin: Date
}
```

### Products Collection
```javascript
{
  name: String,
  productNo: String,
  description: String,
  category: String,
  isActive: Boolean,
  batches: [{ batchNo, manufactureDate, expiryDate, quantity }]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Chamara**
- GitHub: [@chamaraIT22113122](https://github.com/chamaraIT22113122)

## 🐛 Issues

If you encounter any issues, please report them on the [GitHub Issues](https://github.com/chamaraIT22113122/Megakem-Loyalty-app/issues) page.

## 🙏 Acknowledgments

- Material-UI for the beautiful component library
- html5-qrcode for QR scanning functionality
- MongoDB for the database
- Express.js for the backend framework
