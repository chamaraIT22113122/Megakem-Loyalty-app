# API Documentation - Megakem Loyalty App

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Auth Routes](#auth-routes)
   - [Scan Routes](#scan-routes)
   - [Product Routes](#product-routes)
   - [Member Routes](#member-routes)
   - [Loyalty Routes](#loyalty-routes)
   - [Cash Rewards Routes](#cash-rewards-routes)
   - [Analytics Routes](#analytics-routes)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## Overview

### Base URL

```
Production: https://[your-domain]/api
Development: http://localhost:5000/api
```

### API Version

Current Version: **v1.0**

### Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]  // Optional validation errors
}
```

### Content Type

```
Content-Type: application/json
```

---

## Authentication

### Authentication Methods

1. **JWT Token Authentication** (Primary)
2. **Optional Auth** (Some endpoints)
3. **No Auth** (Public endpoints)

### Getting a Token

**Register:**
```http
POST /api/auth/register
```

**Login:**
```http
POST /api/auth/login
```

### Using Tokens

Include JWT token in request header:

```http
Authorization: Bearer <your_jwt_token>
```

### Token Types

1. **Access Token** - Short-lived (7 days default)
2. **Refresh Token** - Long-lived (30 days default)

### Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

---

## API Endpoints

## Auth Routes

### Register User

Create a new user account.

```http
POST /api/auth/register
```

**Access:** Public

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation Rules:**
- Username: 3-30 characters, alphanumeric, underscores, hyphens
- Email: Valid email format
- Password: Minimum 8 characters, must contain uppercase, lowercase, and number

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

---

### Login

Authenticate and get tokens.

```http
POST /api/auth/login
```

**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "points": 150,
    "tier": "bronze",
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

---

### Get Current User

Get authenticated user's profile.

```http
GET /api/auth/me
```

**Access:** Private (requires authentication)

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "points": 150,
    "tier": "bronze",
    "totalScans": 15,
    "achievements": [
      { "name": "First Scan", "earnedAt": "2023-12-01T10:00:00Z" }
    ]
  }
}
```

---

### Update Password

Change user password.

```http
PUT /api/auth/update-password
```

**Access:** Private

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## Scan Routes

### Get All Scans

Retrieve scans with pagination and filters.

```http
GET /api/scans?page=1&limit=50&role=applicator&memberId=APL-001
```

**Access:** Public (optionally authenticated)

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `role` (string) - Filter by "applicator" or "customer"
- `memberId` (string) - Filter by member ID
- `phone` (string) - Search by phone number

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "scan_id",
      "memberName": "Ahmed Khan",
      "memberId": "APL-001",
      "role": "applicator",
      "productName": "MEGA BOND PLUS",
      "productNo": "MK-001",
      "batchNo": "B2023120501",
      "bagNo": "001",
      "qty": "25kg",
      "price": 25000,
      "timestamp": "2023-12-05T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

---

### Create Scan

Submit a single product scan.

```http
POST /api/scans
```

**Access:** Public (optional auth for points)

**Request Body:**
```json
{
  "memberName": "Ahmed Khan",
  "memberId": "APL-001",
  "role": "applicator",
  "productName": "MEGA BOND PLUS",
  "productNo": "MK-001",
  "batchNo": "B2023120501",
  "bagNo": "001",
  "qty": "25kg",
  "price": 25000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "scan_id",
    "memberName": "Ahmed Khan",
    "memberId": "APL-001",
    "role": "applicator",
    "productName": "MEGA BOND PLUS",
    "productNo": "MK-001",
    "batchNo": "B2023120501",
    "bagNo": "001",
    "qty": "25kg",
    "price": 25000,
    "timestamp": "2023-12-05T10:30:00Z"
  }
}
```

**Duplicate Error:**
```json
{
  "success": false,
  "message": "This batch number (B2023120501) has already been scanned by a applicator",
  "duplicate": true
}
```

---

### Create Batch Scans

Submit multiple scans at once.

```http
POST /api/scans/batch
```

**Access:** Public (optional auth for points)

**Request Body:**
```json
{
  "scans": [
    {
      "memberName": "Ahmed Khan",
      "memberId": "APL-001",
      "role": "applicator",
      "productName": "MEGA BOND PLUS",
      "productNo": "MK-001",
      "batchNo": "B2023120501",
      "bagNo": "001",
      "qty": "25kg"
    },
    {
      "memberName": "Ahmed Khan",
      "memberId": "APL-001",
      "role": "applicator",
      "productName": "TILE BOND 100",
      "productNo": "TB-100",
      "batchNo": "B2023120502",
      "bagNo": "002",
      "qty": "10kg"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [ ... ],
  "duplicates": [],
  "message": "2 scans added successfully"
}
```

**With Duplicates:**
```json
{
  "success": true,
  "count": 1,
  "data": [ ... ],
  "duplicates": [
    {
      "productName": "MEGA BOND PLUS",
      "batchNo": "B2023120501",
      "bagNo": "001"
    }
  ],
  "message": "1 scans added successfully. 1 duplicates were skipped."
}
```

---

### Get Scan by ID

Retrieve a single scan.

```http
GET /api/scans/:id
```

**Access:** Public

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Delete Scan

Remove a scan (admin only).

```http
DELETE /api/scans/:id
```

**Access:** Private (Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Scan deleted successfully"
}
```

---

### Get Scan Statistics

Get summary statistics.

```http
GET /api/scans/stats/summary
```

**Access:** Public

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1500,
    "applicator": 900,
    "customer": 600,
    "last24Hours": 45,
    "lastWeek": 320,
    "dailyStats": [
      { "_id": "2023-12-01", "count": 50 },
      { "_id": "2023-12-02", "count": 55 }
    ],
    "topProducts": [
      { "_id": "MEGA BOND PLUS", "count": 300 },
      { "_id": "TILE BOND 100", "count": 250 }
    ]
  }
}
```

---

### Get Live Scan Feed

Get most recent 100 scans.

```http
GET /api/scans/live
```

**Access:** Public

**Response:**
```json
{
  "success": true,
  "data": [ ... ]  // Last 100 scans
}
```

---

### Sync Members from Scans

Create/update members from all scans (admin only).

```http
POST /api/scans/sync-members
```

**Access:** Private (Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Synced members from scans. Created: 50, Updated: 100",
  "data": {
    "created": 50,
    "updated": 100,
    "totalScans": 1500
  }
}
```

---

## Product Routes

### Get All Products

Retrieve all products.

```http
GET /api/products?search=bond&category=adhesive&isActive=true
```

**Access:** Public

**Query Parameters:**
- `search` (string) - Search by name or product number
- `category` (string) - Filter by category
- `isActive` (boolean) - Filter active/inactive products

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "product_id",
      "name": "MEGA BOND PLUS",
      "productNo": "MK-001",
      "category": "Adhesive",
      "price": 25000,
      "description": "Premium tile adhesive",
      "isActive": true,
      "pointsPerProduct": null,
      "pointsPerPackSize": [
        { "packSize": "25kg", "points": 30 },
        { "packSize": "10kg", "points": 12 }
      ],
      "packSizePricing": [
        { "packSize": "25kg", "price": 25000 },
        { "packSize": "10kg", "price": 10500 }
      ]
    }
  ]
}
```

---

### Get Product by ID

Retrieve single product.

```http
GET /api/products/:id
```

**Access:** Public

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Create Product

Add new product (admin only).

```http
POST /api/products
```

**Access:** Private (Admin only)

**Request Body:**
```json
{
  "name": "MEGA BOND PLUS",
  "productNo": "MK-001",
  "category": "Adhesive",
  "price": 25000,
  "description": "Premium tile adhesive",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Update Product

Modify existing product (admin only).

```http
PUT /api/products/:id
```

**Access:** Private (Admin only)

**Request Body:**
```json
{
  "price": 26000,
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Delete Product

Remove product (admin only).

```http
DELETE /api/products/:id
```

**Access:** Private (Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Member Routes

### Get All Members

Retrieve members with filters (admin only).

```http
GET /api/members?role=applicator&search=ahmed&sortBy=points&sortOrder=desc
```

**Access:** Private (Admin only)

**Query Parameters:**
- `role` (string) - "applicator" or "customer"
- `search` (string) - Search by ID, name, or phone
- `sortBy` (string) - Field to sort by (points, totalScans, etc.)
- `sortOrder` (string) - "asc" or "desc"

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "member_id",
      "memberId": "APL-001",
      "memberName": "Ahmed Khan",
      "phone": "+94771234567",
      "role": "applicator",
      "points": 2500,
      "tier": "silver",
      "totalScans": 50,
      "location": "Colombo",
      "lastScanDate": "2023-12-05T10:30:00Z",
      "totalCashRewards": 15000
    }
  ]
}
```

---

### Get Member by ID

Retrieve single member (admin only).

```http
GET /api/members/:id
```

**Access:** Private (Admin only)

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Update Member Points

Modify member loyalty points (admin only).

```http
PUT /api/members/:id/points
```

**Access:** Private (Admin only)

**Request Body:**
```json
{
  "points": 100,
  "operation": "add"  // "set", "add", or "subtract"
}
```

**Operations:**
- `set` - Replace current points with new value
- `add` - Increase points by specified amount
- `subtract` - Decrease points by specified amount

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "member_id",
    "memberId": "APL-001",
    "memberName": "Ahmed Khan",
    "points": 2600,
    "tier": "silver"
  },
  "message": "Points added successfully"
}
```

---

### Get Member Statistics

Get member summary stats (admin only).

```http
GET /api/members/stats/summary
```

**Access:** Private (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 150,
    "totalApplicators": 90,
    "totalCustomers": 60,
    "totalPoints": 125000,
    "tierStats": {
      "bronze": 80,
      "silver": 40,
      "gold": 20,
      "platinum": 10
    }
  }
}
```

---

### Sync Members from Scans

Rebuild member data from scans (admin only).

```http
POST /api/members/sync-from-scans
```

**Access:** Private (Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Synced 150 members from 1500 scans",
  "data": {
    "created": 50,
    "updated": 100,
    "totalMembers": 150,
    "totalScans": 1500
  }
}
```

---

## Loyalty Routes

### Get Loyalty Configuration

Retrieve current loyalty settings (admin only).

```http
GET /api/loyalty/config
```

**Access:** Private (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "tierThresholds": {
      "bronze": 0,
      "silver": 2000,
      "gold": 5000,
      "platinum": 10000
    },
    "pointsCalculation": {
      "method": "price_based",
      "priceDivisor": 1000,
      "applicatorBonus": 0.1
    }
  }
}
```

---

### Update Loyalty Configuration

Modify loyalty settings (admin only).

```http
PUT /api/loyalty/config
```

**Access:** Private (Admin only)

**Request Body:**
```json
{
  "tierThresholds": {
    "bronze": 0,
    "silver": 2500,
    "gold": 6000,
    "platinum": 12000
  },
  "pointsCalculation": {
    "method": "price_based",
    "priceDivisor": 1000,
    "applicatorBonus": 0.15
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Loyalty configuration updated successfully"
}
```

---

### Update Product Points

Configure points for specific product (admin only).

```http
PUT /api/loyalty/products/:id/points
```

**Access:** Private (Admin only)

**Request Body:**
```json
{
  "pointsPerProduct": 50,
  "pointsPerPackSize": [
    { "packSize": "25kg", "points": 50 },
    { "packSize": "10kg", "points": 20 },
    { "packSize": "5kg", "points": 10 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product_id",
    "name": "MEGA BOND PLUS",
    "productNo": "MK-001",
    "pointsPerProduct": 50,
    "pointsPerPackSize": [ ... ]
  },
  "message": "Product points configuration updated successfully"
}
```

---

## Cash Rewards Routes

### Get Applicator Cash Rewards

Retrieve cash rewards for specific applicator.

```http
GET /api/cash-rewards/:memberId?year=2023&month=12
```

**Access:** Private

**Query Parameters:**
- `year` (number) - Year for specific month calculation
- `month` (number) - Month (1-12)

**Without year/month (all history):**
```json
{
  "success": true,
  "data": {
    "memberId": "APL-001",
    "memberName": "Ahmed Khan",
    "role": "applicator",
    "totalCashRewards": 45000,
    "monthlyPurchases": [
      {
        "year": 2023,
        "month": 12,
        "totalPurchaseValue": 850000,
        "cashReward": 43500,
        "rewardCalculated": true,
        "rewardPaid": true,
        "rewardPaidDate": "2024-01-15T00:00:00Z"
      }
    ]
  }
}
```

**With year/month (specific month):**
```json
{
  "success": true,
  "data": {
    "memberId": "APL-001",
    "memberName": "Ahmed Khan",
    "year": 2023,
    "month": 12,
    "totalPurchaseValue": 850000,
    "cashReward": 43500,
    "rewardCalculated": true,
    "rewardPaid": false
  }
}
```

---

### Get All Applicators Cash Rewards

Retrieve rewards for all applicators (admin only).

```http
GET /api/cash-rewards?year=2023&month=12&role=applicator
```

**Access:** Private (Admin only)

**Response:**
```json
{
  "success": true,
  "count": 90,
  "data": [
    {
      "memberId": "APL-001",
      "memberName": "Ahmed Khan",
      "year": 2023,
      "month": 12,
      "totalPurchaseValue": 850000,
      "cashReward": 43500,
      "rewardCalculated": true,
      "rewardPaid": false
    }
  ]
}
```

---

### Calculate Cash Reward

Calculate reward for specific member and month (admin only).

```http
POST /api/cash-rewards/calculate/:memberId
```

**Access:** Private (Admin only)

**Request Body:**
```json
{
  "year": 2023,
  "month": 12
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "memberId": "APL-001",
    "memberName": "Ahmed Khan",
    "year": 2023,
    "month": 12,
    "totalPurchaseValue": 850000,
    "cashReward": 43500,
    "rewardCalculated": true,
    "breakdown": [
      {
        "tier": "0 - 250,000",
        "amount": 250000,
        "rate": "4.50%",
        "reward": 11250
      },
      {
        "tier": "250,001 - 500,000",
        "amount": 250000,
        "rate": "5.00%",
        "reward": 12500
      },
      {
        "tier": "500,001 - 750,000",
        "amount": 250000,
        "rate": "5.50%",
        "reward": 13750
      },
      {
        "tier": "750,001 - 1,000,000",
        "amount": 100000,
        "rate": "6.00%",
        "reward": 6000
      }
    ]
  }
}
```

---

### Mark Reward as Paid

Mark cash reward as paid for specific month (admin only).

```http
PUT /api/cash-rewards/mark-paid/:memberId
```

**Access:** Private (Admin only)

**Request Body:**
```json
{
  "year": 2023,
  "month": 12
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "memberId": "APL-001",
    "memberName": "Ahmed Khan",
    "year": 2023,
    "month": 12,
    "cashReward": 43500,
    "rewardPaid": true,
    "rewardPaidDate": "2024-01-15T10:30:00Z",
    "totalCashRewards": 88500
  }
}
```

---

## Analytics Routes

### Get Dashboard Analytics

Comprehensive dashboard statistics (admin only).

```http
GET /api/analytics/dashboard?startDate=2023-12-01&endDate=2023-12-31
```

**Access:** Private (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalScans": 1500,
      "totalUsers": 200,
      "totalProducts": 45
    },
    "tierDistribution": [
      { "_id": "bronze", "count": 100 },
      { "_id": "silver", "count": 60 }
    ],
    "topProducts": [
      { "_id": "MEGA BOND PLUS", "count": 300 }
    ],
    "dailyTrends": [
      { "_id": "2023-12-01", "count": 50 }
    ],
    "roleDistribution": [
      { "_id": "applicator", "count": 900 },
      { "_id": "customer", "count": 600 }
    ]
  }
}
```

---

### Get Leaderboard

Get top users by points.

```http
GET /api/analytics/leaderboard?limit=10
```

**Access:** Private

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "points": 5000,
      "tier": "gold",
      "totalScans": 100,
      "achievements": [ ... ]
    }
  ]
}
```

---

## Data Models

### User Model

```javascript
{
  _id: ObjectId,
  username: String (required, unique, 3-30 chars),
  email: String (required, unique, valid email),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  points: Number (default: 0, min: 0),
  tier: String (enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze'),
  totalScans: Number (default: 0),
  isActive: Boolean (default: true),
  achievements: [{
    name: String,
    earnedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

### Member Model

```javascript
{
  _id: ObjectId,
  memberId: String (required, uppercase, unique),
  memberName: String (required),
  phone: String,
  role: String (enum: ['applicator', 'customer'], required),
  points: Number (default: 0, min: 0),
  tier: String (enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze'),
  totalScans: Number (default: 0),
  location: String,
  lastScanDate: Date,
  monthlyPurchases: [{
    year: Number,
    month: Number (1-12),
    totalPurchaseValue: Number (default: 0),
    cashReward: Number (default: 0),
    rewardCalculated: Boolean (default: false),
    rewardPaid: Boolean (default: false),
    rewardPaidDate: Date
  }],
  totalCashRewards: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

---

### Scan Model

```javascript
{
  _id: ObjectId,
  memberName: String (required),
  memberId: String (required, uppercase),
  phone: String,
  role: String (enum: ['applicator', 'customer'], required),
  productName: String (required),
  productNo: String (required),
  batchNo: String (required),
  bagNo: String (required),
  qty: String (required),
  price: Number (default: 0),
  location: String,
  timestamp: Date (default: now),
  userId: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

---

### Product Model

```javascript
{
  _id: ObjectId,
  name: String (required),
  productNo: String (required, unique with category),
  description: String,
  category: String,
  price: Number (default: 0, min: 0),
  packSizePricing: [{
    packSize: String,
    price: Number
  }],
  pointsPerProduct: Number (default: null),
  pointsPerPackSize: [{
    packSize: String,
    points: Number
  }],
  isActive: Boolean (default: true),
  batches: [{
    batchNo: String,
    manufactureDate: Date,
    expiryDate: Date,
    quantity: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

### LoyaltyConfig Model

```javascript
{
  _id: ObjectId,
  tierThresholds: {
    bronze: Number (default: 0),
    silver: Number (default: 2000),
    gold: Number (default: 5000),
    platinum: Number (default: 10000)
  },
  pointsCalculation: {
    method: String (enum: ['price_based', 'product_based', 'fixed'], default: 'price_based'),
    priceDivisor: Number (default: 1000),
    applicatorBonus: Number (default: 0.1)
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Handling

### HTTP Status Codes

- `200` - OK (Success)
- `201` - Created (Resource created)
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource doesn't exist)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Common Errors

**Authentication Error:**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

**Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**Duplicate Entry:**
```json
{
  "success": false,
  "message": "This batch number has already been scanned by a applicator",
  "duplicate": true
}
```

---

## Rate Limiting

### Limits

Different endpoints have different rate limits:

**Auth Endpoints:**
- Login: 5 requests per 15 minutes per IP
- Register: 3 requests per hour per IP
- Password Reset: 3 requests per hour per IP

**General API:**
- 100 requests per 15 minutes per IP (authenticated)
- 20 requests per 15 minutes per IP (anonymous)

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Rate Limit Error

```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

---

## Examples

### Complete Workflow Example

#### 1. Register User

```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();
const token = data.data.token;
```

#### 2. Create Scan

```javascript
const scanResponse = await fetch('/api/scans', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    memberName: 'Ahmed Khan',
    memberId: 'APL-001',
    role: 'applicator',
    productName: 'MEGA BOND PLUS',
    productNo: 'MK-001',
    batchNo: 'B2023120501',
    bagNo: '001',
    qty: '25kg'
  })
});

const scanData = await scanResponse.json();
```

#### 3. Get User Profile

```javascript
const profileResponse = await fetch('/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const profile = await profileResponse.json();
console.log(`Points: ${profile.data.points}`);
console.log(`Tier: ${profile.data.tier}`);
```

---

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

class MegakemAPI {
  constructor(token = null) {
    this.token = token;
    this.headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  async login(email, password) {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    this.token = response.data.data.token;
    this.headers['Authorization'] = `Bearer ${this.token}`;
    return response.data;
  }

  async createScan(scanData) {
    const response = await axios.post(
      `${API_BASE_URL}/scans`,
      scanData,
      { headers: this.headers }
    );
    return response.data;
  }

  async getScans(params = {}) {
    const response = await axios.get(`${API_BASE_URL}/scans`, {
      params,
      headers: this.headers
    });
    return response.data;
  }
}

// Usage
const api = new MegakemAPI();
await api.login('admin@megakem.com', 'password');
const scans = await api.getScans({ role: 'applicator', limit: 10 });
```

---

### Python Example

```python
import requests

class MegakemAPI:
    def __init__(self, base_url='http://localhost:5000/api'):
        self.base_url = base_url
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
    
    def login(self, email, password):
        response = requests.post(
            f'{self.base_url}/auth/login',
            json={'email': email, 'password': password}
        )
        data = response.json()
        self.token = data['data']['token']
        self.headers['Authorization'] = f'Bearer {self.token}'
        return data
    
    def create_scan(self, scan_data):
        response = requests.post(
            f'{self.base_url}/scans',
            json=scan_data,
            headers=self.headers
        )
        return response.json()
    
    def get_scans(self, params=None):
        response = requests.get(
            f'{self.base_url}/scans',
            params=params,
            headers=self.headers
        )
        return response.json()

# Usage
api = MegakemAPI()
api.login('admin@megakem.com', 'password')
scans = api.get_scans({'role': 'applicator', 'limit': 10})
```

---

## Appendix

### Useful Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT.io](https://jwt.io/)
- [REST API Best Practices](https://restfulapi.net/)

### Support

For API support, contact:
- Email: dev@megakem.com
- Documentation: See related files in repository

### Changelog

**v1.0 - December 2025**
- Initial API documentation
- All core endpoints documented
- Examples and error handling included

---

**Last Updated:** December 22, 2025  
**Version:** 1.0  
**Author:** Megakem Development Team





