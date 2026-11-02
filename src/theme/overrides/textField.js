// overrides/textField.js
import { blcColors } from '../tokens/colors';

export const getTextFieldOverrides = (mode) => ({
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
});
