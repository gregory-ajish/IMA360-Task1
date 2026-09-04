// AppLogo.jsx
// PURPOSE: A reusable brand logo component with the Hub network icon and customizable text.
// Used in LoginPage (centered large card header) and Navbar (compact horizontal bar header).
//
// FEATURES:
//   - Supports horizontal and vertical layouts
//   - Size presets: 'small', 'medium', 'large'
//   - Optional subtitle with responsive visibility

import React from 'react';
import { Box, Typography } from '@mui/material';
import { HubOutlined } from '@mui/icons-material';
import { blcColors } from '../../theme';

/**
 * Common AppLogo component
 * Props:
 *  - isDark: boolean
 *  - size: 'small' | 'medium' | 'large' (default: 'medium')
 *  - subtitle: optional string (e.g. "Enterprise Suite" or "Sign in to access your dashboard")
 *  - layout: 'horizontal' | 'vertical' (default: 'horizontal')
 *  - title: string (default: 'Test App')
 */
export const AppLogo = ({
  isDark = false,
  size = 'medium',
  subtitle,
  layout = 'horizontal',
  title = 'Test App',
}) => {
  const isVertical = layout === 'vertical';

  const dimensions = {
    small: { box: 36, icon: 20, titleSize: '0.95rem' },
    medium: { box: 44, icon: 24, titleSize: '1.15rem' },
    large: { box: 52, icon: 28, titleSize: '1.4rem' },
  }[size] || { box: 44, icon: 24, titleSize: '1.15rem' };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        gap: isVertical ? 1 : 1.5,
      }}
    >
      {/* Logo Icon Box */}
      <Box
        sx={{
          width: dimensions.box,
          height: dimensions.box,
          borderRadius: size === 'small' ? '8px' : '12px',
          bgcolor: blcColors.navyAccent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isVertical ? '0 4px 14px rgba(30,58,138,0.35)' : 'none',
          flexShrink: 0,
        }}
      >
        <HubOutlined sx={{ fontSize: dimensions.icon, color: '#fff' }} />
      </Box>

      {/* Text block */}
      <Box sx={{ textAlign: isVertical ? 'center' : 'left' }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 800,
            fontSize: dimensions.titleSize,
            color: isDark ? '#e2e8f0' : blcColors.navyAccent,
            lineHeight: 1.2,
            mb: isVertical && subtitle ? 0.5 : 0,
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              fontFamily: isVertical ? '"Inter", sans-serif' : '"JetBrains Mono", monospace',
              fontSize: isVertical ? '0.85rem' : '0.62rem',
              color: isDark ? '#64748b' : (isVertical ? blcColors.textMid : '#9ca3af'),
              display: isVertical ? 'block' : { xs: 'none', sm: 'block' },
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
