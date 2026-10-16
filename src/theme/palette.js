// palette.js
// ─── Theme Palette ────────────────────────────────────────────────────────────

import { blcColors } from './tokens/colors';

export const getPalette = (mode) => ({
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
});
