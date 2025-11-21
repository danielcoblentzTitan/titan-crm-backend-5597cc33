import { useEffect } from 'react';

interface UseUnsavedChangesProps {
  hasUnsavedChanges: boolean;
  onShowExitConfirmation: () => void;
}

export const useUnsavedChanges = ({ hasUnsavedChanges, onShowExitConfirmation }: UseUnsavedChangesProps) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    let hasBlockedNavigation = false;
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges && !hasBlockedNavigation) {
        e.preventDefault();
        hasBlockedNavigation = true;
        onShowExitConfirmation();
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
        // Reset the flag after a short delay
        setTimeout(() => {
          hasBlockedNavigation = false;
        }, 100);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, onShowExitConfirmation]);
};