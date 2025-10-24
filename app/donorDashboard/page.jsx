"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DonorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('financial');
  const [showThankYou, setShowThankYou] = useState(false);
  const [lastDonation, setLastDonation] = useState(null);
  
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
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('create'); // 'create' or 'history'
  
  // Profile State
  const [profile, setProfile] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    userName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    fetchDonations();
  }, []);

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
      console.error('Fetch donations error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('user');
    router.push('/');
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

      setLastDonation(data.donation);
      setShowThankYou(true);
      setFinancialAmount('');
      setFinancialNote('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemDonation = async (e) => {
    e.preventDefault();
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

    if (imageFiles.length === 0 && videoFiles.length === 0) {
      setError('Please upload at least one image or video');
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Donation failed');
      }

      alert('Item donation submitted! It will be reviewed by admin.');
      // Reset form
      setItemCategory('');
      setItemDescription('');
      setItemsList([]);
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFiles([]);
      setVideoPreviews([]);
      setViewMode('history');
      fetchDonations();
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

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setProfileForm({
          userName: data.user?.userName || '',
          lastName: data.user?.lastName || '',
          phone: data.user?.phone || '',
          address: data.user?.address || '',
          city: data.user?.city || '',
          state: data.user?.state || '',
          pincode: data.user?.pincode || ''
        });
        setIsProfileOpen(true);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setIsEditingProfile(false);
        setProfileMessage('Profile updated successfully');
        setTimeout(() => setProfileMessage(''), 3000);
      }
    } catch (err) {
      setProfileMessage('Update failed');
    } finally {
      setProfileLoading(false);
    }
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

    return (
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${adminStatus.color}`}>
          <span className="mr-2">{adminStatus.icon}</span>
          {adminStatus.text}
        </span>
        {deliveryStatus && (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${deliveryStatus.color}`}>
            <span className="mr-2">{deliveryStatus.icon}</span>
            {deliveryStatus.text}
          </span>
        )}
      </div>
    );
  };

  if (showThankYou) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">🎉</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h1>
            <p className="text-xl text-gray-600 mb-6">
              Your generous donation of <span className="font-bold text-green-600">₹{lastDonation?.amount?.toLocaleString()}</span> has been received.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
            <p className="text-gray-700 text-sm">
              We will keep you informed via email about how your donation is being utilized to support various causes and make a real difference in the lives of those in need.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Transaction ID:</strong> {lastDonation?.transactionId}
            </p>
          </div>

          <button
            onClick={() => {
              setShowThankYou(false);
              fetchDonations();
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Donor Dashboard
              </h1>
              <p className="text-gray-300 mt-2">Make a difference in the world</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white hover:bg-gray-700 hover:border-blue-500 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </button>

              <button
                onClick={() => {
                  if (!isProfileOpen) fetchProfile();
                  else setIsProfileOpen(false);
                }}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white hover:bg-gray-700"
              >
                👤 Profile
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        {isProfileOpen && (
          <div className="mb-6 bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Profile</h3>
                <p className="text-sm text-gray-500 mt-1">Manage your account details</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditingProfile ? (
                  <>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setIsProfileOpen(false)}
                      className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleProfileSave}
                      disabled={profileLoading}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600">First name</label>
                {isEditingProfile ? (
                  <input
                    name="userName"
                    value={profileForm.userName}
                    onChange={(e) => setProfileForm({ ...profileForm, userName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-black"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.userName || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600">Last name</label>
                {isEditingProfile ? (
                  <input
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-black"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.lastName || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600">Phone</label>
                {isEditingProfile ? (
                  <input
                    name="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-black"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.phone || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600">Pincode</label>
                {isEditingProfile ? (
                  <input
                    name="pincode"
                    value={profileForm.pincode}
                    onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-black"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.pincode || '-'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">Address</label>
                {isEditingProfile ? (
                  <input
                    name="address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-black"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.address || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600">City</label>
                {isEditingProfile ? (
                  <input
                    name="city"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-black"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.city || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600">State</label>
                {isEditingProfile ? (
                  <input
                    name="state"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-black"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.state || '-'}</p>
                )}
              </div>
            </div>
            {profileMessage && (
              <div className="mt-4 text-sm text-center text-green-600">{profileMessage}</div>
            )}
          </div>
        )}

        {/* Main Content */}
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
                All Donation History
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Videos (Optional)</h3>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">All Donation History</h2>

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

                              {donation.images && donation.images.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Images:</p>
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {donation.images.map((img, index) => (
                                      <img
                                        key={index}
                                        src={img.url}
                                        alt={`Item ${index + 1}`}
                                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => window.open(img.url, '_blank')}
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
    </div>
  );
}
