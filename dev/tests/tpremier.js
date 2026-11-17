// 1.4.0 « Le premier appel » — la première semaine conduite.
// 1. La prestation de serment : « Assisté » coché par défaut à la première carrière, « Libre » ensuite ; inscription
//    d'office à la garde à vue de la première nuit, avec un appel sûr ; deux courriers seulement au premier jour, dont
//    celui de l'Ordre, qui porte le bouton « S'inscrire aux permanences » ; la banque écrit la veille des charges, la note
//    sur le cabinet arrive avec le premier dossier.
// 2. Un automate qui ne clique que « Avancer » et « Répondre » joue une garde à vue avant le troisième jour.
// 3. Les contacts en attente : « Avancer » le dit et s'arrête dessus ; la veille de leur départ, le client laisse un
//    message ; le bureau les affiche.
// 4. Au troisième jour, sans permanence prise par le joueur, Me Varenne appelle ; inscrit, elle se tait.
const { boot, sleep, findBtn, click, texts } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d !== undefined ? " — " + String(typeof d === "string" ? d : JSON.stringify(d)).slice(0, 300) : "")); } };
  const { w, CR, doc, errors } = boot(); await sleep(250);

  // ---------- 1. la prestation de serment
  await click(w, findBtn(doc, /^Nouvelle partie$/));
  const radios = [...doc.querySelectorAll('input[name="nc-aide"]')];
  const coche = radios.find((r) => r.checked);
  ok(coche && /Assisté/.test(texts(coche.closest("label"))), "« Assisté » n'est pas coché à la première carrière");
  await click(w, findBtn(doc, /Carrière — à votre compte/)); await sleep(150);
  let s = CR.store.s;
  ok(s && s.mode === "carriere", "la carrière ne démarre pas");
  ok(CR.prefs.dejaCarriere === true, "la première carrière n'est pas retenue (« Libre » ensuite)");
  ok(s.settings.parole === "assiste", "la carrière n'est pas en mode assisté");
  const nuit = s.duty.find((d) => d.day === 0 && d.type === "gav_nuit");
  ok(nuit && nuit.office, "pas d'inscription d'office à la première nuit", s.duty);
  ok(s.pending.some((e) => e.type === "fn" && e.key === "dutyCall" && e.day === 1 && e.data && e.data.night), "la première nuit n'a pas d'appel sûr");
  const jour0 = s.inbox.filter((m) => m.day === 0);
  ok(jour0.length === 2, "plus de deux courriers au premier jour", jour0.map((m) => m.subject));
  const ordre = s.inbox.find((m) => m.kind === "ordre");
  ok(ordre && ordre.action && ordre.action.go === "permanences" && /cette nuit/.test(ordre.subject), "le courrier de l'Ordre ne dit pas la première nuit ou n'a pas de bouton", ordre && ordre.subject);
  ok(!s.inbox.some((m) => /Banque du Palais/.test(m.from)) && s.pending.some((e) => e.key === "introBanque" && CR.ymd(e.day + 1).d === 1), "la banque n'écrit pas la veille des premières charges");
  ok(!s.inbox.some((m) => /Comment fonctionne le cabinet/.test(m.subject)), "la note sur le cabinet arrive avant le premier dossier");
  // le bouton du courrier ouvre le service des permanences
  { const ui = findBtn(doc, /^Messagerie$/) || [...doc.querySelectorAll("button")].find((b) => /Messagerie/.test(texts(b)));
    if (ui) await click(w, ui); await sleep(60);
    const lig = [...doc.querySelectorAll("button.mail")].find((b) => /Votre première permanence/.test(texts(b)));
    if (lig) await click(w, lig); await sleep(60);
    const b = findBtn(doc, /^S'inscrire aux permanences$/);
    ok(!!b, "pas de bouton « S'inscrire aux permanences » dans le courrier de l'Ordre");
    if (b) { await click(w, b); await sleep(80); ok(/permanence/i.test(texts(doc.body)) && !!doc.querySelector(".scene, .modal, [class*=perm]"), "le bouton n'ouvre pas le service des permanences"); }
    const fermer = findBtn(doc, /^(Fermer|Retour|Quitter)$/) || doc.querySelector('[aria-label="Fermer"]'); if (fermer) await click(w, fermer); await sleep(60);
    const bureau = [...doc.querySelectorAll("button")].find((b) => texts(b) === "Bureau"); if (bureau) await click(w, bureau); await sleep(60); }

  // ---------- 2. l'automate : « Avancer » et « Répondre » seulement
  let gav = null, clics = [];
  for (let i = 0; i < 40 && !gav; i++) {
    s = CR.store.s;
    const rep = findBtn(doc, /^Répondre$/);
    if (rep) { await click(w, rep); clics.push("Répondre j" + s.day); await sleep(150); }
    else {
      const av = findBtn(doc, /^Avancer quand même$/) || findBtn(doc, /^Avancer$/);
      if (!av) { clics.push("rien"); break; }
      await click(w, av); clics.push(texts(av) + " j" + s.day); await sleep(120);
    }
    s = CR.store.s;
    const cs = s.order.map((id) => s.cases[id]).find((c) => c && CR.caseDef(c) && CR.caseDef(c).genre === "gav");
    if (cs && (doc.querySelector(".call-scene") || doc.querySelector(".gav-scene") || doc.querySelector(".scene"))) gav = { cs, day: s.day, min: s.min };
  }
  ok(gav && gav.day < 3, "l'automate n'a pas joué de garde à vue avant le troisième jour", clics.join(" → "));
  if (gav) console.log(`  garde à vue jouée le jour ${gav.day} à ${CR.fmtTime(gav.min)} (${clics.length} clics : ${clics.join(", ")})`);
  ok(s.inbox.some((m) => /Comment fonctionne le cabinet/.test(m.subject)), "la note sur le cabinet n'arrive pas avec le premier dossier");

  // ---------- 3. les contacts en attente (moteur)
  {
    const s2 = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Martin", mode: "carriere", seed: 77 });
    s2.pending = s2.pending.filter((e) => e.type !== "lead");
    s2.day = 3; s2.min = 9 * 60;
    CR.GEN.lead(s2, s2.day, "copj");
    const lead = s2.order.map((id) => s2.cases[id]).find((c) => c && c.status === "lead");
    ok(!!lead, "le test suppose un contact en attente");
    if (lead) {
      if (s2.ring) CR.missRing(s2);
      const att = CR.contactsEnAttente(s2);
      ok(att.length === 1 && att[0].expire > s2.day, "le contact en attente n'est pas vu avec son échéance", att.map((x) => [x.nom, x.expire]));
      ok(CR.resteAujourdhui(s2).some((x) => /attend votre réponse/.test(x)), "« Avancer » ne dit pas qu'un client attend");
      const avant = s2.day, n = CR.skipAhead(s2);
      ok(n === 1 && s2.day === avant + 1 && /attend votre réponse/.test(CR.PREMIERE.arret || ""), "« Avancer » ne s'arrête pas sur le contact en attente", { n, arret: CR.PREMIERE.arret });
      // la veille du départ : un message du client, et le bureau le montre
      const exp = att[0].expire;
      for (let k = 0; k < 10 && s2.day < exp - 1; k++) CR.endDay(s2);
      ok(s2.day === exp - 1 && s2.voicemails.some((v) => v.veille && v.caseId === lead.id), "le client ne prévient pas la veille", { jour: s2.day, exp, vm: s2.voicemails.map((v) => v.from) });
      CR.store.bump(); await sleep(80);
      ok(/attend votre réponse/.test(texts(doc.body)) && !!doc.querySelector(".banner.attente"), "le bureau ne montre pas le contact en attente");
      CR.endDay(s2);
      ok(lead.status === "closed" && lead.outcome && lead.outcome.type === "lost-lead", "le contact non rappelé ne part pas", lead.status);
    }
  }

  // ---------- 4. Me Varenne au troisième jour
  for (const inscrit of [false, true]) {
    const s3 = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Martin", mode: "carriere", seed: 5 + (inscrit ? 1 : 0) });
    s3.pending = s3.pending.filter((e) => e.type !== "lead");
    CR.premiereSemaine(s3);
    if (inscrit) CR.signDuty(s3, 2, "ci");
    for (let k = 0; k < 4 && s3.day < 3; k++) { if (s3.ring) CR.missRing(s3); CR.endDay(s3); }
    CR.fireTimed && CR.fireTimed(s3, s3.min, 12 * 60);
    const appel = (s3.ring && s3.ring.mentor) || s3.voicemails.some((v) => v.mentor);
    ok(inscrit ? !appel : !!appel, inscrit ? "Me Varenne appelle alors que vous êtes inscrit" : "Me Varenne n'appelle pas au troisième jour", { jour: s3.day, ring: s3.ring && s3.ring.from });
  }

  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ").slice(0, 600)); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
