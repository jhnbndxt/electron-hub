import {
  ArrowLeft,
  CheckCircle,
  Eye,
  FileText,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../../components/LoadingState";
import {
  approveEnrollment,
  createAuditLog,
  rejectEnrollment,
  resolveUserId,
  updateDocumentStatus,
  upsertEnrollmentProgress,
} from "../../../services/adminService";
import { triggerNotification } from "../../../services/notificationService";
import { supabase } from "../../../supabase";

type DocumentStatus = "pending" | "approved" | "rejected" | "missing";
type VoucherEligibility = "eligible" | "not_eligible" | null;

const DOCUMENTS = [
  { key: "form138", label: "Form 138", required: true },
  { key: "birthCertificate", label: "PSA Birth Certificate", required: true },
  { key: "goodMoral", label: "Good Moral Certificate", required: true },
  { key: "idPicture", label: "2x2 ID Picture", required: true },
  { key: "diploma", label: "Grade 10 Diploma", required: false },
  { key: "form137", label: "Form 137", required: false },
  { key: "escCertificate", label: "ESC Certificate", required: false },
];

const parseFormData = (raw: any) => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
};

const publicUrl = (filePath?: string | null, fileUrl?: string | null) => {
  if (fileUrl) return fileUrl;
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  return supabase.storage.from("enrollment_documents").getPublicUrl(filePath).data?.publicUrl || null;
};

const normalizeStatus = (doc: any): DocumentStatus => {
  if (!doc) return "missing";
  if (doc.status === "approved" || doc.verified) return "approved";
  if (doc.status === "rejected") return "rejected";
  return "pending";
};

