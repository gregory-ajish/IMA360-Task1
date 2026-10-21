// ContractLedgerViewPage.jsx
// ============================================================================
// PURPOSE:
//   Dedicated read-only view page for an individual Contract Ledger record
//   at /contract-ledger/view/:rowId.
//   Layout structure matches the Edit wireframe:
//     1. Header Card  — Collapsible card displaying the 4 read-only inputs in one row:
//                       Type, Quantity, Description, Date.
//     2. Details Card — Collapsible card with Handsontable of 7 columns (ID, Name,
//                       Category, Status, Date Modified, Assigned To, Priority),
//                       where all cells are completely READ-ONLY (non-editable).
//     3. Action Bar   — "Back to Ledger" and "Edit Record" buttons placed outside cards.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardArrowDownIcon,
} from '../icons';

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
import { DataTable } from '../components/dataTable';

// Data tokens & shared storage key
import {
  CONTRACT_LEDGER_STORAGE_KEY,
  INITIAL_CONTRACT_LEDGER_DATA,
} from './ContractLedgerPage';

// Register all Handsontable modules
registerAllModules();

// ─── Details Card Handsontable Column Definitions (All 7 Read-Only) ─────────
const DETAILS_VIEW_COLUMNS = [
  {
    data: 0,
    title: 'ID',
    type: 'numeric',
    width: 80,
    className: 'htCenter htMiddle',
    readOnly: true,
  },
  {
    data: 1,
    title: 'Name',
    type: 'text',
    width: 200,
    className: 'htMiddle',
    readOnly: true,
  },
  {
    data: 2,
    title: 'Category',
    type: 'text',
    width: 140,
    className: 'htCenter htMiddle',
    readOnly: true,
  },
  {
    data: 3,
    title: 'Status',
    type: 'text',
    width: 130,
    className: 'htCenter htMiddle',
    readOnly: true,
  },
  {
    data: 4,
    title: 'Date Modified',
    type: 'text',
    width: 140,
    className: 'htCenter htMiddle',
    readOnly: true,
  },
  {
    data: 5,
    title: 'Assigned To',
    type: 'text',
    width: 160,
    className: 'htCenter htMiddle',
    readOnly: true,
  },
  {
    data: 6,
    title: 'Priority',
    type: 'text',
    width: 120,
    className: 'htCenter htMiddle',
    readOnly: true,
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

// Initial default rows matching mockup
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

/**
 * ContractLedgerViewPage Component (Read-Only)
 */
export const ContractLedgerViewPage = ({ mode, toggleMode }) => {
  const { rowId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout, isAdmin } = useAuth();
  const isDark = mode === 'dark';

  const detailsHotRef = useRef(null);

  // Collapse states for Header and Details cards
  const [headerOpen, setHeaderOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);

  // Calculate 0-based index from rowId
  const parsedId = parseInt(rowId, 10);
  const rowIndex = isNaN(parsedId) ? 0 : Math.max(0, parsedId - 1);

  // Load dataset from localStorage (or fallback to INITIAL_CONTRACT_LEDGER_DATA)
  const [dataset] = useState(() => {
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

  const planTier = currentRow[0] || 'Enterprise';
  const annualArr = currentRow[2] !== undefined ? `$${Number(currentRow[2]).toLocaleString()}` : '$0';
  const companyName = currentRow[1] || 'N/A';
  const joinDate = currentRow[3] || '2024-01-01';

  // Details card Handsontable dataset (loaded from localStorage or defaults)
  const [detailsData] = useState(() => {
    try {
      const stored = localStorage.getItem(`contract_details_${rowIndex + 1}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse details rows:', e);
    }
    return INITIAL_FILLED_ROWS;
  });

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
        pb: 8,
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

      {/* ── Main Container ── */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {/* Top Breadcrumb Navigation */}
        <PageHeader
          breadcrumb={`View #${rowIndex + 1}`}
          backTo="/contract-ledger"
          backTooltip="Back to Contract Ledger"
          parentLabel="Contract Ledger"
          isDark={isDark}
        />

        {/* ── STACKED CARD 1: HEADER CARD (READ-ONLY) ── */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '12px',
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
            boxShadow: isDark
              ? '0 12px 48px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(30,58,138,0.08)',
          }}
        >
          {/* Card Title & Collapse Icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: headerOpen ? 2 : 0,
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
              Header
            </Typography>

            <IconButton
              size="small"
              onClick={() => setHeaderOpen(!headerOpen)}
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
            <Divider sx={{ mb: 2.5, borderColor: isDark ? blcColors.darkBorder : '#f1f5f9' }} />

            {/* Four Read-Only Inputs in ONE row stretching completely across horizontal space */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'flex-start',
                gap: 2.5,
                width: '100%',
              }}
            >
              {/* 1. Plan Tier (Read-Only) */}
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
                <TextField
                  size="small"
                  fullWidth
                  value={planTier}
                  InputProps={{ readOnly: true }}
                  sx={{
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                    '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                  }}
                />
              </Box>

              {/* 2. Annual ARR ($) (Read-Only) */}
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
                  size="small"
                  fullWidth
                  value={annualArr}
                  InputProps={{ readOnly: true }}
                  sx={{
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                    '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                  }}
                />
              </Box>

              {/* 3. Company Name (Read-Only) */}
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
                  value={companyName}
                  InputProps={{ readOnly: true }}
                  sx={{
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                    '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                  }}
                />
              </Box>

              {/* 4. Join Date (Read-Only) */}
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
                  size="small"
                  fullWidth
                  value={joinDate}
                  InputProps={{ readOnly: true }}
                  sx={{
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                    '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                  }}
                />
              </Box>
            </Box>
          </Collapse>
        </Paper>

        {/* ── STACKED CARD 2: DETAILS CARD (NON-EDITABLE HANDSONTABLE) ── */}
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
          {/* Card Title & Collapse Icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: detailsOpen ? 2 : 0,
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
              onClick={() => setDetailsOpen(!detailsOpen)}
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
            <Divider sx={{ mb: 2.5, borderColor: isDark ? blcColors.darkBorder : '#f1f5f9' }} />

            {/* Read-Only Handsontable: Cells cannot be edited */}
            <DataTable
              ref={detailsHotRef}
              dataset={detailsData}
              totalRows={detailsData.length}
              columns={DETAILS_VIEW_COLUMNS}
              colHeaders={DETAILS_COL_HEADERS}
              rowHeaders={false}
              height={320}
              width="100%"
              stretchH="all"
              minSpareRows={0}
              useWorker={false}
              manualColumnResize={true}
              manualRowResize={true}
              readOnly={true}
              isDark={isDark}
              isAdmin={isAdmin}
              licenseKey="non-commercial-and-evaluation"
            />
          </Collapse>
        </Paper>
      </Container>
    </Box>
  );
};

export default ContractLedgerViewPage;
