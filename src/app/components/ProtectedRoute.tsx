import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles: Array<"registrar" | "branchcoordinator" | "cashier">;
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { userRole, isAdminAuthenticated } = useAuth();

  // If user is not authenticated as an admin, redirect to login
  if (!isAdminAuthenticated || !userRole) {
    return <Navigate to="/login" replace />;
  }

  // If user's role is not in the allowed roles, redirect to home
  if (!allowedRoles.includes(userRole as any)) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has the correct role
  return <Outlet />;
}

// Helper function to create a protected layout
export function createProtectedLayout(
  LayoutComponent: React.ComponentType<any>,
  allowedRoles: Array<"registrar" | "branchcoordinator" | "cashier">
) {
  return function ProtectedLayoutWrapper(props: any) {
    const { userRole, isAdminAuthenticated } = useAuth();

    // If user is not authenticated as an admin, redirect to login
    if (!isAdminAuthenticated || !userRole) {
      return <Navigate to="/login" replace />;
    }

    // If user's role is not in the allowed roles, redirect to home
    if (!allowedRoles.includes(userRole as any)) {
      return <Navigate to="/" replace />;
    }

    // User is authenticated and has the correct role
    return <LayoutComponent {...props} />;
  };
}

// Add useAuth import at top for createProtectedLayout
import { useAuth } from "../context/AuthContext";
