import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, inr } from "@/api";
import { useCart } from "@/context/CartContext";
import StoreHeader from "@/components/StoreHeader";
import CartDrawer from "@/components/CartDrawer";

const HERO_IMG =
  "https://customer-assets-jt897jd0.emergentagent.net/job_e1c4045f-6a53-4ec1-b9b8-89bcf62359ec/artifacts/govkzcai_WhatsApp%20Image%202026-07-17%20at%2019.23.17.jpeg";

const WEIGHTS = [250, 500, 1000, 2000];

const REVIEWS = [
  {
    text: "Tasted exactly like what my grandmother used to make. Absolutely authentic.",
    author: "Priya Sharma, Mumbai",
  },
  {
    text: "Sent a Diwali hamper — the packaging alone made everyone gasp.",
    author: "Rahul Mehta, Delhi",
  },
  {
    text: "Motichoor Ladoos are out of this world. Ordered twice this month.",
    author: "Ananya Patel, Ahmedabad",
  },
];

function ProductCard({ product }) {
  const { addItem } = useCart();
  const [weight, setWeight] = useState(1000);
  const price = (product.price_per_kg * weight) / 1000;

  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="flex flex-col border border-[#ddd] bg-white p-4 transition-shadow duration-300 hover:shadow-lg"
    >
      <img src={product.image_url} alt={product.name} className="h-52 w-full object-cover" />
      <h3 className="mt-3 text-lg font-bold text-stone-900">{product.name}</h3>
      <p className="text-sm text-stone-600">
        {inr(product.price_per_kg)} <span className="text-xs text-stone-400">/ kg</span>
      </p>
      {product.description && <p className="mt-1 line-clamp-2 text-xs text-stone-500">{product.description}</p>}
      <div className="mb-3 mt-3 flex flex-wrap gap-1.5">
        {WEIGHTS.map((w) => (
          <button
            key={w}
            data-testid={`weight-select-${w}-${product.id}`}
            onClick={() => setWeight(w)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              weight === w
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 text-stone-600 hover:border-stone-500"
            }`}
          >
            {w >= 1000 ? `${w / 1000}kg` : `${w}g`}
          </button>
        ))}
      </div>
      <button
        data-testid={`add-to-cart-btn-${product.id}`}
        onClick={() => {
          addItem(product, weight);
          toast.success(`${product.name} (${weight >= 1000 ? `${weight / 1000}kg` : `${weight}g`}) added to basket`);
        }}
        className="mt-auto w-full rounded-full bg-stone-900 py-2 text-xs font-bold text-white transition-colors hover:bg-stone-700"
      >
        Add to Basket · {inr(price)}
      </button>
    </div>
  );
}

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const { count } = useCart();

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => toast.error("Could not load products"));
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <StoreHeader />
      <CartDrawer />

      {/* Hero */}
      <div
        data-testid="hero-section"
        className="relative h-[300px] bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <h2 className="max-w-2xl text-2xl font-bold leading-snug sm:text-3xl">
            Every bite, a small ceremony of ghee &amp; memory.
          </h2>
          <p className="mt-3 text-sm sm:text-base">स्वाद बदलेगा नहीं, नज़रिया बदलेगा — हर समय.</p>
        </div>
      </div>

      {/* Products */}
      <section id="products" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="border-t border-[#eee] bg-[#fafafa] px-4 py-10 sm:px-6" data-testid="reviews-section">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-stone-900">Kind words</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {REVIEWS.map((r, i) => (
              <figure key={i} data-testid={`review-card-${i}`} className="border border-[#e5e5e5] bg-white p-5">
                <blockquote className="text-sm italic leading-relaxed text-stone-700">“{r.text}”</blockquote>
                <figcaption className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  — {r.author}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f8f8f8] px-4 py-5 text-center text-sm text-stone-600">
        <p>© 2026 Sweet'O Clock · Made in Nagpur</p>
        <p className="mt-1 text-xs text-stone-500" data-testid="footer-basket-status">
          {count === 0 ? "Your basket is empty." : `Your basket has ${count} item${count > 1 ? "s" : ""}.`}
        </p>
        <Link to="/admin/login" data-testid="footer-admin-link" className="mt-2 inline-block text-[11px] text-stone-400 transition-colors hover:text-stone-700">
          Admin Portal
        </Link>
      </footer>
    </div>
  );
}
