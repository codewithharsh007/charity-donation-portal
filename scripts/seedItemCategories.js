import mongoose from 'mongoose';
import ItemCategory from '../models/itemCategoryModel.js';

// Direct MongoDB connection for scripts

const itemCategoriesData = [
  // FREE TIER CATEGORIES (Tier 1)
  {
    name: 'Books & Educational Materials',
    slug: 'books-educational-materials',
    description: 'Books, magazines, journals, textbooks, learning materials',
    requiredTier: 1,
    isHidden: false,
    icon: '📚',
    displayOrder: 1,
    subcategories: [
      { name: 'Textbooks', slug: 'textbooks', requiredTier: 1 },
      { name: 'Storybooks', slug: 'storybooks', requiredTier: 1 },
      { name: 'Magazines & Journals', slug: 'magazines-journals', requiredTier: 1 },
      { name: 'Reference Books', slug: 'reference-books', requiredTier: 1 },
    ],
    isActive: true,
  },
  {
    name: 'Food & Groceries',
    slug: 'food-groceries',
    description: 'Non-perishable food items, packaged goods, groceries',
    requiredTier: 1,
    isHidden: false,
    icon: '🍎',
    displayOrder: 2,
    subcategories: [
      { name: 'Dry Foods', slug: 'dry-foods', requiredTier: 1 },
      { name: 'Canned Goods', slug: 'canned-goods', requiredTier: 1 },
      { name: 'Packaged Snacks', slug: 'packaged-snacks', requiredTier: 1 },
      { name: 'Beverages', slug: 'beverages', requiredTier: 1 },
    ],
    isActive: true,
  },
  {
    name: 'Stationery & Office Supplies',
    slug: 'stationery-office-supplies',
    description: 'Pens, pencils, notebooks, paper, art supplies',
    requiredTier: 1,
    isHidden: false,
    icon: '✏️',
    displayOrder: 3,
    subcategories: [
      { name: 'Writing Materials', slug: 'writing-materials', requiredTier: 1 },
      { name: 'Notebooks & Paper', slug: 'notebooks-paper', requiredTier: 1 },
      { name: 'Art Supplies', slug: 'art-supplies', requiredTier: 1 },
      { name: 'Office Basics', slug: 'office-basics', requiredTier: 1 },
    ],
    isActive: true,
  },
  {
    name: 'Household Items',
    slug: 'household-items',
    description: 'Dishes, utensils, cookware, basic household goods',
    requiredTier: 1,
    isHidden: false,
    icon: '🏠',
    displayOrder: 4,
    subcategories: [
      { name: 'Kitchenware', slug: 'kitchenware', requiredTier: 1 },
      { name: 'Utensils', slug: 'utensils', requiredTier: 1 },
      { name: 'Cookware', slug: 'cookware', requiredTier: 1 },
      { name: 'Storage Containers', slug: 'storage-containers', requiredTier: 1 },
    ],
    isActive: true,
  },
  {
    name: 'School Supplies',
    slug: 'school-supplies',
    description: 'School bags, lunch boxes, water bottles, uniforms',
    requiredTier: 1,
    isHidden: false,
    icon: '🎒',
    displayOrder: 5,
    subcategories: [
      { name: 'School Bags', slug: 'school-bags', requiredTier: 1 },
      { name: 'Lunch Boxes', slug: 'lunch-boxes', requiredTier: 1 },
      { name: 'Water Bottles', slug: 'water-bottles', requiredTier: 1 },
      { name: 'School Uniforms', slug: 'school-uniforms', requiredTier: 1 },
    ],
    isActive: true,
  },

  // BRONZE TIER CATEGORIES (Tier 2)
  {
    name: 'Clothing & Textiles',
    slug: 'clothing-textiles',
    description: 'Clothes, shoes, accessories, fabrics, blankets',
    requiredTier: 2,
    isHidden: false,
    icon: '👕',
    displayOrder: 6,
    subcategories: [
      { name: 'Men\'s Clothing', slug: 'mens-clothing', requiredTier: 2 },
      { name: 'Women\'s Clothing', slug: 'womens-clothing', requiredTier: 2 },
      { name: 'Children\'s Clothing', slug: 'childrens-clothing', requiredTier: 2 },
      { name: 'Shoes & Footwear', slug: 'shoes-footwear', requiredTier: 2 },
      { name: 'Blankets & Bedding', slug: 'blankets-bedding', requiredTier: 2 },
    ],
    isActive: true,
  },
  {
    name: 'Toys & Games',
    slug: 'toys-games',
    description: 'Educational toys, board games, puzzles, sports toys',
    requiredTier: 2,
    isHidden: false,
    icon: '🧸',
    displayOrder: 7,
    subcategories: [
      { name: 'Educational Toys', slug: 'educational-toys', requiredTier: 2 },
      { name: 'Board Games', slug: 'board-games', requiredTier: 2 },
      { name: 'Puzzles', slug: 'puzzles', requiredTier: 2 },
      { name: 'Outdoor Toys', slug: 'outdoor-toys', requiredTier: 2 },
    ],
    isActive: true,
  },
  {
    name: 'Basic Furniture',
    slug: 'basic-furniture',
    description: 'Chairs, tables, shelves, storage units',
    requiredTier: 2,
    isHidden: false,
    icon: '🪑',
    displayOrder: 8,
    subcategories: [
      { name: 'Chairs', slug: 'chairs', requiredTier: 2 },
      { name: 'Tables', slug: 'tables', requiredTier: 2 },
      { name: 'Shelves', slug: 'shelves', requiredTier: 2 },
      { name: 'Storage Units', slug: 'storage-units', requiredTier: 2 },
    ],
    isActive: true,
  },
  {
    name: 'Sports Equipment',
    slug: 'sports-equipment',
    description: 'Sports gear, athletic equipment, fitness items',
    requiredTier: 2,
    isHidden: false,
    icon: '⚽',
    displayOrder: 9,
    subcategories: [
      { name: 'Cricket Equipment', slug: 'cricket-equipment', requiredTier: 2 },
      { name: 'Football Equipment', slug: 'football-equipment', requiredTier: 2 },
      { name: 'Badminton Equipment', slug: 'badminton-equipment', requiredTier: 2 },
      { name: 'General Sports Gear', slug: 'general-sports-gear', requiredTier: 2 },
    ],
    isActive: true,
  },
  {
    name: 'Medical Supplies (Basic)',
    slug: 'medical-supplies-basic',
    description: 'First aid kits, basic medical supplies, health products',
    requiredTier: 2,
    isHidden: false,
    icon: '🏥',
    displayOrder: 10,
    subcategories: [
      { name: 'First Aid Kits', slug: 'first-aid-kits', requiredTier: 2 },
      { name: 'Bandages & Dressings', slug: 'bandages-dressings', requiredTier: 2 },
      { name: 'OTC Medicines', slug: 'otc-medicines', requiredTier: 2 },
      { name: 'Health Monitors', slug: 'health-monitors', requiredTier: 2 },
    ],
    isActive: true,
  },
  {
    name: 'Kitchen Equipment',
    slug: 'kitchen-equipment',
    description: 'Non-commercial kitchen appliances and equipment',
    requiredTier: 2,
    isHidden: false,
    icon: '🍳',
    displayOrder: 11,
    subcategories: [
      { name: 'Mixers & Blenders', slug: 'mixers-blenders', requiredTier: 2 },
      { name: 'Pressure Cookers', slug: 'pressure-cookers', requiredTier: 2 },
      { name: 'Rice Cookers', slug: 'rice-cookers', requiredTier: 2 },
      { name: 'Kitchen Tools', slug: 'kitchen-tools', requiredTier: 2 },
    ],
    isActive: true,
  },

  // SILVER TIER CATEGORIES (Tier 3)
  {
    name: 'Basic Electronics',
    slug: 'basic-electronics',
    description: 'Phones, tablets, small appliances',
    requiredTier: 3,
    isHidden: false,
    icon: '📱',
    displayOrder: 12,
    subcategories: [
      { name: 'Mobile Phones', slug: 'mobile-phones', requiredTier: 3 },
      { name: 'Tablets', slug: 'tablets', requiredTier: 3 },
      { name: 'Small Appliances', slug: 'small-appliances', requiredTier: 3 },
      { name: 'Fans & Heaters', slug: 'fans-heaters', requiredTier: 3 },
    ],
    isActive: true,
  },
  {
    name: 'Large Furniture',
    slug: 'large-furniture',
    description: 'Beds, desks, wardrobes, sofas, large furniture items',
    requiredTier: 3,
    isHidden: false,
    icon: '🛋️',
    displayOrder: 13,
    subcategories: [
      { name: 'Beds & Mattresses', slug: 'beds-mattresses', requiredTier: 3 },
      { name: 'Desks & Study Tables', slug: 'desks-study-tables', requiredTier: 3 },
      { name: 'Wardrobes', slug: 'wardrobes', requiredTier: 3 },
      { name: 'Sofas & Seating', slug: 'sofas-seating', requiredTier: 3 },
    ],
    isActive: true,
  },
  {
    name: 'Medical Equipment',
    slug: 'medical-equipment',
    description: 'Wheelchairs, walking aids, medical devices',
    requiredTier: 3,
    isHidden: false,
    icon: '♿',
    displayOrder: 14,
    subcategories: [
      { name: 'Wheelchairs', slug: 'wheelchairs', requiredTier: 3 },
      { name: 'Walking Aids', slug: 'walking-aids', requiredTier: 3 },
      { name: 'Medical Devices', slug: 'medical-devices', requiredTier: 3 },
      { name: 'Mobility Equipment', slug: 'mobility-equipment', requiredTier: 3 },
    ],
    isActive: true,
  },

  // GOLD TIER CATEGORIES (Tier 4)
  {
    name: 'High-Value Electronics',
    slug: 'high-value-electronics',
    description: 'Laptops, computers, servers, printers, technology equipment',
    requiredTier: 4,
    isHidden: false,
    icon: '💻',
    displayOrder: 15,
    subcategories: [
      { name: 'Laptops', slug: 'laptops', requiredTier: 4 },
      { name: 'Desktop Computers', slug: 'desktop-computers', requiredTier: 4 },
      { name: 'Monitors & Displays', slug: 'monitors-displays', requiredTier: 4 },
      { name: 'Printers & Scanners', slug: 'printers-scanners', requiredTier: 4 },
      { name: 'Servers & Networking', slug: 'servers-networking', requiredTier: 4 },
    ],
    isActive: true,
  },
  {
    name: 'Vehicles',
    slug: 'vehicles',
    description: 'Bicycles, motorcycles, cars, vans, trucks (used)',
    requiredTier: 4,
    isHidden: false,
    icon: '🚗',
    displayOrder: 16,
    subcategories: [
      { name: 'Bicycles', slug: 'bicycles', requiredTier: 4 },
      { name: 'Motorcycles', slug: 'motorcycles', requiredTier: 4 },
      { name: 'Cars', slug: 'cars', requiredTier: 4 },
      { name: 'Vans', slug: 'vans', requiredTier: 4 },
      { name: 'Trucks', slug: 'trucks', requiredTier: 4 },
    ],
    isActive: true,
  },
  {
    name: 'Power Tools & Equipment',
    slug: 'power-tools-equipment',
    description: 'Power tools, workshop equipment, machinery',
    requiredTier: 4,
    isHidden: false,
    icon: '🔧',
    displayOrder: 17,
    subcategories: [
      { name: 'Power Drills', slug: 'power-drills', requiredTier: 4 },
      { name: 'Saws & Cutting Tools', slug: 'saws-cutting-tools', requiredTier: 4 },
      { name: 'Workshop Equipment', slug: 'workshop-equipment', requiredTier: 4 },
      { name: 'Generators', slug: 'generators', requiredTier: 4 },
    ],
    isActive: true,
  },
  {
    name: 'Specialized Medical Equipment',
    slug: 'specialized-medical-equipment',
    description: 'Advanced medical equipment, diagnostic devices',
    requiredTier: 4,
    isHidden: false,
    icon: '🏨',
    displayOrder: 18,
    subcategories: [
      { name: 'Diagnostic Equipment', slug: 'diagnostic-equipment', requiredTier: 4 },
      { name: 'Patient Monitoring', slug: 'patient-monitoring', requiredTier: 4 },
      { name: 'Therapeutic Equipment', slug: 'therapeutic-equipment', requiredTier: 4 },
      { name: 'Emergency Equipment', slug: 'emergency-equipment', requiredTier: 4 },
    ],
    isActive: true,
  },

  // HIDDEN CATEGORIES (Tier 3 & 4 - Not advertised but shown when available)
  {
    name: 'Commercial Kitchen Equipment',
    slug: 'commercial-kitchen-equipment',
    description: 'Large-scale cooking equipment, commercial appliances',
    requiredTier: 3,
    isHidden: true,
    icon: '👨‍🍳',
    displayOrder: 100,
    subcategories: [
      { name: 'Commercial Stoves', slug: 'commercial-stoves', requiredTier: 3 },
      { name: 'Industrial Ovens', slug: 'industrial-ovens', requiredTier: 3 },
      { name: 'Large Refrigerators', slug: 'large-refrigerators', requiredTier: 3 },
    ],
    isActive: true,
  },
  {
    name: 'Hospital Beds',
    slug: 'hospital-beds',
    description: 'Medical beds, patient beds, hospital furniture',
    requiredTier: 3,
    isHidden: true,
    icon: '🛏️',
    displayOrder: 101,
    subcategories: [
      { name: 'Electric Hospital Beds', slug: 'electric-hospital-beds', requiredTier: 3 },
      { name: 'Manual Hospital Beds', slug: 'manual-hospital-beds', requiredTier: 3 },
      { name: 'ICU Beds', slug: 'icu-beds', requiredTier: 3 },
    ],
    isActive: true,
  },
  {
    name: 'Construction Materials',
    slug: 'construction-materials',
    description: 'Building materials, construction supplies',
    requiredTier: 3,
    isHidden: true,
    icon: '🏗️',
    displayOrder: 102,
    subcategories: [
      { name: 'Cement & Concrete', slug: 'cement-concrete', requiredTier: 3 },
      { name: 'Bricks & Blocks', slug: 'bricks-blocks', requiredTier: 3 },
      { name: 'Roofing Materials', slug: 'roofing-materials', requiredTier: 3 },
    ],
    isActive: true,
  },
  {
    name: 'Agricultural Equipment',
    slug: 'agricultural-equipment',
    description: 'Farming tools, agricultural machinery',
    requiredTier: 3,
    isHidden: true,
    icon: '🚜',
    displayOrder: 103,
    subcategories: [
      { name: 'Hand Tools', slug: 'hand-tools', requiredTier: 3 },
      { name: 'Irrigation Equipment', slug: 'irrigation-equipment', requiredTier: 3 },
      { name: 'Farm Machinery', slug: 'farm-machinery', requiredTier: 3 },
    ],
    isActive: true,
  },

  // HIDDEN CATEGORIES (Tier 4 only)
  {
    name: 'Land & Property',
    slug: 'land-property',
    description: 'Land donations, property transfers',
    requiredTier: 4,
    isHidden: true,
    icon: '🏞️',
    displayOrder: 104,
    subcategories: [
      { name: 'Agricultural Land', slug: 'agricultural-land', requiredTier: 4 },
      { name: 'Commercial Property', slug: 'commercial-property', requiredTier: 4 },
      { name: 'Residential Property', slug: 'residential-property', requiredTier: 4 },
    ],
    isActive: true,
  },
  {
    name: 'Industrial Equipment',
    slug: 'industrial-equipment',
    description: 'Large-scale industrial machinery and equipment',
    requiredTier: 4,
    isHidden: true,
    icon: '🏭',
    displayOrder: 105,
    subcategories: [
      { name: 'Manufacturing Equipment', slug: 'manufacturing-equipment', requiredTier: 4 },
      { name: 'Heavy Machinery', slug: 'heavy-machinery', requiredTier: 4 },
      { name: 'Industrial Tools', slug: 'industrial-tools', requiredTier: 4 },
    ],
    isActive: true,
  },
];

