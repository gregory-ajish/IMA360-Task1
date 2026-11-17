// CustomerInsightPage.jsx
// ============================================================================
// PURPOSE:
//   Customer Insights spreadsheet page with Handsontable and Web Worker.
//   Configured with 6 columns and 50 rows.
//   Includes modular Bulk Update powered by all-in-one BulkUpdater.
//
// 6 COLUMNS & DATA TYPES:
//   1. Dropdown    — Plan Tier
//   2. Text Editor — Company Name
//   3. Numeric     — Annual ARR ($)
//   4. Numeric     — User Seats
//   5. Date Picker — Join Date (YYYY-MM-DD)
//   6. Multiselect — Engagement Channels
// ============================================================================

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Material-UI layout and UI components
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from '@mui/material';

// Centralized App Icons
import { InsightsIcon } from '../icons';

// Toast notifications
import { toast } from 'react-toastify';

// Theme tokens & Context
import { blcColors } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { PageHeader } from '../components/common/PageHeader';
import { Navbar } from '../components/dashboard/Navbar';
import { AppDialog } from '../components/common/AppDialog';
import { AppButton } from '../components/common/AppButton';
import {
  HandsontableSheet,
  createActionsColumn,
  DataTableToolbar,
} from '../components/tables';

// Customer API
import { fetchCustomerScales } from '../api/customerApi';

// Feature Components — All-In-One Bulk Updater
import {
  PLAN_TIERS,
  ENGAGEMENT_CHANNELS,
} from '../components/tables/bulkUpdater/BulkUpdater';


// Handsontable dropdown menu filter options
const DROPDOWN_MENU_OPTIONS = [
  'filter_by_condition',
  'filter_by_value',
  'filter_action_bar',
];

