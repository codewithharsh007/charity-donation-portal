'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    };

    // Check on mount
    checkUser();

    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', checkUser);
    
    // Listen for custom login event
    window.addEventListener('userLoggedIn', checkUser);

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('userLoggedIn', checkUser);
    };
  }, [pathname]); // Re-check when route changes

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Hide navbar on admin pages, donor dashboard, ngo dashboard, ngo marketplace, donate page, and thank-you page
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/donorDashboard') || pathname?.startsWith('/ngoDashboard') || pathname?.startsWith('/ngo/marketplace') || pathname?.startsWith('/donate') || pathname?.startsWith('/thank-you')) {
    return null;
  }

  // Don't show navbar for admin users
  // (removed stray redirect logic) Navbar should not auto-redirect — login handler controls navigation
  const dashboardPath = user ? (user.role || user.userType) === 'ngo' ? '/ngoDashboard' : (user.role || user.userType) === 'admin' ? '/admin' : '/donorDashboard' : '/login';
  
  return (
    <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="text-2xl font-bold">
            <Link href="/" className="text-red-500">
              Charity
            </Link>
          </div>

          {/* Hamburger Button - Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-red-500 transition-colors p-2"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
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

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-white hover:text-red-500 transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-white hover:text-red-500 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-white hover:text-red-500 transition-colors">
              Contact
            </Link>
            
            {/* Conditional Rendering: Login/Profile */}
            {user ? (
              <Link 
                href={dashboardPath}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 hover:border-red-500 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.userName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold">{user.userName}</span>
                    {user.userType === 'ngo' && user.isVerified && (
                      <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">{user.email}</span>
                </div>
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-all hover:shadow-lg font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-800 pt-4 text-center">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-white hover:text-red-500 transition-colors py-2"
              >
                Home
              </Link>
              <Link 
                href="/about" 
                className="text-white hover:text-red-500 transition-colors py-2"
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-white hover:text-red-500 transition-colors py-2"
              >
                Contact
              </Link>
              
              {user ? (
                <Link 
                  href={dashboardPath}
                  className="flex items-center gap-3 bg-gray-800 px-4 py-3 rounded-lg border border-gray-700 hover:border-red-500 transition-all"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-semibold">{user.userName}</span>
                      {user.userType === 'ngo' && user.isVerified && (
                        <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs">{user.email}</span>
                  </div>
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all hover:shadow-lg font-medium text-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
