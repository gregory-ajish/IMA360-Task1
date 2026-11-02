// ContractLedgerPage.jsx
// ============================================================================
// PURPOSE:
//   Contract Ledger interactive table page powered by MUI X DataGrid.
//   Supports 5 key toolbar features:
//     1. Bulk Updater     — updates selected or all records across columns
//     2. Delete           — batch delete via toolbar or single row action with confirmation
//     3. Save View        — saves current column layout to Redux
//     4. Saved Views      — browse and apply saved views
//     5. View Management  — drag-and-drop column reordering and visibility toggle
//   Row actions:
//     - Delete: prompts confirmation dialog and removes the row
//     - Edit:   navigates to dedicated /contract-ledger/edit/:rowId page
//     - View:   navigates to dedicated /contract-ledger/view/:rowId page
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
import { AppDataGrid } from '../components/dataTable';

// Centralized App Icons
import {
  ContractLedgerIcon,
  ViewsIcon,
  SavedViewsIcon,
  ViewColumnIcon,
  DeleteIcon,
  VisibilityIcon,
  EditNoteIcon,
  ResetIcon,
} from '../icons';

// Redux views actions
import { saveView, setActiveView } from '../store/viewsReducer';

// Toast notifications
import { toast } from 'react-toastify';

// Theme tokens & Context
import { blcColors, typographyTokens } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { PageHeader } from '../components/common/PageHeader';
import { Navbar } from '../components/dashboard/Navbar';
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
];

// Legacy alias for compatibility
export const COLUMN_DEFS = DEFAULT_CONTRACT_LEDGER_COLUMNS;
export const COL_HEADERS = ['Plan Tier', 'Company Name', 'Annual ARR ($)', 'Join Date', 'Action'];

/**
 * ContractLedgerPage Component
 */
