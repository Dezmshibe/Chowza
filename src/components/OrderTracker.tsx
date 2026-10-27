import React, { useEffect, useState } from 'react';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  ChefHat,
  ShoppingBag,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  line_total: number;
};

type TrackedOrder = {
  orderNumber: number;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: 'cash' | 'eft' | 'online';
  createdAt: string;
  updatedAt: string;
};

export const OrderTracker: React.FC = () => {
    const {
    trackingOrderId,
    trackingPhone,
    setTrackingLookup,
  } = useApp();
  const [orderNumberInput, setOrderNumberInput] = useState(trackingOrderId);
const [phoneInput, setPhoneInput] = useState(trackingPhone);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSearching(true);
    setSearched(true);
    setErrorMessage('');
    setOrder(null);

    try {
      const cleanOrderNumber = orderNumberInput.trim().replace(/^#/, '');
      const cleanPhone = phoneInput.trim();
      setTrackingLookup(cleanOrderNumber, cleanPhone);

      const { data, error } = await supabase.functions.invoke(
        'track-order',
        {
          body: {
            orderNumber: cleanOrderNumber,
            customerPhone: cleanPhone,
          },
        },
      );

      if (error) {
        throw new Error(error.message || 'Could not track your order.');
      }

      if (!data?.success || !data?.order) {
        throw new Error(
          data?.error ||
            'No matching order was found. Please check your details.',
        );
      }

      setOrder(data.order);
    } catch (error) {
      console.error('Order tracking error:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not find your order.',
      );
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!order) return;

    const checkOrderStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'track-order',
          {
            body: {
              orderNumber: order.orderNumber,
              customerPhone: trackingPhone,
            },
          },
        );

        if (error) {
          console.error('Automatic order status check failed:', error);
          return;
        }

        if (data?.success && data?.order) {
          setOrder(data.order);
        }
      } catch (error) {
        console.error('Automatic order status check failed:', error);
      }
    };

    const interval = window.setInterval(checkOrderStatus, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [order, trackingPhone]);

  const statusSteps: {
    key: OrderStatus;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'pending',
      label: 'Received',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      key: 'preparing',
      label: 'Preparing',
      icon: <ChefHat className="w-4 h-4" />,
    },
    {
      key: 'out_for_delivery',
      label: 'Out for Delivery',
      icon: <Truck className="w-4 h-4" />,
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'preparing':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'completed':
        return 4;
      default:
        return -1;
    }
  };

  const currentStepIndex = order ? getStepIndex(order.status) : -1;

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusDescription = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <>
            Your order has been received and is waiting for the business to
            confirm it.
          </>
        );

      case 'confirmed':
        return (
          <>
            Your order has been confirmed. The kitchen is getting ready to
            prepare it.
          </>
        );

      case 'preparing':
        return (
          <>
            Your food is being prepared right now. We'll update you when it is
            ready to leave the kitchen.
          </>
        );

      case 'out_for_delivery':
        return (
          <>
            Your order is on its way. Please keep your phone nearby.
          </>
        );

      case 'completed':
        return (
          <span className="text-[#166534] font-semibold">
            Your order has been completed. Thank you for ordering with Chowza!
          </span>
        );

      case 'cancelled':
        return (
          <span className="text-[#EF4444]">
            This order was cancelled.
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#17201A] tracking-tight">
          Live Order Tracking
        </h1>

        <p className="text-sm text-[#647067] mt-1">
          Follow your meal from the kitchen right to your doorstep.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label htmlFor="track-ordernum">Order Number</label>

              <input
                id="track-ordernum"
                type="text"
                required
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>

            <div className="field">
              <label htmlFor="track-phone">
                Customer Phone Number
              </label>

              <input
                id="track-phone"
                type="tel"
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="e.g. 0821234567"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSearching}
              className="btn btn-primary btn-sm font-bold shadow-sm"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {searched && errorMessage && (
        <div className="card mb-6 border border-[#EF4444]/20 bg-[#FBE6E4]">
          <div className="flex items-start gap-3 text-[#EF4444]">
            <AlertTriangle className="w-6 h-6 shrink-0" />

            <div>
              <strong className="block text-sm">
                Order Not Found
              </strong>

              <p className="text-sm mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Result */}
      {order && (
        <div className="card space-y-6 animate-in fade-in duration-300">
          {/* Order Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#17201A]/10">
            <div>
              <div className="text-xs font-bold text-[#647067] uppercase tracking-wider">
                Chowza Order
              </div>

              <h2 className="text-2xl font-black text-[#17201A] flex items-center gap-2">
                <span>Order #{order.orderNumber}</span>

                <span
                  className={`badge text-xs ${
                    order.status === 'pending'
                      ? 'badge-pending'
                      : order.status === 'confirmed'
                        ? 'badge-confirmed'
                        : order.status === 'preparing'
                          ? 'badge-preparing'
                          : order.status === 'out_for_delivery'
                            ? 'badge-delivery'
                            : order.status === 'completed'
                              ? 'badge-completed'
                              : 'badge-cancelled'
                  }`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </h2>

              <p className="text-xs text-[#647067] mt-1">
                {order.customerName}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-[#647067]">
                Order Total
              </div>

              <div className="text-2xl font-black text-[#15803D]">
                R{Number(order.total).toFixed(2)}
              </div>

              <div className="text-xs font-semibold text-[#166534]">
                Payment: {order.paymentMethod.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Cancelled */}
          {order.status === 'cancelled' ? (
            <div className="p-4 rounded-xl bg-[#FBE6E4] border border-[#EF4444]/20 flex items-center gap-3 text-[#EF4444]">
              <XCircle className="w-6 h-6 shrink-0" />

              <div>
                <strong className="block text-sm">
                  Order Cancelled
                </strong>

                <span className="text-xs">
                  This order was cancelled by the business.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress */}
<div className="relative flex items-center justify-between">
  {/* Background line */}
  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-[#17201A]/10 z-0" />

  {/* Completed progress line */}
  <div
    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#22C55E] transition-all duration-500 z-0"
    style={{
      width: `${Math.max(
        0,
        (currentStepIndex / (statusSteps.length - 1)) * 100,
      )}%`,
    }}
  />

  {statusSteps.map((step, idx) => {
    const isPast = idx < currentStepIndex;
    const isCurrent = idx === currentStepIndex;

    return (
      <div
        key={step.key}
        className="relative z-20 flex flex-col items-center"
      >
        <div
          className={`relative z-30 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            isPast
              ? 'bg-[#22C55E] text-white shadow-sm ring-4 ring-white'
              : isCurrent
                ? 'bg-[#17201A] text-[#22C55E] ring-4 ring-white shadow-md scale-110'
                : 'bg-[#F7FAF7] text-[#647067] border border-[#17201A]/10 ring-4 ring-white'
          }`}
        >
          {step.icon}
        </div>

        <span
          className={`text-xs mt-2 text-center font-bold whitespace-nowrap max-w-[80px] truncate ${
            isCurrent
              ? 'text-[#17201A]'
              : 'text-[#647067]'
          }`}
        >
          {step.label}
        </span>
      </div>
    );
  })}
</div>
              {/* Status Description */}
              <div className="p-4 rounded-xl bg-[#F7FAF7] border border-[#17201A]/10 flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />

                <div className="text-xs text-[#647067] leading-relaxed">
                  {getStatusDescription(order.status)}
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#647067]">
              Order Items
            </h3>

            <div className="divide-y divide-[#17201A]/10 bg-[#FDFBF7] p-3 rounded-xl border border-[#17201A]/10 text-sm">
              {order.items.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="py-2 flex justify-between items-center first:pt-0 last:pb-0"
                >
                  <div>
                    <span className="font-bold text-[#17201A]">
                      {item.quantity}x {item.name}
                    </span>

                    <div className="text-xs text-[#647067]">
                      R{Number(item.price).toFixed(2)} each
                    </div>
                  </div>

                  <span className="font-bold text-[#15803D]">
                    R{Number(item.line_total).toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="pt-2 mt-2 border-t border-dashed border-[#17201A]/20 flex justify-between text-sm">
                <span className="font-bold">Total</span>

                <span className="font-black text-[#15803D]">
                  R{Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#17201A]/10">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Hi, I am enquiring about Order #${order.orderNumber}`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm text-xs font-bold"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Business</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

