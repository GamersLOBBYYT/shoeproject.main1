import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({ name: "", phone: "", address: "", city: "", zip_code: "" });
  const [method, setMethod] = useState("stripe");
  const [card, setCard] = useState({ number: "4242 4242 4242 4242", expiry: "12/28", cvv: "123" });
  const [busy, setBusy] = useState(false);

  const shippingFee = subtotal >= 100 ? 0 : 8;
  const total = subtotal + shippingFee;

  const payloadItems = items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, color: i.color }));

  const placeOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setBusy(true);
    try {
      if (method === "stripe") {
        const { data } = await api.post("/checkout/session", {
          items: payloadItems,
          shipping,
          origin_url: window.location.origin,
        });
        window.location.href = data.url;
      } else {
        const { data } = await api.post("/orders", {
          items: payloadItems,
          shipping,
          card_last4: card.number.replace(/\s/g, "").slice(-4),
        });
        clearCart();
        navigate(`/order-success?order_id=${data.order_id}`);
      }
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to place order");
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page checkout-page" data-testid="checkout-empty">
        <div className="empty-state">
          <i className="fa-solid fa-bag-shopping"></i>
          <h2>Your bag is empty</h2>
          <p>Add some shoes before checking out.</p>
          <button className="btn btn--primary" onClick={() => navigate("/")} data-testid="checkout-back-shop-btn">
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page checkout-page" data-testid="checkout-page">
      <div className="page-header">
        <div className="section-eyebrow">Checkout</div>
        <h1 className="section-title">Complete your order</h1>
      </div>

      <form className="checkout-grid" onSubmit={placeOrder}>
        <div className="checkout-main">
          <div className="panel">
            <h3 className="panel__title"><i className="fa-solid fa-location-dot"></i> Shipping Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input required value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} placeholder="John Doe" data-testid="shipping-name-input" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input required value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} placeholder="+1 555 000 1234" data-testid="shipping-phone-input" />
              </div>
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input required value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} placeholder="100 Main Street, Apt 4B" data-testid="shipping-address-input" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input required value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} placeholder="Boston" data-testid="shipping-city-input" />
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input value={shipping.zip_code} onChange={(e) => setShipping({ ...shipping, zip_code: e.target.value })} placeholder="02108" data-testid="shipping-zip-input" />
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 className="panel__title"><i className="fa-solid fa-credit-card"></i> Payment Method</h3>
            <div className="pay-methods">
              <button
                type="button"
                className={`pay-method ${method === "stripe" ? "pay-method--active" : ""}`}
                onClick={() => setMethod("stripe")}
                data-testid="pay-method-stripe"
              >
                <i className="fa-brands fa-stripe-s"></i>
                <div>
                  <div className="pay-method__name">Card via Stripe</div>
                  <div className="pay-method__sub">Secure checkout — Visa, Mastercard, Amex</div>
                </div>
                <span className="pay-method__radio" />
              </button>
              <button
                type="button"
                className={`pay-method ${method === "demo" ? "pay-method--active" : ""}`}
                onClick={() => setMethod("demo")}
                data-testid="pay-method-demo"
              >
                <i className="fa-solid fa-bolt"></i>
                <div>
                  <div className="pay-method__name">Demo Payment</div>
                  <div className="pay-method__sub">Instant test payment — no real charge</div>
                </div>
                <span className="pay-method__radio" />
              </button>
            </div>

            {method === "demo" && (
              <div className="demo-card" data-testid="demo-card-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} data-testid="demo-card-number-input" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry</label>
                    <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} data-testid="demo-card-expiry-input" />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} data-testid="demo-card-cvv-input" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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
            {busy ? "Processing…" : method === "stripe" ? `Pay $${total.toFixed(2)} with Stripe` : `Pay $${total.toFixed(2)} Now`}
          </button>
          <div className="checkout-secure"><i className="fa-solid fa-lock"></i> Payments are encrypted &amp; secure</div>
        </aside>
      </form>
    </div>
  );
}
