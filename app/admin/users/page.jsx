// app/admin/users/page.jsx
'use client';

import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState(null);

  useEffect(() => {
    // Get current admin from localStorage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentAdminId(user._id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    
    fetchUsers();
  }, [filter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('userType', filter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || 'Failed to fetch users');
        return;
      }

      const data = await res.json();

      if (data.success) {
        // Sort users by hierarchy: Admins → NGOs → Donors
        const sortedUsers = data.users.sort((a, b) => {
          // Define hierarchy order
          const getOrder = (user) => {
            if (user._id === currentAdminId) return 0; // Current admin first
            if (user.role === 'admin') return 1; // Other admins
            if (user.userType === 'ngo') return 2; // NGOs
            if (user.userType === 'donor') return 3; // Donors
            return 4; // Others
          };
          
          return getOrder(a) - getOrder(b);
        });
        
        setUsers(sortedUsers);
        setStats(data.stats || {});
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setReason('');
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if ((actionType === 'block' || actionType === 'delete') && !reason) {
      alert('Reason is required for this action');
      return;
    }

    if (actionType === 'delete') {
      if (!confirm(`Are you sure you want to DELETE user "${selectedUser.userName}"? This action cannot be undone!`)) {
        return;
      }
    }

    setProcessing(true);

    try {
      const res = await fetch('/api/admin/users/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUser._id,
          action: actionType,
          reason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Action completed successfully');
        setShowActionModal(false);
        fetchUsers();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (error) {
      alert('Error performing action: ' + error.message);
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const getUserTypeBadge = (userType) => {
    const badges = {
      donor: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      ngo: 'bg-green-500/20 text-green-400 border-green-500/50',
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[userType] || badges.donor}`}>
        {userType?.toUpperCase() || 'USER'}
      </span>
    );
  };

  const getTierBadge = (tier) => {
    if (!tier || tier === 1) return null;
    const badges = {
      2: { name: 'BRONZE', color: 'bg-amber-600 text-white' },
      3: { name: 'SILVER', color: 'bg-gray-400 text-white' },
      4: { name: 'GOLD', color: 'bg-yellow-500 text-white' },
    };
    const badge = badges[tier];
    return badge ? (
      <span className={`px-2 py-1 rounded text-xs font-bold ${badge.color}`}>
        {badge.name}
      </span>
    ) : null;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isCurrentAdmin = (userId) => userId === currentAdminId;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">User Management</h1>
          <p className="mt-2 text-gray-400">Manage all users and their permissions</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs font-medium text-blue-100">Total Users</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.total || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs font-medium text-green-100">NGOs</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.ngos || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs font-medium text-purple-100">Donors</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.donors || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs font-medium text-orange-100">Admins</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.admins || 0}</p>
          </div>
          {/* <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs font-medium text-teal-100">Verified</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.verified || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs font-medium text-red-100">Unverified</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.unverified || 0}</p>
          </div> */}
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'admin', 'ngo', 'donor'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      {error ? 'Error loading users' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr 
                      key={user._id} 
                      className={`hover:bg-gray-700/50 transition-colors ${
                        isCurrentAdmin(user._id) ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            isCurrentAdmin(user._id) 
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-400' 
                              : 'bg-gradient-to-br from-red-500 to-red-600'
                          }`}>
                            {user.userName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{user.userName || 'Unknown'}</p>
                              {isCurrentAdmin(user._id) && (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-bold border border-blue-500/50">
                                  YOU
                                </span>
                              )}
                            </div>
                            {user.userType === 'ngo' && user.subscription?.currentTier && (
                              <div className="mt-1">{getTierBadge(user.subscription.currentTier)}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getUserTypeBadge(user.userType)}</td>
                      <td className="px-6 py-4">
                        <p className="text-white text-sm">{user.email || 'N/A'}</p>
                        {user.phone && <p className="text-gray-400 text-xs">{user.phone}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-300 text-sm">{formatDate(user.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {user.isVerified && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold inline-block w-fit">
                              ✓ Verified
                            </span>
                          )}
                          {user.isBlocked && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-semibold inline-block w-fit">
                              🚫 Blocked
                            </span>
                          )}
                          {user.role === 'admin' && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-semibold inline-block w-fit">
                              👑 Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isCurrentAdmin(user._id) ? (
                          <div className="flex gap-2">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                              Your Account
                            </span>
                          </div>
                        ) : user.role === 'admin' ? (
                          <div className="flex gap-2">
                            {!user.isBlocked ? (
                              <button
                                onClick={() => openActionModal(user, 'block')}
                                className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                              >
                                Block
                              </button>
                            ) : (
                              <button
                                onClick={() => openActionModal(user, 'unblock')}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                Unblock
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            {!user.isBlocked ? (
                              <button
                                onClick={() => openActionModal(user, 'block')}
                                className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                              >
                                Block
                              </button>
                            ) : (
                              <button
                                onClick={() => openActionModal(user, 'unblock')}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                Unblock
                              </button>
                            )}
                            <button
                              onClick={() => openActionModal(user, 'delete')}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              {actionType.charAt(0).toUpperCase() + actionType.slice(1)} User
            </h3>

            <div className="mb-4 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">User:</p>
              <p className="text-white font-semibold">{selectedUser.userName}</p>
              <p className="text-gray-400 text-sm">{selectedUser.email}</p>
            </div>

            {(actionType === 'block' || actionType === 'delete') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason {actionType === 'delete' ? '(required)' : ''}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  rows="3"
                  placeholder="Enter reason for this action..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAction}
                disabled={processing}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionType === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : actionType === 'block'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowActionModal(false)}
                disabled={processing}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
