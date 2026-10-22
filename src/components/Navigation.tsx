import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ShoppingBag,
  MessageCircle,
  Menu as MenuIcon,
  X,
  Search,
  Store,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const {
    cart,
    cartTotal,
    setIsCartOpen,
    setCurrentView,
    setCurrentArea,
    currentView
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="topbar sticky top-0 z-40 shadow-sm bg-[#1B1815] py-2.5 px-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left: Chowza Brand */}
          <button
            onClick={() => {
              setCurrentView('store');
              setIsMenuOpen(false);
            }}
            className="brand text-white hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-xs">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <span className="text-white font-bold tracking-tight text-xl font-display">
              Chowza
            </span>
          </button>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop-only quick links */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setCurrentView('track')}
                className="text-white/80 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#EDA430]" />
                <span>Track Order</span>
              </button>

              <PWAInstallButton compact={true} />
            </div>

            {/* Cart Button (Always visible on mobile & desktop) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm font-bold !py-1.5 !px-3.5 text-xs cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalCartItems > 0 && (
                <span className="bg-white text-[#1B1815] text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                  {totalCartItems}
                </span>
              )}
              {totalCartItems > 0 && (
                <span className="border-l border-white/30 pl-1.5 ml-0.5 text-white text-xs">
                  R{cartTotal.toFixed(2)}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer ml-1"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Drawer */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/10 max-w-4xl mx-auto space-y-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => {
                setCurrentView('store');
                setIsMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                currentView === 'store'
                  ? 'bg-white text-[#1B1815]'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Store className="w-4 h-4 text-[#25D366]" />
              <span>Browse Digital Menu</span>
            </button>

            <button
              onClick={() => {
                setCurrentView('track');
                setIsMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                currentView === 'track'
                  ? 'bg-white text-[#1B1815]'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Search className="w-4 h-4 text-[#EDA430]" />
              <span>Track Live Order</span>
            </button>

            <button
              onClick={() => {
                setCurrentArea('business');
                setCurrentView('whatsapp');
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>WhatsApp Bot Simulator</span>
            </button>

            <button
              onClick={() => {
                setCurrentArea('business');
                setCurrentView('dashboard');
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between text-[#EDA430] bg-white/10 hover:bg-white/15 transition-colors cursor-pointer border border-[#EDA430]/30"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                <span>Restaurant & Admin Portal</span>
              </div>
              <span className="text-[10px] text-white/60 uppercase">Staff →</span>
            </button>

            <div className="pt-2 px-1">
              <PWAInstallButton compact={false} />
            </div>
          </div>
        )}
      </header>
    </>
  );
};
