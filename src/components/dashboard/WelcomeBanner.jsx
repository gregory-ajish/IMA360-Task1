// WelcomeBanner.jsx
// PURPOSE: Hero section banner welcoming the authenticated user.
// Displays workspace overview heading, user's name, and portal description.
//
// FEATURES:
//   - Mode-aware gradient background (navy/midnight in dark mode)
//   - Subtle CSS grid pattern overlay for a technical aesthetic
//   - Fully responsive typography

import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { blcColors } from '../../theme';

/**
 * Common WelcomeBanner component
 * Props:
 *  - userName: string
 *  - isDark: boolean
 */
export const WelcomeBanner = ({ userName, isDark }) => {
  return (
    // Outer banner paper container:
    // elevation={0}: removes standard shadow in favor of a customized ambient blur
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 }, // Responsive padding: compact on mobile, spacious on desktop
        borderRadius: '12px',
        // Dynamic gradient: navy-midnight in dark mode; navy-charcoal in light mode
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
          Creates an engineer/technical grid motif behind the typography.
          pointerEvents: 'none' ensures that user clicks and interactions pass through. */}
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
          position: 'relative' and zIndex: 1 places this content on top of the grid overlay. */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Accent eyebrow title */}
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: blcColors.yellowAccent, // High-contrast accent color
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

        {/* Subtitle / Description */}
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
