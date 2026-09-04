// ThemeToggle.jsx
// ============================================================================
// PURPOSE:
//   A reusable, accessible theme mode toggle button for flipping between
//   Light Mode and Dark Mode across the application.
//
// USAGE LOCATIONS:
//   - LoginPage.jsx: Positioned in the top-right corner of the authentication screen.
//   - Navbar.jsx: Integrated into the right-hand actions area of the sticky top bar.
//
// FEATURES & ARCHITECTURE:
//   - Mode Inversion: Displays a Sun (LightMode) icon when Dark Mode is active,
//     and a Moon (DarkMode) icon when Light Mode is active.
//   - Accessible Tooltip: Informs keyboard and screen reader users of the upcoming action.
//   - Custom Stylability: Accepts optional sx overrides to allow precise placement.
// ============================================================================

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { blcColors } from '../../theme';

/**
 * ThemeToggle Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {'light'|'dark'} props.mode - Current active theme mode string.
 * @param {Function} props.toggleMode - Callback function invoked on click to toggle between modes.
 * @param {Object} [props.sx={}] - Additional MUI styling overrides passed to the IconButton.
 * @returns {React.ReactElement} The theme toggle icon button wrapped in a Tooltip.
 */
export const ThemeToggle = ({ mode, toggleMode, sx = {} }) => {
  // Boolean flag used for conditional icon and color switching
  const isDark = mode === 'dark';

  return (
    // Tooltip provides immediate feedback on what clicking this button will do
    <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton
        id="theme-toggle-btn"
        onClick={toggleMode}
        size="small"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        sx={{
          // Subtly colored icon according to active mode
          color: isDark ? '#94a3b8' : blcColors.textMid,
          // Translucent background pill effect for modern look
          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          // Thin border outline for clear affordance
          border: `1px solid ${isDark ? blcColors.darkBorder : '#d1d9f0'}`,
          // Smooth transition on hover
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            borderColor: isDark ? '#475569' : '#94a3b8',
          },
          ...sx, // Merges custom consumer styles
        }}
      >
        {/* Render sun in dark mode (click to lighten) or moon in light mode (click to darken) */}
        {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

