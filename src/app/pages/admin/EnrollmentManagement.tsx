import { useState, useEffect } from "react";
import { Search, CheckCircle, User, FileText, CreditCard, GraduationCap } from "lucide-react";
import { getEnrollmentManagementStudents, enrollStudent, getStudentPaymentStatus } from "../../../services/adminService";
import { triggerNotification } from "../../../services/notificationService";
import { ConfirmationModal } from "../../components/ConfirmationModal";

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
  const [pendingEnrollment, setPendingEnrollment] = useState<StudentApplication | null>(null);

  useEffect(() => {
    void loadApplications();
  }, []);

  const loadApplications = async () => {
    const { data: enrollmentApps, error } = await getEnrollmentManagementStudents();

    if (error) {
      console.error('Error loading enrollment management students:', error);
      setApplications([]);
      return;
    }

    const formattedApps: StudentApplication[] = [];

    if (enrollmentApps) {
      for (const app of enrollmentApps) {
        const formData = app.form_data || {};
        const studentEmail = app.user_id || formData.email || "";
        const paymentVerified =
          app.status === 'enrolled'
            ? true
            : (await getStudentPaymentStatus(studentEmail)).isVerified;
        
        formattedApps.push({
          id: app.id,
          email: studentEmail,
          studentName: formData.studentName || `${formData.firstName || ''} ${formData.lastName || ''}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          preferredTrack: formData.preferredTrack || formData.preferred_track || formData.recommendedTrack || formData.track,
          yearLevel: formData.yearLevel || formData.year_level,
          status: app.status === 'enrolled' ? 'enrolled' : 'pending',
          submissionDate: app.enrollment_date || app.created_at,
          documentsVerified: app.status === 'documents_verified' || app.status === 'enrolled',
          paymentVerified,
        });
      }
    }

    setApplications(formattedApps);
  };

  const isPaymentVerified = (email: string) => {
    const app = applications.find(a => a.email === email);
    return app?.paymentVerified || false;
  };

  const isEnrolled = (email: string) => {
    const app = applications.find(a => a.email === email);
    return app?.status === 'enrolled';
  };

  const isDocumentsVerified = (email: string) => {
    const app = applications.find(a => a.email === email);
    return app?.documentsVerified || false;
  };

  const handleEnrollStudent = async (student: StudentApplication) => {
    if (!isPaymentVerified(student.email)) {
      alert("Payment must be verified before enrolling the student. Please verify payment first.");
      return;
    }

    setPendingEnrollment(student);
  };

  const confirmEnrollStudent = async () => {
    if (!pendingEnrollment) {
      return;
    }

    const { error } = await enrollStudent(pendingEnrollment.id, pendingEnrollment.email);

    if (error) {
      alert(`Error enrolling student: ${error}`);
      return;
    }

    try {
      await triggerNotification(pendingEnrollment.email, 'ENROLLMENT_APPROVED');
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    alert(`${pendingEnrollment.studentName} has been successfully enrolled!`);
    void loadApplications();
  };

  const filteredApplications = applications.filter((app) => {
    // Search filter
    const matchesSearch =
      (app.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.email || "").toLowerCase().includes(searchQuery.toLowerCase());

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
    <div className="portal-dashboard-page mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Enrollment Management</h1>
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
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
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
          <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
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
            const applicationCardBorderColor = enrolled
              ? "#86EFAC"
              : paymentVerified
              ? "#93C5FD"
              : "rgba(148, 163, 184, 0.24)";

            return (
              <div
                key={app.id || app.email}
                className="portal-glass-panel rounded-lg border-2 p-5 transition-all sm:p-6"
                style={{ borderColor: applicationCardBorderColor }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start flex-1">
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
                  <div className="w-full lg:w-auto lg:ml-4">
                    {!enrolled ? (
                      <button
                        onClick={() => handleEnrollStudent(app)}
                        disabled={!paymentVerified}
                        className={`w-full justify-center px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
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
                      <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white lg:w-auto">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Enrolled</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning Message */}
                {!paymentVerified && !enrolled && (
                  <div className="portal-glass-panel mt-4 rounded-lg border p-3" style={{ borderColor: "#FCD34D" }}>
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

      <ConfirmationModal
        isOpen={Boolean(pendingEnrollment)}
        title="Confirm Student Enrollment"
        message={
          pendingEnrollment
            ? `Enroll ${pendingEnrollment.studentName} into the selected track and mark their enrollment as finalized?`
            : ""
        }
        confirmText="Enroll Student"
        cancelText="Cancel"
        type="warning"
        onConfirm={confirmEnrollStudent}
        onClose={() => setPendingEnrollment(null)}
      />
    </div>
  );
}
