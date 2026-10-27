import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Filter,
  Phone,
  MessageCircle,
  Power,
  RotateCcw,
  Timer
} from 'lucide-react';
import { OrderStatus } from '../types';

export const BusinessDashboard: React.FC = () => {
  const {
    ownerBusiness,
    businesses,
    setOwnerBusinessId,
    orders,
    updateOrderStatus,
    updatePaymentStatus,
    toggleBusinessOpen,
    setCurrentView
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('Active');
  const [prepMinutesMap, setPrepMinutesMap] = useState<Record<number, number>>({});

  const businessOrders = orders.filter((o) => o.businessId === ownerBusiness.id);

  const filteredOrders = businessOrders.filter((o) => {
    if (statusFilter === 'Active') {
      return ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status);
    }
    if (statusFilter === 'Completed') return o.status === 'Completed';
    if (statusFilter === 'Cancelled') return o.status === 'Cancelled';
    return true;
  });

  // Calculate metrics
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = businessOrders.filter((o) => o.orderDay === today);
  const todaySales = todayOrders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const activeCount = businessOrders.filter((o) =>
    ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)
  ).length;

  const handlePrepTimeChange = (orderId: number, mins: number) => {
    setPrepMinutesMap((prev) => ({ ...prev, [orderId]: mins }));
  };

  return (
    <div className="container--wide py-6 space-y-6">
      {/* Top Header & Store Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#17201A]/10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#17201A] tracking-tight">
              Kitchen Live Queue
            </h1>

            {/* Restaurant Selector for Multi-Tenant Testing */}
            <select
              value={ownerBusiness.id}
              onChange={(e) => setOwnerBusinessId(Number(e.target.value))}
              className="text-xs font-bold py-1.5 px-3 rounded-lg border border-[#17201A]/20 bg-white shadow-xs max-w-xs"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.businessName} ({b.isOpen ? 'Open' : 'Closed'})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-[#647067] mt-1">
            Real-time incoming orders, preparation timers and WhatsApp delivery notifications.
          </p>
        </div>

        {/* Operating Status Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleBusinessOpen(ownerBusiness.id)}
            className={`btn btn-sm font-bold shadow-xs flex items-center gap-2 ${
              ownerBusiness.isOpen
                ? 'bg-[#E4F9EC] text-[#166534] hover:bg-[#d0f2dc] border border-[#22C55E]/40'
                : 'bg-[#FBE6E4] text-[#EF4444] hover:bg-[#f5d2cf] border border-[#EF4444]/40'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>Store Status: {ownerBusiness.isOpen ? 'OPEN' : 'CLOSED'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 bg-white border-l-4 border-l-[#15803D]">
          <div className="text-xs font-bold uppercase tracking-wider text-[#647067]">
            Active Orders
          </div>
          <div className="text-2xl font-black text-[#17201A] mt-1">
            {activeCount}
          </div>
          <div className="text-xs text-[#647067] mt-0.5">In kitchen / on the road</div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-[#22C55E]">
          <div className="text-xs font-bold uppercase tracking-wider text-[#647067]">
            Today's Revenue
          </div>
          <div className="text-2xl font-black text-[#166534] mt-1">
            R{todaySales.toFixed(2)}
          </div>
          <div className="text-xs text-[#647067] mt-0.5">{todayOrders.length} orders today</div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-[#22C55E]">
          <div className="text-xs font-bold uppercase tracking-wider text-[#647067]">
            Avg Prep Speed
          </div>
          <div className="text-2xl font-black text-[#166534] mt-1">
            22 mins
          </div>
          <div className="text-xs text-[#647067] mt-0.5">Target: under 25m</div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-[#17201A]">
          <div className="text-xs font-bold uppercase tracking-wider text-[#647067]">
            Subscription
          </div>
          <div className="text-xl font-black text-[#17201A] mt-1 capitalize">
            {ownerBusiness.plan} Plan
          </div>
          <button
            onClick={() => setCurrentView('subscription')}
            className="text-xs font-bold text-[#15803D] hover:underline"
          >
            Manage billing →
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {(['Active', 'All', 'Completed', 'Cancelled'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === filter
                  ? 'bg-[#17201A] text-white shadow-xs'
                  : 'bg-[#F7FAF7] text-[#647067] hover:bg-black/10'
              }`}
            >
              {filter}
              {filter === 'Active' && activeCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-[#15803D] text-white rounded-full text-[10px]">
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#647067] flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Real-time polling active (every 5s)</span>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="card empty-state">
          <ChefHat className="w-12 h-12 mx-auto text-[#647067]/40 mb-3" />
          <strong>No {statusFilter.toLowerCase()} orders</strong>
          <p className="text-sm">
            Place an order from the Storefront or WhatsApp Bot to watch it appear here live!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const prepMinutes = prepMinutesMap[order.id] || order.estimatedPrepMinutes || 20;

            return (
              <div
                key={order.id}
                className={`card p-4 transition-all duration-200 border-2 ${
                  order.status === 'Pending'
                    ? 'border-[#22C55E] bg-[#F0FDF4]/20 shadow-md ring-2 ring-[#22C55E]/20'
                    : order.status === 'Preparing'
                    ? 'border-[#15803D]/40'
                    : 'border-[#17201A]/10'
                }`}
              >
                {/* Order Top Line */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#17201A]/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-[#17201A]">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`badge text-xs ${
                          order.status === 'Pending'
                            ? 'badge-pending'
                            : order.status === 'Confirmed'
                            ? 'badge-confirmed'
                            : order.status === 'Preparing'
                            ? 'badge-preparing'
                            : order.status === 'Ready' || order.status === 'Out for Delivery'
                            ? 'badge-delivery'
                            : order.status === 'Completed'
                            ? 'badge-completed'
                            : 'badge-cancelled'
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="text-xs text-[#647067]">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-[#17201A] mt-1">
                      {order.customerName} ·{' '}
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-[#0284C7] hover:underline font-normal text-xs"
                      >
                        {order.customerPhone}
                      </a>
                    </div>

                    <div className="text-xs text-[#647067] flex items-center gap-1.5 mt-0.5">
                      {order.fulfillmentType === 'Delivery' ? (
                        <>
                          <Truck className="w-3.5 h-3.5 text-[#22C55E]" />
                          <span>Delivery: {order.customerAddress || 'No address provided'}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-[#22C55E]" />
                          <span>Pickup at counter</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-[#15803D]">
                      R{order.total.toFixed(2)}
                    </div>
                    <button
                      onClick={() =>
                        updatePaymentStatus(
                          order.id,
                          order.paymentStatus === 'Paid' ? 'Awaiting Payment' : 'Paid'
                        )
                      }
                      className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        order.paymentStatus === 'Paid'
                          ? 'bg-[#E4F9EC] text-[#166534]'
                          : 'bg-[#F0FDF4] text-[#166534]'
                      }`}
                    >
                      {order.paymentMethod} · {order.paymentStatus}
                    </button>
                  </div>
                </div>

                {/* Items in order */}
                <div className="py-3 space-y-1 text-xs">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[#17201A]">
                      <span className="font-bold">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-[#647067]">R{item.total.toFixed(2)}</span>
                    </div>
                  ))}

                  {order.customerNote && (
                    <div className="mt-2 p-2 bg-[#F7FAF7] rounded text-[#166534] font-semibold text-[11px]">
                      Kitchen Note: "{order.customerNote}"
                    </div>
                  )}
                </div>

                {/* Action Toolbar for Kitchen Operator */}
                <div className="pt-3 border-t border-[#17201A]/10 flex flex-wrap items-center justify-between gap-2">
                  {/* Status Transition Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {order.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'Confirmed')}
                          className="btn btn-primary btn-sm text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Order</span>
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                          className="btn btn-danger btn-sm text-xs font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {order.status === 'Confirmed' && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-[#647067]">
                          <Timer className="w-3.5 h-3.5 text-[#15803D]" />
                          <span>Prep:</span>
                          <select
                            value={prepMinutes}
                            onChange={(e) => handlePrepTimeChange(order.id, Number(e.target.value))}
                            className="!py-1 !px-2 text-xs font-bold"
                          >
                            <option value={15}>15 min</option>
                            <option value={20}>20 min</option>
                            <option value={25}>25 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                          </select>
                        </div>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'Preparing', prepMinutes)}
                          className="btn btn-paprika btn-sm text-xs font-bold"
                        >
                          Start Preparing
                        </button>
                      </div>
                    )}

                    {order.status === 'Preparing' && (
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            order.id,
                            order.fulfillmentType === 'Pickup' ? 'Ready' : 'Out for Delivery'
                          )
                        }
                        className="btn btn-primary btn-sm text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1]"
                      >
                        {order.fulfillmentType === 'Pickup'
                          ? 'Mark Ready for Pickup'
                          : 'Send Out for Delivery'}
                      </button>
                    )}

                    {(order.status === 'Ready' || order.status === 'Out for Delivery') && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Completed')}
                        className="btn btn-primary btn-sm text-xs font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Order Completed</span>
                      </button>
                    )}

                    {order.status === 'Completed' && (
                      <span className="text-xs text-[#166534] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Order Completed</span>
                      </span>
                    )}
                  </div>

                  {/* Customer WhatsApp Notification Link */}
                  <a
                    href={`https://wa.me/${order.customerPhone}?text=Hi%20${encodeURIComponent(
                      order.customerName
                    )},%20update%20on%20Order%20%23${order.orderNumber}:%20your%20order%20status%20is%20now%20${
                      order.status
                    }.`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#166534] hover:underline flex items-center gap-1"
                    title="Send status text directly via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>WhatsApp Customer</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
