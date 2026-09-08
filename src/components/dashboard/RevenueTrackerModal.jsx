// RevenueTrackerModal.jsx
// ============================================================================
// PURPOSE:
//   An interactive, enterprise-grade Excel-style spreadsheet modal powered by
//   Handsontable. It opens when the user clicks the "Revenue Tracker" application
//   card on the DashboardPage.
//
// USAGE LOCATIONS:
//   - DashboardPage.jsx: Rendered conditionally inside a modal dialog when
//     `isRevenueModalOpen` is true.
//
// WHY IT EXISTS & KEY ARCHITECTURE:
//   - Handsontable Grid: High-performance data grid with Excel-like interaction.
//   - Column Filtering & Sorting: Multi-column filters, conditions, and ascending/descending sorts.
//   - Column Types & Formats: Formatted currency ($0,0) and status dropdowns ("Exceeded", "On Track", "Behind").
//   - Shared Storage: A single localStorage key (`revenue_ledger_shared`) stores
//     the table data, shared between Admin and User accounts.
//   - Role-Based Access: Admin can fully edit, save, reset, and delete rows.
//     User (Viewer) sees the same data in read-only mode with action buttons hidden.
//   - Confirmation Modal: Uses ConfirmDialog before removing any ledger row to prevent accidental loss.
// ============================================================================

