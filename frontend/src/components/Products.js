import React from 'react';
import { Box, Typography, Button, TextField, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton } from '@mui/material';
import { EmojiEvents, Add, Edit, Delete } from '@mui/icons-material';

const Products = ({ 
  hasPermission,
  setProductDialog,
  productSearchQuery,
  setProductSearchQuery,
  products,
  setProductPointsDialog,
  handleDeleteProduct
}) => {
  return (
    <Box>
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
          onClick={() => setProductDialog({ open: true, product: { name: '', productNo: '', description: '', category: '', price: 0, isLoyaltyEnabled: true } })}
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
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Product Code</TableCell>
              <TableCell>Pack Size</TableCell>
              <TableCell>Price (LKR)</TableCell>
              <TableCell>Loyalty Points</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
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
                
                if (p.pointsPerProduct !== null && p.pointsPerProduct !== undefined) {
                  pointsDisplay = `${p.pointsPerProduct} pts (Fixed)`;
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
                        <IconButton size='small' color='error' onClick={() => handleDeleteProduct(p._id)} disabled={!hasPermission('canManageProducts') || !hasPermission('canDelete')} title='Delete Product'><Delete /></IconButton>
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
