import { Shield, Lock, Key, AlertTriangle, CheckCircle } from "lucide-react";

export function SecurityPolicies() {
  const securitySettings = [
    {
      category: "Password Policy",
      icon: Lock,
      color: "#7C3AED",
      bgColor: "#F3E8FF",
      policies: [
        { label: "Minimum Length", value: "8 characters", enabled: true },
        { label: "Require Uppercase", value: "Yes", enabled: true },
        { label: "Require Numbers", value: "Yes", enabled: true },
        { label: "Require Special Characters", value: "Yes", enabled: true },
        { label: "Password Expiry", value: "90 days", enabled: true },
        { label: "Password History", value: "Last 5 passwords", enabled: true },
      ],
    },
    {
      category: "Authentication",
      icon: Key,
      color: "#10B981",
      bgColor: "#D1FAE5",
      policies: [
        { label: "Two-Factor Authentication", value: "Required for Admins", enabled: true },
        { label: "Session Timeout", value: "30 minutes", enabled: true },
        { label: "Max Login Attempts", value: "5 attempts", enabled: true },
        { label: "Account Lockout Duration", value: "15 minutes", enabled: true },
        { label: "Single Sign-On (SSO)", value: "Enabled", enabled: true },
      ],
    },
    {
      category: "Access Control",
      icon: Shield,
      color: "#3B82F6",
      bgColor: "#DBEAFE",
      policies: [
        { label: "Role-Based Access Control", value: "Enabled", enabled: true },
        { label: "IP Whitelisting", value: "Disabled", enabled: false },
        { label: "API Rate Limiting", value: "1000 req/hour", enabled: true },
        { label: "Audit Logging", value: "All actions logged", enabled: true },
      ],
    },
    {
      category: "Data Protection",
      icon: AlertTriangle,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      policies: [
        { label: "Data Encryption", value: "AES-256", enabled: true },
        { label: "SSL/TLS", value: "TLS 1.3", enabled: true },
        { label: "Automatic Backups", value: "Daily", enabled: true },
        { label: "Data Retention", value: "7 years", enabled: true },
        { label: "PII Protection", value: "Enabled", enabled: true },
      ],
    },
  ];

  const recentSecurityEvents = [
    {
      id: 1,
      type: "warning",
      message: "3 failed login attempts detected",
      timestamp: "2026-03-26 14:30",
      user: "Unknown (IP: 103.45.67.89)",
    },
    {
      id: 2,
      type: "success",
      message: "Security policy updated",
      timestamp: "2026-03-26 12:15",
      user: "Super Admin",
    },
    {
      id: 3,
      type: "info",
      message: "2FA enabled for admin account",
      timestamp: "2026-03-26 10:45",
      user: "Admin User",
    },
    {
      id: 4,
      type: "warning",
      message: "SSL certificate expiring in 14 days",
      timestamp: "2026-03-26 09:00",
      user: "System",
    },
  ];

  const getEventStyle = (type: string) => {
    switch (type) {
      case "warning":
        return { icon: AlertTriangle, color: "#F59E0B", bgColor: "#FEF3C7" };
      case "success":
        return { icon: CheckCircle, color: "#10B981", bgColor: "#D1FAE5" };
      default:
        return { icon: Shield, color: "#3B82F6", bgColor: "#DBEAFE" };
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Security Policies
        </h1>
        <p className="text-gray-600">
          Manage system-wide security settings and policies
        </p>
      </div>

      {/* Security Status Banner */}
      <div
        className="bg-white rounded-lg border-2 shadow-sm p-6 mb-6"
        style={{ borderColor: "#10B981" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#D1FAE5" }}
          >
            <Shield className="w-8 h-8" style={{ color: "#10B981" }} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Security Status: Strong
            </h2>
            <p className="text-sm text-gray-600">
              All critical security policies are enabled and up to date
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: "#10B981" }}>
              95%
            </p>
            <p className="text-sm text-gray-600">Security Score</p>
          </div>
        </div>
      </div>

      {/* Security Policies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {securitySettings.map((section, index) => {
          const Icon = section.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: section.bgColor }}
                  >
                    <Icon className="w-6 h-6" style={{ color: section.color }} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {section.category}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {section.policies.map((policy, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {policy.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {policy.value}
                        </p>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: policy.enabled ? "#10B981" : "#EF4444",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() =>
                      alert(`Edit ${section.category} settings coming soon`)
                    }
                    className="w-full py-2 rounded-lg font-medium text-sm transition-all hover:bg-gray-100 border border-gray-300"
                    style={{ color: "#374151" }}
                  >
                    Edit Settings
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Security Events */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Security Events
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor security-related activities and alerts
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentSecurityEvents.map((event) => {
              const style = getEventStyle(event.type);
              const EventIcon = style.icon;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: style.bgColor }}
                  >
                    <EventIcon className="w-5 h-5" style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {event.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{event.timestamp}</span>
                      <span>•</span>
                      <span>{event.user}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert("View event details")}
                    className="text-sm font-medium hover:underline flex-shrink-0"
                    style={{ color: "#7C3AED" }}
                  >
                    Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="mt-6 bg-white rounded-lg border border-yellow-200 shadow-sm">
        <div
          className="p-6 border-b border-yellow-200"
          style={{ backgroundColor: "#FFFBEB" }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" style={{ color: "#F59E0B" }} />
            <h2 className="text-xl font-semibold text-gray-900">
              Security Recommendations
            </h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{ backgroundColor: "#FFFBEB" }}
            >
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: "#F59E0B" }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Enable IP Whitelisting
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Restrict admin access to trusted IP addresses only
                </p>
              </div>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#F59E0B" }}
              >
                Enable
              </button>
            </div>
            <div
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{ backgroundColor: "#FFFBEB" }}
            >
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: "#F59E0B" }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Renew SSL Certificate
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Your SSL certificate expires in 14 days
                </p>
              </div>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#F59E0B" }}
              >
                Renew
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
