import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, Checkbox, 
  FormControlLabel, FormGroup, Grid, Switch, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, TextField, InputAdornment,
  Chip, CircularProgress, Alert, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { 
  GetApp, Refresh, Delete, CloudDownload, Storage, 
  Visibility, VisibilityOff, Warning, Lock, LockOpen,
  DataUsage, TrendingUp, Settings
} from '@mui/icons-material';
import { backupAPI, loyaltyAPI } from '../services/api';

const AVAILABLE_COLLECTIONS = [
  'users', 'products', 'members', 'scans', 'qrcodes', 
  'rewards', 'redemptionrequests', 'auditlogs'
];

const DataManagement = ({ showNotification, addToActivityLog, isMainAdmin }) => {
  const [backups, setBackups] = useState([]);
  const [archives, setArchives] = useState([]);
  const [stats, setStats] = useState(null);
  const [autoBackupConfig, setAutoBackupConfig] = useState({ enabled: true, frequency: 'daily', retentionDays: 30 });
  const [archivingConfig, setArchivingConfig] = useState({ enabled: false, thresholdMonths: 12 });
  const [cloudSyncConfig, setCloudSyncConfig] = useState({ awsEnabled: false, gcpEnabled: false });
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState(AVAILABLE_COLLECTIONS);
  const [saveToServer, setSaveToServer] = useState(true);
  const [mergeRestore, setMergeRestore] = useState(false);
  
  // Dialog state
  const [passwordDialog, setPasswordDialog] = useState({ 
    open: false, type: '', password: '', targetId: null, 
    backupData: null, encryptedString: null, 
    collectionsToRestore: AVAILABLE_COLLECTIONS 
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isMainAdmin) {
      fetchBackups();
    }
  }, [isMainAdmin]);

  const fetchBackups = async () => {
    try {
      const [res, archivesRes, statsRes, configRes] = await Promise.all([
        backupAPI.listBackups(),
        backupAPI.listArchives(),
        backupAPI.getStats(),
        loyaltyAPI.getConfig()
      ]);
      setBackups(res.data.data || []);
      setArchives(archivesRes.data.data || []);
      setStats(statsRes.data.data);
      if (configRes.data.data) {
        const conf = configRes.data.data;
        if (conf.autoBackup) setAutoBackupConfig(conf.autoBackup);
        if (conf.archiving) setArchivingConfig(conf.archiving);
        if (conf.cloudSync) setCloudSyncConfig(conf.cloudSync);
        if (conf.compression) setCompressionEnabled(conf.compression.enabled !== false);
      }
    } catch (error) {
      showNotification('Failed to fetch server backups, stats, or config', 'error');
    }
  };

  const handleSaveAdvancedSettings = async () => {
    try {
      setLoading(true);
      await loyaltyAPI.updateConfig({ 
        autoBackup: autoBackupConfig,
        archiving: archivingConfig,
        cloudSync: cloudSyncConfig,
        compression: { enabled: compressionEnabled }
      });
      showNotification('Advanced settings saved successfully', 'success');
      addToActivityLog('Config Updated', 'Advanced Data Management settings changed', 'info');
    } catch (error) {
      showNotification('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionToggle = (collection) => {
    if (selectedCollections.includes(collection)) {
      setSelectedCollections(selectedCollections.filter(c => c !== collection));
    } else {
      setSelectedCollections([...selectedCollections, collection]);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const executeAction = async () => {
    const { type, password, targetId, backupData, encryptedString, collectionsToRestore } = passwordDialog;
    
    if (!password) {
      showNotification('Password is required', 'error');
      return;
    }

    setLoading(true);

    try {
      if (type === 'create') {
        if (saveToServer) {
          await backupAPI.createLocalBackup(selectedCollections, compressionEnabled);
          showNotification('Backup saved to server successfully', 'success');
          fetchBackups();
          addToActivityLog('Backup Created', 'Server backup generated', 'success');
        } else {
          const res = await backupAPI.exportData(selectedCollections);
          const data = res.data.data;
          const jsonContent = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `megakem-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showNotification('Backup downloaded successfully', 'success');
          addToActivityLog('Backup Downloaded', 'Local backup downloaded', 'success');
        }
      } else if (type === 'restore_server') {
        const res = await backupAPI.restoreFromServer(targetId, mergeRestore, collectionsToRestore);
        showNotification(`Restored documents successfully`, 'success');
        addToActivityLog('Backup Restored', 'Data restored from server', 'warning');
      } else if (type === 'restore_file') {
        const res = await backupAPI.importData(backupData, encryptedString, mergeRestore, collectionsToRestore);
        showNotification(`Restored documents successfully`, 'success');
        addToActivityLog('Backup Restored', 'Data restored from file', 'warning');
      } else if (type === 'archive_trigger') {
        const res = await backupAPI.triggerArchive(archivingConfig.thresholdMonths);
        showNotification(res.data.message || 'Archiving executed successfully', 'success');
        fetchBackups();
        addToActivityLog('Archive Generated', 'Cold storage archiving executed manually', 'warning');
      }
      
      // Close dialog only on success
      setPasswordDialog({ ...passwordDialog, open: false, password: '' });
      
    } catch (error) {
      showNotification(error.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isEncrypted = file.name.endsWith('.enc');
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (isEncrypted) {
          setPasswordDialog({ 
            open: true, type: 'restore_file', password: '', 
            targetId: null, backupData: null, encryptedString: event.target.result,
            collectionsToRestore: AVAILABLE_COLLECTIONS
          });
        } else {
          const parsedData = JSON.parse(event.target.result);
          if (!parsedData.collections) throw new Error('Invalid backup format');
          setPasswordDialog({ 
            open: true, type: 'restore_file', password: '', 
            targetId: null, backupData: parsedData, encryptedString: null,
            collectionsToRestore: Object.keys(parsedData.collections)
          });
        }
      } catch (err) {
        showNotification('Invalid file format', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleDownloadServerBackup = async (id, filename) => {
    try {
      const res = await backupAPI.downloadBackup(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      showNotification('Failed to download backup', 'error');
    }
  };

  const handleDeleteServerBackup = async (id) => {
    if (window.confirm('Delete this backup permanently?')) {
      try {
        await backupAPI.deleteBackup(id);
        showNotification('Backup deleted', 'success');
        fetchBackups();
      } catch (error) {
        showNotification('Failed to delete backup', 'error');
      }
    }
  };

  if (!isMainAdmin) return null;

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant='h5' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Storage color="primary" /> Advanced Data Management
      </Typography>

      {/* KPI Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Storage fontSize="large" />
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Database Live Size</Typography>
                  <Typography variant="h5">{formatSize(stats.databaseSize)}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DataUsage fontSize="large" />
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Backup Storage</Typography>
                  <Typography variant="h5">{formatSize(stats.backupStorageUsed)}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Lock fontSize="large" />
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Archive Storage</Typography>
                  <Typography variant="h5">{formatSize(stats.archiveStorageUsed || 0)}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp fontSize="large" />
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>30-Day Growth</Typography>
                  <Typography variant="h5">+{formatSize(stats.predictedGrowth30Days)}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <CardContent>
          <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Create Backup</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select which collections to include in the backup.
              </Typography>
              
              <FormGroup row sx={{ mb: 2 }}>
                {AVAILABLE_COLLECTIONS.map(col => (
                  <FormControlLabel 
                    key={col} 
                    control={<Checkbox checked={selectedCollections.includes(col)} onChange={() => handleCollectionToggle(col)} />} 
                    label={col} 
                    sx={{ width: '45%' }}
                  />
                ))}
              </FormGroup>

              <FormGroup row sx={{ mb: 3 }}>
                <FormControlLabel
                  control={<Switch checked={saveToServer} onChange={(e) => setSaveToServer(e.target.checked)} />}
                  label={saveToServer ? "Save to Server" : "Download to Device"}
                />
                <FormControlLabel
                  control={<Switch color="secondary" checked={compressionEnabled} onChange={(e) => setCompressionEnabled(e.target.checked)} />}
                  label="ZLIB Compression"
                />
              </FormGroup>

              <Button 
                variant="contained" 
                startIcon={<GetApp />} 
                onClick={() => setPasswordDialog({ open: true, type: 'create', password: '', targetId: null, backupData: null })}
                disabled={loading || selectedCollections.length === 0}
                fullWidth
              >
                Create Backup
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Restore & Import</Typography>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>Merge Data</strong>: Updates existing records by ID and inserts new ones. <br/>
                <strong>Overwrite</strong>: Wipes all current data before restoring.
              </Alert>

              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel
                  control={<Switch color="warning" checked={mergeRestore} onChange={(e) => setMergeRestore(e.target.checked)} />}
                  label={mergeRestore ? "Strategy: Merge Data (Upsert)" : "Strategy: Overwrite (Wipe & Restore)"}
                />
              </FormGroup>

              <Button 
                variant="outlined" 
                component="label" 
                startIcon={loading ? <CircularProgress size={20} /> : <Refresh />} 
                disabled={loading} 
                fullWidth
                color="secondary"
              >
                Upload Backup File (.json / .enc)
                <input type="file" accept=".json,.enc" hidden onChange={handleFileUpload} />
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings fontSize="small" /> Advanced Configurations
              </Typography>
              
              <Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>Auto-Backups</Typography>
              <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch 
                        color="primary" 
                        checked={autoBackupConfig.enabled} 
                        onChange={(e) => setAutoBackupConfig({...autoBackupConfig, enabled: e.target.checked})} 
                      />
                    }
                    label="Enable Auto-Backups"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small" disabled={!autoBackupConfig.enabled}>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={autoBackupConfig.frequency}
                      label="Frequency"
                      onChange={(e) => setAutoBackupConfig({...autoBackupConfig, frequency: e.target.value})}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    type="number" 
                    label="Retention Days" 
                    disabled={!autoBackupConfig.enabled}
                    value={autoBackupConfig.retentionDays}
                    onChange={(e) => setAutoBackupConfig({...autoBackupConfig, retentionDays: parseInt(e.target.value) || 1})}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>Cloud Sync Configuration</Typography>
              <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch 
                        color="warning" 
                        checked={cloudSyncConfig.gcpEnabled} 
                        onChange={(e) => setCloudSyncConfig({...cloudSyncConfig, gcpEnabled: e.target.checked})} 
                      />
                    }
                    label="Sync to Google Drive"
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Google Drive Folder ID / Link" 
                    disabled={!cloudSyncConfig.gcpEnabled}
                    value={cloudSyncConfig.googleDriveFolderId || ''}
                    onChange={(e) => setCloudSyncConfig({...cloudSyncConfig, googleDriveFolderId: e.target.value})}
                    helperText="Paste the Google Drive Folder ID where backups should be uploaded."
                  />
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    onClick={handleSaveAdvancedSettings}
                    disabled={loading}
                  >
                    Save All Settings
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Server-Side Backups</Typography>
              <TableContainer sx={{ mb: 4 }}>
                <Table size="small">
                  <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Filename</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Security</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {backups.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center">No backups stored on server</TableCell></TableRow>
                      ) : (
                        backups.map(backup => (
                          <TableRow key={backup._id}>
                            <TableCell>{new Date(backup.timestamp).toLocaleString()}</TableCell>
                            <TableCell sx={{ wordBreak: 'break-all' }}>{backup.filename}</TableCell>
                            <TableCell>{backup.type === 'auto' ? 'Automatic' : 'Manual'}</TableCell>
                            <TableCell>
                              {backup.filename.endsWith('.enc') 
                                ? <Chip icon={<Lock fontSize="small"/>} label="AES-256 Encrypted" color="success" size="small" variant="outlined" />
                                : <Chip icon={<LockOpen fontSize="small"/>} label="Unencrypted" color="error" size="small" variant="outlined" />
                              }
                            </TableCell>
                            <TableCell>{formatSize(backup.size)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Download">
                              <IconButton size="small" onClick={() => handleDownloadServerBackup(backup._id, backup.filename)}>
                                <CloudDownload fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Restore from this backup">
                                <IconButton size="small" color="primary" onClick={() => setPasswordDialog({ 
                                  open: true, type: 'restore_server', password: '', 
                                  targetId: backup._id, backupData: null, encryptedString: null,
                                  collectionsToRestore: backup.collectionsIncluded || AVAILABLE_COLLECTIONS
                                })}>
                                  <Refresh fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteServerBackup(backup._id)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>


            </Paper>
          </Grid>
        </Grid>

        {/* Universal Password Dialog */}
        <Dialog open={passwordDialog.open} onClose={() => setPasswordDialog({ ...passwordDialog, open: false })}>
          <DialogTitle>
            {passwordDialog.type === 'create' ? 'Verify Admin Access' : 
             passwordDialog.type === 'archive_trigger' ? 'Verify Archiving Execution' :
             'Configure Partial Restore & Verify'}
          </DialogTitle>
          <DialogContent>
            {passwordDialog.type !== 'create' && passwordDialog.type !== 'archive_trigger' && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Select specific collections to restore. Unselected collections will be safely ignored.
                </Alert>
                <Typography variant="subtitle2" gutterBottom>Collections to Restore:</Typography>
                <FormGroup row>
                  {AVAILABLE_COLLECTIONS.map(col => (
                    <FormControlLabel 
                      key={col} 
                      control={
                        <Checkbox 
                          checked={passwordDialog.collectionsToRestore.includes(col)} 
                          onChange={(e) => {
                            const current = passwordDialog.collectionsToRestore;
                            setPasswordDialog({
                              ...passwordDialog,
                              collectionsToRestore: e.target.checked 
                                ? [...current, col]
                                : current.filter(c => c !== col)
                            });
                          }} 
                        />
                      } 
                      label={col} 
                      sx={{ width: '45%' }}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}

            <DialogContentText sx={{ mb: 2 }}>
              Please enter your admin password to authorize this action.
            </DialogContentText>
            <TextField
              fullWidth
              autoFocus
              type={showPassword ? 'text' : 'password'}
              label="Admin Password"
              value={passwordDialog.password}
              onChange={(e) => setPasswordDialog({ ...passwordDialog, password: e.target.value })}
              onKeyPress={(e) => { if(e.key === 'Enter') executeAction(); }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialog({ ...passwordDialog, open: false })}>Cancel</Button>
            <Button 
              onClick={executeAction} 
              variant="contained" 
              color={passwordDialog.type !== 'create' && passwordDialog.type !== 'archive_trigger' ? 'warning' : 'primary'} 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {passwordDialog.type !== 'create' && passwordDialog.type !== 'archive_trigger' ? 'Execute Restore' : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  </Box>
  );
};

export default DataManagement;
