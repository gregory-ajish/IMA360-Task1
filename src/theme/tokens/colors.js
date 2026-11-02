// colors.js
// ─── Brand Color Palette ──────────────────────────────────────────────────────
// Central source of truth for all colors.
// Using named tokens (not raw hex strings) everywhere makes it easy to
// update one color and have it apply across the entire app.

export const blcColors = {
  // ── Brand blues — used for accents, buttons, and interactive elements ──
  navyDark: '#0d1b4b',       // Darkest navy (sidebar backgrounds)
  navyMid: '#1a2255',        // Mid navy (panel surfaces)
  navyAccent: '#1e3a8a',     // Primary action color (buttons, links, icons)
  navyButton: '#1d3480',     // Slightly darker hover state for navy buttons
  blueLabelLight: '#4f79e0', // Lighter blue for labels in dark contexts

  // ── Light mode surfaces ──
  cream: '#f5f4f0',          // Page background in light mode
  creamDark: '#ebebdf',      // Slightly darker cream for section separators

  // ── Text colors ──
  textDark: '#0f172a',       // Primary text (very dark, almost black)
  textMid: '#4a5568',        // Secondary text (gray)
  textLight: '#9ca3af',      // Placeholder / disabled text
  blueLabel: '#2e4db3',      // Blue-tinted labels
  white: '#ffffff',

  // ── Accent / status colors ──
  yellowAccent: '#e0a04f',   // Used for highlight labels (e.g., "Workspace Overview")
  greenSuccess: '#2fd97c',   // Success states
  cyanCode: '#6ee7f7',       // Cyan for code-style highlighted values in dark mode

  // ── Dark mode surfaces — layered charcoal for visual depth ──
  darkBg: '#111114',         // Page background — darkest layer
  darkSurface: '#18181c',    // AppBar, side panels — 1 level lighter
  darkCard: '#222227',       // Cards — 2 levels lighter, clearly distinct
  darkCardHover: '#2a2a30',  // Card background on hover
  darkBorder: '#2e2e35',     // Subtle borders — visible but not distracting
  darkBorderHover: '#4a4a58', // Border color on focus/hover states
  darkInput: '#1c1c21',      // Input field background in dark mode
};
