import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff, LockKeyhole, LoaderCircle } from "lucide-react";
import { ChatAssistant } from "../components/ChatAssistant";
import logo from "../../assets/electronLogo";

export function ResetPassword() {
  const [resetToken, setResetToken] = useState("");
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({ newPassword: false, confirmPassword: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    setResetToken(token);
    if (!token) {
      setErrorMessage("This password reset link is missing or invalid. Request a new reset link.");
    }
    setIsCheckingRecovery(false);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!resetToken) {
      setErrorMessage("A valid password reset link is required. Request a new reset link.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Your new password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", token: resetToken, password: newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Unable to update your password. Please try again.");
      }

      setNewPassword("");
      setConfirmPassword("");
      setIsComplete(true);
    } catch (error) {
      console.error("Error updating password:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unable to update your password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordField = (
    field: "newPassword" | "confirmPassword",
    label: string,
    value: string,
    onChange: (value: string) => void
  ) => {
    const isVisible = showPasswords[field];
    return (
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
        <div className="relative">
          <input
            type={isVisible ? "text" : "password"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3.5 pr-12 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            placeholder={label}
          />
          <button
            type="button"
            onClick={() => setShowPasswords((current) => ({ ...current, [field]: !current[field] }))}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>
    );
  };

  return (
    <div className="auth-shell-bg flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="relative z-10 w-full max-w-md">
        <div className="auth-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] auth-logo-orb">
              <img src={logo} alt="Electron College Logo" className="h-20 w-20 scale-125 object-contain" />
            </div>
          </div>

          {isCheckingRecovery ? (
            <div className="py-6 text-center">
              <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-blue-800" />
              <h1 className="mt-5 text-2xl font-semibold text-slate-900">Verifying reset link</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Please wait while we verify your secure password reset session.</p>
            </div>
          ) : isComplete ? (
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_18px_40px_rgba(16,185,129,0.28)]">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h1 className="mt-6 text-3xl font-semibold text-slate-900">Password updated</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your password has been changed successfully. You can now return to Electron Hub and sign in.
              </p>
              <Link
                to="/login"
                className="auth-primary-button mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                Return to Login
              </Link>
            </div>
          ) : resetToken ? (
            <>
              <h1 className="text-center text-3xl font-semibold text-slate-900 sm:text-[2.2rem]">Choose a new password</h1>
              <p className="mt-2 text-center text-sm leading-6 text-slate-500 sm:text-base">
                Enter and confirm the new password for your Electron Hub account.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {passwordField("newPassword", "New Password", newPassword, setNewPassword)}
                {passwordField("confirmPassword", "Confirm New Password", confirmPassword, setConfirmPassword)}
                <p className="text-sm text-slate-500">Use at least 8 characters.</p>

                {errorMessage && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-slate-900">Reset link unavailable</h1>
              <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">{errorMessage}</p>
              <Link
                to="/forgot-password"
                className="auth-primary-button mt-8 flex w-full items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold text-white"
              >
                Request another reset link
              </Link>
            </div>
          )}
        </div>
      </div>
      <ChatAssistant />
    </div>
  );
}
