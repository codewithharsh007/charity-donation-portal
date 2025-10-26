// app/ngoDashboard/page.jsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Edit2, Heart, TrendingUp, Package, DollarSign, Crown, BarChart, Zap } from 'lucide-react';

export default function NgoDashboardPage() {
  const [donations, setDonations] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('donations');
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  
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
    fetchProfile();
    fetchSubscription();
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

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscriptions/current', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionData(data.data); // ✅ Store the subscription data
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
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
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg backdrop-blur-sm">
          <span className="text-yellow-400 text-sm">⚠️</span>
          <span className="text-xs font-medium text-yellow-300">Not Verified</span>
        </div>
      );
    }

    switch (verificationStatus.verificationStatus) {
      case 'accepted':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg backdrop-blur-sm">
            <span className="text-green-400 text-sm">✓</span>
            <span className="text-xs font-medium text-green-300">Verified NGO</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg backdrop-blur-sm">
            <span className="text-blue-400 text-sm">⏳</span>
            <span className="text-xs font-medium text-blue-300">Under Review</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <span className="text-red-400 text-sm">❌</span>
            <span className="text-xs font-medium text-red-300">Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  const isVerified = () => {
    return verificationStatus?.verificationStatus === 'accepted';
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

  // ✅ Get current tier info
  const currentTier = subscriptionData?.currentTier || 1;
  const tierName = subscriptionData?.tierName || 'FREE';
  const getTierBadgeColor = (tier) => {
    switch (tier) {
      case 1: return 'bg-gray-500/20 text-gray-300';
      case 2: return 'bg-amber-600/20 text-amber-300';
      case 3: return 'bg-gray-400/20 text-gray-200';
      case 4: return 'bg-yellow-500/20 text-yellow-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      {/* Header - Matching Navbar */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                NGO Dashboard
              </h1>
              <p className="text-xs md:text-sm text-gray-400 mt-1 hidden sm:block">
                Welcome back, <span className="text-red-500 font-medium">{profile?.userName || 'NGO'}</span>!
              </p>
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
              <div className="flex items-center gap-2">
                {getVerificationStatusBadge()}
              </div>
              <button
                onClick={() => router.push('/subscription/plans')}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Subscription
              </button>
              {isVerified() ? (
                <button
                  onClick={() => router.push('/ngo/marketplace')}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Marketplace
                </button>
              ) : (
                <button
                  disabled
                  title="Complete verification to access marketplace"
                  className="px-5 py-2.5 bg-gray-700 text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed flex items-center gap-2 opacity-50"
                >
                  <Package className="w-4 h-4" />
                  Marketplace (Locked)
                </button>
              )}
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
                <div className="mb-2">
                  {getVerificationStatusBadge()}
                </div>
                <button
                  onClick={() => {
                    router.push('/subscription/plans');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Subscription
                </button>
                {isVerified() ? (
                  <button
                    onClick={() => {
                      router.push('/ngo/marketplace');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Marketplace
                  </button>
                ) : (
                  <button
                    disabled
                    title="Complete verification to access marketplace"
                    className="w-full px-4 py-3 bg-gray-700 text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed text-center flex items-center justify-center gap-2 opacity-50"
                  >
                    <Package className="w-4 h-4" />
                    Marketplace (Locked)
                  </button>
                )}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ✅ UPDATED Subscription Status Card with Tier-Based Features */}
        {subscriptionData && (
          <div className={`mb-6 bg-gradient-to-r rounded-2xl p-6 shadow-lg ${
            currentTier === 4 ? 'from-yellow-600 to-orange-600' :
            currentTier === 3 ? 'from-gray-400 to-gray-600' :
            currentTier === 2 ? 'from-amber-600 to-amber-800' :
            'from-gray-600 to-gray-700'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  {currentTier === 4 ? (
                    <Crown className="w-8 h-8 text-white" />
                  ) : currentTier === 3 ? (
                    <Zap className="w-8 h-8 text-white" />
                  ) : currentTier === 2 ? (
                    <BarChart className="w-8 h-8 text-white" />
                  ) : (
                    <Package className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-bold text-white">{tierName} Tier</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTierBadgeColor(currentTier)} border border-white/30`}>
                      {currentTier === 4 ? '👑 PREMIUM' : currentTier === 3 ? '⚡ PRO' : currentTier === 2 ? '🥉 STARTER' : '🆓 FREE'}
                    </span>
                  </div>
                  <p className="text-sm text-white/80">
                    {currentTier === 4 ? 'Unlimited features & priority support' :
                     currentTier === 3 ? 'Advanced features unlocked' :
                     currentTier === 2 ? 'Essential features enabled' :
                     'Basic features only'}
                  </p>
                  {subscriptionData.plan && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
                      <span>• {subscriptionData.plan.limits?.activeRequests === -1 ? '∞' : subscriptionData.plan.limits?.activeRequests} Active Requests</span>
                      <span>• {subscriptionData.plan.limits?.monthlyAcceptance === -1 ? '∞' : subscriptionData.plan.limits?.monthlyAcceptance} Monthly Items</span>
                      {subscriptionData.plan.limits?.financialDonationLimit > 0 && (
                        <span>• ₹{subscriptionData.plan.limits.financialDonationLimit.toLocaleString()} Financial Limit</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {currentTier < 4 && (
                  <button
                    onClick={() => router.push('/subscription/plans')}
                    className="px-5 py-2.5 bg-white text-purple-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    ⬆️ Upgrade
                  </button>
                )}
                <button
                  onClick={() => router.push('/ngoDashboard/subscription')}
                  className="px-5 py-2.5 bg-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors"
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Cards - Show different stats based on tier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Received */}
          <div className="bg-[#1e293b] border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Total Received</p>
                <h3 className="text-3xl font-bold text-white">₹{totalReceived.toLocaleString()}</h3>
                <p className="text-xs text-gray-500 mt-1">{donationsByType.money} financial donations</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            {currentTier > 1 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  {currentTier === 4 ? '✨ Premium Analytics Available' :
                   currentTier === 3 ? '📊 Advanced Tracking Enabled' :
                   '📈 Basic Stats Only'}
                </p>
              </div>
            )}
          </div>

          {/* Items Received */}
          <div className="bg-[#1e293b] border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Items Received</p>
                <h3 className="text-3xl font-bold text-white">{donationsByType.items}</h3>
                <p className="text-xs text-gray-500 mt-1">{donationsByType.items} item donations</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            {subscriptionData?.plan && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Limit: {subscriptionData.plan.limits?.monthlyAcceptance === -1 ? '∞ Unlimited' : `${subscriptionData.plan.limits?.monthlyAcceptance}/month`}
                </p>
              </div>
            )}
          </div>

          {/* Total Donors */}
          <div className="bg-[#1e293b] border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Total Donors</p>
                <h3 className="text-3xl font-bold text-white">{donations.length}</h3>
                <p className="text-xs text-gray-500 mt-1">generous contributors</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            {currentTier > 2 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  {currentTier === 4 ? '👥 Priority Donor Matching' : '🤝 Enhanced Donor Reach'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tier-specific feature alert */}
        {currentTier === 1 && (
          <div className="mb-6 bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">🚀</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">Unlock Premium Features</h3>
                <p className="text-purple-300 mb-4">
                  Upgrade to access unlimited requests, advanced analytics, priority support, and more!
                </p>
                <button
                  onClick={() => router.push('/subscription/plans')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Your Profile Section */}
        <div className="bg-[#1e293b] border border-gray-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-white">Your Profile</h2>
                <p className="text-sm text-gray-400">Personal information and contact details</p>
              </div>
            </div>
            {!isEditingProfile ? (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleProfileSave}
                  disabled={profileLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {profileLoading ? 'Saving...' : 'Save'}
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
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="bg-[#2d3748] border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Full Name</p>
                  {isEditingProfile ? (
                    <input
                      name="userName"
                      value={profileForm.userName}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <p className="text-white font-medium truncate">{profile?.userName || '-'} {profile?.lastName || ''}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-[#2d3748] border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-white font-medium truncate">{profile?.email || '-'}</p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-[#2d3748] border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                  {isEditingProfile ? (
                    <input
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <p className="text-white font-medium truncate">{profile?.phone || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-[#2d3748] border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Location</p>
                  {isEditingProfile ? (
                    <div className="space-y-2">
                      <input
                        name="city"
                        value={profileForm.city}
                        onChange={handleProfileChange}
                        placeholder="City"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      />
                      <input
                        name="state"
                        value={profileForm.state}
                        onChange={handleProfileChange}
                        placeholder="State"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      />
                      <input
                        name="pincode"
                        value={profileForm.pincode}
                        onChange={handleProfileChange}
                        placeholder="Pincode"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      />
                    </div>
                  ) : (
                    <p className="text-white font-medium truncate">
                      {profile?.city || '-'}, {profile?.state || '-'} - {profile?.pincode || '-'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Full Address */}
            <div className="md:col-span-2 bg-[#2d3748] border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Full Address</p>
                  {isEditingProfile ? (
                    <textarea
                      name="address"
                      value={profileForm.address}
                      onChange={handleProfileChange}
                      rows="2"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <p className="text-white font-medium">{profile?.address || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {profileMessage && (
            <div className="mt-4 text-sm text-center text-green-400 bg-green-500/20 border border-green-500/30 rounded-lg py-2">
              {profileMessage}
            </div>
          )}
        </div>

        {/* Verification Alerts - Moved after profile */}
        {verificationStatus?.verificationStatus === 'rejected' && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Verification Rejected</h3>
                <p className="text-red-300 mb-3">{verificationStatus.rejectionReason}</p>
                <p className="text-sm text-red-400 mb-4">
                  Attempts remaining: {verificationStatus.attemptsRemaining} out of 3
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Reapply for Verification
                </button>
              </div>
            </div>
          </div>
        )}

        {verificationStatus?.verificationStatus === 'pending' && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">⏳</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Verification Under Review</h3>
                <p className="text-blue-300">
                  Your verification application is being reviewed by our admin team. You'll receive an email once the review is complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {!verificationStatus && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl">📋</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Complete Your Verification</h3>
                <p className="text-yellow-300 mb-4">
                  Get verified to receive donations and gain trust from donors.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors"
                >
                  Start Verification Process
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Donations Section */}
        <div className="bg-[#1e293b] border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-white">Received Donations</h2>
                <p className="text-sm text-gray-400">Recent donations from donors</p>
              </div>
            </div>
            <button
              onClick={() => {/* Navigate to all donations */}}
              className="text-red-500 hover:text-red-400 text-sm font-medium flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Donations List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading donations...</p>
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📭</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No donations received yet</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  You haven't received any donations yet. Complete your verification to start receiving donations from donors.
                </p>
              </div>
            ) : (
              donations.slice(0, 5).map((donation) => (
                <div key={donation._id} className="bg-[#2d3748] border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        donation.ngoType === 'money' ? 'bg-green-500/10' : 'bg-blue-500/10'
                      }`}>
                        {donation.ngoType === 'money' ? (
                          <DollarSign className="w-5 h-5 text-green-400" />
                        ) : (
                          <Package className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold">
                          {donation.ngoType === 'money' ? 'Financial Donation' : donation.items?.[0] || 'Item Donation'}
                        </h3>
                        <p className="text-xs text-gray-400">
                          From Donor • {new Date(donation.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {donation.ngoType === 'money' && (
                        <p className="text-lg font-bold text-white">₹{donation.amount?.toLocaleString()}</p>
                      )}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                        {donation.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
