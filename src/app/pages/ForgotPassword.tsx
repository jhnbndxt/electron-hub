import { useState } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { ChatAssistant } from "../components/ChatAssistant";
const logo = "";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending reset email
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
        }}
      >
        <div className="max-w-md w-full">
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#10B981" }}
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Check Your Email
              </h1>
              <p className="text-gray-600 mb-2">
                We've sent a password reset link to:
              </p>
              <p className="font-semibold text-gray-900 mb-4">{email}</p>
              <p className="text-sm text-gray-500">
                Click the link in the email to reset your password. If you don't
                see it, check your spam folder.
              </p>
            </div>

            {/* Back to Login */}
            <Link
              to="/login"
              className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg"
              style={{ backgroundColor: "#1E3A8A" }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Login
            </Link>

            {/* Resend Link */}
            <div className="text-center mt-4">
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-sm font-medium hover:underline"
                style={{ color: "#1E3A8A" }}
              >
                Didn't receive the email? Click to resend
              </button>
            </div>
          </div>
        </div>

        <ChatAssistant />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
      }}
    >
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="Electron College Logo"
              className="w-32 h-32 object-contain"
            />
          </div>
          <h1 className="text-3xl font-semibold mb-2 text-white">
            Forgot Password?
          </h1>
          <p className="text-blue-100">
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
              style={{ backgroundColor: "#1E3A8A" }}
            >
              Send Reset Link
            </button>
          </form>
        </div>

        {/* Back to Login Link */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-white font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>

      <ChatAssistant />
    </div>
  );
}
