// CustomerInsightPage.jsx
// ============================================================================
// PURPOSE:
//   Customer Insights spreadsheet page with Handsontable and Web Worker.
//   Strictly configured with exactly 5 columns and 50 rows.
//   Includes Bulk Update popup where user selects 1 column chip, after which
//   a dynamic input field corresponding to that column's datatype (dropdown,
//   text editor, numeric, date picker, or multiselect) appears for updating.
//
// 5 COLUMNS & DATA TYPES:
//   1. Dropdown    — Plan Tier
//   2. Text Editor — Company Name
//   3. Numeric     — Annual ARR ($)
//   4. Date Picker — Join Date (YYYY-MM-DD)
//   5. Multiselect — Engagement Channels
// ============================================================================

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Material-UI layout and UI components
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Breadcrumbs,
  Link,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Checkbox,
  ListItemText,
} from '@mui/material';

// Material-UI Icons
import {
  ArrowBack as ArrowBackIcon,
  Insights as InsightsIcon,
  EditNote as BulkUpdateIcon,
} from '@mui/icons-material';

// Toast notifications
import { toast } from 'react-toastify';

// Handsontable registry and core styling
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// Theme tokens & Context
import { blcColors, typographyTokens } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { Navbar } from '../components/dashboard/Navbar';
import { DataTable } from '../components/common/DataTable';
import { Popup } from '../components/common/Popup';
import { AppButton } from '../components/common/AppButton';

// Register all Handsontable modules
registerAllModules();

// ─── Dropdown Options ────────────────────────────────────────────────────────
const PLAN_TIERS = ['Enterprise', 'Growth', 'Scale', 'Starter'];

// ─── Multiselect Options ─────────────────────────────────────────────────────
const ENGAGEMENT_CHANNELS = [
  'Email',
  'In-App',
  'SMS',
  'Push Notifications',
  'Phone Support',
  'Slack Community',
];

// Handsontable dropdown menu filter options
const DROPDOWN_MENU_OPTIONS = [
  'filter_by_condition',
  'filter_by_value',
  'filter_action_bar',
];

// ─── Bulk Update Column Definitions ──────────────────────────────────────────
const BULK_UPDATE_COLUMNS = [
  { key: 'planTier', label: 'Plan Tier', type: 'dropdown' },
  { key: 'companyName', label: 'Company Name', type: 'text' },
  { key: 'annualArr', label: 'Annual ARR ($)', type: 'numeric' },
  { key: 'joinDate', label: 'Join Date', type: 'date' },
  { key: 'channels', label: 'Channels', type: 'multiselect' },
];

