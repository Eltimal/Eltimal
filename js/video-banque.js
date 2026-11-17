/* La Permanence — la banque, le guichet, la sonnette (1.5.3 « La preuve filmée », D-101).
   - L'agence bancaire : la salle du public (guichets, file d'attente) vue par une caméra haute ; et le distributeur
     de billets, dont la caméra est logée au-dessus de l'écran, face au visage du client (grand angle, très près).
     Le procès-verbal joint le journal des opérations du distributeur : les heures de la banque, celles de l'image.
   - La sonnette connectée : la caméra de la porte d'un appartement, face au palier, grand angle, avec le son ; la nuit,
     en infrarouge. Elle filme ceux qui sonnent : l'ex qui tambourine, le faux artisan qu'on laisse entrer, le parent
     qui vient chercher l'enfant et à qui l'on n'ouvre pas.
   Mêmes principes que video.js : tout sort de la graine ; l'image ne montre que ce que la simulation sait. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const CR = (root.CR = root.CR || {});
  const V = CR.video;
  if (!V || !V.outils || !V.DECORS.appartement) return;
  const { bruit, rng, pick, lerp, clamp, smooth, frac, h2, add, mul, P, tenue, PEAU, CHEV } = V.outils;
  const BQ = (CR.VBANQUE = {});

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

  // ---------------------------------------------------------------- l'agence bancaire
  // x de -4 à 4, z de 0 (l'entrée, derrière la caméra) à 9 ; deux distributeurs dans le mur de gauche (écrans vers +x) ;
  // le comptoir des guichets au fond (z de 7,2 à 7,8), les conseillers assis derrière.
  const COULEURS_BANQUE = [[0.05, 0.2, 0.45], [0.55, 0.06, 0.08], [0.05, 0.35, 0.25], [0.6, 0.35, 0.05]];
  const DAB = [{ z: 2.0 }, { z: 3.6 }];
  V.DECORS.banque = {
    nom: "Agence bancaire, salle du public",
    camera: { pos: [3.6, 2.65, 0.45], yaw: -0.62, pitch: 0.42, fov: 88 },
    zf: 9, zn: -0.1, capteur: 1.4,
    dab: DAB, comptoir: { x0: -1.6, x1: 3.6, z0: 7.2, z1: 7.8 }, guichets: [-0.6, 1.2, 2.8], entree: [2.6, 0.6],
    prims(r) {
      const PR = [], marque = this.marque || (this.marque = pick(r, COULEURS_BANQUE));
      const mur = { f: (p) => ({ c: p[1] > 2.2 && p[1] < 2.45 ? marque : mul([0.82, 0.8, 0.76], 0.92 + 0.08 * bruit(p[2] * 2, p[1] * 2)) }) };
      boite(PR, [-4.2, 0, -0.2], [-4.0, 2.9, 9.2], { f: (p) => {
        for (const D of DAB) if (Math.abs(p[2] - D.z) < 0.45 && p[1] < 1.9) return { c: [0.25, 0.26, 0.28], s: 0.5 };
        return mur.f(p);
      } });
      boite(PR, [4.0, 0, -0.2], [4.2, 2.9, 9.2], mur);
      boite(PR, [-4.2, 2.9, -0.2], [4.2, 3.0, 9.2], { c: [0.88, 0.88, 0.86] }, { sansOmbre: true });
      for (const [x, z] of [[-1.5, 2.5], [1.5, 2.5], [-1.5, 6], [1.5, 6]]) boite(PR, [x - 0.3, 2.86, z - 0.3], [x + 0.3, 2.9, z + 0.3], { c: [0.9, 0.9, 0.85], e: [1.1, 1.1, 1.05] }, { sansOmbre: true });
      // les distributeurs : caisson, écran éclairé, clavier, fente à billets
      for (const D of DAB) {
        boite(PR, [-4.0, 0, D.z - 0.4], [-3.72, 1.62, D.z + 0.4], { c: [0.2, 0.21, 0.23], s: 0.5 });
        boite(PR, [-3.74, 1.2, D.z - 0.22], [-3.7, 1.48, D.z + 0.22], { c: [0.05, 0.1, 0.18], e: [0.15, 0.3, 0.5], s: 0.9 });
        boite(PR, [-3.72, 1.0, D.z - 0.16], [-3.6, 1.06, D.z + 0.16], { f: (p) => ({ c: frac(p[2] / 0.05) < 0.3 ? [0.1, 0.1, 0.1] : [0.6, 0.6, 0.6], s: 0.4 }) });
        boite(PR, [-3.72, 0.92, D.z - 0.18], [-3.68, 0.95, D.z + 0.18], { c: [0.02, 0.02, 0.02] });
        boite(PR, [-4.0, 1.62, D.z - 0.42], [-3.6, 1.8, D.z + 0.42], { c: marque, e: mul(marque, 0.5) });
      }
      // le comptoir des guichets, ses vitres (montants seuls), les écrans des conseillers
      const C = this.comptoir;
      boite(PR, [C.x0, 0, C.z0], [C.x1, 1.05, C.z1], { f: (p) => ({ c: p[1] > 0.95 ? [0.75, 0.72, 0.66] : mul(marque, 0.8 + 0.1 * bruit(p[0] * 3, p[1] * 3)), s: 0.4 }) });
      for (const x of [C.x0, -0.0, 2.0, C.x1]) boite(PR, [x - 0.02, 1.05, C.z0 + 0.25], [x + 0.02, 2.0, C.z0 + 0.3], { c: [0.6, 0.6, 0.62], s: 0.7 });
      for (const x of this.guichets) boite(PR, [x - 0.22, 1.05, C.z1 - 0.1], [x + 0.22, 1.4, C.z1 - 0.06], { c: [0.03, 0.03, 0.04], e: [0.06, 0.08, 0.12] });
      // la file d'attente : poteaux et cordons
      for (const z of [3.0, 4.6, 6.2]) PR.push({ k: "cyl", x: 0.6, z, r: 0.03, y0: 0, y1: 0.95, m: { c: [0.7, 0.65, 0.4], s: 0.8 } });
      boite(PR, [0.58, 0.88, 3.0], [0.62, 0.9, 6.2], { c: [0.5, 0.05, 0.08] });
      // une plante, un présentoir
      PR.push({ k: "cyl", x: 3.5, z: 5.0, r: 0.22, y0: 0, y1: 0.45, m: { c: [0.85, 0.85, 0.82] } });
      PR.push({ k: "sph", c: [3.5, 0.95, 5.0], r: 0.4, m: { f: (p) => ({ c: mul([0.06, 0.18, 0.06], 0.5 + 0.8 * bruit(p[0] * 10, p[1] * 10)) }) } });
      return PR;
    },
    solY() { return 0; },
    sol(x, z) { const j = frac((x + 10) / 0.6) < 0.02 || frac(z / 0.6) < 0.02; const k = (0.9 + 0.12 * h2(Math.floor((x + 10) / 0.6), Math.floor(z / 0.6))) * (j ? 0.7 : 1) * (0.94 + 0.06 * bruit(x * 3, z * 3)); return { c: [0.62 * k, 0.6 * k, 0.55 * k], s: 0.6 }; },
    facade(x, y) {
      const marque = this.marque || COULEURS_BANQUE[0];
      if (y > 2.2 && y < 2.6) return { c: marque, e: mul(marque, 0.3) };
      if (x > -3.2 && x < -2.0 && y > 1.2 && y < 2.0) return { c: mul([0.7, 0.75, 0.8], 0.8 + 0.3 * bruit(x * 6, y * 6)) }; // affiche
      return { c: mul([0.82, 0.8, 0.76], 0.92 + 0.08 * bruit(x * 2, y * 2)) };
    },
    facadeN() { return { c: [0.3, 0.32, 0.35], e: [0.2, 0.22, 0.25] }; },
    ambiance() { return { amb: [0.08, 0.08, 0.085], sun: null }; },
    lumieres() { return [[-1.5, 2.5], [1.5, 2.5], [-1.5, 6], [1.5, 6]].map(([x, z]) => ({ p: [x, 2.8, z], c: [1.0, 1.0, 0.95], r: 3.2 })).concat(DAB.map((D) => ({ p: [-3.45, 1.45, D.z], c: [0.35, 0.45, 0.6], r: 0.9 }))); }, // l'écran éclaire le visage du client
  };
  // la caméra du distributeur (le premier) : au-dessus de l'écran, face au client, très grand angle
  V.DECORS.dab = Object.assign(Object.create(V.DECORS.banque), {
    nom: "Distributeur de billets, caméra de l'automate",
    camera: { pos: [-3.66, 1.58, DAB[0].z], yaw: Math.PI / 2, pitch: -0.05, fov: 112 },
    capteur: 1.1,
  });

  // ---------------------------------------------------------------- le palier (la sonnette)
  // x de -2 à 2, z de 0 (la porte de l'appartement, la caméra) à 6 (le fond : l'escalier, l'ascenseur) ; la porte d'un
  // voisin dans le mur de droite.
  V.DECORS.palier = {
    nom: "Palier, sonnette connectée",
    camera: { pos: [0.05, 1.5, 0.12], yaw: 0.02, pitch: 0.08, fov: 124 },
    zf: 6, zn: -0.1, capteur: 1.2,
    escalier: [-1.3, 5.6], porte: [0.05, 0.95],
    prims(r) {
      const PR = [], mur = pick(r, [[0.7, 0.62, 0.5], [0.6, 0.64, 0.62], [0.72, 0.68, 0.6]]);
      this.mur = mur;
      const peint = { f: (p) => {
        // la porte du voisin, dans le mur de droite
        if (p[0] > 1.9 && p[2] > 2.6 && p[2] < 3.5 && p[1] < 2.05) { const cadre = p[2] < 2.66 || p[2] > 3.44 || p[1] > 1.99; return { c: cadre ? [0.25, 0.18, 0.12] : mul([0.35, 0.22, 0.12], 0.9 + 0.1 * bruit(p[2] * 20, p[1] * 2)), s: 0.3 }; }
        if (p[0] > 1.9 && Math.abs(p[2] - 3.65) < 0.04 && Math.abs(p[1] - 1.45) < 0.05) return { c: [0.6, 0.55, 0.3], s: 0.8 }; // sonnette du voisin
        return { c: mul(mur, (p[1] < 1.1 ? 0.78 : 1) * (0.9 + 0.1 * bruit(p[2] * 2 + p[0], p[1] * 2))) };
      } };
      boite(PR, [-2.2, 0, -0.2], [-2.0, 2.7, 6.2], peint); boite(PR, [2.0, 0, -0.2], [2.2, 2.7, 6.2], peint);
      boite(PR, [-2.2, 2.7, -0.2], [2.2, 2.8, 6.2], { c: [0.78, 0.77, 0.74] }, { sansOmbre: true });
      PR.push({ k: "sph", c: [0, 2.62, 1.5], r: 0.12, m: { c: [0.9, 0.88, 0.8], e: [1.0, 0.95, 0.8] }, sansOmbre: true });
      // un paillasson devant la porte
      boite(PR, [-0.45, 0, 0.15], [0.55, 0.02, 0.75], { f: (p) => ({ c: mul([0.25, 0.18, 0.1], 0.8 + 0.3 * h2(Math.floor(p[0] * 40), Math.floor(p[2] * 40))) }) });
      return PR;
    },
    solY() { return 0; },
    sol(x, z) {
      // tomettes hexagonales, à peu près
      const q = z / 0.17, rr = Math.floor(q), xx = x / 0.2 + (rr & 1) * 0.5, c = Math.floor(xx);
      const j = frac(xx) < 0.06 || frac(q) < 0.08;
      const k = (0.8 + 0.25 * h2(c, rr)) * (j ? 0.6 : 1);
      return { c: [0.52 * k, 0.26 * k, 0.16 * k], s: 0.3 };
    },
    facade(x, y) {
      const mur = this.mur || [0.7, 0.62, 0.5];
      // l'escalier qui descend, la rampe ; l'ascenseur
      if (x > -2.0 && x < -0.6 && y < 2.3) { if (Math.abs(y - (0.95 - (x + 2.0) * 0.4)) < 0.03) return { c: [0.15, 0.08, 0.04], s: 0.5 }; const m = Math.floor((y + (x + 2) * 0.6) / 0.18); const k = 0.18 + 0.12 * (m & 1) - 0.1 * smooth(1 - y / 2.3); return { c: [k, k * 0.9, k * 0.85] }; }
      if (x > 0.4 && x < 1.4 && y < 2.1) { if (x < 0.46 || x > 1.34 || y > 2.04) return { c: [0.2, 0.2, 0.22], s: 0.5 }; if (Math.abs(x - 0.9) < 0.012) return { c: [0.08, 0.08, 0.08] }; return { c: [0.5, 0.52, 0.55], s: 0.8 }; }
      if (x > 1.5 && x < 1.6 && y > 1.1 && y < 1.3) return { c: [0.3, 0.3, 0.3], e: [0.3, 0.15, 0.03] };
      return { c: mul(mur, (y < 1.1 ? 0.78 : 1) * (0.9 + 0.1 * bruit(x * 2, y * 2))) };
    },
    facadeN() { return { c: [0.3, 0.2, 0.12] }; },
    ambiance(mode) { return { amb: mode === "ir" ? [0.01, 0.01, 0.01] : [0.05, 0.05, 0.05], sun: null }; },
    lumieres(mode) { return mode === "ir" ? [] : [{ p: [0, 2.5, 1.5], c: [1.2, 1.1, 0.9], r: 3.0 }, { p: [0, 2.5, 4.5], c: [0.5, 0.45, 0.35], r: 2.5 }]; },
  };

  // ---------------------------------------------------------------- les faits
  const F = V.FAITS, objetRien = () => null;

  // 1. Au distributeur : une personne retire de l'argent, une ou plusieurs cartes. o : cartes (1 à 3), montant (par
  // retrait), regarde (jette des coups d'œil derrière elle), auteur { g, tenue }
  F.dab_retrait = {
    nom: "Retraits au distributeur", decor: "dab",
    monter(r, o) {
      const z = DAB[0].z, oa = o.auteur || {}, n = clamp(o.cartes || 1, 1, 3);
      const A = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: [-1.2, z + 1.6], cap: Math.PI, tenueO: { capuche: 0.5 } });
      const devant = [-3.18, z + 0.02];
      A.beats = [{ a: "marche", d: 2.2, to: devant }, { a: "regarde", d: 0.8, face: Math.PI }];
      const moments = [{ t: 2.4, cle: "arrivee", txt: "«A» s'approche du distributeur et se place face à l'écran." }], ops = [];
      let t = 3.0;
      for (let k = 0; k < n; k++) {
        A.beats.push({ a: "tend", d: 1.0, face: Math.PI }, { a: "sonne", d: 2.4, face: Math.PI }, { a: "attend", d: 1.8, face: Math.PI }, { a: "tend", d: 1.0, face: Math.PI });
        if (o.regarde && k === 0) A.beats.push({ a: "regarde", d: 1.2, face: Math.PI * 0.6 });
        ops.push({ t: t + 4.6, montant: o.montant || 300 });
        moments.push({ t: t + 0.4, cle: "carte" + k, txt: k === 0 ? "«A» introduit une carte dans le lecteur, puis compose un code sur le clavier." : `«A» introduit une autre carte et compose de nouveau un code.` });
        moments.push({ t: t + 4.6, cle: "billets" + k, txt: "«A» prend les billets distribués et les glisse dans sa poche." });
        t += 6.2 + (o.regarde && k === 0 ? 1.2 : 0);
      }
      A.beats.push({ a: "regarde", d: 0.8, face: 0 }, { a: "marche", d: 2.5, to: [-0.8, z + 2.2] });
      A.sort = true;
      moments.push({ t: t + 1.2, cle: "depart", txt: "«A» s'éloigne du distributeur." });
      return { acteurs: [A], objet: null, objetAt: objetRien, moments, duree: Math.ceil(t + 4.5), tG: 3.4, operations: ops, sansSauts: true, distorsion: 0.5 };
    },
  };

  // 2. Au guichet : une personne attend, se présente au guichet, remet des documents ou une enveloppe ; o : motif
  // ("depot" | "ouverture" | "pret" | "retrait"), accompagne (une personne âgée l'accompagne), auteur, victime
  F.guichet = {
    nom: "Opération au guichet", decor: "banque",
    monter(r, o) {
      const D = V.DECORS.banque, oa = o.auteur || {}, ov = o.victime || {}, x = D.guichets[1], zG = D.comptoir.z0 - 0.45;
      const A = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: D.entree, cap: Math.PI / 2 });
      const K = acteur(r, "K", "conseiller", { pos: [x, D.comptoir.z1 + 0.45], cap: -Math.PI / 2, tenueO: { hauts: ["blouson", "manteau"], couvre: 0, sac: null } });
      K.beats = [{ a: "assis", d: 120, face: -Math.PI / 2 }];
      const acteurs = [A, K];
      let Vv = null;
      if (o.accompagne) { Vv = acteur(r, "V", "victime", { g: ov.g || "f", agee: true, pos: [D.entree[0] + 0.5, D.entree[1] - 0.3], cap: Math.PI / 2 }); acteurs.push(Vv); }
      A.beats = [{ a: "marche", d: 3.4, to: [1.0, 4.2] }, { a: "attend", d: 3.0, face: Math.PI / 2 }, { a: "marche", d: 2.4, to: [x - 0.1, zG] }, { a: "attend", d: 1.0, face: Math.PI / 2 }];
      if (Vv) Vv.beats = [{ a: "marche", d: 3.8, to: [1.5, 4.0] }, { a: "attend", d: 2.8, face: Math.PI / 2 }, { a: "marche", d: 2.6, to: [x + 0.55, zG] }, { a: "attend", d: 9, face: Math.PI / 2 }];
      const tG = 10.2, motif = o.motif || "depot";
      A.beats.push({ a: "tend", d: 1.6, face: Math.PI / 2 }, { a: "attend", d: 4.5, face: Math.PI / 2 }, { a: "tend", d: 1.2, face: Math.PI / 2 }, { a: "marche", d: 3.5, to: D.entree });
      if (Vv) Vv.beats.push({ a: "marche", d: 3.8, to: D.entree });
      A.sort = true; if (Vv) Vv.sort = true;
      K.beats = [{ a: "assis", d: tG + 1.0, face: -Math.PI / 2 }, { a: "assis_penche", d: 4.0, face: -Math.PI / 2 }, { a: "assis", d: 60, face: -Math.PI / 2 }];
      const quoi = { depot: "une enveloppe épaisse, dont le conseiller sort des liasses de billets qu'il compte", ouverture: "une pièce d'identité et plusieurs documents, que le conseiller examine et photocopie", pret: "une chemise de documents, que le conseiller parcourt feuille à feuille", retrait: "un document ; le conseiller compte des billets et les remet" }[motif];
      const moments = [
        { t: 2.6, cle: "entree", txt: Vv ? "«A» entre dans l'agence avec «V», une personne âgée, qu'il guide par le bras." : "«A» entre dans l'agence et prend place dans la file d'attente." },
        { t: tG + 0.4, cle: "remise", txt: `Au guichet, «A» remet ${quoi}.` },
        Vv ? { t: tG + 3.0, cle: "parle", txt: "Pendant l'opération, c'est «A» qui parle au conseiller ; «V» reste en retrait." } : null,
        { t: tG + 6.4, cle: "reprend", txt: motif === "retrait" ? "«A» prend les billets et les range dans sa poche." : "«A» reprend des documents que lui tend le conseiller." },
        { t: tG + 9, cle: "sortie", txt: Vv ? "«A» et «V» quittent l'agence." : "«A» quitte l'agence." },
      ].filter(Boolean);
      return { acteurs, objet: null, objetAt: objetRien, moments, duree: Math.ceil(tG + 12), tG, motif, distorsion: 0.3 };
    },
  };

  // 3. La sonnette : quelqu'un monte, sonne, parle à la porte ; o : genre ("ex" | "artisan" | "faux_policier" |
  // "plombier" | "parent" | "voisin"), propos, violence ("aucune" | "porte" : frappe et donne des coups de pied dans la
  // porte), entre (la porte s'ouvre, la personne entre), auteur, victime
  F.porte_visite = {
    nom: "Vidéo d'une sonnette connectée", decor: "palier",
    monter(r, o) {
      const D = V.DECORS.palier, genre = o.genre || "ex", oa = o.auteur || {}, ov = o.victime || {};
      const qui = genre === "parent" ? "V" : "A";
      const X = acteur(r, qui, qui === "A" ? "auteur" : "victime", { g: (qui === "A" ? oa.g : ov.g) || "m", tenue: qui === "A" ? oa.tenue : null, pos: D.escalier, cap: -Math.PI / 2, tenueO: { capuche: 0.2, couvre: 0.1 } });
      const L = [], moments = [], nomX = `${voix(X)} (sur le palier)`, nomI = "Une voix (derrière la porte)";
      const devant = [0.0, 0.95];
      X.beats = [{ a: "marche", d: 3.4, to: devant }, { a: "sonne", d: 1.0, face: -Math.PI / 2, cible: [0.3, 1.45, 0.15] }, { a: "attend", d: 1.6, face: -Math.PI / 2 }];
      moments.push({ t: 2.6, cle: "arrivee", txt: "«" + qui + "» arrive par l'escalier et se place devant la porte, face à la caméra." });
      moments.push({ t: 3.8, cle: "sonne", txt: "«" + qui + "» sonne." });
      let t = 5.2;
      const LIGNES = {
        ex: [["X", "Ouvre ! Je sais que t'es là !"], ["I", "Va-t'en. Tu n'as pas le droit d'être là, j'appelle la police."], ["X", "Ouvre cette porte, je te dis !"]],
        artisan: [["X", "Bonjour madame, c'est pour la toiture. Il y a des tuiles qui ont bougé chez vous, c'est dangereux."], ["I", "Ah bon ? Attendez, j'ouvre."]],
        faux_policier: [["X", "Police, madame. Il y a eu des cambriolages dans l'immeuble, on doit vérifier vos bijoux."], ["I", "Vous avez une carte ?"], ["X", "Bien sûr, madame. Voilà."]],
        plombier: [["X", "Bonjour, c'est le plombier. Il y a une fuite chez le voisin du dessous, je dois voir vos canalisations."], ["I", "Je n'ai appelé personne… Bon, entrez."]],
        parent: [["X", "C'est moi. Je viens chercher les enfants, c'est mon week-end."], ["X", "Tu m'entends ? C'est l'heure, ouvre."]],
        voisin: [["X", "Vous allez arrêter, oui ? Je vous préviens, la prochaine fois je défonce tout !"], ["I", "Partez, je vous filme."]],
      }[genre] || [];
      const pr = (o.propos || []).slice(0, 1);
      if (pr.length && (genre === "ex" || genre === "voisin")) LIGNES.splice(2, 0, ["X", pr[0]]);
      for (const [q, txt] of LIGNES) { dire(L, t, q === "X" ? qui : "interieur", q === "X" ? nomX : nomI, txt, Math.max(1.8, txt.length / 15)); t += Math.max(2.0, txt.length / 15 + 0.3); }
      X.beats.push({ a: genre === "ex" || genre === "voisin" ? "menace" : "attend", d: t - 5.2, face: -Math.PI / 2 });
      moments.push({ t: 6, cle: "parle", txt: genre === "parent" ? "«V» parle à travers la porte ; personne n'ouvre." : genre === "ex" || genre === "voisin" ? "«A» parle fort à travers la porte, en pointant le doigt vers elle." : "«A» parle à la personne qui se trouve derrière la porte." });
      const tG = 6;
      if (o.violence === "porte") {
        for (let k = 0; k < 3; k++) X.beats.push({ a: "frappe", d: 0.45, face: -Math.PI / 2, cible: [0.05, 1.4, 0.2], fondu: 0.1 }, { a: "attend", d: 0.25, face: -Math.PI / 2 });
        X.beats.push({ a: "coup_pied", d: 0.6, face: -Math.PI / 2 }, { a: "coup_pied", d: 0.6, face: -Math.PI / 2 });
        dire(L, t + 0.3, qui, nomX, "Ouvre ! Ouvre !", 1.4);
        moments.push({ t: t + 0.6, cle: "porte", txt: "«A» frappe la porte du poing à plusieurs reprises, puis lui donne deux coups de pied ; l'image tremble." });
        t += 3.4;
      }
      if (o.entre) {
        X.beats.push({ a: "attend", d: 1.2, face: -Math.PI / 2 }, { a: "marche", d: 1.4, to: [0.05, -0.6] });
        X.sort = true;
        moments.push({ t: t + 1.4, cle: "entre", txt: "La porte s'ouvre ; «A» entre dans l'appartement." });
        t += 3.2;
      } else {
        if (genre === "parent") { X.beats.push({ a: "sonne", d: 1.0, face: -Math.PI / 2, cible: [0.3, 1.45, 0.15] }, { a: "attend", d: 3.2, face: -Math.PI / 2 }); moments.push({ t: t + 0.4, cle: "resonne", txt: "«V» sonne de nouveau, attend ; la porte reste fermée." }); t += 4.2; }
        X.beats.push({ a: "regarde", d: 0.8, face: Math.PI / 2 }, { a: "marche", d: 3.0, to: D.escalier }, { a: "marche", d: 0.8, to: [-1.3, 6.4] });
        X.sort = true;
        moments.push({ t: t + 2.0, cle: "depart", txt: "«" + qui + "» repart par l'escalier." });
        t += 4.6;
      }
      return { acteurs: [X], objet: null, objetAt: objetRien, moments, duree: Math.ceil(t + 2.5), tG, paroles: L, genre, entre: !!o.entre, sansSauts: true, distorsion: 0.55, secousses: o.violence === "porte" };
    },
  };

  BQ.FAITS = ["dab_retrait", "guichet", "porte_visite"];
})();
