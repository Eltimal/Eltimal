// Révision CRFPA : mini cas pratique tiré des fiches du classeur (questions, bonnes réponses, résultat gardé, bilan).
const { sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util");
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
(async () => {
  const env = await U.career("a02_sac", 7); const { w, doc, CR, s, errors } = env;
  s.pending = s.pending.filter((e) => e.type !== "lead"); CR.GEN2.DIR.off = true;
  let nq = 0, sans = 0;
  for (const k of ["copj", "gav", "pc", "ci", "al", "op", "copj", "pc"]) {
    const c = CR.GEN.open(s, k, { min: s.min }); c.status = "open";
    c.outcome = { type: k === "pc" ? "indemnise" : "condamnation", day: s.day, detail: "" }; CR.makeFiche(s, c);
    const f = s.classeur.find((x) => x.caseId === c.id); if (!f) { sans++; continue; }
    const qs = CR.casPratique(s, f); nq += qs.length;
    for (const q of qs) { ok(q.options.length >= 3 && q.bonne >= 0 && q.options[q.bonne], `${c.id} : une question bien formée`); ok(new Set(q.options).size === q.options.length, `${c.id} : pas deux propositions identiques`); ok(q.enonce && q.corrige != null, `${c.id} : énoncé et corrigé`); }
    ok(JSON.stringify(CR.casPratique(s, f)) === JSON.stringify(qs), `${c.id} : mêmes questions à la relecture`);
  }
  ok(s.classeur.length >= 6, "fiches créées : " + s.classeur.length); ok(nq >= s.classeur.length * 2, "au moins deux questions par fiche en moyenne : " + nq);
  // dans l'interface : classeur, première fiche, répondre à tout
  CR.store.bump(); await sleep(50);
  await click(w, P.rail(doc, "Classeur")); await click(w, doc.querySelector(".doc-row")); await sleep(60);
  const f0 = s.classeur[0], q0 = CR.casPratique(s, f0);
  ok(!!doc.querySelector(".cas-pratique"), "le cas pratique s'affiche dans la fiche");
  for (let i = 0; i < q0.length; i++) { const opts = [...doc.querySelectorAll(".cas-q:last-of-type .cas-opt")].filter((b) => !b.disabled); ok(opts.length === q0[i].options.length, "propositions cliquables"); await click(w, opts[i === 0 ? (q0[i].bonne + 1) % opts.length : q0[i].bonne]); }
  ok(f0.cas && f0.cas.n === q0.length && f0.cas.ok === q0.length - 1, "résultat gardé dans la fiche : " + JSON.stringify(f0.cas && { n: f0.cas.n, ok: f0.cas.ok }));
  ok(doc.querySelectorAll(".cas-corr").length === q0.length && doc.querySelectorAll(".cas-opt.fausse").length === 1, "corrigés affichés, une erreur marquée");
  const b = CR.casBilan(s); ok(b.faits === 1 && b.n === q0.length, "bilan du classeur");
  const s2 = JSON.parse(JSON.stringify(s)); ok(s2.classeur[0].cas.ok === f0.cas.ok, "le résultat survit à la sauvegarde");
  console.log("fiches", s.classeur.length, "questions", nq, "sans fiche", sans, "| exemple :", q0[0] && q0[0].titre, "—", q0[0] && q0[0].enonce.slice(0, 110));
  console.log("échecs:", fails); console.log("errors:", errors.length ? errors.slice(0, 4).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
