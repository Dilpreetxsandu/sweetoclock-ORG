import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Download, MessageCircle, PackageSearch } from "lucide-react";
import { api, API, inr } from "@/api";
import StoreHeader from "@/components/StoreHeader";
import CartDrawer from "@/components/CartDrawer";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/orders/${orderId}`).then((r) => setOrder(r.data)).catch(() => setError("Order not found"));
  }, [orderId]);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <StoreHeader />
      <CartDrawer />
      <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        {error && <p className="text-center text-red-600" data-testid="order-success-error">{error}</p>}
        {order && (
          <div className="fade-up rounded-2xl border border-stone-200 bg-white p-8 text-center" data-testid="order-success-card">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
            <h1 className="mt-4 font-serif text-3xl font-bold text-stone-900">Order Confirmed!</h1>
            <p className="mt-2 text-sm text-stone-600">
              Thank you, {order.customer.name}. Your mithai is being prepared.
            </p>
            <div className="mx-auto mt-6 inline-block rounded-xl bg-amber-50 px-6 py-3">
              <p className="text-xs uppercase tracking-widest text-stone-500">Order ID</p>
              <p className="font-mono text-2xl font-bold text-[#9A3412]" data-testid="order-success-number">{order.order_number}</p>
            </div>
            <div className="mt-6 space-y-2 rounded-xl border border-stone-200 p-4 text-left text-sm">
              {order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-stone-700">{i.name} · {i.weight_grams}g × {i.qty}</span>
                  <span className="font-semibold text-stone-900">{inr(i.line_total)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-stone-200 pt-2 font-bold text-stone-900">
                <span>Total Paid</span><span data-testid="order-success-total">{inr(order.total)}</span>
              </div>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-500">
              <MessageCircle className="h-3.5 w-3.5" />
              {order.invoice_channel === "whatsapp"
                ? "Invoice sent to your WhatsApp."
                : "WhatsApp delivery pending sender approval — download your invoice PDF below."}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                data-testid="download-invoice-btn"
                href={`${API}/orders/${order.id}/invoice`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9A3412] px-6 py-3 text-sm font-bold text-[#FAF6F0] transition-colors hover:bg-[#7C2D12]"
              >
                <Download className="h-4 w-4" /> Download Invoice
              </a>
              <Link
                to="/track"
                data-testid="order-success-track-link"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-amber-600 hover:text-[#9A3412]"
              >
                <PackageSearch className="h-4 w-4" /> Track Order
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
