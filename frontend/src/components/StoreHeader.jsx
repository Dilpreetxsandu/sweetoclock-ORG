import { Link } from "react-router-dom";
import { ShoppingBasket, PackageSearch } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function StoreHeader() {
  const { count, setDrawerOpen } = useCart();
  return (
    <header className="relative border-b border-[#e5e5e5] bg-[#f8f8f8] px-4 py-6 text-center">
      <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-6 sm:top-5">
        <Link
          to="/track"
          data-testid="nav-track-btn"
          className="flex items-center gap-1 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-500"
        >
          <PackageSearch className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Track Order</span>
        </Link>
        <button
          data-testid="nav-cart-btn"
          onClick={() => setDrawerOpen(true)}
          className="relative flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-stone-700"
        >
          <ShoppingBasket className="h-3.5 w-3.5" /> Cart
          {count > 0 && (
            <span data-testid="nav-cart-badge" className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </div>
      <Link to="/" data-testid="nav-brand-link" className="inline-block">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Sweet'O Clock</h1>
      </Link>
      <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">Est. 1987 · Nagpur</p>
      <p className="text-xs uppercase tracking-[0.25em] text-stone-400">No.001 — Winter Edit</p>
    </header>
  );
}
