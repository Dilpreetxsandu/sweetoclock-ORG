import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { IconPlus, IconArrowRight, Star } from "@/components/Icons";

// Product card — click navigates to the product page; action buttons stop propagation.
export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, openCart, showToast } = useCart();
  const p = product;

  const goToProduct = () => navigate(`/product/${p.slug}`);

  const onAdd = (e) => {
    e.stopPropagation();
    addToCart(p, 1);
    showToast(`${p.name} added to cart`);
  };
  const onBuy = (e) => {
    e.stopPropagation();
    addToCart(p, 1);
    openCart();
  };

  return (
    <article className="product-card" onClick={goToProduct} data-testid={`product-card-${p.slug}`}>
      <div className="spotlight">
        <img className="product-img" src={p.image} alt={p.name} loading="lazy" />
        <div className="spot-glow" />
        {p.badge && <span className="product-badge sticker">{p.badge}</span>}
      </div>
      <div className="product-body">
        <div className="product-meta-row">
          <span>{p.category}</span>
          <span className="product-rating">
            <Star />
            {p.rating} <span className="product-reviews">({p.reviews})</span>
          </span>
        </div>
        <h3 className="product-name">{p.name}</h3>
        <p className="product-tagline">{p.tagline}</p>
        <div className="product-bottom-row">
          <div>
            <span className="product-price">₹{p.price}</span>
            {p.compare_at && <span className="product-compare">₹{p.compare_at}</span>}
            <span className="product-unit">per {p.unit}</span>
          </div>
          <div className="product-actions">
            <button className="qty-btn" aria-label={`Add ${p.name}`} onClick={onAdd} data-testid={`add-to-cart-${p.slug}`}>
              <IconPlus />
            </button>
            <button className="btn-pill btn-matcha" onClick={onBuy} data-testid={`buy-now-${p.slug}`}>
              Buy now <IconArrowRight />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
