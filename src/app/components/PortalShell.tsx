import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { ArrowLeft, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import logo from "../../assets/electronLogo";

export interface PortalNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface PortalShellProps {
  portalSubtitle: string;
  userFallbackName: string;
  roleBadgeLabel: string;
  roleBadgeBackgroundColor: string;
  navItems: PortalNavItem[];
}

export function PortalShell({
  portalSubtitle,
  userFallbackName,
  roleBadgeLabel,
  roleBadgeBackgroundColor,
  navItems,
}: PortalShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }

    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (isMobileNavOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileNavOpen]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const sidebarContent = (
    <>
      <div className="portal-glass-sidebar-brand flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
            <img src={logo} alt="Electron College Logo" className="h-7 w-7 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white">Electron Hub</h1>
            <p className="truncate text-xs text-blue-200">{portalSubtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(false)}
          className="rounded-lg p-2 text-white transition-colors hover:bg-white/12 lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-white/10 p-4">
        <div className="portal-glass-user-card rounded-xl px-3 py-3">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="truncate text-xs font-semibold text-white">
              {userData?.name || userFallbackName}
            </p>
            <span
              className="shrink-0 rounded border border-white/15 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:text-xs"
              style={{ backgroundColor: roleBadgeBackgroundColor }}
            >
              {roleBadgeLabel}
            </span>
          </div>
          <p className="truncate text-xs text-blue-100/80">{userData?.email}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-hidden p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`portal-glass-nav-link flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                    active ? "portal-glass-nav-link-active text-white" : "text-white/80 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link
          to="/"
          className="portal-glass-nav-link mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-white/80 transition-all hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="portal-glass-nav-link flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white/80 transition-all hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="portal-glass-shell min-h-screen lg:flex lg:h-screen lg:overflow-hidden">
      <div
        className={`fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileNavOpen(false)}
      />

      <aside
        className={`portal-glass-sidebar fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-hidden transition-transform duration-300 lg:hidden ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      <aside className="portal-glass-sidebar fixed inset-y-0 left-0 z-50 hidden w-64 flex-col overflow-hidden lg:flex">
        {sidebarContent}
      </aside>

      <div className="portal-glass-content flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64 lg:h-screen lg:w-[calc(100%-16rem)] lg:flex-none lg:overflow-hidden">
        <header className="portal-glass-header fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">Electron Hub</p>
            <p className="truncate text-xs text-gray-500">{portalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="portal-glass-icon-button rounded-xl p-2 text-gray-700 transition-colors hover:bg-white/70"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="portal-glass-main min-w-0 flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
          <Outlet />
        </main>
      </div>

      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="portal-glass-modal w-full max-w-sm rounded-xl">
            <div className="p-6 text-center sm:p-8">
              <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">Log out of Electron Hub?</h3>
            </div>

            <div className="flex gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl py-3 font-semibold transition-all sm:py-4"
                style={{
                  backgroundColor: "#E5E7EB",
                  color: "#374151",
                }}
              >
                No
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-xl py-3 font-semibold text-white transition-all sm:py-4"
                style={{ backgroundColor: "#1E3A8A" }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}