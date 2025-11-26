# Megakem Loyalty App - Complete Flowchart

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEGAKEM LOYALTY SYSTEM                        │
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Frontend   │◄────►│   Backend    │◄────►│   MongoDB    │  │
│  │  React App   │      │ Express API  │      │   Database   │  │
│  │  Port 3000   │      │  Port 5000   │      │  Atlas Cloud │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Application Initialization Flow

```
START
  │
  ├─► Check localStorage for token
  │   │
  │   ├─► Token EXISTS?
  │   │   │
  │   │   ├─► YES
  │   │   │   │
  │   │   │   ├─► Call authAPI.getMe()
  │   │   │   │   │
  │   │   │   │   ├─► SUCCESS
  │   │   │   │   │   └─► Set user state → Go to Welcome Screen
  │   │   │   │   │
  │   │   │   │   └─► FAILURE
  │   │   │   │       └─► Remove token → Create Anonymous Session
  │   │   │   │
  │   │   └─► NO
  │   │       │
  │   │       └─► Create Anonymous Session
  │   │           │
  │   │           ├─► Call authAPI.anonymous()
  │   │           │   │
  │   │           │   └─► Receive: { token, id }
  │   │           │       │
  │   │           │       └─► Store token → Set user as anonymous
  │   │           │
  │   │           └─► Load rewards & leaderboard data (if logged in)
  │   │
  │   └─► Set initializing = false
  │
  └─► RENDER Welcome Screen
```

---

## 2. User Authentication Flow

### 2.1 Anonymous Session
```
User Opens App
  │
  └─► authAPI.anonymous()
      │
      └─► Backend: POST /api/auth/anonymous
          │
          ├─► Generate temporary userId
          │
          ├─► Generate JWT token
          │
          └─► Return: { token, id, anonymous: true }
              │
              └─► Frontend stores token in localStorage
```

### 2.2 Admin Login
```
User clicks "Admin" button
  │
  └─► Enter Credentials (email, password)
      │
      └─► authAPI.login({ email, password })
          │
          └─► Backend: POST /api/auth/login
              │
              ├─► Find user by email
              │   │
              │   ├─► NOT FOUND → Return 401 Error
              │   │
              │   └─► FOUND
              │       │
              │       └─► Compare password with bcrypt
              │           │
              │           ├─► MISMATCH → Return 401 Error
              │           │
              │           └─► MATCH
              │               │
              │               ├─► Generate JWT token
              │               │
              │               └─► Return: { token, user data }
              │                   │
              │                   └─► Frontend: Set adminAuth = true
              │                       │
              │                       └─► Redirect to Admin Dashboard
```

---

## 3. Scanning Flow (Core Feature)

### 3.1 Role Selection
```
Welcome Screen
  │
  ├─► User clicks "Applicator"
  │   │
  │   ├─► setRole('applicator')
  │   ├─► setView('scanner')
  │   └─► Initialize QR Scanner
  │
  └─► User clicks "Customer"
      │
      ├─► setRole('customer')
      ├─► setView('scanner')
      └─► Initialize QR Scanner
```

### 3.2 QR Code Scanning Process
```
Scanner View Active
  │
  └─► html5-qrcode library initializes
      │
      └─► Camera permission requested
          │
          ├─► DENIED → Show error message
          │
          └─► GRANTED
              │
              └─► Scan QR Code
                  │
                  └─► QR Detected: { batchNo, bagNo, productName }
                      │
                      ├─► Add to cart[]
                      │   │
                      │   └─► cart.push({ batchNo, bagNo, productName })
                      │
                      ├─► Show success notification
                      │
                      └─► Animate cart button (bounce effect)
```

### 3.3 Member Identification
```
View Cart (cart has items)
  │
  ├─► Enter Member ID (required)
  │
  ├─► Enter Member Name (required)
  │
  └─► Click "Submit Scans"
      │
      └─► Validation
          │
          ├─► memberId empty? → Show error
          ├─► memberName empty? → Show error
          ├─► cart empty? → Show error
          │
          └─► ALL VALID
              │
              └─► Call scansAPI.submitBatch()
```

