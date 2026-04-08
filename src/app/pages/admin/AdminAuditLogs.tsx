import { Search, Filter, Download, FileText } from "lucide-react";
import { useState, useEffect } from "react";

interface AuditLog {
  id: string;
  action: string;
  user: string;
  email: string;
  timestamp: string;
  details: string;
  status?: "success" | "failed";
}

export function AdminAuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);

  // Load real audit logs from localStorage
  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = () => {
    const logs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
    setAllLogs(logs);
  };

  // Filter logs
  let filteredLogs = allLogs.filter((log) =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="p-8">
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
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ color: "#374151" }}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadAuditLogs}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#10B981" }}
          >
            <Download className="w-4 h-4" />
            Refresh
          </button>

          {/* Export Button */}
          <button
            onClick={() => alert("Exporting audit logs...")}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#10B981" }}
          >
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Activity Logs
          </h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
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
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
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
