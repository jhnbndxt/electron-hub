import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, User, Mail, Phone, Calendar, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../../supabase";

export function EditProfile() {
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  
  // Load profile data from Supabase
  const [formData, setFormData] = useState({
    fullName: userData?.name || user?.name || "",
    email: userData?.email || user?.email || "",
    contactNumber: "",
    dateOfBirth: "",
    gender: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      const userId = userData?.id;
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setFormData({
          fullName: data.full_name || '',
          email: data.email || '',
          contactNumber: data.contact_number || '',
          dateOfBirth: data.birth_date || '',
          gender: data.gender || '',
        });
      }
    };
    loadProfile();
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userId = userData?.id;
    if (!userId) return;

    // Save to Supabase users table
    const { error } = await supabase
      .from('users')
      .update({
        full_name: formData.fullName,
        contact_number: formData.contactNumber,
        birth_date: formData.dateOfBirth || null,
        gender: formData.gender || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
      return;
    }
    
    // Show success toast
    toast.success("Profile updated successfully!", {
      duration: 3000,
      position: "top-center",
      style: {
        background: "#10B981",
        color: "#fff",
        padding: "16px",
        borderRadius: "8px",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#10B981",
      },
    });
    
    // Navigate back to dashboard after a brief delay
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="p-6">
      <Toaster />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity"
            style={{ color: "var(--electron-blue)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl mb-2" style={{ color: "var(--electron-blue)" }}>
            Edit Profile
          </h1>
          <p className="text-gray-600">Update your personal information</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: "#1E3A8A" }} />
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: "#1E3A8A" }} />
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Contact Number & Date of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                    Contact Number
                  </div>
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="09XX-XXX-XXXX"
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                    Date of Birth
                  </div>
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={handleChange}
                    className="w-4 h-4"
                    style={{ accentColor: "#1E3A8A" }}
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
                    className="w-4 h-4"
                    style={{ accentColor: "#1E3A8A" }}
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
                    className="w-4 h-4"
                    style={{ accentColor: "#1E3A8A" }}
                  />
                  <span className="text-sm text-gray-700">Prefer not to say</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 text-white rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1E3A8A" }}
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}