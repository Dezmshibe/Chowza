
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LoaderCircle,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

type Order = {
  id: string;
  order_number: number | string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  customer_note: string | null;
  fulfillment_type: string | null;
  items: unknown;
  subtotal: number | null;
  delivery_fee: number | null;
  discount_amount: number | null;
  total: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: string | null;
  payment_completed_at: string | null;
  created_at: string;
};

type Props = {
  businessId: string;
  businessName: string;
  onBack: () => void;
};

type Filter = 'all' | 'new' | 'active' | 'completed';

const statuses: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const currency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(Number.isFinite(amount) ? amount : 0);

function formatItems(items: unknown): string[] {
  if (!Array.isArray(items)) return ['Order items unavailable'];

  return items
    .map((item: unknown) => {
      if (!item || typeof item !== 'object') return '';

      const row = item as Record<string, unknown>;
      const name = String(row.name ?? row.product_name ?? 'Item');
      const quantity = Number(row.quantity ?? row.qty ?? 1);
      const price = Number(row.price ?? 0);

      return `${name} × ${quantity}${
        price > 0 ? ` · ${currency(price)}` : ''
      }`;
    })
    .filter(Boolean);
}

function paymentLabel(order: Order) {
  const method = (order.payment_method || 'not specified').replaceAll(
    '_',
    ' ',
  );
  const status = (order.payment_status || '').toLowerCase();

  if (status === 'paid' || order.payment_completed_at) {
    return `${method} · Paid`;
  }

  if (status === 'failed') return `${method} · Failed`;

  if (status === 'pending' || status === 'unpaid') {
    return `${method} · Awaiting payment`;
  }

  if (method.toLowerCase() === 'cash') {
    return 'Cash · Pay in person';
  }

  return method;
}

function paymentTone(order: Order) {
  const status = (order.payment_status || '').toLowerCase();

  if (status === 'paid' || order.payment_completed_at) {
    return 'bg-green-100 text-green-800';
  }

  if (status === 'failed') {
    return 'bg-red-100 text-red-800';
  }

  return 'bg-amber-100 text-amber-800';
}

function isActive(status: OrderStatus) {
  return !['completed', 'cancelled'].includes(status);
}

