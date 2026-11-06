import React, { useEffect, useState } from 'react';
import { Check, Copy, Printer, ArrowLeft, Truck } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowReceipt(true);
    }, 150);

    return () => window.clearTimeout(timer);
  }, []);

  const money = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));

  const paymentLabel =
    paymentMethod === 'cash'
      ? 'CASH'
      : paymentMethod === 'eft'
        ? 'EFT'
        : 'CARD / ONLINE';

  const paymentMessage =
    paymentMethod === 'cash'
      ? 'Payment due on collection or delivery'
      : paymentMethod === 'eft'
        ? 'Payment by EFT'
        : 'Payment processed online';

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(String(orderNumber));
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      // Clipboard may not be available.
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const now = new Date();

  const dateText = now.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const timeText = now.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <style>
        {`
          .chowza-confirmation-page {
            min-height: 100vh;
            background: #F7FAF7;
            color: #17201A;
          }

          .chowza-receipt {
            transition:
              opacity 0.45s ease,
              transform 0.45s ease;
          }

          .chowza-receipt.hidden-receipt {
            opacity: 0;
            transform: translateY(-18px);
          }

          .chowza-receipt.visible-receipt {
            opacity: 1;
            transform: translateY(0);
          }

          .receipt-paper {
            position: relative;
            background: #FFFFFF;
            overflow: hidden;
          }

          .receipt-paper::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            bottom: -1px;
            height: 8px;
            background:
              linear-gradient(
                -45deg,
                transparent 0 5px,
                #FFFFFF 5px 10px
              )
              0 0 / 10px 10px repeat-x;
          }

          .receipt-line {
            border-top: 1px dashed rgba(23, 32, 26, 0.22);
          }

          .receipt-item-row {
            break-inside: avoid;
          }

          @media print {
            @page {
              size: auto;
              margin: 8mm;
            }

            html,
            body {
              background: #FFFFFF !important;
            }

            body {
              overflow: visible !important;
            }

            .no-print {
              display: none !important;
            }

            .chowza-confirmation-page {
              min-height: auto !important;
              background: #FFFFFF !important;
              padding: 0 !important;
            }

            .chowza-receipt-wrapper {
              max-width: 420px !important;
              margin: 0 auto !important;
            }

            .receipt-paper {
              box-shadow: none !important;
              border: 1px solid #D8DED9 !important;
            }

            .receipt-header {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            .receipt-green {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>

      <main className="chowza-confirmation-page px-4 py-8 md:py-12">
        <div className="chowza-receipt-wrapper mx-auto w-full max-w-[430px]">

          {/* Top navigation */}
          <div className="no-print mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToStore}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#4F5D53] transition hover:bg-white hover:text-[#15803D]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to store
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-full bg-[#15803D] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#166534]"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>

          {/* Receipt */}
          <div
            className={`chowza-receipt ${
              showReceipt ? 'visible-receipt' : 'hidden-receipt'
            }`}
          >
            <section className="receipt-paper rounded-[22px] shadow-[0_18px_50px_rgba(23,32,26,0.10)]">

              {/* Receipt header */}
              <div className="receipt-header receipt-green bg-[#15803D] px-6 pb-7 pt-7 text-white">
                <div className="text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#15803D] shadow-sm">
                    <span className="text-xl font-black">C</span>
                  </div>

                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.28em] text-white/70">
                    Chowza
                  </p>

                  <h1 className="mt-2 text-2xl font-black tracking-tight">
                    Order Confirmed
                  </h1>

                  <p className="mt-2 text-sm text-white/80">
                    Thank you for your order
                  </p>
                </div>
              </div>

              {/* Order number */}
              <div className="px-6 py-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#758178]">
                  Order Number
                </p>

                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="font-mono text-3xl font-black tracking-tight text-[#17201A]">
                    #{orderNumber}
                  </span>

                  <button
                    type="button"
                    onClick={copyOrderNumber}
                    className="no-print rounded-lg p-2 text-[#758178] transition hover:bg-[#F0FDF4] hover:text-[#15803D]"
                    aria-label="Copy order number"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-[#15803D]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {copied && (
                  <p className="mt-1 text-xs font-semibold text-[#15803D]">
                    Order number copied
                  </p>
                )}
              </div>

              <div className="receipt-line mx-6" />

              {/* Store and customer information */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-5">

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#758178]">
                      Restaurant
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#17201A]">
                      {businessName}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#758178]">
                      Customer
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-[#17201A]">
                      {customerName}
                    </p>
                  </div>

                </div>

                <div className="mt-5 grid grid-cols-2 gap-5">

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#758178]">
                      Date
                    </p>

                    <p className="mt-1 font-mono text-xs font-semibold text-[#4F5D53]">
                      {dateText}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#758178]">
                      Time
                    </p>

                    <p className="mt-1 font-mono text-xs font-semibold text-[#4F5D53]">
                      {timeText}
                    </p>
                  </div>

                </div>
              </div>

              <div className="receipt-line mx-6" />

              {/* Items */}
              <div className="px-6 py-5">

                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#758178]">
                    Order Items
                  </p>

                  <p className="font-mono text-[10px] font-bold text-[#758178]">
                    {items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}{' '}
                    item(s)
                  </p>
                </div>

                <div className="space-y-4">

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="receipt-item-row flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <span className="min-w-[22px] rounded-md bg-[#F0FDF4] px-1.5 py-1 text-center font-mono text-[10px] font-bold text-[#15803D]">
                            {item.quantity}x
                          </span>

                          <p className="text-sm font-bold leading-5 text-[#17201A]">
                            {item.name}
                          </p>
                        </div>

                        <p className="ml-[30px] mt-1 font-mono text-[10px] text-[#758178]">
                          {money(item.price)} each
                        </p>
                      </div>

                      <p className="whitespace-nowrap font-mono text-sm font-bold text-[#17201A]">
                        {money(item.line_total)}
                      </p>
                    </div>
                  ))}

                </div>
              </div>

              <div className="receipt-line mx-6" />

              {/* Total */}
              <div className="px-6 py-5">

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#758178]">
                    Subtotal
                  </span>

                  <span className="font-mono font-semibold text-[#4F5D53]">
                    {money(total)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-bold text-[#17201A]">
                    Total
                  </span>

                  <span className="font-mono text-2xl font-black text-[#15803D]">
                    {money(total)}
                  </span>
                </div>

              </div>

              <div className="receipt-line mx-6" />

              {/* Payment */}
              <div className="px-6 py-5">

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#758178]">
                      Payment
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#17201A]">
                      {paymentLabel}
                    </p>

                    <p className="mt-1 text-[10px] text-[#758178]">
                      {paymentMessage}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
                    <Check className="h-5 w-5" />
                  </div>
                </div>

              </div>

              {/* Confirmation footer */}
              <div className="bg-[#F0FDF4] px-6 py-6 text-center">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#15803D] text-white">
                  <Check className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-bold text-[#17201A]">
                  Your order has been received
                </p>

                <p className="mx-auto mt-1 max-w-[290px] text-xs leading-5 text-[#4F5D53]">
                  Keep this receipt for your records. You can track your
                  order using the button below.
                </p>

              </div>

              {/* Receipt bottom */}
              <div className="px-6 pb-8 pt-5 text-center">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#758178]">
                  Thank you for choosing Chowza
                </p>

                <p className="mt-2 font-mono text-[9px] text-[#A0AAA3]">
                  chowza.co.za
                </p>
              </div>

            </section>
          </div>

          {/* Action buttons */}
          <div className="no-print mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

            <button
              type="button"
              onClick={onTrackOrder}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#15803D] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(21,128,61,0.18)] transition hover:bg-[#166534] active:scale-[0.98]"
            >
              <Truck className="h-4 w-4" />
              Track My Order
            </button>

            <button
              type="button"
              onClick={onBackToStore}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#D8E0DA] bg-white px-5 text-sm font-bold text-[#17201A] transition hover:border-[#15803D] hover:text-[#15803D] active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </button>

          </div>

          {/* Print hint */}
          <div className="no-print mt-4 text-center">
            <p className="text-xs text-[#758178]">
              Need a physical copy? Use the{' '}
              <button
                type="button"
                onClick={handlePrint}
                className="font-bold text-[#15803D] hover:underline"
              >
                Print
              </button>{' '}
              button above.
            </p>
          </div>

        </div>
      </main>
    </>
  );
};

export default OrderConfirmation;