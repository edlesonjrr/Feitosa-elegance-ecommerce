# Feitosa Elegance — E-commerce

A production-ready, mobile-first e-commerce storefront for **Feitosa Elegance**, a Brazilian accessories brand selling bags, watches, wallets, headphones, and more. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build step, just open and run.

---

## Features

- **Product catalog** — 40+ products across 8 categories with filter chips, sort and real-time search
- **Product modal** — tap any card to open a detailed bottom sheet (mobile) or centered modal (desktop) with full info and PIX pricing
- **Shopping cart** — slide-in drawer with animated shipping progress bar, in-cart quantity badges on product cards, and an elegant empty state
- **Multi-step checkout** — 4-step order flow (cart review → payment → delivery → confirm) that composes a WhatsApp message automatically
- **Payment options** — PIX (5% discount), cash, debit and credit card with installments; card payments clearly explained as WhatsApp link-based for user trust
- **Testimonials carousel** — auto-plays only when the section is visible; pauses on tab switch; swipe/drag support
- **Animated hero** — organic 2D canvas with soft gradient orbs, glowing particles and flowing curves; mouse/touch parallax; no WebGL required
- **Animated counters** — hero stats count up from zero when scrolled into view
- **WhatsApp FAB** — floating action button with pulse rings, always visible for direct contact
- **Micro-interactions** — fly-to-cart animation, add-to-cart sound feedback (Web Audio API), cart icon flash, button success states
- **Lazy loading** — first 4 product images load eagerly with high fetch priority; remaining images load on demand with explicit dimensions to prevent layout shift
- **Fully responsive** — designed mobile-first; tested on small phones through wide desktops

---

## Tech Stack

| Layer              | Choice                                               |
| ------------------ | ---------------------------------------------------- |
| Markup             | Semantic HTML5                                       |
| Styling            | Modular CSS with custom properties (no preprocessor) |
| Logic              | Vanilla ES Modules (no bundler needed)               |
| Icons              | Remix Icons CDN                                      |
| Fonts              | Playfair Display + Outfit (Google Fonts)             |
| 3D (About section) | Three.js r128 via CDN                                |
| Maps               | Google Maps Embed                                    |
| Orders             | WhatsApp Web API (`wa.me`)                           |

---

## Project Structure

```
FeitosaEcommerce/
├── index.html
├── css/
│   ├── base.css        # design tokens, reset, buttons, animations
│   ├── navbar.css      # top navigation + mobile drawer
│   ├── hero.css        # full-screen hero section
│   ├── loja.css        # product grid, cards, search, modal
│   ├── cart.css        # cart drawer, empty state, shipping bar
│   ├── checkout.css    # multi-step order modal
│   └── sections.css    # about, team, contact, testimonials, footer
└── js/
    ├── app.js          # entry point, initializes all modules
    ├── products.js     # product data and category icons
    ├── loja.js         # grid render, filter, sort, search, product modal
    ├── cart.js         # cart state, drawer UI, fly-to-cart animation
    ├── checkout.js     # multi-step checkout flow + WhatsApp message builder
    └── ui.js           # hero canvas, navbar, scroll reveal, counters, carousel, sound
```

---

## Getting Started

No install required. Just clone and open:

```bash
git clone https://github.com/your-username/feitosa-elegance.git
cd feitosa-elegance
# open index.html in your browser
# or serve locally:
npx serve .
```

> **Note:** Product images are stored in an `images/` folder (not included in this repo). Replace with your own or update the paths in `js/products.js`.

---

## Customization

**Products** — Edit `js/products.js`. Each product follows this shape:

```js
{ id: 1, name: "Product Name", price: 199.90, image: "images/img.png", cat: "Category", badge: "hot" | "new" | null, desc: "Short description." }
```

**WhatsApp number** — Search for `5581983207224` and replace with your number in `js/cart.js` and `js/checkout.js`.

**Brand colors** — All colors are CSS custom properties in `css/base.css` under `:root`.

**Testimonials** — Edit the `.dep-card` blocks directly in `index.html`.

---

## Performance Notes

- `content-visibility: auto` on product cards skips rendering of off-screen items
- Event delegation on the product grid (1 listener instead of N)
- `IntersectionObserver` drives card entrance animations instead of CSS `animation-delay`
- `overflow-x: hidden` on `<html>` only — not on `<body>` — to preserve correct `position: fixed` behavior on mobile Safari
- Hero uses a pure 2D Canvas API instead of WebGL for broad device compatibility

---

## License

MIT — feel free to use, adapt, and build on this project.