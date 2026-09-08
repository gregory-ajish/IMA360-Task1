// RevenueTrackerPage.jsx
// ============================================================================
// PURPOSE:
//   A standalone, protected web page for the Revenue Tracker enterprise-grade
//   spreadsheet powered by Handsontable at route `/revenue-tracker`.
//
// FEATURES & ARCHITECTURE:
//   - Full Page Layout: Includes top Navbar, back navigation to /home, and sticky controls.
//   - Handsontable Grid: High-performance data grid with Excel-like interaction.
//   - Shared Storage: Reads and writes to `revenue_ledger_shared` in localStorage.
//   - Role-Based Access: Admin can edit cells, save changes, reset data, and delete rows.
//     User (Viewer) sees read-only data with edit options hidden.
//   - Confirmation Modal: Uses ConfirmDialog before removing any row.
// ============================================================================

import React, { useRef, useState, useEffect } from 'react';
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
} from '@mui/icons-material';

// Handsontable React wrapper and modules
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// Toast notifications
import { toast } from 'react-toastify';

// Theme tokens & Context
import { blcColors, typographyTokens } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { Navbar } from '../components/dashboard/Navbar';
import { AppButton } from '../components/common/AppButton';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

// Register all Handsontable modules (renderers, editors, validators, plugins)
registerAllModules();

// Shared localStorage key — both Admin and User read/write from the same key
const SHARED_STORAGE_KEY = 'revenue_ledger_shared';

/**
 * Initial seed dataset for the Revenue Tracker ledger.
 */
const initialData = [
  ['Jan 2026', 145000, 18000, 4200, 158800, 150000, 'Exceeded'],
  ['Feb 2026', 158800, 22500, 3100, 178200, 170000, 'Exceeded'],
  ['Mar 2026', 178200, 14000, 6800, 185400, 185000, 'On Track'],
  ['Apr 2026', 185400, 19200, 5100, 199500, 200000, 'On Track'],
  ['May 2026', 199500, 25000, 4800, 219700, 215000, 'Exceeded'],
  ['Jun 2026', 219700, 11000, 8900, 221800, 230000, 'Behind'],
  ['Jul 2026', 221800, 28000, 3400, 246400, 240000, 'Exceeded'],
  ['Aug 2026', 246400, 16500, 5200, 257700, 255000, 'On Track'],
  ['Sep 2026', 257700, 31000, 2900, 285800, 270000, 'Exceeded'],
];

/**
 * Custom HTML cell renderer for the 'Action' column delete button.
 */
const deleteButtonRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  td.innerHTML = `
    <button
      type="button"
      class="ht-row-delete-btn"
      title="Delete this row"
      aria-label="Delete this row"
      tabindex="-1"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </button>
  `;
  td.className = 'htCenter htMiddle htNoWrap';
  return td;
};

/**
 * RevenueTrackerPage Component
 */
