import { useState } from "react";
import {
  Search,
  Download,
  TrendingUp,
  Brain,
  Award,
  Target,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface TestResult {
  id: string;
  studentName: string;
  studentId: string;
  recommendedStrand: string;
  confidence: number;
  testDate: string;
  scores: {
    math: number;
    science: number;
    english: number;
    social: number;
    technical: number;
  };
}

export function AdminAITestResults() {
  const [searchQuery, setSearchQuery] = useState("");

  const testResults: TestResult[] = [
    {
      id: "TEST-001",
      studentName: "Maria Santos",
      studentId: "2026-001",
      recommendedStrand: "STEM",
      confidence: 95,
      testDate: "March 18, 2026",
      scores: {
        math: 92,
        science: 95,
        english: 88,
        social: 75,
        technical: 80,
      },
    },
    {
      id: "TEST-002",
      studentName: "Pedro Garcia",
      studentId: "2026-002",
      recommendedStrand: "ABM",
      confidence: 88,
      testDate: "March 17, 2026",
      scores: {
        math: 85,
        science: 70,
        english: 90,
        social: 92,
        technical: 65,
      },
    },
    {
      id: "TEST-003",
      studentName: "Ana Reyes",
      studentId: "2026-003",
      recommendedStrand: "STEM",
      confidence: 92,
      testDate: "March 17, 2026",
      scores: {
        math: 90,
        science: 93,
        english: 85,
        social: 78,
        technical: 82,
      },
    },
    {
      id: "TEST-004",
      studentName: "Carlos Lopez",
      studentId: "2026-004",
      recommendedStrand: "TVL",
      confidence: 85,
      testDate: "March 16, 2026",
      scores: {
        math: 75,
        science: 72,
        english: 80,
        social: 70,
        technical: 95,
      },
    },
    {
      id: "TEST-005",
      studentName: "Lisa Cruz",
      studentId: "2026-005",
      recommendedStrand: "GAS",
      confidence: 78,
      testDate: "March 16, 2026",
      scores: {
        math: 70,
        science: 68,
        english: 88,
        social: 85,
        technical: 65,
      },
    },
    {
      id: "TEST-006",
      studentName: "John Fernandez",
      studentId: "2026-006",
      recommendedStrand: "STEM",
      confidence: 91,
      testDate: "March 15, 2026",
      scores: {
        math: 94,
        science: 90,
        english: 82,
        social: 76,
        technical: 85,
      },
    },
  ];

  const filteredResults = testResults.filter(
    (result) =>
      result.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.recommendedStrand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const averageScores = {
    math: Math.round(
      testResults.reduce((sum, r) => sum + r.scores.math, 0) /
        testResults.length
    ),
    science: Math.round(
      testResults.reduce((sum, r) => sum + r.scores.science, 0) /
        testResults.length
    ),
    english: Math.round(
      testResults.reduce((sum, r) => sum + r.scores.english, 0) /
        testResults.length
    ),
    social: Math.round(
      testResults.reduce((sum, r) => sum + r.scores.social, 0) /
        testResults.length
    ),
    technical: Math.round(
      testResults.reduce((sum, r) => sum + r.scores.technical, 0) /
        testResults.length
    ),
  };

  const averageConfidence = Math.round(
    testResults.reduce((sum, r) => sum + r.confidence, 0) / testResults.length
  );

  const radarData = [
    { subject: "Math", score: averageScores.math },
    { subject: "Science", score: averageScores.science },
    { subject: "English", score: averageScores.english },
    { subject: "Social", score: averageScores.social },
    { subject: "Technical", score: averageScores.technical },
  ];

  const strandAccuracy = [
    { strand: "STEM", accuracy: 95 },
    { strand: "ABM", accuracy: 88 },
    { strand: "GAS", accuracy: 82 },
    { strand: "TVL", accuracy: 87 },
  ];

  const getStrandColor = (strand: string) => {
    switch (strand) {
      case "STEM":
        return "bg-blue-100 text-blue-700";
      case "ABM":
        return "bg-red-100 text-red-700";
      case "GAS":
        return "bg-green-100 text-green-700";
      case "TVL":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          AI Test Results
        </h1>
        <p className="text-gray-600">
          View and analyze AI-assisted strand recommendation results
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {testResults.length}
              </p>
              <p className="text-sm text-gray-600">Total Tests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {averageConfidence}%
              </p>
              <p className="text-sm text-gray-600">Avg Confidence</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">92%</p>
              <p className="text-sm text-gray-600">Accuracy Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">+15%</p>
              <p className="text-sm text-gray-600">vs Last Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Average Scores Radar */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Average Scores by Category
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar
                name="Average Score"
                dataKey="score"
                stroke="#1E3A8A"
                fill="#1E3A8A"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Strand Accuracy */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Strand Recommendation Accuracy
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={strandAccuracy}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="strand" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="accuracy" fill="#10B981" name="Accuracy %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search and Export */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, ID, or strand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Results
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Test ID
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Student
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Recommended Strand
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Confidence
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Test Date
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Top Scores
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result) => {
                const topScores = Object.entries(result.scores)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 2);

                return (
                  <tr
                    key={result.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">
                      {result.id}
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {result.studentName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.studentId}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStrandColor(
                          result.recommendedStrand
                        )}`}
                      >
                        {result.recommendedStrand}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${result.confidence}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${getConfidenceColor(
                            result.confidence
                          )}`}
                        >
                          {result.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {result.testDate}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        {topScores.map(([subject, score]) => (
                          <span
                            key={subject}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {subject.charAt(0).toUpperCase() + subject.slice(1)}:{" "}
                            {score}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredResults.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">No test results found</p>
          </div>
        )}
      </div>
    </div>
  );
}
