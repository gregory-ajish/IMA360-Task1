// ContractLedgerPage.jsx
// ============================================================================
// PURPOSE:
//   Contract Ledger interactive table page powered by MUI X DataGrid.
//   Toolbar features:
//     1. Save View        — saves current column layout to Redux
//     2. Saved Views      — browse and apply saved views
//     3. View Management  — drag-and-drop column reordering and visibility toggle
//   Row actions:
//     - Edit:   navigates to dedicated /contract-ledger/edit/:rowId page
//     - View:   navigates to dedicated /contract-ledger/view/:rowId page
// ============================================================================

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Material-UI layout and UI components
import {
  Box,
  Container,
  Paper,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import { MuiDataGrid, DataTableToolbar } from '../components/tables';

// Centralized App Icons
import {
  ContractLedgerIcon,
  VisibilityIcon,
  EditNoteIcon,
  DownloadIcon,
} from '../icons';

// Toast notifications
import { toast } from 'react-toastify';

// Theme tokens & Context
import { blcColors } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { PageHeader } from '../components/common/PageHeader';
import { Navbar } from '../components/dashboard/Navbar';

// Shared options
import {
  PLAN_TIERS,
  ENGAGEMENT_CHANNELS,
} from '../components/tables/bulkUpdater/BulkUpdater';
import { INITIAL_CUSTOMER_INSIGHTS } from './CustomerInsightPage';

// Centralized storage key for Contract Ledger
export const CONTRACT_LEDGER_STORAGE_KEY = 'contract_ledger_dataset';
// Compatibility alias
export const COPILOT_STORAGE_KEY = CONTRACT_LEDGER_STORAGE_KEY;

// Re-export shared tokens and initial dataset
export { PLAN_TIERS, ENGAGEMENT_CHANNELS };
export const INITIAL_CONTRACT_LEDGER_DATA = INITIAL_CUSTOMER_INSIGHTS.map((row) => [
  row[0],
  row[1],
  row[2],
  row[3],
  row[4],
]);
// Compatibility alias
export const INITIAL_COPILOT_DATA = INITIAL_CONTRACT_LEDGER_DATA;

// ─── Default Column Definitions for View Management & Bulk Updater ───────────
export const DEFAULT_CONTRACT_LEDGER_COLUMNS = [
  {
    id: 'planTier',
    label: 'Plan Tier',
    dataIndex: 0,
    type: 'dropdown',
    source: PLAN_TIERS,
  },
  {
    id: 'companyName',
    label: 'Company Name',
    dataIndex: 1,
    type: 'text',
  },
  {
    id: 'annualArr',
    label: 'Annual ARR ($)',
    dataIndex: 2,
    type: 'numeric',
    numericFormat: { pattern: '$0,0' },
  },
  {
    id: 'seats',
    label: 'User Seats',
    dataIndex: 3,
    type: 'numeric',
    numericFormat: { pattern: '0,0' },
  },
  {
    id: 'joinDate',
    label: 'Join Date',
    dataIndex: 4,
    type: 'date',
    dateFormat: 'YYYY-MM-DD',
    correctFormat: true,
  },
];

// Legacy alias for compatibility
export const COLUMN_DEFS = DEFAULT_CONTRACT_LEDGER_COLUMNS;
export const COL_HEADERS = ['Plan Tier', 'Company Name', 'Annual ARR ($)', 'User Seats', 'Join Date', 'Action'];

/**
 * ContractLedgerPage Component
 */
export const ContractLedgerPage = ({ mode, toggleMode }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  // Selected row indices via row click (no checkboxes)
  const [selectedRowIndices, setSelectedRowIndices] = useState([]);
  const lastClickedIndexRef = useRef(null);

  // Row click selection handler supporting single click, Ctrl/Cmd-click, and Shift-click
  const handleRowClick = useCallback((params, event) => {
    // If click originated on action buttons, do not toggle row selection
    if (event?.target?.closest('button, .MuiIconButton-root')) return;

    const rowIndex = params.row.rawIndex;
    const isCtrlPressed = event?.ctrlKey || event?.metaKey;
    const isShiftPressed = event?.shiftKey;

    if (isShiftPressed && lastClickedIndexRef.current !== null) {
      const start = Math.min(lastClickedIndexRef.current, rowIndex);
      const end = Math.max(lastClickedIndexRef.current, rowIndex);
      const rangeIndices = [];
      for (let i = start; i <= end; i++) {
        rangeIndices.push(i);
      }
      setSelectedRowIndices((prev) => Array.from(new Set([...prev, ...rangeIndices])));
    } else if (isCtrlPressed) {
      setSelectedRowIndices((prev) =>
        prev.includes(rowIndex) ? prev.filter((i) => i !== rowIndex) : [...prev, rowIndex]
      );
      lastClickedIndexRef.current = rowIndex;
    } else {
      // Single click: toggle selection if already solely selected, else select just this row
      setSelectedRowIndices((prev) =>
        prev.length === 1 && prev[0] === rowIndex ? [] : [rowIndex]
      );
      lastClickedIndexRef.current = rowIndex;
    }
  }, []);

  // In-memory dataset synced with localStorage (validated against empty/corrupted rows)
  const [dataset] = useState(() => {
    try {
      const stored = localStorage.getItem(CONTRACT_LEDGER_STORAGE_KEY) || localStorage.getItem('ai_copilot_dataset');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasValidContent = parsed.some((row) => {
            if (Array.isArray(row)) {
              return row.some((c) => c !== null && c !== undefined && String(c).trim() !== '');
            }
            if (row && typeof row === 'object') {
              return Boolean(row.companyName || row.planTier || row.annualArr || row.joinDate);
            }
            return false;
          });
          if (hasValidContent) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse contract ledger dataset:', e);
    }
    return INITIAL_CONTRACT_LEDGER_DATA;
  });

  // ── Download Export Menu State ───────────────────────────────────────────────
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);

  // ── Visible & Hidden Columns State synced with localStorage ─────────────────
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('contract_ledger_visible_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed.some((col) => col.id === 'seats')) return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading saved visible columns:', e);
    }
    return DEFAULT_CONTRACT_LEDGER_COLUMNS;
  });

  const [hiddenColumns, setHiddenColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('contract_ledger_hidden_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved hidden columns:', e);
    }
    return [];
  });

  // View management handlers
  const handleColumnsChange = (newVisible, newHidden) => {
    setVisibleColumns(newVisible);
    setHiddenColumns(newHidden);
    try {
      localStorage.setItem('contract_ledger_visible_columns', JSON.stringify(newVisible));
      localStorage.setItem('contract_ledger_hidden_columns', JSON.stringify(newHidden));
    } catch (e) {
      console.error('Error saving columns layout to localStorage:', e);
    }
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_CONTRACT_LEDGER_COLUMNS);
    setHiddenColumns([]);
    try {
      localStorage.removeItem('contract_ledger_visible_columns');
      localStorage.removeItem('contract_ledger_hidden_columns');
    } catch (e) {
      console.error('Error resetting columns:', e);
    }
    toast.info('Columns reset to default view.');
  };

  // ─── Data Adapter: Convert dataset to MUI DataGrid row objects ───────────
  const rows = useMemo(() => {
    if (!Array.isArray(dataset)) return [];
    return dataset.map((row, index) => {
      const isArr = Array.isArray(row);
      let seatsVal = 0;
      let joinDateVal = '';
      if (isArr) {
        if (typeof row[3] === 'number') {
          seatsVal = row[3];
          joinDateVal = row[4] || '';
        } else if (typeof row[4] === 'number') {
          seatsVal = row[4];
          joinDateVal = row[3] || '';
        } else {
          joinDateVal = row[3] || '';
          const arr = Number(row[2]) || 50000;
          seatsVal = Math.max(10, Math.round(arr / 1200));
        }
      } else if (row && typeof row === 'object') {
        seatsVal =
          row.seats !== undefined && row.seats !== null
            ? Number(row.seats)
            : Math.max(10, Math.round((Number(row.annualArr) || 50000) / 1200));
        joinDateVal = row.joinDate || '';
      }

      return {
        id: index,
        rawIndex: index,
        displayId: index + 1,
        planTier: isArr ? (row[0] || 'Enterprise') : (row?.planTier || 'Enterprise'),
        companyName: isArr ? (row[1] || '') : (row?.companyName || ''),
        annualArr: isArr
          ? (row[2] !== undefined && row[2] !== null ? Number(row[2]) : 0)
          : (row?.annualArr !== undefined && row?.annualArr !== null ? Number(row.annualArr) : 0),
        seats: seatsVal,
        joinDate: joinDateVal,
      };
    });
  }, [dataset]);

  // ── Data Export / Download Handler ──────────────────────────────────────────
  const handleDownload = useCallback(
    (format) => {
      if (!dataset || dataset.length === 0) {
        toast.warning('No data available to download.');
        setDownloadAnchorEl(null);
        return;
      }

      // Use currently visible columns layout, or fallback to default
      const cols =
        visibleColumns && visibleColumns.length > 0
          ? visibleColumns
          : DEFAULT_CONTRACT_LEDGER_COLUMNS;

      const headers = cols.map((c) => c.label || c.headerName || c.id);

      const exportRows = dataset.map((row, idx) => {
        const isArr = Array.isArray(row);
        const mappedRow = rows[idx];
        return cols.map((col) => {
          const key = col.id || col.field;
          if (mappedRow && mappedRow[key] !== undefined) return mappedRow[key];
          const dIdx = col.dataIndex;
          if (isArr) {
            if (typeof dIdx === 'number' && row[dIdx] !== undefined) return row[dIdx];
            if (key === 'planTier') return row[0] || '';
            if (key === 'companyName') return row[1] || '';
            if (key === 'annualArr') return row[2] ?? 0;
            if (key === 'seats') return row[3] ?? 0;
            if (key === 'joinDate') return row[4] || row[3] || '';
            return '';
          }
          return row?.[key] ?? '';
        });
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileNameBase = `contract_ledger_data_${dateStr}`;

      const triggerBlobDownload = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 150);
      };

      if (format === 'csv') {
        const csvContent = [
          headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
          ...exportRows.map((r) =>
            r.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
          ),
        ].join('\r\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, `${fileNameBase}.csv`);
        toast.success('Downloaded Contract Ledger as CSV!');
      } else if (format === 'excel') {
        const tableHtml = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
            <!--[if gte mso 9]>
            <xml>
              <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                  <x:ExcelWorksheet>
                    <x:Name>Contract Ledger</x:Name>
                    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                  </x:ExcelWorksheet>
                </x:ExcelWorksheets>
              </x:ExcelWorkbook>
            </xml>
            <![endif]-->
          </head>
          <body>
            <table border="1">
              <thead>
                <tr style="background-color: #1e3a8a; color: #ffffff; font-weight: bold;">
                  ${headers.map((h) => `<th style="padding: 6px 12px;">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${exportRows
                  .map(
                    (r) =>
                      `<tr>${r.map((cell) => `<td style="padding: 4px 8px;">${cell ?? ''}</td>`).join('')}</tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;
        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        triggerBlobDownload(blob, `${fileNameBase}.xls`);
        toast.success('Downloaded Contract Ledger as Excel (.xls)!');
      } else if (format === 'json') {
        const jsonObjects = exportRows.map((r) => {
          const obj = {};
          cols.forEach((col, idx) => {
            const propName = col.id || col.field || `col_${idx}`;
            obj[propName] = r[idx];
          });
          return obj;
        });
        const blob = new Blob([JSON.stringify(jsonObjects, null, 2)], {
          type: 'application/json;charset=utf-8;',
        });
        triggerBlobDownload(blob, `${fileNameBase}.json`);
        toast.success('Downloaded Contract Ledger as JSON!');
      } else if (format === 'tsv') {
        const tsvContent = [
          headers.join('\t'),
          ...exportRows.map((r) => r.map((cell) => String(cell ?? '')).join('\t')),
        ].join('\r\n');
        const blob = new Blob(['\uFEFF' + tsvContent], {
          type: 'text/tab-separated-values;charset=utf-8;',
        });
        triggerBlobDownload(blob, `${fileNameBase}.txt`);
        toast.success('Downloaded Contract Ledger as Text / TSV!');
      }

      setDownloadAnchorEl(null);
    },
    [dataset, rows, visibleColumns]
  );

  // ── Action 1: Navigate to Edit Page at /contract-ledger/edit/:rowId ──────────
  const handleRequestEdit = useCallback((rowIndex) => {
    navigate(`/contract-ledger/edit/${rowIndex + 1}`);
  }, [navigate]);

  // ── Action 2: Navigate to View Page at /contract-ledger/view/:rowId ──────────
  const handleRequestView = useCallback((rowIndex) => {
    navigate(`/contract-ledger/view/${rowIndex + 1}`);
  }, [navigate]);

  // ─── Non-Editable DataGrid Column Definitions ──────────────────────────────
  const gridColumns = useMemo(() => {
    const allDefs = [
      {
        field: 'planTier',
        headerName: 'Plan Tier',
        flex: 1,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
        editable: false,
        valueGetter: (value, row) => value || (row && row.planTier) || 'Enterprise',
      },
      {
        field: 'companyName',
        headerName: 'Company Name',
        flex: 1.5,
        minWidth: 200,
        headerAlign: 'center',
        align: 'center',
        editable: false,
      },
      {
        field: 'annualArr',
        headerName: 'Annual ARR ($)',
        flex: 1.2,
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        type: 'number',
        editable: false,
        valueFormatter: (value) => {
          const v = value && typeof value === 'object' && 'value' in value ? value.value : value;
          if (v === undefined || v === null || v === '') return '$0';
          return `$${Number(v).toLocaleString()}`;
        },
      },
      {
        field: 'seats',
        headerName: 'User Seats',
        flex: 1,
        minWidth: 120,
        headerAlign: 'center',
        align: 'center',
        type: 'number',
        editable: false,
        valueFormatter: (value) => {
          const v = value && typeof value === 'object' && 'value' in value ? value.value : value;
          if (v === undefined || v === null || v === '') return '0';
          return Number(v).toLocaleString();
        },
      },
      {
        field: 'joinDate',
        headerName: 'Join Date',
        flex: 1.2,
        minWidth: 140,
        headerAlign: 'center',
        align: 'center',
        editable: false,
      },
    ];

    // Filter & dynamically reorder columns to match visibleColumns
    const defsMap = new Map(allDefs.map((col) => [col.field, col]));
    let activeCols = (visibleColumns || [])
      .map((col) => defsMap.get(col.id || col.field || col.key))
      .filter(Boolean);

    // Safeguard: If activeCols is empty, fall back to all default columns so table never appears blank
    if (activeCols.length === 0) {
      activeCols = [...allDefs];
    }

    // Append non-editable Action Column containing Edit and View buttons
    activeCols.push({
      field: 'actions',
      headerName: 'Action',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      editable: false,
      renderCell: (params) => {
        const rowIndex = params.row.rawIndex;
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
            }}
          >
            {/* 1. Edit Button (Navigates to /contract-ledger/edit/:rowId) */}
            <Tooltip title="Edit record" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestEdit(rowIndex);
                }}
                sx={{
                  color: '#3b82f6',
                  p: 0.5,
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.15)' },
                }}
              >
                <EditNoteIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>

            {/* 2. View Button (Navigates to /contract-ledger/view/:rowId) */}
            <Tooltip title="View record" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestView(rowIndex);
                }}
                sx={{
                  color: '#10b981',
                  p: 0.5,
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' },
                }}
              >
                <VisibilityIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    });

    return activeCols;
  }, [visibleColumns, handleRequestEdit, handleRequestView]);

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
        pb: 6,
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* ── Sticky Top Navbar ── */}
      <Navbar
        mode={mode}
        toggleMode={toggleMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        onExternalLinkClick={() => { }}
      />

      {/* ── Main Container (Full Width) ── */}
      <Container maxWidth={false} sx={{ mt: 3, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Top Header Card */}
        <PageHeader
          icon={<ContractLedgerIcon />}
          title="Contract Ledger — Interactive Table"
          breadcrumb="Contract Ledger"
          isDark={isDark}
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
          {/* Standardized Table Header Controls (Save View, Saved Views, View Management, Download) */}
          <DataTableToolbar
            showBulkUpdater={false}
            showDelete={false}
            showSaveView={true}
            showSavedViews={true}
            showViewManagement={true}
            visibleColumns={visibleColumns}
            hiddenColumns={hiddenColumns}
            onColumnsChange={handleColumnsChange}
            onResetColumns={handleResetColumns}
            pageKey="contract_ledger"
            isDark={isDark}
          >
            {/* Download / Export Data Icon */}
            <Tooltip title="Download Data" placement="top" arrow>
              <IconButton
                aria-label="Download Data"
                onClick={(e) => setDownloadAnchorEl(e.currentTarget)}
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
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </DataTableToolbar>

          {/* Reusable MUI DataGrid Component */}
          <MuiDataGrid
            rows={rows}
            columns={gridColumns}
            selectedRowIndices={selectedRowIndices}
            onRowClick={handleRowClick}
            isDark={isDark}
            height={580}
            rowHeight={46}
          />
        </Paper>
      </Container>

      {/* ── Download Format Menu ── */}
      <Menu
        open={Boolean(downloadAnchorEl)}
        anchorEl={downloadAnchorEl}
        onClose={() => setDownloadAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 140,
              borderRadius: '8px',
              bgcolor: isDark ? blcColors.darkCard : '#ffffff',
              border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
              boxShadow: isDark
                ? '0 12px 32px rgba(0,0,0,0.65)'
                : '0 8px 24px rgba(30,58,138,0.12)',
              p: 0.5,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => handleDownload('csv')}
          sx={{
            borderRadius: '6px',
            py: 0.85,
            px: 1.5,
            fontSize: '0.85rem',
            fontWeight: 500,
            color: isDark ? '#f1f5f9' : blcColors.textDark,
            '&:hover': {
              bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 58, 138, 0.06)',
            },
          }}
        >
          CSV (.csv)
        </MenuItem>

        <MenuItem
          onClick={() => handleDownload('excel')}
          sx={{
            borderRadius: '6px',
            py: 0.85,
            px: 1.5,
            fontSize: '0.85rem',
            fontWeight: 500,
            color: isDark ? '#f1f5f9' : blcColors.textDark,
            '&:hover': {
              bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 58, 138, 0.06)',
            },
          }}
        >
          Excel (.xls)
        </MenuItem>

        <MenuItem
          onClick={() => handleDownload('json')}
          sx={{
            borderRadius: '6px',
            py: 0.85,
            px: 1.5,
            fontSize: '0.85rem',
            fontWeight: 500,
            color: isDark ? '#f1f5f9' : blcColors.textDark,
            '&:hover': {
              bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 58, 138, 0.06)',
            },
          }}
        >
          JSON (.json)
        </MenuItem>

        <MenuItem
          onClick={() => handleDownload('tsv')}
          sx={{
            borderRadius: '6px',
            py: 0.85,
            px: 1.5,
            fontSize: '0.85rem',
            fontWeight: 500,
            color: isDark ? '#f1f5f9' : blcColors.textDark,
            '&:hover': {
              bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 58, 138, 0.06)',
            },
          }}
        >
          Text (.txt)
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ContractLedgerPage;
