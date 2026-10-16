// src/icons/index.js
// ============================================================================
// PURPOSE:
//   Centralized Icon Registry for the entire application.
//   1. Imports and re-exports MUI icons under user-friendly, identified names.
//   2. Eliminates direct '@mui/icons-material' imports across pages & components.
//   3. Provides dynamic <AppIcon name="..." /> renderer with comprehensive map.
// ============================================================================

import React from 'react';
import {
  // Navigation & Direction
  ArrowBack,
  ArrowForward,
  KeyboardArrowDown,
  OpenInNew,
  Close,
  Clear,
  DragIndicator,

  // Table & View Management
  TableChart,
  TableChartOutlined,
  ViewColumn,
  Visibility,
  VisibilityOff,
  BookmarkBorder,
  RestartAlt,
  Save,
  // Actions & Management
  EditNote,
  AddCircleOutlineOutlined as AddCircleOutline,
  DeleteSweep,
  Delete,
  Logout,
  SettingsOutlined,
  PersonOutlined,

  // Dashboard & Navigation Features
  Insights,
  MonetizationOn,
  Summarize,
  Functions,
  PointOfSale,
  Search,
  Refresh,

  // Authentication & Security
  PersonOutlineOutlined,
  Person,
  LockOutlined,
  Lock,
  EmailOutlined,
  Email,
  AdminPanelSettings,
  Security,
  VpnKey,
  VerifiedUser,

  // Dialog & Feedback
  WarningAmber,
  Warning,
  ErrorOutlineOutlined as ErrorOutline,
  Check,

  // Theme & Appearance
  DarkMode,
  LightMode,
  HubOutlined,

  // Weather & Metrics
  WbSunny,
  Thunderstorm,
  Grain,
  AcUnit,
  Cloud,
  CloudQueue,
  Air,
  WaterDrop,
  Opacity,
  Compress,
  Thermostat,
  LocationOn,
  CalendarMonth,

  // Core Dashboard Category Icons
  Description,
  Forum,
  ViewKanban,
  BarChart,
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
  Layers,
  Bolt,
  Router,
  AltRoute,
  CreditCard,
  MeetingRoom,
  ThumbUpAlt,
  Favorite,
  Apps,
} from '@mui/icons-material';

// ─── Identified Named Icon Exports ──────────────────────────────────────────

// Navigation & Actions
export const BackIcon = ArrowBack;
export const ArrowBackIcon = ArrowBack;
export const ForwardIcon = ArrowForward;
export const ArrowForwardIcon = ArrowForward;
export const ArrowDownIcon = KeyboardArrowDown;
export const KeyboardArrowDownIcon = KeyboardArrowDown;
export const ExternalLinkIcon = OpenInNew;
export const OpenInNewIcon = OpenInNew;
export const CloseIcon = Close;
export const ClearIcon = Clear;
export const DragIndicatorIcon = DragIndicator;
export const DragHandleIcon = DragIndicator;

// Table & Views Management
export const TableChartIcon = TableChart;
export const TableIcon = TableChartOutlined;
export const TableChartOutlinedIcon = TableChartOutlined;
export const ViewColumnIcon = ViewColumn;
export const ColumnIcon = ViewColumn;
export const ViewsIcon = Visibility;
export const VisibilityIcon = Visibility;
export const EyeIcon = Visibility;
export const VisibilityOffIcon = VisibilityOff;
export const HiddenIcon = VisibilityOff;
export const EyeOffIcon = VisibilityOff;
export const SavedViewsIcon = BookmarkBorder;
export const BookmarkIcon = BookmarkBorder;
export const ResetIcon = RestartAlt;
export const RestartAltIcon = RestartAlt;
export const SaveIcon = Save;
export const BulkUpdateIcon = EditNote;
export const EditNoteIcon = EditNote;
export const AddRowIcon = AddCircleOutline;
export const AddIcon = AddCircleOutline;
export const DeleteRowsIcon = DeleteSweep;
export const DeleteSweepIcon = DeleteSweep;
export const DeleteIcon = Delete;
export const LogoutIcon = Logout;
export const ProfileIcon = PersonOutlined;
export const SettingsIcon = SettingsOutlined;

