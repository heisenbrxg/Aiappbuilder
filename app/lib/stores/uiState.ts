import { map, computed } from 'nanostores';
import { chatStore } from './chat';
// Note: workbenchStore import is avoided here to prevent circular dependency

/**
 * Single source of truth for "Workbench / Chat Active" state
 * 
 * This store provides a centralized way to track UI state across the application,
 * specifically for managing the visibility and interaction states of chat and workbench components.
 */
export const uiStateStore = map({
  /**
   * True as soon as a chat/project is created
   * This should be set to true when the user creates a new chat or project
   */
  isInChat: false,

  /**
   * Mirrors workbenchStore.showWorkbench
   * This provides a centralized way to track workbench visibility
   */
  showWorkbench: false,
});

/**
 * Convenient selectors (computed stores) for header usage
 */

/**
 * Computed store that returns true if the user is currently in an active chat session
 */
export const isInChatSelector = computed([uiStateStore, chatStore], (uiState, chat) => {
  return uiState.isInChat || chat.started;
});

/**
 * Computed store that returns true if the workbench should be shown
 * Note: This now only uses the UI state store to avoid circular dependency
 */
export const showWorkbenchSelector = computed([uiStateStore], (uiState) => {
  return uiState.showWorkbench;
});

/**
 * Computed store that combines chat and workbench states for header logic
 */
export const headerStateSelector = computed([isInChatSelector, showWorkbenchSelector], (isInChat, showWorkbench) => {
  return {
    isInChat,
    showWorkbench,
    showChatInterface: isInChat || showWorkbench,
  };
});

/**
 * Utility functions to update UI state
 */

/**
 * Set the chat active state
 * Call this when a chat/project is created
 */
export function setIsInChat(value: boolean) {
  uiStateStore.setKey('isInChat', value);
}

/**
 * Set the workbench visibility state
 * Call this when the workbench drawer is toggled
 */
export function setShowWorkbench(value: boolean) {
  uiStateStore.setKey('showWorkbench', value);
}

/**
 * Sync workbench state with the main workbench store
 * This should be called whenever workbenchStore.showWorkbench changes
 * @param showValue - The current value from workbenchStore.showWorkbench
 */
export function syncWorkbenchState(showValue?: boolean) {
  // If showValue is provided, use it. Otherwise, attempt to get from workbenchStore
  if (typeof showValue === 'boolean') {
    setShowWorkbench(showValue);
  } else if (typeof window !== 'undefined') {
    // Only try to access workbenchStore on client side to avoid SSR issues
    import('./workbench')
      .then(({ workbenchStore }) => {
        const workbenchShowValue = workbenchStore.showWorkbench.get();
        setShowWorkbench(workbenchShowValue);
      })
      .catch((error) => {
        // Ignore errors during import - workbench might not be available yet
        console.debug('Could not sync workbench state:', error);
      });
  }
}

/**
 * Reset all UI state (useful for cleanup)
 */
export function resetUIState() {
  uiStateStore.set({
    isInChat: false,
    showWorkbench: false,
  });
}
