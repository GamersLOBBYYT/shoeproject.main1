import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export const Nav = () => {
  const { user, logout } = useAuth();
  const { count, setCartOpen } = useCart();
  const { count: wishCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goSection = (id) => {
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`} data-testid="main-nav">
      <div className="nav__logo" onClick={() => navigate("/")} data-testid="nav-logo">
        SOLE
      </div>
      <ul className="nav__links">
        <li><a href="#home" onClick={(e) => { e.preventDefault(); goSection("home"); }} data-testid="nav-link-home">Home</a></li>
        <li><a href="#products" onClick={(e) => { e.preventDefault(); goSection("products"); }} data-testid="nav-link-shop">Shop</a></li>
        <li><a href="#about" onClick={(e) => { e.preventDefault(); goSection("about"); }} data-testid="nav-link-about">About</a></li>
        <li><a href="#reviews" onClick={(e) => { e.preventDefault(); goSection("reviews"); }} data-testid="nav-link-reviews">Reviews</a></li>
      </ul>
      <div className="nav__actions">
        <button
          className="nav__icon-btn"
          aria-label="Wishlist"
          onClick={() => navigate("/wishlist")}
          data-testid="nav-wishlist-btn"
        >
          <i className={`${wishCount > 0 ? "fa-solid" : "fa-regular"} fa-heart`}></i>
          {wishCount > 0 && <span className="cart-count" data-testid="wishlist-count">{wishCount}</span>}
        </button>
        {user && (
          <button
            className="nav__icon-btn"
            aria-label="My Orders"
            onClick={() => navigate("/orders")}
            data-testid="nav-orders-btn"
          >
            <i className="fa-solid fa-box"></i>
          </button>
        )}
        <button
          className="nav__icon-btn cart-btn"
          aria-label="Cart"
          onClick={() => setCartOpen(true)}
          data-testid="nav-cart-btn"
        >
          <i className="fa-solid fa-bag-shopping"></i>
          {count > 0 && <span className="cart-count" data-testid="cart-count">{count}</span>}
        </button>
        {user ? (
          <div className="nav__user" data-testid="nav-user-chip">
            <button className="nav__user-btn" onClick={() => setMenuOpen((v) => !v)} data-testid="nav-user-menu-btn">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="nav__avatar-img" />
              ) : (
                <span className="nav__avatar">{(user.name || user.email)[0]?.toUpperCase()}</span>
              )}
            </button>
            {menuOpen && (
              <div className="nav__dropdown" data-testid="nav-user-dropdown">
                <div className="nav__dropdown-name">{user.name || user.email}</div>
                <button onClick={() => { setMenuOpen(false); navigate("/orders"); }} data-testid="dropdown-orders-btn">
                  <i className="fa-solid fa-box"></i> My Orders
                </button>
                <button onClick={() => { setMenuOpen(false); logout(); navigate("/"); }} data-testid="dropdown-logout-btn">
                  <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn--primary btn--nav" onClick={() => navigate("/auth")} data-testid="nav-signin-btn">
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};
