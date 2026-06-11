export const OrderSummary = ({ items, subtotal, shippingFee, total, busy, submitLabel }) => (
  <aside className="checkout-summary panel">
    <h3 className="panel__title">Order Summary</h3>
    <div className="summary-items">
      {items.map((item) => (
        <div className="summary-item" key={item.key} data-testid={`summary-item-${item.product_id}`}>
          <div className="summary-item__visual">
            <img src={item.image} alt={item.name} style={{ filter: item.color.filter === "none" ? undefined : item.color.filter }} />
            <span className="summary-item__qty">{item.quantity}</span>
          </div>
          <div className="summary-item__info">
            <div>{item.name}</div>
            <div className="summary-item__color">
              <span className="color-dot color-dot--tiny" style={{ "--c": item.color.hex }} /> {item.color.name}
            </div>
          </div>
          <div className="summary-item__price">${(item.price * item.quantity).toFixed(2)}</div>
        </div>
      ))}
    </div>
    <div className="cart-drawer__row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
    <div className="cart-drawer__row"><span>Shipping</span><span>{shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}</span></div>
    <div className="cart-drawer__row cart-drawer__row--total"><span>Total</span><span data-testid="checkout-total">${total.toFixed(2)}</span></div>
    <button type="submit" className="btn btn--primary btn--block" disabled={busy} data-testid="place-order-btn">
      {submitLabel}
    </button>
    <div className="checkout-secure"><i className="fa-solid fa-lock"></i> Payments are encrypted &amp; secure</div>
  </aside>
);
