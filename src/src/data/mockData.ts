import { Business, FoodItem, Order, PlanConfig, Promotion } from '../types';

export const INITIAL_PLANS: Record<string, PlanConfig> = {
  starter: {
    key: 'starter',
    name: 'Starter',
    price: 99,
    tagline: 'Everything you need to start taking orders online.',
    featured: false,
    features: [
      'Custom ordering web page',
      'Printable table QR code',
      'Digital interactive menu',
      'Manage unlimited products & photos',
      'WhatsApp order notifications',
      'Real-time order management',
      'Cash, EFT & Yoco payments',
      'Basic sales analytics'
    ]
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    price: 199,
    tagline: 'For businesses ready to grow and understand their customers.',
    featured: true,
    features: [
      'All Starter features included',
      'Customer insights & order history',
      'Promotional & discount codes engine',
      'Sales reports & export',
      'Staff order taker accounts',
      'Automated prep-time notifications',
      'WhatsApp bot automated ordering'
    ]
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    price: 399,
    tagline: 'Full power for established businesses that need everything.',
    featured: false,
    features: [
      'All Growth features included',
      'Advanced conversion funnel analytics',
      'Detailed hourly kitchen velocity reports',
      'Custom domain branding',
      'Priority 24/7 WhatsApp support',
      'Multiple branch support'
    ]
  }
};

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: 1,
    name: 'Mama Kasi Kitchen',
    businessName: 'Mama Kasi Kitchen',
    ownerName: 'Mama Zanele Khumalo',
    phone: '27821234567',
    whatsappNumber: '27821234567',
    email: 'zanele@mamakasi.co.za',
    address: '842 Vilakazi Street, Orlando West, Soweto',
    category: 'Township Cuisine & Kotas',
    slug: 'mama-kasi-kitchen',
    active: true,
    isOpen: true,
    suspended: false,
    verificationStatus: 'verified',
    verifiedAt: '2026-08-15T10:00:00Z',
    plan: 'growth',
    subscriptionStatus: 'active',
    trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    deliveryAvailable: true,
    deliveryRadiusKm: 7.5,
    deliveryFee: 25.0,
    bankName: 'FNB / First National Bank',
    accountHolder: 'Mama Kasi Kitchen Pty Ltd',
    accountNumber: '62849201948',
    branchCode: '250655',
    paymentInstructions: 'Please use your Order Number as payment reference.',
    yocoEnabled: true,
    yocoPublicKey: 'pk_live_mama_kasi_yoco_98374',
    bannerImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviewCount: 142
  },
  {
    id: 2,
    name: 'Braai Republic Grill',
    businessName: 'Braai Republic Grill',
    ownerName: 'Sipho Ndlovu',
    phone: '27839876543',
    whatsappNumber: '27839876543',
    email: 'sipho@braairepublic.co.za',
    address: '14 Juta Street, Braamfontein, Johannesburg',
    category: 'Flame Braai & Meats',
    slug: 'braai-republic',
    active: true,
    isOpen: true,
    suspended: false,
    verificationStatus: 'verified',
    verifiedAt: '2026-09-01T12:00:00Z',
    plan: 'pro',
    subscriptionStatus: 'active',
    trialEndsAt: new Date(Date.now() + 10 * 86400000).toISOString(),
    deliveryAvailable: true,
    deliveryRadiusKm: 10.0,
    deliveryFee: 30.0,
    bankName: 'Standard Bank',
    accountHolder: 'Braai Republic Grill',
    accountNumber: '10148920381',
    branchCode: '051001',
    paymentInstructions: 'Instant EFT preferred. Include order number in reference.',
    yocoEnabled: true,
    yocoPublicKey: 'pk_live_braai_republic_39210',
    bannerImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    reviewCount: 88
  },
  {
    id: 3,
    name: 'Durban Curry & Bunny Express',
    businessName: 'Durban Curry & Bunny Express',
    ownerName: 'Devan Pillay',
    phone: '27845558912',
    whatsappNumber: '27845558912',
    email: 'orders@durbancurryexpress.co.za',
    address: '45 Florida Road, Morningside, Durban',
    category: 'Curries & Street Food',
    slug: 'durban-curry-express',
    active: true,
    isOpen: true,
    suspended: false,
    verificationStatus: 'verified',
    verifiedAt: '2026-07-20T09:00:00Z',
    plan: 'starter',
    subscriptionStatus: 'trialing',
    trialEndsAt: new Date(Date.now() + 6 * 86400000).toISOString(),
    deliveryAvailable: true,
    deliveryRadiusKm: 5.0,
    deliveryFee: 20.0,
    bankName: 'Capitec Bank',
    accountHolder: 'D Pillay',
    accountNumber: '1589302910',
    branchCode: '470010',
    paymentInstructions: 'Pay with Capitec Pay or Cash on collection.',
    yocoEnabled: false,
    bannerImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    reviewCount: 64
  }
];

