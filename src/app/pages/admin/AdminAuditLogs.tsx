import { Search, Filter, Download, FileText, Calendar } from "lucide-react";
import { exportToCSV } from "../../../utils/csvExport";
import { useState, useEffect } from "react";
import { getAuditLogs } from "../../../services/adminService";

interface AuditLog {
  id: string;
  action: string;
  user: string;
  email: string;
  timestamp: string;
  details: string;
  status?: "success" | "failed" | "warning" | "info";
}

export function AdminAuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
  // Date filter state (default: today)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().slice(0, 10);
  });

  // Load audit logs from Supabase
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
    const formatted = logs.map((log: any) => ({
      id: log.id,
      action: log.action || '',
      user: log.user_name || log.user || 'System',
      email: log.email || '',
      timestamp: log.timestamp || log.created_at || new Date().toISOString(),
      details: log.details || '',
      status: log.status || 'success',
    }));
    setAllLogs(formatted);
  };


  // Filter logs by selected date
  let filteredLogs = allLogs.filter((log) => {
    // Date match
    const logDate = new Date(log.timestamp);
    const logDateStr = logDate.toISOString().slice(0, 10);
    return (
      logDateStr === selectedDate &&
      (
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  });

  if (statusFilter !== "all") {
    filteredLogs = filteredLogs.filter((log) => (log.status || "success") === statusFilter);
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
      case "info":
        return {
          bg: "#DBEAFE",
          text: "#1D4ED8",
          border: "#60A5FA",
        };
      default:
        return {
          bg: "#F3F4F6",
          text: "#374151",
          border: "#D1D5DB",
        };
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

  // CSV Export Handler
  const handleExportAuditLogsCSV = () => {
    const headers = [
      "Timestamp",
      "Action",
      "User",
      "Email",
      "Status",
      "Details"
    ];
    const rows = filteredLogs.map(log => [
      formatTimestamp(log.timestamp),
      log.action,
      log.user,
      log.email,
      (log.status || "success").charAt(0).toUpperCase() + (log.status || "success").slice(1),
      log.details
    ]);
    exportToCSV({
      filename: `audit-logs-${selectedDate}`,
      title: "Audit Logs Export",
      subtitle: "Electron Hub - System Activity Logs",
      headers,
      rows,
    });
  };

  return (
    <div className="portal-dashboard-page mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Audit Logs
        </h1>
        <p className="text-gray-600">
          Track all system activities and user actions
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
          {/* Search */}
          <div className="relative w-full md:flex-1 md:min-w-[200px]">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ color: "#374151" }}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadAuditLogs}
            className="w-full sm:w-auto justify-center px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#10B981" }}
          >
            <Download className="w-4 h-4" />
            Refresh
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportAuditLogsCSV}
            className="w-full sm:w-auto justify-center px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#1E3A8A" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1B357D")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#1E3A8A")}
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
            Activity Logs
          </h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
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
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {allLogs.length === 0
                      ? "No activity logs yet. User actions will be tracked here."
                      : "No logs match your search criteria."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const statusStyle = getStatusStyle(log.status || "success");
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
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: "#D1FAE5", color: "#10B981" }}
                        >
                          <FileText className="w-4 h-4" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {log.user}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {log.email}
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
                          {(log.status || "success").charAt(0).toUpperCase() +
                            (log.status || "success").slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{log.details}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">{filteredLogs.length}</span> of{" "}
            <span className="font-medium">{allLogs.length}</span> logs
          </p>
        </div>
      </div>
    </div>
  );
}
