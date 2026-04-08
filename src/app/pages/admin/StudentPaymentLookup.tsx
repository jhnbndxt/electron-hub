import { useState, useEffect } from "react";
import {
  Search,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Banknote,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";

interface StudentPaymentStatus {
  email: string;
  name: string;
  hasApplied: boolean;
  applicationStatus?: string;
  documentsApproved: boolean;
  paymentStatus: "not_submitted" | "pending" | "approved" | "rejected" | "paid";
  paymentMode?: "bank" | "gcash" | "cash";
  referenceNumber?: string;
  queueNumber?: string;
  submittedDate?: string;
  approvedDate?: string;
  rejectionComment?: string;
  enrollmentStatus: "not_enrolled" | "enrolled";
  track?: string;
}

export function StudentPaymentLookup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<StudentPaymentStatus | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert("Please enter a student email or name");
      return;
    }

    // Search in registered users
    const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
    const student = registeredUsers.find(
      (u: any) =>
        u.role === "student" &&
        (u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!student) {
      setNotFound(true);
      setShowResult(false);
      setSearchResult(null);
      return;
    }

    // Check application status
    const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
    const application = applications.find((app: any) => app.email === student.email);

    // Check document verification
    const docVerification = JSON.parse(localStorage.getItem("document_verification") || "{}");
    const studentDocs = docVerification[student.email] || {};
    const docsApproved =
      Object.keys(studentDocs).length > 0 &&
      Object.values(studentDocs).every((doc: any) => doc.status === "approved");

    // Check payment status
    const paymentQueue = JSON.parse(localStorage.getItem("payment_queue") || "[]");
    const onlinePayment = paymentQueue.find((p: any) => p.studentEmail === student.email);

    const cashQueue = JSON.parse(localStorage.getItem("cash_payment_queue") || "[]");
    const cashPayment = cashQueue.find((p: any) => p.studentEmail === student.email);

    // Check enrollment status
    const enrolledStudents = JSON.parse(localStorage.getItem("enrolled_students") || "[]");
    const isEnrolled = enrolledStudents.some((e: any) => e.email === student.email);

    let paymentStatus: StudentPaymentStatus["paymentStatus"] = "not_submitted";
    let paymentMode: "bank" | "gcash" | "cash" | undefined;
    let referenceNumber: string | undefined;
    let queueNumber: string | undefined;
    let submittedDate: string | undefined;
    let approvedDate: string | undefined;
    let rejectionComment: string | undefined;

    if (onlinePayment) {
      paymentStatus = onlinePayment.status;
      paymentMode = onlinePayment.paymentMode;
      referenceNumber = onlinePayment.referenceNumber;
      submittedDate = onlinePayment.submittedDate;
      approvedDate = onlinePayment.approvedDate;
      rejectionComment = onlinePayment.rejectionComment;
    } else if (cashPayment) {
      paymentStatus = cashPayment.status === "paid" ? "paid" : "pending";
      paymentMode = "cash";
      queueNumber = cashPayment.queueNumber;
      submittedDate = cashPayment.generatedDate;
      approvedDate = cashPayment.paidDate;
    }

    const result: StudentPaymentStatus = {
      email: student.email,
      name: student.name,
      hasApplied: !!application,
      applicationStatus: application?.status,
      documentsApproved: docsApproved,
      paymentStatus,
      paymentMode,
      referenceNumber,
      queueNumber,
      submittedDate,
      approvedDate,
      rejectionComment,
      enrollmentStatus: isEnrolled ? "enrolled" : "not_enrolled",
      track: application?.preferredTrack,
    };

    setSearchResult(result);
    setShowResult(true);
    setNotFound(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "paid":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            {status === "paid" ? "Paid" : "Approved"}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-800 font-semibold">
            <Clock className="w-5 h-5" />
            Pending Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-800 font-semibold">
            <XCircle className="w-5 h-5" />
            Rejected
          </span>
        );
      case "not_submitted":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-800 font-semibold">
            <AlertCircle className="w-5 h-5" />
            Not Submitted
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Payment Lookup</h1>
        <p className="text-gray-600">Search for a student to check their payment status</p>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8">
        <div className="max-w-2xl mx-auto">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Search by Student Name or Email
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter student name or email address..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResult(false);
                  setNotFound(false);
                }}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Not Found Message */}
      {notFound && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center max-w-2xl mx-auto">
          <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Student Not Found</h3>
          <p className="text-gray-600">
            No student account found with that name or email. Please check the spelling and try again.
          </p>
        </div>
      )}

      {/* Search Result */}
      {showResult && searchResult && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden max-w-3xl mx-auto">
          {/* Student Info Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{searchResult.name}</h2>
                <p className="text-blue-100 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {searchResult.email}
                </p>
              </div>
            </div>
          </div>

          {/* Status Details */}
          <div className="p-8 space-y-6">
            {/* Application Status */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Application Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Application Submitted</span>
                  {searchResult.hasApplied ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                {searchResult.hasApplied && searchResult.track && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Applied Track</span>
                    <span className="text-sm font-semibold text-blue-600">{searchResult.track}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Documents Approved</span>
                  {searchResult.documentsApproved ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                {searchResult.applicationStatus && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Application Status</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {searchResult.applicationStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Payment Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Status</span>
                  {getPaymentStatusBadge(searchResult.paymentStatus)}
                </div>

                {searchResult.paymentMode && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment Method</span>
                    <div className="flex items-center gap-2">
                      {searchResult.paymentMode === "cash" ? (
                        <Banknote className="w-4 h-4 text-green-600" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm font-semibold text-gray-900">
                        {searchResult.paymentMode === "bank"
                          ? "Bank Transfer"
                          : searchResult.paymentMode === "gcash"
                          ? "GCash"
                          : "Cash"}
                      </span>
                    </div>
                  </div>
                )}

                {searchResult.referenceNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Reference Number</span>
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      {searchResult.referenceNumber}
                    </span>
                  </div>
                )}

                {searchResult.queueNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Queue Number</span>
                    <span className="text-xl font-bold text-blue-600">{searchResult.queueNumber}</span>
                  </div>
                )}

                {searchResult.submittedDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Submitted Date</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(searchResult.submittedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {searchResult.approvedDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approved Date</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(searchResult.approvedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {searchResult.rejectionComment && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-600 block mb-2">Rejection Reason</span>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-700">{searchResult.rejectionComment}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enrollment Status */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Enrollment Status</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Status</span>
                {searchResult.enrollmentStatus === "enrolled" ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    Enrolled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-800 font-semibold">
                    <Clock className="w-5 h-5" />
                    Not Enrolled
                  </span>
                )}
              </div>
            </div>

            {/* Payment Instructions */}
            {searchResult.paymentStatus === "not_submitted" && searchResult.documentsApproved && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Payment Required</p>
                    <p className="text-sm text-blue-700">
                      Documents have been approved. The student can now proceed with payment submission.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      {!showResult && !notFound && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 max-w-3xl mx-auto">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Payment Lookup</h3>
            <p className="text-gray-600 mb-6">
              Enter a student's name or email address to view their complete payment and enrollment
              status.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Application Status</h4>
                <p className="text-sm text-gray-600">Check if student has submitted enrollment form</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Payment Status</h4>
                <p className="text-sm text-gray-600">View payment method and approval status</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Enrollment Status</h4>
                <p className="text-sm text-gray-600">Verify if student is officially enrolled</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
