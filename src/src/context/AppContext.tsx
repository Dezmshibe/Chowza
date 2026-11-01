import React, { createContext, useContext, useState, useEffect } from 'react';
import {

  Business,
  FoodItem,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Promotion,
  AnalyticsEvent,
  FulfillmentType,
  SubscriptionPlanKey
} from '../types';
import {
  INITIAL_BUSINESSES,
  INITIAL_FOODS,
  INITIAL_ORDERS
} from '../data/mockData';
import { supabase } from '../lib/supabase';

export type AppView =
  | 'store'
  | 'track'
  | 'whatsapp'
  | 'dashboard'
  | 'menu'
  | 'qrcode'
  | 'analytics'
  | 'settings'
  | 'subscription'
  | 'admin'
  | 'hub';

export interface CartItem {
  food: FoodItem;
  quantity: number;
}

export interface FlashMessage {
  id: string;
  type: 'success' | 'error' | 'notice';
  text: string;
}

interface AppContextType {
  // Areas & Navigation
  currentArea: 'customer' | 'business';
  setCurrentArea: (area: 'customer' | 'business') => void;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  // Businesses
businesses: Business[];
businessesLoading: boolean;
selectedStoreBusiness: Business | null;
setSelectedStoreBusiness: (b: Business | null) => void;
ownerBusiness: Business;
  setOwnerBusinessId: (id: number) => void;
  updateBusiness: (updated: Business) => void;
  toggleBusinessOpen: (id: number) => void;
  toggleBusinessSuspension: (id: number) => void;
  updateBusinessVerification: (id: number, status: Business['verificationStatus'], note?: string) => void;
  // Foods
  foods: FoodItem[];
  addFood: (food: Omit<FoodItem, 'id'>) => void;
  updateFood: (food: FoodItem) => void;
  deleteFood: (id: number) => void;
  toggleFoodAvailable: (id: number) => void;
  toggleFoodPopular: (id: number) => void;
  // Orders
  orders: Order[];
  placeOrder: (orderData: {
    businessId: number;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    customerNote?: string;
    fulfillmentType: FulfillmentType;
    paymentMethod: PaymentMethod;
    promoCode?: string;
  }) => Order | { error: string };
  updateOrderStatus: (orderId: number, status: OrderStatus, prepMinutes?: number) => void;
  updatePaymentStatus: (orderId: number, status: PaymentStatus) => void;
  cancelOrderByCustomer: (orderId: number, phone: string) => { success: boolean; message: string };
  // Cart
  cart: CartItem[];
  cartBusinessId: number | null;
  addToCart: (food: FoodItem, quantity?: number) => void;
  updateCartQuantity: (foodId: number, quantity: number) => void;
  removeFromCart: (foodId: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  appliedPromo: Promotion | null;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  promoDiscount: number;
  cartDeliveryFee: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  // Order Tracking
  trackingOrderId: string;
  trackingPhone: string;
  setTrackingLookup: (orderId: string, phone: string) => void;
  // Flash Alerts
  flashMessages: FlashMessage[];
  addFlash: (type: 'success' | 'error' | 'notice', text: string) => void;
  removeFlash: (id: string) => void;
  // Analytics
  analyticsEvents: AnalyticsEvent[];
  trackEvent: (eventType: AnalyticsEvent['eventType'], businessId?: number, foodId?: number) => void;
  // Subscriptions
  changeBusinessPlan: (businessId: number, plan: SubscriptionPlanKey) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Area: 'customer' (storefront) vs 'business' (admin controls)
  const [currentArea, setCurrentAreaState] = useState<'customer' | 'business'>('customer');
  const [currentView, setCurrentViewState] = useState<AppView>('store');

  const setCurrentArea = (area: 'customer' | 'business') => {
    setCurrentAreaState(area);
    if (area === 'customer') {
      if (currentView !== 'store' && currentView !== 'track') {
        setCurrentViewState('store');
      }
    } else {
      if (currentView === 'store') {
        setCurrentViewState('dashboard');
      }
    }
  };

  const setCurrentView = (view: AppView) => {
    setCurrentViewState(view);
    if (view === 'store') {
      setCurrentAreaState('customer');
    } else if (
      [
        'dashboard',
        'menu',
        'qrcode',
        'analytics',
        'settings',
        'subscription',
        'admin',
        'hub'
      ].includes(view)
    ) {
      setCurrentAreaState('business');
    }
  };

  // Supabase is the source of truth for customer-facing businesses.
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);

