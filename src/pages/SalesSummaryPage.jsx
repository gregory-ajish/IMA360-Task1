// SalesSummaryPage.jsx
// ============================================================================
// PURPOSE:
//   A standalone page at /sales-summary demonstrating aggregate functions
//   (Sum, Average, Min, Max) on a sales dataset (~50 rows) with exactly 5 editable
//   spare rows at the bottom that automatically compact upward (no empty gaps)
//   and a dedicated, pixel-perfect summary footer bar pinned at the bottom.
// ============================================================================

import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
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
  Chip,
} from '@mui/material';

// Material-UI icons
import {
  ArrowBack as ArrowBackIcon,
  Summarize as SummarizeIcon,
  Functions as FunctionsIcon,
} from '@mui/icons-material';

// Handsontable registry (for plugins/styles)
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// Theme tokens & Context
import { blcColors, typographyTokens } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { DataTable } from '../components/common/DataTable';
import { AppButton } from '../components/common/AppButton';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Navbar } from '../components/dashboard/Navbar';

// Toast notifications
import { toast } from 'react-toastify';

// Register all Handsontable modules globally
registerAllModules();

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
  return data;
};

// ── Column Definitions ──────────────────────────────────────────────────────
// No fixed column widths so stretchH="all" evenly and smoothly sizes columns without horizontal overflow
const COLUMN_DEFS = [
  { data: 0, type: 'text' }, // Region
  { data: 1, type: 'numeric', numericFormat: { pattern: '0,0' } }, // Units Sold
  { data: 2, type: 'numeric', numericFormat: { pattern: '$0,0' } }, // Unit Price ($)
  { data: 3, type: 'numeric', numericFormat: { pattern: '$0,0' } }, // Revenue ($)
  { data: 4, type: 'numeric', numericFormat: { pattern: '$0,0' } }, // Cost ($)
  { data: 5, type: 'numeric', numericFormat: { pattern: '$0,0' } }, // Profit ($)
];

