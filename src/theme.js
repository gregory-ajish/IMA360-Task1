// theme.js
// PURPOSE: Defines the global MUI (Material UI) theme for the entire app.
// Exports two things:
//   - getTheme(mode): builds an MUI theme object for 'light' or 'dark' mode
//   - blcColors: the raw color palette, imported by pages that need brand colors directly
//
// Inspired by the BLC Compiler assessment portal design:
//   Reference: assessments.blcompiler.com
//   - Left panel: deep navy (#0d1b4b / #1a2255)
//   - Right panel: warm cream (#f5f4f0)
//   - Accent/CTA: rich navy-blue (#1e3a8a)
//   - Font: JetBrains Mono (monospace), Inter (body)

import { createTheme } from '@mui/material/styles';

// ─── Brand Color Palette ──────────────────────────────────────────────────────
// Central source of truth for all colors.
// Using named tokens (not raw hex strings) everywhere makes it easy to
// update one color and have it apply across the entire app.
const blcColors = {
  // ── Brand blues — used for accents, buttons, and interactive elements ──
  navyDark: '#0d1b4b',      // Darkest navy (sidebar backgrounds)
  navyMid: '#1a2255',       // Mid navy (panel surfaces)
  navyAccent: '#1e3a8a',    // Primary action color (buttons, links, icons)
  navyButton: '#1d3480',    // Slightly darker hover state for navy buttons
  blueLabelLight: '#4f79e0', // Lighter blue for labels in dark contexts

  // ── Light mode surfaces ──
  cream: '#f5f4f0',    // Page background in light mode
  creamDark: '#ebebdf', // Slightly darker cream for section separators

  // ── Text colors ──
  textDark: '#0f172a',  // Primary text (very dark, almost black)
  textMid: '#4a5568',   // Secondary text (gray)
  textLight: '#9ca3af', // Placeholder / disabled text
  blueLabel: '#2e4db3', // Blue-tinted labels
  white: '#ffffff',

  // ── Accent / status colors ──
  yellowAccent: '#e0a04f',  // Used for highlight labels (e.g., "Workspace Overview")
  greenSuccess: '#2fd97c',  // Success states
  cyanCode: '#6ee7f7',      // Cyan for code-style highlighted values in dark mode

  // ── Dark mode surfaces — layered charcoal for visual depth ──
  darkBg: '#111114',        // Page background — darkest layer
  darkSurface: '#18181c',   // AppBar, side panels — 1 level lighter
  darkCard: '#222227',      // Cards — 2 levels lighter, clearly distinct
  darkCardHover: '#2a2a30', // Card background on hover
  darkBorder: '#2e2e35',    // Subtle borders — visible but not distracting
  darkBorderHover: '#4a4a58', // Border color on focus/hover states
  darkInput: '#1c1c21',     // Input field background in dark mode
};

