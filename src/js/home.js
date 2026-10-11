/* Cœurete — home page behaviour */
(function () {
  const { $, $$ } = CQ;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    /* --- marquee of all 16 messages (duplicated for a seamless loop) --- */
    const mq = $("[data-marquee]");
    if (mq) {
      const items = CQ.products.map(p => `<span>${CQ.esc(p.msg)}</span>`).join("");
      mq.innerHTML = items + items;
    }

    /* --- "Aujourd'hui, mon cœur dit :" rotates through the messages --- */
    const today = $("[data-today]");
    if (today && !reduce) {
      let i = 2;
      setInterval(() => {
        if (document.hidden) return;
        i = (i + 1) % CQ.products.length;
        today.textContent = CQ.products[i].msg;
        today.classList.remove("swap"); void today.offsetWidth; today.classList.add("swap");
      }, 3200);
    }

    /* --- static bits from data --- */
    const dots = $("[data-dots]");
    if (dots) dots.innerHTML = [...new Set(CQ.products.map(p => CQ.colors[p.color].hex))].map(h => `<i style="--c:${h}"></i>`).join("");
    const st = $("[data-size-table]");
    if (st) st.innerHTML = `<thead><tr><th scope="col">Taille</th><th scope="col">Largeur poitrine</th><th scope="col">Longueur</th></tr></thead><tbody>${
      CQ.sizeGuide.map(([s, w, l]) => `<tr><th scope="row">${s}</th><td>${w} cm</td><td>${l} cm</td></tr>`).join("")}</tbody>`;

    /* --- mood + colour filters --- */
    const grid = $("[data-grid]");
    const moodsEl = $("[data-moods]"), swEl = $("[data-swatches]"), line = $("[data-mood-line]");
    const circle = `<svg viewBox="0 0 120 50" preserveAspectRatio="none" aria-hidden="true"><path d="M70 6C38 2 8 10 5 26c-3 16 30 22 60 20 30-2 52-10 50-24C113 10 84 3 56 5"/></svg>`;
    let mood = "all", color = "all";
    if (moodsEl) {
      moodsEl.innerHTML = [{ id: "all", label: "Tout voir" }, ...CQ.moods].map(m =>
        `<button class="mood" type="button" data-mood="${m.id}" aria-pressed="${m.id === "all"}">${m.label}${circle}</button>`).join("");
    }
    if (swEl) {
      const used = [...new Set(CQ.products.map(p => p.color))];
      swEl.innerHTML = used.map(c => `<button class="swatch" type="button" data-color="${c}" style="--c:${CQ.colors[c].hex}" aria-pressed="false" aria-label="${CQ.colors[c].label}" title="${CQ.colors[c].label}"></button>`).join("");
    }
    function apply() {
      let n = 0;
      $$(".tee", grid).forEach(card => {
        const show = (mood === "all" || card.dataset.mood === mood) && (color === "all" || card.dataset.color === color);
        const was = !card.classList.contains("is-out");
        card.classList.toggle("is-out", !show);
        if (show) { n++; if (!was && !reduce) { card.classList.remove("is-entering"); void card.offsetWidth; card.classList.add("is-entering"); card.style.animationDelay = (n * 40) + "ms"; } }
      });
      const m = CQ.moods.find(x => x.id === mood);
      const c = CQ.colors[color];
      line.textContent = n === 0 ? "Aucun message ne correspond. Essaie une autre couleur."
        : `${n} message${n > 1 ? "s" : ""}${m ? ` ${m.line}` : ""}${c ? ` · en ${c.label.toLowerCase()}` : ""}.`;
      let empty = $(".grid-empty", grid);
      if (n === 0 && !empty) grid.insertAdjacentHTML("beforeend", `<p class="grid-empty hand" style="font-size:1.8rem">Pas encore de message ici… <button class="link-btn" type="button" data-reset>Tout voir</button></p>`);
      if (n > 0 && empty) empty.remove();
    }
    moodsEl && moodsEl.addEventListener("click", e => {
      const b = e.target.closest("[data-mood]"); if (!b) return;
      mood = b.dataset.mood;
      $$("[data-mood]", moodsEl).forEach(x => x.setAttribute("aria-pressed", x === b));
      apply();
    });
    swEl && swEl.addEventListener("click", e => {
      const b = e.target.closest("[data-color]"); if (!b) return;
      color = color === b.dataset.color ? "all" : b.dataset.color;
      $$("[data-color]", swEl).forEach(x => x.setAttribute("aria-pressed", x.dataset.color === color));
      apply();
    });
    grid && grid.addEventListener("click", e => {
      if (e.target.closest("[data-reset]")) {
        mood = color = "all";
        $$("[data-mood]").forEach(x => x.setAttribute("aria-pressed", x.dataset.mood === "all"));
        $$(".swatch").forEach(x => x.setAttribute("aria-pressed", "false"));
        apply();
      }
    });

    /* --- CŒUR / TÊTE split --- */
    const split = $("[data-split]"), range = $("[data-split-range]");
    if (split && range) {
      const set = v => split.style.setProperty("--split", v + "%");
      range.addEventListener("input", () => set(range.value));
      // gentle intro sweep the first time it comes into view
      if (!reduce && "IntersectionObserver" in window) {
        const io = new IntersectionObserver(([en]) => {
          if (!en.isIntersecting) return; io.disconnect();
          let t0 = null;
          const run = t => { t0 ??= t; const k = Math.min(1, (t - t0) / 1600);
            const v = 50 + Math.sin(k * Math.PI * 2) * 18 * (1 - k); set(v.toFixed(1)); if (k < 1) requestAnimationFrame(run); };
          requestAnimationFrame(run);
        }, { threshold: .5 });
        io.observe(split);
      }
    }

    /* --- Club form (Netlify Forms) --- */
    const club = $("[data-club]");
    if (club) {
      const input = $("#club-contact"), msg = $("[data-club-msg]"), canal = $("[data-club-canal]"), label = $("[data-club-label]");
      club.addEventListener("click", e => {
        const b = e.target.closest("[data-canal]"); if (!b) return;
        $$("[data-canal]", club).forEach(x => x.setAttribute("aria-pressed", x === b));
        canal.value = b.dataset.canal;
        const wa = b.dataset.canal === "whatsapp";
        input.type = wa ? "tel" : "email";
        input.autocomplete = wa ? "tel" : "email";
        input.placeholder = wa ? "06 12 34 56 78" : "ton@email.com";
        label.textContent = wa ? "Ton numéro WhatsApp" : "Ton adresse e-mail";
        input.value = ""; msg.textContent = ""; input.focus();
      });
      club.addEventListener("submit", async e => {
        e.preventDefault();
        const v = input.value.trim();
        const ok = canal.value === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) : CQ.validPhone(v);
        msg.className = "form-msg";
        if (!ok) { msg.classList.add("is-err"); msg.textContent = canal.value === "email" ? "Vérifie ton adresse e-mail (ex. nom@gmail.com)." : "Entre un numéro marocain, par ex. 06 12 34 56 78."; input.focus(); return; }
        const btn = $("button[type=submit]", club); btn.disabled = true;
        const r = await CQ.submitForm("club", { canal: canal.value, contact: v, "bot-field": "" });
        btn.disabled = false;
        if (r.ok) { msg.classList.add("is-ok"); msg.textContent = r.demo ? "Inscription enregistrée (aperçu : rien n'a été envoyé)." : "Bienvenue au Club ! On t'écrit bientôt."; club.reset(); canal.value = $("[data-canal][aria-pressed=true]", club).dataset.canal; }
        else { msg.classList.add("is-err"); msg.textContent = "L'inscription n'est pas passée. Réessaie dans un instant."; }
      });
    }
  });
})();
