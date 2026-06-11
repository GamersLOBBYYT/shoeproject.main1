import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function SuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const sessionId = params.get("session_id");
  const mockOrderId = params.get("order_id");

  const [state, setState] = useState(sessionId ? "checking" : "success");
  const [orderId, setOrderId] = useState(mockOrderId);
  const started = useRef(false);

  useEffect(() => {
    if (!sessionId || started.current) return;
    started.current = true;
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setState("timeout");
        return;
      }
      attempts += 1;
      try {
        const { data } = await api.get(`/checkout/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setOrderId(data.order_id);
          clearCart();
          setState("success");
          return;
        }
        if (data.status === "expired") {
          setState("expired");
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        setState("error");
      }
    };
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="page success-page" data-testid="order-success-page">
      {state === "checking" && (
        <div className="success-card" data-testid="payment-checking">
          <div className="spinner" />
          <h2>Verifying your payment…</h2>
          <p>Hang tight — confirming with Stripe.</p>
        </div>
      )}

      {state === "success" && (
        <div className="success-card" data-testid="payment-success">
          <div className="success-check">
            <i className="fa-solid fa-check"></i>
          </div>
          <h2>Order Placed!</h2>
          <p>Your payment was successful. Your kicks are being prepped at our fulfillment center.</p>
          {orderId && <div className="success-order-id" data-testid="success-order-id">Order #{orderId}</div>}
          <div className="success-actions">
            {orderId && (
              <button className="btn btn--primary" onClick={() => navigate(`/track/${orderId}`)} data-testid="success-track-btn">
                <i className="fa-solid fa-truck-fast"></i> Track Order Live
              </button>
            )}
            <button className="btn btn--ghost" onClick={() => navigate("/orders")} data-testid="success-orders-btn">
              My Orders
            </button>
          </div>
        </div>
      )}

      {(state === "expired" || state === "error" || state === "timeout") && (
        <div className="success-card" data-testid="payment-failed">
          <div className="success-check success-check--fail">
            <i className="fa-solid fa-xmark"></i>
          </div>
          <h2>{state === "expired" ? "Payment session expired" : state === "timeout" ? "Still processing" : "Something went wrong"}</h2>
          <p>
            {state === "timeout"
              ? "Payment is taking longer than expected. Check your orders in a moment."
              : "Your payment was not completed. You can try again from your bag."}
          </p>
          <div className="success-actions">
            <button className="btn btn--primary" onClick={() => navigate("/checkout")} data-testid="failed-retry-btn">Try Again</button>
            <button className="btn btn--ghost" onClick={() => navigate("/orders")} data-testid="failed-orders-btn">My Orders</button>
          </div>
        </div>
      )}
    </div>
  );
}
