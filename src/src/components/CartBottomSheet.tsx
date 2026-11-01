import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  CheckCircle2,
  Truck,
  ShoppingBag,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { FulfillmentType, PaymentMethod } from '../types';
import { supabase } from '../lib/supabase';

type CheckoutPaymentMethod = 'Cash' | 'PayFast';

export const CartBottomSheet: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartBusinessId,
    businesses,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    promoDiscount,
    cartDeliveryFee,
    cartTotal,
    placeOrder,
    setCurrentView,
    addFlash,
  } = useApp();

  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>('Delivery');

  const [customerName, setCustomerName] = useState('');

const [customerPhone, setCustomerPhone] = useState('');

const [customerAddress, setCustomerAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // Customer checkout supports Cash and PayFast only.
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>('Cash');

  const [promoInput, setPromoInput] = useState('');

  const [promoMessage, setPromoMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const [checkoutError, setCheckoutError] = useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (!isCartOpen) return;

    setCheckoutError('');
    setPromoMessage(null);
    setIsSubmitting(false);
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const currentBusiness = businesses.find(
    (b) => b.id === cartBusinessId
  );

  const handleApplyPromo = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!promoInput.trim()) return;

    const res = applyPromoCode(promoInput);

    setPromoMessage({
      text: res.message,
      error: !res.success,
    });

    if (res.success) {
      setPromoInput('');
    }
  };

  /*
   * ============================================================
   * CASH ORDER
   * ============================================================
   */
  const executeCashOrder = () => {
    if (!currentBusiness) {
      setCheckoutError('Business not found.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = placeOrder({
        businessId: currentBusiness.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress:
          fulfillmentType === 'Delivery'
            ? customerAddress.trim()
            : undefined,
        customerNote: customerNote.trim(),
        fulfillmentType,
        paymentMethod: 'Cash' as PaymentMethod,
        promoCode: appliedPromo?.code,
      });

      setIsSubmitting(false);

      if ('error' in result) {
        setCheckoutError(result.error);
        addFlash('error', result.error);
        return;
      }

      setIsCartOpen(false);
      setCurrentView('track');
    }, 600);
  };

  /*
   * ============================================================
   * CHECKOUT SUBMIT
   * ============================================================
   */
  const handleCheckoutSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setCheckoutError('');

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanAddress = customerAddress.trim();

    /*
     * ------------------------------------------------------------
     * VALIDATION
     * ------------------------------------------------------------
     */

    if (!cleanName) {
      setCheckoutError(
        'Please enter your full name.'
      );
      return;
    }

    if (
      !cleanPhone ||
      cleanPhone.replace(/\D/g, '').length < 9
    ) {
      setCheckoutError(
        'Please enter a valid South African phone number.'
      );
      return;
    }

    if (
      fulfillmentType === 'Delivery' &&
      !cleanAddress
    ) {
      setCheckoutError(
        'Please enter your delivery address.'
      );
      return;
    }

    if (!currentBusiness) {
      setCheckoutError(
        'Business information could not be loaded. Please close checkout and try again.'
      );
      return;
    }

    if (cart.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    /*
     * ============================================================
     * PAYFAST
     * ============================================================
     *
     * Flow:
     *
     * 1. Use the real Supabase business UUID.
     * 2. Use the real Supabase menu-item UUIDs.
     * 3. Create the Chowza order.
     * 4. Get the order number.
     * 5. Create the PayFast payment.
     * 6. Submit the PayFast POST form.
     * 7. Customer is redirected to PayFast Sandbox.
     */

    if (paymentMethod === 'PayFast') {
      setIsSubmitting(true);

      try {
        /*
         * The UI uses local numeric IDs.
         * PayFast/create-order requires the actual
         * Supabase UUID.
         */
        if (!currentBusiness.supabaseId) {
          throw new Error(
            'This business is missing its Supabase ID.'
          );
        }

        /*
         * Convert Chowza cart items to the UUID format
         * expected by the create-order Edge Function.
         */
        const payFastCart = cart.map(
          ({ food, quantity }) => ({
            itemId: food.supabaseId,
            quantity,
          })
        );

        /*
         * Every menu item must have its real Supabase UUID.
         */
        if (
          payFastCart.some(
            (item) => !item.itemId
          )
        ) {
          throw new Error(
            'One or more cart items are missing their Supabase ID.'
          );
        }

        console.log(
          '[Chowza PayFast] Creating Chowza order...'
        );

        /*
         * --------------------------------------------------------
         * STEP 1 — CREATE CHOWZA ORDER
         * --------------------------------------------------------
         */
        const {
          data: orderData,
          error: orderError,
        } =
          await supabase.functions.invoke(
            'create-order',
            {
              body: {
                businessId:
                  currentBusiness.supabaseId,

                customerName: cleanName,

                customerPhone: cleanPhone,

                deliveryAddress:
                  fulfillmentType === 'Delivery'
                    ? cleanAddress
                    : '',

                paymentMethod: 'online',

                cart: payFastCart,
              },
            }
          );

        if (orderError) {
          console.error(
            '[Chowza PayFast] create-order error:',
            orderError
          );

          /*
           * Supabase sometimes stores the actual Edge
           * Function response inside the Response object.
           */
          if (
            orderError.context instanceof Response
          ) {
            try {
              const responseBody =
                await orderError.context
                  .clone()
                  .text();

              console.error(
                '[Chowza PayFast] Server response:',
                responseBody
              );
            } catch {
              // Ignore response parsing failure.
            }
          }

          throw new Error(
            orderError.message ||
              'Could not create your order.'
          );
        }

        console.log(
          '[Chowza PayFast] create-order response:',
          orderData
        );

        if (
          !orderData?.success ||
          !orderData?.order?.orderNumber
        ) {
          throw new Error(
            orderData?.error ||
              'Could not create your order.'
          );
        }

        const orderNumber =
          orderData.order.orderNumber;

        console.log(
          '[Chowza PayFast] Chowza order created:',
          orderNumber
        );

        /*
         * --------------------------------------------------------
         * STEP 2 — CREATE PAYFAST PAYMENT
         * --------------------------------------------------------
         */
        console.log(
          '[Chowza PayFast] Creating PayFast payment...'
        );

        const {
          data: paymentData,
          error: paymentError,
        } =
          await supabase.functions.invoke(
            'create-payfast-payment',
            {
              body: {
                orderNumber,
              },
            }
          );

        if (paymentError) {
          console.error(
            '[Chowza PayFast] create-payfast-payment error:',
            paymentError
          );

          throw new Error(
            paymentError.message ||
              'Could not start the PayFast payment.'
          );
        }

        console.log(
          '[Chowza PayFast] Payment response:',
          paymentData
        );

        if (
          !paymentData?.success ||
          !paymentData?.processUrl ||
          !paymentData?.fields
        ) {
          throw new Error(
            paymentData?.error ||
              'PayFast did not return the payment information.'
          );
        }

        /*
         * --------------------------------------------------------
         * STEP 3 — SUBMIT PAYFAST FORM
         * --------------------------------------------------------
         *
         * PayFast requires a POST request containing all
         * payment fields.
         */
        const form =
          document.createElement('form');

        form.method = 'POST';

        form.action =
          paymentData.processUrl;

        form.target = '_self';

        form.style.display = 'none';

        Object.entries(
          paymentData.fields as Record<
            string,
            unknown
          >
        ).forEach(([name, value]) => {
          const input =
            document.createElement('input');

          input.type = 'hidden';

          input.name = name;

          input.value = String(
            value ?? ''
          );

          form.appendChild(input);
        });

        document.body.appendChild(form);

        console.log(
          '[Chowza PayFast] Redirecting to:',
          paymentData.processUrl
        );

        /*
         * Browser now leaves Chowza and opens
         * PayFast Sandbox.
         */
        form.submit();

        return;
      } catch (error) {
        console.error(
          '[Chowza PayFast] Checkout failed:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Could not start the PayFast payment. Please try again.';

        setCheckoutError(message);

        addFlash('error', message);

        setIsSubmitting(false);

        return;
      }
    }

    /*
     * ============================================================
     * CASH
     * ============================================================
     */
    executeCashOrder();
  };

  return (
    <>
      <div
        className="sheet-backdrop active"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsCartOpen(false);
          }
        }}
      >
        <div className="sheet">
          <div className="sheet-grabber" />

          {/* ====================================================
              HEADER
          ==================================================== */}
          <div className="sheet-header">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#22C55E]" />

                <span>Your Order</span>
              </h2>

              {currentBusiness && (
                <p className="text-xs text-[#647067] font-medium mt-0.5">
                  Ordering from{' '}
                  <strong className="text-[#17201A]">
                    {currentBusiness.businessName}
                  </strong>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setIsCartOpen(false)
              }
              className="sheet-close"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ====================================================
              EMPTY CART
          ==================================================== */}
          {cart.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag className="w-12 h-12 mx-auto text-[#647067]/40 mb-3" />

              <strong>
                Your cart is empty
              </strong>

              <p className="text-sm">
                Browse our menu and pick
                something delicious!
              </p>

              <button
                type="button"
                onClick={() =>
                  setIsCartOpen(false)
                }
                className="btn btn-primary btn-sm mt-4 font-bold"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleCheckoutSubmit}
              className="stack"
              autoComplete="off"
            >
              {/* ==================================================
                  CART ITEMS
              ================================================== */}
              <div className="card p-3 divide-y divide-black/5 bg-[#FDFBF7]">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#647067]">
                    Cart Items ({cart.length})
                  </span>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-[#EF4444] hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {cart.map(
                    ({ food, quantity }) => (
                      <div
                        key={food.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#17201A] truncate">
                            {food.name}
                          </div>

                          <div className="text-xs text-[#647067]">
                            R
                            {food.price.toFixed(
                              2
                            )}{' '}
                            each ·{' '}
                            <strong className="text-[#15803D]">
                              R
                              {(
                                food.price *
                                quantity
                              ).toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5 bg-white border border-[#17201A]/10 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                food.id,
                                quantity - 1
                              )
                            }
                            className="w-7 h-7 flex items-center justify-center rounded text-[#17201A] hover:bg-[#F7FAF7]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-6 text-center font-bold text-sm">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                food.id,
                                quantity + 1
                              )
                            }
                            className="w-7 h-7 flex items-center justify-center rounded text-[#17201A] hover:bg-[#F7FAF7]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              food.id
                            )
                          }
                          className="text-[#647067] hover:text-[#EF4444] p-1"
                          title="Remove item"
                          aria-label={`Remove ${food.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* ==================================================
                  FULFILLMENT
              ================================================== */}
              <div className="field">
                <label>
                  Fulfillment Type
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFulfillmentType(
                        'Delivery'
                      )
                    }
                    className={`btn btn-sm ${
                      fulfillmentType ===
                      'Delivery'
                        ? 'btn-dark'
                        : 'btn-outline bg-white'
                    }`}
                  >
                    <Truck className="w-4 h-4 mr-1.5" />

                    Delivery (+R
                    {currentBusiness?.deliveryFee ||
                      25}
                    )
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFulfillmentType(
                        'Pickup'
                      )
                    }
                    className={`btn btn-sm ${
                      fulfillmentType ===
                      'Pickup'
                        ? 'btn-dark'
                        : 'btn-outline bg-white'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 mr-1.5" />

                    Pickup / Collection
                    (Free)
                  </button>
                </div>
              </div>

              {/* ==================================================
                  CUSTOMER DETAILS
              ================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field">
                  <label htmlFor="customer-name">
                    Full Name *
                  </label>

                  <input
                    id="customer-name"
                    name="chowza-customer-name"
                    type="text"
                    required
                    autoComplete="off"
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Sipho Ndlovu"
                  />
                </div>

                <div className="field">
                  <label htmlFor="customer-phone">
                    WhatsApp / Phone *
                  </label>

                  <input
                    id="customer-phone"
                    name="chowza-customer-phone"
                    type="tel"
                    required
                    autoComplete="off"
                    inputMode="tel"
                    value={customerPhone}
                    onChange={(e) =>
                      setCustomerPhone(
                        e.target.value
                      )
                    }
                    placeholder="082 123 4567"
                  />
                </div>
              </div>

              {/* ==================================================
                  DELIVERY ADDRESS
              ================================================== */}
              {fulfillmentType ===
                'Delivery' && (
                <div className="field">
                  <label htmlFor="customer-address">
                    Delivery Address *
                  </label>

                  <input
                    id="customer-address"
                    name="chowza-delivery-address"
                    type="text"
                    required
                    autoComplete="off"
                    value={customerAddress}
                    onChange={(e) =>
                      setCustomerAddress(
                        e.target.value
                      )
                    }
                    placeholder="Street name, house/flat number, township or suburb"
                  />

                  <p className="help">
                    Delivery radius: up to{' '}
                    {currentBusiness?.deliveryRadiusKm ||
                      5}{' '}
                    km
                  </p>
                </div>
              )}

              {/* ==================================================
                  CUSTOMER NOTE
              ================================================== */}
              <div className="field">
                <label htmlFor="customer-notes">
                  Kitchen Notes (Optional)
                </label>

                <input
                  id="customer-notes"
                  name="chowza-kitchen-notes"
                  type="text"
                  autoComplete="off"
                  value={customerNote}
                  onChange={(e) =>
                    setCustomerNote(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Extra chakalaka, no mayo, call on arrival"
                />
              </div>

              {/* ==================================================
                  PROMO CODE
              ================================================== */}
              <div className="field">
                <label>
                  Promotion Code
                </label>

                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E4F9EC] border border-[#22C55E]/40 text-sm">
                    <div className="flex items-center gap-2 text-[#166534] font-semibold">
                      <Tag className="w-4 h-4" />

                      <span>
                        Code{' '}
                        <strong>
                          {appliedPromo.code}
                        </strong>{' '}
                        applied (
                        {
                          appliedPromo.description
                        }
                        )
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={
                        removePromoCode
                      }
                      className="text-xs font-bold text-[#EF4444] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) =>
                          setPromoInput(
                            e.target.value.toUpperCase()
                          )
                        }
                        placeholder="Enter promo code"
                        className="uppercase"
                      />

                      <button
                        type="button"
                        onClick={
                          handleApplyPromo
                        }
                        className="btn btn-outline btn-sm font-bold shrink-0"
                      >
                        Apply
                      </button>
                    </div>

                    {promoMessage && (
                      <p
                        className={`text-xs mt-1 font-semibold ${
                          promoMessage.error
                            ? 'text-[#EF4444]'
                            : 'text-[#166534]'
                        }`}
                      >
                        {
                          promoMessage.text
                        }
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ==================================================
                  PAYMENT METHOD
              ================================================== */}
              <div className="field">
                <label>
                  Payment Method
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {/* CASH */}
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod(
                        'Cash'
                      )
                    }
                    className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all ${
                      paymentMethod ===
                      'Cash'
                        ? 'border-[#22C55E] bg-[#E4F9EC]/50 font-bold'
                        : 'border-[#17201A]/10 bg-white hover:bg-[#F7FAF7]'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-[#22C55E]" />

                    <span className="text-xs">
                      Cash on{' '}
                      {fulfillmentType ===
                      'Delivery'
                        ? 'Delivery'
                        : 'Pickup'}
                    </span>
                  </button>

                  {/* PAYFAST */}
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod(
                        'PayFast'
                      )
                    }
                    className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all ${
                      paymentMethod ===
                      'PayFast'
                        ? 'border-[#22C55E] bg-[#E4F9EC]/50 font-bold'
                        : 'border-[#17201A]/10 bg-white hover:bg-[#F7FAF7]'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#0284C7]" />

                    <span className="text-xs">
                      PayFast Online
                    </span>
                  </button>
                </div>
              </div>

              {/* ==================================================
                  CHECKOUT ERROR
              ================================================== */}
              {checkoutError && (
                <div className="rounded-lg border border-[#EF4444]/30 bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C] font-semibold">
                  {checkoutError}
                </div>
              )}

              {/* ==================================================
                  ORDER TOTALS
              ================================================== */}
              <div className="card bg-[#FBF7EE] p-3 text-sm space-y-1.5 border-[#17201A]/15">
                <div className="flex justify-between text-[#647067]">
                  <span>
                    Subtotal
                  </span>

                  <span>
                    R
                    {cartSubtotal.toFixed(
                      2
                    )}
                  </span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-[#166534] font-semibold">
                    <span>
                      Discount (
                      {
                        appliedPromo?.code
                      }
                      )
                    </span>

                    <span>
                      -R
                      {promoDiscount.toFixed(
                        2
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-[#647067]">
                  <span>
                    {fulfillmentType}{' '}
                    Fee
                  </span>

                  <span>
                    {cartDeliveryFee >
                    0
                      ? `R${cartDeliveryFee.toFixed(
                          2
                        )}`
                      : 'FREE'}
                  </span>
                </div>

                <div className="border-t border-[#17201A]/15 pt-2 flex justify-between items-baseline text-base font-extrabold text-[#17201A]">
                  <span>
                    Total Due
                  </span>

                  <span className="text-xl text-[#15803D]">
                    R
                    {cartTotal.toFixed(
                      2
                    )}
                  </span>
                </div>
              </div>

              {/* ==================================================
                  SUBMIT
              ================================================== */}
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  cart.length === 0
                }
                className="btn btn-primary btn-block text-base font-black py-3.5 shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>
                    Processing Order...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />

                    <span>
                      {paymentMethod ===
                      'PayFast'
                        ? 'Continue to PayFast'
                        : 'Place Order'}{' '}
                      · R
                      {cartTotal.toFixed(
                        2
                      )}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};