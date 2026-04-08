import { useState } from "react";
import {
  Save,
  Bell,
  Mail,
  Shield,
  Database,
  Globe,
  Users,
  FileText,
} from "lucide-react";

export function AdminSettings() {
  const [settings, setSettings] = useState({
    // General Settings
    systemName: "Electron Hub",
    systemEmail: "admin@electronhub.edu",
    timezone: "Asia/Manila",
    language: "en",
    // Enrollment Settings
    enrollmentOpen: true,
    maxApplicationsPerDay: 50,
    autoApproveThreshold: 90,
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    adminAlerts: true,
    // AI Settings
    aiConfidenceThreshold: 75,
    enableAIRecommendations: true,
    autoGenerateReports: true,
  });

  const handleSave = () => {
    console.log("Saving settings:", settings);
    // Add save logic here
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          System Settings
        </h1>
        <p className="text-gray-600">
          Configure your enrollment system preferences
        </p>
      </div>

      <div className="max-w-4xl">
        {/* General Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              General Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Name
              </label>
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) =>
                  setSettings({ ...settings, systemName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Email
              </label>
              <input
                type="email"
                value={settings.systemEmail}
                onChange={(e) =>
                  setSettings({ ...settings, systemEmail: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) =>
                    setSettings({ ...settings, timezone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    setSettings({ ...settings, language: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="tl">Tagalog</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Enrollment Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  Enrollment Period Open
                </p>
                <p className="text-sm text-gray-600">
                  Allow new student applications
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    enrollmentOpen: !settings.enrollmentOpen,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enrollmentOpen ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enrollmentOpen ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Applications Per Day
              </label>
              <input
                type="number"
                value={settings.maxApplicationsPerDay}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxApplicationsPerDay: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Approve Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.autoApproveThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoApproveThreshold: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Automatically approve applications with AI confidence above this
                threshold
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Notification Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    Email Notifications
                  </p>
                  <p className="text-sm text-gray-600">
                    Receive email updates for new applications
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    emailNotifications: !settings.emailNotifications,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-600">
                    Receive SMS alerts for urgent matters
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    smsNotifications: !settings.smsNotifications,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.smsNotifications ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.smsNotifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Admin Alerts</p>
                  <p className="text-sm text-gray-600">
                    Critical system notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    adminAlerts: !settings.adminAlerts,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.adminAlerts ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.adminAlerts ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              AI & Assessment Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Confidence Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.aiConfidenceThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    aiConfidenceThreshold: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum confidence level for AI recommendations
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    Enable AI Recommendations
                  </p>
                  <p className="text-sm text-gray-600">
                    Use AI for strand recommendations
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    enableAIRecommendations: !settings.enableAIRecommendations,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableAIRecommendations
                    ? "bg-blue-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableAIRecommendations
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    Auto-Generate Reports
                  </p>
                  <p className="text-sm text-gray-600">
                    Generate weekly analytics reports
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    autoGenerateReports: !settings.autoGenerateReports,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoGenerateReports ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoGenerateReports
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
