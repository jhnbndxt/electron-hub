import { Key, Plus, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface APIKey {
  id: number;
  name: string;
  key: string;
  createdDate: string;
  lastUsed: string;
  status: "active" | "inactive";
  permissions: string[];
}

export function IntegrationsAPIs() {
  const [showKeys, setShowKeys] = useState<{ [key: number]: boolean }>({});

  const apiKeys: APIKey[] = [
    {
      id: 1,
      name: "Student Portal API",
      key: "elk_live_sk_1a2b3c4d5e6f7g8h9i0j",
      createdDate: "2026-03-01",
      lastUsed: "2026-03-26 14:30",
      status: "active",
      permissions: ["read:students", "write:students", "read:enrollments"],
    },
    {
      id: 2,
      name: "External Assessment Tool",
      key: "elk_live_sk_9z8y7x6w5v4u3t2s1r0q",
      createdDate: "2026-02-15",
      lastUsed: "2026-03-25 16:45",
      status: "active",
      permissions: ["read:assessments", "write:results"],
    },
    {
      id: 3,
      name: "Legacy System Integration",
      key: "elk_test_sk_abcdefghijklmnopqrst",
      createdDate: "2026-01-20",
      lastUsed: "2026-02-10 09:15",
      status: "inactive",
      permissions: ["read:students"],
    },
  ];

  const toggleKeyVisibility = (id: number) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskApiKey = (key: string) => {
    return `${key.substring(0, 12)}${"•".repeat(20)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("API key copied to clipboard!");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Integrations & APIs
        </h1>
        <p className="text-gray-600">
          Manage external integrations and API access keys
        </p>
      </div>

      {/* API Keys Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#F3E8FF" }}
              >
                <Key className="w-6 h-6" style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
                <p className="text-sm text-gray-600">
                  Manage API access keys for external applications
                </p>
              </div>
            </div>
            <button
              onClick={() => alert("Create new API key functionality coming soon")}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: "#7C3AED" }}
            >
              <Plus className="w-4 h-4" />
              Create New Key
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {apiKey.name}
                      </h3>
                      <span
                        className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor:
                            apiKey.status === "active" ? "#D1FAE5" : "#FEE2E2",
                          color:
                            apiKey.status === "active" ? "#065F46" : "#991B1B",
                        }}
                      >
                        {apiKey.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {apiKey.createdDate}</span>
                      <span>Last used: {apiKey.lastUsed}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert("Delete API key")}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm">
                    <span className="flex-1 text-gray-900">
                      {showKeys[apiKey.id] ? apiKey.key : maskApiKey(apiKey.key)}
                    </span>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {showKeys[apiKey.id] ? (
                        <EyeOff className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey.key)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Permissions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {apiKey.permissions.map((permission, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: "#F3E8FF", color: "#7C3AED" }}
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
