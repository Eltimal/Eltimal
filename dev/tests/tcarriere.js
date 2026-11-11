// Carrière 1.0 : grades et objectifs, spécialité (honoraires, flux de dossiers), collaboration libérale, association.
const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play");
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
(async () => {
  const { w, CR, doc, errors } = boot(); await sleep(400);
  const CAR = CR.CAR;
  const neuf = (seed) => CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed });
  // --- interface
  await click(w, findBtn(doc, "Nouvelle partie")); await sleep(120); await click(w, findBtn(doc, /collaborateur dans un cabinet/)); await sleep(200);
  const g = CR.store.s;
  ok(g.car && g.car.collab && /Collaborateur libéral/.test(texts(doc.querySelector(".hud-name"))), "nouvelle partie en collaboration, grade dans l'en-tête");
  await click(w, P.rail(doc, "Cabinet")); await click(w, [...doc.querySelectorAll(".tab")].find((x) => /Carrière/.test(texts(x))));
  ok(!!doc.querySelector(".carriere") && doc.querySelectorAll(".car-echelle li").length === 5 && doc.querySelectorAll(".car-obj li").length === 1, "onglet Carrière : échelle et objectifs");
  g.stats.dossiers = 3; CAR.verifier(g); CR.store.bump(); await sleep(60);
  await click(w, [...doc.querySelectorAll(".car-spec")].find((x) => /Victimes/.test(texts(x))));
  ok(g.car.spec === "victimes" && doc.querySelector(".car-spec.on") && /Victimes/.test(texts(doc.querySelector(".car-spec.on"))), "spécialité choisie dans l'interface");
  await click(w, findBtn(doc, "S'installer à son compte")); await click(w, findBtn(doc, /^Confirmer$/));
  ok(!g.car.collab && /Avocat installé/.test(texts(doc.querySelector(".hud-name"))), "installation depuis l'interface");
  // --- une partie ordinaire ne change pas tant qu'aucun grade n'est franchi
  let s = neuf(5);
  ok(CAR.titre(s) === "Avocat de permanence" && CAR.primeGrade(s) === 1 && CAR.apport(s) === 1, "départ : premier grade, aucun effet");
  const def = { id: "x", domaine: "tc", honoraires: { forfait: 1500 } };
  const f0 = CR.fairForfait(s, def), t0 = CR.fairTaux(s);
  // --- grades
  s.stats.dossiers = 3; CAR.verifier(s);
  ok(s.car.grade === 1 && s.inbox.some((m) => /Avocat installé/.test(m.subj)), "trois dossiers : avocat installé, un courriel l'annonce");
  s.stats.dossiers = 10; CAR.verifier(s); ok(s.car.grade === 1, "dix dossiers ne suffisent pas sans réputation");
  s.reps = { clients: 32, confreres: 30, siege: 32, parquet: 30 }; s.car.favorables = 3; CAR.verifier(s);
  ok(s.car.grade === 2 && CAR.primeGrade(s) === 1.08, "pénaliste confirmé : honoraires relevés");
  ok(CAR.manque(s, 3).some((x) => !x.ok) && CAR.manque(s, 3).length === 3, "objectifs du grade suivant listés");
  // --- spécialité
  ok(CAR.choisirSpec(s, "victimes") && s.car.spec === "victimes", "spécialité choisie");
  s.reps = { clients: 15, confreres: 15, siege: 25, parquet: 25 }; s.car.grade = 1;
  ok(CR.fairForfait(s, { id: "y", domaine: "pc", camp: "pc", honoraires: { forfait: 1500 } }) > f0 && CR.fairForfait(s, def) === f0 && CR.fairTaux(s) === t0, "honoraires plus élevés dans la spécialité seulement");
  const tirer = (st) => { const n = { pc: 0, tot: 400 }; for (let i = 0; i < n.tot; i++) if (CR.GEN2.leadKind(st) === "pc") n.pc++; return n.pc / n.tot; };
  const a = neuf(9), b = neuf(9); b.stats.dossiers = 3; CAR.verifier(b); CAR.choisirSpec(b, "victimes");
  if (CR.GEN2.DIR) CR.GEN2.DIR.off = true;
  const pa = tirer(a), pb = tirer(b);
  ok(pb > pa * 1.3, `victimes : davantage de parties civiles (${pa.toFixed(2)} → ${pb.toFixed(2)})`);
  ok(CR.GEN2.LEADS.pc === 2.4, "les poids du générateur sont intacts après tirage");
  const c0 = s.reps.confreres; CAR.choisirSpec(s, "criminel"); ok(s.reps.confreres === c0 - 3, "changer de spécialité coûte auprès des confrères");
  ok(CAR.dansSpec(s, { id: "z", domaine: "criminel" }) && !CAR.dansSpec(s, { id: "z", domaine: "tc" }), "le dossier relève ou non de la spécialité");
  const u = neuf(4); u.stats.dossiers = 3; CAR.verifier(u); CAR.choisirSpec(u, "urgence");
  const avant = u.pending.length; CR.signDuty(u, u.day + 3, "gav_jour"); const v = neuf(4); CR.signDuty(v, v.day + 3, "gav_jour");
  ok(u.pending.length - avant === v.pending.length - avant + 1, "urgence : un appel de permanence en plus");
  // --- association
  s.stats.dossiers = 22; s.reps = { clients: 45, confreres: 45, siege: 42, parquet: 42 }; s.car.favorables = 8; s.car.grade = 2; CAR.verifier(s);
  ok(s.car.grade === 3 && s.car.offre && s.car.offre.apport === 8000, "quatrième grade : proposition d'association");
  s.cash = 3000; ok(!CAR.repondre(s, true) && !s.car.assoc, "pas d'association sans l'apport");
  s.cash = 12000; const loyer = s.fixed.loyer, lim = s.decouvert.limit;
  ok(CAR.repondre(s, true) && s.car.assoc && s.cash === 4000 && s.fixed.loyer < loyer && s.decouvert.limit === lim + 5000 && CAR.apport(s) === 1.3 && /&/.test(s.player.cabinet), "association : apport versé, charges partagées, dossiers apportés, cabinet renommé : " + s.player.cabinet);
  ok(CAR.titre(s) === "Associé", "titre : associé");
  const r = neuf(6); r.stats.dossiers = 22; r.reps = { clients: 45, confreres: 45, siege: 42, parquet: 42 }; CAR.etat(r).favorables = 8; CAR.verifier(r);
  CAR.repondre(r, false); ok(!r.car.offre && !r.car.assoc, "offre déclinée"); r.day += 95; CAR.verifier(r); ok(!!r.car.offre, "elle revient trois mois plus tard");
  // --- collaboration
  const k = CAR.demarrerCollab(neuf(7));
  ok(CAR.titre(k) === "Collaborateur libéral" && k.pret.balance === 0 && k.fixed.loyer === 0 && k.cash === 2500, "collaborateur : ni prêt ni loyer");
  const cash = k.cash; CR.monthly(k, 30);
  ok(k.ledger.some((l) => /Rétrocession/.test(l.label) && l.amount === 3700) && k.cash > cash, "la rétrocession de 3 700 € couvre les charges du mois");
  k.energy = 90; const e0 = (() => { const z = neuf(7); z.energy = 90; CR.endDay(z); return z.energy; })(); CR.endDay(k);
  ok(k.energy === Math.max(25, e0 - 20), `les dossiers du cabinet coûtent 20 points d'énergie (${e0} → ${k.energy})`);
  ok(!CAR.sInstaller(k), "pas d'installation avant le deuxième grade"); k.stats.dossiers = 3; CAR.verifier(k);
  ok(CAR.titre(k) === "Collaborateur confirmé" && CAR.sInstaller(k) && !k.car.collab && k.pret.balance === 15000 && k.fixed.loyer === 850 && CAR.retro(k) === 0, "installation : prêt, loyer, plus de rétrocession");
  k.day = 400; k.car.collab = { cabinet: "X", patron: "Me Y", depuis: 0 }; ok(CAR.retro(k) === 4100, "deuxième année : 4 100 €");
  // --- sauvegarde
  const s2 = CR.deserialize ? CR.deserialize(CR.serialize ? CR.serialize(s) : JSON.stringify(s)) : JSON.parse(JSON.stringify(s));
  ok(s2.car && s2.car.grade === 3 && s2.car.assoc && s2.car.spec === "criminel", "la carrière survit à la sauvegarde");
  const vieux = neuf(8); delete vieux.car; vieux.stats.relaxes = 2; ok(CAR.etat(vieux).favorables === 2 && CAR.titre(vieux) === "Avocat de permanence", "ancienne sauvegarde : carrière reconstituée");
  console.log("échecs:", fails); console.log("errors:", errors.length ? errors.slice(0, 4).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
