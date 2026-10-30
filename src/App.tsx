import React from 'react';
import { AppProvider, useApp } from './context/AppContext';

import { CustomerApp } from './components/CustomerApp';
import { BusinessApp } from './components/BusinessApp';
import { AdminApp } from './components/AdminApp';
import { ChowzaPageSkeleton } from './components/Skeleton';

import { PublicBusinessStore } from './components/PublicBusinessStore';
import { BusinessPasswordReset } from './components/BusinessPasswordReset';

import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';

const AppContent: React.FC = () => {
  const {
    currentView,
    businessesLoading,
  } = useApp();

  const pathname = window.location.pathname;

  /*
   * ============================================================
   * PRIVACY POLICY
   * ============================================================
   *
   * /privacy
   */
  if (pathname === '/privacy') {
    return <PrivacyPolicy />;
  }

  /*
   * ============================================================
   * TERMS & CONDITIONS
   * ============================================================
   *
   * /terms
   */
  if (pathname === '/terms') {
    return <TermsAndConditions />;
  }

  /*
   * ============================================================
   * REFUND & CANCELLATION POLICY
   * ============================================================
   *
   * /refunds
   */
  if (pathname === '/refunds') {
    return <RefundPolicy />;
  }

  /*
   * ============================================================
   * ADMIN APP
   * ============================================================
   *
   * /admin
   */
  if (pathname === '/admin') {
    return (
      <AdminApp
        onBack={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  /*
   * ============================================================
   * BUSINESS APP
   * ============================================================
   *
   * /business
   */
  if (pathname === '/business') {
    return <BusinessApp />;
  }

  /*
   * ============================================================
   * PASSWORD RESET
   * ============================================================
   */
  if (pathname === '/reset-password') {
    return (
      <BusinessPasswordReset
        onBack={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  /*
   * ============================================================
   * PAYMENT SUCCESS
   * ============================================================
   *
   * This remains available from the PayFast redirect.
   */
  if (pathname === '/payment/success') {
    const params = new URLSearchParams(window.location.search);
    const orderNumber = params.get('orderNumber');

    return (
      <div className="min-h-screen bg-[#F7FAF7] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white border border-[#D7E2DA] p-8 shadow-xl text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
            <span className="text-3xl font-black text-[#15803D]">
              ✓
            </span>
          </div>

          <h1 className="text-2xl font-black text-[#17201A]">
            Payment Successful
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#647067]">
            Your payment was received by PayFast. Chowza is confirming
            the payment and updating your order.
          </p>

          {orderNumber && (
            <div className="mt-5 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#647067]">
                Order Number
              </p>

              <p className="mt-1 text-2xl font-black text-[#166534]">
                #{orderNumber}
              </p>
            </div>
          )}

          <p className="mt-5 text-sm text-[#647067]">
            Your order is now being processed by the business.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            className="mt-6 w-full rounded-xl bg-[#15803D] px-5 py-3 font-bold text-white hover:bg-[#166534] transition-colors"
          >
            Back to Chowza
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * PUBLIC BUSINESS STOREFRONT
   * ============================================================
   *
   * Examples:
   *
   * /business/sbuda
   * /business/mcdonalds
   * /business/some-restaurant
   */
  const pathMatch = pathname.match(/^\/business\/([^/]+)\/?$/);

  if (pathMatch) {
    if (currentView === 'track') {
      return <CustomerApp />;
    }

    return (
      <PublicBusinessStore
        slug={decodeURIComponent(pathMatch[1])}
      />
    );
  }

  /*
   * ============================================================
   * CUSTOMER APP LOADING
   * ============================================================
   *
   * Show the Chowza skeleton while the published businesses
   * are being loaded from Supabase.
   */
  if (businessesLoading) {
    return <ChowzaPageSkeleton />;
  }

  /*
   * ============================================================
   * CUSTOMER APP
   * ============================================================
   *
   * Everything else belongs to the customer application.
   */
  return <CustomerApp />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;