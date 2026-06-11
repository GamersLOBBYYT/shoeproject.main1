import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const STATUS_LABELS = {
  paid: { label: "Paid", cls: "status-pill--paid" },
  pending_payment: { label: "Awaiting Payment", cls: "status-pill--pending" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/orders").then(({ data }) => setOrders(data)).catch(() => setOrders([]));
  }, []);

  return (
    <div className="page orders-page" data-testid="orders-page">
      <div className="page-header">
        <div className="section-eyebrow">Your Purchases</div>
        <h1 className="section-title">My Orders</h1>
      </div>

      {orders === null && <div className="spinner spinner--center" />}

      {orders && orders.length === 0 && (
        <div className="empty-state" data-testid="orders-empty">
          <i className="fa-solid fa-box-open"></i>
          <h2>No orders yet</h2>
          <p>When you place an order, it will show up here.</p>
          <button className="btn btn--primary" onClick={() => navigate("/")} data-testid="orders-shop-btn">Start Shopping</button>
        </div>
      )}

      <div className="orders-list">
        {orders?.map((order) => {
          const st = STATUS_LABELS[order.status] || { label: order.status, cls: "" };
          return (
            <div className="order-card" key={order.order_id} data-testid={`order-card-${order.order_id}`}>
              <div className="order-card__top">
                <div>
                  <div className="order-card__id" data-testid={`order-id-${order.order_id}`}>#{order.order_id}</div>
                  <div className="order-card__date">
                    {new Date(order.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <span className={`status-pill ${st.cls}`} data-testid={`order-status-${order.order_id}`}>{st.label}</span>
              </div>
              <div className="order-card__items">
                {order.items.map((item, idx) => (
                  <div className="order-card__thumb" key={idx} title={`${item.name} × ${item.quantity}`}>
                    <img src={item.image} alt={item.name} style={{ filter: item.color?.filter === "none" ? undefined : item.color?.filter }} />
                    <span>×{item.quantity}</span>
                  </div>
                ))}
                <div className="order-card__names">
                  {order.items.map((i) => i.name).join(", ")}
                </div>
              </div>
              <div className="order-card__bottom">
                <div className="order-card__total">Total <strong>${order.total.toFixed(2)}</strong></div>
                {order.status === "paid" ? (
                  <button className="btn btn--primary btn--sm" onClick={() => navigate(`/track/${order.order_id}`)} data-testid={`track-btn-${order.order_id}`}>
                    <i className="fa-solid fa-location-dot"></i> Track Order
                  </button>
                ) : (
                  <span className="order-card__note">Payment not completed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
