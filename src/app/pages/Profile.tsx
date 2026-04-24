import { Mail, Phone, MapPin, Calendar, Award, CheckCircle, Users2, BookOpen, AlertCircle, CreditCard, Camera, LoaderCircle, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router";
import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getAssessmentHistory } from "../../services/assessmentResultService";
import { supabase } from "../../supabase";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { loadProfileImageUrl, uploadProfileImage } from "../utils/profileImage";
import { exportToCSV, formatDateForCSV } from "../../utils/csvExport";

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
  const { userData, enrollmentProgress, updateUserData } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
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
      
      setEnrollmentData(enrollments?.[0]?.form_data || enrollments?.[0] || null);
    }

    // Check assessment history from Supabase
    try {
      if (!userEmail) {
        setAssessmentHistory([]);
      } else {
        const history = await getAssessmentHistory(userEmail);
        setAssessmentHistory(history.results);
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
            .select('id, email, full_name, contact_number, birth_date, gender')
            .eq('id', userId)
            .maybeSingle()
        : supabase
            .from('users')
            .select('id, email, full_name, contact_number, birth_date, gender')
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
          gender: userRecord.gender || '',
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
    // Check status on mount (loads from Supabase)
    checkStatus();

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
  
  // Count documents (from enrollmentData)
  const documentsSubmitted = enrollmentData?.documents ? Object.values(enrollmentData.documents).filter(doc => doc !== null).length : 0;
  const totalDocuments = 7; // Total required documents
  
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
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl" style={{ color: "var(--electron-blue)" }}>
                My Profile
              </h1>
            </div>
            <button
              onClick={handleExportStudentRecordCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: "#1E3A8A" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1B357D")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1E3A8A")}
            >
              <Download className="w-4 h-4" />
              Export Record
            </button>
          </div>
          <p className="text-gray-600">Manage your personal information and track your progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleProfileImageUpload}
                />
                <div className="relative mb-4">
                  <Avatar className="w-24 h-24 shadow-md ring-4 ring-blue-50">
                    {profileImageUrl ? (
                      <AvatarImage
                        src={profileImageUrl}
                        alt={`${studentInfo.name} profile photo`}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback
                      className="text-white font-semibold text-2xl"
                      style={{ backgroundColor: "var(--electron-blue)" }}
                    >
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingProfileImage}
                    className="absolute -right-1 -bottom-1 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ backgroundColor: "var(--electron-red)" }}
                    aria-label="Upload profile photo"
                  >
                    {isUploadingProfileImage ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <h2 className="text-xl mb-1" style={{ color: "var(--electron-dark-gray)" }}>
                  {studentInfo.name}
                </h2>
                <p className="text-sm text-gray-500 mb-4">Student ID: {studentInfo.studentId}</p>
                <p className="text-xs text-gray-500 text-center mb-4">
                  JPG, PNG, or WebP up to 2 MB
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingProfileImage}
                    className="flex-1 px-4 py-2 rounded-md border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isUploadingProfileImage ? "Uploading..." : "Upload Photo"}
                  </button>
                  <Link
                    to="/dashboard/edit-profile"
                    className="flex-1 px-4 py-2 rounded-md text-center text-white text-sm transition-colors hover:opacity-90"
                    style={{ backgroundColor: "var(--electron-blue)" }}
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg mb-4" style={{ color: "var(--electron-blue)" }}>
                Quick Stats
              </h3>
              {!enrollmentData ? (
                // Empty State - Placeholder
                <div className="text-center py-4">
                  <div className="mb-3">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <span className="font-semibold" style={{ color: "var(--electron-blue)" }}>
                      Start your Journey
                    </span>
                    <br />
                    Complete the Enrollment form to see your stats.
                  </p>
                  <Link
                    to="/dashboard/enrollment"
                    className="mt-4 inline-block px-4 py-2 rounded-md text-white text-sm transition-colors hover:opacity-90"
                    style={{ backgroundColor: "var(--electron-blue)" }}
                  >
                    Enroll Now
                  </Link>
                </div>
              ) : (
                // Active State - Show Stats
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Enrollment Progress</span>
                    <span className="font-semibold" style={{ color: "var(--electron-red)" }}>
                      {completedSteps}/{totalSteps} Steps
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Documents Verified</span>
                    <span className="font-semibold" style={{ color: "var(--electron-blue)" }}>
                      {documentsSubmitted}/{totalDocuments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Enrollment Status</span>
                    <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: enrollmentStatus.color }}>
                      {enrollmentStatus.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl mb-4" style={{ color: "var(--electron-blue)" }}>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Mail
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: "var(--electron-blue)" }}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p style={{ color: "var(--electron-dark-gray)" }}>{studentInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: "var(--electron-blue)" }}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p style={{ color: "var(--electron-dark-gray)" }}>{studentInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: "var(--electron-blue)" }}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Birth Date</p>
                    <p style={{ color: "var(--electron-dark-gray)" }}>{studentInfo.birthDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users2
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: "var(--electron-blue)" }}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p style={{ color: "var(--electron-dark-gray)" }}>{studentInfo.gender}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: "var(--electron-blue)" }}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p style={{ color: "var(--electron-dark-gray)" }}>{studentInfo.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment History */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
                <h3 className="text-xl" style={{ color: "var(--electron-blue)" }}>
                  Assessment History
                </h3>
              </div>
              
              {!assessmentHistory.length ? (
                // Empty State - No assessment taken
                <div className="text-center py-8">
                  <div className="mb-4">
                    <AlertCircle className="w-16 h-16 mx-auto text-gray-300" />
                  </div>
                  <p className="text-gray-600 mb-2 font-semibold">No Assessment Data</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Take the AI Course Test to see your results.
                  </p>
                  <Link
                    to="/dashboard/assessment"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: "var(--electron-blue)" }}
                  >
                    Take Test Now
                  </Link>
                </div>
              ) : (
                // Active State - Show assessment results
                <div className="space-y-4">
                  {assessmentHistory.map((result, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border-l-4"
                      style={{
                        backgroundColor: "var(--electron-light-gray)",
                        borderColor: "var(--electron-red)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle
                            className="w-5 h-5"
                            style={{ color: "var(--electron-red)" }}
                          />
                          <span className="text-sm text-gray-500">{formatAssessmentDate(result.date)}</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Completed
                        </span>
                      </div>
                      <p className="mb-2" style={{ color: "var(--electron-dark-gray)" }}>
                        Result: {result.track || "STEM"} Recommended
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Score:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${result.overallScore}%`,
                              backgroundColor: "var(--electron-red)",
                            }}
                          ></div>
                        </div>
                        <span className="text-sm" style={{ color: "var(--electron-red)" }}>
                          {result.overallScore}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
                <h3 className="text-xl" style={{ color: "var(--electron-blue)" }}>
                  Payment History
                </h3>
              </div>
              
              {!paymentData ? (
                // Empty State - No payment submitted
                <div className="text-center py-8">
                  <div className="mb-4">
                    <CreditCard className="w-16 h-16 mx-auto text-gray-300" />
                  </div>
                  <p className="text-gray-600 mb-2 font-semibold">No Payment Submitted</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Complete your enrollment to access payment options.
                  </p>
                  <Link
                    to="/dashboard/payment"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: "var(--electron-blue)" }}
                  >
                    Go to Payment
                  </Link>
                </div>
              ) : (
                // Active State - Show payment details
                <div
                  className="p-6 rounded-lg border-l-4"
                  style={{
                    backgroundColor: "var(--electron-light-gray)",
                    borderColor: paymentData.status === "approved" || paymentData.status === "paid" 
                      ? "#10B981" 
                      : paymentData.status === "rejected" 
                      ? "var(--electron-red)"
                      : "#F59E0B",
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Payment Method</p>
                        <p className="text-sm text-gray-600">
                          {paymentData.paymentMode === "bank" ? "Bank Transfer" : 
                           paymentData.paymentMode === "gcash" ? "GCash" : "Cash"}
                        </p>
                      </div>
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
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

                    {paymentData.referenceNumber && (
                      <div>
                        <p className="text-sm text-gray-600">Reference Number</p>
                        <p className="font-mono font-semibold text-gray-900">{paymentData.referenceNumber}</p>
                      </div>
                    )}

                    {paymentData.queueNumber && (
                      <div>
                        <p className="text-sm text-gray-600">Queue Number</p>
                        <p className="font-mono font-bold text-xl" style={{ color: "var(--electron-blue)" }}>
                          {paymentData.queueNumber}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-bold text-lg text-gray-900">₱15,000.00</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Date Submitted</p>
                      <p className="font-medium text-gray-900">
                        {paymentData.submittedDate || paymentData.generatedDate}
                      </p>
                    </div>

                    {(paymentData.status === "approved" || paymentData.status === "paid") && (
                      <div className="pt-3 border-t border-gray-300">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <p className="font-semibold">Payment Successfully Verified</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Your enrollment is now complete!
                        </p>
                      </div>
                    )}

                    {paymentData.status === "rejected" && paymentData.rejectionComment && (
                      <div className="pt-3 border-t border-gray-300">
                        <p className="text-sm text-gray-600">Rejection Reason</p>
                        <p className="text-sm text-red-700 font-medium">{paymentData.rejectionComment}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}