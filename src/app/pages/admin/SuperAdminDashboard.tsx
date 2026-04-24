import {
  Users,
  FileCheck,
  TrendingUp,
  Shield,
  Award,
  AlertCircle,
  Calendar,
  Search,
  Activity,
  BookOpen,
  Settings,
  UserCheck,
  FileText,
  ClipboardCheck,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { EmptyState } from "../../components/EmptyState";
import { getDashboardAnalytics, getAuditLogs } from "../../../services/adminService";

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
    enrolledStudents: 0,
    securityAlerts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentActivity();
  }, []);

  const loadStats = async () => {
    const { data: analytics, error } = await getDashboardAnalytics();
    
    if (error) {
      console.error('Error loading analytics:', error);
      setStats({
        totalStudents: 0,
        pendingApplications: 0,
        enrolledStudents: 0,
        securityAlerts: 0,
      });
      return;
    }

    if (analytics) {
      setStats({
        totalStudents: analytics.enrolledStudents || 0,
        pendingApplications: analytics.pendingEnrollments || 0,
        enrolledStudents: analytics.enrolledStudents || 0,
        securityAlerts: 0,
      });
    }
  };

  const loadRecentActivity = async () => {
    const { data: logs, error } = await getAuditLogs(5);
    
    if (error) {
      console.error('Error loading activity logs:', error);
      setRecentActivity([]);
      return;
    }

    if (logs) {
      const recentLogs = logs.map((log: any) => {
        const timeDiff = Date.now() - new Date(log.timestamp).getTime();
        const minutesAgo = Math.floor(timeDiff / 60000);
        const hoursAgo = Math.floor(timeDiff / 3600000);
        const timeAgo = hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago` : `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
        
        return {
          id: log.id,
          action: log.details,
          user: log.user_name || log.user || 'System',
          timestamp: timeAgo,
          type: log.action.includes('SUBMIT') ? 'submission' : log.action.includes('APPROVE') ? 'approval' : 'system',
        };
      });
      setRecentActivity(recentLogs);
    }
  };

  const statCards = [
    {
      label: "Pending Applications",
      value: stats.pendingApplications.toString(),
      icon: FileCheck,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      link: "/branchcoordinator/pending"
    },
    {
      label: "Enrolled Students",
      value: stats.enrolledStudents.toString(),
      icon: TrendingUp,
      color: "#10B981",
      bgColor: "#D1FAE5",
      link: "/branchcoordinator/students"
    },
    {
      label: "Security Alerts",
      value: stats.securityAlerts.toString(),
      icon: Shield,
      color: "#EF4444",
      bgColor: "#FEE2E2",
      link: "/branchcoordinator/security"
    },
  ];

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
              to="/cashier"
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-500 transition-colors"
            >
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-gray-900">Payment Queue</p>
                <p className="text-xs text-gray-500">Monitor payment processing</p>
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