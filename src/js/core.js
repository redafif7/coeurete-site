/* Cœurete — shared behaviour: cart store, pricing, header, cart drawer, toasts. */
(function () {
  const S = CQ.settings;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  CQ.$ = $; CQ.$$ = $$;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  CQ.esc = esc;
  /* Moroccan mobile/landline: 06…, 07…, 05…, +212 6…, 00212 6… */
  CQ.normPhone = v => { let s = String(v).replace(/[\s.\-()]/g, ""); if (s.startsWith("00212")) s = "+212" + s.slice(5); if (s.startsWith("+212")) s = "0" + s.slice(4); return s; };
  CQ.validPhone = v => /^0[5-7]\d{8}$/.test(CQ.normPhone(v));

  /* ---------- storage (falls back to memory when blocked) ---------- */
  const mem = {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return k in mem ? mem[k] : d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { mem[k] = v; } }
  };
  CQ.store = store;

  /* ---------- cart ---------- */
  const KEY = "coeurete-cart-v1";
  const listeners = new Set();
  const cart = {
    items() { return store.get(KEY, []).filter(i => CQ.find(i.slug)); },
    save(list) { store.set(KEY, list); listeners.forEach(fn => fn()); },
    add(slug, size, qty = 1) {
      const list = cart.items();
      const hit = list.find(i => i.slug === slug && i.size === size);
      if (hit) hit.qty = Math.min(hit.qty + qty, 10); else list.push({ slug, size, qty });
      cart.save(list);
    },
    setQty(slug, size, qty) {
      let list = cart.items();
      list = qty <= 0 ? list.filter(i => !(i.slug === slug && i.size === size))
                      : list.map(i => i.slug === slug && i.size === size ? { ...i, qty: Math.min(qty, 10) } : i);
      cart.save(list);
    },
    clear() { cart.save([]); },
    count() { return cart.items().reduce((n, i) => n + i.qty, 0); },
    on(fn) { listeners.add(fn); }
  };
  CQ.cart = cart;
  window.addEventListener("storage", e => { if (e.key === KEY) listeners.forEach(fn => fn()); });

  /* ---------- pricing (single source of truth for drawer, checkout, confirmation) ---------- */
  CQ.price = function ({ items = cart.items(), code = "", gift = false } = {}) {
    const lines = items.map(i => { const p = CQ.find(i.slug); return { ...i, p, total: p.price * i.qty }; });
    const qty = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + l.total, 0);
    const codeKey = (code || "").trim().toUpperCase();
    const codeRate = S.promo[codeKey] || 0;
    const packRate = qty >= S.multiBuyQty ? S.multiBuyRate : 0;
    const rate = Math.max(codeRate, packRate);
    const discountLabel = !rate ? "" : (packRate >= codeRate ? `Pack ${S.multiBuyQty} t-shirts (−${Math.round(packRate * 100)} %)` : `Code ${codeKey} (−${Math.round(codeRate * 100)} %)`);
    const discount = Math.round(subtotal * rate);
    const after = subtotal - discount;
    const shipping = qty === 0 ? 0 : (after >= S.freeShippingFrom ? 0 : S.shipping);
    const wrap = gift && qty ? S.giftWrap : 0;
    return { lines, qty, subtotal, discount, discountLabel, codeValid: !!codeRate, codeKey, shipping, wrap,
             total: after + shipping + wrap, toFree: Math.max(0, S.freeShippingFrom - after), after };
  };

  /* ---------- Netlify Forms (AJAX). On a host without Netlify, report demo mode honestly. ---------- */
  /* Orders are stored by Netlify Forms. Anywhere else (your computer, GitHub Pages, previews)
     the checkout runs in demo mode and says so on the confirmation page. */
  CQ.isLive = () => {
    if (CQ.settings.demo) return false;
    if (!/^https?:$/.test(location.protocol)) return false;
    const h = location.hostname;
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(h)) return false;
    if (/github\.io$|claude\.ai|claudeusercontent|anthropic/.test(h)) return false;
    return true;
  };
  CQ.submitForm = async function (name, fields) {
    if (!CQ.isLive()) return { ok: true, demo: true };
    const body = new URLSearchParams({ "form-name": name, ...fields }).toString();
    try {
      const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      return { ok: r.ok, demo: false, status: r.status };
    } catch (e) { return { ok: false, demo: false, error: e }; }
  };

  /* ---------- WhatsApp ---------- */
  CQ.wa = text => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}`;

  /* ---------- toast ---------- */
  CQ.toast = function (msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("is-on"), 2600);
  };

  /* ---------- header: count, scroll state, mobile menu ---------- */
  function syncCount() {
    const n = cart.count();
    $$("[data-cart-count]").forEach(el => { el.textContent = n; el.hidden = n === 0; });
    $$("[data-cart-open]").forEach(b => b.setAttribute("aria-label", `Ouvrir le panier, ${n} article${n > 1 ? "s" : ""}`));
  }
  cart.on(syncCount);

  function initHeader() {
    const h = $(".site-header");
    if (h) {
      const onScroll = () => h.classList.toggle("is-scrolled", scrollY > 24);
      addEventListener("scroll", onScroll, { passive: true }); onScroll();
    }
    const btn = $(".menu-toggle"), menu = $("#mobile-menu");
    if (btn && menu) {
      const set = open => { btn.setAttribute("aria-expanded", open); menu.hidden = !open; document.body.classList.toggle("no-scroll", open); };
      btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
      menu.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
      addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { set(false); btn.focus(); } });
    }
    syncCount();
  }

  /* ---------- cart drawer ---------- */
  let lastFocus = null;
  function drawerHTML() {
    return `
