// Register page component
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { registerUser } from "../../services/authService";
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
  const navigate = useNavigate();

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
    setIsLoading(true);
    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const { error: registerError, user } = await registerUser(
        normalizedEmail,
        formData.password,
        {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          middleName: formData.middleName.trim() || null,
          sex: formData.sex,
          birthDate: formData.birthDate.trim(),
          contactNumber: formData.contactNumber.trim(),
        }
      );
      if (registerError || !user) {
        setError(registerError || "Unable to create your account right now.");
        return;
      }
      try {
        await linkPendingPublicAssessmentResult(normalizedEmail);
      } catch (syncError) {
        console.error("Unable to sync pending public assessment result:", syncError);
      }
      setFormData({
        ...formData,
        email: normalizedEmail,
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      setError(error.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = e.target.name as RegisterField;
    const nextValue = field === "email" ? e.target.value.trimStart().toLowerCase() : e.target.value;

    if (error) {
      setError("");
    }

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
              Create your account
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Add your details to start your Electron Hub account and enrollment flow.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

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
