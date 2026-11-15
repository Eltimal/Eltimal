// Sortie 1.0 — anomalies majeures M6 à M12 de l'audit du 14 novembre 2026, chacune reproduite puis vérifiée.
// M6 interdiction d'exercer sans effet · M7 courriels sans objet · M8 « Avancer » saute une audience · M9 collaborateur payé
// sans travail possible · M10 honoraire de résultat gratuit · M11 CARPA fictive · M12 horloge figée à 23 h 30.
const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d !== undefined ? " — " + String(typeof d === "string" ? d : JSON.stringify(d)).slice(0, 300) : "")); } };
  const { w, CR, doc, errors } = boot(); await sleep(200);
  const neuve = (seed, sansLeads) => { const s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed }); s.settings.coach = false; if (sansLeads) s.pending = s.pending.filter((e) => e.type !== "lead"); return s; };

  // ---------- M7 : aucun courriel sans objet (bienvenue du cabinet, grades, association, arrêts)
  { const s = neuve(4); CR.CAR.demarrerCollab(s); ok(s.inbox.every((m) => typeof m.subject === "string" && m.subject.length > 2), "M7 : un courriel n'a pas d'objet", s.inbox.filter((m) => !m.subject).map((m) => m.from));
    ok(s.inbox.some((m) => m.subject === "Bienvenue au cabinet"), "M7 : le courriel de bienvenue du cabinet n'a pas son objet");
    const n0 = errors.length; const m = CR.mail(s, { from: "x", subj: "ancien champ" }); ok(m.subject === "ancien champ" && errors.length === n0 + 1, "M7 : une clé d'objet mal écrite n'est ni rattrapée ni signalée"); errors.length = n0;
    const s2 = neuve(9, true); for (let i = 0; i < 500 && !s2.gameOver; i++) { s2.cash = 30000; CR.endDay(s2); } ok(s2.inbox.every((x) => typeof x.subject === "string" && x.subject && x.subject !== "undefined"), "M7 : courriel sans objet en 500 jours"); }

  // ---------- M6 : interdiction temporaire d'exercer
  { const s = neuve(4); CR.GEN.open(s, "copj", {}); const d1 = CR.nextBusinessDay(s.day); CR.signDuty(s, d1, "gav_jour"); CR.signDuty(s, d1 + 200, "gav_jour");
    CR.suspend(s);
    const fin = s.flags.suspendedUntil; ok(fin === s.day + 182 && CR.suspendu(s), "M6 : l'interdiction n'est pas posée");
    ok(s.order.every((id) => s.cases[id].status === "closed"), "M6 : un dossier reste ouvert", s.order.map((id) => s.cases[id].status));
    ok(!s.duty.some((d) => d.day < fin) && s.duty.some((d) => d.day >= fin), "M6 : les permanences de la période ne sont pas rayées", s.duty);
    ok(CR.signDuty(s, s.day + 5, "gav_jour") === false && CR.signDuty(s, fin + 3, "gav_nuit") === true, "M6 : inscription aux permanences pendant l'interdiction");
    const n0 = s.order.length; let sonne = 0;
    for (let i = 0; i < 181; i++) { s.cash = 30000; CR.endDay(s); while (s.min < 18 * 60) { CR.spend(s, 30, "admin"); if (s.ring) { sonne++; s.ring = null; } } }
    ok(s.order.length === n0 && sonne === 0 && !s.voicemails.some((v) => v.kind === "lead"), "M6 : des dossiers arrivent pendant l'interdiction", { arrives: s.order.length - n0, sonne });
    CR.endDay(s); CR.endDay(s);
    ok(!CR.suspendu(s) && s.inbox.some((m) => /Fin de votre interdiction/.test(m.subject)), "M6 : la fin de l'interdiction n'est pas notifiée");
    for (let i = 0; i < 60; i++) { s.cash = 30000; CR.endDay(s); }
    ok(s.order.length > n0, "M6 : aucun client ne revient après l'interdiction");
    // affichage : bandeau au bureau
    const s3 = neuve(5, true); CR.suspend(s3); CR.store.s = s3; CR.store.bump(); await sleep(120);
    ok(/Interdiction temporaire d'exercer/.test(texts(doc.querySelector(".panel.today") || doc.body)), "M6 : le bureau ne dit rien de l'interdiction"); }

  // ---------- M8 : « Avancer » un jour d'audience demande confirmation
  { const s = neuve(4, true); const cs = CR.GEN.open(s, "copj", {}); cs.status = "active";
    const h = CR.scheduleHearing(s, cs, { day: s.day, min: 14 * 60, title: "Audience test", juridiction: "tc" });
    ok(CR.resteAujourdhui(s).length === 1 && /Audience test/.test(CR.resteAujourdhui(s)[0]), "M8 : l'audience du jour n'est pas relevée", CR.resteAujourdhui(s));
    CR.store.s = s; CR.store.bump(); await sleep(120);
    await click(w, P.rail(doc, "Bureau")); await click(w, findBtn(doc, /^Avancer$/)); await sleep(80);
    ok(s.day === 0 && /Avancer maintenant/.test(texts(doc.querySelector(".modal") || doc.body)) && /Audience test/.test(texts(doc.querySelector(".modal") || doc.body)), "M8 : « Avancer » saute l'audience sans prévenir", { day: s.day });
    await click(w, findBtn(doc, /^Rester$/)); ok(s.day === 0 && !CR.hearingById(cs, h.id).missed, "M8 : « Rester » ne garde pas la journée");
    await click(w, findBtn(doc, /^Avancer$/)); await click(w, findBtn(doc, /Avancer quand même/)); await sleep(80); ok(s.day > 0, "M8 : la confirmation n'avance pas");
    const s2 = neuve(6, true); CR.store.s = s2; CR.store.bump(); await sleep(100); await click(w, P.rail(doc, "Bureau")); await click(w, findBtn(doc, /^Avancer$/)); await sleep(80); ok(s2.day > 0, "M8 : sans rien au programme, « Avancer » demande une confirmation inutile"); }

  // ---------- M9 : collaborateur — pas de travail, pas de rétrocession ; arrêts répétés : rupture
  { const s = neuve(5, true); CR.CAR.demarrerCollab(s); s.pending = s.pending.filter((e) => e.type !== "lead");
    const versees = () => s.ledger.filter((l) => /Rétrocession/.test(l.label));
    while (CR.ymd(s.day).d !== 1 || s.day === 0) CR.endDay(s);
    const pleine = versees()[0].amount; ok(pleine === CR.CAR.RETRO[0], "M9 : la rétrocession d'un mois travaillé n'est pas entière", pleine);
    // un mois entier d'arrêt : rien
    const d0 = s.day; while (s.day < d0 + 1 || CR.ymd(s.day).d !== 1) { s.burnout = { until: s.day + 5 }; s.cash = Math.max(s.cash, 5000); CR.endDay(s); }
    const arret = versees()[0]; ok(arret.amount < pleine * 0.15, "M9 : rétrocession versée pour un mois d'arrêt", arret);
    for (let k = 0; k < 4 && s.car.collab; k++) { const d = s.day; while (s.day < d + 1 || CR.ymd(s.day).d !== 1) { s.burnout = { until: s.day + 5 }; s.cash = Math.max(s.cash, 5000); CR.endDay(s); } }
    ok(!s.car.collab && s.inbox.some((m) => /Fin de votre contrat/.test(m.subject)) && s.fixed.loyer > 0, "M9 : des mois d'arrêt ne mettent pas fin à la collaboration", s.car);
    const n = versees().length; s.burnout = null; const d = s.day; while (s.day < d + 1 || CR.ymd(s.day).d !== 1) { s.cash = 5000; CR.endDay(s); } ok(versees().length === n, "M9 : rétrocession versée après la rupture");
    const s2 = neuve(6, true); CR.CAR.demarrerCollab(s2); CR.suspend(s2); ok(!s2.car.collab, "M9 : l'interdiction d'exercer ne met pas fin à la collaboration"); }

  // ---------- M10 : l'honoraire de résultat compte dans le prix
  { let refus = 0, n = 0, accSans = 0;
    for (let seed = 1; seed <= 40; seed++) for (const comp of [0, 5000]) {
      const g = neuve(seed, true); let c; try { c = CR.GEN.open(g, "copj", {}); } catch (e) { continue; }
      const def = CR.caseDef(c); if (!def.profile) continue;
      const n0 = CR.negStart(g, c); const offre = () => ({ type: "forfait", amount: Math.floor(n0.resForfait / 50) * 50, plan: true, complement: comp, resultat: "relaxe" });
      let r = CR.negPropose(g, c, offre()); if (r.wantsExplain) { CR.negPropose(g, c, null, "explain"); r = CR.negPropose(g, c, offre()); }
      for (let k = 0; k < 5 && r.verdict === "counter"; k++) r = CR.negPropose(g, c, offre());
      if (comp) { n++; if (r.verdict !== "accept") refus++; } else if (r.verdict === "accept") accSans++;
    }
    ok(n >= 30 && accSans >= n * 0.8, "M10 : le forfait au prix de réserve n'est plus accepté sans honoraire de résultat", { n, accSans });
    ok(refus >= n * 0.5, "M10 : 5 000 € d'honoraire de résultat ajoutés au prix de réserve sont encore acceptés", { n, refus });
    // en baissant le forfait d'autant, l'accord redevient possible : l'honoraire de résultat se négocie, il ne s'ajoute pas
    const g = neuve(3, true); const c = CR.GEN.open(g, "copj", {}); const n0 = CR.negStart(g, c); const m = Math.max(300, Math.floor((n0.resForfait * 0.9 - 2000 * CR.FEE_ESPERE) / 50) * 50);
    let r = CR.negPropose(g, c, { type: "forfait", amount: m, plan: true, complement: 2000, resultat: "relaxe" }); if (r.wantsExplain) { CR.negPropose(g, c, null, "explain"); r = CR.negPropose(g, c, { type: "forfait", amount: m, plan: true, complement: 2000 }); }
    for (let k = 0; k < 5 && r.verdict === "counter"; k++) r = CR.negPropose(g, c, { type: "forfait", amount: Math.floor(m * 0.88 / 50) * 50, plan: true, complement: 2000 });
    ok(r.verdict === "accept", "M10 : un forfait réduit avec honoraire de résultat n'est jamais accepté", r); }

  // ---------- M11 : la CARPA sert enfin — premier versement à la victime
  { const trouver = (seedMin) => { for (let seed = seedMin; seed < seedMin + 60; seed++) { const s = neuve(seed, true); for (let k = 0; k < 6; k++) { const cs = CR.GEN.open(s, "copj", {}); const t = s.generated.find((x) => x.id === cs.id).t; cs.status = "active"; cs.engaged = s.day; CR.runHook(s, cs, "engaged", {}); const T = []; try { CR.caseDef(cs).tasks(CR.api(s, cs), (x) => T.push(x)); } catch (e) { continue; } const it = T.find((x) => x.id === "perso_indemn"); if (it && cs.proc.audience && cs.proc.audience.day > s.day + 12) return { s, cs, it, t }; } } return null; };
    const a = trouver(1); ok(!!a, "M11 : aucune affaire avec victime et audience lointaine (test à revoir)");
    if (a) { const { s, cs } = a; const api = CR.api(s, cs);
      const spec = CR.runHook(s, cs, "_indemnChoix", {}); ok(spec.options.length === 3 && /CARPA/.test(spec.options[0].t), "M11 : le choix du chemin des fonds n'est pas offert", spec.options.map((o) => o.t));
      const m = CR.PEN.indemnMontant(api), cash0 = s.cash;
      CR.runHook(s, cs, "_indemnCarpa", {});
      ok(s.carpa === m && s.carpaBy[cs.id] === m && s.cash === cash0 && !CR.hasFact(cs, "G_indemn"), "M11 : le dépôt à la CARPA n'est pas enregistré, ou le reçu est déjà au dossier", { carpa: s.carpa, m });
      const T = []; CR.caseDef(cs).tasks(api, (x) => T.push(x)); const it = T.find((x) => x.id === "perso_indemn"); ok(it && it.enabled === false && /en cours/.test(it.label), "M11 : la tâche ne dit pas que le versement est en cours", it && it.label);
      const ech = cs.vars.indemn.echeance; while (s.day < ech) CR.endDay(s); while (s.min < 11 * 60) CR.spend(s, 30, "admin");
      ok(s.carpa === 0 && CR.hasFact(cs, "G_indemn") && cs.vars.indemn.verse === ech && !s.flags.detourne, "M11 : le versement par la CARPA n'aboutit pas", { carpa: s.carpa, v: cs.vars.indemn });
      ok(s.ledger.filter((l) => l.acct === "carpa" && l.caseId === cs.id).length === 2 && s.ledger.every((l) => !l.improper), "M11 : les écritures CARPA manquent"); }
    const b = trouver(70);
    if (b) { const { s, cs } = b; const api = CR.api(s, cs), m = CR.PEN.indemnMontant(api), cash0 = s.cash;
      CR.runHook(s, cs, "_indemnDirect", {});
      ok(CR.hasFact(cs, "G_indemn") && s.cash === cash0 && s.carpa === 0 && s.flags.detourne === m, "M11 : le versement par le compte du cabinet n'est pas tracé comme un maniement hors CARPA", { detourne: s.flags.detourne, m });
      ok(cs.erreurs.some((e) => e.id === "hors_carpa") && s.pending.some((e) => e.key === "carpaControle"), "M11 : ni erreur au débrief ni contrôle programmé");
      let plaintes = 0, essais = 0; for (let seed = 200; seed < 260; seed++) { const g = neuve(seed, true); const c = CR.GEN.open(g, "copj", {}); CR.detournement(g, c.id, 500, { sev: 5 }); for (let i = 0; i < 80; i++) { g.cash = 20000; CR.endDay(g); } essais++; if (g.disc.open.concat(g.disc.record).some((x) => x.kind === "carpa")) plaintes++; }
      ok(plaintes > essais * 0.3 && plaintes < essais * 0.7, "M11 : le contrôle de la CARPA ne relève pas le maniement environ une fois sur deux", { plaintes, essais }); }
    // trop tard : dépôt à trois jours de l'audience → fonds restitués, pas de reçu
    const c2 = trouver(140); if (c2) { const { s, cs } = c2; while (cs.proc.audience.day - s.day > 3) CR.endDay(s); CR.runHook(s, cs, "_indemnCarpa", {}); for (let i = 0; i < 12; i++) { s.cash = 20000; CR.endDay(s); while (s.min < 11 * 60) CR.spend(s, 30, "admin"); }
      ok(s.carpa === 0 && !CR.hasFact(cs, "G_indemn") && cs.vars.indemn.rendu != null, "M11 : un dépôt trop tardif donne quand même un reçu, ou les fonds restent à la CARPA", { carpa: s.carpa, v: cs.vars.indemn }); } }

  // ---------- M12 : passé 23 h 30, le travail se paie en énergie et en sommeil
  { const s = neuve(4, true); s.min = 23 * 60 + 25; s.energy = 90; const rec0 = (() => { const x = neuve(4, true); x.min = 23 * 60 + 30; return CR.recoveryFor(x); })();
    CR.spend(s, 180, "desk");
    ok(s.min === CR.HARD_STOP && s.energy < 90 - 20 && s.veille >= 170, "M12 : trois heures de travail à 23 h 25 ne coûtent presque rien", { energy: s.energy, veille: s.veille });
    ok(CR.recoveryFor(s) <= rec0 - 20, "M12 : la nuit blanche ne coûte pas de sommeil", [CR.recoveryFor(s), rec0]);
    for (let i = 0; i < 49; i++) CR.spend(s, 60, "desk");
    ok(s.energy === 0 && !!s.burnout, "M12 : cinquante heures de travail d'affilée ne mènent pas à l'épuisement", { energy: s.energy });
    const t = neuve(5, true); t.min = 23 * 60 + 25; CR.spend(t, 120, "idle", { fixed: true }); ok(!t.veille, "M12 : attendre compte comme du travail de nuit");
    const u = neuve(6, true); u.min = 23 * 60 + 25; CR.spend(u, 60, "desk"); CR.endDay(u); ok(!u.veille, "M12 : la dette de sommeil ne s'efface pas au réveil"); }

  // ---------- permanences : plafond mensuel, une seule permanence de jour par date, désinscription jusqu'à l'avant-veille
  { const s = neuve(8, true); const j = (n) => { let d = s.day + n; while (!CR.isBusinessDay(d)) d++; return d; };
    ok(CR.peutSinscrire(s, s.day, "gav_jour").ok === false, "inscription possible le jour même");
    const d5 = j(5); ok(CR.peutSinscrire(s, d5, "gav_jour").ok && CR.signDuty(s, d5, "gav_jour"), "inscription refusée sans raison");
    ok(!CR.peutSinscrire(s, d5, "ci").ok && CR.peutSinscrire(s, d5, "gav_nuit").ok, "deux permanences de jour à la même date, ou nuit refusée");
    const nPend = s.pending.filter((e) => e.key === "dutyCall" && e.day === d5).length; ok(nPend >= 1, "aucun appel planifié pour la permanence");
    ok(CR.unsignDuty(s, d5, "gav_jour") && !s.duty.some((x) => x.day === d5) && !s.pending.some((e) => e.key === "dutyCall" && e.day === d5), "la désinscription laisse des appels planifiés");
    CR.signDuty(s, s.day + 1, "gav_nuit"); ok(CR.unsignDuty(s, s.day + 1, "gav_nuit") === false, "désinscription acceptée la veille");
    let n = CR.dutyDuMois(s, s.day), d = s.day + 2; while (CR.monthIndex(d) === CR.monthIndex(s.day) && n < CR.DUTY_MAX_MOIS) { if (CR.peutSinscrire(s, d, "gav_nuit").ok) { CR.signDuty(s, d, "gav_nuit"); n++; } d++; }
    ok(n === CR.DUTY_MAX_MOIS && !CR.peutSinscrire(s, d, "gav_nuit").ok === (CR.monthIndex(d) === CR.monthIndex(s.day)), "le plafond mensuel n'est pas appliqué", { n, mois: CR.dutyDuMois(s, s.day) });
    CR.store.s = s; CR.store.bump(); await sleep(100); CR.UI._setScene({ type: "permanences" }); await sleep(120);
    ok(/sur 8/.test(texts(doc.querySelector(".modal") || doc.body)) && !!findBtn(doc, /Se désinscrire/), "le tableau des permanences ne montre ni le plafond ni la désinscription"); CR.UI._setScene(null); await sleep(40); }
  // ---------- un revolver a un barillet de six coups, pas un chargeur de onze cartouches
  { const s = neuve(12, true); let rev = 0, faux = 0; for (let i = 0; i < 900 && rev < 6; i++) { const cs = CR.GEN.open(s, ["copj", "gav", "ci"][i % 3], {}); const def = CR.caseDef(cs); for (const k of Object.keys(def.docs || {})) { let r; try { r = CR.renderDoc(s, cs, { key: k, vars: {} }); } catch (e) { continue; } const t = [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t) || "").join(" "); const m = /revolver[\s\S]{0,120}?(chargeur|barillet) garni de (\d+)/.exec(t); if (m) { rev++; if (m[1] === "chargeur" || +m[2] > 6) faux++; } } }
    ok(rev > 0 && faux === 0, "un revolver à chargeur ou à plus de six coups dans le barillet", { rev, faux }); }
  // ---------- un passage sans texte ne fait plus tomber l'écran quand on ouvre un formulaire d'annotation dessus
  // (trouvé par l'essai d'endurance du 15 novembre : « Plan de défense » et « Placer dans la chronologie »)
  { const s = neuve(13, true); const cs = CR.GEN.open(s, "copj", {}); cs.status = "active"; CR.store.s = s; CR.store.bump(); await sleep(80);
    const hote = doc.createElement("div"); doc.body.appendChild(hote); const racine = w.ReactDOM.createRoot(hote); const n0 = errors.length;
    for (const libelle of [/Plan de défense/, /chronologie/i, /Qui dit quoi|version/i, /Relier|contredit/i, /irrégularité/i, /marge|note/i]) {
      racine.render(CR.UI.html`<${CR.UI.SegPop} key=${String(libelle)} s=${s} cs=${cs} seg=${""} x=${0} y=${0} onClose=${() => {}} />`); await sleep(60);
      const b = [...hote.querySelectorAll("button")].find((x) => libelle.test(texts(x)) && !x.disabled); if (b) { await click(w, b); await sleep(40); }
    }
    ok(errors.length === n0, "un formulaire d'annotation ouvert sur un passage vide fait tomber l'écran", errors.slice(n0, n0 + 1).join("").slice(0, 200)); errors.length = n0;
    racine.unmount(); hote.remove(); }
  // ---------- le code d'affaire donné en exemple est un vrai code
  { const ex = CR.GEN2.codeExemple(); const a = CR.GEN2.VIE.apercu(ex); ok(a && a.ok, "le code d'exemple est refusé par le jeu", [ex, a && a.msg]); ok(CR.GEN2.lireCode("").msg.includes(ex), "le message d'aide ne cite pas le code d'exemple"); }

  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 3).join(" | ").slice(0, 700)); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
