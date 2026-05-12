import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  Maximize2,
  Minus,
  Search,
  ShieldCheck,
  XCircle,
  Zap,
  X,
  CircleCheck,
  CircleX,
  UserRoundCheck,
  UserRoundX,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../../components/LoadingState";
import {
  approveEnrollment,
  createAuditLog,
  enrollStudent,
  getAssessmentResultByStudentId,
  getPendingApplications,
  getStudentPaymentStatus,
  rejectEnrollment,
  resolveUserId,
  updateDocumentStatus,
  upsertEnrollmentProgress,
} from "../../../services/adminService";
import { triggerNotification } from "../../../services/notificationService";
import { supabase } from "../../../supabase";

type DocumentStatus = "pending_review" | "approved" | "rejected" | "missing";
type WorkspaceTab = "documents" | "form" | "history";
type ApprovalChoice = "eligible" | "not_eligible" | null;

const REQUIRED_DOCS = [
  { key: "form138", shortName: "Form 138", name: "Form 138 (Report Card)" },
  { key: "birthCertificate", shortName: "PSA", name: "PSA Birth Certificate" },
  { key: "idPicture", shortName: "2x2 ID", name: "2x2 ID Picture" },
  { key: "diploma", shortName: "Diploma", name: "Grade 10 Diploma" },
];

const OPTIONAL_DOCS = [
  { key: "goodMoral", shortName: "Good Moral", name: "Good Moral Certificate" },
  { key: "escCertificate", shortName: "ESC", name: "ESC Certificate" },
  { key: "form137", shortName: "Form 137", name: "Form 137" },
];

const ALL_DOCS = [...REQUIRED_DOCS, ...OPTIONAL_DOCS];
const PAYMENT_DONE = new Set(["completed", "verified", "approved", "paid"]);

const normalizeDocumentStatus = (status?: string | null, verified?: boolean): DocumentStatus => {
  if (status === "approved" || verified) return "approved";
  if (status === "rejected") return "rejected";
  if (status === "missing") return "missing";
  return "pending_review";
};

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

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleString();
};

const resolvePublicUrl = (filePath?: string | null, fileUrl?: string | null) => {
  if (fileUrl) return fileUrl;
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  return supabase.storage.from("enrollment_documents").getPublicUrl(filePath).data?.publicUrl || null;
};

const getStudentName = (enrollment: any) => {
  const form = parseFormData(enrollment?.form_data);
  return form.studentName || `${form.firstName || ""} ${form.lastName || ""}`.trim() || enrollment?.user_id || "Student";
};

const getTrack = (enrollment: any) => {
  const form = parseFormData(enrollment?.form_data);
  return form.preferredTrack || form.track || enrollment?.preferred_track || "Not set";
};