### 3.4 Duplicate Detection Flow
```
Backend: POST /api/scans/batch
  │
  └─► For each item in batch:
      │
      └─► Check existing scan in DB
          │
          └─► Query: { batchNo, bagNo, memberId, role }
              │
              ├─► FOUND (Duplicate)
              │   │
              │   ├─► Add to duplicates[]
              │   │
              │   └─► Skip this scan
              │
              └─► NOT FOUND (New)
                  │
                  └─► Create scan record
                      │
                      ├─► Save to Scan collection
                      │
                      ├─► Award 10 points to user
                      │
                      ├─► user.points += 10
                      │
                      ├─► user.totalScans += 1
                      │
                      ├─► Check for achievements
                      │   │
                      │   ├─► First Scan (totalScans === 1)
                      │   ├─► 10 Scans (totalScans === 10)
                      │   ├─► 50 Scans (totalScans === 50)
                      │   └─► Century Club (totalScans === 100)
                      │
                      ├─► Update tier based on points
                      │   │
                      │   ├─► Bronze: 0-1999 points
                      │   ├─► Silver: 2000-4999 points
                      │   ├─► Gold: 5000-9999 points
                      │   └─► Platinum: 10000+ points
                      │
                      └─► Save user updates
```

### 3.5 Scan Submission Result
```
Response from Backend
  │
  ├─► Success (scanned > 0)
  │   │
  │   ├─► Show notification: "X items scanned!"
  │   │
  │   ├─► If duplicates exist:
  │   │   └─► Show warning: "Y duplicates detected"
  │   │
  │   ├─► Clear cart
  │   │
  │   └─► Reset to welcome screen
  │
  └─► All Duplicates (scanned === 0)
      │
      └─► Show error: "All items already scanned"
          │
          └─► Stay on cart view
```

---

## 4. Rewards System Flow

### 4.1 View Rewards
```
Welcome Screen → Click "Rewards"
  │
  └─► setView('rewards')
      │
      └─► rewardsAPI.getAll()
          │
          └─► Backend: GET /api/rewards
              │
              └─► Fetch all rewards from DB
                  │
                  └─► Return: [{ _id, title, description, pointsRequired, stock }]
                      │
                      └─► Display rewards grid
                          │
                          └─► For each reward:
                              │
                              ├─► Show points required
                              │
                              ├─► Check user.points >= pointsRequired
                              │   │
                              │   ├─► YES → Enable "Redeem" button
                              │   │
                              │   └─► NO → Disable button (Insufficient Points)
                              │
                              └─► Check stock > 0
                                  │
                                  ├─► YES → Allow redemption
                                  │
                                  └─► NO → Disable (Out of Stock)
```

### 4.2 Redeem Reward
```
User clicks "Redeem" button
  │
  └─► Open confirmation dialog
      │
      ├─► Show reward details
      │
      ├─► Show points to be deducted
      │
      ├─► Show: Current points → After redemption points
      │
      └─► User clicks "Confirm Redemption"
          │
          └─► rewardsAPI.redeem(rewardId)
              │
              └─► Backend: POST /api/rewards/redeem/:id
                  │
                  ├─► Verify user has enough points
                  │   │
                  │   ├─► NO → Return 400 Error
                  │   │
                  │   └─► YES
                  │       │
                  │       └─► Verify stock > 0
                  │           │
                  │           ├─► NO → Return 400 Error
                  │           │
                  │           └─► YES
                  │               │
                  │               ├─► Deduct points: user.points -= pointsRequired
                  │               │
                  │               ├─► Reduce stock: reward.stock -= 1
                  │               │
                  │               ├─► Create redemption record
                  │               │   │
                  │               │   └─► Save to Redemption collection
                  │               │
                  │               ├─► Save user & reward updates
                  │               │
                  │               └─► Return updated user data
                  │                   │
                  │                   └─► Frontend:
                  │                       │
                  │                       ├─► Update user state
                  │                       │
                  │                       ├─► Show success notification
                  │                       │
                  │                       ├─► Close dialog
                  │                       │
                  │                       └─► Refresh rewards list
```

