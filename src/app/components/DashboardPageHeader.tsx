import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardPageHeaderProps {
  badge: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  actions?: ReactNode;
}

export function DashboardPageHeader({
  badge,
  title,
  subtitle,
  icon: Icon,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <div className="mb-6 flex w-full flex-col gap-4 sm:mb-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold shadow-sm"
          style={{ color: "var(--electron-blue)" }}
        >
          <Icon className="h-4 w-4" />
          {badge}
        </div>
        <h1
          className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
          style={{ color: "var(--electron-blue)" }}
        >
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          {subtitle}
        </p>
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
