import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { api, API, formatApiError } from "@/api";
import { IconChevronLeft, IconCheck, IconArrowRight, IconArrowUpRight } from "@/components/Icons";

const METHODS = [
  { id: "upi", name: "UPI", desc: "GPay, PhonePe, Paytm & more", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 17 17 7M9 7h8v8" /></svg>
  ) },
  { id: "card", name: "Cards", desc: "Credit / Debit card", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
  ) },
  { id: "netbanking", name: "Netbanking", desc: "All major banks", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21h18M4 10h16M12 3 3 7h18zM6 10v8M10 10v8M14 10v8M18 10v8" /></svg>
  ) },
  { id: "wallet", name: "Wallets", desc: "Amazon Pay, Mobikwik", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M16 12h3M3 7l14-4v4" /></svg>
  ) },
];

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export default function Payment() {
  const navigate = useNavigate();
  const { cart, total, address, clearCart, showToast } = useCart();
  const [method, setMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState(null);

  if (!order && cart.length === 0) return <Navigate to="/" replace />;
  if (!order && (!address.firstName || !address.phone || address.pincode.length !== 6)) return <Navigate to="/checkout" replace />;

  const finish = (o) => {
    setOrder(o);
    clearCart();
    setProcessing(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const verifyAndFinish = async (orderId, paymentFields) => {
    const { data: o } = await api.post("/orders/verify", { order_id: orderId, ...paymentFields });
    finish(o);
  };

  const pay = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const payload = {
        customer: {
          name: `${address.firstName} ${address.lastName}`.trim(),
          phone: address.phone.replace(/\D/g, "").slice(-10),
          address: [address.address, address.landmark].filter(Boolean).join(", "),
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        items: cart.map((i) => ({ product_id: i.id, qty: i.quantity })),
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
        name: "Sweet'O Clock",
        description: "Handcrafted Mithai",
        order_id: data.razorpay_order_id,
        prefill: { name: payload.customer.name, contact: payload.customer.phone },
        theme: { color: "#4a5b1f" },
        handler: (resp) =>
          verifyAndFinish(data.order_id, {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          }).catch((err) => {
            showToast(formatApiError(err));
            setProcessing(false);
          }),
        modal: { ondismiss: () => setProcessing(false) },
      });
      rzp.open();
    } catch (err) {
      showToast(formatApiError(err));
      setProcessing(false);
    }
  };

  if (order) {
    return (
      <main className="pdp-bg">
        <div className="co-top section-inner">
          <div className="co-layout" style={{ gridTemplateColumns: "1fr", maxWidth: 620, margin: "0 auto" }}>
            <div className="co-card" data-testid="payment-success" style={{ textAlign: "center" }}>
              <div className="success-check" style={{ margin: "0 auto" }}><IconCheck /></div>
              <h2 className="success-heading">
                Payment received, <br />
                <span className="italic-olive">{order.customer.name.split(" ")[0]}.</span>
              </h2>
              <p className="success-copy">
                Order <strong data-testid="order-success-number">{order.order_number}</strong> is confirmed — packed with love,
                dispatched fresh, delivered to {order.customer.city}.
              </p>
              <div className="success-box">
                {order.items.map((i, idx) => (
                  <div className="row" key={idx}><span>{i.name} × {i.qty}</span><span>₹{i.line_total}</span></div>
                ))}
                <div className="row"><span>Delivery</span><span>{order.delivery_fee === 0 ? "Free" : `₹${order.delivery_fee}`}</span></div>
                <div className="row total"><span>Paid via Razorpay</span><span data-testid="order-success-total">₹{order.total}</span></div>
              </div>
              <p className="success-copy" style={{ marginTop: 16, fontSize: 12 }}>
                {order.invoice_channel === "whatsapp"
                  ? "Your invoice has been sent to your WhatsApp."
                  : "Invoice ready — download the PDF below (WhatsApp delivery starts once our sender is approved)."}
              </p>
              <a
                href={`${API}/orders/${order.id}/invoice`}
                className="btn-pill btn-matcha"
                style={{ width: "100%", justifyContent: "center", marginTop: 16, display: "inline-flex" }}
                data-testid="download-invoice-btn"
              >
                Download invoice <IconArrowUpRight />
              </a>
              <button className="btn-pill btn-ink" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={() => navigate("/track")} data-testid="success-track-btn">
                Track your order <IconArrowRight />
              </button>
              <button className="btn-pill btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={() => navigate("/")} data-testid="success-continue">
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pdp-bg" data-testid="payment-page">
      <div className="co-top section-inner">
        <button className="co-back-link" onClick={() => navigate("/checkout")}><IconChevronLeft /> Back to address</button>

        <div className="co-steps">
          <span className="co-step done"><span className="num">1</span> Cart</span>
          <span className="co-step-sep" />
          <span className="co-step done"><span className="num">2</span> Address</span>
          <span className="co-step-sep" />
          <span className="co-step active"><span className="num">3</span> Payment</span>
        </div>

        <h1 className="co-heading">Almost <span className="italic-olive">yours.</span></h1>

        <div className="co-layout">
          {/* RAZORPAY PANEL */}
          <div className="rzp-panel" data-testid="razorpay-panel">
            <div className="rzp-header">
              <div className="rzp-brand">
                <span className="rzp-logo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m14 3-8 11h6l-2 7 8-11h-6z" /></svg>
                </span>
                Razorpay
              </div>
              <div className="rzp-amount">
                <div className="lbl">Amount payable</div>
                <div className="val">₹{total}</div>
              </div>
            </div>
            <div className="rzp-merchant">
              Paying <strong>Sweet'O Clock</strong> · Delivering to {address.firstName} {address.lastName}, {address.city}
            </div>
            <div className="rzp-body">
              <div className="rzp-section-title">Choose a payment method</div>
              <div className="rzp-methods">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`rzp-method${method === m.id ? " active" : ""}`}
                    onClick={() => setMethod(m.id)}
                    data-testid={`pay-method-${m.id}`}
                  >
                    <span className="rzp-ic">{m.icon}</span>
                    <span>
                      <span className="rzp-method-name">{m.name}</span>
                      <span className="rzp-method-desc" style={{ display: "block" }}>{m.desc}</span>
                    </span>
                    <span className="rzp-radio" />
                  </button>
                ))}
              </div>

              <button className="rzp-pay-btn" onClick={pay} disabled={processing} data-testid="rzp-pay-btn">
                {processing ? <><span className="rzp-spinner" /> Processing…</> : `Pay ₹${total}`}
              </button>
              <div className="rzp-secure">Secured by Razorpay · 256-bit encryption</div>

              <div className="rzp-demo-note" data-testid="rzp-demo-note">
                Demo mode — no real payment is processed yet. Live Razorpay keys go in the server environment to accept real payments.
              </div>
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div className="co-card co-summary-card">
            <h2 className="co-card-title">Order summary</h2>
            {cart.map((it) => (
              <div className="co-summary-line" key={it.id}>
                <img className="co-summary-img" src={it.image} alt={it.name} />
                <div>
                  <div className="co-summary-name">{it.name}</div>
                  <div className="co-summary-qty">Qty {it.quantity} · {it.unit}</div>
                </div>
                <div className="co-summary-price">₹{it.price * it.quantity}</div>
              </div>
            ))}
            <div className="co-summary-grand">
              <span className="edition-tag" style={{ display: "block" }}>Total</span>
              <span className="amt" data-testid="payment-total">₹{total}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
