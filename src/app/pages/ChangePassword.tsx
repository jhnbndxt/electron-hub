import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, LoaderCircle, Lock, Shield } from "lucide-react";
import bcrypt from "bcryptjs";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../supabase";

const getPasswordIssues = (password: string) => {
  const issues: string[] = [];
  if (password.length < 8) issues.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) issues.push("one uppercase letter");
  if (!/[a-z]/.test(password)) issues.push("one lowercase letter");
  if (!/\d/.test(password)) issues.push("one number");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("one special character");
  return issues;
};

export function ChangePassword() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [visibleFields, setVisibleFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleField = (field: keyof typeof visibleFields) => {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
  };

  const verifyCurrentPassword = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userData?.id)
      .single();

    if (error || !data?.password_hash) {
      throw new Error("Unable to verify your current password right now.");
    }

    const passwordMatches = await bcrypt.compare(formData.currentPassword, data.password_hash);
    if (!passwordMatches) {
      throw new Error("The current password you entered is incorrect.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData?.id) {
      toast.error("Please sign in again before changing your password.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    const passwordIssues = getPasswordIssues(formData.newPassword);
    if (passwordIssues.length > 0) {
      toast.error(`Password must include ${passwordIssues.join(", ")}.`);
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error("New password must be different from your current password.");
      return;
    }

    try {
      setIsSaving(true);
      await verifyCurrentPassword();

      const passwordHash = await bcrypt.hash(formData.newPassword, 10);
      const { error } = await supabase
        .from("users")
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userData.id);

      if (error) {
        throw new Error(error.message || "Failed to update password.");
      }

      toast.success("Password changed successfully.");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => navigate("/dashboard/profile"), 900);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to change password.");
    } finally {
      setIsSaving(false);
    }
  };

  const passwordField = (
    name: keyof typeof formData,
    label: string,
    placeholder: string,
    autoComplete: string
  ) => {
    const isVisible = visibleFields[name];

    return (
      <label>
        <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Lock className="h-4 w-4 text-blue-900" />
          {label}
        </span>
        <div className="relative">
          <input
            type={isVisible ? "text" : "password"}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            required
            minLength={name === "currentPassword" ? undefined : 8}
            autoComplete={autoComplete}
            className="w-full rounded-xl border border-slate-200 bg-white/85 px-4 py-3 pr-12 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => toggleField(name)}
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
    <div className="portal-dashboard-page flex w-full flex-col p-4 sm:p-6 lg:p-8">
      <Toaster position="top-center" />
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="portal-glass-panel-strong rounded-2xl p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--electron-blue)] text-white shadow-lg">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-950">Change Password</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Verify your current password before setting a new one for your Electron Hub account.
          </p>
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/80 p-4">
            <p className="text-sm font-semibold text-blue-950">Password requirements</p>
            <p className="mt-2 text-sm leading-6 text-blue-800">
              Use at least 8 characters with uppercase, lowercase, number, and special character.
            </p>
          </div>
        </section>

        <section className="portal-glass-panel rounded-2xl p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {passwordField("currentPassword", "Current Password", "Enter current password", "current-password")}
            {passwordField("newPassword", "New Password", "Enter new password", "new-password")}
            {passwordField("confirmPassword", "Confirm New Password", "Confirm new password", "new-password")}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/dashboard/profile")}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--electron-blue)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                {isSaving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