export const ContractLedgerPage = ({ mode, toggleMode }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDark = mode === 'dark';

  // Selected row indices via row click (no checkboxes)
  const [selectedRowIndices, setSelectedRowIndices] = useState([]);
  const lastClickedIndexRef = useRef(null);

  // Row click selection handler supporting single click, Ctrl/Cmd-click, and Shift-click
  const handleRowClick = useCallback((params, event) => {
    // If click originated on action buttons, do not toggle row selection
    if (event?.target?.closest('button, .MuiIconButton-root')) return;

    const rowIndex = params.row.rawIndex;
    const isCtrlPressed = event?.ctrlKey || event?.metaKey;
    const isShiftPressed = event?.shiftKey;

    if (isShiftPressed && lastClickedIndexRef.current !== null) {
      const start = Math.min(lastClickedIndexRef.current, rowIndex);
      const end = Math.max(lastClickedIndexRef.current, rowIndex);
      const rangeIndices = [];
      for (let i = start; i <= end; i++) {
        rangeIndices.push(i);
      }
      setSelectedRowIndices((prev) => Array.from(new Set([...prev, ...rangeIndices])));
    } else if (isCtrlPressed) {
      setSelectedRowIndices((prev) =>
        prev.includes(rowIndex) ? prev.filter((i) => i !== rowIndex) : [...prev, rowIndex]
      );
      lastClickedIndexRef.current = rowIndex;
    } else {
      // Single click: toggle selection if already solely selected, else select just this row
      setSelectedRowIndices((prev) =>
        prev.length === 1 && prev[0] === rowIndex ? [] : [rowIndex]
      );
      lastClickedIndexRef.current = rowIndex;
    }
  }, []);

  // In-memory dataset synced with localStorage (validated against empty/corrupted rows)
  const [dataset, setDataset] = useState(() => {
    try {
      const stored = localStorage.getItem(CONTRACT_LEDGER_STORAGE_KEY) || localStorage.getItem('ai_copilot_dataset');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasValidContent = parsed.some((row) => {
            if (Array.isArray(row)) {
              return row.some((c) => c !== null && c !== undefined && String(c).trim() !== '');
            }
            if (row && typeof row === 'object') {
              return Boolean(row.companyName || row.planTier || row.annualArr || row.joinDate);
            }
            return false;
          });
          if (hasValidContent) return parsed;
        }
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

  // Columns configuration for BulkUpdater
  const columns = visibleColumns;

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
      pageKey: 'contract_ledger',
      visibleColumns: [...visibleColumns],
      hiddenColumns: [...hiddenColumns],
      createdAt: new Date().toISOString(),
    };
    dispatch(saveView(newView));
    toast.success(`View "${name}" saved!`);
  };

  const handleApplyView = (view) => {
    if (!view) return;
    const newVisible = view.visibleColumns || DEFAULT_CONTRACT_LEDGER_COLUMNS;
    const newHidden = view.hiddenColumns || [];
    setVisibleColumns(newVisible);
    setHiddenColumns(newHidden);
    try {
      localStorage.setItem('contract_ledger_visible_columns', JSON.stringify(newVisible));
      localStorage.setItem('contract_ledger_hidden_columns', JSON.stringify(newHidden));
    } catch (e) {
      console.error('Error saving applied view to localStorage:', e);
    }
    dispatch(setActiveView(view.id));
    toast.info(`Applied view: ${view.name}`);
  };

  // Bulk update handler: updates selected rows if any are checked, or all records if none selected
  const handleApplyBulkUpdate = (updates) => {
    if (!updates || updates.length === 0) return;

    const hasSelection = selectedRowIndices.length > 0;
    const selectedSet = new Set(selectedRowIndices);

    setDataset((prev) => {
      const next = prev.map((row, idx) => {
        const isBlank = !row || (Array.isArray(row) && row.every((c) => c === null || c === undefined || String(c).trim() === ''));
        if (isBlank) return row;
        if (hasSelection && !selectedSet.has(idx)) return row;

        const newRow = Array.isArray(row)
          ? [...row]
          : [row.planTier || 'Enterprise', row.companyName || '', row.annualArr || 0, row.joinDate || ''];
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

    const targetMsg = hasSelection
      ? `across ${selectedRowIndices.length} selected record${selectedRowIndices.length === 1 ? '' : 's'}!`
      : 'across all records!';
    toast.success(
      `Bulk updated ${updates.map((u) => u.label).join(' & ')} ${targetMsg}`
    );
  };

  // Reset handler: restores table dataset back to the initial 50 records
  const handleResetData = useCallback(() => {
    setDataset(INITIAL_CONTRACT_LEDGER_DATA);
    setSelectedRowIndices([]);
    lastClickedIndexRef.current = null;
    try {
      localStorage.setItem(CONTRACT_LEDGER_STORAGE_KEY, JSON.stringify(INITIAL_CONTRACT_LEDGER_DATA));
      localStorage.removeItem('ai_copilot_dataset');
    } catch (e) {
      console.warn('Failed to reset dataset in localStorage:', e);
    }
    toast.success('Reset contract ledger to initial 50 records!');
  }, []);

  // ── Action 1: Delete Handlers (Reusable Delete Component) ─────────────────
  const deleteRef = useRef(null);

  // Single row delete trigger (from cell action button)
  const handleRequestDelete = useCallback((rowIndex, rowData) => {
    deleteRef.current?.requestDelete(rowIndex, rowData);
  }, []);

  // Callback after user confirms deletion in Delete dialog
  const handleDeleteRows = useCallback((indicesToDelete) => {
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
    setSelectedRowIndices([]);
    lastClickedIndexRef.current = null;
  }, []);

  // ── Action 2: Navigate to Edit Page at /contract-ledger/edit/:rowId ──────────
  const handleRequestEdit = useCallback((rowIndex) => {
    navigate(`/contract-ledger/edit/${rowIndex + 1}`);
  }, [navigate]);

  // ── Action 3: Navigate to View Page at /contract-ledger/view/:rowId ──────────
  const handleRequestView = useCallback((rowIndex) => {
    navigate(`/contract-ledger/view/${rowIndex + 1}`);
  }, [navigate]);

  // ─── Data Adapter: Convert dataset to MUI DataGrid row objects ───────────
  const rows = useMemo(() => {
    if (!Array.isArray(dataset)) return [];
    return dataset.map((row, index) => {
      const isArr = Array.isArray(row);
      return {
        id: index,
        rawIndex: index,
        displayId: index + 1,
        planTier: isArr ? (row[0] || 'Enterprise') : (row?.planTier || 'Enterprise'),
        companyName: isArr ? (row[1] || '') : (row?.companyName || ''),
        annualArr: isArr
          ? (row[2] !== undefined && row[2] !== null ? Number(row[2]) : 0)
          : (row?.annualArr !== undefined && row?.annualArr !== null ? Number(row.annualArr) : 0),
        joinDate: isArr ? (row[3] || '') : (row?.joinDate || ''),
      };
    });
  }, [dataset]);

  // ─── Non-Editable DataGrid Column Definitions ──────────────────────────────
  const gridColumns = useMemo(() => {
    const allDefs = [
      {
        field: 'planTier',
        headerName: 'Plan Tier',
        flex: 1,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
        editable: false,
        valueGetter: (value, row) => value || (row && row.planTier) || 'Enterprise',
      },
      {
        field: 'companyName',
        headerName: 'Company Name',
        flex: 1.5,
        minWidth: 200,
        headerAlign: 'center',
        align: 'center',
        editable: false,
      },
      {
        field: 'annualArr',
        headerName: 'Annual ARR ($)',
        flex: 1.2,
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        editable: false,
        valueFormatter: (value) => {
          const v = value && typeof value === 'object' && 'value' in value ? value.value : value;
          if (v === undefined || v === null || v === '') return '$0';
          return `$${Number(v).toLocaleString()}`;
        },
      },
      {
        field: 'joinDate',
        headerName: 'Join Date',
        flex: 1.2,
        minWidth: 140,
        headerAlign: 'center',
        align: 'center',
        editable: false,
      },
    ];

    // Filter & dynamically reorder columns to match visibleColumns
    const defsMap = new Map(allDefs.map((col) => [col.field, col]));
    let activeCols = (visibleColumns || [])
      .map((col) => defsMap.get(col.id || col.field || col.key))
      .filter(Boolean);

    // Safeguard: If activeCols is empty, fall back to all default columns so table never appears blank
    if (activeCols.length === 0) {
      activeCols = [...allDefs];
    }

    // Append non-editable Action Column containing Delete, Edit, and View buttons
    activeCols.push({
      field: 'actions',
      headerName: 'Action',
      width: 140,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      editable: false,
      renderCell: (params) => {
        const rowIndex = params.row.rawIndex;
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
            }}
          >
            {/* 1. Delete Button */}
            <Tooltip title="Delete row" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestDelete(rowIndex, dataset[rowIndex]);
                }}
                sx={{
                  color: '#ef4444',
                  p: 0.5,
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' },
                }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {/* 2. Edit Button (Navigates to /contract-ledger/edit/:rowId) */}
            <Tooltip title="Edit record" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestEdit(rowIndex);
                }}
                sx={{
                  color: '#3b82f6',
                  p: 0.5,
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.15)' },
                }}
              >
                <EditNoteIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>

            {/* 3. View Button (Navigates to /contract-ledger/view/:rowId) */}
            <Tooltip title="View record" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestView(rowIndex);
                }}
                sx={{
                  color: '#10b981',
                  p: 0.5,
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' },
                }}
              >
                <VisibilityIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    });

    return activeCols;
  }, [visibleColumns, dataset, handleRequestDelete, handleRequestEdit, handleRequestView]);

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
          {/* Table Header Controls: 5 Features (Bulk Updater, Delete, Save View, Saved Views, View Management) */}
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
              onApply={handleApplyBulkUpdate}
              isDark={isDark}
            />

            {/* 2. Delete (Toolbar Button & Confirmation Modal) */}
            <Delete
              ref={deleteRef}
              selectedRowIndices={selectedRowIndices}
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

            {/* 4. Saved Views Icon */}
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

            {/* 5. View Management Icon */}
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

            {/* 6. Reset to Initial Data (Restore 50 default records) */}
            <Tooltip title="Reset to Initial Data (50 Records)" placement="top" arrow>
              <IconButton
                aria-label="Reset to Initial Data"
                onClick={handleResetData}
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
                <ResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Reusable Common DataGrid Component */}
          <AppDataGrid
            rows={rows}
            columns={gridColumns}
            selectedRowIndices={selectedRowIndices}
            onRowClick={handleRowClick}
            isDark={isDark}
            height={580}
            rowHeight={46}
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
        pageKey="contract_ledger"
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
