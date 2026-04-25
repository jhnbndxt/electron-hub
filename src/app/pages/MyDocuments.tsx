import { Link } from "react-router";
import { ArrowLeft, FileText, Upload, CheckCircle, AlertCircle, Download, XCircle, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../supabase";

interface DocumentStatus {
  name: string;
  documentType: string;
  status: "approved" | "rejected" | "pending" | "not_uploaded";
  uploadDate?: string;
  fileSize?: string;
  fileUrl?: string;
  rejectionComment?: string;
}

const REQUIRED_DOCS = [
  { key: "form138", name: "Form 138 (Report Card)" },
  { key: "goodMoral", name: "Good Moral Certificate" },
  { key: "birthCertificate", name: "PSA Birth Certificate" },
  { key: "idPicture", name: "2x2 ID Pictures" },
  { key: "parentGuardianId", name: "Photocopy of Parent's/Guardian ID" },
];

const DOC_NAME_TO_KEY: Record<string, string> = {
  "Form 138 (Report Card)": "form138",
  "Good Moral Certificate": "goodMoral",
  "PSA Birth Certificate": "birthCertificate",
  "2x2 ID Pictures": "idPicture",
  "Photocopy of Parent's/Guardian ID": "parentGuardianId",
};

export function MyDocuments() {
  const { userData } = useAuth();
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  useEffect(() => {
    if (userData?.email) {
      loadDocuments();
    }
  }, [userData]);

  useEffect(() => {
    if (!enrollmentId) return;

    const channel = supabase
      .channel(`documents-${enrollmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "enrollment_documents",
          filter: `enrollment_id=eq.${enrollmentId}`,
        },
        () => {
          void loadDocuments();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enrollmentId]);

  const resolvePublicUrl = (filePath: string | null | undefined) => {
    if (!filePath) return undefined;
    return supabase.storage.from("enrollment_documents").getPublicUrl(filePath).data?.publicUrl || undefined;
  };

  const loadDocuments = async () => {
    if (!userData?.email) return;

    // Find the student's enrollment by email
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userData.email)
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollError) {
      console.error("Error fetching enrollment:", enrollError);
      setDocuments(REQUIRED_DOCS.map(d => ({ name: d.name, documentType: d.key, status: "not_uploaded" })));
      return;
    }

    if (!enrollment) {
      setDocuments(REQUIRED_DOCS.map(d => ({ name: d.name, documentType: d.key, status: "not_uploaded" })));
      return;
    }

    setEnrollmentId(enrollment.id);

    // Load documents for this enrollment
    const { data: docs, error: docsError } = await supabase
      .from("enrollment_documents")
      .select("id, document_type, file_url, file_path, file_name, file_size, uploaded_at, updated_at, rejection_comment, status")
      .eq("enrollment_id", enrollment.id);

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      setDocuments(REQUIRED_DOCS.map(d => ({ name: d.name, documentType: d.key, status: "not_uploaded" })));
      return;
    }

    const docStatuses: DocumentStatus[] = REQUIRED_DOCS.map(reqDoc => {
      const uploaded = docs?.find(d => d.document_type === reqDoc.key);
      if (!uploaded) {
        return { name: reqDoc.name, documentType: reqDoc.key, status: "not_uploaded" };
      }

      // Determine status from the live document workflow state.
      let docStatus: DocumentStatus["status"] = "pending";
      if (uploaded.status === "approved") {
        docStatus = "approved";
      } else if (uploaded.status === "rejected") {
        docStatus = "rejected";
      }

      return {
        name: reqDoc.name,
        documentType: reqDoc.key,
        status: docStatus,
        uploadDate: uploaded.uploaded_at
          ? new Date(uploaded.uploaded_at).toLocaleDateString()
          : undefined,
        fileSize: uploaded.file_size
          ? `${(uploaded.file_size / 1024 / 1024).toFixed(2)} MB`
          : undefined,
        fileUrl:
          uploaded.file_url || resolvePublicUrl(uploaded.file_path) || undefined,
        rejectionComment: uploaded.rejection_comment || undefined,
      };
    });

    setDocuments(docStatuses);
  };

  const handleFileUpload = async (docName: string, file: File) => {
    if (!userData?.email) return;

    setUploadingDoc(docName);

    try {
      // Make sure we have an enrollment ID
      let currentEnrollmentId = enrollmentId;
      if (!currentEnrollmentId) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", userData.email)
          .neq("status", "rejected")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!enrollment) {
          alert("No enrollment found. Please complete your enrollment form first.");
          setUploadingDoc(null);
          return;
        }
        currentEnrollmentId = enrollment.id;
        setEnrollmentId(enrollment.id);
      }

      const docType = DOC_NAME_TO_KEY[docName];
      const timestamp = Date.now();
      const fileExt = file.name.split(".").pop();
      const storagePath = `${currentEnrollmentId}/${docType}/${timestamp}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("enrollment_documents")
        .upload(storagePath, file, { upsert: true });

      if (storageError) {
        console.error("Storage upload error:", storageError);
        alert("Failed to upload file. Please try again.");
        setUploadingDoc(null);
        return;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("enrollment_documents")
        .getPublicUrl(storagePath);

      // Check if a record for this document type already exists
      const { data: existingDoc } = await supabase
        .from("enrollment_documents")
        .select("id")
        .eq("enrollment_id", currentEnrollmentId)
        .eq("document_type", docType)
        .maybeSingle();

      if (existingDoc) {
        // Update the existing record
        await supabase
          .from("enrollment_documents")
          .update({
            file_url: urlData.publicUrl,
            file_path: storagePath,
            file_name: file.name,
            file_size: file.size,
            uploaded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: "pending_review",
            rejection_comment: null,
          })
          .eq("id", existingDoc.id);
      } else {
        // Insert a new record
        await supabase.from("enrollment_documents").insert({
          enrollment_id: currentEnrollmentId,
          document_type: docType,
          file_url: urlData.publicUrl,
          file_path: storagePath,
          file_name: file.name,
          file_size: file.size,
          status: "pending_review",
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      await loadDocuments();
    } catch (err) {
      console.error("Upload error:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setUploadingDoc(null);
    }
  };

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
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                        >
                          <Download className="w-3 h-3" />
                          View / Download
                        </a>
                      )}
                      
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
            {REQUIRED_DOCS.map((reqDoc, index) => {
              const doc = documents.find(d => d.documentType === reqDoc.key);
              const isUploaded = doc && doc.status !== "not_uploaded";
              
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
                      {reqDoc.name}
                    </span>
                  </div>
                  
                  {!isUploaded && (
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      {uploadingDoc === reqDoc.name ? "Uploading..." : "Upload"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        disabled={uploadingDoc !== null}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(reqDoc.name, file);
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