import { useState, useEffect } from "react";
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
} from "lucide-react";

interface PaymentRecord {
  id: string;
  studentEmail: string;
  studentName: string;
  paymentMode: "bank" | "gcash" | "cash";
  referenceNumber?: string;
  queueNumber?: string;
  amount: number;
  status: "approved" | "rejected" | "paid";
  processedDate: string;
  processedBy?: string;
  rejectionComment?: string;
}

export function CashierPaymentHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = () => {
    const history: PaymentRecord[] = [];

    // Load online payments (bank/gcash)
    const paymentQueue = JSON.parse(localStorage.getItem("payment_queue") || "[]");
    const completedOnline = paymentQueue
      .filter((p: any) => p.status === "approved" || p.status === "rejected")
      .map((p: any) => ({
        id: p.id,
        studentEmail: p.studentEmail,
        studentName: p.studentName,
        paymentMode: p.paymentMode,
        referenceNumber: p.referenceNumber,
        amount: 15000, // Standard enrollment fee
        status: p.status,
        processedDate: p.approvedDate || p.submittedDate,
        processedBy: "Cashier",
        rejectionComment: p.rejectionComment,
      }));

    // Load cash payments
    const cashQueue = JSON.parse(localStorage.getItem("cash_payment_queue") || "[]");
    const completedCash = cashQueue
      .filter((p: any) => p.status === "paid")
      .map((p: any) => ({
        id: p.id,
        studentEmail: p.studentEmail,
        studentName: p.studentName,
        paymentMode: "cash" as const,
        queueNumber: p.queueNumber,
        amount: 15000,
        status: "paid" as const,
        processedDate: p.paidDate || p.generatedDate,
        processedBy: "Cashier",
      }));

    const allHistory = [...completedOnline, ...completedCash].sort(
      (a, b) => new Date(b.processedDate).getTime() - new Date(a.processedDate).getTime()
    );

    setPaymentHistory(allHistory);
  };

  // Filter logic
  let filteredHistory = paymentHistory.filter(
    (payment) =>
      payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.queueNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (statusFilter !== "all") {
    filteredHistory = filteredHistory.filter((p) => p.status === statusFilter);
  }

  if (paymentTypeFilter !== "all") {
    filteredHistory = filteredHistory.filter((p) => p.paymentMode === paymentTypeFilter);
  }

  if (dateFilter !== "all") {
    const today = new Date();
    filteredHistory = filteredHistory.filter((p) => {
      const paymentDate = new Date(p.processedDate);
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

  // Stats
  const totalTransactions = filteredHistory.length;
  const totalRevenue = filteredHistory
    .filter((p) => p.status === "approved" || p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const approvedCount = filteredHistory.filter((p) => p.status === "approved" || p.status === "paid").length;
  const rejectedCount = filteredHistory.filter((p) => p.status === "rejected").length;

  const handleExportCSV = () => {
    const csvHeaders = ["Date", "Student Name", "Email", "Payment Method", "Reference/Queue", "Amount", "Status"];
    const csvRows = filteredHistory.map((p) => [
      p.processedDate,
      p.studentName,
      p.studentEmail,
      p.paymentMode === "bank" ? "Bank Transfer" : p.paymentMode === "gcash" ? "GCash" : "Cash",
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
        <p className="text-gray-600">View all completed payment transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <p className="text-sm text-gray-600 mb-1">Approved</p>
              <p className="text-3xl font-bold text-gray-900">{approvedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
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
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Payment Methods</option>
            <option value="bank">Bank Transfer</option>
            <option value="gcash">GCash</option>
            <option value="cash">Cash</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-900 font-medium mb-1">No payment history found</p>
                    <p className="text-sm text-gray-500">
                      Completed transactions will appear here
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(payment.processedDate).toLocaleDateString()}
                        </span>
                      </div>
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
                        {payment.paymentMode === "bank" && (
                          <>
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">Bank Transfer</span>
                          </>
                        )}
                        {payment.paymentMode === "gcash" && (
                          <>
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">GCash</span>
                          </>
                        )}
                        {payment.paymentMode === "cash" && (
                          <>
                            <Banknote className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-900">Cash</span>
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
                      {(payment.status === "approved" || payment.status === "paid") && (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {payment.status === "paid" ? "Paid" : "Approved"}
                        </span>
                      )}
                      {payment.status === "rejected" && (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
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
            Showing <span className="font-medium">{filteredHistory.length}</span> transaction(s)
          </p>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
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
                    <p className="text-sm text-gray-600">Date Processed</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(selectedPayment.processedDate).toLocaleDateString("en-US", {
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
                        selectedPayment.status === "approved" || selectedPayment.status === "paid"
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