---

## 5. Profile & Leaderboard Flow

### 5.1 View Profile
```
Welcome Screen → Click "Profile"
  │
  └─► setView('profile')
      │
      └─► Display user data from state:
          │
          ├─► Avatar (first letter of username)
          │
          ├─► Username & Email
          │
          ├─► Tier badge (Bronze/Silver/Gold/Platinum)
          │
          ├─► Statistics:
          │   │
          │   ├─► Total Points
          │   ├─► Total Scans
          │   ├─► Achievements count
          │   └─► Tier badge icon
          │
          ├─► Achievements list:
          │   │
          │   └─► Display earned badges as chips
          │
          └─► Scan History (last 10 scans):
              │
              └─► For each scan:
                  │
                  ├─► Product name
                  ├─► Batch & Bag numbers
                  ├─► Role (Applicator/Customer)
                  └─► Date scanned
```

### 5.2 View Leaderboard
```
Welcome Screen → Click "Leaderboard"
  │
  └─► setView('leaderboard')
      │
      └─► analyticsAPI.getLeaderboard()
          │
          └─► Backend: GET /api/analytics/leaderboard
              │
              └─► Query users sorted by points (descending)
                  │
                  └─► Return top 10 users
                      │
                      └─► Frontend displays:
                          │
                          ├─► Rank 1 (Gold medal) 🥇
                          │   └─► Gold gradient card
                          │
                          ├─► Rank 2 (Silver medal) 🥈
                          │   └─► Silver gradient card
                          │
                          ├─► Rank 3 (Bronze medal) 🥉
                          │   └─► Bronze gradient card
                          │
                          └─► Ranks 4-10
                              └─► Standard cards with rank number
                              │
                              └─► Each shows:
                                  │
                                  ├─► Username
                                  ├─► Tier badge
                                  ├─► Total scans
                                  └─► Points
```

---

## 6. Admin Dashboard Flow

### 6.1 Admin Login
```
Click "Admin" button
  │
  └─► Show login form
      │
      └─► Enter: email, password
          │
          └─► Submit
              │
              └─► authAPI.login()
                  │
                  ├─► SUCCESS (role === 'admin')
                  │   │
                  │   └─► setAdminAuth(true) → Load Admin Dashboard
                  │
                  └─► FAILURE
                      │
                      └─► Show error notification
```

