'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
    setLoading(false);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Hide scrollbar for admin pages */}
      <style jsx global>{`
        html, body {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
      {/* Admin Navbar */}
      <nav className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Navigation Links - Left Side */}
            <div className="flex items-center gap-6">
              {/* Logo & Brand */}
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                  <span className="text-lg md:text-xl font-bold text-white">A</span>
                </div>
                <span className="text-lg md:text-xl font-bold text-white">Admin Panel</span>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="pl-2 hidden md:flex items-center gap-1">
                <Link
                  href="/admin/dashboard"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    pathname === '/admin' || pathname === '/admin/dashboard'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/verifications"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    pathname === '/admin/verifications'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Verifications
                </Link>
                <Link
                  href="/admin/users"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    pathname === '/admin/users'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Users
                </Link>
                <Link
                  href="/admin/subscriptions"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    pathname === '/admin/subscriptions'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Subscriptions
                </Link>
                {/* ✅ NEW: Funding Requests */}
                <Link
                  href="/admin/funding-requests"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    pathname === '/admin/funding-requests'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Fund Req
                </Link>
                <Link
                  href="/admin/financials"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    pathname === '/admin/financials'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Financials
                </Link>
                <Link
                  href="/admin/analytics"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    pathname === '/admin/analytics'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Analytics
                </Link>
                <Link
                  href="/admin/item-donations"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    pathname === '/admin/item-donations'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Item-Donation
                </Link>
              </div>
            </div>

            {/* Right Side - User Info & Actions */}
            <div className="flex items-center gap-4">
              {/* Hamburger Button - Mobile */}
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

              {/* Desktop User Info & Logout */}
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white font-bold">
                    {user.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user.userName}</p>
                    <p className="text-xs text-gray-400">Administrator</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700"
                >
                  Logout
                </button>
              </div>

              {/* Mobile Logout Button */}
              <button
                onClick={handleLogout}
                className="md:hidden rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-700 pt-4 mt-2">
              <div className="flex flex-col space-y-2">
                {/* User Info */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-lg mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white font-bold">
                    {user.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user.userName}</p>
                    <p className="text-xs text-gray-400">Administrator</p>
                  </div>
                </div>

                {/* Navigation Links */}
                <Link
                  href="/admin/dashboard"
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    pathname === '/admin' || pathname === '/admin/dashboard'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/verifications"
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    pathname === '/admin/verifications'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Verifications
                </Link>
                <Link
                  href="/admin/users"
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    pathname === '/admin/users'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Users
                </Link>
                <Link
                  href="/admin/subscriptions"
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    pathname === '/admin/subscriptions'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Subscriptions
                </Link>
                {/* ✅ NEW: Funding Requests Mobile */}
                <Link
                  href="/admin/funding-requests"
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    pathname === '/admin/funding-requests'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Fund Req
                </Link>
                <Link
                  href="/admin/financials"
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    pathname === '/admin/financials'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Financials
                </Link>
                <Link
                  href="/admin/analytics"
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    pathname === '/admin/analytics'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Analytics
                </Link>
                <Link
                  href="/admin/item-donations"
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    pathname === '/admin/item-donations'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Item-Donation
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
