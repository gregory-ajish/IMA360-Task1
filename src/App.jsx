// App.jsx
// PURPOSE: The root component of the application.
// It sets up 4 key things that wrap the entire app:
//   1. ThemeProvider  — applies MUI light/dark theme globally
//   2. CssBaseline    — resets browser default CSS (margins, fonts, etc.)
//   3. AuthProvider   — makes login/logout state available to all components
//   4. BrowserRouter  — enables client-side URL routing

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';                             // Custom MUI theme builder
import { AuthProvider } from './context/AuthContext';           // Global auth state
import { ProtectedRoute } from './components/routes/ProtectedRoute'; // Guards private pages
import { PublicRoute } from './components/routes/PublicRoute';       // Guards public pages (e.g. login)
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

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

            {/* Catch-all: redirect root "/" and any unknown URL to /home.
                ProtectedRoute on /home will then redirect to /login if not authenticated. */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
