import { motion } from 'framer-motion';
import React, { Suspense, useState } from 'react';
import { classNames } from '~/utils/classNames';
import ConnectionDiagnostics from './ConnectionDiagnostics';
import { Button } from '~/components/ui/Button';
import VercelConnection from './VercelConnection';

// Use React.lazy for dynamic imports
const GitHubConnection = React.lazy(() => import('./GithubConnection'));
const NetlifyConnection = React.lazy(() => import('./NetlifyConnection'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="p-4 bg-monzed-elements-background-depth-1 dark:bg-monzed-elements-background-depth-1 rounded-lg border border-monzed-elements-borderColor dark:border-monzed-elements-borderColor">
    <div className="flex items-center justify-center gap-2 text-monzed-elements-textSecondary dark:text-monzed-elements-textSecondary">
      <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
      <span>Loading connection...</span>
    </div>
  </div>
);

export default function ConnectionsTab() {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <div className="space-y-8">
      {/* Modern Header with gradient background */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-red-500/5 via-red-600/5 to-red-700/5 dark:from-red-500/10 dark:via-red-600/10 dark:to-red-700/10 rounded-xl border border-red-500/20 dark:border-red-500/30 p-4 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 dark:bg-red-500/20 rounded-lg flex-shrink-0">
                <div className="i-ph:plugs-connected w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-monzed-elements-textPrimary dark:text-monzed-elements-textPrimary">
                  Connection Settings
                </h2>
                <p className="text-xs sm:text-sm text-monzed-elements-textSecondary dark:text-monzed-elements-textSecondary mt-1">
                  Connect your accounts to deploy and manage projects
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              variant="outline"
              className="flex items-center gap-2 text-xs sm:text-sm px-3 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500/50 transition-all duration-200 w-full sm:w-auto"
            >
              {showDiagnostics ? (
                <>
                  <div className="i-ph:eye-slash w-4 h-4" />
                  Hide Diagnostics
                </>
              ) : (
                <>
                  <div className="i-ph:wrench w-4 h-4" />
                  Troubleshoot
                </>
              )}
            </Button>
          </div>
        </div>
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-600/20 to-transparent rounded-full blur-xl" />
        </div>
      </motion.div>

      {/* Diagnostics Tool - Conditionally rendered */}
      {showDiagnostics && <ConnectionDiagnostics />}



      {/* Connection Cards with improved spacing */}
      <motion.div 
        className="grid grid-cols-1 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, staggerChildren: 0.1 }}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Suspense fallback={<LoadingFallback />}>
            <GitHubConnection />
          </Suspense>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Suspense fallback={<LoadingFallback />}>
            <NetlifyConnection />
          </Suspense>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Suspense fallback={<LoadingFallback />}>
            <VercelConnection />
          </Suspense>
        </motion.div>
      </motion.div>

      {/* Enhanced help section */}
      <motion.div 
        className="bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-4 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex-shrink-0">
            <span className="i-ph:lightbulb w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-monzed-elements-textPrimary dark:text-monzed-elements-textPrimary mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-monzed-elements-textSecondary dark:text-monzed-elements-textSecondary mb-3">
              Having trouble with connections? Use the troubleshooting tool above or follow these steps:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-monzed-elements-textSecondary dark:text-monzed-elements-textSecondary">
                  <span className="i-ph:browser w-4 h-4 text-orange-500" />
                  <span>Check browser console for errors</span>
                </div>
                <div className="flex items-center gap-2 text-monzed-elements-textSecondary dark:text-monzed-elements-textSecondary">
                  <span className="i-ph:key w-4 h-4 text-green-500" />
                  <span>Verify token permissions</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-monzed-elements-textSecondary dark:text-monzed-elements-textSecondary">
                  <span className="i-ph:trash w-4 h-4 text-red-500" />
                  <span>Clear browser cache & cookies</span>
                </div>
                <div className="flex items-center gap-2 text-monzed-elements-textSecondary dark:text-monzed-elements-textSecondary">
                  <span className="i-ph:cookie w-4 h-4 text-purple-500" />
                  <span>Allow third-party cookies</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
