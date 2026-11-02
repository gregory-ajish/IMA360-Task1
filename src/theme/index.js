// src/theme/index.js
// PURPOSE: Defines the global MUI (Material UI) theme for the entire app.
// Exports:
//   - getTheme(mode): builds an MUI theme object for 'light' or 'dark' mode
//   - blcColors: the raw color palette
//   - typographyTokens: typography design tokens
//   - individual design tokens from ./tokens

import { createTheme } from '@mui/material/styles';
import { blcColors, typographyTokens } from './tokens';
import { getPalette } from './palette';
import { getTypography } from './typography';
import { getComponentOverrides } from './overrides';

// ─── Theme Builder ────────────────────────────────────────────────────────────
// Returns a complete MUI theme object.
// Called in App.jsx with the current mode string: getTheme('light') or getTheme('dark')
export const getTheme = (mode) =>
  createTheme({
    palette: getPalette(mode),
    typography: getTypography(),
    shape: { borderRadius: 8 },
    components: getComponentOverrides(mode),
  });

export { blcColors, typographyTokens };
export * from './tokens';
export default getTheme;
