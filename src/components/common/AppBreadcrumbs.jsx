// AppBreadcrumbs.jsx
// ============================================================================
// PURPOSE:
//   Standardized, theme-aware Breadcrumbs navigation component.
//   Supports flexible multi-level breadcrumbs trail via `items` array or
//   convenient single parent-to-child links via `parentLabel` and `current`.
//
// USAGE EXAMPLES:
//   1. Multi-level trail with links:
//      <AppBreadcrumbs
//        items={[
//          { label: 'Dashboard', to: '/home' },
//          { label: 'Contract Ledger', to: '/contract-ledger' },
//          { label: 'Edit #1' },
//        ]}
//      />
//
//   2. Simple parent-child trail:
//      <AppBreadcrumbs
//        parentLabel="Dashboard"
//        backTo="/home"
//        current="Customer Insights"
//      />
// ============================================================================

import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { blcColors } from '../../theme';

/**
 * AppBreadcrumbs Component
 *
 * @component
 * @param {Object} props
 * @param {Array<{label: string, to?: string, onClick?: Function, icon?: React.ReactNode}>} [props.items] - List of breadcrumb items in order.
 * @param {string} [props.parentLabel='Dashboard'] - Fallback parent label if `items` is not provided.
 * @param {string} [props.backTo='/home'] - Target path for the fallback parent link.
 * @param {string} [props.current] - Current page label (active/leaf node).
 * @param {string} [props.breadcrumb] - Alias for `current` for backward compatibility.
 * @param {React.ReactNode} [props.separator='/'] - Custom separator between breadcrumbs.
 * @param {Object} [props.sx={}] - Additional MUI styling overrides.
 * @param {string} [props.fontSize='0.85rem'] - Font size of breadcrumb text.
 * @returns {React.ReactElement} The rendered breadcrumbs component.
 */
export const AppBreadcrumbs = ({
  items,
  parentLabel = 'Dashboard',
  backTo = '/home',
  current,
  breadcrumb,
  separator = '/',
  sx = {},
  fontSize = '0.85rem',
  ...rest
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette?.mode === 'dark';

  // Active leaf node label (accepts either `current` or `breadcrumb`)
  const activeLabel = current || breadcrumb;

  // Build items list: either use the passed `items` array, or fallback to parent -> current
  const breadcrumbItems = items && Array.isArray(items) && items.length > 0
    ? items
    : [
        ...(parentLabel ? [{ label: parentLabel, to: backTo }] : []),
        ...(activeLabel ? [{ label: activeLabel }] : []),
      ];

  if (!breadcrumbItems.length) {
    return null;
  }

  return (
    <MuiBreadcrumbs
      separator={
        <Typography
          component="span"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8',
            fontSize,
            userSelect: 'none',
          }}
        >
          {separator}
        </Typography>
      }
      sx={{
        fontSize,
        '& .MuiBreadcrumbs-ol': {
          flexWrap: 'wrap',
          alignItems: 'center',
        },
        ...sx,
      }}
      aria-label="breadcrumb"
      {...rest}
    >
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const isClickable = !isLast && (Boolean(item.to) || Boolean(item.onClick));

        // Click handler for link items
        const handleClick = (e) => {
          if (item.onClick) {
            e.preventDefault();
            item.onClick(e);
          } else if (item.to) {
            e.preventDefault();
            navigate(item.to);
          }
        };

        if (isClickable) {
          return (
            <Link
              key={`breadcrumb-${item.label}-${index}`}
              underline="hover"
              color="inherit"
              onClick={handleClick}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                fontSize,
                fontWeight: 500,
                color: isDark ? '#94a3b8' : '#64748b',
                transition: 'color 0.15s ease',
                '&:hover': {
                  color: isDark ? '#38bdf8' : blcColors.navyAccent,
                },
              }}
            >
              {item.icon && (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', fontSize: '1rem' }}>
                  {item.icon}
                </Box>
              )}
              {item.label}
            </Link>
          );
        }

        // Active / Leaf / Non-clickable item
        return (
          <Typography
            key={`breadcrumb-${item.label}-${index}`}
            color="text.primary"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize,
              fontWeight: isLast ? 600 : 400,
              color: isLast
                ? (isDark ? '#f8fafc' : blcColors.textDark)
                : (isDark ? '#94a3b8' : '#64748b'),
            }}
          >
            {item.icon && (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', fontSize: '1rem' }}>
                {item.icon}
              </Box>
            )}
            {item.label}
          </Typography>
        );
      })}
    </MuiBreadcrumbs>
  );
};

export default AppBreadcrumbs;
