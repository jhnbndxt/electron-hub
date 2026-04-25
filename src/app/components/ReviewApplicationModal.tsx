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

interface DocumentReviewState {
  psaBirthCertificate: "pending" | "accepted" | "rejected";
  form138: "pending" | "accepted" | "rejected";
  goodMoralCertificate: "pending" | "accepted" | "rejected";
  idPicture: "pending" | "accepted" | "rejected";
  parentGuardianId: "pending" | "accepted" | "rejected";
}

interface RejectionReasons {
  psaBirthCertificate: string;
  form138: string;
  goodMoralCertificate: string;
  idPicture: string;
  parentGuardianId: string;
}

interface Student {
  id: number | string;
  name: string;
  email: string;
  strand: string;
  applicationDate: string;
  aiTestScore?: number | null;
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

interface ReviewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  documentReview: DocumentReviewState;
  setDocumentReview: React.Dispatch<React.SetStateAction<DocumentReviewState>>;
  rejectionReasons: RejectionReasons;
  setRejectionReasons: React.Dispatch<React.SetStateAction<RejectionReasons>>;
  expandedDocument: string | null;
  setExpandedDocument: React.Dispatch<React.SetStateAction<string | null>>;
  showFormData: boolean;
  setShowFormData: React.Dispatch<React.SetStateAction<boolean>>;
  handleAcceptDocument: (docType: keyof DocumentReviewState) => void;
  handleRejectDocument: (docType: keyof DocumentReviewState) => void;
  handleSubmitRejection: (docType: keyof DocumentReviewState) => void;
  handleSubmitFinalReview: () => void;
  handleViewDocument: (docType: string, student: Student) => void;
  allDocumentsReviewed: boolean;
}

