import { useState } from "react";
import { api, API, formatApiError } from "@/api";
import { IconArrowRight, IconArrowUpRight } from "@/components/Icons";

const STEPS = [
  { key: "paid", label: "Paid" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
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
    <main className="pdp-bg">
      <div className="co-top section-inner" style={{ maxWidth: 720 }}>
        <span className="sticker"><span className="dot" /> Order tracking</span>
        <h1 className="co-heading">Where's my <span className="italic-olive">mithai?</span></h1>

        <div className="co-card">
          <h2 className="co-card-title">Track your order</h2>
          <form onSubmit={search} data-testid="track-form">
            <label className="field">
              <span className="field-label">Order ID</span>
              <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="SOC-XXXXXX" data-testid="track-order-id-input" required />
            </label>
            <label className="field">
              <span className="field-label">Phone number</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile used at checkout" data-testid="track-phone-input" required />
            </label>
            <button type="submit" className="btn-pill btn-ink co-continue-btn" disabled={loading} data-testid="track-search-submit">
              {loading ? "Searching…" : "Track order"} <IconArrowRight />
            </button>
          </form>
          {error && <p className="pin-hint err" style={{ marginTop: 12 }} data-testid="track-error">{error}</p>}
        </div>

        {order && (
          <div className="co-card" style={{ marginTop: 24 }} data-testid="track-result">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div className="edition-tag" style={{ display: "block" }}>{order.order_number}</div>
                <div className="cart-drawer-title">Placed {order.created_at.slice(0, 10)} · ₹{order.total}</div>
              </div>
              <span className="sticker" data-testid="track-status-badge">{order.status}</span>
            </div>

            {order.status === "created" ? (
              <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 14 }}>Awaiting payment confirmation.</p>
            ) : (
              <div className="co-steps" style={{ marginTop: 24, marginBottom: 0 }}>
                {STEPS.map((s, idx) => (
                  <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={`co-step${idx <= currentIdx ? " done" : ""}`} data-testid={`track-step-${s.key}`}>
                      <span className="num">{idx + 1}</span> {s.label}
                    </span>
                    {idx < STEPS.length - 1 && <span className="co-step-sep" />}
                  </span>
                ))}
              </div>
            )}

            {order.shipment?.awb && (
              <div className="checkout-summary-box" style={{ marginTop: 20 }} data-testid="track-shipment-info">
                <div className="row"><span>Courier</span><span>{order.shipment.courier || "Shiprocket"}</span></div>
                <div className="row"><span>AWB</span><span style={{ fontFamily: "monospace" }}>{order.shipment.awb}</span></div>
                {order.shipment.last_status && <div className="row"><span>Latest</span><span>{order.shipment.last_status}</span></div>}
              </div>
            )}

            <a href={`${API}/orders/${order.id}/invoice`} className="btn-pill btn-outline" style={{ marginTop: 20 }} data-testid="track-invoice-link">
              Download invoice <IconArrowUpRight />
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
