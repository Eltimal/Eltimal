/* La Permanence — le pourvoi en cassation (version 1.0).
   Après un arrêt de la chambre des appels correctionnels défavorable au client, un délai de dix jours francs s'ouvre
   (art. 568 CPP, dix jours depuis le 30 septembre 2024 ; cinq auparavant). cs.vars.cass = { day, limite, vice, etat, … }.
   Le joueur lit l'arrêt (CASS.arret), qui contient ou non un vice de droit tiré au sort avec la graine du dossier :
     parole  : le ministère public a parlé après la défense (art. 513, dernier alinéa : le prévenu ou son avocat ont la parole les derniers)
     reponse : la cour n'a pas répondu à des conclusions régulièrement déposées (art. 593)
     peine   : emprisonnement ferme motivé par la seule gravité des faits (art. 132-19 CP, art. 485-1 CPP)
   Puis il conseille (ne pas se pourvoir est le bon conseil quand l'arrêt est régulier), déclare le pourvoi au bon greffe
   (art. 576), choisit qui signe le mémoire (art. 584, 585, 585-1) et quels moyens soutenir : la Cour ne rejuge pas les faits.
   La chambre criminelle statue quelques mois plus tard (CR.GLOBAL_FN.cassArret) : cassation, non-admission (art. 567-1-1),
   irrecevabilité ou désistement. La fiche du classeur reçoit les notions. */
