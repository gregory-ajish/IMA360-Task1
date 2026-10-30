// src/components/tables/DataGridAggregationFooter.jsx
// ============================================================================
// PURPOSE:
//   Column-Aligned Aggregation Footer Component for DataGrid.
//   Aligns aggregate values directly beneath each respective table column:
//     - Under numeric columns (e.g. Annual ARR, User Seats): shows the computed metric
//     - Under first column: shows the active aggregation badge (Sum, Average, Min, etc.)
//     - Under non-numeric columns: displays a neutral dash (—)
//   Includes interactive calculation controls:
//     - Sum, Avg, Min, Max, Size (Count), Custom (e.g. Median)
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Chip } from '@mui/material';
import { useGridApiContext } from '@mui/x-data-grid';
import { blcColors, typographyTokens } from '../../theme';

export const AGGREGATE_FUNCTIONS = [
  { value: 'sum', label: 'Sum', fullLabel: 'Sum' },
  { value: 'avg', label: 'Avg', fullLabel: 'Average' },
  { value: 'min', label: 'Min', fullLabel: 'Minimum' },
  { value: 'max', label: 'Max', fullLabel: 'Maximum' },
  { value: 'size', label: 'Size', fullLabel: 'Count' },
  { value: 'custom', label: 'Custom', fullLabel: 'Median' },
];

export const parseNumericValue = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  if (!cleaned) return null;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

