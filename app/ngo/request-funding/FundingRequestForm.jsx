"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Upload, Plus, X, DollarSign, Users, AlertCircle } from "lucide-react";

export default function FundingRequestForm({
  onClose,
  onSuccess,
  currentTier,
  remainingMonthlyAllocation = 0,
}) {
  const [formData, setFormData] = useState({
    title: "",
    requestedAmount: "",
    purpose: "",
    description: "",
    beneficiaryCount: "",
    budgetBreakdown: [{ item: "", amount: "", description: "" }],
  });

  const [loading, setLoading] = useState(false);

  const maxAmount = currentTier === 4 ? 50000 : currentTier === 3 ? 20000 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requestedAmount = parseFloat(formData.requestedAmount);

    if (!requestedAmount || requestedAmount < 1000) {
      toast.error("Please enter a valid amount (minimum ₹1,000)");
      return;
    }

    if (requestedAmount > maxAmount) {
      toast.error(
        `Amount exceeds your ${currentTier === 4 ? "Gold" : "Silver"} tier limit of ₹${maxAmount.toLocaleString()}`,
      );
      return;
    }

    if (
      remainingMonthlyAllocation > 0 &&
      requestedAmount > remainingMonthlyAllocation
    ) {
      toast.error(
        `Request (₹${requestedAmount.toLocaleString()}) exceeds remaining allocation (₹${remainingMonthlyAllocation.toLocaleString()})`,
      );
      return;
    }

    const loadingToast = toast.loading("Submitting your funding request...");

    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem("user"));

      const res = await fetch("/api/ngo/funding-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData.token}`,
        },
        body: JSON.stringify({
          ...formData,
          requestedAmount: requestedAmount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Funding request submitted successfully! 🎉", {
          id: loadingToast,
        });

        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        toast.error(data.message || "Failed to submit request", {
          id: loadingToast,
        });
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("An error occurred. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  const addBudgetItem = () => {
    setFormData({
      ...formData,
      budgetBreakdown: [
        ...formData.budgetBreakdown,
        { item: "", amount: "", description: "" },
      ],
    });
    toast.success("Budget item added", { duration: 2000 });
  };

  const removeBudgetItem = (index) => {
    if (formData.budgetBreakdown.length > 1) {
      const updated = formData.budgetBreakdown.filter((_, i) => i !== index);
      setFormData({ ...formData, budgetBreakdown: updated });
      toast.success("Budget item removed", { duration: 2000 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="scrollbar-hide max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-800/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Request Funding</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Allocation Display */}
          {remainingMonthlyAllocation > 0 ? (
            <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-600/20 p-2">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-blue-300">
                    Remaining Monthly Allocation
                  </p>
                </div>
                <p className="text-3xl font-bold text-white">
                  ₹{remainingMonthlyAllocation.toLocaleString("en-IN")}
                </p>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                💡 Your request amount cannot exceed this remaining allocation
              </p>
            </div>
          ) : remainingMonthlyAllocation === 0 ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-red-300">
                    Monthly Limit Reached
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    You have used your entire monthly allocation. Please try
                    again next month.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Request Title *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="e.g., Medical Equipment for Children's Ward"
              />
            </div>

            {/* Amount & Purpose */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Requested Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  max={
                    remainingMonthlyAllocation > 0
                      ? Math.min(maxAmount, remainingMonthlyAllocation)
                      : maxAmount
                  }
                  value={formData.requestedAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requestedAmount: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                  placeholder="5000"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum: ₹
                  {(remainingMonthlyAllocation > 0
                    ? Math.min(maxAmount, remainingMonthlyAllocation)
                    : maxAmount
                  ).toLocaleString()}{" "}
                  for{" "}
                  {currentTier === 4
                    ? "Gold"
                    : currentTier === 3
                      ? "Silver"
                      : "Free"}{" "}
                  tier
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Purpose *
                </label>
                <select
                  required
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="">Select purpose</option>
                  <option value="medical">Medical</option>
                  <option value="education">Education</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="emergency">Emergency Relief</option>
                  <option value="program">Program Implementation</option>
                  <option value="operational">Operational Costs</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Detailed Description * (min 100 characters)
              </label>
              <textarea
                required
                minLength={100}
                maxLength={2000}
                rows={5}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="Explain why you need this funding, how it will be used, and the expected impact..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Beneficiaries */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                <Users className="mr-1 inline h-4 w-4" />
                Number of Beneficiaries *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.beneficiaryCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    beneficiaryCount: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Estimated number of people who will benefit from this funding
              </p>
            </div>

            {/* Budget Breakdown */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Budget Breakdown
                </label>
                <button
                  type="button"
                  onClick={addBudgetItem}
                  className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {formData.budgetBreakdown.map((item, index) => (
                <div
                  key={index}
                  className="mb-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.item}
                      onChange={(e) => {
                        const updated = [...formData.budgetBreakdown];
                        updated[index].item = e.target.value;
                        setFormData({ ...formData, budgetBreakdown: updated });
                      }}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={item.amount}
                      onChange={(e) => {
                        const updated = [...formData.budgetBreakdown];
                        updated[index].amount = e.target.value;
                        setFormData({ ...formData, budgetBreakdown: updated });
                      }}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...formData.budgetBreakdown];
                        updated[index].description = e.target.value;
                        setFormData({ ...formData, budgetBreakdown: updated });
                      }}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  {formData.budgetBreakdown.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBudgetItem(index)}
                      className="mt-2 text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Document Upload */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Supporting Documents (Optional)
              </label>
              <div className="rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/50 p-6 text-center">
                <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-400">
                  Upload proposals, budgets, or supporting documents
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF, Images (Max 5MB each)
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 font-semibold text-white hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 font-semibold text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
