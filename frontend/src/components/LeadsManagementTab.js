import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, 
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Tooltip, Grid, LinearProgress, CircularProgress
} from '@mui/material';
import { Delete, Edit, Notes, FileDownload, FilterList, Refresh } from '@mui/icons-material';
import api, { analyticsAPI } from '../services/api';
import * as XLSX from 'xlsx';

const statusColors = {
  new: 'info',
  contacted: 'warning',
  converted: 'success',
  lost: 'error'
};

const statusLabels = {
  new: 'New',
  contacted: 'Contacted',
  converted: 'Converted',
  lost: 'Lost'
};

function LeadsManagementTab({ onShowNotification }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, lead: null, status: '', notes: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [statusFilter, setStatusFilter] = useState('all');

  const loadLeads = async () => {
    try {
      if (!api.hasCache('/analytics/purchase-intents')) setLoading(true);
      const res = await analyticsAPI.getPurchaseIntents((fresh) => {
        setLeads(fresh.data.data || []);
      });
      setLeads(res.data.data || []);
    } catch (err) {
      console.error(err);
      if (onShowNotification) onShowNotification('Failed to load leads data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleSaveEdit = async () => {
    try {
      await analyticsAPI.updatePurchaseIntent(editDialog.lead._id, {
        status: editDialog.status,
        notes: editDialog.notes
      });
      if (onShowNotification) onShowNotification('Lead updated successfully', 'success');
      setEditDialog({ open: false, lead: null, status: '', notes: '' });
      loadLeads();
    } catch (err) {
      console.error(err);
      if (onShowNotification) onShowNotification('Failed to update lead', 'error');
    }
  };

  const isMainAdmin = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      return u && u.email === 'admin@megakem.com';
    } catch {
      return false;
    }
  };

  const handleDelete = async () => {
    if (!isMainAdmin()) {
      if (onShowNotification) onShowNotification('Only the main admin can delete leads', 'error');
      setDeleteDialog({ open: false, id: null });
      return;
    }
    try {
      await analyticsAPI.deletePurchaseIntent(deleteDialog.id);
      if (onShowNotification) onShowNotification('Lead deleted successfully', 'success');
      setDeleteDialog({ open: false, id: null });
      loadLeads();
    } catch (err) {
      console.error(err);
      if (onShowNotification) onShowNotification('Failed to delete lead', 'error');
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredLeads.map(lead => ({
      'Date': new Date(lead.createdAt).toLocaleString(),
      'Customer Name': lead.name || lead.member?.memberName || lead.member?.username || 'Unknown',
      'Mobile / Phone': lead.mobile || lead.member?.phone || lead.member?.whatsappNumber || lead.member?.mobile || 'No Mobile',
      'Product': lead.product?.name || 'Unknown',
      'Status': statusLabels[lead.status] || 'New',
      'Admin Notes': lead.notes || '',
      'Is Registered App User': lead.member ? 'Yes' : 'No'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Leads");
    XLSX.writeFile(wb, `Megakem_Leads_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  // Funnel & Stats Calculations
  const { filteredLeads, funnelStats } = useMemo(() => {
    const filtered = statusFilter === 'all' ? leads : leads.filter(l => (l.status || 'new') === statusFilter);
    
    const stats = {
      total: leads.length,
      new: leads.filter(l => !l.status || l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      converted: leads.filter(l => l.status === 'converted').length,
      lost: leads.filter(l => l.status === 'lost').length,
    };

    return { filteredLeads: filtered, funnelStats: stats };
  }, [leads, statusFilter]);

  const conversionRate = funnelStats.total > 0 ? ((funnelStats.converted / funnelStats.total) * 100).toFixed(1) : 0;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          📊 Purchase Intents & Sales Leads
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="success" startIcon={<FileDownload />} onClick={handleExportCSV} disabled={filteredLeads.length === 0}>
            Export CSV
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadLeads} disabled={loading}>Refresh</Button>
        </Box>
      </Box>

      {/* Marketing CRM Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 2 }}>SALES CONVERSION FUNNEL</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', textAlign: 'center', mt: 2 }}>
                <Box>
                  <Typography variant="h3">{funnelStats.total}</Typography>
                  <Typography variant="caption">Total Leads</Typography>
                </Box>
                <Box sx={{ flexGrow: 1, px: 2, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.3)', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', right: 0, top: -4, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '10px solid rgba(255,255,255,0.7)' }} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h3">{funnelStats.contacted}</Typography>
                  <Typography variant="caption">Contacted</Typography>
                </Box>
                <Box sx={{ flexGrow: 1, px: 2, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.3)', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', right: 0, top: -4, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '10px solid rgba(255,255,255,0.7)' }} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h3">{funnelStats.converted}</Typography>
                  <Typography variant="caption">Closed Won</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>CONVERSION RATE</Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', mt: 2 }}>
                <CircularProgress variant="determinate" value={Number(conversionRate)} size={80} thickness={4} color="success" />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h6" component="div" color="text.primary">{conversionRate}%</Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                {funnelStats.converted} out of {funnelStats.total} leads converted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* CRM Table */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                startAdornment={<FilterList sx={{ color: 'action.active', mr: 1, ml: -0.5 }} />}
              >
                <MenuItem value="all">All Leads</MenuItem>
                <MenuItem value="new">New (Uncontacted)</MenuItem>
                <MenuItem value="contacted">Contacted (In Progress)</MenuItem>
                <MenuItem value="converted">Converted (Won)</MenuItem>
                <MenuItem value="lost">Lost</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer component={Paper} sx={{ overflowX: 'auto', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer / Lead Info</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No leads found for this filter.</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.map((lead) => (
                  <TableRow key={lead._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {lead.product?.imageUrl && (
                          <img src={lead.product.imageUrl} alt={lead.product.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                        )}
                        <Typography variant="body2" fontWeight="600">{lead.product?.name || 'Unknown'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {lead.name || lead.member?.username || lead.member?.memberName || lead.member?.name || <Box component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>Anonymous</Box>}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {lead.mobile || lead.member?.phone || lead.member?.whatsappNumber || lead.member?.mobile || (lead.memberId && lead.memberId.length < 20 ? lead.memberId : null) || 'No Contact Info'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {lead.inquiryNumber && (
                          <Chip size="small" label={lead.inquiryNumber} color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 'bold' }} />
                        )}
                        {lead.member && (
                          <Chip size="small" label="Registered" color="success" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{new Date(lead.createdAt).toLocaleDateString()}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(lead.createdAt).toLocaleTimeString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={statusLabels[lead.status || 'new']} 
                        color={statusColors[lead.status || 'new']} 
                        size="small" 
                        sx={{ fontWeight: 'bold' }}
                      />
                      {lead.notes && (
                        <Tooltip title={lead.notes}>
                          <IconButton size="small" sx={{ ml: 1 }}><Notes fontSize="small" color="action" /></IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Update Status & Notes">
                        <IconButton size="small" color="primary" onClick={() => setEditDialog({ open: true, lead, status: lead.status || 'new', notes: lead.notes || '' })}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isMainAdmin() && (
                        <Tooltip title="Delete Lead">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: lead._id })}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ ...editDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Update Lead Status</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={editDialog.status}
              label="Status"
              onChange={(e) => setEditDialog({ ...editDialog, status: e.target.value })}
            >
              <MenuItem value="new"><Chip size="small" label="New" color="info" /> - Just arrived</MenuItem>
              <MenuItem value="contacted"><Chip size="small" label="Contacted" color="warning" /> - Follow-up initiated</MenuItem>
              <MenuItem value="converted"><Chip size="small" label="Converted" color="success" /> - Sale completed</MenuItem>
              <MenuItem value="lost"><Chip size="small" label="Lost" color="error" /> - Not interested</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Admin Notes"
            placeholder="Add any context, follow-up dates, or conversation notes here..."
            value={editDialog.notes}
            onChange={(e) => setEditDialog({ ...editDialog, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ ...editDialog, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>Delete Lead</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete this lead? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default LeadsManagementTab;
