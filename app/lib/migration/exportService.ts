import { openDatabase } from '../persistence/db';
import type { ChatHistoryItem } from '../persistence/useChatHistory';
import type { Snapshot } from '../persistence/types';

export interface ExportedUserData {
  version: string;
  exportedAt: string;
  userId?: string;
  data: {
    chats: ChatHistoryItem[];
    snapshots: Snapshot[];
    settings: Record<string, any>;
    preferences: UserProfile;
    lockedFiles: Record<string, any>;
  };
}

export interface UserProfile {
  theme: string;
  language: string;
  timezone: string;
  notifications: boolean;
  autoSelectTemplate: boolean;
  contextOptimization: boolean;
  eventLogs: boolean;
  developerMode: boolean;
}

function getLocalStorage(key: string): any {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return localStorage.getItem(key);
  }
}

export class IndexedDBExportService {
  static async exportAllUserData(): Promise<ExportedUserData> {
    const db = await openDatabase();
    if (!db) {
      throw new Error('Failed to open IndexedDB database');
    }

    try {
      const [chats, snapshots, settings, preferences] = await Promise.all([
        this.exportChats(db),
        this.exportSnapshots(db),
        this.exportSettings(),
        this.exportPreferences()
      ]);

      return {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: { 
          chats, 
          snapshots, 
          settings, 
          preferences, 
          lockedFiles: {} 
        }
      };
    } finally {
      db.close();
    }
  }

  private static async exportChats(db: IDBDatabase): Promise<ChatHistoryItem[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('chats', 'readonly');
      const store = transaction.objectStore('chats');
      const request = store.getAll();

      request.onsuccess = () => {
        const chats = request.result || [];
        console.log(`Exported ${chats.length} chats from IndexedDB`);
        resolve(chats);
      };

      request.onerror = () => {
        console.error('Failed to export chats:', request.error);
        reject(request.error);
      };
    });
  }

  private static async exportSnapshots(db: IDBDatabase): Promise<Snapshot[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('snapshots', 'readonly');
      const store = transaction.objectStore('snapshots');
      const request = store.getAll();

      request.onsuccess = () => {
        const snapshots = request.result || [];
        console.log(`Exported ${snapshots.length} snapshots from IndexedDB`);
        resolve(snapshots);
      };

      request.onerror = () => {
        console.error('Failed to export snapshots:', request.error);
        reject(request.error);
      };
    });
  }

  private static exportSettings(): Record<string, any> {
    const settings: Record<string, any> = {};
    
    // Export relevant localStorage settings
    const settingsKeys = [
      'bolt_user_profile',
      'isLatestBranch',
      'autoSelectTemplate',
      'isDeveloperMode',
      'isEventLogsEnabled',
      'contextOptimizationEnabled'
    ];

    settingsKeys.forEach(key => {
      const value = getLocalStorage(key);
      if (value !== null) {
        settings[key] = value;
      }
    });

    console.log(`Exported ${Object.keys(settings).length} settings from localStorage`);
    return settings;
  }

  private static exportPreferences(): UserProfile {
    return {
      theme: getLocalStorage('theme') || 'system',
      language: getLocalStorage('language') || 'en',
      timezone: getLocalStorage('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifications: getLocalStorage('notifications') ?? true,
      autoSelectTemplate: getLocalStorage('autoSelectTemplate') ?? false,
      contextOptimization: getLocalStorage('contextOptimizationEnabled') ?? true,
      eventLogs: getLocalStorage('isEventLogsEnabled') ?? false,
      developerMode: getLocalStorage('isDeveloperMode') ?? false
    };
  }

  static async validateExportData(data: ExportedUserData): Promise<boolean> {
    try {
      // Basic validation
      if (!data.version || !data.exportedAt || !data.data) {
        return false;
      }

      // Validate data structure
      const { chats, snapshots, settings, preferences } = data.data;
      
      if (!Array.isArray(chats) || !Array.isArray(snapshots)) {
        return false;
      }

      // Validate chat structure
      for (const chat of chats) {
        if (!chat.id || !Array.isArray(chat.messages)) {
          return false;
        }
      }

      console.log('Export data validation passed');
      return true;
    } catch (error) {
      console.error('Export data validation failed:', error);
      return false;
    }
  }
}
