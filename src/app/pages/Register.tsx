// Register page component
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Calendar, CheckCircle, CheckCircle2, Lock, Mail, Phone, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ChatAssistant } from "../components/ChatAssistant";
import { registerUser } from "../../services/authService";
import { motion } from "motion/react";
import logo from "../../assets/electronLogo";

const initialFormData = {
  fullName: "",
  email: "",
  contactNumber: "",
  dateOfBirth: "",
  gender: "",
  password: "",
  confirmPassword: "",
};

const initialTouchedFields = {
  fullName: false,
  email: false,
  contactNumber: false,
  dateOfBirth: false,
  gender: false,
  password: false,
  confirmPassword: false,
};

type RegisterFormData = typeof initialFormData;
type RegisterField = keyof RegisterFormData;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_NUMBER_PATTERN = /^(09\d{9}|\+639\d{9})$/;
const FULL_NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*$/u;

const formatRequirementList = (requirements: string[]) => {
  if (requirements.length === 1) {
    return requirements[0];
  }

  if (requirements.length === 2) {
    return `${requirements[0]} and ${requirements[1]}`;
  }

  return `${requirements.slice(0, -1).join(", ")}, and ${requirements[requirements.length - 1]}`;
};

const getPasswordRequirements = (password: string) => {
  const missingRequirements: string[] = [];

  if (password.length < 8) {
    missingRequirements.push("at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    missingRequirements.push("one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    missingRequirements.push("one lowercase letter");
  }

  if (!/\d/.test(password)) {
    missingRequirements.push("one number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    missingRequirements.push("one special character");
  }

  return missingRequirements;
};

const getFieldError = (field: RegisterField, formData: RegisterFormData) => {
  switch (field) {
    case "fullName": {
      const value = formData.fullName.trim();

      if (!value) {
        return "Enter your full name.";
      }

      if (value.length < 4) {
        return "Full name must be at least 4 characters long.";
      }

      if (!FULL_NAME_PATTERN.test(value)) {
        return "Full name can only include letters, spaces, apostrophes, periods, and hyphens.";
      }

      return "";
    }

    case "email": {
      const value = formData.email.trim();

      if (!value) {
        return "Enter your email address.";
      }

      if (!EMAIL_PATTERN.test(value)) {
        return "Use a valid email format like name@example.com.";
      }

      return "";
    }

    case "contactNumber": {
      const value = formData.contactNumber.trim();

      if (!value) {
        return "Enter your contact number.";
      }

      if (!CONTACT_NUMBER_PATTERN.test(value)) {
        return "Use 09XXXXXXXXX or +639XXXXXXXXX.";
      }

      return "";
    }

    case "dateOfBirth": {
      if (!formData.dateOfBirth) {
        return "Select your birth date.";
      }

      const selectedDate = new Date(formData.dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (Number.isNaN(selectedDate.getTime())) {
        return "Use a valid birth date.";
      }

      if (selectedDate > today) {
        return "Birth date cannot be in the future.";
      }

      return "";
    }

    case "gender": {
      if (!formData.gender) {
        return "Select your gender.";
      }

      return "";
    }

    case "password": {
      if (!formData.password) {
        return "Create a password.";
      }

      const missingRequirements = getPasswordRequirements(formData.password);

      if (missingRequirements.length > 0) {
        return `Password must include ${formatRequirementList(missingRequirements)}.`;
      }

      return "";
    }

    case "confirmPassword": {
      if (!formData.confirmPassword) {
        return "Confirm your password.";
      }

      if (formData.password !== formData.confirmPassword) {
        return "Passwords do not match.";
      }

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
  const { login } = useAuth();
  const maxBirthDate = new Date().toISOString().split("T")[0];

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
    navigate("/dashboard", { replace: true });
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
        formData.fullName.trim(),
        {
          contactNumber: formData.contactNumber.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
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

      login("student", {
        id: user.id,
        name: user.full_name,
        email: user.email,
        profilePictureUrl: user.profile_picture_url || undefined,
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="sr-only">
                  Full Name
                </label>
                <div className={getFieldSurfaceClassName("fullName")}>
                  <User className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="name"
                    aria-invalid={Boolean(getVisibleFieldError("fullName"))}
                    className="min-w-0 text-sm placeholder:text-slate-400"
                    placeholder="Full name"
                  />
                </div>
                {getVisibleFieldError("fullName") && (
                  <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("fullName")}</p>
                )}
              </div>

              <div className="sm:col-span-2">
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
                    placeholder="Email"
                  />
                </div>
                {getVisibleFieldError("email") && (
                  <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("email")}</p>
                )}
              </div>

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

              <div>
                <label htmlFor="dateOfBirth" className="sr-only">
                  Date of Birth
                </label>
                <div className={getFieldSurfaceClassName("dateOfBirth")}>
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    max={maxBirthDate}
                    aria-invalid={Boolean(getVisibleFieldError("dateOfBirth"))}
                    className="min-w-0 text-sm text-slate-700"
                  />
                </div>
                {getVisibleFieldError("dateOfBirth") && (
                  <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("dateOfBirth")}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700">Gender</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ].map((option) => {
                  const isActive = formData.gender === option.value;
                  const hasGenderError = Boolean(getVisibleFieldError("gender"));

                  return (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A] shadow-sm"
                          : hasGenderError
                            ? "border-red-300 bg-red-50/80 text-red-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={isActive}
                        onChange={handleChange}
                        onBlur={() => setFieldTouched("gender")}
                        required
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
              {getVisibleFieldError("gender") && (
                <p className="mt-2 text-sm font-medium text-red-600">{getVisibleFieldError("gender")}</p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
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
                    placeholder="Password"
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
                  <CheckCircle className="h-5 w-5 text-slate-400" />
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
              disabled={
                isLoading || hasValidationErrors
              }
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
              Welcome to Electron Hub
            </h2>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Your account is ready. Continue to your dashboard to start the assessment and enrollment process.
            </p>

            <button
              type="button"
              onClick={completeRegistration}
              className="auth-primary-button mt-8 w-full rounded-2xl px-8 py-4 text-white font-semibold"
            >
              Continue to Dashboard
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}