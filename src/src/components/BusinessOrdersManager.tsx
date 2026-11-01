import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, LoaderCircle, RefreshCw } from 'lucide-react';
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
  order_number: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  items: unknown;
  total: number;
  status: OrderStatus;
  payment_method: string;
  created_at: string;
};

type Props = {
  businessId: string;
  businessName: string;
  onBack: () => void;
};

const statuses: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const currency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);

function formatItems(items: unknown): string {
  if (!Array.isArray(items)) return 'Order items unavailable';

  return items
    .map((item: unknown) => {
      if (!item || typeof item !== 'object') return '';

      const row = item as Record<string, unknown>;
      const name = String(row.name ?? row.product_name ?? 'Item');
      const quantity = Number(row.quantity ?? row.qty ?? 1);

      return `${name} × ${quantity}`;
    })
    .filter(Boolean)
    .join(', ');
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

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: loadError } = await supabase
      .from('orders')
      .select(
        'id, order_number, customer_name, customer_phone, delivery_address, items, total, status, payment_method, created_at'
      )
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function updateStatus(order: Order, status: OrderStatus) {
    if (order.status === status) return;

    setUpdatingId(order.id);
    setError('');
    setNotice('');

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', order.id)
      .eq('business_id', businessId);

    if (updateError) {
      setError(updateError.message);
      setUpdatingId(null);
      return;
    }

    setOrders((current) =>
      current.map((entry) =>
        entry.id === order.id ? { ...entry, status } : entry
      )
    );

    setNotice(`Order #${order.order_number} updated.`);
    setUpdatingId(null);
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#166534]">
      <header className="border-b border-[#E1EAE3] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to dashboard"
            className="rounded-xl border border-[#D7E2DA] p-2 hover:bg-[#F7FAF7]"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#166534]">
              Chowza for Business
            </p>
            <h1 className="text-xl font-black">Order Management</h1>
            <p className="text-sm text-[#166534]">{businessName}</p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D7E2DA] px-3 py-2 text-sm font-bold hover:bg-[#F7FAF7] disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-7">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Your orders</h2>
          <p className="mt-1 text-sm text-[#166534]">
            Review customer orders and keep their status up to date.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {notice}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-12 text-sm text-[#166534]">
            <LoaderCircle size={20} className="animate-spin" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbb8a5] bg-white p-10 text-center">
            <ClipboardList
              size={34}
              className="mx-auto mb-3 text-[#166534]"
            />
            <h3 className="text-lg font-black">No orders yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#166534]">
              Orders placed through your store will appear here when order
              creation is connected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-[#D7E2DA] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                      Order #{order.order_number}
                    </p>
                    <h3 className="mt-1 text-lg font-black">
                      {order.customer_name}
                    </h3>
                    <p className="text-sm text-[#166534]">
                      {order.customer_phone}
                    </p>
                    <p className="mt-1 text-xs text-[#999]">
                      {new Date(order.created_at).toLocaleString('en-ZA')}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xl font-black">
                      {currency(Number(order.total))}
                    </p>
                    <p className="mt-1 text-sm text-[#166534]">
                      Payment: {order.payment_method}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#F7FAF7] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                    Items
                  </p>
                  <p className="mt-1 text-sm leading-6">
                    {formatItems(order.items)}
                  </p>

                  {order.delivery_address && (
                    <>
                      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#166534]">
                        Delivery address
                      </p>
                      <p className="mt-1 text-sm">{order.delivery_address}</p>
                    </>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-bold">Update order status</span>

                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(event) =>
                      void updateStatus(
                        order,
                        event.target.value as OrderStatus
                      )
                    }
                    className="rounded-xl border border-[#D7E2DA] bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[#22C55E] disabled:opacity-50"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}