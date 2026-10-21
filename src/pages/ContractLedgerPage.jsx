// ContractLedgerPage.jsx
// ============================================================================
// PURPOSE:
//   Contract Ledger interactive spreadsheet page with Handsontable and Web Worker.
//   Tracks client contracts, tiers, ARR, join dates, and row-level actions:
//     1. Delete  — triggers confirmation dialog and removes the row
//     2. Edit    — navigates to dedicated /contract-ledger/edit/:rowId page
//     3. View    — opens modal dialog displaying contract details
// ============================================================================

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Material-UI layout and UI components
import {
  Box,
  Container,
  Paper,
} from '@mui/material';

// Centralized App Icons
import {
  ContractLedgerIcon,
} from '../icons';

// Toast notifications
import { toast } from 'react-toastify';

// Handsontable registry and core styling
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// Theme tokens & Context
import { blcColors } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { PageHeader } from '../components/common/PageHeader';
import { Navbar } from '../components/dashboard/Navbar';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DataTable, actionButtonsRenderer } from '../components/dataTable';

// Shared options and dataset from Customer Insights
import {
  PLAN_TIERS,
  ENGAGEMENT_CHANNELS,
} from '../components/dataTable/bulkUpdater/BulkUpdater';
import { INITIAL_CUSTOMER_INSIGHTS } from './CustomerInsightPage';

// Register all Handsontable modules
registerAllModules();

// Handsontable dropdown menu filter options
const DROPDOWN_MENU_OPTIONS = [
  'filter_by_condition',
  'filter_by_value',
  'filter_action_bar',
];

// Centralized storage key for Contract Ledger
export const CONTRACT_LEDGER_STORAGE_KEY = 'contract_ledger_dataset';
// Compatibility alias
export const COPILOT_STORAGE_KEY = CONTRACT_LEDGER_STORAGE_KEY;

// Re-export shared tokens and initial dataset
export { PLAN_TIERS, ENGAGEMENT_CHANNELS };
export const INITIAL_CONTRACT_LEDGER_DATA = INITIAL_CUSTOMER_INSIGHTS.map((row) => [
  row[0],
  row[1],
  row[2],
  row[3],
]);
// Compatibility alias
export const INITIAL_COPILOT_DATA = INITIAL_CONTRACT_LEDGER_DATA;

// ─── Column Definitions with Action Column (5 Columns Total) ─────────────────
const COLUMN_DEFS = [
  {
    data: 0,
    title: 'Plan Tier',
    type: 'dropdown',
    source: PLAN_TIERS,
    width: 160,
    className: 'htCenter htMiddle',
  },
  {
    data: 1,
    title: 'Company Name',
    type: 'text',
    width: 260,
    className: 'htCenter htMiddle',
  },
  {
    data: 2,
    title: 'Annual ARR ($)',
    type: 'numeric',
    numericFormat: { pattern: '$0,0' },
    width: 180,
    className: 'htCenter htMiddle',
  },
  {
    data: 3,
    title: 'Join Date',
    type: 'date',
    dateFormat: 'YYYY-MM-DD',
    correctFormat: true,
    width: 160,
    className: 'htCenter htMiddle',
  },
  {
    title: 'Action',
    renderer: actionButtonsRenderer,
    readOnly: true,
    className: 'htCenter htMiddle',
    width: 140,
  },
];

const COL_HEADERS = [
  'Plan Tier',
  'Company Name',
  'Annual ARR ($)',
  'Join Date',
  'Action',
];

/**
 * ContractLedgerPage Component
 */
export const ContractLedgerPage = ({ mode, toggleMode }) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  const hotRef = useRef(null);

  // In-memory dataset synced with localStorage
  const [dataset, setDataset] = useState(() => {
    try {
      const stored = localStorage.getItem(CONTRACT_LEDGER_STORAGE_KEY) || localStorage.getItem('ai_copilot_dataset');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse contract ledger dataset:', e);
    }
    return INITIAL_CONTRACT_LEDGER_DATA;
  });

  // ── Action 1: Delete Row State ─────────────────────────────────────────────
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const handleRequestDelete = (rowIndex, rowData) => {
    const row = rowData || dataset[rowIndex];
    setRowToDelete({ index: rowIndex, data: row });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!rowToDelete) return;
    const { index } = rowToDelete;

    // Remove row from Handsontable instance if available
    if (hotRef.current?.hotInstance) {
      try {
        hotRef.current.hotInstance.alter('remove_row', index, 1);
      } catch {
        // Fallback handled via dataset state update
      }
    }

    setDataset((prev) => {
      const next = prev.filter((_, i) => i !== index);
      try {
        localStorage.setItem(CONTRACT_LEDGER_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    toast.success('Contract row removed successfully.');
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  // ── Action 2: Navigate to Edit Page at /contract-ledger/edit/:rowId ──────────
  const handleRequestEdit = (rowIndex) => {
    navigate(`/contract-ledger/edit/${rowIndex + 1}`);
  };

  // ── Action 3: Navigate to View Page at /contract-ledger/view/:rowId ──────────
  const handleRequestView = (rowIndex) => {
    navigate(`/contract-ledger/view/${rowIndex + 1}`);
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Centralized action cell click dispatcher using standard onCellClick
  const handleCellClick = (event, coords, _cellValue, rowData) => {
    const target = event?.target;
    if (!target) return;
    const deleteBtn = target.closest('.action-delete-btn, .rt-delete-btn');
    const editBtn = target.closest('.action-edit-btn, .rt-edit-btn');
    const viewBtn = target.closest('.action-view-btn, .rt-view-btn');

    if (deleteBtn) {
      handleRequestDelete(coords.row, rowData);
    } else if (editBtn) {
      handleRequestEdit(coords.row, rowData);
    } else if (viewBtn) {
      handleRequestView(coords.row);
    }
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
        {/* Top Header Card */}
        <PageHeader
          icon={<ContractLedgerIcon />}
          title="Contract Ledger — Interactive Table"
          breadcrumb="Contract Ledger"
          isDark={isDark}
        />

        {/* Spreadsheet Card */}
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
          {/* Reusable Global DataTable Component backed by Web Worker */}
          <DataTable
            ref={hotRef}
            dataset={dataset}
            totalRows={dataset.length}
            columns={COLUMN_DEFS}
            colHeaders={COL_HEADERS}
            colWidths={[140, 220, 150, 140, 280, 140]}
            rowHeights={46}
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
            onCellClick={handleCellClick}
            sx={{
              '& .handsontable td': {
                verticalAlign: 'middle !important',
              },
              '& .handsontable th': {
                verticalAlign: 'middle !important',
              },
              '& .handsontable td.htCenter, & .handsontable td.htNumeric.htCenter': {
                textAlign: 'center !important',
              },
              '& .handsontable th:last-child': {
                textAlign: 'center !important',
              },
              '& .handsontable td:last-child': {
                textAlign: 'center !important',
                verticalAlign: 'middle !important',
                padding: '0 !important',
              },
              '& .action-btn-group': {
                position: 'relative !important',
                top: '-12px !important',
              },
            }}
          />
        </Paper>
      </Container>

      {/* ── Action 1 Modal: Confirm Delete Dialog ────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Confirm Contract Deletion"
        message="Are you sure you want to remove this contract row?"
        confirmText="Delete"
        cancelText="Cancel"
        isDark={isDark}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </Box>
  );
};

export default ContractLedgerPage;