### 6.2 Admin Dashboard Tabs
```
Admin Dashboard
  │
  ├─── TAB 0: Dashboard Overview
  │    │
  │    └─► Load statistics:
  │        │
  │        ├─► Total Scans (all time)
  │        ├─► Total Users
  │        ├─► Active Users (this week)
  │        ├─► Total Points Awarded
  │        │
  │        ├─► Scans by Role Chart (Pie)
  │        │   └─► Applicator vs Customer
  │        │
  │        └─► Top Products Chart (Bar)
  │            └─► Most scanned products
  │
  ├─── TAB 1: Scan Results
  │    │
  │    └─► Display all scans:
  │        │
  │        ├─► Real-time updates (polls every 3s)
  │        │
  │        └─► For each scan:
  │            │
  │            ├─► Product name
  │            ├─► Batch & Bag numbers
  │            ├─► Member name & ID
  │            ├─► Role chip
  │            ├─► Timestamp
  │            │
  │            └─► DELETE button
  │                │
  │                └─► Click → Open confirmation dialog
  │                    │
  │                    ├─► Show scan details
  │                    │
  │                    └─► Confirm delete?
  │                        │
  │                        ├─► YES
  │                        │   │
  │                        │   └─► scansAPI.delete(scanId)
  │                        │       │
  │                        │       └─► Backend: DELETE /api/scans/:id
  │                        │           │
  │                        │           ├─► Remove from DB
  │                        │           │
  │                        │           └─► Return success
  │                        │               │
  │                        │               └─► Frontend:
  │                        │                   │
  │                        │                   ├─► Remove from list
  │                        │                   │
  │                        │                   └─► Show notification
  │                        │
  │                        └─► NO
  │                            │
  │                            └─► Close dialog
  │
  ├─── TAB 2: Users Management
  │    │
  │    └─► Display all users:
  │        │
  │        ├─► Username, Email, Role
  │        ├─► Points, Tier
  │        ├─► Total Scans
  │        │
  │        └─► "Add User" button
  │            │
  │            └─► Open user creation dialog
  │                │
  │                ├─► Enter: username, email, password, role
  │                │
  │                └─► Submit
  │                    │
  │                    └─► authAPI.createUser()
  │                        │
  │                        └─► Backend: POST /api/auth/register
  │                            │
  │                            ├─► Hash password with bcrypt
  │                            │
  │                            ├─► Create user in DB
  │                            │
  │                            └─► Return new user
  │                                │
  │                                └─► Add to users list
  │
  └─── TAB 3: Products Management
       │
       └─► Display all products:
           │
           ├─► Product name
           ├─► Category
           ├─► Scans count
           │
           └─► Actions:
               │
               ├─► EDIT button
               │   │
               │   └─► Open edit dialog
               │       │
               │       ├─► Modify product details
               │       │
               │       └─► productsAPI.update()
               │
               └─► DELETE button
                   │
                   └─► Confirm delete
                       │
                       └─► productsAPI.delete()
```

---

## 7. Database Schema Flow

### 7.1 User Model
```
User Document
  │
  ├─► _id: ObjectId
  ├─► username: String (required)
  ├─► email: String (required, unique)
  ├─► password: String (hashed with bcrypt)
  ├─► role: String ('user' | 'admin')
  ├─► points: Number (default: 0)
  ├─► tier: String ('Bronze' | 'Silver' | 'Gold' | 'Platinum')
  ├─► totalScans: Number (default: 0)
  ├─► achievements: Array [String]
  ├─► resetPasswordToken: String
  ├─► createdAt: Date
  └─► updatedAt: Date
  │
  └─► Methods:
      │
      ├─► addPoints(points)
      │   └─► this.points += points
      │       └─► updateTier()
      │
      └─► updateTier()
          │
          ├─► points < 2000 → tier = 'Bronze'
          ├─► points < 5000 → tier = 'Silver'
          ├─► points < 10000 → tier = 'Gold'
          └─► points >= 10000 → tier = 'Platinum'
```

### 7.2 Scan Model
```
Scan Document
  │
  ├─► _id: ObjectId
  ├─► productName: String (required)
  ├─► batchNo: String (required)
  ├─► bagNo: String (required)
  ├─► memberId: String (required)
  ├─► memberName: String (required)
  ├─► role: String ('applicator' | 'customer')
  ├─► scannedAt: Date (default: Date.now)
  │
  └─► Composite Index (Unique):
      └─► { batchNo, bagNo, memberId, role }
          │
          └─► Prevents duplicate scans by same person/role
```

### 7.3 Product Model
```
Product Document
  │
  ├─► _id: ObjectId
  ├─► name: String (required, unique)
  ├─► category: String
  ├─► scansCount: Number (default: 0)
  ├─► createdAt: Date
  └─► updatedAt: Date
```

### 7.4 Reward Model
```
Reward Document
  │
  ├─► _id: ObjectId
  ├─► title: String (required)
  ├─► description: String (required)
  ├─► pointsRequired: Number (required)
  ├─► stock: Number (default: 0)
  ├─► active: Boolean (default: true)
  ├─► createdAt: Date
  └─► updatedAt: Date
```

