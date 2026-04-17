import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { ChatAssistant } from "../components/ChatAssistant";
import logo from "../../assets/electronLogo";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="auth-shell-bg flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative z-10 w-full max-w-md">
        <div className="auth-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] auth-logo-orb">
              <img src={logo} alt="Electron College Logo" className="h-20 w-20 scale-125 object-contain" />
            </div>
          </div>

          {isSubmitted ? (
            <div className="flex h-full flex-col justify-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-[0_18px_40px_rgba(16,185,129,0.28)]">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>

              <h2 className="mt-6 text-center text-3xl font-semibold text-slate-900">
                Check your email
              </h2>
              <p className="mt-3 text-center text-base leading-7 text-slate-600">
                We&apos;ve sent password reset instructions to the address below.
              </p>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Registered email</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 break-all">{email}</p>
              </div>

              <p className="mt-4 text-center text-sm leading-6 text-slate-500">
                Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
              </p>

              <Link
                to="/login"
                className="auth-primary-button mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Login
              </Link>

              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-4 text-sm font-semibold text-[#1E3A8A] hover:underline"
              >
                Didn&apos;t receive the email? Send another link
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-center text-3xl font-semibold text-slate-900 sm:text-[2.2rem]">
                Reset your password
              </h1>
              <p className="mt-2 text-center text-sm leading-6 text-slate-500 sm:text-base">
                Enter the email tied to your Electron Hub account and we&apos;ll send instructions to reset your password.
              </p>

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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                      className="min-w-0 text-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <p className="text-sm text-slate-500">
                  Use the same email address you registered with so the reset link reaches the correct account.
                </p>

                <button
                  type="submit"
                  className="auth-primary-button w-full rounded-2xl px-6 py-4 text-base font-semibold text-white"
                >
                  Get Reset Link
                </button>
              </form>

              <div className="mt-6 space-y-3 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
                <div>
                  <Link to="/register" className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline">
                    Create new account
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ChatAssistant />
    </div>
  );
}
