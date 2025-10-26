"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Home, LayoutDashboard } from "lucide-react";
import LoginPromptModal from "@/components/LoginPromptModal";

// Helper function to convert file to base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
};

export default function DonatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("financial");
  const [viewMode, setViewMode] = useState("create"); // 'create' or 'history'
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Financial Donation State
  const [financialAmount, setFinancialAmount] = useState("");
  const [financialNote, setFinancialNote] = useState("");
  const [financialDonations, setFinancialDonations] = useState([]);

  // Item Donation State
  const [itemCategory, setItemCategory] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemsList, setItemsList] = useState([]);
  const [currentItem, setCurrentItem] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [itemDonations, setItemDonations] = useState([]);
  const [pickupAddress, setPickupAddress] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Check if user is logged in - if not, show login modal
    const userData = localStorage.getItem("user");
    if (!userData) {
      setShowLoginModal(true);
    } else {
      setUser(JSON.parse(userData));
    }

    // Check if tab parameter is passed
    const tab = searchParams.get("tab");
    if (tab === "history") {
      setViewMode("history");
    }
    fetchDonations();
  }, [searchParams]);

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
    } catch (err) {
      // Error handled silently
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      if (!file) {
        throw new Error("No file provided");
      }

      // Check file size
      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

      if (file.size > maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
        throw new Error(`File is ${sizeMB}MB, exceeds ${maxSizeMB}MB limit`);
      }

      // Convert to base64
      const base64Data = await convertFileToBase64(file);

      if (!base64Data || !base64Data.startsWith("data:")) {
        throw new Error("Failed to convert file");
      }

      // Upload
      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: base64Data,
          filename: file.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Upload failed");
      }

      return result;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleFinancialDonation = async (e) => {
    e.preventDefault();

    // Check if user is logged in - check localStorage for user data
    const userData = localStorage.getItem("user");

    if (!userData) {
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    setError("");

    if (!financialAmount || Number(financialAmount) <= 0) {
      setError("Please enter a valid amount");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/donations/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(financialAmount),
          note: financialNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Donation failed");
      }

      // Redirect to thank you page with donation details
      router.push(`/thank-you?type=financial&amount=${financialAmount}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemDonation = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    const userData = localStorage.getItem("user");

    if (!userData) {
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!itemCategory) {
        throw new Error("Please select a category");
      }

      if (itemsList.length === 0) {
        throw new Error("Please add at least one item");
      }

      if (imageFiles.length === 0) {
        throw new Error("Please upload at least one image");
      }

      if (videoFiles.length === 0) {
        throw new Error("Please upload at least one video");
      }

      if (!pickupAddress || !pickupAddress.trim()) {
        throw new Error("Please provide pickup address");
      }

      // Validate file objects
      const invalidImages = imageFiles.filter((f) => !(f instanceof File));
      if (invalidImages.length > 0) {
        throw new Error("Some images are invalid. Please re-upload them.");
      }

      const invalidVideos = videoFiles.filter((f) => !(f instanceof File));
      if (invalidVideos.length > 0) {
        throw new Error("Some videos are invalid. Please re-upload them.");
      }

      // Upload images
      setError(`Uploading images... (0/${imageFiles.length})`);
      const uploadedImages = [];

      for (let i = 0; i < imageFiles.length; i++) {
        try {
          setError(`Uploading image ${i + 1} of ${imageFiles.length}...`);

          const result = await uploadToCloudinary(imageFiles[i]);
          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } catch (err) {
          console.error(`❌ Failed to upload image ${i + 1}:`, err);
          throw new Error(`Failed to upload image ${i + 1}: ${err.message}`);
        }
      }

      // Upload videos
      setError(`Uploading videos... (0/${videoFiles.length})`);
      const uploadedVideos = [];
      const startTime = Date.now(); // ✅ Track total time

      for (let i = 0; i < videoFiles.length; i++) {
        try {
          const sizeMB = (videoFiles[i].size / 1024 / 1024).toFixed(1);
          setError(
            `Uploading video ${i + 1} of ${videoFiles.length}... ` +
              `(${sizeMB}MB - This may take 2-5 minutes, please wait)`,
          );

          const videoStartTime = Date.now(); // Track individual video time
          const result = await uploadToCloudinary(videoFiles[i]);
          const uploadSeconds = Math.round(
            (Date.now() - videoStartTime) / 1000,
          );

          uploadedVideos.push({
            url: result.secure_url,
            publicId: result.public_id,
          });

        } catch (err) {
          console.error(`❌ Video ${i + 1} failed:`, err);
          setError("");
          setLoading(false);

          alert(
            `❌ Video Upload Failed\n\n` +
              `Video: ${videoFiles[i].name}\n` +
              `Error: ${err.message}\n\n` +
              `Please try again or use a smaller/compressed video.`,
          );

          return; // Stop the form submission
        }
      }

      // Show success message after all videos uploaded
      const totalSeconds = Math.round((Date.now() - startTime) / 1000);
     

      // Submit donation
      setError("Submitting donation...");

      const res = await fetch("/api/donations/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsList,
          category: itemCategory,
          description: itemDescription,
          images: uploadedImages,
          videos: uploadedVideos,
          pickupAddress: pickupAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Donation submission failed");
      }

      // ✅ CLEAR ALL FORM DATA AND FILE INPUTS
      setError("");
      setSuccess("Donation submitted successfully! Redirecting...");

      // Clear form fields
      setItemCategory("");
      setItemsList([]);
      setItemDescription("");
      setPickupAddress("");

      // Clear file states
      setImageFiles([]);
      setVideoFiles([]);
      setImagePreviews([]);
      setVideoPreviews([]);

      // Clear the actual input elements
      const imageInput = document.getElementById("image-upload");
      const videoInput = document.getElementById("video-upload");
      if (imageInput) imageInput.value = "";
      if (videoInput) videoInput.value = "";

      // Redirect after a short delay
      setTimeout(() => {
        router.push(
          `/thank-you?type=item&category=${encodeURIComponent(itemCategory)}&itemCount=${itemsList.length}`,
        );
      }, 1500);
    } catch (err) {
      console.error("❌ Donation error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const addItem = () => {
    if (currentItem.trim()) {
      setItemsList([...itemsList, currentItem.trim()]);
      setCurrentItem("");
    }
  };

  const removeItem = (index) => {
    setItemsList(itemsList.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setImageFiles([...imageFiles, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setVideoFiles([...videoFiles, ...files]);

    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setVideoPreviews((prev) => [...prev, url]);
    });
  };

  const removeImage = (index) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideoFiles(videoFiles.filter((_, i) => i !== index));
    setVideoPreviews(videoPreviews.filter((_, i) => i !== index));
  };

  const getStatusBadge = (donation) => {
    const statusMap = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: "⏳",
        text: "Pending Admin Review",
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

    // Only show delivery status if approved and has been accepted by NGO
    const shouldShowDelivery =
      donation.adminStatus === "approved" && donation.acceptedBy;

    {
      /* Success/Error Messages */
    }
    {
      success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">✅ {success}</p>
        </div>
      );
    }

    {
      error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">❌ {error}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${adminStatus.color}`}
        >
          <span className="mr-2">{adminStatus.icon}</span>
          {adminStatus.text}
        </span>
        {shouldShowDelivery && deliveryStatus && (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${deliveryStatus.color}`}
          >
            <span className="mr-2">{deliveryStatus.icon}</span>
            {deliveryStatus.text}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 shadow-lg backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white md:text-2xl">
                  Make a Donation
                </h1>
                <p className="text-xs text-gray-400 md:text-sm">
                  Your generosity makes a difference
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={() => {
                    const dashboardPath =
                      user.role === "ngo" ? "/ngoDashboard" : "/donorDashboard";
                    router.push(dashboardPath);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>
              )}
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
          {/* View Mode Toggle */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("create")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === "create"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Make Donation
              </button>
              <button
                onClick={() => setViewMode("history")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === "history"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Donation History
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Create Donation View */}
            {viewMode === "create" && (
              <div className="mx-auto max-w-2xl">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-2xl font-bold text-gray-900">
                    Make a Donation
                  </h2>
                  <p className="text-gray-600">
                    Choose what you'd like to donate
                  </p>
                </div>

                {/* Donation Type Selection */}
                {!activeTab && (
                  <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <button
                      onClick={() => setActiveTab("financial")}
                      className="group rounded-2xl border-2 border-gray-200 p-6 text-center transition-all hover:border-green-500 hover:bg-green-50"
                    >
                      <div className="mb-3 text-5xl">💰</div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                        Financial Donation
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Donate money to support various causes
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab("items")}
                      className="group rounded-2xl border-2 border-gray-200 p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-50"
                    >
                      <div className="mb-3 text-5xl">📦</div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        Item Donation
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Donate physical items like clothes, books, etc.
                      </p>
                    </button>
                  </div>
                )}

                {/* Financial Donation Form */}
                {activeTab === "financial" && (
                  <div>
                    {/* Donation Type Selection Above */}
                    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <button
                        onClick={() => setActiveTab("financial")}
                        className="rounded-2xl border-2 border-green-500 bg-green-50 p-6 text-center"
                      >
                        <div className="mb-3 text-5xl">💰</div>
                        <h3 className="text-lg font-semibold text-green-600">
                          Financial Donation
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                          Donate money to support various causes
                        </p>
                      </button>

                      <button
                        onClick={() => setActiveTab("items")}
                        className="group rounded-2xl border-2 border-gray-200 p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-50"
                      >
                        <div className="mb-3 text-5xl">📦</div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                          Item Donation
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                          Donate physical items like clothes, books, etc.
                        </p>
                      </button>
                    </div>

                    <form
                      onSubmit={handleFinancialDonation}
                      className="space-y-6"
                    >
                      <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                          <span>💵</span>
                          Amount
                        </h3>
                        <div className="relative mb-4 max-w-xs">
                          <span className="absolute top-1/2 left-4 -translate-y-1/2 transform text-lg text-gray-500">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={financialAmount}
                            onChange={(e) => setFinancialAmount(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 py-4 pr-4 pl-12 text-lg font-semibold text-black focus:ring-2 focus:ring-green-500"
                            placeholder="0.00"
                            min="1"
                            required
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[100, 500, 1000, 5000].map((amount) => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() =>
                                setFinancialAmount(amount.toString())
                              }
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:border-green-500 hover:text-green-600"
                            >
                              ₹{amount}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Note (Optional)
                        </label>
                        <textarea
                          value={financialNote}
                          onChange={(e) => setFinancialNote(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black focus:ring-2 focus:ring-green-500"
                          rows={3}
                          placeholder="Add a message or dedication..."
                        />
                      </div>

                      {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Donate Now"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Item Donation Form */}
                {activeTab === "items" && (
                  <div>
                    {/* Donation Type Selection Above */}
                    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <button
                        onClick={() => setActiveTab("financial")}
                        className="group rounded-2xl border-2 border-gray-200 p-6 text-center transition-all hover:border-green-500 hover:bg-green-50"
                      >
                        <div className="mb-3 text-5xl">💰</div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                          Financial Donation
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                          Donate money to support various causes
                        </p>
                      </button>

                      <button
                        onClick={() => setActiveTab("items")}
                        className="rounded-2xl border-2 border-blue-500 bg-blue-50 p-6 text-center"
                      >
                        <div className="mb-3 text-5xl">📦</div>
                        <h3 className="text-lg font-semibold text-blue-600">
                          Item Donation
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                          Donate physical items like clothes, books, etc.
                        </p>
                      </button>
                    </div>

                    <form onSubmit={handleItemDonation} className="space-y-6">
                      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                          Item Details
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Category *
                            </label>
                            <select
                              value={itemCategory}
                              onChange={(e) => setItemCategory(e.target.value)}
                              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">Select a category</option>
                              <option>Food Items</option>
                              <option>Clothes</option>
                              <option>Books & Stationery</option>
                              <option>Toys</option>
                              <option>Medicines & Health Kits</option>
                              <option>Electronics</option>
                              <option>Household Items</option>
                              <option>Bicycle / Vehicle</option>
                              <option>Festival Kit / Hygiene Pack</option>
                              <option>Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Items *
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={currentItem}
                                onChange={(e) => setCurrentItem(e.target.value)}
                                onKeyPress={(e) =>
                                  e.key === "Enter" &&
                                  (e.preventDefault(), addItem())
                                }
                                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-black focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter item name"
                              />
                              <button
                                type="button"
                                onClick={addItem}
                                className="rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
                              >
                                Add
                              </button>
                            </div>
                            {itemsList.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {itemsList.map((item, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800"
                                  >
                                    {item}
                                    <button
                                      type="button"
                                      onClick={() => removeItem(index)}
                                      className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Description
                            </label>
                            <textarea
                              value={itemDescription}
                              onChange={(e) =>
                                setItemDescription(e.target.value)
                              }
                              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Describe the condition and details of items..."
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Pickup Location *
                            </label>
                            <textarea
                              value={pickupAddress}
                              onChange={(e) => setPickupAddress(e.target.value)}
                              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Enter your complete pickup address..."
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                          Upload Images *
                        </h3>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-400"
                        >
                          <span className="text-4xl">📸</span>
                          <p className="mt-2 text-gray-600">
                            Click to upload images
                          </p>
                        </label>
                        {imagePreviews.length > 0 && (
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="h-24 w-full rounded-lg object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                          Upload Videos *
                        </h3>
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={handleVideoUpload}
                          className="hidden"
                          id="video-upload"
                        />
                        <label
                          htmlFor="video-upload"
                          className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-purple-400"
                        >
                          <span className="text-4xl">🎥</span>
                          <p className="mt-2 text-gray-600">
                            Click to upload videos
                          </p>
                        </label>
                        {videoPreviews.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            {videoPreviews.map((preview, index) => (
                              <div key={index} className="relative">
                                <video
                                  src={preview}
                                  className="h-24 w-full rounded-lg object-cover"
                                  controls
                                />
                                <button
                                  type="button"
                                  onClick={() => removeVideo(index)}
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Submitting..." : "Submit for Review"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* History View - Combined Donations */}
            {viewMode === "history" && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  Complete Donation History
                </h2>

                {/* Combined Donations List */}
                <div className="space-y-4">
                  {[
                    ...financialDonations.map((d) => ({
                      ...d,
                      type: "financial",
                    })),
                    ...itemDonations.map((d) => ({ ...d, type: "item" })),
                  ].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
                  ).length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mb-4 text-6xl">📭</div>
                      <p className="text-lg text-gray-500">No donations yet</p>
                      <p className="mt-2 text-sm text-gray-400">
                        Start making a difference today!
                      </p>
                      <button
                        onClick={() => setViewMode("create")}
                        className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
                      >
                        Make Your First Donation
                      </button>
                    </div>
                  ) : (
                    [
                      ...financialDonations.map((d) => ({
                        ...d,
                        type: "financial",
                      })),
                      ...itemDonations.map((d) => ({ ...d, type: "item" })),
                    ]
                      .sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
                      )
                      .map((donation) => {
                        if (donation.type === "financial") {
                          return (
                            <div
                              key={donation._id}
                              className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-2xl">💰</span>
                                    <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                      Financial
                                    </span>
                                  </div>
                                  <h3 className="text-2xl font-bold text-green-600">
                                    ₹{donation.amount?.toLocaleString()}
                                  </h3>
                                  <p className="mt-1 text-sm text-gray-600">
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
                                    <p className="mt-2 text-gray-700 italic">
                                      {donation.note}
                                    </p>
                                  )}
                                </div>
                                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                  ✓ Completed
                                </span>
                              </div>
                              <p className="mt-4 text-xs text-gray-500">
                                Transaction ID: {donation.transactionId}
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={donation._id}
                              className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6"
                            >
                              <div className="mb-4 flex items-start justify-between">
                                <div>
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-2xl">📦</span>
                                    <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                      Item Donation
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {donation.category}
                                  </h3>
                                  <p className="mt-1 text-sm text-gray-600">
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

                              <div className="mb-3">
                                <p className="mb-1 text-sm font-medium text-gray-700">
                                  Items:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {donation.items.map((item, index) => (
                                    <span
                                      key={index}
                                      className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {donation.description && (
                                <p className="mb-3 text-sm text-gray-700">
                                  {donation.description}
                                </p>
                              )}

                              {donation.pickupAddress && (
                                <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                  <p className="text-sm font-medium text-gray-800">
                                    Pickup Location:
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    {donation.pickupAddress}
                                  </p>
                                </div>
                              )}

                              {donation.rejectionReason && (
                                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
                                  <p className="text-sm font-medium text-red-800">
                                    Rejection Reason:
                                  </p>
                                  <p className="text-sm text-red-700">
                                    {donation.rejectionReason}
                                  </p>
                                </div>
                              )}

                              {donation.acceptedBy && (
                                <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3">
                                  <p className="text-sm font-medium text-green-800">
                                    Accepted by: {donation.acceptedBy.userName}
                                  </p>
                                  <p className="text-sm text-green-700">
                                    Contact:{" "}
                                    {donation.acceptedBy.phone ||
                                      donation.acceptedBy.email}
                                  </p>
                                </div>
                              )}

                              {(donation.images?.length > 0 ||
                                donation.videos?.length > 0) && (
                                <div className="mt-4">
                                  <p className="mb-2 text-sm font-medium text-gray-700">
                                    Media:
                                  </p>
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {donation.images?.map((img, index) => (
                                      <img
                                        key={`img-${index}`}
                                        src={img.url}
                                        alt={`Item ${index + 1}`}
                                        className="h-24 w-24 flex-shrink-0 cursor-pointer rounded-lg object-cover transition-transform hover:scale-105"
                                        onClick={() =>
                                          window.open(img.url, "_blank")
                                        }
                                      />
                                    ))}
                                    {donation.videos?.map((video, index) => (
                                      <video
                                        key={`vid-${index}`}
                                        src={video.url}
                                        className="h-24 w-32 flex-shrink-0 rounded-lg bg-gray-900 object-cover"
                                        controls
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Required Modal */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Please login to make a donation and track your contributions."
        disableTimer={true}
      />
    </div>
  );
}
