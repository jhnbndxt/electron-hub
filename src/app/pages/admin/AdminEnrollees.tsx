import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  X,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status:
    | "Document Approval"
    | "Account Created"
    | "Payment Verified"
    | "Enrolled"
    | "Pending"
    | "Approved"
    | "Rejected";
  strand: string;
  applicationDate: string;
  documents: {
    name: string;
    uploaded: boolean;
  }[];
}

export function AdminEnrollees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const students: Student[] = [
    {
      id: "2026-001",
      fullName: "Joshua Martinez",
      email: "joshua@gmail.com",
      phone: "+63 912 345 6789",
      status: "Document Approval",
      strand: "ICT",
      applicationDate: "March 25, 2026",
      documents: [
        { name: "PSA Birth Certificate", uploaded: true },
        { name: "Form 138 (Report Card)", uploaded: true },
        { name: "Good Moral Certificate", uploaded: false },
        { name: "2x2 ID Picture", uploaded: true },
      ],
    },
    {
      id: "2026-002",
      fullName: "Maria Santos",
      email: "m.santos@gmail.com",
      phone: "+63 923 456 7890",
      status: "Account Created",
      strand: "STEM",
      applicationDate: "March 20, 2026",
      documents: [
        { name: "PSA Birth Certificate", uploaded: true },
        { name: "Form 138 (Report Card)", uploaded: true },
        { name: "Good Moral Certificate", uploaded: true },
        { name: "2x2 ID Picture", uploaded: true },
      ],
    },
    {
      id: "2026-003",
      fullName: "Juan Dela Cruz",
      email: "j.delacruz@gmail.com",
      phone: "+63 934 567 8901",
      status: "Payment Verified",
      strand: "ABM",
      applicationDate: "March 18, 2026",
      documents: [
        { name: "PSA Birth Certificate", uploaded: true },
        { name: "Form 138 (Report Card)", uploaded: true },
        { name: "Good Moral Certificate", uploaded: true },
        { name: "2x2 ID Picture", uploaded: true },
      ],
    },
    {
      id: "2026-004",
      fullName: "Elena Reyes",
      email: "e.reyes@gmail.com",
      phone: "+63 945 678 9012",
      status: "Enrolled",
      strand: "HUMSS",
      applicationDate: "March 15, 2026",
      documents: [
        { name: "PSA Birth Certificate", uploaded: true },
        { name: "Form 138 (Report Card)", uploaded: true },
        { name: "Good Moral Certificate", uploaded: true },
        { name: "2x2 ID Picture", uploaded: true },
      ],
    },
  ];

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || student.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Enrolled":
        return "bg-green-100 text-green-700 border-green-200";
      case "Payment Verified":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Account Created":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Document Approval":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleApprove = (student: Student) => {
    console.log("Approving:", student.id);
    setSelectedStudent(null);
    // Add approval logic here
  };

  const handleReject = (student: Student) => {
    console.log("Rejecting:", student.id);
    setSelectedStudent(null);
    // Add rejection logic here
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Student Enrollees
        </h1>
        <p className="text-gray-600">
          Review and manage student enrollment applications
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, student ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Export Button */}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Student ID
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Full Name
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Strand
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Application Date
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Enrollment Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">
                    {student.id}
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {student.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {student.strand}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {student.applicationDate}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        student.status
                      )}`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                      style={{ backgroundColor: "#1E3A8A" }}
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">No students found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Slide-over Panel */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setSelectedStudent(null)}
          />

          {/* Panel */}
          <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div
              className="px-6 py-6 border-b border-gray-200"
              style={{ backgroundColor: "#1E3A8A" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Application Review
                  </h2>
                  <p className="text-blue-200 text-sm mt-1">
                    {selectedStudent.id} - {selectedStudent.fullName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Student Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Student Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Full Name:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedStudent.fullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Student ID:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedStudent.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedStudent.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedStudent.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Recommended Strand:</span>
                    <span
                      className="px-3 py-1 text-xs font-medium rounded-full"
                      style={{ backgroundColor: "#1E3A8A", color: "white" }}
                    >
                      {selectedStudent.strand}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Application Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedStudent.applicationDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Status:</span>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        selectedStudent.status
                      )}`}
                    >
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Checklist */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Required Documents
                </h3>
                <div className="space-y-3">
                  {selectedStudent.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            doc.uploaded
                              ? "bg-green-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <FileText
                            className={`w-5 h-5 ${
                              doc.uploaded
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {doc.name}
                          </p>
                          <p
                            className={`text-xs ${
                              doc.uploaded
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {doc.uploaded ? "Uploaded" : "Not uploaded"}
                          </p>
                        </div>
                      </div>
                      {doc.uploaded && (
                        <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          View
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedStudent.status === "Pending" && (
                <div className="sticky bottom-0 bg-white pt-6 border-t border-gray-200">
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(selectedStudent)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Application
                    </button>
                    <button
                      onClick={() => handleReject(selectedStudent)}
                      className="flex-1 px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}