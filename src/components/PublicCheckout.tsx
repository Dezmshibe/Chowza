import { useMemo, useState } from 'react';
import { ArrowLeft, LoaderCircle, ShoppingBag } from 'lucide-react';

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
  onPlaceOrder: (details: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    paymentMethod: 'cash' | 'online';
  }) => Promise<void>;
};

export function PublicCheckout({
  businessName,
  cart,
  onBack,
  onPlaceOrder,
}: PublicCheckoutProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'online'
  >('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, cartItem) =>
          sum + Number(cartItem.item.price) * cartItem.quantity,
        0,
      ),
    [cart],
  );

  const money = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!customerPhone.trim()) {
      setError('Please enter your phone or WhatsApp number.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await onPlaceOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
      });
    } catch (submitError) {
      console.error(submitError);
      setError('We could not place your order. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#166534]">
      <header className="border-b border-[#E1EAE3] bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#D7E2DA] p-2 hover:bg-[#F7FAF7]"
            aria-label="Back to cart"
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

      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#E1EAE3] bg-white p-6 shadow-sm"
          >
            <h1 className="text-2xl font-black">Your details</h1>

            <p className="mt-2 text-sm text-[#166534]">
              Enter your details so the business knows where to
              deliver your order.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800"
              >
                {error}
              </div>
            )}

            <div className="mt-6 space-y-5">
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
                  className="w-full rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 outline-none focus:border-[#166534]"
                />
              </div>

              <div>
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
                  rows={4}
                  autoComplete="street-address"
                  className="w-full resize-none rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 outline-none focus:border-[#166534]"
                />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-black">Payment method</h2>

              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#D7E2DA] p-4 hover:bg-[#fffaf5]">
                  <input
                    type="radio"
                    name="payment-method"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="mt-1"
                  />

                  <span>
                    <span className="block font-bold">Cash</span>
                    <span className="mt-1 block text-sm text-[#166534]">
Pay in cash when your order is delivered or collected.</span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#D7E2DA] p-4 hover:bg-[#fffaf5]">
                  <input
                    type="radio"
                    name="payment-method"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="mt-1"
                  />

                  <span>
                    <span className="block font-bold">
                      Online / Card
                    </span>
                    <span className="mt-1 block text-sm text-[#166534]">
                    Pay securely online with PayFast.
                      
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:bg-[#c9bdb2]"
            >
              {submitting && (
                <LoaderCircle size={19} className="animate-spin" />
              )}

              {submitting
                ? 'Placing order...'
                : `Place order · ${money(total)}`}
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-[#E1EAE3] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Order summary</h2>

            <div className="mt-5 space-y-4">
              {cart.map((cartItem) => (
                <div
                  key={cartItem.item.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="font-bold">
                      {cartItem.item.name}
                    </p>

                    <p className="text-sm text-[#166534]">
                      {cartItem.quantity} ×{' '}
                      {money(Number(cartItem.item.price))}
                    </p>
                  </div>

                  <p className="font-bold">
                    {money(
                      Number(cartItem.item.price) *
                        cartItem.quantity,
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-[#E1EAE3] pt-5">
              <div className="flex items-center justify-between">
                <span className="font-bold">Total</span>
                <span className="text-xl font-black">
                  {money(total)}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}