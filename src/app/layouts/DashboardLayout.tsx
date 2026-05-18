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
  ClipboardCheck,
  Menu,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { ChatAssistant } from "../components/ChatAssistant";
import { MaintenanceNotice } from "../components/MaintenanceNotice";
import { LoadingState } from "../components/LoadingState";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ChatProvider, useChat } from "../context/ChatContext";
import { getSystemSettings } from "../../services/systemSettingsService";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { formatNotificationTimestamp } from "../utils/dateTime";
import { loadProfileImageUrl } from "../utils/profileImage";
import { supabase } from "../../supabase";
import logo from "../../assets/electronLogo";
import { Button } from "../components/ui/button";
import { AnimatePresence } from "motion/react";
import { PageTransition } from "../components/PageTransition";

function NotificationTimestamp({ timestamp }: { timestamp: string }) {
  const formattedTimestamp = formatNotificationTimestamp(timestamp);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-4 text-slate-400">
      <span>{formattedTimestamp.absolute}</span>
      <span className="text-slate-300">•</span>
      <span>{formattedTimestamp.relative}</span>
    </div>
  );
}

const formatNotification = (notification: any) => ({
  id: notification.id,
  type: String(notification.data?.trigger || notification.type || "").toUpperCase(),
  title: notification.title,
  message: notification.message,
  timestamp: notification.created_at,
  read: Boolean(notification.is_read),
  actionUrl: notification.data?.actionUrl,
});

function DashboardLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    logout,
    isDocumentsVerified,
    hasVisitedPayment,
    enrollmentProgress,
    userData,
    userRole,
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
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [isVoucherPaymentLocked, setIsVoucherPaymentLocked] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [maintenanceCountdown, setMaintenanceCountdown] = useState(5);
  const [showMaintenanceNotice, setShowMaintenanceNotice] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const paymentTooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const previousOffset = root.style.getPropertyValue("--dashboard-sidebar-offset");
    root.style.setProperty("--dashboard-sidebar-offset", "16rem");

    return () => {
      if (previousOffset) {
        root.style.setProperty("--dashboard-sidebar-offset", previousOffset);
      } else {
        root.style.removeProperty("--dashboard-sidebar-offset");
      }
    };
  }, []);

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
    let active = true;

    async function loadVoucherLock() {
      if (!userData?.email) {
        if (active) setIsVoucherPaymentLocked(false);
        return;
      }

      const { data } = await supabase
        .from("enrollments")
        .select("status, form_data")
        .eq("user_id", userData.email)
        .neq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const formData = data?.form_data || {};
      const voucherData = formData.voucher || {};
      const isLocked =
        formData.voucher_status === "eligible" ||
        voucherData.voucher_status === "eligible" ||
        formData.is_tuition_free === true ||
        voucherData.is_tuition_free === true ||
        formData.tuition_payment_locked === true ||
        voucherData.tuition_payment_locked === true;

      if (active) setIsVoucherPaymentLocked(isLocked);
    }

    void loadVoucherLock();

    return () => {
      active = false;
    };
  }, [userData?.email, enrollmentProgress]);

  const isMaintenanceModeActive = systemSettings?.maintenance_mode === true;
  const isStudentUser = userRole === "student" || userData?.role === "student";

  useEffect(() => {
    if (settingsLoaded && isMaintenanceModeActive && isStudentUser) {
      setShowMaintenanceNotice(true);
      setMaintenanceCountdown(5);
    }
  }, [settingsLoaded, isMaintenanceModeActive, isStudentUser]);

  useEffect(() => {
    if (!showMaintenanceNotice) {
      return;
    }

    if (maintenanceCountdown <= 0) {
      logout();
      navigate("/", { replace: true });
      return;
    }

    const timeout = window.setTimeout(() => {
      setMaintenanceCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [showMaintenanceNotice, maintenanceCountdown, logout, navigate]);

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
      case 'ENROLLMENT_OPENED':
        return 'success';

      case 'PAYMENT_SUBMITTED':
      case 'ENROLLMENT_SUBMITTED':
      case 'DOCUMENTS_REJECTED':
      case 'DOCUMENT_REJECTED':
      case 'ENROLLMENT_CLOSED':
        return 'warning';

      case 'PAYMENT_REJECTED':
      case 'ENROLLMENT_REJECTED':
      case 'ENROLLMENT_UNENROLLED':
        return 'error';

      default:
        return 'info';
    }
  };

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return {
          wrapper: 'border-l-emerald-400',
          iconBg: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
          dot: 'bg-emerald-500',
          actionColor: 'text-emerald-700',
        };
      case 'warning':
        return {
          wrapper: 'border-l-amber-400',
          iconBg: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
          dot: 'bg-amber-500',
          actionColor: 'text-amber-700',
        };
      case 'error':
        return {
          wrapper: 'border-l-rose-400',
          iconBg: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
          dot: 'bg-rose-500',
          actionColor: 'text-rose-700',
        };
      default:
        return {
          wrapper: 'border-l-blue-400',
          iconBg: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
          dot: 'bg-blue-500',
          actionColor: 'text-blue-700',
        };
    }
  };

  const getNotificationIcon = (notificationType: string, variant: string) => {
    switch (notificationType) {
      case "DOCUMENTS_VERIFIED":
      case "ENROLLMENT_APPROVED":
      case "PAYMENT_VERIFIED":
      case "ASSESSMENT_COMPLETED":
        return CheckCircle;
      case "DOCUMENTS_REJECTED":
      case "DOCUMENT_REJECTED":
      case "PAYMENT_REJECTED":
      case "ENROLLMENT_REJECTED":
      case "ENROLLMENT_UNENROLLED":
        return XCircle;
      case "PAYMENT_SUBMITTED":
      case "ENROLLMENT_SUBMITTED":
        return Send;
      case "ENROLLMENT_OPENED":
      case "ENROLLMENT_CLOSED":
        return ClipboardCheck;
      default:
        return variant === "warning" || variant === "error" ? AlertTriangle : Bell;
    }
  };

  useEffect(() => {
    let active = true;

    async function loadSystemSettings() {
      try {
        const result = await getSystemSettings();
        if (active && result?.data) {
          setSystemSettings(result.data);
        }
      } catch (error) {
        console.error('Error loading system settings:', error);
      } finally {
        if (active) {
          setSettingsLoaded(true);
        }
      }
    }

    void loadSystemSettings();

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
        const formatted = data.map(formatNotification);
        setNotifications(formatted);
      }

      setLoadingNotifications(false);
    };
    loadNotifications();

    return () => {
      active = false;
    };
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
        const formatted = notifData.map(formatNotification);
        setNotifications(formatted);
      }
    };

    // Check on mount and every 5 seconds
    checkProgressUpdates();
    const interval = setInterval(checkProgressUpdates, 5000);

    return () => clearInterval(interval);
  }, [userData?.id]);

  useEffect(() => {
    if (!userData?.id) return;

    const reloadNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (data) {
        setNotifications(data.map(formatNotification));
        setLoadingNotifications(false);
      }
    };

    const channel = supabase
      .channel(`dashboard-notifications-${userData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userData.id}`,
        },
        () => {
          void reloadNotifications();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
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
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.type === "DOCUMENTS_VERIFIED" && !isVoucherPaymentLocked) {
      navigate("/dashboard/payment");
    } else if (notification.type === "VOUCHER_ELIGIBLE" || notification.type === "OFFICIALLY_ENROLLED") {
      navigate("/dashboard");
    } else if (notification.type === "DOCUMENTS_REJECTED" || notification.type === "DOCUMENT_REJECTED") {
      navigate("/dashboard/my-documents");
    } else if (notification.type === "PAYMENT_VERIFIED") {
      navigate("/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const handleBellClick = async () => {
    // Mark all unread notifications as read when opening the dropdown
    if (!showNotifications && unreadCount > 0 && userData?.id) {
      const unreadNotificationIds = notifications
        .filter((n) => !n.read)
        .map((n) => n.id);

      if (unreadNotificationIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', unreadNotificationIds);

        // Update local state
        const updatedNotifications = notifications.map((n: any) => ({
          ...n,
          read: true,
        }));
        setNotifications(updatedNotifications);
      }
    }

    // Toggle dropdown
    setShowNotifications(!showNotifications);
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

  if (showMaintenanceNotice && settingsLoaded && isMaintenanceModeActive && isStudentUser) {
    return (
      <MaintenanceNotice
        message="The student portal is currently under maintenance. You will be logged out shortly. Please try again later."
        countdown={maintenanceCountdown}
        showButton={true}
        onButtonClick={() => {
          logout();
          navigate("/", { replace: true });
        }}
      />
    );
  }

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
        <nav className="min-h-0 flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              const isPayment = link.path === "/dashboard/payment";
              const isLocked = isPayment && (!isDocumentsVerified || isVoucherPaymentLocked);
              
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
                            {isVoucherPaymentLocked
                              ? "Payment is not required. Your tuition is covered by the DepEd SHS Voucher Program."
                              : "Access restricted. Please wait for the Registrar to verify your documents first."}
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
              if (isPayment && isDocumentsVerified && !isVoucherPaymentLocked) {
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
                  onClick={handleBellClick}
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
                    className="portal-glass-menu absolute right-0 z-50 mt-3 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 sm:w-96"
                  >
                    {/* Arrow pointing up */}
                    <div
                      className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-slate-200/80 bg-white"
                    />

                    {/* Header */}
                    <div className="relative z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        <p className="text-xs text-slate-500">
                          {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You're all caught up"}
                        </p>
                      </div>
                      {notifications.length > 0 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {notifications.length}
                        </span>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="relative z-10 max-h-[360px] overflow-y-auto bg-white scroll-smooth [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
                      {loadingNotifications ? (
                        <div className="p-3">
                          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                            <LoadingState
                              message="Loading notifications..."
                              subtext="Checking recent enrollment updates."
                              compact
                              className="min-h-0 py-2"
                            />
                          </div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-3">
                          <div className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            No notifications yet
                          </div>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {notifications.map((notification) => {
                            const variant = getNotificationVariant(notification.type);
                            const variantStyles = getVariantStyles(variant);
                            const NotificationIcon = getNotificationIcon(notification.type, variant);

                            if (notification.type === "DOCUMENTS_VERIFIED") {
                              return (
                                <button
                                  key={notification.id}
                                  onClick={() =>
                                    handleNotificationClick(notification.id, notification)
                                  }
                                  className={`w-full border-l-2 px-3.5 py-3 text-left transition-colors hover:bg-slate-50/90 ${variantStyles.wrapper}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${variantStyles.iconBg}`}
                                    >
                                      <NotificationIcon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold leading-5 text-slate-900">
                                          Enrollment Form Accepted
                                        </p>
                                        {!notification.read && (
                                          <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${variantStyles.dot}`} />
                                        )}
                                      </div>
                                      <p className="mt-0.5 text-xs leading-5 text-slate-600">
                                        {notification.message}
                                      </p>
                                      <p className={`mt-1 text-xs font-medium hover:underline ${variantStyles.actionColor}`}>
                                        Go to Payment
                                      </p>
                                      <NotificationTimestamp timestamp={notification.timestamp} />
                                    </div>
                                  </div>
                                </button>
                              );
                            }

                            if (notification.type === "DOCUMENTS_REJECTED" || notification.type === "DOCUMENT_REJECTED") {
                              return (
                                <button
                                  key={notification.id}
                                  onClick={() =>
                                    handleNotificationClick(notification.id, notification)
                                  }
                                  className={`w-full border-l-2 px-3.5 py-3 text-left transition-colors hover:bg-slate-50/90 ${variantStyles.wrapper}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${variantStyles.iconBg}`}
                                    >
                                      <NotificationIcon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold leading-5 text-slate-900">
                                          {notification.title || "Action Required: Document Rejected"}
                                        </p>
                                        {!notification.read && (
                                          <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${variantStyles.dot}`} />
                                        )}
                                      </div>
                                      <p className="mt-0.5 whitespace-pre-line text-xs leading-5 text-slate-600">
                                        {notification.message}
                                      </p>
                                      <p className={`mt-1 text-xs font-medium hover:underline ${variantStyles.actionColor}`}>
                                        Go to My Documents
                                      </p>
                                      <NotificationTimestamp timestamp={notification.timestamp} />
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
                                className={`w-full border-l-2 px-3.5 py-3 text-left transition-colors hover:bg-slate-50/90 ${variantStyles.wrapper}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${variantStyles.iconBg}`}
                                  >
                                    <NotificationIcon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm font-semibold leading-5 text-slate-900">
                                        {notification.title || 'Notification'}
                                      </p>
                                      {!notification.read && (
                                        <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${variantStyles.dot}`} />
                                      )}
                                    </div>
                                    <p className="mt-0.5 text-xs leading-5 text-slate-600">
                                      {notification.message}
                                    </p>
                                    <NotificationTimestamp timestamp={notification.timestamp} />
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-2.5">
                      {notifications.length > 0 && (
                        <button
                          onClick={async () => {
                            if (userData?.id) {
                              await supabase
                                .from('notifications')
                                .delete()
                                .eq('user_id', userData.id);
                              setNotifications([]);
                            }
                          }}
                          className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                        >
                          Clear All
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
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
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname} className="min-h-full">
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Chat Assistant */}
      <ChatAssistant externalIsOpen={isChatOpen} onToggle={toggleChat} />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/35 p-4 backdrop-blur-sm"
        >
          <div className="portal-glass-modal w-full max-w-md overflow-hidden rounded-2xl border border-white/70 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="border-b border-white/50 bg-gradient-to-r from-blue-50/90 via-white/90 to-red-50/80 p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--electron-blue)] text-white shadow-lg">
                <LogOut className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-950">
                Log out of Electron Hub?
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
                You can sign back in anytime to continue your enrollment tasks and check updates.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 p-6 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setShowLogoutModal(false)}
                className="min-h-12 flex-1 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Stay Logged In
              </Button>
              <Button
                variant="default"
                onClick={handleLogout}
                className="min-h-12 flex-1 rounded-xl bg-[var(--electron-red)] text-white hover:bg-red-800"
              >
                Log Out
              </Button>
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
