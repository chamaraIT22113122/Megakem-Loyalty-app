import React from 'react';
import { Card, CardContent, Grid, Skeleton, Box, List, ListItem } from '@mui/material';

// Skeleton for product cards
export const ProductCardSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
      </Box>
    </CardContent>
  </Card>
);

// Skeleton for table rows
export const TableRowSkeleton = ({ columns = 5 }) => (
  <>
    {[...Array(5)].map((_, index) => (
      <tr key={index}>
        {[...Array(columns)].map((_, colIndex) => (
          <td key={colIndex} style={{ padding: '16px' }}>
            <Skeleton variant="text" width="100%" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// Skeleton for list items
export const ListItemSkeleton = ({ count = 5 }) => (
  <>
    {[...Array(count)].map((_, index) => (
      <ListItem key={index} sx={{ py: 2 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="80%" height={24} />
          <Skeleton variant="text" width="60%" height={20} />
        </Box>
      </ListItem>
    ))}
  </>
);

// Skeleton for dashboard cards
export const DashboardCardSkeleton = () => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} />
        </Box>
        <Skeleton variant="circular" width={48} height={48} />
      </Box>
    </CardContent>
  </Card>
);

// Skeleton for charts
export const ChartSkeleton = ({ height = 300 }) => (
  <Box sx={{ width: '100%', height }}>
    <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 2 }} />
  </Box>
);

// Skeleton for user profile
export const ProfileSkeleton = () => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="circular" width={80} height={80} />
        <Box sx={{ ml: 2, flex: 1 }}>
          <Skeleton variant="text" width="50%" height={32} />
          <Skeleton variant="text" width="30%" height={24} />
        </Box>
      </Box>
      <Skeleton variant="text" width="100%" height={56} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="100%" height={56} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 2 }} />
    </CardContent>
  </Card>
);

// Skeleton for grid layout
export const GridSkeleton = ({ count = 6, columns = { xs: 12, sm: 6, md: 4 } }) => (
  <Grid container spacing={3}>
    {[...Array(count)].map((_, index) => (
      <Grid item key={index} {...columns}>
        <ProductCardSkeleton />
      </Grid>
    ))}
  </Grid>
);
