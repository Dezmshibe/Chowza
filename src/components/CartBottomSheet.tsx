import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShoppingBag,
  CreditCard,
  Banknote,
  Building2,
  Sparkles
} from 'lucide-react';
import { FulfillmentType, PaymentMethod } from '../types';

export const CartBottomSheet: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartBusinessId,
    businesses,
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
    placeOrder,
    setCurrentView,
    addFlash
  } = useApp();

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('Delivery');
  const [customerName, setCustomerName] = useState('Kagiso Molefe');
  const [customerPhone, setCustomerPhone] = useState('0821234567');
  const [customerAddress, setCustomerAddress] = useState('142 Vilakazi Street, Orlando West');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showYocoModal, setShowYocoModal] = useState(false);

  if (!isCartOpen) return null;

  const currentBusiness = businesses.find((b) => b.id === cartBusinessId);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    setPromoMessage({ text: res.message, error: !res.success });
    if (res.success) {
      setPromoInput('');
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      addFlash('error', 'Please enter your name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 9) {
      addFlash('error', 'Please enter a valid South African phone number.');
      return;
    }
    if (fulfillmentType === 'Delivery' && !customerAddress.trim()) {
      addFlash('error', 'Please enter a delivery address.');
      return;
    }

    if (!currentBusiness) {
      addFlash('error', 'Business not found.');
      return;
    }

    if (paymentMethod === 'Yoco') {
      setShowYocoModal(true);
      return;
    }

    executeOrderPlacement();
  };

  const executeOrderPlacement = () => {
    if (!currentBusiness) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const result = placeOrder({
        businessId: currentBusiness.id,
        customerName,
        customerPhone,
        customerAddress: fulfillmentType === 'Delivery' ? customerAddress : undefined,
        customerNote,
        fulfillmentType,
        paymentMethod,
        promoCode: appliedPromo?.code
      });

      setIsSubmitting(false);
      setShowYocoModal(false);

      if ('error' in result) {
        addFlash('error', result.error);
      } else {
        setIsCartOpen(false);
        setCurrentView('track');
      }
    }, 600);
  };

  return (
    <>
      <div
        className="sheet-backdrop active"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsCartOpen(false);
        }}
      >
        <div className="sheet">
          <div className="sheet-grabber" />

          {/* Sheet Header */}
          <div className="sheet-header">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#22C55E]" />
                <span>Your Order</span>
              </h2>
              {currentBusiness && (
                <p className="text-xs text-[#647067] font-medium mt-0.5">
                  Ordering from <strong className="text-[#17201A]">{currentBusiness.businessName}</strong>
                </p>
              )}
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="sheet-close"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents */}
          {cart.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag className="w-12 h-12 mx-auto text-[#647067]/40 mb-3" />
              <strong>Your cart is empty</strong>
              <p className="text-sm">Browse our menu and pick something delicious!</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="btn btn-primary btn-sm mt-4 font-bold"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckoutSubmit} className="stack">
              {/* Items List */}
              <div className="card p-3 divide-y divide-black/5 bg-[#FDFBF7]">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#647067]">
                    Cart Items ({cart.length})
                  </span>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-[#EF4444] hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {cart.map(({ food, quantity }) => (
                    <div key={food.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#17201A] truncate">{food.name}</div>
                        <div className="text-xs text-[#647067]">
                          R{food.price.toFixed(2)} each · <strong className="text-[#15803D]">R{(food.price * quantity).toFixed(2)}</strong>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-white border border-[#17201A]/10 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(food.id, quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#17201A] hover:bg-[#F7FAF7]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-sm">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(food.id, quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#17201A] hover:bg-[#F7FAF7]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(food.id)}
                        className="text-[#647067] hover:text-[#EF4444] p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fulfillment Type */}
              <div className="field">
                <label>Fulfillment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('Delivery')}
                    className={`btn btn-sm ${
                      fulfillmentType === 'Delivery'
                        ? 'btn-dark'
                        : 'btn-outline bg-white'
                    }`}
                  >
                    <Truck className="w-4 h-4 mr-1.5" />
                    Delivery (+R{currentBusiness?.deliveryFee || 25})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType('Pickup')}
                    className={`btn btn-sm ${
                      fulfillmentType === 'Pickup'
                        ? 'btn-dark'
                        : 'btn-outline bg-white'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                    Pickup / Collection (Free)
                  </button>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field">
                  <label htmlFor="customer-name">Full Name *</label>
                  <input
                    id="customer-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Sipho Ndlovu"
                  />
                </div>

                <div className="field">
                  <label htmlFor="customer-phone">WhatsApp / Phone *</label>
                  <input
                    id="customer-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="082 123 4567"
                  />
                </div>
              </div>

              {fulfillmentType === 'Delivery' && (
                <div className="field">
                  <label htmlFor="customer-address">Delivery Address *</label>
                  <input
                    id="customer-address"
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Street name, house/flat number, township or suburb"
                  />
                  <p className="help">Delivery radius: up to {currentBusiness?.deliveryRadiusKm || 5} km</p>
                </div>
              )}

              <div className="field">
                <label htmlFor="customer-notes">Kitchen Notes (Optional)</label>
                <input
                  id="customer-notes"
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="e.g. Extra chakalaka, no mayo, call on arrival"
                />
              </div>

              {/* Promo Code Section */}
              <div className="field">
                <label>Promotion Code</label>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E4F9EC] border border-[#22C55E]/40 text-sm">
                    <div className="flex items-center gap-2 text-[#166534] font-semibold">
                      <Tag className="w-4 h-4" />
                      <span>Code <strong>{appliedPromo.code}</strong> applied ({appliedPromo.description})</span>
                    </div>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className="text-xs font-bold text-[#EF4444] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="Try KASI10 or CHOWZA20"
                        className="uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="btn btn-outline btn-sm font-bold shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                    {promoMessage && (
                      <p className={`text-xs mt-1 font-semibold ${promoMessage.error ? 'text-[#EF4444]' : 'text-[#166534]'}`}>
                        {promoMessage.text}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="field">
                <label>Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all ${
                      paymentMethod === 'Cash'
                        ? 'border-[#22C55E] bg-[#E4F9EC]/50 font-bold'
                        : 'border-[#17201A]/10 bg-white hover:bg-[#F7FAF7]'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-[#22C55E]" />
                    <span className="text-xs">Cash on {fulfillmentType === 'Delivery' ? 'Delivery' : 'Pickup'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Yoco')}
                    className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all ${
                      paymentMethod === 'Yoco'
                        ? 'border-[#22C55E] bg-[#E4F9EC]/50 font-bold'
                        : 'border-[#17201A]/10 bg-white hover:bg-[#F7FAF7]'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#0284C7]" />
                    <span className="text-xs">Yoco Card (Instant)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('EFT')}
                    className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all ${
                      paymentMethod === 'EFT'
                        ? 'border-[#22C55E] bg-[#E4F9EC]/50 font-bold'
                        : 'border-[#17201A]/10 bg-white hover:bg-[#F7FAF7]'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-[#22C55E]" />
                    <span className="text-xs">Bank EFT</span>
                  </button>
                </div>

                {paymentMethod === 'EFT' && currentBusiness?.bankName && (
                  <div className="mt-3 p-3 bg-[#F0FDF4] border border-[#22C55E]/30 rounded-lg text-xs space-y-1">
                    <p className="font-bold text-[#166534]">Bank Transfer Details:</p>
                    <p><strong>Bank:</strong> {currentBusiness.bankName}</p>
                    <p><strong>Account Holder:</strong> {currentBusiness.accountHolder}</p>
                    <p><strong>Account Number:</strong> {currentBusiness.accountNumber}</p>
                    <p><strong>Branch Code:</strong> {currentBusiness.branchCode}</p>
                    <p className="text-[#647067] pt-1 italic">{currentBusiness.paymentInstructions}</p>
                  </div>
                )}
              </div>

              {/* Order Totals Summary */}
              <div className="card bg-[#FBF7EE] p-3 text-sm space-y-1.5 border-[#17201A]/15">
                <div className="flex justify-between text-[#647067]">
                  <span>Subtotal</span>
                  <span>R{cartSubtotal.toFixed(2)}</span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-[#166534] font-semibold">
                    <span>Discount ({appliedPromo?.code})</span>
                    <span>-R{promoDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#647067]">
                  <span>{fulfillmentType} Fee</span>
                  <span>{cartDeliveryFee > 0 ? `R${cartDeliveryFee.toFixed(2)}` : 'FREE'}</span>
                </div>

                <div className="border-t border-[#17201A]/15 pt-2 flex justify-between items-baseline text-base font-extrabold text-[#17201A]">
                  <span>Total Due</span>
                  <span className="text-xl text-[#15803D]">R{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="btn btn-primary btn-block text-base font-black py-3.5 shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Place Order · R{cartTotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Realistic Yoco Hosted Checkout Modal Simulation */}
      {showYocoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-[#17201A]/10 animate-in fade-in zoom-in-95 duration-200">
            {/* Yoco Header */}
            <div className="bg-[#0D1527] text-white p-5 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#00D4FF] font-black">Yoco Checkout</div>
                <div className="text-lg font-bold">{currentBusiness?.businessName}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/60">Amount</div>
                <div className="text-xl font-black text-white">R{cartTotal.toFixed(2)}</div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#E4F9EC] rounded-xl flex items-center gap-3 text-xs text-[#166534] font-semibold border border-[#22C55E]/30">
                <Sparkles className="w-5 h-5 text-[#22C55E] shrink-0" />
                <span>Simulated Secure 3D Yoco Payment Sandbox (ZAR {cartTotal.toFixed(2)})</span>
              </div>

              <div className="space-y-3">
                <div className="field">
                  <label>Card Number</label>
                  <input
                    type="text"
                    readOnly
                    value="•••• •••• •••• 4242"
                    className="font-mono bg-[#F7FAF7]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="field">
                    <label>Expiry Date</label>
                    <input type="text" readOnly value="12 / 28" className="bg-[#F7FAF7]" />
                  </div>
                  <div className="field">
                    <label>CVV</label>
                    <input type="password" readOnly value="•••" className="bg-[#F7FAF7]" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowYocoModal(false)}
                  className="btn btn-outline flex-1 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeOrderPlacement}
                  className="btn btn-primary flex-1 text-sm font-bold bg-[#00D4FF] hover:bg-[#00B4D8] text-[#0D1527]"
                >
                  Pay R{cartTotal.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
