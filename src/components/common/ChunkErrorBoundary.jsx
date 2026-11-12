// ChunkErrorBoundary.jsx
// ============================================================================
// PURPOSE:
//   React Error Boundary wrapping <Suspense> around lazy-loaded routes.
//   If a bundle/chunk still fails to load after the automatic once-per-session
//   refresh (e.g., offline Wi-Fi or proxy block), this catches the error and
//   renders a clean recovery card so the user can manually reload or recover.
// ============================================================================

import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { blcColors, typographyTokens } from '../../theme';
import { AppButton } from './AppButton';
import { ErrorOutlineIcon, RefreshIcon, WarningAmberIcon } from '../../icons';
import { isChunkLoadError } from '../../utils/chunkErrorHandler';

/**
 * Theme-aware recovery UI rendered when ChunkErrorBoundary catches an error.
 */
const ChunkRecoveryCard = ({ error, onRetry }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const chunkError = isChunkLoadError(error);

  const handleHardReload = () => {
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        bgcolor: isDark ? blcColors.darkBg : blcColors.cream,
      }}
    >
      <Card
        sx={{
          maxWidth: 460,
          width: '100%',
          p: 4,
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
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 2.5,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: chunkError
              ? isDark
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(245, 158, 11, 0.1)'
              : isDark
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${
              chunkError
                ? isDark
                  ? 'rgba(245, 158, 11, 0.35)'
                  : 'rgba(245, 158, 11, 0.25)'
                : isDark
                ? 'rgba(239, 68, 68, 0.35)'
                : 'rgba(239, 68, 68, 0.25)'
            }`,
            color: chunkError ? '#f59e0b' : '#ef4444',
          }}
        >
          {chunkError ? (
            <WarningAmberIcon sx={{ fontSize: 30 }} />
          ) : (
            <ErrorOutlineIcon sx={{ fontSize: 30 }} />
          )}
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontFamily: typographyTokens.fontMono,
            fontWeight: typographyTokens.weightBold,
            color: isDark ? '#f1f5f9' : blcColors.textDark,
            mb: 1,
          }}
        >
          {chunkError ? 'Unable to Load Page Bundle' : 'Something Went Wrong'}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontFamily: typographyTokens.fontSans,
            color: isDark ? '#94a3b8' : blcColors.textMid,
            lineHeight: 1.6,
            mb: 3,
          }}
        >
          {chunkError
            ? 'A required application file failed to load. This can happen after a new release, a temporary network drop, or a blocked script request.'
            : 'An unexpected error occurred while rendering this page. Reloading the page should restore your session.'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!chunkError && onRetry && (
            <AppButton variant="secondary" size="medium" onClick={onRetry}>
              Try Again
            </AppButton>
          )}
          <AppButton
            variant="primary"
            size="medium"
            startIcon={<RefreshIcon />}
            onClick={handleHardReload}
          >
            Reload Page
          </AppButton>
        </Box>
      </Card>
    </Box>
  );
};

export class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ChunkErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ChunkRecoveryCard error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
