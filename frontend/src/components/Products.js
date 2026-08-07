import React, { useState } from 'react';
import { Box, Typography, Button, TextField, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { EmojiEvents, Add, Edit, Delete, Inventory2, FilterList } from '@mui/icons-material';

const Products = ({ 
  hasPermission,
  setProductDialog,
  productSearchQuery,
  setProductSearchQuery,
  products = [],
  setProductPointsDialog,
  handleDeleteProduct
}) => {
  const [packSizeFilter, setPackSizeFilter] = useState('ALL');

  const loyaltyActiveCount = products.filter(p => p.isLoyaltyEnabled !== false && p.isLoyaltyEnabled !== 'false').length;

  // Extract all unique pack sizes (p.category)
  const uniquePackSizes = Array.from(new Set(products.map(p => p.category).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  return (
    <Box>
      {/* HEADER & SUMMARY STAT CARDS */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 900, color: '#003366', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory2 sx={{ color: '#003366' }} /> Products & Loyalty Points Catalog
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #003366 0%, #005F73 100%)', color: 'white', boxShadow: '0 4px 15px rgba(0,51,102,0.2)' }}>
              <Typography variant='caption' sx={{ opacity: 0.85, fontWeight: 600 }}>Total Products</Typography>
              <Typography variant='h4' fontWeight='900' sx={{ mt: 0.5 }}>{products.length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)', color: '#003366', boxShadow: '0 4px 15px rgba(0,230,118,0.25)' }}>
              <Typography variant='caption' sx={{ opacity: 0.9, fontWeight: 700 }}>Loyalty Active</Typography>
              <Typography variant='h4' fontWeight='900' sx={{ mt: 0.5 }}>{loyaltyActiveCount}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)', color: 'white', boxShadow: '0 4px 15px rgba(0,180,216,0.2)' }}>
              <Typography variant='caption' sx={{ opacity: 0.85, fontWeight: 600 }}>Points Configured</Typography>
              <Typography variant='h4' fontWeight='900' sx={{ mt: 0.5 }}>
                {products.filter(p => p.pointsPerProduct !== null && p.pointsPerProduct !== undefined && p.pointsPerProduct > 0).length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ p: 2, bgcolor: '#e6f2ff', borderRadius: 2.5, border: '1px solid #b3d7ff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EmojiEvents sx={{ color: '#003366', fontSize: '1.4rem' }} />
          <Typography variant='body2' color='#003366' sx={{ fontWeight: 600 }}>
            <strong>Loyalty Points System:</strong> Each product can earn custom reward points for customers upon scanning QR codes. Click the trophy icon <EmojiEvents fontSize="small" sx={{ verticalAlign: 'middle', color: '#003366' }} /> to configure exact points.
          </Typography>
        </Box>
      </Box>

      {/* CONTROLS BAR */}
      <Box sx={{ mb: 2.5, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button 
          variant='contained' 
          startIcon={<Add />} 
          onClick={() => setProductDialog({ open: true, product: { name: '', productNo: '', description: '', category: '', price: 0, isLoyaltyEnabled: true, imageUrl: '', tdsUrl: '', buyUrl: '', showInCatalog: true } })}
          disabled={!hasPermission('canManageProducts')}
          sx={{ 
            borderRadius: 2.5, 
            px: 3, 
            py: 1, 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)', 
            color: 'white',
            boxShadow: '0 4px 15px rgba(255,65,108,0.35)',
            '&:hover': { background: 'linear-gradient(135deg, #E0355B 0%, #E03E20 100%)' }
          }}
        >
          Add New Product
        </Button>

        <TextField 
          size='small' 
          placeholder='🔍 Search products by name, code, or category...' 
          value={productSearchQuery}
          onChange={(e) => setProductSearchQuery(e.target.value)}
          sx={{ 
            flexGrow: 1, 
            minWidth: 220,
            '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } 
          }}
        />

        {/* PACK SIZE FILTER DROPDOWN */}
        <FormControl size="small" sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } }}>
          <InputLabel id="pack-size-filter-label" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            📦 Pack Size
          </InputLabel>
          <Select
            labelId="pack-size-filter-label"
            value={packSizeFilter}
            label="📦 Pack Size"
            onChange={(e) => setPackSizeFilter(e.target.value)}
            sx={{ fontWeight: 700 }}
          >
            <MenuItem value="ALL">All Pack Sizes ({products.length})</MenuItem>
            {uniquePackSizes.map(ps => {
              const count = products.filter(p => p.category === ps).length;
              return (
                <MenuItem key={ps} value={ps} sx={{ fontWeight: 600 }}>
                  {ps} ({count})
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {(productSearchQuery || packSizeFilter !== 'ALL') && (
          <Button 
            size='small' 
            variant="outlined"
            onClick={() => { setProductSearchQuery(''); setPackSizeFilter('ALL'); }} 
            sx={{ borderRadius: 2.5, fontWeight: 700, px: 2 }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* PRODUCTS TABLE */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 3.5, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#003366' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 800 }}>Product Details</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 800 }}>Product Code</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 800 }}>Pack Size / Category</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 800 }}>Price (LKR)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 800 }}>Loyalty Points</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 800 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              const filteredProducts = products.filter(p => {
                const matchesSearch = !productSearchQuery ||
                  p.name?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                  p.productNo?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                  p.category?.toLowerCase().includes(productSearchQuery.toLowerCase());
                
                const matchesPackSize = packSizeFilter === 'ALL' || p.category === packSizeFilter;

                return matchesSearch && matchesPackSize;
              });
              
              if (filteredProducts.length === 0) {
                return (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ py: 5 }}>
                        <Typography variant='body1' color='text.secondary' fontWeight={600}>
                          {products.length === 0 ? 'No products registered. Click "Add New Product" to create one.' : 'No products match your search/filter.'}
                        </Typography>
                        {(products.length > 0) && (
                          <Button onClick={() => { setProductSearchQuery(''); setPackSizeFilter('ALL'); }} sx={{ mt: 1.5, borderRadius: 2 }}>Clear Filters</Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              }
              
              return filteredProducts.map(p => {
                let pointsDisplay = 'Not Configured';
                if (p.pointsPerProduct !== null && p.pointsPerProduct !== undefined && p.pointsPerProduct > 0) {
                  pointsDisplay = `${p.pointsPerProduct} pts (Fixed)`;
                }
                const isLoyalty = p.isLoyaltyEnabled !== false && p.isLoyaltyEnabled !== 'false';
                
                return (
                  <TableRow key={p._id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, transition: 'background-color 0.2s' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} style={{ width: 42, height: 42, objectFit: 'contain', borderRadius: 6, border: '1px solid #e2e8f0', padding: 2 }} />
                        ) : (
                          <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: isLoyalty ? '#e6f4ea' : '#e0f2fe', color: isLoyalty ? '#2e7d32' : '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Inventory2 fontSize="small" />
                          </Box>
                        )}
                        <Box>
                          <Typography variant='subtitle2' fontWeight={800} color='#003366'>
                            {p.name}
                          </Typography>
                          {p.showInCatalog === false && (
                            <Chip label="Hidden in Catalog" size="small" color="default" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip label={p.productNo} size='small' sx={{ bgcolor: '#003366', color: 'white', fontWeight: 800, borderRadius: '6px' }} />
                    </TableCell>

                    <TableCell>
                      <Chip label={p.category || 'N/A'} size='small' variant='outlined' sx={{ fontWeight: 700, borderRadius: '6px' }} />
                    </TableCell>

                    <TableCell>
                      <Typography variant='subtitle2' fontWeight={900} color={p.price > 0 ? 'success.main' : 'text.disabled'}>
                        {p.price > 0 ? `Rs. ${p.price.toLocaleString()}` : 'Not Set'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip 
                        label={isLoyalty ? pointsDisplay : 'Disabled'} 
                        size='small' 
                        color={!isLoyalty ? 'default' : (pointsDisplay === 'Not Configured' ? 'info' : 'success')}
                        icon={<EmojiEvents sx={{ fontSize: '0.9rem !important' }} />}
                        sx={{ fontWeight: 800 }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <IconButton size='small' color='primary' onClick={() => setProductDialog({ open: true, product: p })} disabled={!hasPermission('canManageProducts')} title='Edit Product'>
                          <Edit fontSize='small' />
                        </IconButton>
                        <IconButton size='small' sx={{ color: '#00C853' }} onClick={() => setProductPointsDialog({ open: true, product: p })} disabled={!hasPermission('canManageProducts')} title='Configure Loyalty Points'>
                          <EmojiEvents fontSize='small' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => handleDeleteProduct(p._id)} disabled={!hasPermission('canManageProducts') || !hasPermission('canDelete')} title='Delete Product'>
                          <Delete fontSize='small' />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              });
            })()}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Products;
