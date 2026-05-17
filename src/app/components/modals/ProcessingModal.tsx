import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ProcessingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  description?: string;
}

export function ProcessingModal({
  isOpen,
  title = "Processing Request",
  message = "Please wait while we process your request...",
  description,
}: ProcessingModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-y-0 right-0 left-0 z-[100] bg-black/45 backdrop-blur-sm lg:left-[var(--dashboard-sidebar-offset,0px)]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 left-0 z-[101] flex items-center justify-center p-4 lg:left-[var(--dashboard-sidebar-offset,0px)]"
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            aria-labelledby="processing-modal-title"
          >
            <div className="relative max-w-sm w-full rounded-2xl border border-white/40 bg-white/95 shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none" />

              {/* Content */}
              <div className="relative px-8 py-8 sm:py-10 flex flex-col items-center text-center">
                {/* Animated loader */}
                <motion.div
                  className="mb-6"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <div className="relative h-16 w-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-20 blur-lg" />
                    <div className="relative rounded-full border-4 border-slate-200 border-t-blue-600 h-14 w-14" />
                  </div>
                </motion.div>

                {/* Title */}
                <h3 id="processing-modal-title" className="text-lg font-semibold text-slate-950 mb-2">
                  {title}
                </h3>

                {/* Message */}
                <p className="text-sm text-slate-600 mb-1">
                  {message}
                </p>

                {/* Description */}
                {description && (
                  <p className="text-xs text-slate-500 mt-3">
                    {description}
                  </p>
                )}

                {/* Status indicator */}
                <motion.div
                  className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-medium text-blue-700">Processing...</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
