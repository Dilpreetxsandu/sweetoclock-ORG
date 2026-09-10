# SweetOClock — PRD

## Original Problem Statement
Online sweets ordering web app: storefront (Laddoo ₹599/kg, Khajur Fudge ₹899/kg), guest checkout (no login), Razorpay prepaid payments verified server-side, invoice generation with WhatsApp delivery (PDF fallback until Twilio sender +17372508034 is approved), Shiprocket shipping/tracking (pickup 440001 Nagpur), and a secure admin panel (product CRUD, order management paid→packed→shipped→delivered, Shiprocket push, invoice resend). All secrets server-side env only. User choices: placeholder env credentials (fully wired code, real keys dropped in later), PDF invoice fallback as default, design to be shared later (fresh mithai storefront built in the meantime, componentized for easy reskin).

## Architecture
- Frontend: React (JSX) + Tailwind + shadcn/ui, react-router, axios (withCredentials), sonner toasts. Pages: Storefront, Checkout, OrderSuccess, TrackOrder, admin/AdminLogin, admin/AdminDashboard. Cart in localStorage via CartContext.
- Backend: FastAPI (`/app/backend/server.py`), all routes under /api. Motor/MongoDB. JWT admin auth (httpOnly cookie + Bearer fallback), bcrypt. Razorpay SDK (order create + signature verify), Twilio WhatsApp (auto PDF fallback), Shiprocket (token cache 239h, adhoc order + AWB + tracking). fpdf2 invoice PDFs stored in /app/backend/invoices/.
- Mock mode: when env keys contain CHANGE_ME, Razorpay/Twilio/Shiprocket run mocked (mock signature "mock_signature", MOCK AWBs, pdf_fallback channel) so the full flow works without real keys.

## User Personas
- Guest customer: browses, buys by weight (250g/500g/1kg/2kg), pays, tracks via Order ID + phone.
- Admin (sandhuxe@gmail.com): manages products and orders, pushes shipments, resends invoices.

## Core Requirements (static)
- Per-kg pricing, no stock display, free delivery, prepaid only, single admin role, single pickup (440001), orders identified by phone + order ID.

## Implemented (2026-09-10, v2 — GitHub design port)
- Storefront replaced with user's own GitHub design (github.com/Dilpreetxsandu/sweetoclock1), applied as-is: editorial pastel theme (matcha/cream/butter, Fraunces/Manrope/Instrument Serif), fixed nav + mobile menu, hero parallax with line-rise animation + stats bar, marquee, offers carousel, horizontal product scroller with category filters, manifesto chapters, two-row auto-scrolling "Kind words" reviews reel, footer with WhatsApp CTA. Product detail pages (gallery, about, ingredients, qty, suggestions), design-styled checkout (pincode auto city/state lookup + phone field), Razorpay-style payment panel, track page, success screens.
- Backend switched to per-UNIT pricing to match design: 8 seeded products (Kaju Katli ₹499/500g box, Motichoor Ladoo ₹349, Gulab Jamun ₹299, Rasgulla ₹249, Jalebi ₹199, Besan Barfi ₹279, Dry-Fruit Laddu ₹499/1kg, Festive Hamper ₹899) with full PDP data (gallery/about/ingredients/ratings). Order items {product_id, qty}; delivery free ≥ ₹799 else ₹79; invoice PDF unit-based.
- Admin product CRUD updated to new fields (name, price, unit, image, category, badge, tagline).
- Testing: 13/13 backend pytest + 100% frontend E2E passed (iteration_2.json), zero bugs; mobile overflow resolved.

## Implemented (2026-09-10, v1 — superseded by v2)
- Storefront reskinned to user's own design (sweetoclock-single-file.html, applied as-is): centered header "Sweet'O Clock / Est. 1987 · Nagpur / No.001 — Winter Edit", hero with user's banner image + English/Hindi taglines, 6-product grid, "Kind words" customer reviews section (3 reviews), footer with dynamic basket status. Arial type, #f8f8f8 header/footer, #ddd bordered cards.
- Catalog replaced with the design's 6 products (Kaju Katli ₹499, Motichoor Ladoo ₹349, Gulab Jamun ₹299, Rasgulla ₹249, Jalebi ₹199, Besan Barfi ₹279 — per kg, with user's product images). Old Laddoo/Khajur Fudge seeds removed.
- Cart/checkout/tracking/admin all re-verified working against the new design (6 product cards, 3 review cards render; weight chips + add-to-basket functional).

## Implemented (2026-09-09)
- Storefront with warm mithai aesthetic (Cormorant Garamond/Outfit, saffron/ghee-gold palette), hero, product grid, weight chips, cart drawer.
- Guest checkout → Razorpay (mock mode) → server-side verify → order confirmation + PDF invoice download.
- Order tracking page with 4-step timeline + AWB/courier info.
- Admin panel: JWT login, stats, orders table (status select, Shiprocket push, resend invoice, invoice PDF), product CRUD.
- Backend seeded: 2 products, admin account. Test creds in /app/memory/test_credentials.md.
- Testing: 16/16 backend pytest, frontend E2E passed (iteration_1). Fixed: mobile overflow guard, exact-decimal totals everywhere, razorpay_order_id match check on verify.

## Backlog
- P0: Drop real Razorpay/Twilio/Shiprocket keys into backend/.env (rotate first — they were shared over chat); set SHIPROCKET_PICKUP_LOCATION to exact panel location name.
- P1: Apply user's existing design when shared; WhatsApp sender approval for +17372508034 to enable real WhatsApp invoices.
- P2: Coupons/offers, customer accounts, ratings, COD, WhatsApp status updates beyond invoice, CORS origin tightening for production.

## Next Tasks
1. User provides rotated live credentials → update backend/.env → restart backend → live payment/shipment smoke test.
2. User shares existing design → reskin storefront components.
