// AppIcon.jsx
// PURPOSE: A single reusable icon component used by app cards on the Dashboard.
// Instead of importing every MUI icon directly in DashboardPage.jsx,
// each app entry in apps.json stores just a string name (e.g. "Description").
// This component maps that string name to the actual MUI icon component and renders it.
//
// HOW IT WORKS:
//   1. apps.json has: { "icon": "Description" }
//   2. DashboardPage renders: <AppIcon name="Description" sx={{ fontSize: 22 }} />
//   3. AppIcon looks up "Description" in iconMap → finds the Description MUI icon
//   4. Renders <Description sx={...} />
//
// ADDING NEW ICONS:
//   - Import the icon from '@mui/icons-material'
//   - Add it to the iconMap object
//   - Use the exact import name as the "icon" string in apps.json

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
  Apps,              // Generic grid icon — used as the fallback if name is unrecognized
} from '@mui/icons-material';

// Map of icon name strings (from apps.json) → actual MUI icon components
// Key must exactly match the "icon" field value in apps.json
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

// AppIcon component
// Props:
//   name  {string} — the icon key from apps.json (e.g. "Description")
//   sx    {object} — MUI sx styling to pass through (e.g. fontSize, color)
export const AppIcon = ({ name, sx = {} }) => {
  // Look up the component by name. Fall back to the generic 'Apps' grid icon
  // if the name doesn't exist in the map (prevents crashes from typos in JSON).
  const Component = iconMap[name] || Apps;
  return <Component sx={sx} />;
};
