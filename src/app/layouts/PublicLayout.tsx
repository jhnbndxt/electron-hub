import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { ChatAssistant } from "../components/ChatAssistant";
import { ScrollToTop } from "../components/ScrollToTop";
import { Shield, LogOut, LayoutDashboard, MapPin, Phone, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
const logo = "";

export function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdminAuthenticated, userRole, logout, userData } = useAuth();

  const studentNavLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/gallery", label: "Gallery" },
    { path: "/enrollment-info", label: "Enrollment" },
    { path: "/assessment", label: "AI Assessment" },
    { path: "/contact", label: "Contact" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Get dashboard path based on role
  const getDashboardPath = () => {
    switch(userRole) {
      case "registrar":
      case "admin":
        return "/registrar";
      case "branchcoordinator":
      case "superadmin":
        return "/branchcoordinator";
      case "cashier":
        return "/cashier";
      case "student":
        return "/dashboard";
      default:
        return "/login";
    }
  };

  // Check if user is any type of admin
  const isAnyAdmin = userRole === "registrar" || userRole === "admin" || 
                     userRole === "branchcoordinator" || userRole === "superadmin" || 
                     userRole === "cashier";

  const getAdminLabel = () => {
    switch(userRole) {
      case "registrar":
      case "admin":
        return "Registrar Portal";
      case "branchcoordinator":
      case "superadmin":
        return "Branch Coordinator Portal";
      case "cashier":
        return "Cashier Portal";
      default:
        return "Admin Portal";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav
        className="text-white shadow-md transition-colors duration-300"
        style={{ 
          backgroundColor: isAnyAdmin ? "#B91C1C" : "var(--electron-blue)" 
        }}
      >
        <div className="w-full px-6 lg:px-12">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              {isAnyAdmin ? (
                <>
                  <Shield className="w-8 h-8 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-base leading-tight">Electron College of Technical Education</span>
                    <span className="text-xs text-red-200">Malanday • {getAdminLabel()}</span>
                  </div>
                </>
              ) : (
                <>
                  <img src={logo} alt="Electron College Logo" className="w-8 h-8 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-base leading-tight">Electron College of Technical Education</span>
                    <span className="text-xs opacity-90">Malanday</span>
                  </div>
                </>
              )}
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {isAnyAdmin ? (
                // Admin Authenticated State - Show on public pages
                <>
                  {studentNavLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`hover:opacity-80 transition-opacity ${
                        location.pathname === link.path ? "border-b-2 pb-1 border-white" : ""
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {/* Separator */}
                  <span className="text-white opacity-50">|</span>
                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-2 px-4 py-2 rounded-md transition-all hover:bg-red-700 border border-red-300"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </>
              ) : (
                // Default (Student/Public) State
                <>
                  {studentNavLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`hover:opacity-80 transition-opacity ${
                        location.pathname === link.path ? "border-b-2 pb-1" : ""
                      }`}
                      style={
                        location.pathname === link.path
                          ? { borderColor: "var(--electron-red)" }
                          : {}
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  {/* Separator */}
                  <span className="text-white opacity-50">|</span>
                  
                  {/* Show Dashboard button if logged in, otherwise show Login */}
                  {userData && userRole === "student" ? (
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors hover:opacity-90"
                      style={{ backgroundColor: "var(--electron-red)" }}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  ) : !userData ? (
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded-md transition-colors hover:opacity-90"
                      style={{ backgroundColor: "var(--electron-red)" }}
                    >
                      Login
                    </Link>
                  ) : null}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3">Electron College</h3>
              <p className="text-gray-300 text-sm">
                Electron College of Technological Education (Malanday)
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#1E3A8A" }} />
                  <p className="text-gray-300">
                    596 McArthur Highway, Malanday, Valenzuela City, 1444, Metro Manila
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 flex-shrink-0" style={{ color: "#1E3A8A" }} />
                  <a href="tel:09230889162" className="text-gray-300 hover:text-white transition-colors">
                    09230889162
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "#1E3A8A" }} />
                  <a href="mailto:electroncollege2002@electroncollege.edu.ph" className="text-gray-300 hover:text-white transition-colors">
                    electroncollege2002@electroncollege.edu.ph
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Quick Links</h3>
              <div className="flex flex-col gap-2 text-sm">
                <Link to="/about" className="text-gray-300 hover:text-white">
                  About Us
                </Link>
                <Link to="/enrollment-info" className="text-gray-300 hover:text-white">
                  Enrollment
                </Link>
                <Link to="/contact" className="text-gray-300 hover:text-white">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>© 2026 Electron College of Technological Education. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Global Chat Assistant */}
      <ChatAssistant />
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}