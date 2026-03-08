/**
 * Database monitoring utilities for debugging Supabase issues
 */

import { createClient } from '../supabase/client';

export class DatabaseMonitor {
  private supabase = createClient();

  /**
   * Check for duplicate chats in the database
   */
  async checkDuplicateChats(userId: string): Promise<{
    duplicates: Array<{
      url_id: string;
      count: number;
      chat_ids: string[];
    }>;
    total: number;
  }> {
    const { data: chats, error } = await this.supabase
      .from('user_chats')
      .select('id, url_id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch chats: ${error.message}`);
    }

    // Group by URL ID to find duplicates
    const urlGroups = new Map<string, string[]>();
    
    chats?.forEach((chat: any) => {
      if (!urlGroups.has(chat.url_id)) {
        urlGroups.set(chat.url_id, []);
      }
      urlGroups.get(chat.url_id)!.push(chat.id);
    });

    // Find duplicates
    const duplicates = Array.from(urlGroups.entries())
      .filter(([_, chatIds]) => chatIds.length > 1)
      .map(([urlId, chatIds]) => ({
        url_id: urlId,
        count: chatIds.length,
        chat_ids: chatIds
      }));

    return {
      duplicates,
      total: duplicates.reduce((sum, dup) => sum + dup.count, 0)
    };
  }

  /**
   * Clean up duplicate chats, keeping only the most recent one
   */
  async cleanupDuplicateChats(userId: string): Promise<{
    removed: number;
    kept: number;
  }> {
    const duplicateInfo = await this.checkDuplicateChats(userId);
    let removedCount = 0;
    let keptCount = 0;

    for (const duplicate of duplicateInfo.duplicates) {
      // Get full chat details to determine which to keep
      const { data: fullChats, error } = await this.supabase
        .from('user_chats')
        .select('*')
        .in('id', duplicate.chat_ids)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch full chat details:', error);
        continue;
      }

      if (fullChats && fullChats.length > 1) {
        // Keep the most recent one, delete the rest
        const [keepChat, ...deleteChats] = fullChats;
        
        for (const chatToDelete of deleteChats) {
          const { error: deleteError } = await this.supabase
            .from('user_chats')
            .delete()
            .eq('id', chatToDelete.id);

          if (deleteError) {
            console.error('Failed to delete duplicate chat:', deleteError);
          } else {
            removedCount++;
            console.log('Removed duplicate chat:', chatToDelete.id);
          }
        }
        
        keptCount++;
        console.log('Kept chat:', keepChat.id);
      }
    }

    return { removed: removedCount, kept: keptCount };
  }

  /**
   * Monitor database operations in real-time
   */
  async monitorOperations(userId: string, callback: (event: any) => void) {
    // Subscribe to real-time changes
    const subscription = this.supabase
      .channel('db-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_chats',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(userId: string): Promise<{
    totalChats: number;
    totalSnapshots: number;
    duplicateChats: number;
    orphanedSnapshots: number;
  }> {
    const [chatsResult, snapshotsResult, duplicatesInfo] = await Promise.all([
      this.supabase
        .from('user_chats')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      
      this.supabase
        .from('chat_snapshots')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      
      this.checkDuplicateChats(userId)
    ]);

    // Check for orphaned snapshots
    const { data: orphanedSnapshots } = await this.supabase
      .from('chat_snapshots')
      .select('id')
      .eq('user_id', userId)
      .not('chat_id', 'in', `(SELECT id FROM user_chats WHERE user_id = '${userId}')`);

    return {
      totalChats: chatsResult.count || 0,
      totalSnapshots: snapshotsResult.count || 0,
      duplicateChats: duplicatesInfo.total,
      orphanedSnapshots: orphanedSnapshots?.length || 0
    };
  }

  /**
   * Validate database integrity
   */
  async validateIntegrity(userId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    const stats = await this.getDatabaseStats(userId);

    if (stats.duplicateChats > 0) {
      issues.push(`Found ${stats.duplicateChats} duplicate chats`);
    }

    if (stats.orphanedSnapshots > 0) {
      issues.push(`Found ${stats.orphanedSnapshots} orphaned snapshots`);
    }

    // Check for chats without snapshots (might be expected for new chats)
    const { data: chatsWithoutSnapshots } = await this.supabase
      .from('user_chats')
      .select('id, title')
      .eq('user_id', userId)
      .not('id', 'in', `(SELECT DISTINCT chat_id FROM chat_snapshots WHERE user_id = '${userId}')`);

    if (chatsWithoutSnapshots && chatsWithoutSnapshots.length > 0) {
      issues.push(`Found ${chatsWithoutSnapshots.length} chats without snapshots`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const databaseMonitor = new DatabaseMonitor();

// Helper function for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).databaseMonitor = databaseMonitor;
}
