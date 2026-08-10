import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Paper, CircularProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Public, Devices, Insights } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function TrafficDashboard({ data, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  const { dailyTraffic = [], topPages = [], deviceStats = [] } = data;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Public color="primary" /> Web Traffic & Analytics (Last 30 Days)
      </Typography>
      
      <Grid container spacing={3}>
        {/* Traffic Over Time */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Insights color="action" /> Traffic Over Time
              </Typography>
              {dailyTraffic.length > 0 ? (
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTraffic} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="visits" name="Total Visits" stroke="#0196d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="uniqueUsers" name="Unique Visitors" stroke="#00C49F" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>No traffic data available yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Device Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Devices color="action" /> Device Breakdown
              </Typography>
              {deviceStats.length > 0 ? (
                <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={deviceStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {deviceStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {deviceStats.map((entry, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                        <Typography variant="caption">{entry.name}: {entry.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>No device data available yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Visited Pages */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Top Visited Pages
              </Typography>
              {topPages.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell>Page Path</TableCell>
                        <TableCell align="right">Total Views</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topPages.map((page, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{page.path}</TableCell>
                          <TableCell align="right">
                            <Chip label={page.views} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>No page view data available.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
