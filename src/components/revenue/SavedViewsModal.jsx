// SavedViewsModal.jsx
// ============================================================================
// PURPOSE:
//   A theme-aware popup modal showing the list of saved table views from Redux.
//   Built on top of the shared `Popup` common component.
// ============================================================================

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  List,
  ListItem,
} from '@mui/material';
import {
  BookmarkBorder as SavedViewsIcon,
  TableChartOutlined as TableIcon,
} from '@mui/icons-material';

import { blcColors, typographyTokens } from '../../theme';
import { AppButton } from '../common/AppButton';
import { Popup } from '../common/Popup';

export const SavedViewsModal = ({
  open,
  onClose,
  savedViews = [],
  activeViewId = null,
  onApplyView,
  isDark = false,
}) => {
  return (
    <Popup
      open={open}
      onClose={onClose}
      title="Saved Views"
      subtitle={`${savedViews.length} ${savedViews.length === 1 ? 'view' : 'views'} available`}
      icon={<SavedViewsIcon fontSize="small" />}
      maxWidth="xs"
      isDark={isDark}
      actions={
        <AppButton variant="ghost" size="small" onClick={onClose}>
          Close
        </AppButton>
      }
    >
      {savedViews.length === 0 ? (
        <Box
          sx={{
            py: 4,
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderRadius: '10px',
            border: `1px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
            bgcolor: isDark ? '#0f172a' : '#f8fafc',
          }}
        >
          <SavedViewsIcon
            sx={{
              fontSize: 38,
              color: isDark ? '#475569' : '#94a3b8',
              mb: 1,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: isDark ? '#cbd5e1' : '#475569',
              mb: 0.5,
            }}
          >
            No saved views yet
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isDark ? '#64748b' : '#94a3b8',
              fontSize: '0.8rem',
            }}
          >
            Click the Views icon to save your current table layout.
          </Typography>
        </Box>
      ) : (
        <>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1.5,
              color: isDark ? '#94a3b8' : '#64748b',
              fontSize: '0.8rem',
            }}
          >
            Click a view to apply its column layout to the table:
          </Typography>
          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {savedViews.map((view, index) => {
              const isActive = activeViewId === view.id;
              return (
                <Paper
                  key={view.id || index}
                  component={ListItem}
                  elevation={0}
                  disableGutters
                  onClick={() => {
                    onApplyView?.(view);
                    onClose();
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    px: 2,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    bgcolor: isActive
                      ? isDark
                        ? 'rgba(30,58,138,0.25)'
                        : 'rgba(30,58,138,0.08)'
                      : isDark
                      ? '#0f172a'
                      : '#f8fafc',
                    border: `1.5px solid ${
                      isActive
                        ? blcColors.navyAccent
                        : isDark
                        ? blcColors.darkBorder
                        : '#e2e8f0'
                    }`,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: blcColors.navyAccent,
                      bgcolor: isDark
                        ? 'rgba(30,58,138,0.18)'
                        : 'rgba(30,58,138,0.06)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TableIcon
                      fontSize="small"
                      sx={{
                        color: isActive ? blcColors.navyAccent : isDark ? '#94a3b8' : '#64748b',
                        fontSize: '1.2rem',
                      }}
                    />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: isDark ? '#f1f5f9' : blcColors.textDark,
                          }}
                        >
                          {view.name}
                        </Typography>
                        {isActive && (
                          <Chip
                            label="Active"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: blcColors.navyAccent,
                              color: '#ffffff',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Chip
                    label={`${view.visibleColumns?.length ?? 0} cols`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.72rem',
                      fontFamily: typographyTokens.fontMono,
                      fontWeight: 600,
                      bgcolor: isActive ? `${blcColors.navyAccent}25` : `${blcColors.navyAccent}15`,
                      color: blcColors.navyAccent,
                    }}
                  />
                </Paper>
              );
            })}
          </List>
        </>
      )}
    </Popup>
  );
};
