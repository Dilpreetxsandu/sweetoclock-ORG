import { Link } from "react-router-dom";
import { Candy, ShoppingBasket, PackageSearch } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function StoreHeader() {
  const { count, setDrawerOpen } = useCart();
  return (
    <header className="sticky top-0 z-50 border-b border-amber-900/10 bg-[#FAF6F0]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" data-testid="nav-brand-link" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15">
            <Candy className="h-5 w-5 text-amber-700" />
          </span>
          <span className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Sweet<span className="text-[#9A3412]">OClock</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-5">
          <a href="/#products" data-testid="nav-mithai-link" className="hidden text-sm font-medium text-stone-600 transition-colors hover:text-[#9A3412] sm:block">
            Our Mithai
          </a>
          <Link to="/track" data-testid="nav-track-btn" className="flex items-center gap-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-[#9A3412]">
            <PackageSearch className="h-4 w-4" />
            <span className="hidden sm:inline">Track Order</span>
          </Link>
          <button
            data-testid="nav-cart-btn"
            onClick={() => setDrawerOpen(true)}
            className="relative flex items-center gap-2 rounded-full bg-[#9A3412] px-4 py-2 text-sm font-semibold text-[#FAF6F0] transition-colors hover:bg-[#7C2D12]"
          >
            <ShoppingBasket className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span data-testid="nav-cart-badge" className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-stone-900">
                {count}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
