# Cœurete — site e-commerce

The online store for **Cœurete** (cœur + tête): 16 oversize cotton t-shirts with a message on the front and a drawing on the back. It has cash-on-delivery checkout across Morocco, WhatsApp ordering and a live 3D mascot.

Plain HTML, CSS and JavaScript. There's no framework to learn: if you can edit a web page, you can work on this site.

---

## Run it on your computer

You need [Node.js](https://nodejs.org) 18 or newer and [Git](https://git-scm.com).

```bash
git clone <this-repo-url>
cd coeurete-site
npm install
npm run dev
```

Open **http://localhost:5173**. The site rebuilds every time you save a file; refresh the page to see the change.

> Opening `src/index.html` directly by double-clicking won't work properly. Always use `npm run dev`.

## Where things live

| You want to change… | Edit this |
|---|---|
| Prices, product names, colours, moods, drawings' descriptions | `src/js/data.js` → `CQ.products` |
| WhatsApp number, Instagram, delivery fee, free-delivery threshold, promo codes | `src/js/data.js` → `CQ.settings` |
| Size guide (cm) or the list of cities | `src/js/data.js` → `CQ.sizeGuide`, `CQ.cities` |
| Home page text and sections | `src/index.html` |
| Header, menu, footer (shared by all pages) | `src/partials/header.html`, `footer.html`, `head.html` |
| Product page / checkout / thank-you page | `src/produit.html`, `src/commande.html`, `src/merci.html` |
| Colours, fonts, spacing, layout | `src/css/site.css` (tokens at the top, in `:root`) |
| Product photos | `src/img/tees/` (see below) |
| The 3D mascot | `src/models/mascot.glb`, behaviour in `src3d/mascot3d.src.js` |

Behaviour is in `src/js/`: `core.js` covers the cart, drawer and pricing, `home.js` the filters and slider, `product.js` the product page, and `checkout.js` the order form.

### Product photos

Each t-shirt `NN` (01–16, same order as `data.js`) has 4 files:

```
src/img/tees/NN-front-480.webp   NN-front-900.webp
src/img/tees/NN-back-480.webp    NN-back-900.webp
```

Square images on a transparent background, with the t-shirt centred and filling about 86% of the width. The current images are cut out from the collection board and are low resolution. **Replacing them with real product photos is the biggest quality upgrade available.**

To add a 17th t-shirt, add a line to `CQ.products` with `n: 17` and add its 4 images.

## How the team works together

1. **Never push straight to `main`.** Make a branch: `git checkout -b change-prices`.
2. Make your changes, then check them: `npm run check`. This builds the site and verifies every image, link and script exists.
3. Push and open a **Pull Request** on GitHub. GitHub runs the same check automatically, and a ✓ means it's safe to merge.
4. Once someone has looked at it, **merge**. The live site updates by itself about a minute later.

## Hosting

**GitHub Pages (automatic).** Every merge to `main` publishes the site at `https://<owner>.github.io/<repo>/`. On GitHub Pages the checkout runs in **demo mode**: it shows the confirmation page but doesn't store the order, and the customer can still send it on WhatsApp. This is ideal for showing the site to people.

**Netlify (for the real store).** GitHub Pages can't receive form submissions. To receive real orders:

1. On [app.netlify.com](https://app.netlify.com), go to *Add new project* → *Import from Git* and choose this repo. `netlify.toml` already sets up the build.
2. Go to *Project configuration* → *Forms* → *Enable form detection*, then redeploy once.
3. Orders arrive under *Forms* → **commande**, and newsletter sign-ups under **club**. Add an email notification on `commande`.

Netlify also redeploys automatically on every merge to `main`.

## Before launch checklist

- [ ] Real WhatsApp number in `src/js/data.js` (`whatsapp` in international format without `+`, and `whatsappDisplay`)
- [ ] Final prices
- [ ] Real product photos (front and back)
- [ ] Netlify connected, form detection on, email notification on `commande`
- [ ] Custom domain (in Netlify → *Domain management*)

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local site at http://localhost:5173, rebuilds on save |
| `npm run build` | Builds the final site into `dist/` |
| `npm run check` | Builds and checks nothing is broken (run before every PR) |
