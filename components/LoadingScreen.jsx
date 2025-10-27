'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen({ message = 'Loading...', subMessage = '' }) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-4">
      {/* Card container */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
        
        {/* Main card */}
        <div className="relative bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            {/* Animated logo */}
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 shadow-lg">
              <svg className="w-10 h-10 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>

            {/* Text */}
            <h3 className="text-xl font-bold text-white mb-2">
              {message}
              <span className="inline-block w-8">
                {'.'.repeat(dots)}
              </span>
            </h3>
            {subMessage && (
              <p className="text-gray-400 text-sm mb-6">{subMessage}</p>
            )}

            {/* Animated bars */}
            <div className="flex gap-1 justify-center">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-8 bg-gradient-to-t from-gray-700 to-red-500 rounded-full"
                  style={{
                    animation: 'wave 1s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            transform: scaleY(0.5);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
