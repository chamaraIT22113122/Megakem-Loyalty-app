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
  TablePagination,
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
  LinearProgress,
  Tab,
  Tabs,
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
import api, { qrCodesAPI } from '../services/api';

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

  // Advanced Print Settings Dialog States
  const [openPrintConfigDialog, setOpenPrintConfigDialog] = useState(false);
  const [printLayoutMode, setPrintLayoutMode] = useState('grid'); // 'roll' or 'grid'
  const [printPaperSize, setPrintPaperSize] = useState('a4'); // 'a4', 'letter', 'medium', 'small', 'custom'
  const [customPaperWidth, setCustomPaperWidth] = useState(210); // mm
  const [customPaperHeight, setCustomPaperHeight] = useState(297); // mm
  const [printMarginTop, setPrintMarginTop] = useState(10); // mm
  const [printMarginBottom, setPrintMarginBottom] = useState(10); // mm
  const [printMarginLeft, setPrintMarginLeft] = useState(10); // mm
  const [printMarginRight, setPrintMarginRight] = useState(10); // mm
  const [printQRSize, setPrintQRSize] = useState(25); // mm
  const [printColumns, setPrintColumns] = useState(3);
  const [printRows, setPrintRows] = useState(7);
  const [printGap, setPrintGap] = useState(4); // mm
  const [printLabelPadding, setPrintLabelPadding] = useState(2); // mm
  // Label content is fixed: QR → BATCH → MFG DATE → EXP DATE → SCAN ME → (MWTC MEMBERS ONLY)

  useEffect(() => {
    if (printPaperSize === 'a4') {
      setPrintLayoutMode('grid');
      setCustomPaperWidth(210);
      setCustomPaperHeight(297);
      setPrintColumns(3);
      setPrintRows(7);
      setPrintMarginTop(10);
      setPrintMarginBottom(10);
      setPrintMarginLeft(10);
      setPrintMarginRight(10);
      setPrintQRSize(25);
      setPrintGap(4);
      setPrintLabelPadding(2);
    } else if (printPaperSize === 'letter') {
      setPrintLayoutMode('grid');
      setCustomPaperWidth(215.9);
      setCustomPaperHeight(279.4);
      setPrintColumns(3);
      setPrintRows(6);
      setPrintMarginTop(10);
      setPrintMarginBottom(10);
      setPrintMarginLeft(10);
      setPrintMarginRight(10);
      setPrintQRSize(28);
      setPrintGap(4);
      setPrintLabelPadding(2);
    } else if (printPaperSize === 'medium') {
      setPrintLayoutMode('roll');
      setCustomPaperWidth(101.6);
      setCustomPaperHeight(152.4);
      setPrintColumns(1);
      setPrintRows(1);
      setPrintMarginTop(5);
      setPrintMarginBottom(5);
      setPrintMarginLeft(5);
      setPrintMarginRight(5);
      setPrintQRSize(50);
      setPrintGap(0);
      setPrintLabelPadding(4);
    } else if (printPaperSize === 'small') {
      setPrintLayoutMode('roll');
      setCustomPaperWidth(76.2);
      setCustomPaperHeight(76.2);
      setPrintColumns(1);
      setPrintRows(1);
      setPrintMarginTop(3);
      setPrintMarginBottom(3);
      setPrintMarginLeft(3);
      setPrintMarginRight(3);
      setPrintQRSize(40);
      setPrintGap(0);
      setPrintLabelPadding(3);
    }
  }, [printPaperSize]);

  const renderLivePreview = () => {
    const paperW = printPaperSize === 'custom' ? customPaperWidth : (printPaperSize === 'a4' ? 210 : (printPaperSize === 'letter' ? 215.9 : (printPaperSize === 'medium' ? 101.6 : 76.2)));
    const paperH = printPaperSize === 'custom' ? customPaperHeight : (printPaperSize === 'a4' ? 297 : (printPaperSize === 'letter' ? 279.4 : (printPaperSize === 'medium' ? 152.4 : 76.2)));
    
    const aspect = paperH / paperW;
    const pWidth = 260; // preview container width in px
    const pHeight = pWidth * aspect;
    const scale = pWidth / paperW; // multiplier to scale mm to px

    const cols = printLayoutMode === 'roll' ? 1 : printColumns;
    const rows = printLayoutMode === 'roll' ? 1 : printRows;
    const qrsToShow = Math.min(cols * rows, selectedForPrint.length > 0 ? selectedForPrint.length : 1);
    
    // Build dummy items for preview
    const previewItems = [];
    const dummyQR = qrCodes.find(qr => selectedForPrint.includes(qr._id)) || qrCodes[0] || {
      productName: 'Ecolastic 32 Kg Set',
      productNo: 'MKL39',
      batchNo: 'MKL39 001 050525 020',
      packageNo: '020',
      qrData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1NDgoAAAACXBIWXMAAAsTAAALEwEAmpwYAAAET0lEQVR4Xu3VMQ0AMADAsIG/583gQY9cEMmqugIe1mYJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBQkKUZCgEAUJClGQoBAFCQpRkKAQBfcWnJ0Z2a9XsgAAAABJRU5ErkJggg=='
    };

    for (let i = 0; i < qrsToShow; i++) {
      previewItems.push(dummyQR);
    }

    return (
      <Box 
        sx={{ 
          width: `${pWidth}px`, 
          height: `${pHeight}px`, 
          border: '2px dashed #003366', 
          borderRadius: '4px',
          backgroundColor: '#fff',
          position: 'relative',
          padding: `${printMarginTop * scale}px ${printMarginRight * scale}px ${printMarginBottom * scale}px ${printMarginLeft * scale}px`,
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: `${printGap * scale}px`,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          mx: 'auto'
        }}
      >
        {previewItems.map((item, idx) => (
          <Box 
            key={idx}
            sx={{
              border: '1px dotted #aaa',
              padding: `${printLabelPadding * scale}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxSizing: 'border-box',
              height: '100%',
              backgroundColor: '#fafafa'
            }}
          >

            <Box 
              sx={{ 
                width: `${printQRSize * scale}px`, 
                height: `${printQRSize * scale}px`,
                backgroundColor: '#eee',
                border: '1px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img 
                src={item.qrData} 
                alt="QR Preview" 
                style={{ width: '100%', height: '100%' }} 
              />
            </Box>
            <Box sx={{ width: '100%', textAlign: 'center', mt: 0.5 }}>
              <Typography sx={{ fontSize: `${Math.max(3.5, 6 * scale * 0.35)}px`, lineHeight: 1 }}>
                BATCH: {item.batchNo.substring(0, 18)}
              </Typography>
              <Typography sx={{ fontSize: `${Math.max(3.5, 5 * scale * 0.35)}px`, lineHeight: 1 }}>
                MFG DATE: –
              </Typography>
              <Typography sx={{ fontSize: `${Math.max(3.5, 5 * scale * 0.35)}px`, lineHeight: 1 }}>
                EXP DATE: –
              </Typography>
            </Box>
            <Typography 
              sx={{ 
                fontSize: `${Math.max(4, 9 * scale * 0.35)}px`, 
                fontWeight: 'bold', 
                letterSpacing: '0.5px',
                borderTop: '1px solid #000',
                pt: 0.1,
                width: '80%',
                textAlign: 'center',
                mt: 0.5,
                lineHeight: 1
              }}
            >
              SCAN ME
            </Typography>
            <Typography 
              sx={{ 
                fontSize: `${Math.max(3, 5 * scale * 0.35)}px`, 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 0.1,
                lineHeight: 1
              }}
            >
              (MWTC MEMBERS ONLY)
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };
  
  // Filter states
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState([]);
  
  // Upgrade 5: Tab and Scan Logs state
  const [activeTab, setActiveTab] = useState(0);
  const [scanLogs, setScanLogs] = useState([]);
  const [scanLogsLoading, setScanLogsLoading] = useState(false);
  const [scanLogFilter, setScanLogFilter] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  const qrPreviewRef = useRef();

  // Upgrade 2: Generate ZPL commands for Zebra thermal printers
  const generateZPL = (qrIds) => {
    const qrsToPrint = qrCodes.filter(qr => qrIds.includes(qr._id));
    if (qrsToPrint.length === 0) return;

    const getFormattedDate = (dateVal) => {
      if (!dateVal) return null;
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB');
      return String(dateVal);
    };

    let zpl = '';
    qrsToPrint.forEach(qr => {
      const mfgDate = qr.manufactureDate
        ? getFormattedDate(qr.manufactureDate)
        : extractDateFromBatch(qr.batchNo) || 'N/A';

      let expDate = qr.expiryDate ? getFormattedDate(qr.expiryDate) : null;
      if (!expDate && mfgDate && mfgDate !== 'N/A') {
        const parts = mfgDate.split('/');
        if (parts.length === 3) expDate = `${parts[0]}/${parts[1]}/${parseInt(parts[2]) + 2}`;
      }

      zpl += `^XA\n`;
      zpl += `^FO30,25^ADN,28,15^FD${(qr.productName || '').substring(0, 28).toUpperCase()}^FS\n`;
      zpl += `^FO30,65^ADN,20,10^FDBatch: ${(qr.batchNo || '').substring(0, 30)}^FS\n`;
      zpl += `^FO30,92^ADN,20,10^FDPkg: ${qr.packageNo || 'N/A'}^FS\n`;
      if (mfgDate && mfgDate !== 'N/A') {
        zpl += `^FO30,119^ADN,18,9^FDMFG: ${mfgDate}^FS\n`;
      }
      if (expDate) {
        zpl += `^FO30,143^ADN,18,9^FDEXP: ${expDate}^FS\n`;
      }
      // QR code module (BQ = QR code, N=normal, 2=model 2, 6=magnification factor)
      zpl += `^FO190,30^BQN,2,5^FDQA,${qr.qrLink || ''}^FS\n`;
      zpl += `^FO30,175^ADN,16,8^FDMegakem Loyalty System^FS\n`;
      zpl += `^XZ\n`;
    });

    const blob = new Blob([zpl], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `megakem_labels_${new Date().toISOString().split('T')[0]}.zpl`;
    link.click();
    URL.revokeObjectURL(link.href);
    onShowNotification(`Downloaded ZPL file for ${qrsToPrint.length} label(s)`, 'success');
  };

  // CSV export helper
  const exportCSV = (rows, filename) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Upgrade 5: Load scan logs
  const loadScanLogs = async () => {
    try {
      setScanLogsLoading(true);
      const params = {};
      if (scanLogFilter) params.eventType = scanLogFilter;
      const response = await qrCodesAPI.getScanLogs(params);
      setScanLogs(response.data.data || []);
    } catch (error) {
      onShowNotification('Error loading scan logs: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setScanLogsLoading(false);
    }
  };

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
    const paperW = printPaperSize === 'custom' ? customPaperWidth : (printPaperSize === 'a4' ? 210 : (printPaperSize === 'letter' ? 215.9 : (printPaperSize === 'medium' ? 101.6 : 76.2)));
    const paperH = printPaperSize === 'custom' ? customPaperHeight : (printPaperSize === 'a4' ? 297 : (printPaperSize === 'letter' ? 279.4 : (printPaperSize === 'medium' ? 152.4 : 76.2)));
    
    const cols = printLayoutMode === 'roll' ? 1 : printColumns;
    const rows = printLayoutMode === 'roll' ? 1 : printRows;
    const itemsPerPage = cols * rows;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Megakem Print Job</title>
        <style>
          @page { 
            size: ${paperW}mm ${paperH}mm; 
            margin: 0; 
          }
          body { 
            margin: 0; 
            padding: 0; 
            background: #fff; 
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact;
          }
          .page {
            box-sizing: border-box;
            width: ${paperW}mm;
            height: ${paperH}mm;
            padding: ${printMarginTop}mm ${printMarginRight}mm ${printMarginBottom}mm ${printMarginLeft}mm;
            page-break-after: always;
            display: grid;
            grid-template-columns: repeat(${cols}, 1fr);
            grid-template-rows: repeat(${rows}, 1fr);
            gap: ${printGap}mm;
            overflow: hidden;
          }
          .label {
            box-sizing: border-box;
            border: 1px dashed #ccc;
            padding: ${printLabelPadding}mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            overflow: hidden;
            background: #fff;
          }
          .product-header { 
            font-size: 8pt; 
            font-weight: bold; 
            margin-bottom: 1mm; 
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          .qr-container { 
            width: ${printQRSize}mm; 
            height: ${printQRSize}mm;
            margin: 1mm 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-container img { 
            width: 100%; 
            height: 100%; 
            display: block; 
          }
          .batch-info { 
            font-size: 6.5pt; 
            margin: 0.5mm 0;
            line-height: 1.2;
            width: 100%;
            overflow: hidden;
          }
          .scan-text { 
            font-weight: bold; 
            margin-top: 1mm; 
            font-size: 10pt; 
            letter-spacing: 1px;
            border-top: 1px solid #000;
            padding-top: 0.5mm;
            width: 80%;
          }
          @media print {
            .label { border: none; }
          }
        </style>
      </head>
      <body>
    `;

    const getFormattedDate = (dateVal) => {
      if (!dateVal) return null;
      if (dateVal instanceof Date) {
        return dateVal.toLocaleDateString();
      }
      const dateStr = String(dateVal);
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        return dateStr;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString();
      }
      return dateStr;
    };

    for (let i = 0; i < qrs.length; i += itemsPerPage) {
      const pageQRs = qrs.slice(i, i + itemsPerPage);
      html += `<div class="page">`;
      
      pageQRs.forEach(qr => {
        const mfgDateToShow = qr.manufactureDate 
          ? getFormattedDate(qr.manufactureDate) 
          : extractDateFromBatch(qr.batchNo);
          
        let expDateToShow = qr.expiryDate ? getFormattedDate(qr.expiryDate) : null;
        if (!expDateToShow && mfgDateToShow) {
          const parts = mfgDateToShow.split('/');
          if (parts.length === 3) {
            const day = parts[0];
            const month = parts[1];
            const year = parseInt(parts[2], 10);
            expDateToShow = `${day}/${month}/${year + 2}`;
          } else {
            const d = new Date(mfgDateToShow);
            if (!isNaN(d.getTime())) {
              d.setFullYear(d.getFullYear() + 2);
              expDateToShow = d.toLocaleDateString();
            }
          }
        }

        html += `
          <div class="label">
            <div class="qr-container">
              <img src="${qr.qrData}" alt="QR">
            </div>
            <div class="batch-info">
              BATCH: <strong>${qr.batchNo}</strong><br>
              ${mfgDateToShow ? `MFG DATE: <strong>${mfgDateToShow}</strong><br>` : ''}
              ${expDateToShow ? `EXP DATE: <strong>${expDateToShow}</strong>` : ''}
            </div>
            <div class="scan-text">SCAN ME</div>
            <div style="font-size: 6.5pt; margin-top: 0.5mm; text-align: center; width: 100%;">(MWTC MEMBERS ONLY)</div>
          </div>
        `;
      });

      if (printLayoutMode === 'grid') {
        const filledSlots = pageQRs.length;
        const emptySlots = itemsPerPage - filledSlots;
        for (let s = 0; s < emptySlots; s++) {
          html += `<div class="label" style="border: none; opacity: 0;"><div style="width: ${printQRSize}mm; height: ${printQRSize}mm;"></div></div>`;
        }
      }

      html += `</div>`;
    }

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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={batch._id} size="small" variant="outlined" color="primary" sx={{ fontWeight: 'bold' }} />
                          {/* Upgrade 5: Expiry badge */}
                          {batch.isExpired && (
                            <Chip label="⚠️ Expired" size="small" color="error" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{batch.totalQRs}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${batch.printed}/${batch.totalQRs}`} 
                          size="small" 
                          color={batch.printed === batch.totalQRs ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {/* Upgrade 5: Scan rate with progress bar */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={batch.scanRate || 0}
                              sx={{ height: 6, borderRadius: 3,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': { bgcolor: batch.scanRate >= 80 ? 'success.main' : batch.scanRate >= 40 ? 'warning.main' : 'info.main' }
                              }}
                            />
                          </Box>
                          <Typography variant="caption" fontWeight="bold" sx={{ minWidth: 32, textAlign: 'right' }}>
                            {batch.scanned}
                          </Typography>
                        </Box>
                      </TableCell>
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
              onClick={() => setOpenPrintConfigDialog(true)}
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

      {/* Advanced Print Config Dialog */}
      <Dialog 
        open={openPrintConfigDialog} 
        onClose={() => setOpenPrintConfigDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)', color: 'white' }}>
          Sticker & Print Settings
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 3, fontWeight: 'bold' }}>
            Printer Alignment Guide: In the browser print pop-up, set "Margins" to "None" and uncheck "Headers and footers" (found in "More settings") to align sticker sheets perfectly.
          </Alert>
          <Grid container spacing={3}>
            {/* Left Column: Form Controls */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                Layout Options
              </Typography>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Layout Mode</InputLabel>
                <Select
                  value={printLayoutMode}
                  onChange={(e) => setPrintLayoutMode(e.target.value)}
                  label="Layout Mode"
                >
                  <MenuItem value="roll">Roll / Thermal (Single Label)</MenuItem>
                  <MenuItem value="grid">Sheet / Grid (Stickers on Page)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Paper / Sheet Size Preset</InputLabel>
                <Select
                  value={printPaperSize}
                  onChange={(e) => setPrintPaperSize(e.target.value)}
                  label="Paper / Sheet Size Preset"
                >
                  <MenuItem value="medium">4" x 6" Roll Label</MenuItem>
                  <MenuItem value="small">3" x 3" Roll Label</MenuItem>
                  <MenuItem value="a4">A4 Sheet (Sticker Grid)</MenuItem>
                  <MenuItem value="letter">Letter Sheet (Sticker Grid)</MenuItem>
                  <MenuItem value="custom">Custom Dimensions (mm)</MenuItem>
                </Select>
              </FormControl>

              {printPaperSize === 'custom' && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Paper Width (mm)"
                      type="number"
                      value={customPaperWidth}
                      onChange={(e) => setCustomPaperWidth(parseFloat(e.target.value) || 0)}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Paper Height (mm)"
                      type="number"
                      value={customPaperHeight}
                      onChange={(e) => setCustomPaperHeight(parseFloat(e.target.value) || 0)}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              )}

              {printLayoutMode === 'grid' && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Grid Columns"
                      type="number"
                      value={printColumns}
                      onChange={(e) => setPrintColumns(parseInt(e.target.value) || 1)}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Grid Rows"
                      type="number"
                      value={printRows}
                      onChange={(e) => setPrintRows(parseInt(e.target.value) || 1)}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              )}

              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }} gutterBottom color="primary">
                Sizing & Spacing (mm)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="QR Code Size"
                    type="number"
                    value={printQRSize}
                    onChange={(e) => setPrintQRSize(parseFloat(e.target.value) || 0)}
                    margin="none"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label Padding"
                    type="number"
                    value={printLabelPadding}
                    onChange={(e) => setPrintLabelPadding(parseFloat(e.target.value) || 0)}
                    margin="none"
                  />
                </Grid>
                {printLayoutMode === 'grid' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Gap between stickers"
                      type="number"
                      value={printGap}
                      onChange={(e) => setPrintGap(parseFloat(e.target.value) || 0)}
                      margin="none"
                    />
                  </Grid>
                )}
              </Grid>

              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }} gutterBottom color="primary">
                Page Margins (mm)
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Top"
                    type="number"
                    value={printMarginTop}
                    onChange={(e) => setPrintMarginTop(parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bottom"
                    type="number"
                    value={printMarginBottom}
                    onChange={(e) => setPrintMarginBottom(parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Left"
                    type="number"
                    value={printMarginLeft}
                    onChange={(e) => setPrintMarginLeft(parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Right"
                    type="number"
                    value={printMarginRight}
                    onChange={(e) => setPrintMarginRight(parseFloat(e.target.value) || 0)}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }} gutterBottom color="primary">
                Fixed Label Format
              </Typography>
              <Box sx={{ pl: 1 }}>
                <Typography variant="body2" color="text.secondary">✅ QR Code</Typography>
                <Typography variant="body2" color="text.secondary">✅ Batch Number</Typography>
                <Typography variant="body2" color="text.secondary">✅ MFG Date</Typography>
                <Typography variant="body2" color="text.secondary">✅ Expiry Date</Typography>
                <Typography variant="body2" color="text.secondary">✅ SCAN ME</Typography>
                <Typography variant="body2" color="text.secondary">✅ (MWTC MEMBERS ONLY)</Typography>
              </Box>
            </Grid>

            {/* Right Column: Live Layout Preview */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: { md: '1px solid #eee' }, pl: { md: 3 } }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary" sx={{ alignSelf: 'flex-start' }}>
                Live Layout Preview
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mb: 2, alignSelf: 'flex-start' }}>
                Displays relative sizes & placement of margins, stickers, and QR modules.
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#f0f4f8', borderRadius: 2, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                {renderLivePreview()}
              </Box>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }} color="textSecondary">
                Paper Aspect: {printPaperSize === 'custom' ? `${customPaperWidth} x ${customPaperHeight}` : (printPaperSize === 'a4' ? 'A4 (210 x 297)' : (printPaperSize === 'letter' ? 'Letter (215.9 x 279.4)' : (printPaperSize === 'medium' ? 'Roll (101.6 x 152.4)' : 'Roll (76.2 x 76.2)')))} mm
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setOpenPrintConfigDialog(false)} variant="outlined">
            Cancel
          </Button>
          {/* Upgrade 2: Download ZPL for native Zebra thermal printing */}
          <Button
            onClick={() => {
              setOpenPrintConfigDialog(false);
              generateZPL(selectedForPrint);
            }}
            variant="outlined"
            color="secondary"
            startIcon={<Download />}
          >
            Download ZPL (Zebra Native)
          </Button>
          <Button 
            onClick={() => {
              setOpenPrintConfigDialog(false);
              printQRLabels(selectedForPrint);
            }} 
            variant="contained" 
            startIcon={<Print />}
            color="primary"
          >
            Start Printing
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
                {filteredQRCodes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(qr => (
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

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredQRCodes.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* Upgrade 5: Scan Logs Tab Panel */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, v) => { setActiveTab(v); if (v === 1) loadScanLogs(); }}>
              <Tab label="Batch Summary" />
              <Tab label={`🔍 Scan Attempt Logs`} />
            </Tabs>
          </Box>

          {/* Tab 0: Batch Summary (existing) */}
          {activeTab === 0 && batchSummary.length > 0 && (
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
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <strong>{batch._id}</strong>
                          {batch.isExpired && <Chip label="Expired" size="small" color="error" />}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{batch.totalQRs}</TableCell>
                      <TableCell align="center">{batch.printed}</TableCell>
                      <TableCell align="center">{batch.scanned}</TableCell>
                      <TableCell>{batch.lastPrintDate ? new Date(batch.lastPrintDate).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Tab 1: Scan Attempt Logs */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 180 }} size="small">
                  <InputLabel>Filter by Event</InputLabel>
                  <Select
                    value={scanLogFilter}
                    onChange={(e) => setScanLogFilter(e.target.value)}
                    label="Filter by Event"
                  >
                    <MenuItem value="">All Events</MenuItem>
                    <MenuItem value="success">✅ Success</MenuItem>
                    <MenuItem value="duplicate">🔁 Duplicate</MenuItem>
                    <MenuItem value="invalid_sig">🚨 Counterfeit / Invalid Sig</MenuItem>
                    <MenuItem value="product_not_found">❓ Product Not Found</MenuItem>
                    <MenuItem value="legacy">📜 Legacy (Unsigned)</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined" startIcon={<Refresh />} onClick={loadScanLogs} disabled={scanLogsLoading}>
                  {scanLogsLoading ? <CircularProgress size={20} /> : 'Refresh'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => exportCSV(scanLogs.map(l => ({
                    'Timestamp': new Date(l.timestamp).toLocaleString(),
                    'Event': l.eventType,
                    'Product': l.productNo || '',
                    'Batch': l.batchNo || '',
                    'Package': l.packageNo || '',
                    'Member': l.memberId || '',
                    'Role': l.role || '',
                    'Signature': l.signature,
                    'City': l.city || '',
                    'IP': l.ipAddress || ''
                  })), 'scan_logs')}
                  disabled={!scanLogs.length}
                >
                  Export CSV
                </Button>
              </Box>

              {scanLogsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Time</strong></TableCell>
                        <TableCell><strong>Event</strong></TableCell>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell><strong>Batch</strong></TableCell>
                        <TableCell><strong>Member</strong></TableCell>
                        <TableCell><strong>Sig</strong></TableCell>
                        <TableCell><strong>City</strong></TableCell>
                        <TableCell><strong>IP</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scanLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                            <Typography color="textSecondary">No scan logs yet. Click Refresh to load.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        scanLogs.map((log, idx) => {
                          const rowColor = log.eventType === 'success' ? 'rgba(76,175,80,0.06)'
                            : log.eventType === 'invalid_sig' ? 'rgba(244,67,54,0.08)'
                            : log.eventType === 'duplicate' ? 'rgba(255,152,0,0.07)'
                            : 'transparent';
                          const eventChip = log.eventType === 'success' ? <Chip label="✅ Success" size="small" color="success" />
                            : log.eventType === 'invalid_sig' ? <Chip label="🚨 Counterfeit" size="small" color="error" />
                            : log.eventType === 'duplicate' ? <Chip label="🔁 Duplicate" size="small" color="warning" />
                            : log.eventType === 'legacy' ? <Chip label="📜 Legacy" size="small" />
                            : <Chip label={log.eventType} size="small" />;
                          return (
                            <TableRow key={log._id || idx} sx={{ bgcolor: rowColor }}>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                                {new Date(log.timestamp).toLocaleString()}
                              </TableCell>
                              <TableCell>{eventChip}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{log.productNo || '-'}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.batchNo || '-'}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{log.memberId || '-'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={log.signature}
                                  size="small"
                                  color={log.signature === 'valid' ? 'success' : log.signature === 'invalid' ? 'error' : 'default'}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{log.city || '-'}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{log.ipAddress || '-'}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default QRCodeManager;
