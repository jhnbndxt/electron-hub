import { Link } from "react-router";
import { ArrowLeft, CreditCard, Calendar, CheckCircle, Clock, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export function PaymentHistory() {
  const { userData } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalPaid: "₱0.00",
    totalPending: "₱0.00",
    totalBalance: "₱0.00",
  });
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  useEffect(() => {
    if (userData?.email) {
      loadPaymentHistory();
    }
  }, [userData]);

  const loadPaymentHistory = () => {
    if (!userData?.email) return;

    const allPayments: any[] = [];

    // Get online payment queue data (bank/gcash)
    const paymentQueue = JSON.parse(localStorage.getItem("payment_queue") || "[]");
    const onlinePayments = paymentQueue.filter((p: any) => p.studentEmail === userData.email);

    // Get cash payment queue data
    const cashQueue = JSON.parse(localStorage.getItem("cash_payment_queue") || "[]");
    const cashPayments = cashQueue.filter((p: any) => p.studentEmail === userData.email);

    // Transform online payments
    onlinePayments.forEach((payment: any) => {
      allPayments.push({
        id: payment.id,
        description: "Enrollment Fee",
        amount: "₱15,000.00",
        date: payment.submittedDate,
        status: payment.status === "approved" ? "completed" : payment.status === "rejected" ? "failed" : "pending",
        paymentMethod: payment.paymentMode === "bank" ? "Bank Transfer" : "GCash",
        referenceNo: payment.referenceNumber,
      });
    });

    // Transform cash payments
    cashPayments.forEach((payment: any) => {
      allPayments.push({
        id: payment.id,
        description: "Enrollment Fee",
        amount: "₱15,000.00",
        date: payment.generatedDate,
        status: payment.status === "paid" ? "completed" : "pending",
        paymentMethod: "Cash",
        referenceNo: payment.queueNumber,
      });
    });

    setPayments(allPayments);

    // Calculate summary
    const totalPaid = allPayments
      .filter((p: any) => p.status === "completed")
      .reduce((sum: number) => sum + 15000, 0);
    
    const totalPending = allPayments
      .filter((p: any) => p.status === "pending")
      .reduce((sum: number) => sum + 15000, 0);

    // Balance due (if enrollment fee is 15000 and nothing paid, balance is 15000)
    const balanceDue = allPayments.length === 0 ? 15000 : 
                       totalPaid >= 15000 ? 0 : 
                       15000 - totalPaid;

    setSummary({
      totalPaid: `₱${totalPaid.toLocaleString()}`,
      totalPending: `₱${totalPending.toLocaleString()}`,
      totalBalance: `₱${balanceDue.toLocaleString()}`,
    });
  };

  const handleDownloadReceipt = (payment: any) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-1">View your payment transactions and balance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Paid</p>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold" style={{ color: "#10B981" }}>
              {summary.totalPaid}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Pending</p>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold" style={{ color: "#F59E0B" }}>
              {summary.totalPending}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Balance Due</p>
              <CreditCard className="w-5 h-5" style={{ color: "#1E3A8A" }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: "#1E3A8A" }}>
              {summary.totalBalance}
            </p>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference No.
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
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {payment.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {payment.referenceNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Download Receipt"
                        onClick={() => handleDownloadReceipt(payment)}
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {payments.map((payment) => (
              <div key={payment.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {payment.description}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {payment.date}
                    </p>
                  </div>
                  {payment.status === "completed" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-sm text-gray-600">
                    Method: <span className="font-medium">{payment.paymentMethod}</span>
                  </p>
                  <p className="text-sm text-gray-600 font-mono">
                    Ref: {payment.referenceNo}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">{payment.amount}</p>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Download Receipt"
                    onClick={() => handleDownloadReceipt(payment)}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt Modal */}
        {showReceipt && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:block print:static">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
              {/* Print Header */}
              <div className="print-only print-header" style={{ display: 'none' }}>
                <div className="print-logo">
                  <div className="print-logo-circle">EC</div>
                  <div className="print-logo-text">
                    <h1>Electron College of Technical Education</h1>
                    <p>Valenzuela City, Metro Manila</p>
                  </div>
                </div>
                <div className="print-meta">
                  <div><strong>Document Type:</strong> Payment Receipt</div>
                  <div><strong>Generated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>

              {/* Print Title */}
              <div className="print-only print-title" style={{ display: 'none' }}>
                Official Payment Receipt
              </div>

              {/* Modal Header (Screen Only) */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
                <h2 className="text-2xl font-bold text-gray-900">Payment Receipt</h2>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                  onClick={() => setShowReceipt(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Receipt Content */}
              <div className="p-8">
                {/* Student Info Section */}
                <div className="print-info-section mb-6">
                  <div className="print-info-item">
                    <div className="print-info-label">Student Name</div>
                    <div className="print-info-value">{userData?.name || 'N/A'}</div>
                  </div>
                  <div className="print-info-item">
                    <div className="print-info-label">Email</div>
                    <div className="print-info-value">{userData?.email || 'N/A'}</div>
                  </div>
                  <div className="print-info-item">
                    <div className="print-info-label">Transaction ID</div>
                    <div className="print-info-value font-mono">{selectedPayment.id}</div>
                  </div>
                  <div className="print-info-item">
                    <div className="print-info-label">Transaction Date</div>
                    <div className="print-info-value">{selectedPayment.date}</div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-gray-200 print:border-1">
                  <h3 className="text-lg font-bold mb-4" style={{ color: "var(--electron-dark-gray)" }}>
                    Payment Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Description</span>
                      <span className="font-semibold text-gray-900">{selectedPayment.description}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Payment Method</span>
                      <span className="font-semibold text-gray-900">{selectedPayment.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Reference Number</span>
                      <span className="font-mono font-semibold text-gray-900">{selectedPayment.referenceNo}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-semibold text-gray-700">Total Amount</span>
                      <span className="text-2xl font-bold" style={{ color: "var(--electron-blue)" }}>
                        {selectedPayment.amount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-center mb-6">
                  {selectedPayment.status === "completed" ? (
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-100 border-2 border-green-500">
                      <CheckCircle className="w-6 h-6 text-green-700" />
                      <span className="text-lg font-bold text-green-700">Payment Verified</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-100 border-2 border-yellow-500">
                      <Clock className="w-6 h-6 text-yellow-700" />
                      <span className="text-lg font-bold text-yellow-700">Payment Pending</span>
                    </div>
                  )}
                </div>

                {/* Note Section */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                  <p className="text-sm text-gray-700 text-center">
                    <strong>Note:</strong> This is an official receipt from Electron College of Technical Education. 
                    Please keep this receipt for your records. For questions or concerns, contact the Cashier's Office.
                  </p>
                </div>

                {/* Signature Section (Print Only) */}
                <div className="print-only print-signature-section" style={{ display: 'none' }}>
                  <div className="print-signature-box">
                    <div className="print-signature-line"></div>
                    <div className="print-signature-label">Student Signature</div>
                  </div>
                  <div className="print-signature-box">
                    <div className="print-signature-line"></div>
                    <div className="print-signature-label">Cashier</div>
                    <div className="print-signature-role">Finance Office</div>
                  </div>
                  <div className="print-signature-box">
                    <div className="print-signature-line"></div>
                    <div className="print-signature-label">Branch Coordinator</div>
                    <div className="print-signature-role">Approving Authority</div>
                  </div>
                </div>
              </div>

              {/* Modal Actions (Screen Only) */}
              <div className="flex gap-3 p-6 border-t border-gray-200 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-6 py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90 inline-flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--electron-blue)" }}
                >
                  <Download className="w-5 h-5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold transition-all hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}