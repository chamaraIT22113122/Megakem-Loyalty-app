# Megakem Loyalty System - Frontend

React frontend application with Material-UI for the Megakem Loyalty System.

## 🚀 Quick Start

1. **Install Dependencies**
```powershell
npm install
```

2. **Configure Environment**
```powershell
cp .env.example .env
```

Edit `.env` to set your backend API URL (default: http://localhost:5000/api).

3. **Start Development Server**
```powershell
npm start
```

The app will open at `http://localhost:3000`.

## 📦 Dependencies

- **react** - UI library
- **@mui/material** - Material Design components
- **@mui/icons-material** - Material Design icons
- **axios** - HTTP client
- **react-scripts** - Create React App scripts

## 🎨 Features

### Views

1. **Welcome Screen**
   - Role selection (Applicator/Customer)
   - Clean card-based interface

2. **Scanner View**
   - Real camera QR scanning using html5-qrcode
   - Mock QR codes for testing
   - Live cart counter

3. **Cart View**
   - Review scanned items
   - Remove items
   - Add member information
   - Batch submission

4. **Admin View**
   - Live data feed
   - Auto-refresh every 3 seconds
   - Detailed scan information

### QR Code Scanning

The app supports two scanning methods:

1. **Real Camera Scanning**
   - Uses device camera
   - Html5-qrcode library
   - Works on mobile and desktop

2. **Mock Scanning** (for testing)
   - 4 pre-defined products
   - Tap to simulate scan
   - No camera required

## 🏗️ Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main application component
│   ├── index.js        # Entry point
│   ├── index.css       # Global styles
│   └── services/
│       └── api.js      # API client and endpoints
├── package.json
└── .env.example
```

## 🔌 API Integration

The app communicates with the backend via REST API:

### API Client (`services/api.js`)

```javascript
import { authAPI, scansAPI, productsAPI } from './services/api';

// Authentication
await authAPI.anonymous();
await authAPI.login(credentials);

// Scans
await scansAPI.getLive();
await scansAPI.createBatch(scans);

// Products
await productsAPI.getAll();
```

### Authentication

- Anonymous sessions created automatically
- JWT tokens stored in localStorage
- Automatic token refresh on API calls

## 🎨 Theming

The app uses a custom Material-UI theme:

```javascript
const theme = createTheme({
  palette: {
    primary: { main: '#4338ca' },    // Indigo
    secondary: { main: '#fbbf24' },  // Amber
    background: { default: '#f8fafc' }
  },
  shape: { borderRadius: 12 }
});
```

## 📱 Responsive Design

- Mobile-first approach
- Optimized for tablets and desktops
- Container maxWidth: 'sm' (600px)

## 🛠️ Development

### Available Scripts

```powershell
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (irreversible)
npm run eject
```

### Development Server

- Hot reload enabled
- Runs on port 3000
- Proxies API requests to backend (port 5000)

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Camera scanning requires HTTPS in production (or localhost).

## 🔒 Security

- No sensitive data stored in code
- Environment variables for configuration
- JWT tokens for authentication
- CORS protection on backend

## 📦 Building for Production

```powershell
npm run build
```

Creates optimized production build in `build/` folder.

### Deployment Options

1. **Static Hosting** (Netlify, Vercel, GitHub Pages)
2. **Docker Container**
3. **Traditional Web Server** (Apache, Nginx)

### Environment Configuration

Set `REACT_APP_API_URL` to your production backend URL:

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

## 🧪 Testing

### Mock QR Codes

The app includes 4 mock products for testing:

1. UltraSeal Waterproofing - 5KG
2. Premium Wall Putty - 20KG
3. Exterior Primer X - 10L
4. SuperBond Adhesive - 1KG

### Test Flow

1. Select role (Applicator/Customer)
2. Click mock product to simulate scan
3. View in cart
4. Enter member details (e.g., "APP-001")
5. Submit batch
6. View in Admin panel

## 🎯 Key Components

### App Component

Main application with:
- View state management
- Scanner integration
- API communication
- Notification system

### Material-UI Components Used

- AppBar, Toolbar
- Cards, CardContent
- Buttons, TextField
- Chips, Lists
- Snackbar, Alert
- CircularProgress
- Grid, Container, Box

## 📝 Code Style

- Functional components with Hooks
- ES6+ syntax
- Material-UI sx prop for styling
- Organized imports

## 🐛 Common Issues

### Camera Not Working

- Ensure HTTPS (or localhost)
- Check browser permissions
- Use mock scanning for testing

### API Connection Failed

- Verify backend is running
- Check REACT_APP_API_URL in .env
- Verify CORS settings in backend

### Build Errors

- Clear node_modules and reinstall
- Check Node.js version (v16+)
- Verify all dependencies installed

## 📖 Learning Resources

- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Create React App](https://create-react-app.dev/)
