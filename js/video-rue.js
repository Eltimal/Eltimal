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
  const { GL, bruit, rng, pick, lerp, clamp, smooth, frac, h2, add, mul, P, tenue, PEAU, CHEV } = V.outils;
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
  // Repère de video.js : x le long du trottoir, y vers le haut, z en s'éloignant de la façade filmée (zn = 4). Trottoir
  // filmé jusqu'à z = 9,5, file de stationnement, chaussée, trottoir d'en face. Immeubles en pierre de taille : boutiques
  // au rez-de-chaussée (vitrine, enseigne, rideau de fer, porte cochère), étages à fenêtres, balcon filant au deuxième.
  const ENSEIGNES = ["BOULANGERIE", "TABAC PRESSE", "PHARMACIE", "OPTIQUE", "PRIMEUR", "LAVERIE", "FLEURS", "BIJOUTERIE", "COIFFURE", "EPICERIE"];
  // un texte de la police 3 × 5, peint sur un plan : (u, v) en mètres depuis le coin bas gauche, h = hauteur des lettres
  function lettre(txt, u, v, h) {
    const p = h / 5, col = Math.floor(u / p), row = 4 - Math.floor(v / p);
    if (u < 0 || v < 0 || row < 0 || row > 4) return false;
    const k = Math.floor(col / 4), c = col % 4; if (c === 3 || k >= txt.length) return false;
    const g = GL[txt[k]] || GL[" "]; return g[row * 3 + c] === "1";
  }
  function rue(variante) {
    const D = {
      nom: { commerce: "Rue commerçante", bar: "Rue, devant un bar", place: "Place" }[variante],
      variante,
      // caméra municipale récente, haute définition (capteur), sur le mât du terre-plein, tournée vers le trottoir
      // filmé et sa façade : +x part vers la GAUCHE de l'image. Assez près pour qu'un visage tourné vers elle se lise.
      camera: { pos: [2.6, 4.9, 13.4], yaw: Math.PI + 0.06, pitch: 0.42, fov: 70 },
      capteur: 2.2, ombresSoleil: true,
      zf: 20, zn: 4.0, bord: 9.5, route: 16.5,
      // cibles des faits : la vitrine (commerce), la terrasse (bar), le banc (place)
      vitrine: { x0: 2.0, x1: 6.2, z: 4.0 },
      boutique(x) {
        if (variante === "commerce" && x > this.vitrine.x0 - 0.5 && x < this.vitrine.x1 + 0.5) return { type: "vitrine", nom: this.enseigne, x0: this.vitrine.x0 - 0.5, x1: this.vitrine.x1 + 0.5 };
        if (variante === "bar" && x > -1.5 && x < 7.5) return { type: "bar", nom: this.enseigneBar, x0: -1.5, x1: 7.5 };
        const i = Math.floor((x + 100) / 5.5), x0 = i * 5.5 - 100, h = h2(i, 5);
        return { type: variante === "place" ? (h < 0.45 ? "porte" : h < 0.75 ? "vitrine" : "rideau") : h < 0.25 ? "porte" : h < 0.7 ? "vitrine" : "rideau", nom: ENSEIGNES[Math.floor(h2(i, 8) * ENSEIGNES.length)], x0, x1: x0 + 5.5, i };
      },
      prims(r) {
        const PR = [];
        this.enseigne = pick(r, ENSEIGNES); this.enseigneBar = pick(r, ["CAFE DE LA GARE", "LE BALTO", "LE SPORTING", "BAR TABAC"]);
        const box = (a, b, m, x) => PR.push(Object.assign({ k: "box", a, b, m }, x || {}));
        const fonte = { c: [0.03, 0.055, 0.04], s: 0.3 };
        // réverbères parisiens : socle, fût vert sombre, crosse, lanterne
        for (const x of [-4.6, 9.4]) {
          PR.push({ k: "cyl", x, z: 9.05, r: 0.13, y0: 0, y1: 0.7, m: fonte });
          PR.push({ k: "cyl", x, z: 9.05, r: 0.07, y0: 0.7, y1: 5.1, m: fonte });
          box([x - 0.04, 5.05, 9.0], [x + 0.04, 5.13, 10.3], fonte);
          box([x - 0.18, 4.75, 10.12], [x + 0.18, 5.05, 10.48], { c: [0.5, 0.48, 0.42], e: [1.6, 1.3, 0.9], eNuit: true }, { sansOmbre: true });
          box([x - 0.22, 5.05, 10.08], [x + 0.22, 5.12, 10.52], fonte);
        }
        // potelets à tête ronde
        for (let x = -7; x < 14; x += 1.6) if ((x < -5.3 || x > -3.8) && Math.abs(x - 9.4) > 0.6) {
          PR.push({ k: "cyl", x, z: 9.25, r: 0.055, y0: 0, y1: 0.7, m: { c: [0.09, 0.06, 0.045], s: 0.2 } });
          PR.push({ k: "sph", c: [x, 0.72, 9.25], r: 0.065, m: { c: [0.09, 0.06, 0.045], s: 0.3 } });
        }
        // corbeille de rue : arceau vert, sac clair
        PR.push({ k: "cyl", x: 7.8, z: 9.0, r: 0.035, y0: 0, y1: 0.95, m: fonte });
        PR.push({ k: "cyl", x: 7.8, z: 8.82, r: 0.2, y0: 0.4, y1: 0.92, m: { c: [0.45, 0.47, 0.45], s: 0.5 } });
        // voitures garées : caisse, vitrage, roues, phares
        const cols = [[0.28, 0.28, 0.3], [0.03, 0.03, 0.035], [0.55, 0.55, 0.56], [0.3, 0.03, 0.03], [0.04, 0.07, 0.17], [0.42, 0.4, 0.33], [0.7, 0.7, 0.68]];
        for (const [x0, l] of [[6.6, 4.3], [-12.5, 4.1], [11.5, 4.4], [-7.2, 4.2]]) {
          const c = pick(r, cols), carr = { c, s: 0.7 }, vitre = { c: [0.015, 0.02, 0.025], s: 0.9 };
          box([x0, 0.32, 9.9], [x0 + l, 0.82, 11.55], carr, { voiture: true });
          box([x0 + 0.15, 0.82, 9.95], [x0 + l - 0.1, 0.9, 11.5], carr);
          box([x0 + 1.0, 0.9, 10.05], [x0 + l - 1.1, 1.38, 11.4], vitre);
          box([x0 + 1.15, 1.36, 10.1], [x0 + l - 1.25, 1.42, 11.35], carr);
          for (const xr of [x0 + 0.75, x0 + l - 0.75]) for (const zr of [9.88, 11.37]) box([xr - 0.32, 0, zr], [xr + 0.32, 0.6, zr + 0.2], { c: [0.015, 0.015, 0.015] });
          box([x0 - 0.02, 0.6, 10.0], [x0 + 0.02, 0.72, 10.35], { c: [0.6, 0.6, 0.55], e: [0.5, 0.45, 0.3], eNuit: true });
          box([x0 + l - 0.02, 0.62, 10.0], [x0 + l + 0.02, 0.74, 10.3], { c: [0.4, 0.03, 0.03], e: [0.35, 0.02, 0.02], eNuit: true });
        }
        if (variante === "commerce") {
          // le store rayé au-dessus de la vitrine
          const v = this.vitrine, sc = pick(r, [[0.42, 0.05, 0.05], [0.05, 0.25, 0.12], [0.08, 0.12, 0.35]]);
          box([v.x0 - 0.2, 2.72, v.z], [v.x1 + 0.2, 2.85, v.z + 1.0], { f: (p) => ({ c: frac(p[0] / 0.35) < 0.5 ? sc : [0.62, 0.6, 0.55], s: 0.1 }) });
          // l'arrêt de bus : un poteau et son panneau
          PR.push({ k: "cyl", x: -2.4, z: 9.0, r: 0.04, y0: 0, y1: 2.6, m: { c: [0.2, 0.22, 0.24] } });
          box([-2.65, 2.2, 8.97], [-2.15, 2.6, 9.03], { c: [0.1, 0.3, 0.45], e: [0.1, 0.3, 0.5], eNuit: true });
        } else if (variante === "bar") {
          // l'enseigne lumineuse en drapeau, la terrasse : tables rondes, chaises, jardinières
          box([0.5, 2.62, 4.0], [5.5, 2.75, 4.5], { c: [0.08, 0.08, 0.08] });
          for (const [x, z] of [[0.2, 5.0], [1.8, 5.1], [3.4, 5.0], [5.0, 5.1]]) {
            PR.push({ k: "cyl", x, z, r: 0.035, y0: 0, y1: 0.72, m: { c: [0.1, 0.1, 0.1], s: 0.4 } });
            PR.push({ k: "cyl", x, z, r: 0.3, y0: 0.72, y1: 0.75, m: { c: [0.55, 0.5, 0.44], s: 0.4 } });
            for (const dx of [-0.5, 0.5]) {
              const cc = { f: (p) => ({ c: frac((p[0] + p[2]) / 0.06) < 0.5 ? [0.35, 0.22, 0.1] : [0.15, 0.09, 0.04] }) };
              box([x + dx - 0.18, 0.42, z - 0.18], [x + dx + 0.18, 0.46, z + 0.18], cc);
              box([x + dx + (dx < 0 ? -0.18 : 0.15), 0.46, z - 0.18], [x + dx + (dx < 0 ? -0.15 : 0.18), 0.9, z + 0.18], cc);
              for (const ex of [-0.15, 0.15]) box([x + dx + ex - 0.015, 0, z - 0.015], [x + dx + ex + 0.015, 0.42, z + 0.015], { c: [0.1, 0.1, 0.1] });
            }
          }
          for (const x of [-1.2, 6.9]) { box([x - 0.35, 0, 4.4], [x + 0.35, 0.5, 4.8], { c: [0.2, 0.2, 0.2] }); PR.push({ k: "sph", c: [x, 0.65, 4.6], r: 0.33, m: { f: (p) => ({ c: mul([0.05, 0.14, 0.04], 0.6 + 0.6 * bruit(p[0] * 14, p[1] * 14 + p[2] * 9)) }) } }); }
        } else {
          // la place : un banc, un arbre dans sa grille, des arceaux à vélos
          const bois = { f: (p) => ({ c: mul([0.32, 0.2, 0.1], 0.8 + 0.3 * bruit(p[0] * 30, p[1] * 3)) }) };
          for (const y of [0.42, 0.47]) box([1.2, y, 5.2], [3.4, y + 0.04, 5.6], bois);
          for (const y of [0.6, 0.75]) box([1.2, y, 5.55], [3.4, y + 0.09, 5.6], bois);
          for (const x of [1.35, 3.25]) box([x - 0.03, 0, 5.25], [x + 0.03, 0.85, 5.6], { c: [0.04, 0.05, 0.04], s: 0.3 });
          PR.push({ k: "cyl", x: -2.2, z: 6.0, r: 0.15, y0: 0, y1: 3.4, m: { f: (p) => ({ c: mul([0.16, 0.12, 0.08], 0.7 + 0.5 * bruit(p[1] * 6, Math.atan2(p[2] - 6, p[0] + 2.2) * 4)) }) } });
          const feuil = { f: (p, n) => ({ c: mul([0.07, 0.15, 0.05], 0.45 + 0.9 * bruit(p[0] * 7 + p[2] * 3, p[1] * 7) * bruit(p[0] * 2.3, p[1] * 2.3 + p[2])), s: 0.1 }) };
          for (const [dx, dy, dz, rr] of [[0, 4.1, 0, 1.3], [-0.8, 3.7, 0.3, 0.95], [0.85, 3.8, -0.2, 1.0], [0.1, 4.8, 0.2, 0.9]]) PR.push({ k: "sph", c: [-2.2 + dx, dy, 6.0 + dz], r: rr, m: feuil });
          for (let x = 5.5; x < 8; x += 0.7) { PR.push({ k: "cyl", x, z: 5.2, r: 0.025, y0: 0, y1: 0.8, m: { c: [0.35, 0.35, 0.36], s: 0.6 } }); PR.push({ k: "cyl", x, z: 5.7, r: 0.025, y0: 0, y1: 0.8, m: { c: [0.35, 0.35, 0.36], s: 0.6 } }); box([x - 0.025, 0.78, 5.2], [x + 0.025, 0.82, 5.7], { c: [0.35, 0.35, 0.36], s: 0.6 }); }
        }
        return PR;
      },
      solY() { return 0; },
      sol(x, z, nuit) {
        const grain = 0.88 + 0.16 * bruit(x * 9, z * 9) + 0.08 * (h2(Math.floor(x * 40), Math.floor(z * 40)) - 0.5);
        // pied de façade et bordure : l'ombre douce des angles
        const ao = 0.62 + 0.38 * smooth((z - this.zn) / 0.7);
        if (z < this.bord - 0.3) {
          if (variante === "place") {
            // pavés de granit en rangs décalés
            const row = Math.floor(z / 0.16), off = (row & 1) * 0.07, cx = Math.floor((x + off) / 0.14);
            const joint = frac((x + off) / 0.14) < 0.12 || frac(z / 0.16) < 0.12;
            const k = (0.75 + 0.35 * h2(cx, row)) * (joint ? 0.55 : 1) * ao * grain;
            return { c: [0.33 * k, 0.31 * k, 0.29 * k], s: 0.15 };
          }
          // trottoir d'asphalte, reprises et taches
          let k = grain * ao;
          if (bruit(x * 0.6 + 3, z * 0.9) > 0.72) k *= 0.88;
          if (h2(Math.floor(x * 2.5), Math.floor(z * 2.5)) > 0.992) k *= 0.6;
          return { c: [0.25 * k, 0.245 * k, 0.24 * k], s: 0.08 };
        }
        if (z < this.bord) { const j = frac(x / 1.0) < 0.02; const k = (0.9 + 0.15 * h2(Math.floor(x), 3)) * (j ? 0.6 : 1); return { c: [0.5 * k, 0.49 * k, 0.47 * k], s: 0.2 }; }
        if (z < this.bord + 0.35) { const j = frac(x / 0.22) < 0.1 || frac((z - this.bord) / 0.175) < 0.12; const k = (0.8 + 0.2 * h2(Math.floor(x / 0.22), 7)) * (j ? 0.6 : 1) * (0.7 + 0.3 * smooth((z - this.bord) / 0.15)); return { c: [0.27 * k, 0.26 * k, 0.25 * k], s: 0.3 }; }
        if (z < this.route) {
          let k = grain * (0.92 + 0.1 * bruit(x * 0.4, z * 0.4));
          const mid = (this.bord + this.route) / 2 + 1;
          // passage piéton, axe discontinu, limite du stationnement
          if (x > -6.5 && x < -2.7 && z > this.bord + 2.2 && frac(x / 0.95) < 0.5) return { c: [0.6 * k, 0.6 * k, 0.57 * k], s: 0.2 };
          if (Math.abs(z - mid) < 0.07 && frac(x / 6) < 0.5) return { c: [0.55 * k, 0.55 * k, 0.5 * k] };
          if (Math.abs(z - (this.bord + 2.15)) < 0.05 && frac(x / 5) > 0.06) return { c: [0.5 * k, 0.5 * k, 0.47 * k] };
          return { c: [0.085 * k, 0.085 * k, 0.09 * k], s: 0.15 };
        }
        if (z < this.route + 0.25) return { c: [0.45, 0.43, 0.4] };
        return { c: [0.25 * grain, 0.245 * grain, 0.24 * grain] };
      },
      // la façade d'en face (vue par la caméra-piéton) : d'autres immeubles du même genre, lus dans l'autre sens
      facade(x, y, nuit) { return this.facadeN(x + 41.3, y, nuit, true); },
      // la façade du trottoir filmé, vue de face
      facadeN(x, y, nuit, endroit) {
        const ib = Math.floor((x + 100) / 7.2), hb = h2(ib, 21);
        const pierre = [0.5 + 0.06 * hb, 0.45 + 0.04 * hb, 0.37 + 0.02 * (1 - hb)];
        // pierre de taille : assises de 42 cm, joints décalés, chaque bloc a sa teinte, salissures en bas
        const appareil = (k0) => {
          const row = Math.floor(y / 0.42), off = (row & 1) * 0.55, bx = Math.floor((x + off + 100) / 1.1);
          const joint = frac((x + off + 100) / 1.1) < 0.018 || frac(y / 0.42) < 0.04;
          const k = (0.9 + 0.12 * h2(bx, row)) * (joint ? 0.78 : 1) * (0.86 + 0.14 * bruit(x * 1.3, y * 0.4)) * (k0 || 1) * (1 - 0.18 * (1 - smooth(y / 1.2)));
          return { c: mul(pierre, k) };
        };
        if (y < 0.32) return { c: mul([0.3, 0.29, 0.28], 0.85 + 0.2 * bruit(x * 3, y * 9)) }; // soubassement
        if (y < 3.4) {
          const B = this.boutique(x), u = x - B.x0, w = B.x1 - B.x0;
          if (u < 0.45 || u > w - 0.45) return appareil(); // trumeaux de pierre
          if (B.type === "porte") {
            // porte cochère : deux vantaux de bois à panneaux
            if (y > 3.0) return appareil(0.95);
            const du = u - 0.45, dw = w - 0.9, pu = frac(du / (dw / 2)), pv = y / 3.0;
            const cadre = pu < 0.08 || pu > 0.92 || frac(pv * 3) < 0.07 || Math.abs(du - dw / 2) < 0.04;
            const bc = h2(B.i, 3) > 0.5 ? [0.05, 0.11, 0.07] : [0.16, 0.08, 0.04];
            return { c: mul(bc, cadre ? 1.25 : 0.85 + 0.1 * bruit(x * 20, y * 2)), s: 0.3 };
          }
          // bandeau d'enseigne
          if (y > 2.7) {
            if (y > 3.25) return appareil(0.9);
            if (B.type === "rideau" && h2(B.i, 11) < 0.5) return appareil(0.9);
            const fond = B.type === "bar" ? [0.08, 0.06, 0.04] : [[0.32, 0.05, 0.05], [0.04, 0.14, 0.07], [0.05, 0.06, 0.12], [0.06, 0.06, 0.06]][Math.floor(h2(B.i || 1, 13) * 4)];
            const txt = B.nom, hL = 0.3, lw = (txt.length * 4 - 1) * (hL / 5), u0 = (w - lw) / 2;
            if (lettre(txt, (endroit ? u : w - u) - u0, y - 2.82, hL)) // +x part vers la gauche de l'image : on lit depuis x1 return { c: [0.75, 0.68, 0.45], e: nuit ? (B.type === "bar" ? [1.6, 0.6, 0.3] : [0.8, 0.75, 0.55]) : null, s: 0.4 };
            return { c: fond, s: 0.3 };
          }
          if (B.type === "rideau") {
            // rideau de fer baissé, lames horizontales, un tag
            const k = 0.78 + 0.22 * frac(y / 0.09) - (frac(y / 0.09) < 0.15 ? 0.25 : 0);
            const tag = h2(B.i, 17) > 0.4 && bruit(x * 1.8 + B.i, y * 2.2) > 0.68 && y > 0.6 && y < 2.2;
            return { c: tag ? [[0.5, 0.06, 0.25], [0.05, 0.25, 0.5], [0.55, 0.45, 0.05]][Math.floor(h2(B.i, 19) * 3)] : mul([0.36, 0.37, 0.38], k), s: 0.3 };
          }
          // vitrine : montants métalliques, porte, intérieur éclairé (rayonnages) ou reflet de la rue le jour
          if (y < 0.5) return { c: [0.06, 0.06, 0.065], s: 0.5 };
          const pv = frac((u - 0.45) / 1.4);
          if (pv < 0.03 || y > 2.62 || Math.abs(y - 2.2) < 0.03) return { c: [0.05, 0.05, 0.055], s: 0.6 };
          const ouvert = B.type === "bar" || B.type === "vitrine" && (B.nom === this.enseigne || h2(B.i, 23) > 0.3);
          const ry = y - 0.5, etag = frac(ry / 0.45) < 0.08, prod = h2(Math.floor((x + 100) / 0.18), Math.floor(ry / 0.45));
          let interieur;
          if (B.type === "bar") {
            const comptoir = y < 1.1, bout = y > 1.5 && y < 2.0 && frac(x / 0.12) < 0.5;
            interieur = comptoir ? [0.25, 0.14, 0.06] : bout ? [[0.2, 0.35, 0.1], [0.5, 0.3, 0.05], [0.4, 0.4, 0.38]][Math.floor(prod * 3)] : [0.55, 0.38, 0.2];
          } else {
            // rayonnages vus à travers la vitre : produits serrés, couleurs passées, fond plus sombre
            const pr = h2(Math.floor((x + 100) / 0.07), Math.floor(ry / 0.45) * 7 + Math.floor(frac(ry / 0.45) * 4)), plein = frac(ry / 0.45) > 0.18 && frac(ry / 0.45) < 0.75;
            interieur = etag ? [0.55, 0.53, 0.5] : y > 2.25 ? [0.62, 0.6, 0.55] : plein ? mul([[0.5, 0.25, 0.18], [0.3, 0.35, 0.45], [0.55, 0.48, 0.3], [0.35, 0.42, 0.3], [0.6, 0.58, 0.55]][Math.floor(pr * 5)], 0.55 + 0.45 * h2(Math.floor((x + 100) / 0.07), 3)) : [0.3, 0.28, 0.26];
          }
          const reflet = 0.3 + 0.5 * smooth((y - 0.5) / 2.2) + 0.12 * bruit(x * 0.8, y * 0.5);
          if (nuit) return ouvert ? { c: [0.02, 0.02, 0.02], e: mul(interieur, B.type === "bar" ? 0.9 : 0.75), s: 0.9 } : { c: [0.02, 0.025, 0.03], s: 0.9 };
          return { c: ouvert ? add(mul(interieur, 0.14), mul([0.16, 0.18, 0.21], reflet)) : mul([0.14, 0.16, 0.19], reflet), s: 0.9 };
        }
        // corniche du premier étage
        if (y < 3.75) return appareil(frac(x / 0.22) < 0.5 && y > 3.62 ? 0.72 : 1.08);
        const fy = y - 3.75, fl = Math.floor(fy / 3.0), vy = fy - fl * 3.0;
        if (fl >= 5) return { c: mul([0.2, 0.22, 0.25], 0.85 + 0.15 * frac(x / 0.5)), s: 0.5 }; // toit de zinc
        if (vy > 2.86) return appareil(1.1); // bandeau d'étage
        const wx = frac((x + 100) / 3.6) * 3.6 - 1.8, aw = Math.abs(wx), col = Math.floor((x + 100) / 3.6);
        // balcon filant au deuxième étage, balconnets ailleurs
        const balcon = fl === 1 || (aw < 0.75 && h2(ib, 31) > 0.5);
        if (balcon && vy > 0.15 && vy < 1.1 && (fl === 1 || aw < 0.75)) {
          const barre = frac(x / 0.11) < 0.22 || Math.abs(vy - 1.06) < 0.04 || Math.abs(vy - 0.2) < 0.04 || (Math.abs(vy - 0.62) < 0.13 && Math.abs(frac(x / 0.33) - 0.5) < 0.18);
          if (barre) return { c: [0.025, 0.025, 0.028], s: 0.4 };
        }
        if (aw < 0.6 && vy > 0.15 && vy < 2.5) {
          // fenêtre : croisée blanche, rideaux, lumière la nuit, reflet du ciel le jour
          if (aw < 0.03 || Math.abs(vy - 1.85) < 0.03 || aw > 0.55 || vy > 2.45) return { c: [0.62, 0.61, 0.58], s: 0.3 };
          const allume = nuit && h2(col, fl + 11) > 0.55, rideau = aw > 0.32 && h2(col, fl + 3) > 0.35;
          if (rideau) { const pli = 0.75 + 0.25 * Math.sin(x * 60); const rc = [[0.6, 0.55, 0.45], [0.5, 0.2, 0.15], [0.55, 0.55, 0.55]][Math.floor(h2(col, fl + 7) * 3)]; return { c: mul(rc, pli * (nuit ? 0.15 : 0.5)), e: allume ? mul(rc, 0.5 * pli) : null }; }
          if (allume) return { c: [0.02, 0.02, 0.02], e: [0.75, 0.55, 0.3], s: 0.8 };
          return { c: mul([0.1, 0.12, 0.15], 0.6 + 0.8 * (vy / 2.5) + 0.2 * bruit(x, y)), s: 0.9 };
        }
        // encadrement mouluré, appui saillant, persiennes repliées
        if (aw < 0.75 && vy > 0.0 && vy < 2.65) return appareil(vy < 0.15 ? 1.2 : 1.1);
        if (aw < 1.25 && vy > 0.15 && vy < 2.5 && h2(ib, 41) > 0.55) return { c: mul([0.3, 0.33, 0.29], frac(vy / 0.07) < 0.3 ? 0.7 : 1), s: 0.2 };
        return appareil(vy < 0.0 + 0.4 && aw < 0.9 ? 0.9 : 1);
      },
      lumieres(mode) {
        const L = [];
        if (mode === "jour") return L;
        L.push({ p: [-4.6, 4.7, 10.3], c: [3.4, 2.4, 1.3], r: 2.8 });
        L.push({ p: [9.4, 4.7, 10.3], c: [3.4, 2.4, 1.3], r: 2.8 });
        if (variante === "commerce") L.push({ p: [4.1, 1.6, 4.4], c: [1.0, 0.9, 0.7], r: 2.6 });
        if (variante === "bar") { L.push({ p: [3, 1.8, 4.4], c: [1.7, 1.05, 0.5], r: 3.4 }); L.push({ p: [3, 2.9, 4.6], c: [0.9, 0.35, 0.2], r: 1.6 }); }
        for (let x = -14; x < 18; x += 5.5) { const B = this.boutique(x + 2.7); if (B.type === "vitrine" && x + 2.7 > -1e9 && h2(B.i || 0, 23) > 0.3) L.push({ p: [x + 2.7, 1.5, 4.5], c: [0.45, 0.4, 0.32], r: 2.2 }); }
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
      const Vv = acteur(r, "V", "victime", { g: ov.g || "m", agee: ov.agee, tenue: ov.tenue, pos: [xV - 6, zV], cap: 0 });
      const Aa = acteur(r, "A", "auteur", { g: oa.g || "m", tenue: oa.tenue, pos: [xA + 7, zA], cap: Math.PI, tenueO: { capuche: 0.4, hauts: ["sweat", "blouson", "doudoune", "survet"] } });
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
      const A = acteur(r, "A", "auteur", { g: (o.auteur || {}).g || "m", tenue: (o.auteur || {}).tenue, pos: [12, 7.4], cap: Math.PI, tenueO: { capuche: 0.6, hauts: ["sweat", "blouson", "survet"] } });
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
      const A = acteur(r, "A", "auteur", { g: (o.auteur || {}).g || "m", tenue: (o.auteur || {}).tenue, pos: [12, zV + 0.2], cap: Math.PI, tenueO: { capuche: 0.5 } });
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
      const W = acteur(r, "A", "auteur", { g: (o.auteur || {}).g || "m", tenue: (o.auteur || {}).tenue, pos: [4.4, 7.0], cap: Math.PI * 0.9, tenueO: { capuche: 0.5, hauts: ["sweat", "doudoune", "survet"], sac: "sacoche" } });
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
      const A = acteur(r, "A", "auteur", { g: (o.auteur || {}).g || "m", tenue: (o.auteur || {}).tenue, pos: [11, zV + 0.2], cap: Math.PI });
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
