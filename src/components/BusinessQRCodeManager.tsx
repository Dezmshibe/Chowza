import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Printer,
  QrCode,
} from 'lucide-react';

type BusinessQRCodeManagerProps = {
  businessId: string;
  businessName: string;
  businessSlug: string;
  onBack: () => void;
};

export function BusinessQRCodeManager({
  businessName,
  businessSlug,
  onBack,
}: BusinessQRCodeManagerProps) {
  const [copied, setCopied] = useState(false);

  const orderingUrl = useMemo(() => {
    return `${window.location.origin}/business/${businessSlug}`;
  }, [businessSlug]);

  const qrImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=${encodeURIComponent(
      orderingUrl,
    )}&bgcolor=ffffff&color=17201A&margin=2`;
  }, [orderingUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(orderingUrl);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2200);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${businessSlug}-chowza-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch {
      window.open(qrImageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#17201A]">
      <header className="border-b border-[#E1EAE3] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#D7E2DA] p-2 transition hover:bg-[#F7FAF7]"
            aria-label="Back"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#647067]">
              Chowza Business
            </p>
            <h1 className="text-xl font-black tracking-tight">
              QR Code
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section
            id="printable-business-qr"
            className="rounded-3xl border border-[#D7E2DA] bg-white p-8 shadow-sm"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E4F9EC] text-[#166534]">
                <QrCode size={25} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#647067]">
                Scan to order
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#17201A]">
                {businessName}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-[#647067]">
                Customers can scan this QR code to open your Chowza store
                and place an order.
              </p>
            </div>

            <div className="mx-auto mt-8 flex max-w-md justify-center rounded-3xl border border-[#D7E2DA] bg-[#F7FAF7] p-6">
              <img
                src={qrImageUrl}
                alt={`Chowza QR code for ${businessName}`}
                className="h-72 w-72 rounded-xl bg-white"
              />
            </div>

            <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-[#17201A] px-5 py-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9CA89F]">
                Your Chowza store
              </p>

              <p className="mt-1 break-all font-mono text-sm text-white">
                {orderingUrl}
              </p>
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-[#D7E2DA] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-[#17201A]">
              QR tools
            </h3>

            <p className="mt-1 text-sm leading-6 text-[#647067]">
              Use this QR code on tables, posters, packaging, flyers,
              receipts or your shop counter.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#14532D]"
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? 'Link copied' : 'Copy store link'}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 text-sm font-bold text-[#17201A] transition hover:bg-[#F7FAF7]"
              >
                <Download size={17} />
                Download QR
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 text-sm font-bold text-[#17201A] transition hover:bg-[#F7FAF7]"
              >
                <Printer size={17} />
                Print QR
              </button>

              <button
                type="button"
                onClick={() =>
                  window.open(
                    orderingUrl,
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 text-sm font-bold text-[#17201A] transition hover:bg-[#F7FAF7]"
              >
                <ExternalLink size={17} />
                Open public store
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-[#E4F9EC] p-4">
              <p className="text-sm font-bold text-[#166534]">
                One QR per business
              </p>
              <p className="mt-1 text-xs leading-5 text-[#166534]/80">
                This QR always points to your business's public Chowza
                store. It does not expose your dashboard or private data.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
