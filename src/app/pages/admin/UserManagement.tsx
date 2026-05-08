import { useState, useEffect } from "react";
import { Search, Filter, Plus, Edit2, Trash2, X, Shield, User, Users, CheckCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import bcrypt from "bcryptjs";
import { LoadingState } from "../../components/LoadingState";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { supabase } from "../../../supabase";
import { registerUser } from "../../../services/authService";
import { createAuditLog } from "../../../services/adminService";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  dateCreated: string;
}

type CreatableRole = "student" | "registrar" | "branchcoordinator" | "cashier";

type AddUserForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  sex: string;
  birthDate: string;
  contactNumber: string;
  email: string;
  role: CreatableRole;
  password: string;
  confirmPassword: string;
};

type AddUserField = keyof AddUserForm;

const initialAddUserForm: AddUserForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  sex: "",
  birthDate: "",
  contactNumber: "",
  email: "",
  role: "student",
  password: "",
  confirmPassword: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_NUMBER_PATTERN = /^(09\d{9}|\+639\d{9})$/;
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*$/u;
const STAFF_ROLES: CreatableRole[] = ["registrar", "branchcoordinator", "cashier"];

const getPasswordRequirements = (password: string) => {
  const missingRequirements: string[] = [];
  if (password.length < 8) missingRequirements.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) missingRequirements.push("one uppercase letter");
  if (!/[a-z]/.test(password)) missingRequirements.push("one lowercase letter");
  if (!/\d/.test(password)) missingRequirements.push("one number");
  if (!/[^A-Za-z0-9]/.test(password)) missingRequirements.push("one special character");
  return missingRequirements;
};

const formatRequirementList = (requirements: string[]) => {
  if (requirements.length === 1) return requirements[0];
  if (requirements.length === 2) return `${requirements[0]} and ${requirements[1]}`;
  return `${requirements.slice(0, -1).join(", ")}, and ${requirements[requirements.length - 1]}`;
};

