import { useState, useEffect } from "react";
import { Search, Filter, Plus, Edit2, Trash2, X, Shield, User, Users, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  dateCreated: string;
}

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [selectedRole, setSelectedRole] = useState<"student" | "admin" | "superadmin">("student");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { userRole } = useAuth();
  const location = useLocation();

  // Form state for adding new user
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    role: "student",
    password: "",
  });

  // Determine if we're in super admin context
  const isSuperAdmin = userRole === "superadmin" || location.pathname.startsWith("/superadmin");

  // Load users from localStorage and combine with hardcoded system users
  const [users, setUsers] = useState<UserAccount[]>([]);

  const loadUsers = () => {
    // Load registered users from localStorage
    const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
    
    console.log("Loading users from localStorage:", registeredUsers);
    
    // Ensure all registered users have unique IDs and proper role
    const uniqueRegisteredUsers = registeredUsers.map((user: any, index: number) => {
      const userId = user.id && !user.id.startsWith("user-001") 
        ? user.id 
        : `user-${user.email.split('@')[0]}-${Date.now()}-${index}`;
      
      return {
        ...user,
        id: userId,
        role: user.role || "student", // Default to student if no role
        status: user.status || "Active",
        dateCreated: user.dateCreated || new Date().toISOString(),
      };
    });
    
    console.log("Processed registered users:", uniqueRegisteredUsers);
    
    // Update localStorage with unique IDs
    localStorage.setItem("registered_users", JSON.stringify(uniqueRegisteredUsers));
    
    // System administrators (always present)
    const systemUsers: UserAccount[] = [
      {
        id: "sys-001",
        name: "Super Administrator",
        email: "electronsuperadmin@gmail.com",
        role: "superadmin",
        status: "Active",
        dateCreated: "December 1, 2025",
      },
      {
        id: "sys-002",
        name: "System Admin",
        email: "electronadmin@gmail.com",
        role: "admin",
        status: "Active",
        dateCreated: "December 15, 2025",
      },
      {
        id: "sys-003",
        name: "Joshua",
        email: "joshua@gmail.com",
        role: "student",
        status: "Active",
        dateCreated: "December 1, 2025",
      },
    ];

    // Combine system users and registered users
    const allUsers = [...systemUsers, ...uniqueRegisteredUsers];
    console.log("All users combined:", allUsers);
    setUsers(allUsers);
  };

  useEffect(() => {
    loadUsers();

    // Listen for storage changes (when a new user registers)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'registered_users') {
        loadUsers();

        // Show toast notification when new user registers
        const newUsers = JSON.parse(e.newValue || '[]');
        const oldUsers = JSON.parse(e.oldValue || '[]');
        if (newUsers.length > oldUsers.length) {
          const addedCount = newUsers.length - oldUsers.length;
          setSuccessMessage(`${addedCount} New User${addedCount > 1 ? 's' : ''} Registered`);
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 5000);
        }
      }
    };

    // Listen for custom storage events (same window)
    const handleCustomStorageChange = (e: Event) => {
      if (e instanceof StorageEvent && e.key === 'registered_users') {
        loadUsers();

        // Show toast notification
        const newUsers = JSON.parse(e.newValue || '[]');
        const oldUsers = JSON.parse(localStorage.getItem('registered_users_prev') || '[]');
        if (newUsers.length > oldUsers.length) {
          const addedCount = newUsers.length - oldUsers.length;
          setSuccessMessage(`${addedCount} New User${addedCount > 1 ? 's' : ''} Registered`);
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 5000);
        }
        localStorage.setItem('registered_users_prev', e.newValue || '[]');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage', handleCustomStorageChange);

    // Store initial state for comparison
    localStorage.setItem('registered_users_prev', localStorage.getItem('registered_users') || '[]');

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage', handleCustomStorageChange);
    };
  }, []);

  // Filter users
  let filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by role
  if (roleFilter !== "all") {
    filteredUsers = filteredUsers.filter((user) => 
      user.role.toLowerCase() === roleFilter.toLowerCase()
    );
  }

  const handleEditClick = (user: UserAccount) => {
    setEditingUser(user);
    setSelectedRole(user.role as "student" | "admin" | "superadmin");
  };

  const handleSaveChanges = () => {
    if (editingUser) {
      // Update localStorage for non-system users
      if (!editingUser.id.startsWith('sys-')) {
        const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
        const updatedRegisteredUsers = registeredUsers.map((user: any) =>
          user.id === editingUser.id ? { ...user, role: selectedRole } : user
        );
        localStorage.setItem("registered_users", JSON.stringify(updatedRegisteredUsers));
      }

      // Update UI
      const updatedUsers = users.map((user) =>
        user.id === editingUser.id ? { ...user, role: selectedRole } : user
      );
      setUsers(updatedUsers);
      setEditingUser(null);
      setShowSuccessToast(true);
      setSuccessMessage("User role updated successfully!");
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const handleDeleteUser = (user: UserAccount) => {
    setDeletingUser(user);
  };

  const handleConfirmDelete = () => {
    if (deletingUser) {
      const updatedUsers = users.filter((user) => user.id !== deletingUser.id);
      setUsers(updatedUsers);
      
      // Also remove from localStorage if it's a registered user (not system admin)
      if (!deletingUser.id.startsWith('sys-')) {
        const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
        const updatedRegisteredUsers = registeredUsers.filter((user: any) => user.id !== deletingUser.id);
        localStorage.setItem("registered_users", JSON.stringify(updatedRegisteredUsers));
      }
      
      setDeletingUser(null);
      setShowSuccessToast(true);
      setSuccessMessage("User deleted successfully!");
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const handleAddUser = () => {
    setShowAddModal(true);
    setNewUserForm({
      name: "",
      email: "",
      role: "student",
      password: "",
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      alert("Please fill in all fields");
      return;
    }

    // Check if user already exists
    const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
    const existingUser = registeredUsers.find((u: any) => u.email.toLowerCase() === newUserForm.email.toLowerCase());
    
    if (existingUser) {
      alert("A user with this email already exists");
      return;
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      name: newUserForm.name,
      email: newUserForm.email,
      role: newUserForm.role,
      password: newUserForm.password,
      status: "Active",
      dateCreated: new Date().toISOString(),
    };

    // Add to localStorage
    registeredUsers.push(newUser);
    localStorage.setItem("registered_users", JSON.stringify(registeredUsers));

    // Update UI
    const systemUsers: UserAccount[] = [
      {
        id: "sys-001",
        name: "Super Administrator",
        email: "electronsuperadmin@gmail.com",
        role: "superadmin",
        status: "Active",
        dateCreated: "December 1, 2025",
      },
      {
        id: "sys-002",
        name: "System Admin",
        email: "electronadmin@gmail.com",
        role: "admin",
        status: "Active",
        dateCreated: "December 15, 2025",
      },
      {
        id: "sys-003",
        name: "Joshua",
        email: "joshua@gmail.com",
        role: "student",
        status: "Active",
        dateCreated: "December 1, 2025",
      },
    ];

    setUsers([...systemUsers, ...registeredUsers]);
    setShowAddModal(false);
    setSuccessMessage("User created successfully!");
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    
    // Reset form
    setNewUserForm({
      name: "",
      email: "",
      role: "student",
      password: "",
    });
  };

  const getRoleStyle = (role: string) => {
    const roleLower = role.toLowerCase();
    switch (roleLower) {
      case "student":
        return {
          bg: "#DBEAFE",
          text: "#1E40AF",
          border: "#93C5FD",
          icon: User,
        };
      case "admin":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          border: "#FCD34D",
          icon: Shield,
        };
      case "superadmin":
      case "super admin":
        return {
          bg: "#FEE2E2",
          text: "#991B1B",
          border: "#FCA5A5",
          icon: Users,
        };
      default:
        return {
          bg: "#F3F4F6",
          text: "#374151",
          border: "#D1D5DB",
          icon: User,
        };
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case "student":
        return "Student";
      case "admin":
        return "Admin";
      case "superadmin":
        return "Super Admin";
      default:
        return role;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            Manage user accounts and access permissions
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200">
              <span className="text-xs font-medium text-blue-700">
                Total Users: {users.length}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-green-50 border border-green-200">
              <span className="text-xs font-medium text-green-700">
                Registered: {users.filter(u => !u.id.startsWith('sys-')).length}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-purple-50 border border-purple-200">
              <span className="text-xs font-medium text-purple-700">
                System: {users.filter(u => u.id.startsWith('sys-')).length}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              loadUsers();
              setSuccessMessage("User list refreshed");
              setShowSuccessToast(true);
              setTimeout(() => setShowSuccessToast(false), 2000);
            }}
            className="px-4 py-3 rounded-lg border-2 border-gray-300 font-medium transition-all hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={handleAddUser}
            className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center gap-2 shadow-md"
            style={{ backgroundColor: "#1E3A8A" }}
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ color: "#374151" }}
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            User Accounts
          </h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date Created
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const roleStyle = getRoleStyle(user.role);
                const RoleIcon = roleStyle.icon;
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: roleStyle.bg,
                          color: roleStyle.text,
                          borderColor: roleStyle.border,
                        }}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {new Date(user.dateCreated).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit2
                            className="w-4 h-4"
                            style={{ color: "#1E3A8A" }}
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2
                            className="w-4 h-4"
                            style={{ color: "#B91C1C" }}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">{filteredUsers.length}</span> of{" "}
            <span className="font-medium">{users.length}</span> users
          </p>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)"
          }}
          onClick={() => setEditingUser(null)}
        >
          <div
            className="bg-white shadow-2xl max-w-md w-full"
            style={{ borderRadius: "12px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-6 border-b border-gray-200"
              style={{ backgroundColor: "#F8FAFC" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Edit User Role
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {editingUser.name}
                  </p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="w-10 h-10 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* User Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Email Address</p>
                <p className="text-sm font-medium text-gray-900">
                  {editingUser.email}
                </p>
              </div>

              {/* Role Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Select Role
                </h3>
                <div className="space-y-3">
                  {/* Student Option */}
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      checked={selectedRole === "student"}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as "student" | "admin" | "superadmin")
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#1E3A8A" }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Student
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Basic access to dashboard and assessment
                      </p>
                    </div>
                  </label>

                  {/* Admin Option */}
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={selectedRole === "admin"}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as "student" | "admin" | "superadmin")
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#1E3A8A" }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Admin
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Manage applications and view reports
                      </p>
                    </div>
                  </label>

                  {/* Superadmin Option */}
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="superadmin"
                      checked={selectedRole === "superadmin"}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as "student" | "admin" | "superadmin")
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#1E3A8A" }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Superadmin
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Full system access and user management
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-6 py-3 rounded-lg font-medium transition-all hover:bg-gray-100 border border-gray-300"
                  style={{ color: "#475569" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="flex-1 px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 shadow-md"
                  style={{ backgroundColor: "#1E3A8A" }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)"
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white shadow-2xl max-w-md w-full"
            style={{ borderRadius: "12px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-6 border-b border-gray-200"
              style={{ backgroundColor: "#F8FAFC" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Add New User
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form className="space-y-4" onSubmit={handleCreateUser}>
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as "student" | "admin" | "superadmin" })}
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 rounded-lg font-medium transition-all hover:bg-gray-100 border border-gray-300"
                    style={{ color: "#475569" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 shadow-md"
                    style={{ backgroundColor: "#1E3A8A" }}
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)"
          }}
          onClick={() => setDeletingUser(null)}
        >
          <div
            className="bg-white shadow-2xl max-w-md w-full"
            style={{ borderRadius: "12px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-6 border-b border-gray-200"
              style={{ backgroundColor: "#F8FAFC" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Delete User
                </h2>
                <button
                  onClick={() => setDeletingUser(null)}
                  className="w-10 h-10 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete the user{" "}
                  <span className="font-medium">{deletingUser.name}</span>?
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 px-6 py-3 rounded-lg font-medium transition-all hover:bg-gray-100 border border-gray-300"
                  style={{ color: "#475569" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 shadow-md"
                  style={{ backgroundColor: "#B91C1C" }}
                  onClick={handleConfirmDelete}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div
          className="fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border-2 animate-slideInDown z-50 min-w-[320px]"
          style={{
            backgroundColor: "#DBEAFE",
            borderColor: "#1E3A8A"
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#1E3A8A" }}
          >
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{successMessage}</p>
            <p className="text-xs text-gray-700 mt-0.5">User database has been updated</p>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="p-1 hover:bg-blue-200 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideInDown {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slideInDown {
          animation: slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-slideInUp {
          animation: slideInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}