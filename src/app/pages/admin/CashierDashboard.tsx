import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
  User,
  Mail,
  Phone,
  Hash,
  Calendar,
  FileText,
  Banknote,
  CreditCard,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../../supabase";
import { getAllPayments, updatePaymentStatus, createAuditLog } from "../../../services/adminService";
import { triggerNotification } from "../../../services/notificationService";

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
  studentEmail: string;
  studentName: string;
  paymentMode: "bank" | "gcash";
  referenceNumber: string;
  receiptData: string;
  receiptFileName: string;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  enrollmentData: any;
  rejectionComment?: string;
}

interface CashPayment {
  id: string;
  queueNumber: string;
  studentEmail: string;
  studentName: string;
  schedule: { date: string; time: string };
  status: "pending" | "paid" | "cancelled";
  generatedDate: string;
  enrollmentData: any;
  paidDate?: string;
}

export function CashierDashboard() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<"online" | "cash">("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlinePayments, setOnlinePayments] = useState<OnlinePayment[]>([]);
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<OnlinePayment | null>(null);
  const [selectedCashPayment, setSelectedCashPayment] = useState<CashPayment | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");

  const actorReference = userData?.id || userData?.email;
  const actorName = userData?.name || "Cashier";

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    // Load all payments from Supabase
    const { data: allPayments, error } = await getAllPayments();

    if (error) {
      console.error('Error loading payments:', error);
      setOnlinePayments([]);
      setCashPayments([]);
      return;
    }

    if (!allPayments) {
      setOnlinePayments([]);
      setCashPayments([]);
      return;
    }

    // Fetch user details for student names
    const studentIds = [...new Set(allPayments.map((p: any) => p.student_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", studentIds);

    const userMap: Record<string, { name: string; email: string }> = {};
    users?.forEach((u: any) => {
      userMap[u.id] = { name: u.full_name, email: u.email };
    });

    // Separate online vs cash payments
    const onlinePending = allPayments
      .filter((p: any) => (p.payment_method === 'bank' || p.payment_method === 'gcash') && p.status === 'pending')
      .map((p: any) => ({
        id: p.id,
        studentEmail: userMap[p.student_id]?.email || p.student_id,
        studentName: userMap[p.student_id]?.name || 'Unknown Student',
        paymentMode: p.payment_method as "bank" | "gcash",
        referenceNumber: p.reference_number || '',
        receiptData: p.receipt_file_url || '',
        receiptFileName: p.receipt_file_path?.split('/').pop() || 'receipt',
        status: 'pending' as const,
        submittedDate: p.submitted_at
          ? new Date(p.submitted_at).toLocaleDateString()
          : new Date(p.created_at).toLocaleDateString(),
        enrollmentData: {},
      }));

    const cashPending = allPayments
      .filter((p: any) => p.payment_method === 'cash' && p.status === 'pending')
      .map((p: any) => ({
        id: p.id,
        queueNumber: p.queue_number || '',
        studentEmail: userMap[p.student_id]?.email || p.student_id,
        studentName: userMap[p.student_id]?.name || 'Unknown Student',
        schedule: {
          date: p.queue_schedule_date
            ? new Date(p.queue_schedule_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
            : '',
          time: formatCashQueueTime(p.queue_schedule_time),
        },
        status: 'pending' as const,
        generatedDate: new Date(p.created_at).toLocaleDateString(),
        enrollmentData: {},
      }));

    setOnlinePayments(onlinePending);
    setCashPayments(cashPending);
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

    alert("Payment approved! Student has been enrolled successfully.");
    loadPayments();
    setShowReviewModal(false);
    setSelectedPayment(null);
  };

  const handleRejectOnlinePayment = async () => {
    if (!selectedPayment || !rejectionComment.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    // Update payment status in Supabase
  const { error } = await updatePaymentStatus(selectedPayment.id, 'rejected', actorReference);

    if (error) {
      alert(`Error rejecting payment: ${error}`);
      return;
    }

    // Create audit log
    await createAuditLog(
      actorReference,
      'PAYMENT_REJECTED',
      `Payment rejected by ${actorName}: ${selectedPayment.referenceNumber} - Reason: ${rejectionComment}`,
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold" style={{ color: "var(--electron-blue)" }}>
          <DollarSign className="h-4 w-4" />
          Payment Processing
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--electron-blue)" }}>Payment Management</h1>
        <p className="text-gray-600 text-lg">Review and approve student payment submissions</p>
      </div>

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
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
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
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-green-600" />
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
        <div className="fixed inset-0 z-50 overflow-hidden" onClick={() => setShowReviewModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="px-6 py-6" style={{ background: "linear-gradient(135deg, var(--electron-blue) 0%, #1e40af 100%)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Payment Review</h2>
                      <p className="text-blue-100 mt-1 text-sm">
                        {selectedPayment.paymentMode === "bank" ? "Bank Transfer" : "GCash Payment"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="text-white hover:text-blue-100 hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Student Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Student Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900">{selectedPayment.studentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{selectedPayment.studentEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-mono font-semibold break-all text-right text-gray-900">
                          {selectedPayment.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reference Number:</span>
                        <span className="font-mono font-semibold text-gray-900">
                          {selectedPayment.referenceNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted Date:</span>
                        <span className="font-medium text-gray-900">{selectedPayment.submittedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-bold text-lg text-blue-600">₱15,000.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Preview */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Receipt</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={selectedPayment.receiptData}
                        alt="Payment Receipt"
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      File: {selectedPayment.receiptFileName}
                    </p>
                  </div>

                  {/* Enrollment Details */}
                  {selectedPayment.enrollmentData && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Enrollment Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Track:</span>
                          <span className="font-medium text-gray-900">
                            {selectedPayment.enrollmentData.preferredTrack}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Year Level:</span>
                          <span className="font-medium text-gray-900">
                            {selectedPayment.enrollmentData.yearLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection Comment */}
                  {selectedPayment.status === "pending" && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Rejection Comment (if rejecting)
                      </label>
                      <textarea
                        value={rejectionComment}
                        onChange={(e) => setRejectionComment(e.target.value)}
                        placeholder="Provide a reason if rejecting this payment..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  )}

                  {/* Status Display */}
                  {selectedPayment.status !== "pending" && (
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        selectedPayment.status === "approved"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1">
                        Status: {selectedPayment.status.toUpperCase()}
                      </p>
                      {selectedPayment.rejectionComment && (
                        <p className="text-sm text-gray-700">
                          Comment: {selectedPayment.rejectionComment}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                {selectedPayment.status === "pending" && (
                  <div className="border-t border-gray-200 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="flex gap-3">
                      <button
                        onClick={handleRejectOnlinePayment}
                        className="flex-1 py-3 px-4 text-white rounded-lg font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                        style={{ backgroundColor: "var(--electron-red)" }}
                      >
                        Reject Payment
                      </button>
                      <button
                        onClick={handleApproveOnlinePayment}
                        className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        Approve & Enroll
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Payment Modal */}
      {showCashModal && selectedCashPayment && (
        <div className="fixed inset-0 z-50 overflow-hidden" onClick={() => setShowCashModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="px-6 py-6" style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Cash Payment</h2>
                      <p className="text-green-100 mt-1 text-sm">Queue #{selectedCashPayment.queueNumber}</p>
                    </div>
                    <button
                      onClick={() => setShowCashModal(false)}
                      className="text-white hover:text-green-100 hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Queue Info */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">QUEUE NUMBER</p>
                    <h2 className="text-5xl font-bold text-blue-600 mb-4">
                      {selectedCashPayment.queueNumber}
                    </h2>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{selectedCashPayment.schedule.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{selectedCashPayment.schedule.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Student Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900">{selectedCashPayment.studentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{selectedCashPayment.studentEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-green-50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-mono font-semibold break-all text-right text-gray-900">
                          {selectedCashPayment.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Due:</span>
                        <span className="font-bold text-lg text-green-600">₱15,000.00</span>
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

                  {/* Enrollment Info */}
                  {selectedCashPayment.enrollmentData && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Enrollment Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Track:</span>
                          <span className="font-medium text-gray-900">
                            {selectedCashPayment.enrollmentData.preferredTrack}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Year Level:</span>
                          <span className="font-medium text-gray-900">
                            {selectedCashPayment.enrollmentData.yearLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  {selectedCashPayment.status === "paid" && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
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
                  <div className="border-t border-gray-200 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                    <button
                      onClick={handleConfirmCashPayment}
                      className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Confirm Payment Received & Enroll
                    </button>
                    <p className="text-xs text-gray-600 mt-3 text-center font-medium">
                      ✓ Only click this button after receiving the payment in person
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}