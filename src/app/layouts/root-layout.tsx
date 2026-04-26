import { Outlet, Link, useLocation } from "react-router";
import { GraduationCap, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatAssistant } from "../components/chat-assistant";

export function RootLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
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

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-[#1E3A8A] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <GraduationCap className="h-8 w-8 text-white" />
              <div className="min-w-0">
                <div className="truncate text-lg">Electron Hub</div>
                <div className="truncate text-xs text-blue-200">
                  Electron College of Technological Education
                </div>
              </div>
            </Link>

            {/* Menu */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`hover:text-blue-200 transition-colors ${
                  isActive("/") ? "text-white border-b-2 border-[#B91C1C]" : ""
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`hover:text-blue-200 transition-colors ${
                  isActive("/about")
                    ? "text-white border-b-2 border-[#B91C1C]"
                    : ""
                }`}
              >
                About
              </Link>
              <Link
                to="/gallery"
                className={`hover:text-blue-200 transition-colors ${
                  isActive("/gallery")
                    ? "text-white border-b-2 border-[#B91C1C]"
                    : ""
                }`}
              >
                Gallery
              </Link>
              <Link
                to="/enrollment"
                className={`hover:text-blue-200 transition-colors ${
                  isActive("/enrollment")
                    ? "text-white border-b-2 border-[#B91C1C]"
                    : ""
                }`}
              >
                Enrollment
              </Link>
              <Link
                to="/contact"
                className={`hover:text-blue-200 transition-colors ${
                  isActive("/contact")
                    ? "text-white border-b-2 border-[#B91C1C]"
                    : ""
                }`}
              >
                Contact
              </Link>
              <Link
                to="/login"
                className="bg-[#B91C1C] hover:bg-[#991B1B] px-4 py-2 rounded transition-colors"
              >
                Login
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg border border-white/20 p-2 text-white transition-colors hover:bg-white/10 md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div
          className={`fixed inset-0 z-50 md:hidden ${
            isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <div
            className={`absolute inset-0 bg-slate-950/50 transition-opacity duration-300 ${
              isMobileMenuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className={`absolute right-0 top-0 h-full w-80 max-w-[88vw] overflow-y-auto bg-[#102A6B] p-5 shadow-2xl transition-transform duration-300 ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">Electron Hub</p>
                <p className="text-xs text-blue-200">Electron College Navigation</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg border border-white/20 p-2 text-white transition-colors hover:bg-white/10"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                to="/"
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive("/") ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10"
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive("/about") ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10"
                }`}
              >
                About
              </Link>
              <Link
                to="/gallery"
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive("/gallery") ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10"
                }`}
              >
                Gallery
              </Link>
              <Link
                to="/enrollment"
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive("/enrollment") ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10"
                }`}
              >
                Enrollment
              </Link>
              <Link
                to="/contact"
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive("/contact") ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10"
                }`}
              >
                Contact
              </Link>
            </div>

            <div className="mt-6 border-t border-white/15 pt-6">
              <Link
                to="/login"
                className="block rounded-xl bg-[#B91C1C] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#991B1B]"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#1E3A8A] text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg mb-4">Electron College</h3>
              <p className="text-sm text-blue-200">
                Electron College of Technological Education (Malanday)
              </p>
              <p className="text-sm text-blue-200 mt-2">
                Excellence in Technical Education
              </p>
            </div>
            <div>
              <h3 className="text-lg mb-4">Contact Information</h3>
              <p className="text-sm text-blue-200">
                Address: Malanday, Valenzuela City
              </p>
              <p className="text-sm text-blue-200">Email: info@electroncollege.edu.ph</p>
              <p className="text-sm text-blue-200">Phone: (02) 1234-5678</p>
            </div>
            <div>
              <h3 className="text-lg mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  to="/"
                  className="block text-sm text-blue-200 hover:text-white"
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className="block text-sm text-blue-200 hover:text-white"
                >
                  About Us
                </Link>
                <Link
                  to="/gallery"
                  className="block text-sm text-blue-200 hover:text-white"
                >
                  Gallery
                </Link>
                <Link
                  to="/enrollment-info"
                  className="block text-sm text-blue-200 hover:text-white"
                >
                  Enrollment
                </Link>
                <Link
                  to="/assessment"
                  className="block text-sm text-blue-200 hover:text-white"
                >
                  Assessment
                </Link>
                <Link
                  to="/contact"
                  className="block text-sm text-blue-200 hover:text-white"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-700 mt-8 pt-8 text-center text-sm text-blue-200">
            © 2026 Electron College of Technological Education. All rights
            reserved.
          </div>
        </div>
      </footer>

      {/* Global Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}
