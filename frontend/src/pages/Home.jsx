import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";

/* ----------------------------- Product Card ----------------------------- */
const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const [color, setColor] = useState(product.colors[0]);
  const [wishlisted, setWishlisted] = useState(false);

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
            onClick={() => setWishlisted(!wishlisted)}
            data-testid={`wishlist-btn-${product.id}`}
          >
            <i className={`${wishlisted ? "fa-solid" : "fa-regular"} fa-heart`}></i>
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
    </article>
  );
};

/* --------------------------------- Hero --------------------------------- */
const Hero = ({ featured }) => {
  const { addItem } = useCart();
  const colors = featured?.colors || [];
  const [color, setColor] = useState(null);
  const active = color || colors[0];

  const cycle = () => {
    if (!colors.length) return;
    const idx = colors.findIndex((c) => c.name === active.name);
    setColor(colors[(idx + 1) % colors.length]);
  };

  const glowColor = active && active.hex !== "#ffffff" ? active.hex : "#7c3aed";

  return (
    <section className="hero" id="home">
      <div className="hero__bg-text">SOLE</div>
      <div className="hero__content">
        <div className="hero__left">
          <div className="hero__eyebrow">New Season — 2026</div>
          <h1 className="hero__title">
            Move in a<br />
            <span className="hero__title--accent">different</span>
            <br />
            dimension
          </h1>
          <p className="hero__desc">
            Engineered for athletes who refuse to stay still. Our latest collection merges biomechanical
            precision with bold design.
          </p>
          <div className="hero__cta-row">
            <a
              href="#products"
              className="btn btn--primary"
              onClick={(e) => { e.preventDefault(); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}
              data-testid="hero-explore-btn"
            >
              Explore Collection
            </a>
            <a
              href="#about"
              className="btn btn--ghost"
              onClick={(e) => { e.preventDefault(); document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }); }}
              data-testid="hero-story-btn"
            >
              Our Story
            </a>
          </div>
          <div className="hero__stats">
            <div className="stat"><span className="stat__number">200+</span><span className="stat__label">Styles</span></div>
            <div className="stat__divider"></div>
            <div className="stat"><span className="stat__number">50k+</span><span className="stat__label">Customers</span></div>
            <div className="stat__divider"></div>
            <div className="stat"><span className="stat__number">4.9★</span><span className="stat__label">Rating</span></div>
          </div>
        </div>
        <div className="hero__right">
          <div className="hero__shoe-stage">
            <div className="hero__glow" style={{ background: `radial-gradient(circle, ${glowColor}59 0%, transparent 70%)` }} />
            {featured && (
              <div className="shoe-3d" onClick={cycle} title="Click to change color" data-testid="hero-shoe">
                <img
                  src={featured.image}
                  alt={featured.name}
                  className="shoe-3d__img"
                  style={{ filter: active?.filter === "none" ? undefined : active?.filter }}
                />
                <div className="shoe-3d__shadow" style={{ background: `radial-gradient(ellipse, ${glowColor}80 0%, transparent 70%)` }} />
              </div>
            )}
            <div className="hero__floating-badge hero__floating-badge--1">
              <span className="badge__icon"><i className="fa-solid fa-bolt"></i></span>
              <div>
                <div className="badge__title">Ultra Boost</div>
                <div className="badge__sub">React foam</div>
              </div>
            </div>
            <div className="hero__floating-badge hero__floating-badge--2">
              <span className="badge__icon"><i className="fa-solid fa-wind"></i></span>
              <div>
                <div className="badge__title">Air Flow</div>
                <div className="badge__sub">Mesh upper</div>
              </div>
            </div>
          </div>
          <div className="hero__color-picker" data-testid="hero-color-picker">
            {colors.map((c) => (
              <button
                key={c.name}
                className={`color-dot ${active?.name === c.name ? "color-dot--active" : ""}`}
                style={{ "--c": c.hex }}
                onClick={() => setColor(c)}
                aria-label={c.name}
                data-testid={`hero-color-${c.name.toLowerCase()}`}
              />
            ))}
          </div>
          {featured && (
            <button
              className="btn btn--ghost hero__add-btn"
              onClick={() => {
                addItem(featured, active);
                toast.success(`${featured.name} (${active.name}) added to bag`);
              }}
              data-testid="hero-add-to-cart-btn"
            >
              <i className="fa-solid fa-bag-shopping"></i> Add {featured.name} — ${featured.price.toFixed(2)}
            </button>
          )}
        </div>
      </div>
      <div className="hero__scroll-hint">
        <span>Scroll</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  );
};

