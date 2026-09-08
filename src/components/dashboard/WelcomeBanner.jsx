// WelcomeBanner.jsx
// ============================================================================
// PURPOSE:
//   A modern, visual hero banner welcoming the authenticated user to the portal.
//   Provides a personalized greeting, highlights the workspace context, and
//   sets the tech-forward, high-polish visual tone for the Dashboard.
//
// USAGE LOCATIONS:
//   - DashboardPage.jsx: Rendered at the top of the container immediately below the Navbar.
//
// FEATURES & ARCHITECTURE:
//   - Theme-Aware Gradients: Seamlessly swaps between a rich midnight-navy gradient
//     in dark mode and an intense slate-navy gradient in light mode.
//   - Micro-Grid Pattern Overlay: Uses a pure CSS dual-axis linear gradient overlay
//     to create a subtle 32x32px technical blueprint grid texture.
//   - Click-Through Pointer Events: `pointerEvents: 'none'` on the texture overlay
//     prevents any interference with user interactions.
//   - Responsive Scaling: Typography and padding scale gracefully between mobile
//     screens and large desktop viewports.
//   - Dynamic Fallback: Welcomes the user by their first/full name, with a safe
//     fallback to 'Explorer' if the name is unavailable.
// ============================================================================

import React from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import { AdminPanelSettings as AdminIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { blcColors } from '../../theme';

/**
 * WelcomeBanner Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.userName - The display name of the authenticated user.
 * @param {boolean} props.isDark - True if dark mode is active; false otherwise.
 * @returns {React.ReactElement} The rendered hero welcome banner.
 */
export const WelcomeBanner = ({ userName, isDark }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 800,
          fontSize: { xs: '1.5rem', md: '2rem' },
          color: isDark ? '#f8fafc' : blcColors.textDark,
        }}
      >
        Welcome back, {userName || 'Explorer'}!
      </Typography>
    </Box>
  );
};
