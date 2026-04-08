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

interface Student {
  id: number | string;
  name: string;
  applicationDate: string;
  aiTestScore: number;
  status: "pending" | "incomplete" | "approved" | "rejected";
  strandApplied: string;
  documents: {
    psaBirthCertificate: boolean;
    form138: boolean;
    goodMoralCertificate: boolean;
  };
  rejectionReason?: string;
  email?: string;
}

export function PendingApplications() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
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

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
    
    // Filter out approved applications - only show pending ones
    const pendingApps = applications.filter((app: any) => 
      app.status === "Pending Review" || app.status === "pending" || app.status === "incomplete"
    );
    
    const formattedApps = pendingApps.map((app: any) => ({
      id: app.id,
      name: app.studentName,
      email: app.email,
      applicationDate: new Date(app.submissionDate).toLocaleDateString(),
      aiTestScore: 85,
      status: app.status === "Pending Review" ? "pending" : app.status.toLowerCase(),
      strandApplied: app.preferredTrack,
      documents: {
        psaBirthCertificate: !!app.documents?.birthCertificate,
        form138: !!app.documents?.form138,
        goodMoralCertificate: !!app.documents?.goodMoral,
      },
    }));
    setStudents(formattedApps);
    console.log('📋 Loaded', formattedApps.length, 'pending applications (approved students hidden)');
  };

  const documentNames: Record<string, string> = {
    psaBirthCertificate: "PSA Birth Certificate",
    form138: "Form 138 (Report Card)",
    form137: "Form 137",
    goodMoral: "Good Moral Certificate",
    idPicture: "2x2 ID Picture",
    diploma: "Grade 10 Diploma",
  };

  const getStudentDocuments = (email: string) => {
    const docVerification = JSON.parse(localStorage.getItem("document_verification") || "{}");
    return docVerification[email] || {};
  };

  const getDocumentStatus = (email: string) => {
    const docs = getStudentDocuments(email);
    const docKeys = Object.keys(docs);
    if (docKeys.length === 0) return { uploaded: 0, approved: 0, rejected: 0, pending: 0, allApproved: false };
    
    let approved = 0, rejected = 0, pending = 0;
    docKeys.forEach(key => {
      if (docs[key].status === "approved") approved++;
      else if (docs[key].status === "rejected") rejected++;
      else if (docs[key].status === "pending") pending++;
    });
    
    return {
      uploaded: docKeys.length,
      approved,
      rejected,
      pending,
      allApproved: docKeys.length > 0 && approved === docKeys.length
    };
  };

  const handleReviewDocuments = (student: Student) => {
    const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
    const fullApp = applications.find((app: any) => app.id === student.id);
    setReviewingStudent(fullApp);
    setShowDocumentModal(true);
    setSelectedDocument(null);
  };

  const handleViewDocument = (docKey: string) => {
    if (!reviewingStudent) return;
    const docs = getStudentDocuments(reviewingStudent.email || "");
    if (!docs[docKey]) {
      alert("This document has not been uploaded yet.");
      return;
    }
    setSelectedDocument({
      key: docKey,
      name: documentNames[docKey],
      data: docs[docKey],
    });
    setDocumentRejectionComment(docs[docKey]?.rejectionComment || "");
  };

  const handleApproveDocument = () => {
    if (!reviewingStudent || !selectedDocument) return;

    const docVerification = JSON.parse(localStorage.getItem("document_verification") || "{}");
    const email = reviewingStudent.email || "";
    
    if (!docVerification[email] || !docVerification[email][selectedDocument.key]) {
      alert("Document data not found");
      return;
    }
    
    docVerification[email][selectedDocument.key].status = "approved";
    docVerification[email][selectedDocument.key].rejectionComment = "";
    localStorage.setItem("document_verification", JSON.stringify(docVerification));

    const allDocs = docVerification[email];
    const allApproved = Object.values(allDocs).every((doc: any) => doc.status === "approved");

    if (allApproved) {
      const progressKey = `enrollment_progress_${email}`;
      const progress = JSON.parse(localStorage.getItem(progressKey) || "[]");
      const updatedProgress = progress.map((step: any) => {
        if (step.name === "Documents Verified") {
          return { ...step, status: "completed" };
        }
        if (step.name === "Payment Submitted" && step.status === "upcoming") {
          return { ...step, status: "current" };
        }
        return step;
      });
      localStorage.setItem(progressKey, JSON.stringify(updatedProgress));

      const notificationsKey = `notifications_${email}`;
      const notifications = JSON.parse(localStorage.getItem(notificationsKey) || "[]");
      notifications.unshift({
        id: `notif-${Date.now()}`,
        type: "documents_approved",
        title: "All Documents Approved! ✅",
        message: "All your documents have been approved! You can now proceed with payment.",
        timestamp: new Date().toISOString(),
        read: false,
      });
      localStorage.setItem(notificationsKey, JSON.stringify(notifications));
    }

    setSelectedDocument(null);
    setDocumentRejectionComment("");
    alert("✅ Document approved successfully!");
  };

  const handleRejectDocument = () => {
    if (!reviewingStudent || !selectedDocument) return;
    
    if (!documentRejectionComment.trim()) {
      alert("❌ Rejection reason is required. Please provide a clear explanation.");
      return;
    }

    if (documentRejectionComment.trim().length < 10) {
      alert("❌ Please provide a more detailed rejection reason (at least 10 characters).");
      return;
    }

    const docVerification = JSON.parse(localStorage.getItem("document_verification") || "{}");
    const email = reviewingStudent.email || "";
    
    if (!docVerification[email] || !docVerification[email][selectedDocument.key]) {
      alert("Document data not found");
      return;
    }
    
    docVerification[email][selectedDocument.key].status = "rejected";
    docVerification[email][selectedDocument.key].rejectionComment = documentRejectionComment.trim();
    localStorage.setItem("document_verification", JSON.stringify(docVerification));

    const notificationsKey = `notifications_${email}`;
    const notifications = JSON.parse(localStorage.getItem(notificationsKey) || "[]");
    
    notifications.unshift({
      id: `notif-${Date.now()}`,
      type: "document_rejected",
      title: "Document Rejected ❌",
      message: `Your ${documentNames[selectedDocument.key]} has been rejected. Reason: ${documentRejectionComment.trim()}`,
      documentName: documentNames[selectedDocument.key],
      rejectionReason: documentRejectionComment.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    });
    
    localStorage.setItem(notificationsKey, JSON.stringify(notifications));

    setSelectedDocument(null);
    setDocumentRejectionComment("");
    alert(`✅ Document rejected. Student has been notified.`);
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
    if (e.target.checked) {
      setSelectedStudents(filteredStudents.map((s) => s.id as number));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (id: number | string) => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    if (selectedStudents.includes(numId)) {
      setSelectedStudents(selectedStudents.filter((sid) => sid !== numId));
    } else {
      setSelectedStudents([...selectedStudents, numId]);
    }
  };

  const handleBulkApprove = () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student to approve.");
      return;
    }
    const selectedNames = filteredStudents
      .filter((s) => selectedStudents.includes(s.id as number))
      .map((s) => s.name)
      .join(", ");
    alert(`Bulk approved ${selectedStudents.length} student(s): ${selectedNames}`);
    setSelectedStudents([]);
  };

  const handleExportPDF = () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student to export.");
      return;
    }
    alert(`Exporting ${selectedStudents.length} student record(s) to PDF...`);
  };

  const handleApproveClick = (id: number | string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;

    const docStatus = getDocumentStatus(student.email || "");
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

  const confirmApprove = () => {
    if (actionStudentId) {
      const student = students.find(s => s.id === actionStudentId);
      
      if (student) {
        const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
        const updatedApps = applications.map((app: any) => 
          app.id === actionStudentId ? { ...app, status: "approved" } : app
        );
        localStorage.setItem("pending_applications", JSON.stringify(updatedApps));

        const enrolledStudents = JSON.parse(localStorage.getItem("enrolled_students") || "[]");
        const newStudent = {
          id: `student-${Date.now()}`,
          studentId: `2026-${String(enrolledStudents.length + 1).padStart(4, '0')}`,
          name: student.name,
          email: student.email || "",
          enrollmentDate: new Date().toISOString(),
          status: "enrolled",
          strandEnrolled: student.strandApplied,
          yearLevel: "Grade 11",
        };
        enrolledStudents.push(newStudent);
        localStorage.setItem("enrolled_students", JSON.stringify(enrolledStudents));

        const auditLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
        auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: "Application Approved",
          user: "Registrar",
          email: "registrar@electron.edu",
          timestamp: new Date().toISOString(),
          details: `Application approved for ${student.name}`,
          status: "success",
        });
        localStorage.setItem("audit_logs", JSON.stringify(auditLogs));

        const notificationsKey = `notifications_${student.email}`;
        const notifications = JSON.parse(localStorage.getItem(notificationsKey) || "[]");
        notifications.unshift({
          id: `notif-${Date.now()}`,
          type: "application_approved",
          title: "Application Approved! 🎉",
          message: "Your enrollment application has been approved!",
          timestamp: new Date().toISOString(),
          read: false,
        });
        localStorage.setItem(notificationsKey, JSON.stringify(notifications));

        setStudents(students.filter(s => s.id !== actionStudentId));
      }
      
      setShowApproveModal(false);
      setActionStudentId(null);
      loadApplications();
    }
  };

  const confirmReject = () => {
    if (actionStudentId && rejectionReason.trim()) {
      const student = students.find(s => s.id === actionStudentId);
      
      if (student) {
        const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
        const updatedApps = applications.map((app: any) => 
          app.id === actionStudentId ? { 
            ...app, 
            status: "rejected",
            rejectionReason: rejectionReason.trim()
          } : app
        );
        localStorage.setItem("pending_applications", JSON.stringify(updatedApps));

        const auditLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
        auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: "Application Rejected",
          user: "Registrar",
          email: "registrar@electron.edu",
          timestamp: new Date().toISOString(),
          details: `Application rejected for ${student.name}: ${rejectionReason.trim()}`,
          status: "success",
        });
        localStorage.setItem("audit_logs", JSON.stringify(auditLogs));

        setStudents(students.map(s => 
          s.id === actionStudentId ? { 
            ...s, 
            status: "rejected" as const, 
            rejectionReason: rejectionReason.trim()
          } : s
        ));
      }
      
      setShowRejectModal(false);
      setRejectionReason("");
      setActionStudentId(null);
      loadApplications();
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Pending Applications
        </h1>
        <p className="text-gray-600">
          Review and process student applications requiring action
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={strandFilter}
              onChange={(e) => setStrandFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ color: "#374151" }}
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
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#10B981" }}
          >
            <Download className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Applications
              </h2>
              {selectedStudents.length > 0 && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "#DBEAFE", color: "#1E40AF" }}
                >
                  {selectedStudents.length} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkApprove}
                disabled={selectedStudents.length === 0}
                className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: "#10B981" }}
              >
                <CheckCircle className="w-4 h-4" />
                Bulk Approve
              </button>
              <button
                onClick={handleExportPDF}
                disabled={selectedStudents.length === 0}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ color: "#374151" }}
              >
                <Download className="w-4 h-4" />
                Export to PDF
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filteredStudents.length > 0 &&
                      selectedStudents.length === filteredStudents.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "#1E3A8A" }}
                  />
                </th>
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
                  <td colSpan={8} className="px-6 py-12 text-center">
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
                  const docStatus = getDocumentStatus(student.email || "");
                  
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id as number)}
                          onChange={() => handleSelectStudent(student.id)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: "#1E3A8A" }}
                        />
                      </td>
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
                            {student.aiTestScore}%
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {student.email && (
                            <button
                              onClick={() => handleReviewDocuments(student)}
                              className="px-3 py-1.5 rounded text-xs font-medium text-white transition-all hover:opacity-90"
                              style={{ backgroundColor: "#1E3A8A" }}
                              title="Review Documents"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleApproveClick(student.id)}
                            disabled={student.status === "approved" || student.status === "rejected"}
                            className="px-3 py-1.5 rounded text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: "#10B981" }}
                            title={!getDocumentStatus(student.email || "").allApproved ? "All documents must be approved first" : "Approve Application"}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(student.id)}
                            disabled={student.status === "approved" || student.status === "rejected"}
                            className="px-3 py-1.5 rounded text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: "#B91C1C" }}
                          >
                            Reject
                          </button>
                        </div>
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
            className="bg-white w-full max-w-sm"
            style={{
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900">
                Application Approved
              </h3>
              <p className="text-gray-600 mt-4">
                The student has been notified and added to enrolled students.
              </p>
            </div>
            <div className="p-6 pt-0">
              <button
                onClick={confirmApprove}
                className="w-full py-4 rounded-xl text-white font-semibold transition-all"
                style={{ backgroundColor: "#1E3A8A" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1E40AF"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1E3A8A"}
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
            className="bg-white w-full max-w-md"
            style={{
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Application Rejected
              </h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                style={{ color: "#374151" }}
              />
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="flex-1 py-4 rounded-xl font-semibold transition-all"
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
                className="flex-1 py-4 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#B91C1C" }}
                onMouseEnter={(e) => !rejectionReason.trim() ? null : e.currentTarget.style.backgroundColor = "#DC2626"}
                onMouseLeave={(e) => !rejectionReason.trim() ? null : e.currentTarget.style.backgroundColor = "#B91C1C"}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Review Modal */}
      {showDocumentModal && reviewingStudent && (
        <div className="fixed inset-0 z-50 overflow-hidden" onClick={() => setShowDocumentModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="px-6 py-6 bg-blue-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Document Verification
                      </h2>
                      <p className="text-sm text-blue-100 mt-1">{reviewingStudent.studentName}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowDocumentModal(false);
                        setSelectedDocument(null);
                      }}
                      className="text-white hover:text-blue-100"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {(() => {
                    const docs = getStudentDocuments(reviewingStudent.email || "");
                    const docKeys = Object.keys(docs);
                    
                    if (docKeys.length === 0) {
                      return (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                          <p className="text-yellow-900 font-medium">No documents uploaded yet</p>
                        </div>
                      );
                    }

                    const docStatus = getDocumentStatus(reviewingStudent.email || "");

                    return (
                      <>
                        {/* Status Summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-900">
                              {docStatus.approved} of {docStatus.uploaded} documents approved
                            </p>
                            {docStatus.allApproved && (
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-sm">
                                <CheckCircle className="w-4 h-4" />
                                All Approved
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Document Grid */}
                        {!selectedDocument && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {docKeys.map((key) => {
                              const doc = docs[key];
                              return (
                                <div
                                  key={key}
                                  onClick={() => handleViewDocument(key)}
                                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                                    doc.status === "approved"
                                      ? "border-green-200 bg-green-50"
                                      : doc.status === "rejected"
                                      ? "border-red-200 bg-red-50"
                                      : "border-yellow-200 bg-yellow-50"
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-5 h-5 text-gray-600" />
                                      <h4 className="font-medium text-sm text-gray-900">
                                        {documentNames[key]}
                                      </h4>
                                    </div>
                                    {doc.status === "approved" && <CheckCircle className="w-5 h-5 text-green-600" />}
                                    {doc.status === "rejected" && <XCircle className="w-5 h-5 text-red-600" />}
                                    {doc.status === "pending" && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    Uploaded: {doc.uploadDate}
                                  </p>
                                  {doc.rejectionComment && (
                                    <p className="text-xs text-red-600 mb-2 line-clamp-2">
                                      "{doc.rejectionComment}"
                                    </p>
                                  )}
                                  <button className="w-full py-2 px-3 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">
                                    <Eye className="w-3 h-3 inline mr-1" />
                                    View & Verify
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Document Detail View */}
                        {selectedDocument && (
                          <div>
                            <button
                              onClick={() => {
                                setSelectedDocument(null);
                                setDocumentRejectionComment("");
                              }}
                              className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              ← Back to all documents
                            </button>
                            
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                              {selectedDocument.name}
                            </h3>
                            
                            {/* Document Preview */}
                            <div className="mb-4">
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {selectedDocument.data.fileData && (
                                  <img
                                    src={selectedDocument.data.fileData}
                                    alt={selectedDocument.name}
                                    className="w-full h-auto"
                                  />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                File: {selectedDocument.data.fileName} ({selectedDocument.data.fileSize})
                              </p>
                            </div>

                            {/* Current Status */}
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Status:</p>
                              <span
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                                  selectedDocument.data.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : selectedDocument.data.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {selectedDocument.data.status.toUpperCase()}
                              </span>
                              {selectedDocument.data.rejectionComment && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                  <p className="text-xs font-semibold text-red-900 mb-1">
                                    Previous Rejection Reason:
                                  </p>
                                  <p className="text-sm text-red-700">
                                    {selectedDocument.data.rejectionComment}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Rejection Comment */}
                            <div className="mb-4">
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Rejection Reason <span className="text-red-600">*</span>
                              </label>
                              <textarea
                                value={documentRejectionComment}
                                onChange={(e) => setDocumentRejectionComment(e.target.value)}
                                placeholder="Explain why this document is being rejected..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                              />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                              <button
                                onClick={handleRejectDocument}
                                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                              >
                                ❌ Reject
                              </button>
                              <button
                                onClick={handleApproveDocument}
                                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                              >
                                ✅ Approve
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
