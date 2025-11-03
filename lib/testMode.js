/**
 *  Check if the app is running in test mode
 * This allows testing features on production Vercel without using NODE_ENV=development
 */
export const isTestMode = () => {
  return (
    process.env.SUBSCRIPTION_TEST_MODE === 'true' ||
    process.env.RAZORPAY_TEST_MODE === 'true' ||
    process.env.NODE_ENV === 'development'
  );
};

export const isRazorpayTestMode = () => {
  return process.env.RAZORPAY_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';
};

export const isSubscriptionTestMode = () => {
  return process.env.SUBSCRIPTION_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';
};

// For frontend
export const isClientTestMode = () => {
  if (typeof window === 'undefined') return false;
  
  return (
    process.env.NEXT_PUBLIC_TEST_MODE === 'true' ||
    process.env.NODE_ENV === 'development'
  );
};
