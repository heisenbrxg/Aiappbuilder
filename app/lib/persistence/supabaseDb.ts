import { createClient } from '../supabase/client';
import type { Message } from 'ai';
import type { IChatMetadata } from './db';
import { generateChatUrlId } from '../../utils/fileUtils';
import { Buffer } from 'node:buffer';

/**
 * Encodes binary content as Base64 for safe JSONB storage
 */
function encodeBinaryContent(content: string): { encoded: true; data: string } {
  try {
    // Convert string to Base64
    const base64 = Buffer.from(content, 'binary').toString('base64');
    return { encoded: true, data: base64 };
  } catch (error) {
    console.error('Failed to encode binary content:', error);
    throw new Error('Binary encoding failed');
  }
}

/**
 * Decodes Base64 content back to binary string
 */
function decodeBinaryContent(encodedData: { encoded: true; data: string }): string {
  try {
    return Buffer.from(encodedData.data, 'base64').toString('binary');
  } catch (error) {
    console.error('Failed to decode binary content:', error);
    return '';
  }
}

/**
 * Sanitizes content to prevent Unicode escape sequence errors and preserves binary data
 */
function sanitizeContent(content: any): any {
  if (typeof content === 'string') {
    // Check for binary content indicators first
    if (content.includes('\0') || content.includes('\uFFFD')) {
      console.log('Binary content detected, encoding as Base64');
      return encodeBinaryContent(content);
    }

    try {
      // Test if the string can be JSON stringified safely
      JSON.stringify(content);
      return content;
    } catch (error) {
      console.warn('Sanitizing string content due to JSON error:', error instanceof Error ? error.message : 'Unknown error');

      // If JSON.stringify fails, apply comprehensive sanitization
      let sanitized = content
        // Fix incomplete Unicode escape sequences
        .replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u')
        .replace(/\\u([0-9a-fA-F]{1,3})(?![0-9a-fA-F])/g, '\\\\u$1')

        // Fix incomplete hex escape sequences
        .replace(/\\x(?![0-9a-fA-F]{2})/g, '\\\\x')
        .replace(/\\x([0-9a-fA-F])(?![0-9a-fA-F])/g, '\\\\x$1')

        // Fix unescaped backslashes (preserve valid escape sequences)
        .replace(/\\(?![\\/"'nrtbfuv0-7]|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2})/g, '\\\\')

        // Remove problematic control characters (keep \t, \n, \r)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

        // Handle common Windows path issues
        .replace(/C:\\(?!\\)/g, 'C:\\\\')
        .replace(/([A-Za-z]):\\(?!\\)/g, '$1:\\\\');

      // Final validation - if it still fails, use a fallback
      try {
        JSON.stringify(sanitized);
        return sanitized;
      } catch (finalError) {
        console.warn('Final sanitization failed, using safe fallback');
        // Last resort: encode problematic characters
        return sanitized.replace(/[^\x20-\x7E\t\n\r]/g, '?');
      }
    }
  }

  if (Array.isArray(content)) {
    return content.map(sanitizeContent);
  }

  if (content && typeof content === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(content)) {
      sanitized[key] = sanitizeContent(value);
    }
    return sanitized;
  }

  return content;
}

/**
 * Sanitizes messages array to prevent Unicode escape sequence errors
 */
function sanitizeMessages(messages: Message[]): Message[] {
  // Always sanitise each message – this guarantees we strip control characters
  // that PostgreSQL JSONB rejects (e.g. NUL / 0x00) even when JSON.stringify
  // would succeed.
  return messages.map((message) => ({
    ...message,
    content: sanitizeContent(message.content),
  }));
}

export interface SupabaseChatHistoryItem {
  id: string;
  user_id: string;
  url_id: string;
  title: string;
  description?: string;
  messages: Message[];
  metadata?: IChatMetadata;
  created_at: string;
  updated_at: string;
}

export interface SupabaseSnapshot {
  id: string;
  chat_id: string;
  user_id: string;
  files: Record<string, any>;
  locked_files?: Record<string, any>;
  snapshot_message_id?: string;  // Message ID for snapshot point reference
  summary?: string;              // Optional snapshot summary
  created_at: string;
}

export class SupabaseDB {
  private supabase = createClient();

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError!;
  }

  async setMessages(
    userId: string,
    messages: Message[],
    urlId?: string,
    description?: string,
    metadata?: IChatMetadata,
  ): Promise<{ urlId: string; chatId: string }> {
    // If no urlId provided, this is a new chat - generate a unique one
    if (!urlId) {
      urlId = await this.generateUniqueUrlId(userId);
    }

    // Sanitize messages to prevent Unicode escape sequence errors
    const sanitizedMessages = sanitizeMessages(messages);

    const chatData = {
      user_id: userId,
      url_id: urlId,
      title: description || this.generateChatTitle(sanitizedMessages),
      description: description,
      messages: sanitizedMessages,
      metadata: metadata || {},
      updated_at: new Date().toISOString()
    };

    // Check if chat exists
    const { data: existingChat, error: checkError } = await this.supabase
      .from('user_chats')
      .select('id')
      .eq('url_id', urlId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing chat:', checkError);
      throw new Error(`Failed to check existing chat: ${checkError.message}`);
    }

    let chatId: string;

    if (existingChat) {
      // Update existing chat
      const { error } = await this.supabase
        .from('user_chats')
        .update(chatData)
        .eq('id', existingChat.id);

      if (error) {
        throw new Error(`Failed to update chat: ${error.message}`);
      }
      chatId = existingChat.id;
    } else {
      // Create new chat and return the ID
      const { data: newChat, error } = await this.supabase
        .from('user_chats')
        .insert(chatData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create chat:', error);
        console.error('Chat data that failed:', chatData);

        // Provide more specific error message for Unicode issues
        if (error.message?.includes('Unicode') || error.message?.includes('escape sequence')) {
          throw new Error('Failed to save chat: Invalid characters in message content. Please try again.');
        }

        throw new Error(`Failed to create chat: ${error.message}`);
      }

      if (!newChat?.id) {
        console.error('No chat ID returned from insert:', newChat);
        console.error('Chat data:', chatData);
        throw new Error('No chat ID returned from database');
      }

      chatId = newChat.id;
      console.log('✅ Successfully created new chat:', {
        chatId,
        urlId,
        userId: chatData.user_id,
        title: chatData.title
      });
    }

    return { urlId, chatId };
  }

  async generateUniqueUrlId(userId: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const urlId = generateChatUrlId();

      try {
        // Check if this URL ID already exists globally (since url_id has UNIQUE constraint)
        const { data, error } = await this.supabase
          .from('user_chats')
          .select('id')
          .eq('url_id', urlId)
          .maybeSingle(); // Use maybeSingle to avoid errors when no rows found

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" which is what we want
          console.warn('Error checking URL ID uniqueness:', error);
          attempts++;
          continue;
        }

        if (!data) {
          // URL ID is unique, return it
          console.log('Generated unique URL ID:', urlId);
          return urlId;
        }

        console.log('URL ID collision detected, retrying...', urlId);
        attempts++;
      } catch (error) {
        console.warn('Exception during URL ID uniqueness check:', error);
        attempts++;
      }
    }

    // If we couldn't generate a unique ID after max attempts, append timestamp
    const fallbackId = `${generateChatUrlId()}_${Date.now()}`;
    console.warn('Using fallback URL ID after max attempts:', fallbackId);
    return fallbackId;
  }

  async getMessages(userId: string, urlId: string): Promise<SupabaseChatHistoryItem | null> {
    const { data, error } = await this.supabase
      .from('user_chats')
      .select('*')
      .eq('url_id', urlId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    if (!data) {
      console.log('🔍 No chat found with URL ID:', urlId);
      return null;
    }

    return data;
  }

  async getAllChats(userId: string): Promise<SupabaseChatHistoryItem[]> {
    const { data, error } = await this.supabase
      .from('user_chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get chats: ${error.message}`);
    }

    return data || [];
  }

  async deleteChat(userId: string, urlId: string): Promise<void> {
    // First get the chat_id from url_id
    const { data: chat, error: fetchError } = await this.supabase
      .from('user_chats')
      .select('id')
      .eq('url_id', urlId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !chat) {
      throw new Error(`Failed to find chat: ${fetchError?.message || 'Chat not found'}`);
    }

    // Delete snapshots first to ensure RLS policies are respected
    const { error: snapshotError } = await this.supabase
      .from('chat_snapshots')
      .delete()
      .eq('chat_id', chat.id)
      .eq('user_id', userId);

    if (snapshotError) {
      console.error('Error deleting snapshots:', snapshotError);
      // Continue anyway - CASCADE should handle it as fallback
    }

    // Then delete the chat
    const { error } = await this.supabase
      .from('user_chats')
      .delete()
      .eq('url_id', urlId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete chat: ${error.message}`);
    }
  }

  async createChatFromMessages(
    userId: string,
    description: string,
    messages: Message[],
    metadata?: IChatMetadata,
  ): Promise<string> {
    const urlId = await this.generateUniqueUrlId(userId);

    // Sanitize messages to prevent Unicode escape sequence errors
    const sanitizedMessages = sanitizeMessages(messages);

    const { data, error } = await this.supabase
      .from('user_chats')
      .insert({
        user_id: userId,
        url_id: urlId,
        title: description,
        description: description,
        messages: sanitizedMessages,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      // Provide more specific error message for Unicode issues
      if (error.message?.includes('Unicode') || error.message?.includes('escape sequence')) {
        throw new Error('Failed to save chat: Invalid characters in message content. Please try again.');
      }

      throw new Error(`Failed to create chat: ${error.message}`);
    }

    return urlId;
  }

  async duplicateChat(userId: string, urlId: string): Promise<string> {
    const chat = await this.getMessages(userId, urlId);

    if (!chat) {
      throw new Error('Chat not found');
    }

    return this.createChatFromMessages(
      userId,
      `${chat.description || 'Chat'} (copy)`,
      chat.messages,
      chat.metadata
    );
  }

  async forkChat(userId: string, urlId: string, messageId: string): Promise<string> {
    console.log('🔍 Supabase forkChat called with:', { userId, urlId, messageId });

    const chat = await this.getMessages(userId, urlId);
    console.log('🔍 Chat lookup result:', chat ? { id: chat.id, url_id: chat.url_id, messageCount: chat.messages?.length } : 'null');

    if (!chat) {
      console.error('❌ Chat not found in Supabase for:', { userId, urlId });
      throw new Error('Chat not found');
    }

    // Find the index of the message to fork at
    const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);
    console.log('🔍 Message index found:', messageIndex, 'for messageId:', messageId);

    if (messageIndex === -1) {
      console.error('❌ Message not found in chat:', { messageId, availableMessageIds: chat.messages.map(m => m.id) });
      throw new Error('Message not found');
    }

    // Get messages up to and including the selected message
    const messages = chat.messages.slice(0, messageIndex + 1);
    console.log('🔍 Forking with', messages.length, 'messages');

    return this.createChatFromMessages(
      userId,
      chat.description ? `${chat.description} (fork)` : 'Forked chat',
      messages,
      chat.metadata
    );
  }

  async setSnapshot(
    userId: string,
    chatId: string,
    files: Record<string, any>,
    lockedFiles?: Record<string, any>,
    snapshotMessageId?: string,
    summary?: string
  ): Promise<void> {
    // First, delete any existing snapshots for this chat to prevent duplicates
    await this.supabase
      .from('chat_snapshots')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId);

    // Then insert the new snapshot
    const encodedFiles = this.encodeSnapshotFiles(files);
    
    // Build snapshot object conditionally to avoid inserting undefined fields
    const snapshotData: any = {
      chat_id: chatId,
      user_id: userId,
      files: encodedFiles,
      locked_files: lockedFiles || {},
      created_at: new Date().toISOString()
    };
    
    // Only include optional fields if they exist
    if (snapshotMessageId !== undefined) {
      snapshotData.snapshot_message_id = snapshotMessageId;
    }
    if (summary !== undefined) {
      snapshotData.summary = summary;
    }
    
    const { error } = await this.supabase
      .from('chat_snapshots')
      .insert(snapshotData);

    if (error) {
      throw new Error(`Failed to save snapshot: ${error.message}`);
    }
  }

  async setSnapshotByUrlId(
    userId: string,
    chatUrlId: string,
    files: Record<string, any>,
    lockedFiles?: Record<string, any>,
    snapshotMessageId?: string,
    summary?: string
  ): Promise<void> {
    // Get chat ID from URL ID
    const { data: chat } = await this.supabase
      .from('user_chats')
      .select('id')
      .eq('url_id', chatUrlId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!chat) {
      throw new Error('Chat not found for snapshot');
    }

    await this.setSnapshot(userId, chat.id, files, lockedFiles, snapshotMessageId, summary);
  }

  async cleanupDuplicateSnapshots(userId?: string): Promise<void> {
    // Get all snapshots for the user (or all users if no userId provided), grouped by chat_id
    let query = this.supabase
      .from('chat_snapshots')
      .select('id, chat_id, user_id, created_at')
      .order('user_id')
      .order('chat_id')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: snapshots } = await query;

    if (!snapshots || snapshots.length === 0) return;

    // Group by user_id + chat_id and keep only the most recent snapshot for each chat
    const snapshotsToDelete: string[] = [];
    const chatGroups = new Map<string, any[]>();

    snapshots.forEach((snapshot: { id: string; chat_id: string; user_id: string; created_at: string }) => {
      const key = `${snapshot.user_id}:${snapshot.chat_id}`;
      if (!chatGroups.has(key)) {
        chatGroups.set(key, []);
      }
      chatGroups.get(key)!.push(snapshot);
    });

    // For each chat, keep the most recent snapshot and mark others for deletion
    chatGroups.forEach(chatSnapshots => {
      if (chatSnapshots.length > 1) {
        // Skip the first (most recent) and delete the rest
        chatSnapshots.slice(1).forEach(snapshot => {
          snapshotsToDelete.push(snapshot.id);
        });
      }
    });

    // Delete duplicate snapshots in batches
    if (snapshotsToDelete.length > 0) {
      const { error } = await this.supabase
        .from('chat_snapshots')
        .delete()
        .in('id', snapshotsToDelete);

      if (error) {
        console.error('Failed to cleanup duplicate snapshots:', error);
      } else {
        console.log(`Cleaned up ${snapshotsToDelete.length} duplicate snapshots`);
      }
    }
  }

  async getSnapshot(userId: string, chatUrlId: string): Promise<SupabaseSnapshot | null> {
    // Get chat ID from URL ID
    const { data: chat } = await this.supabase
      .from('user_chats')
      .select('id')
      .eq('url_id', chatUrlId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!chat) {
      console.log('No chat found for snapshot lookup with URL ID:', chatUrlId);
      return null;
    }

    const { data, error } = await this.supabase
      .from('chat_snapshots')
      .select('*')
      .eq('chat_id', chat.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get snapshot: ${error.message}`);
    }

    if (!data) {
      console.log('No snapshot found for chat ID:', chat.id);
      return null;
    }

    // Decode binary files in the snapshot
    const decodedFiles = this.decodeSnapshotFiles(data.files);

    // Snapshot found, return with decoded files
    return {
      ...data,
      files: decodedFiles
    };
  }

  /**
   * Decodes Base64-encoded binary files in snapshot data
   */
  private decodeSnapshotFiles(files: Record<string, any>): Record<string, any> {
    const decoded: Record<string, any> = {};

    for (const [path, fileData] of Object.entries(files)) {
      if (fileData && typeof fileData === 'object') {
        if (fileData.type === 'file' && fileData.content) {
          // Check if content is Base64-encoded binary
          if (typeof fileData.content === 'object' && fileData.content.encoded === true) {
            decoded[path] = {
              ...fileData,
              content: decodeBinaryContent(fileData.content),
              isBinary: true
            };
          } else {
            decoded[path] = fileData;
          }
        } else {
          decoded[path] = fileData;
        }
      }
    }

    return decoded;
  }

  /**
   * Encodes binary files in a FileMap so they are safe for JSONB storage
   */
  private encodeSnapshotFiles(files: Record<string, any>): Record<string, any> {
    const encoded: Record<string, any> = {};

    for (const [filePath, fileData] of Object.entries(files)) {
      if (fileData && typeof fileData === 'object' && fileData.type === 'file') {
        const isBinary = !!fileData.isBinary;
        const content = (fileData as any).content;

        if (isBinary) {
          // If already encoded, pass through
          if (content && typeof content === 'object' && content.encoded === true) {
            encoded[filePath] = fileData;
            continue;
          }

          if (typeof content === 'string') {
            // Treat content as base64 payload (as produced by FilesStore)
            encoded[filePath] = {
              ...fileData,
              content: { encoded: true, data: content },
            };
          } else {
            // Unknown shape, keep as-is
            encoded[filePath] = fileData;
          }
        } else {
          // Sanitize text content for JSON safety
          encoded[filePath] = {
            ...fileData,
            content: sanitizeContent(content),
          };
        }
      } else {
        encoded[filePath] = fileData as any;
      }
    }

    return encoded;
  }

  async updateChatDescription(userId: string, urlId: string, description: string): Promise<void> {
    if (!description.trim()) {
      throw new Error('Description cannot be empty');
    }

    console.log('SupabaseDB: Updating chat description', {
      userId,
      urlId,
      description
    });

    try {
      const { error, data } = await this.supabase
        .from('user_chats')
        .update({ 
          title: description,
          description: description,
          updated_at: new Date().toISOString()
        })
        .eq('url_id', urlId)
        .eq('user_id', userId)
        .select('id, title, description');

      if (error) {
        console.error('SupabaseDB: Error updating chat description:', error);
        throw new Error(`Failed to update chat description: ${error.message}`);
      }

      console.log('SupabaseDB: Chat description updated successfully', data);
    } catch (error) {
      console.error('SupabaseDB: Exception updating chat description:', error);
      throw error;
    }
  }

  async updateChatMetadata(userId: string, urlId: string, metadata: IChatMetadata): Promise<void> {
    const { error } = await this.supabase
      .from('user_chats')
      .update({ 
        metadata: metadata,
        updated_at: new Date().toISOString()
      })
      .eq('url_id', urlId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update chat metadata: ${error.message}`);
    }
  }

  private generateChatTitle(messages: Message[]): string {
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
