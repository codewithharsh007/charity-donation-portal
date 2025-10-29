// app/ngoDashboard/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import UpgradePromptModal from "@/components/UpgradePromptModal";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Heart,
  TrendingUp,
  Package,
  DollarSign,
  Crown,
  BarChart,
  Zap,
  Lock,
  Plus,
  Eye,
  Users,
  Calendar,
  CheckCircle,
} from "lucide-react";

export default function NgoDashboardPage() {
  const [donations, setDonations] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("donations");
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showFundingRequestModal, setShowFundingRequestModal] = useState(false);

  // Profile UI state
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    userName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [financialDonations, setFinancialDonations] = useState(0);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [fundingLoading, setFundingLoading] = useState(false);

  useEffect(() => {
    fetchDonations();
    fetchVerificationStatus();
    fetchProfile();
    fetchSubscription();
    fetchFundingRequests();
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsInitialLoading(true);

      // Fetch all NGO data
      await Promise.all([
        fetchSubscription(),
        fetchDonations(),
        fetchFundingRequests(),
      ]);

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);

      // Try multiple ways to get the token
      let token = null;

      // Method 1: From user object
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          token = userData.token || userData.accessToken;
        } catch (e) {
          console.error("❌ Error parsing user:", e);
        }
      }

      // Method 2: Direct token
      if (!token) {
        token =
          localStorage.getItem("token") || localStorage.getItem("authToken");
      }

      if (!token) {
        setError("Please login again");
        router.push("/login");
        return;
      }

      const res = await fetch("/api/ngo/donations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDonations(data.donations || []);
      } else {
        setError(data.message || "Failed to load donations");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const res = await fetch("/api/ngo/verification");
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error("JSON parse error:", e);
        data = null;
      }
      if (res.ok && data) {
        setVerificationStatus(data.verification);
      }
    } catch (err) {
      console.error("Error fetching verification status:", err);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscriptions/current", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionData(data.data); // ✅ Store the subscription data
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    }
  };

  const fetchFundingRequests = async () => {
    try {
      setFundingLoading(true);

      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData?.token) {
        console.log("❌ No token found for funding requests");
        return;
      }

      const res = await fetch("/api/ngo/funding-requests", {
        headers: {
          Authorization: `Bearer ${userData.token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const requests = data.requests || [];
        setFundingRequests(requests);

        // ✅ Calculate total financial donations (approved requests only)
        const totalFinancial = requests
          .filter((req) => req.adminStatus === "approved")
          .reduce((sum, req) => sum + (req.approvedAmount || 0), 0);

        setFinancialDonations(totalFinancial);

        console.log("✅ Funding requests loaded:", requests.length);
        console.log("✅ Total financial donations:", totalFinancial);
      } else {
        console.log("❌ Error loading funding requests:", data.message);
      }
    } catch (err) {
      console.error("❌ Fetch funding error:", err);
    } finally {
      setFundingLoading(false);
    }
  };

  // Logout helper
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed", err);
    }
    try {
      localStorage.removeItem("user");
    } catch (e) {}
    try {
      router.push("/");
    } catch (e) {}
    try {
      router.refresh();
    } catch (e) {}
  };

  // PROFILE: fetch and edit helpers
  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileMessage("");
    try {
      const res = await fetch("/api/user/profile");
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }
      if (!res.ok) {
        setProfileMessage(
          (data && data.message) || res.statusText || "Failed to load profile",
        );
        return;
      }
      const user = (data && data.user) || null;
      setProfile(user);
      setProfileForm({
        userName: user?.userName || "",
        lastName: user?.lastName || "",
        phone: user?.phone || "",
        address: user?.address || "",
        city: user?.city || "",
        state: user?.state || "",
        pincode: user?.pincode || "",
      });
      setIsEditingProfile(false);
    } catch (err) {
      setProfileMessage(err.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    setProfileMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }
      if (!res.ok) {
        setProfileMessage(
          (data && data.message) || res.statusText || "Update failed",
        );
        return;
      }
      const updated = (data && data.user) || null;
      setProfile(updated);
      setIsEditingProfile(false);
      setProfileMessage((data && data.message) || "Profile updated");

      // Update localStorage user if present
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const existing = JSON.parse(raw);
          const merged = { ...existing, ...updated };
          localStorage.setItem("user", JSON.stringify(merged));
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setProfileMessage(err.message || "Update failed");
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMessage(""), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "✅";
      case "pending":
        return "⏳";
      case "processing":
        return "🔄";
      case "cancelled":
        return "❌";
      default:
        return "📋";
    }
  };

  const getVerificationStatusBadge = () => {
    if (!verificationStatus) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/20 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-sm text-orange-400">⚠️</span>
          <span className="text-xs font-medium text-orange-300">
            Not Verified
          </span>
        </div>
      );
    }

    switch (verificationStatus.verificationStatus) {
      case "accepted":
        return (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-sm text-green-400">✓</span>
            <span className="text-xs font-medium text-green-300">
              Verified NGO
            </span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-sm text-orange-400">⏳</span>
            <span className="text-xs font-medium text-orange-300">
              Under Review
            </span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-sm text-red-400">❌</span>
            <span className="text-xs font-medium text-red-300">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-sm text-orange-400">⚠️</span>
            <span className="text-xs font-medium text-orange-300">
              Not Verified
            </span>
          </div>
        );
    }
  };

  const isVerified = () => {
    return verificationStatus?.verificationStatus === "accepted";
  };

  // Upgrade prompt logic
  useEffect(() => {
    // Don't run if data not loaded
    if (!subscriptionData || !verificationStatus) {
      return;
    }

    // Check if verified
    if (!isVerified()) {
      return;
    }

    // Check if FREE tier
    if (subscriptionData.tierName !== "FREE") {
      return;
    }

    // Check cooldown
    const nextShow = localStorage.getItem("upgradePromptNext");
    if (nextShow && new Date() < new Date(nextShow)) {
      return;
    }

    // Check session
    if (sessionStorage.getItem("upgradePromptShown")) {
      return;
    }

    // Show after 3 seconds
    const timer = setTimeout(() => {
      setShowUpgradeModal(true);
      sessionStorage.setItem("upgradePromptShown", "true");
    }, 3000);

    return () => clearTimeout(timer);
  }, [subscriptionData, verificationStatus]);

  // ✅ Donation statistics
  const totalReceived = donations.reduce(
    (sum, d) => sum + (d.itemValue || 0),
    0,
  );
  const itemsReceived = donations.length;
  const totalDonors = new Set(donations.map((d) => d.donor?._id)).size;

  const filteredDonations = donations.filter((donation) => {
    // If no search term, show all donations
    if (!searchTerm) return true;

    const search = searchTerm.toLowerCase();

    // Search in donor name (donation.donor is an object)
    const donorName = donation.donor?.name?.toLowerCase() || "";

    // Search in items array
    const itemsText = (donation.items || []).join(" ").toLowerCase();

    // Search in category
    const category = donation.category?.toLowerCase() || "";

    // Return true if any field matches
    return (
      donorName.includes(search) ||
      itemsText.includes(search) ||
      category.includes(search)
    );
  });

  // ✅ Get current tier info
  const currentTier = subscriptionData?.currentTier || 1;
  const tierName = subscriptionData?.tierName || "FREE";
  const getTierBadgeColor = (tier) => {
    switch (tier) {
      case 1:
        return "bg-gray-500/20 text-gray-300";
      case 2:
        return "bg-amber-600/20 text-amber-300";
      case 3:
        return "bg-gray-400/20 text-gray-200";
      case 4:
        return "bg-yellow-500/20 text-yellow-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  // Show loader while fetching
  if (isInitialLoading) {
    return (
      <LoadingScreen
        message="Loading NGO Dashboard"
        subMessage="Preparing your data..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      {/* Header - Matching Navbar */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 shadow-lg backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">
                NGO Dashboard
              </h1>
              <p className="mt-1 hidden text-xs text-gray-400 sm:block md:text-sm">
                Welcome back,{" "}
                <span className="font-medium text-red-500">
                  {profile?.userName || "NGO"}
                </span>
                !
              </p>
            </div>

            {/* Hamburger Menu - Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white transition-colors hover:text-red-500 md:hidden"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-3 md:flex">
              <div className="flex items-center gap-2">
                {getVerificationStatusBadge()}
              </div>
              {/* ✅ UPDATED: Only show active subscription button if verified */}
              {isVerified() ? (
                <button
                  onClick={() => router.push("/ngo/subscription/plans")}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg"
                >
                  <TrendingUp className="h-4 w-4" />
                  Subscription
                </button>
              ) : (
                <button
                  disabled
                  title="Complete verification to access subscriptions"
                  className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-500 opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  Subscription
                </button>
              )}

              {/* ✅ NEW: Request Funding Button (Silver/Gold Only) */}
              {!isVerified() ? (
                // NOT VERIFIED - Disabled
                <button
                  disabled
                  title="Complete verification first to access funding requests"
                  className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-500 opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  Ask Funds
                </button>
              ) : currentTier >= 3 ? (
                // VERIFIED + SILVER/GOLD - Active button to request funding
                <button
                  onClick={() => router.push("/ngo/request-funding")}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-lg"
                >
                  <DollarSign className="h-4 w-4" />
                  Ask Funds
                </button>
              ) : (
                // VERIFIED but FREE/BRONZE - Locked, click to upgrade
                <button
                  onClick={() => router.push("/ngo/subscription/plans")}
                  title="Upgrade to Silver or Gold tier to request funding"
                  className="flex items-center gap-2 rounded-lg bg-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-400 transition-all hover:bg-gray-600 hover:text-white"
                >
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">Ask Funds</span>
                  <span className="text-xs">(Upgrade)</span>
                </button>
              )}

              {isVerified() ? (
                <button
                  onClick={() => router.push("/ngo/marketplace")}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
                >
                  <Package className="h-4 w-4" />
                  Marketplace
                </button>
              ) : (
                <button
                  disabled
                  title="Complete verification to access marketplace"
                  className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-500 opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  Marketplace
                </button>
              )}

              <button
                onClick={() => router.push("/")}
                className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-700"
              >
                Home
              </button>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="mt-4 border-t border-gray-700 pt-4 pb-4 md:hidden">
              <div className="flex flex-col space-y-3">
                <div className="mb-2">{getVerificationStatusBadge()}</div>

                {/* ✅ UPDATED: Subscription button with verification check */}
                {isVerified() ? (
                  <button
                    onClick={() => {
                      router.push("/ngo/subscription/plans");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Subscription
                  </button>
                ) : (
                  <button
                    disabled
                    title="Complete verification first"
                    className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-3 text-center text-sm font-semibold text-gray-500 opacity-50"
                  >
                    <Lock className="h-4 w-4" />
                    Subscription
                  </button>
                )}

                {/* ✅ Request Funding Button - Mobile */}
                {!isVerified() ? (
                  // NOT VERIFIED - Disabled
                  <button
                    disabled
                    title="Complete verification first to access funding requests"
                    className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-3 text-center text-sm font-semibold text-gray-500 opacity-50"
                  >
                    <Lock className="h-4 w-4" />
                    Ask Funds (Verify First)
                  </button>
                ) : currentTier >= 3 ? (
                  // VERIFIED + SILVER/GOLD - Active
                  <button
                    onClick={() => {
                      router.push("/ngo/request-funding");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:from-green-700 hover:to-emerald-700"
                  >
                    <DollarSign className="h-4 w-4" />
                    Ask Funds
                  </button>
                ) : (
                  // VERIFIED but FREE/BRONZE - Locked, upgrade prompt
                  <button
                    onClick={() => {
                      router.push("/ngo/subscription/plans");
                      setIsMobileMenuOpen(false);
                    }}
                    title="Upgrade to Silver or Gold to request funding"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-3 text-center text-sm font-semibold text-gray-400 transition-colors hover:bg-gray-600 hover:text-white"
                  >
                    <Lock className="h-4 w-4" />
                    Ask Funds - Upgrade Required
                  </button>
                )}

                {isVerified() ? (
                  <button
                    onClick={() => {
                      router.push("/ngo/marketplace");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    <Package className="h-4 w-4" />
                    Marketplace
                  </button>
                ) : (
                  <button
                    disabled
                    title="Complete verification to access marketplace"
                    className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-3 text-center text-sm font-semibold text-gray-500 opacity-50"
                  >
                    <Lock className="h-4 w-4" />
                    Marketplace
                  </button>
                )}

                <button
                  onClick={() => {
                    router.push("/");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-center text-sm text-gray-300 transition-colors hover:bg-gray-700"
                >
                  Home
                </button>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-center text-sm text-gray-300 transition-colors hover:bg-red-600 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ✅ UPDATED Subscription Status Card with Tier-Based Features */}
        {/* ✅ ONLY SHOW SUBSCRIPTION IF VERIFIED */}
        {isVerified() && subscriptionData && (
          <div
            className="mb-6 rounded-2xl p-6 shadow-lg"
            style={{
              background:
                currentTier === 4
                  ? "linear-gradient(to right, #ca8a04, #c2410c)"
                  : currentTier === 3
                    ? "linear-gradient(to right, #9ca3af, #4b5563)"
                    : currentTier === 2
                      ? "linear-gradient(to right, #d97706, #92400e)"
                      : "linear-gradient(to right, #4b5563, #374151)",
            }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Left side - Tier info */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  {currentTier === 4 ? (
                    <Crown className="h-8 w-8 text-yellow-300" />
                  ) : currentTier === 3 ? (
                    <BarChart className="h-8 w-8 text-gray-300" />
                  ) : currentTier === 2 ? (
                    <Zap className="h-8 w-8 text-amber-300" />
                  ) : (
                    <Package className="h-8 w-8 text-gray-300" />
                  )}
                </div>

                <div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="text-2xl font-bold text-white">
                        {currentTier === 4
                          ? "GOLD"
                          : currentTier === 3
                            ? "SILVER"
                            : currentTier === 2
                              ? "BRONZE"
                              : "FREE"}{" "}
                        Tier
                      </h3>
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {currentTier === 4
                          ? "👑 PREMIUM"
                          : currentTier === 3
                            ? "🥈 PREMIUM"
                            : currentTier === 2
                              ? "🥉 PREMIUM"
                              : "🆓 FREE"}
                      </span>
                    </div>
                    <p className="text-sm text-white/90">
                      {currentTier === 4
                        ? "Premium Partner"
                        : currentTier === 3
                          ? "Impact Partner"
                          : currentTier === 2
                            ? "Growth Partner"
                            : "Basic features only"}
                    </p>
                    <div className="mt-2 flex gap-4 text-xs text-white/80">
                      <span>
                        • {subscriptionData?.plan?.limits?.activeRequests || 2}{" "}
                        Active Requests
                      </span>
                      <span>
                        •{" "}
                        {subscriptionData?.plan?.limits?.maxItemValue === -1
                          ? "∞ Unlimited"
                          : `₹${(subscriptionData?.plan?.limits?.maxItemValue || 1000).toLocaleString()}`}{" "}
                        Max Item Value
                      </span>
                      <span>
                        •{" "}
                        {subscriptionData?.plan?.limits?.monthlyAcceptance ===
                        -1
                          ? "∞ Unlimited"
                          : `${subscriptionData?.plan?.limits?.monthlyAcceptance || 5}`}{" "}
                        Monthly Items
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Action buttons */}
              <div className="flex gap-2">
                {currentTier < 4 && (
                  <button
                    onClick={() => router.push("/ngo/subscription/plans")}
                    className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-purple-600 shadow-lg transition-colors hover:bg-blue-50"
                  >
                    ⬆️ Upgrade
                  </button>
                )}
                <button
                  onClick={() => router.push("/ngo/subscription/manage")}
                  className="rounded-lg bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ SHOW VERIFICATION PROMPT IF NOT VERIFIED */}
        {!isVerified && (
          <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-yellow-400">
                  Complete Verification to Access Subscriptions
                </h3>
                <p className="mb-4 text-yellow-300">
                  Get verified to unlock subscription plans and start receiving
                  donations from our community.
                </p>
                {!verificationStatus && (
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-lg bg-yellow-600 px-4 py-2 text-sm text-white transition-colors hover:bg-yellow-700"
                  >
                    Start Verification Process
                  </button>
                )}
                {verificationStatus?.verificationStatus === "pending" && (
                  <p className="text-sm text-yellow-400">
                    ⏳ Your verification is under review
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards - Show different stats based on tier */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Total Received */}
          <div className="rounded-2xl border border-gray-700/50 bg-[#1e293b] p-6 transition-all hover:border-gray-600">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="mb-2 text-sm text-gray-400">Total Received</p>
                <h3 className="text-3xl font-bold text-white">
                  ₹ {financialDonations.toLocaleString()}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {
                    fundingRequests.filter((r) => r.adminStatus === "approved")
                      .length
                  }{" "}
                  approved request
                  {fundingRequests.filter((r) => r.adminStatus === "approved")
                    .length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
            {currentTier > 1 && (
              <div className="mt-3 border-t border-gray-700 pt-3">
                <p className="text-xs text-gray-400">
                  {currentTier === 4
                    ? "✨ Premium Analytics Available"
                    : currentTier === 3
                      ? "📊 Advanced Tracking Enabled"
                      : "📈 Basic Stats Only"}
                </p>
              </div>
            )}
          </div>

          {/* Items Received */}
          <div className="rounded-2xl border border-gray-700/50 bg-[#1e293b] p-6 transition-all hover:border-gray-600">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="mb-2 text-sm text-gray-400">Items Received</p>
                <h3 className="text-3xl font-bold text-white">
                  {itemsReceived}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  item donation{itemsReceived !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            {subscriptionData?.plan && (
              <div className="mt-3 border-t border-gray-700 pt-3">
                <p className="text-xs text-gray-400">
                  Limit:{" "}
                  {subscriptionData.plan.limits?.monthlyAcceptance === -1
                    ? "∞ Unlimited"
                    : `${subscriptionData.plan.limits?.monthlyAcceptance}/month`}
                </p>
              </div>
            )}
          </div>

          {/* Total Donors */}
          <div className="rounded-2xl border border-gray-700/50 bg-[#1e293b] p-6 transition-all hover:border-gray-600">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="mb-2 text-sm text-gray-400">Total Donors</p>
                <h3 className="text-3xl font-bold text-white">{totalDonors}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  generous contributor{totalDonors !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <Heart className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            {currentTier > 2 && (
              <div className="mt-3 border-t border-gray-700 pt-3">
                <p className="text-xs text-gray-400">
                  {currentTier === 4
                    ? "👥 Priority Donor Matching"
                    : "🤝 Enhanced Donor Reach"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ✅ UPDATED: Show for verified NGOs, hide ONLY for GOLD tier (tier 4) */}
        {isVerified() && currentTier < 4 && (
          <div className="mb-6 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">🚀</span>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-purple-400">
                  Unlock Premium Features
                </h3>
                <p className="mb-4 text-purple-300">
                  {currentTier === 1
                    ? "Upgrade to access unlimited requests, advanced analytics, priority support, and more!"
                    : currentTier === 2
                      ? "Upgrade to SILVER or GOLD for even more benefits!"
                      : "Upgrade to GOLD for maximum impact and unlimited features!"}
                </p>
                <button
                  onClick={() => router.push("/ngo/subscription/plans")}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition-colors hover:bg-purple-700"
                >
                  {currentTier === 1 ? "View Plans" : "Upgrade Now"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Your Profile Section */}
        <div className="mb-8 rounded-2xl border border-gray-700/50 bg-[#1e293b] p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-white">Your Profile</h2>
                <p className="text-sm text-gray-400">
                  Personal information and contact details
                </p>
              </div>
            </div>
            {!isEditingProfile ? (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleProfileSave}
                  disabled={profileLoading}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {profileLoading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileForm({
                      userName: profile?.userName || "",
                      lastName: profile?.lastName || "",
                      phone: profile?.phone || "",
                      address: profile?.address || "",
                      city: profile?.city || "",
                      state: profile?.state || "",
                      pincode: profile?.pincode || "",
                    });
                  }}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Full Name */}
            <div className="rounded-xl border border-gray-700/50 bg-[#2d3748] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs tracking-wide text-gray-400 uppercase">
                    Full Name
                  </p>
                  {isEditingProfile ? (
                    <input
                      name="userName"
                      value={profileForm.userName}
                      onChange={handleProfileChange}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-transparent focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <p className="truncate font-medium text-white">
                      {profile?.userName || "-"} {profile?.lastName || ""}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="rounded-xl border border-gray-700/50 bg-[#2d3748] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                  <Mail className="h-5 w-5 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs tracking-wide text-gray-400 uppercase">
                    Email
                  </p>
                  <p className="truncate font-medium text-white">
                    {profile?.email || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="rounded-xl border border-gray-700/50 bg-[#2d3748] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                  <Phone className="h-5 w-5 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs tracking-wide text-gray-400 uppercase">
                    Phone
                  </p>
                  {isEditingProfile ? (
                    <input
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-transparent focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <p className="truncate font-medium text-white">
                      {profile?.phone || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-gray-700/50 bg-[#2d3748] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                  <MapPin className="h-5 w-5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs tracking-wide text-gray-400 uppercase">
                    Location
                  </p>
                  {isEditingProfile ? (
                    <div className="space-y-2">
                      <input
                        name="city"
                        value={profileForm.city}
                        onChange={handleProfileChange}
                        placeholder="City"
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-transparent focus:ring-2 focus:ring-red-500"
                      />
                      <input
                        name="state"
                        value={profileForm.state}
                        onChange={handleProfileChange}
                        placeholder="State"
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-transparent focus:ring-2 focus:ring-red-500"
                      />
                      <input
                        name="pincode"
                        value={profileForm.pincode}
                        onChange={handleProfileChange}
                        placeholder="Pincode"
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-transparent focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ) : (
                    <p className="truncate font-medium text-white">
                      {profile?.city || "-"}, {profile?.state || "-"} -{" "}
                      {profile?.pincode || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Full Address */}
            <div className="rounded-xl border border-gray-700/50 bg-[#2d3748] p-4 md:col-span-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                  <MapPin className="h-5 w-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-xs tracking-wide text-gray-400 uppercase">
                    Full Address
                  </p>
                  {isEditingProfile ? (
                    <textarea
                      name="address"
                      value={profileForm.address}
                      onChange={handleProfileChange}
                      rows="2"
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-transparent focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <p className="font-medium text-white">
                      {profile?.address || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {profileMessage && (
            <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/20 py-2 text-center text-sm text-green-400">
              {profileMessage}
            </div>
          )}
        </div>

        {/* Verification Alerts - Moved after profile */}
        {verificationStatus?.verificationStatus === "rejected" && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-red-400">
                  Verification Rejected
                </h3>
                <p className="mb-3 text-red-300">
                  {verificationStatus.rejectionReason}
                </p>
                <p className="mb-4 text-sm text-red-400">
                  Attempts remaining: {verificationStatus.attemptsRemaining} out
                  of 3
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                >
                  Reapply for Verification
                </button>
              </div>
            </div>
          </div>
        )}

        {verificationStatus?.verificationStatus === "pending" && (
          <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">⏳</span>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-blue-400">
                  Verification Under Review
                </h3>
                <p className="text-blue-300">
                  Your verification application is being reviewed by our admin
                  team. You'll receive an email once the review is complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {!verificationStatus && (
          <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">📋</span>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-yellow-400">
                  Complete Your Verification
                </h3>
                <p className="mb-4 text-yellow-300">
                  Get verified to receive donations and gain trust from donors.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-lg bg-yellow-600 px-4 py-2 text-sm text-white transition-colors hover:bg-yellow-700"
                >
                  Start Verification Process
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Donations Section */}
        <div className="rounded-2xl border border-gray-700/50 bg-[#1e293b] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Received Donations
                </h2>
                <p className="text-sm text-gray-400">
                  Recent donations from donors
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                /* Navigate to all donations */
              }}
              className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-400"
            >
              View All
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Donations List */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-red-500"></div>
                <p className="mt-4 text-gray-400">Loading donations...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-700/50">
                  <span className="text-3xl">📭</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {searchTerm
                    ? "No donations found"
                    : "No donations received yet"}
                </h3>
                <p className="mx-auto max-w-md text-gray-400">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "You haven't received any donations yet. Complete your verification to start receiving donations from donors."}
                </p>
              </div>
            ) : (
              filteredDonations.slice(0, 5).map((donation) => (
                <div
                  key={donation._id}
                  className="rounded-xl border border-gray-700/50 bg-[#2d3748] p-4 transition-all hover:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <Package className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white">
                          {donation.items?.join(", ") || "Item Donation"}
                        </h3>
                        <p className="text-xs text-gray-400">
                          From {donation.donor?.name || "Anonymous"} •{" "}
                          {new Date(
                            donation.receivedDate || donation.createdAt,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {donation.itemValue > 0 && (
                        <p className="text-sm font-semibold text-gray-300">
                          ₹{donation.itemValue?.toLocaleString()}
                        </p>
                      )}
                      <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                        ✓ Received
                      </span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {donation.category && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      <span className="rounded-full bg-gray-700 px-2 py-1">
                        {donation.category}
                      </span>
                      {donation.items && donation.items.length > 1 && (
                        <span className="rounded-full bg-gray-700 px-2 py-1">
                          {donation.items.length} items
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
        {/* ... all your existing dashboard content ... */}

        {/* ✅ ADD: Upgrade Modal */}
        <UpgradePromptModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </div>
    </div>
  );
}
