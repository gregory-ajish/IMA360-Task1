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
import {
  ErrorOutlineIcon,
  RefreshIcon,
  WarningAmberIcon,
  WifiOffIcon,
  NewReleasesIcon,
  SecurityIcon,
  BugReportIcon,
} from '../../icons';
import { classifyError, ERROR_CATEGORIES } from '../../utils/chunkErrorHandler';
import { reportErrorToMonitoring } from '../../utils/globalErrorHandler';

/**
 * Returns category-tailored visual style attributes (colors, borders, backgrounds).
 */
const getCategoryStyles = (category, isDark) => {
  switch (category) {
    case ERROR_CATEGORIES.STALE_DEPLOYMENT:
    case ERROR_CATEGORIES.NEW_RELEASE:
      return {
        bg: isDark ? 'rgba(2, 132, 199, 0.18)' : 'rgba(2, 132, 199, 0.1)',
        border: isDark ? 'rgba(2, 132, 199, 0.4)' : 'rgba(2, 132, 199, 0.25)',
        color: isDark ? '#38bdf8' : '#0284c7',
      };
    case ERROR_CATEGORIES.NETWORK_DROP:
    case ERROR_CATEGORIES.OFFLINE:
      return {
        bg: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.1)',
        border: isDark ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.25)',
        color: '#f59e0b',
      };
    case ERROR_CATEGORIES.BLOCKED_SCRIPT:
    case ERROR_CATEGORIES.BLOCKED:
      return {
        bg: isDark ? 'rgba(217, 119, 6, 0.18)' : 'rgba(217, 119, 6, 0.1)',
        border: isDark ? 'rgba(217, 119, 6, 0.4)' : 'rgba(217, 119, 6, 0.25)',
        color: isDark ? '#fbbf24' : '#d97706',
      };
    case ERROR_CATEGORIES.PAGE_BROKEN:
    default:
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.1)',
        border: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.25)',
        color: '#ef4444',
      };
  }
};

/**
 * Renders the appropriate category icon.
 */
const renderCategoryIcon = (category) => {
  switch (category) {
    case ERROR_CATEGORIES.STALE_DEPLOYMENT:
    case ERROR_CATEGORIES.NEW_RELEASE:
      return <NewReleasesIcon sx={{ fontSize: 30 }} />;
    case ERROR_CATEGORIES.NETWORK_DROP:
    case ERROR_CATEGORIES.OFFLINE:
      return <WifiOffIcon sx={{ fontSize: 30 }} />;
    case ERROR_CATEGORIES.BLOCKED_SCRIPT:
    case ERROR_CATEGORIES.BLOCKED:
      return <SecurityIcon sx={{ fontSize: 30 }} />;
    case ERROR_CATEGORIES.PAGE_BROKEN:
    default:
      return <BugReportIcon sx={{ fontSize: 30 }} />;
  }
};

/**
 * Theme-aware recovery UI rendered when an ErrorBoundary catches an error.
 * Supports both full-page layout and compact embedded widget mode.
 */
export const ErrorRecoveryCard = ({ error, onRetry, compact = false, moduleName }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const details = classifyError(error);
  const styles = getCategoryStyles(details.category, isDark);

  const title = compact
    ? `${moduleName || 'Component'} Error`
    : details.title;

  const description = compact
    ? `An error occurred while rendering this ${moduleName ? moduleName.toLowerCase() : 'component'}. The rest of the page remains functional.`
    : details.description;

  const handleAction = () => {
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: compact ? 240 : '100vh',
        height: compact ? '100%' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: compact ? 'transparent' : (isDark ? blcColors.darkBg : blcColors.cream),
      }}
    >
      <Card
        sx={{
          maxWidth: compact ? 420 : 480,
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
            width: compact ? 48 : 56,
            height: compact ? 48 : 56,
            mx: 'auto',
            mb: compact ? 1.5 : 2.5,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: styles.bg,
            border: `1px solid ${styles.border}`,
            color: styles.color,
          }}
        >
          {renderCategoryIcon(details.category)}
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontFamily: typographyTokens.fontMono,
            fontWeight: typographyTokens.weightBold,
            fontSize: compact ? '1rem' : '1.25rem',
            color: isDark ? '#f1f5f9' : blcColors.textDark,
            mb: 1,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontFamily: typographyTokens.fontSans,
            fontSize: compact ? '0.825rem' : '0.875rem',
            color: isDark ? '#94a3b8' : blcColors.textMid,
            lineHeight: 1.6,
            mb: compact ? 2 : 3,
          }}
        >
          {description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRetry && (
            <AppButton variant="secondary" size={compact ? 'small' : 'medium'} onClick={onRetry}>
              Try Again
            </AppButton>
          )}
          {!compact && (
            <AppButton
              variant="primary"
              size={compact ? 'small' : 'medium'}
              startIcon={<RefreshIcon />}
              onClick={handleAction}
            >
              {details.actionText}
            </AppButton>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const componentName = this.props.name || 'Component';
    console.error(`[AppErrorBoundary:${componentName}] caught an error:`, error, errorInfo);

    // Forward to global monitoring (e.g. Sentry)
    reportErrorToMonitoring(error, {
      component: componentName,
      componentStack: errorInfo?.componentStack,
      isWidget: Boolean(this.props.compact || this.props.level === 'widget'),
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, onRetry: this.handleRetry })
          : this.props.fallback;
      }

      return (
        <ErrorRecoveryCard
          error={this.state.error}
          onRetry={this.handleRetry}
          compact={Boolean(this.props.compact || this.props.level === 'widget')}
          moduleName={this.props.name}
        />
      );
    }

    return this.props.children;
  }
}

// Aliases for backward compatibility and semantic usage
export const ChunkErrorBoundary = AppErrorBoundary;
export const WidgetErrorBoundary = (props) => (
  <AppErrorBoundary compact level="widget" {...props} />
);

export default AppErrorBoundary;
