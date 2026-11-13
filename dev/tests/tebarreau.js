// Refonte, B1 bis : e-Barreau sur l'ordinateur du cabinet. node tests/tebarreau.js   « échecs: 0 » attendu.
// Annuaire CEP ; envoi complet (formulaire, message généré, pièce jointe, confirmation) ; avis de réception dans les
// messages reçus, ajout au dossier ; bonne structure = l'acte prend date ; adresse hors liste = irrecevable ; mauvaise
// juridiction, mauvais numéro, acte non joint = rien d'enregistré, réponse du service dans e-Barreau ; champs obligatoires ;
// brouillon ; parcours dans l'interface.
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { w, doc, CR, errors } = boot(); await sleep(100);
  const EB = CR.EB;
  ok(EB && CR.UI.EBarreau, "module e-Barreau absent");
  const s = CR.newGame({ prenom: "A", nom: "Bernard", mode: "carriere", seed: 4 }); s.settings.saisie = "assiste"; s.settings.coach = false; CR.store.s = s;
  s.min = 10 * 60; while (!CR.isOuvrable(s.day)) s.day++;
  const nouveau = (key) => { const cs = CR.GEN.open(s, "ci", {}); cs.status = "active"; cs.drafted[key] = [{ day: s.day, min: s.min, defects: [], filled: {}, picks: {}, depose: false }]; return cs; };
  const adr = (cs, code) => EB.annuaire("Tribunal judiciaire", EB.tjDe(s, cs).ville).find((x) => x.code === code).adresse;
  const base = (cs, a, o = {}) => Object.assign({ a: [a], objet: "Plainte", client: { statut: "Plaignant", nom: "Dupont", prenom: "Marie" }, proc: { ident: "N° de parquet", numero: EB.tjDe(s, cs).proc || "" }, pj: [{ caseId: cs.id, key: "plainte_simple", nom: "Plainte.pdf" }], confirme: true, caseId: cs.id }, o);
  const tous = () => JSON.stringify(EB.etat(s).recus);
  // annuaire
  const an = EB.annuaire("Tribunal judiciaire", "Paris");
  ok(an.some((x) => x.adresse === "cep.bo.tj-paris@justice.fr" && x.nom === "TJ-PARIS/CEP/BO"), "annuaire CEP mal formé", JSON.stringify(an[0]));
  ok(EB.tribunaux().some((x) => x.type === "Cour d'appel"), "pas de cour d'appel à l'annuaire");
  // 1. bon envoi : l'acte prend date, l'avis de réception arrive, on l'ajoute au dossier
  {
    const cs = nouveau("plainte_simple");
    const r = EB.envoyer(s, base(cs, adr(cs, "BO")));
    ok(r.ok, "le bon envoi échoue", r.erreur);
    const d = CR.drafted(cs, "plainte_simple");
    ok(d.depose && !d.irrecevable, "la plainte bien adressée ne prend pas date", JSON.stringify(d));
    const ar = EB.etat(s).recus.find((m) => m.ar && m.caseId === cs.id);
    ok(ar && /Avis de réception \d+ du message \d+/.test(ar.objet), "pas d'avis de réception", tous());
    EB.ajouterAR(s, ar); ok(ar.ajoute && (cs.vars.arCep || []).length === 1, "l'avis de réception ne s'ajoute pas au dossier");
  }
  // 2. adresse hors liste : irrecevable, sans avis de réception
  {
    const cs = nouveau("plainte_simple"); const n0 = EB.etat(s).recus.length;
    EB.envoyer(s, base(cs, "m.leroy@justice.fr"));
    ok(CR.drafted(cs, "plainte_simple").irrecevable === "cephors", "l'adresse hors liste n'est pas irrecevable");
    ok(EB.etat(s).recus.length === n0, "un avis de réception pour une adresse hors liste");
  }
  // 3. mauvaise structure, mauvaise juridiction, mauvais numéro, acte non joint : rien n'est enregistré
  const autres = [];
  {
    const cs = nouveau("plainte_simple"); EB.envoyer(s, base(cs, adr(cs, "JAP01"))); autres.push(cs);
    const cs2 = nouveau("plainte_simple"); const ville = EB.tjDe(s, cs2).ville === "Paris" ? "Créteil" : "Paris";
    EB.envoyer(s, base(cs2, EB.annuaire("Tribunal judiciaire", ville).find((x) => x.code === "BO").adresse)); autres.push(cs2);
    const cs3 = nouveau("plainte_simple"); if (EB.tjDe(s, cs3).proc) { EB.envoyer(s, base(cs3, adr(cs3, "BO"), { proc: { ident: "N° de parquet", numero: "9999/XX/0000" } })); autres.push(cs3); }
    const cs4 = nouveau("plainte_simple"); EB.envoyer(s, base(cs4, adr(cs4, "BO"), { pj: [], acteAttendu: { caseId: cs4.id, key: "plainte_simple" } })); autres.push(cs4);
    ok(autres.every((c) => !CR.drafted(c, "plainte_simple").depose), "un envoi mal fait prend date", autres.map((c) => JSON.stringify(CR.drafted(c, "plainte_simple"))).join(" | "));
    for (let k = 0; k < 2; k++) CR.endDay(s);
    const T = tous();
    ok(/ne relève pas de notre service/.test(T) && /pas une procédure de notre juridiction/.test(T) && /pas l'acte annoncé/.test(T), "les services ne répondent pas dans e-Barreau", T.slice(0, 400));
    ok(!EB.tjDe(s, cs3).proc || /numéro de procédure indiqué ne correspond/.test(T), "le mauvais numéro ne reçoit pas de réponse");
    // on peut renvoyer correctement
    const c0 = autres[0]; s.min = 10 * 60; while (!CR.isOuvrable(s.day)) s.day++;
    EB.envoyer(s, base(c0, adr(c0, "BO"))); ok(CR.drafted(c0, "plainte_simple").depose, "le message mal adressé ne peut pas être renvoyé");
  }
  // 4. champs obligatoires et confirmation
  {
    const cs = nouveau("plainte_simple");
    ok(!EB.envoyer(s, base(cs, adr(cs, "BO"), { confirme: false })).ok, "envoi sans confirmation");
    ok(!EB.envoyer(s, base(cs, adr(cs, "BO"), { client: { statut: "", nom: "", prenom: "" } })).ok, "envoi sans client");
    ok(!EB.envoyer(s, base(cs, adr(cs, "BO"), { a: [] })).ok, "envoi sans destinataire");
    ok(!CR.drafted(cs, "plainte_simple").depose, "un envoi refusé a pris date");
    EB.brouillon(s, base(cs, adr(cs, "BO"))); ok(EB.etat(s).brouillons.length >= 1, "pas de brouillon");
  }
  // 5. après 17 heures : l'acte prend date le premier jour ouvrable suivant
  {
    const cs = nouveau("plainte_simple"); s.min = 17 * 60 + 25; const j0 = s.day;
    EB.envoyer(s, base(cs, adr(cs, "BO")));
    ok(CR.drafted(cs, "plainte_simple").deposeDay === CR.addOuvrables(j0, 1), "l'envoi après 17 heures prend date le jour même");
    s.min = 10 * 60;
  }
  // 6. demande de mise en liberté par e-Barreau : irrecevable (D. 593), quelle que soit la structure
  {
    const cs = nouveau("dml"); EB.envoyer(s, base(cs, adr(cs, "JLD"), { objet: "Autre demande", pj: [{ caseId: cs.id, key: "dml", nom: "DML.pdf" }] }));
    ok(CR.drafted(cs, "dml").irrecevable === "cep", "la demande de mise en liberté par e-Barreau n'est pas irrecevable");
  }
  // 7. l'interface : tableau de bord, nouveau message, annuaire, formulaire, envoi
  {
    const cs = nouveau("plainte_simple"); while (!CR.isOuvrable(s.day)) s.day++; s.min = 10 * 60;
    const host = doc.createElement("div"); doc.body.appendChild(host);
    const root = w.ReactDOM.createRoot(host); root.render(w.React.createElement(CR.UI.EBarreau, { s })); await sleep(80);
    ok(/Nouveaux messages reçus/.test(texts(host)) && /Météo des services/.test(texts(host)), "tableau de bord absent", texts(host).slice(0, 200));
    await click(w, findBtn(host, /Nouveau message pénal/)); await sleep(40);
    await click(w, [...host.querySelectorAll(".eb-annu-b")][0]); await sleep(30);
    const sel = host.querySelectorAll(".eb-annu select");
    const setSel = async (el, v) => { const set = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, "value").set; set.call(el, v); el.dispatchEvent(new w.Event("change", { bubbles: true })); await sleep(30); };
    await setSel(sel[0], "Tribunal judiciaire"); await setSel(host.querySelectorAll(".eb-annu select")[1], EB.tjDe(s, cs).ville);
    const bo = [...host.querySelectorAll(".eb-annu-l")].find((b) => /\/CEP\/BO$/.test(texts(b).split(" ")[0]) || /CEP\/BO/.test(texts(b)));
    ok(bo, "structure BO absente de l'annuaire affiché", texts(host).slice(0, 300));
    if (bo) { await click(w, bo); await click(w, findBtn(host, /^Ajouter$/)); await sleep(30); }
    const selects = host.querySelectorAll(".eb-compose select");
    await setSel(selects[0], cs.id); await setSel(host.querySelectorAll(".eb-compose select")[1], "Plainte"); await setSel(host.querySelectorAll(".eb-compose select")[2], "Plaignant");
    const inputs = [...host.querySelectorAll(".eb-compose .eb-f input")];
    const saisir = async (el, v) => { const set = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set; set.call(el, v); el.dispatchEvent(new w.Event("input", { bubbles: true })); await sleep(20); };
    await saisir(inputs[0], "Dupont"); await saisir(host.querySelectorAll(".eb-compose .eb-f input")[1], "Marie");
    await click(w, findBtn(host, /^Suivant$/)); await sleep(40);
    ok(/Message généré automatiquement/.test(texts(host)) && /Plaignant - DUPONT Marie/.test(texts(host)), "le message n'est pas généré", texts(host).slice(0, 300));
    const pj = [...host.querySelectorAll(".eb-pj-l input")].find((x) => texts(x.parentElement).includes(CR.clientName(cs)));
    ok(pj, "l'acte n'est pas proposé en pièce jointe");
    if (pj) await click(w, pj);
    await click(w, host.querySelector(".eb-conf input")); await sleep(20);
    await click(w, findBtn(host, /^Envoyer$/)); await sleep(40);
    ok(/Message envoyé/.test(texts(host)), "l'envoi par l'interface échoue", texts(host).slice(0, 300));
    ok(CR.drafted(cs, "plainte_simple").depose, "l'acte envoyé par l'interface ne prend pas date");
    root.unmount();
  }
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
