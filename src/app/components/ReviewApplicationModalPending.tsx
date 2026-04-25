import React from 'react';
import {
  X,
  Eye,
  FileCheck,
  FileText,
  CheckCircle,
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
  studentName: string;
  enrollment_documents?: any[];
}

interface ReviewApplicationModalPendingProps {
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
}

const ReviewApplicationModalPending: React.FC<ReviewApplicationModalPendingProps> = ({
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
}) => {
  if (!isOpen || !reviewingStudent) return null;

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

      {/* Modal Container */}
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/20 shadow-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex flex-col gap-4 border-b border-white/20 bg-white/50 px-6 py-5 sm:flex-row sm:items-start sm:justify-between backdrop-blur-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(239, 68, 68, 0.1))',
          }}
        >
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-600">Review application</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Document Verification</h2>
            <p className="mt-1 text-sm text-gray-600">{reviewingStudent.studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-gray-700 transition hover:bg-white/20 bg-white/20"
            aria-label="Close document review modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/30 bg-white/50 p-4 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-600">Total documents</p>
            <p className="mt-3 text-2xl font-semibold text-gray-900">{reviewingStudent.enrollment_documents?.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/50 p-4 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-600">Approved</p>
            <p className="mt-3 text-2xl font-semibold text-gray-900">
              {(() => {
                const docs: any[] = reviewingStudent.enrollment_documents || [];
                return docs.filter((d) => d.status === "approved").length;
              })()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/50 p-4 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-600">Pending / rejected</p>
            <p className="mt-3 text-2xl font-semibold text-gray-900">
              {(() => {
                const docs: any[] = reviewingStudent.enrollment_documents || [];
                return docs.filter((d) => d.status !== "approved").length;
              })()}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 pb-6 pt-1 max-h-[calc(100vh-20rem)]">
          {(() => {
            const enrollmentDocs: any[] = reviewingStudent.enrollment_documents || [];
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

            if (docKeys.length === 0) {
              return (
                <div className="rounded-2xl border border-white/30 bg-white/50 p-8 text-center shadow-sm backdrop-blur-sm">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-base font-semibold text-gray-900">No documents uploaded yet</p>
                  <p className="mt-2 text-sm text-gray-500">This application has not submitted any files at this time.</p>
                </div>
              );
            }

            const approved = docKeys.filter((k) => docs[k].status === "approved").length;

            return (
              <>
                {/* Enrollment Form Section */}
                <div className="mb-6 rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Enrollment form</p>
                      <p className="mt-1 text-sm text-gray-500">Review the student's submitted enrollment details.</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                      View enrollment form
                    </button>
                  </div>
                </div>

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

                {!selectedDocument && (
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
                            className="mt-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Review document
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedDocument && (
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
                            className="w-full resize-none rounded-2xl border border-white/30 bg-white/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-white/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
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
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ReviewApplicationModalPending;