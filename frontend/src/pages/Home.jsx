import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/ProductCard";
import {
  Ticker,
  BannerSection,
  AboutSection,
  ReviewsSection,
  ServicesSection,
  FooterSection,
} from "@/components/home/Sections";

const FILTERS = ["all", "running", "casual", "training"];

const scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

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
              onClick={(e) => { e.preventDefault(); scrollToSection("products"); }}
              data-testid="hero-explore-btn"
            >
              Explore Collection
            </a>
            <a
              href="#about"
              className="btn btn--ghost"
              onClick={(e) => { e.preventDefault(); scrollToSection("about"); }}
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

/* ------------------------------- Products ------------------------------- */
const ProductsSection = ({ products, filter, onFilter }) => {
  const visible = filter === "all" ? products : products.filter((p) => p.category === filter);
  return (
    <section className="products" id="products">
      <div className="section-header">
        <div className="section-eyebrow">Featured Products</div>
        <h2 className="section-title">Our top picks</h2>
        <div className="products__filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "filter-btn--active" : ""}`}
              onClick={() => onFilter(f)}
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
  );
};

/* --------------------------------- Page --------------------------------- */
export default function Home() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const location = useLocation();

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

  useEffect(() => {
    if (location.hash && !location.hash.includes("session_id")) {
      const id = location.hash.slice(1);
      setTimeout(() => scrollToSection(id), 150);
    }
  }, [location.hash]);

  const featured = products.find((p) => p.id === "p1");

  return (
    <div data-testid="home-page">
      <Hero featured={featured} />
      <Ticker />
      <ProductsSection products={products} filter={filter} onFilter={setFilter} />
      <BannerSection />
      <AboutSection />
      <ReviewsSection />
      <ServicesSection />
      <FooterSection />
    </div>
  );
}
