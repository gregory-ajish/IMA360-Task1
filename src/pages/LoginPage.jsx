// LoginPage.jsx
// PURPOSE: The login form page. Shown to unauthenticated users at the /login route.
// It is wrapped by <PublicRoute> in App.jsx, so logged-in users are automatically
// redirected away from this page.
//
// FEATURES:
//   - Form validation using react-hook-form + Yup schema
//   - Username + password fields with inline error messages
//   - Show/hide password toggle
//   - "Remember Me" checkbox (persists session in localStorage vs sessionStorage)
//   - Server-side error display (wrong credentials)
//   - Light/Dark mode toggle button
//   - Redirects to the originally intended page after login (via location.state.from)
//   - Commented-out demo credential chips (can be re-enabled for testing)

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// react-hook-form: manages form state, validation, and submission
// Controller: wraps uncontrolled MUI inputs so react-hook-form can control them
import { useForm, Controller } from 'react-hook-form';

// yupResolver: bridges Yup schema validation with react-hook-form
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup'; // Yup: declarative object schema validation

// MUI components for layout and UI
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Paper,
  Container,
  Tooltip,
} from '@mui/material';

// MUI icons used in the form UI
import {
  Visibility,                              // Eye icon — show password
  VisibilityOff,                           // Eye-slash icon — hide password
  PersonOutlineOutlined as UserIcon,       // Person icon in username field
  LockOutlined as LockIcon,               // Lock icon in password field
  DarkMode as DarkModeIcon,               // Moon icon — switch to dark
  LightMode as LightModeIcon,             // Sun icon — switch to light
  HubOutlined,                             // Hub/network icon — app logo
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext'; // login() function from auth context
import { blcColors } from '../theme';             // Brand color palette

// ─── Validation Schema ────────────────────────────────────────────────────────
// Yup schema defines rules for each form field.
// react-hook-form runs this against the form values on every submit.
// Errors are displayed below each field automatically.
const schema = yup.object().shape({
  identifier: yup
    .string()
    .required('Username is required')
    .min(3, 'Must be at least 3 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(4, 'Must be at least 4 characters'),
  rememberMe: yup.boolean(), // Optional boolean — no validation rule needed
});

// ─── LoginPage Component ──────────────────────────────────────────────────────
// Props:
//   mode       {string}   — 'light' or 'dark', controlled by App.jsx
//   toggleMode {function} — flips the theme mode, passed down from App.jsx
export const LoginPage = ({ mode, toggleMode }) => {
  // showPassword: toggles the password field between type="password" and type="text"
  const [showPassword, setShowPassword] = useState(false);

  // serverError: holds the error message returned from login() (e.g. wrong password)
  // Displayed in a red Alert banner above the form
  const [serverError, setServerError] = useState('');

  // isSubmitting: true while the login async call is in-flight
  // Disables the submit button and shows a spinner to prevent double-submits
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();       // Auth function from global context
  const navigate = useNavigate();    // For redirecting after successful login
  const location = useLocation();    // To read state passed by ProtectedRoute

  // After login, redirect to the page the user originally tried to visit.
  // ProtectedRoute stores the attempted URL in location.state.from when redirecting.
  // Default to /home if the user navigated directly to /login.
  const from = location.state?.from?.pathname || '/home';

  // Shorthand — used throughout the JSX for conditional dark/light styling
  const isDark = mode === 'dark';

  // ─── react-hook-form Setup ──────────────────────────────────────────────
  // control: passed to each <Controller> to wire MUI inputs into the form
  // handleSubmit: wraps onSubmit, runs validation first, then calls our handler
  // setValue: programmatically sets a field value (used by demo chip auto-fill)
  // errors: object containing validation error messages for each field
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema), // Run Yup validation on submit
    defaultValues: { identifier: '', password: '', rememberMe: false },
  });

  // ─── Form Submit Handler ─────────────────────────────────────────────────
  // Called by handleSubmit() only after all Yup validations pass.
  const onSubmit = async (data) => {
    setServerError('');     // Clear any previous error on new attempt
    setIsSubmitting(true);  // Disable button + show spinner
    try {
      // Call login from AuthContext — validates credentials against users.json
      const result = await login(data.identifier, data.password, data.rememberMe);
      if (result.success) {
        // Redirect to the originally intended page (or /home)
        navigate(from, { replace: true }); // replace: true so back button doesn't return to /login
      } else {
        // Show the error message returned by the login function
        setServerError(result.error || 'Authentication failed.');
      }
    } catch {
      // Catch unexpected errors (e.g. JSON parse failure)
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false); // Always re-enable the button
    }
  };

  // ─── Demo Auto-Fill Handler ──────────────────────────────────────────────
  // Fills the form fields with demo credentials when a chip is clicked.
  // shouldValidate: true runs validation immediately so errors clear on fill.
  const handleFillDemo = (username, password) => {
    setValue('identifier', username, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setServerError(''); // Clear any existing server error
  };

  // ─── JSX / UI ────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        minHeight: '100vh',       // Full viewport height so background fills screen
        display: 'flex',
        alignItems: 'center',     // Center the card vertically
        justifyContent: 'center', // Center the card horizontally
        bgcolor: isDark ? blcColors.darkBg : blcColors.cream, // Theme background
        p: { xs: 2, sm: 4 },     // Padding for small screens
        position: 'relative',    // Needed for absolute-positioned theme toggle
        transition: 'background-color 0.3s ease', // Smooth mode switch
      }}
    >
      {/* ── Dark/Light Mode Toggle ──
          Positioned in the top-right corner. Shows sun/moon icon based on current mode. */}
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <IconButton
            id="theme-toggle-btn"
            onClick={toggleMode}
            size="small"
            sx={{
              color: isDark ? '#94a3b8' : blcColors.textMid,
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${isDark ? blcColors.darkBorder : '#d1d9f0'}`,
            }}
          >
            {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Login Card ──
          maxWidth="xs" keeps the card narrow and centered — standard for login forms. */}
      <Container maxWidth="xs">
        <Card
          sx={{
            boxShadow: isDark
              ? '0 8px 48px rgba(0,0,0,0.6)'       // Deep shadow in dark mode
              : '0 4px 24px rgba(30,58,138,0.10)',  // Soft navy shadow in light mode
            borderRadius: '12px',
            border: `1px solid ${isDark ? blcColors.darkBorder : '#d1d9f0'}`,
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>

            {/* ── Branding / Logo ──
                Centered logo icon + app name + subtitle. */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
              {/* Logo icon box */}
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '12px',
                  bgcolor: blcColors.navyAccent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 4px 14px rgba(30,58,138,0.35)', // Glow behind logo
                }}
              >
                <HubOutlined sx={{ fontSize: 28, color: '#fff' }} />
              </Box>
              {/* App name */}
              <Typography
                component="h1"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  color: isDark ? '#e2e8f0' : blcColors.navyAccent,
                  mb: 0.5,
                }}
              >
                Test App Portal
              </Typography>
              {/* Subtitle */}
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.85rem',
                  color: isDark ? '#64748b' : blcColors.textMid,
                }}
              >
                Sign in to access your dashboard
              </Typography>
            </Box>

            {/* ── Server Error Alert ──
                Only renders if serverError has a value (wrong credentials, network error). */}
            {serverError && (
              <Alert
                severity="error"
                id="login-error-alert"
                sx={{ mb: 2.5, borderRadius: '8px', fontFamily: '"Inter", sans-serif', fontSize: '0.85rem' }}
              >
                {serverError}
              </Alert>
            )}

            {/* ── Login Form ──
                noValidate disables native HTML5 validation (we use Yup instead). */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={2.5}>

                {/* ── Username Field ──
                    Controller wires this MUI TextField into react-hook-form.
                    id="username-input" for browser testing and accessibility. */}
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: isDark ? '#94a3b8' : blcColors.textDark,
                      mb: 0.75,
                      display: 'block',
                    }}
                  >
                    Username
                  </Typography>
                  <Controller
                    name="identifier"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field} // Spread field props: value, onChange, onBlur, ref
                        id="username-input"
                        placeholder="Enter your username"
                        variant="outlined"
                        fullWidth
                        error={!!errors.identifier}           // Red border on validation error
                        helperText={errors.identifier?.message} // Error message below field
                        slotProps={{
                          htmlInput: { style: { fontFamily: '"Inter", sans-serif' } },
                          input: {
                            startAdornment: (
                              // Person icon inside the field on the left
                              <InputAdornment position="start">
                                <UserIcon sx={{ fontSize: 18, color: isDark ? '#475569' : '#9ca3af' }} />
                              </InputAdornment>
                            ),
                          },
                          formHelperText: { sx: { fontFamily: '"Inter", sans-serif' } },
                        }}
                      />
                    )}
                  />
                </Box>

                {/* ── Password Field ──
                    type switches between 'password' (hidden) and 'text' (visible)
                    based on the showPassword state toggle. */}
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: isDark ? '#94a3b8' : blcColors.textDark,
                      mb: 0.75,
                      display: 'block',
                    }}
                  >
                    Password
                  </Typography>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        id="password-input"
                        placeholder="Enter your password"
                        type={showPassword ? 'text' : 'password'} // Toggle visibility
                        variant="outlined"
                        fullWidth
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        slotProps={{
                          htmlInput: { style: { fontFamily: '"Inter", sans-serif' } },
                          input: {
                            startAdornment: (
                              // Lock icon on the left
                              <InputAdornment position="start">
                                <LockIcon sx={{ fontSize: 18, color: isDark ? '#475569' : '#9ca3af' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              // Eye icon on the right — clicking toggles password visibility
                              <InputAdornment position="end">
                                <IconButton
                                  id="toggle-password-visibility"
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                  size="small"
                                  aria-label="toggle password visibility"
                                >
                                  {showPassword
                                    ? <VisibilityOff sx={{ fontSize: 20, color: isDark ? '#64748b' : '#6b7280' }} />
                                    : <Visibility sx={{ fontSize: 20, color: isDark ? '#64748b' : '#6b7280' }} />
                                  }
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                          formHelperText: { sx: { fontFamily: '"Inter", sans-serif' } },
                        }}
                      />
                    )}
                  />
                </Box>

                {/* ── Remember Me Checkbox ──
                    When checked, auth session is saved to localStorage (persists after browser close).
                    When unchecked, saved to sessionStorage (cleared when tab closes). */}
                <Controller
                  name="rememberMe"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          id="remember-me-checkbox"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          onBlur={field.onBlur}
                          name={field.name}
                          inputRef={field.ref}
                          size="small"
                          sx={{
                            color: isDark ? '#475569' : '#9ca3af',
                            '&.Mui-checked': { color: blcColors.navyAccent },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.85rem', color: isDark ? '#94a3b8' : blcColors.textMid }}>
                          Remember me
                        </Typography>
                      }
                    />
                  )}
                />

                {/* ── Sign In Button ──
                    disabled when isSubmitting to prevent double-click.
                    Shows a spinner during the login async call. */}
                <Button
                  id="login-submit-button"
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    py: 1.4,
                    bgcolor: blcColors.navyAccent,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    letterSpacing: '0.04em',
                    borderRadius: '8px',
                    mt: 0.5,
                  }}
                >
                  {/* Show spinner during submission, text otherwise */}
                  {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                </Button>
              </Stack>
            </form>

            {/* ── Demo Credentials Panel (commented out) ──────────────────────
                This block was used during development to quickly auto-fill
                credentials for testing. Uncomment to re-enable for demos.
                Each chip calls handleFillDemo() to populate the form fields. */}
            {/*
            <Paper
              variant="outlined"
              sx={{
                mt: 3,
                p: 1.75,
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : `${blcColors.navyAccent}06`,
                borderColor: isDark ? blcColors.darkBorder : '#d1d9f0',
                borderStyle: 'dashed',
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: isDark ? '#475569' : '#9ca3af',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  mb: 1,
                }}
              >
                # Demo — click to auto-fill
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {[
                  { label: 'alex.morgan', pw: 'Password123!' },
                  { label: 'john.doe', pw: 'Password123!' },
                  { label: 'sarah.connor', pw: 'Demo123!' },
                ].map(({ label, pw }) => (
                  <Chip
                    key={label}
                    size="small"
                    label={label}
                    onClick={() => handleFillDemo(label, pw)}
                    variant="outlined"
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      borderColor: isDark ? blcColors.darkBorder : '#c7d0ea',
                      color: isDark ? '#94a3b8' : blcColors.navyAccent,
                      '&:hover': {
                        bgcolor: `${blcColors.navyAccent}12`,
                        borderColor: blcColors.navyAccent,
                      },
                    }}
                  />
                ))}
              </Stack>
            </Paper>
            */}

          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
