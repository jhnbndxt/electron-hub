import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  User,
  LogOut,
  Bell,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Edit3,
  Lock,
  Home,
  BarChart3,
  LockKeyhole,
  AlertTriangle,
} from "lucide-react";
import { ChatAssistant } from "../components/ChatAssistant";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ChatProvider, useChat } from "../context/ChatContext";
const logo = "";

function DashboardLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isDocumentsVerified, hasVisitedPayment, userData, enrollmentProgress, updateEnrollmentProgress } = useAuth();
  const { isChatOpen, toggleChat } = useChat();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPaymentTooltip, setShowPaymentTooltip] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const paymentTooltipRef = useRef<HTMLDivElement>(null);

  // Get user's name and initial from authenticated user
  const userName = userData?.name || "Student";
  const userInitial = userName.charAt(0).toUpperCase();
  const userGradeLevel = "Student"; // User role label

  // Load notifications from localStorage
  useEffect(() => {
    if (userData?.email) {
      const notifKey = `notifications_${userData.email}`;
      const storedNotifications = JSON.parse(localStorage.getItem(notifKey) || "[]");
      setNotifications(storedNotifications);
    }
  }, [userData?.email]);

  // Monitor enrollment progress changes in localStorage
  useEffect(() => {
    if (!userData?.email) return;

    const checkProgressUpdates = () => {
      const enrollmentKey = `enrollment_progress_${userData.email}`;
      const storedProgress = JSON.parse(localStorage.getItem(enrollmentKey) || "[]");
      
      // Check if Documents Verified is completed in localStorage
      const docsVerifiedInStorage = storedProgress.find((step: any) => step.name === "Documents Verified");
      const docsVerifiedInContext = enrollmentProgress.find(step => step.name === "Documents Verified");
      
      // Only update if there's a mismatch (storage says completed but context doesn't)
      if (docsVerifiedInStorage && 
          docsVerifiedInStorage.status === "completed" && 
          docsVerifiedInContext && 
          docsVerifiedInContext.status !== "completed") {
        updateEnrollmentProgress("Documents Verified", "completed");
      }

      // Reload notifications
      const notifKey = `notifications_${userData.email}`;
      const storedNotifications = JSON.parse(localStorage.getItem(notifKey) || "[]");
      setNotifications(storedNotifications);
    };

    // Check on mount and every 2 seconds
    checkProgressUpdates();
    const interval = setInterval(checkProgressUpdates, 2000);

    return () => clearInterval(interval);
  }, [userData?.email, enrollmentProgress]); // Don't include updateEnrollmentProgress

  // Calculate unread notification count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        paymentTooltipRef.current &&
        !paymentTooltipRef.current.contains(event.target as Node)
      ) {
        setShowPaymentTooltip(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notificationId: string, notification: any) => {
    // Mark notification as read
    if (userData?.email) {
      const notifKey = `notifications_${userData.email}`;
      const storedNotifications = JSON.parse(localStorage.getItem(notifKey) || "[]");
      const updatedNotifications = storedNotifications.map((n: any) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem(notifKey, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    }

    setShowNotifications(false);

    // Redirect based on notification type
    if (notification.type === "DOCUMENTS_VERIFIED") {
      navigate("/dashboard/payment");
    } else if (notification.type === "DOCUMENTS_REJECTED") {
      navigate("/dashboard/my-documents");
    } else if (notification.type === "PAYMENT_VERIFIED") {
      navigate("/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/assessment", label: "Assessment", icon: Home },
    { path: "/dashboard/results", label: "Results", icon: BarChart3 },
    { path: "/dashboard/enrollment", label: "Enrollment", icon: FileText },
    { path: "/dashboard/payment", label: "Payment", icon: CreditCard },
    { path: "/dashboard/profile", label: "Profile", icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* Fixed Sidebar */}
      <aside
        className="w-64 text-white flex flex-col fixed h-full"
        style={{ backgroundColor: "var(--electron-blue)" }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-700">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <div>
              <div className="font-semibold text-lg">Electron Hub</div>
              <div className="text-xs text-blue-200">Student Portal</div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              const isPayment = link.path === "/dashboard/payment";
              const isLocked = isPayment && !isDocumentsVerified;
              
              // If it's the payment link and documents aren't verified, show locked state
              if (isLocked) {
                return (
                  <li key={link.path} className="relative" ref={paymentTooltipRef}>
                    <div
                      onMouseEnter={() => setShowPaymentTooltip(true)}
                      onMouseLeave={() => setShowPaymentTooltip(false)}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-md transition-colors text-blue-300 opacity-60 cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </div>
                      <LockKeyhole className="w-4 h-4" />
                    </div>
                    
                    {/* Tooltip */}
                    {showPaymentTooltip && (
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-64">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                          <p className="leading-relaxed">
                            Access restricted. Please wait for the Registrar to verify your documents first.
                          </p>
                          {/* Arrow pointing left */}
                          <div
                            className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0"
                            style={{
                              borderTop: "6px solid transparent",
                              borderBottom: "6px solid transparent",
                              borderRight: "6px solid #111827",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </li>
                );
              }
              
              // If payment is unlocked, show with red badge
              if (isPayment && isDocumentsVerified) {
                return (
                  <li key={link.path} className="relative">
                    <Link
                      to={link.path}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-md transition-colors ${
                        isActive ? "text-white" : "text-blue-100 hover:bg-blue-700"
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: "var(--electron-red)" }
                          : {}
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </div>
                      {/* Red notification badge - only show if not visited yet */}
                      {!isActive && !hasVisitedPayment && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "#B91C1C" }}
                        />
                      )}
                    </Link>
                  </li>
                );
              }

              // Normal navigation link
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                      isActive ? "bg-blue-700 text-white" : "text-blue-100 hover:bg-blue-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to Home Button */}
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 px-4 py-3 rounded-md text-blue-100 hover:bg-blue-700 transition-colors w-full"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with fixed top navbar and scrollable content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Fixed Top Navbar */}
        <header
          className="fixed top-0 right-0 z-40 border-b border-gray-200 bg-white"
          style={{ left: "256px" }}
        >
          <div className="flex justify-end items-center px-8 py-4">
            <div className="flex items-center gap-6">
              {/* Notification Bell with Badge */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6 text-black" />
                  {/* Red Badge */}
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: "#B91C1C" }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div
                    className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-2xl overflow-hidden z-50"
                    style={{
                      boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    {/* Arrow pointing up */}
                    <div
                      className="absolute -top-2 right-4 w-4 h-4 bg-white transform rotate-45"
                      style={{ boxShadow: "-2px -2px 2px rgba(0, 0, 0, 0.05)" }}
                    />

                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 relative z-10 bg-white">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>

                    {/* Notification List */}
                    <div className="relative z-10 bg-white">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          // Render DOCUMENTS_VERIFIED notification
                          if (notification.type === "DOCUMENTS_VERIFIED") {
                            return (
                              <button
                                key={notification.id}
                                onClick={() =>
                                  handleNotificationClick(notification.id, notification)
                                }
                                className="w-full px-4 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: "#D1FAE5" }}
                                  >
                                    <CheckCircle
                                      className="w-5 h-5"
                                      style={{ color: "#10B981" }}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                      Enrollment Form Accepted
                                    </p>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                                      {notification.message}
                                    </p>
                                    <p
                                      className="text-xs font-medium hover:underline"
                                      style={{ color: "#10B981" }}
                                    >
                                      Go to Payment Tab →
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notification.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          }

                          // Render DOCUMENTS_REJECTED notification
                          if (notification.type === "DOCUMENTS_REJECTED") {
                            return (
                              <button
                                key={notification.id}
                                onClick={() =>
                                  handleNotificationClick(notification.id, notification)
                                }
                                className="w-full px-4 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: "#FEE2E2" }}
                                  >
                                    <AlertTriangle
                                      className="w-5 h-5"
                                      style={{ color: "#DC2626" }}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                      Action Required: Document Rejected
                                    </p>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-2 whitespace-pre-line">
                                      {notification.message}
                                    </p>
                                    <p
                                      className="text-xs font-medium hover:underline"
                                      style={{ color: "#DC2626" }}
                                    >
                                      Click here to review and re-upload your document →
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notification.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          }

                          // Render default/generic notification for other types
                          return (
                            <button
                              key={notification.id}
                              onClick={() =>
                                handleNotificationClick(notification.id, notification)
                              }
                              className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                  style={{
                                    backgroundColor: notification.read
                                      ? "#D1D5DB"
                                      : "#B91C1C",
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900 mb-1">
                                    {notification.title || "Notification"}
                                  </p>
                                  <p className="text-xs text-gray-600 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notification.timestamp).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-gray-50 relative z-10">
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-sm font-medium w-full text-center"
                        style={{ color: "var(--electron-blue)" }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="text-right">
                <p className="font-semibold text-sm text-black">
                  {userName}
                </p>
                <p className="text-xs text-gray-500">{userGradeLevel}</p>
              </div>

              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                {/* Avatar Button */}
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-white/20 hover:border-white/40 transition-all cursor-pointer"
                  style={{ backgroundColor: "var(--electron-red)" }}
                  title="Account Menu"
                >
                  {userInitial}
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-3 bg-white overflow-hidden z-50"
                    style={{
                      width: "240px",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    {/* Header Section */}
                    <div className="px-4 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                          style={{ backgroundColor: "#1E3A8A" }}
                        >
                          {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {userName}
                          </p>
                          <p className="text-xs text-gray-500">Student</p>
                        </div>
                      </div>
                    </div>

                    {/* Group 1: Account */}
                    <div className="py-1">
                      <Link
                        to="/dashboard/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                        <span className="text-sm text-gray-700">View Profile</span>
                      </Link>
                      <Link
                        to="/dashboard/edit-profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                        <span className="text-sm text-gray-700">Edit Profile</span>
                      </Link>
                      <Link
                        to="/dashboard/change-password"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <Lock className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                        <span className="text-sm text-gray-700">Change Password</span>
                      </Link>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100"></div>

                    {/* Group 2: Enrollment */}
                    <div className="py-1">
                      <Link
                        to="/dashboard/my-documents"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                        <span className="text-sm text-gray-700">My Documents</span>
                      </Link>
                      <Link
                        to="/dashboard/payment-history"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                        <span className="text-sm text-gray-700">Payment History</span>
                      </Link>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100"></div>

                    {/* Group 3: Logout */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                        <span className="text-sm text-gray-700">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto pt-20" style={{ backgroundColor: "var(--electron-light-gray)" }}>
          <Outlet />
        </main>
      </div>

      {/* Global Chat Assistant */}
      <ChatAssistant externalIsOpen={isChatOpen} onToggle={toggleChat} />

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
                Return to Home Page?
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                You'll be redirected to the Electron Hub home page
              </p>
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
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D1D5DB")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-4 rounded-xl text-white font-semibold transition-all"
                style={{ backgroundColor: "#1E3A8A" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1E40AF")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1E3A8A")}
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

export function DashboardLayout() {
  return (
    <ChatProvider>
      <DashboardLayoutContent />
    </ChatProvider>
  );
}