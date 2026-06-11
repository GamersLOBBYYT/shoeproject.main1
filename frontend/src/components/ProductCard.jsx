import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { QuickViewModal } from "@/components/QuickViewModal";

export const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const [color, setColor] = useState(product.colors[0]);
  const [quickView, setQuickView] = useState(false);
  const wishlisted = has(product.id);

  const cycleColor = () => {
    const idx = product.colors.findIndex((c) => c.name === color.name);
    setColor(product.colors[(idx + 1) % product.colors.length]);
  };

  return (
    <article
      className={`product-card ${product.featured ? "product-card--featured" : ""}`}
      data-testid={`product-card-${product.id}`}
    >
      <div className="product-card__visual">
        <div className="product-card__bg" style={{ "--card-color": color.hex === "#ffffff" ? product.card_color : color.hex }} />
        <img
          src={product.image}
          alt={product.name}
          className="product-card__img"
          style={{ filter: color.filter === "none" ? undefined : color.filter }}
          onClick={cycleColor}
          data-testid={`product-img-${product.id}`}
        />
        <div className="product-card__actions">
          <button
            className={`card-action ${wishlisted ? "card-action--active" : ""}`}
            aria-label="Wishlist"
            onClick={() => toggle(product.id)}
            data-testid={`wishlist-btn-${product.id}`}
          >
            <i className={`${wishlisted ? "fa-solid" : "fa-regular"} fa-heart`}></i>
          </button>
          <button
            className="card-action"
            aria-label="Quick view"
            onClick={() => setQuickView(true)}
            data-testid={`quick-view-btn-${product.id}`}
          >
            <i className="fa-regular fa-eye"></i>
          </button>
        </div>
        {product.badge && (
          <span className={`product-card__badge ${product.badge === "Hot" ? "product-card__badge--hot" : ""}`}>
            {product.badge}
          </span>
        )}
      </div>
      <div className="product-card__info">
        <div className="product-card__meta">
          <span className="product-card__brand">{product.brand}</span>
          <div className="product-card__stars">{"★".repeat(product.rating)}{"☆".repeat(5 - product.rating)}</div>
        </div>
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__colors">
          {product.colors.map((c) => (
            <button
              key={c.name}
              className={`color-dot color-dot--small ${c.name === color.name ? "color-dot--active" : ""}`}
              style={{ "--c": c.hex }}
              onClick={() => setColor(c)}
              aria-label={c.name}
              data-testid={`color-dot-${product.id}-${c.name.toLowerCase()}`}
            />
          ))}
        </div>
        <div className="product-card__footer">
          <span className="product-card__price">${product.price.toFixed(2)}</span>
          <button
            className="btn-add"
            onClick={() => {
              addItem(product, color);
              toast.success(`${product.name} (${color.name}) added to bag`);
            }}
            data-testid={`add-to-cart-${product.id}`}
            aria-label="Add to cart"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
      {quickView && <QuickViewModal product={product} initialColor={color} onClose={() => setQuickView(false)} />}
    </article>
  );
};