// ─── Exactly 50 Rows with 5 Columns ──────────────────────────────────────────
// Order: [Dropdown (Plan Tier), Text Editor (Company Name), Numeric (Annual ARR), Date Picker (Join Date), Multiselect (Channels)]
const INITIAL_CUSTOMER_INSIGHTS = [
  ['Enterprise', 'Acme Corporation', 128000, '2023-01-15', ['Email', 'In-App', 'Phone Support']],
  ['Growth', 'BlueFin Technologies', 48000, '2023-02-20', ['Email', 'In-App']],
  ['Enterprise', 'CloudScale Networks', 96000, '2023-03-11', ['In-App', 'Slack Community']],
  ['Scale', 'DataForge Systems', 72000, '2023-04-05', ['Email', 'SMS', 'Phone Support']],
  ['Starter', 'EchoWave Media', 14500, '2023-05-18', ['Email']],
  ['Enterprise', 'Frontier AI Labs', 142000, '2023-06-22', ['Email', 'In-App', 'Slack Community']],
  ['Enterprise', 'Global Logistics Hub', 88000, '2023-07-09', ['Email', 'Phone Support']],
  ['Scale', 'Hyperion Security', 64000, '2023-08-14', ['In-App', 'Push Notifications']],
  ['Enterprise', 'Ironclad Financial', 155000, '2023-09-03', ['Email', 'Phone Support', 'SMS']],
  ['Growth', 'Jupiter Analytics', 52000, '2023-10-19', ['Email', 'In-App']],
  ['Scale', 'Kinetic Robotics', 78000, '2023-11-27', ['Email', 'Slack Community']],
  ['Enterprise', 'Luminary Health', 165000, '2023-12-08', ['Email', 'In-App', 'Phone Support']],
  ['Growth', 'Meridian Retail Group', 42000, '2024-01-12', ['Email', 'SMS']],
  ['Enterprise', 'Nexus Energy Corp', 110000, '2024-01-28', ['Phone Support', 'In-App']],
  ['Scale', 'OmniChannel Retail', 61000, '2024-02-04', ['Email', 'Push Notifications']],
  ['Growth', 'Pulse Healthcare', 49000, '2024-02-17', ['Email', 'In-App']],
  ['Enterprise', 'Quantum Dynamics', 134000, '2024-03-01', ['Email', 'Slack Community', 'Phone Support']],
  ['Starter', 'RedShift Streaming', 18000, '2024-03-15', ['Email', 'Push Notifications']],
  ['Enterprise', 'Stellar Aerospace', 148000, '2024-03-29', ['Email', 'Phone Support']],
  ['Enterprise', 'Titan Manufacturing', 115000, '2024-04-10', ['Email', 'In-App', 'SMS']],
  ['Scale', 'Unified Cloud Tech', 69000, '2024-04-22', ['Email', 'Slack Community']],
  ['Growth', 'Vantage Solutions', 46000, '2024-05-06', ['Email', 'In-App']],
  ['Starter', 'Waveform Audio', 16000, '2024-05-19', ['Email']],
  ['Enterprise', 'Xenon Telecom', 122000, '2024-06-02', ['Email', 'Phone Support', 'SMS']],
  ['Growth', 'YieldTech Agri', 53000, '2024-06-15', ['Email', 'In-App']],
  ['Enterprise', 'Zenith Fintech', 159000, '2024-06-29', ['Email', 'Slack Community']],
  ['Scale', 'Aurora BioLabs', 74000, '2024-07-08', ['Email', 'In-App', 'Phone Support']],
  ['Growth', 'Beacon Sensor Tech', 39000, '2024-07-21', ['Email', 'SMS']],
  ['Enterprise', 'Catalyst Legal AI', 137000, '2024-08-03', ['Email', 'Slack Community', 'In-App']],
  ['Starter', 'Driftwood Creative', 12500, '2024-08-16', ['Email']],
  ['Scale', 'Element Logistics', 67000, '2024-08-30', ['In-App', 'Push Notifications']],
  ['Enterprise', 'Flux Microelectronics', 144000, '2024-09-11', ['Email', 'Phone Support']],
  ['Growth', 'Gradient Design Labs', 45000, '2024-09-24', ['Email', 'In-App']],
  ['Enterprise', 'Horizon Shipping', 98000, '2024-10-02', ['Email', 'SMS', 'Phone Support']],
  ['Scale', 'InfiniCore Hosting', 76000, '2024-10-15', ['Email', 'Slack Community']],
  ['Growth', 'JetStream Freight', 51000, '2024-10-28', ['Email', 'In-App']],
  ['Starter', 'Kaleido Brand Studio', 17500, '2024-11-09', ['Email']],
  ['Enterprise', 'LogicGate Cybersecurity', 162000, '2024-11-22', ['Email', 'In-App', 'Phone Support']],
  ['Growth', 'Momentum Sports Tech', 47000, '2024-12-04', ['In-App', 'Push Notifications']],
  ['Enterprise', 'Nebula Data Platforms', 131000, '2024-12-18', ['Email', 'Slack Community']],
  ['Scale', 'Opal Smart Devices', 63000, '2025-01-05', ['Email', 'In-App']],
  ['Enterprise', 'Pinnacle Asset Mgmt', 152000, '2025-01-19', ['Email', 'Phone Support']],
  ['Enterprise', 'Quark Quantum Labs', 126000, '2025-02-02', ['Email', 'Slack Community']],
  ['Growth', 'Radiant Clean Energy', 44000, '2025-02-15', ['Email', 'SMS']],
  ['Scale', 'Synthetix Commerce', 71000, '2025-03-01', ['In-App', 'Push Notifications']],
  ['Enterprise', 'TerraFlora Biotech', 139000, '2025-03-14', ['Email', 'Phone Support']],
  ['Growth', 'UltraNet Fiber', 43000, '2025-03-27', ['Email', 'In-App']],
  ['Enterprise', 'Vertex AI Solutions', 168000, '2025-04-10', ['Email', 'In-App', 'Slack Community']],
  ['Growth', 'Willow Clean Energy', 54000, '2025-04-23', ['Email', 'Phone Support']],
  ['Starter', 'Xylo Automation Labs', 15000, '2025-05-06', ['Email']],
];

