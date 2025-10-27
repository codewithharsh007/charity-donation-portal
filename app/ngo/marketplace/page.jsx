"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, Phone, User, CheckCircle, TruckIcon, Box } from 'lucide-react';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function NGOMarketplacePage() {
  const router = useRouter();
  const [donations, setDonations] = useState([]);
  const [acceptedDonations, setAcceptedDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'accepted'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    donationId: null,
  });

  const categories = [
    'all',
    'Food Items',
    'Clothes',
    'Books & Stationery',
    'Toys',
    'Medicines & Health Kits',
    'Electronics',
    'Household Items',
    'Bicycle / Vehicle',
    'Festival Kit / Hygiene Pack',
    'Other'
  ];

  useEffect(() => {
    // Check if user is NGO and verified
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'ngo') {
      showToast('Access denied. NGO only.', 'error');
      router.push('/');
      return;
    }

    // Check if NGO is verified
    if (!user.isVerified) {
      showToast('Access denied. Only verified NGOs can access the marketplace.', 'error');
      router.push('/ngo/dashboard');
      return;
    }
    
    fetchDonations();
  }, [router, activeTab]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const fetchDonations = async () => {
    setLoading(true);
    try {
      if (activeTab === 'available') {
        const res = await fetch('/api/donations/items?type=ngo&filter=available');
        if (res.ok) {
          const data = await res.json();
          setDonations(data.donations || []);
        } else {
          showToast('Failed to fetch available donations', 'error');
        }
      } else {
        const res = await fetch('/api/donations/items?type=ngo&filter=accepted');
        if (res.ok) {
          const data = await res.json();
          setAcceptedDonations(data.donations || []);
        } else {
          showToast('Failed to fetch accepted donations', 'error');
        }
      }
    } catch (err) {
      showToast('Failed to fetch donations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDonation = async (donationId) => {
    try {
      const res = await fetch(`/api/donations/items/${donationId}/accept`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Donation accepted successfully! Check your email for donor details.', 'success');
        fetchDonations();
      } else {
        showToast(data.message || 'Failed to accept donation', 'error');
      }
    } catch (err) {
      showToast('Failed to accept donation', 'error');
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
    try {
      const res = await fetch(`/api/donations/items/${donationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
        fetchDonations();
      } else {
        showToast(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const filteredDonations = donations.filter(
    d => selectedCategory === 'all' || d.category === selectedCategory
  );

  const filteredAcceptedDonations = acceptedDonations.filter(
    d => selectedCategory === 'all' || d.category === selectedCategory
  );

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // Error handled silently
    }
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">NGO Marketplace</h1>
                <p className="text-xs md:text-sm text-gray-400">Browse and accept item donations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </button>
              <button
                onClick={() => router.push('/ngo/dashboard')}
                className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'available'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-[#1e293b] border border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            Available Donations
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'accepted'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-[#1e293b] border border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            My Accepted Donations
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-6 bg-[#1e293b] border border-gray-700/50 rounded-xl p-5">
          <label className="block text-sm font-semibold text-white mb-3">Filter by Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Available Donations Tab */}
        {activeTab === 'available' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                <p className="text-gray-400 mt-4">Loading donations...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="text-center py-16 bg-[#1e293b] border border-gray-700/50 rounded-2xl">
                <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-12 h-12 text-gray-500" />
                </div>
                <p className="text-gray-300 text-lg font-semibold">No available donations</p>
                <p className="text-gray-500 text-sm mt-2">Check back later for new items</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDonations.map((donation) => (
                  <div
                    key={donation._id}
                    className="bg-[#1e293b] rounded-2xl overflow-hidden border border-gray-700/50 hover:border-red-500/50 transition-all hover:shadow-lg"
                  >
                    {/* Images */}
                    {donation.images && donation.images.length > 0 && (
                      <div className="relative h-48 bg-gray-900">
                        <img
                          src={donation.images[0].url}
                          alt="Donation"
                          className="w-full h-full object-cover"
                        />
                        {donation.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                            <Box className="w-3 h-3" />
                            +{donation.images.length - 1}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5">
                      {/* Category Badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium mb-3">
                        <Package className="w-3.5 h-3.5" />
                        {donation.category}
                      </div>

                      {/* Items List */}
                      <div className="mb-4">
                        <h3 className="text-white font-semibold mb-2 text-sm">Items:</h3>
                        <div className="flex flex-wrap gap-2">
                          {donation.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-xs"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      {donation.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {donation.description}
                        </p>
                      )}

                      {/* Donor Info */}
                      <div className="border-t border-gray-700 pt-3 mb-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-gray-500">Pickup Location</span>
                        </div>
                        <p className="text-gray-300 text-sm font-medium">
                          {donation.donor?.city || 'Not specified'}, {donation.donor?.state || 'N/A'}
                        </p>
                      </div>

                      {/* Videos Badge */}
                      {donation.videos && donation.videos.length > 0 && (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs">
                            🎥 {donation.videos.length} video{donation.videos.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Accept Button */}
                      <button
                        onClick={() => openAcceptConfirm(donation._id)}
                        className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
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
        {activeTab === 'accepted' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                <p className="text-gray-400 mt-4">Loading your donations...</p>
              </div>
            ) : filteredAcceptedDonations.length === 0 ? (
              <div className="text-center py-16 bg-[#1e293b] border border-gray-700/50 rounded-2xl">
                <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-12 h-12 text-gray-500" />
                </div>
                <p className="text-gray-300 text-lg font-semibold">No accepted donations yet</p>
                <p className="text-gray-500 text-sm mt-2">Accept donations from the available tab</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredAcceptedDonations.map((donation) => (
                  <div
                    key={donation._id}
                    className="bg-[#1e293b] rounded-2xl border border-gray-700/50 overflow-hidden hover:border-gray-600 transition-all"
                  >
                      <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Media Section - Images and Videos Combined */}
                        {((donation.images && donation.images.length > 0) || (donation.videos && donation.videos.length > 0)) && (
                          <div className="lg:w-1/3">
                            <div className="grid grid-cols-2 gap-2">
                              {donation.images?.slice(0, 2).map((img, idx) => (
                                <img
                                  key={`img-${idx}`}
                                  src={img.url}
                                  alt={`Item ${idx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-700"
                                />
                              ))}
                              {donation.videos?.slice(0, 2).map((video, idx) => (
                                <video
                                  key={`vid-${idx}`}
                                  src={video.url}
                                  controls
                                  className="w-full h-32 object-cover rounded-lg bg-gray-900 border border-gray-700"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Details Section */}
                        <div className={((donation.images && donation.images.length > 0) || (donation.videos && donation.videos.length > 0)) ? "lg:w-2/3" : "w-full"}>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm font-medium mb-2">
                                <Package className="w-3.5 h-3.5" />
                                {donation.category}
                              </span>
                              <h3 className="text-lg font-bold text-white mt-2">
                                {donation.items.join(', ')}
                              </h3>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                donation.deliveryStatus === 'received'
                                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                  : donation.deliveryStatus === 'picked_up'
                                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                                  : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                              }`}>
                                {donation.deliveryStatus === 'received' && <CheckCircle className="w-3.5 h-3.5" />}
                                {donation.deliveryStatus === 'picked_up' && <TruckIcon className="w-3.5 h-3.5" />}
                                {donation.deliveryStatus?.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          {donation.description && (
                            <p className="text-gray-400 text-sm mb-4">{donation.description}</p>
                          )}

                          {/* Donor Details */}
                          <div className="bg-[#2d3748] border border-gray-700/50 rounded-xl p-4 mb-4">
                            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-400" />
                              Pickup Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="w-3.5 h-3.5 text-gray-500" />
                                  <p className="text-gray-500 text-xs">Donor Name</p>
                                </div>
                                <p className="text-gray-300 font-medium">{donation.donor?.userName || 'N/A'}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                                  <p className="text-gray-500 text-xs">Phone</p>
                                </div>
                                <p className="text-gray-300 font-medium">{donation.pickupPhone || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                  <p className="text-gray-500 text-xs">Pickup Address</p>
                                </div>
                                <p className="text-gray-300 font-medium">{donation.pickupAddress || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Status Update Buttons */}
                          <div className="flex gap-3">
                            {donation.deliveryStatus === 'not_picked_up' && (
                              <button
                                onClick={() => handleUpdateStatus(donation._id, 'picked_up')}
                                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                              >
                                <TruckIcon className="w-4 h-4" />
                                Mark as Picked Up
                              </button>
                            )}
                            {donation.deliveryStatus === 'picked_up' && (
                              <button
                                onClick={() => handleUpdateStatus(donation._id, 'received')}
                                className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Mark as Received
                              </button>
                            )}
                            {donation.deliveryStatus === 'received' && (
                              <div className="flex items-center text-green-400 font-medium">
                                <CheckCircle className="w-5 h-5 mr-2" />
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