export function ApplicationReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, userRole } = useAuth();
  const actorReference = userData?.id || userData?.email || userRole || "registrar";
  const basePath = userRole === "branchcoordinator" ? "/branchcoordinator" : "/registrar";

  const [queue, setQueue] = useState<any[]>([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState<Array<string | number>>([]);
  const [queueSearch, setQueueSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("all");
  const [enrollment, setEnrollment] = useState<any>(null);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [selectedDocKey, setSelectedDocKey] = useState("form138");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("documents");
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalChoice, setApprovalChoice] = useState<ApprovalChoice>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showVoucherChecklist, setShowVoucherChecklist] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingRejectDocKey, setPendingRejectDocKey] = useState<string | null>(null);
  const [rejectionReasonDraft, setRejectionReasonDraft] = useState("");

  const [showApplicationRejectModal, setShowApplicationRejectModal] = useState(false);
  const [applicationRejectionReason, setApplicationRejectionReason] = useState("");
  
  const [voucherEligibility, setVoucherEligibility] = useState<"eligible" | "not_eligible" | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [focusMode, setFocusMode] = useState(false);

  const [zoom, setZoom] = useState(100);
  const [pageNumber, setPageNumber] = useState(1);

  const formData = useMemo(() => parseFormData(enrollment?.form_data), [enrollment]);
  const studentName = useMemo(() => getStudentName(enrollment), [enrollment]);
  const studentProfile = enrollment?.studentProfile || {};
  const studentInitials =
    studentName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join("") || "S";

  const documents = useMemo(() => {
    const uploaded = enrollment?.enrollment_documents || [];
    return ALL_DOCS.map((definition) => {
      const doc = uploaded.find((item: any) => item.document_type === definition.key);
      const status = doc ? normalizeDocumentStatus(doc.status, doc.verified) : "missing";
      const updatedAt = doc?.updated_at ? new Date(doc.updated_at).getTime() : 0;
      const uploadedAt = doc?.uploaded_at ? new Date(doc.uploaded_at).getTime() : 0;
        const hasRejectionRemarks = Boolean(doc?.rejection_comment || doc?.rejection_reason);
        const hasUploadTimestamps = Boolean(doc?.uploaded_at || doc?.updated_at);
        const hasNewerRevision = updatedAt > uploadedAt && uploadedAt > 0;

        // "Re-uploaded" should indicate a replacement upload after a rejection/missing decision.
        // We only have the current document row fields, so we narrow the signal to:
        // - student is currently in pending review
        // - there were remarks (rejected/missing cycle)
        // - and the record was updated after the initial upload timestamp
        const isReuploaded =
          status === "pending_review" && hasRejectionRemarks && hasUploadTimestamps && hasNewerRevision;

        return {
          ...definition,
          ...doc,
          status,
          fileUrl: resolvePublicUrl(doc?.file_path, doc?.file_url),
          fileName: doc?.file_name || (doc?.file_path || doc?.file_url || "").split("/").pop() || "No file uploaded",
          isRequired: REQUIRED_DOCS.some((required) => required.key === definition.key),
          rejectionComment: doc?.rejection_comment || doc?.rejection_reason || "",
          isReuploaded,
        };
    });
  }, [enrollment]);

  const selectedDocument = documents.find((doc) => doc.key === selectedDocKey) || documents[0];
  const pendingDocuments = documents.filter((doc) => doc.status === "pending_review" && doc.id);
  const approvedDocuments = documents.filter((doc) => doc.status === "approved" && doc.id);
  const rejectedDocuments = documents.filter((doc) => doc.status === "rejected" && doc.id);
  const requiredApproved = documents.filter((doc) => doc.isRequired).every((doc) => doc.status === "approved");
  const paymentVerified = PAYMENT_DONE.has(String(paymentStatus?.status || "").toLowerCase());
  const voucherDecisionMade = enrollment?.voucher_status && enrollment.voucher_status !== "pending";

  const prioritizedQueue = useMemo(() => {
    const normalizedSearch = queueSearch.trim().toLowerCase();
    return queue
      .map((item) => {
        const docs = item.enrollment_documents || [];
        const pending = docs.filter((doc: any) => normalizeDocumentStatus(doc.status, doc.verified) === "pending_review").length;
        const rejected = docs.filter((doc: any) => normalizeDocumentStatus(doc.status, doc.verified) === "rejected").length;
        const reuploaded = docs.some((doc: any) => {
          const updatedAt = doc?.updated_at ? new Date(doc.updated_at).getTime() : 0;
          const uploadedAt = doc?.uploaded_at ? new Date(doc.uploaded_at).getTime() : 0;
          return normalizeDocumentStatus(doc.status, doc.verified) === "pending_review" && updatedAt >= uploadedAt && Boolean(doc.rejection_comment);
        });
        return { ...item, pending, rejected, reuploaded, name: getStudentName(item), track: getTrack(item) };
      })
      .filter((item) => {
        const matchesSearch =
          !normalizedSearch ||
          item.name.toLowerCase().includes(normalizedSearch) ||
          String(item.user_id ?? "").toLowerCase().includes(normalizedSearch);
        const matchesFilter =
          queueFilter === "all" ||
          (queueFilter === "reuploaded" && item.reuploaded) ||
          (queueFilter === "pending" && item.pending > 0) ||
          (queueFilter === "rejected" && item.rejected > 0);
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => Number(b.reuploaded) - Number(a.reuploaded) || b.pending - a.pending);
  }, [queue, queueFilter, queueSearch]);

  const loadQueue = async () => {
    const { data, error } = await getPendingApplications();
    if (error) {
      console.error("Queue load error:", error);
      return;
    }
    const applications = data || [];
    const emails = [...new Set(applications.map((item: any) => item.user_id).filter(Boolean))];
    let userMap = new Map<string, any>();

    if (emails.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name, profile_picture_url")
        .in("email", emails);
      userMap = new Map((users || []).map((user: any) => [user.email, user]));
    }

    const enrichedApplications = applications.map((item: any) => ({
      ...item,
      studentProfile: userMap.get(item.user_id) || null,
    }));

    setQueue(enrichedApplications);

    if (!id && enrichedApplications.length > 0) {
      const firstApplicationId = enrichedApplications[0].id;
      console.log("Redirecting pending route to first application review ID:", firstApplicationId);
      navigate(`${basePath}/review/${firstApplicationId}`, { replace: true });
      return;
    }

    if (!id) {
      setEnrollment(null);
      setIsLoading(false);
    }
  };

  const loadReviewData = async (showLoader = true, targetId: string | number | undefined = id) => {
    console.log("loadReviewData called with targetId:", targetId, "current id:", id);
    if (!targetId) {
      console.log("No targetId provided, setting enrollment to null");
      setEnrollment(null);
      setIsLoading(false);
      return;
    }
    if (showLoader) setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*, enrollment_documents(*)")
        .eq("id", targetId)
        .maybeSingle();

      if (error) {
        console.error("Review load error:", error);
        toast.error(`Unable to load application review: ${error.message}`);
        setEnrollment(null);
        setIsLoading(false);
        return;
      }

      if (!data) {
        console.log("No enrollment data found for ID:", targetId);
        toast.error(`Application with ID ${targetId} not found`);
        setEnrollment(null);
        setIsLoading(false);
        return;
      }

      console.log("Enrollment data loaded:", data.id);
      let nextEnrollment = data;
      if (data?.user_id) {
        const { data: studentProfile } = await supabase
          .from("users")
          .select("id, email, full_name, profile_picture_url")
          .eq("email", data.user_id)
          .maybeSingle();
        nextEnrollment = { ...data, studentProfile: studentProfile || null };
      }

      setEnrollment(nextEnrollment);
      if (data) {
        const [score, payment] = await Promise.all([
          getAssessmentResultByStudentId(data.user_id),
          getStudentPaymentStatus(data.user_id),
        ]);
        setAssessmentScore(score);
        setPaymentStatus(payment?.data || null);

        const firstPending = (data.enrollment_documents || []).find((doc: any) => normalizeDocumentStatus(doc.status, doc.verified) === "pending_review");
        setSelectedDocKey((current) => firstPending?.document_type || current || "form138");
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Unexpected error in loadReviewData:", err);
      toast.error("An unexpected error occurred while loading the application");
      setEnrollment(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
    void loadReviewData();
  }, [id]);

  useEffect(() => {
    const status = String(enrollment?.voucher_status || formData?.voucher?.voucher_status || "");
    if (status === "eligible" || status === "not_eligible") {
      setVoucherEligibility(status);
    } else {
      setVoucherEligibility(null);
    }
  }, [enrollment?.id, enrollment?.voucher_status, formData?.voucher?.voucher_status]);

  useEffect(() => {
    if (!id) return;

    const docChannel = supabase
      .channel(`review-documents-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollment_documents", filter: `enrollment_id=eq.${id}` }, () => {
        void loadReviewData(false);
        void loadQueue();
      })
      .subscribe();

    const enrollmentChannel = supabase
      .channel(`review-enrollment-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments", filter: `id=eq.${id}` }, () => {
        void loadReviewData(false);
        void loadQueue();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(docChannel);
      void supabase.removeChannel(enrollmentChannel);
    };
  }, [id]);

  const moveToNextPendingDocument = (currentKey: string) => {
    const remaining = documents.filter((doc) => doc.key !== currentKey && doc.status === "pending_review" && doc.id);
    if (remaining.length > 0) {
      setSelectedDocKey(remaining[0].key);
      setRemarks(remaining[0].rejectionComment || "");
    }
  };

  const updateLocalDocument = (documentId: string, updates: Record<string, any>) => {
    setEnrollment((previous: any) => ({
      ...previous,
      enrollment_documents: (previous?.enrollment_documents || []).map((doc: any) =>
        doc.id === documentId ? { ...doc, ...updates } : doc
      ),
    }));
  };

  const approveDocument = async (documentKey = selectedDocKey) => {
    const doc = documents.find((item) => item.key === documentKey);
    if (!doc?.id) return;
    setIsProcessing(true);
    const { data, error } = await updateDocumentStatus(doc.id, "approved");
    setIsProcessing(false);
    if (error) {
      toast.error(error);
      return;
    }
    updateLocalDocument(doc.id, { ...(data || {}), status: "approved", rejection_comment: null });
    await createAuditLog(actorReference, "DOCUMENT_APPROVED", `Approved ${doc.name} for ${studentName}`, "success");
    toast.success(`${doc.name} approved`);
    setRemarks("");
    moveToNextPendingDocument(documentKey);
  };

  const rejectDocument = async (documentKey = selectedDocKey) => {
    const doc = documents.find((item) => item.key === documentKey);
    const reason = remarks.trim();
    if (!doc?.id || !reason) {
      toast.error("Remarks are required before rejecting a document.");
      return;
    }
    setIsProcessing(true);
    const { data, error } = await supabase
      .from("enrollment_documents")
      .update({
        status: "rejected",
        rejection_comment: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", doc.id)
      .select()
      .single();
    setIsProcessing(false);
    if (error) {
      toast.error(error.message || "Unable to reject document");
      return;
    }
    updateLocalDocument(doc.id, { ...(data || {}), status: "rejected", rejection_comment: reason });
    await triggerNotification(enrollment.user_id, "DOCUMENT_REJECTED", {
      documentName: doc.name,
      reason,
      message: "Your document was rejected and requires re-upload. Please upload a new copy to continue your enrollment.",
      actionLabel: "Re-upload Document",
      actionUrl: `/dashboard/my-documents?document=${doc.key}`,
    });
    await createAuditLog(actorReference, "DOCUMENT_REJECTED", `Rejected ${doc.name} for ${studentName}: ${reason}`, "warning");
    toast.success(`${doc.name} rejected. Student notified.`);
    setRemarks("");
    moveToNextPendingDocument(documentKey);
  };

  const openRejectModal = (documentKey = selectedDocKey) => {
    // Prevent rejecting documents if application is already approved
    if (enrollment?.status === "approved" || enrollment?.status === "enrolled") {
      toast.error("Cannot reject documents for an approved application.");
      return;
    }
    const doc = documents.find((item) => item.key === documentKey);
    // Prevent rejecting approved documents
    if (doc?.status === "approved") {
      toast.error("Cannot reject an already approved document.");
      return;
    }
    setPendingRejectDocKey(documentKey);
    setRejectionReasonDraft("");
    setShowRejectModal(true);
  };

  const confirmRejectFromModal = async () => {
    if (!pendingRejectDocKey) return;

    const targetKey = pendingRejectDocKey;
    const reason = rejectionReasonDraft.trim();
    if (!reason) {
      toast.error("Remarks/reason is required before rejecting a document.");
      return;
    }

    setRemarks(reason);
    setShowRejectModal(false);
    setPendingRejectDocKey(null);

    // Use the existing rejectDocument logic, now that remarks is set.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    await rejectDocument(targetKey!);
  };


  const approveAllReviewedDocuments = async () => {
    for (const doc of pendingDocuments) {
      const { data, error } = await updateDocumentStatus(doc.id, "approved");
      if (error) {
        toast.error(`Unable to approve ${doc.name}: ${error}`);
        return;
      }
      updateLocalDocument(doc.id, { ...(data || {}), status: "approved", rejection_comment: null });
    }
    await createAuditLog(actorReference, "DOCUMENTS_BULK_APPROVED", `Approved ${pendingDocuments.length} pending documents for ${studentName}`, "success");
    toast.success(`${pendingDocuments.length} pending document${pendingDocuments.length === 1 ? "" : "s"} approved.`);
  };

  const saveVoucherDecision = async (eligible: boolean) => {
    if (!enrollment) return null;
    const timestamp = new Date().toISOString();
    const voucherPayload = {
      voucher_status: eligible ? "eligible" : "not_eligible",
      voucher_type: "DepEd SHS Voucher Program",
      is_tuition_free: eligible,
      voucher_verified_by: actorReference,
      voucher_verified_at: timestamp,
      voucher_notes: eligible ? "Marked eligible during final approval." : "Marked not eligible during final approval.",
      tuition_balance_due: eligible ? 0 : undefined,
      tuition_payment_locked: eligible,
    };

    const nextFormData = {
      ...(formData || {}),
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

    if (result.error) {
      throw new Error(result.error.message);
    }

    setEnrollment((previous: any) => ({ ...previous, ...(result.data || {}) }));
    setSuccessMessage("Voucher eligibility has been successfully verified.");
    return result.data;
  };

  const startApproval = () => {
    if (!requiredApproved) {
      toast.error("Required documents must be approved first.");
      return;
    }
    if (!voucherEligibility) {
      toast.error("Please select voucher eligibility before approving.");
      return;
    }
    setApprovalChoice(voucherEligibility);
    void finishApproval(voucherEligibility === "eligible");
  };

  const finishApproval = async (eligible: boolean) => {
    if (!enrollment) return;

    setShowApprovalModal(false);
    setIsProcessing(true);
    try {
      await saveVoucherDecision(eligible);
      const studentUserId = await resolveUserId(enrollment.user_id);

      if (eligible) {
        await triggerNotification(enrollment.user_id, "VOUCHER_APPROVED", {
          message: "Congratulations! You are eligible for the DepEd Senior High School Voucher Program. Your tuition fees are covered.",
        });

        const { error } = await enrollStudent(enrollment.id, enrollment.user_id, actorReference);
        if (error) throw new Error(error);

        if (studentUserId) {
          await upsertEnrollmentProgress(studentUserId, [
            { step_name: "Documents Submitted", status: "completed" },
            { step_name: "Documents Verified", status: "completed" },
            { step_name: "Payment Submitted", status: "completed" },
            { step_name: "Payment Verified", status: "completed" },
            { step_name: "Enrolled", status: "completed" },
          ]);
        }

        await triggerNotification(enrollment.user_id, "ENROLLMENT_APPROVED", {
          message: "Congratulations! You are now officially enrolled.",
          enrollmentId: enrollment.id,
        });
        toast.success("Student enrolled with voucher coverage.");
        void loadQueue();
        void loadReviewData(false);
        return;
      }

      const { error } = await approveEnrollment(enrollment.id, actorReference);
      if (error) throw new Error(error);
      if (studentUserId) {
        await upsertEnrollmentProgress(studentUserId, [
          { step_name: "Documents Submitted", status: "completed" },
          { step_name: "Documents Verified", status: "completed" },
          { step_name: "Payment Submitted", status: "current" },
        ]);
      }
      await triggerNotification(enrollment.user_id, "DOCUMENTS_VERIFIED");
      toast.success("Application approved. Student can proceed to payment.");
      void loadReviewData(false);
      void loadQueue();
    } catch (error: any) {
      toast.error(error?.message || "Unable to approve application.");
    } finally {
      setIsProcessing(false);
    }
  };

  const moveToNextApplication = () => {
    const activeId = id || enrollment?.id;
    const currentIndex = prioritizedQueue.findIndex((item) => String(item.id) === String(activeId));
    const next = prioritizedQueue[currentIndex + 1] || prioritizedQueue.find((item) => String(item.id) !== String(activeId));
    if (next) navigate(`${basePath}/review/${next.id}`);
  };

  const rejectApplication = async () => {
    if (!enrollment || !applicationRejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    setIsProcessing(true);
    try {
      const { error } = await rejectEnrollment(enrollment.id, applicationRejectionReason.trim(), actorReference);
      if (error) throw new Error(error);
      
      await triggerNotification(enrollment.user_id, "ENROLLMENT_REJECTED", {
        message: `Your application was not approved. Reason: ${applicationRejectionReason.trim()}. If you believe this was a mistake, please contact the office.`,
      });
      
      await createAuditLog(actorReference, "APPLICATION_REJECTED", `Rejected application for ${studentName}: ${applicationRejectionReason.trim()}`, "warning");
      
      toast.success("Application rejected. Student notified.");
      setShowApplicationRejectModal(false);
      setApplicationRejectionReason("");
      void loadQueue();
      moveToNextApplication();
    } catch (error: any) {
      toast.error(error?.message || "Unable to reject application.");
    } finally {
      setIsProcessing(false);
    }
  };

  const bulkRejectApplications = async () => {
    if (selectedQueueIds.length === 0) return;
    for (const enrollmentId of selectedQueueIds) {
      const { error } = await rejectEnrollment(enrollmentId, "Bulk rejected from review queue.", actorReference);
      if (error) {
        toast.error(`Unable to reject ${enrollmentId}: ${error}`);
        return;
      }
    }
    toast.success("Selected applications rejected.");
    setSelectedQueueIds([]);
    void loadQueue();
  };

  const bulkApproveReviewedDocuments = async () => {
    if (selectedQueueIds.length === 0) return;
    for (const enrollmentId of selectedQueueIds) {
      const target = queue.find((item) => String(item.id) === String(enrollmentId));
      const docs = target?.enrollment_documents || [];
      for (const doc of docs) {
        if (normalizeDocumentStatus(doc.status, doc.verified) === "pending_review") {
          const { error } = await updateDocumentStatus(doc.id, "approved");
          if (error) {
            toast.error(`Unable to bulk approve document: ${error}`);
            return;
          }
        }
      }
    }
    toast.success("Pending documents approved for selected applications.");
    setSelectedQueueIds([]);
    void loadQueue();
    void loadReviewData(false);
  };

  const renderFieldGroup = (title: string, fields: Array<[string, any]>) => (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "Not provided"}</p>
          </div>
        ))}
      </div>
    </section>
  );

  if (isLoading) {
    return <LoadingState message="Loading review workspace..." subtext="Preparing queue, documents, and application context." />;
  }

  if (!enrollment) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(`${basePath}/pending`)} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </button>
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-900">Application not found</p>
          <p className="mt-2 text-sm text-slate-600">
            The application you're looking for doesn't exist or has been removed.
            <br />
            Application ID: {id || "None provided"}
          </p>
          <button
            onClick={() => navigate(`${basePath}/pending`)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            View All Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-[760px] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 text-slate-900 grid gap-4 p-4 ${
        focusMode
          ? "grid-cols-1"
          : "grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_320px]"
      }`}
    >
      <Toaster position="top-right" />
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">
          <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-sm font-bold shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
            Processing...
          </div>
        </div>
      )}

      {!focusMode && (
        <aside className="flex min-h-0 flex-col rounded-xl border border-slate-200/60 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 shadow-lg backdrop-blur-sm overflow-hidden lg:order-1">
          <div className="border-b border-slate-200/60 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 py-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-100">Application Queue</p>
            <p className="text-sm font-semibold text-white">{prioritizedQueue.length} active</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
                placeholder="Search students"
              />
            </div>
            <select
              value={queueFilter}
              onChange={(event) => setQueueFilter(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All applications</option>
              <option value="reuploaded">Re-uploaded first</option>
              <option value="pending">Has pending docs</option>
              <option value="rejected">Has rejected docs</option>
            </select>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedQueueIds(prioritizedQueue.map((item) => item.id))}
                className="rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedQueueIds([])}
                className="rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Clear Selection
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={bulkApproveReviewedDocuments} disabled={selectedQueueIds.length === 0} className="rounded-md bg-emerald-600 px-2 py-2 text-xs font-bold text-white disabled:bg-slate-300">
                Bulk Approve
              </button>
              <button onClick={bulkRejectApplications} disabled={selectedQueueIds.length === 0} className="rounded-md bg-rose-600 px-2 py-2 text-xs font-bold text-white disabled:bg-slate-300">
                Bulk Reject
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {prioritizedQueue.map((item) => {
              const selected = selectedQueueIds.includes(item.id);
              const active = String(item.id) === String(id || enrollment?.id);
              return (
                <div
                  key={item.id}
                  className={`mb-2 rounded-lg border p-3 transition ${active ? "border-blue-400 bg-blue-50" : item.reuploaded ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => {
                        setSelectedQueueIds((current) =>
                          event.target.checked ? [...current, item.id] : current.filter((value) => value !== item.id)
                        );
                      }}
                      className="mt-1"
                    />
                    <button onClick={() => navigate(`${basePath}/review/${item.id}`)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-start gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                          {item.studentProfile?.profile_picture_url ? (
                            <img src={item.studentProfile.profile_picture_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            ((item.studentProfile?.full_name || item.name || item.user_id || "Student") as string)
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part: string) => part[0]?.toUpperCase())
                              .join("") || "S"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">{item.studentProfile?.full_name || item.name || item.user_id || "Student"}</p>
                            {item.reuploaded && <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">Re-uploaded</span>}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{item.track}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold">
                        <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{String(item.status || "pending").replace(/_/g, " ")}</span>
                        {item.pending > 0 && <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">{item.pending} pending</span>}
                        {item.rejected > 0 && <span className="rounded bg-rose-100 px-2 py-1 text-rose-700">{item.rejected} rejected</span>}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      <main className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 shadow-lg backdrop-blur-sm lg:order-3">
        <header className="border-b border-slate-200 px-4 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                {studentProfile?.profile_picture_url ? (
                  <img src={studentProfile.profile_picture_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  studentInitials
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold text-slate-950">{studentProfile?.full_name || studentName}</h1>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">#{String(enrollment.id).slice(0, 8)}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Student ID: {String(enrollment.id).slice(0, 8)}</span>
                  <span>Academic Track/Strand: {getTrack(enrollment)}</span>
                  <span>Assessment: {assessmentScore !== null ? `${assessmentScore}%` : "Not taken"}</span>
                  <span>Application Status: {String(enrollment.status || "pending").replace(/_/g, " ")}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate(`${basePath}/pending`)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4" />
                Back to Applications
              </button>
              <button onClick={() => setActiveTab("form")} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                <Eye className="h-4 w-4" />
                View Full Enrollment Form
              </button>
              <button onClick={() => setFocusMode((current) => !current)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                <Zap className="h-4 w-4" />
                {focusMode ? "Exit Focus" : "Focus Mode"}
              </button>
            </div>
          </div>
        </header>

        <nav className="flex border-b border-slate-200 px-3">
          {[
            ["documents", "Documents"],
            ["form", "Enrollment Form"],
            ["history", "History"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as WorkspaceTab)}
              className={`border-b-2 px-4 py-3 text-sm font-bold transition ${activeTab === key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-hidden">
          {activeTab === "documents" && (
              <div className="flex h-full min-h-0 flex-col">
              <div className="flex gap-3 overflow-x-auto border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 shadow-inner">

                {/* Mobile/Tablet: keep tabs compact and avoid horizontal congestion */}
                {documents.map((doc) => (
                  <button
                    key={doc.key}
                    onClick={() => {
                      setSelectedDocKey(doc.key);
                      setRemarks(doc.rejectionComment || "");
                    }}
                    className={`shrink-0 rounded-lg border px-4 py-3 text-left text-sm font-bold transition-all duration-200 ${
                      selectedDocKey === doc.key 
                        ? "border-blue-400 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105" 
                        : "border-slate-600 bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200 hover:border-slate-500 hover:from-slate-600 hover:to-slate-700 hover:shadow-md"
                    }`}
                  >
                    <span>{doc.shortName}</span>
                    <span
                      className={`ml-3 rounded-full px-2 py-1 text-xs font-bold shadow-sm ${
                        doc.status === "approved"
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                          : doc.status === "rejected"
                          ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white"
                          : doc.status === "missing"
                          ? "bg-gradient-to-r from-slate-400 to-slate-500 text-white"
                          : "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                      }`}
                    >
                      {doc.status === "pending_review" ? "pending" : doc.status}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)]">

                <section className="flex min-h-0 flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  <div className="relative">
                  <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md p-2 shadow-xl border border-slate-200/50">
                    <button onClick={() => setZoom((current) => Math.max(50, current - 10))} className="rounded-lg p-3 hover:bg-slate-100 transition-all duration-200 hover:scale-110" title="Zoom out">
                      <Minus className="h-5 w-5 text-slate-700" />
                    </button>
                    <span className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-sm font-bold text-slate-800 border border-slate-200">{zoom}%</span>
                    <button onClick={() => setZoom((current) => Math.min(180, current + 10))} className="rounded-lg p-3 hover:bg-slate-100 transition-all duration-200 hover:scale-110" title="Zoom in">
                      <Plus className="h-5 w-5 text-slate-700" />
                    </button>
                    {selectedDocument?.fileUrl && (
                      <a href={selectedDocument.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-3 hover:bg-blue-50 transition-all duration-200 hover:scale-110" title="Fullscreen">
                        <Maximize2 className="h-5 w-5 text-blue-600" />
                      </a>
                    )}
                  </div>

                  <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md p-2 shadow-xl border border-slate-200/50">
                    <button
                      onClick={() => approveDocument()}
                      disabled={!selectedDocument?.id || selectedDocument.status === "approved"}
                      className="rounded-lg p-3 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110"
                      title={selectedDocument?.status === "approved" ? "Already approved" : "Approve document"}
                    >
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => openRejectModal()}
                      disabled={!selectedDocument?.id || selectedDocument.status === "approved" || enrollment?.status === "approved" || enrollment?.status === "enrolled"}
                      className="rounded-lg p-3 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110"
                      title={selectedDocument?.status === "approved" ? "Cannot reject approved documents" : enrollment?.status === "approved" || enrollment?.status === "enrolled" ? "Application approved" : "Reject document"}
                    >
                      <XCircle className="h-6 w-6 text-rose-600" />
                    </button>
                  </div>

                  <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-lg bg-white/95 backdrop-blur-sm p-2 text-sm font-bold shadow-lg border border-slate-200">
                    <button onClick={() => setPageNumber((current) => Math.max(1, current - 1))} className="rounded p-2 hover:bg-slate-100 transition-colors" title="Previous page">
                      <ChevronLeft className="h-5 w-5 text-slate-600" />
                    </button>
                    <span className="px-3 py-1 bg-slate-100 rounded text-slate-800 min-w-[60px] text-center">Page {pageNumber}</span>
                    <button onClick={() => setPageNumber((current) => current + 1)} className="rounded p-2 hover:bg-slate-100 transition-colors" title="Next page">
                      <ChevronRight className="h-5 w-5 text-slate-600" />
                    </button>
                  </div>

                  <div className="flex flex-1 items-center justify-center overflow-auto p-8 pt-16">
                    {selectedDocument?.fileUrl ? (
                      selectedDocument.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={selectedDocument.fileUrl}
                          alt={selectedDocument.name}
                          style={{ transform: `scale(${zoom / 100})` }}
                          className="max-h-full max-w-full origin-center object-contain transition-transform"
                        />
                      ) : (
                        <iframe
                          src={selectedDocument.fileUrl}
                          title={selectedDocument.name}
                          style={{ width: `${zoom}%` }}
                          className="h-full min-h-[620px] rounded bg-white"
                        />
                      )
                    ) : (
                      <div className="text-center text-slate-300">
                        <FileText className="mx-auto h-16 w-16 text-slate-500" />
                        <p className="mt-3 font-bold">No document available</p>
                        <p className="mt-1 text-sm text-slate-400">Mark missing if this requirement must be re-uploaded.</p>
                      </div>
                    )}
                  </div>

                  </div>
                </section>

                {/* Removed side details; badges remain within the document tab list only. */}

              </div>
            </div>
          )}

          {activeTab === "form" && (
            <div className="h-full overflow-y-auto bg-slate-50 p-4">
              <div className="grid gap-4 xl:grid-cols-2">
                {renderFieldGroup("Personal Information", [
                  ["Full Name", `${formData.lastName || ""}, ${formData.firstName || ""} ${formData.middleName || ""}`.trim()],
                  ["LRN", formData.lrn],
                  ["Birthday", formData.birthday || formData.birthDate],
                  ["Sex", formData.sex],
                  ["Civil Status", formData.civilStatus],
                  ["Nationality", formData.nationality],
                ])}
                {renderFieldGroup("Academic Information", [
                  ["Admission Type", formData.admissionType],
                  ["Preferred Track", formData.preferredTrack || formData.track],
                  ["Elective 1", formData.elective1],
                  ["Elective 2", formData.elective2],
                  ["Year Level", formData.yearLevel],
                  ["Grade 10 Adviser", formData.grade10Adviser],
                ])}
                {renderFieldGroup("Parent/Guardian Information", [
                  ["Father", `${formData.fatherFirstName || ""} ${formData.fatherLastName || ""}`.trim()],
                  ["Father Contact", formData.fatherContact],
                  ["Mother", `${formData.motherFirstName || ""} ${formData.motherLastName || ""}`.trim()],
                  ["Mother Contact", formData.motherContact],
                  ["Guardian", `${formData.guardianFirstName || ""} ${formData.guardianLastName || ""}`.trim()],
                  ["Guardian Contact", formData.guardianContact],
                ])}
                {renderFieldGroup("Contact Information", [
                  ["Email", formData.email || enrollment.user_id],
                  ["Contact Number", formData.contactNumber],
                  ["Facebook / Messenger", formData.facebookName],
                  ["Address", [formData.homeAddress, formData.barangay, formData.city, formData.province].filter(Boolean).join(", ")],
                ])}
                {renderFieldGroup("Additional Information", [
                  ["Working Student", formData.isWorkingStudent ? "Yes" : "No"],
                  ["4Ps Member", formData.is4PsMember ? "Yes" : "No"],
                  ["Disability", formData.disability],
                  ["Indigenous Group", formData.indigenousGroup],
                ])}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="h-full overflow-y-auto bg-slate-50 p-4">
              <section className="rounded-lg border border-slate-200 bg-white">
                {documents.map((doc) => (
                  <div key={doc.key} className="flex items-start justify-between gap-4 border-b border-slate-100 p-4 last:border-b-0">
                    <div>
                      <p className="font-bold text-slate-900">{doc.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{doc.fileName}</p>
                      {doc.rejectionComment && <p className="mt-1 text-sm text-rose-700">{doc.rejectionComment}</p>}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p className="font-bold text-slate-800">{doc.status.replace(/_/g, " ")}</p>
                      <p>{formatDateTime(doc.updated_at || doc.uploaded_at)}</p>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}
        </div>
      </main>

      <aside className="flex min-h-0 flex-col rounded-xl border border-slate-200/60 bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/20 shadow-lg backdrop-blur-sm overflow-hidden lg:order-2">
        <div className="border-b border-slate-200/60 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 px-4 py-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Document Tracking</p>
          <h2 className="mt-1 text-base font-bold text-white">Review Status</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-3">
          {/* Document Status List - Enhanced */}
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-slate-500">Approved</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{approvedDocuments.length}</span>
            </div>
            <div className="space-y-1">
              {approvedDocuments.length > 0 ? (
                approvedDocuments.map((doc) => (
                  <div key={doc.key} className="flex items-center justify-between gap-2 rounded px-2 py-2 bg-emerald-50 hover:bg-emerald-100/50 transition border border-emerald-100">
                    <span className="text-xs font-semibold text-slate-700">{doc.shortName}</span>
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2 italic">None reviewed yet</p>
              )}
            </div>
          </section>

          {/* Pending Documents */}
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-slate-500">Pending Review</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{pendingDocuments.length}</span>
            </div>
            <div className="space-y-1">
              {pendingDocuments.length > 0 ? (
                pendingDocuments.map((doc) => (
                  <button
                    key={doc.key}
                    onClick={() => {
                      setSelectedDocKey(doc.key);
                      setRemarks(doc.rejectionComment || "");
                    }}
                    className={`w-full text-left flex items-center justify-between gap-2 rounded px-2 py-2 transition ${
                      selectedDocKey === doc.key
                        ? "bg-amber-100 border border-amber-300 shadow-sm"
                        : "bg-amber-50 border border-amber-100 hover:bg-amber-100/70"
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-700 truncate">{doc.shortName}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {doc.isReuploaded && <span className="text-[10px] font-bold text-amber-600 bg-amber-200 rounded px-1">Re-uploaded</span>}
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2 italic">All reviewed</p>
              )}
            </div>
          </section>

          {/* Rejected Documents */}
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-slate-500">Rejected</p>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">{rejectedDocuments.length}</span>
            </div>
            <div className="space-y-1">
              {rejectedDocuments.length > 0 ? (
                rejectedDocuments.map((doc) => (
                  <div key={doc.key} className="flex items-center justify-between gap-2 rounded px-2 py-2 bg-rose-50 border border-rose-100">
                    <span className="text-xs font-semibold text-slate-700">{doc.shortName}</span>
                    <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2 italic">None rejected</p>
              )}
            </div>
          </section>

          {/* Application Status Checklist */}
          <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-emerald-50/30 p-4 shadow-lg hover:shadow-xl transition-all duration-200">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Approval Checklist
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 hover:from-slate-100 hover:to-slate-200 transition-all duration-200 hover:shadow-md">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  requiredApproved
                    ? "border-emerald-500 bg-emerald-50 shadow-emerald-200 shadow-md"
                    : "border-slate-300 bg-slate-50"
                }`}>
                  {requiredApproved && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                </div>
                <span className="text-sm font-semibold text-slate-700 flex-1">All required documents reviewed</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 hover:from-slate-100 hover:to-slate-200 transition-all duration-200 hover:shadow-md">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  voucherDecisionMade
                    ? "border-emerald-500 bg-emerald-50 shadow-emerald-200 shadow-md"
                    : "border-slate-300 bg-slate-50"
                }`}>
                  {voucherDecisionMade && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                </div>
                <span className="text-sm font-semibold text-slate-700 flex-1">Voucher decision made</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-blue-100 bg-white/85 p-4 shadow-lg backdrop-blur-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-600">Voucher Eligibility</p>
            <p className="mt-1 text-xs text-slate-500">Required before final application approval.</p>
            <div className="mt-4 space-y-2">
              <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition ${
                voucherEligibility === "eligible" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="voucherEligibilityInline"
                  checked={voucherEligibility === "eligible"}
                  onChange={() => setVoucherEligibility("eligible")}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm font-bold text-slate-800">Yes, Eligible</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition ${
                voucherEligibility === "not_eligible" ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="voucherEligibilityInline"
                  checked={voucherEligibility === "not_eligible"}
                  onChange={() => setVoucherEligibility("not_eligible")}
                  className="h-4 w-4 accent-rose-600"
                />
                <span className="text-sm font-bold text-slate-800">No, Not Eligible</span>
              </label>
            </div>
          </section>

          {/* Application Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => startApproval()}
              disabled={!requiredApproved || !voucherEligibility}
              className={`w-full flex items-center justify-center gap-3 rounded-xl px-4 py-4 text-sm font-bold text-white transition-all duration-200 hover:scale-105 ${
                requiredApproved && voucherEligibility
                  ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-lg hover:shadow-xl"
                  : "bg-slate-300 cursor-not-allowed shadow-sm"
              }`}
              title={!requiredApproved ? "Approve all required documents first." : !voucherEligibility ? "Select voucher eligibility first." : "Approve application"}
            >
              <ShieldCheck className="h-5 w-5" />
              Approve Application
            </button>

            <button
              onClick={() => setShowApplicationRejectModal(true)}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-200 hover:scale-105 border border-slate-300 shadow-md hover:shadow-lg"
            >
              <Trash2 className="h-4 w-4" />
              Reject Application
            </button>

            <button
              onClick={moveToNextApplication}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
            >
              Next Application
            </button>
          </div>
        </div>
      </aside>

      {showVoucherChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.40)] ring-1 ring-slate-200 overflow-hidden">
            <div className="bg-slate-950 px-8 py-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Document Verification</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Voucher Eligibility Review</h2>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-200">
                  Step 3 of 3
                </span>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_360px]">
              <section className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Review voucher eligibility</p>
                  <p className="text-sm text-slate-600">Select the correct eligibility status and confirm the final document verification outcome before proceeding.</p>
                </div>

                <div className="space-y-3">
                  <label className={`group flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 transition ${voucherEligibility === "eligible" ? "border-sky-500 bg-sky-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <input
                      type="radio"
                      name="voucherEligibility"
                      checked={voucherEligibility === "eligible"}
                      onChange={() => setVoucherEligibility("eligible")}
                      className="h-4 w-4 accent-sky-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Eligible for Voucher</p>
                      <p className="text-xs text-slate-500">This student meets all requirements for DepEd SHS voucher support.</p>
                    </div>
                  </label>

                  <label className={`group flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 transition ${voucherEligibility === "not_eligible" ? "border-amber-500 bg-amber-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <input
                      type="radio"
                      name="voucherEligibility"
                      checked={voucherEligibility === "not_eligible"}
                      onChange={() => setVoucherEligibility("not_eligible")}
                      className="h-4 w-4 accent-sky-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Not Eligible</p>
                      <p className="text-xs text-slate-500">Proceed with the normal payment workflow for enrollment.</p>
                    </div>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Required documents</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{REQUIRED_DOCS.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Pending review</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{pendingDocuments.length}</p>
                  </div>
                </div>
              </section>

              <aside className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Verification snapshot</p>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected document</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedDocument?.name || "Current document"}</p>
                    <p className="mt-1 text-xs text-slate-500">Status: {selectedDocument?.status.replace(/_/g, " ") || "Unknown"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Verification note</p>
                    <p className="mt-2 text-sm text-slate-600">Confirm that all required uploads are clear, valid, and match the student's application records.</p>
                  </div>
                </div>
              </aside>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => {
                  if (voucherEligibility) {
                    setApprovalChoice(voucherEligibility);
                    setShowVoucherChecklist(false);
                    setShowApprovalModal(true);
                  } else {
                    toast.error("Please select voucher eligibility.");
                  }
                }}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-700 sm:w-auto"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Confirm & Continue</span>
              </button>

              <button
                onClick={() => {
                  setShowVoucherChecklist(false);
                  setVoucherEligibility(null);
                }}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.40)] ring-1 ring-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-700 to-rose-600 px-8 py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-rose-100">Document Verification</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Reject Document</h2>
                </div>
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Needs re-upload</span>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_300px]">
              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Document details</p>
                  <p className="mt-3 text-sm text-slate-600">Reject this document only if it does not meet quality, completeness, or validity standards.</p>
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 border border-slate-200">
                      <span className="text-slate-500">Document</span>
                      <span className="font-semibold text-slate-900">{selectedDocument?.name || "Current selection"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 border border-slate-200">
                      <span className="text-slate-500">Current status</span>
                      <span className="font-semibold text-slate-900">{selectedDocument?.status.replace(/_/g, " ") || "Pending review"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Suggested reasons</p>
                  <div className="mt-3 grid gap-3">
                    {[
                      "Blurry or unreadable image",
                      "Document details do not match application",
                      "Missing required signature or stamp",
                    ].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setRejectionReasonDraft(reason)}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Rejection reason</label>
                  <textarea
                    value={rejectionReasonDraft}
                    onChange={(e) => setRejectionReasonDraft(e.target.value)}
                    placeholder="Example: Photo is too dark and signature is not visible. Please upload a clear scanned copy."
                    className="min-h-[180px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={confirmRejectFromModal}
                    disabled={!rejectionReasonDraft.trim() || isProcessing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <XCircle className="h-4 w-4" />
                    {isProcessing ? "Processing..." : "Send Rejection"}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(false)}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.40)] ring-1 ring-slate-200 overflow-hidden">
            <div className={`flex flex-col gap-3 px-8 py-6 ${
              approvalChoice === "eligible"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-700"
                : "bg-gradient-to-r from-slate-700 to-slate-900"
            }`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-emerald-100/80">Verification Summary</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {approvalChoice === "eligible" ? "Voucher Ready for Approval" : "Ready to Finalize"}
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/90"></span>
                  {approvalChoice === "eligible" ? "Voucher eligible" : "Voucher not eligible"}
                </div>
              </div>
              <p className="text-sm text-slate-100/90">
                Review the document verification status and confirm the final application approval with the appropriate voucher decision.
              </p>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_360px]">
              <section className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Pending</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">{pendingDocuments.length}</p>
                    <p className="mt-1 text-xs text-slate-500">Documents still under review</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Rejected</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">{rejectedDocuments.length}</p>
                    <p className="mt-1 text-xs text-slate-500">Require re-upload or correction</p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900 mb-4">Document verification checklist</p>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{doc.shortName}</p>
                          <p className="text-xs text-slate-500">{doc.name}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          doc.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : doc.status === "rejected"
                            ? "bg-rose-100 text-rose-700"
                            : doc.status === "missing"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {doc.status === "pending_review" ? "Pending" : doc.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected student</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{studentProfile?.full_name || studentName}</p>
                  <p className="mt-1 text-xs text-slate-500">Track: {getTrack(enrollment)}</p>
                </div>

                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Final action</p>
                  <p className="mt-3 text-sm text-slate-700">
                    {approvalChoice === "eligible"
                      ? "Approve application and enroll with voucher coverage."
                      : "Approve application for normal payment processing."
                    }
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-4 border border-slate-200">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Verification notes</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>• Confirm document authenticity and suitability.</li>
                    <li>• Ensure forms are legible and complete.</li>
                    <li>• Submit final approval once all checks are complete.</li>
                  </ul>
                </div>
              </aside>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => void finishApproval(approvalChoice === "eligible")}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl sm:w-auto ${
                  approvalChoice === "eligible"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Confirm & Proceed
              </button>

              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalChoice(null);
                }}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showApplicationRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-rose-200 bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Reject Application</h2>
              <p className="mt-1 text-sm text-rose-100">
                Provide a clear reason for rejection
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Important:</span> The student will be notified with this rejection reason. Be professional and specific.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Rejection Reason</label>
                <textarea
                  value={applicationRejectionReason}
                  onChange={(e) => setApplicationRejectionReason(e.target.value)}
                  placeholder="Example: Incomplete documents. Please verify all required forms are submitted and properly filled out."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 resize-none"
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={rejectApplication}
                  disabled={!applicationRejectionReason.trim() || isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 px-4 py-3 text-sm font-bold text-white transition shadow-md hover:shadow-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  {isProcessing ? "Processing..." : "Confirm Rejection"}
                </button>
                <button
                  onClick={() => {
                    setShowApplicationRejectModal(false);
                    setApplicationRejectionReason("");
                  }}
                  disabled={isProcessing}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-950">Verification Complete</h2>
            <p className="mt-2 text-sm text-slate-600">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage("")}
              className="mt-5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
