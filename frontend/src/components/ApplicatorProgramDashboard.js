import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress, Chip, useTheme } from '@mui/material';
import { Star, TrendingUp, Group, MonetizationOn, PieChart as PieChartIcon } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api, { membersAPI } from '../services/api';

const ApplicatorProgramDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplicators: 0,
    totalPointsEarned: 0,
    totalRewardsCalculated: 0,
    topApplicators: [],
    trendData: [],
    pieData: []
  });
  
  const theme = useTheme();

  useEffect(() => {
    const fetchApplicatorStats = async () => {
      try {
        if (!api.hasCache('/members', { params: { limit: 10000, role: 'applicator' } })) setLoading(true);
        // Fetch all members to calculate applicator stats
        
        const processStats = (res) => {
          if (res.data && res.data.data) {
            const applicators = res.data.data;
            
            let totalPoints = 0;
            let totalRewards = 0;
          
          const monthlyData = {};
          const tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
          
          const applicatorsWithStats = applicators.map(app => {
            // Tier Logic
            const t = app.tier ? app.tier.toLowerCase() : 'bronze';
            if (tierCounts[t] !== undefined) tierCounts[t]++;
            else tierCounts['bronze']++;

            // Calculate total points and rewards from monthly purchases
            let appPoints = 0;
            let appRewards = 0;
            
            if (app.monthlyPurchases) {
              app.monthlyPurchases.forEach(mp => {
                // New system starting July 2026
                const isNewSystem = mp.year > 2026 || (mp.year === 2026 && mp.month >= 7);
                if (isNewSystem) {
                  appPoints += (mp.pointsEarned || 0);
                  appRewards += (mp.cashReward || 0);
                  
                  const key = `${mp.year}-${mp.month.toString().padStart(2, '0')}`;
                  if (!monthlyData[key]) monthlyData[key] = { month: key, points: 0, rewards: 0 };
                  monthlyData[key].points += (mp.pointsEarned || 0);
                  monthlyData[key].rewards += (mp.cashReward || 0);
                }
              });
            }
            
            totalPoints += appPoints;
            totalRewards += appRewards;
            
            return {
              ...app,
              newSystemPoints: appPoints,
              newSystemRewards: appRewards,
              tierLevel: t
            };
          });
          
          // Sort for leaderboard
          applicatorsWithStats.sort((a, b) => b.newSystemPoints - a.newSystemPoints);
          
          const trendData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
          const pieData = [
             { name: 'Bronze', value: tierCounts.bronze, color: '#CD7F32' },
             { name: 'Silver', value: tierCounts.silver, color: '#C0C0C0' },
             { name: 'Gold', value: tierCounts.gold, color: '#FFD700' },
             { name: 'Platinum', value: tierCounts.platinum, color: '#E5E4E2' }
          ].filter(d => d.value > 0);
          
            setStats({
              totalApplicators: applicators.length,
              totalPointsEarned: totalPoints,
              totalRewardsCalculated: totalRewards,
              topApplicators: applicatorsWithStats.slice(0, 10), // Top 10
              trendData,
              pieData
            });
          }
        };

        const res = await membersAPI.getAll({ limit: 10000, role: 'applicator' }, processStats);
        processStats(res);
      } catch (err) {
        console.error('Error fetching applicator stats:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplicatorStats();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h6' sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star color="primary" /> Applicator Points Program Summary
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Overview of the new 1 Point = 1 Rupee loyalty system for Applicators (From July 2026)
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.50', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Group color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">Total Applicators</Typography>
                  <Typography variant="h4" fontWeight={700}>{stats.totalApplicators}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.50', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Star color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">Total Points Earned (New System)</Typography>
                  <Typography variant="h4" fontWeight={700}>{stats.totalPointsEarned.toLocaleString()}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'info.50', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MonetizationOn color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">Total Rewards Generated (Rs.)</Typography>
                  <Typography variant="h4" fontWeight={700}>{stats.totalRewardsCalculated.toLocaleString()}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp /> Monthly Points Trend
              </Typography>
              {stats.trendData.length > 0 ? (
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `Rs.${new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}`} />
                      <RechartsTooltip formatter={(value) => value.toLocaleString()} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="points" name="Points Earned" stroke={theme.palette.primary.main} strokeWidth={3} activeDot={{ r: 8 }} />
                      <Line yAxisId="right" type="monotone" dataKey="rewards" name="Cash Reward (Rs.)" stroke={theme.palette.success.main} strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No point trends available yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PieChartIcon /> Applicator Tiers
              </Typography>
              {stats.pieData.length > 0 ? (
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No tier data available yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp /> Applicator Leaderboard (New System Points)
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Rank</strong></TableCell>
                  <TableCell><strong>Member ID</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Tier</strong></TableCell>
                  <TableCell align="right"><strong>Points (New System)</strong></TableCell>
                  <TableCell align="right"><strong>Rewards (Rs.)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.topApplicators.length > 0 ? stats.topApplicators.map((app, index) => (
                  <TableRow key={app.memberId} hover>
                    <TableCell>
                      <Chip 
                        label={`#${index + 1}`} 
                        size="small" 
                        color={index === 0 ? "warning" : index < 3 ? "primary" : "default"} 
                      />
                    </TableCell>
                    <TableCell>{app.memberId}</TableCell>
                    <TableCell>{app.memberName}</TableCell>
                    <TableCell>{app.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={app.tierLevel.charAt(0).toUpperCase() + app.tierLevel.slice(1)}
                        size="small"
                        sx={{
                          bgcolor: app.tierLevel === 'gold' ? '#FFD700' :
                                   app.tierLevel === 'silver' ? '#C0C0C0' :
                                   app.tierLevel === 'platinum' ? '#E5E4E2' : '#CD7F32',
                          color: app.tierLevel === 'silver' || app.tierLevel === 'platinum' ? '#000' : '#fff',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="primary.main">
                        {app.newSystemPoints.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="success.main">
                        {app.newSystemRewards.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No points earned in the new system yet.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApplicatorProgramDashboard;
