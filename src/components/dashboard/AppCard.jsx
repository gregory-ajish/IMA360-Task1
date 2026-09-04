// AppCard.jsx
// ============================================================================
// PURPOSE:
//   An interactive card component representing a single enterprise tool or service.
//   Rendered inside the categorized app grid on the main DashboardPage.
//
// USAGE LOCATIONS:
//   - DashboardPage.jsx: Mapped across categories and rendered inside MUI Grid items.
//
// FEATURES & ARCHITECTURE:
//   - Dynamic Iconography: Uses <AppIcon> to map string names to MUI icon components.
//   - Micro-Interactions: Elevates slightly (-3px Y-translate) on hover with a branded
//     shadow glow and subtle border color transition.
//   - Accessibility: Wrapped with MUI's <CardActionArea> for native keyboard focus,
//     tab indexing, and ripple click animations.
//   - Theme Sensitivity: Seamlessly adapts card background, border, and typography
//     between Light and Dark modes.
// ============================================================================

import React from 'react';
import { Card, CardActionArea, Box, Typography } from '@mui/material';
import { AppIcon } from '../AppIcon';
import { blcColors } from '../../theme';

/**
 * AppCard Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.app - The application data object.
 * @param {number|string} props.app.id - Unique ID of the application.
 * @param {string} props.app.title - Display name of the enterprise application.
 * @param {string} props.app.description - Brief summary explaining the application's capabilities.
 * @param {string} props.app.icon - Icon identifier string matching an entry in AppIcon.jsx.
 * @param {boolean} props.isDark - True if the dark theme is active; false otherwise.
 * @param {Function} props.onCardClick - Callback triggered when the card is clicked or activated with Enter/Space.
 * @returns {React.ReactElement} The rendered application card component.
 */
export const AppCard = ({ app, isDark, onCardClick }) => {
  return (
    // Outer Card container: handles structural layout, rounded borders, and hover micro-animations
    <Card
      id={`app-card-${app.id}`}
      sx={{
        height: '100%', // Fills the entire vertical grid cell height
        display: 'flex',
        flexDirection: 'column',
        // Theme-aware surface background
        bgcolor: isDark ? blcColors.darkCard : '#ffffff',
        // Subtle outline border to distinguish card edges
        border: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease', // Smooth transition for hover effects
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
        // Hover state: highlights border, tints card background, applies lift & shadow
        '&:hover': {
          borderColor: blcColors.navyAccent,
          bgcolor: isDark ? blcColors.darkCardHover : '#f8f9ff',
          boxShadow: isDark
            ? '0 8px 28px rgba(30,58,138,0.25)' // Atmospheric blue glow in dark mode
            : '0 6px 20px rgba(30,58,138,0.12)', // Soft ambient drop shadow in light mode
          transform: 'translateY(-3px)', // Tactile lift feedback
        },
      }}
    >
      {/* CardActionArea provides native button semantics and keyboard accessibility (Enter/Space to launch) */}
      <CardActionArea
        onClick={() => onCardClick(app)}
        sx={{
          flexGrow: 1,
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start', // Left-aligned content structure
          height: '100%',
        }}
      >
        {/* ── App Icon Container ── */}
        {/* Rounded square container with tinted background matching the icon */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            bgcolor: isDark ? 'rgba(30,58,138,0.2)' : `${blcColors.navyAccent}12`,
            color: isDark ? '#7eb8f7' : blcColors.navyAccent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            border: `1px solid ${isDark ? `${blcColors.navyAccent}40` : `${blcColors.navyAccent}25`}`,
          }}
        >
          {/* Dynamically loads vector icon from MUI icon registry */}
          <AppIcon name={app.icon} sx={{ fontSize: 22 }} />
        </Box>

        {/* ── App Title ── */}
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: isDark ? '#e2e8f0' : blcColors.textDark,
            mb: 0.75,
            lineHeight: 1.3,
          }}
        >
          {app.title}
        </Typography>

        {/* ── App Description ── */}
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.8rem',
            color: isDark ? '#64748b' : blcColors.textMid,
            lineHeight: 1.55,
          }}
        >
          {app.description}
        </Typography>
      </CardActionArea>
    </Card>
  );
};

