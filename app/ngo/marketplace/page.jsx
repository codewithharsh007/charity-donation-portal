"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; // ✅ Import react-hot-toast
import {
  Package,
  MapPin,
  Phone,
  User,
  CheckCircle,
  TruckIcon,
  Box,
} from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function NGOMarketplacePage() {
  const router = useRouter();
  const [donations, setDonations] = useState([]);
  const [acceptedDonations, setAcceptedDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    donationId: null,
  });

  const categories = [
    "all",
    "Food Items",
    "Clothes",
    "Books & Stationery",
    "Toys",
    "Medicines & Health Kits",
    "Electronics",
    "Household Items",
    "Bicycle / Vehicle",
    "Festival Kit / Hygiene Pack",
    "Other",
  ];

  useEffect(() => {
    // Check if user is NGO and verified
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "ngo") {
      toast.error("Access denied. NGO only.");
      router.push("/");
      return;
    }

    // Check if NGO is verified
    if (!user.isVerified) {
      toast.error(
        "Access denied. Only verified NGOs can access the marketplace.",
      );
      router.push("/ngo/dashboard");
      return;
    }

    fetchDonations();
  }, [router, activeTab]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      if (activeTab === "available") {
        const res = await fetch(
          "/api/donations/items?type=ngo&filter=available",
        );
        if (res.ok) {
          const data = await res.json();
          setDonations(data.donations || []);
        } else {
          toast.error("Failed to fetch available donations");
        }
      } else {
        const res = await fetch(
          "/api/donations/items?type=ngo&filter=accepted",
        );
        if (res.ok) {
          const data = await res.json();
          setAcceptedDonations(data.donations || []);
        } else {
          toast.error("Failed to fetch accepted donations");
        }
      }
    } catch (err) {
      toast.error("Failed to fetch donations");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDonation = async (donationId) => {
    const loadingToast = toast.loading("Accepting donation...");

    try {
      const res = await fetch(`/api/donations/items/${donationId}/accept`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          "Donation accepted successfully! Check your email for donor details. 📧",
          {
            id: loadingToast,
            duration: 4000,
          },
        );
        fetchDonations();
      } else {
        toast.error(data.message || "Failed to accept donation", {
          id: loadingToast,
        });
      }
    } catch (err) {
      toast.error("Failed to accept donation", {
        id: loadingToast,
      });
    }
  };

  const openAcceptConfirm = (donationId) => {
    setConfirmDialog({
      isOpen: true,
      donationId,
    });
  };

  const closeConfirm = () => {
    setConfirmDialog({
      isOpen: false,
      donationId: null,
    });
  };

  const handleUpdateStatus = async (donationId, newStatus) => {
    const statusText = newStatus.replace("_", " ");
    const loadingToast = toast.loading(`Updating status to ${statusText}...`);

    try {
      const res = await fetch(`/api/donations/items/${donationId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Status updated to ${statusText}! ✓`, {
          id: loadingToast,
        });
        fetchDonations();
      } else {
        toast.error(data.message || "Failed to update status", {
          id: loadingToast,
        });
      }
    } catch (err) {
      toast.error("Failed to update status", {
        id: loadingToast,
      });
    }
  };

  const filteredDonations = donations.filter(
    (d) => selectedCategory === "all" || d.category === selectedCategory,
  );

  const filteredAcceptedDonations = acceptedDonations.filter(
    (d) => selectedCategory === "all" || d.category === selectedCategory,
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // Error handled silently
    }
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 shadow-lg backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <Package className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white md:text-2xl">
                  NGO Marketplace
                </h1>
                <p className="text-xs text-gray-400 md:text-sm">
                  Browse and accept item donations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Home
              </button>
              <button
                onClick={() => router.push("/ngo/dashboard")}
                className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setActiveTab("available")}
            className={`rounded-xl px-6 py-3 font-semibold transition-all ${
              activeTab === "available"
                ? "bg-red-600 text-white shadow-lg"
                : "border border-gray-700 bg-[#1e293b] text-gray-300 hover:bg-gray-800"
            }`}
          >
            Available Donations
          </button>
          <button
            onClick={() => setActiveTab("accepted")}
            className={`rounded-xl px-6 py-3 font-semibold transition-all ${
              activeTab === "accepted"
                ? "bg-red-600 text-white shadow-lg"
                : "border border-gray-700 bg-[#1e293b] text-gray-300 hover:bg-gray-800"
            }`}
          >
            My Accepted Donations
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-6 rounded-xl border border-gray-700/50 bg-[#1e293b] p-5">
          <label className="mb-3 block text-sm font-semibold text-white">
            Filter by Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-red-600 text-white"
                    : "border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Available Donations Tab */}
        {activeTab === "available" && (
          <div>
            {loading ? (
              <div className="py-12 text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-red-500"></div>
                <p className="mt-4 text-gray-400">Loading donations...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="rounded-2xl border border-gray-700/50 bg-[#1e293b] py-16 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-700/50">
                  <Package className="h-12 w-12 text-gray-500" />
                </div>
                <p className="text-lg font-semibold text-gray-300">
                  No available donations
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Check back later for new items
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDonations.map((donation) => (
                  <div
                    key={donation._id}
                    className="overflow-hidden rounded-2xl border border-gray-700/50 bg-[#1e293b] transition-all hover:border-red-500/50 hover:shadow-lg"
                  >
                    {/* Images */}
                    {donation.images && donation.images.length > 0 && (
                      <div className="relative h-48 bg-gray-900">
                        <img
                          src={donation.images[0].url}
                          alt="Donation"
                          className="h-full w-full object-cover"
                        />
                        {donation.images.length > 1 && (
                          <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs text-white">
                            <Box className="h-3 w-3" />+
                            {donation.images.length - 1}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5">
                      {/* Category Badge */}
                      <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400">
                        <Package className="h-3.5 w-3.5" />
                        {donation.category}
                      </div>

                      {/* Items List */}
                      <div className="mb-4">
                        <h3 className="mb-2 text-sm font-semibold text-white">
                          Items:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {donation.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-300"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      {donation.description && (
                        <p className="mb-4 line-clamp-2 text-sm text-gray-400">
                          {donation.description}
                        </p>
                      )}

                      {/* Donor Info */}
                      <div className="mb-4 border-t border-gray-700 pt-3">
                        <div className="mb-1 flex items-center gap-2 text-xs text-gray-400">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-gray-500">Pickup Location</span>
                        </div>
                        <p className="text-sm font-medium text-gray-300">
                          {donation.donor?.city || "Not specified"},{" "}
                          {donation.donor?.state || "N/A"}
                        </p>
                      </div>

                      {/* Videos Badge */}
                      {donation.videos && donation.videos.length > 0 && (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-400">
                            🎥 {donation.videos.length} video
                            {donation.videos.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {/* Accept Button */}
                      <button
                        onClick={() => openAcceptConfirm(donation._id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept Donation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accepted Donations Tab */}
        {activeTab === "accepted" && (
          <div>
            {loading ? (
              <div className="py-12 text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-red-500"></div>
                <p className="mt-4 text-gray-400">Loading your donations...</p>
              </div>
            ) : filteredAcceptedDonations.length === 0 ? (
              <div className="rounded-2xl border border-gray-700/50 bg-[#1e293b] py-16 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-700/50">
                  <Package className="h-12 w-12 text-gray-500" />
                </div>
                <p className="text-lg font-semibold text-gray-300">
                  No accepted donations yet
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Accept donations from the available tab
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredAcceptedDonations.map((donation) => (
                  <div
                    key={donation._id}
                    className="overflow-hidden rounded-2xl border border-gray-700/50 bg-[#1e293b] transition-all hover:border-gray-600"
                  >
                    <div className="p-6">
                      <div className="flex flex-col gap-6 lg:flex-row">
                        {/* Media Section */}
                        {((donation.images && donation.images.length > 0) ||
                          (donation.videos && donation.videos.length > 0)) && (
                          <div className="lg:w-1/3">
                            <div className="grid grid-cols-2 gap-2">
                              {donation.images?.slice(0, 2).map((img, idx) => (
                                <img
                                  key={`img-${idx}`}
                                  src={img.url}
                                  alt={`Item ${idx + 1}`}
                                  className="h-32 w-full rounded-lg border border-gray-700 object-cover"
                                />
                              ))}
                              {donation.videos
                                ?.slice(0, 2)
                                .map((video, idx) => (
                                  <video
                                    key={`vid-${idx}`}
                                    src={video.url}
                                    controls
                                    className="h-32 w-full rounded-lg border border-gray-700 bg-gray-900 object-cover"
                                  />
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Details Section */}
                        <div
                          className={
                            (donation.images && donation.images.length > 0) ||
                            (donation.videos && donation.videos.length > 0)
                              ? "lg:w-2/3"
                              : "w-full"
                          }
                        >
                          <div className="mb-4 flex items-start justify-between">
                            <div>
                              <span className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-400">
                                <Package className="h-3.5 w-3.5" />
                                {donation.category}
                              </span>
                              <h3 className="mt-2 text-lg font-bold text-white">
                                {donation.items.join(", ")}
                              </h3>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                  donation.deliveryStatus === "received"
                                    ? "border border-green-500/20 bg-green-500/10 text-green-400"
                                    : donation.deliveryStatus === "picked_up"
                                      ? "border border-blue-500/20 bg-blue-500/10 text-blue-400"
                                      : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                                }`}
                              >
                                {donation.deliveryStatus === "received" && (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                {donation.deliveryStatus === "picked_up" && (
                                  <TruckIcon className="h-3.5 w-3.5" />
                                )}
                                {donation.deliveryStatus
                                  ?.replace("_", " ")
                                  .toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          {donation.description && (
                            <p className="mb-4 text-sm text-gray-400">
                              {donation.description}
                            </p>
                          )}

                          {/* Donor Details */}
                          <div className="mb-4 rounded-xl border border-gray-700/50 bg-[#2d3748] p-4">
                            <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
                              <MapPin className="h-4 w-4 text-red-400" />
                              Pickup Details
                            </h4>
                            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                              <div>
                                <div className="mb-1 flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-gray-500" />
                                  <p className="text-xs text-gray-500">
                                    Donor Name
                                  </p>
                                </div>
                                <p className="font-medium text-gray-300">
                                  {donation.donor?.userName || "N/A"}
                                </p>
                              </div>
                              <div>
                                <div className="mb-1 flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5 text-gray-500" />
                                  <p className="text-xs text-gray-500">Phone</p>
                                </div>
                                <p className="font-medium text-gray-300">
                                  {donation.pickupPhone || "N/A"}
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <div className="mb-1 flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-gray-500" />
                                  <p className="text-xs text-gray-500">
                                    Pickup Address
                                  </p>
                                </div>
                                <p className="font-medium text-gray-300">
                                  {donation.pickupAddress || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Status Update Buttons */}
                          <div className="flex gap-3">
                            {donation.deliveryStatus === "not_picked_up" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(donation._id, "picked_up")
                                }
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                              >
                                <TruckIcon className="h-4 w-4" />
                                Mark as Picked Up
                              </button>
                            )}
                            {donation.deliveryStatus === "picked_up" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(donation._id, "received")
                                }
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Mark as Received
                              </button>
                            )}
                            {donation.deliveryStatus === "received" && (
                              <div className="flex items-center font-medium text-green-400">
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Completed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirm}
        onConfirm={() => {
          handleAcceptDonation(confirmDialog.donationId);
          closeConfirm();
        }}
        title="Accept Donation"
        message="Are you sure you want to accept this donation? You will be responsible for picking up the items from the donor."
        confirmText="Accept"
        confirmColor="green-600"
      />
    </div>
  );
}