<div class="drawer" id="cart-drawer" hidden>
  <div class="drawer__scrim" data-cart-close></div>
  <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabindex="-1">
    <header class="drawer__head">
      <h2 id="drawer-title" class="drawer__title">Ton panier <span class="drawer__n" data-drawer-n></span></h2>
      <button class="icon-btn" type="button" data-cart-close aria-label="Fermer le panier">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </header>
    <div class="ship-meter" data-ship-meter></div>
    <div class="drawer__body" data-drawer-body></div>
    <footer class="drawer__foot" data-drawer-foot></footer>
  </aside>
</div>`;
  }
  function renderDrawer() {
    const body = $("[data-drawer-body]"); if (!body) return;
    const pr = CQ.price();
    $("[data-drawer-n]").textContent = pr.qty ? `(${pr.qty})` : "";
    const meter = $("[data-ship-meter]");
    if (!pr.qty) {
      meter.hidden = true;
      body.innerHTML = `
        <div class="empty">
          <img src="img/brand/mascot-3d-640.webp" alt="" width="160" height="160" loading="lazy">
          <p class="hand">Ton panier attend un message.</p>
          <a class="btn btn--ink" href="index.html#collection" data-cart-close>Voir les 16 messages</a>
        </div>`;
      $("[data-drawer-foot]").innerHTML = "";
      return;
    }
    meter.hidden = false;
    const pct = Math.min(100, Math.round((pr.after / S.freeShippingFrom) * 100));
    meter.innerHTML = pr.toFree > 0
      ? `<p>Plus que <strong>${CQ.money(pr.toFree)}</strong> pour la livraison offerte.</p><div class="meter" aria-hidden="true"><span style="width:${pct}%"></span></div>`
      : `<p><strong>Livraison offerte</strong> sur cette commande.</p><div class="meter is-full" aria-hidden="true"><span style="width:100%"></span></div>`;
    body.innerHTML = `<ul class="lines">${pr.lines.map(l => `
      <li class="line">
        <a class="line__img" href="produit.html#${l.slug}"><img src="${CQ.img(l.p, "front", 480)}" alt="" width="96" height="96" loading="lazy"></a>
        <div class="line__info">
          <a class="line__msg hand" href="produit.html#${l.slug}">${esc(l.p.msg)}</a>
          <p class="line__meta">${CQ.colors[l.p.color].label} · Taille ${l.size}</p>
          <div class="stepper" role="group" aria-label="Quantité pour ${esc(l.p.msg)} taille ${l.size}">
            <button type="button" data-q="-1" data-s="${l.slug}" data-z="${l.size}" aria-label="Retirer un">−</button>
            <output aria-live="polite">${l.qty}</output>
            <button type="button" data-q="1" data-s="${l.slug}" data-z="${l.size}" aria-label="Ajouter un">+</button>
          </div>
        </div>
        <div class="line__end">
          <p class="line__price">${CQ.money(l.total)}</p>
          <button type="button" class="link-btn" data-rm data-s="${l.slug}" data-z="${l.size}">Retirer</button>
        </div>
      </li>`).join("")}</ul>
      ${pr.qty < S.multiBuyQty ? `<p class="nudge">Ajoute un 2<sup>e</sup> t-shirt : <strong>−10 %</strong> sur toute la commande.</p>` : ""}`;
    $("[data-drawer-foot]").innerHTML = `
      <dl class="sums">
        <div><dt>Sous-total</dt><dd>${CQ.money(pr.subtotal)}</dd></div>
        ${pr.discount ? `<div class="is-off"><dt>${pr.discountLabel}</dt><dd>−${CQ.money(pr.discount)}</dd></div>` : ""}
        <div><dt>Livraison</dt><dd>${pr.shipping ? CQ.money(pr.shipping) : "Offerte"}</dd></div>
        <div class="sums__total"><dt>Total</dt><dd>${CQ.money(pr.total)}</dd></div>
      </dl>
      <a class="btn btn--coeur btn--block" href="commande.html">Commander — paiement à la livraison</a>
      <p class="fine">Tu paies en espèces à la réception. Échange gratuit sous 7 jours.</p>`;
  }
  function openDrawer() {
    const d = $("#cart-drawer"); if (!d) return;
    lastFocus = document.activeElement;
    renderDrawer(); d.hidden = false;
    requestAnimationFrame(() => d.classList.add("is-open"));
    document.body.classList.add("no-scroll");
    $(".drawer__panel", d).focus();
  }
  function closeDrawer() {
    const d = $("#cart-drawer"); if (!d || d.hidden) return;
    d.classList.remove("is-open"); document.body.classList.remove("no-scroll");
    setTimeout(() => { d.hidden = true; }, 320);
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  CQ.openCart = openDrawer;
  function initDrawer() {
    if ($("body").dataset.noDrawer !== undefined) return;
    document.body.insertAdjacentHTML("beforeend", drawerHTML());
    const d = $("#cart-drawer");
    document.addEventListener("click", e => {
      if (e.target.closest("[data-cart-open]")) { e.preventDefault(); openDrawer(); }
      else if (e.target.closest("[data-cart-close]")) closeDrawer();
    });
    d.addEventListener("click", e => {
      const q = e.target.closest("[data-q]");
      if (q) { const it = cart.items().find(i => i.slug === q.dataset.s && i.size === q.dataset.z); cart.setQty(q.dataset.s, q.dataset.z, (it ? it.qty : 0) + +q.dataset.q); }
      const rm = e.target.closest("[data-rm]");
      if (rm) cart.setQty(rm.dataset.s, rm.dataset.z, 0);
    });
    d.addEventListener("keydown", e => {
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Tab") {           // keep focus inside the dialog
        const f = $$("a[href],button:not([disabled]),input,[tabindex='0']", d).filter(x => x.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
      }
    });
    cart.on(renderDrawer);
  }

  /* ---------- add-to-cart helper with feedback ---------- */
  CQ.addToCart = function (slug, size, qty = 1, { open = true } = {}) {
    cart.add(slug, size, qty);
    const p = CQ.find(slug);
    if (!open) CQ.toast(`« ${p.msg} » ajouté — taille ${size}`);
    document.querySelectorAll("[data-cart-open]").forEach(b => { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); });
    if (open) setTimeout(openDrawer, 260);
  };

  /* ---------- reveal on scroll (content is visible by default; motion only enhances) ---------- */
  function initReveal() {
    const els = $$("[data-reveal]");
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach(el => {
      // anything already on screen is shown immediately
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-in"); else io.observe(el);
    });
  }

  /* ---------- quick add: size picker inside a product card ---------- */
  function initQuickAdd() {
    function closeSizes() { $$(".tee__sizes").forEach(s => { const btn = s.parentElement.querySelector("[data-quick]"); s.remove(); btn && btn.setAttribute("aria-expanded", "false"); }); }
    document.addEventListener("click", e => {
      const q = e.target.closest("[data-quick]");
      if (q) {
        e.preventDefault();
        const well = q.closest(".tee__well");
        const open = $(".tee__sizes", well);
        closeSizes();
        if (open) return;
        const p = CQ.find(q.dataset.quick);
        q.setAttribute("aria-expanded", "true");
        well.insertAdjacentHTML("beforeend", `<div class="tee__sizes" role="group" aria-label="Choisir la taille pour ${CQ.esc(p.msg)}">
          <p>Ta taille ? <button type="button" data-close-sizes aria-label="Fermer">×</button></p>
          <div class="row">${CQ.settings.sizes.map(s => `<button type="button" data-add="${p.slug}" data-size="${s}">${s}</button>`).join("")}</div></div>`);
        $(".tee__sizes .row button", well).focus();
        return;
      }
      const add = e.target.closest("[data-add]");
      if (add) { CQ.addToCart(add.dataset.add, add.dataset.size); closeSizes(); return; }
      if (e.target.closest("[data-close-sizes]") || !e.target.closest(".tee__sizes")) closeSizes();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeSizes(); });
  }

  /* ---------- footer links that depend on settings ---------- */
  function initSettingsLinks() {
    $$("[data-wa-link]").forEach(a => { a.href = CQ.wa(a.dataset.waLink || "Salam Cœurete !"); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-wa-number]").forEach(el => el.textContent = S.whatsappDisplay);
    $$("[data-ig-link]").forEach(a => { a.href = `https://instagram.com/${S.instagram}`; a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHeader(); initDrawer(); initReveal(); initSettingsLinks(); initQuickAdd();
  });
})();
