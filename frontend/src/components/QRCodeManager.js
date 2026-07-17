/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, no-loop-func */
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
  Close,
  Save,
  Lock,
  Search,
  Settings
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api, { qrCodesAPI } from '../services/api';

const formatPerfectTime = (dateString, fallback = '-') => {
  if (!dateString) return fallback;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return fallback;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

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
  const isMainAdmin = userInfo && (userInfo.email === 'admin@megakem.com' || (userInfo.role === 'admin' && !userInfo.permissions));

  const hasPermission = (permission) => {
    if (isMainAdmin) return true;
    if (userInfo && userInfo.permissions) {
      return userInfo.permissions[permission] === true;
    }
    return false;
  };

  const getProductPrice = (qr) => {
    if (!qr || !products || products.length === 0) return 0;
    const prodId = qr.product?._id || qr.product;
    if (prodId) {
      const product = products.find(p => p._id === prodId);
      if (product) return product.price || 0;
    }
    const product = products.find(p => 
      p.productNo && qr.productNo && p.productNo.toUpperCase() === qr.productNo.toUpperCase()
    );
    return product ? (product.price || 0) : 0;
  };

  const getProductDetails = (qr) => {
    if (!qr || !products || products.length === 0) return null;
    const prodId = qr.product?._id || qr.product;
    if (prodId) {
      const product = products.find(p => p._id === prodId);
      if (product) return product;
    }
    const product = products.find(p => 
      p.productNo && qr.productNo && p.productNo.toUpperCase() === qr.productNo.toUpperCase()
    );
    return product || null;
  };

  const [loading, setLoading] = useState(false);
  const [qrCodes, setQRCodes] = useState([]);
  const [totalQRCodes, setTotalQRCodes] = useState(0);
  const [products, setProducts] = useState(initialProducts || []);
  const [batchSummary, setBatchSummary] = useState([]);
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  
  // Dialog states
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [confirmBulkDialogOpen, setConfirmBulkDialogOpen] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [openEditBatchDialog, setOpenEditBatchDialog] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [bulkDeleteBatchNo, setBulkDeleteBatchNo] = useState('');
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  
  // Reprint request states
  const [reprintRequests, setReprintRequests] = useState([]);
  const [openReprintDialog, setOpenReprintDialog] = useState(false);
  const [selectedQRForReprint, setSelectedQRForReprint] = useState(null);
  const [selectedQRIdsForReprint, setSelectedQRIdsForReprint] = useState([]);
  const [reprintReason, setReprintReason] = useState('');
  
  // Form states
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [batchNo, setBatchNo] = useState('');
  const [packageNo, setPackageNo] = useState('');
  const [packageNoPrefix, setPackageNoPrefix] = useState('');
  const [startNo, setStartNo] = useState(1);
  const [endNo, setEndNo] = useState(100);
  const [manufactureDate, setManufactureDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
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
  const [printTarget, setPrintTarget] = useState('loyalty');
  const [printFontSizeBatch, setPrintFontSizeBatch] = useState(6.5);
  const [printFontSizeDesc, setPrintFontSizeDesc] = useState(7);
  const [printFontSizeMrp, setPrintFontSizeMrp] = useState(8.5);
  // Label content is fixed: QR → BATCH → MFG DATE → EXP DATE → BLACK AREA → MRP

  const handlePaperSizeChange = (val) => {
    setPrintPaperSize(val);
    if (val === 'a4') {
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
    } else if (val === 'letter') {
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
    } else if (val === 'medium') {
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
    } else if (val === 'small') {
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
  };

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

            {printTarget === 'loyalty' && (
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
            )}
            <Box sx={{ width: '100%', textAlign: 'center', mt: 0.5 }}>
              <Typography sx={{ fontSize: `${Math.max(3.5, printFontSizeBatch * scale * 0.35)}px`, lineHeight: 1 }}>
                BATCH: {item.batchNo.substring(0, 18)}
              </Typography>
              <Typography sx={{ fontSize: `${Math.max(3.5, (printFontSizeBatch - 1) * scale * 0.35)}px`, lineHeight: 1 }}>
                MFG DATE: –
              </Typography>
              <Typography sx={{ fontSize: `${Math.max(3.5, (printFontSizeBatch - 1) * scale * 0.35)}px`, lineHeight: 1 }}>
                EXP DATE: –
              </Typography>
            </Box>
            <Typography 
              sx={{ 
                fontSize: `${Math.max(3.5, printFontSizeDesc * scale * 0.35)}px`, 
                lineHeight: 1,
                fontWeight: 'bold',
                textAlign: 'center',
                textTransform: 'uppercase',
                mt: 0.5,
                height: `${Math.max(3.5, printFontSizeDesc * scale * 0.35)}px`
              }}
            >
              {item.description || ' '}
            </Typography>
            <Box 
              sx={{ 
                width: '80%', 
                height: '1px', 
                backgroundColor: '#000', 
                mt: 0.5,
                mb: 0.5
              }} 
            />
            <Typography 
              sx={{ 
                fontSize: `${Math.max(4.5, printFontSizeMrp * scale * 0.35)}px`, 
                fontWeight: 'bold', 
                textAlign: 'center',
                lineHeight: 1
              }}
            >
              MRP: Rs. {(getProductPrice(item) || 1500).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
  const [activeTab, setActiveTab] = useState('batches');
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
      if (qr.description) {
        zpl += `^FO30,162^ADN,16,8^FD${qr.description.toUpperCase().substring(0, 30)}^FS\n`;
      }
      zpl += `^FO30,178^GB200,2,2,B^FS\n`;
      zpl += `^FO30,185^ADN,20,10^FDMRP: Rs. ${(getProductPrice(qr) || 1500).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}^FS\n`;
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
      
      // QR codes are now fetched by loadQRCodes in a separate useEffect
      
      // Fetch batch summary
      const batchResponse = await api.get('/qr-codes/batches/summary');
      setBatchSummary(batchResponse.data);
      
      // Fetch products if not provided
      if (!initialProducts || initialProducts.length === 0) {
        const productsResponse = await api.get('/products');
        setProducts(productsResponse.data.data || []);
      }

      // Fetch print layout configuration
      try {
        const layoutResponse = await qrCodesAPI.getPrintLayout(printTarget);
        if (layoutResponse.data && layoutResponse.data.data) {
          const cfg = layoutResponse.data.data;
          if (cfg.printerModel) setPrinterModel(cfg.printerModel);
          if (cfg.printSize) setPrintSize(cfg.printSize);
          if (cfg.layout) setLayout(cfg.layout);
          if (cfg.dpi) setDpi(cfg.dpi);
          if (cfg.printLayoutMode) setPrintLayoutMode(cfg.printLayoutMode);
          if (cfg.printPaperSize) setPrintPaperSize(cfg.printPaperSize);
          if (cfg.customPaperWidth !== undefined) setCustomPaperWidth(cfg.customPaperWidth);
          if (cfg.customPaperHeight !== undefined) setCustomPaperHeight(cfg.customPaperHeight);
          if (cfg.printMarginTop !== undefined) setPrintMarginTop(cfg.printMarginTop);
          if (cfg.printMarginBottom !== undefined) setPrintMarginBottom(cfg.printMarginBottom);
          if (cfg.printMarginLeft !== undefined) setPrintMarginLeft(cfg.printMarginLeft);
          if (cfg.printMarginRight !== undefined) setPrintMarginRight(cfg.printMarginRight);
          if (cfg.printQRSize !== undefined) setPrintQRSize(cfg.printQRSize);
          if (cfg.printColumns !== undefined) setPrintColumns(cfg.printColumns);
          if (cfg.printRows !== undefined) setPrintRows(cfg.printRows);
          if (cfg.printGap !== undefined) setPrintGap(cfg.printGap);
          if (cfg.printLabelPadding !== undefined) setPrintLabelPadding(cfg.printLabelPadding);
        }
      } catch (err) {
        console.error('Error loading print layout:', err);
      }

      // Fetch reprint requests
      try {
        const reprintResponse = await api.get('/qr-codes/reprint-requests');
        setReprintRequests(reprintResponse.data.data || []);
      } catch (err) {
        console.error('Error loading reprint requests:', err);
      }
    } catch (error) {
      onShowNotification('Error loading data: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadQRCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page + 1);
      params.append('limit', rowsPerPage);
      if (filterBatch) params.append('batchNo', filterBatch);
      if (filterStatus) {
        if (!isMainAdmin && filterStatus === 'printed') {
          // Handled similarly by api if we adjust or pass printed/generated
        } else if (!isMainAdmin && filterStatus === 'generated') {
          // hide generated for non-main admin
        } else {
          params.append('status', filterStatus);
        }
      }
      if (searchQuery) params.append('search', searchQuery);

      const qrResponse = await api.get(`/qr-codes?${params.toString()}`);
      setQRCodes(qrResponse.data.data || []);
      setTotalQRCodes(qrResponse.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load if active tab is qrCodes or batches depending on need
    // but better to always load when deps change
    loadQRCodes();
  }, [page, rowsPerPage, filterBatch, filterStatus, searchQuery, isMainAdmin]);

  const applyConfig = (cfg) => {
    if (cfg.printerModel) setPrinterModel(cfg.printerModel);
    if (cfg.printSize) setPrintSize(cfg.printSize);
    if (cfg.layout) setLayout(cfg.layout);
    if (cfg.dpi) setDpi(cfg.dpi);
    if (cfg.printLayoutMode) setPrintLayoutMode(cfg.printLayoutMode);
    if (cfg.printPaperSize) setPrintPaperSize(cfg.printPaperSize);
    if (cfg.customPaperWidth !== undefined) setCustomPaperWidth(cfg.customPaperWidth);
    if (cfg.customPaperHeight !== undefined) setCustomPaperHeight(cfg.customPaperHeight);
    if (cfg.printMarginTop !== undefined) setPrintMarginTop(cfg.printMarginTop);
    if (cfg.printMarginBottom !== undefined) setPrintMarginBottom(cfg.printMarginBottom);
    if (cfg.printMarginLeft !== undefined) setPrintMarginLeft(cfg.printMarginLeft);
    if (cfg.printMarginRight !== undefined) setPrintMarginRight(cfg.printMarginRight);
    if (cfg.printQRSize !== undefined) setPrintQRSize(cfg.printQRSize);
    if (cfg.printColumns !== undefined) setPrintColumns(cfg.printColumns);
    if (cfg.printRows !== undefined) setPrintRows(cfg.printRows);
    if (cfg.printGap !== undefined) setPrintGap(cfg.printGap);
    if (cfg.printLabelPadding !== undefined) setPrintLabelPadding(cfg.printLabelPadding);
    if (cfg.printFontSizeBatch !== undefined) setPrintFontSizeBatch(cfg.printFontSizeBatch);
    if (cfg.printFontSizeDesc !== undefined) setPrintFontSizeDesc(cfg.printFontSizeDesc);
    if (cfg.printFontSizeMrp !== undefined) setPrintFontSizeMrp(cfg.printFontSizeMrp);
  };

  const handlePrintTargetChange = async (event, newValue) => {
    if (!newValue || newValue === printTarget) return;
    setPrintTarget(newValue);
    setLoading(true);
    try {
      const layoutResponse = await qrCodesAPI.getPrintLayout(newValue);
      if (layoutResponse.data && layoutResponse.data.data) {
        applyConfig(layoutResponse.data.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const savePrintLayout = async () => {
    try {
      setLoading(true);
      const config = {
        printerModel,
        printSize,
        layout,
        dpi,
        printLayoutMode,
        printPaperSize,
        customPaperWidth,
        customPaperHeight,
        printMarginTop,
        printMarginBottom,
        printMarginLeft,
        printMarginRight,
        printQRSize,
        printColumns,
        printRows,
        printGap,
        printLabelPadding,
        printFontSizeBatch,
        printFontSizeDesc,
        printFontSizeMrp
      };
      
      await qrCodesAPI.savePrintLayout({ ...config, target: printTarget });

      onShowNotification('Print layout options saved successfully', 'success');
    } catch (error) {
      onShowNotification('Error saving print layout: ' + (error.response?.data?.error || error.message), 'error');
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
        description,
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
      loadQRCodes();
      if (!isMainAdmin && response.data.qrCodes && response.data.qrCodes.length > 0) {
        printQRLabels(response.data.qrCodes);
      }
    } catch (error) {
      onShowNotification('Error: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (!selectedProduct || quantity < 1 || !batchNo) {
      onShowNotification('Please fill all required fields', 'error');
      return;
    }

    if (!manufactureDate || !expiryDate || !description) {
      setConfirmBulkDialogOpen(true);
      return;
    }

    generateBulkQRCodes();
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
        description,
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
      loadQRCodes();
      if (!isMainAdmin && response.data.qrCodes && response.data.qrCodes.length > 0) {
        printQRLabels(response.data.qrCodes);
      }
    } catch (error) {
      onShowNotification('Error: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReprint = async () => {
    if (selectedQRIdsForReprint.length === 0 || !reprintReason.trim()) {
      onShowNotification('Please enter a reason for reprint', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.post('/qr-codes/reprint-requests', {
        qrCodeIds: selectedQRIdsForReprint,
        reason: reprintReason
      });
      onShowNotification(`Submitted reprint request for ${selectedQRIdsForReprint.length} QR code(s) to Main Admin.`, 'success');
      setOpenReprintDialog(false);
      setSelectedQRIdsForReprint([]);
      setSelectedQRForReprint(null);
      loadData();
      loadQRCodes();
    } catch (error) {
      onShowNotification('Error requesting reprint: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReprint = async (reqId) => {
    try {
      setLoading(true);
      await api.put(`/qr-codes/reprint-requests/${reqId}/approve`);
      onShowNotification('Reprint request approved successfully', 'success');
      loadData();
      loadQRCodes();
    } catch (error) {
      onShowNotification('Error approving request: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReprint = async (reqId) => {
    try {
      setLoading(true);
      await api.put(`/qr-codes/reprint-requests/${reqId}/reject`);
      onShowNotification('Reprint request rejected successfully', 'success');
      loadData();
      loadQRCodes();
    } catch (error) {
      onShowNotification('Error rejecting request: ' + (error.response?.data?.error || error.message), 'error');
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
      loadQRCodes();
    } catch (error) {
      onShowNotification('Error marking as printed: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteQRCodes = async (qrIds) => {
    if (!hasPermission('canDelete')) {
      onShowNotification('You do not have permission to delete QR codes', 'error');
      return;
    }
    if (window.confirm('Are you sure you want to delete these QR codes?')) {
      try {
        setLoading(true);
        const response = await api.delete('/qr-codes', {
          data: { qrIds }
        });

        onShowNotification(`Deleted ${response.data.deleted} QR codes`, 'success');
        setSelectedForPrint([]);
        loadData();
        loadQRCodes();
      } catch (error) {
        onShowNotification('Error deleting QR codes: ' + (error.response?.data?.error || error.message), 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const openEditBatch = async (batchNo) => {
    try {
      setLoading(true);
      const res = await api.get('/qr-codes', { params: { batchNo, limit: 1 } });
      if (res.data.qrCodes && res.data.qrCodes.length > 0) {
        const qr = res.data.qrCodes[0];
        setEditingBatch({
          batchNo: qr.batchNo,
          manufactureDate: qr.manufactureDate ? new Date(qr.manufactureDate).toISOString().split('T')[0] : '',
          expiryDate: qr.expiryDate ? new Date(qr.expiryDate).toISOString().split('T')[0] : '',
          description: qr.description || ''
        });
        setOpenEditBatchDialog(true);
      } else {
        onShowNotification('Batch details not found', 'error');
      }
    } catch (err) {
      onShowNotification('Error loading batch details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBatch = async () => {
    try {
      setLoading(true);
      await api.put(`/qr-codes/batches/${editingBatch.batchNo}`, {
        manufactureDate: editingBatch.manufactureDate || undefined,
        expiryDate: editingBatch.expiryDate || undefined,
        description: editingBatch.description
      });
      onShowNotification('Batch updated successfully', 'success');
      setOpenEditBatchDialog(false);
      loadData();
    } catch (err) {
      onShowNotification('Error updating batch: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteBatchNo) {
      onShowNotification('Please enter a batch number', 'error');
      return;
    }
    if (window.confirm(`Are you SURE you want to delete ALL QR codes for batch ${bulkDeleteBatchNo}? This cannot be undone.`)) {
      try {
        setLoading(true);
        const response = await api.delete('/qr-codes', {
          data: { batchNo: bulkDeleteBatchNo }
        });

        onShowNotification(`Deleted ${response.data.deleted} QR codes`, 'success');
        setOpenBulkDeleteDialog(false);
        setBulkDeleteBatchNo('');
        setSelectedForPrint([]);
        loadData();
        loadQRCodes();
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

  const printQRLabels = async (qrIdsOrObjects) => {
    try {
      let qrsToPrint;
      if (qrIdsOrObjects.length > 0 && typeof qrIdsOrObjects[0] === 'object') {
        qrsToPrint = qrIdsOrObjects;
      } else {
        qrsToPrint = qrCodes.filter(qr => qrIdsOrObjects.includes(qr._id));
      }
      
      // Determine if we need loyalty or non-loyalty config based on the first QR code
      let target = 'loyalty';
      if (qrsToPrint.length > 0) {
        const firstQR = qrsToPrint[0];
        const product = products.find(p => p.productNo && firstQR.productNo && p.productNo.toUpperCase() === firstQR.productNo.toUpperCase());
        if (product && product.isLoyaltyEnabled === false) {
          target = 'nonLoyalty';
        }
      }
      
      let configOverrides = {};
      try {
        const res = await qrCodesAPI.getPrintLayout(target);
        if (res.data && res.data.data) {
          configOverrides = res.data.data;
        }
      } catch (err) {
        console.error('Error fetching layout for print:', err);
      }

      const printWindow = window.open('', '_blank');
      const html = generatePrintHTML(qrsToPrint, configOverrides);
      
      printWindow.document.write(html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
      
      onShowNotification('Print dialog opened', 'success');

      // Consume reprint requests if any of the printed QRs had them
      if (!isMainAdmin) {
        const printedIds = qrsToPrint.map(q => q._id);
        try {
          await api.post('/qr-codes/reprint-requests/consume', { qrIds: printedIds });
          await api.put('/qr-codes/mark-printed', { qrIds: printedIds, printerModel });
          loadData();
        } catch (err) {
          console.error('Error post-print updates:', err);
        }
      }
    } catch (error) {
      onShowNotification('Error preparing print: ' + error.message, 'error');
    }
  };

  const generatePrintHTML = (qrs, configOverrides = {}) => {
    const pPaperSize = configOverrides.printPaperSize || printPaperSize;
    const cPaperWidth = configOverrides.customPaperWidth !== undefined ? configOverrides.customPaperWidth : customPaperWidth;
    const cPaperHeight = configOverrides.customPaperHeight !== undefined ? configOverrides.customPaperHeight : customPaperHeight;
    const pLayoutMode = configOverrides.printLayoutMode || printLayoutMode;
    const pColumns = configOverrides.printColumns !== undefined ? configOverrides.printColumns : printColumns;
    const pRows = configOverrides.printRows !== undefined ? configOverrides.printRows : printRows;
    const pMarginTop = configOverrides.printMarginTop !== undefined ? configOverrides.printMarginTop : printMarginTop;
    const pMarginBottom = configOverrides.printMarginBottom !== undefined ? configOverrides.printMarginBottom : printMarginBottom;
    const pMarginLeft = configOverrides.printMarginLeft !== undefined ? configOverrides.printMarginLeft : printMarginLeft;
    const pMarginRight = configOverrides.printMarginRight !== undefined ? configOverrides.printMarginRight : printMarginRight;
    const pGap = configOverrides.printGap !== undefined ? configOverrides.printGap : printGap;
    const pLabelPadding = configOverrides.printLabelPadding !== undefined ? configOverrides.printLabelPadding : printLabelPadding;
    const pQRSize = configOverrides.printQRSize !== undefined ? configOverrides.printQRSize : printQRSize;
    const pFontSizeBatch = configOverrides.printFontSizeBatch !== undefined ? configOverrides.printFontSizeBatch : printFontSizeBatch;
    const pFontSizeDesc = configOverrides.printFontSizeDesc !== undefined ? configOverrides.printFontSizeDesc : printFontSizeDesc;
    const pFontSizeMrp = configOverrides.printFontSizeMrp !== undefined ? configOverrides.printFontSizeMrp : printFontSizeMrp;

    const paperW = pPaperSize === 'custom' ? cPaperWidth : (pPaperSize === 'a4' ? 210 : (pPaperSize === 'letter' ? 215.9 : (pPaperSize === 'medium' ? 101.6 : 76.2)));
    const paperH = pPaperSize === 'custom' ? cPaperHeight : (pPaperSize === 'a4' ? 297 : (pPaperSize === 'letter' ? 279.4 : (pPaperSize === 'medium' ? 152.4 : 76.2)));
    
    const cols = pLayoutMode === 'roll' ? 1 : pColumns;
    const rows = pLayoutMode === 'roll' ? 1 : pRows;
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
            padding: ${pMarginTop}mm ${pMarginRight}mm ${pMarginBottom}mm ${pMarginLeft}mm;
            page-break-after: always;
            display: grid;
            grid-template-columns: repeat(${cols}, 1fr);
            grid-template-rows: repeat(${rows}, 1fr);
            gap: ${pGap}mm;
            overflow: hidden;
          }
          .label {
            box-sizing: border-box;
            border: 1px dashed #ccc;
            padding: ${pLabelPadding}mm;
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
            width: ${pQRSize}mm; 
            height: ${pQRSize}mm;
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
            font-size: ${pFontSizeBatch}pt; 
            margin: 0.5mm 0;
            line-height: 1.2;
            width: 100%;
            overflow: hidden;
          }
          .black-area {
            background-color: #000;
            width: 85%;
            height: 1.5mm;
            margin: 1.5mm auto 1mm auto;
          }
          .mrp-text {
            font-weight: bold;
            font-size: ${pFontSizeMrp}pt;
            margin-top: 0.5mm;
            text-align: center;
            width: 100%;
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
        const product = products.find(p => p.productNo && qr.productNo && p.productNo.toUpperCase() === qr.productNo.toUpperCase());
        const isLoyaltyEnabled = product ? (product.isLoyaltyEnabled !== false) : true;

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
            ${isLoyaltyEnabled ? `
            <div class="qr-container">
              <img src="${qr.qrData}" alt="QR">
            </div>
            ` : ''}
            <div class="batch-info">
              BATCH: <strong>${qr.batchNo}</strong><br>
              ${mfgDateToShow ? `MFG DATE: <strong>${mfgDateToShow}</strong><br>` : ''}
              ${expDateToShow ? `EXP DATE: <strong>${expDateToShow}</strong>` : ''}
            </div>
            <div class="description-area" style="font-size: ${pFontSizeDesc}pt; font-weight: bold; height: 4.5mm; margin-top: 1mm; text-transform: uppercase; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${qr.description ? qr.description : '&nbsp;'}
            </div>
            <div class="divider-line" style="border-top: 1px solid #000; width: 85%; margin: 1mm auto 0.5mm auto;"></div>
            <div class="mrp-text">MRP: Rs. ${(getProductPrice(qr) || 1500).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        `;
      });

      if (printLayoutMode === 'grid') {
        const filledSlots = pageQRs.length;
        const emptySlots = itemsPerPage - filledSlots;
        for (let s = 0; s < emptySlots; s++) {
          html += `<div class="label" style="border: none; opacity: 0;"><div style="width: ${pQRSize}mm; height: ${pQRSize}mm;"></div></div>`;
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
    setDescription('');
    setQuantity(1);
  };

  const getUniqueBatchesCount = (qrs) => {
    if (!qrs) return 0;
    const unique = new Set();
    qrs.forEach(qr => {
      const batchNo = qr.batchNo || '';
      const parts = batchNo.trim().split(/[_\s]+/);
      if (parts.length >= 4) {
        const delimiter = batchNo.includes('_') ? '_' : ' ';
        unique.add(parts.slice(0, 3).join(delimiter));
      } else if (parts.length === 5) {
        unique.add(parts.slice(0, 4).join(' '));
      } else {
        unique.add(batchNo);
      }
    });
    return unique.size;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        QR Code Management
      </Typography>

      {isMainAdmin && reprintRequests.filter(r => r.status === 'pending').length > 0 && (
        <Alert 
          severity="warning" 
          action={
            <Button color="inherit" size="small" onClick={() => setActiveTab(2)}>
              View Requests
            </Button>
          }
          sx={{ mb: 3, fontWeight: 'bold' }}
        >
          🔔 You have {reprintRequests.filter(r => r.status === 'pending').length} pending reprint request(s) from co-admins.
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">Total QR Codes</Typography>
            <Typography variant="h4" color="primary">{batchSummary.reduce((sum, b) => sum + b.totalQRs, 0)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">Printed</Typography>
            <Typography variant="h4" color="success.main">
              {batchSummary.reduce((sum, b) => sum + b.printed + (!isMainAdmin ? b.generated : 0), 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">Generated</Typography>
            <Typography variant="h4" color="warning.main">
              {isMainAdmin ? batchSummary.reduce((sum, b) => sum + b.generated, 0) : 0}
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
          {isMainAdmin ? 'Bulk Generate' : 'Print Bulk'}
        </Button>
        {hasPermission('canDelete') && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setOpenBulkDeleteDialog(true)}
          >
            Bulk Delete
          </Button>
        )}
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
              onClick={() => {
                if (isMainAdmin) {
                  setOpenPrintConfigDialog(true);
                } else {
                  const requireReprint = selectedForPrint.filter(id => {
                    const qr = qrCodes.find(q => q._id === id);
                    return qr && qr.status !== 'generated' && !qr.reprintApproved;
                  });
                  if (requireReprint.length > 0) {
                    setSelectedQRForReprint(null);
                    setSelectedQRIdsForReprint(requireReprint);
                    setReprintReason('');
                    setOpenReprintDialog(true);
                  } else {
                    printQRLabels(selectedForPrint);
                  }
                }
              }}
            >
              Print Labels
            </Button>
            {hasPermission('canDelete') && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => deleteQRCodes(selectedForPrint)}
              >
                Delete Selected ({selectedForPrint.length})
              </Button>
            )}
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Download />}
              onClick={() => {
                const qrsToExport = qrCodes.filter(q => selectedForPrint.includes(q._id));
                const rows = qrsToExport.map(q => ({
                  QR_ID: q.qrId,
                  Product_Name: q.productName || (products.find(p => p._id === (q.product?._id || q.product))?.name),
                  Batch_No: q.batchNo,
                  Package_No: q.packageNo,
                  QR_Link: q.qrLink,
                  Status: q.status,
                  Generated_Date: q.createdAt ? new Date(q.createdAt).toLocaleString() : ''
                }));
                exportCSV(rows, 'Megakem_QRCodes');
              }}
            >
              Export CSV ({selectedForPrint.length})
            </Button>
          </>
        )}
        {isMainAdmin && (
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setOpenPrintConfigDialog(true)}
          >
            Sticker & Print Settings
          </Button>
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
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            placeholder="e.g., MWTC Members Only, Authorized Dealers Only"
            helperText="Text displayed on QR label (blank if empty)"
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
                  {product.name} ({product.productNo}) - Rs. {product.price ? product.price.toLocaleString() : 0}
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
        <DialogTitle>{isMainAdmin ? 'Bulk Generate QR Codes' : 'Print QR Codes in Bulk'}</DialogTitle>
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
                  {product.name} ({product.productNo}) - Rs. {product.price ? product.price.toLocaleString() : 0}
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
            <Grid item xs={6}>
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
            <Grid item xs={6}>
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
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            placeholder="e.g., MWTC Members Only, Authorized Dealers Only"
            helperText="Text displayed on QR label (blank if empty)"
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
            <Button onClick={handleGenerateClick} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : (isMainAdmin ? 'Generate Bulk' : 'Print Bulk')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog for Incomplete Fields */}
        <Dialog open={confirmBulkDialogOpen} onClose={() => setConfirmBulkDialogOpen(false)}>
          <DialogTitle>Incomplete Details</DialogTitle>
          <DialogContent>
            <Typography>
              Not all optional fields (like Manufacture Date, Expiry Date, or Description) are filled. Do you want to proceed anyway?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmBulkDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              setConfirmBulkDialogOpen(false);
              generateBulkQRCodes();
            }} variant="contained" color="primary">
              Proceed
            </Button>
          </DialogActions>
        </Dialog>

      {/* Reprint Request Dialog */}
      <Dialog open={openReprintDialog} onClose={() => setOpenReprintDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚠️ Request Reprint Approval
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {selectedQRForReprint ? (
            <Typography variant="body2" sx={{ mb: 2 }} color="textSecondary">
              This QR code (Batch: {selectedQRForReprint?.batchNo}, Pkg: {selectedQRForReprint?.packageNo || 'N/A'}) has already been printed. 
              Co-admins require reprint approval from the Main Admin to print it again.
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ mb: 2 }} color="textSecondary">
              You are requesting reprint approval for <strong>{selectedQRIdsForReprint.length}</strong> selected QR code(s) that have already been printed.
            </Typography>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Reprinting"
            value={reprintReason}
            onChange={(e) => setReprintReason(e.target.value)}
            margin="normal"
            required
            placeholder="Explain why this QR code needs to be reprinted..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReprintDialog(false)}>Cancel</Button>
          <Button onClick={handleRequestReprint} color="warning" variant="contained" disabled={loading || !reprintReason.trim()}>
            {loading ? <CircularProgress size={24} /> : 'Send Request'}
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
        <DialogTitle sx={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #003366 0%, #4A90A4 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isMainAdmin && <Lock sx={{ fontSize: 22, opacity: 0.85 }} />}
          Sticker & Print Settings
          {!isMainAdmin && (
            <Chip
              label="Read-Only"
              size="small"
              sx={{
                ml: 'auto',
                bgcolor: 'rgba(255,255,255,0.18)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem',
                height: 24,
                border: '1px solid rgba(255,255,255,0.35)',
              }}
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Tabs
            value={printTarget}
            onChange={handlePrintTargetChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Loyalty Program (With QR Code)" value="loyalty" />
            <Tab label="Disabled Ones (Without QR Code)" value="nonLoyalty" />
          </Tabs>
          {!isMainAdmin && (
            <Alert
              severity="info"
              icon={<Lock fontSize="inherit" />}
              sx={{
                mb: 3,
                fontWeight: 'bold',
                bgcolor: '#e3f2fd',
                border: '1px solid #90caf9',
                '& .MuiAlert-icon': { color: '#1565c0' },
              }}
            >
              🔒 Read-Only — These print layout settings are managed by the main administrator. You can view and use the current configuration, but changes are restricted.
            </Alert>
          )}
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
                  disabled={!isMainAdmin}
                >
                  <MenuItem value="roll">Roll / Thermal (Single Label)</MenuItem>
                  <MenuItem value="grid">Sheet / Grid (Stickers on Page)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Paper / Sheet Size Preset</InputLabel>
                <Select
                  value={printPaperSize}
                  onChange={(e) => handlePaperSizeChange(e.target.value)}
                  label="Paper / Sheet Size Preset"
                  disabled={!isMainAdmin}
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
                      disabled={!isMainAdmin}
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
                      disabled={!isMainAdmin}
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
                      disabled={!isMainAdmin}
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
                      disabled={!isMainAdmin}
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
                    disabled={!isMainAdmin}
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
                    disabled={!isMainAdmin}
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
                      disabled={!isMainAdmin}
                    />
                  </Grid>
                )}
              </Grid>

              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }} gutterBottom color="primary">
                Font Sizes (pt)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Batch Info"
                    type="number"
                    inputProps={{ step: "0.1" }}
                    value={printFontSizeBatch}
                    onChange={(e) => setPrintFontSizeBatch(parseFloat(e.target.value) || 6.5)}
                    disabled={!isMainAdmin}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Description"
                    type="number"
                    inputProps={{ step: "0.1" }}
                    value={printFontSizeDesc}
                    onChange={(e) => setPrintFontSizeDesc(parseFloat(e.target.value) || 7)}
                    disabled={!isMainAdmin}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="MRP"
                    type="number"
                    inputProps={{ step: "0.1" }}
                    value={printFontSizeMrp}
                    onChange={(e) => setPrintFontSizeMrp(parseFloat(e.target.value) || 8.5)}
                    disabled={!isMainAdmin}
                  />
                </Grid>
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
                    disabled={!isMainAdmin}
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
                    disabled={!isMainAdmin}
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
                    disabled={!isMainAdmin}
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
                    disabled={!isMainAdmin}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }} gutterBottom color="primary">
                Fixed Label Format
              </Typography>
              <Box sx={{ pl: 1 }}>
                {printTarget === 'loyalty' && <Typography variant="body2" color="text.secondary">✅ QR Code</Typography>}
                <Typography variant="body2" color="text.secondary">✅ Batch Number</Typography>
                <Typography variant="body2" color="text.secondary">✅ MFG Date</Typography>
                <Typography variant="body2" color="text.secondary">✅ Expiry Date</Typography>
                <Typography variant="body2" color="text.secondary">✅ Description</Typography>
                <Typography variant="body2" color="text.secondary">✅ MRP</Typography>
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
          {isMainAdmin && (
            <Button
              onClick={savePrintLayout}
              variant="contained"
              color="success"
              startIcon={<Save />}
              disabled={loading}
            >
              Save Layout
            </Button>
          )}
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
            <TextField 
              size="small"
              placeholder="Filter by Batch..."
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              sx={{ minWidth: 200, flexGrow: 1 }}
              InputProps={{
                startAdornment: <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'action.active' }}>🔍</Box>
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="">All</MenuItem>
                {isMainAdmin && <MenuItem value="generated">Generated</MenuItem>}
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
                      checked={selectedForPrint.length === qrCodes.length && qrCodes.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForPrint(qrCodes.map(q => q._id));
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
                  <TableCell><strong>Generated</strong></TableCell>
                  <TableCell><strong>Printed</strong></TableCell>
                  {(isMainAdmin || hasPermission('canViewScans')) && <TableCell><strong>Scan & Reprint Info</strong></TableCell>}
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {qrCodes.map(qr => (
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
                        label={(!isMainAdmin && qr.status === 'generated') ? 'printed' : qr.status}
                        size="small"
                        color={((!isMainAdmin && qr.status === 'generated') || qr.status === 'printed') ? 'success' : 'default'}
                        variant={qr.status === 'scanned' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{formatPerfectTime(qr.createdAt)}</TableCell>
                    <TableCell>{formatPerfectTime(qr.printedDate)}</TableCell>
                    {(isMainAdmin || hasPermission('canViewScans')) && (
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {qr.reprintCount > 0 && (
                            <Chip 
                              label={`Reprinted: ${qr.reprintCount}x`} 
                              size="small" 
                              color="warning" 
                              variant="outlined" 
                              sx={{ fontWeight: 'bold', alignSelf: 'flex-start' }}
                            />
                          )}
                          {qr.status === 'scanned' ? (
                            <Box sx={{ pl: 0.5 }}>
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: 'success.main' }}>
                                Scanned by: {qr.scannedByMemberId || 'N/A'}
                              </Typography>
                              {qr.scannedByMemberName && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                  Name: {qr.scannedByMemberName}
                                </Typography>
                              )}
                              {qr.scanPoints > 0 && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'primary.main', fontWeight: 'medium' }}>
                                  Points: +{qr.scanPoints} pts
                                </Typography>
                              )}
                              {qr.scanLocation && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                  Loc: {qr.scanLocation}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="textSecondary">—</Typography>
                          )}
                        </Box>
                      </TableCell>
                    )}
                    <TableCell>
                      {isMainAdmin && (
                        <Tooltip title="Download QR Image">
                          <IconButton
                            size="small"
                            onClick={() => downloadQRAsImage(qr)}
                            color="primary"
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={qr.reprintPending ? "Reprint Pending Approval" : "Print Single Label"}>
                        <span>
                          <IconButton
                            size="small"
                            color="warning"
                            disabled={qr.reprintPending}
                            onClick={() => {
                              if (!isMainAdmin && qr.status !== 'generated' && !qr.reprintApproved) {
                                setSelectedQRForReprint(qr);
                                setSelectedQRIdsForReprint([qr._id]);
                                setReprintReason('');
                                setOpenReprintDialog(true);
                              } else {
                                printQRLabels([qr._id]);
                              }
                            }}
                          >
                            {qr.reprintPending ? '⏳' : <Print fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      {isMainAdmin && (
                        <Tooltip title="Download ZPL (Thermal Printer)">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => generateZPL([qr._id])}
                          >
                            <GetApp fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasPermission('canDelete') && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => deleteQRCodes([qr._id])}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {qrCodes.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No QR codes found. Start by generating new QR codes.
            </Alert>
          )}

          {/* Pagination */}
          <TablePagination
            component="div"
            count={totalQRCodes}
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
            <Tabs 
              value={activeTab} 
              onChange={(e, v) => { 
                setActiveTab(v); 
                if (v === 'scan_logs') loadScanLogs(); 
                if (v === 'batches' || v === 'reprint_requests') loadData();
              }}
            >
              <Tab label="Production Batch History" value="batches" />
              {(isMainAdmin || hasPermission('canViewScans')) && <Tab label="🔍 Scan Attempt Logs" value="scan_logs" />}
              {(isMainAdmin || hasPermission('canManageCoAdminRequests')) && (
                <Tab 
                  label={`✉️ Reprint Requests (${reprintRequests.filter(r => r.status === 'pending').length})`} 
                  value="reprint_requests"
                />
              )}
            </Tabs>
          </Box>

          {/* Tab 0: Production Batch History */}
          {activeTab === 'batches' && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search by Batch No"
                  variant="outlined"
                  value={batchSearchQuery}
                  onChange={(e) => setBatchSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Batch No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total QRs</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Printed</TableCell>
                    {isMainAdmin && (
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Scanned</TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>First Generated Time</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Last Print Time</TableCell>
                    {isMainAdmin && (
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchSummary.filter(batch => batch._id && batch._id.toLowerCase().includes(batchSearchQuery.toLowerCase())).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isMainAdmin ? 8 : 6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="textSecondary">No batches found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    batchSummary.filter(batch => batch._id && batch._id.toLowerCase().includes(batchSearchQuery.toLowerCase())).map(batch => (
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
                        <TableCell>
                          <Typography variant="body2">{getProductDetails(batch)?.name || 'Unknown'}</Typography>
                          {(() => {
                            const prod = getProductDetails(batch);
                            if (prod) {
                              return (
                                <Chip 
                                  label={prod.isLoyaltyEnabled !== false ? "QR Enabled" : "QR Disabled"} 
                                  size="small" 
                                  color={prod.isLoyaltyEnabled !== false ? "success" : "default"} 
                                  sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
                                />
                              );
                            }
                            return null;
                          })()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{getProductDetails(batch)?.price ? `Rs. ${getProductDetails(batch).price}` : 'N/A'}</Typography>
                        </TableCell>
                        <TableCell align="center">{batch.totalQRs}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={`${isMainAdmin ? batch.printed : (batch.printed + batch.generated)}/${batch.totalQRs}`} 
                            size="small" 
                            color={(isMainAdmin ? batch.printed : (batch.printed + batch.generated)) === batch.totalQRs ? "success" : "warning"}
                          />
                        </TableCell>
                        {isMainAdmin && (
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
                        )}
                        <TableCell align="right">
                          {formatPerfectTime(batch.firstGeneratedDate, 'N/A')}
                        </TableCell>
                        <TableCell align="right">
                          {formatPerfectTime(batch.lastPrintDate, 'N/A')}
                        </TableCell>
                        {isMainAdmin && (
                          <TableCell align="center">
                            <Tooltip title="Edit Batch">
                              <IconButton size="small" color="primary" onClick={() => openEditBatch(batch._id)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Batch">
                              <IconButton size="small" color="error" onClick={() => {
                                setBulkDeleteBatchNo(batch._id);
                                setOpenBulkDeleteDialog(true);
                              }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>
          )}

          {/* Tab 1: Scan Attempt Logs */}
          {activeTab === 'scan_logs' && (isMainAdmin || hasPermission('canViewScans')) && (
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

          {/* Tab 2: Reprint Requests */}
          {activeTab === 'reprint_requests' && (isMainAdmin || hasPermission('canManageCoAdminRequests')) && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                ✉️ Reprint Permission Requests
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Time</strong></TableCell>
                      <TableCell><strong>Requested By</strong></TableCell>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell><strong>Batch & Pkg</strong></TableCell>
                      <TableCell><strong>Reason</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reprintRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="textSecondary">No reprint requests found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reprintRequests.map(req => {
                        const statusColor = req.status === 'approved' ? 'success'
                          : req.status === 'rejected' ? 'error'
                          : req.status === 'pending' ? 'warning'
                          : 'default';
                        
                        return (
                          <TableRow key={req._id} hover>
                            <TableCell sx={{ fontSize: '0.8rem' }}>
                              {new Date(req.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>
                              {req.requestedByEmail || 'Co-Admin'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>
                              {req.qrCode?.productName || '-'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>
                              B: {req.qrCode?.batchNo || '-'} <br />
                              P: {req.qrCode?.packageNo || '-'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {req.reason}
                            </TableCell>
                            <TableCell>
                              <Chip label={req.status} size="small" color={statusColor} />
                            </TableCell>
                            <TableCell align="right">
                              {req.status === 'pending' && (
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                  <Button 
                                    size="small" 
                                    variant="contained" 
                                    color="success"
                                    onClick={() => handleApproveReprint(req._id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    size="small" 
                                    variant="outlined" 
                                    color="error"
                                    onClick={() => handleRejectReprint(req._id)}
                                  >
                                    Reject
                                  </Button>
                                </Box>
                              )}
                              {req.status !== 'pending' && (
                                <Typography variant="caption" color="textSecondary">
                                  Resolved
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Batch Dialog */}
      <Dialog open={openEditBatchDialog} onClose={() => setOpenEditBatchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Batch - {editingBatch?.batchNo}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              type="date"
              label="Manufacture Date"
              InputLabelProps={{ shrink: true }}
              value={editingBatch?.manufactureDate || ''}
              onChange={(e) => setEditingBatch({ ...editingBatch, manufactureDate: e.target.value })}
            />
            <TextField
              fullWidth
              type="date"
              label="Expiry Date"
              InputLabelProps={{ shrink: true }}
              value={editingBatch?.expiryDate || ''}
              onChange={(e) => setEditingBatch({ ...editingBatch, expiryDate: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editingBatch?.description || ''}
              onChange={(e) => setEditingBatch({ ...editingBatch, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditBatchDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateBatch} 
            color="primary" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={openBulkDeleteDialog} onClose={() => setOpenBulkDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Bulk Delete QR Codes</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Warning: This action is permanent and will delete all QR codes associated with the specified Batch Number.
          </Alert>
          <TextField
            fullWidth
            label="Batch Number"
            value={bulkDeleteBatchNo}
            onChange={(e) => setBulkDeleteBatchNo(e.target.value)}
            margin="normal"
            required
            helperText="Enter the exact Batch Number to delete all its QR codes"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDeleteDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkDelete} 
            color="error" 
            variant="contained" 
            disabled={loading || !bulkDeleteBatchNo}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {loading ? 'Deleting...' : 'Delete All in Batch'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRCodeManager;
