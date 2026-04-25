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
  Menu,
  X,
} from "lucide-react";
import { ChatAssistant } from "../components/ChatAssistant";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ChatProvider, useChat } from "../context/ChatContext";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { loadProfileImageUrl } from "../utils/profileImage";
import { supabase } from "../../supabase";
import logo from "../../assets/electronLogo";

function DashboardLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    logout,
    isDocumentsVerified,
    hasVisitedPayment,
    enrollmentProgress,
    userData,
    refreshEnrollmentProgress,
    updateUserData,
  } = useAuth();
  const { isChatOpen, toggleChat } = useChat();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPaymentTooltip, setShowPaymentTooltip] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const paymentTooltipRef = useRef<HTMLDivElement>(null);

  // Get user's name and initial from authenticated user
  const userName = userData?.name || "Student";
  const userInitial =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((namePart) => namePart[0]?.toUpperCase())
      .join("") || "S";
  const userGradeLevel = "Student"; // User role label
  const userProfileImage = userData?.profilePictureUrl || "";
  const hasStartedPaymentFlow = enrollmentProgress.some(
    (step) =>
      (step.name === "Payment Submitted" ||
        step.name === "Payment Verified" ||
        step.name === "Enrolled") &&
      step.status !== "pending"
  );

  useEffect(() => {
    let isActive = true;

    const hydrateProfileImage = async () => {
      if (!userData?.id && !userData?.email) {
        return;
      }

      const imageUrl = await loadProfileImageUrl(userData?.id, userData?.email);

      if (isActive && imageUrl && imageUrl !== userData?.profilePictureUrl) {
        updateUserData({ profilePictureUrl: imageUrl });
      }
    };

    void hydrateProfileImage();

    return () => {
      isActive = false;
    };
  }, [userData?.id, userData?.email, userData?.profilePictureUrl]);

  // Load notifications from Supabase
  const getNotificationVariant = (notificationType: string) => {
    switch (notificationType) {
      case 'ASSESSMENT_COMPLETED':
      case 'PAYMENT_VERIFIED':
      case 'DOCUMENTS_VERIFIED':
      case 'ENROLLMENT_APPROVED':
        return 'success';

      case 'PAYMENT_SUBMITTED':
      case 'ENROLLMENT_SUBMITTED':
      case 'DOCUMENTS_REJECTED':
        return 'warning';

      case 'PAYMENT_REJECTED':
      case 'ENROLLMENT_REJECTED':
        return 'error';

      default:
        return 'info';
    }
  };

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return {
          wrapper: 'rounded-3xl border border-emerald-200 bg-emerald-50/80 text-slate-900',
          iconBg: 'bg-emerald-100 text-emerald-700',
          actionColor: 'text-emerald-700',
        };
      case 'warning':
        return {
          wrapper: 'rounded-3xl border border-amber-200 bg-amber-50/80 text-slate-900',
          iconBg: 'bg-amber-100 text-amber-700',
          actionColor: 'text-amber-700',
        };
      case 'error':
        return {
          wrapper: 'rounded-3xl border border-rose-200 bg-rose-50/80 text-slate-900',
          iconBg: 'bg-rose-100 text-rose-700',
          actionColor: 'text-rose-700',
        };
      default:
        return {
          wrapper: 'rounded-3xl border border-slate-200 bg-slate-50/90 text-slate-900',
          iconBg: 'bg-slate-100 text-slate-700',
          actionColor: 'text-slate-700',
        };
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      if (!userData?.id) {
        setLoadingNotifications(false);
        return;
      }

      setLoadingNotifications(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map((n: any) => ({
          id: n.id,
          type: n.data?.trigger || n.type,
          title: n.title,
          message: n.message,
          timestamp: n.created_at,
          read: Boolean(n.is_read),
        }));
        setNotifications(formatted);
      }

      setLoadingNotifications(false);
    };
    loadNotifications();
  }, [userData?.id]);

  // Monitor enrollment progress changes from Supabase
  useEffect(() => {
    if (!userData?.id) return;

    const checkProgressUpdates = async () => {
      await refreshEnrollmentProgress();

      // Reload notifications from Supabase
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (notifData) {
        const formatted = notifData.map((n: any) => ({
          id: n.id,
          type: n.data?.trigger || n.type,
          title: n.title,
          message: n.message,
          timestamp: n.created_at,
          read: Boolean(n.is_read),
        }));
        setNotifications(formatted);
      }
    };

    // Check on mount and every 5 seconds
    checkProgressUpdates();
    const interval = setInterval(checkProgressUpdates, 5000);

    return () => clearInterval(interval);
  }, [userData?.id]);

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

  const handleNotificationClick = async (notificationId: string, notification: any) => {
    // Mark notification as read in Supabase
    if (userData?.id) {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      const updatedNotifications = notifications.map((n: any) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
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
  const activeMenuItem = menuItems.find((item) => location.pathname === item.path);
  const mobileHeaderLabel = activeMenuItem?.label || "Student Portal";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    setIsMobileNavOpen(false);
    setShowPaymentTooltip(false);
    setShowNotifications(false);
    setShowProfileMenu(false);
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

  return (
    <div className="portal-glass-shell min-h-screen flex lg:h-screen lg:overflow-hidden">
      <div
        className={`fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileNavOpen(false)}
      />

      {/* Fixed Sidebar */}
      <aside
        className={`portal-glass-sidebar fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-hidden text-white transition-transform duration-300 lg:w-64 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="portal-glass-sidebar-brand flex items-center justify-between gap-3 border-b border-white/10 p-5 sm:p-6">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2" onClick={() => setIsMobileNavOpen(false)}>
            <img src={logo} alt="Electron College Logo" className="w-8 h-8 object-contain" />
            <div className="min-w-0">
              <div className="truncate font-semibold text-lg">Electron Hub</div>
              <div className="text-xs text-blue-200">Student Portal</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/12 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-hidden p-4">
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
                    <button
                      type="button"
                      onClick={() => setShowPaymentTooltip((current) => !current)}
                      onMouseEnter={() => setShowPaymentTooltip(true)}
                      onMouseLeave={() => setShowPaymentTooltip(false)}
                      className="portal-glass-nav-link flex w-full items-center justify-between gap-3 rounded-md px-4 py-3 text-left text-white/55 opacity-80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </div>
                      <LockKeyhole className="w-4 h-4" />
                    </button>
                    
                    {/* Tooltip */}
                    {showPaymentTooltip && (
                      <div className="mt-2 rounded-lg bg-gray-900 px-3 py-2 text-xs shadow-lg lg:absolute lg:left-full lg:top-1/2 lg:z-50 lg:mt-0 lg:ml-2 lg:w-64 lg:-translate-y-1/2">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                          <p className="leading-relaxed">
                            Access restricted. Please wait for the Registrar to verify your documents first.
                          </p>
                          {/* Arrow pointing left */}
                          <div
                            className="absolute right-full top-1/2 hidden h-0 w-0 -translate-y-1/2 lg:block"
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
                      onClick={() => setIsMobileNavOpen(false)}
                      className={`portal-glass-nav-link flex items-center justify-between gap-3 px-4 py-3 rounded-md transition-colors ${
                        isActive ? "portal-glass-nav-link-active text-white" : "text-white/80 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </div>
                      {/* Red notification badge - only show if not visited yet */}
                      {!isActive && !hasVisitedPayment && !hasStartedPaymentFlow && (
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
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`portal-glass-nav-link flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                      isActive ? "portal-glass-nav-link-active text-white" : "text-white/80 hover:text-white"
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
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => navigate("/")}
            className="portal-glass-nav-link flex w-full items-center gap-3 rounded-md px-4 py-3 text-white/80 transition-colors hover:text-white"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with fixed top navbar and scrollable content */}
      <div className="portal-glass-content flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64 lg:h-screen lg:w-[calc(100%-16rem)] lg:flex-none lg:overflow-hidden">
        {/* Fixed Top Navbar */}
        <header
          className="portal-glass-header fixed left-0 right-0 top-0 z-40 lg:left-64"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:justify-end lg:px-8 lg:py-4">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="portal-glass-icon-button rounded-xl p-2 text-gray-700 transition-colors hover:bg-white/70"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">Electron Hub</p>
                <p className="truncate text-xs text-gray-500">{mobileHeaderLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Notification Bell with Badge */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="portal-glass-icon-button relative rounded-xl p-2 text-slate-700 transition-colors hover:bg-white/70 hover:text-slate-900"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6" />
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
                    className="portal-glass-menu absolute right-0 z-50 mt-3 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-lg sm:w-80"
                  >
                    {/* Arrow pointing up */}
                    <div
                      className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-md"
                    />

                    {/* Header */}
                    <div className="relative z-10 border-b border-slate-200/80 bg-white/72 px-4 py-3 backdrop-blur-sm">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>

                    {/* Notification List */}
                    <div className="relative z-10 bg-white/60 p-4">
                      {loadingNotifications ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                            <span>Loading notifications...</span>
                          </div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                          No notifications yet
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {notifications.map((notification) => {
                            const variant = getNotificationVariant(notification.type);
                            const variantStyles = getVariantStyles(variant);

                            if (notification.type === "DOCUMENTS_VERIFIED") {
                              return (
                                <button
                                  key={notification.id}
                                  onClick={() =>
                                    handleNotificationClick(notification.id, notification)
                                  }
                                  className={`w-full text-left transition-all hover:shadow-lg ${variantStyles.wrapper}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${variantStyles.iconBg}`}
                                    >
                                      <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-900 mb-1">
                                        Enrollment Form Accepted
                                      </p>
                                      <p className="text-xs leading-relaxed mb-2 text-slate-700">
                                        {notification.message}
                                      </p>
                                      <p className={`text-xs font-medium hover:underline ${variantStyles.actionColor}`}>
                                        Go to Payment Tab →
                                      </p>
                                      <p className="text-xs text-slate-400 mt-1">
                                        {new Date(notification.timestamp).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              );
                            }

                            if (notification.type === "DOCUMENTS_REJECTED") {
                              return (
                                <button
                                  key={notification.id}
                                  onClick={() =>
                                    handleNotificationClick(notification.id, notification)
                                  }
                                  className={`w-full text-left transition-all hover:shadow-lg ${variantStyles.wrapper}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${variantStyles.iconBg}`}
                                    >
                                      <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-900 mb-1">
                                        Action Required: Document Rejected
                                      </p>
                                      <p className="text-xs leading-relaxed mb-2 text-slate-700 whitespace-pre-line">
                                        {notification.message}
                                      </p>
                                      <p className={`text-xs font-medium hover:underline ${variantStyles.actionColor}`}>
                                        Click here to review and re-upload your document →
                                      </p>
                                      <p className="text-xs text-slate-400 mt-1">
                                        {new Date(notification.timestamp).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              );
                            }

                            return (
                              <button
                                key={notification.id}
                                onClick={() =>
                                  handleNotificationClick(notification.id, notification)
                                }
                                className={`w-full text-left transition-all hover:shadow-lg ${variantStyles.wrapper}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${variantStyles.iconBg}`}
                                  >
                                    <span className="text-sm font-semibold">
                                      {notification.read ? '•' : '!'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900 mb-1">
                                      {notification.title || 'Notification'}
                                    </p>
                                    <p className="text-xs leading-relaxed text-slate-700">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                      {new Date(notification.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 border-t border-slate-200/80 bg-white/72 px-4 py-3 backdrop-blur-sm">
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
              <div className="hidden text-right sm:block">
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
                  className="portal-glass-avatar-button flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full transition-all hover:border-white/50"
                  title="Account Menu"
                >
                  <Avatar className="w-full h-full">
                    {userProfileImage ? (
                      <AvatarImage
                        src={userProfileImage}
                        alt={`${userName} profile photo`}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback
                      className="text-white font-semibold text-sm"
                      style={{ backgroundColor: "var(--electron-red)" }}
                    >
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div
                    className="portal-glass-menu absolute right-0 z-50 mt-3 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl"
                    style={{ width: "240px" }}
                  >
                    {/* Header Section */}
                    <div className="border-b border-white/40 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          {userProfileImage ? (
                            <AvatarImage
                              src={userProfileImage}
                              alt={`${userName} profile photo`}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback
                            className="text-white font-semibold"
                            style={{ backgroundColor: "#1E3A8A" }}
                          >
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
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
                    <div className="border-t border-white/35"></div>

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
                    <div className="border-t border-white/35"></div>

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
        <main className="portal-glass-main min-w-0 flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-20">
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
          <div className="portal-glass-modal w-full max-w-sm rounded-xl">
            {/* Question */}
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900">
                Log Out?
              </h3>
              <p className="text-sm text-gray-700 mt-3 font-medium">
                Are you sure you want to log out?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You’ll need to sign in again to access your account.
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