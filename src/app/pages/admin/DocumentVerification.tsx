import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  User,
  Mail,
  Calendar,
  Download,
} from "lucide-react";

interface StudentDocument {
  email: string;
  studentName: string;
  documents: {
    [key: string]: {
      status: "pending" | "approved" | "rejected";
      uploadDate: string;
      fileSize: string;
      fileData: string;
      fileName: string;
      rejectionComment?: string;
    };
  };
}

export function DocumentVerification() {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDocument | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{
    key: string;
    name: string;
    data: any;
  } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");

  useEffect(() => {
    loadStudentDocuments();
  }, []);

  const loadStudentDocuments = () => {
    const docVerification = JSON.parse(localStorage.getItem("document_verification") || "{}");
    const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");

    const studentsWithDocs: StudentDocument[] = [];

    Object.keys(docVerification).forEach((email) => {
      const application = applications.find((app: any) => app.email === email);
      if (application) {
        studentsWithDocs.push({
          email,
          studentName: application.studentName || application.name || email,
          documents: docVerification[email],
        });
      }
    });

    setStudents(studentsWithDocs);
  };

  const documentNames: Record<string, string> = {
    psaBirthCertificate: "PSA Birth Certificate",
    form138: "Form 138 (Report Card)",
    form137: "Form 137",
    goodMoral: "Good Moral Certificate",
    idPicture: "2x2 ID Picture",
    diploma: "Grade 10 Diploma",
  };

  const getDocumentCounts = (docs: any) => {
    let pending = 0, approved = 0, rejected = 0;
    Object.values(docs).forEach((doc: any) => {
      if (doc.status === "pending") pending++;
      if (doc.status === "approved") approved++;
      if (doc.status === "rejected") rejected++;
    });
    return { pending, approved, rejected };
  };

  const filteredStudents = students.filter((student) =>
    student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDocument = (student: StudentDocument, docKey: string) => {
    setSelectedStudent(student);
    setSelectedDocument({
      key: docKey,
      name: documentNames[docKey],
      data: student.documents[docKey],
    });
    setShowReviewModal(true);
    setRejectionComment("");
  };

  const handleApproveDocument = () => {
    if (!selectedStudent || !selectedDocument) return;

    const docVerification = JSON.parse(localStorage.getItem("document_verification") || "{}");
    
    if (!docVerification[selectedStudent.email] || !docVerification[selectedStudent.email][selectedDocument.key]) {
      alert("Document data not found");
      return;
    }
    
    docVerification[selectedStudent.email][selectedDocument.key].status = "approved";
    docVerification[selectedStudent.email][selectedDocument.key].rejectionComment = "";
    localStorage.setItem("document_verification", JSON.stringify(docVerification));

    // Check if all documents are approved
    const allDocs = docVerification[selectedStudent.email];
    const allApproved = Object.values(allDocs).every((doc: any) => doc.status === "approved");

    if (allApproved) {
      // Update enrollment progress
      const progressKey = `enrollment_progress_${selectedStudent.email}`;
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
    }

    // Reload and close
    loadStudentDocuments();
    setShowReviewModal(false);
    setSelectedStudent(null);
    setSelectedDocument(null);
    setRejectionComment("");
  };

  const handleRejectDocument = () => {
    if (!selectedStudent || !selectedDocument) return;
    
    if (!rejectionComment.trim()) {
      alert("❌ Rejection reason is required. Please provide a clear explanation for why this document is being rejected.");
      return;
    }

    if (rejectionComment.trim().length < 10) {
      alert("❌ Please provide a more detailed rejection reason (at least 10 characters).");
      return;
    }

    const docVerification = JSON.parse(localStorage.getItem("document_verification") || "{}");
    
    if (!docVerification[selectedStudent.email] || !docVerification[selectedStudent.email][selectedDocument.key]) {
      alert("Document data not found");
      return;
    }
    
    docVerification[selectedStudent.email][selectedDocument.key].status = "rejected";
    docVerification[selectedStudent.email][selectedDocument.key].rejectionComment = rejectionComment.trim();
    localStorage.setItem("document_verification", JSON.stringify(docVerification));

    // Create a notification for the student
    const notificationsKey = `notifications_${selectedStudent.email}`;
    const notifications = JSON.parse(localStorage.getItem(notificationsKey) || "[]");
    
    notifications.unshift({
      id: `notif-${Date.now()}`,
      type: "document_rejected",
      title: "Document Rejected",
      message: `Your ${documentNames[selectedDocument.key]} has been rejected. Reason: ${rejectionComment.trim()}`,
      documentName: documentNames[selectedDocument.key],
      rejectionReason: rejectionComment.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    });
    
    localStorage.setItem(notificationsKey, JSON.stringify(notifications));

    // Reload and close
    loadStudentDocuments();
    setShowReviewModal(false);
    setSelectedStudent(null);
    setSelectedDocument(null);
    setRejectionComment("");
    
    alert(`✅ Document rejected. The student has been notified with your feedback.`);
  };

  const totalPending = students.reduce((sum, student) => {
    return sum + getDocumentCounts(student.documents).pending;
  }, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Verification</h1>
        <p className="text-gray-600">Review and approve student document submissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Documents</p>
              <p className="text-3xl font-bold text-gray-900">{totalPending}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Students with Documents</p>
              <p className="text-3xl font-bold text-gray-900">{students.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900">
                {students.reduce((sum, s) => sum + Object.keys(s.documents).length, 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {/* Debug Info */}
        {students.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Debug Info:</strong> No students with documents found. 
              {Object.keys(JSON.parse(localStorage.getItem("document_verification") || "{}")).length > 0 
                ? " Documents exist in localStorage but no matching applications found in pending_applications."
                : " No documents in document_verification localStorage."}
            </p>
          </div>
        )}
        
        {filteredStudents.length === 0 && students.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No students match your search</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No student documents found</p>
            <p className="text-sm text-gray-400">Students will appear here once they upload their enrollment documents</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const counts = getDocumentCounts(student.documents);
            return (
              <div key={student.email} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Student Header */}
                <div 
                  className="bg-gray-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    // Open first document when clicking student row
                    const firstDocKey = Object.keys(student.documents)[0];
                    if (firstDocKey) {
                      handleViewDocument(student, firstDocKey);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.studentName}</h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                        <span className="text-gray-600">{counts.pending} Pending</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-gray-600">{counts.approved} Approved</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-gray-600">{counts.rejected} Rejected</span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                        Click to Review
                      </span>
                    </div>
                  </div>
                </div>

                {/* Documents Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(student.documents).map(([key, doc]: [string, any]) => (
                      <div
                        key={key}
                        onClick={() => handleViewDocument(student, key)}
                        className={`border-2 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                          doc.status === "approved"
                            ? "border-green-200 bg-green-50 hover:border-green-300"
                            : doc.status === "rejected"
                            ? "border-red-200 bg-red-50 hover:border-red-300"
                            : "border-yellow-200 bg-yellow-50 hover:border-yellow-300"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <h4 className="font-medium text-sm text-gray-900">
                              {documentNames[key]}
                            </h4>
                          </div>
                          {doc.status === "approved" && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {doc.status === "rejected" && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          {doc.status === "pending" && (
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Uploaded: {doc.uploadDate} • {doc.fileSize}
                        </p>
                        {doc.rejectionComment && (
                          <p className="text-xs text-red-600 mb-2 line-clamp-2">
                            "{doc.rejectionComment}"
                          </p>
                        )}
                        <div
                          className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-center transition-colors ${
                            doc.status === "pending"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          <Eye className="w-4 h-4 inline mr-1" />
                          {doc.status === "pending" ? "Review Document" : "View Document"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedStudent && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-hidden" onClick={() => setShowReviewModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="px-6 py-6 bg-blue-600">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">
                      Document Review
                    </h2>
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="text-white hover:text-blue-100"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-sm text-blue-100 mt-2">{selectedDocument.name}</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Student Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Student Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900">{selectedStudent.studentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{selectedStudent.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Upload Date:</span>
                        <span className="font-medium text-gray-900">{selectedDocument.data.uploadDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Preview */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Document Preview</h3>
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

                  {/* Rejection Comment */}
                  {selectedDocument.data.status === "pending" && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Rejection Reason <span className="text-red-600">*</span>
                        <span className="text-xs font-normal text-gray-500 ml-2">(Required when rejecting)</span>
                      </label>
                      <textarea
                        value={rejectionComment}
                        onChange={(e) => setRejectionComment(e.target.value)}
                        placeholder="Explain clearly why this document is being rejected (e.g., 'Photo is blurry and text is not readable', 'Wrong document uploaded - this is not a PSA Birth Certificate', 'Document appears to be edited/tampered')..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 The student will receive this message and can reupload the correct document.
                      </p>
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          <strong>Best Practices:</strong> Be specific and constructive. Explain what's wrong and what the student needs to do to fix it.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Current Status */}
                  {selectedDocument.data.status !== "pending" && (
                    <div className={`p-4 rounded-lg border-2 mb-4 ${ 
                      selectedDocument.data.status === "approved"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}>
                      <p className="text-sm font-semibold mb-1">
                        Status: {selectedDocument.data.status.toUpperCase()}
                      </p>
                      {selectedDocument.data.rejectionComment && (
                        <p className="text-sm text-gray-700">
                          Comment: {selectedDocument.data.rejectionComment}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Change Status Section for Non-Pending */}
                  {selectedDocument.data.status !== "pending" && (
                    <div className="border border-gray-300 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Change Status</h3>
                      <p className="text-xs text-gray-600 mb-3">
                        You can change the status of this document if needed
                      </p>
                      {selectedDocument.data.status === "rejected" && (
                        <textarea
                          value={rejectionComment}
                          onChange={(e) => setRejectionComment(e.target.value)}
                          placeholder="Update rejection reason (optional)..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm mb-2"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                {selectedDocument.data.status === "pending" && (
                  <div className="border-t border-gray-200 p-6">
                    <div className="flex gap-3">
                      <button
                        onClick={handleRejectDocument}
                        className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        Reject Document
                      </button>
                      <button
                        onClick={handleApproveDocument}
                        className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Approve Document
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Footer Actions for Approved/Rejected Documents */}
                {selectedDocument.data.status !== "pending" && (
                  <div className="border-t border-gray-200 p-6">
                    <div className="flex gap-3">
                      {selectedDocument.data.status === "approved" && (
                        <button
                          onClick={handleRejectDocument}
                          className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                          Change to Rejected
                        </button>
                      )}
                      {selectedDocument.data.status === "rejected" && (
                        <button
                          onClick={handleApproveDocument}
                          className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          Change to Approved
                        </button>
                      )}
                      <button
                        onClick={() => setShowReviewModal(false)}
                        className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}