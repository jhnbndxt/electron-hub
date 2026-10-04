// Register page component
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LoaderCircle, Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";
import bcrypt from "bcryptjs";
import {
  clearRegistrationVerification,
  registerVerifiedUser,
  sendRegistrationOtp,
  verifyRegistrationOtp,
} from "../../services/authService";
import { linkPendingPublicAssessmentResult } from "../../services/assessmentResultService";
import { motion } from "motion/react";
import logo from "../../assets/electronLogo";
import { ChatAssistant } from "../components/ChatAssistant";

const initialFormData = {
  lastName: "",
  firstName: "",
  middleName: "",
  sex: "",
  birthDate: "",
  email: "",
  contactNumber: "",
  password: "",
  confirmPassword: "",
};

const initialTouchedFields = {
  lastName: false,
  firstName: false,
  middleName: false,
  sex: false,
  birthDate: false,
  email: false,
  contactNumber: false,
  password: false,
  confirmPassword: false,
};

type RegisterFormData = typeof initialFormData;
type RegisterField = keyof RegisterFormData;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_NUMBER_PATTERN = /^(09\d{9}|\+639\d{9})$/;
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*$/u;
const REGISTRATION_OTP_LENGTH = 8;
const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

const getPasswordRequirements = (password: string) => {
  const missingRequirements: string[] = [];
  if (password.length < 8) missingRequirements.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) missingRequirements.push("one uppercase letter");
  if (!/[a-z]/.test(password)) missingRequirements.push("one lowercase letter");
  if (!/\d/.test(password)) missingRequirements.push("one number");
  if (!/[^A-Za-z0-9]/.test(password)) missingRequirements.push("one special character");
  return missingRequirements;
};

const formatRequirementList = (requirements: string[]) => {
  if (requirements.length === 1) return requirements[0];
  if (requirements.length === 2) return `${requirements[0]} and ${requirements[1]}`;
  return `${requirements.slice(0, -1).join(", ")}, and ${requirements[requirements.length - 1]}`;
};

const getFieldError = (field: RegisterField, formData: RegisterFormData) => {
  switch (field) {
    case "birthDate": {
      const value = formData.birthDate.trim();
      if (!value) return "Enter your date of birth.";
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        // Age is one year less if birthday hasn't occurred yet this year
      }
      if (age < 0 || age > 120) return "Please enter a valid date of birth.";
      return "";
    }
    case "lastName": {
      const value = formData.lastName.trim();
      if (!value) return "Enter your last name.";
      if (value.length < 2) return "Last name must be at least 2 characters long.";
      if (!NAME_PATTERN.test(value)) return "Last name can only include letters, spaces, apostrophes, periods, and hyphens.";
      return "";
    }
    case "firstName": {
      const value = formData.firstName.trim();
      if (!value) return "Enter your first name.";
      if (value.length < 2) return "First name must be at least 2 characters long.";
      if (!NAME_PATTERN.test(value)) return "First name can only include letters, spaces, apostrophes, periods, and hyphens.";
      return "";
    }
    case "middleName": {
      const value = formData.middleName.trim();
      if (value && !NAME_PATTERN.test(value)) return "Middle name can only include letters, spaces, apostrophes, periods, and hyphens.";
      return "";
    }
    case "sex": {
      if (!formData.sex) return "Select your sex.";
      return "";
    }
    case "email": {
      const value = formData.email.trim();
      if (!value) return "Enter your email address.";
      if (!EMAIL_PATTERN.test(value)) return "Use a valid email format like name@example.com.";
      return "";
    }
    case "contactNumber": {
      const value = formData.contactNumber.trim();
      if (!value) return "Enter your contact number.";
      if (!CONTACT_NUMBER_PATTERN.test(value)) return "Use 09XXXXXXXXX or +639XXXXXXXXX.";
      return "";
    }
    case "password": {
      if (!formData.password) return "Create a password.";
      const missingRequirements = getPasswordRequirements(formData.password);
      if (missingRequirements.length > 0) return `Password must include ${formatRequirementList(missingRequirements)}.`;
      return "";
    }
    case "confirmPassword": {
      if (!formData.confirmPassword) return "Confirm your password.";
      if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
      return "";
    }
    default:
      return "";
  }
};

