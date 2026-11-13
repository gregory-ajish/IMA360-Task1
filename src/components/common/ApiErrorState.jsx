// ApiErrorState.jsx
// ============================================================================
// PURPOSE:
//   Category 4.b UI component for failed network and API requests:
//   "Don't leave a loading spinner spinning forever. Stop the spinner and let the user click Retry."
//
// FEATURES:
//   - Theme-aware design matching AppCard and ErrorRecoveryCard design tokens.
//   - Displays human-readable message for 5xx, timeouts, or offline errors.
//   - Provides a prominent "Retry" button to re-trigger the API fetch.
// ============================================================================

import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { blcColors, typographyTokens } from '../../theme';
import { AppButton } from './AppButton';
import { RefreshIcon, WarningAmberIcon, ErrorOutlineIcon, WifiOffIcon } from '../../icons';

export const ApiErrorState = ({
  error,
  title,
  message,
  onRetry,
  compact = false,
  minHeight = 240,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const status = error?.response?.status;
  const isOffline =
    error?.isOffline ||
    (!error?.response && typeof navigator !== 'undefined' && !navigator.onLine);
  const isTimeout =
    error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
  const isServer = status >= 500 && status <= 599;

  // Determine title & message
  const displayTitle =
    title ||
    (isOffline
      ? 'No Internet Connection'
      : isTimeout
      ? 'Request Timed Out'
      : isServer
      ? 'Server Temporarily Unavailable'
      : 'Unable to Load Data');

  const displayMessage =
    message ||
    (isOffline
      ? 'Your device appears to be offline. Please check your Wi-Fi or network connection and retry.'
      : isTimeout
      ? 'The server took too long to answer. Please check your network and try again.'
      : isServer
      ? `The server returned an error (${status || 500}). Our team has been alerted.`
      : error?.message || 'An unexpected error occurred while fetching data. Click Retry to try again.');

  const iconColor = isServer ? '#ef4444' : '#f59e0b';
  const iconBg = isServer
    ? isDark
      ? 'rgba(239, 68, 68, 0.18)'
      : 'rgba(239, 68, 68, 0.1)'
    : isDark
    ? 'rgba(245, 158, 11, 0.18)'
    : 'rgba(245, 158, 11, 0.1)';

  const renderIcon = () => {
    if (isOffline) {
      return <WifiOffIcon sx={{ fontSize: compact ? 24 : 28 }} />;
    }
    if (isServer) {
      return <ErrorOutlineIcon sx={{ fontSize: compact ? 24 : 28 }} />;
    }
    return <WarningAmberIcon sx={{ fontSize: compact ? 24 : 28 }} />;
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: compact ? 400 : 460,
          width: '100%',
          p: compact ? 3 : 4,
          borderRadius: '14px',
          textAlign: 'center',
          bgcolor: isDark ? blcColors.darkCard : '#ffffff',
          border: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`,
          boxShadow: isDark
            ? '0 10px 32px rgba(0, 0, 0, 0.45)'
            : '0 8px 28px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Box
          sx={{
            width: compact ? 44 : 52,
            height: compact ? 44 : 52,
            mx: 'auto',
            mb: 2,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: iconBg,
            color: iconColor,
            border: `1px solid ${iconColor}40`,
          }}
        >
          {renderIcon()}
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontFamily: typographyTokens.fontMono,
            fontWeight: typographyTokens.weightBold,
            fontSize: compact ? '0.95rem' : '1.15rem',
            color: isDark ? '#f1f5f9' : blcColors.textDark,
            mb: 1,
          }}
        >
          {displayTitle}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontFamily: typographyTokens.fontSans,
            fontSize: compact ? '0.8rem' : '0.85rem',
            color: isDark ? '#94a3b8' : blcColors.textMid,
            lineHeight: 1.6,
            mb: 2.5,
          }}
        >
          {displayMessage}
        </Typography>

        {onRetry && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <AppButton
              variant="primary"
              size={compact ? 'small' : 'medium'}
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Retry
            </AppButton>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default ApiErrorState;

