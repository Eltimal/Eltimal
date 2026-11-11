// L'équipe du cabinet (feuille de route, n° 14) : une carrière de six mois.
// Recrutement par annonce (CV, entretien, offre), appels pris par l'assistante, tâches confiées et réalisées,
// erreur rattrapée par la relecture, paie et charges, départ quand le moral est bas, aucun revenu au hasard,
// anciennes sauvegardes, tirages déterministes, page d'équipe dans l'interface.
const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play");
let echecs = 0;
const ok = (c, m) => { if (!c) { echecs++; console.log("ÉCHEC", m); } };
(async () => {
  const env = boot();
  const { w, CR, doc, errors } = env;
  await sleep(150);
  const seed = +(process.argv[2] || 11);
  const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed }));
  s.settings.coach = false; s.settings.saisie = "liste"; s.cash = 120000;
  s.pending = s.pending.filter((e) => e.type !== "lead");
  const warn = [];
  w.console.warn = (...a) => warn.push(a.join(" "));
  const jour = () => { if (s.night) CR.backToBed(s); while (s.min < 18 * 60) CR.spend(s, 30, "admin"); CR.endDay(s); };
  const ouvrable = () => { while (!CR.isBusinessDay(s.day)) jour(); };

  // ---------------------------------------------------------------- 1. Recrutement par annonce
  const rA = CR.publierAnnonce(s, { role: "assistante", niveau: "confirme", domaines: [], remu: 2400, temps: 1 });
  const rC = CR.publierAnnonce(s, { role: "collaborateur", niveau: "confirme", domaines: ["tc", "gav"], remu: 5200 });
  const rJ = CR.publierAnnonce(s, { role: "juriste", niveau: "debutant", domaines: ["recherche"], remu: 3100, temps: 1 });
  const rBas = CR.publierAnnonce(s, { role: "collaborateur", niveau: "debutant", domaines: [], remu: 3000 });
  ok(rA.ok && rC.ok && rJ.ok, "annonces publiées");
  ok(!rBas.ok && /minimum/.test(rBas.texte), "rétrocession sous le minimum refusée");
  ok(s.ledger.some((l) => /Annonce de recrutement/.test(l.label)), "coût de l'annonce");
  // les candidatures arrivent en quelques jours
  ok(CR.candidatsVisibles(s).length === 0, "aucune candidature le jour même");
  for (let i = 0; i < 10; i++) jour();
  const cands = CR.candidatsVisibles(s);
  console.log("candidatures", cands.length, cands.map((c) => `${c.prenom} ${c.nom} (${c.role}, ${c.cv.ans} ans${c.cv.incoh ? ", CV enjolivé" : ""})`).join(" ; "));
  ok(cands.length >= 3, "plusieurs candidatures");
  ok(cands.every((c) => c.parcours && c.parcours.univ && c.parcours.langues.includes("français") && Object.keys(c.exp).length === 11), "parcours et expérience par domaine");
  const recruter = (role) => {
    const cs = CR.candidatsVisibles(s).filter((c) => c.role === role).sort((a, b) => b.qualite - a.qualite);
    const c = cs[0];
    if (!c) return null;
    CR.lireCV(s, c.id);
    CR.entretien(s, c.id, ["situation", "parcours", "pretentions"]);
    ok(c.reponses.length === 3 && Object.keys(c.indices).length >= 2, "entretien : réponses et indices de personnalité");
    ok(c.reponses.every((r) => !/\d{2,}\s*\/\s*100|undefined|\{il\}|\{Il\}|\{e\}/.test(r.t)), "indices sans chiffres ni jetons");
    let r = CR.proposer(s, c.id, Math.max(CR.minimumLegal(role, c.temps), c.demande - 600));
    if (!r.ok && c.contre) r = CR.proposer(s, c.id, c.contre);
    if (!r.ok && c.etat !== "parti") r = CR.proposer(s, c.id, c.demande);
    return r.ok ? r.st : null;
  };
  const ast = recruter("assistante");
  const col = recruter("collaborateur");
  const jur = recruter("juriste");
  ok(ast && col && jur, "trois recrutements");
  if (!ast || !col || !jur) { console.log("échecs:", echecs); process.exit(1); }
  ok(col.essaiFin === CR.addMonths(col.arrive, 3) && ast.essaiFin === CR.addMonths(ast.arrive, 2) && jur.essaiFin === CR.addMonths(jur.arrive, 4), "périodes d'essai");
  console.log("équipe", s.staff.map((st) => `${st.name} — ${CR.roleLabel(st)}, ${CR.money(st.salary)}, arrive le ${CR.fmtDate(st.arrive, "short")}`).join(" ; "));
  while (s.day < Math.max(ast.arrive, col.arrive, jur.arrive)) jour();
  ouvrable();

  // ---------------------------------------------------------------- 2. Dossiers et tâches confiées, six mois
  const ouvrir = () => { const cs = CR.GEN.open(s, CR.R.pick(s, ["copj", "copj", "al", "pc"]), {}); cs.conflictChecked = true; cs.fee = { type: "temps", rate: 200 }; CR.engageUrgence(s, cs); return cs; };
  for (let i = 0; i < 3; i++) ouvrir();
  const debut = s.day;
  let relues = 0, rattrapees = 0, confiees = 0, appelsTest = 0, plaidoiries = 0, departTeste = false, vuSamediPaye = false;
  const cashSamedi = [];
  while (s.day < debut + 182 && !s.gameOver) {
    if (CR.isBusinessDay(s.day)) {
      if (CR.reunionPossible(s)) CR.reunion(s);
      // un joueur raisonnable répond au bâtonnier
      for (const g of s.disc.open.filter((x) => !x.response)) CR.answerGrievance(s, g.id, "candide");
      // relire ce qui attend
      for (const t of s.team.taches.filter((x) => x.etat === "a_relire")) { const r = CR.relire(s, t.id); relues++; if (r && r.rattrapee) rattrapees++; }
      for (const t of s.team.taches.filter((x) => x.type === "plaidoirie" && x.etat === "planifiee" && !x.prepare)) CR.relire(s, t.id);
      // confier
      const actifs = s.order.map((id) => s.cases[id]).filter((c) => c && c.status === "active");
      if (actifs.length < 3) ouvrir();
      for (const cs of actifs) {
        for (const it of CR.tachesDelegables(s, cs)) {
          if (CR.dejaConfiee(s, cs, it)) continue;
          const qui = it.type === "depot" || it.type === "copie" ? ast : it.type === "recherche" || it.type === "redaction" ? jur : ["point", "parloir", "plaidoirie"].includes(it.type) ? col : null;
          if (!qui || !s.staff.includes(qui) || qui.depart) continue;
          if (CR.charge(s, qui) > 1) continue;
          const r = CR.confier(s, cs, qui.id, it, { relire: true });
          if (r.ok) { confiees++; if (it.type === "plaidoirie") plaidoiries++; }
        }
      }
      // l'assistante décroche quand vous êtes occupé
      if (s.day % 9 === 0 && s.staff.includes(ast) && CR.present(s, ast)) {
        s.min = Math.max(s.min, 11 * 60);
        const n = s.voicemails.length;
        CR.ringNow(s, { from: "Mme Leclerc", kind: "client", vmText: "Bonjour maître, je voulais savoir si l'audience de mon fils est maintenue. Rappelez-moi." }, true);
        appelsTest++;
        if (s.voicemails.length > n) ok(s.voicemails[0].taken === ast.id && /Qui : Mme Leclerc/.test(s.voicemails[0].text) && /Urgence/.test(s.voicemails[0].text), "message précis pris par l'assistante");
      }
      // départ si le moral est bas : l'assistante, au cinquième mois
      if (!departTeste && s.day > debut + 120 && s.staff.includes(ast)) { departTeste = true; ast.morale = 5; ast.perso.loyaute = 25; }
    } else cashSamedi.push(s.cash);
    jour();
  }
  // un samedi : aucune entrée d'argent tirée au hasard
  const t = s.team.taches;
  const faites = t.filter((x) => x.etat === "fait");
  console.log("tâches confiées", confiees, "faites", faites.length, "par type", JSON.stringify(faites.reduce((a, x) => { a[x.type] = (a[x.type] || 0) + 1; return a; }, {})), "relues", relues, "erreurs rattrapées", rattrapees, "erreurs non rattrapées", t.filter((x) => x.erreur && !x.erreur.rattrapee).length);
  ok(confiees >= 20 && faites.length >= 15, "tâches confiées et réalisées");
  ok(faites.some((x) => x.type === "recherche") && faites.some((x) => x.type === "depot" || x.type === "copie"), "recherches et démarches faites");
  ok(rattrapees >= 1, "au moins une erreur rattrapée par la relecture");
  ok(s.order.some((id) => s.cases[id] && (s.cases[id].notes || []).some((n) => /Note de recherche de/.test(n.text))), "note de recherche au bloc-notes");
  ok(s.order.some((id) => s.cases[id] && Object.keys(s.cases[id].workedBy || {}).length), "temps de l'équipe imputé aux dossiers");
  const plaid = s.order.map((id) => s.cases[id]).filter((c) => c && c.outcome && /plaidé|plaidée/.test(c.outcome.detail || ""));
  console.log("plaidoiries confiées", plaidoiries, "plaidées", plaid.length, plaid.map((c) => CR.outcomeLabel(c.outcome)).join(" ; "));
  if (plaidoiries) ok(plaid.length >= 1, "petit dossier plaidé par le collaborateur");
  // appels
  const pris = s.voicemails.filter((v) => v.taken);
  console.log("appels pris par l'assistante", s.team.appelsPris || 0, "messages au répondeur sans assistante", s.voicemails.filter((v) => !v.taken).length, "oublis", ast.oublis || 0);
  ok(pris.length >= 3, "appels pris par l'assistante");
  // paie
  const L = s.ledger.map((l) => l.label);
  ok(L.some((l) => /^Salaire brut — /.test(l)) && L.some((l) => /^Charges patronales — /.test(l)) && L.some((l) => /^Rétrocession d'honoraires — Me /.test(l)), "paie : salaires, charges, rétrocession");
  const sb = s.ledger.find((l) => /^Salaire brut — /.test(l.label) && !/Rappel/.test(l.label));
  const ch = s.ledger.find((l) => sb && l.day === sb.day && l.label === sb.label.replace("Salaire brut", "Charges patronales"));
  ok(sb && ch && Math.abs(-ch.amount - Math.round(-sb.amount * CR.chiffre("charges"))) <= 1, "charges = 42 % du brut");
  // aucun revenu au hasard
  ok(!L.some((l) => /Petit dossier traité/.test(l)), "plus de « petit dossier traité » au hasard");
  const entrees = s.ledger.filter((l) => l.amount > 0 && l.acct === "op");
  const inconnues = entrees.filter((l) => !/honoraires|Honoraires|Provision|provision|Aide juridictionnelle|Découvert|Solde|Forfait|convention|Consignation|AJ|relance/i.test(l.label) && !l.caseId);
  console.log("entrées d'argent", entrees.length, "sans dossier ni source connue", inconnues.map((l) => l.label).join(" | ") || "aucune");
  ok(inconnues.length === 0, "chaque entrée d'argent a une source");
  // départ
  const parti = s.team.partis.find((p) => p.id === ast.id) || (ast.depart ? { raison: ast.depart.raison } : null);
  console.log("départ de l'assistante", JSON.stringify(parti && parti.raison), ast.depart ? `annoncé le ${CR.fmtDate(ast.depart.annonce, "short")}, effectif le ${CR.fmtDate(ast.depart.jour, "short")}` : "");
  ok(parti && /démission/.test(parti.raison), "départ quand le moral est bas");
  ok(ast.depart && ast.depart.jour === CR.addMonths(ast.depart.annonce, 1), "préavis d'un mois (employé)");
  ok(s.staff.every((st) => st.formation && st.perso && st.vu), "fiches complètes");
  ok(col.vu && Object.keys(col.vu.exp).length >= 1, "expérience constatée au travail");

  // ---------------------------------------------------------------- 3. Sauvegarde, ancienne sauvegarde, déterminisme
  const s2 = CR.deserialize(CR.serialize(s));
  ok(s2.staff.length === s.staff.length && s2.team.taches.length === s.team.taches.length, "sauvegarde relue");
  const vieux = JSON.parse(CR.serialize(CR.newGame({ prenom: "V", nom: "W", mode: "carriere", seed: 4 })));
  delete vieux.team;
  vieux.staff = [{ id: "p1", role: "collaborateur", name: "Hugo Petit", skill: 70, salary: 3400, seed: 4242, hired: 0, morale: 70 }, { id: "p2", role: "assistante", name: "Inès Martin", skill: 50, salary: 2300, seed: 99, hired: 0, morale: 60 }];
  vieux.applicants = [{ id: "x", role: "assistante", name: "Zoé Roux", skill: 60, salary: 2200, seed: 3 }];
  const json = JSON.stringify(vieux);
  CR.store.s = s;
  const v1 = CR.deserialize(json), v2 = CR.deserialize(json);
  ok(v1.staff.every((st) => st.parcours && st.perso && st.exp && st.prenom && st.g), "anciens employés : parcours et personnalité tirés");
  ok(JSON.stringify(v1.staff.map((x) => [x.parcours, x.perso])) === JSON.stringify(v2.staff.map((x) => [x.parcours, x.perso])), "tirage déterministe pour une ancienne sauvegarde");
  ok(v1.staff[0].prenom === "Hugo" && v1.staff[0].g === "m" && v1.staff[1].g === "f", "nom et genre conservés");
  for (let i = 0; i < 25; i++) { CR.store.s = v1; CR.endDay(v1); }
  ok(!v1.ledger.some((l) => /Petit dossier/.test(l.label)), "ancienne sauvegarde : aucun revenu au hasard");
  const g1 = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 77 }); CR.publierAnnonce(g1, { role: "juriste", niveau: "confirme", domaines: [], remu: 3000, temps: 1 });
  const g2 = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 77 }); CR.publierAnnonce(g2, { role: "juriste", niveau: "confirme", domaines: [], remu: 3000, temps: 1 });
  ok(JSON.stringify(g1.team.candidats.map((c) => [c.prenom, c.nom, c.exp, c.perso])) === JSON.stringify(g2.team.candidats.map((c) => [c.prenom, c.nom, c.exp, c.perso])), "candidats identiques pour une même graine");
  // la même graine sans équipe tire la même suite qu'avant (le générateur de l'équipe est à part)
  const n1 = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 78 }), n2 = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 78 });
  CR.publierAnnonce(n2, { role: "juriste", niveau: "confirme", domaines: [], remu: 3000, temps: 1 });
  ok(n1.rng === n2.rng, "l'annonce ne touche pas au hasard du reste de la partie");

  // ---------------------------------------------------------------- 4. Interface : page d'équipe et « Confier »
  CR.store.s = s;
  CR.store.bump(); await sleep(60);
  console.log("discipline", JSON.stringify(s.disc.record.map((r) => r.kind + ":" + r.sanction)), "ouvertes", s.disc.open.map((g) => g.kind).join(","));
  await click(w, P.rail(doc, "Cabinet"));
  const tab = [...doc.querySelectorAll(".tab")].find((b) => texts(b) === "Équipe");
  if (!tab) console.log("onglets", [...doc.querySelectorAll(".tab")].map(texts).join(" | "), "rail", [...doc.querySelectorAll(".rail-btn")].map(texts).join(" | "), "modal", !!doc.querySelector(".modal"));
  await click(w, tab);
  ok(doc.querySelector(".equipe"), "page d'équipe affichée");
  const card = doc.querySelector(".eq-card-head");
  if (card) await click(w, card);
  ok(doc.querySelector(".eq-fiche") && /Expérience par domaine/.test(texts(doc.querySelector(".eq-fiche"))) && /Personnalité/.test(texts(doc.querySelector(".eq-fiche"))), "fiche : parcours, expérience, personnalité");
  const chip = [...doc.querySelectorAll(".eq-tabs .chip")].find((b) => /Recrutement/.test(texts(b)));
  await click(w, chip);
  ok(/Publier l'annonce/.test(texts(doc.querySelector(".equipe"))), "formulaire d'annonce");
  const chipT = [...doc.querySelectorAll(".eq-tabs .chip")].find((b) => /Tâches confiées/.test(texts(b)));
  await click(w, chipT);
  ok(doc.querySelector(".eq-taches"), "tâches confiées");
  const actif = s.order.map((id) => s.cases[id]).find((c) => c && c.status === "active");
  if (actif) { CR.store.bump(); await sleep(30); await P.openCase(w, doc, CR.caseTitle(s, actif).slice(0, 12)); ok(/Confier à l'équipe/.test(texts(doc.body)), "bouton Confier dans le dossier"); }
  console.log("warn", warn.length, warn.slice(0, 3).join("\n"));
  console.log("échecs:", echecs);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(echecs ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
