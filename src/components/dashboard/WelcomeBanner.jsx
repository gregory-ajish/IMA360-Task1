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
export const WelcomeBanner = ({ userName, isDark, role, isAdmin }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        p: { xs: 3, md: 4 },
        mb: 4,
        background: isDark
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : `linear-gradient(135deg, ${blcColors.navyPrimary} 0%, ${blcColors.navyAccent} 100%)`,
        border: `1px solid ${isDark ? blcColors.darkBorder : 'transparent'}`,
        boxShadow: isDark
          ? '0 10px 30px rgba(0,0,0,0.5)'
          : '0 10px 30px rgba(30,58,138,0.25)',
      }}
    >
      {/* Micro-grid background texture overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.08 : 0.12,
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }}
      />

      {/* ── Banner Text Content ── */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Accent eyebrow title badge */}
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: blcColors.yellowAccent,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          ✦ Workspace Overview ✦
        </Typography>

        {/* Personalized Welcome Headline */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 800,
            fontSize: { xs: '1.5rem', md: '2rem' },
            color: '#ffffff',
            mb: 0.75,
          }}
        >
          Welcome back, {userName || 'Explorer'}!
        </Typography>

        {/* Role Badge */}
        {role && (
          <Chip
            icon={isAdmin ? <AdminIcon sx={{ fontSize: 16 }} /> : <ViewIcon sx={{ fontSize: 16 }} />}
            label={isAdmin ? 'Admin Access' : 'Viewer Access'}
            size="small"
            sx={{
              mt: 1,
              mb: 2,
              height: 26,
              fontSize: '0.72rem',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              bgcolor: isAdmin
                ? 'rgba(34, 197, 94, 0.15)'
                : 'rgba(234, 179, 8, 0.15)',
              color: isAdmin ? '#4ade80' : '#fbbf24',
              border: `1px solid ${isAdmin ? 'rgba(34, 197, 94, 0.35)' : 'rgba(234, 179, 8, 0.35)'}`,
              '& .MuiChip-icon': {
                color: isAdmin ? '#4ade80' : '#fbbf24',
              },
            }}
          />
        )}

        {/* Subtitle / Portal Summary */}
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.9rem',
            color: '#94a3b8',
            maxWidth: 560,
          }}
        >
          Discover, launch, and manage all your team tools in one centralized portal.
        </Typography>
      </Box>
    </Paper>
  );
};
