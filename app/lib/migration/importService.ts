import { createClient } from '../supabase/client';
import type { ExportedUserData, UserProfile } from './exportService';
import type { ChatHistoryItem } from '../persistence/useChatHistory';
import type { Snapshot } from '../persistence/types';
import { generateChatUrlId } from '../../utils/fileUtils';

export class SupabaseImportService {
  static async importUserData(
    exportedData: ExportedUserData, 
    userId: string
  ): Promise<void> {
    const supabase = createClient();
    const { data } = exportedData;
    
    try {
      console.log('Starting user data import to Supabase...');
      
      // Import in order of dependencies
      await this.importUserProfile(data.preferences, userId, supabase);
      const chatIdMap = await this.importChats(data.chats, userId, supabase);
      await this.importSnapshots(data.snapshots, userId, chatIdMap, supabase);
      await this.importSettings(data.settings, userId, supabase);
      
      // Mark migration as complete
      await this.markMigrationComplete(userId, supabase);
      
      console.log('User data import completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private static async importUserProfile(
    preferences: UserProfile, 
    userId: string,
    supabase: any
  ): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        preferences: {
          theme: preferences.theme,
          language: preferences.language,
          timezone: preferences.timezone,
          notifications: preferences.notifications,
          autoSelectTemplate: preferences.autoSelectTemplate,
          contextOptimization: preferences.contextOptimization,
          eventLogs: preferences.eventLogs,
          developerMode: preferences.developerMode
        },
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to import user profile: ${error.message}`);
    }

    console.log('User profile imported successfully');
  }

  private static async importChats(
    chats: ChatHistoryItem[], 
    userId: string,
    supabase: any
  ): Promise<Map<string, string>> {
    const chatIdMap = new Map<string, string>(); // originalId -> newId
    
    for (const chat of chats) {
      // Generate new UUID for each chat during migration with retry logic
      let newUrlId: string;
      let attempts = 0;
      const maxAttempts = 5;
      let data: any;
      let error: any;

      while (attempts < maxAttempts) {
        newUrlId = generateChatUrlId();

        const supabaseChat = {
          user_id: userId,
          url_id: newUrlId, // Always use new UUID format
          title: chat.description || this.generateChatTitle(chat.messages),
          description: chat.description,
          messages: chat.messages,
          metadata: {
            ...chat.metadata || {},
            // Store original URL ID for reference if needed
            originalUrlId: chat.urlId
          },
          created_at: chat.timestamp,
          updated_at: chat.timestamp
        };

        const result = await supabase
          .from('user_chats')
          .insert(supabaseChat)
          .select('id')
          .single();

        data = result.data;
        error = result.error;

        // If successful or error is not a duplicate key constraint, break
        if (!error || !error.message.includes('duplicate key value violates unique constraint')) {
          break;
        }

        attempts++;
        console.warn(`URL ID collision during migration, retrying... (attempt ${attempts}/${maxAttempts})`);
      }

      if (error) {
        throw new Error(`Failed to import chat ${chat.id}: ${error.message}`);
      }

      // Map original chat ID to new Supabase ID for snapshots
      chatIdMap.set(chat.id, data.id);
    }

    console.log(`Imported ${chats.length} chats to Supabase`);
    return chatIdMap;
  }

  private static async importSnapshots(
    snapshots: Snapshot[], 
    userId: string,
    chatIdMap: Map<string, string>,
    supabase: any
  ): Promise<void> {
    for (const snapshot of snapshots) {
      const chatId = chatIdMap.get(snapshot.chatIndex);
      if (!chatId) {
        console.warn(`No chat found for snapshot with chatIndex: ${snapshot.chatIndex}`);
        continue;
      }

      const { error } = await supabase
        .from('chat_snapshots')
        .insert({
          chat_id: chatId,
          user_id: userId,
          files: snapshot.files || {},
          created_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to import snapshot: ${error.message}`);
      }
    }

    console.log(`Imported ${snapshots.length} snapshots to Supabase`);
  }

  private static async importSettings(
    settings: Record<string, any>, 
    userId: string,
    supabase: any
  ): Promise<void> {
    const settingsToImport = [];

    for (const [key, value] of Object.entries(settings)) {
      // Categorize settings
      let category = 'ui';
      if (key.includes('developer') || key.includes('event')) {
        category = 'developer';
      } else if (key.includes('template') || key.includes('optimization')) {
        category = 'features';
      }

      settingsToImport.push({
        user_id: userId,
        category,
        key,
        value,
        synced: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    if (settingsToImport.length > 0) {
      const { error } = await supabase
        .from('user_settings')
        .insert(settingsToImport);

      if (error) {
        throw new Error(`Failed to import settings: ${error.message}`);
      }
    }

    console.log(`Imported ${settingsToImport.length} settings to Supabase`);
  }

  private static async markMigrationComplete(userId: string, supabase: any): Promise<void> {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        category: 'system',
        key: 'migration_completed',
        value: { 
          completed: true, 
          completedAt: new Date().toISOString(),
          version: '1.0.0'
        },
        synced: false
      });

    if (error) {
      throw new Error(`Failed to mark migration complete: ${error.message}`);
    }
  }

  private static generateChatTitle(messages: any[]): string {
    if (!messages || messages.length === 0) {
      return 'New Chat';
    }

    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage && firstUserMessage.content) {
      const title = firstUserMessage.content.slice(0, 50);
      return title.length < firstUserMessage.content.length ? `${title}...` : title;
    }

    return 'New Chat';
  }
}
