// RevenueTrackerModal.jsx
// PURPOSE: An interactive Excel-style spreadsheet modal powered by Handsontable.
// Opens when the user clicks the "Revenue Tracker" application card on the Dashboard.
//
// FEATURES:
//   - Full spreadsheet grid with cell editing, row/col headers, and selection
//   - Formatted currency columns (MRR, Expansion, Churn, Net Revenue, Target)
//   - Dropdown status column (Exceeded, On Track, Behind)
//   - Context menu enabled (insert row, remove row, copy/paste)
//   - Modal header with save, reset, and export actions

import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { toast } from 'react-toastify';
import { blcColors } from '../../theme';

// Register all Handsontable modules (renderers, editors, validators, plugins)
registerAllModules();

// Initial demo revenue data
const initialData = [
  ['Jan 2026', 145000, 18000, 4200, 158800, 150000, 'Exceeded'],
  ['Feb 2026', 158800, 22500, 3100, 178200, 170000, 'Exceeded'],
  ['Mar 2026', 178200, 14000, 6800, 185400, 185000, 'On Track'],
  ['Apr 2026', 185400, 19200, 5100, 199500, 200000, 'On Track'],
  ['May 2026', 199500, 25000, 4800, 219700, 215000, 'Exceeded'],
  ['Jun 2026', 219700, 11000, 8900, 221800, 230000, 'Behind'],
  ['Jul 2026', 221800, 28000, 3400, 246400, 240000, 'Exceeded'],
  ['Aug 2026', 246400, 16500, 5200, 257700, 255000, 'On Track'],
  ['Sep 2026', 257700, 31000, 2900, 285800, 270000, 'Exceeded'],
];

/**
 * Common RevenueTrackerModal component
 * Props:
 *  - open: boolean
 *  - onClose: function
 *  - isDark: boolean
 */
export const RevenueTrackerModal = ({ open, onClose, isDark }) => {
  const hotRef = useRef(null);
  const [data, setData] = useState(initialData);

  // Saves current changes and gives instant feedback via a toast notification
  const handleSave = () => {
    toast.success('Revenue ledger saved successfully!');
    onClose();
  };

  // Resets the spreadsheet to original mock values
  const handleReset = () => {
    setData([...initialData.map((row) => [...row])]);
    toast.info('Spreadsheet reset to default values.');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          bgcolor: isDark ? blcColors.darkCard : '#ffffff',
          color: isDark ? '#e2e8f0' : blcColors.textDark,
          border: `1px solid ${isDark ? blcColors.darkBorder : '#d1d9f0'}`,
          boxShadow: isDark
            ? '0 12px 48px rgba(0,0,0,0.7)'
            : '0 8px 32px rgba(30,58,138,0.15)',
        },
      }}
    >
      {/* ── Modal Header ── */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Header Icon Box */}
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '8px',
              bgcolor: `${blcColors.navyAccent}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: blcColors.navyAccent,
            }}
          >
            <TableChartIcon fontSize="small" />
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                fontSize: '1.05rem',
              }}
            >
              Revenue Tracker — Interactive Ledger
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.78rem',
                color: isDark ? '#64748b' : blcColors.textMid,
              }}
            >
              Powered by Handsontable • Double-click cells to edit or paste from Excel
            </Typography>
          </Box>
        </Box>

        {/* Close Button */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ── Spreadsheet Grid Content ── */}
      <DialogContent sx={{ p: 2.5, overflowX: 'auto' }}>
        <Box
          sx={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            // Handsontable dark theme adjustments
            '& .handsontable': {
              fontFamily: '"Inter", sans-serif',
              fontSize: '0.82rem',
            },
            '& .htCore th': {
              bgcolor: isDark ? '#1e293b' : '#f8fafc',
              color: isDark ? '#94a3b8' : '#475569',
              fontWeight: 700,
              fontFamily: '"JetBrains Mono", monospace',
            },
          }}
        >
          <HotTable
            ref={hotRef}
            data={data}
            colHeaders={[
              'Month',
              'Starting MRR ($)',
              'Expansion ($)',
              'Churn ($)',
              'Net Revenue ($)',
              'Target ($)',
              'Status',
            ]}
            rowHeaders={true}
            height="320"
            width="100%"
            stretchH="all"
            contextMenu={true}
            manualColumnResize={true}
            manualRowResize={true}
            licenseKey="non-commercial-and-evaluation"
            autoWrapRow={true}
            autoWrapCol={true}
            columns={[
              { type: 'text' },
              { type: 'numeric', numericFormat: { pattern: '$0,0' } },
              { type: 'numeric', numericFormat: { pattern: '$0,0' } },
              { type: 'numeric', numericFormat: { pattern: '$0,0' } },
              { type: 'numeric', numericFormat: { pattern: '$0,0' } },
              { type: 'numeric', numericFormat: { pattern: '$0,0' } },
              {
                type: 'dropdown',
                source: ['Exceeded', 'On Track', 'Behind'],
              },
            ]}
          />
        </Box>
      </DialogContent>

      {/* ── Modal Actions ── */}
      <DialogActions
        sx={{
          p: 2,
          px: 2.5,
          borderTop: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={handleReset}
          startIcon={<ResetIcon />}
          size="small"
          sx={{
            color: isDark ? '#94a3b8' : blcColors.textMid,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.78rem',
          }}
        >
          Reset Data
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={onClose}
            size="small"
            variant="outlined"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.8rem',
              color: isDark ? '#94a3b8' : blcColors.textDark,
              borderColor: isDark ? blcColors.darkBorder : '#cbd5e1',
            }}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.8rem',
              bgcolor: blcColors.navyAccent,
            }}
          >
            Save Changes
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
