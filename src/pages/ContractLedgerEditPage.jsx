// ContractLedgerEditPage.jsx
// ============================================================================
// PURPOSE:
//   Dedicated edit page for an individual Contract Ledger record at /contract-ledger/edit/:rowId.
//   Layout structure strictly matches reference wireframe:
//     1. Header Card  — Collapsible card with 4 inputs in one row:
//                       Type (dropdown), Quantity (number), Description (text), Date (date).
//     2. Details Card — Collapsible card with Handsontable of 7 columns (ID, Name,
//                       Category, Status, Date Modified, Assigned To, Priority) + auto spare row.
//     3. Action Bar   — Save and Cancel buttons placed OUTSIDE the cards at bottom-right.
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Material-UI layout and UI components
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';

// Centralized App Icons
import {
  SaveIcon,
  ResetIcon,
  KeyboardArrowDownIcon,
} from '../icons';

// Toast notifications
import { toast } from 'react-toastify';


// Theme tokens & Context
import { blcColors, typographyTokens } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { PageHeader } from '../components/common/PageHeader';
import { Navbar } from '../components/dashboard/Navbar';
import { AppButton } from '../components/common/AppButton';
import { DataTable, DataTableToolbar } from '../components/dataTable';

// Data tokens & shared storage key
import {
  CONTRACT_LEDGER_STORAGE_KEY,
  INITIAL_CONTRACT_LEDGER_DATA,
  PLAN_TIERS,
} from './ContractLedgerPage';


// ─── Details Card Handsontable Column Definitions (7 Columns from Mockup) ───
export const DEFAULT_DETAILS_COLUMNS = [
  {
    id: 'id',
    label: 'ID',
    dataIndex: 0,
    type: 'numeric',
    width: 80,
    className: 'htCenter htMiddle',
  },
  {
    id: 'name',
    label: 'Name',
    dataIndex: 1,
    type: 'text',
    width: 200,
    className: 'htMiddle',
  },
  {
    id: 'category',
    label: 'Category',
    dataIndex: 2,
    type: 'dropdown',
    source: ['Category A', 'Category B', 'Category C', 'Zens A', 'Zens B', 'Zens C'],
    width: 140,
    className: 'htCenter htMiddle',
  },
  {
    id: 'status',
    label: 'Status',
    dataIndex: 3,
    type: 'dropdown',
    source: ['Active', 'Economic', 'Recided', 'Pending'],
    width: 130,
    className: 'htCenter htMiddle',
  },
  {
    id: 'dateModified',
    label: 'Date Modified',
    dataIndex: 4,
    type: 'date',
    dateFormat: 'YYYY-MM-DD',
    correctFormat: true,
    width: 140,
    className: 'htCenter htMiddle',
  },
  {
    id: 'assignedTo',
    label: 'Assigned To',
    dataIndex: 5,
    type: 'text',
    width: 160,
    className: 'htCenter htMiddle',
  },
  {
    id: 'priority',
    label: 'Priority',
    dataIndex: 6,
    type: 'dropdown',
    source: ['High', 'Medium', 'Low'],
    width: 120,
    className: 'htCenter htMiddle',
  },
];

export const DETAILS_COLUMNS = DEFAULT_DETAILS_COLUMNS;

const DETAILS_COL_HEADERS = [
  'ID',
  'Name',
  'Category',
  'Status',
  'Date Modified',
  'Assigned To',
  'Priority',
];

// ─── Initial Details Data (matching mockup rows + 5 empty spare rows) ───────
const INITIAL_FILLED_ROWS = [
  [31, 'Sample Beaker', 'Category A', 'Active', '2026-10-21', 'John Doe', 'High'],
  [32, 'Mark Borrnitson', 'Zens B', 'Economic', '2026-10-20', 'Jane Smith', 'Medium'],
  [33, 'Einny iFachor', 'Zens C', 'Economic', '2026-10-19', 'Bob Johnson', 'Low'],
  [34, 'Mark Gsipa', 'Category A', 'Recided', '2026-10-18', 'Alice White', 'Medium'],
  [35, 'Sample Beaker', 'Category B', 'Recided', '2026-10-17', 'John Doe', 'High'],
  [36, 'Sample Beaker', 'Category A', 'Recided', '2026-10-17', 'John Doe', 'High'],
  [37, 'Test Equipment', 'Category C', 'Pending', '2026-10-16', 'Sarah Connor', 'Low'],
  [38, 'Calibration Kit', 'Zens A', 'Active', '2026-10-15', 'Bruce Wayne', 'High'],
];

