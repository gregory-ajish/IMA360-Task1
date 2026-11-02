// Popup.jsx
// ============================================================================
// PURPOSE:
//   Standardized, theme-aware popup modal (Dialog) wrapper for the application.
//   Provides a consistent shell, header, close button, and footer actions
//   while allowing any custom content (forms, tables, lists) in `children`.
// ============================================================================

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { CloseIcon } from '../../icons';
import { useTheme } from '@mui/material/styles';

import { blcColors, typographyTokens } from '../../theme';

/**
 * Reusable AppDialog Modal Component
 */
export const AppDialog = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'sm',
  fullWidth = true,
  children,
  actions,
  TransitionProps,
  isDark: forcedIsDark,
  zIndex,
}) => {
  const theme = useTheme();
  const isDark = forcedIsDark !== undefined ? forcedIsDark : theme.palette.mode === 'dark';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      sx={zIndex ? { zIndex } : undefined}
      slotProps={{
        ...(TransitionProps ? { transition: TransitionProps } : {}),
        paper: {
          sx: {
            borderRadius: '16px',
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            color: isDark ? '#e2e8f0' : blcColors.textDark,
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
            boxShadow: isDark
              ? '0 24px 64px rgba(0,0,0,0.7)'
              : '0 20px 50px rgba(15,23,42,0.12)',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* ── Header ── */}
      {(title || onClose) && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${isDark ? blcColors.darkBorder : '#f1f5f9'}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            {icon && (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  bgcolor: `${blcColors.navyAccent}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: blcColors.navyAccent,
                }}
              >
                {icon}
              </Box>
            )}
            <Box>
              {typeof title === 'string' ? (
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: typographyTokens.fontMono,
                    fontWeight: typographyTokens.weightBold,
                    fontSize: '1.1rem',
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </Typography>
              ) : (
                title
              )}

              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '0.78rem',
                    mt: 0.25,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {onClose && (
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close dialog"
              sx={{
                color: isDark ? '#94a3b8' : '#64748b',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                  color: isDark ? '#ffffff' : '#0f172a',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>
      )}

      {/* ── Content ── */}
      <DialogContent sx={{ px: 2.5, py: 2 }}>
        {children}
      </DialogContent>

      {/* ── Actions / Footer ── */}
      {actions && (
        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: `1px solid ${isDark ? blcColors.darkBorder : '#f1f5f9'}`,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export const Popup = AppDialog;
export default AppDialog;
