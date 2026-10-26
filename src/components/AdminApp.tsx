import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Eye,
  EyeOff,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type AdminAppProps = {
  onBack: () => void;
};

type Business = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  public_phone: string | null;
  whatsapp_number: string | null;
  public_address: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

type Order = {
  id: string;
  business_id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  items: unknown;
  total: number;
  status: string;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
};

type MenuItem = {
  id: string;
  business_id: string;
  name: string;
  price: number;
  is_available: boolean;
};

type PaymentConnection = {
  id: string;
  business_id: string;
  provider: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type AdminTab =
  | 'overview'
  | 'businesses'
  | 'orders'
  | 'payments'
  | 'analytics'
  | 'activity'
  | 'settings';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
];

function formatMoney(value: number) {
  return `R${value.toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
  });
}

function getStartOfDay() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getStartOfWeek() {
  const date = getStartOfDay();
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return date;
}

export function AdminApp({ onBack }: AdminAppProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [paymentConnections, setPaymentConnections] = useState<
    PaymentConnection[]
  >([]);

  
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);
const [accessDenied, setAccessDenied] = useState(false);

const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [businessSearch, setBusinessSearch] = useState('');

  const [selectedBusiness, setSelectedBusiness] =
    useState<Business | null>(null);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  async function loadAdminData(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [
        businessesResult,
        ordersResult,
        menuItemsResult,
        paymentsResult,
      ] = await Promise.all([
        supabase
          .from('businesses')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('menu_items')
          .select(
            'id,business_id,name,price,is_available',
          )
          .order('created_at', { ascending: false }),

        /*
         * IMPORTANT:
         * We intentionally do NOT select yoco_secret_id.
         */
        supabase
          .from('business_payment_connections')
          .select(
            'id,business_id,provider,is_enabled,created_at,updated_at',
          )
          .order('created_at', { ascending: false }),
      ]);

      if (businessesResult.error) {
        throw businessesResult.error;
      }

      if (ordersResult.error) {
        throw ordersResult.error;
      }

      if (menuItemsResult.error) {
        throw menuItemsResult.error;
      }

      if (paymentsResult.error) {
        throw paymentsResult.error;
      }

      setBusinesses((businessesResult.data ?? []) as Business[]);
      setOrders((ordersResult.data ?? []) as Order[]);
      setMenuItems((menuItemsResult.data ?? []) as MenuItem[]);
      setPaymentConnections(
        (paymentsResult.data ?? []) as PaymentConnection[],
      );
    } catch (loadError) {
      console.error('Admin data loading error:', loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load admin data.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

 useEffect(() => {
  let mounted = true;

  async function checkAdminAccess() {
    setLoading(true);
    setAccessDenied(false);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        if (!mounted) return;

        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const isAdmin = user.app_metadata?.role === 'admin';

      if (!isAdmin) {
        if (!mounted) return;

        setAccessDenied(true);
        setLoading(false);
        return;
      }

      if (!mounted) return;

      await loadAdminData();
    } catch (checkError) {
      console.error('Admin access check failed:', checkError);

      if (!mounted) return;

      setError(
        checkError instanceof Error
          ? checkError.message
          : 'Could not verify administrator access.',
      );

      setLoading(false);
    }
  }

  void checkAdminAccess();

  return () => {
    mounted = false;
  };
}, []);

  const businessNameById = useMemo(() => {
    return new Map(
      businesses.map((business) => [
        business.id,
        business.name,
      ]),
    );
  }, [businesses]);

  const totalRevenue = useMemo(() => {
    return orders
      .filter((order) => order.status !== 'cancelled')
      .reduce(
        (sum, order) => sum + Number(order.total || 0),
        0,
      );
  }, [orders]);

  const todayRevenue = useMemo(() => {
    const start = getStartOfDay();

    return orders
      .filter(
        (order) =>
          new Date(order.created_at) >= start &&
          order.status !== 'cancelled',
      )
      .reduce(
        (sum, order) => sum + Number(order.total || 0),
        0,
      );
  }, [orders]);

  const weekRevenue = useMemo(() => {
    const start = getStartOfWeek();

    return orders
      .filter(
        (order) =>
          new Date(order.created_at) >= start &&
          order.status !== 'cancelled',
      )
      .reduce(
        (sum, order) => sum + Number(order.total || 0),
        0,
      );
  }, [orders]);

  const averageOrderValue = useMemo(() => {
    const validOrders = orders.filter(
      (order) => order.status !== 'cancelled',
    );

    if (!validOrders.length) return 0;

    return (
      validOrders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0,
      ) / validOrders.length
    );
  }, [orders]);

  const completedOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === 'completed',
      ).length,
    [orders],
  );

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          !['completed', 'cancelled'].includes(
            order.status,
          ),
      ).length,
    [orders],
  );

  const publishedBusinesses = useMemo(
    () =>
      businesses.filter(
        (business) => business.is_published,
      ).length,
    [businesses],
  );

  const activeMenuItems = useMemo(
    () =>
      menuItems.filter(
        (item) => item.is_available,
      ).length,
    [menuItems],
  );

  const enabledPayments = useMemo(
    () =>
      paymentConnections.filter(
        (connection) => connection.is_enabled,
      ).length,
    [paymentConnections],
  );

  const paidOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.payment_status === 'paid',
      ).length,
    [orders],
  );

  const businessPerformance = useMemo(() => {
    return businesses
      .map((business) => {
        const businessOrders = orders.filter(
          (order) =>
            order.business_id === business.id,
        );

        const revenue = businessOrders
          .filter(
            (order) =>
              order.status !== 'cancelled',
          )
          .reduce(
            (sum, order) =>
              sum + Number(order.total || 0),
            0,
          );

        const items = menuItems.filter(
          (item) =>
            item.business_id === business.id,
        );

        return {
          business,
          orders: businessOrders.length,
          revenue,
          menuItems: items.length,
          activeItems: items.filter(
            (item) => item.is_available,
          ).length,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [businesses, orders, menuItems]);

  const filteredBusinesses = useMemo(() => {
    const search = businessSearch.trim().toLowerCase();

    if (!search) return businesses;

    return businesses.filter(
      (business) =>
        business.name
          .toLowerCase()
          .includes(search) ||
        business.slug
          .toLowerCase()
          .includes(search) ||
        business.owner_id
          .toLowerCase()
          .includes(search),
    );
  }, [businesses, businessSearch]);

  const filteredOrders = useMemo(() => {
    const search = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        orderFilter === 'all' ||
        order.status === orderFilter;

      const businessName =
        businessNameById
          .get(order.business_id)
          ?.toLowerCase() ?? '';

      const matchesSearch =
        !search ||
        String(order.order_number).includes(search) ||
        order.customer_name
          .toLowerCase()
          .includes(search) ||
        order.customer_phone
          .toLowerCase()
          .includes(search) ||
        businessName.includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [
    orders,
    orderSearch,
    orderFilter,
    businessNameById,
  ]);

  async function toggleBusinessPublished(
    business: Business,
  ) {
    setError(null);

    const nextValue = !business.is_published;

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        is_published: nextValue,
      })
      .eq('id', business.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setBusinesses((current) =>
      current.map((item) =>
        item.id === business.id
          ? {
              ...item,
              is_published: nextValue,
            }
          : item,
      ),
    );
  }

  async function updateOrderStatus(
    order: Order,
    status: string,
  ) {
    setError(null);

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const updatedAt =
      new Date().toISOString();

    setOrders((current) =>
      current.map((item) =>
        item.id === order.id
          ? {
              ...item,
              status,
              updated_at: updatedAt,
            }
          : item,
      ),
    );

    setSelectedOrder((current) =>
      current && current.id === order.id
        ? {
            ...current,
            status,
            updated_at: updatedAt,
          }
        : current,
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    onBack();
  }

  function selectTab(tab: AdminTab) {
    setActiveTab(tab);
    setMobileNavOpen(false);
  }
if (accessDenied) {
  return (
    <div className="min-h-screen bg-[#f4f0eb] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-[#ddd3ca] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <ShieldCheck size={26} />
        </div>

        <h1 className="text-2xl font-black text-[#2d211c]">
          Admin access required
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#75645a]">
          This area is restricted to Chowza platform administrators.
          Your account does not have administrator permissions.
        </p>

        <button
          onClick={onBack}
          className="mt-6 w-full rounded-xl bg-[#2d211c] px-4 py-3 text-sm font-black text-white hover:bg-[#3d2c24]"
        >
          Return to Chowza
        </button>
      </div>
    </div>
  );
}
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f0eb] flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-3xl border border-[#ddd3ca] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2f211b] text-white">
            <ShieldCheck size={26} />
          </div>

          <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-[#d99a4b] border-t-transparent" />

          <p className="text-sm font-bold text-[#4a3428]">
            Loading Chowza Command Centre...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f0eb] text-[#2d211c]">
      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-[#ddd3ca] bg-[#211813] text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#211813]">
                <ShieldCheck size={23} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d99a4b]">
                  Chowza
                </p>

                <p className="text-lg font-black">
                  Command Centre
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <SidebarItem
              active={activeTab === 'overview'}
              icon={<LayoutDashboard size={18} />}
              label="Overview"
              onClick={() => selectTab('overview')}
            />

            <SidebarItem
              active={activeTab === 'businesses'}
              icon={<Building2 size={18} />}
              label="Businesses"
              onClick={() => selectTab('businesses')}
              badge={businesses.length}
            />

            <SidebarItem
              active={activeTab === 'orders'}
              icon={<ClipboardList size={18} />}
              label="Orders"
              onClick={() => selectTab('orders')}
              badge={pendingOrders}
            />

            <SidebarItem
              active={activeTab === 'payments'}
              icon={<CreditCard size={18} />}
              label="Payments"
              onClick={() => selectTab('payments')}
            />

            <SidebarItem
              active={activeTab === 'analytics'}
              icon={<BarChart3 size={18} />}
              label="Analytics"
              onClick={() => selectTab('analytics')}
            />

            <SidebarItem
              active={activeTab === 'activity'}
              icon={<Activity size={18} />}
              label="Activity"
              onClick={() => selectTab('activity')}
            />

            <div className="my-5 border-t border-white/10" />

            <SidebarItem
              active={activeTab === 'settings'}
              icon={<Settings size={18} />}
              label="Settings"
              onClick={() => selectTab('settings')}
            />
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-3 rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-white/50">
                PLATFORM STATUS
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-sm font-semibold">
                  Systems operational
                </span>
              </div>
            </div>

            <button
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* MOBILE HEADER */}
          <header className="sticky top-0 z-30 border-b border-[#ddd3ca] bg-white/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setMobileNavOpen(
                      !mobileNavOpen,
                    )
                  }
                  className="rounded-xl border border-[#ddd3ca] p-2"
                >
                  {mobileNavOpen ? (
                    <X size={19} />
                  ) : (
                    <Menu size={19} />
                  )}
                </button>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a46b32]">
                    Chowza
                  </p>

                  <p className="font-black">
                    Command Centre
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  void loadAdminData(true)
                }
                className="rounded-xl border border-[#ddd3ca] p-2"
              >
                <RefreshCw
                  size={18}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>
            </div>

            {mobileNavOpen && (
              <div className="border-t border-[#eee6df] bg-white p-3">
                <MobileNavItem
                  active={
                    activeTab === 'overview'
                  }
                  label="Overview"
                  icon={
                    <LayoutDashboard size={17} />
                  }
                  onClick={() =>
                    selectTab('overview')
                  }
                />

                <MobileNavItem
                  active={
                    activeTab === 'businesses'
                  }
                  label="Businesses"
                  icon={
                    <Building2 size={17} />
                  }
                  onClick={() =>
                    selectTab('businesses')
                  }
                />

                <MobileNavItem
                  active={
                    activeTab === 'orders'
                  }
                  label="Orders"
                  icon={
                    <ClipboardList size={17} />
                  }
                  onClick={() =>
                    selectTab('orders')
                  }
                />

                <MobileNavItem
                  active={
                    activeTab === 'payments'
                  }
                  label="Payments"
                  icon={
                    <CreditCard size={17} />
                  }
                  onClick={() =>
                    selectTab('payments')
                  }
                />

                <MobileNavItem
                  active={
                    activeTab === 'analytics'
                  }
                  label="Analytics"
                  icon={
                    <BarChart3 size={17} />
                  }
                  onClick={() =>
                    selectTab('analytics')
                  }
                />

                <MobileNavItem
                  active={
                    activeTab === 'activity'
                  }
                  label="Activity"
                  icon={
                    <Activity size={17} />
                  }
                  onClick={() =>
                    selectTab('activity')
                  }
                />

                <MobileNavItem
                  active={
                    activeTab === 'settings'
                  }
                  label="Settings"
                  icon={
                    <Settings size={17} />
                  }
                  onClick={() =>
                    selectTab('settings')
                  }
                />

                <button
                  onClick={() =>
                    void handleLogout()
                  }
                  className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-red-600"
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            )}
          </header>

          {/* MAIN */}
          <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6 lg:p-8">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <XCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <div className="flex-1">
                  <p className="font-black">
                    Admin action failed
                  </p>

                  <p>{error}</p>
                </div>

                <button
                  onClick={() => setError(null)}
                  className="rounded-lg p-1 hover:bg-red-100"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* TOP BAR */}
            <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a46b32]">
                  Platform administration
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                  {activeTab === 'overview'
                    ? 'Good evening.'
                    : activeTab === 'businesses'
                      ? 'Business command centre'
                      : activeTab === 'orders'
                        ? 'Order command centre'
                        : activeTab === 'payments'
                          ? 'Payment centre'
                          : activeTab === 'analytics'
                            ? 'Platform analytics'
                            : activeTab ===
                                'activity'
                              ? 'Platform activity'
                              : 'Admin settings'}
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-[#75645a]">
                  Control and monitor the Chowza
                  platform from one secure place.
                </p>
              </div>

              <button
                onClick={() =>
                  void loadAdminData(true)
                }
                disabled={refreshing}
                className="hidden items-center gap-2 rounded-xl bg-[#2d211c] px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-[#3d2c24] disabled:opacity-60 xl:inline-flex"
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />
                Refresh data
              </button>
            </div>

            {activeTab === 'overview' && (
              <Overview
                businesses={businesses}
                orders={orders}
                businessPerformance={
                  businessPerformance
                }
                totalRevenue={totalRevenue}
                todayRevenue={todayRevenue}
                weekRevenue={weekRevenue}
                averageOrderValue={
                  averageOrderValue
                }
                pendingOrders={pendingOrders}
                publishedBusinesses={
                  publishedBusinesses
                }
                activeMenuItems={activeMenuItems}
                paidOrders={paidOrders}
                onBusinessClick={
                  setSelectedBusiness
                }
                onOrderClick={setSelectedOrder}
                businessNameById={
                  businessNameById
                }
              />
            )}

            {activeTab === 'businesses' && (
              <BusinessesPanel
                businesses={
                  filteredBusinesses
                }
                search={businessSearch}
                setSearch={setBusinessSearch}
                performance={
                  businessPerformance
                }
                onTogglePublish={
                  toggleBusinessPublished
                }
                onSelect={
                  setSelectedBusiness
                }
              />
            )}

            {activeTab === 'orders' && (
              <OrdersPanel
                orders={filteredOrders}
                search={orderSearch}
                setSearch={setOrderSearch}
                filter={orderFilter}
                setFilter={setOrderFilter}
                businessNameById={
                  businessNameById
                }
                onSelect={setSelectedOrder}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsPanel
                businesses={businesses}
                connections={
                  paymentConnections
                }
                orders={orders}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsPanel
                businesses={businesses}
                orders={orders}
                performance={
                  businessPerformance
                }
                totalRevenue={
                  totalRevenue
                }
              />
            )}

            {activeTab === 'activity' && (
              <ActivityPanel
                orders={orders}
                businesses={businesses}
                businessNameById={
                  businessNameById
                }
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel />
            )}
          </main>

          <footer className="border-t border-[#ddd3ca] bg-white px-6 py-5 text-center text-xs text-[#8a776b]">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck size={14} />
              Chowza Platform Administration
            </div>

            <p className="mt-1">
              Protected by Supabase authentication
              and Row Level Security.
            </p>
          </footer>
        </div>
      </div>

      {selectedBusiness && (
        <BusinessDrawer
          business={selectedBusiness}
          performance={
            businessPerformance.find(
              (item) =>
                item.business.id ===
                selectedBusiness.id,
            )
          }
          onClose={() =>
            setSelectedBusiness(null)
          }
          onTogglePublish={() =>
            void toggleBusinessPublished(
              selectedBusiness,
            )
          }
        />
      )}

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          businessName={
            businessNameById.get(
              selectedOrder.business_id,
            ) ?? 'Unknown business'
          }
          onClose={() =>
            setSelectedOrder(null)
          }
          onUpdateStatus={(status) =>
            void updateOrderStatus(
              selectedOrder,
              status,
            )
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function Overview({
  businesses,
  orders,
  businessPerformance,
  totalRevenue,
  todayRevenue,
  weekRevenue,
  averageOrderValue,
  pendingOrders,
  publishedBusinesses,
  activeMenuItems,
  paidOrders,
  onBusinessClick,
  onOrderClick,
  businessNameById,
}: {
  businesses: Business[];
  orders: Order[];
  businessPerformance: {
    business: Business;
    orders: number;
    revenue: number;
    menuItems: number;
    activeItems: number;
  }[];
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  publishedBusinesses: number;
  activeMenuItems: number;
  paidOrders: number;
  onBusinessClick: (business: Business) => void;
  onOrderClick: (order: Order) => void;
  businessNameById: Map<string, string>;
}) {
  const maxRevenue = Math.max(
    ...businessPerformance.map(
      (item) => item.revenue,
    ),
    1,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard
          label="Platform GMV"
          value={formatMoney(totalRevenue)}
          sub="All non-cancelled orders"
          icon={<Wallet size={20} />}
        />

        <MetricCard
          label="Today"
          value={formatMoney(todayRevenue)}
          sub="Revenue today"
          icon={<TrendingUp size={20} />}
        />

        <MetricCard
          label="This week"
          value={formatMoney(weekRevenue)}
          sub="Monday to today"
          icon={<BarChart3 size={20} />}
        />

        <MetricCard
          label="Avg. order"
          value={formatMoney(
            averageOrderValue,
          )}
          sub="Average order value"
          icon={<CreditCard size={20} />}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MiniMetric
          label="Businesses"
          value={businesses.length}
          icon={<Building2 size={17} />}
        />

        <MiniMetric
          label="Published"
          value={publishedBusinesses}
          icon={<Eye size={17} />}
        />

        <MiniMetric
          label="Pending orders"
          value={pendingOrders}
          icon={
            <ClipboardList size={17} />
          }
        />

        <MiniMetric
          label="Active menu items"
          value={activeMenuItems}
          icon={<Store size={17} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-[#ddd3ca] bg-white p-6 shadow-sm xl:col-span-2">
          <SectionHeader
            title="Revenue by business"
            subtitle="Which businesses are driving the platform?"
            icon={<TrendingUp size={20} />}
          />

          {businessPerformance.length === 0 ? (
            <EmptyState text="No business data yet." />
          ) : (
            <div className="mt-6 space-y-5">
              {businessPerformance
                .slice(0, 8)
                .map((item) => (
                  <button
                    key={item.business.id}
                    onClick={() =>
                      onBusinessClick(
                        item.business,
                      )
                    }
                    className="group block w-full text-left"
                  >
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5eee7] text-[#a46b32]">
                          <Store size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {item.business.name}
                          </p>

                          <p className="text-xs text-[#8a776b]">
                            {item.orders} orders
                          </p>
                        </div>
                      </div>

                      <span className="font-black">
                        {formatMoney(
                          item.revenue,
                        )}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#eee7e1]">
                      <div
                        className="h-full rounded-full bg-[#a46b32] transition-all group-hover:bg-[#7d4e25]"
                        style={{
                          width: `${Math.max(
                            (item.revenue /
                              maxRevenue) *
                              100,
                            item.revenue
                              ? 4
                              : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </button>
                ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#ddd3ca] bg-[#2d211c] p-6 text-white shadow-sm">
          <SectionHeader
            title="Platform health"
            subtitle="Live operational snapshot"
            icon={<Activity size={20} />}
            dark
          />

          <div className="mt-6 space-y-4">
            <HealthRow
              label="Businesses online"
              value={`${publishedBusinesses}/${businesses.length}`}
              status="good"
            />

            <HealthRow
              label="Orders awaiting action"
              value={pendingOrders}
              status={
                pendingOrders > 10
                  ? 'warning'
                  : 'good'
              }
            />

            <HealthRow
              label="Paid orders"
              value={paidOrders}
              status="good"
            />

            <HealthRow
              label="Completed orders"
              value={
                orders.filter(
                  (order) =>
                    order.status ===
                    'completed',
                ).length
              }
              status="good"
            />

            <HealthRow
              label="Cancelled orders"
              value={
                orders.filter(
                  (order) =>
                    order.status ===
                    'cancelled',
                ).length
              }
              status={
                orders.filter(
                  (order) =>
                    order.status ===
                    'cancelled',
                ).length > 10
                  ? 'warning'
                  : 'good'
              }
            />
          </div>

          <div className="mt-8 rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">
              Platform status
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

              <span className="text-sm font-bold">
                All systems operational
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[#ddd3ca] bg-white p-6 shadow-sm">
          <SectionHeader
            title="Top businesses"
            subtitle="Ranked by revenue"
            icon={<Building2 size={20} />}
          />

          <div className="mt-5 space-y-2">
            {businessPerformance
              .slice(0, 5)
              .map((item, index) => (
                <button
                  key={item.business.id}
                  onClick={() =>
                    onBusinessClick(
                      item.business,
                    )
                  }
                  className="flex w-full items-center gap-4 rounded-2xl p-3 text-left hover:bg-[#faf7f4]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2d211c] text-sm font-black text-white">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">
                      {item.business.name}
                    </p>

                    <p className="text-xs text-[#8a776b]">
                      {item.orders} orders ·{' '}
                      {item.menuItems} menu items
                    </p>
                  </div>

                  <p className="font-black">
                    {formatMoney(
                      item.revenue,
                    )}
                  </p>

                  <ChevronRight
                    size={17}
                    className="text-[#b5a79e]"
                  />
                </button>
              ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#ddd3ca] bg-white p-6 shadow-sm">
          <SectionHeader
            title="Recent orders"
            subtitle="Latest platform activity"
            icon={<ClipboardList size={20} />}
          />

          <div className="mt-5 space-y-2">
            {orders.slice(0, 6).map((order) => (
              <button
                key={order.id}
                onClick={() =>
                  onOrderClick(order)
                }
                className="flex w-full items-center gap-4 rounded-2xl p-3 text-left hover:bg-[#faf7f4]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5eee7] text-[#a46b32]">
                  <ClipboardList size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-black">
                    Order #{order.order_number}
                  </p>

                  <p className="truncate text-xs text-[#8a776b]">
                    {businessNameById.get(
                      order.business_id,
                    ) ?? 'Unknown business'}{' '}
                    · {order.customer_name}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black">
                    {formatMoney(
                      Number(order.total),
                    )}
                  </p>

                  <StatusBadge
                    status={order.status}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   BUSINESSES
========================================================= */

function BusinessesPanel({
  businesses,
  search,
  setSearch,
  performance,
  onTogglePublish,
  onSelect,
}: {
  businesses: Business[];
  search: string;
  setSearch: (value: string) => void;
  performance: {
    business: Business;
    orders: number;
    revenue: number;
    menuItems: number;
    activeItems: number;
  }[];
  onTogglePublish: (
    business: Business,
  ) => void;
  onSelect: (business: Business) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#ddd3ca] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">
              Business network
            </h2>

            <p className="text-sm text-[#75645a]">
              Manage every business on Chowza.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8c82]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search businesses..."
              className="w-full rounded-xl border border-[#ddd3ca] bg-[#faf8f6] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#a46b32]"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {businesses.map((business) => {
          const stats = performance.find(
            (item) =>
              item.business.id ===
              business.id,
          );

          return (
            <div
              key={business.id}
              className="rounded-3xl border border-[#ddd3ca] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() =>
                    onSelect(business)
                  }
                  className="flex min-w-0 items-center gap-4 text-left"
                >
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="h-14 w-14 rounded-2xl border border-[#eee6df] object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5eee7] text-[#a46b32]">
                      <Store size={23} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black">
                      {business.name}
                    </h3>

                    <p className="text-sm text-[#8a776b]">
                      /{business.slug}
                    </p>
                  </div>
                </button>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    business.is_published
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {business.is_published
                    ? 'Live'
                    : 'Hidden'}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <SmallStat
                  label="Orders"
                  value={stats?.orders ?? 0}
                />

                <SmallStat
                  label="Revenue"
                  value={formatMoney(
                    stats?.revenue ?? 0,
                  )}
                />

                <SmallStat
                  label="Menu"
                  value={stats?.menuItems ?? 0}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    onSelect(business)
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2d211c] px-4 py-2.5 text-sm font-black text-white"
                >
                  <Eye size={16} />
                  View details
                </button>

                <button
                  onClick={() =>
                    onTogglePublish(
                      business,
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ddd3ca] px-4 py-2.5 text-sm font-black hover:bg-[#faf7f4]"
                >
                  {business.is_published ? (
                    <>
                      <EyeOff size={16} />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye size={16} />
                      Publish
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!businesses.length && (
        <EmptyState text="No businesses match your search." />
      )}
    </div>
  );
}

/* =========================================================
   ORDERS
========================================================= */

function OrdersPanel({
  orders,
  search,
  setSearch,
  filter,
  setFilter,
  businessNameById,
  onSelect,
}: {
  orders: Order[];
  search: string;
  setSearch: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  businessNameById: Map<string, string>;
  onSelect: (order: Order) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[#ddd3ca] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">
              Platform orders
            </h2>

            <p className="text-sm text-[#75645a]">
              Search and monitor orders across Chowza.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8c82]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Order, customer, phone..."
                className="w-full rounded-xl border border-[#ddd3ca] bg-[#faf8f6] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#a46b32] sm:w-64"
              />
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
              className="rounded-xl border border-[#ddd3ca] bg-white px-4 py-2.5 text-sm font-bold outline-none"
            >
              <option value="all">
                All statuses
              </option>

              {ORDER_STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status.replaceAll(
                      '_',
                      ' ',
                    )}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-3xl border border-[#ddd3ca] bg-white shadow-sm">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => onSelect(order)}
            className="flex w-full flex-col gap-4 border-b border-[#eee6df] p-5 text-left transition hover:bg-[#fcfaf8] last:border-0 md:flex-row md:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5eee7] text-[#a46b32]">
                <ClipboardList size={19} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">
                    Order #{order.order_number}
                  </p>

                  <StatusBadge
                    status={order.status}
                  />
                </div>

                <p className="mt-1 text-sm font-semibold">
                  {businessNameById.get(
                    order.business_id,
                  ) ?? 'Unknown business'}
                </p>

                <p className="truncate text-xs text-[#8a776b]">
                  {order.customer_name} ·{' '}
                  {order.customer_phone} ·{' '}
                  {shortDate(
                    order.created_at,
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-5 md:justify-end">
              <div className="text-left md:text-right">
                <p className="text-lg font-black">
                  {formatMoney(
                    Number(order.total),
                  )}
                </p>

                <p className="text-xs text-[#8a776b]">
                  {order.payment_method ??
                    'Payment not specified'}{' '}
                  · {order.payment_status}
                </p>
              </div>

              <ChevronRight
                size={18}
                className="text-[#aaa098]"
              />
            </div>
          </button>
        ))}

        {!orders.length && (
          <div className="p-10">
            <EmptyState text="No orders match your filters." />
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PAYMENTS
========================================================= */

function PaymentsPanel({
  businesses,
  connections,
  orders,
}: {
  businesses: Business[];
  connections: PaymentConnection[];
  orders: Order[];
}) {
  const yocoConnections = connections.filter(
    (connection) =>
      connection.provider === 'yoco',
  );

  const paidRevenue = orders
    .filter(
      (order) =>
        order.payment_status === 'paid',
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0,
    );

  const unpaidRevenue = orders
    .filter(
      (order) =>
        order.payment_status !== 'paid' &&
        order.status !== 'cancelled',
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0,
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Paid revenue"
          value={formatMoney(paidRevenue)}
          sub="Orders marked paid"
          icon={<CheckCircle2 size={20} />}
        />

        <MetricCard
          label="Unpaid value"
          value={formatMoney(
            unpaidRevenue,
          )}
          sub="Outstanding order value"
          icon={<Wallet size={20} />}
        />

        <MetricCard
          label="Yoco connections"
          value={`${yocoConnections.filter(
            (item) => item.is_enabled,
          ).length}/${businesses.length}`}
          sub="Businesses with Yoco enabled"
          icon={<CreditCard size={20} />}
        />
      </div>

      <section className="rounded-3xl border border-[#ddd3ca] bg-white shadow-sm">
        <div className="border-b border-[#eee6df] p-6">
          <h2 className="text-xl font-black">
            Payment connections
          </h2>

          <p className="mt-1 text-sm text-[#75645a]">
            Payment provider status by business.
          </p>
        </div>

        <div className="divide-y divide-[#eee6df]">
          {businesses.map((business) => {
            const connection =
              connections.find(
                (item) =>
                  item.business_id ===
                  business.id,
              );

            return (
              <div
                key={business.id}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5eee7] text-[#a46b32]">
                    <CreditCard size={19} />
                  </div>

                  <div>
                    <p className="font-black">
                      {business.name}
                    </p>

                    <p className="text-xs text-[#8a776b]">
                      Provider:{' '}
                      {connection?.provider ??
                        'Not connected'}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-black ${
                    connection?.is_enabled
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {connection?.is_enabled
                    ? 'Enabled'
                    : 'Not enabled'}
                </span>
              </div>
            );
          })}

          {!businesses.length && (
            <div className="p-8">
              <EmptyState text="No businesses found." />
            </div>
          )}
        </div>
      </section>

      <div className="rounded-2xl border border-[#eadfd5] bg-[#fffaf5] p-5 text-sm text-[#705c50]">
        <div className="flex gap-3">
          <ShieldCheck
            size={19}
            className="shrink-0 text-[#a46b32]"
          />

          <p>
            Sensitive payment credentials are not
            loaded into this dashboard. Only connection
            status and provider information are displayed.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

function AnalyticsPanel({
  businesses,
  orders,
  performance,
  totalRevenue,
}: {
  businesses: Business[];
  orders: Order[];
  performance: {
    business: Business;
    orders: number;
    revenue: number;
    menuItems: number;
    activeItems: number;
  }[];
  totalRevenue: number;
}) {
  const statusCounts = ORDER_STATUSES.map(
    (status) => ({
      status,
      count: orders.filter(
        (order) =>
          order.status === status,
      ).length,
    }),
  );

  const maxStatus = Math.max(
    ...statusCounts.map(
      (item) => item.count,
    ),
    1,
  );

  const paymentMethods = [
    'cash',
    'yoco',
    'card',
    'cash_on_delivery',
  ].map((method) => ({
    method,
    count: orders.filter(
      (order) =>
        order.payment_method === method,
    ).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Platform revenue"
          value={formatMoney(totalRevenue)}
          sub="Non-cancelled orders"
          icon={<TrendingUp size={20} />}
        />

        <MetricCard
          label="Total orders"
          value={orders.length}
          sub="All recorded orders"
          icon={<ClipboardList size={20} />}
        />

        <MetricCard
          label="Businesses"
          value={businesses.length}
          sub="Registered businesses"
          icon={<Building2 size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[#ddd3ca] bg-white p-6 shadow-sm">
          <SectionHeader
            title="Order pipeline"
            subtitle="Current order distribution"
            icon={<ClipboardList size={20} />}
          />

          <div className="mt-6 space-y-4">
            {statusCounts.map(
              (item) => (
                <div key={item.status}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-bold capitalize">
                      {item.status.replaceAll(
                        '_',
                        ' ',
                      )}
                    </span>

                    <span className="font-black">
                      {item.count}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-[#eee7e1]">
                    <div
                      className="h-full rounded-full bg-[#2d211c]"
                      style={{
                        width: `${(item.count / maxStatus) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[#ddd3ca] bg-white p-6 shadow-sm">
          <SectionHeader
            title="Payment methods"
            subtitle="How customers are paying"
            icon={<CreditCard size={20} />}
          />

          <div className="mt-6 space-y-4">
            {paymentMethods.map(
              (item) => (
                <div
                  key={item.method}
                  className="flex items-center justify-between rounded-2xl bg-[#faf7f4] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
                      <CreditCard size={17} />
                    </div>

                    <span className="text-sm font-bold capitalize">
                      {item.method.replaceAll(
                        '_',
                        ' ',
                      )}
                    </span>
                  </div>

                  <span className="text-lg font-black">
                    {item.count}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-[#ddd3ca] bg-white p-6 shadow-sm">
        <SectionHeader
          title="Business performance"
          subtitle="Revenue and order performance"
          icon={<BarChart3 size={20} />}
        />

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="border-b border-[#eee6df] text-xs uppercase tracking-wider text-[#8a776b]">
                <th className="px-3 py-3">
                  Business
                </th>
                <th className="px-3 py-3">
                  Orders
                </th>
                <th className="px-3 py-3">
                  Revenue
                </th>
                <th className="px-3 py-3">
                  Menu
                </th>
                <th className="px-3 py-3">
                  Active
                </th>
              </tr>
            </thead>

            <tbody>
              {performance.map((item) => (
                <tr
                  key={item.business.id}
                  className="border-b border-[#f0eae5] last:border-0"
                >
                  <td className="px-3 py-4 font-black">
                    {item.business.name}
                  </td>

                  <td className="px-3 py-4">
                    {item.orders}
                  </td>

                  <td className="px-3 py-4 font-black">
                    {formatMoney(
                      item.revenue,
                    )}
                  </td>

                  <td className="px-3 py-4">
                    {item.menuItems}
                  </td>

                  <td className="px-3 py-4">
                    {item.activeItems}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   ACTIVITY
========================================================= */

function ActivityPanel({
  orders,
  businesses,
  businessNameById,
}: {
  orders: Order[];
  businesses: Business[];
  businessNameById: Map<string, string>;
}) {
  const events = [
    ...orders.slice(0, 12).map(
      (order) => ({
        id: `order-${order.id}`,
        title: `Order #${order.order_number}`,
        description: `${
          businessNameById.get(
            order.business_id,
          ) ?? 'Unknown business'
        } · ${order.customer_name}`,
        date: order.created_at,
        icon: (
          <ClipboardList size={17} />
        ),
      }),
    ),
    ...businesses.slice(0, 8).map(
      (business) => ({
        id: `business-${business.id}`,
        title: `Business ${business.is_published ? 'published' : 'registered'}`,
        description: business.name,
        date: business.updated_at,
        icon: <Building2 size={17} />,
      }),
    ),
  ]
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime(),
    )
    .slice(0, 20);

  return (
    <section className="rounded-3xl border border-[#ddd3ca] bg-white p-6 shadow-sm">
      <SectionHeader
        title="Platform activity"
        subtitle="Recent business and order events"
        icon={<Activity size={20} />}
      />

      <div className="mt-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="relative flex gap-4 border-b border-[#eee6df] py-5 last:border-0"
          >
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5eee7] text-[#a46b32]">
              {event.icon}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-black">
                {event.title}
              </p>

              <p className="mt-1 text-sm text-[#75645a]">
                {event.description}
              </p>

              <p className="mt-1 text-xs text-[#a09187]">
                {formatDate(event.date)}
              </p>
            </div>
          </div>
        ))}

        {!events.length && (
          <EmptyState text="No activity yet." />
        )}
      </div>
    </section>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPanel() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-[#ddd3ca] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5eee7] text-[#a46b32]">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="font-black">
              Security
            </h2>

            <p className="text-sm text-[#75645a]">
              Platform protection
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <SettingRow
            title="Admin authentication"
            value="Enabled"
            good
          />

          <SettingRow
            title="Row Level Security"
            value="Enabled"
            good
          />

          <SettingRow
            title="Business isolation"
            value="Enabled"
            good
          />

          <SettingRow
            title="Payment secrets exposed"
            value="No"
            good
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[#ddd3ca] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5eee7] text-[#a46b32]">
            <Settings size={20} />
          </div>

          <div>
            <h2 className="font-black">
              Platform configuration
            </h2>

            <p className="text-sm text-[#75645a]">
              Current Chowza configuration
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <SettingRow
            title="Customer ordering"
            value="Operational"
            good
          />

          <SettingRow
            title="Business dashboard"
            value="Operational"
            good
          />

          <SettingRow
            title="Admin dashboard"
            value="Operational"
            good
          />

          <SettingRow
            title="Yoco integration"
            value="Configured"
            good
          />
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   DRAWERS
========================================================= */

function BusinessDrawer({
  business,
  performance,
  onClose,
  onTogglePublish,
}: {
  business: Business;
  performance:
    | {
        business: Business;
        orders: number;
        revenue: number;
        menuItems: number;
        activeItems: number;
      }
    | undefined;
  onClose: () => void;
  onTogglePublish: () => void;
}) {
  return (
    <Drawer onClose={onClose}>
      <div className="border-b border-[#eee6df] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5eee7] text-[#a46b32]">
                <Store size={26} />
              </div>
            )}

            <div>
              <h2 className="text-xl font-black">
                {business.name}
              </h2>

              <p className="text-sm text-[#75645a]">
                /{business.slug}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-[#ddd3ca] p-2"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3">
          <SmallStat
            label="Orders"
            value={performance?.orders ?? 0}
          />

          <SmallStat
            label="Revenue"
            value={formatMoney(
              performance?.revenue ?? 0,
            )}
          />

          <SmallStat
            label="Menu items"
            value={performance?.menuItems ?? 0}
          />

          <SmallStat
            label="Active menu"
            value={performance?.activeItems ?? 0}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#a09187]">
            Owner
          </p>

          <div className="rounded-2xl bg-[#faf7f4] p-4 text-sm font-semibold break-all">
            {business.owner_id}
          </div>
        </div>

        {business.description && (
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#a09187]">
              Description
            </p>

            <p className="text-sm leading-6 text-[#5f5047]">
              {business.description}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <InfoRow
            label="Phone"
            value={
              business.public_phone ??
              'Not provided'
            }
          />

          <InfoRow
            label="WhatsApp"
            value={
              business.whatsapp_number ??
              'Not provided'
            }
          />

          <InfoRow
            label="Address"
            value={
              business.public_address ??
              'Not provided'
            }
          />

          <InfoRow
            label="Created"
            value={formatDate(
              business.created_at,
            )}
          />
        </div>

        <button
          onClick={onTogglePublish}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d211c] px-4 py-3 text-sm font-black text-white"
        >
          {business.is_published ? (
            <>
              <EyeOff size={17} />
              Unpublish business
            </>
          ) : (
            <>
              <Eye size={17} />
              Publish business
            </>
          )}
        </button>
      </div>
    </Drawer>
  );
}

function OrderDrawer({
  order,
  businessName,
  onClose,
  onUpdateStatus,
}: {
  order: Order;
  businessName: string;
  onClose: () => void;
  onUpdateStatus: (
    status: string,
  ) => void;
}) {
  return (
    <Drawer onClose={onClose}>
      <div className="border-b border-[#eee6df] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#a46b32]">
              Platform order
            </p>

            <h2 className="mt-1 text-2xl font-black">
              #{order.order_number}
            </h2>

            <p className="mt-1 text-sm text-[#75645a]">
              {businessName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-[#ddd3ca] p-2"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="rounded-2xl bg-[#faf7f4] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#a09187]">
            Total
          </p>

          <p className="mt-1 text-3xl font-black">
            {formatMoney(
              Number(order.total),
            )}
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-wider text-[#a09187]">
            Customer
          </p>

          <div className="space-y-2">
            <InfoRow
              label="Name"
              value={order.customer_name}
            />

            <InfoRow
              label="Phone"
              value={order.customer_phone}
            />

            <InfoRow
              label="Address"
              value={
                order.delivery_address ??
                'Not provided'
              }
            />
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-wider text-[#a09187]">
            Payment
          </p>

          <div className="space-y-2">
            <InfoRow
              label="Method"
              value={
                order.payment_method ??
                'Not specified'
              }
            />

            <InfoRow
              label="Status"
              value={
                order.payment_status
              }
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#a09187]">
            Order status
          </label>

          <select
            value={order.status}
            onChange={(event) =>
              onUpdateStatus(
                event.target.value,
              )
            }
            className="w-full rounded-xl border border-[#ddd3ca] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#a46b32]"
          >
            {ORDER_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status.replaceAll(
                    '_',
                    ' ',
                  )}
                </option>
              ),
            )}
          </select>
        </div>

        <InfoRow
          label="Created"
          value={formatDate(
            order.created_at,
          )}
        />
      </div>
    </Drawer>
  );
}

/* =========================================================
   SHARED COMPONENTS
========================================================= */

function SidebarItem({
  active,
  icon,
  label,
  onClick,
  badge,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
        active
          ? 'bg-white text-[#211813]'
          : 'text-white/65 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}

      <span className="flex-1 text-left">
        {label}
      </span>

      {badge !== undefined &&
        badge > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
              active
                ? 'bg-[#f1e7de] text-[#70452e]'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {badge}
          </span>
        )}
    </button>
  );
}

function MobileNavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${
        active
          ? 'bg-[#2d211c] text-white'
          : 'text-[#5e4d43]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#ddd3ca] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#8a776b]">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 text-xs text-[#9c8c82]">
            {sub}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5eee7] text-[#a46b32]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#ddd3ca] bg-white p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5eee7] text-[#a46b32]">
        {icon}
      </div>

      <div>
        <p className="text-lg font-black">
          {value}
        </p>

        <p className="text-xs text-[#8a776b]">
          {label}
        </p>
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-[#faf7f4] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9c8c82]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
  dark = false,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2
          className={`text-lg font-black ${
            dark ? 'text-white' : ''
          }`}
        >
          {title}
        </h2>

        <p
          className={`mt-1 text-sm ${
            dark
              ? 'text-white/50'
              : 'text-[#75645a]'
          }`}
        >
          {subtitle}
        </p>
      </div>

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          dark
            ? 'bg-white/10 text-[#e4a963]'
            : 'bg-[#f5eee7] text-[#a46b32]'
        }`}
      >
        {icon}
      </div>
    </div>
  );
}

function HealthRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string | number;
  status: 'good' | 'warning';
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full ${
            status === 'good'
              ? 'bg-emerald-400'
              : 'bg-amber-400'
          }`}
        />

        <span className="text-sm text-white/70">
          {label}
        </span>
      </div>

      <span className="font-black">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const completed =
    status === 'completed';

  const cancelled =
    status === 'cancelled';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black capitalize ${
        completed
          ? 'bg-emerald-100 text-emerald-700'
          : cancelled
            ? 'bg-red-100 text-red-700'
            : 'bg-[#f5eee7] text-[#8b5a2b]'
      }`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function SettingRow({
  title,
  value,
  good = false,
}: {
  title: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#faf7f4] p-4">
      <span className="text-sm font-semibold">
        {title}
      </span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${
          good
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#eee6df] p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-[#9c8c82]">
        {label}
      </span>

      <span className="text-sm font-semibold text-[#43352e] sm:text-right">
        {value}
      </span>
    </div>
  );
}

function Drawer({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d9cfc7] p-10 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5eee7] text-[#a46b32]">
        <Activity size={19} />
      </div>

      <p className="text-sm font-semibold text-[#75645a]">
        {text}
      </p>
    </div>
  );
}