"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DonorDashboardPage() {
  const [donations, setDonations] = useState([]);
  const router = useRouter();
  const [ngoId, setNgoId] = useState('');
  const [ngoType, setNgoType] = useState('money');
  const [amount, setAmount] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [otherItem, setOtherItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ngos, setNgos] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [activeTab, setActiveTab] = useState('donations');
  const [searchTerm, setSearchTerm] = useState('');
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
    fetchNgos();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/donations');
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
      if (res.ok) setDonations((data && data.donations) || []);
      else setError((data && data.message) || res.statusText || 'Failed to load donations');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout helper
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed', err);
    }
    try { localStorage.removeItem('user'); } catch (e) {}
    try { router.push('/'); } catch (e) {}
    try { router.refresh(); } catch (e) {}
  };

  const fetchNgos = async () => {
    try {
  // Request all statuses so dev/pending NGOs are visible in the dropdown.
  // Change to '?status=accepted' for production to show only verified NGOs.
  const res = await fetch('/api/ngos?status=all');
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
      if (res.ok) {
        // Normalize API shape: accept id or _id and different field names
        const raw = (data && data.ngos) || [];
        console.debug('fetchNgos - raw response:', raw);
        const normalized = raw.map(n => ({
          id: n.id || n._id || (n._id && String(n._id)) || '',
          ngoName: n.ngoName || n.name || '',
          ngoAddress: n.ngoAddress || n.address || (n.ngoImage && n.ngoImage.address) || '',
          ngoImage: n.ngoImage || null,
        }));
        setNgos(normalized);
      } else {
        console.error('Failed to load NGOs:', (data && data.message) || res.statusText);
      }
    } catch (err) {
      console.error('Failed to load NGOs:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!ngoId) {
      setError('Please select an NGO');
      setLoading(false);
      return;
    }

    if (ngoType === 'money' && (!amount || Number(amount) <= 0)) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (ngoType === 'items') {
      if (!selectedItem) {
        setError('Please select an item category');
        setLoading(false);
        return;
      }
      if (selectedItem === 'Other' && !otherItem.trim()) {
        setError('Please specify what you are donating under Other');
        setLoading(false);
        return;
      }
    }

    if (ngoType === 'items' && imageFiles.length === 0 && videoFiles.length === 0) {
      setError('For item donations, please attach at least one image or video for verification');
      setLoading(false);
      return;
    }

    // File size validation
    for (const f of imageFiles) {
      if (f.size > 5 * 1024 * 1024) {
        setError(`Image "${f.name}" exceeds 5MB limit`);
        setLoading(false);
        return;
      }
    }

    for (const f of videoFiles) {
      if (f.size > 50 * 1024 * 1024) {
        setError(`Video "${f.name}" exceeds 50MB limit`);
        setLoading(false);
        return;
      }
    }

    // Convert files to data URLs
    const toDataUrl = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    let imagesData = [];
    let videosData = [];

    try {
      imagesData = await Promise.all(imageFiles.map(f => toDataUrl(f)));
      videosData = await Promise.all(videoFiles.map(f => toDataUrl(f)));
    } catch (err) {
      setError('Failed to process files. Please try again.');
      setLoading(false);
      return;
    }

    const payload = {
      ngo: ngoId,
      ngoType,
      amount: ngoType === 'money' ? Number(amount) : undefined,
      items: ngoType === 'items'
        ? (selectedItem === 'Other' ? [otherItem.trim()] : [selectedItem])
        : [],
      imagesData,
      videosData,
    };

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
      
      if (!res.ok) {
        const msg = (data && data.message) || res.statusText || 'Create failed';
        throw new Error(msg);
      }
      
      await fetchDonations();
      // Reset form
      setAmount('');
  setSelectedItem('');
  setOtherItem('');
      setNgoId('');
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFiles([]);
      setVideoPreviews([]);
      setActiveTab('donations');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // PROFILE: fetch and edit helpers
  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileMessage('');
    try {
      const res = await fetch('/api/user/profile');
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
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
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
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

  const totalDonated = donations.reduce((sum, donation) => {
    return donation.ngoType === 'money' ? sum + (donation.amount || 0) : sum;
  }, 0);

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.ngo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (donation.items || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Donor Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Track your impact and make new donations</p>
            </div>
            <div className="flex items-center gap-4">


              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isProfileOpen) fetchProfile();
                    else setIsProfileOpen(false);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:shadow-sm"
                >
                  👤 Profile
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={async () => {
                    // call local handler
                    try { await handleLogout(); } catch (e) { /* ignore */ }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
                        onClick={() => { setIsEditingProfile(false); setProfileForm({
                          userName: profile?.userName || '',
                          lastName: profile?.lastName || '',
                          phone: profile?.phone || '',
                          address: profile?.address || '',
                          city: profile?.city || '',
                          state: profile?.state || '',
                          pincode: profile?.pincode || ''
                        }); }}
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
                    <input name="userName" value={profileForm.userName} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg text-black" />
                  ) : (
                    <p className="text-gray-900">{profile?.userName || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Last name</label>
                  {isEditingProfile ? (
                    <input name="lastName" value={profileForm.lastName} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg text-black" />
                  ) : (
                    <p className="text-gray-900">{profile?.lastName || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Phone</label>
                  {isEditingProfile ? (
                    <input name="phone" value={profileForm.phone} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg text-black" />
                  ) : (
                    <p className="text-gray-900">{profile?.phone || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Pincode</label>
                  {isEditingProfile ? (
                    <input name="pincode" value={profileForm.pincode} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg text-black" />
                  ) : (
                    <p className="text-gray-900">{profile?.pincode || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">Address</label>
                  {isEditingProfile ? (
                    <input name="address" value={profileForm.address} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg text-black" />
                  ) : (
                    <p className="text-gray-900">{profile?.address || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600">City</label>
                  {isEditingProfile ? (
                    <input name="city" value={profileForm.city} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg text-black" />
                  ) : (
                    <p className="text-gray-900">{profile?.city || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600">State</label>
                  {isEditingProfile ? (
                    <input name="state" value={profileForm.state} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg text-black" />
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
        

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 border border-gray-100 overflow-hidden">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('donations')}
                className={`flex items-center py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'donations'
                    ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">📋</span>
                Your Donations
                {donations.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {donations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">✨</span>
                Make New Donation
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'donations' && (
              <div>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">Donation History</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <input
                        type="text"
                        placeholder="Search donations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        🔍
                      </div>
                    </div>
                    
                    
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading your donations...</p>
                  </div>
                ) : filteredDonations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📭</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {donations.length === 0 ? 'No donations yet' : 'No matching donations'}
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      {donations.length === 0 
                        ? 'Start making a difference today with your first donation'
                        : 'Try adjusting your search or filter criteria'
                      }
                    </p>
                    {donations.length === 0 && (
                      <button
                        onClick={() => setActiveTab('create')}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Make Your First Donation
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDonations.map((donation) => (
                      <div key={donation._id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group">
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
                                  To: {ngos.find(n => n.id === donation.ngo)?.ngoName || donation.ngo}
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
                                  <p className="text-sm font-medium text-gray-600">Items Donated</p>
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
                                <img key={index} src={img} alt={`Donation ${index + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
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
            )}

            {activeTab === 'create' && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Make a New Donation</h2>
                  <p className="text-gray-600">Choose how you'd like to make a difference today</p>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🏛</span>
                      Select NGO
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Choose an organization to support
                      </label>
                      <select
                        value={ngoId}
                        onChange={(e) => setNgoId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black"
                        required
                      >
                        <option value="">Select an NGO to support</option>
                        {ngos.map(n => (
                          <option key={n.id} value={n.id}>
                            {n.ngoName ? `${n.ngoName}${n.ngoAddress ? ` — ${n.ngoAddress}` : ''}` : n.id}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-2">
                        {ngos.length} verified organizations available
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🎁</span>
                      Donation Type
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setNgoType('money');
                          setImageFiles([]);
                          setImagePreviews([]);
                          setVideoFiles([]);
                          setVideoPreviews([]);
                        }}
                        className={`p-6 border-2 rounded-xl text-center transition-all duration-200 group ${
                          ngoType === 'money'
                            ? 'border-green-500 bg-white shadow-lg scale-105'
                            : 'border-gray-300 bg-white hover:border-green-300 hover:shadow-md'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors ${
                          ngoType === 'money' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <span className="text-2xl">💰</span>
                        </div>
                        <span className={`font-semibold block mb-2 ${
                          ngoType === 'money' ? 'text-green-700' : 'text-gray-700'
                        }`}>Financial Support</span>
                        <p className="text-sm text-gray-500 group-hover:text-gray-600">
                          Quick and direct monetary contribution
                        </p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setNgoType('items')}
                        className={`p-6 border-2 rounded-xl text-center transition-all duration-200 group ${
                          ngoType === 'items'
                            ? 'border-blue-500 bg-white shadow-lg scale-105'
                            : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors ${
                          ngoType === 'items' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <span className="text-2xl">📦</span>
                        </div>
                        <span className={`font-semibold block mb-2 ${
                          ngoType === 'items' ? 'text-blue-700' : 'text-gray-700'
                        }`}>Item Donation</span>
                        <p className="text-sm text-gray-500 group-hover:text-gray-600">
                          Donate physical goods and essentials
                        </p>
                      </button>
                    </div>
                  </div>

                  {ngoType === 'money' ? (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span>💵</span>
                        Amount Details
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Enter donation amount
                        </label>
                        <div className="relative max-w-xs">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-lg font-semibold text-black"
                            placeholder="0.00"
                            min="1"
                            required
                          />
                        </div>
                        <div className="flex gap-2 mt-3">
                          {[100, 500, 1000, 5000].map((suggestedAmount) => (
                            <button
                              key={suggestedAmount}
                              type="button"
                              onClick={() => setAmount(suggestedAmount.toString())}
                              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:border-green-500 hover:text-green-600 transition-colors"
                            >
                              ₹{suggestedAmount}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span>📝</span>
                          Item Details
                        </h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            What items are you donating?
                          </label>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Choose item category</label>
                          <select
                            value={selectedItem}
                            onChange={(e) => setSelectedItem(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black"
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
                          {selectedItem === 'Other' && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Specify Other</label>
                              <input
                                type="text"
                                value={otherItem}
                                onChange={(e) => setOtherItem(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black"
                                placeholder="Describe the item you're donating"
                              />
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            Choose a category for the items you're donating
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span>📷</span>
                          Media Verification
                          <span className="text-sm text-red-500 font-normal">(Required for items)</span>
                        </h3>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Upload Images (Max 5MB each)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files || []);
                                  setImageFiles(prev => [...prev, ...files]);
                                  const newPreviews = await Promise.all(files.map(f => new Promise((res) => {
                                    const r = new FileReader();
                                    r.onload = () => res(r.result);
                                    r.readAsDataURL(f);
                                  })));
                                  setImagePreviews(prev => [...prev, ...newPreviews]);
                                }}
                                className="hidden"
                                id="image-upload"
                              />
                              <label htmlFor="image-upload" className="cursor-pointer">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                  <span className="text-xl">📸</span>
                                </div>
                                <p className="text-gray-600 mb-2">Click to upload images</p>
                                <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                              </label>
                            </div>
                            {imagePreviews.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Selected Images ({imagePreviews.length})
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative">
                                      <img 
                                        src={preview} 
                                        alt={`Preview ${index + 1}`} 
                                        className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Upload Videos (Max 50MB each)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                              <input
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files || []);
                                  setVideoFiles(prev => [...prev, ...files]);
                                  const newPreviews = await Promise.all(files.map(f => {
                                    return URL.createObjectURL(f);
                                  }));
                                  setVideoPreviews(prev => [...prev, ...newPreviews]);
                                }}
                                className="hidden"
                                id="video-upload"
                              />
                              <label htmlFor="video-upload" className="cursor-pointer">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                  <span className="text-xl">🎥</span>
                                </div>
                                <p className="text-gray-600 mb-2">Click to upload videos</p>
                                <p className="text-sm text-gray-500">MP4, MOV up to 50MB</p>
                              </label>
                            </div>
                            {videoPreviews.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Selected Videos ({videoPreviews.length})
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  {videoPreviews.map((preview, index) => (
                                    <div key={index} className="relative">
                                      <video 
                                        src={preview} 
                                        className="w-28 h-20 object-cover rounded-lg border shadow-sm"
                                        controls
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeVideo(index)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse">
                      <div className="flex items-center gap-2 text-red-800">
                        <span>⚠️</span>
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing Donation...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>✨</span>
                          Make Donation
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('donations')}
                      className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}