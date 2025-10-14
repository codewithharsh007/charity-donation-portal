'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalNGOs: 0,
    verifiedNGOs: 0,
    pendingVerifications: 0,
    rejectedVerifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch verification stats
      const verificationResponse = await fetch('/api/admin/verifications');
      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        const verifications = verificationData.verifications || [];

        const pending = verifications.filter(v => v.verificationStatus === 'pending').length;
        const verified = verifications.filter(v => v.verificationStatus === 'accepted').length;
        const rejected = verifications.filter(v => v.verificationStatus === 'rejected').length;

        setStats(prev => ({
          ...prev,
          totalNGOs: verifications.length,
          verifiedNGOs: verified,
          pendingVerifications: pending,
          rejectedVerifications: rejected,
        }));

        // Set recent activity (last 5 verifications)
        const recent = verifications
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
          .slice(0, 5)
          .map(v => ({
            id: v._id,
            type: 'verification',
            ngoName: v.ngoName,
            status: v.verificationStatus,
            date: v.submittedAt,
          }));
        setRecentActivity(recent);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'accepted':
        return 'bg-green-500/20 text-green-500';
      case 'rejected':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-gray-400">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Users</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pending Verifications */}
          <div className="rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-100">Pending</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.pendingVerifications}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Verified NGOs */}
          <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Verified NGOs</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.verifiedNGOs}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total NGOs */}
          <div className="rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-100">Total NGOs</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.totalNGOs}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-gray-800 p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
                <Link
                  href="/admin/verifications"
                  className="text-sm font-medium text-red-500 hover:text-red-400"
                >
                  View All →
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <div className="py-12 text-center text-gray-400">No recent activity</div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-700/50 p-4 transition-all hover:border-gray-600"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600">
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{activity.ngoName}</p>
                          <p className="text-sm text-gray-400">
                            Submitted verification • {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(activity.status)}`}>
                        {activity.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-gray-800 p-6 shadow-2xl">
              <h2 className="mb-6 text-2xl font-bold text-white">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/admin/verifications?filter=pending"
                  className="flex items-center gap-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 transition-all hover:bg-yellow-500/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Review Pending</p>
                    <p className="text-xs text-gray-400">{stats.pendingVerifications} applications</p>
                  </div>
                </Link>

                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 transition-all hover:bg-blue-500/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Manage Users</p>
                    <p className="text-xs text-gray-400">View all users</p>
                  </div>
                </Link>

                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 p-4 transition-all hover:bg-green-500/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">View Analytics</p>
                    <p className="text-xs text-gray-400">Reports & insights</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