const getAddUserFieldError = (field: AddUserField, form: AddUserForm) => {
  const isStudent = form.role === "student";

  switch (field) {
    case "firstName": {
      const value = form.firstName.trim();
      if (!value) return "Enter a first name.";
      if (value.length < 2) return "First name must be at least 2 characters long.";
      if (!NAME_PATTERN.test(value)) return "First name can only include letters, spaces, apostrophes, periods, and hyphens.";
      return "";
    }
    case "middleName": {
      const value = form.middleName.trim();
      if (value && !NAME_PATTERN.test(value)) return "Middle name can only include letters, spaces, apostrophes, periods, and hyphens.";
      return "";
    }
    case "lastName": {
      const value = form.lastName.trim();
      if (!value) return "Enter a last name.";
      if (value.length < 2) return "Last name must be at least 2 characters long.";
      if (!NAME_PATTERN.test(value)) return "Last name can only include letters, spaces, apostrophes, periods, and hyphens.";
      return "";
    }
    case "sex": {
      if (isStudent && !form.sex) return "Select sex.";
      return "";
    }
    case "birthDate": {
      const value = form.birthDate.trim();
      if (!isStudent) return "";
      if (!value) return "Enter date of birth.";
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (Number.isNaN(birthDate.getTime()) || birthDate > today || age > 120) {
        return "Please enter a valid date of birth.";
      }
      return "";
    }
    case "contactNumber": {
      const value = form.contactNumber.trim();
      if (!isStudent) return "";
      if (!value) return "Enter contact number.";
      if (!CONTACT_NUMBER_PATTERN.test(value)) return "Use 09XXXXXXXXX or +639XXXXXXXXX.";
      return "";
    }
    case "email": {
      const value = form.email.trim();
      if (!value) return "Enter an email address.";
      if (!EMAIL_PATTERN.test(value)) return "Use a valid email format like name@example.com.";
      return "";
    }
    case "role": {
      if (!["student", ...STAFF_ROLES].includes(form.role)) return "Select a permitted role.";
      return "";
    }
    case "password": {
      if (!form.password) return "Enter a password.";
      const missingRequirements = getPasswordRequirements(form.password);
      if (missingRequirements.length > 0) return `Password must include ${formatRequirementList(missingRequirements)}.`;
      return "";
    }
    case "confirmPassword": {
      if (!isStudent) return "";
      if (!form.confirmPassword) return "Confirm the password.";
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
      return "";
    }
    default:
      return "";
  }
};

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [selectedRole, setSelectedRole] = useState<"student" | "registrar" | "branchcoordinator" | "cashier" | "superadmin">("student");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touchedAddUserFields, setTouchedAddUserFields] = useState<Partial<Record<AddUserField, boolean>>>({});
  const { userRole, userData } = useAuth();
  const location = useLocation();

  // Form state for adding new user
  const [newUserForm, setNewUserForm] = useState<AddUserForm>(initialAddUserForm);

  // Determine if we're in super admin context
  const isSuperAdmin = userRole === "superadmin" || location.pathname.startsWith("/superadmin");
  const canCreateUsers = userRole === "branchcoordinator";
  const isStudentAddForm = newUserForm.role === "student";
  const addUserErrors = (Object.keys(initialAddUserForm) as AddUserField[]).reduce((errors, field) => {
    errors[field] = getAddUserFieldError(field, newUserForm);
    return errors;
  }, {} as Record<AddUserField, string>);
  const isAddUserFormValid = (Object.keys(addUserErrors) as AddUserField[]).every((field) => !addUserErrors[field]);

  // Load users from Supabase
  const [users, setUsers] = useState<UserAccount[]>([]);

  const loadUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setIsLoading(false);
      return;
    }

    if (!data) {
      setUsers([]);
      setIsLoading(false);
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
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 4000);
  };

  const setAddUserFieldTouched = (field: AddUserField) => {
    setTouchedAddUserFields((current) => ({ ...current, [field]: true }));
  };

  const getVisibleAddUserError = (field: AddUserField) => {
    return touchedAddUserFields[field] ? addUserErrors[field] : "";
  };

  const getAddUserInputClassName = (field: AddUserField) => {
    const hasError = Boolean(getVisibleAddUserError(field));
    return `w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      hasError ? "border-red-300 bg-red-50" : "border-gray-300"
    }`;
  };

  const updateAddUserField = (field: AddUserField, value: string) => {
    const nextValue = field === "email" ? value.trimStart().toLowerCase() : value;
    setNewUserForm((current) => ({
      ...current,
      [field]: nextValue,
      ...(field === "role" && value !== "student"
        ? { sex: "", birthDate: "", contactNumber: "", confirmPassword: "" }
        : {}),
    }));
    setAddUserFieldTouched(field);
  };

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
    if (!canCreateUsers) {
      showError("Only Branch Coordinator accounts can create users.");
      return;
    }

    setShowAddModal(true);
    setNewUserForm(initialAddUserForm);
    setTouchedAddUserFields({});
    setShowPassword(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreateUsers) {
      showError("Only Branch Coordinator accounts can create users.");
      return;
    }

    setTouchedAddUserFields(
      (Object.keys(initialAddUserForm) as AddUserField[]).reduce((fields, field) => {
        fields[field] = true;
        return fields;
      }, {} as Partial<Record<AddUserField, boolean>>)
    );

    const firstValidationError = (Object.keys(addUserErrors) as AddUserField[])
      .map((field) => addUserErrors[field])
      .find(Boolean);

    if (firstValidationError) {
      showError(firstValidationError);
      return;
    }

    setIsCreatingUser(true);

    try {
      const normalizedEmail = newUserForm.email.trim().toLowerCase();
      const firstName = newUserForm.firstName.trim();
      const middleName = newUserForm.middleName.trim();
      const lastName = newUserForm.lastName.trim();
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

      const { data: existingUser, error: duplicateCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (duplicateCheckError) {
        showError(duplicateCheckError.message || "Unable to verify email availability.");
        return;
      }

      if (existingUser) {
        showError("A user with this email already exists.");
        return;
      }

      let createdUser: any = null;

      if (newUserForm.role === "student") {
        const { error: registerError, user } = await registerUser(
          normalizedEmail,
          newUserForm.password,
          {
            firstName,
            lastName,
            middleName: middleName || null,
            sex: newUserForm.sex,
            birthDate: newUserForm.birthDate.trim(),
            contactNumber: newUserForm.contactNumber.trim(),
          }
        );

        if (registerError || !user) {
          showError(registerError || "Unable to create student account.");
          return;
        }

        createdUser = user;
      } else {
        const passwordHash = await bcrypt.hash(newUserForm.password, 10);
        const { data, error } = await supabase
          .from("users")
          .insert({
            email: normalizedEmail,
            password_hash: passwordHash,
            full_name: fullName,
            first_name: firstName,
            middle_name: middleName || null,
            last_name: lastName,
            role: newUserForm.role,
            admin_type: newUserForm.role,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          showError(error.message || "Unable to create staff account.");
          return;
        }

        createdUser = data;
      }

      await createAuditLog(
        userData?.id || userData?.email || "system",
        "USER_ACCOUNT_CREATED",
        `Created ${getRoleLabel(newUserForm.role)} account for ${fullName} (${normalizedEmail}).`,
        "success",
        {
          resourceType: "user",
          resourceId: createdUser?.id,
          changes: {
            created_user_email: normalizedEmail,
            created_user_name: fullName,
            assigned_role: newUserForm.role,
            created_by: userData?.email || userData?.id || "system",
            created_at: new Date().toISOString(),
          },
        }
      );

      await loadUsers();
      setShowAddModal(false);
      showSuccess(`${getRoleLabel(newUserForm.role)} account created successfully!`);
      setNewUserForm(initialAddUserForm);
      setTouchedAddUserFields({});
    } catch (error: any) {
      console.error("Error creating user:", error);
      showError(error.message || "Failed to create user.");
    } finally {
      setIsCreatingUser(false);
    }
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

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <LoadingState
          message="Loading user accounts..."
          subtext="Fetching student and staff account records."
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashboardPageHeader
        badge="Access Control"
        title="User Management"
        subtitle="Manage user accounts and access permissions"
        icon={Shield}
        actions={
          <>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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
            disabled={!canCreateUsers}
            className="w-full sm:w-auto justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center gap-2 shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: canCreateUsers ? "#1E3A8A" : "#64748B" }}
            title={canCreateUsers ? "Add user" : "Only Branch Coordinators can create users"}
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
          </>
        }
      />

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
            className="bg-white shadow-2xl max-h-[90vh] w-full max-w-2xl overflow-hidden"
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
            <div className="max-h-[calc(90vh-89px)] overflow-y-auto p-6">
              <form className="space-y-4" onSubmit={handleCreateUser}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-600">*</span>
                  </label>
                  <select
                    className={getAddUserInputClassName("role")}
                    value={newUserForm.role}
                    onChange={(e) => updateAddUserField("role", e.target.value as CreatableRole)}
                    onBlur={() => setAddUserFieldTouched("role")}
                  >
                    <option value="student">Student</option>
                    <option value="registrar">Registrar</option>
                    <option value="branchcoordinator">Branch Coordinator</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className={getAddUserInputClassName("firstName")}
                      placeholder="Enter first name"
                      value={newUserForm.firstName}
                      onChange={(e) => updateAddUserField("firstName", e.target.value)}
                      onBlur={() => setAddUserFieldTouched("firstName")}
                      autoComplete="given-name"
                    />
                    {getVisibleAddUserError("firstName") && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{getVisibleAddUserError("firstName")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className={getAddUserInputClassName("lastName")}
                      placeholder="Enter last name"
                      value={newUserForm.lastName}
                      onChange={(e) => updateAddUserField("lastName", e.target.value)}
                      onBlur={() => setAddUserFieldTouched("lastName")}
                      autoComplete="family-name"
                    />
                    {getVisibleAddUserError("lastName") && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{getVisibleAddUserError("lastName")}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className={getAddUserInputClassName("middleName")}
                    placeholder="Enter middle name"
                    value={newUserForm.middleName}
                    onChange={(e) => updateAddUserField("middleName", e.target.value)}
                    onBlur={() => setAddUserFieldTouched("middleName")}
                    autoComplete="additional-name"
                  />
                  {getVisibleAddUserError("middleName") && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{getVisibleAddUserError("middleName")}</p>
                  )}
                </div>

                {isStudentAddForm && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sex <span className="text-red-600">*</span>
                      </label>
                      <select
                        className={getAddUserInputClassName("sex")}
                        value={newUserForm.sex}
                        onChange={(e) => updateAddUserField("sex", e.target.value)}
                        onBlur={() => setAddUserFieldTouched("sex")}
                      >
                        <option value="" disabled>Select sex</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                      {getVisibleAddUserError("sex") && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">{getVisibleAddUserError("sex")}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        className={getAddUserInputClassName("birthDate")}
                        value={newUserForm.birthDate}
                        onChange={(e) => updateAddUserField("birthDate", e.target.value)}
                        onBlur={() => setAddUserFieldTouched("birthDate")}
                      />
                      {getVisibleAddUserError("birthDate") && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">{getVisibleAddUserError("birthDate")}</p>
                      )}
                    </div>
                  </div>
                )}

                {isStudentAddForm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      className={getAddUserInputClassName("contactNumber")}
                      placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                      value={newUserForm.contactNumber}
                      onChange={(e) => updateAddUserField("contactNumber", e.target.value)}
                      onBlur={() => setAddUserFieldTouched("contactNumber")}
                      autoComplete="tel"
                    />
                    {getVisibleAddUserError("contactNumber") && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{getVisibleAddUserError("contactNumber")}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    className={getAddUserInputClassName("email")}
                    placeholder="Enter email address"
                    value={newUserForm.email}
                    onChange={(e) => updateAddUserField("email", e.target.value)}
                    onBlur={() => setAddUserFieldTouched("email")}
                    autoComplete="email"
                  />
                  {getVisibleAddUserError("email") && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{getVisibleAddUserError("email")}</p>
                  )}
                </div>

                <div className={isStudentAddForm ? "grid gap-4 sm:grid-cols-2" : ""}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`${getAddUserInputClassName("password")} pr-11`}
                        placeholder="Enter password"
                        value={newUserForm.password}
                        onChange={(e) => updateAddUserField("password", e.target.value)}
                        onBlur={() => setAddUserFieldTouched("password")}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {getVisibleAddUserError("password") ? (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{getVisibleAddUserError("password")}</p>
                    ) : (
                      <p className="mt-1.5 text-xs text-gray-500">Use 8+ characters with uppercase, lowercase, a number, and a special character.</p>
                    )}
                  </div>

                  {isStudentAddForm && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password <span className="text-red-600">*</span>
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        className={getAddUserInputClassName("confirmPassword")}
                        placeholder="Confirm password"
                        value={newUserForm.confirmPassword}
                        onChange={(e) => updateAddUserField("confirmPassword", e.target.value)}
                        onBlur={() => setAddUserFieldTouched("confirmPassword")}
                        autoComplete="new-password"
                      />
                      {getVisibleAddUserError("confirmPassword") && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">{getVisibleAddUserError("confirmPassword")}</p>
                      )}
                    </div>
                  )}
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
                    disabled={!isAddUserFormValid || isCreatingUser}
                    className="flex-1 px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: "#1E3A8A" }}
                  >
                    {isCreatingUser ? "Creating..." : "Create User"}
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

      {showErrorToast && (
        <div
          className="fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border-2 animate-slideInDown z-50 min-w-[320px]"
          style={{
            backgroundColor: "#FEF2F2",
            borderColor: "#B91C1C"
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#B91C1C" }}
          >
            <X className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{errorMessage}</p>
            <p className="text-xs text-gray-700 mt-0.5">Please review the highlighted fields.</p>
          </div>
          <button
            onClick={() => setShowErrorToast(false)}
            className="p-1 hover:bg-red-100 rounded transition-colors"
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
