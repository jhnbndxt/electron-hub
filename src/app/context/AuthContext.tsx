import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../../supabase";

interface UserData {
  id?: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  adminType?: "branchcoordinator" | "registrar" | "cashier"; // Updated role types
}

interface EnrollmentStep {
  name: string;
  status: "completed" | "current" | "pending";
}

interface AuthContextType {
  isAdminAuthenticated: boolean;
  userRole: "student" | "registrar" | "branchcoordinator" | "cashier" | null; // Updated roles
  userData: UserData | null;
  enrollmentProgress: EnrollmentStep[];
  isDocumentsVerified: boolean;
  hasVisitedPayment: boolean;
  login: (role: "student" | "registrar" | "branchcoordinator" | "cashier", userData?: UserData) => void;
  logout: () => void;
  updateUserData: (nextUserData: Partial<UserData>) => void;
  updateEnrollmentProgress: (stepName: string, status: "completed" | "current" | "pending") => void;
  resetEnrollmentProgress: () => void;
  markPaymentVisited: () => void;
  refreshEnrollmentProgress: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialEnrollmentSteps: EnrollmentStep[] = [
  { name: "Account Created", status: "current" },
  { name: "AI Assessment Completed", status: "pending" },
  { name: "Documents Submitted", status: "pending" },
  { name: "Documents Verified", status: "pending" },
  { name: "Payment Submitted", status: "pending" },
  { name: "Payment Verified", status: "pending" },
  { name: "Enrolled", status: "pending" },
];

const PENDING_PAYMENT_STATUSES = new Set(["pending", "submitted"]);
const COMPLETED_PAYMENT_STATUSES = new Set(["verified", "approved", "completed", "paid"]);

function getPaymentVisitedStorageKey(userEmail?: string | null) {
  return userEmail ? `payment_page_visited_${userEmail}` : null;
}

function readStoredPaymentVisited(userEmail?: string | null) {
  const storageKey = getPaymentVisitedStorageKey(userEmail);

  if (!storageKey) {
    return false;
  }

  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

function cloneInitialEnrollmentSteps(): EnrollmentStep[] {
  return initialEnrollmentSteps.map((step) => ({ ...step }));
}

function buildProgressState(
  stepName: string,
  status: "completed" | "current"
): EnrollmentStep[] {
  const stepIndex = initialEnrollmentSteps.findIndex((step) => step.name === stepName);

  if (stepIndex === -1) {
    return cloneInitialEnrollmentSteps();
  }

  return cloneInitialEnrollmentSteps().map((step, index) => {
    if (index < stepIndex) {
      return { ...step, status: "completed" };
    }

    if (index === stepIndex) {
      return { ...step, status };
    }

    return { ...step, status: "pending" };
  });
}

function mapProgressRows(progressRows: Array<{ step_name: string; status: EnrollmentStep["status"] }>) {
  return cloneInitialEnrollmentSteps().map((step) => {
    const progressRow = progressRows.find((row) => row.step_name === step.name);
    return progressRow ? { ...step, status: progressRow.status } : step;
  });
}

function areProgressStatesEqual(left: EnrollmentStep[], right: EnrollmentStep[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (step, index) => step.name === right[index]?.name && step.status === right[index]?.status
  );
}

function deriveEnrollmentProgressState({
  hasAssessment,
  enrollmentStatus,
  paymentStatus,
  paymentMethod,
}: {
  hasAssessment: boolean;
  enrollmentStatus?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
}) {
  if (enrollmentStatus === "enrolled" || (paymentStatus && COMPLETED_PAYMENT_STATUSES.has(paymentStatus))) {
    return buildProgressState("Enrolled", "completed");
  }

  if (paymentStatus && PENDING_PAYMENT_STATUSES.has(paymentStatus)) {
    if (paymentMethod === "cash") {
      return buildProgressState("Payment Submitted", "current");
    }

    return buildProgressState("Payment Verified", "current");
  }

  if (enrollmentStatus === "documents_verified") {
    return buildProgressState("Payment Submitted", "current");
  }

  if (enrollmentStatus && enrollmentStatus !== "rejected") {
    return buildProgressState("Documents Verified", "current");
  }

  if (hasAssessment) {
    return buildProgressState("Documents Submitted", "current");
  }

  return cloneInitialEnrollmentSteps();
}

function applyStepStatus(
  progress: EnrollmentStep[],
  stepName: string,
  status: "completed" | "current" | "pending"
): EnrollmentStep[] {
  const stepIndex = progress.findIndex((step) => step.name === stepName);
  if (stepIndex === -1) return progress;

  const nextProgress = progress.map((step) => ({ ...step }));
  nextProgress[stepIndex] = { ...nextProgress[stepIndex], status };

  if (status === "current") {
    for (let index = 0; index < stepIndex; index += 1) {
      nextProgress[index] = { ...nextProgress[index], status: "completed" };
    }

    for (let index = stepIndex + 1; index < nextProgress.length; index += 1) {
      if (nextProgress[index].status !== "completed") {
        nextProgress[index] = { ...nextProgress[index], status: "pending" };
      }
    }
  }

  return nextProgress;
}

async function persistEnrollmentProgress(studentId: string, progress: EnrollmentStep[]) {
  const timestamp = new Date().toISOString();
  const payload = progress.map((step) => {
    const row: Record<string, string> = {
      student_id: studentId,
      step_name: step.name,
      status: step.status,
      updated_at: timestamp,
    };

    if (step.status === "completed") {
      row.completed_at = timestamp;
    }

    return row;
  });

  const { error } = await supabase
    .from("enrollment_progress")
    .upsert(payload, { onConflict: "student_id,step_name" });

  if (error) {
    console.error("Error syncing enrollment progress:", error);
  }
}

async function buildRemoteEnrollmentProgress(studentId: string, userEmail: string) {
  const [progressResponse, assessmentResponse, enrollmentResponse, paymentResponse] = await Promise.all([
    supabase
      .from("enrollment_progress")
      .select("step_name, status")
      .eq("student_id", studentId),
    supabase
      .from("assessment_results")
      .select("id")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("enrollments")
      .select("id, status")
      .eq("user_id", userEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("status, payment_method")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (progressResponse.error) {
    console.error("Error loading enrollment progress:", progressResponse.error);
  }

  let enrollmentStatus = enrollmentResponse.data?.status?.toLowerCase() || null;
  const paymentStatus = paymentResponse.data?.status?.toLowerCase() || null;
  const paymentMethod = paymentResponse.data?.payment_method?.toLowerCase() || null;

  if (
    paymentStatus &&
    COMPLETED_PAYMENT_STATUSES.has(paymentStatus) &&
    enrollmentStatus !== "enrolled" &&
    enrollmentResponse.data?.id
  ) {
    const { error: enrollmentSyncError } = await supabase
      .from("enrollments")
      .update({
        status: "enrolled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", enrollmentResponse.data.id);

    if (enrollmentSyncError) {
      console.error("Error syncing enrolled status:", enrollmentSyncError);
    } else {
      enrollmentStatus = "enrolled";
    }
  }

  const canonicalProgress = deriveEnrollmentProgressState({
    hasAssessment: Boolean(assessmentResponse.data),
    enrollmentStatus,
    paymentStatus,
    paymentMethod,
  });

  const progressRows = progressResponse.data || [];
  const remoteProgress = mapProgressRows(progressRows);

  if (!areProgressStatesEqual(remoteProgress, canonicalProgress)) {
    await persistEnrollmentProgress(studentId, canonicalProgress);
  }

  return canonicalProgress;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "registrar" | "branchcoordinator" | "cashier" | null>(() => {
    return (localStorage.getItem('userRole') as any) || null;
  });
  const [userData, setUserData] = useState<UserData | null>(() => {
    try {
      const saved = localStorage.getItem('userData');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [enrollmentProgress, setEnrollmentProgress] = useState<EnrollmentStep[]>(cloneInitialEnrollmentSteps);
  const [isDocumentsVerified, setIsDocumentsVerified] = useState(false);
  const [hasVisitedPayment, setHasVisitedPayment] = useState(() => readStoredPaymentVisited(userData?.email));

  const refreshEnrollmentProgress = async () => {
    if (!userData?.id || !userData?.email) {
      return;
    }

    try {
      const remoteProgress = await buildRemoteEnrollmentProgress(userData.id, userData.email);
      setEnrollmentProgress(remoteProgress);
    } catch (error) {
      console.error("Error refreshing enrollment progress:", error);
    }
  };

  // Restore admin flag from persisted role
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role === 'registrar' || role === 'branchcoordinator' || role === 'cashier') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const hydrateUserData = async () => {
      if (!userData?.email) {
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("email", userData.email)
        .maybeSingle();

      if (error) {
        console.error("Error hydrating user session:", error);
        return;
      }

      if (!data) {
        return;
      }

      const nextUserData: UserData = {
        ...userData,
        id: data.id || userData.id,
        email: data.email || userData.email,
        name: data.full_name || userData.name,
      };

      if (
        nextUserData.id === userData.id &&
        nextUserData.email === userData.email &&
        nextUserData.name === userData.name
      ) {
        return;
      }

      if (isActive) {
        setUserData(nextUserData);
        localStorage.setItem("userData", JSON.stringify(nextUserData));
      }
    };

    void hydrateUserData();

    return () => {
      isActive = false;
    };
  }, [userData?.email, userData?.id, userData?.name, userData?.adminType]);

  useEffect(() => {
    if (!userData?.email) {
      setEnrollmentProgress(cloneInitialEnrollmentSteps());
      return;
    }

    const storageKey = `enrollment_progress_${userData.email}`;
    const savedProgress = localStorage.getItem(storageKey);

    if (savedProgress) {
      try {
        setEnrollmentProgress(JSON.parse(savedProgress));
      } catch (error) {
        console.error("Error parsing enrollment progress:", error);
        setEnrollmentProgress(cloneInitialEnrollmentSteps());
      }
    } else {
      const defaultProgress = cloneInitialEnrollmentSteps();
      setEnrollmentProgress(defaultProgress);
      localStorage.setItem(storageKey, JSON.stringify(defaultProgress));
    }

    void refreshEnrollmentProgress();
  }, [userData?.id, userData?.email]);

  useEffect(() => {
    setHasVisitedPayment(readStoredPaymentVisited(userData?.email));
  }, [userData?.email]);

  // Save enrollment progress to localStorage whenever it changes
  useEffect(() => {
    if (userData?.email) {
      const storageKey = `enrollment_progress_${userData.email}`;
      localStorage.setItem(storageKey, JSON.stringify(enrollmentProgress));
    }
  }, [enrollmentProgress, userData?.email]);

  // Check if documents are verified
  useEffect(() => {
    const documentsVerifiedStep = enrollmentProgress.find(
      (step) => step.name === "Documents Verified"
    );
    setIsDocumentsVerified(documentsVerifiedStep?.status === "completed");
  }, [enrollmentProgress]);

  const login = (role: "student" | "registrar" | "branchcoordinator" | "cashier", userData?: UserData) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
    if (userData) {
      setUserData(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
      setHasVisitedPayment(readStoredPaymentVisited(userData.email));
      
      // Check if this is a first-time user
      const storageKey = `enrollment_progress_${userData.email}`;
      const savedProgress = localStorage.getItem(storageKey);
      const paymentVisitedStorageKey = getPaymentVisitedStorageKey(userData.email);
      
      if (!savedProgress) {
        // First time user - reset to initial state
        const defaultProgress = cloneInitialEnrollmentSteps();
        setEnrollmentProgress(defaultProgress);
        localStorage.setItem(storageKey, JSON.stringify(defaultProgress));
        if (paymentVisitedStorageKey) {
          localStorage.removeItem(paymentVisitedStorageKey);
        }
        setHasVisitedPayment(false);
      }
    } else {
      setHasVisitedPayment(false);
    }
    if (role === "registrar" || role === "branchcoordinator" || role === "cashier") {
      setIsAdminAuthenticated(true);
    }
  };

  const logout = () => {
    setUserRole(null);
    setUserData(null);
    setIsAdminAuthenticated(false);
    setEnrollmentProgress(cloneInitialEnrollmentSteps());
    setIsDocumentsVerified(false);
    setHasVisitedPayment(false);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
  };

  const updateUserData = (nextUserData: Partial<UserData>) => {
    setUserData((currentUserData) => {
      if (!currentUserData) {
        return currentUserData;
      }

      const mergedUserData = {
        ...currentUserData,
        ...nextUserData,
      };

      localStorage.setItem('userData', JSON.stringify(mergedUserData));
      return mergedUserData;
    });
  };

  const updateEnrollmentProgress = (stepName: string, status: "completed" | "current" | "pending") => {
    setEnrollmentProgress((prevProgress) => {
      const newProgress = applyStepStatus(prevProgress, stepName, status);

      if (userData?.id) {
        void persistEnrollmentProgress(userData.id, newProgress);
      }

      return newProgress;
    });
  };

  const resetEnrollmentProgress = () => {
    const defaultProgress = cloneInitialEnrollmentSteps();
    setEnrollmentProgress(defaultProgress);
    if (userData?.email) {
      const storageKey = `enrollment_progress_${userData.email}`;
      localStorage.setItem(storageKey, JSON.stringify(defaultProgress));

      const paymentVisitedStorageKey = getPaymentVisitedStorageKey(userData.email);
      if (paymentVisitedStorageKey) {
        localStorage.removeItem(paymentVisitedStorageKey);
      }
    }
    setHasVisitedPayment(false);
    if (userData?.id) {
      void persistEnrollmentProgress(userData.id, defaultProgress);
    }
  };

  const markPaymentVisited = () => {
    if (userData?.email) {
      const storageKey = getPaymentVisitedStorageKey(userData.email);
      if (storageKey) {
        localStorage.setItem(storageKey, "true");
      }
    }
    setHasVisitedPayment(true);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAdminAuthenticated, 
        userRole, 
        userData, 
        enrollmentProgress,
        isDocumentsVerified,
        hasVisitedPayment,
        login, 
        logout,
        updateUserData,
        updateEnrollmentProgress,
        resetEnrollmentProgress,
        markPaymentVisited,
        refreshEnrollmentProgress
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During error boundaries or before provider is mounted, return safe defaults
    // This can happen during React Router's error boundary rendering
    return {
      isAdminAuthenticated: false,
      userRole: null,
      userData: null,
      enrollmentProgress: cloneInitialEnrollmentSteps(),
      isDocumentsVerified: false,
      hasVisitedPayment: false,
      login: () => {},
      logout: () => {},
      updateUserData: () => {},
      updateEnrollmentProgress: () => {},
      resetEnrollmentProgress: () => {},
      markPaymentVisited: () => {},
      refreshEnrollmentProgress: async () => {},
    } as AuthContextType;
  }
  return context;
}