export function ApplicationReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, userRole } = useAuth();
  const basePath = userRole === "branchcoordinator" ? "/branchcoordinator" : "/registrar";
  const actorReference = userData?.id || userData?.email || userRole || "registrar";

  const [enrollment, setEnrollment] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocKey, setSelectedDocKey] = useState(DOCUMENTS[0].key);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [showForm, setShowForm] = useState(false);
  const [voucherEligibility, setVoucherEligibility] = useState<VoucherEligibility>(null);
  const [docRejectKey, setDocRejectKey] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [showApplicationReject, setShowApplicationReject] = useState(false);
  const [applicationRejectReason, setApplicationRejectReason] = useState("");

  const formData = useMemo(() => parseFormData(enrollment?.form_data), [enrollment]);
  const studentName =
    studentProfile?.full_name ||
    formData.studentName ||
    `${formData.firstName || ""} ${formData.lastName || ""}`.trim() ||
    enrollment?.user_id ||
    "Student";
  const initials =
    studentName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join("") || "S";

  const documents = useMemo(() => {
    const uploaded = enrollment?.enrollment_documents || [];
    return DOCUMENTS.map((definition) => {
      const doc = uploaded.find((item: any) => item.document_type === definition.key);
      return {
        ...definition,
        ...doc,
        status: normalizeStatus(doc),
        fileUrl: publicUrl(doc?.file_path, doc?.file_url),
        fileName: doc?.file_name || (doc?.file_path || doc?.file_url || "").split("/").pop() || "No file uploaded",
        rejectionComment: doc?.rejection_comment || doc?.rejection_reason || "",
      };
    });
  }, [enrollment]);

  const selectedDocument = documents.find((doc) => doc.key === selectedDocKey) || documents[0];
  const uploadedDocuments = documents.filter((doc) => doc.id);
  const pendingDocuments = documents.filter((doc) => doc.id && doc.status === "pending");
  const rejectedDocuments = documents.filter((doc) => doc.id && doc.status === "rejected");
  const requiredApproved = documents.filter((doc) => doc.required).every((doc) => doc.status === "approved");
  const existingVoucherStatus = enrollment?.voucher_status || formData?.voucher?.voucher_status;

  const loadReview = async (showLoader = true) => {
    if (!id) return;
    if (showLoader) setIsLoading(true);

    const { data, error } = await supabase
      .from("enrollments")
      .select("*, enrollment_documents(*)")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast.error(error?.message || "Application not found.");
      setEnrollment(null);
      setIsLoading(false);
      return;
    }

    setEnrollment(data);
    const firstActionable = (data.enrollment_documents || []).find(
      (doc: any) => normalizeStatus(doc) === "pending" || normalizeStatus(doc) === "rejected"
    );
    if (firstActionable) setSelectedDocKey(firstActionable.document_type);

    if (data.user_id) {
      const { data: profile } = await supabase
        .from("users")
        .select("id, email, full_name, profile_picture_url")
        .eq("email", data.user_id)
        .maybeSingle();
      setStudentProfile(profile || null);
    }

    const voucherStatus = data.voucher_status || parseFormData(data.form_data)?.voucher?.voucher_status;
    setVoucherEligibility(voucherStatus === "eligible" || voucherStatus === "not_eligible" ? voucherStatus : null);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadReview();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const docChannel = supabase
      .channel(`pending-review-documents-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollment_documents", filter: `enrollment_id=eq.${id}` }, () => {
        void loadReview(false);
      })
      .subscribe();

    const enrollmentChannel = supabase
      .channel(`pending-review-enrollment-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments", filter: `id=eq.${id}` }, () => {
        void loadReview(false);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(docChannel);
      void supabase.removeChannel(enrollmentChannel);
    };
  }, [id]);

  const updateLocalDocument = (documentId: string | number, updates: Record<string, any>) => {
    setEnrollment((current: any) => ({
      ...current,
      enrollment_documents: (current?.enrollment_documents || []).map((doc: any) =>
        doc.id === documentId ? { ...doc, ...updates } : doc
      ),
    }));
  };

  const goToNextPendingDocument = (currentKey: string) => {
    const next = documents.find((doc) => doc.key !== currentKey && doc.id && doc.status === "pending");
    if (next) setSelectedDocKey(next.key);
  };

  const approveDocument = async (documentKey = selectedDocKey) => {
    const doc = documents.find((item) => item.key === documentKey);
    if (!doc?.id) {
      toast.error("No uploaded document is available for this requirement.");
      return;
    }

    setIsProcessing(true);
    const { data, error } = await updateDocumentStatus(doc.id, "approved");
    setIsProcessing(false);

    if (error) {
      toast.error(error);
      return;
    }

    updateLocalDocument(doc.id, { ...(data || {}), status: "approved", rejection_comment: null });
    await createAuditLog(actorReference, "DOCUMENT_APPROVED", `Approved ${doc.label} for ${studentName}`, "success");
    toast.success(`${doc.label} approved.`);
    goToNextPendingDocument(documentKey);
  };

  const confirmDocumentReject = async () => {
    if (!docRejectKey || !docRejectReason.trim()) {
      toast.error("Rejection notes are required.");
      return;
    }

    const doc = documents.find((item) => item.key === docRejectKey);
    if (!doc?.id) return;

    setIsProcessing(true);
    const { data, error } = await updateDocumentStatus(doc.id, "rejected", docRejectReason.trim());
    setIsProcessing(false);

    if (error) {
      toast.error(error);
      return;
    }

    updateLocalDocument(doc.id, { ...(data || {}), status: "rejected", rejection_comment: docRejectReason.trim() });
    await triggerNotification(enrollment.user_id, "DOCUMENT_REJECTED", {
      documentName: doc.label,
      reason: docRejectReason.trim(),
      actionUrl: `/dashboard/my-documents?document=${doc.key}`,
    });
    await createAuditLog(actorReference, "DOCUMENT_REJECTED", `Rejected ${doc.label} for ${studentName}`, "warning");
    toast.success(`${doc.label} rejected. Student notified.`);
    setDocRejectKey(null);
    setDocRejectReason("");
    goToNextPendingDocument(doc.key);
  };

  const approveSelectedDocuments = async () => {
    const keys = [...selectedDocs];
    for (const key of keys) {
      await approveDocument(key);
    }
    setSelectedDocs([]);
  };

  const saveVoucherDecision = async () => {
    if (!enrollment || !voucherEligibility) return null;

    const timestamp = new Date().toISOString();
    const eligible = voucherEligibility === "eligible";
    const voucherPayload = {
      voucher_status: voucherEligibility,
      voucher_type: "DepEd SHS Voucher Program",
      is_tuition_free: eligible,
      voucher_verified_by: actorReference,
      voucher_verified_at: timestamp,
      voucher_notes: eligible ? "Marked eligible during application review." : "Marked not eligible during application review.",
      tuition_balance_due: eligible ? 0 : undefined,
      tuition_payment_locked: eligible,
    };

    const nextFormData = {
      ...formData,
      voucher: voucherPayload,
      tuition_balance_due: eligible ? 0 : formData.tuition_balance_due,
      tuition_payment_locked: eligible,
    };

    let result = await supabase
      .from("enrollments")
      .update({ ...voucherPayload, form_data: nextFormData, updated_at: timestamp })
      .eq("id", enrollment.id)
      .select()
      .single();

    if (result.error) {
      result = await supabase
        .from("enrollments")
        .update({ form_data: nextFormData, updated_at: timestamp })
        .eq("id", enrollment.id)
        .select()
        .single();
    }

    if (result.error) throw new Error(result.error.message);
    setEnrollment((current: any) => ({ ...current, ...(result.data || {}) }));
    return result.data;
  };

  const approveApplication = async () => {
    if (!requiredApproved) {
      toast.error("Approve all required documents before approving the application.");
      return;
    }
    if (!voucherEligibility) {
      toast.error("Voucher eligibility is required before approval.");
      return;
    }

    setIsProcessing(true);
    try {
      await saveVoucherDecision();
      const { error } = await approveEnrollment(enrollment.id, actorReference);
      if (error) throw new Error(error);

      const studentUserId = await resolveUserId(enrollment.user_id);
      if (studentUserId) {
        await upsertEnrollmentProgress(studentUserId, [
          { step_name: "Documents Submitted", status: "completed" },
          { step_name: "Documents Verified", status: "completed" },
          { step_name: "Payment Submitted", status: "current" },
        ]);
      }

      await triggerNotification(enrollment.user_id, "DOCUMENTS_VERIFIED");
      toast.success("Application approved. Student can proceed to payment.");
      void loadReview(false);
    } catch (error: any) {
      toast.error(error?.message || "Unable to approve application.");
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectApplication = async () => {
    if (!applicationRejectReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }

    setIsProcessing(true);
    const { error } = await rejectEnrollment(enrollment.id, applicationRejectReason.trim(), actorReference);
    setIsProcessing(false);

    if (error) {
      toast.error(error);
      return;
    }

    await triggerNotification(enrollment.user_id, "ENROLLMENT_REJECTED", {
      reason: applicationRejectReason.trim(),
    });
    toast.success("Application rejected. Student notified.");
    navigate(`${basePath}/pending`);
  };

  const moveToNextApplicant = async () => {
    const { data, error } = await supabase
      .from("enrollments")
      .select("id, status, enrollment_date")
      .neq("status", "enrolled")
      .neq("status", "rejected")
      .order("enrollment_date", { ascending: false });

    if (error || !data?.length) {
      toast.error(error?.message || "No other applicants found.");
      return;
    }

    const currentIndex = data.findIndex((item: any) => String(item.id) === String(enrollment.id));
    const next = data[currentIndex + 1] || data.find((item: any) => String(item.id) !== String(enrollment.id));

    if (!next) {
      toast.error("No next applicant available.");
      return;
    }

    navigate(`${basePath}/review/${next.id}`);
  };

  const formatFieldLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (char) => char.toUpperCase());

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined || value === "") return "Not provided";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "Not provided";
    if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${formatFieldLabel(key)}: ${formatFieldValue(item)}`).join(" | ");
    return String(value);
  };

  const submittedFormEntries = Object.entries(formData || {}).filter(([_, value]) => value !== undefined && value !== null && value !== "");

  const renderFormValue = ([key, value]: [string, any]) => (
    <div key={key} className="rounded-lg border border-slate-200/80 bg-white/75 px-3 py-2 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{formatFieldLabel(key)}</p>
      <p className="mt-1 break-words text-xs font-semibold text-slate-900">{formatFieldValue(value)}</p>
    </div>
  );

  if (isLoading) {
    return <LoadingState message="Loading application review..." subtext="Preparing document workspace." />;
  }

  if (!enrollment) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(`${basePath}/pending`)} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </button>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-900">Application not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-white p-3 text-slate-900 sm:p-4">
      <Toaster position="top-right" />

      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30">
          <div className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-bold shadow-xl">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-700" />
            Processing...
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1320px] rounded-xl border border-white/70 bg-white/60 p-4 shadow-xl shadow-blue-950/10 backdrop-blur-xl">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-950">Pending Application Review</h1>
            <p className="mt-1 text-xs font-medium text-slate-500">Review and verify documents before approving the application.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`${basePath}/pending`)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300/80 bg-white/80 px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={moveToNextApplicant}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-blue-800"
            >
              Move to Next Applicant
            </button>
          </div>
        </header>

        <section className="mt-3 rounded-lg border border-slate-200/70 bg-white/55 p-3 shadow-sm backdrop-blur-md">
          <div className="grid gap-3 lg:grid-cols-[92px_1fr] lg:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-black text-blue-800 ring-1 ring-white/80">
              {studentProfile?.profile_picture_url ? (
                <img src={studentProfile.profile_picture_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-slate-950">{studentName}</h2>
              <div className="mt-3 grid gap-3 text-xs text-slate-600 md:grid-cols-3">
                <div className="border-l border-slate-200 pl-4">
                  <p className="font-black text-slate-900">{formData.email || enrollment.user_id || "No email provided"}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">Email Address</p>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <p className="font-black text-slate-900">{String(enrollment.id)}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">Student ID</p>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <p className="font-black text-slate-900">{formData.preferredTrack || formData.track || enrollment.preferred_track || "Not set"}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">Academic Track / Strand</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowForm((current) => !current)}
              className="inline-flex min-w-[280px] items-center justify-center gap-2 rounded-lg border border-blue-500/70 bg-white/60 px-4 py-2 text-xs font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
              {showForm ? "Hide Full Enrollment Form" : "View Full Enrollment Form"}
            </button>
          </div>
        </section>

        {showForm && (
          <section className="mt-3 rounded-lg border border-blue-100 bg-blue-50/45 p-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black text-slate-950">Submitted Enrollment Form Details</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 bg-white/70 px-3 py-1.5 text-xs font-black text-slate-700">
                Hide Form
              </button>
            </div>
            <div className="mt-3 grid max-h-[260px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
              {submittedFormEntries.length > 0 ? submittedFormEntries.map(renderFormValue) : (
                <p className="text-sm font-semibold text-slate-500">No submitted form data found.</p>
              )}
            </div>
          </section>
        )}

        <section className="mt-3 rounded-lg border border-slate-200/70 bg-white/55 p-3 shadow-sm backdrop-blur-md">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-600">Document Verification</p>
          <div className="mt-2 grid gap-3 lg:grid-cols-[455px_minmax(0,1fr)]">
            <aside className="rounded-lg border border-slate-200 bg-white/65 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedDocs.length > 0 && selectedDocs.length === pendingDocuments.length}
                    onChange={(event) => setSelectedDocs(event.target.checked ? pendingDocuments.map((doc) => doc.key) : [])}
                    className="h-4 w-4 accent-blue-700"
                  />
                  Select all documents ({pendingDocuments.length})
                </label>
                <button
                  onClick={approveSelectedDocuments}
                  disabled={selectedDocs.length === 0 || isProcessing}
                  className="rounded-md bg-blue-700 px-3 py-1.5 text-[11px] font-black text-white disabled:bg-slate-300"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => selectedDocs[0] && setDocRejectKey(selectedDocs[0])}
                  disabled={selectedDocs.length === 0 || isProcessing}
                  className="rounded-md bg-rose-600 px-3 py-1.5 text-[11px] font-black text-white disabled:bg-slate-300"
                >
                  Bulk Reject
                </button>
              </div>

              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[32px_1fr_86px] bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  <span />
                  <span>Document Name</span>
                  <span>Status</span>
                </div>
                <div className="max-h-[365px] divide-y divide-slate-100 overflow-y-auto bg-white/70">
                  {documents.map((doc) => (
                    <button
                      key={doc.key}
                      onClick={() => setSelectedDocKey(doc.key)}
                      className={`grid w-full grid-cols-[32px_1fr_86px] items-center gap-2 px-3 py-2 text-left transition ${
                        selectedDocKey === doc.key ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.key)}
                        disabled={!doc.id || doc.status === "approved"}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          setSelectedDocs((current) =>
                            event.target.checked ? [...current, doc.key] : current.filter((key) => key !== doc.key)
                          );
                        }}
                        className="h-4 w-4 accent-blue-700"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-slate-900">{doc.label}</p>
                        <p className="truncate text-[11px] font-medium text-slate-500">{doc.fileName}</p>
                      </div>
                      <span
                        className={`justify-self-start rounded-full px-2 py-1 text-[10px] font-black ${
                          doc.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : doc.status === "rejected"
                            ? "bg-rose-100 text-rose-700"
                            : doc.status === "missing"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => approveDocument()}
                  disabled={!selectedDocument?.id || selectedDocument.status === "approved" || isProcessing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white disabled:bg-slate-300"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setDocRejectKey(selectedDocument?.key || null);
                    setDocRejectReason(selectedDocument?.rejectionComment || "");
                  }}
                  disabled={!selectedDocument?.id || selectedDocument.status === "approved" || isProcessing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white disabled:bg-slate-300"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </aside>

            <section className="flex min-h-[448px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/70">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/70 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-900">Document Preview</p>
                  <p className="truncate text-[11px] font-medium text-slate-500">{selectedDocument?.label || "Select a document"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setZoom((current) => Math.max(50, current - 10))} className="rounded-md border border-slate-200 bg-white p-2 text-slate-700" title="Zoom out">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] font-black">{zoom}%</span>
                  <button onClick={() => setZoom((current) => Math.min(180, current + 10))} className="rounded-md border border-slate-200 bg-white p-2 text-slate-700" title="Zoom in">
                    <Plus className="h-4 w-4" />
                  </button>
                  {selectedDocument?.fileUrl && (
                    <a href={selectedDocument.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-200 bg-white p-2 text-slate-700" title="Fullscreen">
                      <Maximize2 className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto bg-white p-2">
                {selectedDocument?.fileUrl ? (
                  selectedDocument.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="flex min-h-full items-start justify-center">
                      <img
                        src={selectedDocument.fileUrl}
                        alt={selectedDocument.label}
                        style={{ transform: `scale(${zoom / 100})` }}
                        className="max-h-none max-w-full origin-top rounded bg-white object-contain transition-transform"
                      />
                    </div>
                  ) : (
                    <iframe
                      src={selectedDocument.fileUrl}
                      title={selectedDocument.label}
                      style={{ width: `${zoom}%` }}
                      className="mx-auto h-full min-h-[420px] rounded bg-white"
                    />
                  )
                ) : (
                  <div className="flex h-full min-h-[360px] items-center justify-center text-center text-slate-400">
                    <div>
                      <FileText className="mx-auto h-12 w-12 text-slate-300" />
                      <p className="mt-2 text-sm font-black">No uploaded file</p>
                      <p className="mt-1 text-xs">Select another document or ask the student to upload this requirement.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-slate-200/70 bg-white/55 p-3 shadow-sm backdrop-blur-md">
          <div className="grid gap-3 lg:grid-cols-[1fr_350px] lg:items-center">
            <div>
              <p className="text-xs font-black text-slate-900">Is the student eligible for the voucher program? <span className="text-rose-600">*</span></p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">This is required before approving the application.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white/70 p-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input type="radio" checked={voucherEligibility === "eligible"} onChange={() => setVoucherEligibility("eligible")} className="h-4 w-4 accent-blue-700" />
                Yes, Eligible
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input type="radio" checked={voucherEligibility === "not_eligible"} onChange={() => setVoucherEligibility("not_eligible")} className="h-4 w-4 accent-blue-700" />
                No, Not Eligible
              </label>
            </div>
          </div>
          {existingVoucherStatus && <p className="mt-2 text-[11px] font-semibold text-slate-500">Saved decision: {String(existingVoucherStatus).replace("_", " ")}</p>}
        </section>

        <footer className="mt-3 rounded-lg border border-slate-200/70 bg-white/55 p-3 shadow-sm backdrop-blur-md">
          <div className="grid gap-3 lg:grid-cols-2">
            <button
              onClick={() => setShowApplicationReject(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white/70 px-4 py-3 text-sm font-black text-rose-700 shadow-sm hover:bg-rose-50"
            >
              <XCircle className="h-4 w-4" />
              Reject Application
            </button>
            <button
              onClick={approveApplication}
              disabled={!requiredApproved || !voucherEligibility || isProcessing}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-800 disabled:bg-slate-300"
            >
              <ShieldCheck className="h-4 w-4" />
              Approve Application
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] font-medium text-slate-500">
            Please ensure all documents are verified and eligibility is selected before approving.
          </p>
        </footer>
      </div>

      {docRejectKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-5 py-4">
              <h2 className="text-lg font-black text-slate-950">Reject Document</h2>
              <button onClick={() => setDocRejectKey(null)} className="rounded-lg p-2 text-slate-500 hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <label className="text-xs font-black uppercase text-slate-500">Rejection notes</label>
              <textarea
                value={docRejectReason}
                onChange={(event) => setDocRejectReason(event.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                placeholder="Explain what needs to be corrected or re-uploaded."
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setDocRejectKey(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Cancel</button>
                <button onClick={confirmDocumentReject} disabled={!docRejectReason.trim()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300">Reject Document</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApplicationReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-5 py-4">
              <h2 className="text-lg font-black text-slate-950">Reject Application</h2>
              <button onClick={() => setShowApplicationReject(false)} className="rounded-lg p-2 text-slate-500 hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <label className="text-xs font-black uppercase text-slate-500">Reason required</label>
              <textarea
                value={applicationRejectReason}
                onChange={(event) => setApplicationRejectReason(event.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                placeholder="Provide a clear reason for rejecting this application."
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowApplicationReject(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Cancel</button>
                <button onClick={rejectApplication} disabled={!applicationRejectReason.trim()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300">Reject Application</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
