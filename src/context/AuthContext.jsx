// AuthContext.jsx
// PURPOSE: Creates a global authentication "store" using React's Context API.
// Any component in the app can call useAuth() to get the logged-in user,
// check if authenticated, or call login/logout — without passing props manually.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { googleLogout } from '@react-oauth/google';

// Import local user data (no backend — credentials are stored in a JSON file)
import usersData from '../data/users.json';

// ─── Company Email Domain Restriction ─────────────────────────────────────────
// Restricts Google OAuth to corporate email domains (e.g. ima360.com).
// Can be customized via VITE_ALLOWED_EMAIL_DOMAINS in .env (comma-separated).
const rawAllowedDomains = import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS;
const ALLOWED_DOMAINS = rawAllowedDomains
  ? rawAllowedDomains.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
  : ['ima360.com'];

// Create the context object. Starts as null until AuthProvider wraps the app.
const AuthContext = createContext(null);

// AuthProvider wraps the entire app (in App.jsx) so all child components
// can access authentication state via useAuth()
export const AuthProvider = ({ children }) => {
  // currentUser holds the logged-in user's info (name, username, role, loginTime, expiresAt)
  // Restored synchronously from localStorage / sessionStorage to prevent any render flashes
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const rawUser = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        // Auto-logout: Check if session / token has already expired
        if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('remember_me');
          sessionStorage.removeItem('auth_user');
          return null;
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error loading session from storage:', err);
    }
    return null;
  });

  // loading is false immediately because session is restored synchronously
  const [loading] = useState(false);

  // ─── Logout Handler ───────────────────────────────────────────────────────
  // Clears all auth state, revokes Google session, and flushes storages.
  const logout = useCallback(() => {
    // Revoke / clear Google OAuth session so account selection is prompted next time
    try {
      googleLogout();
    } catch (err) {
      console.error('Error during googleLogout:', err);
    }

    setCurrentUser(null); // Clear React state → triggers re-render to logged-out UI

    // Remove user data from both storages to fully end the session
    localStorage.removeItem('auth_user');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('auth_user');

    // Clear ledger dataset cache on logout so fresh login always restores initial seed data
    localStorage.removeItem('contract_ledger_dataset');
    localStorage.removeItem('ai_copilot_dataset');
  }, []);

  // ─── Auto-Logout on Token / Session Expiration ──────────────────────────────
  // Automatically triggers logout when the Google OAuth token (or session) expires.
  useEffect(() => {
    if (!currentUser?.expiresAt) return;

    const remainingMs = currentUser.expiresAt - Date.now();
    // Cap duration to 32-bit signed int limit (24.8 days) and clamp minimum to 0
    const timeoutDuration = Math.min(Math.max(0, remainingMs), 2147483647);

    const timer = setTimeout(() => {
      logout();
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [currentUser, logout]);

  // ─── Multi-Tab Sync: Listen for storage changes across browser tabs ─────────
  useEffect(() => {
    const handleStorageChange = (event) => {
      // If auth_user was removed or changed in another tab, sync state immediately
      if (event.key === 'auth_user') {
        if (!event.newValue) {
          // Logged out in another tab → log out here as well
          setCurrentUser(null);
        } else {
          try {
            const syncedUser = JSON.parse(event.newValue);
            // Verify expiration before syncing
            if (syncedUser.expiresAt && Date.now() >= syncedUser.expiresAt) {
              setCurrentUser(null);
            } else {
              setCurrentUser(syncedUser);
            }
          } catch (err) {
            console.error('Error syncing auth state across tabs:', err);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ─── Login Handler (Standard Credentials) ──────────────────────────────────
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
      // Build a safe user object with an 8-hour session expiration
      const authUser = {
        name: user.name,
        username: user.username,
        role: user.role || 'Member', // Default to 'Member' if role is not set in JSON
        loginTime: new Date().toISOString(), // Track when the user logged in
        expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8-hour session for standard login
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
  // Decodes the Google JWT ID token, checks company email restrictions, extracts token expiry, and sets session.
  const loginWithGoogle = async (credential, rememberMe = true) => {
    try {
      if (!credential) {
        return { success: false, error: 'No Google credential received.' };
      }

      // Decode the JWT ID Token from Google
      const decoded = jwtDecode(credential);

      const emailLower = (decoded.email || '').toLowerCase();
      const emailDomain = emailLower.includes('@') ? emailLower.split('@')[1] : '';

      // Check if user is pre-configured in users.json (e.g. admin test account)
      const matchedUser = usersData.find(
        (u) => u.username?.toLowerCase() === emailLower
      );

      // Verify domain restriction:
      // Must belong to an allowed company domain OR be an explicitly authorized user in users.json
      const isAllowedDomain = ALLOWED_DOMAINS.includes(emailDomain);
      const isExplicitlyAuthorized = !!matchedUser;

      if (!isAllowedDomain && !isExplicitlyAuthorized) {
        // Clear Google session so unauthorized account is not cached
        try {
          googleLogout();
        } catch (logoutErr) {
          console.error('Error during googleLogout on domain rejection:', logoutErr);
        }

        const domainList = ALLOWED_DOMAINS.map((d) => `@${d}`).join(', ');
        return {
          success: false,
          error: `Access restricted: Only ${domainList} company accounts are allowed to sign in.`,
        };
      }

      const role =
        matchedUser?.role ||
        (emailLower.includes('admin') ? 'Admin' : 'User');

      // Google ID token exp is in seconds; convert to milliseconds
      const tokenExpiresAt = decoded.exp
        ? decoded.exp * 1000
        : Date.now() + 60 * 60 * 1000; // 1-hour fallback if exp is not provided

      const authUser = {
        name: decoded.name || decoded.email,
        username: decoded.email,
        email: decoded.email,
        avatar: decoded.picture || null,
        role,
        provider: 'google',
        googleId: decoded.sub,
        loginTime: new Date().toISOString(),
        expiresAt: tokenExpiresAt, // Exact Google OAuth token expiration timestamp (ms)
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

  // ─── Context Value ────────────────────────────────────────────────────────
  // Everything exposed to child components via useAuth()
  const value = {
    currentUser,                          // The logged-in user object (or null)
    isAuthenticated: !!currentUser,       // Boolean shorthand: true if user is logged in
    isAdmin: currentUser?.role === 'Admin', // True only for the Admin user
    loading,                              // True while restoring session on first load
    allowedEmailDomains: ALLOWED_DOMAINS, // List of allowed company email domains
    login,                                // Function to log in
    loginWithGoogle,                      // Function to log in with Google OAuth
    logout,                               // Function to log out
  };

  // Wrap all children with the context provider so they can access `value`
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── useAuth Hook ─────────────────────────────────────────────────────────────
// Custom hook for easy access to auth context.
// Usage: const { currentUser, isAuthenticated, login, logout, allowedEmailDomains } = useAuth();
// Throws an error if used outside of <AuthProvider> to catch setup mistakes early.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
