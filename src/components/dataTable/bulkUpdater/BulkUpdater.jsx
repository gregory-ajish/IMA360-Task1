// BulkUpdater.jsx
// ============================================================================
// PURPOSE:
//   An optimized, all-in-one packed Bulk Updater component for any data table.
//   Handles:
//     1. Top-right toolbar trigger button with tooltip & hover effects
//     2. Internal modal open/close lifecycle (or controlled open/onClose)
//     3. Column selection chips & dynamic inputs for all datatypes (dropdown,
//        text, numeric, date, multiselect)
//     4. Validation, reset, and toast feedback
//     5. Automatic Handsontable synchronization if hotRef is provided
//     6. Parent onApply(updates) callback
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { toast } from 'react-toastify';
import { BulkUpdateIcon } from '../../../icons';

import { blcColors } from '../../../theme';
import { AppDialog } from '../../common/AppDialog';
import { AppButton } from '../../common/AppButton';

// Default options for standard customer / ledger columns
export const PLAN_TIERS = ['Enterprise', 'Growth', 'Scale', 'Starter', 'Pro'];
export const ENGAGEMENT_CHANNELS = [
  'Email',
  'In-App',
  'SMS',
  'Push Notifications',
  'Phone Support',
  'Slack Community',
];

export const DEFAULT_COLUMNS = [
  { key: 'planTier', label: 'Plan Tier', type: 'dropdown', options: PLAN_TIERS, index: 0 },
  { key: 'companyName', label: 'Company Name', type: 'text', index: 1 },
  { key: 'annualArr', label: 'Annual ARR ($)', type: 'numeric', index: 2 },
  { key: 'joinDate', label: 'Join Date', type: 'date', index: 3 },
  { key: 'channels', label: 'Channels', type: 'multiselect', options: ENGAGEMENT_CHANNELS, index: 4 },
];

/**
 * Normalizes columns from various formats (custom objects or Handsontable col defs)
 * into a consistent structure for the bulk updater.
 */
export const normalizeColumns = (rawCols = []) => {
  if (!rawCols || rawCols.length === 0) return DEFAULT_COLUMNS;
  return rawCols.map((col, idx) => {
    const key =
      col.key ??
      (typeof col.data === 'number' ? `col_${col.data}` : col.data) ??
      `col_${idx}`;
    const label = col.label ?? col.title ?? col.header ?? `Column ${idx + 1}`;
    let type = col.type || 'text';
    if (type === 'number') type = 'numeric';
    const options = col.options ?? col.source ?? [];
    const index =
      typeof col.index === 'number'
        ? col.index
        : typeof col.data === 'number'
        ? col.data
        : idx;

    return {
      key,
      label,
      type,
      options,
      index,
      defaultValue: col.defaultValue,
    };
  });
};

/**
 * BulkUpdater Component
 *
 * Can be used as:
 * 1. An all-in-one toolbar button + popup (default when open is not passed)
 * 2. A controlled modal (when open & onClose are provided)
 */
