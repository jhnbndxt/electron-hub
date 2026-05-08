import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  subtext?: string;
  className?: string;
  compact?: boolean;
}

export function LoadingState({
  message = "Loading dashboard data...",
  subtext = "Please wait while we prepare the latest information.",
  className = "",
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      className={`flex w-full items-center justify-center px-4 text-center ${compact ? "min-h-40 py-8" : "min-h-[55vh] py-12"} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="animate-in fade-in zoom-in-95 duration-500">
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/70 bg-white/80 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.5)] backdrop-blur-xl">
          <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-blue-50 to-red-50" />
          <LoaderCircle className="relative h-9 w-9 animate-spin text-blue-900" strokeWidth={2.4} />
        </div>
        <p className="text-base font-bold text-slate-950">{message}</p>
        {subtext && (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{subtext}</p>
        )}
      </div>
    </div>
  );
}
