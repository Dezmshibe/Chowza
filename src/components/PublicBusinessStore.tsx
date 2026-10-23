import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PublicCheckout } from './PublicCheckout';
import { OrderConfirmation } from './OrderConfirmation';
import { useApp } from '../context/AppContext';

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  public_phone: string | null;
  whatsapp_number: string | null;
  public_address: string | null;
  is_published: boolean;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
};

type CartItem = {
  item: MenuItem;
  quantity: number;
};

type ConfirmationItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  line_total: number;
};

type ConfirmationOrder = {
  orderNumber: number;
  customerName: string;
  total: number;
  paymentMethod: 'cash' | 'eft' | 'online';
  items: ConfirmationItem[];
};

export function PublicBusinessStore({ slug }: { slug: string }) {
  const { setCurrentView } = useApp();  
  const [business, setBusiness] = useState<Business | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmationOrder, setConfirmationOrder] =
    useState<ConfirmationOrder | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStore() {
      setLoading(true);
      setError('');

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select(
          'id, name, slug, description, logo_url, public_phone, whatsapp_number, public_address, is_published',
        )
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (cancelled) return;

      if (businessError) {
        setError('We could not load this store. Please try again.');
        setLoading(false);
        return;
      }

      if (!businessData) {
        setBusiness(null);
        setItems([]);
        setError('This store does not exist or has not been published yet.');
        setLoading(false);
        return;
      }

      setBusiness(businessData as Business);

      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select(
          'id, name, description, price, image_url, is_available, sort_order',
        )
        .eq('business_id', businessData.id)
        .eq('is_available', true)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (menuError) {
        setError('The store loaded, but its menu could not be loaded.');
      } else {
        setItems((menuData ?? []) as MenuItem[]);
      }

      setLoading(false);
    }

    void loadStore();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const money = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);

  const whatsappNumber = (business?.whatsapp_number || '').replace(/\D/g, '');

  const cartCount = useMemo(
    () => cart.reduce((total, cartItem) => total + cartItem.quantity, 0),
    [cart],
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, cartItem) =>
          total + Number(cartItem.item.price) * cartItem.quantity,
        0,
      ),
    [cart],
  );

  function addToCart(item: MenuItem) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (cartItem) => cartItem.item.id === item.id,
      );

      if (existing) {
        return currentCart.map((cartItem) =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      }

      return [...currentCart, { item, quantity: 1 }];
    });
  }

  function changeQuantity(itemId: string, amount: number) {
    setCart((currentCart) =>
      currentCart
        .map((cartItem) =>
          cartItem.item.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity + amount }
            : cartItem,
        )
        .filter((cartItem) => cartItem.quantity > 0),
    );
  }

  if (confirmationOrder && business) {
    return (
      <OrderConfirmation
        businessName={business.name}
        orderNumber={confirmationOrder.orderNumber}
        customerName={confirmationOrder.customerName}
        total={confirmationOrder.total}
        paymentMethod={confirmationOrder.paymentMethod}
        items={confirmationOrder.items}
        onTrackOrder={() => {
  setCurrentView('track');
        }}
        onBackToStore={() => {
          setConfirmationOrder(null);
        }}
      />
    );
  }

  if (checkoutOpen && business) {
    return (
      <PublicCheckout
        businessName={business.name}
        cart={cart}
        onBack={() => setCheckoutOpen(false)}

       onPlaceOrder={async (details) => {
  const { data, error } = await supabase.functions.invoke(
    'create-order',
    {
      body: {
        businessId: business.id,
        customerName: details.customerName,
        customerPhone: details.customerPhone,
        deliveryAddress: details.deliveryAddress,
        paymentMethod: details.paymentMethod,
        cart: cart.map((cartItem) => ({
          itemId: cartItem.item.id,
          quantity: cartItem.quantity,
        })),
      },
    },
  );

  if (error) {
    throw new Error(
      error.message || 'Could not place your order.',
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.error || 'Could not place your order.',
    );
  }

  console.log('Order created:', data.order);

  /*
   * ONLINE / CARD PAYMENT
   *
   * The order has already been created using the
   * server-verified menu prices.
   *
   * The Yoco function will look up the real order
   * total from the database.
   */
  if (details.paymentMethod === 'online') {
    const {
      data: paymentData,
      error: paymentError,
    } = await supabase.functions.invoke(
      'yoco-checkout',
      {
        body: {
          orderNumber: Number(data.order.orderNumber),
        },
      },
    );

    if (paymentError) {
      throw new Error(
        paymentError.message ||
          'Could not start the online payment.',
      );
    }

    if (
      !paymentData?.success ||
      !paymentData?.redirectUrl
    ) {
      throw new Error(
        paymentData?.error ||
          'Could not start the online payment.',
      );
    }

    /*
     * Send the customer to Yoco's secure hosted
     * payment page.
     */
    window.location.assign(
      paymentData.redirectUrl,
    );

    return;
  }

  /*
   * CASH / EFT
   *
   * Keep the existing confirmation flow.
   */
  setConfirmationOrder({
    orderNumber: Number(data.order.orderNumber),
    customerName: details.customerName,
    total: Number(data.order.total),
    paymentMethod: details.paymentMethod,
    items: cart.map((cartItem) => ({
      id: cartItem.item.id,
      name: cartItem.item.name,
      price: Number(cartItem.item.price),
      quantity: cartItem.quantity,
      line_total:
        Number(cartItem.item.price) *
        cartItem.quantity,
    })),
  });
  setCart([]);
  setCheckoutOpen(false);
  setCartOpen(false);
}}
/>
);
}

  return (
    <div className="min-h-screen bg-[#f7efe5] text-[#2f160d]">
      <header className="sticky top-0 z-40 border-b border-[#e3d6c8] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="rounded-xl border border-[#d9c9b8] p-2 hover:bg-[#f7efe5]"
              aria-label="Back to Chowza"
            >
              <ArrowLeft size={19} />
            </button>

            <Store size={23} />

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#70452e]">
                Chowza
              </p>
              <p className="font-black">Local food, made easy</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 rounded-xl bg-[#2f160d] px-4 py-3 font-bold text-white"
          >
            <ShoppingCart size={19} />
            <span>Cart</span>

            {cartCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#25D366] px-1.5 text-xs font-black text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center gap-3">
          <LoaderCircle className="animate-spin" />
          <p>Loading store...</p>
        </div>
      ) : error && !business ? (
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
          <Store size={42} className="mx-auto mb-4 text-[#70452e]" />
          <h1 className="text-2xl font-black">Store unavailable</h1>
          <p className="mt-3 text-[#70452e]">{error}</p>
        </main>
      ) : business ? (
        <>
          <section className="bg-[#2f160d] text-white">
            <div className="mx-auto max-w-6xl px-5 py-12">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  className="mb-5 h-20 w-20 rounded-2xl bg-white object-contain p-2"
                />
              ) : (
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
                  <Store size={34} />
                </div>
              )}

              <h1 className="text-3xl font-black sm:text-5xl">
                {business.name}
              </h1>

              {business.description && (
                <p className="mt-3 max-w-2xl text-white/80">
                  {business.description}
                </p>
              )}

              {business.public_address && (
                <p className="mt-4 flex items-center gap-2 text-sm text-white/80">
                  <MapPin size={17} />
                  {business.public_address}
                </p>
              )}

              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 font-bold text-white"
                >
                  <MessageCircle size={18} />
                  Contact on WhatsApp
                </a>
              )}
            </div>
          </section>

          <main className="mx-auto max-w-6xl px-5 py-10">
            <div className="mb-6">
              <h2 className="text-2xl font-black">Our menu</h2>
              <p className="mt-1 text-sm text-[#70452e]">
                Browse the items currently available from this store.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </p>
            )}

            {items.length === 0 ? (
              <div className="rounded-2xl border border-[#e3d6c8] bg-white p-8 text-center">
                <p className="font-bold">No available menu items yet.</p>
                <p className="mt-2 text-sm text-[#70452e]">
                  Please check back later.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const cartItem = cart.find(
                    (entry) => entry.item.id === item.id,
                  );

                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-[#e3d6c8] bg-white shadow-sm"
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-48 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-[#efe3d5]">
                          <Store size={32} className="text-[#70452e]" />
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-black">{item.name}</h3>

                          <span className="shrink-0 font-black text-[#70452e]">
                            {money(Number(item.price))}
                          </span>
                        </div>

                        {item.description && (
                          <p className="mt-2 text-sm text-[#70452e]">
                            {item.description}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f160d] px-4 py-3 font-bold text-white hover:bg-[#452115]"
                        >
                          <Plus size={18} />
                          {cartItem
                            ? `Add another (${cartItem.quantity})`
                            : 'Add to cart'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </>
      ) : null}

      <footer className="border-t border-[#e3d6c8] bg-white px-5 py-6 text-center text-sm text-[#70452e]">
        Powered by Chowza
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e3d6c8] px-5 py-4">
              <div>
                <h2 className="text-xl font-black">Your cart</h2>
                <p className="text-sm text-[#70452e]">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-xl p-2 hover:bg-[#f7efe5]"
                aria-label="Close cart"
              >
                <X size={22} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <ShoppingCart size={45} className="text-[#70452e]" />
                <h3 className="mt-4 text-lg font-black">Your cart is empty</h3>
                <p className="mt-2 text-sm text-[#70452e]">
                  Add something delicious from the menu.
                </p>

                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-5 rounded-xl bg-[#2f160d] px-5 py-3 font-bold text-white"
                >
                  Browse menu
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-4">
                    {cart.map((cartItem) => (
                      <div
                        key={cartItem.item.id}
                        className="rounded-2xl border border-[#e3d6c8] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black">
                              {cartItem.item.name}
                            </h3>
                            <p className="mt-1 text-sm text-[#70452e]">
                              {money(Number(cartItem.item.price))} each
                            </p>
                          </div>

                          <p className="font-black">
                            {money(
                              Number(cartItem.item.price) *
                                cartItem.quantity,
                            )}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-xl bg-[#f7efe5] p-1">
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(cartItem.item.id, -1)
                              }
                              className="rounded-lg p-2 hover:bg-white"
                              aria-label={`Remove one ${cartItem.item.name}`}
                            >
                              <Minus size={16} />
                            </button>

                            <span className="w-8 text-center font-black">
                              {cartItem.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(cartItem.item.id, 1)
                              }
                              className="rounded-lg p-2 hover:bg-white"
                              aria-label={`Add one ${cartItem.item.name}`}
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(
                                cartItem.item.id,
                                -cartItem.quantity,
                              )
                            }
                            className="text-sm font-bold text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#e3d6c8] bg-[#fffaf5] px-5 py-5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-black">
                      {money(cartTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                    className="mt-4 w-full rounded-xl bg-[#2f160d] px-5 py-3 font-black text-white hover:bg-[#452115]"
                  >
                    Checkout
                  </button>

                  <p className="mt-3 text-center text-xs text-[#70452e]">
                    Continue to checkout to place your order.
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}