import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, Users, Award, GraduationCap } from "lucide-react";

export function Reports() {
  const enrollmentData = [
    { id: "aug", month: "Aug", students: 45 },
    { id: "sep", month: "Sep", students: 38 },
    { id: "oct", month: "Oct", students: 52 },
    { id: "nov", month: "Nov", students: 61 },
    { id: "dec", month: "Dec", students: 34 },
    { id: "jan", month: "Jan", students: 48 },
    { id: "feb", month: "Feb", students: 56 },
    { id: "mar", month: "Mar", students: 43 },
  ];

  const courseDistribution = [
    { id: "stem", name: "STEM", value: 145, color: "#1E3A8A" },
    { id: "abm", name: "ABM", value: 98, color: "#3B82F6" },
    { id: "humss", name: "HUMSS", value: 76, color: "#60A5FA" },
    { id: "tvl", name: "TVL-ICT", value: 58, color: "#93C5FD" },
  ];

  const aiTestScores = [
    { id: "90-100", range: "90-100", count: 87 },
    { id: "80-89", range: "80-89", count: 134 },
    { id: "70-79", range: "70-79", count: 98 },
    { id: "60-69", range: "60-69", count: 45 },
    { id: "below-60", range: "Below 60", count: 13 },
  ];

  const totalStudents = courseDistribution.reduce((sum, item) => sum + item.value, 0);
  const avgAIScore = 84.5;
  const enrollmentGrowth = 12.3;

  const handleExportReport = () => {
    alert("Exporting comprehensive report to PDF...");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive insights and statistics
          </p>
        </div>
        <button
          onClick={handleExportReport}
          className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center gap-2"
          style={{ backgroundColor: "#1E3A8A" }}
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Students */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#DBEAFE" }}
            >
              <Users className="w-6 h-6" style={{ color: "#1E3A8A" }} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {totalStudents}
          </h3>
          <p className="text-sm text-gray-600 font-medium">Total Students</p>
        </div>

        {/* Average AI Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#FEF3C7" }}
            >
              <Award className="w-6 h-6" style={{ color: "#D97706" }} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {avgAIScore}%
          </h3>
          <p className="text-sm text-gray-600 font-medium">Avg AI Test Score</p>
        </div>

        {/* Enrollment Growth */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#D1FAE5" }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: "#10B981" }} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            +{enrollmentGrowth}%
          </h3>
          <p className="text-sm text-gray-600 font-medium">Enrollment Growth</p>
        </div>

        {/* Active Courses */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#E0E7FF" }}
            >
              <GraduationCap className="w-6 h-6" style={{ color: "#4F46E5" }} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {courseDistribution.length}
          </h3>
          <p className="text-sm text-gray-600 font-medium">Active Courses</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Enrollment Trend */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Enrollment Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={enrollmentData}>
              <CartesianGrid key="enrollment-grid" strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis key="enrollment-x" dataKey="month" stroke="#6B7280" />
              <YAxis key="enrollment-y" stroke="#6B7280" />
              <Tooltip
                key="enrollment-tooltip"
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Legend key="enrollment-legend" />
              <Bar 
                key="enrollment-bar"
                dataKey="students" 
                fill="#1E3A8A" 
                name="Students Enrolled" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Course Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Course Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                key="course-pie"
                data={courseDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {courseDistribution.map((entry) => (
                  <Cell key={`cell-${entry.id}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip key="course-tooltip" />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {courseDistribution.map((course) => (
              <div key={course.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: course.color }}
                />
                <span className="text-sm text-gray-700">
                  {course.name}: <span className="font-semibold">{course.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Test Score Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          AI Test Score Distribution
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={aiTestScores} layout="vertical">
            <CartesianGrid key="ai-grid" strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis key="ai-x" type="number" stroke="#6B7280" />
            <YAxis key="ai-y" dataKey="range" type="category" stroke="#6B7280" />
            <Tooltip
              key="ai-tooltip"
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
            />
            <Legend key="ai-legend" />
            <Bar 
              key="ai-bar"
              dataKey="count" 
              fill="#10B981" 
              name="Number of Students" 
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}