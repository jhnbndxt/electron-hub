import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface UserData {
  id?: string;
  name: string;
  email: string;
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
  updateEnrollmentProgress: (stepName: string, status: "completed" | "current" | "pending") => void;
  resetEnrollmentProgress: () => void;
  markPaymentVisited: () => void;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "registrar" | "branchcoordinator" | "cashier" | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [enrollmentProgress, setEnrollmentProgress] = useState<EnrollmentStep[]>(initialEnrollmentSteps);
  const [isDocumentsVerified, setIsDocumentsVerified] = useState(false);
  const [hasVisitedPayment, setHasVisitedPayment] = useState(false);

  // Load enrollment progress from localStorage on mount
  useEffect(() => {
    if (userData?.email) {
      const storageKey = `enrollment_progress_${userData.email}`;
      const savedProgress = localStorage.getItem(storageKey);
      
      if (savedProgress) {
        try {
          setEnrollmentProgress(JSON.parse(savedProgress));
        } catch (error) {
          console.error("Error parsing enrollment progress:", error);
          setEnrollmentProgress(initialEnrollmentSteps);
        }
      } else {
        // First time user - initialize with default progress
        setEnrollmentProgress(initialEnrollmentSteps);
        localStorage.setItem(storageKey, JSON.stringify(initialEnrollmentSteps));
      }
    }
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
    if (userData) {
      setUserData(userData);
      
      // Check if this is a first-time user
      const storageKey = `enrollment_progress_${userData.email}`;
      const savedProgress = localStorage.getItem(storageKey);
      
      if (!savedProgress) {
        // First time user - reset to initial state
        setEnrollmentProgress(initialEnrollmentSteps);
        localStorage.setItem(storageKey, JSON.stringify(initialEnrollmentSteps));
      }
    }
    if (role === "registrar" || role === "branchcoordinator" || role === "cashier") {
      setIsAdminAuthenticated(true);
    }
  };

  const logout = () => {
    setUserRole(null);
    setUserData(null);
    setIsAdminAuthenticated(false);
    setEnrollmentProgress(initialEnrollmentSteps);
    setIsDocumentsVerified(false);
    setHasVisitedPayment(false);
  };

  const updateEnrollmentProgress = (stepName: string, status: "completed" | "current" | "pending") => {
    setEnrollmentProgress((prevProgress) => {
      const stepIndex = prevProgress.findIndex((step) => step.name === stepName);
      if (stepIndex === -1) return prevProgress;

      const newProgress = [...prevProgress];
      newProgress[stepIndex] = { ...newProgress[stepIndex], status };

      // If marking a step as current, mark all previous steps as completed
      if (status === "current") {
        for (let i = 0; i < stepIndex; i++) {
          newProgress[i] = { ...newProgress[i], status: "completed" };
        }
        // Mark all subsequent steps as pending
        for (let i = stepIndex + 1; i < newProgress.length; i++) {
          if (newProgress[i].status !== "completed") {
            newProgress[i] = { ...newProgress[i], status: "pending" };
          }
        }
      }

      return newProgress;
    });
  };

  const resetEnrollmentProgress = () => {
    setEnrollmentProgress(initialEnrollmentSteps);
    if (userData?.email) {
      const storageKey = `enrollment_progress_${userData.email}`;
      localStorage.setItem(storageKey, JSON.stringify(initialEnrollmentSteps));
    }
  };

  const markPaymentVisited = () => {
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
        updateEnrollmentProgress,
        resetEnrollmentProgress,
        markPaymentVisited
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
      enrollmentProgress: initialEnrollmentSteps,
      isDocumentsVerified: false,
      hasVisitedPayment: false,
      login: () => {},
      logout: () => {},
      updateEnrollmentProgress: () => {},
      resetEnrollmentProgress: () => {},
      markPaymentVisited: () => {},
    } as AuthContextType;
  }
  return context;
}