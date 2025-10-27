// app/subscription/plans/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState(1);
  const [currentTierName, setCurrentTierName] = useState('FREE');
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isDowngrade, setIsDowngrade] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/current', {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setCurrentTier(data.data.currentTier || 1);
        setCurrentTierName(data.data.tierName || 'FREE');
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
  };

  const handleSelectPlan = (plan) => {
    // Already on this plan
    if (plan.tier === currentTier) {
      return;
    }
    
    // Show confirmation modal for any plan change
    setSelectedPlan(plan);
    setIsDowngrade(plan.tier < currentTier);
    setShowModal(true);
  };

  const handleConfirmPlanChange = () => {
    setShowModal(false);
    
    if (selectedPlan.tier === 1) {
      // Downgrade to FREE - call the API directly
      handleDowngradeToFree();
    } else {
      // Go to checkout for paid tiers (both upgrade and downgrade)
      router.push(`/ngo/subscription/checkout?planId=${selectedPlan._id}&tier=${selectedPlan.tier}`);
    }
  };

  const handleDowngradeToFree = async () => {
    try {
      const response = await fetch('/api/subscriptions/downgrade-to-free', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert(data.message || 'Failed to downgrade');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      alert('Failed to downgrade. Please try again.');
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 1: return 'border-green-500 bg-green-50';
      case 2: return 'border-amber-600 bg-amber-50';
      case 3: return 'border-gray-400 bg-gray-50';
      case 4: return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300';
    }
  };

  const getBadgeColor = (tier) => {
    switch (tier) {
      case 1: return 'bg-green-500 text-white';
      case 2: return 'bg-amber-600 text-white';
      case 3: return 'bg-gray-400 text-white';
      case 4: return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getModalContent = () => {
    if (!selectedPlan) return { icon: '❓', title: '', color: 'blue' };

    if (isDowngrade) {
      return {
        icon: selectedPlan.tier === 1 ? '⚠️' : '⬇️',
        title: selectedPlan.tier === 1 ? 'Downgrade to FREE?' : `Downgrade to ${selectedPlan.name}?`,
        color: selectedPlan.tier === 1 ? 'red' : 'orange',
        description: selectedPlan.tier === 1 
          ? 'You will lose access to all premium features.'
          : 'You will lose access to some premium features.',
      };
    } else {
      return {
        icon: '🚀',
        title: `Upgrade to ${selectedPlan.name}?`,
        color: 'green',
        description: 'Unlock more features and grow your impact!',
      };
    }
  };

  const getFeatureChanges = () => {
    if (!selectedPlan) return { losses: [], gains: [] };

    const currentPlan = plans.find(p => p.tier === currentTier);
    if (!currentPlan) return { losses: [], gains: [] };

    const losses = [];
    const gains = [];

    if (isDowngrade) {
      // Calculate losses
      if (selectedPlan.limits.activeRequests < currentPlan.limits.activeRequests) {
        losses.push(`Active requests: ${currentPlan.limits.activeRequests === -1 ? 'Unlimited' : currentPlan.limits.activeRequests} → ${selectedPlan.limits.activeRequests}`);
      }
      if (selectedPlan.limits.monthlyAcceptance < currentPlan.limits.monthlyAcceptance) {
        losses.push(`Monthly items: ${currentPlan.limits.monthlyAcceptance === -1 ? 'Unlimited' : currentPlan.limits.monthlyAcceptance} → ${selectedPlan.limits.monthlyAcceptance}`);
      }
      if (selectedPlan.limits.financialDonationLimit < currentPlan.limits.financialDonationLimit) {
        losses.push(selectedPlan.limits.financialDonationLimit === 0 ? 'Financial requests disabled' : 'Reduced financial limit');
      }
    } else {
      // Calculate gains
      if (selectedPlan.limits.activeRequests > currentPlan.limits.activeRequests) {
        gains.push(`${selectedPlan.limits.activeRequests === -1 ? 'Unlimited' : selectedPlan.limits.activeRequests} active requests (was ${currentPlan.limits.activeRequests})`);
      }
      if (selectedPlan.limits.monthlyAcceptance > currentPlan.limits.monthlyAcceptance) {
        gains.push(`${selectedPlan.limits.monthlyAcceptance === -1 ? 'Unlimited' : selectedPlan.limits.monthlyAcceptance} monthly items (was ${currentPlan.limits.monthlyAcceptance})`);
      }
      if (selectedPlan.limits.financialDonationLimit > currentPlan.limits.financialDonationLimit) {
        gains.push(`Financial requests up to ₹${selectedPlan.limits.financialDonationLimit.toLocaleString()}`);
      }
      if (selectedPlan.tier >= 3 && currentPlan.tier < 3) {
        gains.push('Advanced analytics & insights');
      }
      if (selectedPlan.tier === 4 && currentPlan.tier < 4) {
        gains.push('Priority support & dedicated account manager');
      }
    }

    return { losses, gains };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading subscription plans...</div>
      </div>
    );
  }

  const modalContent = getModalContent();
  const { losses, gains } = getFeatureChanges();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Subscription Plan
          </h1>
          <p className="text-xl text-gray-600">
            Select the plan that best fits your NGO's needs
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Currently on: <span className="font-semibold text-lg">{currentTierName}</span> tier
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`relative border-2 rounded-lg p-6 ${getTierColor(plan.tier)} ${
                plan.tier === currentTier ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.tier === currentTier && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
                  Current Plan
                </div>
              )}

              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mb-4 ${getBadgeColor(plan.tier)}`}>
                <span className="mr-1">{plan.badge?.icon}</span>
                {plan.badge?.label}
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{plan.displayName}</p>

              <div className="mb-6">
                {plan.pricing.monthly === 0 ? (
                  <div className="text-4xl font-bold text-gray-900">FREE</div>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-gray-900">
                      ₹{plan.pricing.monthly}
                      <span className="text-lg font-normal text-gray-600">/month</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      or ₹{plan.pricing.yearly}/year (Save 17%)
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Requests:</span>
                  <span className="font-semibold">{plan.limits.activeRequests === -1 ? '∞' : plan.limits.activeRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Item Value:</span>
                  <span className="font-semibold">₹{plan.limits.maxItemValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Items:</span>
                  <span className="font-semibold">{plan.limits.monthlyAcceptance === -1 ? '∞' : plan.limits.monthlyAcceptance}</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {plan.features.slice(0, 5).map((feature, idx) => (
                  <div key={idx} className="flex items-start text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={plan.tier === currentTier}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.tier === currentTier
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : plan.tier < currentTier
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {plan.tier === currentTier ? 'Current Plan' : plan.tier < currentTier ? 'Downgrade' : 'Upgrade Now'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-white rounded-lg p-4 shadow">
              <summary className="font-semibold cursor-pointer text-gray-700">Can I try before I buy?</summary>
              <p className="mt-2 text-gray-600">
                Yes! BRONZE tier offers a 14-day free trial, and SILVER/GOLD tiers offer 7-day free trials.
              </p>
            </details>
            <details className="bg-white rounded-lg p-4 shadow">
              <summary className="font-semibold cursor-pointer text-gray-700">Can I change my plan later?</summary>
              <p className="mt-2 text-gray-600">
                Absolutely! You can upgrade instantly or downgrade at any time.
              </p>
            </details>
          </div>
        </div>
      </div>

      {/* Unified Confirmation Modal */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              modalContent.color === 'red' ? 'bg-red-100' :
              modalContent.color === 'orange' ? 'bg-orange-100' :
              modalContent.color === 'green' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <span className="text-3xl">{modalContent.icon}</span>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {modalContent.title}
            </h3>

            {/* Plan Comparison */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Current Plan</p>
                <p className="text-lg font-bold text-gray-900">{currentTierName}</p>
              </div>
              <span className="text-2xl">{isDowngrade ? '⬇️' : '⬆️'}</span>
              <div className="text-center">
                <p className="text-sm text-gray-500">New Plan</p>
                <p className="text-lg font-bold text-gray-900">{selectedPlan.name}</p>
              </div>
            </div>

            <p className="text-gray-600 text-center mb-6">{modalContent.description}</p>

            {/* Feature Changes */}
            {isDowngrade && losses.length > 0 && (
              <div className={`border rounded-lg p-4 mb-6 ${
                selectedPlan.tier === 1 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
              }`}>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">What you'll lose:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {losses.map((loss, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className={`mr-2 ${selectedPlan.tier === 1 ? 'text-red-500' : 'text-orange-600'}`}>✗</span>
                      <span>{loss}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!isDowngrade && gains.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">What you'll gain:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {gains.map((gain, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>{gain}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pricing */}
            {selectedPlan.tier > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 text-center">
                  <strong>Pricing:</strong> ₹{selectedPlan.pricing.monthly}/month or ₹{selectedPlan.pricing.yearly}/year
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPlan(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPlanChange}
                className={`flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-colors ${
                  modalContent.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                  modalContent.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                  modalContent.color === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {selectedPlan.tier === 1 ? 'Yes, Downgrade to FREE' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
