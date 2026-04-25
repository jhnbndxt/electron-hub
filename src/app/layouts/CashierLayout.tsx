import { LayoutDashboard, History, Search } from "lucide-react";
import {
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "../components/PortalShell";

export function CashierLayout() {
  const navItems: PortalNavItem[] = [
    { path: "/cashier", label: "Payment Queue", icon: LayoutDashboard, exact: true },
    { path: "/cashier/history", label: "Payment History", icon: History },
  ];

  return (
    <PortalShell
      portalSubtitle="Cashier Portal"
      userFallbackName="Cashier"
      roleBadgeLabel="CASHIER"
      roleBadgeBackgroundColor="#10B981"
      navItems={navItems}
    />
  );
}