import React from 'react';
import {
  CheckCircle2,
  Clock,
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
  const paymentLabel =
    paymentMethod === 'cash'
      ? 'Cash on Delivery'
      : paymentMethod === 'eft'
        ? 'EFT'
        : 'Online Payment';

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(String(orderNumber));
    } catch {
      // Clipboard access may not be available in every browser.
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EEE4] text-[#1B1815]">
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-[#25D366]/10 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-[#25D366]" />
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Order Confirmed!
            </h1>

            <p className="text-[#5A544C] mt-2">
              Thanks, {customerName}. Your order has been sent to{' '}
              <strong>{businessName}</strong>.
            </p>
          </div>

          {/* Order Number */}
          <div className="card mb-5 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8C857A]">
              Your Order Number
            </div>

            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-4xl font-black text-[#DD5330]">
                #{orderNumber}
              </span>

              <button
                type="button"
                onClick={copyOrderNumber}
                className="p-2 rounded-lg hover:bg-[#F3EEE4] transition"
                title="Copy order number"
                aria-label="Copy order number"
              >
                <Copy className="w-5 h-5 text-[#5A544C]" />
              </button>
            </div>

            <p className="text-xs text-[#8C857A] mt-2">
              Keep this number safe so you can track your order.
            </p>
          </div>

          {/* Payment Information */}
          <div className="card mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#F3EEE4] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#DD5330]" />
              </div>

              <div>
                <h2 className="font-extrabold">Payment</h2>
                <p className="text-xs text-[#8C857A]">
                  {paymentLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#1B1815]/10 pt-4">
              <span className="font-bold">Amount</span>

              <span className="text-xl font-black text-[#DD5330]">
                R{Number(total).toFixed(2)}
              </span>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mt-4 rounded-xl bg-[#FFF4D8] border border-[#E5C66B] p-3 text-sm text-[#5A544C]">
                Please have{' '}
                <strong>R{Number(total).toFixed(2)}</strong> ready for
                payment when your order is delivered.
              </div>
            )}

            {paymentMethod === 'eft' && (
              <div className="mt-4 rounded-xl bg-[#F3EEE4] border border-[#1B1815]/10 p-3 text-sm text-[#5A544C]">
                Your order has been recorded as an EFT payment.
                Follow the business's payment instructions if provided.
              </div>
            )}

            {paymentMethod === 'online' && (
              <div className="mt-4 rounded-xl bg-[#F3EEE4] border border-[#1B1815]/10 p-3 text-sm text-[#5A544C]">
                Your order has been recorded as an online payment.
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="card mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#F3EEE4] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#DD5330]" />
              </div>

              <h2 className="font-extrabold">Order Summary</h2>
            </div>

            <div className="divide-y divide-[#1B1815]/10">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-bold text-sm">
                      {item.quantity}x {item.name}
                    </div>

                    <div className="text-xs text-[#8C857A]">
                      R{Number(item.price).toFixed(2)} each
                    </div>
                  </div>

                  <div className="font-bold text-sm">
                    R{Number(item.line_total).toFixed(2)}
                  </div>
                </div>
              ))}

              <div className="pt-4 flex items-center justify-between">
                <span className="font-black">Total</span>

                <span className="text-xl font-black text-[#DD5330]">
                  R{Number(total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="card mb-5">
            <h2 className="font-extrabold mb-3">
              What happens next?
            </h2>

            <div className="space-y-3 text-sm text-[#5A544C]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0" />
                <span>
                  Your order has been received by the business.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#DD5330] shrink-0" />
                <span>
                  The business will confirm and prepare your order.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Search className="w-5 h-5 text-[#DD5330] shrink-0" />
                <span>
                  Use your order number and phone number to check your
                  order status at any time.
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onTrackOrder}
              className="btn btn-primary font-bold"
            >
              <Search className="w-5 h-5" />
              Track My Order
            </button>

            <button
              type="button"
              onClick={onBackToStore}
              className="btn btn-secondary font-bold"
            >
              <ShoppingBag className="w-5 h-5" />
              Back to Store
            </button>
          </div>

          {/* WhatsApp */}
          <div className="text-center mt-5">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Hi, I have an enquiry about Order #${orderNumber} from ${businessName}.`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#176B35] hover:underline"
            >
              <MessageCircle className="w-4 h-4" />
              Contact the business on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};