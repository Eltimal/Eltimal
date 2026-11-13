// Refonte, lot 5 (premier jet) : le canal de chaque acte. node tests/tcanaux.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const C = CR.CANAUX;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere" }); s.settings.saisie = "assiste"; s.settings.coach = false;
  const nouveau = (key) => { const cs = CR.GEN.open(s, "ci", {}); cs.status = "active"; cs.drafted[key] = [{ day: s.day, min: s.min, defects: [], filled: { etendue: "total" }, picks: {}, depose: false }]; return cs; };
  const taches = (cs) => CR.caseTasks(s, cs).map((t) => t.label);
  // 1. un appel par e-Barreau : irrecevable, aucun effet, lettre du greffe deux jours ouvrés plus tard
  {
    const cs = nouveau("appel");
    ok(taches(cs).some((l) => /^Transmettre : /.test(l)), "la tâche « Transmettre » n'apparaît pas", taches(cs).join(" | "));
    const r = C.transmettre(s, cs, "appel", "cep");
    ok(r.ok && CR.drafted(cs, "appel").irrecevable === "cep", "un appel par e-Barreau n'est pas irrecevable");
    ok(!cs.proc.appel, "l'appel irrecevable a pris effet");
    ok(cs.erreurs.some((e) => e.id === "canal_appel" && /art\. 502/.test(e.sanction)), "l'erreur n'est pas gardée pour le débrief avec son motif");
    const j = s.day; for (let k = 0; k < 4; k++) CR.endDay(s);
    ok(s.inbox.some((m) => m.caseId === cs.id && /irrecevable/.test(m.subject)), "le greffe ne notifie pas l'irrecevabilité");
  }
  // 2. un appel au greffe : on s'y rend, il prend effet
  {
    const cs = nouveau("appel");
    const r = C.transmettre(s, cs, "appel", "greffe");
    ok(r.ok && r.trajet, "le greffe ne demande pas de s'y rendre");
    ok(taches(cs).some((l) => /^Déposer au greffe : /.test(l)), "pas de tâche de dépôt au greffe");
    C.deposerSurPlace(s, cs, "appel");
    ok(cs.proc.appel && cs.proc.appel.day === s.day, "l'appel déposé au greffe ne prend pas effet");
    ok(!CR.drafted(cs, "appel").irrecevable, "un appel au greffe déclaré irrecevable");
  }
  // 3. une plainte par e-Barreau après 17 heures : elle prend date le jour ouvrable suivant (D. 591)
  {
    const cs = nouveau("plainte_simple");
    s.min = 17 * 60 + 20;
    const j0 = s.day;
    C.transmettre(s, cs, "plainte_simple", "cep");
    const d = CR.drafted(cs, "plainte_simple");
    ok(!d.irrecevable && d.deposeDay === CR.addOuvrables(j0, 1) && !d.effet, "accusé de réception après 17 heures : la date ne glisse pas", JSON.stringify(d));
    for (let k = 0; k < 4 && !d.effet; k++) CR.endDay(s);
    ok(d.effet, "l'envoi électronique ne prend jamais effet");
  }
  // 4. le chef d'établissement, pour un client qui n'est pas détenu
  {
    const cs = nouveau("dml");
    const r = C.transmettre(s, cs, "dml", "chef");
    ok(!r.ok && /pas détenu/.test(r.msg), "un client libre peut déclarer au chef d'établissement");
    const r2 = C.transmettre(s, cs, "dml", "cep");
    ok(r2.ok && CR.drafted(cs, "dml").irrecevable === "cep" && /D\. 593/.test(C.MOTIF("dml", "cep", "x")), "la demande de mise en liberté par e-Barreau n'est pas irrecevable");
  }
  // 4 bis. l'écran e-Barreau (B1 bis) : adresse hors liste, mauvais service, pièce oubliée, bon envoi
  {
    s.min = 10 * 60;
    const a = nouveau("plainte_simple");
    C.transmettre(s, a, "plainte_simple", "cep", { dest: "hors", pj: true });
    ok(CR.drafted(a, "plainte_simple").irrecevable === "cephors" && /D\. 591/.test(C.MOTIF("plainte_simple", "cephors", "x")), "une adresse hors liste n'est pas irrecevable");
    const b = nouveau("plainte_simple");
    const rb = C.transmettre(s, b, "plainte_simple", "cep", { dest: "doyen", pj: true });
    ok(rb.retour && !CR.drafted(b, "plainte_simple").depose, "une plainte envoyée au doyen prend date", JSON.stringify(rb));
    const c = nouveau("plainte_simple");
    C.transmettre(s, c, "plainte_simple", "cep", { dest: "bop", pj: false });
    ok(!CR.drafted(c, "plainte_simple").depose, "un message sans l'acte joint prend date");
    const e = nouveau("plainte_simple");
    C.transmettre(s, e, "plainte_simple", "cep", { dest: "bop", pj: true });
    const de = CR.drafted(e, "plainte_simple");
    ok(de.depose && !de.irrecevable && de.deposeDay === (CR.isOuvrable(s.day) ? s.day : CR.addOuvrables(s.day, 1)), "le bon envoi e-Barreau ne prend pas date", JSON.stringify(de));
    const n0 = s.mails ? s.mails.length : (s.inbox || []).length;
    for (let k = 0; k < 2; k++) CR.endDay(s);
    const boite = JSON.stringify(s.mails || s.inbox || []) + JSON.stringify((s.eb && s.eb.recus) || []);
    ok(/ne relève pas de notre service/.test(boite) && /pas l'acte annoncé/.test(boite), "le service destinataire ne répond pas au message mal adressé", n0);
    ok(C.transmettre(s, b, "plainte_simple", "cep", { dest: "bop", pj: true }).ok && CR.drafted(b, "plainte_simple").depose, "le message mal adressé ne peut pas être renvoyé");
  }
  // 5. le mode liste (parties automatiques) garde le dépôt en un clic
  {
    s.settings.saisie = "liste";
    const cs = nouveau("appel");
    ok(taches(cs).some((l) => /^Déposer : /.test(l)) && !taches(cs).some((l) => /^Transmettre/.test(l)), "le mode liste a perdu le dépôt en un clic");
  }
  // 6. tous les actes de la table ont un gabarit
  for (const k of Object.keys(C.ADMIS)) ok(!!(CR.TPL ? CR.TPL[k] : true), "canaux d'un acte sans gabarit : " + k);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
