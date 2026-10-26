import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  MessageCircle,
  Search,
  ShoppingBag,
} from 'lucide-react';

type ConfirmationItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  line_total: number;
};

type OrderConfirmationProps = {
  businessName: string;
  orderNumber: number;
  customerName: string;
  total: number;
  paymentMethod: 'cash' | 'eft' | 'online';
  items: ConfirmationItem[];
  onTrackOrder: () => void;
  onBackToStore: () => void;
};

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  businessName,
  orderNumber,
  customerName,
  total,
  paymentMethod,
  items,
  onTrackOrder,
  onBackToStore,
}) => {
  const [printing, setPrinting] = useState(true);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPrinting(false);
      setPrinted(true);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, []);

  const paymentLabel =
    paymentMethod === 'cash'
      ? 'CASH'
      : paymentMethod === 'eft'
        ? 'EFT'
        : 'CARD / ONLINE';

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(String(orderNumber));
    } catch {
      // Clipboard access may not be available in every browser.
    }
  };

  const money = (amount: number) =>
    `R${Number(amount).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-[#E7E2D8] px-4 py-8 md:py-12 text-[#171717]">

      <style>
        {`
          @keyframes receiptPrint {
            0% {
              transform: translateY(-100%);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes printerLight {
            0%, 100% {
              opacity: 0.35;
            }
            50% {
              opacity: 1;
            }
          }

          @keyframes receiptFade {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .receipt-printing {
            animation: receiptPrint 2.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          }

          .receipt-finished {
            animation: receiptFade 0.5s ease-out forwards;
          }

          .printer-light {
            animation: printerLight 0.8s ease-in-out infinite;
          }
        `}
      </style>

      <div className="mx-auto w-full max-w-md">

        {/* Virtual receipt printer */}
        <div className="relative z-20">

          <div className="mx-auto w-[92%] rounded-t-2xl bg-[#242424] px-6 pt-5 pb-4 shadow-xl">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">
                  Chowza
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                    
                </p>
              </div>

              <div
                className={`h-3 w-3 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)] ${
                  printing ? 'printer-light' : ''
                }`}
              />
            </div>

            <div className="mt-4 h-2 rounded-full bg-black/70" />

          </div>

          {/* Paper slot */}
          <div className="relative mx-auto -mt-1 h-5 w-[96%] rounded-b-lg bg-[#111] shadow-lg">
            <div className="absolute inset-x-8 top-1 h-1 rounded-full bg-black/70" />
          </div>

        </div>

        {/* Receipt coming out of printer */}
        <div className="relative z-10 -mt-1 overflow-hidden">

          <div
            className={`origin-top bg-[#FFFDF7] px-6 py-7 shadow-[0_12px_35px_rgba(0,0,0,0.18)] ${
              printing
                ? 'receipt-printing'
                : 'receipt-finished'
            }`}
            style={{
              clipPath:
                'polygon(0 0,100% 0,100% 99%,98% 100%,96% 99%,94% 100%,92% 99%,90% 100%,88% 99%,86% 100%,84% 99%,82% 100%,80% 99%,78% 100%,76% 99%,74% 100%,72% 99%,70% 100%,68% 99%,66% 100%,64% 99%,62% 100%,60% 99%,58% 100%,56% 99%,54% 100%,52% 99%,50% 100%,48% 99%,46% 100%,44% 99%,42% 100%,40% 99%,38% 100%,36% 99%,34% 100%,32% 99%,30% 100%,28% 99%,26% 100%,24% 99%,22% 100%,20% 99%,18% 100%,16% 99%,14% 100%,12% 99%,10% 100%,8% 99%,6% 100%,4% 99%,2% 100%,0 99%)',
            }}
          >

            {/* Header */}
            <div className="text-center font-mono">

              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-black">
                  <ShoppingBag size={23} strokeWidth={2.5} />
                </div>
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-[0.18em]">
                CHOWZA
              </h1>

              <p className="mt-1 text-xs uppercase tracking-[0.2em]">
                Digital Food Ordering
              </p>

              <div className="my-5 border-t border-dashed border-black" />

              <h2 className="text-lg font-bold uppercase">
                {businessName}
              </h2>

              <p className="mt-1 text-xs">
                ORDER RECEIPT
              </p>

            </div>

            {/* Order details */}
            <div className="mt-5 font-mono text-xs">

              <div className="flex items-center justify-between border-b border-dashed border-black pb-3">
                <div>
                  <p className="text-[10px] uppercase text-black/60">
                    Order No.
                  </p>

                  <p className="mt-1 text-xl font-black">
                    #{orderNumber}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyOrderNumber}
                  className="flex items-center gap-1 rounded border border-black px-2 py-1 text-[10px] font-bold uppercase"
                >
                  <Copy size={12} />
                  Copy
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-dashed border-black py-3">

                <div>
                  <p className="text-[10px] uppercase text-black/60">
                    Customer
                  </p>

                  <p className="mt-1 font-bold">
                    {customerName}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase text-black/60">
                    Payment
                  </p>

                  <p className="mt-1 font-bold">
                    {paymentLabel}
                  </p>
                </div>

              </div>

            </div>

            {/* Items */}
            <div className="mt-5 font-mono">

              <div className="flex items-center justify-between border-b border-black pb-2 text-[10px] font-bold uppercase">
                <span>Item</span>
                <span>Total</span>
              </div>

              <div className="divide-y divide-dashed divide-black/30">

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3"
                  >

                    <div className="flex items-start justify-between gap-3 text-xs">

                      <div className="min-w-0">
                        <p className="font-bold uppercase">
                          {item.name}
                        </p>

                        <p className="mt-1 text-[10px] text-black/60">
                          {item.quantity} x {money(item.price)}
                        </p>
                      </div>

                      <p className="shrink-0 font-bold">
                        {money(item.line_total)}
                      </p>

                    </div>

                  </div>
                ))}

              </div>

            </div>

            {/* Total */}
            <div className="mt-3 border-t-2 border-black pt-4 font-mono">

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase">
                  Total
                </span>

                <span className="text-2xl font-black">
                  {money(total)}
                </span>
              </div>

            </div>

            {/* Payment message */}
            <div className="mt-5 border-y border-dashed border-black py-4 text-center font-mono text-xs">

              {paymentMethod === 'cash' ? (
                <>
                  <p className="font-bold uppercase">
                    Cash Payment
                  </p>

                  <p className="mt-1 text-[10px]">
                    Please have the exact amount ready.
                  </p>
                </>
              ) : paymentMethod === 'online' ? (
                <>
                  <p className="font-bold uppercase">
                    Online Payment
                  </p>

                  <p className="mt-1 text-[10px]">
                    Payment processed securely through Yoco.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold uppercase">
                    EFT Payment
                  </p>

                  <p className="mt-1 text-[10px]">
                    Payment instructions will be provided by the business.
                  </p>
                </>
              )}

            </div>

            {/* Success */}
            <div className="mt-6 text-center font-mono">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-black">
                <Check size={25} strokeWidth={3} />
              </div>

              <p className="mt-3 text-lg font-black tracking-[0.12em]">
                ORDER RECEIVED
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-[0.16em]">
                Thank you for ordering with Chowza
              </p>

            </div>

            {/* Fake barcode */}
            <div className="mt-7">

              <div className="flex h-12 items-stretch justify-center gap-[2px] overflow-hidden">

                {Array.from({ length: 55 }).map((_, index) => (
                  <span
                    key={index}
                    className="bg-black"
                    style={{
                      width: index % 5 === 0 ? 3 : index % 3 === 0 ? 2 : 1,
                    }}
                  />
                ))}

              </div>

              <p className="mt-2 text-center font-mono text-[9px] tracking-[0.3em]">
                {String(orderNumber).padStart(8, '0')}
              </p>

            </div>

            <div className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.15em]">
              Keep this receipt for your order
            </div>

          </div>

        </div>

        {/* Buttons */}
        <div
          className={`mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 ${
            printed ? 'receipt-finished' : 'opacity-0'
          }`}
        >

          <button
            type="button"
            onClick={onTrackOrder}
            className="flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 font-semibold text-white shadow-lg transition hover:bg-gray-800"
          >
            <Search size={18} />
            Track My Order
          </button>

          <button
            type="button"
            onClick={onBackToStore}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/20 bg-white px-5 py-3.5 font-semibold text-black shadow-sm transition hover:bg-gray-50"
          >
            <ShoppingBag size={18} />
            Back to Store
          </button>

        </div>

        {/* WhatsApp */}
        <button
          type="button"
          onClick={() => {
            window.open(
              `https://wa.me/?text=${encodeURIComponent(
                `Hi, I just placed Chowza order #${orderNumber}.`,
              )}`,
              '_blank',
            );
          }}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-green-600 bg-white px-5 py-3.5 font-semibold text-green-700 shadow-sm transition hover:bg-green-50 ${
            printed ? 'receipt-finished' : 'opacity-0'
          }`}
        >
          <MessageCircle size={18} />
          Message on WhatsApp
        </button>

      </div>
    </div>
  );
};