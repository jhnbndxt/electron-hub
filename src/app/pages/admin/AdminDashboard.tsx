import {
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Search,
  X,
  FileCheck,
  FileText,
  Award,
  CreditCard,
  Users,
  Activity,
  BookOpen,
  Eye,
  Image as ImageIcon,
  UserCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import {
  getPendingApplications,
  getAuditLogs,
  updateDocumentStatus,
  updateEnrollmentStatus,
  createAuditLog,
  approveEnrollment,
  resolveUserId,
  upsertEnrollmentProgress,
} from "../../../services/adminService";
import { supabase } from "../../../supabase";

interface Student {
  id: number | string;
  name: string;
  email: string;
  strand: string;
  applicationDate: string;
  aiTestScore?: number;
  status: "pending" | "approved" | "incomplete";
  documents?: {
    psaBirthCertificate: boolean;
    form138: boolean;
    goodMoralCertificate: boolean;
    idPicture: boolean;
    parentGuardianId: boolean;
  };
  formData?: any;
}

interface DocumentReviewState {
  psaBirthCertificate: "pending" | "accepted" | "rejected";
  form138: "pending" | "accepted" | "rejected";
  goodMoralCertificate: "pending" | "accepted" | "rejected";
  idPicture: "pending" | "accepted" | "rejected";
  parentGuardianId: "pending" | "accepted" | "rejected";
}

interface DocumentRejectionReasons {
  psaBirthCertificate: string;
  form138: string;
  goodMoralCertificate: string;
  idPicture: string;
  parentGuardianId: string;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  email: string;
  timestamp: string;
  details: string;
}

export function AdminDashboard() {
  const { userData } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [pendingApplications, setPendingApplications] = useState<Student[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [overviewStats, setOverviewStats] = useState({
    totalStudents: 0,
    pendingApplications: 0,
    verifiedDocuments: 0,
    pendingPayments: 0,
  });
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showFormData, setShowFormData] = useState(false);

  // Document review state
  const [documentReview, setDocumentReview] = useState<DocumentReviewState>({
    psaBirthCertificate: "pending",
    form138: "pending",
    goodMoralCertificate: "pending",
    idPicture: "pending",
    parentGuardianId: "pending",
  });
  const [rejectionReasons, setRejectionReasons] = useState<DocumentRejectionReasons>({
    psaBirthCertificate: "",
    form138: "",
    goodMoralCertificate: "",
    idPicture: "",
    parentGuardianId: "",
  });
  const [expandedDocument, setExpandedDocument] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{type: string, url: string, fileUrl?: string | null} | null>(null);
  const actorReference = userData?.id || userData?.email || 'registrar';

  // Load real data from Supabase
  useEffect(() => {
    loadApplications();
    loadAuditLogs();
    calculateStats();
  }, []);

  const loadApplications = async () => {
    const { data: applications, error } = await getPendingApplications();
    
    if (error) {
      console.error('Error loading applications:', error);
      setPendingApplications([]);
      return;
    }

    if (!applications || applications.length === 0) {
      setPendingApplications([]);
      return;
    }

    const formattedApps = applications.map((app: any) => {
      const formData = app.form_data || {};
      return {
        id: app.id,
        name: formData.studentName || `${formData.firstName || ''} ${formData.lastName || ''}`,
        email: formData.email,
        strand: formData.preferredTrack || 'Not Set',
        applicationDate: new Date(app.enrollment_date).toLocaleDateString(),
        aiTestScore: 85,
        status: 'pending',
        documents: {
          psaBirthCertificate: app.enrollment_documents?.some((d: any) => d.document_type === 'birthCertificate') || false,
          form138: app.enrollment_documents?.some((d: any) => d.document_type === 'form138') || false,
          goodMoralCertificate: app.enrollment_documents?.some((d: any) => d.document_type === 'goodMoral') || false,
          idPicture: app.enrollment_documents?.some((d: any) => d.document_type === 'idPicture') || false,
          parentGuardianId: false,
        },
        formData: app,
      };
    });
    setPendingApplications(formattedApps);
  };

  const loadAuditLogs = async () => {
    const { data: logs, error } = await getAuditLogs(3);
    
    if (error) {
      console.error('Error loading audit logs:', error);
      setRecentActivity([]);
      return;
    }

    if (!logs || logs.length === 0) {
      setRecentActivity([]);
      return;
    }

    const recentLogs = logs.map((log: any) => {
      const timeDiff = Date.now() - new Date(log.timestamp).getTime();
      const minutesAgo = Math.floor(timeDiff / 60000);
      const hoursAgo = Math.floor(timeDiff / 3600000);
      const timeAgo = hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago` : `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
      
      return {
        id: log.id,
        message: log.details,
        timestamp: timeAgo,
        user: log.user_name || log.user || 'System',
        type: log.action.includes('SUBMIT') ? 'submission' : log.action.includes('APPROVE') ? 'verification' : 'payment',
      };
    });
    setRecentActivity(recentLogs);
  };

  const calculateStats = async () => {
    const { data: applications, error: appError } = await getPendingApplications();
    
    if (!appError && applications) {
      setOverviewStats({
        totalStudents: (applications.length || 0) + 5, // Approximation
        pendingApplications: applications.length || 0,
        verifiedDocuments: applications.filter((app: any) => 
          app.enrollment_documents?.length === 7 // All docs uploaded
        ).length || 0,
        pendingPayments: 0,
      });
    }
  };

  const filteredStudents = pendingApplications.filter((student) =>
    student.name && student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset document review state when modal opens
  const openReviewModal = (student: Student) => {
    setSelectedStudent(student);
    setDocumentReview({
      psaBirthCertificate: "pending",
      form138: "pending",
      goodMoralCertificate: "pending",
      idPicture: "pending",
      parentGuardianId: "pending",
    });
    setRejectionReasons({
      psaBirthCertificate: "",
      form138: "",
      goodMoralCertificate: "",
      idPicture: "",
      parentGuardianId: "",
    });
    setExpandedDocument(null);
  };

  // Check if all documents have been reviewed
  const allDocumentsReviewed =
    documentReview.psaBirthCertificate !== "pending" &&
    documentReview.form138 !== "pending" &&
    documentReview.goodMoralCertificate !== "pending" &&
    documentReview.idPicture !== "pending" &&
    documentReview.parentGuardianId !== "pending";

  // Handle document accept
  const handleAcceptDocument = (docType: keyof DocumentReviewState) => {
    setDocumentReview((prev) => ({
      ...prev,
      [docType]: "accepted",
    }));
    setExpandedDocument(null);
  };

  // Handle document reject
  const handleRejectDocument = (docType: keyof DocumentReviewState) => {
    setDocumentReview((prev) => ({
      ...prev,
      [docType]: "rejected",
    }));
    setExpandedDocument(docType);
  };

  // Handle rejection reason submission
  const handleSubmitRejection = (docType: keyof DocumentRejectionReasons) => {
    if (!rejectionReasons[docType].trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    setExpandedDocument(null);
  };

  // View document
  const handleViewDocument = (docType: string, student: Student) => {
    const docs = student.formData?.enrollment_documents as any[] | undefined;
    const doc = docs?.find((d: any) => d.document_type === docType);
    const fileUrl = doc?.file_url || doc?.file_path || null;

    if (doc) {
      setViewingDocument({
        type: docType,
        url: doc.file_name || docType,
        fileUrl,
      });
    } else {
      alert("Document not available");
    }
  };

  // Submit final review
  const handleSubmitFinalReview = async () => {
    if (!selectedStudent) return;

    // Check if all documents are accepted
    const allAccepted =
      documentReview.psaBirthCertificate === "accepted" &&
      documentReview.form138 === "accepted" &&
      documentReview.goodMoralCertificate === "accepted" &&
      documentReview.idPicture === "accepted" &&
      documentReview.parentGuardianId === "accepted";

    if (allAccepted) {
      // Approve the application
      handleApprove();
    } else {
      // Handle rejection - send notification to student with reasons
      const rejectedDocs: string[] = [];
      const reasons: string[] = [];

      if (documentReview.psaBirthCertificate === "rejected") {
        rejectedDocs.push("PSA Birth Certificate");
        reasons.push(`PSA Birth Certificate: ${rejectionReasons.psaBirthCertificate}`);
      }
      if (documentReview.form138 === "rejected") {
        rejectedDocs.push("Form 138");
        reasons.push(`Form 138: ${rejectionReasons.form138}`);
      }
      if (documentReview.goodMoralCertificate === "rejected") {
        rejectedDocs.push("Good Moral Certificate");
        reasons.push(`Good Moral Certificate: ${rejectionReasons.goodMoralCertificate}`);
      }
      if (documentReview.idPicture === "rejected") {
        rejectedDocs.push("2x2 ID Picture");
        reasons.push(`2x2 ID Picture: ${rejectionReasons.idPicture}`);
      }
      if (documentReview.parentGuardianId === "rejected") {
        rejectedDocs.push("Parent's/Guardian's ID");
        reasons.push(`Parent's/Guardian's ID: ${rejectionReasons.parentGuardianId}`);
      }

      // Update application status in Supabase
      await updateEnrollmentStatus(selectedStudent.id, 'rejected', reasons.join("; "));

      // Update document statuses in Supabase - reject/approve each document
      const docs = selectedStudent.formData?.enrollment_documents as any[] | undefined;
      if (docs) {
        const docTypeMap: Record<string, string> = {
          psaBirthCertificate: 'birthCertificate',
          form138: 'form138',
          goodMoralCertificate: 'goodMoral',
          idPicture: 'idPicture',
        };
        for (const [reviewKey, dbType] of Object.entries(docTypeMap)) {
          const doc = docs.find((d: any) => d.document_type === dbType);
          if (doc) {
            const reviewStatus = documentReview[reviewKey as keyof DocumentReviewState];
            if (reviewStatus === 'rejected') {
              await updateDocumentStatus(doc.id, 'rejected', rejectionReasons[reviewKey as keyof DocumentRejectionReasons]);
            } else if (reviewStatus === 'accepted') {
              await updateDocumentStatus(doc.id, 'approved');
            }
          }
        }
      }

      // Send notification to student via Supabase
      const studentUserId = await resolveUserId(selectedStudent.formData?.user_id || selectedStudent.email);
      if (studentUserId) {
        const detailedMessage = reasons.join(". ");
        await supabase.from('notifications').insert({
          user_id: studentUserId,
          type: 'DOCUMENTS_REJECTED',
          title: 'Action Required: Document Rejected',
          message: detailedMessage.trim(),
          is_read: false,
        });
      }

      // Add to audit log via Supabase
      await createAuditLog(
        actorReference,
        'DOCUMENTS_REJECTED',
        `Documents rejected for ${selectedStudent.name} - ${rejectedDocs.join(", ")}`,
        'warning'
      );

      // Reload data
      loadApplications();
      loadAuditLogs();
      calculateStats();

      alert(`Documents rejected. Student has been notified to resubmit: ${rejectedDocs.join(", ")}`);
      setSelectedStudent(null);
    }
  };

  const handleApprove = async () => {
    if (selectedStudent) {
      // Approve enrollment in Supabase (sets status to documents_verified)
      const { error } = await approveEnrollment(selectedStudent.id, actorReference);
      if (error) {
        alert(`❌ Error approving enrollment: ${error}`);
        return;
      }

      // Update all document statuses to approved in Supabase
      const docs = selectedStudent.formData?.enrollment_documents as any[] | undefined;
      if (docs) {
        for (const doc of docs) {
          await updateDocumentStatus(doc.id, 'approved');
        }
      }

      // Update enrollment progress in Supabase
      const studentUserId = await resolveUserId(selectedStudent.formData?.user_id || selectedStudent.email);
      if (studentUserId) {
        await upsertEnrollmentProgress(studentUserId, [
          { step_name: 'Documents Submitted', status: 'completed' },
          { step_name: 'Documents Verified', status: 'completed' },
          { step_name: 'Payment Submitted', status: 'current' },
        ]);

        // Send notification via Supabase
        await supabase.from('notifications').insert({
          user_id: studentUserId,
          type: 'DOCUMENTS_VERIFIED',
          title: 'Documents Verified',
          message: 'Your enrollment documents have been verified by the Registrar. You can now proceed to payment.',
          is_read: false,
        });
      }

      // Audit log is already created by approveEnrollment()

      // Reload data
      loadApplications();
      loadAuditLogs();
      calculateStats();
      
      alert(`Documents verified for ${selectedStudent.name}. Student can now proceed to payment.`);
      setSelectedStudent(null);
    }
  };

  const handleCorrection = async () => {
    if (selectedStudent) {
      // Add to audit log via Supabase
      await createAuditLog(
        actorReference,
        'CORRECTION_REQUESTED',
        `Correction requested for ${selectedStudent.name}`,
        'info'
      );

      loadAuditLogs();
      
      alert(`Correction request sent to: ${selectedStudent.name}`);
      setSelectedStudent(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          border: "#FCD34D",
        };
      case "approved":
        return {
          bg: "#D1FAE5",
          text: "#065F46",
          border: "#6EE7B7",
        };
      case "incomplete":
        return {
          bg: "#FEE2E2",
          text: "#991B1B",
          border: "#FCA5A5",
        };
      default:
        return {
          bg: "#F3F4F6",
          text: "#374151",
          border: "#D1D5DB",
        };
    }
  };

  return (
    <div className="portal-dashboard-page flex flex-col gap-6 p-4 sm:p-6 lg:p-8 xl:flex-row">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, Registrar
            </h1>
            <p className="text-gray-600">
              Manage student applications and enrollment records
            </p>
          </div>
          <div className="portal-glass-inline-control flex w-full items-center gap-2 rounded-lg px-4 py-2 sm:w-auto">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none outline-none text-sm font-medium text-gray-700"
              style={{ accentColor: "#1E3A8A" }}
            />
          </div>
        </div>

        {/* Section Header */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Overview</h2>

        {/* Overview Stats - 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Students */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#1E3A8A" }}
              >
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-2">
              {overviewStats.totalStudents}
            </h3>
            <p className="text-sm text-gray-600 font-medium">Total Students</p>
          </div>

          {/* Pending Applications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#F59E0B" }}
              >
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-2">
              {overviewStats.pendingApplications}
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              Pending Applications
            </p>
          </div>

          {/* Verified Documents */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#10B981" }}
              >
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-2">
              {overviewStats.verifiedDocuments}
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              Verified Documents
            </p>
          </div>

          {/* Pending Payments */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#EF4444" }}
              >
                <CreditCard className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-2">
              {overviewStats.pendingPayments}
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              Pending Payments
            </p>
          </div>
        </div>

        {/* Section Header */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Applications</h2>

        {/* Pending Applications Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Pending Applications
              </h2>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ accentColor: "#10B981" }}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Strand
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No pending applications at the moment
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const statusStyle = getStatusStyle(student.status);
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => openReviewModal(student)}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {student.name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                          >
                            {student.strand}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {new Date(student.applicationDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border"
                            style={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.text,
                              borderColor: statusStyle.border,
                            }}
                          >
                            {student.status.charAt(0).toUpperCase() +
                              student.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="text-sm font-medium hover:underline"
                            style={{ color: "#10B981" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openReviewModal(student);
                            }}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredStudents.length}</span> pending
              applications
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Sidebar */}
      <div className="w-full flex-shrink-0 xl:w-80">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-8">
          <div className="p-6 border-b border-gray-200" style={{ backgroundColor: "#F0FDF4" }}>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" style={{ color: "#10B981" }} />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>
          </div>

          <div className="p-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#D1FAE5" }}
                    >
                      {activity.type === "submission" && (
                        <FileText className="w-5 h-5" style={{ color: "#10B981" }} />
                      )}
                      {activity.type === "verification" && (
                        <FileCheck className="w-5 h-5" style={{ color: "#10B981" }} />
                      )}
                      {activity.type === "payment" && (
                        <CreditCard className="w-5 h-5" style={{ color: "#10B981" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              className="w-full px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: "#10B981" }}
              onClick={loadAuditLogs}
            >
              Refresh Activity
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div
              className="p-6 border-b border-gray-200"
              style={{ backgroundColor: "#F0FDF4" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Review Application
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedStudent.name} - {selectedStudent.strand}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-10 h-10 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedStudent.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Application Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedStudent.applicationDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">AI Test Score</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedStudent.aiTestScore || "N/A"}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Recommended Strand</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedStudent.strand}
                  </p>
                </div>
              </div>

              {/* Documents Checklist */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Required Documents
                </h3>
                <div className="space-y-3">
                  {/* PSA Birth Certificate */}
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4" style={{ color: selectedStudent.documents?.psaBirthCertificate ? "#10B981" : "#9CA3AF" }} />
                          <span className="text-sm font-medium text-gray-900">PSA Birth Certificate</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDocument("birthCertificate", selectedStudent)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all border"
                          style={{ borderColor: "#1E3A8A", color: "#1E3A8A" }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {documentReview.psaBirthCertificate === "pending" && (
                          <>
                            <button
                              onClick={() => handleAcceptDocument("psaBirthCertificate")}
                              className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                              style={{ backgroundColor: "#10B981" }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectDocument("psaBirthCertificate")}
                              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all border-2"
                              style={{ borderColor: "#B91C1C", color: "#B91C1C" }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {documentReview.psaBirthCertificate === "accepted" && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    {documentReview.psaBirthCertificate === "rejected" && expandedDocument === "psaBirthCertificate" && (
                      <div className="p-4 bg-red-50 border-t border-red-200">
                        <label className="block text-sm font-medium text-gray-900 mb-2">Reason for rejection:</label>
                        <input
                          type="text"
                          placeholder="e.g., Image is blurry, missing signature..."
                          value={rejectionReasons.psaBirthCertificate}
                          onChange={(e) => setRejectionReasons((prev) => ({ ...prev, psaBirthCertificate: e.target.value }))}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          onClick={() => handleSubmitRejection("psaBirthCertificate")}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                          style={{ backgroundColor: "#B91C1C" }}
                        >
                          Submit Reason
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Form 138 */}
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" style={{ color: selectedStudent.documents?.form138 ? "#10B981" : "#9CA3AF" }} />
                          <span className="text-sm font-medium text-gray-900">Form 138 (Report Card)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDocument("form138", selectedStudent)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all border"
                          style={{ borderColor: "#1E3A8A", color: "#1E3A8A" }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {documentReview.form138 === "pending" && (
                          <>
                            <button
                              onClick={() => handleAcceptDocument("form138")}
                              className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                              style={{ backgroundColor: "#10B981" }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectDocument("form138")}
                              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all border-2"
                              style={{ borderColor: "#B91C1C", color: "#B91C1C" }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {documentReview.form138 === "accepted" && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    {documentReview.form138 === "rejected" && expandedDocument === "form138" && (
                      <div className="p-4 bg-red-50 border-t border-red-200">
                        <label className="block text-sm font-medium text-gray-900 mb-2">Reason for rejection:</label>
                        <input
                          type="text"
                          placeholder="e.g., Image is blurry, missing signature..."
                          value={rejectionReasons.form138}
                          onChange={(e) => setRejectionReasons((prev) => ({ ...prev, form138: e.target.value }))}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          onClick={() => handleSubmitRejection("form138")}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                          style={{ backgroundColor: "#B91C1C" }}
                        >
                          Submit Reason
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Good Moral Certificate */}
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4" style={{ color: selectedStudent.documents?.goodMoralCertificate ? "#10B981" : "#9CA3AF" }} />
                          <span className="text-sm font-medium text-gray-900">Good Moral Certificate</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDocument("goodMoral", selectedStudent)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all border"
                          style={{ borderColor: "#1E3A8A", color: "#1E3A8A" }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {documentReview.goodMoralCertificate === "pending" && (
                          <>
                            <button
                              onClick={() => handleAcceptDocument("goodMoralCertificate")}
                              className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                              style={{ backgroundColor: "#10B981" }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectDocument("goodMoralCertificate")}
                              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all border-2"
                              style={{ borderColor: "#B91C1C", color: "#B91C1C" }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {documentReview.goodMoralCertificate === "accepted" && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    {documentReview.goodMoralCertificate === "rejected" && expandedDocument === "goodMoralCertificate" && (
                      <div className="p-4 bg-red-50 border-t border-red-200">
                        <label className="block text-sm font-medium text-gray-900 mb-2">Reason for rejection:</label>
                        <input
                          type="text"
                          placeholder="e.g., Image is blurry, missing signature..."
                          value={rejectionReasons.goodMoralCertificate}
                          onChange={(e) => setRejectionReasons((prev) => ({ ...prev, goodMoralCertificate: e.target.value }))}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          onClick={() => handleSubmitRejection("goodMoralCertificate")}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                          style={{ backgroundColor: "#B91C1C" }}
                        >
                          Submit Reason
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2x2 ID Picture */}
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" style={{ color: selectedStudent.documents?.idPicture ? "#10B981" : "#9CA3AF" }} />
                          <span className="text-sm font-medium text-gray-900">2x2 ID Picture</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDocument("idPicture", selectedStudent)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all border"
                          style={{ borderColor: "#1E3A8A", color: "#1E3A8A" }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {documentReview.idPicture === "pending" && (
                          <>
                            <button
                              onClick={() => handleAcceptDocument("idPicture")}
                              className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                              style={{ backgroundColor: "#10B981" }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectDocument("idPicture")}
                              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all border-2"
                              style={{ borderColor: "#B91C1C", color: "#B91C1C" }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {documentReview.idPicture === "accepted" && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    {documentReview.idPicture === "rejected" && expandedDocument === "idPicture" && (
                      <div className="p-4 bg-red-50 border-t border-red-200">
                        <label className="block text-sm font-medium text-gray-900 mb-2">Reason for rejection:</label>
                        <input
                          type="text"
                          placeholder="e.g., Image is blurry, not 2x2 size..."
                          value={rejectionReasons.idPicture}
                          onChange={(e) => setRejectionReasons((prev) => ({ ...prev, idPicture: e.target.value }))}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          onClick={() => handleSubmitRejection("idPicture")}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                          style={{ backgroundColor: "#B91C1C" }}
                        >
                          Submit Reason
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Parent's/Guardian's ID */}
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-4 h-4" style={{ color: selectedStudent.documents?.parentGuardianId ? "#10B981" : "#9CA3AF" }} />
                          <span className="text-sm font-medium text-gray-900">Photocopy of Parent's/Guardian's ID</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDocument("parentGuardianId", selectedStudent)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all border"
                          style={{ borderColor: "#1E3A8A", color: "#1E3A8A" }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {documentReview.parentGuardianId === "pending" && (
                          <>
                            <button
                              onClick={() => handleAcceptDocument("parentGuardianId")}
                              className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                              style={{ backgroundColor: "#10B981" }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectDocument("parentGuardianId")}
                              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all border-2"
                              style={{ borderColor: "#B91C1C", color: "#B91C1C" }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {documentReview.parentGuardianId === "accepted" && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    {documentReview.parentGuardianId === "rejected" && expandedDocument === "parentGuardianId" && (
                      <div className="p-4 bg-red-50 border-t border-red-200">
                        <label className="block text-sm font-medium text-gray-900 mb-2">Reason for rejection:</label>
                        <input
                          type="text"
                          placeholder="e.g., Image is blurry, ID is expired..."
                          value={rejectionReasons.parentGuardianId}
                          onChange={(e) => setRejectionReasons((prev) => ({ ...prev, parentGuardianId: e.target.value }))}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          onClick={() => handleSubmitRejection("parentGuardianId")}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                          style={{ backgroundColor: "#B91C1C" }}
                        >
                          Submit Reason
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* View Enrollment Form Data */}
              <div className="mb-6">
                <button
                  onClick={() => setShowFormData(!showFormData)}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-900" />
                    <span className="text-sm font-semibold text-blue-900">
                      View Complete Enrollment Form
                    </span>
                  </div>
                  <div className="text-blue-900">
                    {showFormData ? "▲" : "▼"}
                  </div>
                </button>

                {showFormData && selectedStudent.formData && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4 max-h-96 overflow-y-auto">
                    {/* Personal Information */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Personal Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-500">Full Name:</span> <span className="font-medium">{selectedStudent.formData.form_data?.firstName} {selectedStudent.formData.form_data?.middleName} {selectedStudent.formData.form_data?.lastName}</span></div>
                        <div><span className="text-gray-500">LRN:</span> <span className="font-medium">{selectedStudent.formData.form_data?.lrn}</span></div>
                        <div><span className="text-gray-500">Sex:</span> <span className="font-medium">{selectedStudent.formData.form_data?.sex}</span></div>
                        <div><span className="text-gray-500">Birthday:</span> <span className="font-medium">{selectedStudent.formData.form_data?.birthday}</span></div>
                        <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{selectedStudent.formData.form_data?.contactNumber}</span></div>
                        <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedStudent.formData.form_data?.email}</span></div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="pt-3 border-t border-gray-300">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Address</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-500">Region:</span> <span className="font-medium">{selectedStudent.formData.form_data?.region}</span></div>
                        <div><span className="text-gray-500">Province:</span> <span className="font-medium">{selectedStudent.formData.form_data?.province || 'N/A'}</span></div>
                        <div><span className="text-gray-500">City:</span> <span className="font-medium">{selectedStudent.formData.form_data?.city}</span></div>
                        <div><span className="text-gray-500">Barangay:</span> <span className="font-medium">{selectedStudent.formData.form_data?.barangay}</span></div>
                        <div className="col-span-2"><span className="text-gray-500">Home Address:</span> <span className="font-medium">{selectedStudent.formData.form_data?.homeAddress}</span></div>
                      </div>
                    </div>

                    {/* Enrollment Details */}
                    <div className="pt-3 border-t border-gray-300">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Enrollment Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-500">Track:</span> <span className="font-medium">{selectedStudent.formData.form_data?.preferredTrack}</span></div>
                        <div><span className="text-gray-500">Year Level:</span> <span className="font-medium">{selectedStudent.formData.form_data?.yearLevel}</span></div>
                        <div><span className="text-gray-500">Elective 1:</span> <span className="font-medium">{selectedStudent.formData.form_data?.elective1}</span></div>
                        <div><span className="text-gray-500">Elective 2:</span> <span className="font-medium">{selectedStudent.formData.form_data?.elective2}</span></div>
                      </div>
                    </div>

                    {/* Parent Information */}
                    <div className="pt-3 border-t border-gray-300">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Parent/Guardian Information</h4>
                      <div className="space-y-2">
                        <div className="text-xs">
                          <p className="text-gray-500 font-medium mb-1">Father:</p>
                          <p className="font-medium">{selectedStudent.formData.form_data?.fatherFirstName} {selectedStudent.formData.form_data?.fatherLastName}</p>
                          <p className="text-gray-600">{selectedStudent.formData.form_data?.fatherOccupation} • {selectedStudent.formData.form_data?.fatherContact}</p>
                        </div>
                        <div className="text-xs">
                          <p className="text-gray-500 font-medium mb-1">Mother:</p>
                          <p className="font-medium">{selectedStudent.formData.form_data?.motherFirstName} {selectedStudent.formData.form_data?.motherLastName}</p>
                          <p className="text-gray-600">{selectedStudent.formData.form_data?.motherOccupation} • {selectedStudent.formData.form_data?.motherContact}</p>
                        </div>
                      </div>
                    </div>

                    {/* Education Background */}
                    <div className="pt-3 border-t border-gray-300">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Educational Background</h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="text-gray-500">Primary School:</p>
                          <p className="font-medium">{selectedStudent.formData.form_data?.primarySchool} ({selectedStudent.formData.form_data?.primaryYearGraduated})</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Secondary School:</p>
                          <p className="font-medium">{selectedStudent.formData.form_data?.secondarySchool} ({selectedStudent.formData.form_data?.secondaryYearGraduated})</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmitFinalReview}
                  disabled={!allDocumentsReviewed}
                  className="flex-1 px-6 py-4 rounded-lg text-white font-semibold text-base hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#10B981" }}
                >
                  <CheckCircle className="w-5 h-5" />
                  Submit Final Review
                </button>
              </div>
              {!allDocumentsReviewed && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Please review all documents before submitting
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document View Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: "#F0FDF4" }}>
              <h2 className="text-2xl font-semibold text-gray-900">View Document</h2>
              <button
                onClick={() => setViewingDocument(null)}
                className="w-10 h-10 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {viewingDocument.fileUrl ? (
                <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
                  {viewingDocument.fileUrl.match(/\.pdf(\?|$)/i) ? (
                    <iframe
                      src={viewingDocument.fileUrl}
                      className="w-full h-[600px] rounded"
                      title="Document Viewer"
                    />
                  ) : viewingDocument.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                    <img
                      src={viewingDocument.fileUrl}
                      alt="Document"
                      className="max-w-full max-h-[600px] object-contain rounded"
                    />
                  ) : (
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4 font-medium">{viewingDocument.url}</p>
                      <a
                        href={viewingDocument.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Open Document
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
                  <div>
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2 font-medium">Document: {viewingDocument.url}</p>
                    <p className="text-sm text-gray-500">
                      Document preview not available.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}