export function Register() {
  const [formData, setFormData] = useState(initialFormData);
  const [touchedFields, setTouchedFields] = useState(initialTouchedFields);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [cleanupWarning, setCleanupWarning] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (resendAvailableAt === null) return;

    const updateRemainingTime = () => {
      const remainingSeconds = Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
      setResendCooldownSeconds(remainingSeconds);
      if (remainingSeconds === 0) setResendAvailableAt(null);
    };

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(intervalId);
  }, [resendAvailableAt]);

  const fieldErrors = (Object.keys(initialFormData) as RegisterField[]).reduce((errors, field) => {
    errors[field] = getFieldError(field, formData);
    return errors;
  }, {} as Record<RegisterField, string>);

  const hasValidationErrors = (Object.keys(fieldErrors) as RegisterField[]).some((field) => Boolean(fieldErrors[field]));

  const getVisibleFieldError = (field: RegisterField) => {
    if (!touchedFields[field]) {
      return "";
    }

    return fieldErrors[field];
  };

  const getFieldSurfaceClassName = (field: RegisterField) => {
    const hasError = Boolean(getVisibleFieldError(field));

    return `auth-input-surface rounded-2xl px-4 py-2.5 ${hasError ? "!border-red-300 !bg-red-50/80 focus-within:!border-red-400" : ""}`;
  };

  const setFieldTouched = (field: RegisterField) => {
    setTouchedFields((currentFields) => {
      if (currentFields[field]) {
        return currentFields;
      }

      return {
        ...currentFields,
        [field]: true,
      };
    });
  };

  const completeRegistration = () => {
    setShowSuccessModal(false);
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouchedFields(
      (Object.keys(initialTouchedFields) as RegisterField[]).reduce((allTouched, field) => {
        allTouched[field] = true;
        return allTouched;
      }, { ...initialTouchedFields })
    );
    const firstValidationError = (Object.keys(fieldErrors) as RegisterField[])
      .map((field) => fieldErrors[field])
      .find(Boolean);
    if (firstValidationError) {
      setError(firstValidationError);
      return;
    }
    if (resendCooldownSeconds > 0) {
      setVerificationPending(true);
      setNotice(`A verification email was sent recently. You can request another in ${resendCooldownSeconds} seconds.`);
      return;
    }
    setIsLoading(true);
    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const { error: otpError, success } = await sendRegistrationOtp(normalizedEmail);
      if (otpError || !success) {
        setError(otpError || "Unable to send an email verification code right now.");
        return;
      }
      setFormData((current) => ({ ...current, email: normalizedEmail }));
      setVerificationCode("");
      setResendAvailableAt(Date.now() + VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000);
      setResendCooldownSeconds(VERIFICATION_RESEND_COOLDOWN_SECONDS);
      setVerificationPending(true);
    } catch (error: any) {
      setError(error.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const completeVerifiedRegistration = async () => {
    setError("");

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const passwordHash = await bcrypt.hash(formData.password, 10);
      const { error: registerError, user } = await registerVerifiedUser(normalizedEmail, passwordHash, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName.trim() || null,
        sex: formData.sex,
        birthDate: formData.birthDate.trim(),
        contactNumber: formData.contactNumber.trim(),
      });

      if (registerError || !user) {
        setError(registerError || "Unable to create your account right now. Try again.");
        return;
      }

      try {
        await linkPendingPublicAssessmentResult(normalizedEmail);
      } catch (syncError) {
        console.error("Unable to sync pending public assessment result:", syncError);
      }

      const { error: clearSessionError } = await clearRegistrationVerification();
      if (clearSessionError) {
        console.error("Account created, but the email verification session could not be cleared:", clearSessionError);
        setCleanupWarning("Your account was created, but the temporary email-verification session could not be cleared. Sign in to continue.");
      }

      setFormData((current) => ({ ...current, password: "", confirmPassword: "" }));
      setShowSuccessModal(true);
    } catch (error: unknown) {
      console.error("Error creating verified account:", error);
      setError(error instanceof Error ? error.message : "Unable to create your account right now. Try again.");
    }
  };

  const handleVerifyEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsLoading(true);

    try {
      if (!emailVerified) {
        const { error: verificationError, success } = await verifyRegistrationOtp(formData.email, verificationCode);
        if (verificationError || !success) {
          setError(verificationError || "The verification code could not be confirmed.");
          return;
        }
        setEmailVerified(true);
      }

      await completeVerifiedRegistration();
    } catch (error: unknown) {
      console.error("Error verifying registration email:", error);
      setError(error instanceof Error ? error.message : "Unable to verify this email right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerificationCode = async () => {
    if (isLoading || resendCooldownSeconds > 0) return;

    setError("");
    setNotice("");
    setIsLoading(true);
    try {
      const { error: otpError, success } = await sendRegistrationOtp(formData.email);
      if (otpError || !success) {
        setError(otpError || "Unable to resend the verification code right now.");
      } else {
        setVerificationCode("");
        setEmailVerified(false);
        setResendAvailableAt(Date.now() + VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000);
        setResendCooldownSeconds(VERIFICATION_RESEND_COOLDOWN_SECONDS);
        setNotice("A new 8-digit verification code has been sent. Check your inbox and spam folder, and use the latest code.");
      }
    } catch (error: unknown) {
      console.error("Error resending registration verification code:", error);
      setError(error instanceof Error ? error.message : "Unable to resend the verification code right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const returnToRegistrationDetails = async () => {
    setError("");
    setNotice("");
    if (emailVerified) {
      const { error: clearSessionError } = await clearRegistrationVerification();
      if (clearSessionError) {
        setError(`Unable to clear the verified session: ${clearSessionError}`);
        return;
      }
    }
    setVerificationPending(false);
    setVerificationCode("");
    setEmailVerified(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = e.target.name as RegisterField;
    const nextValue = field === "email" ? e.target.value.trimStart().toLowerCase() : e.target.value;

    if (error) {
      setError("");
    }
    if (notice) setNotice("");

    setFormData({
      ...formData,
      [field]: nextValue,
    });

    setFieldTouched(field);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFieldTouched(e.target.name as RegisterField);
  };

  return (
    <div className="auth-shell-bg flex min-h-screen items-center justify-center px-4 py-4 sm:px-6 lg:px-8">
      <div className="relative z-10 flex w-full max-w-6xl items-center justify-center">
        <div className="auth-panel auth-panel-compact w-full max-w-3xl rounded-[1.75rem] p-5 sm:p-6 lg:p-7">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] auth-logo-orb sm:h-[4.5rem] sm:w-[4.5rem]">
              <img src={logo} alt="Electron College Logo" className="h-16 w-16 scale-125 object-contain sm:h-[4.5rem] sm:w-[4.5rem]" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#b91c1c]">
              Student Registration
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {verificationPending ? "Verify your email" : "Create your account"}
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              {verificationPending
                ? `Enter the verification code sent to ${formData.email}.`
                : "Add your details to start your Electron Hub account and enrollment flow."}
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {notice && (
            <div role="status" className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {notice}
            </div>
          )}

          {verificationPending ? (
            <form onSubmit={handleVerifyEmail} className="mt-6 space-y-5">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-800" />
                  <p className="text-sm leading-6 text-blue-900">
                    Verify that you can access this email before we create your account. The code expires, so use the latest email.
                  </p>
                </div>
              </div>

              {!emailVerified ? (
                <div>
                  <label htmlFor="verificationCode" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                    8-digit email verification code
                  </label>
                  <div className="auth-input-surface rounded-2xl px-4 py-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(event) => {
                        setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, REGISTRATION_OTP_LENGTH));
                        setError("");
                      }}
                      inputMode="numeric"
                      pattern={`[0-9]{${REGISTRATION_OTP_LENGTH}}`}
                      maxLength={REGISTRATION_OTP_LENGTH}
                      autoComplete="one-time-code"
                      required
                      className="min-w-0 text-center text-lg font-semibold tracking-[0.35em] placeholder:text-slate-400"
                      placeholder={"0".repeat(REGISTRATION_OTP_LENGTH)}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  Email verified. Finish creating your account.
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (!emailVerified && verificationCode.length !== REGISTRATION_OTP_LENGTH)}
                className="auth-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    {emailVerified ? "Creating account..." : "Verifying email..."}
                  </>
                ) : emailVerified ? "Create Account" : "Verify Email"}
              </button>

              {!emailVerified && (
                <button
                  type="button"
                  onClick={handleResendVerificationCode}
                  disabled={isLoading || resendCooldownSeconds > 0}
                  className="w-full text-sm font-semibold text-[#1E3A8A] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendCooldownSeconds > 0
                    ? `Resend verification code in ${resendCooldownSeconds}s`
                    : "Resend verification code"}
                </button>
              )}

              <button
                type="button"
                onClick={returnToRegistrationDetails}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to registration details
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            {/* Last Name and First Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="lastName" className="sr-only">
                  Last Name
                </label>
                <div className={getFieldSurfaceClassName("lastName")}>
                  <User className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="family-name"
                    aria-invalid={Boolean(getVisibleFieldError("lastName"))}
                    className="min-w-0 text-sm placeholder:text-slate-400"
                    placeholder="Last name"
                  />
                </div>
                {getVisibleFieldError("lastName") && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 sm:text-sm">{getVisibleFieldError("lastName")}</p>
                )}
              </div>

              <div>
                <label htmlFor="firstName" className="sr-only">
                  First Name
                </label>
                <div className={getFieldSurfaceClassName("firstName")}>
                  <User className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="given-name"
                    aria-invalid={Boolean(getVisibleFieldError("firstName"))}
                    className="min-w-0 text-sm placeholder:text-slate-400"
                    placeholder="First name"
                  />
                </div>
                {getVisibleFieldError("firstName") && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 sm:text-sm">{getVisibleFieldError("firstName")}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="middleName" className="sr-only">
                Middle Name
              </label>
              <div className={getFieldSurfaceClassName("middleName")}>
                <User className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="additional-name"
                  aria-invalid={Boolean(getVisibleFieldError("middleName"))}
                  className="min-w-0 text-sm placeholder:text-slate-400"
                  placeholder="Middle name"
                />
              </div>
              {getVisibleFieldError("middleName") && (
                <p className="mt-1.5 text-xs font-medium text-red-600 sm:text-sm">{getVisibleFieldError("middleName")}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Sex Dropdown */}
              <div>
                <label htmlFor="sex" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Sex
                </label>
                <div className={getFieldSurfaceClassName("sex")}>
                  <User className="h-5 w-5 text-slate-400" />
                  <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    aria-invalid={Boolean(getVisibleFieldError("sex"))}
                    className="min-w-0 bg-transparent text-sm text-slate-700"
                  >
                    <option value="" disabled>
                      Select sex
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                {getVisibleFieldError("sex") && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 sm:text-sm">{getVisibleFieldError("sex")}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="birthDate" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Birth date
                </label>
                <div className={getFieldSurfaceClassName("birthDate")}>
                  <User className="h-5 w-5 text-slate-400" />
                  <input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    aria-invalid={Boolean(getVisibleFieldError("birthDate"))}
                    className="min-w-0 text-sm text-slate-700"
                  />
                </div>
                {getVisibleFieldError("birthDate") && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 sm:text-sm">{getVisibleFieldError("birthDate")}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email Address
                </label>
                <div className={getFieldSurfaceClassName("email")}>
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="email"
                    aria-invalid={Boolean(getVisibleFieldError("email"))}
                    className="min-w-0 text-sm placeholder:text-slate-400"
                    placeholder="Email address"
                  />
                </div>
                {getVisibleFieldError("email") && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 sm:text-sm">{getVisibleFieldError("email")}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label htmlFor="contactNumber" className="sr-only">
                  Contact Number
                </label>
                <div className={getFieldSurfaceClassName("contactNumber")}>
                  <Phone className="h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="tel"
                    aria-invalid={Boolean(getVisibleFieldError("contactNumber"))}
                    className="min-w-0 text-sm placeholder:text-slate-400"
                    placeholder="Contact number"
                  />
                </div>
                {getVisibleFieldError("contactNumber") ? (
                  <p className="mt-1.5 text-xs font-medium text-red-600 sm:text-sm">{getVisibleFieldError("contactNumber")}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500">Use 09XXXXXXXXX or +639XXXXXXXXX.</p>
                )}
              </div>
            </div>

            {/* Password and Confirm Password */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="sr-only">
                  Create Password
                </label>
                <div className={getFieldSurfaceClassName("password")}>
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="new-password"
                    aria-invalid={Boolean(getVisibleFieldError("password"))}
                    className="min-w-0 flex-1 text-sm placeholder:text-slate-400"
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((isVisible) => !isVisible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {getVisibleFieldError("password") && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 sm:text-sm">{getVisibleFieldError("password")}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <div className={getFieldSurfaceClassName("confirmPassword")}>
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="new-password"
                    aria-invalid={Boolean(getVisibleFieldError("confirmPassword"))}
                    className="min-w-0 flex-1 text-sm placeholder:text-slate-400"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((isVisible) => !isVisible)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {getVisibleFieldError("confirmPassword") && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 sm:text-sm">{getVisibleFieldError("confirmPassword")}</p>
                )}
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500 sm:text-sm">
              Use 8 or more characters with uppercase, lowercase, a number, and a special character.
            </p>

            <button
              type="submit"
              disabled={isLoading || hasValidationErrors}
              className="auth-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span>Creating account...</span>
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          )}

          <div className="mt-5 space-y-2 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="auth-secondary-link font-semibold hover:underline">
                Back to Login
              </Link>
            </p>
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Chat Assistant */}
      <ChatAssistant />

      {/* Success Modal */}
      {showSuccessModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(255, 255, 255, 0.35)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="auth-panel max-w-lg w-full rounded-[2rem] p-8 text-center sm:p-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-[0_18px_40px_rgba(16,185,129,0.28)]"
            >
              <CheckCircle2 className="w-16 h-16 text-white" />
            </motion.div>

            <h2 className="text-3xl font-semibold text-slate-900">
              Account Created Successfully
            </h2>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Your account has been created. You may now log in to access your dashboard.
            </p>
            {cleanupWarning && (
              <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {cleanupWarning}
              </p>
            )}

            <button
              type="button"
              onClick={completeRegistration}
              className="auth-primary-button mt-8 w-full rounded-2xl px-8 py-4 text-white font-semibold"
            >
              Go to Login
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
