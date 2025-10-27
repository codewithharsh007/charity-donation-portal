"use client";

import { useState } from "react";
import { Upload, Plus, X, DollarSign, Calendar, Users } from "lucide-react";

export default function FundingRequestForm({
  onClose,
  onSuccess,
  currentTier,
}) {
  const [formData, setFormData] = useState({
    title: "",
    requestedAmount: "",
    purpose: "",
    description: "",
    beneficiaryCount: "",
    startDate: "",
    endDate: "",
    budgetBreakdown: [{ item: "", amount: "", description: "" }],
  });

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Max amounts based on tier
  const maxAmount = currentTier === 4 ? 50000 : currentTier === 3 ? 20000 : 0;

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // Upload documents first (if any)
    const uploadedDocs = await uploadDocuments();

    const requestData = {
      ...formData,
      documents: uploadedDocs,
      requestedAmount: parseFloat(formData.requestedAmount),
      beneficiaryCount: parseInt(formData.beneficiaryCount),
      // ✅ FIXED: Properly format timeline
      timeline: {
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      },
    };

    // Remove the individual date fields from the top level
    delete requestData.startDate;
    delete requestData.endDate;

    const userData = JSON.parse(localStorage.getItem('user'));
    const response = await fetch('/api/ngo/funding-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`,
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (response.ok) {
      onSuccess();
    } else {
      setError(data.message || 'Failed to submit request');
    }
  } catch (err) {
    console.error('Error:', err);
    setError('Failed to submit request');
  } finally {
    setLoading(false);
  }
};


  const uploadDocuments = async () => {
    // Implement your file upload logic here
    // Return array of {url, publicId, name, type}
    return [];
  };

  const addBudgetItem = () => {
    setFormData({
      ...formData,
      budgetBreakdown: [
        ...formData.budgetBreakdown,
        { item: "", amount: "", description: "" },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-gray-900 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Request Funding</h2>
            <p className="text-sm text-gray-400">
              Maximum: ₹{maxAmount.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-800"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500 bg-red-500/10 p-3 text-red-400">
            {error}
          </div>
        )}

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
                max={maxAmount}
                // value={formData.requestedAmount}
                onChange={(e) =>
                  setFormData({ ...formData, requestedAmount: e.target.value })
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="5000"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum: ₹{maxAmount.toLocaleString()} for{" "}
                {currentTier === 4 ? "Gold" : "Silver"} tier
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

          {/* Beneficiaries & Timeline */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                <Users className="mr-1 inline h-4 w-4" />
                Beneficiaries *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.beneficiaryCount}
                onChange={(e) =>
                  setFormData({ ...formData, beneficiaryCount: e.target.value })
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                <Calendar className="mr-1 inline h-4 w-4" />
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                <Calendar className="mr-1 inline h-4 w-4" />
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-red-500 focus:outline-none"
              />
            </div>
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
                className="mb-3 grid gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3 sm:grid-cols-3"
              >
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
              className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 font-semibold text-white hover:from-red-700 hover:to-red-800 disabled:opacity-50"
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
  );
}

