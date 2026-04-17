import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { ChatAssistant } from "../components/ChatAssistant";
import { Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { loginUser } from "../../services/authService";
import logo from "../../assets/electronLogo";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [error, setError] = useState("");
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

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
      
      // Login user based on their role
      if (userRole === "registrar") {
        login("registrar", {
          id: user.id,
          name: user.full_name,
          email: user.email,
          profilePictureUrl: user.profile_picture_url || undefined,
          adminType: "registrar"
        });
        navigate("/registrar", { replace: true });
      } else if (userRole === "branchcoordinator") {
        login("branchcoordinator", {
          id: user.id,
          name: user.full_name,
          email: user.email,
          profilePictureUrl: user.profile_picture_url || undefined,
          adminType: "branchcoordinator"
        });
        navigate("/branchcoordinator", { replace: true });
      } else if (userRole === "cashier") {
        login("cashier", {
          id: user.id,
          name: user.full_name,
          email: user.email,
          profilePictureUrl: user.profile_picture_url || undefined,
          adminType: "cashier"
        });
        navigate("/cashier", { replace: true });
      } else {
        // Default to student role
        login("student", {
          id: user.id,
          name: user.full_name,
          email: user.email,
          profilePictureUrl: user.profile_picture_url || undefined,
        });
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell-bg flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      {/* Assessment Banner */}
      <div className="relative z-10 w-full max-w-md">
        {showBanner && (
          <div
            className="mb-5 rounded-[1.5rem] border border-blue-200/80 bg-white/92 px-4 py-4 shadow-lg backdrop-blur-md animate-slide-down"
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "#1E3A8A" }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base" style={{ color: "#1E3A8A" }}>
                  Please log in or create an account to take the assessment.
                </p>
                <p className="mt-1 text-sm text-gray-600">
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

        <div className="auth-panel rounded-[2rem] p-6 sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] auth-logo-orb">
              <img src={logo} alt="Electron College Logo" className="h-20 w-20 scale-125 object-contain" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold text-slate-900 sm:text-[2.2rem]">
              Sign In
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Use your Electron Hub account to continue your application, assessment, and student updates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="sr-only">
                Email Address
              </label>
              <div className="auth-input-surface rounded-2xl px-4 py-3.5">
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
              <div className="auth-input-surface rounded-2xl px-4 py-3.5">
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
                <Link to="/forgot-password" className="text-xs font-medium text-slate-500 hover:text-[#1E3A8A] hover:underline sm:text-sm">
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
              className="auth-primary-button w-full rounded-2xl px-6 py-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Get Started"}
            </button>

            <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-semibold text-[#1E3A8A] hover:underline">
                Register
              </Link>
            </p>
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}