// AppCard.jsx
// PURPOSE: Interactive card component representing a single application/tool.
// Renders inside the categorized grid on the Dashboard.
//
// FEATURES:
//   - Dynamic icon rendering via AppIcon
//   - Interactive hover animation (border highlight, lift, shadow)
//   - Accessible CardActionArea handling keyboard and click events

import React from 'react';
import { Card, CardActionArea, Box, Typography } from '@mui/material';
import { AppIcon } from '../AppIcon';
import { blcColors } from '../../theme';

/**
 * Common AppCard component
 * Props:
 *  - app: { id, title, description, icon }
 *  - isDark: boolean
 *  - onCardClick: function(app)
 */
export const AppCard = ({ app, isDark, onCardClick }) => {
  return (
    <Card
      id={`app-card-${app.id}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? blcColors.darkCard : '#ffffff',
        border: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
        '&:hover': {
          borderColor: blcColors.navyAccent,
          bgcolor: isDark ? blcColors.darkCardHover : '#f8f9ff',
          boxShadow: isDark
            ? '0 8px 28px rgba(30,58,138,0.25)'
            : '0 6px 20px rgba(30,58,138,0.12)',
          transform: 'translateY(-3px)',
        },
      }}
    >
      <CardActionArea
        onClick={() => onCardClick(app)}
        sx={{
          flexGrow: 1,
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          height: '100%',
        }}
      >
        {/* App Icon */}
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
          <AppIcon name={app.icon} sx={{ fontSize: 22 }} />
        </Box>

        {/* App Title */}
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

        {/* App Description */}
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
