import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { OFFERS, CHAPTERS, MARQUEE_WORDS, getCategories } from "@/data/shop";
import { ProductCard } from "@/components/ProductCard";
import { ReviewsReel } from "@/components/ReviewsReel";
import {
  IconArrowUpRight, IconArrowRight, IconChevronLeft, IconChevronRight,
} from "@/components/Icons";

const HERO_IMG = "https://customer-assets-jt897jd0.emergentagent.net/job_e1c4045f-6a53-4ec1-b9b8-89bcf62359ec/artifacts/govkzcai_WhatsApp%20Image%202026-07-17%20at%2019.23.17.jpeg";

export default function Home() {
  const location = useLocation();
  const { products } = useCart();
  const [offerIndex, setOfferIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");
  const heroImgRef = useRef(null);
  const heroSecRef = useRef(null);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (location.state?.scrollTo) {
      const id = location.state.scrollTo;
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [location.state]);

  useEffect(() => {
    const update = () => {
      const sec = heroSecRef.current, img = heroImgRef.current;
      if (!sec || !img) return;
      const rect = sec.getBoundingClientRect();
      let progress = -rect.top / sec.offsetHeight;
      progress = Math.min(Math.max(progress, 0), 1);
      img.style.transform = `translateY(${progress * 200}px) scale(${1 + progress * 0.12})`;
    };
    update();
    window.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const offer = OFFERS[offerIndex];
  const list = activeFilter === "All" ? products : products.filter((p) => p.category === activeFilter);
  const marqueeRow = [...MARQUEE_WORDS, ...MARQUEE_WORDS];

  return (
    <main>
      {/* HERO */}
      <section id="top" className="hero-section" ref={heroSecRef}>
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-kicker-bar">
          <div className="hero-kicker-inner">
            <span className="sticker"><span className="dot" /> Est. 1987 · Nagpur</span>
            <span className="edition-tag">No.001 — Winter Edit</span>
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-grid">
            <div className="hero-text">
              <h1 className="hero-headline">
                <span className="line-mask"><span className="line-inner">Every bite,</span></span>
                <span className="line-mask"><span className="line-inner italic-olive">a small ceremony</span></span>
                <span className="line-mask"><span className="line-inner">of ghee &amp; memory.</span></span>
              </h1>
              <p className="hero-sub">
                <span className="hero-sub-hindi">स्वाद बदलेगा नहीं, नज़रिया बदलेगा — हर समय.</span>
                Handcrafted mithai, hand-rolled each dawn from a family recipe three generations deep — from Nana Ji's kitchen to yours.
              </p>
              <div className="hero-cta-row">
                <button className="btn-pill btn-ink" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })} data-testid="hero-explore-btn">
                  Explore the sweets <IconArrowUpRight />
                </button>
                <button className="btn-pill btn-outline" onClick={() => document.getElementById("story")?.scrollIntoView({ behavior: "smooth" })}>Our story</button>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-image-frame">
                <img ref={heroImgRef} className="hero-image" src={HERO_IMG} alt="Sweet'O Clock — handcrafted mithai on marble" draggable="false" />
                <div className="hero-image-shade" />
              </div>
              <div className="hero-badge hero-badge-left">
                <div className="hero-badge-label">Made</div>
                <div className="hero-badge-text">this morning.</div>
              </div>
              <div className="hero-badge hero-badge-right">
                <span className="edition-tag">4.9★ · 12k+ boxes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stats-inner">
            <div className="stat"><span className="stat-num">36+</span><span className="stat-label">Varieties</span></div>
            <div className="stat"><span className="stat-num">4.9★</span><span className="stat-label">Google reviews</span></div>
            <div className="stat"><span className="stat-num">12,400+</span><span className="stat-label">Boxes delivered</span></div>
            <div className="stat"><span className="stat-num">₹0</span><span className="stat-label">Delivery over ₹799</span></div>
            <span className="scroll-hint">scroll ↓</span>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="marquee-section">
        <div className="editorial-marquee marquee-track">
          {marqueeRow.map((w, i) => (
            <span className="marquee-word" key={i}>{w} <span className="glyph">❦</span></span>
          ))}
        </div>
      </section>

      {/* OFFERS */}
      <section id="offers" className="offers-section">
        <div className="section-inner">
          <div className="offers-head">
            <div>
              <span className="sticker">Today's edit</span>
              <h2 className="section-heading">Sweet <span className="italic-olive">deals</span>, <br /> gently curated.</h2>
            </div>
            <div className="offers-nav">
              <button className="qty-btn qty-btn-lg" aria-label="Previous offer" onClick={() => setOfferIndex((i) => (i - 1 + OFFERS.length) % OFFERS.length)}><IconChevronLeft /></button>
              <button className="qty-btn qty-btn-lg" aria-label="Next offer" onClick={() => setOfferIndex((i) => (i + 1) % OFFERS.length)}><IconChevronRight /></button>
            </div>
          </div>

          <div className="offer-panel">
            <div className="offer-grid" key={offer.id} data-testid={`offer-${offer.id}`}>
              <div className="offer-image-wrap">
                <img src={offer.img} alt={offer.title} />
                <div className="offer-kicker-sticker sticker">{offer.kicker}</div>
              </div>
              <div className="offer-content">
                <div>
                  <span className="offer-index">0{offerIndex + 1} / 0{OFFERS.length}</span>
                  <h3 className="offer-title">{offer.title}<span className="price-line">{offer.priceLine}</span></h3>
                  <p className="offer-body">{offer.body}</p>
                </div>
                <div className="offer-bottom-row">
                  <button className="btn-pill btn-ink" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>
                    {offer.cta} <IconArrowRight />
                  </button>
                  <div className="offer-dots">
                    {OFFERS.map((_, idx) => (
                      <button key={idx} className={`offer-dot${idx === offerIndex ? " active" : ""}`} aria-label={`Go to offer ${idx + 1}`} onClick={() => setOfferIndex(idx)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="products-section">
        <div className="section-inner">
          <div className="products-head">
            <div>
              <span className="sticker">The full menu</span>
              <h2 className="section-heading">Fresh <span className="italic-olive">mithai</span>, <br /> made every morning.</h2>
            </div>
            <div className="filter-row">
              {getCategories(products).map((cat) => (
                <button key={cat} className={`filter-btn${cat === activeFilter ? " active" : ""}`} onClick={() => setActiveFilter(cat)} data-testid={`filter-${cat}`}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="products-scroll-wrap">
            <div className="products-scroller no-scrollbar" ref={scrollerRef}>
              {list.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="products-footer-row">
              <span className="edition-tag">swipe / scroll →</span>
              <div className="offers-nav">
                <button className="qty-btn qty-btn-lg" aria-label="Scroll left" onClick={() => scrollerRef.current?.scrollBy({ left: -380, behavior: "smooth" })}>‹</button>
                <button className="qty-btn qty-btn-lg" aria-label="Scroll right" onClick={() => scrollerRef.current?.scrollBy({ left: 380, behavior: "smooth" })}>›</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section id="story" className="manifesto-section">
        <div className="section-inner">
          <div className="manifesto-head">
            <div><span className="sticker">The manifesto</span></div>
            <div>
              <h2 className="manifesto-heading">Three generations. <br /><span className="italic-olive">One promise —</span><br /> nothing changes.</h2>
            </div>
          </div>
          <div className="chapters-grid">
            {CHAPTERS.map((c) => (
              <article className="chapter" key={c.n} data-testid={`chapter-${c.n}`}>
                <div className="chapter-num">{c.n}</div>
                <div>
                  <h3 className="chapter-title">{c.title}</h3>
                  <p className="chapter-body">{c.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="testimonials-section">
        <div className="section-inner testimonials-head">
          <div className="testimonials-head-grid">
            <div>
              <span className="sticker">Kind words</span>
              <h2 className="section-heading">Made with love, <br /> <span className="italic-olive">felt in every bite.</span></h2>
            </div>
            <div className="testimonials-copy-col">
              <p className="testimonials-copy">Six-thousand-and-counting hand-packed boxes have made their way to kitchens across India. A few of the notes we've received back.</p>
            </div>
          </div>
        </div>
        <ReviewsReel />
      </section>
    </main>
  );
}