// ─── Theme Builder ────────────────────────────────────────────────────────────
// Returns a complete MUI theme object.
// Called in App.jsx with the current mode string: getTheme('light') or getTheme('dark')
const getTheme = (mode) =>
  createTheme({

    // ── Palette ─────────────────────────────────────────────────────────────
    // MUI uses this to color components automatically.
    // 'mode' switches between light and dark token sets.
    palette: {
      mode, // 'light' or 'dark' — MUI uses this to auto-adjust many component colors

      primary: {
        main: blcColors.navyAccent,       // Default button/link/checkbox color
        dark: blcColors.navyButton,       // Hover state for primary color
        contrastText: blcColors.white,    // Text on top of primary color (must be readable)
      },
      secondary: {
        main: blcColors.yellowAccent,     // Used for secondary accents (e.g., badges)
      },
      background: {
        // Page background (body)
        default: mode === 'light' ? blcColors.cream : blcColors.darkBg,
        // Card / paper surface (slightly lighter than background)
        paper: mode === 'light' ? blcColors.white : blcColors.darkSurface,
      },
      text: {
        primary: mode === 'light' ? blcColors.textDark : '#f4f4f5',   // Main readable text
        secondary: mode === 'light' ? blcColors.textMid : '#a1a1aa',  // Subdued/helper text
      },
      // Divider lines between sections
      divider: mode === 'light' ? '#dde1ec' : blcColors.darkBorder,
    },

    // ── Typography ───────────────────────────────────────────────────────────
    // Sets the default font stack and heading weights for the entire app.
    // JetBrains Mono gives the app a premium "developer tool" aesthetic.
    // Inter is used for body text — more readable at small sizes than monospace.
    typography: {
      fontFamily: [
        '"JetBrains Mono"',
        '"Fira Code"',
        '"Courier New"',
        'monospace',
      ].join(','),

      // Heavy weight for headings — bold and impactful
      h1: { fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },

      // Override body text to use Inter — better for long-form readability
      body1: {
        fontFamily: '"Inter", "Segoe UI", sans-serif',
      },
      body2: {
        fontFamily: '"Inter", "Segoe UI", sans-serif',
      },

      // Caption text uses monospace with extra letter spacing — label-style
      caption: {
        fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: '0.08em',
      },

      // Buttons use monospace for a technical/professional feel
      button: {
        textTransform: 'none', // Disable MUI's default ALL-CAPS button text
        fontWeight: 700,
        fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: '0.04em',
      },
    },

    // ── Shape ───────────────────────────────────────────────────────────────
    // Global border radius used by cards, inputs, buttons, etc.
    shape: { borderRadius: 8 },

    // ── Component Overrides ──────────────────────────────────────────────────
    // Customize the default appearance of specific MUI components globally.
    // This avoids having to repeat the same sx props in every component usage.
    components: {

      // MuiButton: lift effect + shadow on hover, no default box shadow
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',        // Remove MUI's default raised shadow
            padding: '10px 20px',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(29, 52, 128, 0.35)', // Navy glow on hover
              transform: 'translateY(-1px)',                    // Subtle lift
              backgroundColor: blcColors.navyButton,
            },
          },
          containedPrimary: {
            backgroundColor: blcColors.navyAccent, // Default filled button color
          },
        },
      },

      // MuiTextField: custom borders, focus highlight, and consistent fonts
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              fontFamily: '"Inter", sans-serif',
              // Different background in light vs dark to create contrast
              backgroundColor: mode === 'light' ? '#ffffff' : '#1c1c1f',
              '& fieldset': {
                // Default border color — subtle
                borderColor: mode === 'light' ? '#d1d9f0' : '#3f3f46',
              },
              '&:hover fieldset': {
                borderColor: blcColors.navyAccent, // Highlight on hover
              },
              '&.Mui-focused fieldset': {
                borderColor: blcColors.navyAccent, // Stronger highlight when focused
                borderWidth: '2px',
              },
            },
            '& .MuiInputLabel-root': {
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: mode === 'light' ? blcColors.textDark : '#a1a1aa',
            },
          },
        },
      },

      // MuiCard: rounded corners, subtle border, lift + shadow on hover
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${mode === 'light' ? '#e2e6f3' : '#3f3f46'}`,
            boxShadow: mode === 'light'
              ? '0 2px 8px rgba(0,0,0,0.06)'
              : '0 2px 12px rgba(0,0,0,0.4)',
            backgroundColor: mode === 'light' ? '#ffffff' : '#27272a',
            // Smooth transition for all hover changes
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: blcColors.navyAccent,
              boxShadow: mode === 'light'
                ? '0 8px 24px rgba(30, 58, 138, 0.12)'
                : '0 8px 24px rgba(30, 58, 138, 0.25)',
              transform: 'translateY(-3px)', // Card lifts on hover
            },
          },
        },
      },

      // MuiAppBar: remove the default MUI drop shadow
      // (we use a border-bottom instead for a cleaner look)
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
          },
        },
      },

      // MuiChip: monospace font for category/role badges
      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem',
            fontWeight: 600,
          },
        },
      },
    },
  });

// Export both so other files can use colors directly
// Usage: import { getTheme, blcColors } from '../theme';
export { getTheme, blcColors };
