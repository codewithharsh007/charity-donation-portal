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
  Award,
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
      {/* Header - Dark Gray/Black Theme */}
      <div className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Shield className="h-8 w-8 text-green-400" />
                Verified NGOs
              </h1>
              <p className="mt-1 text-gray-400">
                Browse trusted and verified organizations
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700"
            >
              Back to Home
            </button>
          </div>
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
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-4 pl-12 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-red-500 focus:outline-none"
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

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="h-5 w-5 flex-shrink-0 text-gray-500" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-red-600 text-white shadow-md"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
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
                    {/* ❌ REMOVED: Tier badge */}
                  </div>
                ) : (
                  <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Building2 className="h-16 w-16 text-gray-400" />
                    {/* ❌ REMOVED: Tier badge */}
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white shadow-md transition-all hover:bg-red-700"
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
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900">NGO Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 p-6">
              {/* Images Gallery */}
              {selectedNGO.images && selectedNGO.images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {selectedNGO.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={`${selectedNGO.ngoName} ${idx + 1}`}
                      className="h-48 w-full rounded-xl border border-gray-200 object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Basic Info */}
              <div>
                <div className="mb-4">
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">
                    {selectedNGO.ngoName}
                  </h3>
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-600">
                      Verified Organization
                    </span>
                  </div>
                </div>

                {/* Category & Registration */}
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">Category</p>
                    <p className="font-semibold text-gray-900">
                      {selectedNGO.category}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">
                      Registration Number
                    </p>
                    <p className="font-semibold text-gray-900">
                      {selectedNGO.registrationNumber}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedNGO.description && (
                  <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-2 font-semibold text-gray-900">About</h4>
                    <p className="text-sm leading-relaxed text-gray-700">
                      {selectedNGO.description}
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h4 className="mb-3 font-semibold text-gray-900">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    {selectedNGO.email &&
                      selectedNGO.email !== "N/A" &&
                      selectedNGO.email !== "Contact via website" && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Mail className="h-5 w-5 text-gray-500" />
                          <span className="text-sm">{selectedNGO.email}</span>
                        </div>
                      )}
                    {selectedNGO.phone &&
                      selectedNGO.phone !== "N/A" &&
                      selectedNGO.phone !== "Contact via website" && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Phone className="h-5 w-5 text-gray-500" />
                          <span className="text-sm">{selectedNGO.phone}</span>
                        </div>
                      )}
                    {selectedNGO.website && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Globe className="h-5 w-5 text-gray-500" />
                        <a
                          href={selectedNGO.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedNGO.website}
                        </a>
                      </div>
                    )}
                    {/* ✅ FIXED: Only show if location exists */}
                    {selectedNGO.city &&
                      selectedNGO.city !== "Not specified" && (
                        <div className="flex items-start gap-3 text-gray-700">
                          <MapPin className="mt-0.5 h-5 w-5 text-gray-500" />
                          <span className="text-sm">
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
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {selectedNGO.establishedYear && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                      <Calendar className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                      <p className="mb-1 text-xs text-gray-600">Established</p>
                      <p className="font-bold text-gray-900">
                        {selectedNGO.establishedYear}
                      </p>
                    </div>
                  )}
                  {selectedNGO.teamSize && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                      <Users className="mx-auto mb-2 h-6 w-6 text-green-600" />
                      <p className="mb-1 text-xs text-gray-600">Team Size</p>
                      <p className="font-bold text-gray-900">
                        {selectedNGO.teamSize}
                      </p>
                    </div>
                  )}
                  {selectedNGO.beneficiariesServed && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                      <Heart className="mx-auto mb-2 h-6 w-6 text-red-600" />
                      <p className="mb-1 text-xs text-gray-600">
                        Beneficiaries
                      </p>
                      <p className="font-bold text-gray-900">
                        {selectedNGO.beneficiariesServed.toLocaleString()}+
                      </p>
                    </div>
                  )}
                  {selectedNGO.founderName && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                      <Users className="mx-auto mb-2 h-6 w-6 text-purple-600" />
                      <p className="mb-1 text-xs text-gray-600">Founder</p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedNGO.founderName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Verified Date */}
                {selectedNGO.verifiedAt && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-center text-sm text-green-700">
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
