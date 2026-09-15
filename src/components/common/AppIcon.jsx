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
  AutoStories,       // Book / documentation icon → "Team Wiki"
  AutoAwesome,       // Sparkles / AI icon → "AI Copilot"
  Storage,           // Database server icon → "Database Manager"
  BugReport,         // Bug icon → "Bug & Issue Tracker"
  ReceiptLong,       // Ledger / pay slip icon → "Payroll & Compensation"
  Badge,             // ID badge icon → "Recruitment & ATS"
  Brush,             // Paintbrush / drawing icon → "Virtual Whiteboard"
  TrendingUp,        // Upward chart icon → "Market Intelligence"
  QueryStats,        // Query / stats icon → "Data Studio"
  School,            // Graduation cap icon → "Learning & Development"
  Devices,           // Laptops / devices icon → "IT Asset Desk"
  Videocam,          // Video camera icon → "Video Huddles"
  DynamicForm,       // Form icon → "Form Builder"
  CloudUpload,       // Cloud upload icon → "Cloud Drive"
  StickyNote2,       // Sticky note icon → "Note Keeper"
  AccountTree,       // Tree diagram icon → "Mind Mapper"
  Timeline,          // Line chart icon → "Predictive Modeling"
  Public,            // Globe icon → "Web Analytics"
  FilterAlt,         // Funnel icon → "Funnel Analysis"
  Science,           // Flask icon → "A/B Testing Lab"
  Troubleshoot,      // Diagnostic icon → "Log Analytics"
  VpnKey,            // Key icon → "Secret Vault"
  Layers,            // Stacked layers icon → "Container Registry"
  Bolt,              // Lightning bolt icon → "Serverless Functions"
  Router,            // Network router icon → "Network Monitor"
  AltRoute,          // Forking route icon → "Load Balancer"
  CreditCard,        // Card icon → "Expense Claims"
  MeetingRoom,       // Door icon → "Workplace Booking"
  ThumbUpAlt,        // Thumbs up icon → "Performance Reviews"
  VerifiedUser,      // Check shield icon → "Compliance & Audit"
  Favorite,          // Heart icon → "Health & Benefits"
  WbSunny,           // Sun/Weather icon → "Weather"
  Apps,              // Generic grid icon — fallback
} from '@mui/icons-material';

// Map of icon name strings → actual MUI icon components
const iconMap = {
  WbSunny,
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
  AutoStories,
  AutoAwesome,
  Storage,
  BugReport,
  ReceiptLong,
  Badge,
  Brush,
  TrendingUp,
  QueryStats,
  School,
  Devices,
  Videocam,
  DynamicForm,
  CloudUpload,
  StickyNote2,
  AccountTree,
  Timeline,
  Public,
  FilterAlt,
  Science,
  Troubleshoot,
  VpnKey,
  Layers,
  Bolt,
  Router,
  AltRoute,
  CreditCard,
  MeetingRoom,
  ThumbUpAlt,
  VerifiedUser,
  Favorite,
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
