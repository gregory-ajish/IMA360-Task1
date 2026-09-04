// AppButton.jsx
// ============================================================================
// PURPOSE:
//   Standardized, theme-aware application button for all pages and components.
//   Centralizes typography ("JetBrains Mono"), brand colors, loading spinner,
//   and variant styling across the entire design system.
// ============================================================================

import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { blcColors } from '../../theme';

/**
 * AppButton Component
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'outlined'|'ghost'|'danger'} [props.variant='primary'] - Visual style variant
 * @param {'small'|'medium'|'large'} [props.size='medium'] - Size of the button
 * @param {boolean} [props.loading=false] - When true, disables button and renders an inline spinner
 * @param {string} [props.loadingText] - Optional text to show alongside spinner while loading
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {boolean} [props.fullWidth=false] - Fills parent container width
 * @param {React.ReactNode} [props.startIcon] - Icon placed before text
 * @param {React.ReactNode} [props.endIcon] - Icon placed after text
 * @param {React.ReactNode} props.children - Button label or contents
 * @param {Object} [props.sx] - Additional custom MUI sx overrides
 */
export const AppButton = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  loadingText,
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  children,
  sx = {},
  ...rest
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Determine padding and font sizing based on 'size' prop
  const sizeStyles = {
    small: {
      py: 0.6,
      px: 1.5,
      fontSize: '0.8rem',
      spinnerSize: 16,
    },
    medium: {
      py: 1.0,
      px: 2.2,
      fontSize: '0.875rem',
      spinnerSize: 20,
    },
    large: {
      py: 1.4,
      px: 3.0,
      fontSize: '0.95rem',
      spinnerSize: 22,
    },
  }[size] || { py: 1.0, px: 2.2, fontSize: '0.875rem', spinnerSize: 20 };

  // Variant styling map
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(30,58,138,0.06)',
          color: isDark ? '#e2e8f0' : blcColors.navyAccent,
          border: `1px solid ${isDark ? blcColors.darkBorder : '#cbd5e1'}`,
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30,58,138,0.12)',
            borderColor: isDark ? blcColors.darkBorderHover : blcColors.navyAccent,
          },
        };

      case 'outlined':
        return {
          bgcolor: 'transparent',
          color: isDark ? '#94a3b8' : blcColors.textDark,
          border: `1px solid ${isDark ? blcColors.darkBorder : '#cbd5e1'}`,
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderColor: isDark ? blcColors.navyAccent : blcColors.navyAccent,
            color: isDark ? '#ffffff' : blcColors.navyAccent,
          },
        };

      case 'ghost':
        return {
          bgcolor: 'transparent',
          color: isDark ? '#94a3b8' : blcColors.textMid,
          border: '1px solid transparent',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            color: isDark ? '#e2e8f0' : blcColors.textDark,
          },
        };

      case 'danger':
        return {
          bgcolor: '#dc2626',
          color: '#ffffff',
          '&:hover': {
            bgcolor: '#b91c1c',
          },
        };

      case 'primary':
      default:
        return {
          bgcolor: blcColors.navyAccent,
          color: '#ffffff',
          boxShadow: isDark
            ? '0 2px 10px rgba(30,58,138,0.35)'
            : '0 2px 8px rgba(30,58,138,0.2)',
          '&:hover': {
            bgcolor: blcColors.navyButton,
            boxShadow: isDark
              ? '0 4px 16px rgba(30,58,138,0.5)'
              : '0 4px 14px rgba(30,58,138,0.3)',
          },
        };
    }
  };

  const isDisabled = disabled || loading;

  return (
    <Button
      disabled={isDisabled}
      fullWidth={fullWidth}
      startIcon={!loading ? startIcon : undefined}
      endIcon={!loading ? endIcon : undefined}
      sx={{
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: 700,
        borderRadius: '8px',
        textTransform: 'none',
        letterSpacing: '0.03em',
        transition: 'all 0.18s ease-in-out',
        py: sizeStyles.py,
        px: sizeStyles.px,
        fontSize: sizeStyles.fontSize,
        ...getVariantStyles(),
        ...(isDisabled && {
          opacity: 0.7,
          cursor: 'not-allowed !important',
        }),
        ...sx,
      }}
      {...rest}
    >
      {loading ? (
        <>
          <CircularProgress
            size={sizeStyles.spinnerSize}
            color="inherit"
            sx={{ mr: loadingText ? 1 : 0 }}
          />
          {loadingText || null}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default AppButton;
