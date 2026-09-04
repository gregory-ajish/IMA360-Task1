// AppCard.jsx
// ============================================================================
// PURPOSE:
//   An interactive, theme-aware card component representing an application, service,
//   tool, or feature tile.
//   Supports both direct props (title, description, icon, onClick) and object-based
//   props (app, onCardClick) for backwards compatibility.
// ============================================================================

import React from 'react';
import { Card, CardActionArea, Box, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AppIcon } from './AppIcon';
import { blcColors } from '../../theme';

/**
 * AppCard Component
 *
 * @component
 * @param {Object} props
 * @param {Object} [props.app] - Legacy application data object { id, title, description, icon }
 * @param {number|string} [props.id] - Unique ID of the card item
 * @param {string} [props.title] - Display name of the item
 * @param {string} [props.description] - Description or summary text
 * @param {string|React.ReactNode} [props.icon] - Icon name string or custom React element
 * @param {string|React.ReactNode} [props.badge] - Optional badge/tag label (e.g. "Core", "Beta")
 * @param {boolean} [props.isDark] - Dark mode flag (defaults to current MUI theme mode)
 * @param {Function} [props.onClick] - Click handler triggered on click or keyboard Enter/Space
 * @param {Function} [props.onCardClick] - Legacy click handler receiving `app` object
 * @param {Object} [props.sx] - Additional MUI sx styling overrides
 */
export const AppCard = ({
  app,
  id,
  title,
  description,
  icon,
  badge,
  isDark: propIsDark,
  onClick,
  onCardClick,
  sx = {},
}) => {
  const theme = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : theme.palette.mode === 'dark';

  // Normalize props between modern decoupled props and legacy `app` object
  const cardId = id ?? app?.id ?? 'card';
  const cardTitle = title ?? app?.title ?? '';
  const cardDescription = description ?? app?.description ?? '';
  const cardIcon = icon ?? app?.icon;

  const handleClick = () => {
    if (onClick) {
      onClick(app || { id: cardId, title: cardTitle, description: cardDescription, icon: cardIcon });
    } else if (onCardClick && app) {
      onCardClick(app);
    }
  };

  return (
    <Card
      id={`app-card-${cardId}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? blcColors.darkCard : '#ffffff',
        border: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
        '&:hover': {
          borderColor: blcColors.navyAccent,
          bgcolor: isDark ? blcColors.darkCardHover : '#f8f9ff',
          boxShadow: isDark
            ? '0 8px 28px rgba(30,58,138,0.25)'
            : '0 6px 20px rgba(30,58,138,0.12)',
          transform: 'translateY(-3px)',
        },
        ...sx,
      }}
    >
      <CardActionArea
        onClick={handleClick}
        sx={{
          flexGrow: 1,
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          height: '100%',
        }}
      >
        {/* Header row with Icon and optional Badge */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          {/* Icon Container */}
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
              border: `1px solid ${isDark ? `${blcColors.navyAccent}40` : `${blcColors.navyAccent}25`}`,
            }}
          >
            {typeof cardIcon === 'string' ? (
              <AppIcon name={cardIcon} sx={{ fontSize: 22 }} />
            ) : (
              cardIcon || <AppIcon name="Apps" sx={{ fontSize: 22 }} />
            )}
          </Box>

          {/* Optional Badge / Status tag */}
          {badge && (
            <Chip
              label={badge}
              size="small"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.7rem',
                fontWeight: 600,
                height: 22,
                bgcolor: isDark ? 'rgba(30,58,138,0.3)' : 'rgba(30,58,138,0.08)',
                color: isDark ? '#93c5fd' : blcColors.navyAccent,
                border: `1px solid ${isDark ? 'rgba(30,58,138,0.4)' : 'transparent'}`,
              }}
            />
          )}
        </Box>

        {/* Card Title */}
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
          {cardTitle}
        </Typography>

        {/* Card Description */}
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.8rem',
            color: isDark ? '#64748b' : blcColors.textMid,
            lineHeight: 1.55,
          }}
        >
          {cardDescription}
        </Typography>
      </CardActionArea>
    </Card>
  );
};

export default AppCard;
