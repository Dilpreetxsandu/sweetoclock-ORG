import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/api";

const CART_KEY = "soc_cart_v1";
const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const EMPTY_ADDRESS = {
  firstName: "", lastName: "", phone: "", address: "", landmark: "",
  city: "", state: "", pincode: "",
};

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const showToast = useCallback((msg) => setToast(msg), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const addToCart = useCallback((product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [
        ...prev,
        { id: product.id, slug: product.slug, name: product.name, price: product.price, unit: product.unit, image: product.image, quantity: qty },
      ];
    });
  }, []);

  const setQty = useCallback((id, qty) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, qty) } : i)).filter((i) => i.quantity > 0));
  }, []);

  const removeFromCart = useCallback((id) => setCart((prev) => prev.filter((i) => i.id !== id)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const delivery = subtotal >= 799 || subtotal === 0 ? 0 : 79;
  const total = subtotal + delivery;

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const value = {
    cart, count, subtotal, delivery, total,
    addToCart, setQty, removeFromCart, clearCart,
    cartOpen, openCart, closeCart,
    toast, showToast,
    address, setAddress,
    products,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
