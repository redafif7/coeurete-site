/* Product card markup — used by the build (static HTML) and by pages at runtime. */
(function (root) {
  const CQ = root.CQ;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  CQ.cardHTML = function (p, { lazy = true } = {}) {
    const c = CQ.colors[p.color];
    const mood = CQ.moods.find(m => m.id === p.mood);
    const tilt = ((p.n * 37) % 50) - 25;
    const L = lazy ? ' loading="lazy" decoding="async"' : ' decoding="async"';
    return `<article class="tee" data-slug="${p.slug}" data-mood="${p.mood}" data-color="${p.color}" style="--tilt:${tilt}deg">
  <div class="tee__well">
    ${p.pick ? '<span class="tee__pick">Coup de cœur</span>' : ""}
    <img class="tee__img tee__img--front" src="${CQ.img(p, "front", 480)}" srcset="${CQ.img(p, "front", 480)} 480w, ${CQ.img(p, "front", 900)} 900w" sizes="(max-width: 640px) 46vw, (max-width: 1080px) 30vw, 300px" width="480" height="480" alt="T-shirt ${c.label.toLowerCase()} « ${esc(p.msg)} », vue de face"${L}>
    <img class="tee__img tee__img--back" src="${CQ.img(p, "back", 480)}" srcset="${CQ.img(p, "back", 480)} 480w, ${CQ.img(p, "back", 900)} 900w" sizes="(max-width: 640px) 46vw, (max-width: 1080px) 30vw, 300px" width="480" height="480" alt="" aria-hidden="true" loading="lazy" decoding="async">
    <span class="tee__side" aria-hidden="true"><span class="f">Devant</span><span class="b">Dos</span></span>
    <button class="tee__add" type="button" data-quick="${p.slug}" aria-label="Ajouter « ${esc(p.msg)} » au panier — choisir la taille">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
    </button>
  </div>
  <div class="tee__info">
    <a class="tee__msg" href="produit.html#${p.slug}">${esc(p.msg)}</a>
    <p class="tee__meta"><i style="--c:${c.hex}"></i>${c.label} · ${mood.label}</p>
    <p class="tee__price">${CQ.money(p.price)}</p>
  </div>
</article>`;
  };
})(typeof window !== "undefined" ? window : globalThis);
