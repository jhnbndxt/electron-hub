import {
  Search,
  FileCheck,
  FileText,
  Download,
  Filter,
  CheckCircle,
  RotateCcw,
  Archive,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Toaster } from "react-hot-toast";
import { LoadingState } from "../../components/LoadingState";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { getStudentPaymentStatus } from "../../../services/adminService";
import { supabase } from "../../../supabase";

interface Student {
  id: number | string;
  name: string;
  applicationDate: string;
  status: "pending" | "re-submit" | "approved" | "rejected";
  currentStatus: string;
  strandApplied: string;
  email?: string;
  enrollmentData?: any;
  hasReuploadedDocuments?: boolean;
  queuePriority: number;
}

const COMPLETED_PAYMENT_STATUSES = new Set(["verified", "approved", "completed", "paid"]);
const PENDING_PAYMENT_STATUSES = new Set(["pending", "submitted"]);
const COMPLETED_ENROLLMENT_STATUSES = new Set(["documents_verified", "approved", "enrolled"]);
const ARCHIVED_ENROLLMENT_STATUSES = new Set(["rejected", "dropped", "unenrolled", "removed"]);

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

export function PendingApplications() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const reviewBasePath = location.pathname.startsWith("/branchcoordinator")
    ? "/branchcoordinator"
    : "/registrar";
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
      setIsLoading(false);
      console.log('📋 No pending applications found');
      return;
    }
    
    const formattedApps = await Promise.all(applications.map(async (app: any) => {
      const formData = app.form_data || {};
      const paymentStatusResponse = await getStudentPaymentStatus(app.user_id);
      const docs = app.enrollment_documents || [];
      const approvedDocuments = docs.filter((doc: any) => doc.status === "approved" || doc.verified === true).length;
      const rejectedDocuments = docs.filter((doc: any) => doc.status === "rejected").length;
      const payment = paymentStatusResponse?.data;
      const normalizedEnrollmentStatus = String(app.status || "").toLowerCase();
      const hasReuploadedDocuments = hasReuploadedRejectedDocument(docs);
      const isPaymentComplete = COMPLETED_PAYMENT_STATUSES.has(String(payment?.status || "").toLowerCase());
      const applicationStatus: Student["status"] =
        ARCHIVED_ENROLLMENT_STATUSES.has(normalizedEnrollmentStatus)
          ? "rejected"
          : COMPLETED_ENROLLMENT_STATUSES.has(normalizedEnrollmentStatus) || isPaymentComplete
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
        applicationDate: new Date(app.enrollment_date).toLocaleDateString(),
        status: applicationStatus,
        currentStatus: getCurrentEnrollmentStatus({
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
  const archivedStudents = filteredStudents.filter((student) => student.status === "rejected");
  const visibleStudents = [...activeStudents, ...completedStudents, ...archivedStudents];

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
    if (status === "Enrolled" || status === "Documents Verified") {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (status.includes("Payment")) {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (status === "Assessment Completed") {
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  const renderStatusLabel = (student: Student) => {
    if (student.status === "approved") return "Approved";
    if (student.hasReuploadedDocuments) return "Re-uploaded";
    if (student.status === "re-submit") return "Needs Corrections";
    if (student.status === "rejected") return "Archived";
    return "Pending Review";
  };

  const renderQueueSection = (title: string, description: string, sectionStudents: Student[], icon: typeof FileCheck, emptyText: string) => {
    const SectionIcon = icon;

    return (
      <div className="border-t border-gray-200 first:border-t-0">
        <div className="bg-slate-50/80 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white bg-white text-slate-600 shadow-sm">
                <SectionIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-xs text-slate-500">{description}</p>
              </div>
            </div>
            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {sectionStudents.length} record{sectionStudents.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <table className="w-full min-w-[900px]">
          <tbody className="divide-y divide-gray-200">
            {sectionStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <p className="text-sm font-medium text-slate-500">{emptyText}</p>
                </td>
              </tr>
            ) : (
              sectionStudents.map((student) => {
                const statusStyle = getStatusStyle(student.status);
                const docStatus = getDocumentStatus(student);
                const isApproved = student.status === "approved";
                const isArchived = student.status === "rejected";

                return (
                  <tr
                    key={student.id}
                    className={`transition-colors ${
                      isApproved
                        ? "bg-emerald-50/25 opacity-75 hover:bg-emerald-50/40"
                        : isArchived
                        ? "bg-slate-50/70 opacity-70 hover:bg-slate-100/70"
                        : student.hasReuploadedDocuments
                        ? "bg-amber-50/35 hover:bg-amber-50/60"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {isApproved && (
                          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                        )}
                        {student.hasReuploadedDocuments && !isApproved && (
                          <RotateCcw className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${isApproved || isArchived ? "text-slate-700" : "text-gray-900"}`}>
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
                        style={{ backgroundColor: isApproved || isArchived ? "#F8FAFC" : "#EEF2FF", color: isApproved || isArchived ? "#64748B" : "#4338CA" }}
                      >
                        {student.strandApplied}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {new Date(student.applicationDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
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
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 ${getCurrentStatusStyle(isApproved ? "Enrolled" : student.currentStatus)}`}>
                        {isApproved ? "Enrollment Complete" : student.currentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isArchived ? (
                        <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500">
                          Archived
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`${reviewBasePath}/review/${student.id}`)}
                          className={`mx-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 ${
                            isApproved
                              ? "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-300"
                              : "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-400"
                          }`}
                          title={isApproved ? "View Enrollment Status" : "Review Application"}
                        >
                          {isApproved ? <Eye className="h-4 w-4" /> : null}
                          {isApproved ? "View Enrollment Status" : "Review Application"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={loadApplications}
            className="w-full sm:w-auto justify-center px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#10B981" }}
          >
            <Download className="w-4 h-4" />
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
                Re-uploaded submissions stay first, pending reviews stay next, completed applications stay visible below.
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
                <p>Complete</p>
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
          ) : (
            <>
              {renderQueueSection(
                "Active Tasks",
                "Re-uploaded applications appear first, followed by regular pending reviews.",
                activeStudents,
                RotateCcw,
                "No active applications need registrar review."
              )}
              {renderQueueSection(
                "Completed Applications",
                "Approved or enrolled students remain visible for monitoring without competing with active tasks.",
                completedStudents,
                CheckCircle,
                "No completed applications match the current filters."
              )}
              {renderQueueSection(
                "Archived / Rejected Records",
                "Fully rejected applications are separated from the active queue for audit reference.",
                archivedStudents,
                Archive,
                "No archived or rejected records match the current filters."
              )}
            </>
          )}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">{visibleStudents.length}</span> matching
            applications: <span className="font-medium">{activeStudents.length}</span> active,{" "}
            <span className="font-medium">{completedStudents.length}</span> completed,{" "}
            <span className="font-medium">{archivedStudents.length}</span> archived
          </p>
        </div>
      </div>
    </div>
  );
}
