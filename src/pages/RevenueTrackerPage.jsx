// RevenueTrackerPage.jsx
// ============================================================================
// PURPOSE:
//   A protected web page for the Revenue Tracker enterprise-grade spreadsheet
//   powered by Handsontable & Web Worker at route `/revenue-tracker`.
// ============================================================================

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Material-UI components
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Breadcrumbs,
  Link,
  Tooltip,
} from '@mui/material';

// Material-UI icons
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  TableChart as TableChartIcon,
  ViewColumn as ViewColumnIcon,
  Visibility as ViewsIcon,
  BookmarkBorder as SavedViewsIcon,
} from '@mui/icons-material';

// Global Shared DataTable Component & Action Renderer
import { DataTable, deleteButtonRenderer } from '../components/common/DataTable';

// Toast notifications
import { toast } from 'react-toastify';

// Theme tokens & Context
import { blcColors, typographyTokens } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common & Feature Components
import { Navbar } from '../components/dashboard/Navbar';
import { AppButton } from '../components/common/AppButton';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ViewManagementModal } from '../components/revenue/ViewManagementModal';
import { SaveViewModal } from '../components/revenue/SaveViewModal';
import { SavedViewsModal } from '../components/revenue/SavedViewsModal';

// Redux hooks and actions
import { useSelector, useDispatch } from 'react-redux';
import { saveView, setActiveView } from '../store/viewsReducer';

// Shared localStorage key
const SHARED_STORAGE_KEY = 'revenue_ledger_shared';

const DROPDOWN_MENU_OPTIONS = [
  'filter_by_condition',
  'filter_by_value',
  'filter_action_bar',
];

export const TOTAL_AVAILABLE_ROWS = 1_000_000;

/**
 * Procedurally generates the 1,000,000 dataset for Revenue Tracker.
 * Moved from Web Worker to Revenue Tracker page as domain-specific data provider.
 */
export const generateRevenueDataset = (totalCount = TOTAL_AVAILABLE_ROWS) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dataset = new Array(totalCount);

  for (let i = 0; i < totalCount; i++) {
    const expansion = Math.floor(12000 + ((i * 17) % 18000));
    const churn = Math.floor(2000 + ((i * 7) % 6000));
    const mrr = Math.max(50000, Math.floor(145000 + ((i * 131) % 120000)));
    const net = mrr + expansion - churn;
    const target = mrr + 14000;
    const year = 2022 + (Math.floor(i / 12) % 5);
    const status = net >= target ? 'Exceeded' : net >= target * 0.95 ? 'On Track' : 'Behind';

    dataset[i] = [
      `${months[i % 12]} ${year} (#${i + 1})`,
      mrr,
      expansion,
      churn,
      net,
      target,
      status,
    ];
  }
  return dataset;
};

/**
 * Master column configuration metadata for the Revenue Tracker ledger.
 */
export const DEFAULT_REVENUE_COLUMNS = [
  { id: 'month', label: 'Month', dataIndex: 0, type: 'text', width: 150 },
  { id: 'startingMrr', label: 'Starting MRR ($)', dataIndex: 1, type: 'numeric', width: 130, numericFormat: { pattern: '$0,0' } },
  { id: 'expansion', label: 'Expansion ($)', dataIndex: 2, type: 'numeric', width: 120, numericFormat: { pattern: '$0,0' } },
  { id: 'churn', label: 'Churn ($)', dataIndex: 3, type: 'numeric', width: 110, numericFormat: { pattern: '$0,0' } },
  { id: 'netRevenue', label: 'Net Revenue ($)', dataIndex: 4, type: 'numeric', width: 130, numericFormat: { pattern: '$0,0' } },
  { id: 'target', label: 'Target ($)', dataIndex: 5, type: 'numeric', width: 120, numericFormat: { pattern: '$0,0' } },
  { id: 'status', label: 'Status', dataIndex: 6, type: 'dropdown', width: 110, source: ['Exceeded', 'On Track', 'Behind'] },
];

/**
 * RevenueTrackerPage Component
 */
