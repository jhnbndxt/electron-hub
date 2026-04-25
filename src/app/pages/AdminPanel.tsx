import { Link } from "react-router";
import {
  Users,
  TrendingUp,
  FileText,
  Settings,
  BarChart3,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function AdminPanel() {
  const stats = [
    { label: "Total Applicants", value: "245", color: "var(--electron-blue)", icon: Users },
    { label: "Pending Reviews", value: "32", color: "var(--electron-red)", icon: FileText },
    { label: "Approved", value: "198", color: "#10B981", icon: TrendingUp },
    { label: "Assessments Taken", value: "312", color: "var(--electron-blue)", icon: BarChart3 },
  ];

  const strandDistribution = [
    { strand: "STEM", count: 98, color: "#B91C1C" },
    { strand: "ABM", count: 67, color: "#1E3A8A" },
    { strand: "GAS", count: 45, color: "#10B981" },
    { strand: "TVL", count: 35, color: "#F59E0B" },
  ];

  const monthlyEnrollments = [
    { month: "Jan", count: 45 },
    { month: "Feb", count: 78 },
    { month: "Mar", count: 122 },
  ];

  const recentApplicants = [
    {
      name: "Maria Santos",
      strand: "STEM",
      status: "Pending",
      date: "March 18, 2026",
      confidence: 95,
    },
    {
      name: "Pedro Garcia",
      strand: "ABM",
      status: "Approved",
      date: "March 17, 2026",
      confidence: 88,
    },
    {
      name: "Ana Reyes",
      strand: "STEM",
      status: "Pending",
      date: "March 17, 2026",
      confidence: 92,
    },
    {
      name: "Carlos Lopez",
      strand: "TVL",
      status: "Approved",
      date: "March 16, 2026",
      confidence: 85,
    },
    {
      name: "Lisa Cruz",
      strand: "GAS",
      status: "Pending",
      date: "March 16, 2026",
      confidence: 78,
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--electron-light-gray)" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--electron-blue)" }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl" style={{ color: "var(--electron-blue)" }}>
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">Electron Hub Management System</p>
            </div>
          </div>
          <Link
            to="/"
            className="px-4 py-2 rounded-md border-2 transition-colors hover:bg-gray-50 flex items-center gap-2"
            style={{ borderColor: "var(--electron-blue)", color: "var(--electron-blue)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Site
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: stat.color }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strand Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-6" style={{ color: "var(--electron-blue)" }}>
              Strand Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={strandDistribution}
                  dataKey="count"
                  nameKey="strand"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {strandDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {strandDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {item.strand}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Enrollments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-6" style={{ color: "var(--electron-blue)" }}>
              Monthly Enrollments
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyEnrollments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#1E3A8A" name="Applicants" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Applicants Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl" style={{ color: "var(--electron-blue)" }}>
              Recent Applicants
            </h2>
            <button
              className="px-4 py-2 rounded-md text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--electron-blue)" }}
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2" style={{ borderColor: "var(--electron-blue)" }}>
                  <th className="text-left py-3 px-4 text-sm" style={{ color: "var(--electron-dark-gray)" }}>
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm" style={{ color: "var(--electron-dark-gray)" }}>
                    Recommended Strand
                  </th>
                  <th className="text-left py-3 px-4 text-sm" style={{ color: "var(--electron-dark-gray)" }}>
                    Confidence
                  </th>
                  <th className="text-left py-3 px-4 text-sm" style={{ color: "var(--electron-dark-gray)" }}>
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm" style={{ color: "var(--electron-dark-gray)" }}>
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm" style={{ color: "var(--electron-dark-gray)" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentApplicants.map((applicant, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4" style={{ color: "var(--electron-dark-gray)" }}>
                      {applicant.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-1 rounded-md text-sm text-white"
                        style={{ backgroundColor: "var(--electron-blue)" }}
                      >
                        {applicant.strand}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${applicant.confidence}%`,
                              backgroundColor: "var(--electron-red)",
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{applicant.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{applicant.date}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          applicant.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {applicant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        className="px-3 py-1 rounded-md text-sm text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: "var(--electron-red)" }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Management Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
            <Users className="w-8 h-8 mb-3" style={{ color: "var(--electron-blue)" }} />
            <h3 className="text-lg mb-2" style={{ color: "var(--electron-dark-gray)" }}>
              Manage Students
            </h3>
            <p className="text-sm text-gray-600">View and manage student applications</p>
          </button>

          <button className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
            <FileText className="w-8 h-8 mb-3" style={{ color: "var(--electron-red)" }} />
            <h3 className="text-lg mb-2" style={{ color: "var(--electron-dark-gray)" }}>
              Manage Questions
            </h3>
            <p className="text-sm text-gray-600">Edit assessment questions and categories</p>
          </button>

          <button className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
            <Settings className="w-8 h-8 mb-3" style={{ color: "var(--electron-blue)" }} />
            <h3 className="text-lg mb-2" style={{ color: "var(--electron-dark-gray)" }}>
              System Settings
            </h3>
            <p className="text-sm text-gray-600">Configure system preferences</p>
          </button>
        </div>
      </div>
    </div>
  );
}
