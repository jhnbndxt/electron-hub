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
import { supabase } from "../../../supabase";

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a student email or name");
      return;
    }

    // Search in Supabase users table
    const { data: students, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('role', 'student')
      .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);

    if (userError || !students || students.length === 0) {
      setNotFound(true);
      setShowResult(false);
      setSearchResult(null);
      return;
    }

    const student = students[0];

    // Check enrollment/application status
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, status, form_data, enrollment_documents(*)')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const enrollment = enrollments?.[0];
    const hasApplied = !!enrollment;

    // Check document verification
    const docs = enrollment?.enrollment_documents || [];
    const docsApproved = docs.length > 0 && docs.every((doc: any) => doc.verified === true || doc.status === 'approved');

    // Check payment status from Supabase
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const payment = payments?.[0];

    let paymentStatus: StudentPaymentStatus["paymentStatus"] = "not_submitted";
    let paymentMode: "bank" | "gcash" | "cash" | undefined;
    let referenceNumber: string | undefined;
    let queueNumber: string | undefined;
    let submittedDate: string | undefined;
    let approvedDate: string | undefined;
    let rejectionComment: string | undefined;

    if (payment) {
      // Map Supabase status to UI status
      const statusMap: Record<string, StudentPaymentStatus["paymentStatus"]> = {
        pending: 'pending',
        submitted: 'pending',
        verified: 'approved',
        approved: 'approved',
        completed: 'approved',
        rejected: 'rejected',
        paid: 'paid',
      };
      paymentStatus = statusMap[payment.status] || 'pending';
      paymentMode = payment.payment_method as "bank" | "gcash" | "cash";
      referenceNumber = payment.reference_number;
      queueNumber = payment.queue_number;
      submittedDate = payment.submitted_at || payment.created_at;
      approvedDate = payment.verified_at;
      rejectionComment = payment.notes;
    }

    // Check enrollment status
    const isEnrolled = enrollment?.status === 'enrolled';

    const result: StudentPaymentStatus = {
      email: student.email,
      name: student.full_name,
      hasApplied,
      applicationStatus: enrollment?.status,
      documentsApproved: docsApproved,
      paymentStatus,
      paymentMode,
      referenceNumber,
      queueNumber,
      submittedDate,
      approvedDate,
      rejectionComment,
      enrollmentStatus: isEnrolled ? "enrolled" : "not_enrolled",
      track: enrollment?.form_data?.preferredTrack || enrollment?.form_data?.preferred_track,
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
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Payment Lookup</h1>
        <p className="text-gray-600">Search for a student to check their payment status</p>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 sm:p-8 mb-8">
        <div className="max-w-2xl mx-auto">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Search by Student Name or Email
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
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
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Not Found Message */}
      {notFound && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 sm:p-8 text-center max-w-2xl mx-auto">
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
          <div className="p-5 sm:p-8 space-y-6">
            {/* Application Status */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Application Status</h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-gray-600">Application Submitted</span>
                  {searchResult.hasApplied ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                {searchResult.hasApplied && searchResult.track && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-gray-600">Current Status</span>
                  {getPaymentStatusBadge(searchResult.paymentStatus)}
                </div>

                {searchResult.paymentMode && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-gray-600">Reference Number</span>
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      {searchResult.referenceNumber}
                    </span>
                  </div>
                )}

                {searchResult.queueNumber && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-gray-600">Queue Number</span>
                    <span className="text-xl font-bold text-blue-600">{searchResult.queueNumber}</span>
                  </div>
                )}

                {searchResult.submittedDate && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 sm:p-8 max-w-3xl mx-auto">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Payment Lookup</h3>
            <p className="text-gray-600 mb-6">
              Enter a student's name or email address to view their complete payment and enrollment
              status.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
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
