import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { ChatAssistant } from "../components/ChatAssistant";
import { ScrollToTop } from "../components/ScrollToTop";
import { LogOut, LayoutDashboard, MapPin, Phone, Mail, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import logo from "../../assets/electronLogo";

export function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, logout, userData } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

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

  const isActiveLink = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname === path;
  };

  const desktopUnderlineStyle = isAnyAdmin
    ? { backgroundColor: "rgba(255, 255, 255, 0.92)" }
    : { backgroundColor: "var(--electron-red)" };

  const mobileMenuItemVariants = {
    closed: { opacity: 0, x: 18 },
    open: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.06 + index * 0.04,
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav
        className="sticky top-0 z-40 text-white shadow-md transition-colors duration-300"
        style={{ 
          backgroundColor: isAnyAdmin ? "#B91C1C" : "var(--electron-blue)" 
        }}
      >
        <div className="w-full px-6 lg:px-12">
          <div className="flex min-h-16 items-center justify-between gap-4 py-3">
            {/* Logo */}
            <Link to="/" className="flex min-w-0 items-center gap-3 group">
              {isAnyAdmin ? (
                <>
                  <img src={logo} alt="Electron College Logo" className="w-8 h-8 object-contain flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-sm leading-tight sm:text-base">Electron College of Technical Education</span>
                    <span className="text-xs text-red-200">Malanday • {getAdminLabel()}</span>
                  </div>
                </>
              ) : (
                <>
                  <img src={logo} alt="Electron College Logo" className="w-8 h-8 object-contain flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-sm leading-tight sm:text-base">Electron College of Technical Education</span>
                    <span className="text-xs opacity-90">Malanday</span>
                  </div>
                </>
              )}
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              {isAnyAdmin ? (
                // Admin Authenticated State - Show on public pages
                <>
                  {studentNavLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`public-nav-link ${
                        isActiveLink(link.path) ? "public-nav-link-active" : "text-white/82"
                      }`}
                    >
                      {isActiveLink(link.path) ? (
                        <motion.span
                          layoutId="public-nav-underline"
                          className="public-nav-link-indicator"
                          style={desktopUnderlineStyle}
                          transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                        />
                      ) : null}
                      {link.label}
                    </Link>
                  ))}
                  {/* Separator */}
                  <span className="text-white opacity-50">|</span>
                  <Link
                    to={getDashboardPath()}
                    className="public-nav-cta flex items-center gap-2 border border-red-300/80 text-white"
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
                      className={`public-nav-link ${
                        isActiveLink(link.path) ? "public-nav-link-active" : "text-white/82"
                      }`}
                    >
                      {isActiveLink(link.path) ? (
                        <motion.span
                          layoutId="public-nav-underline"
                          className="public-nav-link-indicator"
                          style={desktopUnderlineStyle}
                          transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                        />
                      ) : null}
                      {link.label}
                    </Link>
                  ))}
                  
                  {/* Separator */}
                  <span className="text-white opacity-50">|</span>
                  
                  {/* Show Dashboard button if logged in, otherwise show Login */}
                  {userData && userRole === "student" ? (
                    <Link
                      to="/dashboard"
                      className="public-nav-cta flex items-center gap-2 text-white"
                      style={{ backgroundColor: "var(--electron-red)" }}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  ) : !userData ? (
                    <Link
                      to="/login"
                      className="public-nav-cta text-white"
                      style={{ backgroundColor: "var(--electron-red)" }}
                    >
                      Login
                    </Link>
                  ) : null}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden rounded-lg border border-white/20 p-2 text-white transition-colors hover:bg-white/10"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen ? (
            <div className="fixed inset-0 z-50 md:hidden">
              <motion.div
                className="absolute inset-0 bg-slate-950/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                className="absolute right-0 top-0 h-full w-80 max-w-[88vw] overflow-y-auto p-5 shadow-2xl"
                style={{ backgroundColor: isAnyAdmin ? "#7F1D1D" : "#102A6B" }}
                initial={{ x: "100%", opacity: 0.98 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.24 }}
                  className="mb-6 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">Electron College</p>
                    <p className="text-xs opacity-80">
                      {isAnyAdmin ? getAdminLabel() : "Online Enrollment Portal"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-lg border border-white/20 p-2 transition-colors hover:bg-white/10"
                    aria-label="Close navigation menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </motion.div>

                <div className="space-y-2">
                  {studentNavLinks.map((link, index) => (
                    <motion.div
                      key={link.path}
                      custom={index}
                      variants={mobileMenuItemVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      <Link
                        to={link.path}
                        className={`public-mobile-nav-link ${
                          isActiveLink(link.path) ? "public-mobile-nav-link-active" : "text-white/90"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="mt-6 space-y-3 border-t border-white/15 pt-6"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.28, delay: 0.12 }}
                >
                  {isAnyAdmin ? (
                    <Link
                      to={getDashboardPath()}
                      className="public-mobile-nav-link flex items-center justify-center gap-2 border border-white/25 text-white"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  ) : userData && userRole === "student" ? (
                    <Link
                      to="/dashboard"
                      className="public-mobile-nav-link flex items-center justify-center gap-2 text-white"
                      style={{ backgroundColor: "var(--electron-red)" }}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  ) : !userData ? (
                    <Link
                      to="/login"
                      className="public-mobile-nav-link block text-center text-white"
                      style={{ backgroundColor: "var(--electron-red)" }}
                    >
                      Login
                    </Link>
                  ) : null}

                  {userData ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="public-mobile-nav-link flex w-full items-center justify-center gap-2 border border-white/20 text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  ) : null}
                </motion.div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
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