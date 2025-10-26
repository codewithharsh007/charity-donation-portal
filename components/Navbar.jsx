// components/Navbar.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState(null);

  useEffect(() => {
    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('userLoggedIn', checkUser);

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('userLoggedIn', checkUser);
    };
  }, [pathname]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const checkUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.userType === 'ngo' || parsedUser.role === 'ngo') {
        fetchSubscriptionTier();
      }
    } else {
      setUser(null);
      setSubscriptionTier(null);
    }
  };

  const fetchSubscriptionTier = async () => {
    try {
      const response = await fetch('/api/subscriptions/current', {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setSubscriptionTier({
          tier: data.data.currentTier || 1,
          name: data.data.tierName || 'FREE',
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const getTierStyles = () => {
    if (!subscriptionTier) return { ring: '', badge: '', icon: '' };

    const styles = {
      1: { 
        ring: 'ring-2 ring-gray-400', 
        badge: 'bg-gradient-to-br from-gray-500 to-gray-600 text-white',
        icon: '🆓'
      },
      2: { 
        ring: 'ring-2 ring-amber-600', 
        badge: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
        icon: '🥉'
      },
      3: { 
        ring: 'ring-2 ring-gray-300', 
        badge: 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800',
        icon: '🥈'
      },
      4: { 
        ring: 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800', 
        badge: 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900',
        icon: '👑'
      },
    };

    return styles[subscriptionTier.tier] || styles[1];
  };

  const renderAvatar = (size = 'md') => {
    const tierStyles = getTierStyles();
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-9 h-9',
    };

    return (
      <div className="relative">
        {/* Avatar with Ring */}
        <div className={`${sizeClasses[size]} ${tierStyles.ring} rounded-full p-0.5 bg-gray-800`}>
          <div className={`w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${size === 'md' ? 'text-base' : 'text-sm'}`}>
            {user?.userName?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Tier Badge - Bottom Right */}
        {(user?.userType === 'ngo' || user?.role === 'ngo') && subscriptionTier && (
          <div className={`absolute -bottom-1 -right-1 ${tierStyles.badge} rounded-full w-5 h-5 flex items-center justify-center shadow-lg border-2 border-gray-800`}>
            <span className="text-xs">{tierStyles.icon}</span>
          </div>
        )}
      </div>
    );
  };

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/donorDashboard') || pathname?.startsWith('/ngoDashboard') || pathname?.startsWith('/ngo/marketplace') || pathname?.startsWith('/donate') || pathname?.startsWith('/thank-you')) {
    return null;
  }

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
            
            {user ? (
              <Link 
                href={dashboardPath}
                className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 hover:border-red-500 transition-all cursor-pointer group"
              >
                {/* Avatar with Ring and Badge */}
                {renderAvatar('md')}
                
                {/* User Info */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold group-hover:text-red-400 transition-colors">
                      {user.userName}
                    </span>
                    
                    {/* Verified Badge */}
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
          <div className="md:hidden mt-4 pb-4 border-t border-gray-800 pt-4">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-white hover:text-red-500 transition-colors py-2 text-center">
                Home
              </Link>
              <Link href="/about" className="text-white hover:text-red-500 transition-colors py-2 text-center">
                About
              </Link>
              <Link href="/contact" className="text-white hover:text-red-500 transition-colors py-2 text-center">
                Contact
              </Link>
              
              {user ? (
                <Link 
                  href={dashboardPath}
                  className="flex items-center gap-3 bg-gray-800 px-4 py-3 rounded-lg border border-gray-700 hover:border-red-500 transition-all"
                >
                  {/* Avatar with Ring and Badge */}
                  {renderAvatar('sm')}
                  
                  {/* User Info */}
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-semibold">{user.userName}</span>
                      
                      {/* Verified Badge */}
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
