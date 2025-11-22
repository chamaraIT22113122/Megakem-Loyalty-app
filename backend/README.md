# Megakem Loyalty System - Backend

Node.js + Express + MongoDB backend for the Megakem Loyalty System.

## 🚀 Quick Start

1. **Install Dependencies**
```powershell
npm install
```

2. **Configure Environment**
```powershell
cp .env.example .env
```

Edit `.env` with your MongoDB connection string.

3. **Start Server**
```powershell
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment configuration
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **express-validator** - Request validation

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Anonymous Login
```http
POST /api/auth/anonymous
```
Creates a temporary anonymous session.

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Scan Endpoints

#### Get All Scans
```http
GET /api/scans?page=1&limit=50&role=applicator&memberId=APP-001
```

#### Get Live Feed
```http
GET /api/scans/live
```
Returns last 100 scans.

#### Create Single Scan
```http
POST /api/scans
Content-Type: application/json

{
  "memberName": "John Doe",
  "memberId": "APP-001",
  "role": "applicator",
  "productName": "UltraSeal Waterproofing",
  "productNo": "PRD-99102",
  "batchNo": "BATCH-2024-001",
  "bagNo": "BAG-8821",
  "qty": "5KG"
}
```

#### Create Batch Scans
```http
POST /api/scans/batch
Content-Type: application/json

{
  "scans": [
    {
      "memberName": "John Doe",
      "memberId": "APP-001",
      "role": "applicator",
      "productName": "UltraSeal Waterproofing",
      "productNo": "PRD-99102",
      "batchNo": "BATCH-2024-001",
      "bagNo": "BAG-8821",
      "qty": "5KG"
    }
  ]
}
```

## 🗄️ Database Models

### Scan Model
- `memberName` (String, required)
- `memberId` (String, required, uppercase)
- `role` (String, enum: ['applicator', 'customer'])
- `productName` (String, required)
- `productNo` (String, required)
- `batchNo` (String, required)
- `bagNo` (String, required)
- `qty` (String, required)
- `timestamp` (Date, default: now)
- `userId` (ObjectId, ref: User)

### User Model
- `username` (String, required, unique)
- `email` (String, required, unique)
- `password` (String, required, hashed)
- `role` (String, enum: ['user', 'admin'])
- `isActive` (Boolean, default: true)
- `lastLogin` (Date)

### Product Model
- `name` (String, required)
- `productNo` (String, required, unique)
- `description` (String)
- `category` (String)
- `isActive` (Boolean, default: true)
- `batches` (Array of batch objects)

## 🔐 Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- CORS enabled for frontend origin
- Input validation on all endpoints

## 🛠️ Development

```powershell
npm run dev
```

Uses nodemon for automatic server restart on file changes.

## 📝 Environment Variables

Required variables in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/megakem-loyalty
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

## 🧪 Testing API

Use tools like:
- Postman
- Insomnia
- Thunder Client (VS Code extension)
- curl

Example curl command:
```powershell
curl -X POST http://localhost:5000/api/auth/anonymous
```

## 📊 Health Check

```http
GET /api/health
```

Returns server status and timestamp.
