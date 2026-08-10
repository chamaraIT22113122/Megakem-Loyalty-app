import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Button, TextField, Switch, FormControlLabel, Grid, Chip, 
  Tabs, Tab, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, 
  IconButton, MenuItem, Select, FormControl, InputLabel, Checkbox, ListItemText, OutlinedInput
} from '@mui/material';
import { 
  Build, Security, SearchOff, Save, Visibility, Close, RocketLaunch
} from '@mui/icons-material';
import Page403Forbidden from './Page403Forbidden';
import Page404NotFound from './Page404NotFound';
import PageComingSoon from './PageComingSoon';
import MaintenanceNoticeBanner from './MaintenanceNoticeBanner';

const ALL_SYSTEM_PAGES = [
  { id: 'scan', label: '📱 QR Code Scanner', category: 'Customer App' },
  { id: 'cart', label: '🛒 Cart & Scanned Products', category: 'Customer App' },
  { id: 'profile', label: '👤 Member Profile', category: 'Customer App' },
  { id: 'products-catalog', label: '📦 Product Info Catalog', category: 'Public / Members' },
  { id: 'leaderboard', label: '🏆 Member Leaderboard', category: 'Public / Members' },
  { id: 'dashboard', label: '📊 Admin Dashboard', category: 'Admin Panel' },
  { id: 'applicator-program', label: '👷 Applicator Program', category: 'Admin Panel' },
  { id: 'applicator', label: '🏢 Applicator & Hardware Info', category: 'Admin Panel' },
  { id: 'qr-codes', label: '🏷️ QR Batch Generator', category: 'Admin Panel' },
  { id: 'reprint-requests', label: '🔔 Reprint Requests', category: 'Admin Panel' },
  { id: 'audit-logs', label: '🛡️ Audit Logs', category: 'Admin Panel' },
  { id: 'feedbacks', label: '💬 User Feedbacks', category: 'Admin Panel' },
  { id: 'recycle-bin', label: '🗑️ Recycle Bin', category: 'Admin Panel' }
];

