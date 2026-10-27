import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Send,
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { FoodItem, Business } from '../types';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

type BotStep =
  | 'MAIN_MENU'
  | 'CHOOSE_BUSINESS'
  | 'CHOOSE_FOOD'
  | 'CHOOSE_QUANTITY'
  | 'CHOOSE_FULFILLMENT'
  | 'CUSTOMER_NAME'
  | 'CUSTOMER_ADDRESS'
  | 'PAYMENT_METHOD'
  | 'CONFIRM_ORDER';

export const WhatsAppSimulator: React.FC = () => {
  const { businesses, foods, placeOrder, orders, setCurrentView, setTrackingLookup } = useApp();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Hi! Welcome to WhatsApp Food (Chowza) 🇿🇦\n\nWe make ordering from local food businesses simple.\n\nWhat would you like to do?\n\n1. View businesses\n2. Browse a menu\n3. Track my order\n\nReply with 1, 2, or 3.`,
      time: '12:00'
    }
  ]);

  const [input, setInput] = useState('');
  const [step, setStep] = useState<BotStep>('MAIN_MENU');
  const [sessionBusinessList, setSessionBusinessList] = useState<Business[]>([]);
  const [sessionFoodList, setSessionFoodList] = useState<FoodItem[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [botCart, setBotCart] = useState<{ food: FoodItem; quantity: number }[]>([]);
  const [fulfillment, setFulfillment] = useState<'Delivery' | 'Pickup'>('Delivery');
  const [customerName, setCustomerName] = useState('Nandi Zulu');
  const [customerAddress, setCustomerAddress] = useState('45 Hector Pieterson Ave, Orlando');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Yoco'>('Cash');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const addBotMessage = (text: string) => {
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'bot',
          text,
          time: getCurrentTime()
        }
      ]);
    }, 450);
  };

  const handleReset = () => {
    setStep('MAIN_MENU');
    setSelectedBiz(null);
    setSelectedFood(null);
    setBotCart([]);
    setMessages([
      {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'bot',
        text: `Hi! Welcome to WhatsApp Food (Chowza) 🇿🇦\n\nWhat would you like to do?\n\n1. View businesses\n2. Browse a menu\n3. Track my order\n\nReply with 1, 2, or 3.`,
        time: getCurrentTime()
      }
    ]);
  };

  const handleSend = (textToSend?: string) => {
    const msg = (textToSend !== undefined ? textToSend : input).trim();
    if (!msg) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'user',
        text: msg,
        time: getCurrentTime()
      }
    ]);
    if (textToSend === undefined) setInput('');

    const lower = msg.toLowerCase();

    // Universal Reset Commands
    if (['hi', 'hello', 'hey', 'start', 'menu', 'restart'].includes(lower)) {
      handleReset();
      return;
    }

    if (['0', 'back', 'cancel'].includes(lower)) {
      setStep('MAIN_MENU');
      setSelectedBiz(null);
      setSelectedFood(null);
      addBotMessage(
        `You're back at the Chowza main menu.\n\n1. View businesses\n2. Browse a menu\n3. Track my order\n\nReply with 1, 2, or 3.`
      );
      return;
    }

    if (lower === 'cart') {
      if (botCart.length === 0) {
        addBotMessage('Your cart is empty. Choose a menu item first.');
        return;
      }
      const total = botCart.reduce((sum, i) => sum + i.food.price * i.quantity, 0);
      let reply = '🛒 *Your Cart:*\n\n';
      botCart.forEach((i) => {
        reply += `• ${i.quantity}x ${i.food.name} — R${(i.food.price * i.quantity).toFixed(2)}\n`;
      });
      reply += `\n*Subtotal:* R${total.toFixed(2)}\n\nSend *checkout* to proceed or choose another item number.`;
      addBotMessage(reply);
      return;
    }

    if (lower === 'checkout') {
      if (botCart.length === 0 || !selectedBiz) {
        addBotMessage('Your cart is empty. Pick a menu item first.');
        return;
      }
      setStep('CHOOSE_FULFILLMENT');
      addBotMessage(
        `How would you like to receive your order?\n\n1. Delivery (+R${selectedBiz.deliveryFee.toFixed(2)})\n2. Pickup (Free)\n\nReply 1 or 2.`
      );
      return;
    }

    // Step state machine replicating the Python code
    switch (step) {
      case 'MAIN_MENU': {
        if (lower === '1' || lower === '2') {
          const activeBiz = businesses.filter((b) => b.active);
          setSessionBusinessList(activeBiz);
          let reply = `Here are the available food businesses:\n\n`;
          activeBiz.forEach((b, idx) => {
            reply += `${idx + 1}. *${b.businessName}* (${b.category})\n`;
          });
          reply += `\nReply with the number of the business you want.`;
          setStep('CHOOSE_BUSINESS');
          addBotMessage(reply);
        } else if (lower === '3') {
          const recent = orders[0];
          addBotMessage(
            `To track your order, please reply with your Order Number.\n\nExample: *${recent?.orderNumber || '001'}*`
          );
        } else {
          // Check if user replied with an order number to track
          const matched = orders.find(
            (o) => o.orderNumber === lower || o.orderNumber === lower.padStart(3, '0')
          );
          if (matched) {
            addBotMessage(
              `📦 *Order #${matched.orderNumber} Update*\n\nStatus: *${matched.status}*\nTotal: R${matched.total.toFixed(2)}\nType: ${matched.fulfillmentType}\n\nThank you for using WhatsApp Food!`
            );
          } else {
            addBotMessage(
              `Sorry, I didn't understand that.\n\nReply with 1 to view businesses, or send *Hi* to restart.`
            );
          }
        }
        break;
      }

      case 'CHOOSE_BUSINESS': {
        const num = parseInt(lower, 10);
        if (isNaN(num) || num < 1 || num > sessionBusinessList.length) {
          addBotMessage(
            `Please reply with a valid business number (1-${sessionBusinessList.length}). Send 0 to go back.`
          );
          return;
        }

        const pickedBiz = sessionBusinessList[num - 1];
        setSelectedBiz(pickedBiz);

        if (!pickedBiz.isOpen) {
          addBotMessage(
            `⚠️ *${pickedBiz.businessName}* is currently CLOSED.\n\nReply with another business number or 0 to go back.`
          );
          return;
        }

        const bizFoods = foods.filter((f) => f.businessId === pickedBiz.id && f.available);
        setSessionFoodList(bizFoods);

        let menuText = `🍽️ *${pickedBiz.businessName} Menu:*\n\n`;
        bizFoods.forEach((f, idx) => {
          menuText += `${idx + 1}. *${f.name}* — R${f.price.toFixed(2)}\n   _${f.description}_\n`;
        });
        menuText += `\nReply with the number of the dish you want.\nSend 0 to go back.`;

        setStep('CHOOSE_FOOD');
        addBotMessage(menuText);
        break;
      }

      case 'CHOOSE_FOOD': {
        const num = parseInt(lower, 10);
        if (isNaN(num) || num < 1 || num > sessionFoodList.length) {
          addBotMessage(
            `Please enter a valid menu item number (1-${sessionFoodList.length}), or send *checkout* to proceed.`
          );
          return;
        }

        const pickedFood = sessionFoodList[num - 1];
        setSelectedFood(pickedFood);
        setStep('CHOOSE_QUANTITY');
        addBotMessage(
          `*${pickedFood.name}* — R${pickedFood.price.toFixed(2)}\n\nHow many would you like? (Reply with a number, e.g. 1, 2, 3)`
        );
        break;
      }

      case 'CHOOSE_QUANTITY': {
        const qty = parseInt(lower, 10);
        if (isNaN(qty) || qty < 1 || qty > 20) {
          addBotMessage(`Please reply with a quantity between 1 and 20.`);
          return;
        }

        if (selectedFood) {
          setBotCart((prev) => {
            const existing = prev.find((i) => i.food.id === selectedFood.id);
            if (existing) {
              return prev.map((i) =>
                i.food.id === selectedFood.id ? { ...i, quantity: i.quantity + qty } : i
              );
            }
            return [...prev, { food: selectedFood, quantity: qty }];
          });

          const currentTotal =
            botCart.reduce((sum, i) => sum + i.food.price * i.quantity, 0) +
            selectedFood.price * qty;

          setStep('CHOOSE_FOOD');
          setSelectedFood(null);

          addBotMessage(
            `✅ Added ${qty}x *${selectedFood.name}* to cart.\n\n*Cart Total:* R${currentTotal.toFixed(2)}\n\nReply with another item number, or send *checkout* to place your order!\nSend *cart* to review.`
          );
        }
        break;
      }

      case 'CHOOSE_FULFILLMENT': {
        if (lower === '1') {
          setFulfillment('Delivery');
          setStep('CUSTOMER_NAME');
          addBotMessage(`Great, Delivery selected! 🚚\n\nPlease reply with your full name:`);
        } else if (lower === '2') {
          setFulfillment('Pickup');
          setStep('CUSTOMER_NAME');
          addBotMessage(`Pickup selected! 🛍️\n\nPlease reply with your full name:`);
        } else {
          addBotMessage(`Please reply with 1 for Delivery or 2 for Pickup.`);
        }
        break;
      }

      case 'CUSTOMER_NAME': {
        if (msg.length < 2) {
          addBotMessage(`Please enter a valid name.`);
          return;
        }
        setCustomerName(msg);
        if (fulfillment === 'Delivery') {
          setStep('CUSTOMER_ADDRESS');
          addBotMessage(`Thank you ${msg}! Please reply with your delivery address:`);
        } else {
          setStep('PAYMENT_METHOD');
          addBotMessage(
            `How would you like to pay?\n\n1. Cash on Collection\n2. Yoco Card Payment\n\nReply 1 or 2.`
          );
        }
        break;
      }

      case 'CUSTOMER_ADDRESS': {
        if (msg.length < 5) {
          addBotMessage(`Please enter a complete delivery address with street / township name.`);
          return;
        }
        setCustomerAddress(msg);
        setStep('PAYMENT_METHOD');
        addBotMessage(
          `Delivery address saved!\n\nHow would you like to pay?\n\n1. Cash on Delivery\n2. Yoco Card (Instant)\n\nReply 1 or 2.`
        );
        break;
      }

      case 'PAYMENT_METHOD': {
        let chosenMethod: 'Cash' | 'Yoco' = 'Cash';
        if (lower === '1' || lower.includes('cash')) {
          chosenMethod = 'Cash';
        } else if (lower === '2' || lower.includes('yoco') || lower.includes('card')) {
          chosenMethod = 'Yoco';
        } else {
          addBotMessage(`Please reply with 1 for Cash or 2 for Yoco.`);
          return;
        }
        setPaymentMethod(chosenMethod);

        const subtotal = botCart.reduce((sum, i) => sum + i.food.price * i.quantity, 0);
        const delFee = fulfillment === 'Delivery' ? selectedBiz?.deliveryFee || 25 : 0;
        const total = subtotal + delFee;

        let confirmSummary = `📋 *Please confirm your order:*\n\n`;
        confirmSummary += `*Business:* ${selectedBiz?.businessName}\n`;
        confirmSummary += `*Name:* ${customerName}\n`;
        confirmSummary += `*Type:* ${fulfillment}\n`;
        if (fulfillment === 'Delivery') {
          confirmSummary += `*Address:* ${customerAddress}\n`;
        }
        confirmSummary += `\n*Items:*\n`;
        botCart.forEach((i) => {
          confirmSummary += `• ${i.quantity}x ${i.food.name} — R${(i.food.price * i.quantity).toFixed(2)}\n`;
        });
        confirmSummary += `\n*Subtotal:* R${subtotal.toFixed(2)}\n`;
        confirmSummary += `*${fulfillment} Fee:* R${delFee.toFixed(2)}\n`;
        confirmSummary += `*TOTAL:* R${total.toFixed(2)}\n`;
        confirmSummary += `*Payment:* ${chosenMethod}\n\n`;
        confirmSummary += `Reply *CONFIRM* to place your order or *CANCEL* to stop.`;

        setStep('CONFIRM_ORDER');
        addBotMessage(confirmSummary);
        break;
      }

      case 'CONFIRM_ORDER': {
        if (lower === 'cancel') {
          handleReset();
          return;
        }

        if (lower !== 'confirm') {
          addBotMessage(`Please reply *CONFIRM* to place your order or *CANCEL* to stop.`);
          return;
        }

        if (!selectedBiz || botCart.length === 0) {
          handleReset();
          return;
        }

        // Execute live order placement in the AppContext
        const placed = placeOrder({
          businessId: selectedBiz.id,
          customerName,
          customerPhone: '27821234567',
          customerAddress: fulfillment === 'Delivery' ? customerAddress : undefined,
          fulfillmentType: fulfillment,
          paymentMethod,
          customerNote: 'Ordered via WhatsApp Bot'
        });

        if ('error' in placed) {
          addBotMessage(`⚠️ Error placing order: ${placed.error}`);
          return;
        }

        const newOrderNum = placed.orderNumber;

        let finalMsg = `🎉 *Order Confirmed!*\n\n`;
        finalMsg += `Order Number: *#${newOrderNum}*\n`;
        finalMsg += `Business: ${selectedBiz.businessName}\n`;
        finalMsg += `Total: R${placed.total.toFixed(2)}\n`;
        finalMsg += `Status: *Pending*\n\n`;
        if (paymentMethod === 'Yoco') {
          finalMsg += `💳 *Yoco Payment Link:*\nhttps://payments.yoco.com/checkout/${placed.paymentReference}\n(Card payment authorized)\n\n`;
        }
        finalMsg += `The kitchen has been notified and will begin preparing your order!\n\nYou can reply with your order number anytime to track live status. Send *Hi* to place another order.`;

        addBotMessage(finalMsg);
        setStep('MAIN_MENU');
        setBotCart([]);
        setSelectedBiz(null);
        setSelectedFood(null);
        break;
      }
    }
  };

  return (
    <div className="container max-w-2xl py-6">
      {/* Simulator Explainer Header */}
      <div className="card mb-4 p-4 bg-[#FDFBF7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-[#22C55E]/40 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-[#22C55E] text-white font-extrabold text-xs">
              Live Interactive Bot
            </span>
            <span className="text-xs font-bold text-[#17201A]">Meta WhatsApp Cloud API v23.0</span>
          </div>
          <p className="text-xs text-[#647067] mt-1">
            Simulates the exact Python webhook flow (`/webhook`). Orders placed here sync to the Kitchen Dashboard!
          </p>
        </div>

        <button
          onClick={handleReset}
          className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart Chat</span>
        </button>
      </div>

      {/* WhatsApp Mobile Mockup Container */}
      <div className="bg-[#EFEAE2] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#17201A] flex flex-col h-[650px] relative">
        {/* WhatsApp App Topbar */}
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#22C55E] text-white flex items-center justify-center font-bold text-sm shadow">
                <MessageCircle className="w-6 h-6 fill-current" />
              </div>
              <span className="w-3 h-3 rounded-full bg-[#22C55E] border-2 border-[#075E54] absolute bottom-0 right-0" />
            </div>

            <div>
              <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                <span>WhatsApp Food</span>
                <span className="text-[10px] bg-white/20 px-1 rounded text-white font-semibold">BOT</span>
              </div>
              <div className="text-[11px] text-white/80">Online · Instant automated ordering</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/80">
            <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
            <Video className="w-4 h-4 cursor-pointer hover:text-white" />
            <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* WhatsApp Chat Background & Messages */}
        <div
          className="flex-1 p-4 overflow-y-auto space-y-3"
          style={{
            backgroundImage:
              'radial-gradient(#17201A 0.5px, transparent 0.5px), radial-gradient(#17201A 0.5px, #efeae2 0.5px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px',
            backgroundColor: '#EFEAE2'
          }}
        >
          {/* Encryption Notice */}
          <div className="text-center">
            <span className="text-[10px] bg-[#F0FDF4] text-[#166534] px-2.5 py-1 rounded-md shadow-xs inline-block max-w-xs font-medium">
              🔒 Messages and calls are end-to-end encrypted. No one outside of this chat can read them.
            </span>
          </div>

          {messages.map((m) => {
            const isBot = m.sender === 'bot';
            return (
              <div
                key={m.id}
                className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-in fade-in duration-150`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs relative ${
                    isBot
                      ? 'bg-white text-[#17201A] rounded-tl-xs'
                      : 'bg-[#DCF8C6] text-[#17201A] rounded-tr-xs'
                  }`}
                >
                  {/* Parse basic markdown like *bold* and _italic_ */}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {m.text.split('\n').map((line, i) => (
                      <p key={i} className="min-h-[14px]">
                        {line.split(/(\*[^*]+\*|_[^_]+_)/g).map((part, idx) => {
                          if (part.startsWith('*') && part.endsWith('*')) {
                            return <strong key={idx}>{part.slice(1, -1)}</strong>;
                          }
                          if (part.startsWith('_') && part.endsWith('_')) {
                            return <em key={idx}>{part.slice(1, -1)}</em>;
                          }
                          return part;
                        })}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#647067]">
                    <span>{m.time}</span>
                    {!isBot && <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="bg-[#EFEAE2] px-3 py-1.5 flex gap-1.5 overflow-x-auto border-t border-black/5">
          {step === 'MAIN_MENU' && (
            <>
              <button
                type="button"
                onClick={() => handleSend('1')}
                className="px-2.5 py-1 rounded-full bg-white text-[#17201A] text-[11px] font-bold shadow-xs hover:bg-[#F7FAF7] cursor-pointer"
              >
                1. View Businesses
              </button>
              <button
                type="button"
                onClick={() => handleSend('3')}
                className="px-2.5 py-1 rounded-full bg-white text-[#17201A] text-[11px] font-bold shadow-xs hover:bg-[#F7FAF7] cursor-pointer"
              >
                3. Track Order
              </button>
            </>
          )}

          {step === 'CHOOSE_FOOD' && botCart.length > 0 && (
            <button
              type="button"
              onClick={() => handleSend('checkout')}
              className="px-2.5 py-1 rounded-full bg-[#22C55E] text-white text-[11px] font-bold shadow-xs hover:bg-[#1BA855] cursor-pointer"
            >
              Checkout Now
            </button>
          )}

          {step === 'CHOOSE_FULFILLMENT' && (
            <>
              <button
                type="button"
                onClick={() => handleSend('1')}
                className="px-2.5 py-1 rounded-full bg-white text-[#17201A] text-[11px] font-bold shadow-xs hover:bg-[#F7FAF7] cursor-pointer"
              >
                1. Delivery
              </button>
              <button
                type="button"
                onClick={() => handleSend('2')}
                className="px-2.5 py-1 rounded-full bg-white text-[#17201A] text-[11px] font-bold shadow-xs hover:bg-[#F7FAF7] cursor-pointer"
              >
                2. Pickup
              </button>
            </>
          )}

          {step === 'PAYMENT_METHOD' && (
            <>
              <button
                type="button"
                onClick={() => handleSend('1')}
                className="px-2.5 py-1 rounded-full bg-white text-[#17201A] text-[11px] font-bold shadow-xs hover:bg-[#F7FAF7] cursor-pointer"
              >
                1. Cash
              </button>
              <button
                type="button"
                onClick={() => handleSend('2')}
                className="px-2.5 py-1 rounded-full bg-white text-[#17201A] text-[11px] font-bold shadow-xs hover:bg-[#F7FAF7] cursor-pointer"
              >
                2. Yoco Card
              </button>
            </>
          )}

          {step === 'CONFIRM_ORDER' && (
            <>
              <button
                type="button"
                onClick={() => handleSend('CONFIRM')}
                className="px-3 py-1 rounded-full bg-[#22C55E] text-white text-[11px] font-black shadow-xs hover:bg-[#1BA855] cursor-pointer animate-pulse"
              >
                CONFIRM
              </button>
              <button
                type="button"
                onClick={() => handleSend('CANCEL')}
                className="px-2.5 py-1 rounded-full bg-[#FBE6E4] text-[#EF4444] text-[11px] font-bold shadow-xs hover:bg-red-200 cursor-pointer"
              >
                CANCEL
              </button>
            </>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="bg-[#F0F2F5] p-2 flex items-center gap-2 border-t border-black/10"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message (e.g. 1, 2, confirm)..."
            className="flex-1 bg-white rounded-full px-4 py-2.5 text-xs text-[#17201A] outline-none border border-black/5"
          />

          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-[#22C55E] hover:bg-[#1BA855] text-white flex items-center justify-center shadow transition-transform active:scale-95 cursor-pointer shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
