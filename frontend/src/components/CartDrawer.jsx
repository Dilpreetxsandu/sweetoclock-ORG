import { useNavigate } from "react-router-dom";
import { X, Minus, Plus, Trash2, ShoppingBasket } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { inr } from "@/api";

export default function CartDrawer() {
  const { items, updateQty, removeItem, subtotal, drawerOpen, setDrawerOpen } = useCart();
  const navigate = useNavigate();

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" data-testid="cart-drawer">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#FAF6F0] shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Your Basket</h2>
          <button data-testid="cart-close-btn" onClick={() => setDrawerOpen(false)} className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-stone-400">
              <ShoppingBasket className="h-12 w-12" />
              <p className="text-sm">Your basket is empty. Mithai awaits!</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const line = (item.price_per_kg * item.weight_grams * item.qty) / 1000;
                return (
                  <li key={item.key} data-testid={`cart-item-${item.key}`} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-3">
                    <img src={item.image_url} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-serif text-lg font-bold leading-tight text-stone-800">{item.name}</p>
                          <p className="text-xs text-stone-500">{item.weight_grams}g pack</p>
                        </div>
                        <button data-testid={`cart-remove-${item.key}`} onClick={() => removeItem(item.key)} className="text-stone-400 transition-colors hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-stone-200 px-1 py-0.5">
                          <button data-testid={`cart-minus-${item.key}`} onClick={() => updateQty(item.key, -1)} className="rounded-full p-1 hover:bg-stone-100">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-semibold">{item.qty}</span>
                          <button data-testid={`cart-plus-${item.key}`} onClick={() => updateQty(item.key, 1)} className="rounded-full p-1 hover:bg-stone-100">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-amber-900">{inr(line)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-stone-200 bg-white px-6 py-5">
            <div className="mb-1 flex items-center justify-between text-sm text-stone-600">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal" className="font-bold text-stone-900">{inr(subtotal)}</span>
            </div>
            <p className="mb-4 text-xs text-emerald-700">Free delivery across India</p>
            <button
              data-testid="cart-checkout-btn"
              onClick={() => {
                setDrawerOpen(false);
                navigate("/checkout");
              }}
              className="w-full rounded-full bg-[#9A3412] py-3 text-sm font-bold text-[#FAF6F0] transition-colors hover:bg-[#7C2D12]"
            >
              Guest Checkout →
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
