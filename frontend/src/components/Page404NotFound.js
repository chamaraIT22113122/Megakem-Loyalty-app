import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Container, Chip, TextField, InputAdornment } from '@mui/material';
import { SearchOff, Home, QrCodeScanner, Inventory2, Search, EmojiEvents } from '@mui/icons-material';

const Page404NotFound = ({ 
  pageConfig = {}, 
  onNavigateHome, 
  onNavigateCatalog, 
  onScanQRCode,
  onNavigateLeaderboard
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const title = pageConfig.title || '404 — Page Not Found';
  const message = pageConfig.message || 'The page or QR code link you visited could not be found or has moved.';
  const buttonText = pageConfig.buttonText || 'Return to Homepage';
  const showSearchBar = pageConfig.showSearchBar !== false;
  const showQuickLinks = pageConfig.showQuickLinks !== false;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onNavigateCatalog) {
      onNavigateCatalog(searchQuery.trim());
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 }, animation: 'fadeIn 0.4s ease-in' }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 3, sm: 5 }, 
          borderRadius: 4, 
          textAlign: 'center', 
          bgcolor: 'background.paper',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 45px rgba(0, 51, 102, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Decorative Header Accent */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)' }} />

        <Box 
          sx={{ 
            width: 85, 
            height: 85, 
            borderRadius: '50%', 
            bgcolor: '#cffafe', 
            color: '#0284c7', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            mx: 'auto', 
            mb: 2.5,
            boxShadow: '0 8px 25px rgba(2, 132, 199, 0.2)'
          }}
        >
          <SearchOff sx={{ fontSize: 46 }} />
        </Box>

        <Chip 
          label="HTTP 404 NOT FOUND" 
          size="small" 
          color="info" 
          variant="outlined" 
          sx={{ fontWeight: 800, mb: 1.5, px: 1 }} 
        />

        <Typography variant="h4" fontWeight="900" sx={{ color: '#003366', mb: 1.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          {title}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 450, mx: 'auto', lineHeight: 1.6, mb: 3 }}>
          {message}
        </Typography>

        {/* 404 SEARCH BAR */}
        {showSearchBar && (
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search product catalog or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <Button size="small" type="submit" sx={{ fontWeight: 800 }}>
                      Search
                    </Button>
                  </InputAdornment>
                )
              }}
              sx={{ bgcolor: '#f8fafc', borderRadius: 2.5 }}
            />
          </Box>
        )}

        {/* QUICK LINK PILLS */}
        {showQuickLinks && (
          <Box sx={{ mb: 3.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 1 }}>
              Popular Links:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip 
                icon={<Inventory2 fontSize="small" />} 
                label="Product Catalog" 
                clickable 
                onClick={onNavigateCatalog} 
                sx={{ fontWeight: 700 }} 
              />
              <Chip 
                icon={<QrCodeScanner fontSize="small" />} 
                label="QR Scanner" 
                clickable 
                onClick={onScanQRCode} 
                sx={{ fontWeight: 700 }} 
              />
              {onNavigateLeaderboard && (
                <Chip 
                  icon={<EmojiEvents fontSize="small" />} 
                  label="Leaderboard" 
                  clickable 
                  onClick={onNavigateLeaderboard} 
                  sx={{ fontWeight: 700 }} 
                />
              )}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button 
            fullWidth
            variant="contained" 
            size="large" 
            startIcon={<Home />} 
            onClick={onNavigateHome}
            sx={{ 
              borderRadius: 3, 
              py: 1.2, 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #003366 0%, #005F73 100%)', 
              color: 'white',
              boxShadow: '0 4px 15px rgba(0,51,102,0.3)'
            }}
          >
            {buttonText}
          </Button>

          {onScanQRCode && (
            <Button 
              fullWidth
              variant="contained" 
              color="secondary"
              size="large" 
              startIcon={<QrCodeScanner />} 
              onClick={onScanQRCode}
              sx={{ borderRadius: 3, py: 1.1, fontWeight: 800, background: 'linear-gradient(135deg, #A4D233 0%, #00C853 100%)', color: '#003366' }}
            >
              Re-Scan QR Code Label
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Page404NotFound;
