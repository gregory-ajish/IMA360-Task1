// DataTable.jsx
// ============================================================================
// PURPOSE:
//   A global, reusable enterprise data grid component wrapping Handsontable
//   and a background Web Worker (tableWorker.js) for high-performance
//   large dataset sorting, filtering, virtualization, and lazy loading.
// ============================================================================

import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
} from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { Filters } from 'handsontable/plugins/filters';
import { TrimRows } from 'handsontable/plugins/trimRows';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { blcColors, typographyTokens } from '../../../theme';

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
    dataset = [],
    totalRows = 0,
    columns,
    colHeaders,
    visibleColumnsList = [],
    rowHeaders = true,
    height = 550,
    width = '100%',
    stretchH = 'all',
    isLoading: externalIsLoading,
    loadingText = 'Loading data grid...',
    isDark = false,
    isAdmin = false,
    batchSize = 100,
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
    onDeleteRow,
    onCellClick,
    onRowClick,
    afterScrollVertically: customAfterScrollVertically,
    beforeColumnSort: customBeforeColumnSort,
    actionColumnIndex,
    sx = {},
    ...restProps
  },
  ref
) {
  const innerHotRef = useRef(null);
  useImperativeHandle(ref, () => innerHotRef.current);

  const workerRef = useRef(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(externalIsLoading ?? true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

  const [totalFilteredRows, setTotalFilteredRows] = useState(totalRows || dataset.length);
  const totalFilteredRowsRef = useRef(totalRows || dataset.length);

  const [activeSort, setActiveSort] = useState({ columnId: null, direction: 'none' });
  const activeSortRef = useRef({ columnId: null, direction: 'none' });

  // Sync external loading state if provided
  useEffect(() => {
    if (externalIsLoading !== undefined) {
      setIsLoading(externalIsLoading);
    }
  }, [externalIsLoading]);

  // ──────────────────────────────────────────────────────────────────────────
  // Web Worker Management
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let worker;
    try {
      worker = new Worker(new URL('./tableWorker.js', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { type, rows, totalCount, columnId, direction } = e.data;

        if (type === 'INIT_COMPLETE' || type === 'DATASET_UPDATED') {
          setData(rows);
          setTotalFilteredRows(totalCount);
          totalFilteredRowsRef.current = totalCount;
          setIsLoading(false);
          setHasMore(rows.length < totalCount);
          hasMoreRef.current = rows.length < totalCount;
        } else if (type === 'ROWS_LOADED') {
          setData((prev) => {
            const next = [...prev, ...rows];
            if (next.length >= totalCount) {
              setHasMore(false);
              hasMoreRef.current = false;
            }
            return next;
          });
          isFetchingRef.current = false;
        } else if (type === 'SORT_COMPLETE' || type === 'FILTER_COMPLETE') {
          setData(rows);
          setTotalFilteredRows(totalCount);
          totalFilteredRowsRef.current = totalCount;
          if (type === 'SORT_COMPLETE') {
            setActiveSort({ columnId, direction });
            activeSortRef.current = { columnId, direction };
          }
          setIsProcessing(false);
          setHasMore(rows.length < totalCount);
          hasMoreRef.current = rows.length < totalCount;
          isFetchingRef.current = false;
          try {
            innerHotRef.current?.hotInstance?.scrollViewportTo({ row: 0, col: 0 });
          } catch {
            // Ignore scroll error if row 0 is hidden
          }
        } else if (type === 'RESET_COMPLETE') {
          setData(rows);
          setTotalFilteredRows(totalCount);
          totalFilteredRowsRef.current = totalCount;
          setActiveSort({ columnId: null, direction: 'none' });
          activeSortRef.current = { columnId: null, direction: 'none' };
          setIsProcessing(false);
          setHasMore(rows.length < totalCount);
          hasMoreRef.current = rows.length < totalCount;
          isFetchingRef.current = false;
          try {
            innerHotRef.current?.hotInstance?.scrollViewportTo({ row: 0, col: 0 });
          } catch {
            // Ignore scroll error
          }
        }
      };

      // Initialize worker with dataset
      if (Array.isArray(dataset) && dataset.length > 0) {
        worker.postMessage({
          type: 'INIT',
          payload: {
            rows: dataset,
            totalCount: totalRows || dataset.length,
            count: batchSize,
          },
        });
      }
    } catch (err) {
      console.warn('DataTable Web Worker initialization fallback:', err);
      setData(dataset.slice(0, batchSize));
      setIsLoading(false);
    }

    return () => {
      if (worker) worker.terminate();
    };
  }, []);

  // Update worker dataset if parent changes dataset or totalRows
  useEffect(() => {
    if (workerRef.current && Array.isArray(dataset) && dataset.length > 0) {
      workerRef.current.postMessage({
        type: 'SET_DATASET',
        payload: {
          rows: dataset,
          totalCount: totalRows || dataset.length,
          count: batchSize,
        },
      });
    } else if (!workerRef.current && Array.isArray(dataset)) {
      setData(dataset.slice(0, batchSize));
    }
  }, [dataset, totalRows, batchSize]);

  // ──────────────────────────────────────────────────────────────────────────
  // Sorting Handler
  // ──────────────────────────────────────────────────────────────────────────
  const handleBeforeColumnSort = useCallback(
    (currentSortConfig, destinationSortConfigs) => {
      if (customBeforeColumnSort) {
        const customResult = customBeforeColumnSort(currentSortConfig, destinationSortConfigs);
        if (customResult === false) return false;
      }

      const actionColIdx = columns ? columns.length - 1 : -1;
      if (
        isAdmin &&
        destinationSortConfigs &&
        destinationSortConfigs.some((cfg) => cfg.column === actionColIdx)
      ) {
        return false;
      }

      setTimeout(() => {
        if (destinationSortConfigs && destinationSortConfigs.length > 0) {
          const dest = destinationSortConfigs[0];
          const colDef = visibleColumnsList[dest.column] || (columns && columns[dest.column]);

          if (colDef && workerRef.current) {
            let nextDir = 'asc';
            if (activeSortRef.current.columnId === (colDef.id || colDef.data)) {
              if (activeSortRef.current.direction === 'asc') {
                nextDir = 'desc';
              } else if (activeSortRef.current.direction === 'desc') {
                nextDir = 'none';
              } else {
                nextDir = 'asc';
              }
            } else {
              nextDir = 'asc';
            }

            const colId = colDef.id || colDef.data;
            const dataIdx = colDef.dataIndex ?? colDef.data ?? dest.column;
            const colType = colDef.type || 'text';

            setIsProcessing(true);
            workerRef.current.postMessage({
              type: 'SORT',
              payload: {
                columnId: nextDir === 'none' ? null : colId,
                dataIndex: nextDir === 'none' ? null : dataIdx,
                direction: nextDir,
                type: colType,
                count: batchSize,
              },
            });
          }
        }
      }, 0);

      return false;
    },
    [columns, visibleColumnsList, isAdmin, batchSize, customBeforeColumnSort]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Filter Handler
  // ──────────────────────────────────────────────────────────────────────────
  const handleBeforeFilter = useCallback(
    (conditionsStack) => {
      if (workerRef.current) {
        setIsProcessing(true);
        workerRef.current.postMessage({
          type: 'FILTER',
          payload: {
            filters: { conditionsStack },
            count: batchSize,
          },
        });
      }
      return false;
    },
    [batchSize]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Vertical Scroll Infinite Batch Loading Handler
  // ──────────────────────────────────────────────────────────────────────────
  const handleAfterScrollVertically = useCallback(() => {
    if (customAfterScrollVertically) {
      customAfterScrollVertically();
    }

    if (isFetchingRef.current || !hasMoreRef.current || isProcessing) return;
    const hot = innerHotRef.current?.hotInstance;
    if (!hot) return;

    let lastRow = -1;
    try {
      if (hot.view && hot.view.wt && hot.view.wt.wtTable) {
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
      if (currentCount >= totalFilteredRowsRef.current) {
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }

      isFetchingRef.current = true;
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'GET_ROWS',
          payload: { startIndex: currentCount, count: batchSize },
        });
      }
    }
  }, [batchSize, isProcessing, customAfterScrollVertically]);

  // Centralized Cell Mouse Down Handler
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

    if (onCellClick) {
      onCellClick(event, coords, cellValue, rowData);
    }

    if (onRowClick) {
      onRowClick(event, coords, rowData);
    }
  };

  // Re-format colHeaders to include sort indicators ▲ / ▼
  const processedColHeaders = React.useMemo(() => {
    if (!colHeaders || !Array.isArray(colHeaders)) return colHeaders;
    return colHeaders.map((headerText, index) => {
      const colDef = visibleColumnsList[index] || (columns && columns[index]);
      if (colDef && (colDef.id || colDef.data) === activeSort.columnId) {
        if (activeSort.direction === 'asc') return `${headerText} ▲`;
        if (activeSort.direction === 'desc') return `${headerText} ▼`;
      }
      return headerText;
    });
  }, [colHeaders, visibleColumnsList, columns, activeSort]);

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
          ref={innerHotRef}
          data={data}
          columns={columns}
          colHeaders={processedColHeaders}
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
          beforeColumnSort={handleBeforeColumnSort}
          beforeFilter={handleBeforeFilter}
          afterScrollVertically={handleAfterScrollVertically}
          afterOnCellMouseDown={handleCellMouseDown}
          {...restProps}
        />
      )}
    </Box>
  );
});

export default DataTable;
