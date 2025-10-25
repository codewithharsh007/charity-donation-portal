"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function AdminItemDonationsPage() {
  const router = useRouter();
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  
  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'info'
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const showConfirm = (title, message, onConfirm, type = 'info') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const closeConfirm = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [activeFilter, donations]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/item-donations');
      if (res.ok) {
        const data = await res.json();
        setDonations(data.donations || []);
      } else {
        const data = await res.json();
        if (res.status === 403) {
          showToast('Access denied. Admin only.', 'error');
          router.push('/');
        } else {
          showToast(data.message || 'Failed to fetch donations', 'error');
        }
      }
    } catch (err) {
      showToast('Failed to fetch donations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterDonations = () => {
    if (activeFilter === 'all') {
      setFilteredDonations(donations);
    } else {
      setFilteredDonations(donations.filter(d => d.adminStatus === activeFilter));
    }
  };

  const handleApprove = async (donationId) => {
    showConfirm(
      'Approve Donation',
      'Are you sure you want to approve this donation? This action will notify the donor and make it available to NGOs.',
      async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`/api/admin/item-donations/${donationId}/approve`, {
            method: 'POST',
          });

          const data = await res.json();

          if (res.ok) {
            showToast('Donation approved successfully!', 'success');
            fetchDonations();
          } else {
            showToast(data.message || 'Failed to approve donation', 'error');
          }
        } catch (err) {
          showToast('Failed to approve donation', 'error');
        } finally {
          setActionLoading(false);
        }
      },
      'success'
    );
  };

  const openRejectModal = (donation) => {
    setSelectedDonation(donation);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a reason for rejection', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/item-donations/${selectedDonation._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Donation rejected successfully!', 'success');
        setShowRejectModal(false);
        setSelectedDonation(null);
        setRejectionReason('');
        fetchDonations();
      } else {
        showToast(data.message || 'Failed to reject donation', 'error');
      }
    } catch (err) {
      showToast('Failed to reject donation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳', text: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: '✅', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: '❌', text: 'Rejected' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <span className="mr-2">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const getFilterCount = (filter) => {
    if (filter === 'all') return donations.length;
    return donations.filter(d => d.adminStatus === filter).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
     

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden mb-6">
          <div className="border-b border-gray-700 bg-gray-800">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex items-center gap-2 py-4 px-6 text-center border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'border-blue-500 text-blue-400 bg-gray-700 shadow-sm'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                <span>📋</span>
                All Donations
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === 'all' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'
                }`}>
                  {getFilterCount('all')}
                </span>
              </button>
              <button
                onClick={() => setActiveFilter('pending')}
                className={`flex items-center gap-2 py-4 px-6 text-center border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                  activeFilter === 'pending'
                    ? 'border-yellow-500 text-yellow-400 bg-gray-700 shadow-sm'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                <span>⏳</span>
                Pending
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === 'pending' ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-700 text-gray-400'
                }`}>
                  {getFilterCount('pending')}
                </span>
              </button>
              <button
                onClick={() => setActiveFilter('approved')}
                className={`flex items-center gap-2 py-4 px-6 text-center border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                  activeFilter === 'approved'
                    ? 'border-green-500 text-green-400 bg-gray-700 shadow-sm'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                <span>✅</span>
                Approved
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === 'approved' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                }`}>
                  {getFilterCount('approved')}
                </span>
              </button>
              <button
                onClick={() => setActiveFilter('rejected')}
                className={`flex items-center gap-2 py-4 px-6 text-center border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                  activeFilter === 'rejected'
                    ? 'border-red-500 text-red-400 bg-gray-700 shadow-sm'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                <span>❌</span>
                Rejected
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === 'rejected' ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-400'
                }`}>
                  {getFilterCount('rejected')}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Donations Grid */}
        {filteredDonations.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Donations Found</h3>
            <p className="text-gray-400">
              {activeFilter === 'all' 
                ? 'There are no item donations yet.' 
                : `There are no ${activeFilter} item donations.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDonations.map((donation) => (
              <div
                key={donation._id}
                className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Donation Header */}
                <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 border-b border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-white">{donation.category}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(donation.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {getStatusBadge(donation.adminStatus)}
                  </div>
                </div>

                {/* Donation Body */}
                <div className="p-6">
                  {/* Items List */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-300 mb-2">Items:</p>
                    <div className="flex flex-wrap gap-2">
                      {donation.items.map((item, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  {donation.description && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-300 mb-1">Description:</p>
                      <p className="text-sm text-gray-400 bg-gray-700 rounded-lg p-3">
                        {donation.description}
                      </p>
                    </div>
                  )}

                  {/* Media - Images and Videos Combined */}
                  {((donation.images && donation.images.length > 0) || (donation.videos && donation.videos.length > 0)) && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-300 mb-2">Media:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {donation.images?.map((img, index) => (
                          <div key={`img-${index}`} className="relative group">
                            <img
                              src={img.url}
                              alt={`Item ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(img.url, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        ))}
                        {donation.videos?.map((video, index) => (
                          <video
                            key={`vid-${index}`}
                            src={video.url}
                            className="w-full h-24 object-cover rounded-lg bg-gray-900"
                            controls
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Donor Information */}
                  <div className="mb-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-4 border border-gray-600">
                    <p className="text-sm font-semibold text-gray-300 mb-2">Donor Information:</p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-300">
                        <span className="font-medium">Name:</span> {donation.donor?.userName} {donation.donor?.lastName}
                      </p>
                      <p className="text-sm text-gray-300">
                        <span className="font-medium">Email:</span> {donation.donor?.email}
                      </p>
                      {donation.donor?.phone && (
                        <p className="text-sm text-gray-300">
                          <span className="font-medium">Phone:</span> {donation.donor.phone}
                        </p>
                      )}
                      {donation.donor?.address && (
                        <p className="text-sm text-gray-300">
                          <span className="font-medium">Address:</span> {donation.donor.address}, {donation.donor.city}, {donation.donor.state} - {donation.donor.pincode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pickup Location */}
                  {(donation.pickupAddress || donation.donor?.address) && (
                    <div className="mb-4 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-300 mb-2">📍 Pickup Location:</p>
                      <p className="text-sm text-blue-200">
                        {donation.pickupAddress || `${donation.donor?.address}, ${donation.donor?.city}, ${donation.donor?.state} - ${donation.donor?.pincode}`}
                      </p>
                      {!donation.pickupAddress && donation.donor?.address && (
                        <p className="text-xs text-blue-400 mt-1 italic">
                          (Using donor's profile address - pickup address not specified)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {donation.rejectionReason && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{donation.rejectionReason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {donation.adminStatus === 'pending' && (
                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
                      <button
                        onClick={() => handleApprove(donation._id)}
                        disabled={actionLoading}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(donation)}
                        disabled={actionLoading}
                        className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  )}

                  {donation.adminStatus === 'approved' && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-center">
                        <p className="text-sm font-medium text-green-400">
                          ✓ This donation has been approved and is available for NGOs
                        </p>
                      </div>
                    </div>
                  )}

                  {donation.adminStatus === 'rejected' && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-center">
                        <p className="text-sm font-medium text-red-400">
                          ✗ This donation has been rejected
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Reject Donation</h3>
                <p className="text-sm text-gray-600 mt-1">Please provide a reason for rejection</p>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-black"
                rows={4}
                placeholder="Explain why this donation is being rejected..."
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Donation'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          if (confirmDialog.onConfirm) {
            confirmDialog.onConfirm();
          }
          closeConfirm();
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.type === 'success' ? 'Approve' : 'Confirm'}
        confirmColor={confirmDialog.type === 'success' ? 'green-600' : 'red-600'}
      />
    </div>
  );
}
