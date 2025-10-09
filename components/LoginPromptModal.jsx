'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPromptModal() {
  const router = useRouter();
  const modalBackdropRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Lock body scroll when modal is shown
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setIsLoggedIn(true);
        return true;
      }
      return false;
    };

    // Check if user has already skipped the modal
    const hasSkipped = localStorage.getItem('loginPromptSkipped');
    const skipTimestamp = localStorage.getItem('loginPromptSkipTime');

    // If user is logged in or has recently skipped, don't show modal
    if (checkLoginStatus()) {
      return;
    }

    // If user skipped within last 10 minutes, don't show again
    if (hasSkipped && skipTimestamp) {
      const skipTime = parseInt(skipTimestamp);
      const currentTime = Date.now();
      const minutesSinceSkip = (currentTime - skipTime) / (1000 * 60);
      
      if (minutesSinceSkip < 10) {
        return;
      }
    }

    // Generate random time between 5-7 minutes (300000-420000 ms)
    const randomDelay = Math.floor(Math.random() * (420000 - 300000 + 1)) + 300000;

    // Show modal after random delay
    const timer = setTimeout(() => {
      if (!checkLoginStatus()) {
        setShowModal(true);
      }
    }, randomDelay);

    // Listen for login event
    const handleLogin = () => {
      setIsLoggedIn(true);
      setShowModal(false);
    };

    window.addEventListener('userLoggedIn', handleLogin);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('userLoggedIn', handleLogin);
    };
  }, []);

  const handleSkip = () => {
    setShowModal(false);
    localStorage.setItem('loginPromptSkipped', 'true');
    localStorage.setItem('loginPromptSkipTime', Date.now().toString());
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  if (!showModal || isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        ref={modalBackdropRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-scroll"
        style={{
          scrollbarColor: '#ef4444 transparent',
          scrollbarWidth: 'thin'
        }}
      >
        <div className="min-h-screen flex items-center justify-center py-8 px-4">
          {/* Modal */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative border border-gray-700 animate-fadeIn">
          {/* Close/Skip Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Skip"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">
              Join Our Community
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Create an account to make a difference! Track your donations, connect with NGOs, and help those in need.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all hover:shadow-lg"
            >
              Login
            </button>
            
            <button
              onClick={handleRegister}
              className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all border border-gray-600"
            >
              Create Account
            </button>

            <button
              onClick={handleSkip}
              className="w-full text-gray-400 py-2 text-sm hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Custom Scrollbar Styles */
        /* Firefox */
        .fixed.overflow-y-scroll {
          scrollbar-color: #ef4444 transparent;
          scrollbar-width: thin;
        }

        /* WebKit browsers (Chrome, Safari, Edge) */
        .fixed.overflow-y-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .fixed.overflow-y-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .fixed.overflow-y-scroll::-webkit-scrollbar-thumb {
          background-color: #ef4444;
          border-radius: 4px;
        }

        .fixed.overflow-y-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #dc2626;
        }
      `}</style>
    </>
  );
}
