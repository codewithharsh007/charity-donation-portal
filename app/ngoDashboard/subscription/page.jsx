// app/ngoDashboard/subscription/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscriptionDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch current subscription
      const subRes = await fetch('/api/subscriptions/current', {
        credentials: 'include'
      });
      
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptionData(subData.data); // ✅ Use subData.data
      }

      // Fetch transaction history
      const txRes = await fetch('/api/subscriptions/transactions', {
        credentials: 'include'
      });
      
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (err) {
      setError('Failed to load subscription data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/subscription/plans');
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        alert('Subscription cancelled successfully');
        fetchSubscriptionData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      alert('Error cancelling subscription');
    }
  };

  const getTierBadge = (tier) => {
    const badges = {
      1: { name: 'FREE', color: 'bg-gray-100 text-gray-800' },
      2: { name: 'BRONZE', color: 'bg-amber-700 text-white' },
      3: { name: 'SILVER', color: 'bg-gray-400 text-white' },
      4: { name: 'GOLD', color: 'bg-yellow-500 text-white' }
    };
    const badge = badges[tier] || badges[1];
    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>{badge.name}</span>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData || !subscriptionData.plan) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Active Subscription</h2>
            <p className="text-gray-600 mb-6">
              You are currently on the FREE tier. Upgrade to unlock more features and increase your impact!
            </p>
            <button
              onClick={handleUpgrade}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              View Subscription Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  const plan = subscriptionData.plan;
  const currentTier = subscriptionData.currentTier || 1;
  const tierName = subscriptionData.tierName || 'FREE';
  const status = subscriptionData.status || 'active';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Subscription Management</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and view usage statistics</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{plan.displayName || tierName}</h2>
              <p className="text-blue-100 mb-4">{tierName} Tier Subscription</p>
              <div className="flex items-center gap-4">
                {getTierBadge(currentTier)}
                {plan.pricing && (
                  <span className="text-xl font-semibold">
                    {formatCurrency(plan.pricing.monthly)}
                    <span className="text-sm font-normal ml-1">/ month</span>
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              {status === 'active' && subscriptionData.expiresAt && (
                <>
                  <p className="text-sm text-blue-100">Subscription expires</p>
                  <p className="text-lg font-semibold">{formatDate(subscriptionData.expiresAt)}</p>
                </>
              )}
              {status === 'trial' && subscriptionData.expiresAt && (
                <>
                  <p className="text-sm text-blue-100">Trial ends on</p>
                  <p className="text-lg font-semibold">{formatDate(subscriptionData.expiresAt)}</p>
                </>
              )}
              {currentTier === 1 && (
                <p className="text-sm text-blue-100">Forever Free</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            {currentTier < 4 && (
              <button
                onClick={handleUpgrade}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition font-semibold"
              >
                Upgrade Plan
              </button>
            )}
            {currentTier > 1 && status === 'active' && (
              <button
                onClick={handleCancelSubscription}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* Usage Statistics - Only show for paid tiers */}
        {currentTier > 1 && plan.limits && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Active Requests */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Active Requests</h3>
                <span className="text-2xl">📋</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    Limit: {plan.limits.activeRequests === -1 ? '∞' : plan.limits.activeRequests}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Maximum concurrent requests</p>
            </div>

            {/* Monthly Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Monthly Items</h3>
                <span className="text-2xl">📦</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    Limit: {plan.limits.monthlyAcceptance === -1 ? '∞' : plan.limits.monthlyAcceptance}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Items per month</p>
            </div>

            {/* Max Item Value */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Max Item Value</h3>
                <span className="text-2xl">💰</span>
              </div>
              <div className="mb-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    {plan.limits.maxItemValue === -1 ? '∞' : formatCurrency(plan.limits.maxItemValue)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {plan.permissions?.canRequestFinancial ? '✅ Financial requests enabled' : '🔒 Upgrade for financial requests'}
              </p>
            </div>
          </div>
        )}

        {/* Features & Limits */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Plan Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Plan Details</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Tier {currentTier}: {tierName}</span>
                </li>
                {plan.limits && (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Active Requests: {plan.limits.activeRequests === -1 ? 'Unlimited' : plan.limits.activeRequests}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Monthly Items: {plan.limits.monthlyAcceptance === -1 ? 'Unlimited' : plan.limits.monthlyAcceptance}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Max Item Value: {plan.limits.maxItemValue === -1 ? 'Unlimited' : formatCurrency(plan.limits.maxItemValue)}</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Additional Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {plan.features && plan.features.length > 0 ? (
                  plan.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">Standard features included</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Billing History</h3>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {tx.planDetails?.planName || 'Subscription'} - {tx.planDetails?.billingCycle || 'monthly'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-800 font-semibold">
                        {formatCurrency(tx.invoice?.total || tx.amount || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tx.status?.charAt(0).toUpperCase() + tx.status?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/ngoDashboard')}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
