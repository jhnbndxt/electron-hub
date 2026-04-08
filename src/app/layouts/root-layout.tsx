import { Outlet, Link, useLocation } from "react-router";
import { GraduationCap } from "lucide-react";
import { ChatAssistant } from "../components/chat-assistant";

export function RootLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-[#1E3A8A] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-white" />
              <div>
                <div className="text-lg">Electron Hub</div>
                <div className="text-xs text-blue-200">
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
                  to="/about"
                  className="block text-sm text-blue-200 hover:text-white"
                >
                  About Us
                </Link>
                <Link
                  to="/enrollment"
                  className="block text-sm text-blue-200 hover:text-white"
                >
                  Enrollment
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
