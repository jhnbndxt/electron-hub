import { useState, useEffect } from "react";
import { Search, CheckCircle, User, FileText, CreditCard, GraduationCap } from "lucide-react";

interface StudentApplication {
  id: string;
  email: string;
  studentName: string;
  firstName?: string;
  lastName?: string;
  preferredTrack?: string;
  track?: string;
  recommendedTrack?: string;
  yearLevel?: string;
  status?: string;
  submissionDate?: string;
  documentsVerified?: boolean;
  paymentVerified?: boolean;
}

export function EnrollmentManagement() {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "ready" | "enrolled">("ready");

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    const apps = JSON.parse(localStorage.getItem("pending_applications") || "[]");
    setApplications(apps);
  };

  const getStudentProgress = (email: string) => {
    const progressKey = `enrollment_progress_${email}`;
    return JSON.parse(localStorage.getItem(progressKey) || "[]");
  };

  const isPaymentVerified = (email: string) => {
    const progress = getStudentProgress(email);
    const paymentStep = progress.find((step: any) => step.name === "Payment Verified");
    return paymentStep?.status === "completed";
  };

  const isEnrolled = (email: string) => {
    const progress = getStudentProgress(email);
    const enrolledStep = progress.find((step: any) => step.name === "Enrolled");
    return enrolledStep?.status === "completed";
  };

  const isDocumentsVerified = (email: string) => {
    const progress = getStudentProgress(email);
    const docsStep = progress.find((step: any) => step.name === "Documents Verified");
    return docsStep?.status === "completed";
  };

  const handleEnrollStudent = (student: StudentApplication) => {
    if (!isPaymentVerified(student.email)) {
      alert("Payment must be verified before enrolling the student. Please verify payment first.");
      return;
    }

    if (confirm(`Are you sure you want to enroll ${student.studentName}?`)) {
      // Update enrollment progress
      const progressKey = `enrollment_progress_${student.email}`;
      const progress = getStudentProgress(student.email);
      const updatedProgress = progress.map((step: any) => {
        if (step.name === "Enrolled") {
          return { ...step, status: "completed" };
        }
        return step;
      });
      localStorage.setItem(progressKey, JSON.stringify(updatedProgress));

      // Update application status
      const apps = JSON.parse(localStorage.getItem("pending_applications") || "[]");
      const enrollmentDate = new Date().toISOString();
      const updatedApps = apps.map((app: any) =>
        app.email === student.email
          ? { ...app, status: "Enrolled", enrollmentDate }
          : app
      );
      localStorage.setItem("pending_applications", JSON.stringify(updatedApps));

      // Add to enrolled students (check for duplicates first)
      const enrolledStudents = JSON.parse(localStorage.getItem("enrolled_students") || "[]");

      // Check if student already exists
      const existingIndex = enrolledStudents.findIndex((s: any) => s.email === student.email);

      const enrolledStudent = {
        id: existingIndex >= 0 ? enrolledStudents[existingIndex].id : `student-${Date.now()}`,
        studentId: existingIndex >= 0 ? enrolledStudents[existingIndex].studentId : `2026-${String(enrolledStudents.length + 1).padStart(4, "0")}`,
        name: student.studentName || `${student.firstName || ""} ${student.lastName || ""}`.trim(),
        email: student.email,
        enrollmentDate: enrollmentDate,
        status: "Enrolled",
        strandEnrolled: student.preferredTrack || student.recommendedTrack || student.track || "Not Set",
        yearLevel: student.yearLevel || "Grade 11",
      };

      if (existingIndex >= 0) {
        // Update existing student
        enrolledStudents[existingIndex] = enrolledStudent;
      } else {
        // Add new student
        enrolledStudents.push(enrolledStudent);
      }

      localStorage.setItem("enrolled_students", JSON.stringify(enrolledStudents));

      // Create audit log entry
      const auditLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
      auditLogs.push({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        user: "Branch Coordinator",
        action: "Student Enrolled",
        details: `Enrolled student: ${student.studentName} (${student.email})`,
        status: "success",
      });
      localStorage.setItem("audit_logs", JSON.stringify(auditLogs));

      // Reload applications
      loadApplications();
      alert(`${student.studentName} has been successfully enrolled!`);
    }
  };

  const filteredApplications = applications.filter((app) => {
    // Search filter
    const matchesSearch =
      (app.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (filter === "ready") {
      // Students with payment verified but not yet enrolled
      return isPaymentVerified(app.email) && !isEnrolled(app.email);
    } else if (filter === "enrolled") {
      // Students already enrolled
      return isEnrolled(app.email);
    }

    // "all" - show students with at least documents verified
    return isDocumentsVerified(app.email);
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enrollment Management</h1>
        <p className="text-gray-600">
          Enroll students who have completed payment verification
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("ready")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "ready"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ready to Enroll
            </button>
            <button
              onClick={() => setFilter("enrolled")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "enrolled"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Enrolled
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "all"
                  ? "bg-gray-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No students found
            </h3>
            <p className="text-gray-600">
              {filter === "ready"
                ? "No students are currently ready for enrollment. Students will appear here after their payment is verified."
                : filter === "enrolled"
                ? "No students have been enrolled yet."
                : "No applications found matching your search."}
            </p>
          </div>
        ) : (
          filteredApplications.map((app) => {
            const enrolled = isEnrolled(app.email);
            const paymentVerified = isPaymentVerified(app.email);
            const docsVerified = isDocumentsVerified(app.email);

            return (
              <div
                key={app.id || app.email}
                className={`bg-white rounded-lg border-2 p-6 transition-all ${
                  enrolled
                    ? "border-green-200 bg-green-50"
                    : paymentVerified
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>

                    {/* Student Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {app.studentName ||
                          `${app.firstName || ""} ${app.lastName || ""}`.trim() ||
                          app.email}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{app.email}</p>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            docsVerified
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                          Documents {docsVerified ? "Verified" : "Pending"}
                        </div>
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            paymentVerified
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <CreditCard className="w-3 h-3" />
                          Payment {paymentVerified ? "Verified" : "Pending"}
                        </div>
                        {enrolled && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <GraduationCap className="w-3 h-3" />
                            Enrolled
                          </div>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Track:</span>{" "}
                        {app.preferredTrack ||
                          app.recommendedTrack ||
                          app.track ||
                          "Not Set"}{" "}
                        • <span className="font-medium">Year Level:</span>{" "}
                        {app.yearLevel || "Grade 11"}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="ml-4">
                    {!enrolled ? (
                      <button
                        onClick={() => handleEnrollStudent(app)}
                        disabled={!paymentVerified}
                        className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                          paymentVerified
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                        title={
                          paymentVerified
                            ? "Mark as enrolled"
                            : "Payment must be verified first"
                        }
                      >
                        <CheckCircle className="w-5 h-5" />
                        Enroll Student
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Enrolled</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning Message */}
                {!paymentVerified && !enrolled && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Payment verification required:</strong> This student's payment
                      must be verified by the cashier before they can be enrolled.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
