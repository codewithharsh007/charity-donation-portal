"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Edit2, Heart, TrendingUp, Package, DollarSign } from 'lucide-react';

export default function DonorDashboardPage() {
  const router = useRouter();
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Profile State
  const [profile, setProfile] = useState(null);
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
  
  // Donations State
  const [financialDonations, setFinancialDonations] = useState([]);
  const [itemDonations, setItemDonations] = useState([]);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    itemsDonated: 0
  });

  useEffect(() => {
    fetchProfile();
    fetchDonations();
  }, []);

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
      }
    } catch (err) {
      // Error handled silently
    } finally {
      setProfileLoading(false);
    }
  };

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
      
      // Calculate stats
      calculateStats();
    } catch (err) {
      // Error handled silently
    }
  };
  
  const calculateStats = () => {
    const totalFinancial = financialDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalDonations = financialDonations.length + itemDonations.length;
    const itemsDonated = itemDonations.reduce((sum, d) => sum + (d.items?.length || 0), 0);
    
    setStats({
      totalDonations,
      totalAmount: totalFinancial,
      itemsDonated
    });
  };
  
  useEffect(() => {
    calculateStats();
  }, [financialDonations, itemDonations]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // Error handled silently
    }
    localStorage.removeItem('user');
    router.push('/');
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
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setIsEditingProfile(false);
        setProfileMessage('Profile updated successfully!');
        setTimeout(() => setProfileMessage(''), 3000);
      } else {
        setProfileMessage('Update failed');
      }
    } catch (err) {
      setProfileMessage('Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const getStatusBadge = (donation) => {
    const statusMap = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳', text: 'Pending' },
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
    const shouldShowDelivery = donation.adminStatus === 'approved' && donation.acceptedBy;

    return (
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${adminStatus.color}`}>
          <span className="mr-1">{adminStatus.icon}</span>
          {adminStatus.text}
        </span>
        {shouldShowDelivery && deliveryStatus && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${deliveryStatus.color}`}>
            <span className="mr-1">{deliveryStatus.icon}</span>
            {deliveryStatus.text}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      {/* Header - Matching Navbar */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Dashboard
              </h1>
              <p className="text-xs md:text-sm text-gray-400 mt-1 hidden sm:block">Welcome back, <span className="text-red-500 font-medium">{profile?.userName || 'Donor'}</span>!</p>
            </div>

            {/* Hamburger Menu - Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white hover:text-red-500 transition-colors p-2"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
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

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => router.push('/donate')}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
              >
                Make Donation
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-700 hover:border-gray-600 transition-colors"
              >
                Home
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-700 pt-4 mt-4">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    router.push('/donate');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors text-center"
                >
                  Make Donation
                </button>
                <button
                  onClick={() => {
                    router.push('/');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors text-center"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-red-600 hover:text-white transition-colors text-center"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:shadow-lg hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1 font-medium">Total Donated</p>
                <p className="text-2xl font-bold text-white">₹{stats.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{financialDonations.length} donations</p>
              </div>
              <div className="bg-green-500/10 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:shadow-lg hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1 font-medium">Items Donated</p>
                <p className="text-2xl font-bold text-white">{stats.itemsDonated}</p>
                <p className="text-xs text-gray-500 mt-1">{itemDonations.length} donations</p>
              </div>
              <div className="bg-blue-500/10 rounded-full p-3">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:shadow-lg hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1 font-medium">Total Impact</p>
                <p className="text-2xl font-bold text-white">{stats.totalDonations}</p>
                <p className="text-xs text-gray-500 mt-1">contributions</p>
              </div>
              <div className="bg-purple-500/10 rounded-full p-3">
                <Heart className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-red-500" />
                Your Profile
              </h2>
              <p className="text-sm text-gray-400 mt-1">Personal information and contact details</p>
            </div>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
            >
              <Edit2 className="w-4 h-4" />
              {isEditingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="p-5">
            {profileMessage && (
              <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-400 text-center font-medium">{profileMessage}</p>
              </div>
            )}

            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      value={profileForm.userName}
                      onChange={(e) => setProfileForm({ ...profileForm, userName: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={profileForm.pincode}
                      onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500"
                      placeholder="Enter pincode"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Address</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500"
                      placeholder="Enter address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500"
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">State</label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500"
                      placeholder="Enter state"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleProfileSave}
                    disabled={profileLoading}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium shadow-md hover:shadow-lg"
                  >
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors">
                  <div className="bg-blue-500/10 rounded-lg p-2">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Full Name</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {profile?.userName || '-'} {profile?.lastName || ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors">
                  <div className="bg-green-500/10 rounded-lg p-2">
                    <Mail className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{profile?.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors">
                  <div className="bg-purple-500/10 rounded-lg p-2">
                    <Phone className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{profile?.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors">
                  <div className="bg-pink-500/10 rounded-lg p-2">
                    <MapPin className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Location</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {profile?.city ? `${profile.city}, ${profile.state} - ${profile.pincode}` : 'Not provided'}
                    </p>
                  </div>
                </div>

                {profile?.address && (
                  <div className="md:col-span-2 flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors">
                    <div className="bg-orange-500/10 rounded-lg p-2">
                      <MapPin className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Full Address</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{profile.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Donations Preview */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Recent Donations
              </h2>
              <p className="text-sm text-gray-400 mt-1">Your latest contributions</p>
            </div>
            {(financialDonations.length > 0 || itemDonations.length > 0) && (
              <button
                onClick={() => router.push('/donate?tab=history')}
                className="px-4 py-2 text-sm text-red-500 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 font-medium border border-gray-700 hover:border-red-500"
              >
                View All
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          <div className="p-5">
            {[...financialDonations.map(d => ({ ...d, type: 'financial' })), 
              ...itemDonations.map(d => ({ ...d, type: 'item' }))]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 3)
              .length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-300 font-semibold text-lg mb-2">No donations yet</p>
                <p className="text-sm text-gray-500 mb-6">Start your journey of giving today!</p>
                <button
                  onClick={() => router.push('/donate')}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                  Make Your First Donation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {[...financialDonations.map(d => ({ ...d, type: 'financial' })), 
                  ...itemDonations.map(d => ({ ...d, type: 'item' }))]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 3)
                  .map((donation) => {
                    if (donation.type === 'financial') {
                      return (
                        <div
                          key={donation._id}
                          className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:shadow-lg hover:border-green-500/50 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-green-500/10 rounded-lg p-1.5">
                                  <DollarSign className="w-4 h-4 text-green-400" />
                                </div>
                                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Financial Donation</span>
                              </div>
                              <h3 className="text-2xl font-bold text-green-400 mb-1">
                                ₹{donation.amount?.toLocaleString()}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {new Date(donation.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {donation.note && (
                                <p className="mt-2 text-sm text-gray-400 italic">"{donation.note}"</p>
                              )}
                            </div>
                            <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-semibold flex items-center gap-1 border border-green-500/30">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Completed
                            </span>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={donation._id}
                          className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:shadow-lg hover:border-blue-500/50 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-blue-500/10 rounded-lg p-1.5">
                                  <Package className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Item Donation</span>
                              </div>
                              <h3 className="text-lg font-bold text-white mb-1">
                                {donation.category}
                              </h3>
                              <p className="text-xs text-gray-500">
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

                          <div className="flex flex-wrap gap-2 mb-3">
                            {donation.items.slice(0, 3).map((item, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 bg-blue-500/10 text-blue-300 rounded-md text-xs font-semibold border border-blue-500/30"
                              >
                                {item}
                              </span>
                            ))}
                            {donation.items.length > 3 && (
                              <span className="px-2.5 py-1 bg-gray-600 text-gray-300 rounded-md text-xs font-semibold">
                                +{donation.items.length - 3} more
                              </span>
                            )}
                          </div>

                          {donation.acceptedBy && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mt-2">
                              <p className="text-xs font-semibold text-green-400">
                                ✓ Accepted by {donation.acceptedBy.userName}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                  })}
                
                {/* See More Button */}
                {(financialDonations.length + itemDonations.length) > 3 && (
                  <button
                    onClick={() => router.push('/donate?tab=history')}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-red-500 text-red-400 hover:text-red-300 font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    View All {financialDonations.length + itemDonations.length} Donations
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
