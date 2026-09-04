// Navbar.jsx
// PURPOSE: Sticky top application header for the Dashboard.
// Combines the AppLogo, external resources action, ThemeToggle, and UserMenu into a single unit.
//
// FEATURES:
//   - Sticky positioning with frosted glass effect in dark mode
//   - Integrated branding via common AppLogo
//   - External resources link icon button
//   - Theme mode toggle button
//   - User avatar dropdown menu integration

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
 * Common Navbar component
 * Props:
 *  - mode: 'light' | 'dark'
 *  - toggleMode: function
 *  - currentUser: object
 *  - onLogout: function
 *  - onExternalLinkClick: function
 */
export const Navbar = ({
  mode,
  toggleMode,
  currentUser,
  onLogout,
  onExternalLinkClick,
}) => {
  // Shorthand boolean to apply conditional styles based on current theme
  const isDark = mode === 'dark';

  return (
    // AppBar: sticky top bar that stays fixed as the user scrolls
    // elevation={0}: removes default MUI drop shadow in favor of a subtle border
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: isDark ? blcColors.darkSurface : '#ffffff', // Theme-based surface background
        color: 'text.primary',
        borderBottom: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`, // Bottom divider line
        backdropFilter: isDark ? 'blur(8px)' : 'none', // Frosted glass blur effect for dark mode
      }}
    >
      <Container maxWidth="lg">
        {/* Toolbar: provides consistent horizontal layout and vertical centering */}
        <Toolbar disableGutters sx={{ minHeight: 60 }}>
          
          {/* ── Brand Logo Section ──
              flexGrow: 1 ensures the logo occupies all available left space,
              pushing action buttons and menus to the far right. */}
          <Box sx={{ flexGrow: 1 }}>
            <AppLogo
              isDark={isDark}
              size="small"
              layout="horizontal"
              title="Test App"
              subtitle="Enterprise Suite"
            />
          </Box>

          {/* ── Header Actions (Right Side) ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            
            {/* External documentation link action button */}
            <Tooltip title="External Resources">
              <IconButton
                id="external-link-btn"
                size="small"
                sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
                onClick={onExternalLinkClick}
              >
                <ExternalLinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Light / Dark Mode Toggle button */}
            <ThemeToggle mode={mode} toggleMode={toggleMode} />

            {/* User Profile avatar and dropdown menu */}
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
