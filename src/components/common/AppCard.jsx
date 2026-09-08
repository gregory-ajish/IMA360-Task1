// AppCard.jsx
// ============================================================================
// PURPOSE:
//   An interactive, theme-aware card component representing an application, service,
//   tool, or feature tile on the dashboard grid.
//
// WHY IT EXISTS:
//   Standardizes how cards appear across the entire application:
//   - Uniform dimensions, padding, rounded corners, and hover lift effects.
//   - Theme switching (adjusts background, text, and border colors automatically).
//   - Accessibility (keyboard focus, screen readers, semantic buttons via CardActionArea).
//   - Supports both direct props (title, description, icon, onClick) and legacy
//     data objects ({ app: { id, title, description, icon } }).
// ============================================================================

import React from 'react';
// Material-UI primitive components used to construct the card layout
import { Card, CardActionArea, Box, Typography, Chip } from '@mui/material';
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
  // Access current MUI theme from context
  const theme = useTheme();

  // Determine dark mode: prefer explicit prop if passed, otherwise read from MUI theme context
  const isDark = propIsDark !== undefined ? propIsDark : theme.palette.mode === 'dark';

  // Normalize props: allows component to accept either separate props OR an `app` object
  // Nullish coalescing (??) falls back safely if a property is undefined or null
  const cardId = id ?? app?.id ?? 'card';
  const cardTitle = title ?? app?.title ?? '';
  const cardDescription = description ?? app?.description ?? '';
  const cardIcon = icon ?? app?.icon;

  // Handles click events from both mouse clicks and keyboard (Enter/Space on CardActionArea)
  // Sends back either the normalized object to onClick OR the original app to legacy onCardClick
  const handleClick = () => {
    if (onClick) {
      onClick(app || { id: cardId, title: cardTitle, description: cardDescription, icon: cardIcon });
    } else if (onCardClick && app) {
      onCardClick(app);
    }
  };

  return (
    // Outer Card Container
    // Sets up full-height flex column layout with custom borders, rounded corners, and hover lift
    <Card
      id={`app-card-${cardId}`}
      sx={{
        height: '100%', // Fills grid cell height completely so all cards in a row match
        display: 'flex', // Flexbox container
        flexDirection: 'column', // Vertical stack for contents
        bgcolor: isDark ? blcColors.darkCard : '#ffffff', // Theme-responsive card background
        border: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`, // Subtle card outline
        borderRadius: '12px', // Modern curved corners
        cursor: 'pointer', // Indicates card is interactive
        transition: 'all 0.22s ease', // Smooth transition for hover effects
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.35)' : 'none', // Ambient shadow in dark mode
        '&:hover': {
          borderColor: blcColors.navyAccent, // Highlight border on hover with brand navy
          bgcolor: isDark ? blcColors.darkCardHover : '#f8f9ff', // Gentle background tint on hover
          boxShadow: isDark
            ? '0 8px 28px rgba(30,58,138,0.25)' // Glow effect in dark mode
            : '0 6px 20px rgba(30,58,138,0.12)', // Soft navy elevation in light mode
          transform: 'translateY(-3px)', // Physical 3px lift effect on hover
        },
        ...sx, // Custom overrides from caller
      }}
    >
      {/* 
        CardActionArea wraps the card contents in an accessible button element.
        It provides keyboard navigation (Tab + Enter/Space) and a native ripple click effect.
      */}
      <CardActionArea
        onClick={handleClick}
        sx={{
          flexGrow: 1, // Expands to fill the entire card body
          p: 2.5, // 20px internal padding around content
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start', // Align contents to the left
          height: '100%',
        }}
      >
        {/* Header row containing the Card Icon and optional Status Badge */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between', // Pushes icon to left and badge to right
            mb: 2, // 16px bottom margin separating header from title
          }}
        >
          {/* Icon Container: square badge with rounded corners and brand-tinted background */}
          <Box
            sx={{
              width: 44, // 44px fixed width
              height: 44, // 44px fixed height
              borderRadius: '10px', // Slightly rounded square
              bgcolor: isDark ? 'rgba(30,58,138,0.2)' : `${blcColors.navyAccent}12`, // Translucent brand blue fill
              color: isDark ? '#7eb8f7' : blcColors.navyAccent, // Icon glyph color
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center', // Centers icon inside box
              border: `1px solid ${isDark ? `${blcColors.navyAccent}40` : `${blcColors.navyAccent}25`}`,
            }}
          >
            {/* If cardIcon is a string name, render using AppIcon component; otherwise render custom React node */}
            {typeof cardIcon === 'string' ? (
              <AppIcon name={cardIcon} sx={{ fontSize: 22 }} />
            ) : (
              cardIcon || <AppIcon name="Apps" sx={{ fontSize: 22 }} />
            )}
          </Box>

          {/* Optional Badge / Status tag: rendered only if badge prop is provided */}
          {badge && (
            <Chip
              label={badge}
              size="small"
              sx={{
                fontFamily: typographyTokens.fontMono, // Monospace font for tags/chips
                fontSize: typographyTokens.fontSizeXs, // 12px font size
                fontWeight: typographyTokens.weightSemiBold, // 600 weight
                height: 22, // Compact badge height
                bgcolor: isDark ? 'rgba(30,58,138,0.3)' : 'rgba(30,58,138,0.08)',
                color: isDark ? '#93c5fd' : blcColors.navyAccent,
                border: `1px solid ${isDark ? 'rgba(30,58,138,0.4)' : 'transparent'}`,
              }}
            />
          )}
        </Box>

        {/* 
          Card Title (Single Line Enforced)
          If the title is too long for the card width, it truncates with an ellipsis (...)
        */}
        <Typography
          sx={{
            fontFamily: typographyTokens.fontMono, // Monospace font for card titles
            fontWeight: typographyTokens.weightBold, // 700 bold weight
            fontSize: typographyTokens.fontSizeBase, // 14px font size
            color: isDark ? '#e2e8f0' : blcColors.textDark, // High contrast text color
            mb: 0.75, // Bottom margin to space out title from description
            lineHeight: typographyTokens.lineHeightTight, // 1.25 line height
            whiteSpace: 'nowrap', // Prevents title from wrapping to a second line
            overflow: 'hidden', // Hides characters exceeding container width
            textOverflow: 'ellipsis', // Appends '...' when title overflows
            width: '100%', // Takes full width of card
          }}
        >
          {cardTitle}
        </Typography>

        {/* 
          Card Description (Enforced exactly 2 lines with trailing ellipsis dots)
          - Uses CSS -webkit-line-clamp: 2 to limit text to 2 lines
          - Uses fixed height: '2.3rem' to ensure uniform height across all cards in the grid
        */}
        <Typography
          sx={{
            fontFamily: typographyTokens.fontSans, // Inter sans-serif font for readable body text
            fontSize: typographyTokens.fontSizeSm, // 13.1px font size
            color: isDark ? '#64748b' : blcColors.textMid, // Subdued gray text
            lineHeight: typographyTokens.lineHeightNormal, // 1.5 line height for comfortable reading
            display: '-webkit-box', // Required layout box for line clamp
            WebkitLineClamp: 2, // Limits text strictly to 2 lines
            WebkitBoxOrient: 'vertical', // Required vertical orientation for WebkitLineClamp
            overflow: 'hidden', // Hides any text beyond the 2nd line
            textOverflow: 'ellipsis', // Displays '...' at the end of the 2nd line if truncated
            height: '2.3rem', // Fixed height keeps all cards equal height even if description is 1 line
          }}
        >
          {cardDescription}
        </Typography>
      </CardActionArea>
    </Card>
  );
};

export default AppCard;