export const BulkUpdater = ({
  // Controlled or uncontrolled modal state
  open: controlledOpen,
  onClose: controlledOnClose,
  showTrigger = true,
  triggerButton,

  // Table integration
  columns = DEFAULT_COLUMNS,
  hotRef,
  onApply,

  // Theme & Styling
  isDark = false,
  title = 'Bulk Update Records',
  subtitle = 'Select one or more columns and enter the values to update across all records.',
  modalMaxWidth = 'sm',
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === 'boolean';
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpen = () => {
    if (!isControlled) setInternalOpen(true);
  };

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  const normalizedColumns = useMemo(() => normalizeColumns(columns), [columns]);

  // Working state for selected columns and input values
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [bulkValues, setBulkValues] = useState({});

  // Initialize/sync working values when modal opens
  useEffect(() => {
    if (isOpen && normalizedColumns.length > 0) {
      setSelectedColumns((prev) =>
        prev.length > 0
          ? prev.filter((k) => normalizedColumns.some((c) => c.key === k))
          : [normalizedColumns[0].key]
      );
      setBulkValues((prev) => {
        const defaults = {};
        normalizedColumns.forEach((c) => {
          if (c.type === 'dropdown') defaults[c.key] = c.options?.[0] || '';
          else if (c.type === 'multiselect') defaults[c.key] = c.options ? [c.options[0]] : [];
          else if (c.type === 'date') defaults[c.key] = new Date().toISOString().split('T')[0];
          else if (c.type === 'numeric') defaults[c.key] = c.defaultValue ?? 0;
          else defaults[c.key] = c.defaultValue ?? '';
        });
        return { ...defaults, ...prev };
      });
    }
  }, [isOpen, normalizedColumns]);

  // Toggle selection of a column chip
  const handleToggleColumn = (colKey) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey]
    );
  };

  // Update a single value
  const handleUpdateValue = (colKey, val) => {
    setBulkValues((prev) => ({
      ...prev,
      [colKey]: val,
    }));
  };

  // Reset values
  const handleReset = () => {
    if (normalizedColumns.length > 0) {
      setSelectedColumns([normalizedColumns[0].key]);
      const defaults = {};
      normalizedColumns.forEach((c) => {
        if (c.type === 'dropdown') defaults[c.key] = c.options?.[0] || '';
        else if (c.type === 'multiselect') defaults[c.key] = c.options ? [c.options[0]] : [];
        else if (c.type === 'date') defaults[c.key] = new Date().toISOString().split('T')[0];
        else if (c.type === 'numeric') defaults[c.key] = c.defaultValue ?? 0;
        else defaults[c.key] = c.defaultValue ?? '';
      });
      setBulkValues(defaults);
    }
  };

  // Submit / Apply updates
  const handleApply = () => {
    if (selectedColumns.length === 0) {
      toast.warning('Please select at least one column to update.');
      return;
    }

    // Validation
    for (const colKey of selectedColumns) {
      const colDef = normalizedColumns.find((c) => c.key === colKey);
      const val = bulkValues[colKey];
      if (colDef?.type === 'text' && (!val || !String(val).trim())) {
        toast.warning(`Please enter a valid value for ${colDef.label}.`);
        return;
      }
      if (colDef?.type === 'date' && !val) {
        toast.warning(`Please select a valid date for ${colDef.label}.`);
        return;
      }
      if (colDef?.type === 'multiselect' && (!Array.isArray(val) || val.length === 0)) {
        toast.warning(`Please select at least one option for ${colDef.label}.`);
        return;
      }
    }

    const updates = selectedColumns.map((colKey) => {
      const colDef = normalizedColumns.find((c) => c.key === colKey);
      let val = bulkValues[colKey];
      if (colDef?.type === 'numeric') val = Number(val) || 0;
      else if (colDef?.type === 'text') val = String(val).trim();
      return {
        key: colKey,
        colIndex: colDef?.index ?? 0,
        val,
        label: colDef?.label || colKey,
      };
    });

    // 1. Auto-sync with Handsontable instance if hotRef is provided (skipping empty spare rows)
    const hot = hotRef?.current?.hotInstance;
    if (hot) {
      const rowCount = hot.countRows();
      const changes = [];

      // Helper to identify empty spare rows so they are never touched
      const isRowEmpty = (rowIdx) => {
        if (typeof hot.isEmptyRow === 'function' && hot.isEmptyRow(rowIdx)) {
          return true;
        }
        const rowData = hot.getDataAtRow(rowIdx);
        if (!rowData || !Array.isArray(rowData)) return true;
        return rowData.every(
          (c) => c === null || c === undefined || String(c).trim() === ''
        );
      };

      for (let r = 0; r < rowCount; r++) {
        if (isRowEmpty(r)) continue; // Never update blank spare rows!
        updates.forEach(({ colIndex, val }) => {
          changes.push([r, colIndex, val]);
        });
      }
      if (changes.length > 0) {
        hot.setDataAtCell(changes, 'bulk_update');
      }
    }

    // 2. Notify parent callback
    if (onApply) {
      onApply(updates);
    } else {
      toast.success(
        `Bulk updated ${updates.map((u) => u.label).join(' & ')} across all records!`
      );
    }

    handleClose();
  };

  return (
    <>
      {/* ── Built-in Trigger Button for Table Toolbars ── */}
      {showTrigger && !isControlled && (
        triggerButton ? (
          <span onClick={handleOpen}>{triggerButton}</span>
        ) : (
          <Tooltip title="Bulk Update" placement="top" arrow>
            <IconButton
              aria-label="Bulk Update"
              onClick={handleOpen}
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
              <BulkUpdateIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      )}

      {/* ── Modal Dialog ── */}
      <AppDialog
        open={isOpen}
        onClose={handleClose}
        title={title}
        subtitle={subtitle}
        icon={<BulkUpdateIcon fontSize="small" />}
        maxWidth={modalMaxWidth}
        isDark={isDark}
        actions={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <AppButton variant="ghost" size="small" onClick={handleReset}>
              Reset
            </AppButton>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <AppButton variant="ghost" onClick={handleClose}>
                Cancel
              </AppButton>
              <AppButton
                variant="primary"
                disabled={selectedColumns.length === 0}
                onClick={handleApply}
              >
                Apply Bulk Update ({selectedColumns.length})
              </AppButton>
            </Box>
          </Box>
        }
      >
        <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Step 1: Column Chips Selection */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 1,
              }}
            >
              1. Select Column(s) to Update:
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.25,
                alignItems: 'center',
              }}
            >
              {normalizedColumns.map((col) => {
                const isSelected = selectedColumns.includes(col.key);
                return (
                  <Box
                    key={col.key}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => handleToggleColumn(col.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleColumn(col.key);
                      }
                    }}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 2.5,
                      py: 1,
                      borderRadius: '24px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: isSelected
                        ? '#2563eb'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : '#f1f5f9',
                      color: isSelected
                        ? '#ffffff'
                        : isDark
                        ? '#e2e8f0'
                        : '#1e293b',
                      border: `1px solid ${
                        isSelected
                          ? '#2563eb'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : '#e2e8f0'
                      }`,
                      boxShadow: isSelected
                        ? '0 4px 14px rgba(37, 99, 235, 0.35)'
                        : 'none',
                      '&:hover': {
                        bgcolor: isSelected
                          ? '#1d4ed8'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.14)'
                          : '#e2e8f0',
                        transform: 'translateY(-1px)',
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        color: 'inherit',
                      }}
                    >
                      {col.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Step 2: Dynamic Input Fields for Selected Columns */}
          {selectedColumns.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 2,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                }}
              >
                2. Enter New Values for Selected Column(s):
              </Typography>

              {selectedColumns.map((colKey) => {
                const colDef = normalizedColumns.find((c) => c.key === colKey);
                if (!colDef) return null;

                // 1. Dropdown Select
                if (colDef.type === 'dropdown') {
                  return (
                    <FormControl fullWidth size="small" key={colDef.key}>
                      <InputLabel id={`bulk-${colDef.key}-label`}>{colDef.label}</InputLabel>
                      <Select
                        labelId={`bulk-${colDef.key}-label`}
                        value={bulkValues[colDef.key] ?? ''}
                        label={colDef.label}
                        onChange={(e) => handleUpdateValue(colDef.key, e.target.value)}
                      >
                        {(colDef.options || []).map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                }

                // 2. Text Input
                if (colDef.type === 'text') {
                  return (
                    <TextField
                      key={colDef.key}
                      fullWidth
                      size="small"
                      label={colDef.label}
                      placeholder={`Enter updated ${colDef.label.toLowerCase()}...`}
                      value={bulkValues[colDef.key] ?? ''}
                      onChange={(e) => handleUpdateValue(colDef.key, e.target.value)}
                    />
                  );
                }

                // 3. Numeric Input
                if (colDef.type === 'numeric') {
                  return (
                    <TextField
                      key={colDef.key}
                      fullWidth
                      size="small"
                      type="number"
                      label={colDef.label}
                      placeholder="e.g. 50000"
                      value={bulkValues[colDef.key] ?? ''}
                      onChange={(e) => handleUpdateValue(colDef.key, e.target.value)}
                    />
                  );
                }

                // 4. Date Picker
                if (colDef.type === 'date') {
                  return (
                    <TextField
                      key={colDef.key}
                      fullWidth
                      size="small"
                      type="date"
                      label={colDef.label}
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={bulkValues[colDef.key] ?? ''}
                      onChange={(e) => handleUpdateValue(colDef.key, e.target.value)}
                    />
                  );
                }

                // 5. Multiselect Dropdown with Chips & Checkboxes
                if (colDef.type === 'multiselect') {
                  const currentVal = Array.isArray(bulkValues[colDef.key])
                    ? bulkValues[colDef.key]
                    : [];

                  return (
                    <FormControl fullWidth size="small" key={colDef.key}>
                      <InputLabel id={`bulk-${colDef.key}-label`}>
                        {colDef.label} (Multiselect)
                      </InputLabel>
                      <Select
                        labelId={`bulk-${colDef.key}-label`}
                        multiple
                        value={currentVal}
                        onChange={(e) => {
                          const val =
                            typeof e.target.value === 'string'
                              ? e.target.value.split(',')
                              : e.target.value;
                          handleUpdateValue(colDef.key, val);
                        }}
                        input={<OutlinedInput label={`${colDef.label} (Multiselect)`} />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((val) => (
                              <Chip key={val} label={val} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {(colDef.options || []).map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            <Checkbox checked={currentVal.includes(opt)} size="small" />
                            <ListItemText primary={opt} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                }

                return null;
              })}
            </Box>
          )}
        </Box>
      </AppDialog>
    </>
  );
};

// Modal-only mode alias (controlled mode without internal trigger)
export const BulkUpdaterModal = (props) => (
  <BulkUpdater {...props} showTrigger={false} />
);

export const BulkUpdateModal = BulkUpdaterModal;

export default BulkUpdater;
