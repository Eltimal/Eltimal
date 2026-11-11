/* La Permanence — la ville judiciaire : lieux de Paris et d'Île-de-France, trajets, horaires d'ouverture.
   Les lieux sont réels ; les personnes qui y travaillent dans le jeu sont fictives. */
(function () {
  const CR = (window.CR = window.CR || {});

  // x, y : position sur la carte (0 à 1). zone : paris, couronne, loin
  CR.PLACES = {
    domicile: { nom: "Votre domicile", sous: "Paris", zone: "paris", x: 0.45, y: 0.36, cache: true },
    cabinet: { nom: "Votre cabinet", sous: "17e arrondissement, près des Batignolles", zone: "paris", x: 0.385, y: 0.305, type: "cabinet", horaires: null,
      desc: "Point de départ de chaque journée : messagerie, dossiers, rendez-vous, recherche, rédaction." },
    palais: { nom: "Tribunal judiciaire de Paris", sous: "Parvis du Tribunal de Paris, Batignolles (17e)", zone: "paris", x: 0.345, y: 0.235, type: "palais", horaires: "greffe",
      desc: "Greffe correctionnel, salles d'audience, cabinets des juges d'instruction et du JLD, parquet, dépôt, salle des avocats." },
    cite: { nom: "Palais de justice de l'Île de la Cité", sous: "Boulevard du Palais (1er)", zone: "paris", x: 0.535, y: 0.505, type: "palais", horaires: "greffe",
      desc: "Cour d'appel : chambre de l'instruction, chambre des appels correctionnels, cour d'assises, cour criminelle départementale." },
    ordre: { nom: "Maison du barreau", sous: "Ordre des avocats de Paris (1er)", zone: "paris", x: 0.515, y: 0.475, type: "ordre", horaires: "ordre",
      desc: "Bâtonnier, planning des permanences, CARPA." },
    commissariat: { nom: "Commissariat central du 18e", sous: "18e arrondissement", zone: "paris", x: 0.49, y: 0.17, type: "commissariat", horaires: null,
      desc: "Gardes à vue, auditions libres, dépôts de plainte." },
    umj: { nom: "Unité médico-judiciaire", sous: "Hôtel-Dieu (4e)", zone: "paris", x: 0.55, y: 0.52, type: "autre", horaires: null,
      desc: "Examens des victimes sur réquisition, fixation de l'ITT." },
    spip: { nom: "SPIP de Paris", sous: "Service pénitentiaire d'insertion et de probation", zone: "paris", x: 0.585, y: 0.695, type: "autre", horaires: "greffe",
      desc: "Enquêtes sociales rapides, suivi des sursis probatoires." },
    cj: { nom: "Étude Marchal & Rives", sous: "Commissaires de justice (8e)", zone: "paris", x: 0.41, y: 0.39, type: "autre", horaires: "bureau",
      desc: "Délivrance des citations directes." },
    sante: { nom: "Maison d'arrêt de Paris-La Santé", sous: "14e arrondissement", zone: "paris", x: 0.505, y: 0.715, type: "prison", prison: "ma", horaires: "parloir",
      desc: "Prévenus en détention provisoire et courtes peines. Parloir avocat sur permis de communiquer." },
    fresnes: { nom: "Centre pénitentiaire de Fresnes", sous: "Val-de-Marne", zone: "couronne", x: 0.535, y: 0.92, type: "prison", prison: "cp", horaires: "parloir",
      desc: "Plusieurs quartiers sur un même site : maison d'arrêt et centre de détention." },
    fleury: { nom: "Maison d'arrêt de Fleury-Mérogis", sous: "Essonne", zone: "loin", x: 0.6, y: 1.06, type: "prison", prison: "ma", horaires: "parloir",
      desc: "La plus grande maison d'arrêt d'Europe. Prévenus et courtes peines." },
    melun: { nom: "Centre de détention de Melun", sous: "Seine-et-Marne", zone: "loin", x: 0.92, y: 1.0, type: "prison", prison: "cd", horaires: "parloir",
      desc: "Condamnés orientés vers la réinsertion." },
    poissy: { nom: "Maison centrale de Poissy", sous: "Yvelines", zone: "loin", x: 0.02, y: 0.36, type: "prison", prison: "mc", horaires: "parloir",
      desc: "Longues peines, sécurité renforcée." },
    // phase 3 : les tribunaux de la petite couronne, la cour d'appel de Versailles, deux maisons d'arrêt (adresses à revérifier)
    tj_bobigny: { nom: "Tribunal judiciaire de Bobigny", sous: "Seine-Saint-Denis", zone: "couronne", geo: [2.4395, 48.9065], x: 0.873, y: 0.261, type: "palais", scene: "palais", plaque: "TRIBUNAL DE BOBIGNY", horaires: "greffe",
      desc: "Tribunal correctionnel, juges d'instruction, cour d'assises de la Seine-Saint-Denis." },
    tj_creteil: { nom: "Tribunal judiciaire de Créteil", sous: "Val-de-Marne", zone: "couronne", geo: [2.4489, 48.7896], x: 0.907, y: 0.822, type: "palais", scene: "palais", plaque: "TRIBUNAL DE CRÉTEIL", horaires: "greffe", cache: true,
      desc: "Tribunal correctionnel, juges d'instruction, cour d'assises du Val-de-Marne." },
    tj_nanterre: { nom: "Tribunal judiciaire de Nanterre", sous: "Hauts-de-Seine", zone: "couronne", geo: [2.2155, 48.8960], x: 0.067, y: 0.311, type: "palais", scene: "palais", plaque: "TRIBUNAL DE NANTERRE", horaires: "greffe",
      desc: "Tribunal correctionnel, juges d'instruction, cour d'assises des Hauts-de-Seine." },
    ca_versailles: { nom: "Cour d'appel de Versailles", sous: "Yvelines", zone: "loin", geo: [2.1300, 48.8030], x: -0.24, y: 0.76, type: "palais", scene: "palais", plaque: "COUR D'APPEL DE VERSAILLES", horaires: "greffe", cache: true,
      desc: "Appels des Hauts-de-Seine : chambre des appels correctionnels, chambre de l'instruction." },
    villepinte: { nom: "Maison d'arrêt de Villepinte", sous: "Seine-Saint-Denis", zone: "loin", geo: [2.5420, 48.9530], x: 1.24, y: 0.04, type: "prison", prison: "ma", scene: "fleury", plaque: "VILLEPINTE", horaires: "parloir", cache: true,
      desc: "Prévenus du tribunal de Bobigny." },
    ma_nanterre: { nom: "Maison d'arrêt des Hauts-de-Seine", sous: "Nanterre", zone: "couronne", geo: [2.2010, 48.9010], x: 0.015, y: 0.287, type: "prison", prison: "ma", scene: "fleury", plaque: "HAUTS-DE-SEINE", horaires: "parloir", cache: true,
      desc: "Prévenus du tribunal de Nanterre." },
    gendarmerie: { nom: "Brigade de gendarmerie de Montlhéry", sous: "Essonne", zone: "loin", x: 0.42, y: 1.05, type: "commissariat", horaires: null,
      desc: "Gardes à vue et auditions en zone gendarmerie." },
  };
  CR.PRISON_LABEL = { ma: "Maison d'arrêt", cp: "Centre pénitentiaire", cd: "Centre de détention", mc: "Maison centrale", csl: "Semi-liberté" };
  // Lieux temporaires : chaque affaire peut ajouter un point (le bar, le carrefour…)
  CR.placeOf = (s, id) => CR.PLACES[id] || ((s.tempPlaces || {})[id]) || null;
  CR.addTempPlace = (s, id, p) => { s.tempPlaces = s.tempPlaces || {}; s.tempPlaces[id] = Object.assign({ zone: "paris", type: "faits", horaires: null, temp: true }, p); };

  // ------------------------------------------------------------------ Horaires
  CR.HORAIRES = {
    greffe: { label: "9 h – 12 h et 13 h 30 – 17 h, jours ouvrés", plages: [[9 * 60, 12 * 60], [13 * 60 + 30, 17 * 60]], ouvres: true },
    parloir: { label: "9 h – 11 h 30 et 13 h 30 – 17 h 30, du lundi au samedi", plages: [[9 * 60, 11 * 60 + 30], [13 * 60 + 30, 17 * 60 + 30]], samedi: true },
    ordre: { label: "9 h 30 – 18 h 30, jours ouvrés", plages: [[9 * 60 + 30, 18 * 60 + 30]], ouvres: true },
    bureau: { label: "9 h – 18 h, jours ouvrés", plages: [[9 * 60, 18 * 60]], ouvres: true },
  };
  CR.isOpen = function (place, day, min) {
    if (!place || !place.horaires) return true;
    const h = CR.HORAIRES[place.horaires];
    if (!h) return true;
    if (h.ouvres && !CR.isBusinessDay(day)) return false;
    if (h.samedi && (CR.dow(day) === 0 || CR.holidayName(day))) return false;
    return h.plages.some(([a, b]) => min >= a && min < b);
  };
  CR.nextOpening = function (place, day, min) {
    if (!place || !place.horaires) return null;
    const h = CR.HORAIRES[place.horaires];
    for (const [a] of h.plages) if (min < a && CR.isOpen(place, day, a)) return { day, min: a };
    return null;
  };

  // ------------------------------------------------------------------ Trajets
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  CR.travelTime = function (s, from, to, mode) {
    if (from === to) return 0;
    const a = CR.placeOf(s, from), b = CR.placeOf(s, to);
    if (!a || !b) return 25;
    const d = dist(a, b);
    if (mode === "taxi") {
      // le taxi reste plus rapide que le métro (hors heures de pointe) : c'est ce qu'on paie
      let base = 8 + d * 78;
      if (CR.METRO && CR.METRO.itin) { try { const it = CR.METRO.itin(s, from, to); if (it && it.min > 0) base = Math.min(base, Math.max(4, it.min * 0.72)); } catch (e) { /* estimation */ } }
      return Math.round(base + (s.min >= 8 * 60 && s.min < 10 * 60 || s.min >= 17 * 60 && s.min < 19 * 60 ? 10 : 0));
    }
    // en métro : l'itinéraire réel (marche, attente, stations, correspondances), sinon l'ancienne estimation
    if (CR.METRO && CR.METRO.itin) { try { const it = CR.METRO.itin(s, from, to); if (it && it.min > 0) return it.min; } catch (e) { /* estimation */ } }
    return Math.round(12 + d * 105);
  };
  CR.taxiCost = (s, from, to) => { const a = CR.placeOf(s, from), b = CR.placeOf(s, to); return a && b ? Math.round((12 + dist(a, b) * 105) / 5) * 5 : 30; };
  CR.travel = function (s, to, mode) {
    if (s.at === to) return 0;
    const t = CR.travelTime(s, s.at, to, mode);
    if (mode === "taxi") { const c = CR.taxiCost(s, s.at, to); CR.payOut(s, c, "Taxi"); }
    CR.spend(s, t, "travel");
    s.at = to;
    return t;
  };
  CR.whereLabel = (s) => { const p = CR.placeOf(s, s.at); return p ? p.nom : "En déplacement"; };
})();
