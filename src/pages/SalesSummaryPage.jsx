// SalesSummaryPage.jsx
// ============================================================================
// PURPOSE:
//   A standalone page at /sales-summary demonstrating aggregate functions
//   (Sum, Average, Min, Max) on a sales dataset (~50 rows) with exactly 5 editable
//   spare rows at the bottom that automatically compact upward (no empty gaps)
//   and a dedicated, pixel-perfect summary footer bar pinned at the bottom.
// ============================================================================

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Material-UI components
import {
  Box,
  Container,
  Paper,
  Typography,
  Chip,
} from '@mui/material';

// Centralized App Icons
import {
  SummarizeIcon,
  FunctionsIcon,
} from '../icons';


// Theme tokens & Context
import { blcColors, typographyTokens } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, DataTableToolbar } from '../components/dataTable';
import { AppButton } from '../components/common/AppButton';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Navbar } from '../components/dashboard/Navbar';

// Toast notifications
import { toast } from 'react-toastify';


// ── Sample Sales Dataset (50 rows) ──────────────────────────────────────────
const SALES_REGIONS = ['North', 'South', 'East', 'West', 'Central'];

const generateSalesDataset = () => {
  const data = [];
  for (let i = 0; i < 50; i++) {
    const region = SALES_REGIONS[i % SALES_REGIONS.length];
    const unitsSold = Math.floor(80 + ((i * 37) % 420));
    const unitPrice = Math.floor(50 + ((i * 13) % 200));
    const revenue = unitsSold * unitPrice;
    const cost = Math.floor(revenue * (0.4 + ((i * 7) % 30) / 100));
    const profit = revenue - cost;

    data.push([
      region,       // 0: Region
      unitsSold,    // 1: Units Sold
      unitPrice,    // 2: Unit Price ($)
      revenue,      // 3: Revenue ($)
      cost,         // 4: Cost ($)
      profit,       // 5: Profit ($)
    ]);
  }
  // Initialize exactly 5 empty spare rows at the bottom
  for (let i = 0; i < 5; i++) {
    data.push([null, null, null, null, null, null]);
  }
  return data;
};

// ── Column Definitions ──────────────────────────────────────────────────────
export const DEFAULT_SALES_COLUMNS = [
  { id: 'region', label: 'Region', dataIndex: 0, type: 'text' },
  { id: 'unitsSold', label: 'Units Sold', dataIndex: 1, type: 'numeric', numericFormat: { pattern: '0,0' } },
  { id: 'unitPrice', label: 'Unit Price ($)', dataIndex: 2, type: 'numeric', numericFormat: { pattern: '$0,0' } },
  { id: 'revenue', label: 'Revenue ($)', dataIndex: 3, type: 'numeric', numericFormat: { pattern: '$0,0' } },
  { id: 'cost', label: 'Cost ($)', dataIndex: 4, type: 'numeric', numericFormat: { pattern: '$0,0' } },
  { id: 'profit', label: 'Profit ($)', dataIndex: 5, type: 'numeric', numericFormat: { pattern: '$0,0' } },
];

export const COLUMN_DEFS = DEFAULT_SALES_COLUMNS;
export const COL_HEADERS = [
  'Region',
  'Units Sold',
  'Unit Price ($)',
  'Revenue ($)',
  'Cost ($)',
  'Profit ($)',
];

// Indices of numeric columns that should be aggregated (0-based)
const NUMERIC_COL_INDICES = [1, 2, 3, 4, 5];

// Available aggregate function types
const AGGREGATE_TYPES = [
  { value: 'sum', label: 'Sum', icon: 'Σ' },
  { value: 'average', label: 'Average', icon: 'A' },
  { value: 'min', label: 'Min', icon: '↓' },
  { value: 'max', label: 'Max', icon: '↑' },
];

const DROPDOWN_MENU_OPTIONS = [
  'filter_by_condition',
  'filter_by_value',
  'filter_action_bar',
];

/**
 * Robust number parsing that handles strings with commas, dollar signs, or spaces.
 */
const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[$,\s]/g, '');
  if (cleaned === '') return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
};

/**
 * Format aggregate values for display in the dedicated summary footer.
 */
const formatAggregateValue = (value, col, aggregateType) => {
  if (value === null || value === undefined || isNaN(value)) return '—';

  const isCurrency = col >= 2; // cols 2..5 are currency; col 1 is Units Sold
  const fractionDigits = aggregateType === 'average' ? 2 : 0;

  if (isCurrency) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};



