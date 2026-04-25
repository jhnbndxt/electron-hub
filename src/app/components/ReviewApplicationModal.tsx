import React from 'react';
import {
  X,
  Eye,
  FileCheck,
  FileText,
  Image as ImageIcon,
  UserCircle,
  CheckCircle,
  BookOpen,
  AlertCircle,
  XCircle,
} from "lucide-react";

interface DocumentData {
  id: string;
  status: string;
  uploadDate: string;
  fileName: string;
  fileUrl: string | null;
  rejectionComment: string;
}

interface SelectedDocument {
  name: string;
  data: DocumentData;
}

interface ReviewingStudent {
  id?: number | string;
  studentName?: string;
  name?: string;
  email?: string;
  enrollment_documents?: any[];
  formData?: any;
  enrollmentData?: any;
}

interface ReviewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewingStudent: ReviewingStudent | null;
  selectedDocument: SelectedDocument | null;
  documentRejectionComment: string;
  setDocumentRejectionComment: React.Dispatch<React.SetStateAction<string>>;
  handleViewDocument: (key: string) => void;
  handleApproveDocument: () => void;
  handleRejectDocument: () => void;
  handleBackToDocuments: () => void;
  documentNames: Record<string, string>;
  showFormData: boolean;
  setShowFormData: React.Dispatch<React.SetStateAction<boolean>>;
}

