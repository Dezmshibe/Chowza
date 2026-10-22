import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BusinessDashboard } from './BusinessDashboard';
import { MenuManager } from './MenuManager';
import { QRCodeModal } from './QRCodeModal';
import { AnalyticsView } from './AnalyticsView';
import { BusinessSettings } from './BusinessSettings';
import { SubscriptionView } from './SubscriptionView';
import { AdminView } from './AdminView';
import { WhatsAppSimulator } from './WhatsAppSimulator';
import { OrderTracker } from './OrderTracker';
import { AppHubView } from './AppHubView';
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
  ArrowLeft,
  Power,
  ChevronRight
} from 'lucide-react';
import { AppView } from '../context/AppContext';

export const BusinessAreaLayout: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    setCurrentArea,
    ownerBusiness,
    businesses,
    setOwnerBusinessId,
    orders,
    toggleBusinessOpen
  } = useApp();

  const pendingOrdersCount = orders.filter(
    (o) => o.businessId === ownerBusiness.id && (o.status === 'Pending' || o.status === 'Confirmed')
  ).length;

  const navItems: {
    view: AppView | 'storefront';
    label: string;
    icon: React.ReactNode;
    badge?: number;
    special?: boolean;
  }[] = [
    {
      view: 'storefront',
      label: 'Storefront',
      icon: <Store className="w-4 h-4 text-[#25D366]" />,
      special: true
    },
    {
      view: 'whatsapp',
      label: 'WhatsApp Bot',
      icon: <MessageCircle className="w-4 h-4 text-[#25D366]" />
    },
    {
      view: 'track',
      label: 'Track Order',
      icon: <Search className="w-4 h-4 text-[#EDA430]" />
    },
    {
      view: 'dashboard',
      label: 'Kitchen',
      icon: <ChefHat className="w-4 h-4 text-[#DD5330]" />,
      badge: pendingOrdersCount
    },
    {
      view: 'menu',
      label: 'Menu',
      icon: <UtensilsCrossed className="w-4 h-4 text-white" />
    },
    {
      view: 'qrcode',
      label: 'QR',
      icon: <QrCode className="w-4 h-4 text-white" />
    },
    {
      view: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4 text-[#0284C7]" />
    },
    {
      view: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4 text-white" />
    },
    {
      view: 'subscription',
      label: 'Billing',
      icon: <CreditCard className="w-4 h-4 text-[#EDA430]" />
    },
    {
      view: 'admin',
      label: 'Admin',
      icon: <ShieldCheck className="w-4 h-4 text-[#25D366]" />
    }
  ];

  const handleNavClick = (view: AppView | 'storefront') => {
    if (view === 'storefront') {
      setCurrentArea('customer');
      setCurrentView('store');
    } else {
      setCurrentView(view);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EEE4] flex flex-col md:flex-row">
      {/* Sidebar on Desktop / Top Bar with Horizontal Tabs on Mobile */}
      <aside className="w-full md:w-64 bg-[#1B1815] text-white shrink-0 md:min-h-screen flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 z-30">
        <div>
          {/* Top Brand & Status */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
            <div>
              <div className="text-[10px] font-bold text-[#EDA430] uppercase tracking-wider">
                Multi-Business Platform
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight mt-0.5">
                CHOWZA
              </h1>
            </div>

            {/* Back to Customer Storefront quick link */}
            <button
              onClick={() => {
                setCurrentArea('customer');
                setCurrentView('store');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#1BA855] transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Customer Store</span>
            </button>
          </div>

          {/* Multi-Business Selector */}
          <div className="p-3 bg-white/5 border-b border-white/10">
            <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
              <span className="text-[#8C857A]">Select Business:</span>
              <button
                onClick={() => toggleBusinessOpen(ownerBusiness.id)}
                className={`text-[10px] font-black px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  ownerBusiness.isOpen
                    ? 'bg-[#E4F9EC] text-[#176B35] border border-[#25D366]/40'
                    : 'bg-[#FBE6E4] text-[#9E2B25] border border-[#9E2B25]/40'
                }`}
                title="Click to toggle store open / closed"
              >
                ● {ownerBusiness.isOpen ? 'STORE OPEN' : 'STORE CLOSED'}
              </button>
            </div>
            <select
              value={ownerBusiness.id}
              onChange={(e) => setOwnerBusinessId(Number(e.target.value))}
              className="w-full text-xs font-extrabold py-2 px-2.5 rounded-lg bg-[#2D2721] text-white border border-white/20 shadow-xs cursor-pointer"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.businessName} ({b.category})
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Items: Permanent Visible List on Desktop & Visible Scrollable Bar on Mobile */}
          <nav className="p-2 sm:p-3 flex md:flex-col gap-1.5 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const isActive =
                item.view === 'storefront' ? false : currentView === item.view;

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.view)}
                  className={`flex items-center justify-between px-3 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 md:shrink border ${
                    item.special
                      ? 'bg-[#25D366]/20 text-[#25D366] border-[#25D366]/50 hover:bg-[#25D366]/30'
                      : isActive
                      ? 'bg-white text-[#1B1815] border-white shadow-sm font-black'
                      : 'bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 px-1.5 py-0.2 rounded-full bg-[#DD5330] text-white text-[10px] font-black animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Desktop Help Banner */}
        <div className="p-4 border-t border-white/10 hidden md:block">
          <div className="p-3 bg-white/5 rounded-xl text-[11px] text-[#8C857A] space-y-1">
            <div className="text-white font-bold flex items-center gap-1">
              <span>{ownerBusiness.businessName}</span>
            </div>
            <p className="truncate">{ownerBusiness.address}</p>
            <p className="text-[10px] text-[#25D366] font-semibold">
              WhatsApp: +{ownerBusiness.whatsappNumber}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden min-h-screen">
        {currentView === 'dashboard' && <BusinessDashboard />}
        {currentView === 'menu' && <MenuManager />}
        {currentView === 'qrcode' && <QRCodeModal />}
        {currentView === 'analytics' && <AnalyticsView />}
        {currentView === 'settings' && <BusinessSettings />}
        {currentView === 'subscription' && <SubscriptionView />}
        {currentView === 'admin' && <AdminView />}
        {currentView === 'whatsapp' && <WhatsAppSimulator />}
        {currentView === 'track' && <OrderTracker />}
        {currentView === 'hub' && <AppHubView />}
      </main>
    </div>
  );
};
