import { useCart } from "@/context/CartContext";

export const Toast = () => {
  const { toast } = useCart();
  return (
    <div className={`toast${toast ? " show" : ""}`} data-testid="toast">{toast}</div>
  );
};
