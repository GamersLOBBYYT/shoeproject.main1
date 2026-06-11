import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Nav } from "@/components/Nav";
import { CartDrawer } from "@/components/CartDrawer";
import Home from "@/pages/Home";
import AuthPage from "@/pages/AuthPage";
import CheckoutPage from "@/pages/CheckoutPage";
import SuccessPage from "@/pages/SuccessPage";
import OrdersPage from "@/pages/OrdersPage";
import WishlistPage from "@/pages/WishlistPage";
import TrackOrderPage from "@/pages/TrackOrderPage";

const TOAST_OPTIONS = {
  style: {
    background: "#1e1e32",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f0f0f5",
    fontFamily: "'Space Grotesk', sans-serif",
  },
};

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const AuthCallback = () => {
  const { processGoogleSession } = useAuth();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const sessionId = new URLSearchParams(window.location.hash.replace("#", "")).get("session_id");
    (async () => {
      try {
        await processGoogleSession(sessionId);
      } catch (e) {
        console.error("Google session exchange failed:", e);
      }
      window.history.replaceState(null, "", window.location.pathname);
      navigate("/", { replace: true });
    })();
  }, [navigate, processGoogleSession]);

  return (
    <div className="page auth-page">
      <div className="success-card">
        <div className="spinner" />
        <h2>Signing you in…</h2>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading || user === null) {
    return (
      <div className="page auth-page">
        <div className="spinner spinner--center" />
      </div>
    );
  }
  if (user === false) {
    return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return children;
};

function AppRouter() {
  const location = useLocation();
  // Check URL fragment (not query params) for session_id — must run synchronously during render
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <>
      <Nav />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/order-success" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/track/:orderId" element={<ProtectedRoute><TrackOrderPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <AppRouter />
            <Toaster position="top-center" duration={2500} theme="dark" toastOptions={TOAST_OPTIONS} />
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
