# SOLE — Premium Footwear (Full-Stack E-Commerce)

## Original Problem Statement
User supplied a complete dark, 3D-style HTML/CSS/JS landing page ("SOLE — Premium Footwear") and asked to turn it into a working full-stack app:
- Keep the 3D look
- Order placement + live order location tracking
- Clicking the shoe / color dots changes the shoe color
- Placing an order goes to a payment method
- Login system

## User Choices
- Payment: Stripe checkout (test mode) AND mock/demo payment UI
- Auth: JWT email/password AND Emergent-managed Google social login
- Tracking: animated status timeline + live map with moving package (simulated)
- Color change: live CSS hue-shift recolor

## Architecture
- **Frontend**: React 19 (CRA + craco), react-router, axios (withCredentials), sonner toasts, Leaflet (CARTO dark tiles). Original user CSS preserved/extended in App.css. Local shoe PNGs in `/frontend/public/shoes/`.
- **Backend**: FastAPI single-file `server.py`. JWT (PyJWT + bcrypt, httpOnly cookies, secure/samesite=none) + Google sessions (`user_sessions` collection). Stripe via `emergentintegrations` (key `sk_test_emergent` in backend/.env). CORS via `allow_origin_regex` (page origin can differ from REACT_APP_BACKEND_URL domain).
- **DB (MongoDB)**: `users`, `user_sessions`, `login_attempts`, `products` (seeded, 6 shoes × 5 colorways with CSS filter strings), `orders`, `payment_transactions`.
- **Tracking simulation**: time-based from `paid_at` — Ordered(0s) → Packed(60s) → Shipped(150s) → Out for delivery(320s) → Delivered(450s); package position interpolated along NYC→Boston route waypoints; frontend polls every 5s.

## Implemented (June 11, 2026)
- Landing page replica: hero (3D floating shoe, click-to-recolor, color dots, glow follows color), ticker, product grid + category filters, banner, about, reviews, services, footer + newsletter toast
- Cart: drawer with qty/remove/totals, localStorage persistence, free shipping ≥ $100
- Auth: register/login/logout/me/refresh (JWT cookies), brute-force lockout (5 fails → 15 min, X-Forwarded-For aware), Google OAuth (session_id exchange + session cookie), seeded admin + test user
- Checkout: shipping form, Stripe checkout redirect (server-side prices, payment_transactions, status polling, webhook) and Demo Payment (instant paid)
- Order success page (poll/verify), Orders list page, Live tracking page (animated timeline + Leaflet map with warehouse/package/destination markers, moving truck marker, ETA)
- Testing: 18/19 backend pytest + full frontend E2E passed (iteration_1); lockout + toast-overlap fixes applied and verified
- Code quality refactor (June 11, 2026): extracted TrackingMap/TrackTimeline, checkout sub-components (ShippingForm/PaymentMethods/OrderSummary), home Sections, useStripePolling hook; memoized Auth/Cart context values (useMemo/useCallback); fixed hook deps, index keys, nested ternaries, empty catches; 19/19 backend tests pass post-refactor

## Credentials
See `/app/memory/test_credentials.md` (admin@sole.com / Admin@123, john@sole.com / Password123)

## Known Notes
- Recolor uses relative hue-rotate, so rendered color ≈ (not exactly) the dot hex; "Frost" is a desaturated/bright variant
- Tracking is SIMULATED (fixed NYC→Boston route, ~7.5 min to delivered) — no real carrier integration
- Demo Payment is a MOCK (clearly labeled, no real charge)

## Backlog
- P1: Wishlist persistence (currently local toggle only), product detail/quick-view modal, order email confirmations (Resend/SendGrid)
- P2: Admin dashboard (manage products/orders), real shipping address geocoding for the map, search, password reset flow
- P2: Split server.py into modules if it grows further

## Next Tasks
- Gather user feedback on tracking speed (extend/shorten simulation timings)
- Optional: real colorway product images instead of hue-shift
