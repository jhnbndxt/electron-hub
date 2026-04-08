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
  Loader,
} from "lucide-react";
import { supabase } from "../../services/supabaseClient";

interface StudentDocument {
  studentId: string;
  email: string;
  studentName: string;
  documents: {
    [key: string]: {
      id: string;
      status: "pending" | "approved" | "rejected";
      uploadDate: string;
      fileName: string;
      fileUrl: string;
      documentType: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadStudentDocuments();
  }, []);

  const loadStudentDocuments = async () => {
    setIsLoading(true);
    try {
      // Get all enrollments with documents
      const { data: enrollments, error } = await supabase
        .from("enrollments")
        .select("id, email, student_name, status")
        .neq("status", "rejected")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!enrollments) {
        setStudents([]);
        setIsLoading(false);
        return;
      }

      // Get documents for each enrollment
      const studentsWithDocuments: StudentDocument[] = [];

      for (const enrollment of enrollments) {
        const { data: documents, error: docError } = await supabase
          .from("enrollment_documents")
          .select("id, document_type, file_url, status, rejection_reason, created_at")
          .eq("enrollment_id", enrollment.id);

        if (docError) throw docError;

        if (documents && documents.length > 0) {
          const documentsMap: any = {};

          documents.forEach((doc) => {
            documentsMap[doc.document_type] = {
              id: doc.id,
              status: doc.status,
              uploadDate: new Date(doc.created_at).toLocaleDateString(),
              fileName: doc.file_url.split("/").pop() || "document",
              fileUrl: doc.file_url,
              documentType: doc.document_type,
              rejectionComment: doc.rejection_reason || undefined,
            };
          });

          studentsWithDocuments.push({
            studentId: enrollment.id,
            email: enrollment.email,
            studentName: enrollment.student_name,
            documents: documentsMap,
          });
        }
      }

      setStudents(studentsWithDocuments);
    } catch (error) {
      console.error("Error loading documents:", error);
      alert("Failed to load documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const documentNames: Record<string, string> = {
    psa_birth_certificate: "PSA Birth Certificate",
    form_138: "Form 138 (Report Card)",
    form_137: "Form 137",
    good_moral: "Good Moral Certificate",
    id_picture: "2x2 ID Picture",
    diploma: "Grade 10 Diploma",
    birth_certificate: "PSA Birth Certificate",
    report_card: "Form 138 (Report Card)",
    moral_certificate: "Good Moral Certificate",
    valid_id: "2x2 ID Picture",
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

  const handleApproveDocument = async () => {
    if (!selectedStudent || !selectedDocument) return;

    setIsSaving(true);
    try {
      const docId = selectedDocument.data.id;

      // Update document status in database
      const { error } = await supabase
        .from("enrollment_documents")
        .update({ status: "approved", rejection_reason: null })
        .eq("id", docId);

      if (error) throw error;

      // Create audit log
      const { data: user } = await supabase.auth.getUser();
      if (user?.user?.email) {
        await supabase.from("audit_logs").insert({
          admin_id: user.user.email,
          action: "document_approved",
          details: {
            enrollment_id: selectedStudent.studentId,
            document_type: selectedDocument.key,
            document_name: selectedDocument.name,
          },
        });
      }

      // Check if all documents for this enrollment are approved
      const { data: allDocs } = await supabase
        .from("enrollment_documents")
        .select("status")
        .eq("enrollment_id", selectedStudent.studentId);

      const allApproved = allDocs?.every((doc) => doc.status === "approved");

      if (allApproved) {
        // Update enrollment status to documents_verified
        await supabase
          .from("enrollments")
          .update({ status: "documents_verified" })
          .eq("id", selectedStudent.studentId);
      }

      // Reload and close
      await loadStudentDocuments();
      setShowReviewModal(false);
      setSelectedStudent(null);
      setSelectedDocument(null);
      setRejectionComment("");
    } catch (error) {
      console.error("Error approving document:", error);
      alert("Failed to approve document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectDocument = async () => {
    if (!selectedStudent || !selectedDocument) return;

    if (!rejectionComment.trim()) {
      alert("❌ Rejection reason is required. Please provide a clear explanation.");
      return;
    }

    if (rejectionComment.trim().length < 10) {
      alert("❌ Please provide a more detailed rejection reason (at least 10 characters).");
      return;
    }

    setIsSaving(true);
    try {
      const docId = selectedDocument.data.id;

      // Update document status to rejected
      const { error } = await supabase
        .from("enrollment_documents")
        .update({
          status: "rejected",
          rejection_reason: rejectionComment.trim(),
        })
        .eq("id", docId);

      if (error) throw error;

      // Create audit log
      const { data: user } = await supabase.auth.getUser();
      if (user?.user?.email) {
        await supabase.from("audit_logs").insert({
          admin_id: user.user.email,
          action: "document_rejected",
          details: {
            enrollment_id: selectedStudent.studentId,
            document_type: selectedDocument.key,
            document_name: selectedDocument.name,
            rejection_reason: rejectionComment.trim(),
          },
        });
      }

      // Create notification for student
      await supabase.from("notifications").insert({
        user_id: selectedStudent.email,
        type: "document_rejected",
        title: "Document Rejected",
        message: `Your ${selectedDocument.name} has been rejected. Reason: ${rejectionComment.trim()}`,
        read: false,
      });

      // Reload and close
      await loadStudentDocuments();
      setShowReviewModal(false);
      setSelectedStudent(null);
      setSelectedDocument(null);
      setRejectionComment("");
      alert(`✅ Document rejected. The student has been notified with your feedback.`);
    } catch (error) {
      console.error("Error rejecting document:", error);
      alert("Failed to reject document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Verification</h1>
        <p className="text-gray-600">Review and approve student document submissions from Supabase</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading documents...</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Documents</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {students.reduce((sum, student) => {
                      return sum + Object.values(student.documents).filter((doc: any) => doc.status === "pending").length;
                    }, 0)}
                  </p>
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
                              {documentNames[key] || key}
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
                          Uploaded: {doc.uploadDate}
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
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      {selectedDocument.data.fileUrl ? (
                        <div className="p-4">
                          <img
                            src={selectedDocument.data.fileUrl}
                            alt={selectedDocument.name}
                            className="w-full h-auto max-h-96 object-contain rounded"
                            onError={(e) => {
                              console.error("Failed to load image:", selectedDocument.data.fileUrl);
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
                            }}
                          />
                          <a
                            href={selectedDocument.data.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download Original
                          </a>
                        </div>
                      ) : (
                        <div className="p-12 text-center text-gray-500">
                          <FileText className="w-16 h-16 mx-auto mb-2 opacity-30" />
                          <p>No document preview available</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      File: {selectedDocument.data.fileName}
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
                        disabled={isSaving}
                        className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                        Reject Document
                      </button>
                      <button
                        onClick={handleApproveDocument}
                        disabled={isSaving}
                        className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSaving && <Loader className="w-4 h-4 animate-spin" />}
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
                          disabled={isSaving}
                          className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                          Change to Rejected
                        </button>
                      )}
                      {selectedDocument.data.status === "rejected" && (
                        <button
                          onClick={handleApproveDocument}
                          disabled={isSaving}
                          className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                          Change to Approved
                        </button>
                      )}
                      <button
                        onClick={() => setShowReviewModal(false)}
                        disabled={isSaving}
                        className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
        </>
      )}
    </div>
  );
}