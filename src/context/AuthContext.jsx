// AuthContext.jsx
// PURPOSE: Creates a global authentication "store" using React's Context API.
// Any component in the app can call useAuth() to get the logged-in user,
// check if authenticated, or call login/logout — without passing props manually.

import React, { createContext, useContext, useState, useEffect } from 'react';

// Import local user data (no backend — credentials are stored in a JSON file)
import usersData from '../data/users.json';

// Create the context object. Starts as null until AuthProvider wraps the app.
const AuthContext = createContext(null);

// AuthProvider wraps the entire app (in App.jsx) so all child components
// can access authentication state via useAuth()
export const AuthProvider = ({ children }) => {
  // currentUser holds the logged-in user's info (name, username, role, loginTime)
  // null means no one is logged in
  const [currentUser, setCurrentUser] = useState(null);

  // loading is true while we check storage on app startup.
  // This prevents a brief "not logged in" flash before the session is restored.
  const [loading, setLoading] = useState(true);

  // ─── Session Restore on Page Load ────────────────────────────────────────
  // Runs once when the app first mounts.
  // Checks if a user was previously logged in and restores their session.
  useEffect(() => {
    try {
      // localStorage persists even after the browser is closed (Remember Me)
      const localUser = localStorage.getItem('auth_user');

      // sessionStorage is cleared when the browser tab is closed (no Remember Me)
      const sessionUser = sessionStorage.getItem('auth_user');

      if (localUser) {
        // User had "Remember Me" checked — restore from localStorage
        setCurrentUser(JSON.parse(localUser));
      } else if (sessionUser) {
        // User was logged in this session — restore from sessionStorage
        setCurrentUser(JSON.parse(sessionUser));
      }
    } catch (err) {
      // If stored data is corrupted/invalid JSON, log it and continue as logged out
      console.error('Error loading session from storage:', err);
    } finally {
      // Always mark loading as done so the app can render (no infinite spinner)
      setLoading(false);
    }
  }, []); // Empty dependency array = runs only once on mount

  // ─── Login Handler ────────────────────────────────────────────────────────
  // Called from the Login page with the user's input.
  // Returns { success: true, user } on success or { success: false, error } on failure.
  const login = async (identifier, password, rememberMe) => {
    // Simulate a short network delay so the UI feels like a real API call
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Normalize the identifier (trim spaces, lowercase) for case-insensitive matching
    const cleanIdentifier = identifier.trim().toLowerCase();

    // Search usersData (the JSON file) for a matching username + password
    const user = usersData.find(
      (u) =>
        u.username.toLowerCase() === cleanIdentifier &&
        u.password === password
    );

    if (user) {
      // Build a safe user object — only store what the UI needs, not the password
      const authUser = {
        name: user.name,
        username: user.username,
        role: user.role || 'Member', // Default to 'Member' if role is not set in JSON
        loginTime: new Date().toISOString(), // Track when the user logged in
      };

      // Update React state so all components re-render with the new user
      setCurrentUser(authUser);

      if (rememberMe) {
        // "Remember Me" checked → persist in localStorage (survives browser restarts)
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        localStorage.setItem('remember_me', 'true');
        sessionStorage.removeItem('auth_user'); // Clean up the other storage
      } else {
        // No "Remember Me" → use sessionStorage (cleared when tab closes)
        sessionStorage.setItem('auth_user', JSON.stringify(authUser));
        localStorage.removeItem('auth_user');    // Clean up the other storage
        localStorage.removeItem('remember_me');
      }

      return { success: true, user: authUser };
    }

    // No matching user found — return an error message for the login form to display
    return {
      success: false,
      error: 'Invalid username or password. Please try again.',
    };
  };

  // ─── Logout Handler ───────────────────────────────────────────────────────
  // Clears all auth state and storage so the user is fully signed out.
  const logout = () => {
    setCurrentUser(null); // Clear React state → triggers re-render to logged-out UI

    // Remove user data from both storages to fully end the session
    localStorage.removeItem('auth_user');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('auth_user');
  };

  // ─── Context Value ────────────────────────────────────────────────────────
  // Everything exposed to child components via useAuth()
  const value = {
    currentUser,                    // The logged-in user object (or null)
    isAuthenticated: !!currentUser, // Boolean shorthand: true if user is logged in
    loading,                        // True while restoring session on first load
    login,                          // Function to log in
    logout,                         // Function to log out
  };

  // Wrap all children with the context provider so they can access `value`
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── useAuth Hook ─────────────────────────────────────────────────────────────
// Custom hook for easy access to auth context.
// Usage: const { currentUser, isAuthenticated, login, logout } = useAuth();
// Throws an error if used outside of <AuthProvider> to catch setup mistakes early.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