### 7.5 Redemption Model
```
Redemption Document
  │
  ├─► _id: ObjectId
  ├─► userId: ObjectId (ref: 'User')
  ├─► rewardId: ObjectId (ref: 'Reward')
  ├─► pointsSpent: Number (required)
  ├─► status: String ('pending' | 'completed' | 'cancelled')
  ├─► redeemedAt: Date (default: Date.now)
  └─► completedAt: Date
```

---

## 8. API Endpoints Flow

### Authentication Routes (`/api/auth`)
```
POST /api/auth/register
  └─► Create new user account

POST /api/auth/login
  └─► Login with email/password

POST /api/auth/anonymous
  └─► Create anonymous session

GET /api/auth/me
  └─► Get current user data (requires token)

POST /api/auth/refresh
  └─► Refresh JWT token
```

### Scans Routes (`/api/scans`)
```
POST /api/scans
  └─► Create single scan

POST /api/scans/batch
  └─► Submit multiple scans with duplicate detection

GET /api/scans
  └─► Get all scans (Admin only)

GET /api/scans/live
  └─► Get real-time scans (polls for updates)

GET /api/scans/user/:userId
  └─► Get user's scan history

DELETE /api/scans/:id
  └─► Delete scan (Admin only)
```

### Products Routes (`/api/products`)
```
GET /api/products
  └─► Get all products

POST /api/products
  └─► Create product (Admin only)

PUT /api/products/:id
  └─► Update product (Admin only)

DELETE /api/products/:id
  └─► Delete product (Admin only)
```

### Rewards Routes (`/api/rewards`)
```
GET /api/rewards
  └─► Get all active rewards

POST /api/rewards
  └─► Create reward (Admin only)

PUT /api/rewards/:id
  └─► Update reward (Admin only)

DELETE /api/rewards/:id
  └─► Delete reward (Admin only)

POST /api/rewards/redeem/:id
  └─► Redeem reward (deduct points)

GET /api/rewards/history
  └─► Get user's redemption history
```

### Analytics Routes (`/api/analytics`)
```
GET /api/analytics/dashboard
  └─► Get admin dashboard statistics

GET /api/analytics/leaderboard
  └─► Get top users by points

GET /api/analytics/user-stats
  └─► Get detailed user statistics

GET /api/analytics/export
  └─► Export data as CSV (Admin only)
```

---

## 9. State Management Flow

### Frontend State Variables
```
Application State
  │
  ├─► user: { id, username, email, role, points, tier, totalScans, achievements }
  │
  ├─► view: 'welcome' | 'scanner' | 'cart' | 'profile' | 'rewards' | 'leaderboard' | 'admin'
  │
  ├─► role: 'applicator' | 'customer'
  │
  ├─► cart: [{ batchNo, bagNo, productName }]
  │
  ├─► scanHistory: [Scan objects]
  │
  ├─► products: [Product objects]
  │
  ├─► rewards: [Reward objects]
  │
  ├─► leaderboard: [User objects sorted by points]
  │
  ├─► adminAuth: Boolean (admin logged in)
  │
  ├─► darkMode: Boolean (theme toggle)
  │
  ├─► loading: Boolean (async operations)
  │
  └─► snackbar: { open, msg, type }
```

---

## 10. Security Flow

### JWT Authentication
```
User Request with Token
  │
  └─► Middleware: auth.js
      │
      ├─► Extract token from header
      │   │
      │   └─► Header format: "Bearer <token>"
      │
      ├─► Verify token with jwt.verify()
      │   │
      │   ├─► INVALID → Return 401 Unauthorized
      │   │
      │   └─► VALID
      │       │
      │       └─► Decode payload: { userId }
      │           │
      │           └─► Find user in DB
      │               │
      │               ├─► NOT FOUND → Return 401
      │               │
      │               └─► FOUND
      │                   │
      │                   ├─► Attach user to req.user
      │                   │
      │                   └─► Call next() → Proceed to route handler
```

