import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";

interface ActionButtonState {
  isProcessing: boolean;
  isConfirming: boolean;
  isDisabled: boolean;
}

interface UseActionHandlerOptions {
  actionName: string;
  requiresConfirmation?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  processingMessage?: string;
  successMessage?: string;
  onSuccess?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing action handlers with confirmation and processing states
 * Prevents spam clicking by disabling the button during processing
 */
export function useActionHandler(options: UseActionHandlerOptions) {
  const {
    actionName,
    requiresConfirmation = false,
    confirmTitle = "Confirm Action",
    confirmMessage = "Are you sure you want to proceed?",
    processingMessage = `Processing ${actionName.toLowerCase()}...`,
    successMessage = `${actionName} completed successfully`,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<ActionButtonState>({
    isProcessing: false,
    isConfirming: false,
    isDisabled: false,
  });

  const pendingActionRef = useRef<(() => Promise<any>) | null>(null);

  // Show confirmation modal
  const requestConfirmation = useCallback((action: () => Promise<any>) => {
    pendingActionRef.current = action;
    setState((prev) => ({ ...prev, isConfirming: true }));
  }, []);

  // Execute action after confirmation
  const confirmAndExecute = useCallback(async () => {
    if (!pendingActionRef.current) return;

    setState((prev) => ({
      ...prev,
      isConfirming: false,
      isProcessing: true,
      isDisabled: true,
    }));

    try {
      await pendingActionRef.current();
      toast.success(successMessage);
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(err.message);
      onError?.(err);
    } finally {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        isDisabled: false,
      }));
      pendingActionRef.current = null;
    }
  }, [successMessage, onSuccess, onError]);

  // Cancel action
  const cancel = useCallback(() => {
    setState((prev) => ({ ...prev, isConfirming: false }));
    pendingActionRef.current = null;
  }, []);

  // Main action handler
  const handleAction = useCallback(
    async (action: () => Promise<any>) => {
      if (state.isProcessing || state.isDisabled) return;

      if (requiresConfirmation) {
        requestConfirmation(action);
      } else {
        setState((prev) => ({
          ...prev,
          isProcessing: true,
          isDisabled: true,
        }));

        try {
          await action();
          toast.success(successMessage);
          onSuccess?.();
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          toast.error(err.message);
          onError?.(err);
        } finally {
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            isDisabled: false,
          }));
        }
      }
    },
    [state.isProcessing, state.isDisabled, requiresConfirmation, successMessage, onSuccess, onError, requestConfirmation]
  );

  return {
    ...state,
    handleAction,
    confirmAndExecute,
    cancel,
    confirmTitle,
    confirmMessage,
    processingMessage,
    requestConfirmation,
  };
}
