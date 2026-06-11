import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useStripePolling } from "@/hooks/useStripePolling";

const FAIL_COPY = {
  expired: {
    title: "Payment session expired",
    body: "Your payment was not completed. You can try again from your bag.",
  },
  timeout: {
    title: "Still processing",
    body: "Payment is taking longer than expected. Check your orders in a moment.",
  },
  error: {
    title: "Something went wrong",
    body: "Your payment was not completed. You can try again from your bag.",
  },
};

const CheckingCard = () => (
  <div className="success-card" data-testid="payment-checking">
    <div className="spinner" />
    <h2>Verifying your payment…</h2>
    <p>Hang tight — confirming with Stripe.</p>
  </div>
);

const SuccessCard = ({ orderId, onTrack, onOrders }) => (
  <div className="success-card" data-testid="payment-success">
    <div className="success-check">
      <i className="fa-solid fa-check"></i>
    </div>
    <h2>Order Placed!</h2>
    <p>Your payment was successful. Your kicks are being prepped at our fulfillment center.</p>
    {orderId && <div className="success-order-id" data-testid="success-order-id">Order #{orderId}</div>}
    <div className="success-actions">
      {orderId && (
        <button className="btn btn--primary" onClick={onTrack} data-testid="success-track-btn">
          <i className="fa-solid fa-truck-fast"></i> Track Order Live
        </button>
      )}
      <button className="btn btn--ghost" onClick={onOrders} data-testid="success-orders-btn">
        My Orders
      </button>
    </div>
  </div>
);

const FailedCard = ({ state, onRetry, onOrders }) => {
  const copy = FAIL_COPY[state];
  return (
    <div className="success-card" data-testid="payment-failed">
      <div className="success-check success-check--fail">
        <i className="fa-solid fa-xmark"></i>
      </div>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      <div className="success-actions">
        <button className="btn btn--primary" onClick={onRetry} data-testid="failed-retry-btn">Try Again</button>
        <button className="btn btn--ghost" onClick={onOrders} data-testid="failed-orders-btn">My Orders</button>
      </div>
    </div>
  );
};

export default function SuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const sessionId = params.get("session_id");
  const mockOrderId = params.get("order_id");

  const { state, orderId } = useStripePolling(sessionId, clearCart);
  const finalOrderId = orderId || mockOrderId;

  const goOrders = () => navigate("/orders");

  return (
    <div className="page success-page" data-testid="order-success-page">
      {state === "checking" && <CheckingCard />}
      {state === "success" && (
        <SuccessCard orderId={finalOrderId} onTrack={() => navigate(`/track/${finalOrderId}`)} onOrders={goOrders} />
      )}
      {FAIL_COPY[state] && <FailedCard state={state} onRetry={() => navigate("/checkout")} onOrders={goOrders} />}
    </div>
  );
}