/**
 * Pure calculation helper for aggregate metrics across a numeric array.
 */
const calculateMetric = (values, aggType) => {
  if (!values || values.length === 0) return null;
  switch (aggType) {
    case 'sum':
      return values.reduce((acc, v) => acc + v, 0);
    case 'average':
      return values.reduce((acc, v) => acc + v, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return 0;
  }
};

/**
 * Calculates aggregate values across an array of row arrays.
 */
const calculateAggregatesFromRows = (rows, aggType) => {
  if (!rows || rows.length === 0) {
    return { 1: null, 2: null, 3: null, 4: null, 5: null };
  }
  const results = {};
  for (const col of NUMERIC_COL_INDICES) {
    const values = rows.map((r) => parseNumber(r[col])).filter((v) => v !== null);
    results[col] = calculateMetric(values, aggType);
  }
  return results;
};

/**
 * Calculates aggregate values directly from the active Handsontable instance.
 */
const computeAggregates = (hotInstance, aggType) => {
  if (!hotInstance) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalRows = hotInstance.countRows();
  const results = {};
  for (const col of NUMERIC_COL_INDICES) {
    const values = [];
    for (let r = 0; r < totalRows; r++) {
      const num = parseNumber(hotInstance.getDataAtCell(r, col));
      if (num !== null) values.push(num);
    }
    results[col] = calculateMetric(values, aggType);
  }
  return results;
};

/**
 * SalesSummaryPage Component
 */
export const SalesSummaryPage = ({ mode, toggleMode }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  const hotRef = useRef(null);
  const isCompactingRef = useRef(false);

  // Active aggregate type state & ref
  const [aggregateType, setAggregateType] = useState('sum');
  const aggregateTypeRef = useRef('sum');

  // Exact column pixel widths measured from Handsontable header DOM
  const [columnWidths, setColumnWidths] = useState(null);

  // Pre-generate raw dataset: 50 sales rows
  const [dataset, setDataset] = useState(() => generateSalesDataset());

  // Reusable Delete ref
  const deleteRef = useRef(null);

  // Visible & hidden columns state synced with localStorage
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('sales_summary_visible_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved visible columns:', e);
    }
    return DEFAULT_SALES_COLUMNS;
  });

  const [hiddenColumns, setHiddenColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('sales_summary_hidden_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved hidden columns:', e);
    }
    return [];
  });

  const columns = useMemo(() => {
    return visibleColumns.map((col) => {
      const colDef = {
        data: col.dataIndex,
        type: col.type || 'text',
      };
      if (col.numericFormat) colDef.numericFormat = col.numericFormat;
      return colDef;
    });
  }, [visibleColumns]);

  const colHeaders = useMemo(() => {
    return visibleColumns.map((col) => col.label);
  }, [visibleColumns]);

  const handleColumnsChange = (newVisible, newHidden) => {
    setVisibleColumns(newVisible);
    setHiddenColumns(newHidden);
    try {
      localStorage.setItem('sales_summary_visible_columns', JSON.stringify(newVisible));
      localStorage.setItem('sales_summary_hidden_columns', JSON.stringify(newHidden));
    } catch (e) {
      console.error('Error saving columns to localStorage:', e);
    }
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_SALES_COLUMNS);
    setHiddenColumns([]);
    try {
      localStorage.removeItem('sales_summary_visible_columns');
      localStorage.removeItem('sales_summary_hidden_columns');
    } catch (e) {
      console.error('Error resetting columns:', e);
    }
    toast.info('Columns reset to default view.');
  };

  const handleAfterSelectionEnd = useCallback(() => {
    deleteRef.current?.handleAfterSelectionEnd?.();
  }, []);

  const handleDeleteRows = (indicesToDelete) => {
    const indicesSet = new Set(indicesToDelete);
    setDataset((prev) => prev.filter((_, i) => !indicesSet.has(i)));
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      setTimeout(() => {
        setAggregates(computeAggregates(hot, aggregateTypeRef.current));
      }, 50);
    }
  };

  const handleApplyBulkUpdate = (updates) => {
    if (!updates || updates.length === 0) return;
    setDataset((prev) =>
      prev.map((row) => {
        const isBlank = row.every((c) => c === null || c === undefined || c === '');
        if (isBlank) return row;
        const newRow = [...row];
        updates.forEach(({ colIndex, val }) => {
          newRow[colIndex] = val;
        });
        return newRow;
      })
    );
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      setTimeout(() => {
        setAggregates(computeAggregates(hot, aggregateTypeRef.current));
      }, 50);
    }
    toast.success(
      `Bulk updated ${updates.map((u) => u.label).join(' & ')} across records!`
    );
  };

  // Aggregates state displayed in the dedicated footer
  const [aggregates, setAggregates] = useState(() =>
    calculateAggregatesFromRows(dataset, 'sum')
  );

  // Sync ref with state
  useEffect(() => {
    aggregateTypeRef.current = aggregateType;
  }, [aggregateType]);

  // Measure exact rendered column header widths directly from Handsontable DOM
  const syncColumnWidths = useCallback(() => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const root = hot.rootElement;
    if (!root) return;

    let ths = root.querySelectorAll('.ht_clone_top thead tr:last-child th');
    if (!ths || ths.length < 7) {
      ths = root.querySelectorAll('.htCore thead tr:last-child th');
    }
    if (!ths || ths.length < 7) return;

    // th[0] is the corner row header column
    const headerWidth = ths[0].getBoundingClientRect().width;

    // th[1..6] are columns 0..5
    const widths = [];
    for (let c = 1; c <= 6; c++) {
      widths.push(ths[c].getBoundingClientRect().width);
    }

    setColumnWidths((prev) => {
      if (
        prev &&
        Math.abs(prev.header - headerWidth) < 0.5 &&
        prev.cols.length === widths.length &&
        prev.cols.every((w, i) => Math.abs(w - widths[i]) < 0.5)
      ) {
        return prev;
      }
      return {
        header: headerWidth,
        cols: widths,
      };
    });
  }, []);

  // Handle Aggregate Function button changes
  const handleAggregateChange = useCallback((_event, newType) => {
    if (!newType) return;
    setAggregateType(newType);
    aggregateTypeRef.current = newType;

    const hot = hotRef.current?.hotInstance;
    if (hot) {
      setAggregates(computeAggregates(hot, newType));
    }
    toast.info(`Switched to ${newType.charAt(0).toUpperCase() + newType.slice(1)} aggregation`);
  }, []);

  // afterChange hook: Upward compaction when spare rows have gaps, keeping exactly 5 spare rows at the bottom
  const handleAfterChange = useCallback((changes, source) => {
    if (!changes || changes.length === 0) return;
    if (source === 'loadData' || source === 'calc' || source === 'compact') return;
    if (isCompactingRef.current) return;

    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const totalRows = hot.countRows();

    // Only run compaction when no filters are active
    const filtersPlugin = hot.getPlugin('filters');
    const isFiltered = filtersPlugin && !filtersPlugin.conditionCollection?.isEmpty?.();

    if (!isFiltered) {
      const isRowBlank = (r) => {
        for (let c = 0; c < 6; c++) {
          const v = hot.getDataAtCell(r, c);
          if (v !== null && v !== undefined && String(v).trim() !== '') {
            return false;
          }
        }
        return true;
      };

      // Collect all filled rows in order and check for gaps between filled rows
      const filledRows = [];
      let seenEmpty = false;
      let hasGaps = false;

      for (let r = 0; r < totalRows; r++) {
        const blank = isRowBlank(r);
        if (blank) {
          seenEmpty = true;
        } else {
          if (seenEmpty) {
            hasGaps = true; // An empty row was encountered before this filled row
          }
          const rowData = [0, 1, 2, 3, 4, 5].map((c) => hot.getDataAtCell(r, c));
          filledRows.push({ originalRow: r, data: rowData });
        }
      }

      // The table must ALWAYS have all filled rows + EXACTLY 5 empty spare rows
      const desiredTotalRows = filledRows.length + 5;
      const needsRowAdjustment = totalRows !== desiredTotalRows;

      if (hasGaps || needsRowAdjustment) {
        isCompactingRef.current = true;
        try {
          // 1. Strictly synchronize total row count to desiredTotalRows (filledRows + exactly 5 spare rows)
          let currentCount = hot.countRows();
          if (currentCount < desiredTotalRows) {
            hot.alter('insert_row_below', currentCount - 1, desiredTotalRows - currentCount);
          } else if (currentCount > desiredTotalRows) {
            hot.alter('remove_row', desiredTotalRows, currentCount - desiredTotalRows);
          }

          currentCount = hot.countRows();

          // 2. Shift non-empty rows upward to eliminate any empty row gaps
          const compactionChanges = [];
          for (let r = 0; r < currentCount; r++) {
            const targetRowData = r < filledRows.length
              ? filledRows[r].data
              : [null, null, null, null, null, null];
            for (let c = 0; c < 6; c++) {
              const curVal = hot.getDataAtCell(r, c);
              if (curVal !== targetRowData[c]) {
                compactionChanges.push([r, c, targetRowData[c]]);
              }
            }
          }

          if (compactionChanges.length > 0) {
            hot.setDataAtCell(compactionChanges, 'compact');

            // Seamlessly restore focus to the row that moved upward
            const lastChange = changes[changes.length - 1];
            if (lastChange) {
              const editedRow = lastChange[0];
              const editedCol = lastChange[1];
              const newIdx = filledRows.findIndex((item) => item.originalRow === editedRow);
              if (newIdx !== -1 && newIdx !== editedRow) {
                setTimeout(() => {
                  try {
                    hot.selectCell(newIdx, editedCol);
                  } catch {
                    // ignore if cell is already selected
                  }
                }, 0);
              }
            }
          }
        } finally {
          isCompactingRef.current = false;
        }
      }
    }

    // Immediately update summary aggregates in the dedicated footer
    setAggregates(computeAggregates(hot, aggregateTypeRef.current));
  }, []);

  const handleBeforeColumnSort = useCallback(() => {
    return true;
  }, []);

  // Callbacks from generic Web Worker on filter, sort, or initial load
  const handleFilterComplete = useCallback((filteredRows) => {
    setAggregates(calculateAggregatesFromRows(filteredRows, aggregateTypeRef.current));
    requestAnimationFrame(() => {
      syncColumnWidths();
    });
  }, [syncColumnWidths]);

  const handleSortComplete = useCallback((sortedRows) => {
    setAggregates(calculateAggregatesFromRows(sortedRows, aggregateTypeRef.current));
    requestAnimationFrame(() => {
      syncColumnWidths();
    });
  }, [syncColumnWidths]);

  const handleDataLoaded = useCallback((loadedRows) => {
    setAggregates(calculateAggregatesFromRows(loadedRows, aggregateTypeRef.current));
    requestAnimationFrame(() => {
      syncColumnWidths();
    });
  }, [syncColumnWidths]);

  // Initial calculation and column width measurement
  useEffect(() => {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      setAggregates(computeAggregates(hot, aggregateTypeRef.current));
      requestAnimationFrame(() => {
        syncColumnWidths();
      });
    }

    window.addEventListener('resize', syncColumnWidths);
    return () => {
      window.removeEventListener('resize', syncColumnWidths);
    };
  }, [syncColumnWidths]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const activeAggLabel = AGGREGATE_TYPES.find((a) => a.value === aggregateType);

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

      {/* ── Main Container (Full Width) ── */}
      <Container maxWidth={false} sx={{ mt: 3, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Back navigation & Header bar */}
        <PageHeader
          icon={<SummarizeIcon />}
          title="Sales Summary — Column Aggregates"
          breadcrumb="Sales Summary"
          isDark={isDark}
          actions={<ThemeToggle mode={mode} toggleMode={toggleMode} />}
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
          {/* Aggregate Type Selector + Info */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2.5,
            }}
          >
            {/* Left: Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FunctionsIcon
                sx={{
                  fontSize: 20,
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              />
              <Typography
                sx={{
                  fontFamily: typographyTokens.fontMono,
                  fontSize: '0.82rem',
                  fontWeight: typographyTokens.weightSemiBold,
                  color: isDark ? '#94a3b8' : '#475569',
                }}
              >
                Aggregate Function:
              </Typography>
              <Chip
                label={`${activeAggLabel?.icon}  ${activeAggLabel?.label}`}
                size="small"
                sx={{
                  fontFamily: typographyTokens.fontMono,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  bgcolor: isDark ? 'rgba(30,58,138,0.25)' : `${blcColors.navyAccent}12`,
                  color: isDark ? '#93c5fd' : blcColors.navyAccent,
                  border: `1px solid ${isDark ? 'rgba(30,58,138,0.4)' : `${blcColors.navyAccent}30`}`,
                }}
              />
            </Box>

            {/* Right: Buttons for Aggregate Type using common AppButton */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {AGGREGATE_TYPES.map((agg) => (
                <AppButton
                  key={agg.value}
                  variant={aggregateType === agg.value ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleAggregateChange(null, agg.value)}
                >
                  {agg.icon}&nbsp;&nbsp;{agg.label}
                </AppButton>
              ))}
            </Box>
          </Box>

          {/* Table Header Controls (Bulk Updater, Delete, Save View, Saved Views, View Management) */}
          <DataTableToolbar
            hotRef={hotRef}
            deleteRef={deleteRef}
            dataset={dataset}
            onDelete={handleDeleteRows}
            itemLabel="sales record"
            columns={columns}
            onApplyBulkUpdate={handleApplyBulkUpdate}
            visibleColumns={visibleColumns}
            hiddenColumns={hiddenColumns}
            onColumnsChange={handleColumnsChange}
            onResetColumns={handleResetColumns}
            pageKey="sales_summary"
            isDark={isDark}
          />

          {/* Handsontable + Dedicated Fixed Footer Box */}
          <Box
            sx={{
              borderRadius: '8px',
              overflow: 'hidden',
              border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
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
              // Suppress unnecessary horizontal scrollbars
              '& .handsontable .wtHolder': {
                overflowX: 'hidden !important',
              },
            }}
          >
            {/* Handsontable Data Grid backed by tableWorker */}
            <DataTable
              ref={hotRef}
              useWorker={true}
              renderAllRows={true}
              dataset={dataset}
              totalRows={dataset.length}
              columns={columns}
              colHeaders={colHeaders}
              visibleColumnsList={visibleColumns}
              rowHeaders={true}
              height={500}
              width="100%"
              stretchH="all"
              batchSize={100}
              columnSorting={true}
              filters={true}
              dropdownMenu={DROPDOWN_MENU_OPTIONS}
              minSpareRows={0}
              manualColumnResize={true}
              autoWrapRow={true}
              autoWrapCol={true}
              afterSelectionEnd={handleAfterSelectionEnd}
              licenseKey="non-commercial-and-evaluation"
              isDark={isDark}
              beforeColumnSort={handleBeforeColumnSort}
              afterChange={handleAfterChange}
              afterRender={syncColumnWidths}
              onFilterComplete={handleFilterComplete}
              onSortComplete={handleSortComplete}
              onDataLoaded={handleDataLoaded}
            />

            {/* ── Dedicated Pinned Summary Footer Bar (Pixel-Perfect Aligned) ── */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                borderTop: `2px solid ${isDark ? '#334155' : '#94a3b8'}`,
                bgcolor: isDark ? '#1e293b' : '#f1f5f9',
                color: isDark ? '#60a5fa' : blcColors.navyAccent,
                py: 1.25,
                fontWeight: 700,
                fontSize: '0.85rem',
                fontFamily: typographyTokens.fontMono,
                letterSpacing: '0.02em',
                userSelect: 'none',
                overflow: 'hidden',
              }}
            >
              {/* Row Header Spacer (exact pixel width of row header column) */}
              <Box
                sx={{
                  width: columnWidths ? `${columnWidths.header}px` : '50px',
                  minWidth: columnWidths ? `${columnWidths.header}px` : '50px',
                  maxWidth: columnWidths ? `${columnWidths.header}px` : '50px',
                  textAlign: 'center',
                  color: isDark ? '#64748b' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              >
                {activeAggLabel?.icon || 'Σ'}
              </Box>

              {/* Dynamic Footer Columns mapped according to visibleColumns */}
              {visibleColumns.map((col, idx) => {
                const isFirstCol = idx === 0;
                const widthPx = columnWidths ? `${columnWidths.cols[idx]}px` : 'auto';
                if (isFirstCol) {
                  return (
                    <Box
                      key={col.id || idx}
                      sx={{
                        width: widthPx,
                        minWidth: widthPx,
                        maxWidth: widthPx,
                        px: 1,
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                      }}
                    >
                      <Chip
                        label={aggregateType === 'sum' ? 'Total' : activeAggLabel?.label}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          fontFamily: typographyTokens.fontMono,
                          bgcolor: isDark ? 'rgba(59, 130, 246, 0.2)' : `${blcColors.navyAccent}15`,
                          color: isDark ? '#93c5fd' : blcColors.navyAccent,
                        }}
                      />
                    </Box>
                  );
                }
                const aggVal = aggregates[col.dataIndex];
                return (
                  <Box
                    key={col.id || idx}
                    sx={{
                      width: widthPx,
                      minWidth: widthPx,
                      maxWidth: widthPx,
                      px: 1,
                      textAlign: 'right',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatAggregateValue(aggVal, col.dataIndex, aggregateType)}
                  </Box>
                );
              })}
            </Box>
          </Box>

        </Paper>
      </Container>
    </Box>
  );
};
