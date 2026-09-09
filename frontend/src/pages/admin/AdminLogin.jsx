import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Candy, Loader2, Lock } from "lucide-react";
import { api, formatApiError } from "@/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/login", { email, password });
      navigate("/admin");
    } catch (err) {
      setError(formatApiError(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8" data-testid="admin-login-card">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15">
            <Candy className="h-5 w-5 text-amber-500" />
          </span>
          <span className="font-serif text-2xl font-bold text-slate-50">
            Sweet<span className="text-amber-500">OClock</span>
          </span>
        </div>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
          <Lock className="h-4 w-4 text-slate-400" /> Admin Login
        </h1>
        <form onSubmit={submit} className="mt-6 space-y-4" data-testid="admin-login-form">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Email</label>
            <input data-testid="admin-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500" placeholder="admin@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Password</label>
            <input data-testid="admin-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500" placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-red-400" data-testid="admin-login-error">{error}</p>}
          <button data-testid="admin-login-submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
        </form>
        <Link to="/" data-testid="admin-back-store-link" className="mt-5 block text-center text-xs text-slate-500 hover:text-amber-500">
          ← Back to store
        </Link>
      </div>
    </div>
  );
}
