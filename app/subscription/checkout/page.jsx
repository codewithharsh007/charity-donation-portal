'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Toast from '@/components/Toast';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const tier = searchParams.get('tier');

  const [plan, setPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [testMode, setTestMode] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Test payment modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testOrderData, setTestOrderData] = useState(null);

  useEffect(() => {
    if (planId) {
      fetchPlanDetails();
    }
  }, [planId]);

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ show: true, message, type, duration });
  };

  const fetchPlanDetails = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      const data = await response.json();
      if (data.success) {
        const selectedPlan = data.data?.find((p) => p._id === planId);
        setPlan(selectedPlan);
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      showToast('Error fetching plan details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!plan) return { subtotal: 0, gst: 0, total: 0 };
    const subtotal = billingCycle === 'monthly' ? plan.pricing.monthly : plan.pricing.yearly;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Check if trial
      if (isTrial) {
        const response = await fetch('/api/subscriptions/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            planId: plan._id,
            billingCycle,
            isTrial: true,
          }),
        });

        if (response.status === 401 || response.status === 403) {
          showToast('Please login first', 'warning');
          setTimeout(() => router.push('/login'), 1200);
          setProcessing(false);
          return;
        }

        const data = await response.json();

        if (data.success) {
          showToast('Trial activated successfully!', 'success');
          // ✅ Wait a bit for database to update, then redirect
          setTimeout(() => {
            router.push('/ngoDashboard');
            router.refresh(); // Force refresh the page
          }, 1500);
        } else {
          showToast(data.message || 'Failed to activate trial', 'error');
        }
        setProcessing(false);
        return;
      }

      // Create payment order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          planId: plan._id,
          billingCycle,
        }),
      });

      if (orderResponse.status === 401 || orderResponse.status === 403) {
        showToast('Please login first', 'warning');
        setTimeout(() => router.push('/login'), 1200);
        setProcessing(false);
        return;
      }

      const orderData = await orderResponse.json();
      

      if (!orderData.success) {
        showToast(orderData.message || 'Failed to create payment order', 'error');
        setProcessing(false);
        return;
      }

      setTestMode(orderData.testMode);

      if (orderData.testMode) {
        setShowTestModal(true);
        setTestOrderData(orderData);
      } else {
        handleRazorpayPayment(orderData);
      }
    } catch (error) {
      console.error('Payment error:', error);
      showToast('Payment failed. Please try again.', 'error');
      setProcessing(false);
    }
  };

  const handleTestPayment = async () => {
    setShowTestModal(false);
    try {
      
      // Get test payment details
      const testResponse = await fetch('/api/payments/test-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          transactionId: testOrderData.transactionId,
        }),
      });

      if (testResponse.status === 401 || testResponse.status === 403) {
        showToast('Please login first', 'warning');
        setTimeout(() => router.push('/login'), 1200);
        setProcessing(false);
        return;
      }

      const testData = await testResponse.json();
      

      if (testData.success) {
        // Verify the payment
          const verifyResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            razorpay_order_id: testData.data.razorpay_order_id,
            razorpay_payment_id: testData.data.razorpay_payment_id,
            razorpay_signature: testData.data.razorpay_signature,
            transactionId: testData.data.transactionId,
          }),
        });

        if (verifyResponse.status === 401 || verifyResponse.status === 403) {
          showToast('Please login first', 'warning');
          setTimeout(() => router.push('/login'), 1200);
          setProcessing(false);
          return;
        }

        const verifyData = await verifyResponse.json();
        

        if (verifyData.success) {
          showToast('🎉 Payment successful! Subscription activated to ' + verifyData.plan.displayName, 'success', 5000);
          
          // ✅ CRITICAL FIX: Wait for database to fully update, then redirect
          setTimeout(() => {
            // Force hard navigation to ensure fresh data
            window.location.href = '/ngoDashboard';
          }, 2000);
        } else {
          showToast(verifyData.message || 'Payment verification failed', 'error');
          setProcessing(false);
        }
      } else {
        showToast(testData.message || 'Failed to get test credentials', 'error');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Test payment error:', error);
      showToast('Test payment failed: ' + error.message, 'error');
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = (orderData) => {
    try {
      const options = {
        key: orderData.keyId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency,
        name: 'Charity Donation Portal',
        description: `${orderData.plan.displayName} - ${billingCycle}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                transactionId: orderData.transactionId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              showToast('🎉 Payment successful! Subscription activated.', 'success', 5000);
              
              // ✅ Wait for database update, then redirect
              setTimeout(() => {
                window.location.href = '/ngoDashboard';
              }, 2000);
            } else {
              showToast(verifyData.message || 'Payment verification failed', 'error');
              setProcessing(false);
            }
          } catch (err) {
            console.error('Verification error:', err);
            showToast('Payment verification failed', 'error');
            setProcessing(false);
          }
        },
        prefill: {
          email: '',
          contact: '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            showToast('Payment cancelled', 'info');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        showToast('Payment failed: ' + response.error.description, 'error');
        setProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      showToast('Failed to initialize payment', 'error');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Plan not found</div>
      </div>
    );
  }

  const { subtotal, gst, total } = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
            <p className="text-blue-100">You're just one step away from upgrading your NGO</p>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Side - Plan Details */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {plan.displayName} ({plan.name})
                </h2>

                {/* Billing Cycle Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Cycle
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        billingCycle === 'monthly'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-semibold">Monthly</div>
                      <div className="text-2xl font-bold text-gray-900">₹{plan.pricing.monthly}</div>
                      <div className="text-sm text-gray-600">per month</div>
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors relative ${
                        billingCycle === 'yearly'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
                        Save 17%
                      </div>
                      <div className="font-semibold">Yearly</div>
                      <div className="text-2xl font-bold text-gray-900">₹{plan.pricing.yearly}</div>
                      <div className="text-sm text-gray-600">per year</div>
                    </button>
                  </div>
                </div>

                {/* Trial Option */}
                <div className="mb-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTrial}
                      onChange={(e) => setIsTrial(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Start with {tier === '2' ? '14' : '7'}-day free trial
                    </span>
                  </label>
                  {isTrial && (
                    <p className="mt-2 text-sm text-gray-600 ml-8">
                      You won't be charged now. Payment will be due after the trial ends.
                    </p>
                  )}
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">What's included:</h3>
                  <ul className="space-y-2">
                    {plan.features?.slice(0, 8).map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Side - Payment Summary */}
              <div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>

                  {isTrial ? (
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Trial Period:</span>
                        <span className="font-semibold text-green-600">FREE</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold">{tier === '2' ? '14' : '7'} days</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Due Today:</span>
                          <span className="text-2xl font-bold text-gray-900">₹0</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">GST (18%):</span>
                        <span className="font-semibold">₹{gst.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Total:</span>
                          <span className="text-2xl font-bold text-gray-900">₹{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : isTrial ? (
                      'Start Free Trial'
                    ) : (
                      'Continue to Payment'
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    {testMode && '🧪 TEST MODE - '}
                    Secure payment powered by Razorpay
                  </p>
                </div>

                {/* Security Note */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">🔒</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Secure Payment</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Your payment information is encrypted and secure. We never store your card details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Back to plans
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration || 3000}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Test Payment Modal */}
      {showTestModal && testOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-2 text-blue-700">🧪 Test Mode Payment</h2>
            <p className="mb-4 text-gray-700">
              <span className="font-semibold">Plan:</span> {plan.displayName}<br />
              <span className="font-semibold">Amount:</span> ₹{testOrderData.amount?.toFixed(2)}<br />
              <span className="font-semibold">Order ID:</span> {testOrderData.orderId}
            </p>
            <p className="mb-4 text-gray-600 text-sm">
              Click "Simulate Payment" to complete a mock payment for testing purposes.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setProcessing(false);
                }}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTestPayment}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Simulate Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
