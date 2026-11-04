import React from 'react';
import { AppProvider, useApp } from './context/AppContext';

import { CustomerApp } from './components/CustomerApp';
import { BusinessApp } from './components/BusinessApp';
import { AdminApp } from './components/AdminApp';
import { ChowzaPageSkeleton } from './components/Skeleton';
import { ChowzaHome } from './components/ChowzaHome';
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
  if (pathname === '/') {
  const ssrData = (
    window as Window & {
      __CHOWZA_HOME_DATA__?: {
        businesses?: any[];
        foods?: any[];
      };
    }
  ).__CHOWZA_HOME_DATA__;

  if (ssrData) {
    return (
      <ChowzaHome
        initialBusinesses={ssrData.businesses || []}
        initialFoods={ssrData.foods || []}
      />
    );
  }
}
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
   * PAYMENT RETURN PAGES
   * ============================================================
   *
   * Yoco redirects the browser here, but the redirect itself is
   * not proof that the payment is complete. The Yoco payment confirmation/webhook
   * is the source of truth for the order's payment status.
   */
  const paymentPath =
    pathname === '/payment/success' ||
    pathname === '/payment/failed' ||
    pathname === '/payment/cancelled';

  if (paymentPath) {
    const params = new URLSearchParams(window.location.search);
    const orderNumber = params.get('orderNumber');

    const isSuccess = pathname === '/payment/success';
    const isCancelled = pathname === '/payment/cancelled';

    const title = isSuccess
      ? 'Payment return received'
      : isCancelled
        ? 'Payment cancelled'
        : 'Payment not completed';

    const message = isSuccess
      ? 'Yoco returned you to Chowza. We are confirming the payment with the payment provider before marking your order as paid.'
      : isCancelled
        ? 'The online payment was cancelled. Your order has not been confirmed as paid.'
        : 'The online payment was not completed. You can return to Chowza and try again.';

    return (
      <div className="min-h-screen bg-[#F7FAF7] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white border border-[#D7E2DA] p-8 shadow-xl text-center">
          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
              isSuccess
                ? 'bg-[#DCFCE7]'
                : isCancelled
                  ? 'bg-[#FEF3C7]'
                  : 'bg-[#FEE2E2]'
            }`}
          >
            <span
              className={`text-2xl font-black ${
                isSuccess
                  ? 'text-[#15803D]'
                  : isCancelled
                    ? 'text-[#B45309]'
                    : 'text-[#DC2626]'
              }`}
            >
              {isSuccess ? '✓' : isCancelled ? '!' : '×'}
            </span>
          </div>

          <h1 className="text-2xl font-black text-[#17201A]">
            {title}
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#647067]">
            {message}
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