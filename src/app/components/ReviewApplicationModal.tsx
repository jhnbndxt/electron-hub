import React, { useState } from 'react';
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
  CheckSquare,
  Square,
  Eye as PreviewIcon,
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
  documentRejectionComment: string;
  setDocumentRejectionComment: React.Dispatch<React.SetStateAction<string>>;
  handleViewDocument: (key: string) => void;
  handleApproveDocument: () => void;
  handleRejectDocument: () => void;
  handleBackToDocuments: () => void;
  handleFinalApprove: () => void;
  handleRejectApplication: () => void;
  documentNames: Record<string, string>;
  showFormData: boolean;
  setShowFormData: React.Dispatch<React.SetStateAction<boolean>>;
  // New props for bulk operations
  selectedDocuments: string[];
  setSelectedDocuments: React.Dispatch<React.SetStateAction<string[]>>;
  handleBulkApprove: (documentKeys: string[]) => void;
  handleApproveFromTable: (docKey: string) => void;
}

const ReviewApplicationModal: React.FC<ReviewApplicationModalProps> = ({
  isOpen,
  onClose,
  reviewingStudent,
  documentRejectionComment,
  setDocumentRejectionComment,
  handleViewDocument,
  handleApproveDocument,
  handleRejectDocument,
  handleBackToDocuments,
  handleFinalApprove,
  handleRejectApplication,
  documentNames,
  showFormData,
  setShowFormData,
  // New props for bulk operations
  selectedDocuments,
  setSelectedDocuments,
  handleBulkApprove,
  handleApproveFromTable,
}) => {
  // State for rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingDocument, setRejectingDocument] = useState<{ key: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  // State for document display
  const [displayedDocument, setDisplayedDocument] = useState<{ key: string; name: string; data: DocumentData } | null>(null);

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

  // Handlers for bulk operations
  const handleSelectDocument = (docKey: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docKey)
        ? prev.filter(key => key !== docKey)
        : [...prev, docKey]
    );
  };

  const handleSelectAll = () => {
    const pendingDocs = docKeys.filter(key => docs[key].status === "pending");
    setSelectedDocuments(prev =>
      prev.length === pendingDocs.length ? [] : pendingDocs
    );
  };

  const handleBulkApproveSelected = () => {
    if (selectedDocuments.length === 0) return;
    handleBulkApprove(selectedDocuments);
    setSelectedDocuments([]);
  };

  // Handler for quick preview
  const handleQuickPreview = (docKey: string) => {
    const doc = docs[docKey];
    setPreviewDocument({
      key: docKey,
      name: documentNames[docKey] || docKey,
      data: doc,
    });
  };

  // Handler for approve from table
  const handleApproveFromTableLocal = (docKey: string) => {
    handleApproveFromTable(docKey);
  };

  // Handler for reject from table
  const handleRejectFromTable = (docKey: string) => {
    const doc = docs[docKey];
    setRejectingDocument({
      key: docKey,
      name: documentNames[docKey] || docKey,
    });
    setRejectReason("");
    setShowRejectModal(true);
  };

  // Handler for confirming rejection
  const handleConfirmReject = () => {
    if (!rejectingDocument || !rejectReason.trim()) return;

    // Update local state first
    setReviewingStudent((prev: any) => ({
      ...prev,
      enrollment_documents: prev.enrollment_documents?.map((doc: any) =>
        doc.document_type === rejectingDocument.key
          ? { ...doc, status: "rejected", rejection_comment: rejectReason.trim() }
          : doc
      ),
    }));

    // Call the parent's reject handler
    handleViewDocument(rejectingDocument.key);
    setDocumentRejectionComment(rejectReason.trim());
    setTimeout(() => handleRejectDocument(), 100);

    setShowRejectModal(false);
    setRejectingDocument(null);
    setRejectReason("");
  };

  // Handler for row click to display document
  const handleRowClick = (docKey: string) => {
    const doc = docs[docKey];
    setDisplayedDocument({
      key: docKey,
      name: documentNames[docKey] || docKey,
      data: doc,
    });
  };

  // Handler for hover preview
  const handleHoverPreview = (docKey: string, show: boolean) => {
    // Hover preview removed as requested
  };

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

            {/* Document Table */}
            {!displayedDocument ? (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Bulk Actions Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSelectAll}
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 bg-white px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {selectedDocuments.length === docKeys.filter(key => docs[key].status === "pending").length && docKeys.filter(key => docs[key].status === "pending").length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                      Select All Pending
                    </button>
                    {selectedDocuments.length > 0 && (
                      <button
                        onClick={handleBulkApproveSelected}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve Selected ({selectedDocuments.length})
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedDocuments.length} of {docKeys.filter(key => docs[key].status === "pending").length} pending selected
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Select
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {docKeys.map((key) => {
                        const doc = docs[key];
                        const isPending = doc.status === "pending";
                        const isProcessed = doc.status === "approved" || doc.status === "rejected";
                        const isImage = doc.fileUrl && doc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        return (
                          <tr
                            key={key}
                            className={`hover:bg-gray-50 cursor-pointer ${isProcessed ? 'cursor-default' : ''}`}
                            onClick={() => !isProcessed && handleRowClick(key)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              {isPending ? (
                                <button
                                  onClick={() => handleSelectDocument(key)}
                                  className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                                >
                                  {selectedDocuments.includes(key) ? (
                                    <CheckSquare className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Square className="h-4 w-4 text-gray-400" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-6 h-6"></div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {documentNames[key] || key}
                                  </div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {doc.fileName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                doc.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : doc.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {doc.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {doc.uploadDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                {isPending ? (
                                  <>
                                    <button
                                      onClick={() => handleApproveFromTableLocal(key)}
                                      className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleRejectFromTable(key)}
                                      className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                                    >
                                      <XCircle className="h-3 w-3" />
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-gray-400 text-xs">
                                    {doc.status === "approved" ? "Approved" : "Rejected"}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Document detail</p>
                    <h3 className="mt-1 text-xl font-semibold text-gray-900">{displayedDocument.name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-full px-3 py-2 text-sm font-semibold ${
                      displayedDocument.data.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : displayedDocument.data.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {displayedDocument.data.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => setDisplayedDocument(null)}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                      Back to Documents
                    </button>
                  </div>
                </div>

                {/* Status Lock Alert */}
                {(displayedDocument.data.status === "approved" || displayedDocument.data.status === "rejected") && (
                  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">🔒</div>
                    <div>
                      <p className="font-semibold text-yellow-800">Document is Locked</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        {displayedDocument.data.status === "approved"
                          ? "This document has been approved and cannot be changed. Further actions are disabled to prevent accidental modifications."
                          : "This document has been rejected. The student must upload a new replacement file to reopen it for review. Your review decision will be locked."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">Document preview</p>
                      <p className="mt-1 text-xs text-gray-500">Review the file before making a decision.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-950 p-4">
                      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-gray-950 flex items-center justify-center">
                        {displayedDocument.data.fileUrl ? (
                          displayedDocument.data.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              src={displayedDocument.data.fileUrl}
                              alt={displayedDocument.name}
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
                          <span className="truncate text-right text-gray-900">{displayedDocument.data.fileName}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-medium text-gray-700">Uploaded</span>
                          <span className="text-gray-900">{displayedDocument.data.uploadDate}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-medium text-gray-700">Status</span>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            displayedDocument.data.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : displayedDocument.data.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {displayedDocument.data.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {displayedDocument.data.rejectionComment && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-900 mb-3">Rejection reason</p>
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                          <p className="text-sm text-red-600">{displayedDocument.data.rejectionComment}</p>
                        </div>
                      </div>
                    )}

                    {displayedDocument.data.status === "pending" && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-900 mb-3">Actions</p>
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => handleApproveFromTableLocal(displayedDocument.key)}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve Document
                          </button>
                          <button
                            onClick={() => handleRejectFromTable(displayedDocument.key)}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject Document
                          </button>
                        </div>
                      </div>
                    )}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleRejectApplication}
                className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition bg-red-600 hover:bg-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Application
              </button>
              <button
                type="button"
                onClick={handleFinalApprove}
                disabled={!allDocumentsApproved}
                className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition ${allDocumentsApproved ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Application
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && rejectingDocument && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-200">
            {/* Rejection Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100 px-6 py-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.24em] text-red-500">Reject Document</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">{rejectingDocument.name}</h3>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                aria-label="Close rejection modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Rejection Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Please provide a reason for rejecting this document. This will be sent to the student.
                </p>
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500"
                autoFocus
              />

              {/* Rejection Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewApplicationModal;