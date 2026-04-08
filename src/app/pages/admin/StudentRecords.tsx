import { useState, useEffect } from "react";
import { Search, Filter, Download } from "lucide-react";

interface Student {
  id: string;
  studentId: string;
  name: string;
  email?: string;
  enrollmentDate: string;
  strandEnrolled: string;
  status: string;
  yearLevel: string;
}

export function StudentRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStrand, setFilterStrand] = useState("all");
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // Load real enrolled students from localStorage
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = () => {
    // Get enrolled students from enrolled_students localStorage
    const enrolledStudents = JSON.parse(localStorage.getItem("enrolled_students") || "[]");

    // Also get students from pending_applications who have "Enrolled" status
    const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
    const enrolledFromApps = applications
      .filter((app: any) => {
        // Check if student is marked as Enrolled
        if (app.status === "Enrolled") return true;

        // Also check enrollment progress
        const progressKey = `enrollment_progress_${app.email}`;
        const progress = JSON.parse(localStorage.getItem(progressKey) || "[]");
        const enrolledStep = progress.find((step: any) => step.name === "Enrolled");
        return enrolledStep?.status === "completed";
      })
      .map((app: any) => ({
        id: app.id || app.email,
        studentId: app.studentId || `2026-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`,
        name: app.studentName || `${app.firstName || ""} ${app.lastName || ""}`.trim() || app.email,
        email: app.email,
        enrollmentDate: app.enrollmentDate || new Date().toISOString(),
        strandEnrolled: app.preferredTrack || app.recommendedTrack || app.track || "Not Set",
        status: app.status || "Enrolled",
        yearLevel: app.yearLevel || "Grade 11",
      }));

    // Merge both sources, avoiding duplicates by email
    const allEnrolled = [...enrolledStudents];
    enrolledFromApps.forEach((student: Student) => {
      if (!allEnrolled.find((s: Student) => s.email === student.email)) {
        allEnrolled.push(student);
      }
    });

    setAllStudents(allEnrolled);
  };

  // Filter students
  let filteredStudents = allStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterStrand !== "all") {
    filteredStudents = filteredStudents.filter(
      (student) => student.strandEnrolled === filterStrand
    );
  }

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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Student Records
        </h1>
        <p className="text-gray-600">
          View and manage enrolled student records
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Strand Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStrand}
              onChange={(e) => setFilterStrand(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ color: "#374151" }}
            >
              <option value="all">All Strands</option>
              <option value="STEM">STEM</option>
              <option value="HUMSS">HUMSS</option>
              <option value="ABM">ABM</option>
              <option value="GAS">GAS</option>
              <option value="TVL-ICT">TVL-ICT</option>
              <option value="ICT">ICT</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            className="px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#10B981" }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Student Records Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Enrolled Students
          </h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Strand
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {allStudents.length === 0 
                      ? "No enrolled students yet. Applications will appear here after approval."
                      : "No students match your search criteria."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
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
                          {student.strandEnrolled}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{student.yearLevel}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(student.enrollmentDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredStudents.length}</span> of{" "}
            <span className="font-medium">{allStudents.length}</span> students
          </p>
        </div>
      </div>
    </div>
  );
}