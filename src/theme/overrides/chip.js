// overrides/chip.js
import { typographyTokens } from '../tokens';

export const getChipOverrides = () => ({
  MuiChip: {
    styleOverrides: {
      root: {
        fontFamily: typographyTokens.fontMono,
        fontSize: typographyTokens.fontSizeXs,
        fontWeight: typographyTokens.weightSemiBold,
      },
    },
  },
});
