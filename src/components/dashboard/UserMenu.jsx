// UserMenu.jsx
// ============================================================================
// PURPOSE:
//   An authenticated user profile avatar trigger button and dropdown menu.
//   Provides immediate visibility into the active session (name, username, role)
//   and offers a clear, accessible trigger to log out of the portal.
//
// USAGE LOCATIONS:
//   - Navbar.jsx: Positioned as the rightmost item in the sticky application header.
//
// FEATURES & ARCHITECTURE:
//   - Dynamic Initials: Automatically derives 1-2 uppercase letters from the user's
//     full name (e.g. "Alex Morgan" -> "AM") to display within the circular avatar.
//   - Anchored Popover Menu: Utilizes MUI's <Menu> component with custom anchor
//     and transform origins to open seamlessly below the avatar.
//   - Role Distinction: Embeds a styled <Chip> displaying the user's organizational
//     role (e.g., "Product Lead", "Senior Engineer").
//   - Destructive Action Distinction: Stylizes the Logout action in high-contrast red
//     with an icon for clear visual intent.
//   - Keyboard & Screen Reader Accessibility: Sets explicit aria controls,
//     expanded flags, and popup indicators.
// ============================================================================

import React from 'react';
import {
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  PersonOutlined as ProfileIcon,
  SettingsOutlined as SettingsIcon,
} from '@mui/icons-material';
import { blcColors } from '../../theme';

/**
 * UserMenu Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.currentUser - Active session user data object ({ name, username, role }).
 * @param {Function} props.onLogout - Callback function invoked when the user confirms logging out.
 * @param {boolean} props.isDark - True if dark mode is active; false otherwise.
 * @param {Function} [props.onProfileClick] - Optional callback for Profile menu item.
 * @param {Function} [props.onSettingsClick] - Optional callback for Settings menu item.
 * @returns {React.ReactElement} The rendered user avatar button and anchored popover menu.
 */
export const UserMenu = ({ currentUser, onLogout, isDark, onProfileClick, onSettingsClick }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogoutClick = () => {
    handleMenuClose();
    onLogout();
  };

  const handleProfileClick = () => {
    handleMenuClose();
    if (onProfileClick) onProfileClick();
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    if (onSettingsClick) onSettingsClick();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Shared menu item styles
  const menuItemSx = {
    borderRadius: '6px',
    py: 0.6,
    px: 1.5,
    gap: 1.2,
    display: 'flex',
    alignItems: 'center',
    minHeight: 'unset',
    '&:hover': {
      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
    },
  };

  const menuIconSx = {
    fontSize: 17,
    color: isDark ? '#94a3b8' : '#374151',
  };

  const menuTextSx = {
    fontFamily: '"Inter", sans-serif',
    fontSize: '0.82rem',
    fontWeight: 400,
    color: isDark ? '#e2e8f0' : '#111827',
  };

  return (
    <>
      {/* ── User Avatar Trigger Button ── */}
      <Tooltip title="Account">
        <IconButton
          id="user-avatar-btn"
          size="small"
          sx={{ ml: 0.5 }}
          onClick={handleProfileMenuOpen}
          aria-controls={isMenuOpen ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={isMenuOpen ? 'true' : undefined}
          aria-label="open user account menu"
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: blcColors.navyAccent,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.8rem',
              fontWeight: 800,
            }}
          >
            {getInitials(currentUser?.name)}
          </Avatar>
        </IconButton>
      </Tooltip>

      {/* ── Account Dropdown Popover Menu ── */}
      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: isDark ? 0 : 3,
          sx: {
            minWidth: 190,
            maxWidth: 210,
            borderRadius: '10px',
            mt: 0.75,
            p: 0.75,
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e5e7eb'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.12)',
          },
        }}
      >
        {/* ── User Info Header ── */}
        <Box sx={{ px: 1.5, pt: 1, pb: 0.75 }}>
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '0.82rem',
              color: isDark ? '#e2e8f0' : '#111827',
              lineHeight: 1.3,
            }}
          >
            {currentUser?.name || 'User'}
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '0.7rem',
              color: isDark ? '#64748b' : '#9ca3af',
              mt: 0.15,
            }}
          >
            {currentUser?.role || 'Member'}
          </Typography>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: isDark ? blcColors.darkBorder : '#e5e7eb' }} />

        {/* ── Profile ── */}
        <MenuItem id="profile-menu-item" onClick={handleProfileClick} sx={menuItemSx}>
          <ProfileIcon sx={menuIconSx} />
          <Typography sx={menuTextSx}>Profile</Typography>
        </MenuItem>

        {/* ── Settings ── */}
        <MenuItem id="settings-menu-item" onClick={handleSettingsClick} sx={menuItemSx}>
          <SettingsIcon sx={menuIconSx} />
          <Typography sx={menuTextSx}>Settings</Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5, borderColor: isDark ? blcColors.darkBorder : '#e5e7eb' }} />

        {/* ── Sign Out ── */}
        <MenuItem
          id="logout-menu-item"
          onClick={handleLogoutClick}
          sx={{
            ...menuItemSx,
            '&:hover': {
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.10)' : 'rgba(239, 68, 68, 0.07)',
            },
          }}
        >
          <LogoutIcon sx={{ fontSize: 17, color: '#ef4444' }} />
          <Typography sx={{ ...menuTextSx, color: '#ef4444' }}>
            Sign Out
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

