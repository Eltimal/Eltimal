// La Permanence — refonte du gameplay, lot 7 : le dossier criminel vers son volume réel (CR.CRIMD)
// Le générateur criminel (gen-pieces-crim.js) rend un dossier d'une quinzaine de pièces brèves. Ce module y ajoute, composées
// par le moteur de documents, les pièces que tout dossier criminel contient et qui manquaient : le transport sur les lieux
// avec les constatations de l'identité judiciaire et la liste des scellés (tirée des preuves du dossier), l'inventaire des
// scellés et leur envoi aux laboratoires, l'enquête de voisinage (plusieurs voisins, des heures qui ne concordent pas
// toujours, de bonne foi), l'assistance à l'autopsie (la fourchette de l'heure du décès), la commission rogatoire du juge
// d'instruction et le procès-verbal de synthèse de son exécution. Mêmes faits, mêmes dates que le reste du dossier.
// Règles de contenu (dev/ref/refonte-gameplay.md, « Ce qui ne change pas ») : pour les affaires dont la victime est mineure
// (récit procédural), pas d'enquête de voisinage et aucune description des faits ; le registre reste celui du procès-verbal.
(function () {
  "use strict";
  const CR = window.CR;
  const GEN2 = CR.GEN2;
  if (!GEN2 || !GEN2.piecesCrim || GEN2.piecesCrim.complete) return;
  const K = (CR.CRIMD = {});
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const NUM = ["UN", "DEUX", "TROIS", "QUATRE", "CINQ", "SIX", "SEPT", "HUIT", "NEUF", "DIX"];

  // les scellés que les preuves du dossier supposent, dans l'ordre où l'identité judiciaire les constitue
  K.scelles = function (t, N) {
    const L = [];
    const has = (k) => (t.preuves || []).includes(k);
    if (has("adn")) L.push({ k: "adn", t: "écouvillons de prélèvements biologiques effectués sur les lieux (trois)", labo: "laboratoire de police scientifique (analyse génétique)" });
    if (has("balistique")) L.push({ k: "balistique", t: "étuis percutés et projectile retrouvés sur les lieux", labo: "laboratoire de police scientifique (balistique)" });
    if (has("saisie")) L.push({ k: "saisie", t: String(N.saisie || "objets découverts sur les lieux").replace(/^\w/, (c) => c.toLowerCase()), labo: null });
    if (has("toxico")) L.push({ k: "toxico", t: "prélèvements sanguins et urinaires", labo: "laboratoire de toxicologie" });
    if (has("video")) L.push({ k: "video", t: "disque contenant l'extraction des images de vidéoprotection", labo: null });
    if (has("telephonie")) L.push({ k: "telephonie", t: "téléphone portable découvert sur les lieux", labo: "service d'exploitation des supports numériques" });
    return L;
  };

  // ce que sait le témoin principal (seconde audition, confrontation) : un seul tirage pour toutes les pièces et scènes.
  // null s'il n'y a pas de témoin, s'il a moins de seize ans, ou si l'affaire suit le récit procédural (victime mineure)
  K.temoin = function (t, N) {
    const T = t && t.T;
    if (!T || N.procedural || (T.age || 30) < 16) return null;
    const rt = CR.seeded(t.sig + ":reaud");
    const h0 = ((t.d.h % 1440) + 1440) % 1440;
    const jR = t.d.faits + int(rt, 3, 12), mR = 10 * 60 + int(rt, 0, 300);
    const premiere = ([].concat(N.temoins || []).find((x) => x.qui === "T") || { lines: [] }).lines[0] || "";
    const corrige = rt() < 0.35;
    const hDit = h0 + (corrige ? pk(rt, [-1, 1]) * int(rt, 30, 70) : int(rt, -8, 8));
    const dist = pk(rt, ["cinq mètres", "une dizaine de mètres", "une vingtaine de mètres", "l'autre côté de la rue"]);
    const lum = pk(rt, ["l'éclairage public", "la lumière de la cage d'escalier", "la vitrine d'en face", "presque rien, il faisait nuit"]);
    const reconnait = pk(rt, ["Oui, sans hésiter.", "Je crois, oui. Je ne pourrais pas le jurer.", "C'est lui, je le reconnais à sa silhouette."]);
    // tirés ici, pas au rendu : la pièce se relit à l'identique (mêmes tirages, dans le même ordre qu'avant)
    const ajout = pk(rt, ["Non.", "Non, j'ai tout dit.", "J'ai du mal à dormir depuis."]), finR = mR + int(rt, 25, 55);
    // le premier jour, il a donné l'heure des faits ; corrigée, elle s'écarte de 30 à 70 minutes
    return { T, h0, jR, mR, ajout, finR, premiere, corrige, hDit, hAvant: h0, dist, lum, reconnait, nuit: /presque rien/.test(lum), hesite: /jurer/.test(reconnait), silhouette: /silhouette/.test(reconnait), loin: /vingtaine|autre côté/.test(dist) };
  };

  K.SOUS = { B: ["expertise_psy", "personnalite", "interro_cv"], C: ["ordo_dp", "dml", "ordo_prolong"] };
  K.sousDossier = (k) => (K.SOUS.B.includes(k) ? "B" : K.SOUS.C.includes(k) ? "C" : "D");
  K.SOUS_LABEL = { D: "Fond", B: "Personnalité", C: "Détention" };
  K.recoter = function (PZ) {
    const num = (c) => +String(c).replace(/\D/g, "") || 0;
    const ordre = Object.keys(PZ.cotes).sort((a, b) => num(PZ.cotes[a]) - num(PZ.cotes[b]));
    const n = { B: 0, C: 0, D: 0 };
    for (const k of ordre) {
      const L = K.sousDossier(k), ancien = PZ.cotes[k];
      PZ.cotes[k] = L + ++n[L];
      if (PZ.titres && PZ.titres[k]) PZ.titres[k] = PZ.titres[k].replace(new RegExp("\\(" + ancien + "\\)$"), `(${PZ.cotes[k]})`);
    }
    PZ.sousDossiers = true;
    return PZ;
  };
  K.ajouter = function (t, N, PZ) {
    const DOCS = CR.DOCS; if (!DOCS || !DOCS.pv) return PZ;
    const I = CR.CAT.INF[t.inf] || {};
    const r = CR.seeded(t.sig + ":crimd");
    const A = t.A, V = t.V;
    const n = (x) => (x ? `${x.prenom} ${x.nom}` : "");
    const nf = (x) => `${x && x.g === "f" ? "Mme" : "M."} ${n(x)}`;
    const proc = !!N.procedural;
    const jf = t.d.faits, h0 = ((t.d.h % 1440) + 1440) % 1440;
    const svc = (GEN2.serviceCrim ? GEN2.serviceCrim(t) : "Direction régionale de la police judiciaire");
    const service = "PRÉFECTURE DE POLICE · " + svc.toUpperCase();
    const opj = { nom: pk(r, ["Commandant Hélène Garnier", "Capitaine Marc Viallet", "Lieutenant Sonia Rahmani", "Capitaine Pierre Lestrade"]), qualite: "officier de police judiciaire" };
    opj.signe = opj.nom;
    const st = DOCS.style ? DOCS.style(CR.seeded(t.sig + ":crimd:st")) : undefined;
    const hm = DOCS.hm;
    let cote = Object.values(PZ.cotes || {}).reduce((a, c) => Math.max(a, +String(c).replace(/\D/g, "") || 0), 0);
    const cotes = PZ.cotes, titres = PZ.titres, docs = PZ.docs, facts = PZ.facts;
    const add = (key, court, liste, fn) => { if (docs[key]) return; cote++; cotes[key] = "D" + cote; titres[key] = `${court} (D${cote})`; docs[key] = fn; for (const l of liste) if (PZ.listes[l] && !PZ.listes[l].includes(key)) PZ.listes[l].push(key); };
    const fact = (id, o) => { if (!facts[id]) facts[id] = o; };
    const lieu = N.lieu || "sur les lieux";
    const ENQ = ["enquete", "dossier", "copie", "tout"], INS = ["instruction", "copie", "tout"];

    // 1. transport sur les lieux, constatations et scellés
    const mT = h0 + int(r, 35, 95), mTfin = mT + int(r, 120, 260);
    const scel = K.scelles(t, N);
    const traces = int(r, 0, 4);
    add("pv_transport", "Transport et constatations", ENQ, () => DOCS.pv({ cote: cotes.pv_transport, proc: t.proc, service, unite: "Identité judiciaire", cadre: t.flagrance ? "FLAGRANT DÉLIT" : "ENQUÊTE", titre: "Procès-verbal de transport, de constatations et de saisies", numPV: "00" + int(CR.seeded(t.sig + ":tr"), 101, 899),
      jour: DOCS.jourDe(jf, mTfin), heure: mTfin, redacteur: opj, visa: t.flagrance ? "Vu les articles 54, 56 et 60 du code de procédure pénale," : "Vu les articles 75 et suivants du code de procédure pénale,", lieu: "Nous transportant sur les lieux", objet: `OBJET : ${t.q.label} — transport et constatations`,
      blocs: [
        DOCS.p(`À ${hm(mT)}, nous transportons ${lieu}, en compagnie des fonctionnaires de l'identité judiciaire. Un périmètre de sécurité est en place à notre arrivée.`),
        proc ? DOCS.p("Constatations conformes au rapport de l'identité judiciaire, annexé ; planche photographique non reproduite.") : DOCS.p(`Constatations : ${[].concat(N.constat || []).slice(0, 2).join(" ").replace(/\s+/g, " ") || "état des lieux relevé et photographié"}`),
        DOCS.p({ t: traces ? `Recherche de traces papillaires : ${traces === 1 ? "une trace exploitable relevée" : traces + " traces exploitables relevées"}, transmises au fichier automatisé des empreintes digitales.` : "Recherche de traces papillaires : aucune trace exploitable.", f: traces ? undefined : "G_aucune_trace" }),
        ...(scel.length ? [DOCS.p("Procédons aux saisies suivantes, placées sous scellés :")].concat(scel.map((x, i) => DOCS.ligne(`Scellé n° ${NUM[i] || i + 1}`, x.t))) : [DOCS.p("Aucun objet n'est saisi sur les lieux.")]),
        DOCS.p(`Fin des opérations à ${hm(mTfin)}.`),
      ], cloture: DOCS.mention(`Dont procès-verbal, fait et clos sur les lieux le ${DOCS.date(DOCS.jourDe(jf, mTfin))} à ${hm(mTfin)}.`), signataires: [`${opj.signe}, officier de police judiciaire`, "Le technicien de l'identité judiciaire"], st }));
    if (!traces) fact("G_aucune_trace", { label: "Aucune trace papillaire exploitable sur les lieux", key: false });

    // 2. inventaire des scellés et transmissions aux laboratoires
    if (scel.length) {
      const jInv = DOCS.jourDe(jf, mTfin) + int(r, 1, 3);
      add("inventaire_scelles", "Inventaire des scellés", ENQ, () => DOCS.forme({ title: "Inventaire des scellés et réquisitions aux laboratoires", kind: "releve", cote: cotes.inventaire_scelles, entete: [service, `Procédure n° ${t.proc} — cote ${cotes.inventaire_scelles}`],
        blocs: [DOCS.p(`Inventaire établi le ${DOCS.date(jInv)}.`)].concat(scel.map((x, i) => DOCS.ligne(`Scellé n° ${NUM[i] || i + 1} — ${x.t}`, x.labo ? `adressé au ${x.labo} le ${DOCS.date(jInv)}` : "conservé au service"))),
        sigs: [`${opj.signe}, officier de police judiciaire`] }));
    }

    // 3. enquête de voisinage (jamais pour une victime mineure)
    if (!proc) {
      const nb = int(r, 3, 5);
      const BRUITS = I.deces || /meurtre|assassinat|violences/.test(t.inf) ? ["des cris", "une violente dispute", "un bruit sourd, comme une chute", "une détonation", "quelqu'un qui courait dans l'escalier", "une porte claquer"] : ["des éclats de voix", "un véhicule qui démarrait vite", "des pas pressés", "un bruit de verre brisé"];
      const NOMS = [["Mme", "Josiane Leclerc", 74], ["M.", "Ahmed Bouzid", 41], ["Mme", "Camille Perrin", 29], ["M.", "Gérard Masson", 66], ["Mme", "Fatoumata Sy", 35], ["M.", "Lucas Hoarau", 23]];
      const vs = [];
      for (let i = 0; i < nb; i++) { const [c, nm, age] = NOMS[(i + int(r, 0, 5)) % NOMS.length]; if (vs.some((x) => x.nm === nm)) continue; vs.push({ c, nm, age, h: h0 + int(r, -35, 35), quoi: pk(r, BRUITS), etage: pk(r, ["au premier étage", "au troisième", "sur le même palier", "dans l'immeuble d'en face", "au rez-de-chaussée"]), rien: r() < 0.25 }); }
      const dits = vs.filter((x) => !x.rien).map((x) => x.h);
      const ecart = dits.length > 1 ? Math.max(...dits) - Math.min(...dits) : 0;
      const mV = mTfin + int(r, 60, 300);
      add("pv_voisinage", "Enquête de voisinage", ENQ, () => DOCS.pv({ cote: cotes.pv_voisinage, proc: t.proc, service, unite: svc, cadre: t.flagrance ? "FLAGRANT DÉLIT" : "ENQUÊTE", titre: "Procès-verbal d'enquête de voisinage", numPV: "00" + int(CR.seeded(t.sig + ":vois"), 101, 899),
        jour: DOCS.jourDe(jf, mV), heure: mV, redacteur: opj, lieu: "Nous transportant sur les lieux", objet: `OBJET : ${t.q.label} — enquête de voisinage`,
        blocs: [DOCS.p(`Procédons à une enquête de voisinage ${lieu}. Les personnes suivantes, entendues sommairement, déclarent :`)].concat(vs.map((x) => DOCS.p({ t: x.rien ? `${x.c} ${x.nm}, ${x.age} ans, demeurant ${x.etage} : n'a rien vu ni entendu.` : `${x.c} ${x.nm}, ${x.age} ans, demeurant ${x.etage} : a entendu ${x.quoi} « vers ${hm(x.h)} ».`, f: undefined }))).concat([DOCS.p("Les personnes qui ont vu ou entendu un élément utile sont invitées à se présenter au service pour y être entendues.")]),
        cloture: DOCS.mention(`Dont procès-verbal, fait et clos ${DOCS.date(DOCS.jourDe(jf, mV))} à ${hm(mV)}.`), signataires: [`${opj.signe}, officier de police judiciaire`], st }));
      if (ecart > 25) fact("G_heures_voisins", { label: `Les voisins situent les faits à des heures qui s'écartent de ${ecart} minutes`, key: true, why: "L'heure des faits n'est pas établie à la minute : rapprochée de la téléphonie ou des images, cette marge peut ouvrir un alibi ou fermer une version." });
    }

    // 4. assistance à l'autopsie : la fourchette de l'heure du décès
    if (I.deces && V) {
      const avant = int(r, 60, 180), apres = int(r, 30, 150);
      const jA = jf + int(r, 1, 2), mA = 9 * 60 + int(r, 0, 120);
      add("pv_autopsie", "Assistance à l'autopsie", ENQ, () => DOCS.pv({ cote: cotes.pv_autopsie, proc: t.proc, service, unite: svc, cadre: t.flagrance ? "FLAGRANT DÉLIT" : "ENQUÊTE", titre: "Procès-verbal d'assistance à l'autopsie", numPV: "00" + int(CR.seeded(t.sig + ":auto"), 101, 899),
        jour: jA, heure: mA, redacteur: opj, lieu: "Nous trouvant à l'institut médico-légal", objet: `OBJET : ${t.q.label} — assistance à l'autopsie`,
        blocs: [
          DOCS.p(`Assistons à l'autopsie du corps de ${proc ? "la victime" : nf(V)}, pratiquée par le médecin légiste requis.`),
          DOCS.p("Le médecin légiste indique, sous réserve de son rapport définitif, que les constatations sont compatibles avec le mécanisme décrit dans la procédure."),
          DOCS.p({ t: `Au vu de la température du corps, des lividités et de la rigidité, le décès est situé entre ${hm(h0 - avant)} et ${hm(h0 + apres)}.`, f: avant + apres > 240 ? "G_fourchette" : undefined }),
          DOCS.p("Des prélèvements sont effectués et placés sous scellés pour analyses toxicologiques et anatomopathologiques."),
        ], cloture: DOCS.mention(`Dont procès-verbal, fait et clos à l'institut médico-légal, le ${DOCS.date(jA)}.`), signataires: [`${opj.signe}, officier de police judiciaire`], st }));
      if (avant + apres > 240) fact("G_fourchette", { label: `La fourchette de l'heure du décès couvre ${Math.round((avant + apres) / 60)} heures`, key: true, why: "Une fourchette large ne situe pas les faits à l'heure de l'accusation : à confronter aux heures que donnent les autres pièces." });
    }

    // 5. la seconde audition du témoin : il confirme, précise, et parfois corrige de bonne foi un point de sa première
    // déclaration (l'heure, la distance, l'éclairage) — jamais pour un témoin mineur ni une victime mineure
    const T = t.T, W = K.temoin(t, N);
    if (W) {
      const { jR, mR, premiere, corrige, hDit, dist, lum, reconnait, ajout, finR } = W;
      add("pv_reaudition", "Seconde audition du témoin", ENQ, () => DOCS.pv({ cote: cotes.pv_reaudition, proc: t.proc, service, unite: svc, cadre: t.flagrance ? "FLAGRANT DÉLIT" : "ENQUÊTE", titre: "Procès-verbal d'audition de témoin", qualite: "Témoin", numPV: "00" + int(CR.seeded(t.sig + ":reaud2"), 101, 899),
        jour: jR, heure: mR, redacteur: opj, lieu: "Nous trouvant au service", objet: `OBJET : ${t.q.label} — seconde audition`,
        identite: { nom: T.nom, prenom: T.prenom, g: T.g, metier: T.metier, adresse: T.adresse },
        blocs: [
          DOCS.decl(`« Je confirme ce que j'ai déclaré le jour des faits.${premiere ? " " + premiere.replace(/\s+$/, "") : ""} »`),
          DOCS.titre("QUESTIONS ET RÉPONSES"),
          DOCS.q("Quelle heure était-il ?"), DOCS.r(corrige ? { t: `Je me suis trompé${T.g === "f" ? "e" : ""} la première fois. En y repensant, c'était plutôt vers ${hm(hDit)} : j'étais rentré${T.g === "f" ? "e" : ""} après le journal télévisé.`, f: "G_temoin_varie" } : `Vers ${hm(hDit)}, je crois.`),
          DOCS.q("À quelle distance vous trouviez-vous ?"), DOCS.r(`À ${dist}.`),
          DOCS.q("Comment étaient les lieux éclairés ?"), DOCS.r({ t: `Par ${lum}.`, f: /presque rien/.test(lum) ? "G_temoin_nuit" : undefined }),
          DOCS.q(`Reconnaissez-vous ${n(A)} sur la photographie qui vous est présentée ?`), DOCS.r({ t: reconnait, f: /jurer/.test(reconnait) ? "G_temoin_hesite" : undefined }),
          DOCS.q("Avez-vous quelque chose à ajouter ?"), DOCS.r(ajout),
        ], cloture: DOCS.clotureAudition("Paris", jR, finR, T.g === "f" ? "elle" : "lui"), signataires: ["La personne entendue", `${opj.signe}, officier de police judiciaire`], st }));
      if (corrige) fact("G_temoin_varie", { label: "Le témoin corrige l'heure des faits lors de sa seconde audition", key: true, why: "Un témoin qui varie sur l'heure peut varier sur le reste : la défense confronte ses deux déclarations." });
      if (/presque rien/.test(lum)) fact("G_temoin_nuit", { label: "Le témoin voyait les lieux presque sans éclairage", key: true, why: "Ce qu'on voit la nuit, sans lumière, se discute : l'identification par ce témoin est fragile." });
      if (/jurer/.test(reconnait)) fact("G_temoin_hesite", { label: "Le témoin hésite à reconnaître l'accusé", key: true, why: "Une reconnaissance hésitante ne vaut pas identification." });
    }

    // 6. l'expertise psychiatrique mise en forme de rapport : mission, entretien, antécédents, examen, discussion (le texte
    // d'origine et ses phrases de défense, intacts), réponses aux questions — accordées à l'état psychique tiré (art. 122-1)
    if (docs.expertise_psy && t.f) {
      const vieux = docs.expertise_psy;
      const rp = CR.seeded(t.sig + ":psy");
      const etat = t.f.psy || "intact";
      const sexuel = /sexuel/.test(I.fam || "");
      const duree = int(rp, 2, 3), lieuE = t.entree === "detenu" || (t.d && t.d.dp != null) ? "à la maison d'arrêt" : "au cabinet de l'expert";
      const ant = pk(rp, ["Aucun antécédent psychiatrique connu ; pas de suivi.", "Un suivi en centre médico-psychologique pendant l'adolescence, interrompu.", "Une hospitalisation de quelques jours il y a plusieurs années, après une crise d'angoisse.", "Une consommation régulière d'alcool, sans prise en charge."]);
      const rep = {
        intact: ["L'examen ne révèle pas de trouble psychique ou neuropsychique ayant aboli ou altéré son discernement ou le contrôle de ses actes au moment des faits (art. 122-1 du code pénal).", "La dangerosité relève de la criminologie, non de la psychiatrie ; aucune pathologie ne la fonde.", "Il est accessible à une sanction pénale."],
        altere: ["L'intéressé présentait au moment des faits un trouble psychique ayant altéré son discernement et entravé le contrôle de ses actes, au sens de l'article 122-1, alinéa 2, du code pénal.", "Une prise en charge psychiatrique durable réduirait le risque de réitération.", "Il est accessible à une sanction pénale, qui devra s'accompagner de soins."],
        aboli: ["L'intéressé était atteint au moment des faits d'un trouble psychique ayant aboli son discernement et le contrôle de ses actes, au sens de l'article 122-1, alinéa 1, du code pénal.", "Son état justifie une hospitalisation sous contrainte et des soins de longue durée.", "Il n'est pas accessible à une sanction pénale au sens où elle suppose la compréhension de l'acte."],
      }[etat] || [];
      docs.expertise_psy = (x) => {
        const o = vieux(x);
        const avant = [["MISSION"], [`Désigné par ordonnance du juge d'instruction, avec mission d'examiner ${n(A)}, de dire s'il présentait au moment des faits un trouble psychique ou neuropsychique ayant aboli ou altéré son discernement, s'il est dangereux, accessible à une sanction pénale, curable ou réadaptable${sexuel ? ", et si une injonction de soins est opportune" : ""}.`], ["ENTRETIEN"], [`Examen réalisé ${lieuE}, en ${duree} entretiens. L'intéressé se présente calme, orienté, coopérant ; le discours est cohérent.`], ["ANTÉCÉDENTS"], [ant], ["DISCUSSION"]];
        const apres = [["RÉPONSES AUX QUESTIONS"]].concat(rep.map((x0, i) => [`${i + 1}. ${x0}`])).concat(sexuel && etat !== "aboli" ? [["4. Une injonction de soins, dans le cadre d'un suivi socio-judiciaire, est opportune."]] : []);
        return Object.assign({}, o, { paras: avant.concat(o.paras || [], apres) });
      };
    }

    // 7. les expertises techniques en forme de rapport : les scellés reçus portent les numéros de l'inventaire, la méthode,
    // le texte d'origine (marqueurs et phrases de défense intacts), les réserves de l'expert
    const numDe = (k) => { const i = scel.findIndex((x) => x.k === k); return i >= 0 ? NUM[i] || String(i + 1) : null; };
    const TECH = {
      rapport_adn: { k: "adn", meth: "Extraction de l'ADN, amplification de 24 marqueurs (trousse homologuée), électrophorèse capillaire ; comparaison au fichier national automatisé des empreintes génétiques et aux profils de référence.", res: "La présence d'un profil génétique sur un support ne renseigne ni sur la date ni sur les circonstances du dépôt ; un transfert secondaire (par un objet ou une personne) ne peut être exclu." },
      balistique: { k: "balistique", meth: "Examen macroscopique et microscopique comparatif des étuis et du projectile ; consultation du fichier des traces balistiques.", res: /pistolet|fusil|revolver|carabine|arme/i.test(N.saisie || "") ? "La comparaison porte sur l'arme saisie ; elle ne dit pas qui la tenait au moment du tir." : "Faute d'arme saisie, aucune comparaison avec une arme déterminée n'a pu être réalisée." },
      toxico: { k: "toxico", meth: "Dépistage immunochimique, puis confirmation par chromatographie couplée à la spectrométrie de masse.", res: "Les concentrations relevées doivent être rapprochées de l'heure du prélèvement : elles décroissent avec le temps." },
      expertise_tech: { k: null, meth: "Examen des pièces et scellés transmis, constatations sur place le cas échéant.", res: "Les conclusions valent dans la limite des éléments transmis à l'expert." },
    };
    for (const [key, X] of Object.entries(TECH)) {
      if (!docs[key]) continue;
      const vieux = docs[key];
      const num = X.k ? numDe(X.k) : null;
      const jRec = DOCS.jourDe(jf, mTfin) + int(CR.seeded(t.sig + ":" + key + ":rec"), 1, 3);
      docs[key] = (x) => {
        const o = vieux(x);
        const avant = [["SCELLÉS ET MISSION"], [num ? `Scellé n° ${num} reçu le ${DOCS.date(jRec)}, intact, sur réquisition de l'officier de police judiciaire.` : `Pièces reçues le ${DOCS.date(jRec)}, sur réquisition de l'officier de police judiciaire.`], ["MÉTHODE"], [X.meth], ["RÉSULTATS"]];
        const apres = [["RÉSERVES"], [X.res]];
        return Object.assign({}, o, { paras: avant.concat(o.paras || [], apres) });
      };
    }

    // 8. l'audition en garde à vue : les questions de tout enquêteur (emploi du temps, téléphone, tenue, relation avec la
    // victime, consommation), avant la lecture ; les réponses suivent la position tirée (nier, minimiser, reconnaître)
    if (docs.pv_audition_gav && A) {
      const vieux = docs.pv_audition_gav;
      const ra = CR.seeded(t.sig + ":audg");
      const pos = t.stance || "nie";
      const tel2 = ra() < 0.2, conso = pk(ra, ["Non, rien.", "Deux ou trois bières dans la soirée.", "Un peu de cannabis, comme tous les soirs.", "Non."]);
      const vu = V ? (proc ? "Oui." : pk(ra, ["Oui, on se connaissait.", "De vue, seulement.", "Oui, depuis des années."])) : "Non.";
      const Q = [
        [`Que faisiez-vous le ${DOCS.date(jf)}, vers ${hm(h0)} ?`, { nie: "J'étais chez moi. Seul. Personne ne peut le confirmer, je regardais un match.", minimise: "J'étais là-bas, oui. Mais ça ne s'est pas passé comme vous le dites.", reconnait: "J'étais sur place. Je vais tout vous expliquer." }[pos] || "Je ne souhaite pas répondre."],
        ["Quel numéro de téléphone utilisez-vous ?", `Le ${A.tel || "même depuis des années"}.${tel2 ? " J'en ai un autre, pour le travail, je ne connais pas le numéro par cœur." : ""}`],
        ["Comment étiez-vous habillé ce jour-là ?", pk(ra, ["Un jean, un sweat. Comme d'habitude.", "Je ne me souviens plus.", "Mon survêtement noir, je crois."])],
        ["Connaissiez-vous la victime ?", vu],
        ["Aviez-vous consommé de l'alcool ou des stupéfiants ?", conso],
        ["Avez-vous quelque chose à ajouter ?", { nie: "Je n'ai rien fait. Vous vous trompez de personne.", minimise: "Je regrette ce qui est arrivé. Je n'ai jamais voulu ça.", reconnait: "Je regrette. Je veux m'excuser auprès de la famille." }[pos] || "Non."],
      ];
      if (tel2) fact("G_second_tel", { label: "L'accusé déclare utiliser une seconde ligne, pour le travail", key: false });
      docs.pv_audition_gav = (x) => {
        const o = vieux(x);
        const P = (o.paras || []).slice();
        const fin = P.length && /Lecture faite/.test(JSON.stringify(P[P.length - 1])) ? P.pop() : null;
        const qr = [["QUESTIONS ET RÉPONSES"]].concat(...Q.map(([q0, a0]) => [[`Question : ${q0}`], [`Réponse : ${a0}`]]));
        return Object.assign({}, o, { paras: P.concat(qr, fin ? [fin] : []) });
      };
    }

    // 9. les auditions de la victime survivante et du proche : questions d'usage ; le proche donne le dernier signe de vie
    // (toujours antérieur aux faits), repère de chronologie que la défense rapproche de la fourchette de l'autopsie
    if (docs.pv_victime && V && !proc && !I.deces) {
      const vieux = docs.pv_victime;
      const rv = CR.seeded(t.sig + ":audv");
      const Q = [
        ["Avez-vous été examiné par un médecin ?", pk(rv, ["Oui, aux urgences, puis à l'unité médico-judiciaire.", "Oui, à l'unité médico-judiciaire, sur votre réquisition.", "Pas encore. J'ai rendez-vous."])],
        ["Comment allez-vous depuis les faits ?", pk(rv, ["Je ne dors plus. Je sursaute au moindre bruit.", "Je ne sors plus seul" + (V.g === "f" ? "e" : "") + ".", "J'ai repris le travail, mais c'est difficile."])],
        ["Connaissiez-vous l'auteur ?", pk(rv, ["Oui.", "De vue.", "Non, jamais vu."])],
        ["Souhaitez-vous être assisté" + (V.g === "f" ? "e" : "") + " d'un avocat et vous constituer partie civile ?", pk(rv, ["Oui.", "Je vais y réfléchir.", "Oui, et je demande réparation."])],
      ];
      docs.pv_victime = (x) => { const o = vieux(x); const P = (o.paras || []).slice(); const fin = P.length && /Lecture faite|clos/.test(JSON.stringify(P[P.length - 1])) ? P.pop() : null; return Object.assign({}, o, { paras: P.concat([["QUESTIONS ET RÉPONSES"]], ...Q.map(([q0, a0]) => [[`Question : ${q0}`], [`Réponse : ${a0}`]]), fin ? [fin] : []) }); };
    }
    if (docs.pv_proche && V && I.deces && !proc) {
      const vieux = docs.pv_proche;
      const rp = CR.seeded(t.sig + ":proche");
      const hDer = h0 - int(rp, 20, 150);
      const moyen = pk(rp, ["un message", "un appel de deux minutes", "un message vocal"]);
      // tirés ici, pas au rendu (même ordre qu'au premier rendu d'avant)
      const humeur = pk(rp, ["Rien d'inquiétant.", `${V.g === "f" ? "Elle" : "Il"} disait qu'${V.g === "f" ? "elle" : "il"} rentrait.`, `${V.g === "f" ? "Elle" : "Il"} avait l'air tendu${V.g === "f" ? "e" : ""}.`]);
      const ennemis = pk(rp, ["Non. Personne.", "Des histoires d'argent, peut-être. Je ne sais pas avec qui.", "Je savais qu'il y avait des tensions avec lui."]);
      fact("G_dernier_signe", { label: `Dernier signe de vie de la victime : ${moyen} à ${hm(hDer)}`, key: false });
      docs.pv_proche = (x) => { const o = vieux(x); const P = (o.paras || []).slice(); const fin = P.length && /Lecture faite|clos/.test(JSON.stringify(P[P.length - 1])) ? P.pop() : null; return Object.assign({}, o, { paras: P.concat([["QUESTIONS ET RÉPONSES"], [`Question : Quand avez-vous eu des nouvelles de ${V.prenom} pour la dernière fois ?`], [{ t: `Réponse : Le soir même. ${CR.cap(moyen)} à ${hm(hDer)}. ${humeur}`, f: "G_dernier_signe" }], ["Question : Lui connaissiez-vous des ennemis, des dettes, des menaces ?"], [`Réponse : ${ennemis}`]], fin ? [fin] : []) }); };
    }

    // 10. la commission rogatoire et la synthèse de son exécution
    if (t.d.ri != null) {
      const jCR = t.d.ri + int(r, 1, 4), jRet = jCR + int(r, 18, 40);
      const actes = [].concat(N.actes || []).map((x) => (typeof x === "string" ? x : x.t)).filter(Boolean).slice(0, 4);
      const liste = actes.length ? actes : ["Procéder à toutes auditions utiles", "Exploiter les données téléphoniques des lignes en cause", "Rechercher et exploiter les images de vidéoprotection"];
      PZ.jours = Object.assign(PZ.jours || {}, { commission_rogatoire: jCR, pv_retour_cr: jRet });
      add("commission_rogatoire", "Commission rogatoire", INS, () => DOCS.forme({ title: "Commission rogatoire", kind: "greffe", cote: cotes.commission_rogatoire, entete: [`Tribunal judiciaire — cabinet du juge d'instruction`, `Information n° ${t.ninfo} — cote ${cotes.commission_rogatoire}`],
        blocs: [
          DOCS.p(`Nous, juge d'instruction, vu les articles 81, 151 et 152 du code de procédure pénale, donnons commission rogatoire au chef de la ${svc} de procéder aux actes suivants :`),
          ...liste.map((x, i) => DOCS.ligne(String(i + 1), x.replace(/\.$/, ""))),
          DOCS.p(`Délai d'exécution : deux mois. Fait le ${DOCS.date(jCR)}.`),
        ], sigs: ["Le juge d'instruction"] }));
      add("pv_retour_cr", "Synthèse d'exécution", INS, () => DOCS.pv({ cote: cotes.pv_retour_cr, proc: t.proc, service, unite: svc, cadre: "COMMISSION ROGATOIRE", titre: "Procès-verbal de synthèse — exécution de la commission rogatoire", numPV: "00" + int(CR.seeded(t.sig + ":cr"), 101, 899),
        jour: jRet, heure: 17 * 60 + int(CR.seeded(t.sig + ":crh"), 0, 50), redacteur: opj, visa: "Vu la commission rogatoire et les articles 151 et suivants du code de procédure pénale,", lieu: "Nous trouvant au service", objet: `OBJET : ${t.q.label} — retour de commission rogatoire`,
        blocs: [DOCS.p(`Exécutant la commission rogatoire du ${DOCS.date(jCR)}, avons accompli les actes suivants :`)].concat(liste.map((x, i) => DOCS.ligne(String(i + 1), `${x.replace(/\.$/, "")} : ${pk(CR.seeded(t.sig + ":cr" + i), ["procès-verbaux joints", "exécuté, résultats joints", "exécuté en partie ; la suite est en cours", "sans résultat exploitable"])}`))).concat([DOCS.p("Retournons la commission rogatoire au magistrat mandant, avec les procès-verbaux d'exécution.")]),
        cloture: DOCS.mention(`Dont procès-verbal, fait et clos le ${DOCS.date(jRet)}.`), signataires: [`${opj.signe}, officier de police judiciaire`], st }));
    }

    // 13. les secours : le journal de la plateforme des appels d'urgence (réquisition) et l'audition de la personne qui a
    // appelé — un voisin ou un passant, arrivé après les faits. L'appel date objectivement les faits : il recoupe (ou non)
    // l'heure que donne le témoin principal. Jamais pour une victime mineure, ni sans victime.
    if (!proc && V && I.fam !== "crim_stups") {
      const ra = CR.seeded(t.sig + ":appel");
      const W = K.temoin(t, N);
      const mAppel = h0 + int(ra, 3, 14), dur = int(ra, 70, 260);
      const [civ, nomApp, ageApp] = pk(ra, [["Mme", "Nadia Ferhat", 52], ["M.", "Olivier Brunet", 38], ["Mme", "Élodie Martin", 31], ["M.", "Mamadou Keïta", 45], ["Mme", "Sylvie Robin", 60]]);
      const eApp = civ === "Mme" ? "e" : "";
      const vu = pk(ra, ["personne : quand je suis descendu" + eApp + ", il n'y avait plus que la victime", "un homme partir en courant, de dos, une veste sombre", "deux silhouettes au bout de la rue, sans pouvoir dire qui"]);
      const motif = I.deces ? "une personne au sol, qui ne bouge plus" : /sexuel/.test(I.fam || "") ? "une personne en pleurs, qui demande de l'aide" : "une agression en cours, des cris";
      const jReq = jf + int(ra, 1, 4);
      // tous les tirages hors des fonctions de rendu : la pièce se relit à l'identique
      let mAud = 9 * 60 + int(ra, 30, 400), jAud = jf + int(ra, 0, 2);
      // entendue le jour même, la personne l'est après son appel (sinon le lendemain)
      if (jAud === jf && mAud < mAppel + 90) { if (mAppel + 150 < 23 * 60) mAud = mAppel + 90 + int(ra, 0, 50); else jAud = jf + 1; }
      const finAud = mAud + int(ra, 20, 40);
      const metierApp = civ === "Mme" ? pk(ra, ["aide-soignante", "comptable", "retraitée", "enseignante"]) : pk(ra, ["comptable", "chauffeur-livreur", "retraité", "enseignant"]);
      const entendu = pk(ra, ["J'ai entendu des cris", "J'ai entendu quelqu'un appeler au secours", "J'ai entendu du bruit, puis un cri"]);
      const ajout = pk(ra, ["Non.", "Je n'arrive plus à dormir.", "J'aurais voulu arriver plus tôt."]);
      add("requisition_appels", "Journal des appels d'urgence", ENQ, () => DOCS.forme({ title: "Réquisition à la plateforme des appels d'urgence et réponse", kind: "releve", cote: cotes.requisition_appels, entete: [service, `Procédure n° ${t.proc} — cote ${cotes.requisition_appels}`],
        blocs: [
          DOCS.p(`Réquisition du ${DOCS.date(jReq)} (art. ${t.flagrance ? "60-1" : "77-1-1"} du code de procédure pénale) : communiquer les appels reçus le ${DOCS.date(jf)} pour les faits survenus ${lieu}.`),
          DOCS.p("Réponse de la plateforme :"),
          DOCS.p({ t: `Appel reçu le ${DOCS.date(jf)} à ${hm(mAppel)} (horodatage du serveur).`, f: W && W.corrige ? "G_appel_heure" : undefined }),
          DOCS.ligne("Durée", `${Math.floor(dur / 60)} min ${String(dur % 60).padStart(2, "0")} s`),
          DOCS.ligne("Appelant", `${civ} ${nomApp}, ligne mobile`),
          DOCS.ligne("Motif déclaré", motif),
          DOCS.ligne("Suite", "engagement d'un équipage de police et des sapeurs-pompiers"),
        ], sigs: ["Le chef de salle de la plateforme"] }));
      add("pv_appelant", "Audition de la personne qui a appelé les secours", ENQ, () => DOCS.pv({ cote: cotes.pv_appelant, proc: t.proc, service, unite: svc, cadre: t.flagrance ? "FLAGRANT DÉLIT" : "ENQUÊTE", titre: "Procès-verbal d'audition de témoin", qualite: "Témoin", numPV: "00" + int(CR.seeded(t.sig + ":appel2"), 101, 899),
        jour: jAud, heure: mAud, redacteur: opj, lieu: "Nous trouvant au service", objet: `OBJET : ${t.q.label} — audition de l'appelant des secours`,
        identite: { nom: nomApp.split(" ").slice(1).join(" "), prenom: nomApp.split(" ")[0], g: civ === "Mme" ? "f" : "m", metier: metierApp, adresse: (lieu.match(/\d+[^,]*,.*$/) || [])[0] || "Paris" },
        blocs: [
          DOCS.titre("QUESTIONS ET RÉPONSES"),
          DOCS.q("Qu'avez-vous entendu ou vu ?"), DOCS.r(`${entendu}. J'ai appelé tout de suite, le temps de trouver mon téléphone.`),
          DOCS.q("À quelle heure ?"), DOCS.r({ t: `Je ne sais pas exactement. Mon téléphone dit que j'ai appelé à ${hm(mAppel)}. Les cris, c'était juste avant, une ou deux minutes.`, f: W && W.corrige ? "G_appel_heure" : undefined }),
          DOCS.q("Qu'avez-vous vu en arrivant ?"), DOCS.r({ t: `J'ai vu ${vu}.`, f: /de dos/.test(vu) ? "G_appelant_dos" : undefined }),
          DOCS.q(`Connaissez-vous ${n(A)} ?`), DOCS.r("Non. Je ne connais pas ce nom."),
          DOCS.q("Avez-vous quelque chose à ajouter ?"), DOCS.r(ajout),
        ], cloture: DOCS.clotureAudition("Paris", jAud, finAud, civ === "Mme" ? "elle" : "lui"), signataires: ["La personne entendue", `${opj.signe}, officier de police judiciaire`], st }));
      if (W && W.corrige) fact("G_appel_heure", { label: `L'appel aux secours (${hm(mAppel)}) ne s'accorde pas avec l'heure corrigée du témoin (${hm(W.hDit)})`, key: true, why: "Le journal des appels date objectivement les faits : la seconde version du témoin, sur l'heure, est démentie ; sa fiabilité se discute." });
      if (/de dos/.test(vu)) fact("G_appelant_dos", { label: "La personne qui a appelé les secours n'a vu qu'un homme de dos", key: false, why: "Un second témoin, sans identification : il ne confirme pas la reconnaissance." });
    }

    // 11. l'interrogatoire de curriculum vitae (sous-dossier de personnalité) : le juge interroge la personne mise en examen
    // sur son parcours — tiré de sa fiche (famille, scolarité, travail, logement, santé, antécédents)
    if (t.d.mex != null && A) {
      const rc = CR.seeded(t.sig + ":cv");
      const jCV = t.d.mex + int(rc, 12, 45);
      const e = A.g === "f" ? "e" : "";
      const ji = (CR.acteur && CR.acteur(t.ji)) || { nom: "le juge d'instruction" };
      const etudes = { populaire: ["Jusqu'en troisième. Après, un CAP que je n'ai pas fini.", "J'ai arrêté au lycée professionnel, en première."], moyen: ["Un baccalauréat professionnel.", "Le bac, puis un an de BTS."], aise: ["Une licence, à l'université.", "Une école de commerce."] }[A.mil] || ["Jusqu'au collège."];
      const casier = !A.casier ? "Jamais. C'est la première fois que j'ai affaire à la justice." : A.casier === 1 ? "Une fois. Une condamnation avec sursis, il y a quelques années." : `${A.casier === 2 ? "Deux" : "Plusieurs"} fois. Je ne le cache pas.`;
      const sante = t.f && t.f.psy === "aboli" ? "J'ai été hospitalisé" + e + " deux fois en psychiatrie avant les faits. J'avais un traitement." : t.f && t.f.psy === "altere" ? "Je voyais un psychiatre. J'avais arrêté mon traitement." : pk(rc, ["Rien de particulier.", "Je fume, c'est tout.", "Je bois un peu trop, le week-end. Je le reconnais."]);
      const Q = [
        ["Où êtes-vous né" + e + " ? Comment s'est passée votre enfance ?", `Je suis né${e} ${A.naissance || "en région parisienne"}. ${pk(rc, ["Mes parents se sont séparés quand j'avais huit ans.", "Une enfance normale, avec mes frères et sœurs.", "J'ai été élevé" + e + " surtout par " + (A.proche || "ma mère").replace(/^s(a|on) /, "m$1 ") + "."])}`],
        ["Quelle scolarité avez-vous suivie ?", pk(rc, etudes)],
        ["Quel est votre parcours professionnel ?", A.emploi ? `Je suis ${A.metier || "salarié" + e}. Je gagne environ ${A.revenu || 1400} euros par mois.` : `Je n'ai pas de travail en ce moment.${A.metier ? ` J'ai été ${A.metier}.` : ""} Je fais des missions d'intérim quand j'en trouve.`],
        ["Où vivez-vous, et avec qui ?", A.heberg ? `${A.adresse || "À Paris"}. ${A.enfants ? `Avec mes enfants, ${A.enfants === 1 ? "j'en ai un" : `j'en ai ${A.enfants}`}.` : "Seul" + e + ", ou chez " + (A.proche || "ma famille").replace(/^s(a|on) /, "m$1 ") + "."}` : "Je n'ai pas d'adresse fixe. Je dors chez des amis."],
        ["Avez-vous des problèmes de santé, des addictions ?", sante],
        ["Avez-vous déjà été condamné" + e + " ?", casier],
        ["Quels sont vos projets ?", pk(rc, ["Reprendre mon travail. M'occuper de ma famille.", "Me soigner. Et trouver une formation.", "Je ne sais pas. J'attends de savoir ce qui va se passer."])],
      ];
      PZ.jours = Object.assign(PZ.jours || {}, { interro_cv: jCV });
      add("interro_cv", "Interrogatoire de curriculum vitae", INS, () => ({ title: "Procès-verbal d'interrogatoire de curriculum vitae", kind: "pv", entete: [`Cabinet de ${ji.nom}, juge d'instruction`, `Information n° ${t.ninfo}`, `Cote ${cotes.interro_cv}`], paras: [[`Le ${DOCS.date(jCV)}, en notre cabinet, comparaît ${n(A)}, personne mise en examen, assisté${e} de son avocat, convoqué régulièrement. Interrogé${e} sur sa personnalité et sa situation (art. 81, al. 6, du code de procédure pénale) :`]].concat(Q.map(([q, a]) => [`Question : ${q} — Réponse : ${a}`]), [["Lecture faite, persiste et signe avec nous et le greffier."]]) }));
    }

    // 12. les sous-dossiers (pratique des greffes, inventaires d'archives des dossiers d'assises) : fond (D), personnalité (B),
    // détention (C). Chaque pièce garde sa place dans l'ordre du dossier ; les cotes se lisent au rendu des pièces.
    K.recoter(PZ);
    return PZ;
  };

  const ancien = GEN2.piecesCrim;
  GEN2.piecesCrim = function (t, N) { const PZ = ancien.apply(this, arguments); try { return K.off ? PZ : K.ajouter(t, N, PZ); } catch (e) { console.error(e); return PZ; } };
  GEN2.piecesCrim.complete = true;
})();
