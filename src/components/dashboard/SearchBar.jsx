// SearchBar.jsx
// ============================================================================
// PURPOSE:
//   A full-width, real-time application search and filter input component.
//   Filters dashboard enterprise applications across categories dynamically as the
//   user types, and provides a one-click clear button and match counter.
//
// USAGE LOCATIONS:
//   - DashboardPage.jsx: Positioned prominently between the WelcomeBanner and
//     the categorized application grid.
//
// FEATURES & ARCHITECTURE:
//   - Live Filtering: Controlled input passing string changes up to DashboardPage's
//     useMemo filtering pipeline.
//   - Search Icon Adornment: Visual cue placed at the input start.
//   - Contextual Clear Button: Automatically appears only when the search field is
//     non-empty, allowing instantaneous search reset.
//   - Results Count Indicator: Displays live count of matching apps with plural/singular
//     grammatical agreement and highlighted metrics.
//   - Theme Sensitivity: Uses theme-dependent backgrounds, border shadows, and text colors.
// ============================================================================

import React from 'react';
import { Box, TextField, InputAdornment, IconButton, Typography } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { blcColors } from '../../theme';

/**
 * SearchBar Component
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.searchQuery - Current search query string value.
 * @param {Function} props.onSearchChange - Callback function invoked on every keystroke with new text.
 * @param {Function} props.onClear - Callback function invoked when clicking the clear (X) icon.
 * @param {number} props.totalAppsCount - Total number of apps currently matching the query.
 * @param {boolean} props.isDark - True if dark mode is active; false otherwise.
 * @returns {React.ReactElement} The rendered search input and match count component.
 */
export const SearchBar = ({
  searchQuery,
  onSearchChange,
  onClear,
  totalAppsCount,
  isDark,
}) => {
  return (
    // Outer layout wrapper providing bottom spacing from the application categories
    <Box sx={{ mb: 4 }}>
      {/* Search Input TextField */}
      <TextField
        id="app-search-input"
        fullWidth
        placeholder="Search applications by name or description..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)} // Propagates text input up to parent state
        InputProps={{
          // Magnifying glass icon on the left of the input field
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: isDark ? '#475569' : '#9ca3af', fontSize: 20 }} />
            </InputAdornment>
          ),
          // Clear (X) icon button on the right — conditionally rendered only when text exists
          endAdornment: searchQuery ? (
            <InputAdornment position="end">
              <IconButton
                id="clear-search-btn"
                size="small"
                onClick={onClear}
                aria-label="clear search input"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: { fontFamily: '"Inter", sans-serif' },
        }}
        sx={{
          bgcolor: isDark ? blcColors.darkInput : '#ffffff', // Theme-based input background
          borderRadius: '8px',
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
        }}
      />

      {/* ── Search Result Counter ──
          Conditionally displayed only when the user has entered an active search query */}
      {searchQuery && (
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem',
            color: isDark ? '#64748b' : '#9ca3af',
            mt: 1.25,
          }}
        >
          Found{' '}
          {/* Highlighted count numeral in vibrant brand accent color */}
          <Box
            component="span"
            sx={{ color: isDark ? blcColors.cyanCode : blcColors.navyAccent, fontWeight: 700 }}
          >
            {totalAppsCount}
          </Box>{' '}
          {/* Grammatical agreement: 'application' for 1, 'applications' for 0 or >1 */}
          {totalAppsCount === 1 ? 'application' : 'applications'} matching "{searchQuery}"
        </Typography>
      )}
    </Box>
  );
};

