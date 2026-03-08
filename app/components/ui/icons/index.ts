/**
 * Centralized Icon Exports - LUCIDE REACT
 * 
 * This file provides a single source of truth for all icons used in the application.
 * By importing icons from here instead of directly from icon libraries, we:
 * 1. Enable tree-shaking to only bundle icons that are actually used
 * 2. Reduce bundle size significantly
 * 3. Maintain consistency across the application
 * 4. Provide better IDE autocomplete
 * 
 * Usage:
 * import { Search, Settings, User } from '~/components/ui/icons';
 * <Search size={24} />
 * 
 * Docs: https://lucide.dev
 */

// LUCIDE REACT - Primary icon library
// Docs: https://lucide.dev

// Navigation & UI
export {
  List as Menu,           // Menu
  X,                      // Close
  Search as MagnifyingGlass, // Search (aliased for compatibility)
  Settings as Gear,       // Settings (aliased for compatibility)
  User,                   // User
  ChevronRight as CaretRight, // Chevron right (aliased)
  ChevronLeft as CaretLeft,   // Chevron left (aliased)
  ChevronDown as CaretDown,   // Chevron down (aliased)
  ChevronUp as CaretUp,       // Chevron up (aliased)
  Plus,                   // Add
  Minus,                  // Remove
  ArrowLeft,              // Back
  ArrowRight,             // Forward
  Home as House,          // Home (aliased)
  MoreHorizontal as DotsThree, // More horizontal (aliased)
  MoreVertical as DotsThreeVertical, // More vertical (aliased)
  Grid as GridFour,       // Grid view (aliased)
  List as ListBullets,    // List view (aliased)
  Maximize as ArrowsOut,  // Maximize (aliased)
  Minimize as ArrowsIn,   // Minimize (aliased)
} from 'lucide-react';

// Status & Feedback
export {
  Check,                         // Checkmark
  CheckCircle,                   // Success
  AlertCircle as WarningCircle,  // Alert (aliased)
  AlertTriangle as Warning,      // Warning triangle (aliased)
  Info,                          // Information
  Loader as CircleNotch,         // Loading spinner (aliased)
  XCircle,                       // Error
} from 'lucide-react';

// Communication
export {
  Send as PaperPlaneRight,       // Send (aliased)
  Mail as Envelope,              // Email/Mail (aliased)
  Phone,                         // Phone
  MessageCircle as ChatCircle,   // Message (aliased)
  Bell,                          // Notifications
  BellOff as BellSlash,          // Mute notifications (aliased)
  Share2 as ShareNetwork,        // Share (aliased)
} from 'lucide-react';

// Files & Content
export {
  FileText,                      // Document
  File,                          // Generic file
  Folder,                        // Folder
  FolderOpen,                    // Open folder
  Download,                      // Download
  Upload,                        // Upload
  Download as DownloadSimple,    // Simple download (aliased)
  Upload as UploadSimple,        // Simple upload (aliased)
  Copy,                          // Copy
  Trash,                         // Delete
  Edit as PencilSimple,          // Edit (aliased)
  Save as FloppyDisk,            // Save (aliased)
  ExternalLink as ArrowSquareOut, // External link (aliased)
} from 'lucide-react';

// View & Display
export {
  Eye,                           // View/Show
  EyeOff as EyeClosed,           // Hide (aliased)
  EyeOff as EyeSlash,            // Hidden (aliased)
  Moon,                          // Dark mode
  Sun,                           // Light mode
  Monitor,                       // Display
} from 'lucide-react';

// Tech & Development
export {
  Code,                          // Code
  Terminal,                      // Terminal
  Database,                      // Database
  Server as CloudCheck,          // Server (aliased)
  Cloud,                         // Cloud
  Cpu,                           // CPU
  HardDrive,                     // Storage
  Wifi as WifiHigh,              // WiFi (aliased)
  WifiOff as WifiSlash,          // No WiFi (aliased)
  Lock,                          // Locked
  Unlock as LockOpen,            // Unlocked (aliased)
  Key,                           // API Key
  Shield,                        // Security
  ShieldCheck,                   // Security verified
  GitBranch,                     // Git branch
  GitCommit,                     // Git commit
  Package,                       // Package/Module
} from 'lucide-react';

// Business & Finance
export {
  DollarSign as CurrencyDollar,  // Money (aliased)
  TrendingUp as TrendUp,         // Growth (aliased)
  TrendingDown as TrendDown,     // Decline (aliased)
  BarChart3 as ChartBar,         // Bar chart (aliased)
  PieChart as ChartPie,          // Pie chart (aliased)
  LineChart as ChartLine,        // Line chart (aliased)
  BarChart2 as ChartBarHorizontal, // Horizontal bar (aliased)
  Activity as Pulse,             // Activity (aliased)
  Coins,                         // Cryptocurrency
  Wallet,                        // Wallet
  Store as Storefront,           // Store (aliased)
  ShoppingCart,                  // Cart
  Receipt,                       // Receipt
} from 'lucide-react';

// Social & Branding
export {
  Linkedin as LinkedinLogo,      // LinkedIn (aliased)
  Github as GithubLogo,          // GitHub (aliased)
  Twitter as TwitterLogo,        // Twitter (aliased)
  Facebook as FacebookLogo,      // Facebook (aliased)
  Instagram as InstagramLogo,    // Instagram (aliased)
  Youtube as YoutubeLogo,        // YouTube (aliased)
  MessageSquare as DiscordLogo,  // Discord (aliased, using MessageSquare)
  Send as TelegramLogo,          // Telegram (aliased, using Send)
  MessageSquare as SlackLogo,    // Slack (aliased, using MessageSquare)
} from 'lucide-react';

