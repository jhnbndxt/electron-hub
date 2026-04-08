import { Settings, Server, Database, Globe, Bell, Shield } from "lucide-react";

export function SystemConfiguration() {
  const configSections = [
    {
      title: "General Settings",
      icon: Settings,
      color: "#7C3AED",
      bgColor: "#F3E8FF",
      settings: [
        { label: "Institution Name", value: "Electron College of Technological Education" },
        { label: "System Timezone", value: "Asia/Manila (UTC+8)" },
        { label: "Academic Year", value: "2026-2027" },
        { label: "Enrollment Period", value: "March 1 - April 30, 2026" },
      ],
    },
    {
      title: "Server Configuration",
      icon: Server,
      color: "#10B981",
      bgColor: "#D1FAE5",
      settings: [
        { label: "Server Environment", value: "Production" },
        { label: "API Version", value: "v2.1.5" },
        { label: "Max Upload Size", value: "25 MB" },
        { label: "Session Timeout", value: "30 minutes" },
      ],
    },
    {
      title: "Database Settings",
      icon: Database,
      color: "#3B82F6",
      bgColor: "#DBEAFE",
      settings: [
        { label: "Database Type", value: "PostgreSQL 15.2" },
        { label: "Backup Schedule", value: "Daily at 2:00 AM" },
        { label: "Retention Period", value: "30 days" },
        { label: "Connection Pool Size", value: "100" },
      ],
    },
    {
      title: "Email Configuration",
      icon: Globe,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      settings: [
        { label: "SMTP Server", value: "smtp.electronhub.edu.ph" },
        { label: "Port", value: "587 (TLS)" },
        { label: "Sender Email", value: "noreply@electronhub.edu.ph" },
        { label: "Daily Send Limit", value: "10,000" },
      ],
    },
    {
      title: "Notification Settings",
      icon: Bell,
      color: "#EF4444",
      bgColor: "#FEE2E2",
      settings: [
        { label: "Student Notifications", value: "Enabled" },
        { label: "Admin Alerts", value: "Enabled" },
        { label: "SMS Notifications", value: "Enabled" },
        { label: "Push Notifications", value: "Disabled" },
      ],
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          System Configuration
        </h1>
        <p className="text-gray-600">
          Manage system-wide settings and configurations
        </p>
      </div>

      {/* Configuration Sections */}
      <div className="space-y-6">
        {configSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              {/* Section Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: section.bgColor }}
                  >
                    <Icon className="w-6 h-6" style={{ color: section.color }} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {section.title}
                  </h2>
                </div>
              </div>

              {/* Settings Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.settings.map((setting, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {setting.label}
                      </span>
                      <span className="text-sm text-gray-900 font-semibold">
                        {setting.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => alert("Edit configuration functionality coming soon")}
                    className="px-6 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: "#7C3AED" }}
                  >
                    Edit Configuration
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Settings */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <Shield className="w-6 h-6" style={{ color: "#EF4444" }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Advanced Settings
              </h2>
              <p className="text-sm text-gray-600">
                Critical system configurations - modify with caution
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-xs text-gray-500">Disable access for all non-admin users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Debug Mode</p>
                <p className="text-xs text-gray-500">Enable detailed error logging</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
