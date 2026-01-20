import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Typography, AppBar, Toolbar, Card, CardContent, CardActionArea, List, ListItem, ListItemText, Chip, Container, CircularProgress, Snackbar, Alert, Grid, Paper, Fab, Divider, ThemeProvider, createTheme, CssBaseline, IconButton, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Avatar, Tooltip, Skeleton, LinearProgress, InputAdornment } from '@mui/material';
import { QrCodeScanner, Person, Inventory2, AdminPanelSettings, ArrowForward, Delete, Add, CheckCircle, History as HistoryIcon, Dashboard as DashboardIcon, People, Category, Settings, TrendingUp, Edit, Save, Cancel, EmojiEvents, CardGiftcard, Star, GetApp, Refresh, Notifications, Security, Assessment, Visibility, VisibilityOff, FileDownload, Calculate } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { authAPI, scansAPI, productsAPI, analyticsAPI, membersAPI, loyaltyAPI, cashRewardsAPI } from './services/api';
import megakemLogo from './assets/Megakem Logo.png';
import megakemBrandLogo from './assets/Megakem Brand Logo-01.png';


const getTheme = () => createTheme({
  palette: { 
    mode: 'light',
    primary: { 
      main: '#003366', 
      light: '#4A90A4', 
      dark: '#001a33', 
      lighter: '#e6f2ff' 
    }, 
    secondary: { 
      main: '#A4D233', 
      light: '#c5e066', 
      dark: '#7fa326', 
      lighter: '#f5fce8' 
    },
    success: { 
      main: '#10b981', 
      lighter: '#d1fae5', 
      light: '#34d399', 
      dark: '#059669' 
    },
    warning: { 
      main: '#f59e0b', 
      lighter: '#fef3c7', 
      light: '#fbbf24', 
      dark: '#d97706' 
    },
    error: { 
      main: '#ef4444', 
      lighter: '#fee2e2', 
      light: '#f87171', 
      dark: '#dc2626' 
    },
    info: { 
      main: '#00B4D8', 
      lighter: '#cffafe', 
      light: '#22d3ee', 
      dark: '#0891b2' 
    },
    background: { 
      default: '#f8fafc', 
      paper: '#ffffff'
    }
  },
  shape: { borderRadius: 16 },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920
    }
  },
  components: {
    MuiButton: { 
      styleOverrides: { 
        root: { 
          textTransform: 'none', 
          fontWeight: 600, 
          padding: '12px 28px',
          borderRadius: '12px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '@media (max-width: 600px)': {
            padding: '10px 20px',
            fontSize: '0.875rem'
          }
        },
        contained: {
          background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)',
          boxShadow: '0 4px 14px 0 rgba(0,51,102,0.3)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px 0 rgba(0,51,102,0.4)',
            background: 'linear-gradient(135deg, #001a33 0%, #003366 100%)'
          },
          '&:active': {
            transform: 'translateY(0px)',
            boxShadow: '0 2px 8px 0 rgba(0,51,102,0.3)'
          }
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px 0 rgba(0,51,102,0.15)'
          }
        }
      } 
    },
    MuiCard: { 
      styleOverrides: { 
        root: { 
          boxShadow: '0 2px 8px -2px rgba(0,51,102,0.1), 0 4px 12px -2px rgba(0,51,102,0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '16px',
          '@media (hover: hover)': {
            '&:hover': {
              boxShadow: '0 8px 24px -4px rgba(0,51,102,0.15), 0 12px 32px -4px rgba(0,51,102,0.1)',
              transform: 'translateY(-4px)'
            }
          }
        } 
      } 
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: '8px',
          '@media (max-width: 600px)': {
            fontSize: '0.7rem',
            height: '24px'
          }
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            paddingLeft: '16px',
            paddingRight: '16px'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.3s ease',
            '&:hover fieldset': {
              borderWidth: '2px'
            },
            '&.Mui-focused fieldset': {
              borderWidth: '2px',
              boxShadow: '0 0 0 3px rgba(0,51,102,0.1)'
            }
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        },
        elevation1: {
          boxShadow: '0 2px 8px -2px rgba(0,51,102,0.1), 0 4px 12px -2px rgba(0,51,102,0.05)'
        }
      }
    }
  }
});

