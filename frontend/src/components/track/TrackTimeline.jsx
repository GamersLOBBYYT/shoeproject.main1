const STAGE_ICONS = {
  ordered: "fa-receipt",
  packed: "fa-box",
  shipped: "fa-truck-fast",
  out_for_delivery: "fa-motorcycle",
  delivered: "fa-house-circle-check",
};

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "Pending";

export const TrackTimeline = ({ tracking, order }) => (
  <>
    <div className="timeline" data-testid="track-timeline">
      {tracking?.stages.map((s, idx) => {
        const isCurrent = s.key === tracking.status_key && !tracking.delivered;
        const stepCls = [
          "timeline-step",
          s.completed ? "timeline-step--done" : "",
          isCurrent ? "timeline-step--current" : "",
        ].join(" ");
        return (
          <div className={stepCls} key={s.key} data-testid={`timeline-step-${s.key}`}>
            <div className="timeline-step__icon">
              <i className={`fa-solid ${STAGE_ICONS[s.key]}`}></i>
            </div>
            <div className="timeline-step__body">
              <div className="timeline-step__label">{s.label}</div>
              <div className="timeline-step__time">{formatTime(s.time)}</div>
            </div>
            {idx < tracking.stages.length - 1 && <div className="timeline-step__line" />}
          </div>
        );
      })}
    </div>

    {order && (
      <div className="track-order-mini">
        <h4>Items</h4>
        {order.items.map((item) => (
          <div className="track-mini-item" key={`${item.product_id}-${item.color?.name || "default"}`}>
            <img
              src={item.image}
              alt={item.name}
              style={{ filter: item.color?.filter === "none" ? undefined : item.color?.filter }}
            />
            <span>{item.name} × {item.quantity}</span>
            <strong>${item.line_total.toFixed(2)}</strong>
          </div>
        ))}
        <div className="track-mini-dest">
          <i className="fa-solid fa-location-dot"></i> {order.shipping.address}, {order.shipping.city}
        </div>
      </div>
    )}
  </>
);
