import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Typography, AppBar, Toolbar, Card, CardContent, CardActionArea, List, ListItem, ListItemText, Chip, Container, CircularProgress, Snackbar, Alert, Grid, Paper, Fab, Divider, ThemeProvider, createTheme, CssBaseline, IconButton, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Avatar, Tooltip } from '@mui/material';
import { QrCodeScanner, Person, Inventory2, AdminPanelSettings, ArrowForward, Delete, Add, CheckCircle, History as HistoryIcon, Dashboard as DashboardIcon, People, Category, Settings, TrendingUp, Edit, Save, Cancel, EmojiEvents, CardGiftcard, Brightness4, Brightness7, Star, GetApp } from '@mui/icons-material';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { authAPI, scansAPI, productsAPI, rewardsAPI, analyticsAPI } from './services/api';
import megakemLogo from './assets/Megakem  Logo.png';
import megakemBrandLogo from './assets/Megakem  Brand Logo-01.png';


const getTheme = (mode) => createTheme({
  palette: { 
    mode,
    primary: { main: '#003366', light: '#4A90A4', dark: '#001a33' }, 
    secondary: { main: '#A4D233', light: '#c5e066', dark: '#7fa326' },
    info: { main: '#00B4D8' },
    background: { 
      default: mode === 'dark' ? '#0a1929' : 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f7 100%)', 
      paper: mode === 'dark' ? '#132f4c' : '#ffffff'
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
          padding: '12px 32px',
          borderRadius: '12px',
          boxShadow: '0 4px 14px 0 rgba(0,51,102,0.25)',
          transition: 'all 0.3s ease',
          '@media (max-width: 600px)': {
            padding: '10px 20px',
            fontSize: '0.9rem'
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px 0 rgba(0,51,102,0.35)'
          }
        },
        contained: {
          background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)'
        }
      } 
    },
    MuiCard: { 
      styleOverrides: { 
        root: { 
          boxShadow: '0 8px 24px -4px rgba(0,51,102,0.12)',
          transition: 'all 0.3s ease',
          '@media (hover: hover)': {
            '&:hover': {
              boxShadow: '0 12px 32px -4px rgba(0,51,102,0.2)',
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
  const [user, setUser] = useState(null);
  const [view, setView] = useState('welcome');
  const [role, setRole] = useState('applicator');
  const [memberId, setMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [location, setLocation] = useState('');
  const [cart, setCart] = useState([]);
  const [pendingScan, setPendingScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', type: 'success' });
  const [adminAuth, setAdminAuth] = useState(() => {
    const stored = localStorage.getItem('adminAuth');
    return stored === 'true';
  });
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTab, setAdminTab] = useState(0);
  const [userLoginEmail, setUserLoginEmail] = useState('');
  const [userLoginPassword, setUserLoginPassword] = useState('');
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [searchMemberId, setSearchMemberId] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [memberHistory, setMemberHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ username: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [productDialog, setProductDialog] = useState({ open: false, product: null });
  const [userDialog, setUserDialog] = useState({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, scanId: null, scanDetails: null });
  const [userDeleteDialog, setUserDeleteDialog] = useState({ open: false, userId: null, userDetails: null });
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [rewardDialog, setRewardDialog] = useState({ open: false, reward: null });
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
            // If adminAuth is stored, restore admin view
            if (storedAdminAuth === 'true') {
              setView('admin');
            }
          }
          catch { 
            localStorage.removeItem('token'); 
            localStorage.removeItem('adminAuth');
            await createAnonymousSession(); 
          }
        } else { await createAnonymousSession(); }
      } catch (error) { console.error('Auth error:', error); showNotification('Connection Error', 'error'); }
      finally { setInitializing(false); }
    };
    initAuth();
  }, []);

  const createAnonymousSession = async () => {
    try {
      const response = await authAPI.anonymous();
      const { token, id } = response.data.data;
      localStorage.setItem('token', token);
      setUser({ id, anonymous: true });
    } catch (error) { console.error('Anonymous auth error:', error); }
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
    
    // Try to parse format: "MLSP 001 050525 001 001"
    const parts = batchNo.trim().split(/\s+/);
    
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

  useEffect(() => {
    if (!user || view !== 'admin') return;
    const fetchLiveScans = async () => {
      try { const response = await scansAPI.getLive(); setScanHistory(response.data.data); }
      catch (error) { console.error('Error fetching scans:', error); }
    };
    fetchLiveScans();
    pollIntervalRef.current = setInterval(fetchLiveScans, 3000);
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [user, view]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const productsRes = await productsAPI.getAll();
        setProducts(productsRes.data.data);
        
        // Load additional data for logged-in users
        if (!user.anonymous) {
          const [rewardsRes, leaderboardRes] = await Promise.all([
            rewardsAPI.getAll(),
            analyticsAPI.getLeaderboard()
          ]);
          setRewards(rewardsRes.data.data);
          setLeaderboard(leaderboardRes.data.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    let html5QrcodeScanner;
    if (view === 'scanner') {
      loadScript('https://unpkg.com/html5-qrcode').then(() => {
        if (window.Html5QrcodeScanner) {
          const container = document.getElementById('reader');
          if (container) container.innerHTML = '';
          html5QrcodeScanner = new window.Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
          html5QrcodeScanner.render((decodedText) => {
            handleScan(decodedText);
            html5QrcodeScanner.clear().catch(err => console.error('Failed to clear scanner', err));
          }, () => {});
          scannerRef.current = html5QrcodeScanner;
        }
      }).catch(err => console.error('Failed to load QR library', err));
    }
    return () => { if (scannerRef.current) { scannerRef.current.clear().catch(() => {}); scannerRef.current = null; } };
  }, [view]);

  const showNotification = (msg, type = 'success') => setSnackbar({ open: true, msg, type });
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleScan = async (qrString) => {
    try {
      let data;
      
      // Try to parse as JSON first
      try {
        data = JSON.parse(qrString);
      } catch {
        // If not JSON, parse as batch number format: "MLSP 001 050525 001 002"
        const parts = qrString.trim().split(/\s+/);
        
        if (parts.length === 5) {
          const [productCode, materialBatch, dateCode, packSize, packNo] = parts;
          
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
          
          // Find product by exact product code match from admin products
          console.log('Looking for product with code:', productCode);
          console.log('Available products:', currentProducts.map(p => ({ name: p.name, code: p.productNo })));
          
          const product = currentProducts.find(p => 
            p.productNo.toUpperCase() === productCode.toUpperCase()
          );
          
          console.log('Found product:', product);
          
          const packSizeFormatted = extractPackSize(packSize);
          const itemPrice = getProductPrice(productCode, packSizeFormatted);
          
          if (product) {
            data = {
              id: product.productNo,
              name: product.name,
              batch: qrString, // Full batch string
              bag: packNo,     // Pack number as bag
              qty: packSizeFormatted,  // Pack size converted to kg format
              price: itemPrice // Price based on product and pack size
            };
            showNotification(`Added ${product.name}!`);
          } else {
            data = {
              name: `Unknown Item (Code: ${productCode})`,
              batch: qrString,
              bag: packNo || 'N/A',
              id: productCode,
              qty: extractPackSize(packSize) || '1kg',
              price: 0
            };
            showNotification(`Product with code "${productCode}" not found. Please add it in Admin > Products.`, 'warning');
          }
        } else {
          // Unknown format
          data = { name: 'Unknown Item', batch: qrString, bag: 'N/A', id: qrString, qty: '1' };
        }
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
    if (!user) return showNotification('Waiting for connection...', 'error');
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
      const { token, id, username, role } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('adminAuth', 'true');
      setUser({ id, username, role });
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
    setAdminAuth(false);
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
      localStorage.setItem('token', token);
      setUser({ id, username, email, role, anonymous: false });
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
      const [statsRes, scansRes, usersRes, productsRes] = await Promise.all([
        scansAPI.getStats(),
        scansAPI.getLive(),
        authAPI.getUsers(),
        productsAPI.getAll()
      ]);
      console.log('📦 Products response:', productsRes.data);
      setStats(statsRes.data.data);
      setScanHistory(scansRes.data.data);
      setUsers(usersRes.data.data);
      setProducts(productsRes.data.data);
      console.log('✅ Products loaded:', productsRes.data.data.length, 'products');
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
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

  // Process pending scan after role selection
  useEffect(() => {
    const processPendingScan = async () => {
      if (pendingScan && role && (view === 'scanner' || view === 'cart')) {
        console.log('Processing pending scan:', pendingScan);
        try {
          // Find product by exact product code match from admin products
          console.log('Processing pending scan with productCode:', pendingScan.productCode);
          console.log('Available products:', products.map(p => ({ name: p.name, code: p.productNo })));
          
          const product = products.find(p => 
            (pendingScan.productCode && p.productNo.toUpperCase() === pendingScan.productCode.toUpperCase())
          );
          
          console.log('Matched product:', product);
          
          const itemPrice = product ? getProductPrice(pendingScan.productCode, pendingScan.packSize || '1kg') : 0;
          
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
    if (!window.confirm('Delete this product?')) return;
    try {
      await productsAPI.delete(productId);
      setProducts(products.filter(p => p._id !== productId));
      showNotification('Product deleted!', 'success');
    } catch (error) {
      showNotification('Failed to delete product', 'error');
    }
  };

  const handleDeleteScan = async () => {
    setLoading(true);
    try {
      await scansAPI.delete(deleteDialog.scanId);
      setScanHistory(scanHistory.filter(s => s._id !== deleteDialog.scanId));
      showNotification('Scan deleted successfully!', 'success');
      setDeleteDialog({ open: false, scanId: null, scanDetails: null });
    } catch (error) {
      showNotification('Failed to delete scan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setLoading(true);
    try {
      await authAPI.deleteUser(userDeleteDialog.userId);
      setUsers(users.filter(u => u._id !== userDeleteDialog.userId));
      showNotification('User deleted successfully!', 'success');
      setUserDeleteDialog({ open: false, userId: null, userDetails: null });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      const { username, email, password, role } = userDialog.user;
      
      if (!username || !email || !password) {
        showNotification('Please fill all required fields', 'error');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        setLoading(false);
        return;
      }

      const res = await authAPI.createUser({ username, email, password, role: role || 'user' });
      setUsers([res.data.data, ...users]);
      showNotification('User created successfully!', 'success');
      setUserDialog({ open: false, user: null });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
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
    <ThemeProvider theme={getTheme(darkMode ? 'dark' : 'light')}><CssBaseline /><Box sx={{ minHeight: '100vh', background: darkMode ? '#0a1929' : 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f7 100%)', display: 'flex', flexDirection: 'column' }}>
      <AppBar position='static' elevation={0} sx={{ background: 'linear-gradient(135deg, #003366 0%, #004d7a 50%, #4A90A4 100%)', boxShadow: '0 4px 20px rgba(0,51,102,0.3)' }}><Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' }, px: { xs: 1, sm: 2 } }}>
        <img src={megakemBrandLogo} alt='Megakem Logo' style={{ height: '40px', width: 'auto', marginRight: '12px' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant='h6' component='div' sx={{ fontWeight: 700, letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.2)', lineHeight: 1.2, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>MEGAKEM LOYALTY</Typography>
          <Typography variant='caption' sx={{ color: 'white', fontWeight: 500, letterSpacing: '0.5px', fontSize: { xs: '0.55rem', sm: '0.65rem' }, opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>WHERE TRUST MEETS EXCELLENCE</Typography>
        </Box>
        {adminAuth && view === 'admin' && (
          <Button color='inherit' onClick={handleAdminLogout} sx={{ mr: 1, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>Logout</Button>
        )}
        <Button color='inherit' onClick={() => setView(view === 'admin' ? 'welcome' : 'admin')} sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{view === 'admin' ? 'App' : 'Admin'}</Button>
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
          {false && !user?.anonymous && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }}><Chip label="My Account" color="primary" /></Divider>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ cursor: 'pointer', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }} onClick={() => setView('profile')}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Person sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight={600}>Profile</Typography>
                      <Typography variant="caption" color="text.secondary">View stats & history</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ cursor: 'pointer', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }} onClick={() => setView('rewards')}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <CardGiftcard sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight={600}>Rewards</Typography>
                      <Typography variant="caption" color="text.secondary">Redeem your points</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
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

        {view === 'history' && <Box sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => setView('welcome')} sx={{ mr: 2 }}>
              <ArrowForward sx={{ transform: 'rotate(180deg)' }} />
            </IconButton>
            <Typography variant='h4' fontWeight={700}>Purchase History Search</Typography>
          </Box>
          <Card sx={{ mb: 3, p: 3 }}>
            <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>Search Purchase History</Typography>
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
            />
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1, textAlign: 'center', fontWeight: 600 }}>OR</Typography>
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
              sx={{ mb: 2 }}
            />
            <Button 
              fullWidth 
              variant='contained' 
              size='large'
              startIcon={<TrendingUp />}
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
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Card>
          {memberHistory.length > 0 && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Found {memberHistory.length} records for {searchPhone || searchMemberId}
              </Typography>
              {memberHistory.map((scan, idx) => (
                <Card key={scan._id || idx} sx={{ mb: 2 }}>
                  <CardContent>
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
                    {scan.location && <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>📍 {scan.location}</Typography>}
                    <Typography variant='caption' color='text.disabled' sx={{ display: 'block', mt: 1 }}>
                      {new Date(scan.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>}

        {view === 'profile' && (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <IconButton onClick={() => setView('welcome')} sx={{ mr: 2 }}>
                <ArrowForward sx={{ transform: 'rotate(180deg)' }} />
              </IconButton>
              <Typography variant="h4" fontWeight={700}>My Profile</Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'secondary.main', fontSize: '2rem' }}>
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <Typography variant="h5" fontWeight={700} gutterBottom>{user?.username || 'User'}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>{user?.email}</Typography>
                    <Chip label={user?.tier || 'Bronze'} color="secondary" sx={{ fontWeight: 700, fontSize: '1rem' }} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={700} color="primary">{user?.points || 0}</Typography>
                        <Typography variant="caption" color="text.secondary">Points</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={700} color="secondary">{user?.totalScans || 0}</Typography>
                        <Typography variant="caption" color="text.secondary">Total Scans</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={700} color="info.main">{user?.achievements?.length || 0}</Typography>
                        <Typography variant="caption" color="text.secondary">Achievements</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <EmojiEvents sx={{ fontSize: 40, color: 'warning.main' }} />
                        <Typography variant="caption" color="text.secondary">Tier Badge</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Achievements</Typography>
                    {user?.achievements && user.achievements.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {user.achievements.map((achievement, idx) => (
                          <Chip key={idx} label={achievement} icon={<Star />} color="warning" variant="outlined" />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No achievements yet. Start scanning to earn rewards!</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <HistoryIcon sx={{ mr: 1 }} /> Scan History
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    {scanHistory.length > 0 ? (
                      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {scanHistory.slice(0, 10).map((scan) => (
                          <Box key={scan._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Box>
                              <Typography variant="body1" fontWeight={600}>{scan.productName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Batch: {scan.batchNo} | Bag: {scan.bagNo}
                              </Typography>
                              {(() => {
                                const batchInfo = parseBatchInfo(scan.batchNo);
                                if (batchInfo?.parsed) {
                                  return (
                                    <Typography variant="caption" display="block" color="primary.main" sx={{ mt: 0.5 }}>
                                      {batchInfo.productCode} • Mat: {batchInfo.materialBatch} • {batchInfo.date}
                                    </Typography>
                                  );
                                }
                                return null;
                              })()}
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Chip label={scan.role} size="small" color={scan.role === 'applicator' ? 'primary' : 'secondary'} />
                              <Typography variant="caption" display="block" color="text.secondary">
                                {new Date(scan.scannedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No scan history available.</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        {view === 'rewards' && (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <IconButton onClick={() => setView('welcome')} sx={{ mr: 2 }}>
                <ArrowForward sx={{ transform: 'rotate(180deg)' }} />
              </IconButton>
              <Typography variant="h4" fontWeight={700}>Rewards Catalog</Typography>
            </Box>
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #A4D233 0%, #7fa326 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>Available Points</Typography>
                    <Typography variant="h3" fontWeight={700}>{user?.points || 0}</Typography>
                  </Box>
                  <CardGiftcard sx={{ fontSize: 80, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
            <Grid container spacing={3}>
              {rewards.length > 0 ? rewards.map((reward) => (
                <Grid item xs={12} sm={6} md={4} key={reward._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>{reward.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{reward.description}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Chip label={`${reward.pointsRequired} pts`} color="primary" sx={{ fontWeight: 700 }} />
                        <Typography variant="caption" color="text.secondary">Stock: {reward.stock}</Typography>
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        disabled={!user || user.points < reward.pointsRequired || reward.stock === 0}
                        onClick={() => setRewardDialog({ open: true, reward })}
                        sx={{ fontWeight: 600 }}
                      >
                        {user?.points >= reward.pointsRequired ? 'Redeem' : 'Insufficient Points'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              )) : (
                <Grid item xs={12}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                      <CardGiftcard sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">No rewards available at the moment</Typography>
                      <Typography variant="body2" color="text.secondary">Check back soon for exciting rewards!</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
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
                <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>Compete and earn rewards!</Typography>
              </CardContent>
            </Card>
            {leaderboard.length > 0 ? (
              <Grid container spacing={2}>
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <Grid item xs={12} key={entry._id}>
                    <Card sx={{ 
                      border: index < 3 ? '2px solid' : 'none',
                      borderColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'transparent',
                      background: index < 3 ? `linear-gradient(135deg, ${index === 0 ? '#FFF9E6' : index === 1 ? '#F5F5F5' : '#FFF0E6'} 0%, white 100%)` : 'white'
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
                              <Typography variant="h6" fontWeight={700}>{entry.username}</Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip label={entry.tier} size="small" color="primary" />
                                <Typography variant="caption" color="text.secondary">{entry.totalScans} scans</Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h5" fontWeight={700} color="primary">{entry.points}</Typography>
                            <Typography variant="caption" color="text.secondary">points</Typography>
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
            )}
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
                  {item.price > 0 && <Chip label={`Rs. ${item.price.toLocaleString()}`} size='medium' sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' }, height: { xs: 24, sm: 32 } }} />}
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
            {cart.length > 0 && cart.some(item => item.price > 0) && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', borderRadius: 2, border: '2px solid', borderColor: 'success.light', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant='body1' fontWeight='bold' color='success.dark' sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  💰 Total Estimated Value:
                </Typography>
                <Typography variant='h5' fontWeight='800' color='success.dark' sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                  Rs. {cart.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()}
                </Typography>
              </Box>
            )}
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
        {view === 'admin' && !adminAuth && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Card sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ width: 60, height: 60, bgcolor: 'primary.light', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, color: 'white' }}><AdminPanelSettings fontSize='large' /></Box>
                <Typography variant='h5' fontWeight='bold' gutterBottom>Admin Login</Typography>
                <Typography variant='body2' color='text.secondary'>Enter your credentials to access the admin panel</Typography>
              </Box>
              <form onSubmit={handleAdminLogin}>
                <TextField fullWidth label='Email' type='email' variant='outlined' value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} sx={{ mb: 2 }} required />
                <TextField fullWidth label='Password' type='password' variant='outlined' value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} sx={{ mb: 3 }} required />
                <Button fullWidth variant='contained' size='large' type='submit' disabled={loading} startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <AdminPanelSettings />}>{loading ? 'Logging in...' : 'Login as Admin'}</Button>
              </form>
            </CardContent>
          </Card>
        </Box>}
        {view === 'admin' && adminAuth && <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
          <Paper sx={{ mb: 2 }}>
            <Tabs value={adminTab} onChange={(e, v) => setAdminTab(v)} variant='scrollable' scrollButtons='auto'>
              <Tab icon={<DashboardIcon />} label='Dashboard' />
              <Tab icon={<HistoryIcon />} label='Scans' />
              <Tab icon={<People />} label='Co-Admins' />
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
            
            <Grid item xs={12} md={6}><Card sx={{ background: 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)', color: 'white' }}><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>💰 Total Product Value (Estimated)</Typography><Typography variant='h3' fontWeight='bold' sx={{ my: 2 }}>Rs. {scanHistory.reduce((total, scan) => { const product = products.find(p => p.productNo === scan.productNo); return total + ((product?.price || 0) * (scan.qty || 1)); }, 0).toLocaleString()}</Typography><Typography variant='body2' sx={{ opacity: 0.9 }}>Based on {scanHistory.length} scans with product pricing</Typography></CardContent></Card></Grid>
            
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>💵 Price Estimation by Product</Typography><TableContainer><Table size='small'><TableHead><TableRow><TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell><TableCell sx={{ fontWeight: 700 }}>Pack Size</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Unit Price</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Total Scans</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Total Qty</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Est. Value</TableCell></TableRow></TableHead><TableBody>{(() => { const productStats = scanHistory.reduce((acc, scan) => { const product = products.find(p => p.productNo === scan.productNo); if (!product) return acc; const key = product.productNo; if (!acc[key]) { acc[key] = { name: product.name, packSize: product.category || 'N/A', price: product.price || 0, scans: 0, totalQty: 0 }; } acc[key].scans += 1; acc[key].totalQty += parseInt(scan.qty) || 1; return acc; }, {}); return Object.entries(productStats).sort((a, b) => (b[1].price * b[1].totalQty) - (a[1].price * a[1].totalQty)).map(([code, data]) => <TableRow key={code} sx={{ '&:hover': { bgcolor: 'action.hover' } }}><TableCell><Typography variant='body2' fontWeight={600}>{data.name}</Typography><Typography variant='caption' color='text.secondary'>{code}</Typography></TableCell><TableCell><Chip label={data.packSize} size='small' variant='outlined' /></TableCell><TableCell align='right'><Typography variant='body2' fontWeight={600}>Rs. {data.price.toLocaleString()}</Typography></TableCell><TableCell align='right'><Chip label={data.scans} size='small' color='primary' /></TableCell><TableCell align='right'><Typography variant='body2' fontWeight={600}>{data.totalQty}</Typography></TableCell><TableCell align='right'><Typography variant='body1' fontWeight={700} color='success.main'>Rs. {(data.price * data.totalQty).toLocaleString()}</Typography></TableCell></TableRow>); })()}</TableBody></Table></TableContainer><Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant='body1' fontWeight={700} color='success.dark'>Grand Total Estimated Value:</Typography><Typography variant='h5' fontWeight={800} color='success.dark'>Rs. {scanHistory.reduce((total, scan) => { const product = products.find(p => p.productNo === scan.productNo); return total + ((product?.price || 0) * ((parseInt(scan.qty) || 1))); }, 0).toLocaleString()}</Typography></Box></CardContent></Card></Grid>
            
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}><Category /> Product Scan Details</Typography><List dense>{stats.topProducts?.map((p, i) => <ListItem key={i} sx={{ borderLeft: '4px solid', borderLeftColor: i === 0 ? 'primary.main' : i === 1 ? 'secondary.main' : 'grey.300', mb: 1, bgcolor: 'grey.50', borderRadius: 1 }}><ListItemText primary={<Typography variant='body1' fontWeight={600}>{p._id}</Typography>} secondary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}><Chip label={`${p.count} scans`} size='small' color={i === 0 ? 'primary' : i === 1 ? 'secondary' : 'default'} /><Typography variant='caption' color='text.secondary'>#{i + 1} Most Scanned</Typography></Box>} /></ListItem>)}</List></CardContent></Card></Grid>
          </Grid>}

          {adminTab === 1 && <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                variant='outlined' 
                startIcon={<GetApp />} 
                onClick={async () => {
                  try {
                    setLoading(true);
                    const response = await analyticsAPI.export({ type: 'scans', format: 'csv' });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `scans-export-${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    showNotification('CSV downloaded successfully!', 'success');
                  } catch (error) {
                    showNotification('Failed to download CSV', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || scanHistory.length === 0}
              >
                Download CSV
              </Button>
              <Button 
                variant='contained' 
                startIcon={<GetApp />} 
                onClick={async () => {
                  try {
                    setLoading(true);
                    const response = await analyticsAPI.export({ type: 'scans', format: 'xlsx' });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `scans-export-${Date.now()}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    showNotification('Excel file downloaded successfully!', 'success');
                  } catch (error) {
                    showNotification('Failed to download Excel file', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || scanHistory.length === 0}
                sx={{ background: 'linear-gradient(135deg, #217346 0%, #34a853 100%)', '&:hover': { background: 'linear-gradient(135deg, #1a5c37 0%, #2d8f45 100%)' } }}
              >
                Download Excel
              </Button>
            </Box>
            {scanHistory.length === 0 ? <Box sx={{ textAlign: 'center', mt: 8, opacity: 0.5 }}><HistoryIcon sx={{ fontSize: 60, mb: 2 }} /><Typography>No scans yet.</Typography></Box> :
              scanHistory.map((item, i) => <Card key={item._id || i} sx={{ mb: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
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
                    {item.price > 0 && <Chip label={`Rs. ${item.price.toLocaleString()}`} size='small' color='success' sx={{ fontSize: '0.7rem' }} />}
                  </Box>
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
          </Box>}

          {adminTab === 2 && <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant='contained' startIcon={<Add />} onClick={() => setUserDialog({ open: true, user: { username: '', email: '', password: '', role: 'admin' } })}>Add Co-Admin</Button>
              <Typography variant='body2' color='text.secondary'>Total Co-Admins: {users.filter(u => u.role === 'admin').length}</Typography>
            </Box>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table><TableHead><TableRow>
                <TableCell><strong>Username</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow></TableHead>
                <TableBody>{users.filter(u => u.role === 'admin').map(u => <TableRow key={u._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell><Typography variant='body2' fontWeight={600}>{u.username}</Typography></TableCell>
                  <TableCell><Typography variant='body2'>{u.email}</Typography></TableCell>
                  <TableCell><Chip label='Admin' size='small' color='error' /></TableCell>
                  <TableCell><Switch checked={u.isActive} onChange={() => handleToggleUserStatus(u._id, u.isActive)} /></TableCell>
                  <TableCell><Typography variant='caption' color='text.secondary'>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</Typography></TableCell>
                  <TableCell><IconButton size='small' color='error' onClick={() => setUserDeleteDialog({ open: true, userId: u._id, userDetails: { username: u.username, email: u.email, role: u.role } })}><Delete /></IconButton></TableCell>
                </TableRow>)}</TableBody>
              </Table>
            </TableContainer>
          </Box>}

          {adminTab === 3 && <Box>
            <Box sx={{ mb: 2 }}><Button variant='contained' startIcon={<Add />} onClick={() => setProductDialog({ open: true, product: { name: '', productNo: '', description: '', category: '', price: 0 } })}>Add Product</Button></Box>
            {console.log('🏷️ Rendering Products tab, products array:', products, 'Count:', products.length)}
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table><TableHead><TableRow><TableCell>Product Name</TableCell><TableCell>Product Code</TableCell><TableCell>Pack Size</TableCell><TableCell>Price (LKR)</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No products found. Click "Add Product" to create one.</TableCell></TableRow>
                  ) : (
                    products.map(p => <TableRow key={p._id}><TableCell>{p.name}</TableCell><TableCell>{p.productNo}</TableCell><TableCell>{p.category}</TableCell><TableCell>Rs. {p.price?.toLocaleString() || '0.00'}</TableCell><TableCell><IconButton size='small' onClick={() => setProductDialog({ open: true, product: p })}><Edit /></IconButton><IconButton size='small' color='error' onClick={() => handleDeleteProduct(p._id)}><Delete /></IconButton></TableCell></TableRow>)
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>}

          {adminTab === 4 && <Grid container spacing={3}>
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom>Profile Settings</Typography>{!editingProfile ? <Box><Typography variant='body1'><strong>Username:</strong> {user?.username}</Typography><Typography variant='body1'><strong>Email:</strong> {user?.email}</Typography><Button variant='outlined' startIcon={<Edit />} onClick={() => { setEditingProfile(true); setProfileData({ username: user?.username, email: user?.email }); }} sx={{ mt: 2 }}>Edit Profile</Button></Box> : <Box><TextField fullWidth label='Username' value={profileData.username} onChange={(e) => setProfileData({ ...profileData, username: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth label='Email' type='email' value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} sx={{ mb: 2 }} /><Box sx={{ display: 'flex', gap: 1 }}><Button variant='contained' startIcon={<Save />} onClick={handleUpdateProfile} disabled={loading}>Save</Button><Button variant='outlined' startIcon={<Cancel />} onClick={() => setEditingProfile(false)}>Cancel</Button></Box></Box>}</CardContent></Card></Grid>
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom>Change Password</Typography><TextField fullWidth type='password' label='Current Password' value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth type='password' label='New Password' value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth type='password' label='Confirm New Password' value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} sx={{ mb: 2 }} /><Button variant='contained' onClick={handleChangePassword} disabled={loading}>Change Password</Button></CardContent></Card></Grid>
          </Grid>}

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
            <DialogTitle>Create New User</DialogTitle>
            <DialogContent>
              <TextField fullWidth label='Username' value={userDialog.user?.username || ''} onChange={(e) => setUserDialog({ ...userDialog, user: { ...userDialog.user, username: e.target.value } })} sx={{ mt: 2, mb: 2 }} required />
              <TextField fullWidth label='Email' type='email' value={userDialog.user?.email || ''} onChange={(e) => setUserDialog({ ...userDialog, user: { ...userDialog.user, email: e.target.value } })} sx={{ mb: 2 }} required />
              <TextField fullWidth label='Password' type='password' value={userDialog.user?.password || ''} onChange={(e) => setUserDialog({ ...userDialog, user: { ...userDialog.user, password: e.target.value } })} sx={{ mb: 2 }} helperText='Minimum 6 characters' required />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Role</InputLabel>
                <Select value={userDialog.user?.role || 'user'} label='Role' onChange={(e) => setUserDialog({ ...userDialog, user: { ...userDialog.user, role: e.target.value } })}>
                  <MenuItem value='user'>User</MenuItem>
                  <MenuItem value='admin'>Admin</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions><Button onClick={() => setUserDialog({ open: false, user: null })}>Cancel</Button><Button variant='contained' onClick={handleCreateUser} disabled={loading} startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <Add />}>{loading ? 'Creating...' : 'Create User'}</Button></DialogActions>
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

          <Dialog open={rewardDialog.open} onClose={() => setRewardDialog({ open: false, reward: null })} maxWidth="sm" fullWidth>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to redeem <strong>{rewardDialog.reward?.title}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This will deduct <strong>{rewardDialog.reward?.pointsRequired} points</strong> from your account.
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Current Points: {user?.points}</Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  After: {(user?.points || 0) - (rewardDialog.reward?.pointsRequired || 0)} points
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRewardDialog({ open: false, reward: null })} disabled={loading}>Cancel</Button>
              <Button onClick={async () => {
                if (!rewardDialog.reward) return;
                setLoading(true);
                try {
                  await rewardsAPI.redeem(rewardDialog.reward._id);
                  const userRes = await authAPI.getMe();
                  setUser(userRes.data.data);
                  showNotification('Reward redeemed successfully!', 'success');
                  setRewardDialog({ open: false, reward: null });
                  const rewardsRes = await rewardsAPI.getAll();
                  setRewards(rewardsRes.data.data);
                } catch (error) {
                  showNotification(error.response?.data?.message || 'Failed to redeem reward', 'error');
                } finally {
                  setLoading(false);
                }
              }} variant="contained" disabled={loading} sx={{ fontWeight: 600 }}>
                {loading ? <CircularProgress size={24} /> : 'Confirm Redemption'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>}
      </Container>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.type} variant='filled' sx={{ width: '100%' }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box></ThemeProvider>
  );
}

export default App;
