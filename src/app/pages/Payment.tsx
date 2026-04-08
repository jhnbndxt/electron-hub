import { useState, useEffect } from "react";
import { Building2, Wallet, Banknote, Upload, CheckCircle2, X, Copy, Check, Calendar, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

type PaymentMode = "bank" | "gcash" | "cash" | null;

export function Payment() {
  const { updateEnrollmentProgress, isDocumentsVerified, markPaymentVisited, userData } = useAuth();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<PaymentMode>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showQueueTicket, setShowQueueTicket] = useState(false);
  const [queueNumber, setQueueNumber] = useState<string | null>(null);
  const [queueSchedule, setQueueSchedule] = useState<{ date: string; time: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [approvedPaymentData, setApprovedPaymentData] = useState<any>(null);

  // Check if payment already submitted or approved
  useEffect(() => {
    if (userData?.email) {
      // Check for online payment submissions (bank/gcash)
      const paymentQueue = JSON.parse(localStorage.getItem("payment_queue") || "[]");
      const existingOnlinePayment = paymentQueue.find((p: any) => p.studentEmail === userData.email);
      
      if (existingOnlinePayment && (existingOnlinePayment.paymentMode === "bank" || existingOnlinePayment.paymentMode === "gcash")) {
        if (existingOnlinePayment.status === "approved") {
          setPaymentApproved(true);
          setApprovedPaymentData(existingOnlinePayment);
        } else {
          setIsSubmitted(true);
        }
        setSelectedMode(existingOnlinePayment.paymentMode);
        return;
      }

      // Check for cash payment queue
      const cashQueue = JSON.parse(localStorage.getItem("cash_payment_queue") || "[]");
      const existingCashPayment = cashQueue.find((q: any) => q.studentEmail === userData.email);
      
      if (existingCashPayment) {
        if (existingCashPayment.status === "paid") {
          setPaymentApproved(true);
          setApprovedPaymentData(existingCashPayment);
        } else {
          setQueueNumber(existingCashPayment.queueNumber);
          setQueueSchedule(existingCashPayment.schedule);
          setShowQueueTicket(true);
        }
      }
    }
  }, [userData]);

  // Redirect if documents aren't verified
  useEffect(() => {
    if (!isDocumentsVerified) {
      navigate("/dashboard", { replace: true });
    }
  }, [isDocumentsVerified, navigate]);

  // Mark payment as visited when component mounts
  useEffect(() => {
    if (isDocumentsVerified) {
      markPaymentVisited();
    }
  }, [isDocumentsVerified, markPaymentVisited]);

  // If payment is already approved, show success message immediately
  if (paymentApproved && approvedPaymentData) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-12 text-center border-2 border-green-500">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "#10B981" }}
          >
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#10B981" }}>
            Payment Successfully Verified!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Congratulations! Your payment has been approved and processed.
          </p>

          {/* Payment Details */}
          <div className="bg-green-50 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: "var(--electron-dark-gray)" }}>
              Payment Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold text-gray-900">
                  {approvedPaymentData.paymentMode === "bank" ? "Bank Transfer" : 
                   approvedPaymentData.paymentMode === "gcash" ? "GCash" : "Cash"}
                </span>
              </div>
              {approvedPaymentData.referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference Number:</span>
                  <span className="font-mono font-semibold text-gray-900">{approvedPaymentData.referenceNumber}</span>
                </div>
              )}
              {approvedPaymentData.queueNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Queue Number:</span>
                  <span className="font-mono font-semibold text-gray-900">{approvedPaymentData.queueNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-bold text-lg text-green-600">₱15,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date Verified:</span>
                <span className="font-medium text-gray-900">
                  {approvedPaymentData.paidDate || new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--electron-dark-gray)" }}>
              Enrollment Status
            </h3>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">You are now officially enrolled!</p>
                <p>Your enrollment process is complete. You can now access all student resources and prepare for the upcoming semester.</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate("/dashboard")}
            className="px-12 py-4 rounded-lg text-white text-lg font-semibold transition-all hover:opacity-90 shadow-lg"
            style={{ backgroundColor: "var(--electron-blue)" }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const paymentModes = [
    {
      id: "bank" as PaymentMode,
      title: "Bank Transfer",
      description: "Transfer via online banking",
      icon: Building2,
      color: "#1E3A8A",
    },
    {
      id: "gcash" as PaymentMode,
      title: "GCash",
      description: "Pay using GCash e-wallet",
      icon: Wallet,
      color: "#0066FF",
    },
    {
      id: "cash" as PaymentMode,
      title: "Over-the-Counter",
      description: "Pay in cash at campus",
      icon: Banknote,
      color: "#10B981",
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmitPayment = async () => {
    if (!userData?.email || !uploadedFile || !referenceNumber) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;

      // Get enrollment data
      const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
      const studentApp = applications.find((app: any) => app.email === userData.email);

      // Save payment to queue
      const paymentQueue = JSON.parse(localStorage.getItem("payment_queue") || "[]");
      
      paymentQueue.push({
        id: Date.now().toString(),
        studentEmail: userData.email,
        studentName: studentApp?.studentName || userData.name,
        paymentMode: selectedMode,
        referenceNumber: referenceNumber,
        receiptData: base64Data,
        receiptFileName: uploadedFile.name,
        status: "pending",
        submittedDate: new Date().toLocaleDateString(),
        enrollmentData: studentApp,
      });

      localStorage.setItem("payment_queue", JSON.stringify(paymentQueue));

      // Update enrollment progress - Mark Payment Submitted as completed for online payments
      updateEnrollmentProgress("Payment Submitted", "completed");
      updateEnrollmentProgress("Payment Verified", "current");
      setIsSubmitted(true);
    };

    reader.readAsDataURL(uploadedFile);
  };

  const handleGenerateQueue = () => {
    if (!userData?.email) return;

    // Check if queue already exists for this user
    const cashQueue = JSON.parse(localStorage.getItem("cash_payment_queue") || "[]");
    const existingQueue = cashQueue.find((q: any) => q.studentEmail === userData.email);
    
    if (existingQueue) {
      // Use existing queue instead of generating a new one
      setQueueNumber(existingQueue.queueNumber);
      setQueueSchedule(existingQueue.schedule);
      setShowQueueTicket(true);
      return;
    }

    // Generate queue number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const qNum = `ECH-${randomNum}`;
    
    // Generate scheduled date (next 3-7 business days)
    const today = new Date();
    const daysToAdd = Math.floor(Math.random() * 5) + 3;
    const scheduleDate = new Date(today);
    scheduleDate.setDate(scheduleDate.getDate() + daysToAdd);
    
    const formattedDate = scheduleDate.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
    const formattedTime = "9:00 AM - 4:00 PM";
    
    setQueueNumber(qNum);
    setQueueSchedule({ date: formattedDate, time: formattedTime });
    setShowQueueTicket(true);

    // Get enrollment data
    const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
    const studentApp = applications.find((app: any) => app.email === userData.email);

    // Save to cash payment queue (only if doesn't exist)
    cashQueue.push({
      id: Date.now().toString(),
      queueNumber: qNum,
      studentEmail: userData.email,
      studentName: studentApp?.studentName || userData.name,
      schedule: { date: formattedDate, time: formattedTime },
      status: "pending",
      generatedDate: new Date().toLocaleDateString(),
      enrollmentData: studentApp,
    });
    localStorage.setItem("cash_payment_queue", JSON.stringify(cashQueue));

    // Update enrollment progress
    updateEnrollmentProgress("Payment Submitted", "current");
  };

  const handleCancelCashPayment = () => {
    if (!userData?.email) return;
    
    // Remove from cash payment queue
    const cashQueue = JSON.parse(localStorage.getItem("cash_payment_queue") || "[]");
    const updatedQueue = cashQueue.filter((q: any) => q.studentEmail !== userData.email);
    localStorage.setItem("cash_payment_queue", JSON.stringify(updatedQueue));
    
    // Reset state
    setShowQueueTicket(false);
    setSelectedMode(null);
    setQueueNumber(null);
    setQueueSchedule(null);
  };

  const handleCopyQueueNumber = () => {
    if (queueNumber) {
      navigator.clipboard.writeText(queueNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBackToPayment = () => {
    setShowQueueTicket(false);
    setSelectedMode(null);
  };

  // Queue Ticket View
  if (showQueueTicket && queueNumber && queueSchedule && !paymentApproved) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        {/* Print-only Header */}
        <div className="print-only print-header" style={{ display: 'none' }}>
          <div className="print-logo">
            <div className="print-logo-circle">EC</div>
            <div className="print-logo-text">
              <h1>Electron College of Technical Education</h1>
              <p>Malanday Campus, Valenzuela City</p>
            </div>
          </div>
          <div className="print-meta">
            <div><strong>Document Type:</strong> Payment Queue Ticket</div>
            <div><strong>Generated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        {/* Print-only Title */}
        <div className="print-only print-title" style={{ display: 'none' }}>
          Cashier Payment Queue Ticket
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2" style={{ borderColor: "var(--electron-blue)" }}>
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#10B981" }}
            >
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--electron-blue)" }}>
            Queue Number Generated
          </h1>
          <p className="text-gray-600 mb-8">
            Your queue number has been successfully generated
          </p>

          {/* Queue Number Display */}
          <div
            className="rounded-xl p-8 mb-6 border-4"
            style={{ backgroundColor: "#EFF6FF", borderColor: "var(--electron-blue)" }}
          >
            <p className="text-sm font-semibold text-gray-600 mb-2">YOUR QUEUE NUMBER</p>
            <div className="flex items-center justify-center gap-4">
              <h2 className="text-6xl font-bold tracking-wider" style={{ color: "var(--electron-blue)" }}>
                {queueNumber}
              </h2>
              <button
                onClick={handleCopyQueueNumber}
                className="p-3 rounded-lg hover:bg-white transition-colors"
                title="Copy queue number"
              >
                {copied ? (
                  <Check className="w-6 h-6" style={{ color: "#10B981" }} />
                ) : (
                  <Copy className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
                )}
              </button>
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              Scheduled Payment Date
            </h3>
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-700 font-medium">{queueSchedule.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-700 font-medium">{queueSchedule.time}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Please visit <strong>Electron Malanday Campus</strong> on the scheduled date to complete your payment.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-lg font-bold mb-3" style={{ color: "var(--electron-dark-gray)" }}>
              Instructions:
            </h3>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Present this Queue Number to the Cashier at <strong>Electron Malanday Campus</strong> on your scheduled date.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Bring the exact amount: <strong>₱15,000.00</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Take a screenshot or write down your queue number for reference</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>You will receive confirmation after payment is processed</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.print()}
              className="px-8 py-4 rounded-lg text-white font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--electron-blue)" }}
            >
              Print Queue Ticket
            </button>
            <button
              onClick={handleCancelCashPayment}
              className="px-8 py-4 rounded-lg text-white font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--electron-red)" }}
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ color: "var(--electron-blue)" }}>
          Payment
        </h1>
        <p className="text-gray-600">
          Complete your enrollment by submitting your payment
        </p>
      </div>

      {/* Payment Mode Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--electron-dark-gray)" }}>
          Select Mode of Payment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paymentModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id);
                  setIsSubmitted(false);
                  setUploadedFile(null);
                  setReferenceNumber("");
                }}
                disabled={isSubmitted}
                className={`bg-white rounded-xl p-8 border-2 transition-all hover:shadow-lg text-left ${
                  isSelected ? "ring-4" : ""
                } ${isSubmitted ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{
                  borderColor: isSelected ? mode.color : "#E5E7EB",
                  "--tw-ring-color": mode.color,
                } as any}
              >
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${mode.color}15` }}
                >
                  <Icon className="w-8 h-8" style={{ color: mode.color }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--electron-dark-gray)" }}>
                  {mode.title}
                </h3>
                <p className="text-sm text-gray-600">{mode.description}</p>
                {isSelected && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold" style={{ color: mode.color }}>
                    <CheckCircle2 className="w-5 h-5" />
                    Selected
                  </div>
                )}
              </button>
            );
          })}</div>
      </div>

      {/* Bank Transfer Details */}
      {selectedMode === "bank" && !isSubmitted && (
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
            Bank Transfer Details
          </h2>

          {/* Account Information */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--electron-dark-gray)" }}>
              School Bank Account Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bank Name:</span>
                <span className="font-semibold">BDO Unibank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Name:</span>
                <span className="font-semibold">Electron College of Technological Education</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-semibold">007-123-456789</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Due:</span>
                <span className="font-bold text-lg" style={{ color: "var(--electron-blue)" }}>₱15,000.00</span>
              </div>
            </div>
          </div>

          {/* Reference Number */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-semibold" style={{ color: "var(--electron-dark-gray)" }}>
              Reference Number *
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter your transaction reference number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-semibold" style={{ color: "var(--electron-dark-gray)" }}>
              Upload Proof of Payment *
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Please upload a screenshot or photo of your bank transfer receipt
            </p>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              style={{ borderColor: uploadedFile ? "var(--electron-blue)" : "#D1D5DB" }}
            >
              <input
                type="file"
                id="payment-proof"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="payment-proof" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                {uploadedFile ? (
                  <div>
                    <p className="font-semibold" style={{ color: "var(--electron-blue)" }}>
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-gray-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, or PDF (max. 5MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitPayment}
            disabled={!uploadedFile || !referenceNumber.trim()}
            className={`w-full py-4 rounded-lg text-white font-semibold transition-all ${
              uploadedFile && referenceNumber.trim() ? "hover:opacity-90" : "opacity-50 cursor-not-allowed"
            }`}
            style={{ backgroundColor: "var(--electron-blue)" }}
          >
            Submit for Validation
          </button>
        </div>
      )}

      {/* GCash Details */}
      {selectedMode === "gcash" && !isSubmitted && (
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
            GCash Payment Details
          </h2>

          {/* Account Information */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--electron-dark-gray)" }}>
              School GCash Account Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Account Name:</span>
                <span className="font-semibold">Electron College</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GCash Number:</span>
                <span className="font-semibold">0917-123-4567</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Due:</span>
                <span className="font-bold text-lg" style={{ color: "var(--electron-blue)" }}>₱15,000.00</span>
              </div>
            </div>
          </div>

          {/* Reference Number */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-semibold" style={{ color: "var(--electron-dark-gray)" }}>
              Reference Number *
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter your GCash reference number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-semibold" style={{ color: "var(--electron-dark-gray)" }}>
              Upload Proof of Payment *
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Please upload a screenshot of your GCash receipt
            </p>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              style={{ borderColor: uploadedFile ? "var(--electron-blue)" : "#D1D5DB" }}
            >
              <input
                type="file"
                id="payment-proof-gcash"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="payment-proof-gcash" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                {uploadedFile ? (
                  <div>
                    <p className="font-semibold" style={{ color: "var(--electron-blue)" }}>
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-gray-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, or PDF (max. 5MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitPayment}
            disabled={!uploadedFile || !referenceNumber.trim()}
            className={`w-full py-4 rounded-lg text-white font-semibold transition-all ${
              uploadedFile && referenceNumber.trim() ? "hover:opacity-90" : "opacity-50 cursor-not-allowed"
            }`}
            style={{ backgroundColor: "var(--electron-blue)" }}
          >
            Submit for Validation
          </button>
        </div>
      )}

      {/* Cash Payment */}
      {selectedMode === "cash" && (
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "#10B98115" }}
          >
            <Banknote className="w-10 h-10" style={{ color: "#10B981" }} />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--electron-blue)" }}>
            Over-the-Counter Payment
          </h2>
          <p className="text-gray-600 mb-2">
            Amount Due: <span className="font-bold text-xl" style={{ color: "var(--electron-blue)" }}>₱15,000.00</span>
          </p>
          <p className="text-gray-600 mb-8">
            Generate a queue number and schedule your payment at the Cashier's office
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleGenerateQueue}
              className="px-12 py-4 rounded-lg text-white text-lg font-semibold transition-all hover:opacity-90 shadow-lg"
              style={{ backgroundColor: "#10B981" }}
            >
              Generate Queue Number
            </button>
            <button
              onClick={() => setSelectedMode(null)}
              className="px-8 py-4 rounded-lg border-2 border-gray-300 text-gray-700 text-lg font-semibold transition-all hover:bg-gray-50"
            >
              Change Payment Method
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-6">
            Office Location: Electron Malanday Campus, Valenzuela City
          </p>
        </div>
      )}

      {/* Success Message for Digital Payments */}
      {(selectedMode === "bank" || selectedMode === "gcash") && isSubmitted && !paymentApproved && (
        <div className="bg-white rounded-xl shadow-md p-8 border-2 border-green-500 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "#10B981" }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#10B981" }}>
            Payment Submission Under Review
          </h2>
          <p className="text-gray-600 mb-6">
            Your payment receipt has been submitted successfully. The Cashier will review your submission and verify the payment details.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
            <p className="mb-1">
              <strong>What's Next?</strong>
            </p>
            <p>
              Our finance team will review your payment proof within 24-48 hours. You will be notified via your dashboard once your payment has been verified. Please check back regularly for updates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}