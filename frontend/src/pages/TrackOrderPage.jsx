import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { TrackingMap } from "@/components/track/TrackingMap";
import { TrackTimeline } from "@/components/track/TrackTimeline";

const TRACKING_POLL_MS = 5000;

const TrackStatusLine = ({ tracking }) => {
  if (!tracking) return null;
  return (
    <div className="track-status-line" data-testid="track-current-status">
      <span className={`track-live-dot ${tracking.delivered ? "track-live-dot--done" : ""}`} />
      {tracking.status_label}
      {tracking.eta && !tracking.delivered && (
        <span className="track-eta">
          · ETA {new Date(tracking.eta).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
};

export default function TrackOrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");

  // Fetch the order once
  useEffect(() => {
    let cancelled = false;
    api
      .get(`/orders/${orderId}`)
      .then(({ data }) => {
        if (!cancelled) setOrder(data);
      })
      .catch((e) => {
        console.error("Order fetch failed:", e);
        if (!cancelled) setError("Order not found");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Poll live tracking
  useEffect(() => {
    let cancelled = false;
    const fetchTracking = async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}/tracking`);
        if (!cancelled) setTracking(data);
      } catch (e) {
        console.error("Tracking fetch failed:", e);
        if (!cancelled) setError("Order not found");
      }
    };
    fetchTracking();
    const timer = setInterval(fetchTracking, TRACKING_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="page track-page">
        <div className="empty-state" data-testid="track-error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <h2>{error}</h2>
          <button className="btn btn--primary" onClick={() => navigate("/orders")}>My Orders</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page track-page" data-testid="track-page">
      <div className="page-header">
        <div className="section-eyebrow">Live Tracking</div>
        <h1 className="section-title">Order #{orderId}</h1>
        <TrackStatusLine tracking={tracking} />
      </div>

      <div className="track-grid">
        <div className="panel track-timeline-panel">
          <h3 className="panel__title"><i className="fa-solid fa-route"></i> Delivery Progress</h3>
          <TrackTimeline tracking={tracking} order={order} />
        </div>

        <div className="panel track-map-panel">
          <h3 className="panel__title"><i className="fa-solid fa-map-location-dot"></i> Package Location</h3>
          <TrackingMap tracking={tracking} />
        </div>
      </div>
    </div>
  );
}
