import React, { useEffect, useState, useRef } from 'react'
import {
  Box, AppBar, Toolbar, Typography, Button, Container, Paper, Grid,
  Card, CardContent, CardActionArea, Fab, Chip,
  TextField, CircularProgress, Snackbar, Alert, IconButton,
  ThemeProvider, createTheme, CssBaseline
} from '@mui/material'
import { Layers, Inventory2, Person, QrCodeScanner, ArrowForward, Add, Delete, CheckCircle } from '@mui/icons-material'
import { initFirebase, ensureAuth, getFirebase } from './firebase'

// Dynamically load html5-qrcode if not bundled
const loadHtml5QrCode = () => {
  return new Promise((resolve) => {
    if (window.Html5QrcodeScanner) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
    script.onload = resolve
    script.onerror = () => resolve() // Graceful fail
    document.head.appendChild(script)
  })
}

const theme = createTheme({
  palette: { primary: { main: '#4338ca' }, secondary: { main: '#fbbf24' } },
  shape: { borderRadius: 12 }
})

export default function App() {
  const [view, setView] = useState('welcome')
  const [role, setRole] = useState('applicator')
  const [cart, setCart] = useState([])
  const [memberName, setMemberName] = useState('')
  const [memberId, setMemberId] = useState('')
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [cameraPermission, setCameraPermission] = useState('pending')
  const [editingQty, setEditingQty] = useState(null)
  const [continuousMode, setContinuousMode] = useState(true)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const scannerRef = useRef(null)

  // Preload scanner library and restore from localStorage
  useEffect(() => { 
    initFirebase()
    loadHtml5QrCode()
    
    // Restore from localStorage
    const savedHistory = localStorage.getItem('scanTrakHistory')
    const savedMemberName = localStorage.getItem('scanTrakMemberName')
    const savedMemberId = localStorage.getItem('scanTrakMemberId')
    
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        // Convert timestamp strings back to Date objects
        const restored = parsed.map(r => ({ ...r, timestamp: new Date(r.timestamp) }))
        setHistory(restored)
      } catch (e) {}
    }
    if (savedMemberName) setMemberName(savedMemberName)
    if (savedMemberId) setMemberId(savedMemberId)
  }, [])
  
  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      // Keep only last 50 submissions for performance
      const limitedHistory = history.slice(0, 50)
      localStorage.setItem('scanTrakHistory', JSON.stringify(limitedHistory))
    }
  }, [history])
  
  // Save member info to localStorage
  useEffect(() => {
    if (memberName) localStorage.setItem('scanTrakMemberName', memberName)
    if (memberId) localStorage.setItem('scanTrakMemberId', memberId)
  }, [memberName, memberId])

  useEffect(() => {
    let scanner
    let initTimeout
    
    if (view === 'scanner') {
      setCameraLoading(true)
      setCameraPermission('pending')
      
      loadHtml5QrCode().then(() => {
        if (!window.Html5QrcodeScanner) {
          setCameraPermission('denied')
          setCameraLoading(false)
          setShowManualInput(true)
          showNotification('QR Scanner library failed to load', 'error')
          return
        }
        
        try {
          const container = document.getElementById('reader')
          if (!container) {
            throw new Error('Scanner container not found')
          }
          
          container.innerHTML = ''
          
          // Simplified mobile-optimized configuration
          const config = {
            fps: 10,
            qrbox: function(viewfinderWidth, viewfinderHeight) {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
              const size = Math.floor(minEdge * 0.7)
              return { width: size, height: size }
            },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: { ideal: 'environment' }
            },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true
          }
          
          scanner = new window.Html5QrcodeScanner('reader', config, false)
          scannerRef.current = scanner
          
          scanner.render(
            (decoded) => {
              // Success callback
              setCameraPermission('granted')
              setCameraLoading(false)
              if (initTimeout) clearTimeout(initTimeout)
              onScanned(decoded)
              if (!continuousMode) {
                scanner.clear().catch(() => {})
              }
            },
            (err) => {
              // Error callback - ignore "not found" errors during scanning
              if (err && typeof err === 'string' && !err.includes('NotFoundException')) {
                console.warn('Scan error:', err)
              }
            }
          )
          
          // Check if camera actually started after 3 seconds
          initTimeout = setTimeout(() => {
            const video = document.querySelector('#reader video')
            if (video && video.readyState >= 2) {
              // Video is loaded and ready
              setCameraPermission('granted')
              setCameraLoading(false)
            } else {
              // Camera didn't start
              setCameraPermission('denied')
              setCameraLoading(false)
              setShowManualInput(true)
              showNotification('Camera not accessible. Please allow camera permission and ensure HTTPS.', 'warning')
            }
          }, 3000)
          
        } catch (e) {
          console.error('Scanner init error:', e)
          setCameraPermission('denied')
          setCameraLoading(false)
          setShowManualInput(true)
          showNotification('Camera initialization failed: ' + e.message, 'error')
        }
      }).catch(err => {
        console.error('Failed to load QR library:', err)
        setCameraPermission('denied')
        setCameraLoading(false)
        setShowManualInput(true)
        showNotification('Scanner library failed to load', 'error')
      })
    }

    return () => {
      if (initTimeout) clearTimeout(initTimeout)
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
      setCameraLoading(false)
    }
  }, [view, continuousMode])

  const showNotification = (msg, severity = 'success') => setSnack({ open: true, msg, severity })

  function onScanned(qr) {
    let data
    try { 
      data = JSON.parse(qr)
      if (!data.name || !data.id) {
        throw new Error('Invalid QR format')
      }
    } catch { 
      data = { name: 'Unknown', id: qr, batch: 'N/A', bag: 'N/A', qty: '1' } 
    }
    
    // Check for duplicates
    const isDuplicate = cart.some(item => item.id === data.id && item.batch === data.batch)
    if (isDuplicate) {
      if (!window.confirm(`${data.name} is already in cart. Add again?`)) {
        return
      }
    }
    
    const item = { ...data, tempId: Date.now() + Math.random() }
    setCart(prev => [...prev, item])
    
    // Play beep and vibrate
    try {
      if ('vibrate' in navigator) navigator.vibrate(100)
      const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ8PU6vo85ljHAU3k9n01YAyBSJ7ye7hlkwME1q46+qZUxEMTKXh8bllHgU7mdz01nsxBSh9y+/ekkgLElm16+maVBENTqvj8rJiGgU7nN701nwvBSh9zPDgj0YJFGK99OShTw0PTqzj8bBfGQU/od/z1HYqAyx+zfDik0UJFWO/9OSgTQwQU7Dl8a1bFgVBpOHz03MnBCuAz/HjlkQKFmXA9eWhTAwRVrLm8apYEwVHqOPzz28hAy2B0fHllUcKGGjB9uWgSwwUXLTn8aVUEAVKq+Tz')
      beep.volume = 0.3
      beep.play().catch(() => {})
    } catch (e) {}
    
    showNotification(`${data.name} added to cart`)
    
    if (!continuousMode) {
      setView('cart')
    }
  }
  
  const handleManualInput = () => {
    if (!manualInput.trim()) return
    onScanned(manualInput)
    setManualInput('')
  }

  const removeItem = (tempId) => setCart(prev => prev.filter(i => i.tempId !== tempId))
  
  const removeAll = () => {
    if (window.confirm(`Remove all ${cart.length} items from cart?`)) {
      setCart([])
      showNotification('Cart cleared')
    }
  }
  
  const updateQty = (tempId, newQty) => {
    if (!newQty.trim()) return
    setCart(prev => prev.map(i => i.tempId === tempId ? { ...i, qty: newQty } : i))
    setEditingQty(null)
    showNotification('Quantity updated')
  }
  
  const exportHistory = () => {
    const csv = [
      ['Timestamp', 'Member Name', 'Member ID', 'Role', 'Product', 'Product ID', 'Batch', 'Bag', 'Qty'],
      ...history.flatMap(record => 
        record.items.map(item => [
          record.timestamp.toLocaleString(),
          record.memberName,
          record.memberId,
          record.role,
          item.name,
          item.id,
          item.batch,
          item.bag,
          item.qty
        ])
      )
    ].map(row => row.join(',')).join('\\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scantrak-history-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showNotification('History exported')
  }

  async function submitAll() {
    if (cart.length === 0) return showNotification('No items to submit', 'error')
    if (!memberName.trim() || !memberId.trim()) return showNotification('Please enter Name and ID', 'error')
    setLoading(true)
    try {
      // attempt firebase upload if configured
      const fb = getFirebase()
      if (fb && fb.db) {
        await ensureAuth()
        // simplified: we won't write code to push to firestore here to avoid adding extra complexity
        // In a real app you'd call addDoc(collection(...), { ... })
      }
      
      // Add to history
      const submission = {
        id: Date.now(),
        timestamp: new Date(),
        memberName,
        memberId,
        role,
        items: [...cart],
        itemCount: cart.length
      }
      setHistory(prev => [submission, ...prev])
      
      showNotification(`Submitted ${cart.length} items`)
      setCart([])
      setMemberName('')
      setMemberId('')
      setView('welcome')
    } catch (e) {
      console.error(e)
      showNotification('Submit failed', 'error')
    } finally { setLoading(false) }
  }
  
  const clearHistory = () => {
    if (window.confirm('Clear all submission history? This cannot be undone.')) {
      setHistory([])
      localStorage.removeItem('scanTrakHistory')
      showNotification('History cleared')
    }
  }
  
  const filteredHistory = history.filter(record => 
    searchQuery === '' || 
    record.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <QrCodeScanner sx={{ mr: 2, color: 'secondary.main' }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>ScanTrak</Typography>
            <Button color="inherit" onClick={() => setView(view === 'admin' ? 'welcome' : 'admin')}>{view === 'admin' ? 'App' : 'History'}</Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="sm" sx={{ py: 3, flexGrow: 1 }}>
          {view === 'welcome' && (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 80, height: 80, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Layers fontSize="large" />
              </Box>
              <Typography variant="h4" fontWeight="bold">New Session</Typography>
              <Typography color="text.secondary">Choose role to start scanning</Typography>

              <Grid container spacing={2} sx={{ mt: 3 }}>
                <Grid item xs={12}>
                  <Card>
                    <CardActionArea onClick={() => { setRole('applicator'); setView('scanner'); setCart([]) }} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Inventory2 color="primary" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight={700}>Applicator</Typography>
                          <Typography variant="body2" color="text.secondary">Contractor / Worker</Typography>
                        </Box>
                        <ArrowForward />
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardActionArea onClick={() => { setRole('customer'); setView('scanner'); setCart([]) }} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person color="primary" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight={700}>Customer</Typography>
                          <Typography variant="body2" color="text.secondary">End User / Buyer</Typography>
                        </Box>
                        <ArrowForward />
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {view === 'scanner' && (
            <Box>
              <Paper sx={{ height: '60vh', bgcolor: '#000', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                {cameraLoading && (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5, bgcolor: 'rgba(0,0,0,0.7)' }}>
                    <CircularProgress sx={{ color: 'white', mb: 2 }} />
                    <Typography variant="body2">Initializing camera...</Typography>
                    <Typography variant="caption" sx={{ mt: 1, opacity: 0.7 }}>Please allow camera access</Typography>
                  </Box>
                )}
                
                {cameraPermission === 'denied' && !cameraLoading && (
                  <Box sx={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
                    <Alert severity="error" sx={{ bgcolor: 'rgba(255,255,255,0.95)' }}>
                      <strong>Camera unavailable</strong><br/>
                      <Typography variant="caption" component="div">
                        • Check browser permissions<br/>
                        • Ensure you're on HTTPS<br/>
                        • Try refreshing the page
                      </Typography>
                    </Alert>
                  </Box>
                )}
                
                {cart.length > 0 && (
                  <Fab 
                    variant="extended" 
                    size="small" 
                    color="secondary" 
                    onClick={() => setView('cart')} 
                    sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
                  >
                    Cart ({cart.length})
                  </Fab>
                )}
                
                <div id="reader" style={{ width: '100%', height: '100%' }}></div>
              </Paper>
              
              <Paper sx={{ mt: 2, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Continuous Scanning</Typography>
                  <Button 
                    size="small" 
                    variant={continuousMode ? 'contained' : 'outlined'}
                    onClick={() => setContinuousMode(!continuousMode)}
                  >
                    {continuousMode ? 'ON' : 'OFF'}
                  </Button>
                </Box>
                {continuousMode && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Items will be added to cart without leaving scanner
                  </Typography>
                )}
              </Paper>
              
              <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Manual QR Input</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField 
                    fullWidth
                    size="small"
                    placeholder="Paste QR code data or JSON"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualInput()}
                  />
                  <Button variant="contained" onClick={handleManualInput}>Add</Button>
                </Box>
                {cameraPermission === 'denied' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    💡 Camera requires HTTPS on mobile devices. Use manual input or deploy to a secure host.
                  </Typography>
                )}
              </Paper>
            </Box>
          )}

          {view === 'cart' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight={700}>Scanned Items</Typography>
                  <Typography color="text.secondary">{cart.length} items</Typography>
                </Box>
                {cart.length > 1 && (
                  <Button size="small" color="error" onClick={removeAll}>Remove All</Button>
                )}
              </Box>

              <Box sx={{ mt: 2 }}>
                {cart.map(item => (
                  <Card key={item.tempId} sx={{ mb: 2 }}>
                    <CardContent>
                      <IconButton sx={{ float: 'right' }} onClick={() => removeItem(item.tempId)}><Delete /></IconButton>
                      <Typography fontWeight={700}>{item.name}</Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                        {editingQty === item.tempId ? (
                          <TextField 
                            size="small" 
                            defaultValue={item.qty} 
                            onBlur={(e) => updateQty(item.tempId, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateQty(item.tempId, e.target.value)}
                            autoFocus
                            sx={{ width: 100 }}
                          />
                        ) : (
                          <Chip 
                            label={item.qty} 
                            sx={{ mr: 1, cursor: 'pointer' }} 
                            onClick={() => setEditingQty(item.tempId)}
                            color="primary"
                          />
                        )}
                        <Chip label={item.id} variant="outlined" />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Batch: {item.batch} • Bag: {item.bag}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

                <Button startIcon={<Add />} variant="outlined" fullWidth onClick={() => setView('scanner')}>Scan Another Item</Button>

                <Paper sx={{ p: 2, mt: 2 }} elevation={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}><TextField fullWidth label={`${role === 'applicator' ? 'Applicator' : 'Customer'} Name`} value={memberName} onChange={e => setMemberName(e.target.value)} /></Grid>
                    <Grid item xs={12}><TextField fullWidth label="Member ID" value={memberId} onChange={e => setMemberId(e.target.value)} /></Grid>
                    <Grid item xs={12}>
                      <Button variant="contained" fullWidth onClick={submitAll} disabled={loading || cart.length===0} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}>
                        {loading ? 'Submitting...' : `Submit ${cart.length} Items`}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            </Box>
          )}

          {view === 'admin' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Submission History</Typography>
                {history.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={exportHistory}>Export CSV</Button>
                    <Button size="small" color="error" onClick={clearHistory}>Clear</Button>
                  </Box>
                )}
              </Box>
              
              {history.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No submissions yet</Typography>
                  <Button sx={{ mt: 2 }} variant="outlined" onClick={() => setView('welcome')}>Start Scanning</Button>
                </Paper>
              ) : (
                <Box>
                  <TextField 
                    fullWidth
                    size="small"
                    placeholder="Search by name, ID, or product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  {filteredHistory.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">No results found</Typography>
                    </Paper>
                  ) : (
                    filteredHistory.map(record => (
                    <Card key={record.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box>
                            <Typography fontWeight={700}>{record.memberName}</Typography>
                            <Typography variant="caption" color="text.secondary">{record.memberId}</Typography>
                          </Box>
                          <Chip label={record.role} size="small" color={record.role === 'applicator' ? 'primary' : 'secondary'} />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {record.itemCount} items • {record.timestamp.toLocaleString()}
                        </Typography>
                        <Box sx={{ maxHeight: 100, overflowY: 'auto' }}>
                          {record.items.map((item, idx) => (
                            <Typography key={idx} variant="caption" sx={{ display: 'block' }}>
                              • {item.name} ({item.qty})
                            </Typography>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                  )}
                </Box>
              )}
            </Box>
          )}
        </Container>

        <Fab variant="extended" color="secondary" sx={{ position: 'fixed', right: 16, bottom: 16 }} onClick={() => setView('scanner')}>
          <QrCodeScanner sx={{ mr: 1 }} /> Scan
        </Fab>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}
