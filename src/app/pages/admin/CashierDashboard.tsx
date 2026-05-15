import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
  Phone,
  Hash,
  Calendar,
  FileText,
  Banknote,
  CreditCard,
  Wallet,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";
import { LoadingState } from "../../components/LoadingState";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../../supabase";
import { getAllPayments, updatePaymentStatus, createAuditLog } from "../../../services/adminService";
import { triggerNotification } from "../../../services/notificationService";
import { loadProfileImageUrl } from "../../utils/profileImage";

const CASH_QUEUE_TIME_LABEL = "9:00 AM - 4:00 PM";

function formatCashQueueTime(timeValue?: string | null) {
  if (!timeValue) {
    return CASH_QUEUE_TIME_LABEL;
  }

  if (timeValue.includes("AM") || timeValue.includes("PM") || timeValue.includes("-")) {
    return timeValue;
  }

  const [hourPart, minutePart] = timeValue.split(":");
  const hours = Number(hourPart);
  const minutes = Number(minutePart || "0");

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return CASH_QUEUE_TIME_LABEL;
  }

  const startTime = new Date();
  startTime.setHours(hours, minutes, 0, 0);

  return `${startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} - 4:00 PM`;
}

interface OnlinePayment {
  id: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  profilePictureUrl?: string;
  academicTrack?: string;
  yearLevel?: string;
  paymentMode: "bank" | "gcash";
  referenceNumber: string;
  receiptFiles: string[];
  receiptFileName: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  submittedAt: string;
  enrollmentData: any;
  notes?: string;
  rejectionComment?: string;
}

interface CashPayment {
  id: string;
  studentId: string;
  queueNumber: string;
  studentEmail: string;
  studentName: string;
  profilePictureUrl?: string;
  academicTrack?: string;
  yearLevel?: string;
  amount: number;
  schedule: { date: string; time: string };
  status: "pending" | "paid" | "cancelled";
  generatedDate: string;
  submittedAt: string;
  enrollmentData: any;
  paidDate?: string;
}

