import { useState } from "react";
import { toast } from "sonner";

const scrollToProducts = (e) => {
  e.preventDefault();
  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
};

/* ------------------------------- Ticker -------------------------------- */
export const Ticker = () => (
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
);

/* ------------------------------- Banner -------------------------------- */
export const BannerSection = () => (
  <section className="banner">
    <div className="banner__content">
      <div className="banner__eyebrow">Limited Drop</div>
      <h2 className="banner__title">Air Jordan 1 Retro</h2>
      <p className="banner__desc">The silhouette that started it all. Available in three colorways this season.</p>
      <a href="#products" className="btn btn--white" onClick={scrollToProducts} data-testid="banner-shop-btn">
        Shop the Drop <i className="fa-solid fa-arrow-right"></i>
      </a>
    </div>
    <div className="banner__visual">
      <div className="banner__ring banner__ring--1"></div>
      <div className="banner__ring banner__ring--2"></div>
      <img src="/shoes/s3.png" alt="Air Jordan" className="banner__shoe" />
    </div>
  </section>
);

/* ------------------------------- About --------------------------------- */
const FEATURES = [
  { icon: "fa-layer-group", title: "React Foam Core", desc: "Our proprietary foam returns 60% more energy with every stride — lighter, springier, longer lasting." },
  { icon: "fa-wind", title: "Breathable Mesh", desc: "360° airflow engineering keeps your foot cool through the longest sessions." },
  { icon: "fa-shield-halved", title: "Duragrip Outsole", desc: "Engineered rubber compound grips wet and dry surfaces with equal confidence." },
  { icon: "fa-leaf", title: "Sustainable Materials", desc: "At least 30% recycled content across our full collection. Zero compromise on performance." },
];

export const AboutSection = () => (
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
      {FEATURES.map((f) => (
        <div className="feature-card" key={f.title}>
          <div className="feature-card__icon"><i className={`fa-solid ${f.icon}`}></i></div>
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

/* ------------------------------ Reviews -------------------------------- */
const REVIEWS = [
  { initials: "RL", color: "#ff4757", name: "Ranidi L.", text: "I've owned Nikes my whole life and this is a different level. The sole cushioning on the Pegasus 41 makes my morning runs feel effortless.", product: "Pegasus 41 — Size 8" },
  { initials: "ST", color: "#0ea5e9", name: "Sayuru T.", text: "Ordered the Air Max Pulse after seeing the 3D view online. Arrived in 2 days, fit perfectly true to size. The colorway in person is even more vivid.", product: "Air Max Pulse — Size 10" },
  { initials: "JD", color: "#00c8a0", name: "John D.", text: "Returned 3 pairs from other brands this year. First SOLE pair and I'm done looking. The Metcon 9 is the best training shoe I've ever worn — period.", product: "Metcon 9 — Size 11.5" },
];

export const ReviewsSection = () => (
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
      {REVIEWS.map((r) => (
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
);

/* ------------------------------ Services ------------------------------- */
const SERVICES = [
  { icon: "fa-truck-fast", title: "Free Express Delivery", desc: "On all orders over $100. Most ship same day." },
  { icon: "fa-rotate-left", title: "30-Day Returns", desc: "No-hassle returns and exchanges, always free." },
  { icon: "fa-headset", title: "24/7 Support", desc: "Real people, real answers, around the clock." },
  { icon: "fa-shield-halved", title: "Authentic Guarantee", desc: "Every product is 100% authentic or your money back." },
];

export const ServicesSection = () => (
  <section className="services">
    {SERVICES.map((s) => (
      <div className="service-item" key={s.title}>
        <i className={`fa-solid ${s.icon}`}></i>
        <h3>{s.title}</h3>
        <p>{s.desc}</p>
      </div>
    ))}
  </section>
);

/* ------------------------------- Footer -------------------------------- */
export const FooterSection = () => {
  const [email, setEmail] = useState("");

  const subscribe = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Welcome to the SOLE newsletter!");
    setEmail("");
  };

  return (
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
  );
};
