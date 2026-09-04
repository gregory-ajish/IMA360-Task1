// SearchBar.jsx
// PURPOSE: Full-width search bar with real-time filtering and clear functionality.
// Displays the number of matching applications when a search query is entered.
//
// FEATURES:
//   - Search magnifying glass start adornment
//   - Dynamic Clear (X) button that only appears when input is non-empty
//   - Search result count indicator with highlighted numbers

import React from 'react';
import { Box, TextField, InputAdornment, IconButton, Typography } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { blcColors } from '../../theme';

/**
 * Common SearchBar component
 * Props:
 *  - searchQuery: string
 *  - onSearchChange: function(value)
 *  - onClear: function()
 *  - totalAppsCount: number
 *  - isDark: boolean
 */
export const SearchBar = ({
  searchQuery,
  onSearchChange,
  onClear,
  totalAppsCount,
  isDark,
}) => {
  return (
    // Outer container wrapper providing bottom margin
    <Box sx={{ mb: 4 }}>
      {/* Search Input TextField */}
      <TextField
        id="app-search-input"
        fullWidth
        placeholder="Search applications by name or description..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)} // Propagates change to parent state
        InputProps={{
          // Magnifying glass icon on the left of the input
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: isDark ? '#475569' : '#9ca3af', fontSize: 20 }} />
            </InputAdornment>
          ),
          // Clear (X) button on the right — conditionally rendered only when there is typed text
          endAdornment: searchQuery ? (
            <InputAdornment position="end">
              <IconButton
                id="clear-search-btn"
                size="small"
                onClick={onClear}
                aria-label="clear search"
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
          Only displayed when an active search query exists */}
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
          {/* Highlighted count numeral in brand accent color */}
          <Box
            component="span"
            sx={{ color: isDark ? blcColors.cyanCode : blcColors.navyAccent, fontWeight: 700 }}
          >
            {totalAppsCount}
          </Box>{' '}
          {/* Handles singular vs plural noun formatting */}
          {totalAppsCount === 1 ? 'application' : 'applications'} matching "{searchQuery}"
        </Typography>
      )}
    </Box>
  );
};
