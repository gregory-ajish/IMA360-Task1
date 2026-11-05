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
  FileDownload,
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
export const DownloadIcon = FileDownload;
export const FileDownloadIcon = FileDownload;
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
export const AutoAwesomeIcon = AutoAwesome;
export const CopilotIcon = AutoAwesome;
export const DescriptionIcon = Description;
export const ContractIcon = Description;
export const ContractLedgerIcon = Description;

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

// OAuth & Third-party Providers
export const GoogleIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 48 48" {...props}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

// ─── Dynamic Icon Map for <AppIcon name="..." /> ─────────────────────────────
export const iconMap = {
  // Navigation & Direction
  google: GoogleIcon,
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
  download: FileDownload,
  fileDownload: FileDownload,
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
