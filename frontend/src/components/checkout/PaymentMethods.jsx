const METHODS = [
  {
    id: "stripe",
    icon: "fa-brands fa-stripe-s",
    name: "Card via Stripe",
    sub: "Secure checkout — Visa, Mastercard, Amex",
  },
  {
    id: "demo",
    icon: "fa-solid fa-bolt",
    name: "Demo Payment",
    sub: "Instant test payment — no real charge",
  },
];

export const PaymentMethods = ({ method, onMethodChange, card, onCardChange }) => (
  <div className="panel">
    <h3 className="panel__title"><i className="fa-solid fa-credit-card"></i> Payment Method</h3>
    <div className="pay-methods">
      {METHODS.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`pay-method ${method === m.id ? "pay-method--active" : ""}`}
          onClick={() => onMethodChange(m.id)}
          data-testid={`pay-method-${m.id}`}
        >
          <i className={m.icon}></i>
          <div>
            <div className="pay-method__name">{m.name}</div>
            <div className="pay-method__sub">{m.sub}</div>
          </div>
          <span className="pay-method__radio" />
        </button>
      ))}
    </div>

    {method === "demo" && (
      <div className="demo-card" data-testid="demo-card-form">
        <div className="form-group">
          <label>Card Number</label>
          <input value={card.number} onChange={(e) => onCardChange("number", e.target.value)} data-testid="demo-card-number-input" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Expiry</label>
            <input value={card.expiry} onChange={(e) => onCardChange("expiry", e.target.value)} data-testid="demo-card-expiry-input" />
          </div>
          <div className="form-group">
            <label>CVV</label>
            <input value={card.cvv} onChange={(e) => onCardChange("cvv", e.target.value)} data-testid="demo-card-cvv-input" />
          </div>
        </div>
      </div>
    )}
  </div>
);