const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
  const script = document.createElement('script');
  script.src = src; script.onload = resolve; script.onerror = reject;
  document.head.appendChild(script);
});

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [view, setView] = useState('welcome');
  const [role, setRole] = useState('applicator');
  const [memberId, setMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [location, setLocation] = useState('');
  const [cart, setCart] = useState([]);
  const [pendingScan, setPendingScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pullToRefreshY, setPullToRefreshY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', type: 'success' });
  const [adminAuth, setAdminAuth] = useState(() => {
    const stored = localStorage.getItem('adminAuth');
    return stored === 'true';
  });
  const [adminEmail, setAdminEmail] = useState(() => {
    return localStorage.getItem('adminEmail') || '';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTab, setAdminTab] = useState(0);
  const [userLoginEmail, setUserLoginEmail] = useState('');
  const [userLoginPassword, setUserLoginPassword] = useState('');
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [searchMemberId, setSearchMemberId] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [memberHistory, setMemberHistory] = useState([]);
  const [historyDateRange, setHistoryDateRange] = useState({ start: '', end: '' });
  const [historyProductFilter, setHistoryProductFilter] = useState('');
  const [historySortBy, setHistorySortBy] = useState('date-desc');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState(null);
  const [products, setProducts] = useState([]);
  const [loyaltyConfigDialog, setLoyaltyConfigDialog] = useState({ open: false });
  const [productPointsDialog, setProductPointsDialog] = useState({ open: false, product: null });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ username: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [productDialog, setProductDialog] = useState({ open: false, product: null });
  const [userDialog, setUserDialog] = useState({ open: false, user: null });
  const [rewardBreakdownDialog, setRewardBreakdownDialog] = useState({ open: false, member: null, breakdown: [] });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, scanId: null, scanDetails: null });
  const [userDeleteDialog, setUserDeleteDialog] = useState({ open: false, userId: null, userDetails: null });
  const [pointsDialog, setPointsDialog] = useState({ open: false, user: null, points: '', operation: 'set' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [scanSearchQuery, setScanSearchQuery] = useState('');
  const [scanDateFilter, setScanDateFilter] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [scansPerPage] = useState(10);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [cashRewards, setCashRewards] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [notificationPrefs, setNotificationPrefs] = useState({ email: true, push: true, autoRefresh: true, soundEnabled: false });
  const [activityLog, setActivityLog] = useState([]);
  const [userPermissions, setUserPermissions] = useState({ canDelete: true, canExport: true, canManageUsers: true, canManageProducts: true });
  const [backupPasswordDialog, setBackupPasswordDialog] = useState({ open: false, password: '' });
  const [restorePasswordDialog, setRestorePasswordDialog] = useState({ open: false, password: '', file: null, backupData: null });
  const [showPassword, setShowPassword] = useState({
    adminLogin: false,
    userLogin: false,
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
    backupPassword: false,
    restorePassword: false,
    coAdminPassword: false,
    resetPassword: false
  });
  const scannerRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedAdminAuth = localStorage.getItem('adminAuth');
        
        if (token) {
          try { 
            const response = await authAPI.getMe(); 
            setUser(response.data.data);
            // Keep default welcome view - don't auto-switch to admin
            // Users can manually click "Admin" button to access admin panel
          }
          catch { 
            localStorage.removeItem('token'); 
            localStorage.removeItem('adminAuth');
            await createAnonymousSession(); 
          }
        } else { await createAnonymousSession(); }
      } catch (error) { 
        console.error('Auth error:', error); 
        showNotification(getUserFriendlyError(error), 'error', 5000); 
      }
      finally { setInitializing(false); }
    };
    initAuth();
  }, []);

  const createAnonymousSession = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await authAPI.anonymous();
        const { token, id } = response.data.data;
        localStorage.setItem('token', token);
        setUser({ id, anonymous: true });
        return; // Success, exit function
      } catch (error) {
        console.error(`Anonymous auth error (attempt ${i + 1}/${retries}):`, error);
        if (i === retries - 1) {
          // Last attempt failed, show error to user
          showNotification(
            'Unable to connect to server. Please check your connection and refresh the page.',
            'error',
            8000
          );
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
  };

  // Extract pack size from batch code (e.g., "001" -> "1kg", "010" -> "10kg")
  const extractPackSize = (packSizeCode) => {
    if (!packSizeCode) return '1kg';
    const numericValue = parseInt(packSizeCode, 10);
    return isNaN(numericValue) ? packSizeCode : `${numericValue}kg`;
  };

  // Get price for a product based on product code and pack size
  const getProductPrice = (productCode, packSize) => {
    const product = products.find(p => 
      p.productNo.toUpperCase() === productCode.toUpperCase()
    );
    
    if (!product) return 0;
    
    // Check if product has pack size pricing
    if (product.packSizePricing && product.packSizePricing.length > 0) {
      const pricing = product.packSizePricing.find(p => 
        p.packSize.toLowerCase() === packSize.toLowerCase()
      );
      if (pricing) return pricing.price;
    }
    
    // Fall back to default price
    return product.price || 0;
  };

  // Parse batch number to extract components
  const parseBatchInfo = (batchNo) => {
    if (!batchNo) return null;
    
    // Try to parse format with underscores: "MKL46_001_050525_001"
    let parts = batchNo.trim().split('_');
    
    if (parts.length === 4) {
      const [productCode, materialBatch, dateCode, packNo] = parts;
      
      // Parse date: 050525 -> 05/05/25 -> May 5, 2025
      let formattedDate = dateCode;
      if (dateCode.length === 6) {
        const day = dateCode.substring(0, 2);
        const month = dateCode.substring(2, 4);
        const year = '20' + dateCode.substring(4, 6);
        formattedDate = `${day}/${month}/${year}`;
      }
      
      return {
        productCode,
        materialBatch,
        date: formattedDate,
        packSize: '1', // Will be fetched from product
        packNo,
        parsed: true
      };
    }
    
    // Try to parse old format with spaces: "MLSP 001 050525 001 001"
    parts = batchNo.trim().split(/\s+/);
    
    if (parts.length === 5) {
      const [productCode, materialBatch, dateCode, packSize, packNo] = parts;
      
      // Parse date: 050525 -> 05/05/25 -> May 5, 2025
      let formattedDate = dateCode;
      if (dateCode.length === 6) {
        const day = dateCode.substring(0, 2);
        const month = dateCode.substring(2, 4);
        const year = '20' + dateCode.substring(4, 6);
        formattedDate = `${day}/${month}/${year}`;
      }
      
      return {
        productCode,
        materialBatch,
        date: formattedDate,
        packSize: extractPackSize(packSize),
        packNo,
        parsed: true
      };
    }
    
    return { raw: batchNo, parsed: false };
  };

  // Handle QR code URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const batchParam = params.get('batch') || params.get('batchNo');
    
    if (batchParam) {
      console.log('Detected batch parameter:', batchParam);
      
      // Parse the batch format: "MLSP 001 050525 001 001"
      // Components: Product Code, Material Batch No, Date, Pack Size, Pack No
      const parts = batchParam.trim().split(/\s+/);
      
      if (parts.length === 5) {
        const [productCode, materialBatch, dateCode, packSize, packNo] = parts;
        
        const parsedData = {
          productCode,        // "MLSP" - for product matching
          materialBatch,      // "001"
          dateCode,           // "050525" - date
          packSize: extractPackSize(packSize),  // "001" -> "1kg" - quantity
          bagNo: packNo,      // "001" - bag/pack number
          fullBatch: batchParam // Full string for display
        };
        
        console.log('Parsed batch data:', parsedData);
        setPendingScan(parsedData);
      } else {
        console.warn('Unexpected batch format, expected 5 parts, got:', parts.length);
        // Fallback for other formats
        setPendingScan({ batchNo: batchParam, fullBatch: batchParam });
      }
    }
  }, []);

  // Function to recalculate prices for scans based on current product catalog
  const recalculateScanPrices = (scans, currentProducts) => {
    return scans.map(scan => {
      // Skip if price is already set and greater than 0
      if (scan.price > 0) return scan;
      
      // Try to find matching product by code and pack size
      const product = currentProducts.find(p => 
        p.productNo.toUpperCase() === scan.productNo.toUpperCase() &&
        p.category && scan.qty && p.category.toUpperCase() === scan.qty.toUpperCase()
      );
      
      // Update price if product found
      if (product && product.price > 0) {
        return { ...scan, price: product.price };
      }
      
      return scan;
    });
  };

  // Function to refresh scan history
  const refreshScanHistory = async () => {
    if (!user) return;
    try { 
      const response = await scansAPI.getLive(); 
      const scans = response.data.data;
      
      // Recalculate prices for scans with price = 0 using current product catalog
      const scansWithUpdatedPrices = recalculateScanPrices(scans, products);
      setScanHistory(scansWithUpdatedPrices);
      setLastUpdateTime(new Date());
    }
    catch (error) { console.error('Error fetching scans:', error); }
  };

  useEffect(() => {
    if (!user) return;
    // Fetch scans immediately
    refreshScanHistory();
    // Set up polling to refresh every 3 seconds
    pollIntervalRef.current = setInterval(refreshScanHistory, 3000);
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const productsRes = await productsAPI.getAll();
        setProducts(productsRes.data.data);
        
        // Load additional data for logged-in users
        if (!user.anonymous) {
          const leaderboardRes = await analyticsAPI.getLeaderboard();
          setLeaderboard(leaderboardRes.data.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [user]);

  const initializeScanner = () => {
    if (!window.Html5QrcodeScanner) return;
    
    const container = document.getElementById('reader');
    if (!container) {
      console.warn('QR reader element not found');
      return;
    }
    container.innerHTML = '';
    
    const scanner = new window.Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render(async (decodedText) => {
      // Clear the scanner temporarily
      await scanner.clear().catch(err => console.error('Failed to clear scanner', err));
      
      // Process the scan
      await handleScan(decodedText);
      
      // Restart the scanner after a short delay
      setTimeout(() => {
        if (view === 'scanner') {
          initializeScanner();
        }
      }, 500);
    }, () => {});
    
    scannerRef.current = scanner;
  };

  useEffect(() => {
    if (view === 'scanner') {
      loadScript('https://unpkg.com/html5-qrcode').then(() => {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          if (window.Html5QrcodeScanner && view === 'scanner') {
            initializeScanner();
          }
        }, 100);
      }).catch(err => console.error('Failed to load QR library', err));
    }
    return () => { if (scannerRef.current) { scannerRef.current.clear().catch(() => {}); scannerRef.current = null; } };
  }, [view]);

  // User-friendly error messages
  const getUserFriendlyError = (error) => {
    if (!navigator.onLine) return 'No internet connection. Please check your network.';
    if (error.code === 'ECONNABORTED') return 'Request timeout. Please try again.';
    if (error.response) {
      const status = error.response.status;
      if (status === 400) return error.response.data?.message || 'Invalid request. Please check your input.';
      if (status === 401) return 'Session expired. Please log in again.';
      if (status === 403) return 'Access denied. You don\'t have permission.';
      if (status === 404) return 'Resource not found.';
      if (status === 429) return 'Too many requests. Please wait a moment.';
      if (status >= 500) return 'Server error. Please try again later.';
      return error.response.data?.message || 'Something went wrong.';
    }
    if (error.request) return 'No response from server. Please check your connection.';
    return error.message || 'An unexpected error occurred.';
  };

  const showNotification = (msg, type = 'success', duration = 4000) => {
    setSnackbar({ open: true, msg, type, duration });
  };
  
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // Excel Export Functions
  const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification(`Exported ${data.length} records to Excel successfully!`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export data to Excel', 'error');
    }
  };

  const handleExportPurchaseHistory = () => {
    if (memberHistory.length === 0) {
      return showNotification('No data to export', 'warning');
    }
    const exportData = memberHistory.map(scan => ({
      'Date': new Date(scan.timestamp).toLocaleString(),
      'Product': scan.productName || scan.productNo,
      'Product Code': scan.productNo,
      'Pack Size': scan.qty || scan.packSize || 'N/A',
      'Batch Number': scan.batchNo,
      'Member ID': scan.memberId || 'N/A',
      'Phone': scan.phone || 'N/A',
      'Location': scan.location || 'N/A',
      'Loyalty Points': scan.points || 0
    }));
    exportToExcel(exportData, 'Purchase_History', 'History');
  };

  const handleExportAllScans = () => {
    if (scanHistory.length === 0) {
      return showNotification('No data to export', 'warning');
    }
    const exportData = scanHistory.map(scan => {
      const product = products.find(p => 
        p.productNo.toUpperCase() === scan.productNo.toUpperCase() && 
        p.category && scan.qty && p.category.toUpperCase() === scan.qty.toUpperCase()
      );
      const price = product ? product.price : (scan.price || 0);
      return {
        'Date': new Date(scan.timestamp).toLocaleString(),
        'Product': scan.productName || scan.productNo,
        'Product Code': scan.productNo,
        'Pack Size': scan.qty || scan.packSize || 'N/A',
        'Price (Rs.)': price,
        'Batch Number': scan.batchNo,
        'Member ID': scan.memberId || 'N/A',
        'Phone': scan.phone || 'N/A',
        'Location': scan.location || 'N/A',
        'Points': scan.points || 0
      };
    });
    exportToExcel(exportData, 'All_Scans_Report', 'Scans');
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      return showNotification('No products to export', 'warning');
    }
    const exportData = products.map(product => ({
      'Product Code': product.productNo,
      'Product Name': product.name,
      'Pack Size': product.category,
      'Price (Rs.)': product.price || 0,
      'Points': product.points || 0,
      'Description': product.description || 'N/A'
    }));
    exportToExcel(exportData, 'Products_List', 'Products');
  };

  const handleExportUsers = () => {
    if (users.length === 0) {
      return showNotification('No users to export', 'warning');
    }
    const exportData = users.map(user => ({
      'Email': user.email,
      'Username': user.username || user.email,
      'Role': user.role || 'Co-Admin',
      'Created At': user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'
    }));
    exportToExcel(exportData, 'Admin_Users_List', 'Users');
  };

  const handleScan = async (qrString) => {
    try {
      let data;
      
      // Try to parse as JSON first
      try {
        data = JSON.parse(qrString);
      } catch {
        // Parse batch number - supports two formats:
        // New format: "MKL46_001_050525_001" (underscore-separated)
        // Old format: "MKL46 001 050525 001 001" (space-separated)
        
        let parts = qrString.trim().split('_');
        let productCode, materialBatch, dateCode, packSize, packNo;
        
        if (parts.length === 4) {
          // New underscore format: MKL46_001_050525_001
          [productCode, materialBatch, dateCode, packNo] = parts;
          packSize = null; // Will get from product category
        } else {
          // Try space-separated format
          parts = qrString.trim().split(/\s+/);
          if (parts.length === 5) {
            // Old 5-part format: MLSP 001 050525 001 001
            [productCode, materialBatch, dateCode, packSize, packNo] = parts;
          } else if (parts.length === 4) {
            // New space format: MKL46 001 050525 001
            [productCode, materialBatch, dateCode, packNo] = parts;
            packSize = null;
          } else {
            throw new Error('Invalid batch format');
          }
        }
        
        // If products not loaded yet, load them
        let currentProducts = products;
        if (currentProducts.length === 0) {
          console.log('Products not loaded, fetching...');
          try {
            const productsRes = await productsAPI.getAll();
            currentProducts = productsRes.data.data;
            setProducts(currentProducts);
          } catch (error) {
            console.error('Error loading products:', error);
          }
        }
        
        console.log('=== PRODUCT MATCHING DEBUG ===');
        console.log('Batch format:', qrString);
        console.log('Parsed - Product Code:', productCode);
        console.log('Parsed - Material Batch:', materialBatch);
        console.log('Parsed - Date Code:', dateCode);
        console.log('Parsed - Pack Size:', packSize || 'N/A (will use from product)');
        console.log('Parsed - Pack No:', packNo);
        console.log('');
        console.log('Available products:');
        currentProducts.forEach((p, idx) => {
          console.log(`  ${idx + 1}. ${p.name} [${p.productNo}]`);
          console.log(`     Pack Size: ${p.category || 'N/A'} | Price: Rs. ${p.price?.toLocaleString() || '0'}`);
        });
        console.log('');
        
        // Find product by code (case-insensitive)
        const product = currentProducts.find(p => 
          p.productNo && p.productNo.toUpperCase() === productCode.toUpperCase()
        );
        
        if (product) {
          console.log('✅ PRODUCT MATCHED:');
          console.log('   Name:', product.name);
          console.log('   Code:', product.productNo);
          console.log('   Pack Size:', product.category || 'N/A');
          console.log('   Price: Rs.', product.price?.toLocaleString() || '0');
          
          // Use pack size from batch if available, otherwise from product
          const finalPackSize = packSize ? extractPackSize(packSize) : (product.category || '1kg');
          
          data = {
            id: product.productNo,
            name: product.name,
            batch: qrString,
            bag: packNo || '001',
            qty: finalPackSize,
            price: product.price || 0
          };
          
          showNotification(`Added ${product.name} (${finalPackSize}) - Rs. ${product.price?.toLocaleString() || '0'}`, 'success');
        } else {
          console.log('❌ NO PRODUCT FOUND');
          console.log('   Code:', productCode);
          console.log('   → Add this product in Admin > Products tab');
          
          // Show unknown item but don't stop - let user see what was scanned
          data = {
            name: `Unknown Item (${productCode})`,
            batch: qrString,
            bag: packNo || 'N/A',
            id: productCode,
            qty: packSize ? extractPackSize(packSize) : '1kg',
            price: 0
          };
          
          showNotification(
            `Product "${productCode}" not found. Please add it in the Products tab first.`,
            'error',
            5000
          );
        }
        console.log('================================');
      }
      
      const newItem = { ...data, tempId: Date.now() + Math.random() };
      setCart(prev => [...prev, newItem]);
      setView('cart');
    } catch (e) {
      console.error('Scan error:', e);
      showNotification('Scan Error', 'error');
    }
  };

  const handleRemoveItem = (tempId) => setCart(prev => prev.filter(item => item.tempId !== tempId));

  const handleSubmitAll = async () => {
    if (!user) {
      // Try to create anonymous session if user is missing
      await createAnonymousSession(1);
      if (!user) {
        return showNotification('Unable to connect. Please refresh the page and try again.', 'error', 6000);
      }
    }
    if (cart.length === 0) return showNotification('List is empty', 'error');
    if (!memberId.trim()) return showNotification(role === 'customer' ? 'Please enter Phone Number' : 'Please enter Member ID', 'error');
    if (role === 'customer') {
      if (!memberName.trim()) return showNotification('Please enter Name', 'error');
      if (!/^\d{10}$/.test(memberId)) return showNotification('Phone number must be exactly 10 digits', 'error');
    }
    setLoading(true);
    try {
      const scansData = cart.map(item => ({ 
        memberName: memberName || (role === 'customer' ? `CUS-${memberId}` : memberId.toUpperCase()), 
        memberId: role === 'customer' ? `CUS-${memberId}` : memberId.toUpperCase(), 
        phone: role === 'customer' ? memberId : '',
        role, 
        productName: item.name, 
        productNo: item.id, 
        batchNo: item.batch, 
        bagNo: item.bag, 
        qty: item.qty,
        price: item.price || 0,
        location: location || '' 
      }));
      const response = await scansAPI.createBatch(scansData);
      
      // Refresh dashboard immediately after submission
      await refreshScanHistory();
      
      // Reload members to keep Members tab in sync
      if (adminAuth) {
        await reloadMembers();
      }
      
      if (response.data.duplicates && response.data.duplicates.length > 0) {
        showNotification(`${response.data.count} items submitted. ${response.data.duplicates.length} duplicates skipped.`, 'warning');
      } else {
        showNotification(`Successfully submitted ${cart.length} items!`, 'success');
      }
      
      setCart([]); setMemberId(''); setMemberName(''); setLocation(''); setView('welcome');
    } catch (error) { 
      console.error('Error:', error); 
      if (error.response?.data?.duplicates) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification(error.response?.data?.message || 'Transfer failed', 'error');
      }
    }
    finally { setLoading(false); }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) return showNotification('Please enter email and password', 'error');
    setLoading(true);
    try {
      const response = await authAPI.adminLogin({ email: adminEmail, password: adminPassword });
      const { token, id, username, role, email } = response.data.data;
      const userData = { id, username, role, email };
      localStorage.setItem('token', token);
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('adminEmail', email || adminEmail);
      setUser(userData);
      setAdminAuth(true);
      showNotification('Admin login successful!', 'success');
    } catch (error) {
      console.error('Admin login error:', error);
      showNotification(error.response?.data?.message || 'Invalid admin credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminEmail');
    setAdminAuth(false);
    setUser(null);
    setAdminEmail('');
    setAdminPassword('');
    setView('welcome');
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    if (!userLoginEmail || !userLoginPassword) return showNotification('Please enter email and password', 'error');
    setLoading(true);
    try {
      const response = await authAPI.login({ email: userLoginEmail, password: userLoginPassword });
      const { token, id, username, email, role } = response.data.data;
      const userData = { id, username, email, role, anonymous: false };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setShowUserLogin(false);
      setView('welcome');
      showNotification(`Welcome back, ${username}!`, 'success');
      setUserLoginEmail('');
      setUserLoginPassword('');
    } catch (error) {
      console.error('Login error:', error);
      showNotification(error.response?.data?.message || 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    if (!adminAuth) return;
    try {
      console.log('🔄 Loading admin data...');
      const [statsRes, scansRes, usersRes, productsRes, membersRes, loyaltyConfigRes] = await Promise.all([
        scansAPI.getStats(),
        scansAPI.getLive(),
        authAPI.getUsers(),
        productsAPI.getAll(),
        membersAPI.getAll().catch(() => ({ data: { data: [] } })),
        loyaltyAPI.getConfig().catch(() => ({ data: { data: null } }))
      ]);
      console.log('📦 Products response:', productsRes.data);
      setStats(statsRes.data.data);
      setScanHistory(scansRes.data.data);
      setUsers(usersRes.data.data);
      setProducts(productsRes.data.data);
      setMembers(membersRes.data.data || []);
      setLoyaltyConfig(loyaltyConfigRes.data.data);
      console.log('✅ Products loaded:', productsRes.data.data.length, 'products');
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
    }
  };

  // Function to reload only members data (for keeping members tab in sync)
  const reloadMembers = async () => {
    if (!adminAuth) return;
    try {
      const membersRes = await membersAPI.getAll();
      setMembers(membersRes.data.data || []);
      console.log('✅ Members reloaded:', membersRes.data.data.length, 'members');
    } catch (error) {
      console.error('❌ Error reloading members:', error);
    }
  };

  useEffect(() => {
    if (adminAuth) {
      // Load admin data when adminAuth is true (including on page refresh)
      loadAdminData();
      
      if (view === 'admin') {
        const interval = setInterval(() => {
          scansAPI.getLive().then(res => setScanHistory(res.data.data)).catch(console.error);
        }, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [adminAuth, view]);

  // Load leaderboard when leaderboard view is accessed
  useEffect(() => {
    if (view === 'leaderboard') {
      const loadLeaderboard = async () => {
        try {
          const response = await analyticsAPI.getLeaderboard();
          setLeaderboard(response.data.data || []);
        } catch (error) {
          console.error('Error loading leaderboard:', error);
          setLeaderboard([]);
        }
      };
      loadLeaderboard();
    }
  }, [view]);

  // Load member data for profile view
  useEffect(() => {
    if (view === 'profile' && memberId) {
      const loadMemberProfile = async () => {
        try {
          // Try to find member by memberId
          const membersRes = await membersAPI.getAll();
          const member = membersRes.data.data?.find(m => m.memberId === memberId.toUpperCase());
          if (member) {
            // Load member's scan history
            const scansRes = await scansAPI.getAll({ memberId: memberId.toUpperCase() });
            setScanHistory(scansRes.data.data || []);
          }
        } catch (error) {
          console.error('Error loading member profile:', error);
        }
      };
      loadMemberProfile();
    }
  }, [view, memberId]);

  // Process pending scan after role selection
  useEffect(() => {
    const processPendingScan = async () => {
      if (pendingScan && role && (view === 'scanner' || view === 'cart')) {
        console.log('Processing pending scan:', pendingScan);
        try {
          // Find product by exact product code AND pack size match from admin products
          console.log('Processing pending scan with productCode:', pendingScan.productCode, 'and packSize:', pendingScan.packSize);
          console.log('Available products:', products.map(p => ({ name: p.name, code: p.productNo, packSize: p.category })));
          
          // First try to find exact match: same product code AND pack size
          let product = products.find(p => 
            (pendingScan.productCode && p.productNo.toUpperCase() === pendingScan.productCode.toUpperCase()) &&
            (pendingScan.packSize && p.category && p.category.toUpperCase() === pendingScan.packSize.toUpperCase())
          );
          
          // If no exact match, fall back to just product code match
          if (!product) {
            product = products.find(p => 
              (pendingScan.productCode && p.productNo.toUpperCase() === pendingScan.productCode.toUpperCase())
            );
            console.log('No exact pack size match, using fallback product:', product);
          } else {
            console.log('Found exact match:', product);
          }
          
          const itemPrice = product ? product.price : 0;
          
          if (product) {
            const newItem = {
              id: product.productNo,
              name: product.name,
              batch: pendingScan.fullBatch || pendingScan.batchNo,
              bag: pendingScan.bagNo || '001',
              qty: pendingScan.packSize || '1kg',
              price: itemPrice,
              tempId: Date.now()
            };
            
            // Check for duplicates
            const isDuplicate = cart.some(item => 
              item.id === newItem.id && 
              item.batch === newItem.batch && 
              item.bag === newItem.bag
            );
            
            if (!isDuplicate) {
              setCart(prev => [...prev, newItem]);
              setSnackbar({ open: true, msg: `Added ${product.name} (Bag #${newItem.bag}) to cart!`, type: 'success' });
              setView('cart');
            } else {
              setSnackbar({ open: true, msg: 'This item is already in your cart', type: 'warning' });
              setView('cart');
            }
          } else {
            setSnackbar({ open: true, msg: `Product not found for code: ${pendingScan.productCode || 'Unknown'}`, type: 'error' });
          }
        } catch (error) {
          console.error('Error processing pending scan:', error);
        } finally {
          setPendingScan(null);
        }
      }
    };
    
    processPendingScan();
  }, [pendingScan, role, view, products, cart]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await authAPI.updateProfile(profileData);
      setUser({ ...user, ...profileData });
      setEditingProfile(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showNotification('Passwords do not match', 'error');
    }
    setLoading(true);
    try {
      await authAPI.changePassword({ 
        currentPassword: passwordData.currentPassword, 
        newPassword: passwordData.newPassword 
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showNotification('Password changed successfully!', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await authAPI.updateUser(userId, { isActive: !currentStatus });
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
      showNotification('User status updated!', 'success');
    } catch (error) {
      showNotification('Failed to update user', 'error');
    }
  };

  const handleSaveProduct = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!productDialog.product?.name || !productDialog.product?.productNo) {
        showNotification('Product Name and Product Code are required', 'error');
        setLoading(false);
        return;
      }

      if (productDialog.product._id) {
        await productsAPI.update(productDialog.product._id, productDialog.product);
        setProducts(products.map(p => p._id === productDialog.product._id ? productDialog.product : p));
        showNotification('Product updated!', 'success');
      } else {
        const res = await productsAPI.create(productDialog.product);
        setProducts([...products, res.data.data]);
        showNotification('Product created!', 'success');
      }
      setProductDialog({ open: false, product: null });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!hasPermission('canManageProducts')) {
      showNotification('You do not have permission to delete products', 'error');
      return;
    }
    if (!window.confirm('Delete this product?')) return;
    try {
      await productsAPI.delete(productId);
      setProducts(products.filter(p => p._id !== productId));
      showNotification('Product deleted!', 'success');
      addToActivityLog('Product Deleted', `Deleted product ID: ${productId}`, 'warning');
    } catch (error) {
      showNotification('Failed to delete product', 'error');
    }
  };

  const handleDeleteScan = async () => {
    if (!hasPermission('canDelete')) {
      showNotification('You do not have permission to delete scans', 'error');
      setDeleteDialog({ open: false, scanId: null, scanDetails: null });
      return;
    }
    setLoading(true);
    try {
      console.log('Deleting scan ID:', deleteDialog.scanId);
      await scansAPI.delete(deleteDialog.scanId);
      setScanHistory(scanHistory.filter(s => s._id !== deleteDialog.scanId));
      showNotification('Scan deleted successfully!', 'success');
      addToActivityLog('Scan Deleted', `Deleted scan ID: ${deleteDialog.scanId}`, 'warning');
      setDeleteDialog({ open: false, scanId: null, scanDetails: null });
      // Reload members to keep Members tab in sync
      await reloadMembers();
    } catch (error) {
      console.error('Delete scan error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Failed to delete scan';
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!isMainAdmin()) {
      showNotification('Only the main admin can delete co-admins', 'error');
      setUserDeleteDialog({ open: false, userId: null, userDetails: null });
      return;
    }
    setLoading(true);
    try {
      await authAPI.deleteUser(userDeleteDialog.userId);
      setUsers(users.filter(u => u._id !== userDeleteDialog.userId));
      showNotification('User deleted successfully!', 'success');
      addToActivityLog('User Deleted', `Deleted user: ${userDeleteDialog.userDetails?.username || 'Unknown'}`, 'warning');
      setUserDeleteDialog({ open: false, userId: null, userDetails: null });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!isMainAdmin()) {
      showNotification('Only the main admin can manage co-admins', 'error');
      setUserDialog({ open: false, user: null });
      return;
    }
    
    setLoading(true);
    try {
      const { _id, username, email, password, role, permissions } = userDialog.user;
      
      if (!username || !email) {
        showNotification('Please fill all required fields', 'error');
        setLoading(false);
        return;
      }

      if (!_id && (!password || password.length < 6)) {
        showNotification('Password must be at least 6 characters', 'error');
        setLoading(false);
        return;
      }

      const userData = {
        username,
        email,
        role: role || 'admin',
        permissions: {
          canDelete: permissions?.canDelete === true,
          canExport: permissions?.canExport === true,
          canManageUsers: permissions?.canManageUsers === true,
          canManageProducts: permissions?.canManageProducts === true
        }
      };

      if (!_id) {
        userData.password = password;
      }

      if (_id) {
        // Update existing user
        const res = await authAPI.updateUser(_id, userData);
        setUsers(users.map(u => u._id === _id ? { ...u, ...res.data.data } : u));
        
        // If password reset is provided, reset it
        if (userDialog.user.newPassword && userDialog.user.newPassword.trim().length >= 6) {
          try {
            await authAPI.resetUserPassword(_id, userDialog.user.newPassword);
            showNotification('User and password updated successfully!', 'success');
            addToActivityLog('Password Reset', `Reset password for ${username}`, 'warning');
          } catch (error) {
            showNotification('User updated but password reset failed: ' + (error.response?.data?.message || 'Unknown error'), 'warning');
          }
        } else {
          showNotification('User updated successfully!', 'success');
        }
        
        addToActivityLog('User Updated', `Updated permissions for ${username}`, 'info');
      } else {
        // Create new user
        const res = await authAPI.createUser(userData);
        setUsers([{ ...res.data.data, permissions: userData.permissions }, ...users]);
        showNotification('User created successfully!', 'success');
        addToActivityLog('User Created', `Created new co-admin: ${username}`, 'success');
      }
      
      setUserDialog({ open: false, user: null });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to save user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoints = async () => {
    if (!pointsDialog.user || !pointsDialog.points) {
      showNotification('Please enter points', 'error');
      return;
    }

    const pointsValue = parseInt(pointsDialog.points);
    if (isNaN(pointsValue) || pointsValue < 0) {
      showNotification('Points must be a non-negative number', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await membersAPI.updatePoints(
        pointsDialog.user._id, 
        pointsValue, 
        pointsDialog.operation
      );
      
      // Update the member in the members list
      setMembers(members.map(m => 
        m._id === pointsDialog.user._id 
          ? { ...m, points: response.data.data.points, tier: response.data.data.tier }
          : m
      ));
      
      showNotification(
        `Points ${pointsDialog.operation === 'set' ? 'set' : pointsDialog.operation === 'add' ? 'added' : 'subtracted'} successfully!`,
        'success'
      );
      addToActivityLog(
        'Points Updated',
        `${pointsDialog.operation === 'set' ? 'Set' : pointsDialog.operation === 'add' ? 'Added' : 'Subtracted'} ${pointsValue} points for ${pointsDialog.user.memberName || pointsDialog.user.memberId}`,
        'info'
      );
      
      setPointsDialog({ open: false, user: null, points: '', operation: 'set' });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to update points', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLoyaltyConfig = async () => {
    if (!loyaltyConfig) return;
    
    setLoading(true);
    try {
      const response = await loyaltyAPI.updateConfig({
        tierThresholds: loyaltyConfig.tierThresholds
      });
      
      setLoyaltyConfig(response.data.data);
      showNotification('Tier thresholds updated successfully!', 'success');
      addToActivityLog('Loyalty Config Updated', 'Updated tier thresholds', 'info');
      setLoyaltyConfigDialog({ open: false });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to update configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProductPoints = async () => {
    if (!productPointsDialog.product) return;
    
    setLoading(true);
    try {
      // Convert empty string to null for pointsPerProduct
      const pointsPerProduct = productPointsDialog.product.pointsPerProduct === '' || productPointsDialog.product.pointsPerProduct === null
        ? null
        : parseInt(productPointsDialog.product.pointsPerProduct) || null;
      
      const response = await loyaltyAPI.updateProductPoints(productPointsDialog.product._id, {
        pointsPerProduct: pointsPerProduct,
        pointsPerPackSize: productPointsDialog.product.pointsPerPackSize || []
      });
      
      setProducts(products.map(p => 
        p._id === productPointsDialog.product._id 
          ? { ...p, pointsPerProduct: response.data.data.pointsPerProduct, pointsPerPackSize: response.data.data.pointsPerPackSize }
          : p
      ));
      
      showNotification('Product points configuration updated successfully!', 'success');
      addToActivityLog('Product Points Updated', `Updated points for ${productPointsDialog.product.name}`, 'info');
      setProductPointsDialog({ open: false, product: null });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to update product points', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMembers = async () => {
    if (!window.confirm('This will sync all members from existing scans. This may take a few moments. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await membersAPI.syncFromScans();
      
      // Reload members after sync
      const membersRes = await membersAPI.getAll();
      setMembers(membersRes.data.data || []);
      
      showNotification(
        `Successfully synced ${response.data.data.totalMembers} members from ${response.data.data.totalScans} scans!`,
        'success',
        6000
      );
      addToActivityLog(
        'Members Synced',
        `Synced ${response.data.data.created} new members and updated ${response.data.data.updated} existing members`,
        'success'
      );
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to sync members', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export data with filters
  const handleExportData = async (format = 'csv') => {
    if (!hasPermission('canExport')) {
      showNotification('You do not have permission to export data', 'error');
      return;
    }
    try {
      setLoading(true);
      
      // Apply filters to data before export
      let dataToExport = scanHistory.filter(scan => {
        const matchesSearch = !scanSearchQuery || 
          scan.memberId?.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
          scan.memberName?.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
          scan.product?.name?.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
          scan.batchNo?.toLowerCase().includes(scanSearchQuery.toLowerCase());
        
        const matchesDateRange = (!scanDateFilter.start || new Date(scan.createdAt) >= new Date(scanDateFilter.start)) &&
                                 (!scanDateFilter.end || new Date(scan.createdAt) <= new Date(scanDateFilter.end));
        
        return matchesSearch && matchesDateRange;
      });

      if (dataToExport.length === 0) {
        showNotification('No data to export with current filters', 'warning', 3000);
        return;
      }

      // Create CSV or Excel data
      if (format === 'csv') {
        const headers = ['Date', 'Member ID', 'Member Name', 'Product', 'Batch No', 'Pack Size', 'Location', 'Points'];
        const rows = dataToExport.map(scan => [
          new Date(scan.createdAt).toLocaleDateString(),
          scan.memberId,
          scan.memberName,
          scan.product?.name || 'N/A',
          scan.batchNo,
          scan.packSize || 'N/A',
          scan.location || 'N/A',
          scan.points || 0
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `megakem-scans-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showNotification(`Exported ${dataToExport.length} records to CSV`, 'success', 3000);
      } else {
        // For JSON export
        const jsonContent = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `megakem-scans-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        showNotification(`Exported ${dataToExport.length} records to JSON`, 'success', 3000);
      }
    } catch (error) {
      showNotification(getUserFriendlyError(error), 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  // Backup all data
  // Open backup password dialog
  const handleBackupData = () => {
    setBackupPasswordDialog({ open: true, password: '' });
  };

  // Confirm backup with password
  const handleConfirmBackup = async () => {
    if (!backupPasswordDialog.password) {
      showNotification('Please enter your password', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Verify password
      const response = await authAPI.adminLogin({ 
        email: adminEmail, 
        password: backupPasswordDialog.password 
      });

      if (!response.data.success) {
        showNotification('Invalid password', 'error');
        setLoading(false);
        return;
      }

      // Create backup
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          scans: scanHistory,
          products: products,
          users: users.map(u => ({ ...u, password: undefined })) // Exclude passwords
        }
      };
      
      const jsonContent = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `megakem-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      showNotification('Backup created successfully!', 'success', 3000);
      addToActivityLog('Backup Created', 'System backup generated', 'success');
      setBackupPasswordDialog({ open: false, password: '' });
    } catch (error) {
      showNotification('Failed to create backup. Invalid password.', 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  // Restore data from backup - open password dialog
  const handleRestoreData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        
        // Handle both old format (array of scans) and new format (structured backup)
        let backupData;
        if (Array.isArray(parsedData)) {
          // Old format - just scans array
          backupData = {
            version: '1.0',
            timestamp: file.lastModified ? new Date(file.lastModified).toISOString() : new Date().toISOString(),
            data: {
              scans: parsedData,
              products: [],
              rewards: [],
              users: []
            }
          };
        } else if (parsedData.version && parsedData.data) {
          // New format - structured backup
          backupData = parsedData;
        } else {
          showNotification('Invalid backup file format', 'error', 5000);
          return;
        }

        // Open password dialog with backup data
        setRestorePasswordDialog({ 
          open: true, 
          password: '', 
          file: file,
          backupData: backupData 
        });
      } catch (error) {
        showNotification('Failed to read backup file', 'error', 5000);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  // Confirm restore with password
  const handleConfirmRestore = async () => {
    if (!restorePasswordDialog.password) {
      showNotification('Please enter your password', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Verify password
      const response = await authAPI.adminLogin({ 
        email: adminEmail, 
        password: restorePasswordDialog.password 
      });

      if (!response.data.success) {
        showNotification('Invalid password', 'error');
        setLoading(false);
        return;
      }

      const backupData = restorePasswordDialog.backupData;

      // Confirm restore
      if (!window.confirm(`This will restore data from ${new Date(backupData.timestamp).toLocaleString()}. This will replace all current data. Continue?`)) {
        setLoading(false);
        setRestorePasswordDialog({ open: false, password: '', file: null, backupData: null });
        return;
      }

      // Restore scans to backend
      let restoredItems = 0;
      if (backupData.data.scans && Array.isArray(backupData.data.scans) && backupData.data.scans.length > 0) {
        try {
          // Send scans to backend using batch create
          const scansToRestore = backupData.data.scans.map(scan => ({
            memberName: scan.memberName,
            memberId: scan.memberId,
            phone: scan.phone || '',
            role: scan.role,
            productName: scan.productName,
            productNo: scan.productNo,
            batchNo: scan.batchNo,
            bagNo: scan.bagNo,
            qty: scan.qty,
            price: scan.price,
            location: scan.location,
            timestamp: scan.timestamp
          }));
          
          await scansAPI.createBatch(scansToRestore);
          restoredItems = scansToRestore.length;
          
          // Reload scans from backend to get updated data
          const scansRes = await scansAPI.getLive();
          setScanHistory(scansRes.data.data);
          
          // Reload members to keep Members tab in sync
          await reloadMembers();
        } catch (error) {
          console.error('Error restoring scans:', error);
          showNotification('Failed to restore scans to database', 'error', 5000);
          setLoading(false);
          return;
        }
      }
      
      // Update frontend state for products (if backend endpoints exist)
      if (backupData.data.products && Array.isArray(backupData.data.products)) {
        setProducts(backupData.data.products);
      }
        
      showNotification(`Backup restored successfully! (${restoredItems} scans from ${new Date(backupData.timestamp).toLocaleString()})`, 'success', 3000);
      addToActivityLog('Backup Restored', `Data restored from ${new Date(backupData.timestamp).toLocaleDateString()}`, 'warning');
      setRestorePasswordDialog({ open: false, password: '', file: null, backupData: null });
    } catch (error) {
      showNotification('Failed to restore backup. Invalid password.', 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  // Activity Log Functions
  const addToActivityLog = (action, details, severity = 'info') => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details,
      severity, // 'info', 'warning', 'error', 'success'
      user: adminEmail || 'admin@megakem.com'
    };
    setActivityLog(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100 entries
  };

  // Notification Preferences
  const handleNotificationPrefChange = (pref, value) => {
    setNotificationPrefs(prev => ({ ...prev, [pref]: value }));
    localStorage.setItem('notificationPrefs', JSON.stringify({ ...notificationPrefs, [pref]: value }));
    showNotification('Notification preferences updated', 'success', 2000);
    addToActivityLog('Settings Changed', `Updated notification preference: ${pref}`, 'info');
  };

  // Check if current user is the main admin
  const isMainAdmin = () => {
    return adminEmail === 'admin@megakem.com';
  };

  // User Permissions Check
  const hasPermission = (permission) => {
    // Main admin has all permissions
    if (isMainAdmin()) {
      return true;
    }
    
    // Check user role - admins have all permissions
    if (user && user.role === 'admin' && user.email === 'admin@megakem.com') {
      return true;
    }
    
    // Find current logged-in user from users array
    const currentUser = users.find(u => u.email === adminEmail || u.email === user?.email);
    
    // If user found, check their specific permission (must be explicitly true)
    if (currentUser && currentUser.permissions) {
      return currentUser.permissions[permission] === true;
    }
    
    // Default to false if no permission found
    return false;
  };

  if (initializing) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)' }}>
      <Box sx={{ animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%, 100%': { transform: 'scale(1)', opacity: 1 }, '50%': { transform: 'scale(1.05)', opacity: 0.8 } } }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#A4D233' }} />
      </Box>
      <Typography variant='body1' sx={{ mt: 3, color: 'white', fontWeight: 600, letterSpacing: '1px' }}>Securely connecting...</Typography>
    </Box>
  );

  return (
    <ThemeProvider theme={getTheme()}><CssBaseline /><Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f7 100%)', display: 'flex', flexDirection: 'column' }}>
      <AppBar position='static' elevation={0} sx={{ background: 'linear-gradient(135deg, #003366 0%, #004d7a 50%, #4A90A4 100%)', boxShadow: '0 4px 20px rgba(0,51,102,0.3)' }}><Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' }, px: { xs: 1, sm: 2 } }}>
        <img src={megakemBrandLogo} alt='Megakem Logo' style={{ height: '40px', width: 'auto', marginRight: '12px' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant='h6' component='div' sx={{ fontWeight: 700, letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.2)', lineHeight: 1.2, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>MEGAKEM LOYALTY</Typography>
          <Typography variant='caption' sx={{ color: 'white', fontWeight: 500, letterSpacing: '0.5px', fontSize: { xs: '0.55rem', sm: '0.65rem' }, opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>WHERE TRUST MEETS EXCELLENCE</Typography>
        </Box>
        {adminAuth && view === 'admin' && (
          <Button color='inherit' onClick={handleAdminLogout} sx={{ mr: 1, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>Logout</Button>
        )}
        <Button 
          color='inherit' 
          onClick={() => {
            // If trying to access admin without authentication, require login first
            if (view !== 'admin' && !adminAuth) {
              setView('admin'); // This will show the login form
            } else if (view === 'admin') {
              setView('welcome'); // Return to app
            } else {
              setView('admin'); // Already authenticated, go to admin panel
            }
          }} 
          sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}
        >
          {view === 'admin' ? 'App' : 'Admin'}
        </Button>
      </Toolbar></AppBar>
      <Container maxWidth={view === 'admin' && adminAuth ? 'lg' : 'sm'} sx={{ flexGrow: 1, py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column' }}>
        {view === 'welcome' && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', animation: 'fadeIn 0.6s ease-in', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 5 } }}>
            <Box sx={{ mb: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'center', animation: 'logoFloat 3s ease-in-out infinite', '@keyframes logoFloat': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-15px)' } } }}>
              <img src={megakemLogo} alt='Megakem Logo' style={{ width: '100%', maxWidth: '240px', height: 'auto', filter: 'drop-shadow(0 15px 35px rgba(0,51,102,0.25))' }} />
            </Box>
            <Typography variant='h3' fontWeight='800' gutterBottom sx={{ background: 'linear-gradient(135deg, #003366 0%, #00B4D8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 2, letterSpacing: '-0.5px', fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>MEGAKEM LOYALTY</Typography>
            <Typography variant='h6' sx={{ color: 'text.secondary', fontWeight: 500, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Select your role to begin scanning</Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12}><Card sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)', border: '2px solid', borderColor: 'primary.main', overflow: 'hidden', position: 'relative', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', '@media (hover: hover)': { '&:hover': { transform: 'translateY(-8px) scale(1.02)', boxShadow: '0 20px 40px rgba(0,51,102,0.25)' } }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #003366 0%, #00B4D8 50%, #A4D233 100%)' } }}>
              <CardActionArea onClick={() => { setRole('applicator'); setView('cart'); }} sx={{ p: { xs: 2, sm: 3.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: { xs: '15px', sm: '20px' }, background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)', mr: { xs: 2, sm: 3 }, boxShadow: '0 8px 20px rgba(0,51,102,0.35)', transition: 'all 0.3s', '@media (hover: hover)': { '&:hover': { transform: 'rotate(5deg) scale(1.1)' } } }}><Inventory2 sx={{ color: 'white', fontSize: { xs: '1.75rem', sm: '2.5rem' } }} /></Box>
                  <Box sx={{ flexGrow: 1 }}><Typography variant='h5' fontWeight='800' sx={{ color: 'primary.main', mb: 0.5, letterSpacing: '-0.3px', fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>Waterproofing Technician Club</Typography><Typography variant='body1' sx={{ color: 'text.secondary', fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.9rem' } }}>Loyalty Plan/Programme</Typography></Box>
                  <ArrowForward sx={{ color: 'secondary.main', fontSize: { xs: '1.75rem', sm: '2.5rem' }, animation: 'slideRight 1.5s ease-in-out infinite', '@keyframes slideRight': { '0%, 100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(8px)' } } }} />
                </Box>
              </CardActionArea>
            </Card></Grid>
            <Grid item xs={12}><Card sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fff4 100%)', border: '2px solid', borderColor: 'secondary.main', overflow: 'hidden', position: 'relative', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', '@media (hover: hover)': { '&:hover': { transform: 'translateY(-8px) scale(1.02)', boxShadow: '0 20px 40px rgba(164,210,51,0.25)' } }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #A4D233 0%, #00B4D8 50%, #003366 100%)' } }}>
              <CardActionArea onClick={() => { setRole('customer'); setView('cart'); }} sx={{ p: { xs: 2, sm: 3.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: { xs: '15px', sm: '20px' }, background: 'linear-gradient(135deg, #A4D233 0%, #7fa326 100%)', mr: { xs: 2, sm: 3 }, boxShadow: '0 8px 20px rgba(164,210,51,0.35)', transition: 'all 0.3s', '@media (hover: hover)': { '&:hover': { transform: 'rotate(-5deg) scale(1.1)' } } }}><Person sx={{ color: 'white', fontSize: { xs: '1.75rem', sm: '2.5rem' } }} /></Box>
                  <Box sx={{ flexGrow: 1 }}><Typography variant='h5' fontWeight='800' sx={{ color: 'secondary.dark', mb: 0.5, letterSpacing: '-0.3px', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>Customer</Typography><Typography variant='body1' sx={{ color: 'text.secondary', fontWeight: 500, fontSize: { xs: '0.85rem', sm: '1rem' } }}>End User / Buyer</Typography></Box>
                  <ArrowForward sx={{ color: 'info.main', fontSize: { xs: '1.75rem', sm: '2.5rem' }, animation: 'slideRight 1.5s ease-in-out infinite', '@keyframes slideRight': { '0%, 100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(8px)' } } }} />
                </Box>
              </CardActionArea>
            </Card></Grid>
          </Grid>
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button 
              variant='outlined' 
              size='large' 
              startIcon={<HistoryIcon />}
              onClick={() => setView('history')}
              sx={{ 
                borderRadius: '12px', 
                px: 4, 
                py: 1.5,
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              Search Purchase History
            </Button>
          </Box>
          {memberId && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }}><Chip label="Member Account" color="primary" /></Divider>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card sx={{ cursor: 'pointer', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }} onClick={() => setView('leaderboard')}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight={600}>Leaderboard</Typography>
                      <Typography variant="caption" color="text.secondary">Top contributors</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>}

        {view === 'history' && <Box sx={{ py: { xs: 2, sm: 3 }, animation: 'fadeIn 0.5s ease-in', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
            <IconButton 
              onClick={() => setView('welcome')} 
              sx={{ 
                bgcolor: 'primary.lighter',
                '&:hover': { bgcolor: 'primary.light', transform: 'translateX(-4px)' },
                transition: 'all 0.3s'
              }}
            >
              <ArrowForward sx={{ transform: 'rotate(180deg)', color: 'primary.main' }} />
            </IconButton>
            <Box>
              <Typography variant='h4' fontWeight={800} sx={{ background: 'linear-gradient(135deg, #003366 0%, #00B4D8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Purchase History</Typography>
              <Typography variant='body2' color='text.secondary'>Search and track your purchase history</Typography>
            </Box>
          </Box>
          <Card sx={{ mb: 3, overflow: 'hidden', boxShadow: '0 8px 32px -8px rgba(0,51,102,0.2)', bgcolor: 'background.paper' }}>
            <Box sx={{ background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)', p: 2, color: 'white' }}>
              <Typography variant='h6' fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon /> Search Your History
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <TextField 
                fullWidth 
                label='Member ID (for Applicators)' 
                placeholder='e.g., APP-001' 
                value={searchMemberId} 
                onChange={(e) => {
                  setSearchMemberId(e.target.value.toUpperCase());
                  setSearchPhone('');
                }}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <Inventory2 sx={{ mr: 1, color: 'primary.main' }} />
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                <Divider sx={{ flex: 1 }} />
                <Typography variant='body2' color='text.secondary' sx={{ px: 2, fontWeight: 600 }}>OR</Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>
              <TextField 
                fullWidth 
                label='Phone Number (for Customers)' 
                placeholder='e.g., 0712345678' 
              value={searchPhone} 
              onChange={(e) => {
                setSearchPhone(e.target.value);
                setSearchMemberId('');
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <Person sx={{ mr: 1, color: 'secondary.main' }} />
              }}
            />
            <Button 
              fullWidth 
              variant='contained' 
              size='large'
              startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <TrendingUp />}
              disabled={loading || (!searchMemberId.trim() && !searchPhone.trim())}
              onClick={async () => {
                setLoading(true);
                try {
                  const searchValue = searchPhone.trim() || searchMemberId.trim();
                  const isPhone = searchPhone.trim().length > 0;
                  const searchParam = isPhone 
                    ? { phone: searchPhone.trim() } 
                    : { memberId: searchMemberId.toUpperCase().trim() };
                  console.log('Searching with:', searchParam);
                  const response = await scansAPI.getAll(searchParam);
                  console.log('Full API response:', response);
                  console.log('Response data:', response.data);
                  
                  // Handle nested data structure from backend
                  const results = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                  console.log('Parsed results:', results);
                  
                  setMemberHistory(results);
                  if (results.length === 0) {
                    setSnackbar({ open: true, msg: `No records found for ${isPhone ? 'phone number' : 'member ID'}: ${searchValue}`, type: 'info' });
                  } else {
                    setSnackbar({ open: true, msg: `Found ${results.length} record${results.length > 1 ? 's' : ''}`, type: 'success' });
                  }
                } catch (error) {
                  console.error('Search error:', error);
                  setSnackbar({ open: true, msg: 'Failed to fetch history. Error: ' + (error.message || 'Unknown error'), type: 'error' });
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? 'Searching...' : 'Search History'}
            </Button>
            </Box>
          </Card>
          {memberHistory.length > 0 && (() => {
            const totalPoints = memberHistory.reduce((total, scan) => {
              const basePoints = Math.floor((scan.price || 0) / 1000);
              const bonusPoints = scan.role === 'applicator' ? Math.floor(basePoints * 0.1) : 0;
              return total + basePoints + bonusPoints;
            }, 0);
            
            // Calculate tier and progress
            const tierThresholds = [
              { name: 'Bronze', min: 0, max: 500, color: '#CD7F32' },
              { name: 'Silver', min: 500, max: 1500, color: '#C0C0C0' },
              { name: 'Gold', min: 1500, max: 3000, color: '#FFD700' },
              { name: 'Platinum', min: 3000, max: Infinity, color: '#E5E4E2' }
            ];
            
            const currentTier = tierThresholds.find(tier => totalPoints >= tier.min && totalPoints < tier.max) || tierThresholds[tierThresholds.length - 1];
            const nextTier = tierThresholds[tierThresholds.indexOf(currentTier) + 1];
            const tierProgress = nextTier ? ((totalPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;
            
            // Group purchases by month for chart
            const monthlyData = {};
            memberHistory.forEach(scan => {
              const month = new Date(scan.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              if (!monthlyData[month]) monthlyData[month] = 0;
              const scanPoints = Math.floor((scan.price || 0) / 1000) + (scan.role === 'applicator' ? Math.floor(Math.floor((scan.price || 0) / 1000) * 0.1) : 0);
              monthlyData[month] += scanPoints;
            });
            const months = Object.keys(monthlyData).slice(-6);
            const maxPoints = Math.max(...Object.values(monthlyData));
            
            return (
            <Box>
              {/* Enhanced Total Points Card */}
              <Card sx={{ mb: 3, overflow: 'hidden', boxShadow: 3 }}>
                <Box sx={{ p: 3, background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)', color: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant='h5' fontWeight={700}>
                      🎉 Monthly Purchase Summary
                    </Typography>
                    <Chip 
                      label={memberHistory.filter(s => s.role === 'applicator').length > 0 ? 'Applicator' : 'Customer'} 
                      sx={{ 
                        bgcolor: 'secondary.main', 
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        px: 2
                      }} 
                    />
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={6} sm={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                        <EmojiEvents sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant='h3' fontWeight={700}>{memberHistory.length}</Typography>
                        <Typography variant='caption' sx={{ opacity: 0.9 }}>Total Scans</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                        <EmojiEvents sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant='h3' fontWeight={700}>
                          {memberHistory.reduce((sum, s) => sum + (s.points || 0), 0).toLocaleString()}
                        </Typography>
                        <Typography variant='caption' sx={{ opacity: 0.9 }}>Total Loyalty Points</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                </Box>
                
                {/* Purchase Pattern Chart */}
                <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                  <Typography variant='h6' fontWeight={600} gutterBottom color='text.primary'>
                    📊 Purchase Pattern (Last 6 Months)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 120, mt: 2 }}>
                    {months.map((month, idx) => {
                      const height = (monthlyData[month] / maxPoints) * 100;
                      return (
                        <Box key={idx} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Tooltip title={`${monthlyData[month]} purchases`}>
                            <Box 
                              sx={{ 
                                width: '100%', 
                                height: `${height}%`, 
                                minHeight: monthlyData[month] > 0 ? '20px' : '5px',
                                bgcolor: 'primary.main',
                                borderRadius: '4px 4px 0 0',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                  transform: 'translateY(-4px)'
                                }
                              }}
                            />
                          </Tooltip>
                          <Typography variant='caption' sx={{ mt: 1, fontSize: '0.65rem' }}>
                            {month.split(' ')[0]}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Card>
              {memberHistory.map((scan, idx) => {
                const loyaltyPoints = scan.points || 0;
                return (
                <Card key={scan._id || idx} sx={{ mb: 2, position: 'relative', overflow: 'visible' }}>
                  {/* Loyalty Points Badge */}
                  <Box sx={{ position: 'absolute', top: -12, right: 16, zIndex: 1 }}>
                    <Chip 
                      icon={<EmojiEvents sx={{ fontSize: '1.1rem !important' }} />}
                      label={`${loyaltyPoints} Points`} 
                      color='success' 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        height: 32,
                        boxShadow: 2
                      }}
                    />
                  </Box>
                  <CardContent sx={{ pt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant='h6' fontWeight='bold'>{scan.productName}</Typography>
                      <Chip label={scan.role} size='small' color={scan.role === 'applicator' ? 'primary' : 'secondary'} />
                    </Box>
                    <Typography variant='body2' color='text.secondary'>Member: {scan.memberName || scan.memberId}</Typography>
                    {scan.phone && <Typography variant='body2' color='text.secondary'>Phone: {scan.phone}</Typography>}
                    <Typography variant='body2' color='text.secondary'>PRODUCT: {scan.productNo}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      <Chip label={`Batch: ${scan.batchNo}`} size='small' variant='outlined' />
                      <Chip label={`Bag: ${scan.bagNo}`} size='small' variant='outlined' />
                    </Box>
                    {(() => {
                      const batchInfo = parseBatchInfo(scan.batchNo);
                      if (batchInfo?.parsed) {
                        return (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontWeight: 600 }}>Batch Details:</Typography>
                            <Typography variant='caption' color='text.secondary'>Product Code: {batchInfo.productCode}</Typography>
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>Material Batch: {batchInfo.materialBatch}</Typography>
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>Date: {batchInfo.date}</Typography>
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>Pack Size: {batchInfo.packSize} | Pack No: {batchInfo.packNo}</Typography>
                          </Box>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Loyalty Points Information */}
                    {loyaltyPoints > 0 && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.lighter', borderRadius: 1, border: '1px solid', borderColor: 'success.light' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant='body2' fontWeight={700} color='success.main' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmojiEvents sx={{ fontSize: '1.2rem' }} /> Loyalty Points Earned:
                          </Typography>
                          <Chip 
                            label={`${loyaltyPoints} Points`} 
                            color='success' 
                            size='small'
                            sx={{ fontWeight: 700 }}
                          />
                        </Box>
                      </Box>
                    )}
                    
                    {scan.location && <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>📍 {scan.location}</Typography>}
                    <Typography variant='caption' color='text.disabled' sx={{ display: 'block', mt: 1 }}>
                      {new Date(scan.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
                );
              })}
            </Box>
            );
          })()}
        </Box>}

        {view === 'profile' && (() => {
          const currentMember = members.find(m => m.memberId === memberId?.toUpperCase());
          const memberScans = scanHistory.filter(s => s.memberId === currentMember?.memberId) || [];
          const totalScans = memberScans.length;
          const totalAmount = memberScans.reduce((sum, s) => sum + (s.price || 0), 0);
          const totalPoints = memberScans.reduce((sum, s) => sum + (s.points || 0), 0);
          
          return (
            <Box sx={{ 
              minHeight: '100vh',
              bgcolor: '#f5f7fa',
              py: 3,
              px: 2
            }}>
              {/* Header */}
              <Box sx={{ 
                maxWidth: '1400px',
                mx: 'auto',
                mb: 3
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  mb: 3
                }}>
                  <IconButton 
                    onClick={() => setView(adminAuth ? 'admin' : 'welcome')} 
                    sx={{ 
                      bgcolor: 'white',
                      boxShadow: 2,
                      '&:hover': { bgcolor: 'primary.main', color: 'white' }
                    }}
                  >
                    <ArrowForward sx={{ transform: 'rotate(180deg)' }} />
                  </IconButton>
                  <Typography variant="h4" fontWeight={700} color="text.primary">
                    Member Profile
                  </Typography>
                </Box>
              </Box>

              {currentMember ? (
                <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
                  {/* Top Section - Profile Card with Stats */}
                  <Card sx={{ 
                    mb: 3,
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}>
                    <Box sx={{ 
                      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4a90a4 100%)',
                      p: 4
                    }}>
                      <Grid container spacing={4} alignItems="center">
                        {/* Profile Info */}
                        <Grid item xs={12} md={3}>
                          <Box sx={{ textAlign: 'center', color: 'white' }}>
                            <Avatar sx={{ 
                              width: 120, 
                              height: 120, 
                              mx: 'auto', 
                              mb: 2, 
                              bgcolor: 'secondary.main',
                              fontSize: '3rem',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                              border: '4px solid rgba(255,255,255,0.2)'
                            }}>
                              {currentMember.memberName?.[0]?.toUpperCase() || currentMember.memberId?.[0] || 'M'}
                            </Avatar>
                            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                              {currentMember.memberName || currentMember.memberId}
                            </Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                              {currentMember.memberId}
                            </Typography>
                            {currentMember.phone && (
                              <Typography variant="body1" sx={{ opacity: 0.85, mb: 2 }}>
                                📞 {currentMember.phone}
                              </Typography>
                            )}
                            <Chip 
                              label={currentMember.role === 'applicator' ? 'Applicator' : 'Customer'}
                              sx={{ 
                                bgcolor: 'secondary.main',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                px: 3,
                                py: 3,
                                boxShadow: 2
                              }}
                            />
                            {currentMember.location && (
                              <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>
                                  Location
                                </Typography>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                  📍 {currentMember.location}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Grid>

                        {/* Stats Cards */}
                        <Grid item xs={12} md={9}>
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ 
                                bgcolor: 'rgba(255,255,255,0.95)',
                                borderRadius: 3,
                                p: 3,
                                textAlign: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                height: '100%'
                              }}>
                                <Box sx={{ 
                                  width: 60,
                                  height: 60,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.lighter',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mx: 'auto',
                                  mb: 2
                                }}>
                                  <Typography variant="h4">📊</Typography>
                                </Box>
                                <Typography variant="h2" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
                                  {totalScans}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight={600}>
                                  Total Scans
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ 
                                bgcolor: 'rgba(255,255,255,0.95)',
                                borderRadius: 3,
                                p: 3,
                                textAlign: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                height: '100%'
                              }}>
                                <Box sx={{ 
                                  width: 60,
                                  height: 60,
                                  borderRadius: '50%',
                                  bgcolor: 'success.lighter',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mx: 'auto',
                                  mb: 2
                                }}>
                                  <Typography variant="h4">💰</Typography>
                                </Box>
                                <Typography variant="h4" fontWeight={700} color="success.main" sx={{ mb: 1 }}>
                                  Rs. {totalAmount.toLocaleString()}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight={600}>
                                  Total Amount
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ 
                                bgcolor: 'rgba(255,255,255,0.95)',
                                borderRadius: 3,
                                p: 3,
                                textAlign: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                height: '100%'
                              }}>
                                <Box sx={{ 
                                  width: 60,
                                  height: 60,
                                  borderRadius: '50%',
                                  bgcolor: 'warning.lighter',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mx: 'auto',
                                  mb: 2
                                }}>
                                  <EmojiEvents sx={{ fontSize: '2rem', color: 'warning.main' }} />
                                </Box>
                                <Typography variant="h2" fontWeight={700} color="warning.main" sx={{ mb: 1 }}>
                                  {totalPoints.toLocaleString()}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight={600}>
                                  Loyalty Points
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>

                  {/* Scan History Section */}
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <HistoryIcon sx={{ fontSize: '2rem' }} />
                        <Box>
                          <Typography variant="h5" fontWeight={700}>Scan History</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Complete purchase records and loyalty points earned
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ p: 3 }}>
                      {memberScans.length > 0 ? (
                        <Box sx={{ maxHeight: 700, overflow: 'auto' }}>
                          {memberScans.map((scan, index) => (
                              <Card key={scan._id} sx={{ 
                                mb: 3, 
                                position: 'relative', 
                                overflow: 'visible',
                                boxShadow: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  boxShadow: 6,
                                  transform: 'translateY(-4px)'
                                }
                              }}>
                                <Box sx={{ position: 'absolute', top: -16, right: 20, zIndex: 1 }}>
                                  <Chip 
                                    icon={<EmojiEvents sx={{ fontSize: '1.2rem !important' }} />}
                                    label={`${scan.points || 0} Points`} 
                                    color='success' 
                                    sx={{ 
                                      fontWeight: 700, 
                                      fontSize: '1rem', 
                                      height: 40, 
                                      boxShadow: 4,
                                      px: 1.5
                                    }}
                                  />
                                </Box>
                                <CardContent sx={{ p: 3, pt: 4 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                                    <Typography variant="h6" fontWeight={700} color="text.primary">
                                      {scan.productName || scan.product?.name}
                                    </Typography>
                                    <Chip 
                                      label={scan.role} 
                                      size="medium" 
                                      color={scan.role === 'applicator' ? 'primary' : 'secondary'} 
                                      sx={{ fontWeight: 700, px: 1.5 }} 
                                    />
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                                    <Chip 
                                      label={`Batch: ${scan.batchNo}`} 
                                      size="medium" 
                                      variant="outlined" 
                                      sx={{ fontWeight: 600 }}
                                    />
                                    <Chip 
                                      label={`Bag: ${scan.bagNo}`} 
                                      size="medium" 
                                      variant="outlined" 
                                      sx={{ fontWeight: 600 }}
                                    />
                                    {scan.qty && (
                                      <Chip 
                                        label={`Pack: ${scan.qty}`} 
                                        size="medium" 
                                        variant="outlined"
                                        color="primary"
                                        sx={{ fontWeight: 600 }}
                                      />
                                    )}
                                  </Box>
                                  {(() => {
                                    const batchInfo = parseBatchInfo(scan.batchNo);
                                    if (batchInfo?.parsed) {
                                      return (
                                        <Box sx={{ 
                                          mb: 2.5, 
                                          p: 2, 
                                          bgcolor: 'info.lighter', 
                                          borderRadius: 2,
                                          borderLeft: '4px solid',
                                          borderColor: 'info.main'
                                        }}>
                                          <Typography variant="body2" color="info.main" fontWeight={700} display="block" sx={{ mb: 1 }}>
                                            📋 Batch Details
                                          </Typography>
                                          <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                              <Typography variant="caption" color="text.secondary" display="block">Product Code</Typography>
                                              <Typography variant="body2" fontWeight={600}>{batchInfo.productCode}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                              <Typography variant="caption" color="text.secondary" display="block">Material Batch</Typography>
                                              <Typography variant="body2" fontWeight={600}>{batchInfo.materialBatch}</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                              <Typography variant="caption" color="text.secondary" display="block">Date</Typography>
                                              <Typography variant="body2" fontWeight={600}>{batchInfo.date}</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                              <Typography variant="caption" color="text.secondary" display="block">Pack Size</Typography>
                                              <Typography variant="body2" fontWeight={600}>{batchInfo.packSize}</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                              <Typography variant="caption" color="text.secondary" display="block">Pack No</Typography>
                                              <Typography variant="body2" fontWeight={600}>{batchInfo.packNo}</Typography>
                                            </Grid>
                                          </Grid>
                                        </Box>
                                      );
                                    }
                                    return null;
                                  })()}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    mt: 2.5, 
                                    p: 2.5, 
                                    background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)', 
                                    borderRadius: 2,
                                    boxShadow: 1
                                  }}>
                                    <Box>
                                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                                        💰 Price
                                      </Typography>
                                      <Typography variant="h5" fontWeight={700} color="primary.main">
                                        Rs. {(scan.price || 0).toLocaleString()}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ 
                                      textAlign: 'right',
                                      bgcolor: 'success.lighter',
                                      p: 1.5,
                                      borderRadius: 1.5,
                                      minWidth: 120
                                    }}>
                                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                                        Points Earned
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <EmojiEvents sx={{ fontSize: '1.5rem', color: 'success.main' }} />
                                        <Typography variant="h5" fontWeight={700} color="success.main">
                                          {scan.points || 0}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    mt: 2.5,
                                    pt: 2,
                                    borderTop: '1px solid',
                                    borderColor: 'divider'
                                  }}>
                                    {scan.location && (
                                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box component="span" sx={{ fontSize: '1.2rem' }}>📍</Box>
                                        {scan.location}
                                      </Typography>
                                    )}
                                    <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ ml: 'auto' }}>
                                      🕒 {new Date(scan.timestamp || scan.scannedAt || scan.createdAt).toLocaleString()}
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 6 }}>
                            <HistoryIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">No scan history available</Typography>
                            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                              Scans will appear here once products are scanned
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Card>
                  </Box>
                ) : (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <Person sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">Member not found</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Please enter your member ID and scan products to create your profile.
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          );
        })()}
        {view === 'leaderboard' && (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <IconButton onClick={() => setView('welcome')} sx={{ mr: 2 }}>
                <ArrowForward sx={{ transform: 'rotate(180deg)' }} />
              </IconButton>
              <Typography variant="h4" fontWeight={700}>Leaderboard</Typography>
            </Box>
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <EmojiEvents sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h5" fontWeight={700} color="white">Top Contributors</Typography>
                <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>Most active members!</Typography>
              </CardContent>
            </Card>
            {(() => {
              // Use members data sorted by total scans for leaderboard
              const sortedMembers = [...members].sort((a, b) => (b.totalScans || 0) - (a.totalScans || 0));
              return sortedMembers.length > 0 ? (
                <Grid container spacing={2}>
                  {sortedMembers.slice(0, 10).map((member, index) => (
                    <Grid item xs={12} key={member._id}>
                      <Card sx={{ 
                        border: index < 3 ? '2px solid' : member.memberId === memberId?.toUpperCase() ? '2px solid' : 'none',
                        borderColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : member.memberId === memberId?.toUpperCase() ? 'primary.main' : 'transparent',
                        background: index < 3 ? `linear-gradient(135deg, ${index === 0 ? '#FFF9E6' : index === 1 ? '#F5F5F5' : '#FFF0E6'} 0%, white 100%)` : 
                                   member.memberId === memberId?.toUpperCase() ? 'primary.lighter' : 'white'
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ 
                                width: 50, 
                                height: 50, 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                background: index === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 
                                           index === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #999999 100%)' : 
                                           index === 2 ? 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)' : 
                                           'linear-gradient(135deg, #003366 0%, #4A90A4 100%)',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1.5rem'
                              }}>
                                {index < 3 ? <EmojiEvents /> : index + 1}
                              </Box>
                              <Box>
                                <Typography variant="h6" fontWeight={700}>{member.memberName || member.memberId}</Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Chip 
                                    label={member.role === 'applicator' ? 'Applicator' : 'Customer'} 
                                    size="small" 
                                    color={member.role === 'applicator' ? 'warning' : 'info'}
                                  />
                                  {member.memberId === memberId?.toUpperCase() && (
                                    <Chip label="You" size="small" color="primary" />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                  <EmojiEvents sx={{ fontSize: '1rem', color: 'success.main' }} />
                                  <Typography variant="h6" fontWeight={700} color="success.main">{member.points || 0}</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">Loyalty Points</Typography>
                                <Divider sx={{ my: 0.5 }} />
                                <Typography variant="h6" fontWeight={600} color="primary">{member.totalScans || 0}</Typography>
                                <Typography variant="caption" color="text.secondary">Total Scans</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <EmojiEvents sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No leaderboard data available</Typography>
                    <Typography variant="body2" color="text.secondary">Be the first to climb the ranks!</Typography>
                  </CardContent>
                </Card>
              );
            })()}
          </Box>
        )}
        {view === 'scanner' && <Paper sx={{ flexGrow: 1, bgcolor: '#000', color: 'white', overflow: 'hidden', position: 'relative', borderRadius: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <Box sx={{ position: 'absolute', top: { xs: 60, sm: 80 }, left: 0, right: 0, zIndex: 5, px: 2 }}>
            <Paper elevation={3} sx={{ bgcolor: 'rgba(255,255,255,0.95)', p: { xs: 1.5, sm: 2 }, borderRadius: 2, backdropFilter: 'blur(10px)' }}>
              <Typography variant='subtitle2' fontWeight='bold' color='primary' gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                {role === 'applicator' ? 'Waterproofing Technician - Instructions:' : 'Customer - Instructions:'}
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                📱 Scan QR code on product bags OR use manual entry below
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                ✅ Multiple scans allowed - Add all your products
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                🎯 {role === 'applicator' ? 'Earn points with each scan!' : 'Track your purchases'}
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000', minHeight: { xs: '300px', sm: '400px' } }}>
            <div id='reader' style={{ width: '100%', height: '100%' }}></div>
            <Box sx={{ position: 'absolute', zIndex: 0, opacity: 0.3, textAlign: 'center' }}><Typography variant='caption' sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Loading Camera...</Typography></Box>
            <IconButton onClick={() => setView('welcome')} sx={{ position: 'absolute', top: { xs: 8, sm: 16 }, left: { xs: 8, sm: 16 }, zIndex: 10, bgcolor: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.3s', '&:hover': { bgcolor: 'white', transform: 'scale(1.1)' }, width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}><ArrowForward sx={{ transform: 'rotate(180deg)', color: 'primary.main', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} /></IconButton>
            {cart.length > 0 && <Fab variant='extended' size={window.innerWidth < 600 ? 'small' : 'medium'} onClick={() => setView('cart')} sx={{ position: 'absolute', top: { xs: 8, sm: 16 }, right: { xs: 8, sm: 16 }, zIndex: 10, background: 'linear-gradient(135deg, #A4D233 0%, #7fa326 100%)', color: 'white', fontWeight: 700, boxShadow: '0 6px 20px rgba(164,210,51,0.4)', animation: 'bounce 2s ease-in-out infinite', '@keyframes bounce': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } }, '&:hover': { background: 'linear-gradient(135deg, #7fa326 0%, #A4D233 100%)' }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1.5, sm: 2 } }}>View Cart ({cart.length})</Fab>}
          </Box>
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, bgcolor: 'rgba(255,255,255,0.98)', p: 2, borderTop: '2px solid', borderColor: 'primary.main' }}>
            <Typography variant='subtitle2' fontWeight='bold' color='primary' gutterBottom>Manual Entry (Temporary Simulator)</Typography>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <TextField fullWidth size='small' placeholder='Paste QR Code Data' onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleScan(e.target.value);
                    e.target.value = '';
                  }
                }} sx={{ bgcolor: 'white' }} />
              </Grid>
            </Grid>
          </Box>

        </Paper>}
        {view === 'cart' && <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'slideIn 0.4s ease-out', '@keyframes slideIn': { from: { opacity: 0, transform: 'translateX(100px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
          <Box sx={{ mb: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <IconButton onClick={() => setView('scanner')} sx={{ background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)', color: 'white', boxShadow: '0 4px 12px rgba(0,51,102,0.3)', transition: 'all 0.3s', '&:hover': { transform: 'scale(1.1) rotate(-10deg)', boxShadow: '0 6px 16px rgba(0,51,102,0.4)' }, width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}><ArrowForward sx={{ transform: 'rotate(180deg)', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} /></IconButton>
            <Box><Typography variant='h4' fontWeight='800' sx={{ background: 'linear-gradient(135deg, #003366 0%, #00B4D8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>Scanned Items</Typography><Typography variant='body1' color='text.secondary' fontWeight={500} sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>{cart.length} items ready for submission</Typography></Box>
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: { xs: 2, sm: 3 } }}>
            {cart.map((item, idx) => <Card key={item.tempId} sx={{ mb: { xs: 1.5, sm: 2 }, position: 'relative', background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)', border: '2px solid', borderColor: 'grey.100', animation: `slideInItem 0.4s ease-out ${idx * 0.1}s backwards`, '@keyframes slideInItem': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } }, transition: 'all 0.3s', '@media (hover: hover)': { '&:hover': { borderColor: 'primary.main', transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,51,102,0.15)' } } }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <IconButton size='small' onClick={() => handleRemoveItem(item.tempId)} sx={{ position: 'absolute', top: { xs: 8, sm: 12 }, right: { xs: 8, sm: 12 }, color: 'error.main', bgcolor: 'error.50', transition: 'all 0.3s', '&:hover': { bgcolor: 'error.main', color: 'white', transform: 'rotate(90deg) scale(1.1)' }, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}><Delete fontSize='small' sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} /></IconButton>
                <Typography variant='h6' fontWeight='800' sx={{ pr: { xs: 4, sm: 5 }, color: 'primary.main', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>{item.name}</Typography>
                <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, my: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                  <Chip label={item.id} size='medium' sx={{ bgcolor: 'info.main', color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem' }, height: { xs: 24, sm: 32 } }} />
                  {item.qty && <Chip label={item.qty} size='medium' sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' }, height: { xs: 24, sm: 32 } }} />}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: { xs: 1, sm: 2 }, pt: { xs: 1, sm: 2 }, borderTop: '2px solid', borderColor: 'grey.100', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant='body2' color='text.secondary' fontWeight={600} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Batch: {item.batch}</Typography>
                  <Typography variant='body2' color='text.secondary' fontWeight={600} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Bag: {item.bag}</Typography>
                </Box>
              </CardContent>
            </Card>)}
            <Button variant='outlined' fullWidth startIcon={<Add />} onClick={() => setView('scanner')} sx={{ borderStyle: 'dashed', borderWidth: 3, borderColor: 'primary.main', py: 3, fontSize: '1rem', fontWeight: 700, color: 'primary.main', transition: 'all 0.3s', '&:hover': { borderWidth: 3, bgcolor: 'primary.50', transform: 'scale(1.02)' } }}>Scan Another Item</Button>
          </Box>
          <Paper elevation={6} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 3, sm: 4 }, background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)', border: '2px solid', borderColor: 'primary.light', boxShadow: '0 12px 40px rgba(0,51,102,0.2)' }}>
            {role === 'customer' && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}>
                <Typography variant='caption' fontWeight='bold' color='info.dark' sx={{ display: 'block', mb: 1, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  📋 Customer Information
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                  ⚠️ Disclaimer: By providing your information, you consent to Megakem storing your contact details and purchase history for loyalty program purposes. Your data will be handled according to our privacy policy.
                </Typography>
              </Box>
            )}
            <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
              {role === 'customer' && <Grid item xs={12}><TextField fullWidth label='Customer Name' variant='outlined' value={memberName} onChange={(e) => setMemberName(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', fontWeight: 600, '&:hover fieldset': { borderColor: 'primary.main', borderWidth: 2 }, '&.Mui-focused fieldset': { borderWidth: 2 } } }} /></Grid>}
              <Grid item xs={12}><TextField fullWidth label={role === 'customer' ? 'Phone Number' : 'Member ID'} placeholder={role === 'customer' ? 'e.g. 0712345678' : 'e.g. APP-001'} variant='outlined' value={memberId} onChange={(e) => { const value = e.target.value; if (role === 'customer') { if (/^\d*$/.test(value) && value.length <= 10) setMemberId(value); } else { setMemberId(value); } }} inputProps={role === 'customer' ? { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 } : {}} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', fontWeight: 600, '&:hover fieldset': { borderColor: 'primary.main', borderWidth: 2 }, '&.Mui-focused fieldset': { borderWidth: 2 } } }} /></Grid>
              <Grid item xs={12}><TextField fullWidth label='Location (Optional)' placeholder='e.g. Colombo, Kandy' variant='outlined' value={location} onChange={(e) => setLocation(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', fontWeight: 600, '&:hover fieldset': { borderColor: 'primary.main', borderWidth: 2 }, '&.Mui-focused fieldset': { borderWidth: 2 } } }} /></Grid>
              <Grid item xs={12}><Button fullWidth variant='contained' size='large' disabled={loading || cart.length === 0} onClick={handleSubmitAll} startIcon={loading ? <CircularProgress size={22} color='inherit' /> : <CheckCircle />} sx={{ py: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.95rem', sm: '1.1rem' }, fontWeight: 800, background: loading ? undefined : 'linear-gradient(135deg, #A4D233 0%, #7fa326 100%)', boxShadow: '0 8px 20px rgba(164,210,51,0.4)', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 28px rgba(164,210,51,0.5)' }, '&:disabled': { opacity: 0.6 } }}>{loading ? 'Submitting...' : `Submit ${cart.length} Items`}</Button></Grid>
            </Grid>
          </Paper>
        </Box>}
        {view === 'admin' && !adminAuth && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', px: 2, animation: 'fadeIn 0.5s ease-in', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
          <Card sx={{ maxWidth: 440, width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px -12px rgba(0,51,102,0.25)' }}>
            <Box sx={{ background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)', p: 4, textAlign: 'center', color: 'white' }}>
              <Box sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px 0 rgba(0,51,102,0.3)' }}>
                <AdminPanelSettings sx={{ fontSize: 48 }} />
              </Box>
              <Typography variant='h4' fontWeight='800' gutterBottom sx={{ letterSpacing: '-0.5px' }}>Admin Portal</Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>Secure access to management dashboard</Typography>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleAdminLogin}>
                <TextField 
                  fullWidth 
                  label='Email Address' 
                  type='email' 
                  variant='outlined' 
                  value={adminEmail} 
                  onChange={(e) => setAdminEmail(e.target.value)} 
                  sx={{ mb: 3 }} 
                  required 
                  autoFocus
                  placeholder='admin@megakem.com'
                />
                <TextField 
                  fullWidth 
                  label='Password' 
                  type={showPassword.adminLogin ? 'text' : 'password'}
                  variant='outlined' 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)} 
                  sx={{ mb: 4 }} 
                  required
                  placeholder='Enter your password'
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword({ ...showPassword, adminLogin: !showPassword.adminLogin })}
                          edge="end"
                          size="small"
                        >
                          {showPassword.adminLogin ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Button 
                  fullWidth 
                  variant='contained' 
                  size='large' 
                  type='submit' 
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <Security />}
                  sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700 }}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </form>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Security fontSize='small' /> Secured with enterprise-grade encryption
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button 
              variant='text' 
              startIcon={<ArrowForward sx={{ transform: 'rotate(180deg)' }} />}
              onClick={() => setView('welcome')}
              sx={{ color: 'text.secondary' }}
            >
              Back to Home
            </Button>
          </Box>
        </Box>}
        {view === 'admin' && adminAuth && <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
          <Paper sx={{ mb: 2 }}>
            <Tabs value={adminTab} onChange={(e, v) => setAdminTab(v)} variant='scrollable' scrollButtons='auto'>
              <Tab icon={<DashboardIcon />} label='Dashboard' />
              <Tab icon={<HistoryIcon />} label='Scans' />
              {isMainAdmin() && <Tab icon={<People />} label='Co-Admins' />}
              <Tab icon={<EmojiEvents />} label='Members & Loyalty' />
              <Tab icon={<CardGiftcard />} label='Cash Rewards' />
              <Tab icon={<Category />} label='Products' />
              <Tab icon={<Settings />} label='Profile' />
            </Tabs>
          </Paper>

          {adminTab === 0 && stats && <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            <Grid item xs={6} md={3}><Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}><CardContent sx={{ p: { xs: 1.5, sm: 2 } }}><Typography variant='h4' sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, fontWeight: 'bold' }}>{stats.total}</Typography><Typography variant='body2' sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, opacity: 0.9 }}>Total Scans</Typography></CardContent></Card></Grid>
            <Grid item xs={6} md={3}><Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}><CardContent sx={{ p: { xs: 1.5, sm: 2 } }}><Typography variant='h4' sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, fontWeight: 'bold' }}>{stats.applicator}</Typography><Typography variant='body2' sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, opacity: 0.9 }}>Applicators</Typography></CardContent></Card></Grid>
            <Grid item xs={6} md={3}><Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}><CardContent sx={{ p: { xs: 1.5, sm: 2 } }}><Typography variant='h4' sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, fontWeight: 'bold' }}>{stats.customer}</Typography><Typography variant='body2' sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, opacity: 0.9 }}>Customers</Typography></CardContent></Card></Grid>
            <Grid item xs={6} md={3}><Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}><CardContent sx={{ p: { xs: 1.5, sm: 2 } }}><Typography variant='h4' sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, fontWeight: 'bold' }}>{stats.last24Hours}</Typography><Typography variant='body2' sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, opacity: 0.9 }}>Last 24hrs</Typography></CardContent></Card></Grid>
            
            <Grid item xs={12} md={6}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}><TrendingUp /> Top Products by Scans</Typography><ResponsiveContainer width='100%' height={300}><BarChart data={stats.topProducts?.slice(0, 5).map(p => ({ name: p._id.length > 20 ? p._id.substring(0, 20) + '...' : p._id, scans: p.count }))} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}><CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' /><XAxis dataKey='name' angle={-45} textAnchor='end' height={100} tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }} /><Bar dataKey='scans' fill='#003366' radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card></Grid>
            
            <Grid item xs={12} md={6}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>User Distribution</Typography><ResponsiveContainer width='100%' height={300}><PieChart><Pie data={[{ name: 'Applicators', value: stats.applicator, color: '#f5576c' }, { name: 'Customers', value: stats.customer, color: '#00f2fe' }]} cx='50%' cy='50%' labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill='#8884d8' dataKey='value'>{[{ name: 'Applicators', value: stats.applicator, color: '#f5576c' }, { name: 'Customers', value: stats.customer, color: '#00f2fe' }].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card></Grid>
            
            <Grid item xs={12} md={6}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>📍 Top Locations</Typography><List dense>{scanHistory.filter(s => s.location).reduce((acc, scan) => { const existing = acc.find(l => l.location === scan.location); if (existing) { existing.count++; } else { acc.push({ location: scan.location, count: 1 }); } return acc; }, []).sort((a, b) => b.count - a.count).slice(0, 5).map((loc, i) => <ListItem key={i} sx={{ borderLeft: '3px solid', borderLeftColor: i === 0 ? 'success.main' : 'grey.400', mb: 1, bgcolor: 'grey.50', borderRadius: 1 }}><ListItemText primary={<Typography variant='body1' fontWeight={600}>{loc.location}</Typography>} secondary={<Chip label={`${loc.count} scans`} size='small' color={i === 0 ? 'success' : 'default'} />} /></ListItem>)}</List></CardContent></Card></Grid>
            
            <Grid item xs={12} md={6}><Card sx={{ background: 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)', color: 'white' }}><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>💰 Total Product Value (Estimated)</Typography><Typography variant='h3' fontWeight='bold' sx={{ my: 2 }}>Rs. {scanHistory.reduce((total, scan) => { 
              const product = products.find(p => 
                p.productNo.toUpperCase() === scan.productNo.toUpperCase() && 
                p.category && scan.qty && p.category.toUpperCase() === scan.qty.toUpperCase()
              ); 
              const price = product ? product.price : (scan.price || 0);
              return total + price; 
            }, 0).toLocaleString()}</Typography><Typography variant='body2' sx={{ opacity: 0.9 }}>Based on {scanHistory.length} scans with product pricing</Typography></CardContent></Card></Grid>
            
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>💵 Price Estimation by Product</Typography><TableContainer><Table size='small'><TableHead><TableRow><TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell><TableCell sx={{ fontWeight: 700 }}>Pack Size</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Unit Price</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Total Scans</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Est. Value</TableCell></TableRow></TableHead><TableBody>{(() => { const productStats = scanHistory.reduce((acc, scan) => { 
              // Find product by BOTH product code AND pack size
              const product = products.find(p => 
                p.productNo.toUpperCase() === scan.productNo.toUpperCase() && 
                p.category && scan.qty && p.category.toUpperCase() === scan.qty.toUpperCase()
              ); 
              
              // Use unique key: productCode + packSize
              const key = `${scan.productNo}-${scan.qty || 'N/A'}`;
              
              if (!acc[key]) { 
                acc[key] = { 
                  productNo: scan.productNo,
                  name: product ? product.name : scan.productName || 'Unknown Product',
                  packSize: scan.qty || 'N/A', 
                  price: product ? product.price : (scan.price || 0),
                  scans: 0, 
                  totalQty: 0 
                }; 
              } 
              acc[key].scans += 1; 
              
              // Total Qty = number of packs (same as scans)
              acc[key].totalQty += 1; 
              return acc; 
            }, {}); 
            
            return Object.entries(productStats).sort((a, b) => (b[1].price * b[1].totalQty) - (a[1].price * a[1].totalQty)).map(([key, data]) => <TableRow key={key} sx={{ '&:hover': { bgcolor: 'action.hover' }, bgcolor: data.price === 0 ? 'warning.50' : 'inherit' }}><TableCell><Typography variant='body2' fontWeight={600}>{data.name}</Typography><Typography variant='caption' color='text.secondary'>{data.productNo}</Typography></TableCell><TableCell><Chip label={data.packSize} size='small' variant='outlined' color={data.price === 0 ? 'warning' : 'default'} /></TableCell><TableCell align='right'>{data.price > 0 ? <Typography variant='body2' fontWeight={600}>Rs. {data.price.toLocaleString()}</Typography> : <Typography variant='body2' fontWeight={600} color='warning.main'>Not Set</Typography>}</TableCell><TableCell align='right'><Chip label={data.scans} size='small' color='primary' /></TableCell><TableCell align='right'><Typography variant='body1' fontWeight={700} color={data.price > 0 ? 'success.main' : 'warning.main'}>Rs. {(data.price * data.totalQty).toLocaleString()}</Typography></TableCell></TableRow>); })()}</TableBody></Table></TableContainer><Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant='body1' fontWeight={700} color='success.dark'>Grand Total Estimated Value:</Typography><Typography variant='h5' fontWeight={800} color='success.dark'>Rs. {scanHistory.reduce((total, scan) => { 
              const product = products.find(p => 
                p.productNo.toUpperCase() === scan.productNo.toUpperCase() && 
                p.category && scan.qty && p.category.toUpperCase() === scan.qty.toUpperCase()
              ); 
              const price = product ? product.price : (scan.price || 0);
              return total + price; 
            }, 0).toLocaleString()}</Typography></Box></CardContent></Card></Grid>
            
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}><Category /> Product Scan Details</Typography><List dense>{stats.topProducts?.map((p, i) => <ListItem key={i} sx={{ borderLeft: '4px solid', borderLeftColor: i === 0 ? 'primary.main' : i === 1 ? 'secondary.main' : 'grey.300', mb: 1, bgcolor: 'grey.50', borderRadius: 1 }}><ListItemText primary={<Typography variant='body1' fontWeight={600}>{p._id}</Typography>} secondary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}><Chip label={`${p.count} scans`} size='small' color={i === 0 ? 'primary' : i === 1 ? 'secondary' : 'default'} /><Typography variant='caption' color='text.secondary'>#{i + 1} Most Scanned</Typography></Box>} /></ListItem>)}</List></CardContent></Card></Grid>
            
            {/* Advanced Analytics Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant='h5' sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment /> Advanced Analytics
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant='contained'
                    color='success'
                    size='small'
                    startIcon={<FileDownload />}
                    onClick={handleExportAllScans}
                    disabled={scanHistory.length === 0}
                  >
                    Export All Scans
                  </Button>
                  <Button
                    variant='outlined'
                    color='primary'
                    size='small'
                    startIcon={<FileDownload />}
                    onClick={handleExportProducts}
                    disabled={products.length === 0}
                  >
                    Export Products
                  </Button>
                  {isMainAdmin() && (
                    <Button
                      variant='outlined'
                      color='secondary'
                      size='small'
                      startIcon={<FileDownload />}
                      onClick={handleExportUsers}
                      disabled={users.length === 0}
                    >
                      Export Users
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>⏰ Peak Activity Hours</Typography><List dense>{(() => {
              const hourCounts = scanHistory.reduce((acc, scan) => {
                if (scan.timestamp) {
                  const hour = new Date(scan.timestamp).getHours();
                  acc[hour] = (acc[hour] || 0) + 1;
                }
                return acc;
              }, {});
              return Object.entries(hourCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([hour, count], i) => (
                  <ListItem key={hour} sx={{ borderLeft: '3px solid', borderLeftColor: i === 0 ? 'primary.main' : 'grey.400', mb: 0.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <ListItemText 
                      primary={<Typography variant='body2' fontWeight={600}>{hour}:00 - {hour}:59</Typography>}
                      secondary={<Chip label={`${count} scans`} size='small' color={i === 0 ? 'primary' : 'default'} />}
                    />
                  </ListItem>
                ));
            })()}</List></CardContent></Card></Grid>
            
            <Grid item xs={12} md={4}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>📅 Weekly Trends</Typography><Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>Scans by Day of Week</Typography>{(() => {
              const dayCounts = scanHistory.reduce((acc, scan) => {
                if (scan.timestamp) {
                  const day = new Date(scan.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
                  acc[day] = (acc[day] || 0) + 1;
                }
                return acc;
              }, {});
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const maxCount = Math.max(...Object.values(dayCounts), 1);
              return days.map(day => (
                <Box key={day} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant='caption' fontWeight={600}>{day}</Typography>
                    <Typography variant='caption' color='primary'>{dayCounts[day] || 0}</Typography>
                  </Box>
                  <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', bgcolor: 'primary.main', width: `${((dayCounts[day] || 0) / maxCount) * 100}%`, transition: 'width 0.3s' }} />
                  </Box>
                </Box>
              ));
            })()}</CardContent></Card></Grid>
            
            <Grid item xs={12} md={4}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>🎯 Performance Metrics</Typography><Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                <Typography variant='body2' color='text.secondary'>Avg Scans/Day</Typography>
                <Typography variant='h5' fontWeight='bold' color='success.dark'>{(scanHistory.length / Math.max(1, Math.ceil((Date.now() - new Date(scanHistory[scanHistory.length - 1]?.timestamp || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)}</Typography>
              </Box>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                <Typography variant='body2' color='text.secondary'>Unique Products</Typography>
                <Typography variant='h5' fontWeight='bold' color='info.dark'>{new Set(scanHistory.map(s => s.productNo)).size}</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                <Typography variant='body2' color='text.secondary'>Unique Locations</Typography>
                <Typography variant='h5' fontWeight='bold' color='warning.dark'>{new Set(scanHistory.filter(s => s.location).map(s => s.location)).size}</Typography>
              </Box>
            </Box></CardContent></Card></Grid>
            
            <Grid item xs={12} md={6}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>📊 Member Activity Ranking</Typography><TableContainer><Table size='small'><TableHead><TableRow><TableCell sx={{ fontWeight: 700 }}>Rank</TableCell><TableCell sx={{ fontWeight: 700 }}>Member</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Total Scans</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Role</TableCell></TableRow></TableHead><TableBody>{(() => {
              const memberStats = scanHistory.reduce((acc, scan) => {
                const key = scan.memberId || 'unknown';
                if (!acc[key]) {
                  acc[key] = { memberId: scan.memberId, memberName: scan.memberName, role: scan.role, count: 0 };
                }
                acc[key].count++;
                return acc;
              }, {});
              return Object.values(memberStats)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map((member, i) => (
                  <TableRow key={member.memberId} sx={{ bgcolor: i < 3 ? 'success.50' : 'inherit' }}>
                    <TableCell><Chip label={`#${i + 1}`} size='small' color={i === 0 ? 'success' : i < 3 ? 'primary' : 'default'} /></TableCell>
                    <TableCell><Typography variant='body2' fontWeight={600}>{member.memberName}</Typography><Typography variant='caption' color='text.secondary'>{member.memberId}</Typography></TableCell>
                    <TableCell align='right'><Typography variant='body2' fontWeight={700}>{member.count}</Typography></TableCell>
                    <TableCell align='right'><Chip label={member.role} size='small' color={member.role === 'applicator' ? 'warning' : 'info'} /></TableCell>
                  </TableRow>
                ));
            })()}</TableBody></Table></TableContainer></CardContent></Card></Grid>
            
            <Grid item xs={12} md={6}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>🔥 Recent Activity Stream</Typography><List dense>{activityLog.slice(0, 8).map((log, i) => (
              <ListItem key={log.id} sx={{ borderLeft: '3px solid', borderLeftColor: log.severity === 'error' ? 'error.main' : log.severity === 'warning' ? 'warning.main' : log.severity === 'success' ? 'success.main' : 'info.main', mb: 0.5, bgcolor: 'grey.50', borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                  <Typography variant='body2' fontWeight={600}>{log.action}</Typography>
                  <Typography variant='caption' color='text.secondary'>{new Date(log.timestamp).toLocaleTimeString()}</Typography>
                </Box>
                <Typography variant='caption' color='text.secondary'>{log.details}</Typography>
                <Chip label={log.user} size='small' sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
              </ListItem>
            ))}{activityLog.length === 0 && <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 2 }}>No recent activity</Typography>}</List></CardContent></Card></Grid>
          </Grid>}

          {adminTab === 1 && <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField 
                size='small' 
                placeholder='Search by member, product, batch...' 
                value={scanSearchQuery}
                onChange={(e) => { 
                  setScanSearchQuery(e.target.value); 
                  setCurrentPage(1); 
                }}
                sx={{ flexGrow: 1, minWidth: 200 }}
                InputProps={{
                  startAdornment: <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'action.active' }}>🔍</Box>,
                  endAdornment: scanSearchQuery && loading ? <CircularProgress size={20} /> : null
                }}
                helperText={scanSearchQuery && "Search results update automatically"}
              />
              <TextField 
                type='date'
                size='small'
                label='Start Date'
                value={scanDateFilter.start}
                onChange={(e) => { setScanDateFilter({ ...scanDateFilter, start: e.target.value }); setCurrentPage(1); }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <TextField 
                type='date'
                size='small'
                label='End Date'
                value={scanDateFilter.end}
                onChange={(e) => { setScanDateFilter({ ...scanDateFilter, end: e.target.value }); setCurrentPage(1); }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              {(scanSearchQuery || scanDateFilter.start || scanDateFilter.end) && (
                <Button 
                  size='small' 
                  onClick={() => { 
                    setScanSearchQuery(''); 
                    setScanDateFilter({ start: '', end: '' }); 
                    setCurrentPage(1);
                  }}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Clear Filters
                </Button>
              )}
              <Box sx={{ flexGrow: 1 }} />
              {lastUpdateTime && (
                <Chip 
                  label={`Updated ${lastUpdateTime.toLocaleTimeString()}`}
                  size='small'
                  color='success'
                  sx={{ fontWeight: 600 }}
                />
              )}
              <Button 
                variant='outlined' 
                startIcon={<GetApp />} 
                onClick={() => handleExportData('csv')}
                disabled={loading || scanHistory.length === 0 || !hasPermission('canExport')}
                size='small'
              >
                Export CSV
              </Button>
            </Box>
            {(() => {
              // Filter scans
              let filteredScans = scanHistory.filter(item => {
                const matchesSearch = !scanSearchQuery || 
                  item.memberName?.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
                  item.memberId?.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
                  item.productName?.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
                  item.productNo?.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
                  item.batchNo?.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
                  item.location?.toLowerCase().includes(scanSearchQuery.toLowerCase());
                
                const scanDate = item.timestamp ? new Date(item.timestamp) : new Date();
                const matchesStartDate = !scanDateFilter.start || scanDate >= new Date(scanDateFilter.start);
                const matchesEndDate = !scanDateFilter.end || scanDate <= new Date(scanDateFilter.end + 'T23:59:59');
                
                return matchesSearch && matchesStartDate && matchesEndDate;
              });
              
              // Pagination
              const indexOfLastScan = currentPage * scansPerPage;
              const indexOfFirstScan = indexOfLastScan - scansPerPage;
              const currentScans = filteredScans.slice(indexOfFirstScan, indexOfLastScan);
              const totalPages = Math.ceil(filteredScans.length / scansPerPage);
              
              return (
                <>
                  {filteredScans.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 8, opacity: 0.5 }}>
                      <HistoryIcon sx={{ fontSize: 60, mb: 2 }} />
                      <Typography variant='h6' gutterBottom>
                        {scanHistory.length === 0 ? 'No scans yet.' : 'No scans match your filters.'}
                      </Typography>
                      {scanHistory.length > 0 && (
                        <Button onClick={() => { setScanSearchQuery(''); setScanDateFilter({ start: '', end: '' }); }} sx={{ mt: 2 }}>
                          Clear Filters
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant='body2' color='text.secondary'>
                          Showing {indexOfFirstScan + 1}-{Math.min(indexOfLastScan, filteredScans.length)} of {filteredScans.length} scans
                        </Typography>
                      </Box>
                      {currentScans.map((item, i) => <Card key={item._id || i} sx={{ mb: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant='subtitle1' fontWeight='bold'>{item.memberName || 'Unknown'}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip label={item.memberId} size='small' sx={{ borderRadius: 1, height: 20, fontSize: '0.7rem' }} />
                        {item.phone && <Chip label={`📱 ${item.phone}`} size='small' color='success' sx={{ borderRadius: 1, height: 20, fontSize: '0.7rem' }} />}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip label={item.role} size='small' color={item.role === 'applicator' ? 'warning' : 'info'} sx={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 'bold' }} />
                      <IconButton 
                        size='small' 
                        color='error' 
                        onClick={() => setDeleteDialog({ 
                          open: true, 
                          scanId: item._id, 
                          scanDetails: `${item.productName} (${item.batchNo} - ${item.bagNo}) by ${item.memberName}` 
                        })}
                        disabled={!hasPermission('canDelete')}
                        sx={{ ml: 1 }}
                      >
                        <Delete fontSize='small' />
                      </IconButton>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant='body2' color='text.secondary'>Product: <Box component='span' color='text.primary' fontWeight={600}>{item.productName}</Box></Typography>
                  <Typography variant='body2' color='text.secondary'>PRODUCT: {item.productNo}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip label={`Batch: ${item.batchNo}`} size='small' variant='outlined' sx={{ fontSize: '0.7rem' }} />
                    <Chip label={`Bag: ${item.bagNo}`} size='small' variant='outlined' sx={{ fontSize: '0.7rem' }} />
                    {item.qty && <Chip label={item.qty} size='small' variant='outlined' sx={{ fontSize: '0.7rem', bgcolor: 'success.light', color: 'success.dark', fontWeight: 600 }} />}
                    {item.price > 0 ? (
                      <Chip label={`Rs. ${item.price.toLocaleString()}`} size='small' variant='outlined' sx={{ fontSize: '0.7rem', bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 600 }} />
                    ) : (
                      <Chip label="⚠️ Price Not Set" size='small' variant='outlined' sx={{ fontSize: '0.7rem', bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 600 }} />
                    )}
                  </Box>
                  {item.price === 0 && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                      <Typography variant='caption' color='warning.dark' sx={{ fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        ⚠️ Product with pack size "{item.qty}" not found in Products tab. Please add it to set the correct price.
                      </Typography>
                    </Box>
                  )}
                  {(() => {
                    const batchInfo = parseBatchInfo(item.batchNo);
                    if (batchInfo?.parsed) {
                      return (
                        <Box sx={{ mt: 1, p: 0.75, bgcolor: 'action.hover', borderRadius: 0.5 }}>
                          <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.65rem' }}>
                            📦 {batchInfo.productCode} • Batch {batchInfo.materialBatch} • {batchInfo.date} • Pack {batchInfo.packSize} #{batchInfo.packNo}
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  })()}
                  {item.location && <Typography variant='body2' color='text.secondary' sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>📍 <Box component='span' fontWeight={500}>{item.location}</Box></Typography>}
                  <Typography variant='caption' sx={{ display: 'block', textAlign: 'right', mt: 1, color: 'text.disabled' }}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Pending'}</Typography>
                </CardContent>
              </Card>)}
              
              {totalPages > 1 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
                  <Button 
                    size='small' 
                    onClick={() => setCurrentPage(currentPage - 1)} 
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          size='small'
                          variant={currentPage === pageNum ? 'contained' : 'outlined'}
                          onClick={() => setCurrentPage(pageNum)}
                          sx={{ minWidth: 40 }}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </Box>
                  <Button 
                    size='small' 
                    onClick={() => setCurrentPage(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      );
    })()}
          </Box>}

          {((adminTab === 3 && isMainAdmin()) || (adminTab === 2 && !isMainAdmin())) && <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant='h6' sx={{ fontWeight: 700 }}>MEMBERS & LOYALTY</Typography>
              <Typography variant='body2' color='text.secondary'>
                {(() => {
                  // Calculate stats based on members who have scans
                  const membersWithScans = members.filter(m => scanHistory.some(s => s.memberId === m.memberId));
                  const applicatorsCount = membersWithScans.filter(m => m.role === 'applicator').length;
                  const customersCount = membersWithScans.filter(m => m.role === 'customer').length;
                  return `Total: ${membersWithScans.length} | Applicators: ${applicatorsCount} | Customers: ${customersCount}`;
                })()}
              </Typography>
            </Box>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField 
                size='small' 
                placeholder='Search by member ID, name, phone...' 
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 200 }}
                InputProps={{
                  startAdornment: <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'action.active' }}>🔍</Box>
                }}
              />
              <FormControl size='small' sx={{ minWidth: 120 }}>
                <InputLabel>Role</InputLabel>
                <Select value={memberRoleFilter} onChange={(e) => setMemberRoleFilter(e.target.value)} label='Role'>
                  <MenuItem value='all'>All Roles</MenuItem>
                  <MenuItem value='applicator'>Applicator</MenuItem>
                  <MenuItem value='customer'>Customer</MenuItem>
                </Select>
              </FormControl>
              {(memberSearchQuery || memberRoleFilter !== 'all') && (
                <Button 
                  size='small' 
                  onClick={() => { 
                    setMemberSearchQuery(''); 
                    setMemberRoleFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Member ID</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Total Scans</strong></TableCell>
                    <TableCell><strong>Total Amount (Rs.)</strong></TableCell>
                    <TableCell><strong>Total Points</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    // Filter to only show members who have scans in scanHistory
                    let filteredMembers = members.filter(m => {
                      const hasScans = scanHistory.some(s => s.memberId === m.memberId);
                      const matchesSearch = !memberSearchQuery || 
                        m.memberId?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        m.memberName?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        m.phone?.toLowerCase().includes(memberSearchQuery.toLowerCase());
                      const matchesRole = memberRoleFilter === 'all' || m.role === memberRoleFilter;
                      return hasScans && matchesSearch && matchesRole;
                    });

                    if (filteredMembers.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Typography variant='body1' color='text.secondary'>
                              {members.length === 0 
                                ? 'No members found. Members are created automatically when they scan products.'
                                : 'No members match your filters.'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return filteredMembers.map(m => {
                      // Calculate real-time stats from scanHistory
                      const memberScans = scanHistory.filter(s => s.memberId === m.memberId);
                      const actualTotalScans = memberScans.length;
                      const actualTotalAmount = memberScans.reduce((sum, s) => sum + (s.price || 0), 0);
                      // Calculate total points from all scans
                      const actualTotalPoints = memberScans.reduce((sum, s) => sum + (s.points || 0), 0);
                      
                      return (
                        <TableRow key={m._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell>
                            <Typography variant='body2' fontWeight={600}>{m.memberId}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>{m.memberName}</Typography>
                            {m.phone && <Typography variant='caption' color='text.secondary'>{m.phone}</Typography>}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={m.role === 'applicator' ? 'Applicator' : 'Customer'} 
                              size='small' 
                              color={m.role === 'applicator' ? 'warning' : 'info'}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' fontWeight={600}>{actualTotalScans}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`Rs. ${actualTotalAmount.toLocaleString()}`}
                              size='small' 
                              color='primary' 
                              sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${actualTotalPoints.toLocaleString()} pts`}
                              size='small' 
                              color='success' 
                              sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                              icon={<EmojiEvents sx={{ fontSize: '1rem !important' }} />}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              size='small' 
                              color='info' 
                              onClick={() => {
                                setMemberId(m.memberId);
                                setView('profile');
                              }} 
                              title='View Member Profile'
                            >
                              <Visibility />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>}

          {adminTab === 2 && isMainAdmin() && <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button 
                variant='contained' 
                startIcon={<Add />} 
                onClick={() => setUserDialog({ 
                  open: true, 
                  user: { 
                    username: '', 
                    email: '', 
                    password: '', 
                    role: 'admin', 
                    permissions: { 
                      canDelete: true, 
                      canExport: true, 
                      canManageUsers: true, 
                      canManageProducts: true 
                    } 
                  } 
                })}
                disabled={!isMainAdmin()}
              >
                Add Co-Admin
              </Button>
              <Typography variant='body2' color='text.secondary'>Total Co-Admins: {users.filter(u => u.role === 'admin' || u.role === 'co-admin').length}</Typography>
            </Box>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table><TableHead><TableRow>
                <TableCell><strong>Username</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Permissions</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow></TableHead>
                <TableBody>{users.filter(u => u.role === 'admin' || u.role === 'co-admin').map(u => <TableRow key={u._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Typography variant='body2' fontWeight={600}>{u.username}</Typography>
                    {u.email === 'admin@megakem.com' && <Chip label='Main Admin' size='small' color='success' sx={{ mt: 0.5, fontSize: '0.65rem' }} />}
                  </TableCell>
                  <TableCell><Typography variant='body2'>{u.email}</Typography></TableCell>
                  <TableCell><Chip label={u.email === 'admin@megakem.com' ? 'Main Admin' : (u.role === 'co-admin' ? 'Co-Admin' : 'Admin')} size='small' color={u.email === 'admin@megakem.com' ? 'success' : (u.role === 'co-admin' ? 'error' : 'warning')} /></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {u.email === 'admin@megakem.com' ? (
                        <>
                          <Chip label='Delete' size='small' color='error' sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                          <Chip label='Export' size='small' color='primary' sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                          <Chip label='Users' size='small' color='warning' sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                          <Chip label='Products' size='small' color='success' sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                        </>
                      ) : (
                        <>
                          {u.permissions?.canDelete === true && <Chip label='Delete' size='small' color='error' variant='outlined' sx={{ fontSize: '0.7rem' }} />}
                          {u.permissions?.canExport === true && <Chip label='Export' size='small' color='primary' variant='outlined' sx={{ fontSize: '0.7rem' }} />}
                          {u.permissions?.canManageUsers === true && <Chip label='Users' size='small' color='warning' variant='outlined' sx={{ fontSize: '0.7rem' }} />}
                          {u.permissions?.canManageProducts === true && <Chip label='Products' size='small' color='success' variant='outlined' sx={{ fontSize: '0.7rem' }} />}
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {u.email === 'admin@megakem.com' ? (
                      <Chip label="Always Active" size="small" color="success" sx={{ fontWeight: 600 }} />
                    ) : (
                      <Switch checked={u.isActive} onChange={() => handleToggleUserStatus(u._id, u.isActive)} />
                    )}
                  </TableCell>
                  <TableCell><Typography variant='caption' color='text.secondary'>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton 
                        size='small' 
                        color='primary' 
                        onClick={() => setUserDialog({ 
                          open: true, 
                          user: { 
                            ...u, 
                            password: '',
                            permissions: {
                              canDelete: u.permissions?.canDelete !== false,
                              canExport: u.permissions?.canExport !== false,
                              canManageUsers: u.permissions?.canManageUsers !== false,
                              canManageProducts: u.permissions?.canManageProducts !== false
                            }
                          } 
                        })} 
                        title='Edit Permissions'
                        disabled={!isMainAdmin()}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size='small' 
                        color='error' 
                        onClick={() => setUserDeleteDialog({ open: true, userId: u._id, userDetails: { username: u.username, email: u.email, role: u.role } })} 
                        title='Delete User'
                        disabled={!isMainAdmin()}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>)}</TableBody>
              </Table>
            </TableContainer>
          </Box>}

          {/* Cash Rewards Management Tab */}
          {((adminTab === 4 && isMainAdmin()) || (adminTab === 3 && !isMainAdmin())) && <Box>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant='h5' sx={{ flexGrow: 1 }}>
                <CardGiftcard sx={{ mr: 1, verticalAlign: 'middle' }} />
                Cash Rewards Management
              </Typography>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select 
                  value={selectedMonth} 
                  label="Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <MenuItem key={month} value={month}>
                      {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Year</InputLabel>
                <Select 
                  value={selectedYear} 
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant='contained' 
                startIcon={<Calculate />} 
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await cashRewardsAPI.getAllRewards({ year: selectedYear, month: selectedMonth });
                    setCashRewards(response.data.rewards || []);
                    showNotification('Cash rewards calculated successfully', 'success');
                  } catch (error) {
                    showNotification(error.response?.data?.error || 'Failed to calculate rewards', 'error');
                  }
                  setLoading(false);
                }}
              >
                Calculate Rewards
              </Button>
              <Button 
                variant='outlined' 
                startIcon={<Refresh />} 
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await cashRewardsAPI.getAllRewards({ year: selectedYear, month: selectedMonth });
                    setCashRewards(response.data.rewards || []);
                  } catch (error) {
                    showNotification('Failed to load rewards', 'error');
                  }
                  setLoading(false);
                }}
              >
                Refresh
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : cashRewards.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CardGiftcard sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant='h6' color='text.secondary'>
                  No cash rewards data for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  Click "Calculate Rewards" to generate rewards for this month
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Member ID</strong></TableCell>
                      <TableCell><strong>Member Name</strong></TableCell>
                      <TableCell><strong>Role</strong></TableCell>
                      <TableCell align='right'><strong>Purchase Value</strong></TableCell>
                      <TableCell align='right'><strong>Cash Reward</strong></TableCell>
                      <TableCell align='center'><strong>Status</strong></TableCell>
                      <TableCell align='center'><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cashRewards.map((reward) => (
                      <TableRow key={reward.memberId}>
                        <TableCell>{reward.memberId}</TableCell>
                        <TableCell>{reward.memberName}</TableCell>
                        <TableCell>
                          <Chip 
                            label={reward.role} 
                            size='small'
                            color={reward.role === 'applicator' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell align='right'>
                          Rs. {reward.totalPurchaseValue?.toLocaleString()}
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body1' color='success.main' sx={{ fontWeight: 'bold' }}>
                            Rs. {reward.cashReward?.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip 
                            label={reward.rewardPaid ? 'PAID' : reward.rewardCalculated ? 'CALCULATED' : 'PENDING'} 
                            size='small'
                            color={reward.rewardPaid ? 'success' : reward.rewardCalculated ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Tooltip title="View Breakdown">
                            <IconButton 
                              size='small'
                              onClick={() => {
                                // Calculate breakdown
                                const breakdown = [];
                                const tiers = [
                                  { name: 'First Rs. 250,000', min: 0, max: 250000, rate: 4.5 },
                                  { name: 'Next Rs. 250,000', min: 250001, max: 500000, rate: 5.0 },
                                  { name: 'Next Rs. 250,000', min: 500001, max: 750000, rate: 5.5 },
                                  { name: 'Next Rs. 250,000', min: 750001, max: 1000000, rate: 6.0 },
                                  { name: 'Above Rs. 1,000,000', min: 1000001, max: Infinity, rate: 6.5 }
                                ];
                                
                                let remainingAmount = reward.totalPurchaseValue;
                                tiers.forEach(tier => {
                                  if (remainingAmount > 0) {
                                    const tierMax = tier.max === Infinity ? remainingAmount : Math.min(tier.max, remainingAmount + tier.min);
                                    const amountInTier = Math.max(0, tierMax - tier.min);
                                    const tierReward = amountInTier * (tier.rate / 100);
                                    if (amountInTier > 0) {
                                      breakdown.push({
                                        tier: tier.name,
                                        amount: amountInTier,
                                        rate: tier.rate,
                                        reward: tierReward
                                      });
                                      remainingAmount -= amountInTier;
                                    }
                                  }
                                });
                                
                                setRewardBreakdownDialog({
                                  open: true,
                                  member: reward,
                                  breakdown: breakdown
                                });
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {!reward.rewardPaid && (
                            <Tooltip title="Mark as Paid">
                              <IconButton 
                                size='small'
                                color='success'
                                onClick={async () => {
                                  if (window.confirm(`Mark Rs. ${reward.cashReward?.toLocaleString()} as paid for ${reward.memberName}?`)) {
                                    setLoading(true);
                                    try {
                                      await cashRewardsAPI.markAsPaid(reward.memberId, {
                                        year: selectedYear,
                                        month: selectedMonth
                                      });
                                      // Refresh the list
                                      const response = await cashRewardsAPI.getAllRewards({ year: selectedYear, month: selectedMonth });
                                      setCashRewards(response.data.rewards || []);
                                      showNotification('Reward marked as paid', 'success');
                                    } catch (error) {
                                      showNotification('Failed to mark as paid', 'error');
                                    }
                                    setLoading(false);
                                  }
                                }}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Summary Card */}
            {cashRewards.length > 0 && (
              <Paper sx={{ mt: 3, p: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Monthly Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Total Members
                      </Typography>
                      <Typography variant='h5'>
                        {cashRewards.length}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Total Purchases
                      </Typography>
                      <Typography variant='h5'>
                        Rs. {cashRewards.reduce((sum, r) => sum + (r.totalPurchaseValue || 0), 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Total Rewards
                      </Typography>
                      <Typography variant='h5' color='success.main'>
                        Rs. {cashRewards.reduce((sum, r) => sum + (r.cashReward || 0), 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Paid Rewards
                      </Typography>
                      <Typography variant='h5' color='primary.main'>
                        {cashRewards.filter(r => r.rewardPaid).length} / {cashRewards.length}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>}

          {((adminTab === 5 && isMainAdmin()) || (adminTab === 4 && !isMainAdmin())) && <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>Products & Loyalty Points</Typography>
                <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1, mb: 2 }}>
                  <Typography variant='body2' color='info.dark' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEvents sx={{ fontSize: '1.2rem' }} />
                    <strong>Loyalty Points System:</strong> Each product can earn loyalty points for customers. Click the trophy icon to customize points for each product.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button 
                  variant='contained' 
                  startIcon={<Add />} 
                  onClick={() => setProductDialog({ open: true, product: { name: '', productNo: '', description: '', category: '', price: 0 } })}
                  disabled={!hasPermission('canManageProducts')}
                >
                  Add Product
                </Button>
              <TextField 
                size='small' 
                placeholder='Search products...' 
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                sx={{ flexGrow: 1 }}
                InputProps={{
                  startAdornment: <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'action.active' }}>🔍</Box>
                }}
              />
              {productSearchQuery && (
                <Button size='small' onClick={() => setProductSearchQuery('')}>Clear</Button>
              )}
            </Box>
            {console.log('🏷️ Rendering Products tab, products array:', products, 'Count:', products.length)}
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table><TableHead><TableRow><TableCell>Product Name</TableCell><TableCell>Product Code</TableCell><TableCell>Pack Size</TableCell><TableCell>Price (LKR)</TableCell><TableCell>Loyalty Points</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {(() => {
                    const filteredProducts = products.filter(p => 
                      !productSearchQuery ||
                      p.name?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                      p.productNo?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                      p.category?.toLowerCase().includes(productSearchQuery.toLowerCase())
                    );
                    
                    if (filteredProducts.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Box sx={{ py: 4 }}>
                              <Typography variant='body1' color='text.secondary'>
                                {products.length === 0 ? 'No products found. Click "Add Product" to create one.' : 'No products match your search.'}
                              </Typography>
                              {products.length > 0 && (
                                <Button onClick={() => setProductSearchQuery('')} sx={{ mt: 2 }}>Clear Search</Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    
                    return filteredProducts.map(p => {
                      // Calculate points display
                      let pointsDisplay = 'Not Set';
                      
                      if (p.pointsPerPackSize && p.pointsPerPackSize.length > 0) {
                        const pointsValues = p.pointsPerPackSize.map(ps => ps.points);
                        const minPoints = Math.min(...pointsValues);
                        const maxPoints = Math.max(...pointsValues);
                        pointsDisplay = minPoints === maxPoints ? `${minPoints} pts` : `${minPoints}-${maxPoints} pts`;
                      } else if (p.pointsPerProduct !== null && p.pointsPerProduct !== undefined) {
                        pointsDisplay = `${p.pointsPerProduct} pts (Fixed)`;
                      } else if (p.price > 0) {
                        pointsDisplay = `~${Math.floor(p.price / 1000)} pts (Auto)`;
                      }
                      
                      return (
                        <TableRow key={p._id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.productNo}</TableCell>
                          <TableCell>{p.category}</TableCell>
                          <TableCell>Rs. {p.price?.toLocaleString() || '0.00'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={pointsDisplay} 
                              size='small' 
                              color={pointsDisplay === 'Not Set' ? 'default' : 'success'}
                              icon={<EmojiEvents sx={{ fontSize: '0.9rem !important' }} />}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size='small' onClick={() => setProductDialog({ open: true, product: p })} disabled={!hasPermission('canManageProducts')} title='Edit Product'><Edit /></IconButton>
                              <IconButton size='small' color='primary' onClick={() => setProductPointsDialog({ open: true, product: p })} disabled={!hasPermission('canManageProducts')} title='Configure Points'><EmojiEvents /></IconButton>
                              <IconButton size='small' color='error' onClick={() => handleDeleteProduct(p._id)} disabled={!hasPermission('canManageProducts')} title='Delete Product'><Delete /></IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>}

          {((adminTab === 6 && isMainAdmin()) || (adminTab === 5 && !isMainAdmin())) && <Grid container spacing={3}>
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom>Profile Settings</Typography>{!editingProfile ? <Box><Typography variant='body1'><strong>Username:</strong> {user?.username}</Typography><Typography variant='body1'><strong>Email:</strong> {user?.email}</Typography><Button variant='outlined' startIcon={<Edit />} onClick={() => { setEditingProfile(true); setProfileData({ username: user?.username, email: user?.email }); }} sx={{ mt: 2 }}>Edit Profile</Button></Box> : <Box><TextField fullWidth label='Username' value={profileData.username} onChange={(e) => setProfileData({ ...profileData, username: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth label='Email' type='email' value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} sx={{ mb: 2 }} /><Box sx={{ display: 'flex', gap: 1 }}><Button variant='contained' startIcon={<Save />} onClick={handleUpdateProfile} disabled={loading}>Save</Button><Button variant='outlined' startIcon={<Cancel />} onClick={() => setEditingProfile(false)}>Cancel</Button></Box></Box>}</CardContent></Card></Grid>
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom>Change Password</Typography><TextField fullWidth type={showPassword.currentPassword ? 'text' : 'password'} label='Current Password' value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} sx={{ mb: 2 }} InputProps={{ endAdornment: ( <InputAdornment position="end"><IconButton onClick={() => setShowPassword({ ...showPassword, currentPassword: !showPassword.currentPassword })} edge="end" size="small">{showPassword.currentPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> ) }} /><TextField fullWidth type={showPassword.newPassword ? 'text' : 'password'} label='New Password' value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} sx={{ mb: 2 }} InputProps={{ endAdornment: ( <InputAdornment position="end"><IconButton onClick={() => setShowPassword({ ...showPassword, newPassword: !showPassword.newPassword })} edge="end" size="small">{showPassword.newPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> ) }} /><TextField fullWidth type={showPassword.confirmPassword ? 'text' : 'password'} label='Confirm New Password' value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} sx={{ mb: 2 }} InputProps={{ endAdornment: ( <InputAdornment position="end"><IconButton onClick={() => setShowPassword({ ...showPassword, confirmPassword: !showPassword.confirmPassword })} edge="end" size="small">{showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> ) }} /><Button variant='contained' onClick={handleChangePassword} disabled={loading}>Change Password</Button></CardContent></Card></Grid>
            
            <Grid item xs={12} md={6}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Notifications /> Notification Preferences</Typography><Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>Customize your notification settings</Typography><Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box><Typography variant='body2' fontWeight={600}>Email Notifications</Typography><Typography variant='caption' color='text.secondary'>Receive updates via email</Typography></Box>
                <Switch checked={notificationPrefs.email} onChange={(e) => handleNotificationPrefChange('email', e.target.checked)} color='primary' />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box><Typography variant='body2' fontWeight={600}>Push Notifications</Typography><Typography variant='caption' color='text.secondary'>Browser push notifications</Typography></Box>
                <Switch checked={notificationPrefs.push} onChange={(e) => handleNotificationPrefChange('push', e.target.checked)} color='primary' />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box><Typography variant='body2' fontWeight={600}>Auto Refresh</Typography><Typography variant='caption' color='text.secondary'>Automatically refresh data</Typography></Box>
                <Switch checked={notificationPrefs.autoRefresh} onChange={(e) => handleNotificationPrefChange('autoRefresh', e.target.checked)} color='primary' />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box><Typography variant='body2' fontWeight={600}>Sound Notifications</Typography><Typography variant='caption' color='text.secondary'>Play sound on new events</Typography></Box>
                <Switch checked={notificationPrefs.soundEnabled} onChange={(e) => handleNotificationPrefChange('soundEnabled', e.target.checked)} color='primary' />
              </Box>
            </Box></CardContent></Card></Grid>
            
            {isMainAdmin() && <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>💾 Data Management</Typography><Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>Backup and restore your application data</Typography><Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}><Button variant='contained' startIcon={<GetApp />} onClick={handleBackupData} disabled={loading} sx={{ minWidth: 150 }}>Create Backup</Button><Button variant='outlined' component='label' startIcon={<Refresh />} disabled={loading} sx={{ minWidth: 150 }}>Restore Backup<input type='file' accept='.json' hidden onChange={handleRestoreData} /></Button></Box><Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>Backup includes all scans, products, and user data (excluding passwords)</Typography></CardContent></Card></Grid>}
          </Grid>}

          <Dialog open={backupPasswordDialog.open} onClose={() => setBackupPasswordDialog({ open: false, password: '' })} maxWidth='xs' fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color='primary' />
              Confirm Backup Creation
            </DialogTitle>
            <DialogContent>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Please enter your password to create a backup of all system data.
              </Typography>
              <TextField 
                fullWidth 
                type={showPassword.backupPassword ? 'text' : 'password'}
                label='Password' 
                value={backupPasswordDialog.password} 
                onChange={(e) => setBackupPasswordDialog({ ...backupPasswordDialog, password: e.target.value })} 
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && backupPasswordDialog.password) {
                    handleConfirmBackup();
                  }
                }}
                autoFocus
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword({ ...showPassword, backupPassword: !showPassword.backupPassword })}
                        edge="end"
                        size="small"
                      >
                        {showPassword.backupPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBackupPasswordDialog({ open: false, password: '' })} disabled={loading}>
                Cancel
              </Button>
              <Button 
                variant='contained' 
                onClick={handleConfirmBackup} 
                disabled={loading || !backupPasswordDialog.password}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <GetApp />}
              >
                {loading ? 'Creating...' : 'Create Backup'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={restorePasswordDialog.open} onClose={() => setRestorePasswordDialog({ open: false, password: '', file: null, backupData: null })} maxWidth='xs' fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color='warning' />
              Confirm Backup Restore
            </DialogTitle>
            <DialogContent>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Please enter your password to restore system data from backup.
              </Typography>
              {restorePasswordDialog.backupData && (
                <Box sx={{ p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1, mb: 3 }}>
                  <Typography variant='caption' color='warning.dark' fontWeight={600}>
                    ⚠️ Backup Date: {new Date(restorePasswordDialog.backupData.timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' display='block'>
                    This will overwrite current data.
                  </Typography>
                </Box>
              )}
              <TextField 
                fullWidth 
                type={showPassword.restorePassword ? 'text' : 'password'}
                label='Password' 
                value={restorePasswordDialog.password} 
                onChange={(e) => setRestorePasswordDialog({ ...restorePasswordDialog, password: e.target.value })} 
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && restorePasswordDialog.password) {
                    handleConfirmRestore();
                  }
                }}
                autoFocus
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword({ ...showPassword, restorePassword: !showPassword.restorePassword })}
                        edge="end"
                        size="small"
                      >
                        {showPassword.restorePassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRestorePasswordDialog({ open: false, password: '', file: null, backupData: null })} disabled={loading}>
                Cancel
              </Button>
              <Button 
                variant='contained' 
                color='warning'
                onClick={handleConfirmRestore} 
                disabled={loading || !restorePasswordDialog.password}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <Refresh />}
              >
                {loading ? 'Restoring...' : 'Restore Backup'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={productDialog.open} onClose={() => setProductDialog({ open: false, product: null })} maxWidth='sm' fullWidth>
            <DialogTitle>{productDialog.product?._id ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogContent>
              <TextField 
                fullWidth 
                label='Product Name' 
                value={productDialog.product?.name || ''} 
                onChange={(e) => setProductDialog({ ...productDialog, product: { ...productDialog.product, name: e.target.value } })} 
                sx={{ mt: 2, mb: 2 }} 
                required
                helperText='Full product name (e.g., Megakem Liquid Sealer Plus)'
              />
              <TextField 
                fullWidth 
                label='Product Code' 
                value={productDialog.product?.productNo || ''} 
                onChange={(e) => setProductDialog({ ...productDialog, product: { ...productDialog.product, productNo: e.target.value.toUpperCase() } })} 
                sx={{ mb: 2 }} 
                required
                helperText='Short code used in batch numbers (e.g., MLSP). Will be auto-converted to uppercase.'
                placeholder='e.g., MLSP, WP100'
              />
              <TextField 
                fullWidth 
                label='Pack Size' 
                value={productDialog.product?.category || ''} 
                onChange={(e) => setProductDialog({ ...productDialog, product: { ...productDialog.product, category: e.target.value } })} 
                sx={{ mb: 2 }}
                helperText='Pack size/quantity (e.g., 540ml, 1L, 25kg)'
              />
              <TextField 
                fullWidth 
                label='Price (LKR)' 
                type='number' 
                value={productDialog.product?.price || ''} 
                onChange={(e) => setProductDialog({ ...productDialog, product: { ...productDialog.product, price: parseFloat(e.target.value) || 0 } })} 
                sx={{ mb: 2 }} 
                InputProps={{ startAdornment: 'Rs.' }} 
              />
              <TextField 
                fullWidth 
                label='Description' 
                multiline 
                rows={3} 
                value={productDialog.product?.description || ''} 
                onChange={(e) => setProductDialog({ ...productDialog, product: { ...productDialog.product, description: e.target.value } })} 
              />
            </DialogContent>
            <DialogActions><Button onClick={() => setProductDialog({ open: false, product: null })}>Cancel</Button><Button variant='contained' onClick={handleSaveProduct} disabled={loading}>Save</Button></DialogActions>
          </Dialog>

          <Dialog open={userDialog.open} onClose={() => setUserDialog({ open: false, user: null })} maxWidth='sm' fullWidth>
            <DialogTitle>{userDialog.user?._id ? 'Edit Co-Admin' : 'Create New Co-Admin'}</DialogTitle>
            <DialogContent>
              <TextField fullWidth label='Username' value={userDialog.user?.username || ''} onChange={(e) => setUserDialog({ ...userDialog, user: { ...userDialog.user, username: e.target.value } })} sx={{ mt: 2, mb: 2 }} required />
              <TextField fullWidth label='Email' type='email' value={userDialog.user?.email || ''} onChange={(e) => setUserDialog({ ...userDialog, user: { ...userDialog.user, email: e.target.value } })} sx={{ mb: 2 }} required />
              
              {/* Password field for new users */}
              {!userDialog.user?._id && <TextField fullWidth label='Password' type={showPassword.coAdminPassword ? 'text' : 'password'} value={userDialog.user?.password || ''} onChange={(e) => setUserDialog({ ...userDialog, user: { ...userDialog.user, password: e.target.value } })} sx={{ mb: 2 }} helperText='Minimum 6 characters' required InputProps={{ endAdornment: ( <InputAdornment position="end"><IconButton onClick={() => setShowPassword({ ...showPassword, coAdminPassword: !showPassword.coAdminPassword })} edge="end" size="small">{showPassword.coAdminPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> ) }} />}
              
              {/* Password reset for existing users - only main admin */}
              {userDialog.user?._id && isMainAdmin() && (
                <>
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'info.light', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='body2' color='info.dark' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <strong>Current Password:</strong> ••••••••••• (encrypted for security)
                    </Typography>
                  </Box>
                  <TextField 
                    fullWidth 
                    label='New Password (Optional)' 
                    type={showPassword.resetPassword ? 'text' : 'password'} 
                    value={userDialog.user?.newPassword || ''} 
                    onChange={(e) => setUserDialog({ ...userDialog, user: { ...userDialog.user, newPassword: e.target.value } })} 
                    sx={{ mb: 2 }} 
                    helperText='Leave blank to keep current password. Minimum 6 characters to change.' 
                    InputProps={{ 
                      endAdornment: ( 
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={() => setShowPassword({ ...showPassword, resetPassword: !showPassword.resetPassword })} 
                            edge="end" 
                            size="small"
                          >
                            {showPassword.resetPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment> 
                      ) 
                    }} 
                  />
                </>
              )}
              
              {/* Only show role selector if not main admin */}
              {userDialog.user?.email !== 'admin@megakem.com' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Role</InputLabel>
                  <Select value={userDialog.user?.role || 'admin'} label='Role' onChange={(e) => setUserDialog({ ...userDialog, user: { ...userDialog.user, role: e.target.value } })}>
                    <MenuItem value='admin'>Admin</MenuItem>
                    <MenuItem value='co-admin'>Co-Admin</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              <Typography variant='subtitle2' sx={{ mt: 2, mb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security /> Permissions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box>
                    <Typography variant='body2' fontWeight={600}>Can Delete Records</Typography>
                    <Typography variant='caption' color='text.secondary'>Permission to delete scans</Typography>
                  </Box>
                  <Switch 
                    checked={userDialog.user?.permissions?.canDelete === true} 
                    onChange={(e) => setUserDialog({ 
                      ...userDialog, 
                      user: { 
                        ...userDialog.user, 
                        permissions: { ...userDialog.user?.permissions, canDelete: e.target.checked } 
                      } 
                    })} 
                    color='error' 
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box>
                    <Typography variant='body2' fontWeight={600}>Can Export Data</Typography>
                    <Typography variant='caption' color='text.secondary'>Permission to export reports</Typography>
                  </Box>
                  <Switch 
                    checked={userDialog.user?.permissions?.canExport === true} 
                    onChange={(e) => setUserDialog({ 
                      ...userDialog, 
                      user: { 
                        ...userDialog.user, 
                        permissions: { ...userDialog.user?.permissions, canExport: e.target.checked } 
                      } 
                    })} 
                    color='primary' 
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box>
                    <Typography variant='body2' fontWeight={600}>Can Manage Users</Typography>
                    <Typography variant='caption' color='text.secondary'>Permission to add/edit users</Typography>
                  </Box>
                  <Switch 
                    checked={userDialog.user?.permissions?.canManageUsers === true} 
                    onChange={(e) => setUserDialog({ 
                      ...userDialog, 
                      user: { 
                        ...userDialog.user, 
                        permissions: { ...userDialog.user?.permissions, canManageUsers: e.target.checked } 
                      } 
                    })} 
                    color='warning' 
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box>
                    <Typography variant='body2' fontWeight={600}>Can Manage Products</Typography>
                    <Typography variant='caption' color='text.secondary'>Permission to modify products</Typography>
                  </Box>
                  <Switch 
                    checked={userDialog.user?.permissions?.canManageProducts === true} 
                    onChange={(e) => setUserDialog({ 
                      ...userDialog, 
                      user: { 
                        ...userDialog.user, 
                        permissions: { ...userDialog.user?.permissions, canManageProducts: e.target.checked } 
                      } 
                    })} 
                    color='success' 
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions><Button onClick={() => setUserDialog({ open: false, user: null })}>Cancel</Button><Button variant='contained' onClick={handleCreateUser} disabled={loading} startIcon={loading ? <CircularProgress size={20} color='inherit' /> : (userDialog.user?._id ? <Save /> : <Add />)}>{loading ? (userDialog.user?._id ? 'Saving...' : 'Creating...') : (userDialog.user?._id ? 'Save Changes' : 'Create User')}</Button></DialogActions>
          </Dialog>

          <Dialog open={pointsDialog.open} onClose={() => setPointsDialog({ open: false, user: null, points: '', operation: 'set' })} maxWidth='sm' fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEvents color='primary' />
              Update Loyalty Points
            </DialogTitle>
            <DialogContent>
              {pointsDialog.user && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    Member: <strong>{pointsDialog.user.memberName || pointsDialog.user.memberId}</strong> ({pointsDialog.user.memberId})
                    {pointsDialog.user.role && (
                      <Chip label={pointsDialog.user.role === 'applicator' ? 'Applicator' : 'Customer'} size='small' color={pointsDialog.user.role === 'applicator' ? 'warning' : 'info'} sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Chip 
                      label={`Current Points: ${pointsDialog.user.points || 0}`} 
                      color='primary' 
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip 
                      label={`Tier: ${pointsDialog.user.tier ? pointsDialog.user.tier.charAt(0).toUpperCase() + pointsDialog.user.tier.slice(1) : 'Bronze'}`} 
                      color={
                        pointsDialog.user.tier === 'platinum' ? 'success' :
                        pointsDialog.user.tier === 'gold' ? 'warning' :
                        pointsDialog.user.tier === 'silver' ? 'info' : 'default'
                      }
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              )}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Operation</InputLabel>
                <Select
                  value={pointsDialog.operation}
                  label='Operation'
                  onChange={(e) => setPointsDialog({ ...pointsDialog, operation: e.target.value })}
                >
                  <MenuItem value='set'>Set Points (Replace)</MenuItem>
                  <MenuItem value='add'>Add Points</MenuItem>
                  <MenuItem value='subtract'>Subtract Points</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label='Points'
                type='number'
                value={pointsDialog.points}
                onChange={(e) => setPointsDialog({ ...pointsDialog, points: e.target.value })}
                inputProps={{ min: 0 }}
                helperText={
                  pointsDialog.operation === 'set' 
                    ? 'This will replace the current points value'
                    : pointsDialog.operation === 'add'
                    ? 'This will add to the current points'
                    : 'This will subtract from the current points'
                }
                sx={{ mb: 2 }}
              />
              {pointsDialog.user && pointsDialog.points && !isNaN(parseInt(pointsDialog.points)) && (
                <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, mb: 2 }}>
                  <Typography variant='body2' fontWeight={600} gutterBottom>
                    Result Preview:
                  </Typography>
                  <Typography variant='body1'>
                    {pointsDialog.operation === 'set' 
                      ? `New Points: ${parseInt(pointsDialog.points)}`
                      : pointsDialog.operation === 'add'
                      ? `New Points: ${(pointsDialog.user.points || 0) + parseInt(pointsDialog.points)}`
                      : `New Points: ${Math.max(0, (pointsDialog.user.points || 0) - parseInt(pointsDialog.points))}`
                    }
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPointsDialog({ open: false, user: null, points: '', operation: 'set' })}>
                Cancel
              </Button>
              <Button 
                variant='contained' 
                onClick={handleUpdatePoints} 
                disabled={loading || !pointsDialog.points || isNaN(parseInt(pointsDialog.points))}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <Save />}
              >
                {loading ? 'Updating...' : 'Update Points'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={loyaltyConfigDialog.open} onClose={() => setLoyaltyConfigDialog({ open: false })} maxWidth='md' fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings color='primary' />
              Configure Cash Reward Tiers
            </DialogTitle>
            <DialogContent>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Set the cash reward percentage for each monthly purchase tier. Rewards are calculated cumulatively based on total monthly purchases.
              </Typography>
              {loyaltyConfig && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label='Tier 1: Rs. 0 - 250,000'
                    type='number'
                    value={loyaltyConfig.cashRewardTiers?.tier1 || 4.5}
                    onChange={(e) => setLoyaltyConfig({
                      ...loyaltyConfig,
                      cashRewardTiers: {
                        ...loyaltyConfig.cashRewardTiers,
                        tier1: parseFloat(e.target.value) || 0
                      }
                    })}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    InputProps={{
                      endAdornment: <Typography variant='body2' color='text.secondary'>%</Typography>
                    }}
                    helperText='Percentage rate for first Rs. 250,000 (default: 4.5%)'
                  />
                  <TextField
                    fullWidth
                    label='Tier 2: Rs. 250,001 - 500,000'
                    type='number'
                    value={loyaltyConfig.cashRewardTiers?.tier2 || 5.0}
                    onChange={(e) => setLoyaltyConfig({
                      ...loyaltyConfig,
                      cashRewardTiers: {
                        ...loyaltyConfig.cashRewardTiers,
                        tier2: parseFloat(e.target.value) || 0
                      }
                    })}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    InputProps={{
                      endAdornment: <Typography variant='body2' color='text.secondary'>%</Typography>
                    }}
                    helperText='Percentage rate for next Rs. 250,000 (default: 5.0%)'
                  />
                  <TextField
                    fullWidth
                    label='Tier 3: Rs. 500,001 - 750,000'
                    type='number'
                    value={loyaltyConfig.cashRewardTiers?.tier3 || 5.5}
                    onChange={(e) => setLoyaltyConfig({
                      ...loyaltyConfig,
                      cashRewardTiers: {
                        ...loyaltyConfig.cashRewardTiers,
                        tier3: parseFloat(e.target.value) || 0
                      }
                    })}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    InputProps={{
                      endAdornment: <Typography variant='body2' color='text.secondary'>%</Typography>
                    }}
                    helperText='Percentage rate for next Rs. 250,000 (default: 5.5%)'
                  />
                  <TextField
                    fullWidth
                    label='Tier 4: Rs. 750,001 - 1,000,000'
                    type='number'
                    value={loyaltyConfig.cashRewardTiers?.tier4 || 6.0}
                    onChange={(e) => setLoyaltyConfig({
                      ...loyaltyConfig,
                      cashRewardTiers: {
                        ...loyaltyConfig.cashRewardTiers,
                        tier4: parseFloat(e.target.value) || 0
                      }
                    })}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    InputProps={{
                      endAdornment: <Typography variant='body2' color='text.secondary'>%</Typography>
                    }}
                    helperText='Percentage rate for next Rs. 250,000 (default: 6.0%)'
                  />
                  <TextField
                    fullWidth
                    label='Tier 5: Above Rs. 1,000,000'
                    type='number'
                    value={loyaltyConfig.cashRewardTiers?.tier5 || 6.5}
                    onChange={(e) => setLoyaltyConfig({
                      ...loyaltyConfig,
                      cashRewardTiers: {
                        ...loyaltyConfig.cashRewardTiers,
                        tier5: parseFloat(e.target.value) || 0
                      }
                    })}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    InputProps={{
                      endAdornment: <Typography variant='body2' color='text.secondary'>%</Typography>
                    }}
                    helperText='Percentage rate for purchases above Rs. 1,000,000 (default: 6.5%)'
                  />
                  <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1, mt: 1 }}>
                    <Typography variant='body2' fontWeight={600} gutterBottom>Example Calculation:</Typography>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      For Rs. 600,000 monthly purchase:
                    </Typography>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      • First Rs. 250,000 at {loyaltyConfig.cashRewardTiers?.tier1 || 4.5}% = Rs. {(250000 * (loyaltyConfig.cashRewardTiers?.tier1 || 4.5) / 100).toLocaleString()}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      • Next Rs. 250,000 at {loyaltyConfig.cashRewardTiers?.tier2 || 5.0}% = Rs. {(250000 * (loyaltyConfig.cashRewardTiers?.tier2 || 5.0) / 100).toLocaleString()}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      • Balance Rs. 100,000 at {loyaltyConfig.cashRewardTiers?.tier3 || 5.5}% = Rs. {(100000 * (loyaltyConfig.cashRewardTiers?.tier3 || 5.5) / 100).toLocaleString()}
                    </Typography>
                    <Typography variant='caption' fontWeight={700} color='success.main' display='block' sx={{ mt: 1 }}>
                      Total Reward = Rs. {((250000 * (loyaltyConfig.cashRewardTiers?.tier1 || 4.5) / 100) + (250000 * (loyaltyConfig.cashRewardTiers?.tier2 || 5.0) / 100) + (100000 * (loyaltyConfig.cashRewardTiers?.tier3 || 5.5) / 100)).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant='caption' color='text.secondary'>
                      <strong>Note:</strong> Percentage rates should typically increase with higher tiers to incentivize larger purchases. Changes will apply to new calculations only.
                    </Typography>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLoyaltyConfigDialog({ open: false })}>
                Cancel
              </Button>
              <Button 
                variant='contained' 
                onClick={handleUpdateLoyaltyConfig} 
                disabled={loading || !loyaltyConfig}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <Save />}
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={productPointsDialog.open} onClose={() => setProductPointsDialog({ open: false, product: null })} maxWidth='md' fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEvents color='primary' />
              Configure Product Loyalty Points
            </DialogTitle>
            <DialogContent>
              {productPointsDialog.product && (
                <>
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                    <Typography variant='body1' fontWeight={600} color='primary.main'>
                      {productPointsDialog.product.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Product Code: {productPointsDialog.product.productNo}
                    </Typography>
                  </Box>
                  
                  <TextField
                    fullWidth
                    label='Fixed Points Per Product'
                    type='number'
                    value={productPointsDialog.product.pointsPerProduct || ''}
                    onChange={(e) => setProductPointsDialog({
                      ...productPointsDialog,
                      product: {
                        ...productPointsDialog.product,
                        pointsPerProduct: e.target.value ? parseInt(e.target.value) : null
                      }
                    })}
                    inputProps={{ min: 0 }}
                    helperText='Set fixed points for this product (leave empty to use price-based or pack-size specific points)'
                    sx={{ mb: 3 }}
                  />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant='body2' fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEvents sx={{ fontSize: '1.2rem' }} />
                      Pack Size Specific Points
                    </Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ mb: 2, display: 'block' }}>
                      Configure different loyalty points for different pack sizes. This overrides fixed points.
                    </Typography>
                    
                    {productPointsDialog.product.packSizePricing && productPointsDialog.product.packSizePricing.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {productPointsDialog.product.packSizePricing.map((packSize, idx) => {
                          const existingPoints = productPointsDialog.product.pointsPerPackSize?.find(p => p.packSize === packSize.packSize);
                          return (
                            <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant='body2' fontWeight={600}>{packSize.packSize}</Typography>
                                <Typography variant='caption' color='text.secondary'>Price: Rs. {packSize.price?.toLocaleString() || 0}</Typography>
                              </Box>
                              <TextField
                                label='Points'
                                type='number'
                                size='small'
                                value={existingPoints?.points || ''}
                                onChange={(e) => {
                                  const newPoints = e.target.value ? parseInt(e.target.value) : 0;
                                  const updatedPointsPerPackSize = [...(productPointsDialog.product.pointsPerPackSize || [])];
                                  const existingIndex = updatedPointsPerPackSize.findIndex(p => p.packSize === packSize.packSize);
                                  
                                  if (existingIndex >= 0) {
                                    updatedPointsPerPackSize[existingIndex] = { packSize: packSize.packSize, points: newPoints };
                                  } else {
                                    updatedPointsPerPackSize.push({ packSize: packSize.packSize, points: newPoints });
                                  }
                                  
                                  setProductPointsDialog({
                                    ...productPointsDialog,
                                    product: {
                                      ...productPointsDialog.product,
                                      pointsPerPackSize: updatedPointsPerPackSize
                                    }
                                  });
                                }}
                                inputProps={{ min: 0 }}
                                sx={{ width: 120 }}
                              />
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1, border: '1px dashed', borderColor: 'warning.main' }}>
                        <Typography variant='caption' color='warning.dark'>
                          ⚠️ No pack sizes configured for this product. Add pack size pricing first to enable pack-size specific points.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant='caption' color='info.dark' sx={{ display: 'block', fontWeight: 600, mb: 1 }}>
                      💡 How Points are Calculated:
                    </Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                      1. If pack-size specific points are set → Use pack-size points
                    </Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                      2. Else if fixed points are set → Use fixed points
                    </Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                      3. Otherwise → Calculate based on price (1 point per Rs. 1000)
                    </Typography>
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setProductPointsDialog({ open: false, product: null })}>
                Cancel
              </Button>
              <Button 
                variant='contained' 
                onClick={handleUpdateProductPoints} 
                disabled={loading || !productPointsDialog.product}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <Save />}
              >
                {loading ? 'Saving...' : 'Save Points Configuration'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, scanId: null, scanDetails: null })} maxWidth='sm' fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
              <Delete /> Confirm Delete
            </DialogTitle>
            <DialogContent>
              <Typography variant='body1' sx={{ mt: 2 }}>
                Are you sure you want to delete this scan?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'error.50', borderRadius: 2, border: '1px solid', borderColor: 'error.200' }}>
                <Typography variant='body2' fontWeight='bold' color='error.dark'>
                  {deleteDialog.scanDetails}
                </Typography>
              </Box>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
                This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDeleteDialog({ open: false, scanId: null, scanDetails: null })} disabled={loading}>
                No, Cancel
              </Button>
              <Button 
                variant='contained' 
                color='error' 
                onClick={handleDeleteScan} 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <Delete />}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={userDeleteDialog.open} onClose={() => setUserDeleteDialog({ open: false, userId: null, userDetails: null })} maxWidth='sm' fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
              <Delete />
              Delete User
            </DialogTitle>
            <DialogContent>
              <Typography variant='body1' gutterBottom>
                Are you sure you want to delete this user?
              </Typography>
              {userDeleteDialog.userDetails && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.50', borderRadius: 2, border: '1px solid', borderColor: 'error.light' }}>
                  <Typography variant='body2' color='text.secondary'>Username: <Box component='span' fontWeight='bold' color='text.primary'>{userDeleteDialog.userDetails.username}</Box></Typography>
                  <Typography variant='body2' color='text.secondary'>Email: <Box component='span' fontWeight='bold' color='text.primary'>{userDeleteDialog.userDetails.email}</Box></Typography>
                  <Typography variant='body2' color='text.secondary'>Role: <Box component='span' fontWeight='bold' color='text.primary'>{userDeleteDialog.userDetails.role}</Box></Typography>
                </Box>
              )}
              <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
                This action cannot be undone. All user data will be permanently deleted.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setUserDeleteDialog({ open: false, userId: null, userDetails: null })} disabled={loading}>
                No, Cancel
              </Button>
              <Button 
                variant='contained' 
                color='error' 
                onClick={handleDeleteUser} 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <Delete />}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>}
      </Container>
      
      {/* Offline Indicator */}
      {!isOnline && (
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'fixed', 
            top: 70, 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 9999,
            px: 3,
            py: 1,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderRadius: 2
          }}
        >
          <Typography variant="body2" fontWeight="bold">📡 Offline Mode</Typography>
        </Paper>
      )}

      {/* Pull to Refresh Indicator */}
      {isPulling && (
        <Box 
          sx={{ 
            position: 'fixed',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
            opacity: Math.min(pullToRefreshY / 80, 1)
          }}
        >
          <CircularProgress size={40} />
        </Box>
      )}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={snackbar.duration || 4000} 
        onClose={handleCloseSnackbar} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.type} variant='filled' sx={{ width: '100%' }}>{snackbar.msg}</Alert>
      </Snackbar>
      <Box sx={{ position: 'fixed', bottom: 8, right: 16, opacity: 0.3, transition: 'opacity 0.3s', '&:hover': { opacity: 0.8 }, zIndex: 1, pointerEvents: 'none' }}>
        <Typography variant='caption' sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 400, textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
          © Developed by Eflash24
        </Typography>
      </Box>

      {/* Reward Breakdown Dialog */}
      <Dialog 
        open={rewardBreakdownDialog.open} 
        onClose={() => setRewardBreakdownDialog({ open: false, member: null, breakdown: [] })}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CardGiftcard />
          Cash Reward Breakdown
        </DialogTitle>
        <DialogContent>
          {rewardBreakdownDialog.member && (
            <>
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Member
                    </Typography>
                    <Typography variant='h6'>
                      {rewardBreakdownDialog.member.memberName}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      ID: {rewardBreakdownDialog.member.memberId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Total Purchase Value
                    </Typography>
                    <Typography variant='h5' color='primary.main'>
                      Rs. {rewardBreakdownDialog.member.totalPurchaseValue?.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant='h6' gutterBottom sx={{ mb: 2 }}>
                Tier-by-Tier Calculation
              </Typography>

              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Tier</strong></TableCell>
                      <TableCell align='right'><strong>Amount</strong></TableCell>
                      <TableCell align='center'><strong>Rate</strong></TableCell>
                      <TableCell align='right'><strong>Reward</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rewardBreakdownDialog.breakdown.map((tier, index) => (
                      <TableRow key={index}>
                        <TableCell>{tier.tier}</TableCell>
                        <TableCell align='right'>
                          Rs. {tier.amount.toLocaleString()}
                        </TableCell>
                        <TableCell align='center'>
                          <Chip label={`${tier.rate}%`} size='small' color='primary' />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography color='success.main' fontWeight='bold'>
                            Rs. {tier.reward.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align='right'>
                        <Typography variant='h6'>
                          <strong>Total Cash Reward:</strong>
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='h6' color='success.main' fontWeight='bold'>
                          Rs. {rewardBreakdownDialog.member.cashReward?.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                <Typography variant='body2' color='text.secondary'>
                  <strong>Note:</strong> Cash rewards are calculated based on tiered percentages. 
                  The first Rs. 250,000 earns {rewardBreakdownDialog.breakdown[0]?.rate || 4.5}%, 
                  the next Rs. 250,000 earns {rewardBreakdownDialog.breakdown[1]?.rate || 5.0}%, and so on.
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setRewardBreakdownDialog({ open: false, member: null, breakdown: [] })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box></ThemeProvider>
  );
}

export default App;
