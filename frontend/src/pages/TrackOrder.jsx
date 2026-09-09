import { useState } from "react";
import { Check, Loader2, Package, PackageCheck, PackageSearch, Truck, Home } from "lucide-react";
import { api, formatApiError, inr } from "@/api";
import StoreHeader from "@/components/StoreHeader";
import CartDrawer from "@/components/CartDrawer";

const STEPS = [
  { key: "paid", label: "Paid", icon: PackageCheck },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const { data } = await api.get("/orders/track", { params: { order_number: orderNumber, phone } });
      setOrder(data);
    } catch (err) {
      setError(formatApiError(err, "Order not found"));
    } finally {
      setLoading(false);
    }
  };

  const currentIdx = order ? STEPS.findIndex((s) => s.key === order.status) : -1;

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <StoreHeader />
      <CartDrawer />
      <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">Track Your Order</h1>
        <p className="mt-2 text-sm text-stone-500">Enter your Order ID (e.g. SOC-AB12CD) and the phone number used at checkout.</p>

        <form onSubmit={search} className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-6" data-testid="track-form">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Order ID</label>
            <input data-testid="track-order-id-input" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="w-full rounded-xl border border-stone-300 bg-[#FAF6F0] px-4 py-2.5 text-sm outline-none focus:border-[#9A3412]" placeholder="SOC-XXXXXX" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Phone Number</label>
            <input data-testid="track-phone-input" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-stone-300 bg-[#FAF6F0] px-4 py-2.5 text-sm outline-none focus:border-[#9A3412]" placeholder="9876543210" />
          </div>
          <button data-testid="track-search-submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#9A3412] py-3 text-sm font-bold text-[#FAF6F0] transition-colors hover:bg-[#7C2D12] disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
            Track Order
          </button>
        </form>

        {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-center text-sm text-red-700" data-testid="track-error">{error}</p>}

        {order && (
          <div className="fade-up mt-8 rounded-2xl border border-stone-200 bg-white p-6" data-testid="track-result">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="font-mono text-lg font-bold text-[#9A3412]">{order.order_number}</p>
                <p className="text-xs text-stone-500">Placed on {order.created_at.slice(0, 10)} · {inr(order.total)}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-900" data-testid="track-status-badge">
                {order.status}
              </span>
            </div>

            {order.status === "created" ? (
              <p className="text-sm text-stone-500">Awaiting payment confirmation.</p>
            ) : (
              <div className="flex items-center">
                {STEPS.map((s, idx) => {
                  const done = idx <= currentIdx;
                  return (
                    <div key={s.key} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${done ? "border-[#9A3412] bg-[#9A3412] text-white" : "border-stone-300 text-stone-400"}`} data-testid={`track-step-${s.key}`}>
                          {done ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                        </span>
                        <span className={`text-[11px] font-semibold ${done ? "text-stone-800" : "text-stone-400"}`}>{s.label}</span>
                      </div>
                      {idx < STEPS.length - 1 && <div className={`mx-1 mb-5 h-0.5 flex-1 ${idx < currentIdx ? "bg-[#9A3412]" : "bg-stone-200"}`} />}
                    </div>
                  );
                })}
              </div>
            )}

            {order.shipment?.awb && (
              <div className="mt-6 rounded-xl bg-sky-50 p-4 text-sm" data-testid="track-shipment-info">
                <p className="font-semibold text-sky-900">
                  Courier: {order.shipment.courier || "Shiprocket"} · AWB: <span className="font-mono">{order.shipment.awb}</span>
                </p>
                {order.shipment.last_status && <p className="mt-1 text-xs text-sky-700">Latest: {order.shipment.last_status}</p>}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
