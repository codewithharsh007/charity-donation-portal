"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Plus,
  Eye,
  Trash2,
  Calendar,
  Users,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Crown,
  Lock,
  TrendingUp,
  Home,
  ShieldCheck,
  Info,
  X,
  Menu,
} from "lucide-react";
import FundingRequestForm from "./FundingRequestForm";

export default function FundingRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [monthlyFundingReceived, setMonthlyFundingReceived] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [remainingMonthlyAllocation, setRemainingMonthlyAllocation] =
    useState(0);
  const [fundingLoading, setFundingLoading] = useState(false);

  // Subscription & Verification
  const [currentTier, setCurrentTier] = useState(null);
  const [tierName, setTierName] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [ngoProfile, setNgoProfile] = useState(null);
  const [canCreateNew, setCanCreateNew] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Check for both "verified" AND "accepted"
    if (
      !loading &&
      (verificationStatus === "verified" ||
        verificationStatus === "accepted") &&
      currentTier >= 3
    ) {
      fetchRequests();
    }
  }, [filter, loading, verificationStatus, currentTier]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem("user"));

      if (!userData?.token) {
        console.log("❌ No token found, redirecting to login");
        router.push("/login");
        return;
      }

      console.log("🔑 Token found, fetching data...");

      const headers = { Authorization: `Bearer ${userData.token}` };

      const [subRes, verifyRes] = await Promise.all([
        fetch("/api/subscriptions/current", { headers }),
        fetch("/api/ngo/verification", { headers }),
      ]);

      const subscriptionData = await subRes.json();
      const verifyData = await verifyRes.json();

      console.log("📦 Subscription:", subscriptionData);
      console.log("📦 Verification:", verifyData);

      // Set subscription
      if (subscriptionData.success && subscriptionData.data) {
        const tier = subscriptionData.data.currentTier || 1;
        const name = subscriptionData.data.tierName || "FREE";
        setCurrentTier(tier);
        setTierName(name);

        // Set monthly limit based on tier
        const limit = getMonthlyLimit(tier);
        setMonthlyLimit(limit);

        console.log(
          `✅ Set Tier: ${name} (${tier}) - Monthly Limit: ₹${limit.toLocaleString()}`,
        );
      } else {
        setCurrentTier(1);
        setTierName("FREE");
        setMonthlyLimit(0);
      }

      // Set verification - ACCEPT BOTH "verified" AND "accepted"
      if (verifyData.success && verifyData.verification) {
        const status = verifyData.verification.verificationStatus || "pending";
        setVerificationStatus(status);
        console.log(`✅ Set Status: ${status}`);
      } else {
        setVerificationStatus("pending");
      }

      // Check for BOTH "verified" AND "accepted"
      const status = verifyData.verification?.verificationStatus;
      const isVerified = status === "verified" || status === "accepted";
      const tier = subscriptionData.data?.currentTier || 1;

      console.log(
        `🎯 Final: Status="${status}", isVerified=${isVerified}, Tier=${tier}`,
      );

      if (isVerified && tier >= 3) {
        console.log("✅ ACCESS GRANTED!");
      } else {
        console.log(
          `❌ Access denied - isVerified: ${isVerified}, tier: ${tier}`,
        );
      }
    } catch (err) {
      console.error("❌ Error loading data:", err);
      setCurrentTier(1);
      setTierName("FREE");
      setVerificationStatus("pending");
      setMonthlyLimit(0);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyLimit = (tier) => {
    if (tier === 4) return 50000; 
    if (tier === 3) return 20000; 
    return 0;
  };

  const calculateMonthlyFunding = (allRequests) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Sum up approved amounts for this month
    const thisMonthApproved = allRequests
      .filter((r) => {
        if (r.adminStatus !== "approved" || !r.approvedAmount) return false;

        // Check if approved this month
        const approvedDate = r.adminReviewedAt
          ? new Date(r.adminReviewedAt)
          : new Date(r.createdAt);
        return (
          approvedDate.getMonth() === currentMonth &&
          approvedDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, r) => sum + (r.approvedAmount || 0), 0);

    return thisMonthApproved;
  };

  const fetchRequests = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const res = await fetch("/api/ngo/funding-requests", {
        headers: {
          Authorization: `Bearer ${userData.token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        let filtered = data.requests || [];

        if (filter !== "all") {
          filtered = filtered.filter((r) => r.adminStatus === filter);
        }

        setRequests(filtered);

        // Calculate monthly funding received
        const monthlyReceived = calculateMonthlyFunding(data.requests || []);
        setMonthlyFundingReceived(monthlyReceived);

        // Calculate remaining allocation
        const remaining = monthlyLimit - monthlyReceived;
        setRemainingMonthlyAllocation(remaining > 0 ? remaining : 0);

        console.log(
          `💰 Monthly Received: ₹${monthlyReceived.toLocaleString()}, Remaining: ₹${remaining.toLocaleString()}`,
        );

        checkCanCreateNew(data.requests || []);
      }
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
    }
  };

  const checkCanCreateNew = (allRequests) => {
    const activeRequest = allRequests.find(
      (r) => r.adminStatus === "pending" || r.adminStatus === "under_review",
    );

    if (activeRequest) {
      setCanCreateNew(false);
      setBlockReason(
        "You have a pending funding request. Wait for admin decision on your current request before creating a new one.",
      );
      return;
    }

    const monthlyReceived = calculateMonthlyFunding(allRequests);

    if (monthlyReceived >= monthlyLimit) {
      setCanCreateNew(false);
      setBlockReason(
        `You have reached your monthly funding limit of ₹${monthlyLimit.toLocaleString()}. ` +
          `You've received ₹${monthlyReceived.toLocaleString()} this month. ` +
          `Your limit will reset on the 1st of next month.`,
      );
      return;
    }

    setCanCreateNew(true);
    setBlockReason("");
  };

  const handleDelete = async () => {
    if (!requestToDelete) return;

    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(`/api/ngo/funding-requests/${requestToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userData.token}`,
        },
      });

      if (res.ok) {
        fetchRequests();
        setShowDeleteConfirm(false);
        setRequestToDelete(null);
      }
    } catch (err) {
      console.error("Error deleting request:", err);
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
        {status === "approved" && <CheckCircle className="h-3 w-3" />}
        {status === "rejected" && <XCircle className="h-3 w-3" />}
        {status === "under_review" && <Clock className="h-3 w-3" />}
        {badge.label}
      </span>
    );
  };

  const getMaxAmount = () => {
    if (currentTier === 4) return 50000; 
    if (currentTier === 3) return 20000; 
    return 0;
  };

  // Loading State
  if (loading || currentTier === null || verificationStatus === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-500"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Accept both "verified" AND "accepted"
  const isVerified =
    verificationStatus === "verified" || verificationStatus === "accepted";

  // Access Check - Show Upgrade Prompt
  if (!isVerified || currentTier < 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-700/50 bg-[#1a2332] backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Title */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white sm:text-xl">
                    Funding Requests
                  </h1>
                  <p className="hidden text-xs text-gray-400 sm:block">
                    {tierName} Tier • Monthly Limit: ₹
                    {monthlyLimit.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Right: Desktop & Mobile */}
              <div className="flex items-center gap-3">
                {/* Desktop Buttons */}
                <button
                  onClick={() => router.push("/")}
                  className="hidden items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-700/50 sm:flex"
                >
                  <Home className="h-4 w-4" />
                  Home
                </button>

                <button
                  onClick={() => router.push("/ngo/dashboard")}
                  className="hidden rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 sm:block"
                >
                  Dashboard
                </button>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700 sm:hidden"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="mt-4 space-y-2 border-t border-gray-700 pt-4 sm:hidden">
                <p className="mb-2 text-xs text-gray-400">
                  {tierName} Tier • Monthly Limit: ₹
                  {monthlyLimit.toLocaleString()}
                </p>

                <button
                  onClick={() => {
                    router.push("/");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-gray-700"
                >
                  <Home className="h-4 w-4" />
                  Home
                </button>
                <button
                  onClick={() => {
                    router.push("/ngo/dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Dashboard
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ✅ NEW: Monthly Funding Limit Banner */}
        <div className="mb-6 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-300">
                Monthly Funding Allocation
              </p>
              <p className="mt-1 text-xs text-gray-400">
                You can make multiple requests per month until you reach your
                limit
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Monthly Limit</p>
              <p className="text-2xl font-bold text-white">
                ₹{monthlyLimit.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Approved This Month</span>
              <span className="font-semibold text-green-400">
                ₹{monthlyFundingReceived.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Remaining Allocation</span>
              <span
                className={`font-semibold ${remainingMonthlyAllocation > 0 ? "text-blue-400" : "text-red-400"}`}
              >
                ₹{remainingMonthlyAllocation.toLocaleString()}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className={`h-full transition-all duration-500 ${
                  monthlyFundingReceived >= monthlyLimit
                    ? "bg-red-500"
                    : monthlyFundingReceived > monthlyLimit * 0.7
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min((monthlyFundingReceived / monthlyLimit) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-center text-xs text-gray-500">
              {Math.round((monthlyFundingReceived / monthlyLimit) * 100)}% of
              monthly limit used
            </p>

            {/* ✅ NEW: Info message */}
            {remainingMonthlyAllocation > 0 ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-500/10 p-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <p className="text-xs text-blue-300">
                  You can submit multiple funding requests this month until you
                  reach ₹{monthlyLimit.toLocaleString()}. Currently, you have ₹
                  {remainingMonthlyAllocation.toLocaleString()} remaining.
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                <p className="text-xs text-red-300">
                  Monthly limit reached! You cannot submit new requests until
                  the 1st of next month.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Content */}
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20">
                <Lock className="h-10 w-10 text-amber-400" />
              </div>

              <h1 className="mb-3 text-3xl font-bold text-white">
                {!isVerified ? "Verification Required" : "Premium Feature"}
              </h1>

              <p className="mb-6 text-gray-400">
                {!isVerified
                  ? "Complete your NGO verification to access funding requests."
                  : "Upgrade to Silver or Gold tier to request financial support for your projects."}
              </p>

              {!isVerified ? (
                <button
                  onClick={() => router.push("/ngo/dashboard")}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-purple-700"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Complete Verification
                </button>
              ) : (
                <div>
                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-6">
                      <div className="mb-3 flex items-center justify-center">
                        <div className="rounded-lg bg-gray-700 p-3">
                          <TrendingUp className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                      <h3 className="mb-2 font-semibold text-white">
                        Silver Tier
                      </h3>
                      <p className="mb-3 text-2xl font-bold text-white">
                        ₹20,000
                      </p>
                      <p className="text-sm text-gray-400">
                        Monthly funding limit
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6">
                      <div className="mb-3 flex items-center justify-center">
                        <div className="rounded-lg bg-amber-500/20 p-3">
                          <Crown className="h-6 w-6 text-amber-400" />
                        </div>
                      </div>
                      <h3 className="mb-2 font-semibold text-white">
                        Gold Tier
                      </h3>
                      <p className="mb-3 text-2xl font-bold text-white">
                        ₹50,000
                      </p>
                      <p className="text-sm text-gray-400">
                        Monthly funding limit
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push("/ngo/subscription/plans")}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-pink-700"
                  >
                    <Crown className="h-5 w-5" />
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* ✅ FIXED: Marketplace-Style Header with Mobile Menu */}
      <header className="sticky top-0 z-40 border-b border-gray-700/50 bg-[#1a2332] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white sm:text-xl">
                  Funding Requests
                </h1>
                <p className="hidden text-xs text-gray-400 sm:block">
                  {tierName} Tier • Max: ₹{getMaxAmount().toLocaleString()}
                </p>
              </div>
            </div>

            {/* Right: Desktop & Mobile */}
            <div className="flex items-center gap-3">
              {/* Desktop Buttons */}
              <button
                onClick={() => router.push("/")}
                className="hidden items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-700/50 sm:flex"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => router.push("/ngo/dashboard")}
                className="hidden items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-700/50 sm:flex"
              >
                Dashboard
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700 sm:hidden"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="mt-4 space-y-2 border-t border-gray-700 pt-4 sm:hidden">
              <p className="mb-2 text-xs text-gray-400">
                {tierName} Tier • Max: ₹{getMaxAmount().toLocaleString()}
              </p>
              <button
                onClick={() => {
                  router.push("/");
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-gray-700"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => {
                  router.push("/ngo/dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-gray-700"
              >
                Dashboard
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Create Button & Info */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Requests</h2>
            <p className="text-sm text-gray-400">
              Manage your funding requests
            </p>
          </div>

          {canCreateNew ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              <Plus className="h-5 w-5" />
              Create New Request
            </button>
          ) : (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-3">
                <Lock className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-400" />
                <div>
                  <p className="font-semibold text-yellow-300">
                    {monthlyFundingReceived >= monthlyLimit
                      ? "Monthly Limit Reached"
                      : "Request Pending"}
                  </p>
                  <p className="mt-1 text-sm text-gray-300">{blockReason}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total",
              value: requests.length,
              icon: DollarSign,
              color: "bg-blue-500/10 text-blue-400",
            },
            {
              label: "Pending",
              value: requests.filter((r) => r.adminStatus === "pending").length,
              icon: Clock,
              color: "bg-yellow-500/10 text-yellow-400",
            },
            {
              label: "Approved",
              value: requests.filter((r) => r.adminStatus === "approved")
                .length,
              icon: CheckCircle,
              color: "bg-green-500/10 text-green-400",
            },
            {
              label: "Rejected",
              value: requests.filter((r) => r.adminStatus === "rejected")
                .length,
              icon: XCircle,
              color: "bg-red-500/10 text-red-400",
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
                <div className={`rounded-lg ${stat.color} p-3`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
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
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800/50 py-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-700/50">
              <DollarSign className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              {filter === "all" ? "No requests yet" : `No ${filter} requests`}
            </h3>
            <p className="mb-4 text-gray-400">
              {canCreateNew
                ? "Create your first funding request to get started."
                : "You cannot create new requests at this time."}
            </p>
            {canCreateNew && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
              >
                <Plus className="h-5 w-5" />
                Create Request
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request._id}
                className="rounded-xl border border-gray-700 bg-gray-800/50 p-6 transition-all hover:border-gray-600"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

                    {/* Approved Amount */}
                    {request.approvedAmount > 0 && (
                      <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            Approved Amount:
                          </span>
                          <span className="text-lg font-bold text-green-400">
                            ₹{request.approvedAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {request.adminStatus === "rejected" &&
                      request.rejectionReason && (
                        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                            <div>
                              <p className="text-sm font-medium text-red-400">
                                Rejection Reason:
                              </p>
                              <p className="mt-1 text-sm text-gray-300">
                                {request.rejectionReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 sm:flex-col">
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
                      <button
                        onClick={() => {
                          setRequestToDelete(request._id);
                          setShowDeleteConfirm(true);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <FundingRequestForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchRequests}
          currentTier={currentTier}
          remainingMonthlyAllocation={remainingMonthlyAllocation}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900">
            {/* Modal Header */}
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

            {/* Modal Body */}
            <div className="space-y-6 p-6">
              {/* Amount & Purpose */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
                    <DollarSign className="h-4 w-4" />
                    Requested Amount
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    ₹{selectedRequest.requestedAmount.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
                    <Package className="h-4 w-4" />
                    Purpose
                  </div>
                  <p className="text-xl font-semibold text-white capitalize">
                    {selectedRequest.purpose}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-400">
                  Description
                </h3>
                <p className="whitespace-pre-wrap text-gray-300">
                  {selectedRequest.description}
                </p>
              </div>

              {/* Beneficiaries & Timeline */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
                    <Users className="h-4 w-4" />
                    Beneficiaries
                  </div>
                  <p className="text-xl font-semibold text-white">
                    {selectedRequest.beneficiaryCount}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </div>
                  <p className="text-sm font-medium text-white">
                    {selectedRequest.timeline?.startDate &&
                    selectedRequest.timeline.startDate !== ""
                      ? new Date(
                          selectedRequest.timeline.startDate,
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Not specified"}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </div>
                  <p className="text-sm font-medium text-white">
                    {selectedRequest.timeline?.endDate &&
                    selectedRequest.timeline.endDate !== ""
                      ? new Date(
                          selectedRequest.timeline.endDate,
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Not specified"}
                  </p>
                </div>
              </div>

              {/* Budget Breakdown */}
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
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {item.item}
                            </p>
                            {item.description && (
                              <p className="text-sm text-gray-400">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <p className="ml-4 font-semibold text-green-400">
                            ₹{Number(item.amount || 0).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Approved Amount */}
              {selectedRequest.approvedAmount > 0 && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                  <div className="mb-1 text-sm font-medium text-green-400">
                    ✓ Approved Amount
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    ₹{selectedRequest.approvedAmount.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.adminStatus === "rejected" &&
                selectedRequest.rejectionReason && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      Rejection Reason
                    </div>
                    <p className="text-gray-300">
                      {selectedRequest.rejectionReason}
                    </p>
                  </div>
                )}

              {/* Submitted Date */}
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
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 border-t border-gray-700 bg-gray-800/95 px-6 py-4 backdrop-blur-sm">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="w-full rounded-lg bg-gray-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>

            <h3 className="mb-2 text-xl font-bold text-white">
              Delete Funding Request?
            </h3>
            <p className="mb-6 text-gray-400">
              Are you sure you want to delete this funding request? This action
              cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRequestToDelete(null);
                }}
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 font-semibold text-gray-300 transition-colors hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
