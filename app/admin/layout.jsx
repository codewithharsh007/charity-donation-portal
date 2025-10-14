'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

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
            {/* Logo & Brand */}
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                  <span className="text-xl font-bold text-white">A</span>
                </div>
                <span className="text-xl font-bold text-white">Admin Panel</span>
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
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
                  href="/admin/analytics"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    pathname === '/admin/analytics'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Analytics
                </Link>
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
