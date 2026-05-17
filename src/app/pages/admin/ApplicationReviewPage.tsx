import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  CheckCircle,
  Download,
  FileCheck,
  FileQuestion,
  FileText,
  GraduationCap,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { type ComponentType, type ReactNode, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../../components/LoadingState";
import { ProcessingModal } from "../../components/modals/ProcessingModal";
import { ConfirmationModal } from "../../components/ConfirmationModal";
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
import { loadProfileImageUrl } from "../../utils/profileImage";

type DocumentStatus = "pending" | "approved" | "rejected" | "missing";
type VoucherEligibility = "eligible" | "not_eligible" | null;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DOCUMENTS = [
  { key: "form138", label: "Form 138", required: true },
  { key: "birthCertificate", label: "PSA Birth Certificate", required: true },
  { key: "goodMoral", label: "Good Moral Certificate", required: false },
  { key: "idPicture", label: "2x2 ID Picture", required: true },
  { key: "diploma", label: "Grade 10 Diploma", required: true },
  { key: "form137", label: "Form 137", required: false },
  { key: "escCertificate", label: "ESC Certificate", required: false },
];

const isAdmissionType = (formData: any, admissionType: string) =>
  String(formData?.admissionType || formData?.admission_type || "").toLowerCase() === admissionType.toLowerCase();

const formatAdmissionType = (admissionType?: string | null) =>
  admissionType === "New Regular" ? "Regular" : admissionType || "Regular";

const getAdmissionTypeStyle = (admissionType?: string | null) => {
  switch (admissionType) {
    case "Transferee":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "Returnee":
      return "border-blue-200 bg-blue-50 text-blue-800";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
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

const getGuardianFromParent = (data: any = {}) => {
  if (data.guardianSource === "father" || data.guardian_source === "father") {
    return {
      guardianLastName: data.fatherLastName || data.father_last_name || "",
      guardianFirstName: data.fatherFirstName || data.father_first_name || "",
      guardianMiddleName: data.fatherMiddleName || data.father_middle_name || "",
      guardianOccupation: data.fatherOccupation || data.father_occupation || "",
      guardianContact: data.fatherContact || data.father_contact || "",
    };
  }

  if (data.guardianSource === "mother" || data.guardian_source === "mother") {
    return {
      guardianLastName: data.motherLastName || data.mother_last_name || "",
      guardianFirstName: data.motherFirstName || data.mother_first_name || "",
      guardianMiddleName: data.motherMiddleName || data.mother_middle_name || "",
      guardianOccupation: data.motherOccupation || data.mother_occupation || "",
      guardianContact: data.motherContact || data.mother_contact || "",
    };
  }

  return {
    guardianLastName: data.guardianLastName || data.guardian_last_name || "",
    guardianFirstName: data.guardianFirstName || data.guardian_first_name || "",
    guardianMiddleName: data.guardianMiddleName || data.guardian_middle_name || "",
    guardianOccupation: data.guardianOccupation || data.guardian_occupation || "",
    guardianContact: data.guardianContact || data.guardian_contact || "",
  };
};

const applyGuardianSelection = (data: any = {}) => ({
  ...data,
  ...getGuardianFromParent(data),
});

const publicUrl = (filePath?: string | null, fileUrl?: string | null) => {
  if (fileUrl) return fileUrl;
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  return supabase.storage.from("enrollment_documents").getPublicUrl(filePath).data?.publicUrl || null;
};

const getFileExtension = (fileNameOrUrl?: string | null) => {
  const cleanValue = String(fileNameOrUrl || "").split("?")[0].split("#")[0];
  const extension = cleanValue.split(".").pop();
  return extension && extension !== cleanValue ? extension.toLowerCase() : "";
};

const getDocumentPreviewType = (fileName?: string | null, fileUrl?: string | null) => {
  const extension = getFileExtension(fileName) || getFileExtension(fileUrl);

  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"].includes(extension)) return "image";
  if (extension === "pdf") return "pdf";
  if (["txt", "csv", "json", "xml", "html", "htm"].includes(extension)) return "text";
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(extension)) return "office";
  if (["mp4", "webm", "ogg", "mov"].includes(extension)) return "video";
  if (["mp3", "wav", "m4a", "aac", "oga"].includes(extension)) return "audio";

  return "download";
};

const getOfficePreviewUrl = (fileUrl: string) =>
  `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(fileUrl)}`;

const normalizeStatus = (doc: any): DocumentStatus => {
  if (!doc) return "missing";
  if (doc.status === "approved" || doc.verified) return "approved";
  if (doc.status === "rejected") return "rejected";
  return "pending";
};

const getRecordTimestamp = (record: any) => {
  const value = record?.updated_at || record?.uploaded_at || record?.created_at;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const isFilled = (value: any) => {
  if (value === false || value === true || value === 0) return true;
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && String(value).trim() !== "";
};

const getFormProfileImageUrl = (data: any = {}) =>
  data.profilePictureUrl ||
  data.profile_picture_url ||
  data.profilePhotoUrl ||
  data.profile_photo_url ||
  data.photoUrl ||
  data.photo_url ||
  data.idPictureUrl ||
  data.id_picture_url ||
  "";

const loadApplicantProfile = async (enrollmentRecord: any, loadedFormData: any) => {
  const userReference = String(enrollmentRecord?.user_id || "").trim();
  const formEmail = String(
    loadedFormData?.email ||
      loadedFormData?.emailAddress ||
      loadedFormData?.email_address ||
      enrollmentRecord?.email ||
      ""
  ).trim();
  const lookupReferences = Array.from(new Set([userReference, formEmail].filter(Boolean)));
  let profile: any = null;

  for (const reference of lookupReferences) {
    const profileQuery = supabase
      .from("users")
      .select("id, email, full_name, profile_picture_url");
    const { data } = UUID_PATTERN.test(reference)
      ? await profileQuery.eq("id", reference).maybeSingle()
      : await profileQuery.eq("email", reference).maybeSingle();

    if (data) {
      profile = data;
      break;
    }
  }

  const resolvedUserId = profile?.id || (UUID_PATTERN.test(userReference) ? userReference : "");
  const resolvedEmail = profile?.email || formEmail || (!UUID_PATTERN.test(userReference) ? userReference : "");
  const imageUrl =
    profile?.profile_picture_url ||
    getFormProfileImageUrl(loadedFormData) ||
    (await loadProfileImageUrl(resolvedUserId, resolvedEmail));

  return { profile, imageUrl };
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
  const [processingState, setProcessingState] = useState<{
    active: boolean;
    title: string;
    message: string;
  }>({
    active: false,
    title: "Processing",
    message: "Please wait...",
  });
  const [selectedDocKey, setSelectedDocKey] = useState(DOCUMENTS[0].key);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [showForm, setShowForm] = useState(false);
  const [voucherEligibility, setVoucherEligibility] = useState<VoucherEligibility>(null);
  const [docRejectKey, setDocRejectKey] = useState<string | null>(null);
  const [docRejectKeys, setDocRejectKeys] = useState<string[]>([]);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [showApplicationReject, setShowApplicationReject] = useState(false);
  const [applicationRejectReason, setApplicationRejectReason] = useState("");
  const [resolvedProfileImageUrl, setResolvedProfileImageUrl] = useState("");
  const [rejectionConfirmation, setRejectionConfirmation] = useState<{ name: string; reason: string } | null>(null);
  const [showApprovalValidation, setShowApprovalValidation] = useState(false);
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);

  const formData = useMemo(() => applyGuardianSelection(parseFormData(enrollment?.form_data)), [enrollment]);
  const isTransferee = isAdmissionType(formData, "Transferee");
  const isReturnee = isAdmissionType(formData, "Returnee");
  const admissionType = formData.admissionType || formData.admission_type || "New Regular";
  const yearLevel = formData.yearLevel || formData.year_level || "Not set";
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
  const studentProfilePictureUrl =
    resolvedProfileImageUrl ||
    studentProfile?.profile_picture_url ||
    getFormProfileImageUrl(formData) ||
    null;

  const documents = useMemo(() => {
    const uploaded = enrollment?.enrollment_documents || [];
    return DOCUMENTS.map((definition) => {
      const required =
        definition.required ||
        (isTransferee && (definition.key === "form137" || definition.key === "goodMoral"));
      const documentVersions = uploaded
        .filter((item: any) => item.document_type === definition.key)
        .sort((a: any, b: any) => getRecordTimestamp(b) - getRecordTimestamp(a));
      const doc = documentVersions[0];
      const latestStatus = normalizeStatus(doc);
      const hasRejectedVersion = documentVersions.some((item: any, index: number) => index > 0 && normalizeStatus(item) === "rejected");
      const reuploadedForReview =
        Boolean(doc) &&
        latestStatus === "pending" &&
        (doc?.status === "reuploaded" || hasRejectedVersion || Boolean(doc?.rejection_comment || doc?.rejection_reason));
      return {
        ...definition,
        required,
        ...doc,
        status: latestStatus,
        versions: documentVersions,
        reuploadedForReview,
        reviewState: !doc
          ? "Missing"
          : reuploadedForReview
          ? "Re-uploaded for Review"
          : latestStatus === "approved"
          ? "Approved"
          : latestStatus === "rejected"
          ? "Rejected"
          : "Pending Review",
        fileUrl: publicUrl(doc?.file_path, doc?.file_url),
        fileName: doc?.file_name || (doc?.file_path || doc?.file_url || "").split("/").pop() || "No file uploaded",
        rejectionComment: doc?.rejection_comment || doc?.rejection_reason || "",
      };
    });
  }, [enrollment, isTransferee]);

  const selectedDocument = documents.find((doc) => doc.key === selectedDocKey) || documents[0];
  const canReviewDocument = (doc: any) => Boolean(doc?.id) && (doc.status === "pending" || doc.reuploadedForReview);
  const actionableDocuments = documents.filter((doc) => canReviewDocument(doc));
  const selectedActionableDocs = selectedDocs.filter((key) => {
    const doc = documents.find((item) => item.key === key);
    return canReviewDocument(doc);
  });
  const existingVoucherStatus = enrollment?.voucher_status || formData?.voucher?.voucher_status;
  const missingRequiredDocuments = documents.filter((doc) => doc.required && !doc.id);
  const unapprovedRequiredDocuments = documents.filter((doc) => doc.required && doc.id && doc.status !== "approved");
  // Check for uploaded documents (required or optional) that are not yet approved
  const unapprovedUploadedDocuments = documents.filter((doc) => doc.id && doc.status !== "approved");

  const requiredFieldGroups = [
    {
      label: "Basic Information",
      fields: [
        ["Admission Type", formData.admissionType],
        ...(isReturnee ? [["Previous Student ID", formData.previousStudentId || formData.previous_student_id]] : []),
        ...(isTransferee
          ? [
              ["Previous School Name", formData.previousSchoolName || formData.previous_school_name],
              ["Previous School Address", formData.previousSchoolAddress || formData.previous_school_address],
              ["Previous Track / Strand", formData.previousTrack || formData.previous_track],
              ["Last Grade Level Completed", formData.lastGradeLevelCompleted || formData.last_grade_level_completed],
              ["Reason for Transfer", formData.transferReason || formData.transfer_reason],
            ]
          : []),
        ...(isReturnee
          ? [
              ["Last Grade Level Completed", formData.lastGradeLevelCompleted || formData.last_grade_level_completed],
              ["Last School Year Attended", formData.lastSchoolYearAttended || formData.last_school_year_attended],
              ["Reason for Returning", formData.returneeReason || formData.returnee_reason],
            ]
          : []),
        ["LRN", formData.lrn],
        ["First Name", formData.firstName],
        ["Last Name", formData.lastName],
        ["Sex", formData.sex],
        ["Civil Status", formData.civilStatus],
        ["Religion", formData.religion],
        ["Nationality", formData.nationality],
        ["Birthday", formData.birthday || formData.birthDate],
        ["Email", formData.email || enrollment?.user_id],
        ["Contact Number", formData.contactNumber],
        ["Facebook / Messenger Name", formData.facebookName],
      ],
    },
    {
      label: "Address",
      fields: [
        ["Region", formData.region],
        ["City / Municipality", formData.city],
        ["Barangay", formData.barangay],
        ["Home Address", formData.homeAddress],
      ],
    },
    {
      label: "Parent / Guardian",
      fields: [
        ["Father's Last Name", formData.fatherLastName],
        ["Father's First Name", formData.fatherFirstName],
        ["Father's Occupation", formData.fatherOccupation],
        ["Father's Contact Number", formData.fatherContact],
        ["Mother's Maiden Name", formData.motherMaidenName],
        ["Mother's Last Name", formData.motherLastName],
        ["Mother's First Name", formData.motherFirstName],
        ["Mother's Occupation", formData.motherOccupation],
        ["Mother's Contact Number", formData.motherContact],
        ["Guardian Source / Relationship", formData.guardianSource || formData.guardianFirstName],
        ["Guardian Last Name", formData.guardianLastName],
        ["Guardian First Name", formData.guardianFirstName],
        ["Guardian Occupation", formData.guardianOccupation],
        ["Guardian Contact Number", formData.guardianContact],
      ],
    },
    {
      label: "Enrollment and Education",
      fields: [
        ["Preferred Track", formData.preferredTrack || formData.track],
        ["Elective 1", formData.elective1],
        ["Elective 2", formData.elective2],
        ["Year Level", formData.yearLevel],
        ["Primary School", formData.primarySchool],
        ["Primary Year Graduated", formData.primaryYearGraduated],
        ["Secondary School", formData.secondarySchool],
        ["Secondary Year Graduated", formData.secondaryYearGraduated],
        ...(formData.admissionType === "New Regular" ? [["Grade 10 Adviser", formData.grade10Adviser]] : []),
      ],
    },
  ];

  const missingFieldGroups = requiredFieldGroups
    .map((group) => ({
      label: group.label,
      fields: group.fields.filter(([, value]) => !isFilled(value)).map(([label]) => String(label)),
    }))
    .filter((group) => group.fields.length > 0);

  const approvalBlockers = [
    ...missingFieldGroups.flatMap((group) =>
      group.fields.map((field) => `Missing required information: ${group.label} - ${field}.`)
    ),
    ...missingRequiredDocuments.map((doc) => `${doc.label} has not been uploaded.`),
    ...unapprovedUploadedDocuments.map((doc) => {
      if (doc.required) {
        return `${doc.label} is not yet approved.`;
      }

      return `${doc.label} has been uploaded but has not yet been reviewed.`;
    }),
    ...(voucherEligibility ? [] : ["Voucher eligibility has not yet been selected."]),
  ];
  const canApproveApplication = approvalBlockers.length === 0;

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

    const loadedFormData = applyGuardianSelection(parseFormData(data.form_data));
    if (data.user_id || loadedFormData.email) {
      const { profile, imageUrl } = await loadApplicantProfile(data, loadedFormData);
      setStudentProfile(profile || null);
      setResolvedProfileImageUrl(imageUrl);
    } else {
      setStudentProfile(null);
      setResolvedProfileImageUrl("");
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
    if (!canReviewDocument(doc)) {
      toast.error(`${doc.label} has already been reviewed. A new upload is required before another review action.`);
      return;
    }

    setProcessingState({
      active: true,
      title: `Approving ${doc.label}`,
      message: "Processing document approval...",
    });

    const { data, error } = await updateDocumentStatus(doc.id, "approved");

    setProcessingState({ active: false, title: "", message: "" });

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
    const targetKeys = docRejectKeys.length > 0 ? docRejectKeys : docRejectKey ? [docRejectKey] : [];
    if (targetKeys.length === 0 || !docRejectReason.trim()) {
      toast.error("Rejection notes are required.");
      return;
    }

    setProcessingState({
      active: true,
      title: `Rejecting ${targetKeys.length > 1 ? "Documents" : "Document"}`,
      message: "Processing document rejection...",
    });

    for (const key of targetKeys) {
      const doc = documents.find((item) => item.key === key);
      if (!doc?.id || !canReviewDocument(doc)) continue;

      const { data, error } = await updateDocumentStatus(doc.id, "rejected", docRejectReason.trim());
      if (error) {
        setProcessingState({ active: false, title: "", message: "" });
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
    }

    setProcessingState({ active: false, title: "", message: "" });
    toast.success(`${targetKeys.length} document${targetKeys.length === 1 ? "" : "s"} rejected. Student notified.`);
    setDocRejectKey(null);
    setDocRejectKeys([]);
    setSelectedDocs([]);
    setDocRejectReason("");
    goToNextPendingDocument(targetKeys[0]);
  };

  const approveSelectedDocuments = async () => {
    const keys = selectedDocs.filter((key) => {
      const doc = documents.find((item) => item.key === key);
      return canReviewDocument(doc);
    });
    if (keys.length === 0) {
      toast.error("Select at least one document that is pending review or re-uploaded for review.");
      return;
    }

    setProcessingState({
      active: true,
      title: `Approving ${keys.length} Document${keys.length === 1 ? "" : "s"}`,
      message: "Processing bulk document approval...",
    });

    for (const key of keys) {
      const doc = documents.find((item) => item.key === key);
      if (!doc?.id || !canReviewDocument(doc)) continue;
      const { data, error } = await updateDocumentStatus(doc.id, "approved");
      if (error) {
        setProcessingState({ active: false, title: "", message: "" });
        toast.error(error);
        return;
      }
      updateLocalDocument(doc.id, { ...(data || {}), status: "approved", rejection_comment: null });
      await createAuditLog(actorReference, "DOCUMENT_APPROVED", `Approved ${doc.label} for ${studentName}`, "success");
    }
    setProcessingState({ active: false, title: "", message: "" });
    setSelectedDocs([]);
    toast.success(`${keys.length} document${keys.length === 1 ? "" : "s"} approved.`);
    goToNextPendingDocument(keys[0]);
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
      voucher_status: voucherEligibility,
      is_tuition_free: eligible,
      tuition_balance_due: eligible ? 0 : formData.tuition_balance_due,
      tuition_payment_locked: eligible,
      payment_required: !eligible,
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
    if (!canApproveApplication) {
      setShowApprovalValidation(true);
      return;
    }

    setShowApprovalConfirm(false);
    setProcessingState({
      active: true,
      title: "Approving Application",
      message: "Processing application approval and enrollment...",
    });

    try {
      const savedEnrollment = await saveVoucherDecision();
      const isVoucherEligible = voucherEligibility === "eligible";

      if (isVoucherEligible) {
        const { error } = await supabase
          .from("enrollments")
          .update({
            status: "enrolled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", enrollment.id);
        if (error) throw new Error(error);

        await createAuditLog(
          actorReference,
          "STUDENT_ENROLLED_VOUCHER",
          `Student enrolled via DepEd SHS Voucher coverage: ${enrollment.user_id} (Enrollment: ${enrollment.id})`,
          "success"
        );
      } else {
        const { error } = await approveEnrollment(enrollment.id, actorReference);
        if (error) throw new Error(error);
      }

      const studentUserId = await resolveUserId(enrollment.user_id);
      if (studentUserId) {
        if (isVoucherEligible) {
          await upsertEnrollmentProgress(studentUserId, [
            { step_name: "Documents Submitted", status: "completed" },
            { step_name: "Documents Verified", status: "completed" },
            { step_name: "Payment Submitted", status: "completed" },
            { step_name: "Payment Verified", status: "completed" },
            { step_name: "Enrolled", status: "completed" },
          ]);
        } else {
          await upsertEnrollmentProgress(studentUserId, [
            { step_name: "Documents Submitted", status: "completed" },
            { step_name: "Documents Verified", status: "completed" },
            { step_name: "Payment Submitted", status: "current" },
          ]);
        }
      }

      if (isVoucherEligible) {
        await triggerNotification(enrollment.user_id, "VOUCHER_ELIGIBLE", {
          enrollmentId: enrollment.id,
          tuitionBalanceDue: 0,
        });
        await triggerNotification(enrollment.user_id, "OFFICIALLY_ENROLLED", {
          enrollmentId: enrollment.id,
          status: "enrolled",
        });
        setEnrollment((current: any) => ({
          ...current,
          ...(savedEnrollment || {}),
          status: "enrolled",
        }));
        toast.success("Application approved. Voucher covers tuition and the student is officially enrolled.");
      } else {
        await triggerNotification(enrollment.user_id, "DOCUMENTS_VERIFIED");
        toast.success("Application approved. Student can proceed to payment.");
      }
      navigate(`${basePath}/pending`);
    } catch (error: any) {
      toast.error(error?.message || "Unable to approve application.");
    } finally {
      setProcessingState({ active: false, title: "", message: "" });
    }
  };

  const rejectApplication = async () => {
    if (!applicationRejectReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }

    setProcessingState({
      active: true,
      title: "Rejecting Application",
      message: "Processing application rejection...",
    });

    const { error } = await rejectEnrollment(enrollment.id, applicationRejectReason.trim(), actorReference);
    setProcessingState({ active: false, title: "", message: "" });

    if (error) {
      toast.error(error);
      return;
    }

    await triggerNotification(enrollment.user_id, "ENROLLMENT_REJECTED", {
      reason: applicationRejectReason.trim(),
    });
    setEnrollment((current: any) => ({
      ...current,
      status: "rejected",
      rejection_reason: applicationRejectReason.trim(),
      updated_at: new Date().toISOString(),
    }));
    setShowApplicationReject(false);
    setRejectionConfirmation({ name: studentName, reason: applicationRejectReason.trim() });
    setApplicationRejectReason("");
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

  const fullName = `${formData.lastName || ""}, ${formData.firstName || ""} ${formData.middleName || ""}`.trim();
  const fatherName = `${formData.fatherLastName || ""}, ${formData.fatherFirstName || ""} ${formData.fatherMiddleName || ""}`.trim();
  const motherName = `${formData.motherLastName || ""}, ${formData.motherFirstName || ""} ${formData.motherMiddleName || ""}`.trim();
  const guardianName = `${formData.guardianLastName || ""}, ${formData.guardianFirstName || ""} ${formData.guardianMiddleName || ""}`.trim();
  const guardianRelationship =
    formData.guardianSource === "father"
      ? "Father"
      : formData.guardianSource === "mother"
      ? "Mother"
      : "Manual";
  const hasDocument = (documentKey: string) => documents.some((doc) => doc.key === documentKey && doc.id);

  const renderSubmittedField = (label: string, value: any, className = "") => (
    <div className={className}>
      <span className="text-slate-500">{label}:</span>{" "}
      <span className="font-medium text-slate-900">{formatFieldValue(value)}</span>
    </div>
  );

  const renderEnrollmentSection = (
    title: string,
    Icon: ComponentType<{ className?: string }>,
    children: ReactNode,
    subtitle?: string
  ) => (
    <section className="rounded-2xl border border-white/70 bg-white/55 p-5 shadow-lg shadow-blue-950/5 ring-1 ring-blue-100/40 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-xl">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-full bg-gradient-to-br from-blue-800 to-sky-600 p-2.5 text-white shadow-lg shadow-blue-700/20">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );

  const renderDocumentPreview = () => {
    if (!selectedDocument?.fileUrl) {
      return (
        <div className="flex h-full min-h-[52vh] items-center justify-center text-center text-slate-400">
          <div>
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm font-black">No uploaded file</p>
            <p className="mt-1 text-xs">Select another document or ask the student to upload this requirement.</p>
          </div>
        </div>
      );
    }

    const fileUrl = selectedDocument.fileUrl;
    const previewType = getDocumentPreviewType(selectedDocument.fileName, fileUrl);
    const scaledStyle = { transform: `scale(${zoom / 100})`, transformOrigin: "center" };

    if (previewType === "image") {
      return (
        <div className="flex h-full w-full items-center justify-center overflow-auto rounded-2xl bg-white/60">
          <img
            src={fileUrl}
            alt={selectedDocument.label}
            style={scaledStyle}
            className="max-h-full max-w-full origin-center rounded bg-white object-contain transition-transform"
          />
        </div>
      );
    }

    if (previewType === "pdf" || previewType === "text") {
      return (
        <div className="h-full w-full overflow-hidden rounded-2xl bg-white">
          <object data={fileUrl} type={previewType === "pdf" ? "application/pdf" : "text/plain"} className="h-full w-full rounded bg-white">
            <iframe src={fileUrl} title={selectedDocument.label} style={scaledStyle} className="h-full w-full rounded bg-white transition-transform" />
          </object>
        </div>
      );
    }

    if (previewType === "office") {
      return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white">
          <iframe
            src={getOfficePreviewUrl(fileUrl)}
            title={selectedDocument.label}
            className="min-h-0 flex-1 rounded bg-white"
          />
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
            If the Office preview stays blank, open or download the file using the buttons above.
          </div>
        </div>
      );
    }

    if (previewType === "video") {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-950 p-4">
          <video src={fileUrl} controls className="max-h-full max-w-full rounded-xl" />
        </div>
      );
    }

    if (previewType === "audio") {
      return (
        <div className="flex h-full min-h-[52vh] items-center justify-center rounded-2xl bg-white text-center">
          <div className="w-full max-w-lg px-6">
            <FileText className="mx-auto h-12 w-12 text-blue-500" />
            <p className="mt-3 text-sm font-black text-slate-900">{selectedDocument.fileName}</p>
            <audio src={fileUrl} controls className="mt-5 w-full" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-[52vh] items-center justify-center rounded-2xl bg-white p-6 text-center">
        <div className="max-w-md">
          <FileQuestion className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-3 text-base font-black text-slate-900">Preview is not available for this file type</p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            The file is uploaded and can still be reviewed by opening it in a new tab or downloading the original copy.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-sm">
              <Maximize2 className="h-4 w-4" />
              Open File
            </a>
            <a href={fileUrl} download className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        </div>
      </div>
    );
  };

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,rgba(37,99,235,0.24),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#ffffff_100%)] p-3 text-slate-900 sm:p-4">
      <Toaster position="top-right" />

      <ProcessingModal
        isOpen={processingState.active}
        title={processingState.title}
        message={processingState.message}
      />

      {isProcessing && (
        <div className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center bg-white/35 backdrop-blur-sm lg:left-[var(--dashboard-sidebar-offset,0px)]">
          <div className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-bold shadow-xl">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-700" />
            Processing...
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[min(1780px,calc(100vw-1rem))] rounded-3xl border border-white/70 bg-white/40 p-4 shadow-[0_28px_90px_-45px_rgba(15,23,42,0.55)] ring-1 ring-blue-100/70 backdrop-blur-2xl">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950">Pending Application Review</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Review and verify documents before approving the application.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`${basePath}/pending`)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={moveToNextApplicant}
              disabled={processingState.active}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700/90 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-700/20 disabled:cursor-wait disabled:opacity-60"
            >
              Move to Next Applicant
            </button>
          </div>
        </header>

        <section className="mt-4 overflow-hidden rounded-2xl border border-white/80 bg-white/70 p-5 shadow-[0_22px_70px_-48px_rgba(30,58,138,0.65)] ring-1 ring-blue-100/70 backdrop-blur-2xl">
          <div className="grid gap-5 lg:grid-cols-[116px_minmax(0,1fr)_230px] lg:items-center">
            <div className="flex items-center justify-center lg:justify-start">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 via-white to-sky-100 text-3xl font-black text-blue-700 ring-1 ring-blue-100 shadow-[0_18px_42px_-32px_rgba(30,58,138,0.65)]">
                {studentProfilePictureUrl ? (
                  <img src={studentProfilePictureUrl} alt={`${studentName} profile`} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Applicant profile</p>
              <h2 className="mt-1 truncate text-3xl font-black tracking-tight text-slate-950">{studentName}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide ${getAdmissionTypeStyle(admissionType)}`}>
                  {formatAdmissionType(admissionType)}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-700">
                  Enrolling to {yearLevel}
                </span>
              </div>
              <div className="mt-4 grid gap-x-6 gap-y-3 text-base sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Email</p>
                  <p className="mt-1 truncate font-semibold text-slate-700">{formData.email || enrollment.user_id || "No email provided"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Student ID</p>
                  <p className="mt-1 truncate font-semibold text-slate-700">{String(enrollment.id)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Track</p>
                  <p className="mt-1 truncate font-semibold text-slate-700">{formData.preferredTrack || formData.track || enrollment.preferred_track || "Not set"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <button
                onClick={() => setShowForm((current) => !current)}
                className="group inline-flex min-h-12 w-full max-w-[220px] items-center justify-center gap-2 rounded-xl border border-blue-200/90 bg-white/80 px-4 py-3 text-sm font-black text-blue-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50/80 hover:shadow-md"
              >
                <FileText className="h-5 w-5" />
                View Enrollment Form
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5 ${showForm ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        </section>

        {showForm && (
          <section className="mt-3 rounded-2xl border border-white/70 bg-white/45 p-4 shadow-xl shadow-blue-950/10 ring-1 ring-blue-100/60 backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-blue-950">Enrollment Review</h2>
                <p className="text-sm text-slate-600">Submitted application form details</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white hover:shadow-md">
                Hide Form
              </button>
            </div>
            <div className="mt-4 grid max-h-[68vh] gap-4 overflow-y-auto pr-1 xl:grid-cols-2">
              {renderEnrollmentSection("Basic Information", User, (
                <div className="grid grid-cols-1 gap-3 text-base text-slate-700 sm:grid-cols-2">
                  {renderSubmittedField("Admission Type", formData.admissionType)}
                  {renderSubmittedField("Previous Student ID", formData.previousStudentId || "N/A")}
                  {isTransferee && renderSubmittedField("Previous School", formData.previousSchoolName || formData.previous_school_name)}
                  {isTransferee && renderSubmittedField("Previous School Address", formData.previousSchoolAddress || formData.previous_school_address)}
                  {isTransferee && renderSubmittedField("Previous Track / Strand", formData.previousTrack || formData.previous_track)}
                  {(isTransferee || isReturnee) && renderSubmittedField("Last Grade Level Completed", formData.lastGradeLevelCompleted || formData.last_grade_level_completed)}
                  {isTransferee && renderSubmittedField("Reason for Transfer", formData.transferReason || formData.transfer_reason, "sm:col-span-2")}
                  {isReturnee && renderSubmittedField("Last School Year Attended", formData.lastSchoolYearAttended || formData.last_school_year_attended)}
                  {isReturnee && renderSubmittedField("Reason for Returning", formData.returneeReason || formData.returnee_reason, "sm:col-span-2")}
                  {renderSubmittedField("LRN", formData.lrn)}
                  {renderSubmittedField("Name", fullName)}
                  {renderSubmittedField("Suffix", formData.suffix || "None")}
                  {renderSubmittedField("Sex", formData.sex)}
                  {renderSubmittedField("Civil Status", formData.civilStatus)}
                  {renderSubmittedField("Birthday", formData.birthday || formData.birthDate)}
                  {renderSubmittedField("Religion", formData.religion)}
                  {renderSubmittedField("Nationality", formData.nationality)}
                  {renderSubmittedField("Disability", formData.disability === "Others" ? `${formData.disability} - ${formData.disabilityOther || ""}` : formData.disability)}
                  {renderSubmittedField("Indigenous Group", formData.indigenousGroup === "Others" ? `${formData.indigenousGroup} - ${formData.indigenousGroupOther || ""}` : formData.indigenousGroup)}
                  {renderSubmittedField("Email", formData.email || enrollment.user_id)}
                  {renderSubmittedField("Contact Number", formData.contactNumber)}
                  {renderSubmittedField("Facebook / Messenger Name", formData.facebookName)}
                  {renderSubmittedField("Working Student", Boolean(formData.isWorkingStudent))}
                </div>
              ), "Submitted student details")}

              {renderEnrollmentSection("Address", MapPin, (
                <div className="grid grid-cols-1 gap-3 text-base text-slate-700 sm:grid-cols-2">
                  {renderSubmittedField("Region", formData.region)}
                  {renderSubmittedField("Province", formData.province)}
                  {renderSubmittedField("City / Municipality", formData.city)}
                  {renderSubmittedField("Barangay", formData.barangay)}
                  {renderSubmittedField("Home Address", formData.homeAddress, "sm:col-span-2")}
                </div>
              ))}

              {renderEnrollmentSection("Parents & Guardians", Users, (
                <div className="space-y-4 text-base text-slate-700">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {renderSubmittedField("Father's Name", fatherName)}
                    {renderSubmittedField("Occupation", formData.fatherOccupation)}
                    {renderSubmittedField("Contact Number", formData.fatherContact)}
                  </div>
                  <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                    {renderSubmittedField("Mother's Maiden Name", formData.motherMaidenName)}
                    {renderSubmittedField("Mother's Name", motherName)}
                    {renderSubmittedField("Occupation", formData.motherOccupation)}
                    {renderSubmittedField("Contact Number", formData.motherContact)}
                  </div>
                  <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                    {renderSubmittedField("Guardian Relationship", guardianRelationship)}
                    {renderSubmittedField("Guardian Name", guardianName)}
                    {renderSubmittedField("Occupation", formData.guardianOccupation)}
                    {renderSubmittedField("Contact Number", formData.guardianContact)}
                  </div>
                  {renderSubmittedField("4Ps Member", Boolean(formData.is4PsMember))}
                </div>
              ))}

              {renderEnrollmentSection("Enrollment Details", GraduationCap, (
                <div className="grid grid-cols-1 gap-3 text-base text-slate-700 sm:grid-cols-2">
                  {renderSubmittedField("Preferred Track", formData.preferredTrack || formData.track)}
                  {renderSubmittedField("Year Level", formData.yearLevel)}
                  {renderSubmittedField("Elective 1", formData.elective1)}
                  {renderSubmittedField("Elective 2", formData.elective2)}
                </div>
              ))}

              {renderEnrollmentSection("Educational Background", BookOpen, (
                <div className="space-y-4 text-base text-slate-700">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {renderSubmittedField("Primary School", formData.primarySchool)}
                    {renderSubmittedField("Year Graduated", formData.primaryYearGraduated)}
                  </div>
                  <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                    {renderSubmittedField("Secondary School", formData.secondarySchool)}
                    {renderSubmittedField("Year Graduated", formData.secondaryYearGraduated)}
                  </div>
                  {renderSubmittedField("Grade 10 Adviser", formData.grade10Adviser)}
                </div>
              ))}

              {renderEnrollmentSection("Documents Summary", FileCheck, (
                <div className="grid gap-2 text-base text-slate-700">
                  {DOCUMENTS.map((doc) => (
                    <div key={doc.key} className="flex items-center gap-2">
                      {hasDocument(doc.key) ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={hasDocument(doc.key) ? "text-slate-700" : "text-gray-400"}>
                        {doc.label}{doc.required ? " (Required)" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-3 rounded-2xl border border-white/70 bg-white/45 p-5 shadow-xl shadow-blue-950/10 ring-1 ring-blue-100/60 backdrop-blur-2xl">
          <p className="text-sm font-black uppercase tracking-wide text-slate-600">Document Verification</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(460px,36%)_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-inner shadow-white/60 backdrop-blur-xl">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={actionableDocuments.length > 0 && selectedDocs.length === actionableDocuments.length}
                    onChange={(event) => setSelectedDocs(event.target.checked ? actionableDocuments.map((doc) => doc.key) : [])}
                    className="h-4 w-4 accent-blue-700"
                  />
                  Select all documents ({actionableDocuments.length})
                </label>
                <button
                  onClick={() => {
                    const keys = selectedActionableDocs;
                    if (keys.length === 0) {
                      toast.error("Select at least one document that is pending review or re-uploaded for review.");
                      return;
                    }
                    setDocRejectKey(null);
                    setDocRejectKeys(keys);
                    setDocRejectReason("");
                  }}
                  disabled={selectedActionableDocs.length === 0 || processingState.active}
                  className="rounded-xl border border-rose-200/80 bg-white/65 px-4 py-2 text-sm font-black text-rose-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md disabled:pointer-events-none disabled:border-slate-200 disabled:bg-slate-100/70 disabled:text-slate-400 disabled:shadow-none"
                >
                  Bulk Reject
                </button>
                <button
                  onClick={approveSelectedDocuments}
                  disabled={selectedActionableDocs.length === 0 || processingState.active}
                  className="rounded-xl border border-blue-200/80 bg-white/65 px-4 py-2 text-sm font-black text-blue-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md disabled:pointer-events-none disabled:border-slate-200 disabled:bg-slate-100/70 disabled:text-slate-400 disabled:shadow-none"
                >
                  Bulk Approve
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/70 bg-white/45 shadow-sm backdrop-blur-xl">
                <div className="grid grid-cols-[40px_1fr_150px] bg-white/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 backdrop-blur-xl">
                  <span />
                  <span>Document Name</span>
                  <span>Status</span>
                </div>
                <div className="max-h-[52vh] divide-y divide-white/60 overflow-y-auto bg-white/45">
                  {documents.map((doc) => (
                    <button
                      key={doc.key}
                      onClick={() => setSelectedDocKey(doc.key)}
                      className={`grid w-full grid-cols-[40px_1fr_150px] items-center gap-3 px-4 py-3 text-left transition ${
                        selectedDocKey === doc.key ? "bg-blue-100/70 shadow-inner" : "hover:bg-white/70"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.key)}
                        disabled={!canReviewDocument(doc)}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          setSelectedDocs((current) =>
                            event.target.checked ? [...current, doc.key] : current.filter((key) => key !== doc.key)
                          );
                        }}
                        className="h-4 w-4 accent-blue-700"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">{doc.label}</p>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500">{doc.fileName}</p>
                      </div>
                      <span
                        className={`justify-self-start rounded-full px-3 py-1.5 text-xs font-black ${
                          doc.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                          : doc.status === "rejected"
                            ? "bg-rose-100 text-rose-700"
                          : doc.reuploadedForReview
                            ? "bg-blue-100 text-blue-700"
                          : doc.status === "missing"
                            ? "bg-slate-100 text-slate-500"
                          : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {doc.reviewState}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setDocRejectKey(selectedDocument?.key || null);
                    setDocRejectKeys([]);
                    setDocRejectReason(selectedDocument?.rejectionComment || "");
                  }}
                  disabled={!canReviewDocument(selectedDocument) || processingState.active}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black shadow-sm backdrop-blur-xl transition ${
                    selectedDocument?.status === "rejected" && !selectedDocument?.reuploadedForReview
                      ? "pointer-events-none border-rose-200 bg-rose-50/80 text-rose-700 shadow-none"
                    : selectedDocument?.status === "approved"
                      ? "pointer-events-none border-emerald-200 bg-emerald-50/80 text-emerald-700 shadow-none"
                    : !canReviewDocument(selectedDocument)
                      ? "pointer-events-none border-slate-200 bg-slate-100/70 text-slate-400 shadow-none"
                      : "border-rose-200/80 bg-white/65 text-rose-700 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md"
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  {selectedDocument?.status === "rejected" && !selectedDocument?.reuploadedForReview ? "Rejected" : "Reject"}
                </button>
                <button
                  onClick={() => approveDocument()}
                  disabled={!canReviewDocument(selectedDocument) || processingState.active}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black shadow-sm backdrop-blur-xl transition ${
                    selectedDocument?.status === "approved"
                      ? "pointer-events-none border-emerald-200 bg-emerald-50/80 text-emerald-700 shadow-none"
                    : selectedDocument?.status === "rejected" && !selectedDocument?.reuploadedForReview
                      ? "pointer-events-none border-rose-200 bg-rose-50/80 text-rose-700 shadow-none"
                    : !canReviewDocument(selectedDocument)
                      ? "pointer-events-none border-slate-200 bg-slate-100/70 text-slate-400 shadow-none"
                      : "border-blue-200/80 bg-white/65 text-blue-700 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  {selectedDocument?.status === "approved" ? "Approved" : "Approve"}
                </button>
              </div>
            </aside>

            <section className="flex h-[68vh] min-h-[620px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/50 shadow-lg shadow-blue-950/5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/70 bg-white/65 px-4 py-3 backdrop-blur-xl">
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">Document Preview</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-500">{selectedDocument?.label || "Select a document"}</p>
                    {selectedDocument && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          selectedDocument.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : selectedDocument.status === "rejected"
                            ? "bg-rose-100 text-rose-700"
                            : selectedDocument.reuploadedForReview
                            ? "bg-blue-100 text-blue-700"
                            : selectedDocument.status === "missing"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {selectedDocument.reviewState}
                      </span>
                    )}
                  </div>
                  {selectedDocument?.status === "rejected" && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">
                      This document is locked until the student uploads a revised file.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setZoom((current) => Math.max(50, current - 10))} className="rounded-lg border border-white/80 bg-white/75 p-2 text-slate-700 shadow-sm transition hover:bg-blue-50" title="Zoom out">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="rounded-lg border border-white/80 bg-white/75 px-3 py-2 text-sm font-black shadow-sm">{zoom}%</span>
                  <button onClick={() => setZoom((current) => Math.min(180, current + 10))} className="rounded-lg border border-white/80 bg-white/75 p-2 text-slate-700 shadow-sm transition hover:bg-blue-50" title="Zoom in">
                    <Plus className="h-4 w-4" />
                  </button>
                  {selectedDocument?.fileUrl && (
                    <a href={selectedDocument.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/80 bg-white/75 p-2 text-slate-700 shadow-sm transition hover:bg-blue-50" title="Open file">
                      <Maximize2 className="h-4 w-4" />
                    </a>
                  )}
                  {selectedDocument?.fileUrl && (
                    <a href={selectedDocument.fileUrl} download className="rounded-lg border border-white/80 bg-white/75 p-2 text-slate-700 shadow-sm transition hover:bg-blue-50" title="Download file">
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden bg-white/60 p-3 backdrop-blur-xl">
                {renderDocumentPreview()}
              </div>
            </section>
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-white/70 bg-white/45 p-3 shadow-lg shadow-blue-950/5 ring-1 ring-blue-100/50 backdrop-blur-2xl">
          <div className="grid gap-3 lg:grid-cols-[1fr_350px] lg:items-center">
            <div>
              <p className="text-xs font-black text-slate-900">Is the student eligible for the voucher program? <span className="text-rose-600">*</span></p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">This is required before approving the application.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/70 bg-white/60 p-2 shadow-inner backdrop-blur-xl">
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

        <footer className="mt-3 rounded-2xl border border-white/70 bg-white/45 p-3 shadow-lg shadow-blue-950/5 ring-1 ring-blue-100/50 backdrop-blur-2xl">
          <div className="grid gap-3 lg:grid-cols-2">
            <button
              onClick={() => setShowApplicationReject(true)}
              disabled={processingState.active}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/80 bg-white/65 px-4 py-3 text-sm font-black text-rose-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md disabled:cursor-wait disabled:opacity-70"
            >
              <XCircle className="h-4 w-4" />
              Reject Application
            </button>
            <button
              onClick={() => {
                if (!canApproveApplication) {
                  setShowApprovalValidation(true);
                  return;
                }
                setShowApprovalConfirm(true);
              }}
              disabled={processingState.active}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200/80 bg-white/65 px-4 py-3 text-sm font-black text-blue-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md disabled:cursor-wait disabled:opacity-70"
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

      {(docRejectKey || docRejectKeys.length > 0) && (
        <div className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center bg-white/35 p-4 backdrop-blur-sm lg:left-[var(--dashboard-sidebar-offset,0px)]">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Reject {docRejectKeys.length > 1 ? `${docRejectKeys.length} Documents` : "Document"}
                </h2>
                {docRejectKeys.length > 1 && (
                  <p className="mt-1 text-xs font-semibold text-rose-700">The same rejection note will be applied to all selected documents.</p>
                )}
              </div>
              <button
                onClick={() => {
                  setDocRejectKey(null);
                  setDocRejectKeys([]);
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-white"
              >
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
                <button
                  onClick={() => {
                    setDocRejectKey(null);
                    setDocRejectKeys([]);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button onClick={confirmDocumentReject} disabled={!docRejectReason.trim() || processingState.active} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300">
                  Reject {docRejectKeys.length > 1 ? "Documents" : "Document"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApplicationReject && (
        <div className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center bg-white/35 p-4 backdrop-blur-sm lg:left-[var(--dashboard-sidebar-offset,0px)]">
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
                <button onClick={rejectApplication} disabled={!applicationRejectReason.trim() || processingState.active} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300">Reject Application</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApprovalConfirm && (
        <div className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm lg:left-[var(--dashboard-sidebar-offset,0px)]">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-blue-100 bg-blue-50 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">Approve Application?</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-blue-800">
                    Confirm that {studentName} has complete approved documents and the voucher decision is final.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowApprovalConfirm(false)} className="rounded-lg p-2 text-slate-500 transition hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <p><span className="font-bold text-slate-900">Student:</span> {studentName}</p>
                <p><span className="font-bold text-slate-900">Type:</span> {formatAdmissionType(admissionType)}</p>
                <p><span className="font-bold text-slate-900">Enrolling to:</span> {yearLevel}</p>
                <p><span className="font-bold text-slate-900">Voucher:</span> {voucherEligibility === "eligible" ? "Eligible" : "Not eligible"}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                After approval, this page will return to the Pending Applications queue.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setShowApprovalConfirm(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={approveApplication}
                  disabled={processingState.active}
                  className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-700/15 transition hover:bg-blue-800 disabled:cursor-wait disabled:bg-slate-300"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApprovalValidation && (
        <div className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm lg:left-[var(--dashboard-sidebar-offset,0px)]">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-amber-100 bg-amber-50 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">Cannot Approve Application Yet</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-amber-800">
                    Resolve the following requirement{approvalBlockers.length === 1 ? "" : "s"} before proceeding with approval.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowApprovalValidation(false)} className="rounded-lg p-2 text-slate-500 transition hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-sm font-bold text-slate-900">
                  Cannot proceed with application approval because:
                </p>
                <ul className="mt-3 space-y-2">
                  {approvalBlockers.map((blocker, index) => (
                    <li key={`${blocker}-${index}`} className="flex items-start gap-3 rounded-xl bg-white/75 p-3 text-sm font-medium leading-6 text-slate-700 ring-1 ring-amber-100">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <span>{blocker}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowApprovalValidation(false)}
                  className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl"
                >
                  Review Requirements
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectionConfirmation && (
        <div className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm lg:left-[var(--dashboard-sidebar-offset,0px)]">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-rose-100 bg-rose-50 px-6 py-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <XCircle className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-black text-slate-950">Application Rejected</h2>
              <p className="mt-1 text-sm font-medium text-rose-700">The student has been notified.</p>
            </div>
            <div className="p-6">
              <p className="text-sm leading-6 text-slate-700">
                {rejectionConfirmation.name}'s application was rejected and the reason will appear on the student's dashboard.
              </p>
              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-rose-700">Reason</p>
                <p className="mt-2 text-sm leading-6 text-slate-800">{rejectionConfirmation.reason}</p>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => setRejectionConfirmation(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Stay Here
                </button>
                <button
                  onClick={() => navigate(`${basePath}/pending`)}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700"
                >
                  Back to Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
