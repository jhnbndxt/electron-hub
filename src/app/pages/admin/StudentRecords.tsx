import { useState, useEffect } from "react";
import { Search, Filter, Download, Users, Eye, Edit2 } from "lucide-react";
import { getEnrolledStudents } from "../../../services/adminService";
import { useNavigate } from "react-router";

interface Student {
  id: string;
  studentId: string;
  name: string;
  email?: string;
  enrollmentDate: string;
  track: string;
  status: string;
  yearLevel: string;
}

const TRACK_OPTIONS = ["Academic", "Technical-Professional"] as const;

const normalizeTrack = (value: unknown): string => {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .toLowerCase();

  if (normalized === "academic") return "Academic";
  if (
    normalized === "technical-professional" ||
    normalized === "technical professional" ||
    normalized === "technical_professional"
  ) {
    return "Technical-Professional";
  }

  return "";
};

export function StudentRecords() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrack, setFilterTrack] = useState("all");
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load enrolled students from Supabase
  useEffect(() => {
    void loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data: enrollments, error } = await getEnrolledStudents();
    
    if (error || !enrollments) {
      console.error('Error loading enrolled students:', error);
      setAllStudents([]);
      return;
    }

    const students = enrollments.map((enrollment: any) => {
      const formData = enrollment.form_data || {};
      const studentEmail = enrollment.user_id || formData.email || '';

      return {
        id: enrollment.id,
        studentId: formData.studentId || enrollment.id.slice(0, 8),
        name: formData.studentName || `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || studentEmail || 'Unknown',
        email: studentEmail,
        enrollmentDate: enrollment.enrollment_date || enrollment.created_at || '',
        track: normalizeTrack(
          formData.preferred_track ||
          formData.preferredTrack ||
          formData.recommended_track ||
          formData.recommendedTrack ||
          formData.track
        ) || 'Not Set',
        status: enrollment.status || 'Enrolled',
        yearLevel: formData.yearLevel || formData.year_level || 'Grade 11',
      };
    });

    setAllStudents(students);
  };

  // Filter students
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const selectedTrack = normalizeTrack(filterTrack);
  const filteredStudents = allStudents.filter((student) => {
    const matchesSearch =
      !normalizedSearchQuery ||
      student.name.toLowerCase().includes(normalizedSearchQuery) ||
      student.studentId.toLowerCase().includes(normalizedSearchQuery);
    const matchesTrack =
      filterTrack === "all" || normalizeTrack(student.track) === selectedTrack;

    return matchesSearch && matchesTrack;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const handleViewStudent = (student: Student) => {
    const isSuperAdmin = false; // You may need to get this from auth context
    navigate(isSuperAdmin ? `/branchcoordinator/students/${student.id}` : `/registrar/students/${student.id}`, {
      state: { student }
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "enrolled":
        return {
          bg: "#D1FAE5",
          text: "#065F46",
          border: "#6EE7B7",
        };
      case "payment verified":
        return {
          bg: "#DBEAFE",
          text: "#1E40AF",
          border: "#93C5FD",
        };
      case "documents verified":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          border: "#FCD34D",
        };
      default:
        return {
          bg: "#F3F4F6",
          text: "#374151",
          border: "#D1D5DB",
        };
    }
  };

  return (
    <div className="portal-dashboard-page w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold" style={{ color: "var(--electron-blue)" }}>
          <Users className="h-4 w-4" />
          Student Management
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--electron-blue)" }}>Student Records</h1>
        <p className="text-gray-600 text-lg">View and manage enrolled student records</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Track Filter */}
          <select
            value={filterTrack}
            onChange={(e) => setFilterTrack(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Tracks</option>
            {TRACK_OPTIONS.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>

          {/* Export Button */}
          <button
            className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 flex items-center gap-2 bg-blue-600"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Student Records Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Track
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Year Level
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Enrollment Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {allStudents.length === 0 
                      ? "No enrolled students yet. Applications will appear here after approval."
                      : "No students match your search criteria."}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const statusStyle = getStatusStyle(student.status);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {student.studentId}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {student.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                        >
                          {student.track}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{student.yearLevel}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {student.enrollmentDate
                            ? new Date(student.enrollmentDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            borderColor: statusStyle.border,
                          }}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewStudent(student)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                            title="View student"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewStudent(student)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                            title="Edit student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">{Math.min(endIndex, filteredStudents.length)}</span> of{" "}
            <span className="font-medium">{filteredStudents.length}</span> students
          </p>
          
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
