import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, Camera, LoaderCircle, Lock, Mail, Phone, Save, User } from "lucide-react";
import bcrypt from "bcryptjs";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { loadProfileImageUrl, uploadProfileImage, validateProfileImageFile } from "../utils/profileImage";
import { supabase } from "../../supabase";

export function EditProfile() {
  const { userData, user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState(userData?.profilePictureUrl || "");
  const [formData, setFormData] = useState({
    fullName: userData?.name || user?.name || "",
    email: userData?.email || user?.email || "",
    contactNumber: "",
    dateOfBirth: "",
    sex: "",
    currentPassword: "",
  });

  const previewUrl = useMemo(
    () => (selectedPhoto ? URL.createObjectURL(selectedPhoto) : ""),
    [selectedPhoto]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const loadProfile = async () => {
      const userId = userData?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, contact_number, birth_date, sex")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setFormData((current) => ({
          ...current,
          fullName: data.full_name || "",
          email: data.email || "",
          contactNumber: data.contact_number || "",
          dateOfBirth: data.birth_date || "",
          sex: data.sex || "",
        }));
      }

      const imageUrl = await loadProfileImageUrl(userData.id, userData.email);
      if (imageUrl) setProfileImageUrl(imageUrl);
    };

    loadProfile();
  }, [userData?.id, userData?.email]);

  const userInitial =
    (formData.fullName || "Student")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase())
      .join("") || "S";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const validationError = validateProfileImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedPhoto(file);
  };

  const verifyCurrentPassword = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userData?.id)
      .single();

    if (error || !data?.password_hash) {
      throw new Error("Unable to verify your password right now.");
    }

    const passwordMatches = await bcrypt.compare(formData.currentPassword, data.password_hash);
    if (!passwordMatches) {
      throw new Error("The current password you entered is incorrect.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = userData?.id;
    if (!userId) return;

    if (!formData.currentPassword) {
      toast.error("Enter your current password before saving changes.");
      return;
    }

    try {
      setIsSaving(true);
      await verifyCurrentPassword();

      let nextProfileImageUrl = profileImageUrl;
      if (selectedPhoto) {
        const { imageUrl } = await uploadProfileImage({
          userId,
          email: userData?.email,
          file: selectedPhoto,
        });
        nextProfileImageUrl = imageUrl;
      }

      const { error } = await supabase
        .from("users")
        .update({
          full_name: formData.fullName,
          contact_number: formData.contactNumber,
          birth_date: formData.dateOfBirth || null,
          sex: formData.sex || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        throw new Error(error.message || "Failed to update profile.");
      }

      updateUserData({
        name: formData.fullName,
        contactNumber: formData.contactNumber,
        birthDate: formData.dateOfBirth,
        sex: formData.sex,
        profilePictureUrl: nextProfileImageUrl,
      });
      setProfileImageUrl(nextProfileImageUrl);
      setSelectedPhoto(null);
      setFormData((current) => ({ ...current, currentPassword: "" }));
      toast.success("Profile updated successfully.");
      setTimeout(() => navigate("/dashboard/profile"), 900);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="portal-dashboard-page flex w-full flex-col p-4 sm:p-6 lg:p-8">
      <Toaster position="top-center" />
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Edit Profile</h1>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Update your personal details and profile photo. Your current password is required to save changes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="portal-glass-panel rounded-2xl p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handlePhotoSelection}
            />
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-36 w-36 shadow-lg ring-4 ring-white/80">
                  <AvatarImage src={previewUrl || profileImageUrl} alt="Profile photo preview" className="object-cover" />
                  <AvatarFallback className="text-4xl font-bold text-white" style={{ backgroundColor: "var(--electron-blue)" }}>
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--electron-red)] text-white shadow-lg transition hover:-translate-y-0.5"
                  aria-label="Choose profile photo"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">{formData.fullName || "Student"}</h2>
              <p className="mt-1 break-all text-sm text-slate-500">{formData.email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Choose Photo
              </button>
              {selectedPhoto && (
                <p className="mt-3 text-xs font-medium text-blue-800">
                  New photo selected. Save changes to apply it.
                </p>
              )}
            </div>
          </section>

          <section className="portal-glass-panel rounded-2xl p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <User className="h-4 w-4 text-blue-900" />
                  Full Name
                </span>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter your full name"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail className="h-4 w-4 text-blue-900" />
                  Email Address
                </span>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                />
              </label>

              <label>
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Phone className="h-4 w-4 text-blue-900" />
                  Contact Number
                </span>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
                  placeholder="09XX-XXX-XXXX"
                />
              </label>

              <label>
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Calendar className="h-4 w-4 text-blue-900" />
                  Date of Birth
                </span>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-semibold text-slate-700">Sex</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {["Male", "Female"].map((option) => (
                    <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white/75 px-4 py-3">
                      <input
                        type="radio"
                        name="sex"
                        value={option}
                        checked={formData.sex === option}
                        onChange={handleChange}
                        className="h-4 w-4"
                        style={{ accentColor: "var(--electron-blue)" }}
                      />
                      <span className="text-sm font-semibold text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="sm:col-span-2">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Lock className="h-4 w-4 text-blue-900" />
                  Current Password
                </span>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter current password to save"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
                {isSaving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
