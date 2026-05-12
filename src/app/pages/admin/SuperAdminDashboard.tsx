import {
  Users,
  FileCheck,
  TrendingUp,
  Shield,
  Award,
  AlertCircle,
  Calendar,
  Activity,
  BookOpen,
  Settings,
  UserCheck,
  FileText,
  ClipboardCheck,
  BarChart3,
  Clock,
  DollarSign,
  CheckCircle,
  Search,
  Eye,
  User,
  CreditCard,
  Wallet,
  Banknote,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { EmptyState } from "../../components/EmptyState";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { getDashboardAnalytics, getAuditLogs, getPaymentCollectionData } from "../../../services/adminService";
import { triggerNotification } from "../../../services/notificationService";
import { supabase } from "../../../supabase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AuditLog {
  id: string;
  action: string;
  user: string;
  email: string;
  timestamp: string;
  details: string;
}

const PRESENCE_CHANNEL = "electron-system-presence";

const buildActivityTrendData = (logs: any[]) => {
  const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const dayBuckets = new Map<string, number>();

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    dayBuckets.set(dayFormatter.format(date), 0);
  }

  logs.forEach((log) => {
    const date = new Date(log.created_at || log.timestamp);
    if (Number.isNaN(date.getTime())) return;

    const day = dayFormatter.format(date);
    if (dayBuckets.has(day)) {
      dayBuckets.set(day, (dayBuckets.get(day) || 0) + 1);
    }
  });

  return Array.from(dayBuckets.entries()).map(([day, activities]) => ({ day, activities }));
};

