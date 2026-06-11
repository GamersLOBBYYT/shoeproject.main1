import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export const CartDrawer = () => {
  const { items, updateQty, removeItem, subtotal, cartOpen, setCartOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!cartOpen) return null;

  const shippingFee = subtotal >= 100 || subtotal === 0 ? 0 : 8;

  const checkout = () => {
    setCartOpen(false);
    if (!user) {
      navigate("/auth?next=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <>
      <div className="cart-overlay" onClick={() => setCartOpen(false)} data-testid="cart-overlay" />
      <aside className="cart-drawer" data-testid="cart-drawer">
        <div className="cart-drawer__header">
          <h3>Your Bag <span className="cart-drawer__count">({items.length})</span></h3>
          <button className="nav__icon-btn" onClick={() => setCartOpen(false)} aria-label="Close cart" data-testid="cart-close-btn">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer__empty" data-testid="cart-empty-state">
            <i className="fa-solid fa-bag-shopping"></i>
            <p>Your bag is empty</p>
            <button className="btn btn--primary" onClick={() => setCartOpen(false)} data-testid="cart-continue-shopping-btn">
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map((item) => (
                <div className="cart-item" key={item.key} data-testid={`cart-item-${item.product_id}`}>
                  <div className="cart-item__visual">
                    <img src={item.image} alt={item.name} style={{ filter: item.color.filter === "none" ? undefined : item.color.filter }} />
                  </div>
                  <div className="cart-item__info">
                    <div className="cart-item__name">{item.name}</div>
                    <div className="cart-item__color">
                      <span className="color-dot color-dot--tiny" style={{ "--c": item.color.hex }} />
                      {item.color.name}
                    </div>
                    <div className="cart-item__price">${item.price.toFixed(2)}</div>
                  </div>
                  <div className="cart-item__qty">
                    <button onClick={() => updateQty(item.key, -1)} data-testid={`cart-qty-minus-${item.product_id}`}>−</button>
                    <span data-testid={`cart-qty-${item.product_id}`}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.key, 1)} data-testid={`cart-qty-plus-${item.product_id}`}>+</button>
                  </div>
                  <button className="cart-item__remove" onClick={() => removeItem(item.key)} aria-label="Remove" data-testid={`cart-remove-${item.product_id}`}>
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-drawer__footer">
              <div className="cart-drawer__row">
                <span>Subtotal</span>
                <span data-testid="cart-subtotal">${subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-drawer__row">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="cart-drawer__row cart-drawer__row--total">
                <span>Total</span>
                <span data-testid="cart-total">${(subtotal + shippingFee).toFixed(2)}</span>
              </div>
              <button className="btn btn--primary btn--block" onClick={checkout} data-testid="cart-checkout-btn">
                Checkout <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};
