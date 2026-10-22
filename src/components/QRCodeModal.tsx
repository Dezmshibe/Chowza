import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QrCode, Printer, Download, ExternalLink, Copy, Check, Sparkles } from 'lucide-react';

export const QRCodeModal: React.FC = () => {
  const { ownerBusiness, setCurrentView, setSelectedStoreBusiness, addFlash } = useApp();
  const [tableNumber, setTableNumber] = useState('Table 01');
  const [copied, setCopied] = useState(false);

  const orderingUrl = `${window.location.origin}/business/${ownerBusiness.slug}`;

  // Simple clean SVG QR code simulation or qr API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    `${orderingUrl}?table=${encodeURIComponent(tableNumber)}`
  )}&bgcolor=ffffff&color=1B1815&margin=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${orderingUrl}?table=${encodeURIComponent(tableNumber)}`);
    setCopied(true);
    addFlash('success', 'Ordering link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container max-w-xl py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1B1815] tracking-tight">
          Table & Counter QR Code
        </h1>
        <p className="text-xs text-[#5A544C] mt-1">
          Place this on tables, takeout counters or flyers. Customers scan to order instantly!
        </p>
      </div>

      {/* Printable Poster Card */}
      <div
        id="printable-qr-card"
        className="card p-8 bg-white border-2 border-[#1B1815] rounded-3xl shadow-xl text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E4F9EC] text-[#176B35] rounded-full text-xs font-black">
          <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
          <span>WhatsApp Food · Instant Order</span>
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#1B1815] tracking-tight">
            {ownerBusiness.businessName}
          </h2>
          <p className="text-xs text-[#5A544C] mt-0.5">{ownerBusiness.category}</p>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-[#F3EEE4] rounded-2xl inline-block border border-[#1B1815]/10 shadow-inner">
          <img
            src={qrImageUrl}
            alt={`QR code for ${ownerBusiness.businessName}`}
            className="w-56 h-56 mx-auto rounded-lg shadow-sm"
          />
        </div>

        <div>
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#1B1815] text-white font-extrabold text-sm tracking-wide">
            {tableNumber}
          </div>
          <p className="text-xs text-[#8C857A] mt-2">
            Scan with your phone camera or WhatsApp to open digital menu & order
          </p>
        </div>

        <div className="text-[11px] text-[#8C857A] pt-2 border-t border-[#1B1815]/10 font-mono">
          {orderingUrl}?table={encodeURIComponent(tableNumber)}
        </div>
      </div>

      {/* Settings & Customization */}
      <div className="card p-5 space-y-4 bg-[#FDFBF7]">
        <h3 className="text-sm font-bold text-[#1B1815]">Customize Standee</h3>

        <div className="field">
          <label htmlFor="table-label">Table or Counter Label</label>
          <input
            id="table-label"
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="e.g. Table 04, VIP Booth, Takeaway Counter"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <button
            onClick={handleCopyLink}
            className="btn btn-outline btn-sm font-bold flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-[#176B35]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn btn-dark btn-sm font-bold flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Standee</span>
          </button>

          <button
            onClick={() => {
              setSelectedStoreBusiness(ownerBusiness);
              setCurrentView('store');
            }}
            className="btn btn-primary btn-sm font-bold flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
