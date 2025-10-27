export const LEVEL_TIERS = {
  BRONZE: { min: 0, max: 24, name: 'Bronze', color: 'amber', icon: '🥉' },
  SILVER: { min: 25, max: 49, name: 'Silver', color: 'slate', icon: '🥈' },
  GOLD: { min: 50, max: 99, name: 'Gold', color: 'yellow', icon: '🥇' },
  PLATINUM: { min: 100, max: Infinity, name: 'Platinum', color: 'purple', icon: '💎' }
};

// Get donor level based on total contributions
export const getDonorLevel = (totalContributions) => {
  if (totalContributions >= 100) return 'Platinum';
  if (totalContributions >= 50) return 'Gold';
  if (totalContributions >= 25) return 'Silver';
  return 'Bronze';
};

// Get info about next level
export const getNextLevelInfo = (totalContributions) => {
  if (totalContributions < 25) {
    return { 
      nextLevel: 'Silver', 
      contributionsNeeded: 25 - totalContributions,
      currentThreshold: 0,
      nextThreshold: 25
    };
  }
  if (totalContributions < 50) {
    return { 
      nextLevel: 'Gold', 
      contributionsNeeded: 50 - totalContributions,
      currentThreshold: 25,
      nextThreshold: 50
    };
  }
  if (totalContributions < 100) {
    return { 
      nextLevel: 'Platinum', 
      contributionsNeeded: 100 - totalContributions,
      currentThreshold: 50,
      nextThreshold: 100
    };
  }
  return { 
    nextLevel: 'Max Level', 
    contributionsNeeded: 0,
    currentThreshold: 100,
    nextThreshold: 100
  };
};

// Calculate progress percentage
export const getProgressPercentage = (totalContributions) => {
  const nextInfo = getNextLevelInfo(totalContributions);
  if (nextInfo.contributionsNeeded === 0) return 100;
  
  const levelRange = nextInfo.nextThreshold - nextInfo.currentThreshold;
  const currentProgress = totalContributions - nextInfo.currentThreshold;
  return Math.round((currentProgress / levelRange) * 100);
};

// Get level icon
export const getLevelIcon = (level) => {
  const icons = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Platinum: '💎'
  };
  return icons[level] || '🥉';
};

// Get level benefits
export const getLevelBenefits = (level) => {
  const benefits = {
    Bronze: [
      'Welcome guide',
      'Donation receipts',
      'Monthly newsletter'
    ],
    Silver: [
      'All Bronze benefits',
      'Quarterly impact reports',
      'Donor spotlight feature',
      'Silver badge on profile'
    ],
    Gold: [
      'All Silver benefits',
      'Monthly impact updates',
      'Featured on donor wall',
      'Priority email support'
    ],
    Platinum: [
      'All Gold benefits',
      'Personalized impact stories',
      'Direct NGO communication',
      'Certificate of appreciation'
    ]
  };
  return benefits[level] || benefits.Bronze;
};
