// AppIcon.jsx
// ============================================================================
// PURPOSE:
//   A single reusable icon component used across common and dashboard components.
//   Translates string names (e.g., "Description", "MonetizationOn") into MUI vector icons.
// ============================================================================

import React from 'react';
import {
  Description,       // Document / file icon → "Workspace Docs"
  Forum,             // Chat bubbles icon → "Team Chat"
  ViewKanban,        // Kanban board icon → "Project Boards"
  CalendarMonth,     // Calendar icon → "Calendar Pro"
  BarChart,          // Bar chart icon → "BI Analytics"
  Insights,          // Trend/insights icon → "Customer Insights"
  MonetizationOn,    // Dollar/coin icon → "Revenue Tracker"
  CloudQueue,        // Cloud icon → "Cloud Infrastructure"
  Api,               // API brackets icon → "API Gateway"
  Shield,            // Shield icon → "Security & IAM"
  Terminal,          // Terminal/code icon → "CI/CD Pipelines"
  PeopleAlt,         // People group icon → "Employee Directory"
  Schedule,          // Clock/schedule icon → "Time & Attendance"
  Apps,              // Generic grid icon — fallback
} from '@mui/icons-material';

// Map of icon name strings → actual MUI icon components
const iconMap = {
  Description,
  Forum,
  ViewKanban,
  CalendarMonth,
  BarChart,
  Insights,
  MonetizationOn,
  CloudQueue,
  Api,
  Shield,
  Terminal,
  PeopleAlt,
  Schedule,
};

/**
 * AppIcon Component
 *
 * @param {Object} props
 * @param {string} props.name - Icon identifier matching an entry in iconMap
 * @param {Object} [props.sx] - Custom MUI styling (fontSize, color, etc.)
 */
export const AppIcon = ({ name, sx = {} }) => {
  const Component = iconMap[name] || Apps;
  return <Component sx={sx} />;
};

export default AppIcon;
