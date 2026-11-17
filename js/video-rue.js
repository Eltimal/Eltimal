/* La Permanence — la vidéoprotection de la voie publique (1.5.0 « La preuve filmée », D-101).
   Un décor de rue parisienne en trois variantes (rue commerçante avec sa vitrine, devant un bar avec sa terrasse, une
   place avec son banc et son arbre), vu par une caméra municipale fixe, haute, en plongée ; et les faits qu'elle filme :
   des coups (qui frappe le premier, une chute, un second auteur, un témoin qui filme), une dégradation (vitrine,
   voiture, tag), un vol à la tire, un échange de stupéfiants, des menaces, et l'interpellation qui peut suivre.
   Mêmes principes que video.js : tout sort de la graine, l'image ne montre que ce que la simulation sait.
   Les moments portent des repères («A», «V», «A2», «T», «P1», «P2») que le procès-verbal d'exploitation remplace par ce
   que l'image laisse voir de chacun : l'enquêteur décrit des silhouettes, il ne nomme personne.
   Limites de contenu (comme sim-image.js) : la violence se lit dans la position des corps ; ni gros plan, ni blessure. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const CR = (root.CR = root.CR || {});
  const V = CR.video;
  if (!V || !V.outils) return;
  const { rng, pick, lerp, clamp, smooth, frac, h2, add, mul, P, tenue, PEAU, CHEV } = V.outils;
  const RUE = (CR.VRUE = {});

  // ---------------------------------------------------------------- gestes nouveaux
  // b.cible : point du monde visé par la main (tête de l'autre, vitrine, main tendue)
  Object.assign(V.GESTES, {
    // coup de poing : le bras part vers la tête visée, le buste suit
    frappe(u, t, b) { const k = Math.sin(Math.PI * clamp(u * 1.4, 0, 1)); return P({ lean: 0.12 + 0.18 * k, hL: 0.25, kL: 0.3, hR: -0.2, kR: 0.15, sL: 0.7, eL: 1.6, aL: 0.25, ikR: b.cible, head: 0.05 }); },
    // encaisser : le buste part en arrière, les avant-bras remontent
    encaisse(u) { return P({ lean: -0.18 - 0.12 * Math.sin(Math.PI * u), head: -0.25, hL: -0.15, kL: 0.3, hR: 0.2, kR: 0.35, sL: 0.9, eL: 1.8, aL: 0.3, sR: 0.9, eR: 1.8, aR: 0.3 }); },
    pousse(u) { const k = Math.sin(Math.PI * u); return P({ lean: 0.15 + 0.15 * k, hL: 0.35, kL: 0.35, hR: -0.25, kR: 0.15, sL: 1.1 + 0.3 * k, eL: 0.25, aL: 0.12, sR: 1.1 + 0.3 * k, eR: 0.25, aR: 0.12 }); },
    coup_pied(u) { const k = Math.sin(Math.PI * u); return P({ lean: -0.18 * k, hR: 1.15 * k, kR: 0.35 + 0.4 * (1 - k), hL: -0.05, kL: 0.15, sL: 0.5, eL: 0.6, aL: 0.5, sR: 0.3, eR: 0.5, aR: 0.55 }); },
    // menace : le bras tendu, l'index pointé, qui s'agite ; le buste en avant
    menace(u, t) { return P({ lean: 0.14, head: 0.06, sR: 1.25 + 0.22 * Math.sin(t * 7.5), eR: 0.15, aR: 0.15, sL: 0.25, eL: 0.6, aL: 0.25 }); },
    // filmer : le téléphone tenu à deux mains devant le visage
    filme(u, t) { return P({ head: 0.12, sL: 1.0, eL: 1.85, aL: 0.25, sR: 1.0, eR: 1.85, aR: 0.25, lean: 0.03 + 0.02 * Math.sin(t * 0.7) }); },
    // tag : la main va et vient sur le mur
    tag(u, t, b) { return P({ lean: 0.06, head: 0.1, sL: 0.2, eL: 0.4, ikR: b.cible ? add(b.cible, [0.45 * Math.sin(t * 2.6), 0.22 * Math.sin(t * 4.1), 0]) : null }); },
    // main à main : la main tendue vers celle de l'autre
    echange(u, t, b) { return P({ lean: 0.08, head: 0.18, sL: 0.1, eL: 0.3, ikR: b.cible }); },
  });

  // ---------------------------------------------------------------- le décor de rue
  // Repère de video.js : x le long du trottoir, y vers le haut, z en s'éloignant de la caméra (posée sur la façade du
  // trottoir filmé). Trottoir filmé jusqu'à z = 9,5, chaussée, trottoir d'en face, façade d'en face à z = 20.
  function rue(variante) {
    const D = {
      nom: { commerce: "Rue commerçante", bar: "Rue, devant un bar", place: "Place" }[variante],
      variante,
      // la caméra municipale est sur un mât du trottoir d'en face, tournée vers le trottoir filmé et sa façade (zn) :
      // +x part vers la GAUCHE de l'image
      camera: { pos: [2.6, 6.0, 17.4], yaw: Math.PI + 0.06, pitch: 0.45, fov: 56 },
      zf: 20, zn: 4.0, bord: 9.5, route: 16.5,
      // cibles des faits : la vitrine (commerce), la terrasse (bar), le banc (place)
      vitrine: { x0: 2.0, x1: 6.2, z: 4.0 },
      prims(r) {
        const PR = [];
        const box = (a, b, m, x) => PR.push(Object.assign({ k: "box", a, b, m }, x || {}));
        // réverbères
        for (const x of [-4.6, 9.4]) {
          PR.push({ k: "cyl", x, z: 9.05, r: 0.08, y0: 0, y1: 5.2, m: { c: [0.05, 0.06, 0.06] } });
          box([x - 0.05, 5.1, 9.0], [x + 0.05, 5.18, 10.3], { c: [0.05, 0.06, 0.06] });
          box([x - 0.2, 4.98, 10.0], [x + 0.2, 5.12, 10.6], { c: [0.3, 0.3, 0.28], e: [1.4, 1.15, 0.8], eNuit: true });
        }
        // potelets
        for (let x = -7; x < 14; x += 1.6) if ((x < -5.3 || x > -3.8) && Math.abs(x - 9.4) > 0.6) PR.push({ k: "cyl", x, z: 9.25, r: 0.05, y0: 0, y1: 0.75, m: { c: [0.08, 0.06, 0.05] } });
        // voitures garées
        const cols = [[0.28, 0.28, 0.3], [0.04, 0.04, 0.05], [0.55, 0.55, 0.56], [0.25, 0.03, 0.03], [0.05, 0.08, 0.16], [0.42, 0.4, 0.33]];
        for (const [x0, l] of [[6.6, 4.3], [-12.5, 4.1], [11.5, 4.4], [-7.2, 4.2]]) {
          const c = pick(r, cols);
          box([x0, 0.28, 9.85], [x0 + l, 0.95, 11.6], { c, s: 0.6 }, { voiture: true });
          box([x0 + 0.9, 0.95, 10.0], [x0 + l - 0.8, 1.42, 11.45], { c: [0.02, 0.025, 0.03], s: 0.8 });
          box([x0 + 0.3, 0.12, 9.9], [x0 + l - 0.3, 0.28, 11.55], { c: [0.01, 0.01, 0.01] });
        }
        if (variante === "commerce") {
          // la vitrine du trottoir filmé, éclairée la nuit, et son store
          const v = this.vitrine;
          // le store au-dessus de la vitrine (la vitrine elle-même est peinte sur la façade proche)
          box([v.x0 - 0.2, 2.75, v.z], [v.x1 + 0.2, 2.85, v.z + 0.9], { c: pick(r, [[0.35, 0.05, 0.05], [0.05, 0.2, 0.1], [0.08, 0.1, 0.3]]) });
          // l'arrêt de bus : un poteau et son panneau (un abribus vitré masquerait le trottoir à la caméra d'en face)
          PR.push({ k: "cyl", x: -2.4, z: 9.0, r: 0.04, y0: 0, y1: 2.6, m: { c: [0.2, 0.22, 0.24] } });
          box([-2.65, 2.2, 8.97], [-2.15, 2.6, 9.03], { c: [0.1, 0.3, 0.45], e: [0.1, 0.3, 0.5], eNuit: true });
        } else if (variante === "bar") {
          // la façade du bar, l'enseigne allumée, la terrasse : tables rondes et chaises
          // l'enseigne lumineuse, en saillie sur la façade proche (le bar lui-même est peint sur la façade)
          box([0.5, 2.7, 4.0], [5.5, 3.1, 4.12], { c: [0.1, 0.1, 0.1], e: pick(r, [[1.4, 0.2, 0.2], [0.2, 0.9, 1.2], [1.3, 0.9, 0.2]]), eNuit: true });
          for (const [x, z] of [[0.2, 5.0], [1.8, 5.1], [3.4, 5.0], [5.0, 5.1]]) {
            PR.push({ k: "cyl", x, z, r: 0.04, y0: 0, y1: 0.72, m: { c: [0.1, 0.1, 0.1] } });
            PR.push({ k: "cyl", x, z, r: 0.33, y0: 0.72, y1: 0.76, m: { c: [0.5, 0.48, 0.44] } });
            for (const dx of [-0.5, 0.5]) box([x + dx - 0.18, 0, z - 0.18], [x + dx + 0.18, 0.45, z + 0.18], { c: [0.12, 0.08, 0.05] });
          }
        } else {
          // la place : un banc, un arbre dans sa grille, des arceaux à vélos
          box([1.2, 0.42, 5.2], [3.4, 0.5, 5.6], { c: [0.3, 0.2, 0.1] });
          box([1.2, 0.5, 5.55], [3.4, 0.9, 5.62], { c: [0.3, 0.2, 0.1] });
          for (const x of [1.35, 3.25]) box([x - 0.04, 0, 5.25], [x + 0.04, 0.42, 5.55], { c: [0.05, 0.05, 0.05] });
          PR.push({ k: "cyl", x: -2.2, z: 6.0, r: 0.16, y0: 0, y1: 3.1, m: { c: [0.13, 0.09, 0.06] } });
          PR.push({ k: "sph", c: [-2.2, 4.0, 6.0], r: 1.6, m: { c: [0.08, 0.16, 0.06], s: 0.2 } });
          for (let x = 5.5; x < 8; x += 0.7) PR.push({ k: "cyl", x, z: 5.2, r: 0.025, y0: 0, y1: 0.8, m: { c: [0.3, 0.3, 0.3] } });
        }
        return PR;
      },
      solY() { return 0; },
      sol(x, z, nuit) {
        const v = h2(Math.floor(x / 0.8), Math.floor(z / 0.8));
        if (z < this.bord - 0.15) {
          if (variante === "place") { const pv = frac(x / 0.4) < 0.08 || frac(z / 0.4) < 0.08; const k = (0.85 + 0.2 * h2(Math.floor(x / 0.4), Math.floor(z / 0.4))) * (pv ? 0.7 : 1); return { c: [0.36 * k, 0.33 * k, 0.3 * k] }; }
          const j = frac(x / 0.8) < 0.04 || frac(z / 0.8) < 0.04;
          let k = (0.92 + 0.12 * v) * (j ? 0.72 : 1);
          if (h2(Math.floor(x * 3), Math.floor(z * 3)) > 0.985) k *= 0.7;
          return { c: [0.4 * k, 0.385 * k, 0.36 * k] };
        }
        if (z < this.bord) return { c: [0.5, 0.48, 0.45] };
        if (z < this.bord + 0.3) return { c: [0.12, 0.12, 0.125] };
        if (z < this.route) {
          const k = 0.85 + 0.25 * h2(Math.floor(x * 5), Math.floor(z * 5));
          const mid = (this.bord + this.route) / 2;
          if (Math.abs(z - mid) < 0.07 && frac(x / 6) < 0.5) return { c: [0.55, 0.55, 0.5] };
          return { c: [0.1 * k, 0.1 * k, 0.11 * k] };
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
          const lit = nuit && sh > 0.25;
          if (frac(u / 1.5) < 0.05) return { c: [0.05, 0.05, 0.05] };
          return { c: [0.03, 0.035, 0.04], e: lit ? (sh > 0.7 ? [0.9, 0.85, 0.75] : [0.8, 0.58, 0.32]) : null, s: 0.8 };
        }
        const fx = frac((x + 100) / 3.2), fy = frac((y - 3.8) / 3.1), fl = Math.floor((y - 3.8) / 3.1), col = Math.floor((x + 100) / 3.2);
        if (Math.abs(y - 6.95) < 0.12) return { c: [0.05, 0.05, 0.05] };
        if (fx > 0.3 && fx < 0.7 && fy > 0.22 && fy < 0.82) { const on = nuit && h2(col, fl + 11) > 0.62; return { c: [0.03, 0.03, 0.035], e: on ? [0.7, 0.5, 0.26] : null }; }
        return { c: stone };
      },
      // la façade du trottoir filmé, vue de face : la vitrine (commerce), le bar, ou des immeubles (place)
      facadeN(x, y, nuit) {
        const stone = [0.44, 0.4, 0.34];
        if (y < 3.4) {
          if (y < 0.3) return { c: mul(stone, 0.7) };
          const v = this.vitrine;
          if (variante === "commerce" && x > v.x0 && x < v.x1 && y > 0.45 && y < 2.6) return { c: [0.05, 0.06, 0.07], e: nuit ? [0.75, 0.66, 0.5] : null, s: 0.9 };
          if (variante === "bar" && x > -0.8 && x < 6.8 && y > 0.5 && y < 2.5) return { c: [0.06, 0.05, 0.04], e: nuit ? [0.95, 0.62, 0.3] : [0.12, 0.09, 0.06], s: 0.9 };
          if (variante === "bar" && x > -1.5 && x < 7.5) return { c: [0.18, 0.12, 0.08] };
          // portes cochères et autres boutiques, rideau baissé
          const i = Math.floor((x + 100) / 5.5), u = (x + 100) - i * 5.5;
          if (u < 0.5) return { c: stone };
          if (y < 2.6 && u > 1 && u < 4.6) return h2(i, 3) > 0.5 ? { c: [0.32, 0.33, 0.34] } : { c: [0.03, 0.035, 0.04], e: nuit && h2(i, 9) > 0.6 ? [0.7, 0.55, 0.35] : null, s: 0.8 };
          return { c: stone };
        }
        const fx = frac((x + 100) / 3.2), fy = frac((y - 3.4) / 3.1), fl = Math.floor((y - 3.4) / 3.1), col = Math.floor((x + 100) / 3.2);
        if (fx > 0.3 && fx < 0.7 && fy > 0.22 && fy < 0.82) { const on = nuit && h2(col + 50, fl) > 0.6; return { c: [0.03, 0.03, 0.035], e: on ? [0.7, 0.5, 0.26] : null }; }
        return { c: stone };
      },
      lumieres(mode) {
        const L = [];
        if (mode === "jour") return L;
        L.push({ p: [-4.6, 4.95, 10.3], c: [3.4, 2.3, 1.2], r: 2.6 });
        L.push({ p: [9.4, 4.95, 10.3], c: [3.4, 2.3, 1.2], r: 2.6 });
        if (variante === "commerce") L.push({ p: [4.1, 1.6, 4.4], c: [0.9, 0.8, 0.6], r: 2.4 });
        if (variante === "bar") { L.push({ p: [3, 1.8, 4.4], c: [1.6, 1.0, 0.5], r: 3.2 }); L.push({ p: [3, 3.0, 4.3], c: [0.8, 0.3, 0.3], r: 1.6 }); }
        for (let x = -14; x < 18; x += 6.5) if (h2(Math.floor((x + 100) / 6.5), 7) > 0.25) L.push({ p: [x + 3, 1.6, 19.2], c: [0.6, 0.48, 0.32], r: 3 });
        return L;
      },
    };
    return D;
  }
  V.DECORS.rue = rue("commerce");
  V.DECORS.rue_bar = rue("bar");
  V.DECORS.rue_place = rue("place");
  RUE.DECORS = ["rue", "rue_bar", "rue_place"];

  // ---------------------------------------------------------------- acteurs
  const POLICE = (r) => ({ haut: "blouson", hautC: "marine", bas: "pantalon", basC: "anthracite", chauss: "noires", tete: "casquette", teteC: "marine", sac: null, sacC: "noir" });
  function acteur(r, id, role, o) {
    const g = o.g || (r() < 0.5 ? "f" : "m");
    const A = { id, role, g, t0: o.t0 || 0, pos: o.pos.slice(), cap: o.cap != null ? o.cap : 0, beats: [], tenue: o.tenue || (role === "policier" ? POLICE(r) : tenue(r, o.tenueO || {})) };
    A.peau = pick(r, PEAU); A.chev = pick(r, CHEV); A.sc = (1.62 + r() * 0.24) / 1.75; if (g === "f") A.sc = Math.min(A.sc, 0.95);
    if (o.agee) { A.chev = CHEV[4]; A.sc *= 0.96; }
    return A;
  }
  const tete = (A, pos) => [pos[0], 1.55 * A.sc, pos[1]];
  // passants : le trottoir d'en face, et un sur le trottoir filmé avant les faits
  function passants(r, duree, tAvant) {
    return [
      Object.assign(acteur(r, "P1", "passant", { pos: [-16, 18.2] }), { beats: [{ a: "marche", d: duree + 2, to: [16, 18.3] }], sort: true }),
      Object.assign(acteur(r, "P2", "passant", { pos: [17, 17.6], cap: Math.PI, t0: 4 }), { beats: [{ a: "marche", d: duree + 2, to: [-17, 17.7] }], sort: true }),
      Object.assign(acteur(r, "P3", "passant", { pos: [-9, 8.6], t0: 0.3 }), { beats: [{ a: "marche", d: Math.max(6, (tAvant || 6)), to: [12, 8.8] }], sort: true }),
    ];
  }
  // l'interpellation : deux fonctionnaires arrivent en courant (par la droite de l'image), l'individu est amené au sol et menotté
  function interpellation(r, scn, cibleId, t, quelle) {
    const C = scn.acteurs.find((a) => a.id === cibleId);
    const fin = C.beats.reduce((s, b) => s + b.d, C.t0 || 0);
    const x = C._xFin != null ? C._xFin : C.pos[0], z = C._zFin != null ? C._zFin : C.pos[1];
    // la cible s'immobilise là où elle est à l'instant t (on coupe ses gestes à t)
    let reste = t - (C.t0 || 0); const beats = [];
    for (const b of C.beats) { if (reste <= 0) break; const d = Math.min(b.d, reste); beats.push(Object.assign({}, b, { d, to: b.to && d < b.d ? null : b.to })); reste -= d; }
    C.beats = beats.length ? beats : [{ a: "attend", d: Math.max(0.1, t - (C.t0 || 0)) }];
    C.sort = false;
    const pos = [x, z];
    C.beats.push({ a: "sursaut", d: 0.6, fondu: 0.1 }, { a: "tombe", d: 0.8, sens: -1, fondu: 0.1 }, { a: "au_sol", d: 9, sens: -1 });
    void fin;
    const pol = [];
    for (const [k, dz] of [[1, -0.5], [2, 0.5]]) {
      const Pk = acteur(r, "F" + k, "policier", { g: r() < 0.3 ? "f" : "m", pos: [-14, z + dz], t0: t - 2.6 });
      Pk.beats = [{ a: "court", d: 2.6, to: [pos[0] - 0.6, pos[1] + dz] }, { a: "penche", d: 10, face: 0 }];
      pol.push(Pk);
    }
    scn.acteurs.push(...pol);
    scn.moments.push({ t: t + 1.2, cle: "interpellation", txt: `Deux fonctionnaires de police arrivent en courant par la droite de l'image et amènent «${cibleId}» au sol, où ${quelle || "il est maintenu"}.` });
    scn.duree = Math.max(scn.duree, Math.ceil(t + 8));
  }

  // ---------------------------------------------------------------- les faits
  const F = V.FAITS;
  const objetRien = () => null;

  // Des coups. o : premier ("A" | "V" : qui frappe d'abord), coups (1 à 3), chute (la victime tombe), deux (un second
  // auteur), filme (un témoin filme avec son téléphone), fuite (l'auteur part en courant), police (interpellation),
  // victime { g, agee }, auteur { g }
  F.coups = {
    nom: "Coups sur la voie publique", decor: "rue_bar",
    monter(r, o) {
      const ov = o.victime || {}, oa = o.auteur || {};
      const xV = 2.6 + r() * 0.8, zV = 6.9 + r() * 0.6, xA = xV + 1.05, zA = zV + 0.15;
      const Vv = acteur(r, "V", "victime", { g: ov.g || "m", agee: ov.agee, pos: [xV - 6, zV], cap: 0 });
      const Aa = acteur(r, "A", "auteur", { g: oa.g || "m", pos: [xA + 7, zA], cap: Math.PI, tenueO: { capuche: 0.4, hauts: ["sweat", "blouson", "doudoune", "survet"] } });
      const tRencontre = 3.2, tG = 6.2 + r() * 1.5, premier = o.premier === "V" ? "V" : "A";
      const nCoups = clamp(o.coups || 1 + Math.floor(r() * 2), 1, 3);
      Vv.beats = [{ a: "marche", d: tRencontre, to: [xV, zV] }, { a: premier === "V" ? "menace" : "attend", d: tG - tRencontre, face: 0 }];
      Aa.beats = [{ a: "marche", d: tRencontre, to: [xA, zA] }, { a: premier === "A" ? "menace" : "attend", d: tG - tRencontre, face: Math.PI }];
      const moments = [{ t: tRencontre + 0.8, cle: "face", txt: "«V» et «A» se font face sur le trottoir ; l'échange paraît vif, sans contact." }];
      let t = tG;
      const hit = (X, Y, n) => {
        X.beats.push({ a: "frappe", d: 0.4, face: X === Aa ? Math.PI : 0, cible: tete(Y, Y === Vv ? [xV, zV] : [xA, zA]), fondu: 0.12 });
        Y.beats.push({ a: "encaisse", d: 0.55, fondu: 0.1 });
        if (n > 1) { X.beats.push({ a: "attend", d: 0.15 }); Y.beats.push({ a: "attend", d: 0.0001 }); }
      };
      if (premier === "V") {
        hit(Vv, Aa, 1); t += 0.6; Aa.beats.push({ a: "attend", d: 0.2 });
        moments.push({ t: tG + 0.15, cle: "premier", txt: "«V» porte le premier coup, au visage de «A»." });
        Vv.beats.push({ a: "attend", d: 0.25 });
        hit(Aa, Vv, 1); t += 0.65;
        moments.push({ t: t - 0.3, cle: "riposte", txt: "«A» riposte aussitôt d'un coup de poing." });
      } else {
        for (let k = 0; k < nCoups; k++) { hit(Aa, Vv, nCoups - k); t += 0.6 + (k < nCoups - 1 ? 0.15 : 0); }
        moments.push({ t: tG + 0.15, cle: "premier", txt: `«A» porte ${nCoups > 1 ? `${["", "un", "deux", "trois"][nCoups]} coups de poing` : "un coup de poing"} au visage de «V», qui n'a pas de geste vers lui auparavant.` });
      }
      if (o.deux) {
        const A2 = acteur(r, "A2", "auteur", { g: "m", pos: [xA + 9, zA + 0.6], cap: Math.PI, tenueO: { capuche: 0.5 } });
        A2.t0 = tG - 1.5;
        A2.beats = [{ a: "court", d: 1.6, to: [xV + 0.75, zV + 0.7] }, { a: "pousse", d: 0.5, face: Math.PI + 0.4 }, { a: "attend", d: 2 }];
        moments.push({ t: tG + 0.4, cle: "second", txt: "Un second individu, «A2», arrive en courant et pousse «V»." });
        scnTmp = A2;
      }
      if (o.chute) {
        Vv.beats.push({ a: "tombe", d: 0.75, to: [xV - 0.5, zV + 0.1], sens: 1, fondu: 0.1 }, { a: "au_sol", d: 6, sens: 1 }, { a: "releve", d: 2.6, sens: 1 });
        moments.push({ t: t + 0.4, cle: "chute", txt: "«V» chute en arrière sur le trottoir et reste au sol plusieurs secondes." });
        Vv._xFin = xV - 0.5; Vv._zFin = zV + 0.1;
      } else Vv.beats.push({ a: "sursaut", d: 1.2 }, { a: "attend", d: 10, face: 0.2 });
      const acteurs = [Vv, Aa];
      if (scnTmp) { acteurs.push(scnTmp); scnTmp = null; }
      if (o.filme) {
        const T = acteur(r, "T", "temoin", { pos: [-0.6, 7.9], cap: 0.2 });
        T.beats = [{ a: "attend", d: tG - 1.5, tel: true }, { a: "filme", d: 14, face: 0.15 }];
        acteurs.push(T);
        moments.push({ t: tG - 1, cle: "filme", txt: "«T» tient un téléphone à deux mains devant son visage, tourné vers la scène." });
      }
      if (o.fuite !== false && !o.police) {
        Aa.beats.push({ a: "court", d: 3.4, to: [-13, zA + 0.8], fondu: 0.15 }); Aa.sort = true;
        moments.push({ t: t + 1.6, cle: "fuite", txt: "«A» s'éloigne en courant et sort du champ par la droite." });
      } else Aa.beats.push({ a: "attend", d: 12, face: Math.PI });
      const duree = Math.max(22, Math.ceil(t + 9));
      const scn = { acteurs: acteurs.concat(passants(r, duree, tG)), objet: null, objetAt: objetRien, moments, duree, tG };
      if (o.police) interpellation(r, scn, "A", t + 2.2);
      return scn;
    },
  };
  let scnTmp = null;

  // Une dégradation. o : cible ("vitrine" | "voiture" | "tag"), police
  F.degradation = {
    nom: "Dégradation", decor: "rue",
    monter(r, o) {
      const cible = o.cible || pick(r, ["vitrine", "voiture", "tag"]);
      const D = V.DECORS.rue;
      const A = acteur(r, "A", "auteur", { g: (o.auteur || {}).g || "m", pos: [12, 7.4], cap: Math.PI, tenueO: { capuche: 0.6, hauts: ["sweat", "blouson", "survet"] } });
      const tG = 5.5;
      let to, face, geste, txt;
      if (cible === "vitrine") { to = [4.2, D.vitrine.z + 0.75]; face = -Math.PI / 2; geste = "coup_pied"; txt = "«A» donne plusieurs coups de pied dans la vitrine du commerce."; }
      else if (cible === "voiture") { to = [8.7, 9.3]; face = Math.PI / 2; geste = "coup_pied"; txt = "«A» donne plusieurs coups de pied dans la portière d'un véhicule garé."; }
      else { to = [3.8, D.vitrine.z + 0.6]; face = -Math.PI / 2; geste = "tag"; txt = "«A» trace une inscription sur le mur, de la main droite, pendant plusieurs secondes."; }
      A.beats = [{ a: "marche", d: tG - 0.6, to }, { a: "regarde", d: 0.6, face }];
      const n = geste === "tag" ? 1 : 2 + Math.floor(r() * 2);
      for (let k = 0; k < n; k++) A.beats.push(geste === "tag" ? { a: "tag", d: 7, face, cible: [to[0], 1.6, D.vitrine.z] } : { a: "coup_pied", d: 0.55, face }, { a: "attend", d: geste === "tag" ? 0.5 : 0.35, face });
      const tFin = tG + (geste === "tag" ? 7.5 : n * 0.9);
      const moments = [{ t: tG - 1.5, cle: "arrivee", txt: "«A» arrive par la gauche de l'image et s'arrête." }, { t: tG + 0.4, cle: "geste", txt }];
      if (!o.police) { A.beats.push({ a: "regarde", d: 1, face: 0 }, { a: "court", d: 3.5, to: [-13, 7.8] }); A.sort = true; moments.push({ t: tFin + 1.8, cle: "fuite", txt: "«A» s'éloigne en courant vers la droite de l'image." }); }
      const duree = Math.max(20, Math.ceil(tFin + 7));
      const scn = { acteurs: [A].concat(passants(r, duree, tG)), objet: null, objetAt: objetRien, moments, duree, tG, cible };
      if (o.police) interpellation(r, scn, "A", tFin + 0.8);
      return scn;
    },
  };

  // Un vol à la tire : la victime attend, le téléphone dans la poche ; l'auteur passe, prend, s'éloigne au pas
  F.tire = {
    nom: "Vol à la tire", decor: "rue",
    monter(r, o) {
      const zV = 7.9;
      const Vv = acteur(r, "V", "victime", { g: (o.victime || {}).g || (r() < 0.6 ? "f" : "m"), pos: [-1.6, zV], cap: 0.2 });
      const A = acteur(r, "A", "auteur", { g: "m", pos: [12, zV + 0.2], cap: Math.PI, tenueO: { capuche: 0.5 } });
      const tG = 8.2;
      Vv.beats = [{ a: "attend", d: tG + 4.5, face: 0.2 }, { a: "sursaut", d: 1, face: Math.PI }, { a: "montre", d: 3, face: Math.PI }, { a: "sonne", d: 10 }];
      const xG = -1.6 + 0.45;
      A.beats = [{ a: "marche", d: tG - 0.2 - 0, to: [xG + 0.15, zV + 0.35] }, { a: "prend", d: 0.5, face: Math.PI, cible: [-1.6 + 0.1, 0.95, zV + 0.12] }, { a: "glisse", d: 0.5, cible: [xG + 0.1, 1.0, zV + 0.3] }, { a: "marche", d: 6, to: [-12, zV + 0.6] }];
      A.sort = true;
      const moments = [
        { t: tG - 2, cle: "approche", txt: "«A» arrive par la gauche, au pas, près de l'arrêt de bus." },
        { t: tG + 0.2, cle: "geste", txt: "En passant derrière «V», «A» porte la main droite à la hauteur de la poche arrière de «V», puis à sa propre poche." },
        { t: tG + 3, cle: "depart", txt: "«A» poursuit son chemin au pas et sort du champ par la droite." },
        { t: tG + 4.8, cle: "constat", txt: "«V» se retourne, tâte ses poches et montre la direction prise par «A»." },
      ];
      const duree = Math.max(22, Math.ceil(tG + 12));
      const scn = { acteurs: [Vv, A].concat(passants(r, duree, tG)), objet: null, objetAt: objetRien, moments, duree, tG };
      if (o.police) interpellation(r, scn, "A", tG + 2.4, "il est maintenu et palpé");
      return scn;
    },
  };

  // Un échange de stupéfiants : le vendeur attend, les acheteurs passent, main à main ; un guetteur regarde
  F.deal = {
    nom: "Échanges de la main à la main", decor: "rue_place",
    monter(r, o) {
      const n = clamp(o.n || 2, 1, 3);
      const W = acteur(r, "A", "auteur", { g: "m", pos: [4.4, 7.0], cap: Math.PI * 0.9, tenueO: { capuche: 0.5, hauts: ["sweat", "doudoune", "survet"], sac: "sacoche" } });
      const G = o.guetteur ? acteur(r, "A2", "auteur", { g: "m", pos: [7.6, 8.6], cap: 0 }) : null;
      const duree = 10 + n * 6.5;
      W.beats = [{ a: "attend", d: duree + 2, face: Math.PI * 0.9, poches: true }];
      const acteurs = [W], moments = [{ t: 1, cle: "attente", txt: "«A» se tient immobile près du banc, les mains dans les poches, et regarde autour de lui." }];
      for (let k = 0; k < n; k++) {
        const t0 = 2.5 + k * 6.5, B = acteur(r, "B" + (k + 1), "client", { pos: [-12, 7.6 + k * 0.3], t0 });
        B.beats = [{ a: "marche", d: 4.2, to: [3.6, 7.2] }, { a: "echange", d: 1.2, face: 0.1, cible: [4.0, 1.05, 7.1] }, { a: "marche", d: 5, to: [-12, 8.2] }];
        B.sort = true; acteurs.push(B);
        W.beats = [{ a: "attend", d: t0 + 4.2, face: Math.PI * 0.9, poches: true }].concat(k === n - 1 ? [] : []);
        moments.push({ t: t0 + 4.6, cle: "echange" + (k + 1), txt: `Une personne, «B${k + 1}», s'approche de «A» ; leurs mains se touchent brièvement, puis «B${k + 1}» repart au pas.` });
      }
      // le vendeur tend la main à chaque passage
      W.beats = [];
      let t = 0;
      for (let k = 0; k < n; k++) { const tE = 2.5 + k * 6.5 + 4.2; W.beats.push({ a: "attend", d: tE - t, face: Math.PI * 0.9, poches: true }, { a: "echange", d: 1.2, face: Math.PI, cible: [4.0, 1.05, 7.1] }); t = tE + 1.2; }
      W.beats.push({ a: "attend", d: 12, poches: true });
      if (G) { G.beats = [{ a: "regarde", d: duree + 2, face: 0 }]; acteurs.push(G); moments.push({ t: 2, cle: "guet", txt: "«A2» se tient à l'angle, tourne régulièrement la tête vers la rue." }); }
      const scn = { acteurs: acteurs.concat(passants(r, duree, 2)), objet: null, objetAt: objetRien, moments, duree: Math.ceil(duree), tG: 6.7, echanges: n };
      if (o.police) interpellation(r, scn, "A", duree - 4, "il est maintenu et palpé");
      return scn;
    },
  };

  // Des menaces : le bras tendu, l'index pointé, l'auteur avance ; la victime recule
  F.menaces = {
    nom: "Menaces", decor: "rue",
    monter(r, o) {
      const zV = 7.0;
      const Vv = acteur(r, "V", "victime", { g: (o.victime || {}).g || (r() < 0.5 ? "f" : "m"), pos: [2.4, zV], cap: 0 });
      const A = acteur(r, "A", "auteur", { g: (o.auteur || {}).g || "m", pos: [11, zV + 0.2], cap: Math.PI });
      const tG = 5;
      Vv.beats = [{ a: "attend", d: tG, face: 0, tel: true }, { a: "sursaut", d: 0.8, face: 0 }, { a: "marche", d: 3, to: [0.6, zV - 0.3], face: 0 }, { a: "attend", d: 12, face: 0 }];
      A.beats = [{ a: "marche", d: tG, to: [3.5, zV + 0.1] }, { a: "menace", d: 4.2, to: [2.0, zV], face: Math.PI }, { a: "menace", d: 2.4, face: Math.PI }, { a: "marche", d: 6, to: [12, zV + 0.4] }];
      A.sort = true;
      const moments = [
        { t: tG - 1, cle: "approche", txt: "«A» arrive par la gauche et se dirige droit vers «V»." },
        { t: tG + 0.8, cle: "geste", txt: "«A», le bras tendu et l'index pointé vers «V», avance sur «V», qui recule ; il n'y a pas de contact." },
        { t: tG + 7.5, cle: "depart", txt: "«A» repart par la gauche de l'image." },
      ];
      const duree = Math.max(20, Math.ceil(tG + 14));
      const scn = { acteurs: [Vv, A].concat(passants(r, duree, tG)), objet: null, objetAt: objetRien, moments, duree, tG };
      if (o.police) interpellation(r, scn, "A", tG + 5.5);
      return scn;
    },
  };

  // ---------------------------------------------------------------- outils pour le procès-verbal
  // Les repères «X» des moments, remplacés par ce que l'image laisse voir (lisible) : la première fois en entier,
  // ensuite « cet individu », « cette personne ».
  RUE.rediger = function (S, txt, vus) {
    const L = S.lisible ? (S._lis || (S._lis = S.lisible())) : {};
    return String(txt).replace(/«([A-Z][A-Z0-9]?)»/g, (m, id) => {
      const A = S.scn.acteurs.find((a) => a.id === id), l = L[id];
      const nom = A ? ({ victime: A.g === "f" ? "une femme" : "un homme", auteur: "un individu", temoin: "une personne", client: "une personne", policier: "un fonctionnaire" }[A.role] || "une personne") : "une personne";
      if (vus && vus.has(id)) return { auteur: `l'individu ${l ? "vêtu " + V.vetu(A.tenue, A.g).replace(/^d'un /, "d'un ").split(",")[0] : ""}`.trim(), victime: A && A.g === "f" ? "la femme" : "l'homme", temoin: "la personne au téléphone", client: "cette personne", policier: "le fonctionnaire" }[A ? A.role : ""] || "cette personne";
      if (vus) vus.add(id);
      return `${nom} (${l ? l.image : "silhouette"})`;
    }).replace(/^./, (c) => c.toUpperCase());
  };
  RUE.FAITS = ["coups", "degradation", "tire", "deal", "menaces"];
})();
