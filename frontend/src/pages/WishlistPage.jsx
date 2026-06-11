import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useWishlist } from "@/context/WishlistContext";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api
      .get("/products")
      .then(({ data }) => {
        if (!cancelled) setProducts(data);
      })
      .catch((e) => console.error("Products fetch failed:", e));
    return () => {
      cancelled = true;
    };
  }, []);

  const items = (products || []).filter((p) => ids.includes(p.id));

  return (
    <div className="page wishlist-page" data-testid="wishlist-page">
      <div className="page-header">
        <div className="section-eyebrow">Saved for later</div>
        <h1 className="section-title">My Wishlist</h1>
      </div>

      {products === null && <div className="spinner spinner--center" />}

      {products !== null && items.length === 0 && (
        <div className="empty-state" data-testid="wishlist-empty">
          <i className="fa-regular fa-heart"></i>
          <h2>No saved shoes yet</h2>
          <p>Tap the heart on any product to keep it here.</p>
          <button className="btn btn--primary" onClick={() => navigate("/#products")} data-testid="wishlist-shop-btn">
            Browse Shoes
          </button>
        </div>
      )}

      <div className="products__grid" data-testid="wishlist-grid">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
