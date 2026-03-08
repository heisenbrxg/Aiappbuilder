import { motion } from 'framer-motion';
import { useDataMigration } from '~/lib/hooks/useDataMigration';
import { classNames } from '~/utils/classNames';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MigrationModal({ isOpen, onClose }: MigrationModalProps) {
  const { migrationState, startMigration, isComplete, isInProgress, hasError } = useDataMigration();

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    try {
      await startMigration();
      // Auto-close after successful migration
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isInProgress ? onClose : undefined}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-[#141414] rounded-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl max-w-md w-full mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <div className="i-ph:cloud-arrow-up w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-monzed-elements-textPrimary">
              🚀 Upgrade to Starsky
            </h2>
          </div>
          {!isInProgress && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="i-ph:x w-4 h-4 text-monzed-elements-textSecondary" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {migrationState.status === 'pending' && (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <div className="i-ph:cloud-arrow-up w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-monzed-elements-textPrimary mb-2">
                  Sync Your Projects to the Cloud
                </h3>
                <p className="text-monzed-elements-textSecondary text-sm leading-relaxed">
                  We're upgrading Starsky to sync your projects and chat history across all your devices. 
                  Your data will be securely migrated to the cloud.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-monzed-elements-textPrimary mb-2">What's included:</h4>
                <ul className="text-sm text-monzed-elements-textSecondary space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="i-ph:check w-4 h-4 text-green-500" />
                    All your chat history and projects
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="i-ph:check w-4 h-4 text-green-500" />
                    Project files and code snapshots
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="i-ph:check w-4 h-4 text-green-500" />
                    Your preferences and settings
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="i-ph:lock w-4 h-4 text-blue-500" />
                    API keys remain secure and local
                  </li>
                </ul>
              </div>

              <button
                onClick={handleStartMigration}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Start Migration
              </button>
            </div>
          )}

          {isInProgress && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
                </div>
                <h3 className="text-lg font-semibold text-monzed-elements-textPrimary mb-2">
                  Migrating Your Data
                </h3>
                <p className="text-monzed-elements-textSecondary text-sm">
                  {migrationState.stage || 'Processing...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <motion.div
                  className="bg-red-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${migrationState.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <p className="text-xs text-monzed-elements-textSecondary">
                {migrationState.progress}% complete
              </p>
            </div>
          )}

          {isComplete && (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <div className="i-ph:check-circle w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-monzed-elements-textPrimary mb-2">
                  Migration Complete!
                </h3>
                <p className="text-monzed-elements-textSecondary text-sm">
                  Your projects are now synced across all your devices. Welcome to Starsky!
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Continue to Starsky
              </button>
            </div>
          )}

          {hasError && (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <div className="i-ph:warning-circle w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-monzed-elements-textPrimary mb-2">
                  Migration Failed
                </h3>
                <p className="text-monzed-elements-textSecondary text-sm mb-4">
                  {migrationState.error || 'An unexpected error occurred during migration.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleStartMigration}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Retry Migration
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Continue Locally
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
