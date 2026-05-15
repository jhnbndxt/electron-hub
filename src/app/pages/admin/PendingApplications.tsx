import {
  Search,
  FileCheck,
  FileText,
  RefreshCw,
  Filter,
  CheckCircle,
  RotateCcw,
  Clock,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Toaster } from "react-hot-toast";
import { LoadingState } from "../../components/LoadingState";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { getStudentPaymentStatus } from "../../../services/adminService";
import { supabase } from "../../../supabase";
import { loadProfileImageUrl } from "../../utils/profileImage";

interface Student {
  id: number | string;
  name: string;
  applicationDate: string;
  status: "pending" | "re-submit" | "approved" | "rejected";
  currentStatus: string;
  strandApplied: string;
  email?: string;
  profileImageUrl?: string;
  enrollmentData?: any;
  hasReuploadedDocuments?: boolean;
  queuePriority: number;
}

interface RegistrarDashboardStats {
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalEnrolledStudents: number;
}

const COMPLETED_PAYMENT_STATUSES = new Set(["verified", "approved", "completed", "paid"]);
const PENDING_PAYMENT_STATUSES = new Set(["pending", "submitted"]);
const APPROVED_MONITORING_STATUSES = new Set(["documents_verified", "approved"]);
const ARCHIVED_ENROLLMENT_STATUSES = new Set(["rejected", "dropped", "unenrolled", "removed"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getRecordTimestamp = (record: any) => {
  const value = record?.updated_at || record?.uploaded_at || record?.created_at || record?.enrollment_date;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getNormalizedDocumentStatus = (doc: any) => {
  if (doc?.status === "approved" || doc?.verified === true) return "approved";
  if (doc?.status === "rejected") return "rejected";
  return "pending";
};

const hasReuploadedRejectedDocument = (docs: any[]) => {
  const docsByType = new Map<string, any[]>();

  docs.forEach((doc) => {
    const documentType = doc.document_type || doc.type || "document";
    docsByType.set(documentType, [...(docsByType.get(documentType) || []), doc]);
  });

  return Array.from(docsByType.values()).some((documentVersions) => {
    const sortedDocuments = [...documentVersions].sort((a, b) => getRecordTimestamp(a) - getRecordTimestamp(b));
    const latestDocument = sortedDocuments[sortedDocuments.length - 1];
    if (latestDocument?.status === "reuploaded") return true;

    const previousRejectedDocument = sortedDocuments
      .slice(0, -1)
      .some((doc) => getNormalizedDocumentStatus(doc) === "rejected");

    return previousRejectedDocument && getNormalizedDocumentStatus(latestDocument) === "pending";
  });
};

const getCurrentEnrollmentStatus = ({
  hasAssessment,
  enrollmentStatus,
  paymentStatus,
  paymentMethod,
  documentsUploaded,
  documentsApproved,
}: {
  hasAssessment?: boolean;
  enrollmentStatus?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  documentsUploaded: number;
  documentsApproved: number;
}) => {
  const normalizedEnrollmentStatus = enrollmentStatus?.toLowerCase() || "";
  const normalizedPaymentStatus = paymentStatus?.toLowerCase() || "";
  const normalizedPaymentMethod = paymentMethod?.toLowerCase() || "";

  if (
    normalizedEnrollmentStatus === "enrolled" ||
    (normalizedPaymentStatus && COMPLETED_PAYMENT_STATUSES.has(normalizedPaymentStatus))
  ) {
    return "Enrolled";
  }

  if (normalizedPaymentStatus && PENDING_PAYMENT_STATUSES.has(normalizedPaymentStatus)) {
    return normalizedPaymentMethod === "cash" ? "Payment Pending" : "Payment Verification";
  }

  if (normalizedEnrollmentStatus === "documents_verified") {
    return "Payment Pending";
  }

  if (documentsUploaded > 0 && documentsApproved === documentsUploaded) {
    return "Documents Verified";
  }

  if (hasAssessment) {
    return "Assessment Completed";
  }

  if (documentsUploaded > 0 || hasAssessment || normalizedEnrollmentStatus === "pending_review") {
    return "Documents Pending";
  }

  return "Application Submitted";
};

const formatEnrollmentStatus = (status?: string | null) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  const statusLabels: Record<string, string> = {
    approved: "Approved",
    documents_verified: "Documents Verified",
    enrolled: "Enrolled",
    pending_documents: "Pending Documents",
    pending_review: "Pending Review",
    rejected: "Rejected",
    dropped: "Dropped",
    unenrolled: "Unenrolled",
    removed: "Removed",
  };

  if (statusLabels[normalizedStatus]) {
    return statusLabels[normalizedStatus];
  }

  return normalizedStatus
    ? normalizedStatus
        .split("_")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Application Submitted";
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

const loadApplicantProfileImageUrl = async (app: any, formData: any) => {
  const userReference = String(app.user_id || "").trim();
  const formEmail = String(
    formData.email ||
      formData.emailAddress ||
      formData.email_address ||
      app.email ||
      ""
  ).trim();
  const lookupReferences = Array.from(new Set([userReference, formEmail].filter(Boolean)));
  let profile: any = null;

  for (const reference of lookupReferences) {
    const profileQuery = supabase
      .from("users")
      .select("id, email, profile_picture_url");
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

  return (
    profile?.profile_picture_url ||
    getFormProfileImageUrl(formData) ||
    (await loadProfileImageUrl(resolvedUserId, resolvedEmail))
  );
};

export function PendingApplications() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [students, setStudents] = useState<Student[]>([]);
  const [dashboardStats, setDashboardStats] = useState<RegistrarDashboardStats>({
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalEnrolledStudents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const reviewBasePath = location.pathname.startsWith("/branchcoordinator")
    ? "/branchcoordinator"
    : "/registrar";
  const isRegistrarView = reviewBasePath === "/registrar";
  const alert = (message: string) => {
    const text = String(message || "");
    if (text.includes("âœ…") || text.includes("✅")) return;
    window.alert(message);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    const { data: applications, error } = await supabase
      .from("enrollments")
      .select("id, user_id, form_data, status, enrollment_date, created_at, updated_at, enrollment_documents(*)")
      .order("enrollment_date", { ascending: true });
    
    if (error) {
      console.error('Error loading applications:', error);
      setStudents([]);
      setIsLoading(false);
      return;
    }

    if (!applications || applications.length === 0) {
      setStudents([]);
      setDashboardStats({
        pendingApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0,
        totalEnrolledStudents: 0,
      });
      setIsLoading(false);
      console.log('📋 No pending applications found');
      return;
    }
    
    const nextDashboardStats = applications.reduce(
      (stats: RegistrarDashboardStats, app: any) => {
        const normalizedEnrollmentStatus = String(app.status || "").toLowerCase();

        if (normalizedEnrollmentStatus === "enrolled") {
          stats.totalEnrolledStudents += 1;
        } else if (normalizedEnrollmentStatus === "rejected") {
          stats.rejectedApplications += 1;
        } else if (APPROVED_MONITORING_STATUSES.has(normalizedEnrollmentStatus)) {
          stats.approvedApplications += 1;
        } else if (!ARCHIVED_ENROLLMENT_STATUSES.has(normalizedEnrollmentStatus)) {
          stats.pendingApplications += 1;
        }

        return stats;
      },
      {
        pendingApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0,
        totalEnrolledStudents: 0,
      }
    );
    setDashboardStats(nextDashboardStats);

    const visibleApplications = applications.filter((app: any) => {
      const normalizedEnrollmentStatus = String(app.status || "").toLowerCase();
      return normalizedEnrollmentStatus !== "enrolled" && !ARCHIVED_ENROLLMENT_STATUSES.has(normalizedEnrollmentStatus);
    });

    const formattedApps = await Promise.all(visibleApplications.map(async (app: any) => {
      const formData = app.form_data || {};
      const paymentStatusResponse = await getStudentPaymentStatus(app.user_id);
      const profileImageUrl = await loadApplicantProfileImageUrl(app, formData);
      const docs = app.enrollment_documents || [];
      const approvedDocuments = docs.filter((doc: any) => doc.status === "approved" || doc.verified === true).length;
      const rejectedDocuments = docs.filter((doc: any) => doc.status === "rejected").length;
      const payment = paymentStatusResponse?.data;
      const normalizedEnrollmentStatus = String(app.status || "").toLowerCase();
      const hasReuploadedDocuments = hasReuploadedRejectedDocument(docs);
      const isPaymentComplete = COMPLETED_PAYMENT_STATUSES.has(String(payment?.status || "").toLowerCase());
      const applicationStatus: Student["status"] =
        APPROVED_MONITORING_STATUSES.has(normalizedEnrollmentStatus) || isPaymentComplete
          ? "approved"
          : hasReuploadedDocuments || rejectedDocuments > 0
          ? "re-submit"
          : "pending";
      const queuePriority =
        applicationStatus === "re-submit"
          ? 0
          : applicationStatus === "pending"
          ? 1
          : applicationStatus === "approved"
          ? 2
          : 3;
      
      return {
        id: app.id,
        name: formData.studentName || `${formData.firstName || ''} ${formData.lastName || ''}`,
        email: app.user_id || formData.email,
        profileImageUrl,
        applicationDate: new Date(app.enrollment_date).toLocaleDateString(),
        status: applicationStatus,
        currentStatus:
          applicationStatus === "approved"
            ? formatEnrollmentStatus(app.status)
            : getCurrentEnrollmentStatus({
                enrollmentStatus: app.status,
                paymentStatus: payment?.status,
                paymentMethod: payment?.payment_method,
                documentsUploaded: docs.length,
                documentsApproved: approvedDocuments,
              }),
        strandApplied: formData.preferredTrack || formData.track || app.preferred_track || 'Not Set',
        enrollmentId: app.id,
        enrollmentData: app,
        hasReuploadedDocuments,
        queuePriority,
      };
    }));
    
    setStudents(
      formattedApps.sort((a, b) => {
        if (a.queuePriority !== b.queuePriority) {
          return a.queuePriority - b.queuePriority;
        }

        const firstDate = new Date(a.enrollmentData?.enrollment_date || 0).getTime();
        const secondDate = new Date(b.enrollmentData?.enrollment_date || 0).getTime();
        return a.hasReuploadedDocuments || b.hasReuploadedDocuments
          ? secondDate - firstDate
          : firstDate - secondDate;
      })
    );
    setIsLoading(false);
    console.log('📋 Loaded', formattedApps.length, 'pending applications from Supabase');
  };

  const getDocumentStatus = (student: Student) => {
    const docs = student.enrollmentData?.enrollment_documents || [];
    const uploaded = docs.length;
    if (uploaded === 0) {
      return { uploaded: 0, approved: 0, rejected: 0, pending: 0, allApproved: false };
    }

    const approved = docs.filter((doc: any) => doc.status === "approved" || doc.verified === true).length;
    const rejected = docs.filter((doc: any) => doc.status === "rejected").length;
    const pending = uploaded - approved - rejected;

    return {
      uploaded,
      approved,
      rejected,
      pending,
      allApproved: approved === uploaded,
    };
  };

  let filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (statusFilter !== "all") {
    filteredStudents = filteredStudents.filter((student) => student.status === statusFilter);
  }

  const activeStudents = filteredStudents.filter((student) => student.status === "pending" || student.status === "re-submit");
  const completedStudents = filteredStudents.filter((student) => student.status === "approved");
  const visibleStudents = [...activeStudents, ...completedStudents];
  const registrarDashboardCards = [
    {
      label: "Pending Applications",
      value: dashboardStats.pendingApplications,
      icon: Clock,
      accent: "#D97706",
      surface: "border-amber-100 bg-amber-50",
      text: "text-amber-800",
    },
    {
      label: "Approved Applications",
      value: dashboardStats.approvedApplications,
      icon: UserCheck,
      accent: "#059669",
      surface: "border-emerald-100 bg-emerald-50",
      text: "text-emerald-800",
    },
    {
      label: "Rejected Applications",
      value: dashboardStats.rejectedApplications,
      icon: XCircle,
      accent: "#DC2626",
      surface: "border-red-100 bg-red-50",
      text: "text-red-800",
    },
    {
      label: "Total Enrolled Students",
      value: dashboardStats.totalEnrolledStudents,
      icon: Users,
      accent: "#1E3A8A",
      surface: "border-blue-100 bg-blue-50",
      text: "text-blue-900",
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          border: "#FCD34D",
        };
      case "re-submit":
        return {
          bg: "#FEF2F2",
          text: "#B45309",
          border: "#FBBF24",
        };
      case "approved":
        return {
          bg: "#ECFDF5",
          text: "#047857",
          border: "#A7F3D0",
        };
      case "rejected":
        return {
          bg: "#FEE2E2",
          text: "#991B1B",
          border: "#FCA5A5",
        };
      default:
        return {
          bg: "#F3F4F6",
          text: "#374151",
          border: "#D1D5DB",
        };
    }
  };

  const getCurrentStatusStyle = (status: string) => {
    if (status === "Enrolled" || status === "Documents Verified" || status === "Approved") {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (status.includes("Payment")) {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (status === "Assessment Completed") {
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    }

    if (status === "Pending Review" || status === "Pending Documents") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  const renderStatusLabel = (student: Student) => {
    if (student.status === "approved") return "Monitoring";
    if (student.hasReuploadedDocuments) return "Re-uploaded";
    if (student.status === "re-submit") return "Needs Corrections";
    return "Pending Review";
  };

  const renderStudentRow = (student: Student) => {
    const statusStyle = getStatusStyle(student.status);
    const docStatus = getDocumentStatus(student);
    const isApproved = student.status === "approved";
    const initials =
      student.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "S";

    return (
      <tr
        key={student.id}
        className={`transition-colors ${
          isApproved
            ? "bg-emerald-50/25 opacity-75 hover:bg-emerald-50/40"
            : student.hasReuploadedDocuments
            ? "bg-amber-50/35 hover:bg-amber-50/60"
            : "hover:bg-gray-50"
        }`}
      >
        <td className="px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-blue-50 text-sm font-bold text-blue-800">
              {student.profileImageUrl ? (
                <img src={student.profileImageUrl} alt={`${student.name} profile`} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {isApproved && (
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
            )}
            {student.hasReuploadedDocuments && !isApproved && (
              <RotateCcw className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            )}
            <div className="min-w-0">
              <p className={`text-sm font-medium ${isApproved ? "text-slate-700" : "text-gray-900"}`}>
                {student.name}
              </p>
              {docStatus.uploaded > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Docs: {docStatus.approved}/{docStatus.uploaded} approved
                </p>
              )}
              {student.hasReuploadedDocuments && !isApproved && (
                <p className="mt-1 text-xs font-semibold text-amber-700">Updated documents need review</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span
            className="inline-flex px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: isApproved ? "#F8FAFC" : "#EEF2FF",
              color: isApproved ? "#64748B" : "#4338CA",
            }}
          >
            {student.strandApplied}
          </span>
        </td>
        <td className="px-6 py-4">
          <p className="text-sm text-gray-600">
            {new Date(student.applicationDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </td>
        <td className="px-6 py-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
              borderColor: statusStyle.border,
            }}
          >
            {isApproved && <CheckCircle className="h-3.5 w-3.5" />}
            {student.hasReuploadedDocuments && !isApproved && <RotateCcw className="h-3.5 w-3.5" />}
            {renderStatusLabel(student)}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 ${getCurrentStatusStyle(student.currentStatus)}`}>
            {student.currentStatus}
          </span>
        </td>
        <td className="px-6 py-4 text-center">
          {isApproved ? (
            <span className="text-xs font-semibold text-slate-500">Monitoring only</span>
          ) : (
            <button
              onClick={() => navigate(`${reviewBasePath}/review/${student.id}`)}
              className="mx-auto inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              title="Review Application"
            >
              Review Application
            </button>
          )}
        </td>
      </tr>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <LoadingState
          message="Loading pending applications..."
          subtext="Fetching submitted applications and document review status."
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <Toaster position="top-right" />
      <DashboardPageHeader
        badge="Application Review"
        title="Pending Applications"
        subtitle="Review and process student applications requiring action"
        icon={FileCheck}
      />

      {isRegistrarView && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-lg shadow-blue-950/5 backdrop-blur-xl">
          <div className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50/90 via-white/90 to-red-50/80 px-5 py-5 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">Registrar Dashboard</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Application Summary</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Monitor the current enrollment application volume before reviewing the queue.
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
            {registrarDashboardCards.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.label} className={`rounded-xl border p-5 shadow-sm ${card.surface}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: card.accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className={`mt-5 text-sm font-semibold ${card.text}`}>{card.label}</p>
                  <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{card.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-xl shadow-lg p-5 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
          <div className="relative w-full md:flex-1 md:min-w-[240px]">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--electron-blue)" }} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm transition-all"
              style={{ "--tw-ring-color": "var(--electron-blue)" } as any}
            />
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm transition-all"
              style={{ color: "#374151", "--tw-ring-color": "var(--electron-blue)" } as any}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="re-submit">Re-submit</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <button
            onClick={loadApplications}
            className="w-full sm:w-auto justify-center px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#10B981" }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Application Queue
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Re-uploaded submissions stay first, pending reviews stay next, and approved applications stay below for monitoring until enrollment.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-[360px]">
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-amber-800">
                <p className="font-bold">{activeStudents.filter((student) => student.hasReuploadedDocuments).length}</p>
                <p>Re-uploaded</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-blue-800">
                <p className="font-bold">{activeStudents.filter((student) => !student.hasReuploadedDocuments).length}</p>
                <p>Pending</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-800">
                <p className="font-bold">{completedStudents.length}</p>
                <p>Monitoring</p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Strand Applied
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Application Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Current Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visibleStudents.map(renderStudentRow)}
            </tbody>
          </table>
          {visibleStudents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <FileText className="w-12 h-12 text-gray-400" />
                <div>
                  <p className="text-gray-900 font-medium mb-1">No applications found</p>
                  <p className="text-sm text-gray-500">
                    Applications will appear here when students submit enrollment forms.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">{visibleStudents.length}</span> matching
            applications: <span className="font-medium">{activeStudents.length}</span> active,{" "}
            <span className="font-medium">{completedStudents.length}</span> monitoring
          </p>
        </div>
      </div>
    </div>
  );
}
