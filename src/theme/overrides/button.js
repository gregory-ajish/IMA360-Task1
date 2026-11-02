// overrides/button.js
import { blcColors } from '../tokens/colors';

export const getButtonOverrides = () => ({
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
});
