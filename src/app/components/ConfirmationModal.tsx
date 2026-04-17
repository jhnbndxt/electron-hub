import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, CheckCircle, Info, ShieldAlert, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  icon?: React.ReactNode;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  icon,
}: ConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsConfirming(false);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isConfirming) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isConfirming, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          badge: "Destructive action",
          panel: "from-red-50 via-white to-red-100/70",
          iconWrap: "border-red-200 bg-red-100/90 text-red-700 shadow-red-100",
          messageBox: "border-red-100 bg-red-50/80 text-red-900",
          titleColor: "text-slate-950",
          confirmClassName: "bg-red-700 text-white shadow-lg shadow-red-200 hover:bg-red-800 focus-visible:ring-red-300",
          cancelClassName: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          defaultIcon: <ShieldAlert className="h-7 w-7" />,
        };
      case "warning":
        return {
          badge: "Please review",
          panel: "from-amber-50 via-white to-orange-100/70",
          iconWrap: "border-amber-200 bg-amber-100/90 text-amber-700 shadow-amber-100",
          messageBox: "border-amber-100 bg-amber-50/80 text-amber-950",
          titleColor: "text-slate-950",
          confirmClassName: "bg-amber-500 text-slate-950 shadow-lg shadow-amber-200 hover:bg-amber-400 focus-visible:ring-amber-300",
          cancelClassName: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          defaultIcon: <AlertTriangle className="h-7 w-7" />,
        };
      case "success":
        return {
          badge: "Ready to continue",
          panel: "from-emerald-50 via-white to-emerald-100/70",
          iconWrap: "border-emerald-200 bg-emerald-100/90 text-emerald-700 shadow-emerald-100",
          messageBox: "border-emerald-100 bg-emerald-50/80 text-emerald-950",
          titleColor: "text-slate-950",
          confirmClassName: "bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 focus-visible:ring-emerald-300",
          cancelClassName: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          defaultIcon: <CheckCircle className="h-7 w-7" />,
        };
      default:
        return {
          badge: "Confirmation required",
          panel: "from-blue-50 via-white to-sky-100/70",
          iconWrap: "border-blue-200 bg-blue-100/90 text-blue-700 shadow-blue-100",
          messageBox: "border-blue-100 bg-blue-50/80 text-blue-950",
          titleColor: "text-slate-950",
          confirmClassName: "bg-blue-900 text-white shadow-lg shadow-blue-200 hover:bg-blue-800 focus-visible:ring-blue-300",
          cancelClassName: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          defaultIcon: <Info className="h-7 w-7" />,
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = async () => {
    if (isConfirming) {
      return;
    }

    try {
      setIsConfirming(true);
      await onConfirm();
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{
              background:
                "radial-gradient(circle at top, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.62))",
              backdropFilter: "blur(10px)",
            }}
            onClick={() => {
              if (!isConfirming) {
                onClose();
              }
            }}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirmation-modal-title"
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${styles.panel}`} />

              <button
                onClick={onClose}
                disabled={isConfirming}
                className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white/90 text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close confirmation dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className={`bg-gradient-to-br ${styles.panel} px-6 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8`}>
                <div className="mb-5 inline-flex rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                  {styles.badge}
                </div>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border shadow-lg ${styles.iconWrap}`}
                  >
                    {icon || styles.defaultIcon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      id="confirmation-modal-title"
                      className={`pr-10 text-2xl font-semibold tracking-tight ${styles.titleColor}`}
                    >
                      {title}
                    </h3>

                    {message && (
                      <div className={`mt-4 rounded-2xl border px-4 py-3.5 text-left text-sm leading-6 ${styles.messageBox}`}>
                        {message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 px-6 py-6 sm:flex-row sm:justify-end sm:px-8 sm:py-7">
                <button
                  onClick={onClose}
                  disabled={isConfirming}
                  className={`inline-flex min-h-12 items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-32 ${styles.cancelClassName}`}
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-40 ${styles.confirmClassName}`}
                >
                  {isConfirming ? "Processing..." : confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
