/* Cœurete — product page (produit.html#slug) */
(function () {
  const { $, $$ } = CQ;
  let p, side = "front", size = null, qty = 1;

  function slugFromHash() { return decodeURIComponent(location.hash.replace(/^#/, "")); }

  function render() {
    p = CQ.find(slugFromHash()) || CQ.products[1];
    const c = CQ.colors[p.color];
    const mood = CQ.moods.find(m => m.id === p.mood);
    document.title = `${p.msg.replace(/\.$/, "")} — T-shirt oversize ${c.label.toLowerCase()} | Cœurete`;
    const md = $('meta[name="description"]');
    md && md.setAttribute("content", `T-shirt oversize 100 % coton ${c.label.toLowerCase()} « ${p.msg} » — ${CQ.money(p.price)}. Paiement à la livraison partout au Maroc.`);
    $("[data-crumb]").textContent = p.msg;
    $("[data-title]").textContent = p.msg;
    $("[data-name]").textContent = `T-shirt oversize · ${c.label} · 100 % coton`;
    $("[data-price]").textContent = CQ.money(p.price);
    $("[data-mood-text]").innerHTML = `Humeur : <a href="index.html#collection">${mood.label}</a> — ${mood.line}`;
    $("[data-color-name]").textContent = c.label;
    $("[data-art]").textContent = p.art;

    // other messages in the same colour
    const same = CQ.products.filter(x => x.color === p.color);
    $("[data-colorway]").innerHTML = same.map(x => `<a href="produit.html#${x.slug}" ${x === p ? 'aria-current="true"' : ""}><img src="${CQ.img(x, "front", 480)}" alt="" width="36" height="36">${CQ.esc(x.msg)}</a>`).join("");

    $$("[data-thumb]").forEach(img => { img.src = CQ.img(p, img.dataset.thumb, 480); });
    side = "front"; showSide(false);

    // sizes
    size = null; qty = 1; $("[data-qty-out]").textContent = 1;
    $("[data-sizes]").innerHTML = CQ.settings.sizes.map(s => `<div class="size"><input type="radio" name="size" id="size-${s}" value="${s}"><label for="size-${s}">${s}</label></div>`).join("");
    $("[data-size-err]").hidden = true; $("[data-size-opt]").classList.remove("is-error");

    // related: same mood first, then others, max 4
    const rel = [...CQ.products.filter(x => x.mood === p.mood && x !== p), ...CQ.products.filter(x => x.mood !== p.mood && x.color !== p.color)].slice(0, 4);
    $("[data-related]").innerHTML = rel.map(x => CQ.cardHTML(x)).join("");

    $("[data-bb-title]").textContent = p.msg;
    $("[data-bb-meta]").textContent = `${c.label} · ${CQ.money(p.price)}`;
    updateWA();
    // JSON-LD for this product
    let ld = $("#ld-product");
    if (!ld) { ld = document.createElement("script"); ld.type = "application/ld+json"; ld.id = "ld-product"; document.head.append(ld); }
    ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: `T-shirt Cœurete « ${p.msg} »`, color: c.label, material: "Coton",
      image: [CQ.img(p, "front", 900), CQ.img(p, "back", 900)], brand: { "@type": "Brand", name: "Cœurete" },
      offers: { "@type": "Offer", priceCurrency: "MAD", price: p.price, availability: "https://schema.org/InStock" } });
    scrollTo({ top: 0, behavior: "instant" });
  }

  function showSide(animate = true) {
    const main = $("[data-main]");
    const c = CQ.colors[p.color];
    const src = CQ.img(p, side, 900);
    const set = () => { main.src = src; main.alt = `T-shirt ${c.label.toLowerCase()} « ${p.msg} », vue ${side === "front" ? "de face" : "de dos"}`; main.style.opacity = 1; };
    if (animate) { main.style.opacity = 0; setTimeout(set, 180); } else set();
    $$("[data-view]").forEach(b => b.setAttribute("aria-pressed", b.dataset.view === side));
    $("[data-flip]").textContent = side === "front" ? "Voir le dos" : "Voir le devant";
    $("[data-side-label]").textContent = side === "front" ? "devant" : "dos";
  }

  function updateWA() {
    const c = CQ.colors[p.color];
    const t = `Salam Cœurete ! Je veux commander :\n• « ${p.msg} » — ${c.label}, taille ${size || "?"} × ${qty} (${CQ.money(p.price * qty)})\nPaiement à la livraison.\nMa ville : `;
    $("[data-wa-order]").href = CQ.wa(t);
  }

  function needSize() {
    if (size) return false;
    $("[data-size-err]").hidden = false; $("[data-size-opt]").classList.add("is-error");
    $("[data-sizes] input").focus();
    $("[data-size-opt]").scrollIntoView({ block: "center", behavior: "smooth" });
    return true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    addEventListener("hashchange", render);

    $(".thumbs").addEventListener("click", e => { const b = e.target.closest("[data-view]"); if (b && b.dataset.view !== side) { side = b.dataset.view; showSide(); } });
    $("[data-flip]").addEventListener("click", e => { e.stopPropagation(); side = side === "front" ? "back" : "front"; showSide(); });

    // hover zoom (pointer devices)
    const viewer = $("[data-viewer]"), main = $("[data-main]");
    if (matchMedia("(hover: hover)").matches) {
      viewer.addEventListener("click", e => { if (e.target.closest("[data-flip]")) return; viewer.classList.toggle("is-zoom"); if (!viewer.classList.contains("is-zoom")) main.style.transformOrigin = ""; });
      viewer.addEventListener("pointermove", e => {
        if (!viewer.classList.contains("is-zoom")) return;
        const r = viewer.getBoundingClientRect();
        main.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
      });
      viewer.addEventListener("pointerleave", () => viewer.classList.remove("is-zoom"));
    } else viewer.style.cursor = "default";

    $("[data-sizes]").addEventListener("change", e => {
      size = e.target.value; $("[data-size-err]").hidden = true; $("[data-size-opt]").classList.remove("is-error"); updateWA();
      $("[data-bb-meta]").textContent = `${CQ.colors[p.color].label} · Taille ${size} · ${CQ.money(p.price)}`;
    });
    document.querySelector(".buy__row .stepper").addEventListener("click", e => {
      const b = e.target.closest("[data-qty]"); if (!b) return;
      qty = Math.max(1, Math.min(10, qty + +b.dataset.qty)); $("[data-qty-out]").textContent = qty; updateWA();
    });
    $("[data-add-main]").addEventListener("click", () => { if (!needSize()) CQ.addToCart(p.slug, size, qty); });
    $("[data-bb-add]").addEventListener("click", () => { if (!needSize()) CQ.addToCart(p.slug, size, qty); });
    $("[data-wa-order]").addEventListener("click", e => { if (needSize()) e.preventDefault(); });

    // size guide dialog
    const dlg = $("[data-guide-dialog]");
    $("[data-size-table]").innerHTML = `<thead><tr><th scope="col">Taille</th><th scope="col">Largeur</th><th scope="col">Longueur</th></tr></thead><tbody>${CQ.sizeGuide.map(([s, w, l]) => `<tr><th scope="row">${s}</th><td>${w} cm</td><td>${l} cm</td></tr>`).join("")}</tbody>`;
    $("[data-guide]").addEventListener("click", () => dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", ""));
    $("[data-guide-close]").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

    // sticky mobile buy bar once the main button scrolls away
    const bar = $("[data-buybar]"), addBtn = $("[data-add-main]");
    new IntersectionObserver(([en]) => {
      const on = !en.isIntersecting && en.boundingClientRect.top < 0;
      bar.classList.toggle("is-on", on); bar.setAttribute("aria-hidden", !on);
      $("[data-bb-add]").tabIndex = on ? 0 : -1;
    }).observe(addBtn);

  });
})();
