// DataTable.jsx
// ============================================================================
// PURPOSE:
//   A global, reusable enterprise data grid component wrapping Handsontable
//   with built-in theme support, virtualization defaults, and loading states.
// ============================================================================

import React, { forwardRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { Filters } from 'handsontable/plugins/filters';
import { TrimRows } from 'handsontable/plugins/trimRows';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { blcColors, typographyTokens } from '../../theme';

// Register all Handsontable modules globally
registerAllModules();

// ── Handsontable TrimRows & ConditionCollection Null Safeguards ─────────────
const SAFE_FILTERING_STATES_STUB = Object.freeze({
  getEntries: () => [],
  getValueAtIndex: () => undefined,
  setValueAtIndex: () => {},
  clearValue: () => {},
  clear: () => {},
  init: () => {},
  getLength: () => 0,
});

if (TrimRows && TrimRows.prototype && !TrimRows.prototype.__patchedForNullMap) {
  TrimRows.prototype.__patchedForNullMap = true;

  const origIsTrimmed = TrimRows.prototype.isTrimmed;
  TrimRows.prototype.isTrimmed = function (physicalRow) {
    if (!this.trimmedRowsMap || typeof this.trimmedRowsMap.getValueAtIndex !== 'function') {
      return false;
    }
    return origIsTrimmed.call(this, physicalRow);
  };

  const origGetTrimmedRows = TrimRows.prototype.getTrimmedRows;
  TrimRows.prototype.getTrimmedRows = function () {
    if (!this.trimmedRowsMap || typeof this.trimmedRowsMap.getTrimmedIndexes !== 'function') {
      return [];
    }
    return origGetTrimmedRows.call(this);
  };
}

if (Filters && Filters.prototype && !Filters.prototype.__patchedForNullEntries) {
  Filters.prototype.__patchedForNullEntries = true;

  const origEnable = Filters.prototype.enablePlugin;
  Filters.prototype.enablePlugin = function () {
    const res = origEnable.call(this);
    if (this.conditionCollection?.constructor?.prototype && !this.conditionCollection.constructor.prototype.__destroyPatched) {
      const ccProto = this.conditionCollection.constructor.prototype;
      ccProto.__destroyPatched = true;

      const origDestroy = ccProto.destroy;
      ccProto.destroy = function () {
        origDestroy.call(this);
        if (this.filteringStates === null) {
          this.filteringStates = SAFE_FILTERING_STATES_STUB;
        }
      };
    }
    return res;
  };
}

/**
 * Custom HTML cell renderer for reusable Action / Delete column buttons.
 */
export const deleteButtonRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  td.innerHTML = `
    <button
      type="button"
      class="rt-delete-btn"
      title="Delete row"
      style="
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #ef4444;
        border-radius: 4px;
        transition: background 0.15s ease;
      "
      onmouseover="this.style.background='rgba(239,68,68,0.1)'"
      onmouseout="this.style.background='transparent'"
    >
      <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    </button>
  `;
  td.style.textAlign = 'center';
  td.style.verticalAlign = 'middle';
  td.style.padding = '0';
  return td;
};

export const DataTable = forwardRef(function DataTable(
  {
    data = [],
    columns,
    colHeaders,
    rowHeaders = true,
    height = 550,
    width = '100%',
    stretchH = 'all',
    isLoading = false,
    loadingText = 'Loading data...',
    isDark = false,
    renderAllRows = false,
    viewportRowRenderingOffset = 30,
    renderAllColumns = false,
    viewportColumnRenderingOffset = 3,
    rowHeights = 32,
    autoRowSize = false,
    autoColumnSize = false,
    columnSorting = true,
    filters = true,
    dropdownMenu = [
      'filter_by_condition',
      'filter_by_value',
      'filter_action_bar',
    ],
    contextMenu = false,
    manualColumnResize = true,
    manualRowResize = true,
    autoWrapRow = true,
    autoWrapCol = true,
    licenseKey = 'non-commercial-and-evaluation',
    beforeColumnSort,
    afterScrollVertically,
    afterOnCellMouseDown,
    onCellClick,
    onRowClick,
    onDeleteRow,
    actionColumnIndex,
    sx = {},
    ...restProps
  },
  ref
) {
  // Centralized Table Mouse Down / Click Handler
  const handleCellMouseDown = (event, coords) => {
    if (!coords || coords.row < 0) return;

    const rowIndex = coords.row;
    const colIndex = coords.col;
    const rowData = data[rowIndex] ?? null;

    let cellValue = null;
    if (rowData) {
      if (Array.isArray(rowData)) {
        cellValue = rowData[colIndex];
      } else if (typeof rowData === 'object' && columns && columns[colIndex]) {
        cellValue = rowData[columns[colIndex].data];
      }
    }

    // Determine if the clicked cell is in the Action / Delete column
    const isActionCol =
      actionColumnIndex !== undefined
        ? colIndex === actionColumnIndex
        : onDeleteRow && columns && colIndex === columns.length - 1;

    if (isActionCol && onDeleteRow) {
      if (event) {
        event.stopImmediatePropagation?.();
        event.preventDefault?.();
      }
      onDeleteRow(rowIndex, rowData);
    }

    // Generic Cell Click Callback
    if (onCellClick) {
      onCellClick(event, coords, cellValue, rowData);
    }

    // Generic Row Click Callback
    if (onRowClick) {
      onRowClick(event, coords, rowData);
    }

    // Forward to any custom afterOnCellMouseDown passed from parent
    if (afterOnCellMouseDown) {
      afterOnCellMouseDown(event, coords);
    }
  };

  return (
    <Box
      sx={{
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
        height: height,
        minHeight: height,
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
        ...sx,
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
            {loadingText}
          </Typography>
        </Box>
      ) : (
        <HotTable
          ref={ref}
          data={data}
          columns={columns}
          colHeaders={colHeaders}
          rowHeaders={rowHeaders}
          height={height}
          width={width}
          stretchH={stretchH}
          renderAllRows={renderAllRows}
          viewportRowRenderingOffset={viewportRowRenderingOffset}
          renderAllColumns={renderAllColumns}
          viewportColumnRenderingOffset={viewportColumnRenderingOffset}
          rowHeights={rowHeights}
          autoRowSize={autoRowSize}
          autoColumnSize={autoColumnSize}
          className={isDark ? 'ht-theme-main-dark' : 'ht-theme-main'}
          columnSorting={columnSorting}
          filters={filters}
          dropdownMenu={dropdownMenu}
          contextMenu={contextMenu}
          manualColumnResize={manualColumnResize}
          manualRowResize={manualRowResize}
          autoWrapRow={autoWrapRow}
          autoWrapCol={autoWrapCol}
          licenseKey={licenseKey}
          beforeColumnSort={beforeColumnSort}
          afterScrollVertically={afterScrollVertically}
          afterOnCellMouseDown={handleCellMouseDown}
          {...restProps}
        />
      )}
    </Box>
  );
});

export default DataTable;
