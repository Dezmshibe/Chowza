import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { CustomerStore } from './components/CustomerStore';
import { CartBottomSheet } from './components/CartBottomSheet';
import { OrderTracker } from './components/OrderTracker';
import { BusinessPortalGate } from './components/BusinessPortalGate';
import { X, MessageCircle, ShieldCheck, Search, ArrowRight } from 'lucide-react';
import { PublicBusinessStore } from './components/PublicBusinessStore';

const AppContent: React.FC = () => {
  const {
    currentArea,
    setCurrentArea,
    currentView,
    setCurrentView,
    flashMessages,
    removeFlash
  } = useApp();

    const pathMatch = window.location.pathname.match(/^\/business\/([^/]+)\/?$/);
const paymentSuccessMatch =
  window.location.pathname === '/payment/success';

if (paymentSuccessMatch) {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get('orderNumber');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-3xl">✓</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Payment Successful
        </h1>

        <p className="mt-3 text-gray-600">
          Your payment was successfully submitted to Yoco.
        </p>

        {orderNumber && (
          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Order Number
            </p>

            <p className="mt-1 text-xl font-bold text-gray-900">
              #{orderNumber}
            </p>
          </div>
        )}

        <p className="mt-5 text-sm text-gray-500">
          Your order is now being processed by the business.
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href = '/';
          }}
          className="mt-6 w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
        >
          Back to Chowza
        </button>
      </div>
    </div>
  );
}
  if (pathMatch) {
  if (currentView === 'track') {
    return <OrderTracker />;
  }

  return <PublicBusinessStore slug={decodeURIComponent(pathMatch[1])} />;
}

  return (
    <div className="min-h-screen flex flex-col bg-[#F3EEE4] text-[#1B1815]">
      {/* Floating Flash Notifications Container */}
      <div className="fixed top-16 right-4 z-50 max-w-md w-full space-y-2 pointer-events-none">
        {flashMessages.map((msg) => (
          <div
            key={msg.id}
            className={`pointer-events-auto shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold p-3.5 rounded-xl border animate-in slide-in-from-top-3 fade-in duration-200 ${
              msg.type === 'error'
                ? 'flash-error'
                : msg.type === 'notice'
                ? 'flash-notice'
                : 'flash'
            }`}
          >
            <span>{msg.text}</span>
            <button
              onClick={() => removeFlash(msg.id)}
              className="opacity-70 hover:opacity-100 p-0.5 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Area 1: Customer / Storefront */}
      {currentArea === 'customer' ? (
        <div className="flex-1 flex flex-col">
          {/* Header has ONLY Chowza brand on the left and Cart on the right */}
          <Navigation />

          {/* Main Customer View */}
          <main className="flex-1">
            {currentView === 'track' ? <OrderTracker /> : <CustomerStore />}
          </main>

          {/* Customer Bottom Sheet Cart */}
          <CartBottomSheet />

          {/* Clean Customer Footer with Business/Admin entry */}
          <footer className="bg-[#1B1815] text-[#8C857A] py-8 px-4 border-t border-white/10 mt-auto">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs">
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-white font-extrabold text-sm">Chowza</span>
                <span>· Digital Food Ordering & Kitchen Platform</span>
              </div>

              {/* Customer Actions & Staff Entry */}
              <div className="flex items-center gap-4 text-white/80">
                <button
                  onClick={() => setCurrentView(currentView === 'track' ? 'store' : 'track')}
                  className="hover:text-white cursor-pointer flex items-center gap-1 font-semibold"
                >
                  <Search className="w-3.5 h-3.5 text-[#EDA430]" />
                  <span>{currentView === 'track' ? 'Back to Menu' : 'Track Order'}</span>
                </button>

                <div className="h-4 w-px bg-white/20" />

                {/* Switch to Business/Admin Controls */}
                <button
                  onClick={() => {
                    setCurrentArea('business');
                    setCurrentView('dashboard');
                  }}
                  className="btn btn-sm btn-outline-white !py-1.5 !px-3 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Restaurant & Admin Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </footer>
        </div>
) : (
  /* Area 2: Business authentication — keep demo admin data private */
  <BusinessPortalGate
  onBack={() => {
    setCurrentArea('customer');
    setCurrentView('store');
  }}
/>
)}</div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