const SPARE_ROWS_COUNT = 5;
const createSpareRows = (count = SPARE_ROWS_COUNT) =>
  Array.from({ length: count }, () => [null, null, null, null, null, null, null]);

const INITIAL_DETAILS_ROWS = [
  ...INITIAL_FILLED_ROWS,
  ...createSpareRows(SPARE_ROWS_COUNT),
];

/**
 * ContractLedgerEditPage Component
 */
export const ContractLedgerEditPage = ({ mode, toggleMode }) => {
  const { rowId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout, isAdmin } = useAuth();
  const isDark = mode === 'dark';

  const detailsHotRef = useRef(null);

  // Collapse states for Header and Details cards
  const [headerOpen, setHeaderOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);

  // Calculate 0-based index from rowId (handles both 1-based and 0-based URL params safely)
  const parsedId = parseInt(rowId, 10);
  const rowIndex = isNaN(parsedId) ? 0 : Math.max(0, parsedId - 1);

  // Load dataset from localStorage (or fallback to INITIAL_CONTRACT_LEDGER_DATA)
  const [dataset, setDataset] = useState(() => {
    try {
      const stored = localStorage.getItem(CONTRACT_LEDGER_STORAGE_KEY) || localStorage.getItem('ai_copilot_dataset');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse contract ledger dataset:', e);
    }
    return INITIAL_CONTRACT_LEDGER_DATA;
  });

  // Current master row data
  const currentRow = dataset[rowIndex] || INITIAL_CONTRACT_LEDGER_DATA[0] || [];

  // ── Header Card 4 Inputs (bound to the 4 ledger columns) ───────────────────
  // 1. Plan Tier (Dropdown)
  const [planTier, setPlanTier] = useState(currentRow[0] || 'Enterprise');
  // 2. Annual ARR ($) (Number)
  const [annualArr, setAnnualArr] = useState(currentRow[2] ?? 0);
  // 3. Company Name (Text)
  const [companyName, setCompanyName] = useState(currentRow[1] || '');
  // 4. Join Date (Datepicker)
  const [joinDate, setJoinDate] = useState(currentRow[3] || '2024-01-01');

  // Ref to prevent recursive change loops during compaction
  const isCompactingRef = useRef(false);

  // afterChange hook: Upward compaction when spare rows have gaps, keeping spare row(s) at bottom
  const handleDetailsAfterChange = useCallback((changes, source) => {
    if (!changes || changes.length === 0) return;
    if (source === 'loadData' || source === 'calc' || source === 'compact') return;
    if (isCompactingRef.current) return;

    const hot = detailsHotRef.current?.hotInstance;
    if (!hot) return;

    const totalRows = hot.countRows();

    // Check if row is completely empty across all 7 columns
    const isRowBlank = (r) => {
      for (let c = 0; c < 7; c++) {
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
        const rowData = [0, 1, 2, 3, 4, 5, 6].map((c) => hot.getDataAtCell(r, c));

        // Auto-assign sequential ID if omitted
        if (rowData[0] === null || rowData[0] === undefined || String(rowData[0]).trim() === '') {
          const prevId = filledRows.length > 0 ? (Number(filledRows[filledRows.length - 1].data[0]) || 30) : 30;
          rowData[0] = prevId + 1;
        }

        filledRows.push({ originalRow: r, data: rowData });
      }
    }

    // Always maintain exactly 5 empty spare rows at the bottom
    const desiredTotalRows = filledRows.length + SPARE_ROWS_COUNT;
    const needsRowAdjustment = totalRows !== desiredTotalRows;

    if (hasGaps || needsRowAdjustment) {
      isCompactingRef.current = true;
      try {
        let currentCount = hot.countRows();
        if (currentCount < desiredTotalRows) {
          hot.alter('insert_row_below', currentCount - 1, desiredTotalRows - currentCount);
        } else if (currentCount > desiredTotalRows) {
          hot.alter('remove_row', desiredTotalRows, currentCount - desiredTotalRows);
        }

        currentCount = hot.countRows();

        // Shift non-empty rows upward to eliminate any empty row gaps
        const compactionChanges = [];
        for (let r = 0; r < currentCount; r++) {
          const targetRowData = r < filledRows.length
            ? filledRows[r].data
            : [null, null, null, null, null, null, null];
          for (let c = 0; c < 7; c++) {
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
  }, []);

  // Details card Handsontable dataset (loaded from localStorage or defaults)
  const [detailsData, setDetailsData] = useState(() => {
    try {
      const stored = localStorage.getItem(`contract_details_${rowIndex + 1}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...createSpareRows(SPARE_ROWS_COUNT)];
        }
      }
    } catch (e) {
      console.warn('Failed to parse details rows:', e);
    }
    return INITIAL_DETAILS_ROWS;
  });

  // Reusable Delete ref for Details table
  const detailsDeleteRef = useRef(null);

  // Visible & hidden columns state for details table
  const [visibleDetailsColumns, setVisibleDetailsColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('contract_edit_details_visible_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved visible details columns:', e);
    }
    return DEFAULT_DETAILS_COLUMNS;
  });

  const [hiddenDetailsColumns, setHiddenDetailsColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('contract_edit_details_hidden_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved hidden details columns:', e);
    }
    return [];
  });

  const detailsColumns = useMemo(() => {
    return visibleDetailsColumns.map((col) => {
      const colDef = {
        data: col.dataIndex,
        title: col.label,
        type: col.type || 'text',
        width: col.width,
        className: col.className || 'htCenter htMiddle',
      };
      if (col.source) colDef.source = col.source;
      if (col.dateFormat) colDef.dateFormat = col.dateFormat;
      if (col.correctFormat !== undefined) colDef.correctFormat = col.correctFormat;
      return colDef;
    });
  }, [visibleDetailsColumns]);

  const detailsColHeaders = useMemo(() => {
    return visibleDetailsColumns.map((col) => col.label);
  }, [visibleDetailsColumns]);

  const handleDetailsColumnsChange = (newVisible, newHidden) => {
    setVisibleDetailsColumns(newVisible);
    setHiddenDetailsColumns(newHidden);
    try {
      localStorage.setItem('contract_edit_details_visible_columns', JSON.stringify(newVisible));
      localStorage.setItem('contract_edit_details_hidden_columns', JSON.stringify(newHidden));
    } catch (e) {
      console.error('Error saving details columns to localStorage:', e);
    }
  };

  const handleDetailsResetColumns = () => {
    setVisibleDetailsColumns(DEFAULT_DETAILS_COLUMNS);
    setHiddenDetailsColumns([]);
    try {
      localStorage.removeItem('contract_edit_details_visible_columns');
      localStorage.removeItem('contract_edit_details_hidden_columns');
    } catch (e) {
      console.error('Error resetting details columns:', e);
    }
    toast.info('Details columns reset to default view.');
  };

  const handleDetailsAfterSelectionEnd = useCallback(() => {
    detailsDeleteRef.current?.handleAfterSelectionEnd?.();
  }, []);

  const handleDetailsDeleteRows = (indicesToDelete) => {
    const indicesSet = new Set(indicesToDelete);
    setDetailsData((prev) => prev.filter((_, i) => !indicesSet.has(i)));
  };

  const handleDetailsApplyBulkUpdate = (updates) => {
    if (!updates || updates.length === 0) return;
    setDetailsData((prev) =>
      prev.map((row) => {
        const isBlank = !row || row.every((c) => c === null || c === undefined || String(c).trim() === '');
        if (isBlank) return row;
        const newRow = [...row];
        updates.forEach(({ colIndex, val }) => {
          newRow[colIndex] = val;
        });
        return newRow;
      })
    );
    toast.success(
      `Bulk updated ${updates.map((u) => u.label).join(' & ')} across details records!`
    );
  };

  // Synchronize master inputs if row data changes
  useEffect(() => {
    if (currentRow && currentRow.length >= 4) {
      setPlanTier(currentRow[0] || 'Enterprise');
      setCompanyName(currentRow[1] || '');
      setAnnualArr(currentRow[2] ?? 0);
      setJoinDate(currentRow[3] || '2024-01-01');
    }
  }, [currentRow]);

  // Save handler — updates master row and details table in dataset and localStorage
  const handleSave = () => {
    const updatedRow = [
      planTier,
      companyName.trim() || 'Untitled',
      Number(annualArr) || 0,
      joinDate,
    ];

    const nextDataset = [...dataset];
    nextDataset[rowIndex] = updatedRow;

    try {
      localStorage.setItem(CONTRACT_LEDGER_STORAGE_KEY, JSON.stringify(nextDataset));
      setDataset(nextDataset);

      // Save details table non-blank rows
      const hot = detailsHotRef.current?.hotInstance;
      if (hot) {
        const rawRows = hot.getData();
        const nonBlankRows = rawRows.filter((r) =>
          r && r.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );
        localStorage.setItem(`contract_details_${rowIndex + 1}`, JSON.stringify(nonBlankRows));
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    toast.success(`Contract #${rowIndex + 1} updated successfully.`);
    navigate('/contract-ledger');
  };

  // Cancel handler — exits back to Contract Ledger
  const handleCancel = () => {
    navigate('/contract-ledger');
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: isDark ? blcColors.darkBg : blcColors.cream,
        pb: 4,
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* ── Sticky Top Navbar ── */}
      <Navbar
        mode={mode}
        toggleMode={toggleMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        onExternalLinkClick={() => {}}
      />

      {/* ── Main Container (Full Width) ── */}
      <Container maxWidth={false} sx={{ mt: 3, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Top Breadcrumb Navigation */}
        <PageHeader
          breadcrumbItems={[
            { label: 'Dashboard', to: '/home' },
            { label: 'Customer Data', to: '/contract-ledger' },
            { label: 'Edit' },
          ]}
          breadcrumb="Edit"
          backTo="/contract-ledger"
          backTooltip="Back to Contract Ledger"
          parentLabel="Customer Data"
          isDark={isDark}
        />

        {/* ── STACKED CARD 1: HEADER CARD ── */}
        <Paper
          elevation={0}
          sx={{
            pt: headerOpen ? 1.25 : 1,
            pb: headerOpen ? 2 : 1,
            px: 3,
            mb: 3,
            borderRadius: '12px',
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
            boxShadow: isDark
              ? '0 12px 48px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(30,58,138,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Card Title & Collapse Icon */}
          <Box
            onClick={() => setHeaderOpen(!headerOpen)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
              mb: headerOpen ? 0.25 : 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: { xs: 1.5, sm: 3 },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: typographyTokens.fontMono,
                  fontWeight: typographyTokens.weightBold,
                  color: isDark ? '#f1f5f9' : blcColors.navyAccent,
                  letterSpacing: '0.01em',
                  fontSize: '1.15rem',
                  lineHeight: 1.2,
                }}
              >
                Header
              </Typography>

              {/* Collapsed summary inline list matching the mockup */}
              {!headerOpen && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    columnGap: { xs: 2, sm: 3.5 },
                    rowGap: 0.5,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      color: isDark ? '#94a3b8' : '#8892a4',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                    }}
                  >
                    Name: <Box component="span" sx={{ color: isDark ? '#cbd5e1' : '#64748b', fontWeight: 500 }}>{companyName || '—'}</Box>
                  </Typography>

                  <Typography
                    component="span"
                    sx={{
                      color: isDark ? '#94a3b8' : '#8892a4',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                    }}
                  >
                    Revenue: <Box component="span" sx={{ color: isDark ? '#cbd5e1' : '#64748b', fontWeight: 500 }}>{annualArr !== undefined && annualArr !== '' ? annualArr : '—'}</Box>
                  </Typography>

                  <Typography
                    component="span"
                    sx={{
                      color: isDark ? '#94a3b8' : '#8892a4',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                    }}
                  >
                    Plan: <Box component="span" sx={{ color: isDark ? '#cbd5e1' : '#64748b', fontWeight: 500 }}>{planTier || '—'}</Box>
                  </Typography>

                  <Typography
                    component="span"
                    sx={{
                      color: isDark ? '#94a3b8' : '#8892a4',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                    }}
                  >
                    Renews: <Box component="span" sx={{ color: isDark ? '#cbd5e1' : '#64748b', fontWeight: 500 }}>{joinDate || '—'}</Box>
                  </Typography>
                </Box>
              )}
            </Box>

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setHeaderOpen(!headerOpen);
              }}
              sx={{
                p: 0.25,
                color: isDark ? '#94a3b8' : '#64748b',
                transform: headerOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          </Box>

          <Collapse in={headerOpen}>
            <Divider sx={{ mb: 1.25, borderColor: isDark ? blcColors.darkBorder : '#f1f5f9' }} />

            {/* Four inputs in ONE row with equal width across horizontal space */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'flex-start',
                gap: 2.5,
                width: '100%',
              }}
            >
              {/* 1. Plan Tier (Dropdown) */}
              <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' }, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    color: isDark ? '#94a3b8' : '#334155',
                    mb: 0.75,
                  }}
                >
                  Plan Tier
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value)}
                    sx={{
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                      borderRadius: '8px',
                    }}
                  >
                    {PLAN_TIERS.map((tier) => (
                      <MenuItem key={tier} value={tier}>
                        {tier}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* 2. Annual ARR ($) (Number Input) */}
              <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' }, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    color: isDark ? '#94a3b8' : '#334155',
                    mb: 0.75,
                  }}
                >
                  Annual ARR ($)
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={annualArr}
                  onChange={(e) => setAnnualArr(e.target.value)}
                  placeholder="e.g. 128000"
                  sx={{
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                  }}
                />
              </Box>

              {/* 3. Company Name (Text Input) */}
              <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' }, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    color: isDark ? '#94a3b8' : '#334155',
                    mb: 0.75,
                  }}
                >
                  Company Name
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Company name here"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  sx={{
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                  }}
                />
              </Box>

              {/* 4. Join Date (Datepicker) */}
              <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' }, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    color: isDark ? '#94a3b8' : '#334155',
                    mb: 0.75,
                  }}
                >
                  Join Date
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  sx={{
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                  }}
                />
              </Box>
            </Box>
          </Collapse>
        </Paper>

        {/* ── STACKED CARD 2: DETAILS CARD ── */}
        <Paper
          elevation={0}
          sx={{
            pt: detailsOpen ? 1.25 : 1,
            pb: detailsOpen ? 2.5 : 1.75,
            px: 3,
            borderRadius: '12px',
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
            boxShadow: isDark
              ? '0 12px 48px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(30,58,138,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Card Title & Collapse Icon */}
          <Box
            onClick={() => setDetailsOpen(!detailsOpen)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
              mb: detailsOpen ? 0.25 : 0,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: typographyTokens.fontMono,
                fontWeight: typographyTokens.weightBold,
                color: isDark ? '#f1f5f9' : blcColors.navyAccent,
                letterSpacing: '0.01em',
                fontSize: '1.15rem',
              }}
            >
              Details
            </Typography>

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDetailsOpen(!detailsOpen);
              }}
              sx={{
                p: 0.25,
                color: isDark ? '#94a3b8' : '#64748b',
                transform: detailsOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          </Box>

          <Collapse in={detailsOpen}>
            <Divider sx={{ mb: 1.25, borderColor: isDark ? blcColors.darkBorder : '#f1f5f9' }} />

            {/* Table Header Controls (Bulk Updater, Delete, Save View, Saved Views, View Management) */}
            <DataTableToolbar
              hotRef={detailsHotRef}
              deleteRef={detailsDeleteRef}
              dataset={detailsData}
              onDelete={handleDetailsDeleteRows}
              itemLabel="detail row"
              columns={detailsColumns}
              onApplyBulkUpdate={handleDetailsApplyBulkUpdate}
              visibleColumns={visibleDetailsColumns}
              hiddenColumns={hiddenDetailsColumns}
              onColumnsChange={handleDetailsColumnsChange}
              onResetColumns={handleDetailsResetColumns}
              pageKey="contract_edit_details"
              isDark={isDark}
            />

            {/* Details Handsontable with mockup columns, spare row & upward compaction */}
            <DataTable
              ref={detailsHotRef}
              dataset={detailsData}
              totalRows={detailsData.length}
              columns={detailsColumns}
              colHeaders={detailsColHeaders}
              visibleColumnsList={visibleDetailsColumns}
              rowHeaders={true}
              selectionMode="multiple"
              outsideClickDeselects={false}
              height={320}
              width="100%"
              stretchH="all"
              minSpareRows={0}
              useWorker={false}
              manualColumnResize={true}
              manualRowResize={true}
              autoWrapRow={true}
              autoWrapCol={true}
              afterChange={handleDetailsAfterChange}
              afterSelectionEnd={handleDetailsAfterSelectionEnd}
              isDark={isDark}
              isAdmin={isAdmin}
              licenseKey="non-commercial-and-evaluation"
            />
          </Collapse>
        </Paper>

        {/* ── STICKY SAVE AND CANCEL BUTTONS (FLOATING WITHOUT SEPARATE FOOTER BAR) ── */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 24,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1.5,
            mt: 3,
            pb: 1,
            pointerEvents: 'none',
            '& > *': {
              pointerEvents: 'auto',
            },
          }}
        >
          <AppButton
            variant="primary"
            onClick={handleSave}
            startIcon={<SaveIcon />}
            sx={{
              px: 3.5,
              py: 1,
              borderRadius: '8px',
              bgcolor: blcColors.navyAccent,
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            Save
          </AppButton>
          <AppButton
            variant="ghost"
            onClick={handleCancel}
            startIcon={<ResetIcon />}
            sx={{
              px: 3,
              py: 1,
              borderRadius: '8px',
              border: `1px solid ${isDark ? blcColors.darkBorder : '#cbd5e1'}`,
              color: isDark ? '#e2e8f0' : '#475569',
              bgcolor: isDark ? blcColors.darkCard : '#ffffff',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f8fafc',
              },
            }}
          >
            Cancel
          </AppButton>
        </Box>
      </Container>
    </Box>
  );
};

export default ContractLedgerEditPage;
