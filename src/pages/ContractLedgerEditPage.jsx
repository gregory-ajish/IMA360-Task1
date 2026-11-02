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

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Grid,
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

// Handsontable registry and core styling
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// Theme tokens & Context
import { blcColors, typographyTokens } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { PageHeader } from '../components/common/PageHeader';
import { Navbar } from '../components/dashboard/Navbar';
import { AppButton } from '../components/common/AppButton';
import { DataTable } from '../components/dataTable';

// Data tokens & shared storage key
import {
  CONTRACT_LEDGER_STORAGE_KEY,
  INITIAL_CONTRACT_LEDGER_DATA,
  PLAN_TIERS,
} from './ContractLedgerPage';

// Register all Handsontable modules
registerAllModules();

// ─── Details Card Handsontable Column Definitions (7 Columns from Mockup) ───
const DETAILS_COLUMNS = [
  {
    data: 0,
    title: 'ID',
    type: 'numeric',
    width: 80,
    className: 'htCenter htMiddle',
  },
  {
    data: 1,
    title: 'Name',
    type: 'text',
    width: 200,
    className: 'htMiddle',
  },
  {
    data: 2,
    title: 'Category',
    type: 'dropdown',
    source: ['Category A', 'Category B', 'Category C', 'Zens A', 'Zens B', 'Zens C'],
    width: 140,
    className: 'htCenter htMiddle',
  },
  {
    data: 3,
    title: 'Status',
    type: 'dropdown',
    source: ['Active', 'Economic', 'Recided', 'Pending'],
    width: 130,
    className: 'htCenter htMiddle',
  },
  {
    data: 4,
    title: 'Date Modified',
    type: 'date',
    dateFormat: 'YYYY-MM-DD',
    correctFormat: true,
    width: 140,
    className: 'htCenter htMiddle',
  },
  {
    data: 5,
    title: 'Assigned To',
    type: 'text',
    width: 160,
    className: 'htCenter htMiddle',
  },
  {
    data: 6,
    title: 'Priority',
    type: 'dropdown',
    source: ['High', 'Medium', 'Low'],
    width: 120,
    className: 'htCenter htMiddle',
  },
];

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

  // Synchronize master inputs if row data changes
  useEffect(() => {
    if (currentRow && currentRow.length >= 4) {
      setPlanTier(currentRow[0] || 'Enterprise');
      setCompanyName(currentRow[1] || '');
      setAnnualArr(currentRow[2] ?? 0);
      setJoinDate(currentRow[3] || '2024-01-01');
    }
  }, [rowIndex, dataset]);

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
              mb: headerOpen ? 1 : 0,
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

            {/* Four inputs in ONE row stretching completely across horizontal space */}
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
              <Box sx={{ width: { xs: '100%', md: '180px' }, flexShrink: 0 }}>
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
              <Box sx={{ width: { xs: '100%', md: '210px' }, flexShrink: 0 }}>
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
              <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
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
              <Box sx={{ width: { xs: '100%', md: '220px' }, flexShrink: 0 }}>
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
              mb: detailsOpen ? 1 : 0,
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

            {/* Details Handsontable with mockup columns, spare row & upward compaction */}
            <DataTable
              ref={detailsHotRef}
              dataset={detailsData}
              totalRows={detailsData.length}
              columns={DETAILS_COLUMNS}
              colHeaders={DETAILS_COL_HEADERS}
              rowHeaders={false}
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
