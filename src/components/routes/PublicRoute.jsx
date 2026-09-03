// PublicRoute.jsx
// PURPOSE: A route guard that blocks already-authenticated users from visiting
// public-only pages (like the login page).
//
// HOW IT WORKS:
//   - Wrap any <Route> with <PublicRoute> in App.jsx
//   - If the user IS logged in → redirect them to /home (they don't need to log in again)
//   - If the user is NOT logged in → render the page normally (children)
//   - While auth state is loading → show a spinner to avoid a flash-redirect
//
// This is the opposite of ProtectedRoute:
//   ProtectedRoute  = "you must be logged IN to see this"
//   PublicRoute     = "you must be logged OUT to see this"
//
// Example use case: If a user with an active session types /login in the URL bar,
// they get sent straight to /home instead of seeing the login form again.

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Access global auth state
import { Box, CircularProgress } from '@mui/material';

export const PublicRoute = ({ children }) => {
  // Get authentication status and loading state from the global auth context
  const { isAuthenticated, loading } = useAuth();

  // ─── Loading State ────────────────────────────────────────────────────────
  // On first load, AuthContext checks localStorage/sessionStorage to restore sessions.
  // During that check, loading=true. We show a spinner instead of rendering children
  // because if we skip this, a user with "Remember Me" might briefly see the login
  // page before being redirected — a jarring flash of wrong content.
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',           // Full screen height
          display: 'flex',
          alignItems: 'center',         // Center vertically
          justifyContent: 'center',     // Center horizontally
          bgcolor: 'background.default', // Match theme background
        }}
      >
        {/* Spinner shown while determining auth state */}
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // ─── Already Authenticated ────────────────────────────────────────────────
  // User is already logged in — no need to show the login page.
  // Redirect to /home. `replace` prevents the back button from returning to /login.
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // ─── Not Authenticated ────────────────────────────────────────────────────
  // User is not logged in → show the public page (e.g. LoginPage)
  return children;
};
