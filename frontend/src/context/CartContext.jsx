import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("soc_cart") || "[]");
    } catch {
      return [];
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("soc_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product, weightGrams) => {
    setItems((prev) => {
      const key = `${product.id}-${weightGrams}`;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          product_id: product.id,
          name: product.name,
          image_url: product.image_url,
          price_per_kg: product.price_per_kg,
          weight_grams: weightGrams,
          qty: 1,
        },
      ];
    });
    setDrawerOpen(true);
  };

  const updateQty = (key, delta) => {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (key) => setItems((prev) => prev.filter((i) => i.key !== key));
  const clearCart = () => setItems([]);

  const { subtotal, count } = useMemo(() => {
    let sub = 0;
    let n = 0;
    for (const i of items) {
      sub += (i.price_per_kg * i.weight_grams * i.qty) / 1000;
      n += i.qty;
    }
    return { subtotal: sub, count: n };
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clearCart, subtotal, count, drawerOpen, setDrawerOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}
