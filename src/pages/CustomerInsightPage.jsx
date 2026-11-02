// CustomerInsightPage.jsx
// ============================================================================
// PURPOSE:
//   Customer Insights spreadsheet page with Handsontable and Web Worker.
//   Strictly configured with exactly 5 columns and 50 rows.
//   Includes modular Bulk Update powered by all-in-one BulkUpdater.
//
// 5 COLUMNS & DATA TYPES:
//   1. Dropdown    — Plan Tier
//   2. Text Editor — Company Name
//   3. Numeric     — Annual ARR ($)
//   4. Date Picker — Join Date (YYYY-MM-DD)
//   5. Multiselect — Engagement Channels
// ============================================================================

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Material-UI layout and UI components
import {
  Box,
  Container,
  Paper,
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
import { DataTable, DataTableToolbar } from '../components/dataTable';

// Feature Components — All-In-One Bulk Updater
import {
  PLAN_TIERS,
  ENGAGEMENT_CHANNELS,
} from '../components/dataTable/bulkUpdater/BulkUpdater';


// Handsontable dropdown menu filter options
const DROPDOWN_MENU_OPTIONS = [
  'filter_by_condition',
  'filter_by_value',
  'filter_action_bar',
];

// ─── Exactly 50 Rows with 5 Columns ──────────────────────────────────────────
// Order: [Dropdown (Plan Tier), Text Editor (Company Name), Numeric (Annual ARR), Date Picker (Join Date), Multiselect (Channels)]
export const INITIAL_CUSTOMER_INSIGHTS = [
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

// ─── Default 5 Column Definitions & Datatypes ────────────────────────────────
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
    id: 'joinDate',
    label: 'Join Date',
    dataIndex: 3,
    type: 'date',
    dateFormat: 'YYYY-MM-DD',
    correctFormat: true,
  },
  {
    id: 'channels',
    label: 'Channels',
    dataIndex: 4,
    type: 'multiselect',
    source: ENGAGEMENT_CHANNELS,
  },
];

export const COLUMN_DEFS = DEFAULT_CUSTOMER_INSIGHT_COLUMNS;
export const COL_HEADERS = [
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
  const deleteRef = useRef(null);

  // Exactly 50 rows of data in memory
  const [dataset, setDataset] = useState(INITIAL_CUSTOMER_INSIGHTS);

  // Visible & hidden columns state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('customer_insight_visible_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
    return visibleColumns.map((col) => {
      const colDef = {
        data: col.dataIndex,
        title: col.label,
        type: col.type || 'text',
      };
      if (col.source) colDef.source = col.source;
      if (col.numericFormat) colDef.numericFormat = col.numericFormat;
      if (col.dateFormat) colDef.dateFormat = col.dateFormat;
      if (col.correctFormat !== undefined) colDef.correctFormat = col.correctFormat;
      return colDef;
    });
  }, [visibleColumns]);

  const colHeaders = useMemo(() => {
    return visibleColumns.map((col) => col.label);
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

          {/* Reusable Global DataTable Component backed by Web Worker */}
          <DataTable
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
            licenseKey="non-commercial-and-evaluation"
          />
        </Paper>
      </Container>
    </Box>
  );
};