export function SuperAdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApplications: 0,
    approvedToday: 0,
    totalEnrolled: 0,
    paymentsPending: 0,
    paymentsApproved: 0,
    activeUsersAdmins: 0,
    rejectedEnrollments: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [activeUserRoles, setActiveUserRoles] = useState<Record<string, number>>({});
  const [paymentCollectionData, setPaymentCollectionData] = useState([
    { day: "Mon", amount: 4200 },
    { day: "Tue", amount: 5100 },
    { day: "Wed", amount: 3900 },
    { day: "Thu", amount: 6200 },
    { day: "Fri", amount: 7000 },
    { day: "Sat", amount: 5600 },
    { day: "Sun", amount: 4500 },
  ]);
  const [activityTrendData, setActivityTrendData] = useState([
    { day: "Mon", activities: 0 },
    { day: "Tue", activities: 0 },
    { day: "Wed", activities: 0 },
    { day: "Thu", activities: 0 },
    { day: "Fri", activities: 0 },
    { day: "Sat", activities: 0 },
    { day: "Sun", activities: 0 },
  ]);

  useEffect(() => {
    loadStats();
    loadRecentActivity();
    loadPaymentData();
  }, []);

  useEffect(() => {
    const channel = supabase.channel(PRESENCE_CHANNEL);

    const updatePresenceState = () => {
      const presenceState = channel.presenceState();
      const roleCounts: Record<string, number> = {};
      const activeKeys = Object.keys(presenceState);

      activeKeys.forEach((presenceKey) => {
        const metas = presenceState[presenceKey] as Array<{ role?: string; visible?: boolean }>;
        const latestMeta = metas?.[metas.length - 1] || {};
        const role = latestMeta.role || "visitor";
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      setActiveUsers(activeKeys.length);
      setActiveUserRoles(roleCounts);
    };

    channel
      .on("presence", { event: "sync" }, updatePresenceState)
      .on("presence", { event: "join" }, updatePresenceState)
      .on("presence", { event: "leave" }, updatePresenceState)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          updatePresenceState();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const loadStats = async () => {
    const { data: analytics, error } = await getDashboardAnalytics();

    if (error) {
      console.error("Error loading analytics:", error);
      setStats({
        totalStudents: 0,
        pendingApplications: 0,
        approvedToday: 0,
        totalEnrolled: 0,
        paymentsPending: 0,
        paymentsApproved: 0,
        activeUsersAdmins: 0,
        rejectedEnrollments: 0,
      });
      return;
    }

    if (analytics) {
      setStats({
        totalStudents: analytics.totalEnrollments || 0,
        pendingApplications: analytics.pendingEnrollments || 0,
        approvedToday: analytics.approvedToday || 0,
        totalEnrolled: analytics.enrolledStudents || 0,
        paymentsPending: analytics.paymentsPending || 0,
        paymentsApproved: analytics.totalVerifiedPayments || 0,
        activeUsersAdmins: analytics.activeUsersAdmins || 0,
        rejectedEnrollments: analytics.rejectedEnrollments || 0,
      });
    }
  };

  const loadRecentActivity = async () => {
    const { data: logs, error } = await getAuditLogs(100);

    if (error) {
      console.error("Error loading activity logs:", error);
      setRecentActivity([]);
      return;
    }

    if (logs) {
      setActivityTrendData(buildActivityTrendData(logs));

      const recentLogs = logs.slice(0, 5).map((log: any) => {
        const timeDiff = Date.now() - new Date(log.timestamp).getTime();
        const minutesAgo = Math.floor(timeDiff / 60000);
        const hoursAgo = Math.floor(timeDiff / 3600000);
        const timeAgo = hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago` : `${minutesAgo} minute${minutesAgo > 1 ? "s" : ""} ago`;

        return {
          id: log.id,
          action: log.details,
          user: log.user_name || log.user || "System",
          timestamp: timeAgo,
          type: log.action.includes("SUBMIT")
            ? "submission"
            : log.action.includes("APPROVE")
            ? "approval"
            : "system",
        };
      });
      setRecentActivity(recentLogs);
    }
  };

  const loadPaymentData = async () => {
    const { data: paymentData, error } = await getPaymentCollectionData();

    if (error) {
      console.error("Error loading payment data:", error);
      return;
    }

    if (paymentData) {
      setPaymentCollectionData(paymentData);
    }
  };

  const summaryCards = [
    {
      label: "Total Students",
      value: stats.totalStudents.toString(),
      icon: Users,
      color: "var(--electron-blue)",
    },
    {
      label: "Pending Applications",
      value: stats.pendingApplications.toString(),
      icon: FileCheck,
      color: "#F59E0B",
    },
    {
      label: "Approved Today",
      value: stats.approvedToday.toString(),
      icon: CheckCircle,
      color: "#10B981",
    },
    {
      label: "Total Enrolled",
      value: stats.totalEnrolled.toString(),
      icon: TrendingUp,
      color: "#1E40AF",
    },
    {
      label: "Payments Pending",
      value: stats.paymentsPending.toString(),
      icon: Clock,
      color: "#F97316",
    },
    {
      label: "Payments Approved",
      value: stats.paymentsApproved.toString(),
      icon: DollarSign,
      color: "#10B981",
    },
    {
      label: "Active Users Now",
      value: activeUsers.toString(),
      icon: Activity,
      color: "#8B5CF6",
    },
  ];

  const applicationStatusData = [
    { status: "Pending", count: stats.pendingApplications, color: "#F59E0B" },
    { status: "Approved", count: stats.totalEnrolled, color: "#10B981" },
    { status: "Rejected", count: stats.rejectedEnrollments, color: "#EF4444" },
  ];

  const activeUserRoleData = Object.entries(activeUserRoles).map(([role, count]) => ({
    role: role === "branchcoordinator" ? "Coordinator" : role.charAt(0).toUpperCase() + role.slice(1),
    count,
  }));

  return (
    <div
      className="portal-dashboard-page flex flex-col gap-6 p-4 sm:p-6 lg:p-8 xl:flex-row w-full"
      style={{ maxWidth: "none" }}
    >
      <div className="min-w-0 flex-1">
        <DashboardPageHeader
          badge="System Overview"
          title="Overview"
          subtitle="Monitor branch activity, enrollment progress, and administrative controls"
          icon={BarChart3}
          actions={
            <div className="portal-glass-inline-control flex w-full items-center gap-2 rounded-lg px-4 py-2 sm:w-auto">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-none outline-none text-sm font-medium text-gray-700"
                style={{ accentColor: "#1E3A8A" }}
              />
            </div>
          }
        />

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Top Summary Cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {summaryCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/50 bg-white p-6 shadow-lg transition-all hover:shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${card.color}15` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{card.value}</p>
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Charts & Reports</h2>
          <div className="mb-6 rounded-2xl border border-white/50 bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                  <Activity className="h-3.5 w-3.5" />
                  Live User Monitor
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">Current website users</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Live count from active browser sessions connected to the portal.
                </p>
              </div>
              <div className="flex items-end gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 px-5 py-4">
                <p className="text-5xl font-black text-violet-700">{activeUsers}</p>
                <p className="pb-2 text-sm font-semibold text-violet-700">active now</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Role breakdown</p>
                <div className="mt-3 space-y-2">
                  {activeUserRoleData.length === 0 ? (
                    <p className="text-sm text-slate-500">Waiting for live sessions...</p>
                  ) : (
                    activeUserRoleData.map((item) => (
                      <div key={item.role} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700">{item.role}</span>
                        <span className="font-bold text-slate-900">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={activeUserRoleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                  <XAxis dataKey="role" stroke="#6B7280" />
                  <YAxis allowDecimals={false} stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.94)",
                      border: "1px solid rgba(203, 213, 225, 0.6)",
                    }}
                  />
                  <Bar dataKey="count" name="Active users" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="xl:col-span-2 rounded-2xl border border-white/50 bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Collection Summary</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={paymentCollectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                  <XAxis dataKey="day" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.94)",
                      border: "1px solid rgba(203, 213, 225, 0.6)",
                    }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#1E3A8A" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={applicationStatusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={4}
                  >
                    {applicationStatusData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.94)",
                      border: "1px solid rgba(203, 213, 225, 0.6)",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/50 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Activity Trend</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={activityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                <XAxis dataKey="day" stroke="#6B7280" />
                <YAxis allowDecimals={false} stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.94)",
                    border: "1px solid rgba(203, 213, 225, 0.6)",
                  }}
                />
                <Legend />
                <Bar dataKey="activities" name="Audit activities" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="w-full flex-shrink-0 xl:w-80 mt-8 xl:sticky xl:top-6 xl:self-start xl:mt-0">
        <div className="rounded-2xl border border-white/50 bg-white shadow-lg">
          <div className="p-6 border-b border-gray-200 bg-[#EFF6FF] rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#1E3A8A]" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
          </div>

          <div className="p-4">
            {recentActivity.length === 0 ? (
              <EmptyState
                type="activity"
                title="No Recent Activity"
                message="System activity will appear here once users start interacting with the platform."
              />
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor:
                          activity.type === "submission"
                            ? "#DBEAFE"
                            : activity.type === "approval"
                            ? "#D1FAE5"
                            : "#F3F4F6",
                      }}
                    >
                      {activity.type === "submission" && (
                        <FileCheck className="w-5 h-5 text-[#1E3A8A]" />
                      )}
                      {activity.type === "approval" && (
                        <Award className="w-5 h-5 text-[#10B981]" />
                      )}
                      {activity.type === "system" && (
                        <Shield className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">{activity.action}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{activity.user}</span>
                        <span>•</span>
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <Link
              to="/branchcoordinator/audit-logs"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
            >
              <Activity className="w-4 h-4" />
              View All Activity
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
