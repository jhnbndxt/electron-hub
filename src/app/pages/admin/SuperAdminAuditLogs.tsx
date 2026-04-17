import { Search, Filter, Download, Shield, User, Settings, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { getAuditLogs } from "../../../services/adminService";

interface AuditLog {
  id: string | number;
  timestamp: string;
  user: string;
  email?: string;
  userRole?: "Super Admin" | "Admin" | "System";
  action: string;
  category?: "User Management" | "System Config" | "Student Enrollment" | "Security" | "API";
  ipAddress?: string;
  status?: "success" | "failed" | "warning";
  details: string;
}

export function SuperAdminAuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    const { data: logs, error } = await getAuditLogs();
    if (error || !logs) {
      console.error('Error loading audit logs:', error);
      setAllLogs([]);
      return;
    }

    // Map logs from Supabase to the format expected by the UI
    const formattedLogs = logs.map((log: any) => ({
      id: log.id || Math.random().toString(),
      timestamp: log.timestamp || log.created_at || new Date().toISOString(),
      user: log.user_name || log.user || "System",
      email: log.email || '',
      userRole: mapUserRole(log.user_role),
      action: log.action || "Unknown Action",
      category: categorizeAction(log.action, log.details),
      ipAddress: log.ip_address || "N/A",
      status: log.status || "success",
      details: log.details || log.action || "No details available",
    }));

    // Sort by most recent first
    formattedLogs.sort((a: any, b: any) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    setAllLogs(formattedLogs);
  };

  const mapUserRole = (role?: string) => {
    switch (role) {
      case "superadmin":
        return "Super Admin" as const;
      case "registrar":
      case "branchcoordinator":
      case "cashier":
        return "Admin" as const;
      default:
        return "System" as const;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const categorizeAction = (action: string, details: string): string => {
    const actionLower = (action || "").toLowerCase();
    const detailsLower = (details || "").toLowerCase();

    if (actionLower.includes("user") || actionLower.includes("register") || detailsLower.includes("user")) {
      return "User Management";
    }
    if (actionLower.includes("config") || actionLower.includes("system") || actionLower.includes("backup")) {
      return "System Config";
    }
    if (actionLower.includes("document") || actionLower.includes("approve") || actionLower.includes("reject") ||
        actionLower.includes("enroll") || actionLower.includes("application") || detailsLower.includes("student")) {
      return "Student Enrollment";
    }
    if (actionLower.includes("login") || actionLower.includes("security") || actionLower.includes("failed")) {
      return "Security";
    }
    if (actionLower.includes("api") || actionLower.includes("key")) {
      return "API";
    }
    return "System Config";
  };

  // Filter logs
  let filteredLogs = allLogs.filter((log) =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (categoryFilter !== "all") {
    filteredLogs = filteredLogs.filter((log) => log.category === categoryFilter);
  }

  if (statusFilter !== "all") {
    filteredLogs = filteredLogs.filter((log) => log.status === statusFilter);
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "success":
        return {
          bg: "#D1FAE5",
          text: "#065F46",
          border: "#10B981",
        };
      case "failed":
        return {
          bg: "#FEE2E2",
          text: "#991B1B",
          border: "#EF4444",
        };
      case "warning":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          border: "#F59E0B",
        };
      default:
        return {
          bg: "#F3F4F6",
          text: "#374151",
          border: "#D1D5DB",
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "User Management":
        return <User className="w-4 h-4" />;
      case "System Config":
        return <Settings className="w-4 h-4" />;
      case "Student Enrollment":
        return <FileText className="w-4 h-4" />;
      case "Security":
        return <Shield className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="portal-dashboard-page mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Audit Logs
        </h1>
        <p className="text-gray-600">
          Complete system activity and security logs
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
          {/* Search */}
          <div className="relative w-full md:flex-1 md:min-w-[240px]">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              style={{ color: "#374151" }}
            >
              <option value="all">All Categories</option>
              <option value="User Management">User Management</option>
              <option value="System Config">System Config</option>
              <option value="Student Enrollment">Student Enrollment</option>
              <option value="Security">Security</option>
              <option value="API">API</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            style={{ color: "#374151" }}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="warning">Warning</option>
          </select>

          {/* Export Button */}
          <button
            onClick={() => alert("Exporting audit logs...")}
            className="w-full sm:w-auto sm:ml-auto justify-center px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#7C3AED" }}
          >
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Table Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            System Activity Logs
          </h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const statusStyle = getStatusStyle(log.status);
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-mono">
                        {formatTimestamp(log.timestamp)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.user}
                        </p>
                        <p className="text-xs text-gray-500">{log.userRole}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{log.action}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: "#F3E8FF", color: "#7C3AED" }}
                      >
                        {getCategoryIcon(log.category)}
                        {log.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 font-mono">
                        {log.ipAddress}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          borderColor: statusStyle.border,
                        }}
                      >
                        {log.status.charAt(0).toUpperCase() +
                          log.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{log.details}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">{filteredLogs.length}</span> of{" "}
            <span className="font-medium">{allLogs.length}</span> audit logs
          </p>
        </div>
      </div>
    </div>
  );
}
