// UserMenu.jsx
// PURPOSE: User profile avatar button and dropdown menu.
// Shows the logged-in user's name, username, role badge, and provides a Logout action.
//
// FEATURES:
//   - Generates initials automatically for avatar display
//   - Anchored MUI Menu with custom styling for light and dark modes
//   - Clear visual hierarchy with role badge chip and divider
//   - Distinctive red logout button

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
import { Logout as LogoutIcon } from '@mui/icons-material';
import { blcColors } from '../../theme';

/**
 * Common UserMenu component
 * Props:
 *  - currentUser: { name, username, role }
 *  - onLogout: function
 *  - isDark: boolean
 */
export const UserMenu = ({ currentUser, onLogout, isDark }) => {
  // anchorEl tracks which DOM element opened the dropdown menu (null when menu is closed)
  const [anchorEl, setAnchorEl] = React.useState(null);
  const isMenuOpen = Boolean(anchorEl);

  // Opens the dropdown menu anchored below the clicked avatar button
  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  
  // Closes the menu by resetting the anchor reference
  const handleMenuClose = () => setAnchorEl(null);

  // Closes menu and triggers the parent logout function
  const handleLogoutClick = () => {
    handleMenuClose();
    onLogout();
  };

  // Helper: Converts a full name like "Alex Morgan" into two-letter uppercase initials "AM"
  const getInitials = (name) => {
    if (!name) return 'U'; // Fallback initial
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
        >
          {/* Circular avatar with initials */}
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: blcColors.navyAccent, // Navy accent circle background
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.8rem',
              fontWeight: 800,
            }}
          >
            {getInitials(currentUser?.name)}
          </Avatar>
        </IconButton>
      </Tooltip>

      {/* ── Account Dropdown Menu ── */}
      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: isDark ? 0 : 4, // Dark mode relies on border; light mode uses soft drop shadow
          sx: {
            minWidth: 220,
            borderRadius: '10px',
            mt: 1, // Gap between avatar button and menu top
            p: 1,
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`,
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : undefined,
          },
        }}
      >
        {/* ── User Information Header ── */}
        <Box sx={{ px: 2, py: 1.5 }}>
          {/* Display Name */}
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: isDark ? '#e2e8f0' : blcColors.textDark,
            }}
          >
            {currentUser?.name || 'User'}
          </Typography>

          {/* Username / Email */}
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.72rem',
              color: isDark ? '#475569' : '#9ca3af',
            }}
            noWrap
          >
            {currentUser?.username || ''}
          </Typography>

          {/* Role badge (e.g. "Product Lead", "Senior Engineer") */}
          <Chip
            label={currentUser?.role || 'Member'}
            size="small"
            sx={{
              mt: 1,
              height: 20,
              fontSize: '0.65rem',
              fontFamily: '"JetBrains Mono", monospace',
              bgcolor: `${blcColors.navyAccent}18`, // Navy with low opacity
              color: blcColors.navyAccent,
              border: `1px solid ${blcColors.navyAccent}35`,
            }}
          />
        </Box>

        {/* Separator line between user info and actions */}
        <Divider sx={{ my: 1, borderColor: isDark ? blcColors.darkBorder : '#e0e5f2' }} />

        {/* ── Logout Action Item ── */}
        <MenuItem
          id="logout-menu-item"
          onClick={handleLogoutClick}
          sx={{
            borderRadius: '6px',
            color: '#ef4444', // Red text signals logout / destructive action
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <LogoutIcon sx={{ color: '#ef4444', fontSize: '18px' }} />
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#ef4444',
            }}
          >
            Log Out
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};
