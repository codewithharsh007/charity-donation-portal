"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getDonorLevel } from "@/utils/donorLevelCalculator";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState(null);
  const [donorLevel, setDonorLevel] = useState(null);
  const [isVerified, setIsVerified] = useState(false); // ✅ NEW: Track verification

  useEffect(() => {
    checkUser();
    window.addEventListener("storage", checkUser);
    window.addEventListener("userLoggedIn", checkUser);

    return () => {
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("userLoggedIn", checkUser);
    };
  }, [pathname]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const checkUser = () => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // ✅ NEW: Set verification status
      setIsVerified(parsedUser.isVerified || false);

      if (parsedUser.userType === "ngo" || parsedUser.role === "ngo") {
        // ✅ Only fetch subscription if verified
        if (parsedUser.isVerified) {
          fetchSubscriptionTier();
        } else {
          setSubscriptionTier(null); // Clear subscription for unverified
        }
      } else if (
        parsedUser.userType === "donor" ||
        parsedUser.role === "donor"
      ) {
        fetchDonorLevel();
      }
    } else {
      setUser(null);
      setSubscriptionTier(null);
      setDonorLevel(null);
      setIsVerified(false);
    }
  };

  const fetchSubscriptionTier = async () => {
    try {
      const response = await fetch("/api/subscriptions/current", {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success && data.data) {
        setSubscriptionTier({
          tier: data.data.currentTier || 1,
          name: data.data.tierName || "FREE",
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const fetchDonorLevel = async () => {
    try {
      const [financialRes, itemsRes] = await Promise.all([
        fetch("/api/donations/financial", { credentials: "include" }),
        fetch("/api/donations/items?type=donor", { credentials: "include" }),
      ]);

      if (financialRes.ok && itemsRes.ok) {
        const financialData = await financialRes.json();
        const itemsData = await itemsRes.json();

        const totalContributions =
          (financialData.donations?.length || 0) +
          (itemsData.donations?.length || 0);

        const level = getDonorLevel(totalContributions);

        setDonorLevel({
          level: level,
          contributions: totalContributions,
        });
      }
    } catch (error) {
      console.error("Error fetching donor level:", error);
    }
  };

  const getNGOTierStyles = () => {
    if (!subscriptionTier) return { ring: "", badge: "", icon: "" };

    const styles = {
      1: {
        ring: "ring-2 ring-gray-400",
        badge: "bg-gradient-to-br from-gray-500 to-gray-600 text-white",
        icon: "🆓",
      },
      2: {
        ring: "ring-2 ring-amber-600",
        badge: "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
        icon: "🥉",
      },
      3: {
        ring: "ring-2 ring-gray-300",
        badge: "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800",
        icon: "🥈",
      },
      4: {
        ring: "ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800",
        badge: "bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900",
        icon: "👑",
      },
    };

    return styles[subscriptionTier.tier] || styles[1];
  };

  const getDonorLevelStyles = () => {
    if (!donorLevel) return { ring: "", badge: "", icon: "" };

    const styles = {
      Bronze: {
        ring: "ring-2 ring-amber-500",
        badge: "bg-gradient-to-br from-amber-600 to-amber-800",
        icon: "🥉",
      },
      Silver: {
        ring: "ring-2 ring-slate-400",
        badge: "bg-gradient-to-br from-slate-400 to-slate-600",
        icon: "🥈",
      },
      Gold: {
        ring: "ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800",
        badge: "bg-gradient-to-br from-yellow-500 to-yellow-700",
        icon: "🥇",
      },
      Platinum: {
        ring: "ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-800",
        badge: "bg-gradient-to-br from-purple-500 to-purple-700",
        icon: "💎",
      },
    };

    return styles[donorLevel.level] || styles.Bronze;
  };

  const renderAvatar = (size = "md") => {
    const isNGO = user?.userType === "ngo" || user?.role === "ngo";
    const isDonor = user?.userType === "donor" || user?.role === "donor";

    // ✅ UPDATED: Only show tier styles if NGO is verified OR if user is donor
    const showBadge =
      (isNGO && isVerified && subscriptionTier) || (isDonor && donorLevel);
    const tierStyles =
      isNGO && isVerified
        ? getNGOTierStyles()
        : isDonor
          ? getDonorLevelStyles()
          : { ring: "", badge: "", icon: "" };

    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-9 h-9",
    };

    return (
      <div className="relative">
        {/* Avatar with Ring */}
        <div
          className={`${sizeClasses[size]} ${tierStyles.ring} rounded-full bg-gray-800 p-0.5`}
        >
          <div
            className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 font-bold text-white shadow-lg ${size === "md" ? "text-base" : "text-sm"}`}
          >
            {user?.userName?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Badge - Bottom Right */}
        {/* ✅ UPDATED: Only show badge if verified (for NGO) or always (for donor) */}
        {showBadge && (
          <div
            className={`absolute -right-1 -bottom-1 ${tierStyles.badge} flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-800 shadow-lg ring-1 ring-white/20`}
          >
            <span className="text-xs">{tierStyles.icon}</span>
          </div>
        )}
      </div>
    );
  };

  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/ngo/dashboard") ||
    pathname?.startsWith("/ngo/marketplace") ||
    pathname?.startsWith("/ngo/request-funding") ||
    pathname?.startsWith("/donate") ||
    pathname?.startsWith("/thank-you")
  ) {
    return null;
  }

  const dashboardPath = user
    ? (user.role || user.userType) === "ngo"
      ? "/ngo/dashboard"
      : (user.role || user.userType) === "admin"
        ? "/admin"
        : "/dashboard"
    : "/login";

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="text-2xl font-bold">
            <Link href="/" className="text-red-500">
              DaanSetu
            </Link>
          </div>

          {/* Hamburger Button - Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-white transition-colors hover:text-red-500 md:hidden"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
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

          {/* Navigation Links - Desktop */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-white transition-colors hover:text-red-500"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-white transition-colors hover:text-red-500"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-white transition-colors hover:text-red-500"
            >
              Contact
            </Link>

            {user ? (
              <Link
                href={dashboardPath}
                className="group flex cursor-pointer items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 transition-all hover:border-red-500"
              >
                {/* Avatar with Ring and Badge */}
                {renderAvatar("md")}

                {/* User Info */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white transition-colors group-hover:text-red-400">
                      {user.userName}
                    </span>

                    {/* Verified Badge (NGO only) */}
                    {user.userType === "ngo" && user.isVerified && (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-500">
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
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{user.email}</span>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-red-600 px-6 py-2 font-medium text-white transition-all hover:bg-red-700 hover:shadow-lg"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mt-4 border-t border-gray-800 pt-4 pb-4 md:hidden">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="py-2 text-center text-white transition-colors hover:text-red-500"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="py-2 text-center text-white transition-colors hover:text-red-500"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="py-2 text-center text-white transition-colors hover:text-red-500"
              >
                Contact
              </Link>

              {user ? (
                <Link
                  href={dashboardPath}
                  className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 transition-all hover:border-red-500"
                >
                  {/* Avatar with Ring and Badge */}
                  {renderAvatar("sm")}

                  {/* User Info */}
                  <div className="flex flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {user.userName}
                      </span>

                      {/* Verified Badge (NGO only) */}
                      {user.userType === "ngo" && user.isVerified && (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-500">
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
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{user.email}</span>
                  </div>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg bg-red-600 px-6 py-3 text-center font-medium text-white transition-all hover:bg-red-700 hover:shadow-lg"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
