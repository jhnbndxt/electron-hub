import { useState } from "react";
import { CheckCircle, UserPlus, Users, RefreshCw } from "lucide-react";

/**
 * USER MANAGEMENT DEMO COMPONENT
 *
 * This component demonstrates the user registration → admin dashboard sync
 * for your Capstone presentation.
 *
 * Usage: Import and add to your App.tsx or use as a standalone test page
 */
export function UserManagementDemo() {
  const [testUser, setTestUser] = useState({
    name: "Joshua Test",
    email: "joshua.test@email.com",
    password: "password123"
  });
  const [registeredCount, setRegisteredCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 9)]);
  };

  const simulateRegistration = () => {
    // Simulate user registration
    const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");

    const newUser = {
      id: `user-${Date.now()}`,
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      role: "student",
      status: "Active",
      dateCreated: new Date().toISOString(),
    };

    registeredUsers.push(newUser);
    localStorage.setItem("registered_users", JSON.stringify(registeredUsers));

    // Trigger storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'registered_users',
      newValue: JSON.stringify(registeredUsers),
      url: window.location.href,
      storageArea: localStorage
    }));

    setRegisteredCount(registeredUsers.length);
    addLog(`✅ Registered: ${testUser.name} (${testUser.email})`);
    addLog(`📊 Total registered users: ${registeredUsers.length}`);
  };

  const checkStorage = () => {
    const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
    setRegisteredCount(registeredUsers.length);
    addLog(`📋 Checked localStorage: ${registeredUsers.length} users found`);

    if (registeredUsers.length > 0) {
      const lastUser = registeredUsers[registeredUsers.length - 1];
      addLog(`👤 Last user: ${lastUser.name} (${lastUser.email})`);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem("registered_users");
    setRegisteredCount(0);
    addLog(`🗑️ Cleared all registered users`);
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#1E3A8A" }}>
            User Management System Demo
          </h1>
          <p className="text-gray-600">
            Test the registration → admin dashboard sync for Capstone presentation
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Registered Users in Storage</p>
              <p className="text-4xl font-bold" style={{ color: "#1E3A8A" }}>
                {registeredCount}
              </p>
            </div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#DBEAFE" }}
            >
              <Users className="w-8 h-8" style={{ color: "#1E3A8A" }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Registration Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" style={{ color: "#1E3A8A" }} />
              Simulate Registration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={testUser.name}
                  onChange={(e) => setTestUser({ ...testUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={testUser.email}
                  onChange={(e) => setTestUser({ ...testUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={testUser.password}
                  onChange={(e) => setTestUser({ ...testUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={simulateRegistration}
                className="w-full px-6 py-3 text-white rounded-lg font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1E3A8A" }}
              >
                <CheckCircle className="w-5 h-5" />
                Register User
              </button>
            </div>
          </div>

          {/* Actions & Logs Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Actions & Logs</h2>

            <div className="space-y-3 mb-6">
              <button
                onClick={checkStorage}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-medium transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Check Storage
              </button>

              <button
                onClick={clearStorage}
                className="w-full px-4 py-2 border-2 border-red-300 rounded-lg font-medium transition-all hover:bg-red-50 flex items-center justify-center gap-2 text-red-600"
              >
                Clear All Users
              </button>
            </div>

            {/* Activity Log */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Activity Log</h3>
              <div
                className="bg-gray-50 rounded-lg p-3 h-64 overflow-y-auto border border-gray-200"
                style={{ fontFamily: "monospace", fontSize: "12px" }}
              >
                {logs.length === 0 ? (
                  <p className="text-gray-400">No activity yet...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-gray-700 mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: "#1E3A8A" }}>
            📋 Demo Instructions for Capstone Panel
          </h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>Step 1:</strong> Click "Check Storage" to see current registered users
            </li>
            <li>
              <strong>Step 2:</strong> Fill in the test user details (or use defaults)
            </li>
            <li>
              <strong>Step 3:</strong> Click "Register User" to simulate account creation
            </li>
            <li>
              <strong>Step 4:</strong> Open Admin Dashboard → User Management in another tab
            </li>
            <li>
              <strong>Step 5:</strong> Watch the toast notification appear and table update
            </li>
            <li>
              <strong>Step 6:</strong> Login credentials: <code className="bg-white px-2 py-0.5 rounded">{testUser.email}</code> / <code className="bg-white px-2 py-0.5 rounded">{testUser.password}</code>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
