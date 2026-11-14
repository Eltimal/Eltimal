/* La Permanence — briques d'audience et jugement.
   Les affaires composent leur audience avec ces briques (ordre de parole de l'art. 460) ;
   le jugement sort du moteur de procédure : nullités, culpabilité, qualification, peine, intérêts civils. */
(function () {
  const CR = (window.CR = window.CR || {});
  const R = CR.R;
  const A = (CR.AUD = {});
  const PEN = CR.PEN;

  const civ = (c) => (c && c.g === "f" ? "Madame" : "Monsieur");
  const de = (t) => (/^([aeéèêiïîoôuy]|h(omicide|abitude|ôpital|uile|eure|ébergement|ér[ïo]))/i.test(t) ? "d'" : "de ") + t; // h aspiré (harcèlement, hold-up…) : pas d'élision
  A.de = de;
  A.civ = civ;

  // Ouverture : appel de l'affaire, identité, prévention, droit de se taire (art. 406)
  A.ouverture = function (api, o) {
    const p = o.prevenu;
    const steps = [
      { who: "huissier", t: "Le tribunal !" },
      { who: "sys", t: "(Tout le monde se lève. Les juges prennent place ; la greffière ouvre le rôle.)" },
      { who: "president", t: `Affaire ${p.nom}. ${civ(p)} ${p.prenom} ${p.nom}, avancez à la barre.` },
      { who: "president", t: `Vous êtes ${civ(p) === "Madame" ? "née" : "né"} ${p.naissance || "le …"}, vous demeurez ${p.adresse || "à Paris"}, vous êtes ${p.metier || "sans profession"} ?` },
      { who: o.prevenuWho || "prevenu", name: o.prevenuWho === "client" ? undefined : `${p.prenom} ${p.nom}`, t: "Oui." },
      { who: "president", t: o.prevention },
      { who: "president", t: "Vous avez le droit, au cours des débats, de faire des déclarations, de répondre aux questions qui vous sont posées ou de vous taire." },
    ];
    if (o.victime) steps.push({ who: "president", t: `La victime, ${civ(o.victime)} ${o.victime.prenom} ${o.victime.nom}, est présente${o.victimeAvocat ? `, assistée de ${o.victimeAvocat}` : ""}.` });
    return steps;
  };

  // Audience correctionnelle ou de police complète, dans l'ordre de l'art. 460.
  // o : { prevenu, prevention, victime, victimeAvocat, ci, avantFond:[steps], instruction:[steps], questions, card,
  //       pc:{plaidoirie} (joueur partie civile) | pcAdverse:[lignes], requis:{base, avant, apres} | null,
  //       defense:{plaidoirie} (joueur en défense) | defenseAdverse:[lignes], dernierMot | dernierMotAdverse, delibere }
  A.jugement = function (api, o) {
    const { cs } = api;
    const camp = cs.camp;
    const pv = camp === "defense" ? "client" : "prevenu";
    const pname = `${o.prevenu.prenom} ${o.prevenu.nom}`;
    const steps = [];
    steps.push(...(o.ouvertureSteps || A.ouverture(api, Object.assign({}, o, { prevenuWho: pv }))));
    if (camp === "defense" && o.sansLimine) steps.push({ who: "president", t: o.sansLimine });
    else if (camp === "defense") steps.push({ who: "president", t: "Avant d'aborder le fond : des exceptions, maître ?" }, { limine: { joindre: true } });
    else steps.push({ who: "president", t: "Des exceptions de procédure ?" }, { who: "adverse", t: o.exceptionAdverse || "Aucune." });
    steps.push(...(o.avantFond || []));
    steps.push(...(o.instruction || []));
    if (camp === "pc") steps.push({ constitution: true });
    if (o.questions) steps.push({ questions: o.questions });
    if (o.card) steps.push({ card: o.card });
    if (camp === "pc" && o.pc) steps.push({ if: () => !!cs.proc.pcConstituee, then: [{ who: "president", t: "La parole est à la partie civile." }, { plaidoirie: Object.assign({ role: "pc" }, o.pc) }].concat(o.pcApres || []), else: [{ who: "president", t: "Maître, votre client ne s'est pas constitué partie civile : vous n'avez pas de demande à présenter.", signal: "mauvais" }] });
    else if (o.pcAdverse) steps.push({ who: "president", t: "La parole est à la partie civile." }, ...o.pcAdverse.map((t) => (typeof t === "string" ? { who: "adverse", t } : t)));
    if (o.requis) steps.push(A.requisitions(o.requis.base, o.requis));
    if (camp === "defense" && o.defense) steps.push({ who: "president", t: "La parole est à la défense." }, { plaidoirie: Object.assign({ role: "defense" }, o.defense) });
    else if (o.defenseAdverse) steps.push({ who: "president", t: "La parole est à la défense." }, ...o.defenseAdverse.map((t) => (typeof t === "string" ? { who: "adverse", t } : t)));
    if (camp === "defense") steps.push({ dernierMot: o.dernierMot || { prepare: [{ id: "regrets", label: "Des regrets sobres", t: "Je regrette. Je ne recommencerai pas." }, { id: "rien", label: "Rien de plus", t: "Je n'ai rien à ajouter." }], spontane: { id: "spontane", t: "Je… je voulais juste dire que je regrette." } } });
    else steps.push({ who: "president", t: `${civ(o.prevenu)} ${o.prevenu.nom}, vous avez la parole en dernier.` }, { who: "prevenu", name: pname, t: o.dernierMotAdverse || "Je n'ai rien à ajouter." });
    steps.push({ delibere: o.delibere || { texte: "Le tribunal se retire pour délibérer. L'huissier, un peu plus tard : « Le tribunal ! »" } });
    return steps;
  };

  // Réquisitions du ministère public sur le fond (base modulée par le profil du parquet)
  A.requisitions = function (base, opts = {}) {
    return {
      requisitions: (api) => {
        // base, avant et apres peuvent dépendre de ce qui s'est passé à l'audience (n° 12 : la récidive écartée, par exemple)
        const v = (x) => (typeof x === "function" ? x(api) : x);
        const q = CR.ACT.requis(api, v(base));
        api.cs.vars.requis = q;
        const lines = [{ who: "president", t: "La parole est au ministère public." }];
        for (const t of v(opts.avant) || []) lines.push({ who: "parquet", t: CR.fmt(t, api.v()) });
        lines.push({ who: "parquet", t: `Je requiers ${CR.ACT.requisTexte(q).replace(/^./, (c) => c.toLowerCase())}${q.complementaires && q.complementaires.length ? "" : ""}.` });
        const ap = v(opts.apres);
        if (ap) lines.push({ who: "parquet", t: CR.fmt(ap, api.v()) });
        return lines;
      },
    };
  };

  // =================================================================== Jugement correctionnel
  // o : { st, spec (pieces, arguments, seuil), qualif(api, ctx) → { id, label, art, contravention, encourue, requis },
  //       personnalite, civil: { postes } | null, titre, juridiction, prevenuNom, pcNom, detenu, sansDomicile }
  PEN.juger = function (api, o) {
    const { s, cs } = api;
    const st = o.st || {};
    const played = st.played instanceof Set ? st.played : new Set(st.played || []);
    const juge = api.profil("president") || CR.PROFILS.formaliste;
    const questions = [];
    const debrief = [];

    // 1. exceptions de nullité jointes au fond
    const pend = cs.proc.moyens.filter((m) => !m.decision);
    if (pend.length) {
      const res = CR.PROC.statuerNullites(api, juge);
      for (const m of res) {
        const an = CR.PROC.anomalie(cs, m.flag);
        const ir = an ? CR.IRREG[an.irreg] : null;
        questions.push({
          q: `Sur l'exception de nullité${ir ? ` : ${ir.label.toLowerCase()}` : ""}`,
          r: m.decision === "annule" ? "Le tribunal fait droit à l'exception et annule l'acte." : m.decision === "irrecevable" ? "L'exception est irrecevable." : "L'exception est rejetée.",
          motif: m.decision === "irrecevable" ? m.motif + "." : m.motifDecision || "",
        });
        if (m.decision === "annule") debrief.push({ kind: "good", text: `Nullité obtenue : ${ir ? ir.label : "acte annulé"}. ${ir ? ir.effet + "." : ""}` });
        if (m.decision === "irrecevable") debrief.push({ kind: "bad", text: `Exception irrecevable : ${m.motif}.` });
        if (m.decision === "rejete" && !m.reel) debrief.push({ kind: "bad", text: "Vous avez soulevé un moyen qui ne correspond à aucune irrégularité du dossier : cela coûte de la crédibilité." });
      }
    } else {
      const decided = cs.proc.moyens.filter((m) => m.decision);
      for (const m of decided) questions.push({ q: "Sur l'exception de nullité", r: m.decision === "annule" ? "Annulation prononcée à l'audience." : m.decision === "irrecevable" ? "Exception déclarée irrecevable à l'audience." : "Exception rejetée à l'audience.", motif: "" });
    }

    // 2. culpabilité
    const ctx = { played: [...played], angle: st.angle, juge, contexte: { finJournee: s.min > 19 * 60 }, notesComptent: false };
    const d = CR.PROC.deliberer(api, o.spec, ctx);
    for (const c of d.calc) debrief.push({ kind: "calc", text: c.t });
    let qualif = null;
    if (d.coupable && o.qualif) qualif = o.qualif(api, Object.assign({}, ctx, { played }));
    questions.push({
      q: "Sur la culpabilité",
      r: d.coupable ? `Le tribunal déclare ${o.prevenuNom} coupable${qualif ? " " + de(qualif.label) : ""}.` : `Le tribunal relaxe ${o.prevenuNom} des fins de la poursuite.`,
      motif: d.coupable ? (qualif && qualif.motif) || "Les éléments de la procédure, débattus contradictoirement, établissent les faits (art. 427)." : "Les éléments à charge qui subsistent ne suffisent pas à établir les faits ; le doute profite au prévenu.",
    });

    // 3. peine
    let peine = null;
    if (d.coupable) {
      const req = (qualif && qualif.requis) || cs.vars.requis || {};
      peine = CR.PROC.calculerPeine(api, { encourue: qualif && qualif.encourue, requis: req }, Object.assign({}, ctx, { personnalite: o.personnalite || 0, detenu: o.detenu, sansDomicile: o.sansDomicile }));
      if (qualif && qualif.encourue && qualif.encourue.amende && peine.amende > qualif.encourue.amende) { peine.amende = qualif.encourue.amende; peine.texte = CR.PROC.peineTexte(peine); }
      questions.push({ q: "Sur la peine", r: peine.texte + ".", motif: peine.regles.join(" ") || (o.personnalite >= 2 ? "Le tribunal tient compte des éléments de personnalité produits." : "Le dossier de personnalité est mince.") });
      cs.vars.peine = peine;
      cs.vars.requisJuge = req;
      // lot 8 : l'exclusion de la mention au bulletin n° 2 (art. 775-1 CPP), si la défense l'a demandée ; jamais pour les
      // infractions de l'article 706-47 ; le tribunal la retient plus volontiers pour un premier passage
      if (played.has("arg:b2") && CR.AP && CR.AP.b2Possible) {
        const justifie = ["G_emploi", "AP_travail", "K_promesse"].some((f) => CR.hasFact(cs, f));
        const ok = CR.AP.b2Possible(api, qualif) && justifie && CR.seeded(cs.id + ":b2")() < [0.75, 0.45, 0.15][Math.min(2, (CR.AP.casier && CR.AP.casier(api)) || 0)];
        cs.vars.b2Exclu = !!ok;
        questions.push({ q: "Sur le bulletin n° 2 du casier judiciaire", r: ok ? "Le tribunal exclut la mention de la condamnation au bulletin n° 2." : "Le tribunal rejette la demande d'exclusion de la mention au bulletin n° 2.", motif: ok ? "La mention compromettrait l'insertion professionnelle du condamné, qui en justifie (art. 775-1 du code de procédure pénale)." : CR.AP.b2Possible(api, qualif) ? (justifie ? "Les antécédents et la nature des faits ne justifient pas l'exclusion demandée." : "Rien au dossier ne montre ce que la mention compromettrait : l'exclusion n'est pas justifiée.") : "L'exclusion n'est pas possible pour les infractions mentionnées à l'article 706-47 du code de procédure pénale (art. 775-1)." });
      }
    }

    // 4. intérêts civils
    let civil = null;
    if (o.civil) {
      if (!cs.proc.pcConstituee) {
        questions.push({ q: "Sur l'action civile", r: "Aucune constitution de partie civile.", motif: "La victime pourra saisir le juge civil." });
      } else if (!d.coupable) {
        questions.push({ q: "Sur l'action civile", r: o.pcPl ? `${o.pcNom} sont déboutés de leurs demandes.` : `${o.pcNom} est débouté${o.pcF ? "e" : ""} de ses demandes.`, motif: "La relaxe prive l'action civile de son fondement devant le juge pénal." });
      } else if (!o.civil.postes || !o.civil.postes.length) {
        civil = { lignes: [], total: 0, art475: 0, renvoi: true };
        questions.push({ q: "Sur l'action civile", r: "Le tribunal reçoit la constitution de partie civile et renvoie l'affaire à une audience ultérieure sur les intérêts civils.", motif: "Aucune demande chiffrée ni justifiée n'a été présentée (art. 464, al. 4)." });
      } else {
        civil = CR.PROC.calculerCivil(api, o.civil.postes, Object.assign({}, ctx, { played }));
        let art475 = 0;
        if (o.civil.art475) art475 = Math.round(o.civil.art475 * (0.55 + (0.5 - juge.severite) * 0.2) / 50) * 50;
        civil.art475 = art475;
        questions.push({ q: "Sur l'action civile", r: `Le tribunal reçoit la constitution de partie civile et condamne ${o.prevenuNom} à payer à ${o.pcNom} ${CR.money(civil.total)}${art475 ? `, et ${CR.money(art475)} au titre de l'article 475-1` : ""}.`, motif: civil.lignes.map((l) => `${l.label} : ${CR.money(l.alloue)}${l.alloue === 0 ? " (rejeté)" : l.justifie ? "" : " (non justifié, réduit)"}`).join(" ; ") + "." });
      }
      cs.vars.civil = civil;
    }

    // inscription au dossier
    cs.vars.jugementDay = s.day;
    // lot 8 : le détail de la peine, pour son exécution (convocation devant le juge de l'application des peines)
    cs.vars.peineDetail = d.coupable && peine ? { ferme: peine.ferme || 0, sursis: peine.sursis || 0, mandatDepot: !!peine.mandatDepot, amenagement: peine.amenagement || null, crime: !!peine.crime || !!peine.reclusion } : null;
    cs.vars.decision = { coupable: d.coupable, qualif: qualif && qualif.id, peine: peine && peine.texte, civil: civil && civil.total, score: d.score, motifsPeine: peine && peine.choisie ? { regles: peine.regles, facteurs: peine.facteurs, manques: peine.manques } : null };
    cs.proc.decisions.push({ day: s.day, type: "jugement", coupable: d.coupable });
    CR.PROC.event(api, `Jugement : ${d.coupable ? "culpabilité" + (qualif ? ` (${qualif.court || qualif.label})` : "") + (peine ? `, ${peine.texte.toLowerCase()}` : "") : "relaxe"}.`);
    cs.vars.debriefJugement = debrief;
    const disp = [];
    // « le condamne à » : la peine principale suit la déclaration de culpabilité
    const condamne = (t) => { const x = t.replace(/^./, (c) => c.toLowerCase()); return /^\d/.test(x) ? "le condamne à " + x : /^réclusion criminelle à perpétuité/.test(x) ? "le condamne à la " + x : x; };
    if (d.coupable) disp.push(`Déclare ${o.prevenuNom} coupable${qualif ? " " + de(qualif.label) : ""} ; ${condamne(peine.texte)}`);
    else disp.push(`Relaxe ${o.prevenuNom}`);
    if (cs.vars.b2Exclu && d.coupable) disp.push("dit que la condamnation ne sera pas mentionnée au bulletin n° 2 du casier judiciaire (art. 775-1 CPP)");
    if (civil && !civil.renvoi) disp.push(`condamne ${o.prevenuNom} à payer à ${o.pcNom} la somme de ${CR.money(civil.total + (civil.art475 || 0))}`);
    const cour = ["assises", "ccd", "chapp", "chins", "assises_mineurs", "assises_spe", "assises_appel", "chmin"].includes(o.juridiction);
    if (cour) {
      const fix = (t) => (typeof t === "string" ? t.replace(/Le tribunal/g, "La cour").replace(/le tribunal/g, "la cour") : t);
      for (const q of questions) { q.r = fix(q.r); q.motif = fix(q.motif); }
      if (peine && peine.regles) peine.regles = peine.regles.map(fix);
    }
    return {
      titre: o.titre || "Jugement",
      entete: `${(CR.PROC.JURIDICTIONS[o.juridiction || "tc"] || {}).label || "Tribunal correctionnel de Paris"} — audience du ${CR.fmtDate(s.day, "long")}. ${cour ? "Arrêt" : "Jugement"} contradictoire.`,
      questions, dispositif: disp.join(" ; ") + ".",
      coupable: d.coupable, qualif, peine, civil,
    };
  };

  // Issue d'un dossier après jugement, vue depuis le camp du joueur
  PEN.issue = function (api, dec) {
    const { cs } = api;
    if (cs.camp === "pc") {
      if (!dec.coupable) return { type: "deboute", detail: "relaxe du prévenu" };
      if (!dec.civil) return { type: "done", detail: cs.proc.pcConstituee ? "culpabilité, sans indemnisation" : "pas de constitution de partie civile" };
      if (dec.civil.renvoi) return { type: "done", detail: "renvoi sur les intérêts civils" };
      const tot = dec.civil.total + (dec.civil.art475 || 0);
      return { type: "indemnise", detail: CR.money(tot), indemnisation: dec.civil.total };
    }
    if (!dec.coupable) return { type: "relaxe" };
    if (dec.qualif && dec.qualif.favorable) return { type: "requalification_favorable", detail: dec.peine ? dec.peine.texte : "" };
    return { type: "condamnation", detail: dec.peine ? dec.peine.texte : "" };
  };
})();
