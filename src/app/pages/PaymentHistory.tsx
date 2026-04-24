import { Link } from "react-router";
import { ArrowLeft, CreditCard, Calendar, CheckCircle, Clock, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../supabase";
import { exportToCSV, formatDateForCSV } from "../../utils/csvExport";

interface PaymentRecord {
  id: string;
  description: string;
  amount: string;
  rawAmount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  paymentMethod: string;
  referenceNo: string;
}

export function PaymentHistory() {
  const { userData } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState({
    totalPaid: "₱0.00",
    totalPending: "₱0.00",
    totalBalance: "₱0.00",
  });
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  useEffect(() => {
    if (userData?.id) {
      loadPaymentHistory();
    }
  }, [userData]);

  const loadPaymentHistory = async () => {
    if (!userData?.id) return;

    try {
      const { data: paymentRecords, error } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", userData.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading payment history:", error);
        return;
      }

      const allPayments: PaymentRecord[] = (paymentRecords || []).map((p: any) => {
        let status = "pending";
        if (p.status === "verified" || p.status === "approved" || p.status === "completed" || p.status === "paid") {
          status = "completed";
        } else if (p.status === "rejected") {
          status = "failed";
        }

        const methodLabel =
          p.payment_method === "bank" ? "Bank Transfer" :
          p.payment_method === "gcash" ? "GCash" : "Cash";

        return {
          id: p.id,
          description: "Enrollment Fee",
          amount: `₱${Number(p.amount).toLocaleString()}`,
          rawAmount: Number(p.amount),
          date: p.submitted_at
            ? new Date(p.submitted_at).toLocaleDateString()
            : new Date(p.created_at).toLocaleDateString(),
          status,
          paymentMethod: methodLabel,
          referenceNo: p.reference_number || p.queue_number || "",
        };
      });

      setPayments(allPayments);

      // Calculate summary
      const totalPaid = allPayments
        .filter((p: any) => p.status === "completed")
        .reduce((sum: number, p: any) => sum + (p.rawAmount || 15000), 0);

      const totalPending = allPayments
        .filter((p: any) => p.status === "pending")
        .reduce((sum: number, p: any) => sum + (p.rawAmount || 15000), 0);

      const balanceDue = allPayments.length === 0 ? 15000 :
                         totalPaid >= 15000 ? 0 :
                         15000 - totalPaid;

      setSummary({
        totalPaid: `₱${totalPaid.toLocaleString()}`,
        totalPending: `₱${totalPending.toLocaleString()}`,
        totalBalance: `₱${balanceDue.toLocaleString()}`,
      });
    } catch (err) {
      console.error("Error loading payment history:", err);
    }
  };

  const handleDownloadReceipt = (payment: any) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
  };

  const handleGenerateReceiptPdf = async () => {
    if (!selectedPayment) {
      return;
    }

    setIsDownloadingReceipt(true);

    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      const topMargin = 96;
      const bottomMargin = 52;
      const generatedDateLabel = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const paymentStatusLabel =
        selectedPayment.status === "completed"
          ? "Payment Verified"
          : selectedPayment.status === "failed"
          ? "Payment Rejected"
          : "Payment Pending";
      const paymentStatusAccent: [number, number, number] =
        selectedPayment.status === "completed"
          ? [16, 185, 129]
          : selectedPayment.status === "failed"
          ? [185, 28, 28]
          : [245, 158, 11];
      let cursorY = topMargin;

      const getLastAutoTableFinalY = () => {
        const lastAutoTable = (doc as any).lastAutoTable as { finalY?: number } | undefined;
        return lastAutoTable?.finalY ?? cursorY;
      };

      const ensureSpace = (height: number) => {
        if (cursorY + height > pageHeight - bottomMargin) {
          doc.addPage();
          cursorY = topMargin;
        }
      };

      const addSectionTitle = (title: string) => {
        ensureSpace(28);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(30, 58, 138);
        doc.text(title, margin, cursorY);
        cursorY += 10;
        doc.setDrawColor(219, 234, 254);
        doc.setLineWidth(1);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 18;
      };

      const addParagraph = (
        text: string,
        options?: {
          x?: number;
          width?: number;
          fontSize?: number;
          lineHeight?: number;
          gapAfter?: number;
          color?: [number, number, number];
        }
      ) => {
        const x = options?.x ?? margin;
        const width = options?.width ?? contentWidth;
        const fontSize = options?.fontSize ?? 10.8;
        const lineHeight = options?.lineHeight ?? 14;
        const gapAfter = options?.gapAfter ?? 10;
        const color = options?.color ?? [51, 65, 85];
        const lines = doc.splitTextToSize(text, width);

        ensureSpace(lines.length * lineHeight + gapAfter + 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(lines, x, cursorY);
        cursorY += lines.length * lineHeight + gapAfter;
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(31, 41, 55);
      doc.text("Official Payment Receipt", pageWidth / 2, cursorY, { align: "center" });
      cursorY += 24;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Electron Hub payment confirmation for student records and verification.",
        pageWidth / 2,
        cursorY,
        { align: "center" }
      );
      cursorY += 24;

      ensureSpace(82);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, cursorY, contentWidth, 78, 12, 12, "FD");
      doc.setFillColor(paymentStatusAccent[0], paymentStatusAccent[1], paymentStatusAccent[2]);
      doc.roundedRect(margin + 16, cursorY + 16, 6, 46, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("RECEIPT STATUS", margin + 34, cursorY + 28);
      doc.setFontSize(18);
      doc.setTextColor(31, 41, 55);
      doc.text(paymentStatusLabel, margin + 34, cursorY + 52);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Reference No.: ${selectedPayment.referenceNo || "N/A"}`, margin + 34, cursorY + 68);
      cursorY += 98;

      addSectionTitle("Student Information");
      autoTable(doc, {
        startY: cursorY,
        margin: { top: topMargin, right: margin, bottom: bottomMargin, left: margin },
        body: [
          ["Student Name", userData?.name || "N/A", "Email", userData?.email || "N/A"],
          ["Transaction ID", selectedPayment.id, "Transaction Date", selectedPayment.date],
        ],
        theme: "grid",
        styles: {
          fontSize: 10.5,
          cellPadding: 8,
          textColor: [31, 41, 55],
          lineColor: [226, 232, 240],
          lineWidth: 1,
        },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: [248, 250, 252] },
          2: { fontStyle: "bold", fillColor: [248, 250, 252] },
        },
      });
      cursorY = getLastAutoTableFinalY() + 22;

      addSectionTitle("Payment Details");
      autoTable(doc, {
        startY: cursorY,
        margin: { top: topMargin, right: margin, bottom: bottomMargin, left: margin },
        body: [
          ["Description", selectedPayment.description],
          ["Payment Method", selectedPayment.paymentMethod],
          ["Reference Number", selectedPayment.referenceNo || "N/A"],
          ["Amount", selectedPayment.amount],
          ["Status", paymentStatusLabel],
        ],
        theme: "grid",
        styles: {
          fontSize: 10.8,
          cellPadding: 9,
          textColor: [31, 41, 55],
          lineColor: [226, 232, 240],
          lineWidth: 1,
        },
        columnStyles: {
          0: { cellWidth: 150, fontStyle: "bold", fillColor: [248, 250, 252] },
        },
      });
      cursorY = getLastAutoTableFinalY() + 22;

      addSectionTitle("Receipt Note");
      addParagraph(
        "This receipt confirms that Electron College of Technical Education has recorded the payment transaction listed above. Please keep a copy for your records and present it when requested by the Cashier or Registrar.",
        { gapAfter: 12 }
      );

      ensureSpace(86);
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(margin, cursorY, contentWidth, 72, 12, 12, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text("Important", margin + 16, cursorY + 24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const noteLines = doc.splitTextToSize(
        "If you need assistance regarding this payment, contact the Cashier's Office or Electron Hub support and provide your transaction ID and reference number.",
        contentWidth - 32
      );
      doc.text(noteLines, margin + 16, cursorY + 42);

      const totalPages = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber);

        doc.setFillColor(30, 58, 138);
        doc.circle(margin + 16, 40, 16, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text("EC", margin + 16, 44, { align: "center" });

        doc.setTextColor(31, 41, 55);
        doc.setFontSize(16);
        doc.text("Electron College of Technical Education", margin + 42, 36);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text("Valenzuela City, Metro Manila", margin + 42, 51);

        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);
        doc.text(`Generated: ${generatedDateLabel}`, pageWidth - margin, 36, { align: "right" });
        doc.text(`Receipt Type: Payment`, pageWidth - margin, 50, { align: "right" });

        doc.setDrawColor(30, 58, 138);
        doc.setLineWidth(1.2);
        doc.line(margin, 68, pageWidth - margin, 68);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.8);
        doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Electron Hub Payment Receipt", margin, pageHeight - 20);
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 20, {
          align: "right",
        });
      }

      const receiptFileName = `payment-receipt-${selectedPayment.referenceNo || selectedPayment.id}`
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

      doc.save(`${receiptFileName || "payment-receipt"}.pdf`);
    } catch (error) {
      console.error("Error generating payment receipt PDF:", error);
      window.alert("Unable to generate the payment receipt PDF right now. Please try again.");
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  const handleExportPaymentHistoryCSV = () => {
    if (payments.length === 0) {
      alert("No payment history to export.");
      return;
    }

    const headers = ["Date", "Description", "Amount", "Payment Method", "Reference Number", "Status"];
    const rows = payments.map((payment) => [
      payment.date,
      payment.description,
      payment.amount,
      payment.paymentMethod,
      payment.referenceNo || "N/A",
      payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
    ]);

    exportToCSV({
      filename: `payment-history-${new Date().toISOString().split("T")[0]}`,
      title: "Payment History Report",
      subtitle: `${userData?.name || "Student"} - Electron Hub`,
      headers,
      rows,
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <button
              onClick={handleExportPaymentHistoryCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: "#1E3A8A" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1B357D")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1E3A8A")}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
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
                        title="View Receipt"
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
                    title="View Receipt"
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
                  onClick={handleGenerateReceiptPdf}
                  disabled={isDownloadingReceipt}
                  className="flex-1 px-6 py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: "var(--electron-blue)" }}
                >
                  <Download className="w-5 h-5" />
                  {isDownloadingReceipt ? "Preparing PDF..." : "Download Receipt PDF"}
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