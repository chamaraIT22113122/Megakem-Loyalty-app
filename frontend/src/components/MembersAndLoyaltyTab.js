import React from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Grid, Card, CardContent
} from '@mui/material';
import { Settings, Download, EmojiEvents, Visibility, People, Engineering, Storefront } from '@mui/icons-material';

const MembersAndLoyaltyTab = ({
  members,
  scanHistory,
  memberSearchQuery,
  setMemberSearchQuery,
  memberRoleFilter,
  setMemberRoleFilter,
  memberTierFilter,
  setMemberTierFilter,
  memberSortKey,
  setMemberSortKey,
  setLoyaltyConfigTab,
  setLoyaltyConfigDialog,
  isMainAdmin,
  handleFixRoles,
  loading,
  exportToExcel,
  getTierDisplayName,
  setMemberId,
  setView
}) => {
  // Compute real-time stats and sort list
  let filteredMembers = members.filter(m => {
    const hasScans = scanHistory.some(s => s.memberId === m.memberId);
    const matchesSearch = !memberSearchQuery || 
      m.memberId?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.memberName?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.phone?.toLowerCase().includes(memberSearchQuery.toLowerCase());
    const matchesRole = memberRoleFilter === 'all' || m.role === memberRoleFilter;
    const matchesTier = memberTierFilter === 'all' || m.tier === memberTierFilter;
    return hasScans && matchesSearch && matchesRole && matchesTier;
  });

  // Map stats for sorting
  const membersWithStats = filteredMembers.map(m => {
    const memberScans = scanHistory.filter(s => s.memberId === m.memberId);
    const actualTotalScans = memberScans.length;
    const actualTotalAmount = memberScans.reduce((sum, s) => sum + (s.price || 0), 0);
    const actualTotalPoints = memberScans.reduce((sum, s) => sum + (s.points || 0), 0);
    return {
      member: m,
      scansCount: actualTotalScans,
      totalAmount: actualTotalAmount,
      totalPoints: actualTotalPoints
    };
  });

  // Sort members
  membersWithStats.sort((a, b) => {
    if (memberSortKey === 'points-desc') return b.totalPoints - a.totalPoints;
    if (memberSortKey === 'points-asc') return a.totalPoints - b.totalPoints;
    if (memberSortKey === 'scans-desc') return b.scansCount - a.scansCount;
    if (memberSortKey === 'scans-asc') return a.scansCount - b.scansCount;
    if (memberSortKey === 'amount-desc') return b.totalAmount - a.totalAmount;
    if (memberSortKey === 'name-asc') return (a.member.memberName || '').localeCompare(b.member.memberName || '');
    if (memberSortKey === 'name-desc') return (b.member.memberName || '').localeCompare(b.member.memberName || '');
    if (memberSortKey === 'id-asc') return (a.member.memberId || '').localeCompare(b.member.memberId || '');
    return 0;
  });

  const totalMembers = filteredMembers.length;
  const totalApplicators = filteredMembers.filter(m => m.role === 'applicator').length;
  const totalHardwares = filteredMembers.filter(m => m.role === 'customer').length;

  return (
    <Box>
      {/* Top Header & Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant='h5' sx={{ fontWeight: 800, color: 'text.primary' }}>
          Members & Loyalty Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant='contained'
            startIcon={<Settings />}
            onClick={() => {
              setLoyaltyConfigTab(0);
              setLoyaltyConfigDialog({ open: true });
            }}
            sx={{
              background: 'linear-gradient(135deg, #003366 0%, #00B4D8 100%)',
              boxShadow: '0 4px 14px 0 rgba(0,51,102,0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #001a33 0%, #003366 100%)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Loyalty & Tier Config
          </Button>
          {isMainAdmin && isMainAdmin() && (
            <Button
              variant='outlined'
              color='warning'
              size='small'
              onClick={handleFixRoles}
              disabled={loading}
              title='One-time fix: correct role for all MA->Applicator / MH->Hardware members'
              sx={{ whiteSpace: 'nowrap' }}
            >
              🔄 Fix Roles
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
            border: 'none', 
            boxShadow: '0 8px 32px 0 rgba(30, 60, 114, 0.3)', 
            borderRadius: 3,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 40px 0 rgba(30, 60, 114, 0.5)' }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                <People fontSize="large" sx={{ fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1.5 }}>TOTAL MEMBERS</Typography>
                <Typography variant="h3" fontWeight={800} color="white">{totalMembers}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #FF8008 0%, #FFA03A 100%)', 
            border: 'none', 
            boxShadow: '0 8px 32px 0 rgba(255, 128, 8, 0.3)', 
            borderRadius: 3,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 40px 0 rgba(255, 128, 8, 0.5)' }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                <Engineering fontSize="large" sx={{ fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1.5 }}>APPLICATORS</Typography>
                <Typography variant="h3" fontWeight={800} color="white">{totalApplicators}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', 
            border: 'none', 
            boxShadow: '0 8px 32px 0 rgba(17, 153, 142, 0.3)', 
            borderRadius: 3,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 40px 0 rgba(17, 153, 142, 0.5)' }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                <Storefront fontSize="large" sx={{ fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1.5 }}>HARDWARES</Typography>
                <Typography variant="h3" fontWeight={800} color="white">{totalHardwares}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters Bar */}
      <Paper sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 3, 
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth
              placeholder='Search by ID, name, phone...' 
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'primary.main' }}>🔍</Box>,
                sx: { borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField 
              fullWidth
              select 
              label='Role'
              value={memberRoleFilter}
              onChange={(e) => setMemberRoleFilter(e.target.value)}
              InputProps={{ sx: { borderRadius: 2 } }}
            >
              <MenuItem value='all'>All Roles</MenuItem>
              <MenuItem value='applicator'>Applicator</MenuItem>
              <MenuItem value='customer'>Hardware</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField 
              fullWidth
              select 
              label='Tier'
              value={memberTierFilter}
              onChange={(e) => setMemberTierFilter(e.target.value)}
              InputProps={{ sx: { borderRadius: 2 } }}
            >
              <MenuItem value='all'>All Tiers</MenuItem>
              <MenuItem value='bronze'>Bronze</MenuItem>
              <MenuItem value='silver'>Silver</MenuItem>
              <MenuItem value='gold'>Gold</MenuItem>
              <MenuItem value='platinum'>Platinum</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField 
              fullWidth
              select 
              label='Sort By'
              value={memberSortKey}
              onChange={(e) => setMemberSortKey(e.target.value)}
              InputProps={{ sx: { borderRadius: 2 } }}
            >
              <MenuItem value='points-desc'>Highest Points</MenuItem>
              <MenuItem value='points-asc'>Lowest Points</MenuItem>
              <MenuItem value='scans-desc'>Most Scans</MenuItem>
              <MenuItem value='scans-asc'>Least Scans</MenuItem>
              <MenuItem value='amount-desc'>Highest Value</MenuItem>
              <MenuItem value='name-asc'>Name (A-Z)</MenuItem>
              <MenuItem value='name-desc'>Name (Z-A)</MenuItem>
              <MenuItem value='id-asc'>ID (A-Z)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              fullWidth
              variant='contained' 
              startIcon={<Download />} 
              onClick={() => exportToExcel(membersWithStats, 'Members_Data')}
              sx={{ 
                height: 56, 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)',
                boxShadow: '0 4px 15px 0 rgba(74, 0, 224, 0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #3A00B0 0%, #7E1DD2 100%)' }
              }}
            >
              Export Excel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)', mb: 4, overflow: 'hidden' }}>
        <Table size='medium'>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(135deg, #003366 0%, #00B4D8 100%)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700, py: 2 }}>Member ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, py: 2 }}>Name & Phone</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, py: 2 }}>Role</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, py: 2 }}>Tier</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, py: 2 }}>Total Scans</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, py: 2 }}>Total Amount</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, py: 2 }}>Total Points</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, py: 2 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {membersWithStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align='center' sx={{ py: 4 }}>
                  <Typography variant='body1' color='text.secondary'>
                    {members.length === 0 
                      ? 'No members found. Members are created automatically when they scan products.'
                      : 'No members match your filters.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              membersWithStats.map(({ member: m, scansCount, totalAmount, totalPoints }) => (
                <TableRow key={m._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Typography variant='body2' fontWeight={600}>{m.memberId}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{m.memberName}</Typography>
                    {m.phone && <Typography variant='caption' color='text.secondary'>{m.phone}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={m.role === 'applicator' ? 'Applicator' : 'Hardware'} 
                      size='small' 
                      color={m.role === 'applicator' ? 'warning' : 'info'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getTierDisplayName(m.tier)} 
                      size='small' 
                      sx={{ 
                        fontWeight: 800,
                        bgcolor: 
                          m.tier === 'platinum' ? '#E5E4E2' :
                          m.tier === 'gold' ? '#FFD700' :
                          m.tier === 'silver' ? '#C0C0C0' : '#CD7F32',
                        color: m.tier === 'platinum' || m.tier === 'gold' || m.tier === 'silver' ? 'black' : 'white',
                        boxShadow: 1
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' fontWeight={600}>{scansCount}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`Rs. ${totalAmount.toLocaleString()}`}
                      size='small' 
                      color='primary' 
                      sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${totalPoints.toLocaleString()} pts`}
                      size='small' 
                      color='success' 
                      sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                      icon={<EmojiEvents sx={{ fontSize: '1rem !important' }} />}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size='small' 
                      color='info' 
                      onClick={() => {
                        setMemberId(m.memberId);
                        setView('profile');
                      }} 
                      title='View Member Profile'
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MembersAndLoyaltyTab;
