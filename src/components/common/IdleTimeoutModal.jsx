// IdleTimeoutModal.jsx
// ============================================================================
// PURPOSE:
//   Cross-tab aware idle timeout detector and warning modal.
//
// HOW MULTI-TAB IDLE SYNC WORKS (Walkie-Talkie API via BroadcastChannel):
//   1. Activity (mouse move, click, keystroke, scroll) in ANY open tab updates
//      the shared timestamp and broadcasts via BroadcastChannel ('app_activity_channel').
//   2. Background tabs receive the message directly and reset their idle state.
//   3. If a user is actively working in Tab 2 for 15 minutes, Tab 1 (which hasn't
//      been visited) sees the recent activity from Tab 2 and DOES NOT log out.
//   4. Only when NO tab has received any user activity for 4 minutes (240,000 ms)
//      does the warning popup appear, with a 60-second countdown to auto-logout.
//   5. At exactly 5 minutes (300,000 ms) of total inactivity, the user is logged out.
//   6. Clicking "Stay Logged In" broadcasts a reset message across all tabs.
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { AppDialog } from './AppDialog';
import { AppButton } from './AppButton';
import { WarningAmberIcon } from '../../icons';

// Default timeouts: 5 minutes total idle limit, popup appears at 4th min (60-second warning countdown)
// Can be customized via environment variables for rapid testing (e.g. VITE_IDLE_TIMEOUT_MS=15000)
const TOTAL_IDLE_TIMEOUT_MS =
  Number(import.meta.env.VITE_IDLE_TIMEOUT_MS) || 5 * 60 * 1000; // 5 minutes total
const WARNING_DURATION_MS =
  Number(import.meta.env.VITE_IDLE_WARNING_MS) || 60 * 1000;    // 60 seconds warning countdown
const WARNING_THRESHOLD_MS =
  Math.max(0, TOTAL_IDLE_TIMEOUT_MS - WARNING_DURATION_MS);     // Shows at 4th minute (240,000 ms)

const STORAGE_ACTIVE_KEY = 'app_last_active_time';
const ACTIVITY_CHANNEL_NAME = 'app_activity_channel';

export const IdleTimeoutModal = () => {
  const { isAuthenticated, logout } = useAuth();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.ceil(WARNING_DURATION_MS / 1000)
  );

  // Ref tracking whether the warning popup is open so event listeners
  // know NOT to auto-reset the idle timer when user moves the mouse to click a button
  const showWarningRef = useRef(false);
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // Throttling ref to prevent excessive writes on fast mouse movements
  const lastLocalWriteRef = useRef(0);

  // Walkie-Talkie Channel Ref for Direct Inter-Tab Activity Sync
  const activityChannelRef = useRef(null);

  // ─── Direct Inter-Tab Walkie-Talkie Listener ──────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(ACTIVITY_CHANNEL_NAME);
    activityChannelRef.current = channel;

    channel.onmessage = (event) => {
      // If another tab reported activity or clicked "Stay Logged In", dismiss popup immediately
      if (event.data?.type === 'USER_ACTIVITY' || event.data?.type === 'STAY_LOGGED_IN') {
        setShowWarning(false);
      }
    };

    return () => {
      channel.close();
      activityChannelRef.current = null;
    };
  }, [isAuthenticated]);

  // ─── Update Activity Timestamp in Shared Storage & Broadcast ───────────────
  const recordActivity = useCallback(() => {
    if (!isAuthenticated) return;

    // While warning modal is visible, DO NOT reset idle on mouse moves.
    // The user must explicitly click "Stay Logged In" or "Log Out".
    if (showWarningRef.current) return;

    const now = Date.now();
    // Throttle writes and broadcasts to at most once every 2 seconds
    if (now - lastLocalWriteRef.current > 2000) {
      lastLocalWriteRef.current = now;
      try {
        localStorage.setItem(STORAGE_ACTIVE_KEY, String(now));
        // Direct walkie-talkie broadcast to all other open tabs
        if (activityChannelRef.current) {
          activityChannelRef.current.postMessage({ type: 'USER_ACTIVITY', timestamp: now });
        }
      } catch (err) {
        console.error('Error updating idle activity timestamp:', err);
      }
    }
  }, [isAuthenticated]);

  // ─── Listen for User Input Events in This Tab ──────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize timestamp if missing
    if (!localStorage.getItem(STORAGE_ACTIVE_KEY)) {
      localStorage.setItem(STORAGE_ACTIVE_KEY, String(Date.now()));
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleUserActivity = () => {
      recordActivity();
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
    };
  }, [isAuthenticated, recordActivity]);

  // ─── Periodic Idle Checker Interval ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const storedTime = Number(localStorage.getItem(STORAGE_ACTIVE_KEY)) || Date.now();
      const idleTime = Date.now() - storedTime;

      if (idleTime >= TOTAL_IDLE_TIMEOUT_MS) {
        // Exceeded total 5 minutes → log out user immediately
        setShowWarning(false);
        logout();
      } else if (idleTime >= WARNING_THRESHOLD_MS) {
        // Reached 4th minute → display modal with countdown to the 5th minute
        const msLeft = TOTAL_IDLE_TIMEOUT_MS - idleTime;
        const secsLeft = Math.max(1, Math.ceil(msLeft / 1000));
        setSecondsRemaining(secsLeft);
        setShowWarning(true);
      } else {
        // User active in this tab or another tab → close modal
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  // ─── Action Handlers ───────────────────────────────────────────────────────
  const handleStayLoggedIn = () => {
    const now = Date.now();
    lastLocalWriteRef.current = now;
    localStorage.setItem(STORAGE_ACTIVE_KEY, String(now));

    // Broadcast reset to all other tabs via Walkie-Talkie
    try {
      if (activityChannelRef.current) {
        activityChannelRef.current.postMessage({ type: 'STAY_LOGGED_IN', timestamp: now });
      }
    } catch (broadcastErr) {
      console.error('Error broadcasting stay logged in:', broadcastErr);
    }

    setShowWarning(false);
  };

  const handleLogoutNow = () => {
    setShowWarning(false);
    logout();
  };

  if (!isAuthenticated || !showWarning) {
    return null;
  }

  return (
    <AppDialog
      open={showWarning}
      onClose={handleStayLoggedIn} // Clicking outside or escape extends session
      title="Inactivity Warning"
      subtitle="You have been idle across all tabs"
      icon={<WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 28 }} />}
      maxWidth="xs"
      zIndex={1600} // Render on top of any page elements or existing modals
      contentSx={{
        py: '24px !important',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      actions={
        <Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'flex-end' }}>
          <AppButton
            variant="secondary"
            size="medium"
            onClick={handleLogoutNow}
          >
            Log Out
          </AppButton>
          <AppButton
            variant="primary"
            size="medium"
            onClick={handleStayLoggedIn}
          >
            Stay Logged In
          </AppButton>
        </Box>
      }
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 1,
          px: 2.5,
          py: 1.25,
          borderRadius: 2,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.25)',
        }}
      >
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#d97706',
            lineHeight: 1,
          }}
        >
          {secondsRemaining}s
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}
        >
          remaining
        </Typography>
      </Box>
    </AppDialog>
  );
};