(function () {
  const CR = window.CR, UI = CR.UI;
  const CASS = (CR.CASS = {});
  const D = (d) => CR.fmtDate(d, "long");

  if (CR.ACTES && !CR.ACTES.pourvoi) CR.ACTES.pourvoi = {
    id: "pourvoi", acte: "Pourvoi en cassation", qui: "Le condamné, la partie civile (pour ses seuls intérêts civils), le ministère public", ou: "Greffe de la juridiction qui a rendu la décision attaquée (art. 576)",
    conditions: "Décision rendue en dernier ressort ; moyens de pur droit : violation de la loi, défaut ou insuffisance de motifs, défaut de réponse à conclusions (art. 591 et 593). La Cour ne rejuge pas les faits",
    delai: "10 jours francs à compter du prononcé (art. 568 ; 5 jours avant le 30 septembre 2024). Mémoire personnel signé du demandeur : 10 jours au greffe de la juridiction (art. 584), ou un mois au greffe de la Cour pour le seul condamné (art. 585 et 585-1)",
    suite: "Sursis à l'exécution de la condamnation pénale pendant le délai et l'instance (art. 569) ; non-admission (art. 567-1-1), rejet, ou cassation avec renvoi devant une autre cour d'appel",
    sanction: "Irrecevabilité si tardif ou mal déclaré ; mémoire irrecevable s'il n'est pas signé du demandeur lui-même", invoque: "La Cour, d'office", regul: "Aucune pour un délai expiré",
    art: "CPP, art. 567, 568, 569, 576, 584, 585, 585-1, 591, 593", art2029: "", prog: "pp_recours",
    source: (CR.ACTES.appel_corr && CR.ACTES.appel_corr.source) || "",
  };

  const MOYENS = {
    parole: { t: "La cour a entendu le ministère public après la défense : le prévenu ou son avocat doivent avoir la parole les derniers", art: "art. 513, dernier alinéa, CPP", bon: true,
      pourquoi: "L'arrêt constate lui-même l'ordre des prises de parole : la défense, puis le ministère public, puis le délibéré. La règle est d'ordre public et tient aux droits de la défense." },
    reponse: { t: "La cour n'a pas répondu aux conclusions qui demandaient la dispense d'inscription au bulletin n° 2", art: "art. 593 CPP", bon: true,
      pourquoi: "L'arrêt vise les conclusions régulièrement déposées, puis n'en dit plus un mot : le défaut de réponse à conclusions équivaut à un défaut de motifs." },
    reponse_pc: { t: "La cour n'a pas répondu aux conclusions de la partie civile sur un poste de préjudice chiffré et justifié", art: "art. 593 CPP", bon: true,
      pourquoi: "L'arrêt vise les conclusions de la partie civile et rejette l'ensemble des demandes sans examiner ce poste : défaut de réponse à conclusions." },
    peine: { t: "L'emprisonnement ferme n'est motivé que par la gravité des faits, sans un mot sur la personnalité ni sur la situation du condamné", art: "art. 132-19 CP et 485-1 CPP", bon: true,
      pourquoi: "Une peine d'emprisonnement sans sursis doit être motivée au regard des faits, de la personnalité de l'auteur et de sa situation matérielle, familiale et sociale : l'arrêt ne vise que la gravité des faits." },
    faits: { t: "Les témoins n'étaient pas crédibles : la cour s'est trompée sur ce qui s'est passé", art: "", bon: false,
      pourquoi: "C'est un moyen de pur fait. Les juges du fond apprécient souverainement la valeur des preuves ; la Cour de cassation ne rejuge pas l'affaire." },
    quantum: { t: "La peine est trop lourde pour un dossier pareil", art: "", bon: false,
      pourquoi: "Le quantum d'une peine légale et motivée relève du pouvoir des juges du fond : la Cour contrôle la motivation, pas la sévérité." },
    nouveau: { t: "La garde à vue était irrégulière, ce que personne n'avait soulevé jusqu'ici", art: "", bon: false,
      pourquoi: "Moyen nouveau, mélangé de fait et de droit : il ne peut pas être présenté pour la première fois devant la Cour de cassation. Les nullités se soulèvent avant toute défense au fond (art. 385)." },
    civil_faits: { t: "Le préjudice est évident : la cour aurait dû croire la victime", art: "", bon: false,
      pourquoi: "L'existence et l'étendue du préjudice relèvent de l'appréciation souveraine des juges du fond." },
  };
  CASS.MOYENS = MOYENS;

  // ------------------------------------------------------------ quand un pourvoi est-il ouvert ?
  const apresAppel = (cs) => (cs.vars && cs.vars.vieArret != null) || !!(cs.proc && cs.proc.appel && cs.proc.appel.recevable !== false && (cs.hearings || []).some((h) => h.attended && /appel/i.test((h.title || "") + " " + (h.where || ""))));
  CASS.eligible = function (s, cs) {
    if (!s || s.mode !== "carriere" || !cs || !cs.outcome || (cs.vars && cs.vars.cass)) return false;
    const t = cs.outcome.type, pc = cs.camp === "pc";
    if (!(pc ? ["deboute"].includes(t) : t === "condamnation")) return false;
    return apresAppel(cs);
  };
  CASS.ouvrir = function (s, cs) {
    const r = CR.seeded("cass:" + cs.id + ":" + (s.seed || 0));
    const pc = cs.camp === "pc";
    const detail = (cs.outcome && cs.outcome.detail) || "";
    const d2 = detail.toLowerCase();
    const ferme = /ferme|mandat de dépôt/.test(d2) || (/emprisonnement/.test(d2) && !/sursis/.test(d2)) || /dont [^—;]*sursis/.test(d2);
    const pool = pc ? ["reponse_pc"] : ["parole", "reponse"].concat(ferme ? ["peine"] : []);
    const vice = r() < (pc ? 0.55 : 0.65) ? pool[Math.floor(r() * pool.length)] : null;
    cs.vars.cass = { day: s.day, limite: CR.rollForward(s.day + 11), vice, etat: "delai", ferme, pc };
    const ca = CASS.cour(s, cs);
    CR.mail(s, {
      from: `${ca} — greffe`, subj: `Arrêt du ${D(s.day)} — ${CR.clientName(cs)}`, kind: "greffe", important: true, caseId: cs.id,
      body: [[`L'arrêt de la chambre des appels correctionnels a été prononcé le ${D(s.day)}. La copie est à votre disposition.`], [`Il peut être frappé d'un pourvoi en cassation dans les dix jours francs du prononcé (art. 568 du code de procédure pénale), soit jusqu'au ${D(cs.vars.cass.limite)} inclus. Passé ce délai, il sera définitif.`], ["Depuis votre bureau : « Lire l'arrêt »."]],
    });
    if (CR.addAgenda) { try { s.agenda.push({ id: CR.uid("a"), created: s.day, day: cs.vars.cass.limite, title: `Dernier jour pour le pourvoi en cassation — ${CR.clientName(cs)}`, caseId: cs.id }); s.agenda.sort((x, y) => x.day - y.day || (x.min || 0) - (y.min || 0)); } catch (e) { /* agenda facultatif */ } }
  };
  CASS.cour = function (s, cs) {
    const h = (cs.hearings || []).slice().reverse().find((x) => /cour d'appel/i.test((x.title || "") + " " + (x.where || "")));
    const m = h && ((h.title || "") + " " + (h.where || "")).match(/cour d'appel de [A-ZÉ][\wéèàç-]+/i);
    return m ? m[0].replace(/^c/, "C") : "Cour d'appel de Paris";
  };
  CASS.ouverts = (s) => (s.order || []).map((id) => s.cases[id]).filter((cs) => cs && cs.vars && cs.vars.cass && cs.vars.cass.etat === "delai");
  CASS.enCours = (s) => (s.order || []).map((id) => s.cases[id]).filter((cs) => cs && cs.vars && cs.vars.cass && cs.vars.cass.etat === "pendant");

  // ------------------------------------------------------------ l'arrêt, tel que le joueur le lit
  CASS.arret = function (s, cs) {
    const c = cs.vars.cass, ca = CASS.cour(s, cs), nom = CR.clientName(cs), moi = `Me ${s.player.nom}`;
    const detail = (cs.outcome && cs.outcome.detail) || "";
    const P = [];
    P.push({ k: "tete", t: `${ca}. Chambre des appels correctionnels. Arrêt du ${D(c.day)}, prononcé publiquement, contradictoirement.` });
    P.push({ k: "compo", t: "Composition de la cour, lors des débats et du délibéré : un président de chambre et deux conseillers, assistés d'un greffier ; le ministère public représenté aux débats par un avocat général." });
    if (c.pc) {
      P.push({ k: "debats", t: `Débats. À l'audience publique ont été entendus : le président en son rapport ; ${moi}, avocat de ${nom}, partie civile, en sa plaidoirie ; le ministère public en ses réquisitions ; l'avocat du prévenu en sa plaidoirie ; le prévenu, qui a eu la parole en dernier.` });
      P.push({ k: "concl", t: `Conclusions. Par conclusions régulièrement déposées et visées par le greffier, ${nom} demande la réparation de son préjudice, poste par poste, pièces à l'appui, dont les frais restés à sa charge.` });
      P.push({ k: "motifs", t: "Motifs. Sur l'action civile : la cour, après en avoir délibéré, estime que la preuve d'un préjudice découlant directement des faits poursuivis n'est pas rapportée." });
      if (c.vice !== "reponse_pc") P.push({ k: "reponse", t: "Sur les frais restés à charge : les justificatifs produits ne se rattachent pas aux faits dont la cour est saisie ; la demande est rejetée pour ce motif." });
      P.push({ k: "dispo", t: "Par ces motifs, la cour déboute la partie civile de l'ensemble de ses demandes." });
      return P;
    }
    P.push({ k: "debats", t: c.vice === "parole"
      ? `Débats. À l'audience publique ont été entendus : le président en son rapport ; ${nom} en ses explications ; ${moi}, avocat du prévenu, en sa plaidoirie ; le ministère public en ses réquisitions. Puis l'affaire a été mise en délibéré.`
      : `Débats. À l'audience publique ont été entendus : le président en son rapport ; ${nom} en ses explications ; le ministère public en ses réquisitions ; ${moi}, avocat du prévenu, en sa plaidoirie ; le prévenu, qui a eu la parole en dernier. Puis l'affaire a été mise en délibéré.` });
    P.push({ k: "concl", t: "Conclusions. Par conclusions régulièrement déposées et visées par le greffier, la défense demande à la cour, à titre subsidiaire, de dire que la condamnation ne sera pas mentionnée au bulletin n° 2 du casier judiciaire (art. 775-1 du code de procédure pénale)." });
    P.push({ k: "motifs", t: "Motifs. Sur la culpabilité : les faits sont établis par les constatations des enquêteurs et par les déclarations recueillies, que les dénégations du prévenu ne suffisent pas à combattre." });
    P.push({ k: "peine", t: c.vice === "peine"
      ? "Sur la peine : eu égard à la gravité des faits, la cour prononce la peine fixée au dispositif."
      : c.ferme ? "Sur la peine : la gravité des faits, la personnalité du prévenu telle qu'elle ressort de son casier et des pièces produites, sa situation matérielle, familiale et sociale rendent indispensable une peine d'emprisonnement sans sursis, toute autre sanction étant manifestement inadéquate."
        : "Sur la peine : la cour tient compte de la gravité des faits, de la personnalité du prévenu et de sa situation matérielle, familiale et sociale." });
    if (c.vice !== "reponse") P.push({ k: "reponse", t: "Sur la demande de dispense d'inscription au bulletin n° 2 : la nature des faits ne la justifie pas ; elle est rejetée." });
    P.push({ k: "dispo", t: `Par ces motifs, la cour statue ainsi : ${detail || "condamnation"}.` });
    return P;
  };
  CASS.choixMoyens = function (s, cs) {
    const c = cs.vars.cass;
    const ids = c.pc ? ["reponse_pc", "civil_faits", "nouveau", "quantum"] : ["parole", "reponse", "peine", "faits", "quantum", "nouveau"];
    // un moyen de droit qui ne correspond pas à l'arrêt est faux en fait : la Cour le constate à la lecture
    return ids.filter((id) => id !== "peine" || c.ferme).map((id) => Object.assign({ id, fonde: MOYENS[id].bon && c.vice === id }, MOYENS[id]));
  };

  // ------------------------------------------------------------ les décisions du joueur
  const fin = (s, cs, etat, bilan) => { const c = cs.vars.cass; c.etat = etat; c.bilan = (c.bilan || []).concat(bilan); c.fin = s.day; CR.timeline(s, cs, bilan[0].text); };
  CASS.renoncer = function (s, cs) {
    const c = cs.vars.cass;
    if (c.vice) { CR.trust(s, cs, -4); fin(s, cs, "renonce", [{ kind: "bad", text: `Vous avez déconseillé le pourvoi, alors que l'arrêt portait un vice de droit : ${MOYENS[c.vice].t.replace(/^./, (x) => x.toLowerCase())} (${MOYENS[c.vice].art}).` }, { kind: "rule", text: MOYENS[c.vice].pourquoi }]); }
    else { CR.rep(s, "clients", 1, "conseil"); CR.trust(s, cs, 3); fin(s, cs, "renonce", [{ kind: "good", text: "Vous avez déconseillé le pourvoi : l'arrêt était régulier en la forme et motivé. La Cour de cassation n'est pas un troisième degré de juridiction, et vous avez épargné des frais inutiles à votre client." }]); }
    CASS.verser(s, cs);
  };
  CASS.declarer = function (s, cs, ou) {
    const c = cs.vars.cass;
    if (s.day > c.limite) { fin(s, cs, "tardif", [{ kind: "bad", text: `Pourvoi tardif : le délai de dix jours francs (art. 568) expirait le ${D(c.limite)}. L'arrêt est définitif.` }]); CASS.verser(s, cs); return "tardif"; }
    if (ou !== "cour") {
      c.fauxGreffe = (c.fauxGreffe || 0) + 1;
      CR.spend(s, 120, "admin");
      CR.erreur(s, cs, { id: "cass_greffe", texte: ou === "cassation" ? "Vous avez voulu déclarer le pourvoi au greffe de la Cour de cassation." : "Vous avez adressé le pourvoi par lettre au parquet général.", sanction: "Une demi-journée perdue : le pourvoi se déclare au greffe de la juridiction qui a rendu la décision (art. 576).", regul: "Refaire la déclaration au bon greffe, tant que le délai court." });
      return "faux";
    }
    CR.spend(s, 45, "admin");
    c.declare = s.day; c.etat = "declare";
    CR.timeline(s, cs, `Pourvoi en cassation déclaré au greffe de la ${CASS.cour(s, cs).replace(/^C/, "c")}.`);
    return "ok";
  };
  // qui : "personnel" (le client signe), "avocat" (vous signez), "conseils" (avocat aux Conseils), "direct" (envoi à la Cour par le demandeur)
  CASS.deposer = function (s, cs, qui, moyens) {
    const c = cs.vars.cass;
    c.qui = qui; c.moyens = (moyens || []).slice(0, 2); c.etat = "pendant";
    c.arretDay = CR.rollForward(s.day + 110 + Math.floor(CR.seeded("cassd" + cs.id + s.seed)() * 80));
    CR.schedule(s, { day: c.arretDay, type: "fn", key: "cassArret", data: { caseId: cs.id } });
    CR.spend(s, qui === "conseils" ? 30 : 90, "admin");
    CR.timeline(s, cs, qui === "conseils" ? "Dossier transmis à un avocat au Conseil d'État et à la Cour de cassation." : "Mémoire déposé à l'appui du pourvoi.");
    CR.log(s, `Pourvoi en cassation — ${CR.clientName(cs)} : la chambre criminelle statuera dans quelques mois. ${c.pc ? "Le pourvoi de la partie civile ne porte que sur ses intérêts civils." : "D'ici là, il est sursis à l'exécution de la condamnation pénale (art. 569), sauf mandat de dépôt."}`, "info", cs.id);
  };

  CASS.juger = function (s, cs) {
    const c = cs.vars.cass;
    if (!c || c.etat !== "pendant") return;
    const ch = (c.moyens || []).map((id) => MOYENS[id]).filter(Boolean);
    const fonde = (c.moyens || []).some((id) => MOYENS[id] && MOYENS[id].bon && c.vice === id);
    let etat, bilan = [];
    if (c.qui === "avocat") { etat = "irrecevable"; bilan = [{ kind: "bad", text: "Mémoire irrecevable : vous l'avez signé vous-même. Le mémoire personnel doit porter la signature du demandeur (art. 584) ; un avocat à la cour ne peut pas le signer à sa place. La Cour n'a examiné aucun moyen." }]; }
    else if (c.qui === "direct" && c.pc) { etat = "irrecevable"; bilan = [{ kind: "bad", text: "Mémoire irrecevable : passé le délai de dix jours, seul le demandeur condamné pénalement peut adresser son mémoire directement à la Cour de cassation. La partie civile doit alors recourir à un avocat aux Conseils (art. 585)." }]; }
    else if (c.qui === "conseils" && !c.vice) { etat = "desistement"; bilan = [{ kind: "info", text: "L'avocat aux Conseils a lu l'arrêt et n'y a trouvé aucun moyen sérieux : il a conseillé le désistement, que votre client a suivi. Le conseil de ne pas former de pourvoi aurait évité ces frais." }]; }
    else if (c.qui === "conseils" && c.vice) {
      etat = "cassation";
      bilan = [{ kind: "good", text: `Cassation : ${MOYENS[c.vice].t.replace(/^./, (x) => x.toLowerCase())} (${MOYENS[c.vice].art}).` }, { kind: "rule", text: MOYENS[c.vice].pourquoi }];
      if (!fonde) bilan.push({ kind: "info", text: "Le moyen qui a emporté la cassation n'était pas dans votre note : c'est l'avocat aux Conseils qui l'a relevé." });
    } else if (fonde) { etat = "cassation"; bilan = [{ kind: "good", text: `Cassation : ${MOYENS[c.vice].t.replace(/^./, (x) => x.toLowerCase())} (${MOYENS[c.vice].art}).` }, { kind: "rule", text: MOYENS[c.vice].pourquoi }]; }
    else { etat = "non_admis"; bilan = [{ kind: "bad", text: "Pourvoi non admis (art. 567-1-1) : aucun moyen de nature à permettre l'admission du pourvoi." }]; if (c.vice) bilan.push({ kind: "surprise", text: `L'arrêt portait pourtant un vice que vous n'avez pas soutenu : ${MOYENS[c.vice].t.replace(/^./, (x) => x.toLowerCase())} (${MOYENS[c.vice].art}).` }); }
    for (const m of ch) if (!(m.bon && c.vice && MOYENS[c.vice] === m)) bilan.push({ kind: "rule", text: `« ${m.t} » : ${m.bon ? "le moyen manquait en fait, l'arrêt contient précisément la mention que vous disiez absente." : m.pourquoi}` });
    const renvoi = /Versailles/.test(CASS.cour(s, cs)) ? "Paris" : "Versailles";
    c.renvoi = renvoi;
    if (etat === "cassation") {
      cs.outcome.detail = `${cs.outcome.detail ? cs.outcome.detail + " — " : ""}arrêt cassé, renvoi devant la cour d'appel de ${renvoi}`;
      const seul = c.qui !== "conseils" || fonde; // le moyen venait de vous
      CR.rep(s, "clients", seul ? 3 : 2, "cassation"); CR.rep(s, "confreres", seul ? 2 : 0, "cassation"); CR.rep(s, "siege", 1, "cassation"); CR.trust(s, cs, seul ? 10 : 6);
      if (CR.CAR && s.car) { s.car.favorables = (s.car.favorables || 0) + 1; CR.CAR.verifier(s); }
      s.stats.cassations = (s.stats.cassations || 0) + 1;
    } else if (etat === "non_admis" || etat === "irrecevable") { CR.rep(s, "clients", -1, "pourvoi"); CR.trust(s, cs, -5); cs.outcome.detail = `${cs.outcome.detail ? cs.outcome.detail + " — " : ""}${etat === "non_admis" ? "pourvoi non admis" : "pourvoi irrecevable"}`; }
    const titre = { cassation: "Cassation", non_admis: "Non-admission du pourvoi", irrecevable: "Irrecevabilité", desistement: "Désistement" }[etat];
    fin(s, cs, etat, bilan);
    CR.mail(s, {
      from: "Cour de cassation — greffe criminel", subj: `${titre} — ${CR.clientName(cs)}`, kind: "greffe", important: true, caseId: cs.id,
      body: [[etat === "cassation" ? `La chambre criminelle casse et annule l'arrêt de la ${CASS.cour(s, cs).replace(/^C/, "c")} du ${D(c.day)} et renvoie la cause et les parties devant la cour d'appel de ${renvoi}, pour qu'il soit à nouveau jugé conformément à la loi.` : etat === "non_admis" ? "La chambre criminelle déclare le pourvoi non admis." : etat === "irrecevable" ? "La chambre criminelle déclare le mémoire irrecevable et rejette le pourvoi." : "Il est donné acte du désistement du pourvoi."]].concat(bilan.map((b) => [b.text])),
    });
    CR.toast(s, `Cour de cassation — ${CR.clientName(cs)} : ${titre.toLowerCase()}.`, etat === "cassation" ? "good" : etat === "desistement" ? "info" : "bad");
    if (CR.SON && etat === "cassation") CR.SON.jouer("verdict_bon");
    CASS.verser(s, cs);
  };
  CR.GLOBAL_FN.cassArret = function (s, d) { const cs = s.cases[d.caseId]; if (cs) { try { CASS.juger(s, cs); } catch (e) { console.error(e); } } };

  // les notions du pourvoi rejoignent la fiche de révision du dossier
  CASS.verser = function (s, cs) {
    const f = (s.classeur || []).find((x) => x.caseId === cs.id), c = cs.vars.cass;
    if (!f || f.cassVerse) return;
    f.cassVerse = true;
    f.notions = (f.notions || []).concat([
      { titre: "Le délai du pourvoi", regle: "Dix jours francs à compter du prononcé de la décision ; la déclaration se fait au greffe de la juridiction qui l'a rendue.", art: "art. 568 et 576 CPP", prog: "pp_recours" },
      { titre: "Ce que juge la Cour de cassation", regle: "Le droit, pas les faits : violation de la loi, défaut ou insuffisance de motifs, défaut de réponse à conclusions. L'appréciation des preuves et le choix du quantum restent aux juges du fond.", art: "art. 591 et 593 CPP", prog: "pp_recours" },
      { titre: "Le mémoire personnel", regle: "Il porte la signature du demandeur lui-même ; au-delà de dix jours, seul le condamné peut l'adresser directement à la Cour, dans le mois du pourvoi ; les autres parties passent par un avocat aux Conseils.", art: "art. 584, 585 et 585-1 CPP", prog: "pp_recours" },
    ]);
    if (c && c.vice) f.corrige = (f.corrige || []).concat([{ probleme: "L'arrêt d'appel pouvait-il être cassé ?", regle: `${MOYENS[c.vice].t} (${MOYENS[c.vice].art}).`, application: MOYENS[c.vice].pourquoi }]);
    f.fait = f.fait || { bons: [], erreurs: [] };
    for (const b of c.bilan || []) { if (b.kind === "good") f.fait.bons.push(b.text); else if (b.kind === "bad") f.fait.erreurs.push({ texte: b.text, sanction: "Le pourvoi n'a pas prospéré.", regul: "" }); }
  };

  // ------------------------------------------------------------ branchements
  const cc = CR.closeCase;
  CR.closeCase = function (s, cs) {
    const deja = cs.status === "closed";
    const r = cc.apply(this, arguments);
    try { if (!deja && CASS.eligible(s, cs)) CASS.ouvrir(s, cs); } catch (e) { console.error(e); }
    return r;
  };
  const ed = CR.endDay;
  CR.endDay = function (s) {
    const r = ed.apply(this, arguments);
    try {
      for (const cs of CASS.ouverts(s).concat((s.order || []).map((id) => s.cases[id]).filter((x) => x && x.vars && x.vars.cass && x.vars.cass.etat === "declare"))) {
        const c = cs.vars.cass;
        if (c.etat === "delai" && s.day > c.limite) {
          fin(s, cs, "expire", [c.vice ? { kind: "bad", text: `Le délai du pourvoi a expiré le ${D(c.limite)} sans que vous ayez lu l'arrêt avec votre client. Il portait un vice de droit : ${MOYENS[c.vice].t.replace(/^./, (x) => x.toLowerCase())} (${MOYENS[c.vice].art}).` } : { kind: "info", text: `Le délai du pourvoi a expiré le ${D(c.limite)} : l'arrêt est définitif. Il était régulier ; encore fallait-il le lire pour le dire à votre client.` }]);
          if (c.vice) CR.trust(s, cs, -6);
          CR.log(s, `Arrêt définitif — ${CR.clientName(cs)} : le délai du pourvoi en cassation est expiré.`, c.vice ? "bad" : "info", cs.id);
          CASS.verser(s, cs);
        } else if (c.etat === "declare" && s.day > c.declare + 10) {
          // pourvoi déclaré mais jamais soutenu : aucun mémoire
          c.qui = "aucun"; fin(s, cs, "non_admis", [{ kind: "bad", text: "Pourvoi déclaré, mais aucun mémoire n'a été déposé pour le soutenir : il n'a pas été admis." }]);
          CR.trust(s, cs, -5); CASS.verser(s, cs);
        }
      }
    } catch (e) { console.error(e); }
    return r;
  };

  // ------------------------------------------------------------ la scène : lire l'arrêt, conseiller, déclarer, soutenir
  if (!UI) return;
  const { html, Btn, cx } = UI;
  const { useState } = React;
  UI.CassationBandeau = function CassationBandeau({ s, go }) {
    const ouverts = CASS.ouverts(s).concat((s.order || []).map((id) => s.cases[id]).filter((x) => x && x.vars && x.vars.cass && x.vars.cass.etat === "declare"));
    const pend = CASS.enCours(s);
    if (!ouverts.length && !pend.length) return null;
    return html`<div className="cass-bandeau">
      ${ouverts.map((cs) => { const c = cs.vars.cass, reste = c.limite - s.day; return html`<div key=${cs.id} className=${cx("court-call", reste <= 2 && "urgent")}><div><strong>Arrêt d'appel — ${CR.clientName(cs)}</strong><span className="small muted"> ${c.etat === "declare" ? "Pourvoi déclaré : il reste à le soutenir par un mémoire." : `Pourvoi en cassation possible jusqu'au ${D(c.limite)} inclus (${reste <= 0 ? "dernier jour" : reste + " jour" + (reste > 1 ? "s" : "")}).`}</span></div><${Btn} small kind="primary" onClick=${() => go.scene({ type: "cassation", caseId: cs.id })}>${c.etat === "declare" ? "Soutenir le pourvoi" : "Lire l'arrêt"}</${Btn}></div>`; })}
      ${pend.map((cs) => html`<p key=${cs.id} className="small muted">Pourvoi en cours — ${CR.clientName(cs)} : la chambre criminelle statuera vers le ${CR.fmtDate(cs.vars.cass.arretDay, "short")}.</p>`)}
    </div>`;
  };
  UI.CassationScene = function CassationScene({ s, cs, onDone }) {
    const c = cs.vars.cass;
    const [phase, setPhase] = useState(c.etat === "declare" ? "memoire" : "lecture");
    const [msg, setMsg] = useState(null);
    const [qui, setQui] = useState(null);
    const [pick, setPick] = useState([]);
    const bump = () => CR.store.bump();
    const arret = CASS.arret(s, cs);
    const fini = !["delai", "declare"].includes(c.etat);
    const toggle = (id) => setPick(pick.includes(id) ? pick.filter((x) => x !== id) : pick.length >= 2 ? pick : pick.concat(id));
    const QUI = [
      ["personnel", `${c.pc ? "La partie civile" : "Votre client"} signe un mémoire personnel, que vous l'aidez à rédiger`, "Déposé au greffe de la cour d'appel dans les dix jours de la déclaration (art. 584)."],
      ["avocat", "Vous signez vous-même le mémoire, au nom de votre client", "Vous connaissez le dossier mieux que personne."],
      ["conseils", "Confier le pourvoi à un avocat au Conseil d'État et à la Cour de cassation", "C'est son métier ; ses honoraires sont à la charge du client."],
    ].concat(c.pc ? [["direct", "La partie civile enverra elle-même son mémoire à la Cour de cassation, dans le mois", "Cela laisse plus de temps."]] : []);
    return html`<div className="scene cass-scene">
      <div className="cass-doc">
        <div className="paper paper-greffe cass-arret"><h3 className="paper-title">Arrêt</h3>${arret.map((p) => html`<p key=${p.k}>${p.t}</p>`)}</div>
      </div>
      <div className="cass-side">
        <span className="pix">Pourvoi en cassation — ${CR.clientName(cs)}</span>
        ${fini ? html`<div className="cass-box"><p><strong>${{ renonce: "Pas de pourvoi.", tardif: "Pourvoi tardif.", pendant: "Le pourvoi est formé.", expire: "Délai expiré." }[c.etat] || "Dossier clos."}</strong></p>${(c.bilan || []).map((b, i) => html`<p key=${i} className=${"cass-" + b.kind}>${b.text}</p>`)}${c.etat === "pendant" && html`<p className="small muted">La chambre criminelle statuera vers le ${D(c.arretDay)}. ${c.pc ? "" : "D'ici là, il est sursis à l'exécution de la condamnation pénale (art. 569), sauf mandat de dépôt."}</p>`}<${Btn} kind="primary" onClick=${onDone}>Fermer</${Btn}></div>`
        : phase === "lecture" ? html`<div className="cass-box">
            <p>Lisez l'arrêt. La Cour de cassation ne rejuge pas l'affaire : elle vérifie que la cour d'appel a respecté la loi et motivé sa décision. Un pourvoi sans moyen de droit ne mène nulle part.</p>
            <p className="small muted">Délai : dix jours francs à compter du prononcé (art. 568), soit jusqu'au ${D(c.limite)} inclus.</p>
            <div className="choices">
              <button className="choice" onClick=${() => setPhase("declaration")}><strong>Conseiller le pourvoi</strong><span className="small muted"> — vous avez vu dans l'arrêt de quoi le soutenir.</span></button>
              <button className="choice" onClick=${() => { CASS.renoncer(s, cs); bump(); }}><strong>Déconseiller le pourvoi</strong><span className="small muted"> — l'arrêt vous paraît régulier ; il deviendra définitif.</span></button>
              <button className="choice" onClick=${onDone}><strong>Y réfléchir encore</strong><span className="small muted"> — le délai continue de courir.</span></button>
            </div>
          </div>`
        : phase === "declaration" ? html`<div className="cass-box">
            <p><strong>Où déclarez-vous le pourvoi ?</strong></p>
            ${msg && html`<p className="cass-bad">${msg}</p>`}
            <div className="choices">
              ${[["cassation", "Au greffe de la Cour de cassation, quai de l'Horloge"], ["cour", `Au greffe de la ${CASS.cour(s, cs).replace(/^C/, "c")}, qui a rendu l'arrêt`], ["parquet", "Par lettre recommandée au procureur général"]].map(([k, l]) => html`<button key=${k} className="choice" onClick=${() => { const r = CASS.declarer(s, cs, k); if (r === "ok") { setMsg(null); setPhase("memoire"); } else if (r === "faux") setMsg("Ce n'est pas là. Vous y avez laissé deux heures ; le délai court toujours."); bump(); }}>${l}</button>`)}
            </div>
          </div>`
        : phase === "memoire" ? html`<div className="cass-box">
            <p><strong>Le pourvoi est déclaré. Qui le soutient ?</strong></p>
            <div className="choices">${QUI.map(([k, l, sub]) => html`<button key=${k} className=${cx("choice", qui === k && "on")} onClick=${() => setQui(k)}><strong>${l}</strong><span className="small muted"> — ${sub}</span></button>`)}</div>
            <${Btn} kind="primary" disabled=${!qui} onClick=${() => setPhase("moyens")}>Continuer</${Btn}>
          </div>`
        : html`<div className="cass-box">
            <p><strong>${qui === "conseils" ? "Votre note à l'avocat aux Conseils : quels moyens voyez-vous ?" : "Quels moyens le mémoire soutient-il ?"}</strong> <span className="small muted">Deux au plus (${pick.length}/2).</span></p>
            <div className="args">${CASS.choixMoyens(s, cs).map((m) => html`<button key=${m.id} className=${cx("arg", pick.includes(m.id) && "on")} onClick=${() => toggle(m.id)}><span>${m.t}${m.art ? html` <em className="small muted">(${m.art})</em>` : ""}</span></button>`)}</div>
            <div className="car-btns"><${Btn} kind="primary" disabled=${pick.length === 0} onClick=${() => { CASS.deposer(s, cs, qui, pick); bump(); }}>${qui === "conseils" ? "Transmettre le dossier" : "Déposer le mémoire"}</${Btn}><${Btn} onClick=${() => setPhase("memoire")}>Retour</${Btn}></div>
          </div>`}
      </div>
    </div>`;
  };
})();
