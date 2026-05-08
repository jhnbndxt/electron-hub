import { AlertTriangle, ArrowLeft } from "lucide-react";

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
    <main className="auth-shell-bg flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative z-10 w-full max-w-[34rem] animate-in fade-in slide-in-from-bottom-3 duration-700">
        <section className="overflow-hidden rounded-[1.5rem] border border-white/65 bg-white/78 p-6 text-center shadow-[0_30px_80px_-42px_rgba(15,23,42,0.62)] backdrop-blur-2xl sm:p-8 md:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200/70 bg-gradient-to-br from-red-50 to-white shadow-[0_18px_36px_-26px_rgba(185,28,28,0.5)] sm:h-[4.5rem] sm:w-[4.5rem]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 shadow-[0_14px_24px_-18px_rgba(185,28,28,0.9)] sm:h-12 sm:w-12">
              <AlertTriangle className="h-6 w-6 text-white sm:h-7 sm:w-7" strokeWidth={2.25} />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            System Maintenance
          </h1>
          
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
            {message}
          </p>

          <div className="mt-7 rounded-2xl border border-blue-100/80 bg-blue-50/70 px-4 py-4 shadow-inner shadow-white/60">
            <p className="text-sm leading-6 text-slate-700">
              Admin and staff accounts remain accessible during maintenance.
            </p>
            {countdown !== null && (
              <p className="mt-2 text-sm font-semibold leading-6 text-red-700">
                You will be logged out in {countdown} second{countdown === 1 ? '' : 's'}.
              </p>
            )}
          </div>

          {showButton && (
            <div className="mt-7">
              <button
                onClick={onButtonClick ?? (() => window.location.href = "/")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--electron-blue)] px-6 py-3 text-base font-semibold text-white shadow-[0_18px_34px_-22px_rgba(30,58,138,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-[0_22px_42px_-24px_rgba(30,58,138,0.95)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Home
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
