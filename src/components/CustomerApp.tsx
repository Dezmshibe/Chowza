import React from 'react';
import { MessageCircle, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Navigation } from './Navigation';
import { CustomerStore } from './CustomerStore';
import { CartBottomSheet } from './CartBottomSheet';
import { OrderTracker } from './OrderTracker';

export const CustomerApp: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    flashMessages,
    removeFlash,
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF7] text-[#17201A]">

      {/* Flash notifications */}
      <div className="fixed top-16 right-4 z-50 max-w-md w-full space-y-2 pointer-events-none">
        {flashMessages.map((msg) => (
          <div
            key={msg.id}
            className={`pointer-events-auto shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold p-3.5 rounded-xl border ${
              msg.type === 'error'
                ? 'flash-error'
                : msg.type === 'notice'
                ? 'flash-notice'
                : 'flash'
            }`}
          >
            <span>{msg.text}</span>

            <button
              type="button"
              onClick={() => removeFlash(msg.id)}
              className="opacity-70 hover:opacity-100 p-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Customer navigation */}
      <Navigation />

      {/* Customer content */}
      <main className="flex-1">
        {currentView === 'track' ? (
          <OrderTracker />
        ) : (
          <CustomerStore />
        )}
      </main>

      {/* Cart */}
      <CartBottomSheet />

      {/* Customer footer */}
      <footer className="bg-[#17201A] text-[#647067] py-8 px-4 border-t border-white/10 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#22C55E] text-white flex items-center justify-center font-bold text-xs">
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
            </div>

            <span className="text-white font-extrabold text-sm">
              Chowza
            </span>

            <span>· Digital Food Ordering</span>
          </div>

          <button
            type="button"
            onClick={() =>
              setCurrentView(
                currentView === 'track'
                  ? 'store'
                  : 'track'
              )
            }
            className="hover:text-white flex items-center gap-1 font-semibold"
          >
            <Search className="w-3.5 h-3.5 text-[#22C55E]" />

            <span>
              {currentView === 'track'
                ? 'Back to Menu'
                : 'Track Order'}
            </span>
          </button>

        </div>
      </footer>
    </div>
  );
};