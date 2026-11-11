/* La Permanence — affaires générées, seconde partie : le client convoqué devant le tribunal (COPJ, CPPV, citation du parquet),
   le client convoqué en audition libre, et la victime (partie civile : prévenu convoqué, ou plainte classée et citation directe).
   Puis le branchement dans le jeu : GEN.params, GEN.build, GEN.lead (nouveaux clients), anciennes sauvegardes intactes. */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const CAT = CR.CAT;
  const GEN2 = CR.GEN2;
  const B = GEN2.B;
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const hTrib = (q) => (q.nature === "contravention" ? 9 * 60 + 30 : 13 * 60 + 30);
  const honos = (q, I) => { const g = (I.gravite || 0.4) + (q.prison >= 60 ? 0.2 : 0); return { forfait: Math.round((700 + g * 1800) / 50) * 50, heures: Math.round(5 + g * 8) }; };

  // ------------------------------------------------------------------ Audience correctionnelle ou de police, client prévenu
  function audienceDefense(x, api, def) {
    const { t, N, A, V, q, e } = x;
    const { cs } = api;
    const pcV = !!V && x.vt === "personne";
    const vict = pcV ? { prenom: V.prenom, nom: V.nom, g: V.g } : null;
    const pm = x.pmClient;
    const GA = GEN2.PR.gram(A);
    const D = (d) => CR.fmtDate(d, "long");
    // la société prévenue, représentée par son mandataire (art. 706-43 CPP)
    const ouvPM = pm ? [
      { who: "huissier", t: "Le tribunal !" },
      { who: "sys", t: "(Tout le monde se lève. Les juges prennent place ; la greffière ouvre le rôle.)" },
      { who: "president", t: `Affaire ${x.PM.nom}. Qui représente la société ?` },
      { who: "client", t: `${t.R.prenom} ${t.R.nom}, ${GEN2.PR.metier(t.R)}, munie d'un pouvoir.`.replace("munie", GEN2.PR.gram(t.R).f ? "munie" : "muni") },
      { who: "president", t: `La ${x.PM.nom}, ${x.PM.rcs}, dont le siège est ${x.PM.siege}, est poursuivie pour avoir, à ${x.SF.ville}, le ${D(t.d.faits)}, par l'intermédiaire de ${GA.civ} ${A.prenom} ${A.nom}, ${GEN2.PR.metier(A)}, agissant pour son compte, ${x.prevention(q)}. Faits prévus et réprimés par ${B.reprime(x)} et par les articles 121-2 et 131-38 du code pénal.` },
      t.dirigeantPoursuivi !== false ? { who: "president", t: `${GA.Civ} ${A.prenom} ${A.nom} comparaît également, à titre personnel, assisté${GA.e} de son conseil.` } : { who: "president", t: `${GA.Civ} ${A.nom} n'est pas poursuivi${GA.e} : le parquet n'a cité que la société.` },
      { who: "president", t: "La société peut, par la voix de son représentant, faire des déclarations, répondre aux questions ou se taire." },
    ].concat(vict ? [{ who: "president", t: `La victime, ${GEN2.PR.Civ(V)} ${V.prenom} ${V.nom}, est présente.` }] : []) : null;
    const versionPM = { reconnait: "La société reconnaît les manquements. Des mesures ont été prises depuis.", minimise: "Le matériel de sécurité était commandé ; il y a eu un retard. La société n'a rien voulu de tel.", nie: "La société conteste : la sécurité était organisée et déléguée." }[t.stance];
    return {
      title: GEN2.chambre(t), sub: x.TJ.paris ? "Tribunal judiciaire de Paris · Batignolles" : x.TJ.sub, decor: { scene: "salle" },
      steps: AUD.jugement(api, {
        prevenu: def.client, victime: vict && pcV ? vict : null, ouvertureSteps: ouvPM,
        prevention: `Vous êtes prévenu${e(A)} d'avoir, à ${x.SF.nom}, le ${CR.fmtDate(t.d.faits, "long")}, ${x.prevention(q)}. Faits prévus et réprimés par ${B.reprime(x)}.`,
        avantFond: B.stepsAvantFond(x),
        instruction: pm ? [
          { who: "president", t: `Je résume le dossier. ${N.resume}` },
          { who: "president", t: `${GEN2.PR.Civ(t.R)} ${t.R.nom}, qu'avez-vous à dire au nom de la société ?` },
          { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: versionPM, signal: "bon" }], else: [{ who: "client", t: `${versionPM} Enfin… je n'étais pas là, je l'avoue.`, fx: { cred: -2 }, signal: "mauvais" }] },
          { who: "president", t: "Le casier judiciaire de la société ne porte aucune condamnation." },
        ] : [
          { who: "president", t: `Je résume le dossier. ${N.resume}` },
          { who: "president", t: `${A.g === "f" ? "Madame" : "Monsieur"} ${A.nom}, qu'avez-vous à dire ?` },
          { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: N.version[t.stance], signal: t.stance === "nie" && t.preuves.length > 3 ? "mauvais" : "bon" }], else: [{ who: "client", t: `${N.version[t.stance]} Et puis… je sais pas, tout le monde ment dans ce dossier.`, fx: { cred: -2 }, signal: "mauvais" }] },
          { who: "president", t: B.casierLigne(x) },
          ...B.stepsRecidive(x),
        ].concat(x.PM ? [{ who: "president", t: `La ${x.PM.nom} est également poursuivie comme personne morale (art. 121-2), représentée par son propre conseil.` }] : []),
        card: { prompt: `Le président : « Maître, des éléments ${pm ? "sur la société" : "sur la personnalité"} ? »`, accept: pm ? ["G_mesures", "G_pm"] : ["G_attest", "G_attest_emploi", "G_heberg", "G_emploi", "G_indemn"], window: 12000, ok: { then: [{ who: "president", t: "Je les verse aux débats." }] }, miss: { then: [{ who: "president", t: "Rien, donc." }] } },
        pcAdverse: pcV ? [`${x.civ(V)} ${V.nom} se constitue partie civile. ${GEN2.PR.Il(V)} demande réparation : ${(N.prejudice || []).map((p) => p.label.toLowerCase()).join(", ") || "son préjudice moral"}.`] : null,
        requis: { base: (a) => B.requisDyn(x, a), avant: (a) => [pm ? "La société a tiré profit de la situation, ou l'a laissée s'installer : sa responsabilité est engagée (art. 121-2)." : t.stance === "reconnait" ? `${CR.cap(GEN2.PR.gram(A).prevenu)} reconnaît les faits ; le dossier les établit.` : "Les dénégations ne résistent pas aux pièces du dossier."].concat(t.rec && !a.cs.vars.recEcartee ? ["L'état de récidive légale double le maximum encouru."] : []).concat(x.conc.length ? ["Plusieurs infractions : le tribunal prononcera une peine unique, dans la limite du maximum le plus élevé."] : []), apres: B.requisApres(x) },
        defense: { max: 3, angles: [{ id: "peine", t: "La peine", sub: pm ? "Une amende à la mesure de la société." : "Ne pas contester ; une peine juste." }, { id: "relaxe", t: "La relaxe", sub: "Contester les faits ou la procédure." }].concat(t.q2 ? [{ id: "requalif", t: "La requalification", sub: "Une infraction moins grave." }] : []), args: pm ? B.argsPM(x) : B.argsDefense(x) },
      }),
    };
  }
  function deciderDefense(x, api, st, juridiction) {
    const { cs } = api;
    const perso = (x.pmClient ? ["G_mesures", "G_pm"] : ["G_attest", "G_attest_emploi", "G_heberg", "G_emploi", "G_indemn"]).filter((f) => CR.hasFact(cs, f)).length * 0.7 + (st.dernierMot === "regrets" ? 1 : 0) + 1;
    const c = cs.vars.conseilGav;
    return B.juger(x, api, st, () => PEN.juger(api, {
      st, juridiction, titre: juridiction === "tp" ? "Jugement du tribunal de police" : "Jugement correctionnel", prevenuNom: x.pmClient ? `la ${x.PM.nom}` : x.nom(x.A), pcNom: x.V ? x.nom(x.V) : "", pcF: x.V && x.V.g === "f",
      spec: B.spec(x, c ? (c === "silence" || c === "quitter" ? 0.03 : c === "partiel" ? 0.1 : 0.18) : null), qualif: B.qualif(x),
      personnalite: Math.round(perso), civil: x.V && x.vt === "personne" ? B.civil(x) : null,
    }));
  }
  // Les arguments de la société : pas d'emploi ni de garanties, mais l'amende proportionnée, les mesures prises, et le piège de la
  // délégation (elle ne protège jamais la personne morale)
  B.argsPM = function (x) {
    const out = B.argsDefense(x).filter((a) => !["emploi", "amenagement", "casier", "garanties", "revocation", "confusion"].includes(a.id));
    out.push({ id: "mesures", label: "Les mesures prises depuis les faits", say: "La société a réagi : formation, matériel, procédures, sans attendre l'audience.", cards: ["G_mesures"] });
    out.push({ id: "amende", label: "Une amende à la mesure de la société (art. 131-38)", say: "Le maximum est cinq fois l'amende des personnes physiques ; l'amende doit rester proportionnée à la taille et aux résultats de la société.", cards: ["G_pm", "CP_131-38"] });
    out.push({ id: "casier_pm", label: "Une société jamais condamnée", say: "La société n'a jamais été condamnée.", pertinent: () => true });
    return out;
  };
  // Tâches de personnalité, avant le tribunal
  const persoItems = (x, cs) => [
    { id: "employeur", label: "Obtenir une attestation de l'employeur", sub: "Contrat, fiches de paie, attestation.", fact: "G_attest_emploi", text: `Attestation de l'employeur : ${x.A.metier}, en poste.`, time: 15, cond: () => x.A.emploi },
    { id: "heberg", label: "Obtenir une attestation d'hébergement", sub: "Un justificatif de domicile.", fact: "G_attest", text: `Attestation d'hébergement et justificatif de domicile (${x.A.adresse}).`, time: 15 },
    { id: "indemn", label: "Proposer à la victime un premier versement", sub: "Un geste d'indemnisation, avant l'audience, par la CARPA.", fact: "G_indemn", text: "Un premier versement à la victime, avant l'audience, justifié par un reçu.", time: 20, cond: () => !!x.V && x.vt === "personne" },
  ];

  // =================================================================== CLIENT CONVOQUÉ DEVANT LE TRIBUNAL
  B.copj = function (p) {
    const x = B.ctx(p);
    const { t, N, PZ, I, A, e, nom, q } = x;
    const nomc = nom(A);
    const jur = q.jur;
    const H = honos(q, I);
    const facts = Object.assign({}, PZ.facts, { C_audience: { label: `L'audience du ${CR.fmtDate(t.d.audience, "long")}`, key: true }, C_convoc: { label: `La convocation remise le ${CR.fmtDate(t.d.convoc, "long")}`, key: true, why: "Le délai de l'article 385 (conclusions de nullité trois jours avant) ne joue que si la convocation date de plus de vingt jours." } });
    const pm = x.pmClient;
    const cjip = pm && t.cjip;
    if (pm) facts.G_mesures = { label: "Les mesures prises par la société depuis les faits", key: true, why: "Elles pèsent sur l'amende : le tribunal tient compte de la réaction de la personne morale." };
    const def = {
      id: p.id, camp: "defense", domaine: jur === "tp" ? "tp" : "tc", domaineLib: "pp_jugement", generated: true, gen2: true,
      title: pm ? `${x.PM.nom} — ${N.titre}` : `${A.nom} — ${N.titre}`,
      client: Object.assign(B.clientDef(x, pm ? t.R : A), { trust: 52 }),
      leadTask: PEN.rdvTask(pm ? `Recevoir le représentant de la ${x.PM.nom}` : `Recevoir ${x.civ(A)} ${A.nom} au cabinet`), leadPatience: 5,
      profile: { wealth: pm ? 5 : A.emploi ? 3 : 1, sens: 0.55, urgency: 0.7, temper: pk(x.r, ["anxieux", "marchandeur", "presse", "anxieux"]) },
      honoraires: pm ? { forfait: H.forfait * 3, heures: H.heures + 8, types: ["forfait", "temps"], resultat: "relaxe ou amende modérée" } : { forfait: H.forfait, heures: H.heures, types: ["forfait", "temps"], resultat: "relaxe ou peine aménagée" },
      mission: pm ? `Défense de la ${x.PM.nom}, personne morale, ${cjip ? "sur la proposition de convention judiciaire d'intérêt public puis, le cas échéant, " : ""}devant le tribunal correctionnel de ${x.TJ.ville}, jusqu'à la décision de première instance.` : `Défense de ${nomc} devant le ${jur === "tp" ? "tribunal de police" : "tribunal correctionnel"} de ${x.TJ.ville}, jusqu'à la décision de première instance.`,
      actors: { parquet: t.parquet, president: t.pres, opj: t.opj },
      proc: { stade: "convocation", nature: q.nature, faits: t.d.faits - p.day, infractions: q.textes.filter((k) => CR.TEXTES[k]).slice(0, 3), pcConstituee: !!x.V && x.vt === "personne" },
      init(api, cs) { cs.proc.faitsDay = t.d.faits; cs.proc.prescStart = t.d.convoc; },
      facts,
      calls: { intake: Object.assign({ scene: "conference", kind: "meet", label: "Rendez-vous au cabinet", start: null, patience: 90 }, pm ? GEN2.PR.prevenuPM(x, { day: p.day, cjip: !!cjip }) : GEN2.PR.prevenu(x, { mode: "copj", day: p.day, tp: t.voie === "citation_parquet" })) },
      advice: [
        { id: "c_dossier", t: "Je vais demander la copie du dossier : on ne plaide rien sans l'avoir lu." },
        { id: "c_pieces", t: "Rassemblez vos fiches de paie, votre contrat et un justificatif de domicile." },
        { id: "c_contact", t: "Ne prenez aucun contact avec la victime d'ici l'audience." },
        { id: "c_absent", t: "Inutile de venir à l'audience, je vous représenterai." },
      ],
      docs: PZ.docs, docTitles: PZ.titres, anomalies: PZ.anomalies,
      penal: { no: ["actes", "copie", "requete"], copieTC: { docs: PZ.listes.copie, from: "Greffe correctionnel", subject: `Copie de la procédure — ${nomc}`, texte: "Vous trouverez ci-joint la copie de la procédure : procès-verbaux, pièces et bulletin n° 1 du casier judiciaire." } },
      flow: { tasks: PEN.tasks },
      tasks(api, T) {
        const { cs, s } = api;
        // la convention judiciaire d'intérêt public : accepter (validation en audience publique) ou refuser (le procès)
        if (cjip && cs.status === "active" && !cs.vars.cjip) {
          T({ id: "cjip_ok", label: "Accepter la CJIP au nom de la société", sub: `Amende d'intérêt public : ${CR.money(t.cjip.amende)}. Pas de culpabilité, pas de casier ; validation en audience publique.`, kind: "meet", time: 30, run: () => { CR.spend(s, 30, "meet"); api.run("_cjipOui"); return null; } });
          T({ id: "cjip_non", label: "Refuser la CJIP : aller au procès", sub: "Le parquet citera la société devant le tribunal correctionnel ; l'amende encourue est le quintuple (art. 131-38).", kind: "meet", time: 20, run: () => { CR.spend(s, 20, "meet"); api.run("_cjipNon"); return null; } });
          return;
        }
        PEN.copieTask(api, T, { label: "Demander la copie de la procédure", sub: "Au greffe correctionnel. Sans elle, ni nullité ni plaidoirie sérieuse." });
        if (cs.status === "active" && cs.proc.audience && cs.proc.audience.day >= api.s.day && cs.proc.audience.mode !== "cjip") PEN.persoTasks(api, T, pm ? [{ id: "mesures", label: "Réunir les mesures prises par la société", sub: "Plan de prévention, formations, matériel acheté depuis les faits.", fact: "G_mesures", text: "Les mesures prises depuis les faits : formations, matériel, procédure de contrôle.", time: 20 }] : persoItems(x, cs));
      },
      on: {
        arrive(api) {
          const { cs } = api;
          cs.status = "lead";
          if (pm) api.mail({ from: `${t.R.prenom} ${t.R.nom}`, subject: cjip ? `${x.PM.nom} — une proposition du parquet` : `${x.PM.nom} — convocation au tribunal`, kind: "email", body: [[cjip ? `Maître, je suis ${GEN2.PR.metier(t.R)} de la ${x.PM.nom}. Le parquet propose à la société une convention judiciaire d'intérêt public, pour des faits de ${CAT.ficheDe(CAT.INF[t.inf], t.f).nom.toLowerCase()}. Pouvez-vous nous recevoir rapidement ?` : `Maître, je suis ${GEN2.PR.metier(t.R)} de la ${x.PM.nom}. La société est convoquée devant le tribunal correctionnel le ${CR.fmtDate(t.d.audience, "long")}, pour des faits de ${CAT.ficheDe(CAT.INF[t.inf], t.f).nom.toLowerCase()}. Pouvez-vous la défendre ?`]] });
          else api.mail({ from: nomc, subject: "Convocation au tribunal", kind: "email", body: [[`Maître, j'ai reçu une convocation devant le ${jur === "tp" ? "tribunal de police" : "tribunal correctionnel"} pour le ${CR.fmtDate(t.d.audience, "long")}. On m'accuse de ${CAT.ficheDe(CAT.INF[t.inf], t.f).nom.toLowerCase()}. Pouvez-vous me défendre ?`]] });
          api.schedule(def.leadPatience, "_leadExpire");
        },
        engaged(api) {
          const { cs } = api;
          if (cjip) {
            api.mail({ from: t.pnf ? "Parquet national financier" : x.TJ.parquet, subject: `Proposition de CJIP — ${x.PM.nom}`, kind: "greffe", doc: "proposition_cjip", title: "Proposition de CJIP", body: [[`Maître, vous trouverez ci-joint la proposition de convention judiciaire d'intérêt public adressée à votre cliente (art. 41-1-2). Réponse attendue sous ${t.cjip.delaiReponse} jours.`]] });
            api.schedule(t.cjip.delaiReponse, "_cjipExpire");
            CR.PROC.stade(api, "parquet", "Proposition de convention judiciaire d'intérêt public (art. 41-1-2).");
            return;
          }
          api.mail({ from: pm ? t.R.prenom + " " + t.R.nom : nomc, subject: pm ? "La convocation de la société" : "Ma convocation", kind: "email", doc: "convocation", title: PZ.titres.convocation, body: [["Voici la convocation, maître."]] });
          CR.PROC.fixAudience(api, { day: t.d.audience, min: hTrib(q), juridiction: jur, mode: "convocation", convocDay: t.d.convoc, president: t.pres, script: "tc", done: "apresTC", onMiss: "_absent", title: `Audience — ${GEN2.chambre(t)}`, duree: 60 });
          CR.PROC.stade(api, "convocation", `${PZ.titres.convocation} : audience du ${CR.fmtDate(t.d.audience, "long")}.`);
          if (cs.advice.includes("c_absent")) CR.erreur(api.s, cs, { id: "absent_conseil", texte: "Vous avez dit au client qu'il était inutile de venir à l'audience.", sanction: "Un prévenu absent sans excuse est jugé par jugement contradictoire à signifier ; il perd l'occasion d'être entendu.", regul: "Lui demander de venir." });
        },
        // n° 12 : la CJIP acceptée (audience de validation), refusée (le procès), ou laissée sans réponse
        _cjipOui(api) {
          const { s, cs } = api;
          cs.vars.cjip = "accepte";
          let day = CR.rollForward(s.day + R.int(s, 8, 18));
          while (!CR.isBusinessDay(day)) day++;
          CR.PROC.fixAudience(api, { day, min: 11 * 60, juridiction: "tc", mode: "cjip", convocDay: s.day, president: t.pres, script: "cjip", done: "apresCJIP", onMiss: "_absentCJIP", title: "Validation de la CJIP — président du tribunal judiciaire", duree: 30 });
          CR.PROC.stade(api, "parquet", "La société accepte la convention ; audience publique de validation (art. 41-1-2).");
        },
        _cjipNon(api) { api.cs.vars.cjip = "refuse"; api.run("_citerSociete"); },
        _cjipExpire(api) { const { cs } = api; if (cs.vars.cjip || cs.status !== "active") return; cs.vars.cjip = "refuse"; CR.erreur(api.s, cs, { id: "cjip_silence", texte: "La proposition de CJIP est restée sans réponse.", sanction: "Le parquet a considéré le silence comme un refus et cité la société.", regul: "Répondre dans le délai fixé par le parquet." }); api.run("_citerSociete"); },
        _citerSociete(api) {
          const { cs } = api;
          api.mail({ from: t.pnf ? "Parquet national financier" : x.TJ.parquet, subject: `Citation de la ${x.PM.nom}`, kind: "greffe", doc: "convocation", title: PZ.titres.convocation, body: [[`La convention ayant été refusée, la société est citée devant le tribunal correctionnel pour le ${CR.fmtDate(t.d.audience, "long")}.`]] });
          CR.PROC.fixAudience(api, { day: t.d.audience, min: hTrib(q), juridiction: jur, mode: "convocation", convocDay: Math.max(t.d.convoc, api.s.day - 30), president: t.pres, script: "tc", done: "apresTC", onMiss: "_absent", title: `Audience — ${GEN2.chambre(t)}`, duree: 60 });
          CR.PROC.stade(api, "convocation", `Citation de la société : audience du ${CR.fmtDate(t.d.audience, "long")}.`);
        },
        apresCJIP(api) { CR.closeCase(api.s, api.cs, { type: "done", detail: `convention judiciaire d'intérêt public validée : ${CR.money(t.cjip.amende)}` }); },
        _absentCJIP(api) { CR.erreur(api.s, api.cs, { id: "absent", texte: "Vous n'étiez pas à l'audience de validation.", sanction: "La société a été entendue sans son avocat.", regul: "Aucune." }); api.run("apresCJIP"); },
        _contesterRecidive(api, { motif }) { return B.contesterRecidive(x, api, motif); },
        _exceptionN12(api, { quoi }) { return B.exceptionN12(x, api, quoi); },
        _absent(api) { CR.erreur(api.s, api.cs, { id: "absent", texte: "Vous n'étiez pas à l'audience.", sanction: "Le prévenu a été jugé sans avocat.", regul: "Appel dans les dix jours." }); CR.closeCase(api.s, api.cs, { type: "condamnation", detail: "jugé sans avocat" }); },
        decider(api, { st }) { return deciderDefense(x, api, st, jur); },
        apresTC(api, res) { CR.closeCase(api.s, api.cs, PEN.issue(api, res.decision || {})); },
      },
      audiences: Object.assign({ tc: (api) => audienceDefense(x, api, def) }, cjip ? {
        cjip: (api) => ({ title: "Validation de la convention judiciaire d'intérêt public", sub: `${x.TJ.tj} · audience publique`, decor: { scene: "salle" }, steps: [
          { who: "huissier", t: "Le tribunal !" },
          { who: "president", t: `Nous sommes réunis pour la validation de la convention judiciaire d'intérêt public conclue entre le procureur de la République et la ${x.PM.nom} (art. 41-1-2).` },
          { who: "parquet", t: `La société a tiré avantage des faits ; la convention prévoit une amende d'intérêt public de ${CR.money(t.cjip.amende)}${t.cjip.programme ? ` et un programme de mise en conformité de ${t.cjip.mois} mois sous le contrôle de l'Agence française anticorruption` : ""}. Elle respecte le plafond de 30 % du chiffre d'affaires moyen.` },
          { who: "president", t: `${GEN2.PR.Civ(t.R)} ${t.R.nom}, vous confirmez l'accord de la société ?` },
          { who: "client", t: "Oui, madame la présidente." },
          { who: "president", t: "Le recours à la convention est justifié, la procédure régulière, l'amende proportionnée aux avantages tirés : la convention est validée, sans déclaration de culpabilité ni inscription au casier judiciaire. La société dispose de dix jours pour se rétracter." },
        ] }),
      } : {}),
      debrief(api, o) {
        const { cs } = api;
        const items = [{ kind: "rule", text: `Nullités : avant toute défense au fond, et par conclusions déposées trois jours avant l'audience quand la convocation date de plus de vingt jours (art. 385).` }];
        if (!cs.vars.copieDemandee && cs.vars.cjip !== "accepte") items.push({ kind: "bad", text: "Vous n'avez pas demandé la copie de la procédure." });
        return items.concat(B.irrDebrief(x, cs), B.debriefN12(x, cs), cs.vars.debriefJugement || []);
      },
      epilogue(api, o) { const pn = api.cs.vars.peine; if (o.type === "relaxe") return pm ? `La ${x.PM.nom} a été relaxée.` : `${nomc} a été relaxé${e(A)}.`; if (api.cs.vars.cjip === "accepte") return `La convention judiciaire d'intérêt public a été validée : ${CR.money(t.cjip.amende)}, sans déclaration de culpabilité.`; return pn ? `${pn.texte}.` : "Dossier terminé."; },
      fiche(api, o) { return { phrase: `${CR.cap(q.label)}, ${t.voie === "citation_parquet" ? "citation devant le tribunal de police" : t.voie === "cppv" ? "convocation par procès-verbal" : "convocation par officier de police judiciaire"}, avocat ${pm ? `de la ${x.PM.nom}` : `de ${nomc}`}.`, notions: B.notions(x).concat([{ titre: "Les nullités devant le tribunal", regle: "Soulevées in limine litis, avant toute défense au fond ; par conclusions déposées trois jours au moins avant l'audience lorsque la convocation date de plus de vingt jours.", art: "art. 385 et 802 CPP", prog: "pp_jugement" }], B.notionsN12(x)), piege: t.rec ? "Vérifier les conditions de la récidive sur le bulletin n° 1 : définitivité, délai, assimilation." : x.conc.length ? "Plusieurs infractions : une seule peine par nature, et jamais deux qualifications pour un même fait." : "Demander la copie de la procédure tôt, la lire pièce par pièce, déposer les conclusions à temps.", devenir: api.def.epilogue(api, o) }; },
      corrige: () => B.corrige(x),
    };
    def.calls.intake.start = def.calls.intake.topics.map((tp) => tp.id);
    return def;
  };

  // =================================================================== CLIENT CONVOQUÉ EN AUDITION LIBRE
  B.al = function (p) {
    const x = B.ctx(p);
    const { t, N, PZ, I, A, e, nom, q } = x;
    const nomc = nom(A);
    const H = honos(q, I);
    const jour = t.d.audition;
    const quitter = t.irr.includes("al_quitter");
    const docs = Object.assign({}, PZ.docs, {
      convocation_al: () => ({ title: "Convocation en audition libre", kind: "pv", entete: [`${x.SF.paris ? "Préfecture de police" : "Police nationale"} · ${x.SF.comm}`], paras: [[`${x.civ(A)} ${nomc} est invité${e(A)} à se présenter le ${CR.fmtDate(jour, "dow")} à 14 heures, pour être entendu${e(A)} librement sur des faits ${CAT.typo("de " + CAT.ficheDe(CAT.INF[t.inf], t.f).nom.toLowerCase())} (art. 61-1).`], ["Il peut être assisté par un avocat."]] }),
    });
    const docTitles = Object.assign({}, PZ.titres, { convocation_al: "Convocation en audition libre" });
    const facts = Object.assign({}, PZ.facts, { K_convoc: { label: "La date de l'audition libre", key: true } });
    const def = {
      id: p.id, camp: "defense", domaine: "tc", domaineLib: "pp_enquete", generated: true, gen2: true,
      title: `${A.nom} — ${N.titre}`,
      client: Object.assign(B.clientDef(x, A), { trust: 55 }),
      leadTask: PEN.rdvTask(`Recevoir ${x.civ(A)} ${A.nom} au cabinet`), leadPatience: 3,
      profile: { wealth: A.emploi ? 3 : 2, sens: 0.6, urgency: 0.8, temper: pk(x.r, ["anxieux", "presse", "marchandeur"]) },
      honoraires: { forfait: Math.round(H.forfait * 0.8 / 50) * 50, heures: H.heures, types: ["forfait", "temps"], resultat: "classement ou alternative aux poursuites" },
      mission: `Assistance de ${nomc} lors de son audition libre et auprès du parquet ; en cas de poursuite, défense devant le tribunal jusqu'à la décision de première instance.`,
      actors: { opj: t.opj, parquet: t.parquet, president: t.pres },
      proc: { stade: "enquete", nature: "delit", faits: t.d.faits - p.day, infractions: q.textes.filter((k) => CR.TEXTES[k]).slice(0, 3) },
      init(api, cs) { cs.vars.auditionDay = jour; cs.proc.faitsDay = t.d.faits; cs.proc.prescStart = t.d.plainte; },
      facts, docs, docTitles, anomalies: PZ.anomalies,
      calls: { intake: Object.assign({ scene: "conference", kind: "meet", label: "Rendez-vous au cabinet", start: null, patience: 80 }, GEN2.PR.prevenu(x, { mode: "al", day: p.day, jour, infNom: CAT.ficheDe(CAT.INF[t.inf], t.f).nom.toLowerCase() })) },
      advice: [
        { id: "k_quitter", t: "Souvenez-vous que vous pouvez quitter les locaux à tout moment : c'est une audition libre." },
        { id: "k_taire", t: "Vous avez le droit de vous taire ; nous déciderons ensemble de ce que vous direz." },
        { id: "k_seul", t: "Allez-y seul, ce n'est qu'une formalité." },
      ],
      penal: { no: ["actes", "copie", "requete"], copieTC: { docs: PZ.listes.copie } },
      gav: (api) => ({
        mode: "audition", attente: 15,
        arrivee: [`${x.SF.comm}, 14 heures. ${(CR.acteur(t.opj) || { nom: "L'officier" }).nom} vous reçoit dans un bureau sans fenêtre, un dossier devant ${(CR.acteur(t.opj) || {}).look && CR.acteur(t.opj).look.g === "f" ? "elle" : "lui"}.`],
        droits: [
          CAT.typo(`${GEN2.PR.Civ(A)} ${A.nom}, vous êtes entendu${e(A)} librement sur des faits de ${q.label}, commis à Paris le ${CR.fmtDate(t.d.faits, "long")}.`),
          quitter ? null : { t: `Vous pouvez quitter à tout moment les locaux où vous êtes entendu${e(A)}.`, f: "K_droit_quitter" },
          quitter ? { t: "Vous avez le droit de faire des déclarations, de répondre aux questions ou de vous taire, d'être assisté par un avocat et de bénéficier de conseils juridiques gratuits.", flag: "al_quitter" } : "Vous avez le droit de faire des déclarations, de répondre aux questions ou de vous taire.",
          quitter ? null : `Vous êtes assisté${e(A)} de votre avocat. Vous pouvez bénéficier de conseils juridiques gratuits.`,
        ].filter(Boolean),
        conseils: [
          { id: "silence", t: "Garder le silence", sub: "Il ne dit rien. Le parquet décidera sans sa version." },
          { id: "partiel", t: "Écouter d'abord, puis reconnaître le minimum", sub: "Il admet ce que le dossier établit, conteste le reste." },
          { id: "expliquer", t: "Tout expliquer tout de suite", sub: "Il donne sa version complète, avant d'entendre les questions." },
          { id: "quitter", t: "Écourter : il quitte les locaux après les premières questions", sub: "C'est son droit. L'audition s'arrête là." },
        ],
        audition: (a, ctx) => { const all = N.audition.map((qq) => ({ q: qq.q, a: { silence: qq.a.silence, partiel: qq.a.partiel, expliquer: qq.a.expliquer, quitter: "…" } })); return ctx.conseil === "quitter" ? all.slice(0, 1) : all; },
        questions: [
          { id: "q_plainte", q: "Capitaine, quelles sont les pièces qui fondent la convocation ?", a: "(L'officier) : Vous les verrez si le parquet poursuit, maître.", sensible: true },
          { id: "q_contexte", q: `${GEN2.PR.Civ(A)} ${A.nom}, souhaitez-vous ajouter un élément de contexte ?`, a: (N.qA && N.qA[0] && N.qA[0].a[0]) || "Je n'ai rien à ajouter.", anodine: true },
        ],
        observations: (quitter ? [{ id: "obs_al_quitter", t: "Le droit de quitter à tout moment les locaux n'a pas été notifié à la personne entendue (art. 61-1, 2°).", flag: "al_quitter" }] : []).concat([{ id: "obs_contexte", t: "Mon client s'est présenté librement et a répondu aux convocations ; il dispose d'attaches stables." }]),
        get relecture() {
          const c = api.cs.vars.conseilGav;
          if (c === "silence" || c === "quitter") return { segs: [{ t: "La personne déclare : Je ne souhaite pas répondre aux questions." }] };
          return { segs: [{ t: "La personne déclare :" }, { t: N.version[t.stance].split(/(?<=[.!?])\s/)[0] }, t.erreurPV ? { t: "Je savais très bien ce que je faisais.", erreur: true, correct: "Je n'ai pas mesuré les conséquences." } : { t: "Je n'ai pas mesuré les conséquences." }] };
        },
        issue: (a, ctx) => {
          const { s, cs } = a;
          cs.flags.auditionFaite = s.day;
          if (ctx.conseil === "quitter") cs.flags.parti = true;
          a.run("_transmission");
          return { texte: [ctx.conseil === "quitter" ? `${nomc} se lève : « Je m'arrête là. » L'officier note l'heure : « C'est votre droit. Le dossier part au parquet. »` : "« Le dossier part au parquet, maître. Vous aurez des nouvelles. »", "Le parquet décidera dans les semaines qui viennent."] };
        },
      }),
      flow: { tasks: PEN.tasks },
      tasks(api, T) {
        const { s, cs } = api;
        if (!cs.flags.auditionFaite && s.day <= jour) {
          const tard = s.day === jour && s.min > 15 * 60;
          T({ id: "audition", label: `Assister ${A.prenom} à son audition libre`, sub: s.day < jour ? `${CR.cap(CR.fmtDate(jour, "dowshort"))} à 14 heures, ${x.SF.commCourt}.` : tard ? "Trop tard : l'audition a commencé." : "Aujourd'hui à 14 heures.", kind: "meet", time: 0, where: CR.MONDE.placeComm(s, x.SF), urgent: s.day === jour, enabled: s.day === jour && !tard, why: s.day < jour ? `Elle a lieu ${CR.fmtDate(jour, "dowshort")}.` : "", run: () => { if (s.min < 14 * 60) CR.spend(s, 14 * 60 - s.min, "idle", { fixed: true, busy: true }); return { scene: "gav" }; } });
        }
        if (cs.proc.audience) { PEN.copieTask(api, T, { label: "Demander la copie de la procédure", sub: "Au greffe : le dossier du parquet, avec le procès-verbal d'audition." }); if (cs.proc.audience.day >= s.day) PEN.persoTasks(api, T, persoItems(x, cs)); }
      },
      on: {
        arrive(api) {
          const { cs } = api;
          cs.status = "lead";
          api.mail({ from: nomc, subject: "Convocation au commissariat", kind: "email", body: [[`Maître, je suis convoqué${e(A)} au ${x.SF.commCourt} le ${CR.fmtDate(jour, "dow")} pour une « audition libre ». On me parle de ${CAT.ficheDe(CAT.INF[t.inf], t.f).nom.toLowerCase()}. Pourriez-vous m'accompagner ?`]] });
          api.schedule(def.leadPatience, "_leadExpire");
        },
        engaged(api) {
          const { cs } = api;
          api.mail({ from: nomc, subject: "Ma convocation", kind: "email", doc: "convocation_al", title: "Convocation en audition libre", body: [["Voici la convocation, maître."]] });
          api.at(jour, "_auditionCheck", {}, 16 * 60);
          if (cs.advice.includes("k_seul")) CR.erreur(api.s, cs, { id: "seul", texte: "Vous avez conseillé au client d'aller seul à son audition.", sanction: "Il risque de tout dire sans conseil.", regul: "L'accompagner." });
        },
        _auditionCheck(api) {
          const { s, cs } = api;
          if (cs.flags.auditionFaite || cs.status !== "active") return;
          cs.flags.auditionFaite = s.day;
          cs.vars.conseilGav = "expliquer";
          CR.erreur(s, cs, { id: "audition_seul", texte: `${nomc} a été entendu${e(A)} sans vous.`, sanction: "Ses déclarations sont au dossier.", regul: "Aucune." });
          api.trust(-20);
          api.run("_transmission");
        },
        _transmission(api) { api.schedule(R.int(api.s, 14, 26), "_decisionParquet"); },
        _decisionParquet(api) {
          const { s, cs } = api;
          const c = cs.vars.conseilGav || "expliquer";
          const obs = t.irr.some((id) => cs.flags["obs_" + id]) ? 1 : 0;
          const w = GEN2.voiesPossibles(t.inf, q, false);
          delete w.ci;
          const opts = Object.entries(w).map(([voie, poids]) => ({ voie, poids: poids * (voie === "classement" ? 1 + obs * 1.5 + (c === "silence" ? 0.3 : 0) : voie === "alternative" ? (A.casier ? 0.5 : 1.6) : voie === "crpc" ? (c === "expliquer" ? 1.4 : 0.7) : 1) }));
          const choix = opts.length ? CR.ACT.parquetChoix(api, opts).voie : "copj";
          cs.vars.decisionParquet = choix;
          cs.vars.voie = choix;
          if (choix === "classement") { api.mail({ from: x.TJ.parquet, subject: "Avis de classement sans suite", kind: "greffe", body: [[`La procédure ouverte contre ${nomc} fait l'objet d'un classement sans suite : infraction insuffisamment caractérisée.`]] }); CR.PROC.stade(api, "classement", "Classement sans suite."); CR.closeCase(s, cs, { type: "classement" }); return; }
          if (choix === "alternative") { api.mail({ from: `${x.TJ.parquet} — délégué du procureur`, subject: "Alternative aux poursuites", kind: "greffe", body: [[`${nomc} est convoqué${e(A)} devant le délégué du procureur pour ${pk(CR.seeded(t.sig + ":alt"), ["un avertissement pénal probatoire", "une composition pénale", "un stage de citoyenneté"])} (art. 41-1 et 41-2).`]] }); CR.PROC.stade(api, "alternative", "Alternative aux poursuites."); CR.closeCase(s, cs, { type: "alternative", detail: "alternative aux poursuites" }); return; }
          if (choix === "crpc" || choix === "op") { api.mail({ from: x.TJ.parquet, subject: choix === "crpc" ? "Convocation en CRPC" : "Ordonnance pénale requise", kind: "greffe", body: [[choix === "crpc" ? `${nomc} est convoqué${e(A)} en vue d'une comparution sur reconnaissance préalable de culpabilité (art. 495-7).` : `Le parquet requiert une ordonnance pénale contre ${nomc} (art. 495).`]] }); CR.closeCase(s, cs, { type: "done", detail: choix === "crpc" ? "convocation en CRPC" : "ordonnance pénale requise" }); return; }
          let day = CR.rollForward(s.day + R.int(s, 35, 60));
          while (CR.dow(day) !== 2 || !CR.isBusinessDay(day)) day++;
          CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "convocation", convocDay: s.day, president: t.pres, script: "tc", done: "apresTC", onMiss: "_absent", title: `Audience — ${GEN2.chambre(t)}`, duree: 60 });
          CR.PROC.stade(api, "convocation", "Le parquet poursuit : convocation devant le tribunal correctionnel.");
          api.mail({ from: nomc, subject: "Convocation au tribunal", kind: "email", important: true, body: [[`Maître, j'ai reçu une convocation au tribunal correctionnel pour le ${CR.fmtDate(day, "dow")}. Qu'est-ce qu'on fait ?`]] });
        },
        _absent(api) { CR.erreur(api.s, api.cs, { id: "absent", texte: "Vous n'étiez pas à l'audience.", sanction: "Le prévenu a été jugé sans avocat.", regul: "Appel dans les dix jours." }); CR.closeCase(api.s, api.cs, { type: "condamnation", detail: "jugé sans avocat" }); },
        decider(api, { st }) { return deciderDefense(x, api, st, "tc"); },
        apresTC(api, res) { CR.closeCase(api.s, api.cs, PEN.issue(api, res.decision || {})); },
      },
      audiences: { tc: (api) => audienceDefense(x, api, def) },
      debrief(api, o) {
        const { cs } = api;
        const items = [];
        if (cs.vars.decisionParquet) items.push({ kind: "info", text: `Décision du parquet : ${{ classement: "classement sans suite", alternative: "alternative aux poursuites", copj: "poursuite devant le tribunal", crpc: "CRPC", op: "ordonnance pénale" }[cs.vars.decisionParquet] || cs.vars.decisionParquet}.` });
        return items.concat(B.irrDebrief(x, cs), cs.vars.debriefJugement || []);
      },
      epilogue(api, o) { const pn = api.cs.vars.peine; if (o.type === "classement") return `Classement sans suite : ${nomc} n'entendra plus parler de cette affaire.`; if (o.type === "alternative") return `${nomc} a accepté l'alternative. Pas de procès, pas de casier.`; if (o.type === "relaxe") return `${nomc} a été relaxé${e(A)}.`; return pn ? `${pn.texte}.` : o.detail ? CR.cap(o.detail) + "." : "Dossier terminé."; },
      fiche(api, o) { return { phrase: `${CR.cap(q.label)}, audition libre, avocat de ${nomc}.`, notions: B.notions(x).concat([{ titre: "L'audition libre", regle: "La personne soupçonnée entendue librement est informée de la qualification, de la date et du lieu des faits, de son droit de quitter les locaux à tout moment, de se taire et d'être assistée d'un avocat.", art: "art. 61-1 CPP", prog: "pp_enquete" }]), piege: "Écouter la notification des droits jusqu'au bout : chaque droit manquant compte.", devenir: api.def.epilogue(api, o) }; },
      corrige: () => B.corrige(x),
    };
    def.calls.intake.start = def.calls.intake.topics.map((tp) => tp.id);
    return def;
  };

  // =================================================================== LA VICTIME (partie civile)
  B.pc = function (p) {
    const x = B.ctx(p);
    const { t, N, PZ, I, A, V, e, nom, q } = x;
    const P = t.client === "P" ? t.P : V;
    const nomA = nom(A), nomP = nom(P);
    const classe = t.d.voiePc === "classe";
    const jur = q.jur;
    const deces = !!t.P;
    const postes = (N.prejudice || []).map((po) => ({ id: po.id, label: po.label, demande: po.demande, base: po.base != null ? po.base : po.demande, needs: po.piece ? ["P_" + po.id] : null, justif: po.piece ? ["P_" + po.id] : null, sansJustif: 0.5 }));
    const H = honos(q, I);
    const facts = Object.assign({}, PZ.facts, {
      V_date: { label: `Les faits du ${CR.fmtDate(t.d.faits, "long")}`, key: true, why: classe ? `Point de départ de la prescription (${q.prescAns} an${q.prescAns > 1 ? "s" : ""}), interrompue par chaque acte d'enquête (art. 9-2).` : "" },
      V_auteur: { label: `L'auteur : ${nomA}`, key: true, cat: "party", party: nomA },
      V_faits: { label: "Ce qui s'est passé" },
    });
    const qualifs = [{ t: `${CR.cap(q.label)}, faits prévus et réprimés par ${CAT.courtLong(q.court)}.`, ok: true }];
    const autre = q.nature === "contravention" ? "Violences volontaires ayant entraîné une incapacité totale de travail de plus de huit jours (art. 222-11 du code pénal)." : "Contravention de cinquième classe (art. R. 625-1 du code pénal).";
    qualifs.push({ t: autre, ok: false, defect: "qualif:nature" }, { t: "Tentative de meurtre.", ok: false, defect: "qualif:fantaisiste" });
    const def = {
      id: p.id, camp: "pc", domaine: "pc", domaineLib: "pp_action", generated: true, gen2: true,
      title: `${P.nom} — ${N.titre}`,
      client: Object.assign(B.clientDef(x, P), { trust: 55 }),
      leadTask: PEN.rdvTask(`Recevoir ${x.civ(P)} ${P.nom} au cabinet`), leadPatience: 5,
      profile: { wealth: P.emploi ? 3 : 2, sens: 0.65, urgency: 0.6, temper: pk(x.r, ["anxieux", "marchandeur", "presse"]) },
      honoraires: { forfait: Math.round((H.forfait + 300) / 50) * 50, heures: H.heures + 2, types: ["forfait", "temps"], resultat: "indemnisation" },
      mission: `Assistance de ${nomP}, ${deces ? "proche de la victime décédée" : "victime"}, pour obtenir la condamnation de ${nomA} et la réparation du préjudice, jusqu'à la décision de première instance.`,
      actors: { parquet: t.parquet, president: t.pres },
      proc: { stade: classe ? "classement" : "convocation", nature: q.nature, faits: t.d.faits - p.day, infractions: q.textes.filter((k) => CR.TEXTES[k]).slice(0, 3) },
      init(api, cs) {
        cs.proc.faitsDay = t.d.faits;
        if (classe) {
          cs.flags.classement = true;
          cs.proc.prescStart = t.d.acte;
          cs.proc.events.push({ day: t.d.faits + 1, text: `Plainte de ${nomP} au ${x.SF.commCourt}.` }, { day: t.d.acte, text: `Audition de ${nomA} par les enquêteurs.` }, { day: t.d.classement, text: "Classement sans suite : infraction insuffisamment caractérisée." });
          api.at(CR.addYears(t.d.acte, q.prescAns) + 1, "_prescriptionCheck");
        } else cs.proc.prescStart = t.d.mesure;
      },
      facts,
      calls: { intake: Object.assign({ scene: "conference", kind: "meet", label: "Rendez-vous au cabinet", start: null, patience: 100 }, GEN2.PR.victime(x, { classe, day: p.day })) },
      advice: [
        { id: "v_pieces", t: "Apportez-moi toutes les factures, certificats et attestations : en justice, un préjudice se prouve." },
        { id: "v_contact", t: "Ne répondez à aucune provocation de sa part et ne le contactez pas." },
        { id: "v_temps", t: "Nous avons tout notre temps." },
      ],
      docs: PZ.docs, docTitles: PZ.titres, anomalies: {},
      penal: {
        no: ["actes", "copie", "nullite"],
        chiffrage: { postes, art475: deces ? 2500 : 1200 },
        copieTC: { docs: classe ? ["pv_victime", "pv_auteur"].concat(PZ.listes.copie.filter((k) => !["pv_victime"].includes(k))) : PZ.listes.copie, from: x.TJ.parquet, subject: classe ? "Copie de la procédure classée" : `Copie de la procédure — ${nomA}`, texte: classe ? "Vous trouverez la copie de la procédure classée sans suite." : "Vous trouverez la copie de la procédure." },
        citation: classe ? { juridiction: jur, heure: hTrib(q), prevenu: ["V_auteur"], faits: ["V_faits", "G_temoin_pv", "G_plainte"], dateFaits: ["V_date"], qualifs } : undefined,
      },
      flow: { tasks: PEN.tasks },
      tasks(api, T) {
        const { cs } = api;
        const Cc = cs.vars.citation;
        PEN.copieTask(api, T, { label: classe ? "Demander la copie de la procédure classée" : "Demander la copie de la procédure", sub: classe ? "Au parquet. En citation directe, c'est vous qui apportez la preuve." : "Au greffe correctionnel, pour préparer la constitution.", where: "palais" });
        if (classe) {
          if (!cs.vars.dateAudiencement && !Cc) T({ id: "audiencement", label: "Obtenir une date d'audience au greffe", sub: "La citation doit indiquer la date ; elle sera délivrée au moins quinze jours avant (art. 552).", kind: "admin", time: 20, where: "palais", run: () => { PEN.audiencement(api, jur); return null; } });
          if (cs.vars.dateAudiencement && !Cc && !CR.drafted(cs, "citation")) T({ id: "citation", label: "Rédiger la citation directe", sub: "Juridiction, prévenu, faits, qualification, demandes. Puis la remettre à un commissaire de justice.", kind: "draft", time: 100, urgent: true, run: () => ({ scene: "draft", tpl: "citation" }) });
        }
        PEN.prepPC(api, T, `Préparer ${P.prenom} à l'audience`);
      },
      on: {
        arrive(api) {
          const { cs } = api;
          cs.status = "lead";
          api.mail({ from: nomP, subject: deces ? "La mort de " + nom(t.V) : "Demande de rendez-vous", kind: "email", body: [[classe ? `Maître, ma plainte contre ${nomA} a été classée sans suite. Je ne comprends pas. Pouvez-vous m'aider ?` : `Maître, ${nomA} sera jugé le ${CR.fmtDate(t.d.audience, "long")} pour ce qu'il ${deces ? "a fait à " + nom(t.V) : "m'a fait"}. Je voudrais être représenté${e(P)}.`]] });
          api.schedule(def.leadPatience, "_leadExpire");
        },
        engaged(api) {
          const { cs } = api;
          for (const k of Object.keys(PZ.docs).filter((k) => k.startsWith("justif_"))) api.doc(k, PZ.titres[k]);
          if (classe) api.mail({ from: nomP, subject: "Mes papiers", kind: "email", doc: "avis_classement", title: "Avis de classement sans suite", body: [["Voici l'avis de classement, et mes justificatifs."]] });
          else {
            api.mail({ from: nomP, subject: "L'avis du tribunal", kind: "email", doc: "convocation", title: "Avis à victime", body: [["Voici l'avis que j'ai reçu, et mes justificatifs."]] });
            CR.PROC.fixAudience(api, { day: t.d.audience, min: hTrib(q), juridiction: jur, mode: "convocation", convocDay: t.d.mesure, president: t.pres, script: "pc", done: "apresTC", onMiss: "_absentPC", title: `Audience — ${GEN2.chambre(t)}`, duree: 60 });
          }
          if (cs.advice.includes("v_temps") && classe) CR.erreur(api.s, cs, { id: "rien_presse", texte: "Vous avez dit au client que rien ne pressait, alors que la prescription court.", sanction: "Aucune tant que vous agissez à temps ; votre responsabilité sinon.", regul: "Compter le délai dès le premier rendez-vous." });
        },
        citationDelivree(api, { ctrl }) {
          const { s, cs } = api;
          const Cc = cs.vars.citation;
          cs.vars.consignation = { montant: q.nature === "contravention" ? 250 : 800, due: CR.rollForward(Cc.audienceDay - 2), paid: false };
          api.oblig({ id: "consignation", label: "Verser la consignation", due: cs.vars.consignation.due, onMiss: "_consignationOubliee" });
          api.mail({ from: Cc.juridiction === "tc" ? "Greffe correctionnel" : "Greffe du tribunal de police", subject: `Consignation — citation directe ${P.nom} contre ${A.nom}`, kind: "greffe", important: true, body: [["La partie civile qui cite directement doit consigner au greffe une somme destinée à garantir le paiement d'une éventuelle amende civile (art. 392-1)."], [`Montant fixé : ${CR.money(cs.vars.consignation.montant)}, à verser avant l'audience, sous peine d'irrecevabilité de la citation.`]] });
          if (ctrl.sanction === "incompetence") {
            CR.erreur(s, cs, { id: "incompetence", texte: ctrl.motif, sanction: "Le tribunal se déclarera incompétent.", regul: ctrl.regul });
            CR.PROC.fixAudience(api, { day: Cc.audienceDay, min: 13 * 60 + 30, juridiction: Cc.juridiction, mode: "citation", convocDay: s.day, president: Cc.juridiction === "tp" ? "pr_roquebert" : "pr_benkirane", script: "incompetence", done: "apresIncompetence", title: "Audience (citation directe)", duree: 30 });
            return;
          }
          if (ctrl.sanction === "citation_courte") { cs.flags.citationCourte = true; CR.erreur(s, cs, { id: "citation_courte", texte: "La citation a été délivrée moins de quinze jours avant l'audience.", sanction: "Le prévenu qui comparaît peut obtenir un renvoi (art. 552 et 553).", regul: "Citer plus tôt, ou accepter le renvoi." }); }
          CR.PROC.fixAudience(api, { day: Cc.audienceDay, min: hTrib(q), juridiction: jur, mode: "citation", convocDay: s.day, president: t.pres, script: cs.flags.citationCourte ? "renvoi" : "pc", done: cs.flags.citationCourte ? "apresRenvoi" : "apresTC", onMiss: "_absentPC", title: `Audience — ${GEN2.chambre(t)} (citation directe)`, duree: 50 });
        },
        citationPrescrite(api) {
          const { s, cs } = api;
          CR.erreur(s, cs, { id: "prescrit", texte: "La citation a été délivrée après l'expiration du délai de prescription.", sanction: "L'action publique est éteinte (art. 8, 9 et 9-2).", regul: "Aucune devant le juge pénal ; reste le juge civil." });
          CR.rcp(s, cs, "la citation directe a été délivrée après la prescription de l'action publique");
          CR.closeCase(s, cs, { type: "prescrit" });
        },
        _prescriptionCheck(api) {
          const { s, cs } = api;
          const Cc = cs.vars.citation;
          if (Cc && Cc.ctrl && Cc.ctrl.sanction !== "prescription") return;
          if (Cc && !Cc.ctrl) return;
          if (cs.status !== "active") { if (cs.status === "prospect") CR.closeCase(s, cs, { type: "prescrit", note: "Le dossier n'a jamais été engagé ; la prescription est acquise." }); return; }
          CR.erreur(s, cs, { id: "prescrit", texte: "Aucune citation n'a été délivrée avant la prescription, comptée depuis le dernier acte d'enquête.", sanction: "Prescription de l'action publique : aucune poursuite n'est plus possible.", regul: "Aucune devant le juge pénal." });
          CR.rcp(s, cs, "l'action publique s'est prescrite faute de diligence");
          CR.closeCase(s, cs, { type: "prescrit" });
        },
        _consignationOubliee(api) {
          const { s, cs } = api;
          if (cs.vars.consignation && cs.vars.consignation.paid) return;
          cs.flags.consignationManquee = true;
          CR.erreur(s, cs, { id: "consignation", texte: "La consignation n'a pas été versée avant l'audience.", sanction: "Citation directe irrecevable (art. 392-1).", regul: "Citer à nouveau si la prescription le permet, et consigner." });
        },
        apresIncompetence(api) {
          const { cs } = api;
          cs.vars.citation = null; cs.vars.dateAudiencement = null; cs.proc.audience = null; cs.drafted.citation = []; cs.vars.consignation = null;
          CR.PROC.stade(api, "classement", "Le tribunal s'est déclaré incompétent.");
          api.tl("Incompétence : il faut citer à nouveau devant la bonne juridiction.");
        },
        apresRenvoi(api) {
          const { s, cs } = api;
          cs.flags.citationCourte = false;
          CR.PROC.fixAudience(api, { day: CR.rollForward(s.day + 28), min: hTrib(q), juridiction: jur, mode: "renvoi", convocDay: s.day, president: t.pres, script: "pc", done: "apresTC", onMiss: "_absentPC", title: "Audience (après renvoi)", duree: 45 });
        },
        _absentPC(api) {
          const { s, cs } = api;
          CR.erreur(s, cs, { id: "absent", texte: "Vous n'étiez pas à l'audience.", sanction: classe ? "La partie civile citante qui ne comparaît pas est réputée se désister (art. 425)." : "La victime n'a pas pu présenter ses demandes.", regul: "Aucune." });
          CR.closeCase(s, cs, { type: "done", detail: classe ? "désistement réputé" : "aucune demande présentée" });
        },
        decider(api, { st }) {
          const { cs } = api;
          if (cs.flags.consignationManquee) return { titre: "Jugement", entete: `${CR.PROC.JURIDICTIONS[jur].label}.`, questions: [{ q: "Sur la recevabilité de la citation", r: "La citation est déclarée irrecevable.", motif: "La consignation fixée n'a pas été versée (art. 392-1)." }], dispositif: "Déclare la citation irrecevable.", coupable: false, irrecevable: true };
          const spec = B.spec(x);
          if (classe) for (const k of Object.keys(spec.pieces)) if (spec.pieces[k].sens === "charge" && !["plainte", "certificat", "temoin"].includes(k)) spec.pieces[k].force *= CR.hasDoc(cs, k === "aveux" ? "pv_auteur" : k) || cs.vars.copieDemandee ? 0.8 : 0.3;
          spec.seuil = classe ? 0.55 : 0.5;
          spec.pieces.version = { label: `${nomA} conteste`, sens: "decharge", force: t.stance === "nie" ? 0.12 : 0.04, need: ["arg:seul"] };
          st.played.add("arg:seul");
          const picks = (cs.vars.chiffrage && cs.vars.chiffrage.postes) || [];
          const autres = (cs.vars.chiffrage && cs.vars.chiffrage.autres) || [];
          return PEN.juger(api, {
            st, juridiction: jur, titre: jur === "tp" ? "Jugement du tribunal de police" : "Jugement correctionnel", prevenuNom: nomA, pcNom: nomP, pcF: P.g === "f",
            spec, qualif: B.qualif(x), personnalite: 1,
            civil: { postes: postes.filter((po) => picks.includes(po.id)), art475: autres.includes("art475") ? (deces ? 2500 : 1200) : 0 },
          });
        },
        apresTC(api, res) {
          const { s, cs } = api;
          const dec = res.decision || {};
          if (dec.irrecevable) { CR.closeCase(s, cs, { type: "irrecevable", detail: "consignation non versée" }); return; }
          CR.closeCase(s, cs, PEN.issue(api, dec));
        },
      },
      audiences: {
        pc(api) {
          const { cs } = api;
          const temoin = t.preuves.includes("temoin");
          return {
            title: GEN2.chambre(t), sub: x.TJ.paris ? "Tribunal judiciaire · Batignolles" : x.TJ.sub, decor: { scene: "salle" },
            steps: AUD.jugement(api, {
              prevenu: { prenom: A.prenom, nom: A.nom, g: A.g, naissance: A.naissance, adresse: A.adresse, metier: A.metier }, victime: { prenom: P.prenom, nom: P.nom, g: P.g }, victimeAvocat: `Me ${api.s.player.nom}`,
              prevention: `${classe ? `Vous êtes cité${e(A)} par ${nomP}` : "Vous êtes poursuivi" + e(A)} pour avoir, à Paris, le ${CR.fmtDate(t.d.faits, "long")}, ${x.prevention(q)}. Faits prévus et réprimés par ${CAT.courtLong(q.court)}.`,
              exceptionAdverse: classe ? "Le prévenu comparaît assisté. Pas d'exception." : "Aucune.",
              instruction: [
                { who: "president", t: `${A.g === "f" ? "Madame" : "Monsieur"} ${A.nom}, que s'est-il passé ?` },
                { who: "prevenu", name: nomA, t: N.version[t.stance] },
                { who: "president", t: `${GEN2.PR.Civ(P)} ${P.nom} ?` },
                { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: deces ? GEN2.PR.audience.tuee(x) : (N.plainte || [""])[0], signal: "bon" }], else: [{ who: "client", t: GEN2.PR.audience.menteur(x, t.pres), fx: { cred: -2 } }, { who: "president", t: "Restons-en aux faits, s'il vous plaît." }] },
              ],
              questions: { prompt: "Questions au prévenu (art. 442-1)", who: "prevenu", name: nomA, max: 2, options: [
                temoin ? { id: "q_temoin", t: `${GEN2.PR.civ(t.T)} ${t.T.nom} vous a vu${e(A)}. ${GEN2.PR.Il(t.T)} ment ?`, need: "G_temoin_pv", a: `${GEN2.PR.Il(t.T)} se trompe.`, fx: { play: ["G_temoin_pv"] }, signal: "bon" } : null,
                t.stance !== "nie" ? { id: "q_aveu", t: "Vous avez reconnu une partie des faits devant les enquêteurs. Vous maintenez ?", need: classe ? "G_auteur_dit" : "G_aveu", a: "…Oui. En partie.", fx: { play: [classe ? "G_auteur_dit" : "G_aveu"] }, signal: "bon" } : null,
                { id: "q_vie", t: "Vous mesurez ce que vous avez fait à cette personne ?", a: "Je n'ai rien à vous dire.", fx: { cred: -1 }, signal: "mauvais" },
              ].filter(Boolean) },
              pc: { max: 4, args: [
                temoin ? { id: "temoin", label: "Le témoignage", say: "Un témoin neutre confirme les faits.", cards: ["G_temoin_pv"] } : null,
                t.preuves.includes("certificat") ? { id: "certificat", label: "Le certificat médical", say: "Le certificat médical établit les blessures et l'ITT.", cards: ["G_itt", "G_itt_umj"] } : null,
                { id: "qualif", label: `La qualification : ${q.label}`, say: `Les faits constituent ${q.label}, prévu par ${CAT.courtLong(q.court)}.`, cards: q.textes.slice(0, 1).concat(["G_qualif"]) },
                { id: "prejudice", label: "Le préjudice, pièces à l'appui", say: `Le préjudice est établi par les pièces : ${(N.prejudice || []).map((po) => po.label.toLowerCase()).join(", ")}.`, cards: postes.flatMap((po) => po.justif || []) },
                { id: "prison", label: "Demander une peine exemplaire", say: "Je demande une peine exemplaire.", pertinent: () => false },
                { id: "art475", label: "Les frais d'avocat (art. 475-1)", say: "Je sollicite une somme au titre de l'article 475-1.", cards: ["CPP_475-1"] },
              ].filter(Boolean) },
              requis: { base: B.requis(x), avant: [t.preuves.includes("temoin") || t.preuves.includes("video") ? "Les faits sont établis par les pièces du dossier." : "Les faits sont établis, même si le prévenu les conteste."] },
              defenseAdverse: [`${GEN2.PR.gram(A).Client} ${t.stance === "reconnait" ? "reconnaît les faits et présente ses excuses ; je vous demande une peine mesurée et de réduire les demandes" : "conteste ; le doute doit lui profiter"}.`],
              dernierMotAdverse: t.stance === "reconnait" ? "Je regrette. Je m'excuse." : "Je n'ai rien fait de ce qu'on me reproche.",
            }),
          };
        },
        renvoi() { return { title: CR.PROC.JURIDICTIONS[jur].label.replace(/ de Paris$/, ` de ${x.TJ.ville}`), sub: x.TJ.paris ? "Tribunal judiciaire · Batignolles" : x.TJ.sub, decor: { scene: "salle" }, steps: [{ who: "huissier", t: "Le tribunal !" }, { who: "president", t: `Affaire ${P.nom} contre ${A.nom}, sur citation directe. ${GEN2.PR.Civ(A)} ${A.nom}, vous êtes présent${e(A)}.` }, { who: "prevenu", name: nomA, t: "J'ai reçu ce papier il y a dix jours. Je demande un délai." }, { who: "president", t: "La citation a été délivrée moins de quinze jours avant l'audience (art. 552). Le prévenu qui comparaît a droit au renvoi. L'affaire est renvoyée à quatre semaines." }] }; },
        incompetence() { return { title: "Audience sur citation directe", sub: x.TJ.paris ? "Tribunal judiciaire · Batignolles" : x.TJ.sub, decor: { scene: "salle" }, steps: [{ who: "huissier", t: "Le tribunal !" }, { who: "president", t: `Citation directe de ${nomP} contre ${nomA}.` }, { who: "president", t: q.nature === "contravention" ? "Maître, ces faits constituent une contravention : le tribunal correctionnel n'en est pas saisi régulièrement." : "Maître, ces faits constituent un délit : le tribunal de police n'est pas compétent." }, { who: "parquet", t: "Le ministère public conclut à l'incompétence." }, { who: "president", t: "Le tribunal se déclare incompétent. Il appartiendra à la partie civile de mieux se pourvoir." }] }; },
      },
      debrief(api, o) {
        const { cs } = api;
        const items = classe ? [{ kind: "rule", text: `${q.nature === "contravention" ? "Contravention : prescription d'un an (art. 9)" : "Délit : prescription de six ans (art. 8)"}, interrompue par tout acte d'enquête ou de poursuite (art. 9-2) ; le délai repart en entier. Ici, le dernier acte d'enquête date du ${CR.fmtDate(t.d.acte, "long")}.` }] : [{ kind: "rule", text: "La victime se constitue partie civile à l'audience, avant les réquisitions (art. 421), ou par lettre recommandée parvenue vingt-quatre heures avant (art. 420-1) ; elle chiffre et justifie chaque poste de préjudice." }];
        if (!cs.vars.copieDemandee) items.push({ kind: "bad", text: "Vous n'avez pas demandé la copie de la procédure : la preuve repose sur elle." });
        if (cs.flags.promesse) items.push({ kind: "bad", text: "Vous avez promis une peine : la partie civile ne demande que réparation." });
        return items.concat(cs.vars.debriefJugement || []);
      },
      epilogue(api, o) {
        if (o.type === "indemnise") return `${nomP} a obtenu réparation. ${pk(CR.seeded(t.sig + ":epi"), ["Le premier versement est arrivé trois mois plus tard.", "Il a fallu saisir la CIVI pour être payé.", "L'argent ne change rien, dit-" + (P.g === "f" ? "elle" : "il") + ", mais la décision, si."])}`;
        if (o.type === "prescrit") return `${nomP} n'a rien obtenu : trop tard.`;
        if (o.type === "deboute") return `${nomA} a été relaxé${e(A)}. ${nomP} est reparti${e(P)} sans rien.`;
        return o.detail ? CR.cap(o.detail) + "." : "Dossier terminé.";
      },
      fiche(api, o) {
        return {
          phrase: `${CR.cap(q.label)}, ${classe ? "citation directe après classement" : "constitution de partie civile à l'audience"}, avocat de ${nomP}.`,
          notions: B.notions(x).concat(classe ? [{ titre: "Le classement sans suite n'éteint pas l'action", regle: "La victime peut citer directement l'auteur devant la juridiction de jugement ; elle consigne, et la preuve est à sa charge.", art: "art. 40-2, 392-1 et 551 CPP", prog: "pp_action" }, { titre: "Tribunal de police ou tribunal correctionnel", regle: "Le tribunal de police juge les contraventions ; le tribunal correctionnel, les délits.", art: "art. 521 et 381 CPP", prog: "pp_jugement" }] : [{ titre: "La constitution de partie civile", regle: "À l'audience avant les réquisitions, ou par lettre recommandée vingt-quatre heures avant ; chaque poste chiffré et justifié.", art: "art. 420-1 et 421 CPP", prog: "pp_action" }]),
          piege: classe ? "Compter la prescription depuis le dernier acte d'enquête, choisir le bon tribunal, citer quinze jours avant l'audience, consigner." : "Chiffrer chaque poste et le justifier par une pièce ; ne jamais demander de peine.",
          devenir: api.def.epilogue(api, o),
        };
      },
      corrige: () => [{ probleme: "Quelle juridiction, quel délai ?", regle: `${CR.cap(q.label)} : ${q.nature === "contravention" ? "contravention, tribunal de police, prescription d'un an" : "délit, tribunal correctionnel, prescription de six ans"} (${q.court}).`, application: classe ? `Le dernier acte d'enquête date du ${CR.fmtDate(t.d.acte, "long")} : la prescription court jusqu'au ${CR.fmtDate(CR.addYears(t.d.acte, q.prescAns), "long")}.` : `L'audience est fixée au ${CR.fmtDate(t.d.audience, "long")}.` }].concat(B.corrige(x).slice(0, 1)),
    };
    def.calls.intake.start = def.calls.intake.topics.map((tp) => tp.id);
    return def;
  };

  // =================================================================== Branchement dans le jeu
  // Champs recalculés à la reconstruction, jamais sauvegardés : la signature et le client (raccourci des anciens tests)
  GEN2.prepare = function (p) {
    if (!Object.getOwnPropertyDescriptor(p.t, "sig") || Object.getOwnPropertyDescriptor(p.t, "sig").enumerable) Object.defineProperty(p.t, "sig", { value: p.t.sig || GEN2.signature(p.t), enumerable: false, writable: true, configurable: true });
    if (!Object.getOwnPropertyDescriptor(p, "client")) Object.defineProperty(p, "client", { get() { return this.t[this.t.client]; }, enumerable: false, configurable: true });
    return p;
  };
  GEN2.def = function (p) {
    GEN2.prepare(p);
    if (GEN2.PR.traceOn()) GEN2.PR.marquer(p.t);
    const def = p.kind === "info" ? B.info(p) : p.kind === "op" ? B.op(p) : p.kind === "copj" ? B.copj(p) : p.kind === "al" ? B.al(p) : p.kind === "pc" ? B.pc(p) : B.penal(p);
    def.generated = true;
    def.genre = p.kind;
    if (def.calls) def.calls = CAT.typoDeep(def.calls);
    if (def.facts) def.facts = CAT.typoDeep(def.facts);
    // phase 3 : le tribunal compétent (lieu des faits), le code d'affaire, les ressources du client, les personnages autonomes
    def.tj = CR.MONDE.lieuxDe(p.t).TJ;
    def.code = p.t.code || null;
    const Cl = p.t[p.t.client];
    if (Cl && Cl.revenu != null && def.profile && !p.t.R) def.profile = Object.assign({}, def.profile, { wealth: Cl.revenu >= 5000 ? 5 : Cl.revenu >= 3000 ? 4 : Cl.revenu >= 1800 ? 3 : Cl.revenu >= 1100 ? 2 : 1 });
    if (GEN2.VIE && !p.horsVie) GEN2.VIE.installer(def, p);
    return def;
  };
  // Un tirage sans le texte de vérification répété (taille des sauvegardes)
  const allege = (q) => { if (!q) return q; const o = Object.assign({}, q); delete o.source; return o; };
  // ------------------------------------------------------------------ Phase 3 : historique des signatures de type
  // Gardé dans le navigateur (et recopié dans chaque sauvegarde, s.genTypes) : une affaire déjà jouée dans une partie
  // précédente n'est plus tirée ; quand une famille est épuisée, le tirage suivant varie le contexte ou les preuves.
  GEN2.HIST_KEY = "la-permanence-historique-v1";
  const HIST = { list: null, set: null };
  GEN2.histCharger = function () {
    if (HIST.set) return HIST;
    try { HIST.list = JSON.parse((typeof localStorage !== "undefined" && localStorage.getItem(GEN2.HIST_KEY)) || "[]"); } catch (e) { HIST.list = []; }
    if (!Array.isArray(HIST.list)) HIST.list = [];
    HIST.set = new Set(HIST.list);
    return HIST;
  };
  GEN2.histVider = function () { HIST.list = []; HIST.set = new Set(); try { localStorage.removeItem(GEN2.HIST_KEY); } catch (e) { /* stockage indisponible */ } };
  GEN2.histA = (h) => GEN2.histCharger().set.has(h);
  GEN2.histAjouter = function (hs) {
    const H = GEN2.histCharger();
    let n = 0;
    for (const h of [].concat(hs)) if (h != null && !H.set.has(h)) { H.list.push(h); H.set.add(h); n++; }
    if (H.list.length > 8000) { H.list.splice(0, H.list.length - 8000); H.set = new Set(H.list); }
    if (n) { try { localStorage.setItem(GEN2.HIST_KEY, JSON.stringify(H.list)); } catch (e) { /* stockage indisponible */ } if (CR.Saves && CR.Saves.histPush) CR.Saves.histPush(H.list); }
    return n;
  };
  GEN2.histTaille = () => GEN2.histCharger().list.length;
  // Une partie rechargée rapporte ses signatures dans l'historique (autre navigateur, autre appareil)
  GEN2.histDepuisPartie = (s) => { if (s && s.genTypes && s.genTypes.length) GEN2.histAjouter(s.genTypes); };

  // ------------------------------------------------------------------ Paramètres d'une nouvelle affaire générée
  // La graine de l'affaire est celle de son code (version, genre, jour, créneau de dix minutes, n° de 0 à 1023) : l'affaire se
  // rejoue à l'identique par son code. Parmi les graines possibles, la première dont la signature de type est nouvelle.
  // extra : { night, min, inf, revenant: { personne, role, from, ant } }
  GEN2.params = function (s, kind, extra = {}) {
    s.genCount = (s.genCount || 0) + 1;
    const id = `g_${kind}_${s.genCount}`;
    s.genSigs = s.genSigs || [];
    s.genTypes = s.genTypes || [];
    const sigs = new Set(s.genSigs);
    const types = new Set(s.genTypes);
    const day = Math.max(0, Math.min(4095, s.day));
    const min = extra.min != null ? extra.min : s.min;
    const slot = Math.max(0, Math.min(143, Math.floor(min / 10)));
    const rg = CR.seeded(id + ":" + s.seed + ":graines");
    const n0 = Math.floor(rg() * 1024);
    const pas = 1 + 2 * Math.floor(rg() * 300);
    const rev = extra.revenant || null;
    let choisi = null, premier = null, essais = 0;
    // anti-répétition (lot 1) : en carrière, plusieurs candidates nouvelles, puis le directeur de partie choisit
    const dir = GEN2.DIR && !GEN2.DIR.off && s.mode === "carriere";
    const cands = [];
    const K = dir ? GEN2.DIR.K : 1;
    for (let k = 0; k < 220 && cands.length < K; k++) {
      const c = { v: GEN2.VERSION, lie: !!rev, genre: kind, day, slot, n: (n0 + k * pas) % 1024 };
      let t;
      try { t = GEN2.tirer(GEN2.graineCode(c), kind, { day, min: slot * 10, night: kind === "gav" && slot * 10 < 6 * 60 }); } catch (e) { continue; }
      essais++;
      if (extra.inf && t.inf !== extra.inf) continue;
      if (rev && !GEN2.revenantPossible(t, rev)) continue;
      if (sigs.has(CR.hash(t.sig))) continue;
      const ts = CR.hash(GEN2.typeSig(t));
      if (!premier) premier = { t, c, ts };
      if (types.has(ts) || GEN2.histA(ts)) continue;
      cands.push({ t, c, ts });
    }
    if (cands.length) choisi = dir ? GEN2.DIR.choisir(s, kind, cands) : cands[0];
    // famille épuisée : la première affaire cohérente, signalée
    if (!choisi) { choisi = premier; if (choisi) s.genEpuise = (s.genEpuise || 0) + 1; }
    if (!choisi) throw new Error("Aucune affaire tirée pour " + id);
    const { t, c, ts } = choisi;
    if (rev) GEN2.appliquerRevenant(t, rev, s.day);
    t.code = GEN2.encoderCode(c);
    const sig = GEN2.signature(t);
    t.q = allege(t.q); t.q2 = allege(t.q2);
    s.genSigs.push(CR.hash(sig));
    if (s.genSigs.length > 600) s.genSigs.splice(0, s.genSigs.length - 600);
    s.genTypes.push(ts);
    if (s.genTypes.length > 3000) s.genTypes.splice(0, s.genTypes.length - 3000);
    if (s.mode !== "affaire" || !s.sansHistorique) GEN2.histAjouter(ts);
    if (GEN2.DIR && s.mode === "carriere") GEN2.DIR.noter(s, t, kind);
    const p = {
      gen: 2, id, kind, seed: GEN2.graineCode(c), day: s.day, night: kind === "gav" && slot * 10 < 6 * 60, niveau: CR.contenu(s), t,
      // champs lus par les anciens tests et l'interface
      inf: t.inf, anomaly: t.irr[0] || null, ethylo: t.irr.includes("ethylo"), notif: t.d.notif, opj: t.opj, parquet: t.parquet, debut: t.d.debut,
    };
    if (rev) p.revenant = { from: rev.from, role: rev.role };
    delete t.sig;
    t.sig = sig;
    GEN2.prepare(p);
    s.generated = s.generated || [];
    s.generated.push(p);
    return p;
  };
  // Une affaire désignée par son code, hors carrière : même tirage, camp au choix quand les deux existent
  GEN2.paramsCode = function (s, c, o = {}) {
    s.genCount = (s.genCount || 0) + 1;
    let kind = c.genre;
    let t = GEN2.tirerCode(c, { camp: kind === "info" && o.camp ? o.camp : undefined });
    if (kind === "info" && o.camp) t.code = GEN2.encoderCode(c);
    // délits : l'autre camp de la même affaire (le prévenu convoqué, ou la victime partie civile)
    if (o.camp && kind !== "info") {
      const autre = GEN2.autreCamp(t, o.camp);
      if (autre) { t = autre; kind = autre.genre; }
    }
    const id = `g_${kind}_${s.genCount}`;
    const sig = t.sig;
    t.q = allege(t.q); t.q2 = allege(t.q2);
    s.genTypes = s.genTypes || [];
    s.genTypes.push(CR.hash(GEN2.typeSig(t)));
    const p = { gen: 2, id, kind, seed: GEN2.graineCode(c), day: s.day, night: kind === "gav" && c.slot * 10 < 6 * 60, niveau: CR.contenu(s), t, code: true,
      inf: t.inf, anomaly: t.irr[0] || null, ethylo: t.irr.includes("ethylo"), notif: t.d.notif, opj: t.opj, parquet: t.parquet, debut: t.d.debut };
    delete t.sig;
    t.sig = sig;
    GEN2.prepare(p);
    s.generated = s.generated || [];
    s.generated.push(p);
    return p;
  };
  // Les camps possibles d'une affaire : défense, et partie civile quand une victime (personne) est au procès
  GEN2.campsDe = function (t) {
    if (t.genre === "info") return t.V && !t.V.agent && t.q && CAT.INF[t.inf].victime !== "aucune" ? ["defense", "pc"] : [t.camp || "defense"];
    if (t.genre === "copj" && t.V && !t.V.agent && !t.R && t.d.audience != null && ((J) => (J.victimeDe ? J.victimeDe(t.f) : J.victime))(CAT.ficheDe(CAT.INF[t.inf], t.f)) === "personne") return ["defense", "pc"];
    if (t.genre === "pc" && t.d.voiePc === "convoque") return ["pc", "defense"];
    return [t.genre === "pc" ? "pc" : "defense"];
  };
  GEN2.autreCamp = function (t, camp) {
    if (!GEN2.campsDe(t).includes(camp)) return null;
    const x = JSON.parse(JSON.stringify(t));
    Object.defineProperty(x, "sig", { value: t.sig, enumerable: false, writable: true, configurable: true });
    if (camp === "pc" && t.genre === "copj") { x.genre = "pc"; x.client = x.P ? "P" : "V"; x.d.voiePc = "convoque"; x.voie = x.q.nature === "contravention" ? "citation_parquet" : "copj"; return x; }
    if (camp === "defense" && t.genre === "pc") { x.genre = "copj"; x.client = "A"; x.d.convoc = x.d.convoc != null ? x.d.convoc : x.d.mesure; x.voie = x.q.nature === "contravention" ? "citation_parquet" : "copj"; if (x.mesure === "aucune" && x.q.nature === "delit") x.mesure = "al"; return x; }
    return camp === (t.genre === "pc" ? "pc" : "defense") ? x : null;
  };

  // ------------------------------------------------------------------ Les personnes qui reviennent (récidivistes, victimes devenues prévenues)
  // rev : { personne (fiche gardée à la clôture), role: "A" (l'auteur revient) | "V" (revient comme victime), from, ant }
  GEN2.revenantPossible = function (t, rev) {
    const P = rev.personne;
    if (!P || t.genre === "info" || t.conc || t.PM || t.R) return false;
    const Q = t[rev.role];
    if (!Q || Q.agent || Q.morale) return false;
    if (Q.g !== P.g) return false;
    if (rev.role === "V" && !(t.genre === "pc" || (t.V && t.genre === "copj"))) return false;
    if (rev.role === "A" && t.client !== "A") return false;
    return Math.abs((Q.age || 30) - (P.age || 30)) < 25;
  };
  GEN2.appliquerRevenant = function (t, rev, today) {
    const P = rev.personne;
    const Q = t[rev.role];
    const ans = Math.max(0, Math.floor((today - (rev.day || today)) / 365));
    for (const k of ["prenom", "nom", "g", "naissance", "tel", "adresse", "rue", "sect", "mil", "metier", "emploi", "revenu", "enfants", "proche"]) if (P[k] != null) Q[k] = P[k];
    Q.age = (P.age || Q.age) + ans;
    Q.revenant = rev.from || true;
    if (rev.role === "A" && rev.ant) {
      // le jugement de la première affaire devient l'antécédent du bulletin n° 1 : la récidive se calcule comme pour tout le monde
      Q.casier = 2;
      const q0 = CAT.qualifier(t.inf, t.f);
      t.ant = rev.ant;
      const EL = CAT.etatLegal(rev.ant, { inf: t.inf, q: q0, faits: t.d.faits });
      const valide = EL.etat === "recidive";
      t.recid = { etat: EL.etat, type: EL.type || null, art: EL.art || null, motif: EL.motif || null, valide, vice: null, parquet: valide, revocable: CAT.sursisRevocable(rev.ant, t.d.faits) };
      t.q = valide ? CAT.avecRecidive(q0, EL) : q0;
      t.q2 = t.f2 ? (valide ? CAT.avecRecidive(CAT.qualifier(t.inf2 || t.inf, t.f2), EL) : CAT.qualifier(t.inf2 || t.inf, t.f2)) : t.q2;
      t.rec = !!(t.q && t.q.recidive);
      if (!t.rec) t.recid.parquet = false;
    }
    if (rev.role === "V") Q.casier = 0;
    if (t.A && t.V && t.A.nom === t.V.nom && rev.role === "V") t.V.nom = t.V.nom + "-" + (t.V.prenom[0] || "B");
    t.revenant = { role: rev.role, from: rev.from || null };
  };

  // Nouveaux clients : une ordonnance pénale, une convocation au tribunal, une audition libre, une victime
  GEN2.LEADS = { copj: 3, pc: 2.4, al: 2, op: 1.6 };
  GEN2.leadKind = function (s) {
    const w = GEN2.DIR ? GEN2.DIR.poidsGenres(s, Object.assign({}, GEN2.LEADS)) : Object.assign({}, GEN2.LEADS);
    const tot = Object.values(w).reduce((a, b) => a + b, 0);
    let v = R.next(s) * tot;
    for (const [k, p] of Object.entries(w)) { v -= p; if (v < 0) return k; }
    return "copj";
  };
})();
