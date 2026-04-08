import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { ChatAssistant } from "../components/ChatAssistant";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "../../services/authService";
const logo = "";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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
          adminType: "registrar"
        });
        navigate("/registrar", { replace: true });
      } else if (userRole === "branchcoordinator") {
        login("branchcoordinator", {
          id: user.id,
          name: user.full_name,
          email: user.email,
          adminType: "branchcoordinator"
        });
        navigate("/branchcoordinator", { replace: true });
      } else if (userRole === "cashier") {
        login("cashier", {
          id: user.id,
          name: user.full_name,
          email: user.email,
          adminType: "cashier"
        });
        navigate("/cashier", { replace: true });
      } else {
        // Default to student role
        login("student", {
          id: user.id,
          name: user.full_name,
          email: user.email
        });
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-6 px-4"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      {/* Assessment Banner */}
      {showBanner && (
        <div
          className="fixed top-0 left-0 right-0 z-50 shadow-lg border-b-4 animate-slide-down"
          style={{
            backgroundColor: "#EFF6FF",
            borderColor: "#1E3A8A"
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#1E3A8A" }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p
                  className="font-semibold text-base"
                  style={{ color: "#1E3A8A" }}
                >
                  Please log in or create an account to take the Assessment.
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  New here? Click "Register" below to create your account first.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
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

      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src={logo} 
              alt="Electron College Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 
            className="text-2xl font-semibold mb-1"
            style={{ color: "#1E3A8A" }}
          >
            Electron Hub
          </h1>
          <p className="text-gray-600 text-sm">
            Sign in to continue
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block mb-1.5 text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="example@gmail.com"
                style={{ color: "#1F2937" }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-1.5 text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2.5 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all password-input"
                  placeholder="Enter your password"
                  style={{ 
                    color: "#1F2937",
                    borderColor: "#03045E",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity"
                  style={{ 
                    color: "#6B7280",
                    opacity: password ? 0.8 : 0.5,
                  }}
                  aria-label="Toggle password visibility"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={2} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={2} />
                  )}
                </button>
              </div>
              {/* Error Message */}
              {error && (
                <p className="mt-2 text-sm flex items-center gap-1.5" style={{ color: "#B91C1C" }}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                  style={{ accentColor: "#1E3A8A" }}
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium hover:underline"
                style={{ color: "#1E3A8A" }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isEmailValid || !password}
              className="w-full px-6 py-2.5 text-white rounded-md font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#1E3A8A" }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link 
              to="/register" 
              className="font-medium hover:underline"
              style={{ color: "#1E3A8A" }}
            >
              Register
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link 
            to="/" 
            className="text-sm font-medium hover:underline"
            style={{ color: "#64748B" }}
          >
            ← Back to home
          </Link>
        </div>
      </div>

      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}