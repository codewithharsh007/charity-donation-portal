import mongoose from 'mongoose';
import SubscriptionPlan from '../models/subscriptionPlanModel.js';

// Direct MongoDB connection for scripts (Next.js env vars not available in standalone scripts)

const subscriptionPlansData = [
  {
    name: 'FREE',
    displayName: 'Community Partner',
    tier: 1,
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: 'INR',
    },
    limits: {
      activeRequests: 2,
      maxItemValue: 3000,
      monthlyAcceptance: 5,
      bulkRequestSize: 0,
      financialDonationLimit: 0,
    },
    permissions: {
      categories: [], // Will be populated after categories are created
      hiddenCategories: [],
      canRequestFinancial: false,
      priorityLevel: 1,
    },
    features: [
      'Request basic items only',
      'Books & Educational Materials',
      'Food & Groceries (non-perishable)',
      'Stationery & Office Supplies',
      'Household Items',
      'School Supplies',
      'Maximum 2 active requests',
      'Item value cap: ₹3,000',
      'Monthly acceptance: 5 items',
      'Basic profile listing',
    ],
    badge: {
      icon: '✓',
      color: '#10b981',
      label: 'Verified',
    },
    isActive: true,
  },
  {
    name: 'BRONZE',
    displayName: 'Growth Partner',
    tier: 2,
    pricing: {
      monthly: 599,
      yearly: 5999,
      currency: 'INR',
    },
    limits: {
      activeRequests: 7,
      maxItemValue: 15000,
      monthlyAcceptance: 15,
      bulkRequestSize: 5,
      financialDonationLimit: 0,
    },
    permissions: {
      categories: [], // Will be populated after categories are created
      hiddenCategories: [],
      canRequestFinancial: false,
      priorityLevel: 2,
    },
    features: [
      'All FREE tier benefits',
      'Clothing & Textiles',
      'Toys & Games',
      'Basic furniture (chairs, tables, shelves)',
      'Sports equipment',
      'Medical supplies (basic first aid)',
      'Kitchen equipment (non-commercial)',
      'Maximum 7 active requests',
      'Item value cap: ₹15,000',
      'Monthly acceptance: 15 items',
      'Bronze badge on profile',
      'Priority listing',
      'Email notifications',
      'Basic analytics dashboard',
      'Bulk requests (up to 5 items)',
    ],
    badge: {
      icon: '🥉',
      color: '#cd7f32',
      label: 'Growth Partner',
    },
    isActive: true,
  },
  {
    name: 'SILVER',
    displayName: 'Impact Partner',
    tier: 3,
    pricing: {
      monthly: 1499,
      yearly: 15999,
      currency: 'INR',
    },
    limits: {
      activeRequests: 15,
      maxItemValue: 50000,
      monthlyAcceptance: 30,
      bulkRequestSize: 10,
      financialDonationLimit: 20000,
    },
    permissions: {
      categories: [], // Will be populated after categories are created
      hiddenCategories: [], // Commercial equipment, hospital beds, construction, agriculture
      canRequestFinancial: true,
      priorityLevel: 3,
    },
    features: [
      'All BRONZE tier benefits',
      'Basic electronics (phones, tablets, small appliances)',
      'Large furniture (beds, desks, wardrobes, sofas)',
      'Medical equipment (wheelchairs, basic medical devices)',
      'Maximum 15 active requests',
      'Item value cap: ₹50,000',
      'Monthly acceptance: 30 items',
      'Request financial donations (up to ₹20,000)',
      'Silver badge with featured placement',
      'Top priority listing',
      'Advanced analytics & impact reports',
      'Bulk requests (up to 10 items)',
      'Dedicated support (email/chat)',
      'Featured in "Trusted NGO" section',
    ],
    badge: {
      icon: '🥈',
      color: '#c0c0c0',
      label: 'Impact Partner',
    },
    isActive: true,
  },
  {
    name: 'GOLD',
    displayName: 'Premium Partner',
    tier: 4,
    pricing: {
      monthly: 2999,
      yearly: 29999,
      currency: 'INR',
    },
    limits: {
      activeRequests: 25,
      maxItemValue: 200000,
      monthlyAcceptance: 100,
      bulkRequestSize: 20,
      financialDonationLimit: 50000,
    },
    permissions: {
      categories: [], // Will be populated after categories are created
      hiddenCategories: [], // Land/property, industrial equipment
      canRequestFinancial: true,
      priorityLevel: 4,
    },
    features: [
      'All SILVER tier benefits',
      'High-value electronics (laptops, computers, servers, printers)',
      'Vehicles (bicycles, motorcycles, cars, vans, trucks - used)',
      'Power tools & specialized equipment',
      'Specialized medical equipment',
      'Technology infrastructure',
      'Maximum 25 active requests',
      'Item value cap: ₹2,00,000',
      'Monthly acceptance: 100 items',
      'Request financial donations (up to ₹50,000)',
      'Gold badge with "Premium Verified" status',
      'Top priority - always shown first',
      'Premium analytics with donor insights',
      'Bulk requests (up to 20 items)',
      'Quarterly impact video features',
      'Featured prominently on homepage',
      'Early access to high-value donations (24-hour priority)',
    ],
    badge: {
      icon: '🥇',
      color: '#ffd700',
      label: 'Premium Partner',
    },
    isActive: true,
  },
];

async function seedSubscriptionPlans() {
  try {
    // Connect to database directly
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing subscription plans
    await SubscriptionPlan.deleteMany({});
    console.log('Cleared existing subscription plans');

    // Insert new subscription plans
    const createdPlans = await SubscriptionPlan.insertMany(subscriptionPlansData);
    console.log('✅ Subscription plans seeded successfully!');
    console.log(`Created ${createdPlans.length} subscription plans:`);
    
    createdPlans.forEach((plan) => {
      console.log(`  - ${plan.displayName} (${plan.name}) - Tier ${plan.tier}`);
      console.log(`    Monthly: ₹${plan.pricing.monthly}, Yearly: ₹${plan.pricing.yearly}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
}

// Run the seed function
seedSubscriptionPlans();
