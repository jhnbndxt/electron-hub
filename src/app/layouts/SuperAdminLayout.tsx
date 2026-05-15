import {
  LayoutDashboard,
  FileText,
  Users,
  UserCog,
  GraduationCap,
  Grid3x3,
  ClipboardCheck,
  Settings,
  Banknote,
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "../components/PortalShell";

export function SuperAdminLayout() {
  const navItems: PortalNavItem[] = [
    { path: "/branchcoordinator", label: "Overview", icon: LayoutDashboard, exact: true },
    { path: "/branchcoordinator/pending", label: "Pending Applications", icon: FileText },
    { path: "/branchcoordinator/cashier-dashboard", label: "Payment Queue", icon: Banknote },
    { path: "/branchcoordinator/payments", label: "Payment Management", icon: Banknote },
    { path: "/branchcoordinator/section-management", label: "Section Management", icon: Grid3x3 },
    { path: "/branchcoordinator/assessment-management", label: "Assessment Management", icon: GraduationCap },
    { path: "/branchcoordinator/students", label: "Student Records", icon: Users },
    { path: "/branchcoordinator/users", label: "User Management", icon: UserCog },
    { path: "/branchcoordinator/audit-logs", label: "Audit Logs", icon: ClipboardCheck },
    { path: "/branchcoordinator/system-configuration", label: "System Configuration", icon: Settings },
  ];

  return (
    <PortalShell
      portalSubtitle="Branch Coordinator Portal"
      userFallbackName="Branch Coordinator"
      roleBadgeLabel="COORDINATOR"
      roleBadgeBackgroundColor="#7C3AED"
      navItems={navItems}
    />
  );
}
