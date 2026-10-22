import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  MessageCircle,
  Search,
  ChefHat,
  UtensilsCrossed,
  QrCode,
  BarChart3,
  Settings,
  CreditCard,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Sparkles,
  Power,
  Clock
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const AppHubView: React.FC = () => {
  const {
    setCurrentView,
    ownerBusiness,
    orders,
    foods,
    toggleBusinessOpen
  } = useApp();

  const pendingOrdersCount = orders.filter(
    (o) => o.businessId === ownerBusiness.id && (o.status === 'Pending' || o.status === 'Confirmed')
  ).length;

  const businessFoodsCount = foods.filter((f) => f.businessId === ownerBusiness.id).length;

  return (
    <div className="container--wide py-8 space-y-8">
      {/* Hub Hero Header */}
      <div className="bg-gradient-to-r from-[#1B1815] to-[#2D2721] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge bg-[#25D366] text-white font-extrabold text-xs">
              Chowza Navigation Hub
            </span>
            <span className="text-xs text-white/60">Manage all tools & portals</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Portals & System Sections
          </h1>

          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
            Access the customer digital menu, live kitchen order queue, menu editor, table QR codes, and analytics from one organized hub.
          </p>
        </div>

        {/* Quick status & open/closed toggle */}
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 space-y-2 shrink-0 w-full sm:w-auto">
          <div className="text-xs text-white/70">
            Active Store: <strong className="text-white">{ownerBusiness.businessName}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleBusinessOpen(ownerBusiness.id)}
              className={`btn btn-sm text-xs font-bold w-full flex items-center justify-center gap-2 ${
                ownerBusiness.isOpen
                  ? 'bg-[#25D366] text-white hover:bg-[#1BA855]'
                  : 'bg-[#9E2B25] text-white hover:bg-[#7D221D]'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>Store is {ownerBusiness.isOpen ? 'OPEN' : 'CLOSED'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Customer Ordering */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[#25D366]" />
          <h2 className="text-lg font-bold text-[#1B1815]">Customer Ordering Channels</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Storefront */}
          <button
            onClick={() => setCurrentView('store')}
            className="card p-5 text-left hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#25D366] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E4F9EC] text-[#176B35] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5 text-[#25D366]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815] group-hover:text-[#25D366] transition-colors">
                Customer Storefront
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Clean customer browsing menu with dish photos, bottom-sheet cart, and online checkout.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between text-xs font-bold text-[#25D366]">
              <span>Open Storefront</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* WhatsApp Bot */}
          <button
            onClick={() => setCurrentView('whatsapp')}
            className="card p-5 text-left hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#25D366] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E4F9EC] text-[#176B35] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815] group-hover:text-[#25D366] transition-colors">
                WhatsApp Bot Simulator
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Test the interactive conversational ordering bot simulating the Meta Cloud API webhook.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between text-xs font-bold text-[#25D366]">
              <span>Launch Simulator</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Track Order */}
          <button
            onClick={() => setCurrentView('track')}
            className="card p-5 text-left hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#EDA430] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FCF0DC] text-[#B87A1D] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5 text-[#EDA430]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815] group-hover:text-[#B87A1D] transition-colors">
                Live Order Tracking
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Track incoming kitchen statuses, prep timers, delivery status, and customer cancellation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between text-xs font-bold text-[#B87A1D]">
              <span>Track Orders</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Section 2: Restaurant & Kitchen Staff Operations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-[#DD5330]" />
          <h2 className="text-lg font-bold text-[#1B1815]">Restaurant & Kitchen Operations</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Kitchen Orders */}
          <button
            onClick={() => setCurrentView('dashboard')}
            className="card p-5 text-left hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#DD5330] flex flex-col justify-between group relative"
          >
            {pendingOrdersCount > 0 && (
              <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[#DD5330] text-white text-xs font-black animate-pulse">
                {pendingOrdersCount} Active
              </span>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FBEAE2] text-[#B33F22] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ChefHat className="w-5 h-5 text-[#DD5330]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815] group-hover:text-[#DD5330] transition-colors">
                Kitchen Live Queue
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Real-time incoming orders, preparation timers, audio alerts, and WhatsApp status updates.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between text-xs font-bold text-[#DD5330]">
              <span>Open Kitchen Queue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Menu Manager */}
          <button
            onClick={() => setCurrentView('menu')}
            className="card p-5 text-left hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#1B1815] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F3EEE4] text-[#1B1815] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5 text-[#1B1815]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815] transition-colors">
                Digital Menu Manager
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Add, edit, or remove dishes ({businessFoodsCount} items), change prices, and toggle in-stock/popular status.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between text-xs font-bold text-[#1B1815]">
              <span>Manage Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Table QR Standee */}
          <button
            onClick={() => setCurrentView('qrcode')}
            className="card p-5 text-left hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#1B1815] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F3EEE4] text-[#1B1815] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5 text-[#1B1815]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815] transition-colors">
                Table QR Standees
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Generate printable table and takeout counter QR posters for direct phone scanning.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between text-xs font-bold text-[#1B1815]">
              <span>View & Print QR</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Sales Analytics */}
          <button
            onClick={() => setCurrentView('analytics')}
            className="card p-5 text-left hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#1B1815] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F3EEE4] text-[#1B1815] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5 text-[#0284C7]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815] transition-colors">
                Sales & Funnel Analytics
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Conversion funnel metrics, daily revenue charts, and top bestselling dishes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between text-xs font-bold text-[#0284C7]">
              <span>View Analytics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Store Settings */}
          <button
            onClick={() => setCurrentView('settings')}
            className="card p-5 text-left hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#1B1815] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F3EEE4] text-[#1B1815] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Settings className="w-5 h-5 text-[#5A544C]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815] transition-colors">
                Store Settings
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Update business hours, delivery radius & fee, EFT bank details, and Yoco credentials.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between text-xs font-bold text-[#5A544C]">
              <span>Configure Settings</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Subscription & Billing */}
          <button
            onClick={() => setCurrentView('subscription')}
            className="card p-5 text-left hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#EDA430] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FCF0DC] text-[#B87A1D] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5 text-[#EDA430]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815] transition-colors">
                Plans & PayFast Billing
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Starter (R99), Growth (R199), and Pro (R399) plans, trial counter, and payment setup.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between text-xs font-bold text-[#EDA430]">
              <span>Manage Plan</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Section 3: Platform Admin & App Install */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#25D366]" />
          <h2 className="text-lg font-bold text-[#1B1815]">Administration & App Installation</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Super Admin */}
          <button
            onClick={() => setCurrentView('admin')}
            className="card p-5 text-left hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#1B1815] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E4F9EC] text-[#176B35] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-[#25D366]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815]">
                Super Admin Dashboard
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Platform-wide GMV, vendor verification management, store suspensions, and global order audit.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between text-xs font-bold text-[#176B35]">
              <span>Open Admin Panel</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* PWA App Installation Card */}
          <div className="card p-5 flex flex-col justify-between border-2 border-[#1B1815]/10 bg-[#FDFBF7]">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1B1815] text-white flex items-center justify-center mb-3">
                <Smartphone className="w-5 h-5 text-[#25D366]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B1815]">
                Install as Mobile / Tablet App
              </h3>
              <p className="text-xs text-[#5A544C] mt-1 leading-relaxed">
                Install Chowza to your phone or kitchen tablet home screen for a fullscreen native experience with no browser address bar.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between">
              <span className="text-xs font-bold text-[#5A544C]">Progressive Web App</span>
              <PWAInstallButton compact={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
