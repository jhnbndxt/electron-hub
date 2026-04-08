import { Link } from "react-router";
import { ArrowLeft, FileText, Upload, CheckCircle, AlertCircle, Download, XCircle, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface DocumentStatus {
  name: string;
  status: "approved" | "rejected" | "pending" | "not_uploaded";
  uploadDate?: string;
  fileSize?: string;
  fileData?: string;
  rejectionComment?: string;
}

export function MyDocuments() {
  const { userData } = useAuth();
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (userData?.email) {
      loadDocuments();
    }
  }, [userData]);

  const loadDocuments = () => {
    if (!userData?.email) return;

    // Get document statuses from localStorage
    const docVerification = JSON.parse(localStorage.getItem("document_verification") || "{}");
    const userDocs = docVerification[userData.email] || {};

    const requiredDocs = [
      { key: "form138", name: "Form 138 (Report Card)" },
      { key: "goodMoral", name: "Good Moral Certificate" },
      { key: "psaBirthCertificate", name: "PSA Birth Certificate" },
      { key: "idPicture", name: "2x2 ID Pictures" },
      { key: "parentGuardianId", name: "Photocopy of Parent's/Guardian ID" },
    ];

    const docStatuses = requiredDocs.map(doc => ({
      name: doc.name,
      status: userDocs[doc.key]?.status || "not_uploaded",
      uploadDate: userDocs[doc.key]?.uploadDate,
      fileSize: userDocs[doc.key]?.fileSize,
      fileData: userDocs[doc.key]?.fileData,
      rejectionComment: userDocs[doc.key]?.rejectionComment,
    }));

    setDocuments(docStatuses);
  };

  const handleFileUpload = async (docName: string, file: File) => {
    if (!userData?.email) return;

    setUploadingDoc(docName);

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;

      // Get the document key
      const docKeyMap: Record<string, string> = {
        "Form 138 (Report Card)": "form138",
        "Good Moral Certificate": "goodMoral",
        "PSA Birth Certificate": "psaBirthCertificate",
        "2x2 ID Pictures": "idPicture",
        "Photocopy of Parent's/Guardian ID": "parentGuardianId",
      };

      const docKey = docKeyMap[docName];

      // Update localStorage with file data
      const docVerification = JSON.parse(localStorage.getItem("document_verification") || "{}");
      if (!docVerification[userData.email]) {
        docVerification[userData.email] = {};
      }

      docVerification[userData.email][docKey] = {
        status: "pending",
        uploadDate: new Date().toLocaleDateString(),
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileName: file.name,
        fileData: base64Data,
      };

      try {
        localStorage.setItem("document_verification", JSON.stringify(docVerification));
      } catch (error) {
        // Handle quota exceeded error
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          // Remove fileData and try again without it
          delete docVerification[userData.email][docKey].fileData;
          try {
            localStorage.setItem("document_verification", JSON.stringify(docVerification));
            alert("Document uploaded successfully, but file preview is not available due to storage limitations. The Registrar will still be able to see that you uploaded: " + file.name);
          } catch (retryError) {
            alert("Failed to upload document. Storage quota exceeded.");
            setUploadingDoc(null);
            return;
          }
        } else {
          alert("Failed to upload document. Please try again.");
          setUploadingDoc(null);
          return;
        }
      }

      // Reload documents
      loadDocuments();
      setUploadingDoc(null);
    };

    reader.onerror = () => {
      alert("Failed to read file. Please try again.");
      setUploadingDoc(null);
    };

    reader.readAsDataURL(file);
  };

  const requiredDocuments = [
    "Form 138 (Report Card)",
    "Good Moral Certificate",
    "PSA Birth Certificate",
    "2x2 ID Pictures",
    "Photocopy of Parent's/Guardian ID",
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="text-gray-600 mt-1">Manage your enrollment documents</p>
        </div>

        {/* Rejected Documents Alert */}
        {documents.some(doc => doc.status === "rejected") && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  Document Rejection Notice
                </h3>
                <p className="text-sm text-red-700 mb-3">
                  Some of your documents were not approved by the registrar. Please review the rejection reasons below and re-upload the corrected documents to continue with your enrollment.
                </p>
                <div className="space-y-2">
                  {documents
                    .filter(doc => doc.status === "rejected")
                    .map((doc, index) => (
                      <div key={index} className="bg-white border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="font-semibold text-red-900 text-sm">{doc.name}</span>
                        </div>
                        <p className="text-xs text-red-700 ml-6">
                          Reason: {doc.rejectionComment}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Documents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Documents</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {documents.filter(doc => doc.status !== "not_uploaded").length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No documents uploaded yet
              </div>
            ) : (
              documents.filter(doc => doc.status !== "not_uploaded").map((doc, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <FileText className="w-10 h-10 flex-shrink-0" style={{ color: "#1E3A8A" }} />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <p className="text-sm text-gray-500">
                        Uploaded on {doc.uploadDate} • {doc.fileSize}
                      </p>
                      
                      {/* Rejection Comment */}
                      {doc.status === "rejected" && doc.rejectionComment && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs font-semibold text-red-900 mb-1">Reason for rejection:</p>
                          <p className="text-sm text-red-700">{doc.rejectionComment}</p>
                          <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded cursor-pointer hover:bg-red-700 transition-colors">
                            <Upload className="w-3 h-3" />
                            Re-upload Document
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(doc.name, file);
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {doc.status === "approved" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4" />
                          Approved
                        </span>
                      )}
                      {doc.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <AlertCircle className="w-4 h-4" />
                          Pending Review
                        </span>
                      )}
                      {doc.status === "rejected" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Required Documents Checklist with Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h2>
          <ul className="space-y-3">
            {requiredDocuments.map((docName, index) => {
              const doc = documents.find(d => d.name === docName);
              const isUploaded = doc && doc.status !== "not_uploaded";
              const needsReupload = doc?.status === "rejected";
              
              return (
                <li key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        doc?.status === "approved" ? "bg-green-100" :
                        doc?.status === "rejected" ? "bg-red-100" :
                        isUploaded ? "bg-yellow-100" : "bg-gray-100"
                      }`}
                    >
                      {doc?.status === "approved" && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {doc?.status === "rejected" && <XCircle className="w-4 h-4 text-red-600" />}
                      {doc?.status === "pending" && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                    </div>
                    <span className={isUploaded ? "text-gray-900 font-medium" : "text-gray-500"}>
                      {docName}
                    </span>
                  </div>
                  
                  {!isUploaded && (
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docName, file);
                        }}
                      />
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}