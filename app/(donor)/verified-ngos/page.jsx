"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  Heart,
  CheckCircle,
  Building2,
  Search,
  Filter,
  X,
  ExternalLink,
  Menu,
  Shield,
} from "lucide-react";

export default function VerifiedNGOsPage() {
  const router = useRouter();
  const [ngos, setNgos] = useState([]);
  const [filteredNgos, setFilteredNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // ✅ NEW

  const categories = [
    "all",
    "Education",
    "Healthcare",
    "Environment",
    "Animal Welfare",
    "Women Empowerment",
    "Child Welfare",
    "Disaster Relief",
    "Other",
  ];

  useEffect(() => {
    fetchVerifiedNGOs();
  }, []);

  useEffect(() => {
    filterNGOs();
  }, [searchTerm, selectedCategory, ngos]);

  const fetchVerifiedNGOs = async () => {
    const loadingToast = toast.loading("Loading verified NGOs...");

    try {
      setLoading(true);
      const res = await fetch("/api/ngos/verified");
      const data = await res.json();

      console.log("API Response:", data);

      if (res.ok && data.success) {
        setNgos(data.ngos || []);
        setFilteredNgos(data.ngos || []);
        toast.success(`Found ${data.count} verified NGOs`, {
          id: loadingToast,
        });
      } else {
        toast.error(data.message || "Failed to load NGOs", {
          id: loadingToast,
        });
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error loading NGOs", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const filterNGOs = () => {
    let filtered = ngos;

    if (searchTerm) {
      filtered = filtered.filter(
        (ngo) =>
          ngo.ngoName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ngo.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ngo.state?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((ngo) => ngo.category === selectedCategory);
    }

    setFilteredNgos(filtered);
  };

  const openDetailModal = (ngo) => {
    setSelectedNGO(ngo);
    setShowDetailModal(true);
  };

  // ✅ NEW: Handle category selection on mobile
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setMobileMenuOpen(false); // Close menu after selection
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-red-600"></div>
          <p className="text-gray-600">Loading verified NGOs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ NEW: Mobile-Friendly Header with Hamburger */}
      <div className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-400" />
              <div className=" sm:block">
                <h1 className="text-2xl font-bold text-white">Verified NGOs</h1>
                <p className="text-xs text-gray-400">Trusted organizations</p>
              </div>
              {/* <h1 className="text-xl font-bold text-white sm:hidden">
                Verified NGOs
              </h1>
              <p className="text-xs text-gray-400">Trusted organizations</p> */}
            </div>

            {/* Desktop: Back Button */}
            <button
              onClick={() => router.push("/")}
              className="hidden rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700 sm:flex"
            >
              Back to Home
            </button>

            {/* Mobile: Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg bg-gray-800 p-2 text-gray-300 hover:bg-gray-700 sm:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* ✅ NEW: Mobile Menu */}
          {mobileMenuOpen && (
            <div className="mt-4 space-y-2 border-t border-gray-700 pt-4 sm:hidden">
              <button
                onClick={() => router.push("/")}
                className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-left text-gray-300 transition-colors hover:bg-gray-700"
              >
                ← Back to Home
              </button>
              <div className="px-2 py-2 text-xs text-gray-400">
                {filteredNgos.length} NGOs found
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Banner */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">
                  Total Verified NGOs
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {ngos.length}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">Total Categories</p>
                <p className="text-3xl font-bold text-gray-900">
                  {categories.length - 1}
                </p>
              </div>
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, city, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-4 pl-12 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-red-500 focus:outline-none sm:text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute top-1/2 right-4 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* ✅ NEW: Mobile-Friendly Category Filter */}
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-min items-center gap-2">
              <Filter className="h-5 w-5 flex-shrink-0 text-gray-500" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all sm:px-4 sm:text-sm ${
                    selectedCategory === cat
                      ? "bg-red-600 text-white shadow-md"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {cat === "all"
                    ? "All"
                    : cat.length > 10
                      ? cat.substring(0, 10) + "..."
                      : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredNgos.length} of {ngos.length} verified NGOs
          </p>
        </div>

        {/* NGO Cards Grid */}
        {filteredNgos.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
            <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              No NGOs Found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredNgos.map((ngo) => (
              <div
                key={ngo.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-red-500 hover:shadow-lg"
              >
                {/* NGO Image */}
                {ngo.images && ngo.images.length > 0 ? (
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={ngo.images[0].url}
                      alt={ngo.ngoName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Building2 className="h-16 w-16 text-gray-400" />
                  </div>
                )}

                {/* NGO Details */}
                <div className="p-6">
                  {/* Verified Badge */}
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-600">
                      Verified Organization
                    </span>
                  </div>

                  {/* NGO Name */}
                  <h3 className="mb-2 line-clamp-1 text-xl font-bold text-gray-900">
                    {ngo.ngoName}
                  </h3>

                  {/* Category */}
                  <div className="mb-3">
                    <span className="inline-block rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {ngo.category}
                    </span>
                  </div>

                  {/* Description */}
                  {ngo.description && (
                    <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                      {ngo.description}
                    </p>
                  )}

                  {/* Location */}
                  {ngo.city && ngo.city !== "Not specified" && (
                    <div className="mb-4 flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {ngo.city}
                        {ngo.state && ngo.state !== "Not specified"
                          ? `, ${ngo.state}`
                          : ""}
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mb-4 grid grid-cols-2 gap-3 border-t border-gray-200 pt-4">
                    {ngo.establishedYear && (
                      <div>
                        <p className="mb-1 text-xs text-gray-500">
                          Established
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {ngo.establishedYear}
                        </p>
                      </div>
                    )}
                    {ngo.beneficiariesServed && (
                      <div>
                        <p className="mb-1 text-xs text-gray-500">
                          Beneficiaries
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {ngo.beneficiariesServed.toLocaleString()}+
                        </p>
                      </div>
                    )}
                  </div>

                  {/* View More Button */}
                  <button
                    onClick={() => openDetailModal(ngo)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-700 sm:text-base"
                  >
                    View Details
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="scrollbar-hide max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">
                NGO Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 p-4 sm:p-6">
              {/* Images Gallery */}
              {selectedNGO.images && selectedNGO.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3">
                  {selectedNGO.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={`${selectedNGO.ngoName} ${idx + 1}`}
                      className="h-32 w-full rounded-xl border border-gray-200 object-cover sm:h-48"
                    />
                  ))}
                </div>
              )}

              {/* Basic Info */}
              <div>
                <div className="mb-4">
                  <h3 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
                    {selectedNGO.ngoName}
                  </h3>
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">
                      Verified Organization
                    </span>
                  </div>
                </div>

                {/* Category & Registration */}
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-1 text-xs text-gray-600 sm:text-sm">
                      Category
                    </p>
                    <p className="text-sm font-semibold text-gray-900 sm:text-base">
                      {selectedNGO.category}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-1 text-xs text-gray-600 sm:text-sm">
                      Registration Number
                    </p>
                    <p className="text-sm font-semibold text-gray-900 sm:text-base">
                      {selectedNGO.registrationNumber}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedNGO.description && (
                  <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-gray-900 sm:text-base">
                      About
                    </h4>
                    <p className="text-xs leading-relaxed text-gray-700 sm:text-sm">
                      {selectedNGO.description}
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 sm:text-base">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    {selectedNGO.email &&
                      selectedNGO.email !== "N/A" &&
                      selectedNGO.email !== "Contact via website" && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Mail className="h-5 w-5 flex-shrink-0 text-gray-500" />
                          <span className="text-xs break-all sm:text-sm">
                            {selectedNGO.email}
                          </span>
                        </div>
                      )}
                    {selectedNGO.phone &&
                      selectedNGO.phone !== "N/A" &&
                      selectedNGO.phone !== "Contact via website" && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Phone className="h-5 w-5 flex-shrink-0 text-gray-500" />
                          <span className="text-xs sm:text-sm">
                            {selectedNGO.phone}
                          </span>
                        </div>
                      )}
                    {selectedNGO.website && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Globe className="h-5 w-5 flex-shrink-0 text-gray-500" />
                        <a
                          href={selectedNGO.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs break-all text-blue-600 hover:underline sm:text-sm"
                        >
                          {selectedNGO.website}
                        </a>
                      </div>
                    )}
                    {selectedNGO.city &&
                      selectedNGO.city !== "Not specified" && (
                        <div className="flex items-start gap-3 text-gray-700">
                          <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
                          <span className="text-xs sm:text-sm">
                            {selectedNGO.address &&
                            selectedNGO.address !== "Location not specified"
                              ? `${selectedNGO.address}, `
                              : ""}
                            {selectedNGO.city}
                            {selectedNGO.state &&
                            selectedNGO.state !== "Not specified"
                              ? `, ${selectedNGO.state}`
                              : ""}
                            {selectedNGO.pincode
                              ? ` - ${selectedNGO.pincode}`
                              : ""}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Organization Stats */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {selectedNGO.establishedYear && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center sm:p-4">
                      <Calendar className="mx-auto mb-2 h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
                      <p className="mb-1 text-xs text-gray-600">Established</p>
                      <p className="text-sm font-bold text-gray-900 sm:text-base">
                        {selectedNGO.establishedYear}
                      </p>
                    </div>
                  )}
                  {selectedNGO.teamSize && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center sm:p-4">
                      <Users className="mx-auto mb-2 h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
                      <p className="mb-1 text-xs text-gray-600">Team Size</p>
                      <p className="text-sm font-bold text-gray-900 sm:text-base">
                        {selectedNGO.teamSize}
                      </p>
                    </div>
                  )}
                  {selectedNGO.beneficiariesServed && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center sm:p-4">
                      <Heart className="mx-auto mb-2 h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
                      <p className="mb-1 text-xs text-gray-600">
                        Beneficiaries
                      </p>
                      <p className="text-sm font-bold text-gray-900 sm:text-base">
                        {selectedNGO.beneficiariesServed.toLocaleString()}+
                      </p>
                    </div>
                  )}
                  {selectedNGO.founderName && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center sm:p-4">
                      <Users className="mx-auto mb-2 h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
                      <p className="mb-1 text-xs text-gray-600">Founder</p>
                      <p className="text-xs font-bold text-gray-900 sm:text-sm">
                        {selectedNGO.founderName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Verified Date */}
                {selectedNGO.verifiedAt && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-center text-xs text-green-700 sm:text-sm">
                      ✓ Verified on{" "}
                      {new Date(selectedNGO.verifiedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
