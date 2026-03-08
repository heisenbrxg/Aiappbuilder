import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { FigmaService } from '~/lib/services/figma';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import { useAuthGuard } from '~/hooks/useAuthGuard';

interface FigmaUrlInputProps {
  onFigmaDataExtracted: (figmaData: any, enhancedPrompt: string) => void;
  originalPrompt: string;
  isVisible: boolean;
  onToggle: () => void;
}

export function FigmaUrlInput({ onFigmaDataExtracted, originalPrompt, isVisible, onToggle }: FigmaUrlInputProps) {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [figmaToken, setFigmaToken] = useState('');
  const { requireAuth, isAuthenticated } = useAuthGuard();

  const handleExtractDesign = async () => {
    if (!requireAuth()) return;
    
    if (!figmaUrl.trim()) {
      toast.error('Please enter a Figma URL');
      return;
    }

    if (!figmaToken.trim()) {
      toast.error('Please enter your Figma access token');
      return;
    }

    if (!FigmaService.isValidFigmaUrl(figmaUrl)) {
      toast.error('Please enter a valid Figma URL');
      return;
    }

    setIsLoading(true);

    try {
      const fileId = FigmaService.extractFileId(figmaUrl);
      if (!fileId) {
        throw new Error('Could not extract file ID from URL');
      }

      const figmaData = await FigmaService.fetchFileData(fileId, figmaToken);
      const enhancedPrompt = FigmaService.generateEnhancedPrompt(originalPrompt, figmaData);

      onFigmaDataExtracted(figmaData, enhancedPrompt);
      
      toast.success(`Design extracted from "${figmaData.name}"!`);
      
      // Clear inputs after successful extraction
      setFigmaUrl('');
      onToggle(); // Close the input
    } catch (error) {
      console.error('Error extracting Figma design:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to extract design from Figma');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Figma URL Input Modal - Rendered as Portal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={onToggle}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-0 flex items-center justify-center p-4 z-50"
              >
                <div className="w-full max-w-md bg-monzed-elements-background-depth-1 border border-monzed-elements-borderColor rounded-lg shadow-2xl p-6"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <div className="i-ph:figma-logo text-purple-500 text-lg" />
                    <h3 className="text-sm font-medium text-monzed-elements-textPrimary">Import from Figma</h3>
                  </div>

                  {/* Figma URL Input */}
                  <div>
                    <label className="block text-xs text-monzed-elements-textSecondary mb-1">
                      Figma File URL
                    </label>
                    <input
                      type="url"
                      value={figmaUrl}
                      onChange={(e) => setFigmaUrl(e.target.value)}
                      placeholder="https://www.figma.com/file/..."
                      className="w-full px-3 py-2 text-sm bg-monzed-elements-background-depth-2 border border-monzed-elements-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-monzed-elements-textPrimary placeholder-monzed-elements-textTertiary"
                    />
                  </div>

                  {/* Figma Token Input */}
                  <div>
                    <label className="block text-xs text-monzed-elements-textSecondary mb-1">
                      Figma Access Token
                      <a 
                        href="https://www.figma.com/developers/api#access-tokens" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-1 text-purple-500 hover:text-purple-400"
                      >
                        (Get token)
                      </a>
                    </label>
                    <input
                      type="password"
                      value={figmaToken}
                      onChange={(e) => setFigmaToken(e.target.value)}
                      placeholder="figd_..."
                      className="w-full px-3 py-2 text-sm bg-monzed-elements-background-depth-2 border border-monzed-elements-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-monzed-elements-textPrimary placeholder-monzed-elements-textTertiary"
                    />
                  </div>

                  {/* Help Text */}
                  <div className="text-xs text-monzed-elements-textTertiary">
                    <p>This will extract colors, fonts, and components from your Figma design to enhance the AI prompt.</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleExtractDesign}
                      disabled={isLoading || !figmaUrl.trim() || !figmaToken.trim()}
                      className={classNames(
                        'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                        isLoading || !figmaUrl.trim() || !figmaToken.trim()
                          ? 'bg-monzed-elements-background-depth-2 text-monzed-elements-textTertiary cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-sm'
                      )}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Extracting...
                        </div>
                      ) : (
                        'Extract Design'
                      )}
                    </button>
                    <button
                      onClick={onToggle}
                      className="px-3 py-2 text-sm text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
