import "@/styles/sweet.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { Toast } from "@/components/Toast";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import Payment from "@/pages/Payment";
import TrackOrder from "@/pages/TrackOrder";
import OrderSuccess from "@/pages/OrderSuccess";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";

function Shell() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <>
      {!isAdmin && <Nav />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/order-success/:orderId" element={<OrderSuccess />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      {!isAdmin && (
        <>
          <Footer />
          <CartDrawer />
          <Toast />
        </>
      )}
      <Toaster position="top-center" richColors />
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
