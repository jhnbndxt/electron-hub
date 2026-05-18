import { Mail, Phone, MapPin, Calendar, Award, CheckCircle, Users2, BookOpen, AlertCircle, CreditCard, Camera, LoaderCircle, Edit3, Check, X, RotateCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getAssessmentHistory } from "../../services/assessmentResultService";
import { supabase } from "../../supabase";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { loadProfileImageUrl, uploadProfileImage, validateProfileImageFile } from "../utils/profileImage";
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

interface StudentSectionAssignment {
  status: "loading" | "assigned" | "pending" | "unavailable";
  sectionId?: string;
  sectionName?: string;
}

const PROFILE_CROP_PREVIEW_SIZE = 288;
const PROFILE_CROP_OUTPUT_SIZE = 512;

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
  const [studentSection, setStudentSection] = useState<StudentSectionAssignment>({ status: "loading" });
  const [pendingProfileFile, setPendingProfileFile] = useState<File | null>(null);
  const [pendingProfilePreviewUrl, setPendingProfilePreviewUrl] = useState("");
  const [pendingImageDimensions, setPendingImageDimensions] = useState({ width: 0, height: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });

  const getSectionStorageKey = () => {
    const reference = userData?.id || userData?.email || "";
    return reference ? `student_section_assignment_${reference}` : "";
  };

  const readStoredSectionAssignment = () => {
    const storageKey = getSectionStorageKey();
    if (!storageKey) return null;

    try {
      const storedAssignment = localStorage.getItem(storageKey);
      return storedAssignment ? JSON.parse(storedAssignment) : null;
    } catch (_error) {
      return null;
    }
  };

  const persistSectionAssignment = (assignment: StudentSectionAssignment) => {
    const storageKey = getSectionStorageKey();
    if (!storageKey || assignment.status !== "assigned") return;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        sectionId: assignment.sectionId,
        sectionName: assignment.sectionName,
      })
    );
  };

  async function loadStudentSectionAssignment(enrollmentId?: string) {
    if (!enrollmentId) {
      setStudentSection(readStoredSectionAssignment() ? { status: "unavailable" } : { status: "pending" });
      return;
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("section_assignments")
      .select("id, section_id, status, updated_at, created_at")
      .eq("enrollment_id", enrollmentId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assignmentError) {
      console.error("Error loading student section assignment:", assignmentError);
      setStudentSection(readStoredSectionAssignment() ? { status: "unavailable" } : { status: "pending" });
      return;
    }

    if (!assignment?.section_id) {
      setStudentSection(readStoredSectionAssignment() ? { status: "unavailable" } : { status: "pending" });
      return;
    }

    const { data: section, error: sectionError } = await supabase
      .from("sections")
      .select("id, section_code")
      .eq("id", assignment.section_id)
      .maybeSingle();

    if (sectionError || !section) {
      if (sectionError) {
        console.error("Error loading assigned section:", sectionError);
      }
      setStudentSection({
        status: "unavailable",
        sectionId: assignment.section_id,
      });
      return;
    }

    const nextAssignment = {
      status: "assigned" as const,
      sectionId: section.id,
      sectionName: section.section_code || "Assigned Section",
    };

    persistSectionAssignment(nextAssignment);
    setStudentSection(nextAssignment);
  }

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
    let latestEnrollmentId = "";
    
    // Check enrollment data from Supabase
    if (userEmail) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, enrollment_documents(*)')
        .eq('user_id', userEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const latestEnrollment = enrollments?.[0];
      latestEnrollmentId = latestEnrollment?.id || "";
      setEnrollmentData(
        latestEnrollment
          ? {
              ...latestEnrollment,
              ...(latestEnrollment.form_data || {}),
              enrollment_documents: latestEnrollment.enrollment_documents || [],
            }
          : null
      );
      await loadStudentSectionAssignment(latestEnrollmentId);
    } else {
      await loadStudentSectionAssignment("");
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
    if (userId || userEmail || latestEnrollmentId) {
      const paymentLookups = [
        latestEnrollmentId
          ? supabase.from('payments').select('*').eq('enrollment_id', latestEnrollmentId).order('created_at', { ascending: false }).limit(1)
          : null,
        userId
          ? supabase.from('payments').select('*').eq('student_id', userId).order('created_at', { ascending: false }).limit(1)
          : null,
        userEmail
          ? supabase.from('payments').select('*').eq('student_id', userEmail).order('created_at', { ascending: false }).limit(1)
          : null,
      ].filter(Boolean) as any[];

      const paymentResults = await Promise.all(paymentLookups);
      const paymentRows = paymentResults.flatMap((result) => result.data || []);
      paymentResults.forEach((result) => {
        if (result.error) {
          console.error('Error fetching payment data:', result.error);
        }
      });

      const latestPayment = paymentRows.sort(
        (a: any, b: any) => new Date(b.created_at || b.submitted_at || 0).getTime() - new Date(a.created_at || a.submitted_at || 0).getTime()
      )[0];

      setPaymentData(latestPayment || null);
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

  const resetProfileCrop = () => {
    if (pendingProfilePreviewUrl) {
      URL.revokeObjectURL(pendingProfilePreviewUrl);
    }

    setPendingProfileFile(null);
    setPendingProfilePreviewUrl("");
    setPendingImageDimensions({ width: 0, height: 0 });
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
  };

  const createCroppedProfileImage = async () => {
    if (!pendingProfileFile || !pendingProfilePreviewUrl || !pendingImageDimensions.width || !pendingImageDimensions.height) {
      throw new Error("Please wait for the selected photo to load before saving.");
    }

    const image = new Image();
    image.src = pendingProfilePreviewUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = PROFILE_CROP_OUTPUT_SIZE;
    canvas.height = PROFILE_CROP_OUTPUT_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Your browser could not prepare the cropped profile photo.");
    }

    const outputScale = PROFILE_CROP_OUTPUT_SIZE / PROFILE_CROP_PREVIEW_SIZE;
    const baseScale = Math.max(
      PROFILE_CROP_OUTPUT_SIZE / pendingImageDimensions.width,
      PROFILE_CROP_OUTPUT_SIZE / pendingImageDimensions.height
    );
    const drawWidth = pendingImageDimensions.width * baseScale * cropZoom;
    const drawHeight = pendingImageDimensions.height * baseScale * cropZoom;
    const drawX = (PROFILE_CROP_OUTPUT_SIZE - drawWidth) / 2 + cropOffset.x * outputScale;
    const drawY = (PROFILE_CROP_OUTPUT_SIZE - drawHeight) / 2 + cropOffset.y * outputScale;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, PROFILE_CROP_OUTPUT_SIZE, PROFILE_CROP_OUTPUT_SIZE);
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      throw new Error("Failed to crop the selected profile photo.");
    }

    return new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
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

    const validationError = validateProfileImageFile(selectedFile);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (pendingProfilePreviewUrl) {
      URL.revokeObjectURL(pendingProfilePreviewUrl);
    }

    setPendingProfileFile(selectedFile);
    setPendingProfilePreviewUrl(URL.createObjectURL(selectedFile));
    setPendingImageDimensions({ width: 0, height: 0 });
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
  };

  const handleSaveCroppedProfileImage = async () => {
    if (!pendingProfileFile) {
      return;
    }

    if (!userData?.id) {
      toast.error("Please sign in again before updating your profile photo.");
      resetProfileCrop();
      return;
    }

    try {
      setIsUploadingProfileImage(true);
      const croppedFile = await createCroppedProfileImage();

      const { imageUrl, usedStorageFallback } = await uploadProfileImage({
        userId: userData.id,
        email: userData.email,
        file: croppedFile,
      });

      setProfileImageUrl(imageUrl);
      updateUserData({ profilePictureUrl: imageUrl });
      resetProfileCrop();

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

  useEffect(() => {
    return () => {
      if (pendingProfilePreviewUrl) {
        URL.revokeObjectURL(pendingProfilePreviewUrl);
      }
    };
  }, [pendingProfilePreviewUrl]);

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

  useEffect(() => {
    const enrollmentId = enrollmentData?.id;
    if (!enrollmentId || (!userData?.id && !userData?.email)) {
      return;
    }

    const refreshSectionAssignment = () => {
      void loadStudentSectionAssignment(enrollmentId);
    };

    const assignmentChannel = supabase
      .channel(`student-section-assignment-${enrollmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "section_assignments",
          filter: `enrollment_id=eq.${enrollmentId}`,
        },
        refreshSectionAssignment
      )
      .subscribe();

    const sectionChannel = supabase
      .channel(`student-section-records-${enrollmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sections",
        },
        refreshSectionAssignment
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentChannel);
      supabase.removeChannel(sectionChannel);
    };
  }, [enrollmentData?.id, userData?.id, userData?.email]);

  // Format date of birth for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  // Format sex for display
  const formatSex = (sex: string) => {
    if (!sex) return "Not specified";
    return sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase();
  };

  // Use registration data for personal info, enrollment data only for address
  const studentInfo = {
    name: profileData.fullName || userData?.name || "Student",
    email: profileData.email || userData?.email || "Not specified",
    phone: profileData.contactNumber || "Not specified",
    address: formatAddress(enrollmentData),
    birthDate: formatDate(profileData.dateOfBirth),
    sex: formatSex(profileData.gender),
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
    String(doc?.document_type || doc?.type || doc?.key || doc?.name || "")
      .toLowerCase()
      .replace(/[\s_-]/g, "");
  const isDocumentApproved = (doc: any) => String(doc?.status || "").toLowerCase() === "approved";
  const requiredDocumentKeys = ["form138", "reportcard", "birthcertificate", "birth", "idpicture", "diploma"];
  const followUpDocumentKeys = ["esccertificate", "esc", "form137", "goodmoral", "moral"];
  const requiredDocumentsVerified = enrollmentDocuments.filter((doc: any) => {
    const key = getDocumentKey(doc);
    return isDocumentApproved(doc) && requiredDocumentKeys.some((requiredKey) => key.includes(requiredKey));
  }).length;
  const followUpDocumentsVerified = enrollmentDocuments.filter((doc: any) => {
    const key = getDocumentKey(doc);
    return isDocumentApproved(doc) && followUpDocumentKeys.some((followUpKey) => key.includes(followUpKey));
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
  const isStudentEnrolled = enrollmentStatus.label === "Enrolled";
  const paymentMethod = paymentData?.payment_method || paymentData?.paymentMode || paymentData?.payment_mode || "";
  const paymentReferenceNumber = paymentData?.reference_number || paymentData?.referenceNumber || "";
  const paymentQueueNumber = paymentData?.queue_number || paymentData?.queueNumber || "";
  const paymentRejectionComment = paymentData?.rejection_comment || paymentData?.rejectionComment || paymentData?.notes || "";
  const paymentSubmittedDate =
    paymentData?.submitted_at ||
    paymentData?.submittedDate ||
    paymentData?.generatedDate ||
    paymentData?.created_at ||
    "";
  const sectionDisplayName =
    studentSection.status === "assigned" && studentSection.sectionName
      ? studentSection.sectionName
      : isStudentEnrolled
        ? "Pending Section"
        : "Available after enrollment";
  const formatPaymentDate = (dateValue: string) => {
    if (!dateValue) return "Not specified";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

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
      "Full Name",
      "Email",
      "Phone",
      "Date of Birth",
      "Sex",
      "Address",
      "Enrollment Status",
      "Progress",
      "Documents Submitted",
      "Assessment Status",
      "Export Date"
    ];
    const assessmentStatus = assessmentHistory.length > 0 ? "Completed" : "Not Started";
    const rows = [[
      studentInfo.name,
      studentInfo.email,
      studentInfo.phone,
      studentInfo.birthDate,
      studentInfo.sex,
      studentInfo.address,
      enrollmentStatus.label,
      `${completedSteps}/${totalSteps} steps`,
      `${documentsSubmitted}/${totalDocuments}`,
      assessmentStatus,
      new Date().toLocaleDateString('en-US')
    ]];
    exportToCSV({
      filename: `student-record-${(studentInfo.email || "student").replace(/[^a-z0-9]+/gi, "-")}-${new Date().toISOString().split('T')[0]}`,
      title: "Student Record Export",
      subtitle: `Electron Hub - Student Management System`,
      headers,
      rows,
    });
  };

  const cropPreviewBaseScale =
    pendingImageDimensions.width && pendingImageDimensions.height
      ? Math.max(
          PROFILE_CROP_PREVIEW_SIZE / pendingImageDimensions.width,
          PROFILE_CROP_PREVIEW_SIZE / pendingImageDimensions.height
        )
      : 1;
  const cropPreviewImageStyle =
    pendingImageDimensions.width && pendingImageDimensions.height
      ? {
          width: `${pendingImageDimensions.width * cropPreviewBaseScale}px`,
          height: `${pendingImageDimensions.height * cropPreviewBaseScale}px`,
          transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
        }
      : undefined;

  return (
    <div className="portal-dashboard-page flex w-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-center" />

      {pendingProfilePreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-crop-title"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="profile-crop-title" className="text-lg font-bold text-slate-950">Crop Profile Photo</h2>
                <p className="text-sm text-slate-500">Adjust the photo before saving it to your profile.</p>
              </div>
              <button
                type="button"
                onClick={resetProfileCrop}
                disabled={isUploadingProfileImage}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Cancel photo crop"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="mx-auto h-72 w-72 overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-200">
                <div className="relative h-full w-full">
                  <img
                    src={pendingProfilePreviewUrl}
                    alt="Selected profile photo preview"
                    className="absolute left-1/2 top-1/2 max-w-none select-none"
                    draggable={false}
                    style={cropPreviewImageStyle}
                    onLoad={(event) => {
                      setPendingImageDimensions({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Zoom</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={cropZoom}
                    onChange={(event) => setCropZoom(Number(event.target.value))}
                    className="w-full accent-blue-900"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Horizontal Position</span>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="1"
                    value={cropOffset.x}
                    onChange={(event) => setCropOffset((current) => ({ ...current, x: Number(event.target.value) }))}
                    className="w-full accent-blue-900"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Vertical Position</span>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="1"
                    value={cropOffset.y}
                    onChange={(event) => setCropOffset((current) => ({ ...current, y: Number(event.target.value) }))}
                    className="w-full accent-blue-900"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setCropZoom(1);
                  setCropOffset({ x: 0, y: 0 });
                }}
                disabled={isUploadingProfileImage}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleSaveCroppedProfileImage}
                disabled={isUploadingProfileImage || !pendingImageDimensions.width}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--electron-blue)] px-5 py-2 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(30,58,138,0.85)] transition-all hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUploadingProfileImage ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isUploadingProfileImage ? "Saving..." : "Save Photo"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  aria-label="Change profile photo"
                >
                  {isUploadingProfileImage ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">{studentInfo.name}</h2>
                <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/60 bg-white/45 px-4 py-2 text-sm font-bold text-blue-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_36px_-28px_rgba(30,58,138,0.95)] backdrop-blur-xl ring-1 ring-blue-100/70">
                  <BookOpen className="h-4 w-4 shrink-0 text-yellow-300" />
                  <span className="truncate">Section: {sectionDisplayName}</span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-48">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingProfileImage}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUploadingProfileImage ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {isUploadingProfileImage ? "Preparing..." : "Change Photo"}
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
                    onClick={() => navigate("/dashboard/edit-profile")}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                    aria-label="Edit profile"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 divide-y divide-slate-200/80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {[
                    { icon: Mail, label: "Email Address", value: studentInfo.email },
                    { icon: Phone, label: "Phone Number", value: studentInfo.phone },
                    { icon: Calendar, label: "Birth Date", value: studentInfo.birthDate },
                    { icon: Users2, label: "Sex", value: studentInfo.sex },
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
                          {paymentMethod === "bank" ? "Bank Transfer" :
                           paymentMethod === "gcash" ? "GCash" :
                           paymentMethod === "cash" ? "Cash" : "Not specified"}
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
                          {formatPaymentDate(paymentSubmittedDate)}
                        </p>
                      </div>
                      {paymentReferenceNumber && (
                        <div className="rounded-2xl bg-slate-50/80 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference Number</p>
                          <p className="mt-1 break-all font-mono text-sm font-bold text-slate-950">{paymentReferenceNumber}</p>
                        </div>
                      )}
                      {paymentQueueNumber && (
                        <div className="rounded-2xl bg-slate-50/80 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Queue Number</p>
                          <p className="mt-1 font-mono text-xl font-bold text-blue-900">{paymentQueueNumber}</p>
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

                    {paymentData.status === "rejected" && paymentRejectionComment && (
                      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection Reason</p>
                        <p className="mt-1 text-sm font-medium text-red-700">{paymentRejectionComment}</p>
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
