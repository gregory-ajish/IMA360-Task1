// PageHeader.jsx
// ============================================================================
// PURPOSE:
//   Reusable, theme-aware page header bar with back navigation, breadcrumbs,
//   page icon badge, title, and optional right-side action buttons.
//   Eliminates ~75 lines of duplicated JSX from each table/page component.
//
// USAGE:
//   <PageHeader
//     icon={<InsightsIcon />}
//     title="Customer Insights — Interactive Ledger"
//     breadcrumb="Customer Insights"
//     isDark={isDark}
//     actions={<AppButton>Save</AppButton>}
//   />
// ============================================================================

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBackIcon } from '../../icons';
import { blcColors, typographyTokens } from '../../theme';
import { AppBreadcrumbs } from './AppBreadcrumbs';

/**
 * PageHeader Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.icon - Icon element displayed in the title badge (e.g. <InsightsIcon />).
 * @param {string} props.title - Page title displayed next to the icon badge.
 * @param {string} [props.breadcrumb] - Current page name shown in the breadcrumb trail.
 * @param {Array<{label: string, to?: string, onClick?: Function}>} [props.breadcrumbItems] - Optional full breadcrumbs trail.
 * @param {boolean} [props.isDark=false] - Whether dark mode is active.
 * @param {React.ReactNode} [props.actions] - Optional right-side action buttons (e.g. Save, Reset).
 * @param {string} [props.backTo='/home'] - Navigation target for the back button.
 * @param {string} [props.backTooltip='Back to Dashboard'] - Tooltip text for the back button.
 * @param {string} [props.parentLabel='Dashboard'] - Label for the parent breadcrumb link.
 * @returns {React.ReactElement} The rendered page header bar.
 */
export const PageHeader = ({
  icon,
  title,
  breadcrumb,
  breadcrumbItems,
  isDark = false,
  actions,
  backTo = '/home',
  backTooltip = 'Back to Dashboard',
  parentLabel = 'Dashboard',
}) => {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        px: 3,
        mb: 2.5,
        borderRadius: '12px',
        bgcolor: isDark ? blcColors.darkCard : '#ffffff',
        color: isDark ? '#e2e8f0' : blcColors.textDark,
        border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      {/* Left side: Back button + Breadcrumbs + Icon badge + Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title={backTooltip}>
          <IconButton
            onClick={() => navigate(backTo)}
            sx={{
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
              color: isDark ? '#e2e8f0' : '#334155',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Box>
          <AppBreadcrumbs
            items={breadcrumbItems}
            parentLabel={parentLabel}
            backTo={backTo}
            current={breadcrumb}
            sx={{ mb: title ? 0.5 : 0 }}
          />

          {title && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {icon && (
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: `${blcColors.navyAccent}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: blcColors.navyAccent,
                  }}
                >
                  {React.cloneElement(icon, { fontSize: 'small' })}
                </Box>
              )}
              <Typography
                variant="h5"
                sx={{
                  fontFamily: typographyTokens.fontMono,
                  fontWeight: typographyTokens.weightBold,
                  color: isDark ? '#f1f5f9' : blcColors.navyAccent,
                }}
              >
                {title}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Right side: Optional action buttons */}
      {actions && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {actions}
        </Box>
      )}
    </Paper>
  );
};