/* --------------------------------- Page --------------------------------- */
export default function Home() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [email, setEmail] = useState("");
  const location = useLocation();

  useEffect(() => {
    api.get("/products").then(({ data }) => setProducts(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.hash && !location.hash.includes("session_id")) {
      const id = location.hash.slice(1);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 150);
    }
  }, [location.hash]);

  const featured = products.find((p) => p.id === "p1");
  const visible = filter === "all" ? products : products.filter((p) => p.category === filter);

  const subscribe = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Welcome to the SOLE newsletter!");
    setEmail("");
  };

  return (
    <div data-testid="home-page">
      <Hero featured={featured} />

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker__track">
          {[0, 1].map((k) => (
            <span key={k} style={{ display: "contents" }}>
              <span>Free Shipping on Orders Over $100</span><span className="ticker__sep">✦</span>
              <span>New Summer Drop — Shop Now</span><span className="ticker__sep">✦</span>
              <span>30-Day Returns, No Questions Asked</span><span className="ticker__sep">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* PRODUCTS */}
      <section className="products" id="products">
        <div className="section-header">
          <div className="section-eyebrow">Featured Products</div>
          <h2 className="section-title">Our top picks</h2>
          <div className="products__filters">
            {["all", "running", "casual", "training"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "filter-btn--active" : ""}`}
                onClick={() => setFilter(f)}
                data-testid={`filter-btn-${f}`}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="products__grid" data-testid="products-grid">
          {visible.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* BANNER */}
      <section className="banner">
        <div className="banner__content">
          <div className="banner__eyebrow">Limited Drop</div>
          <h2 className="banner__title">Air Jordan 1 Retro</h2>
          <p className="banner__desc">The silhouette that started it all. Available in three colorways this season.</p>
          <a
            href="#products"
            className="btn btn--white"
            onClick={(e) => { e.preventDefault(); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}
            data-testid="banner-shop-btn"
          >
            Shop the Drop <i className="fa-solid fa-arrow-right"></i>
          </a>
        </div>
        <div className="banner__visual">
          <div className="banner__ring banner__ring--1"></div>
          <div className="banner__ring banner__ring--2"></div>
          <img src="/shoes/s3.png" alt="Air Jordan" className="banner__shoe" />
        </div>
      </section>

      {/* ABOUT */}
      <section className="about" id="about">
        <div className="about__left">
          <div className="section-eyebrow">Why SOLE</div>
          <h2 className="section-title">Built different,<br />worn better</h2>
          <p className="about__desc">
            We obsess over every millimeter of cushion, every gram of material, every angle of a toe box.
            Because the shoe that fits perfectly doesn't just protect your foot — it changes how you move
            through the world.
          </p>
        </div>
        <div className="about__features">
          {[
            { icon: "fa-layer-group", title: "React Foam Core", desc: "Our proprietary foam returns 60% more energy with every stride — lighter, springier, longer lasting." },
            { icon: "fa-wind", title: "Breathable Mesh", desc: "360° airflow engineering keeps your foot cool through the longest sessions." },
            { icon: "fa-shield-halved", title: "Duragrip Outsole", desc: "Engineered rubber compound grips wet and dry surfaces with equal confidence." },
            { icon: "fa-leaf", title: "Sustainable Materials", desc: "At least 30% recycled content across our full collection. Zero compromise on performance." },
          ].map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-card__icon"><i className={`fa-solid ${f.icon}`}></i></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="reviews" id="reviews">
        <div className="section-header">
          <div className="section-eyebrow">Customer Reviews</div>
          <h2 className="section-title">What people are saying</h2>
          <div className="reviews__overall">
            <span className="reviews__score">4.9</span>
            <div>
              <div className="reviews__stars">★★★★★</div>
              <div className="reviews__count">Based on 12,400+ reviews</div>
            </div>
          </div>
        </div>
        <div className="reviews__grid">
          {[
            { initials: "RL", color: "#ff4757", name: "Ranidi L.", text: "I've owned Nikes my whole life and this is a different level. The sole cushioning on the Pegasus 41 makes my morning runs feel effortless.", product: "Pegasus 41 — Size 8" },
            { initials: "ST", color: "#0ea5e9", name: "Sayuru T.", text: "Ordered the Air Max Pulse after seeing the 3D view online. Arrived in 2 days, fit perfectly true to size. The colorway in person is even more vivid.", product: "Air Max Pulse — Size 10" },
            { initials: "JD", color: "#00c8a0", name: "John D.", text: "Returned 3 pairs from other brands this year. First SOLE pair and I'm done looking. The Metcon 9 is the best training shoe I've ever worn — period.", product: "Metcon 9 — Size 11.5" },
          ].map((r) => (
            <div className="review-card" key={r.initials}>
              <div className="review-card__header">
                <div className="review-card__avatar" style={{ "--av": r.color }}>{r.initials}</div>
                <div>
                  <strong>{r.name}</strong>
                  <div className="review-card__stars">★★★★★</div>
                </div>
                <span className="review-card__verified"><i className="fa-solid fa-circle-check"></i> Verified</span>
              </div>
              <p>"{r.text}"</p>
              <div className="review-card__product">{r.product}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="services">
        {[
          { icon: "fa-truck-fast", title: "Free Express Delivery", desc: "On all orders over $100. Most ship same day." },
          { icon: "fa-rotate-left", title: "30-Day Returns", desc: "No-hassle returns and exchanges, always free." },
          { icon: "fa-headset", title: "24/7 Support", desc: "Real people, real answers, around the clock." },
          { icon: "fa-shield-halved", title: "Authentic Guarantee", desc: "Every product is 100% authentic or your money back." },
        ].map((s) => (
          <div className="service-item" key={s.title}>
            <i className={`fa-solid ${s.icon}`}></i>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__logo">SOLE</div>
            <p>Premium footwear, delivered with precision.</p>
            <div className="footer__socials">
              <a href="#home" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
              <a href="#home" aria-label="Twitter"><i className="fa-brands fa-twitter"></i></a>
              <a href="#home" aria-label="TikTok"><i className="fa-brands fa-tiktok"></i></a>
              <a href="#home" aria-label="YouTube"><i className="fa-brands fa-youtube"></i></a>
            </div>
          </div>
          <div className="footer__col">
            <h4>Shop</h4>
            <a href="#products">New Arrivals</a><a href="#products">Running</a><a href="#products">Training</a><a href="#products">Casual</a><a href="#products">Sale</a>
          </div>
          <div className="footer__col">
            <h4>Help</h4>
            <a href="#home">FAQ</a><a href="#home">Shipping Info</a><a href="#home">Returns</a><a href="#home">Size Guide</a><a href="#home">Track Order</a>
          </div>
          <div className="footer__col">
            <h4>Stay in the loop</h4>
            <p style={{ fontSize: "0.85rem", marginBottom: 12 }}>New drops, exclusive offers — right to your inbox.</p>
            <div className="footer__newsletter">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && subscribe()}
                data-testid="newsletter-input"
              />
              <button onClick={subscribe} data-testid="newsletter-submit-btn">→</button>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 SOLE. All rights reserved.</span>
          <span>Privacy · Terms · Cookies</span>
        </div>
      </footer>
    </div>
  );
}
