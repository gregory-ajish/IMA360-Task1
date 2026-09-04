// RevenueTrackerModal.jsx
// ============================================================================
// PURPOSE:
//   An interactive, enterprise-grade Excel-style spreadsheet modal powered by
//   Handsontable. It opens when the user clicks the "Revenue Tracker" application
//   card on the DashboardPage.
//
// USAGE LOCATIONS:
//   - DashboardPage.jsx: Rendered conditionally inside a modal dialog when
//     `isRevenueModalOpen` is true.
//
// FEATURES & ARCHITECTURE:
//   - Full Data Grid: Cell editing, keyboard navigation (arrow keys, Tab, Enter),
//     range selection, copy/paste, and undo/redo.
//   - Column Types & Formatting:
//       • Text column for financial periods ("Month")
//       • Formatted currency columns with custom pattern: "$0,0"
//       • Dropdown validation column for tracking status ("Exceeded", "On Track", "Behind")
//   - Context Menu Enabled: Right-click allows inserting/removing rows and standard actions.
//   - Resizing: Manual row and column resizing enabled for flexible reporting.
//   - State Management: Local state holding current ledger data with Reset and Save actions.
//   - Feedback: Fires success/info toast notifications using React-Toastify.
//   - Theming: Custom CSS injection for dark mode support over Handsontable base styles.
// ============================================================================

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
// This must be called once before any HotTable instances are mounted
registerAllModules();

/**
 * Initial mock dataset for the Revenue Tracker ledger.
 * Represents monthly recurring revenue (MRR), expansion revenue, churn, net revenue, and goals.
 */
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
 * RevenueTrackerModal Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {boolean} props.open - Whether the spreadsheet dialog is currently visible.
 * @param {Function} props.onClose - Callback function to dismiss the modal dialog.
 * @param {boolean} props.isDark - True if dark mode is active, triggering dark palette adjustments.
 * @returns {React.ReactElement} The rendered spreadsheet dialog modal.
 */
export const RevenueTrackerModal = ({ open, onClose, isDark }) => {
  // Reference to the Handsontable instance for direct API operations if needed
  const hotRef = useRef(null);

  // Local state maintaining the 2D array of spreadsheet values
  const [data, setData] = useState(initialData);

  /**
   * Persists changes made in the spreadsheet and closes the dialog with feedback.
   */
  const handleSave = () => {
    // In production, this would dispatch an API PUT/POST to persist data to a database.
    toast.success('Revenue ledger saved successfully!');
    onClose();
  };

  /**
   * Restores the spreadsheet to its original seed data, performing a deep clone.
   */
  const handleReset = () => {
    // Create deep copy of rows to avoid mutating original seed constants
    setData([...initialData.map((row) => [...row])]);
    toast.info('Spreadsheet reset to default values.');
  };

  return (
    // MUI Dialog container: provides backdrop, focus trap, and responsive sizing
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="revenue-modal-title"
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
        id="revenue-modal-title"
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
            {/* Title */}
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                fontSize: '1.05rem',
              }}
            >
              Revenue Tracker — Interactive Ledger
            </Typography>
            {/* Help text */}
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
          aria-label="close modal"
          onClick={onClose}
          size="small"
          sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ── Spreadsheet Grid Content Area ── */}
      <DialogContent sx={{ p: 2.5, overflowX: 'auto' }}>
        <Box
          sx={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            // Custom CSS overrides to adapt Handsontable typography & headers to active theme
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
          {/* Handsontable React Component Wrapper */}
          <HotTable
            ref={hotRef}
            data={data}
            // Column header display strings
            colHeaders={[
              'Month',
              'Starting MRR ($)',
              'Expansion ($)',
              'Churn ($)',
              'Net Revenue ($)',
              'Target ($)',
              'Status',
            ]}
            rowHeaders={true} // Display 1, 2, 3... row index numbers
            height="320"
            width="100%"
            stretchH="all" // Expands columns to occupy full container width
            contextMenu={true} // Enables right-click context menu
            manualColumnResize={true} // User can drag column divider to resize
            manualRowResize={true} // User can drag row divider to resize
            licenseKey="non-commercial-and-evaluation" // Evaluation license key
            autoWrapRow={true} // Tab key at end of row wraps to next row
            autoWrapCol={true}
            // Column schemas and formatting definitions
            columns={[
              { type: 'text' }, // Month column (freeform string)
              { type: 'numeric', numericFormat: { pattern: '$0,0' } }, // Starting MRR
              { type: 'numeric', numericFormat: { pattern: '$0,0' } }, // Expansion
              { type: 'numeric', numericFormat: { pattern: '$0,0' } }, // Churn
              { type: 'numeric', numericFormat: { pattern: '$0,0' } }, // Net Revenue
              { type: 'numeric', numericFormat: { pattern: '$0,0' } }, // Target
              {
                // Status column constrained to predefined options
                type: 'dropdown',
                source: ['Exceeded', 'On Track', 'Behind'],
              },
            ]}
          />
        </Box>
      </DialogContent>

      {/* ── Modal Footer Actions ── */}
      <DialogActions
        sx={{
          p: 2,
          px: 2.5,
          borderTop: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
          justifyContent: 'space-between',
        }}
      >
        {/* Reset button to roll back edits */}
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

        {/* Action button cluster (Cancel / Save) */}
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

