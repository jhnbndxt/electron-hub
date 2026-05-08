import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      aria-busy="true"
      data-slot="skeleton"
      className={cn(
        "bg-slate-200/70 animate-pulse rounded-md dark:bg-slate-700/70",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
