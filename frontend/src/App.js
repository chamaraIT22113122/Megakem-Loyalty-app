import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Typography, AppBar, Toolbar, Card, CardContent, CardActionArea, List, ListItem, ListItemText, Chip, Container, CircularProgress, Snackbar, Alert, Grid, Paper, Fab, Divider, ThemeProvider, createTheme, CssBaseline, IconButton, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { QrCodeScanner, Person, Inventory2, AdminPanelSettings, ArrowForward, Delete, Add, CheckCircle, History as HistoryIcon, Dashboard as DashboardIcon, People, Category, Settings, TrendingUp, Edit, Save, Cancel } from '@mui/icons-material';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { authAPI, scansAPI, productsAPI } from './services/api';
import megakemLogo from './assets/Megakem  Logo.png';


const theme = createTheme({
  palette: { 
    primary: { main: '#003366', light: '#4A90A4', dark: '#001a33' }, 
    secondary: { main: '#A4D233', light: '#c5e066', dark: '#7fa326' },
    info: { main: '#00B4D8' },
    background: { default: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f7 100%)', paper: '#ffffff' }
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
  const [cart, setCart] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', type: 'success' });
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTab, setAdminTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ username: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [productDialog, setProductDialog] = useState({ open: false, product: null });
  const [userDialog, setUserDialog] = useState({ open: false, user: null });
  const scannerRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          try { const response = await authAPI.getMe(); setUser(response.data.data); }
          catch { localStorage.removeItem('token'); await createAnonymousSession(); }
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

  const handleScan = (qrString) => {
    try {
      let data; try { data = JSON.parse(qrString); } catch { data = { name: 'Unknown Item', batch: 'N/A', bag: 'N/A', id: qrString, qty: '1' }; }
      const newItem = { ...data, tempId: Date.now() + Math.random() };
      setCart(prev => [...prev, newItem]);
      showNotification('Item Added to Cart!');
      setView('cart');
    } catch (e) { showNotification('Scan Error', 'error'); }
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
      const scansData = cart.map(item => ({ memberName: memberName || 'N/A', memberId: memberId.toUpperCase(), role, productName: item.name, productNo: item.id, batchNo: item.batch, bagNo: item.bag, qty: item.qty }));
      await scansAPI.createBatch(scansData);
      showNotification(`Successfully submitted ${cart.length} items!`, 'success');
      setCart([]); setMemberId(''); setMemberName(''); setView('welcome');
    } catch (error) { console.error('Error:', error); showNotification(error.response?.data?.message || 'Transfer failed', 'error'); }
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
    setAdminAuth(false);
    setAdminEmail('');
    setAdminPassword('');
    setView('welcome');
  };

  const loadAdminData = async () => {
    if (!adminAuth) return;
    try {
      const [statsRes, scansRes, usersRes, productsRes] = await Promise.all([
        scansAPI.getStats(),
        scansAPI.getLive(),
        authAPI.getUsers(),
        productsAPI.getAll()
      ]);
      setStats(statsRes.data.data);
      setScanHistory(scansRes.data.data);
      setUsers(usersRes.data.data);
      setProducts(productsRes.data.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  useEffect(() => {
    if (adminAuth && view === 'admin') {
      loadAdminData();
      const interval = setInterval(() => {
        scansAPI.getLive().then(res => setScanHistory(res.data.data)).catch(console.error);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [adminAuth, view]);

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
    <ThemeProvider theme={theme}><CssBaseline /><Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f7 100%)', display: 'flex', flexDirection: 'column' }}>
      <AppBar position='static' elevation={0} sx={{ background: 'linear-gradient(135deg, #003366 0%, #004d7a 50%, #4A90A4 100%)', boxShadow: '0 4px 20px rgba(0,51,102,0.3)' }}><Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' }, px: { xs: 1, sm: 2 } }}>
        <QrCodeScanner sx={{ mr: { xs: 1, sm: 2 }, color: 'secondary.main', fontSize: { xs: '1.5rem', sm: '2rem' }, animation: 'pulse 2s ease-in-out infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.7, transform: 'scale(0.95)' } } }} />
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
            <Typography variant='h3' fontWeight='800' gutterBottom sx={{ background: 'linear-gradient(135deg, #003366 0%, #00B4D8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 2, letterSpacing: '-0.5px', fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>New Session</Typography>
            <Typography variant='h6' sx={{ color: 'text.secondary', fontWeight: 500, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Select your role to begin scanning</Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12}><Card sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)', border: '2px solid', borderColor: 'primary.main', overflow: 'hidden', position: 'relative', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', '@media (hover: hover)': { '&:hover': { transform: 'translateY(-8px) scale(1.02)', boxShadow: '0 20px 40px rgba(0,51,102,0.25)' } }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #003366 0%, #00B4D8 50%, #A4D233 100%)' } }}>
              <CardActionArea onClick={() => { setRole('applicator'); setView('scanner'); setCart([]); }} sx={{ p: { xs: 2, sm: 3.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: { xs: '15px', sm: '20px' }, background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)', mr: { xs: 2, sm: 3 }, boxShadow: '0 8px 20px rgba(0,51,102,0.35)', transition: 'all 0.3s', '@media (hover: hover)': { '&:hover': { transform: 'rotate(5deg) scale(1.1)' } } }}><Inventory2 sx={{ color: 'white', fontSize: { xs: '1.75rem', sm: '2.5rem' } }} /></Box>
                  <Box sx={{ flexGrow: 1 }}><Typography variant='h5' fontWeight='800' sx={{ color: 'primary.main', mb: 0.5, letterSpacing: '-0.3px', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>Applicator</Typography><Typography variant='body1' sx={{ color: 'text.secondary', fontWeight: 500, fontSize: { xs: '0.85rem', sm: '1rem' } }}>Contractor / Worker</Typography></Box>
                  <ArrowForward sx={{ color: 'secondary.main', fontSize: { xs: '1.75rem', sm: '2.5rem' }, animation: 'slideRight 1.5s ease-in-out infinite', '@keyframes slideRight': { '0%, 100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(8px)' } } }} />
                </Box>
              </CardActionArea>
            </Card></Grid>
            <Grid item xs={12}><Card sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fff4 100%)', border: '2px solid', borderColor: 'secondary.main', overflow: 'hidden', position: 'relative', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', '@media (hover: hover)': { '&:hover': { transform: 'translateY(-8px) scale(1.02)', boxShadow: '0 20px 40px rgba(164,210,51,0.25)' } }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #A4D233 0%, #00B4D8 50%, #003366 100%)' } }}>
              <CardActionArea onClick={() => { setRole('customer'); setView('scanner'); setCart([]); }} sx={{ p: { xs: 2, sm: 3.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: { xs: '15px', sm: '20px' }, background: 'linear-gradient(135deg, #A4D233 0%, #7fa326 100%)', mr: { xs: 2, sm: 3 }, boxShadow: '0 8px 20px rgba(164,210,51,0.35)', transition: 'all 0.3s', '@media (hover: hover)': { '&:hover': { transform: 'rotate(-5deg) scale(1.1)' } } }}><Person sx={{ color: 'white', fontSize: { xs: '1.75rem', sm: '2.5rem' } }} /></Box>
                  <Box sx={{ flexGrow: 1 }}><Typography variant='h5' fontWeight='800' sx={{ color: 'secondary.dark', mb: 0.5, letterSpacing: '-0.3px', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>Customer</Typography><Typography variant='body1' sx={{ color: 'text.secondary', fontWeight: 500, fontSize: { xs: '0.85rem', sm: '1rem' } }}>End User / Buyer</Typography></Box>
                  <ArrowForward sx={{ color: 'info.main', fontSize: { xs: '1.75rem', sm: '2.5rem' }, animation: 'slideRight 1.5s ease-in-out infinite', '@keyframes slideRight': { '0%, 100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(8px)' } } }} />
                </Box>
              </CardActionArea>
            </Card></Grid>
          </Grid>
        </Box>}
        {view === 'scanner' && <Paper sx={{ flexGrow: 1, bgcolor: '#000', color: 'white', overflow: 'hidden', position: 'relative', borderRadius: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000', minHeight: { xs: '300px', sm: '400px' } }}>
            <div id='reader' style={{ width: '100%', height: '100%' }}></div>
            <Box sx={{ position: 'absolute', zIndex: 0, opacity: 0.3, textAlign: 'center' }}><Typography variant='caption' sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Loading Camera...</Typography></Box>
            <IconButton onClick={() => setView('welcome')} sx={{ position: 'absolute', top: { xs: 8, sm: 16 }, left: { xs: 8, sm: 16 }, zIndex: 10, bgcolor: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.3s', '&:hover': { bgcolor: 'white', transform: 'scale(1.1)' }, width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}><ArrowForward sx={{ transform: 'rotate(180deg)', color: 'primary.main', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} /></IconButton>
            {cart.length > 0 && <Fab variant='extended' size={window.innerWidth < 600 ? 'small' : 'medium'} onClick={() => setView('cart')} sx={{ position: 'absolute', top: { xs: 8, sm: 16 }, right: { xs: 8, sm: 16 }, zIndex: 10, background: 'linear-gradient(135deg, #A4D233 0%, #7fa326 100%)', color: 'white', fontWeight: 700, boxShadow: '0 6px 20px rgba(164,210,51,0.4)', animation: 'bounce 2s ease-in-out infinite', '@keyframes bounce': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } }, '&:hover': { background: 'linear-gradient(135deg, #7fa326 0%, #A4D233 100%)' }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1.5, sm: 2 } }}>View Cart ({cart.length})</Fab>}
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
                  <Chip label={item.qty} size='medium' sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 700, px: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.75rem', sm: '0.9rem' }, height: { xs: 24, sm: 32 } }} />
                  <Chip label={item.id} size='medium' sx={{ bgcolor: 'info.main', color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem' }, height: { xs: 24, sm: 32 } }} />
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
            <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
              {role === 'customer' && <Grid item xs={12}><TextField fullWidth label='Customer Name' variant='outlined' value={memberName} onChange={(e) => setMemberName(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', fontWeight: 600, '&:hover fieldset': { borderColor: 'primary.main', borderWidth: 2 }, '&.Mui-focused fieldset': { borderWidth: 2 } } }} /></Grid>}
              <Grid item xs={12}><TextField fullWidth label={role === 'customer' ? 'Phone Number' : 'Member ID'} placeholder={role === 'customer' ? 'e.g. 0712345678' : 'e.g. APP-001'} variant='outlined' value={memberId} onChange={(e) => { const value = e.target.value; if (role === 'customer') { if (/^\d*$/.test(value) && value.length <= 10) setMemberId(value); } else { setMemberId(value); } }} inputProps={role === 'customer' ? { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 } : {}} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', fontWeight: 600, '&:hover fieldset': { borderColor: 'primary.main', borderWidth: 2 }, '&.Mui-focused fieldset': { borderWidth: 2 } } }} /></Grid>
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
              <Tab icon={<People />} label='Users' />
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
            
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}><Category /> Product Scan Details</Typography><List dense>{stats.topProducts?.map((p, i) => <ListItem key={i} sx={{ borderLeft: '4px solid', borderLeftColor: i === 0 ? 'primary.main' : i === 1 ? 'secondary.main' : 'grey.300', mb: 1, bgcolor: 'grey.50', borderRadius: 1 }}><ListItemText primary={<Typography variant='body1' fontWeight={600}>{p._id}</Typography>} secondary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}><Chip label={`${p.count} scans`} size='small' color={i === 0 ? 'primary' : i === 1 ? 'secondary' : 'default'} /><Typography variant='caption' color='text.secondary'>#{i + 1} Most Scanned</Typography></Box>} /></ListItem>)}</List></CardContent></Card></Grid>
          </Grid>}

          {adminTab === 1 && <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {scanHistory.length === 0 ? <Box sx={{ textAlign: 'center', mt: 8, opacity: 0.5 }}><HistoryIcon sx={{ fontSize: 60, mb: 2 }} /><Typography>No scans yet.</Typography></Box> :
              scanHistory.map((item, i) => <Card key={item._id || i} sx={{ mb: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box><Typography variant='subtitle1' fontWeight='bold'>{item.memberName || 'Unknown'}</Typography><Chip label={item.memberId} size='small' sx={{ borderRadius: 1, height: 20, fontSize: '0.7rem' }} /></Box>
                    <Chip label={item.role} size='small' color={item.role === 'applicator' ? 'warning' : 'info'} sx={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 'bold' }} />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant='body2' color='text.secondary'>Product: <Box component='span' color='text.primary'>{item.productName}</Box></Typography>
                  <Typography variant='body2' color='text.secondary'>ID: {item.productNo}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={`Batch: ${item.batchNo}`} size='small' variant='outlined' sx={{ fontSize: '0.7rem' }} />
                    <Chip label={`Bag: ${item.bagNo}`} size='small' variant='outlined' sx={{ fontSize: '0.7rem' }} />
                  </Box>
                  <Typography variant='caption' sx={{ display: 'block', textAlign: 'right', mt: 1, color: 'text.disabled' }}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Pending'}</Typography>
                </CardContent>
              </Card>)}
          </Box>}

          {adminTab === 2 && <Box>
            <Box sx={{ mb: 2 }}><Button variant='contained' startIcon={<Add />} onClick={() => setUserDialog({ open: true, user: { username: '', email: '', password: '', role: 'user' } })}>Add User</Button></Box>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table><TableHead><TableRow><TableCell>Username</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                <TableBody>{users.map(u => <TableRow key={u._id}><TableCell>{u.username}</TableCell><TableCell>{u.email}</TableCell><TableCell><Chip label={u.role} size='small' color={u.role === 'admin' ? 'error' : 'default'} /></TableCell><TableCell><Switch checked={u.isActive} onChange={() => handleToggleUserStatus(u._id, u.isActive)} /></TableCell></TableRow>)}</TableBody>
              </Table>
            </TableContainer>
          </Box>}

          {adminTab === 3 && <Box>
            <Box sx={{ mb: 2 }}><Button variant='contained' startIcon={<Add />} onClick={() => setProductDialog({ open: true, product: { name: '', productNo: '', description: '', category: '' } })}>Add Product</Button></Box>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Product No</TableCell><TableCell>Category</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>{products.map(p => <TableRow key={p._id}><TableCell>{p.name}</TableCell><TableCell>{p.productNo}</TableCell><TableCell>{p.category}</TableCell><TableCell><IconButton size='small' onClick={() => setProductDialog({ open: true, product: p })}><Edit /></IconButton><IconButton size='small' color='error' onClick={() => handleDeleteProduct(p._id)}><Delete /></IconButton></TableCell></TableRow>)}</TableBody>
              </Table>
            </TableContainer>
          </Box>}

          {adminTab === 4 && <Grid container spacing={3}>
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom>Profile Settings</Typography>{!editingProfile ? <Box><Typography variant='body1'><strong>Username:</strong> {user?.username}</Typography><Typography variant='body1'><strong>Email:</strong> {user?.email}</Typography><Button variant='outlined' startIcon={<Edit />} onClick={() => { setEditingProfile(true); setProfileData({ username: user?.username, email: user?.email }); }} sx={{ mt: 2 }}>Edit Profile</Button></Box> : <Box><TextField fullWidth label='Username' value={profileData.username} onChange={(e) => setProfileData({ ...profileData, username: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth label='Email' type='email' value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} sx={{ mb: 2 }} /><Box sx={{ display: 'flex', gap: 1 }}><Button variant='contained' startIcon={<Save />} onClick={handleUpdateProfile} disabled={loading}>Save</Button><Button variant='outlined' startIcon={<Cancel />} onClick={() => setEditingProfile(false)}>Cancel</Button></Box></Box>}</CardContent></Card></Grid>
            <Grid item xs={12}><Card><CardContent><Typography variant='h6' gutterBottom>Change Password</Typography><TextField fullWidth type='password' label='Current Password' value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth type='password' label='New Password' value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth type='password' label='Confirm New Password' value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} sx={{ mb: 2 }} /><Button variant='contained' onClick={handleChangePassword} disabled={loading}>Change Password</Button></CardContent></Card></Grid>
          </Grid>}

          <Dialog open={productDialog.open} onClose={() => setProductDialog({ open: false, product: null })} maxWidth='sm' fullWidth>
            <DialogTitle>{productDialog.product?._id ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogContent><TextField fullWidth label='Product Name' value={productDialog.product?.name || ''} onChange={(e) => setProductDialog({ ...productDialog, product: { ...productDialog.product, name: e.target.value } })} sx={{ mt: 2, mb: 2 }} /><TextField fullWidth label='Product Number' value={productDialog.product?.productNo || ''} onChange={(e) => setProductDialog({ ...productDialog, product: { ...productDialog.product, productNo: e.target.value } })} sx={{ mb: 2 }} /><TextField fullWidth label='Category' value={productDialog.product?.category || ''} onChange={(e) => setProductDialog({ ...productDialog, product: { ...productDialog.product, category: e.target.value } })} sx={{ mb: 2 }} /><TextField fullWidth label='Description' multiline rows={3} value={productDialog.product?.description || ''} onChange={(e) => setProductDialog({ ...productDialog, product: { ...productDialog.product, description: e.target.value } })} /></DialogContent>
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
        </Box>}
      </Container>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.type} variant='filled' sx={{ width: '100%' }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box></ThemeProvider>
  );
}

export default App;
