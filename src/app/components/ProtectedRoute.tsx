import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

interface ProtectedLayoutProps {
  LayoutComponent: React.ComponentType<any>;
  allowedRoles: Array<"registrar" | "branchcoordinator" | "cashier">;
}

export function ProtectedLayout({ LayoutComponent, allowedRoles }: ProtectedLayoutProps) {
  const { userRole, isAdminAuthenticated } = useAuth();

  // If user is not authenticated as an admin, redirect to login
  if (!isAdminAuthenticated || !userRole) {
    return <Navigate to="/login" replace />;
  }

  // If user's role is not in the allowed roles, redirect to home
  if (!allowedRoles.includes(userRole as any)) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has the correct role - render the layout
  return <LayoutComponent />;
}