export const DataGridAggregationFooter = ({
  rows = [],
  columns = [],
  numericField = 'annualArr',
  numericColumns,
  fieldLabel = 'Annual ARR',
  isDark = false,
  activeType: controlledActiveType,
  onTypeChange,
  customAggregator,
  currency = true,
}) => {
  const apiRef = useGridApiContext();

  const [internalActiveType, setInternalActiveType] = useState('sum');
  const activeType = controlledActiveType || internalActiveType;

  // Track live visible columns with computed pixel widths from DataGrid apiRef
  const [gridColumns, setGridColumns] = useState(columns);

  // Sync state if columns prop changes
  useEffect(() => {
    if (Array.isArray(columns) && columns.length > 0) {
      setGridColumns(columns);
    }
  }, [columns]);

  // Track horizontal scroll position of the grid viewport to keep footer columns perfectly aligned
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    if (!apiRef?.current) return;

    const syncColumns = () => {
      const vCols = apiRef.current.getVisibleColumns();
      if (Array.isArray(vCols) && vCols.length > 0) {
        setGridColumns(vCols);
      }
    };

    // Initial sync
    syncColumns();

    const unsub1 = apiRef.current.subscribeEvent('columnWidthChange', syncColumns);
    const unsub2 = apiRef.current.subscribeEvent('columnsChange', syncColumns);
    const unsub3 = apiRef.current.subscribeEvent('resize', syncColumns);
    const unsub4 = apiRef.current.subscribeEvent('scrollPositionChange', (params) => {
      if (params && typeof params.left === 'number') {
        setScrollLeft(params.left);
      }
    });

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
      unsub4?.();
    };
  }, [apiRef]);

  // Fallback to columns prop if gridColumns is empty
  const activeGridCols = gridColumns && gridColumns.length > 0 ? gridColumns : columns;

  // Resolve target numeric columns config (from numericColumns prop, columns auto-detect, or fallback)
  const targetCols = useMemo(() => {
    if (Array.isArray(numericColumns) && numericColumns.length > 0) {
      return numericColumns.map((c) => {
        if (typeof c === 'string') {
          const matchingGridCol = (columns || []).find((gc) => gc.field === c);
          const isCurr =
            c.toLowerCase().includes('arr') ||
            c.toLowerCase().includes('price') ||
            c.toLowerCase().includes('revenue');
          return {
            field: c,
            label: matchingGridCol?.headerName || c,
            currency: isCurr,
          };
        }
        return {
          field: c.field || c.id,
          label: c.label || c.headerName || c.field || 'Value',
          currency:
            c.currency !== undefined
              ? c.currency
              : Boolean(
                  c.field?.toLowerCase().includes('arr') ||
                    c.field?.toLowerCase().includes('price') ||
                    c.field?.toLowerCase().includes('revenue')
                ),
          customAggregator: c.customAggregator,
        };
      });
    }

    // Auto-detect numeric columns from DataGrid columns
    if (Array.isArray(columns) && columns.length > 0) {
      const detected = columns.filter((col) => {
        if (!col || !col.field) return false;
        if (['actions', 'id', 'displayId', 'rawIndex'].includes(col.field)) return false;
        if (col.type === 'number' || col.type === 'numeric') return true;
        const sampleVal = rows?.[0]?.[col.field];
        return typeof sampleVal === 'number';
      });

      if (detected.length > 0) {
        return detected.map((col) => ({
          field: col.field,
          label: col.headerName || col.field,
          currency: Boolean(
            col.field.toLowerCase().includes('arr') ||
              col.field.toLowerCase().includes('revenue') ||
              col.field.toLowerCase().includes('price')
          ),
        }));
      }
    }

    // Fallback to single numericField
    return [
      {
        field: numericField,
        label: fieldLabel,
        currency,
      },
    ];
  }, [numericColumns, columns, rows, numericField, fieldLabel, currency]);

  // Compute metrics lookup dictionary by column field
  const metricsMap = useMemo(() => {
    const map = {};

    targetCols.forEach((col) => {
      const values = rows
        .map((r) => parseNumericValue(r?.[col.field]))
        .filter((v) => v !== null);

      const count = values.length;
      const sum = values.reduce((acc, v) => acc + v, 0);
      const avg = count > 0 ? sum / count : 0;
      const min = count > 0 ? Math.min(...values) : 0;
      const max = count > 0 ? Math.max(...values) : 0;

      let customVal = 0;
      let customLabel = 'Median';
      const aggregator = col.customAggregator || customAggregator;
      if (typeof aggregator === 'function') {
        const res = aggregator(values, rows, col.field);
        if (res && typeof res === 'object') {
          customVal = res.value ?? 0;
          customLabel = res.label || 'Custom';
        } else {
          customVal = Number(res) || 0;
        }
      } else if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        customVal = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        customLabel = 'Median';
      }

      const formatNum = (num, decimals = 0) => {
        if (num === null || num === undefined || isNaN(num)) return '—';
        if (col.currency) {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(num);
        }
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(num);
      };

      let displayValue = '';
      switch (activeType) {
        case 'sum':
          displayValue = formatNum(sum, 0);
          break;
        case 'avg':
          displayValue = formatNum(avg, col.currency ? 2 : (avg % 1 === 0 ? 0 : 1));
          break;
        case 'min':
          displayValue = formatNum(min, 0);
          break;
        case 'max':
          displayValue = formatNum(max, 0);
          break;
        case 'size':
          displayValue = `${rows.length} rows`;
          break;
        case 'custom':
          displayValue = formatNum(customVal, 0);
          break;
        default:
          displayValue = formatNum(sum, 0);
      }

      map[col.field] = {
        field: col.field,
        label: col.label,
        currency: col.currency,
        displayValue,
        customLabel,
      };
    });

    return map;
  }, [targetCols, rows, activeType, customAggregator]);

  const handleSelectType = useCallback((type) => {
    if (typeof onTypeChange === 'function') {
      onTypeChange(type);
    } else {
      setInternalActiveType(type);
    }
  }, [onTypeChange]);

  const activeFunctionDef =
    AGGREGATE_FUNCTIONS.find((f) => f.value === activeType) || AGGREGATE_FUNCTIONS[0];

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: isDark ? blcColors.darkCard : '#ffffff',
        fontFamily: typographyTokens.fontSans,
      }}
    >
      {/* ── 1. Column-Aligned Summary Row ──────────────────────────────────── */}
      {/* Renders cells mapped 1:1 with the columns above it */}
      <Box
        sx={{
          width: '100%',
          overflow: 'hidden',
          borderTop: `2px solid ${isDark ? blcColors.darkBorder : '#cbd5e1'}`,
          borderBottom: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
          bgcolor: isDark ? '#0f172a' : '#f8fafc',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            height: 44,
            width: 'max-content',
            minWidth: '100%',
            transform: scrollLeft > 0 ? `translateX(-${scrollLeft}px)` : 'none',
            transition: 'transform 0.05s ease-out',
          }}
        >
          {activeGridCols.map((col, idx) => {
            const isNumeric = Boolean(metricsMap[col.field]);
            const isFirstCol = idx === 0;
            const metric = metricsMap[col.field];

            // Resolve exact column cell width from DataGrid computed width or flex
            const cellWidth = col.computedWidth;
            const colWidthStyles = cellWidth
              ? {
                  width: `${cellWidth}px`,
                  minWidth: `${cellWidth}px`,
                  maxWidth: `${cellWidth}px`,
                }
              : {
                  flex: col.flex || (col.width ? `0 0 ${col.width}px` : 1),
                  width: col.width ? `${col.width}px` : undefined,
                  minWidth: col.minWidth ? `${col.minWidth}px` : 80,
                };

            // Align content matching column's align/headerAlign
            const justify =
              col.align === 'center'
                ? 'center'
                : col.align === 'right'
                ? 'flex-end'
                : 'flex-start';

            return (
              <Box
                key={col.field || idx}
                sx={{
                  ...colWidthStyles,
                  px: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: justify,
                  boxSizing: 'border-box',
                  borderRight: `1px solid ${
                    isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'
                  }`,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {isFirstCol ? (
                  <Chip
                    label={
                      activeType === 'custom'
                        ? targetCols[0]
                          ? metricsMap[targetCols[0].field]?.customLabel || 'Median'
                          : 'Custom'
                        : activeFunctionDef.fullLabel
                    }
                    size="small"
                    sx={{
                      height: '22px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      fontFamily: typographyTokens.fontMono,
                      bgcolor: isDark
                        ? 'rgba(59, 130, 246, 0.22)'
                        : 'rgba(37, 99, 235, 0.1)',
                      color: isDark ? '#93c5fd' : '#1d4ed8',
                      border: `1px solid ${
                        isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(37, 99, 235, 0.25)'
                      }`,
                    }}
                  />
                ) : isNumeric ? (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: isDark ? '#38bdf8' : '#0284c7',
                      fontFamily: typographyTokens.fontMono,
                    }}
                  >
                    {metric.displayValue}
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.82rem',
                      color: isDark ? '#475569' : '#94a3b8',
                      userSelect: 'none',
                    }}
                  >
                    —
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── 2. Compact Function Buttons Bar ─────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 0.85,
          bgcolor: isDark ? '#111827' : '#ffffff',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        {/* Left: Buttons for Sum, Avg, Min, Max, Size, Custom */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {AGGREGATE_FUNCTIONS.map((fn) => {
            const isSelected = activeType === fn.value;
            return (
              <Box
                key={fn.value}
                component="button"
                onClick={() => handleSelectType(fn.value)}
                sx={{
                  px: 1.25,
                  py: 0.35,
                  borderRadius: '6px',
                  border: `1px solid ${
                    isSelected
                      ? isDark
                        ? '#3b82f6'
                        : '#2563eb'
                      : isDark
                      ? 'rgba(255,255,255,0.1)'
                      : '#cbd5e1'
                  }`,
                  bgcolor: isSelected
                    ? isDark
                      ? 'rgba(59, 130, 246, 0.22)'
                      : 'rgba(37, 99, 235, 0.1)'
                    : isDark
                    ? 'rgba(255,255,255,0.03)'
                    : '#ffffff',
                  color: isSelected
                    ? isDark
                      ? '#60a5fa'
                      : '#1d4ed8'
                    : isDark
                    ? '#94a3b8'
                    : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                  '&:hover': {
                    bgcolor: isSelected
                      ? isDark
                        ? 'rgba(59, 130, 246, 0.3)'
                        : 'rgba(37, 99, 235, 0.16)'
                      : isDark
                      ? 'rgba(255,255,255,0.08)'
                      : '#f1f5f9',
                  },
                }}
              >
                {fn.label}
              </Box>
            );
          })}
        </Box>

        {/* Right: Informative subtle hint */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: 500,
            }}
          >
            Aggregating {rows.length} records aligned below numerical columns
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

DataGridAggregationFooter.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object),
  selectedRowIndices: PropTypes.arrayOf(PropTypes.number),
  numericField: PropTypes.string,
  numericColumns: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  ),
  fieldLabel: PropTypes.string,
  isDark: PropTypes.bool,
  activeType: PropTypes.oneOf(['sum', 'avg', 'min', 'max', 'size', 'custom']),
  onTypeChange: PropTypes.func,
  customAggregator: PropTypes.func,
  currency: PropTypes.bool,
};

export default DataGridAggregationFooter;