// ─── Exactly 50 Rows with 6 Columns ──────────────────────────────────────────
// Order: [Dropdown (Plan Tier), Text Editor (Company Name), Numeric (Annual ARR), Numeric (User Seats), Date Picker (Join Date), Multiselect (Channels)]
export const INITIAL_CUSTOMER_INSIGHTS = [
  ['Enterprise', 'Acme Corporation', 128000, 120, '2023-01-15', ['Email', 'In-App', 'Phone Support']],
  ['Growth', 'BlueFin Technologies', 48000, 35, '2023-02-20', ['Email', 'In-App']],
  ['Enterprise', 'CloudScale Networks', 96000, 85, '2023-03-11', ['In-App', 'Slack Community']],
  ['Scale', 'DataForge Systems', 72000, 60, '2023-04-05', ['Email', 'SMS', 'Phone Support']],
  ['Starter', 'EchoWave Media', 14500, 12, '2023-05-18', ['Email']],
  ['Enterprise', 'Frontier AI Labs', 142000, 150, '2023-06-22', ['Email', 'In-App', 'Slack Community']],
  ['Enterprise', 'Global Logistics Hub', 88000, 75, '2023-07-09', ['Email', 'Phone Support']],
  ['Scale', 'Hyperion Security', 64000, 50, '2023-08-14', ['In-App', 'Push Notifications']],
  ['Enterprise', 'Ironclad Financial', 155000, 180, '2023-09-03', ['Email', 'Phone Support', 'SMS']],
  ['Growth', 'Jupiter Analytics', 52000, 42, '2023-10-19', ['Email', 'In-App']],
  ['Scale', 'Kinetic Robotics', 78000, 68, '2023-11-27', ['Email', 'Slack Community']],
  ['Enterprise', 'Luminary Health', 165000, 210, '2023-12-08', ['Email', 'In-App', 'Phone Support']],
  ['Growth', 'Meridian Retail Group', 42000, 30, '2024-01-12', ['Email', 'SMS']],
  ['Enterprise', 'Nexus Energy Corp', 110000, 95, '2024-01-28', ['Phone Support', 'In-App']],
  ['Scale', 'OmniChannel Retail', 61000, 48, '2024-02-04', ['Email', 'Push Notifications']],
  ['Growth', 'Pulse Healthcare', 49000, 38, '2024-02-17', ['Email', 'In-App']],
  ['Enterprise', 'Quantum Dynamics', 134000, 140, '2024-03-01', ['Email', 'Slack Community', 'Phone Support']],
  ['Starter', 'RedShift Streaming', 18000, 15, '2024-03-15', ['Email', 'Push Notifications']],
  ['Enterprise', 'Stellar Aerospace', 148000, 165, '2024-03-29', ['Email', 'Phone Support']],
  ['Enterprise', 'Titan Manufacturing', 115000, 105, '2024-04-10', ['Email', 'In-App', 'SMS']],
  ['Scale', 'Unified Cloud Tech', 69000, 58, '2024-04-22', ['Email', 'Slack Community']],
  ['Growth', 'Vantage Solutions', 46000, 32, '2024-05-06', ['Email', 'In-App']],
  ['Starter', 'Waveform Audio', 16000, 10, '2024-05-19', ['Email']],
  ['Enterprise', 'Xenon Telecom', 122000, 115, '2024-06-02', ['Email', 'Phone Support', 'SMS']],
  ['Growth', 'YieldTech Agri', 53000, 44, '2024-06-15', ['Email', 'In-App']],
  ['Enterprise', 'Zenith Fintech', 159000, 195, '2024-06-29', ['Email', 'Slack Community']],
  ['Scale', 'Aurora BioLabs', 74000, 62, '2024-07-08', ['Email', 'In-App', 'Phone Support']],
  ['Growth', 'Beacon Sensor Tech', 39000, 28, '2024-07-21', ['Email', 'SMS']],
  ['Enterprise', 'Catalyst Legal AI', 137000, 145, '2024-08-03', ['Email', 'Slack Community', 'In-App']],
  ['Starter', 'Driftwood Creative', 12500, 8, '2024-08-16', ['Email']],
  ['Scale', 'Element Logistics', 67000, 54, '2024-08-30', ['In-App', 'Push Notifications']],
  ['Enterprise', 'Flux Microelectronics', 144000, 155, '2024-09-11', ['Email', 'Phone Support']],
  ['Growth', 'Gradient Design Labs', 45000, 34, '2024-09-24', ['Email', 'In-App']],
  ['Enterprise', 'Horizon Shipping', 98000, 88, '2024-10-02', ['Email', 'SMS', 'Phone Support']],
  ['Scale', 'InfiniCore Hosting', 76000, 66, '2024-10-15', ['Email', 'Slack Community']],
  ['Growth', 'JetStream Freight', 51000, 40, '2024-10-28', ['Email', 'In-App']],
  ['Starter', 'Kaleido Brand Studio', 17500, 14, '2024-11-09', ['Email']],
  ['Enterprise', 'LogicGate Cybersecurity', 162000, 205, '2024-11-22', ['Email', 'In-App', 'Phone Support']],
  ['Growth', 'Momentum Sports Tech', 47000, 36, '2024-12-04', ['In-App', 'Push Notifications']],
  ['Enterprise', 'Nebula Data Platforms', 131000, 135, '2024-12-18', ['Email', 'Slack Community']],
  ['Scale', 'Opal Smart Devices', 63000, 52, '2025-01-05', ['Email', 'In-App']],
  ['Enterprise', 'Pinnacle Asset Mgmt', 152000, 175, '2025-01-19', ['Email', 'Phone Support']],
  ['Enterprise', 'Quark Quantum Labs', 126000, 125, '2025-02-02', ['Email', 'Slack Community']],
  ['Growth', 'Radiant Clean Energy', 44000, 30, '2025-02-15', ['Email', 'SMS']],
  ['Scale', 'Synthetix Commerce', 71000, 59, '2025-03-01', ['In-App', 'Push Notifications']],
  ['Enterprise', 'TerraFlora Biotech', 139000, 150, '2025-03-14', ['Email', 'Phone Support']],
  ['Growth', 'UltraNet Fiber', 43000, 31, '2025-03-27', ['Email', 'In-App']],
  ['Enterprise', 'Vertex AI Solutions', 168000, 220, '2025-04-10', ['Email', 'In-App', 'Slack Community']],
  ['Growth', 'Willow Clean Energy', 54000, 45, '2025-04-23', ['Email', 'Phone Support']],
  ['Starter', 'Xylo Automation Labs', 15000, 11, '2025-05-06', ['Email']],
];

// ─── Default 6 Column Definitions & Datatypes ────────────────────────────────
export const DEFAULT_CUSTOMER_INSIGHT_COLUMNS = [
  {
    id: 'planTier',
    label: 'Plan Tier',
    dataIndex: 0,
    type: 'dropdown',
    source: PLAN_TIERS,
  },
  {
    id: 'companyName',
    label: 'Company Name',
    dataIndex: 1,
    type: 'text',
  },
  {
    id: 'annualArr',
    label: 'Annual ARR ($)',
    dataIndex: 2,
    type: 'numeric',
    numericFormat: { pattern: '$0,0' },
  },
  {
    id: 'seats',
    label: 'User Seats',
    dataIndex: 3,
    type: 'numeric',
    numericFormat: { pattern: '0,0' },
  },
  {
    id: 'joinDate',
    label: 'Join Date',
    dataIndex: 4,
    type: 'date',
    dateFormat: 'YYYY-MM-DD',
    correctFormat: true,
  },
  {
    id: 'channels',
    label: 'Channels',
    dataIndex: 5,
    type: 'multiselect',
    source: ENGAGEMENT_CHANNELS,
  },
];

