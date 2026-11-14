// Pourvoi en cassation : ouverture après un arrêt d'appel défavorable, délai de dix jours francs, lecture de l'arrêt,
// déclaration au bon greffe, mémoire, moyens, décision de la chambre criminelle, fiche du classeur.
const { sleep, texts, findBtn, click } = require("./harness");
const U = require("./util");
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
(async () => {
  const env = await U.career(null, 7); const { w, doc, CR, s, errors } = env; const CASS = CR.CASS;
  s.pending = s.pending.filter((e) => e.type !== "lead"); CR.GEN2.DIR.off = true;
  ok(CR.ACTES.pourvoi && /10 jours francs/.test(CR.ACTES.pourvoi.delai), "fiche d'acte « pourvoi » : dix jours francs");
  // une affaire jugée en appel, condamnation
  const juge = (vice, camp, detail) => {
    const c = CR.GEN.open(s, camp === "pc" ? "pc" : "copj", { min: s.min }); c.status = "active";
    c.vars.vieArret = "infirme";
    CR.closeCase(s, c, { type: camp === "pc" ? "deboute" : "condamnation", detail: detail || "huit mois d'emprisonnement ferme" });
    if (c.vars.cass && vice !== undefined) c.vars.cass.vice = vice;
    return c;
  };
  const sans = CR.GEN.open(s, "copj", { min: s.min }); CR.closeCase(s, sans, { type: "condamnation", detail: "amende" });
  ok(!sans.vars.cass, "pas de pourvoi contre un jugement de première instance");
  const c1 = juge("parole");
  const k = c1.vars.cass;
  ok(k && k.etat === "delai" && k.limite === CR.rollForward(s.day + 11) && k.ferme, "arrêt d'appel : délai ouvert jusqu'au 11e jour (dix jours francs)");
  ok(s.inbox.some((m) => /dix jours francs/.test(JSON.stringify(m.body))) && s.agenda.some((a) => /pourvoi/.test(a.title || "")), "courriel du greffe et échéance à l'agenda");
  const txt = (c) => CASS.arret(s, c).map((p) => p.t).join(" ");
  ok(/en sa plaidoirie ; le ministère public en ses réquisitions\. Puis/.test(txt(c1)) && !/parole en dernier/.test(txt(c1)), "vice « parole » : lisible dans l'arrêt");
  c1.vars.cass.vice = null; ok(/a eu la parole en dernier/.test(txt(c1)) && /dispense d'inscription au bulletin n° 2 : la nature/.test(txt(c1)) && /personnalité/.test(txt(c1)), "arrêt régulier : ordre, réponse, motivation");
  c1.vars.cass.vice = "reponse"; ok(!/Sur la demande de dispense/.test(txt(c1)) && /Par conclusions régulièrement déposées/.test(txt(c1)), "vice « réponse » : conclusions visées, jamais examinées");
  c1.vars.cass.vice = "peine"; ok(/eu égard à la gravité des faits, la cour prononce/.test(txt(c1)), "vice « peine » : la seule gravité des faits");
  // bonne voie : déclaration au bon greffe, mémoire personnel, bon moyen
  c1.vars.cass.vice = "parole";
  ok(CASS.declarer(s, c1, "cassation") === "faux" && c1.erreurs.some((e) => e.id === "cass_greffe"), "mauvais greffe : erreur, à refaire");
  ok(CASS.declarer(s, c1, "cour") === "ok" && c1.vars.cass.etat === "declare", "déclaration au greffe de la cour d'appel");
  CASS.deposer(s, c1, "personnel", ["parole", "faits"]);
  ok(c1.vars.cass.etat === "pendant" && s.pending.some((e) => e.key === "cassArret"), "mémoire déposé, arrêt de la Cour programmé");
  const fav = (s.car && s.car.favorables) || 0, rc = s.reps.clients;
  CASS.juger(s, c1);
  ok(c1.vars.cass.etat === "cassation" && /arrêt cassé, renvoi devant la cour d'appel de Versailles/.test(c1.outcome.detail) && s.reps.clients > rc && s.stats.cassations === 1, "cassation avec renvoi");
  ok(c1.vars.cass.bilan.some((b) => /moyen de pur fait/.test(b.text)), "le moyen de fait est expliqué");
  ok(s.car.favorables === fav + 1, "compte comme une issue favorable");
  const f1 = s.classeur.find((x) => x.caseId === c1.id);
  ok(f1 && f1.notions.some((n) => /568/.test(n.art)) && f1.corrige.some((x) => /cassé/.test(x.probleme)), "la fiche du classeur reçoit les notions du pourvoi");
  // mémoire signé par l'avocat : irrecevable
  const c2 = juge("reponse"); CASS.declarer(s, c2, "cour"); CASS.deposer(s, c2, "avocat", ["reponse"]); CASS.juger(s, c2);
  ok(c2.vars.cass.etat === "irrecevable" && /signature du demandeur/.test(c2.vars.cass.bilan[0].text), "mémoire signé par l'avocat : irrecevable");
  // mauvais moyens : non-admission, et le vice manqué est révélé
  const c3 = juge("peine"); CASS.declarer(s, c3, "cour"); CASS.deposer(s, c3, "personnel", ["quantum", "nouveau"]); CASS.juger(s, c3);
  ok(c3.vars.cass.etat === "non_admis" && c3.vars.cass.bilan.some((b) => b.kind === "surprise" && /132-19/.test(b.text)), "mauvais moyens : non-admission, vice manqué révélé");
  // arrêt régulier : déconseiller est le bon conseil ; s'y risquer mène à la non-admission
  const c4 = juge(null); CASS.renoncer(s, c4); ok(c4.vars.cass.etat === "renonce" && c4.vars.cass.bilan[0].kind === "good", "arrêt régulier : déconseiller le pourvoi");
  const c5 = juge("parole"); CASS.renoncer(s, c5); ok(c5.vars.cass.bilan[0].kind === "bad", "arrêt vicié : le déconseiller est une erreur");
  const c6 = juge(null); CASS.declarer(s, c6, "cour"); CASS.deposer(s, c6, "conseils", ["faits"]); CASS.juger(s, c6); ok(c6.vars.cass.etat === "desistement", "avocat aux Conseils sans moyen : désistement");
  const c7 = juge("reponse"); CASS.declarer(s, c7, "cour"); CASS.deposer(s, c7, "conseils", ["faits"]); CASS.juger(s, c7); ok(c7.vars.cass.etat === "cassation" && c7.vars.cass.bilan.some((b) => /avocat aux Conseils qui l'a relevé/.test(b.text)), "avocat aux Conseils : il trouve le moyen que vous n'aviez pas vu");
  // partie civile : envoi direct après dix jours irrecevable
  const c8 = juge("reponse_pc", "pc", "");
  ok(c8.vars.cass && c8.vars.cass.pc && /déboute la partie civile/.test(txt(c8)), "partie civile déboutée en appel : pourvoi ouvert, arrêt civil");
  CASS.declarer(s, c8, "cour"); CASS.deposer(s, c8, "direct", ["reponse_pc"]); CASS.juger(s, c8);
  ok(c8.vars.cass.etat === "irrecevable" && /585/.test(c8.vars.cass.bilan[0].text), "partie civile : envoi direct à la Cour irrecevable");
  // sursis simple : pas de moyen sur la motivation de l'emprisonnement ferme
  const c9 = juge(null, "defense", "six mois d'emprisonnement avec sursis"); ok(!c9.vars.cass.ferme && !CASS.choixMoyens(s, c9).some((m) => m.id === "peine"), "sursis : le moyen sur la peine ferme n'est pas proposé");
  CASS.renoncer(s, c9);
  // délai expiré
  const c10 = juge("parole"); const lim = c10.vars.cass.limite; while (s.day <= lim) CR.endDay(s);
  ok(c10.vars.cass.etat === "expire" && c10.vars.cass.bilan[0].kind === "bad", "délai expiré sans décision : l'arrêt est définitif");
  ok(CASS.declarer(s, c10, "cour") !== "ok", "plus de déclaration possible");
  // l'arrêt de la Cour tombe à sa date
  const c11 = juge("parole"); CASS.declarer(s, c11, "cour"); CASS.deposer(s, c11, "personnel", ["parole"]); const jour = c11.vars.cass.arretDay;
  ok(jour - s.day >= 110, "la Cour statue après plusieurs mois");
  // dans l'interface
  const c12 = juge("reponse"); CR.store.bump(); await sleep(80);
  s.pendingDebrief = []; CR.store.bump(); await sleep(80);
  const bd = [...doc.querySelectorAll(".cass-bandeau .court-call")].find((x) => texts(x).includes(CR.clientName(c12)));
  ok(!!bd, "bandeau sur le bureau");
  if (bd) {
    await click(w, findBtn(doc, "Lire l'arrêt", bd)); await sleep(60);
    ok(!!doc.querySelector(".cass-arret") && doc.querySelectorAll(".cass-arret p").length >= 6, "l'arrêt se lit dans la scène");
    await click(w, [...doc.querySelectorAll(".cass-box .choice")].find((x) => /Conseiller le pourvoi/.test(texts(x))));
    await click(w, [...doc.querySelectorAll(".cass-box .choice")].find((x) => /qui a rendu l'arrêt/.test(texts(x))));
    await click(w, [...doc.querySelectorAll(".cass-box .choice")].find((x) => /signe un mémoire personnel/.test(texts(x)))); await click(w, findBtn(doc, "Continuer"));
    await click(w, [...doc.querySelectorAll(".cass-box .arg")].find((x) => /n'a pas répondu aux conclusions/.test(texts(x)))); await click(w, findBtn(doc, "Déposer le mémoire"));
    ok(c12.vars.cass.etat === "pendant" && c12.vars.cass.moyens[0] === "reponse" && /Le pourvoi est formé/.test(texts(doc.querySelector(".cass-box"))), "pourvoi formé depuis l'interface");
    await click(w, findBtn(doc, "Fermer"));
  }
  while (s.day < jour + 1 && !s.gameOver) CR.endDay(s);
  ok(c11.vars.cass.etat === "cassation" && s.inbox.some((m) => /Cassation/.test(m.subj)), "l'arrêt de la chambre criminelle arrive par courriel : " + c11.vars.cass.etat);
  const s2 = JSON.parse(JSON.stringify(s)); ok(s2.cases[c1.id].vars.cass.etat === "cassation", "le pourvoi survit à la sauvegarde");
  console.log("échecs:", fails); console.log("errors:", errors.length ? errors.slice(0, 4).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
