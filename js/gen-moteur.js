/* La Permanence — moteur génératif (feuille de route, n° 7 : variété ; phase 1 : les délits).
   Une affaire est une combinaison cohérente tirée à partir de la graine : infraction et circonstances, contexte, auteur et victime
   (âge, métier, casier, entourage), preuves, déroulé de l'enquête (flagrance ou préliminaire, garde à vue ou audition libre),
   irrégularités possibles, incohérences, voie de poursuite et juridiction, camp du joueur.
   GEN2.tirer(graine, genre, options) rend un tirage sérialisable (t) ; la qualification vient du catalogue (CR.CAT),
   jamais écrite à la main ; GEN2.verifier(t) contrôle sa cohérence (tests/tgen.js). */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const M = CR.MONDE;
  const GEN2 = (CR.GEN2 = {});
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const ch = (r, p) => r() < p;

  // ------------------------------------------------------------------ Genres d'affaires générées
  // gav : permanence de garde à vue ; ci : permanence de comparution immédiate ; al : client convoqué en audition libre ;
  // op : client qui a reçu une ordonnance pénale ; copj : client convoqué devant le tribunal ; pc : victime (partie civile)
  GEN2.GENRES = {
    gav: { camp: "defense", fam: { personnes: 30, biens: 27, stups: 15, route: 9, autorite: 14, affaires: 2, numerique: 3 } },
    ci: { camp: "defense", fam: { personnes: 33, biens: 30, stups: 20, route: 4, autorite: 13 } },
    al: { camp: "defense", fam: { personnes: 26, biens: 18, stups: 4, route: 16, autorite: 2, affaires: 18, numerique: 16 } },
    op: { camp: "defense", fam: { route: 60, biens: 25, stups: 15 } },
    copj: { camp: "defense", fam: { personnes: 30, biens: 24, stups: 10, route: 16, autorite: 8, affaires: 7, numerique: 5 } },
    pc: { camp: "pc", fam: { personnes: 55, biens: 27, route: 14, numerique: 4, affaires: 2 } },
  };
  // Fréquence relative dans sa famille (la réalité d'une permanence parisienne, grossièrement)
  GEN2.FREQ = {
    violences: 10, violences_conj: 8, harcelement_moral: 4, cyberharcelement: 2, harcelement_sexuel: 2, menaces: 4, appels_malveillants: 1.5, violation_domicile: 1.5,
    vol: 10, cambriolage: 4, recel: 4, escroquerie: 4, abus_confiance: 2.5, extorsion: 2, degradations: 4, incendie: 1.5,
    stups_usage: 4, stups_detention: 4, stups_trafic: 5,
    alcool: 8, stups_volant: 4, defaut_permis: 4, refus_obtemperer: 3, delit_fuite: 2, blessures_routieres: 2.5, homicide_routier: 1,
    outrage: 3, rebellion: 4, violences_pdap: 3,
    abs: 2, blanchiment: 1.5, corruption: 1, fraude_fiscale: 1, faux_usage: 2.5,
    acces_frauduleux: 2, usurpation_identite: 2,
  };
  Object.assign(GEN2.FREQ, CAT.LOT2_FREQ || {}); // lot 2 (cat-lot2.js)
  // Part des femmes parmi les auteurs, par infraction (défaut 0,2)
  const PF_AUTEUR = { violences_conj: 0.08, harcelement_sexuel: 0.05, escroquerie: 0.3, abus_confiance: 0.4, vol: 0.28, faux_usage: 0.35, fraude_fiscale: 0.25, abs: 0.2, recel: 0.15, stups_trafic: 0.06, usurpation_identite: 0.3 };
  const AGES = { affaires: [30, 64], route: [19, 70], numerique: [19, 45], stups: [18, 40] };

  // ------------------------------------------------------------------ Irrégularités que le moteur sait glisser dans les pièces
  // regime : CR.IRREG ; mesure : « gav » ou « al » requise ; genres : où elles peuvent apparaître ; annule : pièces du calcul
  GEN2.IRR = {
    gav_notif: { regime: "gav_notif_tardive", mesure: "gav", annule: ["aveux"], p: 0.3 },
    interprete: { regime: "interprete_absent", mesure: "gav", annule: ["aveux"], p: 0.1, flagrance: true },
    avis_parquet: { regime: "gav_avis_parquet_tardif", mesure: "gav", annule: ["aveux"], p: 0.1 },
    heures: { regime: "pv_heure_incoherente", mesure: "gav", annule: ["aveux"], p: 0.12, flagrance: true },
    sans_avocat: { regime: "gav_audition_sans_avocat", mesure: "gav", annule: ["aveux"], p: 0.12, genres: ["ci", "copj"] },
    prolongation: { regime: "gav_prolongation_tardive", mesure: "gav", annule: ["aveux"], p: 0.1, genres: ["ci"] },
    al_quitter: { regime: "al_droit_quitter", mesure: "al", annule: ["aveux"], p: 0.3, genres: ["copj", "al"] },
    controle_identite: { regime: "controle_identite_irregulier", annule: ["constat", "saisie"], p: 0.22, flagrance: true },
    fouille: { regime: "fouille_irreguliere", annule: ["saisie"], p: 0.18, flagrance: true, preuve: "saisie" },
    perq_assentiment: { regime: "perquisition_assentiment", annule: ["saisie"], p: 0.25, preliminaire: true, preuve: "saisie" },
    perq_nuit: { regime: "perquisition_nuit", annule: ["saisie"], p: 0.15, preuve: "saisie" },
    geoloc: { regime: "geolocalisation_sans_autorisation", annule: ["telephonie"], p: 0.2, preliminaire: true, preuve: "telephonie" },
    requisition: { regime: "requisition_sans_autorisation", annule: ["telephonie", "releve"], p: 0.18, preliminaire: true, preuve: ["telephonie", "releve"] },
    ethylo: { regime: "ethylometre_verif", annule: ["ethylo"], p: 0.3, preuve: "ethylo" },
    notif_permis: null, // une question de fond (connaissance de la suspension), traitée comme un doute
  };
  // Doutes : des éléments à décharge à trouver dans les pièces et à plaider
  GEN2.DOUTES = {
    doute_ident: { infs: ["violences", "vol", "rebellion", "delit_fuite", "incendie", "cambriolage", "degradations", "extorsion", "violences_pdap"], p: 0.3 },
    temoin_contra: { infs: ["violences", "violences_pdap", "rebellion", "outrage", "vol"], p: 0.25 },
    legitime_defense: { infs: ["violences"], p: 0.15 },
    alibi_tel: { infs: ["cambriolage", "escroquerie", "incendie", "extorsion", "acces_frauduleux"], p: 0.2 },
    notif_permis: { infs: ["defaut_permis"], p: 0.45, cond: (t) => t.f.sc !== "jamais" },
  };

  // ------------------------------------------------------------------ Choix de l'infraction
  function choisirInfraction(r, genre, o) {
    const G = GEN2.GENRES[genre];
    const parFam = {};
    for (const id of CAT.ORDRE) {
      const I = CAT.INF[id];
      if (o && o.inf && o.inf !== id) continue;
      if (!G.fam[I.fam] || I.secondaire || (I.genres && !I.genres.includes(genre))) continue;
      if (genre === "op" && !I.op) continue;
      if (genre === "ci" && (I.pasCI || !(I.voies.ci > 0))) continue;
      if (genre === "pc" && I.victime !== "personne" && !I.victimeDe) continue;
      if ((genre === "gav" || genre === "ci") && !(I.mesures.gav > 0)) continue;
      if (genre === "al" && !(I.mesures.al > 0)) continue;
      (parFam[I.fam] = parFam[I.fam] || {})[id] = GEN2.FREQ[id] || 1;
    }
    // la famille d'abord (sa part dans ce genre d'affaires), puis l'infraction (sa fréquence dans la famille)
    const fam = CAT.poids(r, Object.fromEntries(Object.keys(parFam).map((f) => [f, G.fam[f]])));
    return fam ? CAT.poids(r, parFam[fam]) : null;
  }
  const victimeDe = (I, f) => (I.victimeDe ? I.victimeDe(f) : I.victime);

  // ------------------------------------------------------------------ Tirage d'une affaire
  // o : { day (jour de partie), night, inf (imposer une infraction), sigs (Set des signatures déjà tirées dans la partie) }
  GEN2.tirer = function (seed, genre, o = {}) {
    const day = o.day || 0;
    for (let k = 0; k < 60; k++) {
      const r = CR.seeded(seed + (k ? "~" + k : ""));
      const t = tirer1(r, genre, day, Object.assign({}, o, { _graine: seed + (k ? "~" + k : "") }));
      if (!t) continue;
      t.sig = GEN2.signature(t);
      if (o.sigs && (o.sigs.has(t.sig) || o.sigs.has(CR.hash(t.sig)))) continue;
      t.essai = k;
      // phase 3 : une graine de code (« v3:copj:120:66:517 ») donne son code d'affaire
      const mc = /^v(\d+):(\w+):(\d+):(\d+):(\d+)$/.exec(seed);
      if (mc && !o.camp) t.code = GEN2.encoderCode({ v: +mc[1], genre: mc[2], day: +mc[3], slot: +mc[4], n: +mc[5], lie: false });
      return t;
    }
    throw new Error("Aucune affaire cohérente tirée pour la graine " + seed + " (" + genre + ")");
  };

  function tirer1(r, genre, day, o) {
    if (genre === "info") return GEN2.tirerInfo(r, day, o);
    const G = GEN2.GENRES[genre];
    const inf = choisirInfraction(r, genre, o);
    if (!inf) return null;
    let I = CAT.INF[inf];
    const f0 = I.tirer(r);
    // n° 12 : un second fil de hasard, propre au tirage, pour ne rien changer à la suite des affaires d'avant
    const r12 = CR.seeded((o._graine || "graine") + ":n12");
    // phase 3 : un troisième fil, pour le lieu des faits, les domiciles, les milieux et les personnages autonomes
    const r3 = CR.seeded((o._graine || "graine") + ":p3");
    const LX = M.tirerLieux(r3, { genre, fam: I.fam });
    GEN2.ajusterMontant(inf, f0, LX.milV);
    // fraude fiscale jugée : l'origine des poursuites (dénonciation, plainte après avis de la commission, ou rien)
    if (inf === "fraude_fiscale" && genre === "copj") f0.plainte = CAT.poids(r12, { denonciation: 0.45, ciff: 0.3, aucune: 0.25 });
    // concours : d'autres infractions dans la même scène (vol, violences et rébellion ; trafic et arme ; escroquerie et faux…)
    const CC = CAT.tirerConcours(r12, inf, f0, genre);
    const f = CC ? CC.f : f0;
    // variantes d'une fiche (lot 1 du programme) : preuves, mesures, victime propres à la scène tirée
    I = CAT.ficheDe(I, f);
    if (I.pasGenres && I.pasGenres.includes(genre)) return null;
    let q = CAT.qualifier(inf, f);
    if (!q) return null;
    const vt = victimeDe(I, f);
    // enquête : flagrance ou préliminaire ; mesure : garde à vue, audition libre ou simple convocation
    const pf = I.flagranceDe ? I.flagranceDe(f) : I.flagrance;
    const flagrance = genre === "gav" || genre === "ci" ? ch(r, pf) || (genre === "ci" && pf > 0.3) : ch(r, pf);
    const mt = CAT.poids(r, I.mesures);
    let mesure = genre === "gav" || genre === "ci" ? "gav" : genre === "al" ? "al" : mt === "gav" ? "gav" : mt === "al" ? "al" : "aucune";
    if (mesure === "gav" && !CAT.gavPossible(q)) { if (genre === "gav" || genre === "ci") return null; mesure = "al"; }
    if (mesure === "aucune" && genre === "copj" && q.nature === "delit") mesure = "al";
    // contraintes juridiques par genre
    if (genre === "ci" && !CAT.ciPossible(q, flagrance)) return null;
    if (genre === "op" && !CAT.opPossible(q)) return null;
    if (genre === "al" && q.nature !== "delit") return null;
    if (genre === "pc" && vt !== "personne") return null;
    if (genre === "gav" && q.nature !== "delit") return null;
    // personnes
    const ages = AGES[I.fam] || [19, 52];
    // au sein du couple, les récits de cette phase sont écrits pour un auteur et une victime de sexes différents
    const conjugal = I.conjugal || I.sexes || (f.agg || []).some((a) => a === "conjoint" || a === "ex_conjoint");
    const A = M.personne(r, { pf: conjugal ? 0 : PF_AUTEUR[inf] != null ? PF_AUTEUR[inf] : 0.2, minAge: ages[0], maxAge: ages[1], lieu: LX.A.id, milieu: LX.milA });
    const mi = I.metierAuteur ? I.metierAuteur(f, A) : null;
    if (mi) { A.metier = mi; A.emploi = true; }
    if (genre === "op" || genre === "copj" || genre === "al") { A.heberg = true; if (I.fam === "affaires" && !mi) { A.emploi = true; A.metier = A.g === "f" ? pk(r, ["gérante de société", "commerçante", "consultante"]) : pk(r, ["gérant de société", "commerçant", "consultant", "entrepreneur du bâtiment"]); } }
    let V = null;
    if (vt === "agent") { V = M.agent(r, (f.agg || []).includes("msp") || f.cible === "msp", LX.V.id); const ma = I.metierVictime ? I.metierVictime(f, V) : null; if (ma) V.metier = ma; }
    else if (vt === "personne" || vt === "commerce") {
      const vO = { minAge: 19, maxAge: 70, casier: 0, lieu: (conjugal ? LX.A : vt === "commerce" ? LX.F : LX.V).id, milieu: conjugal ? LX.milA : LX.milV };
      if (conjugal) { vO.g = "f"; vO.minAge = Math.max(18, A.age - 8); vO.maxAge = A.age + 6; }
      if (I.sexes) vO.g = I.sexes.V;
      if ((f.agg || []).includes("vulnerable") || I.victimeAgee) { vO.minAge = 74; vO.maxAge = 93; }
      if (vt === "commerce") { vO.minAge = 28; vO.maxAge = 60; }
      V = M.personne(r, vO);
      if (vO.minAge >= 74) { V.metier = V.g === "f" ? "retraitée" : "retraité"; V.emploi = false; }
      const mv = I.metierVictime ? I.metierVictime(f, V) : null;
      if (mv) { V.metier = mv; V.emploi = true; }
      if (vt === "commerce") { V.metier = V.g === "f" ? "gérante du commerce" : "gérant du commerce"; V.emploi = true; }
    }
    if (V && A.nom === V.nom) V.nom = pk(r, M.NOMS.filter((n) => n !== A.nom));
    const T0 = M.personne(r, { pf: 0.45, minAge: 20, maxAge: 75, casier: 0, lieu: LX.T.id, milieu: LX.milT });
    const T = { prenom: T0.prenom, nom: T0.nom, g: T0.g, age: T0.age, metier: T0.metier, adresse: T0.adresse };
    let P = null;
    if (I.deces && V) {
      // le proche qui se constitue partie civile : un enfant, un parent ou le conjoint de la victime décédée
      const rel = V.age > 55 ? pk(r, ["enfant", "conjoint"]) : V.age < 32 ? pk(r, ["parent", "parent", "fratrie"]) : pk(r, ["conjoint", "parent", "fratrie"]);
      const pg = rel === "conjoint" ? (V.g === "f" ? "m" : "f") : ch(r, 0.5) ? "f" : "m";
      const ages = { enfant: [Math.max(20, V.age - 38), V.age - 20], parent: [V.age + 20, Math.min(85, V.age + 35)], conjoint: [Math.max(19, V.age - 6), V.age + 6], fratrie: [Math.max(18, V.age - 8), V.age + 8] }[rel];
      P = Object.assign(M.personne(r, { g: pg, minAge: ages[0], maxAge: Math.max(ages[0], ages[1]), casier: 0, lieu: V.sect, milieu: V.mil }), { nom: V.nom, rel });
      P.lien = { enfant: pg === "f" ? "sa fille" : "son fils", parent: pg === "f" ? "sa mère" : "son père", conjoint: pg === "f" ? "son épouse" : "son mari", fratrie: pg === "f" ? "sa sœur" : "son frère" }[rel];
      P.dit = { enfant: V.g === "f" ? "ma mère" : "mon père", parent: V.g === "f" ? "ma fille" : "mon fils", conjoint: V.g === "f" ? "ma femme" : "mon mari", fratrie: V.g === "f" ? "ma sœur" : "mon frère" }[rel];
    }
    // la famille que raconte le récit se retrouve sur les fiches : l'enfant partie civile est l'enfant de la victime ;
    // des violences conjugales devant un enfant, ou une dispute sur la garde, supposent des enfants au couple
    const parent = (Q, n) => { if (Q && Q.age >= 18 && !(Q.enfants > 0)) Q.enfants = n || 1; };
    if (V && P && P.rel === "enfant") parent(V);
    // les fiches de famille (pension, droit de visite, abus de faiblesse signalé par un enfant) supposent des enfants
    if (V && I.parents) { parent(V); if (conjugal) parent(A, V.enfants); }
    if (V && conjugal && ((f.agg || []).includes("mineur_present") || (inf === "violences_conj" && f.mobile === 5))) { parent(V); parent(A, V.enfants); }
    // récidive légale : tirée plus bas, une fois la date des faits connue (antécédent, état légal, erreur possible du parquet)
    if (genre === "pc" || genre === "op") A.casier = Math.min(A.casier, 1);
    let rec = false;
    // la personne étrangère qui comprend mal le français (irrégularité possible : l'interprète)
    const etranger = mesure === "gav" && genre !== "pc" && ch(r, 0.14) ? pk(r, M.LANGUES) : null;
    if (etranger) A.etranger = etranger;
    // posture de l'auteur
    const forts = ["constat", "video", "adn", "saisie", "ethylo", "fichier", "labo", "ecrits", "releve"];
    const preuves = [];
    for (const [k, p] of Object.entries(I.preuves || {})) {
      if (k === "constat" && !flagrance) continue;
      if (k === "plainte" && !V) continue;
      if (k === "aveux") continue;
      if (k === "ethylo" && f.refus) continue;
      if (k === "certificat" && !f.itt && !I.violences) continue;
      if (ch(r, p)) preuves.push(k);
    }
    if (V && vt !== "agent" && !preuves.includes("plainte")) preuves.unshift("plainte");
    if (flagrance && I.preuves.constat && !preuves.includes("constat")) preuves.unshift("constat");
    if (I.preuves.certificat && f.itt != null && (f.itt > 0 || I.violences) && !preuves.includes("certificat")) preuves.push("certificat");
    if (I.preuves.ethylo && !f.refus && !preuves.includes("ethylo")) preuves.push("ethylo");
    if (preuves.filter((x) => forts.includes(x)).length === 0) { const fx = Object.keys(I.preuves).filter((x) => forts.includes(x) && (x !== "constat" || flagrance)); if (fx.length) preuves.push(pk(r, fx)); }
    if (preuves.length < 2) { const reste = Object.keys(I.preuves).filter((x) => !preuves.includes(x) && x !== "aveux" && (x !== "constat" || flagrance) && (x !== "plainte" || V)); if (reste.length) preuves.push(pk(r, reste)); }
    if (f.refus && preuves.includes("ethylo")) preuves.splice(preuves.indexOf("ethylo"), 1);
    const nForts = preuves.filter((x) => forts.includes(x)).length;
    const stance = CAT.poids(r, nForts >= 2 ? { nie: 0.2, minimise: 0.45, reconnait: 0.35 } : { nie: 0.45, minimise: 0.35, reconnait: 0.2 });
    if (CC && CC.conc.some((c) => c.inf === "arme_b") && !preuves.includes("saisie")) preuves.push("saisie");
    if (mesure !== "aucune") preuves.push("aveux");
    // irrégularités
    const irr = [];
    if (genre !== "pc") {
      const cands = Object.entries(GEN2.IRR).filter(([id, x]) => x && (!x.mesure || x.mesure === mesure) && (!x.genres || x.genres.includes(genre))
        && (!x.flagrance || flagrance) && (!x.preliminaire || !flagrance) && (!x.preuve || [].concat(x.preuve).some((pp) => preuves.includes(pp)))
        && (id !== "interprete" || etranger) && (id !== "controle_identite" || !I.controle || I.controle(f)) && (!["controle_identite", "fouille", "perq_assentiment", "perq_nuit", "geoloc", "requisition", "ethylo"].includes(id) || I.irr.includes(id))
        && (id !== "heures" || I.irr.includes("heures") || mesure === "gav"));
      // la personne qui comprend mal le français : l'absence d'interprète est l'une des nullités les plus fréquentes
      if (etranger && flagrance && ch(r, 0.5)) { irr.push("interprete"); cands.splice(cands.findIndex(([id]) => id === "interprete"), 1); }
      const nb = irr.length ? (ch(r, 0.15) ? 1 : 0) : ch(r, 0.46) ? (ch(r, 0.18) ? 2 : 1) : 0;
      for (let i = 0; i < nb && cands.length; i++) {
        const tot = cands.reduce((a, [, x]) => a + x.p, 0);
        let x = r() * tot;
        let idx = 0;
        for (; idx < cands.length; idx++) { x -= cands[idx][1].p; if (x < 0) break; }
        const [id] = cands.splice(Math.min(idx, cands.length - 1), 1)[0];
        if (id === "interprete" && irr.includes("gav_notif")) continue;
        if (id === "gav_notif" && irr.includes("interprete")) continue;
        irr.push(id);
      }
    }
    // doutes et requalification
    const doutes = [];
    for (const [id, d] of Object.entries(GEN2.DOUTES)) if (d.infs.includes(inf) && (!d.cond || d.cond({ f })) && !(I.sansDoutes && I.sansDoutes.includes(id)) && ch(r, d.p) && doutes.length < 2) doutes.push(id);
    if (doutes.includes("legitime_defense") && stance === "reconnait") doutes.splice(doutes.indexOf("legitime_defense"), 1);
    let rq = I.requalif ? I.requalif(r, f) : null;
    let q2 = null;
    if (rq) q2 = CAT.qualifier(rq.inf2 || inf, rq.f2);
    // une requalification n'a d'intérêt que si elle allège la peine encourue ou change la nature de l'infraction
    if (q2 && !(q2.prison < q.prison || (q2.prison === q.prison && q2.amende < q.amende) || q2.nature !== q.nature)) { q2 = null; rq = null; }
    // une caméra privée sur les lieux (la défense peut demander les images avant leur effacement)
    const camera = flagrance && (genre === "gav" || genre === "ci") && ch(r, I.camera || 0);
    const videoDoute = camera && ch(r, 0.6);
    // dates (jours de partie), heure des faits
    const d = {};
    const hf = CAT.heure(r, I.fam === "affaires" || I.fam === "numerique" ? [[9 * 60, 19 * 60]] : [[8 * 60, 12 * 60], [14 * 60, 19 * 60], [19 * 60, 23 * 60 + 50], [0, 4 * 60 + 30]]);
    d.h = hf;
    if (genre === "gav") {
      d.debut = o.night ? int(r, 22 * 60, 23 * 60 + 40) - 1440 : (o.min || 11 * 60) - int(r, 60, 150);
      d.faits = day + (d.debut < 0 ? -1 : 0);
      d.h = ((d.debut - int(r, 5, 25)) % 1440 + 1440) % 1440;
    } else if (genre === "ci") {
      d.faits = day - 1; d.debut = int(r, 7 * 60, 22 * 60) - 1440; d.h = ((d.debut - int(r, 5, 25)) % 1440 + 1440) % 1440;
    }
    // enquête préliminaire : les faits et la plainte sont antérieurs, la garde à vue vient au bout de l'enquête
    if ((genre === "gav" || genre === "ci") && !flagrance) { d.faits -= int(r, 6, 70); d.plainte = d.faits + int(r, 0, 3); d.h = CAT.heure(r, [[9 * 60, 19 * 60], [19 * 60, 23 * 60]]); } else if (genre === "al") {
      d.faits = day - int(r, 8, 160); d.plainte = d.faits + int(r, 0, 6); d.audition = CR.rollForward(day + int(r, 3, 9));
    } else if (genre === "op") {
      let notif = day - int(r, 6, 38); while (!CR.isBusinessDay(notif)) notif--;
      d.notif = notif; d.faits = notif - int(r, 30, 75);
    } else if (genre === "copj") {
      d.faits = day - int(r, 15, 200);
      d.mesure = flagrance ? d.faits : d.faits + int(r, 10, 90);
      if (d.mesure > day - 6) d.mesure = day - 6;
      let aud = Math.max(d.mesure + 30, day + int(r, 18, 70));
      aud = CR.rollForward(aud);
      while (CR.dow(aud) !== (q.nature === "contravention" ? 4 : 2) || !CR.isBusinessDay(aud)) aud++;
      d.audience = aud; d.convoc = d.mesure;
    } else if (genre === "pc") {
      // un classement sans suite se conçoit pour une contravention ou un délit simple, pas pour des blessures graves
      const classable = q.nature === "contravention" || (q.prison <= 36 && !["blessures_routieres", "homicide_routier", "violences_conj"].includes(inf));
      const classe = classable && (q.nature === "contravention" ? ch(r, 0.75) : ch(r, 0.35));
      d.voiePc = classe ? "classe" : "convoque";
      if (classe) {
        const maxAge = q.nature === "contravention" ? 300 : 900;
        d.faits = day - int(r, 40, maxAge);
        d.acte = d.faits + int(r, 8, 45);
        d.classement = d.acte + int(r, 20, 90);
        if (d.classement > day - 3) d.classement = day - 3;
        if (d.acte >= d.classement) d.acte = d.classement - 5;
      } else {
        d.faits = day - int(r, 20, 160);
        d.mesure = d.faits + (flagrance ? 0 : int(r, 7, 40));
        if (d.mesure > day - 5) d.mesure = day - 5;
        let aud = Math.max(d.mesure + 30, day + int(r, 20, 75));
        aud = CR.rollForward(aud);
        while (CR.dow(aud) !== (q.nature === "contravention" ? 4 : 2) || !CR.isBusinessDay(aud)) aud++;
        d.audience = aud;
      }
    }
    // n° 12 : antécédent, récidive (ou réitération, ou concours avec une condamnation pas encore définitive), concours, personne morale
    const N12 = GEN2.tirerN12(r12, { genre, inf, f, q, q2, A, d, day, flagrance, conc: CC ? CC.conc : null, scenario: CC ? CC.scenario : null, LX });
    q = N12.q; q2 = N12.q2; rec = N12.rec;
    // voie de poursuite prévue et juridiction
    let voie;
    if (genre === "ci") voie = "ci";
    else if (genre === "op") voie = "op";
    else if (genre === "copj") voie = q.nature === "contravention" ? "citation_parquet" : flagrance && mesure === "gav" && ch(r, 0.3) ? "cppv" : "copj";
    else if (genre === "pc") voie = d.voiePc === "classe" ? "citation_directe" : q.nature === "contravention" ? "citation_parquet" : "copj";
    else voie = GEN2.voieParquet(r, inf, q, flagrance, A, preuves);
    const jur = voie === "ci" ? "ci" : q.jur;
    const pres = GEN2.president(inf, q, jur);
    if (irr.includes("prolongation")) d.debut = int(r, 6 * 60, 9 * 60) - 1440;
    const t = {
      v: 2, genre, inf, day, min: o.min != null ? o.min : null, f, q, q2, f2: rq ? rq.f2 : null, inf2: rq ? rq.inf2 || null : null, quoi: rq ? rq.quoi : null,
      rec, A, V, T, P, client: genre === "pc" ? (P ? "P" : "V") : "A",
      flagrance, enq: flagrance ? "flagrance" : "preliminaire", mesure, preuves, stance, irr, doutes, camera, videoDoute,
      voie, jur, pres, d, rue: pk(r, LX.F.rues), sc: f.sc || null,
      opj: pk(r, ["opj_marchetti", "opj_rocher", "opj_benali"]), parquet: pk(r, ["pq_delahaye", "pq_haddou", "pq_riboulet"]),
      erreurPV: ch(r, 0.55), proc: `2026/${GEN2.codeSecteur(LX.F)}/${String(int(r, 1000, 9999))}`, gpx: [M.gpx(r), M.gpx(r)],
    };
    for (const k of ["ant", "recid", "conc", "enc", "scenario", "PM", "R", "deleg", "presc", "pnf", "cjip", "dirigeantPoursuivi"]) if (N12[k] != null) t[k] = N12[k];
    if (N12.R) t.client = "R";
    GEN2.finP3(r3, t, LX);
    return t;
  }

  // ------------------------------------------------------------------ N° 12 : antécédent, récidive, concours, personne morale
  // o : { genre, inf, f, q, q2, A, d, day, flagrance, conc, scenario }. Tout est tiré sur r (le fil propre au n° 12).
  // A.casier : 0 vierge ; 1 une ancienne condamnation (réitération) ; 2 une condamnation récente : récidive, ou récidive que le
  // parquet retient à tort (vice : première condamnation pas définitive, délai dépassé, délits ni identiques ni assimilés).
  GEN2.VICES = {
    non_definitive: "La première condamnation n'était pas définitive au jour des nouveaux faits",
    delai: "Le délai de la récidive était dépassé",
    non_assimilee: "Les deux délits ne sont ni identiques ni assimilés",
  };
  GEN2.PM_INFS = { accident_travail: () => true, corruption: (f) => !f.passif, fraude_fiscale: (f) => f.sc !== "independant" };
  const SOCIETES = {
    corruption: { urbanisme: "SAS Promotion Montmartre Habitat", controle: "SARL Le Comptoir Ordener", achats: "SAS Saveurs du Nord Distribution", chantier: "SAS Sous-traitance Bâtiment 93" },
    fraude_fiscale: { restaurant: "SARL Le Bistrot Lamarck", btp: "SARL Rénov'Habitat 18" },
  };
  // jour où une décision devient définitive faute d'appel (dix jours, art. 498 ; report au jour ouvrable, art. 801)
  const definitive = (jug) => CR.rollForward(jug + 10) + 1;
  GEN2.tirerAntecedent = function (r, o) {
    const { A, inf, q, d, day, genre } = o;
    const faits = d.faits;
    if (!A || !A.casier) return { ant: null, vice: null };
    const mk = (base, x) => Object.assign({ inf: base.inf, label: base.label, art: base.art, prison: base.prison || 0, nature: base.nature || "delit", classe: base.classe, violence: !!base.violence, juridiction: base.juridiction || pk(r, ["Tribunal correctionnel de Paris", "Tribunal correctionnel de Bobigny", "Tribunal correctionnel de Créteil"]) }, x);
    const majeur = (jug) => A.age - (faits - jug) / 365 >= 18.2;
    // une peine et ses dates : jug (jugement), def (définitive), fin (expiration de la peine : levée d'écrou, amende payée ;
    // pour un sursis non révoqué, la condamnation devenue définitive — approximation du jeu : le délai de récidive court de l'expiration ou de la prescription de la peine, Crim. 14 oct. 2014)
    const peine = (jug, kind) => {
      const def = definitive(jug);
      if (kind === "ferme") { const m = int(r, 4, 10); return { jug, def, fin: def + m * 30 + int(r, 5, 40), peine: { ferme: m, sursis: 0, amende: 0 } }; }
      if (kind === "amende") return { jug, def, fin: def + int(r, 30, 80), peine: { ferme: 0, sursis: 0, amende: int(r, 3, 15) * 100 } };
      return { jug, def, fin: def, peine: { ferme: 0, sursis: int(r, 3, 8), amende: 0 } };
    };
    // 1. une ancienne condamnation : celle de l'ancien bulletin (vol, usage de stupéfiants, conduite sans permis), une amende
    if (A.casier === 1) {
      const n = M.ansCasier(A, int(r, 7, 12));
      // une ancienne condamnation n'est jamais un premier terme de récidive : si elle est récente (personne jeune), un délit
      // sans rapport avec les nouveaux faits (ni identique ni assimilé)
      const nv1 = { inf, art: q.art, violence: CAT.avecViolences(inf, q) };
      const ok1 = ["vol", "usage", "sans_permis"].filter((k) => n >= 6 || !CAT.assimiles(CAT.ANT[k], nv1));
      const quoi = pk(r, ok1.length ? ok1 : ["usage"]);
      const jug = faits - n * 365 + int(r, 10, 90);
      if (M.casierMineur(A)) return { ant: mk(CAT.ANT[quoi === "sans_permis" ? "vol" : quoi], Object.assign({ mineur: true, juridiction: "Tribunal pour enfants de Paris", ansDit: n }, { jug, def: definitive(jug), fin: definitive(jug), peine: { mesure: "avertissement judiciaire" } })), vice: null };
      return { ant: mk(CAT.ANT[quoi], Object.assign({ ansDit: n }, peine(jug, "amende"), { peine: { ferme: 0, sursis: 0, amende: 300 } }, { fin: definitive(jug) + int(r, 30, 80) })), vice: null };
    }
    // 2. une condamnation récente (une personne de moins de vingt ans : le tribunal pour enfants, pas de récidive d'adulte)
    if (A.age < 19.6) { const jug = faits - int(r, 120, 400); return { ant: mk(CAT.ANT[pk(r, ["vol", "usage"])], { mineur: true, juridiction: "Tribunal pour enfants de Paris", jug, def: definitive(jug), fin: definitive(jug), peine: { mesure: "avertissement judiciaire" } }), vice: null }; }
    const nv = { inf, art: q.art, violence: CAT.avecViolences(inf, q) };
    const meme = CAT.antMeme(inf, q);
    if (q.nature === "contravention") {
      const c5 = Object.values(CAT.ANT).find((a) => a.nature === "contravention" && a.inf === inf && CAT.artBase(a.art) === CAT.artBase(q.art));
      if (q.classe === 5 && (CAT.INF[inf] || {}).recidive5 && c5) {
        const jug = faits - int(r, 130, 260);
        return { ant: mk(c5, Object.assign(peine(jug, "amende"), { juridiction: "Tribunal de police de Paris" })), vice: null };
      }
      const jug = faits - int(r, 150, 900);
      return { ant: mk(CAT.ANT[pk(r, ["vol", "usage", "degradations"])], peine(jug, pk(r, ["sursis", "amende"]))), vice: null };
    }
    if (q.nature !== "delit" || !q.recidivable) return { ant: null, vice: null };
    const recent = (min) => { const max = Math.max(min + 1, Math.min(1400, Math.floor((A.age - 18.3) * 365))); return faits - int(r, min, max); };
    const autres = Object.values(CAT.ANT).filter((a) => (a.nature || "delit") === "delit" && a.prison < 120 && a.inf !== inf && !CAT.assimiles(a, nv));
    const assim = Object.values(CAT.ANT).filter((a) => (a.nature || "delit") === "delit" && a.prison < 120 && a.inf !== inf && CAT.assimiles(a, nv));
    // le vice que le parquet ne voit pas (environ une récidive sur trois), s'il est possible
    const vices = [];
    vices.push("non_definitive");
    if (A.age >= 25 && q.prison < 120) vices.push("delai");
    if (autres.length) vices.push("non_assimilee");
    if (ch(r, 0.35)) {
      const vice = pk(r, vices);
      if (vice === "non_definitive") {
        const appel = genre === "copj" && day - faits >= 45 && ch(r, 0.6);
        if (appel) {
          const jug = faits - int(r, 40, 200);
          const da = jug + int(r, 2, 9);
          const arret = faits + int(r, 10, Math.max(11, day - faits - 25));
          return { ant: mk(meme, Object.assign(peine(jug, "sursis"), { appel: da, arret, def: CR.rollForward(arret + 5) + 1 }, { fin: CR.rollForward(arret + 5) + 1 })), vice };
        }
        const jug = faits - int(r, 2, 8);
        return { ant: mk(meme, peine(jug, "sursis")), vice };
      }
      if (vice === "delai") {
        const kind = pk(r, ["ferme", "amende"]);
        const fin = faits - 5 * 365 - int(r, 40, 600);
        const m = kind === "ferme" ? int(r, 4, 10) : 0;
        const jug = fin - (kind === "ferme" ? m * 30 + int(r, 20, 60) : int(r, 40, 90)) - 12;
        if (majeur(jug)) {
          const def = definitive(jug);
          return { ant: mk(ch(r, 0.5) || !assim.length ? meme : pk(r, assim), { jug, def, fin, peine: kind === "ferme" ? { ferme: m, sursis: 0, amende: 0 } : { ferme: 0, sursis: 0, amende: int(r, 3, 15) * 100 } }), vice };
        }
      } else {
        const jug = recent(150);
        return { ant: mk(pk(r, autres), peine(jug, pk(r, ["sursis", "sursis", "ferme", "amende"]))), vice };
      }
    }
    // la récidive est constituée : le même délit, un délit assimilé, ou après un délit puni de dix ans (art. 132-9)
    if (q.prison > 12 && ch(r, 0.15) && A.age >= 22) {
      const jug = faits - int(r, 500, Math.max(501, Math.min(1500, Math.floor((A.age - 18.5) * 365))));
      const m = int(r, 18, 30);
      const def = definitive(jug);
      const fin = Math.min(def + m * 30, faits - 40);
      return { ant: mk(CAT.ANT[pk(r, ["trafic", "detention"])], { jug, def, fin: Math.max(def, fin), peine: { ferme: m, sursis: 0, amende: 0 } }), vice: null };
    }
    const base = assim.length && ch(r, 0.35) ? pk(r, assim) : meme;
    return { ant: mk(base, peine(recent(120), pk(r, ["sursis", "sursis", "ferme", "amende"]))), vice: null };
  };

  GEN2.tirerN12 = function (r, o) {
    const { genre, inf, f, A, d, day } = o;
    const out = { q: o.q, q2: o.q2, rec: false };
    // 0. abus de biens sociaux anciens (avant l'antécédent : la date des faits change) : la prescription, à plaider
    //    (art. 9-1 CPP ; présentation des comptes, sauf dissimulation)
    if (genre === "copj" && inf === "abs" && ch(r, 0.55)) {
      const dissimule = ch(r, 0.5);
      const faits = day - int(r, 6 * 365 + 420, 8 * 365);
      const decouverte = day - int(r, 60, 200);
      d.faits = faits;
      d.mesure = Math.min(day - 6, decouverte + int(r, 20, 60));
      d.convoc = d.mesure;
      out.presc = { debut: faits - f.annees * 365 + int(r, 0, 60), faits, comptes: faits + int(r, 130, 175), dissimule, decouverte, poursuite: decouverte + int(r, 3, 15) };
    }
    // 1. l'antécédent et l'état légal
    const { ant, vice: vice0 } = GEN2.tirerAntecedent(r, o);
    if (ant) {
      out.ant = ant;
      const EL = CAT.etatLegal(ant, { inf, q: o.q, faits: d.faits });
      const valide = EL.etat === "recidive";
      // un vice n'existe que si le droit le confirme : sinon la récidive est simplement constituée, ou absente
      const vice = vice0 && !valide && EL.motif === vice0 ? vice0 : null;
      const parquet = valide || !!vice;
      out.recid = { etat: EL.etat, type: EL.type || null, art: EL.art || null, motif: EL.motif || null, valide, vice: vice || null, parquet, revocable: CAT.sursisRevocable(ant, d.faits) };
      if (parquet) {
        const R0 = valide ? EL : { type: "delictuelle", art: "132-10" };
        out.q = CAT.avecRecidive(o.q, R0);
        if (o.q2) out.q2 = CAT.avecRecidive(o.q2, R0);
        out.rec = !!out.q.recidive;
        if (!out.rec) out.recid.parquet = false;
      }
    }
    // 2. le concours : chaque infraction ajoutée, en récidive si elle-même en remplit les conditions (art. 132-5)
    if (o.conc) {
      out.scenario = o.scenario;
      out.conc = o.conc.map((c) => {
        let cq = c.q;
        let rc = false;
        if (ant && out.recid && out.recid.valide) { const E = CAT.etatLegal(ant, { inf: c.inf, q: c.q, faits: d.faits }); if (E.etat === "recidive") { cq = CAT.avecRecidive(c.q, E); rc = !!cq.recidive; } }
        return Object.assign({}, c, { q: cq, rec: rc });
      });
      out.enc = CAT.concours([out.q].concat(out.conc.map((c) => c.q)));
    }
    // 3. pénal des affaires (client convoqué devant le tribunal) : la société poursuivie, cliente ou non, et ce qui l'entoure
    const I = CAT.INF[inf];
    if (genre === "copj" && I.fam === "affaires") {
      if (GEN2.PM_INFS[inf] && GEN2.PM_INFS[inf](f) && (inf === "accident_travail" || ch(r, 0.7))) {
        const nom = inf === "accident_travail" ? f.soc : (SOCIETES[inf] || {})[f.sc] || "SAS Clignancourt Services";
        const ca = inf === "accident_travail" ? int(r, 30, 260) * 100000 : inf === "corruption" ? int(r, 40, 900) * 100000 : int(r, 6, 40) * 100000;
        out.PM = { morale: true, g: "f", nom, forme: nom.split(" ")[0], siege: o.LX ? `${int(r, 2, 90)}, ${pk(r, o.LX.F.rues)}, ${o.LX.F.cp} ${o.LX.F.ville}` : `${int(r, 2, 90)}, ${pk(r, M.RUES)}, 75018 Paris`, ca, effectif: Math.max(4, Math.round(ca / int(r, 90000, 160000))), rcs: `${int(r, 300, 999)} ${int(r, 100, 999)} ${int(r, 100, 999)} R.C.S. Paris` };
        // la délégation de pouvoirs en matière de sécurité (accident du travail)
        if (inf === "accident_travail") {
          const existe = ch(r, 0.8);
          const valide = existe && ch(r, 0.5);
          const manque = valide || !existe ? null : pk(r, ["competence", "autorite", "moyens"]);
          const D0 = M.personne(r, { minAge: 27, maxAge: 58, casier: 0, pf: 0.25, lieu: o.LX ? o.LX.F.id : undefined, milieu: o.LX ? "mixte" : undefined });
          out.deleg = { existe, competence: valide || (existe && manque !== "competence"), autorite: valide || (existe && manque !== "autorite"), moyens: valide || (existe && manque !== "moyens"), date: d.faits - int(r, 120, 900), qui: { prenom: D0.prenom, nom: D0.nom === A.nom ? "Lefèvre" : D0.nom, g: D0.g, age: D0.age, poste: { chute: "conducteur de travaux", machine: "chef d'atelier", tranchee: "chef de chantier" }[f.sc] } };
        }
        // la société cliente (représentée par une juriste ou un directeur financier muni d'un pouvoir), ou le dirigeant
        if (ch(r, 0.5)) {
          const R0 = M.personne(r, { minAge: 31, maxAge: 59, casier: 0, pf: 0.55, lieu: o.LX ? o.LX.F.id : undefined, milieu: o.LX ? "aise" : undefined });
          if (R0.nom === A.nom) R0.nom = pk(r, M.NOMS.filter((n) => n !== A.nom));
          R0.metier = pk(r, ["directeur juridique", "directeur administratif et financier"]);
          if (R0.g === "f") R0.metier = M.METIERS_F[R0.metier];
          R0.emploi = true; R0.heberg = true; R0.casier = 0;
          out.R = R0;
          out.dirigeantPoursuivi = !(out.deleg && CAT.delegationValide(out.deleg) && ch(r, 0.5));
        } else out.dirigeantPoursuivi = true;
        // convention judiciaire d'intérêt public proposée à la société cliente (avant toute poursuite)
        if (out.R && CAT.cjipPossible(inf, out.PM) && f.plainte !== "aucune" && ch(r, 0.6)) {
          const avantage = inf === "corruption" ? f.montant * int(r, 6, 14) : f.montant;
          const amende = Math.max(20000, Math.round(Math.min(CAT.cjipPlafond(ca), avantage * (inf === "corruption" ? 1.1 : 0.45)) / 10000) * 10000);
          out.cjip = { amende, programme: inf === "corruption", mois: inf === "corruption" ? 24 : 0, avantage, delaiReponse: int(r, 10, 15) };
        }
      }
      // parquet national financier pour les dossiers complexes (art. 705 CPP)
      if (CAT.pnfCompetent(inf, f) && ch(r, 0.8)) out.pnf = true;
    }
    return out;
  };

  // La récidive que la prévention retient : celle que le droit constate, ou celle que le parquet croit voir (art. 132-10)
  GEN2.recidiveRetenue = function (t) {
    if (!t.recid || !t.ant) return null;
    if (t.recid.valide) return CAT.etatLegal(t.ant, { inf: t.inf, q: CAT.qualifier(t.inf, t.f), faits: t.d.faits });
    return { type: "delictuelle", art: "132-10" };
  };
  // Contrôle du n° 12 (tests/tgen.js) : concours, récidive, personne morale, délégation, CJIP, prescription
  GEN2.verifierN12 = function (t, q0) {
    const pb = [];
    const sans = (x) => { const o = Object.assign({}, x); delete o.source; return JSON.stringify(o); };
    // concours : chaque infraction ajoutée qualifiée par le catalogue, le maximum par nature (art. 132-3 et 132-5)
    if (t.conc) {
      for (const c of t.conc) {
        const cq0 = CAT.qualifier(c.inf, c.f);
        const cq = c.rec ? CAT.avecRecidive(cq0, CAT.etatLegal(t.ant, { inf: c.inf, q: cq0, faits: t.d.faits })) : cq0;
        if (sans(cq) !== sans(c.q)) pb.push("concours : qualification ajoutée différente du catalogue (" + c.inf + ")");
        if (!CAT.CONC_RECIT[c.inf]) pb.push("concours : pas de récit pour " + c.inf);
        if (c.memeFait && !CAT.CUMUL[c.quoi]) pb.push("cumul de qualifications sans règle");
      }
      const qs = [t.q].concat(t.conc.map((c) => c.q));
      const cd = qs.filter((x) => x.nature !== "contravention");
      const max = cd.some((x) => x.perpetuite) ? CAT.PERPETUITE : Math.max(0, ...cd.map((x) => x.prison));
      const amax = Math.max(0, ...cd.map((x) => x.amende)) + qs.filter((x) => x.nature === "contravention").reduce((a, x) => a + x.amende, 0);
      if (!t.enc || t.enc.prison !== max || t.enc.amende !== amax) pb.push("concours : maximum encouru différent du plafond par nature");
      if (t.enc && cd.length > 1 && t.enc.prison >= cd.reduce((a, x) => a + x.prison, 0)) pb.push("concours : les maxima ont été additionnés");
    }
    // récidive : appliquée seulement si le droit la constate, ou si le parquet se trompe (vice tiré, visible au casier)
    if (t.recid) {
      const EL = CAT.etatLegal(t.ant, { inf: t.inf, q: q0, faits: t.d.faits });
      if ((EL.etat === "recidive") !== !!t.recid.valide) pb.push("récidive : état légal différent de celui du tirage");
      if (t.recid.vice && (t.recid.valide || EL.motif !== t.recid.vice)) pb.push("récidive erronée sans le vice annoncé");
      if (!!t.rec !== !!t.recid.parquet) pb.push("récidive : prévention et parquet ne concordent pas");
      if (t.rec && !t.recid.valide && !t.recid.vice) pb.push("récidive appliquée sans que ses conditions soient réunies");
      if (t.recid.valide && !t.rec && (q0.recidivable || q0.classe === 5)) pb.push("récidive constituée mais non retenue");
      if (t.ant.def != null && t.ant.jug != null && !(t.ant.def > t.ant.jug)) pb.push("antécédent : date définitive avant le jugement");
      if (!(t.ant.jug < t.d.faits)) pb.push("antécédent postérieur aux faits");
      if (!t.ant.mineur && t.A.age - (t.d.faits - t.ant.jug) / 365 < 18) pb.push("antécédent : condamné mineur devant le tribunal correctionnel");
    }
    // personne morale : amende quintuplée ; délégation ; CJIP ; prescription des infractions dissimulées
    if (t.PM) {
      const qpm = CAT.pourPersonneMorale(t.q);
      if (qpm.amende !== (t.q.nature === "crime" && !t.q.amende ? 1000000 : t.q.amende * 5) || qpm.prison !== 0) pb.push("personne morale : amende non quintuplée");
      if (t.client === "R" && !t.R) pb.push("société cliente sans représentant");
      if (t.R && t.R.nom === t.A.nom) pb.push("représentant homonyme du dirigeant");
    }
    if (t.deleg && t.deleg.existe && (CAT.delegationValide(t.deleg) !== (t.deleg.competence && t.deleg.autorite && t.deleg.moyens))) pb.push("délégation de pouvoirs incohérente");
    if (t.dirigeantPoursuivi === false && !(t.R && CAT.delegationValide(t.deleg))) pb.push("dirigeant écarté sans délégation valable");
    if (t.cjip) {
      if (!t.R || !CAT.cjipPossible(t.inf, t.PM)) pb.push("CJIP hors de son champ (art. 41-1-2)");
      if (t.cjip.amende > CAT.cjipPlafond(t.PM.ca)) pb.push("CJIP au-delà de 30 % du chiffre d'affaires");
      if (t.f.plainte === "aucune") pb.push("CJIP pour une fraude fiscale sans plainte de l'administration");
    }
    if (t.presc) {
      const P = CAT.prescriptionOcculte(t.presc, q0.prescAns);
      if (P.acquise === !!t.presc.dissimule) pb.push("prescription de l'abus de biens sociaux incohérente");
      if (!(t.presc.comptes > t.presc.faits && t.presc.decouverte > t.presc.comptes)) pb.push("chronologie des comptes et de la découverte");
    }
    return pb;
  };

  // ================================================================== PHASE 3 : le Paris des affaires, les personnages, le code d'affaire
  // Version du générateur : elle entre dans le code d'affaire. Toute modification du tirage (gen-moteur, gen-monde, cat-*,
  // gen-instruction) qui change une affaire tirée d'une graine doit l'incrémenter, et GEN2.VERSIONS_LISIBLES dire si les
  // codes d'avant se rejouent encore à l'identique.
  GEN2.VERSION = 4; // 2 : anti-répétition, lot 3 (scènes nouvelles, ordonnances pénales élargies) ; 3 : infractions du lot 1 (variantes des fiches) ; 4 : infractions du lot 2 (nouvelles fiches, concours trafic et refus du code)
  GEN2.VERSIONS_LISIBLES = { 4: true };
  GEN2.codeSecteur = (S) => (S.paris ? String(parseInt(S.arr, 10)) : S.cp.slice(0, 2));
  // Les sommes en jeu suivent le milieu de la victime (un cambriolage à Neuilly, une escroquerie à Clichy-sous-Bois),
  // sans jamais changer la qualification
  const MONTANTS = ["abus_confiance", "escroquerie", "extorsion", "degradations", "incendie", "vol", "cambriolage", "recel"];
  GEN2.ajusterMontant = function (inf, f, mil) {
    if (!MONTANTS.includes(inf) || !f || typeof f.montant !== "number" || !mil || mil === "mixte") return;
    const q0 = CAT.qualifier(inf, f);
    const old = f.montant;
    f.montant = Math.max(50, Math.round((old * (mil === "aise" ? 1.8 : 0.65)) / 50) * 50);
    const q1 = CAT.qualifier(inf, f);
    if (!q0 || !q1 || q0.art !== q1.art || q0.prison !== q1.prison || q0.amende !== q1.amende || q0.nature !== q1.nature) f.montant = old;
  };
  // ------------------------------------------------------------------ Les magistrats et les policiers de chaque tribunal
  // Un acteur de Paris a son pendant à Bobigny, Créteil et Nanterre (même profil, autre personne) ; les policiers hors du
  // 18e ont leurs pendants (« secteur »). Personnages fictifs.
  const NOMS_MAG = ["Belhadj", "Okafor", "Pichon", "Morvillier", "Abadie", "Fontanel", "Ngom", "Garrigues", "Rouvier", "Desforges", "Lebrun", "Hervé", "Lambertin", "Cazeneuve", "Roux-Diallo", "Lenoir", "Vallet", "Bouvier", "de Montclos", "Kerbrat", "Ribes", "Marchand", "Benjelloun", "Duroc", "Esnault", "Tavernier", "Quéré", "Lagarde", "Mabille", "Sanchez", "Ferrand", "Picot", "Hamel", "Bertin", "Joubert", "Valette", "Cordier", "Lemarchand", "Thibault", "Aubry", "Gilbert", "Mercadier", "Delorme", "Sarr", "Kouyaté", "Weiss", "Leclerc", "Poulain"];
  const PRENOMS_MAG = { m: ["Karim", "Laurent", "Thierry", "Olivier", "Mathieu", "Pascal", "Julien", "Frédéric", "Christophe", "Henri", "Antoine", "Youssef", "Guillaume", "Benoît", "Arnaud", "Xavier"], f: ["Sabine", "Agnès", "Claire", "Hélène", "Isabelle", "Martine", "Zoé", "Amina", "Laetitia", "Sophie", "Céline", "Catherine", "Nathalie", "Véronique", "Anne", "Marion"] };
  const VARIANTES = ["pr_lacassagne", "pr_benkirane", "pr_dessaint", "pr_aubriot", "pr_roquebert", "pq_delahaye", "pq_haddou", "pq_riboulet", "ji_vauclair", "ji_ferraud", "ji_kessler", "ji_mineurs", "jld_pimentel", "jld_cherkaoui", "pq_criminel", "pr_assises", "pr_ccd", "je_morin", "pr_cam"];
  const LIEU_TJ = { pr_lacassagne: "Chambre des comparutions immédiates", pr_benkirane: "Chambre correctionnelle (juge unique)", pr_dessaint: "Chambre correctionnelle (collégiale)", pr_aubriot: "Chambre correctionnelle, contentieux économique", pr_roquebert: "Tribunal de police" };
  GEN2.acteurBase = (id) => (id ? String(id).replace(/_(bobigny|creteil|nanterre|secteur)$/, "") : id);
  GEN2.acteurTJ = (id, tj) => (!id || !tj || tj === "paris" ? id : CR.acteur(`${GEN2.acteurBase(id)}_${tj}`) ? `${GEN2.acteurBase(id)}_${tj}` : id);
  let acteursFaits = false;
  GEN2.creerActeurs = function () {
    if (acteursFaits || !CR.ACTEURS) return;
    acteursFaits = true;
    let k = 0;
    for (const tj of ["bobigny", "creteil", "nanterre"]) {
      const T = M.TJ[tj];
      for (const base of VARIANTES) {
        const a = CR.acteur(base);
        if (!a) continue;
        const r = CR.seeded("acteur:" + base + ":" + tj);
        const g = a.look && a.look.g === "f" ? "f" : "m";
        const nom = `${g === "f" ? "Mme" : "M."} ${pk(r, PRENOMS_MAG[g])} ${NOMS_MAG[(k++ * 7 + int(r, 0, 3)) % NOMS_MAG.length]}`;
        const look = Object.assign({}, a.look, { skin: int(r, 0, 5), glasses: ch(r, 0.45) ? 1 : 0, age: Math.max(30, (a.look.age || 45) + int(r, -8, 6)), hc: pk(r, ["black", "dkbrown", "brown", "gray", "auburn", "blonde"]) });
        const lieu = LIEU_TJ[base] ? `${LIEU_TJ[base]}, tribunal de ${T.ville}` : base.startsWith("pq_") ? `Substitut, parquet de ${T.ville}` : base === "pr_assises" ? T.assises : base === "pr_ccd" ? T.ccd : base === "pr_cam" ? `Cour d'assises des mineurs ${T.depLong}` : `${a.lieu}, tribunal de ${T.ville}`;
        CR.ACTEURS.push(Object.assign({}, a, { id: `${base}_${tj}`, nom, look, lieu, tj, blurb: a.blurb }));
      }
    }
    const POL = { opj_marchetti: ["Capitaine Élodie Brunet", "f"], opj_rocher: ["Lieutenant Yanis Kaddour", "m"], opj_benali: ["Brigadier-chef Stéphane Morel", "m"] };
    for (const [base, [nom, g]] of Object.entries(POL)) { const a = CR.acteur(base); if (a) CR.ACTEURS.push(Object.assign({}, a, { id: base + "_secteur", nom, look: Object.assign({}, a.look, { g, skin: g === "f" ? 0 : 2, hc: "dkbrown" }), lieu: "Police nationale, officier de police judiciaire de quart", tj: "secteur" })); }
    // confrères adverses (phase 3) : un style chacun
    const CONF = [["av_marchal", "Me Hélène Marchal", "f", "conciliant", "Cherche toujours l'arrangement : indemniser plutôt que plaider."], ["av_castagnet", "Me Bruno Castagnet", "m", "agressif", "Interpelle, coupe, plaide fort. Écrit des courriers cinglants."], ["av_darmon", "Me Sylvie Darmon", "f", "procedurier", "Conclusions la veille, nullités en cascade, renvois."], ["av_peyrol", "Me Romain Peyrol", "m", "absent", "Surchargé : envoie un collaborateur, ou personne."]];
    for (const [id, nom, g, style, blurb] of CONF) if (!CR.acteur(id)) CR.ACTEURS.push({ id, nom, role: "confrere", profil: { conciliant: "debutant", agressif: "tenor", procedurier: "renvois", absent: "renvois" }[style], style, lieu: "Avocat au barreau de Paris".replace("Avocat", g === "f" ? "Avocate" : "Avocat"), look: { g, skin: g === "f" ? 1 : 0, hair: g === "f" ? "long" : "short", hc: "brown", glasses: 0, age: 44, outfit: "robe" }, blurb, tj: "adverse" });
    for (const tj of ["bobigny", "creteil", "nanterre"]) for (const base of Object.keys(LIEU_TJ)) GEN2.CHAMBRE[`${base}_${tj}`] = `${LIEU_TJ[base]} (${M.TJ[tj].ville})`;
  };
  // La chambre d'une affaire (titre d'audience)
  GEN2.chambre = (t) => GEN2.CHAMBRE[t.pres] || GEN2.CHAMBRE[GEN2.acteurBase(t.pres)] || "Tribunal correctionnel";

  // ------------------------------------------------------------------ Fin du tirage : lieu, revenus, acteurs, personnages
  GEN2.finP3 = function (r3, t, LX) {
    GEN2.creerActeurs();
    t.ver = GEN2.VERSION;
    t.lieu = { f: LX.F.id, a: (t.A && t.A.sect) || LX.A.id, v: t.V ? t.V.sect || LX.V.id : null };
    if (t.inf && CAT.INF[t.inf] && CAT.INF[t.inf].fam === "crim_stups") t.jirs = true;
    for (const k of ["A", "V", "P", "R", "C2"]) { const Q = t[k]; if (Q && typeof Q === "object" && !Q.morale && Q.revenu == null) Q.revenu = M.revenu(r3, Q, Q.mil || LX.milA); }
    const L = M.lieuxDe(t);
    if (!L.TJ.paris) for (const k of ["pres", "parquet", "ji", "jld"]) if (t[k]) t[k] = GEN2.acteurTJ(t[k], L.TJ.id);
    if (L.F.id !== "p18" && t.opj) t.opj = GEN2.acteurTJ(t.opj, "secteur");
    t.vie = GEN2.tirerVie(r3, t);
  };

  // ------------------------------------------------------------------ Les personnages autonomes (tirés, puis joués par gen-vie.js)
  // Le mensonge : la version du client contredite par une pièce (clé de preuve), puis aveu tardif, maintien ou rétractation.
  GEN2.MENSONGES = {
    absent: { camp: "defense", preuves: ["video", "temoin", "telephonie", "adn"], cond: (t) => t.stance !== "reconnait" && !["route"].includes(CAT.INF[t.inf].fam) },
    volant: { camp: "defense", preuves: ["video", "temoin", "fichier"], cond: (t) => t.stance !== "reconnait" && CAT.INF[t.inf].fam === "route" && !["alcool", "stups_volant"].includes(t.inf) },
    pas_bu: { camp: "defense", preuves: ["ethylo", "labo"], cond: (t) => ["alcool", "stups_volant"].includes(t.inf) && t.stance !== "reconnait" },
    jamais_touche: { camp: "defense", preuves: ["releve", "telephonie", "ecrits", "saisie"], cond: (t) => ["biens", "numerique", "affaires", "stups"].includes(CAT.INF[t.inf].fam) && t.stance !== "reconnait" },
    pas_frappe: { camp: "defense", preuves: ["certificat", "temoin", "video"], cond: (t) => CAT.INF[t.inf].fam === "personnes" && t.stance !== "reconnait" },
    pas_casier: { camp: "defense", preuves: ["casier"], cond: (t) => t.A && t.A.casier > 0 },
    provocation: { camp: "pc", preuves: ["temoin", "video"], cond: (t) => ["violences", "menaces"].includes(t.inf) && t.client === "V" },
    prejudice: { camp: "pc", preuves: ["releve", "certificat"], cond: (t) => t.client === "V" },
  };
  const poids = (r, w) => CAT.poids(r, w);
  GEN2.tirerVie = function (r, t) {
    const v = {};
    const pc = t.genre === "pc" || t.camp === "pc";
    const C = t[t.client] || t.A;
    const fam = (CAT.INF[t.inf] || {}).fam || "";
    const permanence = ["gav", "ci"].includes(t.genre) || t.entree === "deferement";
    // 1. ne pas tout dire, mentir
    const xMent = r();
    const IM = CAT.INF[t.inf] || {}; const exclus = typeof IM.pasMensonges === "function" ? IM.pasMensonges(t.f) : IM.pasMensonges || [];
    const cands = Object.entries(GEN2.MENSONGES).filter(([id, m]) => !exclus.includes(id) && m.camp === (pc ? "pc" : "defense") && m.cond(t) && m.preuves.some((p) => p === "casier" || (t.preuves || []).includes(p)));
    const iM = r();
    const issue = poids(r, { aveu: 0.45, maintient: 0.35, retracte: 0.2 });
    if (cands.length && xMent < (pc ? 0.18 : 0.32) && !t.R) {
      const [k, m] = cands[Math.floor(iM * cands.length)];
      const pr = m.preuves.filter((p) => p === "casier" || t.preuves.includes(p));
      v.ment = { k, preuve: pr[Math.floor(r() * pr.length)], issue: issue === "retracte" ? "maintient" : issue };
    } else r();
    // des aveux de garde à vue rétractés ensuite
    const xRet = r();
    if (!v.ment && !pc && t.stance === "reconnait" && t.mesure === "gav" && xRet < 0.22) v.retracte = true;
    // 2. absences, silences, paiement, menace de partir, second avocat
    const xAbs = r();
    v.absent = xAbs < 0.08 && !permanence ? "rdv" : xAbs < 0.14 && ["copj", "pc"].includes(t.genre) ? "audience" : null;
    v.injoignable = r() < 0.12;
    const pauvre = C && C.revenu != null && C.revenu < 1100;
    v.paie = t.R ? "ok" : poids(r, { ok: pauvre ? 0.62 : 0.78, retard: 0.16, jamais: pauvre ? 0.22 : 0.06 });
    v.menace = r() < 0.1;
    v.second = r() < 0.05 && !permanence;
    // 3. la famille : elle paie, veut savoir, pousse une stratégie
    const xFam = r();
    const pFam = (C && C.age < 25 ? 0.45 : 0.18) + (t.entree === "detenu" ? 0.25 : 0);
    if (C && !t.R && xFam < pFam) {
      const g = r() < 0.6 ? "f" : "m";
      const jeune = C.age < 30;
      const rel = jeune ? (g === "f" ? pk(r, ["mère", "sœur", "tante"]) : pk(r, ["père", "frère", "oncle"])) : C.g === "f" ? (g === "m" ? "mari" : "sœur") : g === "f" ? "épouse" : "frère";
      const prenom = pk(r, g === "f" ? M.PF : M.PM);
      v.fam = { g, rel, prenom, nom: ["mari", "épouse"].includes(rel) && r() < 0.4 ? pk(r, M.NOMS) : C.nom, age: jeune ? int(r, 40, 62) : int(r, Math.max(20, C.age - 8), C.age + 8), paie: r() < 0.55, pousse: pc ? pk(r, ["vengeance", "presse", "argent"]) : pk(r, ["nier", "avouer", "complice", "renvoi"]), secret: r() < 0.65 };
    } else { r(); r(); r(); r(); r(); r(); }
    // 4. le parquet : appel d'une décision trop douce, CRPC, composition pénale, témoin cité au dernier moment
    const q = t.q || {};
    v.pq = {
      appel: !pc && r() < 0.4,
      crpc: !pc && ["copj", "al"].includes(t.genre) && q.nature === "delit" && CAT.crpcPossible(q) && !t.R && r() < 0.32,
      compo: !pc && t.genre === "al" && q.nature === "delit" && q.prison <= 60 && !t.rec && r() < 0.28,
      temoin: !!t.T && ["copj", "pc"].includes(t.genre) && r() < 0.14,
    };
    if (v.pq.crpc && v.pq.compo) v.pq.compo = false;
    // 5. le confrère d'en face (avocat de la victime constituée, ou du prévenu quand on défend la victime)
    const victime = t.V && !t.V.agent && t.genre !== "info";
    const xAdv = r();
    if (victime && (pc || ["copj", "ci"].includes(t.genre)) && xAdv < 0.7) {
      const style = poids(r, { conciliant: 0.3, agressif: 0.25, procedurier: 0.25, absent: 0.2 });
      v.adv = { style, id: { conciliant: pk(r, ["av_marchal", "av_tessier"]), agressif: pk(r, ["av_castagnet", "av_villeneuve"]), procedurier: pk(r, ["av_darmon", "av_pernot"]), absent: "av_peyrol" }[style] };
    } else { r(); r(); }
    // 6. la presse, sur les grosses affaires
    const gros = t.genre === "info" ? (q.nature === "crime" ? 0.5 : 0.2) : fam === "affaires" ? 0.4 : ["homicide_routier", "violences_pdap", "blessures_routieres"].includes(t.inf) ? 0.3 : 0.02;
    v.presse = r() < gros;
    v.journal = pk(r, ["Paris Matin", "Le Quotidien de Paris", "L'Écho francilien", "Info Île-de-France"]);
    return v;
  };
  // Contrôle (tests) : lieu, tribunal, commissariat, acteurs du bon tribunal, personnages
  GEN2.verifierP3 = function (t) {
    const pb = [];
    if (!t.lieu) return pb;
    const S = M.SECTEURS[t.lieu.f];
    if (!S) return ["secteur des faits inconnu " + t.lieu.f];
    const L = M.lieuxDe(t);
    const attendu = t.pnf || t.jirs ? "paris" : S.tj;
    if (L.TJ.id !== attendu) pb.push("tribunal différent de celui du lieu des faits");
    if ((t.genre === "gav" || t.genre === "ci" || t.entree === "deferement") && !S.paris) pb.push("permanence parisienne hors de Paris");
    for (const k of ["pres", "parquet", "ji", "jld"]) if (t[k]) { const a = CR.acteur(t[k]); if (!a) pb.push("acteur introuvable " + t[k]); else if (a.tj && a.tj !== L.TJ.id && a.tj !== "secteur") pb.push(`acteur d'un autre tribunal (${t[k]})`); else if (!a.tj && !L.TJ.paris && GEN2.acteurTJ(t[k], L.TJ.id) !== t[k]) pb.push(`acteur parisien hors de Paris (${t[k]})`); }
    if (t.A && t.A.sect && !M.SECTEURS[t.A.sect]) pb.push("domicile inconnu");
    if (t.A && t.A.adresse && t.A.sect && !t.A.adresse.endsWith(M.SECTEURS[t.A.sect].nom)) pb.push("adresse et secteur du domicile");
    if (t.vie && t.vie.ment && t.vie.ment.preuve !== "casier" && !t.preuves.includes(t.vie.ment.preuve)) pb.push("mensonge contredit par une preuve absente");
    for (const k of ["A", "V"]) { const Q = t[k]; if (Q && !Q.morale && Q.revenu != null && (Q.revenu < 0 || Q.revenu > 20000)) pb.push("revenu incohérent " + k); }
    return pb;
  };

  // ------------------------------------------------------------------ Signature de type (anti-répétition) : ce qu'est l'affaire,
  // pas qui elle concerne. Infraction (et celles qui l'accompagnent), contexte, aggravantes, preuves, camp, irrégularités,
  // issue prévue de l'information.
  GEN2.typeSig = function (t) {
    const f = t.f || {};
    return [
      t.genre === "pc" || t.camp === "pc" ? "pc" : "def",
      [t.inf].concat((t.conc || []).map((c) => c.inf)).join("+"),
      t.sc || f.sc || f.ctx || "",
      (f.agg || []).slice().sort().join("."),
      (t.preuves || []).filter((p) => p !== "aveux").slice().sort().join("."),
      (t.irr || []).slice().sort().join("."),
      t.genre === "info" ? [t.entree, f.psy || "", (t.enjeux || []).slice().sort().join(".")].join(":") : "",
    ].join("|");
  };
  // Difficulté (1 facile, 2 moyenne, 3 difficile) : ce qu'il faut trouver et plaider
  GEN2.difficulte = function (t) {
    const sc = (t.irr || []).length + (t.doutes || []).length * 0.5 + ((t.conc || []).length ? 1 : 0) + (t.recid && t.recid.vice ? 1.5 : 0) + (t.q2 ? 0.5 : 0) + (t.PM ? 1 : 0) + (t.presc ? 1 : 0) + (t.genre === "info" ? 1.5 : 0) + (t.vie && t.vie.ment ? 0.5 : 0);
    return sc < 1.5 ? 1 : sc < 3 ? 2 : 3;
  };

  // ------------------------------------------------------------------ Code d'affaire
  // GENRE-XXXX-XXXC : trois lettres pour le genre, sept caractères (alphabet de Crockford, sans I, L, O, U) qui portent
  // 35 bits — version du générateur (4), affaire liée à une carrière (1), jour de partie (12), créneau de dix minutes (8),
  // graine (10) — et un caractère de contrôle : un CRC à 5 bits (x⁵ + x² + 1) sur le préfixe et les sept caractères. Toute
  // faute de frappe sur un seul caractère est détectée ; une inversion de deux caractères voisins l'est presque toujours.
  const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  GEN2.CODE_GENRES = { gav: "GAV", ci: "CMI", al: "AUD", op: "ORD", copj: "COP", pc: "VIC", info: "INS" };
  GEN2.CODE_LIB = { GAV: "garde à vue (permanence)", CMI: "comparution immédiate", AUD: "audition libre", ORD: "ordonnance pénale", COP: "convocation devant le tribunal", VIC: "victime, partie civile", INS: "information judiciaire" };
  const GENRE_DE = Object.fromEntries(Object.entries(GEN2.CODE_GENRES).map(([g, c]) => [c, g]));
  const valCar = (c) => { const i = B32.indexOf(c); return i >= 0 ? i : c.charCodeAt(0) % 32; };
  const controle = (pre, corps) => {
    const bits = [];
    for (const ch2 of pre) for (let k = 7; k >= 0; k--) bits.push((ch2.charCodeAt(0) >> k) & 1);
    for (const ch2 of corps) { const v = valCar(ch2); for (let k = 4; k >= 0; k--) bits.push((v >> k) & 1); }
    let c = 0;
    for (const b of bits) { const top = ((c >> 4) & 1) ^ b; c = (c << 1) & 31; if (top) c ^= 5; }
    return B32[c];
  };
  // Brassage réversible des 35 bits (multiplication par un nombre impair modulo 2³⁵) : deux affaires voisines ont des codes
  // bien distincts, plus faciles à lire et à dicter
  const M35 = (1n << 35n) - 1n, KM = 0x5DEECE66Dn & M35 | 1n, XM = 0x2A5A5A5A5n & M35;
  const KI = (() => { let x = KM; for (let i = 0; i < 7; i++) x = (x * (2n - KM * x)) & M35; return x; })();
  const brasser = (v) => Number(((BigInt(v) ^ XM) * KM) & M35);
  const debrasser = (v) => Number(((BigInt(v) * KI) & M35) ^ XM);
  GEN2.graineCode = (c) => `v${c.v}:${c.genre}:${c.day}:${c.slot}:${c.n}`;
  GEN2.encoderCode = function (c) {
    if (c.day < 0 || c.day > 4095 || c.slot < 0 || c.slot > 255 || c.n < 0 || c.n > 1023 || c.v < 1 || c.v > 15) return null;
    let val = brasser((((c.v * 2 + (c.lie ? 1 : 0)) * 4096 + c.day) * 256 + c.slot) * 1024 + c.n);
    let corps = "";
    for (let i = 0; i < 7; i++) { corps = B32[val % 32] + corps; val = Math.floor(val / 32); }
    const pre = GEN2.CODE_GENRES[c.genre];
    return `${pre}-${corps.slice(0, 4)}-${corps.slice(4)}${controle(pre, corps)}`;
  };
  // Lecture tolérante : minuscules, espaces, tirets, O pour 0, I et L pour 1 ; un message clair pour chaque erreur
  GEN2.lireCode = function (saisie) {
    const brut = String(saisie || "").toUpperCase().replace(/[\s\-_.–—]/g, "");
    if (!brut) return { ok: false, msg: "Saisissez un code d'affaire, par exemple COP-7K4Q-9XFB." };
    const pre = brut.slice(0, 3);
    if (!GENRE_DE[pre]) return { ok: false, msg: `Un code commence par trois lettres qui disent le genre d'affaire : ${Object.keys(GENRE_DE).join(", ")}. « ${pre} » n'en est pas un.` };
    const reste = brut.slice(3);
    if (reste.length !== 8) return { ok: false, msg: `Après « ${pre} », un code compte huit caractères (par exemple ${pre}-7K4Q-9XFB) ; il y en a ${reste.length}.` };
    const corps = reste.slice(0, 7).replace(/O/g, "0").replace(/[IL]/g, "1");
    const bad = [...corps].find((c) => B32.indexOf(c) < 0);
    if (bad) return { ok: false, msg: `Le caractère « ${bad} » n'existe pas dans les codes d'affaire (ni I, ni L, ni O, ni U : ils se confondent avec 1 et 0).` };
    const chk = reste[7].replace("O", "0").replace(/[IL]/, "1");
    if (controle(pre, corps) !== chk) return { ok: false, msg: "Le caractère de contrôle ne correspond pas : une faute de frappe s'est glissée dans le code. Vérifiez chaque caractère." };
    let val = 0;
    for (const ch2 of corps) val = val * 32 + B32.indexOf(ch2);
    val = debrasser(val);
    const n = val % 1024; val = Math.floor(val / 1024);
    const slot = val % 256; val = Math.floor(val / 256);
    const day = val % 4096; val = Math.floor(val / 4096);
    const lie = val % 2 === 1; const v = Math.floor(val / 2);
    const c = { genre: GENRE_DE[pre], v, lie, day, slot, n, code: `${pre}-${corps.slice(0, 4)}-${corps.slice(4)}${chk}` };
    if (v > GEN2.VERSION) return { ok: false, c, msg: `Ce code vient d'une version plus récente du générateur (n° ${v}) que celle de ce jeu (n° ${GEN2.VERSION}). Mettez le jeu à jour pour le jouer.` };
    if (!GEN2.VERSIONS_LISIBLES[v]) return { ok: false, c, ancien: true, msg: `Ce code vient de la version n° ${v} du générateur. Elle ne peut plus être reproduite à l'identique dans cette version (n° ${GEN2.VERSION}) : le jeu ne vous donnera pas une autre affaire à sa place.` };
    if (slot > 143) return { ok: false, c, msg: "Ce code désigne une heure qui n'existe pas : il n'a pas été produit par le jeu." };
    return { ok: true, c, lie, ancien: v < GEN2.VERSION, avert: lie ? "Cette affaire est liée à une carrière : une personne déjà rencontrée y revenait. Les faits, les pièces et les autres personnes sont les mêmes ; la personne revenue est remplacée par une inconnue." : v < GEN2.VERSION ? `Code de la version n° ${v} du générateur, rejouée à l'identique.` : null };
  };
  // Le tirage désigné par un code (aucune signature écartée : c'est l'affaire elle-même)
  GEN2.tirerCode = function (c, o = {}) {
    const genre = c.genre;
    const min = c.slot * 10;
    return GEN2.tirer(GEN2.graineCode(c), genre, { day: c.day, min, night: genre === "gav" && min < 6 * 60, camp: o.camp });
  };
  GEN2.codeDe = (t) => t && t.code || null;
  // Construire un code à partir de critères : famille d'infraction, délit ou crime, camp, irrégularité, difficulté
  // crit : { fam, nature: "delit" | "crime", camp: "defense" | "pc", irr: true | false | null, niveau: 1 | 2 | 3, genre }
  GEN2.codeParCriteres = function (crit = {}, o = {}) {
    const crime = crit.nature === "crime" || (crit.fam && /^crim_/.test(crit.fam));
    const pc = crit.camp === "pc";
    let genres = crime ? ["info"] : pc ? ["pc"] : ["copj", "al", "op", "gav", "ci"];
    if (crit.genre) genres = [crit.genre];
    if (crit.fam && !crime) genres = genres.filter((g) => (GEN2.GENRES[g].fam || {})[crit.fam]);
    if (!genres.length) return { ok: false, msg: "Aucun genre d'affaire ne combine ces critères (par exemple : pas d'ordonnance pénale pour des violences)." };
    const base = o.day != null ? o.day : 120;
    const r = CR.seeded("criteres:" + JSON.stringify(crit) + ":" + (o.essai || 0));
    const jours = [];
    for (let d = base; jours.length < 12; d++) if (CR.isBusinessDay(d)) jours.push(d);
    for (let i = 0; i < 1500; i++) {
      const genre = genres[i % genres.length];
      const c = { v: GEN2.VERSION, lie: false, genre, day: jours[Math.floor(i / 125) % jours.length], slot: genre === "gav" ? 60 + Math.floor(r() * 40) : 66, n: Math.floor(r() * 1024) };
      let t;
      try { t = GEN2.tirerCode(c); } catch (e) { continue; }
      if (crit.fam && CAT.INF[t.inf].fam !== crit.fam) continue;
      if (crime && t.q.nature !== "crime") continue;
      if (!crime && crit.nature === "delit" && t.q.nature === "crime") continue;
      if (genre === "info" && (pc ? t.camp !== "pc" : t.camp === "pc")) continue;
      if (crit.irr === true && !(t.irr || []).length) continue;
      if (crit.irr === false && (t.irr || []).length) continue;
      if (crit.niveau && GEN2.difficulte(t) !== +crit.niveau) continue;
      return { ok: true, code: GEN2.encoderCode(c), c, t };
    }
    return { ok: false, msg: "Aucune affaire ne réunit tous ces critères parmi celles essayées. Relâchez un critère (la difficulté, par exemple)." };
  };

  // Le parquet, à l'issue de la garde à vue : la voie la plus probable, parmi celles que la loi permet
  GEN2.voiesPossibles = function (inf, q, flagrance) {
    const I = CAT.INF[inf];
    const out = {};
    for (const [v, p] of Object.entries(I.voies || {})) {
      if (!p) continue;
      if (v === "ci" && !CAT.ciPossible(q, flagrance)) continue;
      if (v === "op" && !CAT.opPossible(q)) continue;
      if (v === "crpc" && !CAT.crpcPossible(q)) continue;
      if (v === "copj" && q.nature === "contravention") continue;
      out[v] = p;
    }
    return out;
  };
  GEN2.voieParquet = function (r, inf, q, flagrance, A, preuves) {
    const w = GEN2.voiesPossibles(inf, q, flagrance);
    if (A.casier === 0 && w.alternative) w.alternative *= 1.6;
    if (q.recidive && w.ci) w.ci *= 2;
    if (q.recidive) { delete w.alternative; delete w.classement; }
    return CAT.poids(r, Object.keys(w).length ? w : { copj: 1 }) || "copj";
  };
  // La chambre : police, comparutions immédiates, ou une chambre correctionnelle selon le contentieux
  GEN2.president = function (inf, q, jur) {
    if (jur === "tp") return "pr_roquebert";
    if (jur === "ci") return "pr_lacassagne";
    const fam = CAT.INF[inf].fam;
    if (fam === "affaires" || fam === "numerique") return "pr_aubriot";
    if (["stups_trafic", "stups_detention", "cambriolage", "extorsion", "incendie", "homicide_routier", "violences_conj"].includes(inf) || q.prison >= 84) return "pr_dessaint";
    return "pr_benkirane";
  };
  GEN2.CHAMBRE = { pr_roquebert: "Tribunal de police", pr_lacassagne: "23e chambre (comparutions immédiates)", pr_benkirane: "24e chambre correctionnelle", pr_dessaint: "16e chambre correctionnelle", pr_aubriot: "10e chambre correctionnelle" };

  // Signature : deux affaires de la même partie ne se ressemblent jamais à ce point
  GEN2.signature = (t) => [t.inf, t.sc || "", JSON.stringify(t.f), `${t.A.prenom} ${t.A.nom}`, t.V ? `${t.V.prenom} ${t.V.nom}` : "", t.genre].join("|");

  // Récit : le contexte (X) et la fiche du catalogue ; « expliquer » des auditions suit la posture tirée
  GEN2.recit = function (t, niveau) {
    const I = CAT.INF[t.inf];
    const r = CR.seeded(t.sig + ":recit");
    const X = M.X(t, r, niveau);
    const N = I.recit(X, t.f);
    N.audition = (N.audition || []).map((a) => ({ q: a.q, fq: a.fq, a: Object.assign({}, a.a, { expliquer: a.a.expliquer || N.version[t.stance] }) }));
    // n° 12 : ce que la prévention et les pièces disent des infractions ajoutées (concours), sur un fil de hasard à part
    if (t.conc) { const X2 = M.X(t, CR.seeded(t.sig + ":conc"), niveau); N.conc = t.conc.map((c) => Object.assign({ inf: c.inf, quoi: c.quoi || null, memeFait: !!c.memeFait }, CAT.CONC_RECIT[c.inf](X2, t, c))); }
    return CAT.typoDeep(N);
  };

  // ------------------------------------------------------------------ Contrôle de cohérence (test des 1 000 affaires)
  GEN2.verifier = function (t) {
    if (t.genre === "info") return GEN2.verifierInfo(t);
    const pb = [];
    const I = CAT.INF[t.inf];
    if (!I) return ["infraction inconnue " + t.inf];
    const q0 = CAT.qualifier(t.inf, t.f);
    const q = t.rec ? CAT.avecRecidive(q0, GEN2.recidiveRetenue(t)) : q0;
    // 1. la qualification stockée est celle que le catalogue tire des faits
    const sans = (x) => { const o = Object.assign({}, x); delete o.source; return JSON.stringify(o); };
    if (sans(q) !== sans(t.q)) pb.push("qualification différente de celle des faits");
    // 2. nature, peine, juridiction
    if (q.nature === "contravention" && (q.prison || q.amende > (q.recidive ? 3000 : 1500) || q.jur !== "tp")) pb.push("contravention mal formée");
    if (q.nature === "delit" && (q.jur !== "tc" || !(q.prison > 0 || q.amende > 3000))) pb.push("délit mal formé");
    if (q.nature === "delit" && q.prescAns !== 6) pb.push("prescription délictuelle ≠ 6 ans");
    if (q.nature === "contravention" && q.prescAns !== 1) pb.push("prescription contraventionnelle ≠ 1 an");
    if (t.rec && !q.recidive) pb.push("récidive non appliquée");
    for (const a of t.f.agg || []) if (!CAT.AGG[a]) pb.push("circonstance inconnue " + a);
    // les circonstances ne font jamais baisser la peine (comparaison avec les mêmes faits sans circonstance)
    if ((t.f.agg || []).length) { const qs = CAT.qualifier(t.inf, Object.assign({}, t.f, { agg: [] })); if (qs && qs.nature === q0.nature && qs.prison > q0.prison) pb.push("circonstances qui allègent la peine"); }
    // seuils : l'ITT et le taux d'alcool
    if (["violences", "violences_conj", "violences_pdap"].includes(t.inf) && !CAT.estVariante(t.inf, t.f)) {
      const n = (t.f.agg || []).length;
      if (t.f.itt > 8 && !/222-1[12]/.test(q0.art)) pb.push("ITT > 8 jours sans l'art. 222-11 ou 222-12");
      if (t.f.itt <= 8 && n && !/222-13/.test(q0.art)) pb.push("ITT ≤ 8 jours aggravée sans l'art. 222-13");
      if (t.f.itt <= 8 && !n && q0.nature !== "contravention") pb.push("ITT ≤ 8 jours sans circonstance : contravention attendue");
      if (t.f.itt === 0 && !n && !/R\. 624-1/.test(q0.art)) pb.push("sans ITT ni circonstance : R. 624-1 attendu");
    }
    if (t.inf === "alcool" && !t.f.refus && !t.f.ivresse && (t.f.taux >= 0.4) !== (q0.nature === "delit")) pb.push("taux d'alcool et nature incohérents");
    if (t.inf === "vol" && t.f.itt > 8 && !/311-6/.test(q0.art)) pb.push("vol avec ITT > 8 jours sans l'art. 311-6");
    // 3. la procédure suivie est permise par la loi
    if (t.mesure === "gav" && !CAT.gavPossible(q)) pb.push("garde à vue pour une infraction non punie d'emprisonnement");
    if (t.voie === "ci" && !CAT.ciPossible(q, t.flagrance)) pb.push("comparution immédiate impossible");
    if (t.voie === "op" && !CAT.opPossible(q)) pb.push("ordonnance pénale impossible");
    if (t.voie === "crpc" && !CAT.crpcPossible(q)) pb.push("CRPC impossible");
    if (["copj", "cppv"].includes(t.voie) && q.nature !== "delit") pb.push("convocation devant le tribunal correctionnel pour une contravention");
    if (t.voie === "citation_parquet" && q.nature !== "contravention") pb.push("citation devant le tribunal de police pour un délit");
    if (t.jur === "ci" && t.voie !== "ci") pb.push("23e chambre sans comparution immédiate");
    if (t.jur !== "ci" && t.jur !== q.jur) pb.push("juridiction ≠ nature de l'infraction");
    const pres = GEN2.president(t.inf, q, t.jur);
    if (pres !== GEN2.acteurBase(t.pres)) pb.push("président incohérent");
    if (t.jur === "tp" && GEN2.acteurBase(t.pres) !== "pr_roquebert") pb.push("tribunal de police sans son juge");
    pb.push(...GEN2.verifierP3(t));
    // 4. délais
    const d = t.d;
    const day = t.day != null ? t.day : null;
    if (d.faits == null) pb.push("pas de date des faits");
    const presc = (start) => CR.addYears(start, q.prescAns);
    if (t.genre === "op") {
      if (!(d.notif < (day != null ? day : d.notif + 1))) pb.push("notification de l'ordonnance après l'arrivée du client");
      if (day != null && CR.rollForward(d.notif + 45) < day) pb.push("délai d'opposition déjà expiré à l'arrivée");
      if (!(d.faits < d.notif)) pb.push("faits postérieurs à l'ordonnance");
    }
    if (t.genre === "copj" || (t.genre === "pc" && d.voiePc === "convoque")) {
      if (d.audience - (d.convoc != null ? d.convoc : d.mesure) < 15) pb.push("moins de quinze jours entre convocation et audience (art. 552)");
      if (day != null && d.audience - day < 14) pb.push("audience trop proche de l'arrivée du client");
      if (d.audience > presc(d.faits) && !t.presc) pb.push("audience après la prescription");
      if (!(d.faits <= (d.convoc != null ? d.convoc : d.mesure))) pb.push("convocation avant les faits");
    }
    if (t.genre === "pc" && d.voiePc === "classe") {
      if (!(d.faits < d.acte && d.acte < d.classement)) pb.push("chronologie plainte, acte, classement");
      if (day != null && presc(d.acte) < day + 50) pb.push("prescription trop proche pour citer à temps");
    }
    if (t.genre === "al" && day != null && !(d.audition > day && d.faits < day)) pb.push("audition libre mal datée");
    if (t.genre === "gav" && !(d.debut < (t.min || 24 * 60))) pb.push("garde à vue commencée après l'appel");
    // 5. pièces et anomalies : tout drapeau correspond à une irrégularité tirée
    for (const id of t.irr) { const x = GEN2.IRR[id]; if (!x || !CR.IRREG[x.regime]) pb.push("irrégularité sans régime " + id); if (x && x.mesure && x.mesure !== t.mesure) pb.push("irrégularité hors de sa mesure " + id); }
    if (t.q2) { if (t.q2.prison > t.q.prison || (t.q2.prison === t.q.prison && t.q2.amende >= t.q.amende && t.q2.nature === t.q.nature)) pb.push("requalification qui n'allège pas"); }
    return pb.concat(GEN2.verifierN12(t, q0));
  };
})();
