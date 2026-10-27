import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // If already running in standalone app mode
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E4F9EC] text-[#166534] text-[11px] font-bold">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
        <span>App Active</span>
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`cursor-pointer transition-all inline-flex items-center gap-1.5 ${
          compact
            ? 'px-2.5 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10 font-semibold rounded-lg border border-white/15'
            : 'btn btn-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs'
        }`}
        title="Install Chowza onto your phone or computer home screen"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#22C55E]" />
        <span>Install App</span>
      </button>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#17201A]/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#17201A]/10">
              <h3 className="text-base font-bold text-[#17201A] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#22C55E]" />
                <span>Install on iPhone / iPad</span>
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-[#647067] hover:text-[#17201A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-[#647067] leading-relaxed">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#F7FAF7] text-[#17201A] font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  Tap the <strong className="text-[#17201A]">Share</strong> button{' '}
                  <Share2 className="w-3.5 h-3.5 inline text-[#0284C7]" /> at the bottom or top of your Safari screen.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#F7FAF7] text-[#17201A] font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  Scroll down and tap <strong className="text-[#17201A]">Add to Home Screen</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-[#17201A]" />.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#F7FAF7] text-[#17201A] font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  Tap <strong className="text-[#17201A]">Add</strong> in the top right. Chowza will launch like a full-screen native app!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="btn btn-dark btn-block btn-sm font-bold"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Chrome / Desktop Guide Modal */}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#17201A]/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#17201A]/10">
              <h3 className="text-base font-bold text-[#17201A] flex items-center gap-2">
                <Download className="w-4 h-4 text-[#22C55E]" />
                <span>Install Chowza App</span>
              </h3>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="text-[#647067] hover:text-[#17201A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="py-4 text-xs text-[#647067] leading-relaxed">
              To install on your phone or desktop: tap your browser menu (<strong>⋮</strong> or <strong>Share</strong>) and choose{' '}
              <strong className="text-[#17201A]">"Install App"</strong> or <strong className="text-[#17201A]">"Add to Home screen"</strong>.
              <br /><br />
              Once installed, Chowza opens in standalone mode without browser toolbars, perfect for restaurant kitchen tablets and quick customer ordering!
            </p>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="btn btn-primary btn-block btn-sm font-bold"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
