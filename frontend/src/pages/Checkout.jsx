import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { INDIAN_STATES } from "@/data/states";
import { IconArrowRight, IconChevronLeft } from "@/components/Icons";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, subtotal, delivery, total, address, setAddress, showToast } = useCart();
  const [pinStatus, setPinStatus] = useState({ loading: false, msg: "", err: false });

  const set = (k) => (e) => setAddress((a) => ({ ...a, [k]: e.target.value }));

  const onPincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setAddress((a) => ({ ...a, pincode: value }));
    if (value.length !== 6) {
      setPinStatus({ loading: false, msg: "", err: false });
      return;
    }
    setPinStatus({ loading: true, msg: "Looking up your area…", err: false });
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
      const data = await res.json();
      const entry = data?.[0];
      if (entry?.Status === "Success" && entry.PostOffice?.length) {
        const po = entry.PostOffice[0];
        const city = po.District || po.Block || po.Name || "";
        const state = po.State || "";
        setAddress((a) => ({ ...a, city, state }));
        setPinStatus({ loading: false, msg: `${city}, ${state} — auto-filled`, err: false });
      } else {
        setPinStatus({ loading: false, msg: "Couldn't find that pincode. Please enter city & state manually.", err: true });
      }
    } catch {
      setPinStatus({ loading: false, msg: "Lookup unavailable. Please enter city & state manually.", err: true });
    }
  };

  const onContinue = (e) => {
    e.preventDefault();
    const { firstName, lastName, phone, address: line, city, state, pincode } = address;
    if (!firstName || !lastName || !phone || !line || !city || !state || !pincode) {
      showToast("Please fill all required fields");
      return;
    }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10))) {
      showToast("Enter a valid 10-digit phone number");
      return;
    }
    if (pincode.length !== 6) {
      showToast("Enter a valid 6-digit pincode");
      return;
    }
    navigate("/payment");
  };

  if (cart.length === 0) {
    return (
      <main className="pdp-bg">
        <div className="co-top section-inner">
          <div className="co-empty" data-testid="checkout-empty">
            <div className="co-empty-title">Your basket is empty.</div>
            <p>Add a sweet or two before heading to checkout.</p>
            <button className="btn-pill btn-ink" onClick={() => navigate("/")}>Browse sweets <IconArrowRight /></button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pdp-bg" data-testid="checkout-page">
      <div className="co-top section-inner">
        <button className="co-back-link" onClick={() => navigate(-1)}><IconChevronLeft /> Back to cart</button>

        <div className="co-steps">
          <span className="co-step done"><span className="num">1</span> Cart</span>
          <span className="co-step-sep" />
          <span className="co-step active"><span className="num">2</span> Address</span>
          <span className="co-step-sep" />
          <span className="co-step"><span className="num">3</span> Payment</span>
        </div>

        <h1 className="co-heading">Where should <span className="italic-olive">it go?</span></h1>

        <div className="co-layout">
          {/* ADDRESS FORM */}
          <div className="co-card">
            <h2 className="co-card-title">Delivery address</h2>
            <form onSubmit={onContinue} id="address-form">
              <div className="field-row">
                <label className="field">
                  <span className="field-label">First name</span>
                  <input value={address.firstName} onChange={set("firstName")} data-testid="addr-first-name" />
                </label>
                <label className="field">
                  <span className="field-label">Last name</span>
                  <input value={address.lastName} onChange={set("lastName")} data-testid="addr-last-name" />
                </label>
              </div>

              <label className="field">
                <span className="field-label">Phone</span>
                <input inputMode="tel" value={address.phone} onChange={set("phone")} data-testid="addr-phone" placeholder="10-digit mobile number" />
              </label>

              <label className="field">
                <span className="field-label">Address</span>
                <textarea rows="2" value={address.address} onChange={set("address")} data-testid="addr-line" placeholder="House / flat no., street, area" />
              </label>

              <label className="field">
                <span className="field-label">Landmark <span className="optional">(optional)</span></span>
                <input value={address.landmark} onChange={set("landmark")} data-testid="addr-landmark" />
              </label>

              <div className="field-row">
                <label className="field">
                  <span className="field-label">Pincode</span>
                  <input inputMode="numeric" value={address.pincode} onChange={onPincodeChange} data-testid="addr-pincode" placeholder="6-digit PIN" />
                  {pinStatus.msg && (
                    <span className={`pin-hint${pinStatus.err ? " err" : ""}`} data-testid="pincode-hint">{pinStatus.msg}</span>
                  )}
                </label>
                <label className="field">
                  <span className="field-label">City</span>
                  <input value={address.city} onChange={set("city")} data-testid="addr-city" />
                </label>
              </div>

              <label className="field">
                <span className="field-label">State</span>
                <select value={address.state} onChange={set("state")} data-testid="addr-state">
                  <option value="">Select a state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <button type="submit" className="btn-pill btn-ink co-continue-btn" data-testid="continue-to-payment">
                Continue to payment <IconArrowRight />
              </button>
            </form>
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
            <div className="co-summary-totals">
              <div className="co-summary-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="co-summary-row"><span>Delivery</span><span>{delivery === 0 ? "Free" : `₹${delivery}`}</span></div>
            </div>
            <div className="co-summary-grand">
              <span className="edition-tag" style={{ display: "block" }}>Total</span>
              <span className="amt" data-testid="checkout-total">₹{total}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
