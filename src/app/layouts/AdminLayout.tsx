import { LayoutDashboard, FileText, Users, GraduationCap } from "lucide-react";
import { PortalShell, type PortalNavItem } from "../components/PortalShell";

export function AdminLayout() {
  const navItems: PortalNavItem[] = [
    { path: "/registrar", label: "Overview", icon: LayoutDashboard, exact: true },
    { path: "/registrar/pending", label: "Pending Applications", icon: FileText },
    { path: "/registrar/students", label: "Student Records", icon: Users },
    { path: "/registrar/assessment-management", label: "Assessment Management", icon: GraduationCap },
  ];

  return (
    <PortalShell
      portalSubtitle="Registrar Portal"
      userFallbackName="Registrar"
      roleBadgeLabel="REGISTRAR"
      roleBadgeBackgroundColor="#1E3A8A"
      navItems={navItems}
    />
  );
}