  // Supabase IDs are UUIDs, while the existing app types use numbers.
  // This creates a stable numeric ID so existing cart/order/UI flows continue to work.
  const toLocalId = (value: string | number): number => {
    const text = String(value);
    if (/^\\d+$/.test(text)) return Number(text);

    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }

    return Math.abs(hash) || 1;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadBusinessesFromSupabase() {
      setBusinessesLoading(true);

      const { data, error } = await supabase
        .from('businesses')
        .select(
          'id, name, slug, description, logo_url, public_address, is_published'
        )
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error(
          'Chowza: failed to load businesses from Supabase:',
          error
        );
        setBusinesses([]);
        setBusinessesLoading(false);
        return;
      }

      const realBusinesses: Business[] = (data ?? []).map((business) => ({
  id: toLocalId(business.id),
  supabaseId: business.id,
  name: business.name ?? '',
        businessName: business.name ?? '',
        ownerName: '',
        phone: '',
        whatsappNumber: '',
        email: '',
        address: business.public_address ?? '',
        category: 'Food',
        slug: business.slug ?? '',
        active: true,
        isOpen: true,
        suspended: false,
        verificationStatus: 'verified',
        plan: 'starter',
        subscriptionStatus: 'active',
        trialEndsAt: '',
        deliveryAvailable: true,
        deliveryRadiusKm: 0,
        deliveryFee: 0,
        yocoEnabled: false,
        bannerImage: business.logo_url ?? undefined,
        promotion: (() => {
          try {
            const saved = JSON.parse(localStorage.getItem('wf_promotions') || '{}');
            return saved[String(toLocalId(business.id))] || undefined;
          } catch {
            return undefined;
          }
        })()
      }));

      console.log(
        'Chowza: Supabase businesses loaded:',
        realBusinesses
      );

      setBusinesses(realBusinesses);
      setBusinessesLoading(false);

