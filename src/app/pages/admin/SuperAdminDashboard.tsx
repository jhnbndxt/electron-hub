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
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { EmptyState } from "../../components/EmptyState";
import { getDashboardAnalytics, getAuditLogs } from "../../../services/adminService";
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
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentActivity();
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
      });
    }
  };

  const loadRecentActivity = async () => {
    const { data: logs, error } = await getAuditLogs(5);

    if (error) {
      console.error("Error loading activity logs:", error);
      setRecentActivity([]);
      return;
    }

    if (logs) {
      const recentLogs = logs.map((log: any) => {
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
      label: "Active Users/Admins",
      value: stats.activeUsersAdmins.toString(),
      icon: Activity,
      color: "#8B5CF6",
    },
  ];

  const quickActions = [
    {
      label: "Review Applications",
      description: "Manage pending enrollments",
      icon: FileCheck,
      color: "#1E3A8A",
      link: "/branchcoordinator/pending",
    },
    {
      label: "Approve Payments",
      description: "Review payment approvals",
      icon: DollarSign,
      color: "#EF4444",
      link: "/branchcoordinator/payments",
    },
    {
      label: "Student Records",
      description: "View all enrolled students",
      icon: BookOpen,
      color: "#8B5CF6",
      link: "/branchcoordinator/students",
    },
    {
      label: "Section Management",
      description: "Update class sections and assignments",
      icon: FileText,
      color: "#F59E0B",
      link: "/branchcoordinator/sections",
    },
    {
      label: "Assessment Management",
      description: "Manage assessment questions",
      icon: Award,
      color: "#1E40AF",
      link: "/branchcoordinator/assessment-management",
    },
    {
      label: "User Management",
      description: "Manage admin roles and access",
      icon: UserCheck,
      color: "#10B981",
      link: "/branchcoordinator/users",
    },
    {
      label: "Audit Logs",
      description: "Review system activity and events",
      icon: ClipboardCheck,
      color: "#F97316",
      link: "/branchcoordinator/audit-logs",
    },
    {
      label: "System Configuration",
      description: "Configure portal settings",
      icon: Settings,
      color: "#0EA5E9",
      link: "/branchcoordinator/system-configuration",
    },
  ];

  const paymentCollectionData = [
    { day: "Mon", amount: 4200 },
    { day: "Tue", amount: 5100 },
    { day: "Wed", amount: 3900 },
    { day: "Thu", amount: 6200 },
    { day: "Fri", amount: 7000 },
    { day: "Sat", amount: 5600 },
    { day: "Sun", amount: 4500 },
  ];

  const applicationStatusData = [
    { status: "Pending", count: stats.pendingApplications, color: "#F59E0B" },
    { status: "Approved", count: stats.paymentsApproved, color: "#10B981" },
    { status: "Rejected", count: Math.max(0, stats.totalStudents - stats.pendingApplications - stats.paymentsApproved), color: "#EF4444" },
  ];

  const dailyActivityData = [
    { time: "12 AM", users: 45 },
    { time: "4 AM", users: 32 },
    { time: "8 AM", users: 120 },
    { time: "12 PM", users: 280 },
    { time: "4 PM", users: 350 },
    { time: "8 PM", users: 220 },
    { time: "11 PM", users: 85 },
  ];

  return (
    <div
      className="portal-dashboard-page flex flex-col gap-6 p-4 sm:p-6 lg:p-8 xl:flex-row w-full"
      style={{ maxWidth: "none" }}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between w-full">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, Branch Coordinator
            </h1>
            <p className="text-gray-600">System overview and administrative controls</p>
          </div>
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
        </div>

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

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="group rounded-2xl border border-white/50 bg-white p-4 shadow-md transition-all hover:shadow-xl"
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: action.color }} />
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1">{action.label}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Charts & Reports</h2>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity Count</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dailyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                <XAxis dataKey="time" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.94)",
                    border: "1px solid rgba(203, 213, 225, 0.6)",
                  }}
                />
                <Legend />
                <Bar dataKey="users" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="w-full flex-shrink-0 xl:w-80 mt-8 xl:mt-0">
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
  return (
    <div className="portal-dashboard-page flex flex-col gap-6 p-4 sm:p-6 lg:p-8 xl:flex-row w-full" style={{ maxWidth: "none" }}>
      {/* Main Content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between w-full">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, Branch Coordinator
            </h1>
            <p className="text-gray-600">
              System overview and administrative controls
            </p>
          </div>
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
        </div>

        {/* Section Header */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link
                key={index}
                to={stat.link}
                className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: stat.color }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
              </Link>
            );
          })}
        </div>

        {/* Section Header */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 mb-8 overflow-x-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <Link
              to="/branchcoordinator/pending"
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
            >
              <FileCheck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Review Applications</p>
                <p className="text-xs text-gray-500">Manage pending enrollments</p>
              </div>
            </Link>
            <Link
              to="/branchcoordinator/assessment-management"
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-colors"
            >
              <Award className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Assessment Management</p>
                <p className="text-xs text-gray-500">Edit assessment questions</p>
              </div>
            </Link>
            <Link
              to="/branchcoordinator/system-configuration"
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 transition-colors"
            >
              <Settings className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">System Configuration</p>
                <p className="text-xs text-gray-500">Manage system settings</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Management Tools Grid */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Management Tools</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          {/* Student Management */}
          <Link
            to="/branchcoordinator/students"
            className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Student Management
                </h3>
                <p className="text-sm text-gray-600">
                  View all students, manage enrollments, and track academic records
                </p>
              </div>
            </div>
          </Link>

          {/* Reports & Analytics */}
          <Link
            to="/branchcoordinator/students"
            className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Student Records
                </h3>
                <p className="text-sm text-gray-600">
                  View all students, manage enrollments, and track academic records
                </p>
              </div>
            </div>
          </Link>

          {/* User Management */}
          <Link
            to="/branchcoordinator/users"
            className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  User Management
                </h3>
                <p className="text-sm text-gray-600">
                  Manage admin accounts, roles, and permissions
                </p>
              </div>
            </div>
          </Link>

          {/* Audit Logs */}
          <Link
            to="/branchcoordinator/audit-logs"
            className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Audit Logs
                </h3>
                <p className="text-sm text-gray-600">
                  Review system activity logs and security events
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* System Status Banner */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded flex flex-col sm:flex-row items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900 mb-1">All Systems Operational</p>
            <p className="text-sm text-green-800">
              All services are running smoothly. Last backup completed successfully.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Sidebar */}
      <div className="w-full flex-shrink-0 xl:w-80 mt-8 xl:mt-0">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm xl:sticky xl:top-8">
          <div className="p-6 border-b border-gray-200" style={{ backgroundColor: "#EFF6FF" }}>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" style={{ color: "#1E3A8A" }} />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
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
                    className="flex gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
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
                        <FileCheck className="w-5 h-5 text-blue-600" />
                      )}
                      {activity.type === "approval" && (
                        <Award className="w-5 h-5 text-green-600" />
                      )}
                      {activity.type === "system" && (
                        <Shield className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {activity.action}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">{activity.user}</p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Link
              to="/branchcoordinator/audit-logs"
              className="w-full px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: "#1E3A8A" }}
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