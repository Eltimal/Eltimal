/* La Permanence — la preuve filmée dans les affaires (1.5.0, D-101).
   CR.VPLAN.planifier(t), au tirage d'une affaire de la version 6 du générateur : les vidéos que l'affaire porte (la
   vidéoprotection de la rue, la caméra-piéton des policiers), ce qu'elles montrent et leurs failles. Une graine propre :
   le reste du tirage ne change pas. Quand l'image montre les faits, la preuve « video » entre dans l'affaire (elle pèse
   au jugement, et une nullité peut l'écarter).
   GEN2.pieces, enveloppé : la pièce jouable (procès-verbal d'exploitation ou de transcription) prend la cote suivante,
   ou remplace le procès-verbal vidéo seulement écrit quand l'affaire en avait un. Les affaires des versions 4 et 5 ne
   passent pas ici.
   Les failles, et ce que le jeu en fait (code de la sécurité intérieure et code de procédure pénale) :
   - images effacées : hors enquête, la vidéoprotection n'est conservée qu'un mois au plus (L252-5) ; une réquisition
     tardive trouve un enregistrement détruit. Un fait à relever, pas une nullité ;
   - réquisition sans autorisation du procureur en enquête préliminaire (art. 77-1-1 CPP) : l'irrégularité
     « requisition » déjà connue du jeu ; si l'affaire la porte, la nullité écarte aussi la vidéo ;
   - caméra-piéton déclenchée tard (L241-1 : l'enregistrement n'est pas permanent) : le début manque ; un fait à plaider ;
   - personne non informée qu'elle est filmée (L241-1 : « sauf si les circonstances l'interdisent ») : un fait à plaider
     sur la loyauté de la preuve. Le jeu n'en fait pas une nullité automatique : la jurisprudence n'a pas été lue. */