async function seedItemCategories() {
  try {
    // Connect to database directly
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing item categories
    await ItemCategory.deleteMany({});
    console.log('Cleared existing item categories');

    // Insert new item categories
    const createdCategories = await ItemCategory.insertMany(itemCategoriesData);
    console.log('✅ Item categories seeded successfully!');
    console.log(`Created ${createdCategories.length} item categories:`);
    
    // Group by tier
    const tierGroups = {
      1: [],
      2: [],
      3: [],
      4: [],
    };

    createdCategories.forEach((category) => {
      tierGroups[category.requiredTier].push(category);
    });

    console.log('\n📊 Categories by Tier:');
    Object.keys(tierGroups).forEach((tier) => {
      const tierName = ['FREE', 'BRONZE', 'SILVER', 'GOLD'][tier - 1];
      const categories = tierGroups[tier];
      const visible = categories.filter((c) => !c.isHidden);
      const hidden = categories.filter((c) => c.isHidden);
      
      console.log(`\n${tierName} (Tier ${tier}):`);
      console.log(`  Visible: ${visible.length} categories`);
      visible.forEach((c) => console.log(`    - ${c.icon} ${c.name}`));
      
      if (hidden.length > 0) {
        console.log(`  Hidden: ${hidden.length} categories`);
        hidden.forEach((c) => console.log(`    - ${c.icon} ${c.name} (not advertised)`));
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding item categories:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
}

// Run the seed function
seedItemCategories();