export const RevenueTrackerPage = ({ mode, toggleMode }) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  const hotRef = useRef(null);

  const getInitialLedgerData = () => {
    try {
      const saved = localStorage.getItem(SHARED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading revenue ledger from localStorage:', err);
    }
    return initialData.map((row) => [...row]);
  };

  const [data, setData] = useState(getInitialLedgerData);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const handleRequestDelete = (visualRow) => {
    if (!isAdmin) return;
    setRowToDelete(visualRow);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (rowToDelete !== null && hotRef.current?.hotInstance) {
      const hot = hotRef.current.hotInstance;
      hot.alter('remove_row', rowToDelete, 1);
      const updatedData = hot.getSourceData();
      setData([...updatedData]);
      toast.success('Row removed successfully.');
    }
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  useEffect(() => {
    const latestData = getInitialLedgerData();
    setData(latestData);
    if (hotRef.current?.hotInstance) {
      hotRef.current.hotInstance.loadData(latestData);
      const filterPlugin = hotRef.current.hotInstance.getPlugin('filters');
      if (filterPlugin) {
        filterPlugin.clearConditions();
        filterPlugin.filter();
      }
    }
  }, []);

  const handleSave = () => {
    if (!isAdmin) return;
    try {
      const currentData = hotRef.current?.hotInstance
        ? hotRef.current.hotInstance.getSourceData()
        : data;
      localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(currentData));
      setData(currentData);
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
    const freshData = initialData.map((row) => [...row]);
    setData(freshData);
    if (hotRef.current?.hotInstance) {
      hotRef.current.hotInstance.loadData(freshData);
      const filterPlugin = hotRef.current.hotInstance.getPlugin('filters');
      if (filterPlugin) {
        filterPlugin.clearConditions();
        filterPlugin.filter();
      }
      const sortingPlugin = hotRef.current.hotInstance.getPlugin('columnSorting');
      if (sortingPlugin) {
        sortingPlugin.clearSort();
      }
    }
    toast.info('Spreadsheet reset to default values.');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getColumns = () => {
    const baseCols = [
      { type: 'text', readOnly: !isAdmin },
      { type: 'numeric', numericFormat: { pattern: '$0,0' }, readOnly: !isAdmin },
      { type: 'numeric', numericFormat: { pattern: '$0,0' }, readOnly: !isAdmin },
      { type: 'numeric', numericFormat: { pattern: '$0,0' }, readOnly: !isAdmin },
      { type: 'numeric', numericFormat: { pattern: '$0,0' }, readOnly: !isAdmin },
      { type: 'numeric', numericFormat: { pattern: '$0,0' }, readOnly: !isAdmin },
      {
        type: 'dropdown',
        source: ['Exceeded', 'On Track', 'Behind'],
        readOnly: !isAdmin,
      },
    ];

    if (isAdmin) {
      baseCols.push({
        renderer: deleteButtonRenderer,
        readOnly: true,
        className: 'htCenter htMiddle',
        width: 60,
      });
    }

    return baseCols;
  };

  const getColHeaders = () => {
    const headers = [
      'Month',
      'Starting MRR ($)',
      'Expansion ($)',
      'Churn ($)',
      'Net Revenue ($)',
      'Target ($)',
      'Status',
    ];
    if (isAdmin) {
      headers.push('Action');
    }
    return headers;
  };

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
          <Box
            sx={{
              borderRadius: '8px',
              overflow: 'hidden',
              border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
              '& .handsontable': {
                fontFamily: typographyTokens.fontSans,
                fontSize: typographyTokens.fontSizeSm,
              },
              '& .htCore th': {
                bgcolor: isDark ? '#1e293b' : '#f8fafc',
                color: isDark ? '#94a3b8' : '#475569',
                fontWeight: typographyTokens.weightBold,
                fontFamily: typographyTokens.fontMono,
              },
            }}
          >
            <HotTable
              ref={hotRef}
              data={data}
              className={isDark ? 'ht-theme-main-dark' : 'ht-theme-main'}
              colHeaders={getColHeaders()}
              rowHeaders={true}
              height="550"
              width="100%"
              stretchH="all"
              columnSorting={true}
              filters={true}
              dropdownMenu={[
                'filter_by_condition',
                'filter_by_value',
                'filter_action_bar',
              ]}
              contextMenu={isAdmin ? true : false}
              manualColumnResize={true}
              manualRowResize={true}
              licenseKey="non-commercial-and-evaluation"
              autoWrapRow={true}
              autoWrapCol={true}
              beforeColumnSort={(currentSortConfig, destinationSortConfigs) => {
                if (
                  isAdmin &&
                  destinationSortConfigs &&
                  destinationSortConfigs.some((cfg) => cfg.column === 7)
                ) {
                  return false;
                }
              }}
              afterOnCellMouseDown={(event, coords) => {
                if (isAdmin && coords && coords.col === 7 && coords.row >= 0) {
                  if (event) {
                    event.stopImmediatePropagation?.();
                    event.preventDefault?.();
                  }
                  handleRequestDelete(coords.row);
                }
              }}
              columns={getColumns()}
            />
          </Box>
        </Paper>
      </Container>

      {/* Delete confirm dialog for admin */}
      {isAdmin && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Confirm Removal"
          message="Are you sure you want to remove this row?"
          confirmText="Remove Row"
          cancelText="Cancel"
          confirmVariant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </Box>
  );
};

export default RevenueTrackerPage;
