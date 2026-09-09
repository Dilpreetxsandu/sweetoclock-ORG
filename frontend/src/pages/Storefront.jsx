import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Leaf, Sparkles, Truck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api";
import { useCart } from "@/context/CartContext";
import StoreHeader from "@/components/StoreHeader";
import CartDrawer from "@/components/CartDrawer";

const WEIGHTS = [250, 500, 1000, 2000];
const HERO_IMG =
  "https://images.unsplash.com/photo-1635952346904-95f2ccfcd029?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBmb29kJTIwZGVzc2VydHxlbnwwfHx8fDE3ODg5NTI1MTN8MA&ixlib=rb-4.1.0&q=85";

function ProductCard({ product, index }) {
  const { addItem } = useCart();
  const [weight, setWeight] = useState(1000);
  const price = (product.price_per_kg * weight) / 1000;

  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="fade-up relative flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl"
      style={{ animationDelay: `${index * 0.12}s` }}
    >
      <div>
        <div className="relative mb-5 overflow-hidden rounded-xl">
          <img src={product.image_url} alt={product.name} className="h-56 w-full object-cover transition-transform duration-500 hover:scale-105" />
          {product.tag && (
            <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-stone-900">
              {product.tag}
            </span>
          )}
        </div>
        <h3 className="font-serif text-2xl font-bold text-stone-800">{product.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{product.description}</p>
        <p className="mt-3 text-xl font-bold text-amber-900">
          ₹{product.price_per_kg} <span className="text-sm font-medium text-stone-500">/ kg</span>
        </p>
      </div>
      <div className="mt-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {WEIGHTS.map((w) => (
            <button
              key={w}
              data-testid={`weight-select-${w}-${product.id}`}
              onClick={() => setWeight(w)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                weight === w
                  ? "border-[#9A3412] bg-[#9A3412] text-[#FAF6F0]"
                  : "border-stone-300 text-stone-600 hover:border-amber-500"
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
          className="w-full rounded-full bg-[#9A3412] py-2.5 text-sm font-bold text-[#FAF6F0] transition-colors hover:bg-[#7C2D12]"
        >
          Add to Basket · ₹{price.toFixed(0)}
        </button>
      </div>
    </div>
  );
}

export default function Storefront() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => toast.error("Could not load products"));
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF6F0]">
      <StoreHeader />
      <CartDrawer />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="fade-up">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-100/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-900">
            <Sparkles className="h-3.5 w-3.5" /> Handcrafted in small batches
          </span>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Laddoo &amp; Khajur Fudge, <span className="italic text-[#9A3412]">made the slow way.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-stone-600">
            Pure desi ghee, roasted nuts and sun-dried dates — from our Nagpur kitchen to your doorstep. Priced honestly, per kilo.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#products" data-testid="hero-shop-btn" className="rounded-full bg-[#9A3412] px-7 py-3 text-sm font-bold text-[#FAF6F0] transition-colors hover:bg-[#7C2D12]">
              Shop Mithai
            </a>
            <Link to="/track" data-testid="hero-track-btn" className="rounded-full border border-stone-300 px-7 py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-amber-600 hover:text-[#9A3412]">
              Track Order
            </Link>
          </div>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
            <Leaf className="h-4 w-4" /> 100% Pure Desi Ghee · No shortcuts
          </div>
        </div>
        <div className="fade-up fade-up-delay-1 relative">
          <div className="absolute -inset-6 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <img src={HERO_IMG} alt="Fresh laddoos" className="h-[420px] w-full object-cover" />
          </div>
          <div className="absolute -bottom-5 left-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 shadow-lg sm:-left-8">
            <p className="flex items-center gap-2 text-sm font-bold text-stone-800">
              <Flame className="h-4 w-4 text-amber-600" /> Fresh batch every morning
            </p>
            <p className="text-xs text-stone-500">Shipped pan-India from Nagpur</p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-10">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Our Mithai</h2>
          <p className="mt-2 text-sm text-stone-500">Two recipes. Perfected over years. Sold by the kilo.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-amber-900/10 bg-white/60">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-14 sm:grid-cols-3 sm:px-6">
          {[
            { icon: Flame, title: "Slow Roasted", text: "Gram flour roasted on low flame for hours, never rushed." },
            { icon: Leaf, title: "Honest Ingredients", text: "Desi ghee, real dates, premium nuts. Nothing artificial." },
            { icon: Truck, title: "Tracked Delivery", text: "Every order shipped with live tracking via Shiprocket." },
          ].map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <f.icon className="h-5 w-5 text-amber-800" />
              </span>
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-800">{f.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-amber-900/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-stone-500 sm:flex-row sm:px-6">
          <p className="font-serif text-lg font-bold text-stone-800">
            Sweet<span className="text-[#9A3412]">OClock</span>
          </p>
          <p>Made with ghee &amp; love in Nagpur · 440001</p>
          <Link to="/admin/login" data-testid="footer-admin-link" className="text-xs text-stone-400 transition-colors hover:text-[#9A3412]">
            Admin Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