const COL_HEADERS = [
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

  // Pre-generate raw dataset: 50 sales rows + exactly 5 empty spare rows (TOTAL = 55 rows)
  const rawSalesData = useMemo(() => generateSalesDataset(), []);

  const dataset = useMemo(() => {
    const data = [...rawSalesData];
    // Exactly 5 empty spare rows for user input
    for (let i = 0; i < 5; i++) {
      data.push([null, null, null, null, null, null]);
    }
    return data;
  }, [rawSalesData]);

  // Aggregates state displayed in the dedicated footer
  const [aggregates, setAggregates] = useState(() =>
    calculateAggregatesFromRows(rawSalesData, 'sum')
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

  // afterChange hook: Formula recalculation, Gaps compaction, and Summary aggregate updates
  const handleAfterChange = useCallback((changes, source) => {
    if (!changes || changes.length === 0) return;
    if (source === 'loadData' || source === 'calc' || source === 'compact') return;
    if (isCompactingRef.current) return;

    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const totalRows = hot.countRows();

    // 1. Formula calculations for edited rows
    const formulaUpdates = [];
    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (row >= totalRows) return;

      if (prop === 1 || prop === 2) {
        // Units Sold (col 1) or Unit Price (col 2) changed
        const unitsRaw = prop === 1 ? newValue : hot.getDataAtCell(row, 1);
        const priceRaw = prop === 2 ? newValue : hot.getDataAtCell(row, 2);

        const units = parseNumber(unitsRaw);
        const price = parseNumber(priceRaw);

        if (units !== null && price !== null) {
          const revenue = units * price;
          const cost = Math.round(revenue * 0.4);
          const profit = revenue - cost;
          formulaUpdates.push([row, 3, revenue]);
          formulaUpdates.push([row, 4, cost]);
          formulaUpdates.push([row, 5, profit]);
        } else if (units === null && price === null) {
          formulaUpdates.push([row, 3, null]);
          formulaUpdates.push([row, 4, null]);
          formulaUpdates.push([row, 5, null]);
        }
      } else if (prop === 3) {
        // Revenue (col 3) changed directly
        const rev = parseNumber(newValue);
        if (rev !== null) {
          const cost = Math.round(rev * 0.4);
          const profit = rev - cost;
          formulaUpdates.push([row, 4, cost]);
          formulaUpdates.push([row, 5, profit]);
        }
      }
    });

    if (formulaUpdates.length > 0) {
      hot.setDataAtCell(formulaUpdates, 'calc');
    }

    // 2. Row Compaction Logic
    // Only run compaction when no filters are active (all rows are visible)
    if (totalRows >= dataset.length) {
      const isRowBlank = (r) => {
        for (let c = 0; c < 6; c++) {
          const v = hot.getDataAtCell(r, c);
          if (v !== null && v !== undefined && String(v).trim() !== '') {
            return false;
          }
        }
        return true;
      };

      let seenEmpty = false;
      let hasGaps = false;
      for (let r = 0; r < totalRows; r++) {
        const blank = isRowBlank(r);
        if (blank) {
          seenEmpty = true;
        } else if (seenEmpty) {
          hasGaps = true;
          break;
        }
      }

      if (hasGaps) {
        isCompactingRef.current = true;
        try {
          const filledRows = [];
          for (let r = 0; r < totalRows; r++) {
            if (!isRowBlank(r)) {
              const rowData = [0, 1, 2, 3, 4, 5].map((c) => hot.getDataAtCell(r, c));
              filledRows.push({ originalRow: r, data: rowData });
            }
          }

          const compactionChanges = [];
          for (let r = 0; r < totalRows; r++) {
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

            // Seamlessly restore focus to the row that moved
            const lastChange = changes[changes.length - 1];
            if (lastChange) {
              const editedRow = lastChange[0];
              const editedCol = lastChange[1];
              const newIdx = filledRows.findIndex((item) => item.originalRow === editedRow);
              if (newIdx !== -1 && newIdx !== editedRow) {
                hot.selectCell(newIdx, editedCol);
              }
            }
          }
        } finally {
          isCompactingRef.current = false;
        }
      }
    }

    // 3. Immediately update summary aggregates in the dedicated footer
    setAggregates(computeAggregates(hot, aggregateTypeRef.current));
  }, [dataset.length]);

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
                  Sales Summary
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
                  <SummarizeIcon fontSize="small" />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: typographyTokens.fontMono,
                    fontWeight: typographyTokens.weightBold,
                  }}
                >
                  Sales Summary — Column Aggregates
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right: Quick actions including common ThemeToggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThemeToggle mode={mode} toggleMode={toggleMode} />
          </Box>
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
              columns={COLUMN_DEFS}
              colHeaders={COL_HEADERS}
              rowHeaders={true}
              height={500}
              width="100%"
              stretchH="all"
              batchSize={100}
              columnSorting={true}
              filters={true}
              dropdownMenu={DROPDOWN_MENU_OPTIONS}
              manualColumnResize={true}
              autoWrapRow={true}
              autoWrapCol={true}
              licenseKey="non-commercial-and-evaluation"
              isDark={isDark}
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

              {/* Col 0: Region (Displays Aggregate Label) */}
              <Box
                sx={{
                  width: columnWidths ? `${columnWidths.cols[0]}px` : 'auto',
                  minWidth: columnWidths ? `${columnWidths.cols[0]}px` : 'auto',
                  maxWidth: columnWidths ? `${columnWidths.cols[0]}px` : 'auto',
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

              {/* Numeric Column Summary Values (Cols 1..5) mapped cleanly */}
              {NUMERIC_COL_INDICES.map((col) => (
                <Box
                  key={col}
                  sx={{
                    width: columnWidths ? `${columnWidths.cols[col]}px` : 'auto',
                    minWidth: columnWidths ? `${columnWidths.cols[col]}px` : 'auto',
                    maxWidth: columnWidths ? `${columnWidths.cols[col]}px` : 'auto',
                    px: 1,
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatAggregateValue(aggregates[col], col, aggregateType)}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Footer info */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
              px: 0.5,
            }}
          >
            <Typography
              sx={{
                fontFamily: typographyTokens.fontMono,
                fontSize: '0.75rem',
                color: isDark ? '#475569' : '#94a3b8',
              }}
            >
              50 sales rows + 5 spare rows • {NUMERIC_COL_INDICES.length} numeric columns aggregated
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
