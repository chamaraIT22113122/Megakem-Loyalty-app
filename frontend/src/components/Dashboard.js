import React from 'react';
import { Box, Button, TextField, Typography, Card, CardContent, List, ListItem, ListItemText, Chip, Grid, Paper, Divider, Avatar, Tooltip, Badge, ButtonBase, ToggleButton, ToggleButtonGroup, IconButton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import { Dashboard as DashboardIcon, People, Category, TrendingUp, Star, Notifications, NotificationsOff, Assessment, FileDownload, CalendarMonth, NavigateBefore, NavigateNext, FilterList, Loop, Speed, ShowChart, Timeline, Build, Hardware, Sync, Insights } from '@mui/icons-material';
import { BarChart, Bar, PieChart, Pie, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard(props) {
  const { stats, scanHistory, dashboardStartDate, dashboardEndDate, setDashboardStartDate, setDashboardEndDate, dateFilter, setDateFilter, loadAdminData, notificationPrefs, setNotificationPrefs, autoRefresh, setAutoRefresh, showCalendarView, setShowCalendarView, calendarViewMonth, setCalendarViewMonth, calendarViewYear, setCalendarViewYear, selectedCalendarDate, setSelectedCalendarDate, dailyReport, setDailyReport, loadCalendarData, getRelativeTime, setExpandedCardDialog, handleExportAllScans, handleExportProducts, isMainAdmin, handleExportUsers, activityLog, members, handlePreviousMonth, handleNextMonth, calendarData, handleCalendarDateChange, setDailyReportDialog, comparisonData, allScans, products, getTrendChartData, SriLankaZoneMap, applicatorStats, users } = props;

            const filteredDashboardScans = scanHistory.filter(scan => {
              if (!dashboardStartDate && !dashboardEndDate) return true;
              const scanDate = new Date(scan.timestamp);
              if (dashboardStartDate && scanDate < new Date(dashboardStartDate)) return false;
              if (dashboardEndDate && scanDate > new Date(dashboardEndDate).setHours(23, 59, 59, 999)) return false;
              return true;
            });
            return (
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {/* Dashboard Header with Controls */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant='h5' sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DashboardIcon /> Dashboard Overview
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TextField
                    type="date"
                    size="small"
                    label="Start Date"
                    InputLabelProps={{ shrink: true }}
                    value={dashboardStartDate}
                    onChange={(e) => setDashboardStartDate(e.target.value)}
                    sx={{ width: 140, bgcolor: 'white' }}
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="End Date"
                    InputLabelProps={{ shrink: true }}
                    value={dashboardEndDate}
                    onChange={(e) => setDashboardEndDate(e.target.value)}
                    sx={{ width: 140, bgcolor: 'white' }}
                  />
                  {/* Date Filter */}
                  <ToggleButtonGroup
                    value={dateFilter}
                    exclusive
                    onChange={(e, newFilter) => {
                      if (newFilter !== null) {
                        setDateFilter(newFilter);
                        if (newFilter !== 'custom') {
                          loadAdminData(); // Reload with new filter
                        }
                      }
                    }}
                    size='small'
                  >
                    <ToggleButton value='today'>
                      <Tooltip title='Today'>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Today
                        </Box>
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value='7days'>
                      <Tooltip title='Last 7 Days'>
                        <Box>7D</Box>
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value='30days'>
                      <Tooltip title='Last 30 Days'>
                        <Box>30D</Box>
                      </Tooltip>
                    </ToggleButton>
                  </ToggleButtonGroup>
                  
                  {/* Notification Chime Toggle */}
                  <Tooltip title={notificationPrefs.soundEnabled ? 'Sound notifications ON' : 'Sound notifications OFF'}>
                    <IconButton
                      color={notificationPrefs.soundEnabled ? 'primary' : 'default'}
                      onClick={() => setNotificationPrefs(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                      sx={{
                        border: '1px solid',
                        borderColor: notificationPrefs.soundEnabled ? 'primary.main' : 'grey.300',
                        p: '7px'
                      }}
                    >
                      {notificationPrefs.soundEnabled ? <Notifications sx={{ fontSize: '1.2rem' }} /> : <NotificationsOff sx={{ fontSize: '1.2rem', color: 'text.disabled' }} />}
                    </IconButton>
                  </Tooltip>

                  {/* Auto Refresh Toggle */}
                  <Tooltip title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}>
                    <IconButton 
                      color={autoRefresh ? 'primary' : 'default'}
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      sx={{ 
                        border: '1px solid',
                        borderColor: autoRefresh ? 'primary.main' : 'grey.300',
                        p: '7px'
                      }}
                    >
                      <Loop sx={{ fontSize: '1.2rem', animation: autoRefresh ? 'spin 2s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
                    </IconButton>
                  </Tooltip>
                  
                  {/* Calendar Toggle */}
                  <Button
                    variant={showCalendarView ? 'contained' : 'outlined'}
                    startIcon={<CalendarMonth />}
                    onClick={() => {
                      setShowCalendarView(!showCalendarView);
                      if (!showCalendarView) {
                        const today = new Date();
                        setCalendarViewMonth(today.getMonth());
                        setCalendarViewYear(today.getFullYear());
                        setSelectedCalendarDate(today);
                        setDailyReport(null); // Clear any previous report
                        loadCalendarData(today.getFullYear(), today.getMonth());
                      }
                    }}
                    sx={{ fontWeight: 600, py: '7px' }}
                  >
                    {showCalendarView ? 'Hide Calendar' : 'Calendar View'}
                  </Button>
                </Box>
              </Box>
            </Grid>
            
            {/* Quick Performance Metrics Bar */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 2, 
                background: 'linear-gradient(135deg, #003366 0%, #001a33 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: 2
              }}>
                <Typography variant='subtitle2' gutterBottom sx={{ opacity: 0.9, fontWeight: 600 }}>
                  <Speed sx={{ fontSize: '1rem', mr: 0.5 }} /> Quick Performance Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant='caption' sx={{ opacity: 0.8 }}>Avg Scans/Day</Typography>
                      <Typography variant='h6' fontWeight={700}>
                        {stats.dailyStats && stats.dailyStats.length > 0 
                          ? Math.round(stats.total / stats.dailyStats.length)
                          : stats.total}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant='caption' sx={{ opacity: 0.8 }}>App/Cust Ratio</Typography>
                      <Typography variant='h6' fontWeight={700}>
                        {stats.customer > 0 ? (stats.applicator / stats.customer).toFixed(2) : stats.applicator}:1
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant='caption' sx={{ opacity: 0.8 }}>Scans This Week</Typography>
                      <Typography variant='h6' fontWeight={700}>
                        {stats.lastWeek || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant='caption' sx={{ opacity: 0.8 }}>Active Products</Typography>
                      <Typography variant='h6' fontWeight={700}>
                        {stats.topProducts?.length || 0}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Calendar View Section */}
            {showCalendarView && (
              <>
                <Grid item xs={12}>
                  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'grey.200' }}>
                    <CardContent>
                      <Typography variant='h6' gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarMonth /> Sales & Scans Calendar
                      </Typography>
                      
                      {/* Custom Calendar Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
                        <IconButton onClick={handlePreviousMonth} size='small'>
                          <NavigateBefore />
                        </IconButton>
                        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                          {new Date(calendarViewYear, calendarViewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Typography>
                        <IconButton onClick={handleNextMonth} size='small'>
                          <NavigateNext />
                        </IconButton>
                      </Box>

                      {/* Calendar Grid */}
                      <Box sx={{ width: '100%' }}>
                        {/* Day Labels */}
                        <Grid container spacing={0} sx={{ mb: 1 }}>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <Grid item xs key={day} sx={{ textAlign: 'center' }}>
                              <Typography variant='caption' sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                {day}
                              </Typography>
                            </Grid>
                          ))}
                        </Grid>

                        {/* Calendar Days */}
                        <Grid container spacing={0.5}>
                          {(() => {
                            const firstDay = new Date(calendarViewYear, calendarViewMonth, 1).getDay();
                            const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
                            const today = new Date();
                            const isCurrentMonth = today.getMonth() === calendarViewMonth && today.getFullYear() === calendarViewYear;
                            
                            const days = [];
                            
                            // Empty cells before first day
                            for (let i = 0; i < firstDay; i++) {
                              days.push(
                                <Grid item xs key={`empty-${i}`} sx={{ aspectRatio: '1/1' }}>
                                  <Box sx={{ height: '100%' }} />
                                </Grid>
                              );
                            }
                            
                            // Calendar days
                            for (let day = 1; day <= daysInMonth; day++) {
                              const dayData = calendarData.find(d => d.date === day);
                              const hasScanData = dayData && dayData.scans > 0;
                              const isToday = isCurrentMonth && today.getDate() === day;
                              const isSelected = selectedCalendarDate && 
                                                selectedCalendarDate.getDate() === day && 
                                                selectedCalendarDate.getMonth() === calendarViewMonth &&
                                                selectedCalendarDate.getFullYear() === calendarViewYear;
                              
                              days.push(
                                <Grid item xs key={day} sx={{ aspectRatio: '1/1' }}>
                                  <Badge
                                    badgeContent={hasScanData ? dayData.scans : undefined}
                                    color='primary'
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      '& .MuiBadge-badge': {
                                        fontSize: '0.6rem',
                                        height: '16px',
                                        minWidth: '16px',
                                        padding: '0 4px'
                                      }
                                    }}
                                  >
                                    <ButtonBase
                                      onClick={() => handleCalendarDateChange(new Date(calendarViewYear, calendarViewMonth, day))}
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        minHeight: 40,
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: hasScanData 
                                          ? `rgba(16, 185, 129, ${Math.max(0.12, Math.min(1.0, dayData.scans / 10))})` 
                                          : 'transparent',
                                        border: isToday ? '2px solid' : isSelected ? '2px solid' : '1px solid transparent',
                                        borderColor: isToday ? 'primary.main' : isSelected ? 'primary.dark' : 'transparent',
                                        fontWeight: isSelected || isToday ? 700 : 400,
                                        color: isSelected ? 'primary.main' : isToday ? 'primary.main' : (hasScanData ? 'success.dark' : 'text.primary'),
                                        '&:hover': {
                                          bgcolor: hasScanData 
                                            ? `rgba(16, 185, 129, ${Math.max(0.25, Math.min(1.0, dayData.scans / 8))})` 
                                            : 'action.hover'
                                        }
                                      }}
                                    >
                                      <Typography variant='body2' sx={{ fontWeight: 'inherit' }}>
                                        {day}
                                      </Typography>
                                    </ButtonBase>
                                  </Badge>
                                </Grid>
                              );
                            }
                            
                            return days;
                          })()}
                        </Grid>
                      </Box>

                      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                          💡 Tip: Click on any date to view detailed daily report
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          📊 Badges show number of scans per day
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Day Breakdown Card inside Dashboard Page */}
                {selectedCalendarDate && (
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'grey.200' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                          <Typography variant='h6' sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarMonth color="primary" /> Report for {selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </Typography>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => setDailyReportDialog({ open: true, date: selectedCalendarDate })}
                            startIcon={<Assessment />}
                            sx={{ fontWeight: 600 }}
                          >
                            View Full Report Dashboard
                          </Button>
                        </Box>
                        
                        {!dailyReport ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
                            <CircularProgress size={30} />
                            <Typography variant="body2" color="text.secondary">Loading day breakdown...</Typography>
                          </Box>
                        ) : dailyReport.summary?.totalScans === 0 ? (
                          <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary" fontWeight={600}>
                              No scans recorded on this day.
                            </Typography>
                          </Box>
                        ) : (
                          <Grid container spacing={2}>
                            {/* Quick stats for the day */}
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total Scans</Typography>
                                    <Typography variant="h5" fontWeight={800} color="primary.main">{dailyReport.summary.totalScans}</Typography>
                                  </Box>
                                  <ShowChart color="primary" sx={{ fontSize: '2rem', opacity: 0.7 }} />
                                </Paper>
                                
                                <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Active Members</Typography>
                                    <Typography variant="h5" fontWeight={800} color="secondary.main">{dailyReport.summary.uniqueMembers}</Typography>
                                  </Box>
                                  <People color="secondary" sx={{ fontSize: '2rem', opacity: 0.7 }} />
                                </Paper>
                                
                                <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Products Scanned</Typography>
                                    <Typography variant="h5" fontWeight={800} color="success.main">{dailyReport.summary.uniqueProducts}</Typography>
                                  </Box>
                                  <Category color="success" sx={{ fontSize: '2rem', opacity: 0.7 }} />
                                </Paper>
                              </Box>
                            </Grid>

                            {/* Top Product / Member of the day */}
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>Top scanning member</Typography>
                                  {dailyReport.topMembers && dailyReport.topMembers[0] ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.85rem', fontWeight: 600 }}>
                                        {dailyReport.topMembers[0].name ? dailyReport.topMembers[0].name.substring(0, 2).toUpperCase() : 'M'}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="body2" fontWeight={700}>{dailyReport.topMembers[0].name || dailyReport.topMembers[0].memberId}</Typography>
                                        <Typography variant="caption" color="text.secondary">{dailyReport.topMembers[0].count} scans ({((dailyReport.topMembers[0].count / dailyReport.summary.totalScans) * 100).toFixed(0)}% share)</Typography>
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">None</Typography>
                                  )}
                                </Paper>
                                
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>Top product scanned</Typography>
                                  {dailyReport.topProducts && dailyReport.topProducts[0] ? (
                                    <Box>
                                      <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        📦 {dailyReport.topProducts[0].productName || dailyReport.topProducts[0]._id}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        Pack Size: {dailyReport.topProducts[0].qty || 'N/A'} • {dailyReport.topProducts[0].count} scans
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">None</Typography>
                                  )}
                                </Paper>
                              </Box>
                            </Grid>

                            {/* Daily Scans Timeline preview */}
                            <Grid item xs={12} sm={4}>
                              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: '100%', maxHeight: 200, overflow: 'auto' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                  Scans Timeline ({dailyReport.scans?.length || 0})
                                </Typography>
                                <List dense sx={{ p: 0 }}>
                                  {dailyReport.scans?.slice(0, 3).map((scan, i) => {
                                    const isManual = scan.isManual || scan.type === 'manual' || !scan.qrCodeId;
                                    const scanTime = scan.scannedAt || scan.createdAt || scan.timestamp;
                                    return (
                                      <ListItem key={i} sx={{ px: 0.5, py: 0.5 }} divider={i < 2}>
                                        <ListItemText
                                          primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <Typography variant="caption" fontWeight={700}>
                                                {scan.memberName || scan.memberId || 'Member'}
                                              </Typography>
                                              <Typography variant="caption" color="text.secondary">
                                                {scanTime ? new Date(scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                              </Typography>
                                            </Box>
                                          }
                                          secondary={
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                              {scan.productNo} ({scan.qty || 'N/A'}) • {isManual ? 'Manual' : 'QR'}
                                            </Typography>
                                          }
                                          primaryTypographyProps={{ component: 'div' }}
                                          secondaryTypographyProps={{ component: 'div' }}
                                        />
                                      </ListItem>
                                    );
                                  })}
                                  {dailyReport.scans?.length > 3 && (
                                    <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 0.5, textAlign: 'center', cursor: 'pointer', fontWeight: 600 }} onClick={() => setDailyReportDialog({ open: true, date: selectedCalendarDate })}>
                                      + {dailyReport.scans.length - 3} more scans
                                    </Typography>
                                  )}
                                </List>
                              </Paper>
                            </Grid>
                          </Grid>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </>
            )}

            {/* Core Summary Cards with hover scale transitions */}
            <Grid item xs={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #003366 0%, #1e40af 100%)', 
                color: 'white',
                position: 'relative',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 20px -10px rgba(0,0,0,0.3)' }
              }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant='h4' sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, fontWeight: 'bold', mb: 0.5 }}>
                        {comparisonData ? comparisonData.scans.current : stats.total}
                      </Typography>
                      <Typography variant='body2' sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, opacity: 0.9 }}>
                        Total Scans
                      </Typography>
                    </Box>
                    <Tooltip title='Scan activity in selected period'>
                      <ShowChart sx={{ opacity: 0.5, fontSize: '2rem' }} />
                    </Tooltip>
                  </Box>
                  {comparisonData && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      <Box sx={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 0.5, 
                        px: 1, 
                        py: 0.25, 
                        borderRadius: 1.5, 
                        bgcolor: comparisonData.scans.change > 0 ? 'rgba(16, 185, 129, 0.2)' : (comparisonData.scans.change === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                        color: comparisonData.scans.change > 0 ? '#10b981' : (comparisonData.scans.change === 0 ? '#e5e7eb' : '#f87171'),
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        <span>{comparisonData.scans.change > 0 ? '▲' : (comparisonData.scans.change === 0 ? '■' : '▼')}</span>
                        <span>{comparisonData.scans.change > 0 ? '+' : ''}{comparisonData.scans.change}%</span>
                      </Box>
                      <Typography variant='caption' sx={{ opacity: 0.8, fontSize: '0.7rem' }}>vs prev period</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                color: 'white',
                position: 'relative',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 20px -10px rgba(0,0,0,0.3)' }
              }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ width: '80%' }}>
                      <Typography variant='h4' sx={{ fontSize: { xs: '1.25rem', sm: '1.6rem', md: '1.9rem', lg: '2.2rem' }, fontWeight: 'bold', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Rs. {(comparisonData ? comparisonData.value.current : allScans.reduce((total, scan) => { 
                          const product = products.find(p => 
                            p.productNo.toUpperCase() === scan.productNo.toUpperCase() && 
                            p.category && scan.qty && p.category.toUpperCase() === scan.qty.toUpperCase()
                          ); 
                          const price = product ? product.price : (scan.price || 0);
                          return total + price; 
                        }, 0)).toLocaleString()}
                      </Typography>
                      <Typography variant='body2' sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, opacity: 0.9 }}>
                        Est. Value
                      </Typography>
                    </Box>
                    <Tooltip title='Estimated product value scanned'>
                      <Star sx={{ opacity: 0.5, fontSize: '2rem' }} />
                    </Tooltip>
                  </Box>
                  {comparisonData && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      <Box sx={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 0.5, 
                        px: 1, 
                        py: 0.25, 
                        borderRadius: 1.5, 
                        bgcolor: comparisonData.value.change > 0 ? 'rgba(16, 185, 129, 0.2)' : (comparisonData.value.change === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                        color: comparisonData.value.change > 0 ? '#10b981' : (comparisonData.value.change === 0 ? '#e5e7eb' : '#f87171'),
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        <span>{comparisonData.value.change > 0 ? '▲' : (comparisonData.value.change === 0 ? '■' : '▼')}</span>
                        <span>{comparisonData.value.change > 0 ? '+' : ''}{comparisonData.value.change}%</span>
                      </Box>
                      <Typography variant='caption' sx={{ opacity: 0.8, fontSize: '0.7rem' }}>vs prev period</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', 
                color: 'white',
                position: 'relative',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 20px -10px rgba(0,0,0,0.3)' }
              }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant='h4' sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, fontWeight: 'bold', mb: 0.5 }}>
                        {stats.applicator}
                      </Typography>
                      <Typography variant='body2' sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, opacity: 0.9 }}>
                        Applicators
                      </Typography>
                    </Box>
                    <Tooltip title='Total Applicator scans'>
                      <Build sx={{ opacity: 0.5, fontSize: '2rem' }} />
                    </Tooltip>
                  </Box>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant='caption' sx={{ opacity: 0.9, fontWeight: 600, bgcolor: 'rgba(255,255,255,0.15)', px: 1, py: 0.5, borderRadius: 1 }}>
                      {stats.total > 0 ? ((stats.applicator / stats.total) * 100).toFixed(1) : 0}% of scans
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', 
                color: 'white',
                position: 'relative',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 20px -10px rgba(0,0,0,0.3)' }
              }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant='h4' sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, fontWeight: 'bold', mb: 0.5 }}>
                        {stats.customer}
                      </Typography>
                      <Typography variant='body2' sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, opacity: 0.9 }}>
                        Hardwares
                      </Typography>
                    </Box>
                    <Tooltip title='Total Hardware scans'>
                      <People sx={{ opacity: 0.5, fontSize: '2rem' }} />
                    </Tooltip>
                  </Box>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant='caption' sx={{ opacity: 0.9, fontWeight: 600, bgcolor: 'rgba(255,255,255,0.15)', px: 1, py: 0.5, borderRadius: 1 }}>
                      {stats.total > 0 ? ((stats.customer / stats.total) * 100).toFixed(1) : 0}% of scans
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Trend Chart and Live activity stream side-by-side */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'grey.100' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                      <Timeline color="primary" /> Scan & Value Trends
                    </Typography>
                    <Chip 
                      label={dateFilter === 'today' ? 'Hourly (Today)' : dateFilter === '7days' ? 'Daily (7 Days)' : 'Daily (30 Days)'} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <ResponsiveContainer width='100%' height={300}>
                    <AreaChart data={getTrendChartData(allScans)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#003366" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#003366" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A4D233" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#A4D233" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray='3 3' stroke='#f3f4f6' />
                      <XAxis dataKey='label' tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(val) => `Rs.${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        formatter={(value, name) => {
                          if (name === 'scans') return [`${value} scans`, 'Scans'];
                          return [`Rs. ${value.toLocaleString()}`, 'Est. Value'];
                        }}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="scans" stroke="#003366" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScans)" name="scans" />
                      <Area yAxisId="right" type="monotone" dataKey="value" stroke="#A4D233" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" name="value" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'grey.100' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                        boxShadow: '0 0 8px #ef4444',
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(0.95)', opacity: 0.5, boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
                          '70%': { transform: 'scale(1.2)', opacity: 1, boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)' },
                          '100%': { transform: 'scale(0.95)', opacity: 0.5, boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' }
                        }
                      }} />
                      <Typography variant='h6' sx={{ fontWeight: 700 }}>
                        Live Activity Feed
                      </Typography>
                    </Box>
                    <Chip 
                      label="Auto-Sync active" 
                      size="small" 
                      color="success" 
                      variant="filled" 
                      sx={{ fontWeight: 600, bgcolor: 'rgba(16, 185, 129, 0.1)', color: 'success.dark', border: 'none' }}
                    />
                  </Box>

                  {/* List of scans with relative time and type badges */}
                  <List sx={{ maxHeight: 300, overflow: 'auto', p: 0 }}>
                    {filteredDashboardScans && filteredDashboardScans.length > 0 ? (
                      filteredDashboardScans.slice(0, 10).map((scan, index) => {
                        const isManual = scan.isManual || scan.type === 'manual' || !scan.qrCodeId;
                        const isApplicator = scan.memberRole?.toLowerCase() === 'applicator' || (members.find(m => m.memberId === scan.memberId)?.role?.toLowerCase() === 'applicator');
                        const memberName = scan.memberName || members.find(m => m.memberId === scan.memberId)?.name || scan.memberId || 'Unknown Member';
                        
                        // Helper to get relative time
                        const getRelativeTime = (dateString) => {
                          if (!dateString) return 'Just now';
                          const date = new Date(dateString);
                          const diffMs = new Date() - date;
                          const diffMins = Math.floor(diffMs / 60000);
                          if (diffMins < 1) return 'Just now';
                          if (diffMins < 60) return `${diffMins}m ago`;
                          const diffHrs = Math.floor(diffMins / 60);
                          if (diffHrs < 24) return `${diffHrs}h ago`;
                          return date.toLocaleDateString();
                        };

                        return (
                          <Box key={scan._id || index}>
                            <ListItem 
                              alignItems="flex-start" 
                              sx={{ 
                                px: 1.5, 
                                py: 1, 
                                borderRadius: 2, 
                                mb: 1, 
                                transition: 'background-color 0.2s',
                                '&:hover': { bgcolor: 'action.hover' } 
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                      {memberName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                      {getRelativeTime(scan.scannedAt || scan.createdAt || scan.timestamp)}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600 }}>
                                      Product: {scan.productName || scan.productNo} ({scan.qty || 'N/A'})
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
                                      {/* Scan Type Badge */}
                                      <Chip 
                                        label={isManual ? '✨ Manual' : '📱 QR-Code'} 
                                        size="small" 
                                        sx={{ 
                                          height: 20, 
                                          fontSize: '0.675rem', 
                                          fontWeight: 700,
                                          bgcolor: isManual ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                          color: isManual ? '#d97706' : '#2563eb',
                                          border: 'none'
                                        }} 
                                      />
                                      {/* Role Chip */}
                                      <Chip 
                                        label={isApplicator ? 'App' : 'HW'} 
                                        size="small" 
                                        color={isApplicator ? 'error' : 'info'} 
                                        variant="outlined"
                                        sx={{ 
                                          height: 20, 
                                          fontSize: '0.675rem', 
                                          fontWeight: 700,
                                          px: 0.5
                                        }} 
                                      />
                                      {/* Location Badge */}
                                      {scan.location && (
                                        <Chip 
                                          label={`📍 ${scan.location}`} 
                                          size="small" 
                                          variant="outlined"
                                          sx={{ 
                                            height: 20, 
                                            fontSize: '0.675rem', 
                                            fontWeight: 500,
                                            color: 'text.secondary',
                                            borderColor: 'grey.300'
                                          }} 
                                        />
                                      )}
                                      {/* Connected Hardware Badge */}
                                      {isApplicator && scan.connectedHardware && (
                                        <Chip 
                                          label={`🏬 ${scan.connectedHardware}`} 
                                          size="small" 
                                          variant="outlined"
                                          color="info"
                                          sx={{ 
                                            height: 20, 
                                            fontSize: '0.675rem', 
                                            fontWeight: 600,
                                            color: 'info.dark',
                                            borderColor: 'info.light',
                                            bgcolor: 'info.50'
                                          }} 
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                }
                                primaryTypographyProps={{ component: 'div' }}
                                secondaryTypographyProps={{ component: 'div' }}
                              />
                            </ListItem>
                            {index < Math.min(filteredDashboardScans.length, 10) - 1 && <Divider component="li" sx={{ opacity: 0.6 }} />}
                          </Box>
                        );
                      })
                    ) : (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No recent scans available.
                        </Typography>
                      </Box>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Sri Lanka Zone Distribution Map */}
            <Grid item xs={12}>
              <SriLankaZoneMap members={applicatorStats?.memberLocations || members} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  borderRadius: 3,
                  boxShadow: 3,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                }}
                onClick={() => {
                  const allLocations = filteredDashboardScans.filter(s => s.location).reduce((acc, scan) => { 
                    const existing = acc.find(l => l.location === scan.location); 
                    if (existing) { existing.count++; } 
                    else { acc.push({ location: scan.location, count: 1 }); } 
                    return acc; 
                  }, []).sort((a, b) => b.count - a.count);
                  setExpandedCardDialog({ open: true, type: 'locations', data: allLocations });
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                      📍 Top Cities
                    </Typography>
                    {filteredDashboardScans.filter(s => s.location).reduce((acc, scan) => { 
                      const existing = acc.find(l => l.location === scan.location); 
                      if (existing) { existing.count++; } 
                      else { acc.push({ location: scan.location, count: 1 }); } 
                      return acc; 
                    }, []).length > 6 && (
                      <Chip 
                        label={`+${filteredDashboardScans.filter(s => s.location).reduce((acc, scan) => { 
                          const existing = acc.find(l => l.location === scan.location); 
                          if (existing) { existing.count++; } 
                          else { acc.push({ location: scan.location, count: 1 }); } 
                          return acc; 
                        }, []).length - 6} more`}
                        size='small'
                        color='primary'
                      />
                    )}
                  </Box>
                  <List dense>
                    {filteredDashboardScans.filter(s => s.location).reduce((acc, scan) => { 
                      const existing = acc.find(l => l.location === scan.location); 
                      if (existing) { existing.count++; } 
                      else { acc.push({ location: scan.location, count: 1 }); } 
                      return acc; 
                    }, []).sort((a, b) => b.count - a.count).slice(0, 6).map((loc, i) => 
                      <ListItem key={i} sx={{ borderLeft: '3px solid', borderLeftColor: i === 0 ? 'success.main' : 'grey.400', mb: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <ListItemText 
                          primary={<Typography variant='body1' fontWeight={600}>{loc.location}</Typography>} 
                          secondary={<Chip label={`${loc.count} scans`} size='small' color={i === 0 ? 'success' : 'default'} />} 
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    )}
                  </List>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                    Click to view all cities
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Price Estimation by Product next to Top Cities */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  borderRadius: 3,
                  boxShadow: 3,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                }}
                onClick={() => {
                  const productStats = filteredDashboardScans.reduce((acc, scan) => { 
                    const product = products.find(p => 
                      p.productNo.toUpperCase() === scan.productNo.toUpperCase() && 
                      p.category && scan.qty && p.category.toUpperCase() === scan.qty.toUpperCase()
                    ); 
                    const key = `${scan.productNo}-${scan.qty || 'N/A'}`;
                    if (!acc[key]) { 
                      acc[key] = { 
                        productNo: scan.productNo,
                        name: product ? product.name : scan.productName || 'Unknown Product',
                        packSize: scan.qty || 'N/A', 
                        price: product ? product.price : (scan.price || 0),
                        scans: 0, 
                        totalQty: 0 
                      }; 
                    } 
                    acc[key].scans += 1; 
                    acc[key].totalQty += 1; 
                    return acc; 
                  }, {}); 
                  const sortedData = Object.entries(productStats)
                    .sort((a, b) => (b[1].price * b[1].totalQty) - (a[1].price * a[1].totalQty))
                    .map(([key, data]) => ({
                      productName: data.name,
                      packSize: data.packSize,
                      unitPrice: data.price || 0,
                      totalScans: data.scans,
                      estimatedValue: (data.price || 0) * data.totalQty
                    }));
                  setExpandedCardDialog({ open: true, type: 'priceEstimation', data: sortedData });
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                      💵 Price Estimation by Product
                    </Typography>
                    {(() => {
                      const productStats = filteredDashboardScans.reduce((acc, scan) => { 
                        const key = `${scan.productNo}-${scan.qty || 'N/A'}`;
                        if (!acc[key]) acc[key] = true;
                        return acc; 
                      }, {});
                      const totalProducts = Object.keys(productStats).length;
                      return totalProducts > 6 && (
                        <Chip 
                          label={`+${totalProducts - 6} more`}
                          size='small'
                          color='primary'
                        />
                      );
                    })()}
                  </Box>
                  <TableContainer sx={{ overflowX: 'auto', maxHeight: 275 }}>
                    <Table size='small' stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Pack Size</TableCell>
                          <TableCell align='right' sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                          <TableCell align='right' sx={{ fontWeight: 700 }}>Total Scans</TableCell>
                          <TableCell align='right' sx={{ fontWeight: 700 }}>Est. Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => { 
                          const productStats = filteredDashboardScans.reduce((acc, scan) => { 
                            const product = products.find(p => 
                              p.productNo.toUpperCase() === scan.productNo.toUpperCase() && 
                              p.category && scan.qty && p.category.toUpperCase() === scan.qty.toUpperCase()
                            ); 
                            const key = `${scan.productNo}-${scan.qty || 'N/A'}`;
                            if (!acc[key]) { 
                              acc[key] = { 
                                productNo: scan.productNo,
                                name: product ? product.name : scan.productName || 'Unknown Product',
                                packSize: scan.qty || 'N/A', 
                                price: product ? product.price : (scan.price || 0),
                                scans: 0, 
                                totalQty: 0 
                              }; 
                            } 
                            acc[key].scans += 1; 
                            acc[key].totalQty += 1; 
                            return acc; 
                          }, {}); 
                          return Object.entries(productStats).sort((a, b) => (b[1].price * b[1].totalQty) - (a[1].price * a[1].totalQty)).slice(0, 6).map(([key, data]) => 
                            <TableRow key={key} sx={{ '&:hover': { bgcolor: 'action.hover' }, bgcolor: data.price === 0 ? 'warning.50' : 'inherit' }}>
                              <TableCell>
                                <Typography variant='body2' fontWeight={600}>{data.name}</Typography>
                                <Typography variant='caption' color='text.secondary'>{data.productNo}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={data.packSize} size='small' variant='outlined' color={data.price === 0 ? 'warning' : 'default'} />
                              </TableCell>
                              <TableCell align='right'>
                                {data.price > 0 ? 
                                  <Typography variant='body2' fontWeight={600}>Rs. {data.price.toLocaleString()}</Typography> : 
                                  <Typography variant='body2' fontWeight={600} color='warning.main'>Not Set</Typography>
                                }
                              </TableCell>
                              <TableCell align='right'>
                                <Chip label={data.scans} size='small' color='primary' />
                              </TableCell>
                              <TableCell align='right'>
                                <Typography variant='body1' fontWeight={700} color={data.price > 0 ? 'success.main' : 'warning.main'}>
                                  Rs. {(data.price * data.totalQty).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ); 
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='body1' fontWeight={700} color='success.dark'>Grand Total Estimated Value:</Typography>
                    <Typography variant='h5' fontWeight={800} color='success.dark'>
                      Rs. {filteredDashboardScans.reduce((total, scan) => { 
                        const product = products.find(p => 
                          p.productNo.toUpperCase() === scan.productNo.toUpperCase() && 
                          p.category && scan.qty && p.category.toUpperCase() === scan.qty.toUpperCase()
                        ); 
                        const price = product ? product.price : (scan.price || 0);
                        return total + price; 
                      }, 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                    Click to view complete price estimation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Advanced Insights Section */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'info.lighter', borderLeft: '4px solid', borderLeftColor: 'info.main' }}>
                <Typography variant='h6' sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment /> Key Insights & Trends
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant='caption' color='text.secondary'>
                          Average Scans per City
                        </Typography>
                        <Typography variant='h5' fontWeight={700} color='primary.main'>
                          {(() => {
                            const locations = filteredDashboardScans.filter(s => s.location).reduce((acc, scan) => { 
                              const existing = acc.find(l => l.location === scan.location); 
                              if (existing) { existing.count++; } 
                              else { acc.push({ location: scan.location, count: 1 }); } 
                              return acc; 
                            }, []);
                            return locations.length > 0 ? Math.round(filteredDashboardScans.length / locations.length) : 0;
                          })()}
                        </Typography>
                        <Typography variant='caption' color='success.main' sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <TrendingUp sx={{ fontSize: '0.9rem' }} /> Active cities: {filteredDashboardScans.filter(s => s.location).reduce((acc, scan) => { 
                            const existing = acc.find(l => l.location === scan.location); 
                            if (existing) { existing.count++; } 
                            else { acc.push({ location: scan.location, count: 1 }); } 
                            return acc; 
                          }, []).length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant='caption' color='text.secondary'>
                          Peak Hour Activity
                        </Typography>
                        <Typography variant='h5' fontWeight={700} color='secondary.main'>
                          {(() => {
                            const hourCounts = {};
                            filteredDashboardScans.forEach(scan => {
                              try {
                                let scanDate = null;
                                if (scan.scannedAt) scanDate = new Date(scan.scannedAt);
                                else if (scan.createdAt) scanDate = new Date(scan.createdAt);
                                else if (scan.timestamp) scanDate = new Date(scan.timestamp);
                                
                                if (scanDate && !isNaN(scanDate.getTime())) {
                                  const hour = scanDate.getHours();
                                  hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                                }
                              } catch (e) {}
                            });
                            const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, '0');
                            return `${peakHour}:00`;
                          })()}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
                          Most active scanning time
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant='caption' color='text.secondary'>
                          Scans per Member
                        </Typography>
                        <Typography variant='h5' fontWeight={700} color='warning.main'>
                          {(() => {
                            const uniqueMembers = [...new Set(filteredDashboardScans.map(s => s.memberId))].length;
                            return uniqueMembers > 0 ? (filteredDashboardScans.length / uniqueMembers).toFixed(1) : 0;
                          })()}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
                          Active members: {[...new Set(filteredDashboardScans.map(s => s.memberId))].length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant='caption' color='text.secondary'>
                          Product Diversity
                        </Typography>
                        <Typography variant='h5' fontWeight={700} color='error.main'>
                          {stats.topProducts?.length || 0}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
                          Unique products scanned
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* Price Estimation card moved next to Top Cities */}
            
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                }}
                onClick={() => {
                  setExpandedCardDialog({ open: true, type: 'products', data: stats.topProducts || [] });
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                      <Category /> Product Scan Details
                    </Typography>
                    {(stats.topProducts?.length || 0) > 6 && (
                      <Chip 
                        label={`+${(stats.topProducts?.length || 0) - 6} more`}
                        size='small'
                        color='primary'
                      />
                    )}
                  </Box>
                  <List dense>
                    {stats.topProducts?.slice(0, 6).map((p, i) => 
                      <ListItem key={i} sx={{ borderLeft: '4px solid', borderLeftColor: i === 0 ? 'primary.main' : i === 1 ? 'secondary.main' : 'grey.300', mb: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <ListItemText 
                          primary={<Typography variant='body1' fontWeight={600}>{p._id}</Typography>} 
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                              <Chip label={`${p.count} scans`} size='small' color={i === 0 ? 'primary' : i === 1 ? 'secondary' : 'default'} />
                              <Typography variant='caption' color='text.secondary'>#{i + 1} Most Scanned</Typography>
                            </Box>
                          } 
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    )}
                  </List>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                    Click to view all products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Advanced Analytics Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant='h5' sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment /> Advanced Analytics
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant='contained'
                    color='success'
                    size='small'
                    startIcon={<FileDownload />}
                    onClick={handleExportAllScans}
                    disabled={filteredDashboardScans.length === 0}
                  >
                    Export All Scans
                  </Button>
                  <Button
                    variant='outlined'
                    color='primary'
                    size='small'
                    startIcon={<FileDownload />}
                    onClick={handleExportProducts}
                    disabled={products.length === 0}
                  >
                    Export Products
                  </Button>
                  {isMainAdmin() && (
                    <Button
                      variant='outlined'
                      color='secondary'
                      size='small'
                      startIcon={<FileDownload />}
                      onClick={handleExportUsers}
                      disabled={users.length === 0}
                    >
                      Export Users
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>⏰ Peak Activity Hours</Typography><List dense>{(() => {
              const hourCounts = filteredDashboardScans.reduce((acc, scan) => {
                if (scan.timestamp) {
                  const hour = new Date(scan.timestamp).getHours();
                  acc[hour] = (acc[hour] || 0) + 1;
                }
                return acc;
              }, {});
              return Object.entries(hourCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([hour, count], i) => (
                  <ListItem key={hour} sx={{ borderLeft: '3px solid', borderLeftColor: i === 0 ? 'primary.main' : 'grey.400', mb: 0.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <ListItemText 
                      primary={<Typography variant='body2' fontWeight={600}>{hour}:00 - {hour}:59</Typography>}
                      secondary={<Chip label={`${count} scans`} size='small' color={i === 0 ? 'primary' : 'default'} />}
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>
                ));
            })()}</List></CardContent></Card></Grid>
            
            <Grid item xs={12} md={4}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>📅 Weekly Trends</Typography><Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>Scans by Day of Week</Typography>{(() => {
              const dayCounts = filteredDashboardScans.reduce((acc, scan) => {
                if (scan.timestamp) {
                  const day = new Date(scan.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
                  acc[day] = (acc[day] || 0) + 1;
                }
                return acc;
              }, {});
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const maxCount = Math.max(...Object.values(dayCounts), 1);
              return days.map(day => (
                <Box key={day} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant='caption' fontWeight={600}>{day}</Typography>
                    <Typography variant='caption' color='primary'>{dayCounts[day] || 0}</Typography>
                  </Box>
                  <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', bgcolor: 'primary.main', width: `${((dayCounts[day] || 0) / maxCount) * 100}%`, transition: 'width 0.3s' }} />
                  </Box>
                </Box>
              ));
            })()}</CardContent></Card></Grid>
            
            <Grid item xs={12} md={4}><Card><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>🎯 Performance Metrics</Typography><Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                <Typography variant='body2' color='text.secondary'>Avg Scans/Day</Typography>
                <Typography variant='h5' fontWeight='bold' color='success.dark'>{(filteredDashboardScans.length / Math.max(1, Math.ceil((Date.now() - new Date(filteredDashboardScans[filteredDashboardScans.length - 1]?.timestamp || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)}</Typography>
              </Box>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                <Typography variant='body2' color='text.secondary'>Unique Products</Typography>
                <Typography variant='h5' fontWeight='bold' color='info.dark'>{new Set(filteredDashboardScans.map(s => s.productNo)).size}</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                <Typography variant='body2' color='text.secondary'>Unique Cities</Typography>
                <Typography variant='h5' fontWeight='bold' color='warning.dark'>{new Set(filteredDashboardScans.filter(s => s.location).map(s => s.location)).size}</Typography>
              </Box>
            </Box></CardContent></Card></Grid>
            
            <Grid item xs={12} md={4}><Card sx={{ height: '100%' }}><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>💎 Tier Distribution</Typography><Box sx={{ mt: 2 }}>{(() => {
              const tierCounts = filteredDashboardScans.reduce((acc, scan) => {
                const member = members.find(m => m.memberId === scan.memberId);
                const tier = member?.tier || 'bronze';
                acc[tier] = (acc[tier] || 0) + 1;
                return acc;
              }, { bronze: 0, silver: 0, gold: 0, platinum: 0 });
              
              const total = Object.values(tierCounts).reduce((a, b) => a + b, 0) || 1;
              const tiers = [
                { id: 'bronze', color: '#cd7f32', label: 'Bronze' },
                { id: 'silver', color: '#c0c0c0', label: 'Silver' },
                { id: 'gold', color: '#ffd700', label: 'Gold' },
                { id: 'platinum', color: '#e5e4e2', label: 'Platinum' }
              ];
              return tiers.map(t => (
                <Box key={t.id} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant='caption' fontWeight={600} sx={{ color: t.color, textShadow: '0 0 1px rgba(0,0,0,0.2)' }}>{t.label}</Typography>
                    <Typography variant='caption'>{((tierCounts[t.id]/total)*100).toFixed(1)}%</Typography>
                  </Box>
                  <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', bgcolor: t.color, width: `${(tierCounts[t.id]/total)*100}%`, transition: 'width 0.3s' }} />
                  </Box>
                </Box>
              ));
            })()}</Box></CardContent></Card></Grid>

            <Grid item xs={12} md={4}><Card sx={{ height: '100%' }}><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>📊 Member Activity Ranking</Typography><TableContainer><Table size='small'><TableHead><TableRow><TableCell sx={{ fontWeight: 700 }}>Rank</TableCell><TableCell sx={{ fontWeight: 700 }}>Member</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Total Scans</TableCell><TableCell align='right' sx={{ fontWeight: 700 }}>Role</TableCell></TableRow></TableHead><TableBody>{(() => {
              const memberStats = filteredDashboardScans.reduce((acc, scan) => {
                const key = scan.memberId || 'unknown';
                if (!acc[key]) {
                  acc[key] = { memberId: scan.memberId, memberName: scan.memberName, role: scan.role, count: 0 };
                }
                acc[key].count++;
                return acc;
              }, {});
              return Object.values(memberStats)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map((member, i) => (
                  <TableRow key={member.memberId} sx={{ bgcolor: i < 3 ? 'success.50' : 'inherit' }}>
                    <TableCell><Chip label={`#${i + 1}`} size='small' color={i === 0 ? 'success' : i < 3 ? 'primary' : 'default'} /></TableCell>
                    <TableCell><Typography variant='body2' fontWeight={600}>{member.memberName}</Typography><Typography variant='caption' color='text.secondary'>{member.memberId}</Typography></TableCell>
                    <TableCell align='right'><Typography variant='body2' fontWeight={700}>{member.count}</Typography></TableCell>
                    <TableCell align='right'><Chip label={member.role} size='small' color={member.role === 'applicator' ? 'warning' : 'info'} /></TableCell>
                  </TableRow>
                ));
            })()}</TableBody></Table></TableContainer></CardContent></Card></Grid>
            
            <Grid item xs={12} md={4}><Card sx={{ height: '100%' }}><CardContent><Typography variant='h6' gutterBottom sx={{ fontWeight: 700 }}>🔥 Recent Activity Stream</Typography><List dense>{activityLog.slice(0, 8).map((log, i) => (
              <ListItem key={log.id} sx={{ borderLeft: '3px solid', borderLeftColor: log.severity === 'error' ? 'error.main' : log.severity === 'warning' ? 'warning.main' : log.severity === 'success' ? 'success.main' : 'info.main', mb: 0.5, bgcolor: 'grey.50', borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                  <Typography variant='body2' fontWeight={600}>{log.action}</Typography>
                  <Typography variant='caption' color='text.secondary'>{new Date(log.timestamp).toLocaleTimeString()}</Typography>
                </Box>
                <Typography variant='caption' color='text.secondary'>{log.details}</Typography>
                <Chip label={log.user} size='small' sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
              </ListItem>
            ))}{activityLog.length === 0 && <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 2 }}>No recent activity</Typography>}</List></CardContent></Card></Grid>
          </Grid>
);};
