"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function AdminItemDonationsPage() {
  const router = useRouter();
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "info",
  });

  const showConfirm = (title, message, onConfirm, type = "info") => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
    });
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [activeFilter, donations]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/item-donations");
      if (res.ok) {
        const data = await res.json();
        setDonations(data.donations || []);
      } else {
        const data = await res.json();
        if (res.status === 403) {
          toast.error("Access denied. Admin only.");
          router.push("/");
        } else {
          toast.error(data.message || "Failed to fetch donations");
        }
      }
    } catch (err) {
      toast.error("Failed to fetch donations");
    } finally {
      setLoading(false);
    }
  };

  const filterDonations = () => {
    if (activeFilter === "all") {
      setFilteredDonations(donations);
    } else {
      setFilteredDonations(
        donations.filter((d) => d.adminStatus === activeFilter),
      );
    }
  };

  const handleApprove = async (donationId) => {
    showConfirm(
      "Approve Donation",
      "Are you sure you want to approve this donation? This action will notify the donor and make it available to NGOs.",
      async () => {
        setActionLoading(true);
        const loadingToast = toast.loading("Approving donation...");

        try {
          const res = await fetch(
            `/api/admin/item-donations/${donationId}/approve`,
            {
              method: "POST",
            },
          );

          const data = await res.json();

          if (res.ok) {
            toast.success("Donation approved successfully! 🎉", {
              id: loadingToast,
            });
            fetchDonations();
          } else {
            toast.error(data.message || "Failed to approve donation", {
              id: loadingToast,
            });
          }
        } catch (err) {
          toast.error("Failed to approve donation", {
            id: loadingToast,
          });
        } finally {
          setActionLoading(false);
        }
      },
      "success",
    );
  };

  const openRejectModal = (donation) => {
    setSelectedDonation(donation);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setActionLoading(true);
    const loadingToast = toast.loading("Rejecting donation...");

    try {
      const res = await fetch(
        `/api/admin/item-donations/${selectedDonation._id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectionReason }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Donation rejected successfully", {
          id: loadingToast,
        });
        setShowRejectModal(false);
        setSelectedDonation(null);
        setRejectionReason("");
        fetchDonations();
      } else {
        toast.error(data.message || "Failed to reject donation", {
          id: loadingToast,
        });
      }
    } catch (err) {
      toast.error("Failed to reject donation", {
        id: loadingToast,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: "⏳",
        text: "Pending Review",
      },
      approved: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "✅",
        text: "Approved",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: "❌",
        text: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.color}`}
      >
        <span className="mr-2">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const getFilterCount = (filter) => {
    if (filter === "all") return donations.length;
    return donations.filter((d) => d.adminStatus === filter).length;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-red-600"></div>
          <p className="text-gray-400">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Tabs */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-lg">
          <div className="border-b border-gray-700 bg-gray-800">
            <nav className="-mb-px flex overflow-x-auto">
              <button
                onClick={() => setActiveFilter("all")}
                className={`flex items-center gap-2 border-b-2 px-6 py-4 text-center text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === "all"
                    ? "border-blue-500 bg-gray-700 text-blue-400 shadow-sm"
                    : "border-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                <span>📋</span>
                All Donations
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeFilter === "all"
                      ? "bg-blue-900 text-blue-300"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {getFilterCount("all")}
                </span>
              </button>
              <button
                onClick={() => setActiveFilter("pending")}
                className={`flex items-center gap-2 border-b-2 px-6 py-4 text-center text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === "pending"
                    ? "border-yellow-500 bg-gray-700 text-yellow-400 shadow-sm"
                    : "border-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                <span>⏳</span>
                Pending
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeFilter === "pending"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {getFilterCount("pending")}
                </span>
              </button>
              <button
                onClick={() => setActiveFilter("approved")}
                className={`flex items-center gap-2 border-b-2 px-6 py-4 text-center text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === "approved"
                    ? "border-green-500 bg-gray-700 text-green-400 shadow-sm"
                    : "border-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                <span>✅</span>
                Approved
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeFilter === "approved"
                      ? "bg-green-900 text-green-300"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {getFilterCount("approved")}
                </span>
              </button>
              <button
                onClick={() => setActiveFilter("rejected")}
                className={`flex items-center gap-2 border-b-2 px-6 py-4 text-center text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === "rejected"
                    ? "border-red-500 bg-gray-700 text-red-400 shadow-sm"
                    : "border-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                <span>❌</span>
                Rejected
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeFilter === "rejected"
                      ? "bg-red-900 text-red-300"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {getFilterCount("rejected")}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Donations Grid */}
        {filteredDonations.length === 0 ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 p-12 text-center shadow-lg">
            <div className="mb-4 text-6xl">📦</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              No Donations Found
            </h3>
            <p className="text-gray-400">
              {activeFilter === "all"
                ? "There are no item donations yet."
                : `There are no ${activeFilter} item donations.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredDonations.map((donation) => (
              <div
                key={donation._id}
                className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-lg transition-shadow hover:shadow-xl"
              >
                {/* Donation Header */}
                <div className="border-b border-gray-600 bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {donation.category}
                      </h3>
                      <p className="mt-1 text-sm text-gray-400">
                        {new Date(donation.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                    {getStatusBadge(donation.adminStatus)}
                  </div>
                </div>

                {/* Donation Body */}
                <div className="p-6">
                  {/* Items List */}
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-semibold text-gray-300">
                      Items:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {donation.items.map((item, index) => (
                        <span
                          key={index}
                          className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  {donation.description && (
                    <div className="mb-4">
                      <p className="mb-1 text-sm font-semibold text-gray-300">
                        Description:
                      </p>
                      <p className="rounded-lg bg-gray-700 p-3 text-sm text-gray-400">
                        {donation.description}
                      </p>
                    </div>
                  )}

                  {/* Media - Images and Videos Combined */}
                  {((donation.images && donation.images.length > 0) ||
                    (donation.videos && donation.videos.length > 0)) && (
                    <div className="mb-4">
                      <p className="mb-2 text-sm font-semibold text-gray-300">
                        Media:
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {donation.images?.map((img, index) => (
                          <div key={`img-${index}`} className="group relative">
                            <img
                              src={img.url}
                              alt={`Item ${index + 1}`}
                              className="h-24 w-full cursor-pointer rounded-lg object-cover transition-transform hover:scale-105"
                              onClick={() => window.open(img.url, "_blank")}
                            />
                            <div className="bg-opacity-0 group-hover:bg-opacity-20 absolute inset-0 flex items-center justify-center rounded-lg bg-black transition-all">
                              <svg
                                className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                />
                              </svg>
                            </div>
                          </div>
                        ))}
                        {donation.videos?.map((video, index) => (
                          <video
                            key={`vid-${index}`}
                            src={video.url}
                            className="h-24 w-full rounded-lg bg-gray-900 object-cover"
                            controls
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Donor Information */}
                  <div className="mb-4 rounded-lg border border-gray-600 bg-gradient-to-r from-gray-700 to-gray-600 p-4">
                    <p className="mb-2 text-sm font-semibold text-gray-300">
                      Donor Information:
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-300">
                        <span className="font-medium">Name:</span>{" "}
                        {donation.donor?.userName} {donation.donor?.lastName}
                      </p>
                      <p className="text-sm text-gray-300">
                        <span className="font-medium">Email:</span>{" "}
                        {donation.donor?.email}
                      </p>
                      {donation.donor?.phone && (
                        <p className="text-sm text-gray-300">
                          <span className="font-medium">Phone:</span>{" "}
                          {donation.donor.phone}
                        </p>
                      )}
                      {donation.donor?.address && (
                        <p className="text-sm text-gray-300">
                          <span className="font-medium">Address:</span>{" "}
                          {donation.donor.address}, {donation.donor.city},{" "}
                          {donation.donor.state} - {donation.donor.pincode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pickup Location */}
                  {(donation.pickupAddress || donation.donor?.address) && (
                    <div className="mb-4 rounded-lg border border-blue-700 bg-blue-900/30 p-4">
                      <p className="mb-2 text-sm font-semibold text-blue-300">
                        📍 Pickup Location:
                      </p>
                      <p className="text-sm text-blue-200">
                        {donation.pickupAddress ||
                          `${donation.donor?.address}, ${donation.donor?.city}, ${donation.donor?.state} - ${donation.donor?.pincode}`}
                      </p>
                      {!donation.pickupAddress && donation.donor?.address && (
                        <p className="mt-1 text-xs text-blue-400 italic">
                          (Using donor's profile address - pickup address not
                          specified)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {donation.rejectionReason && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="mb-1 text-sm font-semibold text-red-800">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-700">
                        {donation.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {donation.adminStatus === "pending" && (
                    <div className="mt-4 flex gap-3 border-t border-gray-700 pt-4">
                      <button
                        onClick={() => handleApprove(donation._id)}
                        disabled={actionLoading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 font-semibold text-white transition-all hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(donation)}
                        disabled={actionLoading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-3 font-semibold text-white transition-all hover:from-red-600 hover:to-rose-700 disabled:opacity-50"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Reject
                      </button>
                    </div>
                  )}

                  {donation.adminStatus === "approved" && (
                    <div className="mt-4 border-t border-gray-700 pt-4">
                      <div className="rounded-lg border border-green-700 bg-green-900/30 p-3 text-center">
                        <p className="text-sm font-medium text-green-400">
                          ✓ This donation has been approved and is available for
                          NGOs
                        </p>
                      </div>
                    </div>
                  )}

                  {donation.adminStatus === "rejected" && (
                    <div className="mt-4 border-t border-gray-700 pt-4">
                      <div className="rounded-lg border border-red-700 bg-red-900/30 p-3 text-center">
                        <p className="text-sm font-medium text-red-400">
                          ✗ This donation has been rejected
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Reject Donation
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Please provide a reason for rejection
                </p>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="Explain why this donation is being rejected..."
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-3 font-semibold text-white transition-all hover:from-red-600 hover:to-rose-700 disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Reject Donation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirm}
        onConfirm={() => {
          if (confirmDialog.onConfirm) {
            confirmDialog.onConfirm();
          }
          closeConfirm();
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.type === "success" ? "Approve" : "Confirm"}
        confirmColor={
          confirmDialog.type === "success" ? "green-600" : "red-600"
        }
      />
    </div>
  );
}
