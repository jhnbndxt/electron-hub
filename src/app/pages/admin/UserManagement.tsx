import { useState, useEffect } from "react";
import { Search, Filter, Plus, Edit2, Trash2, X, Shield, User, Users, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { supabase } from "../../../supabase";

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
  const [selectedRole, setSelectedRole] = useState<"student" | "registrar" | "branchcoordinator" | "cashier" | "superadmin">("student");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { userRole, userData } = useAuth();
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

  // Load users from Supabase
  const [users, setUsers] = useState<UserAccount[]>([]);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      return;
    }

    const formattedUsers = (data || []).map((user: any) => ({
      id: user.id,
      name: user.full_name || user.email,
      email: user.email,
      role: user.role || 'student',
      status: user.status || 'active',
      dateCreated: new Date(user.created_at).toLocaleDateString(),
    }));

    setUsers(formattedUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const visibleUsers = users.filter((user) => user.status !== "inactive");

  // Filter users
  let filteredUsers = visibleUsers.filter(
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
    setSelectedRole(user.role as "student" | "registrar" | "branchcoordinator" | "cashier" | "superadmin");
  };

  const handleSaveChanges = async () => {
    if (editingUser) {
      // Update role in Supabase
      const { error } = await supabase
        .from('users')
        .update({ role: selectedRole, updated_at: new Date().toISOString() })
        .eq('id', editingUser.id);

      if (error) {
        console.error('Error updating user role:', error);
        alert('Failed to update user role');
        return;
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

  const handleConfirmDelete = async () => {
    if (deletingUser) {
      if (deletingUser.id === userData?.id) {
        alert('You cannot deactivate your own account while logged in.');
        return;
      }

      // Deactivate in Supabase instead of deleting the record
      const { error } = await supabase
        .from('users')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', deletingUser.id);

      if (error) {
        console.error('Error deactivating user:', error);
        alert('Failed to deactivate user');
        return;
      }

      const updatedUsers = users.map((user) =>
        user.id === deletingUser.id ? { ...user, status: 'inactive' } : user
      );
      setUsers(updatedUsers);
      
      setDeletingUser(null);
      setShowSuccessToast(true);
      setSuccessMessage("User deactivated successfully!");
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      alert("Please fill in all fields");
      return;
    }

    // Check if user already exists
    const existingUser = users.find((u) => u.email.toLowerCase() === newUserForm.email.toLowerCase());
    
    if (existingUser) {
      alert("A user with this email already exists");
      return;
    }

    // Create new user in Supabase
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: newUserForm.email,
        full_name: newUserForm.name,
        role: newUserForm.role,
        password_hash: newUserForm.password, // Note: In production, hash this server-side
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + error.message);
      return;
    }

    // Reload users from Supabase
    await loadUsers();
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
      case "registrar":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          border: "#FCD34D",
          icon: Shield,
        };
      case "branchcoordinator":
        return {
          bg: "#E0E7FF",
          text: "#3730A3",
          border: "#A5B4FC",
          icon: Users,
        };
      case "cashier":
        return {
          bg: "#D1FAE5",
          text: "#065F46",
          border: "#6EE7B7",
          icon: Shield,
        };
      case "superadmin":
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
      case "registrar":
        return "Registrar";
      case "branchcoordinator":
        return "Branch Coordinator";
      case "cashier":
        return "Cashier";
      case "superadmin":
        return "Super Admin";
      default:
        return role;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            Manage user accounts and access permissions
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200">
              <span className="text-xs font-medium text-blue-700">
                Total Users: {visibleUsers.length}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-green-50 border border-green-200">
              <span className="text-xs font-medium text-green-700">
                Students: {visibleUsers.filter(u => u.role === 'student').length}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-purple-50 border border-purple-200">
              <span className="text-xs font-medium text-purple-700">
                Staff: {visibleUsers.filter(u => u.role !== 'student').length}
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            onClick={() => {
              loadUsers();
              setSuccessMessage("User list refreshed");
              setShowSuccessToast(true);
              setTimeout(() => setShowSuccessToast(false), 2000);
            }}
            className="w-full sm:w-auto justify-center px-4 py-3 rounded-lg border-2 border-gray-300 font-medium transition-all hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={handleAddUser}
            className="w-full sm:w-auto justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center gap-2 shadow-md"
            style={{ backgroundColor: "#1E3A8A" }}
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/70 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex w-full items-center gap-3 lg:w-auto">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:w-auto"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="registrar">Registrar</option>
              <option value="branchcoordinator">Branch Coordinator</option>
              <option value="cashier">Cashier</option>
              {isSuperAdmin && <option value="superadmin">Super Admin</option>}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Created</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No users match the current search and role filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
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
                          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
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
                            className="rounded-lg p-2 transition-colors hover:bg-blue-50"
                            title="Edit user"
                          >
                            <Edit2
                              className="w-4 h-4"
                              style={{ color: "#1E3A8A" }}
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="rounded-lg p-2 transition-colors hover:bg-red-50"
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">{filteredUsers.length}</span> of{" "}
            <span className="font-medium">{visibleUsers.length}</span> users
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
                          title="Deactivate user"
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
                        setSelectedRole(e.target.value as any)
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

                  {/* Registrar Option */}
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="registrar"
                      checked={selectedRole === "registrar"}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as any)
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#1E3A8A" }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Registrar
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Manage applications and verify documents
                      </p>
                    </div>
                  </label>

                  {/* Branch Coordinator Option */}
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="branchcoordinator"
                      checked={selectedRole === "branchcoordinator"}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as any)
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#1E3A8A" }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Branch Coordinator
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Full branch access and user management
                      </p>
                    </div>
                  </label>

                  {/* Cashier Option */}
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="cashier"
                      checked={selectedRole === "cashier"}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as any)
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#1E3A8A" }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Cashier
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Process payments and manage transactions
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
                        setSelectedRole(e.target.value as any)
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#1E3A8A" }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Super Admin
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Full system access across all branches
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
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="registrar">Registrar</option>
                    <option value="branchcoordinator">Branch Coordinator</option>
                    <option value="cashier">Cashier</option>
                    <option value="superadmin">Super Admin</option>
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

      <ConfirmationModal
        isOpen={Boolean(deletingUser)}
        title="Deactivate User"
        message={
          deletingUser
            ? `Deactivate ${deletingUser.name}? Their record will stay in the system, but they will no longer be able to sign in.`
            : ""
        }
        confirmText="Deactivate User"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingUser(null)}
      />

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