### Admin Authorization
```
Admin-only Route
  │
  └─► Middleware chain: [auth, admin]
      │
      ├─► 1. auth middleware
      │   └─► Verify token & attach user
      │
      └─► 2. admin middleware
          │
          └─► Check req.user.role === 'admin'
              │
              ├─► NO → Return 403 Forbidden
              │
              └─► YES → Call next() → Allow access
```

### Password Security
```
User Registration/Login
  │
  ├─► Registration:
  │   │
  │   ├─► Plain password received
  │   │
  │   ├─► Generate salt: bcrypt.genSalt(10)
  │   │
  │   ├─► Hash password: bcrypt.hash(password, salt)
  │   │
  │   └─► Store hashed password in DB
  │
  └─► Login:
      │
      ├─► Plain password received
      │
      ├─► Fetch user's hashed password from DB
      │
      ├─► Compare: bcrypt.compare(plainPassword, hashedPassword)
      │
      ├─► MATCH → Generate JWT token
      │
      └─► NO MATCH → Return 401 error
```

---

## 11. Error Handling Flow

```
Error Occurs
  │
  ├─── Frontend Error
  │    │
  │    ├─► Catch in try-catch block
  │    │
  │    ├─► Check error.response?.data?.message
  │    │
  │    ├─► Show notification with error message
  │    │
  │    └─► Log to console for debugging
  │
  └─── Backend Error
       │
       ├─► Validation Error (400)
       │   └─► express-validator errors
       │       └─► Return formatted error messages
       │
       ├─► Authentication Error (401)
       │   └─► Invalid/missing token
       │       └─► Return "Not authorized"
       │
       ├─► Authorization Error (403)
       │   └─► Insufficient permissions
       │       └─► Return "Access denied"
       │
       ├─► Not Found Error (404)
       │   └─► Resource doesn't exist
       │       └─► Return "Not found"
       │
       ├─► Duplicate Key Error (11000)
       │   └─► MongoDB unique constraint
       │       └─► Return "Already exists"
       │
       └─── Server Error (500)
            └─► Unexpected errors
                └─► Return "Server error" + log to console
```

---

## 12. Real-time Updates Flow

```
Admin Dashboard - Live Scans
  │
  └─► useEffect hook with interval
      │
      └─► Every 3 seconds:
          │
          └─► scansAPI.getLive()
              │
              └─► Backend: GET /api/scans/live
                  │
                  └─► Return latest scans
                      │
                      └─► Frontend: Update scanHistory state
                          │
                          └─► Re-render scan list
                              │
                              └─► User sees new scans appear automatically
```

---

## 13. Theme & Dark Mode Flow

```
User clicks theme toggle button
  │
  └─► Toggle darkMode state
      │
      └─► darkMode ? 'dark' : 'light'
          │
          └─► createTheme(mode)
              │
              ├─── Light Mode
              │    │
              │    ├─► Primary: #003366 (Navy Blue)
              │    ├─► Secondary: #A4D233 (Lime Green)
              │    ├─► Background: Gradient (White to Light Blue)
              │    └─► Paper: White
              │
              └─── Dark Mode
                   │
                   ├─► Primary: #003366 (Navy Blue)
                   ├─► Secondary: #A4D233 (Lime Green)
                   ├─► Background: #0a1929 (Dark Navy)
                   └─► Paper: #132f4c (Dark Blue)
```

---

## 14. Mobile Responsiveness Flow

```
Screen Size Detection
  │
  ├─── Desktop (>960px)
  │    │
  │    ├─► Full layout with sidebars
  │    ├─► Large buttons & text
  │    └─► Grid layout (3 columns)
  │
  ├─── Tablet (600px-960px)
  │    │
  │    ├─► Medium layout
  │    ├─► Medium buttons & text
  │    └─► Grid layout (2 columns)
  │
  └─── Mobile (<600px)
       │
       ├─► Compact layout
       ├─► Smaller buttons & text
       ├─► Grid layout (1 column)
       ├─► Reduced padding
       └─► Stacked navigation
```

