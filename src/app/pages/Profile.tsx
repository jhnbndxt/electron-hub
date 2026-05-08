import { Mail, Phone, MapPin, Calendar, Award, CheckCircle, Users2, BookOpen, AlertCircle, CreditCard, Camera, LoaderCircle, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getAssessmentHistory } from "../../services/assessmentResultService";
import { supabase } from "../../supabase";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { loadProfileImageUrl, uploadProfileImage } from "../utils/profileImage";
import { exportToCSV, formatDateForCSV } from "../../utils/csvExport";
import { LoadingState } from "../components/LoadingState";

interface AssessmentResult {
  id: string;
  date: string;
  track: string;
  electives: string[];
  scores: { VA: number; MA: number; SA: number; LRA: number };
  topDomains: string[];
  topInterests: string[];
  overallScore: number;
}

// Helper to format assessment date
function formatAssessmentDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function Profile() {
  const { userData, enrollmentProgress, updateUserData, logout } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState({
    fullName: userData?.name || "Student",
    email: userData?.email || "",
    contactNumber: "",
    dateOfBirth: "",
    gender: "",
  });

  // Check if enrollment has been submitted
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  
  // Check if assessment has been taken
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResult[]>([]);
  
  // Payment history state
  const [paymentData, setPaymentData] = useState<any>(null);
  const [profileImageUrl, setProfileImageUrl] = useState(userData?.profilePictureUrl || "");
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (userData) {
      console.log("[Profile] Displaying user data:", userData);
      setProfileData((current) => ({
        ...current,
        fullName: userData.name || `${userData.firstName || ''} ${userData.middleName || ''} ${userData.lastName || ''}`.trim(),
        email: userData.email || current.email || "",
        contactNumber: userData.contactNumber || current.contactNumber || "",
        dateOfBirth: userData.birthDate || current.dateOfBirth || "",
        gender: userData.sex || current.gender || "",
      }));
    } else {
      console.log("[Profile] No user data available to display.");
    }
  }, [userData]);

  useEffect(() => {
    if (userData?.profilePictureUrl) {
      setProfileImageUrl(userData.profilePictureUrl);
    }
  }, [userData?.profilePictureUrl]);

  const formatAddress = (data: any) => {
    const addressParts = [data?.homeAddress, data?.barangay, data?.city]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    return addressParts.length > 0 ? addressParts.join(", ") : "Not specified";
  };

  // Function to check enrollment and assessment status
  const checkStatus = async () => {
    const userId = userData?.id;
    const userEmail = userData?.email || "";
    
    // Check enrollment data from Supabase
    if (userEmail) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, enrollment_documents(*)')
        .eq('user_id', userEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const latestEnrollment = enrollments?.[0];
      setEnrollmentData(
        latestEnrollment
          ? {
              ...latestEnrollment,
              ...(latestEnrollment.form_data || {}),
              enrollment_documents: latestEnrollment.enrollment_documents || [],
            }
          : null
      );
    }

    // Check assessment history from Supabase
    try {
      if (!userEmail) {
        setAssessmentHistory([]);
      } else {
        const history = await getAssessmentHistory(userEmail);
        const results = (history.results?.filter(Boolean) ?? []) as AssessmentResult[];
        setAssessmentHistory(results);
      }
    } catch (error) {
      console.error('Error fetching assessment history:', error);
      setAssessmentHistory([]);
    }
    
    // Check payment data from Supabase
    if (userId) {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      setPaymentData(payments?.[0] || null);
    }
    
    // Load registration data from Supabase users table.
    if (userId || userEmail) {
      const profileLookup = userId
        ? supabase
            .from('users')
            .select('id, email, full_name, contact_number, birth_date, sex')
            .eq('id', userId)
            .maybeSingle()
        : supabase
            .from('users')
            .select('id, email, full_name, contact_number, birth_date, sex')
            .eq('email', userEmail)
            .maybeSingle();

      const { data: userRecord, error: userError } = await profileLookup;

      if (userError) {
        console.error('Error loading profile data:', userError);
      } else if (userRecord) {
        setProfileData({
          fullName: userRecord.full_name || userData?.name || 'Student',
          email: userRecord.email || userEmail,
          contactNumber: userRecord.contact_number || '',
          dateOfBirth: userRecord.birth_date || '',
          gender: userRecord.sex || '',
        });
      }

      const imageUrl = await loadProfileImageUrl(userId, userEmail);

      if (imageUrl) {
        setProfileImageUrl(imageUrl);

        if (imageUrl !== userData?.profilePictureUrl) {
          updateUserData({ profilePictureUrl: imageUrl });
        }
      }
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!userData?.id) {
      toast.error("Please sign in again before updating your profile photo.");
      return;
    }

    try {
      setIsUploadingProfileImage(true);

      const { imageUrl, usedStorageFallback } = await uploadProfileImage({
        userId: userData.id,
        email: userData.email,
        file: selectedFile,
      });

      setProfileImageUrl(imageUrl);
      updateUserData({ profilePictureUrl: imageUrl });

      if (usedStorageFallback) {
        toast.success("Profile photo uploaded to Supabase Storage. Cross-device loading now uses the storage fallback until the users.profile_picture_url column is added.");
      } else {
        toast.success("Profile photo updated successfully.");
      }
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload profile photo.");
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  // Reload profile data when component mounts or when returning from edit
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        // Check status on mount (loads from Supabase)
        await checkStatus();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeProfile();

    // Add event listener for window focus (when user returns to tab)
    const handleFocus = () => {
      checkStatus();
    };

    window.addEventListener('focus', handleFocus);
    
    // Also check when the component becomes visible (route navigation)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userData, location]); // Re-run when location changes (navigation)

  // Format date of birth for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  // Format gender for display
  const formatGender = (gender: string) => {
    if (!gender) return "Not specified";
    if (gender === "prefer-not-to-say") return "Prefer not to say";
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  // Use registration data for personal info, enrollment data only for address
  const studentInfo = {
    name: profileData.fullName || userData?.name || "Student",
    email: profileData.email || userData?.email || "Not specified",
    phone: profileData.contactNumber || "Not specified",
    address: formatAddress(enrollmentData),
    birthDate: formatDate(profileData.dateOfBirth),
    gender: formatGender(profileData.gender),
    studentId: "2026-00001",
  };

  // Calculate actual progress stats
  const completedSteps = enrollmentProgress.filter(step => step.status === "completed").length;
  const totalSteps = enrollmentProgress.length;
  
  // Count documents for quick stats and export
  const enrollmentDocuments =
    enrollmentData?.enrollment_documents ||
    (enrollmentData?.documents ? Object.values(enrollmentData.documents) : []);
  const documentsVerified = enrollmentDocuments.filter(
    (doc: any) => String(doc?.status || "").toLowerCase() === "approved"
  ).length;
  const documentsSubmitted = enrollmentDocuments.filter((doc: any) => doc != null).length;
  const totalDocuments = 5; // Total required documents
  const enrollmentProgressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const getDocumentKey = (doc: any) =>
    String(doc?.document_type || doc?.type || doc?.key || doc?.name || "").toLowerCase();
  const isDocumentApproved = (doc: any) => String(doc?.status || "").toLowerCase() === "approved";
  const requiredDocumentKeys = ["form138", "report_card", "birth", "idpicture", "id_picture", "diploma"];
  const followUpDocumentKeys = ["esc", "form137", "goodmoral", "good_moral", "moral"];
  const requiredDocumentsVerified = enrollmentDocuments.filter((doc: any) => {
    const key = getDocumentKey(doc).replace(/[\s_-]/g, "");
    return isDocumentApproved(doc) && requiredDocumentKeys.some((requiredKey) => key.includes(requiredKey.replace(/[\s_-]/g, "")));
  }).length;
  const followUpDocumentsVerified = enrollmentDocuments.filter((doc: any) => {
    const key = getDocumentKey(doc).replace(/[\s_-]/g, "");
    return isDocumentApproved(doc) && followUpDocumentKeys.some((followUpKey) => key.includes(followUpKey.replace(/[\s_-]/g, "")));
  }).length;
  
  // Get enrollment status from progress
  const getEnrollmentStatus = () => {
    const paymentVerifiedStep = enrollmentProgress.find(step => step.name === "Payment Verified");
    const enrolledStep = enrollmentProgress.find(step => step.name === "Enrolled");
    const documentsVerifiedStep = enrollmentProgress.find(step => step.name === "Documents Verified");
    
    if (enrolledStep?.status === "completed") {
      return { label: "Enrolled", color: "bg-green-100 text-green-700" };
    } else if (paymentVerifiedStep?.status === "completed") {
      return { label: "Payment Verified", color: "bg-blue-100 text-blue-700" };
    } else if (documentsVerifiedStep?.status === "completed") {
      return { label: "Documents Verified", color: "bg-purple-100 text-purple-700" };
    } else if (enrollmentData) {
      return { label: "Pending Review", color: "bg-yellow-100 text-yellow-700" };
    }
    return { label: "Not Started", color: "bg-gray-100 text-gray-700" };
  };
  
  const enrollmentStatus = getEnrollmentStatus();

  // Get user initial
  const userInitial =
    studentInfo.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((namePart) => namePart[0]?.toUpperCase())
      .join("") || "S";

  // CSV Export for Student Record
  const handleExportStudentRecordCSV = () => {
    const headers = [
      "Student ID",
      "Full Name",
      "Email",
      "Phone",
      "Date of Birth",
      "Gender",
      "Address",
      "Enrollment Status",
      "Progress",
      "Documents Submitted",
      "Assessment Status",
      "Export Date"
    ];
    const assessmentStatus = assessmentHistory.length > 0 ? "Completed" : "Not Started";
    const rows = [[
      studentInfo.studentId,
      studentInfo.name,
      studentInfo.email,
      studentInfo.phone,
      studentInfo.birthDate,
      studentInfo.gender,
      studentInfo.address,
      enrollmentStatus.label,
      `${completedSteps}/${totalSteps} steps`,
      `${documentsSubmitted}/${totalDocuments}`,
      assessmentStatus,
      new Date().toLocaleDateString('en-US')
    ]];
    exportToCSV({
      filename: `student-record-${studentInfo.studentId}-${new Date().toISOString().split('T')[0]}`,
      title: "Student Record Export",
      subtitle: `Electron Hub - Student Management System`,
      headers,
      rows,
    });
  };

  return (
    <div className="portal-dashboard-page flex w-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-center" />

      {isInitializing ? (
        <LoadingState
          message="Loading your profile..."
          subtext="Retrieving your personal information, records, and latest activity."
        />
      ) : (
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">My Profile</h1>
            <p className="text-sm leading-6 text-slate-600">
              Manage your personal information and monitor your enrollment activity.
            </p>
          </div>

          <section className="portal-glass-panel-strong relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-10 h-52 w-52 rounded-full bg-red-300/16 blur-3xl" />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleProfileImageUpload}
            />

            <div className="relative z-10 flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
              <div className="relative shrink-0">
                <Avatar className="h-32 w-32 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.8)] ring-4 ring-white/80 sm:h-36 sm:w-36">
                  {profileImageUrl ? (
                    <AvatarImage src={profileImageUrl} alt={`${studentInfo.name} profile photo`} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="text-4xl font-bold text-white" style={{ backgroundColor: "var(--electron-blue)" }}>
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingProfileImage}
                  className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ backgroundColor: "var(--electron-red)" }}
                  aria-label="Upload profile photo"
                >
                  {isUploadingProfileImage ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 inline-flex rounded-full border border-blue-100 bg-white/70 px-3 py-1 text-xs font-semibold text-blue-900 shadow-sm">
                  Student ID: {studentInfo.studentId}
                </div>
                <h2 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">{studentInfo.name}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Keep your contact details current and review your assessment, payment, and enrollment progress in one place.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-48">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingProfileImage}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUploadingProfileImage ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {isUploadingProfileImage ? "Uploading..." : "Upload Photo"}
                </button>
                <Link
                  to="/dashboard/edit-profile"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--electron-blue)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(30,58,138,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
            <div className="space-y-6">
              <section className="portal-glass-panel rounded-[1.75rem] p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">Personal Information</h3>
                    <p className="mt-1 text-sm text-slate-500">Registration and contact details</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportStudentRecordCSV}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                    aria-label="Export student record"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 divide-y divide-slate-200/80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {[
                    { icon: Mail, label: "Email Address", value: studentInfo.email },
                    { icon: Phone, label: "Phone Number", value: studentInfo.phone },
                    { icon: Calendar, label: "Birth Date", value: studentInfo.birthDate },
                    { icon: Users2, label: "Gender", value: studentInfo.gender },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                          <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{studentInfo.address}</p>
                  </div>
                </div>
              </section>

              <section className="portal-glass-panel rounded-[1.75rem] p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-950">Quick Stats</h3>
                  <p className="mt-1 text-sm text-slate-500">Current enrollment standing</p>
                </div>

                {!enrollmentData ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                    <p className="font-semibold text-slate-900">Start your journey</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Complete the enrollment form to see your stats.</p>
                    <Link
                      to="/dashboard/enrollment"
                      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--electron-blue)] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-800"
                    >
                      Enroll Now
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Enrollment Progress</p>
                            <p className="text-xs text-slate-500">Completed process steps</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-red-700">{completedSteps}/{totalSteps}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-red-600" style={{ width: `${enrollmentProgressPercent}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-blue-900" />
                          <p className="text-sm font-semibold text-slate-900">Required Documents Verified</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-950">{requiredDocumentsVerified}/4</p>
                        <p className="mt-1 text-xs text-slate-500">Core enrollment documents</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-red-700" />
                          <p className="text-sm font-semibold text-slate-900">To Follow Up Documents Verified</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-950">{followUpDocumentsVerified}/3</p>
                        <p className="mt-1 text-xs text-slate-500">Optional supporting files</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/75 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Enrollment Status</p>
                        <p className="mt-1 text-xs text-slate-500">Latest account state</p>
                      </div>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${enrollmentStatus.color}`}>
                        {enrollmentStatus.label}
                      </span>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="portal-glass-panel rounded-[1.75rem] p-6">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-950">Assessment History</h3>
                      <p className="text-sm text-slate-500">Recent recommendation results</p>
                    </div>
                  </div>
                  <Link to="/dashboard/results" className="text-sm font-semibold text-blue-900 hover:text-blue-700">
                    View All
                  </Link>
                </div>

                {!assessmentHistory.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                    <AlertCircle className="mx-auto mb-4 h-14 w-14 text-slate-300" />
                    <p className="font-semibold text-slate-900">No Assessment Data</p>
                    <p className="mt-2 text-sm text-slate-500">Take the AI Course Test to see your results.</p>
                    <Link
                      to="/dashboard/assessment"
                      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--electron-blue)] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-800"
                    >
                      Take Test Now
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assessmentHistory.map((result, index) => (
                      <div key={result.id || index} className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                              <Calendar className="h-4 w-4" />
                              <span>{formatAssessmentDate(result.date)}</span>
                            </div>
                            <p className="text-lg font-bold text-slate-950">{result.track || "STEM"} Recommended</p>
                          </div>
                          <span className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                            Completed
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-600">Score</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-red-600" style={{ width: `${Math.min(Math.max(result.overallScore || 0, 0), 100)}%` }} />
                          </div>
                          <span className="min-w-12 text-right text-sm font-bold text-red-700">{result.overallScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="portal-glass-panel rounded-[1.75rem] p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">Payment History</h3>
                    <p className="text-sm text-slate-500">Latest submitted payment record</p>
                  </div>
                </div>

                {!paymentData ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                    <CreditCard className="mx-auto mb-4 h-14 w-14 text-slate-300" />
                    <p className="font-semibold text-slate-900">No Payment Submitted</p>
                    <p className="mt-2 text-sm text-slate-500">Complete your enrollment to access payment options.</p>
                    <Link
                      to="/dashboard/payment"
                      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--electron-blue)] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-800"
                    >
                      Go to Payment
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-sm">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Method</p>
                        <p className="mt-1 text-lg font-bold text-slate-950">
                          {paymentData.paymentMode === "bank" ? "Bank Transfer" : 
                           paymentData.paymentMode === "gcash" ? "GCash" : "Cash"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
                          paymentData.status === "approved" || paymentData.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : paymentData.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {paymentData.status === "approved" || paymentData.status === "paid" ? "Approved" : 
                         paymentData.status === "rejected" ? "Rejected" : "Pending Review"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</p>
                        <p className="mt-1 text-xl font-bold text-slate-950">PHP 15,000.00</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date Submitted</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {paymentData.submittedDate || paymentData.generatedDate || "Not specified"}
                        </p>
                      </div>
                      {paymentData.referenceNumber && (
                        <div className="rounded-2xl bg-slate-50/80 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference Number</p>
                          <p className="mt-1 break-all font-mono text-sm font-bold text-slate-950">{paymentData.referenceNumber}</p>
                        </div>
                      )}
                      {paymentData.queueNumber && (
                        <div className="rounded-2xl bg-slate-50/80 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Queue Number</p>
                          <p className="mt-1 font-mono text-xl font-bold text-blue-900">{paymentData.queueNumber}</p>
                        </div>
                      )}
                    </div>

                    {(paymentData.status === "approved" || paymentData.status === "paid") && (
                      <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-5 w-5" />
                          <p className="font-semibold">Payment Successfully Verified</p>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">Your enrollment is now complete.</p>
                      </div>
                    )}

                    {paymentData.status === "rejected" && paymentData.rejectionComment && (
                      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection Reason</p>
                        <p className="mt-1 text-sm font-medium text-red-700">{paymentData.rejectionComment}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
