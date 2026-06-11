import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { ShippingForm } from "@/components/checkout/ShippingForm";
import { PaymentMethods } from "@/components/checkout/PaymentMethods";
import { OrderSummary } from "@/components/checkout/OrderSummary";

function getSubmitLabel(busy, method, total) {
  if (busy) return "Processing…";
  const amount = `$${total.toFixed(2)}`;
  return method === "stripe" ? `Pay ${amount} with Stripe` : `Pay ${amount} Now`;
}

const EmptyCheckout = ({ onBack }) => (
  <div className="page checkout-page" data-testid="checkout-empty">
    <div className="empty-state">
      <i className="fa-solid fa-bag-shopping"></i>
      <h2>Your bag is empty</h2>
      <p>Add some shoes before checking out.</p>
      <button className="btn btn--primary" onClick={onBack} data-testid="checkout-back-shop-btn">
        Back to Shop
      </button>
    </div>
  </div>
);

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({ name: "", phone: "", address: "", city: "", zip_code: "" });
  const [method, setMethod] = useState("stripe");
  const [card, setCard] = useState({ number: "4242 4242 4242 4242", expiry: "12/28", cvv: "123" });
  const [busy, setBusy] = useState(false);

  const shippingFee = subtotal >= 100 ? 0 : 8;
  const total = subtotal + shippingFee;

  const setShippingField = (field, value) => setShipping((prev) => ({ ...prev, [field]: value }));
  const setCardField = (field, value) => setCard((prev) => ({ ...prev, [field]: value }));

  const payWithStripe = async (payloadItems) => {
    const { data } = await api.post("/checkout/session", {
      items: payloadItems,
      shipping,
      origin_url: window.location.origin,
    });
    window.location.href = data.url;
  };

  const payWithDemo = async (payloadItems) => {
    const { data } = await api.post("/orders", {
      items: payloadItems,
      shipping,
      card_last4: card.number.replace(/\s/g, "").slice(-4),
    });
    clearCart();
    navigate(`/order-success?order_id=${data.order_id}`);
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setBusy(true);
    const payloadItems = items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, color: i.color }));
    try {
      if (method === "stripe") {
        await payWithStripe(payloadItems);
      } else {
        await payWithDemo(payloadItems);
      }
    } catch (err) {
      console.error("Order placement failed:", err);
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to place order");
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return <EmptyCheckout onBack={() => navigate("/")} />;
  }

  return (
    <div className="page checkout-page" data-testid="checkout-page">
      <div className="page-header">
        <div className="section-eyebrow">Checkout</div>
        <h1 className="section-title">Complete your order</h1>
      </div>

      <form className="checkout-grid" onSubmit={placeOrder}>
        <div className="checkout-main">
          <ShippingForm shipping={shipping} onChange={setShippingField} />
          <PaymentMethods method={method} onMethodChange={setMethod} card={card} onCardChange={setCardField} />
        </div>
        <OrderSummary
          items={items}
          subtotal={subtotal}
          shippingFee={shippingFee}
          total={total}
          busy={busy}
          submitLabel={getSubmitLabel(busy, method, total)}
        />
      </form>
    </div>
  );
}