export const INITIAL_FOODS: FoodItem[] = [
  // Mama Kasi Kitchen (id: 1)
  {
    id: 101,
    businessId: 1,
    name: 'Soweto Supreme Kota',
    description: 'Quarter loaf hollowed and stacked with seasoned chips, Russian sausage, special viennas, cheese slice, fried egg & spicy mango atchar.',
    price: 65.0,
    available: true,
    popular: true,
    category: 'Kotas',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 102,
    businessId: 1,
    name: 'Braai Meat Platter & Pap',
    description: 'Juicy tender chuck steak, spiced boerewors piece, chicken wing, smooth stywe pap, hot chakalaka and salsa gravy.',
    price: 110.0,
    available: true,
    popular: true,
    category: 'Platters',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 103,
    businessId: 1,
    name: 'Kasi Cheeseburger & Fries',
    description: 'Fresh grilled pure beef patty, melted cheddar, grilled onions, tangy burger sauce on a toasted seeded bun with crispy golden slap chips.',
    price: 55.0,
    available: true,
    popular: true,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 104,
    businessId: 1,
    name: 'Wings & Slap Chips Box',
    description: '6 Peri-peri or BBQ basted flame-grilled chicken wings with a generous helping of hot salted slap chips.',
    price: 75.0,
    available: true,
    popular: false,
    category: 'Chicken',
    imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 105,
    businessId: 1,
    name: 'Traditional Chakalaka Bowl',
    description: 'Homemade spicy township vegetable relish with baked beans, peppers, grated carrots, garlic and green chillies.',
    price: 25.0,
    available: true,
    popular: false,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 106,
    businessId: 1,
    name: 'Chilled Stoney Ginger Beer (440ml)',
    description: 'Extra kwetsa sparkling ginger beer bottle served ice-cold.',
    price: 20.0,
    available: true,
    popular: false,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=600&q=80'
  },

  // Braai Republic Grill (id: 2)
  {
    id: 201,
    businessId: 2,
    name: 'The Big Republic Braai Board',
    description: '200g Tender Sirloin, 150g Traditional Boerewors, 2 flame BBQ chops, toasted braai broodjie, pap and spicy chakalaka.',
    price: 185.0,
    available: true,
    popular: true,
    category: 'Braai Combos',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 202,
    businessId: 2,
    name: 'Smoked Lamb Ribs (400g)',
    description: 'Slow-smoked Karoo lamb ribs glazed with sweet honey mustard & smoky paprika barbecue basting.',
    price: 145.0,
    available: true,
    popular: true,
    category: 'Ribs & Chops',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 203,
    businessId: 2,
    name: 'Artisan Braaibroodjie',
    description: 'Crisp grilled sourdough filled with mature cheddar, sweet onion relish, ripe tomato slices and a hint of chutney.',
    price: 35.0,
    available: true,
    popular: false,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80'
  },

  // Durban Curry & Bunny Express (id: 3)
  {
    id: 301,
    businessId: 3,
    name: 'Original Durban Mutton Bunny Chow',
    description: 'Fresh hollowed white loaf soaked with slow-cooked spicy bone-in mutton curry, soft melting potatoes, served with carrot salad.',
    price: 95.0,
    available: true,
    popular: true,
    category: 'Bunny Chow',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 302,
    businessId: 3,
    name: 'Butter Chicken Roti Roll',
    description: 'Silky aromatic butter chicken breast cubes rolled in a warm flaky handmade paratha roti with pickled red onions.',
    price: 68.0,
    available: true,
    popular: true,
    category: 'Roti Rolls',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 303,
    businessId: 3,
    name: 'Vegetarian Sugar Bean Bunny',
    description: 'Quarter loaf filled with Durban-style hearty sugar beans cooked in crushed cumin, ginger, turmeric & tamarind.',
    price: 52.0,
    available: true,
    popular: false,
    category: 'Bunny Chow',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'
  }
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 1,
    businessId: 1,
    code: 'KASI10',
    discountPercent: 10,
    minOrderAmount: 80,
    description: '10% discount on all orders over R80 at Mama Kasi Kitchen',
    active: true
  },
  {
    id: 2,
    businessId: 1,
    code: 'CHOWZA20',
    discountAmount: 20,
    minOrderAmount: 100,
    description: 'Get R20 off your cart when you spend R100 or more',
    active: true
  },
  {
    id: 3,
    businessId: 2,
    code: 'BRAAI15',
    discountPercent: 15,
    minOrderAmount: 150,
    description: '15% off any braai order over R150',
    active: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 1,
    orderNumber: '001',
    orderDay: new Date().toISOString().split('T')[0],
    businessId: 1,
    customerName: 'Kagiso Molefe',
    customerPhone: '27712345678',
    customerAddress: '124 Vilakazi St, Orlando West',
    customerNote: 'Please add extra peri-peri sauce on the side!',
    items: [
      { id: 101, name: 'Soweto Supreme Kota', price: 65.0, quantity: 2, total: 130.0 },
      { id: 106, name: 'Chilled Stoney Ginger Beer (440ml)', price: 20.0, quantity: 2, total: 40.0 }
    ],
    subtotal: 170.0,
    discount: 17.0,
    deliveryFee: 25.0,
    total: 178.0,
    status: 'Preparing',
    fulfillmentType: 'Delivery',
    paymentMethod: 'Yoco',
    paymentStatus: 'Paid',
    paymentReference: 'yoco_ch_89127391',
    estimatedPrepMinutes: 20,
    createdAt: new Date(Date.now() - 18 * 60000).toISOString()
  },
  {
    id: 2,
    orderNumber: '002',
    orderDay: new Date().toISOString().split('T')[0],
    businessId: 1,
    customerName: 'Nthabiseng Dlamini',
    customerPhone: '27834567890',
    customerAddress: 'Room 4B, Kliptown Flats',
    customerNote: '',
    items: [
      { id: 102, name: 'Braai Meat Platter & Pap', price: 110.0, quantity: 1, total: 110.0 },
      { id: 105, name: 'Traditional Chakalaka Bowl', price: 25.0, quantity: 1, total: 25.0 }
    ],
    subtotal: 135.0,
    discount: 0.0,
    deliveryFee: 25.0,
    total: 160.0,
    status: 'Confirmed',
    fulfillmentType: 'Delivery',
    paymentMethod: 'Cash',
    paymentStatus: 'Awaiting Payment',
    estimatedPrepMinutes: 25,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString()
  },
  {
    id: 3,
    orderNumber: '003',
    orderDay: new Date().toISOString().split('T')[0],
    businessId: 1,
    customerName: 'Thabo Mokoena',
    customerPhone: '27629871234',
    customerAddress: '',
    customerNote: 'Will collect in 15 minutes',
    items: [
      { id: 103, name: 'Kasi Cheeseburger & Fries', price: 55.0, quantity: 1, total: 55.0 }
    ],
    subtotal: 55.0,
    discount: 0.0,
    deliveryFee: 0.0,
    total: 55.0,
    status: 'Pending',
    fulfillmentType: 'Pickup',
    paymentMethod: 'Cash',
    paymentStatus: 'Awaiting Payment',
    createdAt: new Date(Date.now() - 2 * 60000).toISOString()
  }
];
