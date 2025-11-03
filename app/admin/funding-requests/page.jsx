"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  Package,
  Search,
  X,
  TrendingUp,
} from "lucide-react";

export default function AdminFundingRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionData, setActionData] = useState({
    approvedAmount: "",
    notes: "",
    rejectionReason: "",
  });
  const [poolBalance, setPoolBalance] = useState(0);
  const [financials, setFinancials] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const res = await fetch("/api/admin/financials", {
        headers: {
          Authorization: `Bearer ${userData.token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        const totalDonations = data.financials?.donations?.allTime || 0;
        const totalFunding = data.financials?.fundingRequests?.allTime || 0;
        setPoolBalance(totalDonations - totalFunding);
        setFinancials(data.financials);
      }
    } catch (err) {
      console.error("Error fetching financials:", err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem("user"));
      const res = await fetch("/api/admin/funding-requests", {
        headers: {
          Authorization: `Bearer ${userData.token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    // ✅ Validate pool balance for approvals
    if (actionType === "approve") {
      const approvedAmount = parseFloat(actionData.approvedAmount);

      if (isNaN(approvedAmount) || approvedAmount <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      if (approvedAmount > poolBalance) {
        alert(
          `Insufficient funds in donation pool!\n\n` +
            `Available: ₹${poolBalance.toLocaleString()}\n` +
            `Requested: ₹${approvedAmount.toLocaleString()}\n\n` +
            `Please approve a lower amount or wait for more donations.`,
        );
        return;
      }
    }

    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const endpoint =
        actionType === "approve"
          ? `/api/admin/funding-requests/${selectedRequest._id}/approve`
          : `/api/admin/funding-requests/${selectedRequest._id}/reject`;

      const body =
        actionType === "approve"
          ? {
              approvedAmount: parseFloat(actionData.approvedAmount),
              adminNotes: actionData.notes,
            }
          : {
              rejectionReason: actionData.rejectionReason,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData.token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert(
          actionType === "approve"
            ? "Funding request approved successfully!"
            : "Funding request rejected",
        );
        fetchRequests();
        fetchFinancials(); // ✅ Refresh pool balance
        setShowActionModal(false);
        setActionData({ approvedAmount: "", notes: "", rejectionReason: "" });
        setSelectedRequest(null);
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Action failed");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("An error occurred. Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        label: "Pending",
      },
      under_review: {
        bg: "bg-blue-500/20",
        text: "text-blue-400",
        label: "Under Review",
      },
      approved: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        label: "Approved",
      },
      rejected: {
        bg: "bg-red-500/20",
        text: "text-red-400",
        label: "Rejected",
      },
      completed: {
        bg: "bg-purple-500/20",
        text: "text-purple-400",
        label: "Completed",
      },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const filteredRequests = requests.filter((req) => {
    const matchesFilter = filter === "all" || req.adminStatus === filter;
    const matchesSearch =
      req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.adminStatus === "pending").length,
    approved: requests.filter((r) => r.adminStatus === "approved").length,
    rejected: requests.filter((r) => r.adminStatus === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-red-500"></div>
          <p className="text-gray-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Funding Requests</h1>
          <p className="text-gray-400">
            Review and manage NGO funding requests
          </p>
        </div>

        {/* ✅ Pool Balance Alert */}
        <div className="mb-6 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-600/20 p-3">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-300">
                  Available Donation Pool Balance
                </p>
                <p className="mt-1 text-3xl font-bold text-white">
                  ₹{poolBalance.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total Donations</p>
              <p className="font-semibold text-green-400">
                ₹{(financials?.donations?.allTime || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-xs text-gray-400">Total Allocated</p>
              <p className="font-semibold text-orange-400">
                ₹
                {(financials?.fundingRequests?.allTime || 0).toLocaleString(
                  "en-IN",
                )}
              </p>
            </div>
          </div>
          {poolBalance < 10000 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <p className="text-sm text-yellow-300">
                Low balance! Consider waiting for more donations before
                approving large requests.
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Requests",
              value: stats.total,
              icon: DollarSign,
              color: "blue",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: Clock,
              color: "yellow",
            },
            {
              label: "Approved",
              value: stats.approved,
              icon: CheckCircle,
              color: "green",
            },
            {
              label: "Rejected",
              value: stats.rejected,
              icon: XCircle,
              color: "red",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-700 bg-gray-800/50 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-lg bg-${stat.color}-500/10 p-3`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "under_review", label: "Under Review" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f.id
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pr-4 pl-10 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none sm:w-64"
            />
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800/50 py-20 text-center">
            <DollarSign className="mx-auto mb-4 h-16 w-16 text-gray-500" />
            <h3 className="mb-2 text-lg font-semibold text-white">
              No requests found
            </h3>
            <p className="text-gray-400">
              No funding requests match your current filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                className="rounded-xl border border-gray-700 bg-gray-800/50 p-6 transition-all hover:border-gray-600"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">
                        {request.title}
                      </h3>
                      {getStatusBadge(request.adminStatus)}
                    </div>

                    <p className="mb-4 text-gray-400">
                      {request.description.substring(0, 200)}...
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <span className="text-gray-300">
                          ₹{request.requestedAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300 capitalize">
                          {request.purpose}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-300">
                          {request.beneficiaryCount} beneficiaries
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 lg:flex-col">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailModal(true);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>

                    {request.adminStatus === "pending" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType("approve");
                            setActionData({
                              ...actionData,
                              approvedAmount:
                                request.requestedAmount.toString(),
                            });
                            setShowActionModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType("reject");
                            setShowActionModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="scrollbar-hide max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900">
            <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-800/95 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedRequest.title}
                  </h2>
                  <div className="mt-1">
                    {getStatusBadge(selectedRequest.adminStatus)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="mb-1 text-sm text-gray-400">
                    Requested Amount
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    ₹{selectedRequest.requestedAmount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="mb-1 text-sm text-gray-400">Purpose</div>
                  <p className="text-xl font-semibold text-white capitalize">
                    {selectedRequest.purpose}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-400">
                  Description
                </h3>
                <p className="overflow-hidden wrap-break-word whitespace-pre-wrap text-gray-300">
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.budgetBreakdown &&
                selectedRequest.budgetBreakdown.length > 0 && (
                  <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                    <h3 className="mb-3 text-sm font-medium text-gray-400">
                      Budget Breakdown
                    </h3>
                    <div className="space-y-2">
                      {selectedRequest.budgetBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/50 p-3"
                        >
                          <div>
                            <p className="font-medium text-white">
                              {item.item}
                            </p>
                            {item.description && (
                              <p className="text-sm text-gray-400">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold text-green-400">
                            ₹{Number(item.amount || 0).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Submitted On */}
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                <h3 className="mb-1 text-sm font-medium text-gray-400">
                  Submitted On
                </h3>
                <p className="text-white">
                  {new Date(selectedRequest.createdAt).toLocaleString("en-IN", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              {/* Approved Amount */}
              {selectedRequest.adminStatus === "approved" &&
                selectedRequest.approvedAmount > 0 && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <h3 className="text-lg font-semibold text-green-400">
                        Approved Amount
                      </h3>
                    </div>

                    <p className="mb-4 text-4xl font-bold text-green-400">
                      ₹{selectedRequest.approvedAmount.toLocaleString("en-IN")}
                    </p>

                    {selectedRequest.adminNotes && (
                      <div className="mb-3 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                        <p className="mb-1 text-xs font-medium text-green-400">
                          Admin Notes:
                        </p>
                        <p className="text-sm text-gray-300">
                          {selectedRequest.adminNotes}
                        </p>
                      </div>
                    )}

                    {selectedRequest.adminReviewedAt && (
                      <p className="text-xs text-green-300">
                        Approved on{" "}
                        {new Date(
                          selectedRequest.adminReviewedAt,
                        ).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                )}

              {/* Rejection Reason */}
              {selectedRequest.adminStatus === "rejected" &&
                selectedRequest.rejectionReason && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-400" />
                      <h3 className="text-lg font-semibold text-red-400">
                        Rejection Reason
                      </h3>
                    </div>
                    <p className="text-gray-300">
                      {selectedRequest.rejectionReason}
                    </p>
                    {selectedRequest.adminReviewedAt && (
                      <p className="mt-3 text-xs text-red-300">
                        Rejected on{" "}
                        {new Date(
                          selectedRequest.adminReviewedAt,
                        ).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </h3>

            {actionType === "approve" ? (
              <div className="space-y-4">
                {/* ✅ Pool Balance Warning */}
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                    <p className="text-sm font-semibold text-blue-300">
                      Available Pool Balance
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ₹{poolBalance.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Maximum amount you can approve from the donation pool
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Approved Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={actionData.approvedAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setActionData({ ...actionData, approvedAmount: value });
                    }}
                    max={poolBalance}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                  {parseFloat(actionData.approvedAmount) > poolBalance && (
                    <p className="mt-2 text-xs text-red-400">
                      ⚠️ Exceeds available pool balance!
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={actionData.notes}
                    onChange={(e) =>
                      setActionData({ ...actionData, notes: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Rejection Reason *
                </label>
                <textarea
                  rows={4}
                  required
                  value={actionData.rejectionReason}
                  onChange={(e) =>
                    setActionData({
                      ...actionData,
                      rejectionReason: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                />
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setActionData({
                    approvedAmount: "",
                    notes: "",
                    rejectionReason: "",
                  });
                }}
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 font-semibold text-gray-300 transition-colors hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={
                  actionType === "approve" &&
                  (parseFloat(actionData.approvedAmount) > poolBalance ||
                    !actionData.approvedAmount)
                }
                className={`flex-1 rounded-lg px-4 py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
