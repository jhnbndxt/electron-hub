import { useEffect, useState } from "react";
import type { ElementType, ReactNode } from "react";
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
  User,
  MapPin,
  Users,
  BookOpen,
  School,
  Phone,
  ShieldCheck,
  ClipboardList,
  BadgeCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { LoadingState } from "../../components/LoadingState";
import { getStudentProfileByEnrollmentId } from "../../../services/adminService";

const DOCUMENT_LABELS: Record<string, string> = {
  form138: "Form 138 (Report Card)",
  form137: "Form 137",
  goodMoral: "Certificate of Good Moral",
  birthCertificate: "PSA Birth Certificate",
  idPicture: "ID Picture",
  diploma: "Grade 10 Diploma",
  escCertificate: "ESC Certificate",
};

function valueOrDash(value: unknown) {
  if (value === false) return "No";
  if (value === true) return "Yes";
  if (value === 0) return "0";
  return value ? String(value) : "Not provided";
}

function formatDate(value: unknown) {
  if (!value) return "Not provided";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatCurrency(value: unknown) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function normalizeStatus(value: unknown) {
  return valueOrDash(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function joinName(...parts: unknown[]) {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function FieldItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">{valueOrDash(value)}</p>
    </div>
  );
}

function RecordSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-lg shadow-blue-950/5 ring-1 ring-white/70 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
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

  const read = (...keys: string[]) => {
    for (const key of keys) {
      const value = formData[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return "";
  };

  const studentName =
    read("studentName") ||
    joinName(read("firstName", "first_name"), read("middleName", "middle_name"), read("lastName", "last_name"), read("suffix")) ||
    enrollment.user_id ||
    location.state?.student?.name ||
    "Student";

  const initials = studentName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const address = [
    read("homeAddress", "home_address"),
    read("barangay"),
    read("city"),
    read("province"),
    read("region"),
  ]
    .filter(Boolean)
    .join(", ");

  const guardianSource = String(read("guardianSource", "guardian_source") || "");
  const guardianFromParent =
    guardianSource === "father"
      ? joinName(read("fatherFirstName", "father_first_name"), read("fatherMiddleName", "father_middle_name"), read("fatherLastName", "father_last_name"))
      : guardianSource === "mother"
      ? joinName(read("motherFirstName", "mother_first_name"), read("motherMiddleName", "mother_middle_name"), read("motherLastName", "mother_last_name"))
      : "";
  const guardianName =
    guardianFromParent ||
    joinName(read("guardianFirstName", "guardian_first_name"), read("guardianMiddleName", "guardian_middle_name"), read("guardianLastName", "guardian_last_name"));

  const documentStatusCounts = {
    approved: documents.filter((doc: any) => String(doc.status || "").toLowerCase() === "approved" || doc.verified).length,
    rejected: documents.filter((doc: any) => String(doc.status || "").toLowerCase() === "rejected").length,
    total: documents.length,
  };

  const latestPayment = payments[0];
  const totalPaid = payments.reduce((total: number, payment: any) => total + Number(payment.amount || 0), 0);

  const overviewMetrics = [
    { label: "Status", value: normalizeStatus(enrollment.status), icon: BadgeCheck },
    { label: "Track", value: read("preferredTrack", "preferred_track", "recommendedTrack", "recommended_track", "track") || "Not Set", icon: BookOpen },
    { label: "Documents", value: `${documentStatusCounts.approved}/${documentStatusCounts.total || 0} Approved`, icon: FileText },
    { label: "Payments", value: payments.length ? formatCurrency(totalPaid) : "No records", icon: CreditCard },
  ];

  const personalFields = [
    ["Admission Type", read("admissionType", "admission_type")],
    ["Previous Student ID", read("previousStudentId", "previous_student_id")],
    ["LRN", read("lrn")],
    ["Working Student", read("isWorkingStudent", "is_working_student")],
    ["Last Name", read("lastName", "last_name")],
    ["First Name", read("firstName", "first_name")],
    ["Middle Name", read("middleName", "middle_name")],
    ["Suffix", read("suffix")],
    ["Sex", read("sex", "gender")],
    ["Civil Status", read("civilStatus", "civil_status")],
    ["Birthday", formatDate(read("birthday", "birthDate", "birth_date"))],
    ["Religion", read("religion")],
    ["Nationality", read("nationality")],
    ["Disability", read("disability") === "Others" ? read("disabilityOther", "disability_other") : read("disability")],
    ["Indigenous Group", read("indigenousGroup", "indigenous_group") === "Others" ? read("indigenousGroupOther", "indigenous_group_other") : read("indigenousGroup", "indigenous_group")],
    ["Email", enrollment.user_id || read("email")],
    ["Contact Number", read("contactNumber", "contact_number")],
    ["Facebook Name", read("facebookName", "facebook_name")],
  ];

  const academicFields = [
    ["Preferred Track", read("preferredTrack", "preferred_track", "recommendedTrack", "recommended_track", "track")],
    ["Year Level", read("yearLevel", "year_level")],
    ["Elective 1", read("elective1", "elective_1")],
    ["Elective 2", read("elective2", "elective_2")],
    ["Primary School", read("primarySchool", "primary_school")],
    ["Primary Year Graduated", read("primaryYearGraduated", "primary_year_graduated")],
    ["Secondary School", read("secondarySchool", "secondary_school")],
    ["Secondary Year Graduated", read("secondaryYearGraduated", "secondary_year_graduated")],
    ["Grade 10 Adviser", read("grade10Adviser", "grade_10_adviser")],
  ];

  const familyFields = [
    ["Father's Name", joinName(read("fatherFirstName", "father_first_name"), read("fatherMiddleName", "father_middle_name"), read("fatherLastName", "father_last_name"))],
    ["Father's Occupation", read("fatherOccupation", "father_occupation")],
    ["Father's Contact", read("fatherContact", "father_contact")],
    ["Mother's Maiden Name", read("motherMaidenName", "mother_maiden_name")],
    ["Mother's Name", joinName(read("motherFirstName", "mother_first_name"), read("motherMiddleName", "mother_middle_name"), read("motherLastName", "mother_last_name"))],
    ["Mother's Occupation", read("motherOccupation", "mother_occupation")],
    ["Mother's Contact", read("motherContact", "mother_contact")],
    ["Guardian Source", guardianSource ? guardianSource.replace(/^\w/, (letter) => letter.toUpperCase()) : ""],
    ["Guardian Name", guardianName],
    ["Guardian Occupation", guardianSource === "father" ? read("fatherOccupation", "father_occupation") : guardianSource === "mother" ? read("motherOccupation", "mother_occupation") : read("guardianOccupation", "guardian_occupation")],
    ["Guardian Contact", guardianSource === "father" ? read("fatherContact", "father_contact") : guardianSource === "mother" ? read("motherContact", "mother_contact") : read("guardianContact", "guardian_contact")],
    ["4Ps Member", read("is4PsMember", "is_4ps_member")],
  ];

  return (
    <div className="portal-dashboard-page p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(recordsPath)}
          className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:opacity-75"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Records
        </button>
        <DashboardPageHeader
          badge="Student Management"
          title="Student Profile"
          subtitle={`Complete student record dashboard for ${studentName}`}
          icon={GraduationCap}
        />
      </div>

      <section className="mb-5 overflow-hidden rounded-2xl border border-white/40 bg-white shadow-xl shadow-blue-950/10">
        <div
          className="px-5 py-6 sm:px-6 lg:px-8"
          style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 72%, #A11A0D 100%)" }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-3xl font-bold text-white shadow-lg">
                {initials}
              </div>
              <div className="min-w-0 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Official student record</p>
                <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{studentName}</h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85">
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {enrollment.user_id || read("email") || "No email recorded"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {valueOrDash(read("contactNumber", "contact_number"))}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-white backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Enrollment ID</p>
              <p className="mt-1 font-mono text-sm font-bold">{enrollment.id || id}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 bg-slate-50/80 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                <p className="mt-1 truncate text-lg font-bold text-slate-950">{metric.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="space-y-5">
          <RecordSection title="Complete Enrollment Form Information" description="Personal, admission, contact, and demographic details submitted by the student." icon={User}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {personalFields.map(([label, value]) => (
                <FieldItem key={label} label={String(label)} value={value} />
              ))}
            </div>
          </RecordSection>

          <RecordSection title="Address and Residency" description="Residential information from the enrollment form." icon={MapPin}>
            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">
              <FieldItem label="Complete Address" value={address} />
              <FieldItem label="Region" value={read("region")} />
              <FieldItem label="Province" value={read("province")} />
              <FieldItem label="City / Municipality" value={read("city")} />
              <FieldItem label="Barangay" value={read("barangay")} />
              <FieldItem label="House / Street" value={read("homeAddress", "home_address")} />
            </div>
          </RecordSection>

          <RecordSection title="Parent and Guardian Information" description="Family contacts and emergency guardian details." icon={Users}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {familyFields.map(([label, value]) => (
                <FieldItem key={label} label={String(label)} value={value} />
              ))}
            </div>
          </RecordSection>

          <RecordSection title="Academic and Enrollment Details" description="Track, electives, grade level, and prior school background." icon={School}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {academicFields.map(([label, value]) => (
                <FieldItem key={label} label={String(label)} value={value} />
              ))}
            </div>
          </RecordSection>
        </div>

        <div className="space-y-5">
          <RecordSection title="Enrollment Timeline" description="Application dates and system status." icon={CalendarDays}>
            <div className="grid gap-3">
              <FieldItem label="Enrollment Date" value={formatDate(enrollment.enrollment_date || enrollment.created_at)} />
              <FieldItem label="Submission Date" value={formatDate(read("submissionDate", "submission_date"))} />
              <FieldItem label="Current Status" value={normalizeStatus(enrollment.status)} />
              <FieldItem label="Last Updated" value={formatDate(enrollment.updated_at)} />
            </div>
          </RecordSection>

          <RecordSection title="Uploaded Documents" description={`${documentStatusCounts.total} document record${documentStatusCounts.total === 1 ? "" : "s"} found.`} icon={Image}>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  No uploaded documents found.
                </div>
              ) : (
                documents.map((document: any) => (
                  <div key={document.id || document.document_type} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-950">
                          {DOCUMENT_LABELS[document.document_type] || document.document_type || "Document"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">{document.file_name || document.file_path || document.file_url || "Uploaded file"}</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                        {normalizeStatus(document.status || (document.verified ? "approved" : "pending"))}
                      </span>
                    </div>
                    {(document.file_path || document.file_url) && (
                      <a
                        href={document.file_url || document.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
                      >
                        View File
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </RecordSection>

          <RecordSection title="Payment Records" description={latestPayment ? `Latest status: ${normalizeStatus(latestPayment.status)}` : "No latest payment available."} icon={CreditCard}>
            <div className="space-y-3">
              {payments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  No payment records found.
                </div>
              ) : (
                payments.map((payment: any) => (
                  <div key={payment.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">
                          {payment.payment_method || payment.paymentMode || "Payment"} - {formatCurrency(payment.amount)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Reference: {payment.reference_number || payment.referenceNumber || payment.queue_number || payment.queueNumber || "Not provided"}
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {normalizeStatus(payment.status)}
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(payment.submitted_at || payment.submittedDate || payment.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </RecordSection>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <RecordSection title="Assessment Summary" description="Recorded AI assessment recommendation and score data." icon={ClipboardList}>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldItem label="Recommended Track" value={assessment?.recommended_track || assessment?.track} />
            <FieldItem label="Overall Score" value={assessment?.overall_score ? `${assessment.overall_score}%` : ""} />
            <FieldItem label="Assessment Date" value={formatDate(assessment?.created_at)} />
            <FieldItem label="Top Domains" value={Array.isArray(assessment?.top_domains) ? assessment.top_domains.join(", ") : assessment?.top_domains} />
          </div>
        </RecordSection>

        <RecordSection title="Enrollment Progress" description="System progress checkpoints tied to the student account." icon={ShieldCheck}>
          <div className="space-y-3">
            {progress.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                No enrollment progress records found.
              </div>
            ) : (
              progress.map((step: any) => {
                const completed = String(step.status || "").toLowerCase() === "completed";
                return (
                  <div key={step.id || step.step_name} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 shrink-0 text-amber-600" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">{step.step_name || step.name}</p>
                        <p className="text-xs text-slate-500">{formatDate(step.updated_at || step.created_at)}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      {normalizeStatus(step.status)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </RecordSection>
      </div>

      <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h3 className="font-bold text-amber-950">Record Review Note</h3>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              This dashboard reflects the submitted enrollment record and linked system activity. Any missing values indicate fields that were not captured in the student's current enrollment submission.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
