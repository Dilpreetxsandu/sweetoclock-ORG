import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { IconBag, IconMenu } from "@/components/Icons";

const LINKS = [
  { label: "Sweets", hash: "products" },
  { label: "Offers", hash: "offers" },
  { label: "Story", hash: "story" },
  { label: "Reviews", hash: "reviews" },
];

export const Nav = () => {
  const { count, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (hash) => {
    setMobileOpen(false);
    if (location.pathname === "/") {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: hash } });
    }
  };

  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}`} data-testid="site-nav">
      <div className="header-inner">
        <button className="logo" onClick={() => navigate("/")} data-testid="nav-logo" style={{ background: "none", border: "none", padding: 0 }}>
          Sweet'O <span className="logo-italic">Clock</span>
        </button>

        <nav className="nav-links">
          {LINKS.map((l) => (
            <button key={l.hash} onClick={() => go(l.hash)} data-testid={`nav-${l.hash}`}>{l.label}</button>
          ))}
          <button onClick={() => navigate("/track")} data-testid="nav-track">Track</button>
        </nav>

        <div className="nav-actions">
          <button className="btn-pill btn-ink cart-btn" onClick={openCart} data-testid="open-cart-btn">
            <IconBag />
            <span className="cart-label">Cart</span>
            <span className="cart-count" data-testid="nav-cart-count">{count}</span>
          </button>
          <button className="mobile-menu-btn" aria-label="Toggle menu" onClick={() => setMobileOpen((o) => !o)} data-testid="mobile-menu-btn">
            <IconMenu />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu" data-testid="mobile-menu">
          {LINKS.map((l) => (
            <button key={l.hash} onClick={() => go(l.hash)}>{l.label}</button>
          ))}
          <button onClick={() => { setMobileOpen(false); navigate("/track"); }}>Track Order</button>
        </div>
      )}
    </header>
  );
};