const getPaymentSubmissionTime = (payment: any) => {
  const timestamp = payment?.submitted_at || payment?.created_at || "";
  const time = new Date(timestamp).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

const OPEN_PAYMENT_STATUSES = new Set(["pending", "submitted"]);

const normalizeText = (value?: string | null) => String(value || "").trim();

const buildFullName = (...parts: Array<string | null | undefined>) =>
  parts
    .map(normalizeText)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const resolveEnrollmentName = (formData: any) =>
  normalizeText(formData?.studentName) ||
  normalizeText(formData?.fullName) ||
  normalizeText(formData?.full_name) ||
  buildFullName(formData?.firstName, formData?.middleName, formData?.lastName) ||
  buildFullName(formData?.first_name, formData?.middle_name, formData?.last_name);

const resolveProfilePictureUrl = (userProfile: any, formData: any) =>
  normalizeText(userProfile?.profilePictureUrl) ||
  normalizeText(formData?.profilePictureUrl) ||
  normalizeText(formData?.profile_picture_url) ||
  normalizeText(formData?.profileImageUrl) ||
  normalizeText(formData?.profile_image_url);

const getStudentInitials = (name: string, email = "") => {
  const source = normalizeText(name) && name !== "Unknown Student" ? name : email;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ST";
};

export function CashierDashboard() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<"online" | "cash">("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlinePayments, setOnlinePayments] = useState<OnlinePayment[]>([]);
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<OnlinePayment | null>(null);
  const [selectedCashPayment, setSelectedCashPayment] = useState<CashPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");
  const [zoom, setZoom] = useState(100);

  const actorReference = userData?.id || userData?.email;
  const actorName = userData?.name || "Cashier";

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    if (selectedPayment) {
      setZoom(100);
      setRejectionComment("");
    }
  }, [selectedPayment]);

  const loadPayments = async () => {
    setIsLoading(true);
    // Load all payments from Supabase
    const { data: allPayments, error } = await getAllPayments();

    if (error) {
      console.error('Error loading payments:', error);
      setOnlinePayments([]);
      setCashPayments([]);
      setIsLoading(false);
      return;
    }

    if (!allPayments) {
      setOnlinePayments([]);
      setCashPayments([]);
      setIsLoading(false);
      return;
    }

    // Fetch user details for student names and profile photos.
    const studentIds = [...new Set(allPayments.map((p: any) => p.student_id).filter(Boolean))];
    const { data: users, error: usersError } = studentIds.length
      ? await supabase
      .from("users")
          .select("id, full_name, first_name, middle_name, last_name, email, profile_picture_url")
          .in("id", studentIds)
      : { data: [] as any[], error: null };

    if (usersError) {
      console.error("Error loading cashier queue student profiles:", usersError);
    }

    const userProfiles = await Promise.all(
      (users || []).map(async (u: any) => {
        const name = normalizeText(u.full_name) || buildFullName(u.first_name, u.middle_name, u.last_name);
        const profilePictureUrl =
          normalizeText(u.profile_picture_url) ||
          (await loadProfileImageUrl(u.id, u.email));

        return {
          id: u.id,
          name,
          email: normalizeText(u.email),
          profilePictureUrl,
        };
      })
    );

    const userMap: Record<string, { name: string; email: string; profilePictureUrl?: string }> = {};
    userProfiles.forEach((user) => {
      userMap[user.id] = {
        name: user.name,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
      };
    });

    const enrollmentIds = [...new Set(allPayments.map((p: any) => p.enrollment_id).filter(Boolean))];
    const studentEmails = [...new Set(Object.values(userMap).map((user) => user.email).filter(Boolean))];
    const [{ data: enrollmentsById }, { data: enrollmentsByEmail }] = await Promise.all([
      enrollmentIds.length
        ? supabase
            .from("enrollments")
            .select("id, user_id, form_data")
            .in("id", enrollmentIds)
        : Promise.resolve({ data: [] as any[] }),
      studentEmails.length
        ? supabase
            .from("enrollments")
            .select("id, user_id, form_data, enrollment_date, created_at")
            .in("user_id", studentEmails)
            .order("enrollment_date", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const enrollmentMap: Record<string, any> = {};
    const enrollmentByEmailMap: Record<string, any> = {};
    enrollmentsById?.forEach((enrollment: any) => {
      enrollmentMap[enrollment.id] = enrollment.form_data || {};
      if (enrollment.user_id) enrollmentByEmailMap[enrollment.user_id] = enrollment.form_data || {};
    });
    enrollmentsByEmail?.forEach((enrollment: any) => {
      if (enrollment.user_id && !enrollmentByEmailMap[enrollment.user_id]) {
        enrollmentByEmailMap[enrollment.user_id] = enrollment.form_data || {};
      }
    });

    const getEnrollmentData = (payment: any) =>
      enrollmentMap[payment.enrollment_id] ||
      enrollmentByEmailMap[userMap[payment.student_id]?.email] ||
      {};
    const getStudentProfile = (payment: any) => {
      const formData = getEnrollmentData(payment);
      const userProfile = userMap[payment.student_id] || {};
      const email = normalizeText(userProfile.email) || normalizeText(formData.email) || normalizeText(payment.student_id);
      const name =
        normalizeText(userProfile.name) ||
        resolveEnrollmentName(formData) ||
        (email.includes("@") ? email.split("@")[0].replace(/[._-]+/g, " ") : "") ||
        "Unknown Student";

      return {
        id: normalizeText(payment.student_id),
        email,
        name,
        profilePictureUrl: resolveProfilePictureUrl(userProfile, formData),
        enrollmentData: formData,
      };
    };
    const getAcademicTrack = (formData: any) =>
      formData.preferredTrack ||
      formData.preferred_track ||
      formData.recommendedTrack ||
      formData.recommended_track ||
      formData.track ||
      "Not set";

    // Separate online vs cash payments
    const onlinePending = allPayments
      .filter((p: any) => (p.payment_method === 'bank' || p.payment_method === 'gcash') && OPEN_PAYMENT_STATUSES.has(String(p.status || "").toLowerCase()))
      .sort((a: any, b: any) => getPaymentSubmissionTime(a) - getPaymentSubmissionTime(b))
      .map((p: any) => {
        const receiptFiles = p.receipt_file_url
          ? String(p.receipt_file_url)
              .split(/[;,]/)
              .map((item: string) => item.trim())
              .filter(Boolean)
          : [];

        const studentProfile = getStudentProfile(p);

        return {
          id: p.id,
          studentId: studentProfile.id,
          studentEmail: studentProfile.email,
          studentName: studentProfile.name,
          profilePictureUrl: studentProfile.profilePictureUrl,
          academicTrack: getAcademicTrack(studentProfile.enrollmentData),
          yearLevel: studentProfile.enrollmentData.yearLevel || studentProfile.enrollmentData.year_level || "Not set",
          paymentMode: p.payment_method as "bank" | "gcash",
          referenceNumber: p.reference_number || '',
          receiptFiles,
          receiptFileName: p.receipt_file_path?.split('/').pop() || 'receipt',
          amount: Number(p.amount) || 0,
          status: 'pending' as const,
          submittedDate: p.submitted_at
            ? new Date(p.submitted_at).toLocaleString()
            : new Date(p.created_at).toLocaleString(),
          submittedAt: p.submitted_at || p.created_at || "",
          enrollmentData: studentProfile.enrollmentData,
          notes: p.notes || '',
        };
      });

    const cashPending = allPayments
      .filter((p: any) => p.payment_method === 'cash' && OPEN_PAYMENT_STATUSES.has(String(p.status || "").toLowerCase()))
      .sort((a: any, b: any) => getPaymentSubmissionTime(a) - getPaymentSubmissionTime(b))
      .map((p: any) => {
        const studentProfile = getStudentProfile(p);

        return {
          id: p.id,
          studentId: studentProfile.id,
          queueNumber: p.queue_number || '',
          studentEmail: studentProfile.email,
          studentName: studentProfile.name,
          profilePictureUrl: studentProfile.profilePictureUrl,
          academicTrack: getAcademicTrack(studentProfile.enrollmentData),
          yearLevel: studentProfile.enrollmentData.yearLevel || studentProfile.enrollmentData.year_level || "Not set",
          amount: Number(p.amount) || 0,
          schedule: {
            date: p.queue_schedule_date
              ? new Date(p.queue_schedule_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : '',
            time: formatCashQueueTime(p.queue_schedule_time),
          },
          status: 'pending' as const,
          generatedDate: new Date(p.created_at).toLocaleDateString(),
          submittedAt: p.submitted_at || p.created_at || "",
          enrollmentData: studentProfile.enrollmentData,
        };
      });

    setOnlinePayments(onlinePending);
    setCashPayments(cashPending);
    setIsLoading(false);
  };

  const handleApproveOnlinePayment = async () => {
    if (!selectedPayment) return;

    // Update payment status in Supabase
    const { error } = await updatePaymentStatus(selectedPayment.id, 'approved', actorReference);

    if (error) {
      alert(`Error approving payment: ${error}`);
      return;
    }

    // Create audit log
    await createAuditLog(
      actorReference,
      'PAYMENT_VERIFIED',
      `Payment approved by ${actorName}: ${selectedPayment.referenceNumber}`,
      'success'
    );

    // Create notification
    try {
      await triggerNotification(selectedPayment.studentEmail, 'PAYMENT_VERIFIED');
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    // Auto-load next pending payment
    const currentIndex = onlinePayments.findIndex(p => p.id === selectedPayment!.id);
    const nextPending = onlinePayments.slice(currentIndex + 1).find(p => p.status === 'pending');

    if (nextPending) {
      setSelectedPayment(nextPending);
      setZoom(100);
      alert("Payment approved! Loading next pending payment.");
    } else {
      alert("Payment approved! No more pending payments.");
      setShowReviewModal(false);
      setSelectedPayment(null);
    }

    loadPayments();
  };

  const handleRejectOnlinePayment = async () => {
    if (!selectedPayment || !rejectionComment.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    // Update payment status in Supabase
  const { error } = await updatePaymentStatus(selectedPayment.id, 'rejected', actorReference, rejectionComment.trim());

    if (error) {
      alert(`Error rejecting payment: ${error}`);
      return;
    }

    // Create audit log
    await createAuditLog(
      actorReference,
      'PAYMENT_REJECTED',
      `Payment rejected by ${actorName}: ${selectedPayment.referenceNumber} - Reason: ${rejectionComment.trim()}`,
      'warning'
    );

    // Create notification
    try {
      await triggerNotification(selectedPayment.studentEmail, 'PAYMENT_REJECTED');
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    alert("Payment rejected. Student will be notified.");
    loadPayments();
    setShowReviewModal(false);
    setShowRejectReasonModal(false);
    setSelectedPayment(null);
    setRejectionComment("");
  };

  const handleConfirmCashPayment = async () => {
    if (!selectedCashPayment) return;

    // Update payment status in Supabase
    const { error } = await updatePaymentStatus(selectedCashPayment.id, 'paid', actorReference);

    if (error) {
      alert(`Error confirming cash payment: ${error}`);
      return;
    }

    // Create audit log
    await createAuditLog(
      actorReference,
      'PAYMENT_VERIFIED',
      `Cash payment confirmed by ${actorName}: Queue #${selectedCashPayment.queueNumber}`,
      'success'
    );

    // Create notification
    try {
      await triggerNotification(selectedCashPayment.studentEmail, 'PAYMENT_VERIFIED');
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    loadPayments();
    setShowCashModal(false);
    setSelectedCashPayment(null);
    alert("Cash payment confirmed! Student has been enrolled successfully.");
  };

  // Filter payments
  const filteredOnlinePayments = onlinePayments.filter(
    (p) =>
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCashPayments = cashPayments.filter(
    (p) =>
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.queueNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const onlinePending = onlinePayments.filter((p) => p.status === "pending").length;
  const onlineApproved = onlinePayments.filter((p) => p.status === "approved").length;
  const cashPending = cashPayments.filter((p) => p.status === "pending").length;
  const cashPaid = cashPayments.filter((p) => p.status === "paid").length;

  const selectedReceiptUrls = selectedPayment?.receiptFiles?.length ? selectedPayment.receiptFiles : [];
  const isPaymentReferenceDuplicate = selectedPayment
    ? onlinePayments.filter((p) => p.referenceNumber && p.referenceNumber === selectedPayment.referenceNumber).length > 1
    : false;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <LoadingState
          message="Loading dashboard data..."
          subtext="Fetching cashier payment queues and transaction summaries."
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashboardPageHeader
        badge="Payment Processing"
        title="Payment Queue"
        subtitle="Review and approve student payment submissions"
        icon={DollarSign}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Online Pending</p>
              <p className="text-3xl font-bold text-gray-900">{onlinePending}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Online Approved</p>
              <p className="text-3xl font-bold text-gray-900">{onlineApproved}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Cash Queue Pending</p>
              <p className="text-3xl font-bold text-gray-900">{cashPending}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Banknote className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Cash Confirmed</p>
              <p className="text-3xl font-bold text-gray-900">{cashPaid}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("online")}
            className={`px-6 py-4 font-bold transition-all flex-1 ${
              activeTab === "online"
                ? "text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={activeTab === "online" ? { backgroundColor: "var(--electron-blue)" } : { backgroundColor: "transparent" }}
          >
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" />
              Online Payments ({onlinePayments.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("cash")}
            className={`px-6 py-4 font-bold transition-all flex-1 ${
              activeTab === "cash"
                ? "text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={activeTab === "cash" ? { backgroundColor: "var(--electron-blue)" } : { backgroundColor: "transparent" }}
          >
            <div className="flex items-center justify-center gap-2">
              <Banknote className="w-5 h-5" />
              Cash Payments ({cashPayments.length})
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, reference, queue number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm transition-all"
              style={{ "--tw-ring-color": "var(--electron-blue)" } as any}
            />
          </div>
        </div>

        {/* Online Payments Tab */}
        {activeTab === "online" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference Number
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOnlinePayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden text-sm font-bold text-blue-700">
                          {payment.profilePictureUrl ? (
                            <img src={payment.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            getStudentInitials(payment.studentName, payment.studentEmail)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{payment.studentName}</div>
                          <div className="text-sm text-gray-500 truncate">{payment.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {payment.paymentMode === "bank" ? (
                          <>
                            <CreditCard className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-900">Bank</span>
                          </>
                        ) : (
                          <>
                            <Wallet className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-900">GCash</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm text-gray-900 font-mono truncate">{payment.referenceNumber}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{payment.submittedDate}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {payment.status === "pending" && (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                          Pending
                        </span>
                      )}
                      {payment.status === "approved" && (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      )}
                      {payment.status === "rejected" && (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowReviewModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOnlinePayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                      No online payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Cash Payments Tab */}
        {activeTab === "cash" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Queue #
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCashPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-blue-600">{payment.queueNumber}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden text-sm font-bold text-green-700">
                          {payment.profilePictureUrl ? (
                            <img src={payment.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            getStudentInitials(payment.studentName, payment.studentEmail)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{payment.studentName}</div>
                          <div className="text-sm text-gray-500 truncate">{payment.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900">{payment.schedule.date}</div>
                          <div className="text-xs text-gray-500">{payment.schedule.time}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{payment.generatedDate}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {payment.status === "pending" && (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Awaiting
                        </span>
                      )}
                      {payment.status === "paid" && (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedCashPayment(payment);
                          setShowCashModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-green-600 hover:text-green-800 font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {payment.status === "pending" ? "Process" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCashPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                      No cash payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Online Payment Review Modal */}
      {showReviewModal && selectedPayment && (
        <div className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center bg-white/35 p-4 backdrop-blur-sm lg:left-[var(--dashboard-sidebar-offset,0px)]" onClick={() => setShowReviewModal(false)}>
          <div className="w-full max-w-7xl rounded-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="portal-glass-modal">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/20">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Payment Verification</h2>
                  <p className="text-slate-600 mt-1 text-sm">
                    {selectedPayment.paymentMode === "bank" ? "Bank Transfer" : "GCash Payment"} Review
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="portal-glass-icon-button rounded-xl p-2 transition-colors"
                >
                  <XCircle className="w-6 h-6 text-slate-700" />
                </button>
              </div>

              {/* Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
                {/* Left Side: Receipt Viewer */}
                <div className="p-6 flex flex-col border-r border-white/10">
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Payment Receipt</p>
                        <p className="text-xs text-slate-600">Inspect screenshot authenticity and transaction details</p>
                      </div>
                      <span className="rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-semibold text-slate-700">
                        Receipt preview
                      </span>
                    </div>
                    <div className="rounded-2xl portal-glass-panel p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setZoom(Math.max(50, zoom - 25))}
                          className="portal-glass-icon-button inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-slate-700">{zoom}%</span>
                        <button
                          onClick={() => setZoom(Math.min(300, zoom + 25))}
                          className="portal-glass-icon-button inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setZoom(100)}
                          className="portal-glass-icon-button inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const container = document.querySelector('.receipt-preview') as HTMLElement;
                            if (container?.requestFullscreen) container.requestFullscreen();
                          }}
                          className="portal-glass-icon-button inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700"
                        >
                          <Maximize className="w-4 h-4" />
                        </button>
                        <a
                          href={selectedReceiptUrls[0] || ''}
                          download={selectedPayment.receiptFileName}
                          className="portal-glass-icon-button inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm receipt-preview mb-4">
                    {selectedReceiptUrls[0] ? (
                      <img
                        src={selectedReceiptUrls[0]}
                        alt="Payment Receipt"
                        className="w-full h-full object-contain"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                      />
                    ) : (
                      <div className="flex h-full min-h-[360px] items-center justify-center text-center text-slate-300">
                        <div>
                          <FileText className="mx-auto mb-3 h-12 w-12" />
                          <p className="text-sm font-semibold">No receipt image available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Verification Panel */}
                <div className="p-6 flex flex-col">
                  {/* Student Information Card */}
                  <div className="portal-glass-panel rounded-2xl p-5 mb-6">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Student Information</h4>
                    <div className="mb-5 flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                        {selectedPayment.profilePictureUrl ? (
                          <img src={selectedPayment.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          getStudentInitials(selectedPayment.studentName, selectedPayment.studentEmail)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-slate-950">{selectedPayment.studentName}</p>
                        <p className="truncate text-sm text-slate-600">{selectedPayment.studentEmail}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Student ID</span>
                        <span className="text-sm font-medium text-slate-900">{selectedPayment.studentId || "Not provided"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Academic Track</span>
                        <span className="text-sm font-medium text-slate-900">{selectedPayment.academicTrack || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Year Level</span>
                        <span className="text-sm font-medium text-slate-900">{selectedPayment.yearLevel || 'Not set'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information Card */}
                  <div className="portal-glass-panel-strong rounded-2xl p-5 mb-6">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Payment Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Payment Method</span>
                        <span className="text-sm font-medium text-slate-900">{selectedPayment.paymentMode === "bank" ? "Bank Transfer" : "GCash"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Reference Number</span>
                        <span className="text-sm font-mono font-medium text-slate-900">{selectedPayment.referenceNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Transaction ID</span>
                        <span className="text-sm font-mono font-medium text-slate-900">{selectedPayment.id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Submitted Date</span>
                        <span className="text-sm font-medium text-slate-900">{selectedPayment.submittedDate}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/20">
                        <span className="text-sm text-slate-700 font-semibold">Amount Paid</span>
                        <span className="text-lg font-bold" style={{ color: '#2563eb' }}>
                          {selectedPayment.amount.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Validation Warnings */}
                  {isPaymentReferenceDuplicate && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-400/30 backdrop-blur rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-900">Possible duplicate reference detected</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={() => {
                        setRejectionComment("");
                        setShowRejectReasonModal(true);
                      }}
                      className="flex-1 py-3 px-4 border border-red-300/50 bg-red-500/10 text-red-600 rounded-xl font-semibold hover:bg-red-500/20 transition-colors backdrop-blur"
                    >
                      Reject Payment
                    </button>
                    <button
                      onClick={handleApproveOnlinePayment}
                      className="flex-1 py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all text-white"
                      style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)' }}
                    >
                      Approve & Enroll
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectReasonModal && selectedPayment && (
        <div
          className="fixed inset-y-0 right-0 left-0 z-[60] flex items-center justify-center bg-white/35 p-4 backdrop-blur-sm lg:left-[var(--dashboard-sidebar-offset,0px)]"
          onClick={() => setShowRejectReasonModal(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-red-100 bg-red-50 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Reject Payment</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Add a clear reason for rejecting reference {selectedPayment.referenceNumber || "N/A"}.
                  </p>
                </div>
                <button
                  onClick={() => setShowRejectReasonModal(false)}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-800"
                  aria-label="Close rejection reason modal"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Rejection Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionComment}
                onChange={(event) => setRejectionComment(event.target.value)}
                placeholder="Explain what the student needs to correct or re-submit."
                rows={5}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowRejectReasonModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectOnlinePayment}
                  disabled={!rejectionComment.trim()}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Payment Modal */}
      {showCashModal && selectedCashPayment && (
        <div className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center bg-white/35 p-4 backdrop-blur-sm lg:left-[var(--dashboard-sidebar-offset,0px)]" onClick={() => setShowCashModal(false)}>
          <div className="w-full max-w-7xl rounded-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="portal-glass-modal">
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/20">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Payment Verification</h2>
                    <p className="text-slate-600 mt-1 text-sm">Over-the-Counter Payment Review</p>
                  </div>
                  <button
                    onClick={() => setShowCashModal(false)}
                    className="portal-glass-icon-button rounded-xl p-2 transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-slate-700" />
                  </button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-2 lg:items-start">
                  {/* Queue Info */}
                  <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-8 text-center shadow-inner lg:row-span-4 lg:min-h-[520px] lg:flex lg:flex-col lg:justify-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-700/20">
                      <Hash className="h-10 w-10" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Queue Number</p>
                    <h2 className="mb-5 mt-4 break-all font-mono text-6xl font-black text-emerald-700 sm:text-7xl">
                      {selectedCashPayment.queueNumber}
                    </h2>
                    <p className="mx-auto mb-8 max-w-md text-sm leading-6 text-slate-600">
                      Verify this queue number with the student before confirming the in-person payment.
                    </p>
                    <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/70 bg-white/75 p-4 text-left shadow-sm">
                        <Calendar className="w-4 h-4" />
                        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">Schedule Date</p>
                        <p className="mt-1 font-bold text-slate-950">{selectedCashPayment.schedule.date}</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/75 p-4 text-left shadow-sm">
                        <Clock className="w-4 h-4" />
                        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">Cashier Hours</p>
                        <p className="mt-1 font-bold text-slate-950">{selectedCashPayment.schedule.time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="portal-glass-panel rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Student Information</h3>
                    <div className="mb-5 flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-700">
                        {selectedCashPayment.profilePictureUrl ? (
                          <img src={selectedCashPayment.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          getStudentInitials(selectedCashPayment.studentName, selectedCashPayment.studentEmail)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-slate-950">{selectedCashPayment.studentName}</p>
                        <p className="truncate text-sm text-slate-600">{selectedCashPayment.studentEmail}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Academic Track:</span>
                        <span className="font-medium text-gray-900">{selectedCashPayment.academicTrack || "Not set"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Year Level:</span>
                        <span className="font-medium text-gray-900">{selectedCashPayment.yearLevel || "Not set"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="portal-glass-panel-strong rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Payment Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium text-gray-900">Over-the-Counter</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-mono font-semibold break-all text-right text-gray-900">
                          {selectedCashPayment.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Due:</span>
                        <span className="font-bold text-lg text-green-600">
                          {selectedCashPayment.amount.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Generated:</span>
                        <span className="font-medium text-gray-900">{selectedCashPayment.generatedDate}</span>
                      </div>
                      {selectedCashPayment.paidDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Paid Date:</span>
                          <span className="font-medium text-gray-900">{selectedCashPayment.paidDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  {selectedCashPayment.status === "paid" && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-semibold text-green-900">
                          Payment has been confirmed and student is enrolled
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                {selectedCashPayment.status === "pending" && (
                  <div className="border-t border-white/20 bg-white/45 p-6">
                    <button
                      onClick={handleConfirmCashPayment}
                      className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-lg shadow-emerald-700/15 transition-all hover:bg-emerald-700 hover:shadow-xl"
                    >
                      Confirm Payment Received & Enroll
                    </button>
                    <p className="mt-3 text-center text-xs font-medium text-slate-600">
                      Only click this button after receiving the payment in person.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
