// Delete.jsx
// ============================================================================
// PURPOSE:
//   A standardized, reusable deletion component for any data table.
//   Encapsulates:
//     1. Top-right toolbar trigger button with neutral theme styling & hover effects
//     2. Tooltip displaying "Delete" on hover
//     3. Handsontable selection extraction (single cell, multi-cell, Ctrl multi-range,
//        row headers, and column header selections)
//     4. Outside-click prevention (onMouseDown preventDefault) so Handsontable
//        selection is never lost on click
//     5. Common ConfirmDialog modal for single-row and multi-row deletion
//     6. Programmatic triggers via forwardRef (e.g. from cell action buttons)
//     7. Handsontable deselectCell and toast feedback upon deletion
// ============================================================================

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import PropTypes from 'prop-types';
import { IconButton, Tooltip } from '@mui/material';
import { toast } from 'react-toastify';

import { DeleteIcon } from '../../../icons';
import { blcColors } from '../../../theme';
import { ConfirmDialog } from '../../common/ConfirmDialog';

/**
 * Extracts a sorted list of unique 0-indexed row indices from Handsontable's selected ranges.
 * Handles single cells, ranges, column header selections (startRow === -1), and Ctrl multi-selections.
 * Automatically translates visual row coordinates to physical dataset indices.
 *
 * @param {object} hotInstance - Handsontable instance
 * @param {number} totalRows - Total row count in dataset
 * @param {number[]} fallbackIndices - Fallback array of row indices if selection is empty
 * @returns {number[]} Sorted unique physical row indices
 */
export const extractSelectedRowIndices = (hotInstance, totalRows = 0, fallbackIndices = []) => {
  const rowIndices = new Set();

  if (hotInstance) {
    const ranges = hotInstance.getSelected ? hotInstance.getSelected() : null;
    if (Array.isArray(ranges) && ranges.length > 0) {
      ranges.forEach(([startRow, , endRow]) => {
        const isEntireColumn = startRow === -1 || endRow === -1;
        const minVisual = isEntireColumn ? 0 : Math.max(0, Math.min(startRow, endRow));
        const maxVisual = isEntireColumn
          ? Math.max(0, totalRows > 0 ? totalRows - 1 : (hotInstance.countRows ? hotInstance.countRows() - 1 : 0))
          : Math.max(startRow, endRow);

        for (let vr = minVisual; vr <= maxVisual; vr++) {
          const pr = hotInstance.toPhysicalRow ? hotInstance.toPhysicalRow(vr) : vr;
          if (pr !== null && pr !== undefined && pr >= 0 && (totalRows === 0 || pr < totalRows)) {
            rowIndices.add(pr);
          }
        }
      });
    }

    if (rowIndices.size === 0 && hotInstance.getSelectedRange) {
      const cellRanges = hotInstance.getSelectedRange();
      if (Array.isArray(cellRanges) && cellRanges.length > 0) {
        cellRanges.forEach((range) => {
          const fromRow = range.from?.row ?? -1;
          const toRow = range.to?.row ?? -1;
          const minVisual = Math.max(0, Math.min(fromRow, toRow));
          const maxVisual = Math.max(fromRow, toRow);
          for (let vr = minVisual; vr <= maxVisual; vr++) {
            const pr = hotInstance.toPhysicalRow ? hotInstance.toPhysicalRow(vr) : vr;
            if (pr !== null && pr !== undefined && pr >= 0 && (totalRows === 0 || pr < totalRows)) {
              rowIndices.add(pr);
            }
          }
        });
      }
    }
  }

  // Fallback if Handsontable lost focus or selection was recorded prior to click
  if (rowIndices.size === 0 && Array.isArray(fallbackIndices) && fallbackIndices.length > 0) {
    fallbackIndices.forEach((idx) => {
      if (totalRows === 0 || (idx >= 0 && idx < totalRows)) {
        rowIndices.add(idx);
      }
    });
  }

  return Array.from(rowIndices).sort((a, b) => a - b);
};

