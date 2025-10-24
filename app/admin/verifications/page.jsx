'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const modalBackdropRef = useRef(null);
  const [user, setUser] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [filteredVerifications, setFilteredVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchVerifications();
    }
  }, [user, filter]);

  // Lock body scroll when modal is shown
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const checkAuth = () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(parsedUser);
  };

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? '/api/admin/verifications' 
        : `/api/admin/verifications?status=${filter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setVerifications(data.verifications || []);
        setFilteredVerifications(data.verifications || []);
      } else {
        setError('Failed to fetch verifications');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    if (modalBackdropRef.current) {
      modalBackdropRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const openModal = (verification) => {
    setSelectedVerification(verification);
    setShowModal(true);
    setRejectionReason('');
    setAdminNotes('');
    setError('');
    setSuccess('');
    setTimeout(scrollToTop, 100);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVerification(null);
    setRejectionReason('');
    setAdminNotes('');
  };

  const handleApprove = async () => {
    if (!selectedVerification) return;

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/admin/verifications/${selectedVerification._id}/approve`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('NGO verified successfully! Email sent to NGO.');
        setTimeout(() => {
          closeModal();
          fetchVerifications();
        }, 2000);
      } else {
        setError(data.message || 'Failed to approve verification');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification) return;

    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/admin/verifications/${selectedVerification._id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rejectionReason,
            adminNotes,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `Application rejected. Attempts remaining: ${data.attemptsRemaining}. Email sent to NGO.`
        );
        setTimeout(() => {
          closeModal();
          fetchVerifications();
        }, 2000);
      } else {
        setError(data.message || 'Failed to reject verification');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      localStorage.removeItem('user');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-xl text-white">Checking permissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-6 py-3 font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`rounded-lg px-6 py-3 font-semibold transition-all ${
              filter === 'accepted'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`rounded-lg px-6 py-3 font-semibold transition-all ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-lg px-6 py-3 font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Pending
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          {(filter === 'all' || filter === 'pending') && (
            <button
              onClick={() => setFilter('pending')}
              className="rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 shadow-xl text-left transition-transform hover:scale-105 cursor-pointer"
            >
              <h3 className="text-sm font-medium text-yellow-100">Pending</h3>
              <p className="mt-2 text-3xl font-bold text-white">
                {verifications.filter((v) => v.verificationStatus === 'pending').length}
              </p>
            </button>
          )}
          {(filter === 'all' || filter === 'accepted') && (
            <button
              onClick={() => setFilter('accepted')}
              className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 shadow-xl text-left transition-transform hover:scale-105 cursor-pointer"
            >
              <h3 className="text-sm font-medium text-green-100">Accepted</h3>
              <p className="mt-2 text-3xl font-bold text-white">
                {verifications.filter((v) => v.verificationStatus === 'accepted').length}
              </p>
            </button>
          )}
          {(filter === 'all' || filter === 'rejected') && (
            <button
              onClick={() => setFilter('rejected')}
              className="rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-6 shadow-xl text-left transition-transform hover:scale-105 cursor-pointer"
            >
              <h3 className="text-sm font-medium text-red-100">Rejected</h3>
              <p className="mt-2 text-3xl font-bold text-white">
                {verifications.filter((v) => v.verificationStatus === 'rejected').length}
              </p>
            </button>
          )}
          {filter === 'all' && (
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-xl">
              <h3 className="text-sm font-medium text-blue-100">Total</h3>
              <p className="mt-2 text-3xl font-bold text-white">{verifications.length}</p>
            </div>
          )}
        </div>

        {/* Verifications List */}
        <div className="rounded-2xl bg-gray-800 p-6 shadow-2xl">
          <h2 className="mb-6 text-2xl font-bold text-white">
            {filter.charAt(0).toUpperCase() + filter.slice(1)} Applications
          </h2>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading...</div>
          ) : filteredVerifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No {filter} applications found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVerifications.map((verification) => (
                <div
                  key={verification._id}
                  className="rounded-lg border border-gray-700 bg-gray-700/50 p-6 transition-all hover:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">
                          {verification.ngoName}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            verification.verificationStatus === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-500'
                              : verification.verificationStatus === 'accepted'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {verification.verificationStatus.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Registration No:</span>
                          <span className="ml-2 text-white">
                            {verification.registrationNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Type:</span>
                          <span className="ml-2 text-white">{verification.typeOfWork}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Contact:</span>
                          <span className="ml-2 text-white">
                            {verification.contactPersonName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Submitted:</span>
                          <span className="ml-2 text-white">
                            {new Date(verification.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {verification.verificationStatus === 'rejected' && (
                        <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm">
                          <span className="font-semibold text-red-500">
                            Attempts Remaining: {verification.attemptsRemaining}/3
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openModal(verification)}
                      className="ml-4 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedVerification && (
        <div 
          ref={modalBackdropRef}
          className="fixed inset-0 z-50 overflow-y-scroll bg-black/80"
          style={{
            scrollbarColor: '#ef4444 transparent',
            scrollbarWidth: 'thin'
          }}
        >
          <div className="min-h-screen flex items-center justify-center py-8 px-4">
            <div className="my-8 w-full max-w-4xl rounded-2xl bg-gray-800 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedVerification.ngoName}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 transition-colors hover:text-white"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {error && (
                <div className="mb-4 rounded-lg border border-red-500 bg-red-500/10 p-4 text-sm text-red-500">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-lg border border-green-500 bg-green-500/10 p-4 text-sm text-green-500">
                  {success}
                </div>
              )}

              {/* Basic Information */}
              <div className="mb-6">
                <h3 className="mb-4 text-lg font-bold text-white">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">NGO Name:</span>
                    <p className="mt-1 text-white">{selectedVerification.ngoName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Registration Number:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.registrationNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Contact Person:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.contactPersonName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.contactPersonPhone}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.contactPersonEmail}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Year Established:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.yearEstablished}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Type of Work:</span>
                    <p className="mt-1 text-white">{selectedVerification.typeOfWork}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Website:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.website || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Address:</span>
                    <p className="mt-1 text-white">{selectedVerification.ngoAddress}</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="mb-6">
                <h3 className="mb-4 text-lg font-bold text-white">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Account Holder:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.bankDetails.accountHolderName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Bank Name:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.bankDetails.bankName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Account Number:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.bankDetails.accountNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">IFSC Code:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.bankDetails.ifscCode}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Branch:</span>
                    <p className="mt-1 text-white">
                      {selectedVerification.bankDetails.branchName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Bank Document:</span>
                    <a
                      href={selectedVerification.bankDetails.bankDocumentImage?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-blue-400 hover:text-blue-300"
                    >
                      View Document →
                    </a>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <h3 className="mb-4 text-lg font-bold text-white">Documents</h3>
                <div className="space-y-2">
                  {selectedVerification.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-gray-700 p-3"
                    >
                      <span className="text-white">{doc.type}</span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View →
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* NGO Image & Location */}
              <div className="mb-6">
                <h3 className="mb-4 text-lg font-bold text-white">
                  NGO Image & Location
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <img
                      src={selectedVerification.ngoImage.url}
                      alt="NGO"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  </div>
                  <div className="text-sm">
                    <div className="mb-3">
                      <span className="text-gray-400">Latitude:</span>
                      <p className="mt-1 text-white">
                        {selectedVerification.ngoImage.latitude}
                      </p>
                    </div>
                    <div className="mb-3">
                      <span className="text-gray-400">Longitude:</span>
                      <p className="mt-1 text-white">
                        {selectedVerification.ngoImage.longitude}
                      </p>
                    </div>
                    {selectedVerification.ngoImage.address && (
                      <div>
                        <span className="text-gray-400">Location Address:</span>
                        <p className="mt-1 text-white">
                          {selectedVerification.ngoImage.address}
                        </p>
                      </div>
                    )}
                    <a
                      href={`https://www.google.com/maps?q=${selectedVerification.ngoImage.latitude},${selectedVerification.ngoImage.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-blue-400 hover:text-blue-300"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>
              </div>

              {/* Rejection Form (only if status is pending) */}
              {selectedVerification.verificationStatus === 'pending' && (
                <div className="mb-6 rounded-lg border border-gray-700 bg-gray-700/50 p-4">
                  <h3 className="mb-4 text-lg font-bold text-white">
                    Admin Action Required
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Rejection Reason (Required for Rejection)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter reason for rejection..."
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Admin Notes (Optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Additional notes for NGO..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Rejection Info */}
              {selectedVerification.verificationStatus === 'rejected' && (
                <div className="mb-6 rounded-lg border border-red-500 bg-red-500/10 p-4">
                  <h3 className="mb-2 text-lg font-bold text-red-500">
                    Rejection Details
                  </h3>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="text-gray-400">Reason:</span>
                      <p className="mt-1 text-white">
                        {selectedVerification.rejectionReason}
                      </p>
                    </div>
                    {selectedVerification.adminNotes && (
                      <div>
                        <span className="text-gray-400">Admin Notes:</span>
                        <p className="mt-1 text-white">
                          {selectedVerification.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedVerification.verificationStatus === 'pending' && (
              <div className="flex justify-end gap-4 border-t border-gray-700 p-6">
                <button
                  onClick={closeModal}
                  className="rounded-lg bg-gray-700 px-6 py-3 text-white transition-all hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        /* Firefox */
        .fixed.overflow-y-scroll {
          scrollbar-color: #ef4444 transparent;
          scrollbar-width: thin;
        }

        /* WebKit browsers (Chrome, Safari, Edge) */
        .fixed.overflow-y-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .fixed.overflow-y-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .fixed.overflow-y-scroll::-webkit-scrollbar-thumb {
          background-color: #ef4444;
          border-radius: 4px;
        }

        .fixed.overflow-y-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #dc2626;
        }
      `}</style>
    </div>
  );
}
