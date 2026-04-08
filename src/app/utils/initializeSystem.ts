/**
 * System Initialization Utility
 * 
 * This utility clears all dummy data and initializes the system
 * with only the required test accounts in a clean state.
 */

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  dateCreated: string;
  lastLogin?: string;
  status: string;
}

/**
 * Initialize system with clean state
 * - Removes all dummy data
 * - Sets up only required test accounts
 * - Clears all logs and notifications
 */
export function initializeSystemCleanState() {
  // Clear all existing data
  const keysToKeep = ['system_initialized']; // Keys we want to preserve
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // Define system test accounts only
  const systemUsers: SystemUser[] = [
    {
      id: "user-branch-coordinator",
      name: "Branch Coordinator",
      email: "electronbranchcoor@gmail.com",
      password: "branchcoor123",
      role: "Branch Coordinator",
      dateCreated: new Date().toISOString(),
      status: "active"
    },
    {
      id: "user-registrar",
      name: "Registrar",
      email: "electronregistrar@gmail.com",
      password: "registrar123",
      role: "Registrar",
      dateCreated: new Date().toISOString(),
      status: "active"
    },
    {
      id: "user-cashier",
      name: "Cashier",
      email: "electroncashier123@gmail.com",
      password: "cashier123",
      role: "Cashier",
      dateCreated: new Date().toISOString(),
      status: "active"
    },
    {
      id: "user-student-joshua",
      name: "Joshua",
      email: "joshua@gmail.com",
      password: "root",
      role: "Student",
      dateCreated: new Date().toISOString(),
      status: "active"
    }
  ];

  // Store system users
  localStorage.setItem("registered_users", JSON.stringify(systemUsers));
  localStorage.setItem("system_users", JSON.stringify(systemUsers));

  // Initialize empty data structures
  localStorage.setItem("pending_applications", JSON.stringify([]));
  localStorage.setItem("enrolled_students", JSON.stringify([]));
  localStorage.setItem("payment_queue", JSON.stringify([]));
  localStorage.setItem("audit_logs", JSON.stringify([]));
  localStorage.setItem("notifications", JSON.stringify([]));
  
  // Mark system as initialized
  localStorage.setItem("system_initialized", "true");
  localStorage.setItem("system_init_date", new Date().toISOString());

  console.log("✅ System initialized with clean state");
  console.log("📋 System accounts created:", systemUsers.length);
  console.log("🧹 All dummy data cleared");
}

/**
 * Check if system needs initialization
 */
export function shouldInitializeSystem(): boolean {
  const isInitialized = localStorage.getItem("system_initialized");
  return !isInitialized;
}

/**
 * Force system reset (for testing)
 */
export function forceSystemReset() {
  localStorage.clear();
  initializeSystemCleanState();
  console.log("🔄 System force reset completed");
}

/**
 * Get system statistics
 */
export function getSystemStats() {
  const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
  const pendingApplications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
  const enrolledStudents = JSON.parse(localStorage.getItem("enrolled_students") || "[]");
  const paymentQueue = JSON.parse(localStorage.getItem("payment_queue") || "[]");
  const auditLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
  const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");

  return {
    totalUsers: registeredUsers.length,
    systemUsers: registeredUsers.filter((u: SystemUser) => 
      ["Branch Coordinator", "Registrar", "Cashier"].includes(u.role)
    ).length,
    students: registeredUsers.filter((u: SystemUser) => u.role === "Student").length,
    pendingApplications: pendingApplications.length,
    enrolledStudents: enrolledStudents.length,
    paymentQueue: paymentQueue.length,
    auditLogs: auditLogs.length,
    notifications: notifications.length,
    systemInitialized: localStorage.getItem("system_initialized") === "true",
    initDate: localStorage.getItem("system_init_date")
  };
}

/**
 * Verify system accounts exist
 */
export function verifySystemAccounts(): boolean {
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  
  const requiredEmails = [
    "electronbranchcoor@gmail.com",
    "electronregistrar@gmail.com",
    "electroncashier123@gmail.com",
    "joshua@gmail.com"
  ];

  const existingEmails = users.map((u: SystemUser) => u.email);
  const allAccountsExist = requiredEmails.every(email => existingEmails.includes(email));

  return allAccountsExist;
}
