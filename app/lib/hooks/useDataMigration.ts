import { useState, useEffect } from 'react';
import { useAuth } from '~/components/auth/AuthProvider';
import { createClient } from '../supabase/client';
import { IndexedDBExportService } from '../migration/exportService';
import { SupabaseImportService } from '../migration/importService';
import { toast } from 'react-toastify';

export type MigrationStatus = 'pending' | 'in-progress' | 'complete' | 'error' | 'not-needed';

export interface MigrationState {
  status: MigrationStatus;
  progress: number;
  error?: string;
  stage?: string;
}

export function useDataMigration() {
  const { user } = useAuth();
  const [migrationState, setMigrationState] = useState<MigrationState>({
    status: 'pending',
    progress: 0
  });

  // Check migration status on user change
  useEffect(() => {
    if (!user) {
      setMigrationState({ status: 'not-needed', progress: 0 });
      return;
    }

    checkMigrationStatus();
  }, [user]);

  const checkMigrationStatus = async (): Promise<MigrationStatus> => {
    if (!user) return 'not-needed';

    try {
      const supabase = createClient();
      
      // Check if migration has been completed
      const { data, error } = await supabase
        .from('user_settings')
        .select('value')
        .eq('user_id', user.id)
        .eq('category', 'system')
        .eq('key', 'migration_completed')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking migration status:', error);
        return 'error';
      }

      if (data?.value?.completed) {
        setMigrationState({ status: 'complete', progress: 100 });
        return 'complete';
      }

      // Check if there's any local data to migrate
      const hasLocalData = await checkForLocalData();
      if (!hasLocalData) {
        // No local data, mark as complete
        await markMigrationComplete();
        setMigrationState({ status: 'complete', progress: 100 });
        return 'complete';
      }

      setMigrationState({ status: 'pending', progress: 0 });
      return 'pending';
    } catch (error) {
      console.error('Failed to check migration status:', error);
      setMigrationState({ 
        status: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return 'error';
    }
  };

  const checkForLocalData = async (): Promise<boolean> => {
    try {
      const exportedData = await IndexedDBExportService.exportAllUserData();
      
      // Check if there's meaningful data to migrate
      const hasChats = exportedData.data.chats.length > 0;
      const hasSnapshots = exportedData.data.snapshots.length > 0;
      const hasSettings = Object.keys(exportedData.data.settings).length > 0;
      
      return hasChats || hasSnapshots || hasSettings;
    } catch (error) {
      console.error('Error checking for local data:', error);
      return false;
    }
  };

  const startMigration = async (): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setMigrationState({ status: 'in-progress', progress: 0, stage: 'Preparing data...' });

    try {
      // Step 1: Export data from IndexedDB
      setMigrationState({ status: 'in-progress', progress: 20, stage: 'Exporting local data...' });
      const exportedData = await IndexedDBExportService.exportAllUserData();

      // Step 2: Validate exported data
      setMigrationState({ status: 'in-progress', progress: 40, stage: 'Validating data...' });
      const isValid = await IndexedDBExportService.validateExportData(exportedData);
      if (!isValid) {
        throw new Error('Exported data validation failed');
      }

      // Step 3: Import to Supabase
      setMigrationState({ status: 'in-progress', progress: 60, stage: 'Importing to cloud...' });
      await SupabaseImportService.importUserData(exportedData, user.id);

      // Step 4: Verify migration
      setMigrationState({ status: 'in-progress', progress: 80, stage: 'Verifying migration...' });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause for verification

      // Step 5: Complete
      setMigrationState({ status: 'complete', progress: 100, stage: 'Migration complete!' });
      
      toast.success('Your data has been successfully migrated to the cloud!');
    } catch (error) {
      console.error('Migration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setMigrationState({ 
        status: 'error', 
        progress: 0, 
        error: errorMessage,
        stage: 'Migration failed'
      });
      
      toast.error(`Migration failed: ${errorMessage}`);
      throw error;
    }
  };

  const markMigrationComplete = async (): Promise<void> => {
    if (!user) return;

    const supabase = createClient();
    await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        category: 'system',
        key: 'migration_completed',
        value: { 
          completed: true, 
          completedAt: new Date().toISOString(),
          version: '1.0.0'
        },
        synced: false
      });
  };

  const resetMigration = async (): Promise<void> => {
    if (!user) return;

    const supabase = createClient();
    await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', user.id)
      .eq('category', 'system')
      .eq('key', 'migration_completed');

    setMigrationState({ status: 'pending', progress: 0 });
  };

  return {
    migrationState,
    startMigration,
    checkMigrationStatus,
    resetMigration,
    isComplete: migrationState.status === 'complete',
    isInProgress: migrationState.status === 'in-progress',
    hasError: migrationState.status === 'error'
  };
}
