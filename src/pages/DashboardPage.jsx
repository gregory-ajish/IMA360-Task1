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
  Typography,
  Box,
  Container,
  Grid,
  Chip,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';

import { useAuth } from '../context/AuthContext'; // currentUser + logout from global context
import appsData from '../data/apps.json';         // Static app list (categories + apps)
import { blcColors } from '../theme';            // Brand color palette

// Common / Modular Components
import { Navbar } from '../components/dashboard/Navbar';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { SearchBar } from '../components/dashboard/SearchBar';
import { AppCard } from '../components/dashboard/AppCard';
import { RevenueTrackerModal } from '../components/dashboard/RevenueTrackerModal';

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

  // toast: controls the snackbar notification shown when an app card is clicked.
  // { open, message, severity } — open/closes it, message sets text, severity sets color.
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  // State to control the Handsontable Revenue Tracker spreadsheet modal
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  // Handles logout: clear auth state → redirect to /login
  const handleLogout = () => {
    logout();                               // Clears auth state and storage
    navigate('/login', { replace: true }); // replace: true so back button can't return here
  };

  // Triggered when an app card is clicked
  // If "Revenue Tracker" (app id 7), opens the Handsontable spreadsheet modal!
  const handleCardClick = (app) => {
    if (app.id === 7 || app.title === 'Revenue Tracker') {
      setIsRevenueModalOpen(true);
    } else {
      setToast({ open: true, message: `Launching "${app.title}"...`, severity: 'success' });
    }
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

  // ─── Helper: Search clear handler ──────────────────────────────────────
  const handleClearSearch = () => setSearchQuery('');

  // ─── JSX / UI ────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? blcColors.darkBg : blcColors.cream, pb: 8, transition: 'background-color 0.3s ease' }}>

      {/* ── Top Navbar (Common Component) ── */}
      <Navbar
        mode={mode}
        toggleMode={toggleMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        onExternalLinkClick={() => setToast({ open: true, message: 'Opening documentation...', severity: 'info' })}
      />

      {/* ── Main Page Content ── */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>

        {/* ── Welcome Banner (Common Component) ── */}
        <WelcomeBanner userName={currentUser?.name} isDark={isDark} />

        {/* ── Search Bar (Common Component) ── */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClear={handleClearSearch}
          totalAppsCount={totalAppsCount}
          isDark={isDark}
        />

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
                {/* ── App Cards Grid (Common Component) ── */}
                <Grid container spacing={2.5}>
                  {category.apps.map((app) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={app.id}>
                      <AppCard
                        app={app}
                        isDark={isDark}
                        onCardClick={handleCardClick}
                      />
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

      {/* ── Handsontable Spreadsheet Modal ──
          Opens when user clicks the "Revenue Tracker" app card. */}
      <RevenueTrackerModal
        open={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        isDark={isDark}
      />
    </Box>
  );
};
