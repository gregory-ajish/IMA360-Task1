// AppButton.jsx
// ============================================================================
// PURPOSE:
//   Standardized, theme-aware application button for all pages and components.
//   Centralizes typography ("JetBrains Mono"), brand colors, loading spinner,
//   and variant styling across the entire design system.
//
// WHY IT EXISTS:
//   Instead of creating custom buttons with repeated CSS in every file:
//   - Enforces brand visual design (navy accents, monospace font, subtle shadows).
//   - Built-in loading state with automatic spinner and double-click prevention.
//   - Handles dark/light theme switching automatically for all button variants.
//   - Forwards any standard HTML/MUI button attributes (onClick, type="submit", etc.)
//     via the rest operator (...rest).
// ============================================================================

import React from 'react';
// Material-UI primitive button and loading spinner
import { Button, CircularProgress } from '@mui/material';
// Hook to read active MUI theme values (like light vs dark mode)
import { useTheme } from '@mui/material/styles';
// Design system tokens for colors and typography
import { blcColors, typographyTokens } from '../../theme';

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
  variant = 'primary', // Default style variant: solid brand navy
  size = 'medium', // Default size: balanced padding for general use
  loading = false, // When true: renders spinner and disables clicks
  loadingText, // Optional label to show during loading (e.g. "Signing in...")
  disabled = false, // Manual disable flag
  fullWidth = false, // If true, expands button to 100% width of parent container
  startIcon, // Optional icon on the left of the button label
  endIcon, // Optional icon on the right of the button label
  children, // Button text label or nested child elements
  sx = {}, // Additional custom MUI style overrides
  ...rest // Captures onClick, type="submit", id, aria-labels, etc.
}) => {
  // Access active theme context to adjust colors based on light or dark mode
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Sizing lookup table: provides proportional vertical/horizontal padding,
  // typography font size, and spinner dimensions based on the 'size' prop
  const sizeStyles = {
    small: {
      py: 0.6, // Vertical padding (approx 5px)
      px: 1.5, // Horizontal padding (approx 12px)
      fontSize: typographyTokens.fontSizeSm, // 13.1px font size
      spinnerSize: 16, // 16px diameter spinner
    },
    medium: {
      py: 1.0, // Vertical padding (approx 8px)
      px: 2.2, // Horizontal padding (approx 18px)
      fontSize: typographyTokens.fontSizeBase, // 14px font size
      spinnerSize: 20, // 20px diameter spinner
    },
    large: {
      py: 1.4, // Vertical padding (approx 11px)
      px: 3.0, // Horizontal padding (approx 24px)
      fontSize: typographyTokens.fontSizeMd, // 15.2px font size
      spinnerSize: 22, // 22px diameter spinner
    },
  }[size] || { py: 1.0, px: 2.2, fontSize: typographyTokens.fontSizeBase, spinnerSize: 20 };

  // Variant styling resolver: returns CSS rules depending on the selected variant prop
  const getVariantStyles = () => {
    switch (variant) {
      // Secondary: tinted surface with a subtle border for secondary actions
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

      // Outlined: transparent background with distinct border
      case 'outlined':
        return {
          bgcolor: 'transparent',
          color: isDark ? '#94a3b8' : blcColors.textDark,
          border: `1px solid ${isDark ? blcColors.darkBorder : '#cbd5e1'}`,
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderColor: blcColors.navyAccent,
            color: isDark ? '#ffffff' : blcColors.navyAccent,
          },
        };

      // Ghost: flat, borderless button with hover highlight (ideal for cancel buttons)
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

      // Danger: red button for destructive actions (e.g., delete row, purge data)
      case 'danger':
        return {
          bgcolor: '#dc2626', // Solid red
          color: '#ffffff',
          '&:hover': {
            bgcolor: '#b91c1c', // Darker red on hover
          },
        };

      // Primary (Default): solid brand navy CTA button with soft ambient shadow
      case 'primary':
      default:
        return {
          bgcolor: blcColors.navyAccent, // Primary navy color (#1e3a8a)
          color: '#ffffff', // High contrast white text
          boxShadow: isDark
            ? '0 2px 10px rgba(30,58,138,0.35)'
            : '0 2px 8px rgba(30,58,138,0.2)',
          '&:hover': {
            bgcolor: blcColors.navyButton, // Darker navy hover color (#1d3480)
            boxShadow: isDark
              ? '0 4px 16px rgba(30,58,138,0.5)'
              : '0 4px 14px rgba(30,58,138,0.3)',
          },
        };
    }
  };

  // Button is disabled if either explicitly disabled OR currently loading
  // This automatically prevents accidental double-clicks during async requests
  const isDisabled = disabled || loading;

  return (
    <Button
      disabled={isDisabled} // Native disabled state prevents click events
      fullWidth={fullWidth} // Stretches width to 100% when true
      startIcon={!loading ? startIcon : undefined} // Hide icons while loading so spinner takes focus
      endIcon={!loading ? endIcon : undefined}
      sx={{
        fontFamily: typographyTokens.fontMono, // Monospace font gives technical/developer aesthetic
        fontWeight: typographyTokens.weightBold, // 700 bold weight for clear readability
        borderRadius: '8px', // Consistent 8px rounding with theme
        textTransform: 'none', // Prevents MUI default all-caps transformation
        letterSpacing: typographyTokens.letterSpacingWide, // Clean character spacing (0.04em)
        transition: 'all 0.18s ease-in-out', // Smooth transition for hover animations
        py: sizeStyles.py, // Dynamic vertical padding based on size prop
        px: sizeStyles.px, // Dynamic horizontal padding based on size prop
        fontSize: sizeStyles.fontSize, // Dynamic font size based on size prop
        ...getVariantStyles(), // Merge variant-specific colors and borders
        ...(isDisabled && {
          opacity: 0.7, // Dimmed appearance when disabled
          cursor: 'not-allowed !important', // Not-allowed cursor feedback
        }),
        ...sx, // Allow external callers to supply additional sx styles
      }}
      {...rest} // Spreads onClick, type="submit", id, and any other HTML/MUI attributes
    >
      {/* If loading, render spinner + optional loadingText; otherwise render standard children */}
      {loading ? (
        <>
          <CircularProgress
            size={sizeStyles.spinnerSize} // Sized to match button height
            color="inherit" // Inherits button text color (e.g. white)
            sx={{ mr: loadingText ? 1 : 0 }} // Right margin only if text follows
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
