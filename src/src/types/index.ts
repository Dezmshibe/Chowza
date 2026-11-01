export type FulfillmentType = 'Delivery' | 'Pickup';

export type PaymentMethod = 'Cash' | 'Yoco' | 'EFT';

export type PaymentStatus = 'Awaiting Payment' | 'Payment Submitted' | 'Paid' | 'Payment Rejected';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled';

export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected';

export type SubscriptionPlanKey = 'starter' | 'growth' | 'pro';

export interface FoodItem {
  id: number;
  supabaseId?: string;
  businessId: number;
  supabaseBusinessId?: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  popular: boolean;
  category: string;
  imageUrl?: string;
}
export interface Business {
  id: number;
  supabaseId?: string;
  name: string;
  businessName: string;
  ownerName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  category: string;
  slug: string;
  active: boolean;
  isOpen: boolean;
  suspended: boolean;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verificationNote?: string;
  plan: SubscriptionPlanKey;
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  trialEndsAt: string;
  deliveryAvailable: boolean;
  deliveryRadiusKm: number;
  deliveryFee: number;
  // Banking for EFT
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
  paymentInstructions?: string;
  // Yoco settings
  yocoEnabled: boolean;
  yocoPublicKey?: string;
  yocoSecretKey?: string;
  bannerImage?: string;
  promotion?: Promotion;
  rating?: number;
  reviewCount?: number;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: number;
  orderNumber: string; // e.g. "001", "002"
  orderDay: string; // ISO date string
  businessId: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerNote?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  estimatedPrepMinutes?: number;
  createdAt: string; // ISO string
  updatedAt?: string;
}

export interface Promotion {
  id: number;
  businessId: number;
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrderAmount?: number;
  description: string;
  active: boolean;
}

export interface AnalyticsEvent {
  id: string;
  eventType: 'page_view' | 'menu_view' | 'food_view' | 'add_to_cart' | 'cart_opened' | 'checkout_started' | 'order_placed' | 'order_completed';
  businessId?: number;
  foodId?: number;
  createdAt: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface PlanConfig {
  key: SubscriptionPlanKey;
  name: string;
  price: number;
  tagline: string;
  featured: boolean;
  features: string[];
}
