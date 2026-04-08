import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          defaultIcon: <XCircle className="w-12 h-12" />,
          confirmBg: "#B91C1C",
          confirmHoverBg: "#991B1B",
        };
      case "warning":
        return {
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          defaultIcon: <AlertTriangle className="w-12 h-12" />,
          confirmBg: "#F59E0B",
          confirmHoverBg: "#D97706",
        };
      case "success":
        return {
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          defaultIcon: <CheckCircle className="w-12 h-12" />,
          confirmBg: "#10B981",
          confirmHoverBg: "#059669",
        };
      default:
        return {
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          defaultIcon: <Info className="w-12 h-12" />,
          confirmBg: "#1E3A8A",
          confirmHoverBg: "#1E40AF",
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="p-8 text-center">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${styles.iconBg} ${styles.iconColor}`}
                  >
                    {icon || styles.defaultIcon}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {title}
                </h3>

                {/* Message */}
                {message && (
                  <p className="text-gray-600 leading-relaxed">
                    {message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-8 pb-8 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl font-semibold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3.5 rounded-xl text-white font-semibold transition-all"
                  style={{ backgroundColor: styles.confirmBg }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = styles.confirmHoverBg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = styles.confirmBg)
                  }
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
