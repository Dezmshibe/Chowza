import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  Check,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';

type CheckoutCartItem = {
  item: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
};

type PublicCheckoutProps = {
  businessName: string;
  cart: CheckoutCartItem[];
  onBack: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (details: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    fulfillmentType: 'Delivery' | 'Pickup';
    paymentMethod: 'cash' | 'online';
  }) => Promise<void>;
};

const DELIVERY_FEE = 25;

export function PublicCheckout({
  businessName,
  cart,
  onBack,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPlaceOrder,
}: PublicCheckoutProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [fulfillmentType, setFulfillmentType] =
    useState<'Delivery' | 'Pickup'>('Delivery');
  const [paymentMethod, setPaymentMethod] =
    useState<'cash' | 'online'>('cash');
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [kitchenNote, setKitchenNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, cartItem) =>
          sum + Number(cartItem.item.price) * cartItem.quantity,
        0,
      ),
    [cart],
  );

  const deliveryFee = fulfillmentType === 'Delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const money = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!customerPhone.trim()) {
      setError('Please enter your phone or WhatsApp number.');
      return;
    }

    if (fulfillmentType === 'Delivery' && !deliveryAddress.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setSubmitting(true);

    try {
      await onPlaceOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress:
          fulfillmentType === 'Delivery'
            ? deliveryAddress.trim()
            : 'Pickup / Collection',
        fulfillmentType,
        paymentMethod,
      });
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'We could not place your order. Please try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1712] text-[#17201A]">
      <div className="min-h-screen bg-black/45 px-3 py-3 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-[760px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
          <header className="flex items-start justify-between px-5 pb-3 pt-4 sm:px-7">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF3] text-[#16A34A]">
                <ShoppingBag size={19} />
              </div>
              <div>
                <h1 className="text-[22px] font-black leading-6 text-[#17201A]">
                  Your Order
                </h1>
                <p className="mt-0.5 text-xs font-semibold text-[#647067]">
                  Ordering from <span className="font-black text-[#17201A]">{businessName}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E1EAE3] bg-[#F8FAF8] text-[#17201A] transition hover:bg-[#EEF3EF]"
              aria-label="Close checkout"
            >
              <X size={20} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="px-5 pb-6 sm:px-7">
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
              >
                {error}
              </div>
            )}

            <section className="rounded-[22px] border border-[#E5E9E5] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#EDF0ED] px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#647067]">
                  Cart Items ({cart.reduce((n, item) => n + item.quantity, 0)})
                </p>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-sm font-semibold text-[#EF4444] hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="divide-y divide-[#EDF0ED]">
                {cart.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#17201A]">
                        {cartItem.item.name}
                      </p>
                      <p className="mt-1 text-xs text-[#647067]">
                        {money(Number(cartItem.item.price))} each
                        <span className="mx-1">•</span>
                        <span className="font-black text-[#15803D]">
                          {money(Number(cartItem.item.price) * cartItem.quantity)}
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex h-9 items-center rounded-full border border-[#E1EAE3] bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              cartItem.item.id,
                              Math.max(0, cartItem.quantity - 1),
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center text-[#17201A]"
                          aria-label={`Decrease ${cartItem.item.name}`}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-7 text-center text-sm font-black">
                          {cartItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              cartItem.item.id,
                              cartItem.quantity + 1,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center text-[#17201A]"
                          aria-label={`Increase ${cartItem.item.name}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(cartItem.item.id)}
                        className="rounded-lg p-1 text-[#7B857D] hover:bg-[#F7FAF7] hover:text-[#EF4444]"
                        aria-label={`Remove ${cartItem.item.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-black">
                Fulfillment Type
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('Delivery')}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition ${
                    fulfillmentType === 'Delivery'
                      ? 'border-[#0F1712] bg-[#0F1712] text-white'
                      : 'border-[#DDE4DE] bg-white text-[#17201A]'
                  }`}
                >
                  <Truck size={17} />
                  Delivery (+R25)
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType('Pickup')}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition ${
                    fulfillmentType === 'Pickup'
                      ? 'border-[#0F1712] bg-[#0F1712] text-white'
                      : 'border-[#DDE4DE] bg-white text-[#17201A]'
                  }`}
                >
                  <ShoppingBag size={17} />
                  Pickup / Collection (Free)
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="customer-name" className="mb-2 block text-xs font-black">
                  Full Name *
                </label>
                <input
                  id="customer-name"
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className="h-12 w-full rounded-xl border border-[#D7E2DA] px-3 text-sm outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#DCFCE7]"
                />
              </div>

              <div>
                <label htmlFor="customer-phone" className="mb-2 block text-xs font-black">
                  WhatsApp / Phone *
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="082 123 4567"
                  autoComplete="tel"
                  className="h-12 w-full rounded-xl border border-[#D7E2DA] px-3 text-sm outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#DCFCE7]"
                />
              </div>
            </div>

            {fulfillmentType === 'Delivery' && (
              <div className="mt-5">
                <label htmlFor="delivery-address" className="mb-2 block text-xs font-black">
                  Delivery Address *
                </label>
                <input
                  id="delivery-address"
                  type="text"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="Street, suburb, area"
                  autoComplete="street-address"
                  className="h-12 w-full rounded-xl border border-[#D7E2DA] px-3 text-sm outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#DCFCE7]"
                />
                <p className="mt-1.5 text-xs text-[#7B857D]">
                  Delivery fee: R25
                </p>
              </div>
            )}

            <div className="mt-6">
              <label htmlFor="kitchen-note" className="mb-2 block text-xs font-black">
                Kitchen Notes <span className="font-semibold text-[#7B857D]">(Optional)</span>
              </label>
              <textarea
                id="kitchen-note"
                value={kitchenNote}
                onChange={(event) => setKitchenNote(event.target.value)}
                placeholder="Any special instructions for the kitchen"
                rows={3}
                className="w-full resize-none rounded-xl border border-[#D7E2DA] px-3 py-3 text-sm outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#DCFCE7]"
              />
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-xs font-black">
                Promotion Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(event) => setPromoInput(event.target.value)}
                  placeholder="Enter promo code"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-[#D7E2DA] px-3 text-sm outline-none focus:border-[#166534]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPromoMessage(
                      promoInput.trim()
                        ? 'Promotion codes will be applied when enabled for this store.'
                        : 'Enter a promotion code first.',
                    )
                  }
                  className="h-12 rounded-xl border border-[#D7E2DA] bg-white px-5 text-sm font-black hover:bg-[#F7FAF7]"
                >
                  Apply
                </button>
              </div>
              {promoMessage && (
                <p className="mt-1.5 text-xs font-semibold text-[#647067]">
                  {promoMessage}
                </p>
              )}
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-black">Payment Method</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex min-h-[74px] items-start gap-3 rounded-[20px] border px-4 py-3 text-left transition ${
                    paymentMethod === 'cash'
                      ? 'border-[#86E2A7] bg-[#F0FDF4]'
                      : 'border-[#E1EAE3] bg-white'
                  }`}
                >
                  <Banknote
                    size={20}
                    className="mt-0.5 shrink-0 text-[#16A34A]"
                  />
                  <span>
                    <span className="block text-sm font-black">Cash on {fulfillmentType === 'Delivery' ? 'Delivery' : 'Pickup'}</span>
                    <span className="mt-1 block text-xs text-[#647067]">
                      Pay in person
                    </span>
                  </span>
                  {paymentMethod === 'cash' && (
                    <Check size={17} className="ml-auto mt-0.5 text-[#16A34A]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`flex min-h-[74px] items-start gap-3 rounded-[20px] border px-4 py-3 text-left transition ${
                    paymentMethod === 'online'
                      ? 'border-[#86E2A7] bg-[#F0FDF4]'
                      : 'border-[#E1EAE3] bg-white'
                  }`}
                >
                  <CreditCard
                    size={20}
                    className="mt-0.5 shrink-0 text-[#0284C7]"
                  />
                  <span>
                    <span className="block text-sm font-black">Online Payment</span>
                    <span className="mt-1 block text-xs text-[#647067]">
                      Pay securely with Yoco
                    </span>
                  </span>
                  {paymentMethod === 'online' && (
                    <Check size={17} className="ml-auto mt-0.5 text-[#16A34A]" />
                  )}
                </button>
              </div>
            </div>

            <section className="mt-5 rounded-[22px] border border-[#E5E9E5] bg-white p-5 shadow-sm">
              <div className="flex justify-between text-sm text-[#647067]">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-[#647067]">
                <span>Delivery Fee</span>
                <span>{deliveryFee ? money(deliveryFee) : 'FREE'}</span>
              </div>
              <div className="my-3 border-t border-[#E5E9E5]" />
              <div className="flex items-center justify-between">
                <span className="text-base font-black">Total Due</span>
                <span className="text-2xl font-black text-[#15803D]">
                  {money(total)}
                </span>
              </div>
            </section>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#15803D] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Processing...' : `Place Order · ${money(total)}`}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-[#647067] hover:text-[#17201A]"
            >
              <ArrowLeft size={16} />
              Back to menu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
