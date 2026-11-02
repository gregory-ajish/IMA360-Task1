// AuthContext.jsx
// PURPOSE: Creates a global authentication "store" using React's Context API.
// Any component in the app can call useAuth() to get the logged-in user,
// check if authenticated, or call login/logout — without passing props manually.

import React, { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

// Import local user data (no backend — credentials are stored in a JSON file)
import usersData from '../data/users.json';

// Create the context object. Starts as null until AuthProvider wraps the app.
const AuthContext = createContext(null);

// AuthProvider wraps the entire app (in App.jsx) so all child components
// can access authentication state via useAuth()
export const AuthProvider = ({ children }) => {
  // currentUser holds the logged-in user's info (name, username, role, loginTime)
  // Restored synchronously from localStorage / sessionStorage to prevent any render flashes
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const localUser = localStorage.getItem('auth_user');
      if (localUser) return JSON.parse(localUser);
      const sessionUser = sessionStorage.getItem('auth_user');
      if (sessionUser) return JSON.parse(sessionUser);
    } catch (err) {
      console.error('Error loading session from storage:', err);
    }
    return null;
  });

  // loading is false immediately because session is restored synchronously
  const [loading] = useState(false);

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

  // ─── Google OAuth Login Handler ───────────────────────────────────────────
  // Called when Google Identity Services returns a credential token.
  // Decodes the Google JWT ID token and maps profile data to our auth user session.
  const loginWithGoogle = async (credential, rememberMe = true) => {
    try {
      if (!credential) {
        return { success: false, error: 'No Google credential received.' };
      }

      // Decode the JWT ID Token from Google
      const decoded = jwtDecode(credential);

      // Check if email matches any pre-configured user or has admin privileges
      const emailLower = (decoded.email || '').toLowerCase();
      const matchedUser = usersData.find(
        (u) => u.username?.toLowerCase() === emailLower
      );

      const role =
        matchedUser?.role ||
        (emailLower.includes('admin') ? 'Admin' : 'User');

      const authUser = {
        name: decoded.name || decoded.email,
        username: decoded.email,
        email: decoded.email,
        avatar: decoded.picture || null,
        role,
        provider: 'google',
        googleId: decoded.sub,
        loginTime: new Date().toISOString(),
      };

      setCurrentUser(authUser);

      if (rememberMe) {
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        localStorage.setItem('remember_me', 'true');
        sessionStorage.removeItem('auth_user');
      } else {
        sessionStorage.setItem('auth_user', JSON.stringify(authUser));
        localStorage.removeItem('auth_user');
        localStorage.removeItem('remember_me');
      }

      return { success: true, user: authUser };
    } catch (err) {
      console.error('Error decoding Google OAuth credential:', err);
      return { success: false, error: 'Failed to process Google sign-in.' };
    }
  };

  // ─── Logout Handler ───────────────────────────────────────────────────────
  // Clears all auth state and storage so the user is fully signed out.
  const logout = () => {
    setCurrentUser(null); // Clear React state → triggers re-render to logged-out UI

    // Remove user data from both storages to fully end the session
    localStorage.removeItem('auth_user');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('auth_user');

    // Clear ledger dataset cache on logout so fresh login always restores initial seed data
    localStorage.removeItem('contract_ledger_dataset');
    localStorage.removeItem('ai_copilot_dataset');
  };

  // ─── Context Value ────────────────────────────────────────────────────────
  // Everything exposed to child components via useAuth()
  const value = {
    currentUser,                    // The logged-in user object (or null)
    isAuthenticated: !!currentUser, // Boolean shorthand: true if user is logged in
    isAdmin: currentUser?.role === 'Admin', // True only for the Admin user
    loading,                        // True while restoring session on first load
    login,                          // Function to log in
    loginWithGoogle,                // Function to log in with Google OAuth
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
