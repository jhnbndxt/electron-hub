import { useNavigate, useParams, useLocation } from "react-router";
import { ArrowLeft, Mail, GraduationCap, Award, FileText, Image } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { useAuth } from "../../context/AuthContext";

interface StudentData {
  id: number;
  name: string;
  email: string;
  studentId: string;
  course: string;
  yearLevel: string;
  enrollmentDate: string;
  aiTestScore: number;
  documents: {
    psaBirthCertificate: string;
    form138: string;
  };
  aptitudeScores: {
    subject: string;
    score: number;
  }[];
}

export function StudentProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { userRole } = useAuth();

  // Determine if we're in super admin or regular admin context
  const isSuperAdmin = userRole === "superadmin" || location.pathname.startsWith("/superadmin");

  // Mock student data (in real app, fetch based on id)
  const student: StudentData = {
    id: parseInt(id || "1"),
    name: "Carlos Manuel Lopez",
    email: "carlos.lopez@electronhub.edu.ph",
    studentId: "2026-00123",
    course: "STEM - Science, Technology, Engineering and Mathematics",
    yearLevel: "Grade 11",
    enrollmentDate: "2026-03-18",
    aiTestScore: 95,
    documents: {
      psaBirthCertificate: "https://images.unsplash.com/photo-1586075010923-b1f29fe04b1f?w=400&h=300&fit=crop",
      form138: "https://images.unsplash.com/photo-1554224311-beee4c201f77?w=400&h=300&fit=crop",
    },
    aptitudeScores: [
      { subject: "Math", score: 95 },
      { subject: "Science", score: 92 },
      { subject: "Language", score: 88 },
      { subject: "Technical", score: 94 },
      { subject: "Analytical", score: 90 },
      { subject: "Creative", score: 85 },
    ],
  };

  return (
    <div className="p-8">
      {/* Header with Back Button */}
      <div className="mb-8">
        <button
          onClick={() => navigate(isSuperAdmin ? "/branchcoordinator/students" : "/registrar/students")}
          className="flex items-center gap-2 mb-4 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: isSuperAdmin ? "#7C3AED" : "#10B981" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student Records
        </button>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Student Profile
        </h1>
        <p className="text-gray-600">
          Detailed information and records for {student.name}
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-6">
        <div className="flex items-start gap-8">
          {/* Avatar */}
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0 text-4xl font-bold text-white"
            style={{ backgroundColor: "#1E3A8A" }}
          >
            {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>

          {/* Student Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {student.name}
            </h2>
            <p className="text-sm font-medium mb-6" style={{ color: "#1E3A8A" }}>
              {student.studentId}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#DBEAFE" }}
                >
                  <Mail className="w-5 h-5" style={{ color: "#1E3A8A" }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="text-sm font-medium text-gray-900">{student.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#EEF2FF" }}
                >
                  <GraduationCap className="w-5 h-5" style={{ color: "#4F46E5" }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Course</p>
                  <p className="text-sm font-medium text-gray-900">{student.course}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#D1FAE5" }}
                >
                  <Award className="w-5 h-5" style={{ color: "#10B981" }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Year Level</p>
                  <p className="text-sm font-medium text-gray-900">{student.yearLevel}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#FEF3C7" }}
                >
                  <FileText className="w-5 h-5" style={{ color: "#D97706" }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Enrollment Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(student.enrollmentDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* AI Test Results */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-6 h-6" style={{ color: "#1E3A8A" }} />
            <h3 className="text-xl font-semibold text-gray-900">
              AI Test Results
            </h3>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Score</span>
              <span className="text-2xl font-bold" style={{ color: "#1E3A8A" }}>
                {student.aiTestScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${student.aiTestScore}%`,
                  backgroundColor: "#1E3A8A",
                }}
              />
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Aptitude Breakdown
            </h4>
            <div className="space-y-3">
              {student.aptitudeScores.map((score) => (
                <div key={score.subject}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">{score.subject}</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {score.score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${score.score}%`,
                        backgroundColor: score.score >= 90 ? "#10B981" : "#1E3A8A",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={student.aptitudeScores}>
              <PolarGrid key="student-polar-grid" />
              <PolarAngleAxis key="student-polar-angle" dataKey="subject" />
              <PolarRadiusAxis key="student-polar-radius" angle={90} domain={[0, 100]} />
              <Radar
                key="student-radar"
                name="Scores"
                dataKey="score"
                stroke="#1E3A8A"
                fill="#1E3A8A"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Image className="w-6 h-6" style={{ color: "#1E3A8A" }} />
            <h3 className="text-xl font-semibold text-gray-900">
              Uploaded Documents
            </h3>
          </div>

          <div className="space-y-6">
            {/* PSA Birth Certificate */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    PSA Birth Certificate
                  </span>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                >
                  Verified
                </span>
              </div>
              <div
                className="w-full h-48 rounded-lg border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => window.open(student.documents.psaBirthCertificate, "_blank")}
              >
                <img
                  src={student.documents.psaBirthCertificate}
                  alt="PSA Birth Certificate"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click to view full document
              </p>
            </div>

            {/* Form 138 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    Form 138 (Report Card)
                  </span>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                >
                  Verified
                </span>
              </div>
              <div
                className="w-full h-48 rounded-lg border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => window.open(student.documents.form138, "_blank")}
              >
                <img
                  src={student.documents.form138}
                  alt="Form 138 Report Card"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click to view full document
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Student Actions
            </h3>
            <p className="text-sm text-gray-600">
              Manage student record and status
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(isSuperAdmin ? "/branchcoordinator/students" : "/registrar/students")}
              className="px-6 py-3 rounded-lg font-medium transition-all hover:bg-gray-100 border-2"
              style={{ borderColor: "#D1D5DB", color: "#374151" }}
            >
              Back to Records
            </button>
            <button
              onClick={() => alert("Export functionality coming soon")}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: isSuperAdmin ? "#7C3AED" : "#10B981" }}
            >
              Export Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}