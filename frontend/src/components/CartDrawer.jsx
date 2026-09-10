import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { IconClose, IconTrash, IconArrowRight } from "@/components/Icons";

export const CartDrawer = () => {
  const { cart, count, subtotal, delivery, total, cartOpen, closeCart, setQty, removeFromCart } = useCart();
  const navigate = useNavigate();

  const goToCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <>
      <div
        className={`cart-backdrop${cartOpen ? " show" : " hidden"}`}
        onClick={closeCart}
        data-testid="cart-backdrop"
      />
      <aside className={`cart-drawer${cartOpen ? " open" : " closed"}`} data-testid="cart-drawer">
        <div className="cart-drawer-header">
          <div>
            <div className="edition-tag" style={{ display: "block" }}>Your basket</div>
            <div className="cart-drawer-title" data-testid="cart-item-count-label">
              {count} {count === 1 ? "item" : "items"}
            </div>
          </div>
          <button className="qty-btn qty-btn-lg" aria-label="Close cart" onClick={closeCart} data-testid="close-cart-btn">
            <IconClose />
          </button>
        </div>

        <div className="cart-items no-scrollbar">
          {cart.length === 0 ? (
            <div className="empty-cart" data-testid="empty-cart">
              <div className="empty-cart-title">Your basket is empty.</div>
              <p className="empty-cart-copy">Something sweet is waiting on the shelf.</p>
              <button className="btn-pill btn-ink" onClick={closeCart}>
                Browse sweets <IconArrowRight />
              </button>
            </div>
          ) : (
            cart.map((it) => (
              <div className="cart-item" key={it.id} data-testid={`cart-item-${it.slug}`}>
                <img className="cart-item-img" src={it.image} alt={it.name} />
                <div className="cart-item-info">
                  <div className="cart-item-top">
                    <div>
                      <div className="cart-item-name">{it.name}</div>
                      <div className="cart-item-unit">{it.unit}</div>
                    </div>
                    <button className="remove-btn" aria-label="Remove" onClick={() => removeFromCart(it.id)} data-testid={`remove-${it.slug}`}>
                      <IconTrash />
                    </button>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="qty-controls">
                      <button className="qty-btn" onClick={() => setQty(it.id, it.quantity - 1)} data-testid={`qty-dec-${it.slug}`}>−</button>
                      <span className="qty-value">{it.quantity}</span>
                      <button className="qty-btn" onClick={() => setQty(it.id, it.quantity + 1)} data-testid={`qty-inc-${it.slug}`}>+</button>
                    </div>
                    <div className="cart-item-price">₹{it.price * it.quantity}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-summary">
            <div className="cart-summary-row"><span>Subtotal</span><span data-testid="cart-subtotal">₹{subtotal}</span></div>
            <div className="cart-summary-row">
              <span>Delivery{subtotal >= 799 ? <em style={{ fontStyle: "italic" }}> (free)</em> : ""}</span>
              <span>{delivery === 0 ? "—" : `₹${delivery}`}</span>
            </div>
            <div className="cart-summary-total">
              <span className="edition-tag" style={{ display: "block" }}>Total</span>
              <span className="cart-total-amount" data-testid="cart-total">₹{total}</span>
            </div>
            <button className="btn-pill btn-ink cart-checkout-btn" onClick={goToCheckout} data-testid="checkout-btn">
              Checkout <IconArrowRight />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
