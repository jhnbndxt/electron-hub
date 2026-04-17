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
import { ConfirmationModal } from "../components/ConfirmationModal";

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
          <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full">
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

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Logout"
        cancelText="Stay Signed In"
        type="warning"
        onConfirm={handleLogout}
        onClose={() => setShowLogoutModal(false)}
      />

      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset Enrollment Progress"
        message="This will reset your enrollment progress and cannot be undone. Use this only if you need to start the process over."
        confirmText="Reset Progress"
        cancelText="Keep Progress"
        type="danger"
        onConfirm={handleResetProgress}
        onClose={() => setShowResetModal(false)}
      />

      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}