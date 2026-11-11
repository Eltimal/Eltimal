const { sleep, texts, findBtn, click } = require("./harness");
// Joue une audience. o: { interject:true, constitution:"yes"|"no", questions:[re], args:[re], angle:re, card:re|null, dernier:re, limine:[re] }
async function runAudience(w, doc, CR, o = {}) {
  const log = [];
  for (let i = 0; i < 600; i++) {
    await sleep(25);
    const sc = doc.querySelector(".court-scene");
    if (!sc) { const jury = doc.querySelector(".jury-scene"); if (jury) { const b = findBtn(doc, "Accepter"); if (b) await click(w, b); continue; } break; }
    if (doc.querySelector(".window-bar") && doc.querySelector(".parole") && o.interject && !sc.dataset.inter) {
      // fenêtre ouverte : on demande la parole
      const bar = doc.querySelector(".court-controls > .window-bar");
      if (bar) { await click(w, doc.querySelector(".parole")); log.push("PAROLE"); continue; }
    }
    const lim = sc.querySelector(".limine");
    if (lim) { for (const lab of [...lim.querySelectorAll("label")]) if ((o.limine || []).some((r) => r.test(texts(lab)))) await click(w, lab.querySelector("input")); await click(w, [...lim.querySelectorAll("button.btn")].pop()); log.push("LIMINE"); continue; }
    const pl = sc.querySelector(".plaidoirie");
    if (pl) {
      if (o.angle) { const a = [...pl.querySelectorAll(".chip")].find((c) => o.angle.test(texts(c))) || pl.querySelector(".chip"); if (a) await click(w, a); } // angle voulu absent : le premier
      else { const a = pl.querySelector(".chip"); if (a) await click(w, a); }
      for (const re of o.args || []) { const b = [...pl.querySelectorAll(".arg")].find((x) => re.test(texts(x)) && !x.disabled && !x.classList.contains("on")); if (b) await click(w, b); }
      // aucun des arguments voulus n'est jouable (le client tiré n'a pas d'emploi, pas de pièce en main) : le premier argument jouable
      for (const x of [...pl.querySelectorAll(".arg")]) { if (findBtn(doc, "Plaider")) break; if (!x.disabled && !x.classList.contains("on")) await click(w, x); }
      await click(w, findBtn(doc, "Plaider")); log.push("PLAIDOIRIE"); continue;
    }
    const hand = sc.querySelector(".hand");
    if (hand) { const c = o.card && [...hand.querySelectorAll(".hcard")].find((x) => o.card.test(texts(x))); await click(w, c || findBtn(doc, "Laisser passer", hand)); log.push("CARTE " + (c ? texts(c).slice(0, 30) : "—")); continue; }
    const del = sc.querySelector(".delibere");
    if (del) { log.push("DÉCISION: " + texts(del.querySelector(".decision")).slice(0, 600)); await click(w, findBtn(doc, "Continuer", del)); continue; }
    const done = sc.querySelector(".court-done");
    if (done) { await click(w, findBtn(doc, "Sortir de la salle")); log.push("SORTIE"); break; }
    const ch = sc.querySelector(".court-choices");
    if (ch) {
      const label = texts(ch);
      const btns = [...ch.querySelectorAll("button.choice")];
      if (/partie civile/.test(label) && btns.length) { await click(w, o.constitution === "no" ? btns[btns.length - 1] : btns[0]); log.push("CONSTITUTION"); continue; }
      if (/Questions/.test(label) || [...ch.querySelectorAll("button.btn")].some((b) => /plus de questions|Pas de question/.test(texts(b)))) {
        const q = btns.find((b) => (o.questions || []).some((r) => r.test(texts(b))));
        if (q) { await click(w, q); log.push("Q " + texts(q).slice(0, 40)); o.questions = (o.questions || []).filter((r) => !r.test(texts(q))); continue; }
        await click(w, [...ch.querySelectorAll("button.btn")].pop()); continue;
      }
      if (/dernier mot/i.test(label)) { const b = btns.find((x) => o.dernier && o.dernier.test(texts(x))) || btns[0]; await click(w, b); log.push("DERNIER " + texts(b).slice(0, 30)); continue; }
      const pref = btns.find((b) => (o.prefer || []).some((r) => r.test(texts(b))));
      if (pref) { await click(w, pref); log.push("CHOIX " + texts(pref).slice(0, 50)); continue; }
      if (btns.length) { await click(w, btns[0]); log.push("CHOIX " + texts(btns[0]).slice(0, 50)); continue; }
    }
  }
  return log;
}
module.exports = { runAudience };
