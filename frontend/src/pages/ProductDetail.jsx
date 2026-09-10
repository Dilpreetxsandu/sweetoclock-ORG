import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { ReviewsReel } from "@/components/ReviewsReel";
import {
  IconArrowRight, IconArrowUpRight, Star,
  IconLeaf, IconTruck, IconSun, IconGift,
} from "@/components/Icons";

const ASSURANCES = [
  { Icon: IconSun, title: "Made this morning", copy: "Hand-rolled between 4–6am the day it ships." },
  { Icon: IconLeaf, title: "Zero shortcuts", copy: "No preservatives, colours or flavour essences." },
  { Icon: IconTruck, title: "Free over ₹799", copy: "Cold-packed and delivered across India." },
  { Icon: IconGift, title: "Handwritten note", copy: "Every box packed with a note of your choosing." },
];

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, openCart, showToast } = useCart();
  const product = products.find((p) => p.slug === slug);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setActiveImg(0);
    setQty(1);
  }, [slug]);

  if (products.length === 0) return null;
  if (!product) return <Navigate to="/" replace />;

  const p = product;
  const gallery = p.gallery?.length ? p.gallery : [p.image];
  const about = p.about?.length ? p.about : [p.tagline].filter(Boolean);
  const ingredients = p.ingredients || [];
  const suggestions = products.filter((s) => s.slug !== slug).slice(0, 4);
  const savePct = p.compare_at ? Math.round(((p.compare_at - p.price) / p.compare_at) * 100) : 0;

  const onAdd = () => {
    addToCart(p, qty);
    showToast(`${qty} × ${p.name} added to cart`);
  };
  const onBuy = () => {
    addToCart(p, qty);
    openCart();
  };

  return (
    <main className="pdp-page">
      <section className="pdp-bg">
        <div className="pdp-top section-inner">
          <div className="pdp-breadcrumb" data-testid="pdp-breadcrumb">
            <button onClick={() => navigate("/")}>Home</button>
            <span>/</span>
            <button onClick={() => navigate("/", { state: { scrollTo: "products" } })}>Sweets</button>
            <span>/</span>
            <span className="current">{p.name}</span>
          </div>

          <div className="pdp-grid">
            {/* GALLERY */}
            <div className="pdp-gallery">
              <div className="pdp-main-image">
                {p.badge && <span className="pdp-main-badge sticker">{p.badge}</span>}
                <img key={activeImg} src={gallery[activeImg]} alt={`${p.name} view ${activeImg + 1}`} data-testid="pdp-main-image" />
              </div>
              <div className="pdp-thumbs" data-testid="pdp-thumbs">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    className={`pdp-thumb${i === activeImg ? " active" : ""}`}
                    onClick={() => setActiveImg(i)}
                    aria-label={`View image ${i + 1}`}
                    data-testid={`pdp-thumb-${i}`}
                  >
                    <img src={src} alt={`${p.name} thumbnail ${i + 1}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* INFO */}
            <div className="pdp-info">
              <div className="pdp-info-meta">
                <span>{p.category}</span>
                <span className="pdp-info-rating">
                  <Star /> {p.rating} <span className="product-reviews">({p.reviews} reviews)</span>
                </span>
              </div>

              <h1 className="pdp-name" data-testid="pdp-name">{p.name}</h1>
              <p className="pdp-tagline">{p.tagline}</p>

              <div className="pdp-price-row">
                <span className="pdp-price" data-testid="pdp-price">₹{p.price}</span>
                {p.compare_at && <span className="pdp-compare">₹{p.compare_at}</span>}
                <span className="pdp-unit">per {p.unit}</span>
                {savePct > 0 && <span className="pdp-save-tag">Save {savePct}%</span>}
              </div>

              <hr className="pdp-divider" />

              <div className="pdp-about" data-testid="pdp-about">
                <h3>About this sweet</h3>
                {about.map((para, i) => <p key={i}>{para}</p>)}
                <div className="pdp-ingredients">
                  {ingredients.map((ing) => (
                    <span className="pdp-ingredient-chip" key={ing}>{ing}</span>
                  ))}
                </div>
              </div>

              <div className="pdp-buy-row">
                <div className="pdp-qty" data-testid="pdp-qty">
                  <button className="qty-btn" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} data-testid="pdp-qty-dec">−</button>
                  <span className="pdp-qty-value" data-testid="pdp-qty-value">{qty}</span>
                  <button className="qty-btn" aria-label="Increase quantity" onClick={() => setQty((q) => q + 1)} data-testid="pdp-qty-inc">+</button>
                </div>
                <button className="btn-pill btn-ink pdp-add-btn" onClick={onAdd} data-testid="pdp-add-to-cart">
                  Add to cart · ₹{p.price * qty} <IconArrowRight />
                </button>
                <button className="btn-pill btn-matcha pdp-buy-now-btn" onClick={onBuy} data-testid="pdp-buy-now">
                  Buy now <IconArrowUpRight />
                </button>
              </div>

              <div className="pdp-assurances">
                {ASSURANCES.map(({ Icon, title, copy }) => (
                  <div className="pdp-assurance" key={title}>
                    <Icon />
                    <div>
                      <div className="pdp-assurance-title">{title}</div>
                      <div className="pdp-assurance-copy">{copy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="pdp-reviews-section" data-testid="pdp-reviews">
        <div className="section-inner testimonials-head">
          <div className="testimonials-head-grid">
            <div>
              <span className="sticker">Kind words</span>
              <h2 className="section-heading">Loved by <br /><span className="italic-olive">sweet-toothed folk.</span></h2>
            </div>
            <div className="testimonials-copy-col">
              <p className="testimonials-copy">A few of the notes we've received back from kitchens across India — the reason we still get up before dawn.</p>
            </div>
          </div>
        </div>
        <ReviewsReel />
      </section>

      {/* SUGGESTIONS */}
      <section className="pdp-suggest-section">
        <div className="section-inner">
          <div className="products-head">
            <div>
              <span className="sticker">You may also love</span>
              <h2 className="section-heading">More from <br /><span className="italic-olive">the shelf.</span></h2>
            </div>
          </div>
          <div className="products-scroll-wrap">
            <div className="products-scroller no-scrollbar" data-testid="pdp-suggestions">
              {suggestions.map((s) => <ProductCard key={s.id} product={s} />)}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