export function BusinessOrdersManager({
  businessId,
  businessName,
  onBack,
}: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<string[]>([]);

  const knownOrderIds = useRef<Set<string>>(new Set());
  const hasLoadedOrders = useRef(false);

  // Load orders belonging to this business.
  const loadOrders = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);

      setError('');

      const { data, error: loadError } = await supabase
        .from('orders')
        .select(
          'id, order_number, customer_name, customer_phone, delivery_address, customer_note, fulfillment_type, items, subtotal, delivery_fee, discount_amount, total, status, payment_method, payment_status, payment_completed_at, created_at',
        )
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (loadError) {
        console.error('[Chowza Business] Order loading failed:', loadError);

        setError(
          'We could not load your orders. Check your connection and business access, then try again.',
        );

        if (!quiet) setLoading(false);
        return;
      }

      const incoming = (data ?? []) as Order[];

      const justArrived = incoming
        .filter(
          (order) =>
            !knownOrderIds.current.has(order.id) &&
            hasLoadedOrders.current,
        )
        .map((order) => order.id);

      if (justArrived.length > 0) {
        setNewOrderIds((ids) =>
          [...new Set([...justArrived, ...ids])],
        );

        setNotice(
          `${justArrived.length} new order${
            justArrived.length === 1 ? '' : 's'
          } received.`,
        );
      }

      knownOrderIds.current = new Set(
        incoming.map((order) => order.id),
      );

      hasLoadedOrders.current = true;

      setOrders(incoming);
      setLastUpdated(new Date());
      setLoading(false);
    },
    [businessId],
  );

  // Realtime updates with a polling fallback.
  useEffect(() => {
    void loadOrders();

    const channel = supabase
      .channel(`business-orders-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          void loadOrders(true);
        },
      )
      .subscribe();

    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadOrders(true);
      }
    }, 30000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadOrders(true);
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      void supabase.removeChannel(channel);
    };
  }, [businessId, loadOrders]);

  // Order summary counts.
  const counts = useMemo(() => {
    const newOrders = orders.filter(
      (order) => order.status === 'pending',
    );

    const activeOrders = orders.filter(
      (order) =>
        isActive(order.status) && order.status !== 'pending',
    );

    const completedOrders = orders.filter(
      (order) => order.status === 'completed',
    );

    return {
      new: newOrders.length,
      active: activeOrders.length,
      completed: completedOrders.length,
    };
  }, [orders]);

  // Filter the orders displayed on screen.
  const visibleOrders = useMemo(() => {
    switch (filter) {
      case 'new':
        return orders.filter(
          (order) => order.status === 'pending',
        );

      case 'active':
        return orders.filter(
          (order) =>
            isActive(order.status) && order.status !== 'pending',
        );

      case 'completed':
        return orders.filter(
          (order) => order.status === 'completed',
        );

      default:
        return orders;
    }
  }, [orders, filter]);

  // Update an order through the secure Supabase Edge Function.
  async function updateStatus(
    order: Order,
    status: OrderStatus,
  ) {
    if (order.status === status || updatingId) return;

    const previousStatus = order.status;

    setUpdatingId(order.id);
    setError('');
    setNotice('');

    try {
      const { data, error: updateError } =
        await supabase.functions.invoke(
          'update-order-status',
          {
            body: {
              orderId: order.id,
              status,
            },
          },
        );

      if (updateError || !data?.success) {
        console.error(
          '[Chowza Business] Status update failed:',
          updateError || data,
        );

        setError(
          data?.error ||
            updateError?.message ||
            'The order status could not be saved. Please try again.',
        );

        return;
      }

      // Update the displayed order after the server confirms success.
      setOrders((current) =>
        current.map((entry) =>
          entry.id === order.id
            ? { ...entry, status }
            : entry,
        ),
      );

      setNewOrderIds((ids) =>
        ids.filter((id) => id !== order.id),
      );

      const statusLabel =
        statuses
          .find((item) => item.value === status)
          ?.label.toLowerCase() || status;

      const notificationSent = Number(
        data.notificationSent ?? 0,
      );

      if (data.notificationError) {
        setNotice(
          `Order #${order.order_number} updated to ${statusLabel}, but the customer notification could not be sent.`,
        );
      } else if (notificationSent > 0) {
        setNotice(
          `Order #${order.order_number} marked as ${statusLabel}. Customer notifications sent: ${notificationSent}.`,
        );
      } else {
        setNotice(
          `Order #${order.order_number} marked as ${statusLabel}. No active customer notification devices were found.`,
        );
      }
    } catch (updateError) {
      console.error(
        '[Chowza Business] Status update error:',
        updateError,
      );

      // Keep the original status visible if the request failed.
      setOrders((current) =>
        current.map((entry) =>
          entry.id === order.id
            ? { ...entry, status: previousStatus }
            : entry,
        ),
      );

      setError(
        'Something went wrong while updating the order. Please try again.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#17201A]">
      <header className="border-b border-[#E1EAE3] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to dashboard"
            className="rounded-xl border border-[#D7E2DA] p-2 text-[#166534] hover:bg-[#F7FAF7]"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#15803D]">
              Chowza for Business
            </p>

            <h1 className="text-xl font-black sm:text-2xl">
              Order Management
            </h1>

            <p className="truncate text-sm text-[#647067]">
              {businessName}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D7E2DA] px-3 py-2 text-sm font-bold text-[#166534] hover:bg-[#F7FAF7] disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}

            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">
              Your orders
            </h2>

            <p className="mt-1 text-sm text-[#647067]">
              New orders sync automatically. Keep each customer updated as you prepare their food.
            </p>
          </div>

          <p className="text-xs text-[#7A857D]" aria-live="polite">
            {lastUpdated
              ? `Last checked ${lastUpdated.toLocaleTimeString(
                  'en-ZA',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )}`
              : 'Connecting to orders…'}
          </p>
        </div>

        {/* Order summary */}
        <section
          className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3"
          aria-label="Order summary"
        >
          <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-[#92400E]">
              New orders
              <Bell size={17} />
            </div>

            <p className="mt-2 text-3xl font-black text-[#78350F]">
              {counts.new}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D7E2DA] bg-white p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-[#166534]">
              In progress
              <Clock3 size={17} />
            </div>

            <p className="mt-2 text-3xl font-black">
              {counts.active}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D7E2DA] bg-white p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-[#166534]">
              Completed
              <CheckCircle2 size={17} />
            </div>

            <p className="mt-2 text-3xl font-black">
              {counts.completed}
            </p>
          </div>
        </section>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}

            <button
              type="button"
              onClick={() => void loadOrders()}
              className="ml-2 font-bold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Success message */}
        {notice && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {notice}
          </div>
        )}

        {/* Order filters */}
        <div
          className="mb-4 flex gap-2 overflow-x-auto pb-1"
          aria-label="Filter orders"
        >
          {(
            [
              ['all', `All (${orders.length})`],
              ['new', `New (${counts.new})`],
              ['active', `In progress (${counts.active})`],
              ['completed', `Completed (${counts.completed})`],
            ] as [Filter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                filter === value
                  ? 'bg-[#15803D] text-white'
                  : 'border border-[#D7E2DA] bg-white text-[#166534] hover:bg-[#F0FDF4]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-12 text-sm text-[#166534]">
            <LoaderCircle
              size={20}
              className="animate-spin"
            />
            Loading orders…
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#B8C9BC] bg-white p-10 text-center">
            <ClipboardList
              size={36}
              className="mx-auto mb-3 text-[#15803D]"
            />

            <h3 className="text-lg font-black">
              {orders.length === 0
                ? 'No orders yet'
                : 'No orders in this filter'}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647067]">
              {orders.length === 0
                ? 'New customer orders will appear here automatically. Keep this page open while your store is accepting orders.'
                : 'Try another filter to see more of your orders.'}
            </p>

            {orders.length === 0 && (
              <button
                type="button"
                onClick={() => void loadOrders()}
                className="mt-4 rounded-xl bg-[#15803D] px-4 py-2.5 text-sm font-bold text-white"
              >
                Check for orders
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => {
              const items = formatItems(order.items);

              const isNew =
                newOrderIds.includes(order.id) ||
                order.status === 'pending';

              return (
                <article
                  key={order.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
                    isNew
                      ? 'border-[#F3D37A]'
                      : 'border-[#D7E2DA]'
                  }`}
                >
                  {/* Customer and order details */}
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#647067]">
                          Order #{order.order_number}
                        </p>

                        {isNew && (
                          <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-extrabold uppercase text-[#92400E]">
                            New
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1 text-lg font-black">
                        {order.customer_name}
                      </h3>

                      <a
                        href={`tel:${order.customer_phone}`}
                        className="text-sm font-medium text-[#166534] underline-offset-2 hover:underline"
                      >
                        {order.customer_phone}
                      </a>

                      <p className="mt-1 text-xs text-[#7A857D]">
                        {new Date(order.created_at).toLocaleString(
                          'en-ZA',
                        )}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-2xl font-black">
                        {currency(Number(order.total))}
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${paymentTone(
                          order,
                        )}`}
                      >
                        {paymentLabel(order)}
                      </span>
                    </div>
                  </div>

                  {/* Items and delivery details */}
                  <div className="mt-4 grid gap-4 rounded-xl bg-[#F7FAF7] p-4 sm:grid-cols-[1fr_auto]">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#647067]">
                        Order items
                      </p>

                      <ul className="space-y-1 text-sm leading-6">
                        {items.map((item, index) => (
                          <li key={`${order.id}-${index}`}>
                            {item}
                          </li>
                        ))}
                      </ul>

                      {order.customer_note && (
                        <div className="mt-3 rounded-lg border border-[#D7E2DA] bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#647067]">
                            Customer note
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm">
                            {order.customer_note}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-sm sm:min-w-44 sm:text-right">
                      <p className="inline-flex items-center gap-1.5 text-[#647067] sm:justify-end">
                        {order.fulfillment_type === 'pickup' ? (
                          <PackageCheck size={15} />
                        ) : (
                          <Truck size={15} />
                        )}

                        {order.fulfillment_type === 'pickup'
                          ? 'Collection'
                          : 'Delivery'}
                      </p>

                      {order.delivery_address &&
                        order.fulfillment_type !== 'pickup' && (
                          <p className="mt-2 inline-flex items-start gap-1.5 text-left text-[#344238] sm:justify-end">
                            <MapPin
                              size={15}
                              className="mt-0.5 shrink-0"
                            />

                            <span>{order.delivery_address}</span>
                          </p>
                        )}

                      <div className="mt-3 space-y-1 border-t border-[#D7E2DA] pt-3 text-xs text-[#647067]">
                        {order.subtotal != null && (
                          <p>
                            Subtotal:{' '}
                            {currency(Number(order.subtotal))}
                          </p>
                        )}

                        {Number(order.discount_amount) > 0 && (
                          <p>
                            Discount: −
                            {currency(Number(order.discount_amount))}
                          </p>
                        )}

                        {order.delivery_fee != null && (
                          <p>
                            Delivery:{' '}
                            {currency(Number(order.delivery_fee))}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status update */}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label
                      htmlFor={`status-${order.id}`}
                      className="text-sm font-bold text-[#344238]"
                    >
                      Update order status
                    </label>

                    <select
                      id={`status-${order.id}`}
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(event) =>
                        void updateStatus(
                          order,
                          event.target.value as OrderStatus,
                        )
                      }
                      className="w-full rounded-xl border border-[#D7E2DA] bg-white px-3 py-3 text-sm font-semibold text-[#17201A] outline-none focus:border-[#22C55E] disabled:opacity-50 sm:w-64"
                    >
                      {statuses.map((status) => (
                        <option
                          key={status.value}
                          value={status.value}
                        >
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {updatingId === order.id && (
                    <p className="mt-2 inline-flex items-center gap-2 text-xs text-[#647067]">
                      <LoaderCircle
                        size={13}
                        className="animate-spin"
                      />
                      Saving status and sending customer notification…
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-[#849087]">
          Showing the latest 100 orders. Updates refresh automatically while this page is open.
        </p>
      </main>
    </div>
  );
}

