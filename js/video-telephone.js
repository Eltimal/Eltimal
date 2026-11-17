/* La Permanence — la vidéo filmée au téléphone (1.5.1 « La preuve filmée », D-101).
   Un téléphone tenu à la main, à la verticale : l'image suit la personne qui filme (elle n'est pas à l'image), vise ce
   qui se passe avec un temps de retard, tremble, se rapproche ; le son est enregistré (sous-titres). Deux situations :
   - un témoin, ou la victime, filme dans la rue (les faits de video-rue.js, vus depuis le trottoir) : souvent, il
     commence à filmer quand l'altercation est déjà engagée, et le premier coup manque ;
   - la victime filme chez elle (décor « appartement ») : la dispute, les menaces, les insultes ; parfois un geste
     violent, et le téléphone part vers le sol ; l'enregistrement s'arrête.
   Mêmes principes que video.js : tout sort de la graine ; l'image ne montre que ce que la simulation sait. Limites de
   contenu : la violence se lit dans les corps et le mouvement de l'image ; ni gros plan, ni blessure. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const CR = (root.CR = root.CR || {});
  const V = CR.video;
  if (!V || !V.outils || !V.DECORS.rue || !CR.VRUE) return;
  const { bruit, rng, pick, lerp, clamp, smooth, frac, h2, add, sub, mul, P, tenue, PEAU, CHEV, etat, squelette } = V.outils;
  const TEL = (CR.VTEL = {});

  // ---------------------------------------------------------------- le décor : un salon
  // Repère : x vers la droite de l'image (la personne qui filme regarde vers +z), y vers le haut, z en s'éloignant.
  // Mur du fond (zf) : fenêtre et rideaux, porte d'entrée, un cadre ; murs latéraux et plafond en boîtes.
  const PEINTURES = [[0.62, 0.58, 0.5], [0.5, 0.55, 0.52], [0.66, 0.6, 0.56], [0.45, 0.48, 0.55], [0.6, 0.52, 0.42]];
  V.DECORS.appartement = {
    nom: "Appartement, salon",
    camera: { pos: [0.3, 1.45, 0.45], yaw: 0, pitch: 0.1, fov: 94 },
    zf: 4.6, zn: -0.4, capteur: 1.6,
    porte: [1.55, 4.3],
    prims(r) {
      const PR = [], box = (a, b, m, x) => PR.push(Object.assign({ k: "box", a, b, m }, x || {}));
      const mur = pick(r, PEINTURES); this.mur = mur; this.rideau = pick(r, [[0.45, 0.12, 0.1], [0.55, 0.5, 0.4], [0.12, 0.2, 0.35], [0.3, 0.35, 0.25]]);
      const peint = { f: (p) => ({ c: mul(mur, (0.9 + 0.1 * bruit(p[2] * 2 + p[0], p[1] * 2)) * (p[1] < 0.1 ? 1.25 : 1)) }) };
      box([-2.75, 0, -0.5], [-2.6, 2.6, 4.7], peint); box([2.6, 0, -0.5], [2.75, 2.6, 4.7], peint);
      box([-2.8, 2.6, -0.5], [2.8, 2.7, 4.7], { c: [0.72, 0.71, 0.68] }, { sansOmbre: true });
      // canapé : assise, dossier, accoudoirs, coussins
      const tissu = pick(r, [[0.25, 0.25, 0.28], [0.35, 0.2, 0.12], [0.12, 0.22, 0.3], [0.45, 0.42, 0.36]]);
      const tx = { f: (p) => ({ c: mul(tissu, 0.85 + 0.2 * h2(Math.floor(p[2] * 40), Math.floor(p[1] * 40))), s: 0.05 }) };
      box([-2.58, 0.12, 1.3], [-1.75, 0.45, 3.3], tx); box([-2.6, 0.45, 1.3], [-2.32, 0.98, 3.3], tx);
      box([-2.58, 0.12, 1.12], [-1.72, 0.66, 1.32], tx); box([-2.58, 0.12, 3.28], [-1.72, 0.66, 3.48], tx);
      for (const z of [1.45, 2.35]) box([-2.32, 0.45, z], [-2.1, 0.85, z + 0.8], { f: (p) => ({ c: mul(tissu, 1.15) }) });
      // table basse, tapis (au sol), meuble télé, télévision, étagère de livres
      const bois = { f: (p) => ({ c: mul([0.33, 0.21, 0.12], 0.8 + 0.3 * bruit(p[0] * 30, p[2] * 3)), s: 0.3 }) };
      box([-1.45, 0.38, 1.8], [-0.55, 0.43, 2.8], bois);
      for (const [x, z] of [[-1.4, 1.85], [-0.6, 1.85], [-1.4, 2.75], [-0.6, 2.75]]) box([x - 0.025, 0, z - 0.025], [x + 0.025, 0.38, z + 0.025], bois);
      box([-1.1, 0.43, 2.1], [-0.95, 0.53, 2.2], { c: [0.7, 0.68, 0.62], s: 0.5 }); // une tasse
      box([2.15, 0, 1.6], [2.6, 0.5, 3.2], bois);
      box([2.48, 0.6, 1.75], [2.55, 1.32, 3.05], { c: [0.015, 0.015, 0.02], s: 0.9, e: [0.03, 0.05, 0.09], eNuit: true });
      box([2.4, 1.5, 0.4], [2.6, 1.53, 1.4], bois);
      for (let z = 0.45; z < 1.38; z += 0.05 + h2(Math.floor(z * 100), 3) * 0.04) box([2.42, 1.53, z], [2.58, 1.53 + 0.17 + 0.08 * h2(Math.floor(z * 100), 5), z + 0.035], { c: pick(r, [[0.5, 0.1, 0.08], [0.1, 0.2, 0.4], [0.6, 0.55, 0.4], [0.15, 0.3, 0.15], [0.7, 0.7, 0.65]]) });
      // lampadaire, plafonnier, une plante près de la fenêtre
      PR.push({ k: "cyl", x: -2.2, z: 3.95, r: 0.15, y0: 0, y1: 0.03, m: { c: [0.05, 0.05, 0.05] } });
      PR.push({ k: "cyl", x: -2.2, z: 3.95, r: 0.018, y0: 0, y1: 1.45, m: { c: [0.05, 0.05, 0.05], s: 0.5 } });
      PR.push({ k: "sph", c: [-2.2, 1.6, 3.95], r: 0.17, m: { c: [0.8, 0.75, 0.6], e: [0.9, 0.7, 0.45], eNuit: true }, sansOmbre: true });
      PR.push({ k: "sph", c: [0.2, 2.5, 2.3], r: 0.14, m: { c: [0.85, 0.82, 0.75], e: [1.0, 0.9, 0.7], eNuit: true }, sansOmbre: true });
      PR.push({ k: "cyl", x: 0.05, z: 4.35, r: 0.16, y0: 0, y1: 0.35, m: { c: [0.55, 0.3, 0.2] } });
      for (const [dx, dy, rr] of [[0, 0.65, 0.28], [0.12, 0.9, 0.2], [-0.1, 0.85, 0.18]]) PR.push({ k: "sph", c: [0.05 + dx, dy, 4.3], r: rr, m: { f: (p) => ({ c: mul([0.06, 0.16, 0.05], 0.5 + 0.8 * bruit(p[0] * 12, p[1] * 12)) }) } });
      return PR;
    },
    solY() { return 0; },
    sol(x, z) {
      // tapis devant le canapé
      if (x > -1.85 && x < -0.15 && z > 1.4 && z < 3.2) {
        const bord = x < -1.75 || x > -0.25 || z < 1.5 || z > 3.1;
        const k = 0.85 + 0.15 * h2(Math.floor(x * 60), Math.floor(z * 60));
        return { c: bord ? [0.42 * k, 0.36 * k, 0.28 * k] : mul([0.38, 0.12, 0.1], k * (0.85 + 0.15 * Math.sin((x + z) * 14))) };
      }
      // parquet : lames de 14 cm, joints décalés
      const lame = Math.floor((x + 10) / 0.14), off = h2(lame, 3) * 1.2, pl = Math.floor((z + off) / 1.2);
      const joint = frac((x + 10) / 0.14) < 0.05 || frac((z + off) / 1.2) < 0.008;
      const k = (0.75 + 0.35 * h2(lame, pl)) * (0.9 + 0.12 * bruit(x * 40, z * 3)) * (joint ? 0.55 : 1);
      return { c: [0.36 * k, 0.23 * k, 0.13 * k], s: 0.35 };
    },
    facade(x, y, nuit) {
      const mur = this.mur || PEINTURES[0];
      if (y < 0.1) return { c: [0.72, 0.71, 0.68] }; // plinthe
      // fenêtre, rideaux
      if (x > -1.7 && x < -0.3 && y > 0.9 && y < 2.2) {
        const cadre = x < -1.64 || x > -0.36 || y < 0.96 || y > 2.14 || Math.abs(x + 1.0) < 0.03 || Math.abs(y - 1.75) < 0.025;
        if (cadre) return { c: [0.75, 0.74, 0.7], s: 0.3 };
        if (nuit) { const lum = h2(Math.floor(x * 9), Math.floor(y * 7)) > 0.82 && y < 1.7; return { c: [0.01, 0.015, 0.03], e: lum ? [0.5, 0.38, 0.2] : [0.01, 0.015, 0.035], s: 0.9 }; }
        return { c: [0.3, 0.35, 0.4], e: mul([0.55, 0.62, 0.7], 0.8 + 0.3 * (y - 0.9)), s: 0.9 };
      }
      if ((x > -2.15 && x <= -1.7) || (x >= -0.3 && x < 0.15)) if (y > 0.3 && y < 2.4) { const R = this.rideau || [0.45, 0.12, 0.1]; return { c: mul(R, 0.7 + 0.3 * Math.sin(x * 55)) }; }
      if (y > 2.38 && y < 2.42 && x > -2.25 && x < 0.25) return { c: [0.1, 0.1, 0.1], s: 0.5 }; // tringle
      // porte d'entrée
      if (x > 1.1 && x < 2.0 && y < 2.05) {
        const cadre = x < 1.16 || x > 1.94 || y > 1.99;
        const panneau = Math.abs(x - 1.55) < 0.32 && ((y > 1.15 && y < 1.85) || (y > 0.25 && y < 0.95));
        if (Math.abs(x - 1.88) < 0.03 && Math.abs(y - 1.0) < 0.02) return { c: [0.5, 0.45, 0.3], s: 0.8 };
        return { c: mul([0.55, 0.5, 0.45], cadre ? 0.85 : panneau ? 0.93 : 1), s: 0.2 };
      }
      // un cadre
      if (x > 0.35 && x < 0.95 && y > 1.3 && y < 1.75) { const bordure = x < 0.39 || x > 0.91 || y < 1.34 || y > 1.71; return { c: bordure ? [0.08, 0.06, 0.05] : mul([0.3, 0.4, 0.45], 0.6 + 0.6 * bruit(x * 8, y * 8)) }; }
      return { c: mul(mur, 0.92 + 0.08 * bruit(x * 2, y * 2)) };
    },
    facadeN(x, y) { return { c: mul(this.mur || PEINTURES[0], 0.9) }; },
    ambiance(mode) { return mode === "jour" ? { amb: [0.13, 0.13, 0.14], sun: null } : { amb: [0.025, 0.023, 0.022], sun: null }; },
    lumieres(mode) {
      if (mode === "jour") return [{ p: [-1.0, 1.6, 4.3], c: [1.5, 1.6, 1.7], r: 3.4 }, { p: [0.2, 2.2, 1.0], c: [0.3, 0.3, 0.3], r: 3 }];
      return [{ p: [0.2, 2.35, 2.3], c: [1.4, 1.2, 0.85], r: 3.0 }, { p: [-2.2, 1.55, 3.95], c: [0.9, 0.68, 0.42], r: 1.9 }];
    },
  };

  // ---------------------------------------------------------------- le téléphone tenu à la main
  // L'objectif suit la tête de la personne qui filme, un peu en avant ; il vise le milieu des personnes filmées avec un
  // retard (la main corrige), tremble, se resserre quand la scène s'éloigne. secousses : [{ t0, t1, k }] ; sol : [{ t0,
  // t1 }] (le téléphone part vers le sol). Champ vertical d'environ 62° dans la bande verticale de l'image.
  function main(scn, F, cibles, D, o) {
    const Sst = { D, scn };
    const pose = (A, t) => { const e = etat(A, t, Sst); return e ? squelette(e.pos, e.gy, e.cap, e.pose, A.sc) : null; };
    const vise = (t) => {
      let x = 0, y = 0, z = 0, n = 0;
      for (const A of cibles) { const j = pose(A, t); if (!j) continue; x += j.chest[0]; y += j.chest[1] + 0.15; z += j.chest[2]; n++; }
      return n ? [x / n, y / n, z / n] : null;
    };
    return function camAt(t) {
      const jf = pose(F, Math.max(0, t)) || pose(F, 0);
      const c = add(add(jf.head, mul(jf.fw, 0.3)), [0, -0.12, 0]);
      const a1 = vise(t - 0.45), a2 = vise(t - 0.2);
      const cible = a1 && a2 ? mul(add(a1, a2), 0.5) : a2 || a1 || add(c, add(mul(jf.fw, 3), [0, -0.3, 0]));
      const d = sub(cible, c), h = Math.hypot(d[0], d[2]);
      let yaw = Math.atan2(d[0], d[2]), pitch = -Math.atan2(d[1], h);
      // la main : un balancement lent, un tremblement
      yaw += 0.05 * (bruit(t * 1.3, 11) - 0.5) + 0.012 * Math.sin(t * 9.1);
      pitch += 0.04 * (bruit(t * 1.1, 23) - 0.5) + 0.01 * Math.sin(t * 7.3 + 1);
      let y = c[1] + 0.02 * Math.sin(t * 2.1);
      for (const s of o.secousses || []) if (t >= s.t0 && t < s.t1) { const n = (k) => h2(Math.floor(t * 20), k) - 0.5; yaw += s.k * n(3); pitch += s.k * 0.9 * n(5); y += s.k * 0.12 * n(7); }
      for (const s of o.sol || []) if (t >= s.t0 && t < s.t1) { const w = smooth(clamp((t - s.t0) / 0.5, 0, 1)); pitch = lerp(pitch, 1.25, w); y -= 0.9 * w; }
      // le zoom : plus serré quand la scène est loin
      const fov = h > 5 ? lerp(94, 70, clamp((h - 5) / 4, 0, 1)) : 94;
      return { pos: [c[0], y, c[2]], yaw, pitch, fov };
    };
  }

  // la vidéo commence « retard » secondes après le début de la scène : tout est décalé, ce qui précède manque
  function retarder(scn, d) {
    for (const A of scn.acteurs) A.t0 = (A.t0 || 0) - d;
    const c0 = scn.camAt; scn.camAt = (t) => c0(t + d);
    scn.moments = scn.moments.filter((m) => m.t >= d).map((m) => Object.assign({}, m, { t: m.t - d }));
    scn.paroles = scn.paroles.filter((p) => p.t1 > d).map((p) => Object.assign({}, p, { t0: Math.max(0, p.t0 - d), t1: p.t1 - d, coupe: p.t0 < d }));
    scn.tG = Math.max(0.5, scn.tG - d);
    scn.duree = Math.max(6, scn.duree - Math.floor(d));
    scn.retard = d;
  }
  const dire = (L, t, qui, nom, texte, d, x) => { L.push(Object.assign({ t0: t, t1: t + (d || Math.max(1.4, texte.length / 14)), qui, nom, texte }, x || {})); };
  const couvrir = (r, s) => { const m = s.split(" "); if (m.length < 5) return s; const i = 1 + Math.floor(r() * (m.length - 3)); m.splice(i, 2, "[inaudible]"); return m.join(" "); };
  const sansDirection = (txt) => txt.replace(/ par la (droite|gauche)( de l'image)?/g, "").replace(/ et sort du champ\b/g, " et sort du champ");
  const voix = (A) => (A.g === "f" ? "Une femme" : "Un homme");

  // ---------------------------------------------------------------- 1. dans la rue, filmé par un témoin ou la victime
  // o : base ("coups" | "menaces"), baseO (réglages des faits de rue), filmeur ("T" : un témoin | "V" : la victime),
  //     retard (secondes manquées au début), apresPremier (la vidéo commence après le premier coup), propos (menaces)
  V.FAITS.tel_rue = {
    nom: "Vidéo filmée au téléphone, dans la rue", decor: "rue",
    monter(r, o) {
      const base = o.base || "coups", D = V.DECORS[o.decor || "rue"];
      const scn = V.FAITS[base].monter(r, Object.assign({}, o.baseO || {}, { auteur: o.auteur, victime: o.victime }));
      for (const A of scn.acteurs) V.outils.preparer(A, D);
      const A = scn.acteurs.find((a) => a.id === "A"), Vv = scn.acteurs.find((a) => a.id === "V");
      let F = o.filmeur === "V" ? Vv : scn.acteurs.find((a) => a.id === "T");
      if (!F) {
        // un témoin sur le trottoir, à quelques mètres de la scène, qui sort son téléphone
        const Sst = { D, scn }, eA = etat(A, scn.tG, Sst), eV = Vv ? etat(Vv, scn.tG, Sst) : null;
        const cx = eV ? (eA.pos[0] + eV.pos[0]) / 2 : eA.pos[0], cz = eV ? (eA.pos[1] + eV.pos[1]) / 2 : eA.pos[1];
        // de côté (contre la façade, la terrasse) : les deux personnes de profil, l'une à côté de l'autre
        const px = cx + (r() < 0.5 ? -1 : 1) * (0.8 + r() * 1.4), pz = clamp(cz - 2.5 - r() * 0.4, 4.35, 9.0);
        F = { id: "T", role: "temoin", g: r() < 0.5 ? "f" : "m", t0: 0, pos: [px, pz], cap: Math.atan2(cz - pz, cx - px), tenue: tenue(r, {}), peau: pick(r, PEAU), chev: pick(r, CHEV), sc: 1, beats: [{ a: "filme", d: scn.duree + 10, face: Math.atan2(cz - pz, cx - px) }] };
        V.outils.preparer(F, D);
        scn.acteurs.push(F);
      }
      F.cache = true;
      scn.acteurs = scn.acteurs.filter((a) => !/^P\d/.test(a.id)); // les passants du trottoir d'en face gêneraient la visée
      const cibles = scn.acteurs.filter((a) => a !== F && ["A", "V", "A2", "F1", "F2"].includes(a.id));
      // les moments : ceux des faits, sans les repères propres à la caméra fixe ; la personne qui filme n'y est pas
      scn.moments = scn.moments.filter((m) => m.cle !== "filme").map((m) => Object.assign({}, m, { txt: sansDirection(m.txt).replace(new RegExp("«" + F.id + "»", "g"), "la personne qui filme") }));
      // les paroles
      const L = [], tG = scn.tG, nomF = "La personne qui filme";
      if (base === "coups") {
        const prem = (o.baseO || {}).premier === "V" ? "V" : "A";
        if (prem === "A") { dire(L, tG - 2.6, "A", voix(A) + " (l'individu)", pick(r, ["Qu'est-ce que tu regardes, toi ?", "Tu veux quoi, là ?", "Répète un peu ce que t'as dit !"]), 1.8); dire(L, tG - 0.8, "V", voix(Vv) + " (l'autre personne)", pick(r, ["Laisse-moi tranquille.", "J'ai rien dit, moi.", "Calme-toi."]), 1.4); }
        else { dire(L, tG - 2.6, "V", voix(Vv) + " (l'autre personne)", pick(r, ["Dégage, je t'ai dit !", "Barre-toi de là !"]), 1.6); dire(L, tG - 0.8, "A", voix(A) + " (l'individu)", pick(r, ["Calme-toi, calme-toi.", "Oh, doucement !"]), 1.3); }
        if (o.complice) {
          // celui qui filme accompagne l'auteur : il l'encourage, il rit
          dire(L, tG - 1.6, "filmeur", nomF, pick(r, ["Vas-y, vas-y, je filme !", "Attends, je lance la vidéo."]), 1.6);
          dire(L, tG + 0.5, "filmeur", nomF, "[rires]", 1.4);
          dire(L, tG + 2.2, "filmeur", nomF, pick(r, ["Oh, il l'a éteint !", "Ça va tourner partout, ça !"]), 1.8);
        } else {
          dire(L, tG + 0.4, "filmeur", nomF, pick(r, ["Oh ! Oh ! Arrêtez !", "Oh là ! Arrêtez ça !"]), 1.5);
          dire(L, tG + 2.4, "filmeur", nomF, couvrir(r, "Appelez la police, quelqu'un, appelez la police !"), 2.2, { inaudible: true });
        }
      } else {
        const pr = (o.propos && o.propos.length ? o.propos : ["Je vais te retrouver, tu vas voir !", "Tu vas le regretter !"]).slice(0, 2);
        dire(L, tG - 1.2, "filmeur", nomF, "Je vous filme, là. Reculez.", 1.6);
        pr.forEach((p, k) => { const q = k === 1 ? couvrir(r, p) : p; dire(L, tG + 0.6 + k * 2.2, "A", voix(A) + " (l'individu)", q, 2.0, q !== p ? { inaudible: true } : null); });
        dire(L, tG + 5.4, "filmeur", nomF, "Partez ! Laissez-moi tranquille !", 1.8);
      }
      scn.paroles = L.sort((a, b) => a.t0 - b.t0);
      Object.assign(scn, { camAt: main(scn, F, cibles, D, { secousses: [{ t0: tG + 0.1, t1: tG + 1.4, k: 0.18 }] }), style: "telephone", fps: 15, sansSauts: true, distorsion: 0.05, capteur: 1.6, filmeur: F.id });
      // le témoin sort son téléphone une fois l'altercation commencée : le premier coup manque
      if (o.apresPremier) retarder(scn, tG + 0.7);
      else if (o.retard) retarder(scn, o.retard);
      return scn;
    },
  };

  // ---------------------------------------------------------------- 2. chez elle, filmé par la victime
  // o : genre ("violences" | "menaces" | "harcelement"), violence ("aucune" | "pousse" | "gifle"), propos (les mots de
  //     l'affaire), auteur { g, tenue }, victime { g }, retard
  V.FAITS.tel_dispute = {
    nom: "Vidéo filmée au téléphone par la victime, à son domicile", decor: "appartement",
    monter(r, o) {
      const D = V.DECORS.appartement, genre = o.genre || "menaces", vio = o.violence || "aucune";
      const oa = o.auteur || {}, ov = o.victime || {};
      const A = { id: "A", role: "auteur", g: oa.g || "m", t0: 0, pos: D.porte.slice(), cap: -Math.PI / 2, tenue: oa.tenue || tenue(r, { hauts: ["sweat", "blouson", "survet"], couvre: 0.05, capuche: 0, sac: null }), peau: pick(r, PEAU), chev: pick(r, CHEV), sc: (1.66 + r() * 0.2) / 1.75, beats: [] };
      if (A.tenue.tete === "capuche") A.tenue = Object.assign({}, A.tenue, { tete: null });
      const F = { id: "V", role: "victime", g: ov.g || "f", t0: 0, pos: [0.3, 0.55], cap: Math.PI / 2, tenue: tenue(r, { sac: null, couvre: 0 }), peau: pick(r, PEAU), chev: pick(r, CHEV), sc: 0.95, beats: [], cache: true };
      const L = [], moments = [], nomF = "La personne qui filme", nomA = voix(A) + " (l'individu à l'image)";
      const pr = (o.propos && o.propos.length ? o.propos : {
        menaces: ["Je vais te tuer, tu m'entends ? Je vais te tuer !", "Tu vas voir ce qui va t'arriver."],
        harcelement: ["Tu sers à rien. T'as jamais servi à rien.", "Sans moi t'es personne, personne !"],
        violences: ["Tu me cherches, là ? Tu me cherches ?", "Je vais te faire passer l'envie !"],
      }[genre]).slice(0, 2);
      // la scène
      let t = 0;
      A.beats.push({ a: "menace", d: 2.6, face: -Math.PI / 2 });
      dire(L, 0.3, "A", nomA, pick(r, ["Tu fais quoi, là ? Tu me filmes ?", "Pourquoi tu sors ton téléphone ?"]), 1.8);
      dire(L, 2.0, "filmeur", nomF, "Oui, je te filme. Ne t'approche pas.", 1.8);
      moments.push({ t: 0.8, cle: "entree", txt: "«A» se tient près de la porte d'entrée, tourné vers la personne qui filme, et parle fort en pointant le doigt vers elle." });
      t = 2.6;
      A.beats.push({ a: "marche", d: 2.0, to: [0.6, 2.6] });
      F.beats.push({ a: "attend", d: t + 0.6, face: Math.PI / 2 }, { a: "marche", d: 1.6, to: [0.25, 0.2], face: Math.PI / 2 });
      moments.push({ t: t + 1.0, cle: "approche", txt: "«A» s'avance vers la personne qui filme, qui recule." });
      t += 2.0;
      A.beats.push({ a: "menace", d: 4.4, to: [0.5, 2.05], face: -Math.PI / 2 });
      dire(L, t + 0.2, "A", nomA, pr[0], 2.1);
      if (pr[1]) dire(L, t + 2.4, "A", nomA, pr[1], 2.0);
      moments.push({ t: t + 0.8, cle: "geste", txt: "«A», à moins de deux mètres, le bras tendu et l'index pointé, crie en direction de la personne qui filme." });
      const tG = t + 0.8;
      t += 4.4;
      const secousses = [], sol = [];
      let fin;
      if (vio === "aucune") {
        dire(L, t - 0.2, "filmeur", nomF, pick(r, ["Arrête, tu me fais peur.", "Va-t'en. S'il te plaît, va-t'en."]), 1.8);
        A.beats.push({ a: "regarde", d: 1.2, face: Math.PI / 2 }, { a: "marche", d: 2.4, to: D.porte.slice() }, { a: "attend", d: 0.5 });
        A.sort = true;
        moments.push({ t: t + 1.6, cle: "depart", txt: "«A» se détourne et quitte la pièce par la porte d'entrée." });
        dire(L, t + 3.4, "A", nomA, couvrir(r, "Tu vas le regretter, je te le dis, tu vas le regretter."), 2.0, { inaudible: true });
        fin = t + 6.5;
      } else {
        dire(L, t - 0.4, "A", nomA, "Pose ce téléphone !", 1.2);
        A.beats.push({ a: "marche", d: 0.7, to: [0.35, 1.05] }, vio === "pousse" ? { a: "pousse", d: 0.55, face: -Math.PI / 2 } : { a: "frappe", d: 0.45, face: -Math.PI / 2, cible: [0.3, 1.5, 0.45] }, { a: "attend", d: 6, face: -Math.PI / 2 });
        const tv = t + 0.7;
        secousses.push({ t0: tv, t1: tv + 2.6, k: 0.55 }); sol.push({ t0: tv + 0.35, t1: tv + 40 });
        dire(L, tv + 0.3, "filmeur", nomF, pick(r, ["Aïe ! Arrête !", "Lâche-moi ! Arrête !"]), 1.3);
        dire(L, tv + 1.9, "A", nomA, couvrir(r, "Je t'avais dit de poser ce téléphone !"), 1.8, { inaudible: true });
        moments.push({ t: tv + 0.15, cle: "violence", txt: vio === "pousse" ? "«A» pousse la personne qui filme des deux mains : l'image est secouée, puis part vers le sol." : "«A» lève la main vers la personne qui filme : l'image est secouée, puis part vers le sol ; on entend un cri." });
        moments.push({ t: tv + 2.6, cle: "sol", txt: "L'image ne montre plus que le sol ; des voix sont audibles. L'enregistrement s'arrête." });
        fin = tv + 4.2;
      }
      const scn = { acteurs: [A, F], objet: null, objetAt: () => null, moments, duree: Math.ceil(fin), tG, paroles: L.sort((a, b) => a.t0 - b.t0), genre, violence: vio,
        style: "telephone", fps: 15, sansSauts: true, distorsion: 0.05, capteur: 1.6, filmeur: "V" };
      for (const X of scn.acteurs) V.outils.preparer(X, D);
      scn.camAt = main(scn, F, [A], D, { secousses, sol });
      if (o.retard) retarder(scn, o.retard);
      return scn;
    },
  };

  // ---------------------------------------------------------------- pour le procès-verbal
  // la position dans le fichier : « 0 min 12 s »
  TEL.pos = (t) => `${Math.floor(t / 60)} min ${String(Math.floor(t % 60)).padStart(2, "0")} s`;
  TEL.transcription = (S) => S.paroles.map((p) => ({ t: p.t0, pos: TEL.pos(p.t0), qui: p.nom || p.qui, texte: p.texte, inaudible: !!p.inaudible, coupe: !!p.coupe }));
  TEL.FAITS = ["tel_rue", "tel_dispute"];
})();
