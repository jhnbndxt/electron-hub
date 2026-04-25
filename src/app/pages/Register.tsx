// Register page component
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle2, Lock, Mail, Phone, User } from "lucide-react";
import { registerUser } from "../../services/authService";
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

    return `auth-input-surface rounded-2xl px-4 py-3.5 ${hasError ? "!border-red-300 !bg-red-50/80 focus-within:!border-red-400" : ""}`;
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
    <div className="auth-shell-bg flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative z-10 w-full max-w-2xl">
        <div className="auth-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] auth-logo-orb">
              <img src={logo} alt="Electron College Logo" className="h-20 w-20 scale-125 object-contain" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold text-slate-900 sm:text-[2.2rem]">
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Add your details to start your Electron Hub account and enrollment flow.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {/* Last Name and First Name */}
            <div className="grid gap-5 sm:grid-cols-2">
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
                  <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("lastName")}</p>
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
                  <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("firstName")}</p>
                )}
              </div>
            </div>

            {/* Middle Name (Optional) */}
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
                  placeholder="Middle name (optional)"
                />
              </div>
              {getVisibleFieldError("middleName") && (
                <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("middleName")}</p>
              )}
            </div>

            {/* Sex Dropdown */}
            <div>
              <label htmlFor="sex" className="mb-2 block text-sm font-semibold text-slate-700">
                Sex *
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
                  className="min-w-0 text-sm bg-transparent text-slate-700"
                >
                  <option value="" disabled>
                    Select sex
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              {getVisibleFieldError("sex") && (
                <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("sex")}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="birthDate" className="mb-2 block text-sm font-semibold text-slate-700">
                Date of Birth *
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
                <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("birthDate")}</p>
              )}
            </div>

            {/* Email */}
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
                <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("email")}</p>
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
                <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("contactNumber")}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Use 09XXXXXXXXX or +639XXXXXXXXX.</p>
              )}
            </div>

            {/* Password and Confirm Password */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="sr-only">
                  Create Password
                </label>
                <div className={getFieldSurfaceClassName("password")}>
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="new-password"
                    aria-invalid={Boolean(getVisibleFieldError("password"))}
                    className="min-w-0 text-sm placeholder:text-slate-400"
                    placeholder="Create password"
                  />
                </div>
                {getVisibleFieldError("password") && (
                  <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("password")}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <div className={getFieldSurfaceClassName("confirmPassword")}>
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="new-password"
                    aria-invalid={Boolean(getVisibleFieldError("confirmPassword"))}
                    className="min-w-0 text-sm placeholder:text-slate-400"
                    placeholder="Confirm password"
                  />
                </div>
                {getVisibleFieldError("confirmPassword") && (
                  <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("confirmPassword")}</p>
                )}
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Use 8 or more characters with uppercase, lowercase, a number, and a special character.
            </p>

            <button
              type="submit"
              disabled={isLoading || hasValidationErrors}
              className="auth-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#1E3A8A] hover:underline">
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
          style={{ backdropFilter: "blur(10px)", backgroundColor: "rgba(15, 23, 42, 0.45)" }}
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
