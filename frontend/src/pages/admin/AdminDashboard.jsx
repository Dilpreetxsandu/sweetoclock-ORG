import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Candy, Loader2, LogOut, Package, Pencil, Plus, RefreshCw, Send, ShoppingBag, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { api, API, formatApiError, inr } from "@/api";

const STATUS_COLORS = {
  created: "bg-slate-100 text-slate-700",
  paid: "bg-green-100 text-green-800",
  packed: "bg-amber-100 text-amber-800",
  shipped: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800",
};
const STATUSES = ["paid", "packed", "shipped", "delivered"];
const emptyProduct = { name: "", tagline: "", price: "", unit: "500g", image: "", category: "Signature", badge: "", active: true };

function ProductForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form
      data-testid="product-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...form, price: parseFloat(form.price), badge: form.badge || null });
      }}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
    >
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Name</label>
        <input data-testid="product-name-input" required value={form.name} onChange={set("name")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Price (₹)</label>
          <input data-testid="product-price-input" required type="number" min="1" value={form.price} onChange={set("price")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Unit</label>
          <input data-testid="product-unit-input" value={form.unit} onChange={set("unit")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500" placeholder="500g box" />
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-semibold text-slate-500">Image URL</label>
        <input data-testid="product-image-input" value={form.image} onChange={set("image")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500" placeholder="https://…" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Category</label>
        <input data-testid="product-category-input" value={form.category} onChange={set("category")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500" placeholder="Signature" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Badge (optional)</label>
        <input data-testid="product-badge-input" value={form.badge || ""} onChange={set("badge")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500" placeholder="Best Seller" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-semibold text-slate-500">Tagline</label>
        <input data-testid="product-tagline-input" value={form.tagline} onChange={set("tagline")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500" />
      </div>
      <div className="flex gap-3 sm:col-span-2">
        <button data-testid="product-save-btn" disabled={saving} className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Product
        </button>
        <button type="button" data-testid="product-cancel-btn" onClick={onCancel} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | product
  const [saving, setSaving] = useState(false);
  const [busyOrder, setBusyOrder] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [o, p] = await Promise.all([api.get("/admin/orders"), api.get("/admin/products")]);
      setOrders(o.data);
      setProducts(p.data);
    } catch (err) {
      if (err?.response?.status === 401) navigate("/admin/login");
      else toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    api.get("/auth/me").then(() => load()).catch(() => navigate("/admin/login"));
  }, [load, navigate]);

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    navigate("/admin/login");
  };

  const updateStatus = async (orderId, status) => {
    try {
      const { data } = await api.patch(`/admin/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data : o)));
      toast.success(`Status → ${status}`);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const pushShiprocket = async (orderId) => {
    setBusyOrder(orderId);
    try {
      const { data } = await api.post(`/admin/orders/${orderId}/shiprocket`);
      toast.success(`Shipment created · AWB ${data.awb}${data.mock ? " (mock)" : ""}`);
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusyOrder("");
    }
  };

  const resendInvoice = async (orderId) => {
    setBusyOrder(orderId);
    try {
      const { data } = await api.post(`/admin/orders/${orderId}/resend-invoice`);
      toast.success(data.channel === "whatsapp" ? "Invoice sent via WhatsApp" : "Invoice regenerated (PDF fallback)");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusyOrder("");
    }
  };

  const saveProduct = async (payload) => {
    setSaving(true);
    try {
      if (editing === "new") await api.post("/admin/products", payload);
      else await api.put(`/admin/products/${editing.id}`, payload);
      toast.success("Product saved");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Product deleted");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const revenue = orders.filter((o) => o.status !== "created").reduce((s, o) => s + o.total, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100" data-testid="admin-dashboard">
      <header className="bg-slate-950 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Candy className="h-5 w-5 text-amber-500" />
            <span className="font-serif text-xl font-bold text-slate-50">SweetOClock Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button data-testid="admin-refresh-btn" onClick={load} className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button data-testid="admin-logout-btn" onClick={logout} className="flex items-center gap-1.5 rounded-full border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Orders</p>
            <p className="mt-1 text-2xl font-bold text-slate-900" data-testid="admin-stat-orders">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Revenue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900" data-testid="admin-stat-revenue">{inr(revenue)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Products</p>
            <p className="mt-1 text-2xl font-bold text-slate-900" data-testid="admin-stat-products">{products.length}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <button data-testid="admin-tab-orders" onClick={() => setTab("orders")} className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${tab === "orders" ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-200"}`}>
            <ShoppingBag className="h-4 w-4" /> Orders
          </button>
          <button data-testid="admin-tab-products" onClick={() => setTab("products")} className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${tab === "products" ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-200"}`}>
            <Package className="h-4 w-4" /> Products
          </button>
        </div>

        {tab === "orders" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white" data-testid="admin-orders-table">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Shipment</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No orders yet</td></tr>
                )}
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 align-top hover:bg-slate-50" data-testid={`admin-order-row-${o.order_number}`}>
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-slate-900">{o.order_number}</p>
                      <p className="text-xs text-slate-400">{o.created_at.slice(0, 10)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{o.customer.name}</p>
                      <p className="text-xs text-slate-500">{o.customer.phone}</p>
                      <p className="max-w-[200px] truncate text-xs text-slate-400">{o.customer.address}, {o.customer.city} - {o.customer.pincode}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{inr(o.total)}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-slate-500">{o.payment?.razorpay_payment_id || "—"}</p>
                      {o.payment?.mock && <span className="text-[10px] font-bold uppercase text-amber-600">mock</span>}
                    </td>
                    <td className="px-4 py-3">
                      {o.status === "created" ? (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS.created}`}>unpaid</span>
                      ) : (
                        <select
                          data-testid={`admin-status-select-${o.id}`}
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold outline-none ${STATUS_COLORS[o.status]}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {o.shipment?.awb ? (
                        <div>
                          <p className="font-mono text-xs font-semibold text-slate-700">{o.shipment.awb}</p>
                          <p className="text-xs text-slate-400">{o.shipment.courier}{o.shipment.mock ? " (mock)" : ""}</p>
                        </div>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        {!o.shipment?.awb && o.status !== "created" && (
                          <button data-testid={`admin-shiprocket-push-${o.id}`} disabled={busyOrder === o.id} onClick={() => pushShiprocket(o.id)} className="flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-60">
                            <Truck className="h-3 w-3" /> Shiprocket
                          </button>
                        )}
                        <button data-testid={`admin-invoice-resend-${o.id}`} disabled={busyOrder === o.id} onClick={() => resendInvoice(o.id)} className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60">
                          <Send className="h-3 w-3" /> Resend Invoice
                        </button>
                        <a data-testid={`admin-invoice-download-${o.id}`} href={`${API}/orders/${o.id}/invoice`} className="text-xs font-semibold text-amber-700 hover:underline">
                          Invoice PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "products" && (
          <div className="space-y-4" data-testid="admin-products-panel">
            {!editing && (
              <button data-testid="product-add-btn" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400">
                <Plus className="h-4 w-4" /> Add Product
              </button>
            )}
            {editing && (
              <ProductForm
                initial={editing === "new" ? emptyProduct : editing}
                onSave={saveProduct}
                onCancel={() => setEditing(null)}
                saving={saving}
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4" data-testid={`admin-product-card-${p.id}`}>
                  <img src={p.image} alt={p.name} className="mb-3 h-36 w-full rounded-xl object-cover" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif text-lg font-bold text-slate-900">{p.name}</p>
                      <p className="text-sm font-bold text-amber-700">₹{p.price} / {p.unit}</p>
                      {p.badge && <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{p.badge}</span>}
                    </div>
                    <div className="flex gap-1">
                      <button data-testid={`product-edit-${p.id}`} onClick={() => setEditing(p)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button data-testid={`product-delete-${p.id}`} onClick={() => deleteProduct(p.id)} className="rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
