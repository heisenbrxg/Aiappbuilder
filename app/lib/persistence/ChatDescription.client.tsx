import { useStore } from '@nanostores/react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { useEffect, useState } from 'react';
import WithTooltip from '~/components/ui/Tooltip';
import { useEditChatDescription } from '~/lib/hooks';
import { description as descriptionStore } from '~/lib/persistence';

export function ChatDescription() {
  const initialDescription = useStore(descriptionStore) || '';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { editing, handleChange, handleBlur, handleSubmit, handleKeyDown, currentDescription, toggleEditMode } =
    useEditChatDescription({
      initialDescription,
      syncWithGlobalStore: true,
    });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit triggered');
    
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log('Calling handleSubmit with description:', currentDescription);
      await handleSubmit(e);
      console.log('handleSubmit completed successfully');
    } catch (error) {
      console.error('Error in handleFormSubmit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Save button clicked, triggering form submission');
    const form = (e.target as HTMLElement).closest('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    } else {
      console.error('Could not find parent form element');
      // Fallback to direct submission
      handleFormSubmit(new Event('submit') as unknown as React.FormEvent);
    }
  };

  const baseText = (currentDescription ?? initialDescription ?? '').trim();
  const displaySource = baseText.length ? baseText : 'Untitled Project';

  return (
    <div className="flex items-center">
      {editing ? (
        <form onSubmit={handleFormSubmit} className="flex items-center">
          <input
            type="text"
            className="bg-monzed-elements-background-depth-1 text-monzed-elements-textPrimary rounded px-2 mr-2 w-fit text-xs"
            autoFocus
            value={currentDescription}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ width: `${Math.max(currentDescription.length * 8, 100)}px` }}
          />
          <TooltipProvider>
            <WithTooltip tooltip="Save title">
              <div className="flex justify-between items-center p-2 rounded-md bg-monzed-elements-item-backgroundAccent">
                <button
                  type="button"
                  onClick={handleSaveButtonClick}
                  disabled={isSubmitting}
                  className={`i-ph:check-bold scale-110 ${isSubmitting ? 'opacity-50' : 'hover:text-monzed-elements-item-contentAccent'}`}
                />
              </div>
            </WithTooltip>
          </TooltipProvider>
        </form>
      ) : (
        <span className="block text-[11px] sm:text-xs font-medium monzed-text-primary">
          {displaySource}
        </span>
      )}
    </div>
  );
}
