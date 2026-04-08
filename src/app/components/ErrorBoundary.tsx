import { useRouteError, useNavigate } from "react-router";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

export function ErrorBoundary() {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  console.error("Route error:", error);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        
        <h1 className="text-2xl mb-2" style={{ color: "var(--electron-blue)" }}>
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          {error?.statusText || error?.message || "An unexpected error occurred"}
        </p>

        {error?.status === 404 && (
          <p className="text-sm text-gray-500 mb-6">
            The page you're looking for doesn't exist.
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          
          <Button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
            style={{ 
              backgroundColor: "var(--electron-blue)",
              color: "white"
            }}
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && error?.stack && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}