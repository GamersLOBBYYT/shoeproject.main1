import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export const QuickViewModal = ({ product, initialColor, onClose }) => {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const [color, setColor] = useState(initialColor || product.colors[0]);
  const [qty, setQty] = useState(1);
  const wishlisted = has(product.id);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const glow = color.hex === "#ffffff" ? product.card_color : color.hex;

  const addToBag = () => {
    for (let i = 0; i < qty; i += 1) addItem(product, color);
    toast.success(`${product.name} (${color.name}) × ${qty} added to bag`);
    onClose();
  };

  return (
    <div className="quickview-overlay" onClick={onClose} data-testid="quickview-overlay">
      <div className="quickview" onClick={(e) => e.stopPropagation()} data-testid="quickview-modal">
        <button className="quickview__close" onClick={onClose} aria-label="Close quick view" data-testid="quickview-close">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="quickview__visual">
          <div className="quickview__glow" style={{ background: `radial-gradient(circle, ${glow}59 0%, transparent 70%)` }} />
          {product.badge && (
            <span className={`product-card__badge ${product.badge === "Hot" ? "product-card__badge--hot" : ""}`}>
              {product.badge}
            </span>
          )}
          <img
            src={product.image}
            alt={product.name}
            className="quickview__img"
            style={{ filter: color.filter === "none" ? undefined : color.filter }}
            data-testid="quickview-img"
          />
        </div>

        <div className="quickview__info">
          <div className="product-card__meta">
            <span className="product-card__brand">{product.brand} · {product.category}</span>
            <div className="product-card__stars">{"★".repeat(product.rating)}{"☆".repeat(5 - product.rating)}</div>
          </div>
          <h2 className="quickview__name">{product.name}</h2>
          <div className="quickview__price" data-testid="quickview-price">${product.price.toFixed(2)}</div>

          <div className="quickview__label">Color — <span>{color.name}</span></div>
          <div className="quickview__colors">
            {product.colors.map((c) => (
              <button
                key={c.name}
                className={`color-dot ${c.name === color.name ? "color-dot--active" : ""}`}
                style={{ "--c": c.hex }}
                onClick={() => setColor(c)}
                aria-label={c.name}
                data-testid={`quickview-color-${c.name.toLowerCase()}`}
              />
            ))}
          </div>

          <div className="quickview__label">Quantity</div>
          <div className="qty-stepper" data-testid="quickview-qty-stepper">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" data-testid="quickview-qty-minus">−</button>
            <span data-testid="quickview-qty">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Increase quantity" data-testid="quickview-qty-plus">+</button>
          </div>

          <div className="quickview__actions">
            <button className="btn btn--primary" onClick={addToBag} data-testid="quickview-add-btn">
              <i className="fa-solid fa-bag-shopping"></i> Add to Bag — ${(product.price * qty).toFixed(2)}
            </button>
            <button
              className={`btn btn--ghost quickview__wish ${wishlisted ? "quickview__wish--active" : ""}`}
              onClick={() => toggle(product.id)}
              aria-label="Toggle wishlist"
              data-testid="quickview-wishlist-btn"
            >
              <i className={`${wishlisted ? "fa-solid" : "fa-regular"} fa-heart`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
