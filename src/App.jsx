// App.jsx
// PURPOSE: The root component of the application.
// It sets up 4 key things that wrap the entire app:
//   1. ThemeProvider  — applies MUI light/dark theme globally
//   2. CssBaseline    — resets browser default CSS (margins, fonts, etc.)
//   3. AuthProvider   — makes login/logout state available to all components
//   4. BrowserRouter  — enables client-side URL routing

import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { getTheme } from './theme';                             // Custom MUI theme builder
import { AuthProvider } from './context/AuthContext';           // Global auth state
import { ProtectedRoute } from './components/routes/ProtectedRoute'; // Guards private pages
import { PublicRoute } from './components/routes/PublicRoute';       // Guards public pages (e.g. login)

// Route-level code-splitting: Heavy pages (Handsontable, Dnd-Kit, etc.) are loaded on-demand
const LoginPage = React.lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const RevenueTrackerPage = React.lazy(() => import('./pages/RevenueTrackerPage').then((m) => ({ default: m.RevenueTrackerPage })));
const WeatherPage = React.lazy(() => import('./pages/WeatherPage').then((m) => ({ default: m.WeatherPage })));
const SalesSummaryPage = React.lazy(() => import('./pages/SalesSummaryPage').then((m) => ({ default: m.SalesSummaryPage })));
const CustomerInsightPage = React.lazy(() => import('./pages/CustomerInsightPage').then((m) => ({ default: m.CustomerInsightPage })));

/**
 * Lightweight loading indicator while an on-demand route chunk loads.
 */
function PageFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress size={36} sx={{ color: '#0d9488' }} />
    </Box>
  );
}

/**
 * Helper component that resets window scroll position to (0,0) on every route change.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  // ─── Theme Mode (Light / Dark) ──────────────────────────────────────────
  // Read saved theme preference from localStorage so it persists across sessions.
  // Defaults to 'light' if nothing is stored.
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('theme_mode') || 'light';
  });

  // Toggles between 'light' and 'dark', and saves the choice to localStorage
  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme_mode', next); // Persist preference
      return next;
    });
  };

  // Synchronize Handsontable theme classes on document.body for portals (like dropdown filters)
  useEffect(() => {
    document.body.classList.remove('ht-theme-main', 'ht-theme-main-dark');
    document.body.classList.add(mode === 'dark' ? 'ht-theme-main-dark' : 'ht-theme-main');
  }, [mode]);

  // Build the MUI theme object based on the current mode ('light' or 'dark')
  const theme = getTheme(mode);

  return (
    // ThemeProvider makes the MUI theme (colors, typography, etc.) available
    // to every MUI component in the tree
    <ThemeProvider theme={theme}>

      {/* CssBaseline normalizes browser CSS — removes default margins/paddings,
          sets box-sizing, and applies the theme's background color to <body> */}
      <CssBaseline />

      {/* AuthProvider gives all child components access to auth state (login, logout, currentUser)
          via the useAuth() hook — must be above BrowserRouter so route guards can use auth */}
      <AuthProvider>

        {/* BrowserRouter enables React Router — listens to URL changes and renders
            matching routes without full page reloads */}
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageFallback />}>
            <Routes>

              {/* /login — Public route: accessible only when NOT logged in.
                  PublicRoute redirects logged-in users away from the login page. */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    {/* Pass mode/toggleMode so the login page can show the theme toggle */}
                    <LoginPage mode={mode} toggleMode={toggleMode} />
                  </PublicRoute>
                }
              />

              {/* /home — Protected route: accessible only when logged in.
                  ProtectedRoute redirects unauthenticated users to /login. */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <DashboardPage mode={mode} toggleMode={toggleMode} />
                  </ProtectedRoute>
                }
              />

              {/* /revenue-tracker — Standalone Protected Revenue Tracker Page (Read-only for Users, Editable for Admin) */}
              <Route
                path="/revenue-tracker"
                element={
                  <ProtectedRoute>
                    <RevenueTrackerPage mode={mode} toggleMode={toggleMode} />
                  </ProtectedRoute>
                }
              />

              {/* /weather — Standalone Protected Weather Forecast Page powered by OpenWeatherMap API */}
              <Route
                path="/weather"
                element={
                  <ProtectedRoute>
                    <WeatherPage mode={mode} toggleMode={toggleMode} />
                  </ProtectedRoute>
                }
              />

              {/* /sales-summary — Sales Summary with Handsontable ColumnSummary aggregate demo */}
              <Route
                path="/sales-summary"
                element={
                  <ProtectedRoute>
                    <SalesSummaryPage mode={mode} toggleMode={toggleMode} />
                  </ProtectedRoute>
                }
              />

              {/* /customer-insights — Handsontable customer insights ledger with WebWorker sorting & filtering */}
              <Route
                path="/customer-insights"
                element={
                  <ProtectedRoute>
                    <CustomerInsightPage mode={mode} toggleMode={toggleMode} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer-insight"
                element={
                  <ProtectedRoute>
                    <CustomerInsightPage mode={mode} toggleMode={toggleMode} />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all: redirect root "/" and any unknown URL to /home.
                  ProtectedRoute on /home will then redirect to /login if not authenticated. */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />

            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
