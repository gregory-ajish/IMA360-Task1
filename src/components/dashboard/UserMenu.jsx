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
import { Logout as LogoutIcon } from '@mui/icons-material';
import { blcColors } from '../../theme';

/**
 * UserMenu Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.currentUser - Active session user data object ({ name, username, role }).
 * @param {Function} props.onLogout - Callback function invoked when the user confirms logging out.
 * @param {boolean} props.isDark - True if dark mode is active; false otherwise.
 * @returns {React.ReactElement} The rendered user avatar button and anchored popover menu.
 */
export const UserMenu = ({ currentUser, onLogout, isDark }) => {
  // anchorEl tracks which DOM element opened the dropdown menu (null when menu is closed)
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  // Boolean flag derived from anchor existence
  const isMenuOpen = Boolean(anchorEl);

  /**
   * Opens the dropdown menu anchored below the clicked avatar button.
   * @param {React.MouseEvent<HTMLElement>} e - The click event object.
   */
  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  
  /**
   * Closes the dropdown menu by clearing the anchor element reference.
   */
  const handleMenuClose = () => setAnchorEl(null);

  /**
   * Closes the dropdown menu and triggers the application-level logout routine.
   */
  const handleLogoutClick = () => {
    handleMenuClose();
    onLogout();
  };

  /**
   * Converts a user's full name into a 1 or 2 letter uppercase initials monogram.
   * Example: "Alex Morgan" -> "AM", "Cher" -> "C", null/empty -> "U".
   *
   * @param {string} [name] - The user's full name string.
   * @returns {string} Uppercase initials monogram.
   */
  const getInitials = (name) => {
    if (!name) return 'U'; // Safe fallback initial if name is missing
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
          aria-label="open user account menu"
        >
          {/* Circular avatar with calculated initials */}
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

      {/* ── Account Dropdown Popover Menu ── */}
      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        // Positions the menu neatly aligned below the right edge of the avatar
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: isDark ? 0 : 4, // Dark mode relies on border; light mode uses soft drop shadow
          sx: {
            minWidth: 220,
            borderRadius: '10px',
            mt: 1, // Vertical gap between avatar button and menu top
            p: 1,
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`,
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : undefined,
          },
        }}
      >
        {/* ── User Information Header Section ── */}
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

          {/* Username / Handle */}
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

          {/* Organizational Role badge (e.g. "Product Lead", "Senior Engineer") */}
          <Chip
            label={currentUser?.role || 'Member'}
            size="small"
            sx={{
              mt: 1,
              height: 20,
              fontSize: '0.65rem',
              fontFamily: '"JetBrains Mono", monospace',
              bgcolor: `${blcColors.navyAccent}18`, // Translucent navy fill
              color: blcColors.navyAccent,
              border: `1px solid ${blcColors.navyAccent}35`,
            }}
          />
        </Box>

        {/* Separator line between user info and action items */}
        <Divider sx={{ my: 1, borderColor: isDark ? blcColors.darkBorder : '#e0e5f2' }} />

        {/* ── Logout Action Item ── */}
        <MenuItem
          id="logout-menu-item"
          onClick={handleLogoutClick}
          sx={{
            borderRadius: '6px',
            color: '#ef4444', // Red text signals signout / destructive action
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            '&:hover': {
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
            },
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

