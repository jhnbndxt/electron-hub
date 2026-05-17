import { useState, useCallback } from "react";
import toast from "react-hot-toast";

interface UseAsyncActionOptions {
  onSuccess?: (result?: any) => void | Promise<void>;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  confirmationTitle?: string;
  confirmationMessage?: string;
  processingTitle?: string;
  processingMessage?: string;
}

export function useAsyncAction(options: UseAsyncActionOptions = {}) {
  const {
    onSuccess,
    onError,
    successMessage = "Action completed successfully",
    errorMessage = "An error occurred. Please try again.",
    confirmationTitle = "Confirm Action",
    confirmationMessage = "Are you sure you want to proceed?",
    processingTitle = "Processing",
    processingMessage = "Please wait while we process your request...",
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => Promise<void>>();

  // Handle async action with loading state
  const executeAction = useCallback(
    async (action: () => Promise<void>) => {
      if (isLoading) return; // Prevent duplicate requests

      try {
        setIsLoading(true);
        setShowProcessing(true);
        await action();
        toast.success(successMessage);
        onSuccess?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        toast.error(err.message || errorMessage);
        onError?.(err);
      } finally {
        setIsLoading(false);
        setShowProcessing(false);
      }
    },
    [isLoading, successMessage, errorMessage, onSuccess, onError]
  );

  // Handle action with confirmation modal
  const executeWithConfirmation = useCallback(
    (action: () => Promise<void>) => {
      setPendingAction(() => action);
      setShowConfirmation(true);
    },
    []
  );

  // Confirm and execute the pending action
  const confirmAction = useCallback(async () => {
    setShowConfirmation(false);
    if (pendingAction) {
      await executeAction(pendingAction);
      setPendingAction(undefined);
    }
  }, [pendingAction, executeAction]);

  // Cancel the pending action
  const cancelAction = useCallback(() => {
    setShowConfirmation(false);
    setPendingAction(undefined);
  }, []);

  return {
    isLoading,
    showConfirmation,
    showProcessing,
    executeAction,
    executeWithConfirmation,
    confirmAction,
    cancelAction,
    setShowConfirmation,
    setShowProcessing,
    setIsLoading,
  };
}
