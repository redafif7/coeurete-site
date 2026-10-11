/* Cœurete — checkout (cash on delivery) */
(function () {
  const { $, $$ } = CQ;
  let code = "";

  const val = id => ($("#" + id)?.value || "").trim();
  const gift = () => $("[data-gift]").checked;
  const city = () => val("ville") === "Autre ville" ? val("autre_ville") : val("ville");

  function summary() {
    const pr = CQ.price({ code, gift: gift() });
    const box = $("[data-summary]");
    if (!pr.qty) {
      box.innerHTML = `<div class="empty"><img src="img/brand/mascot-3d-640.webp" alt="" width="140" height="140"><p class="hand">Ton panier est vide.</p><a class="btn btn--ink" href="index.html#collection">Choisir un message</a></div>`;
      $("[data-submit]").disabled = true; setBtnTotal("panier vide");
      return pr;
    }
    $("[data-submit]").disabled = false;
    box.innerHTML = `<ul class="lines">${pr.lines.map(l => `
      <li class="line"><span class="line__img"><img src="${CQ.img(l.p, "front", 480)}" alt="" width="64" height="64"></span>
        <div class="line__info"><p class="line__msg hand">${CQ.esc(l.p.msg)}</p><p class="line__meta">${CQ.colors[l.p.color].label} · Taille ${l.size} · × ${l.qty}</p></div>
        <div class="line__end"><p class="line__price">${CQ.money(l.total)}</p></div></li>`).join("")}</ul>
      <dl class="sums">
        <div><dt>Sous-total</dt><dd>${CQ.money(pr.subtotal)}</dd></div>
        ${pr.discount ? `<div class="is-off"><dt>${pr.discountLabel}</dt><dd>−${CQ.money(pr.discount)}</dd></div>` : ""}
        <div><dt>Livraison</dt><dd>${pr.shipping ? CQ.money(pr.shipping) : "Offerte"}</dd></div>
        ${pr.wrap ? `<div><dt>Emballage cadeau</dt><dd>${CQ.money(pr.wrap)}</dd></div>` : ""}
        <div class="sums__total"><dt>Total à payer à la livraison</dt><dd>${CQ.money(pr.total)}</dd></div>
      </dl>
      ${pr.toFree > 0 ? `<p class="fine" style="text-align:left">Plus que ${CQ.money(pr.toFree)} pour la livraison offerte.</p>` : ""}
      <button class="link-btn" type="button" data-cart-open style="justify-self:start">Modifier le panier</button>`;
    setBtnTotal(CQ.money(pr.total));
    updateWA(pr);
    return pr;
  }

  let sending = false;
  function setBtnTotal(t) { const el = $("[data-btn-total]"); if (el && !sending) el.textContent = t; }

  function orderText(pr, no) {
    const lines = pr.lines.map(l => `• « ${l.p.msg} » — ${CQ.colors[l.p.color].label}, ${l.size} × ${l.qty} = ${CQ.money(l.total)}`).join("\n");
    return [
      `Salam Cœurete ! ${no ? `Commande ${no}` : "Je veux commander"} :`, lines,
      pr.discount ? `Remise : −${CQ.money(pr.discount)} (${pr.discountLabel})` : "",
      `Livraison : ${pr.shipping ? CQ.money(pr.shipping) : "offerte"}`,
      pr.wrap ? `Emballage cadeau : ${CQ.money(pr.wrap)}${val("mot") ? ` — mot : « ${val("mot")} »` : ""}` : "",
      `Total : ${CQ.money(pr.total)} (paiement à la livraison)`, "",
      val("nom") ? `Nom : ${val("nom")}` : "", val("telephone") ? `Tél : ${val("telephone")}` : "",
      city() ? `Ville : ${city()}` : "", val("adresse") ? `Adresse : ${val("adresse")}` : "", val("note") ? `Note : ${val("note")}` : ""
    ].filter((x, i, a) => x !== "" || (i > 0 && a[i - 1] !== "")).join("\n");
  }
  function updateWA(pr) { $("[data-wa-checkout]").href = CQ.wa(orderText(pr)); }

  function setErr(id, msg) {
    const f = $("#" + id)?.closest(".field"); const e = $(`[data-err="${id}"]`);
    if (f) f.classList.toggle("is-error", !!msg);
    if (e) e.textContent = msg || "";
    $("#" + id)?.setAttribute("aria-invalid", msg ? "true" : "false");
    if (e) { e.id = e.id || `err-${id}`; $("#" + id)?.setAttribute("aria-describedby", e.id); }
  }
  function validate() {
    const errs = [];
    const check = (id, ok, msg) => { setErr(id, ok ? "" : msg); if (!ok) errs.push(id); };
    check("nom", val("nom").length >= 3, "Écris ton prénom et ton nom.");
    check("telephone", CQ.validPhone(val("telephone")), "Numéro marocain attendu, par ex. 06 12 34 56 78.");
    check("ville", !!val("ville"), "Choisis ta ville.");
    if (val("ville") === "Autre ville") check("autre_ville", val("autre_ville").length >= 2, "Écris le nom de ta ville.");
    check("adresse", val("adresse").length >= 6, "Ajoute ton adresse (rue, quartier, repère).");
    const consent = $("[data-consent]").checked;
    $("[data-consent-wrap]").classList.toggle("is-error", !consent);
    if (!consent) errs.push("consent");
    return errs;
  }

  const orderNo = () => "CQ-" + Date.now().toString(36).toUpperCase().slice(-6);

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("[data-checkout]");
    $("[data-cities]").insertAdjacentHTML("beforeend", CQ.cities.map(c => `<option>${c}</option>`).join(""));
    $("#ville").addEventListener("change", () => { $("[data-other-city]").hidden = val("ville") !== "Autre ville"; summary(); });
    $("[data-gift]").addEventListener("change", () => { $("[data-gift-note]").hidden = !gift(); summary(); });
    form.addEventListener("input", e => { if (e.target.closest(".field.is-error")) setErr(e.target.id, ""); updateWA(CQ.price({ code, gift: gift() })); });
    $("#telephone").addEventListener("blur", () => { if (val("telephone")) setErr("telephone", CQ.validPhone(val("telephone")) ? "" : "Numéro marocain attendu, par ex. 06 12 34 56 78."); });

    const applyCode = () => {
      const c = val("code").toUpperCase(); const m = $("[data-code-msg]");
      if (!c) { code = ""; m.textContent = ""; summary(); return; }
      if (CQ.settings.promo[c]) {
        code = c; const pr = summary();
        m.className = "promo-msg ok";
        m.textContent = pr.discountLabel.startsWith("Code") ? `Code ${c} appliqué : −10 %.` : `Code ${c} valide, mais ton pack 2 t-shirts donne déjà −10 % (non cumulable).`;
      } else { code = ""; summary(); m.className = "promo-msg no"; m.textContent = "Ce code n'existe pas. Vérifie l'orthographe."; }
    };
    $("[data-apply-code]").addEventListener("click", applyCode);
    $("#code").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); applyCode(); } });

    CQ.cart.on(summary);
    summary();

    $("[data-wa-checkout]").addEventListener("click", e => { if (!CQ.cart.count()) e.preventDefault(); });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const errBox = $("[data-form-error]"); errBox.hidden = true;
      const pr = CQ.price({ code, gift: gift() });
      if (!pr.qty) return;
      const errs = validate();
      if (errs.length) {
        errBox.textContent = errs.length === 1 ? "Il manque une information." : `Il manque ${errs.length} informations.`;
        errBox.hidden = false;
        const first = errs[0] === "consent" ? $("[data-consent]") : $("#" + errs[0]);
        first.focus(); first.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
      const no = orderNo();
      const hidden = {
        numero: no,
        articles: pr.lines.map(l => `${l.p.msg} | ${CQ.colors[l.p.color].label} | ${l.size} | x${l.qty} | ${l.total} MAD`).join(" ; "),
        sous_total: pr.subtotal, remise: pr.discount ? `${pr.discount} (${pr.discountLabel})` : "0",
        livraison: pr.shipping, emballage: pr.wrap, total: pr.total
      };
      Object.entries(hidden).forEach(([k, v]) => { $(`[data-h="${k}"]`).value = v; });
      const btn = $("[data-submit]"); btn.disabled = true; sending = true; btn.textContent = "Envoi en cours…";
      const fields = Object.fromEntries(new FormData(form).entries());
      fields["ville"] = city();
      const r = await CQ.submitForm("commande", fields);
      if (!r.ok) {
        sending = false; btn.disabled = false; btn.innerHTML = `Confirmer la commande — <span data-btn-total>${CQ.money(pr.total)}</span>`;
        errBox.textContent = "La commande n'est pas partie (connexion ?). Réessaie, ou envoie-la sur WhatsApp juste en dessous.";
        errBox.hidden = false; return;
      }
      const recap = { no, demo: r.demo, at: new Date().toISOString(), name: val("nom").split(" ")[0], city: city(),
        lines: pr.lines.map(l => ({ slug: l.slug, size: l.size, qty: l.qty, total: l.total })),
        subtotal: pr.subtotal, discount: pr.discount, discountLabel: pr.discountLabel, shipping: pr.shipping, wrap: pr.wrap, total: pr.total,
        wa: orderText(pr, no) };
      try { sessionStorage.setItem("coeurete-last-order", JSON.stringify(recap)); } catch { window.name = "cq:" + JSON.stringify(recap); }
      location.href = "merci.html";
      CQ.cart.clear();
    });
  });
})();
