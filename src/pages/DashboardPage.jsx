// DashboardPage.jsx
// PURPOSE: The main authenticated page shown after login at the /home route.
// It is wrapped by <ProtectedRoute> in App.jsx, so unauthenticated users are
// automatically redirected to /login before this component ever renders.
//
// FEATURES:
//   - Sticky AppBar with logo, theme toggle, and user avatar menu
//   - Welcome banner with the logged-in user's name
//   - Search bar that filters apps by title or description in real time
//   - Categorized app card grid (loaded from apps.json)
//   - Toast notification when an app card is clicked
//   - Logout button in the user dropdown menu

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI layout and UI components
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  TextField,
  InputAdornment,
  Card,
  CardActionArea,
  Grid,
  Chip,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
  Tooltip,
  Paper,
} from '@mui/material';

// MUI icons for the header and app cards
import {
  Search as SearchIcon,       // Magnifying glass in search bar
  Clear as ClearIcon,         // X button to clear search
  HubOutlined,                // App logo (hub/network icon)
  OpenInNew as ExternalLinkIcon, // External resources button in header
  Logout as LogoutIcon,       // Logout option in user menu
  LightMode as LightModeIcon, // Sun icon — switch to light mode
  DarkMode as DarkModeIcon,   // Moon icon — switch to dark mode
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext'; // currentUser + logout from global context
import appsData from '../data/apps.json';         // Static app list (categories + apps)
import { AppIcon } from '../components/AppIcon'; // Dynamic icon renderer for app cards
import { blcColors } from '../theme';            // Brand color palette

// ─── DashboardPage Component ──────────────────────────────────────────────────
// Props:
//   mode       {string}   — 'light' or 'dark', controlled by App.jsx
//   toggleMode {function} — flips the theme mode, passed down from App.jsx
export const DashboardPage = ({ mode, toggleMode }) => {
  const { currentUser, logout } = useAuth(); // Auth state and logout action
  const navigate = useNavigate();            // For redirecting to /login after logout
  const isDark = mode === 'dark';            // Shorthand for conditional dark styling

  // ─── State ──────────────────────────────────────────────────────────────
  // searchQuery: the live string typed in the search bar
  const [searchQuery, setSearchQuery] = useState('');

  // anchorEl: the DOM element that the user dropdown Menu is anchored to.
  // When null, the menu is closed. When set, the menu opens below the avatar.
  const [anchorEl, setAnchorEl] = useState(null);

  // toast: controls the snackbar notification shown when an app card is clicked.
  // { open, message, severity } — open/closes it, message sets text, severity sets color.
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  // Boolean shorthand: is the user dropdown menu open?
  const isMenuOpen = Boolean(anchorEl);

  // ─── Event Handlers ─────────────────────────────────────────────────────

  // Opens the user dropdown by storing the clicked element as the menu anchor
  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);

  // Closes the user dropdown by removing the anchor
  const handleMenuClose = () => setAnchorEl(null);

  // Handles logout: close menu → clear auth state → redirect to /login
  const handleLogout = () => {
    handleMenuClose();
    logout();                               // Clears auth state and storage
    navigate('/login', { replace: true }); // replace: true so back button can't return here
  };

  // Triggered when an app card is clicked — shows a toast notification
  const handleCardClick = (app) => {
    setToast({ open: true, message: `Launching "${app.title}"...`, severity: 'success' });
  };

  // Closes the toast. The 'clickaway' guard prevents closing when clicking elsewhere
  // (the user must wait for the auto-hide or click the close button).
  const handleCloseToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false })); // Keep other fields, just close it
  };

  // ─── Filtered Categories (Search) ───────────────────────────────────────
  // useMemo recalculates only when searchQuery changes.
  // Without useMemo, this would re-run on every render (e.g. on toast state changes).
  // Filters apps by whether title or description includes the search query (case-insensitive).
  // Removes categories that have 0 matching apps after filtering.
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return appsData.categories; // No query → show everything unfiltered

    return appsData.categories
      .map((cat) => ({
        ...cat,
        apps: cat.apps.filter(
          (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.apps.length > 0); // Remove empty categories
  }, [searchQuery]);

  // Total count of visible apps after filtering — used in the search result count text
  const totalAppsCount = useMemo(
    () => filteredCategories.reduce((s, c) => s + c.apps.length, 0),
    [filteredCategories]
  );

  // ─── Helper: User Initials for Avatar ───────────────────────────────────
  // Converts "Alex Morgan" → "AM", "john" → "J", undefined → "U"
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // ─── JSX / UI ────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? blcColors.darkBg : blcColors.cream, pb: 8, transition: 'background-color 0.3s ease' }}>

      {/* ── AppBar / Header ─────────────────────────────────────────────────
          position="sticky" keeps it visible while scrolling.
          elevation={0} removes MUI's default drop shadow (we use border-bottom instead). */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: isDark ? blcColors.darkSurface : '#ffffff',
          color: 'text.primary',
          borderBottom: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`, // Subtle separator
          backdropFilter: isDark ? 'blur(8px)' : 'none', // Frosted glass effect in dark mode
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 60 }}>

            {/* ── Logo + App Name ── flexGrow: 1 pushes action icons to the right */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
              {/* Square logo icon */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: blcColors.navyAccent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HubOutlined sx={{ fontSize: 20, color: '#fff' }} />
              </Box>
              {/* App name + tagline stacked vertically */}
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: isDark ? '#e2e8f0' : blcColors.navyAccent,
                    lineHeight: 1.2,
                  }}
                >
                  Test App
                </Typography>
                {/* Tagline hidden on mobile (xs) to save space */}
                <Typography
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.62rem',
                    color: isDark ? '#475569' : '#9ca3af',
                    display: { xs: 'none', sm: 'block' }, // Hidden below sm breakpoint
                  }}
                >
                  Enterprise Suite
                </Typography>
              </Box>
            </Box>

            {/* ── Header Action Icons (right side) ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

              {/* External Resources button — shows a toast for now (placeholder action) */}
              <Tooltip title="External Resources">
                <IconButton
                  id="external-link-btn"
                  size="small"
                  sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
                  onClick={() => setToast({ open: true, message: 'Opening documentation...', severity: 'info' })}
                >
                  <ExternalLinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Dark/Light mode toggle — same as on the Login page */}
              <Tooltip title={isDark ? 'Light Mode' : 'Dark Mode'}>
                <IconButton
                  id="theme-toggle-btn"
                  size="small"
                  sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
                  onClick={toggleMode}
                >
                  {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              {/* User Avatar button — clicking opens the account dropdown menu */}
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
                    {getInitials(currentUser?.name)} {/* e.g. "AM" for Alex Morgan */}
                  </Avatar>
                </IconButton>
              </Tooltip>

              {/* ── Account Dropdown Menu ──
                  Opens anchored below the avatar button.
                  Shows user info at the top and a Logout option at the bottom. */}
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: isDark ? 0 : 4, // No elevation in dark (we use border instead)
                  sx: {
                    minWidth: 220,
                    borderRadius: '10px',
                    mt: 1,   // Gap between avatar button and menu
                    p: 1,
                    bgcolor: isDark ? blcColors.darkCard : '#ffffff',
                    border: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`,
                    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : undefined,
                  },
                }}
              >
                {/* User info section: name, username, role badge */}
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '0.875rem', color: isDark ? '#e2e8f0' : blcColors.textDark }}>
                    {currentUser?.name || 'User'}
                  </Typography>
                  <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', color: isDark ? '#475569' : '#9ca3af' }} noWrap>
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
                      bgcolor: `${blcColors.navyAccent}18`,  // Navy at 10% opacity
                      color: blcColors.navyAccent,
                      border: `1px solid ${blcColors.navyAccent}35`, // Navy at 21% opacity
                    }}
                  />
                </Box>

                {/* Visual separator between user info and actions */}
                <Divider sx={{ my: 1, borderColor: isDark ? blcColors.darkBorder : '#e0e5f2' }} />

                {/* Logout menu item — red color signals a destructive action.
                    Using direct icon + Typography instead of ListItemIcon/ListItemText
                    to avoid MUI's built-in fixed spacing between icon and label. */}
                <MenuItem
                  id="logout-menu-item"
                  onClick={handleLogout}
                  sx={{
                    borderRadius: '6px',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px', // Controls exact space between icon and text
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
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* ── Main Page Content ──────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>

        {/* ── Welcome Banner ──
            Full-width gradient banner with the user's name and workspace overview label.
            The subtle grid overlay (pseudo-grid pattern) adds a BLC-style technical aesthetic. */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: '12px',
            // Gradient changes based on mode — dark uses navy/midnight, light uses navy to dark
            background: isDark
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
              : `linear-gradient(135deg, ${blcColors.navyAccent} 0%, #0f172a 100%)`,
            color: '#ffffff',
            mb: 4,
            position: 'relative',
            overflow: 'hidden', // Clips the absolutely positioned grid overlay
            boxShadow: isDark ? '0 4px 32px rgba(15, 52, 96, 0.4)' : 'none',
          }}
        >
          {/* Decorative grid overlay — purely visual, no interaction */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
              pointerEvents: 'none', // Clicks pass through — not interactive
            }}
          />

          {/* Banner text content — positioned above the grid overlay with z-index */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Section label in yellow accent */}
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: blcColors.yellowAccent,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              ✦ Workspace Overview ✦
            </Typography>
            {/* Personalized welcome heading */}
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 800,
                fontSize: { xs: '1.5rem', md: '2rem' }, // Smaller on mobile
                color: '#ffffff',
                mb: 0.75,
              }}
            >
              Welcome back, {currentUser?.name || 'Explorer'}!
            </Typography>
            {/* Subtitle description */}
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.9rem',
                color: '#94a3b8',
                maxWidth: 560,
              }}
            >
              Discover, launch, and manage all your team tools in one centralized portal.
            </Typography>
          </Box>
        </Paper>

        {/* ── Search Bar ──
            Live filtering — updates filteredCategories on every keystroke via useMemo.
            The X button (ClearIcon) only appears when there is text to clear. */}
        <Box sx={{ mb: 4 }}>
          <TextField
            id="app-search-input"
            fullWidth
            placeholder="Search applications by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: isDark ? '#475569' : '#9ca3af', fontSize: 20 }} />
                </InputAdornment>
              ),
              // Only render the clear button when the search field has input
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    id="clear-search-btn"
                    size="small"
                    onClick={() => setSearchQuery('')} // Reset search to show all apps
                    aria-label="clear search"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { fontFamily: '"Inter", sans-serif' },
            }}
            sx={{ bgcolor: isDark ? blcColors.darkInput : '#ffffff', borderRadius: '8px', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : 'none' }}
          />

          {/* Result count — only shown when there is an active search query */}
          {searchQuery && (
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.75rem',
                color: isDark ? '#64748b' : '#9ca3af',
                mt: 1.25,
              }}
            >
              Found{' '}
              {/* Highlighted count in blue/cyan */}
              <Box component="span" sx={{ color: isDark ? blcColors.cyanCode : blcColors.navyAccent, fontWeight: 700 }}>
                {totalAppsCount}
              </Box>{' '}
              {totalAppsCount === 1 ? 'application' : 'applications'} matching "{searchQuery}"
            </Typography>
          )}
        </Box>

        {/* ── Categorized App Grid ──
            Maps over filteredCategories (filtered by useMemo above).
            Each category renders a header with a count badge, then a responsive grid of cards.
            If search returns no results, shows an empty state message instead. */}
        {filteredCategories.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {filteredCategories.map((category) => (
              <Box key={category.name} component="section">

                {/* ── Category Header ──
                    Left blue bar + category name + app count badge. */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  {/* Decorative vertical blue bar — BLC-style section marker */}
                  <Box
                    sx={{
                      width: 4,
                      height: 20,
                      borderRadius: '2px',
                      bgcolor: blcColors.navyAccent,
                      flexShrink: 0, // Don't let it shrink if text is long
                    }}
                  />
                  {/* Category name */}
                  <Typography
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: isDark ? '#e2e8f0' : blcColors.textDark,
                    }}
                  >
                    {category.name}
                  </Typography>
                  {/* App count badge — shows how many apps are in this category */}
                  <Chip
                    id={`category-badge-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    label={category.apps.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.68rem',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 700,
                      bgcolor: `${blcColors.navyAccent}18`,
                      color: blcColors.navyAccent,
                      border: `1px solid ${blcColors.navyAccent}30`,
                    }}
                  />
                </Box>

                {/* ── App Cards Grid ──
                    Responsive grid: 1 col on mobile, 2 on tablet, 3 on desktop, 4 on wide.
                    Each card renders an icon, title, and description from apps.json. */}
                <Grid container spacing={2.5}>
                  {category.apps.map((app) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={app.id}>
                      <Card
                        id={`app-card-${app.id}`} // Unique ID per card for testing
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          bgcolor: isDark ? blcColors.darkCard : '#ffffff',
                          border: `1px solid ${isDark ? blcColors.darkBorder : '#e0e5f2'}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
                          // Hover effect: highlight border, change background, add shadow, lift card
                          '&:hover': {
                            borderColor: blcColors.navyAccent,
                            bgcolor: isDark ? blcColors.darkCardHover : '#f8f9ff',
                            boxShadow: isDark
                              ? '0 8px 28px rgba(30,58,138,0.25)'
                              : '0 6px 20px rgba(30,58,138,0.12)',
                            transform: 'translateY(-3px)',
                          },
                        }}
                      >
                        {/* CardActionArea makes the whole card clickable as one button.
                            Handles keyboard navigation and accessibility automatically. */}
                        <CardActionArea
                          onClick={() => handleCardClick(app)}
                          sx={{
                            flexGrow: 1,
                            p: 2.5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start', // Align icon/text to left, not center
                            height: '100%',
                          }}
                        >
                          {/* App Icon — loaded dynamically via AppIcon component */}
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '10px',
                              bgcolor: isDark ? 'rgba(30,58,138,0.2)' : `${blcColors.navyAccent}12`,
                              color: isDark ? '#7eb8f7' : blcColors.navyAccent,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 2,
                              border: `1px solid ${isDark ? `${blcColors.navyAccent}40` : `${blcColors.navyAccent}25`}`,
                            }}
                          >
                            {/* AppIcon maps app.icon string → actual MUI icon component */}
                            <AppIcon name={app.icon} sx={{ fontSize: 22 }} />
                          </Box>

                          {/* App Title */}
                          <Typography
                            sx={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: isDark ? '#e2e8f0' : blcColors.textDark,
                              mb: 0.75,
                              lineHeight: 1.3,
                            }}
                          >
                            {app.title}
                          </Typography>

                          {/* App Description — shorter text, Inter for readability */}
                          <Typography
                            sx={{
                              fontFamily: '"Inter", sans-serif',
                              fontSize: '0.8rem',
                              color: isDark ? '#64748b' : blcColors.textMid,
                              lineHeight: 1.55,
                            }}
                          >
                            {app.description}
                          </Typography>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        ) : (
          /* ── Empty State ──
             Shown when search finds no matching apps.
             Centered message prompting the user to try a different keyword. */
          <Paper
            variant="outlined"
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: '12px',
              bgcolor: isDark ? blcColors.darkCard : '#ffffff',
              borderColor: isDark ? blcColors.darkBorder : '#e0e5f2',
              boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', color: isDark ? '#475569' : '#9ca3af', mb: 1 }}>
              No applications found for "{searchQuery}"
            </Typography>
            <Typography sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.875rem', color: isDark ? '#64748b' : blcColors.textMid }}>
              Try a different keyword or clear the search.
            </Typography>
          </Paper>
        )}
      </Container>

      {/* ── Toast Notification ──────────────────────────────────────────────
          Appears at the bottom-center of the screen when an app card is clicked.
          autoHideDuration: 3000ms → automatically closes after 3 seconds.
          anchorOrigin controls where on screen the toast appears. */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity} // 'success', 'info', 'warning', or 'error'
          variant="filled"          // Solid background color (not outlined)
          sx={{
            borderRadius: '8px',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.8rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
