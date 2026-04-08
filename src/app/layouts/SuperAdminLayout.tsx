import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  FileCheck,
  UserCheck,
  Users,
  Settings,
  Key,
  Shield,
  CreditCard,
  LogOut,
  ScrollText,
  UserCog,
  ArrowLeft,
  GraduationCap,
  Grid3x3,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
const logo = "";

export function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = [
    { path: "/branchcoordinator", label: "Overview", icon: LayoutDashboard, exact: true },
    { path: "/branchcoordinator/pending", label: "Pending Applications", icon: FileText },
    { path: "/branchcoordinator/enrollment", label: "Enrollment Management", icon: UserCheck },
    { path: "/branchcoordinator/students", label: "Student Records", icon: Users },
    { path: "/branchcoordinator/section-management", label: "Section Management", icon: Grid3x3 },
    { path: "/branchcoordinator/assessment-management", label: "Assessment Management", icon: GraduationCap },
    { path: "/branchcoordinator/users", label: "User Management", icon: UserCog },
    { path: "/branchcoordinator/audit-logs", label: "Audit Logs", icon: ClipboardCheck },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Sidebar with Blue Theme */}
      <aside
        className="w-64 border-r border-gray-200 flex flex-col fixed h-full"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        {/* Logo Section - Blue */}
        <div
          className="p-6 border-b border-gray-200"
          style={{ backgroundColor: "#1E3A8A" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Electron Hub</h1>
              <p className="text-blue-200 text-xs">Branch Coordinator Portal</p>
            </div>
          </div>
        </div>

        {/* User Info Badge */}
        <div className="p-4 border-b border-gray-200">
          <div
            className="px-3 py-2 rounded-lg"
            style={{ backgroundColor: "#DBEAFE" }}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold" style={{ color: "#1E3A8A" }}>
                {userData?.name || "Branch Coordinator"}
              </p>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: "#7C3AED", color: "#FFFFFF" }}
              >
                COORDINATOR
              </span>
            </div>
            <p className="text-xs text-gray-600">{userData?.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? "text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={
                      active
                        ? { backgroundColor: "#1E3A8A" }
                        : {}
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to Home - Above Logout */}
        <div className="p-4 border-t border-gray-200">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all mb-2"
            preventScrollReset={false}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back to Home</span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content - with left margin to account for fixed sidebar */}
      <main className="flex-1 overflow-y-auto ml-64">
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="bg-white w-full max-w-sm"
            style={{
              borderRadius: "12px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Question */}
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900">
                Log out of Electron Hub?
              </h3>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-4 rounded-xl font-semibold transition-all"
                style={{
                  backgroundColor: "#E5E7EB",
                  color: "#374151",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#D1D5DB")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#E5E7EB")
                }
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-4 rounded-xl text-white font-semibold transition-all"
                style={{ backgroundColor: "#1E3A8A" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1E40AF")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1E3A8A")
                }
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