// tokens/index.js
// ─── Design Tokens Index ──────────────────────────────────────────────────────

import { blcColors } from './colors';
import { fontFamilies } from './fontFamilies';
import { fontWeights } from './fontWeights';
import { fontSizes } from './fontSizes';
import { lineHeights } from './lineHeights';
import { letterSpacings } from './letterSpacings';

// Aggregated typography tokens maintaining backwards compatibility
export const typographyTokens = {
  ...fontFamilies,
  ...fontWeights,
  ...fontSizes,
  ...lineHeights,
  ...letterSpacings,
};

export {
  blcColors,
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacings,
};