// Pages & Features
export const InsightsIcon = Insights;
export const RevenueIcon = MonetizationOn;
export const MonetizationOnIcon = MonetizationOn;
export const SummarizeIcon = Summarize;
export const FunctionsIcon = Functions;
export const PointOfSaleIcon = PointOfSale;
export const SearchIcon = Search;
export const RefreshIcon = Refresh;

// Auth & Security
export const UserIcon = PersonOutlineOutlined;
export const PersonOutlineIcon = PersonOutlineOutlined;
export const PersonIcon = Person;
export const LockIcon = LockOutlined;
export const LockOutlinedIcon = LockOutlined;
export const LockFilledIcon = Lock;
export const MailIcon = EmailOutlined;
export const EmailIcon = EmailOutlined;
export const EmailFilledIcon = Email;
export const AdminIcon = AdminPanelSettings;
export const AdminPanelSettingsIcon = AdminPanelSettings;
export const SecurityIcon = Security;
export const SecretVaultIcon = VpnKey;
export const ComplianceIcon = VerifiedUser;

// Feedback & Dialogs
export const WarningIcon = WarningAmber;
export const WarningAmberIcon = WarningAmber;
export const WarningFilledIcon = Warning;
export const ErrorOutlineIcon = ErrorOutline;
export const CheckIcon = Check;

// Theme & Branding
export const DarkModeIcon = DarkMode;
export const ThemeDarkIcon = DarkMode;
export const LightModeIcon = LightMode;
export const ThemeLightIcon = LightMode;
export const HubIcon = HubOutlined;
export const HubOutlinedIcon = HubOutlined;

// Weather
export const WeatherSunIcon = WbSunny;
export const SunIcon = WbSunny;
export const WbSunnyIcon = WbSunny;
export const ThunderstormIcon = Thunderstorm;
export const RainGrainIcon = Grain;
export const GrainIcon = Grain;
export const SnowIcon = AcUnit;
export const AcUnitIcon = AcUnit;
export const CloudIcon = Cloud;
export const CloudQueueIcon = CloudQueue;
export const WindIcon = Air;
export const AirIcon = Air;
export const RainIcon = WaterDrop;
export const WaterDropIcon = WaterDrop;
export const HumidityIcon = Opacity;
export const OpacityIcon = Opacity;
export const PressureIcon = Compress;
export const CompressIcon = Compress;
export const ThermostatIcon = Thermostat;
export const LocationIcon = LocationOn;
export const LocationOnIcon = LocationOn;
export const CalendarIcon = CalendarMonth;
export const CalendarMonthIcon = CalendarMonth;

// ─── Dynamic Icon Map for <AppIcon name="..." /> ─────────────────────────────
export const iconMap = {
  // Navigation & Direction
  back: ArrowBack,
  forward: ArrowForward,
  arrowDown: KeyboardArrowDown,
  externalLink: OpenInNew,
  close: Close,
  clear: Clear,
  drag: DragIndicator,

  // Table & Views
  table: TableChartOutlined,
  tableChart: TableChart,
  columns: ViewColumn,
  visibility: Visibility,
  visibilityOff: VisibilityOff,
  savedViews: BookmarkBorder,
  reset: RestartAlt,
  save: Save,
  bulkUpdate: EditNote,

  // Auth & Roles
  user: PersonOutlineOutlined,
  admin: AdminPanelSettings,
  lock: LockOutlined,
  mail: EmailOutlined,
  security: Security,
  warning: WarningAmber,

  // Dashboard Modules
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
  WbSunny,
  Apps,
};

/**
 * AppIcon Component
 *
 * @param {Object} props
 * @param {string} props.name - Icon identifier string matching an entry in iconMap
 * @param {Object} [props.sx] - Custom MUI styling (fontSize, color, etc.)
 */
export const AppIcon = ({ name, sx = {}, ...rest }) => {
  const Component = iconMap[name] || Apps;
  return <Component sx={sx} {...rest} />;
};

export default AppIcon;
