// SaveViewModal.jsx
// ============================================================================
// PURPOSE:
//   A clean popup modal prompting the user to name and save the current
//   table view to Redux. Built on top of the shared `Popup` common component.
// ============================================================================

import React, { useState } from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

import { blcColors, typographyTokens } from '../../theme';
import { AppButton } from '../common/AppButton';
import { Popup } from '../common/Popup';

export const SaveViewModal = ({
  open,
  onClose,
  onSave,
  existingViews = [],
  isDark = false,
}) => {
  const [viewName, setViewName] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setViewName('');
    setError('');
    onClose();
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setViewName(val);
    if (!val.trim()) {
      setError('');
    } else if (
      existingViews.some(
        (v) => v.name.toLowerCase() === val.trim().toLowerCase()
      )
    ) {
      setError('A view with this name already exists (will be overwritten)');
    } else {
      setError('');
    }
  };

  const handleSave = () => {
    const trimmed = viewName.trim();
    if (!trimmed) {
      setError('Please enter a view name');
      return;
    }
    setViewName('');
    setError('');
    onSave(trimmed);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && viewName.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Popup
      open={open}
      onClose={handleClose}
      title="Save Current View"
      maxWidth="xs"
      isDark={isDark}
      TransitionProps={{
        onEnter: () => {
          setViewName('');
          setError('');
        },
      }}
      actions={
        <>
          <AppButton variant="ghost" size="small" onClick={handleClose}>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!viewName.trim()}
          >
            Save
          </AppButton>
        </>
      }
    >
      <Typography
        variant="body1"
        sx={{
          color: isDark ? '#cbd5e1' : '#334155',
          fontSize: '0.92rem',
          mb: 2,
          fontWeight: 500,
        }}
      >
        Do you want to save the current table view?
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={viewName}
          onChange={handleNameChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter view name..."
          error={Boolean(error && !error.includes('overwritten'))}
          helperText={error}
          slotProps={{
            formHelperText: {
              sx: {
                color: error.includes('overwritten') ? '#f59e0b' : undefined,
                mx: 0,
                mt: 0.5,
              },
            },
            input: {
              sx: {
                borderRadius: '8px',
                bgcolor: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#e2e8f0' : blcColors.textDark,
                fontFamily: typographyTokens.fontSans,
                fontSize: '0.9rem',
              },
            },
          }}
        />
      </Box>
    </Popup>
  );
};
