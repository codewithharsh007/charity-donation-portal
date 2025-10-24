"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NgoDashboardPage() {
  const [donations, setDonations] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('donations');
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // Profile UI state
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
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
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    fetchDonations();
    fetchVerificationStatus();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/donations');
      const text = await res.text();
      let data;
      try { 
        data = text ? JSON.parse(text) : null; 
      } catch (e) { 
        data = null; 
      }
      if (res.ok) {
        setDonations((data && data.donations) || []);
      } else {
        setError((data && data.message) || res.statusText || 'Failed to load donations');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const res = await fetch('/api/ngo/verification');
      const text = await res.text();
      let data;
      try { 
        data = text ? JSON.parse(text) : null; 
      } catch (e) { 
        console.error('JSON parse error:', e);
        data = null; 
      }
      if (res.ok && data) {
        setVerificationStatus(data.verification);
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
    }
  };

  // Logout helper
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed', err);
    }
    try { 
      localStorage.removeItem('user'); 
    } catch (e) {}
    try { 
      router.push('/'); 
    } catch (e) {}
    try { 
      router.refresh(); 
    } catch (e) {}
  };

  // PROFILE: fetch and edit helpers
  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileMessage('');
    try {
      const res = await fetch('/api/user/profile');
      const text = await res.text();
      let data;
      try { 
        data = text ? JSON.parse(text) : null; 
      } catch (e) { 
        data = null; 
      }
      if (!res.ok) {
        setProfileMessage((data && data.message) || res.statusText || 'Failed to load profile');
        return;
      }
      const user = (data && data.user) || null;
      setProfile(user);
      setProfileForm({
        userName: user?.userName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        address: user?.address || '',
        city: user?.city || '',
        state: user?.state || '',
        pincode: user?.pincode || ''
      });
      setIsProfileOpen(true);
      setIsEditingProfile(false);
    } catch (err) {
      setProfileMessage(err.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    setProfileMessage('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const text = await res.text();
      let data;
      try { 
        data = text ? JSON.parse(text) : null; 
      } catch (e) { 
        data = null; 
      }
      if (!res.ok) {
        setProfileMessage((data && data.message) || res.statusText || 'Update failed');
        return;
      }
      const updated = (data && data.user) || null;
      setProfile(updated);
      setIsEditingProfile(false);
      setProfileMessage((data && data.message) || 'Profile updated');

      // Update localStorage user if present
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const existing = JSON.parse(raw);
          const merged = { ...existing, ...updated };
          localStorage.setItem('user', JSON.stringify(merged));
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setProfileMessage(err.message || 'Update failed');
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMessage(''), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const getVerificationStatusBadge = () => {
    if (!verificationStatus) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-yellow-600">⚠️</span>
          <span className="text-sm font-medium text-yellow-700">Not Verified</span>
        </div>
      );
    }

    switch (verificationStatus.verificationStatus) {
      case 'accepted':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-600">✓</span>
            <span className="text-sm font-medium text-green-700">Verified NGO</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-600">⏳</span>
            <span className="text-sm font-medium text-blue-700">Under Review</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-600">❌</span>
            <span className="text-sm font-medium text-red-700">Verification Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  const totalReceived = donations.reduce((sum, donation) => {
    return donation.ngoType === 'money' ? sum + (donation.amount || 0) : sum;
  }, 0);

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (donation.items || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const donationsByType = {
    money: donations.filter(d => d.ngoType === 'money').length,
    items: donations.filter(d => d.ngoType === 'items').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                NGO Dashboard
              </h1>
              <p className="text-gray-300 mt-2">Manage your donations and verification status</p>
            </div>
            <div className="flex items-center gap-4">
              {getVerificationStatusBadge()}

              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white hover:bg-gray-700 hover:border-green-500 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isProfileOpen) fetchProfile();
                  else setIsProfileOpen(false);
                }}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white hover:bg-gray-700"
              >
                👤 Profile
              </button>

              <button
                type="button"
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
          <div className="mb-6">
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
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
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setIsProfileOpen(false)}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleProfileSave}
                        disabled={profileLoading}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                      >
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => { 
                          setIsEditingProfile(false); 
                          setProfileForm({
                            userName: profile?.userName || '',
                            lastName: profile?.lastName || '',
                            phone: profile?.phone || '',
                            address: profile?.address || '',
                            city: profile?.city || '',
                            state: profile?.state || '',
                            pincode: profile?.pincode || ''
                          }); 
                        }}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
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
                      onChange={handleProfileChange} 
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
                      onChange={handleProfileChange} 
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
                      onChange={handleProfileChange} 
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
                      onChange={handleProfileChange} 
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
                      onChange={handleProfileChange} 
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
                      onChange={handleProfileChange} 
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
                      onChange={handleProfileChange} 
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
          </div>
        )}

        {/* Verification Alert */}
        {verificationStatus?.verificationStatus === 'rejected' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Verification Rejected</h3>
                <p className="text-red-700 mb-3">{verificationStatus.rejectionReason}</p>
                <p className="text-sm text-red-600 mb-4">
                  Attempts remaining: {verificationStatus.attemptsRemaining} out of 3
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  Reapply for Verification
                </button>
              </div>
            </div>
          </div>
        )}

        {verificationStatus?.verificationStatus === 'pending' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">⏳</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Verification Under Review</h3>
                <p className="text-blue-700">
                  Your verification application is being reviewed by our admin team. You'll receive an email once the review is complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {!verificationStatus && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">📋</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Complete Your Verification</h3>
                <p className="text-yellow-700 mb-4">
                  Get verified to receive donations and gain trust from donors.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                >
                  Start Verification Process
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Total</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">₹{totalReceived.toLocaleString()}</h3>
            <p className="text-green-100 text-sm">Total Funds Received</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Count</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{donations.length}</h3>
            <p className="text-blue-100 text-sm">Total Donations</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Items</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{donationsByType.items}</h3>
            <p className="text-purple-100 text-sm">Item Donations</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Received Donations</h2>
              
              <div className="relative w-full lg:w-auto">
                <input
                  type="text"
                  placeholder="Search donations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full lg:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading donations...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📭</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {donations.length === 0 ? 'No donations yet' : 'No matching donations'}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {donations.length === 0 
                    ? 'You haven\'t received any donations yet. Complete your verification to start receiving donations.'
                    : 'Try adjusting your search criteria'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDonations.map((donation) => (
                  <div key={donation._id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${
                            donation.ngoType === 'money' ? 'bg-green-50' : 'bg-blue-50'
                          }`}>
                            {donation.ngoType === 'money' ? '💰' : '📦'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {donation.ngoType === 'money' ? 'Financial Donation' : 'Item Donation'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              From: Donor #{donation.donor?.slice(-8) || 'Anonymous'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>🆔</span>
                            <span>ID: {donation._id?.slice(-8)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>📅</span>
                            <span>
                              {new Date(donation.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(donation.status)}`}>
                          <span className="mr-2">{getStatusIcon(donation.status)}</span>
                          {donation.status}
                        </span>
                        
                        <div className="text-right">
                          {donation.ngoType === 'money' ? (
                            <p className="text-2xl font-bold text-green-600">₹{donation.amount?.toLocaleString()}</p>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Items Received</p>
                              <p className="text-gray-900 font-semibold">{donation.items?.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Media preview for item donations */}
                    {donation.ngoType === 'items' && donation.imagesData && donation.imagesData.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Attached Media:</p>
                        <div className="flex gap-2 overflow-x-auto">
                          {donation.imagesData.slice(0, 3).map((img, index) => (
                            <img 
                              key={index} 
                              src={img} 
                              alt={`Donation ${index + 1}`} 
                              className="w-16 h-16 object-cover rounded-lg border" 
                            />
                          ))}
                          {donation.imagesData.length > 3 && (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-500">
                              +{donation.imagesData.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
