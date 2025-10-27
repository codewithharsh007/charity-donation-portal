'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trophy, TrendingUp, Star, Sparkles } from 'lucide-react';
import { getLevelBenefits } from '@/utils/donorLevelCalculator';

export default function WelcomeModal({ isOpen, onClose }) {
  const router = useRouter();

  if (!isOpen) return null;

  const levels = [
    { name: 'Bronze', contributions: '0-24', icon: '🥉', color: 'amber' },
    { name: 'Silver', contributions: '25-49', icon: '🥈', color: 'slate' },
    { name: 'Gold', contributions: '50-99', icon: '🥇', color: 'yellow' },
    { name: 'Platinum', contributions: '100+', icon: '💎', color: 'purple' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-t-2xl relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 rounded-full p-2">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome to Your Giving Journey!</h2>
              <p className="text-emerald-100 text-sm mt-1">Level up as you make a difference</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* How it Works */}
          <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-5 mb-6">
            <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              How Donor Levels Work
            </h3>
            <div className="space-y-2 text-gray-300">
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Every donation (money or items) counts as <strong className="text-white">1 contribution</strong></span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Reach milestones to <strong className="text-white">unlock new levels</strong> and benefits</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Your level is displayed on your profile and in the community</span>
              </p>
            </div>
          </div>

          {/* Levels Grid */}
          <h3 className="font-bold text-white mb-4 text-lg">Donor Levels & Rewards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {levels.map((level) => {
              const benefits = getLevelBenefits(level.name);
              return (
                <div 
                  key={level.name} 
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:shadow-lg hover:border-gray-600 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{level.icon}</span>
                    <div>
                      <h4 className="font-bold text-white text-lg">{level.name}</h4>
                      <p className="text-xs text-gray-400">{level.contributions} contributions</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {benefits.slice(0, 3).map((benefit, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <Star className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Current Status */}
          <div className="bg-gradient-to-r from-amber-900/20 to-amber-800/20 border border-amber-700/30 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🥉</span>
              <div>
                <h4 className="font-bold text-amber-400 text-lg">You're Starting at Bronze Level!</h4>
                <p className="text-amber-200/80 text-sm">Make your first donation to begin your journey</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                onClose();
                router.push('/donate');
              }}
              className="flex-1 bg-emerald-600 text-white py-3.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Start Your First Donation
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3.5 bg-gray-700 border border-gray-600 rounded-lg font-semibold text-white hover:bg-gray-600 transition-colors"
            >
              Explore Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
