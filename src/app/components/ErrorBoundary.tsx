import { useRouteError, useNavigate } from "react-router";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

export function ErrorBoundary() {
  const error = useRouteError() as any;
  const navigate = useNavigate();
  const isDevelopment = process.env.NODE_ENV === "development";
  const userMessage = error?.status === 404
    ? "The page you're looking for doesn't exist."
    : "The page could not be loaded. Please go back or return to your dashboard.";

  console.error("Route error:", error);

  return (
    <div className="portal-glass-shell flex min-h-screen items-center justify-center px-4 py-8">
      <div className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-white/65 bg-white/82 p-8 text-center shadow-[0_24px_70px_-36px_rgba(15,23,42,0.42)] backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        
        <h1 className="mb-3 text-2xl font-bold text-slate-950">
          Something went wrong
        </h1>
        
        <p className="mb-6 text-sm leading-6 text-slate-600">
          {userMessage}
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex min-h-11 items-center gap-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          
          <Button
            onClick={() => navigate("/dashboard")}
            className="flex min-h-11 items-center gap-2 rounded-xl"
            style={{ 
              backgroundColor: "var(--electron-blue)",
              color: "white"
            }}
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>

        {isDevelopment && (error?.stack || error?.message) && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {error?.stack || error?.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
