import { Link } from "react-router";
import {
  Users,
  TrendingUp,
  FileText,
  Settings,
  BarChart3,
  GraduationCap,
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  ClipboardList,
  Shield,
  LogBook,
  Sliders,
  Activity,
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
  LineChart,
  Line,
} from "recharts";

export function AdminPanel() {
  // Summary Cards Data
  const summaryCards = [
    { label: "Total Students", value: "1,245", icon: Users, color: "var(--electron-blue)" },
    { label: "Pending Applications", value: "32", icon: Clock, color: "#F59E0B" },
    { label: "Approved Today", value: "8", icon: CheckCircle, color: "#10B981" },
    { label: "Total Enrolled", value: "892", icon: GraduationCap, color: "var(--electron-blue)" },
    { label: "Payments Pending", value: "24", icon: DollarSign, color: "var(--electron-red)" },
    { label: "Payments Approved", value: "156", icon: TrendingUp, color: "#10B981" },
    { label: "Active Users/Admins", value: "12", icon: Activity, color: "#8B5CF6" },
  ];

  // Quick Actions
  const quickActions = [
    { label: "Review Applications", icon: FileText, color: "var(--electron-blue)" },
    { label: "Approve Payments", icon: DollarSign, color: "var(--electron-red)" },
    { label: "Student Records", icon: Users, color: "#10B981" },
    { label: "Section Management", icon: ClipboardList, color: "#F59E0B" },
    { label: "Assessment Management", icon: BarChart3, color: "var(--electron-blue)" },
    { label: "User Management", icon: Shield, color: "#8B5CF6" },
    { label: "Audit Logs", icon: LogBook, color: "#EC4899" },
    { label: "System Configuration", icon: Settings, color: "var(--electron-blue)" },
  ];

  // Charts Data
  const paymentCollectionData = [
    { day: "Mon", amount: 4500 },
    { day: "Tue", amount: 5200 },
    { day: "Wed", amount: 3800 },
    { day: "Thu", amount: 6100 },
    { day: "Fri", amount: 7200 },
    { day: "Sat", amount: 5900 },
    { day: "Sun", amount: 4200 },
  ];

  const applicationStatusData = [
    { status: "Pending", count: 32, color: "#F59E0B" },
    { status: "Approved", count: 156, color: "#10B981" },
    { status: "Rejected", count: 28, color: "var(--electron-red)" },
  ];

  const dailyActivityData = [
    { time: "12 AM", users: 45 },
    { time: "4 AM", users: 32 },
    { time: "8 AM", users: 120 },
    { time: "12 PM", users: 280 },
    { time: "4 PM", users: 350 },
    { time: "8 PM", users: 220 },
    { time: "11 PM", users: 85 },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/50 px-8 py-6 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: "var(--electron-blue)" }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--electron-blue)" }}>
                Branch Coordinator
              </h1>
              <p className="text-sm text-gray-600">System Overview & Management</p>
            </div>
          </div>
          <Link
            to="/"
            className="px-4 py-2 rounded-md border-2 transition-all hover:bg-gray-50 flex items-center gap-2 shadow-md"
            style={{ borderColor: "var(--electron-blue)", color: "var(--electron-blue)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Site
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Top Summary Cards */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
            Summary Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-white/50"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
                      style={{
                        backgroundColor: card.color,
                        opacity: 0.1,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-2" style={{ color: card.color }}>
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-700 font-medium">{card.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  className="rounded-xl shadow-md hover:shadow-lg transition-all p-4 text-left border border-white/50 group"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: action.color,
                      opacity: 0.15,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: action.color }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:font-bold transition-all">
                    {action.label}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Charts / Reports Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
            Charts & Reports
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Payment Collection Summary */}
            <div
              className="lg:col-span-2 rounded-2xl shadow-lg p-6 border border-white/50"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                backdropFilter: "blur(10px)",
              }}
            >
              <h3 className="text-lg font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
                Payment Collection Summary
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={paymentCollectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="day" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--electron-blue)"
                    strokeWidth={3}
                    dot={{ fill: "var(--electron-blue)", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Application Status */}
            <div
              className="rounded-2xl shadow-lg p-6 border border-white/50"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                backdropFilter: "blur(10px)",
              }}
            >
              <h3 className="text-lg font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
                Application Status
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={applicationStatusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {applicationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Activity Count */}
          <div
            className="rounded-2xl shadow-lg p-6 border border-white/50"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(10px)",
            }}
          >
            <h3 className="text-lg font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
              Daily Activity Count
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="time" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="users"
                  fill="var(--electron-blue)"
                  name="Active Users"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
