import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import L from "leaflet";
import { api } from "@/lib/api";

const STAGE_ICONS = {
  ordered: "fa-receipt",
  packed: "fa-box",
  shipped: "fa-truck-fast",
  out_for_delivery: "fa-motorcycle",
  delivered: "fa-house-circle-check",
};

export default function TrackOrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");

  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const packageMarker = useRef(null);
  const traveledLine = useRef(null);

  useEffect(() => {
    api.get(`/orders/${orderId}`).then(({ data }) => setOrder(data)).catch(() => setError("Order not found"));
  }, [orderId]);

  useEffect(() => {
    let timer;
    const fetchTracking = async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}/tracking`);
        setTracking(data);
      } catch {
        setError("Order not found");
      }
    };
    fetchTracking();
    timer = setInterval(fetchTracking, 5000);
    return () => clearInterval(timer);
  }, [orderId]);

  // Init map once tracking arrives
  useEffect(() => {
    if (!tracking || !mapRef.current || mapObj.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);

    const route = tracking.route;
    L.polyline(route, { color: "rgba(255,255,255,0.25)", weight: 3, dashArray: "6 8" }).addTo(map);
    traveledLine.current = L.polyline([route[0]], { color: "#ff4757", weight: 4 }).addTo(map);

    const mkIcon = (html, cls) => L.divIcon({ html, className: cls, iconSize: [34, 34], iconAnchor: [17, 17] });
    L.marker(route[0], { icon: mkIcon('<i class="fa-solid fa-warehouse"></i>', "map-pin map-pin--warehouse") }).addTo(map);
    L.marker(route[route.length - 1], { icon: mkIcon('<i class="fa-solid fa-house"></i>', "map-pin map-pin--home") }).addTo(map);
    packageMarker.current = L.marker(tracking.position, {
      icon: mkIcon('<i class="fa-solid fa-truck-fast"></i>', "map-pin map-pin--package"),
      zIndexOffset: 1000,
    }).addTo(map);

    map.fitBounds(L.latLngBounds(route), { padding: [50, 50] });
    mapObj.current = map;
  }, [tracking]);

  // Update marker + traveled path on each poll
  useEffect(() => {
    if (!tracking || !mapObj.current) return;
    packageMarker.current?.setLatLng(tracking.position);
    if (traveledLine.current) {
      const route = tracking.route;
      const segs = route.length - 1;
      const pos = tracking.progress * segs;
      const idx = Math.min(Math.floor(pos), segs - 1);
      const pts = route.slice(0, idx + 1).concat([tracking.position]);
      traveledLine.current.setLatLngs(tracking.progress <= 0 ? [route[0]] : pts);
    }
  }, [tracking]);

  useEffect(() => () => { mapObj.current?.remove(); mapObj.current = null; }, []);

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
        {tracking && (
          <div className="track-status-line" data-testid="track-current-status">
            <span className={`track-live-dot ${tracking.delivered ? "track-live-dot--done" : ""}`} />
            {tracking.status_label}
            {tracking.eta && !tracking.delivered && (
              <span className="track-eta">
                · ETA {new Date(tracking.eta).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="track-grid">
        <div className="panel track-timeline-panel">
          <h3 className="panel__title"><i className="fa-solid fa-route"></i> Delivery Progress</h3>
          <div className="timeline" data-testid="track-timeline">
            {tracking?.stages.map((s, idx) => {
              const isCurrent = s.key === tracking.status_key && !tracking.delivered;
              return (
                <div
                  className={`timeline-step ${s.completed ? "timeline-step--done" : ""} ${isCurrent ? "timeline-step--current" : ""}`}
                  key={s.key}
                  data-testid={`timeline-step-${s.key}`}
                >
                  <div className="timeline-step__icon">
                    <i className={`fa-solid ${STAGE_ICONS[s.key]}`}></i>
                  </div>
                  <div className="timeline-step__body">
                    <div className="timeline-step__label">{s.label}</div>
                    <div className="timeline-step__time">
                      {s.time
                        ? new Date(s.time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                        : "Pending"}
                    </div>
                  </div>
                  {idx < tracking.stages.length - 1 && <div className="timeline-step__line" />}
                </div>
              );
            })}
          </div>

          {order && (
            <div className="track-order-mini">
              <h4>Items</h4>
              {order.items.map((item, idx) => (
                <div className="track-mini-item" key={idx}>
                  <img src={item.image} alt={item.name} style={{ filter: item.color?.filter === "none" ? undefined : item.color?.filter }} />
                  <span>{item.name} × {item.quantity}</span>
                  <strong>${item.line_total.toFixed(2)}</strong>
                </div>
              ))}
              <div className="track-mini-dest">
                <i className="fa-solid fa-location-dot"></i> {order.shipping.address}, {order.shipping.city}
              </div>
            </div>
          )}
        </div>

        <div className="panel track-map-panel">
          <h3 className="panel__title"><i className="fa-solid fa-map-location-dot"></i> Package Location</h3>
          <div className="map-box" ref={mapRef} data-testid="track-map" />
          <div className="map-legend">
            <span><span className="map-legend__dot" style={{ background: "#7c3aed" }} /> Warehouse</span>
            <span><span className="map-legend__dot" style={{ background: "#ff4757" }} /> Your Package</span>
            <span><span className="map-legend__dot" style={{ background: "#00c8a0" }} /> Destination</span>
          </div>
        </div>
      </div>
    </div>
  );
}
