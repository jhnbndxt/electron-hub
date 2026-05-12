import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { ChatAssistant } from "../components/ChatAssistant";
import { MaintenanceNotice } from "../components/MaintenanceNotice";
import { Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { loginUser } from "../../services/authService";
import { getSystemSettings } from "../../services/systemSettingsService";
import logo from "../../assets/electronLogo";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [error, setError] = useState("");
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMaintenanceNotice, setShowMaintenanceNotice] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const shouldAnimateEntry = Boolean((location.state as { fromPublicLogin?: boolean } | null)?.fromPublicLogin);

  // Check if user came from assessment link
  useEffect(() => {
    if (searchParams.get("from") === "assessment") {
      setShowBanner(true);
      // Auto-hide banner after 8 seconds
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsEmailValid(validateEmail(value));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    setIsLoading(true);

    try {
      // Attempt login with Supabase
      const { error: authError, user } = await loginUser(email, password);

      if (authError) {
        setError(authError);
        setIsLoading(false);
        return;
      }

      // Successful login - determine role and navigate
      const userRole = user.role?.toLowerCase() || "student";
      
      // Check maintenance mode for students
      if (userRole === "student") {
        const settingsResult = await getSystemSettings();
        if (settingsResult?.data?.maintenance_mode) {
          setShowMaintenanceNotice(true);
          setIsLoading(false);
          return;
        }
      }
      
      // Prepare user data with all fields from database
      const userData = {
        id: user.id,
        email: user.email,
        name: user.full_name,
        firstName: user.first_name,
        lastName: user.last_name,
        middleName: user.middle_name,
        sex: user.sex,
        birthDate: user.birth_date,
        contactNumber: user.contact_number,
        profilePictureUrl: user.profile_picture_url || undefined,
      };
      
      // Login user based on their role
      if (userRole === "registrar") {
        login("registrar", {
          ...userData,
          adminType: "registrar"
        });
        navigate("/registrar", { replace: true });
      } else if (userRole === "branchcoordinator") {
        login("branchcoordinator", {
          ...userData,
          adminType: "branchcoordinator"
        });
        navigate("/branchcoordinator", { replace: true });
      } else if (userRole === "cashier") {
        login("cashier", {
          ...userData,
          adminType: "cashier"
        });
        navigate("/cashier", { replace: true });
      } else {
        // Default to student role
        login("student", userData);
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during login");
      setIsLoading(false);
    }
  };

  if (showMaintenanceNotice) {
    return (
      <MaintenanceNotice
        message="The student portal is currently under maintenance. Access for students is temporarily unavailable while system updates are being performed. Please try again later and wait for further announcements."
        showButton={true}
        onButtonClick={() => navigate("/", { replace: true })}
      />
    );
  }

  return (
    <div className={`auth-shell-bg flex min-h-screen items-center justify-center px-4 py-4 sm:px-6 lg:px-8 ${shouldAnimateEntry ? "auth-shell-enter" : ""}`}>
      <div className="relative z-10 flex w-full max-w-6xl items-center justify-center">
        {/* Assessment Banner */}
        <div className="w-full max-w-[27rem]">
        {showBanner && (
          <div
            className="mb-4 rounded-[1.25rem] border border-white/60 bg-white/75 px-4 py-3.5 shadow-lg backdrop-blur-xl animate-slide-down"
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full shadow-sm"
                style={{ backgroundColor: "#1E3A8A" }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base" style={{ color: "#1E3A8A" }}>
                  Please log in or create an account to take the assessment.
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-600 sm:text-sm">
                  New here? Register first, then come back to continue.
                </p>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Close banner"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="auth-panel auth-panel-compact rounded-[1.75rem] p-5 sm:p-7">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] auth-logo-orb sm:h-[4.5rem] sm:w-[4.5rem]">
              <img src={logo} alt="Electron College Logo" className="h-16 w-16 scale-125 object-contain sm:h-[4.5rem] sm:w-[4.5rem]" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#b91c1c]">
              Electron Hub
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use your Electron Hub account to continue your application, assessment, and student updates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email Address
              </label>
              <div className="auth-input-surface rounded-2xl px-4 py-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className="min-w-0 text-sm placeholder:text-slate-400"
                  placeholder="Email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="auth-input-surface rounded-2xl px-4 py-3">
                <LockKeyhole className="h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="min-w-0 password-input pr-2 text-sm placeholder:text-slate-400"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 transition-colors hover:text-slate-700"
                  aria-label="Toggle password visibility"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
                </button>
              </div>
              <div className="mt-2 flex justify-end">
                <Link to="/forgot-password" className="auth-secondary-link text-xs font-semibold hover:underline sm:text-sm">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-semibold">Sign in failed.</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isEmailValid || !password}
              className="auth-primary-button w-full rounded-2xl px-6 py-3.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Log In"}
            </button>
          </form>

          <div className="mt-5 space-y-2 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="auth-secondary-link font-semibold hover:underline">
                Register
              </Link>
            </p>
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline">
              Back to home
            </Link>
          </div>
        </div>
        </div>
      </div>
      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}
