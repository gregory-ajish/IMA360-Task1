// typography.js
// ─── Theme Typography ─────────────────────────────────────────────────────────

import { typographyTokens } from './tokens';

export const getTypography = () => ({
  fontFamily: typographyTokens.fontMono,

  // Headings
  h1: {
    fontSize: typographyTokens.fontSize3xl,
    fontWeight: typographyTokens.weightExtraBold,
    letterSpacing: typographyTokens.letterSpacingTight,
    lineHeight: typographyTokens.lineHeightTight,
  },
  h2: {
    fontSize: typographyTokens.fontSize2xl,
    fontWeight: typographyTokens.weightExtraBold,
    letterSpacing: typographyTokens.letterSpacingTight,
    lineHeight: typographyTokens.lineHeightTight,
  },
  h3: {
    fontSize: typographyTokens.fontSizeXl,
    fontWeight: typographyTokens.weightBold,
    lineHeight: typographyTokens.lineHeightNormal,
  },
  h4: {
    fontSize: typographyTokens.fontSizeLg,
    fontWeight: typographyTokens.weightBold,
    lineHeight: typographyTokens.lineHeightNormal,
  },
  h5: {
    fontSize: typographyTokens.fontSizeMd,
    fontWeight: typographyTokens.weightBold,
    lineHeight: typographyTokens.lineHeightNormal,
  },
  h6: {
    fontSize: typographyTokens.fontSizeBase,
    fontWeight: typographyTokens.weightSemiBold,
    lineHeight: typographyTokens.lineHeightNormal,
  },

  // Body text uses Inter for optimal reading comfort
  body1: {
    fontFamily: typographyTokens.fontSans,
    fontSize: typographyTokens.fontSizeBase,
    fontWeight: typographyTokens.weightRegular,
    lineHeight: typographyTokens.lineHeightNormal,
  },
  body2: {
    fontFamily: typographyTokens.fontSans,
    fontSize: typographyTokens.fontSizeSm,
    fontWeight: typographyTokens.weightRegular,
    lineHeight: typographyTokens.lineHeightNormal,
  },

  // Caption text uses monospace with extra letter spacing
  caption: {
    fontFamily: typographyTokens.fontMono,
    fontSize: typographyTokens.fontSizeXs,
    letterSpacing: typographyTokens.letterSpacingWidest,
  },

  // Buttons use monospace with technical feel
  button: {
    textTransform: 'none',
    fontWeight: typographyTokens.weightBold,
    fontFamily: typographyTokens.fontMono,
    fontSize: typographyTokens.fontSizeBase,
    letterSpacing: typographyTokens.letterSpacingWide,
  },
});
