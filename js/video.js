/* La Permanence — vidéosurveillance (CR.video) : un extrait vidéo joué par le moteur, jamais une vidéo fabriquée.
   Le metteur en scène a cinq éléments indépendants (onglet « Refonte du gameplay », section Images) :
   - le lieu (DECORS) : décor en trois dimensions simples, vu d'en haut et de biais, lancé de rayon une fois par extrait ;
   - les acteurs : fiche de personnage + tenue tirée du VESTIAIRE (mêmes faits, autres tenues) ;
   - le geste : squelette articulé (cinématique directe, bras par cinématique inverse) et bibliothèque GESTES ;
   - la chorégraphie (FAITS) : qui entre dans le champ, par où, quel geste à quelle seconde ;
   - la caméra : hauteur, plongée, biais, cadence, images sautées, déformation, grain, compression, horodatage,
     infrarouge la nuit (les couleurs disparaissent, chaque tissu a sa réponse propre).
   Tout sort de la graine : aucun poids en sauvegarde, la même graine redonne la même image au pixel près.
   Rendu logiciel en 320 × 180 dans un tableau (aucun canvas requis) : se teste dans Node, s'affiche par putImageData.
   L'image ne montre que ce que la simulation sait, et `lisible()` dit ce qu'on peut en tirer (couleurs, visage). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const CR = (root.CR = root.CR || {});
  const V = (CR.video = {});
  const W = 480, H = 270, N = W * H, REF = 320 / W; // REF : les seuils de lisibilité restent ceux d'une image de 320 points
  V.W = W; V.H = H;

  // ---------------------------------------------------------------- hasard et vecteurs
  function hash(s) { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) {
    let a = typeof seed === "number" ? seed >>> 0 : hash(seed);
    return function () { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const h2 = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.sqrt(dot(a, a));
  const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const frac = (x) => x - Math.floor(x);
  const UP = [0, 1, 0];
  // bruit de valeur lissé (textures des décors) : de 0 à 1, variation douce sur une maille d'une unité
  function bruit(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return lerp(lerp(h2(xi, yi), h2(xi + 1, yi), sx), lerp(h2(xi, yi + 1), h2(xi + 1, yi + 1), sx), sy);
  }
  function lerpAng(a, b, t) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * t; }
  function rot(v, k, phi) { const c = Math.cos(phi), s = Math.sin(phi); return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c))); }

  // ---------------------------------------------------------------- caméra
  function Camera(o) {
    const cp = Math.cos(o.pitch), sp = Math.sin(o.pitch), cy = Math.cos(o.yaw), sy = Math.sin(o.yaw);
    const f = [sy * cp, -sp, cy * cp], r = [cy, 0, -sy], u = cross(f, r);
    const F = W / 2 / Math.tan((o.fov * Math.PI) / 360);
    const C = o.pos;
    return {
      C, f, r, u, F,
      proj(p) { const d = sub(p, C), z = dot(d, f); if (z < 0.1) return null; return [W / 2 + (F * dot(d, r)) / z, H / 2 - (F * dot(d, u)) / z, z]; },
      ray(sx, sy) { return norm(add(f, add(mul(r, (sx - W / 2) / F), mul(u, -(sy - H / 2) / F)))); },
    };
  }

  // ---------------------------------------------------------------- vestiaire (couleurs en lumière linéaire ; ir = réponse en infrarouge)
  const COUL = {
    noir: { c: [0.03, 0.03, 0.035], ir: 0.6, m: "noir", f: "noire" },
    anthracite: { c: [0.09, 0.09, 0.1], ir: 0.5, m: "gris foncé", f: "gris foncé" },
    gris: { c: [0.26, 0.26, 0.27], ir: 0.55, m: "gris", f: "grise" },
    marine: { c: [0.025, 0.04, 0.1], ir: 0.45, m: "bleu marine", f: "bleu marine" },
    kaki: { c: [0.11, 0.12, 0.05], ir: 0.62, m: "kaki", f: "kaki" },
    rouge: { c: [0.45, 0.035, 0.04], ir: 0.74, m: "rouge", f: "rouge" },
    bordeaux: { c: [0.2, 0.025, 0.04], ir: 0.6, m: "bordeaux", f: "bordeaux" },
    beige: { c: [0.5, 0.41, 0.28], ir: 0.72, m: "beige", f: "beige" },
    camel: { c: [0.4, 0.22, 0.09], ir: 0.68, m: "camel", f: "camel" },
    blanc: { c: [0.75, 0.75, 0.72], ir: 0.86, m: "blanc", f: "blanche" },
    jaune: { c: [0.7, 0.5, 0.04], ir: 0.8, m: "jaune", f: "jaune" },
    vert: { c: [0.04, 0.2, 0.08], ir: 0.66, m: "vert", f: "verte" },
    jean: { c: [0.07, 0.11, 0.22], ir: 0.42, m: "bleu", f: "bleue" },
  };
  const HAUTS = {
    sweat: { nom: "sweat à capuche", g: "m", capuche: true, r: 0.15, coul: ["noir", "gris", "anthracite", "marine", "bordeaux", "kaki", "blanc", "rouge"] },
    doudoune: { nom: "doudoune", g: "f", r: 0.185, gonfle: true, coul: ["noir", "marine", "kaki", "rouge", "beige", "anthracite", "jaune"] },
    blouson: { nom: "blouson court", g: "m", r: 0.155, coul: ["noir", "kaki", "camel", "anthracite", "marine"] },
    manteau: { nom: "manteau long", g: "m", r: 0.16, long: true, coul: ["noir", "camel", "beige", "anthracite", "marine", "bordeaux"] },
    survet: { nom: "veste de survêtement", g: "f", r: 0.15, coul: ["noir", "rouge", "marine", "blanc", "vert", "gris"] },
  };
  const BAS = {
    jean: { nom: "jean", coul: ["jean", "noir", "gris"] },
    jogging: { nom: "pantalon de jogging", coul: ["noir", "gris", "anthracite", "marine"] },
    pantalon: { nom: "pantalon", coul: ["beige", "noir", "anthracite", "kaki"] },
  };
  const CHAUSS = {
    blanches: { nom: "baskets blanches", c: [0.78, 0.78, 0.76], ir: 0.88 },
    noires: { nom: "baskets noires", c: [0.03, 0.03, 0.03], ir: 0.35 },
    marron: { nom: "chaussures marron", c: [0.14, 0.07, 0.03], ir: 0.45 },
  };
  const PEAU = [[0.62, 0.42, 0.3], [0.5, 0.31, 0.2], [0.34, 0.19, 0.11], [0.2, 0.11, 0.06], [0.11, 0.06, 0.035]];
  const CHEV = [[0.02, 0.015, 0.012], [0.08, 0.045, 0.02], [0.2, 0.12, 0.05], [0.45, 0.33, 0.16], [0.3, 0.3, 0.3]];
  V.VESTIAIRE = { COUL, HAUTS, BAS, CHAUSS };

  // une tenue tirée ; contraintes facultatives (role : "auteur" porte plus souvent capuche, sombre, baskets)
  function tenue(r, o) {
    o = o || {};
    const hid = o.haut || pick(r, o.hauts || Object.keys(HAUTS)), H_ = HAUTS[hid];
    const bid = o.bas || pick(r, Object.keys(BAS)), B_ = BAS[bid];
    let tete = null;
    if (H_.capuche && r() < (o.capuche != null ? o.capuche : 0.5)) tete = "capuche";
    else if (r() < (o.couvre != null ? o.couvre : 0.4)) tete = pick(r, ["casquette", "bonnet"]);
    return {
      haut: hid, hautC: o.hautC || pick(r, H_.coul), bas: bid, basC: pick(r, B_.coul),
      chauss: o.chauss || pick(r, Object.keys(CHAUSS)), tete, teteC: pick(r, ["noir", "marine", "gris", "rouge", "beige", "blanc"]),
      sac: o.sac !== undefined ? o.sac : r() < 0.35 ? pick(r, ["sacoche", "sac_dos"]) : null, sacC: pick(r, ["noir", "anthracite", "kaki", "camel"]),
    };
  }
  V.tenue = (graine, o) => tenue(rng(graine), o);
  // « d'un sweat à capuche gris, d'un jean bleu et de baskets blanches » (procès-verbal d'interpellation)
  V.vetu = function (t, g) {
    const H_ = HAUTS[t.haut], cH = COUL[t.hautC], B_ = BAS[t.bas], cB = COUL[t.basC], C_ = CHAUSS[t.chauss], f = g === "f";
    let s = `${H_.g === "f" ? "d'une" : "d'un"} ${H_.nom} ${cH[H_.g]}, d'un ${B_.nom} ${cB.m} et de ${C_.nom}`;
    if (t.tete === "casquette" || t.tete === "bonnet") s += `, coiffé${f ? "e" : ""} ${t.tete === "casquette" ? "d'une" : "d'un"} ${t.tete} ${COUL[t.teteC][t.tete === "casquette" ? "f" : "m"]}`;
    if (t.sac) s += `, porte${f ? "use" : "ur"} d'${t.sac === "sacoche" ? "une sacoche en bandoulière" : "un sac à dos"}`;
    return s;
  };
  V.decrire = function (t) {
    const H_ = HAUTS[t.haut], cH = COUL[t.hautC], B_ = BAS[t.bas], cB = COUL[t.basC];
    const parts = [`${H_.nom} ${cH[H_.g]}`, `${B_.nom} ${cB.m}`, CHAUSS[t.chauss].nom];
    if (t.tete === "capuche") parts[0] += ", capuche relevée";
    else if (t.tete) parts.push(`${t.tete} ${COUL[t.teteC][t.tete === "casquette" ? "f" : "m"]}`);
    if (t.sac) parts.push(t.sac === "sacoche" ? "sacoche en bandoulière" : "sac à dos");
    return parts.join(", ");
  };

  // ---------------------------------------------------------------- lieux
  // Repère : x le long du trottoir (vers la droite de l'image), y vers le haut, z en s'éloignant de la caméra. Mètres.
  const DECORS = {};
  V.DECORS = DECORS;
  DECORS.metro = {
    nom: "Sortie de métro, boulevard",
    camera: { pos: [0.6, 4.2, 1.4], yaw: 0.16, pitch: 0.5, fov: 72 },
    zf: 20, bord: 9.5, route: 16.5,
    trou: { x0: 0.4, x1: 4.4, z0: 5.0, z1: 6.6, prof: 2.8 },
    sortie: [0.4, 5.8], // haut de l'escalier
    prims(r) {
      const P = [];
      const rail = (a, b, c) => P.push({ k: "box", a, b, m: { c: c || [0.035, 0.07, 0.05], s: 0.4 } });
      const t = this.trou;
      for (const z of [t.z0 - 0.05, t.z1 + 0.05]) {
        rail([t.x0 + 0.3, 0.9, z - 0.025], [t.x1 + 0.05, 0.96, z + 0.025]);
        rail([t.x0 + 0.3, 0.12, z - 0.02], [t.x1 + 0.05, 0.17, z + 0.02]);
        for (let x = t.x0 + 0.3; x <= t.x1 + 0.06; x += 0.5) rail([x - 0.025, 0, z - 0.025], [x + 0.025, 0.96, z + 0.025]);
      }
      rail([t.x1 + 0.02, 0.9, t.z0 - 0.05], [t.x1 + 0.08, 0.96, t.z1 + 0.05]);
      rail([t.x1 + 0.02, 0, t.z0 - 0.05], [t.x1 + 0.08, 0.96, t.z0]);
      // totem du métro
      P.push({ k: "cyl", x: -0.3, z: 5.8, r: 0.06, y0: 0, y1: 2.9, m: { c: [0.04, 0.06, 0.05] } });
      P.push({ k: "sph", c: [-0.3, 3.08, 5.8], r: 0.24, m: { c: [0.5, 0.42, 0.1], e: [1.1, 0.8, 0.2], eNuit: true } });
      // réverbère
      P.push({ k: "cyl", x: -4.6, z: 9.05, r: 0.08, y0: 0, y1: 5.2, m: { c: [0.05, 0.06, 0.06] } });
      P.push({ k: "box", a: [-4.65, 5.1, 9.0], b: [-4.55, 5.18, 10.3], m: { c: [0.05, 0.06, 0.06] } });
      P.push({ k: "box", a: [-4.8, 4.98, 10.0], b: [-4.4, 5.12, 10.6], m: { c: [0.3, 0.3, 0.28], e: [1.4, 1.15, 0.8], eNuit: true } });
      P.push({ k: "cyl", x: 9.4, z: 9.05, r: 0.08, y0: 0, y1: 5.2, m: { c: [0.05, 0.06, 0.06] } });
      P.push({ k: "box", a: [9.35, 5.1, 9.0], b: [9.45, 5.18, 10.3], m: { c: [0.05, 0.06, 0.06] } });
      P.push({ k: "box", a: [9.2, 4.98, 10.0], b: [9.6, 5.12, 10.6], m: { c: [0.3, 0.3, 0.28], e: [1.4, 1.15, 0.8], eNuit: true } });
      // corbeille, potelets
      P.push({ k: "cyl", x: 6.2, z: 9.1, r: 0.04, y0: 0, y1: 0.9, m: { c: [0.04, 0.07, 0.05] } });
      P.push({ k: "cyl", x: 6.2, z: 9.0, r: 0.22, y0: 0.3, y1: 0.85, m: { c: [0.16, 0.28, 0.14], s: 0.3 } });
      for (let x = -7; x < 14; x += 1.6) if ((x < -5.3 || x > -3.8) && Math.abs(x - 9.4) > 0.6) P.push({ k: "cyl", x, z: 9.25, r: 0.05, y0: 0, y1: 0.75, m: { c: [0.08, 0.06, 0.05] } });
      // voitures garées
      const cols = [[0.28, 0.28, 0.3], [0.04, 0.04, 0.05], [0.55, 0.55, 0.56], [0.25, 0.03, 0.03], [0.05, 0.08, 0.16]];
      for (const [x0, l] of [[6.6, 4.3], [-12.5, 4.1], [11.5, 4.4]]) {
        const c = pick(r, cols);
        P.push({ k: "box", a: [x0, 0.28, 9.85], b: [x0 + l, 0.95, 11.6], m: { c, s: 0.6 }, voiture: true });
        P.push({ k: "box", a: [x0 + 0.9, 0.95, 10.0], b: [x0 + l - 0.8, 1.42, 11.45], m: { c: [0.02, 0.025, 0.03], s: 0.8 } });
        P.push({ k: "box", a: [x0 + 0.3, 0.12, 9.9], b: [x0 + l - 0.3, 0.28, 11.55], m: { c: [0.01, 0.01, 0.01] } });
      }
      return P;
    },
    // hauteur du sol sous un point (escalier du métro)
    solY(x, z) { const t = this.trou; if (x > t.x0 && x < t.x1 && z > t.z0 && z < t.z1) return -t.prof * (x - t.x0) / (t.x1 - t.x0); return 0; },
    sol(x, z, nuit) {
      const v = h2(Math.floor(x / 0.8), Math.floor(z / 0.8));
      if (z < this.bord - 0.15) {
        const j = frac(x / 0.8) < 0.04 || frac(z / 0.8) < 0.04;
        let k = (0.92 + 0.12 * v) * (j ? 0.72 : 1);
        if (h2(Math.floor(x * 3), Math.floor(z * 3)) > 0.985) k *= 0.7; // taches
        return { c: [0.4 * k, 0.385 * k, 0.36 * k] };
      }
      if (z < this.bord) return { c: [0.5, 0.48, 0.45] };
      if (z < this.bord + 0.3) return { c: [0.12, 0.12, 0.125] };
      if (z < this.route) {
        let k = 0.85 + 0.25 * h2(Math.floor(x * 5), Math.floor(z * 5));
        const c = [0.1 * k, 0.1 * k, 0.11 * k];
        const mid = (this.bord + this.route) / 2;
        if (Math.abs(z - mid) < 0.07 && frac(x / 6) < 0.5) return { c: [0.55, 0.55, 0.5] };
        if (x > -10 && x < -7 && frac(z / 1) < 0.5 && z > this.bord + 0.5 && z < this.route - 0.5) return { c: [0.5, 0.5, 0.47] };
        return { c };
      }
      if (z < this.route + 0.15) return { c: [0.45, 0.43, 0.4] };
      const k = 0.9 + 0.1 * v;
      return { c: [0.33 * k, 0.32 * k, 0.3 * k] };
    },
    facade(x, y, nuit) {
      const stone = [0.42, 0.38, 0.32];
      if (y < 3.8) {
        const i = Math.floor((x + 100) / 6.5), u = (x + 100) - i * 6.5, sh = h2(i, 7);
        if (u < 0.6) return { c: stone };
        if (y > 3.05) { const sc = [[0.3, 0.04, 0.04], [0.04, 0.12, 0.05], [0.05, 0.05, 0.06], [0.35, 0.28, 0.1]][Math.floor(sh * 4)]; return { c: sc, e: nuit && sh > 0.3 ? mul(sc, 0.4) : null }; }
        if (y < 0.35) return { c: mul(stone, 0.7) };
        const ouvert = sh > 0.25;
        const lit = nuit && ouvert;
        const g = [0.03, 0.035, 0.04];
        if (frac(u / 1.5) < 0.05) return { c: [0.05, 0.05, 0.05] };
        return { c: g, e: lit ? (sh > 0.7 ? [0.9, 0.85, 0.75] : [0.8, 0.58, 0.32]) : null, s: 0.8 };
      }
      const fx = frac((x + 100) / 3.2), fy = frac((y - 3.8) / 3.1), fl = Math.floor((y - 3.8) / 3.1), col = Math.floor((x + 100) / 3.2);
      if (Math.abs(y - 6.95) < 0.12) return { c: [0.05, 0.05, 0.05] };
      if (fx > 0.3 && fx < 0.7 && fy > 0.22 && fy < 0.82) {
        const on = nuit && h2(col, fl + 11) > 0.62;
        return { c: [0.03, 0.03, 0.035], e: on ? [0.7, 0.5, 0.26] : null };
      }
      return { c: stone };
    },
    lumieres(mode) {
      const t = this.trou, L = [];
      if (mode === "jour") return L;
      L.push({ p: [-4.6, 4.95, 10.3], c: [3.4, 2.3, 1.2], r: 2.6 });
      L.push({ p: [9.4, 4.95, 10.3], c: [3.4, 2.3, 1.2], r: 2.6 });
      L.push({ p: [-0.3, 3.0, 5.65], c: [0.5, 0.38, 0.12], r: 2.2 });
      L.push({ p: [(t.x0 + t.x1) / 2 + 1, -1.7, (t.z0 + t.z1) / 2], c: [0.35, 0.4, 0.42], r: 1.6, bas: true });
      for (let x = -14; x < 18; x += 6.5) if (h2(Math.floor((x + 100) / 6.5), 7) > 0.25) L.push({ p: [x + 3, 1.6, 19.2], c: [0.6, 0.48, 0.32], r: 3 });
      return L;
    },
  };

  // Intérieur d'un magasin (lot 1 ter : vol en magasin). Repère : x à droite de l'image, z en s'éloignant, y vers le haut.
  // Deux gondoles le long de z (allée centrale), rayonnage mural au fond, caisse à gauche devant, portique antivol entre
  // la caisse et la sortie (à gauche, hors champ), porte du bureau de la sécurité à droite. Éclairage : néons, toujours.
  DECORS.magasin = {
    nom: "Magasin, surface de vente",
    camera: { pos: [0.3, 3.1, -1.6], yaw: -0.05, pitch: 0.5, fov: 80 },
    cameraSortie: { pos: [-1.0, 3.0, -0.7], yaw: 0.05, pitch: 0.86, fov: 74 },
    zf: 11.2,
    gondoles: [{ x0: -1.05, x1: -0.45, z0: 4.0, z1: 8.2 }, { x0: 1.35, x1: 1.95, z0: 4.0, z1: 8.2 }],
    caisse: { x0: -2.75, x1: -1.85, z0: 2.4, z1: 3.5 },
    portique: { z: 1.55, xs: [-1.85, -0.6] },
    bureau: [4.6, 1.4],
    sortie: [-5.5, 0.6],
    prims(r) {
      const P = [], box = (a, b, c, s, e) => P.push({ k: "box", a, b, m: { c, s: s || 0.3, e } });
      const PROD = [[0.5, 0.06, 0.05], [0.06, 0.18, 0.45], [0.6, 0.5, 0.08], [0.08, 0.35, 0.12], [0.7, 0.7, 0.68], [0.04, 0.04, 0.05], [0.45, 0.2, 0.05], [0.3, 0.05, 0.3]];
      for (const G of this.gondoles) {
        box([G.x0, 0, G.z0], [G.x1, 1.75, G.z1], [0.55, 0.55, 0.53], 0.4);
        // tablettes et produits sur les deux faces
        for (const y of [0.35, 0.75, 1.15, 1.55]) for (const [xa, xb] of [[G.x0 - 0.32, G.x0], [G.x1, G.x1 + 0.32]]) {
          box([xa, y - 0.03, G.z0], [xb, y, G.z1], [0.6, 0.6, 0.58], 0.5);
          for (let z = G.z0 + 0.05; z < G.z1 - 0.3; z += 0.55 + r() * 0.3) {
            const c = pick(r, PROD), l = 0.3 + r() * 0.25, hh = 0.18 + r() * 0.12;
            box([xa + 0.03, y, z], [xb - 0.03, y + hh, z + l], c, 0.4);
          }
        }
        box([G.x0 - 0.1, 1.9, (G.z0 + G.z1) / 2 - 0.6], [G.x1 + 0.1, 2.25, (G.z0 + G.z1) / 2 + 0.6], [0.65, 0.08, 0.06], 0.2); // panneau du rayon
      }
      // rayonnage mural du fond
      for (const y of [0.4, 0.85, 1.3, 1.75]) {
        box([-6, y - 0.03, this.zf - 0.45], [7, y, this.zf], [0.58, 0.58, 0.56], 0.5);
        for (let x = -5.8; x < 6.8; x += 0.5 + r() * 0.3) box([x, y, this.zf - 0.4], [x + 0.3 + r() * 0.2, y + 0.2 + r() * 0.12, this.zf - 0.05], pick(r, PROD), 0.4);
      }
      // caisse : comptoir, tapis, écran
      const C = this.caisse;
      box([C.x0, 0, C.z0], [C.x1, 0.9, C.z1], [0.12, 0.12, 0.14], 0.5);
      box([C.x1 - 0.05, 0.9, C.z0 + 0.1], [C.x1 + 0.35, 0.95, C.z1], [0.05, 0.05, 0.05], 0.2);
      box([C.x0 + 0.2, 0.95, C.z0 + 0.4], [C.x0 + 0.5, 1.3, C.z0 + 0.45], [0.02, 0.02, 0.03], 0.6, [0.1, 0.14, 0.2]);
      // portique antivol (deux panneaux)
      for (const x of this.portique.xs) box([x - 0.05, 0, this.portique.z - 0.25], [x + 0.05, 1.55, this.portique.z + 0.25], [0.7, 0.72, 0.74], 0.7);
      // porte du bureau de la sécurité
      box([4.55, 0, 0.8], [4.65, 2.1, 2.0], [0.35, 0.36, 0.38], 0.4);
      return P;
    },
    solY() { return 0; },
    sol(x, z) {
      const v = h2(Math.floor(x / 0.6), Math.floor(z / 0.6)), j = frac(x / 0.6) < 0.03 || frac(z / 0.6) < 0.03;
      const k = (0.94 + 0.08 * v) * (j ? 0.8 : 1);
      return { c: [0.62 * k, 0.6 * k, 0.56 * k], s: 0.7 };
    },
    facade(x, y) {
      if (y > 2.4 && y < 2.9 && frac((x + 50) / 7) < 0.6) return { c: [0.65, 0.08, 0.06] }; // bandeau de l'enseigne
      return { c: [0.7, 0.69, 0.66] };
    },
    ambiance() { return { amb: [0.1, 0.1, 0.105], sun: null }; },
    lumieres() {
      const L = [];
      for (let x = -3; x <= 4; x += 3.5) for (let z = 1; z <= 10; z += 3) L.push({ p: [x, 3.2, z], c: [0.42, 0.42, 0.4], r: 3.2 });
      return L;
    },
  };

  // ---------------------------------------------------------------- lancer de rayon du décor
  function hitBox(P, o, d) {
    let t0 = -Infinity, t1 = Infinity, ax = -1, sg = 0;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-9) { if (o[i] < P.a[i] || o[i] > P.b[i]) return null; continue; }
      let ta = (P.a[i] - o[i]) / d[i], tb = (P.b[i] - o[i]) / d[i], s = -1;
      if (ta > tb) { const q = ta; ta = tb; tb = q; s = 1; }
      if (ta > t0) { t0 = ta; ax = i; sg = s; }
      if (tb < t1) t1 = tb;
      if (t0 > t1) return null;
    }
    if (t0 < 0.01) return null;
    const n = [0, 0, 0]; n[ax] = sg;
    return { t: t0, n };
  }
  function hitCyl(P, o, d) {
    const ox = o[0] - P.x, oz = o[2] - P.z, a = d[0] * d[0] + d[2] * d[2], b = 2 * (ox * d[0] + oz * d[2]), c = ox * ox + oz * oz - P.r * P.r;
    const disc = b * b - 4 * a * c; if (disc < 0 || a < 1e-12) return null;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    const y = o[1] + d[1] * t;
    if (t >= 0.01 && y >= P.y0 && y <= P.y1) return { t, n: norm([ox + d[0] * t, 0, oz + d[2] * t]) };
    // le dessus (plateau de table, socle) : vu d'en haut
    if (P.plein !== false && d[1] < 0 && o[1] > P.y1) {
      const tc = (P.y1 - o[1]) / d[1], cx = ox + d[0] * tc, cz = oz + d[2] * tc;
      if (tc >= 0.01 && cx * cx + cz * cz <= P.r * P.r) return { t: tc, n: UP };
    }
    return null;
  }
  function hitSph(P, o, d) {
    const oc = sub(o, P.c), b = dot(oc, d), c = dot(oc, oc) - P.r * P.r, disc = b * b - c;
    if (disc < 0) return null; const t = -b - Math.sqrt(disc); if (t < 0.01) return null;
    return { t, n: norm(add(oc, mul(d, t))) };
  }
  function traceTrou(D, T, o, d, tin, nuit) {
    const k = T.prof / (T.x1 - T.x0);
    let best = Infinity, hit = null;
    const den = d[1] + k * d[0];
    if (Math.abs(den) > 1e-9) {
      const t = (-k * (o[0] - T.x0) - o[1]) / den;
      const x = o[0] + d[0] * t, z = o[2] + d[2] * t;
      if (t > tin && x >= T.x0 && x <= T.x1 && z >= T.z0 && z <= T.z1) {
        best = t;
        const s = frac((x - T.x0) / 0.3), nose = s < 0.18, depth = (x - T.x0) / (T.x1 - T.x0);
        const kk = (nose ? 0.75 : 0.45) * (1 - 0.3 * depth);
        hit = { t, n: norm([k, 1, 0]), m: { c: [0.42 * kk, 0.4 * kk, 0.38 * kk] } };
      }
    }
    const walls = [[2, T.z0, 1], [2, T.z1, -1], [0, T.x1, -1]];
    for (const [ax, v, s] of walls) {
      if (Math.abs(d[ax]) < 1e-9) continue;
      const t = (v - o[ax]) / d[ax]; if (t <= tin || t >= best) continue;
      const p = add(o, mul(d, t)), floorY = -T.prof * (p[0] - T.x0) / (T.x1 - T.x0);
      if (p[1] > 0 || p[1] < floorY - 0.01) continue;
      if (ax === 2 && (p[0] < T.x0 || p[0] > T.x1)) continue;
      if (ax === 0 && (p[2] < T.z0 || p[2] > T.z1)) continue;
      const n = [0, 0, 0]; n[ax] = s;
      const u = ax === 2 ? p[0] : p[2], tile = frac(u / 0.15) < 0.1 || frac(p[1] / 0.075) < 0.12;
      best = t; hit = { t, n, m: { c: tile ? [0.3, 0.3, 0.29] : [0.72, 0.72, 0.68], s: 0.6 } };
    }
    if (hit) hit.p = add(o, mul(d, hit.t));
    return hit;
  }
  function trace(D, prims, o, d, nuit) {
    let best = Infinity, hit = null;
    if (d[1] < 0) {
      const t = -o[1] / d[1], x = o[0] + d[0] * t, z = o[2] + d[2] * t, T = D.trou;
      if (T && x > T.x0 && x < T.x1 && z > T.z0 && z < T.z1) { const h = traceTrou(D, T, o, d, t, nuit); if (h) { best = h.t; hit = h; } }
      else { best = t; hit = { t, n: UP, p: [x, 0, z], m: D.sol(x, z, nuit), sol: true }; }
    }
    // 1.5.0 : une façade proche (zn), vue de face par une caméra posée de l'autre côté de la rue ; sans zn, rien ne change
    if (D.zn != null && d[2] < 0) {
      const t = (D.zn - o[2]) / d[2];
      if (t > 0 && t < best) { const x = o[0] + d[0] * t, y = o[1] + d[1] * t; if (y >= 0 && y < 40) { best = t; hit = { t, n: [0, 0, 1], p: [x, y, D.zn], m: D.facadeN(x, y, nuit) }; } }
    }
    if (d[2] > 0) {
      const t = (D.zf - o[2]) / d[2];
      if (t < best) { const x = o[0] + d[0] * t, y = o[1] + d[1] * t; if (y >= 0 && y < 40) { best = t; hit = { t, n: [0, 0, -1], p: [x, y, D.zf], m: D.facade(x, y, nuit) }; } }
    }
    for (const P of prims) {
      const h = P.k === "box" ? hitBox(P, o, d) : P.k === "cyl" ? hitCyl(P, o, d) : hitSph(P, o, d);
      if (h && h.t < best) { best = h.t; hit = { t: h.t, n: h.n, p: add(o, mul(d, h.t)), m: P.m, prim: P }; }
    }
    return hit;
  }

  // ---------------------------------------------------------------- éclairage
  function Eclairage(D, mode, cam) {
    const L = D.lumieres(mode);
    const ir = mode === "ir";
    const AMB = D.ambiance ? D.ambiance(mode) : null;
    const amb = AMB ? AMB.amb : mode === "jour" ? [0.36, 0.37, 0.4] : ir ? [0.012, 0.012, 0.012] : [0.018, 0.02, 0.03];
    const sun = AMB ? AMB.sun : mode === "jour" ? { d: norm([-0.4, 0.75, 0.5]), c: [0.55, 0.52, 0.46] } : null;
    const f = function (p, n, so) {
      let r = amb[0], g = amb[1], b = amb[2];
      if (sun) { const k = (n ? Math.max(0, dot(n, sun.d)) : 0.6) * (so == null ? 1 : so); r += sun.c[0] * k; g += sun.c[1] * k; b += sun.c[2] * k; }
      for (const l of L) {
        if (l.bas && p[1] > 0.3) continue;
        const v = sub(l.p, p), d2 = dot(v, v), dl = Math.sqrt(d2);
        const ndl = n ? Math.max(0, dot(n, v) / dl) : 0.35 + 0.65 * Math.max(0, v[1] / dl);
        let k = (ndl / (1 + d2 / (l.r * l.r))) * (ir ? 0.35 : 1);
        if (!l.bas && p[1] < 0) k *= Math.max(0, 1 + p[1] / 1.4);
        r += l.c[0] * k; g += l.c[1] * k; b += l.c[2] * k;
      }
      if (ir) {
        const v = sub(cam.C, p), d2 = dot(v, v), dl = Math.sqrt(d2);
        const ndl = n ? Math.max(0, dot(n, v) / dl) : 0.8;
        const k = (1.5 * ndl) / (1 + d2 / 30);
        r += k; g += k; b += k;
      }
      return [r, g, b];
    };
    f.sun = sun;
    return f;
  }
  const lumi = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];

  // ---------------------------------------------------------------- squelette et gestes
  // Paramètres d'une pose : py (hauteur du bassin), lean (buste penché en avant), body (bascule du corps entier
  // autour du bassin, positive vers l'arrière), hL kL hR kR (hanche, genou), sL eL aL sR eR aR (épaule, coude,
  // écartement), head (tête penchée), ikL ikR (cible de la main, en coordonnées du monde).
  const POSE0 = { py: 0.95, lean: 0.03, body: 0, hL: 0, kL: 0.05, hR: 0, kR: 0.05, sL: 0.05, eL: 0.15, aL: 0.08, sR: 0.05, eR: 0.15, aR: 0.08, head: 0 };
  const KEYS = Object.keys(POSE0);
  function mix(a, b, t) {
    const o = {};
    for (const k of KEYS) o[k] = lerp(a[k] != null ? a[k] : POSE0[k], b[k] != null ? b[k] : POSE0[k], t);
    o.ikL = t < 0.5 ? a.ikL : b.ikL; o.ikR = t < 0.5 ? a.ikR : b.ikR;
    if (a.ikR && b.ikR) o.ikR = lerp3(a.ikR, b.ikR, t);
    return o;
  }
  const P = (o) => Object.assign({}, POSE0, o);

  function marche(ph, amp) {
    const s = Math.sin(ph), sc = Math.sin(ph + Math.PI);
    const kn = (c) => 0.08 + 0.7 * amp * Math.pow(Math.max(0, c), 2);
    return P({ py: 0.95 - 0.03 * amp * Math.abs(Math.sin(ph)), lean: 0.05, hL: 0.4 * amp * s, hR: 0.4 * amp * sc, kL: kn(Math.cos(ph)), kR: kn(Math.cos(ph + Math.PI)), sL: -0.32 * amp * s, sR: -0.32 * amp * sc, eL: 0.25, eR: 0.25 });
  }
  function course(ph, amp) {
    const s = Math.sin(ph), sc = Math.sin(ph + Math.PI);
    const kn = (c) => 0.25 + 1.35 * Math.pow(Math.max(0, c), 1.5);
    return P({ py: 0.9 + 0.05 * Math.abs(Math.cos(ph)), lean: 0.28, hL: 0.75 * amp * s + 0.15, hR: 0.75 * amp * sc + 0.15, kL: kn(Math.cos(ph)), kR: kn(Math.cos(ph + Math.PI)), sL: -0.8 * amp * s, sR: -0.8 * amp * sc, eL: 1.45, eR: 1.45, aL: 0.12, aR: 0.12 });
  }
  const COUCHE = { py: 0.14, body: 1.45, lean: 0, hL: 0.25, kL: 0.5, hR: 0.05, kR: 0.15, sL: 0.6, aL: 0.7, eL: 0.6, sR: 0.3, aR: 0.3, eR: 0.3, head: -0.4 };
  const GESTES = {
    attend(u, t, b) {
      const sw = Math.sin(t * 0.9 + (b.ph0 || 0)) * 0.025;
      const o = { lean: 0.02 + sw, hL: 0.03, hR: -0.03 + sw };
      if (b.tel) Object.assign(o, { sR: 0.55, eR: 1.5, aR: 0.15, head: 0.45, lean: 0.06 });
      if (b.poches) Object.assign(o, { sL: 0.2, eL: 0.35, aL: 0.25, sR: 0.2, eR: 0.35, aR: 0.25 });
      return P(o);
    },
    marche(u, t, b, ph) { const p = marche(ph, 1); if (b.tel) Object.assign(p, { sR: 0.75, eR: 2.2, aR: 0.6 }); return p; },
    court(u, t, b, ph) { return course(ph, 1); },
    tourne(u, t) { return P({ head: 0.1, hL: 0.1 * Math.sin(u * 6), hR: -0.1 * Math.sin(u * 6) }); },
    arrache(u, t, b, ph, A, S) { const cible = S._cible; return P({ lean: 0.22, hL: 0.35, kL: 0.4, hR: -0.15, kR: 0.2, py: 0.9, sL: -0.3, eL: 0.6, ikR: cible }); },
    tire(u) { return P({ lean: -0.12 - 0.1 * u, hL: -0.3, kL: 0.35, hR: 0.45, kR: 0.5, py: 0.86, sL: 0.6, aL: 0.5, eL: 0.9, sR: lerp(0.9, -0.5, u), eR: lerp(0.2, 0.9, u), aR: 0.3 }); },
    tiree(u) { return P({ lean: 0.35 + 0.2 * u, sL: 1.2, eL: 0.3, sR: 1.3, eR: 0.4, aR: 0.2, hL: 0.25, kL: 0.3, hR: -0.3, kR: 0.2, head: 0.2 }); },
    tombe(u, t, b) {
      const s = b.sens || 1; // 1 : en arrière, -1 : en avant
      const g = u * u;
      return P({ py: lerp(0.9, 0.14, smooth(u)), body: s * 1.45 * g, lean: 0, hL: lerp(0.1, 0.25, u), kL: lerp(0.3, 0.5, u), hR: 0.4 * (1 - u), kR: lerp(0.6, 0.15, u), sL: lerp(0.4, 1.2, u), aL: 0.7, eL: 0.4, sR: lerp(0.4, 1.1, u), aR: 0.6, eR: 0.4, head: -0.3 * u * s });
    },
    au_sol(u, t, b) { const s = b.sens || 1; const c = P(COUCHE); c.body = s * 1.45; c.head = -0.35 * s + 0.1 * Math.sin(t * 1.3); c.sL = 0.6 + 0.25 * Math.sin(t * 0.8); return c; },
    releve(u, t, b) {
      const s = b.sens || 1;
      const a = P(COUCHE); a.body = s * 1.45;
      const assis = P({ py: 0.22, body: s * 0.35, hL: 1.4, kL: 1.9, hR: 1.2, kR: 1.6, sL: -0.4, aL: 0.4, eL: 0.2, sR: -0.4, aR: 0.4, eR: 0.2, head: 0 });
      const genou = P({ py: 0.55, lean: 0.4, hL: 1.6, kL: 1.65, hR: 0.2, kR: 1.6, sL: 0.6, eL: 0.6, sR: 0.5, eR: 0.5 });
      if (u < 0.35) return mix(a, assis, smooth(u / 0.35));
      if (u < 0.7) return mix(assis, genou, smooth((u - 0.35) / 0.35));
      return mix(genou, P({ lean: 0.1 }), smooth((u - 0.7) / 0.3));
    },
    penche(u, t) { return P({ py: 0.58, lean: 0.55, hL: 1.5, kL: 1.9, hR: 0.6, kR: 1.0, sL: 0.9, eL: 0.6, sR: 1.1, eR: 0.5, aR: 0.2 }); },
    sursaut(u) { return P({ lean: -0.12, sL: 0.9, eL: 1.3, aL: 0.4, sR: 0.9, eR: 1.3, aR: 0.4, hL: -0.2, kL: 0.2, head: -0.1 }); },
    cou(u) { return P({ lean: 0.08, sL: 0.95, eL: 2.35, aL: 0.55, sR: 0.95, eR: 2.35, aR: 0.55, head: 0.1 }); },
    montre(u, t) { return P({ sR: 1.45, eR: 0.05, aR: 0.35, head: 0.05, lean: -0.02 }); },
    sonne(u, t) { return P({ sR: 0.75, eR: 2.2, aR: 0.6, head: 0.05 }); },
    // vol en magasin : la main va au rayon (b.cible), puis au sac ou à la poche (b.cible)
    prend(u, t, b) { return P({ lean: 0.12, head: 0.15, sL: 0.1, eL: 0.2, ikR: b.cible }); },
    glisse(u, t, b) { return P({ lean: 0.05, head: 0.25, ikR: b.cible }); },
    regarde(u, t) { return P({ head: 0.05 + 0.1 * Math.sin(t * 2.2), lean: 0.02, hL: 0.03, hR: -0.03 }); },
    interpelle(u, t, b) { return P({ lean: 0.06, sL: 0.3, eL: 0.6, aL: 0.2, ikR: b.cible }); },
  };
  V.GESTES = GESTES;

  // cinématique : joints du monde à partir de la position, du cap et de la pose
  function squelette(pos, gy, cap, p, sc) {
    const fw = [Math.cos(cap), 0, Math.sin(cap)], lat = [-Math.sin(cap), 0, Math.cos(cap)];
    const pel = [pos[0], gy + p.py * sc, pos[1]];
    const tdir = add(mul(UP, Math.cos(p.lean)), mul(fw, Math.sin(p.lean))), tfw = sub(mul(fw, Math.cos(p.lean)), mul(UP, Math.sin(p.lean)));
    const chest = add(pel, mul(tdir, 0.48 * sc));
    const head = add(chest, mul(add(mul(tdir, Math.cos(p.head)), mul(tfw, Math.sin(p.head))), 0.25 * sc));
    const j = { pelvis: pel, chest, head, fw, lat, tdir, tfw };
    for (const [S, s] of [["L", 1], ["R", -1]]) {
      const sh = add(sub(chest, mul(tdir, 0.05 * sc)), mul(lat, 0.19 * s * sc));
      const sF = p["s" + S], e = p["e" + S], a = p["a" + S];
      let el, ha; const ik = p["ik" + S];
      if (ik) {
        const L1 = 0.29 * sc, L2 = 0.27 * sc, v = sub(ik, sh), dist = clamp(len(v), 0.08, L1 + L2 - 0.002), dir = norm(v);
        const ca = clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1), al = Math.acos(ca);
        let pole = add(mul(UP, -1), mul(lat, 0.6 * s)); pole = norm(sub(pole, mul(dir, dot(pole, dir))));
        el = add(sh, mul(add(mul(dir, Math.cos(al)), mul(pole, Math.sin(al))), L1));
        ha = add(sh, mul(dir, dist));
      } else {
        const d1 = norm(add(mul(add(mul(tdir, -Math.cos(sF)), mul(tfw, Math.sin(sF))), Math.cos(a)), mul(lat, s * Math.sin(a))));
        el = add(sh, mul(d1, 0.29 * sc));
        const d2 = norm(add(mul(add(mul(tdir, -Math.cos(sF + e)), mul(tfw, Math.sin(sF + e))), Math.cos(a * 0.6)), mul(lat, s * Math.sin(a * 0.6))));
        ha = add(el, mul(d2, 0.27 * sc));
      }
      const hip = add(add(pel, mul(lat, 0.1 * s * sc)), [0, -0.03 * sc, 0]);
      const h = p["h" + S], k = p["k" + S];
      const kn = add(hip, mul(add(mul(UP, -Math.cos(h)), mul(fw, Math.sin(h))), 0.45 * sc));
      const ft = add(kn, mul(add(mul(UP, -Math.cos(h - k)), mul(fw, Math.sin(h - k))), 0.43 * sc));
      const toe = add(ft, mul(add(mul(fw, Math.cos(h - k)), mul(UP, Math.sin(h - k) + 0.05)), 0.15 * sc));
      Object.assign(j, { ["sh" + S]: sh, ["el" + S]: el, ["ha" + S]: ha, ["hip" + S]: hip, ["kn" + S]: kn, ["ft" + S]: ft, ["toe" + S]: toe });
    }
    if (p.body) {
      const piv = pel;
      for (const k of Object.keys(j)) if (Array.isArray(j[k]) && !["fw", "lat"].includes(k)) j[k] = add(piv, rot(sub(j[k], piv), lat, p.body));
      j.tdir = rot(j.tdir, lat, p.body); j.tfw = rot(j.tfw, lat, p.body);
    }
    // les pieds ne passent pas sous le sol (marche, chute)
    let low = Infinity;
    for (const k of ["ftL", "ftR", "toeL", "toeR"]) low = Math.min(low, j[k][1]);
    const pts = Object.keys(j).filter((k) => !["fw", "lat", "tdir", "tfw"].includes(k));
    if (p.body || p.py < 0.7) { for (const k of pts) j[k][1] = Math.max(j[k][1], gy + 0.05); }
    else if (low < gy + 0.03) { const dy = gy + 0.03 - low; for (const k of pts) j[k][1] += dy; }
    return j;
  }

  // ---------------------------------------------------------------- chorégraphie
  // Un acteur : { id, role, pos: [x, z], cap, tenue, beats: [{ a: geste, d: durée, to: [x, z], face, tel, sens }] }
  function preparer(A, D) {
    let t = A.t0 || 0, pos = A.pos.slice(), cap = A.cap != null ? A.cap : 0, dist = 0;
    for (const b of A.beats) {
      b.t0 = t; b.t1 = t + b.d; b.p0 = pos; b.p1 = b.to || pos; b.dist0 = dist;
      const dx = b.p1[0] - b.p0[0], dz = b.p1[1] - b.p0[1], l = Math.hypot(dx, dz);
      b.len = l; b.cap0 = cap;
      b.cap1 = b.face != null ? b.face : l > 0.05 ? Math.atan2(dz, dx) : cap;
      t = b.t1; pos = b.p1; cap = b.cap1; dist += l;
    }
    A.t1 = t;
  }
  function etat(A, t, S) {
    if (t < (A.t0 || 0)) return null;
    let k = A.beats.findIndex((b) => t < b.t1);
    if (k < 0) { if (A.sort) return null; k = A.beats.length - 1; }
    const b = A.beats[k], u = clamp((t - b.t0) / b.d, 0, 1);
    const pos = [lerp(b.p0[0], b.p1[0], u), lerp(b.p0[1], b.p1[1], u)];
    const cap = lerpAng(b.cap0, b.cap1, smooth((t - b.t0) / (b.len > 0.05 ? 0.3 : 0.6)));
    const dist = b.dist0 + b.len * u;
    const stride = b.a === "court" ? 2.6 : 1.45;
    const ph = (dist / stride) * Math.PI * 2;
    let pose = GESTES[b.a](u, t - b.t0, b, ph, A, S);
    if (k > 0) {
      const pb = A.beats[k - 1], bl = clamp((t - b.t0) / (b.fondu || 0.28), 0, 1);
      if (bl < 1) pose = mix(GESTES[pb.a](1, pb.d, pb, ph, A, S), pose, smooth(bl));
    }
    if (A.agee) pose.lean += 0.1;
    const gy = S.D.solY(pos[0], pos[1]);
    return { pos, cap, pose, gy };
  }

  // ---------------------------------------------------------------- les faits : vol à l'arraché devant la sortie du métro
  const FAITS = {};
  V.FAITS = FAITS;
  FAITS.arrache = {
    nom: "Vol à l'arraché",
    decor: "metro",
    // o : fuite ("escalier" | "gauche"), objet ("sac" | "telephone" | "chaine" | "poignet"), violence (défaut : oui),
    //     victime { g, agee, tenue, telephone }, auteur { tenue }, secours (délai du témoin, s), auSol (s),
    //     regardeFuite (la victime montre la direction de la fuite), couleurObjet
    monter(r, o) {
      const D = DECORS.metro, sortie = D.sortie;
      const ov = o.victime || {}, oa = o.auteur || {};
      const fuite = o.fuite || (r() < 0.5 ? "escalier" : "gauche");
      const objet = o.objet || "sac", violence = o.violence !== false;
      const zV = 7.6 + r() * 0.5;
      const xG = 2.4 + r() * 0.8; // lieu du geste
      const tG = 9.2;
      const agee = !!ov.agee, gV = ov.g || "f", eV = gV === "f" ? "e" : "";
      const vtel = ov.telephone != null ? ov.telephone : objet === "telephone";
      const tenueV = Object.assign(tenue(r, { hauts: ["manteau", "doudoune", "blouson"], sac: null, couvre: agee ? 0.05 : 0.15, chauss: pick(r, ["marron", "noires", "blanches"]) }), ov.tenue || {});
      const couleurObjet = o.couleurObjet || pick(r, ["camel", "noir", "rouge", "beige"]);
      const vit = agee ? 0.95 : 1.25, xV = xG - 0.1, dMarche = (10.5 - xV) / vit;
      const V_ = { id: "V", role: "victime", g: gV, agee, t0: tG - dMarche, pos: [10.5, zV], cap: Math.PI, tenue: tenueV };
      V_.beats = [{ a: "marche", d: dMarche, to: [xV, zV], tel: vtel }];
      const auSol = o.auSol != null ? o.auSol : 3.4;
      let tFin;
      if (violence) {
        V_.beats.push({ a: "tiree", d: 0.7, to: [xV - 0.35, zV + 0.15], fondu: 0.15 });
        V_.beats.push({ a: "tombe", d: 0.75, to: [xV - 0.7, zV + 0.25], sens: -1, fondu: 0.1 });
        V_.beats.push({ a: "au_sol", d: auSol, sens: -1 });
        V_.beats.push({ a: "releve", d: 2.6, sens: -1 });
        tFin = tG + 0.7 + 0.75 + auSol + 2.6;
      } else {
        V_.beats.push({ a: objet === "chaine" ? "cou" : "sursaut", d: 1.1, to: [xV - 0.25, zV - 0.1], fondu: 0.1 });
        tFin = tG + 1.1;
      }
      const regarde = o.regardeFuite !== false;
      V_.beats.push(regarde ? { a: "montre", d: 2.2, face: fuite === "gauche" ? Math.PI : Math.PI * 0.85 } : { a: objet === "chaine" ? "cou" : "attend", d: 2.2, face: -0.5 });
      V_.beats.push({ a: objet === "telephone" ? "attend" : "sonne", d: 12, face: regarde ? null : -0.5 });
      // l'auteur suit la victime à son pas, accélère, arrache, s'enfuit
      const tenueA = oa.tenue ? Object.assign({}, oa.tenue) : tenue(r, { hauts: ["sweat", "sweat", "doudoune", "blouson", "survet"], capuche: 0.75, chauss: pick(r, ["blanches", "blanches", "noires"]), sac: r() < 0.3 ? "sacoche" : null });
      const A_ = { id: "A", role: "auteur", g: oa.g || "m", t0: V_.t0 + 0.6, pos: [11.5, zV + 0.45], cap: Math.PI, tenue: tenueA };
      const xA = xG + 0.55, tAcc = tG - 1.1, xAcc = 11.5 - (tAcc - A_.t0) * vit;
      A_.beats = [
        { a: "marche", d: tAcc - A_.t0, to: [xAcc, zV + 0.45] },
        { a: "court", d: 1.1, to: [xA, zV + 0.35] },
        { a: "arrache", d: 0.45, face: Math.PI + 0.25, fondu: 0.12 },
      ];
      if (violence) A_.beats.push({ a: "tire", d: 0.7, to: [xA + 0.1, zV + 0.45], face: Math.PI + 0.35, fondu: 0.12 });
      if (fuite === "escalier") {
        A_.beats.push({ a: "court", d: 0.75, to: [xG - 0.4, D.trou.z1 + 0.6], fondu: 0.2 });
        A_.beats.push({ a: "court", d: 0.55, to: [sortie[0] - 0.2, sortie[1] + 0.2] });
        A_.beats.push({ a: "court", d: 1.4, to: [D.trou.x1 - 0.3, sortie[1]] });
      } else A_.beats.push({ a: "court", d: 3.2, to: [-12.5, zV + 0.9], fondu: 0.2 });
      A_.sort = true;
      const tAuteurPart = tG + 0.45 + (violence ? 0.7 : 0);
      // témoin : attend au totem, se retourne, vient aider
      const secours = o.secours != null ? o.secours : 0.6;
      const T_ = { id: "T", role: "temoin", g: r() < 0.5 ? "f" : "m", t0: 0, pos: [-1.1, 5.5], cap: 0.3, tenue: tenue(r, { sac: r() < 0.5 ? "sac_dos" : null }) };
      const tArrive = tG + secours + 0.8 + 1.5 + 1.6;
      T_.beats = [
        { a: "attend", d: tG + secours, tel: true },
        { a: "tourne", d: 0.8, face: 0.1 },
        { a: "marche", d: 1.5, to: [-0.4, 7.1] },
        { a: "marche", d: 1.6, to: [xV - 1.0, zV - 0.3] },
      ];
      if (violence) T_.beats.push({ a: "penche", d: Math.max(1.5, tFin - tArrive), face: 0.6 });
      T_.beats.push({ a: "attend", d: 14, face: 0.4 });
      const duree = Math.max(24, Math.ceil(tFin + 6));
      // passants : trottoir d'en face, et un sur ce trottoir avant les faits
      const P1 = { id: "P1", role: "passant", t0: 0, pos: [-16, 18.2], cap: 0, tenue: tenue(r), beats: [{ a: "marche", d: duree + 2, to: [16, 18.3] }], sort: true };
      const P2 = { id: "P2", role: "passant", t0: 0.5, pos: [-9, 8.8], cap: 0, tenue: tenue(r), beats: [{ a: "marche", d: 14, to: [11, 8.9] }], sort: true };
      const P3 = { id: "P3", role: "passant", t0: 6, pos: [17, 17.6], cap: Math.PI, tenue: tenue(r), beats: [{ a: "marche", d: duree + 2, to: [-17, 17.7] }], sort: true };
      for (const a of [V_, A_, T_, P1, P2, P3]) { a.peau = pick(r, PEAU); a.chev = pick(r, CHEV); a.sc = (1.62 + r() * 0.24) / 1.75; if (!a.g) a.g = r() < 0.5 ? "f" : "m"; }
      V_.sc = Math.min(V_.sc, gV === "f" ? 0.95 : 1);
      if (agee) { V_.chev = CHEV[4]; V_.sc *= 0.96; }
      const acteurs = [V_, A_, T_, P1, P2, P3];
      const objetSc = { type: objet, couleur: couleurObjet, tPrise: tG + 0.42, tLache: tG + 0.42 + (violence ? 0.55 : 0.12) };
      const laV = gV === "f" ? (agee ? "la femme âgée" : "la femme") : (agee ? "l'homme âgé" : "l'homme"), LaV = laV[0].toUpperCase() + laV.slice(1), luiV = gV === "f" ? "elle" : "lui";
      const geste = { sac: "L'individu saisit le sac porté à l'épaule.", telephone: `L'individu arrache le téléphone que ${laV} tient à l'oreille.`, chaine: `L'individu saisit la chaîne portée au cou par ${laV}.`, poignet: `L'individu saisit le poignet de ${laV}.` }[objet];
      const moments = [
        { t: tG - 1.2, cle: "approche", txt: `Un individu marche derrière ${laV}, puis court vers ${luiV}.` },
        { t: tG + 0.3, cle: "geste", txt: geste },
        violence ? { t: tG + 1.6, cle: "chute", txt: `${LaV} est entraîné${eV} puis chute sur le trottoir ; l'individu s'éloigne en courant${objet === "sac" ? ", le sac à la main" : ""}.` }
          : { t: tAuteurPart + 0.4, cle: "depart", txt: `L'individu s'éloigne en courant. ${LaV} reste debout ; aucun contact n'est visible entre eux en dehors de l'objet saisi.` },
        { t: fuite === "escalier" ? tAuteurPart + 2.1 : tAuteurPart + 2.2, cle: "fuite", txt: fuite === "escalier" ? "L'individu descend en courant l'escalier de la station." : "L'individu sort du champ par la gauche, en direction du passage piéton." },
      ];
      if (violence && o.secours != null) moments.push({ t: tFin - 2.6, cle: "secours", txt: `${LaV} est relevé${eV} par un passant.` });
      return { acteurs, objet: objetSc, moments, duree, tG, fuite, violence };
    },
  };

  // ---------------------------------------------------------------- les faits : vol à l'étalage, passage en caisse, interpellation
  // o : n (articles pris, 1 à 3), cache ("sac_dos" | "poche" | "sac"), caisse (paie un autre article), ecrans (l'agent était
  //     aux écrans : il n'entre dans le champ qu'au portique), vueRayon (la caméra couvre le rayon ; sinon caisse et sortie),
  //     auteur { g, tenue }, agent { g }, couleurArticle ; n : quatre articles au plus
  FAITS.magasin = {
    nom: "Vol en magasin",
    decor: "magasin",
    monter(r, o) {
      const D = DECORS.magasin, G0 = D.gondoles[0], C = D.caisse, PQ = D.portique;
      const n = Math.max(1, Math.min(4, o.n || 1)), cache = o.cache || "sac_dos", ecrans = o.ecrans !== false, caisse = !!o.caisse;
      const oa = o.auteur || {};
      const tenueA = oa.tenue ? Object.assign({}, oa.tenue) : tenue(r, { hauts: ["sweat", "doudoune", "blouson", "survet"], capuche: 0.3 });
      if (cache === "sac_dos") tenueA.sac = "sac_dos";
      const xA = 0.22, z0 = 5.8;
      const A_ = { id: "A", role: "auteur", g: oa.g || "m", t0: 0, pos: [xA + 0.1, 9.4], cap: -Math.PI / 2, tenue: tenueA };
      const capRayon = Math.PI; // face à la gondole de gauche
      const prises = [];
      A_.beats = [{ a: "marche", d: 1.6, to: [xA, z0] }, { a: "regarde", d: 2.2, face: capRayon }];
      let t = 3.8;
      for (let k = 0; k < n; k++) {
        const z = z0 - 0.35 * k, cible = [G0.x1 + 0.3, [0.95, 1.35, 0.55][k % 3] + 0.12, z + 0.05];
        if (k) { A_.beats.push({ a: "marche", d: 0.6, to: [xA, z], face: capRayon }); t += 0.6; }
        A_.beats.push({ a: "prend", d: 1.0, face: capRayon, cible, fondu: 0.25 });
        const tP = t + 0.75; t += 1.0;
        // la cachette : derrière le dos (sac à dos), la poche du blouson, un sac de course tenu à gauche
        // la gondole est vers -x : le dos est vers +x
        const cc = cache === "sac_dos" ? [xA + 0.2, 1.15, z - 0.12] : cache === "poche" ? [xA - 0.13, 1.25, z + 0.06] : [xA - 0.04, 0.8, z - 0.32];
        A_.beats.push({ a: "glisse", d: 1.1, face: capRayon + (cache === "sac_dos" ? 0.5 : 0), cible: cc, fondu: 0.25 });
        const tG = t + 0.8; t += 1.1;
        prises.push({ cible, tP, tG, cc });
      }
      A_.beats.push({ a: "regarde", d: 1.4, face: capRayon - 0.6 });
      t += 1.4;
      // vers la caisse, puis le portique
      const xL = C.x1 + 0.55, zS = 3.7, dA = Math.hypot(xA - 0.55, z0 - zS) / 1.2;
      A_.beats.push({ a: "marche", d: dA, to: [0.55, zS] });
      A_.beats.push({ a: "marche", d: 1.6, to: [xL, zS] });
      t += dA + 1.6;
      if (caisse) { A_.beats.push({ a: "marche", d: 0.9, to: [xL, (C.z0 + C.z1) / 2] }, { a: "attend", d: 4, face: Math.PI }); t += 4.9; }
      const zPq = PQ.z - 0.2, dPq = Math.hypot(0, (caisse ? (C.z0 + C.z1) / 2 : zS) - zPq) / 1.25;
      A_.beats.push({ a: "marche", d: dPq, to: [(PQ.xs[0] + PQ.xs[1]) / 2, zPq] });
      t += dPq;
      const tPortique = t;
      const zI = 0.75, xI = (PQ.xs[0] + PQ.xs[1]) / 2 - 0.55;
      A_.beats.push({ a: "marche", d: 1.0, to: [xI, zI] });
      t += 1.0;
      const tArret = t;
      // l'agent : sort du bureau (écrans) ou suit en salle, rejoint l'auteur juste après le portique
      const G_ = { id: "G", role: "agent", g: (o.agent || {}).g || "m", tenue: { haut: "blouson", hautC: "noir", bas: "pantalon", basC: "noir", chauss: "noires", tete: null, teteC: "noir", sac: null, sacC: "noir" } };
      const pG = [xI + 0.65, zI + 0.05];
      if (ecrans) {
        const dG = Math.hypot(D.bureau[0] - pG[0], D.bureau[1] - pG[1]) / 1.6;
        G_.t0 = Math.max(0, tArret - dG - 0.3); G_.pos = D.bureau.slice(); G_.cap = Math.PI;
        G_.beats = [{ a: "court", d: dG, to: pG }];
      } else {
        G_.t0 = 0; G_.pos = [2.9, 7.6]; G_.cap = -Math.PI / 2;
        G_.beats = [{ a: "regarde", d: 5.2, face: Math.PI }, { a: "marche", d: Math.max(1, tArret - 0.3 - 5.2), to: pG }];
      }
      const epaule = [xI - 0.02, 1.4, zI - 0.1];
      G_.beats.push({ a: "interpelle", d: 4.2, face: Math.PI, cible: epaule, fondu: 0.3 });
      A_.beats.push({ a: "attend", d: 4.2, face: 0, poches: false });
      // les deux s'éloignent vers le bureau de la sécurité
      A_.beats.push({ a: "marche", d: 3.6, to: [D.bureau[0], D.bureau[1] - 0.25] });
      G_.beats.push({ a: "marche", d: 3.6, to: [D.bureau[0] - 0.2, D.bureau[1] + 0.35] });
      A_.sort = true; G_.sort = true;
      const tFin = tArret + 4.2 + 3.6;
      // la caissière, des clients
      const K_ = { id: "K", role: "caissiere", g: "f", t0: 0, pos: [C.x0 - 0.35, (C.z0 + C.z1) / 2], cap: 0, tenue: tenue(r, { hauts: ["survet"], sac: null, couvre: 0 }), beats: [{ a: "attend", d: tFin + 4, face: 0 }] };
      const P1 = { id: "P1", role: "passant", t0: 1, pos: [2.6, 3.6], cap: Math.PI / 2, tenue: tenue(r), beats: [{ a: "marche", d: 5, to: [2.6, 9.4] }, { a: "regarde", d: tFin, face: Math.PI }] };
      const P2 = { id: "P2", role: "passant", t0: 6, pos: [3.4, 9.8], cap: -Math.PI / 2, tenue: tenue(r), beats: [{ a: "marche", d: 7, to: [3.4, 3.0] }, { a: "marche", d: 4, to: [6.5, 2.6] }], sort: true };
      for (const a of [A_, G_, K_, P1, P2]) { a.peau = pick(r, PEAU); a.chev = pick(r, CHEV); a.sc = (1.62 + r() * 0.24) / 1.75; }
      const acteurs = [A_, G_, K_, P1, P2];
      const couleur = o.couleurArticle || pick(r, ["rouge", "blanc", "jaune", "marine", "noir"]);
      // l'objet : en rayon, dans la main, puis caché (il ne se voit plus)
      const objetAt = (tt, res) => {
        const eA = res.A; if (!eA) return null;
        for (const pr of prises) {
          if (tt < pr.tP - 0.75) return null;
          if (tt < pr.tP) return { pos: pr.cible, fw: [0, 0, 1] };
          if (tt < pr.tG) return { pos: eA.j.haR, fw: eA.j.fw };
        }
        return null;
      };
      const vueRayon = o.vueRayon !== false;
      const leA = (oa.g || "m") === "f" ? "une femme" : "un homme", IlA = (oa.g || "m") === "f" ? "Elle" : "Il";
      const cacheTxt = { sac_dos: "son sac à dos", poche: "la poche intérieure de son blouson", sac: "un sac de course" }[cache];
      const moments = [];
      if (vueRayon) {
        moments.push({ t: 2.2, cle: "rayon", txt: `${CR_cap(leA)} se tient devant le rayonnage de gauche de l'allée centrale et regarde autour ${(oa.g || "m") === "f" ? "d'elle" : "de lui"}.` });
        prises.forEach((pr, k) => moments.push({ t: pr.tP, cle: "prise" + k, txt: `${IlA} prend un article en rayon${k ? ` (${["premier", "deuxième", "troisième", "quatrième"][k]} article)` : ""} et le glisse dans ${cacheTxt}.` }));
      }
      moments.push(caisse ? { t: tPortique - dPq - 2, cle: "caisse", txt: `${IlA} passe en caisse et présente un seul article ; ${cache === "poche" ? "sa veste reste fermée" : "son sac n'est pas ouvert"}.` } : { t: tPortique - dPq + 0.5, cle: "caisse", txt: `${IlA} longe les caisses sans s'arrêter.` });
      moments.push({ t: tPortique, cle: "portique", txt: `${IlA} franchit le portique antivol en direction de la sortie.` });
      moments.push({ t: tArret + 0.4, cle: "agent", txt: `Un agent de sécurité ${ecrans ? "sort du local de la sécurité, le" : "qui se tenait en salle le"} rejoint et lui pose la main sur l'épaule ; ils échangent quelques mots.` });
      moments.push({ t: tArret + 4.6, cle: "bureau", txt: "Ils se dirigent ensemble vers le local de la sécurité et sortent du champ." });
      return { acteurs, objet: { type: "article", couleur, tPrise: Infinity, tLache: Infinity }, objetAt, moments, duree: Math.ceil(tFin + 3), tG: prises[0].tP, prises, n, vueRayon };
    },
  };
  const CR_cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);

  // ---------------------------------------------------------------- rendu des acteurs (volumes éclairés au tampon de profondeur)
  // Chaque membre est un cône arrondi (deux rayons) dessiné à l'écran ; la normale de chaque pixel est reconstruite en
  // 3D puis éclairée comme le décor (sources, soleil, phare infrarouge), avec la trame du tissu et un reflet. La tête
  // est un ellipsoïde lancé au rayon : elle porte un visage, celui du portrait de la personne quand l'interface en
  // fournit un (V.texturer), sinon un visage modelé (peau, cheveux, yeux, sourcils, bouche, barbe, lunettes).
  const TRAME = {
    sweat: (p) => 0.93 + 0.07 * h2(Math.floor(p[0] * 140 + p[2] * 90), Math.floor(p[1] * 140)),
    doudoune: (p) => 0.7 + 0.3 * Math.sqrt(Math.abs(Math.sin(p[1] * 34))),
    blouson: (p) => 0.96 + 0.04 * h2(Math.floor(p[0] * 60 + p[2] * 40), Math.floor(p[1] * 60)),
    manteau: (p) => 0.93 + 0.07 * h2(Math.floor(p[0] * 120 + p[2] * 80), Math.floor(p[1] * 120)),
    survet: (p) => 0.95 + 0.05 * h2(Math.floor(p[0] * 90 + p[2] * 70), Math.floor(p[1] * 90)),
    jean: (p) => 0.84 + 0.22 * h2(Math.floor((p[0] + p[2]) * 150 + p[1] * 150), Math.floor(p[1] * 45)),
    toile: (p) => 0.95 + 0.05 * h2(Math.floor((p[0] + p[2]) * 100), Math.floor(p[1] * 100)),
  };
  const BRILLE = { blouson: 0.32, doudoune: 0.24, survet: 0.1, sweat: 0.03, manteau: 0.05 };
  const mat = (c, ir, tex, s) => ({ c, ir, tex: tex || null, s: s || 0 });

  // un point de surface : lumière reçue, trame, reflet (une lumière haute, vue depuis la caméra)
  function teinte(F, i, z, S, p, n, m, c) {
    const L = S.lum(p, n), k = m.tex ? m.tex(p) : 1;
    let sp = 0;
    if (m.s) {
      const v = sub(S.cam.C, p), lv = len(v) || 1, hx = v[0] / lv, hy = v[1] / lv + 1.3, hz = v[2] / lv, lh = Math.hypot(hx, hy, hz);
      sp = m.s * Math.pow(Math.max(0, (n[0] * hx + n[1] * hy + n[2] * hz) / lh), 18);
    }
    F.z[i] = z;
    if (S.mode === "ir") { const v = (m.ir * k + sp) * L[0]; F.c[i * 3] = v; F.c[i * 3 + 1] = v; F.c[i * 3 + 2] = v; return; }
    c = c || m.c;
    const li = (L[0] + L[1] + L[2]) / 3;
    F.c[i * 3] = c[0] * k * L[0] + sp * li; F.c[i * 3 + 1] = c[1] * k * L[1] + sp * li; F.c[i * 3 + 2] = c[2] * k * L[2] + sp * li;
  }

  function volume(F, S, a, b, r0, r1, m) {
    const cam = S.cam, pa = cam.proj(a), pb = cam.proj(b);
    if (!pa || !pb) return;
    const ra = (cam.F * r0) / pa[2], rb = (cam.F * r1) / pb[2], rm = Math.max(ra, rb) + 1;
    const x0 = Math.max(0, Math.floor(Math.min(pa[0], pb[0]) - rm)), x1 = Math.min(W - 1, Math.ceil(Math.max(pa[0], pb[0]) + rm));
    const y0 = Math.max(0, Math.floor(Math.min(pa[1], pb[1]) - rm)), y1 = Math.min(H - 1, Math.ceil(Math.max(pa[1], pb[1]) + rm));
    const dx = pb[0] - pa[0], dy = pb[1] - pa[1], l2 = dx * dx + dy * dy || 1e-9;
    const ab = sub(b, a), lab = len(ab), ax = lab > 1e-6 ? mul(ab, 1 / lab) : null;
    const R = cam.r, U = cam.u, Fw = cam.f;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const tt = ((px - pa[0]) * dx + (py - pa[1]) * dy) / l2, t = clamp(tt, 0, 1);
      const qx = pa[0] + dx * t, qy = pa[1] + dy * t, rad = ra + (rb - ra) * t;
      const ex = px - qx, ey = py - qy, d2 = ex * ex + ey * ey;
      if (d2 > rad * rad) continue;
      const h = Math.sqrt(1 - d2 / (rad * rad)), r = r0 + (r1 - r0) * t;
      const z = pa[2] + (pb[2] - pa[2]) * t - r * h;
      const i = y * W + x;
      if (z >= F.z[i]) continue;
      const u = ex / rad, v = -ey / rad;
      let n = [R[0] * u + U[0] * v - Fw[0] * h, R[1] * u + U[1] * v - Fw[1] * h, R[2] * u + U[2] * v - Fw[2] * h];
      if (ax && tt > 0 && tt < 1) { const k = dot(n, ax); n = norm([n[0] - ax[0] * k, n[1] - ax[1] * k, n[2] - ax[2] * k]); }
      const q = lerp3(a, b, t);
      teinte(F, i, z, S, [q[0] + n[0] * r, q[1] + n[1] * r, q[2] + n[2] * r], n, m);
    }
  }

  // ellipsoïde lancé au rayon dans le repère (eL, eU, eF) ; surf(l, dedans) → { c, ir, s } ou null (trou)
  function ellipsoide(F, S, c, eL, eU, eF, ax, surf) {
    const cam = S.cam, pc = cam.proj(c);
    if (!pc) return;
    const rpx = (cam.F * Math.max(ax[0], ax[1], ax[2]) * 1.05) / pc[2] + 1.5;
    const x0 = Math.max(0, Math.floor(pc[0] - rpx)), x1 = Math.min(W - 1, Math.ceil(pc[0] + rpx));
    const y0 = Math.max(0, Math.floor(pc[1] - rpx)), y1 = Math.min(H - 1, Math.ceil(pc[1] + rpx));
    const oc = sub(cam.C, c), o = [dot(oc, eL) / ax[0], dot(oc, eU) / ax[1], dot(oc, eF) / ax[2]], oo = dot(o, o) - 1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = cam.ray(x + 0.5, y + 0.5), dl = [dot(d, eL) / ax[0], dot(d, eU) / ax[1], dot(d, eF) / ax[2]];
      const A2 = dot(dl, dl), B = dot(o, dl), disc = B * B - A2 * oo;
      if (disc < 0) continue;
      const sq = Math.sqrt(disc), i = y * W + x, df = dot(d, cam.f);
      for (const [t, dedans] of [[(-B - sq) / A2, false], [(-B + sq) / A2, true]]) {
        if (t < 0.05) continue;
        const z = t * df;
        if (z >= F.z[i]) break;
        const l = [o[0] + dl[0] * t, o[1] + dl[1] * t, o[2] + dl[2] * t];
        const m = surf(l, dedans);
        if (!m) continue;
        let n = norm([eL[0] * l[0] / ax[0] + eU[0] * l[1] / ax[1] + eF[0] * l[2] / ax[2], eL[1] * l[0] / ax[0] + eU[1] * l[1] / ax[1] + eF[1] * l[2] / ax[2], eL[2] * l[0] / ax[0] + eU[2] * l[1] / ax[1] + eF[2] * l[2] / ax[2]]);
        if (dedans) n = mul(n, -1);
        teinte(F, i, z, S, add(cam.C, mul(d, t)), n, m, m.c);
        break;
      }
    }
  }

  // sRGB 8 bits → lumière linéaire (le portrait est peint en sRGB)
  const LIN = new Float32Array(256);
  for (let k = 0; k < 256; k++) LIN[k] = Math.pow(k / 255, 2.2) * 0.85;
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  // la surface de la tête, en coordonnées de la sphère unité : x vers la gauche de la personne (droite de l'image
  // quand elle fait face), y vers le haut, z vers l'avant
  function surfaceTete(A, l) {
    const [lx, ly, lz] = l, T = A.tenue, peau = A.peau, chev = A.chev;
    const g = (u, v, cu, cv, ru, rv) => ((u - cu) * (u - cu)) / (ru * ru) + ((v - cv) * (v - cv)) / (rv * rv);
    // couvre-chefs
    if (T.tete === "bonnet" && ly > 0.16 - 0.1 * lz) { const c = COUL[T.teteC], cote = Math.sin(Math.atan2(lx, lz) * 22) > 0 ? 1 : 0.86, bord = ly < 0.36 - 0.1 * lz ? 0.8 : 1; return { c: mul(c.c, cote * bord), ir: c.ir * cote, s: 0.03 }; }
    if (T.tete === "casquette" && ly > 0.34 - 0.06 * lz) { const c = COUL[T.teteC]; return { c: c.c, ir: c.ir, s: 0.08 }; }
    // cheveux : la ligne descend des tempes vers la nuque
    const coupe = A.coupe || "court";
    const ligne = lz > 0 ? lerp(0.02, coupe === "ras" ? 0.62 : 0.5, lz) : lerp(0.02, coupe === "long" ? -1.2 : -0.62, Math.min(1, -lz * 1.25));
    let cheveu = coupe !== "chauve" && ly > ligne;
    if (coupe === "chauve") cheveu = lz < 0.35 && ly > -0.55 && ly < 0.12 && Math.abs(lx) > 0.25;
    // le portrait de la personne, quand il existe, donne le devant (visage et cheveux de face)
    let face = null;
    if (A.tex && lz > 0.02) {
      const X = A.tex, fx = 31.5 + lx * 14.2, fy = 28 - ly * 19.2, xi = Math.floor(fx), yi = Math.floor(fy);
      if (xi >= 0 && yi >= 0 && xi < 63 && yi < 63) {
        const ki = yi * 64 + xi;
        if (X.m[ki] === 1 || X.m[ki] === 2 || X.m[ki] === 4) {
          const ax = fx - xi, ay = fy - yi, sm = (k, q) => LIN[X.d[k * 4 + q]];
          const c = [0, 1, 2].map((q) => lerp(lerp(sm(ki, q), sm(ki + 1, q), ax), lerp(sm(ki + 64, q), sm(ki + 65, q), ax), ay));
          face = { c, w: smooth(lz / 0.4), cheveu: X.m[ki] === 2 };
        }
      }
    }
    let c, s = 0.1;
    if (cheveu) { c = mul(chev, 0.85 + 0.3 * h2(Math.floor(lx * 30 + lz * 20), Math.floor(ly * 40))); s = 0.16; }
    else {
      c = peau;
      if (!A.tex && lz > 0.4) {
        // traits modelés : yeux, sourcils, nez, bouche, barbe, lunettes
        for (const sx of [-1, 1]) {
          const e = g(lx, ly, sx * 0.36, 0.1, 0.13, 0.065);
          if (e < 1) c = g(lx, ly, sx * 0.36, 0.1, 0.055, 0.055) < 1 ? [0.03, 0.025, 0.02] : [0.42, 0.4, 0.37];
          else if (ly > 0.22 && ly < 0.3 && Math.abs(lx - sx * 0.36) < 0.18) c = mul(chev, 0.8);
          if (A.lunettes) { const gl = g(lx, ly, sx * 0.36, 0.1, 0.19, 0.13); if (gl > 0.72 && gl < 1.15) c = [0.03, 0.03, 0.035]; }
        }
        if (A.lunettes && Math.abs(lx) < 0.17 && Math.abs(ly - 0.14) < 0.025) c = [0.03, 0.03, 0.035];
        if (Math.abs(lx) < 0.1 && ly < 0.02 && ly > -0.26 && lx > 0.02) c = mul(peau, 0.82);
        if (ly < -0.24 && ly > -0.3 && Math.abs(Math.abs(lx) - 0.06) < 0.035) c = mul(peau, 0.55);
        if (A.barbe && ly < -0.14 && !(ly < -0.4 && ly > -0.5 && Math.abs(lx) < 0.24)) c = mix3(peau, mul(chev, 0.9), 0.55 + 0.35 * h2(Math.floor(lx * 50), Math.floor(ly * 50)));
        if (ly < -0.42 && ly > -0.5 && Math.abs(lx) < 0.24) c = [peau[0] * 0.75 + 0.04, peau[1] * 0.55, peau[2] * 0.55];
      } else if (!A.tex && A.barbe && lz > 0 && ly < -0.14) c = mix3(peau, chev, 0.5);
    }
    if (face) { c = mix3(c, face.c, face.w); if (face.cheveu) s = 0.16; }
    // en infrarouge, le visage garde ses contrastes (yeux, sourcils, barbe), la peau renvoie beaucoup de lumière
    return { c, ir: cheveu && !face ? 0.35 : clamp(0.25 + lumi(c) * 2.2, 0.25, 0.95), s };
  }

  function dessinerActeur(S, F, A, j, st) {
    const T = A.tenue, sc = A.sc;
    const H_ = HAUTS[T.haut], cH = COUL[T.hautC], cB = COUL[T.basC], cC = CHAUSS[T.chauss];
    const mH = mat(cH.c, cH.ir, TRAME[T.haut], BRILLE[T.haut]);
    const mB = mat(cB.c, cB.ir, T.bas === "jean" ? TRAME.jean : TRAME.toile, 0.02);
    const mC = mat(cC.c, cC.ir, null, 0.3), mS = mat(mul(cC.c, 0.7), cC.ir * 0.8, null, 0.05);
    const mP = mat(A.peau, 0.72, null, 0.12);
    const vol = (a, b, r0, r1, m) => volume(F, S, a, b, r0 * sc, (r1 == null ? r0 : r1) * sc, m);
    const U_ = j.tdir;
    // jambes : cuisse, mollet, chaussure (semelle)
    for (const s of ["L", "R"]) {
      const hip = j["hip" + s], kn = j["kn" + s], ft = j["ft" + s], toe = j["toe" + s];
      vol(hip, kn, 0.088, 0.064, mB);
      vol(kn, lerp3(kn, ft, 0.94), 0.062, 0.046, mB);
      const heel = sub(ft, mul(sub(toe, ft), 0.28));
      vol(heel, toe, 0.052, 0.046, mC);
      vol(add(heel, [0, -0.03 * sc, 0]), add(toe, [0, -0.028 * sc, 0]), 0.03, 0.028, mS);
    }
    vol(j.hipL, j.hipR, 0.105, 0.105, mB);
    // buste : deux volumes (taille → poitrine) et la carrure
    const rT = H_.r * 0.86, wl = j.lat;
    const taille = lerp3(j.pelvis, j.chest, 0.05), poit = lerp3(j.pelvis, j.chest, 0.86);
    // le tronc : un ellipsoïde plus large que profond, du bassin aux épaules
    {
      const tU = norm(sub(j.chest, j.pelvis)), tF = norm(sub(j.tfw, mul(tU, dot(j.tfw, tU)))), tL = norm(cross(tF, tU));
      const hT = len(sub(poit, taille)) / 2 + rT * 0.38;
      ellipsoide(F, S, lerp3(taille, poit, 0.5), tL, tU, tF, [rT * 1.38 * sc, hT, rT * 0.92 * sc], () => mH);
    }
    vol(add(lerp3(j.shL, j.chest, 0.15), mul(U_, 0.035 * sc)), add(lerp3(j.shR, j.chest, 0.15), mul(U_, 0.035 * sc)), rT * 0.58, rT * 0.58, mH);
    vol(add(j.chest, mul(U_, 0.0)), add(j.chest, mul(U_, 0.06 * sc)), rT * 0.62, rT * 0.5, mH); // haut du dos, col
    if (H_.long) for (const s of ["L", "R"]) vol(j["hip" + s], lerp3(j["hip" + s], j["kn" + s], 0.98), 0.11, 0.125, mH);
    else vol(add(j.hipL, mul(U_, 0.04 * sc)), add(j.hipR, mul(U_, 0.04 * sc)), rT * 0.78, rT * 0.78, mH); // bas du vêtement
    if (T.sac === "sac_dos") { const c = COUL[T.sacC], mo = mat(c.c, c.ir, TRAME.toile, 0.05), dos = sub(j.chest, mul(j.tfw, 0.19 * sc)); vol(sub(dos, mul(j.tdir, 0.06 * sc)), sub(dos, mul(j.tdir, 0.32 * sc)), 0.12, 0.13, mo); }
    // capuche rabattue dans le dos
    if (H_.capuche && T.tete !== "capuche") vol(sub(add(j.chest, mul(U_, 0.06 * sc)), mul(j.tfw, 0.13 * sc)), sub(add(j.chest, mul(U_, -0.04 * sc)), mul(j.tfw, 0.16 * sc)), 0.075, 0.06, mH);
    // bras, mains
    const rA = H_.gonfle ? 0.07 : 0.058;
    for (const s of ["L", "R"]) {
      const sh = j["sh" + s], el = j["el" + s], ha = j["ha" + s];
      vol(sh, el, rA, rA * 0.88, mH);
      vol(el, lerp3(el, ha, 0.9), rA * 0.85, rA * 0.72, mH);
      const dm = norm(sub(ha, el));
      vol(sub(ha, mul(dm, 0.01 * sc)), add(ha, mul(dm, 0.06 * sc)), 0.037, 0.032, mP);
    }
    // cou, tête
    const hU = norm(sub(j.head, j.chest)), hF = norm(cross(hU, wl)), hL = norm(cross(hF, hU));
    const cT = sub(j.head, mul(hU, 0.02 * sc));
    vol(lerp3(j.chest, j.head, 0.15), sub(add(cT, mul(hU, -0.06 * sc)), mul(hF, 0.01 * sc)), 0.058, 0.054, mP);
    ellipsoide(F, S, cT, hL, hU, hF, [0.085 * sc, 0.116 * sc, 0.103 * sc], (l) => surfaceTete(A, l));
    if (T.tete === "capuche") {
      const c = COUL[T.hautC], m = { c: cH.c, ir: cH.ir, s: 0.03 }, mi = { c: mul(cH.c, 0.45), ir: cH.ir * 0.5, s: 0 };
      ellipsoide(F, S, sub(add(cT, mul(hU, 0.018 * sc)), mul(hF, 0.022 * sc)), hL, hU, hF, [0.105 * sc, 0.135 * sc, 0.125 * sc], (l, dedans) => {
        if (dedans) return mi;
        return l[2] > 0.42 && l[1] < 0.62 && l[1] > -0.9 ? null : m;
      });
      void c;
    } else if (T.tete === "casquette") {
      const c = COUL[T.teteC], top = add(cT, mul(hU, 0.055 * sc));
      vol(add(top, mul(hF, 0.06 * sc)), add(top, add(mul(hF, 0.15 * sc), mul(hU, -0.012 * sc))), 0.024, 0.02, mat(c.c, c.ir, null, 0.08));
    }
    if (A.coupe === "long" && !T.tete) {
      const m = mat(A.chev, 0.35, null, 0.16);
      vol(sub(add(cT, mul(hU, 0.03 * sc)), mul(hF, 0.055 * sc)), sub(sub(cT, mul(hF, 0.07 * sc)), mul(hU, 0.2 * sc)), 0.075, 0.06, m);
    }
    if (T.sac === "sacoche") {
      const c = COUL[T.sacC], mo = mat(c.c, c.ir, null, 0.12), p = add(add(j.hipR, mul(j.fw, 0.12 * sc)), mul(j.tdir, 0.08));
      vol(j.shL, p, 0.015, 0.015, mo);
      vol(sub(p, mul(j.lat, 0.07)), add(p, mul(j.lat, 0.07)), 0.06, 0.06, mo);
    }
  }

  function ombres(S, F, js) {
    const cam = S.cam, ir = S.mode === "ir";
    for (const j of js) {
      if (!j) continue;
      const c = [j.pelvis[0], 0, j.pelvis[2]], gy = j.gy || 0;
      if (gy < -0.2) continue;
      const pr = cam.proj([c[0], gy, c[2]]); if (!pr) continue;
      const rpx = (cam.F * 0.7) / pr[2] + 2;
      for (let y = Math.max(0, Math.floor(pr[1] - rpx)); y < Math.min(H, pr[1] + rpx); y++) for (let x = Math.max(0, Math.floor(pr[0] - rpx * 1.4)); x < Math.min(W, pr[0] + rpx * 1.4); x++) {
        const i = y * W + x, gx = S.gx[i]; if (Number.isNaN(gx)) continue;
        const d = Math.hypot(gx - c[0], (S.gz[i] - c[2]) * 1.3);
        const k = 1 - (ir ? 0.25 : 0.45) * (1 - smooth(d / 0.5));
        F.c[i * 3] *= k; F.c[i * 3 + 1] *= k; F.c[i * 3 + 2] *= k;
      }
    }
  }

  function dessinerObjet(S, F, o, ob) {
    const c = ob.type === "sac" || ob.type === "article" ? COUL[ob.couleur] || COUL.rouge : ob.type === "telephone" ? { c: [0.02, 0.02, 0.025], ir: 0.3 } : { c: [0.6, 0.45, 0.12], ir: 0.8 };
    const m = mat(c.c, c.ir, null, ob.type === "telephone" ? 0.5 : 0.2);
    const l = ob.type === "sac" ? 0.13 : ob.type === "telephone" ? 0.04 : ob.type === "article" ? 0.06 : 0.05, r = ob.type === "sac" ? 0.085 : ob.type === "telephone" ? 0.03 : ob.type === "article" ? 0.05 : 0.012;
    volume(F, S, sub(o.pos, mul(o.fw, l)), add(o.pos, mul(o.fw, l)), r, r, m);
    if (o.att) volume(F, S, o.att, add(o.pos, [0, 0.07, 0]), 0.012, 0.012, m);
  }

  // ---------------------------------------------------------------- police d'incrustation (3 × 5, sans accents)
  const GL = {
    "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111", "4": "101101111001001", "5": "111100111001111", "6": "111100111101111", "7": "111001001010010", "8": "111101111101111", "9": "111101111001111",
    ":": "000010000010000", "-": "000000111000000", "/": "001001010100100", ".": "000000000000010", " ": "000000000000000",
    A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111", M: "101111111101101",
    N: "110101101101101", O: "010101101101010", P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010", Z: "111001010100111",
  };
  const EC = Math.max(1, Math.round(W / 320)); // taille d'un point de la police
  function ecrire(out, x, y, s) {
    s = s.toUpperCase();
    for (const pass of [0, 1]) {
      let cx = x;
      for (const ch of s) {
        const g = GL[ch] || GL[" "];
        for (let k = 0; k < 15; k++) if (g[k] === "1") for (let a = 0; a < EC; a++) for (let b = 0; b < EC; b++) {
          const px = cx + (k % 3) * EC + a + (pass ? 0 : 1), py = y + Math.floor(k / 3) * EC + b + (pass ? 0 : 1);
          if (px < 0 || py < 0 || px >= W || py >= H) continue;
          const i = (py * W + px) * 4, v = pass ? 235 : 10;
          out[i] = v; out[i + 1] = v; out[i + 2] = v;
        }
        cx += 4 * EC;
      }
    }
  }

  // ---------------------------------------------------------------- extrait
  // o : { faits: "arrache", graine, mode: "ir" | "soir" | "jour", date: "12-11-2026", heure: "22:41:07", cam: "CAM 04", fps, sauts }
  V.extrait = function (o) {
    o = o || {};
    const F_ = FAITS[o.faits || "arrache"], D = DECORS[o.decor || F_.decor]; // 1.5.0 : un même fait se joue dans plusieurs décors
    const graine = String(o.graine != null ? o.graine : "1");
    const r = rng("video:" + graine);
    const mode = o.mode || "ir";
    const cam = Camera(o.vueRayon === false && D.cameraSortie ? D.cameraSortie : D.camera);
    const scn = F_.monter(rng("faits:" + (o.grainefaits || graine)), o);
    // les tenues peuvent varier seules, à faits identiques
    if (o.grainetenues) { const alt = F_.monter(rng("tenues:" + o.grainetenues), o); scn.acteurs.forEach((a, i) => { const b = alt.acteurs[i]; a.tenue = b.tenue; a.peau = b.peau; a.chev = b.chev; a.sc = b.sc; }); scn.objet.couleur = alt.objet.couleur; }
    for (const A of scn.acteurs) { preparer(A, D); visage(A, graine, o); }
    // 1.5.0 : une scène peut porter sa caméra (camAt : la caméra-piéton suit l'agent), sa cadence, son style d'incrustation
    // et ses paroles (sous-titres) ; sans elles, le chemin et les tirages sont ceux d'avant
    const S = { D, cam, mode, graine, scn, duree: scn.duree, fps: o.fps || scn.fps || pick(r, [8, 10, 12]), lumieres: null };
    if (scn.camAt) { S.camAt = scn.camAt; S.cam = Camera(scn.camAt(0)); }
    S.style = scn.style || null;
    S.paroles = scn.paroles || [];
    S.sous = (t) => S.paroles.filter((p) => t >= p.t0 && t < p.t1);
    S.lum = Eclairage(D, mode, S.cam);
    S.prims = D.prims(rng("decor:" + graine));
    S.date = o.date || "12-11-2026";
    S.heure = o.heure || (mode === "jour" ? "15:12:40" : mode === "soir" ? "18:47:05" : "22:41:07");
    S.camNom = o.cam || "CAM 04";
    S.nuit = mode !== "jour";

    // images enregistrées : cadence, puis images sautées (l'horodatage saute avec elles)
    const sauts = [];
    const nS = o.sauts != null ? o.sauts : scn.sansSauts ? 0 : 1 + Math.floor(r() * 2);
    for (let k = 0; k < nS; k++) {
      const len_ = 0.5 + r() * 1.1;
      let t0 = 1 + r() * (S.duree - 3);
      if (!o.sautsSurLeGeste) for (let essai = 0; essai < 12 && Math.abs(t0 - scn.tG) < 3.5; essai++) t0 = 1 + r() * (S.duree - 3);
      if (sauts.some(([a, b]) => t0 < b + 2 && t0 + len_ > a - 2)) continue;
      sauts.push([t0, t0 + len_]);
    }
    S.sauts = sauts.sort((a, b) => a[0] - b[0]);
    S.frames = [];
    for (let t = 0; t < S.duree; t += 1 / S.fps) if (!sauts.some(([a, b]) => t >= a && t < b)) S.frames.push(+t.toFixed(4));
    S.k = (o.distorsion != null ? o.distorsion : scn.distorsion != null ? scn.distorsion : 0.22);
    S.render = (t, out) => rendre(S, t, out);
    S.image = (i, out) => rendre(S, S.frames[clamp(i, 0, S.frames.length - 1)], out);
    S.indexA = (t) => { let lo = 0, hi = S.frames.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (S.frames[m] <= t) lo = m; else hi = m - 1; } return lo; };
    // point du monde → pixel de l'image montrée (après la déformation de l'objectif)
    S.ecran = (pt) => {
      const q = S.cam.proj(pt); if (!q) return null;
      const ix = 2 / W, sx = (q[0] + 0.5) * ix - 1, sy = (q[1] + 0.5) * ix - H / W;
      let ox = sx, oy = sy;
      for (let n = 0; n < 8; n++) { const f = (1 + S.k * (ox * ox + oy * oy) / 1.31) / (1 + S.k); ox = sx / f; oy = sy / f; }
      return [(ox + 1) / ix - 0.5, (oy + H / W) / ix - 0.5, q[2]];
    };
    S.horodatage = (t) => horo(S, t);
    S.etats = (t) => etats(S, t);
    S.lisible = () => lisible(S);
    S.moments = scn.moments.map((m) => Object.assign({}, m, { h: horo(S, S.frames[S.indexA(m.t)]) }));
    return S;
  };

  // les traits d'une personne (coupe, barbe, lunettes) : tirés à part, sans toucher aux tirages des faits ; le portrait
  // (o.looks[id], sinon un visage tiré au hasard) vient de l'interface quand elle sait le peindre (V.texturer)
  function visage(A, graine, o) {
    const r = rng("visage:" + graine + ":" + A.id), f = A.g === "f";
    A.coupe = f ? (r() < 0.6 && !A.agee ? "long" : "court") : pick(r, A.agee ? ["chauve", "court", "court"] : ["court", "court", "ras", "ras", "chauve"]);
    A.barbe = !f && r() < 0.3; A.lunettes = r() < (A.agee ? 0.5 : 0.12);
    A.look = (o.looks && o.looks[A.id]) || null;
    if (!V.texturer) return;
    try {
      const v = V.texturer(A.look, { g: A.g || "m", age: A.agee ? 74 : 22 + Math.floor(r() * 30), graine: graine + ":" + A.id });
      if (v) for (const k of ["tex", "peau", "chev", "coupe", "barbe", "lunettes"]) if (v[k] != null) A[k] = v[k];
    } catch (e) { /* pas de portrait : le visage modelé reste */ }
  }

  // fond : lancé une fois, à la première image (construire l'extrait reste léger : texte du procès-verbal, tests)
  function fond(S) {
    const { cam, D, mode } = S, nuit = S.nuit;
    const bg = new Float32Array(N * 3), bz = new Float32Array(N), gx = new Float32Array(N), gz = new Float32Array(N);
    // caméra mobile : le fond change à chaque image ; on le lance un point sur deux, puis on comble (image bougée et douce)
    const pas = S.camAt ? 2 : 1;
    for (let y = 0; y < H; y += pas) for (let x = 0; x < W; x += pas) {
      const i = y * W + x, d = cam.ray(x + 0.5, y + 0.5), h = trace(D, S.prims, cam.C, d, nuit);
      gx[i] = NaN; gz[i] = NaN;
      if (!h) { bz[i] = 1e9; const s = mode === "jour" ? [0.5, 0.55, 0.62] : [0.01, 0.012, 0.02]; bg[i * 3] = s[0]; bg[i * 3 + 1] = s[1]; bg[i * 3 + 2] = s[2]; continue; }
      bz[i] = h.t * dot(d, cam.f);
      if (h.sol) { gx[i] = h.p[0]; gz[i] = h.p[2]; }
      let m = h.m || { c: [0.3, 0.3, 0.3] };
      if (m.f) m = m.f(h.p, h.n, nuit); // matière peinte par le décor (store rayé, carrosserie, feuillage)
      // ombre du soleil portée par les objets du décor (caméra fixe seulement : le fond est alors calculé une fois)
      const so = S.lum.sun && !S.camAt && D.ombresSoleil ? (ombrage(S.prims, h, S.lum.sun.d) ? 0.12 : 1) : 1;
      let L = S.lum(h.p, h.n, so);
      // ombre portée sous les voitures garées
      if (h.sol && h.p[2] > 9.8 && h.p[2] < 11.65) for (const P of S.prims) if (P.voiture && h.p[0] > P.a[0] - 0.1 && h.p[0] < P.b[0] + 0.1) { L = mul(L, 0.3); break; }
      const refl = mode === "ir" ? (m.ir != null ? m.ir : lumi(m.c) * 1.25) : null;
      let c = mode === "ir" ? [refl * L[0], refl * L[0], refl * L[0]] : [m.c[0] * L[0], m.c[1] * L[1], m.c[2] * L[2]];
      const e = m.e && (!m.eNuit || nuit) ? m.e : null;
      if (e) { const k = mode === "ir" ? 0.6 : 1; c = add(c, mode === "ir" ? [lumi(e) * k, lumi(e) * k, lumi(e) * k] : e); }
      bg[i * 3] = c[0]; bg[i * 3 + 1] = c[1]; bg[i * 3 + 2] = c[2];
    }
    if (pas === 2) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!(x & 1) && !(y & 1)) continue;
      const x0 = x & ~1, y0 = y & ~1, x1 = Math.min(x0 + 2, (W - 1) & ~1), y1 = Math.min(y0 + 2, (H - 1) & ~1), fx = (x - x0) / 2, fy = (y - y0) / 2;
      const a = y0 * W + x0, b = y0 * W + x1, c = y1 * W + x0, e = y1 * W + x1, i = y * W + x;
      for (let q = 0; q < 3; q++) bg[i * 3 + q] = lerp(lerp(bg[a * 3 + q], bg[b * 3 + q], fx), lerp(bg[c * 3 + q], bg[e * 3 + q], fx), fy);
      const n = fx < 0.5 ? (fy < 0.5 ? a : c) : fy < 0.5 ? b : e;
      bz[i] = bz[n]; gx[i] = gx[n]; gz[i] = gz[n];
    }
    Object.assign(S, { bg, bz, gx, gz });
  }

  function ombrage(prims, h, d) {
    const o = add(h.p, mul(h.n, 0.02));
    for (const P of prims) {
      if (P === h.prim || P.sansOmbre) continue;
      const q = P.k === "box" ? hitBox(P, o, d) : P.k === "cyl" ? hitCyl(P, o, d) : hitSph(P, o, d);
      if (q) return true;
    }
    return false;
  }

  function horo(S, t) {
    const [hh, mm, ss] = S.heure.split(":").map(Number);
    let s = hh * 3600 + mm * 60 + ss + Math.floor(t);
    s %= 86400;
    const p = (n) => String(n).padStart(2, "0");
    return `${S.date} ${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
  }

  function etats(S, t) {
    const res = {};
    S._cible = null;
    const ordre = S.scn.acteurs, ob = S.scn.objet;
    if (S.scn.objetAt) {
      for (const A of ordre) { const e = etat(A, t, S); if (!e) { res[A.id] = null; continue; } e.j = squelette(e.pos, e.gy, e.cap, e.pose, A.sc); e.j.gy = e.gy; res[A.id] = e; }
      res._objet = S.scn.objetAt(t, res);
      return res;
    }
    const V_ = ordre.find((a) => a.id === "V");
    // la victime d'abord : l'objet qu'elle porte sert de cible au geste
    for (const A of [V_].concat(ordre.filter((a) => a !== V_))) {
      const e = etat(A, t, S);
      if (!e) { res[A.id] = null; continue; }
      e.j = squelette(e.pos, e.gy, e.cap, e.pose, A.sc); e.j.gy = e.gy;
      res[A.id] = e;
      if (A === V_) S._cible = porte(e.j, A.sc, ob.type).pos;
    }
    // l'objet : porté, tiré, puis dans la main de l'auteur
    let o = null;
    const eV = res.V, eA = res.A;
    if (eV) {
      const ep = porte(eV.j, V_.sc, ob.type);
      if (t < ob.tPrise || !eA) o = { pos: ep.pos, fw: ep.fw, att: ob.type === "sac" ? eV.j.shR : null };
      else {
        const main = ob.type === "sac" ? add(eA.j.haR, [0, -0.12, 0]) : eA.j.haR;
        if (t < ob.tLache) { const u = smooth((t - ob.tPrise) / (ob.tLache - ob.tPrise)); o = { pos: lerp3(ep.pos, main, 0.35 + 0.65 * u), fw: eA.j.fw, att: ob.type === "sac" ? eV.j.shR : null }; }
        else o = { pos: main, fw: eA.j.fw, att: ob.type === "sac" ? eA.j.haR : null };
      }
    }
    if (!eA && t >= ob.tLache) o = null;
    res._objet = o;
    return res;
  }
  function porte(j, sc, type) {
    if (type === "chaine") return { pos: add(j.chest, add(mul(j.tdir, 0.1 * sc), mul(j.tfw, 0.08 * sc))), fw: j.lat };
    if (type === "telephone" || type === "poignet") return { pos: j.haR, fw: j.fw };
    // sac porté à l'épaule droite (côté chaussée), contre la hanche
    return { pos: add(add(j.hipR, mul(j.lat, -0.13 * sc)), [0, 0.06, 0]), fw: j.fw };
  }

  // la caméra mobile : position de l'instant t, éclairage (le phare infrarouge suit la caméra) et fond retracés
  function placer(S, t) {
    if (!S.camAt) return;
    const k = Math.round(t * 1000);
    if (S._camK === k) return;
    S._camK = k; S.cam = Camera(S.camAt(t)); S.lum = Eclairage(S.D, S.mode, S.cam); S.bg = null;
  }
  function rendre(S, t, out) {
    out = out || new Uint8ClampedArray(N * 4);
    placer(S, t);
    if (!S.bg) fond(S);
    const F = { c: S.bg.slice(), z: S.bz.slice() };
    const E = etats(S, t);
    const js = S.scn.acteurs.map((A) => E[A.id] && E[A.id].j);
    ombres(S, F, js);
    for (const A of S.scn.acteurs) { const e = E[A.id]; if (e) dessinerActeur(S, F, A, e.j, e); }
    if (E._objet) dessinerObjet(S, F, E._objet, S.scn.objet);
    if (S.bloc > 1) pixeliser(F.c, S.bloc);
    post(S, F.c, t, out);
    return out;
  }

  // l'image vue au grain du capteur : moyenne par blocs de b pixels, puis agrandie en douceur
  function pixeliser(c, b) {
    const gw = Math.ceil(W / b) + 1, gh = Math.ceil(H / b) + 1, G = new Float32Array(gw * gh * 3), n = new Float32Array(gw * gh);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = Math.floor(y / b) * gw + Math.floor(x / b), i = (y * W + x) * 3; G[k * 3] += c[i]; G[k * 3 + 1] += c[i + 1]; G[k * 3 + 2] += c[i + 2]; n[k]++; }
    for (let k = 0; k < gw * gh; k++) if (n[k]) { G[k * 3] /= n[k]; G[k * 3 + 1] /= n[k]; G[k * 3 + 2] /= n[k]; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const gx = clamp((x + 0.5) / b - 0.5, 0, Math.ceil(W / b) - 1.001), gy = clamp((y + 0.5) / b - 0.5, 0, Math.ceil(H / b) - 1.001);
      const x0 = gx | 0, y0 = gy | 0, fx = gx - x0, fy = gy - y0, i = (y * W + x) * 3;
      for (let q = 0; q < 3; q++) c[i + q] = lerp(lerp(G[(y0 * gw + x0) * 3 + q], G[(y0 * gw + x0 + 1) * 3 + q], fx), lerp(G[((y0 + 1) * gw + x0) * 3 + q], G[((y0 + 1) * gw + x0 + 1) * 3 + q], fx), fy);
    }
  }

  // ---------------------------------------------------------------- caméra : déformation, couleur, compression, grain, incrustation
  function post(S, src, t, out) {
    const ir = S.mode === "ir", jour = S.mode === "jour";
    const fi = Math.round(t * 100);
    const k = S.k, ix = 2 / W, Y = new Float32Array(N), Cb = new Float32Array(N), Cr = new Float32Array(N);
    const expo = jour ? 1.5 : ir ? 1.35 : 1.8;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // barillet : le centre est grossi, les bords tassés
      const nx = (x + 0.5) * ix - 1, ny = ((y + 0.5) * ix - H / W);
      const r2 = (nx * nx + ny * ny) / 1.31, f = (1 + k * r2) / (1 + k);
      const sx = clamp((nx * f + 1) / ix - 0.5, 0, W - 1.001), sy = clamp((ny * f + H / W) / ix - 0.5, 0, H - 1.001);
      const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0, i0 = (y0 * W + x0) * 3, i1 = i0 + 3, i2 = i0 + W * 3, i3 = i2 + 3;
      const w0 = (1 - fx) * (1 - fy), w1 = fx * (1 - fy), w2 = (1 - fx) * fy, w3 = fx * fy;
      // exposition (courbe douce) puis gamma
      const m0 = Math.pow(1 - Math.exp(-(src[i0] * w0 + src[i1] * w1 + src[i2] * w2 + src[i3] * w3) * expo), 1 / 2.1);
      const m1 = Math.pow(1 - Math.exp(-(src[i0 + 1] * w0 + src[i1 + 1] * w1 + src[i2 + 1] * w2 + src[i3 + 1] * w3) * expo), 1 / 2.1);
      const m2 = Math.pow(1 - Math.exp(-(src[i0 + 2] * w0 + src[i1 + 2] * w1 + src[i2 + 2] * w2 + src[i3 + 2] * w3) * expo), 1 / 2.1);
      const i = y * W + x;
      Y[i] = 0.299 * m0 + 0.587 * m1 + 0.114 * m2;
      Cb[i] = ir ? 0 : (m2 - Y[i]) * 0.55;
      Cr[i] = ir ? 0 : (m0 - Y[i]) * 0.55;
    }
    // chrominance moyennée par blocs de 4 × 2 (compression), luminance adoucie
    if (!ir) for (let by = 0; by < H; by += 2) for (let bx = 0; bx < W; bx += 4) {
      let a = 0, b = 0;
      for (let y = by; y < by + 2; y++) for (let x = bx; x < bx + 4; x++) { a += Cb[y * W + x]; b += Cr[y * W + x]; }
      a /= 8; b /= 8;
      for (let y = by; y < by + 2; y++) for (let x = bx; x < bx + 4; x++) { Cb[y * W + x] = a; Cr[y * W + x] = b; }
    }
    const grain = ir ? 0.07 : jour ? 0.03 : 0.06;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const l = x > 0 ? Y[i - 1] : Y[i], rr = x < W - 1 ? Y[i + 1] : Y[i];
      let v = 0.18 * l + 0.64 * Y[i] + 0.18 * rr;
      v += (h2(i, fi) - 0.5) * grain + (h2(y, fi + 7) - 0.5) * 0.012;
      v = Math.round(v * 40) / 40; // quantification
      const vx = (x / W - 0.5) * 2, vy = (y / H - 0.5) * 2, vig = 1 - 0.18 * (vx * vx + vy * vy);
      v *= vig;
      const cb = Cb[i] + (ir ? 0 : -0.012), cr = Cr[i] + (ir ? 0 : -0.006);
      const o = i * 4;
      out[o] = clamp((v + 1.402 * cr) * 255, 0, 255);
      out[o + 1] = clamp((v - 0.344 * cb - 0.714 * cr) * 255, 0, 255);
      out[o + 2] = clamp((v + 1.772 * cb) * 255, 0, 255);
      out[o + 3] = 255;
    }
    if (S.agrandi) return out;
    if (S.style === "pieton") {
      // caméra individuelle : horodatage en haut, identifiant de la caméra en bas, voyant d'enregistrement rouge
      ecrire(out, 6, 6, S.horodatage(t));
      ecrire(out, 6, H - 7 - 5 * EC, S.camNom);
      const rr0 = 2 * EC + 1;
      for (let dy = -rr0; dy <= rr0; dy++) for (let dx = -rr0; dx <= rr0; dx++) if (dx * dx + dy * dy <= rr0 * rr0) { const i = ((6 + 2 * EC + dy) * W + (W - 6 - 13 * EC - 4 * EC + dx)) * 4; out[i] = 230; out[i + 1] = 30; out[i + 2] = 30; }
      ecrire(out, W - 6 - 12 * EC, 6, "REC");
      return out;
    }
    ecrire(out, 6, 6, S.horodatage(t));
    ecrire(out, W - 6 - S.camNom.length * 4 * EC, 6, S.camNom);
    if (ir) ecrire(out, W - 6 - 8 * EC, H - 7 - 5 * EC, "IR");
    return out;
  }

  // ---------------------------------------------------------------- ce que l'image permet
  function lisible(S) {
    const ir = S.mode === "ir";
    const res = {};
    for (const A of S.scn.acteurs) {
      const T = A.tenue, H_ = HAUTS[T.haut], cH = COUL[T.hautC], cB = COUL[T.basC], cC = CHAUSS[T.chauss];
      // plus grande taille de la tête à l'écran sur tout l'extrait
      let tete = 0, vu = 0;
      for (let i = 0; i < S.frames.length; i += 2) {
        if (S.camAt) placer(S, S.frames[i]);
        const e = etat(A, S.frames[i], S); if (!e) continue;
        const j = squelette(e.pos, e.gy, e.cap, e.pose, A.sc), p = S.cam.proj(j.head);
        if (!p || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;
        vu++; tete = Math.max(tete, (2 * S.cam.F * REF * (S.D.capteur || 1) * 0.105 * A.sc) / p[2]);
      }
      const teinte = (c, g) => (ir ? (c.ir >= 0.66 ? "de teinte claire" : c.ir <= 0.48 ? "de teinte foncée" : "de teinte moyenne") : c[g]);
      const fem = H_.g === "f";
      const desc = [`${H_.nom} ${teinte(cH, fem ? "f" : "m")}`];
      if (T.tete === "capuche") desc[0] += ", capuche relevée";
      desc.push(`${BAS[T.bas].nom === "jean" && ir ? "pantalon" : BAS[T.bas].nom} ${teinte(cB, "m")}`);
      desc.push(ir ? (cC.ir >= 0.66 ? "chaussures claires" : "chaussures foncées") : cC.nom);
      if (T.tete && T.tete !== "capuche") desc.push(T.tete);
      if (T.sac) desc.push(T.sac === "sacoche" ? "sacoche en bandoulière" : "sac à dos");
      res[A.id] = {
        role: A.role, vu: vu > 0, reel: V.decrire(T), image: desc.join(", "),
        visage: tete >= 14 ? "traits du visage discernables" : "traits du visage non discernables",
        tetePx: Math.round(tete * 10) / 10,
        couleurs: ir ? "couleurs non restituées (infrarouge)" : "couleurs restituées, faussées par l'éclairage",
      };
    }
    return res;
  }

  // ---------------------------------------------------------------- lecteur (DOM seul ; l'interface du jeu l'enveloppera)
  // V.lecteur(canvas, S, { onTemps(t, i) }) → { lire, pause, basculer, aller(t), image(±1), vitesse(v), t, enLecture }
  // Le temps de lecture avance en continu ; l'image montrée est la dernière enregistrée (gel pendant les images sautées).
  V.lecteur = function (canvas, S, o) {
    o = o || {};
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    const octx = off.getContext("2d"), ctx = canvas.getContext("2d"), id = octx.createImageData(W, H);
    const L = { t: 0, v: 1, enLecture: false, i: -1 };
    let last = 0, raf = 0;
    function peindre(force) {
      const i = S.indexA(L.t);
      if (i !== L.i || force) { S.image(i, id.data); octx.putImageData(id, 0, 0); L.i = i; }
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      if (o.onTemps) o.onTemps(L.t, L.i);
    }
    function boucle(ts) {
      if (!L.enLecture) return;
      const dt = Math.min(0.25, (ts - last) / 1000); last = ts;
      L.t += dt * L.v;
      if (L.t >= S.duree - 1 / S.fps) { L.t = S.duree - 1 / S.fps; L.enLecture = false; }
      peindre();
      raf = L.enLecture ? requestAnimationFrame(boucle) : 0;
      if (!L.enLecture && o.onFin) o.onFin();
    }
    L.lire = () => { if (L.enLecture) return; if (L.t >= S.duree - 1 / S.fps - 1e-6) L.t = 0; L.enLecture = true; last = performance.now(); raf = requestAnimationFrame(boucle); };
    L.pause = () => { L.enLecture = false; if (raf) cancelAnimationFrame(raf); raf = 0; peindre(); };
    L.basculer = () => (L.enLecture ? L.pause() : L.lire());
    L.aller = (t) => { L.t = clamp(t, 0, S.duree - 1 / S.fps); peindre(); };
    L.image = (k) => { L.pause(); const i = clamp(S.indexA(L.t) + k, 0, S.frames.length - 1); L.t = S.frames[i]; peindre(); };
    L.vitesse = (v) => { L.v = v; };
    L.detruire = () => { L.enLecture = false; if (raf) cancelAnimationFrame(raf); };
    peindre(true);
    return L;
  };

  // ---------------------------------------------------------------- agrandissement (arrêt sur image)
  // Les personnes visibles à l'instant t : identifiant, position de la tête à l'écran, taille de la tête.
  V.personnes = function (S, t) {
    placer(S, t);
    const E = etats(S, t), res = [];
    for (const A of S.scn.acteurs) {
      const e = E[A.id]; if (!e) continue;
      const p = S.ecran(e.j.head); if (!p || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;
      res.push({ id: A.id, role: A.role, x: p[0], y: p[1], tete: (2 * S.cam.F * REF * (S.D.capteur || 1) * 0.105 * A.sc) / p[2] });
    }
    return res.sort((a, b) => a.x - b.x);
  };
  // L'image agrandie autour d'une personne : la même caméra, resserrée sur le haut du corps (1,1 m de large), puis
  // ramenée au grain réel du capteur (CAPTEUR fois plus fin que l'image de référence de 320 points) : de près, le visage
  // se lit ; de loin, il reste une tache. → { data (RGBA W × H), bloc, tete }
  const CAPTEUR = 2.5;
  V.agrandir = function (S, t, id, out) {
    t = S.frames[S.indexA(t)];
    placer(S, t);
    const E = etats(S, t), e = E[id], A = S.scn.acteurs.find((a) => a.id === id);
    if (!e || !A) return null;
    const cible = lerp3(e.j.head, e.j.chest, 0.3), v = sub(cible, S.cam.C), dist = len(v), f = mul(v, 1 / dist);
    const fov = (2 * Math.atan(1.1 / 2 / dist) * 180) / Math.PI;
    const cam = Camera({ pos: S.cam.C, yaw: Math.atan2(f[0], f[2]), pitch: Math.asin(-f[1]), fov });
    const Fref = S.cam.F * REF * (S.D.capteur || 1), bloc = cam.F / (Fref * CAPTEUR);
    const Z = Object.assign({}, S, { cam, lum: Eclairage(S.D, S.mode, cam), bg: null, camAt: null, k: 0, agrandi: true, bloc });
    const data = rendre(Z, t, out);
    return { data, bloc, tete: (2 * Fref * 0.105 * A.sc) / dist };
  };

  V.rng = rng;
  V.squelette = squelette;
  V.Camera = Camera;
  // 1.5.0 : les outils du metteur en scène, pour les décors et les faits écrits ailleurs (video-rue.js, video-pieton.js)
  V.outils = { GL, bruit, rng, pick, lerp, clamp, smooth, frac, h2, add, sub, mul, P, mix, marche, course, tenue, PEAU, CHEV, COUCHE, preparer, etat, squelette };
})();
