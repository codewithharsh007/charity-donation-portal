'use client';
import { useEffect, useState } from 'react';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({});
  const [revenueByTier, setRevenueByTier] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'cancel', 'changeTier', 'refund'
  const [selectedItem, setSelectedItem] = useState(null);
  const [reason, setReason] = useState('');
  const [newTier, setNewTier] = useState(1);
  const [refundAmount, setRefundAmount] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const filterParam = filter !== 'all' ? `?filter=${filter}` : '';
      const res = await fetch(`/api/admin/subscriptions${filterParam}`, {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        setStats(data.stats || {});
        setRevenueByTier(data.revenueByTier || {});
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (type, item) => {
    setActionType(type);
    setSelectedItem(item);
    setReason('');
    if (type === 'changeTier' && item.plan) {
      setNewTier(item.plan.tier);
    }
    if (type === 'refund' && item.totalAmount) {
      setRefundAmount(item.totalAmount);
    }
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if (!reason || reason.trim().length < 10) {
      alert('Reason must be at least 10 characters');
      return;
    }

    setProcessing(true);

    try {
      let url = '';
      let body = { reason };

      if (actionType === 'cancel') {
        url = `/api/admin/subscriptions/cancel?id=${selectedItem._id}`;
      } else if (actionType === 'changeTier') {
        url = `/api/admin/subscriptions/change-tier?id=${selectedItem._id}`;
        body.newTier = newTier;
      } else if (actionType === 'refund') {
        url = `/api/admin/subscriptions/refund?id=${selectedItem._id}`;
        body.refundAmount = refundAmount;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Action completed successfully');
        setShowActionModal(false);
        fetchSubscriptions();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (error) {
      alert('Error performing action');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const getTierBadge = (tier) => {
    const badges = {
      1: 'bg-gray-500 text-white',
      2: 'bg-amber-600 text-white',
      3: 'bg-gray-400 text-white',
      4: 'bg-yellow-500 text-white',
    };
    const names = { 1: 'FREE', 2: 'BRONZE', 3: 'SILVER', 4: 'GOLD' };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[tier]}`}>{names[tier]}</span>;
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400 border-green-500/50',
      trial: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
      expired: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}>{status.toUpperCase()}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Subscription Management</h1>
          <p className="mt-2 text-gray-400">Manage NGO subscriptions and revenue</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-xl">
            <p className="text-sm font-medium text-blue-100">Total Subscriptions</p>
            <p className="text-3xl font-bold text-white mt-2">{stats.total || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-xl">
            <p className="text-sm font-medium text-green-100">Active</p>
            <p className="text-3xl font-bold text-white mt-2">{stats.active || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 shadow-xl">
            <p className="text-sm font-medium text-purple-100">Trial</p>
            <p className="text-3xl font-bold text-white mt-2">{stats.trial || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 shadow-xl">
            <p className="text-sm font-medium text-red-100">Total Revenue</p>
            <p className="text-3xl font-bold text-white mt-2">{formatCurrency(revenueByTier.total)}</p>
          </div>
        </div>

        {/* Revenue by Tier */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(tier => (
            <div key={tier} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                {getTierBadge(tier)}
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(revenueByTier[`tier${tier}`])}</p>
              <p className="text-xs text-gray-400 mt-1">Revenue</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {['all', 'active', 'trial', 'cancelled', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Subscriptions Table */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">NGO</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Tier</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Billing</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Next Billing</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{sub.ngo?.userName || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{sub.ngo?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {sub.plan ? getTierBadge(sub.plan.tier) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                      <td className="px-6 py-4">
                        <p className="text-white text-sm">{sub.billing?.isYearly ? 'Yearly' : 'Monthly'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white text-sm">{formatDate(sub.billing?.nextBillingDate)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {sub.status === 'active' && (
                            <>
                              <button
                                onClick={() => openActionModal('changeTier', sub)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                Change Tier
                              </button>
                              <button
                                onClick={() => openActionModal('cancel', sub)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
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
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              {actionType === 'cancel' && 'Cancel Subscription'}
              {actionType === 'changeTier' && 'Change Tier'}
              {actionType === 'refund' && 'Issue Refund'}
            </h3>

            {actionType === 'changeTier' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">New Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value={1}>Tier 1 - FREE</option>
                  <option value={2}>Tier 2 - BRONZE</option>
                  <option value={3}>Tier 3 - SILVER</option>
                  <option value={4}>Tier 4 - GOLD</option>
                </select>
              </div>
            )}

            {actionType === 'refund' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Refund Amount</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  max={selectedItem?.totalAmount}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Reason (min 10 characters)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                rows="4"
                placeholder="Enter detailed reason for this action..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAction}
                disabled={processing || reason.length < 10}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