// ─── Exactly 5 Column Definitions & Datatypes ────────────────────────────────
const COLUMN_DEFS = [
  {
    data: 0,
    title: 'Plan Tier',
    type: 'dropdown',
    source: PLAN_TIERS,
  },
  {
    data: 1,
    title: 'Company Name',
    type: 'text',
  },
  {
    data: 2,
    title: 'Annual ARR ($)',
    type: 'numeric',
    numericFormat: { pattern: '$0,0' },
  },
  {
    data: 3,
    title: 'Join Date',
    type: 'date',
    dateFormat: 'YYYY-MM-DD',
    correctFormat: true,
  },
  {
    data: 4,
    title: 'Channels',
    type: 'multiselect',
    source: ENGAGEMENT_CHANNELS,
  },
];

const COL_HEADERS = [
  'Plan Tier',
  'Company Name',
  'Annual ARR ($)',
  'Join Date',
  'Channels',
];

/**
 * CustomerInsightPage Component
 */
export const CustomerInsightPage = ({ mode, toggleMode }) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  const hotRef = useRef(null);

  // Exactly 50 rows of data in memory
  const [dataset, setDataset] = useState(INITIAL_CUSTOMER_INSIGHTS);

  // Bulk update popup state: multi-select columns and their corresponding values
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(['planTier']);
  const [bulkValues, setBulkValues] = useState({
    planTier: 'Enterprise',
    companyName: '',
    annualArr: 65000,
    joinDate: new Date().toISOString().split('T')[0],
    channels: ['Email', 'In-App'],
  });

  // Toggle selection of a column chip
  const handleToggleColumn = (colKey) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey)
        ? prev.filter((k) => k !== colKey)
        : [...prev, colKey]
    );
  };

  // Update value for a specific column in bulkValues
  const handleUpdateValue = (colKey, val) => {
    setBulkValues((prev) => ({
      ...prev,
      [colKey]: val,
    }));
  };

  // Apply bulk update across all selected columns simultaneously
  const handleApplyBulkUpdate = () => {
    if (selectedColumns.length === 0) {
      toast.warning('Please select at least one column to update.');
      return;
    }

    // Validation
    for (const colKey of selectedColumns) {
      if (colKey === 'companyName' && (!bulkValues.companyName || !String(bulkValues.companyName).trim())) {
        toast.warning('Please enter a company name.');
        return;
      }
      if (colKey === 'channels' && (!Array.isArray(bulkValues.channels) || bulkValues.channels.length === 0)) {
        toast.warning('Please select at least one channel.');
        return;
      }
      if (colKey === 'joinDate' && !bulkValues.joinDate) {
        toast.warning('Please select a date.');
        return;
      }
    }

    const updates = selectedColumns.map((colKey) => {
      const colIndex = BULK_UPDATE_COLUMNS.findIndex((c) => c.key === colKey);
      let val = bulkValues[colKey];
      if (colKey === 'annualArr') val = Number(val) || 0;
      if (colKey === 'companyName') val = String(val).trim();
      return { colIndex, val, label: BULK_UPDATE_COLUMNS[colIndex]?.label };
    });

    // Update in-memory dataset across all 50 rows
    setDataset((prev) =>
      prev.map((row) => {
        const newRow = [...row];
        updates.forEach(({ colIndex, val }) => {
          newRow[colIndex] = val;
        });
        return newRow;
      })
    );

    // Synchronize to Handsontable grid instance
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      const rowCount = hot.countRows();
      const changes = [];
      for (let r = 0; r < rowCount; r++) {
        updates.forEach(({ colIndex, val }) => {
          changes.push([r, colIndex, val]);
        });
      }
      hot.setDataAtCell(changes, 'bulk_update');
    }

    toast.success(
      `Bulk updated ${updates.map((u) => u.label).join(' & ')} across all records!`
    );
    setBulkUpdateOpen(false);
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: isDark ? blcColors.darkBg : blcColors.cream,
        pb: 6,
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* ── Sticky Top Navbar ── */}
      <Navbar
        mode={mode}
        toggleMode={toggleMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        onExternalLinkClick={() => {}}
      />

      {/* ── Main Container ── */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {/* Top Header Card — matching Revenue Tracker page */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2.5,
            borderRadius: '12px',
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Back to Dashboard">
              <IconButton
                onClick={() => navigate('/home')}
                sx={{
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  color: isDark ? '#e2e8f0' : '#334155',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>

            <Box>
              <Breadcrumbs sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                <Link
                  underline="hover"
                  color="inherit"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate('/home')}
                >
                  Dashboard
                </Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>
                  Customer Insights
                </Typography>
              </Breadcrumbs>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: `${blcColors.navyAccent}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: blcColors.navyAccent,
                  }}
                >
                  <InsightsIcon fontSize="small" />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: typographyTokens.fontMono,
                    fontWeight: typographyTokens.weightBold,
                    color: isDark ? '#f1f5f9' : blcColors.navyAccent,
                  }}
                >
                  Customer Insights — Interactive Ledger
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Spreadsheet Card — matching Revenue Tracker layout */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '12px',
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
            boxShadow: isDark
              ? '0 12px 48px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(30,58,138,0.08)',
          }}
        >
          {/* Table Header Controls */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 1,
              mb: 1.5,
            }}
          >
            {/* Bulk Update Icon */}
            <Tooltip title="Bulk Update" placement="top" arrow>
              <IconButton
                aria-label="Bulk Update"
                onClick={() => setBulkUpdateOpen(true)}
                sx={{
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                  color: isDark ? '#94a3b8' : '#475569',
                  border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
                  borderRadius: '8px',
                  p: 0.85,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                    color: isDark ? '#ffffff' : blcColors.navyAccent,
                    borderColor: blcColors.navyAccent,
                  },
                }}
              >
                <BulkUpdateIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Reusable Global DataTable Component backed by Web Worker */}
          <DataTable
            ref={hotRef}
            dataset={dataset}
            totalRows={50}
            columns={COLUMN_DEFS}
            colHeaders={COL_HEADERS}
            rowHeaders={true}
            height={580}
            width="100%"
            stretchH="all"
            batchSize={50}
            renderAllRows={true}
            useWorker={true}
            columnSorting={true}
            filters={true}
            dropdownMenu={DROPDOWN_MENU_OPTIONS}
            manualColumnResize={true}
            manualRowResize={true}
            autoWrapRow={true}
            autoWrapCol={true}
            isDark={isDark}
            isAdmin={isAdmin}
            licenseKey="non-commercial-and-evaluation"
          />
        </Paper>
      </Container>

      {/* ── Bulk Update Popup with Chip Selection & Dynamic Input ── */}
      <Popup
        open={bulkUpdateOpen}
        onClose={() => setBulkUpdateOpen(false)}
        title="Bulk Update Records"
        maxWidth="sm"
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', width: '100%' }}>
            <AppButton
              variant="ghost"
              onClick={() => setBulkUpdateOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              disabled={selectedColumns.length === 0}
              onClick={handleApplyBulkUpdate}
            >
              Apply Bulk Update ({selectedColumns.length})
            </AppButton>
          </Box>
        }
      >
        <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Step 1: Choose 1 or More Column Chips */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 1,
              }}
            >
              1. Select Column(s) to Update:
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.25,
                alignItems: 'center',
              }}
            >
              {BULK_UPDATE_COLUMNS.map((col) => {
                const isSelected = selectedColumns.includes(col.key);
                return (
                  <Box
                    key={col.key}
                    onClick={() => handleToggleColumn(col.key)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 2.5,
                      py: 1,
                      borderRadius: '24px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: isSelected
                        ? '#2563eb'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : '#f1f5f9',
                      color: isSelected
                        ? '#ffffff'
                        : isDark
                        ? '#e2e8f0'
                        : '#1e293b',
                      border: `1px solid ${
                        isSelected
                          ? '#2563eb'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : '#e2e8f0'
                      }`,
                      boxShadow: isSelected
                        ? '0 4px 14px rgba(37, 99, 235, 0.35)'
                        : 'none',
                      '&:hover': {
                        bgcolor: isSelected
                          ? '#1d4ed8'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.14)'
                          : '#e2e8f0',
                        transform: 'translateY(-1px)',
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        color: 'inherit',
                      }}
                    >
                      {col.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Step 2: Dynamic Input Fields for all selected columns */}
          {selectedColumns.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 2,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                }}
              >
                2. Enter New Values for Selected Column(s):
              </Typography>

              {/* 1. Dropdown (Plan Tier) */}
              {selectedColumns.includes('planTier') && (
                <FormControl fullWidth size="small">
                  <InputLabel id="bulk-plan-tier-label">Plan Tier</InputLabel>
                  <Select
                    labelId="bulk-plan-tier-label"
                    value={bulkValues.planTier}
                    label="Plan Tier"
                    onChange={(e) => handleUpdateValue('planTier', e.target.value)}
                  >
                    {PLAN_TIERS.map((tier) => (
                      <MenuItem key={tier} value={tier}>
                        {tier}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* 2. Text Editor (Company Name) */}
              {selectedColumns.includes('companyName') && (
                <TextField
                  fullWidth
                  size="small"
                  label="Company Name"
                  placeholder="Enter updated company name..."
                  value={bulkValues.companyName}
                  onChange={(e) => handleUpdateValue('companyName', e.target.value)}
                />
              )}

              {/* 3. Numeric (Annual ARR) */}
              {selectedColumns.includes('annualArr') && (
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Annual ARR ($)"
                  placeholder="e.g. 75000"
                  value={bulkValues.annualArr}
                  onChange={(e) => handleUpdateValue('annualArr', e.target.value)}
                />
              )}

              {/* 4. Date Picker (Join Date) */}
              {selectedColumns.includes('joinDate') && (
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Join Date"
                  InputLabelProps={{ shrink: true }}
                  value={bulkValues.joinDate}
                  onChange={(e) => handleUpdateValue('joinDate', e.target.value)}
                />
              )}

              {/* 5. Multiselect (Channels) */}
              {selectedColumns.includes('channels') && (
                <FormControl fullWidth size="small">
                  <InputLabel id="bulk-channels-label">Channels (Multiselect)</InputLabel>
                  <Select
                    labelId="bulk-channels-label"
                    multiple
                    value={Array.isArray(bulkValues.channels) ? bulkValues.channels : []}
                    onChange={(e) => {
                      const val =
                        typeof e.target.value === 'string'
                          ? e.target.value.split(',')
                          : e.target.value;
                      handleUpdateValue('channels', val);
                    }}
                    input={<OutlinedInput label="Channels (Multiselect)" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((val) => (
                          <Chip key={val} label={val} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {ENGAGEMENT_CHANNELS.map((ch) => (
                      <MenuItem key={ch} value={ch}>
                        <Checkbox
                          checked={
                            Array.isArray(bulkValues.channels) &&
                            bulkValues.channels.includes(ch)
                          }
                          size="small"
                        />
                        <ListItemText primary={ch} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </Box>
      </Popup>
    </Box>
  );
};
