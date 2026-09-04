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
import { Paper, Box, Typography } from '@mui/material';
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
    // Outer banner paper container:
    // elevation={0}: avoids standard generic drop shadow in favor of custom ambient glow
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 }, // Responsive padding: compact on phones, spacious on desktop
        borderRadius: '12px',
        // Dynamic gradient: midnight-blue in dark mode; deep navy-slate in light mode
        background: isDark
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : `linear-gradient(135deg, ${blcColors.navyAccent} 0%, #0f172a 100%)`,
        color: '#ffffff',
        mb: 4,
        position: 'relative',
        overflow: 'hidden', // Clips decorative grid lines that exceed the rounded corners
        boxShadow: isDark ? '0 4px 32px rgba(15, 52, 96, 0.4)' : 'none',
      }}
    >
      {/* ── Decorative Grid Overlay ──
          Creates an engineering/blueprint grid motif behind the typography.
          pointerEvents: 'none' ensures that user clicks and interactions pass through unharmed. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }}
      />

      {/* ── Banner Text Content ──
          position: 'relative' and zIndex: 1 places text on top of the background grid texture. */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Accent eyebrow title badge */}
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: blcColors.yellowAccent, // High-contrast warm accent color
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
            fontSize: { xs: '1.5rem', md: '2rem' }, // Responsive font scaling
            color: '#ffffff',
            mb: 0.75,
          }}
        >
          Welcome back, {userName || 'Explorer'}!
        </Typography>

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

