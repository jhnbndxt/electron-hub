import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  ArrowLeft, 
  User, 
  Edit3, 
  Lock, 
  FileText, 
  CreditCard, 
  LogOut,
  ChevronRight,
  RotateCcw 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ChatAssistant } from "../components/ChatAssistant";

export function StudentAccount() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const navigate = useNavigate();
  const { userData, logout, resetEnrollmentProgress } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleResetProgress = () => {
    resetEnrollmentProgress();
    setShowResetModal(false);
  };

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "View Profile",
          path: "/dashboard/profile",
        },
        {
          icon: Edit3,
          label: "Edit Profile",
          path: "/dashboard/edit-profile",
        },
        {
          icon: Lock,
          label: "Change Password",
          path: "/dashboard/change-password",
        },
      ],
    },
    {
      title: "Enrollment",
      items: [
        {
          icon: FileText,
          label: "My Documents",
          path: "/dashboard/my-documents",
        },
        {
          icon: CreditCard,
          label: "Payment History",
          path: "/dashboard/payment-history",
        },
        {
          icon: RotateCcw,
          label: "Reset Enrollment Progress",
          action: () => setShowResetModal(true),
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          icon: LogOut,
          label: "Logout",
          action: () => setShowLogoutModal(true),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: "#1E3A8A", borderColor: "#1E40AF" }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Identity Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "#1E3A8A" }}
            >
              {userData?.name?.charAt(0) || "S"}
            </div>

            {/* Student Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {userData?.name || "Student"}
              </h1>
              <div className="space-y-0.5">
                <p className="text-sm text-gray-500">
                  Student ID: <span className="font-medium text-gray-700">2026-0001</span>
                </p>
                <p className="text-sm text-gray-500">
                  Course: <span className="font-medium text-gray-700">BS Information Technology</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-4">
            {/* Section Title */}
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
              {section.title}
            </h2>

            {/* Menu Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                const isLast = itemIndex === section.items.length - 1;

                if (item.action) {
                  // Action buttons (Logout or Reset)
                  const isLogout = item.label === "Logout";
                  return (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <IconComponent 
                        className="w-5 h-5 flex-shrink-0" 
                        style={{ color: isLogout ? "#B91C1C" : "#1E3A8A" }}
                      />
                      <span className="flex-1 text-left font-medium text-gray-700">
                        {item.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </button>
                  );
                }

                // Regular menu item
                return (
                  <div key={item.label}>
                    <Link
                      to={item.path || "#"}
                      className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <IconComponent 
                        className="w-5 h-5 flex-shrink-0" 
                        style={{ color: "#1E3A8A" }}
                      />
                      <span className="flex-1 font-medium text-gray-700">
                        {item.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </Link>
                    {!isLast && (
                      <div className="border-b border-gray-100 mx-4"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Logout
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 text-white rounded-md font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#B91C1C" }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Enrollment Progress Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Reset Enrollment Progress
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset your enrollment progress? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                className="flex-1 px-4 py-2.5 text-white rounded-md font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#B91C1C" }}
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}