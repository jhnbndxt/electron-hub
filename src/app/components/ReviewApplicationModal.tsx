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
import DocumentViewerModal from './DocumentViewerModal';

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
  handleRejectDocument: (documentKey?: string, rejectionComment?: string) => void;
  handleBackToDocuments: () => void;
  handleFinalApprove: () => void;
  handleRejectApplication: () => void;
  documentNames: Record<string, string>;
  showFormData: boolean;
  setShowFormData: React.Dispatch<React.SetStateAction<boolean>>;
  setReviewingStudent: React.Dispatch<React.SetStateAction<ReviewingStudent | null>>;
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
  setReviewingStudent,
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
  // State for document viewer modal
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewedDocument, setViewedDocument] = useState<{ key: string; name: string; data: DocumentData } | null>(null);

  if (!isOpen || !reviewingStudent) return null;

  // Get student name from either field
  const studentName = reviewingStudent.studentName || reviewingStudent.name || 'Unknown Student';
  const studentEmail =
    reviewingStudent.email ||
    reviewingStudent.enrollmentData?.email ||
    reviewingStudent.enrollmentData?.user_email ||
    'No email provided';
  const studentId =
    reviewingStudent.id ||
    reviewingStudent.enrollmentData?.id ||
    reviewingStudent.enrollmentData?.enrollment_id ||
    '—';

  // Get enrollment documents
  const enrollmentDocs = reviewingStudent.enrollment_documents || [];

  // Transform documents for display
  const docs: Record<string, any> = {};
  enrollmentDocs.forEach((d: any) => {
    // Only set to pending if status is null/undefined, otherwise keep the actual status
    const status = d.status || "pending";
    docs[d.document_type] = {
      id: d.id,
      status: status,
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
    const selectableDocs = docKeys.filter(key => docs[key].status !== "approved");
    setSelectedDocuments(prev =>
      prev.length === selectableDocs.length ? [] : selectableDocs
    );
  };

  const handleBulkApproveSelected = () => {
    if (selectedDocuments.length === 0) return;
    handleBulkApprove(selectedDocuments);
    setSelectedDocuments([]);
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

    // Update local copy of the selected student's documents before sending the request.
    setReviewingStudent((prev: any) => ({
      ...prev,
      enrollment_documents: prev?.enrollment_documents?.map((doc: any) =>
        doc.document_type === rejectingDocument.key
          ? { ...doc, status: "rejected", rejection_comment: rejectReason.trim() }
          : doc
      ),
    }));

    handleRejectDocument(rejectingDocument.key, rejectReason.trim());

    setShowRejectModal(false);
    setRejectingDocument(null);
    setRejectReason("");
  };

  // Handler for row click to open document viewer
  const handleRowClick = (docKey: string) => {
    const doc = docs[docKey];
    setViewedDocument({
      key: docKey,
      name: documentNames[docKey] || docKey,
      data: doc,
    });
    setShowDocumentViewer(true);
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
    <div className="fixed inset-y-0 right-0 left-0 z-[9999] flex items-center justify-center p-4 lg:left-[var(--dashboard-sidebar-offset,0px)]">
      <div
        className="absolute inset-0 bg-white/35 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex w-full max-w-[min(1180px,96vw)] max-h-[94vh] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Review application</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Document Verification</h2>
            <p className="mt-1 text-sm text-slate-600">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close document review modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="grid min-h-0 gap-6 px-6 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">Applicant summary</p>
                <p className="mt-2 text-sm text-slate-600">Track student details, document progress, and approval requirements.</p>
              </div>

              <div className="space-y-3">
                <div className="rounded-[24px] bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Student ID</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{studentId}</p>
                </div>
                <div className="rounded-[24px] bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Email</p>
                  <p className="mt-2 text-base font-semibold text-slate-900 truncate">{studentEmail}</p>
                </div>
                <div className="rounded-[24px] bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Documents approved</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{approved} / {docKeys.length}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                  <p className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${allDocumentsApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {allDocumentsApproved ? 'Ready for final approval' : 'Pending review'}
                  </p>
                </div>
              </div>

              {formData && (
                <button
                  type="button"
                  onClick={() => setShowFormData(!showFormData)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4" />
                  {showFormData ? 'Hide enrollment form' : 'View enrollment form'}
                </button>
              )}
            </aside>

            <main className="space-y-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Document checklist</p>
                  <p className="mt-1 text-sm text-slate-500">Approve or reject each document before finalizing the application.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span>{docKeys.length} documents</span>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{approved} approved</span>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Bulk actions</p>
                    <p className="text-sm text-slate-500">Select multiple documents to approve them in one step.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                    >
                      {selectedDocuments.length === docKeys.filter(key => docs[key].status === 'pending' || docs[key].status === 'rejected').length && docKeys.filter(key => docs[key].status === 'pending' || docs[key].status === 'rejected').length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                      Select all pending/rejected
                    </button>
                    {selectedDocuments.length > 0 && (
                      <button
                        onClick={handleBulkApproveSelected}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve selected ({selectedDocuments.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.18em]">Select</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.18em]">Document</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.18em]">Status</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.18em]">Uploaded</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.18em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {docKeys.map((key) => {
                      const doc = docs[key];
                      return (
                        <tr key={key} className="hover:bg-slate-50">
                          <td className="px-4 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                            {doc.status !== 'approved' ? (
                              <button
                                onClick={() => handleSelectDocument(key)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-100"
                              >
                                {selectedDocuments.includes(key) ? (
                                  <CheckSquare className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Square className="h-4 w-4 text-slate-400" />
                                )}
                              </button>
                            ) : (
                              <div className="h-7 w-7" />
                            )}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <button
                              type="button"
                              onClick={() => handleRowClick(key)}
                              className="text-left"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-slate-400" />
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{documentNames[key] || key}</div>
                                  <div className="text-xs text-slate-500 truncate max-w-[16rem]">{doc.fileName}</div>
                                </div>
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              doc.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {doc.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-slate-500">{doc.uploadDate}</td>
                          <td className="px-4 py-4 align-top text-sm">
                            <div className="flex flex-wrap gap-2">
                              {doc.status !== 'approved' ? (
                                <>
                                  <button
                                    onClick={() => handleApproveFromTableLocal(key)}
                                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    {doc.status === 'rejected' ? 'Re-approve' : 'Approve'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectFromTable(key)}
                                    className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-500 text-xs">Approved</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {showFormData && formData && (
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Enrollment Form Details</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {/* Personal Information */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Personal Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-slate-500">Admission Type:</span> <span className="font-medium text-slate-900">{formData.admissionType}</span></div>
                        <div><span className="text-slate-500">Previous Student ID:</span> <span className="font-medium text-slate-900">{formData.previousStudentId || 'N/A'}</span></div>
                        <div><span className="text-slate-500">LRN:</span> <span className="font-medium text-slate-900">{formData.lrn}</span></div>
                        <div><span className="text-slate-500">Full Name:</span> <span className="font-medium text-slate-900">{`${formData.lastName || ''}, ${formData.firstName || ''} ${formData.middleName || ''}`.trim()}</span></div>
                        <div><span className="text-slate-500">Suffix:</span> <span className="font-medium text-slate-900">{formData.suffix || 'None'}</span></div>
                        <div><span className="text-slate-500">Sex:</span> <span className="font-medium text-slate-900">{formData.sex}</span></div>
                        <div><span className="text-slate-500">Civil Status:</span> <span className="font-medium text-slate-900">{formData.civilStatus}</span></div>
                        <div><span className="text-slate-500">Religion:</span> <span className="font-medium text-slate-900">{formData.religion}</span></div>
                        <div><span className="text-slate-500">Nationality:</span> <span className="font-medium text-slate-900">{formData.nationality}</span></div>
                        <div><span className="text-slate-500">Disability:</span> <span className="font-medium text-slate-900">{formData.disability}{formData.disability === 'Others' && formData.disabilityOther ? ` — ${formData.disabilityOther}` : ''}</span></div>
                        <div><span className="text-slate-500">Indigenous Group:</span> <span className="font-medium text-slate-900">{formData.indigenousGroup}{formData.indigenousGroup === 'Others' && formData.indigenousGroupOther ? ` — ${formData.indigenousGroupOther}` : ''}</span></div>
                        <div><span className="text-slate-500">Birthday:</span> <span className="font-medium text-slate-900">{formData.birthday}</span></div>
                        <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900">{formData.email}</span></div>
                        <div><span className="text-slate-500">Contact Number:</span> <span className="font-medium text-slate-900">{formData.contactNumber}</span></div>
                        <div><span className="text-slate-500">Facebook / Messenger:</span> <span className="font-medium text-slate-900">{formData.facebookName}</span></div>
                        <div><span className="text-slate-500">Working Student:</span> <span className="font-medium text-slate-900">{formatBool(formData.isWorkingStudent)}</span></div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-300/50">
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Address</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-slate-500">Region:</span> <span className="font-medium text-slate-900">{formData.region}</span></div>
                        <div><span className="text-slate-500">Province:</span> <span className="font-medium text-slate-900">{formData.province || 'N/A'}</span></div>
                        <div><span className="text-slate-500">City / Municipality:</span> <span className="font-medium text-slate-900">{formData.city}</span></div>
                        <div><span className="text-slate-500">Barangay:</span> <span className="font-medium text-slate-900">{formData.barangay}</span></div>
                        <div className="col-span-2"><span className="text-slate-500">Home Address:</span> <span className="font-medium text-slate-900">{formData.homeAddress}</span></div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-300/50">
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Parents & Guardian</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-slate-500">Father's Name:</span> <span className="font-medium text-slate-900">{`${formData.fatherLastName || ''}, ${formData.fatherFirstName || ''} ${formData.fatherMiddleName || ''}`.trim()}</span></div>
                        <div><span className="text-slate-500">Father's Occupation:</span> <span className="font-medium text-slate-900">{formData.fatherOccupation}</span></div>
                        <div><span className="text-slate-500">Father's Contact:</span> <span className="font-medium text-slate-900">{formData.fatherContact}</span></div>
                        <div><span className="text-slate-500">Mother's Maiden Name:</span> <span className="font-medium text-slate-900">{formData.motherMaidenName}</span></div>
                        <div><span className="text-slate-500">Mother's Name:</span> <span className="font-medium text-slate-900">{`${formData.motherLastName || ''}, ${formData.motherFirstName || ''} ${formData.motherMiddleName || ''}`.trim()}</span></div>
                        <div><span className="text-slate-500">Mother's Occupation:</span> <span className="font-medium text-slate-900">{formData.motherOccupation}</span></div>
                        <div><span className="text-slate-500">Mother's Contact:</span> <span className="font-medium text-slate-900">{formData.motherContact}</span></div>
                        <div><span className="text-slate-500">Guardian Relationship:</span> <span className="font-medium text-slate-900">{guardianSourceLabel}</span></div>
                        <div><span className="text-slate-500">Guardian Name:</span> <span className="font-medium text-slate-900">{`${formData.guardianLastName || ''}, ${formData.guardianFirstName || ''} ${formData.guardianMiddleName || ''}`.trim() || 'N/A'}</span></div>
                        <div><span className="text-slate-500">Guardian Occupation:</span> <span className="font-medium text-slate-900">{formData.guardianOccupation || 'N/A'}</span></div>
                        <div><span className="text-slate-500">Guardian Contact:</span> <span className="font-medium text-slate-900">{formData.guardianContact || 'N/A'}</span></div>
                        <div className="col-span-2"><span className="text-slate-500">4Ps Member:</span> <span className="font-medium text-slate-900">{formatBool(formData.is4PsMember)}</span></div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-300/50">
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Enrollment Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-slate-500">Preferred Track:</span> <span className="font-medium text-slate-900">{formData.preferredTrack}</span></div>
                        <div><span className="text-slate-500">Elective 1:</span> <span className="font-medium text-slate-900">{formData.elective1}</span></div>
                        <div><span className="text-slate-500">Elective 2:</span> <span className="font-medium text-slate-900">{formData.elective2}</span></div>
                        <div><span className="text-slate-500">Year Level:</span> <span className="font-medium text-slate-900">{formData.yearLevel}</span></div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-300/50">
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Educational Background</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-slate-500">Primary School:</span> <span className="font-medium text-slate-900">{formData.primarySchool}</span></div>
                        <div><span className="text-slate-500">Year Graduated:</span> <span className="font-medium text-slate-900">{formData.primaryYearGraduated}</span></div>
                        <div><span className="text-slate-500">Secondary School:</span> <span className="font-medium text-slate-900">{formData.secondarySchool}</span></div>
                        <div><span className="text-slate-500">Year Graduated:</span> <span className="font-medium text-slate-900">{formData.secondaryYearGraduated}</span></div>
                        <div className="col-span-2"><span className="text-slate-500">Grade 10 Adviser:</span> <span className="font-medium text-slate-900">{formData.grade10Adviser || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm font-medium ${allDocumentsApproved ? 'text-emerald-700' : 'text-slate-500'}`}>
              {allDocumentsApproved
                ? 'All documents approved. Ready for final approval.'
                : 'Approve all documents first to continue.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleRejectApplication}
                className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition bg-rose-600 hover:bg-rose-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Application
              </button>
              <button
                type="button"
                onClick={handleFinalApprove}
                disabled={!allDocumentsApproved}
                className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition ${allDocumentsApproved ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-300 cursor-not-allowed'}`}
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
        <div className="fixed inset-y-0 right-0 left-0 z-[10000] flex items-center justify-center p-4 lg:left-[var(--dashboard-sidebar-offset,0px)]">
          <div
            className="absolute inset-0 bg-white/35 backdrop-blur-sm"
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

      {/* Document Viewer Modal */}
      {showDocumentViewer && viewedDocument && (
        <DocumentViewerModal
          isOpen={showDocumentViewer}
          onClose={() => {
            setShowDocumentViewer(false);
            setViewedDocument(null);
          }}
          documentName={viewedDocument.name}
          documentData={viewedDocument.data}
        />
      )}
    </div>
  );
};

export default ReviewApplicationModal;
