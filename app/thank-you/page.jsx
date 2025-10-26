// app/thank-you/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Heart, Home, LayoutDashboard } from 'lucide-react';

export default function ThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  
  const type = searchParams.get('type'); // 'financial' or 'item'
  const amount = searchParams.get('amount');
  const category = searchParams.get('category');
  const itemCount = searchParams.get('itemCount');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoToDashboard = () => {
    if (user?.role === 'ngo') {
      router.push('/ngoDashboard');
    } else {
      router.push('/donorDashboard');
    }
  };

  const handleViewHistory = () => {
    router.push('/donate?tab=history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Success Card */}
        <div className="overflow-hidden rounded-3xl border border-green-200 bg-white shadow-2xl">
          {/* Header with animated checkmark */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
              <CheckCircle className="h-16 w-16 text-green-500 " />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Thank You for Your Generosity! 🎉
            </h1>
            <p className="mt-4 text-lg text-green-50">
              Your donation has been received successfully
            </p>
          </div>

          {/* Donation Details */}
          <div className="px-8 py-8">
            {type === 'financial' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-6 text-center">
                  <p className="text-sm font-medium text-gray-600">Donation Amount</p>
                  <p className="mt-2 text-5xl font-bold text-green-600">
                    ₹{Number(amount).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">
                    Your financial contribution will help us make a meaningful impact in the lives of those in need.
                  </p>
                </div>
              </div>
            )}

            {type === 'item' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Category</p>
                      <p className="mt-2 text-2xl font-bold text-blue-600">{category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Items Donated</p>
                      <p className="mt-2 text-2xl font-bold text-blue-600">{itemCount}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4">
                  <p className="text-center text-sm font-medium text-yellow-800">
                    ⏳ Your donation is pending admin approval. We'll notify you once it's reviewed.
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">
                    Thank you for donating items! Your generosity will directly benefit those in need.
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="my-8 border-t border-gray-200"></div>

            {/* What's Next */}
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">What's Next?</h2>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-green-500">✓</span>
                  <p className="text-gray-600">
                    {type === 'financial' 
                      ? 'Your payment has been processed securely'
                      : 'Your donation will be reviewed by our admin team'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500">✓</span>
                  <p className="text-gray-600">
                    {type === 'financial'
                      ? 'A receipt will be sent to your registered email'
                      : 'You will be notified once an NGO accepts your donation'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500">✓</span>
                  <p className="text-gray-600">
                    {type === 'financial'
                      ? 'Track your donation impact in your dashboard'
                      : 'NGO will coordinate pickup from your provided address'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button
                onClick={handleViewHistory}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
              >
                <Heart className="h-5 w-5" />
                View History
              </button>
              
              <button
                onClick={handleGoToDashboard}
                className="flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-500 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-blue-600"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </button>

              <button
                onClick={handleGoHome}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
              >
                <Home className="h-5 w-5" />
                Go Home
              </button>
            </div>
          </div>

          {/* Footer Message */}
          <div className="border-t border-gray-100 bg-gray-50 px-8 py-6 text-center">
            <p className="text-sm text-gray-600">
              💚 Together, we're making a difference in our community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
