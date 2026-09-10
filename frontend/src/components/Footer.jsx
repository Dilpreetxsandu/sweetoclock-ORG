import { useNavigate, useLocation } from "react-router-dom";
import { IconArrowUpRight } from "@/components/Icons";

export const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const year = new Date().getFullYear();

  const go = (hash) => {
    if (location.pathname === "/") {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: hash } });
    }
  };

  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="section-inner">
        <div className="footer-cta">
          <span className="sticker">Order fresh</span>
          <h2 className="footer-cta-heading">
            Craving something <br />
            <span className="italic-olive">sweet?</span>
          </h2>
          <p className="footer-cta-copy">
            Mithai delivered to your doorstep, made this morning, packed with a
            handwritten note. Wherever you are in India.
          </p>
          <div className="footer-cta-actions">
            <a
              href="https://wa.me/919999999999?text=Hi!%20I%27d%20like%20to%20order%20from%20Sweet%27O%20Clock"
              target="_blank" rel="noreferrer"
              className="btn-pill btn-ink"
              data-testid="footer-whatsapp"
            >
              Order on WhatsApp
              <IconArrowUpRight />
            </a>
            <button className="btn-pill btn-outline" onClick={() => go("products")}>Browse menu</button>
          </div>
        </div>

        <div className="footer-cols">
          <div className="footer-brand">
            <div className="footer-logo">Sweet'O <span className="logo-italic">Clock</span></div>
            <p className="footer-tagline">Since 1987, from Nana Ji's kitchen to yours. Nagpur, India.</p>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Shop</div>
            <ul className="footer-links">
              <li><button className="underline-hover" onClick={() => go("products")}>Sweets</button></li>
              <li><button className="underline-hover" onClick={() => go("offers")}>Offers</button></li>
              <li><button className="underline-hover" onClick={() => go("products")}>Gift hampers</button></li>
            </ul>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">House</div>
            <ul className="footer-links">
              <li><button className="underline-hover" onClick={() => go("story")}>Our story</button></li>
              <li><button className="underline-hover" onClick={() => go("reviews")}>Reviews</button></li>
              <li><button className="underline-hover" onClick={() => navigate("/track")} data-testid="footer-track">Track order</button></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} Sweet'O Clock · Made in Nagpur</span>
          <span>
            Handcrafted · Traditional · Pure ·{" "}
            <button className="underline-hover" style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer", textTransform: "inherit", letterSpacing: "inherit" }} onClick={() => navigate("/admin/login")} data-testid="footer-admin-link">
              Admin
            </button>
          </span>
        </div>
      </div>
    </footer>
  );
};
