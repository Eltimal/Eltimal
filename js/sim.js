/* La Permanence — simulation de l'affaire (CR.SIM), lot 1 de la refonte du gameplay.
   L'affaire est d'abord simulée en entier, minute par minute ; pièces, paroles, images et jugement n'en sont que des vues
   (onglet « Refonte du gameplay », section « Le socle »). Le tirage du générateur (infraction, personnes, lieu, voie,
   preuves, irrégularités, doutes) nourrit la simulation, qui n'invente rien qui le contredise.
   Pilote : le vol par arrachage en flagrance, garde à vue puis comparution immédiate (ou garde à vue en cours).
   SIM.supporte(t) ; SIM.caler(t, C) recale l'heure des faits sur la chronologie de la garde à vue ;
   SIM.simuler(t, k) rend { faits, personnes, savoirs, enquete, imprevus, … } ; tout vient de la graine t.sig. */
(function () {
  const CR = (window.CR = window.CR || {});
  const SIM = (CR.SIM = {});
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const ch = (r, p) => r() < p;

  // toute affaire de flagrance avec garde à vue, du point de vue du mis en cause ; l'arrachage a son récit détaillé
  // garde à vue (en flagrance ou au bout d'une enquête préliminaire), du point de vue du mis en cause
  // et, pour les convocations (COPJ, ordonnance pénale, dossier de la partie civile convoquée), garde à vue ou audition libre
  SIM.supporte = (t) => !!(t && t.f && t.A && !t.PM && (
    (t.mesure === "gav" && (t.genre === "ci" || t.genre === "gav") && t.client === "A")
    || ((t.mesure === "gav" || t.mesure === "al") && (t.genre === "copj" || t.genre === "op") && t.client === "A")
    || ((t.mesure === "gav" || t.mesure === "al") && t.genre === "pc" && t.d.voiePc !== "classe" && (t.client === "V" || t.client === "P"))));
  SIM.arrachage = (t) => !!(t && t.flagrance && (t.genre === "ci" || t.genre === "gav") && t.inf === "vol" && t.f && t.f.sc === "arrachage" && t.V && !(t.f.agg || []).includes("reunion"));

  // Sous l'irrégularité « heures », la mesure prend effet bien après l'interpellation : les faits précèdent l'interpellation
  // (l'ancien générateur pouvait placer l'interpellation avant les faits).
  // Les constatations du catalogue situent parfois la scène au domicile de la victime ou du couple : les fiches suivent.
  SIM.adresses = function (t, N, SF) {
    if (!SIM.supporte(t) || !N || !N.constat) return;
    // le lieu des faits (« au domicile de M. X, 61, rue Didot ») et les constatations
    const x = (N.lieu ? N.lieu + ". " : "") + N.constat.join(" ");
    const m = /au domicile (du couple|de (?:Mme|M\.) [^,]+), (\d+[^,.]*?, (?:rue|avenue|boulevard|place|quai|allée|impasse|passage)[^,.]*?)(?:, \d+(?:er|e) étage)?[.,]/.exec(x)
      || /au domicile (du couple|de (?:Mme|M\.) [^,]+), (\d+, [^,.]+?)(?:, \d+(?:er|e) étage)?[.,]/.exec(x);
    if (!m) return;
    if (!SF || !SF.nom || !SF.id) return;
    const ad = `${m[2]}, ${SF.nom}`, rue = m[2].replace(/^\d+(?: bis| ter)?, /, "");
    // l'adresse, la rue et le secteur vont ensemble (gen-moteur.js vérifie que l'adresse finit par le nom du secteur)
    const poser = (P) => { P.adresse = ad; P.rue = rue; P.sect = SF.id; };
    if (t.V && (m[1] === "du couple" || m[1].includes(t.V.nom))) { poser(t.V); if (t.lieu) t.lieu.v = SF.id; }
    if (t.A && m[1] === "du couple") { poser(t.A); if (t.lieu) t.lieu.a = SF.id; }
    // le mis en cause qui n'habite pas chez la victime n'a pas sa porte : même rue, autre numéro
    else if (t.A && t.V && t.A.adresse === t.V.adresse) { const nA = +(/^\d+/.exec(t.A.adresse) || [0])[0]; t.A.adresse = t.A.adresse.replace(/^\d+(?: bis| ter)?/, String(nA > 40 ? nA - 17 : nA + 23)); }
  };
  // l'équipage : deux agents différents (le tirage peut donner deux fois le même nom)
  SIM.equipage = function (t) {
    if (!SIM.supporte(t) || !t.gpx || t.gpx[0] !== t.gpx[1]) return;
    const L = ["Karim Ouali", "Léa Perret", "Julien Moreau", "Sarah Benchetrit", "Kévin Lopes", "Aurélie Dumont", "Mickaël Tessier", "Nadia Ferhat", "Thomas Vasseur", "Inès Bouchard"];
    t.gpx[1] = L[(L.indexOf(t.gpx[0]) + 3) % L.length];
  };
  SIM.caler = function (t, C) {
    if (!SIM.supporte(t) || !t.flagrance) return; // en préliminaire, les faits et la garde à vue sont des jours différents
    const r = CR.seeded(t.sig + ":caler");
    const h = ((t.d.h % 1440) + 1440) % 1440;
    // audition libre en flagrance : juste après l'interpellation
    if (t.mesure === "al") {
      // sans garde à vue, personne ne peut être retenu jusqu'au lendemain : l'audition suit l'interpellation, même tard
      if (C.aud < h + 45 || C.aud > h + 240) { const du = C.audFin - C.aud; C.aud = h + int(r, 50, 110); C.audFin = C.aud + du; }
      return;
    }
    // faits juste après minuit et interpellation avancée (« heures ») : toute la mesure glisse, pour suivre les faits
    if (C.interp < 25) { const dec = 25 - C.interp + int(r, 5, 40); for (const x of ["debut", "interp", "notif", "avisPq", "avisAv", "aud", "audFin"]) if (C[x] != null) C[x] += dec; }
    if (C.interp - h < 6 || C.interp - h > 40) t.d.h = Math.max(0, C.interp - int(r, 8, 22));
  };

  // la tenue de l'auteur, la même pour la vidéo, l'interpellation et les témoins
  SIM.tenueAuteur = (t) => (CR.video ? CR.video.tenue(t.sig + ":tenue", { hauts: ["sweat", "sweat", "doudoune", "blouson", "survet"], capuche: 0.7, chauss: pk(CR.seeded(t.sig + ":chauss"), ["blanches", "blanches", "noires"]) }) : null);

  // Support du dossier (lot 0, étalon e-Barreau) : la procédure pénale numérique arrive à Paris pour le juge unique sur
  // convocation le 29 juin 2026, pour les audiences collégiales et les défèrements en décembre 2026, pour les comparutions
  // immédiates début 2027 ; ailleurs, généralisation à l'été 2027. Une garde à vue suivie d'un défèrement suit le défèrement.
  SIM.numerique = function (t, TJ) {
    const d = t.d.faits, paris = TJ && TJ.paris;
    if (paris) return d >= CR.dayOf(2026, 12, 1);
    return d >= CR.dayOf(2027, 7, 1);
  };

  // ---------------------------------------------------------------- simulation
  // k : { N, C, VID, SF, TJ, opjN, has, irr, dou, A, V, T }
  SIM.simuler = function (t, k) {
    const r = CR.seeded(t.sig + ":sim");
    const { N, C, A, V, T } = k;
    const has = k.has, irr = k.irr, dou = k.dou;
    const S = { t, jf: t.d.faits, proc: t.proc, imprevus: [], arrachage: SIM.arrachage(t), numerique: SIM.numerique(t, k.TJ) };
    // garde à vue ou audition libre (art. 61-1) ; issue : défèrement, convocation remise (art. 390-1), convocation par
    // procès-verbal (art. 394), citation, ordonnance pénale, ou garde à vue en cours
    S.mesure = t.mesure; S.gav = t.mesure === "gav";
    S.issue = t.genre === "ci" ? "defere" : t.genre === "gav" ? null : t.genre === "op" ? "op" : t.voie === "cppv" ? "cppv" : t.voie === "citation_parquet" ? "citation" : "copj";
    const T0 = ((t.d.h % 1440) + 1440) % 1440;
    S.T0 = T0; S.sec = int(r, 5, 55);
    // ---- les faits
    S.lieu = { texte: N.lieu || t.rue || (k.SF ? k.SF.nom : ""), rue: t.rue, SF: k.SF, TJ: k.TJ };
    S.itt = t.f.itt || 0;
    S.blessures = (N.lesions || []).slice();
    if (!S.arrachage) return generique(S, t, k, r);
    const c0 = (N.constat || [])[0] || "";
    S.fuite = /trottinette/.test(c0) ? "trottinette" : /scooter/.test(c0) ? "scooter" : "pied";
    S.objet = { nom: N.objet || t.f.objet, valeur: N.valeur || t.f.valeur, type: /chaîne|collier/.test(t.f.objet) ? "chaine" : /montre|bracelet/.test(t.f.objet) ? "poignet" : "telephone" };
    S.objet.retrouve = has("saisie");
    S.violence = t.quoi !== "violence" && (t.f.itt > 0 || (t.f.agg || []).includes("violence0"));
    S.chute = S.violence; // le catalogue : « On m'a poussé, je suis tombé » dès qu'il y a violence
    // ce que la victime affirme (sa plainte), qui peut différer de ce qui s'est passé : doute « sans violence »
    S.dit = { violence: t.f.itt > 0 || (t.f.agg || []).includes("violence0") };
    S.lieu.texte = N.lieu || t.rue;
    const st = CR.METRO && k.SF && k.SF.geo ? CR.METRO.proches(k.SF.geo, 3) : [];
    S.lieu.station = st.length ? pk(r, st.slice(0, 2)) : null;
    S.video = k.VID || null;
    S.tenueA = k.VID ? k.VID.tenueClient : SIM.tenueAuteur(t);
    S.victimeTel = true; // « Je marchais en téléphonant » (catalogue)
    S.direction = S.fuite === "pied" ? (S.lieu.station ? `vers la station ${S.lieu.station.nom}` : "vers la bouche de métro") : pk(r, ["en direction du boulevard", "vers les rues voisines", "à contresens de la circulation"]);
    // ---- ce que chacun sait, a vu, croit
    const desc = (tn) => (tn && CR.video ? CR.video.decrire(tn) : "des vêtements sombres");
    const H = (tn) => (tn && CR.video ? CR.video.VESTIAIRE.HAUTS[tn.haut] : null);
    S.savoirs = {
      V: {
        vu: dou("doute_ident") ? "de dos, une fraction de seconde" : pk(r, ["de profil, pendant qu'il s'enfuyait", "de trois quarts, au moment où il a tiré", "de dos puis de profil"]),
        tenue: S.tenueA ? (dou("doute_ident") ? fausse(S.tenueA, r) : partielle(S.tenueA, r)) : null,
        age: ((a) => (a < 23 ? pk(r, ["une vingtaine d'années", "jeune, moins de vingt-cinq ans"]) : a < 32 ? pk(r, ["entre vingt-cinq et trente ans", "une petite trentaine"]) : a < 45 ? pk(r, ["la trentaine", "entre trente-cinq et quarante ans"]) : a < 58 ? "la cinquantaine" : "une soixantaine d'années"))(A.age + int(r, -4, 4)),
        taille: pk(r, [A.g === "f" ? "plutôt grande" : "plutôt grand", "taille moyenne", "assez mince, taille moyenne"]),
        reconnait: dou("doute_ident") ? "non" : ch(r, 0.7) ? "oui" : "pense",
      },
      T: T ? {
        ou: S.lieu.station && S.fuite === "pied" ? `à la sortie de la station ${S.lieu.station.nom}` : pk(r, ["à l'arrêt de bus", "à la terrasse du café d'en face", "sur le trottoir d'en face"]),
        identifie: has("temoin"), // sans audition au dossier, le témoin est parti avant l'arrivée de la police
        tenue: S.tenueA ? desc(S.tenueA) : null,
        contra: dou("temoin_contra"),
        sansViolence: t.quoi === "violence",
      } : null,
      A: { version: t.stance, objetSurLui: S.objet.retrouve },
    };
    if (T && !has("temoin")) S.imprevus.push({ k: "temoin_parti", txt: "Le témoin des faits est reparti avant l'arrivée de la patrouille sans laisser son identité." });
    // ---- l'enquête, acte par acte (minutes depuis minuit du jour des faits ; au-delà de 1440 : le lendemain)
    const E = {};
    E.appel = T0 + int(r, 1, 3);
    E.requis = E.appel + int(r, 1, 2);
    E.interp = C.interp;
    E.surPlace = Math.min(E.interp - 2, E.requis + int(r, 4, 9));
    if (E.surPlace <= E.requis) E.surPlace = E.requis + 1;
    E.presentation = E.interp + int(r, 7, 12);
    E.debut = C.debut; E.notif = C.notif; E.avisPq = C.avisPq; E.avisAv = C.avisAv;
    S.famille = { demande: ch(r, 0.65), qui: A.proche || "sa mère", carence: ch(r, 0.25) };
    S.famille.h = E.notif + int(r, 15, 95);
    S.medecin = { demande: ch(r, 0.35) };
    if (S.medecin.demande) { S.medecin.req = E.notif + int(r, 5, 15); S.medecin.examen = S.medecin.req + int(r, 50, 170); if (S.medecin.examen - S.medecin.req > 150) S.imprevus.push({ k: "medecin_tard", txt: "Le médecin requis n'a pu se déplacer qu'au bout de plus de deux heures." }); }
    E.victime = C.debut + 45; E.victimeFin = E.victime + int(r, 25, 45);
    E.temoin = has("temoin") && T ? E.victimeFin + int(r, 5, 25) : null; E.temoinFin = E.temoin != null ? E.temoin + int(r, 15, 30) : null;
    if (E.temoin != null && ch(r, 0.3)) { E.temoin += 720; E.temoinFin += 720; S.imprevus.push({ k: "temoin_lendemain", txt: "Le témoin, pressé, n'est revenu au service que le lendemain matin pour son audition." }); }
    E.scelle = S.objet.retrouve ? E.presentation + int(r, 3, 10) : null;
    E.restitution = S.objet.retrouve ? E.victimeFin + int(r, 2, 10) : null;
    if (S.video) { E.reqVideo = C.debut + int(r, 25, 50); E.video = E.reqVideo + int(r, 150, 400); }
    E.umj = has("certificat") ? { req: E.victimeFin - 5, examen: 1440 + int(r, 9 * 60, 14 * 60) } : null;
    if (t.genre === "ci") {
      E.aud = C.aud; E.audFin = C.audFin;
      E.prolong = C.debut < 10 * 60 + 30;
      E.fin = E.prolong ? C.debut + 1440 + int(r, 40, 150) : 1440 + int(r, 7 * 60 + 30, 9 * 60 + 30);
      E.synthese = E.fin + int(r, 8, 20);
      E.repas = [12 * 60 + 15, 19 * 60 + 10, 1440 + 7 * 60 + 30, 1440 + 12 * 60 + 15].filter((m) => m > C.debut + 20 && m < E.fin);
      if (E.video != null && E.video > E.aud) S.videoApresAudition = true;
      if (E.umj) E.umj.examen = Math.max(E.victimeFin + int(r, 60, 120), Math.min(E.umj.examen, E.fin - int(r, 50, 90)));
    }
    S.E = E;
    // ---- les auteurs des pièces : un style chacun
    S.auteurs = {
      apj: { nom: t.gpx[0], style: CR.DOCS.style(CR.seeded(t.sig + ":apj")) },
      opj: { nom: k.opjN, style: CR.DOCS.style(CR.seeded(t.sig + ":opj")) },
    };
    S.indicatif = `TV ${pk(r, ["17", "18", "19", "20", "21", "22"])}${pk(r, ["1", "2", "3", "4"])}`;
    S.nGAV = int(r, 1, 4); // gardés à vue dans le service cette nuit-là
    if (S.nGAV >= 3) S.imprevus.push({ k: "service_charge", txt: `${S.nGAV} personnes gardées à vue pour un seul officier de quart.` });
    S.blessures = S.itt ? pk(r, [["une dermabrasion de 3 cm sur 1 cm à la face postérieure du cou", "une ecchymose violacée de 4 cm à la face externe du genou droit"], ["une dermabrasion linéaire de la face latérale gauche du cou", "des érosions superficielles de la paume de la main droite"], ["une ecchymose de 5 cm sur 3 cm au coude gauche", "une dermabrasion du genou gauche", "une douleur à la mobilisation de l'épaule gauche, sans déformation"]]) : [];
    return S;
  };

  // ---------------------------------------------------------------- les autres délits de flagrance
  // Les faits viennent du catalogue (constatations, plainte, témoignage, saisie, audition) ; la simulation fixe la
  // chronologie de l'enquête, les actes de la garde à vue et les imprévus, et recale les heures des constatations.
  const STUPS = ["stups_detention", "stups_trafic", "stups_usage"];
  // minute « au bureau » d'un jour donné (compté depuis le jour des faits) : entre 9 heures et 18 heures
  const bureau = (r, jour, a, b) => jour * 1440 + int(r, a || 9 * 60, b || 18 * 60);
  function generique(S, t, k, r) {
    const { C, N, A, V, T } = k, has = k.has, irr = k.irr;
    const E = {};
    S.T0 = ((t.d.h % 1440) + 1440) % 1440;
    // enquête préliminaire : la plainte d'abord, l'enquête, puis la garde à vue des jours plus tard (C est daté du jour C.jg)
    S.prelim = !t.flagrance;
    // garde à vue ou audition libre (art. 61-1) ; issue : défèrement, convocation remise (art. 390-1), convocation par
    // procès-verbal (art. 394), citation, ordonnance pénale, ou garde à vue en cours
    const base = S.prelim ? (C.jg - S.jf) * 1440 : 0, c = (m) => m + base;
    S.base = base;
    if (S.gav) {
      E.interp = c(C.interp);
      E.debut = c(C.debut); E.notif = c(C.notif); E.avisPq = c(C.avisPq); E.avisAv = c(C.avisAv);
    } else {
      // audition libre : interpellé puis conduit au service (flagrance, art. 73), ou venu sur convocation (préliminaire)
      E.aud = c(C.aud); E.audFin = c(C.audFin);
      E.interp = S.prelim ? E.aud - int(r, 5, 20) : S.T0 + int(r, 8, 30);
      if (!S.prelim && E.aud < E.interp + 35) { const du = E.audFin - E.aud; E.aud = E.interp + int(r, 40, 80); E.audFin = E.aud + du; }
      E.debut = S.prelim ? E.interp : E.interp + int(r, 10, 25); E.notif = E.aud;
    }
    E.requis = Math.max(S.T0, E.interp - int(r, 8, 18));
    E.surPlace = Math.min(E.interp - 1, E.requis + int(r, 3, 7));
    E.presentation = E.interp + int(r, 7, 14);
    if (!S.gav) E.presentation = Math.min(E.presentation, E.aud - 5);
    if (S.prelim) {
      // interpellé à son domicile au petit matin, ou présent au service sur convocation
      const h = ((C.interp % 1440) + 1440) % 1440;
      S.venue = S.gav && (h < 7 * 60 + 30 || (h < 11 * 60 && CR.seeded(t.sig + ":venue")() < 0.45)) ? "domicile" : "convocation";
      E.presentation = S.venue === "domicile" ? E.interp + int(r, 25, 45) : E.interp;
      // la plainte : le jour dit par le tirage, aux heures du service, après les faits
      const jp = (t.d.plainte != null ? t.d.plainte : S.jf) - S.jf;
      // bornes : après les faits ; la veille de la mesure au plus tard, sauf mesure le jour même
      const lo = S.T0 + 45, hi = E.debut - 600 >= lo + 60 ? E.debut - 600 : E.debut - 30;
      let mp = bureau(r, jp);
      if (mp < lo) mp = lo + int(r, 15, 135);
      const hp = ((mp % 1440) + 1440) % 1440;
      if (hp > 21 * 60) mp = bureau(r, Math.floor(mp / 1440) + 1, 9 * 60, 11 * 60);
      else if (hp < 8 * 60) mp = bureau(r, Math.floor(mp / 1440), 9 * 60, 11 * 60);
      if (mp > hi) mp = hi - 1440 * int(r, 2, 6);
      if (mp < lo) mp = Math.min(hi, lo + int(r, 15, 60));
      E.plainte = mp;
      // les actes d'enquête entre la plainte et la garde à vue (auditions, réquisitions, expertises) : aux heures du
      // service les jours suivants, ou dans l'intervalle quand la mesure suit de près
      const j1 = Math.floor(mp / 1440) + 1, j2 = Math.max(j1, Math.floor(E.debut / 1440) - 1);
      E.enquete = j1 <= Math.floor(E.debut / 1440) - 1
        ? (i) => bureau(CR.seeded(t.sig + ":enq" + i), Math.min(j2, j1 + Math.floor(((j2 - j1) * (i + 1)) / 5)))
        : (i) => Math.round(mp + ((E.debut - mp) * (i + 1)) / 7);
      S.convocation = S.venue === "convocation" ? E.debut - 1440 * int(r, 1, S.gav ? 4 : 12) + int(r, -120, 120) : null;
    }
    S.famille = { demande: ch(r, 0.6), qui: A.proche || "sa mère", carence: ch(r, 0.25) };
    S.famille.h = E.notif + int(r, 15, 95);
    S.medecin = { demande: ch(r, STUPS.includes(t.inf) || t.inf === "alcool" ? 0.5 : 0.3) };
    if (!S.gav) { S.famille.demande = false; S.medecin.demande = false; } // droits de la garde à vue seulement
    if (S.medecin.demande) { S.medecin.req = E.notif + int(r, 5, 15); S.medecin.examen = S.medecin.req + int(r, 50, 170); if (S.medecin.examen - S.medecin.req > 150) S.imprevus.push({ k: "medecin_tard", txt: "Le médecin requis n'a pu se déplacer qu'au bout de plus de deux heures." }); }
    S.victime = !!(V && has("plainte"));
    E.victime = S.prelim ? E.plainte : E.debut + int(r, 35, 70); E.victimeFin = E.victime + int(r, 25, 50);
    E.temoin = has("temoin") && T ? (S.prelim ? E.enquete(0) : E.victimeFin + int(r, 5, 25)) : null; E.temoinFin = E.temoin != null ? E.temoin + int(r, 15, 30) : null;
    if (!S.prelim && E.temoin != null && ch(r, 0.25)) { E.temoin += 720; E.temoinFin += 720; S.imprevus.push({ k: "temoin_lendemain", txt: "Le témoin n'a pu revenir au service que le lendemain matin pour son audition." }); }
    // stupéfiants : pesée et test au service ; perquisition au domicile pendant la mesure, aux heures légales (art. 59)
    S.stups = STUPS.includes(t.inf);
    if (S.stups && N.saisie) E.pesee = E.presentation + int(r, 10, 30);
    S.perq = ["stups_detention", "stups_trafic", "recel", "cambriolage", "blanchiment", "abs"].includes(t.inf) || (S.prelim && has("saisie")); // en préliminaire, toute saisie passe par une perquisition
    if (S.perq) {
      if (irr("perq_nuit")) E.perq = base + 1440 + 5 * 60 + int(r, 20, 50);
      else { let m = (S.gav ? E.notif : E.audFin) + int(r, 40, 120); const h = ((m % 1440) + 1440) % 1440; if (h < 6 * 60 + 5) m += 6 * 60 + int(r, 5, 50) - h; else if (h > 20 * 60 + 30) m += 1440 - h + 6 * 60 + int(r, 5, 50); E.perq = m; }
      E.perqFin = E.perq + int(r, 40, 110);

    }
    S.constatDecouvre = (N.constat || []).some((x) => /découv/i.test(x));
    S.objetRetrouve = !!(N.saisie && has("saisie") && ["vol", "recel", "cambriolage"].includes(t.inf) && V);
    if (S.objetRetrouve) {
      // trouvé sur la personne à l'interpellation, ou chez elle à la perquisition (préliminaire)
      E.scelle = S.prelim && E.perqFin ? E.perqFin + int(r, 10, 30) : E.presentation + int(r, 3, 12);
      E.restitution = Math.max(E.victimeFin, E.scelle) + int(r, 30, 240);
    }
    E.umj = has("certificat") ? { req: E.victimeFin - 5, examen: S.prelim ? bureau(r, Math.floor(E.victime / 1440) + 1) : 1440 + int(r, 9 * 60, 14 * 60) } : null;
    if (t.genre === "ci") {
      E.aud = c(C.aud); E.audFin = c(C.audFin);
      E.prolong = C.debut < 10 * 60 + 30;
      E.fin = E.prolong ? E.debut + 1440 + int(r, 40, 150) : base + 1440 + int(r, 7 * 60 + 30, 9 * 60 + 30);
      if (E.restitution && E.restitution > E.fin - 20) E.restitution = E.fin - int(r, 20, 60);
      // en comparution immédiate, le certificat de l'UMJ est au dossier avant le défèrement
      if (E.umj && !S.prelim) E.umj.examen = Math.max(E.victimeFin + int(r, 60, 120), Math.min(E.umj.examen, E.fin - int(r, 50, 90)));
      if (E.perqFin && E.perqFin > E.fin - 30) E.fin = E.perqFin + int(r, 40, 90);
      E.synthese = E.fin + int(r, 8, 20);
      E.repas = [12 * 60 + 15, 19 * 60 + 10, 1440 + 7 * 60 + 30, 1440 + 12 * 60 + 15].map((m) => m + base).filter((m) => m > E.debut + 20 && m < E.fin);
    } else if (t.genre !== "gav") {
      // garde à vue levée ou audition libre, puis convocation, citation ou ordonnance pénale : la personne repart libre
      if (S.gav) {
        E.aud = c(C.aud); E.audFin = c(C.audFin);
        E.prolong = false;
        E.fin = irr("prolongation") ? E.debut + 1440 + int(r, 30, 120) : E.audFin + int(r, 40, 180);
        if (E.perqFin && E.perqFin > E.fin - 30) E.fin = E.perqFin + int(r, 30, 80);
        if (E.restitution && E.restitution > E.fin - 20) E.restitution = E.fin - int(r, 20, 60);
        E.repas = [12 * 60 + 15, 19 * 60 + 10, 1440 + 7 * 60 + 30, 1440 + 12 * 60 + 15].map((m) => m + base).filter((m) => m > E.debut + 20 && m < E.fin);
      } else E.fin = E.audFin;
      E.remise = E.fin + int(r, 3, 12); // convocation remise, ou personne laissée libre
      // la synthèse attend les derniers actes (certificat de l'UMJ, restitution, perquisition)
      E.synthese = Math.max(E.remise, E.perqFin || 0, E.umj ? E.umj.examen : 0, E.restitution || 0, E.scelle || 0) + int(r, 30, 150);
    }
    // lot 1 ter : le vol en magasin, au niveau de l'arrachage
    if (SIM.magasin(t, S)) S.magasin = magasin(S, t, k, r, E);
    if (SIM.transport(t, S)) S.transport = transport(S, t, k, r, E);
    if (SIM.tire(t, S)) S.tire = tire(S, t, k, r, E);
    if (SIM.deuxRoues(t, S)) S.deuxRoues = deuxRoues(S, t, k, r, E);
    if (SIM.deal(t, S)) S.deal = deal(S, t, k, r, E);
    if (SIM.detention(t, S)) S.detention = detention(S, t, k, r);
    if (SIM.rebellion(t, S)) S.rebellion = { passif: ch(r, 0.25), ordre: ch(r, 0.2), passant: k.has("video") || k.has("temoin"), duree: int(r, 20, 90) };
    if (SIM.outrage(t, S)) S.outrage = { ecart: ch(r, 0.3), cantonade: ch(r, 0.25), passant: k.has("video"), autre: pk(r, ["chiens", "bâtards", "guignols", "racistes", "bons à rien"]) };
    S.E = E;
    S.auteurs = { apj: { nom: t.gpx[0], style: CR.DOCS.style(CR.seeded(t.sig + ":apj")) }, opj: { nom: k.opjN, style: CR.DOCS.style(CR.seeded(t.sig + ":opj")) } };
    S.indicatif = `TV ${pk(r, ["17", "18", "19", "20", "21", "22"])}${pk(r, ["1", "2", "3", "4"])}`;
    S.nGAV = int(r, 1, 4);
    if (S.nGAV >= 3) S.imprevus.push({ k: "service_charge", txt: `${S.nGAV} personnes gardées à vue pour un seul officier de quart.` });
    // les heures écrites dans les constatations du catalogue suivent la chronologie simulée
    let cur = null;
    if (S.prelim) cur = E.interp; // résumés d'enquête : par sécurité, une heure qui s'y trouverait suit la garde à vue
    S.constat = (N.constat || []).map((x) => x.replace(/(\bdes [^;.]*?) est visible/, "$1 sont visibles").replace(/\b1e étage/, "1er étage")).map((x, i) => x.replace(/\b(\d{1,2}) h (\d{2})\b/g, () => {
      if (cur == null) cur = /surveillance|à partir de/i.test(x) ? E.interp - int(r, 25, 60) : /^Requis/i.test(x) ? E.requis : E.interp - int(r, 2, 6);
      else cur += int(r, 1, 4);
      return CR.DOCS.hm(cur);
    }));
    // vol à la tire : l'objet retrouvé au sol n'était pas « en possession » de l'intéressé
    // outrage : les propos, tels que les rapporte le premier policier (constatations) ; à la cantonade, ils sont dits « à la cantonade »
    if (S.outrage) {
      const O = S.outrage;
      const m = /« (.+?) »/.exec(S.constat.join(" "));
      O.mots = m ? m[1] : "";
      const autre = O.mots.replace(/Vous êtes des ([^.!]+)/, (m0, x) => `Vous êtes des ${x === O.autre ? "pourris" : O.autre}`);
      O.mots2 = O.ecart && autre !== O.mots ? autre : O.mots;
      O.ecart = O.mots2 !== O.mots;
      if (O.cantonade) S.constat = S.constat.map((x) => x.replace(/nous déclare à voix haute :/, "lance à voix haute, en direction de la rue et sans se tourner vers nous :"));
    }
    if (S.detention) {
      const D = S.detention, ajout = [];
      if (D.dom) ajout.push(D.coloc ? `L'appartement, ${D.pieces === "un studio" ? "un studio" : "de " + D.pieces}, est partagé avec un colocataire, ${D.colocN}, absent lors de la perquisition ; la cuisine est commune.` : `${A.g === "f" ? "L'intéressée" : "L'intéressé"} occupe seul${A.g === "f" ? "e" : ""} l'appartement, ${D.pieces === "un studio" ? "un studio" : "de " + D.pieces}.`);
      else ajout.push(`Le véhicule, ${D.modele}, ${D.tiers ? `appartient à ${D.proprio}` : "est au nom de l'intéressé" + (A.g === "f" ? "e" : "")} ; ${D.passagers ? `${D.passagers === 1 ? "un passager est" : "deux passagers sont"} à bord` : "le conducteur est seul à bord"}.`);
      S.constat = S.constat.concat(ajout);
    }
    if (S.deal) {
      const D = S.deal, nb = ["zéro", "une", "deux", "trois", "quatre", "cinq"];
      S.constat = S.constat.map((x) => x.replace("à trois personnes successives", `à ${nb[D.nT] || D.nT} personnes successives`)
        .replace(/^Interpellation ; découverte de /, D.guet ? "Interpellation ; découverte, dans le hall, derrière la porte du local à poubelles, de " : D.cache ? `Interpellation ; découverte, ${D.cacheOu}, de ` : "Interpellation ; découverte de "));
    }
    if (S.deuxRoues && !S.deuxRoues.outilMain) S.constat = S.constat.map((x) => x.replace(/, un tournevis à la main\./, " ; un tournevis est au sol, à un mètre."));
    if (S.tire && S.tire.sol) S.constat = S.constat.map((x) => x.replace(/ est interpellée? en possession de (.+)\.$/, (m0, o) => ` est interpellé${A.g === "f" ? "e" : ""} ; ${o} est retrouvé au sol, près de ${A.g === "f" ? "elle" : "lui"}.`));
    return S;
  }

  // ---------------------------------------------------------------- lot 1 ter : le vol en magasin
  // L'agent de sécurité repère l'auteur (aux écrans de contrôle ou en salle), le laisse franchir les caisses, le retient
  // après le portique (art. 73 : toute personne peut appréhender l'auteur d'un flagrant délit) et appelle la police.
  // La marchandise est décomptée article par article ; l'agent peut se tromper de bonne foi sur le nombre qu'il a vu.
  SIM.magasin = (t, S) => !!(t && t.inf === "vol" && t.f && t.f.sc === "magasin" && t.flagrance && !(S && S.prelim) && t.V);
  function magasin(S, t, k, r, E) {
    const N = k.N, has = k.has;
    const enseigne = ((/magasin (.+?), /.exec(N.lieu || "") || [])[1]) || "le magasin";
    const NUM = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6 };
    const m = /^(un|une|deux|trois|quatre|cinq|six|des)\s+(.*)$/.exec(t.f.objet || "");
    const qte = m ? (m[1] === "des" ? int(r, 2, 4) : NUM[m[1]]) : 1;
    const lib = m ? m[2] : t.f.objet;
    const pu = Math.round((t.f.valeur / qte) * 100) / 100;
    const prenom = pk(r, ["Moussa", "Kevin", "Yacine", "Sébastien", "Fatou", "Aïssatou", "Steeve", "Nadia"]);
    const agent = { prenom, nom: pk(r, ["Diallo", "Martin", "Benali", "Lefèvre", "Camara", "Rousseau", "Traoré"]), g: /^(Fatou|Aïssatou|Nadia)$/.test(prenom) ? "f" : "m", societe: pk(r, ["Sécuritas", "Prosegur", "Fiducial Sécurité", "Seris"]), age: int(r, 24, 52) };
    const ecrans = ch(r, 0.55);
    const rayon = pk(r, ["au fond du rayon", "dans l'allée centrale", "près des rayonnages du fond", "à l'angle du rayon"]);
    E.repere = S.T0 - int(r, 6, 18); E.portique = S.T0;
    E.appelMag = Math.max(S.T0, E.requis - int(r, 1, 2));
    E.agent = E.debut + int(r, 20, 45); E.agentFin = E.agent + int(r, 15, 25);
    if (E.fin && E.agentFin > E.fin - 15) { E.agentFin = E.fin - 15; E.agent = E.agentFin - 15; }
    E.etat = E.agentFin + int(r, 3, 10);
    // l'erreur de bonne foi : l'agent croit avoir vu un article de plus
    const qteDit = qte > 1 && ch(r, 0.22) ? qte + 1 : qte;
    const M = {
      enseigne, lib, qte, pu, total: Math.round(pu * qte * 100) / 100, agent, ecrans, rayon,
      portique: ch(r, 0.6), sac: pk(r, ["son sac à dos", "son sac à dos", "la poche intérieure de son blouson", "un sac de course"]),
      qteDit, vente: ch(r, 0.75), video: has("video"), caisse: ch(r, 0.4), // passé en caisse en payant un autre article
    };
    S.savoirs = Object.assign({}, S.savoirs, { agent: { vu: ecrans ? "aux écrans de contrôle" : "en salle, à quelques mètres", compte: qteDit, erreur: qteDit !== qte } });
    return M;
  }

  // ---------------------------------------------------------------- lot 1 ter : le vol dans le métro
  // Une patrouille en civil de la brigade des réseaux franciliens suit l'auteur depuis le quai, le voit se placer derrière
  // la victime à la fermeture des portes et glisser la main dans sa poche ; interpellation à la station suivante. La
  // victime n'a rien senti. L'observation se fait dans une rame plus ou moins bondée, à quelques mètres ; le policier et
  // la victime peuvent ne pas situer l'objet dans la même poche (erreur de bonne foi, de l'un ou de l'autre).
  SIM.transport = (t, S) => !!(t && t.inf === "vol" && t.f && t.f.sc === "transport" && t.flagrance && !(S && S.prelim) && t.V);
  function transport(S, t, k, r, E) {
    const N = k.N;
    const m = /entre les stations (.+?) et (.+)$/.exec(N.lieu || "") || [];
    const de = m[1] || "Barbès-Rochechouart", vers = m[2] || "Gare du Nord";
    const bondee = ch(r, 0.5);
    const poche = pk(r, ["droite", "gauche"]);
    const pocheV = ch(r, 0.2) ? (poche === "droite" ? "gauche" : "droite") : poche;
    E.filature = S.T0 - int(r, 4, 14);
    E.geste = S.T0;
    E.interpT = S.T0 + int(r, 2, 4); // la station suivante
    S.savoirs = Object.assign({}, S.savoirs, { brf: { distance: bondee ? pk(r, ["deux mètres", "trois mètres"]) : pk(r, ["un mètre cinquante", "deux mètres"]), poche, bondee }, Vpoche: pocheV });
    return { de, vers, ligne: (/ligne (\d+)/.exec(N.lieu || "") || [])[1] || "4", bondee, poche, pocheV, ecart: poche !== pocheV, quai: de, filStation: ((L4) => { const i = L4.indexOf(de); return i > 0 ? pk(r, L4.slice(0, i + 1)) : de; })(["Porte de Clignancourt", "Simplon", "Marcadet-Poissonniers", "Château-Rouge", "Barbès-Rochechouart", "Gare du Nord"]),
      reunion: (t.f.agg || []).includes("reunion"), violence: (t.f.agg || []).includes("violence0") };
  }

  // ---------------------------------------------------------------- lot 1 ter : le vol à la tire (la « pétition »)
  // Un groupe aborde la victime avec une pétition ; pendant qu'elle signe, son sac est ouvert. Personne n'a vu la main :
  // la victime s'en aperçoit quelques minutes plus tard, désigne le groupe qui s'éloigne, la patrouille l'arrête. L'objet est
  // retrouvé sur l'auteur, ou au sol à ses pieds (il s'en est débarrassé, ou un autre l'y a jeté). La victime et les
  // policiers ne comptent pas toujours le même nombre de personnes.
  SIM.tire = (t, S) => !!(t && t.inf === "vol" && t.f && t.f.sc === "tire" && t.flagrance && !(S && S.prelim) && t.V);
  function tire(S, t, k, r, E) {
    const nV = int(r, 2, 4), nP = ch(r, 0.3) ? Math.max(2, nV - 1) : nV;
    const sol = ch(r, 0.3);
    E.abord = S.T0 - int(r, 3, 6); E.decouvre = Math.max(S.T0, Math.min(S.T0 + int(r, 2, 6), E.requis - 1));
    return { nV, nP, ecart: nV !== nP, sol, distance: pk(r, ["une trentaine de mètres", "une cinquantaine de mètres", "le bas de la rue"]), langue: pk(r, ["anglais", "espagnol", "italien", "allemand"]), role: pk(r, ["tenait la planchette de la pétition", "parlait à la victime", "se tenait derrière elle"]) };
  }

  // ---------------------------------------------------------------- lot 1 ter : le vol de deux-roues
  // L'alerte vient d'un riverain (à sa fenêtre, souvent la nuit) ou du propriétaire (son traceur signale un mouvement).
  // À l'arrivée de la patrouille, l'intéressé est près de l'engin : l'outil à la main ou au sol, l'engin déplacé ou non.
  SIM.deuxRoues = (t, S) => !!(t && t.inf === "vol" && t.f && t.f.sc === "vehicule" && t.flagrance && !(S && S.prelim) && t.V);
  function deuxRoues(S, t, k, r, E) {
    const h = ((S.T0 % 1440) + 1440) % 1440, nuit = h < 6 * 60 + 30 || h > 21 * 60;
    const appel = ch(r, 0.7) ? "riverain" : "traceur";
    return {
      appel, nuit, etage: pk(r, ["deuxième", "troisième", "quatrième", "cinquième"]), outilMain: ch(r, 0.7), deplace: ch(r, 0.4),
      metres: int(r, 3, 15), eclairage: nuit ? pk(r, ["sous un réverbère", "dans la pénombre, entre deux réverbères", "éclairé par la vitrine d'une pharmacie"]) : "en plein jour",
      degats: pk(r, ["neiman forcé, carénage avant fendu", "neiman forcé, câbles du contacteur arrachés", "neiman arraché, antivol en U intact au sol"]),
    };
  }

  // ---------------------------------------------------------------- lot 1 ter : le point de deal
  // Les policiers observent d'un poste (véhicule banalisé, appartement prêté, angle de rue) à une distance donnée, parfois
  // gênés (feuillage, passants) ; ils voient des remises successives, à des heures précises ; un acheteur est contrôlé, ou
  // non. La drogue est sur l'intéressé, ou dans une cache à quelques mètres : la détention se discute alors. Le guetteur,
  // lui, n'a rien sur lui : ce sont ses cris et sa place qui le désignent.
  SIM.deal = (t, S) => !!(t && t.inf === "stups_trafic" && t.f && ["point_deal", "guetteur"].includes(t.f.sc) && t.flagrance && !(S && S.prelim));
  function deal(S, t, k, r, E) {
    const guet = t.f.sc === "guetteur";
    const poste = pk(r, ["d'un véhicule banalisé stationné", "d'un appartement mis à disposition par un riverain, au deuxième étage,", "de l'angle de la rue"]);
    const distance = int(r, 2, 8) * 10;
    const gene = ch(r, 0.35) ? pk(r, ["à travers le feuillage d'un platane", "entre les passants", "par intermittence, des véhicules passant dans notre champ"]) : null;
    E.debutSurv = S.T0 - int(r, 35, 90);
    const nT = guet ? 0 : int(r, 2, 4);
    const tr = []; let m = E.debutSurv + int(r, 6, 15);
    for (let i = 0; i < nT; i++) { tr.push(m); m += int(r, 6, 18); }
    const cache = !guet && ch(r, 0.35);
    return {
      guet, poste, distance, gene, nT, tr, cache, acheteur: !guet && ch(r, 0.55),
      cacheOu: pk(r, ["dans une boîte aux lettres éventrée du hall", "dans un trou du muret, à trois mètres", "sous la grille d'un arbre, à cinq mètres"]),
      cri: pk(r, ["Ara ! Ara !", "Ça bouge !", "Les condés !"]),
    };
  }

  // ---------------------------------------------------------------- lot 1 ter : l'outrage
  // Deux policiers ont entendu les propos ; le second ne rapporte pas toujours les mêmes mots (de bonne foi). Les propos
  // sont parfois lancés « à la cantonade », vers la rue, plutôt qu'adressés aux policiers ; un passant a parfois filmé.
  // rébellion : le second policier, ou un passant, décrit parfois une résistance passive (se laisser tomber, se raidir) là où
  // les constatations disent « se débat » ; parfois aussi l'ordre des gestes : la clé de bras avant le refus.
  SIM.rebellion = (t, S) => !!(t && t.inf === "rebellion" && t.flagrance && !(S && S.prelim));
  SIM.outrage = (t, S) => !!(t && t.inf === "outrage" && t.flagrance && !(S && S.prelim));
  // ---------------------------------------------------------------- lot 1 ter : la détention de stupéfiants
  // Ce qui fait l'affaire : à qui sont les produits. Au domicile, un colocataire partage parfois la cuisine où est le
  // placard ; en voiture, le véhicule est parfois celui d'un tiers et des passagers sont à bord. La balance et les sachets
  // vides, quand il y en a, tirent vers le trafic ; leur absence, vers l'usage.
  SIM.detention = (t, S) => !!(t && t.inf === "stups_detention" && t.f && ["domicile", "voiture"].includes(t.f.sc) && t.flagrance && !(S && S.prelim));
  function detention(S, t, k, r) {
    const dom = t.f.sc === "domicile";
    const prenom = pk(r, ["Yanis", "Mehdi", "Lucas", "Inès", "Sofiane", "Clara"]), nom = pk(r, ["Bensalem", "Garnier", "Diakité", "Morel", "Haddad"]);
    return {
      dom, coloc: dom && ch(r, 0.35), colocN: `${prenom} ${nom}`, pieces: pk(r, ["deux pièces", "trois pièces", "un studio"]),
      tiers: !dom && ch(r, 0.4), proprio: pk(r, ["sa sœur", "un ami", "une société de location"]), passagers: dom ? 0 : pk(r, [0, 0, 1, 2]),
      modele: pk(r, ["une Renault Clio grise", "une Peugeot 208 noire", "une Citroën C3 blanche"]),
    };
  }

  // la victime se trompe sur un ou deux éléments (doute sur l'identification)
  function fausse(tn, r) {
    const V = CR.video.VESTIAIRE, x = Object.assign({}, tn);
    const autres = Object.keys(V.COUL).filter((c) => c !== tn.hautC && c !== "jean" && V.HAUTS[tn.haut].coul.includes(c));
    if (autres.length) x.hautC = pk(r, autres);
    if (ch(r, 0.5)) x.tete = tn.tete === "capuche" ? null : V.HAUTS[tn.haut].capuche ? "capuche" : tn.tete;
    return { tenue: x, texte: decrireVictime(x), faux: true };
  }
  // la victime n'a retenu qu'une partie de la tenue
  function partielle(tn, r) { return { tenue: tn, texte: decrireVictime(tn, ch(r, 0.5)), faux: false }; }
  function decrireVictime(tn, avecBas) {
    const V = CR.video.VESTIAIRE, H = V.HAUTS[tn.haut], c = V.COUL[tn.hautC];
    let s = `${H.g === "f" ? "une" : "un"} ${H.nom} ${c[H.g]}`;
    if (tn.tete === "capuche") s += ", la capuche sur la tête";
    else if (tn.tete) s += `, ${tn.tete === "casquette" ? "une casquette" : "un bonnet"}`;
    if (avecBas) s += `, ${V.BAS[tn.bas].nom === "jean" ? "un jean" : "un pantalon"} ${V.COUL[tn.basC].m}`;
    return s;
  }
})();
