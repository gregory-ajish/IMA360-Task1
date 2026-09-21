// SaveViewModal.jsx
// ============================================================================
// PURPOSE:
//   A clean, minimal popup modal asking the user if they want to save the current
//   table view, with an input field to enter the view name and save to Redux.
// ============================================================================

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  TextField,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

import { blcColors, typographyTokens } from '../../theme';
import { AppButton } from '../common/AppButton';

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
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionProps={{
        onEnter: () => {
          setViewName('');
          setError('');
        },
      }}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            bgcolor: isDark ? blcColors.darkCard : '#ffffff',
            color: isDark ? '#e2e8f0' : blcColors.textDark,
            border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
            boxShadow: isDark
              ? '0 24px 64px rgba(0,0,0,0.7)'
              : '0 20px 50px rgba(15,23,42,0.12)',
            p: 1,
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 2,
          pb: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: typographyTokens.fontMono,
            fontWeight: typographyTokens.weightBold,
            fontSize: '1.1rem',
          }}
        >
          Save Current View
        </Typography>

        <IconButton
          onClick={handleClose}
          size="small"
          aria-label="Close dialog"
          sx={{
            color: isDark ? '#94a3b8' : '#64748b',
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
              color: isDark ? '#ffffff' : '#0f172a',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Body: Question + Input */}
      <DialogContent sx={{ px: 2.5, py: 1.5 }}>
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
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          px: 2.5,
          py: 1.5,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 1.25,
        }}
      >
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
      </DialogActions>
    </Dialog>
  );
};
