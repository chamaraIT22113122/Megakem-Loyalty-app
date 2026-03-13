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

const QRCodeManager = ({ userInfo, onShowNotification }) => {
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQRCodes] = useState([]);
  const [products, setProducts] = useState([]);
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
  const [manufactureDate, setManufactureDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState('');
  
  // Printer settings
  const [printerModel, setPrinterModel] = useState('Zebra ZD320');
  const [printSize, setPrintSize] = useState('medium');
  const [layout, setLayout] = useState('standard');
  const [dpi, setDpi] = useState(203);
  
  // Filter states
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState([]);
  
  const qrPreviewRef = useRef();

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch QR codes
      const qrResponse = await fetch('/api/qr-codes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (qrResponse.ok) {
        const data = await qrResponse.json();
        setQRCodes(data.data || []);
      }
      
      // Fetch batch summary
      const batchResponse = await fetch('/api/qr-codes/batches/summary', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (batchResponse.ok) {
        setBatchSummary(await batchResponse.json());
      }
      
      // Fetch products
      const productsResponse = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (productsResponse.ok) {
        const data = await productsResponse.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      onShowNotification('Error loading data: ' + error.message, 'error');
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
      const response = await fetch('/api/qr-codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
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
        })
      });

      if (response.ok) {
        const data = await response.json();
        onShowNotification(`Generated ${data.count} QR codes`, 'success');
        setOpenGenerateDialog(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        onShowNotification(error.error || 'Failed to generate QR codes', 'error');
      }
    } catch (error) {
      onShowNotification('Error: ' + error.message, 'error');
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
      const response = await fetch('/api/qr-codes/bulk/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: selectedProduct,
          quantity: parseInt(quantity),
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
        })
      });

      if (response.ok) {
        const data = await response.json();
        onShowNotification(`Generated ${data.count} QR codes in bulk`, 'success');
        setOpenBulkDialog(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        onShowNotification(error.error || 'Failed to generate QR codes', 'error');
      }
    } catch (error) {
      onShowNotification('Error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsPrinted = async (qrIds) => {
    try {
      setLoading(true);
      const response = await fetch('/api/qr-codes/mark-printed', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          qrIds,
          printerModel
        })
      });

      if (response.ok) {
        const data = await response.json();
        onShowNotification(`Marked ${data.updated} QR codes as printed`, 'success');
        setSelectedForPrint([]);
        loadData();
      }
    } catch (error) {
      onShowNotification('Error marking as printed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteQRCodes = async (qrIds) => {
    if (window.confirm('Are you sure you want to delete these QR codes?')) {
      try {
        setLoading(true);
        const response = await fetch('/api/qr-codes', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ qrIds })
        });

        if (response.ok) {
          const data = await response.json();
          onShowNotification(`Deleted ${data.deleted} QR codes`, 'success');
          loadData();
        }
      } catch (error) {
        onShowNotification('Error deleting QR codes: ' + error.message, 'error');
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
      const sizes = { small: '3x3', medium: '4x6', large: '4x6' };
      return sizes[size] || '4x6';
    };

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code Labels</title>
        <style>
          body { margin: 0; padding: 10mm; font-family: Arial, sans-serif; }
          .label {
            display: inline-block;
            page-break-inside: avoid;
            margin: 5mm;
            padding: 10mm;
            border: 1px solid #ccc;
            text-align: center;
            ${getSize(printSize) === '3x3' ? 'width: 75mm; height: 75mm;' : 'width: 101.6mm; height: 152.4mm;'}
          }
          .qr-container { margin: 10px 0; }
          .qr-container img { max-width: 100%; height: auto; }
          .product-info { font-size: 10px; margin: 5px 0; }
          .scan-text { font-weight: bold; margin-top: 10px; font-size: 14px; }
          @media print {
            body { margin: 0; padding: 0; }
            .label { margin: 0; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
    `;

    qrs.forEach(qr => {
      html += `
        <div class="label">
          <div class="product-info">
            <strong>${qr.productName}</strong><br>
            Batch: ${qr.batchNo}<br>
            ${qr.packageNo ? `Package: ${qr.packageNo}<br>` : ''}
          </div>
          <div class="qr-container">
            <img src="${qr.qrData}" alt="QR Code">
          </div>
          <div class="scan-text">SCAN ME</div>
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
            onChange={(e) => setBatchNo(e.target.value)}
            margin="normal"
            required
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
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            margin="normal"
            inputProps={{ min: 1, max: 1000 }}
          />

          <TextField
            fullWidth
            label="Batch Number"
            value={batchNo}
            onChange={(e) => setBatchNo(e.target.value)}
            margin="normal"
            required
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
            label="Custom Link"
            value={customLink}
            onChange={(e) => setCustomLink(e.target.value)}
            margin="normal"
            placeholder="https://yourdomain.com/product?id=123"
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
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
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
                    <TableCell>{qr.batchNo}</TableCell>
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
