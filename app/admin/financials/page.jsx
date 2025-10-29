"use client";
import { useEffect, useState } from "react";

export default function AdminFinancialsPage() {
  const [financials, setFinancials] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    description: "",
    amount: "",
    category: "operational",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "bank_transfer",
    notes: "",
  });

  useEffect(() => {
    fetchFinancials();
    fetchExpenses();
  }, []);

  const fetchFinancials = async () => {
    try {
      const res = await fetch("/api/admin/financials", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFinancials(data.financials);
      }
    } catch (error) {
      console.error("Error fetching financials:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/admin/expenses", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const handleAddExpense = async () => {
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(expenseForm),
      });

      if (res.ok) {
        alert("Expense added successfully");
        setShowAddExpense(false);
        setExpenseForm({
          title: "",
          description: "",
          amount: "",
          category: "operational",
          date: new Date().toISOString().split("T")[0],
          paymentMethod: "bank_transfer",
          notes: "",
        });
        fetchExpenses();
        fetchFinancials();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to add expense");
      }
    } catch (error) {
      alert("Error adding expense");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-400">Loading financial data...</p>
        </div>
      </div>
    );
  }

  const totalExpenses = expenses
    .filter((e) => e.status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);

  const thisMonthExpenses = expenses
    .filter((e) => {
      if (e.status !== "paid") return false;
      const expenseDate = new Date(e.date);
      const now = new Date();
      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const actualRevenue = financials?.subscriptionRevenue?.allTime || 0;
  
  const netProfit = actualRevenue - totalExpenses;

  const totalDonations = financials?.donations?.allTime || 0;
  const totalFunding = financials?.fundingRequests?.allTime || 0;
  const donationPoolBalance = totalDonations - totalFunding;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Financial Dashboard
            </h1>
            <p className="mt-2 text-gray-400">
              Track revenue, expenses, and profitability
            </p>
          </div>
          <button
            onClick={() => setShowAddExpense(true)}
            className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
          >
            + Add Expense
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-5">
          {/* ✅ Subscription Revenue */}
          <div className="rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-6 shadow-xl">
            <p className="text-sm font-medium text-green-100">Subscription Revenue</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {formatCurrency(financials?.subscriptionRevenue?.allTime)}
            </p>
            <p className="mt-1 text-xs text-green-200">
              {financials?.subscriptionRevenue?.transactionCount} transactions
            </p>
          </div>

          {/* ✅ Total Expenses */}
          <div className="rounded-2xl bg-gradient-to-br from-red-600 to-red-700 p-6 shadow-xl">
            <p className="text-sm font-medium text-red-100">Total Expenses</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {formatCurrency(totalExpenses)}
            </p>
            <p className="mt-1 text-xs text-red-200">
              {expenses.filter((e) => e.status === "paid").length} paid
            </p>
          </div>

          {/* ✅ Net Profit */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-6 shadow-xl">
            <p className="text-sm font-medium text-purple-100">Net Profit</p>
            <p
              className={`mt-2 text-3xl font-bold ${
                netProfit >= 0 ? "text-white" : "text-red-200"
              }`}
            >
              {formatCurrency(netProfit)}
            </p>
            <p className="mt-1 text-xs text-purple-200">
              Subscription - Expenses
            </p>
          </div>

          {/* ✅ Donation Pool (Separate Tracking) */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 shadow-xl">
            <p className="text-sm font-medium text-blue-100">Donation Pool</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {formatCurrency(totalDonations)}
            </p>
            <p className="mt-1 text-xs text-blue-200">
              {financials?.donations?.count} donations
            </p>
          </div>

          {/* ✅ Donation Pool Balance */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-600 to-orange-700 p-6 shadow-xl">
            <p className="text-sm font-medium text-orange-100">Pool Balance</p>
            <p
              className={`mt-2 text-3xl font-bold ${
                donationPoolBalance >= 0 ? "text-white" : "text-red-200"
              }`}
            >
              {formatCurrency(donationPoolBalance)}
            </p>
            <p className="mt-1 text-xs text-orange-200">
              Donations - NGO Funding
            </p>
          </div>
        </div>

        {/* ✅ UPDATED: This Month Performance */}
        <div className="mb-8 rounded-2xl bg-gray-800 p-6 shadow-xl">
          <h3 className="mb-4 text-xl font-bold text-white">
            This Month Performance
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* ✅ Subscription Revenue (Main) */}
            <div className="rounded-lg bg-gray-700 p-4">
              <p className="text-sm text-gray-400">Subscription Revenue</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {formatCurrency(
                  financials?.subscriptionRevenue?.thisMonth || 0,
                )}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {financials?.subscriptionRevenue?.monthlyTransactions || 0}{" "}
                transactions
              </p>
            </div>

            {/* ✅ This Month Expenses */}
            <div className="rounded-lg bg-gray-700 p-4">
              <p className="text-sm text-gray-400">Operating Expenses</p>
              <p className="mt-2 text-2xl font-bold text-red-400">
                -{formatCurrency(thisMonthExpenses)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {expenses.filter((e) => {
                  if (e.status !== "paid") return false;
                  const expenseDate = new Date(e.date);
                  const now = new Date();
                  return (
                    expenseDate.getMonth() === now.getMonth() &&
                    expenseDate.getFullYear() === now.getFullYear()
                  );
                }).length}{" "}
                expenses
              </p>
            </div>

            {/* ✅ Net Profit This Month */}
            <div className="rounded-lg border border-green-500/50 bg-green-600/20 p-4">
              <p className="text-sm text-green-300">Net Profit (This Month)</p>
              <p className="mt-2 text-2xl font-bold text-green-400">
                {formatCurrency(
                  (financials?.subscriptionRevenue?.thisMonth || 0) -
                    thisMonthExpenses,
                )}
              </p>
              <p className="mt-1 text-xs text-green-300">Subscriptions - Expenses</p>
            </div>

            {/* ✅ Donation Activity This Month */}
            <div className="rounded-lg bg-gray-700 p-4">
              <p className="text-sm text-gray-400">Donations This Month</p>
              <p className="mt-2 text-2xl font-bold text-blue-400">
                {formatCurrency(financials?.donations?.thisMonth || 0)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {financials?.donations?.monthlyCount || 0} donations
              </p>
            </div>
          </div>
        </div>

        {/* ✅ UPDATED: Two Column Layout */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ✅ Revenue Breakdown (Subscriptions Only) */}
          <div className="rounded-2xl bg-gray-800 p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-white">
              Subscription Revenue Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-700 p-3">
                <span className="text-gray-300">Subscription Subtotal</span>
                <span className="font-semibold text-white">
                  {formatCurrency(financials?.subscriptionRevenue?.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-700 p-3">
                <span className="text-gray-300">GST Collected (18%)</span>
                <span className="font-semibold text-white">
                  {formatCurrency(financials?.subscriptionRevenue?.gst)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-700 p-3">
                <span className="text-gray-300">Refunds Issued</span>
                <span className="font-semibold text-red-400">
                  -{formatCurrency(financials?.refunds?.total)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-green-500/50 bg-green-600/20 p-3">
                <span className="font-semibold text-green-300">
                  Net Subscription Revenue
                </span>
                <span className="text-lg font-bold text-green-400">
                  {formatCurrency(financials?.netRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* ✅ Revenue by Tier */}
          <div className="rounded-2xl bg-gray-800 p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-white">
              Revenue by Tier
            </h3>
            <div className="space-y-3">
              {financials?.revenueByTier?.map((tier) => (
                <div
                  key={tier._id}
                  className="flex items-center justify-between rounded-lg bg-gray-700 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        tier._id === 2
                          ? "bg-amber-600 text-white"
                          : tier._id === 3
                            ? "bg-gray-400 text-white"
                            : tier._id === 4
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-500 text-white"
                      }`}
                    >
                      Tier {tier._id}
                    </span>
                    <span className="text-sm text-gray-300">
                      {tier.count} subscriptions
                    </span>
                  </div>
                  <span className="font-semibold text-white">
                    {formatCurrency(tier.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ✅ NEW: Donation Pool Management - Full Width */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 p-6 shadow-xl">
          <h3 className="mb-4 text-xl font-bold text-white">
            💝 Donation Management
          </h3>
          <p className="mb-4 text-sm text-blue-200">
            Donations are kept separate from business revenue and used exclusively for NGO funding
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-blue-200">Total Donations Received</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {formatCurrency(totalDonations)}
              </p>
              <p className="mt-1 text-xs text-blue-300">
                {financials?.donations?.count || 0} donations
              </p>
            </div>

            <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-orange-200">NGO Funding Allocated</p>
              <p className="mt-2 text-3xl font-bold text-orange-300">
                {formatCurrency(totalFunding)}
              </p>
              <p className="mt-1 text-xs text-orange-300">
                {financials?.fundingRequests?.count || 0} approved requests
              </p>
            </div>

            <div className="rounded-lg border-2 border-white/30 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-green-200">Available for NGOs</p>
              <p
                className={`mt-2 text-3xl font-bold ${
                  donationPoolBalance >= 0 ? "text-green-300" : "text-red-300"
                }`}
              >
                {formatCurrency(donationPoolBalance)}
              </p>
              <p className="mt-1 text-xs text-green-300">
                {donationPoolBalance >= 0 ? "Available" : "Overspent"}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ Expenses Table - No Changes Needed */}
        <div className="overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
          <div className="border-b border-gray-700 p-6">
            <h3 className="text-xl font-bold text-white">
              Operational Expenses
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-400">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-400">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-400">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-400">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No expenses recorded yet
                    </td>
                  </tr>
                ) : (
                  expenses.slice(0, 20).map((expense) => (
                    <tr
                      key={expense._id}
                      className="transition-colors hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">
                          {expense.title}
                        </p>
                        {expense.description && (
                          <p className="mt-1 text-xs text-gray-400">
                            {expense.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">
                          {formatCurrency(expense.amount)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-300">
                          {formatDate(expense.date)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            expense.status === "paid"
                              ? "bg-green-500/20 text-green-400"
                              : expense.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {expense.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Expense Modal - No Changes Needed */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-gray-800 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">
              Add New Expense
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Title *
                </label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white"
                  placeholder="e.g., AWS Hosting - October"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Amount *
                </label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Category *
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white"
                >
                  <option value="hosting">Hosting</option>
                  <option value="marketing">Marketing</option>
                  <option value="development">Development</option>
                  <option value="support">Support</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="payment_gateway">Payment Gateway</option>
                  <option value="legal">Legal</option>
                  <option value="operational">Operational</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Date *
                </label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, date: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Description
                </label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white"
                  rows="3"
                  placeholder="Additional details..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Notes
                </label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, notes: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white"
                  rows="2"
                  placeholder="Internal notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddExpense}
                disabled={
                  !expenseForm.title ||
                  !expenseForm.amount ||
                  !expenseForm.category
                }
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Expense
              </button>
              <button
                onClick={() => setShowAddExpense(false)}
                className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}