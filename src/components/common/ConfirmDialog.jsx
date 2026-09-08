// ConfirmDialog.jsx
// ============================================================================
// PURPOSE:
//   Standardized, theme-aware confirmation alert dialog across the application.
//   Used for destructive actions (such as row deletion, account actions, etc.).
//   Composes the reusable AppButton common component for actions.
//
// WHY IT EXISTS:
//   - Prevents accidental deletions by requiring explicit user confirmation.
//   - Reusable across any feature (e.g. spreadsheet row removal, logout, data purge).
//   - High z-index (1400) ensures it renders on top of existing modals like
//     RevenueTrackerModal (which sits at default z-index 1300).
//   - Automatically supports dark and light theme styles.
// ============================================================================

import React from 'react';
// Material-UI dialog primitives
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
} from '@mui/material';
// Material-UI alert and delete icons
import {
  WarningAmber as WarningAmberIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
// Hook to read active MUI theme mode (light vs dark)
import { useTheme } from '@mui/material/styles';
// Design system tokens for colors and typography
import { blcColors, typographyTokens } from '../../theme';
// Standardized button component
import { AppButton } from './AppButton';

/**
 * ConfirmDialog Component
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Controls visibility of the dialog (true = visible).
 * @param {string} [props.title='Confirm Removal'] - Heading title of the dialog.
 * @param {string} [props.message='Are you sure you want to remove this row?'] - Confirmation message.
 * @param {string} [props.confirmText='Delete'] - Label for the confirm button.
 * @param {string} [props.cancelText='Cancel'] - Label for the cancel button.
 * @param {'danger'|'primary'|'secondary'} [props.confirmVariant='danger'] - AppButton variant for confirm.
 * @param {React.ReactNode} [props.confirmIcon] - Icon for the confirm button.
 * @param {Function} props.onConfirm - Callback fired when confirm button is clicked.
 * @param {Function} props.onCancel - Callback fired when cancel or backdrop is clicked.
 * @param {boolean} [props.loading=false] - Whether confirm action is loading.
 * @param {number} [props.zIndex=1400] - z-index to ensure it renders above parent modals.
 * @returns {React.ReactElement}
 */
export const ConfirmDialog = ({
  open, // Boolean controlling dialog visibility
  title = 'Confirm Removal', // Header text
  message = 'Are you sure you want to remove this row?', // Body text
  confirmText = 'Delete', // Primary action button label
  cancelText = 'Cancel', // Dismiss button label
  confirmVariant = 'danger', // Danger variant highlights red for destructive action
  confirmIcon = <DeleteIcon />, // Default trash can icon
  onConfirm, // Handler executed when user confirms
  onCancel, // Handler executed when user cancels or clicks backdrop
  loading = false, // When true, disables buttons and shows loading spinner
  zIndex = 1400, // Elevated z-index to sit on top of any open parent dialog
}) => {
  // Read active theme to apply dark or light mode palette
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    // Dialog Root: MUI backdrop and accessibility wrapper
    <Dialog
      open={open} // Visibility state
      onClose={onCancel} // Closes dialog if user clicks outside (backdrop) or presses Esc
      maxWidth="xs" // Keeps dialog compact and narrow (~444px max width)
      fullWidth // Stretches smoothly up to the maxWidth limit
      sx={{ zIndex }} // Sits above parent modals
      PaperProps={{
        // PaperProps styles the white/dark floating modal card
        sx: {
          borderRadius: '12px', // Rounded modern corners
          bgcolor: isDark ? blcColors.darkCard : '#ffffff', // Theme-responsive card background
          color: isDark ? '#e2e8f0' : blcColors.textDark, // Primary text color
          border: `1px solid ${isDark ? blcColors.darkBorder : '#d1d9f0'}`, // Subtle outline
          boxShadow: isDark
            ? '0 16px 48px rgba(0,0,0,0.85)' // Heavy shadow in dark mode for depth
            : '0 12px 40px rgba(15,23,42,0.22)', // Soft ambient shadow in light mode
          p: 1, // Internal container padding
        },
      }}
    >
      {/* ── Dialog Header: Warning Icon + Title ── */}
      <DialogTitle
        sx={{
          pb: 1,
          pt: 1.5,
          px: 2,
          display: 'flex',
          alignItems: 'center', // Align icon and title vertically
          gap: 1.5, // Space between warning circle and title text
        }}
      >
        {/* Warning Icon Badge: Circular red background with amber alert icon */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%', // Circle shape
            bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', // Soft red background tint
            color: '#ef4444', // Warning red icon color
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0, // Prevents icon circle from squishing on small screens
          }}
        >
          <WarningAmberIcon />
        </Box>

        {/* Title Text */}
        <Typography
          sx={{
            fontFamily: typographyTokens.fontMono, // Monospace font matching the technical theme
            fontWeight: typographyTokens.weightBold, // 700 bold weight
            fontSize: typographyTokens.fontSizeLg, // 16.8px font size
          }}
        >
          {title}
        </Typography>
      </DialogTitle>

      {/* ── Dialog Body: Confirmation Description Message ── */}
      <DialogContent sx={{ px: 2, py: 1.5 }}>
        <Typography
          sx={{
            fontSize: typographyTokens.fontSizeMd, // 15.2px font size
            color: isDark ? '#cbd5e1' : '#334155', // Subdued text color for description
            fontWeight: typographyTokens.weightMedium, // 500 medium weight
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      {/* ── Dialog Footer Actions: Cancel and Confirm Buttons ── */}
      <DialogActions sx={{ px: 2, pb: 1.5, pt: 1, gap: 1 }}>
        {/* Cancel Button: dismisses dialog without performing destructive action */}
        <AppButton
          onClick={onCancel}
          size="small"
          variant="ghost" // Borderless button for non-primary action
          disabled={loading} // Disabled while confirm action is in progress
        >
          {cancelText}
        </AppButton>

        {/* Confirm Button: triggers destructive callback */}
        <AppButton
          onClick={onConfirm}
          size="small"
          variant={confirmVariant} // Danger (red) by default
          startIcon={confirmIcon} // Trash icon
          loading={loading} // Shows spinner and prevents duplicate clicks while executing
        >
          {confirmText}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
