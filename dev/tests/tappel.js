// Refonte, lot 3 : les entretiens hors garde à vue (cabinet, permanence, victime) au compositeur, en mode libre.
// node tests/tappel.js   « échecs: 0 » attendu.
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d ? " — " + String(d).slice(0, 300) : "")); } };
  const { w, doc, CR, errors } = boot();
  await sleep(100);
  await click(w, findBtn(doc, "Nouvelle partie")); await sleep(80); await click(w, findBtn(doc, /^Carrière/)); await sleep(200);
  const s = CR.store.s; s.settings.coach = false; s.settings.saisie = "assiste"; CR.PAROLE.ACCEL = 60; CR.store.bump(); await sleep(60);
  const attendre = async () => { for (let k = 0; k < 400 && (doc.querySelector(".oral .oral-caret") || !findBtn(doc, /^Terminer l'entretien|^Poser la question/)); k++) await sleep(20); await sleep(40); };
  const composer = async (sujet, angle) => {
    const b = (re) => [...doc.querySelectorAll(".compo .compo-b")].find((x) => re.test(texts(x)) && !x.disabled);
    const bs = b(sujet); if (!bs) return false; await click(w, bs); await click(w, b(angle));
    let go = null; for (let k = 0; k < 150 && !(go = findBtn(doc, /^Poser la question/)); k++) await sleep(20);
    if (!go) return false; await click(w, go); await attendre(); return true;
  };
  for (const [kind, sujetRe] of [["copj", /^Les faits/], ["pc", /^Les faits/]]) {
    const cs = CR.GEN.open(s, kind, {});
    const p = s.generated.find((x) => x.id === cs.id);
    CR.store.bump(); await sleep(60);
    CR.UI._setScene({ type: "call", caseId: cs.id, call: "intake" }); await sleep(250);
    const lib = doc.querySelector(".call-libre");
    ok(!!lib, `${kind} : l'entretien n'est pas au compositeur`, texts(doc.querySelector(".call-scene") || doc.body).slice(0, 200));
    if (!lib) continue;
    ok(!doc.querySelector(".call-scene .patience"), `${kind} : la jauge de patience s'affiche`);
    ok(!doc.querySelector(".call-main .questions .q-btn"), `${kind} : la liste de questions subsiste`);
    await attendre();
    ok(await composer(sujetRe, /Ce qui s'est passé/), `${kind} : impossible de poser une question`);
    for (const x of [...doc.querySelectorAll(".oral .who-client .oral-t")].filter((x) => !x.disabled)) await click(w, x);
    ok(cs.notes.length > 0, `${kind} : rien n'a pu être noté`);
    const fv = kind === "pc" ? "V_faits" : "G_version";
    ok(CR.hasFact(cs, fv) || cs.notes.some((n) => n.fact), `${kind} : la version notée ne donne aucun fait`, cs.notes.map((n) => n.fact).join(","));
    await composer(/^Le casier|^La procédure|^Le préjudice/, /Ce qui s'est passé/);
    await click(w, findBtn(doc, /^Terminer l'entretien/)); await sleep(80);
    const fin = findBtn(doc, /^Terminer$/, doc.querySelector(".closing"));
    ok(!!fin, `${kind} : pas de fin d'entretien`); if (fin) await click(w, fin);
    await sleep(80);
    ok(cs.status === "prospect" || cs.status === "active", `${kind} : le premier entretien n'est pas enregistré`, cs.status);
    ok((cs.vars.asked || []).length >= 1, `${kind} : les sujets abordés ne sont pas gardés`);
    console.log(`${kind} — ${CR.caseTitle(s, cs)} · notes ${cs.notes.length} · sujets ${JSON.stringify(cs.vars.asked)} · statut ${cs.status}`);
  }
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
