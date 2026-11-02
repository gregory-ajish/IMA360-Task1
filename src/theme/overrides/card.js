// overrides/card.js
import { blcColors } from '../tokens/colors';

export const getCardOverrides = (mode) => ({
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
});
