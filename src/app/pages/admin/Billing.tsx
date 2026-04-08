import { CreditCard, DollarSign, TrendingUp, Calendar, Download, CheckCircle } from "lucide-react";

export function Billing() {
  const billingOverview = {
    currentPlan: "Enterprise",
    billingCycle: "Annual",
    nextBillingDate: "April 1, 2027",
    amount: "₱1,200,000.00",
    activeStudents: 1247,
    includedSeats: 2000,
  };

  const invoices = [
    {
      id: "INV-2026-003",
      date: "2026-03-01",
      description: "Enterprise Plan - Annual Subscription",
      amount: "₱1,200,000.00",
      status: "paid",
    },
    {
      id: "INV-2025-002",
      date: "2025-03-01",
      description: "Enterprise Plan - Annual Subscription",
      amount: "₱1,100,000.00",
      status: "paid",
    },
    {
      id: "INV-2024-001",
      date: "2024-03-01",
      description: "Professional Plan - Annual Subscription",
      amount: "₱850,000.00",
      status: "paid",
    },
  ];

  const usageStats = [
    {
      label: "Active Students",
      current: 1247,
      limit: 2000,
      percentage: 62,
      color: "#7C3AED",
    },
    {
      label: "API Calls (Monthly)",
      current: 45230,
      limit: 100000,
      percentage: 45,
      color: "#10B981",
    },
    {
      label: "Storage Used",
      current: 156,
      limit: 500,
      percentage: 31,
      color: "#3B82F6",
      unit: "GB",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Billing & Subscription
        </h1>
        <p className="text-gray-600">
          Manage your subscription plan and billing information
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div
          className="p-6 border-b border-gray-200"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {billingOverview.currentPlan} Plan
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "#FFFFFF", color: "#7C3AED" }}
                >
                  Active
                </span>
              </div>
              <p className="text-purple-100 text-sm">
                {billingOverview.billingCycle} billing • Renews on{" "}
                {billingOverview.nextBillingDate}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                {billingOverview.amount}
              </p>
              <p className="text-purple-100 text-sm">per year</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#F3E8FF" }}
              >
                <CheckCircle className="w-6 h-6" style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Students</p>
                <p className="text-xl font-bold text-gray-900">
                  {billingOverview.activeStudents} / {billingOverview.includedSeats}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#F3E8FF" }}
              >
                <TrendingUp className="w-6 h-6" style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Billing Cycle</p>
                <p className="text-xl font-bold text-gray-900">
                  {billingOverview.billingCycle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#F3E8FF" }}
              >
                <Calendar className="w-6 h-6" style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Billing</p>
                <p className="text-xl font-bold text-gray-900">
                  {billingOverview.nextBillingDate.split(",")[0]}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => alert("Upgrade plan functionality coming soon")}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "#7C3AED" }}
            >
              Upgrade Plan
            </button>
            <button
              onClick={() => alert("Manage subscription functionality coming soon")}
              className="px-6 py-3 rounded-lg font-medium transition-all hover:bg-gray-100 border border-gray-300"
              style={{ color: "#374151" }}
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Usage Statistics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Current usage for this billing period
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {usageStats.map((stat, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {stat.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stat.current.toLocaleString()} / {stat.limit.toLocaleString()}{" "}
                    {stat.unit || ""}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${stat.percentage}%`,
                      backgroundColor: stat.color,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.percentage}% of quota used
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Method
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your payment methods
              </p>
            </div>
            <button
              onClick={() => alert("Add payment method functionality coming soon")}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: "#7C3AED" }}
            >
              Add Payment Method
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#F3E8FF" }}
            >
              <CreditCard className="w-7 h-7" style={{ color: "#7C3AED" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Bank Transfer
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Payment via bank transfer • Primary method
              </p>
            </div>
            <button
              onClick={() => alert("Edit payment method")}
              className="text-sm font-medium hover:underline"
              style={{ color: "#7C3AED" }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Invoice History
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                View and download past invoices
              </p>
            </div>
            <button
              onClick={() => alert("Download all invoices")}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:bg-gray-100 border border-gray-300 flex items-center gap-2"
              style={{ color: "#374151" }}
            >
              <Download className="w-4 h-4" />
              Download All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
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
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900 font-mono">
                      {invoice.id}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{invoice.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{invoice.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {invoice.amount}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                    >
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => alert(`Download invoice ${invoice.id}`)}
                      className="text-sm font-medium hover:underline flex items-center gap-1"
                      style={{ color: "#7C3AED" }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
