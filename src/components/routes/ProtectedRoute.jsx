// ProtectedRoute.jsx
// PURPOSE: A route guard that blocks unauthenticated users from accessing private pages.
//
// HOW IT WORKS:
//   - Wrap any <Route> with <ProtectedRoute> in App.jsx
//   - If the user is NOT logged in → redirect them to /login
//   - If the user IS logged in → render the page normally (children)
//   - While auth state is loading (e.g. restoring session on refresh) → show a spinner
//     so the user doesn't get a flash-redirect to /login before we know if they're logged in

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Get auth state from global context
import { Box, CircularProgress } from '@mui/material';

export const ProtectedRoute = ({ children }) => {
  // Pull isAuthenticated and loading from the global auth context
  const { isAuthenticated, loading } = useAuth();

  // Capture the current URL path so we can redirect back to it after login
  // e.g. user tries to visit /home → gets sent to /login → after login, goes back to /home
  const location = useLocation();

  // ─── Loading State ────────────────────────────────────────────────────────
  // On first page load, AuthContext checks localStorage/sessionStorage for a saved session.
  // During that brief check, loading=true. We show a spinner instead of redirecting,
  // because if we don't wait, a logged-in user with "Remember Me" would be wrongly
  // sent to /login before their session is restored.
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',          // Full screen height
          display: 'flex',
          alignItems: 'center',        // Center vertically
          justifyContent: 'center',    // Center horizontally
          bgcolor: 'background.default', // Use theme background color
        }}
      >
        {/* MUI spinner shown while session is being restored */}
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // ─── Authentication Check ─────────────────────────────────────────────────
  // If loading is done and user is still not authenticated → redirect to login.
  // We pass `state={{ from: location }}` so the login page knows where to redirect
  // the user after a successful login (back to the page they originally wanted).
  // `replace` replaces the current history entry so the back button doesn't go
  // back to the protected page.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ─── Authenticated ────────────────────────────────────────────────────────
  // User is logged in → render the actual protected page (e.g. DashboardPage)
  return children;
};
