// LoginPage.jsx
// PURPOSE: The login form page. Shown to unauthenticated users at the /login route.
// It is wrapped by <PublicRoute> in App.jsx, so logged-in users are automatically
// redirected away from this page.
//
// FEATURES:
//   - Form validation using react-hook-form + Yup schema
//   - Username + password fields; all errors shown as react-toastify toasts
//   - Show/hide password toggle
//   - "Remember Me" checkbox (persists session in localStorage vs sessionStorage)
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
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Stack,
  Chip,
  Paper,
  Container,
  Tooltip,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  EmailOutlined as MailIcon,               // Email icon for password reset
  Close as CloseIcon,                      // Close icon for dialog
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext'; // login() function from auth context
import { blcColors } from '../theme';             // Brand color palette
import { ThemeToggle } from '../components/common/ThemeToggle';
import { AppLogo } from '../components/common/AppLogo';
import { AppButton } from '../components/common/AppButton';

// react-toastify: toast.error() fires a styled error notification.
// The <ToastContainer> that renders them is mounted globally in main.jsx.
import { toast } from 'react-toastify';

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

  // isSubmitting: true while the login async call is in-flight
  // Disables the submit button and shows a spinner to prevent double-submits
  const [isSubmitting, setIsSubmitting] = useState(false);

  // forgotPasswordOpen: controls visibility of the Forgot Password modal popup
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  // resetEmail: stores email entered in the Forgot Password modal
  const [resetEmail, setResetEmail] = useState('');
  // isResetting: loading state when sending password reset link
  const [isResetting, setIsResetting] = useState(false);

  const handleOpenForgot = () => {
    setResetEmail('');
    setForgotPasswordOpen(true);
  };

  const handleCloseForgot = () => {
    setForgotPasswordOpen(false);
    setResetEmail('');
  };

  const handleSendReset = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail) {
      toast.error('Please enter your corporate email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsResetting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsResetting(false);
    toast.success(`Password reset instructions sent to ${cleanEmail}`);
    handleCloseForgot();
  };

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

  // onValidationError: called by handleSubmit when Yup validation fails.
  // Picks the first error in field order (identifier → password) and fires a toast.
  const onValidationError = (fieldErrors) => {
    const first =
      fieldErrors.identifier?.message ||
      fieldErrors.password?.message ||
      'Please check your inputs.';
    toast.error(first);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);  // Disable button + show spinner
    try {
      // Call login from AuthContext — validates credentials against users.json
      const result = await login(data.identifier, data.password, data.rememberMe);
      if (result.success) {
        // Redirect to the originally intended page (or /home)
        navigate(from, { replace: true }); // replace: true so back button doesn't return to /login
      } else {
        // Show the error message returned by the login function as a toast
        toast.error(result.error || 'Authentication failed.');
      }
    } catch {
      // Catch unexpected errors (e.g. JSON parse failure)
      toast.error('An unexpected error occurred. Please try again.');
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
      {/* ── Dark/Light Mode Toggle ── */}
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeToggle mode={mode} toggleMode={toggleMode} />
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

            {/* ── Branding / Logo (Common Component) ── */}
            <Box sx={{ mb: 3.5 }}>
              <AppLogo
                isDark={isDark}
                size="large"
                layout="vertical"
                title="Test App Portal"
                subtitle="Sign in to access the portal"
              />
            </Box>

            {/* Server errors are now shown as a Snackbar toast (see below the return). */}

            {/* ── Login Form ──
                noValidate disables native HTML5 validation (we use Yup instead). */}
            {/* onValidationError is the second arg: fires toasts for field errors */}
            <form onSubmit={handleSubmit(onSubmit, onValidationError)} noValidate>
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
                        error={!!errors.identifier}
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
                        }}
                      />
                    )}
                  />
                </Box>

                {/* ── Remember Me & Forgot Password Row ── */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  {/* Remember Me Checkbox */}
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

                  {/* Forgot Password Link Button (opens email modal popup) */}
                  <Link
                    component="button"
                    type="button"
                    id="forgot-password-link"
                    onClick={handleOpenForgot}
                    underline="hover"
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: isDark ? blcColors.cyanCode : blcColors.navyAccent,
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      p: 0,
                      transition: 'opacity 0.2s ease',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                {/* ── Sign In Button (Common AppButton component) ──
                    Handles loading spinner and disabled state automatically */}
                <AppButton
                  id="login-submit-button"
                  type="submit"
                  fullWidth
                  variant="primary"
                  size="large"
                  loading={isSubmitting}
                  sx={{ mt: 0.5 }}
                >
                  Sign In
                </AppButton>
              </Stack>
            </form>


          </CardContent>
        </Card>
      </Container>

      {/* ── Forgot Password Dialog Modal ── */}
      <Dialog
        open={forgotPasswordOpen}
        onClose={handleCloseForgot}
        maxWidth="xs"
        fullWidth
        aria-labelledby="forgot-password-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            color: isDark ? '#e2e8f0' : blcColors.textDark,
            border: `1px solid ${isDark ? blcColors.darkBorder : '#d1d9f0'}`,
            boxShadow: isDark
              ? '0 12px 48px rgba(0,0,0,0.7)'
              : '0 8px 32px rgba(30,58,138,0.15)',
            p: 1,
          },
        }}
      >
        <DialogTitle
          id="forgot-password-dialog-title"
          sx={{
            m: 0,
            p: 2,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              fontSize: '1rem',
              color: isDark ? '#e2e8f0' : blcColors.navyAccent,
            }}
          >
            Reset Password
          </Typography>
          <IconButton
            size="small"
            onClick={handleCloseForgot}
            sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
            aria-label="close reset dialog"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSendReset}>
          <DialogContent sx={{ px: 2, py: 1.5 }}>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.82rem',
                color: isDark ? '#94a3b8' : blcColors.textMid,
                mb: 2,
                lineHeight: 1.5,
              }}
            >
              Enter the corporate email associated with your account. We'll send you instructions to reset your password.
            </Typography>

            <TextField
              id="reset-email-input"
              autoFocus
              fullWidth
              size="small"
              type="email"
              placeholder="e.g. alex.morgan@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailIcon sx={{ fontSize: 18, color: isDark ? '#64748b' : '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.875rem',
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                },
              }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
            <AppButton
              variant="ghost"
              size="small"
              onClick={handleCloseForgot}
              disabled={isResetting}
            >
              Cancel
            </AppButton>
            {/* Secondary variant AppButton as requested */}
            <AppButton
              id="reset-password-submit-btn"
              type="submit"
              variant="secondary"
              size="small"
              loading={isResetting}
            >
              Send Reset Link
            </AppButton>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