      localStorage.setItem(
        'wf_businesses',
        JSON.stringify(realBusinesses)
      );
    }

    loadBusinessesFromSupabase();

    return () => {
      cancelled = true;
    };
  }, []);

  // Published menu items also come directly from Supabase.
  const [foods, setFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadFoodsFromSupabase() {
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select(
          'id, business_id, name, description, price, image_url, is_available, sort_order'
        )
        .eq('is_available', true)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (menuError) {
        console.error(
          'Chowza: failed to load menu items:',
          menuError
        );
        setFoods([]);
        return;
      }

      const realFoods: FoodItem[] = (menuData ?? [])
  .map((item) => ({
    id: toLocalId(item.id),
    supabaseId: item.id,
    businessId: toLocalId(item.business_id),
    supabaseBusinessId: item.business_id,
          name: item.name ?? '',
          description: item.description ?? '',
          price: Number(item.price ?? 0),
          available: Boolean(item.is_available),
          popular: false,
          category: 'Other',
          imageUrl: item.image_url ?? undefined
        }))
        .filter((food) =>
          businesses.some((business) => business.id === food.businessId)
        );

      console.log(
        'Chowza: Supabase menu items loaded:',
        realFoods
      );

      setFoods(realFoods);
    }

    loadFoodsFromSupabase();

    return () => {
      cancelled = true;
    };
  }, [businesses]);

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('wf_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });


  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>(() => {
    const saved = localStorage.getItem('wf_analytics');
    return saved ? JSON.parse(saved) : [];
  });

  // Current store selected in customer view (defaults to Mama Kasi Kitchen)
  const [selectedStoreBusiness, setSelectedStoreBusiness] = useState<Business | null>(() => {
    return businesses[0] || null;
  });

  useEffect(() => {
    if (businesses.length === 0) {
      setSelectedStoreBusiness(null);
      return;
    }

    setSelectedStoreBusiness((current) => {
      if (!current) {
        return businesses[0];
      }

      const matchingBusiness = businesses.find(
        (business) => business.id === current.id
      );

      return matchingBusiness ?? businesses[0];
    });
  }, [businesses]);

  // Owner active business for dashboard
  const [ownerBusinessId, setOwnerBusinessIdState] = useState<number>(() => {
    return businesses[0]?.id || 1;
  });

  const ownerBusiness = businesses.find((b) => b.id === ownerBusinessId) || businesses[0];

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartBusinessId, setCartBusinessId] = useState<number | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Tracking query
  const [trackingOrderId, setTrackingOrderId] = useState<string>('001');
  const [trackingPhone, setTrackingPhone] = useState<string>('27712345678');

  // Flash messages
  const [flashMessages, setFlashMessages] = useState<FlashMessage[]>([]);

  // Orders and analytics remain locally persisted for the existing app flow.
  useEffect(() => {
    localStorage.setItem('wf_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('wf_analytics', JSON.stringify(analyticsEvents));
  }, [analyticsEvents]);

  // Flash helper
  const addFlash = (type: 'success' | 'error' | 'notice', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setFlashMessages((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      removeFlash(id);
    }, 6000);
  };

  const removeFlash = (id: string) => {
    setFlashMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // Analytics event tracking
  const trackEvent = (
    eventType: AnalyticsEvent['eventType'],
    businessId?: number,
    foodId?: number
  ) => {
    const newEvent: AnalyticsEvent = {
      id: Math.random().toString(36).substring(2, 9),
      eventType,
      businessId,
      foodId,
      createdAt: new Date().toISOString(),
      deviceType: window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
    };
    setAnalyticsEvents((prev) => [newEvent, ...prev.slice(0, 999)]);
  };

  // Sound alert for new order
  const playNewOrderNotification = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext might be blocked until user interaction
    }
  };

  // Business actions
  const setOwnerBusinessId = (id: number) => {
    setOwnerBusinessIdState(id);
  };

  const updateBusiness = (updated: Business) => {
    setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    if (updated.promotion) {
      try {
        const saved = JSON.parse(localStorage.getItem('wf_promotions') || '{}');
        saved[String(updated.id)] = updated.promotion;
        localStorage.setItem('wf_promotions', JSON.stringify(saved));
      } catch (error) {
        console.error('Chowza: failed to save promotion:', error);
      }
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('wf_promotions') || '{}');
        delete saved[String(updated.id)];
        localStorage.setItem('wf_promotions', JSON.stringify(saved));
      } catch (error) {
        console.error('Chowza: failed to remove promotion:', error);
      }
    }
    if (selectedStoreBusiness?.id === updated.id) {
      setSelectedStoreBusiness(updated);
    }
    addFlash('success', `Business details for ${updated.businessName} updated successfully.`);
  };

  const toggleBusinessOpen = (id: number) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const nextState = !b.isOpen;
          addFlash(
            nextState ? 'success' : 'notice',
            `${b.businessName} is now ${nextState ? 'OPEN for orders' : 'CLOSED'}.`
          );
          return { ...b, isOpen: nextState };
        }
        return b;
      })
    );
  };

  const toggleBusinessSuspension = (id: number) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const nextState = !b.suspended;
          addFlash(
            nextState ? 'error' : 'success',
            `${b.businessName} has been ${nextState ? 'suspended' : 're-activated'}.`
          );
          return { ...b, suspended: nextState };
        }
        return b;
      })
    );
  };

  const updateBusinessVerification = (
    id: number,
    status: Business['verificationStatus'],
    note?: string
  ) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          addFlash('success', `Verification status updated to ${status}.`);
          return {
            ...b,
            verificationStatus: status,
            verifiedAt: status === 'verified' ? new Date().toISOString() : undefined,
            verificationNote: note || b.verificationNote
          };
        }
        return b;
      })
    );
  };

  const changeBusinessPlan = (businessId: number, plan: SubscriptionPlanKey) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === businessId) {
          addFlash('success', `Successfully upgraded to ${plan.toUpperCase()} plan.`);
          return { ...b, plan, subscriptionStatus: 'active' };
        }
        return b;
      })
    );
  };

  // Food actions
  const addFood = (foodData: Omit<FoodItem, 'id'>) => {
    const newId = Date.now();
    const newFood: FoodItem = {
      ...foodData,
      id: newId
    };
    setFoods((prev) => [newFood, ...prev]);
    addFlash('success', `${newFood.name} was added to the menu.`);
  };

  const updateFood = (updated: FoodItem) => {
    setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    addFlash('success', `${updated.name} updated.`);
  };

  const deleteFood = (id: number) => {
    const target = foods.find((f) => f.id === id);
    setFoods((prev) => prev.filter((f) => f.id !== id));
    addFlash('notice', `${target?.name || 'Item'} deleted from menu.`);
  };

  const toggleFoodAvailable = (id: number) => {
    setFoods((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const next = !f.available;
          addFlash('notice', `${f.name} is now ${next ? 'available' : 'marked out of stock'}.`);
          return { ...f, available: next };
        }
        return f;
      })
    );
  };

  const toggleFoodPopular = (id: number) => {
    setFoods((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const next = !f.popular;
          addFlash('success', `${f.name} ${next ? 'marked as popular' : 'removed from popular'}.`);
          return { ...f, popular: next };
        }
        return f;
      })
    );
  };

  // Cart logic
  const addToCart = (food: FoodItem, quantity = 1) => {
    if (cartBusinessId && cartBusinessId !== food.businessId && cart.length > 0) {
      if (
        !window.confirm(
          'Your cart contains items from another restaurant. Would you like to clear your cart and start a new order?'
        )
      ) {
        return;
      }
      setCart([]);
    }

    setCartBusinessId(food.businessId);
    setCart((prev) => {
      const existing = prev.find((item) => item.food.id === food.id);
      if (existing) {
        return prev.map((item) =>
          item.food.id === food.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { food, quantity }];
    });

    trackEvent('add_to_cart', food.businessId, food.id);
    addFlash('success', `Added ${quantity}x ${food.name} to cart.`);
  };

  const updateCartQuantity = (foodId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.food.id === foodId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (foodId: number) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.food.id !== foodId);
      if (next.length === 0) {
        setCartBusinessId(null);
        setAppliedPromo(null);
      }
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCartBusinessId(null);
    setAppliedPromo(null);
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);

  const cartBusiness = businesses.find((b) => b.id === cartBusinessId);
  const cartDeliveryFee = cartBusiness?.deliveryAvailable ? cartBusiness.deliveryFee : 0;

  const rawPromoDiscount = appliedPromo
    ? appliedPromo.discountPercent
      ? (cartSubtotal * appliedPromo.discountPercent) / 100
      : appliedPromo.discountAmount || 0
    : 0;

  const promoDiscount = Math.min(
    cartSubtotal,
    Math.max(0, Math.round(rawPromoDiscount * 100) / 100)
  );

  useEffect(() => {
    if (
      appliedPromo &&
      cartBusiness?.promotion &&
      (!cartBusiness.promotion.active ||
        cartBusiness.promotion.code.toUpperCase() !== appliedPromo.code.toUpperCase() ||
        (cartBusiness.promotion.minOrderAmount && cartSubtotal < cartBusiness.promotion.minOrderAmount))
    ) {
      setAppliedPromo(null);
    }
  }, [cartSubtotal, cartBusiness?.id, cartBusiness?.promotion, appliedPromo]);

  const cartTotal = Math.max(0, Math.round((cartSubtotal - promoDiscount + cartDeliveryFee) * 100) / 100);

  const applyPromoCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const promo = cartBusiness?.promotion;

    if (!promo || !promo.active || promo.code.toUpperCase() !== cleanCode) {
      return { success: false, message: `Promo code "${code}" is invalid or unavailable for this business.` };
    }

    if (promo.minOrderAmount && cartSubtotal < promo.minOrderAmount) {
      return {
        success: false,
        message: `Order subtotal must be at least R${promo.minOrderAmount.toFixed(2)} to use code ${promo.code}.`
      };
    }

    setAppliedPromo(promo);
    const discountText = promo.discountPercent
      ? `${promo.discountPercent}% off`
      : `R${(promo.discountAmount || 0).toFixed(2)} off`;
    return { success: true, message: `Promo code ${promo.code} applied — ${discountText}.` };
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    addFlash('notice', 'Promotion code removed.');
  };

  // Place Order
  const placeOrder = (data: {
    businessId: number;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    customerNote?: string;
    fulfillmentType: FulfillmentType;
    paymentMethod: PaymentMethod;
    promoCode?: string;
  }): Order | { error: string } => {
    if (cart.length === 0) {
      return { error: 'Your cart is empty.' };
    }

    const business = businesses.find((b) => b.id === data.businessId);
    if (!business) {
      return { error: 'Business not found.' };
    }

    if (!business.isOpen) {
      return { error: 'This business is currently closed and not accepting orders.' };
    }

    // Daily order number generation
    const today = new Date().toISOString().split('T')[0];
    const todayOrdersForBusiness = orders.filter(
      (o) => o.businessId === business.id && o.orderDay === today
    );
    const nextSeq = todayOrdersForBusiness.length + 1;
    const orderNumber = String(nextSeq).padStart(3, '0');

    const cleanItems: OrderItem[] = cart.map((item) => ({
      id: item.food.id,
      name: item.food.name,
      price: item.food.price,
      quantity: item.quantity,
      total: Math.round(item.food.price * item.quantity * 100) / 100
    }));

    const deliveryFeeApplied = data.fulfillmentType === 'Delivery' ? business.deliveryFee : 0;
    const totalAmount = Math.max(0, Math.round((cartSubtotal - promoDiscount + deliveryFeeApplied) * 100) / 100);

    const newOrder: Order = {
      id: Date.now(),
      orderNumber,
      orderDay: today,
      businessId: business.id,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      customerAddress: data.fulfillmentType === 'Delivery' ? data.customerAddress?.trim() : '',
      customerNote: data.customerNote?.trim(),
      items: cleanItems,
      subtotal: cartSubtotal,
      discount: promoDiscount,
      deliveryFee: deliveryFeeApplied,
      total: totalAmount,
      status: 'Pending',
      fulfillmentType: data.fulfillmentType,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === 'Yoco' ? 'Paid' : 'Awaiting Payment',
      paymentReference: data.paymentMethod === 'Yoco' ? `yoco_ch_${Math.random().toString(36).substring(2, 9)}` : undefined,
      estimatedPrepMinutes: 20,
      createdAt: new Date().toISOString()
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setIsCartOpen(false);

    // Track analytics
    trackEvent('order_placed', business.id);

    // Audio chime for new order simulation
    playNewOrderNotification();

    // Auto update tracking lookup
    setTrackingOrderId(newOrder.orderNumber);
    setTrackingPhone(newOrder.customerPhone);

    addFlash(
      'success',
      `Order #${newOrder.orderNumber} placed with ${business.businessName}! Status: Pending.`
    );

    return newOrder;
  };

  // Order status updating
  const updateOrderStatus = (orderId: number, status: OrderStatus, prepMinutes?: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: Order = {
            ...o,
            status,
            estimatedPrepMinutes: prepMinutes !== undefined ? prepMinutes : o.estimatedPrepMinutes,
            updatedAt: new Date().toISOString()
          };
          addFlash(
            'success',
            `Order #${o.orderNumber} updated to "${status}". WhatsApp notification triggered.`
          );
          return updated;
        }
        return o;
      })
    );
  };

  const updatePaymentStatus = (orderId: number, status: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          addFlash('success', `Payment for Order #${o.orderNumber} marked as ${status}.`);
          return { ...o, paymentStatus: status };
        }
        return o;
      })
    );
  };

  const cancelOrderByCustomer = (orderId: number, phone: string): { success: boolean; message: string } => {
    const target = orders.find(
      (o) => o.id === orderId || (o.orderNumber === orderId.toString() || o.orderNumber === String(orderId).padStart(3, '0'))
    );

    if (!target) {
      return { success: false, message: 'Order could not be found.' };
    }

    if (target.customerPhone.replace(/\D/g, '') !== phone.replace(/\D/g, '')) {
      return { success: false, message: 'Phone number does not match this order.' };
    }

    if (target.status !== 'Pending' && target.status !== 'Confirmed') {
      return {
        success: false,
        message: `Order is already "${target.status}" and can no longer be cancelled.`
      };
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === target.id ? { ...o, status: 'Cancelled', updatedAt: new Date().toISOString() } : o))
    );

    addFlash('notice', `Order #${target.orderNumber} has been cancelled.`);
    return { success: true, message: `Order #${target.orderNumber} has been cancelled successfully.` };
  };

  const setTrackingLookup = (orderId: string, phone: string) => {
    setTrackingOrderId(orderId);
    setTrackingPhone(phone);
  };

  return (
    <AppContext.Provider
      value={{
        currentArea,
        setCurrentArea,
        currentView,
        setCurrentView,
        businesses,
businessesLoading,
selectedStoreBusiness,
        setSelectedStoreBusiness,
        ownerBusiness,
        setOwnerBusinessId,
        updateBusiness,
        toggleBusinessOpen,
        toggleBusinessSuspension,
        updateBusinessVerification,
        foods,
        addFood,
        updateFood,
        deleteFood,
        toggleFoodAvailable,
        toggleFoodPopular,
        orders,
        placeOrder,
        updateOrderStatus,
        updatePaymentStatus,
        cancelOrderByCustomer,
        cart,
        cartBusinessId,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        appliedPromo,
        applyPromoCode,
        removePromoCode,
        promoDiscount,
        cartDeliveryFee,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        trackingOrderId,
        trackingPhone,
        setTrackingLookup,
        flashMessages,
        addFlash,
        removeFlash,
        analyticsEvents,
        trackEvent,
        changeBusinessPlan
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