export const Delete = forwardRef(function Delete(
  {
    hotRef,
    dataset = [],
    selectedRowIndices = [],
    onDelete,
    itemLabel = 'row',
    title,
    message,
    isDark = false,
    tooltipTitle = 'Delete',
    showToolbarButton = true,
    showToast = true,
    buttonSx = {},
    disabled = false,
  },
  ref
) {
  const [open, setOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [rowsToDelete, setRowsToDelete] = useState(null);
  const lastSelectedRowsRef = useRef([]);

  const rowCount = dataset ? dataset.length : 0;

  // Track selection changes so toolbar click never loses selected rows
  const handleAfterSelectionEnd = useCallback(() => {
    const hot = hotRef?.current?.hotInstance;
    const indices = extractSelectedRowIndices(hot, rowCount);
    if (indices.length > 0) {
      lastSelectedRowsRef.current = indices;
    }
  }, [hotRef, rowCount]);

  // Automatically listen to Handsontable's selection events
  useEffect(() => {
    const hot = hotRef?.current?.hotInstance;
    if (!hot) return;

    const onSelection = () => {
      const indices = extractSelectedRowIndices(hot, rowCount);
      if (indices.length > 0) {
        lastSelectedRowsRef.current = indices;
      }
    };

    if (hot.addHook) {
      hot.addHook('afterSelectionEnd', onSelection);
      hot.addHook('afterSelection', onSelection);
    }

    return () => {
      try {
        if (hot.removeHook) {
          hot.removeHook('afterSelectionEnd', onSelection);
          hot.removeHook('afterSelection', onSelection);
        }
      } catch {
        // Ignore unmount hook removal
      }
    };
  }, [hotRef, rowCount]);

  // Programmatic trigger for single row (e.g. from table cell action button)
  const requestDelete = useCallback(
    (rowIndex, rowData) => {
      const hot = hotRef?.current?.hotInstance;
      const physicalIdx =
        hot?.toPhysicalRow && rowIndex >= 0 ? hot.toPhysicalRow(rowIndex) : rowIndex;
      const row = rowData || (dataset && dataset[physicalIdx]);
      setRowToDelete({ index: physicalIdx, data: row });
      setRowsToDelete([physicalIdx]);
      setOpen(true);
    },
    [hotRef, dataset]
  );

  // Trigger for selected rows in table (from toolbar button or programmatic)
  const requestDeleteSelected = useCallback(() => {
    let sortedRows = [];

    if (Array.isArray(selectedRowIndices) && selectedRowIndices.length > 0) {
      sortedRows = [...selectedRowIndices].sort((a, b) => a - b);
    } else {
      const hot = hotRef?.current?.hotInstance;
      sortedRows = extractSelectedRowIndices(hot, rowCount, lastSelectedRowsRef.current);

      if (sortedRows.length === 0 && hot?.getSelected) {
        const sel = hot.getSelected();
        if (sel) {
          sortedRows = extractSelectedRowIndices(hot, rowCount);
        }
      }
    }

    if (sortedRows.length === 0) {
      toast.info(`Please select ${itemLabel.endsWith('s') ? itemLabel : `${itemLabel}s`} in the table to delete.`);
      return;
    }

    setRowToDelete(null);
    setRowsToDelete(sortedRows);
    setOpen(true);
  }, [hotRef, rowCount, selectedRowIndices, itemLabel]);

  const cancelDelete = useCallback(() => {
    setOpen(false);
    setRowToDelete(null);
    setRowsToDelete(null);
  }, []);

  const confirmDelete = useCallback(() => {
    const indicesToDelete = rowsToDelete || (rowToDelete ? [rowToDelete.index] : []);
    if (!indicesToDelete || indicesToDelete.length === 0) {
      setOpen(false);
      return;
    }

    const itemsToDelete = indicesToDelete.map((idx) => dataset?.[idx]).filter(Boolean);

    // Invoke caller's onDelete callback
    if (typeof onDelete === 'function') {
      onDelete(indicesToDelete, itemsToDelete);
    }

    // Clear selection in Handsontable
    try {
      hotRef?.current?.hotInstance?.deselectCell();
    } catch {
      // Ignore deselect failure if grid unmounted
    }

    // Success notification
    if (showToast) {
      const count = indicesToDelete.length;
      if (count === 1) {
        const singular = itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1);
        toast.success(`${singular} removed successfully.`);
      } else {
        const plural = itemLabel.endsWith('s') ? itemLabel : `${itemLabel}s`;
        toast.success(`${count} ${plural} removed successfully.`);
      }
    }

    lastSelectedRowsRef.current = [];
    setOpen(false);
    setRowToDelete(null);
    setRowsToDelete(null);
  }, [rowsToDelete, rowToDelete, dataset, onDelete, hotRef, showToast, itemLabel]);

  // Expose imperative API for parent pages
  useImperativeHandle(
    ref,
    () => ({
      requestDelete,
      requestDeleteSelected,
      cancelDelete,
      confirmDelete,
      handleAfterSelectionEnd,
      getSelectedRowIndices: () => {
        if (Array.isArray(selectedRowIndices) && selectedRowIndices.length > 0) {
          return [...selectedRowIndices].sort((a, b) => a - b);
        }
        const hot = hotRef?.current?.hotInstance;
        return extractSelectedRowIndices(hot, rowCount, lastSelectedRowsRef.current);
      },
    }),
    [
      requestDelete,
      requestDeleteSelected,
      cancelDelete,
      confirmDelete,
      handleAfterSelectionEnd,
      hotRef,
      rowCount,
      selectedRowIndices,
    ]
  );

  // Compute dialog title and message dynamically if not explicitly overridden
  const count = rowsToDelete ? rowsToDelete.length : 1;
  const isMultiple = count > 1;

  const resolvedTitle =
    typeof title === 'function'
      ? title(count)
      : title ||
        (isMultiple
          ? 'Confirm Multiple Deletions'
          : `Confirm ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} Deletion`);

  const resolvedMessage =
    typeof message === 'function'
      ? message(count, itemLabel)
      : message ||
        (isMultiple
          ? `Are you sure you want to remove the ${count} selected ${itemLabel.endsWith('s') ? itemLabel : `${itemLabel}s`}? This action cannot be undone.`
          : `Are you sure you want to remove this ${itemLabel}? This action cannot be undone.`);

  return (
    <>
      {showToolbarButton && (
        <Tooltip title={tooltipTitle} placement="top" arrow>
          <span>
            <IconButton
              aria-label={tooltipTitle}
              disabled={disabled}
              onMouseDown={(e) => {
                // Prevent Handsontable from clearing active cell/range selection on mouse click
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                requestDeleteSelected();
              }}
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
                ...buttonSx,
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        open={open}
        title={resolvedTitle}
        message={resolvedMessage}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isDark={isDark}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
});

Delete.propTypes = {
  hotRef: PropTypes.shape({ current: PropTypes.any }),
  dataset: PropTypes.array,
  selectedRowIndices: PropTypes.arrayOf(PropTypes.number),
  onDelete: PropTypes.func.isRequired,
  itemLabel: PropTypes.string,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  isDark: PropTypes.bool,
  tooltipTitle: PropTypes.string,
  showToolbarButton: PropTypes.bool,
  showToast: PropTypes.bool,
  buttonSx: PropTypes.object,
  disabled: PropTypes.bool,
};

// Aliases for backwards compatibility / flexibility
export const DeleteMechanism = Delete;
export default Delete;