---

## 15. Complete User Journey Examples

### Example 1: First-time User Scanning
```
1. User opens app → Anonymous session created
2. Clicks "Applicator" role
3. Grants camera permission
4. Scans QR code → Item added to cart
5. Scans more items (multiple)
6. Clicks cart button (floating)
7. Enters Member ID: "APP001"
8. Enters Member Name: "John Doe"
9. Clicks "Submit Scans"
10. Backend processes:
    - Creates scan records
    - Awards 10 points per scan
    - Checks for "First Scan" achievement → Awarded!
    - Updates user tier (still Bronze)
11. Shows success: "5 items scanned successfully!"
12. Returns to welcome screen
13. User can now click "Profile" to see:
    - Points: 50
    - Tier: Bronze
    - Achievements: First Scan ⭐
```

### Example 2: Redeeming Rewards
```
1. User logs in (not anonymous)
2. Scans multiple times over several sessions
3. Accumulates 500 points
4. Clicks "Rewards" from welcome screen
5. Views rewards catalog
6. Finds reward: "Free Product Sample" (100 points)
7. Clicks "Redeem"
8. Confirmation dialog shows:
   - Current: 500 points
   - After: 400 points
9. Clicks "Confirm Redemption"
10. Backend processes:
    - Verifies points (500 >= 100) ✓
    - Deducts 100 points
    - Reduces stock by 1
    - Creates redemption record
11. Frontend updates:
    - User points: 400
    - Shows success notification
    - Refreshes rewards list
12. User can track in redemption history
```

### Example 3: Admin Managing System
```
1. Admin clicks "Admin" button
2. Logs in with credentials
3. Sees Dashboard (Tab 0):
   - Total Scans: 1,234
   - Total Users: 45
   - Charts with data visualization
4. Switches to "Scan Results" (Tab 1)
5. Sees real-time scan list (updates every 3s)
6. Finds duplicate/error scan
7. Clicks delete button
8. Confirms deletion
9. Scan removed from system
10. Switches to "Users" (Tab 2)
11. Clicks "Add User"
12. Creates new user account
13. Switches to "Products" (Tab 3)
14. Updates product information
15. Logs out
```

---

## Summary Statistics

```
┌─────────────────────────────────────────────────┐
│         SYSTEM COMPONENT BREAKDOWN               │
├─────────────────────────────────────────────────┤
│  Frontend Views:          8 main views          │
│  Backend Routes:          25+ API endpoints     │
│  Database Models:         5 collections         │
│  Authentication:          JWT + bcrypt          │
│  Real-time Features:      Live scan polling     │
│  Points System:           Auto-calculated       │
│  Tier System:             4 tiers (Bronze-Plat) │
│  Achievements:            4 types               │
│  Duplicate Prevention:    Composite indexing    │
│  Admin Controls:          Full CRUD operations  │
│  Theme Support:           Light + Dark mode     │
│  Mobile Responsive:       Yes (breakpoints)     │
└─────────────────────────────────────────────────┘
```

---

## Technology Stack

```
FRONTEND:
  ├─► React 18.3.1
  ├─► Material-UI 5.16.7
  ├─► Axios 1.7.9
  ├─► Recharts 2.15.0
  └─► html5-qrcode

BACKEND:
  ├─► Node.js
  ├─► Express 4.21.2
  ├─► Mongoose 8.9.3
  ├─► JWT (jsonwebtoken)
  ├─► bcryptjs
  └─► express-validator

DATABASE:
  └─► MongoDB Atlas (Cloud)

SECURITY:
  ├─► JWT Authentication
  ├─► bcrypt Password Hashing
  ├─► CORS Protection
  └─► Role-based Authorization
```

---

**End of Flowchart Document**

*This comprehensive flowchart covers all aspects of the Megakem Loyalty App system, from initialization to user journeys, including security, database operations, and API flows.*
