import {
  ArrowLeft,
  CheckCircle,
  ClipboardCheck,
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

  const renderFormValue = (label: string, value: any) => (
    <div className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "Not provided"}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white p-4 text-slate-900 sm:p-6 lg:p-8">
      <Toaster position="top-right" />

      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30">
          <div className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-bold shadow-xl">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-700" />
            Processing...
          </div>
        </div>
      )}

      <header className="rounded-xl border border-white/70 bg-white/75 p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <button
              onClick={() => navigate(`${basePath}/pending`)}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Applications
            </button>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-100 text-lg font-black text-blue-800">
                {studentProfile?.profile_picture_url ? (
                  <img src={studentProfile.profile_picture_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black text-slate-950">{studentName}</h1>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">Student ID: {String(enrollment.id).slice(0, 8)}</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Track/Strand: {formData.preferredTrack || formData.track || enrollment.preferred_track || "Not set"}</span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Status: {String(enrollment.status || "pending").replace(/_/g, " ")}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowForm((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-800"
          >
            <Eye className="h-4 w-4" />
            View Full Enrollment Form
          </button>
        </div>
      </header>

      {showForm && (
        <section className="mt-5 rounded-xl border border-white/70 bg-white/75 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Full Enrollment Form</h2>
            <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {renderFormValue("Full Name", `${formData.lastName || ""}, ${formData.firstName || ""} ${formData.middleName || ""}`.trim())}
            {renderFormValue("LRN", formData.lrn)}
            {renderFormValue("Email", formData.email || enrollment.user_id)}
            {renderFormValue("Contact Number", formData.contactNumber)}
            {renderFormValue("Birthday", formData.birthday || formData.birthDate)}
            {renderFormValue("Sex", formData.sex)}
            {renderFormValue("Preferred Track", formData.preferredTrack || formData.track)}
            {renderFormValue("Year Level", formData.yearLevel)}
            {renderFormValue("Address", [formData.homeAddress, formData.barangay, formData.city, formData.province].filter(Boolean).join(", "))}
            {renderFormValue("Guardian", `${formData.guardianFirstName || ""} ${formData.guardianLastName || ""}`.trim())}
            {renderFormValue("Guardian Contact", formData.guardianContact)}
            {renderFormValue("4Ps Member", formData.is4PsMember ? "Yes" : "No")}
          </div>
        </section>
      )}

      <main className="mt-5 grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Document Checklist</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{uploadedDocuments.length} uploaded</h2>
              </div>
              <ClipboardCheck className="h-6 w-6 text-blue-700" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDocs(pendingDocuments.map((doc) => doc.key))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Select pending
              </button>
              <button
                onClick={() => setSelectedDocs([])}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                onClick={approveSelectedDocuments}
                disabled={selectedDocs.length === 0 || isProcessing}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300"
              >
                Approve selected ({selectedDocs.length})
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {documents.map((doc) => (
                <button
                  key={doc.key}
                  onClick={() => setSelectedDocKey(doc.key)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedDocKey === doc.key ? "border-blue-400 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
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
                      className="mt-1 h-4 w-4 accent-blue-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black text-slate-900">{doc.label}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
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
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{doc.fileName}</p>
                      {doc.rejectionComment && <p className="mt-2 text-xs font-semibold text-rose-700">{doc.rejectionComment}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Voucher Eligibility</p>
            <p className="mt-1 text-sm text-slate-600">Required before application approval.</p>
            <div className="mt-4 grid gap-2">
              <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${voucherEligibility === "eligible" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}>
                <input type="radio" checked={voucherEligibility === "eligible"} onChange={() => setVoucherEligibility("eligible")} className="h-4 w-4 accent-blue-700" />
                <span className="text-sm font-black text-slate-900">Yes, Eligible</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${voucherEligibility === "not_eligible" ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white"}`}>
                <input type="radio" checked={voucherEligibility === "not_eligible"} onChange={() => setVoucherEligibility("not_eligible")} className="h-4 w-4 accent-rose-600" />
                <span className="text-sm font-black text-slate-900">No, Not Eligible</span>
              </label>
            </div>
            {existingVoucherStatus && <p className="mt-3 text-xs font-semibold text-slate-500">Saved decision: {String(existingVoucherStatus).replace("_", " ")}</p>}
          </section>
        </aside>

        <section className="flex min-h-[720px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-xl">
          <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-300">Document Viewer</p>
              <h2 className="truncate text-base font-black text-white">{selectedDocument?.label || "Select a document"}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setZoom((current) => Math.max(50, current - 10))} className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20" title="Zoom out">
                <Minus className="h-4 w-4" />
              </button>
              <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-900">{zoom}%</span>
              <button onClick={() => setZoom((current) => Math.min(180, current + 10))} className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20" title="Zoom in">
                <Plus className="h-4 w-4" />
              </button>
              {selectedDocument?.fileUrl && (
                <a href={selectedDocument.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20" title="Fullscreen">
                  <Maximize2 className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
            <button
              onClick={() => approveDocument()}
              disabled={!selectedDocument?.id || selectedDocument.status === "approved" || isProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:bg-slate-600"
            >
              <CheckCircle className="h-4 w-4" />
              Approve Document
            </button>
            <button
              onClick={() => {
                setDocRejectKey(selectedDocument?.key || null);
                setDocRejectReason(selectedDocument?.rejectionComment || "");
              }}
              disabled={!selectedDocument?.id || selectedDocument.status === "approved" || isProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-700 disabled:bg-slate-600"
            >
              <XCircle className="h-4 w-4" />
              Reject Document
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {selectedDocument?.fileUrl ? (
              selectedDocument.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="flex min-h-full items-start justify-center p-8">
                  <img
                    src={selectedDocument.fileUrl}
                    alt={selectedDocument.label}
                    style={{ transform: `scale(${zoom / 100})` }}
                    className="max-h-none max-w-full origin-top rounded-lg bg-white object-contain shadow-2xl transition-transform"
                  />
                </div>
              ) : (
                <iframe
                  src={selectedDocument.fileUrl}
                  title={selectedDocument.label}
                  style={{ width: `${zoom}%` }}
                  className="mx-auto h-full min-h-[760px] rounded-lg bg-white"
                />
              )
            ) : (
              <div className="flex h-full min-h-[560px] items-center justify-center text-center text-slate-300">
                <div>
                  <FileText className="mx-auto h-16 w-16 text-slate-500" />
                  <p className="mt-3 text-lg font-black">No uploaded file</p>
                  <p className="mt-1 text-sm text-slate-400">Select another document or ask the student to upload this requirement.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="sticky bottom-0 z-20 mt-5 rounded-xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-4">
            <span>{uploadedDocuments.length} uploaded</span>
            <span>{pendingDocuments.length} pending</span>
            <span>{rejectedDocuments.length} rejected</span>
            <span>{requiredApproved ? "Required docs complete" : "Required docs pending"}</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={() => setShowApplicationReject(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-md hover:bg-rose-700"
            >
              <XCircle className="h-4 w-4" />
              Reject Application
            </button>
            <button
              onClick={approveApplication}
              disabled={!requiredApproved || !voucherEligibility || isProcessing}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-md hover:bg-blue-800 disabled:bg-slate-300"
            >
              <ShieldCheck className="h-4 w-4" />
              Approve Application
            </button>
          </div>
        </div>
      </footer>

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
