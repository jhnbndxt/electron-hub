import { AlertTriangle } from "lucide-react";

interface MaintenanceNoticeProps {
  message?: string;
  countdown?: number | null;
  showButton?: boolean;
  onButtonClick?: () => void;
}

export function MaintenanceNotice({ 
  message = "The student portal is currently under maintenance. Please try again later.",
  countdown = null,
  showButton = false,
  onButtonClick,
}: MaintenanceNoticeProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl w-full">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 sm:p-12 text-center shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 p-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-red-900 mb-4">
            System Maintenance
          </h1>
          
          <p className="text-base sm:text-lg text-red-800 mb-8 leading-relaxed max-w-xl mx-auto">
            {message}
          </p>

          <div className="border-t border-red-200 pt-6 mt-6">
            <p className="text-sm text-red-700">
              Admin and staff accounts remain accessible during maintenance.
            </p>
            {countdown !== null && (
              <p className="mt-3 text-sm text-red-700">
                You will be logged out in {countdown} second{countdown === 1 ? '' : 's'}.
              </p>
            )}
          </div>

          {showButton && (
            <div className="mt-8">
              <button
                onClick={onButtonClick ?? (() => window.location.href = "/")}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                Return to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
