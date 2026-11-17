/* La Permanence — d'autres sources (1.5.4 « La preuve filmée », D-101, à la demande de Kevin).
   - La caméra de bord d'une voiture qui circule dans la rue (décor « rue ») : un piéton renversé sur le passage,
     un dépassement dangereux, un conducteur qui descend frapper la vitre. Les véhicules roulent (scn.vehicules).
   - L'appel vidéo enregistré par la victime (décor « appartement », chez l'appelant) : l'ex qui menace malgré
     l'interdiction de contact, le harcèlement, les appels malveillants. Format vertical, durée de l'appel, son.
   - L'intérieur d'un commerce (boutique, restaurant, bar) : la main dans la caisse, le rachat de téléphones au
     comptoir, le client qui part sans payer, la bagarre au comptoir.
   - Le RER : le décor du bus, en voiture de train (les faits du bus s'y jouent).
   Mêmes principes que video.js : tout sort de la graine ; l'image ne montre que ce que la simulation sait. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const CR = (root.CR = root.CR || {});
  const V = CR.video;
  if (!V || !V.outils || !V.DECORS.rue || !V.DECORS.appartement || !V.DECORS.bus) return;
  const { bruit, rng, pick, lerp, clamp, smooth, frac, h2, add, mul, P, tenue, PEAU, CHEV } = V.outils;
  const PL = (CR.VPLUS = {});

  function acteur(r, id, role, o) {
    const g = o.g || (r() < 0.5 ? "f" : "m");
    const A = { id, role, g, t0: o.t0 || 0, pos: o.pos.slice(), cap: o.cap != null ? o.cap : 0, beats: [], tenue: o.tenue || tenue(r, o.tenueO || {}) };
    A.peau = pick(r, PEAU); A.chev = pick(r, CHEV); A.sc = (1.62 + r() * 0.24) / 1.75; if (g === "f") A.sc = Math.min(A.sc, 0.95);
    if (o.agee) { A.agee = true; A.chev = CHEV[4]; A.sc *= 0.96; }
    return A;
  }
  const boite = (PR, a, b, m, x) => PR.push(Object.assign({ k: "box", a, b, m }, x || {}));
  const dire = (L, t, qui, nom, texte, d, x) => { L.push(Object.assign({ t0: t, t1: t + (d || Math.max(1.4, texte.length / 14)), qui, nom, texte }, x || {})); };
  const voix = (A) => (A.g === "f" ? "Une femme" : "Un homme");
  const COULEURS_VOITURE = { gris: [0.28, 0.28, 0.3], noir: [0.03, 0.03, 0.035], blanc: [0.7, 0.7, 0.68], rouge: [0.35, 0.03, 0.03], bleu: [0.04, 0.07, 0.17] };
  const COUL_NOM = { gris: "grise", noir: "noire", blanc: "blanche", rouge: "rouge", bleu: "bleue" };

  // ---------------------------------------------------------------- 1. la caméra de bord
  // On roule à droite : vers +x sur la voie z = 13,2 (stationnement à droite), vers -x sur la voie z = 15,3. La voiture
  // qui filme : cles [{ t, x }], sens (+1 vers +x, -1 vers -x), voie ; à 1,25 m du sol.
  function bord(cles, sens, z) {
    return function camAt(t) {
      let a = cles[0], b = cles[cles.length - 1];
      for (let k = 0; k < cles.length - 1; k++) if (t >= cles[k].t && t <= cles[k + 1].t) { a = cles[k]; b = cles[k + 1]; break; }
      const u = b.t > a.t ? clamp((t - a.t) / (b.t - a.t), 0, 1) : 0, x = lerp(a.x, b.x, u), roule = Math.abs(b.x - a.x) > 0.5 && u < 1;
      const vib = roule ? 0.006 * Math.sin(t * 23) + 0.004 * (bruit(t * 8, 3) - 0.5) : 0;
      return { pos: [x, 1.25 + vib, z], yaw: (sens > 0 ? Math.PI / 2 : -Math.PI / 2) + vib, pitch: 0.07 + vib, fov: 100 };
    };
  }
  const BORD = { style: "bord", fps: 15, sansSauts: true, distorsion: 0.3, capteur: 1.3 };

  // Un piéton renversé sur le passage : la voiture qui filme arrive en sens inverse et voit le piéton traverser devant
  // elle ; la voiture en cause, sur l'autre voie, ne s'arrête pas avant le passage. o : fuite, couleur, victime { g }
  V.FAITS.bord_pieton = {
    nom: "Caméra de bord : un piéton renversé", decor: "rue",
    monter(r, o) {
      const ov = o.victime || {}, coul = o.couleur || pick(r, Object.keys(COULEURS_VOITURE)), tI = 5.4, xP = -4.5;
      const Vv = acteur(r, "V", "victime", { g: ov.g || (r() < 0.5 ? "f" : "m"), agee: ov.agee, pos: [xP, 16.7], cap: -Math.PI / 2 });
      Vv.beats = [{ a: "attend", d: 1.4, face: -Math.PI / 2 }, { a: "marche", d: tI - 1.4, to: [xP, 13.55] }, { a: "tombe", d: 0.8, to: [xP + 1.2, 13.3], sens: 1, fondu: 0.08 }, { a: "au_sol", d: 20, sens: 1 }];
      const xC = (t) => xP - 2.1 + 7 * (t - tI); // le centre de la voiture en cause : son avant touche le piéton à tI
      const cles = [{ t: 0, x: xC(0), z: 13.2, cap: 0 }, { t: tI, x: xC(tI), z: 13.2, cap: 0 }];
      if (o.fuite) cles.push({ t: tI + 0.5, x: xC(tI) + 2.6, z: 13.2, cap: 0 }, { t: tI + 5, x: 45, z: 13.1, cap: 0 });
      else cles.push({ t: tI + 1.6, x: xC(tI) + 5.2, z: 13.1, cap: 0 }, { t: 60, x: xC(tI) + 5.2, z: 13.1, cap: 0 });
      const vehicules = [{ id: "VA", couleur: COULEURS_VOITURE[coul], cles }];
      const cam = [{ t: 0, x: xP + 10 + 5 * tI }, { t: tI, x: xP + 10 }, { t: tI + 1.2, x: xP + 8 }, { t: 60, x: xP + 8 }];
      const L = [], moments = [
        { t: 1.2, cle: "suit", txt: `Le véhicule équipé de la caméra circule ; sur l'autre voie, en sens inverse, arrive une voiture ${COUL_NOM[coul]}.` },
        { t: 3.2, cle: "engage", txt: "«V» traverse sur le passage piéton, devant le véhicule qui filme, qui ralentit." },
        { t: tI + 0.1, cle: "choc", txt: `La voiture ${COUL_NOM[coul]} ne ralentit pas avant le passage et heurte «V», qui tombe sur la chaussée.` },
        o.fuite ? { t: tI + 2.4, cle: "fuite", txt: `La voiture ${COUL_NOM[coul]} poursuit sa route sans s'arrêter et sort du champ.` } : { t: tI + 2.0, cle: "arret", txt: `La voiture ${COUL_NOM[coul]} s'arrête quelques mètres plus loin.` },
        { t: tI + 4, cle: "sol", txt: "«V» reste au sol." },
      ];
      dire(L, tI + 0.4, "filmeur", "La personne au volant", "Oh ! Oh non !", 1.2);
      dire(L, tI + 2.2, "filmeur", "La personne au volant", o.fuite ? "Il se tire ! Il s'arrête même pas !" : "Il l'a pas vu… Appelle les secours !", 1.8);
      return Object.assign({ acteurs: [Vv], vehicules, objet: null, objetAt: () => null, moments, duree: Math.ceil(tI + 8), tG: tI, paroles: L, camAt: bord(cam, -1, 15.3), couleur: coul, fuite: !!o.fuite }, BORD);
    },
  };

  // Un dépassement dangereux : la voiture surgit par la gauche, se rabat devant, frôle un piéton sur le passage
  V.FAITS.bord_dangereux = {
    nom: "Caméra de bord : une conduite dangereuse", decor: "rue",
    monter(r, o) {
      const coul = o.couleur || pick(r, Object.keys(COULEURS_VOITURE)), tP = 3.3, xP = -4.5;
      const Vv = acteur(r, "V", "victime", { pos: [xP, 9.1], cap: Math.PI / 2 });
      Vv.beats = [{ a: "attend", d: 1.0, face: Math.PI / 2 }, { a: "marche", d: tP - 1.0 - 0.3, to: [xP, 12.3] }, { a: "sursaut", d: 1.2, face: Math.PI / 2 }, { a: "marche", d: 1.4, to: [xP, 10.2], face: Math.PI / 2 }, { a: "attend", d: 20, face: -Math.PI / 2 }];
      const camX = (t) => -30 + 6.0 * t;
      const cles = [{ t: 0, x: camX(0) - 16, z: 15.3, cap: 0 }, { t: 1.6, x: camX(1.6) + 4, z: 15.3, cap: 0 }, { t: 2.4, x: camX(2.4) + 12, z: 13.2, cap: -0.25 }, { t: tP, x: xP + 0.6, z: 13.0, cap: 0 }, { t: tP + 3, x: 60, z: 13.2, cap: 0 }];
      const vehicules = [{ id: "VA", couleur: COULEURS_VOITURE[coul], cles }];
      const L = [], moments = [
        { t: 1.3, cle: "depasse", txt: `Une voiture ${COUL_NOM[coul]} dépasse par la gauche, à vive allure, sur la voie de circulation opposée.` },
        { t: 2.3, cle: "rabat", txt: `La voiture ${COUL_NOM[coul]} se rabat brusquement devant le véhicule qui filme.` },
        { t: tP, cle: "pieton", txt: "Un piéton, «V», engagé sur le passage, recule précipitamment ; la voiture passe à moins d'un mètre de lui sans ralentir." },
        { t: tP + 1.6, cle: "part", txt: `La voiture ${COUL_NOM[coul]} poursuit sa route et sort du champ.` },
      ];
      dire(L, 1.5, "filmeur", "La personne au volant", "Mais il est fou, lui !", 1.2);
      dire(L, tP + 0.4, "filmeur", "La personne au volant", "Le piéton ! Il a failli le tuer !", 1.6);
      return Object.assign({ acteurs: [Vv], vehicules, objet: null, objetAt: () => null, moments, duree: Math.ceil(tP + 6), tG: tP, paroles: L, camAt: bord([{ t: 0, x: camX(0) }, { t: 30, x: camX(30) }], 1, 13.2), couleur: coul }, BORD);
    },
  };

  // Un conducteur s'arrête devant, descend, vient frapper la vitre du conducteur ; o : propos, auteur { g, tenue }
  V.FAITS.bord_colere = {
    nom: "Caméra de bord : un conducteur en colère", decor: "rue",
    monter(r, o) {
      const oa = o.auteur || {}, coul = o.couleur || pick(r, Object.keys(COULEURS_VOITURE)), tS = 3.0, xCam = -6, xA = xCam + 7;
      const vehicules = [{ id: "VA", couleur: COULEURS_VOITURE[coul], cles: [{ t: 0, x: xA - 20, z: 13.2, cap: 0 }, { t: tS, x: xA, z: 13.2, cap: 0 }, { t: 60, x: xA, z: 13.2, cap: 0 }] }];
      const A = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: [xA - 0.2, 14.1], cap: Math.PI, t0: tS + 0.8, tenueO: { capuche: 0.1 } });
      const pres = [xCam + 1.0, 14.25], vitre = [xCam + 0.35, 1.3, 13.65];
      A.beats = [{ a: "marche", d: 3.4, to: pres }, { a: "menace", d: 3.6, face: Math.PI + 0.35 }, { a: "frappe", d: 0.45, face: Math.PI + 0.35, cible: vitre, fondu: 0.1 }, { a: "attend", d: 0.2, face: Math.PI + 0.35 }, { a: "frappe", d: 0.45, face: Math.PI + 0.35, cible: vitre, fondu: 0.1 }, { a: "regarde", d: 0.8, face: 0 }, { a: "marche", d: 3.2, to: [xA - 0.2, 14.1] }, { a: "marche", d: 0.5, to: [xA - 0.2, 13.5] }];
      A.sort = true;
      const tG = tS + 0.8 + 3.4;
      const L = [], moments = [
        { t: tS - 0.5, cle: "arret", txt: `Une voiture ${COUL_NOM[coul]} s'arrête brusquement en pleine voie, devant le véhicule qui filme, qui s'arrête à son tour.` },
        { t: tS + 1.6, cle: "descend", txt: "Le conducteur, «A», descend et marche vers le véhicule qui filme." },
        { t: tG + 0.6, cle: "menace", txt: "«A», contre la portière du conducteur, crie en pointant le doigt vers lui." },
        { t: tG + 3.9, cle: "frappe", txt: "«A» frappe deux fois du poing sur la vitre du conducteur ; l'image tremble." },
        { t: tG + 6.5, cle: "repart", txt: "«A» retourne à sa voiture." },
      ];
      const pr = (o.propos && o.propos.length ? o.propos : ["Tu sais pas conduire, connard ?", "Descends, descends si t'es un homme !"]).slice(0, 2);
      pr.forEach((p, k) => dire(L, tG + 0.4 + k * 1.9, "A", `${voix(A)} (l'individu)`, p, 1.8));
      dire(L, tG + 2.5, "filmeur", "La personne au volant", "Je filme, monsieur. Reculez.", 1.4);
      return Object.assign({ acteurs: [A], vehicules, objet: null, objetAt: () => null, moments, duree: Math.ceil(tG + 11), tG, paroles: L, couleur: coul,
        camAt: bord([{ t: 0, x: xCam - 20 }, { t: tS + 0.4, x: xCam }, { t: 60, x: xCam }], 1, 13.2) }, BORD);
    },
  };

  // ---------------------------------------------------------------- 2. l'appel vidéo enregistré
  // L'appelant chez lui, téléphone tenu à bout de bras ; o : genre ("ex" | "harcelement" | "menaces"), propos, auteur
  V.FAITS.visio_appel = {
    nom: "Enregistrement d'un appel vidéo", decor: "appartement",
    monter(r, o) {
      const oa = o.auteur || {}, genre = o.genre || "ex";
      const A = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: [0.33, 1.15], cap: -Math.PI / 2, tenueO: { capuche: 0, couvre: 0.05, sac: null } });
      if (A.tenue.tete) A.tenue = Object.assign({}, A.tenue, { tete: null });
      const L = [], nomA = `${voix(A)} (l'appelant)`, nomV = "La personne qui enregistre";
      const lignes = (o.propos && o.propos.length ? o.propos : {
        ex: ["Tu crois que ton papier du juge va m'empêcher de te parler ?", "Je sais où tu es. Je vais venir, tu vas voir."],
        harcelement: ["Tu réponds plus ? Tu te crois mieux que moi ?", "Je vais t'appeler toute la nuit s'il le faut."],
        menaces: ["Si tu portes plainte, je te jure que tu le regretteras.", "Je vais tout casser chez toi."],
      }[genre]).slice(0, 2);
      let t = 0.6;
      dire(L, t, "A", nomA, genre === "ex" ? "Ah, enfin tu décroches." : "Tu m'entends ? Regarde-moi quand je te parle.", 1.6); t += 2.0;
      dire(L, t, "V", nomV, pick(r, ["Arrête de m'appeler.", "Je t'ai dit de ne plus m'appeler."]), 1.4); t += 1.8;
      dire(L, t, "A", nomA, lignes[0], 2.2); t += 2.6;
      if (lignes[1]) { dire(L, t, "A", nomA, lignes[1], 2.2); t += 2.6; }
      dire(L, t, "V", nomV, "J'enregistre, là. Tout est enregistré.", 1.6); t += 2.0;
      dire(L, t, "A", nomA, pick(r, ["Enregistre, je m'en fous !", "Et alors ? Qu'est-ce que ça change ?"]), 1.6); t += 2.2;
      A.beats = [{ a: "attend", d: 4.4, face: -Math.PI / 2 }, { a: "menace", d: t - 4.4, face: -Math.PI / 2 }, { a: "attend", d: 4, face: -Math.PI / 2 }];
      const moments = [
        { t: 0.8, cle: "visage", txt: "L'appelant, «A», apparaît en gros plan, filmé de face par son propre téléphone, dans une pièce d'habitation." },
        { t: 4.8, cle: "geste", txt: "«A» parle fort et pointe le doigt vers l'écran." },
        { t: t, cle: "fin", txt: "La communication est coupée." },
      ];
      return { acteurs: [A], objet: null, objetAt: () => null, moments, duree: Math.ceil(t + 2), tG: 4.8, paroles: L, style: "visio", lumieres: [{ p: [0.33, 1.5, 0.75], c: [0.55, 0.6, 0.7], r: 1.1 }], fps: 15, sansSauts: true, distorsion: 0.05, capteur: 1.6,
        camAt: (tt) => ({ pos: [0.33 + 0.01 * Math.sin(tt * 1.3), 1.5 + 0.012 * Math.sin(tt * 0.9), 0.62], yaw: 0.0 + 0.015 * Math.sin(tt * 0.7), pitch: 0.06, fov: 94 }), debutAppel: o.debutAppel || 0 };
    },
  };

  // ---------------------------------------------------------------- 3. l'intérieur d'un commerce
  // x de -4 à 4, z de 0 à 8 ; comptoir au fond à gauche (z de 4,6 à 5,3), caisse dessus ; porte vitrée dans le mur de
  // droite (z de 1,2 à 2,4). Variantes : boutique (téléphonie), restaurant (tables), bar (bouteilles, tabourets).
  function commerce(variante) {
    return {
      nom: { boutique: "Boutique", restaurant: "Restaurant", bar: "Bar" }[variante],
      variante,
      // la boutique : la caméra surveille la caisse, de près ; ailleurs, la salle depuis l'angle de la porte
      camera: variante === "boutique" ? { pos: [1.3, 2.65, 2.3], yaw: -0.95, pitch: 0.62, fov: 92 } : { pos: [3.6, 2.6, 0.45], yaw: -0.6, pitch: 0.46, fov: 92 },
      zf: 8, zn: -0.1, capteur: 1.4,
      comptoir: { x0: -3.6, x1: -0.4, z0: 4.6, z1: 5.3 }, caisse: [-1.2, 5.75], porte: { dedans: [3.4, 1.8], dehors: [4.6, 1.8] }, tables: [[0.8, 2.6], [2.3, 3.8], [0.6, 6.4]],
      prims(r) {
        const PR = [], teinte = pick(r, [[0.55, 0.42, 0.3], [0.3, 0.38, 0.42], [0.5, 0.2, 0.15], [0.25, 0.3, 0.22]]);
        this.teinte = teinte;
        const mur = { f: (p, n, nuit) => {
          if (p[0] > 3.9 && p[2] > 1.2 && p[2] < 2.4 && p[1] < 2.2) return { c: [0.1, 0.12, 0.14], e: nuit ? [0.08, 0.07, 0.05] : [0.45, 0.5, 0.55], s: 0.9 };
          return { c: mul(p[1] < 1.0 ? mul(teinte, 0.7) : [0.78, 0.75, 0.7], 0.92 + 0.08 * bruit(p[2] * 2, p[1] * 2)) };
        } };
        boite(PR, [-4.2, 0, -0.2], [-4.0, 2.8, 8.2], mur); boite(PR, [4.0, 0, -0.2], [4.2, 2.8, 8.2], mur);
        boite(PR, [-4.2, 2.8, -0.2], [4.2, 2.9, 8.2], { c: [0.8, 0.79, 0.76] }, { sansOmbre: true });
        for (const [x, z] of [[-1.8, 2.2], [1.8, 2.2], [-1.8, 5.8], [1.8, 5.8]]) boite(PR, [x - 0.3, 2.76, z - 0.3], [x + 0.3, 2.8, z + 0.3], { c: [0.9, 0.88, 0.8], e: [1.0, 0.95, 0.85] }, { sansOmbre: true });
        const C = this.comptoir, bois = { f: (p) => ({ c: mul(variante === "bar" ? [0.3, 0.16, 0.08] : [0.6, 0.58, 0.55], 0.85 + 0.2 * bruit(p[0] * 6, p[1] * 2)), s: 0.4 }) };
        boite(PR, [C.x0, 0, C.z0], [C.x1, 1.05, C.z1], bois);
        boite(PR, [this.caisse[0] - 0.22, 1.05, C.z0 + 0.15], [this.caisse[0] + 0.22, 1.3, C.z0 + 0.5], { c: [0.12, 0.12, 0.13], s: 0.5 });
        boite(PR, [this.caisse[0] - 0.18, 1.3, C.z0 + 0.35], [this.caisse[0] + 0.18, 1.52, C.z0 + 0.4], { c: [0.05, 0.1, 0.15], e: [0.1, 0.2, 0.3] });
        if (variante === "restaurant" || variante === "bar") for (const [x, z] of variante === "bar" ? [[0.6, 2.4], [2.4, 3.6]] : this.tables) {
          PR.push({ k: "cyl", x, z, r: 0.04, y0: 0, y1: 0.74, m: { c: [0.15, 0.15, 0.15] } });
          PR.push({ k: "cyl", x, z, r: 0.42, y0: 0.74, y1: 0.78, m: { c: [0.85, 0.83, 0.78], s: 0.3 } });
          for (const dx of [-0.6, 0.6]) boite(PR, [x + dx - 0.2, 0.42, z - 0.2], [x + dx + 0.2, 0.46, z + 0.2], bois);
        }
        if (variante === "bar") for (let x = C.x0 + 0.3; x < C.x1; x += 0.7) { PR.push({ k: "cyl", x, z: C.z0 - 0.35, r: 0.03, y0: 0, y1: 0.75, m: { c: [0.5, 0.5, 0.5], s: 0.6 } }); PR.push({ k: "cyl", x, z: C.z0 - 0.35, r: 0.18, y0: 0.75, y1: 0.8, m: { c: [0.15, 0.08, 0.05] } }); }
        if (variante === "boutique") { boite(PR, [1.5, 0, 6.2], [3.8, 1.0, 6.9], { c: [0.85, 0.85, 0.85], s: 0.6 }); boite(PR, [1.55, 1.0, 6.25], [3.75, 1.04, 6.85], { c: [0.4, 0.45, 0.5], e: [0.05, 0.06, 0.08], s: 0.9 }); }
        return PR;
      },
      solY() { return 0; },
      sol(x, z) {
        if (variante === "bar" || variante === "restaurant") { const lame = Math.floor((x + 10) / 0.12), j = frac((x + 10) / 0.12) < 0.06; const k = (0.75 + 0.3 * h2(lame, Math.floor(z / 1.1))) * (j ? 0.6 : 1); return { c: [0.32 * k, 0.2 * k, 0.11 * k], s: 0.4 }; }
        const j = frac((x + 10) / 0.5) < 0.03 || frac(z / 0.5) < 0.03; const k = (0.9 + 0.1 * h2(Math.floor((x + 10) / 0.5), Math.floor(z / 0.5))) * (j ? 0.7 : 1); return { c: [0.68 * k, 0.67 * k, 0.64 * k], s: 0.5 };
      },
      facade(x, y) {
        const C = this.comptoir;
        // derrière le comptoir : rayonnages (bouteilles du bar, accessoires de la boutique, passe-plat du restaurant)
        if (x > C.x0 - 0.3 && x < C.x1 + 0.3 && y > 1.1 && y < 2.4) {
          const etagere = frac((y - 1.1) / 0.4) < 0.08;
          if (etagere) return { c: [0.4, 0.3, 0.2] };
          if (variante === "restaurant") return x > -2.6 && x < -1.4 && y < 2.0 ? { c: [0.15, 0.15, 0.15], e: [0.25, 0.22, 0.18] } : { c: [0.75, 0.75, 0.72] };
          const o = h2(Math.floor((x + 10) / (variante === "bar" ? 0.09 : 0.16)), Math.floor((y - 1.1) / 0.4));
          const col = variante === "bar" ? [[0.15, 0.3, 0.1], [0.5, 0.35, 0.08], [0.6, 0.6, 0.55], [0.3, 0.05, 0.05], [0.1, 0.12, 0.3]][Math.floor(o * 5)] : [[0.1, 0.1, 0.12], [0.85, 0.85, 0.85], [0.3, 0.4, 0.7], [0.7, 0.3, 0.3]][Math.floor(o * 4)];
          return { c: frac((y - 1.1) / 0.4) > 0.75 ? [0.2, 0.18, 0.16] : col, s: 0.6 };
        }
        const t = this.teinte || [0.5, 0.4, 0.3];
        if (y > 2.3 && y < 2.6) return { c: mul(t, 1.2) };
        return { c: mul(y < 1.0 ? mul(t, 0.7) : [0.78, 0.75, 0.7], 0.92 + 0.08 * bruit(x * 2, y * 2)) };
      },
      facadeN() { return { c: [0.3, 0.3, 0.3] }; },
      ambiance(mode) { return { amb: mode === "jour" ? [0.1, 0.1, 0.1] : [0.06, 0.055, 0.05], sun: null }; },
      lumieres() { return [[-1.8, 2.2], [1.8, 2.2], [-1.8, 5.8], [1.8, 5.8]].map(([x, z]) => ({ p: [x, 2.7, z], c: variante === "bar" ? [1.1, 0.85, 0.6] : [1.0, 1.0, 0.95], r: 3.0 })); },
    };
  }
  V.DECORS.boutique = commerce("boutique");
  V.DECORS.restaurant = commerce("restaurant");
  V.DECORS.bar_salle = commerce("bar");

  const DOME = { distorsion: 0.35 };
  const sansCapuche = (A) => { if (A.tenue.tete === "capuche") A.tenue = Object.assign({}, A.tenue, { tete: null }); return A; };
  // La main dans la caisse : un client paie et part ; l'employé ouvre le tiroir, prend des billets, les met dans sa poche
  V.FAITS.caisse_poche = {
    nom: "La main dans la caisse", decor: "boutique",
    monter(r, o) {
      const D = V.DECORS.boutique, oa = o.auteur || {}, C = D.comptoir, cx = D.caisse[0];
      const A = sansCapuche(acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: D.caisse, cap: -Math.PI / 2, tenueO: { capuche: 0, couvre: 0, sac: null } }));
      const K = acteur(r, "C1", "client", { pos: D.porte.dehors, cap: Math.PI });
      K.beats = [{ a: "marche", d: 3.4, to: [cx + 0.1, C.z0 - 0.45] }, { a: "tend", d: 1.4, face: Math.PI / 2 }, { a: "attend", d: 1.0, face: Math.PI / 2 }, { a: "marche", d: 3.4, to: D.porte.dedans }, { a: "marche", d: 1.2, to: D.porte.dehors }];
      K.sort = true;
      const tiroir = [cx, 1.0, C.z0 + 0.35], poche = [cx + 0.25, 0.95, D.caisse[1] - 0.1];
      A.beats = [{ a: "attend", d: 3.6, face: -Math.PI / 2 }, { a: "tend", d: 1.4, face: -Math.PI / 2 }, { a: "attend", d: 4.2, face: -Math.PI / 2 }, { a: "regarde", d: 1.2, face: -Math.PI / 2 + 0.8 },
        { a: "prend", d: 0.9, face: -Math.PI / 2, cible: tiroir }, { a: "glisse", d: 1.0, face: -Math.PI / 2, cible: poche }, { a: "regarde", d: 1.2, face: -Math.PI / 2 - 0.6 }, { a: "attend", d: 10, face: -Math.PI / 2 }];
      const tP = 3.6 + 1.4 + 4.2 + 1.2;
      const moments = [
        { t: 4.2, cle: "paie", txt: "Un client règle un achat ; «A», derrière le comptoir, encaisse et lui rend la monnaie." },
        { t: tP - 0.8, cle: "regarde", txt: "Le client parti, «A» regarde vers la porte et vers la réserve." },
        { t: tP + 0.4, cle: "prend", txt: "«A» ouvre le tiroir-caisse, en retire des billets et les glisse dans la poche de son pantalon, sans saisir d'opération." },
      ];
      return Object.assign({ acteurs: [A, K], objet: null, objetAt: () => null, moments, duree: Math.ceil(tP + 6), tG: tP + 0.4 }, DOME);
    },
  };

  // Le rachat au comptoir : un vendeur sort des téléphones d'un sac ; le commerçant, «A», les examine, paie en
  // espèces, les range sous le comptoir
  V.FAITS.vente_comptoir = {
    nom: "Rachat de téléphones au comptoir", decor: "boutique",
    monter(r, o) {
      const D = V.DECORS.boutique, oa = o.auteur || {}, C = D.comptoir, cx = D.caisse[0] - 0.9;
      const A = sansCapuche(acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: [cx, D.caisse[1]], cap: -Math.PI / 2, tenueO: { capuche: 0, couvre: 0, sac: null } }));
      const B = acteur(r, "B1", "vendeur", { pos: D.porte.dehors, cap: Math.PI, tenueO: { capuche: 0.8, sac: "sac_dos" } });
      const pres = [cx + 0.05, C.z0 - 0.45], comptoir = [cx, 1.08, C.z0 + 0.1];
      B.beats = [{ a: "marche", d: 3.4, to: pres }, { a: "regarde", d: 0.8, face: 0 }, { a: "prend", d: 1.2, face: Math.PI / 2, cible: comptoir }, { a: "prend", d: 1.2, face: Math.PI / 2, cible: comptoir }, { a: "attend", d: 4.2, face: Math.PI / 2 }, { a: "tend", d: 1.2, face: Math.PI / 2 }, { a: "marche", d: 3.4, to: D.porte.dedans }, { a: "marche", d: 1.2, to: D.porte.dehors }];
      B.sort = true;
      A.beats = [{ a: "attend", d: 5.4, face: -Math.PI / 2 }, { a: "penche", d: 3.0, face: -Math.PI / 2 }, { a: "tend", d: 1.6, face: -Math.PI / 2 }, { a: "penche", d: 1.6, face: -Math.PI / 2 }, { a: "regarde", d: 1.2, face: -Math.PI / 2 + 0.7 }, { a: "attend", d: 12, face: -Math.PI / 2 }];
      const moments = [
        { t: 3.0, cle: "entree", txt: "«B1» entre, un sac à dos sur l'épaule, et se dirige vers le comptoir." },
        { t: 5.0, cle: "pose", txt: "«B1» sort du sac plusieurs téléphones et les pose sur le comptoir, l'un après l'autre." },
        { t: 7.0, cle: "examine", txt: "«A» examine les téléphones un par un, les allume, les retourne." },
        { t: 9.2, cle: "paie", txt: "«A» sort des billets de sa poche et les remet à «B1», sans établir de document." },
        { t: 10.8, cle: "range", txt: "«A» range les téléphones sous le comptoir, puis jette un regard vers la porte." },
      ];
      return Object.assign({ acteurs: [A, B], objet: null, objetAt: () => null, moments, duree: Math.ceil(16), tG: 9.2 }, DOME);
    },
  };

  // Partir sans payer : «A» finit son repas, attend que le serveur passe en cuisine, se lève et sort
  V.FAITS.filouterie = {
    nom: "Départ sans payer", decor: "restaurant",
    monter(r, o) {
      const D = V.DECORS.restaurant, oa = o.auteur || {}, tb = D.tables[0];
      const A = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: [tb[0] + 0.6, tb[1]], cap: Math.PI, tenueO: { capuche: 0, sac: null } });
      const S_ = acteur(r, "S1", "serveur", { pos: [-0.8, 3.0], cap: 0, tenueO: { hauts: ["blouson"], couvre: 0, sac: null } });
      A.beats = [{ a: "assis", d: 5.0, face: Math.PI }, { a: "regarde", d: 1.2, face: Math.PI / 2, fondu: 0.8 }, { a: "marche", d: 2.6, to: D.porte.dedans }, { a: "marche", d: 1.2, to: D.porte.dehors }];
      A.sort = true;
      S_.beats = [{ a: "marche", d: 2.4, to: [tb[0] - 0.2, tb[1] - 0.5] }, { a: "tend", d: 1.0, face: 0 }, { a: "marche", d: 2.6, to: [-1.8, 5.8] }, { a: "marche", d: 1.0, to: [-1.8, 7.6] }, { a: "attend", d: 8 }];
      const moments = [
        { t: 2.6, cle: "addition", txt: "Le serveur dépose une note sur la table de «A», qui termine son repas." },
        { t: 5.6, cle: "cuisine", txt: "Le serveur passe derrière le comptoir et sort du champ vers la cuisine." },
        { t: 6.4, cle: "leve", txt: "«A» se lève, regarde vers le comptoir, puis se dirige vers la porte." },
        { t: 8.6, cle: "sort", txt: "«A» sort du restaurant sans s'être arrêté à la caisse." },
      ];
      return Object.assign({ acteurs: [A, S_], objet: null, objetAt: () => null, moments, duree: 14, tG: 6.4 }, DOME);
    },
  };

  // La bagarre au comptoir du bar ; o : premier ("A" | "V"), coups, chute
  V.FAITS.bar_coups = {
    nom: "Coups au comptoir d'un bar", decor: "bar_salle",
    monter(r, o) {
      const D = V.DECORS.bar_salle, oa = o.auteur || {}, ov = o.victime || {}, z = D.comptoir.z0 - 0.5;
      const Vv = acteur(r, "V", "victime", { g: ov.g || "m", pos: [-2.0, z], cap: 0 });
      const A = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: [-0.9, z], cap: Math.PI, tenueO: { capuche: 0.2 } });
      const tG = 5.0 + r() * 1.2, prem = o.premier === "V" ? "V" : "A", n = clamp(o.coups || 1 + Math.floor(r() * 2), 1, 3);
      Vv.beats = [{ a: "attend", d: 2.2, face: Math.PI / 2 }, { a: prem === "V" ? "menace" : "regarde", d: tG - 2.2, face: 0 }];
      A.beats = [{ a: "attend", d: 2.2, face: Math.PI / 2 }, { a: prem === "A" ? "menace" : "attend", d: tG - 2.2, face: Math.PI }];
      const tete = (X) => [X.pos[0], 1.55 * X.sc, X.pos[1]];
      const hit = (X, Y) => { X.beats.push({ a: "frappe", d: 0.4, face: X === A ? Math.PI : 0, cible: tete(Y), fondu: 0.12 }); Y.beats.push({ a: "encaisse", d: 0.55, fondu: 0.1 }); };
      const moments = [{ t: 3.0, cle: "face", txt: "Au comptoir, «V» et «A» se tournent l'un vers l'autre ; le ton paraît monter." }];
      let t = tG;
      if (prem === "V") { hit(Vv, A); A.beats.push({ a: "attend", d: 0.2 }); Vv.beats.push({ a: "attend", d: 0.25 }); hit(A, Vv); t += 1.3; moments.push({ t: tG + 0.15, cle: "premier", txt: "«V» porte le premier coup, au visage de «A»." }, { t: tG + 1.0, cle: "riposte", txt: "«A» riposte aussitôt d'un coup de poing." }); }
      else { for (let k = 0; k < n; k++) { hit(A, Vv); t += 0.6; } moments.push({ t: tG + 0.15, cle: "premier", txt: `«A» porte ${n > 1 ? ["", "un", "deux", "trois"][n] + " coups de poing" : "un coup de poing"} au visage de «V», qui n'a pas de geste vers lui auparavant.` }); }
      if (o.chute) { Vv.beats.push({ a: "tombe", d: 0.75, sens: 1, fondu: 0.1 }, { a: "au_sol", d: 5, sens: 1 }, { a: "releve", d: 2.4, sens: 1 }); moments.push({ t: t + 0.4, cle: "chute", txt: "«V» tombe contre un tabouret et reste au sol quelques secondes." }); }
      else Vv.beats.push({ a: "sursaut", d: 1.0 }, { a: "attend", d: 10, face: 0 });
      A.beats.push({ a: "regarde", d: 1.2, face: 0 }, { a: "marche", d: 3.4, to: D.porte.dedans }, { a: "marche", d: 1.2, to: D.porte.dehors });
      A.sort = true;
      moments.push({ t: t + 3.0, cle: "sortie", txt: "«A» quitte le bar par la porte." });
      return Object.assign({ acteurs: [Vv, A], objet: null, objetAt: () => null, moments, duree: Math.ceil(t + 8), tG }, DOME);
    },
  };

  // ---------------------------------------------------------------- 4. le RER : le bus, en voiture de train
  V.DECORS.rer = Object.assign(Object.create(V.DECORS.bus), {
    nom: "RER, caméra de la voiture",
    ambiance() { return { amb: [0.05, 0.05, 0.055], sun: null }; },
    sol(x, z) { const k = 0.9 + 0.1 * h2(Math.floor(x * 20), Math.floor(z * 20)); return { c: [0.22 * k, 0.2 * k, 0.18 * k], s: 0.3 }; },
    facade(x, y) { if (Math.abs(x) < 0.45 && y < 1.95) return { c: [0.35, 0.36, 0.38], s: 0.6 }; return { c: [0.55, 0.58, 0.62] }; },
    lumieres() { return [2, 5, 8.5].map((z) => ({ p: [0, 2.15, z], c: [1.2, 1.25, 1.3], r: 3.2 })); },
  });

  PL.SOURCES = {
    bord: { titre: "Procès-verbal d'exploitation de la vidéo d'une caméra embarquée dans un véhicule" },
    visio: { titre: "Procès-verbal d'exploitation de l'enregistrement d'un appel vidéo" },
    boutique: { titre: "Procès-verbal d'exploitation des images de vidéosurveillance d'un commerce", remis: "le gérant du commerce", lieu: "la boutique, le comptoir et la caisse", camera: "d'une caméra en dôme fixée au plafond, au-dessus de la caisse" },
    restaurant: { titre: "Procès-verbal d'exploitation des images de vidéosurveillance d'un restaurant", remis: "le gérant du restaurant", lieu: "la salle et le comptoir", camera: "d'une caméra en dôme fixée au plafond, au-dessus de la porte" },
    bar_salle: { titre: "Procès-verbal d'exploitation des images de vidéosurveillance d'un bar", remis: "le gérant du bar", lieu: "la salle et le comptoir", camera: "d'une caméra en dôme fixée au plafond, au-dessus de la porte" },
    rer: { titre: "Procès-verbal d'exploitation des images des caméras embarquées d'une voiture de RER", remis: "le service de sûreté de l'exploitant du réseau de transport", lieu: "la voiture", camera: "de la caméra embarquée, fixée au plafond à une extrémité de la voiture" },
  };
  PL.COUL_NOM = COUL_NOM;
  PL.FAITS = ["bord_pieton", "bord_dangereux", "bord_colere", "visio_appel", "caisse_poche", "vente_comptoir", "filouterie", "bar_coups"];
})();
