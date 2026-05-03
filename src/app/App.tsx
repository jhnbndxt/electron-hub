import { useEffect, useMemo } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { initializeTestUsers } from "../services/seedTestUsers";
import { PublicLayout } from "./layouts/PublicLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { SuperAdminLayout } from "./layouts/SuperAdminLayout";
import { CashierLayout } from "./layouts/CashierLayout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Gallery } from "./pages/Gallery";
import { Contact } from "./pages/Contact";
import { EnrollmentInfo } from "./pages/EnrollmentInfo";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Dashboard } from "./pages/Dashboard";
import { Assessment } from "./pages/Assessment";
import { Results } from "./pages/Results";
import { EnrollmentForm } from "./pages/EnrollmentForm";
import { Profile } from "./pages/Profile";
import { EditProfile } from "./pages/EditProfile";
import { ChangePassword } from "./pages/ChangePassword";
import { MyDocuments } from "./pages/MyDocuments";
import { PaymentHistory } from "./pages/PaymentHistory";
import { Payment } from "./pages/Payment";
import { StudentAccount } from "./pages/StudentAccount";
import { PublicAssessment } from "./pages/PublicAssessment";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { PendingApplications } from "./pages/admin/PendingApplications";
import { DocumentVerification } from "./pages/admin/DocumentVerification";
import { EnrollmentManagement } from "./pages/admin/EnrollmentManagement";
import { StudentRecords } from "./pages/admin/StudentRecords";
import { StudentProfile } from "./pages/admin/StudentProfile";
import { Reports } from "./pages/admin/Reports";
import { UserManagement } from "./pages/admin/UserManagement";
import { AdminAuditLogs } from "./pages/admin/AdminAuditLogs";
import { SystemConfiguration } from "./pages/admin/SystemConfiguration";
import { IntegrationsAPIs } from "./pages/admin/IntegrationsAPIs";
import { SecurityPolicies } from "./pages/admin/SecurityPolicies";
import { Billing } from "./pages/admin/Billing";
import { SuperAdminDashboard } from "./pages/admin/SuperAdminDashboard";
import { SuperAdminAuditLogs } from "./pages/admin/SuperAdminAuditLogs";
import { CashierDashboard } from "./pages/admin/CashierDashboard";
import { CashierPaymentHistory } from "./pages/admin/CashierPaymentHistory";
import { BranchCoordinatorPayments } from "./pages/admin/BranchCoordinatorPayments";
import { AssessmentManagement } from "./pages/admin/AssessmentManagement";
import { SectionManagement } from "./pages/admin/SectionManagement";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  // Initialize test users on app load
  useEffect(() => {
    initializeTestUsers().catch(err => console.error("Failed to initialize test users:", err));
  }, []);

  // Clean up any old navigation state that might reference removed routes
  useEffect(() => {
    try {
      // Clear any cached navigation state
      sessionStorage.removeItem('lastVisitedRoute');
      
      // If user tries to navigate to removed /dashboard/strands, redirect
      if (window.location.pathname.includes('/dashboard/strands') || 
          window.location.pathname.includes('/dashboard/courses')) {
        console.log('⚠️ Redirecting from removed route:', window.location.pathname);
        window.location.replace('/dashboard');
      }
    } catch (e) {
      console.log('Navigation cleanup completed');
    }
  }, []);

  // Create router inside the component to ensure it's created after AuthProvider
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          Component: PublicLayout,
          ErrorBoundary: ErrorBoundary,
          children: [
            { index: true, Component: Home },
            { path: "about", Component: About },
            { path: "gallery", Component: Gallery },
            { path: "contact", Component: Contact },
            { path: "enrollment-info", Component: EnrollmentInfo },
            { path: "assessment", Component: PublicAssessment },
          ],
        },
        // Login and Register routes - no layout (no navbar)
        {
          path: "/login",
          Component: Login,
          ErrorBoundary: ErrorBoundary,
        },
        {
          path: "/register",
          Component: Register,
          ErrorBoundary: ErrorBoundary,
        },
        {
          path: "/forgot-password",
          Component: ForgotPassword,
          ErrorBoundary: ErrorBoundary,
        },
        {
          path: "/dashboard",
          Component: DashboardLayout,
          ErrorBoundary: ErrorBoundary,
          children: [
            { index: true, Component: Dashboard },
            { path: "assessment", Component: Assessment },
            { path: "results", Component: Results },
            { path: "enrollment", Component: EnrollmentForm },
            { path: "profile", Component: Profile },
            { path: "edit-profile", Component: EditProfile },
            { path: "change-password", Component: ChangePassword },
            { path: "my-documents", Component: MyDocuments },
            { path: "payment-history", Component: PaymentHistory },
            { path: "payment", Component: Payment },
            // Catch-all for undefined dashboard routes - redirect to dashboard home
            { path: "*", element: <Navigate to="/dashboard" replace /> },
          ],
        },
        // Student Account - standalone page without dashboard layout
        {
          path: "/dashboard/student-account",
          Component: StudentAccount,
          ErrorBoundary: ErrorBoundary,
        },
        // Registrar routes (formerly Admin)
        {
          path: "/registrar",
          Component: AdminLayout,
          ErrorBoundary: ErrorBoundary,
          children: [
            { index: true, Component: AdminDashboard },
            { path: "pending", Component: PendingApplications },
            { path: "enrollment", Component: EnrollmentManagement },
            { path: "students", Component: StudentRecords },
            { path: "student-profile/:id", Component: StudentProfile },
            { path: "reports", Component: Reports },
            { path: "assessment-management", Component: AssessmentManagement },
            { path: "section-management", Component: SectionManagement },
            { path: "users", Component: UserManagement },
            { path: "audit-logs", Component: AdminAuditLogs },
            { path: "system-configuration", Component: SystemConfiguration },
            { path: "integrations-apis", Component: IntegrationsAPIs },
            { path: "security-policies", Component: SecurityPolicies },
            { path: "billing", Component: Billing },
          ],
        },
        // Branch Coordinator routes (formerly Super Admin)
        {
          path: "/branchcoordinator",
          Component: SuperAdminLayout,
          ErrorBoundary: ErrorBoundary,
          children: [
            { index: true, Component: SuperAdminDashboard },
            { path: "pending", Component: PendingApplications },
            { path: "enrollment", element: <Navigate to="/branchcoordinator" replace /> },
            { path: "payments", Component: BranchCoordinatorPayments },
            { path: "students", Component: StudentRecords },
            { path: "student-profile/:id", Component: StudentProfile },
            { path: "assessment-management", Component: AssessmentManagement },
            { path: "section-management", Component: SectionManagement },
            { path: "system-configuration", Component: SystemConfiguration },
            { path: "system-config", element: <Navigate to="/branchcoordinator/system-configuration" replace /> },
            { path: "integrations", Component: IntegrationsAPIs },
            { path: "security", Component: SecurityPolicies },
            { path: "billing", Component: Billing },
            { path: "users", Component: UserManagement },
            { path: "audit-logs", Component: SuperAdminAuditLogs },
          ],
        },
        // Cashier routes (new)
        {
          path: "/cashier",
          Component: CashierLayout,
          ErrorBoundary: ErrorBoundary,
          children: [
            { index: true, Component: CashierDashboard },
            { path: "history", Component: CashierPaymentHistory },
          ],
        },
        // Legacy admin/superadmin redirects
        {
          path: "/admin",
          element: <Navigate to="/registrar" replace />,
        },
        {
          path: "/superadmin",
          element: <Navigate to="/branchcoordinator" replace />,
        },
      ]),
    []
  );

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}