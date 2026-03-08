import type { TabType } from './types';

export const TAB_ICONS: Record<TabType, string> = {
  profile: 'i-ph:user-circle-fill',
  settings: 'i-ph:gear-six-fill',
  features: 'i-ph:star-fill',
  billing: 'i-ph:credit-card',
  connection: 'i-ph:wifi-high-fill',
  debug: 'i-ph:bug-fill',
  'tab-management': 'i-ph:squares-four-fill',
};

export const TAB_LABELS: Record<TabType, string> = {
  profile: 'Profile',
  settings: 'Settings',
  features: 'Features',
  billing: 'Billing & Usage',
  connection: 'Connection',
  debug: 'Debug',
  'tab-management': 'Tab Management',
};

export const TAB_DESCRIPTIONS: Record<TabType, string> = {
  profile: 'Manage your profile and account settings',
  settings: 'Configure application preferences',
  features: 'Explore new and upcoming features',
  billing: 'Manage subscription and monitor message usage',
  connection: 'Check connection status and settings',
  debug: 'Debug tools and system information',
  'tab-management': 'Configure visible tabs and their order',
};

export const DEFAULT_TAB_CONFIG = [
  // User Window Tabs (Always visible by default)
  { id: 'features', visible: true, window: 'user' as const, order: 0 },
  { id: 'billing', visible: true, window: 'user' as const, order: 1 },
  { id: 'connection', visible: true, window: 'user' as const, order: 2 },

  // User Window Tabs (In dropdown, initially hidden)
  { id: 'profile', visible: false, window: 'user' as const, order: 3 },
  { id: 'settings', visible: false, window: 'user' as const, order: 4 },

  // User Window Tabs (Hidden, controlled by TaskManagerTab)
  { id: 'debug', visible: false, window: 'user' as const, order: 5 },

  // Developer Window Tabs (All visible by default)
  { id: 'features', visible: true, window: 'developer' as const, order: 0 },
  { id: 'billing', visible: true, window: 'developer' as const, order: 1 },
  { id: 'connection', visible: true, window: 'developer' as const, order: 2 },
  { id: 'profile', visible: true, window: 'developer' as const, order: 3 },
  { id: 'settings', visible: true, window: 'developer' as const, order: 4 },
  { id: 'debug', visible: true, window: 'developer' as const, order: 5 },
];
