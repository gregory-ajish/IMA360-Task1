// ContractLedgerPage.jsx
// ============================================================================
// PURPOSE:
//   Contract Ledger interactive spreadsheet page with Handsontable and Web Worker.
//   Tracks client contracts, tiers, ARR, join dates, and row-level actions:
//     1. Delete  — triggers confirmation dialog and removes the row
//     2. Edit    — navigates to dedicated /contract-ledger/edit/:rowId page
//     3. View    — opens modal dialog displaying contract details
// ============================================================================

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

// Material-UI layout and UI components
import {
  Box,
  Container,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';

// Centralized App Icons
import {
  ContractLedgerIcon,
  ViewsIcon,
  SavedViewsIcon,
  ViewColumnIcon,
} from '../icons';

// Redux views actions
import { saveView, setActiveView } from '../store/viewsReducer';

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
import { DataTable, actionButtonsRenderer } from '../components/dataTable';
import { Delete } from '../components/dataTable/delete';

// View Management Modals
import { ViewManagementModal } from '../components/dataTable/viewManagement/ViewManagementModal';
import { SaveViewModal } from '../components/dataTable/viewManagement/SaveViewModal';
import { SavedViewsModal } from '../components/dataTable/viewManagement/SavedViewsModal';

// Shared options and packed BulkUpdater
import {
  BulkUpdater,
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

// ─── Default Column Definitions for View Management & Bulk Updater ───────────
export const DEFAULT_CONTRACT_LEDGER_COLUMNS = [
  {
    id: 'planTier',
    label: 'Plan Tier',
    dataIndex: 0,
    type: 'dropdown',
    source: PLAN_TIERS,
    className: 'htCenter htMiddle',
  },
  {
    id: 'companyName',
    label: 'Company Name',
    dataIndex: 1,
    type: 'text',
    className: 'htCenter htMiddle',
  },
  {
    id: 'annualArr',
    label: 'Annual ARR ($)',
    dataIndex: 2,
    type: 'numeric',
    numericFormat: { pattern: '$0,0' },
    className: 'htCenter htMiddle',
  },
  {
    id: 'joinDate',
    label: 'Join Date',
    dataIndex: 3,
    type: 'date',
    dateFormat: 'YYYY-MM-DD',
    correctFormat: true,
    className: 'htCenter htMiddle',
  },
];

// Legacy alias for compatibility
export const COLUMN_DEFS = DEFAULT_CONTRACT_LEDGER_COLUMNS;
export const COL_HEADERS = ['Plan Tier', 'Company Name', 'Annual ARR ($)', 'Join Date', 'Action'];

/**
 * ContractLedgerPage Component
 */
export const ContractLedgerPage = ({ mode, toggleMode }) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
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

  // ── View Management Modals State ───────────────────────────────────────────
  const [saveViewModalOpen, setSaveViewModalOpen] = useState(false);
  const [savedViewsModalOpen, setSavedViewsModalOpen] = useState(false);
  const [viewManagementOpen, setViewManagementOpen] = useState(false);

  // ── Visible & Hidden Columns State synced with localStorage ─────────────────
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('contract_ledger_visible_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved visible columns:', e);
    }
    return DEFAULT_CONTRACT_LEDGER_COLUMNS;
  });

  const [hiddenColumns, setHiddenColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('contract_ledger_hidden_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved hidden columns:', e);
    }
    return [];
  });

  // Dynamically constructed columns with Action column at the end
  const columns = useMemo(() => {
    const baseCols = visibleColumns.map((col) => {
      const colDef = {
        data: col.dataIndex,
        title: col.label,
        type: col.type || 'text',
        className: col.className || 'htCenter htMiddle',
      };
      if (col.source) colDef.source = col.source;
      if (col.numericFormat) colDef.numericFormat = col.numericFormat;
      if (col.dateFormat) colDef.dateFormat = col.dateFormat;
      if (col.correctFormat !== undefined) colDef.correctFormat = col.correctFormat;
      return colDef;
    });

    baseCols.push({
      title: 'Action',
      renderer: actionButtonsRenderer,
      readOnly: true,
      className: 'htCenter htMiddle',
    });

    return baseCols;
  }, [visibleColumns]);

  const colHeaders = useMemo(() => {
    const headers = visibleColumns.map((col) => col.label);
    headers.push('Action');
    return headers;
  }, [visibleColumns]);

  // View management handlers
  const handleColumnsChange = (newVisible, newHidden) => {
    setVisibleColumns(newVisible);
    setHiddenColumns(newHidden);
    try {
      localStorage.setItem('contract_ledger_visible_columns', JSON.stringify(newVisible));
      localStorage.setItem('contract_ledger_hidden_columns', JSON.stringify(newHidden));
    } catch (e) {
      console.error('Error saving columns layout to localStorage:', e);
    }
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_CONTRACT_LEDGER_COLUMNS);
    setHiddenColumns([]);
    try {
      localStorage.removeItem('contract_ledger_visible_columns');
      localStorage.removeItem('contract_ledger_hidden_columns');
    } catch (e) {
      console.error('Error resetting columns:', e);
    }
    toast.info('Columns reset to default view.');
  };

  const handleSaveView = (name) => {
    const newView = {
      id: `view_${Date.now()}`,
      name,
      visibleColumns: [...visibleColumns],
      hiddenColumns: [...hiddenColumns],
      createdAt: new Date().toISOString(),
    };
    dispatch(saveView(newView));
    toast.success(`View "${name}" saved!`);
  };

  const handleApplyView = (view) => {
    if (!view) return;
    setVisibleColumns(view.visibleColumns || DEFAULT_CONTRACT_LEDGER_COLUMNS);
    setHiddenColumns(view.hiddenColumns || []);
    dispatch(setActiveView(view.id));
    toast.info(`Applied view: ${view.name}`);
  };

  // Bulk update handler across in-memory and persistent dataset
  const handleApplyBulkUpdate = (updates) => {
    if (!updates || updates.length === 0) return;

    setDataset((prev) => {
      const next = prev.map((row) => {
        const newRow = [...row];
        updates.forEach(({ colIndex, val }) => {
          newRow[colIndex] = val;
        });
        return newRow;
      });
      try {
        localStorage.setItem(CONTRACT_LEDGER_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist bulk updates:', e);
      }
      return next;
    });

    toast.success(
      `Bulk updated ${updates.map((u) => u.label).join(' & ')} across all records!`
    );
  };

  // ── Action 1: Delete Row Handlers (Reusable Delete Component) ─────────────
  const deleteRef = useRef(null);

  // Track selection changes so toolbar click never loses selected rows
  const handleAfterSelectionEnd = useCallback(() => {
    deleteRef.current?.handleAfterSelectionEnd?.();
  }, []);

  // Single row delete trigger (from cell action button)
  const handleRequestDelete = (rowIndex, rowData) => {
    deleteRef.current?.requestDelete(rowIndex, rowData);
  };

  // Callback after user confirms deletion in DeleteMechanism's dialog
  const handleDeleteRows = (indicesToDelete) => {
    const indicesSet = new Set(indicesToDelete);
    setDataset((prev) => {
      const next = prev.filter((_, i) => !indicesSet.has(i));
      try {
        localStorage.setItem(CONTRACT_LEDGER_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist delete to localStorage:', e);
      }
      return next;
    });
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
        onExternalLinkClick={() => { }}
      />

      {/* ── Main Container (Full Width) ── */}
      <Container maxWidth={false} sx={{ mt: 3, px: { xs: 2, sm: 3, md: 4 } }}>
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
          {/* Table Header Controls: 4 Icons (3 View Management + 1 Bulk Updater) */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 1,
              mb: 1.5,
            }}
          >
            {/* 1. Bulk Updater Icon */}
            <BulkUpdater
              columns={columns}
              hotRef={hotRef}
              onApply={handleApplyBulkUpdate}
              isDark={isDark}
            />

            {/* 2. Delete (Toolbar Button & Confirmation Modal) */}
            <Delete
              ref={deleteRef}
              hotRef={hotRef}
              dataset={dataset}
              onDelete={handleDeleteRows}
              itemLabel="contract row"
              isDark={isDark}
            />

            {/* 3. Save Current View Icon */}
            <Tooltip title="Save Current View" placement="top" arrow>
              <IconButton
                aria-label="Save Current View"
                onClick={() => setSaveViewModalOpen(true)}
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
                <ViewsIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* 3. Saved Views Icon */}
            <Tooltip title="Saved Views" placement="top" arrow>
              <IconButton
                aria-label="Saved Views"
                onClick={() => setSavedViewsModalOpen(true)}
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
                <SavedViewsIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* 4. View Management Icon */}
            <Tooltip title="View Management" placement="top" arrow>
              <IconButton
                aria-label="View Management"
                onClick={() => setViewManagementOpen(true)}
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
                <ViewColumnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Reusable Global DataTable Component backed by Web Worker */}
          <DataTable
            ref={hotRef}
            dataset={dataset}
            totalRows={dataset.length}
            columns={columns}
            colHeaders={colHeaders}
            visibleColumnsList={visibleColumns}
            rowHeaders={true}
            rowHeights={20}
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
            outsideClickDeselects={false}
            selectionMode="multiple"
            afterSelectionEnd={handleAfterSelectionEnd}
            isDark={isDark}
            isAdmin={isAdmin}
            licenseKey="non-commercial-and-evaluation"
            onCellClick={handleCellClick}
            sx={{
              '& .handsontable td.area, & .handsontable td.current': {
                backgroundColor: isDark
                  ? 'rgba(59, 130, 246, 0.18) !important'
                  : 'rgba(30, 58, 138, 0.10) !important',
              },
              '& .handsontable td': {
                verticalAlign: 'middle !important',
                textAlign: 'center !important',
                zIndex: 'auto !important',
              },
              '& .handsontable th': {
                verticalAlign: 'middle !important',
                textAlign: 'center !important',
              },
              '& .handsontable th .colHeader': {
                textAlign: 'center !important',
              },
              '& .handsontable td.htCenter, & .handsontable td.htNumeric, & .handsontable td.htNumeric.htCenter, & .handsontable td.htAutocomplete, & .handsontable td.htDimmed': {
                textAlign: 'center !important',
                verticalAlign: 'middle !important',
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
                display: 'inline-flex !important',
                alignItems: 'center !important',
                justifyContent: 'center !important',
                verticalAlign: 'middle !important',
                lineHeight: '1 !important',
                margin: '0 auto !important',
              },
            }}
          />
        </Paper>
      </Container>



      {/* ── View Management Modals ── */}
      <SaveViewModal
        open={saveViewModalOpen}
        onClose={() => setSaveViewModalOpen(false)}
        onSave={handleSaveView}
        isDark={isDark}
      />

      <SavedViewsModal
        open={savedViewsModalOpen}
        onClose={() => setSavedViewsModalOpen(false)}
        onApplyView={handleApplyView}
        isDark={isDark}
      />

      <ViewManagementModal
        open={viewManagementOpen}
        onClose={() => setViewManagementOpen(false)}
        visibleColumns={visibleColumns}
        hiddenColumns={hiddenColumns}
        onColumnsChange={handleColumnsChange}
        onReset={handleResetColumns}
        isDark={isDark}
      />
    </Box>
  );
};

export default ContractLedgerPage;
