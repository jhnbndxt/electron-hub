import { User, Mail, Phone, MapPin, Calendar, Award, FileText, CheckCircle, Users2, BookOpen, AlertCircle, CreditCard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { getAssessmentHistory, formatAssessmentDate, type AssessmentResult } from "../utils/assessmentStorage";

export function Profile() {
  const { userData, enrollmentProgress } = useAuth();
  const location = useLocation();
  
  // Load profile data from localStorage
  const [profileData, setProfileData] = useState(() => {
    const userEmail = userData?.email || "student@gmail.com";
    const profileKey = `profile_${userEmail}`;
    const savedProfile = localStorage.getItem(profileKey);
    
    if (savedProfile) {
      return JSON.parse(savedProfile);
    }
    
    // Default data for joshua@gmail.com
    if (userEmail === "joshua@gmail.com") {
      return {
        fullName: "Joshua",
        email: userEmail,
        contactNumber: "09175432189",
        dateOfBirth: "2005-06-15",
        gender: "male",
      };
    }
    
    // Default for other users
    return {
      fullName: userData?.name || "Student",
      email: userEmail,
      contactNumber: "",
      dateOfBirth: "",
      gender: "",
    };
  });

  // Check if enrollment has been submitted
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  
  // Check if assessment has been taken
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResult[]>([]);
  
  // Payment history state
  const [paymentData, setPaymentData] = useState<any>(null);

  // Function to check enrollment and assessment status
  const checkStatus = () => {
    const userEmail = userData?.email || "student@gmail.com";
    
    // Check enrollment data from pending_applications
    const pendingApplications = JSON.parse(localStorage.getItem('pending_applications') || '[]');
    const userEnrollment = pendingApplications.find((app: any) => app.studentId === userEmail || app.email === userEmail);
    setEnrollmentData(userEnrollment);

    // Check assessment history
    const history = getAssessmentHistory(userEmail);
    setAssessmentHistory(history.results);
    
    // Check payment data
    const paymentQueue = JSON.parse(localStorage.getItem('payment_queue') || '[]');
    const cashQueue = JSON.parse(localStorage.getItem('cash_payment_queue') || '[]');
    
    const onlinePayment = paymentQueue.find((p: any) => p.studentEmail === userEmail);
    const cashPayment = cashQueue.find((p: any) => p.studentEmail === userEmail);
    
    if (onlinePayment) {
      setPaymentData(onlinePayment);
    } else if (cashPayment) {
      setPaymentData(cashPayment);
    } else {
      setPaymentData(null);
    }
    
    // Load registration data for personal information
    const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const registrationData = registeredUsers.find((user: any) => user.email === userEmail);
    
    if (registrationData) {
      setProfileData({
        fullName: registrationData.name,
        email: registrationData.email,
        contactNumber: registrationData.contactNumber,
        dateOfBirth: registrationData.dateOfBirth,
        gender: registrationData.gender,
      });
    }
  };

  // Reload profile data when component mounts or when returning from edit
  useEffect(() => {
    const userEmail = userData?.email || "student@gmail.com";
    const profileKey = `profile_${userEmail}`;
    const savedProfile = localStorage.getItem(profileKey);
    
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }

    // Check status on mount
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
    email: profileData.email || userData?.email || "student@gmail.com",
    phone: profileData.contactNumber || "Not specified",
    address: enrollmentData ? `${enrollmentData.homeAddress}, ${enrollmentData.barangay}, ${enrollmentData.city}` : "Not specified",
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
  const userInitial = studentInfo.name.charAt(0).toUpperCase();

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: "var(--electron-blue)" }}>
            My Profile
          </h1>
          <p className="text-gray-600">Manage your personal information and track your progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col items-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-4 text-white font-semibold text-4xl"
                  style={{ backgroundColor: "var(--electron-blue)" }}
                >
                  {userInitial}
                </div>
                <h2 className="text-xl mb-1" style={{ color: "var(--electron-dark-gray)" }}>
                  {studentInfo.name}
                </h2>
                <p className="text-sm text-gray-500 mb-4">Student ID: {studentInfo.studentId}</p>
                <Link
                  to="/dashboard/edit-profile"
                  className="px-6 py-2 rounded-md text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: "var(--electron-blue)" }}
                >
                  Edit Profile
                </Link>
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