import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  ChefHat,
  ShoppingBag,
  MapPin,
  Phone,
  MessageCircle,
  RefreshCw,
  Share2
} from 'lucide-react';
import { OrderStatus } from '../types';

export const OrderTracker: React.FC = () => {
  const {
    orders,
    businesses,
    cancelOrderByCustomer,
    trackingOrderId,
    trackingPhone,
    setTrackingLookup,
    addFlash
  } = useApp();

  const [orderNumberInput, setOrderNumberInput] = useState(trackingOrderId || '001');
  const [phoneInput, setPhoneInput] = useState(trackingPhone || '27712345678');
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(true);

  // Normalize phone for comparison
  const normalize = (p: string) => p.replace(/\D/g, '');

  const matchedOrder = orders.find((o) => {
    const numMatch =
      o.orderNumber === orderNumberInput.trim() ||
      o.orderNumber === orderNumberInput.trim().replace(/^#/, '').padStart(3, '0') ||
      o.id.toString() === orderNumberInput.trim();

    const phoneMatch =
      normalize(o.customerPhone).endsWith(normalize(phoneInput).slice(-9)) ||
      normalize(phoneInput).endsWith(normalize(o.customerPhone).slice(-9));

    return numMatch && phoneMatch;
  });

  const business = matchedOrder ? businesses.find((b) => b.id === matchedOrder.businessId) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSearched(true);
    setTimeout(() => {
      setIsSearching(false);
      setTrackingLookup(orderNumberInput, phoneInput);
    }, 300);
  };

  const handleCancel = () => {
    if (!matchedOrder) return;
    if (!window.confirm(`Are you sure you want to cancel Order #${matchedOrder.orderNumber}?`)) return;

    const res = cancelOrderByCustomer(matchedOrder.id, phoneInput);
    if (!res.success) {
      addFlash('error', res.message);
    }
  };

  // Status step calculation
  const statusSteps: { key: OrderStatus; label: string; icon: React.ReactNode }[] = [
    { key: 'Pending', label: 'Received', icon: <Clock className="w-4 h-4" /> },
    { key: 'Confirmed', label: 'Confirmed', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'Preparing', label: 'Preparing', icon: <ChefHat className="w-4 h-4" /> },
    {
      key: matchedOrder?.fulfillmentType === 'Pickup' ? 'Ready' : 'Out for Delivery',
      label: matchedOrder?.fulfillmentType === 'Pickup' ? 'Ready for Pickup' : 'Out for Delivery',
      icon: matchedOrder?.fulfillmentType === 'Pickup' ? <ShoppingBag className="w-4 h-4" /> : <Truck className="w-4 h-4" />
    },
    { key: 'Completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" /> }
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Confirmed':
        return 1;
      case 'Preparing':
        return 2;
      case 'Ready':
      case 'Out for Delivery':
        return 3;
      case 'Completed':
        return 4;
      default:
        return -1;
    }
  };

  const currentStepIndex = matchedOrder ? getStepIndex(matchedOrder.status) : -1;
  const isCancelled = matchedOrder?.status === 'Cancelled';
  const canCancel = matchedOrder && (matchedOrder.status === 'Pending' || matchedOrder.status === 'Confirmed');

  return (
    <div className="container py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1B1815] tracking-tight">
          Live Order Tracking
        </h1>
        <p className="text-sm text-[#5A544C] mt-1">
          Follow your meal from the kitchen grill right to your doorstep.
        </p>
      </div>

      {/* Lookup Form Card */}
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
                placeholder="e.g. 001"
              />
            </div>

            <div className="field">
              <label htmlFor="track-phone">Customer Phone Number</label>
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

          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Quick selector for demo testing */}
            <div className="flex items-center gap-1.5 text-xs text-[#8C857A] overflow-x-auto">
              <span className="font-semibold shrink-0">Demo Orders:</span>
              {orders.slice(0, 3).map((demo) => (
                <button
                  type="button"
                  key={demo.id}
                  onClick={() => {
                    setOrderNumberInput(demo.orderNumber);
                    setPhoneInput(demo.customerPhone);
                    setTrackingLookup(demo.orderNumber, demo.customerPhone);
                  }}
                  className="px-2 py-0.5 rounded bg-[#F3EEE4] hover:bg-[#EDA430]/20 text-[#1B1815] font-bold underline cursor-pointer"
                >
                  #{demo.orderNumber}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="btn btn-primary btn-sm font-bold shadow-sm shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'Checking...' : 'Track'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Result View */}
      {searched && (
        <>
          {matchedOrder ? (
            <div className="card space-y-6 animate-in fade-in duration-300">
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1B1815]/10">
                <div>
                  <div className="text-xs font-bold text-[#8C857A] uppercase tracking-wider">
                    {business?.businessName || 'Restaurant Order'}
                  </div>
                  <h2 className="text-2xl font-black text-[#1B1815] flex items-center gap-2">
                    <span>Order #{matchedOrder.orderNumber}</span>
                    <span
                      className={`badge text-xs ${
                        matchedOrder.status === 'Pending'
                          ? 'badge-pending'
                          : matchedOrder.status === 'Confirmed'
                          ? 'badge-confirmed'
                          : matchedOrder.status === 'Preparing'
                          ? 'badge-preparing'
                          : matchedOrder.status === 'Ready' || matchedOrder.status === 'Out for Delivery'
                          ? 'badge-delivery'
                          : matchedOrder.status === 'Completed'
                          ? 'badge-completed'
                          : 'badge-cancelled'
                      }`}
                    >
                      {matchedOrder.status}
                    </span>
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#8C857A]">Order Total</div>
                  <div className="text-2xl font-black text-[#DD5330]">
                    R{matchedOrder.total.toFixed(2)}
                  </div>
                  <div className="text-xs font-semibold text-[#176B35]">
                    {matchedOrder.paymentMethod} ({matchedOrder.paymentStatus})
                  </div>
                </div>
              </div>

              {/* Status Tracker Bar */}
              {isCancelled ? (
                <div className="p-4 rounded-xl bg-[#FBE6E4] border border-[#9E2B25]/20 flex items-center gap-3 text-[#9E2B25]">
                  <XCircle className="w-6 h-6 shrink-0" />
                  <div>
                    <strong className="block text-sm">Order Cancelled</strong>
                    <span className="text-xs">
                      This order was cancelled. No payment was captured or order fulfilled.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Progress Line */}
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-[#1B1815]/10 z-0" />
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#25D366] transition-all duration-500 z-0"
                      style={{
                        width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%`
                      }}
                    />

                    {statusSteps.map((step, idx) => {
                      const isPast = idx < currentStepIndex;
                      const isCurrent = idx === currentStepIndex;

                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                              isPast
                                ? 'bg-[#25D366] text-white shadow-sm ring-4 ring-white'
                                : isCurrent
                                ? 'bg-[#1B1815] text-[#25D366] ring-4 ring-[#25D366]/30 shadow-md scale-110'
                                : 'bg-[#F3EEE4] text-[#8C857A] border border-[#1B1815]/10'
                            }`}
                          >
                            {step.icon}
                          </div>
                          <span
                            className={`text-xs mt-2 text-center font-bold whitespace-nowrap max-w-[70px] truncate ${
                              isCurrent ? 'text-[#1B1815]' : 'text-[#8C857A]'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Status Description Banner */}
                  <div className="p-4 rounded-xl bg-[#F3EEE4] border border-[#1B1815]/10 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#DD5330] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#5A544C] leading-relaxed">
                      {matchedOrder.status === 'Pending' && (
                        <span>
                          The kitchen has received your order and is reviewing it. Estimated wait: <strong>2-3 mins</strong>.
                        </span>
                      )}
                      {matchedOrder.status === 'Confirmed' && (
                        <span>
                          Order confirmed! The chef is queuing your items.
                        </span>
                      )}
                      {matchedOrder.status === 'Preparing' && (
                        <span>
                          Your food is on the grill! Estimated preparation time:{' '}
                          <strong className="text-[#DD5330]">
                            {matchedOrder.estimatedPrepMinutes || 20} minutes
                          </strong>
                          .
                        </span>
                      )}
                      {(matchedOrder.status === 'Ready' || matchedOrder.status === 'Out for Delivery') && (
                        <span>
                          {matchedOrder.fulfillmentType === 'Pickup'
                            ? 'Your order is hot, packed and ready for collection at the counter!'
                            : 'Driver is on the way to your address! Please keep your phone nearby.'}
                        </span>
                      )}
                      {matchedOrder.status === 'Completed' && (
                        <span className="text-[#176B35] font-semibold">
                          Delivered / Collected! Thank you for ordering with WhatsApp Food. Siyabonga!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items Breakdown */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#8C857A]">
                  Order Items
                </h3>

                <div className="divide-y divide-[#1B1815]/10 bg-[#FDFBF7] p-3 rounded-xl border border-[#1B1815]/10 text-sm">
                  {matchedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center first:pt-0 last:pb-0">
                      <div>
                        <span className="font-bold text-[#1B1815]">
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-[#DD5330]">R{item.total.toFixed(2)}</span>
                    </div>
                  ))}

                  {matchedOrder.customerNote && (
                    <div className="pt-2 text-xs text-[#5A544C]">
                      <strong>Note:</strong> {matchedOrder.customerNote}
                    </div>
                  )}

                  <div className="pt-2 mt-2 border-t border-dashed border-[#1B1815]/20 flex justify-between text-xs text-[#5A544C]">
                    <span>Fulfillment:</span>
                    <span className="font-bold text-[#1B1815]">
                      {matchedOrder.fulfillmentType}
                      {matchedOrder.customerAddress ? ` (${matchedOrder.customerAddress})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1B1815]/10">
                <a
                  href={`https://wa.me/${business?.whatsappNumber || '27821234567'}?text=Hi,%20inquiring%20about%20Order%20%23${matchedOrder.orderNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm text-xs font-bold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Business</span>
                </a>

                {canCancel && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-danger btn-sm text-xs font-bold"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card empty-state">
              <AlertTriangle className="w-12 h-12 mx-auto text-[#EDA430] mb-3" />
              <strong>Order Not Found</strong>
              <p className="text-sm">
                No matching order was found for Order #{orderNumberInput} and phone {phoneInput}. Please check your order slip or try one of the demo orders above.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
