import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, inr } from "@/api";
import { useCart } from "@/context/CartContext";
import StoreHeader from "@/components/StoreHeader";
import CartDrawer from "@/components/CartDrawer";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const initialForm = { name: "", phone: "", address: "", city: "", state: "", pincode: "", email: "" };

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState(initialForm);
  const [paying, setPaying] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const verifyAndFinish = async (orderId, paymentFields) => {
    const { data: order } = await api.post("/orders/verify", { order_id: orderId, ...paymentFields });
    clearCart();
    navigate(`/order-success/${order.id}`, { state: { order } });
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Your basket is empty");
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10))) {
      return toast.error("Enter a valid 10-digit phone number");
    }
    setPaying(true);
    try {
      const payload = {
        customer: { ...form, phone: form.phone.replace(/\D/g, "").slice(-10) },
        items: items.map((i) => ({ product_id: i.product_id, weight_grams: i.weight_grams, qty: i.qty })),
      };
      const { data } = await api.post("/orders/create", payload);

      if (data.mock) {
        await verifyAndFinish(data.order_id, {
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_signature",
        });
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Could not load payment gateway");
      const rzp = new window.Razorpay({
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        name: "SweetOClock",
        description: "Handcrafted Mithai",
        order_id: data.razorpay_order_id,
        prefill: { name: form.name, contact: form.phone, email: form.email || undefined },
        theme: { color: "#9A3412" },
        handler: (resp) =>
          verifyAndFinish(data.order_id, {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          }).catch((err) => toast.error(formatApiError(err))),
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (err) {
      toast.error(formatApiError(err));
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <StoreHeader />
      <CartDrawer />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link to="/" data-testid="checkout-back-link" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-[#9A3412]">
          <ArrowLeft className="h-4 w-4" /> Continue shopping
        </Link>
        <h1 className="mb-8 font-serif text-3xl font-bold text-stone-900 sm:text-4xl">Guest Checkout</h1>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-500" data-testid="checkout-empty">
            Your basket is empty. <Link to="/" className="font-semibold text-[#9A3412]">Browse mithai →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <form onSubmit={handlePay} className="space-y-4 lg:col-span-3" data-testid="checkout-form">
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h2 className="mb-4 font-serif text-xl font-bold text-stone-800">Delivery Details</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Full Name</label>
                    <input data-testid="checkout-name-input" required value={form.name} onChange={set("name")} className="w-full rounded-xl border border-stone-300 bg-[#FAF6F0] px-4 py-2.5 text-sm outline-none focus:border-[#9A3412]" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Phone</label>
                    <input data-testid="checkout-phone-input" required value={form.phone} onChange={set("phone")} className="w-full rounded-xl border border-stone-300 bg-[#FAF6F0] px-4 py-2.5 text-sm outline-none focus:border-[#9A3412]" placeholder="9876543210" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Email (optional)</label>
                    <input data-testid="checkout-email-input" type="email" value={form.email} onChange={set("email")} className="w-full rounded-xl border border-stone-300 bg-[#FAF6F0] px-4 py-2.5 text-sm outline-none focus:border-[#9A3412]" placeholder="you@example.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Delivery Address</label>
                    <textarea data-testid="checkout-address-input" required rows={2} value={form.address} onChange={set("address")} className="w-full rounded-xl border border-stone-300 bg-[#FAF6F0] px-4 py-2.5 text-sm outline-none focus:border-[#9A3412]" placeholder="House / street / landmark" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">City</label>
                    <input data-testid="checkout-city-input" required value={form.city} onChange={set("city")} className="w-full rounded-xl border border-stone-300 bg-[#FAF6F0] px-4 py-2.5 text-sm outline-none focus:border-[#9A3412]" placeholder="Nagpur" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">State</label>
                      <input data-testid="checkout-state-input" required value={form.state} onChange={set("state")} className="w-full rounded-xl border border-stone-300 bg-[#FAF6F0] px-4 py-2.5 text-sm outline-none focus:border-[#9A3412]" placeholder="Maharashtra" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Pincode</label>
                      <input data-testid="checkout-pincode-input" required pattern="\d{6}" value={form.pincode} onChange={set("pincode")} className="w-full rounded-xl border border-stone-300 bg-[#FAF6F0] px-4 py-2.5 text-sm outline-none focus:border-[#9A3412]" placeholder="440001" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                data-testid="pay-razorpay-btn"
                type="submit"
                disabled={paying}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#9A3412] py-3.5 text-sm font-bold text-[#FAF6F0] transition-colors hover:bg-[#7C2D12] disabled:opacity-60"
              >
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {paying ? "Processing…" : `Pay ${inr(subtotal)} via Razorpay`}
              </button>
              <p className="text-center text-xs text-stone-400">Prepaid only · UPI, cards &amp; netbanking accepted</p>
            </form>

            <aside className="lg:col-span-2">
              <div className="rounded-2xl border border-stone-200 bg-white p-6" data-testid="checkout-summary">
                <h2 className="mb-4 font-serif text-xl font-bold text-stone-800">Order Summary</h2>
                <ul className="space-y-3">
                  {items.map((i) => (
                    <li key={i.key} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3">
                        <img src={i.image_url} alt={i.name} className="h-11 w-11 rounded-lg object-cover" />
                        <div>
                          <p className="font-semibold text-stone-800">{i.name}</p>
                          <p className="text-xs text-stone-500">{i.weight_grams}g × {i.qty}</p>
                        </div>
                      </div>
                      <p className="font-bold text-amber-900">{inr((i.price_per_kg * i.weight_grams * i.qty) / 1000)}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 space-y-1.5 border-t border-stone-200 pt-4 text-sm">
                  <div className="flex justify-between text-stone-600"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
                  <div className="flex justify-between text-emerald-700"><span>Delivery</span><span>Free</span></div>
                  <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900">
                    <span>Total</span><span data-testid="checkout-total">{inr(subtotal)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
