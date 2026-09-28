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
  CircularProgress,
  Chip,
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

// Common & Feature Components
import { Navbar } from '../components/dashboard/Navbar';
import { AppButton } from '../components/common/AppButton';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ViewManagementModal } from '../components/revenue/ViewManagementModal';
import { SaveViewModal } from '../components/revenue/SaveViewModal';
import { SavedViewsModal } from '../components/revenue/SavedViewsModal';

// Redux hooks and actions
import { useSelector, useDispatch } from 'react-redux';
import { saveView, setActiveView } from '../store/actions/viewsActions';

// Register all Handsontable modules (renderers, editors, validators, plugins)
registerAllModules();

// Shared localStorage key — both Admin and User read/write from the same key
const SHARED_STORAGE_KEY = 'revenue_ledger_shared';

export const TOTAL_AVAILABLE_ROWS = 1_000_000;
export const INITIAL_BATCH_SIZE = 100;
export const BATCH_SIZE = 100;

/**
 * Deterministic batch generator for lazy-loading up to 1,000,000 rows.
 * Computes each row dynamically in O(1) time without keeping 1M rows in RAM.
 */
export const generateRevenueBatch = (startIndex = 0, count = BATCH_SIZE) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const batch = [];
  const endIndex = Math.min(startIndex + count, TOTAL_AVAILABLE_ROWS);

  for (let i = startIndex; i < endIndex; i++) {
    const expansion = Math.floor(12000 + ((i * 17) % 18000));
    const churn = Math.floor(2000 + ((i * 7) % 6000));
    const mrr = Math.max(50000, Math.floor(145000 + ((i * 131) % 120000)));
    const net = mrr + expansion - churn;
    const target = mrr + 14000;
    const year = 2022 + (Math.floor(i / 12) % 5);

    batch.push([
      `${months[i % 12]} ${year} (#${i + 1})`,
      mrr,
      expansion,
      churn,
      net,
      target,
      net >= target ? 'Exceeded' : net >= target * 0.95 ? 'On Track' : 'Behind',
    ]);
  }
  return batch;
};

