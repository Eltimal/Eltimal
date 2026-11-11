/* La Permanence — tutoriel : l'affaire miroir.
   Chapitre 1 : vous assistez Lucas Bernier, victime (partie civile).
   Chapitre 2 : la même soirée, de l'autre côté de la barre : vous défendez Thomas Moreau.
   Faits fictifs. Lieux réels (rue Damrémont, hôpital Bichat, UMJ de l'Hôtel-Dieu, tribunal des Batignolles). */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const MENTOR = () => CR.MENTOR.nom;

  const LUCAS = { prenom: "Lucas", nom: "Bernier", g: "m", age: 26, metier: "livreur à vélo", tel: "06 12 48 77 30", trust: 60, look: { skin: 1, hair: "short", hc: "brown" } };
  const THOMAS = { prenom: "Thomas", nom: "Moreau", g: "m", age: 31, metier: "cuisinier", tel: "06 71 05 92 14", trust: 55, look: { skin: 0, hair: "buzz", hc: "blonde", beard: 1 } };
  const faitsTxt = (cs) => `le ${CR.fmtDate(cs.proc.faitsDay, "dow")}, vers 22 h 40, rue Damrémont, à Paris 18e`;

  // Le mentor écrit à chaque étape : la méthode, jamais la réponse
  const mentor = (api, subject, paras) => CR.mail(api.s, { from: MENTOR(), subject, kind: "email", caseId: api.cs.id, body: paras.map((p) => [p]) });

  // Le seuil des huit jours : le tribunal choisit entre deux certificats
  function qualifITT(api, ctx, camp) {
    const { cs, s } = api;
    const pl = ctx.played;
    let p10;
    if (camp === "pc") {
      p10 = 0.5;
      if (pl.has("arg:itt10")) p10 += 0.25;
      if (pl.has("p_umj") || api.flag("umjRappele")) p10 += 0.1;
      if (pl.has("CP_222-11") || pl.has("CP_R625-1")) p10 += 0.05;
      if (api.flag("presidentSix") && !pl.has("arg:itt10")) p10 -= 0.15;
      if (pl.has("arg:itt_arret")) p10 -= 0.1;
    } else {
      p10 = 0.8;
      if (pl.has("arg:itt6")) p10 -= 0.15;
      if (pl.has("arg:umj_tardif")) p10 -= 0.2;
      if (pl.has("arg:seuil")) p10 -= 0.1;
      if (pl.has("F2_umj_date") && !pl.has("arg:umj_tardif")) p10 -= 0.05;
      if (ctx.angle === "relaxe") p10 += 0.05;
    }
    p10 += ((ctx.juge && ctx.juge.severite) || 0.5) - 0.5;
    const roll = CR.seeded(cs.id + "itt" + s.seed)();
    const delit = roll < CR.clamp(p10, 0.05, 0.95);
    cs.vars.ittRetenue = delit ? 10 : 6;
    return delit
      ? { id: "delit", label: "violences volontaires ayant entraîné une incapacité totale de travail de plus de huit jours", court: "délit, art. 222-11 CP", encourue: { prison: 36, amende: 45000 }, requis: cs.vars.requis,
          motif: "Le tribunal retient l'incapacité totale de travail de dix jours fixée par le médecin légiste de l'unité médico-judiciaire, requis à cette fin (art. 222-11 CP)." }
      : { id: "contrav", favorable: true, label: "violences volontaires ayant entraîné une incapacité totale de travail n'excédant pas huit jours", court: "contravention de 5e classe, art. R. 625-1 CP", encourue: { amende: 1500 }, requis: { amende: 900 },
          motif: "Le tribunal retient l'incapacité de six jours constatée aux urgences le soir des faits. Il requalifie les faits en contravention de cinquième classe et statue (art. R. 625-1 CP et 466 CPP)." };
  }

  // Documents communs aux deux chapitres (même affaire, mêmes pièces)
  const certUrgences = (f) => (x) => ({
    title: "Certificat médical initial", kind: "courrier",
    entete: ["Assistance publique – Hôpitaux de Paris", "Hôpital Bichat–Claude-Bernard · Service des urgences", "46, rue Henri-Huchard, 75018 Paris"],
    paras: [
      [`Je soussignée, Dr Agnès Lemaire, certifie avoir examiné ce jour, ${CR.fmtDate(x.cs.proc.faitsDay, "long")} à 23 h 50, M. Lucas Bernier, né le 14 mars 2000.`],
      ["Il déclare avoir reçu un coup de poing au visage et être tombé en arrière sur la main droite, vers 22 h 40."],
      [{ t: "Constatations : fracture non déplacée de l'extrémité distale du radius droit, confirmée à la radiographie ; ecchymose de la pommette gauche.", f: f.fracture }],
      ["Immobilisation par attelle ; avis orthopédique à prévoir."],
      [{ t: "Incapacité totale de travail personnel : 6 (six) jours, sous réserve de complications.", f: f.itt }],
      ["Certificat remis en main propre à l'intéressé pour faire valoir ce que de droit."],
    ],
    signed: "Dr A. Lemaire",
  });
  const certUMJ = (f) => (x) => {
    const v = x.api.v();
    return {
      title: "Certificat médico-légal", kind: "pv",
      entete: ["Unité médico-judiciaire de l'Hôtel-Dieu", "1, parvis Notre-Dame – place Jean-Paul-II, 75004 Paris", "Sur réquisition judiciaire"],
      paras: [
        [{ t: `Examen réalisé le ${v.umjDate}, soit ${x.cs.vars.umjDay - x.cs.proc.faitsDay} jours après les faits, sur réquisition du lieutenant Rocher, commissariat central du 18e arrondissement.`, f: f.date }],
        [`La personne examinée, M. Lucas Bernier, porte un plâtre antébrachio-palmaire droit posé le ${CR.fmtDate(CR.rollForward(x.cs.proc.faitsDay + 3), "long")}.`],
        ["Le dossier des urgences de l'hôpital Bichat fait état d'une fracture de l'extrémité distale du radius droit."],
        [{ t: "La durée de l'incapacité totale de travail personnel est fixée à 10 (dix) jours à compter des faits.", f: f.itt }],
        ["L'incapacité totale de travail s'entend de la gêne réelle et globale dans les actes de la vie courante ; elle ne se confond pas avec un arrêt de travail."],
      ],
      signed: "Dr Julien Vasseur, médecin légiste",
    };
  };
  const pvVideo = (f) => (x) => ({
    title: "Procès-verbal d'exploitation de vidéoprotection", kind: "pv",
    entete: ["Police nationale · Préfecture de police", "Commissariat central du 18e arrondissement", "Procès-verbal n° 2026/18/04417 — cote D9"],
    paras: [
      [`Le ${CR.fmtDate(x.cs.proc.faitsDay + 7, "long")}, nous, lieutenant Damien Rocher, officier de police judiciaire, procédons à l'exploitation de l'enregistrement remis par le gérant du bar Le Damrémont.`],
      ["La caméra, fixée au-dessus de la porte, filme le trottoir sans le son."],
      ["22 h 41 min 02 s : deux hommes se font face sur le trottoir et échangent des propos."],
      [{ t: "22 h 41 min 08 s : l'homme en veste claire, identifié comme Lucas Bernier, pousse des deux mains l'homme en tablier, identifié comme Thomas Moreau.", f: f.pousse }],
      [{ t: "22 h 41 min 10 s : Lucas Bernier recule d'un pas, les bras le long du corps.", f: f.recul }],
      [{ t: "22 h 41 min 12 s : Thomas Moreau s'avance et porte un coup de poing au visage de Lucas Bernier.", f: f.coup }],
      [{ t: "22 h 41 min 13 s : Lucas Bernier chute en arrière et se réceptionne sur la main droite.", f: f.chute }],
      [{ t: "22 h 41 min 20 s : Thomas Moreau reste sur place, s'accroupit près de lui et téléphone.", f: f.secours }],
      ["Un seul coup est porté. Aucun autre geste violent n'apparaît sur l'enregistrement."],
    ],
    signed: "Lt D. Rocher, OPJ",
  });
  const pvTemoin = (f) => () => ({
    title: "Procès-verbal d'audition de témoin", kind: "pv",
    entete: ["Commissariat central du 18e arrondissement", "Audition de M. Romain Esteve, serveur — cote D7"],
    paras: [
      ["Je travaille au Damrémont. Vendredi soir, le client à la veste claire parlait fort depuis une heure avec ses amis."],
      [{ t: "Il avait bu, il était énervé depuis le début de la soirée.", f: f.alcool }],
      ["Thomas lui a demandé de sortir. Dehors, le client l'a poussé. Thomas lui a mis un coup de poing. Le client est tombé."],
      ["Thomas a tout de suite appelé les pompiers. Ce n'est pas quelqu'un de violent."],
    ],
    signed: "Lu, persiste et signe.",
  });

  // =================================================================== CHAPITRE 1 — LUCAS, PARTIE CIVILE
  const F1 = { fracture: "F1_fracture_doc", itt: "F1_urg6" };
  const POSTES_LUCAS = [
    { id: "dft", label: "Déficit fonctionnel temporaire (six semaines de gêne)", demande: 900, base: 750, needs: ["F1_fracture", "F1_fracture_doc"], justif: ["F1_umj10", "F1_urg6", "p_umj", "p_urgences"] },
    { id: "se", label: "Souffrances endurées (fracture, plâtre, rééducation)", demande: 3000, base: 2200, needs: ["F1_fracture", "F1_fracture_doc"], justif: ["F1_umj10", "p_umj", "F1_fracture_doc"] },
    { id: "pgpa", label: "Perte de gains professionnels actuels (six semaines)", demande: 2400, base: 2400, needs: ["F1_revenus", "p_revenus"], justif: ["p_revenus"], sansJustif: 0.25 },
    { id: "frais", label: "Frais divers (attelle, taxis)", demande: 182, base: 182, needs: ["p_factures"], justif: ["p_factures"] },
    { id: "moral", label: "Préjudice moral « à titre exemplaire »", demande: 15000, base: 600, needs: null, justif: null },
  ];

  CR.defineCase({
    id: "tuto_lucas", mode: "tutoriel", camp: "pc", domaine: "pc", domaineLib: "dps",
    title: "Bernier — violences devant un bar (chapitre 1)",
    arrive: { day: 0, min: 9 * 60 + 20 },
    client: LUCAS, caller: "Lucas Bernier", leadPatience: 4,
    voicemail: "Bonjour, Lucas Bernier à l'appareil. On m'a frappé vendredi soir devant un bar, j'ai le poignet cassé. Un ami m'a donné votre nom. Rappelez-moi, s'il vous plaît.",
    profile: { wealth: 1, sens: 0.6, urgency: 0.5, temper: "anxieux" },
    honoraires: { aj: true },
    actors: { parquet: "pq_haddou", adverse: "av_tessier", opj: "opj_rocher" },
    proc: { stade: "contact", nature: "delit", faits: -3, infractions: ["CP_222-11"] },
    dates: { faits: -3 },
    vars: (s, cs) => ({ umjDate: cs.vars.umjDay != null ? CR.fmtDate(cs.vars.umjDay, "long") : "…", audienceDate: cs.proc && cs.proc.audience ? CR.fmtDate(cs.proc.audience.day, "dow") : "…" }),
    facts: {
      F1_date: { label: "La date et l'heure des faits", key: true, why: "Elles fondent la plainte et le point de départ de la prescription." },
      F1_lieu: { label: "Le lieu des faits" },
      F1_auteur: { label: "Le nom de l'auteur, Thomas Moreau", key: true, cat: "party", party: "Thomas Moreau", why: "Sans nom, la plainte vise X et le contrôle des conflits ne prouve rien." },
      F1_coup: { label: "Le coup de poing et la chute", key: true },
      F1_fracture: { label: "La fracture du poignet" },
      F1_pousse: { label: "Lucas reconnaît avoir poussé Thomas le premier", key: true, why: "La défense le plaidera : mieux vaut le savoir avant l'audience que le découvrir à la barre." },
      F1_arret: { label: "Six semaines d'arrêt de travail", why: "À ne pas confondre avec l'ITT pénale." },
      F1_revenus: { label: "Ses revenus de livreur", key: true, why: "La perte de gains se chiffre et se justifie." },
      F1_umj10: { label: "L'ITT de dix jours fixée par l'UMJ", key: true, why: "C'est elle qui fait du coup un délit (art. 222-11)." },
      F1_v_recul: { label: "Sur la vidéo, Lucas recule avant le coup", key: true, why: "Ce détail écarte la légitime défense : l'agression avait cessé." },
    },
    cards: {
      p_urgences: { label: "Certificat des urgences de Bichat (ITT 6 jours)" },
      p_umj: { label: "Certificat de l'UMJ (ITT 10 jours)" },
      p_video: { label: "PV d'exploitation de la vidéo (cote D9)" },
    },
    calls: {
      intake: {
        opening: ["Allô ? Bonjour maître. Lucas Bernier. Je vous appelle parce qu'on m'a frappé vendredi soir. J'ai le poignet dans le plâtre."],
        topics: [
          { id: "t_quoi", q: "Racontez-moi ce qui s'est passé.", a: [{ t: "C'était vendredi soir, vers 22 h 40.", f: "F1_date" }, { t: "Devant le bar Le Damrémont, rue Damrémont, dans le 18e.", f: "F1_lieu" }, "J'étais avec deux copains. Le cuisinier m'a demandé de sortir parce que je parlais trop fort.", { t: "Dehors, il m'a donné un coup de poing au visage et je suis tombé en arrière.", f: "F1_coup" }], cost: 5, tag: "good", unlock: ["t_avant", "t_camera", "t_bu"] },
          { id: "t_qui", q: "Savez-vous qui vous a frappé ?", a: [{ t: "Oui. Thomas Moreau, le cuisinier du bar. Tout le quartier le connaît.", f: "F1_auteur" }], cost: 2, tag: "good", unlock: ["t_temoin"] },
          { id: "t_blessure", q: "Comment allez-vous ? Vous avez vu un médecin ?", a: [{ t: "Je me suis cassé le poignet droit en tombant. Fracture du radius.", f: "F1_fracture" }, { t: "Aux urgences de Bichat, ils m'ont fait un certificat : six jours d'ITT.", f: "F1_urgences" }, "Lundi, ils m'ont mis un plâtre."], cost: 3, tag: "good", unlock: ["t_travail", "t_plainte"] },
          { id: "t_avant", q: "Que s'est-il passé juste avant le coup ? Il faut tout me dire, même ce qui ne vous arrange pas.", a: ["…", { t: "Je l'ai poussé. C'est vrai. Une fois. Il m'avait sorti du bar devant tout le monde.", f: "F1_pousse" }, "Mais lui, il m'a cassé le poignet."], cost: 3, tag: "good" },
          { id: "t_bu", q: "Aviez-vous bu ?", a: [{ t: "Trois bières. Je n'étais pas ivre.", f: "F1_alcool" }], cost: 2, tag: "neutral" },
          { id: "t_camera", q: "Y a-t-il des caméras, des témoins ?", a: [{ t: "Il y a une caméra au-dessus de la porte du bar.", f: "F1_camera" }], cost: 2, tag: "good", unlock: ["t_temoin"] },
          { id: "t_temoin", q: "Quelqu'un a vu la scène ?", a: [{ t: "Le serveur, Romain. Il était sur la terrasse.", f: "F1_temoin" }], cost: 2, tag: "good" },
          { id: "t_travail", q: "Que faites-vous dans la vie ? Cette blessure vous empêche de travailler ?", a: [{ t: "Je suis livreur à vélo, auto-entrepreneur. Avec le plâtre, impossible.", f: "F1_travail" }, { t: "Le chirurgien m'a donné six semaines d'arrêt.", f: "F1_arret" }], cost: 3, tag: "good", unlock: ["t_revenus"] },
          { id: "t_revenus", q: "Combien gagnez-vous par mois, à peu près ?", a: [{ t: "Autour de 1 600 euros, ça dépend des semaines. La plateforme peut me faire une attestation.", f: "F1_revenus" }], cost: 2, tag: "good" },
          { id: "t_plainte", q: "Avez-vous déjà porté plainte ?", a: ["Non. Je ne savais pas comment faire. Je voulais d'abord voir un avocat."], cost: 2, tag: "good" },
          { id: "t_argent", q: "Comment comptez-vous payer un avocat ?", a: ["Je suis payé à la course… On m'a dit que je pouvais avoir l'aide juridictionnelle ?"], cost: 2, tag: "neutral" },
          { id: "t_promesse", q: "Ne vous inquiétez pas : on va le faire condamner lourdement.", a: ["Ah oui ? Tant mieux. Il le mérite."], cost: 1, tag: "bad", fx: { flags: { promesse: true } } },
        ],
        start: ["t_quoi", "t_qui", "t_blessure", "t_argent", "t_promesse"],
        patience: 100,
        close: "Merci, maître. Vous me dites ce que je dois faire ?",
      },
    },
    advice: [
      { id: "a_justif", t: "Gardez tous les justificatifs : factures, ordonnances, arrêts, attestations de revenus." },
      { id: "a_umj", t: "Si la police vous envoie à l'unité médico-judiciaire, allez-y : c'est le médecin légiste qui fixera l'ITT." },
      { id: "a_contact", t: "Ne contactez pas Thomas Moreau et ne retournez pas au bar pour l'instant." },
      { id: "a_reseaux", t: "Publiez la vidéo sur les réseaux sociaux, ça mettra la pression." },
      { id: "a_garantie", t: "Je vous garantis une forte indemnisation." },
    ],
    docs: {
      cert_urgences: certUrgences(F1),
      cert_umj: certUMJ({ date: "F1_umj_date", itt: "F1_umj10" }),
      pv_video: pvVideo({ pousse: "F1_v_pousse", recul: "F1_v_recul", coup: "F1_v_coup", chute: "F1_v_chute", secours: "F1_v_secours" }),
      pv_temoin: pvTemoin({ alcool: "F1_t_alcool" }),
      pv_audition: () => ({
        title: "Procès-verbal d'audition libre de Thomas Moreau", kind: "pv",
        entete: ["Commissariat central du 18e arrondissement", "Audition libre — cote D11"],
        paras: [
          ["Il me parlait mal, il gênait les clients, je lui ai demandé de sortir."],
          [{ t: "Dehors, il m'a poussé. Je lui ai mis un coup de poing, je n'ai pas réfléchi.", f: "F1_aveu" }],
          ["Je regrette. Je ne voulais pas qu'il se casse le poignet. J'ai appelé les pompiers."],
        ],
        signed: "Lu, persiste et signe.",
      }),
      avis_victime: (x) => {
        const a = x.cs.proc.audience;
        return {
          title: "Avis à victime", kind: "greffe",
          entete: ["Tribunal judiciaire de Paris · Parquet", "Parvis du Tribunal de Paris, 75017 Paris", "Bureau d'aide aux victimes"],
          paras: [
            [`Monsieur Lucas Bernier,`],
            ["À la suite de votre plainte, l'auteur présumé des faits, M. Thomas Moreau, a été convoqué par officier de police judiciaire devant le tribunal correctionnel (art. 390-1 du code de procédure pénale)."],
            [{ t: `L'audience aura lieu le ${CR.fmtDate(a.day, "dow")} à 13 h 30, 10e chambre correctionnelle, tribunal judiciaire de Paris.`, f: "F1_audience" }],
            ["Vous pouvez vous constituer partie civile pour demander réparation de votre préjudice : à l'audience, avant les réquisitions du ministère public, ou par lettre recommandée avec avis de réception parvenue au tribunal vingt-quatre heures au moins avant l'audience, accompagnée des justificatifs (art. 420-1 et 421)."],
            ["Vous pouvez être assisté d'un avocat."],
          ],
        };
      },
    },
    docTitles: { cert_urgences: "Certificat des urgences", cert_umj: "Certificat de l'UMJ", pv_video: "PV d'exploitation de la vidéo", pv_temoin: "Audition du serveur", pv_audition: "Audition libre de Thomas Moreau", avis_victime: "Avis à victime" },
    penal: {
      no: ["actes", "copie"],
      plainte: {
        date: ["F1_date"], lieu: ["F1_lieu"], auteur: ["F1_auteur"], faits: ["F1_coup"], prejudice: ["F1_fracture", "F1_urgences", "F1_fracture_doc", "F1_urg6"],
        qualifs: [
          { t: "Violences volontaires ayant entraîné une incapacité totale de travail, la durée exacte devant être fixée par un examen médico-légal (art. 222-11 ou R. 625-1 du code pénal).", ok: true },
          { t: "Tentative de meurtre (art. 221-1 et 121-5 du code pénal).", ok: false, defect: "qualif:excessive" },
          { t: "Injures publiques.", ok: false, defect: "qualif:faux" },
        ],
        pieces: [
          { id: "cert", t: "Certificat médical initial des urgences de l'hôpital Bichat", ok: true, needs: "p_urgences" },
          { id: "camera", t: "Signalement de la caméra du bar Le Damrémont, dont l'enregistrement devra être saisi", ok: true, needs: "F1_camera" },
          { id: "temoin", t: "Identité du témoin : Romain, serveur du bar", ok: null, needs: "F1_temoin" },
        ],
      },
      chiffrage: { postes: POSTES_LUCAS, art475: 1500 },
    },
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      if (!cs.flags.plainteSimple && !CR.drafted(cs, "plainte_simple")) T({ id: "plainte", label: "Rédiger la plainte de Lucas", sub: "Au procureur de la République, par lettre recommandée. Les blancs se remplissent avec votre carnet.", kind: "draft", time: 50, urgent: true, run: () => ({ scene: "draft", tpl: "plainte_simple" }) });
      PEN.persoTasks(api, T, [
        { id: "revenus", label: "Demander à Lucas l'attestation de revenus de la plateforme", sub: "Pour chiffrer la perte de gains.", fact: "p_revenus", text: "Attestation de la plateforme : 1 640 € de revenus moyens par mois sur les six derniers mois.", time: 15, cond: () => CR.hasFact(cs, "F1_travail") || CR.hasFact(cs, "F1_revenus") },
        { id: "factures", label: "Récupérer les factures de Lucas (attelle, taxis)", sub: "Les frais se justifient pièce par pièce.", fact: "p_factures", text: "Factures : attelle 64 € ; quatre trajets en taxi vers l'hôpital, 118 €.", time: 10 },
      ]);
      if (cs.proc.audience && !cs.vars.copieDemandee) T({ id: "copie", label: "Demander la copie de la procédure", sub: "Au greffe correctionnel. Vous y lirez la vidéo, les auditions, le certificat de l'UMJ.", kind: "admin", time: 15, where: "palais", run: () => { cs.vars.copieDemandee = s.day; CR.spend(s, 15, "admin"); api.schedule(R.int(s, 3, 5), "_copie"); api.tl("Copie de la procédure demandée."); CR.toast(s, "Copie demandée au greffe : comptez quelques jours.", "info"); return null; } });
      if (cs.proc.audience && cs.proc.audience.day >= s.day && !cs.flags.prepClient) T({ id: "prep", label: "Préparer Lucas à l'audience", sub: "Le déroulé, ce que demandera la présidente, ce qu'il ne faut pas dire.", kind: "meet", time: 45, run: () => { CR.spend(s, 45, "meet"); cs.flags.prepClient = s.day; CR.updatedClient(s, cs, 1.5); api.tl("Lucas est préparé à l'audience."); return null; } });
    },
    on: {
      engaged(api) {
        const { s, cs } = api;
        api.mail({ from: "Lucas Bernier", subject: "Le certificat des urgences", kind: "email", doc: "cert_urgences", title: "Certificat des urgences de Bichat", body: [["Bonjour maître, voici le certificat des urgences. Merci de vous occuper de moi."]] });
        api.card("p_urgences");
        if (cs.advice.includes("a_justif")) { api.note("Attestation de la plateforme : 1 640 € de revenus moyens par mois sur les six derniers mois.", "p_revenus", "doc"); }
        mentor(api, "Votre premier dossier", ["Mon cher confrère, vous voilà avocat de la victime.", "Avant d'écrire la plainte, relisez votre carnet : la date, le lieu, l'auteur, ce qui s'est passé, le préjudice. Une plainte se rédige avec des faits, pas avec des adjectifs.", "Et souvenez-vous que la victime ne demande pas une peine : elle demande réparation. La peine, c'est le parquet."]);
      },
      apresPlainte(api, { res }) {
        const { s, cs } = api;
        const lent = res.defects.some((d) => d.startsWith("auteur") || d.startsWith("faits") || d.startsWith("date"));
        if (res.defects.some((d) => d.startsWith("qualif"))) CR.erreur(s, cs, { id: "qualif_plainte", texte: "La plainte propose une qualification fantaisiste.", sanction: "Aucune juridique : le parquet qualifie lui-même. Mais votre crédibilité auprès du parquet en souffre.", regul: "Proposer une qualification sobre, ou n'en proposer aucune." });
        if (lent) CR.erreur(s, cs, { id: "plainte_lacunes", texte: "La plainte est incomplète (date, auteur ou déroulé manquant).", sanction: "L'enquête démarre plus lentement : les enquêteurs doivent réentendre la victime.", regul: "Compléter la plainte par un courrier au procureur." });
        else CR.bon(s, cs, { id: "plainte_ok", texte: "Plainte complète : date, lieu, auteur, faits, préjudice." });
        const d = lent ? 7 : 0;
        cs.vars.umjDay = CR.rollForward(Math.max(s.day + 2, cs.proc.faitsDay + 9));
        api.schedule(2 + d, "_enquete");
        api.at(cs.vars.umjDay + 1 + d, "_umj");
        api.at(cs.vars.umjDay + 4 + d, "_audition");
        api.at(cs.vars.umjDay + 7 + d, "_copj");
        CR.PROC.stade(api, "enquete", "Enquête préliminaire ouverte sur plainte.");
      },
      _enquete(api) {
        api.mail({ from: "Commissariat central du 18e", subject: "Votre plainte — M. Lucas Bernier", kind: "courrier", body: [["Maître, le parquet nous a transmis la plainte de votre client pour enquête."], [`M. Bernier est requis pour un examen à l'unité médico-judiciaire de l'Hôtel-Dieu le ${CR.fmtDate(api.cs.vars.umjDay, "dow")}.`], ["L'enregistrement de la caméra du bar a été saisi."], ["Lieutenant D. Rocher"]] });
      },
      _umj(api) {
        api.mail({ from: "Lucas Bernier", subject: "Le certificat de l'UMJ", kind: "email", doc: "cert_umj", title: "Certificat de l'UMJ", body: [["Je suis allé à l'Hôtel-Dieu. Le médecin m'a donné une copie, la voici. Ce n'est pas le même chiffre que Bichat, c'est normal ?"]] });
        api.card("p_umj");
      },
      _audition(api) { api.mail({ from: "Lucas Bernier", subject: "La police a entendu Thomas", kind: "sms", body: [["Maître, le policier m'a appelé : Thomas a été entendu hier, en audition libre. Il paraît qu'il reconnaît le coup."]] }); CR.PROC.event(api, "Audition libre du mis en cause."); },
      _copj(api) {
        const { s, cs } = api;
        let day = CR.rollForward(s.day + 26);
        while (CR.dow(day) !== 2 || !CR.isBusinessDay(day)) day++;
        CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "convocation", convocDay: s.day, president: "pr_benkirane", script: "jugement", done: "apresJugement", onMiss: "_absent", title: "Audience — 10e chambre correctionnelle", duree: 75 });
        CR.PROC.stade(api, "convocation", "Le parquet poursuit : convocation par officier de police judiciaire devant le tribunal correctionnel (art. 390-1).");
        api.mail({ from: "Parquet de Paris — Bureau d'aide aux victimes", subject: "Avis à victime — audience correctionnelle", kind: "greffe", important: true, doc: "avis_victime", title: "Avis à victime" });
        mentor(api, "L'audience approche", ["Le parquet a choisi de poursuivre. Votre client sera partie civile s'il se constitue : avant les réquisitions à l'audience, ou par lettre recommandée arrivée vingt-quatre heures avant.", "Préparez le chiffrage poste par poste, avec un justificatif pour chacun. Un poste sans pièce, le tribunal le réduit.", "Demandez la copie de la procédure. Lisez la vidéo seconde par seconde : la défense le fera."]);
      },
      _copie(api) {
        const { cs } = api;
        for (const [k, t] of [["pv_video", "PV d'exploitation de la vidéo (D9)"], ["pv_temoin", "Audition du serveur (D7)"], ["pv_audition", "Audition libre de Thomas Moreau (D11)"]]) if (!CR.hasDoc(cs, k)) api.doc(k, t);
        api.card("p_video");
        api.mail({ from: "Greffe correctionnel", subject: "Copie de la procédure — affaire Moreau", kind: "greffe", pages: 6, body: [["La copie de la procédure est versée à votre dossier : exploitation de la vidéo, audition du témoin, audition du prévenu."]] });
      },
      _absent(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "absent_pc", texte: "Vous n'étiez pas à l'audience : Lucas s'est retrouvé seul face au tribunal.", sanction: "Sans avocat, il ne s'est pas constitué partie civile à temps : aucune indemnisation prononcée.", regul: "Saisir le juge civil, plus long et plus cher." });
        cs.proc.pcConstituee = cs.proc.pcConstituee && cs.vars.constitutionMode === "lettre";
        api.trust(-30);
        CR.closeCase(s, cs, { type: "done", detail: "audience sans avocat de la victime" });
        lancerChapitre2(api);
      },
      decider(api, { st }) {
        const { cs } = api;
        st.played.add("arg:provocation");
        const picks = (cs.vars.chiffrage && cs.vars.chiffrage.postes) || [];
        const autres = (cs.vars.chiffrage && cs.vars.chiffrage.autres) || [];
        const postes = POSTES_LUCAS.filter((p) => picks.includes(p.id));
        return PEN.juger(api, {
          st, juridiction: "tc", titre: "Jugement correctionnel", prevenuNom: "Thomas Moreau", pcNom: "Lucas Bernier",
          spec: { seuil: 0.55, pieces: {
            video: { label: "La vidéo du bar", sens: "charge", force: 0.45 },
            plainte: { label: "Les déclarations de M. Bernier", sens: "charge", force: 0.2 },
            temoin: { label: "Le témoignage du serveur", sens: "charge", force: 0.12 },
            aveu: { label: "M. Moreau reconnaît avoir porté le coup", sens: "charge", force: 0.15 },
            poussee: { label: "La poussée de M. Bernier, plaidée par la défense", sens: "decharge", force: 0.1, need: ["arg:provocation"] },
          } },
          qualif: (a, ctx) => qualifITT(a, ctx, "pc"),
          personnalite: 2,
          civil: { postes, art475: autres.includes("art475") ? 1500 : 0 },
        });
      },
      apresJugement(api, res) {
        const { s, cs } = api;
        const dec = res.decision || {};
        api.aj("pc", "Audience correctionnelle");
        CR.updatedClient(s, cs, 1);
        CR.closeCase(s, cs, PEN.issue(api, dec));
        lancerChapitre2(api);
      },
    },
    audiences: {
      jugement(api) {
        const { s, cs } = api;
        const T = THOMAS;
        return {
          title: "10e chambre correctionnelle", sub: "Tribunal judiciaire de Paris · Batignolles",
          decor: { scene: "salle", fin: "L'huissier appelle l'affaire suivante. Lucas vous serre la main dans la salle des pas perdus." },
          steps: [
            ...AUD.ouverture(api, { prevenu: Object.assign({ naissance: "le 2 juin 1995 à Saint-Denis", adresse: "rue Championnet, Paris 18e" }, T), prevention: `Vous êtes prévenu d'avoir, ${faitsTxt(cs)}, volontairement commis des violences sur la personne de M. Lucas Bernier, ayant entraîné une incapacité totale de travail supérieure à huit jours. Faits prévus et réprimés par l'article 222-11 du code pénal.`, victime: LUCAS, victimeAvocat: `Me ${s.player.nom}` }),
            { who: "president", t: "Pas d'exception de procédure ? Maître, pour la défense ?" },
            { who: "adverse", t: "Aucune, madame la présidente." },
            { who: "president", t: "Je résume. Le soir des faits, M. Moreau, cuisinier, fait sortir M. Bernier du bar. Sur le trottoir, une altercation, filmée par la caméra du bar." },
            { who: "president", t: "Le certificat des urgences de l'hôpital Bichat fixe l'incapacité totale de travail à six jours.", interject: { need: ["F1_umj10", "p_umj"], window: 6000, label: "Madame la présidente, pardonnez-moi : le dossier contient aussi le certificat de l'unité médico-judiciaire, établi sur réquisition, qui retient dix jours.", ok: { fx: { play: ["p_umj"], flags: { umjRappele: true } }, then: [{ who: "president", t: "Exact, maître, je le vois. Dix jours, à compter des faits. C'est d'ailleurs ce que vise la prévention." }] }, miss: { fx: { flags: { presidentSix: true } } } } },
            { who: "president", t: "Monsieur Moreau, que s'est-il passé ?" },
            { who: "prevenu", name: "Thomas Moreau", t: "Il parlait fort, il gênait les clients. Je lui ai demandé de sortir. Dehors, il m'a poussé. J'ai frappé. Je regrette, je ne voulais pas qu'il se casse le poignet." },
            { who: "president", t: "Monsieur Bernier, approchez. Vous maintenez votre plainte ?" },
            { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: "Oui. Je l'ai poussé, je n'aurais pas dû. Mais il m'a frappé alors que je reculais. Et j'ai le poignet cassé.", fx: { cred: 2 }, signal: "bon" }], else: [{ who: "client", t: "Oui ! Il m'a frappé comme ça, sans raison. Je n'ai rien fait.", fx: { cred: -3 } }, { who: "president", t: "Rien fait ? La vidéo vous montre en train de le pousser, monsieur.", signal: "mauvais" }, { who: "client", t: "…Bon. Je l'ai poussé." }] },
            { who: "president", t: "Vous travaillez ?" },
            { who: "client", t: "Livreur à vélo. Six semaines sans pouvoir travailler." },
            { if: () => !!cs.flags.demandePeine, then: [{ who: "president", t: "Maître, j'ai lu dans vos conclusions une demande de prison ferme. La partie civile demande réparation ; la peine, c'est le ministère public.", fx: { cred: -3 }, signal: "mauvais" }] },
            { constitution: true },
            { questions: { prompt: "Questions au prévenu (art. 442-1), par l'intermédiaire de la présidente", who: "prevenu", name: "Thomas Moreau", max: 2, options: [
              { id: "q_recul", t: "Monsieur Moreau, sur la vidéo, M. Bernier recule avant votre coup. Pourquoi avancer vers lui ?", need: "F1_v_recul", a: "Je… j'ai cru qu'il allait revenir. J'étais énervé.", fx: { play: ["F1_v_recul"] }, signal: "bon" },
              { id: "q_indem", t: "Avez-vous proposé d'indemniser M. Bernier ?", a: "Non. Je ne savais pas que je pouvais.", signal: "neutre" },
              { id: "q_bu", t: "Aviez-vous bu ce soir-là ?", a: "Non, je travaillais. C'est lui qui avait bu.", signal: "mauvais", fx: { cred: -1 } },
            ] } },
            { if: () => !!cs.proc.pcConstituee, then: [
              { who: "president", t: "La parole est à la partie civile." },
              { plaidoirie: { role: "pc", max: 4, args: [
                { id: "itt10", label: "L'ITT de dix jours fixée par le médecin légiste de l'UMJ", say: "L'incapacité est de dix jours : c'est le médecin légiste de l'unité médico-judiciaire, requis par l'enquêteur, qui la fixe. Le chiffre des urgences était une première estimation.", cards: ["F1_umj10", "p_umj"] },
                { id: "recul", label: "La vidéo : M. Bernier recule, puis le coup est porté", say: "Regardez la vidéo à 22 h 41 min 10 s : M. Bernier recule, les bras le long du corps. Le coup vient ensuite. Il n'y avait plus rien à repousser.", cards: ["F1_v_recul"] },
                { id: "prejudice", label: "Le préjudice, poste par poste", say: "Une fracture du poignet, six semaines sans pouvoir travailler pour un livreur à vélo : chaque poste est justifié par une pièce.", cards: ["F1_fracture", "F1_fracture_doc", "p_revenus", "F1_revenus"] },
                { id: "itt_arret", label: "Six semaines d'arrêt, donc une ITT de plus de huit jours", say: "M. Bernier a eu six semaines d'arrêt de travail : l'ITT dépasse évidemment huit jours.", cards: ["F1_arret"], pertinent: () => false },
                { id: "prison", label: "Demander une peine de prison ferme", say: "Je demande au tribunal une peine de prison ferme, exemplaire.", pertinent: () => false },
                { id: "art475", label: "Les frais d'avocat (art. 475-1)", say: "Je demande enfin une somme au titre de l'article 475-1 du code de procédure pénale.", cards: ["CPP_475-1"] },
              ] } },
              { card: { prompt: "La présidente : « Maître, la perte de revenus : vous avez un justificatif ? »", accept: ["p_revenus"], window: 12000, ok: { fx: { cred: 1 }, then: [{ who: "president", t: "Je le vois, merci." }] }, miss: { then: [{ who: "president", t: "Pas de pièce. Le tribunal appréciera." }] } } },
            ], else: [{ who: "president", t: "Maître, votre client ne s'est pas constitué partie civile : vous n'avez pas de demande à présenter.", signal: "mauvais" }] },
            AUD.requisitions({ sursis: 6, sursisType: "simple" }, { avant: ["Les faits sont établis par la vidéo et reconnus par le prévenu. La légitime défense ne tient pas : la poussée avait cessé quand le coup a été porté.", "Le casier est vierge ; M. Moreau a appelé les secours. Je ne demande pas d'emprisonnement ferme."] }),
            { who: "president", t: "La parole est à la défense." },
            { who: "adverse", t: "Madame la présidente, M. Moreau ne conteste pas avoir frappé. Il conteste la qualification : six jours aux urgences le soir même, dix jours à l'UMJ plus d'une semaine plus tard. Le doute doit profiter au prévenu : c'est une contravention." },
            { who: "adverse", t: "Et M. Bernier, alcoolisé, a poussé le premier. Mon client a été provoqué. Je vous demande la plus grande clémence." },
            { who: "president", t: "Monsieur Moreau, vous avez la parole en dernier." },
            { who: "prevenu", name: "Thomas Moreau", t: "Je regrette. Je voudrais m'excuser auprès de lui." },
            { delibere: { texte: "Le tribunal se retire pour délibérer. Une demi-heure plus tard, l'huissier : « Le tribunal ! »" } },
          ],
        };
      },
    },
    debrief(api, outcome) {
      const { s, cs } = api;
      const items = [];
      items.push({ kind: "rule", text: "Le seuil des huit jours d'ITT sépare le délit (art. 222-11 CP, trois ans d'emprisonnement) de la contravention de cinquième classe (art. R. 625-1 CP, 1 500 € d'amende)." });
      if (cs.vars.ittRetenue) items.push({ kind: "info", text: `Le tribunal a retenu ${cs.vars.ittRetenue} jours d'ITT.` });
      if (!cs.proc.pcConstituee) items.push({ kind: "bad", text: "Lucas ne s'est pas constitué partie civile avant les réquisitions : aucune réparation devant le juge pénal (art. 421)." });
      else items.push({ kind: "good", text: cs.vars.constitutionMode === "lettre" ? "Constitution de partie civile par lettre, arrivée avant l'audience (art. 420-1)." : "Constitution de partie civile à la barre, avant les réquisitions (art. 421)." });
      if (cs.flags.demandePeine || (cs.vars.decision && false)) items.push({ kind: "bad", text: "La partie civile a demandé une peine : ce n'est pas son rôle." });
      if (api.flag("umjRappele")) items.push({ kind: "good", text: "Vous avez rappelé à la présidente le certificat de l'UMJ au moment où elle n'en citait qu'un." });
      if (api.flag("presidentSix")) items.push({ kind: "surprise", text: "La présidente n'a cité que le certificat des urgences, et personne ne l'a corrigée sur le moment." });
      if (cs.advice.includes("a_reseaux")) items.push({ kind: "bad", text: "Conseiller de publier la vidéo : exposer l'auteur présumé sur les réseaux sociaux porte atteinte à sa présomption d'innocence et peut engager la responsabilité de votre client." });
      if (cs.advice.includes("a_garantie") || cs.flags.promesse) items.push({ kind: "bad", text: "Vous avez promis un résultat. Un avocat promet ses diligences, jamais une issue." });
      if (!cs.flags.prepClient) items.push({ kind: "bad", text: "Lucas n'était pas préparé : il a commencé par nier la poussée que la vidéo montre." });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      const c = api.cs.vars.civil;
      if (o.type === "indemnise") return `Le fonds de garantie a avancé une partie de l'indemnisation ; Thomas paie le reste par mensualités. Lucas a repris ses livraisons au bout de sept semaines${c && c.total > 4000 ? " et a racheté un vélo" : ""}.`;
      return "Lucas est reparti sans décision sur son préjudice. Il devra saisir le juge civil.";
    },
    fiche(api, o) {
      return {
        phrase: "Violences devant un bar, tribunal correctionnel, avocat de la victime, Lucas Bernier.",
        notions: [
          { titre: "Le seuil des huit jours d'ITT", regle: "Plus de huit jours : délit de violences (art. 222-11 CP) ; huit jours ou moins sans circonstance aggravante : contravention de cinquième classe (art. R. 625-1 CP).", art: "art. 222-11 et R. 625-1 CP", prog: "dps" },
          { titre: "La constitution de partie civile à l'audience", regle: "Par lettre recommandée parvenue vingt-quatre heures avant l'audience (art. 420-1) ou à la barre, avant les réquisitions du ministère public sur le fond (art. 421).", art: "art. 420-1 et 421 CPP", prog: "pp_action" },
          { titre: "L'ordre de parole", regle: "La partie civile plaide, le ministère public requiert, la défense plaide ; le prévenu a la parole en dernier.", art: "art. 460 CPP", prog: "pp_jugement" },
        ],
        piege: "L'ITT pénale n'est pas l'arrêt de travail ; et la partie civile demande réparation, jamais une peine.",
        devenir: api.def.epilogue(api, o),
        plusLoin: "Le fonds de garantie des victimes (CIVI) peut indemniser les victimes d'infractions quand l'auteur ne paie pas.",
      };
    },
    corrige(api) {
      return [
        { probleme: "Un coup de poing a causé une fracture : délit ou contravention ?", regle: "Les violences ayant entraîné une ITT de plus de huit jours sont un délit (art. 222-11 CP) ; de huit jours au plus, sans circonstance aggravante, une contravention de cinquième classe (art. R. 625-1 CP). Le tribunal correctionnel saisi d'un délit qui se révèle une contravention requalifie et statue (art. 466 CPP).", application: "Deux certificats : six jours aux urgences, dix jours à l'UMJ. La partie civile s'appuie sur le certificat médico-légal, établi sur réquisition, qui fonde la prévention." },
        { probleme: "Comment obtenir réparation devant le tribunal correctionnel ?", regle: "La victime se constitue partie civile par lettre parvenue vingt-quatre heures avant l'audience (art. 420-1) ou à la barre avant les réquisitions (art. 421). Elle chiffre chaque poste (nomenclature Dintilhac) et justifie ; les frais d'avocat relèvent de l'article 475-1.", application: "Déficit fonctionnel temporaire, souffrances endurées, perte de gains justifiée par l'attestation de la plateforme, frais divers sur factures." },
        { probleme: "La poussée de la victime fait-elle tomber la poursuite ?", regle: "La légitime défense suppose une riposte nécessaire, simultanée et proportionnée à une atteinte injustifiée (art. 122-5 CP).", application: "La vidéo montre Lucas reculer, les bras le long du corps, avant le coup : l'atteinte avait cessé. La poussée peut atténuer la peine, pas effacer l'infraction." },
      ];
    },
  });

  function lancerChapitre2(api) {
    const { s } = api;
    if (s.cases.tuto_thomas || s.flags.chap2) return;
    s.flags.chap2 = true;
    let d = CR.rollForward(s.day + 1);
    CR.schedule(s, { day: d, min: 9 * 60 + 40, type: "lead", key: "tuto_thomas" });
    CR.mail(s, { from: MENTOR(), subject: "Chapitre 2 : de l'autre côté de la barre", kind: "email", important: true, body: [["Mon cher confrère, rejouons la même soirée. Demain matin, Thomas Moreau va vous appeler : c'est lui que vous défendrez."], ["Dans la vraie vie, ce serait impossible : vous avez assisté la victime, vous ne pouvez pas défendre l'auteur dans la même affaire. C'est un conflit d'intérêts (art. 4.1 du règlement intérieur national), et il faudrait refuser. Ici, c'est un exercice : oubliez le jugement, nous rembobinons."], ["Vous verrez que les mêmes pièces se lisent autrement quand on change de banc."]] });
  }

  // =================================================================== CHAPITRE 2 — THOMAS, DÉFENSE
  const F2 = { fracture: "F2_fracture_doc", itt: "F2_urg6" };
  const pvAuditionThomas = (x) => {
    const cs = x.cs;
    const c = cs.vars.conseilGav || "expliquer";
    const rect = cs.flags.pvRectifie;
    const decl = {
      silence: [["Je ne souhaite pas répondre aux questions."], ["Sur mes antécédents : je n'ai jamais été condamné."]],
      partiel: [[{ t: "Je reconnais avoir donné un coup de poing à ce client. Je ne répondrai pas sur le reste.", f: "F2_pv_aveu" }], ["Je n'ai jamais été condamné."]],
      expliquer: [["Un client gênait, je l'ai fait sortir. Dehors, il m'a poussé des deux mains."], [{ t: rect ? "J'ai voulu qu'il arrête." : "J'ai voulu le frapper.", f: rect ? "F2_pv_arret" : "F2_pv_frapper" }], [{ t: "Je lui ai donné un coup de poing. Il est tombé.", f: "F2_pv_aveu" }], ["Je regrette. J'ai appelé les pompiers."]],
    }[c];
    return {
      title: "Procès-verbal d'audition libre", kind: "pv",
      entete: ["Commissariat central du 18e arrondissement", "Audition libre de M. Thomas Moreau — cote D11"],
      paras: [
        [`Le ${CR.fmtDate(cs.vars.auditionDay, "long")}, à 10 h 20, nous, lieutenant Damien Rocher, officier de police judiciaire, entendons M. Thomas Moreau, né le 2 juin 1995 à Saint-Denis, cuisinier.`],
        [{ t: `Avons notifié à la personne entendue, avant son audition, qu'elle est soupçonnée de violences volontaires commises le ${CR.fmtDate(cs.proc.faitsDay, "long")}, ainsi que son droit de se taire, son droit à un interprète et son droit à l'assistance d'un avocat, qu'elle exerce : Me ${x.s.player.nom} est présent.`, flag: "al_quitter" }],
        ["La personne déclare :"],
      ].concat(decl).concat([["Lecture faite, persiste et signe."]]),
      signed: "Lt D. Rocher, OPJ",
    };
  };

  CR.defineCase({
    id: "tuto_thomas", mode: "tutoriel", camp: "defense", domaine: "tc", domaineLib: "pp_jugement",
    title: "Moreau — violences devant un bar (chapitre 2)",
    client: THOMAS, caller: "Thomas Moreau", leadPatience: 3, urgence: true,
    voicemail: "Bonjour, Thomas Moreau. J'ai reçu une convocation de la police pour une audition, pour une bagarre devant le bar où je travaille. J'aimerais être accompagné. Rappelez-moi vite, c'est dans trois jours.",
    profile: { wealth: 2, sens: 0.5, urgency: 0.8, temper: "mefiant" },
    honoraires: { forfait: 1500, heures: 10, types: ["forfait", "temps"], resultat: "relaxe ou requalification", intro: "Il a apporté sa convocation, pliée en quatre." },
    mission: "Assistance de M. Moreau lors de son audition libre, puis défense devant le tribunal correctionnel jusqu'à la décision de première instance. Les voies de recours feront l'objet d'une convention distincte.",
    actors: { parquet: "pq_delahaye", adverse: "av_tessier", opj: "opj_rocher" },
    proc: { stade: "enquete", nature: "delit", faits: -6, infractions: ["CP_222-11"], pcConstituee: true },
    dates: { faits: -6 },
    init(api, cs) {
      // la soirée rejouée : un vendredi, une semaine environ avant l'appel de Thomas
      let f = cs.vars.base - 6;
      while (CR.dow(f) !== 5) f--;
      cs.proc.faitsDay = f; cs.proc.prescStart = f;
      cs.vars.umjDay = CR.rollForward(f + 10);
      cs.vars.auditionDay = Math.max(CR.rollForward(cs.vars.base + 3), CR.nextBusinessDay(cs.vars.umjDay));
      api.at(cs.vars.auditionDay, "_auditionCheck", {}, 12 * 60);
    },
    vars: (s, cs) => ({ auditionDow: cs.vars.auditionDay != null ? CR.fmtDate(cs.vars.auditionDay, "dowshort") : "…", umjDate: cs.vars.umjDay != null ? CR.fmtDate(cs.vars.umjDay, "long") : "…", ilya: cs.proc && cs.proc.faitsDay != null ? `il y a ${s.day - cs.proc.faitsDay} jours` : "", umjEcart: cs.vars.umjDay != null && cs.proc ? `${cs.vars.umjDay - cs.proc.faitsDay} jours` : "" }),
    facts: {
      F2_convoc: { label: "La date de l'audition libre", key: true, why: "Sans elle, vous n'êtes pas à côté de lui quand il parle aux enquêteurs." },
      F2_victime: { label: "Le nom du plaignant", cat: "party", party: "Lucas Bernier" },
      F2_pousse: { label: "Bernier l'a poussé des deux mains", key: true },
      F2_secours: { label: "Il a appelé les secours", key: true, why: "Un élément de personnalité que la vidéo confirme." },
      F2_cdi: { label: "Cuisinier en CDI depuis quatre ans", key: true },
      F2_casier: { label: "Aucun antécédent" },
      F2_umj_date: { label: "L'UMJ a examiné Bernier plus d'une semaine après les faits", key: true, why: "C'est l'argument qui fragilise les dix jours." },
      F2_urg6: { label: "Six jours d'ITT aux urgences", key: true },
      F2_v_recul: { label: "Sur la vidéo, Bernier recule avant le coup", why: "Le point faible de la légitime défense : mieux vaut le savoir avant de la plaider." },
    },
    cards: {
      p2_urgences: { label: "Certificat des urgences de Bichat (ITT 6 jours)" },
      p2_umj: { label: "Certificat de l'UMJ (examen à J+9, ITT 10 jours)" },
      p2_video: { label: "PV d'exploitation de la vidéo (cote D9)" },
    },
    calls: {
      intake: {
        opening: ["Bonjour maître. Thomas Moreau. J'ai reçu une convocation de la police pour être entendu, en audition libre. Pour une bagarre devant le bar où je travaille."],
        topics: [
          { id: "t2_quand", q: "Quand êtes-vous convoqué, et où ?", a: [{ t: "{auditionDow}, à 10 heures, au commissariat central du 18e.", f: "F2_convoc" }, { t: "C'est pour la plainte d'un certain Lucas Bernier, c'est écrit dessus.", f: "F2_victime" }], cost: 2, tag: "good" },
          { id: "t2_quoi", q: "Racontez-moi ce qui s'est passé.", a: [{ t: "Vendredi soir, {ilya}. Un client parlait fort, il gênait tout le monde. Je lui ai demandé de sortir.", f: "F2_sortir" }, { t: "Dehors, il m'a poussé, fort, des deux mains.", f: "F2_pousse" }, { t: "Je lui ai mis un coup de poing. Il est tombé en arrière, sur la main.", f: "F2_coup" }], cost: 5, tag: "good", unlock: ["t2_apres", "t2_peur", "t2_camera", "t2_bu"] },
          { id: "t2_apres", q: "Et après le coup ?", a: [{ t: "J'ai appelé les pompiers tout de suite. Je suis resté avec lui.", f: "F2_secours" }, "Le patron m'a dit qu'il s'était cassé le poignet."], cost: 2, tag: "good" },
          { id: "t2_peur", q: "Au moment exact du coup, il continuait à vous pousser ?", a: ["Euh… Il avait reculé, je crois. Mais j'avais peur qu'il revienne.", { t: "Honnêtement, je ne sais plus s'il revenait vers moi.", f: "F2_recul_doute" }], cost: 3, tag: "good" },
          { id: "t2_camera", q: "Y a-t-il une caméra ?", a: [{ t: "Oui, au-dessus de la porte. Le patron a donné l'enregistrement à la police.", f: "F2_camera" }], cost: 2, tag: "good" },
          { id: "t2_bu", q: "Il avait bu ?", a: [{ t: "Il était éméché, oui. Ça se voyait.", f: "F2_alcool" }], cost: 2, tag: "neutral" },
          { id: "t2_vie", q: "Parlez-moi de vous : travail, famille, antécédents.", a: [{ t: "Cuisinier au Damrémont depuis quatre ans, en CDI.", f: "F2_cdi" }, { t: "Jamais eu affaire à la justice.", f: "F2_casier" }, "J'ai une fille de trois ans. Je vis avec sa mère."], cost: 3, tag: "good", unlock: ["t2_peur_job"] },
          { id: "t2_peur_job", q: "Qu'est-ce qui vous inquiète le plus ?", a: ["Mon travail. Avec un casier, je ne sais pas si le patron me garde."], cost: 2, tag: "good" },
          { id: "t2_bad", q: "Avec une caméra, c'est de la légitime défense. C'est gagné d'avance.", a: ["Vraiment ? Ah, ça me soulage."], cost: 1, tag: "bad", fx: { flags: { promesse: true } } },
        ],
        start: ["t2_quand", "t2_quoi", "t2_vie", "t2_bad"],
        patience: 95,
        close: "D'accord. Vous serez là, à l'audition ?",
      },
    },
    advice: [
      { id: "a2_present", t: "Je serai à vos côtés à l'audition. Nous déciderons ensemble, avant, s'il faut parler ou se taire." },
      { id: "a2_contact", t: "Ne contactez pas M. Bernier, ni directement ni par le patron." },
      { id: "a2_pieces", t: "Rassemblez votre contrat de travail, vos fiches de paie, une attestation de votre employeur." },
      { id: "a2_temoin", t: "Demandez au serveur de dire à la police que Bernier vous a frappé le premier." },
      { id: "a2_garantie", t: "Je vous garantis que vous n'aurez pas de casier." },
    ],
    docs: {
      cert_urgences: certUrgences(F2),
      cert_umj: certUMJ({ date: "F2_umj_date", itt: "F2_umj10" }),
      pv_video: pvVideo({ pousse: "F2_v_pousse", recul: "F2_v_recul", coup: "F2_v_coup", chute: "F2_v_chute", secours: "F2_v_secours" }),
      pv_temoin: pvTemoin({ alcool: "F2_t_alcool" }),
      pv_plainte: () => ({
        title: "Procès-verbal de plainte", kind: "pv",
        entete: ["Commissariat central du 18e arrondissement", "Plainte de M. Lucas Bernier — cote D2"],
        paras: [
          ["Je dépose plainte contre Thomas Moreau, cuisinier du bar Le Damrémont."],
          [{ t: "Il m'a frappé comme ça, sans raison, alors que je n'avais rien fait.", f: "F2_lucas_nie" }],
          ["Je suis tombé et je me suis cassé le poignet. Je suis livreur et je ne peux plus travailler."],
        ],
        signed: "Lu, persiste et signe.",
      }),
      pv_audition: pvAuditionThomas,
      casier: () => ({ title: "Bulletin n° 1 du casier judiciaire", kind: "greffe", entete: ["Casier judiciaire national · Nantes"], paras: [["Thomas Moreau, né le 2 juin 1995 à Saint-Denis (93)."], [{ t: "Néant.", f: "F2_casier_b1" }]] }),
      copj: (x) => {
        const a = x.cs.proc.audience;
        return {
          title: "Convocation par officier de police judiciaire", kind: "pv",
          entete: ["Préfecture de police · Commissariat central du 18e", "Article 390-1 du code de procédure pénale"],
          paras: [
            ["Sur instruction du procureur de la République, M. Thomas Moreau est invité à comparaître devant le tribunal correctionnel de Paris :"],
            [{ t: `le ${CR.fmtDate(a.day, "dow")} à 13 h 30, 10e chambre, tribunal judiciaire de Paris, parvis du Tribunal de Paris (17e).`, f: "F2_audience" }],
            [`Pour avoir, à Paris 18e, le ${CR.fmtDate(x.cs.proc.faitsDay, "long")}, volontairement commis des violences sur M. Lucas Bernier, ayant entraîné une incapacité totale de travail supérieure à huit jours (art. 222-11 du code pénal).`],
            ["Le prévenu peut se faire assister d'un avocat. Le dossier peut être consulté et sa copie demandée au greffe."],
          ],
          signed: "Remise en main propre. Lt D. Rocher, OPJ",
        };
      },
    },
    docTitles: { cert_urgences: "Certificat des urgences", cert_umj: "Certificat de l'UMJ", pv_video: "PV d'exploitation de la vidéo", pv_temoin: "Audition du serveur", pv_plainte: "Plainte de Lucas Bernier", pv_audition: "Audition libre de Thomas Moreau", casier: "Casier judiciaire", copj: "Convocation par OPJ" },
    anomalies: { al_quitter: { irreg: "al_droit_quitter", piece: "pv_audition", annule: ["pv_audition"] } },
    penal: { no: ["actes", "copie"] },
    gav: (api) => ({
      mode: "audition", attente: 20,
      arrivee: ["Commissariat central du 18e, 10 heures. Thomas vous attend dans le hall, livide. Le lieutenant Rocher vient vous chercher : « Maître, on y va ? »"],
      droits: [
        { t: `Monsieur Moreau, vous êtes entendu librement. Vous êtes soupçonné de violences volontaires commises ${faitsTxt(api.cs)}.`, f: "F2_al_infraction", flag: "al_quitter" },
        { t: "Vous avez le droit de faire des déclarations, de répondre aux questions qui vous sont posées ou de vous taire.", flag: "al_quitter" },
        "Vous avez le droit d'être assisté par un avocat : votre avocat est présent.",
        "Si vous ne comprenez pas le français, vous avez droit à un interprète.",
        "Bien. On commence ?",
      ],
      conseils: [
        { id: "silence", t: "Garder le silence", sub: "Il décline son identité, puis se tait. La vidéo parlera seule, mais il ne pourra pas dire qu'il a été poussé." },
        { id: "expliquer", t: "S'expliquer complètement", sub: "Il reconnaît le coup et raconte la poussée. Sincère, mais tout ce qu'il dit sera au procès-verbal." },
        { id: "partiel", t: "Reconnaître le coup, se taire sur le reste", sub: "Un aveu sobre, sans détail sur ce qu'il pensait ni sur le moment exact." },
      ],
      audition: () => [
        { q: `Que s'est-il passé le ${CR.fmtDate(api.cs.proc.faitsDay, "long")} au soir ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: "Un client gênait, je l'ai fait sortir. Dehors, il m'a poussé. Je lui ai donné un coup de poing.", partiel: "Je reconnais lui avoir donné un coup de poing. Je ne dirai rien d'autre." } },
        { q: "Sur la vidéo, à 22 h 41 min 10 s, M. Bernier recule, les bras le long du corps. Vous avancez vers lui. Pourquoi ?", fq: "F2_q_video", a: { silence: "Je ne souhaite pas répondre.", expliquer: "J'avais peur qu'il revienne. J'ai voulu qu'il arrête.", partiel: "Je n'ai rien à ajouter." } },
        { q: "Les urgences ont retenu six jours d'incapacité ; l'unité médico-judiciaire, dix. Vous le saviez ?", fq: "F2_q_itt", a: { silence: "…", expliquer: "Non. Je savais juste qu'il avait le poignet cassé.", partiel: "Non." } },
        { q: "Avez-vous déjà été condamné ?", a: { silence: "Non.", expliquer: "Jamais.", partiel: "Non." } },
      ],
      questions: [
        { id: "q_secours", q: "Monsieur Moreau, qu'avez-vous fait juste après le coup ?", a: "J'ai appelé les pompiers et je suis resté avec lui jusqu'à leur arrivée.", f: "F2_secours", anodine: true },
        { id: "q_pousse", q: "M. Bernier vous a-t-il poussé avant le coup ?", a: "Oui, des deux mains, fort. J'ai failli tomber.", f: "F2_pousse" },
        { id: "q_umj", q: "Lieutenant, quand M. Bernier a-t-il été examiné par l'unité médico-judiciaire ?", a: `(L'officier) : Le ${CR.fmtDate(api.cs.vars.umjDay, "dowshort")}, ${api.cs.vars.umjDay - api.cs.proc.faitsDay} jours après les faits.`, f: "F2_umj_date", sensible: true },
      ],
      observations: [
        { id: "obs_quitter", t: "Mon client n'a pas été informé de son droit de quitter à tout moment les locaux où il est entendu (art. 61-1, 2°).", flag: "al_quitter" },
        { id: "obs_pousse", t: "Mon client indique avoir été poussé par le plaignant immédiatement avant les faits." },
      ],
      get relecture() {
        const c = api.cs.vars.conseilGav;
        if (c === "silence") return { segs: [{ t: "La personne déclare : Je ne souhaite pas répondre aux questions." }, { t: "Je n'ai jamais été condamné." }] };
        if (c === "partiel") return { segs: [{ t: "La personne déclare : Je reconnais avoir donné un coup de poing à ce client." }, { t: "Je ne répondrai pas sur le reste." }] };
        return { segs: [{ t: "La personne déclare :" }, { t: "Un client gênait, je l'ai fait sortir." }, { t: "Dehors, il m'a poussé des deux mains." }, { t: "J'ai voulu le frapper.", erreur: true, correct: "J'ai voulu qu'il arrête." }, { t: "Je lui ai donné un coup de poing." }, { t: "Je regrette." }] };
      },
      issue: (a, ctx) => {
        const { s, cs } = a;
        cs.flags.auditionFaite = s.day;
        copj(a);
        return { texte: [
          "Le lieutenant Rocher passe un appel au parquet, puis revient avec un formulaire.",
          `« Monsieur Moreau, sur instruction du procureur, je vous remets une convocation devant le tribunal correctionnel, le ${CR.fmtDate(cs.proc.audience.day, "dow")} à 13 h 30. »`,
          "Thomas signe. Dans la rue, il vous demande : « Et maintenant, on fait quoi ? »",
        ] };
      },
    }),
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      const jour = cs.vars.auditionDay;
      if (!cs.flags.auditionFaite && s.day <= jour) {
        const tard = s.day === jour && s.min > 11 * 60;
        T({ id: "audition", label: "Assister Thomas à son audition libre", sub: s.day < jour ? `${CR.cap(CR.fmtDate(jour, "dowshort"))} à 10 heures, commissariat du 18e.` : tard ? "Trop tard : l'audition a commencé sans vous." : "Aujourd'hui à 10 heures.", kind: "meet", time: 0, where: "commissariat", urgent: s.day === jour, enabled: s.day === jour && !tard, why: s.day < jour ? `Elle a lieu ${CR.fmtDate(jour, "dowshort")}.` : "", run: () => { if (s.min < 10 * 60) CR.spend(s, 10 * 60 - s.min, "idle", { fixed: true, busy: true }); return { scene: "gav" }; } });
      }
      if (cs.proc.audience && !cs.vars.copieDemandee) T({ id: "copie", label: "Demander la copie de la procédure", sub: "Au greffe correctionnel : certificats, vidéo, auditions. Personne ne vous l'enverra sans demande.", kind: "admin", time: 15, where: "palais", run: () => { cs.vars.copieDemandee = s.day; CR.spend(s, 15, "admin"); api.schedule(R.int(s, 3, 5), "_copie"); api.tl("Copie de la procédure demandée."); CR.toast(s, "Copie demandée au greffe.", "info"); return null; } });
      if (cs.proc.audience) PEN.persoTasks(api, T, [
        { id: "cdi", label: "Obtenir le contrat de travail et les fiches de paie", sub: "Des pièces, pas des affirmations.", fact: "F2_cdi_piece", text: "Contrat à durée indéterminée de cuisinier au Damrémont depuis mars 2022 ; trois dernières fiches de paie.", time: 20 },
        { id: "attest", label: "Demander une attestation au gérant du bar", sub: "Une attestation manuscrite, avec la copie de sa pièce d'identité.", fact: "F2_attestation", text: "Attestation de M. Ferrand, gérant : « Thomas est sérieux, ponctuel, calme ; je le garde quoi qu'il arrive. »", time: 25 },
        { id: "excuses", label: "Proposer à Thomas d'écrire une lettre d'excuses", sub: "Elle sera remise à l'avocate de M. Bernier, pas à lui directement.", fact: "F2_excuses", text: "Lettre d'excuses de Thomas à M. Bernier, transmise à son avocate.", time: 30, kind: "meet" },
      ]);
    },
    on: {
      engaged(api) {
        const { cs } = api;
        mentor(api, "Avant l'audition libre", ["Une audition libre n'est pas une conversation : tout ce que dira votre client sera écrit, relu et signé.", "Écoutez l'officier lire les droits. Comparez avec l'article 61-1 : il y en a une liste, et elle est complète ou elle ne l'est pas.", "Et lisez les questions des enquêteurs comme un dossier : elles disent ce qu'ils ont."]);
        if (cs.advice.includes("a2_temoin")) api.schedule(2, "_temoin");
      },
      _temoin(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "subornation", texte: "Vous avez conseillé à votre client de demander au serveur de mentir à la police.", sanction: "C'est une subornation de témoin (art. 434-15 CP), et pour vous une faute disciplinaire grave.", regul: "Aucune." });
        api.mail({ from: "Thomas Moreau", subject: "Romain", kind: "sms", body: [["Maître, Romain n'a pas voulu. Il a dit qu'il dirait la vérité à la police, et que je lui avais demandé de mentir."]] });
        api.disc("subornation", 6, "Un témoin rapporte qu'un avocat a conseillé à son client de lui demander de faire une fausse déclaration aux enquêteurs.");
        api.trust(-10);
      },
      _auditionCheck(api) {
        const { s, cs } = api;
        if (cs.flags.auditionFaite || cs.flags.gavStarted === s.day) return;
        if (cs.status !== "active") {
          if (cs.status === "prospect" || cs.status === "lead") { cs.vars.conseilGav = "expliquer"; cs.flags.auditionFaite = s.day; copj(api); }
          return;
        }
        cs.flags.auditionFaite = s.day;
        cs.vars.conseilGav = "expliquer";
        CR.erreur(s, cs, { id: "audition_seul", texte: "Thomas a été entendu sans vous : il a tout expliqué, et le procès-verbal lui fait dire « J'ai voulu le frapper ».", sanction: "Ses déclarations sont au dossier, telles qu'elles ont été écrites.", regul: "Aucune, sinon en contester la retranscription à l'audience." });
        api.trust(-20);
        copj(api);
        api.mail({ from: "Thomas Moreau", subject: "Vous n'étiez pas là", kind: "sms", body: [["Maître, je vous ai attendu une demi-heure. Ils ont commencé sans vous. J'ai tout raconté. Ils m'ont donné une convocation au tribunal."]] });
      },
      _copie(api) {
        const { cs } = api;
        for (const k of ["pv_plainte", "cert_urgences", "cert_umj", "pv_video", "pv_temoin", "pv_audition", "casier"]) if (!CR.hasDoc(cs, k)) api.doc(k, api.def.docTitles[k]);
        api.card("p2_urgences"); api.card("p2_umj"); api.card("p2_video");
        api.mail({ from: "Greffe correctionnel", subject: "Copie de la procédure — affaire Moreau", kind: "greffe", pages: 10, body: [["La copie de la procédure est versée à votre dossier (sept pièces)."], ["Elle est réservée à l'usage de la défense."]] });
        mentor(api, "La procédure est arrivée", ["Lisez chaque pièce deux fois : une fois pour ce qu'elle dit, une fois pour ce qu'elle ne dit pas.", "Si vous trouvez une irrégularité, souvenez-vous que devant le tribunal correctionnel, depuis le 23 octobre 2026, les conclusions de nullité se déposent au greffe trois jours au moins avant l'audience. Comptez, et notez-le dans votre agenda."]);
      },
      decider(api, { st }) {
        const { cs } = api;
        const c = cs.vars.conseilGav || "expliquer";
        const forceAveu = c === "silence" ? 0.03 : c === "partiel" ? 0.1 : cs.flags.pvRectifie ? 0.13 : 0.2;
        const perso = PEN.persoCount(api, ["F2_cdi_piece", "F2_attestation", "F2_excuses"]) + (st.dernierMot === "regrets" ? 1 : 0) + (cs.flags.prepClient ? 0.5 : 0) + (st.played.has("arg:personnalite") ? 0.5 : 0) - (st.dernierMot === "explique" ? 1 : 0);
        return PEN.juger(api, {
          st, juridiction: "tc", titre: "Jugement correctionnel", prevenuNom: "Thomas Moreau", pcNom: "Lucas Bernier",
          spec: { seuil: 0.55, pieces: {
            video: { label: "La vidéo du bar", sens: "charge", force: 0.45 },
            plainte: { label: "Les déclarations de M. Bernier", sens: "charge", force: api.flag("mensongeRelevé") ? 0.1 : 0.2 },
            temoin: { label: "Le témoignage du serveur", sens: "charge", force: 0.12 },
            pv_audition: { label: "Les déclarations de Thomas en audition libre", sens: "charge", force: forceAveu },
            poussee: { label: "La poussée de M. Bernier", sens: "decharge", force: 0.1, need: ["arg:provocation", "F2_pousse", "F2_v_pousse"] },
          }, arguments: {
            legitime: { label: "Légitime défense", cards: ["arg:legitime"], poids: 0.04, pertinent: () => false },
          } },
          qualif: (a, ctx) => qualifITT(a, ctx, "defense"),
          personnalite: Math.max(0, perso),
          civil: { postes: [
            { label: "Déficit fonctionnel temporaire", demande: 900, base: 750 },
            { label: "Souffrances endurées", demande: 3000, base: 2200 },
            { label: "Perte de gains professionnels", demande: 2400, base: 2400 },
            { label: "Frais divers", demande: 182, base: 182 },
          ], art475: 1500 },
        });
      },
      apresJugement(api, res) {
        const { s, cs } = api;
        const dec = res.decision || {};
        CR.updatedClient(s, cs, 1);
        CR.closeCase(s, cs, PEN.issue(api, dec));
        s.flags.tutoFini = true;
        CR.mail(s, { from: MENTOR(), subject: "Le tutoriel est terminé", kind: "email", body: [["Vous avez plaidé la même soirée deux fois, et vous avez vu les mêmes pièces changer de sens selon le banc."], ["Vos deux fiches de révision sont dans le classeur. La suite, c'est votre cabinet."]] });
      },
      _absent(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "absent_def", texte: "Vous n'étiez pas à l'audience.", sanction: "Thomas a été jugé seul ; vos conclusions de nullité n'ont pas été soutenues.", regul: "Faire appel dans les dix jours." });
        cs.proc.moyens.forEach((m) => { if (!m.decision) { m.decision = "rejete"; m.motifDecision = "Non soutenue à l'audience."; } });
        CR.closeCase(s, cs, { type: "condamnation", detail: "jugé sans avocat" });
        s.flags.tutoFini = true;
      },
    },
    audiences: {
      jugement(api) {
        const { s, cs } = api;
        return {
          title: "10e chambre correctionnelle", sub: "Tribunal judiciaire de Paris · Batignolles",
          decor: { scene: "salle", fin: "Dans la salle des pas perdus, Thomas vous demande s'il gardera son travail." },
          steps: [
            { who: "huissier", t: "Le tribunal !" },
            { who: "sys", t: "(Tout le monde se lève.)" },
            { who: "president", t: "Affaire Moreau. Monsieur Thomas Moreau, avancez à la barre." },
            { who: "president", t: "Vous êtes né le 2 juin 1995 à Saint-Denis, vous êtes cuisinier, vous demeurez rue Championnet ?" },
            { who: "client", t: "Oui, madame la présidente." },
            { who: "president", t: `Vous êtes prévenu d'avoir, ${faitsTxt(cs)}, volontairement commis des violences sur M. Lucas Bernier, ayant entraîné une incapacité totale de travail supérieure à huit jours (art. 222-11 du code pénal). Vous avez le droit de faire des déclarations, de répondre aux questions ou de vous taire.` },
            { who: "president", t: "La victime est présente, assistée de Me Tessier. Avant d'aborder le fond : des exceptions ?" },
            { limine: { joindre: true } },
            { who: "president", t: "Je résume le dossier. L'unité médico-judiciaire fixe l'incapacité totale de travail à dix jours. La vidéo montre l'altercation." },
            { who: "president", t: "Monsieur Bernier, approchez. Que s'est-il passé ?" },
            { who: "victime", name: "Lucas Bernier", t: "Il m'a frappé alors que j'étais par terre. Je n'avais rien fait.", interject: { need: ["F2_v_coup", "F2_v_chute", "F2_v_pousse", "p2_video"], window: 6000, label: "Madame la présidente, la vidéo, cote D9, montre un seul coup, porté debout, après que M. Bernier a poussé mon client.", ok: { fx: { play: ["F2_v_coup", "F2_v_pousse"], flags: { mensongeRelevé: true } }, then: [{ who: "president", t: "C'est exact. Monsieur Bernier ?" }, { who: "victime", name: "Lucas Bernier", t: "…Je l'ai poussé. Je ne m'en souvenais plus bien. J'avais mal." }] } } },
            { who: "president", t: "Monsieur Moreau, pourquoi avoir frappé ?" },
            { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: "Il m'a poussé, j'ai paniqué. Sur la vidéo, je vois qu'il avait reculé. Je n'aurais jamais dû. J'ai appelé les pompiers tout de suite.", signal: "bon" }], else: [{ who: "client", t: "Il m'a cherché toute la soirée. Il a eu ce qu'il méritait… enfin, je veux dire…", fx: { cred: -4 }, signal: "mauvais" }] },
            { card: { prompt: "La présidente : « Maître, vous plaiderez la personnalité ? Avez-vous des pièces ? »", accept: ["F2_cdi_piece", "F2_attestation", "F2_excuses", "F2_casier_b1"], window: 12000, ok: { fx: { flags: { piecesPerso: true } }, then: [{ who: "president", t: "Je les verse au dossier." }] }, miss: { then: [{ who: "president", t: "Rien. Bien." }] } } },
            { questions: { prompt: "Questions à la victime (art. 442-1), par l'intermédiaire de la présidente", who: "victime", name: "Lucas Bernier", max: 2, options: [
              { id: "q_pousse", t: "Monsieur Bernier, reconnaissez-vous avoir poussé M. Moreau le premier ?", a: "…Oui. Je l'ai poussé.", fx: { play: ["F2_pousse"] }, signal: "bon" },
              { id: "q_umj", t: "Quand avez-vous été examiné par le médecin de l'UMJ ?", need: "F2_umj_date", a: "Plus d'une semaine après. Le plâtre était déjà posé.", fx: { play: ["F2_umj_date"] }, signal: "bon" },
              { id: "q_bu", t: "Combien de verres aviez-vous bus ?", a: "Trois bières. Peut-être quatre.", f: "F2_bu4", signal: "neutre" },
              { id: "q_habitue", t: "N'êtes-vous pas coutumier des bagarres ?", a: "Pardon ? Non !", fx: { cred: -3 }, signal: "mauvais" },
            ] } },
            { who: "president", t: "La parole est à la partie civile." },
            { who: "adverse", t: "Dix jours d'incapacité, fixés par un médecin légiste. Une fracture. Six semaines sans travailler. Je demande, poste par poste, 6 482 euros, et 1 500 euros au titre de l'article 475-1." },
            AUD.requisitions({ sursis: 6, sursisType: "simple" }, { avant: ["Les faits sont établis par la vidéo. La légitime défense ne tient pas : M. Bernier reculait.", "M. Moreau n'a pas d'antécédent et a appelé les secours."] }),
            { who: "president", t: "La parole est à la défense." },
            { plaidoirie: { role: "defense", max: 4,
              angles: [
                { id: "requalif", t: "Requalification", sub: "L'ITT ne dépasse pas huit jours : contravention de cinquième classe." },
                { id: "relaxe", t: "Relaxe", sub: "Légitime défense : il a été agressé." },
                { id: "peine", t: "La peine", sub: "Ne pas contester la qualification, plaider la personnalité." },
              ],
              mixte: (angle, picked) => angle === "relaxe" && picked.includes("personnalite"),
              args: [
                { id: "itt6", label: "Six jours d'ITT : le seul médecin qui l'a vu le soir même", say: "Le seul médecin qui a examiné M. Bernier le soir des faits, aux urgences de Bichat, retient six jours d'incapacité.", cards: ["F2_urg6", "p2_urgences"], pertinent: (a, st, angle) => angle !== "relaxe" },
                { id: "umj_tardif", label: "L'UMJ l'a examiné bien plus tard, plâtré", say: `Le médecin légiste l'a examiné ${cs.vars.umjDay - cs.proc.faitsDay} jours après, plâtre posé, et fixe dix jours « à compter des faits » sans l'avoir vu ce soir-là. Le doute profite au prévenu.`, cards: ["F2_umj_date", "p2_umj"] },
                { id: "seuil", label: "Le seuil de l'article R. 625-1 et la requalification (art. 466)", say: "À huit jours ou moins, c'est une contravention de cinquième classe ; le tribunal peut requalifier et statuer (art. 466).", cards: ["CP_R625-1", "CPP_466", "CP_222-11"] },
                { id: "legitime", label: "La légitime défense (art. 122-5)", say: "Mon client a été agressé. Il s'est défendu : c'est la légitime défense.", cards: ["CP_122-5", "F2_pousse"], pertinent: () => false },
                { id: "provocation", label: "La provocation : il a été poussé le premier", say: "M. Bernier, alcoolisé, a poussé mon client le premier. Ce n'excuse pas le coup, mais l'explique.", cards: ["F2_pousse", "F2_v_pousse", "F2_alcool", "F2_t_alcool"] },
                { id: "personnalite", label: "Cuisinier en CDI, casier vierge, il a appelé les secours", say: "Un cuisinier en CDI depuis quatre ans, sans antécédent, qui appelle les secours et reste auprès de la victime.", cards: ["F2_cdi", "F2_cdi_piece", "F2_secours", "F2_v_secours", "F2_casier", "F2_casier_b1"] },
                { id: "ivrogne", label: "M. Bernier, un fêtard qui cherchait la bagarre", say: "M. Bernier est un fêtard qui cherchait la bagarre.", cards: ["F2_alcool"], pertinent: () => false },
              ] } },
            { dernierMot: {
              prepare: [
                { id: "regrets", label: "Des regrets, sobres, tournés vers la victime", t: "Je regrette. Je pense à son poignet tous les jours. Je voudrais lui dire pardon.", signal: "bon" },
                { id: "explique", label: "Réexpliquer qu'il a été poussé", t: "Il m'a poussé. Je me suis défendu, c'est tout.", fx: { cred: -2 }, signal: "mauvais" },
                { id: "rien", label: "Rien de plus", t: "Je n'ai rien à ajouter." },
              ],
              spontane: { id: "spontane", t: "Je… il m'a poussé, quand même. Mais je regrette, hein." },
            } },
            { delibere: { texte: "Le tribunal se retire pour délibérer. Quarante minutes plus tard, l'huissier : « Le tribunal ! »" } },
          ],
        };
      },
    },
    debrief(api, outcome) {
      const { s, cs } = api;
      const lucas = s.cases.tuto_lucas;
      const items = [];
      items.push({ kind: "rule", text: "Une exception de nullité se soulève avant toute défense au fond ; devant le tribunal correctionnel, hors comparution immédiate, par conclusions déposées au greffe trois jours au moins avant l'audience (art. 385, depuis le 23 octobre 2026)." });
      const nul = cs.proc.moyens.find((m) => m.flag === "al_quitter");
      if (!nul) items.push({ kind: "surprise", text: "Le procès-verbal d'audition libre ne mentionne pas la notification du droit de quitter les locaux (art. 61-1, 2°). Personne ne l'a soulevé." });
      else if (nul.decision === "annule") items.push({ kind: "good", text: "Le procès-verbal d'audition libre a été annulé : les déclarations de Thomas sont sorties du débat. La vidéo et le témoin restent." });
      else if (!nul.recevable) items.push({ kind: "bad", text: `Nullité irrecevable : ${nul.motif}. Aucune régularisation possible.` });
      if (cs.flags.obs_al_quitter) items.push({ kind: "good", text: "Vous aviez consigné l'omission dans vos observations écrites dès l'audition." });
      if (cs.flags.pvRectifie) items.push({ kind: "good", text: "À la relecture, vous avez fait corriger « J'ai voulu le frapper » en « J'ai voulu qu'il arrête »." });
      else if (cs.vars.conseilGav === "expliquer") items.push({ kind: "bad", text: "Le procès-verbal fait dire à Thomas « J'ai voulu le frapper » : la phrase n'a pas été rectifiée à la relecture." });
      if (cs.flags.promesse || cs.advice.includes("a2_garantie")) items.push({ kind: "bad", text: "Vous avez promis un résultat. On promet ses diligences, jamais une issue." });
      if (lucas && lucas.vars.ittRetenue && cs.vars.ittRetenue) items.push({ kind: "info", text: `Le miroir : au chapitre 1, pour la victime, le tribunal a retenu ${lucas.vars.ittRetenue} jours ; au chapitre 2, pour le prévenu, ${cs.vars.ittRetenue} jours. Mêmes certificats, autres plaidoiries.` });
      if (lucas) items.push({ kind: "info", text: "La vidéo a servi les deux camps : la poussée pour la défense, le recul pour la victime. Lisez une pièce avec les yeux de l'adversaire." });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      const p = api.cs.vars.peine;
      if (o.type === "relaxe") return "Thomas a été relaxé. Il a gardé son emploi ; il ne sert plus jamais les clients qui ont trop bu.";
      if (o.type === "requalification_favorable") return `${p ? p.texte : "Une amende"}. Thomas a gardé son emploi de cuisinier, et six mois plus tard il a envoyé un ami au cabinet.`;
      return `${p ? p.texte : "Condamné"}. Thomas a gardé son emploi de cuisinier, et six mois plus tard il a envoyé un ami au cabinet.`;
    },
    fiche(api, o) {
      return {
        phrase: "Violences devant un bar, tribunal correctionnel, avocat de Thomas Moreau.",
        notions: [
          { titre: "Le seuil des huit jours d'ITT", regle: "Plus de huit jours : délit (art. 222-11 CP) ; huit jours ou moins : contravention de cinquième classe (art. R. 625-1 CP).", art: "art. 222-11 et R. 625-1 CP", prog: "dps" },
          { titre: "La requalification par le tribunal", regle: "Le tribunal correctionnel saisi d'un délit qui ne constitue qu'une contravention prononce la peine et statue, s'il y a lieu, sur l'action civile.", art: "art. 466 CPP", prog: "pp_jugement" },
          { titre: "La légitime défense", regle: "Riposte nécessaire, simultanée et proportionnée à une atteinte injustifiée envers soi-même ou autrui.", art: "art. 122-5 CP", prog: "dpg" },
          { titre: "Les droits en audition libre", regle: "La personne entendue librement est informée de l'infraction, du droit de quitter à tout moment les locaux, du droit de se taire, de l'interprète, de l'avocat.", art: "art. 61-1 CPP", prog: "pp_enquete" },
        ],
        piege: "Depuis le 23 octobre 2026, les conclusions de nullité se déposent au greffe au plus tard trois jours avant l'audience (art. 385).",
        devenir: api.def.epilogue(api, o),
        plusLoin: "Le prévenu condamné dispose de dix jours pour faire appel d'un jugement contradictoire (art. 498).",
      };
    },
    corrige(api) {
      return [
        { probleme: "Délit ou contravention ?", regle: "Plus de huit jours d'ITT : délit (art. 222-11 CP) ; huit jours ou moins sans circonstance aggravante : contravention (art. R. 625-1). Le tribunal requalifie et statue (art. 466 CPP).", application: "Six jours aux urgences le soir même, dix jours à l'UMJ plus d'une semaine plus tard : la défense plaide le doute et la requalification." },
        { probleme: "Le procès-verbal d'audition libre est-il régulier ?", regle: "La personne entendue librement doit être informée de son droit de quitter à tout moment les locaux (art. 61-1, 2°). L'exception de nullité se soulève avant toute défense au fond, par conclusions au greffe trois jours avant l'audience (art. 385).", application: "Le PV énumère les droits notifiés sans celui-là. Annulé, il fait tomber les déclarations de Thomas ; la vidéo et le témoin restent." },
        { probleme: "Peut-on plaider la légitime défense ?", regle: "Il faut une riposte nécessaire, simultanée et proportionnée à une atteinte injustifiée (art. 122-5 CP).", application: "La vidéo montre Bernier reculer avant le coup : l'atteinte avait cessé. La poussée sert la peine (provocation, personnalité), pas la relaxe." },
      ];
    },
  });

  function copj(api) {
    const { s, cs } = api;
    if (cs.proc.audience) return;
    let day = CR.rollForward(s.day + 33);
    while (CR.dow(day) !== 2 || !CR.isBusinessDay(day)) day++;
    CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "convocation", convocDay: s.day, president: "pr_aubriot", script: "jugement", done: "apresJugement", onMiss: "_absent", title: "Audience — 10e chambre correctionnelle", duree: 80 });
    CR.PROC.stade(api, "convocation", "Convocation par officier de police judiciaire devant le tribunal correctionnel (art. 390-1), remise à l'issue de l'audition.");
    api.doc("copj", "Convocation par OPJ");
    api.tl("Convocation devant le tribunal correctionnel remise à Thomas.");
  }

  // Le tutoriel ne doit jamais rester bloqué : un client perdu fait passer au chapitre suivant
  const close0 = CR.closeCase;
  CR.closeCase = function (s, cs, outcome) {
    const r = close0(s, cs, outcome);
    const t = outcome && outcome.type;
    if (s.mode === "tutoriel" && ["lost-lead", "declined", "withdrawn", "fired", "transferred"].includes(t)) {
      if (cs.def === "tuto_lucas") lancerChapitre2(CR.api(s, cs));
      if (cs.def === "tuto_thomas" && !s.flags.tutoFini) {
        s.flags.tutoFini = true;
        CR.mail(s, { from: CR.MENTOR.nom, subject: "Thomas est parti", kind: "email", important: true, body: [["Thomas a pris un autre avocat. Cela arrive : un client qu'on ne rappelle pas, une discussion d'honoraires qui tourne mal, et le dossier part chez le voisin."], ["Le tutoriel s'arrête là. Vous pouvez le recommencer depuis l'écran titre, ou ouvrir votre cabinet."]] });
      }
    }
    return r;
  };

  // Le mot d'accueil du tutoriel
  const intro = CR.initIntro;
  CR.initIntro = function (s) {
    intro(s);
    if (s.mode !== "tutoriel") return;
    CR.mail(s, { from: CR.MENTOR.nom, subject: "Bienvenue au cabinet — le tutoriel", kind: "email", important: true,
      body: [["Mon cher confrère,"], ["Pour vos débuts, une seule affaire, jouée deux fois : une bagarre devant un bar du 18e. D'abord pour la victime, ensuite pour l'auteur."], ["Je vous expliquerai chaque outil la première fois que vous le croiserez. Je ne vous dirai jamais où est la faille, ni quoi plaider."], ["Votre téléphone va sonner ce matin. Répondez, et notez tout ce qui compte : cliquez sur les phrases de votre interlocuteur, elles iront dans votre carnet."]] });
  };
})();
