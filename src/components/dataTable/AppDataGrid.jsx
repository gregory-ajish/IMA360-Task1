// src/components/dataTable/AppDataGrid.jsx
// ============================================================================
// PURPOSE:
//   A reusable, theme-aware Common DataGrid component powered by MUI X DataGrid.
//   Standardizes:
//     - Dark & Light mode brand styling (blcColors, typographyTokens)
//     - Non-editable cells by default (read-only with action icons)
//     - Row-click multi-selection without checkboxes (Ctrl/Cmd + click, Shift + click)
//     - Selected row highlighting (.Mui-selected)
//     - Responsive layout, custom height/width, and custom empty/loading states
// ============================================================================

import React, { forwardRef, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { blcColors, typographyTokens } from '../../theme';

/**
 * AppDataGrid / CommonDataGrid Component
 */
export const AppDataGrid = forwardRef(function AppDataGrid(
  {
    rows = [],
    columns = [],
    selectedRowIndices = [],
    onSelectionChange,
    onRowClick: externalOnRowClick,
    enableRowClickSelection = true,
    isDark = false,
    isCellEditable = () => false,
    height = 580,
    width = '100%',
    rowHeight = 46,
    hideFooter = true,
    loading = false,
    getRowId = (row) => row?.id ?? row?.rawIndex,
    getRowClassName: externalGetRowClassName,
    emptyMessage = 'No records found.',
    sx = {},
    ...restProps
  },
  ref
) {
  const lastClickedIndexRef = useRef(null);

  // Built-in row-click selection handler supporting single click, Ctrl/Cmd-click, and Shift-click
  const handleInternalRowClick = useCallback(
    (params, event) => {
      // If click originated on action buttons or interactive icons, do not select row
      if (event?.target?.closest('button, .MuiIconButton-root, a, input')) {
        return;
      }

      if (enableRowClickSelection && onSelectionChange) {
        const rowIndex = params.row?.rawIndex ?? params.id;
        const isCtrlPressed = event?.ctrlKey || event?.metaKey;
        const isShiftPressed = event?.shiftKey;

        if (isShiftPressed && lastClickedIndexRef.current !== null) {
          const start = Math.min(lastClickedIndexRef.current, rowIndex);
          const end = Math.max(lastClickedIndexRef.current, rowIndex);
          const rangeIndices = [];
          for (let i = start; i <= end; i++) {
            rangeIndices.push(i);
          }
          const next = Array.from(new Set([...selectedRowIndices, ...rangeIndices]));
          onSelectionChange(next);
        } else if (isCtrlPressed) {
          const next = selectedRowIndices.includes(rowIndex)
            ? selectedRowIndices.filter((i) => i !== rowIndex)
            : [...selectedRowIndices, rowIndex];
          onSelectionChange(next);
          lastClickedIndexRef.current = rowIndex;
        } else {
          // Single click: toggle selection if already solely selected, else select just this row
          const next =
            selectedRowIndices.length === 1 && selectedRowIndices[0] === rowIndex
              ? []
              : [rowIndex];
          onSelectionChange(next);
          lastClickedIndexRef.current = rowIndex;
        }
      }

      if (typeof externalOnRowClick === 'function') {
        externalOnRowClick(params, event);
      }
    },
    [enableRowClickSelection, onSelectionChange, selectedRowIndices, externalOnRowClick]
  );

  // Row class resolver: adds .Mui-selected when row is in selectedRowIndices
  const resolveRowClassName = useCallback(
    (params) => {
      const rowIndex = params.row?.rawIndex ?? params.id;
      const isSelected = selectedRowIndices.includes(rowIndex);
      const customClass = externalGetRowClassName ? externalGetRowClassName(params) : '';
      return `${isSelected ? 'Mui-selected' : ''} ${customClass}`.trim();
    },
    [selectedRowIndices, externalGetRowClassName]
  );

  return (
    <Box
      sx={{
        height,
        width,
        borderRadius: '8px',
        overflow: 'hidden',
        bgcolor: isDark ? blcColors.darkCard : '#ffffff',
        border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
        boxShadow: isDark
          ? '0 12px 40px rgba(0,0,0,0.5)'
          : '0 8px 24px rgba(30,58,138,0.06)',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        '& .MuiDataGrid-root': {
          border: 'none',
          fontFamily: typographyTokens.fontSans,
          fontSize: '0.875rem',
          color: isDark ? '#f1f5f9' : blcColors.textDark,
        },
        '& .MuiDataGrid-main': {
          borderRadius: '8px',
        },
        '& .MuiDataGrid-columnHeaders': {
          bgcolor: isDark ? '#1e293b' : '#f8fafc',
          borderBottom: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
          color: isDark ? '#94a3b8' : '#475569',
          fontWeight: typographyTokens.weightBold,
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: typographyTokens.weightBold,
          fontSize: '0.85rem',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.35)' : '#f1f5f9'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none !important',
        },
        '& .MuiDataGrid-row': {
          cursor: enableRowClickSelection ? 'pointer' : 'default',
          transition: 'background-color 0.15s ease',
        },
        '& .MuiDataGrid-row:hover': {
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
        },
        '& .MuiDataGrid-row.Mui-selected': {
          bgcolor: isDark
            ? 'rgba(59, 130, 246, 0.22) !important'
            : 'rgba(30, 58, 138, 0.12) !important',
          '&:hover': {
            bgcolor: isDark
              ? 'rgba(59, 130, 246, 0.30) !important'
              : 'rgba(30, 58, 138, 0.18) !important',
          },
        },
        '& .MuiDataGrid-overlay': {
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        },
        ...sx,
      }}
    >
      <DataGrid
        ref={ref}
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        onRowClick={handleInternalRowClick}
        getRowClassName={resolveRowClassName}
        isCellEditable={isCellEditable}
        rowHeight={rowHeight}
        hideFooter={hideFooter}
        loading={loading}
        slots={{
          noRowsOverlay: () => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: isDark ? '#94a3b8' : '#64748b',
                fontFamily: typographyTokens.fontSans,
                fontSize: '0.9rem',
              }}
            >
              <Typography variant="body2">{emptyMessage}</Typography>
            </Box>
          ),
        }}
        {...restProps}
      />
    </Box>
  );
});

AppDataGrid.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedRowIndices: PropTypes.arrayOf(PropTypes.number),
  onSelectionChange: PropTypes.func,
  onRowClick: PropTypes.func,
  enableRowClickSelection: PropTypes.bool,
  isDark: PropTypes.bool,
  isCellEditable: PropTypes.func,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  rowHeight: PropTypes.number,
  hideFooter: PropTypes.bool,
  loading: PropTypes.bool,
  getRowId: PropTypes.func,
  getRowClassName: PropTypes.func,
  emptyMessage: PropTypes.node,
  sx: PropTypes.object,
};

// Aliases for convenience
export const CommonDataGrid = AppDataGrid;
export default AppDataGrid;
