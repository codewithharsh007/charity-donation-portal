"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WelcomeModal from "@/components/WelcomeModal";
import LevelUpModal from "@/components/LevelUpModal";
import LoadingScreen from "@/components/LoadingScreen";
import {
  getDonorLevel,
  getNextLevelInfo,
  getProgressPercentage,
  getLevelIcon,
} from "@/utils/donorLevelCalculator";
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
  Trophy,
  Award,
  Medal,
  Crown,
} from "lucide-react";

export default function DonorDashboardPage() {
  const router = useRouter();

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile State
  const [profile, setProfile] = useState(null);
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
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Add useEffect to check if first time user
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
      localStorage.setItem("hasSeenWelcome", "true");
    }
  }, []);

  // Donations State
  const [financialDonations, setFinancialDonations] = useState([]);
  const [itemDonations, setItemDonations] = useState([]);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    itemsDonated: 0,
  });

  // Level Stats State
  const [levelStats, setLevelStats] = useState({
    currentLevel: "Bronze",
    nextLevel: "Silver",
    contributionsNeeded: 25,
    progressPercentage: 0,
  });

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  // Initial loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchDonations();
    loadDashboardData();
  }, []);

  //Load all data before showing dashboard
  const loadDashboardData = async () => {
    try {
      setIsInitialLoading(true);

      // Fetch all data in parallel
      await Promise.all([fetchProfile(), fetchDonations()]);

      // Small delay to ensure smooth transition
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setProfileForm({
          userName: data.user?.userName || "",
          lastName: data.user?.lastName || "",
          phone: data.user?.phone || "",
          address: data.user?.address || "",
          city: data.user?.city || "",
          state: data.user?.state || "",
          pincode: data.user?.pincode || "",
        });
      }
    } catch (err) {
      // Error handled silently
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      // Fetch both financial and item donations
      const [financialRes, itemsRes] = await Promise.all([
        fetch("/api/donations/financial"),
        fetch("/api/donations/items?type=donor"),
      ]);

      if (financialRes.ok) {
        const data = await financialRes.json();
        setFinancialDonations(data.donations || []);
      }

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItemDonations(data.donations || []);
      }

      // Calculate stats
      calculateStats();
    } catch (err) {
      // Error handled silently
    }
  };

  const calculateStats = () => {
    const totalFinancial = financialDonations.reduce(
      (sum, d) => sum + (d.amount || 0),
      0,
    );
    const totalDonations = financialDonations.length + itemDonations.length;
    const itemsDonated = itemDonations.reduce(
      (sum, d) => sum + (d.items?.length || 0),
      0,
    );

    // Calculate donor level
    const currentLevel = getDonorLevel(totalDonations);
    const nextInfo = getNextLevelInfo(totalDonations);
    const progressPercentage = getProgressPercentage(totalDonations);

    setStats({
      totalDonations,
      totalAmount: totalFinancial,
      itemsDonated,
    });

    setLevelStats({
      currentLevel,
      nextLevel: nextInfo.nextLevel,
      contributionsNeeded: nextInfo.contributionsNeeded,
      progressPercentage,
    });
  };

  useEffect(() => {
    calculateStats();
  }, [financialDonations, itemDonations]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // Error handled silently
    }
    localStorage.removeItem("user");
    router.push("/");
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

      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setIsEditingProfile(false);
        setProfileMessage("Profile updated successfully!");
        setTimeout(() => setProfileMessage(""), 3000);
      } else {
        setProfileMessage("Update failed");
      }
    } catch (err) {
      setProfileMessage("Update failed");
    } finally {
      setProfileLoading(false);
    }
  };

  const getStatusBadge = (donation) => {
    const statusMap = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: "⏳",
        text: "Pending",
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

    const deliveryMap = {
      not_picked_up: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "📦",
        text: "Awaiting Pickup",
      },
      picked_up: {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: "🚚",
        text: "Picked Up",
      },
      received: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "🎉",
        text: "Received",
      },
    };

    const adminStatus = statusMap[donation.adminStatus] || statusMap.pending;
    const deliveryStatus = deliveryMap[donation.deliveryStatus];
    const shouldShowDelivery =
      donation.adminStatus === "approved" && donation.acceptedBy;

    return (
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${adminStatus.color}`}
        >
          <span className="mr-1">{adminStatus.icon}</span>
          {adminStatus.text}
        </span>
        {shouldShowDelivery && deliveryStatus && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${deliveryStatus.color}`}
          >
            <span className="mr-1">{deliveryStatus.icon}</span>
            {deliveryStatus.text}
          </span>
        )}
      </div>
    );
  };

  // Show loading screen while data is being fetched
  if (isInitialLoading) {
    return (
      <LoadingScreen
        message="Loading Your Dashboard"
        subMessage="Fetching your donations and stats..."
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
                Dashboard
              </h1>

              <p className="mt-1 hidden text-xs text-gray-400 sm:block md:text-sm">
                Welcome back,{" "}
                <span className="font-medium text-red-500">
                  {profile?.userName || "Donor"}
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
              <button
                onClick={() => router.push("/donate")}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
              >
                Make Donation
              </button>
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
                <button
                  onClick={() => {
                    router.push("/donate");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Make Donation
                </button>
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

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-5 transition-all hover:border-gray-600 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-400">
                  Total Donated
                </p>
                <p className="text-2xl font-bold text-white">
                  ₹{stats.totalAmount.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {financialDonations.length} donations
                </p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-5 transition-all hover:border-gray-600 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-400">
                  Items Donated
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.itemsDonated}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {itemDonations.length} donations
                </p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-5 transition-all hover:border-gray-600 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-400">
                  Total Impact
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalDonations}
                </p>
                <p className="mt-1 text-xs text-gray-500">contributions</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <Heart className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Donor Level Section */}
        <div className="mb-6 rounded-lg border border-gray-700 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Level Badge */}
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                  levelStats.currentLevel === "Bronze"
                    ? "border-amber-700 bg-amber-900/30"
                    : levelStats.currentLevel === "Silver"
                      ? "border-slate-600 bg-slate-800/30"
                      : levelStats.currentLevel === "Gold"
                        ? "border-yellow-700 bg-yellow-900/30"
                        : "border-purple-700 bg-purple-900/30"
                } border-2`}
              >
                <span className="text-3xl">
                  {getLevelIcon(levelStats.currentLevel)}
                </span>
                <span
                  className={`text-xl font-bold ${
                    levelStats.currentLevel === "Bronze"
                      ? "text-amber-400"
                      : levelStats.currentLevel === "Silver"
                        ? "text-slate-300"
                        : levelStats.currentLevel === "Gold"
                          ? "text-yellow-400"
                          : "text-purple-400"
                  }`}
                >
                  {levelStats.currentLevel}
                </span>
              </div>

              {/* Level Info */}
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {stats.totalDonations} Contributions
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {levelStats.contributionsNeeded > 0
                    ? `${levelStats.contributionsNeeded} more to reach ${levelStats.nextLevel} level`
                    : "Maximum level achieved! 🎉"}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {levelStats.contributionsNeeded > 0 && (
            <div className="space-y-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
                <div
                  className={`h-full transition-all duration-500 ${
                    levelStats.currentLevel === "Bronze"
                      ? "bg-gradient-to-r from-amber-600 to-amber-500"
                      : levelStats.currentLevel === "Silver"
                        ? "bg-gradient-to-r from-slate-500 to-slate-400"
                        : levelStats.currentLevel === "Gold"
                          ? "bg-gradient-to-r from-yellow-600 to-yellow-500"
                          : "bg-gradient-to-r from-purple-600 to-purple-500"
                  }`}
                  style={{ width: `${levelStats.progressPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  {levelStats.currentLevel} ({stats.totalDonations})
                </span>
                <span className="font-bold text-emerald-400">
                  {levelStats.progressPercentage}%
                </span>
                <span className="text-gray-400">
                  {levelStats.nextLevel} (
                  {getNextLevelInfo(stats.totalDonations).nextThreshold})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-700 p-5">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <User className="h-5 w-5 text-red-500" />
                Your Profile
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Personal information and contact details
              </p>
            </div>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-red-700 hover:shadow-lg"
            >
              <Edit2 className="h-4 w-4" />
              {isEditingProfile ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <div className="p-5">
            {profileMessage && (
              <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <p className="text-center text-sm font-medium text-green-400">
                  {profileMessage}
                </p>
              </div>
            )}

            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.userName}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          userName: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2.5 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2.5 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          phone: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2.5 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={profileForm.pincode}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          pincode: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2.5 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder="Enter pincode"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      Address
                    </label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          address: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2.5 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder="Enter address"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      City
                    </label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, city: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2.5 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      State
                    </label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          state: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2.5 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder="Enter state"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleProfileSave}
                    disabled={profileLoading}
                    className="rounded-lg bg-red-600 px-6 py-2.5 font-medium text-white shadow-md transition-colors hover:bg-red-700 hover:shadow-lg disabled:opacity-50"
                  >
                    {profileLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-gray-600 bg-gray-700/50 p-3 transition-colors hover:bg-gray-700">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                      Full Name
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {profile?.userName || "-"} {profile?.lastName || ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-gray-600 bg-gray-700/50 p-3 transition-colors hover:bg-gray-700">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <Mail className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                      Email
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {profile?.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-gray-600 bg-gray-700/50 p-3 transition-colors hover:bg-gray-700">
                  <div className="rounded-lg bg-purple-500/10 p-2">
                    <Phone className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                      Phone
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {profile?.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-gray-600 bg-gray-700/50 p-3 transition-colors hover:bg-gray-700">
                  <div className="rounded-lg bg-pink-500/10 p-2">
                    <MapPin className="h-5 w-5 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                      Location
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {profile?.city
                        ? `${profile.city}, ${profile.state} - ${profile.pincode}`
                        : "Not provided"}
                    </p>
                  </div>
                </div>

                {profile?.address && (
                  <div className="flex items-center gap-3 rounded-lg border border-gray-600 bg-gray-700/50 p-3 transition-colors hover:bg-gray-700 md:col-span-2">
                    <div className="rounded-lg bg-orange-500/10 p-2">
                      <MapPin className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Full Address
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-white">
                        {profile.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Donations Preview */}
        <div className="rounded-lg border border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-700 p-5">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <Heart className="h-5 w-5 text-red-500" />
                Recent Donations
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Your latest contributions
              </p>
            </div>
            {(financialDonations.length > 0 || itemDonations.length > 0) && (
              <button
                onClick={() => router.push("/donate?tab=history")}
                className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:border-red-500 hover:bg-gray-700"
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
            )}
          </div>

          <div className="p-5">
            {[
              ...financialDonations.map((d) => ({ ...d, type: "financial" })),
              ...itemDonations.map((d) => ({ ...d, type: "item" })),
            ]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 3).length === 0 ? (
              <div className="py-12 text-center">
                <Heart className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <p className="mb-2 text-lg font-semibold text-gray-300">
                  No donations yet
                </p>
                <p className="mb-6 text-sm text-gray-500">
                  Start your journey of giving today!
                </p>
                <button
                  onClick={() => router.push("/donate")}
                  className="rounded-lg bg-red-600 px-6 py-2.5 font-medium text-white shadow-md transition-colors hover:bg-red-700 hover:shadow-lg"
                >
                  Make Your First Donation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  ...financialDonations.map((d) => ({
                    ...d,
                    type: "financial",
                  })),
                  ...itemDonations.map((d) => ({ ...d, type: "item" })),
                ]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 3)
                  .map((donation) => {
                    if (donation.type === "financial") {
                      return (
                        <div
                          key={donation._id}
                          className="rounded-lg border border-gray-600 bg-gray-700/50 p-4 transition-all hover:border-green-500/50 hover:shadow-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <div className="rounded-lg bg-green-500/10 p-1.5">
                                  <DollarSign className="h-4 w-4 text-green-400" />
                                </div>
                                <span className="text-xs font-semibold tracking-wide text-gray-300 uppercase">
                                  Financial Donation
                                </span>
                              </div>
                              <h3 className="mb-1 text-2xl font-bold text-green-400">
                                ₹{donation.amount?.toLocaleString()}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {new Date(
                                  donation.createdAt,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {donation.note && (
                                <p className="mt-2 text-sm text-gray-400 italic">
                                  "{donation.note}"
                                </p>
                              )}
                            </div>
                            <span className="flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                              <svg
                                className="h-3 w-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Completed
                            </span>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={donation._id}
                          className="rounded-lg border border-gray-600 bg-gray-700/50 p-4 transition-all hover:border-blue-500/50 hover:shadow-lg"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <div className="rounded-lg bg-blue-500/10 p-1.5">
                                  <Package className="h-4 w-4 text-blue-400" />
                                </div>
                                <span className="text-xs font-semibold tracking-wide text-gray-300 uppercase">
                                  Item Donation
                                </span>
                              </div>
                              <h3 className="mb-1 text-lg font-bold text-white">
                                {donation.category}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {new Date(
                                  donation.createdAt,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            {getStatusBadge(donation)}
                          </div>

                          <div className="mb-3 flex flex-wrap gap-2">
                            {donation.items.slice(0, 3).map((item, index) => (
                              <span
                                key={index}
                                className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300"
                              >
                                {item}
                              </span>
                            ))}
                            {donation.items.length > 3 && (
                              <span className="rounded-md bg-gray-600 px-2.5 py-1 text-xs font-semibold text-gray-300">
                                +{donation.items.length - 3} more
                              </span>
                            )}
                          </div>

                          {donation.acceptedBy && (
                            <div className="mt-2 rounded-lg border border-green-500/30 bg-green-500/10 p-2">
                              <p className="text-xs font-semibold text-green-400">
                                ✓ Accepted by {donation.acceptedBy.userName}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                  })}

                {/* See More Button */}
                {financialDonations.length + itemDonations.length > 3 && (
                  <button
                    onClick={() => router.push("/donate?tab=history")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 bg-gray-700 py-3 font-semibold text-red-400 shadow-md transition-all hover:border-red-500 hover:bg-gray-600 hover:text-red-300 hover:shadow-lg"
                  >
                    View All {financialDonations.length + itemDonations.length}{" "}
                    Donations
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
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modals */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />

      <LevelUpModal
        isOpen={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        newLevel={levelStats.currentLevel}
        totalContributions={stats.totalDonations}
      />

      {/* Test Button (remove later) */}
      {/* <button
        onClick={() => setShowLevelUpModal(true)}
        className="fixed right-4 bottom-4 rounded-lg bg-purple-600 px-4 py-2 text-white shadow-lg"
      >
        Test Level Up
      </button> */}
    </div>
  );
}