const ReviewApplicationModal: React.FC<ReviewApplicationModalProps> = ({
  isOpen,
  onClose,
  student,
  documentReview,
  setDocumentReview,
  rejectionReasons,
  setRejectionReasons,
  expandedDocument,
  setExpandedDocument,
  showFormData,
  setShowFormData,
  handleAcceptDocument,
  handleRejectDocument,
  handleSubmitRejection,
  handleSubmitFinalReview,
  handleViewDocument,
  allDocumentsReviewed,
}) => {
  if (!isOpen || !student) return null;

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
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/20 shadow-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(239, 68, 68, 0.1))',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review Application</h2>
            <p className="text-sm text-gray-600 mt-1">{student.name} - {student.strand}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 border border-white/30"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-white/50 rounded-2xl border border-white/30 backdrop-blur-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-sm font-medium text-gray-900">{student.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Application Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(student.applicationDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">AI Test Score</p>
              <p className="text-sm font-medium text-gray-900">
                {student.aiTestScore !== null && student.aiTestScore !== undefined ? `${student.aiTestScore}%` : "Not Taken"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Recommended Strand</p>
              <p className="text-sm font-medium text-gray-900">{student.strand}</p>
            </div>
          </div>

          {/* Documents Checklist */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
            <div className="space-y-3">
              {/* PSA Birth Certificate */}
              <div className="border-2 border-white/30 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 p-4 bg-white/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4" style={{ color: student.documents?.psaBirthCertificate ? "#10B981" : "#9CA3AF" }} />
                      <span className="text-sm font-medium text-gray-900">PSA Birth Certificate</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument("birthCertificate", student)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all border border-blue-200 text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {documentReview.psaBirthCertificate === "pending" && (
                      <>
                        <button
                          onClick={() => handleAcceptDocument("psaBirthCertificate")}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectDocument("psaBirthCertificate")}
                          className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all border-2 border-red-300 text-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {documentReview.psaBirthCertificate === "accepted" && (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                {documentReview.psaBirthCertificate === "rejected" && expandedDocument === "psaBirthCertificate" && (
                  <div className="p-4 bg-red-50/50 border-t border-red-200/50">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Reason for rejection:</label>
                    <input
                      type="text"
                      placeholder="e.g., Image is blurry, missing signature..."
                      value={rejectionReasons.psaBirthCertificate}
                      onChange={(e) => setRejectionReasons((prev) => ({ ...prev, psaBirthCertificate: e.target.value }))}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                    />
                    <button
                      onClick={() => handleSubmitRejection("psaBirthCertificate")}
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all bg-red-600"
                    >
                      Submit Reason
                    </button>
                  </div>
                )}
              </div>

              {/* Form 138 */}
              <div className="border-2 border-white/30 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 p-4 bg-white/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" style={{ color: student.documents?.form138 ? "#10B981" : "#9CA3AF" }} />
                      <span className="text-sm font-medium text-gray-900">Form 138 (Report Card)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument("form138", student)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all border border-blue-200 text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {documentReview.form138 === "pending" && (
                      <>
                        <button
                          onClick={() => handleAcceptDocument("form138")}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectDocument("form138")}
                          className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all border-2 border-red-300 text-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {documentReview.form138 === "accepted" && (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                {documentReview.form138 === "rejected" && expandedDocument === "form138" && (
                  <div className="p-4 bg-red-50/50 border-t border-red-200/50">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Reason for rejection:</label>
                    <input
                      type="text"
                      placeholder="e.g., Image is blurry, missing signature..."
                      value={rejectionReasons.form138}
                      onChange={(e) => setRejectionReasons((prev) => ({ ...prev, form138: e.target.value }))}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                    />
                    <button
                      onClick={() => handleSubmitRejection("form138")}
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all bg-red-600"
                    >
                      Submit Reason
                    </button>
                  </div>
                )}
              </div>

              {/* Good Moral Certificate */}
              <div className="border-2 border-white/30 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 p-4 bg-white/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4" style={{ color: student.documents?.goodMoralCertificate ? "#10B981" : "#9CA3AF" }} />
                      <span className="text-sm font-medium text-gray-900">Good Moral Certificate</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument("goodMoral", student)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all border border-blue-200 text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {documentReview.goodMoralCertificate === "pending" && (
                      <>
                        <button
                          onClick={() => handleAcceptDocument("goodMoralCertificate")}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectDocument("goodMoralCertificate")}
                          className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all border-2 border-red-300 text-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {documentReview.goodMoralCertificate === "accepted" && (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                {documentReview.goodMoralCertificate === "rejected" && expandedDocument === "goodMoralCertificate" && (
                  <div className="p-4 bg-red-50/50 border-t border-red-200/50">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Reason for rejection:</label>
                    <input
                      type="text"
                      placeholder="e.g., Image is blurry, missing signature..."
                      value={rejectionReasons.goodMoralCertificate}
                      onChange={(e) => setRejectionReasons((prev) => ({ ...prev, goodMoralCertificate: e.target.value }))}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                    />
                    <button
                      onClick={() => handleSubmitRejection("goodMoralCertificate")}
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all bg-red-600"
                    >
                      Submit Reason
                    </button>
                  </div>
                )}
              </div>

              {/* 2x2 ID Picture */}
              <div className="border-2 border-white/30 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 p-4 bg-white/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" style={{ color: student.documents?.idPicture ? "#10B981" : "#9CA3AF" }} />
                      <span className="text-sm font-medium text-gray-900">2x2 ID Picture</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument("idPicture", student)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all border border-blue-200 text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {documentReview.idPicture === "pending" && (
                      <>
                        <button
                          onClick={() => handleAcceptDocument("idPicture")}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectDocument("idPicture")}
                          className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all border-2 border-red-300 text-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {documentReview.idPicture === "accepted" && (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                {documentReview.idPicture === "rejected" && expandedDocument === "idPicture" && (
                  <div className="p-4 bg-red-50/50 border-t border-red-200/50">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Reason for rejection:</label>
                    <input
                      type="text"
                      placeholder="e.g., Image is blurry, not 2x2 size..."
                      value={rejectionReasons.idPicture}
                      onChange={(e) => setRejectionReasons((prev) => ({ ...prev, idPicture: e.target.value }))}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                    />
                    <button
                      onClick={() => handleSubmitRejection("idPicture")}
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all bg-red-600"
                    >
                      Submit Reason
                    </button>
                  </div>
                )}
              </div>

              {/* Parent's/Guardian's ID */}
              <div className="border-2 border-white/30 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 p-4 bg-white/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4" style={{ color: student.documents?.parentGuardianId ? "#10B981" : "#9CA3AF" }} />
                      <span className="text-sm font-medium text-gray-900">Photocopy of Parent's/Guardian's ID</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument("parentGuardianId", student)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all border border-blue-200 text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {documentReview.parentGuardianId === "pending" && (
                      <>
                        <button
                          onClick={() => handleAcceptDocument("parentGuardianId")}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectDocument("parentGuardianId")}
                          className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all border-2 border-red-300 text-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {documentReview.parentGuardianId === "accepted" && (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                {documentReview.parentGuardianId === "rejected" && expandedDocument === "parentGuardianId" && (
                  <div className="p-4 bg-red-50/50 border-t border-red-200/50">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Reason for rejection:</label>
                    <input
                      type="text"
                      placeholder="e.g., Image is blurry, ID is expired..."
                      value={rejectionReasons.parentGuardianId}
                      onChange={(e) => setRejectionReasons((prev) => ({ ...prev, parentGuardianId: e.target.value }))}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                    />
                    <button
                      onClick={() => handleSubmitRejection("parentGuardianId")}
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all bg-red-600"
                    >
                      Submit Reason
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* View Enrollment Form Data */}
          <div>
            <button
              onClick={() => setShowFormData(!showFormData)}
              className="w-full flex items-center justify-between p-4 bg-blue-50/50 border border-blue-200/50 rounded-2xl hover:bg-blue-50/70 transition-colors backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-900" />
                <span className="text-sm font-semibold text-blue-900">View Complete Enrollment Form</span>
              </div>
              <div className="text-blue-900">
                {showFormData ? "▲" : "▼"}
              </div>
            </button>

            {showFormData && student.formData && (
              <div className="mt-4 p-4 bg-gray-50/50 border border-gray-200/50 rounded-2xl space-y-4 max-h-96 overflow-y-auto backdrop-blur-sm">
                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Full Name:</span> <span className="font-medium">{student.formData.form_data?.firstName} {student.formData.form_data?.middleName} {student.formData.form_data?.lastName}</span></div>
                    <div><span className="text-gray-500">LRN:</span> <span className="font-medium">{student.formData.form_data?.lrn}</span></div>
                    <div><span className="text-gray-500">Sex:</span> <span className="font-medium">{student.formData.form_data?.sex}</span></div>
                    <div><span className="text-gray-500">Birthday:</span> <span className="font-medium">{student.formData.form_data?.birthday}</span></div>
                    <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{student.formData.form_data?.contactNumber}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium">{student.formData.form_data?.email}</span></div>
                  </div>
                </div>

                {/* Address */}
                <div className="pt-3 border-t border-gray-300/50">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Address</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Region:</span> <span className="font-medium">{student.formData.form_data?.region}</span></div>
                    <div><span className="text-gray-500">Province:</span> <span className="font-medium">{student.formData.form_data?.province || 'N/A'}</span></div>
                    <div><span className="text-gray-500">City:</span> <span className="font-medium">{student.formData.form_data?.city}</span></div>
                    <div><span className="text-gray-500">Barangay:</span> <span className="font-medium">{student.formData.form_data?.barangay}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Home Address:</span> <span className="font-medium">{student.formData.form_data?.homeAddress}</span></div>
                  </div>
                </div>

                {/* Enrollment Details */}
                <div className="pt-3 border-t border-gray-300/50">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Enrollment Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Track:</span> <span className="font-medium">{student.formData.form_data?.preferredTrack}</span></div>
                    <div><span className="text-gray-500">Year Level:</span> <span className="font-medium">{student.formData.form_data?.yearLevel}</span></div>
                    <div><span className="text-gray-500">Elective 1:</span> <span className="font-medium">{student.formData.form_data?.elective1}</span></div>
                    <div><span className="text-gray-500">Elective 2:</span> <span className="font-medium">{student.formData.form_data?.elective2}</span></div>
                  </div>
                </div>

                {/* Parent Information */}
                <div className="pt-3 border-t border-gray-300/50">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Parent/Guardian Information</h4>
                  <div className="space-y-2">
                    <div className="text-xs">
                      <p className="text-gray-500 font-medium mb-1">Father:</p>
                      <p className="font-medium">{student.formData.form_data?.fatherFirstName} {student.formData.form_data?.fatherLastName}</p>
                      <p className="text-gray-600">{student.formData.form_data?.fatherOccupation} • {student.formData.form_data?.fatherContact}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-gray-500 font-medium mb-1">Mother:</p>
                      <p className="font-medium">{student.formData.form_data?.motherFirstName} {student.formData.form_data?.motherLastName}</p>
                      <p className="text-gray-600">{student.formData.form_data?.motherOccupation} • {student.formData.form_data?.motherContact}</p>
                    </div>
                  </div>
                </div>

                {/* Education Background */}
                <div className="pt-3 border-t border-gray-300/50">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Educational Background</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-gray-500">Primary School:</p>
                      <p className="font-medium">{student.formData.form_data?.primarySchool} ({student.formData.form_data?.primaryYearGraduated})</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Secondary School:</p>
                      <p className="font-medium">{student.formData.form_data?.secondarySchool} ({student.formData.form_data?.secondaryYearGraduated})</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-white/20 bg-white/50 backdrop-blur-sm">
          <button
            onClick={handleSubmitFinalReview}
            disabled={!allDocumentsReviewed}
            className="flex-1 px-6 py-4 rounded-2xl text-white font-semibold text-base hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-700"
          >
            <CheckCircle className="w-5 h-5" />
            Submit Final Review
          </button>
        </div>
        {!allDocumentsReviewed && (
          <p className="text-sm text-gray-500 text-center -mt-2 mb-4">
            Please review all documents before submitting
          </p>
        )}
      </div>
    </div>
  );
};

export default ReviewApplicationModal;