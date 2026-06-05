import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Alert,
  Checkbox,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField as StyledTextField,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Print,
  Download,
  Delete as DeleteIcon,
  Edit,
  Visibility,
  Refresh,
  FilterList,
  GetApp,
  Close
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../services/api';

// Helper to extract date from batch number (returns string DD/MM/YYYY or null)
const extractDateFromBatch = (batchNo) => {
  if (!batchNo) return null;
  const cleanBatch = batchNo.trim();
  
  // Try split by underscore or space
  let parts = cleanBatch.split('_');
  if (parts.length < 3) {
    parts = cleanBatch.split(/\s+/);
  }
  
  let dateStr = '';
  let format = ''; // 'DDMMYY', 'YYYYMMDD', 'DDMMYYYY'
  
  // Check index 2 first (standard 4-part or 5-part Megakem formats)
  if (parts.length >= 3 && /^\d{6}$/.test(parts[2])) {
    dateStr = parts[2];
    format = 'DDMMYY';
  } else {
    // Look for any part that is exactly 6 digits
    const sixDigitPart = parts.find(p => /^\d{6}$/.test(p));
    if (sixDigitPart) {
      dateStr = sixDigitPart;
      format = 'DDMMYY';
    } else {
      // Look for any part that is exactly 8 digits
      const eightDigitPart = parts.find(p => /^\d{8}$/.test(p));
      if (eightDigitPart) {
        dateStr = eightDigitPart;
        format = (dateStr.startsWith('20') || dateStr.startsWith('19')) ? 'YYYYMMDD' : 'DDMMYYYY';
      }
    }
  }
  
  if (dateStr) {
    if (format === 'DDMMYY') {
      return `${dateStr.substring(0, 2)}/${dateStr.substring(2, 4)}/20${dateStr.substring(4, 6)}`;
    } else if (format === 'YYYYMMDD') {
      return `${dateStr.substring(6, 8)}/${dateStr.substring(4, 6)}/${dateStr.substring(0, 4)}`;
    } else if (format === 'DDMMYYYY') {
      return `${dateStr.substring(0, 2)}/${dateStr.substring(2, 4)}/${dateStr.substring(4, 8)}`;
    }
  }
  
  // Match DD-MM-YYYY or YYYY-MM-DD patterns
  const datePattern = /(\d{2})[-/](\d{2})[-/](\d{4})/;
  const match = cleanBatch.match(datePattern);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }
  
  const isoPattern = /(\d{4})[-/](\d{2})[-/](\d{2})/;
  const matchIso = cleanBatch.match(isoPattern);
  if (matchIso) {
    return `${matchIso[3]}/${matchIso[2]}/${matchIso[1]}`;
  }
  
  return null;
};

const QRCodeManager = ({ userInfo, onShowNotification, products: initialProducts }) => {
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQRCodes] = useState([]);
  const [products, setProducts] = useState(initialProducts || []);
  const [batchSummary, setBatchSummary] = useState([]);
  
  // Dialog states
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  
  // Form states
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [batchNo, setBatchNo] = useState('');
  const [packageNo, setPackageNo] = useState('');
  const [packageNoPrefix, setPackageNoPrefix] = useState('');
  const [startNo, setStartNo] = useState(1);
  const [endNo, setEndNo] = useState(100);
  const [manufactureDate, setManufactureDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [selectedProduct, setSelectedProduct] = useState('');
  
  // Printer settings
  const [printerModel, setPrinterModel] = useState('Zebra ZD320');
  const [printSize, setPrintSize] = useState('medium');
  const [layout, setLayout] = useState('standard');
  const [dpi, setDpi] = useState(203);
  
  // Filter states
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState([]);
  
  const qrPreviewRef = useRef();

  const handleBatchNoChange = (val) => {
    setBatchNo(val);
    const extracted = extractDateFromBatch(val);
    if (extracted) {
      const parts = extracted.split('/');
      if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        const mfgDateString = `${year}-${month}-${day}`;
        setManufactureDate(mfgDateString);
        
        // Calculate expiry date (2 years later)
        const expYear = parseInt(year, 10) + 2;
        const expDateString = `${expYear}-${month}-${day}`;
        setExpiryDate(expDateString);
      }
    }
  };

  // Sync products from props
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch QR codes
      const qrResponse = await api.get('/qr-codes');
      setQRCodes(qrResponse.data.data || []);
      
      // Fetch batch summary
      const batchResponse = await api.get('/qr-codes/batches/summary');
      setBatchSummary(batchResponse.data);
      
      // Fetch products if not provided
      if (!initialProducts || initialProducts.length === 0) {
        const productsResponse = await api.get('/products');
        setProducts(productsResponse.data.data || []);
      }
    } catch (error) {
      onShowNotification('Error loading data: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = async () => {
    if (!selectedProducts.length || !batchNo) {
      onShowNotification('Please select products and enter batch number', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/qr-codes/generate', {
        productIds: selectedProducts,
        batchNo,
        packageNo,
        manufactureDate: manufactureDate ? new Date(manufactureDate).toISOString() : null,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        customLink,
        printerModel,
        printSettings: {
          size: printSize,
          layout,
          dpi
        }
      });

      onShowNotification(`Generated ${response.data.count} QR codes`, 'success');
      setOpenGenerateDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      onShowNotification('Error: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateBulkQRCodes = async () => {
    if (!selectedProduct || quantity < 1 || !batchNo) {
      onShowNotification('Please fill all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/qr-codes/bulk/generate', {
        productId: selectedProduct,
        quantity: parseInt(quantity),
        packageNoPrefix,
        startNo: parseInt(startNo),
        endNo: parseInt(endNo),
        batchNo,
        manufactureDate: manufactureDate ? new Date(manufactureDate).toISOString() : null,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        customLink,
        printerModel,
        printSettings: {
          size: printSize,
          layout,
          dpi
        }
      });

      onShowNotification(`Generated ${response.data.count} QR codes in bulk`, 'success');
      setOpenBulkDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      onShowNotification('Error: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsPrinted = async (qrIds) => {
    try {
      setLoading(true);
      const response = await api.put('/qr-codes/mark-printed', {
        qrIds,
        printerModel
      });

      onShowNotification(`Marked ${response.data.updated} QR codes as printed`, 'success');
      setSelectedForPrint([]);
      loadData();
    } catch (error) {
      onShowNotification('Error marking as printed: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteQRCodes = async (qrIds) => {
    if (window.confirm('Are you sure you want to delete these QR codes?')) {
      try {
        setLoading(true);
        const response = await api.delete('/qr-codes', {
          data: { qrIds }
        });

        onShowNotification(`Deleted ${response.data.deleted} QR codes`, 'success');
        loadData();
      } catch (error) {
        onShowNotification('Error deleting QR codes: ' + (error.response?.data?.error || error.message), 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadQRAsImage = async (qrCode) => {
    if (!qrCode.qrData) {
      onShowNotification('QR code image not available', 'error');
      return;
    }

    const link = document.createElement('a');
    link.href = qrCode.qrData;
    link.download = `QR_${qrCode.productNo}_${qrCode.batchNo}.png`;
    link.click();
  };

  const printQRLabels = async (qrIds) => {
    try {
      const qrsToPrint = qrCodes.filter(qr => qrIds.includes(qr._id));
      
      const printWindow = window.open('', '_blank');
      const html = generatePrintHTML(qrsToPrint);
      
      printWindow.document.write(html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
      
      onShowNotification('Print dialog opened', 'success');
    } catch (error) {
      onShowNotification('Error preparing print: ' + error.message, 'error');
    }
  };

  const generatePrintHTML = (qrs) => {
    const getSize = (size) => {
      const sizes = { 
        small: 'width: 50mm; height: 50mm;', 
        medium: 'width: 101.6mm; height: 101.6mm;', // 4x4
        large: 'width: 101.6mm; height: 152.4mm;'   // 4x6
      };
      return sizes[size] || sizes.medium;
    };

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Zebra ZD320 Print Job</title>
        <style>
          @page { size: auto; margin: 0; }
          body { margin: 0; padding: 0; background: #fff; }
          .label {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            box-sizing: border-box;
            border: 1px dashed #eee;
            padding: 5mm;
            ${getSize(printSize)}
            text-align: center;
            overflow: hidden;
          }
          .product-header { font-size: 14pt; font-weight: bold; margin-bottom: 2mm; text-transform: uppercase; }
          .qr-container { width: 60%; margin: 2mm 0; }
          .qr-container img { width: 100%; height: auto; display: block; }
          .batch-info { font-size: 10pt; margin: 1mm 0; }
          .scan-text { 
            font-weight: 900; 
            margin-top: 3mm; 
            font-size: 18pt; 
            letter-spacing: 2px;
            border-top: 2px solid #000;
            padding-top: 1mm;
            width: 80%;
          }
          @media print {
            .label { border: none; }
          }
        </style>
      </head>
      <body>
    `;

    qrs.forEach(qr => {
      const parsedDate = extractDateFromBatch(qr.batchNo);
      // If layout is compact, don't show text/details
      const showDetails = layout !== 'compact';
      const isDetailed = layout === 'detailed';

      html += `
        <div class="label">
          ${showDetails ? `<div class="product-header">${qr.productName}</div>` : ''}
          ${showDetails ? `
          <div class="batch-info">
            BATCH: <strong>${qr.batchNo}</strong><br>
            PKG: <strong>${qr.packageNo || '-'}</strong>
            ${parsedDate ? `<br>DATE: <strong>${parsedDate}</strong>` : ''}
            ${isDetailed && qr.expiryDate ? `<br>EXP: <strong>${new Date(qr.expiryDate).toLocaleDateString()}</strong>` : ''}
          </div>
          ` : ''}
          <div class="qr-container" style="${layout === 'compact' ? 'width: 80%;' : ''}">
            <img src="${qr.qrData}" alt="QR">
          </div>
          ${showDetails ? `<div class="scan-text">SCAN ME</div>` : ''}
          ${showDetails ? `<div style="font-size: 8pt; margin-top: 1mm;">Megakem Loyalty System</div>` : ''}
        </div>
      `;
    });

    html += `
      </body>
      </html>
    `;

    return html;
  };

  const resetForm = () => {
    setSelectedProducts([]);
    setSelectedProduct('');
    setBatchNo('');
    setPackageNo('');
    setManufactureDate('');
    setExpiryDate('');
    setCustomLink('');
    setQuantity(1);
  };

  const filteredQRCodes = qrCodes.filter(qr => {
    if (filterBatch && qr.batchNo !== filterBatch) return false;
    if (filterStatus && qr.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const match = (
        qr.productName?.toLowerCase().includes(query) ||
        qr.batchNo?.toLowerCase().includes(query) ||
        qr.packageNo?.toLowerCase().includes(query)
      );
      if (!match) return false;
    }
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        QR Code Management
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">Total QR Codes</Typography>
            <Typography variant="h4" color="primary">{qrCodes.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">Printed</Typography>
            <Typography variant="h4" color="success.main">
              {qrCodes.filter(q => q.status === 'printed').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">Generated</Typography>
            <Typography variant="h4" color="warning.main">
              {qrCodes.filter(q => q.status === 'generated').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">Batches</Typography>
            <Typography variant="h4" color="info.main">{batchSummary.length}</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Production Batch Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList /> Production Batch History
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Batch No</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total QRs</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Printed</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Scanned</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Last Print Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batchSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="textSecondary">No batches found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  batchSummary.map(batch => (
                    <TableRow key={batch._id} hover>
                      <TableCell>
                        <Chip label={batch._id} size="small" variant="outlined" color="primary" sx={{ fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell align="center">{batch.totalQRs}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${batch.printed}/${batch.totalQRs}`} 
                          size="small" 
                          color={batch.printed === batch.totalQRs ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell align="center">{batch.scanned}</TableCell>
                      <TableCell align="right">
                        {batch.lastPrintDate ? new Date(batch.lastPrintDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenGenerateDialog(true)}
        >
          Generate QR Codes
        </Button>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setOpenBulkDialog(true)}
        >
          Bulk Generate
        </Button>
        {selectedForPrint.length > 0 && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<Print />}
              onClick={() => markAsPrinted(selectedForPrint)}
            >
              Mark as Printed ({selectedForPrint.length})
            </Button>
            <Button
              variant="contained"
              color="info"
              startIcon={<Print />}
              onClick={() => printQRLabels(selectedForPrint)}
            >
              Print Labels
            </Button>
          </>
        )}
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Generate Dialog */}
      <Dialog open={openGenerateDialog} onClose={() => setOpenGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate QR Codes</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Batch Number"
            value={batchNo}
            onChange={(e) => handleBatchNoChange(e.target.value)}
            margin="normal"
            required
            helperText="Extracts MFG & EXP date automatically if format matches"
          />
          <TextField
            fullWidth
            label="Package Number"
            value={packageNo}
            onChange={(e) => setPackageNo(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Manufacture Date"
            type="date"
            value={manufactureDate}
            onChange={(e) => setManufactureDate(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Expiry Date"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Custom Link (Optional)"
            value={customLink}
            onChange={(e) => setCustomLink(e.target.value)}
            margin="normal"
            placeholder="https://yourdomain.com/product?id=123"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Products</InputLabel>
            <Select
              multiple
              value={selectedProducts}
              onChange={(e) => setSelectedProducts(e.target.value)}
              label="Select Products"
            >
              {products.map(product => (
                <MenuItem key={product._id} value={product._id}>
                  {product.name} ({product.productNo})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>Printer Settings</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Printer Model</InputLabel>
            <Select
              value={printerModel}
              onChange={(e) => setPrinterModel(e.target.value)}
              label="Printer Model"
            >
              <MenuItem value="Zebra ZD320">Zebra ZD320</MenuItem>
              <MenuItem value="Zebra ZD420">Zebra ZD420</MenuItem>
              <MenuItem value="Generic Thermal">Generic Thermal</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Label Size</InputLabel>
            <Select
              value={printSize}
              onChange={(e) => setPrintSize(e.target.value)}
              label="Label Size"
            >
              <MenuItem value="small">Small (3x3)</MenuItem>
              <MenuItem value="medium">Medium (4x6)</MenuItem>
              <MenuItem value="large">Large (Custom)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Layout</InputLabel>
            <Select
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              label="Layout"
            >
              <MenuItem value="standard">Standard (QR + Info)</MenuItem>
              <MenuItem value="compact">Compact (QR Only)</MenuItem>
              <MenuItem value="detailed">Detailed (QR + Details)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="DPI"
            type="number"
            value={dpi}
            onChange={(e) => setDpi(parseInt(e.target.value))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGenerateDialog(false)}>Cancel</Button>
          <Button onClick={generateQRCodes} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Generate QR Codes</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Product</InputLabel>
            <Select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              label="Select Product"
            >
              {products.map(product => (
                <MenuItem key={product._id} value={product._id}>
                  {product.name} ({product.productNo})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Batch Number"
            value={batchNo}
            onChange={(e) => handleBatchNoChange(e.target.value)}
            margin="normal"
            required
            helperText="Enter production batch number (MFG & EXP dates auto-populated)"
          />

          <TextField
            fullWidth
            label="Manufacture Date"
            type="date"
            value={manufactureDate}
            onChange={(e) => setManufactureDate(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Expiry Date"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Prefix"
                value={packageNoPrefix}
                onChange={(e) => setPackageNoPrefix(e.target.value)}
                margin="normal"
                placeholder="e.g. PKG-"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Start No"
                type="number"
                value={startNo}
                onChange={(e) => setStartNo(e.target.value)}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="End No"
                type="number"
                value={endNo}
                onChange={(e) => setEndNo(e.target.value)}
                margin="normal"
                required
              />
            </Grid>
          </Grid>

          <Typography variant="caption" color="textSecondary">
            This will generate {parseInt(endNo) - parseInt(startNo) + 1} QR codes.
          </Typography>

          <TextField
            fullWidth
            label="Custom Link"
            value={customLink}
            onChange={(e) => setCustomLink(e.target.value)}
            margin="normal"
            placeholder="https://yourdomain.com"
            helperText="Optional: Override default product scan link"
          />

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>Printer Settings</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Printer Model</InputLabel>
            <Select
              value={printerModel}
              onChange={(e) => setPrinterModel(e.target.value)}
              label="Printer Model"
            >
              <MenuItem value="Zebra ZD320">Zebra ZD320</MenuItem>
              <MenuItem value="Zebra ZD420">Zebra ZD420</MenuItem>
              <MenuItem value="Generic Thermal">Generic Thermal</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDialog(false)}>Cancel</Button>
          <Button onClick={generateBulkQRCodes} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Generate Bulk'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Codes Table */}
      <Card>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField 
              size="small"
              placeholder="Search products, batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 200, flexGrow: 1 }}
              InputProps={{
                startAdornment: <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'action.active' }}>🔍</Box>
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Batch</InputLabel>
              <Select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                label="Filter by Batch"
              >
                <MenuItem value="">All Batches</MenuItem>
                {batchSummary.map(batch => (
                  <MenuItem key={batch._id} value={batch._id}>
                    {batch._id} ({batch.totalQRs} QRs)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="generated">Generated</MenuItem>
                <MenuItem value="printed">Printed</MenuItem>
                <MenuItem value="scanned">Scanned</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedForPrint.length === filteredQRCodes.length && filteredQRCodes.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForPrint(filteredQRCodes.map(q => q._id));
                        } else {
                          setSelectedForPrint([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell><strong>Product</strong></TableCell>
                  <TableCell><strong>Batch No</strong></TableCell>
                  <TableCell><strong>Package</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Printed</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQRCodes.map(qr => (
                  <TableRow key={qr._id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedForPrint.includes(qr._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedForPrint([...selectedForPrint, qr._id]);
                          } else {
                            setSelectedForPrint(selectedForPrint.filter(id => id !== qr._id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{qr.productName}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{qr.batchNo}</Typography>
                        {(qr.manufactureDate || extractDateFromBatch(qr.batchNo)) && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Date: {qr.manufactureDate ? new Date(qr.manufactureDate).toLocaleDateString() : extractDateFromBatch(qr.batchNo)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{qr.packageNo || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={qr.status}
                        size="small"
                        color={qr.status === 'printed' ? 'success' : 'default'}
                        variant={qr.status === 'scanned' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{qr.printedDate ? new Date(qr.printedDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() => downloadQRAsImage(qr)}
                          color="primary"
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => deleteQRCodes([qr._id])}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredQRCodes.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No QR codes found. Start by generating new QR codes.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Batch Summary */}
      {batchSummary.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Batch Summary</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Batch No</strong></TableCell>
                    <TableCell align="center"><strong>Total</strong></TableCell>
                    <TableCell align="center"><strong>Printed</strong></TableCell>
                    <TableCell align="center"><strong>Scanned</strong></TableCell>
                    <TableCell><strong>Last Print</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchSummary.map(batch => (
                    <TableRow key={batch._id}>
                      <TableCell><strong>{batch._id}</strong></TableCell>
                      <TableCell align="center">{batch.totalQRs}</TableCell>
                      <TableCell align="center">{batch.printed}</TableCell>
                      <TableCell align="center">{batch.scanned}</TableCell>
                      <TableCell>
                        {batch.lastPrintDate ? new Date(batch.lastPrintDate).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default QRCodeManager;
