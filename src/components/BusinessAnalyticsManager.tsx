
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  LoaderCircle,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

type AnalyticsOrder = {
  id: string;
  order_number: number;
  total: number | string;
  status: OrderStatus;
  items: unknown;
  created_at: string;
};

type MenuItem = {
  id: string;
  name: string;
  is_available: boolean;
};

type BusinessAnalyticsManagerProps = {
  businessId: string;
  businessName: string;
  onBack: () => void;
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2,
  }).format(value);
}

function getItemName(item: Record<string, unknown>) {
  const name = item.name ?? item.product_name;
  return typeof name === 'string' ? name : 'Unnamed item';
}

function getItemQuantity(item: Record<string, unknown>) {
  const quantity = Number(item.quantity ?? item.qty ?? 1);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function calculateTopItems(orders: AnalyticsOrder[]) {
  const counts = new Map<string, number>();

  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    if (!Array.isArray(order.items)) continue;

    for (const rawItem of order.items) {
      if (
        typeof rawItem !== 'object' ||
        rawItem === null ||
        Array.isArray(rawItem)
      ) {
        continue;
      }

      const item = rawItem as Record<string, unknown>;
      const name = getItemName(item);
      const quantity = getItemQuantity(item);

      counts.set(name, (counts.get(name) ?? 0) + quantity);
    }
  }

  return Array.from(counts.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

export function BusinessAnalyticsManager({
  businessId,
  businessName,
  onBack,
}: BusinessAnalyticsManagerProps) {
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadAnalytics(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    const [ordersResult, menuResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, total, status, items, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false }),

      supabase
        .from('menu_items')
        .select('id, name, is_available')
        .eq('business_id', businessId),
    ]);

    if (ordersResult.error || menuResult.error) {
      setError(
        ordersResult.error?.message ||
          menuResult.error?.message ||
          'Could not load analytics.'
      );
    } else {
      setOrders((ordersResult.data ?? []) as AnalyticsOrder[]);
      setMenuItems((menuResult.data ?? []) as MenuItem[]);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    void loadAnalytics();

    // No subscription or background polling is started by this page.
  }, [businessId]);

  const completedOrders = orders.filter(
    (order) => order.status === 'completed'
  );

  const activeOrders = orders.filter(
    (order) =>
      order.status !== 'completed' && order.status !== 'cancelled'
  );

  const completedRevenue = completedOrders.reduce(
    (sum, order) => sum + Number(order.total ?? 0),
    0
  );

  const averageCompletedOrder =
    completedOrders.length > 0
      ? completedRevenue / completedOrders.length
      : 0;

  const topItems = calculateTopItems(orders);

  const statusCounts = (
    Object.keys(statusLabels) as OrderStatus[]
  ).map((status) => ({
    status,
    label: statusLabels[status],
    count: orders.filter((order) => order.status === status).length,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7efe5] p-6">
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoaderCircle
            className="animate-spin text-[#70452e]"
            size={30}
          />
          <span className="ml-3 text-sm text-[#70452e]">
            Loading your analytics...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7efe5] px-5 py-7 text-[#2f160d]">
      <main className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-[#d9c9b8] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f0c27c]/20"
          >
            <ArrowLeft size={17} />
            Back to business tools
          </button>

          <button
            type="button"
            onClick={() => void loadAnalytics(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-[#2f160d] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {refreshing ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <RefreshCw size={17} />
            )}
            Refresh
          </button>
        </div>

        <section className="mb-6 rounded-2xl bg-[#2f160d] p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-[#d99a4b]" size={30} />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#f0c27c]">
                Business analytics
              </p>
              <h1 className="text-2xl font-black sm:text-3xl">
                {businessName}
              </h1>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#f0c27c]">
            A summary based on the orders and menu items currently saved
            in your Chowza database.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<ClipboardList size={21} />}
            label="All orders"
            value={orders.length.toString()}
          />
          <MetricCard
            icon={<ShoppingBag size={21} />}
            label="Active orders"
            value={activeOrders.length.toString()}
          />
          <MetricCard
            icon={<TrendingUp size={21} />}
            label="Completed revenue"
            value={formatCurrency(completedRevenue)}
          />
          <MetricCard
            icon={<BarChart3 size={21} />}
            label="Average completed order"
            value={formatCurrency(averageCompletedOrder)}
          />
        </section>

        <section className="mb-8 rounded-2xl border border-[#d9c9b8] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-black">Order statuses</h2>

          {orders.length === 0 ? (
            <p className="text-sm leading-6 text-[#70452e]">
              No orders have been recorded yet. These figures will update
              when orders are saved to your database.
            </p>
          ) : (
            <div className="space-y-4">
              {statusCounts.map((item) => {
                const percentage =
                  orders.length > 0
                    ? (item.count / orders.length) * 100
                    : 0;

                return (
                  <div key={item.status}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-[#70452e]">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f0c27c]/25">
                      <div
                        className="h-full rounded-full bg-[#d99a4b]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#d9c9b8] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-black">Menu overview</h2>

            <p className="text-3xl font-black">
              {menuItems.length}
            </p>
            <p className="mt-1 text-sm text-[#70452e]">
              Total menu items
            </p>

            <div className="mt-5 border-t border-[#e3d6c8] pt-4">
              <div className="flex justify-between gap-3 text-sm">
                <span>Available items</span>
                <strong>
                  {menuItems.filter((item) => item.is_available).length}
                </strong>
              </div>
              <div className="mt-3 flex justify-between gap-3 text-sm">
                <span>Unavailable items</span>
                <strong>
                  {menuItems.filter((item) => !item.is_available).length}
                </strong>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d9c9b8] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-black">
              Top ordered items
            </h2>

            {topItems.length === 0 ? (
              <p className="text-sm leading-6 text-[#70452e]">
                No item breakdown is available yet. This section needs
                order records with item names and quantities.
              </p>
            ) : (
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0c27c]/30 text-sm font-black text-[#70452e]">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-semibold">
                        {item.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm text-[#70452e]">
                      {item.quantity} sold
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <p className="text-xs leading-5 text-[#70452e]">
          Revenue counts completed orders only. Cancelled orders are
          excluded from the top-item ranking. These reports reflect
          records accessible to your business account; they do not yet
          include date filters or unique-customer tracking.
        </p>
      </main>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d9c9b8] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0c27c]/30 text-[#70452e]">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#999]">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black">{value}</p>
    </div>
  );
}
