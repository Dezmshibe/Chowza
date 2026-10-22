import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  TrendingUp,
  CreditCard,
  Users,
  Store
} from 'lucide-react';
import { VerificationStatus } from '../types';

export const AdminView: React.FC = () => {
  const {
    businesses,
    orders,
    toggleBusinessSuspension,
    updateBusinessVerification,
    setSelectedStoreBusiness,
    setCurrentView
  } = useApp();

  const totalBusinesses = businesses.length;
  const activeBusinesses = businesses.filter((b) => b.active && !b.suspended).length;
  const suspendedBusinesses = businesses.filter((b) => b.suspended).length;
  const pendingVerification = businesses.filter((b) => b.verificationStatus === 'pending').length;

  const totalOrders = orders.length;
  const totalGMV = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const subscriptionRevenue = businesses
    .filter((b) => b.subscriptionStatus === 'active')
    .reduce((sum, b) => {
      const price = b.plan === 'pro' ? 399 : b.plan === 'growth' ? 199 : 99;
      return sum + price;
    }, 0);

  return (
    <div className="container--wide py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1B1815]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-[#1B1815] text-[#F3EEE4] font-bold text-xs">
              Super Admin Platform
            </span>
            <span className="text-xs text-[#8C857A]">Chowza Multi-Tenant Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1B1815] tracking-tight mt-1">
            Platform Administration
          </h1>
        </div>

        <div className="text-xs text-[#5A544C] bg-white px-3 py-1.5 rounded-lg border border-[#1B1815]/10 font-mono">
          Security Hardening Level: Pass 25 (Active)
        </div>
      </div>

      {/* High-level Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-white border-l-4 border-l-[#25D366]">
          <div className="text-xs font-bold text-[#8C857A] uppercase">Platform GMV</div>
          <div className="text-2xl font-black text-[#176B35] mt-1">
            R{totalGMV.toFixed(2)}
          </div>
          <div className="text-xs text-[#5A544C] mt-0.5">{totalOrders} total orders processed</div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-[#0284C7]">
          <div className="text-xs font-bold text-[#8C857A] uppercase">SaaS MRR (PayFast)</div>
          <div className="text-2xl font-black text-[#0284C7] mt-1">
            R{subscriptionRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-[#5A544C] mt-0.5">Monthly software fees</div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-[#EDA430]">
          <div className="text-xs font-bold text-[#8C857A] uppercase">Total Food Spots</div>
          <div className="text-2xl font-black text-[#1B1815] mt-1">
            {totalBusinesses}
          </div>
          <div className="text-xs text-[#176B35] mt-0.5 font-semibold">
            {activeBusinesses} active · {suspendedBusinesses} suspended
          </div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-[#DD5330]">
          <div className="text-xs font-bold text-[#8C857A] uppercase">Verification Queue</div>
          <div className="text-2xl font-black text-[#B33F22] mt-1">
            {pendingVerification}
          </div>
          <div className="text-xs text-[#5A544C] mt-0.5">Awaiting compliance review</div>
        </div>
      </div>

      {/* Businesses Management Table */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1B1815]">Registered Restaurants & Vendors</h2>
          <span className="text-xs text-[#8C857A]">{businesses.length} total vendors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1B1815]/10 text-[#8C857A] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Business</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">WhatsApp / Phone</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B1815]/5 font-medium">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-[#F3EEE4]/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-extrabold text-[#1B1815] text-sm">{b.businessName}</div>
                    <div className="text-[#8C857A] text-[11px]">{b.ownerName} · /{b.slug}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-[#F3EEE4] text-[#5A544C] font-semibold">
                      {b.category}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-xs">
                    +{b.whatsappNumber}
                  </td>

                  <td className="py-3 px-3 capitalize">
                    <span className="font-bold text-[#1B1815]">{b.plan}</span>
                    <span className="text-[10px] text-[#8C857A] block">({b.subscriptionStatus})</span>
                  </td>

                  <td className="py-3 px-3">
                    <select
                      value={b.verificationStatus}
                      onChange={(e) =>
                        updateBusinessVerification(
                          b.id,
                          e.target.value as VerificationStatus,
                          'Updated by administrator'
                        )
                      }
                      className="text-xs font-bold !py-1 !px-2 rounded border border-[#1B1815]/15 bg-white"
                    >
                      <option value="verified">Verified ✓</option>
                      <option value="under_review">Under Review</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected ✕</option>
                    </select>
                  </td>

                  <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedStoreBusiness(b);
                        setCurrentView('store');
                      }}
                      className="btn btn-outline btn-sm text-xs font-bold py-1 px-2.5"
                    >
                      View Menu
                    </button>

                    <button
                      onClick={() => toggleBusinessSuspension(b.id)}
                      className={`btn btn-sm text-xs font-bold py-1 px-2.5 ${
                        b.suspended
                          ? 'btn-primary'
                          : 'btn-danger'
                      }`}
                    >
                      {b.suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Orders Stream */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1B1815]">Recent Orders Across All Vendors</h2>
          <span className="text-xs text-[#8C857A]">Global audit trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1B1815]/10 text-[#8C857A] font-bold uppercase tracking-wider">
                <th className="py-2 px-3">Order</th>
                <th className="py-2 px-3">Vendor</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Items</th>
                <th className="py-2 px-3">Total</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B1815]/5">
              {orders.map((o) => {
                const vendor = businesses.find((b) => b.id === o.businessId);
                return (
                  <tr key={o.id}>
                    <td className="py-2.5 px-3 font-mono font-bold">#{o.orderNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#1B1815]">
                      {vendor?.businessName || `Vendor #${o.businessId}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <div>{o.customerName}</div>
                      <div className="text-[11px] text-[#8C857A]">{o.customerPhone}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[#5A544C]">
                      {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 font-black text-[#DD5330]">
                      R{o.total.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="badge text-[10px] font-bold">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
