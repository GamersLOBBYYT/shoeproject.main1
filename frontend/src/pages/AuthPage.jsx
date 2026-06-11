import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res =
      mode === "login"
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
    setBusy(false);
    if (res.ok) {
      navigate(next);
    } else {
      setError(res.error);
    }
  };

  let submitLabel = mode === "login" ? "Sign In" : "Create Account";
  if (busy) submitLabel = "Please wait…";

  return (
    <div className="page auth-page" data-testid="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">SOLE</div>
        <h1 className="auth-card__title">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-card__sub">
          {mode === "login" ? "Sign in to place orders and track deliveries" : "Join 50k+ customers moving in a different dimension"}
        </p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "auth-tab--active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
            data-testid="auth-tab-login"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "auth-tab--active" : ""}`}
            onClick={() => { setMode("register"); setError(""); }}
            data-testid="auth-tab-register"
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                data-testid="auth-name-input"
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              data-testid="auth-email-input"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              data-testid="auth-password-input"
            />
          </div>

          {error && <div className="auth-error" data-testid="auth-error">{error}</div>}

          <button type="submit" className="btn btn--primary btn--block" disabled={busy} data-testid="auth-submit-btn">
            {submitLabel}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button className="btn btn--google btn--block" onClick={googleLogin} data-testid="auth-google-btn">
          <i className="fa-brands fa-google"></i> Continue with Google
        </button>

        <button className="auth-back" onClick={() => navigate("/")} data-testid="auth-back-btn">
          <i className="fa-solid fa-arrow-left"></i> Back to store
        </button>
      </div>
    </div>
  );
}
