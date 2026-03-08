#!/usr/bin/env node

/**
 * Script to cleanup duplicate snapshots in the database
 * This should be run once to clean up existing duplicates
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env file or environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupAllDuplicateSnapshots() {
  console.log('Starting cleanup of duplicate snapshots...');

  try {
    // Get all unique user IDs that have snapshots
    const { data: users, error: usersError } = await supabase
      .from('chat_snapshots')
      .select('user_id')
      .order('user_id');

    if (usersError) {
      throw new Error(`Failed to get users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No snapshots found in database');
      return;
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(users.map(u => u.user_id))];
    console.log(`Found ${uniqueUserIds.length} users with snapshots`);

    let totalCleaned = 0;

    // Process each user
    for (const userId of uniqueUserIds) {
      console.log(`Processing user: ${userId}`);

      // Get all snapshots for this user, grouped by chat_id
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('chat_snapshots')
        .select('id, chat_id, created_at')
        .eq('user_id', userId)
        .order('chat_id')
        .order('created_at', { ascending: false });

      if (snapshotsError) {
        console.error(`Failed to get snapshots for user ${userId}:`, snapshotsError);
        continue;
      }

      if (!snapshots || snapshots.length === 0) continue;

      // Group by chat_id and keep only the most recent snapshot for each chat
      const snapshotsToDelete = [];
      const chatGroups = new Map();

      snapshots.forEach(snapshot => {
        if (!chatGroups.has(snapshot.chat_id)) {
          chatGroups.set(snapshot.chat_id, []);
        }
        chatGroups.get(snapshot.chat_id).push(snapshot);
      });

      // For each chat, keep the most recent snapshot and mark others for deletion
      chatGroups.forEach(chatSnapshots => {
        if (chatSnapshots.length > 1) {
          console.log(`  Chat ${chatSnapshots[0].chat_id}: ${chatSnapshots.length} snapshots, keeping 1, deleting ${chatSnapshots.length - 1}`);
          // Skip the first (most recent) and delete the rest
          chatSnapshots.slice(1).forEach(snapshot => {
            snapshotsToDelete.push(snapshot.id);
          });
        }
      });

      // Delete duplicate snapshots for this user
      if (snapshotsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('chat_snapshots')
          .delete()
          .in('id', snapshotsToDelete);

        if (deleteError) {
          console.error(`Failed to delete snapshots for user ${userId}:`, deleteError);
        } else {
          console.log(`  Cleaned up ${snapshotsToDelete.length} duplicate snapshots for user ${userId}`);
          totalCleaned += snapshotsToDelete.length;
        }
      } else {
        console.log(`  No duplicates found for user ${userId}`);
      }
    }

    console.log(`\n✅ Cleanup completed! Total snapshots cleaned: ${totalCleaned}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupAllDuplicateSnapshots();
