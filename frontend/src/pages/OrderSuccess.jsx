import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, API } from "@/api";
import { IconCheck, IconArrowRight, IconArrowUpRight } from "@/components/Icons";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/orders/${orderId}`).then((r) => setOrder(r.data)).catch(() => setError("Order not found"));
  }, [orderId]);

  return (
    <main className="pdp-bg">
      <div className="co-top section-inner" style={{ maxWidth: 620 }}>
        {error && <p className="pin-hint err" data-testid="order-success-error">{error}</p>}
        {order && (
          <div className="co-card" data-testid="order-success-card" style={{ textAlign: "center" }}>
            <div className="success-check" style={{ margin: "0 auto" }}><IconCheck /></div>
            <h2 className="success-heading">Order <span className="italic-olive">confirmed.</span></h2>
            <p className="success-copy">
              Order <strong data-testid="order-success-number">{order.order_number}</strong> · {order.customer.name}
            </p>
            <div className="success-box">
              {order.items.map((i, idx) => (
                <div className="row" key={idx}><span>{i.name} × {i.qty}</span><span>₹{i.line_total}</span></div>
              ))}
              <div className="row"><span>Delivery</span><span>{order.delivery_fee === 0 ? "Free" : `₹${order.delivery_fee}`}</span></div>
              <div className="row total"><span>Total paid</span><span data-testid="order-success-total">₹{order.total}</span></div>
            </div>
            <a href={`${API}/orders/${order.id}/invoice`} className="btn-pill btn-ink" style={{ width: "100%", justifyContent: "center", marginTop: 24, display: "inline-flex" }} data-testid="download-invoice-btn">
              Download invoice <IconArrowUpRight />
            </a>
            <button className="btn-pill btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={() => navigate("/track")} data-testid="order-success-track-link">
              Track order <IconArrowRight />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
