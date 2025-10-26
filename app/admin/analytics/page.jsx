'use client';
import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    subscriptions: null,
    financials: null,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [subsRes, financialRes] = await Promise.all([
        fetch('/api/admin/subscriptions', { credentials: 'include' }),
        fetch('/api/admin/financials', { credentials: 'include' }),
      ]);

      const subsData = subsRes.ok ? await subsRes.json() : null;
      const financialData = financialRes.ok ? await financialRes.json() : null;

      setAnalytics({
        subscriptions: subsData,
        financials: financialData?.financials,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const stats = analytics.subscriptions?.stats;
  const financials = analytics.financials;
  const subscriptions = analytics.subscriptions?.subscriptions || [];

  // Calculate conversion rates
  const trialToActiveRate = stats?.trial > 0 
    ? ((stats.active / (stats.active + stats.trial)) * 100).toFixed(1)
    : 0;

  const churnRate = stats?.total > 0
    ? ((stats.cancelled / stats.total) * 100).toFixed(1)
    : 0;

  // Calculate average revenue per NGO
  const avgRevenuePerNGO = stats?.active > 0
    ? (financials?.subscriptionRevenue?.allTime / stats.active).toFixed(0)
    : 0;

  // Tier distribution
  const tierDistribution = [
    { tier: 'Bronze', count: subscriptions.filter(s => s.plan?.tier === 2 && s.status === 'active').length, color: 'amber' },
    { tier: 'Silver', count: subscriptions.filter(s => s.plan?.tier === 3 && s.status === 'active').length, color: 'gray' },
    { tier: 'Gold', count: subscriptions.filter(s => s.plan?.tier === 4 && s.status === 'active').length, color: 'yellow' },
  ];

  const maxTierCount = Math.max(...tierDistribution.map(t => t.count), 1);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Analytics & Insights</h1>
          <p className="mt-2 text-gray-400">Comprehensive platform performance metrics</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-linear-to-br from-purple-600 to-purple-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-purple-100">Total Revenue</p>
              <svg className="w-8 h-8 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(financials?.netRevenue || 0)}</p>
            <p className="text-xs text-purple-200 mt-2">Net revenue (after refunds)</p>
          </div>

          <div className="bg-linear-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-green-100">Active NGOs</p>
              <svg className="w-8 h-8 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.active || 0}</p>
            <p className="text-xs text-green-200 mt-2">Paying subscribers</p>
          </div>

          <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-blue-100">Conversion Rate</p>
              <svg className="w-8 h-8 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{trialToActiveRate}%</p>
            <p className="text-xs text-blue-200 mt-2">Trial to active conversion</p>
          </div>

          <div className="bg-linear-to-br from-orange-600 to-orange-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-orange-100">Churn Rate</p>
              <svg className="w-8 h-8 text-orange-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{churnRate}%</p>
            <p className="text-xs text-orange-200 mt-2">Cancelled subscriptions</p>
          </div>
        </div>

        {/* Charts and Data Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tier Distribution Chart */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">Active Subscriptions by Tier</h3>
            <div className="space-y-4">
              {tierDistribution.map((item) => (
                <div key={item.tier}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 font-medium">{item.tier}</span>
                    <span className="text-white font-bold">{item.count} NGOs</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.color === 'amber' ? 'bg-linear-to-r from-amber-500 to-amber-600' :
                        item.color === 'gray' ? 'bg-linear-to-r from-gray-300 to-gray-400' :
                        'bg-linear-to-r from-yellow-400 to-yellow-500'
                      }`}
                      style={{ width: `${(item.count / maxTierCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                Total Active: <span className="text-white font-semibold">{tierDistribution.reduce((sum, t) => sum + t.count, 0)} NGOs</span>
              </p>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">Revenue Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-300">Subscription Revenue</span>
                </div>
                <span className="text-white font-bold">{formatCurrency(financials?.subscriptionRevenue?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-300">GST Collected</span>
                </div>
                <span className="text-white font-bold">{formatCurrency(financials?.subscriptionRevenue?.gst || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-gray-300">Donations</span>
                </div>
                <span className="text-white font-bold">{formatCurrency(financials?.donations?.total || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-600/20 border border-red-500/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-red-300">Refunds Issued</span>
                </div>
                <span className="text-red-400 font-bold">-{formatCurrency(financials?.refunds?.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg Revenue per NGO</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(avgRevenuePerNGO)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Lifetime value per active subscriber</p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Trial NGOs</p>
                <p className="text-2xl font-bold text-white">{stats?.trial || 0}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Currently on trial period</p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Monthly Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(financials?.subscriptionRevenue?.thisMonth || 0)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">This month's subscription income</p>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">6-Month Revenue Trend</h3>
          <div className="space-y-3">
            {financials?.monthlyTrend?.slice(0, 6).reverse().map((month, index) => {
              const maxRevenue = Math.max(...(financials?.monthlyTrend || []).map(m => m.revenue), 1);
              const percentage = (month.revenue / maxRevenue) * 100;
              
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 font-medium text-sm">
                      {new Date(month.year, month.month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-white font-bold">{formatCurrency(month.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          {(!financials?.monthlyTrend || financials.monthlyTrend.length === 0) && (
            <div className="text-center py-8 text-gray-400">
              No revenue data available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