export const RevenueTrackerPage = ({ mode, toggleMode }) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  const hotRef = useRef(null);

  // Generate 1M row dataset for Revenue Tracker
  const dataset = useMemo(() => generateRevenueDataset(TOTAL_AVAILABLE_ROWS), []);

  // Delete Confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  // Redux views state & Save View modal state
  const dispatch = useDispatch();
  const [saveViewModalOpen, setSaveViewModalOpen] = useState(false);
  const [savedViewsModalOpen, setSavedViewsModalOpen] = useState(false);

  // View Management modal & column reordering state
  const [viewManagementOpen, setViewManagementOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('revenue_visible_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved visible columns:', e);
    }
    return DEFAULT_REVENUE_COLUMNS;
  });

  const [hiddenColumns, setHiddenColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('revenue_hidden_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved hidden columns:', e);
    }
    return [];
  });

  const handleColumnsChange = (newVisible, newHidden) => {
    setVisibleColumns(newVisible);
    setHiddenColumns(newHidden);
    try {
      localStorage.setItem('revenue_visible_columns', JSON.stringify(newVisible));
      localStorage.setItem('revenue_hidden_columns', JSON.stringify(newHidden));
    } catch (e) {
      console.error('Error saving columns layout to localStorage:', e);
    }
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_REVENUE_COLUMNS);
    setHiddenColumns([]);
    try {
      localStorage.removeItem('revenue_visible_columns');
      localStorage.removeItem('revenue_hidden_columns');
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
    setVisibleColumns(view.visibleColumns || DEFAULT_REVENUE_COLUMNS);
    setHiddenColumns(view.hiddenColumns || []);
    dispatch(setActiveView(view.id));
    toast.info(`Applied view: ${view.name}`);
  };

  const handleRequestDelete = (rowVisualIndex) => {
    if (!isAdmin) return;
    setRowToDelete(rowVisualIndex);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (rowToDelete !== null && hotRef.current?.hotInstance) {
      const hot = hotRef.current.hotInstance;
      hot.alter('remove_row', rowToDelete, 1);
      toast.success('Row removed successfully.');
    }
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  const handleSave = () => {
    if (!isAdmin) return;
    try {
      const currentData = hotRef.current?.hotInstance
        ? hotRef.current.hotInstance.getSourceData()
        : dataset;
      localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(currentData.slice(0, 100)));
      toast.success('Revenue ledger saved successfully!');
    } catch (err) {
      console.error('Failed to save revenue ledger to localStorage:', err);
      toast.error('Could not save changes to localStorage.');
    }
  };

  const handleReset = () => {
    if (!isAdmin) return;
    try {
      localStorage.removeItem(SHARED_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear stored revenue ledger:', err);
    }
    toast.info('Spreadsheet reset to initial default records.');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const columns = useMemo(() => {
    const baseCols = visibleColumns.map((col) => {
      const defaultConfig = DEFAULT_REVENUE_COLUMNS.find((d) => d.id === col.id) || {};
      const colDef = {
        data: col.dataIndex ?? defaultConfig.dataIndex,
        type: col.type || defaultConfig.type || 'text',
        readOnly: !isAdmin,
      };
      const width = col.width || defaultConfig.width;
      if (width) {
        colDef.width = width;
      }
      const numFormat = col.numericFormat || defaultConfig.numericFormat;
      if (numFormat) {
        colDef.numericFormat = numFormat;
      }
      const source = col.source || defaultConfig.source;
      if (source) {
        colDef.source = source;
      }
      return colDef;
    });

    if (isAdmin) {
      baseCols.push({
        renderer: deleteButtonRenderer,
        readOnly: true,
        className: 'htCenter htMiddle',
        width: 60,
      });
    }

    return baseCols;
  }, [visibleColumns, isAdmin]);

  const colHeaders = useMemo(() => {
    const headers = visibleColumns.map((col) => col.label);
    if (isAdmin) {
      headers.push('Action');
    }
    return headers;
  }, [visibleColumns, isAdmin]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: isDark ? blcColors.darkBg : blcColors.cream,
        pb: 8,
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* ── Navbar ── */}
      <Navbar
        mode={mode}
        toggleMode={toggleMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        onExternalLinkClick={() => toast.info('Opening documentation...')}
      />

      {/* ── Main Container ── */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Back navigation & Header bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            px: 3,
            mb: 3,
            borderRadius: '12px',
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            color: isDark ? '#e2e8f0' : blcColors.textDark,
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
                  Revenue Tracker
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
                  <TableChartIcon fontSize="small" />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: typographyTokens.fontMono,
                    fontWeight: typographyTokens.weightBold,
                  }}
                >
                  Revenue Tracker — Interactive Ledger
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Action buttons (Admin only) */}
          {isAdmin && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <AppButton
                onClick={handleReset}
                startIcon={<ResetIcon />}
                size="medium"
                variant="ghost"
              >
                Reset Data
              </AppButton>

              <AppButton
                onClick={handleSave}
                size="medium"
                variant="primary"
                startIcon={<SaveIcon />}
              >
                Save Changes
              </AppButton>
            </Box>
          )}
        </Paper>

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
            {/* Views Icon */}
            <Tooltip title="Views" placement="top" arrow>
              <IconButton
                aria-label="Views"
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

            {/* Saved Views Icon */}
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

            {/* View Management Icon */}
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

          {/* Reusable Global DataTable Component */}
          <DataTable
            ref={hotRef}
            dataset={dataset}
            totalRows={TOTAL_AVAILABLE_ROWS}
            columns={columns}
            colHeaders={colHeaders}
            visibleColumnsList={visibleColumns}
            rowHeaders={true}
            height={550}
            width="100%"
            stretchH="all"
            loadingText="Initializing 1,000,000 records in generic Web Worker..."
            isDark={isDark}
            isAdmin={isAdmin}
            onDeleteRow={handleRequestDelete}
            dropdownMenu={DROPDOWN_MENU_OPTIONS}
            contextMenu={isAdmin ? true : false}
          />
        </Paper>
      </Container>

      {/* ── Modals & Dialogs ── */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Confirm Row Deletion"
        message="Are you sure you want to remove this ledger entry? This action will update the active grid view."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        isDark={isDark}
      />

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