// Actions & Features
export {
  Zap as Lightning,              // Fast/Power (aliased)
  Sparkles as Sparkle,           // AI/Magic (aliased)
  Rocket,                        // Launch
  Brain,                         // AI/Intelligence
  Wand2 as MagicWand,            // Magic/AI (aliased)
  Star,                          // Favorite/Rating
  Heart,                         // Like
  ThumbsUp,                      // Thumbs up
  ThumbsDown,                    // Thumbs down
  LogOut as SignOut,             // Logout (aliased)
  LogIn as SignIn,               // Login (aliased)
  Play,                          // Play
  Pause,                         // Pause
  StopCircle as Stop,            // Stop (aliased)
  RefreshCw as ArrowClockwise,   // Refresh/Reload (aliased)
} from 'lucide-react';

// Location & Time
export {
  Globe,                         // Website/Global
  Globe as GlobeHemisphereWest,  // Globe alt (aliased)
  MapPin,                        // Location
  Calendar,                      // Calendar
  Clock,                         // Time
  Calendar as CalendarBlank,     // Empty calendar (aliased)
  Timer as ClockCountdown,       // Countdown (aliased)
} from 'lucide-react';

// Business & Company
export {
  Building as Buildings,         // Company/Business (aliased)
  Users,                         // Users/Team
  UserCircle,                    // User profile
  Users as UsersThree,           // Team/Group (aliased)
  Briefcase,                     // Business
  Handshake,                     // Partnership
} from 'lucide-react';

// Content & Media
export {
  Image,                         // Image
  Images,                        // Gallery
  Video,                         // Video
  Video as VideoCamera,          // Camera (aliased)
  Mic as Microphone,             // Microphone (aliased)
  MicOff as MicrophoneSlash,     // Mute mic (aliased)
  Volume2 as SpeakerHigh,        // Volume (aliased)
  VolumeX as SpeakerSlash,       // Mute (aliased)
  BookOpen,                      // Book/Documentation
  FileText as Article,           // Article (aliased)
  Newspaper,                     // News
  StickyNote as Note,            // Note (aliased)
  Notebook as Notepad,           // Notepad (aliased)
} from 'lucide-react';

// Legal & Compliance
export {
  Scale as Scales,               // Legal/Justice (aliased)
  Gavel,                         // Legal/Court
  CreditCard as IdentificationCard, // ID (aliased)
  Award as Certificate,          // Certificate (aliased)
  BadgeCheck as Stamp,           // Stamp/Approval (aliased)
} from 'lucide-react';

// UI Elements & Controls
export {
  Cookie,                        // Cookie
  Lightbulb,                     // Idea
  ToggleLeft,                    // Toggle off
  ToggleRight,                   // Toggle on
  Sliders,                       // Settings/Filters
  SlidersHorizontal,             // Horizontal sliders
  Filter as FunnelSimple,        // Filter (aliased)
  ArrowUpAZ as SortAscending,    // Sort asc (aliased)
  ArrowDownAZ as SortDescending, // Sort desc (aliased)
  Crown,                         // Premium
} from 'lucide-react';

// Devices & Technology
export {
  Smartphone as DeviceMobile,    // Smartphone (aliased)
  Monitor as Desktop,            // Desktop (aliased)
  Laptop,                        // Laptop
  Tablet as DeviceTablet,        // Tablet (aliased)
  Bluetooth,                     // Bluetooth
  Usb,                           // USB
  Battery as BatteryMedium,      // Battery (aliased)
  BatteryCharging,               // Charging
} from 'lucide-react';

// Shapes & Structure
export {
  Layers as Stack,               // Layers (aliased)
  Box as Cube,                   // Box/3D (aliased)
  Columns,                       // Columns
  Rows,                          // Rows
  Grid as SquaresFour,           // Grid (aliased)
  MoreHorizontal as CirclesThree,// Menu dots (aliased)
  Square as Rectangle,           // Rectangle (aliased)
  Circle,                        // Circle
  Triangle,                      // Triangle
} from 'lucide-react';

// Miscellaneous
export {
  Palette,                       // Colors/Theme
  Paintbrush as PaintBrush,      // Paint/Design (aliased)
  Wrench,                        // Tools
  Bug,                           // Bug/Debug
  Flag,                          // Flag
  Tag,                           // Tag
  Hash,                          // Hashtag
  AtSign as At,                  // @ symbol (aliased)
  Link,                          // Link
  Unlink as LinkBreak,           // Unlink (aliased)
  Paperclip,                     // Attachment
  Printer,                       // Print
  QrCode,                        // QR Code
  Barcode,                       // Barcode
  Fingerprint,                   // Fingerprint
  BadgeCheck as SealCheck,       // Verified (aliased)
} from 'lucide-react';

/**
 * Icon Size Constants
 * Use these for consistent icon sizing across the app
 */
export const ICON_SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Common Icon Props Type
 */
export interface IconProps {
  size?: keyof typeof ICON_SIZES | number;
  className?: string;
}

/**
 * Get icon size value
 * Use this helper to get consistent icon sizing
 */
export const getIconSize = (size: keyof typeof ICON_SIZES | number): number => {
  return typeof size === 'number' ? size : ICON_SIZES[size];
};
