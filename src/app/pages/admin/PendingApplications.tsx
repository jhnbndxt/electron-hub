import {
  Search,
  X,
  FileCheck,
  FileText,
  Award,
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
  XCircle,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import ReviewApplicationModalPending from "../../components/ReviewApplicationModalPending";
import {
  getPendingApplications,
  approveEnrollment,
  rejectEnrollment,
  resolveUserId,
  updateDocumentStatus,
  upsertEnrollmentProgress,
  getAssessmentResultByStudentId,
} from "../../../services/adminService";
import { triggerNotification } from "../../../services/notificationService";

interface Student {
  id: number | string;
  name: string;
  applicationDate: string;
  aiTestScore: number | null;
  status: "pending" | "incomplete" | "approved" | "rejected";
  strandApplied: string;
  documents: {
    psaBirthCertificate: boolean;
    form138: boolean;
    goodMoralCertificate: boolean;
  };
  rejectionReason?: string;
  email?: string;
  enrollmentData?: any;
}

export function PendingApplications() {
  const { userData } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [strandFilter, setStrandFilter] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [students, setStudents] = useState<Student[]>([]);
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionStudentId, setActionStudentId] = useState<number | string | null>(null);

  // Document review modal states
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [reviewingStudent, setReviewingStudent] = useState<any>(null);
  const [selectedDocument, setSelectedDocument] = useState<{ key: string; name: string; data: any } | null>(null);
  const [documentRejectionComment, setDocumentRejectionComment] = useState("");
  const actorReference = userData?.id || userData?.email || 'registrar';

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const { data: applications, error } = await getPendingApplications();
    
    if (error) {
      console.error('Error loading applications:', error);
      setStudents([]);
      return;
    }

    if (!applications || applications.length === 0) {
      setStudents([]);
      console.log('📋 No pending applications found');
      return;
    }
    
    // Format applications from Supabase with assessment results
    const formattedApps = await Promise.all(applications.map(async (app: any) => {
      const formData = app.form_data || {};
      const aiTestScore = await getAssessmentResultByStudentId(app.user_id);
      
      return {
        id: app.id,
        name: formData.studentName || `${formData.firstName || ''} ${formData.lastName || ''}`,
        email: app.user_id || formData.email,
        applicationDate: new Date(app.enrollment_date).toLocaleDateString(),
        aiTestScore: aiTestScore, // Will be null if not taken
        status: 'pending',
        strandApplied: formData.preferredTrack || formData.track || 'Not Set',
        documents: {
          psaBirthCertificate: app.enrollment_documents?.some((d: any) => d.document_type === 'birthCertificate') || false,
          form138: app.enrollment_documents?.some((d: any) => d.document_type === 'form138') || false,
          goodMoralCertificate: app.enrollment_documents?.some((d: any) => d.document_type === 'goodMoral') || false,
        },
        enrollmentId: app.id,
        enrollmentData: app,
      };
    }));
    
    setStudents(formattedApps);
    console.log('📋 Loaded', formattedApps.length, 'pending applications from Supabase');
  };

  const documentNames: Record<string, string> = {
    psaBirthCertificate: "PSA Birth Certificate",
    form138: "Form 138 (Report Card)",
    form137: "Form 137",
    goodMoral: "Good Moral Certificate",
    idPicture: "2x2 ID Picture",
    diploma: "Grade 10 Diploma",
  };

  const getDocumentStatus = (student: Student) => {
    const docs = student.enrollmentData?.enrollment_documents || [];
    const uploaded = docs.length;
    if (uploaded === 0) {
      return { uploaded: 0, approved: 0, rejected: 0, pending: 0, allApproved: false };
    }

    const approved = docs.filter((doc: any) => doc.status === "approved" || doc.verified === true).length;
    const rejected = docs.filter((doc: any) => doc.status === "rejected").length;
    const pending = uploaded - approved - rejected;

    return {
      uploaded,
      approved,
      rejected,
      pending,
      allApproved: approved === uploaded,
    };
  };

  const handleReviewDocuments = (student: Student) => {
    setReviewingStudent(student.enrollmentData);
    setShowDocumentModal(true);
    setSelectedDocument(null);
  };

  const handleViewDocument = (docKey: string) => {
    if (!reviewingStudent) return;
    const docs: any[] = reviewingStudent.enrollment_documents || [];
    const doc = docs.find((d: any) => d.document_type === docKey);
    if (!doc) {
      alert("This document has not been uploaded yet.");
      return;
    }
    setSelectedDocument({
      key: docKey,
      name: documentNames[docKey] || docKey,
      data: {
        ...doc,
        fileUrl: doc.file_path || doc.file_url,
        status: doc.status,
        rejectionComment: doc.rejection_comment || doc.rejection_reason || "",
      },
    });
    setDocumentRejectionComment(doc.rejection_comment || doc.rejection_reason || "");
  };

  const handleApproveDocument = async () => {
    if (!reviewingStudent || !selectedDocument) return;

    // Find the document in the enrollment
    const documentId = reviewingStudent.enrollment_documents?.find(
      (d: any) => d.document_type === selectedDocument.key
    )?.id;

    if (!documentId) {
      alert("Document not found");
      return;
    }

    const { error } = await updateDocumentStatus(documentId, 'approved');

    if (error) {
      alert(`Error approving document: ${error}`);
      return;
    }

    alert("✅ Document approved successfully!");
    setSelectedDocument(null);
    setDocumentRejectionComment("");
    loadApplications();
  };

  const handleRejectDocument = async () => {
    if (!reviewingStudent || !selectedDocument) return;
    
    if (!documentRejectionComment.trim()) {
      alert("❌ Rejection reason is required. Please provide a clear explanation.");
      return;
    }

    if (documentRejectionComment.trim().length < 10) {
      alert("❌ Please provide a more detailed rejection reason (at least 10 characters).");
      return;
    }

    // Find the document in the enrollment
    const documentId = reviewingStudent.enrollment_documents?.find(
      (d: any) => d.document_type === selectedDocument.key
    )?.id;

    if (!documentId) {
      alert("Document not found");
      return;
    }

    const { error } = await updateDocumentStatus(documentId, 'rejected', documentRejectionComment.trim());

    if (error) {
      alert(`Error rejecting document: ${error}`);
      return;
    }

    // Create notification
    try {
      await triggerNotification(
        reviewingStudent.user_id || reviewingStudent.email || "",
        'DOCUMENTS_REJECTED',
        { message: documentRejectionComment.trim() }
      );
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    alert(`✅ Document rejected. Student has been notified.`);
    setSelectedDocument(null);
    setDocumentRejectionComment("");
    loadApplications();
  };

  const getMissingDocuments = (student: Student): string[] => {
    const missing: string[] = [];
    if (!student.documents.psaBirthCertificate) missing.push("PSA Birth Certificate");
    if (!student.documents.form138) missing.push("Form 138");
    if (!student.documents.goodMoralCertificate) missing.push("Good Moral Certificate");
    return missing;
  };

  let filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (strandFilter !== "all") {
    filteredStudents = filteredStudents.filter(
      (student) => student.strandApplied === strandFilter
    );
  }

  if (documentFilter !== "all") {
    filteredStudents = filteredStudents.filter((student) => {
      const missing = getMissingDocuments(student);
      if (documentFilter === "complete") {
        return missing.length === 0;
      } else {
        return missing.includes(documentFilter);
      }
    });
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Bulk selection removed
  };

  const handleSelectStudent = (id: number | string) => {
    // Individual selection removed
  };

  const handleBulkApprove = () => {
    // Bulk approve removed
  };

  const handleExportPDF = () => {
    alert(`Exporting student record(s) to PDF...`);
  };

  const handleApproveClick = (id: number | string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;

    const docStatus = getDocumentStatus(student);
    if (!docStatus.allApproved) {
      alert("❌ Cannot approve application. All documents must be approved first! Please click 'Review Docs' to verify documents.");
      return;
    }

    setActionStudentId(id);
    setShowApproveModal(true);
  };

  const handleRejectClick = (id: number | string) => {
    setActionStudentId(id);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmApprove = async () => {
    if (actionStudentId) {
      const student = students.find(s => s.id === actionStudentId);
      
      if (student) {
        // Approve enrollment in Supabase
        const { error } = await approveEnrollment(actionStudentId, actorReference);
        
        if (error) {
          alert(`❌ Error approving application: ${error}`);
          setShowApproveModal(false);
          return;
        }

        const studentUserId = await resolveUserId(student.email || "");
        if (studentUserId) {
          await upsertEnrollmentProgress(studentUserId, [
            { step_name: 'Documents Submitted', status: 'completed' },
            { step_name: 'Documents Verified', status: 'completed' },
            { step_name: 'Payment Submitted', status: 'current' },
          ]);
        }

        // Create notification for student
        try {
          await triggerNotification(student.email || "", 'DOCUMENTS_VERIFIED');
        } catch (error) {
          console.error('Error creating notification:', error);
        }

        alert(`✅ ${student.name}'s documents are verified. Payment is now unlocked.`);
        setShowApproveModal(false);
        setActionStudentId(null);
        
        // Reload applications
        loadApplications();
      }
    }
  };

  const confirmReject = async () => {
    if (actionStudentId && rejectionReason.trim()) {
      const student = students.find(s => s.id === actionStudentId);
      
      if (student) {
        // Reject enrollment in Supabase
        const { error } = await rejectEnrollment(actionStudentId, rejectionReason.trim(), actorReference);
        
        if (error) {
          alert(`❌ Error rejecting application: ${error}`);
          setShowRejectModal(false);
          return;
        }

        // Create notification for student
        try {
          await triggerNotification(student.email || "", 'ENROLLMENT_REJECTED');
        } catch (error) {
          console.error('Error creating notification:', error);
        }

        alert(`✅ ${student.name}'s application has been rejected.`);
        setShowRejectModal(false);
        setActionStudentId(null);
        setRejectionReason("");
        
        // Reload applications
        loadApplications();
      }
    } else {
      alert("❌ Please provide a rejection reason.");
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
      case "incomplete":
        return {
          bg: "#FEE2E2",
          text: "#991B1B",
          border: "#FCA5A5",
        };
      case "approved":
        return {
          bg: "#D1FAE5",
          text: "#065F46",
          border: "#10B981",
        };
      case "rejected":
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
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold" style={{ color: "var(--electron-blue)" }}>
          <FileCheck className="h-4 w-4" />
          Application Review System
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--electron-blue)" }}>Pending Applications</h1>
        <p className="text-gray-600 text-lg">Review and process student applications requiring action</p>
      </div>

      {/* Filter Bar */}
      <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-xl shadow-lg p-5 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
          <div className="relative w-full md:flex-1 md:min-w-[240px]">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--electron-blue)" }} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm transition-all"
              style={{ "--tw-ring-color": "var(--electron-blue)" } as any}
            />
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={strandFilter}
              onChange={(e) => setStrandFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm transition-all"
              style={{ color: "#374151", "--tw-ring-color": "var(--electron-blue)" } as any}
            >
              <option value="all">All Strands</option>
              <option value="STEM">STEM</option>
              <option value="ABM">ABM</option>
              <option value="HUMSS">HUMSS</option>
              <option value="TVL-ICT">TVL-ICT</option>
              <option value="ICT">ICT</option>
              <option value="GAS">GAS</option>
            </select>
          </div>

          <select
            value={documentFilter}
            onChange={(e) => setDocumentFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ color: "#374151" }}
          >
            <option value="all">All Documents</option>
            <option value="complete">Complete Documents</option>
            <option value="PSA Birth Certificate">Missing PSA Birth Certificate</option>
            <option value="Form 138">Missing Form 138</option>
            <option value="Good Moral Certificate">Missing Good Moral Certificate</option>
          </select>

          <button
            onClick={loadApplications}
            className="w-full sm:w-auto justify-center px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#10B981" }}
          >
            <Download className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Applications
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Strand Applied
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Application Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  AI Test Score
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Missing Documents
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="text-gray-900 font-medium mb-1">No pending applications</p>
                        <p className="text-sm text-gray-500">
                          Applications will appear here when students submit enrollment forms
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const statusStyle = getStatusStyle(student.status);
                  const missingDocs = getMissingDocuments(student);
                  const docStatus = getDocumentStatus(student);
                  
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {student.name}
                        </p>
                        {docStatus.uploaded > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Docs: {docStatus.approved}/{docStatus.uploaded} approved
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}
                        >
                          {student.strandApplied}
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
                        <div className="flex items-center gap-2">
                          <Award
                            className="w-4 h-4"
                            style={{ color: "#1E3A8A" }}
                          />
                          <span className="text-sm font-semibold text-gray-900">
                            {student.aiTestScore !== null ? `${student.aiTestScore}%` : "Not Taken"}
                          </span>
                        </div>
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
                        {missingDocs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {missingDocs.map((doc, idx) => (
                              <span
                                key={idx}
                                className="inline-flex px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor: "#FEE2E2",
                                  color: "#991B1B",
                                }}
                              >
                                {doc}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span
                            className="text-xs font-medium"
                            style={{ color: "#10B981" }}
                          >
                            Complete
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleReviewDocuments(student)}
                          className="mx-auto inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          title="Review Application"
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

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">{filteredStudents.length}</span> pending
            applications (approved students are hidden)
          </p>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 text-center">
              <h3 className="text-2xl font-bold text-gray-900">
                Application Approved
              </h3>
              <p className="text-gray-600 mt-2 text-sm">
                The student has been notified and added to enrolled students.
              </p>
            </div>
            <div className="p-6 pt-0">
              <button
                onClick={confirmApprove}
                className="w-full py-3 rounded-lg text-white font-bold transition-all hover:opacity-90"
                style={{ backgroundColor: "#10B981" }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100">
              <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--electron-blue)" }}>
                Reject Application
              </h3>
              <p className="text-gray-600">
                Please provide a reason for rejection.
              </p>
            </div>
            <div className="p-6 pt-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                style={{ color: "#374151", "--tw-ring-color": "var(--electron-blue)" } as any}
                rows={4}
              />
            </div>
            <div className="p-6 pt-2 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="flex-1 py-3 rounded-lg font-bold transition-all"
                style={{
                  backgroundColor: "#E5E7EB",
                  color: "#374151",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#D1D5DB"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#E5E7EB"}
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 py-3 rounded-lg text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: "var(--electron-red)" }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Review Modal */}
      <ReviewApplicationModalPending
        isOpen={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false);
          setSelectedDocument(null);
        }}
        reviewingStudent={reviewingStudent}
        selectedDocument={selectedDocument}
        documentRejectionComment={documentRejectionComment}
        setDocumentRejectionComment={setDocumentRejectionComment}
        handleViewDocument={handleViewDocument}
        handleApproveDocument={handleApproveDocument}
        handleRejectDocument={handleRejectDocument}
        handleBackToDocuments={() => {
          setSelectedDocument(null);
          setDocumentRejectionComment("");
        }}
        documentNames={documentNames}
      />
    </div>
  );
}
