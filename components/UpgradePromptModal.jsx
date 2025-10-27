'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, TrendingUp, Package, Crown } from 'lucide-react';

export default function UpgradePromptModal({ isOpen, onClose }) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/ngo/subscription/plans');
  };

  const handleRemindLater = () => {
    const nextShow = new Date();
    nextShow.setDate(nextShow.getDate() + 1);
    localStorage.setItem('upgradePromptNext', nextShow.toISOString());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleRemindLater}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-2xl rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={handleRemindLater}
                className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="mb-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-purple-600/20 p-4 ring-2 ring-purple-500/30">
                    <Crown className="h-12 w-12 text-purple-400" />
                  </div>
                </div>
                <h2 className="mb-2 text-3xl font-bold text-white">
                  Unlock Your NGO's Full Potential! 🚀
                </h2>
                <p className="text-lg text-gray-300">
                  You're currently on the FREE plan. Upgrade to access premium features!
                </p>
              </div>

              {/* Features Grid */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                {/* Feature 1 */}
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-600/30 p-2">
                      <TrendingUp className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white">More Requests</h3>
                  </div>
                  <p className="text-sm text-gray-300">
                    Get up to <strong className="text-purple-400">20+ active requests</strong> instead of just 2
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-600/30 p-2">
                      <Package className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white">Higher Value Items</h3>
                  </div>
                  <p className="text-sm text-gray-300">
                    Request items worth up to <strong className="text-purple-400">₹50,000+</strong>
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-600/30 p-2">
                      <Zap className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white">Priority Support</h3>
                  </div>
                  <p className="text-sm text-gray-300">
                    Get <strong className="text-purple-400">faster response</strong> from our team
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-600/30 p-2">
                      <Crown className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white">Premium Badge</h3>
                  </div>
                  <p className="text-sm text-gray-300">
                    Stand out with a <strong className="text-purple-400">verified premium badge</strong>
                  </p>
                </div>
              </div>

              {/* Pricing Preview */}
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Starting from</p>
                    <p className="text-2xl font-bold text-white">
                      ₹599<span className="text-base font-normal text-gray-400">/month</span>
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-600/20 px-3 py-1.5 ring-1 ring-amber-500/30">
                    <p className="text-xs font-semibold text-amber-400">Save 17% yearly</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleUpgrade}
                  className="flex-1 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-all hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  View Plans & Upgrade
                </button>
                <button
                  onClick={handleRemindLater}
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800/50 px-6 py-3 font-semibold text-gray-300 transition-all hover:border-gray-600 hover:bg-gray-800"
                >
                  Remind Me Tomorrow
                </button>
              </div>

              {/* Small Print */}
              <p className="mt-4 text-center text-xs text-gray-500">
                Cancel anytime • No hidden fees • Full transparency
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
