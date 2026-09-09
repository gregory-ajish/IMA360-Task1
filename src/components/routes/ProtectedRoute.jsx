// ProtectedRoute.jsx
// PURPOSE: A route guard that blocks unauthenticated users from accessing private pages,
// and optionally restricts admin-only routes to users with Admin role.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Get auth state from global context
import { Box, CircularProgress } from '@mui/material';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  // Pull isAuthenticated, isAdmin, and loading from the global auth context
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Capture current URL path for redirect back after login
  const location = useLocation();

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // ─── Authentication Check ─────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ─── Admin Role Restriction Check ─────────────────────────────────────────
  if (adminOnly && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // ─── Authenticated & Authorized ───────────────────────────────────────────
  return children;
};