const ReviewApplicationModal: React.FC<ReviewApplicationModalProps> = ({
  isOpen,
  onClose,
  reviewingStudent,
  selectedDocument,
  documentRejectionComment,
  setDocumentRejectionComment,
  handleViewDocument,
  handleApproveDocument,
  handleRejectDocument,
  handleBackToDocuments,
  documentNames,
  showFormData,
  setShowFormData,
}) => {
  if (!isOpen || !reviewingStudent) return null;

  // Get student name from either field
  const studentName = reviewingStudent.studentName || reviewingStudent.name || 'Unknown Student';

  // Get enrollment documents
  const enrollmentDocs = reviewingStudent.enrollment_documents || [];

  // Transform documents for display
  const docs: Record<string, any> = {};
  enrollmentDocs.forEach((d: any) => {
    docs[d.document_type] = {
      id: d.id,
      status: d.status || "pending",
      uploadDate: d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : "—",
      fileName: (d.file_path || d.file_url || "").split("/").pop() || "document",
      fileUrl: d.file_path || d.file_url || null,
      rejectionComment: d.rejection_comment || d.rejection_reason || "",
    };
  });

  const docKeys = Object.keys(docs);
  const approved = docKeys.filter((k) => docs[k].status === "approved").length;

  // Get form data for enrollment form display
  const getFormData = () => {
    if (reviewingStudent.formData) return reviewingStudent.formData;
    if (reviewingStudent.enrollmentData?.form_data) return reviewingStudent.enrollmentData.form_data;
    return null;
  };

  const formData = getFormData();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with glassmorphism */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(20px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/20 bg-gradient-to-r from-blue-600/20 to-red-600/20 px-6 py-5 backdrop-blur-sm">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">Review application</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Document Verification</h2>
            <p className="mt-1 text-sm text-white/80">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20 backdrop-blur-sm"
            aria-label="Close document review modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="px-6 py-5">
            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/30 bg-white/50 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-600">Total documents</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900">{docKeys.length}</p>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/50 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-600">Approved</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900">{approved}</p>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/50 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-600">Pending / rejected</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900">{docKeys.length - approved}</p>
              </div>
            </div>

            {/* Enrollment Form Section */}
            <div className="mb-6 rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Enrollment form</p>
                  <p className="mt-1 text-sm text-gray-500">Review the student's submitted enrollment details.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormData(!showFormData)}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4" />
                  View enrollment form
                </button>
              </div>
            </div>

            {/* Enrollment Form Data */}
            {showFormData && formData && (
              <div className="mb-6 rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Form Details</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Full Name:</span> <span className="font-medium">{formData.firstName} {formData.middleName} {formData.lastName}</span></div>
                      <div><span className="text-gray-500">LRN:</span> <span className="font-medium">{formData.lrn}</span></div>
                      <div><span className="text-gray-500">Sex:</span> <span className="font-medium">{formData.sex}</span></div>
                      <div><span className="text-gray-500">Birthday:</span> <span className="font-medium">{formData.birthday}</span></div>
                      <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{formData.contactNumber}</span></div>
                      <div><span className="text-gray-500">Email:</span> <span className="font-medium">{formData.email}</span></div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="pt-3 border-t border-gray-300/50">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Address</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Region:</span> <span className="font-medium">{formData.region}</span></div>
                      <div><span className="text-gray-500">Province:</span> <span className="font-medium">{formData.province || 'N/A'}</span></div>
                      <div><span className="text-gray-500">City:</span> <span className="font-medium">{formData.city}</span></div>
                      <div><span className="text-gray-500">Barangay:</span> <span className="font-medium">{formData.barangay}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Home Address:</span> <span className="font-medium">{formData.homeAddress}</span></div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="pt-3 border-t border-gray-300/50">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Academic Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Preferred Track:</span> <span className="font-medium">{formData.preferredTrack}</span></div>
                      <div><span className="text-gray-500">School Year:</span> <span className="font-medium">{formData.schoolYear}</span></div>
                      <div><span className="text-gray-500">Grade Level:</span> <span className="font-medium">{formData.gradeLevel}</span></div>
                      <div><span className="text-gray-500">School Name:</span> <span className="font-medium">{formData.schoolName}</span></div>
                    </div>
                  </div>

                  {/* Guardian Information */}
                  <div className="pt-3 border-t border-gray-300/50">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Guardian Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Guardian Name:</span> <span className="font-medium">{formData.guardianName}</span></div>
                      <div><span className="text-gray-500">Relationship:</span> <span className="font-medium">{formData.guardianRelationship}</span></div>
                      <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{formData.guardianContact}</span></div>
                      <div><span className="text-gray-500">Address:</span> <span className="font-medium">{formData.guardianAddress}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Section */}
            <div className="mb-6 rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Overall progress</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {approved} of {docKeys.length} documents approved
                  </p>
                </div>
                {approved === docKeys.length && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-2 text-sm font-semibold text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    All documents approved
                  </span>
                )}
              </div>
            </div>

            {/* Document Grid or Selected Document */}
            {!selectedDocument ? (
              <div className="grid gap-4 md:grid-cols-2">
                {docKeys.map((key) => {
                  const doc = docs[key];
                  return (
                    <div key={key} className="flex h-full flex-col justify-between rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-sm transition hover:shadow-md">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{documentNames[key] || key}</p>
                            <p className="mt-2 text-xs text-gray-500">Uploaded {doc.uploadDate}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            doc.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : doc.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {doc.status.toUpperCase()}
                          </span>
                        </div>
                        {doc.rejectionComment && (
                          <p className="text-sm text-red-700">{doc.rejectionComment}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewDocument(key)}
                        className="mt-4 inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        Review document
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Document detail</p>
                    <h3 className="mt-1 text-xl font-semibold text-gray-900">{selectedDocument.name}</h3>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-2 text-sm font-semibold ${
                    selectedDocument.data.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : selectedDocument.data.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedDocument.data.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">Document preview</p>
                      <p className="mt-1 text-xs text-gray-500">Review the file before making a decision.</p>
                    </div>
                    <div className="rounded-2xl border border-white/30 bg-gray-950 p-4">
                      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-gray-950 flex items-center justify-center">
                        {selectedDocument.data.fileUrl ? (
                          selectedDocument.data.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              src={selectedDocument.data.fileUrl}
                              alt={selectedDocument.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="text-center p-6">
                              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                              <p className="text-sm text-gray-400">Document preview not available.</p>
                            </div>
                          )
                        ) : (
                          <p className="text-sm text-gray-400">No preview available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
                      <p className="text-sm font-semibold text-gray-900 mb-4">Document information</p>
                      <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex justify-between gap-4">
                          <span className="font-medium text-gray-700">File name</span>
                          <span className="truncate text-right text-gray-900">{selectedDocument.data.fileName}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-medium text-gray-700">Uploaded</span>
                          <span className="text-gray-900">{selectedDocument.data.uploadDate}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-medium text-gray-700">Status</span>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedDocument.data.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : selectedDocument.data.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {selectedDocument.data.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Rejection reason</p>
                      <textarea
                        value={documentRejectionComment}
                        onChange={(e) => setDocumentRejectionComment(e.target.value)}
                        placeholder="Explain why this document is being rejected..."
                        rows={4}
                        className="w-full resize-none rounded-2xl border border-white/30 bg-white/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/30 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleBackToDocuments}
                    className="rounded-full border border-white/30 bg-white/50 px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-white/70 backdrop-blur-sm"
                  >
                    Back to documents
                  </button>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={handleRejectDocument}
                      className="min-w-[120px] rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleApproveDocument}
                      className="min-w-[120px] rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewApplicationModal;