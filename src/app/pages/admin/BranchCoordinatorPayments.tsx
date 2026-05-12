import { useState, useEffect, type ReactNode } from "react";
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  CreditCard,
  Banknote,
  Calendar,
  User,
  Filter,
  FileText,
  Eye,
  AlertCircle,
  X,
  Printer,
  Maximize2,
  ZoomIn,
} from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";
import { LoadingState } from "../../components/LoadingState";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { supabase } from "../../../supabase";

interface PaymentRecord {
  id: string;
  studentId?: string;
  studentEmail: string;
  studentName: string;
  academicTrack?: string;
  paymentMode: string;
  referenceNumber?: string;
  queueNumber?: string;
  amount: number;
  status: string;
  submittedDate: string;
  processedDate?: string;
  processedBy?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  rejectionComment?: string;
}

const normalizePaymentStatus = (status?: string) => {
  const normalized = String(status || "pending").trim().toLowerCase();

  if (["approved", "paid", "verified", "completed", "complete", "success", "successful"].includes(normalized)) {
    return "approved";
  }

  if (["rejected", "declined", "denied", "failed"].includes(normalized)) {
    return "rejected";
  }

  return "pending";
};

const normalizePaymentMode = (mode?: string) => {
  const normalized = String(mode || "cash").trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (normalized.includes("gcash")) return "gcash";
  if (normalized.includes("bank")) return "bank";
  if (normalized.includes("cash")) return "cash";

  return normalized || "cash";
};

const getPaymentModeLabel = (mode?: string) => {
  switch (normalizePaymentMode(mode)) {
    case "bank":
      return "Bank Transfer";
    case "gcash":
      return "GCash";
    case "cash":
      return "Cash";
    default:
      return String(mode || "Payment").replace(/_/g, " ");
  }
};

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

const formatTransactionDate = (value?: string) => {
  if (!value) return "Not processed";
  const date = new Date(value);
  if (!isValidDate(date)) return "Not processed";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getReceiptUrl = (payment: any) => {
  const rawUrl = payment?.receipt_file_url || payment?.receipt_url || payment?.proof_of_payment_url || "";
  return String(rawUrl).split(/[;,]/).map((item) => item.trim()).filter(Boolean)[0] || "";
};

const getReceiptFileName = (payment: any) => {
  const path = payment?.receipt_file_path || payment?.receipt_file_url || payment?.reference_number || "receipt";
  return String(path).split("/").pop() || "receipt";
};

function TransactionDetailRow({
  label,
  value,
  emphasized = false,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  emphasized?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <div
        className={`min-w-0 text-sm font-semibold text-slate-900 ${
          mono ? "font-mono break-all" : ""
        } ${emphasized ? "text-2xl font-bold text-blue-700" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

export function BranchCoordinatorPayments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [receiptZoom, setReceiptZoom] = useState(100);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      // Load all payments from Supabase
      const { data: allPayments, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading payments:", error);
        setPayments([]);
        setIsLoading(false);
        return;
      }

      if (!allPayments || allPayments.length === 0) {
        setPayments([]);
        setIsLoading(false);
        return;
      }

      if (!allPayments || allPayments.length === 0) {
        setPayments([]);
        return;
      }

      // Fetch user details for students and processors
      const userIds = [
        ...new Set(
          allPayments
            .flatMap((payment: any) => [payment.student_id, payment.verified_by, payment.processed_by, payment.updated_by])
            .filter(Boolean)
        ),
      ];
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds);

      const userMap: Record<string, { name: string; email: string }> = {};
      users?.forEach((u: any) => {
        userMap[u.id] = { name: u.full_name, email: u.email };
      });

      const enrollmentIds = [
        ...new Set(allPayments.map((payment: any) => payment.enrollment_id).filter(Boolean)),
      ];
      const { data: enrollments } = enrollmentIds.length
        ? await supabase
            .from("enrollments")
            .select("id, form_data")
            .in("id", enrollmentIds)
        : { data: [] };

      const enrollmentMap: Record<string, any> = {};
      enrollments?.forEach((enrollment: any) => {
        enrollmentMap[enrollment.id] = enrollment.form_data || {};
      });

      const paymentsList: PaymentRecord[] = allPayments.map((p: any) => ({
        id: p.id,
        studentId: enrollmentMap[p.enrollment_id]?.studentId || p.student_id || p.enrollment_id || undefined,
        studentEmail: userMap[p.student_id]?.email || p.student_id,
        studentName:
          userMap[p.student_id]?.name ||
          enrollmentMap[p.enrollment_id]?.studentName ||
          [enrollmentMap[p.enrollment_id]?.firstName, enrollmentMap[p.enrollment_id]?.lastName].filter(Boolean).join(" ") ||
          "Unknown Student",
        academicTrack:
          enrollmentMap[p.enrollment_id]?.preferredTrack ||
          enrollmentMap[p.enrollment_id]?.preferred_track ||
          enrollmentMap[p.enrollment_id]?.track ||
          "Not Set",
        paymentMode: p.payment_method || "cash",
        referenceNumber: p.reference_number || undefined,
        queueNumber: p.queue_number || undefined,
        amount: Number(p.amount) || 15000,
        status: p.status || "pending",
        submittedDate: p.submitted_at || p.created_at,
        processedDate: p.verified_at || p.paid_at || p.updated_at || undefined,
        processedBy:
          userMap[p.verified_by]?.name ||
          userMap[p.processed_by]?.name ||
          userMap[p.updated_by]?.name ||
          p.processed_by ||
          undefined,
        receiptUrl: getReceiptUrl(p) || undefined,
        receiptFileName: getReceiptFileName(p),
        rejectionComment: p.notes || undefined,
      }));

      setPayments(paymentsList);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading payments:", err);
      setPayments([]);
      setIsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPayment(null);
    setReceiptZoom(100);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Filter logic
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  let filteredPayments = payments.filter((payment) => {
    if (!normalizedSearchQuery) return true;

    return [
      payment.id,
      payment.studentName,
      payment.studentEmail,
      payment.referenceNumber,
      payment.queueNumber,
      getPaymentModeLabel(payment.paymentMode),
      payment.status,
    ].some((value) => String(value || "").toLowerCase().includes(normalizedSearchQuery));
  });

  if (statusFilter !== "all") {
    filteredPayments = filteredPayments.filter((p) => normalizePaymentStatus(p.status) === statusFilter);
  }

  if (paymentTypeFilter !== "all") {
    filteredPayments = filteredPayments.filter((p) => normalizePaymentMode(p.paymentMode) === paymentTypeFilter);
  }

  if (dateFilter !== "all") {
    const today = new Date();
    filteredPayments = filteredPayments.filter((p) => {
      const paymentDate = new Date(p.submittedDate);
      if (!isValidDate(paymentDate)) return false;

      switch (dateFilter) {
        case "today":
          return paymentDate.toDateString() === today.toDateString();
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return paymentDate >= weekAgo;
        case "month":
          return (
            paymentDate.getMonth() === today.getMonth() &&
            paymentDate.getFullYear() === today.getFullYear()
          );
        default:
          return true;
      }
    });
  }

  // Stats stay global so table filters do not change the summary cards.
  const totalTransactions = payments.length;
  const totalRevenue = payments
    .filter((p) => normalizePaymentStatus(p.status) === "approved")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter((p) => normalizePaymentStatus(p.status) === "pending").length;
  const approvedCount = payments.filter((p) => normalizePaymentStatus(p.status) === "approved").length;
  const rejectedCount = payments.filter((p) => normalizePaymentStatus(p.status) === "rejected").length;

  const handleExportCSV = () => {
    const csvHeaders = ["Transaction ID", "Date", "Student Name", "Email", "Payment Method", "Reference/Queue", "Amount", "Status"];
    const csvRows = filteredPayments.map((p) => [
      p.id,
      new Date(p.submittedDate).toLocaleDateString(),
      p.studentName,
      p.studentEmail,
      getPaymentModeLabel(p.paymentMode),
      p.referenceNumber || p.queueNumber || "N/A",
      `₱${p.amount.toLocaleString()}`,
      p.status.toUpperCase(),
    ]);

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment-history-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <LoadingState
          message="Fetching payment history..."
          subtext="Loading branch transactions, statuses, and revenue totals."
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashboardPageHeader
        badge="Payment Administration"
        title="Payment History"
        subtitle="View all student payment transactions - pending, approved, paid, and rejected"
        icon={Banknote}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{totalTransactions}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-gray-900">{rejectedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
          <div className="relative w-full md:flex-1 md:min-w-[240px]">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Payment Methods</option>
            <option value="bank">Bank Transfer</option>
            <option value="gcash">GCash</option>
            <option value="cash">Cash</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference/Queue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-900 font-medium mb-1">No payments found</p>
                    <p className="text-sm text-gray-500">
                      Payments will appear here as students submit them
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(payment.submittedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">{payment.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.studentName}
                          </div>
                          <div className="text-sm text-gray-500">{payment.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {normalizePaymentMode(payment.paymentMode) === "bank" && (
                          <>
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">Bank Transfer</span>
                          </>
                        )}
                        {normalizePaymentMode(payment.paymentMode) === "gcash" && (
                          <>
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">GCash</span>
                          </>
                        )}
                        {normalizePaymentMode(payment.paymentMode) === "cash" && (
                          <>
                            <Banknote className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-900">Cash</span>
                          </>
                        )}
                        {!["bank", "gcash", "cash"].includes(normalizePaymentMode(payment.paymentMode)) && (
                          <>
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">{getPaymentModeLabel(payment.paymentMode)}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-mono">
                        {payment.referenceNumber || payment.queueNumber || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        ₱{payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {normalizePaymentStatus(payment.status) === "pending" && (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {normalizePaymentStatus(payment.status) === "approved" && (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {String(payment.status).toLowerCase() === "paid" ? "Paid" : "Approved"}
                        </span>
                      )}
                      {normalizePaymentStatus(payment.status) === "rejected" && (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setReceiptZoom(100);
                          setShowDetailsModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredPayments.length}</span> transaction(s)
          </p>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeDetailsModal}>
          <div className="fixed inset-0 bg-gradient-to-br from-slate-950/35 via-blue-950/25 to-slate-900/35 backdrop-blur-md" />
          <div className="relative flex min-h-full items-center justify-center p-4">
            <div
              className="w-full max-w-6xl overflow-hidden rounded-3xl border border-white/60 bg-white/75 shadow-2xl shadow-blue-950/20 ring-1 ring-blue-100/50 backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-white/70 bg-gradient-to-br from-white/95 via-blue-50/80 to-white/70 px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white/80 text-blue-700 shadow-sm">
                      {normalizePaymentMode(selectedPayment.paymentMode) === "cash" ? <Banknote className="h-7 w-7" /> : <CreditCard className="h-7 w-7" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">Transaction Review</p>
                      <h2 className="mt-1 text-2xl font-bold text-slate-950">Payment Transaction Details</h2>
                      <p className="mt-1 text-sm text-slate-600">Review payment record, processing trail, and submitted proof of payment.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Amount Paid</p>
                      <p className="text-xl font-bold text-blue-700">{formatCurrency(selectedPayment.amount)}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-4 py-2 text-sm font-bold ${
                        normalizePaymentStatus(selectedPayment.status) === "pending"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : normalizePaymentStatus(selectedPayment.status) === "approved"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {String(selectedPayment.status || "pending").replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase())}
                    </span>
                    <button
                      onClick={closeDetailsModal}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 transition-all hover:border-slate-300 hover:bg-white"
                      aria-label="Close transaction details"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-2xl border border-white/70 bg-white/70 p-5 shadow-lg shadow-blue-950/5 backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">Transaction Information</h3>
                      <p className="text-sm text-slate-500">Complete registrar and accounting review fields.</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                      {getPaymentModeLabel(selectedPayment.paymentMode)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white/80 px-4">
                    <TransactionDetailRow label="Student Name" value={selectedPayment.studentName} />
                    <TransactionDetailRow label="Student ID" value={selectedPayment.studentId || "Not provided"} mono />
                    <TransactionDetailRow label="Academic Track / Strand" value={selectedPayment.academicTrack || "Not Set"} />
                    <TransactionDetailRow label="Payment Method" value={getPaymentModeLabel(selectedPayment.paymentMode)} />
                    <TransactionDetailRow label="Reference Number" value={selectedPayment.referenceNumber || selectedPayment.queueNumber || "Not provided"} mono />
                    <TransactionDetailRow label="Transaction ID" value={selectedPayment.id} mono />
                    <TransactionDetailRow label="Amount Due" value={formatCurrency(selectedPayment.amount)} />
                    <TransactionDetailRow label="Amount Paid" value={formatCurrency(selectedPayment.amount)} emphasized />
                    <TransactionDetailRow label="Date Processed" value={formatTransactionDate(selectedPayment.processedDate || selectedPayment.submittedDate)} />
                    <TransactionDetailRow label="Processed By" value={selectedPayment.processedBy || "Pending processing"} />
                  </div>

                  {selectedPayment.rejectionComment && (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm text-red-700">
                      <p className="font-bold">Rejection Reason</p>
                      <p className="mt-1 leading-6">{selectedPayment.rejectionComment}</p>
                    </div>
                  )}
                </section>

                <section className="flex min-h-[540px] flex-col rounded-2xl border border-white/70 bg-white/70 shadow-lg shadow-blue-950/5 backdrop-blur-xl">
                  <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">Receipt / Proof of Payment</h3>
                      <p className="text-sm text-slate-500">
                        {normalizePaymentMode(selectedPayment.paymentMode) === "cash"
                          ? "Cash payments use queue confirmation instead of uploaded receipt files."
                          : selectedPayment.receiptUrl
                          ? selectedPayment.receiptFileName || "Uploaded receipt"
                          : "No uploaded receipt was found for this transaction."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReceiptZoom((current) => Math.min(current + 15, 160))}
                        disabled={!selectedPayment.receiptUrl}
                        className="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                        title="Zoom receipt"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => selectedPayment.receiptUrl && window.open(selectedPayment.receiptUrl, "_blank", "noopener,noreferrer")}
                        disabled={!selectedPayment.receiptUrl}
                        className="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                        title="Open full screen"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                      <a
                        href={selectedPayment.receiptUrl || undefined}
                        download={selectedPayment.receiptFileName || "receipt"}
                        className={`rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 transition-all hover:bg-white ${
                          selectedPayment.receiptUrl ? "" : "pointer-events-none opacity-45"
                        }`}
                        title="Download receipt"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-50/70 p-5">
                    {selectedPayment.receiptUrl ? (
                      <div className="flex min-h-full w-full items-start justify-center rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-inner">
                        <img
                          src={selectedPayment.receiptUrl}
                          alt="Uploaded receipt preview"
                          className="max-h-[620px] max-w-full rounded-xl object-contain shadow-sm transition-transform"
                          style={{ transform: `scale(${receiptZoom / 100})`, transformOrigin: "top center" }}
                        />
                      </div>
                    ) : (
                      <div className="max-w-md rounded-2xl border border-dashed border-slate-300 bg-white/75 p-8 text-center">
                        <FileText className="mx-auto h-12 w-12 text-slate-400" />
                        <p className="mt-3 text-sm font-bold text-slate-800">No receipt preview available</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          This record may be a cash queue transaction or the online receipt file was not attached.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/70 bg-white/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                <button
                  onClick={closeDetailsModal}
                  className="rounded-2xl border border-slate-200 bg-white/75 px-5 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-white"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-800"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy details modal retained inactive after redesign */}
      {false && showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-hidden" onClick={() => setShowDetailsModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 bg-blue-600 rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">Transaction Details</h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="text-base font-mono font-medium break-all text-gray-900">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Student Name</p>
                    <p className="text-base font-medium text-gray-900">{selectedPayment.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-base font-medium text-gray-900">{selectedPayment.studentEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedPayment.paymentMode === "bank"
                        ? "Bank Transfer"
                        : selectedPayment.paymentMode === "gcash"
                        ? "GCash"
                        : "Cash"}
                    </p>
                  </div>
                  {selectedPayment.referenceNumber && (
                    <div>
                      <p className="text-sm text-gray-600">Reference Number</p>
                      <p className="text-base font-mono font-medium text-gray-900">
                        {selectedPayment.referenceNumber}
                      </p>
                    </div>
                  )}
                  {selectedPayment.queueNumber && (
                    <div>
                      <p className="text-sm text-gray-600">Queue Number</p>
                      <p className="text-base font-mono font-medium text-gray-900">
                        {selectedPayment.queueNumber}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₱{selectedPayment.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Submitted</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(selectedPayment.submittedDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedPayment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : (selectedPayment.status === "approved" || selectedPayment.status === "paid")
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedPayment.status === "paid"
                        ? "Paid"
                        : selectedPayment.status.charAt(0).toUpperCase() +
                          selectedPayment.status.slice(1)}
                    </span>
                  </div>
                  {selectedPayment.rejectionComment && (
                    <div>
                      <p className="text-sm text-gray-600">Rejection Reason</p>
                      <p className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
                        {selectedPayment.rejectionComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
