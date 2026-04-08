import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, Mail, Lock, ArrowRight, CheckCircle, Phone, Calendar, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ChatAssistant } from "../components/ChatAssistant";
import { registerUser } from "../../services/authService";
const logo = "";
import { motion } from "motion/react";

export function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      // Register user with Supabase
      const { error: registerError, user } = await registerUser(
        formData.email,
        formData.password,
        formData.fullName
      );

      if (registerError) {
        setError(registerError);
        setIsLoading(false);
        return;
      }

      // Registration successful - show success modal
      setShowSuccessModal(true);
      
      // Auto-login the user
      login("student", {
        name: user.full_name,
        email: user.email
      });
    } catch (error: any) {
      setError(error.message || "An error occurred during registration");
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-4 px-4"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      <div className="max-w-2xl w-full">
        {/* Logo and Title */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <img 
              src={logo} 
              alt="Electron College Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 
            className="text-2xl mb-1 font-bold"
            style={{ color: "var(--electron-blue)" }}
          >
            Student Registration
          </h1>
          <p className="text-gray-600 text-sm">
            Enter your details to begin the enrollment process
          </p>
        </div>

        {/* Register Card */}
        <div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
        >
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: "var(--electron-blue)" }} />
                  Full Name
                </div>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: "var(--electron-blue)" }} />
                  Email Address
                </div>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Two-column grid for Contact Number and Date of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Contact Number */}
              <div>
                <label
                  htmlFor="contactNumber"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" style={{ color: "var(--electron-blue)" }} />
                    Contact Number
                  </div>
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="09XX-XXX-XXXX"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: "var(--electron-blue)" }} />
                    Date of Birth
                  </div>
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label
                className="block mb-1.5 text-sm font-medium text-gray-700"
              >
                Gender
              </label>
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={handleChange}
                    required
                    className="w-4 h-4"
                    style={{ accentColor: "var(--electron-blue)" }}
                  />
                  <span className="text-sm text-gray-700">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={handleChange}
                    required
                    className="w-4 h-4"
                    style={{ accentColor: "var(--electron-blue)" }}
                  />
                  <span className="text-sm text-gray-700">Female</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="prefer-not-to-say"
                    checked={formData.gender === "prefer-not-to-say"}
                    onChange={handleChange}
                    required
                    className="w-4 h-4"
                    style={{ accentColor: "var(--electron-blue)" }}
                  />
                  <span className="text-sm text-gray-700">Prefer not to say</span>
                </label>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" style={{ color: "var(--electron-blue)" }} />
                  Password
                </div>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                placeholder="Create a password"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: "var(--electron-blue)" }} />
                  Confirm Password
                </div>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password || !formData.fullName || formData.password !== formData.confirmPassword}
              className="w-full px-6 py-2.5 text-white rounded-md font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-4"
              style={{ 
                backgroundColor: "var(--electron-blue)"
              }}
            >
              {isLoading ? (
                <>
                  <span>Creating account...</span>
                  <span className="inline-block animate-spin">⏳</span>
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="font-semibold hover:underline"
              style={{ color: "var(--electron-blue)" }}
            >
              Back to Login
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-sm hover:underline font-medium inline-flex items-center gap-1"
            style={{ color: "var(--electron-blue)" }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Chat Assistant */}
      <ChatAssistant />

      {/* Success Modal */}
      {showSuccessModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-10 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#10B981" }}
            >
              <CheckCircle2 className="w-16 h-16 text-white" />
            </motion.div>

            <h2 className="text-3xl mb-4" style={{ color: "var(--electron-blue)" }}>
              Account created successfully!
            </h2>

            <p className="text-gray-600 text-base leading-relaxed mb-8">
              Please log in to continue with your enrollment application.
            </p>

            <Link
              to="/login"
              className="w-full block px-8 py-4 rounded-lg text-white font-semibold transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: "var(--electron-blue)" }}
            >
              OK
            </Link>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}