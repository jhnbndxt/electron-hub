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
  handleFinalApprove: () => void;
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
  handleFinalApprove,
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
  const allDocumentsApproved = docKeys.length > 0 && docKeys.every((key) => docs[key].status === "approved");

  // Get form data for enrollment form display
  const getFormData = () => {
    if (reviewingStudent.formData) return reviewingStudent.formData;
    const rawFormData = reviewingStudent.enrollmentData?.form_data;
    if (!rawFormData) return null;
    if (typeof rawFormData === "string") {
      try {
        return JSON.parse(rawFormData);
      } catch {
        return null;
      }
    }
    return rawFormData;
  };

  const formData = getFormData();

  const formatBool = (value: boolean | undefined) => (value ? "Yes" : "No");
  const guardianSourceLabel = formData?.guardianSource === "father"
    ? "Same as Father"
    : formData?.guardianSource === "mother"
    ? "Same as Mother"
    : formData?.guardianSource || "N/A";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative flex w-full max-w-[min(1100px,92vw)] max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Review application</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Document Verification</h2>
            <p className="mt-1 text-sm text-gray-600">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
            aria-label="Close document review modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 py-5">
            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Total documents</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900">{docKeys.length}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Approved</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900">{approved}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Pending / rejected</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900">{docKeys.length - approved}</p>
              </div>
            </div>

            {/* Enrollment Form Section */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
              <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Form Details</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Admission Type:</span> <span className="font-medium">{formData.admissionType}</span></div>
                      <div><span className="text-gray-500">Previous Student ID:</span> <span className="font-medium">{formData.previousStudentId || 'N/A'}</span></div>
                      <div><span className="text-gray-500">LRN:</span> <span className="font-medium">{formData.lrn}</span></div>
                      <div><span className="text-gray-500">Full Name:</span> <span className="font-medium">{`${formData.lastName || ''}, ${formData.firstName || ''} ${formData.middleName || ''}`.trim()}</span></div>
                      <div><span className="text-gray-500">Suffix:</span> <span className="font-medium">{formData.suffix || 'None'}</span></div>
                      <div><span className="text-gray-500">Sex:</span> <span className="font-medium">{formData.sex}</span></div>
                      <div><span className="text-gray-500">Civil Status:</span> <span className="font-medium">{formData.civilStatus}</span></div>
                      <div><span className="text-gray-500">Religion:</span> <span className="font-medium">{formData.religion}</span></div>
                      <div><span className="text-gray-500">Nationality:</span> <span className="font-medium">{formData.nationality}</span></div>
                      <div><span className="text-gray-500">Disability:</span> <span className="font-medium">{formData.disability}{formData.disability === 'Others' && formData.disabilityOther ? ` — ${formData.disabilityOther}` : ''}</span></div>
                      <div><span className="text-gray-500">Indigenous Group:</span> <span className="font-medium">{formData.indigenousGroup}{formData.indigenousGroup === 'Others' && formData.indigenousGroupOther ? ` — ${formData.indigenousGroupOther}` : ''}</span></div>
                      <div><span className="text-gray-500">Birthday:</span> <span className="font-medium">{formData.birthday}</span></div>
                      <div><span className="text-gray-500">Email:</span> <span className="font-medium">{formData.email}</span></div>
                      <div><span className="text-gray-500">Contact Number:</span> <span className="font-medium">{formData.contactNumber}</span></div>
                      <div><span className="text-gray-500">Facebook / Messenger:</span> <span className="font-medium">{formData.facebookName}</span></div>
                      <div><span className="text-gray-500">Working Student:</span> <span className="font-medium">{formatBool(formData.isWorkingStudent)}</span></div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="pt-3 border-t border-gray-300/50">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Address</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Region:</span> <span className="font-medium">{formData.region}</span></div>
                      <div><span className="text-gray-500">Province:</span> <span className="font-medium">{formData.province || 'N/A'}</span></div>
                      <div><span className="text-gray-500">City / Municipality:</span> <span className="font-medium">{formData.city}</span></div>
                      <div><span className="text-gray-500">Barangay:</span> <span className="font-medium">{formData.barangay}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Home Address:</span> <span className="font-medium">{formData.homeAddress}</span></div>
                    </div>
                  </div>

                  {/* Parents and Guardian */}
                  <div className="pt-3 border-t border-gray-300/50">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Parents & Guardian</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Father's Name:</span> <span className="font-medium">{`${formData.fatherLastName || ''}, ${formData.fatherFirstName || ''} ${formData.fatherMiddleName || ''}`.trim()}</span></div>
                      <div><span className="text-gray-500">Father's Occupation:</span> <span className="font-medium">{formData.fatherOccupation}</span></div>
                      <div><span className="text-gray-500">Father's Contact:</span> <span className="font-medium">{formData.fatherContact}</span></div>
                      <div><span className="text-gray-500">Mother's Maiden Name:</span> <span className="font-medium">{formData.motherMaidenName}</span></div>
                      <div><span className="text-gray-500">Mother's Name:</span> <span className="font-medium">{`${formData.motherLastName || ''}, ${formData.motherFirstName || ''} ${formData.motherMiddleName || ''}`.trim()}</span></div>
                      <div><span className="text-gray-500">Mother's Occupation:</span> <span className="font-medium">{formData.motherOccupation}</span></div>
                      <div><span className="text-gray-500">Mother's Contact:</span> <span className="font-medium">{formData.motherContact}</span></div>
                      <div><span className="text-gray-500">Guardian Relationship:</span> <span className="font-medium">{guardianSourceLabel}</span></div>
                      <div><span className="text-gray-500">Guardian Name:</span> <span className="font-medium">{`${formData.guardianLastName || ''}, ${formData.guardianFirstName || ''} ${formData.guardianMiddleName || ''}`.trim() || 'N/A'}</span></div>
                      <div><span className="text-gray-500">Guardian Occupation:</span> <span className="font-medium">{formData.guardianOccupation || 'N/A'}</span></div>
                      <div><span className="text-gray-500">Guardian Contact:</span> <span className="font-medium">{formData.guardianContact || 'N/A'}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">4Ps Member:</span> <span className="font-medium">{formatBool(formData.is4PsMember)}</span></div>
                    </div>
                  </div>

                  {/* Enrollment Information */}
                  <div className="pt-3 border-t border-gray-300/50">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Enrollment Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Preferred Track:</span> <span className="font-medium">{formData.preferredTrack}</span></div>
                      <div><span className="text-gray-500">Elective 1:</span> <span className="font-medium">{formData.elective1}</span></div>
                      <div><span className="text-gray-500">Elective 2:</span> <span className="font-medium">{formData.elective2}</span></div>
                      <div><span className="text-gray-500">Year Level:</span> <span className="font-medium">{formData.yearLevel}</span></div>
                    </div>
                  </div>

                  {/* Educational Background */}
                  <div className="pt-3 border-t border-gray-300/50">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Educational Background</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Primary School:</span> <span className="font-medium">{formData.primarySchool}</span></div>
                      <div><span className="text-gray-500">Year Graduated:</span> <span className="font-medium">{formData.primaryYearGraduated}</span></div>
                      <div><span className="text-gray-500">Secondary School:</span> <span className="font-medium">{formData.secondarySchool}</span></div>
                      <div><span className="text-gray-500">Year Graduated:</span> <span className="font-medium">{formData.secondaryYearGraduated}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Grade 10 Adviser:</span> <span className="font-medium">{formData.grade10Adviser || 'N/A'}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Section */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
                    <div key={key} className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
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
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">Document preview</p>
                      <p className="mt-1 text-xs text-gray-500">Review the file before making a decision.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-950 p-4">
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
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Rejection reason</p>
                      <textarea
                        value={documentRejectionComment}
                        onChange={(e) => setDocumentRejectionComment(e.target.value)}
                        placeholder="Explain why this document is being rejected..."
                        rows={4}
                        className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleBackToDocuments}
                    className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
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
        <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm font-medium ${allDocumentsApproved ? 'text-green-700' : 'text-gray-500'}`}>
              {allDocumentsApproved
                ? 'All documents approved. Ready for final approval.'
                : 'Approve all documents first to continue.'}
            </p>
            <button
              type="button"
              onClick={handleFinalApprove}
              disabled={!allDocumentsApproved}
              className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition ${allDocumentsApproved ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
            >
              Approve Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewApplicationModal;