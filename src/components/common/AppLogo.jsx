// AppLogo.jsx
// ============================================================================
// PURPOSE:
//   A reusable, polymorphic brand logo component for the Test App Enterprise Suite.
//   It pairs a styled SVG icon (HubOutlined) with typography, supporting multiple
//   sizes, orientations (horizontal vs. vertical), and responsive subtitle displays.
//
// USAGE LOCATIONS:
//   - LoginPage.jsx: Centered vertical layout with larger icon and descriptive subtitle.
//   - Navbar.jsx: Compact horizontal layout in the sticky top application bar.
//
// FEATURES & ARCHITECTURE:
//   - Polymorphic Layouts: Supports 'horizontal' (row) and 'vertical' (column) stacking.
//   - Size Presets: Offers 'small', 'medium', and 'large' with synchronized icon/box/font scaling.
//   - Theme Adaptability: Reacts dynamically to 'isDark' mode to adjust font colors and accents.
//   - Responsive Subtitle: Automatically hides subtitles on ultra-compact mobile viewports when horizontal.
// ============================================================================

import React from 'react';
import { Box, Typography } from '@mui/material';
import { HubOutlined } from '@mui/icons-material';
import { blcColors } from '../../theme';

/**
 * AppLogo Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {boolean} [props.isDark=false] - Whether dark mode is active, switching text colors between slate and light.
 * @param {'small'|'medium'|'large'} [props.size='medium'] - Sizing preset for the logo box, icon, and font size.
 * @param {string} [props.subtitle] - Optional descriptive text rendered beneath or beside the primary title.
 * @param {'horizontal'|'vertical'} [props.layout='horizontal'] - Visual orientation of icon and text blocks.
 * @param {string} [props.title='Test App'] - Main application brand title.
 * @returns {React.ReactElement} The rendered brand logo element.
 */
export const AppLogo = ({
  isDark = false,
  size = 'medium',
  subtitle,
  layout = 'horizontal',
  title = 'Test App',
}) => {
  // Flag indicating whether elements stack vertically (used in cards/login hero) or horizontally (appbar)
  const isVertical = layout === 'vertical';

  // ── Dimension Presets ───────────────────────────────────────────────────────
  // Coordinates the outer container dimensions, icon SVG size, and typography scale
  // to ensure visual harmony across all viewport breakpoints.
  const dimensions = {
    small: { box: 36, icon: 20, titleSize: '0.95rem' },
    medium: { box: 44, icon: 24, titleSize: '1.15rem' },
    large: { box: 52, icon: 28, titleSize: '1.4rem' },
  }[size] || { box: 44, icon: 24, titleSize: '1.15rem' };

  return (
    // Outer flex wrapper: controls direction, centering, and spacing between icon & text
    <Box
      sx={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        gap: isVertical ? 1 : 1.5,
      }}
    >
      {/* ── Logo Icon Container ── */}
      {/* Rounded squircle box with navy branding and center-aligned network hub icon */}
      <Box
        sx={{
          width: dimensions.box,
          height: dimensions.box,
          borderRadius: size === 'small' ? '8px' : '12px',
          bgcolor: blcColors.navyAccent, // Brand primary navy tone
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Apply subtle glow elevation when vertically stacked in login card
          boxShadow: isVertical ? '0 4px 14px rgba(30,58,138,0.35)' : 'none',
          flexShrink: 0, // Prevents icon from collapsing in narrow flex containers
        }}
      >
        {/* Hub icon representing connected enterprise services and tools */}
        <HubOutlined sx={{ fontSize: dimensions.icon, color: '#fff' }} />
      </Box>

      {/* ── Typography Text Block ── */}
      {/* Contains main title and optional subtitle with layout-dependent alignment */}
      <Box sx={{ textAlign: isVertical ? 'center' : 'left' }}>
        {/* Main Application Title */}
        <Typography
          component="h1"
          sx={{
            fontFamily: '"JetBrains Mono", monospace', // Monospaced technical brand font
            fontWeight: 800,
            fontSize: dimensions.titleSize,
            color: isDark ? '#e2e8f0' : blcColors.navyAccent, // Adapts to theme background
            lineHeight: 1.2,
            mb: isVertical && subtitle ? 0.5 : 0, // Modest separation before subtitle in vertical stack
          }}
        >
          {title}
        </Typography>

        {/* Optional Subtitle: Displayed conditionally when provided */}
        {subtitle && (
          <Typography
            sx={{
              fontFamily: isVertical ? '"Inter", sans-serif' : '"JetBrains Mono", monospace',
              fontSize: isVertical ? '0.85rem' : '0.62rem',
              color: isDark ? '#64748b' : (isVertical ? blcColors.textMid : '#9ca3af'),
              // Responsive safeguard: hide long subtitle on mobile phones if placed in horizontal navbar
              display: isVertical ? 'block' : { xs: 'none', sm: 'block' },
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

