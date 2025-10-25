"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Heart, ArrowLeft, Home, Clock, Package, DollarSign } from 'lucide-react';

export default function ThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [donationType, setDonationType] = useState('');
  const [donationDetails, setDonationDetails] = useState(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Get donation details from URL params
    const type = searchParams.get('type'); // 'financial' or 'item'
    const amount = searchParams.get('amount');
    const category = searchParams.get('category');
    const itemCount = searchParams.get('itemCount');
    
    setDonationType(type || 'general');
    setDonationDetails({
      amount,
      category,
      itemCount
    });

    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/donorDashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, router]);

  const getDonationMessage = () => {
    if (donationType === 'financial' && donationDetails?.amount) {
      return {
        title: 'Financial Donation Successful!',
        subtitle: `Thank you for your generous donation of ₹${donationDetails.amount}`,
        icon: DollarSign,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        message: 'Your financial contribution will directly help those in need. We will process your donation and send you a receipt via email shortly.'
      };
    } else if (donationType === 'item') {
      return {
        title: 'Item Donation Submitted!',
        subtitle: donationDetails?.category 
          ? `${donationDetails.category} donation${donationDetails.itemCount ? ` (${donationDetails.itemCount} items)` : ''} submitted for review`
          : 'Your items have been submitted for review',
        icon: Package,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        message: 'Your item donation has been submitted successfully! Our admin team will review your donation within 24-48 hours. Once approved, NGOs in your area will be able to view and accept your donation. You will receive notifications about the status via email.'
      };
    } else {
      return {
        title: 'Donation Successful!',
        subtitle: 'Thank you for your generosity',
        icon: Heart,
        color: 'text-pink-500',
        bgColor: 'bg-pink-500/10',
        message: 'Your donation has been received successfully. Together, we can make a difference!'
      };
    }
  };

  const message = getDonationMessage();
  const IconComponent = message.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8 md:p-12 animate-fadeIn">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className={`relative ${message.bgColor} rounded-full p-6 animate-scaleIn`}>
              <CheckCircle className="w-20 h-20 text-green-400 absolute inset-0 m-auto animate-checkmark" />
              <IconComponent className={`w-20 h-20 ${message.color}`} />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-slideDown">
              {message.title}
            </h1>
            <p className="text-xl text-gray-300 mb-2 animate-slideDown delay-100">
              {message.subtitle}
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm animate-slideDown delay-200">
              <Clock className="w-4 h-4" />
              <span>Received on {new Date().toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-8"></div>

          {/* Message Details */}
          <div className="bg-gray-900/50 rounded-2xl p-6 mb-8 border border-gray-700/30 animate-slideUp">
            <p className="text-gray-300 text-center leading-relaxed">
              {message.message}
            </p>
          </div>

          {/* Next Steps */}
          {donationType === 'item' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-8 animate-slideUp delay-100">
              <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Next Steps
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Admin will review your donation within 24-48 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Once approved, NGOs in your area can view and accept it</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>You'll receive pickup notifications when an NGO accepts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Track your donation status in the Donation History</span>
                </li>
              </ul>
            </div>
          )}

          {donationType === 'financial' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-8 animate-slideUp delay-100">
              <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                What Happens Next
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>A donation receipt will be sent to your registered email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Your contribution will be allocated to verified NGOs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>You can track the impact in your Donation History</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Tax exemption certificate (if applicable) will be processed</span>
                </li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-slideUp delay-200">
            <button
              onClick={() => router.push('/donorDashboard')}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 border border-gray-600 hover:border-gray-500"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </button>
          </div>

          {/* Auto-redirect notice */}
          <div className="text-center mt-6 text-gray-400 text-sm animate-fadeIn delay-300">
            Automatically redirecting to dashboard in {countdown} seconds...
          </div>
        </div>

        {/* Floating hearts animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              className="absolute text-pink-500/30 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
                width: `${20 + Math.random() * 20}px`,
                height: `${20 + Math.random() * 20}px`
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes checkmark {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
        
        @keyframes float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.6s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
        
        .animate-checkmark {
          animation: checkmark 2s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 5s ease-in infinite;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