(function () {
  const CR = window.CR, GEN2 = CR.GEN2, CAT = CR.CAT, DOCS = CR.DOCS;
  if (!GEN2 || !GEN2.pieces || !CR.video || !CR.VRUE || !CR.VPIETON) return;
  // 1.5.1 (version 7 du générateur) : la vidéo filmée au téléphone (js/video-telephone.js). Une vidéo remise par une
  // personne privée est une preuve recevable (liberté de la preuve, art. 427 du code de procédure pénale) ; ses
  // failles se plaident : le début manque (qui a commencé ?), la fin est coupée, seule une copie a été exploitée
  // (l'original et ses métadonnées ne sont pas vérifiés).
  // 1.5.2 (version 8) : les caméras intérieures (js/video-interieur.js : hall d'immeuble, parking, bus) ; une faille de
  // plus : l'horloge de l'enregistreur décalée sur l'heure légale (tout rapprochement d'horaires est à corriger) ; le
  // recel découvert lors d'un contrôle, filmé par la caméra-piéton.
  // 1.5.3 (version 9) : la banque (js/video-banque.js : le distributeur, dont la caméra fait face au client, et le
  // journal de ses opérations ; le guichet) et la sonnette connectée (le palier, avec le son).
  // 1.5.4 (version 10) : d'autres sources (js/video-plus.js) : la caméra de bord d'un véhicule, l'appel vidéo
  // enregistré par la victime, l'intérieur d'un commerce (boutique, restaurant, bar), le RER.
  const VP = (CR.VPLAN = {});
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const ctxDe = (t) => (t.f && (t.f.sc || t.f.ctx)) || "";
  const agg = (t, k) => !!(t.f && (t.f.agg || []).includes(k));

  // ---------------------------------------------------------------- quelle vidéo pour quelle affaire
  const COUPS = { violences: ["rue", "file", "bar", "embuscade", "voisinage", "sport", "circulation", "happy_slapping"], violences_conj: ["rue"] };
  const MENACES = { menaces: ["rue", "voisin", "intimidation", "dette"], extorsion: ["racket"] };
  const DEGRAD = { degradations: { voiture: "voiture", vitrine: "vitrine", tag: "tag", porte: "vitrine", scooter: "voiture" }, vol: { vehicule: "voiture" } };
  const DEAL = { stups_trafic: ["point_deal", "guetteur", "livraison"] };
  const ROUTE = { alcool: "alcool", stups_volant: "stupefiants", defaut_permis: "aucun", refus_obtemperer: "aucun" };
  const AUTORITE = { outrage: "outrage", rebellion: "rebellion", violences_pdap: "rebellion" };
  const CONTROLE = { stups_usage: ["rue", "voiture"], stups_detention: ["rue", "voiture"] };

  VP.choisir = function (t, ver) {
    const r = CR.seeded(t.sig + ":videos"), inf = t.inf, sc = ctxDe(t), out = [];
    const fl = !!t.flagrance, dou = (k) => (t.doutes || []).includes(k);
    const itt = t.f && t.f.itt;
    // 1. la rue : ce qui se passe sur la voie publique
    let rue = null;
    if (COUPS[inf] && COUPS[inf].includes(sc)) rue = { faits: "coups", decor: sc === "bar" ? "rue_bar" : sc === "voisinage" ? "rue_place" : "rue",
      o: { premier: dou("legitime_defense") ? "V" : "A", chute: itt > 0 && r() < 0.75, deux: agg(t, "reunion") || /reunion/.test(sc), filme: sc === "happy_slapping", police: fl, coups: int(r, 1, 3) } };
    else if (MENACES[inf] && MENACES[inf].includes(sc)) rue = { faits: "menaces", decor: "rue", o: { police: fl } };
    else if (DEGRAD[inf] && DEGRAD[inf][sc]) rue = { faits: "degradation", decor: "rue", o: { cible: DEGRAD[inf][sc], police: fl } };
    else if (inf === "vol" && sc === "tire") rue = { faits: "tire", decor: "rue", o: { police: fl } };
    else if (DEAL[inf] && DEAL[inf].includes(sc)) rue = { faits: "deal", decor: "rue_place", o: { guetteur: sc === "guetteur", police: fl, n: int(r, 1, 3) } };
    if (rue && !(inf === "vol" && ["arrachage", "magasin"].includes(sc))) {
      // effacées : en préliminaire, une réquisition plus d'un mois après les faits ne trouve plus rien (L252-5)
      const delai = !fl && t.d && t.d.plainte != null && t.d.faits != null ? t.d.plainte - t.d.faits + int(r, 1, 12) : 0;
      out.push(Object.assign(rue, { src: "rue", efface: delai > 30, delai, preuve: delai <= 30, requisitionIrr: (t.irr || []).includes("requisition") && !fl }));
    }
    // 2. la caméra-piéton : les interventions de police en flagrance
    let pt = null;
    if (fl && ROUTE[inf]) pt = { faits: "pieton_routier", o: { depistage: ROUTE[inf], resultat: "positif", refus: !!(t.f && t.f.refus), permis: inf === "defaut_permis" ? false : undefined } };
    else if (fl && AUTORITE[inf]) pt = { faits: "pieton_rue", o: { issue: AUTORITE[inf], motif: /verbalisation/.test(sc) ? "une verbalisation" : /interpellation/.test(sc) ? "une interpellation" : "un contrôle d'identité" }, preuve: true };
    else if (fl && CONTROLE[inf] && CONTROLE[inf].includes(sc)) pt = sc === "voiture" ? { faits: "pieton_routier", o: { depistage: "aucun" } } : { faits: "pieton_rue", o: { issue: "calme", motif: "un contrôle d'identité" } };
    if (pt) {
      pt.src = "pieton";
      if (r() < 0.18) pt.o.tardif = int(r, 4, 9);
      else if (r() < 0.14) pt.o.information = false;
      pt.preuve = !!pt.preuve;
      out.push(pt);
    }
    // 3. le téléphone (version 7) : une graine à part, pour que les vidéos de la version 6 ne bougent pas
    if ((ver || GEN2.VERSION) >= 7 && CR.VTEL) { const tel = VP.telephone(t); if (tel) out.push(tel); }
    // 4. les caméras intérieures, le recel au contrôle (version 8), chacun sa graine
    if ((ver || GEN2.VERSION) >= 8 && CR.VINT) {
      const vi = VP.interieur(t, out.some((v) => v.src === "rue"), ver); if (vi) out.push(vi);
      if (!out.some((v) => v.src === "pieton") && fl && RECEL[inf] && RECEL[inf].includes(sc)) {
        const r2 = CR.seeded(t.sig + ":videos:recel");
        const p8 = sc === "scooter" ? { faits: "pieton_routier", o: { depistage: "aucun" } } : { faits: "pieton_rue", o: { issue: "calme", motif: "un contrôle d'identité" } };
        if (r2() < 0.75) { p8.src = "pieton"; p8.preuve = false; if (r2() < 0.18) p8.o.tardif = int(r2, 4, 9); else if (r2() < 0.14) p8.o.information = false; out.push(p8); }
      }
    }
    // 5. la banque, le guichet, la sonnette (version 9)
    if ((ver || GEN2.VERSION) >= 9 && CR.VBANQUE) { const vb = VP.banque(t, out); if (vb) out.push(vb); }
    // 6. la caméra de bord, l'appel vidéo, le commerce (version 10)
    if ((ver || GEN2.VERSION) >= 10 && CR.VPLUS) { const vp = VP.plus(t, out); if (vp) out.push(vp); }
    return out;
  };
  const BANQUE_MAP = {
    escroquerie: { faux_conseiller: { faits: "dab_retrait", o: { cartes: 1 } }, annonce: { faits: "dab_retrait", o: { cartes: 1 } }, location: { faits: "dab_retrait", o: { cartes: 1 } },
      faux_plombier: { faits: "porte_visite", o: { genre: "plombier", entre: true } }, faux_policier: { faits: "porte_visite", o: { genre: "faux_policier", entre: true } } },
    blanchiment: { mule: { faits: "dab_retrait", o: { cartes: 3 } }, especes: { faits: "guichet", o: { motif: "depot" } } },
    abus_confiance: { tutelle: { faits: "dab_retrait", o: { cartes: 1 } } },
    usurpation_identite: { etat_civil: { faits: "guichet", o: { motif: "ouverture" } } },
    faux_usage: { bulletins: { faits: "guichet", o: { motif: "pret" } } },
    abus_faiblesse: { voisin: { faits: "guichet", o: { motif: "retrait", accompagne: true } }, travaux: { faits: "porte_visite", o: { genre: "artisan", entre: true } } },
    violation_domicile: { ex: { faits: "porte_visite", o: { genre: "ex" } }, voisin: { faits: "porte_visite", o: { genre: "voisin" } } },
    ordonnance_protection: { domicile: { faits: "porte_visite", o: { genre: "ex" } } },
    non_representation: { visite: { faits: "porte_visite", o: { genre: "parent" } } },
    harcelement_moral: { voisinage: { faits: "porte_visite", o: { genre: "voisin" } } },
  };
  VP.banque = function (t, deja) {
    const r = CR.seeded(t.sig + ":videos:banque"), m = BANQUE_MAP[t.inf] && BANQUE_MAP[t.inf][ctxDe(t)];
    if (!m || r() > 0.65) return null;
    // une seule vidéo du domicile ou du hall pour une même visite
    if (m.faits === "porte_visite" && deja.some((v) => v.src === "interieur" || (v.src === "telephone" && v.faits === "tel_dispute"))) return null;
    const fl = !!t.flagrance, sonnette = m.faits === "porte_visite";
    const v = { src: sonnette ? "sonnette" : "banque", faits: m.faits, decor: m.faits === "dab_retrait" ? "dab" : m.faits === "guichet" ? "banque" : "palier", o: Object.assign({}, m.o), preuve: true };
    if (sonnette) {
      if (v.o.genre === "ex" || v.o.genre === "voisin") v.o.violence = r() < 0.45 ? "porte" : "aucune";
      v.qui = "victime"; v.copie = r() < 0.4;
      return v;
    }
    if (m.faits === "dab_retrait") { v.o.regarde = r() < 0.6; v.o.montant = pk(r, [200, 300, 400, 500]); if (v.o.cartes > 1) v.o.cartes = int(r, 2, 3); }
    const delai = !fl && t.d && t.d.plainte != null && t.d.faits != null ? t.d.plainte - t.d.faits + int(r, 1, 12) : 0;
    Object.assign(v, { efface: delai > 30, delai, preuve: delai <= 30, requisitionIrr: (t.irr || []).includes("requisition") && !fl });
    v.horloge = r() < 0.3 ? (r() < 0.5 ? -1 : 1) * int(r, 2, 11) : 0;
    return v;
  };
  const RECEL = { recel: ["telephone", "scooter", "bijoux"] };
  const INT_MAP = {
    cambriolage: { appartement: { faits: "hall_passage", decor: "hall", o: { objet: "sac" } } },
    escroquerie: { faux_policier: { faits: "hall_passage", decor: "hall", o: { objet: "boite", monte: "ascenseur" } }, faux_plombier: { faits: "hall_passage", decor: "hall", o: { objet: "sac" } } },
    vol: { vulnerable: { faits: "hall_passage", decor: "hall", o: { objet: "sac", monte: "ascenseur" } } },
    violences_conj: { voiture: { faits: "parking_dispute", decor: "parking", o: {} } },
    harcelement_sexuel: { transport: { faits: "bus_harcelement", decor: "bus", o: {} } },
    outrage_sexiste: { bus: { faits: "bus_harcelement", decor: "bus", o: {} } },
    violences: { transport: { faits: "bus_coups", decor: "bus", o: {} } },
  };
  VP.interieur = function (t, dejaRue, ver) {
    const r = CR.seeded(t.sig + ":videos:interieur"), m = INT_MAP[t.inf] && INT_MAP[t.inf][ctxDe(t)];
    if (!m || dejaRue || r() > 0.72) return null;
    const fl = !!t.flagrance, dou = (k) => (t.doutes || []).includes(k), itt = t.f && t.f.itt;
    const v = { src: "interieur", faits: m.faits, decor: m.decor, o: Object.assign({}, m.o) };
    if (m.faits === "parking_dispute") { v.o.violence = r() < 0.5 ? "tient" : "pousse"; v.o.chute = v.o.violence === "pousse" && itt > 0 && r() < 0.6; }
    if (m.faits === "bus_coups") Object.assign(v.o, { premier: dou("legitime_defense") ? "V" : "A", chute: itt > 0 && r() < 0.6, coups: int(r, 1, 3) });
    if (m.faits === "hall_passage") v.o.absence = int(r, 8, 45) * 60;
    // conservation limitée (un mois au plus) : une réquisition tardive ne trouve plus rien
    const delai = !fl && t.d && t.d.plainte != null && t.d.faits != null ? t.d.plainte - t.d.faits + int(r, 1, 12) : 0;
    Object.assign(v, { efface: delai > 30, delai, preuve: delai <= 30, requisitionIrr: (t.irr || []).includes("requisition") && !fl });
    // l'horloge de l'enregistreur, parfois décalée sur l'heure légale
    v.horloge = r() < 0.25 ? (r() < 0.5 ? -1 : 1) * int(r, 3, 14) : 0;
    // version 10 : une fois sur deux, les faits des transports se passent dans une voiture de RER (graine à part)
    if ((ver || GEN2.VERSION) >= 10 && v.decor === "bus" && CR.seeded(t.sig + ":videos:rer")() < 0.5) { v.decor = "rer"; v.o.decor = "rer"; }
    return v;
  };
  const PLUS_MAP = {
    blessures_routieres: { pieton: { faits: "bord_pieton", src: "bord", o: {} } },
    delit_fuite: { "*": { faits: "bord_pieton", src: "bord", o: { fuite: true } } },
    mise_en_danger: { conduite: { faits: "bord_dangereux", src: "bord", o: {} } },
    violences: { circulation: { faits: "bord_colere", src: "bord", o: {} }, bar: { faits: "bar_coups", src: "interieur", decor: "bar_salle", o: {} } },
    ordonnance_protection: { messages: { faits: "visio_appel", src: "visio", o: { genre: "ex" } } },
    cyberharcelement: { ex: { faits: "visio_appel", src: "visio", o: { genre: "harcelement" } } },
    appels_malveillants: { couple: { faits: "visio_appel", src: "visio", o: { genre: "menaces" } } },
    harcelement_moral: { couple: { faits: "visio_appel", src: "visio", o: { genre: "harcelement" }, seul: true } },
    menaces: { couple: { faits: "visio_appel", src: "visio", o: { genre: "menaces" }, seul: true } },
    abus_confiance: { caisse: { faits: "caisse_poche", src: "interieur", decor: "boutique", o: {} } },
    recel: { boutique: { faits: "vente_comptoir", src: "interieur", decor: "boutique", o: {} } },
    escroquerie: { filouterie: { faits: "filouterie", src: "interieur", decor: "restaurant", o: {} } },
  };
  VP.plus = function (t, deja) {
    const r = CR.seeded(t.sig + ":videos:plus"), M = PLUS_MAP[t.inf], m = M && (M[ctxDe(t)] || M["*"]);
    if (!m || r() > 0.65 || (m.seul && deja.length)) return null;
    const fl = !!t.flagrance, dou = (k) => (t.doutes || []).includes(k), itt = t.f && t.f.itt;
    const v = { src: m.src, faits: m.faits, o: Object.assign({}, m.o), preuve: true };
    if (m.decor) v.decor = m.decor;
    if (m.faits === "bar_coups") Object.assign(v.o, { premier: dou("legitime_defense") ? "V" : "A", chute: itt > 0 && r() < 0.6, coups: int(r, 1, 3) });
    if (m.src === "interieur") {
      const delai = !fl && t.d && t.d.plainte != null && t.d.faits != null ? t.d.plainte - t.d.faits + int(r, 1, 12) : 0;
      Object.assign(v, { efface: delai > 30, delai, preuve: delai <= 30, requisitionIrr: (t.irr || []).includes("requisition") && !fl });
      v.horloge = r() < 0.25 ? (r() < 0.5 ? -1 : 1) * int(r, 3, 14) : 0;
    } else {
      v.copie = r() < 0.45;
      v.qui = m.faits === "bord_colere" || m.src === "visio" ? "victime" : "temoin";
      if (m.src === "bord") { v.horloge = r() < 0.35 ? (r() < 0.5 ? -1 : 1) * int(r, 2, 40) : 0; v.plaque = m.faits === "bord_colere" ? "lisible" : pk(r, ["lisible", "partielle", "illisible"]); }
      if (m.src === "visio") v.o.debutAppel = int(r, 20, 400);
    }
    return v;
  };
  const TEL_DOM = { violences_conj: { domicile: "violences", ex: "violences" }, harcelement_moral: { couple: "harcelement" }, menaces: { couple: "menaces" }, ordonnance_protection: { domicile: "menaces" } };
  const TEL_RUE_V = { menaces: ["voisin", "rue", "intimidation", "dette"], harcelement_moral: ["voisinage"] };
  VP.telephone = function (t) {
    const r = CR.seeded(t.sig + ":videos:telephone"), inf = t.inf, sc = ctxDe(t), dou = (k) => (t.doutes || []).includes(k);
    const base = { src: "telephone", preuve: true, copie: r() < 0.45 };
    // chez elle, la victime filme
    if (TEL_DOM[inf] && TEL_DOM[inf][sc] && r() < 0.6) {
      const genre = TEL_DOM[inf][sc];
      return Object.assign(base, { faits: "tel_dispute", qui: "victime", o: { genre, violence: genre === "violences" ? (r() < 0.5 ? "pousse" : "gifle") : "aucune", retard: r() < 0.25 ? int(r, 3, 5) : 0 } });
    }
    // dans la rue, la victime filme celui qui la menace
    if (TEL_RUE_V[inf] && TEL_RUE_V[inf].includes(sc) && r() < 0.45)
      return Object.assign(base, { faits: "tel_rue", qui: "victime", decor: /voisin/.test(sc) ? "rue_place" : "rue", o: { base: "menaces", filmeur: "V", baseO: {} } });
    // la scène filmée par celui qui accompagne l'auteur, publiée sur un réseau social
    if (inf === "violences" && sc === "happy_slapping")
      return Object.assign(base, { faits: "tel_rue", qui: "reseau", copie: true, decor: "rue", o: { base: "coups", filmeur: "T", complice: true, baseO: { filme: true, premier: "A", coups: int(r, 1, 3), chute: r() < 0.5 } } });
    // un témoin filme une bagarre, souvent une fois qu'elle a commencé
    if ((COUPS[inf] || []).includes(sc) && r() < (inf === "violences_conj" ? 0.3 : 0.4)) {
      const itt = t.f && t.f.itt, apres = r() < 0.45;
      return Object.assign(base, { faits: "tel_rue", qui: "temoin", decor: sc === "bar" ? "rue_bar" : sc === "voisinage" ? "rue_place" : "rue", apresPremier: apres,
        o: { base: "coups", filmeur: "T", apresPremier: apres, baseO: { premier: dou("legitime_defense") ? "V" : "A", chute: itt > 0 && r() < 0.7, deux: agg(t, "reunion"), coups: int(r, 1, 3), police: !!t.flagrance } } });
    }
    return null;
  };
  // au tirage (version 6) : la liste des vidéos, et la preuve « video » quand l'image montre les faits
  VP.planifier = function (t, ver) {
    t.videos = VP.choisir(t, ver);
    if (t.videos.some((v) => v.preuve) && !t.preuves.includes("video")) t.preuves.push("video");
    return t;
  };

  // ---------------------------------------------------------------- les réglages de l'extrait
  const p2 = (x) => String(x).padStart(2, "0");
  const modeDe = (r, h) => { const hh = (((h || 0) % 1440) + 1440) % 1440; return hh >= 7 * 60 + 30 && hh < 18 * 60 ? "jour" : hh >= 18 * 60 && hh < 21 * 60 ? "soir" : r() < 0.6 ? "ir" : "soir"; };
  // les visages : la personne mise en cause et la victime ont le visage de leur portrait du dossier. Doute sur
  // l'identification : l'auteur filmé est un sosie (même peau, mêmes cheveux, même coupe, autres traits) : c'est au
  // joueur de comparer l'image agrandie au portrait de son client.
  VP.looks = function (t, sansDoute) {
    const PX = CR.px, res = {};
    if (!PX || !PX.clientLook) return res;
    try {
      if (t.A && t.A.prenom) {
        const L = PX.clientLook(t.A);
        if (!sansDoute && (t.doutes || []).includes("doute_ident") && PX.lookFrom2 && PX.lookDePieces && L.p) {
          const S = PX.lookFrom2("sosie:" + t.sig, { g: L.g, age: L.age });
          res.A = PX.lookDePieces({ g: L.g, age: L.age, outfit: "shirt" }, Object.assign({}, S.p, { peau: L.p.peau, hc: L.p.hc, cut: L.p.cut }));
        } else res.A = L;
      }
      if (t.V && t.V.prenom && !t.V.agent) res.V = PX.clientLook(t.V);
    } catch (e) { /* sans portrait : visages modelés */ }
    return res;
  };
  VP.spec = function (t, v) {
    const r = CR.seeded(t.sig + ":videos:" + v.src);
    const A = t.A || {}, Vv = t.V || {};
    const tenueA = CR.SIM && CR.SIM.tenueAuteur ? CR.SIM.tenueAuteur(t) : null;
    const h = t.d && t.d.h != null ? t.d.h : 22 * 60;
    const jour = t.d && t.d.faits != null ? t.day + t.d.faits : t.day;
    const y = CR.ymd(jour), date = `${p2(y.d)}-${p2(y.m)}-${y.y}`;
    const spec = Object.assign({ faits: v.faits, graine: t.sig + ":" + v.src, mode: modeDe(r, h), date }, v.decor ? { decor: v.decor } : {}, v.o);
    spec.looks = VP.looks(t, v.src === "pieton"); // la caméra-piéton filme la personne contrôlée elle-même
    if (v.src === "rue") {
      spec.cam = "CAM " + p2(int(r, 2, 48));
      spec.auteur = { g: A.g || "m" }; if (tenueA) spec.auteur.tenue = tenueA;
      spec.victime = { g: Vv.g || "m", agee: (Vv.age || 0) >= 70 };
    } else if (v.src === "interieur" || v.src === "banque" || v.src === "sonnette") {
      // un lieu éclairé : l'image reste en couleur (la sonnette, elle, passe en infrarouge la nuit)
      if (spec.mode === "ir" && v.src !== "sonnette") spec.mode = "soir";
      if (v.src === "sonnette") { const dits = [].concat((t.f || {}).propos || (t.f || {}).menaces || []).filter((x) => typeof x === "string" && x.length > 6 && x.length < 80); if (dits.length) spec.propos = dits.slice(0, 1).map((x) => (/[.!?]$/.test(x) ? x : x + " !")); }
      spec.cam = "CAM " + p2(int(r, 1, 24));
      spec.auteur = { g: A.g || "m" }; if (tenueA) spec.auteur.tenue = tenueA;
      spec.victime = { g: Vv.g || "f", agee: (Vv.age || 0) >= 70 };
    } else if (v.src === "bord" || v.src === "visio") {
      if (spec.mode === "ir") spec.mode = "soir";
      spec.auteur = { g: A.g || "m" }; if (tenueA) spec.auteur.tenue = tenueA;
      spec.victime = { g: Vv.g || "f", agee: (Vv.age || 0) >= 70 };
      if (v.src === "visio" && v.o.genre) { const dits = [].concat((t.f || {}).propos || (t.f || {}).menaces || []).filter((x) => typeof x === "string" && x.length > 6 && x.length < 80); if (dits.length) spec.propos = dits.slice(0, 2).map((x) => (/[.!?]$/.test(x) ? x : x + " !")); }
    } else if (v.src === "telephone") {
      // un téléphone ne filme pas en infrarouge
      if (spec.mode === "ir") spec.mode = "soir";
      spec.auteur = { g: A.g || "m" }; if (tenueA) spec.auteur.tenue = tenueA;
      spec.victime = { g: Vv.g || "f" };
      const dits = [].concat((t.f || {}).propos || (t.f || {}).menaces || []).filter((x) => typeof x === "string" && x.length > 6 && x.length < 80);
      if (dits.length) spec.propos = dits.slice(0, 2).map((x) => (/[.!?]$/.test(x) ? x : x + " !"));
    } else {
      spec.cam = `CI ${pk(r, ["75", "92", "93", "94"])}-${int(r, 1000, 9999)}`;
      spec.personne = { g: A.g || "m" }; if (tenueA) spec.personne.tenue = tenueA;
      if (v.faits === "pieton_rue" && v.o.issue === "outrage") spec.propos = VP.propos(t, r);
    }
    // l'horloge de l'enregistreur : le geste à l'heure des faits (à quelques secondes près)
    const X0 = CR.video.extrait(Object.assign({}, spec, { heure: "00:00:00" }));
    const s0 = ((h * 60 + int(r, 5, 50) - Math.round(X0.scn.tG || 0) + (v.horloge || 0) * 60) % 86400 + 86400) % 86400;
    spec.heure = `${p2(Math.floor(s0 / 3600))}:${p2(Math.floor(s0 / 60) % 60)}:${p2(s0 % 60)}`;
    return spec;
  };
  // ce que dit la personne dans un outrage : les propos de l'affaire quand elle les porte, sinon des propos du registre
  VP.propos = function (t, r) {
    const f = t.f || {};
    const dits = [].concat(f.propos || f.injures || []).filter((x) => typeof x === "string" && x.length < 80);
    if (dits.length) return dits.slice(0, 2).map((x) => (/[.!?]$/.test(x) ? x : x + " !"));
    return [pk(r, ["Vous n'êtes que des bouffons !", "Dégage, t'es personne !", "Espèce de guignol, va !"]), pk(r, ["Je vous emmerde, vous et votre uniforme !", "Vous allez voir ce que je vais vous faire !", "Vous êtes des minables !"])];
  };

  // ---------------------------------------------------------------- les pièces
  const hsx = (h) => { const [hh, mm, ss] = h.split(" ")[1].split(":"); return `${+hh} h ${mm} min ${ss} s`; };
  // une interruption : « de 13 h 23 min 07 s à 13 h 23 min 09 s », ou « à 13 h 23 min 07 s, moins d'une seconde »
  const coupure = (X, a0, b0, t) => { const a = hsx(X.horodatage(a0)), b = hsx(X.horodatage(b0)); return a === b && (t.ver || 0) >= 9 ? `à ${a}, pendant moins d'une seconde` : `de ${a} à ${b}`; }; // version 9 : les pièces d'avant ne changent pas
  const art = (s) => (/^(doudoune|veste)/.test(s) ? "une " : "un ") + s;
  function pieceRue(t, v, spec, cote, X) {
    const A = t.A || {}, dou = (k) => (t.doutes || []).includes(k), LZ = CR.MONDE.lieuxDe(t), SF = LZ.F;
    const fl = !!t.flagrance, P = (x) => DOCS.p(x);
    const titre = "Procès-verbal d'exploitation des images de vidéoprotection de la voie publique";
    const entete = [`${SF.paris ? "Préfecture de police" : "Police nationale"} · ${SF.comm}`, `Procédure n° ${t.proc} — cote ${cote}`];
    if (v.efface) return DOCS.forme({ title: titre, kind: "video", cote, entete, sigs: ["L'officier de police judiciaire"], blocs: [
      P(`Requérons le centre de supervision urbaine de nous remettre les enregistrements de la caméra de vidéoprotection de la voie publique couvrant le lieu des faits, ${SF.nom}, à la date des faits.`),
      P({ t: `Il nous est répondu que les enregistrements de cette date n'existent plus : ils ne sont conservés qu'un mois au plus, et notre réquisition intervient ${v.delai} jours après les faits (art. L252-5 du code de la sécurité intérieure).`, f: "G_vid_efface" }),
      P("Aucune image n'est donc versée à la procédure."),
    ] });
    const lis = X.lisible(), vus = new Set();
    const vue = { ir: "de nuit, l'image est en infrarouge, en noir et blanc", soir: "de nuit, l'image est en couleur, sous l'éclairage public", jour: "l'image est en couleur" }[X.mode];
    const blocs = [
      P(`Procédons à l'exploitation des enregistrements de la caméra de vidéoprotection de la voie publique ${spec.cam}, ${SF.nom}, remis par le centre de supervision urbaine en exécution de ${fl ? "notre réquisition" : "notre réquisition, prise avec l'autorisation du procureur de la République"} (art. ${fl ? "60-1" : "77-1-1"} du code de procédure pénale), sur support numérique placé sous scellé.`),
      P(`La caméra, de haute définition, fixée sur un mât du terre-plein central, filme en plongée le trottoir et la façade ; ${vue}, à ${X.fps} images par seconde. Elle n'enregistre pas le son.`),
      ...X.moments.map((m) => P(v.o.premier === "V" && m.cle === "premier" ? { t: `${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, vus)}`, f: "G_vid_premier" } : m.cle === "chute" ? { t: `${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, vus)}`, f: "G_vid_chute" } : `${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, vus)}`)),
      lis.A ? P(`L'individu désigné ci-dessus comme l'auteur porte ${art(lis.A.image)}.`) : null,
      !lis.A || lis.A.visage !== "traits du visage discernables"
        ? P({ t: "La distance et la définition des images ne permettent pas de distinguer les traits du visage ; la silhouette et les vêtements sont visibles.", f: dou("doute_ident") ? "G_doute_ident" : "G_vid_visage" })
        : dou("doute_ident")
          ? P({ t: `Sur l'image agrandie, les traits du visage de l'individu se distinguent. Ils présentent une ressemblance avec ceux de ${A.prenom} ${A.nom}, sans qu'il soit possible de l'affirmer.`, f: "G_doute_ident" })
          : P({ t: `Sur l'image agrandie, les traits du visage de l'individu se distinguent. Le visage, la silhouette et les vêtements correspondent à ceux de ${A.prenom} ${A.nom}${fl ? " lors de son interpellation" : ""}.`, f: "G_video" }),
      X.sauts.length ? P(`L'enregistrement présente ${X.sauts.length === 1 ? "une interruption" : X.sauts.length + " interruptions"} : ${X.sauts.map(([a0, b0]) => coupure(X, a0, b0, t)).join(", ")}.`) : null,
      P("Une planche de captures est jointe ; les images utiles sont gravées sur un disque placé sous scellé."),
    ].filter(Boolean);
    return Object.assign(DOCS.forme({ title: titre, kind: "video", cote, entete, blocs, sigs: ["L'officier de police judiciaire"] }), { video: spec });
  }
  function piecePieton(t, v, spec, cote, X) {
    const LZ = CR.MONDE.lieuxDe(t), SF = LZ.F, P = (x) => DOCS.p(x);
    const tr = CR.VPIETON.transcription(X);
    const debut = X.horodatage(X.frames[0] || 0);
    const blocs = [
      P(`Procédons à la transcription de l'enregistrement de la caméra individuelle ${spec.cam}, portée par un fonctionnaire de l'équipage intervenant, extrait du support informatique sécurisé du service (art. L241-1 et R241-1 et suivants du code de la sécurité intérieure).`),
      P(X.scn.tardif ? { t: `L'enregistrement débute à ${hsx(debut)}, alors que l'échange avec la personne est déjà engagé : ce qui précède n'est pas enregistré.`, f: "G_pieton_tardif" } : `L'enregistrement débute à ${hsx(debut)}, à l'approche de la personne.`),
      P("La caméra, portée à la poitrine, enregistre l'image et le son ; l'image suit les mouvements du fonctionnaire."),
      P("Transcription des paroles (les passages couverts par le bruit sont signalés « [inaudible] ») :"),
      ...tr.map((p, k) => P(!X.scn.information && k === 0 && !X.scn.tardif ? { t: `${hsx(p.h)} — ${p.qui} : « ${p.texte} »`, f: "G_pieton_info" } : `${hsx(p.h)} — ${p.qui} : « ${p.texte} »`)),
      P("Images :"),
      ...X.moments.map((m) => P(`${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, new Set())}`)),
      !X.scn.information && X.scn.tardif ? P({ t: "La partie enregistrée ne comporte aucune mention, faite à la personne, de l'enregistrement en cours.", f: "G_pieton_info" }) : null,
      P(`Un extrait est gravé sur un disque placé sous scellé. Hors procédure, l'enregistrement aurait été effacé au bout d'un mois (art. L241-1).`),
    ].filter(Boolean);
    return Object.assign(DOCS.forme({ title: "Procès-verbal de transcription de l'enregistrement d'une caméra individuelle", kind: "video", cote, entete: [`${SF.paris ? "Préfecture de police" : "Police nationale"} · ${SF.comm}`, `Procédure n° ${t.proc} — cote ${cote}`], blocs, sigs: ["L'officier de police judiciaire"] }), { video: spec });
  }

  function pieceInt(t, v, spec, cote, X) {
    const A = t.A || {}, dou = (k) => (t.doutes || []).includes(k), LZ = CR.MONDE.lieuxDe(t), SF = LZ.F, fl = !!t.flagrance, P = (x) => DOCS.p(x);
    const SRC = (CR.VINT.SOURCES[v.decor] || SOURCES_BQ[v.decor] || (CR.VPLUS && CR.VPLUS.SOURCES[v.decor])), titre = SRC.titre;
    const entete = [`${SF.paris ? "Préfecture de police" : "Police nationale"} · ${SF.comm}`, `Procédure n° ${t.proc} — cote ${cote}`];
    const req = `en exécution de ${fl ? "notre réquisition" : "notre réquisition, prise avec l'autorisation du procureur de la République"} (art. ${fl ? "60-1" : "77-1-1"} du code de procédure pénale)`;
    if (v.efface) return DOCS.forme({ title: titre, kind: "video", cote, entete, sigs: ["L'officier de police judiciaire"], blocs: [
      P(`Requérons ${SRC.remis} de nous remettre les enregistrements des caméras couvrant ${SRC.lieu}, à la date des faits.`),
      P({ t: `Il nous est répondu que les enregistrements de cette date n'existent plus : ils sont écrasés au bout d'un mois au plus, et notre réquisition intervient ${v.delai} jours après les faits.`, f: "G_vid_efface" }),
      P("Aucune image n'est donc versée à la procédure."),
    ] });
    const lis = X.lisible(), vus = new Set();
    const blocs = [
      P(`Procédons à l'exploitation des enregistrements de la caméra ${spec.cam}, remis par ${SRC.remis}, ${req}, sur support numérique placé sous scellé.`),
      P(`Les images proviennent ${SRC.camera}, qui filme ${SRC.lieu} ; elles sont en couleur, à ${X.fps} images par seconde, sans le son.`),
      v.horloge ? P({ t: `L'exploitant nous signale que l'horloge de l'enregistreur ${v.horloge > 0 ? "avance" : "retarde"} de ${Math.abs(v.horloge)} minutes sur l'heure légale ; les heures citées ci-dessous sont celles qu'affiche l'image.`, f: "G_vid_horloge" }) : null,
      X.scn.ellipses && X.scn.ellipses.length ? P("L'enregistrement est déclenché par les mouvements : entre deux séquences, l'horodatage avance sans image.") : null,
      // le journal du distributeur : les heures de la banque (exactes), à rapprocher de celles de l'image
      ...(X.scn.operations ? [P("La banque joint le journal des opérations de l'automate pour cette période :")].concat(X.scn.operations.map((op, k) => P(v.horloge && k === 0 ? { t: `${hsx(X.horodatage(op.t - (v.horloge || 0) * 60))} — retrait de ${op.montant} euros, carte n° ${["4973", "5132", "4970"][k]} •••• ${String(1000 + ((t.sig.length * 37 + k * 911) % 9000))}.`, f: "G_vid_horloge" } : `${hsx(X.horodatage(op.t - (v.horloge || 0) * 60))} — retrait de ${op.montant} euros, carte n° ${["4973", "5132", "4970"][k]} •••• ${String(1000 + ((t.sig.length * 37 + k * 911) % 9000))}.`))) : []),
      ...X.moments.map((m) => { const tx = `${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, vus)}`; return P(v.o.premier === "V" && m.cle === "premier" ? { t: tx, f: "G_vid_premier" } : m.cle === "chute" ? { t: tx, f: "G_vid_chute" } : tx); }),
      lis.A ? P(`L'individu désigné ci-dessus porte ${art(lis.A.image)}.`) : null,
      !lis.A || lis.A.visage !== "traits du visage discernables"
        ? P({ t: "La définition des images ne permet pas de distinguer les traits du visage ; la silhouette et les vêtements sont visibles.", f: dou("doute_ident") ? "G_doute_ident" : "G_vid_visage" })
        : dou("doute_ident")
          ? P({ t: `Sur l'image agrandie, les traits du visage de l'individu se distinguent. Ils présentent une ressemblance avec ceux de ${A.prenom} ${A.nom}, sans qu'il soit possible de l'affirmer.`, f: "G_doute_ident" })
          : P({ t: `Sur l'image agrandie, les traits du visage de l'individu se distinguent. Le visage, la silhouette et les vêtements correspondent à ceux de ${A.prenom} ${A.nom}.`, f: "G_video" }),
      X.sauts.length ? P(`L'enregistrement présente ${X.sauts.length === 1 ? "une interruption" : X.sauts.length + " interruptions"} : ${X.sauts.map(([a0, b0]) => coupure(X, a0, b0, t)).join(", ")}.`) : null,
      P("Une planche de captures est jointe ; les images utiles sont gravées sur un disque placé sous scellé."),
    ].filter(Boolean);
    return Object.assign(DOCS.forme({ title: titre, kind: "video", cote, entete, blocs, sigs: ["L'officier de police judiciaire"] }), { video: spec });
  }

  const SOURCES_BQ = {
    dab: { titre: "Procès-verbal d'exploitation des images d'un distributeur automatique de billets", remis: "le service de sécurité de la banque", lieu: "le client placé devant l'automate", camera: "de la caméra de l'automate, logée au-dessus de l'écran et tournée vers le visage du client" },
    banque: { titre: "Procès-verbal d'exploitation des images de vidéosurveillance d'une agence bancaire", remis: "le service de sécurité de la banque", lieu: "la salle du public et les guichets", camera: "d'une caméra fixée en hauteur, dans un angle de la salle" },
  };
  function pieceSonnette(t, v, spec, cote, X) {
    const A = t.A || {}, Vv = t.V || {}, dou = (k) => (t.doutes || []).includes(k), LZ = CR.MONDE.lieuxDe(t), SF = LZ.F, P = (x) => DOCS.p(x), vus = new Set();
    const lis = X.lisible(), parent = X.scn.genre === "parent", e = (p) => (p && p.g === "f" ? "e" : "");
    const qui = parent ? `${A.prenom} ${A.nom}, occupant${e(A)} de l'appartement, à notre demande` : `${Vv.prenom} ${Vv.nom}, victime, occupant${e(Vv)} de l'appartement`;
    const blocs = [
      P(v.copie ? { t: `Nous est remise par ${qui}, une vidéo enregistrée par la sonnette connectée de sa porte d'entrée, téléchargée depuis le service en ligne du fabricant sur un support du service ; le compte et l'original n'ont pas été examinés.`, f: "G_tel_copie" } : `Nous est présentée par ${qui}, l'application de la sonnette connectée de sa porte d'entrée ; la vidéo y figure, conservée par le service en ligne du fabricant, avec sa date et son heure ; nous en faisons une copie intègre.`),
      P(`La caméra de la sonnette, à hauteur d'homme, filme le palier en très grand angle${X.mode === "ir" ? ", en infrarouge (de nuit)" : ""} ; elle se déclenche à la détection d'un mouvement et enregistre le son.`),
      P("Transcription des paroles (les passages couverts par le bruit sont signalés « [inaudible] ») :"),
      ...X.paroles.map((p) => P(`${hsx(X.horodatage(p.t0))} — ${p.nom} : « ${p.texte} »`)),
      P("Images :"),
      ...X.moments.map((m) => P(`${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, vus)}`)),
      parent || !lis.A ? null : lis.A.visage !== "traits du visage discernables"
        ? P({ t: "Les traits du visage de l'individu ne se distinguent pas.", f: dou("doute_ident") ? "G_doute_ident" : "G_vid_visage" })
        : dou("doute_ident")
          ? P({ t: `Le visage de l'individu est filmé de face, de près. Il présente une ressemblance avec celui de ${A.prenom} ${A.nom}, sans qu'il soit possible de l'affirmer.`, f: "G_doute_ident" })
          : P({ t: `Le visage de l'individu est filmé de face, de près ; il correspond à celui de ${A.prenom} ${A.nom}.`, f: "G_video_tel" }),
      P("La vidéo est gravée sur un disque placé sous scellé ; une planche de captures est jointe."),
    ].filter(Boolean);
    return Object.assign(DOCS.forme({ title: "Procès-verbal d'exploitation de la vidéo d'une sonnette connectée", kind: "video", cote, entete: [`${SF.paris ? "Préfecture de police" : "Police nationale"} · ${SF.comm}`, `Procédure n° ${t.proc} — cote ${cote}`], blocs, sigs: ["L'officier de police judiciaire"] }), { video: spec });
  }

  function pieceBord(t, v, spec, cote, X) {
    const A = t.A || {}, Vv = t.V || {}, T = t.T && t.T.prenom ? t.T : null, dou = (k) => (t.doutes || []).includes(k), LZ = CR.MONDE.lieuxDe(t), SF = LZ.F, P = (x) => DOCS.p(x), vus = new Set();
    const e = (p) => (p && p.g === "f" ? "e" : ""), coul = CR.VPLUS.COUL_NOM[X.scn.couleur], lis = X.lisible();
    const qui = v.qui === "victime" ? `${Vv.prenom} ${Vv.nom}, victime, conducteur${e(Vv) ? "rice" : ""} du véhicule` : T ? `${T.prenom} ${T.nom}, témoin, conducteur${e(T) ? "rice" : ""} d'un véhicule présent sur les lieux` : "un témoin, conducteur d'un véhicule présent sur les lieux";
    const blocs = [
      P(v.copie ? { t: `Se présente ${qui}, qui nous remet, sur une clé, un fichier vidéo enregistré par la caméra embarquée de son véhicule. La carte mémoire de la caméra n'est pas saisie.`, f: "G_tel_copie" } : `Se présente ${qui}, qui nous remet la carte mémoire de la caméra embarquée de son véhicule ; nous en extrayons le fichier vidéo, avec ses métadonnées d'origine.`),
      P("La caméra, fixée derrière le pare-brise, filme la route devant le véhicule et enregistre le son ; l'image porte la date, l'heure et la vitesse du véhicule."),
      v.horloge ? P({ t: `L'horloge de la caméra, réglée à la main par son propriétaire, ${v.horloge > 0 ? "avance" : "retarde"} de ${Math.abs(v.horloge)} minutes sur l'heure légale (comparaison faite en notre présence) ; les heures citées ci-dessous sont celles de l'image.`, f: "G_vid_horloge" }) : null,
      P("Transcription des paroles (les passages couverts par le bruit sont signalés « [inaudible] ») :"),
      ...X.paroles.map((p) => P(`${hsx(X.horodatage(p.t0))} — ${p.nom} : « ${p.texte} »`)),
      P("Images :"),
      ...X.moments.map((m) => P(`${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, vus)}`)),
      X.scn.couleur ? P(v.plaque === "lisible" ? `La plaque d'immatriculation de la voiture ${coul} se lit sur l'image arrêtée ; elle est relevée et figure au procès-verbal de recherche du véhicule.` : { t: v.plaque === "partielle" ? `La plaque d'immatriculation de la voiture ${coul} ne se lit qu'en partie : seuls les deux derniers caractères sont discernables.` : `La plaque d'immatriculation de la voiture ${coul} ne se lit pas : reflets des phares, mouvement et distance.`, f: "G_bord_plaque" }) : null,
      X.scn.couleur && lis.A ? (lis.A.visage !== "traits du visage discernables"
        ? P({ t: "Les traits du visage de l'individu ne se distinguent pas.", f: dou("doute_ident") ? "G_doute_ident" : "G_vid_visage" })
        : dou("doute_ident")
          ? P({ t: `Le visage de l'individu se distingue. Il présente une ressemblance avec celui de ${A.prenom} ${A.nom}, sans qu'il soit possible de l'affirmer.`, f: "G_doute_ident" })
          : P({ t: `Le visage de l'individu se distingue, de près ; il correspond à celui de ${A.prenom} ${A.nom}.`, f: "G_video_tel" })) : null,
      P("Le fichier est gravé sur un disque placé sous scellé ; une planche de captures est jointe."),
    ].filter(Boolean);
    return Object.assign(DOCS.forme({ title: CR.VPLUS.SOURCES.bord.titre, kind: "video", cote, entete: [`${SF.paris ? "Préfecture de police" : "Police nationale"} · ${SF.comm}`, `Procédure n° ${t.proc} — cote ${cote}`], blocs, sigs: ["L'officier de police judiciaire"] }), { video: spec });
  }
  function pieceVisio(t, v, spec, cote, X) {
    const A = t.A || {}, Vv = t.V || {}, dou = (k) => (t.doutes || []).includes(k), LZ = CR.MONDE.lieuxDe(t), SF = LZ.F, P = (x) => DOCS.p(x), vus = new Set(), lis = X.lisible();
    const [dd, mm, yy] = spec.date.split("-"), hh = spec.heure.split(":"), quand = `${+dd}/${mm}/${yy} à ${+hh[0]} h ${hh[1]}`;
    const blocs = [
      P(v.copie ? { t: `Se présente ${Vv.prenom} ${Vv.nom}, victime, qui nous remet l'enregistrement de l'écran de son téléphone, fait pendant un appel vidéo reçu le ${quand}, transféré sur une clé ; le téléphone n'est pas examiné.`, f: "G_tel_copie" } : `Se présente ${Vv.prenom} ${Vv.nom}, victime, qui nous présente son téléphone : l'enregistrement de l'écran, fait pendant un appel vidéo reçu le ${quand}, y figure, ainsi que l'appel dans l'historique de l'application. Nous en faisons une copie intègre.`),
      P(`L'appel est passé depuis un compte enregistré sous le nom de ${A.prenom} ${A.nom}. L'enregistrement commence alors que l'appel dure depuis ${Math.floor((X.scn.debutAppel || 0) / 60)} min ${String((X.scn.debutAppel || 0) % 60).padStart(2, "0")} s : ce qui précède n'est pas enregistré.`),
      P("Transcription des paroles (les passages couverts par le bruit sont signalés « [inaudible] ») :"),
      ...X.paroles.map((p) => P(`${CR.VTEL.pos(p.t0)} — ${p.nom} : « ${p.texte} »`)),
      P("Images :"),
      ...X.moments.map((m) => P(`${CR.VTEL.pos(m.t)} — ${CR.VRUE.rediger(X, m.txt, vus)}`)),
      lis.A && lis.A.visage === "traits du visage discernables" && !dou("doute_ident") ? P({ t: `Le visage de l'appelant, filmé de face et de près, correspond à celui de ${A.prenom} ${A.nom}.`, f: "G_video_tel" }) : null,
      P("L'enregistrement est gravé sur un disque placé sous scellé."),
    ].filter(Boolean);
    return Object.assign(DOCS.forme({ title: CR.VPLUS.SOURCES.visio.titre, kind: "video", cote, entete: [`${SF.paris ? "Préfecture de police" : "Police nationale"} · ${SF.comm}`, `Procédure n° ${t.proc} — cote ${cote}`], blocs, sigs: ["L'officier de police judiciaire"] }), { video: spec });
  }

  function pieceTel(t, v, spec, cote, X) {
    const A = t.A || {}, Vv = t.V || {}, dou = (k) => (t.doutes || []).includes(k), LZ = CR.MONDE.lieuxDe(t), SF = LZ.F, fl = !!t.flagrance;
    const P = (x) => DOCS.p(x), pos = CR.VTEL.pos, vus = new Set();
    const lis = X.lisible(), tr = CR.VTEL.transcription(X), duree = X.frames[X.frames.length - 1] || 0;
    const [dd, mm, yy] = spec.date.split("-"), heure = spec.heure.split(":"), quand = `${+dd}/${mm}/${yy} à ${+heure[0]} h ${heure[1]}`;
    const T = t.T && t.T.prenom ? t.T : null, il = (p) => (p && p.g === "f" ? "elle" : "il");
    const qui = v.qui === "victime" ? `${Vv.prenom} ${Vv.nom}, victime,` : v.qui === "temoin" ? (T ? `${T.prenom} ${T.nom}, témoin des faits,` : "une personne présente lors des faits, entendue en qualité de témoin,") : null;
    const titre = v.qui === "reseau" ? "Procès-verbal d'exploitation d'une vidéo publiée sur un réseau social" : `Procès-verbal d'exploitation d'une vidéo remise par ${v.qui === "victime" ? "la victime" : "un témoin"}`;
    const blocs = [
      v.qui === "reseau"
        ? P({ t: `Nos recherches sur les réseaux sociaux permettent de retrouver une vidéo des faits, publiée le ${quand} par un compte dont le titulaire n'est pas identifié. Nous la téléchargeons : c'est une copie recompressée par la plateforme ; l'original n'est pas retrouvé.`, f: "G_tel_copie" })
        : P(v.copie
          ? { t: `Se présente ${qui} qui nous remet un fichier vidéo qu'${v.qui === "victime" ? il(Vv) : T ? il(T) : "elle"} déclare avoir filmé avec son téléphone. Le fichier est transféré sur un support du service ; le téléphone est restitué sans avoir été examiné.`, f: "G_tel_copie" }
          : `Se présente ${qui} qui nous présente son téléphone ; le fichier vidéo y figure avec ses métadonnées d'origine. Nous en faisons une copie intègre, puis restituons le téléphone.`),
      P(`Le fichier dure ${pos(duree)} ; il est filmé à la verticale, téléphone tenu à la main, et enregistre l'image et le son. ${v.qui === "reseau" ? "Elle est publiée" : "Ses métadonnées indiquent une création"} le ${quand}.`),
      X.scn.retard
        ? P({ t: v.apresPremier ? "La vidéo commence alors que l'altercation est déjà engagée : le premier coup n'est pas filmé." : "La vidéo commence alors que la scène est déjà engagée : ce qui précède n'est pas filmé.", f: "G_tel_debut" })
        : P("La vidéo commence avant les faits."),
      P("Transcription des paroles (les passages couverts par le bruit sont signalés « [inaudible] ») :"),
      ...tr.map((p) => P(`${p.pos} — ${p.qui} : « ${p.texte} »${p.coupe ? " (le début de la phrase précède la vidéo)" : ""}`)),
      P("Images :"),
      ...X.moments.map((m) => P(m.cle === "premier" && v.o.baseO && v.o.baseO.premier === "V" ? { t: `${pos(m.t)} — ${CR.VRUE.rediger(X, m.txt, vus)}`, f: "G_vid_premier" } : `${pos(m.t)} — ${CR.VRUE.rediger(X, m.txt, vus)}`)),
      !lis.A ? null : lis.A.visage !== "traits du visage discernables"
        ? P({ t: "Les traits du visage de l'individu ne se distinguent pas ; la silhouette et les vêtements sont visibles.", f: dou("doute_ident") ? "G_doute_ident" : "G_vid_visage" })
        : dou("doute_ident")
          ? P({ t: `Sur l'image agrandie, les traits du visage de l'individu se distinguent. Ils présentent une ressemblance avec ceux de ${A.prenom} ${A.nom}, sans qu'il soit possible de l'affirmer.`, f: "G_doute_ident" })
          : P({ t: v.qui === "victime" ? `Le visage de l'individu est visible à plusieurs reprises. La victime le désigne comme étant ${A.prenom} ${A.nom} ; il correspond à celui de ${il(A) === "elle" ? "la mise en cause" : "le mis en cause"}.` : `Le visage de l'individu est visible à plusieurs reprises ; il correspond à celui de ${A.prenom} ${A.nom}${fl ? ", tel qu'il apparaît lors de son interpellation" : ""}.`, f: "G_video_tel" }),
      X.scn.violence && X.scn.violence !== "aucune" ? P({ t: "L'enregistrement s'arrête pendant la scène : la suite n'est pas filmée.", f: "G_tel_coupe" }) : null,
      P("Le fichier est gravé sur un disque placé sous scellé ; une planche de captures est jointe."),
    ].filter(Boolean);
    return Object.assign(DOCS.forme({ title: titre, kind: "video", cote, entete: [`${SF.paris ? "Préfecture de police" : "Police nationale"} · ${SF.comm}`, `Procédure n° ${t.proc} — cote ${cote}`], blocs, sigs: ["L'officier de police judiciaire"] }), { video: spec });
  }

  // les faits à relever que portent ces pièces : seulement ceux dont la pièce contient le passage (sinon le joueur ne
  // pourrait pas les relever)
  function faits(PZ, t, v, X) {
    const f = (id, o) => { if (!PZ.facts[id]) PZ.facts[id] = o; };
    if (v.src === "rue") {
      if (v.efface) f("G_vid_efface", { label: "Les images de vidéoprotection ont été effacées avant la réquisition", key: true, why: "Faute d'avoir été requises à temps, les images qui auraient pu confirmer ou démentir les déclarations n'existent plus : le doute qui en reste profite au prévenu." });
      if (v.o.premier === "V") f("G_vid_premier", { label: "Les images montrent l'autre porter le premier coup", key: true, why: "La riposte immédiate à une attaque peut relever de la légitime défense (art. 122-5 du code pénal) ; l'image le montre mieux qu'une déclaration." });
      if (v.efface || !X) return;
      if (v.o.chute && X.moments.some((m) => m.cle === "chute")) f("G_vid_chute", { label: "La victime chute après les coups", key: false });
      const lis = X.lisible(), flou = !lis.A || lis.A.visage !== "traits du visage discernables" || (t.doutes || []).includes("doute_ident");
      if (flou && !(t.doutes || []).includes("doute_ident")) f("G_vid_visage", { label: "Les traits du visage de l'auteur ne sont pas discernables sur les images", key: true, why: "L'identification repose sur la silhouette et les vêtements : un rapprochement, pas une reconnaissance." });
      if (!flou) f("G_video", { label: "La vidéo correspond à la silhouette et aux vêtements du mis en cause", key: false });
    } else if (v.src === "interieur" || v.src === "banque") {
      if (v.efface) { f("G_vid_efface", { label: "Les images de vidéosurveillance ont été écrasées avant la réquisition", key: true, why: "Faute d'avoir été requises à temps, les images qui auraient pu confirmer ou démentir les déclarations n'existent plus : le doute qui en reste profite au prévenu." }); return; }
      if (!X) return;
      if (v.horloge) f("G_vid_horloge", { label: "L'horloge de l'enregistreur est décalée sur l'heure légale", key: true, why: "Les heures lues sur l'image ne sont pas les heures réelles : tout rapprochement d'horaires (un appel, un témoignage, un alibi) doit être corrigé du décalage." });
      if (v.o.premier === "V" && X.moments.some((m) => m.cle === "premier")) f("G_vid_premier", { label: "Les images montrent l'autre porter le premier coup", key: true, why: "La riposte immédiate à une attaque peut relever de la légitime défense (art. 122-5 du code pénal) ; l'image le montre mieux qu'une déclaration." });
      if (X.moments.some((m) => m.cle === "chute")) f("G_vid_chute", { label: "La victime chute après les coups", key: false });
      const lis = X.lisible(), flou = !lis.A || lis.A.visage !== "traits du visage discernables";
      if (flou && !(t.doutes || []).includes("doute_ident")) f("G_vid_visage", { label: "Les traits du visage de l'auteur ne sont pas discernables sur les images", key: true, why: "L'identification repose sur la silhouette et les vêtements : un rapprochement, pas une reconnaissance." });
      if (!flou && !(t.doutes || []).includes("doute_ident")) f("G_video", { label: "La vidéo correspond au visage, à la silhouette et aux vêtements du mis en cause", key: false });
    } else if (v.src === "bord" || v.src === "visio") {
      if (!X) return;
      if (v.copie) f("G_tel_copie", { label: "Seule une copie de la vidéo a été exploitée", key: true, why: "Sans l'original et ses métadonnées, l'intégrité de la vidéo (coupes, montage, date) n'est pas vérifiée : la défense peut en contester la valeur ou demander une expertise." });
      if (v.horloge) f("G_vid_horloge", { label: "L'horloge de la caméra est décalée sur l'heure légale", key: true, why: "Les heures lues sur l'image ne sont pas les heures réelles : tout rapprochement d'horaires (un appel, un témoignage, un alibi) doit être corrigé du décalage." });
      if (v.plaque && v.plaque !== "lisible") f("G_bord_plaque", { label: "La plaque d'immatriculation ne se lit pas sur la vidéo", key: true, why: "Le rapprochement entre la voiture filmée et celle du prévenu repose sur la couleur et l'allure du véhicule, pas sur son immatriculation : d'autres voitures lui ressemblent." });
      const lis = X.lisible();
      if (lis.A && lis.A.visage === "traits du visage discernables" && !(t.doutes || []).includes("doute_ident")) f("G_video_tel", { label: "La vidéo montre le visage du mis en cause", key: false });
    } else if (v.src === "telephone" || v.src === "sonnette") {
      if (!X) return;
      if (X.scn.retard) f("G_tel_debut", { label: v.apresPremier ? "La vidéo du témoin commence après le premier coup" : "La vidéo commence alors que la scène est engagée", key: true, why: v.apresPremier ? "Le début de l'altercation n'est pas filmé : la vidéo ne dit pas qui a frappé le premier, et n'écarte pas une riposte." : "Ce qui a précédé n'est pas filmé : la vidéo montre une scène dont le début manque." });
      if (v.copie || v.qui === "reseau") f("G_tel_copie", { label: "Seule une copie de la vidéo a été exploitée", key: true, why: "Sans l'original et ses métadonnées, l'intégrité de la vidéo (coupes, montage, date) n'est pas vérifiée : la défense peut en contester la valeur ou demander une expertise." });
      if (X.scn.violence && X.scn.violence !== "aucune") f("G_tel_coupe", { label: "L'enregistrement s'arrête pendant la scène", key: true, why: "La suite n'est pas filmée : ce qui s'est passé ensuite ne repose que sur les déclarations." });
      if (v.o.baseO && v.o.baseO.premier === "V" && X.moments.some((m) => m.cle === "premier")) f("G_vid_premier", { label: "Les images montrent l'autre porter le premier coup", key: true, why: "La riposte immédiate à une attaque peut relever de la légitime défense (art. 122-5 du code pénal) ; l'image le montre mieux qu'une déclaration." });
      const lis = X.lisible();
      if (v.src === "sonnette" && X.scn.genre === "parent") return;
      if (lis.A && lis.A.visage === "traits du visage discernables" && !(t.doutes || []).includes("doute_ident")) f("G_video_tel", { label: v.src === "sonnette" ? "La sonnette a filmé le visage du mis en cause" : "La vidéo filmée au téléphone montre le visage du mis en cause", key: false });
      else if (lis.A && lis.A.visage !== "traits du visage discernables" && !(t.doutes || []).includes("doute_ident")) f("G_vid_visage", { label: "Les traits du visage de l'auteur ne sont pas discernables sur les images", key: true, why: "L'identification repose sur la silhouette et les vêtements : un rapprochement, pas une reconnaissance." });
    } else if (X) {
      if (X.scn.tardif) f("G_pieton_tardif", { label: "La caméra-piéton a été déclenchée après le début de l'échange", key: true, why: "Le début de l'incident n'est pas enregistré : ce qui l'a provoqué ne se voit pas, et la version des policiers sur ce moment n'est confirmée par rien." });
      if (!X.scn.information) f("G_pieton_info", { label: "Aucune information de la personne sur l'enregistrement", key: true, why: "L'article L241-1 du code de la sécurité intérieure exige que la personne filmée soit informée du déclenchement, sauf si les circonstances l'interdisent : un argument sur la loyauté de la preuve." });
    }
  }

  // ---------------------------------------------------------------- l'enveloppe de GEN2.pieces
  const pieces0 = GEN2.pieces;
  GEN2.pieces = function (t, N) {
    const PZ = pieces0.apply(this, arguments);
    if ((t.ver || 0) < 6 || !t.videos || !t.videos.length) return PZ;
    try { VP.ajouter(PZ, t); } catch (e) { console.error("vidéo non ajoutée", e); }
    return PZ;
  };
  VP.ajouter = function (PZ, t) {
    let n = 0;
    for (const c of Object.values(PZ.cotes || {})) { const m = /^D(\d+)/.exec(String(c || "")); if (m) n = Math.max(n, +m[1]); }
    for (const v of t.videos) {
      let key = { rue: "pv_videoprotection", pieton: "pv_camera_pieton", telephone: "pv_video_telephone", interieur: "pv_video_interieur", banque: "pv_video_banque", sonnette: "pv_video_sonnette", bord: "pv_video_bord", visio: "pv_video_appel" }[v.src], cote;
      if (v.src === "interieur" && PZ.docs[key]) key = key + "_2"; // deux caméras intérieures dans la même affaire
      // la vidéo seulement écrite que l'affaire avait déjà : la pièce jouable la remplace, à la même cote
      if (v.src === "rue" && PZ.docs.pv_video) { key = "pv_video"; cote = PZ.cotes.pv_video; }
      if (!cote) { n++; cote = "D" + n; }
      const spec = v.efface ? null : VP.spec(t, v);
      const X = spec ? CR.video.extrait(spec) : null;
      const fn = v.src === "rue" ? () => pieceRue(t, v, spec, cote, X) : v.src === "telephone" ? () => pieceTel(t, v, spec, cote, X) : v.src === "interieur" || v.src === "banque" ? () => pieceInt(t, v, spec, cote, X) : v.src === "sonnette" ? () => pieceSonnette(t, v, spec, cote, X) : v.src === "bord" ? () => pieceBord(t, v, spec, cote, X) : v.src === "visio" ? () => pieceVisio(t, v, spec, cote, X) : () => piecePieton(t, v, spec, cote, X);
      PZ.docs[key] = () => CAT.typoDeep(fn());
      PZ.cotes[key] = cote;
      PZ.titres[key] = `${v.src === "rue" ? (v.efface ? "Vidéoprotection : images effacées" : "Exploitation vidéo") : v.src === "telephone" ? (v.qui === "reseau" ? "Vidéo publiée en ligne" : "Vidéo filmée au téléphone") : v.src === "interieur" || v.src === "banque" ? (v.efface ? "Vidéosurveillance : images écrasées" : { hall: "Vidéo du hall d'immeuble", parking: "Vidéo du parking", bus: "Vidéo du bus", rer: "Vidéo du RER", dab: "Vidéo du distributeur", banque: "Vidéo de l'agence bancaire", boutique: "Vidéo du commerce", restaurant: "Vidéo du restaurant", bar_salle: "Vidéo du bar" }[v.decor]) : v.src === "sonnette" ? "Vidéo de la sonnette" : v.src === "bord" ? "Vidéo d'une caméra de bord" : v.src === "visio" ? "Enregistrement d'un appel vidéo" : "Caméra-piéton"} (${cote})`;
      for (const l of ["dossier", "copie"]) {
        const L = PZ.listes[l]; if (!L || L.includes(key)) continue;
        const i = L.indexOf("casier"); if (i >= 0) L.splice(i, 0, key); else L.push(key);
      }
      faits(PZ, t, v, X);
      // la réquisition sans autorisation : la nullité écarte aussi les images
      if ((v.src === "rue" || v.src === "interieur" || v.src === "banque") && v.requisitionIrr && PZ.anomalies.requisition && !PZ.anomalies.requisition.annule.includes("video")) PZ.anomalies.requisition.annule.push("video");
    }
    return PZ;
  };
})();
