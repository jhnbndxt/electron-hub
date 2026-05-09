import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  ArrowLeft,
  Mail,
  GraduationCap,
  FileText,
  Image,
  CreditCard,
  CalendarDays,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { LoadingState } from "../../components/LoadingState";
import { getStudentProfileByEnrollmentId } from "../../../services/adminService";

const DOCUMENT_LABELS: Record<string, string> = {
  form138: "Form 138 (Report Card)",
  form137: "Form 137",
  goodMoral: "Certificate of Good Moral",
  birthCertificate: "Birth Certificate",
  idPicture: "ID Picture",
  diploma: "Grade 10 Diploma",
  escCertificate: "ESC Certificate",
};

function valueOrDash(value: unknown) {
  return value ? String(value) : "Not provided";
}

function formatDate(value: unknown) {
  if (!value) return "Not provided";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function DetailItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{valueOrDash(value)}</p>
    </div>
  );
}

export function StudentProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { userRole } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isSuperAdmin = userRole === "superadmin" || location.pathname.startsWith("/branchcoordinator");
  const recordsPath = isSuperAdmin ? "/branchcoordinator/students" : "/registrar/students";

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!id) {
        setError("Student profile not found.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error: profileError } = await getStudentProfileByEnrollmentId(id);

      if (!active) return;

      if (profileError || !data) {
        setError(profileError || "Student profile not found.");
        setProfile(null);
      } else {
        setProfile(data);
        setError("");
      }

      setIsLoading(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="portal-dashboard-page p-4 sm:p-6 lg:p-8">
        <LoadingState message="Loading student profile..." subtext="Retrieving enrollment details, documents, and payments." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="portal-dashboard-page p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate(recordsPath)}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-700 hover:opacity-75"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Records
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      </div>
    );
  }

  const enrollment = profile.enrollment || {};
  const formData = enrollment.form_data || {};
  const documents = enrollment.enrollment_documents || [];
  const payments = profile.payments || [];
  const progress = profile.progress || [];
  const assessment = profile.assessment || null;
  const studentName =
    formData.studentName ||
    `${formData.firstName || formData.first_name || ""} ${formData.middleName || formData.middle_name || ""} ${formData.lastName || formData.last_name || ""}`
      .replace(/\s+/g, " ")
      .trim() ||
    enrollment.user_id ||
    location.state?.student?.name ||
    "Student";

  const initials = studentName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="portal-dashboard-page p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <button
          onClick={() => navigate(recordsPath)}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-700 hover:opacity-75"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Records
        </button>
        <DashboardPageHeader
          badge="Student Management"
          title="Student Profile"
          subtitle={`Complete enrollment record for ${studentName}`}
          icon={GraduationCap}
        />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-900 text-3xl font-bold text-white">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{studentName}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {enrollment.user_id || formData.email || "No email recorded"}
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                {enrollment.status || "Not provided"}
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Enrollment Date" value={formatDate(enrollment.enrollment_date || enrollment.created_at)} />
              <DetailItem label="Current Status" value={enrollment.status} />
              <DetailItem label="Track" value={formData.preferredTrack || formData.preferred_track || formData.track} />
              <DetailItem label="Year Level" value={formData.yearLevel || formData.year_level} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-800" />
            <h3 className="text-lg font-bold text-gray-900">Enrollment Form Details</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Admission Type" value={formData.admissionType || formData.admission_type} />
            <DetailItem label="LRN" value={formData.lrn} />
            <DetailItem label="Sex" value={formData.sex || formData.gender} />
            <DetailItem label="Birthday" value={formData.birthday || formData.birth_date} />
            <DetailItem label="Contact Number" value={formData.contactNumber || formData.contact_number} />
            <DetailItem label="Civil Status" value={formData.civilStatus || formData.civil_status} />
            <DetailItem label="Elective 1" value={formData.elective1 || formData.elective_1} />
            <DetailItem label="Elective 2" value={formData.elective2 || formData.elective_2} />
            <DetailItem label="Address" value={[formData.homeAddress || formData.home_address, formData.barangay, formData.city, formData.province].filter(Boolean).join(", ")} />
            <DetailItem label="Guardian" value={[formData.guardianFirstName || formData.guardian_first_name, formData.guardianLastName || formData.guardian_last_name].filter(Boolean).join(" ")} />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Image className="h-5 w-5 text-blue-800" />
            <h3 className="text-lg font-bold text-gray-900">Uploaded Documents / Files</h3>
          </div>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">No uploaded documents found.</p>
            ) : (
              documents.map((document: any) => (
                <div key={document.id || document.document_type} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {DOCUMENT_LABELS[document.document_type] || document.document_type || "Document"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{document.file_name || document.status || "Uploaded file"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                      {document.status || (document.verified ? "approved" : "pending")}
                    </span>
                    {(document.file_path || document.file_url) && (
                      <a
                        href={document.file_url || document.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                      >
                        View File
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-800" />
            <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
          </div>
          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payment records found.</p>
            ) : (
              payments.map((payment: any) => (
                <div key={payment.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {payment.payment_method || "Payment"} - PHP {Number(payment.amount || 0).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Reference: {payment.reference_number || payment.queue_number || "Not provided"}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {payment.status}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(payment.submitted_at || payment.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-800" />
            <h3 className="text-lg font-bold text-gray-900">Progress and Assessment</h3>
          </div>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <DetailItem label="Recommended Track" value={assessment?.recommended_track} />
            <DetailItem label="Overall Score" value={assessment?.overall_score ? `${assessment.overall_score}%` : ""} />
          </div>
          <div className="space-y-3">
            {progress.length === 0 ? (
              <p className="text-sm text-gray-500">No enrollment progress records found.</p>
            ) : (
              progress.map((step: any) => (
                <div key={step.id || step.step_name} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    {step.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="text-sm font-semibold text-gray-900">{step.step_name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{step.status}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
