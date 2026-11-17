/* La Permanence — les caméras intérieures (1.5.2 « La preuve filmée », D-101).
   Trois lieux filmés par une caméra fixe, en dôme, posée haut dans un angle (image courbée, définition modeste) :
   - le hall d'un immeuble (porte vitrée, boîtes aux lettres, ascenseur, escalier) : la caméra enregistre au mouvement ;
     entre deux séquences, l'horloge saute (quelqu'un entre, monte, redescend vingt minutes plus tard, un sac à la main) ;
   - un parking souterrain (piliers, voitures garées, néons) : une dispute près d'une voiture ;
   - un bus (sièges face à la caméra, barres de maintien, fenêtres) : des coups dans l'allée, une personne qui s'impose
     à côté d'une autre alors que des places sont libres.
   Mêmes principes que video.js : tout sort de la graine ; l'image ne montre que ce que la simulation sait. Limites de
   contenu : la violence et le harcèlement se lisent dans la position des corps ; ni gros plan, ni blessure, ni geste
   sexuel montré. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const CR = (root.CR = root.CR || {});
  const V = CR.video;
  if (!V || !V.outils) return;
  const { bruit, rng, pick, lerp, clamp, smooth, frac, h2, add, mul, P, tenue, PEAU, CHEV } = V.outils;
  const INT = (CR.VINT = {});

  // ---------------------------------------------------------------- gestes nouveaux
  Object.assign(V.GESTES, {
    // assis : bassin bas, cuisses à l'horizontale, jambes pendantes, mains sur les genoux
    assis(u, t) { return P({ py: 0.5, lean: -0.04, hL: 1.45, kL: 1.45, hR: 1.45, kR: 1.45, sL: 0.35, eL: 0.9, aL: 0.1, sR: 0.35, eR: 0.9, aR: 0.1, head: 0.04 + 0.03 * Math.sin(t * 0.6) }); },
    // assis, penché vers le côté visé (b.cible) : le buste et la tête s'inclinent
    assis_penche(u, t) { return P({ py: 0.5, lean: 0.22 + 0.05 * Math.sin(t * 1.3), hL: 1.45, kL: 1.45, hR: 1.45, kR: 1.45, sL: 0.3, eL: 0.9, aL: 0.25, sR: 0.3, eR: 0.9, aR: 0.1, head: 0.2 }); },
    // tenir une barre : un bras levé
    barre(u, t) { return P({ sR: 2.6, eR: 0.15, aR: 0.12, lean: 0.02 + 0.02 * Math.sin(t * 1.7), head: 0.05 }); },
  });

  function acteur(r, id, role, o) {
    const g = o.g || (r() < 0.5 ? "f" : "m");
    const A = { id, role, g, t0: o.t0 || 0, pos: o.pos.slice(), cap: o.cap != null ? o.cap : 0, beats: [], tenue: o.tenue || tenue(r, o.tenueO || {}) };
    A.peau = pick(r, PEAU); A.chev = pick(r, CHEV); A.sc = (1.62 + r() * 0.24) / 1.75; if (g === "f") A.sc = Math.min(A.sc, 0.95);
    if (o.agee) { A.agee = true; A.chev = CHEV[4]; A.sc *= 0.96; }
    return A;
  }
  const boite = (PR, a, b, m, x) => PR.push(Object.assign({ k: "box", a, b, m }, x || {}));
  const peint = (c, k) => ({ f: (p) => ({ c: mul(c, (k || 1) * (0.9 + 0.1 * bruit(p[0] * 2 + p[2] * 2, p[1] * 2))) }) });

  // ---------------------------------------------------------------- 1. le hall d'immeuble
  // x de -3 à 3 (porte vitrée dans le mur de droite, z de 1 à 2,4), z de 0 à 7 (mur du fond : ascenseur, escalier).
  V.DECORS.hall = {
    nom: "Hall d'immeuble",
    camera: { pos: [-2.72, 2.5, 0.28], yaw: 0.62, pitch: 0.5, fov: 96 },
    zf: 7, zn: -0.1, capteur: 1.4,
    porte: { dedans: [2.45, 1.7], dehors: [3.9, 1.7] }, escalier: { pied: [-2.0, 6.55], haut: [-2.0, 7.6] }, ascenseur: [1.1, 6.5],
    prims(r) {
      const PR = [], mur = pick(r, [[0.62, 0.6, 0.52], [0.55, 0.6, 0.6], [0.66, 0.58, 0.48]]);
      this.mur = mur;
      // mur de gauche : boîtes aux lettres
      boite(PR, [-3.15, 0, -0.2], [-3.0, 2.7, 7.2], { f: (p) => {
        if (p[2] > 2.2 && p[2] < 4.6 && p[1] > 0.9 && p[1] < 1.9) { const cell = frac((p[2] - 2.2) / 0.4) < 0.05 || frac((p[1] - 0.9) / 0.25) < 0.08; const fente = frac((p[1] - 0.9) / 0.25) > 0.55 && frac((p[1] - 0.9) / 0.25) < 0.62 && frac((p[2] - 2.2) / 0.4) > 0.2 && frac((p[2] - 2.2) / 0.4) < 0.8; return { c: cell ? [0.15, 0.15, 0.16] : fente ? [0.05, 0.05, 0.05] : [0.5, 0.52, 0.55], s: 0.6 }; }
        return { c: mul(mur, (p[1] < 1.0 ? 0.75 : 1) * (0.92 + 0.08 * bruit(p[2] * 2, p[1] * 2))) };
      } });
      // mur de droite : la porte vitrée sur la rue
      boite(PR, [3.0, 0, -0.2], [3.15, 2.7, 7.2], { f: (p, n, nuit) => {
        if (p[2] > 1.0 && p[2] < 2.4 && p[1] < 2.25) {
          const cadre = p[2] < 1.06 || p[2] > 2.34 || p[1] > 2.19 || Math.abs(p[1] - 1.0) < 0.03;
          if (cadre) return { c: [0.12, 0.12, 0.13], s: 0.6 };
          return { c: [0.1, 0.12, 0.14], e: nuit ? [0.12, 0.11, 0.08] : [0.55, 0.6, 0.65], s: 0.9 };
        }
        if (p[2] > 2.6 && p[2] < 2.75 && p[1] > 1.2 && p[1] < 1.45) return { c: [0.4, 0.4, 0.42], e: [0.05, 0.12, 0.05] }; // interphone, voyant
        return { c: mul(mur, (p[1] < 1.0 ? 0.75 : 1) * (0.92 + 0.08 * bruit(p[2] * 2, p[1] * 2))) };
      } });
      boite(PR, [-3.2, 2.7, -0.2], [3.2, 2.8, 7.2], { c: [0.7, 0.7, 0.68] }, { sansOmbre: true });
      for (const z of [2.0, 5.0]) boite(PR, [-0.5, 2.66, z - 0.3], [0.5, 2.7, z + 0.3], { c: [0.8, 0.8, 0.78], e: [1.0, 1.0, 0.95] }, { sansOmbre: true });
      // un paillasson, une poussette garée près de l'escalier
      boite(PR, [2.0, 0, 1.15], [2.9, 0.02, 2.25], { f: (p) => ({ c: mul([0.2, 0.15, 0.1], 0.8 + 0.3 * h2(Math.floor(p[0] * 40), Math.floor(p[2] * 40))) }) });
      if (r() < 0.6) { boite(PR, [-1.0, 0.25, 6.0], [-0.45, 0.8, 6.7], { c: pick(r, [[0.1, 0.12, 0.3], [0.3, 0.05, 0.08], [0.1, 0.1, 0.1]]), s: 0.3 }); for (const z of [6.1, 6.6]) PR.push({ k: "cyl", x: -0.72, z, r: 0.12, y0: 0, y1: 0.2, m: { c: [0.05, 0.05, 0.05] } }); }
      return PR;
    },
    solY() { return 0; },
    sol(x, z) {
      // carrelage en damier, joints, usure au passage
      const cx = Math.floor((x + 10) / 0.3), cz = Math.floor(z / 0.3), j = frac((x + 10) / 0.3) < 0.04 || frac(z / 0.3) < 0.04;
      const base = (cx + cz) & 1 ? [0.5, 0.44, 0.36] : [0.3, 0.22, 0.16];
      const use = 1 - 0.1 * Math.exp(-((x - 0.2) * (x - 0.2)) / 0.8);
      return { c: mul(base, (0.88 + 0.16 * h2(cx, cz)) * (j ? 0.6 : 1) * use), s: 0.5 };
    },
    facade(x, y) {
      const mur = this.mur || [0.62, 0.6, 0.52];
      // ascenseur : deux portes d'acier brossé, encadrement, bouton d'appel
      if (x > 0.55 && x < 1.65 && y < 2.15) {
        if (x < 0.62 || x > 1.58 || y > 2.08) return { c: [0.2, 0.2, 0.22], s: 0.6 };
        if (Math.abs(x - 1.1) < 0.012) return { c: [0.08, 0.08, 0.08] };
        return { c: mul([0.55, 0.56, 0.58], 0.9 + 0.1 * Math.sin(y * 300)), s: 0.85 };
      }
      if (x > 1.75 && x < 1.85 && y > 1.1 && y < 1.3) return { c: [0.3, 0.3, 0.3], e: [0.3, 0.2, 0.05] };
      // la cage d'escalier : l'ouverture, les marches qui montent, la rampe
      if (x > -2.85 && x < -1.15 && y < 2.4) {
        const marche = Math.floor((y + (x + 2.85) * 0.55) / 0.17);
        if (Math.abs(y - (1.0 + (x + 2.85) * 0.55)) < 0.03) return { c: [0.1, 0.07, 0.04], s: 0.4 };
        const k = 0.22 + 0.18 * (marche & 1) - 0.08 * smooth(y / 2.4);
        return { c: [k, k * 0.95, k * 0.9] };
      }
      // panneau d'affichage
      if (x > -0.75 && x < 0.15 && y > 1.2 && y < 1.85) { const feuille = h2(Math.floor((x + 1) * 9), Math.floor(y * 8)) > 0.35; return { c: feuille ? [0.8, 0.79, 0.75] : [0.45, 0.32, 0.18] }; }
      if (Math.abs(y - 1.0) < 0.02) return { c: mul(mur, 0.6) };
      return { c: mul(mur, (y < 1.0 ? 0.75 : 1) * (0.92 + 0.08 * bruit(x * 2, y * 2))) };
    },
    facadeN() { return { c: mul(this.mur || [0.62, 0.6, 0.52], 0.8) }; },
    ambiance() { return { amb: [0.05, 0.05, 0.05], sun: null }; },
    lumieres() { return [{ p: [0, 2.55, 2.0], c: [1.3, 1.3, 1.2], r: 3.2 }, { p: [0, 2.55, 5.0], c: [1.3, 1.3, 1.2], r: 3.2 }]; },
  };

  // ---------------------------------------------------------------- 2. le parking souterrain
  // x de -6 à 6, z de 0 à 14 ; voitures garées en épi au fond (z de 9,6 à 13,8), allée au milieu ; piliers.
  V.DECORS.parking = {
    nom: "Parking souterrain",
    camera: { pos: [4.6, 2.2, 3.4], yaw: -0.5, pitch: 0.4, fov: 92 },
    zf: 14, zn: -0.1, capteur: 1.4,
    porte: [-5.7, 4.2], voiture: { x0: 0.4, x1: 2.2, z0: 9.6 },
    prims(r) {
      const PR = [], beton = [0.42, 0.41, 0.39];
      const mur = (a, b) => boite(PR, a, b, { f: (p) => ({ c: mul(p[1] > 0.9 && p[1] < 1.3 ? [0.55, 0.42, 0.08] : beton, 0.85 + 0.2 * bruit(p[0] + p[2] * 3, p[1] * 3)) }) });
      mur([-6.2, 0, -0.2], [-6.0, 2.4, 14.2]); mur([6.0, 0, -0.2], [6.2, 2.4, 14.2]);
      boite(PR, [-6.2, 2.4, -0.2], [6.2, 2.6, 14.2], { f: (p) => ({ c: mul(beton, 0.75 + 0.1 * bruit(p[0], p[2])) }) }, { sansOmbre: true });
      // néons au plafond, au-dessus de l'allée
      for (let z = 1.5; z < 14; z += 3.2) boite(PR, [-0.8, 2.33, z - 0.06], [0.8, 2.4, z + 0.06], { c: [0.8, 0.85, 0.85], e: [1.3, 1.4, 1.4] }, { sansOmbre: true });
      // piliers, numérotés
      for (const x of [-3.2, 3.2]) for (const z of [3.5, 9.0]) boite(PR, [x - 0.25, 0, z - 0.25], [x + 0.25, 2.4, z + 0.25], { f: (p) => ({ c: p[1] < 0.6 ? (frac(p[1] / 0.15) < 0.5 ? [0.55, 0.45, 0.05] : [0.08, 0.08, 0.08]) : mul(beton, 1.05 + 0.1 * bruit(p[1] * 4, p[0] + p[2])) }) });
      // voitures garées en épi, face à l'allée
      const cols = [[0.28, 0.28, 0.3], [0.03, 0.03, 0.035], [0.55, 0.55, 0.56], [0.3, 0.03, 0.03], [0.04, 0.07, 0.17], [0.7, 0.7, 0.68], [0.42, 0.4, 0.33]];
      const vX = this.voiture.x0;
      for (const x0 of [-5.2, -2.6, vX, 3.0]) {
        if (x0 !== vX && r() < 0.2) continue;
        const c = x0 === vX ? (this.couleurVoiture = pick(r, cols)) : pick(r, cols), carr = { c, s: 0.7 }, z0 = 9.6;
        boite(PR, [x0, 0.3, z0], [x0 + 1.8, 0.85, z0 + 4.2], carr);
        boite(PR, [x0 + 0.1, 0.85, z0 + 1.0], [x0 + 1.7, 1.35, z0 + 3.3], { c: [0.015, 0.02, 0.025], s: 0.9 });
        boite(PR, [x0 + 0.15, 1.33, z0 + 1.15], [x0 + 1.65, 1.4, z0 + 3.1], carr);
        for (const xr of [x0 - 0.02, x0 + 1.62]) for (const zr of [z0 + 0.5, z0 + 3.2]) boite(PR, [xr, 0, zr], [xr + 0.2, 0.6, zr + 0.6], { c: [0.015, 0.015, 0.015] });
        for (const xr of [x0 + 0.2, x0 + 1.35]) boite(PR, [xr, 0.6, z0 - 0.02], [xr + 0.25, 0.72, z0 + 0.02], { c: [0.6, 0.6, 0.55], s: 0.8 });
      }
      return PR;
    },
    solY() { return 0; },
    sol(x, z) {
      const k = 0.85 + 0.15 * bruit(x * 2, z * 2) + 0.06 * (h2(Math.floor(x * 30), Math.floor(z * 30)) - 0.5);
      // lignes des places, flèche de l'allée
      if (z > 9.4 && frac((x + 0.4) / 2.6) < 0.04) return { c: [0.6, 0.6, 0.55] };
      if (Math.abs(x) < 0.08 && frac(z / 2) < 0.6 && z < 9) return { c: [0.6, 0.6, 0.5] };
      if (h2(Math.floor(x * 1.3), Math.floor(z * 1.3)) > 0.93) return { c: [0.2 * k, 0.2 * k, 0.2 * k] }; // taches d'huile
      return { c: [0.32 * k, 0.32 * k, 0.31 * k], s: 0.25 };
    },
    facade(x, y) {
      if (x > -4.8 && x < -3.4 && y > 1.2 && y < 1.9) { const t = /* « -2 » */ (x > -4.6 && x < -3.6); return { c: t ? [0.85, 0.85, 0.8] : [0.1, 0.25, 0.5] }; }
      return { c: mul(y > 0.9 && y < 1.3 ? [0.55, 0.42, 0.08] : [0.42, 0.41, 0.39], 0.85 + 0.2 * bruit(x, y * 3)) };
    },
    facadeN() { return { c: [0.38, 0.37, 0.35] }; },
    ambiance() { return { amb: [0.03, 0.032, 0.034], sun: null }; },
    lumieres() { const L = []; for (let z = 1.5; z < 14; z += 3.2) L.push({ p: [0, 2.25, z], c: [0.75, 0.82, 0.82], r: 3.4 }); return L; },
  };

  // ---------------------------------------------------------------- 3. le bus
  // x de -1,25 à 1,25 ; z de 0 (l'avant, la caméra) à 11 (l'arrière) ; les sièges regardent vers l'avant (vers la
  // caméra) ; porte du milieu dans la paroi de droite (z de 5,6 à 6,8).
  const RANGS = [2.6, 3.5, 4.4, 7.4, 8.3, 9.2];
  V.DECORS.bus = {
    nom: "Bus, caméra embarquée",
    camera: { pos: [0.0, 2.12, 0.3], yaw: 0, pitch: 0.36, fov: 100 },
    zf: 11, zn: -0.1, capteur: 1.4,
    rangs: RANGS, porte: [1.0, 6.2], dehors: [2.0, 6.2],
    siege(cote, rang) { return [cote * 0.7, RANGS[rang] + 0.1]; },
    prims(r) {
      const PR = [], tissu = pick(r, [[0.12, 0.18, 0.35], [0.35, 0.12, 0.15], [0.15, 0.28, 0.25]]);
      const paroi = (x0, x1) => boite(PR, [x0, 0, -0.2], [x1, 2.3, 11.2], { f: (p, n, nuit) => {
        const porte = x0 > 0 && p[2] > 5.6 && p[2] < 6.8;
        if (porte) return { c: [0.3, 0.32, 0.34], e: p[1] > 0.3 && p[1] < 2.0 ? (nuit ? [0.06, 0.06, 0.08] : [0.35, 0.4, 0.45]) : null, s: 0.8 };
        if (p[1] > 0.95 && p[1] < 1.95 && frac(p[2] / 1.8) > 0.06) {
          // la rue qui défile, floue
          const v = bruit(p[2] * 0.7 + 3, p[1] * 2) * 0.6 + 0.4 * h2(Math.floor(p[2] * 2), 1);
          const trait = h2(Math.floor(p[2] * 3), Math.floor(p[1] * 16)) > 0.86; // les lumières de la rue, étirées par le mouvement
          return { c: [0.05, 0.06, 0.07], e: nuit ? (trait ? [0.45, 0.35, 0.18] : [0.03, 0.03, 0.04]) : [0.4 * v + 0.2, 0.42 * v + 0.22, 0.45 * v + 0.25], s: 0.9 };
        }
        return { c: p[1] < 0.95 ? [0.55, 0.55, 0.55] : [0.7, 0.7, 0.68], s: 0.3 };
      } });
      paroi(-1.45, -1.25); paroi(1.25, 1.45);
      boite(PR, [-1.45, 2.25, -0.2], [1.45, 2.4, 11.2], { c: [0.75, 0.75, 0.72] }, { sansOmbre: true });
      for (const z of [2, 5, 8.5]) boite(PR, [-0.4, 2.2, z - 0.4], [0.4, 2.25, z + 0.4], { c: [0.85, 0.85, 0.8], e: [1.0, 1.0, 0.95] }, { sansOmbre: true });
      // sièges : assise, dossier
      for (const z of RANGS) for (const cote of [-1, 1]) {
        const x0 = cote < 0 ? -1.18 : 0.28, x1 = cote < 0 ? -0.28 : 1.18, mt = { f: (p) => ({ c: mul(tissu, 0.8 + 0.3 * h2(Math.floor(p[0] * 30), Math.floor(p[2] * 30 + p[1] * 30))) }) };
        boite(PR, [x0, 0.4, z - 0.15], [x1, 0.5, z + 0.32], mt);
        boite(PR, [x0, 0.5, z + 0.32], [x1, 1.1, z + 0.42], mt);
        boite(PR, [x0 + 0.1, 0, z], [x1 - 0.1, 0.4, z + 0.3], { c: [0.2, 0.2, 0.22] });
      }
      // barres de maintien
      for (const z of [1.6, 5.4, 7.0, 10.0]) for (const x of [-0.3, 0.3]) PR.push({ k: "cyl", x, z, r: 0.02, y0: 0, y1: 2.25, m: { c: [0.75, 0.6, 0.05], s: 0.6 }, plein: false });
      return PR;
    },
    solY() { return 0; },
    sol(x, z) { const pt = (frac(x / 0.06) < 0.3 && frac(z / 0.06) < 0.3); return { c: pt ? [0.2, 0.2, 0.22] : [0.13, 0.14, 0.16], s: 0.2 }; },
    facade(x, y, nuit) { if (Math.abs(x) < 1.0 && y > 0.9 && y < 1.9) return { c: [0.05, 0.05, 0.06], e: nuit ? [0.05, 0.05, 0.06] : [0.4, 0.42, 0.45], s: 0.9 }; return { c: [0.6, 0.6, 0.58] }; },
    facadeN() { return { c: [0.5, 0.5, 0.5] }; },
    ambiance(mode) { return { amb: mode === "jour" ? [0.12, 0.12, 0.13] : [0.04, 0.04, 0.045], sun: null }; },
    lumieres() { return [{ p: [0, 2.15, 2], c: [1.1, 1.1, 1.05], r: 3 }, { p: [0, 2.15, 5], c: [1.1, 1.1, 1.05], r: 3 }, { p: [0, 2.15, 8.5], c: [1.1, 1.1, 1.05], r: 3 }]; },
  };

  // ---------------------------------------------------------------- les faits
  const F = V.FAITS, objetRien = () => null;
  const DOME = { distorsion: 0.4 }; // objectif grand angle des caméras en dôme

  // 1. Le hall : quelqu'un entre, monte, redescend un sac (ou une boîte) à la main et sort. Enregistrement au mouvement :
  // l'horloge saute entre la montée et la descente. o : objet ("sac" | "boite" | null), absence (secondes entre les deux
  // séquences), auteur { g, tenue }, monte ("escalier" | "ascenseur")
  F.hall_passage = {
    nom: "Passage dans le hall d'un immeuble", decor: "hall",
    monter(r, o) {
      const D = V.DECORS.hall, oa = o.auteur || {}, ascen = o.monte === "ascenseur";
      const A = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: D.porte.dehors, cap: Math.PI, tenueO: { capuche: 0.4, sac: null } });
      const haut = ascen ? [D.ascenseur[0], 7.5] : D.escalier.haut, pied = ascen ? D.ascenseur : D.escalier.pied;
      const tEntree = 1.2, tPied = tEntree + 2.2 + 3.0, tCoupe = tPied + 2.2;
      A.beats = [{ a: "marche", d: tEntree + 1.2, to: D.porte.dedans }, { a: "regarde", d: 0.8 }, { a: "marche", d: 3.0, to: pied }, { a: "marche", d: 1.4, to: haut }, { a: "attend", d: 1.6 }];
      // la seconde séquence : il redescend
      const t2 = tCoupe + 0.6;
      A.beats.push({ a: "marche", d: 1.4, to: pied }, { a: "marche", d: 2.6, to: D.porte.dedans }, { a: "marche", d: 1.6, to: D.porte.dehors });
      A.sort = true;
      const absence = o.absence || 1200;
      const obj = o.objet || null, tPris = t2 - 0.2;
      const objet = obj ? { type: obj === "boite" ? "article" : "sac", couleur: pick(r, ["noir", "beige", "rouge", "marine"]) } : { type: "sac", couleur: "noir" };
      const objetAt = obj ? (t, res) => { const e = res.A; if (!e || t < tPris) return null; return { pos: obj === "sac" ? add(e.j.haR, [0, -0.12, 0]) : e.j.haR, fw: e.j.fw, att: obj === "sac" ? e.j.haR : null }; } : objetRien;
      const moments = [
        { t: tEntree + 1.6, cle: "entree", txt: "«A» entre dans le hall par la porte vitrée, s'arrête et regarde autour de lui." },
        { t: tPied + 0.8, cle: "monte", txt: ascen ? "«A» se dirige vers l'ascenseur et sort du champ." : "«A» se dirige vers l'escalier et monte." },
        { t: t2 + 1.4, cle: "retour", txt: `«A» ${ascen ? "ressort de l'ascenseur" : "redescend l'escalier"}, ${obj === "sac" ? "un sac à la main" : obj ? "une boîte à la main" : "les mains libres"}.` },
        { t: t2 + 4.4, cle: "sortie", txt: "«A» traverse le hall d'un pas rapide et sort par la porte vitrée." },
      ];
      // d'autres résidents passent parfois
      const acteurs = [A];
      if (r() < 0.5) { const R = acteur(r, "R1", "resident", { pos: D.ascenseur, cap: -Math.PI / 2, t0: 0.3 }); R.beats = [{ a: "marche", d: 3.6, to: D.porte.dedans }, { a: "marche", d: 1.4, to: D.porte.dehors }]; R.sort = true; acteurs.push(R); }
      return Object.assign({ acteurs, objet, objetAt, moments, duree: Math.ceil(t2 + 9), tG: tEntree + 1.6, sansSauts: true, ellipses: [{ t: tCoupe, s: absence }], coupe: tCoupe }, DOME);
    },
  };

  // 2. Le parking : un couple rejoint une voiture ; la dispute ; un geste (saisir le bras, pousser) ; o : violence
  // ("tient" | "pousse" | "aucune"), chute, auteur { g, tenue }, victime { g }
  F.parking_dispute = {
    nom: "Dispute dans un parking", decor: "parking",
    monter(r, o) {
      const D = V.DECORS.parking, oa = o.auteur || {}, ov = o.victime || {}, vio = o.violence || "pousse";
      const C = D.voiture, xV = C.x0 + 0.5, zV = C.z0 - 0.45, xA = xV + 0.95;
      const Vv = acteur(r, "V", "victime", { g: ov.g || "f", pos: D.porte.slice(), cap: 0 });
      const A = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: [D.porte[0], D.porte[1] + 0.6], cap: 0 });
      const tArr = 6.5;
      Vv.beats = [{ a: "marche", d: tArr, to: [xV, zV] }, { a: "attend", d: 1.0, face: 0 }];
      A.beats = [{ a: "marche", d: tArr + 0.3, to: [xA, zV - 0.1] }, { a: "menace", d: 3.4, face: Math.PI }];
      const moments = [{ t: 3, cle: "arrivee", txt: "«V» et «A» traversent le parking vers une voiture garée ; ils marchent vite, «A» quelques pas derrière." }];
      moments.push({ t: tArr + 1.6, cle: "dispute", txt: "Près de la voiture, «A» fait face à «V» et parle en pointant le doigt vers elle ; «V» recule contre le véhicule." });
      Vv.beats.push({ a: "attend", d: 3.0, face: 0 });
      let t = tArr + 3.7;
      if (vio === "tient") {
        A.beats.push({ a: "tient", d: 2.0, face: Math.PI, cible: [xV + 0.2, 1.1, zV] });
        Vv.beats.push({ a: "degage", d: 2.0, face: 0 });
        moments.push({ t: t + 0.4, cle: "geste", txt: "«A» saisit «V» par le bras ; «V» tente de se dégager." });
        t += 2.0;
      } else if (vio === "pousse") {
        A.beats.push({ a: "pousse", d: 0.6, face: Math.PI });
        if (o.chute) { Vv.beats.push({ a: "tombe", d: 0.75, sens: 1, fondu: 0.1 }, { a: "au_sol", d: 3.5, sens: 1 }, { a: "releve", d: 2.4, sens: 1 }); moments.push({ t: t + 0.3, cle: "geste", txt: "«A» pousse «V» des deux mains ; «V» heurte la voiture et tombe au sol." }); }
        else { Vv.beats.push({ a: "encaisse", d: 0.6 }, { a: "attend", d: 2, face: 0 }); moments.push({ t: t + 0.3, cle: "geste", txt: "«A» pousse «V» des deux mains contre la voiture." }); }
        t += o.chute ? 6.5 : 2.4;
      } else t += 1;
      A.beats.push({ a: "regarde", d: 1.2, face: Math.PI * 0.8 }, { a: "marche", d: 4, to: [5.2, 5.0] });
      A.sort = true;
      moments.push({ t: t + 2.5, cle: "depart", txt: "«A» s'éloigne vers la sortie à pied et sort du champ." });
      Vv.beats.push({ a: "attend", d: 12, face: Math.PI * 1.1 });
      return Object.assign({ acteurs: [Vv, A], objet: null, objetAt: objetRien, moments, duree: Math.ceil(t + 8), tG: tArr + 1.6, violence: vio }, DOME);
    },
  };

  // passagers assis, tournés vers l'avant : ils donnent vie au bus et peuvent voir la scène
  function passagers(r, D, n, pris) {
    const L = [];
    for (let k = 0; k < n; k++) {
      let rang, cote, essai = 0;
      do { rang = Math.floor(r() * D.rangs.length); cote = r() < 0.5 ? -1 : 1; essai++; } while (pris.has(rang + ":" + cote) && essai < 20);
      pris.add(rang + ":" + cote);
      const p = D.siege(cote, rang), X = acteur(r, "P" + (k + 1), "passager", { pos: p, cap: -Math.PI / 2 });
      X.beats = [{ a: "assis", d: 120, face: -Math.PI / 2 }];
      L.push(X);
    }
    return L;
  }

  // 3a. Dans le bus, des coups : deux passagers debout dans l'allée ; o : premier ("A" | "V"), coups, chute
  F.bus_coups = {
    nom: "Coups dans un bus", decor: "bus",
    monter(r, o) {
      const D = V.DECORS.bus, oa = o.auteur || {}, ov = o.victime || {};
      const Vv = acteur(r, "V", "victime", { g: ov.g || "m", pos: [0, 4.9], cap: -Math.PI / 2 });
      const A = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: [0, 6.0], cap: Math.PI / 2, tenueO: { capuche: 0.4 } });
      const tG = 5.5 + r() * 1.5, prem = o.premier === "V" ? "V" : "A", n = clamp(o.coups || 1 + Math.floor(r() * 2), 1, 3);
      Vv.beats = [{ a: "barre", d: 2.5, face: -Math.PI / 2 }, { a: prem === "V" ? "menace" : "regarde", d: tG - 2.5, face: Math.PI / 2 }];
      A.beats = [{ a: "barre", d: 2.5, face: Math.PI / 2 }, { a: prem === "A" ? "menace" : "attend", d: tG - 2.5, face: -Math.PI / 2 }];
      const moments = [{ t: 3.4, cle: "face", txt: "«V» se retourne vers «A», debout derrière lui dans l'allée ; le ton paraît monter." }];
      const tete = (X) => [0, 1.55 * X.sc, X.pos[1]];
      let t = tG;
      const hit = (X, Y) => { X.beats.push({ a: "frappe", d: 0.4, face: X === A ? -Math.PI / 2 : Math.PI / 2, cible: tete(Y), fondu: 0.12 }); Y.beats.push({ a: "encaisse", d: 0.55, fondu: 0.1 }); };
      if (prem === "V") { hit(Vv, A); A.beats.push({ a: "attend", d: 0.2 }); Vv.beats.push({ a: "attend", d: 0.25 }); hit(A, Vv); t += 1.3; moments.push({ t: tG + 0.15, cle: "premier", txt: "«V» porte le premier coup, au visage de «A»." }, { t: tG + 1.0, cle: "riposte", txt: "«A» riposte aussitôt d'un coup de poing." }); }
      else { for (let k = 0; k < n; k++) { hit(A, Vv); t += 0.6; } moments.push({ t: tG + 0.15, cle: "premier", txt: `«A» porte ${n > 1 ? ["", "un", "deux", "trois"][n] + " coups de poing" : "un coup de poing"} au visage de «V», qui n'a pas de geste vers lui auparavant.` }); }
      if (o.chute) { Vv.beats.push({ a: "tombe", d: 0.75, sens: -1, fondu: 0.1 }, { a: "au_sol", d: 5, sens: -1 }, { a: "releve", d: 2.4, sens: -1 }); moments.push({ t: t + 0.4, cle: "chute", txt: "«V» tombe dans l'allée et reste au sol quelques secondes." }); }
      else Vv.beats.push({ a: "sursaut", d: 1.0 }, { a: "barre", d: 10, face: Math.PI / 2 });
      // l'auteur descend à l'arrêt suivant, par la porte du milieu
      A.beats.push({ a: "regarde", d: 1.4, face: 0 }, { a: "marche", d: 1.6, to: D.porte }, { a: "marche", d: 1.2, to: D.dehors });
      A.sort = true;
      moments.push({ t: t + 2.6, cle: "descente", txt: "«A» descend par la porte du milieu." });
      const acteurs = [Vv, A].concat(passagers(r, D, 3 + Math.floor(r() * 3), new Set()));
      return Object.assign({ acteurs, objet: null, objetAt: objetRien, moments, duree: Math.ceil(t + 9), tG }, DOME);
    },
  };

  // 3b. Dans le bus, une personne s'impose : elle s'assoit contre la victime alors que des places sont libres, se penche
  // vers elle ; la victime se lève et va à l'avant. Rien d'autre n'est montré.
  F.bus_harcelement = {
    nom: "Harcèlement dans un bus", decor: "bus",
    monter(r, o) {
      const D = V.DECORS.bus, oa = o.auteur || {}, ov = o.victime || {};
      const rang = 2, pV = D.siege(-1, rang), pA = [-0.42, pV[1]];
      const Vv = acteur(r, "V", "victime", { g: ov.g || "f", pos: [-0.95, pV[1]], cap: -Math.PI / 2 });
      const A = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: D.dehors, cap: Math.PI, tenueO: { capuche: 0.2 } });
      Vv.beats = [{ a: "assis", d: 11, face: -Math.PI / 2 }];
      A.t0 = 1.0;
      A.beats = [{ a: "marche", d: 1.2, to: D.porte }, { a: "marche", d: 1.6, to: [0, pV[1] + 0.2] }, { a: "regarde", d: 0.6, face: Math.PI }, { a: "marche", d: 0.6, to: pA }, { a: "assis", d: 1.6, face: -Math.PI / 2 }, { a: "assis_penche", d: 4.2, face: -Math.PI / 2 - 0.5 }];
      const tAssis = 1.0 + 1.2 + 1.6 + 0.6 + 0.6, tLeve = 11;
      Vv.beats.push({ a: "attend", d: 1.0, face: Math.PI / 2, fondu: 0.8 }, { a: "marche", d: 2.4, to: [0.0, 1.5] }, { a: "barre", d: 12, face: Math.PI / 2 });
      A.beats.push({ a: "assis", d: 20, face: -Math.PI / 2 });
      const moments = [
        { t: 2.5, cle: "montee", txt: "«A» monte par la porte du milieu et remonte l'allée." },
        { t: tAssis + 0.3, cle: "assis", txt: "«A» s'assoit sur le siège voisin de «V», contre elle, alors que plusieurs places sont libres dans le bus." },
        { t: tAssis + 2.6, cle: "penche", txt: "«A» se penche vers «V» à plusieurs reprises ; «V» se serre contre la fenêtre." },
        { t: tLeve + 1.0, cle: "leve", txt: "«V» se lève, passe devant «A» et va se tenir debout à l'avant du bus, près du conducteur." },
      ];
      const pris = new Set([rang + ":-1"]);
      const acteurs = [Vv, A].concat(passagers(r, D, 2 + Math.floor(r() * 2), pris).filter((p) => Math.abs(p.pos[1] - pV[1]) > 0.5));
      return Object.assign({ acteurs, objet: null, objetAt: objetRien, moments, duree: Math.ceil(tLeve + 9), tG: tAssis + 0.3 }, DOME);
    },
  };

  INT.FAITS = ["hall_passage", "parking_dispute", "bus_coups", "bus_harcelement"];
  INT.SOURCES = {
    hall: { titre: "Procès-verbal d'exploitation des images de vidéosurveillance du hall d'un immeuble", remis: "le bailleur de l'immeuble", lieu: "le hall de l'immeuble", camera: "d'une caméra en dôme, fixée au plafond dans un angle et déclenchée par les mouvements" },
    parking: { titre: "Procès-verbal d'exploitation des images de vidéosurveillance d'un parc de stationnement", remis: "l'exploitant du parc de stationnement", lieu: "le parc de stationnement souterrain", camera: "d'une caméra en dôme, fixée au plafond au-dessus de l'allée" },
    bus: { titre: "Procès-verbal d'exploitation des images des caméras embarquées d'un bus", remis: "le service de sûreté de l'exploitant du réseau de transport", lieu: "le bus", camera: "de la caméra embarquée, fixée au plafond à l'avant et tournée vers l'arrière" },
  };
})();
