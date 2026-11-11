const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play");
async function career(target, seed = 7) {
  const env = boot();
  const { w, CR, doc } = env;
  await sleep(150);
  CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed });
  const s = CR.store.s; s.settings.textSpeed = 60; s.settings.coach = false; s.settings.saisie = "liste"; s.cash = 200000;
  // Vivier : on retire toutes les arrivées tirées au sort et on fait venir l'affaire visée, à sa date
  // tirée pour cette graine (conditions levées, canal d'origine : appel ou demande de rendez-vous).
  s.pending = s.pending.filter((e) => e.type !== "lead");
  if (CR.CASES[target] && CR.vivierForce) CR.vivierForce(s, target);
  CR.store.bump(); await sleep(50);
  return Object.assign(env, { s });
}
// Jours à attendre : jusqu'à l'arrivée programmée (plus une marge), au moins maxDays
function horizon(s, id, maxDays) {
  const e = s.pending.filter((x) => x.type === "lead" && (!id || x.key === id)).sort((a, b) => a.day - b.day)[0];
  const need = e ? e.day - s.day + 10 : 40;
  return Math.max(maxDays || 0, need);
}
async function untilRing(env, maxDays) {
  const { CR, s } = env;
  maxDays = horizon(s, null, maxDays);
  for (let d = 0; d < maxDays; d++) {
    while (!s.ring && s.min < 19 * 60) CR.spend(s, 10, "admin");
    if (s.ring) break;
    CR.endDay(s);
  }
  CR.store.bump(); await sleep(40);
}
async function untilLead(env, id, maxDays) {
  const { CR, s } = env;
  maxDays = horizon(s, id, maxDays);
  for (let d = 0; d < maxDays && !s.cases[id]; d++) { while (!s.cases[id] && s.min < 19 * 60) CR.spend(s, 10, "admin"); if (!s.cases[id]) CR.endDay(s); }
  CR.store.bump(); await sleep(40);
}
function noteDocs(CR, s, cs) { for (const d of cs.docs) { const r = CR.renderDoc(s, cs, d); for (const p of r.paras || []) for (const sg of p) if (typeof sg === "object" && sg.f) CR.addNote(s, cs, { text: sg.t, fact: sg.f, src: "doc" }); } }
function readAll(CR, s) { for (const m of s.inbox.filter((x) => !x.read)) CR.readMail(s, m.id); }
async function engageFee(env, cs, title) {
  const { w, doc, CR, s } = env;
  await P.openCase(w, doc, title);
  await P.runTask(w, doc, /conflits/); await click(w, findBtn(doc, "Terminé"));
  await P.runTask(w, doc, /honoraires/);
  await click(w, findBtn(doc, /^Proposer$/));
  for (let i = 0; i < 5 && !cs.neg.done; i++) { const off = cs.neg.lastCounter || { type: "forfait", amount: Math.round(cs.neg.fairForfait * 0.8 / 50) * 50 }; CR.negPropose(s, cs, off); }
  CR.store.bump(); await sleep(40);
  const f = findBtn(doc, "Fermer"); if (f) await click(w, f);
  await P.openCase(w, doc, title);
  if (cs.fee) { await P.runTask(w, doc, /convention/); await P.fillDraft(w, doc, CR, cs, { key: "convention" }); }
}
async function goCourt(env) {
  const { w, doc } = env;
  await click(w, P.rail(doc, "Bureau"));
  const y = findBtn(doc, "Y aller"); if (!y) return false;
  await click(w, y);
  const tr = [...doc.querySelectorAll(".modal .decide-opt")][0]; if (tr) await click(w, tr);
  await sleep(60);
  return true;
}
module.exports = { career, horizon, untilRing, untilLead, noteDocs, readAll, engageFee, goCourt };
