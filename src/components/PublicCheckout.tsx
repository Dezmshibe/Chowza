
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  LoaderCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Tag,
  Truck,
  Store,
} from 'lucide-react';

type CheckoutCartItem = {
  item: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
};

type FulfillmentType = 'delivery' | 'pickup';

type PublicCheckoutProps = {
  businessName: string;
  cart: CheckoutCartItem[];
  deliveryFee: number;
  onBack: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (details: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    customerNote: string;
    promoCode: string;
    fulfillmentType: FulfillmentType;
    paymentMethod: 'cash' | 'online';
  }) => Promise<void>;
};

export function PublicCheckout({
  businessName,
  cart,
  deliveryFee,
  onBack,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPlaceOrder,
}: PublicCheckoutProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'online'
  >('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, cartItem) =>
          sum +
          Number(cartItem.item.price) * cartItem.quantity,
        0,
      ),
    [cart],
  );

  const calculatedDeliveryFee =
    fulfillmentType === 'delivery' ? deliveryFee : 0;

  const estimatedTotal = subtotal + calculatedDeliveryFee;

  const money = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!customerPhone.trim()) {
      setError('Please enter your phone or WhatsApp number.');
      return;
    }

    if (
      fulfillmentType === 'delivery' &&
      !deliveryAddress.trim()
    ) {
      setError('Please enter your delivery address.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await onPlaceOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress:
          fulfillmentType === 'delivery'
            ? deliveryAddress.trim()
            : '',
        customerNote: customerNote.trim(),
        promoCode: promoCode.trim(),
        fulfillmentType,
        paymentMethod,
      });
    } catch (submitError) {
      

      const message =
        submitError instanceof Error
          ? submitError.message
          : 'We could not place your order. Please try again.';

      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#17201A]">
      <header className="sticky top-0 z-40 border-b border-[#E1EAE3] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#D7E2DA] p-2 hover:bg-[#F7FAF7]"
            aria-label="Back to store"
          >
            <ArrowLeft size={19} />
          </button>

          <ShoppingBag size={23} />

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#166534]">
              Checkout
            </p>
            <p className="font-black">{businessName}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-7">
          <h1 className="text-2xl font-black sm:text-3xl">
            Complete your order
          </h1>
          <p className="mt-2 text-sm text-[#647067]">
            Confirm your items, delivery preference and payment details.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#E1EAE3] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">
                      Your order
                    </h2>
                    <p className="mt-1 text-sm text-[#647067]">
                      {cart.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                      )}{' '}
                      items in your cart
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-sm font-bold text-red-700 hover:underline"
                  >
                    Clear cart
                  </button>
                </div>

                {cart.length === 0 ? (
                  <p className="mt-6 rounded-xl bg-[#F7FAF7] p-5 text-center text-sm text-[#647067]">
                    Your cart is empty.
                  </p>
                ) : (
                  <div className="mt-5 divide-y divide-[#E8EEE9]">
                    {cart.map((cartItem) => (
                      <div
                        key={cartItem.item.id}
                        className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">
                            {cartItem.item.name}
                          </p>
                          <p className="mt-1 text-sm text-[#647067]">
                            {money(Number(cartItem.item.price))} each
                          </p>
                          <p className="mt-1 font-black text-[#166534]">
                            {money(
                              Number(cartItem.item.price) *
                                cartItem.quantity,
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 rounded-xl border border-[#E1EAE3] p-1">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(
                                cartItem.item.id,
                                cartItem.quantity - 1,
                              )
                            }
                            disabled={submitting}
                            aria-label={`Decrease ${cartItem.item.name} quantity`}
                            className="rounded-lg p-2 hover:bg-[#F0FDF4] disabled:opacity-50"
                          >
                            <Minus size={15} />
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
                            disabled={submitting}
                            aria-label={`Increase ${cartItem.item.name} quantity`}
                            className="rounded-lg p-2 hover:bg-[#F0FDF4] disabled:opacity-50"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onRemoveItem(cartItem.item.id)
                          }
                          disabled={submitting}
                          aria-label={`Remove ${cartItem.item.name}`}
                          className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[#E1EAE3] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-black">
                  How would you like your order?
                </h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      fulfillmentType === 'delivery'
                        ? 'border-[#166534] bg-[#F0FDF4]'
                        : 'border-[#D7E2DA] hover:bg-[#F7FAF7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      value="delivery"
                      checked={fulfillmentType === 'delivery'}
                      onChange={() => setFulfillmentType('delivery')}
                      className="mt-1 accent-[#166534]"
                    />
                    <Truck size={20} className="mt-0.5 text-[#166534]" />
                    <span>
                      <span className="block font-bold">Delivery</span>
                      <span className="mt-1 block text-xs text-[#647067]">
                        Have your order delivered to you.
                      </span>
                    </span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      fulfillmentType === 'pickup'
                        ? 'border-[#166534] bg-[#F0FDF4]'
                        : 'border-[#D7E2DA] hover:bg-[#F7FAF7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      value="pickup"
                      checked={fulfillmentType === 'pickup'}
                      onChange={() => setFulfillmentType('pickup')}
                      className="mt-1 accent-[#166534]"
                    />
                    <Store size={20} className="mt-0.5 text-[#166534]" />
                    <span>
                      <span className="block font-bold">Pickup</span>
                      <span className="mt-1 block text-xs text-[#647067]">
                        Collect your order from the business.
                      </span>
                    </span>
                  </label>
                </div>

                {fulfillmentType === 'delivery' && (
                  <div className="mt-5">
                    <label
                      htmlFor="delivery-address"
                      className="mb-2 block text-sm font-bold"
                    >
                      Delivery address
                    </label>
                    <textarea
                      id="delivery-address"
                      value={deliveryAddress}
                      onChange={(event) =>
                        setDeliveryAddress(event.target.value)
                      }
                      placeholder="Street, area, suburb, city"
                      rows={3}
                      autoComplete="street-address"
                      maxLength={500}
                      required
                      className="w-full resize-none rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 outline-none focus:border-[#166534]"
                    />
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[#E1EAE3] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-black">
                  Your details
                </h2>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="mb-2 block text-sm font-bold"
                    >
                      Full name
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      value={customerName}
                      onChange={(event) =>
                        setCustomerName(event.target.value)
                      }
                      placeholder="e.g. John Mokoena"
                      autoComplete="name"
                      maxLength={150}
                      required
                      className="w-full rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 outline-none focus:border-[#166534]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="mb-2 block text-sm font-bold"
                    >
                      Phone / WhatsApp number
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(event) =>
                        setCustomerPhone(event.target.value)
                      }
                      placeholder="e.g. 082 123 4567"
                      autoComplete="tel"
                      maxLength={40}
                      required
                      className="w-full rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 outline-none focus:border-[#166534]"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="customer-note"
                    className="mb-2 block text-sm font-bold"
                  >
                    Kitchen notes <span className="font-normal text-[#647067]">(optional)</span>
                  </label>
                  <textarea
                    id="customer-note"
                    value={customerNote}
                    onChange={(event) =>
                      setCustomerNote(event.target.value)
                    }
                    placeholder="Any special instructions for the kitchen?"
                    rows={3}
                    maxLength={1000}
                    className="w-full resize-none rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 outline-none focus:border-[#166534]"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-[#E1EAE3] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-2">
                  <Tag size={19} className="text-[#166534]" />
                  <h2 className="text-lg font-black">
                    Promotion code
                  </h2>
                </div>

                <p className="mt-1 text-sm text-[#647067]">
                  Enter a promotion code from this business.
                </p>

                <input
                  type="text"
                  value={promoCode}
                  onChange={(event) =>
                    setPromoCode(
                      event.target.value.toUpperCase().replace(/\s/g, ''),
                    )
                  }
                  placeholder="Enter promo code"
                  maxLength={30}
                  autoCapitalize="characters"
                  className="mt-4 w-full rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 uppercase outline-none focus:border-[#166534]"
                />

                <p className="mt-2 text-xs text-[#647067]">
                  Your code will be checked when you place the order. Any approved discount will be included in your final total.
                </p>
              </section>

              <section className="rounded-2xl border border-[#E1EAE3] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-black">
                  Payment method
                </h2>

                <div className="mt-4 space-y-3">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                      paymentMethod === 'cash'
                        ? 'border-[#166534] bg-[#F0FDF4]'
                        : 'border-[#D7E2DA] hover:bg-[#F7FAF7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="mt-1 accent-[#166534]"
                    />
                    <span>
                      <span className="block font-bold">Cash</span>
                      <span className="mt-1 block text-sm text-[#647067]">
                        Pay in cash when your order is delivered or collected.
                      </span>
                    </span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                      paymentMethod === 'online'
                        ? 'border-[#166534] bg-[#F0FDF4]'
                        : 'border-[#D7E2DA] hover:bg-[#F7FAF7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="mt-1 accent-[#166534]"
                    />
                    <span>
                      <span className="block font-bold">Online / Card</span>
                      <span className="mt-1 block text-sm text-[#647067]">
                        Pay securely with PayFast.
                      </span>
                    </span>
                  </label>
                </div>
              </section>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
                >
                  {error}
                </div>
              )}
            </div>

            <aside className="h-fit rounded-2xl border border-[#E1EAE3] bg-white p-5 shadow-sm lg:sticky lg:top-24 sm:p-6">
              <h2 className="text-xl font-black">
                Order summary
              </h2>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-[#647067]">Subtotal</span>
                  <span className="font-bold">{money(subtotal)}</span>
                </div>

                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-[#647067]">
                    {fulfillmentType === 'delivery'
                      ? 'Delivery fee'
                      : 'Pickup'}
                  </span>
                  <span className="font-bold">
                    {fulfillmentType === 'delivery'
                      ? money(calculatedDeliveryFee)
                      : 'Free'}
                  </span>
                </div>

                {promoCode && (
                  <div className="rounded-xl bg-[#F0FDF4] p-3 text-xs text-[#166534]">
                    Promotion code <strong>{promoCode}</strong> will be validated when you place your order.
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-[#E1EAE3] pt-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">Estimated total</span>
                  <span className="text-2xl font-black">
                    {money(estimatedTotal)}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-[#647067]">
                  The final total may change if your promotion code is accepted. The confirmed total will be used for your order and PayFast payment.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#15803D] px-5 py-4 font-black text-white transition hover:bg-[#166534] disabled:cursor-not-allowed disabled:bg-[#9CA3AF]"
              >
                {submitting && (
                  <LoaderCircle size={19} className="animate-spin" />
                )}
                {submitting
                  ? 'Placing order...'
                  : 'Place order'}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="mt-3 w-full rounded-xl border border-[#D7E2DA] px-5 py-3 text-sm font-bold hover:bg-[#F7FAF7] disabled:opacity-50"
              >
                Continue shopping
              </button>

              <p className="mt-4 text-center text-xs text-[#647067]">
                Secure checkout powered by Chowza.
              </p>
            </aside>
          </div>
        </form>
      </main>
    </div>
  );
}
