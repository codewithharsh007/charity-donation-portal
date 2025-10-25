"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Home, LayoutDashboard } from 'lucide-react';
import LoginPromptModal from '@/components/LoginPromptModal';

export default function DonatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('financial');
  const [viewMode, setViewMode] = useState('create'); // 'create' or 'history'
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Financial Donation State
  const [financialAmount, setFinancialAmount] = useState('');
  const [financialNote, setFinancialNote] = useState('');
  const [financialDonations, setFinancialDonations] = useState([]);
  
  // Item Donation State
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemsList, setItemsList] = useState([]);
  const [currentItem, setCurrentItem] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [itemDonations, setItemDonations] = useState([]);
  const [pickupAddress, setPickupAddress] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in - if not, show login modal
    const userData = localStorage.getItem('user');
    if (!userData) {
      setShowLoginModal(true);
    } else {
      setUser(JSON.parse(userData));
    }
    
    // Check if tab parameter is passed
    const tab = searchParams.get('tab');
    if (tab === 'history') {
      setViewMode('history');
    }
    fetchDonations();
  }, [searchParams]);

  const fetchDonations = async () => {
    try {
      // Fetch both financial and item donations
      const [financialRes, itemsRes] = await Promise.all([
        fetch('/api/donations/financial'),
        fetch('/api/donations/items?type=donor')
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
    const readFileAsDataURL = (f) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });

    const dataUrl = await readFileAsDataURL(file);

    const response = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dataUrl, filename: file.name }),
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return await response.json();
  };

  const handleFinancialDonation = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in - check localStorage for user data
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      setShowLoginModal(true);
      return;
    }
    
    setLoading(true);
    setError('');

    if (!financialAmount || Number(financialAmount) <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/donations/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(financialAmount),
          note: financialNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Donation failed');
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
    
    // Check if user is logged in - check localStorage for user data
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      setShowLoginModal(true);
      return;
    }
    
    setLoading(true);
    setError('');

    if (!itemCategory) {
      setError('Please select a category');
      setLoading(false);
      return;
    }

    if (itemsList.length === 0) {
      setError('Please add at least one item');
      setLoading(false);
      return;
    }

    if (imageFiles.length === 0) {
      setError('Please upload at least one image');
      setLoading(false);
      return;
    }

    if (videoFiles.length === 0) {
      setError('Please upload at least one video');
      setLoading(false);
      return;
    }

    if (!pickupAddress || !pickupAddress.trim()) {
      setError('Please provide pickup address');
      setLoading(false);
      return;
    }

    try {
      // Upload images
      const uploadedImages = await Promise.all(
        imageFiles.map(async (file) => {
          const result = await uploadToCloudinary(file);
          return {
            url: result.secure_url,
            publicId: result.public_id,
          };
        })
      );

      // Upload videos
      const uploadedVideos = await Promise.all(
        videoFiles.map(async (file) => {
          const result = await uploadToCloudinary(file);
          return {
            url: result.secure_url,
            publicId: result.public_id,
          };
        })
      );

      const res = await fetch('/api/donations/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(data.message || 'Donation failed');
      }

      // Redirect to thank you page with donation details
      router.push(`/thank-you?type=item&category=${encodeURIComponent(itemCategory)}&itemCount=${itemsList.length}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (currentItem.trim()) {
      setItemsList([...itemsList, currentItem.trim()]);
      setCurrentItem('');
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
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳', text: 'Pending Admin Review' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: '✅', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: '❌', text: 'Rejected' },
    };

    const deliveryMap = {
      not_picked_up: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📦', text: 'Awaiting Pickup' },
      picked_up: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🚚', text: 'Picked Up' },
      received: { color: 'bg-green-100 text-green-800 border-green-200', icon: '🎉', text: 'Received' },
    };

    const adminStatus = statusMap[donation.adminStatus] || statusMap.pending;
    const deliveryStatus = deliveryMap[donation.deliveryStatus];

    // Only show delivery status if approved and has been accepted by NGO
    const shouldShowDelivery = donation.adminStatus === 'approved' && donation.acceptedBy;

    return (
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${adminStatus.color}`}>
          <span className="mr-2">{adminStatus.icon}</span>
          {adminStatus.text}
        </span>
        {shouldShowDelivery && deliveryStatus && (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${deliveryStatus.color}`}>
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
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Make a Donation</h1>
                <p className="text-xs md:text-sm text-gray-400">Your generosity makes a difference</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={() => {
                    const dashboardPath = user.role === 'ngo' ? '/ngoDashboard' : '/donorDashboard';
                    router.push(dashboardPath);
                  }}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* View Mode Toggle */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('create')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  viewMode === 'create'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Make Donation
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  viewMode === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Donation History
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Create Donation View */}
            {viewMode === 'create' && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Make a Donation</h2>
                  <p className="text-gray-600">Choose what you'd like to donate</p>
                </div>

                {/* Donation Type Selection */}
                {!activeTab && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button
                      onClick={() => setActiveTab('financial')}
                      className="p-6 border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all text-center group"
                    >
                      <div className="text-5xl mb-3">💰</div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                        Financial Donation
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Donate money to support various causes
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab('items')}
                      className="p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
                    >
                      <div className="text-5xl mb-3">📦</div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        Item Donation
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Donate physical items like clothes, books, etc.
                      </p>
                    </button>
                  </div>
                )}

                {/* Financial Donation Form */}
                {activeTab === 'financial' && (
                  <div>
                    {/* Donation Type Selection Above */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <button
                        onClick={() => setActiveTab('financial')}
                        className="p-6 border-2 border-green-500 bg-green-50 rounded-2xl text-center"
                      >
                        <div className="text-5xl mb-3">💰</div>
                        <h3 className="text-lg font-semibold text-green-600">
                          Financial Donation
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">
                          Donate money to support various causes
                        </p>
                      </button>

                      <button
                        onClick={() => setActiveTab('items')}
                        className="p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
                      >
                        <div className="text-5xl mb-3">📦</div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                          Item Donation
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">
                          Donate physical items like clothes, books, etc.
                        </p>
                      </button>
                    </div>

                    <form onSubmit={handleFinancialDonation} className="space-y-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span>💵</span>
                          Amount
                        </h3>
                        <div className="relative max-w-xs mb-4">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
                          <input
                            type="number"
                            value={financialAmount}
                            onChange={(e) => setFinancialAmount(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-lg font-semibold text-black"
                            placeholder="0.00"
                            min="1"
                            required
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {[100, 500, 1000, 5000].map((amount) => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => setFinancialAmount(amount.toString())}
                              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:border-green-500 hover:text-green-600"
                            >
                              ₹{amount}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Note (Optional)
                        </label>
                        <textarea
                          value={financialNote}
                          onChange={(e) => setFinancialNote(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-black"
                          rows={3}
                          placeholder="Add a message or dedication..."
                        />
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg"
                      >
                        {loading ? 'Processing...' : 'Donate Now'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Item Donation Form */}
                {activeTab === 'items' && (
                  <div>
                    {/* Donation Type Selection Above */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <button
                        onClick={() => setActiveTab('financial')}
                        className="p-6 border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all text-center group"
                      >
                        <div className="text-5xl mb-3">💰</div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                          Financial Donation
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">
                          Donate money to support various causes
                        </p>
                      </button>

                      <button
                        onClick={() => setActiveTab('items')}
                        className="p-6 border-2 border-blue-500 bg-blue-50 rounded-2xl text-center"
                      >
                        <div className="text-5xl mb-3">📦</div>
                        <h3 className="text-lg font-semibold text-blue-600">
                          Item Donation
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">
                          Donate physical items like clothes, books, etc.
                        </p>
                      </button>
                    </div>

                    <form onSubmit={handleItemDonation} className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <select
                              value={itemCategory}
                              onChange={(e) => setItemCategory(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-black"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Items *</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={currentItem}
                                onChange={(e) => setCurrentItem(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-black"
                                placeholder="Enter item name"
                              />
                              <button
                                type="button"
                                onClick={addItem}
                                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                              >
                                Add
                              </button>
                            </div>
                            {itemsList.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {itemsList.map((item, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                              value={itemDescription}
                              onChange={(e) => setItemDescription(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-black"
                              rows={3}
                              placeholder="Describe the condition and details of items..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location *</label>
                            <textarea
                              value={pickupAddress}
                              onChange={(e) => setPickupAddress(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-black"
                              rows={3}
                              placeholder="Enter your complete pickup address..."
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Images *</h3>
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
                          className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400"
                        >
                          <span className="text-4xl">📸</span>
                          <p className="mt-2 text-gray-600">Click to upload images</p>
                        </label>
                        {imagePreviews.length > 0 && (
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Videos *</h3>
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
                          className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400"
                        >
                          <span className="text-4xl">🎥</span>
                          <p className="mt-2 text-gray-600">Click to upload videos</p>
                        </label>
                        {videoPreviews.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            {videoPreviews.map((preview, index) => (
                              <div key={index} className="relative">
                                <video src={preview} className="w-full h-24 object-cover rounded-lg" controls />
                                <button
                                  type="button"
                                  onClick={() => removeVideo(index)}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg"
                      >
                        {loading ? 'Submitting...' : 'Submit for Review'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* History View - Combined Donations */}
            {viewMode === 'history' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Donation History</h2>

                {/* Combined Donations List */}
                <div className="space-y-4">
                  {[...financialDonations.map(d => ({ ...d, type: 'financial' })), 
                    ...itemDonations.map(d => ({ ...d, type: 'item' }))]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-gray-500 text-lg">No donations yet</p>
                      <p className="text-gray-400 text-sm mt-2">Start making a difference today!</p>
                      <button
                        onClick={() => setViewMode('create')}
                        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Make Your First Donation
                      </button>
                    </div>
                  ) : (
                    [...financialDonations.map(d => ({ ...d, type: 'financial' })), 
                      ...itemDonations.map(d => ({ ...d, type: 'item' }))]
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((donation) => {
                        if (donation.type === 'financial') {
                          return (
                            <div
                              key={donation._id}
                              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">💰</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                      Financial
                                    </span>
                                  </div>
                                  <h3 className="text-2xl font-bold text-green-600">
                                    ₹{donation.amount?.toLocaleString()}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {new Date(donation.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                  {donation.note && (
                                    <p className="mt-2 text-gray-700 italic">{donation.note}</p>
                                  )}
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                  ✓ Completed
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-4">
                                Transaction ID: {donation.transactionId}
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={donation._id}
                              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">📦</span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                      Item Donation
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {donation.category}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {new Date(donation.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                {getStatusBadge(donation)}
                              </div>

                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
                                <div className="flex flex-wrap gap-2">
                                  {donation.items.map((item, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {donation.description && (
                                <p className="text-sm text-gray-700 mb-3">{donation.description}</p>
                              )}

                              {donation.pickupAddress && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                                  <p className="text-sm font-medium text-gray-800">Pickup Location:</p>
                                  <p className="text-sm text-gray-700">{donation.pickupAddress}</p>
                                </div>
                              )}

                              {donation.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                  <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                                  <p className="text-sm text-red-700">{donation.rejectionReason}</p>
                                </div>
                              )}

                              {donation.acceptedBy && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                  <p className="text-sm font-medium text-green-800">
                                    Accepted by: {donation.acceptedBy.userName}
                                  </p>
                                  <p className="text-sm text-green-700">
                                    Contact: {donation.acceptedBy.phone || donation.acceptedBy.email}
                                  </p>
                                </div>
                              )}

                              {(donation.images?.length > 0 || donation.videos?.length > 0) && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Media:</p>
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {donation.images?.map((img, index) => (
                                      <img
                                        key={`img-${index}`}
                                        src={img.url}
                                        alt={`Item ${index + 1}`}
                                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => window.open(img.url, '_blank')}
                                      />
                                    ))}
                                    {donation.videos?.map((video, index) => (
                                      <video
                                        key={`vid-${index}`}
                                        src={video.url}
                                        className="w-32 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-900"
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