export const COLUMN_DEFS = DEFAULT_CUSTOMER_INSIGHT_COLUMNS;
export const COL_HEADERS = [
  'Plan Tier',
  'Company Name',
  'Annual ARR ($)',
  'User Seats',
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
  const deleteRef = useRef(null);

  // Exactly 50 rows of data in memory
  const [dataset, setDataset] = useState(INITIAL_CUSTOMER_INSIGHTS);

  // Visible & hidden columns state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('customer_insight_visible_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((c) => c.id === 'seats')) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved visible columns:', e);
    }
    return DEFAULT_CUSTOMER_INSIGHT_COLUMNS;
  });

  const [hiddenColumns, setHiddenColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('customer_insight_hidden_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved hidden columns:', e);
    }
    return [];
  });

  const columns = useMemo(() => {
    const baseCols = visibleColumns.map((col) => {
      const colDef = {
        data: col.dataIndex,
        title: col.label,
        type: col.type || 'text',
      };
      if (col.source) colDef.source = col.source;
      if (col.numericFormat) colDef.numericFormat = col.numericFormat;
      if (col.dateFormat) colDef.dateFormat = col.dateFormat;
      if (col.correctFormat !== undefined) colDef.correctFormat = col.correctFormat;
      if (col.renderer) colDef.renderer = col.renderer;
      if (col.actions) colDef.actions = col.actions;
      if (col.readOnly !== undefined) colDef.readOnly = col.readOnly;
      if (col.className) colDef.className = col.className;
      if (col.width) colDef.width = col.width;
      return colDef;
    });

    // Parent defines and appends the flexible Actions column with the Scale action
    baseCols.push(
      createActionsColumn(
        [
          {
            name: 'scale',
            title: 'View Scales Tier & Pricing',
            icon: 'scale',
            color: '#0284c7',
          },
        ],
        { id: 'actions', label: 'Actions', width: 68 }
      )
    );

    return baseCols;
  }, [visibleColumns]);

  const colHeaders = useMemo(() => {
    const headers = visibleColumns.map((col) => col.label);
    headers.push('Actions');
    return headers;
  }, [visibleColumns]);

  const handleColumnsChange = (newVisible, newHidden) => {
    setVisibleColumns(newVisible);
    setHiddenColumns(newHidden);
    try {
      localStorage.setItem('customer_insight_visible_columns', JSON.stringify(newVisible));
      localStorage.setItem('customer_insight_hidden_columns', JSON.stringify(newHidden));
    } catch (e) {
      console.error('Error saving columns to localStorage:', e);
    }
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_CUSTOMER_INSIGHT_COLUMNS);
    setHiddenColumns([]);
    try {
      localStorage.removeItem('customer_insight_visible_columns');
      localStorage.removeItem('customer_insight_hidden_columns');
    } catch (e) {
      console.error('Error resetting columns:', e);
    }
    toast.info('Columns reset to default view.');
  };

  const handleAfterSelectionEnd = useCallback(() => {
    deleteRef.current?.handleAfterSelectionEnd?.();
  }, []);

  const handleDeleteRows = (indicesToDelete) => {
    const indicesSet = new Set(indicesToDelete);
    setDataset((prev) => prev.filter((_, i) => !indicesSet.has(i)));
  };

  // Apply bulk update across in-memory dataset
  const handleApplyBulkUpdate = (updates) => {
    if (!updates || updates.length === 0) return;

    // Update in-memory dataset across all filled rows (skipping empty spare rows)
    setDataset((prev) =>
      prev.map((row) => {
        const isBlank = !row || row.every((c) => c === null || c === undefined || String(c).trim() === '');
        if (isBlank) return row;
        const newRow = [...row];
        updates.forEach(({ colIndex, val }) => {
          newRow[colIndex] = val;
        });
        return newRow;
      })
    );

    toast.success(
      `Bulk updated ${updates.map((u) => u.label).join(' & ')} across all records!`
    );
  };

  // ── Scale Tiers Popup Dialog State (Controlled by Parent) ─────────────────
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [scaleRows, setScaleRows] = useState([]);
  const [isScaleLoading, setIsScaleLoading] = useState(false);

  /**
   * Action dispatcher triggered by the table when user clicks any action icon.
   *
   * Example (Scale):
   * Customer table, row 12, user clicks the Scale icon.
   * -> table tells the parent: action "scale", row 12
   * -> parent fetches the scales for row 12 (an array of objects)
   * -> parent opens a popup with that data
   * The table does not know what "scale" means.
   */
  const handleAction = useCallback(async (actionName, rowData, rowIndex) => {
    if (actionName === 'scale') {
      const customerId = rowIndex + 1;
      const planTier = Array.isArray(rowData) ? rowData[0] : (rowData?.planTier || 'Enterprise');
      const companyName = Array.isArray(rowData) ? rowData[1] : (rowData?.companyName || `Customer #${customerId}`);
      const arr = Array.isArray(rowData) ? rowData[2] : (rowData?.annualArr || 0);
      const seats = Array.isArray(rowData) ? rowData[3] : (rowData?.seats || 0);

      setSelectedCustomer({
        id: customerId,
        rowIndex,
        planTier,
        companyName,
        arr,
        seats,
      });

      setScaleModalOpen(true);
      setIsScaleLoading(true);

      try {
        // Parent calls the API with customer row id: /scales?customerId=...
        const scales = await fetchCustomerScales(customerId);
        setScaleRows(scales);
      } catch (err) {
        console.error('Failed to fetch scale data:', err);
        toast.error('Failed to fetch scale tiers for this customer.');
      } finally {
        setIsScaleLoading(false);
      }
    }
  }, []);

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

      {/* ── Main Container (Full Width) ── */}
      <Container maxWidth={false} sx={{ mt: 3, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Top Header Card — reusable PageHeader common component */}
        <PageHeader
          icon={<InsightsIcon />}
          title="Customer Insights — Interactive Ledger"
          breadcrumb="Customer Insights"
          isDark={isDark}
        />

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
          {/* Table Header Controls (Bulk Updater, Delete, Save View, Saved Views, View Management) */}
          <DataTableToolbar
            hotRef={hotRef}
            deleteRef={deleteRef}
            dataset={dataset}
            onDelete={handleDeleteRows}
            itemLabel="customer record"
            columns={columns}
            onApplyBulkUpdate={handleApplyBulkUpdate}
            visibleColumns={visibleColumns}
            hiddenColumns={hiddenColumns}
            onColumnsChange={handleColumnsChange}
            onResetColumns={handleResetColumns}
            pageKey="customer_insight"
            isDark={isDark}
          />

          {/* Reusable Global Handsontable Sheet Component backed by Web Worker */}
          <HandsontableSheet
            ref={hotRef}
            dataset={dataset}
            totalRows={dataset.length}
            columns={columns}
            colHeaders={colHeaders}
            visibleColumnsList={visibleColumns}
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
            afterSelectionEnd={handleAfterSelectionEnd}
            isDark={isDark}
            isAdmin={isAdmin}
            onAction={handleAction}
            licenseKey="non-commercial-and-evaluation"
          />
        </Paper>
      </Container>

      {/* ── Parent-Controlled Modal Popup: Second Table for Scale Tiers ── */}
      <AppDialog
        open={scaleModalOpen}
        onClose={() => setScaleModalOpen(false)}
        title="Customer Scales"
        subtitle={
          selectedCustomer
            ? `${selectedCustomer.companyName} (${selectedCustomer.planTier})`
            : ''
        }
        maxWidth="sm"
        isDark={isDark}
        actions={
          <AppButton variant="primary" onClick={() => setScaleModalOpen(false)}>
            Close
          </AppButton>
        }
      >
        {isScaleLoading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 5,
              gap: 1.5,
            }}
          >
            <CircularProgress size={32} sx={{ color: blcColors.navyAccent }} />
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Loading scale data...
            </Typography>
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: '8px',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              bgcolor: isDark ? '#0f172a' : '#ffffff',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? '#1e293b' : '#f8fafc' }}>
                  <TableCell sx={{ color: isDark ? '#94a3b8' : '#475569', fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ color: isDark ? '#94a3b8' : '#475569', fontWeight: 600 }}>Value</TableCell>
                  <TableCell sx={{ color: isDark ? '#94a3b8' : '#475569', fontWeight: 600 }}>Discount</TableCell>
                  <TableCell sx={{ color: isDark ? '#94a3b8' : '#475569', fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scaleRows.map((row) => (
                  <TableRow
                    key={row.id || row.name}
                    sx={{
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(241, 245, 249, 0.7)',
                      },
                    }}
                  >
                    <TableCell sx={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 500 }}>
                      {row.name}
                    </TableCell>
                    <TableCell sx={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 600 }}>
                      {row.value}
                    </TableCell>
                    <TableCell sx={{ color: isDark ? '#4ade80' : '#16a34a', fontWeight: 600 }}>
                      {row.discount}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status}
                        color={
                          row.status === 'Active'
                            ? 'success'
                            : row.status === 'Eligible'
                            ? 'info'
                            : 'default'
                        }
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AppDialog>
    </Box>
  );
};