/**
 * Master column configuration metadata for the Revenue Tracker ledger.
 * Maps visual columns to raw data array indices (dataIndex) so Handsontable
 * can reorder and hide columns without corrupting underlying row data.
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
    return generateRevenueBatch(0, INITIAL_BATCH_SIZE);
  };

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  // Redux views state & Save View modal state
  const dispatch = useDispatch();
  const savedViews = useSelector((state) => state.views?.views || []);
  const activeViewId = useSelector((state) => state.views?.activeViewId);
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
    toast.success(`View "${name}" saved to Redux!`);
  };

  const handleApplyView = (view) => {
    if (!view) return;
    if (view.visibleColumns && Array.isArray(view.visibleColumns)) {
      handleColumnsChange(view.visibleColumns, view.hiddenColumns || []);
      dispatch(setActiveView(view.id));
      toast.success(`Loaded "${view.name}" view!`);
    }
  };

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
    // Scroll window to top immediately on page load
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Defer heavy 100k data hydration by one tick so router transition is instant
    const timer = setTimeout(() => {
      setData(getInitialLedgerData());
      setIsLoading(false);
    }, 16);

    return () => clearTimeout(timer);
  }, []);

  // Re-render Handsontable whenever column visibility or order changes
  useEffect(() => {
    if (hotRef.current?.hotInstance) {
      hotRef.current.hotInstance.render();
    }
  }, [visibleColumns]);

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
    const freshBatch = generateRevenueBatch(0, INITIAL_BATCH_SIZE);
    setData(freshBatch);
    setHasMore(true);
    hasMoreRef.current = true;
    isFetchingRef.current = false;
    if (hotRef.current?.hotInstance) {
      hotRef.current.hotInstance.loadData(freshBatch);
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
    toast.info('Spreadsheet reset to initial batch.');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getColumns = () => {
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
  };

  const getColHeaders = () => {
    const headers = visibleColumns.map((col) => col.label);
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
          {/* Table Header Controls (aligned above Actions column) */}
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

          <Box
            sx={{
              borderRadius: '8px',
              overflow: 'hidden',
              border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
              height: 550,
              minHeight: 550,
              position: 'relative',
              bgcolor: isDark ? '#0f172a' : '#f8fafc',
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
            {isLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 1.5,
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                <CircularProgress size={32} sx={{ color: blcColors.navyAccent }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: typographyTokens.fontMono,
                    fontSize: '0.85rem',
                  }}
                >
                  Initializing initial batch...
                </Typography>
              </Box>
            ) : (
              <HotTable
                ref={hotRef}
                data={data}
                afterScrollVertically={() => {
                  if (isFetchingRef.current || !hasMoreRef.current) return; {/*busy fetching, no more rows*/ }
                  const hot = hotRef.current?.hotInstance;
                  if (!hot) return;

                  let lastRow = -1;
                  try {
                    if (hot.view && hot.view.wt && hot.view.wt.wtTable) {
                      {/*try to get last visible row*/ }
                      lastRow = hot.view.wt.wtTable.getLastVisibleRow();
                    }
                  } catch {
                    lastRow = -1;
                  }

                  if (lastRow === -1 || lastRow === undefined) {
                    const holder = hot.rootElement?.querySelector('.wtHolder');
                    if (holder) {
                      const scrollBottom = holder.scrollTop + holder.clientHeight;
                      const totalHeight = holder.scrollHeight;
                      if (scrollBottom >= totalHeight - 140) {
                        lastRow = hot.countRows() - 1;
                      }
                    }
                  }

                  const currentCount = hot.countRows();
                  if (lastRow >= currentCount - 20) {
                    {/*last visible rows is less than 20 then load next batch*/ }
                    if (currentCount >= TOTAL_AVAILABLE_ROWS) {
                      setHasMore(false);
                      hasMoreRef.current = false;
                      return;
                    }

                    isFetchingRef.current = true;
                    setIsFetchingMore(true);

                    const nextBatch = generateRevenueBatch(currentCount, BATCH_SIZE); {/* generate next batch of rows*/ }
                    if (nextBatch.length > 0) {
                      setData((prev) => [...prev, ...nextBatch]); {/*update data with next batch*/ }
                    } else {
                      setHasMore(false);
                      hasMoreRef.current = false;
                    }

                    setTimeout(() => {
                      isFetchingRef.current = false;
                      setIsFetchingMore(false);
                    }, 50);
                  }
                }}
                renderAllRows={false}
                viewportRowRenderingOffset={30}
                renderAllColumns={false}
                viewportColumnRenderingOffset={3}
                rowHeights={32}
                autoRowSize={false}
                autoColumnSize={false}
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
                  const actionColIndex = visibleColumns.length;
                  if (
                    isAdmin &&
                    destinationSortConfigs &&
                    destinationSortConfigs.some((cfg) => cfg.column === actionColIndex)
                  ) {
                    return false;
                  }
                }}
                afterOnCellMouseDown={(event, coords) => {
                  const actionColIndex = visibleColumns.length;
                  if (isAdmin && coords && coords.col === actionColIndex && coords.row >= 0) {
                    if (event) {
                      event.stopImmediatePropagation?.();
                      event.preventDefault?.();
                    }
                    handleRequestDelete(coords.row);
                  }
                }}
                columns={getColumns()}
              />
            )}
          </Box>

          {/* Lazy Loading Live Status Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1.5,
              px: 0.5,
              fontSize: '0.8rem',
              color: isDark ? '#94a3b8' : '#64748b',
              fontFamily: typographyTokens.fontMono,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>
                Loaded <strong>{data.length.toLocaleString()}</strong> of{' '}
                <strong>{TOTAL_AVAILABLE_ROWS.toLocaleString()}</strong> rows
              </span>
              {hasMore ? (
                <Chip
                  label="Lazy Loading Active"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    fontWeight: 600,
                  }}
                />
              ) : (
                <Chip
                  label="All 1,000,000 Rows Loaded"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>

            {isFetchingMore && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: blcColors.navyAccent, fontWeight: 600 }}>
                <CircularProgress size={14} thickness={5} />
                <span>Fetching next {BATCH_SIZE} rows...</span>
              </Box>
            )}
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

      {/* View Management popup modal */}
      <ViewManagementModal
        open={viewManagementOpen}
        onClose={() => setViewManagementOpen(false)}
        visibleColumns={visibleColumns}
        hiddenColumns={hiddenColumns}
        onColumnsChange={handleColumnsChange}
        onResetColumns={handleResetColumns}
        isDark={isDark}
      />

      {/* Save View popup modal */}
      {saveViewModalOpen && (
        <SaveViewModal
          open={saveViewModalOpen}
          onClose={() => setSaveViewModalOpen(false)}
          onSave={handleSaveView}
          visibleColumns={visibleColumns}
          hiddenColumns={hiddenColumns}
          existingViews={savedViews}
          isDark={isDark}
        />
      )}

      {/* Saved Views popup modal */}
      <SavedViewsModal
        open={savedViewsModalOpen}
        onClose={() => setSavedViewsModalOpen(false)}
        savedViews={savedViews}
        activeViewId={activeViewId}
        onApplyView={handleApplyView}
        isDark={isDark}
      />
    </Box>
  );
};

export default RevenueTrackerPage;
