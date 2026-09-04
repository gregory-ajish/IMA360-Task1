// ThemeToggle.jsx
// PURPOSE: A reusable toggle button for switching between Light and Dark mode.
// Used in both LoginPage (top-right absolute position) and Navbar (sticky header).
//
// FEATURES:
//   - Shows Sun (LightMode) icon in dark mode, Moon (DarkMode) icon in light mode
//   - Tooltip indicating the toggle action
//   - Customizable extra styles via sx prop

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { blcColors } from '../../theme';

/**
 * Common ThemeToggle component
 * Props:
 *  - mode: 'light' | 'dark'
 *  - toggleMode: function to toggle mode
 *  - sx: optional extra styles
 */
export const ThemeToggle = ({ mode, toggleMode, sx = {} }) => {
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton
        id="theme-toggle-btn"
        onClick={toggleMode}
        size="small"
        sx={{
          color: isDark ? '#94a3b8' : blcColors.textMid,
          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          border: `1px solid ${isDark ? blcColors.darkBorder : '#d1d9f0'}`,
          ...sx,
        }}
      >
        {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};
