// Navbar.jsx
// ============================================================================
// PURPOSE:
//   Sticky top application navigation header for the authenticated Dashboard.
//   Provides unified access to branding, external documentation resources,
//   Light/Dark mode toggle, and the authenticated user profile dropdown.
//
// USAGE LOCATIONS:
//   - DashboardPage.jsx: Rendered at the very top of the page layout outside
//     the main scrollable container.
//
// FEATURES & ARCHITECTURE:
//   - Sticky Positioning: Remains pinned at the top (`position="sticky"`) as the
//     user scrolls through extensive app catalogs.
//   - Frosted Glass Effect: Utilizes `backdropFilter: blur(8px)` in dark mode for
//     a sleek modern aesthetic.
//   - Responsive Spacing: Configured with `disableGutters` and a maxWidth container
//     to align neatly with the main content area.
//   - Decoupled Child Components: Integrates <AppLogo>, <ThemeToggle>, and <UserMenu>.
// ============================================================================

import React from 'react';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { OpenInNew as ExternalLinkIcon } from '@mui/icons-material';
import { AppLogo } from '../common/AppLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { UserMenu } from './UserMenu';
import { blcColors } from '../../theme';

/**
 * Navbar Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {'light'|'dark'} props.mode - Current theme mode ('light' or 'dark').
 * @param {Function} props.toggleMode - Callback function to toggle between light and dark themes.
 * @param {Object} props.currentUser - The currently authenticated user object ({ name, username, role }).
 * @param {Function} props.onLogout - Callback function triggered when the user signs out.
 * @param {Function} props.onExternalLinkClick - Callback function invoked when clicking the external resources button.
 * @returns {React.ReactElement} The rendered top navigation bar.
 */
export const Navbar = ({
  mode,
  toggleMode,
  currentUser,
  onLogout,
  onExternalLinkClick,
}) => {
  // Shorthand boolean to apply conditional styles and colors based on active theme
  const isDark = mode === 'dark';

  return (
    // AppBar: pinned top container
    // elevation={0}: avoids heavy drop shadows, opting for clean border-bottom separation
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: isDark ? blcColors.darkSurface : '#ffffff', // Theme-based surface background
        color: 'text.primary',
        borderBottom: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`, // Crisp boundary divider
        backdropFilter: isDark ? 'blur(8px)' : 'none', // Translucent blur in dark mode
      }}
    >
      {/* Container ensures the navbar content aligns symmetrically with the dashboard grid */}
      <Container maxWidth="lg">
        {/* Toolbar: provides consistent horizontal alignment and vertical centering */}
        <Toolbar disableGutters sx={{ minHeight: 60 }}>
          
          {/* ── Brand Logo Section ──
              flexGrow: 1 forces the logo block to occupy all remaining space on the left,
              which automatically pushes the action buttons to the far right. */}
          <Box sx={{ flexGrow: 1 }}>
            <AppLogo
              isDark={isDark}
              size="small"
              layout="horizontal"
              title="Test App"
              subtitle="Enterprise Suite"
            />
          </Box>

          {/* ── Action Buttons Cluster (Right Side) ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            
            {/* External documentation link button */}
            <Tooltip title="External Resources">
              <IconButton
                id="external-link-btn"
                size="small"
                aria-label="external resources"
                sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
                onClick={onExternalLinkClick}
              >
                <ExternalLinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Light / Dark Mode Toggle button */}
            <ThemeToggle mode={mode} toggleMode={toggleMode} />

            {/* User Profile avatar trigger and popover dropdown menu */}
            <UserMenu
              currentUser={currentUser}
              onLogout={onLogout}
              isDark={isDark}
            />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

