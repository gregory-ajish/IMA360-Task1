import React from 'react';
// Material-UI primitive components used to construct the card layout
import { Card, CardActionArea, Box, Typography, Chip } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
// Hook to read active MUI theme values (like current mode 'light' or 'dark')
import { useTheme } from '@mui/material/styles';
// Reusable dynamic icon resolver component
import { AppIcon } from './AppIcon';
// Design system tokens for colors and typography
import { blcColors, typographyTokens } from '../../theme';

/**
 * AppCard Component
 *
 * @component
 * @param {Object} props
 * @param {Object} [props.app] - Legacy application data object { id, title, description, icon, adminOnly }
 * @param {number|string} [props.id] - Unique ID of the card item
 * @param {string} [props.title] - Display name of the item
 * @param {string} [props.description] - Description or summary text
 * @param {string|React.ReactNode} [props.icon] - Icon name string or custom React element
 * @param {string|React.ReactNode} [props.badge] - Optional badge/tag label (e.g. "Core", "Beta")
 * @param {boolean} [props.adminOnly] - Restricted to Admin role only
 * @param {boolean} [props.isAdmin] - Whether current user has Admin role
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
  adminOnly,
  isAdmin = false,
  isDark: propIsDark,
  onClick,
  onCardClick,
  sx = {},
}) => {
  // Access current MUI theme from context
  const theme = useTheme();

  // Determine dark mode: prefer explicit prop if passed, otherwise read from MUI theme context
  const isDark = propIsDark !== undefined ? propIsDark : theme.palette.mode === 'dark';

  // Normalize props: allows component to accept either separate props OR an `app` object
  const cardId = id ?? app?.id ?? 'card';
  const cardTitle = title ?? app?.title ?? '';
  const cardDescription = description ?? app?.description ?? '';
  const cardIcon = icon ?? app?.icon;
  const isAdminOnly = adminOnly ?? app?.adminOnly ?? false;

  // Determine restriction state
  const isRestricted = isAdminOnly && !isAdmin;

  // Handles click events from both mouse clicks and keyboard (Enter/Space on CardActionArea)
  const handleClick = () => {
    if (onClick) {
      onClick(app || { id: cardId, title: cardTitle, description: cardDescription, icon: cardIcon, adminOnly: isAdminOnly });
    } else if (onCardClick && app) {
      onCardClick(app);
    }
  };

  return (
    // Outer Card Container
    <Card
      id={`app-card-${cardId}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? blcColors.darkCard : '#ffffff',
        border: `1px solid ${
          isRestricted
            ? (isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)')
            : (isDark ? blcColors.darkBorder : '#e0e5f2')
        }`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
        opacity: isRestricted ? 0.82 : 1,
        '&:hover': {
          borderColor: isRestricted ? '#ef4444' : blcColors.navyAccent,
          bgcolor: isDark
            ? (isRestricted ? 'rgba(239, 68, 68, 0.06)' : blcColors.darkCardHover)
            : (isRestricted ? '#fef2f2' : '#f8f9ff'),
          boxShadow: isDark
            ? (isRestricted ? '0 8px 28px rgba(239, 68, 68, 0.2)' : '0 8px 28px rgba(30,58,138,0.25)')
            : (isRestricted ? '0 6px 20px rgba(239, 68, 68, 0.12)' : '0 6px 20px rgba(30,58,138,0.12)'),
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
        {/* Header row containing the Card Icon and optional Status Badge */}
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
              bgcolor: isRestricted
                ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)')
                : (isDark ? 'rgba(30,58,138,0.2)' : `${blcColors.navyAccent}12`),
              color: isRestricted
                ? (isDark ? '#fca5a5' : '#dc2626')
                : (isDark ? '#7eb8f7' : blcColors.navyAccent),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${
                isRestricted
                  ? (isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)')
                  : (isDark ? `${blcColors.navyAccent}40` : `${blcColors.navyAccent}25`)
              }`,
            }}
          >
            {typeof cardIcon === 'string' ? (
              <AppIcon name={cardIcon} sx={{ fontSize: 22 }} />
            ) : (
              cardIcon || <AppIcon name="Apps" sx={{ fontSize: 22 }} />
            )}
          </Box>

          {/* Badge / Lock Status tag */}
          {isRestricted ? (
            <Chip
              icon={<LockOutlinedIcon style={{ fontSize: 13, color: isDark ? '#fca5a5' : '#dc2626' }} />}
              label="Admin Only"
              size="small"
              sx={{
                fontFamily: typographyTokens.fontMono,
                fontSize: '0.68rem',
                fontWeight: typographyTokens.weightBold,
                height: 22,
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                color: isDark ? '#fca5a5' : '#dc2626',
                border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.35)' : '#fca5a5'}`,
                '& .MuiChip-icon': {
                  marginLeft: '4px',
                },
              }}
            />
          ) : isAdminOnly && isAdmin ? (
            <Chip
              icon={<AdminPanelSettingsIcon style={{ fontSize: 13, color: isDark ? '#c084fc' : '#7e22ce' }} />}
              label="Admin"
              size="small"
              sx={{
                fontFamily: typographyTokens.fontMono,
                fontSize: '0.68rem',
                fontWeight: typographyTokens.weightBold,
                height: 22,
                bgcolor: isDark ? 'rgba(147, 51, 234, 0.2)' : '#f3e8ff',
                color: isDark ? '#d8b4fe' : '#7e22ce',
                border: `1px solid ${isDark ? 'rgba(147, 51, 234, 0.35)' : '#d8b4fe'}`,
                '& .MuiChip-icon': {
                  marginLeft: '4px',
                },
              }}
            />
          ) : badge ? (
            <Chip
              label={badge}
              size="small"
              sx={{
                fontFamily: typographyTokens.fontMono,
                fontSize: typographyTokens.fontSizeXs,
                fontWeight: typographyTokens.weightSemiBold,
                height: 22,
                bgcolor: isDark ? 'rgba(30,58,138,0.3)' : 'rgba(30,58,138,0.08)',
                color: isDark ? '#93c5fd' : blcColors.navyAccent,
                border: `1px solid ${isDark ? 'rgba(30,58,138,0.4)' : 'transparent'}`,
              }}
            />
          ) : null}
        </Box>

        {/* Card Title */}
        <Typography
          sx={{
            fontFamily: typographyTokens.fontMono,
            fontWeight: typographyTokens.weightBold,
            fontSize: typographyTokens.fontSizeBase,
            color: isDark ? '#e2e8f0' : blcColors.textDark,
            mb: 0.75,
            lineHeight: typographyTokens.lineHeightTight,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
        >
          {cardTitle}
        </Typography>

        {/* Card Description */}
        <Typography
          sx={{
            fontFamily: typographyTokens.fontSans,
            fontSize: typographyTokens.fontSizeSm,
            color: isDark ? '#64748b' : blcColors.textMid,
            lineHeight: typographyTokens.lineHeightNormal,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: '2.3rem',
          }}
        >
          {cardDescription}
        </Typography>
      </CardActionArea>
    </Card>
  );
};

export default AppCard;