import React, { useRef, useState, useEffect } from 'react';
// Material-UI primitive components for dialog structure
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
// Material-UI icons for modal actions and headers
import {
  Close as CloseIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  TableChart as TableChartIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
// Handsontable React wrapper component
import { HotTable } from '@handsontable/react';
// Handsontable module registration function
import { registerAllModules } from 'handsontable/registry';
// Core and theme CSS styles for Handsontable
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
// Toast notification helper for user action feedback
import { toast } from 'react-toastify';
// Design system tokens for colors and typography
import { blcColors, typographyTokens } from '../../theme';
// Common UI components
import { AppButton } from '../common/AppButton';
import { ConfirmDialog } from '../common/ConfirmDialog';

// Register all Handsontable modules (renderers, editors, validators, plugins)
// This must be called once before any HotTable instances are mounted
registerAllModules();

// Shared localStorage key — both Admin and User read/write from the same key
const SHARED_STORAGE_KEY = 'revenue_ledger_shared';

/**
 * Initial seed dataset for the Revenue Tracker ledger.
 * Represents monthly recurring revenue (MRR), expansion revenue, churn, net revenue, and goals.
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
 * Custom HTML cell renderer for the 'Action' column.
 * Injects a stylized delete button with an inline SVG trash can into the table cell.
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
  td.className = 'htCenter htMiddle htNoWrap'; // Center-align content inside cell
  return td;
};

/**
 * RevenueTrackerModal Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {boolean} props.open - Whether the spreadsheet dialog is currently visible.
 * @param {Function} props.onClose - Callback function to dismiss the modal dialog.
 * @param {boolean} props.isDark - True if dark mode is active, triggering dark palette adjustments.
 * @param {boolean} props.isAdmin - True if the logged-in user is Admin (full edit). False for Viewer (read-only).
 * @returns {React.ReactElement} The rendered spreadsheet dialog modal.
 */
export const RevenueTrackerModal = ({ open, onClose, isDark, isAdmin }) => {
  // Ref to directly access the Handsontable instance methods (loadData, alter, plugins)
  const hotRef = useRef(null);

  /**
   * Helper function to load spreadsheet data from shared localStorage or fallback to default seed data
   */
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
    // Deep clone default rows so mutations do not alter the seed initialData array
    return initialData.map((row) => [...row]);
  };

  // State storing the 2D matrix of spreadsheet row and column values
  const [data, setData] = useState(getInitialLedgerData);

  // State controlling the row deletion confirmation dialog popup (Admin only)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  // Tracks the row index selected for deletion
  const [rowToDelete, setRowToDelete] = useState(null);

  /**
   * Called when admin clicks the delete button in the spreadsheet table.
   * Stores the row index and opens the confirmation dialog.
   */
  const handleRequestDelete = (visualRow) => {
    if (!isAdmin) return; // Safety guard — viewers cannot delete
    setRowToDelete(visualRow);
    setDeleteConfirmOpen(true);
  };

  /**
   * Confirms removal of the selected row from Handsontable and updates state.
   */
  const handleConfirmDelete = () => {
    if (rowToDelete !== null && hotRef.current?.hotInstance) {
      const hot = hotRef.current.hotInstance;
      // alter('remove_row', index, count): removes 1 row at the specified visual index
      hot.alter('remove_row', rowToDelete, 1);
      // Retrieve the updated source data array
      const updatedData = hot.getSourceData();
      setData([...updatedData]);
      toast.success('Row removed successfully.');
    }
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  /**
   * Cancels the deletion prompt without modifying any spreadsheet rows.
   */
  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  // Synchronize spreadsheet data whenever the modal is opened
  useEffect(() => {
    if (open) {
      const latestData = getInitialLedgerData();
      setData(latestData);
      if (hotRef.current?.hotInstance) {
        hotRef.current.hotInstance.loadData(latestData);
        // Clear active column filters so previous filters don't hide fresh data
        const filterPlugin = hotRef.current.hotInstance.getPlugin('filters');
        if (filterPlugin) {
          filterPlugin.clearConditions();
          filterPlugin.filter();
        }
      }
    }
  }, [open]);

  /**
   * Persists changes to shared localStorage and closes the modal. (Admin only)
   * getSourceData() is used to ensure filtered or hidden rows are never lost during saving.
   */
  const handleSave = () => {
    if (!isAdmin) return; // Safety guard
    try {
      const currentData = hotRef.current?.hotInstance
        ? hotRef.current.hotInstance.getSourceData()
        : data;
      localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(currentData));
      setData(currentData);
      toast.success('Revenue ledger saved successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to save revenue ledger to localStorage:', err);
      toast.error('Could not save changes to localStorage.');
    }
  };

  /**
   * Clears saved changes from shared localStorage and reloads the default seed dataset. (Admin only)
   * Also resets any active column filters and column sorting.
   */
  const handleReset = () => {
    if (!isAdmin) return; // Safety guard
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

  // ─── Column Definitions ────────────────────────────────────────────────
  // Admin: all columns including the delete Action column
  // Viewer: data columns only (no Action column), all readOnly
  const getColumns = () => {
    const baseCols = [
      { type: 'text', readOnly: !isAdmin },                                       // Month
      { type: 'numeric', numericFormat: { pattern: '$0,0' }, readOnly: !isAdmin }, // Starting MRR
      { type: 'numeric', numericFormat: { pattern: '$0,0' }, readOnly: !isAdmin }, // Expansion
      { type: 'numeric', numericFormat: { pattern: '$0,0' }, readOnly: !isAdmin }, // Churn
      { type: 'numeric', numericFormat: { pattern: '$0,0' }, readOnly: !isAdmin }, // Net Revenue
      { type: 'numeric', numericFormat: { pattern: '$0,0' }, readOnly: !isAdmin }, // Target
      {
        type: 'dropdown',
        source: ['Exceeded', 'On Track', 'Behind'],
        readOnly: !isAdmin,
      }, // Status
    ];

    // Only Admin sees the delete action column
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

  // Column headers — Admin gets the Action column header, Viewer does not
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
    // Dialog Container
    <Dialog
      open={open}
      onClose={onClose}
      disableEnforceFocus // Allows Handsontable custom cell editors and menus to receive focus
      disableAutoFocus
      maxWidth="lg" // Wide dialog for comfortable table viewing (approx 1200px max width)
      fullWidth
      aria-labelledby="revenue-modal-title"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          bgcolor: isDark ? blcColors.darkCard : '#ffffff',
          color: isDark ? '#e2e8f0' : blcColors.textDark,
          border: `1px solid ${isDark ? blcColors.darkBorder : '#d1d9f0'}`,
          boxShadow: isDark
            ? '0 12px 48px rgba(0,0,0,0.7)'
            : '0 8px 32px rgba(30,58,138,0.15)',
        },
      }}
    >
      {/* ── Modal Header: Title, Role Badge, and Close Button ── */}
      <DialogTitle
        id="revenue-modal-title"
        sx={{
          m: 0,
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Brand icon box */}
          <Box
            sx={{
              width: 38,
              height: 38,
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
          <Box>
            <Typography
              sx={{
                fontFamily: typographyTokens.fontMono,
                fontWeight: typographyTokens.weightBold,
                fontSize: typographyTokens.fontSizeLg,
              }}
            >
              Revenue Tracker — Interactive Ledger
            </Typography>
          </Box>

        </Box>

        {/* Modal close icon button */}
        <IconButton
          aria-label="close modal"
          onClick={onClose}
          size="small"
          sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ── Handsontable Spreadsheet Grid Area ── */}
      <DialogContent sx={{ p: 2.5, overflowX: 'auto' }}>
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
          {/* Handsontable Component Instance */}
          <HotTable
            ref={hotRef}
            data={data}
            className={isDark ? 'ht-theme-main-dark' : 'ht-theme-main'} // Switches Handsontable theme
            colHeaders={getColHeaders()}
            rowHeaders={true} // Displays row numbers 1, 2, 3...
            height="380" // Fixed height with internal scrolling
            width="100%"
            stretchH="all" // Stretches columns evenly to fill container width
            columnSorting={true} // Enables sorting by clicking column headers
            filters={true} // Enables column filtering dropdown menu
            dropdownMenu={[
              'filter_by_condition',
              'filter_by_value',
              'filter_action_bar',
            ]}
            contextMenu={isAdmin ? true : false} // Right-click context menu only for Admin
            manualColumnResize={true} // Allows dragging column dividers to resize
            manualRowResize={true} // Allows dragging row dividers to resize
            licenseKey="non-commercial-and-evaluation"
            autoWrapRow={true}
            autoWrapCol={true}
            beforeColumnSort={(currentSortConfig, destinationSortConfigs) => {
              // Disallow sorting on the Action/Delete button column (last column for Admin)
              if (
                isAdmin &&
                destinationSortConfigs &&
                destinationSortConfigs.some((cfg) => cfg.column === 7)
              ) {
                return false;
              }
            }}
            afterOnCellMouseDown={(event, coords) => {
              // Admin only: Intercept mouse click on the Action column on a valid data row
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
      </DialogContent>

      {/* ── Modal Footer Actions ── */}
      <DialogActions
        sx={{
          p: 2,
          px: 2.5,
          borderTop: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
          justifyContent: 'space-between',
        }}
      >
        {/* Left side: Reset button (Admin only) */}
        {isAdmin ? (
          <AppButton
            onClick={handleReset}
            startIcon={<ResetIcon />}
            size="small"
            variant="ghost"
          >
            Reset Data
          </AppButton>
        ) : (
          <Box />
        )}

        {/* Right action group: Close & Save (Save only for Admin) */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <AppButton
            onClick={onClose}
            size="small"
            variant="outlined"
          >
            Close
          </AppButton>
          {isAdmin && (
            <AppButton
              onClick={handleSave}
              size="small"
              variant="primary"
              startIcon={<SaveIcon />}
            >
              Save Changes
            </AppButton>
          )}
        </Box>
      </DialogActions>

      {/* ── Reusable Common ConfirmDialog Component (Admin only) ── */}
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
    </Dialog>
  );
};

export default RevenueTrackerModal;
