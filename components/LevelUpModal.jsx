'use client';

import { useEffect, useState } from 'react';
import { X, Trophy, Star, Sparkles, ChevronRight } from 'lucide-react';
import { getLevelIcon, getLevelBenefits, getNextLevelInfo } from '@/utils/donorLevelCalculator';

export default function LevelUpModal({ isOpen, onClose, newLevel, totalContributions }) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const benefits = getLevelBenefits(newLevel);
  const nextInfo = getNextLevelInfo(totalContributions);

  const getLevelColor = (level) => {
    const colors = {
      Bronze: { from: 'from-amber-600', to: 'to-amber-800', text: 'text-amber-400', border: 'border-amber-700' },
      Silver: { from: 'from-slate-500', to: 'to-slate-700', text: 'text-slate-300', border: 'border-slate-600' },
      Gold: { from: 'from-yellow-600', to: 'to-yellow-800', text: 'text-yellow-400', border: 'border-yellow-700' },
      Platinum: { from: 'from-purple-600', to: 'to-purple-800', text: 'text-purple-400', border: 'border-purple-700' }
    };
    return colors[level] || colors.Bronze;
  };

  const colors = getLevelColor(newLevel);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-700 overflow-hidden animate-scaleIn">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${colors.from} ${colors.to} text-white p-8 relative overflow-hidden`}>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Animated circles background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative text-center">
            <div className="mb-4 animate-bounce [animation-iteration-count:3.5]">
              <span className="text-7xl">{getLevelIcon(newLevel)}</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
            <p className="text-white/90 text-lg">You've reached</p>
            <p className={`text-4xl font-extrabold mt-2 ${colors.text}`}>{newLevel} Level</p>
            <p className="text-white/80 text-sm mt-3">
              {totalContributions} contributions completed
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* New Benefits */}
          <div className="mb-6">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-500" />
              Your New Benefits
            </h3>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <ul className="space-y-2">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <Star className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Level Preview */}
          {nextInfo.contributionsNeeded > 0 && (
            <div className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border border-emerald-700/30 rounded-lg p-4 mb-6">
              <p className="text-emerald-400 font-semibold text-sm mb-1">Next Goal</p>
              <p className="text-white text-base">
                {nextInfo.contributionsNeeded} more contributions to reach <strong>{nextInfo.nextLevel}</strong>
              </p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Continue Your Journey
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