const AdminSystemPagesManager = ({ 
  loyaltyConfig, 
  onSaveConfig, 
  loading = false,
  showNotification,
  bypassComingSoonPages = {},
  onToggleDevAccess,
  onNavigatePage
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Global Settings State
  const [whatsappLeadNumber, setWhatsappLeadNumber] = useState('94760241288');

  // Advanced Maintenance State
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    type: 'maintenance',
    targetAudience: 'all',
    displayMode: 'top_banner',
    title: 'System Maintenance Notice',
    message: 'The system is undergoing scheduled maintenance. Some features may be temporarily limited.',
    blockScanning: false,
    blockLogins: false,
    scheduledEndTime: '',
    actionButtonText: '',
    actionButtonUrl: '',
    assignedPages: []
  });

  // Advanced 403 State
  const [config403, setConfig403] = useState({
    title: '403 — Access Restricted',
    message: 'You do not have permission to access this page or feature. Contact your administrator if you require access.',
    supportEmail: 'support@megakem.lk',
    supportPhone: '+94 11 234 5678',
    iconType: 'lock',
    showRequestButton: true,
    showRoleGuide: true,
    assignedPages: []
  });

  // Advanced 404 State
  const [config404, setConfig404] = useState({
    title: '404 — Page Not Found',
    message: 'The page or QR code link you visited could not be found or has moved.',
    buttonText: 'Return to Homepage',
    redirectTarget: 'welcome',
    showSearchBar: true,
    showQuickLinks: true,
    assignedPages: []
  });

  // Advanced Coming Soon State
  const [configComingSoon, setConfigComingSoon] = useState({
    enabled: false,
    title: 'Exciting Feature Coming Soon!',
    subtitle: 'We are working hard to build something amazing for you. This feature will be available shortly.',
    launchDate: '',
    badgeText: 'UNDER DEVELOPMENT',
    buttonText: 'Return to Home',
    featuresList: ['Enhanced Performance', 'Real-Time Insights', 'Seamless Integration'],
    assignedPages: []
  });

  // Preview Dialog State
  const [previewDialog, setPreviewDialog] = useState({ open: false, type: '' });

  useEffect(() => {
    if (loyaltyConfig) {
      if (loyaltyConfig.whatsappLeadNumber) {
        setWhatsappLeadNumber(loyaltyConfig.whatsappLeadNumber);
      }
      if (loyaltyConfig.maintenanceNotice) {
        setMaintenance(prev => ({ 
          ...prev, 
          ...loyaltyConfig.maintenanceNotice,
          assignedPages: loyaltyConfig.maintenanceNotice.assignedPages || []
        }));
      }
      if (loyaltyConfig.pageConfig403) {
        setConfig403(prev => ({ 
          ...prev, 
          ...loyaltyConfig.pageConfig403,
          assignedPages: loyaltyConfig.pageConfig403.assignedPages || [] 
        }));
      }
      if (loyaltyConfig.pageConfig404) {
        setConfig404(prev => ({ 
          ...prev, 
          ...loyaltyConfig.pageConfig404,
          assignedPages: loyaltyConfig.pageConfig404.assignedPages || [] 
        }));
      }
      if (loyaltyConfig.pageConfigComingSoon) {
        setConfigComingSoon(prev => ({
          ...prev,
          ...loyaltyConfig.pageConfigComingSoon,
          assignedPages: loyaltyConfig.pageConfigComingSoon.assignedPages || []
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loyaltyConfig]);

  const handleSaveAll = async () => {
    const payload = {
      whatsappLeadNumber,
      maintenanceNotice: maintenance,
      pageConfig403: config403,
      pageConfig404: config404,
      pageConfigComingSoon: configComingSoon
    };

    await onSaveConfig(payload);
  };

  // Quick Preset Handlers
  const applyPreset = (presetType) => {
    if (presetType === 'db_maintenance') {
      setMaintenance({
        ...maintenance,
        enabled: true,
        type: 'maintenance',
        title: '🚨 Routine Database Upgrade',
        message: 'We are performing scheduled database optimizations. QR Scanning and login access will resume shortly.',
        blockScanning: true,
        blockLogins: false,
        displayMode: 'top_banner'
      });
    } else if (presetType === 'warning_scheduled') {
      setMaintenance({
        ...maintenance,
        enabled: true,
        type: 'warning',
        title: '⚠️ Scheduled Maintenance Warning',
        message: 'System maintenance is scheduled for Saturday 11:00 PM to 1:00 AM. Please save your work.',
        blockScanning: false,
        blockLogins: false,
        displayMode: 'top_banner'
      });
    } else if (presetType === 'feature_release') {
      setMaintenance({
        ...maintenance,
        enabled: true,
        type: 'info',
        title: '🚀 New Features Released!',
        message: 'We have updated Megakem Rewards with faster QR scanning, new cash reward calculations, and improved security.',
        blockScanning: false,
        blockLogins: false,
        displayMode: 'top_banner',
        actionButtonText: 'Browse Product Catalog',
        actionButtonUrl: '/products-catalog'
      });
    } else if (presetType === 'emergency_lockout') {
      setMaintenance({
        ...maintenance,
        enabled: true,
        type: 'emergency',
        title: '🚨 Emergency System Lockout',
        message: 'The platform is currently offline for critical security updates. All user actions are temporarily suspended.',
        blockScanning: true,
        blockLogins: true,
        displayMode: 'fullscreen_overlay'
      });
    }
  };

  const renderPageMultiSelect = (selectedPages, onChangeHandler, label, helperText) => (
    <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
      <InputLabel id={`multi-select-label-${label}`}>{label}</InputLabel>
      <Select
        labelId={`multi-select-label-${label}`}
        multiple
        value={selectedPages || []}
        onChange={(e) => onChangeHandler(e.target.value)}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => {
              const pageObj = ALL_SYSTEM_PAGES.find(p => p.id === value);
              return (
                <Chip key={value} label={pageObj ? pageObj.label : value} size="small" sx={{ fontWeight: 700 }} />
              );
            })}
          </Box>
        )}
      >
        {ALL_SYSTEM_PAGES.map((page) => (
          <MenuItem key={page.id} value={page.id}>
            <Checkbox checked={(selectedPages || []).indexOf(page.id) > -1} />
            <ListItemText primary={page.label} secondary={page.category} />
          </MenuItem>
        ))}
      </Select>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {helperText}
      </Typography>
    </FormControl>
  );

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-in' }}>
      {/* HEADER TITLE */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="900" sx={{ color: '#003366', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
            <Build sx={{ color: '#003366', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} /> Advanced Maintenance & Custom Pages
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Assign custom 403, 404, or maintenance screens to specific pages on demand
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
          onClick={handleSaveAll}
          disabled={loading}
          fullWidth={false}
          sx={{
            borderRadius: 2.5,
            px: { xs: 2.5, sm: 3.5 },
            py: { xs: 1, sm: 1.2 },
            fontWeight: 800,
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            background: 'linear-gradient(135deg, #003366 0%, #005F73 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(0,51,102,0.3)',
            alignSelf: { xs: 'stretch', sm: 'auto' },
            '&:hover': { background: 'linear-gradient(135deg, #002244 0%, #004d5c 100%)' }
          }}
        >
          {loading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>

      {/* TABS */}
      <Paper sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ 
            px: { xs: 0.5, sm: 2 }, 
            pt: 1,
            '& .MuiTab-root': { 
              fontWeight: 700, 
              textTransform: 'none', 
              fontSize: { xs: '0.78rem', sm: '0.9rem' },
              minWidth: { xs: 'auto', sm: 160 },
              px: { xs: 1.5, sm: 2 }
            },
            '& .MuiTab-iconWrapper': { fontSize: { xs: '0.9rem', sm: '1rem' } }
          }}
        >
          <Tab icon={<Build fontSize="small" />} iconPosition="start" label="📢 Maintenance" />
          <Tab icon={<Security fontSize="small" />} iconPosition="start" label="🔒 Custom 403" />
          <Tab icon={<SearchOff fontSize="small" />} iconPosition="start" label="🔍 Custom 404" />
          <Tab icon={<RocketLaunch fontSize="small" />} iconPosition="start" label="🚀 Coming Soon" />
          <Tab icon={<Build fontSize="small" />} iconPosition="start" label="⚙️ Global Settings" />
        </Tabs>
      </Paper>

      {/* TAB 4: GLOBAL SETTINGS */}
      {activeTab === 4 && (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#003366', mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Global App Settings
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="WhatsApp Lead Number"
                  value={whatsappLeadNumber}
                  onChange={(e) => setWhatsappLeadNumber(e.target.value)}
                  placeholder="e.g. 94760241288"
                  helperText="The default WhatsApp number used when a user clicks 'Order via WhatsApp'."
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 0: MAINTENANCE & BANNER */}
      {activeTab === 0 && (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#003366', mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                System Maintenance & Broadcast Banner Settings
              </Typography>

              {/* QUICK PRESETS */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid', borderColor: '#cbd5e1' }}>
                <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                  ⚡ Quick Presets (Click to Apply)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label="🚨 Routine Maintenance" 
                    clickable 
                    onClick={() => applyPreset('db_maintenance')} 
                    color="error" 
                    variant="outlined" 
                    sx={{ fontWeight: 800 }} 
                  />
                  <Chip 
                    label="⚠️ Scheduled Warning" 
                    clickable 
                    onClick={() => applyPreset('warning_scheduled')} 
                    color="warning" 
                    variant="outlined" 
                    sx={{ fontWeight: 800 }} 
                  />
                  <Chip 
                    label="🚀 Feature Release" 
                    clickable 
                    onClick={() => applyPreset('feature_release')} 
                    color="info" 
                    variant="outlined" 
                    sx={{ fontWeight: 800 }} 
                  />
                  <Chip 
                    label="🚨 Full Lockout Overlay" 
                    clickable 
                    onClick={() => applyPreset('emergency_lockout')} 
                    color="error" 
                    sx={{ fontWeight: 800 }} 
                  />
                </Box>
              </Box>

              {/* MAIN TOGGLE */}
              <Box sx={{ mb: 3, p: 2, bgcolor: maintenance.enabled ? '#fee2e2' : '#f8fafc', borderRadius: 2.5, border: '1px solid', borderColor: maintenance.enabled ? '#fca5a5' : '#cbd5e1' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={maintenance.enabled}
                      onChange={(e) => setMaintenance({ ...maintenance, enabled: e.target.checked })}
                      color="error"
                    />
                  }
                  label={
                    <Typography variant="subtitle1" fontWeight="800" color={maintenance.enabled ? 'error.main' : 'text.primary'}>
                      {maintenance.enabled ? '🚨 System Maintenance Banner is ACTIVE (Live to Users)' : 'System Maintenance Banner is Disabled'}
                    </Typography>
                  }
                />
              </Box>

              {/* PAGE ASSIGNMENT CONTROL FOR MAINTENANCE */}
              {renderPageMultiSelect(
                maintenance.assignedPages,
                (val) => setMaintenance({ ...maintenance, assignedPages: val }),
                "🎯 Target Assigned Pages for Maintenance Overlay",
                "Select specific pages to show maintenance banner/overlay on. Leave blank to show across all pages."
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="banner-type-label">Notice Type / Severity</InputLabel>
                    <Select
                      labelId="banner-type-label"
                      value={maintenance.type}
                      label="Notice Type / Severity"
                      onChange={(e) => setMaintenance({ ...maintenance, type: e.target.value })}
                      sx={{ fontWeight: 700 }}
                    >
                      <MenuItem value="maintenance">🚨 Active Maintenance (Red Banner)</MenuItem>
                      <MenuItem value="warning">⚠️ Scheduled Warning (Orange Banner)</MenuItem>
                      <MenuItem value="info">📢 General Announcement (Blue Banner)</MenuItem>
                      <MenuItem value="emergency">🚨 Emergency Lockout (Dark Red)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="display-mode-label">Display Mode</InputLabel>
                    <Select
                      labelId="display-mode-label"
                      value={maintenance.displayMode || 'top_banner'}
                      label="Display Mode"
                      onChange={(e) => setMaintenance({ ...maintenance, displayMode: e.target.value })}
                      sx={{ fontWeight: 700 }}
                    >
                      <MenuItem value="top_banner">Top Sticky Banner (Default)</MenuItem>
                      <MenuItem value="floating_bottom">Floating Bottom Card</MenuItem>
                      <MenuItem value="fullscreen_overlay">Fullscreen Maintenance Overlay</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="target-audience-label">Target Audience</InputLabel>
                    <Select
                      labelId="target-audience-label"
                      value={maintenance.targetAudience || 'all'}
                      label="Target Audience"
                      onChange={(e) => setMaintenance({ ...maintenance, targetAudience: e.target.value })}
                      sx={{ fontWeight: 700 }}
                    >
                      <MenuItem value="all">🌐 All Users & Visitors</MenuItem>
                      <MenuItem value="applicator">👷 Applicators Only</MenuItem>
                      <MenuItem value="hardware">🏢 Hardware Stores Only</MenuItem>
                      <MenuItem value="guest">👤 Unauthenticated Guests Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="text"
                    label="Scheduled Completion Date & Time"
                    InputLabelProps={{ shrink: true }}
                    value={maintenance.scheduledEndTime || ''}
                    onChange={(e) => setMaintenance({ ...maintenance, scheduledEndTime: e.target.value })}
                    sx={{ mb: 1 }}
                    placeholder="e.g. Sunday 2pm to 4pm or 2026-08-10T14:00"
                    helperText="Describe maintenance end time (free-text or ISO format for countdown timer)"
                  />
                  <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2 }}>
                    <Chip 
                      label="+30 Mins" 
                      size="small" 
                      clickable 
                      onClick={() => {
                        const d = new Date(Date.now() + 30 * 60 * 1000);
                        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setMaintenance({ ...maintenance, scheduledEndTime: localIso });
                      }} 
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                    <Chip 
                      label="+1 Hour" 
                      size="small" 
                      clickable 
                      onClick={() => {
                        const d = new Date(Date.now() + 60 * 60 * 1000);
                        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setMaintenance({ ...maintenance, scheduledEndTime: localIso });
                      }} 
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                    <Chip 
                      label="+2 Hours" 
                      size="small" 
                      clickable 
                      onClick={() => {
                        const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
                        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setMaintenance({ ...maintenance, scheduledEndTime: localIso });
                      }} 
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                    <Chip 
                      label="+24 Hours" 
                      size="small" 
                      clickable 
                      onClick={() => {
                        const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setMaintenance({ ...maintenance, scheduledEndTime: localIso });
                      }} 
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                    {maintenance.scheduledEndTime && (
                      <Chip 
                        label="Clear Time" 
                        size="small" 
                        clickable 
                        color="error"
                        variant="outlined"
                        onClick={() => setMaintenance({ ...maintenance, scheduledEndTime: '' })} 
                        sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                label="Notice Header Title"
                value={maintenance.title}
                onChange={(e) => setMaintenance({ ...maintenance, title: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Custom Maintenance Message to Users"
                value={maintenance.message}
                onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
                sx={{ mb: 2.5 }}
              />

              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Action Button Label (Optional)"
                    placeholder="e.g. Read Release Notes"
                    value={maintenance.actionButtonText || ''}
                    onChange={(e) => setMaintenance({ ...maintenance, actionButtonText: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Action Button URL / View"
                    placeholder="e.g. https://megakem.lk or /catalog"
                    value={maintenance.actionButtonUrl || ''}
                    onChange={(e) => setMaintenance({ ...maintenance, actionButtonUrl: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #cbd5e1', mb: 2.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={maintenance.blockScanning}
                      onChange={(e) => setMaintenance({ ...maintenance, blockScanning: e.target.checked })}
                      color="warning"
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight="700">
                      Pause QR Code Scanning during maintenance
                    </Typography>
                  }
                />
              </Box>

              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => setPreviewDialog({ open: true, type: 'banner' })}
                sx={{ borderRadius: 2.5, fontWeight: 800 }}
              >
                Preview Maintenance Banner
              </Button>
            </Paper>
          </Grid>

          {/* LIVE PREVIEW COLUMN */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#fafafa' }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#003366', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                <Visibility color="primary" /> Live Banner Preview
              </Typography>
              
              <Box sx={{ mt: 1 }}>
                <MaintenanceNoticeBanner maintenanceNotice={maintenance} isPreview={true} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: CUSTOM 403 FORBIDDEN PAGE */}
      {activeTab === 1 && (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#003366', mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Custom 403 Access Denied Page Settings
              </Typography>

              {/* PAGE ASSIGNMENT CONTROL FOR 403 */}
              {renderPageMultiSelect(
                config403.assignedPages,
                (val) => setConfig403({ ...config403, assignedPages: val }),
                "🔒 Assigned Pages to Trigger 403 Forbidden Access",
                "Select specific pages that should trigger the 403 Forbidden screen for non-admin users."
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="403 Page Header Title"
                    value={config403.title}
                    onChange={(e) => setConfig403({ ...config403, title: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="icon-type-label">Icon Style</InputLabel>
                    <Select
                      labelId="icon-type-label"
                      value={config403.iconType || 'lock'}
                      label="Icon Style"
                      onChange={(e) => setConfig403({ ...config403, iconType: e.target.value })}
                      sx={{ fontWeight: 700 }}
                    >
                      <MenuItem value="lock">🔒 Padlock</MenuItem>
                      <MenuItem value="shield">🛡️ Shield</MenuItem>
                      <MenuItem value="key">🔑 Admin Key</MenuItem>
                      <MenuItem value="security">👮 Security Badge</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Access Denied Explanation Message"
                value={config403.message}
                onChange={(e) => setConfig403({ ...config403, message: e.target.value })}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Support Contact Email"
                    value={config403.supportEmail}
                    onChange={(e) => setConfig403({ ...config403, supportEmail: e.target.value })}
                    sx={{ mb: 2.5 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Support Phone Number"
                    value={config403.supportPhone || ''}
                    onChange={(e) => setConfig403({ ...config403, supportPhone: e.target.value })}
                    sx={{ mb: 2.5 }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #cbd5e1', mb: 2.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config403.showRequestButton}
                      onChange={(e) => setConfig403({ ...config403, showRequestButton: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight="700">
                      Show "Request Admin Permission" Button on 403 Page
                    </Typography>
                  }
                />
              </Box>

              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => setPreviewDialog({ open: true, type: '403' })}
                sx={{ borderRadius: 2.5, fontWeight: 800 }}
              >
                Preview Custom 403 Page
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#fafafa' }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#003366', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                <Visibility color="primary" /> 403 Page Quick Preview
              </Typography>

              <Page403Forbidden pageConfig={config403} currentUserRole="Applicator" />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 2: CUSTOM 404 NOT FOUND PAGE */}
      {activeTab === 2 && (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#003366', mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Custom 404 Not Found Page Settings
              </Typography>

              {/* PAGE ASSIGNMENT CONTROL FOR 404 */}
              {renderPageMultiSelect(
                config404.assignedPages,
                (val) => setConfig404({ ...config404, assignedPages: val }),
                "🔍 Assigned Pages to Trigger 404 Not Found (Hide / Disable Page)",
                "Select specific pages to disable or hide. Visiting these pages will show the Custom 404 Not Found screen."
              )}

              <TextField
                fullWidth
                size="small"
                label="404 Page Header Title"
                value={config404.title}
                onChange={(e) => setConfig404({ ...config404, title: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Page Not Found Message"
                value={config404.message}
                onChange={(e) => setConfig404({ ...config404, message: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                size="small"
                label="Primary Button Label"
                value={config404.buttonText}
                onChange={(e) => setConfig404({ ...config404, buttonText: e.target.value })}
                sx={{ mb: 2.5 }}
              />

              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #cbd5e1', mb: 2.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config404.showSearchBar}
                      onChange={(e) => setConfig404({ ...config404, showSearchBar: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight="700">
                      Enable Built-in Search Bar on 404 Page
                    </Typography>
                  }
                />
              </Box>

              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => setPreviewDialog({ open: true, type: '404' })}
                sx={{ borderRadius: 2.5, fontWeight: 800 }}
              >
                Preview Custom 404 Page
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#fafafa' }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#003366', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility color="primary" /> 404 Page Quick Preview
              </Typography>

              <Page404NotFound pageConfig={config404} />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 3: CUSTOM COMING SOON PAGE */}
      {activeTab === 3 && (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mb: 2 }}>
                <Typography variant="h6" fontWeight="800" sx={{ color: '#003366' }}>
                  🚀 Custom Coming Soon Page Settings
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<Visibility />} 
                  onClick={() => setPreviewDialog({ open: true, type: 'coming_soon' })}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Full Screen Preview
                </Button>
              </Box>

              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0fdf4', borderRadius: 2.5, border: '1px solid #bbf7d0' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configComingSoon.enabled}
                      onChange={(e) => setConfigComingSoon({ ...configComingSoon, enabled: e.target.checked })}
                      color="success"
                    />
                  }
                  label={
                    <Typography fontWeight="800" color="#166534">
                      {configComingSoon.enabled ? '🟢 Coming Soon Lockout Overlay is ENABLED' : '⚪ Coming Soon Lockout Overlay is Disabled'}
                    </Typography>
                  }
                />
              </Paper>

              {renderPageMultiSelect(
                configComingSoon.assignedPages,
                (vals) => setConfigComingSoon({ ...configComingSoon, assignedPages: vals }),
                'Target Assigned Pages for Coming Soon Screen',
                'Select which application views or admin tabs will show the Coming Soon overlay'
              )}

              {/* Programmer Dev Access Toggle Controls */}
              {configComingSoon.assignedPages && configComingSoon.assignedPages.length > 0 && (
                <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#f0fdf4', borderRadius: 3, border: '1px solid #86efac' }}>
                  <Typography variant="subtitle2" fontWeight="800" color="#166534" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    👨‍💻 Programmer Development Access (Live Preview for Admin)
                  </Typography>
                  <Typography variant="caption" color="#15803d" sx={{ display: 'block', mb: 2 }}>
                    These pages are hidden from public users. Enable Programmer Access below to view live updates on the actual pages while developing:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {configComingSoon.assignedPages.map(pageId => {
                      const pageObj = ALL_SYSTEM_PAGES.find(p => p.id === pageId);
                      const isDevOn = !!bypassComingSoonPages[pageId];
                      return (
                        <Paper 
                          key={pageId}
                          elevation={0}
                          sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white', borderRadius: 2, border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: 1 }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={isDevOn ? '🔓 Dev View Active' : '🔒 Locked for Public'} 
                              size="small" 
                              color={isDevOn ? 'success' : 'default'}
                              sx={{ fontWeight: 800 }}
                            />
                            <Typography variant="body2" fontWeight="800" color="#003366">
                              {pageObj?.label || pageId}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={isDevOn}
                                  onChange={() => onToggleDevAccess && onToggleDevAccess(pageId)}
                                  color="success"
                                />
                              }
                              label={
                                <Typography variant="caption" fontWeight="700" color={isDevOn ? 'success.main' : 'text.secondary'}>
                                  {isDevOn ? 'Dev Access ON' : 'Enable Dev Access'}
                                </Typography>
                              }
                            />
                            {onNavigatePage && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => {
                                  if (!isDevOn && onToggleDevAccess) onToggleDevAccess(pageId);
                                  onNavigatePage(pageId);
                                }}
                                sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.72rem', py: 0.5 }}
                              >
                                Open Live Page
                              </Button>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                </Paper>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Status Badge Text"
                    value={configComingSoon.badgeText}
                    onChange={(e) => setConfigComingSoon({ ...configComingSoon, badgeText: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Target Launch Date"
                    InputLabelProps={{ shrink: true }}
                    value={configComingSoon.launchDate}
                    onChange={(e) => setConfigComingSoon({ ...configComingSoon, launchDate: e.target.value })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                label="Headline Title"
                value={configComingSoon.title}
                onChange={(e) => setConfigComingSoon({ ...configComingSoon, title: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Subtitle Message"
                value={configComingSoon.subtitle}
                onChange={(e) => setConfigComingSoon({ ...configComingSoon, subtitle: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                size="small"
                label="Action Button Text"
                value={configComingSoon.buttonText}
                onChange={(e) => setConfigComingSoon({ ...configComingSoon, buttonText: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                size="small"
                label="Feature Highlights (Comma separated)"
                value={Array.isArray(configComingSoon.featuresList) ? configComingSoon.featuresList.join(', ') : configComingSoon.featuresList || ''}
                onChange={(e) => setConfigComingSoon({ ...configComingSoon, featuresList: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                helperText="Example: Enhanced Performance, Real-Time Analytics, Automated Reports"
                sx={{ mb: 2 }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#0b1329', color: 'white' }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#00B4D8', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                <Visibility style={{ color: '#00B4D8' }} /> Live Coming Soon Preview
              </Typography>
              <Box sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', height: { xs: 360, sm: 440 } }}>
                <PageComingSoon config={configComingSoon} isPreview={true} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* FULL SCREEN PREVIEW DIALOG */}
      <Dialog 
        open={previewDialog.open} 
        onClose={() => setPreviewDialog({ open: false, type: '' })} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#003366', color: 'white', p: 2 }}>
          <Typography variant="h6" fontWeight="900" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility /> Full Screen Preview: {previewDialog.type.toUpperCase()}
          </Typography>
          <IconButton onClick={() => setPreviewDialog({ open: false, type: '' })} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: previewDialog.type === 'coming_soon' ? 0 : 4, bgcolor: '#f8fafc' }}>
          {previewDialog.type === 'banner' && (
            <Box>
              <MaintenanceNoticeBanner maintenanceNotice={maintenance} isPreview={true} />
            </Box>
          )}

          {previewDialog.type === '403' && (
            <Page403Forbidden 
              pageConfig={config403} 
              currentUserRole="Applicator" 
              onNavigateHome={() => {}} 
              onRequestPermission={() => {}} 
            />
          )}

          {previewDialog.type === '404' && (
            <Page404NotFound 
              pageConfig={config404} 
              onNavigateHome={() => {}} 
              onNavigateCatalog={() => {}} 
            />
          )}

          {previewDialog.type === 'coming_soon' && (
            <PageComingSoon 
              config={configComingSoon} 
              onBack={() => setPreviewDialog({ open: false, type: '' })} 
            />
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewDialog({ open: false, type: '' })} variant="contained">
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSystemPagesManager;
