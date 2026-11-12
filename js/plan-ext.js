/* La Permanence — les extérieurs (refonte) : CR.plans.<lieu> pour les quinze lieux de la carte.
   Direction : vu du trottoir d'en face, le bâtiment occupe le cadre ; relief partout (corniches, colonnes, fenêtres
   en retrait) pour que la lumière accroche ; vraies sources (réverbères, enseignes, vitrines, phares) ; chaussée
   qui reflète ; pluie, passants, voitures. Six familles de bâtiments, déclinées par lieu (LIEUX en bas du fichier).
   360 × 225 ; pied des façades rangée 118, chaussée à partir de 126 ; l'interface couvre le haut (0 à 18),
   la gauche (0 à 46) et le bas (146 et plus). Le décor fixe est refait quand l'heure (par tranches de dix minutes),
   la pluie ou la saison changent. o : min, rain, season, nom, plaque, reduce. */
(function () {
  const CR = window.CR, G = CR.gpu, PL = CR.lum, K = CR.planKit;
  const PLANS = (CR.plans = CR.plans || {});
  const H = 225, REF = 360, SW = 118, RD = 126, FAC = 180, h01 = PL.h01, mix = PL.mix, rgb = PL.rgb;
  // inscriptions : capitales accentuées conservées (l'accent est posé au-dessus de la lettre de la petite police)
  const norm = (s) => String(s || "").toUpperCase().replace(/[^A-ZÀ-ÖØ-Ý0-9 .'-]/g, "");
  const lighter = (c, k) => mix(typeof c === "string" ? rgb(c) : c, [255, 255, 255], k), darker = (c, k) => mix(typeof c === "string" ? rgb(c) : c, [0, 0, 0], k);
  const MARK = { "\u0301": [[1, -2], [2, -3]], "\u0300": [[1, -2], [0, -3]], "\u0302": [[0, -2], [1, -3], [2, -2]], "\u0308": [[0, -2], [2, -2]], "\u0327": [[1, 6]] };
  function txt2(m, s, x, y, col) {
    const tmp = new G.Mat(s.length * 4 + 2, 5); tmp.txt(s, 0, 0, [255, 255, 255]);
    for (let j = 0; j < 5; j++) for (let i = 0; i < tmp.W; i++) if (tmp.c[(j * tmp.W + i) * 4]) m.r(x + i * 2, y + j * 2, 2, 2, col);
  }
  // k = 1 (petite police) ou 2 (agrandie deux fois)
  function ecrire(m, s, x, y, col, k) {
    let cx = x;
    for (const ch of s) { const d = ch.normalize("NFD"); if (k === 2) txt2(m, d[0], cx, y, col); else m.txt(d[0], cx, y, col); for (const mk of d.slice(1)) for (const [a, b] of MARK[mk] || []) m.r(cx + a * k, y + b * k, k, k, col); cx += 4 * k; }
  }
  // plaque ou enseigne : fond, texte ; lit = lumineuse ; renvoie sa boîte
  function plaque(m, s, cx, y, fg, bg, lit, grand) {
    s = norm(s); const k = grand ? 2 : 1, acc = /[À-Ý]/.test(s) ? 3 * k : 0, w = [...s].length * 4 * k + (grand ? 6 : 7), x = Math.round(cx - w / 2), h = (grand ? 16 : 9) + acc;
    m.set({ E: lit ? 150 : 0, n: [0, 0], S: 40 }); m.r(x, y - acc, w, h, bg); m.set({ E: lit ? 255 : 30 });
    ecrire(m, s, x + 4, y + (grand ? 3 : 2), fg, k);
    m.set({ E: 0 });
    return { x, w, h };
  }

  // ------------------------------------------------------------ ciel, lointain
  function ciel(m, W, c, seed) {
    const X0 = -m.ox;
    for (let y = 0; y < SW; y++) { m.set({ E: Math.round(c.skyE * 0.92), n: [0, 0], S: 0, D: 255 }); m.hl(X0, y, W, mix(c.top, c.bot, Math.pow(y / SW, 1.3))); }
    if (c.sun0 < 0.25 && !c.rain) { m.set({ E: 255 }); for (let i = 0; i < 60; i++) m.px(X0 + Math.floor(h01(i * 7.7 + seed) * W), Math.floor(h01(i * 3.3 + seed) * 70), [230, 236, 255], 0.3 + h01(i) * 0.6); m.orb(X0 + W * 0.78, 30, 6, 6, "#f4f1e0", 0.3); }
    if (!c.rain) for (let i = 0; i < 5; i++) { const cx = X0 + h01(i * 5.1 + seed) * W, cy = 22 + h01(i * 2.7 + seed) * 40; m.set({ E: Math.round(c.skyE) }); m.ell(cx, cy, 18 + h01(i) * 16, 3, mix(c.bot, [255, 255, 255], 0.5), 0.35); m.ell(cx + 8, cy + 3, 12, 2, mix(c.bot, [255, 255, 255], 0.5), 0.25); }
    // toits lointains dans la brume
    const far = mix(c.bot, [30, 36, 54], 0.55); let x = X0;
    while (x < X0 + W) { const w = 10 + Math.floor(h01(x * 1.3 + seed) * 16), top = 74 + Math.floor(h01(x * 2.9 + seed) * 22); m.set({ E: Math.round(c.skyE * 0.55) }); m.r(x, top, w, SW - top, far); if (c.sun0 < 0.5) for (let k = 0; k < 3; k++) if (h01(x + k * 4.3 + seed) < 0.35) { m.set({ E: 200 }); m.px(x + 2 + k * 3, top + 5 + k * 4, "#ffd98a"); } x += w; }
    m.set({ E: 0 });
  }

  // ------------------------------------------------------------ immeuble haussmannien (flancs, rues)
  const BOUT = [["#a8323a", "#f2e6c8"], ["#2f5f4a", "#f2e6c8"], ["#27407a", "#f4f0e0"], ["#7a4a2a", "#f2e6c8"], ["#3a3f48", "#e8c66a"]];
  function haussmann(m, x0, w, top, c, seed, o) {
    o = o || {}; const stone = o.stone || "#cbbd9f", sd = darker(stone, 0.2), sl = lighter(stone, 0.2), nuit = 1 - c.sun0;
    m.set({ E: 0, n: [0, 0], S: 0, D: FAC });
    m.r(x0, top + 11, w, SW - top - 11, stone); m.noise(x0, top + 11, w, SW - top - 11, sd, 0.1, seed);
    // comble d'ardoise et de zinc, lucarnes, souches
    for (let y = top; y < top + 11; y++) { m.set({ n: [0, -0.55] }); m.hl(x0 + (top + 4 - y > 0 ? top + 4 - y : 0), y, w - 2 * (top + 4 - y > 0 ? top + 4 - y : 0), y < top + 2 ? "#7d8796" : "#56606e"); }
    m.set({ n: [0, 0] }); for (let x = x0 + 8; x < x0 + w - 8; x += 15) { m.r(x, top + 3, 5, 7, "#6d7786"); m.r(x + 1, top + 5, 3, 4, h01(x + seed) < 0.3 * nuit ? "#ffd98a" : "#232a36"); }
    for (let x = x0 + 4; x < x0 + w - 6; x += 31) { m.r(x, top - 5, 5, 7, "#8a5a48"); m.hl(x, top - 5, 5, "#a8735e"); m.px(x + 1, top - 7, "#3a2a24"); m.px(x + 3, top - 7, "#3a2a24"); }
    m.set({ n: [0, -0.7] }); m.hl(x0, top + 11, w, sl); m.set({ n: [0, 0] }); m.hl(x0, top + 12, w, sd);
    // étages : fenêtres en retrait, garde-corps, bandeaux
    const rez = SW - 24, nf = Math.max(1, Math.floor((rez - top - 14) / 17));
    for (let f = 0; f < nf; f++) {
      const y = top + 15 + f * 17;
      for (let x = x0 + 5; x < x0 + w - 8; x += 12) {
        const allume = h01(x * 1.7 + f * 9.1 + seed) < (c.sun0 < 0.5 ? (c.hr > 17 && c.hr < 23.5 ? 0.42 : 0.1) : 0);
        m.set({ S: 0, E: 0 }); m.r(x - 1, y - 1, 8, 13, sd); m.hl(x - 1, y - 2, 8, sl);
        m.set({ E: allume ? 215 : 0, S: allume ? 0 : 210 }); m.r(x, y, 6, 11, allume ? (h01(x + f) < 0.3 ? "#cfe0ff" : "#ffd98a") : "#27303d");
        m.set({ E: allume ? 120 : 0, S: 0 }); m.vl(x + 3, y, 11, allume ? "#a8864a" : "#3a4452"); m.hl(x, y + 4, 6, allume ? "#a8864a" : "#3a4452");
        if (allume && h01(x * 3.1 + f) < 0.4) { m.set({ E: 60 }); m.r(x, y + 5, 3, 6, "#3a2a24"); }
        m.set({ E: 0, S: 60 }); if (f === 1 || f === nf - 1) { m.hl(x - 2, y + 9, 10, "#1d2026"); for (let q = 0; q < 5; q++) m.px(x - 1 + q * 2, y + 10, "#1d2026"); }
      }
      m.set({ S: 0, n: [0, -0.7] }); m.hl(x0, y + 13, w, sl); m.set({ n: [0, 0] }); m.hl(x0, y + 14, w, sd);
    }
    // rez-de-chaussée : boutiques (store, vitrine éclairée le soir) ou porte cochère
    let x = x0 + 2, k = 0;
    m.set({ S: 0 }); m.r(x0, rez, w, 24, darker(stone, 0.12));
    while (x < x0 + w - 12) {
      const bw = Math.min(x0 + w - 2 - x, 26 + Math.floor(h01(x + seed * 3) * 18)), B = BOUT[Math.floor(h01(x * 2.3 + seed) * BOUT.length)], porte = h01(x * 5.7 + seed) < 0.22, ouv = c.hr > 7.5 && c.hr < 21.5 && !porte;
      if (porte) { m.set({ E: 0, S: 60 }); m.r(x + bw / 2 - 6, rez + 3, 12, 21, "#2c3a34"); m.orb(x + bw / 2, rez + 4, 6, 3, "#2c3a34", 0.3); m.vl(Math.round(x + bw / 2), rez + 3, 21, "#1c2622"); m.set({ S: 160 }); m.px(Math.round(x + bw / 2) - 2, rez + 14, "#c9a24a"); }
      else {
        m.set({ E: ouv && c.sun0 < 0.7 ? 125 : 0, S: ouv ? 0 : 200 }); m.r(x + 1, rez + 7, bw - 2, 14, ouv && c.sun0 < 0.7 ? "#f0c88a" : ouv ? "#56616e" : "#1f252e");
        if (ouv) { m.set({ E: c.sun0 < 0.7 ? 70 : 0 }); for (let q = x + 3; q < x + bw - 4; q += 5) m.r(q, rez + 13 + Math.floor(h01(q) * 3), 3, 5, [B[0], "#c9a24a", "#6b8f5a", "#d9cfb4"][Math.floor(h01(q * 3.3) * 4)]); }
        m.set({ E: 0, S: 0, n: [0, -0.5] }); for (let j = 0; j < 5; j++) m.hl(x - (j > 2 ? 1 : 0), rez + 2 + j, bw + (j > 2 ? 2 : 0), j === 4 ? darker(B[0], 0.3) : (Math.floor((x + j) / 3) % 2 && j > 1 ? B[1] : B[0]));
        m.set({ n: [0, 0] }); m.r(x + 1, rez + 21, bw - 2, 3, darker(stone, 0.3));
        if (o.enseigne && k === o.enseigneK) { const t = [...norm(o.enseigne)].slice(0, Math.floor((bw - 4) / 4)).join(""); m.set({ E: 0, S: 0 }); m.r(x, rez - 5, bw, 11, "#23262e"); m.set({ E: 150 }); ecrire(m, t, Math.round(x + bw / 2 - [...t].length * 2), rez - 1, "#e8c66a", 1); m.set({ E: 0 }); }
      }
      x += bw + 2; k++;
    }
  }
  // lumières des vitrines d'un flanc (une par tranche de 60 pixels, le soir)
  function lueurs(L, OX, x0, w, c) { if (c.sun0 < 0.7 && c.hr > 7.5 && c.hr < 21.5) for (let x = x0 + 20; x < x0 + w; x += 60) L.push({ x: OX + x, y: SW - 8, d: FAC - 14, r: 54, c: [1, 0.82, 0.55], i: 0.9 * (1 - c.sun0), wrap: 0.6 }); }

  // ------------------------------------------------------------ la rue : trottoir, chaussée, réverbères, arbres
  function rue(m, W, c, o) {
    const X0 = -m.ox, wet = c.rain ? 1 : 0;
    for (let y = SW; y < RD; y++) { m.set({ E: 0, n: [0, -1], S: wet ? 130 : 30, D: FAC - 2 - (y - SW) * 2 }); for (let x = X0; x < X0 + W; x++) m.px(x, y, y === RD - 1 ? "#b9b6ae" : (x + (y - SW) * 5) % 13 === 0 || y === SW ? "#6f6e6a" : PL.h2(x, y) < 0.15 ? "#807f7a" : "#8a8984"); }
    if (o.eau) { // le quai et la rivière à la place de la chaussée
      for (let y = RD; y < RD + 9; y++) { m.set({ E: 0, n: [0, 0], S: 20, D: FAC - 20 }); for (let x = X0; x < X0 + W; x++) m.px(x, y, y === RD ? "#c9c2ae" : (x + (y % 6 < 3 ? 0 : 8)) % 16 === 0 || y % 3 === 0 ? "#7d7666" : "#958d7a"); }
      for (let x = X0 + 12; x < X0 + W; x += 46) { m.set({ S: 140 }); m.r(x, RD + 4, 3, 3, "#2a2d31"); }
      const eau = mix([14, 30, 38], mix(c.bot, [40, 70, 80], 0.6), 0.25 + c.sun0 * 0.45);
      for (let y = RD + 9; y < H; y++) { const k = (y - RD) / (H - RD); m.set({ E: Math.round(c.sun0 * 30), n: [0, -1], S: 245, D: Math.round((FAC - 24) * (1 - k)) }); for (let x = X0; x < X0 + W; x++) m.px(x, y, PL.h2(x >> 2, y) < 0.2 ? lighter(eau, 0.07) : eau); }
      m.set({ E: 0, n: [0, 0] });
      return;
    }
    for (let y = RD; y < H; y++) {
      const k = (y - RD) / (H - RD);
      m.set({ n: [0, -1], S: wet ? 215 : 70, D: Math.round((FAC - 20) * (1 - k)) });
      for (let x = X0; x < X0 + W; x++) { const r = PL.h2(x, y); m.px(x, y, r < 0.12 ? "#2f3338" : r > 0.9 ? "#4a4f56" : "#3b4046"); }
    }
    m.set({ S: wet ? 215 : 60 }); m.hl(X0, RD, W, "#26292e");
    // passage piéton devant l'entrée, ligne discontinue
    if (o.zebra !== false) for (let i = 0; i < 7; i++) { const x = 150 + i * 10; for (let y = RD + 3; y < RD + 30; y++) { const sh = Math.round((y - RD) * (i - 3) * 0.12); m.set({ D: Math.round((FAC - 20) * (1 - (y - RD) / (H - RD))) }); m.r(x + sh, y, 5 + Math.round((y - RD) * 0.06), 1, PL.h2(x, y) < 0.15 ? "#8f918f" : "#c9c9c2"); } }
    for (let x = X0 + 6; x < X0 + W; x += 34) if (x < 140 || x > 232) { m.set({ D: 60 }); m.r(x, RD + 40, 18, 2, "#b9b9b2"); }
    // potelets
    m.set({ n: [0.3, 0], S: 90, D: FAC - 16 }); for (let x = X0 + 10; x < X0 + W; x += 22) if (o.zebra === false || x < 144 || x > 226) { m.r(x, RD - 9, 2, 8, "#2a2d31"); m.px(x, RD - 10, "#c9c9c2"); }
    m.set({ n: [0, 0] });
  }
  function reverbere(m, x, c, L, OX) {
    const on = c.sun0 < 0.75;
    m.set({ E: 0, n: [0.4, 0], S: 120, D: FAC - 12 }); m.r(x, 54, 2, RD - 56, "#1f2a26"); m.r(x - 1, RD - 8, 4, 6, "#1f2a26"); m.set({ n: [0, 0] }); m.r(x - 4, 52, 10, 2, "#1f2a26"); m.r(x - 5, 46, 4, 6, "#2a3832"); m.r(x + 3, 46, 4, 6, "#2a3832");
    m.set({ E: on ? 255 : 30, S: 0 }); m.r(x - 4, 47, 2, 4, on ? "#fff0c0" : "#c9c6b6"); m.r(x + 4, 47, 2, 4, on ? "#fff0c0" : "#c9c6b6"); m.set({ E: 0 });
    if (on) L.push({ x: OX + x + 1, y: 52, d: FAC - 26, r: 120, c: [1, 0.8, 0.5], i: 2.1 * (1 - c.sun0 * 0.8), wrap: 0.5, haze: 0.2 * (1 - c.sun0), hr: 30 });
  }
  function arbre(m, x, c, season, seed) {
    const aut = season === "automne" || season == null, hiv = season === "hiver";
    m.set({ E: 0, n: [0.4, 0], S: 0, D: FAC - 10 }); m.r(x, 76, 3, RD - 78, "#3a2e26"); m.line(x + 1, 80, x - 7, 66, "#3a2e26"); m.line(x + 1, 78, x + 8, 62, "#3a2e26"); m.line(x + 1, 74, x + 1, 56, "#3a2e26");
    if (!hiv) for (let i = 0; i < 9; i++) { const cx = x + 1 + (h01(i * 3.1 + seed) - 0.5) * 30, cy = 62 + (h01(i * 7.3 + seed) - 0.5) * 22; m.orb(cx, cy, 8 + h01(i + seed) * 4, 6 + h01(i * 2 + seed) * 3, aut ? ["#a8622a", "#c4852f", "#7d5a2a"][i % 3] : ["#3f6a3a", "#4f7d45", "#35593a"][i % 3], 0.85); }
    else for (let i = 0; i < 7; i++) m.line(x + 1, 70, x + 1 + (h01(i * 3.1 + seed) - 0.5) * 30, 50 + h01(i * 5.3 + seed) * 14, "#3a2e26");
    m.set({ n: [0, 0], D: FAC - 4 }); m.r(x - 3, RD - 8, 9, 1, "#4a4d4a");
  }

  // ------------------------------------------------------------ ce qui bouge : pluie, passants, voitures, drapeau
  function pluie(m, W, t, still, c) {
    if (!c.rain) return; const X0 = -m.ox;
    m.set({ E: Math.round(60 + c.skyE * 0.6), n: [0, 0], S: 0, D: 20 });
    for (let i = 0; i < 150; i++) { const sp = 150 + h01(i * 2.3) * 110, x = X0 + ((h01(i * 9.7) * (W + 60) - (still ? 0 : t * 22)) % (W + 60) + W + 60) % (W + 60) - 30, y = ((h01(i * 4.1) * H + (still ? 0 : t * sp)) % H); m.line(x, y, x - 1, y + 5, [200, 212, 236], 0.22 + h01(i) * 0.2); }
    if (!still) { m.set({ E: 90, D: 60 }); for (let i = 0; i < 26; i++) { const p = (t * 1.7 + h01(i * 3.3)) % 1, x = X0 + Math.floor(h01(i * 6.1 + Math.floor(t * 1.7 + h01(i * 3.3))) * W), y = RD + 2 + Math.floor(h01(i * 8.7) * 20); m.hl(x - Math.round(p * 2), y, 1 + Math.round(p * 4), [190, 204, 228], 0.5 * (1 - p)); } }
  }
  // un passant : 28 rangées de haut, pieds en (x, y) ; o : coat, skin, hair, scarf, dir, step (0, 1 ou -1 : à l'arrêt), bag, parapluie, D
  const COATS = ["#2a303c", "#4a3a34", "#3a4a44", "#55323a", "#6b5a3a", "#1f2228"], SKINS = ["#d9a887", "#a8765a", "#6a4634", "#e6bfa0"], SCARF = ["#a8323a", "#c9a24a", "#27407a", "#d9d5cb", "#3f6a4a"];
  function bonhomme(m, x, y, o) {
    const coat = rgb(o.coat), cd = darker(coat, 0.3), st = o.step, d = o.dir || 1;
    m.set({ E: 0, S: 0, D: o.D, n: [0, 0] });
    // jambes et chaussures
    const a = st < 0 ? 0 : st ? 1 : -1;
    m.r(x - 3 - (st < 0 ? 0 : a * d), y - 9, 3, 8 - (a > 0 ? 1 : 0), "#22252c"); m.r(x + 1 + (st < 0 ? 0 : a * d), y - 9, 3, 8 - (a < 0 ? 1 : 0), "#2a2e36");
    m.r(x - 3 - (st < 0 ? 0 : a * d) + (d > 0 ? 0 : -1), y - 1 - (a > 0 ? 1 : 0), 4, 1, "#0f1114"); m.r(x + 1 + (st < 0 ? 0 : a * d) + (d > 0 ? 0 : -1), y - 1 - (a < 0 ? 1 : 0), 4, 1, "#0f1114");
    // manteau, modelé en volume
    for (let yy = y - 22; yy < y - 8; yy++) { const half = yy < y - 20 ? 3 : 4; for (let q = -half; q <= half; q++) { m.nx = Math.round(q / (half + 1) * 0.8 * 127 + 128); m.px(x + q, yy, Math.abs(q) === half || yy === y - 9 ? cd : coat); } }
    m.nx = 128; m.vl(x + d, y - 20, 11, cd, 0.5);
    // bras qui balance, sac
    const sw = st < 0 ? 0 : a; m.set({ D: o.D - 1 }); m.r(x - 5 + (d > 0 ? 0 : 9) - sw * d, y - 20, 2, 9, cd); m.px(x - 5 + (d > 0 ? 0 : 9) - sw * d, y - 11, o.skin);
    if (o.bag) { m.set({ S: 40 }); m.r(x + (d > 0 ? -7 : 5) - sw * d, y - 11, 4, 5, "#5a3a22"); m.hl(x + (d > 0 ? -7 : 5) - sw * d, y - 11, 4, "#7d5632"); m.set({ S: 0 }); }
    // écharpe, tête, cheveux
    m.set({ D: o.D }); m.r(x - 3, y - 23, 7, 2, o.scarf); m.orb(x, y - 26, 3, 3.2, o.skin, 0.7); m.r(x - 3, y - 30, 7, 3, o.hair); m.r(x - 3 - (d > 0 ? 0 : -5), y - 28, 2, 3, o.hair);
    if (o.parapluie) { m.set({ n: [0, -0.7] }); for (let q = 0; q < 5; q++) m.hl(x - 4 - q * 2 + d, y - 38 + q, 9 + q * 4, q === 4 ? "#15181d" : o.parapluie); m.set({ n: [0, 0] }); m.vl(x + d * 2, y - 33, 13, "#15181d"); }
  }
  function passants(m, W, t, still, c, seed) {
    const X0 = -m.ox, n = c.hr > 7 && c.hr < 22 ? 4 : 1;
    for (let i = 0; i < n; i++) {
      const sp = (9 + h01(i * 3.7 + seed) * 8) * (i % 2 ? -1 : 1), x = Math.round(X0 + (((h01(i * 9.1 + seed) * (W + 40) + (still ? 0 : t * sp)) % (W + 40)) + W + 40) % (W + 40) - 20);
      bonhomme(m, x, SW + 4 + (i % 2) * 3, { coat: COATS[Math.floor(h01(i * 5.3 + seed) * COATS.length)], skin: SKINS[Math.floor(h01(i * 2.9 + seed) * 4)], hair: h01(i + seed) < 0.5 ? "#2a2220" : h01(i + seed) < 0.8 ? "#5a4030" : "#b8b4ac", scarf: SCARF[Math.floor(h01(i * 6.1 + seed) * SCARF.length)], dir: sp > 0 ? 1 : -1, step: still ? -1 : Math.floor(t * 4.5 + i) % 2, bag: h01(i * 7.7 + seed) < 0.6, parapluie: c.rain ? ["#7a2a2f", "#27407a", "#2c3038", "#3f6a4a"][i % 4] : null, D: FAC - 8 - (i % 2) * 6 });
    }
  }
  function voiture(m, W, t, still, c, L, OX, seed) {
    if (still) return; const X0 = -m.ox, cyc = 13 + h01(seed) * 6, ph = (t + seed * 3) % cyc, dir = Math.floor((t + seed * 3) / cyc) % 2 ? -1 : 1;
    if (ph > 4.2) return;
    const x = Math.round(dir > 0 ? X0 - 50 + ph / 4.2 * (W + 100) : X0 + W + 50 - ph / 4.2 * (W + 100)), y = RD + 18, col = ["#b9bec4", "#2a3440", "#7a2a2f", "#e9e6dc", "#1f2228"][Math.floor(h01(Math.floor((t + seed * 3) / cyc) * 3.7 + seed) * 5)];
    m.set({ E: 0, S: 0, D: 110 });
    for (let j = 0; j < 7; j++) { m.set({ n: [0, j < 2 ? -0.7 : 0] }); m.r(x - 20, y - 8 + j, 40, 1, j === 6 ? darker(col, 0.4) : col); }
    for (let j = 0; j < 6; j++) { const a = 5 - j; m.set({ n: [0, j === 0 ? -0.7 : 0] }); m.r(x - 11 - (dir > 0 ? 0 : 2) + Math.round(a * 0.6), y - 14 + j, 24 - a, 1, j === 0 ? col : "#1c2630"); }
    m.set({ n: [0, 0], S: 0 }); for (const wx of [x - 12, x + 12]) { m.r(wx - 2, y - 4, 5, 5, "#111316"); m.r(wx - 3, y - 3, 7, 3, "#111316"); m.px(wx, y - 2, "#8d949c"); }
    m.set({ E: 255 }); m.r(x + dir * 19, y - 6, 2, 2, "#fff6d0"); m.r(x - dir * 20, y - 6, 2, 2, "#ff3a2a"); m.set({ E: 0 });
    if (c.sun0 < 0.8) { L.push({ x: OX + x + dir * 30, y: y - 2, d: 104, r: 78, c: [1, 0.95, 0.8], i: 1.5 * (1 - c.sun0 * 0.7), wrap: 0.6, haze: 0.12, hr: 26 }); L.push({ x: OX + x - dir * 24, y: y - 4, d: 106, r: 30, c: [1, 0.2, 0.12], i: 0.8, wrap: 0.6 }); }
  }
  function drapeau(m, x, y, t, still) {
    m.set({ E: 0, n: [0, 0], S: 120, D: FAC - 6 }); m.vl(x, y - 2, 30, "#c9cdd0"); m.set({ S: 0 });
    for (let i = 0; i < 18; i++) { const wv = still ? 0 : Math.round(Math.sin(t * 3 + i * 0.55) * (i / 9)), col = i < 6 ? "#27407a" : i < 12 ? "#ecebe0" : "#b33a32"; m.nx = Math.round(Math.cos(t * 3 + i * 0.55) * 40 + 128); m.vl(x + 1 + i, y + wv, 12, col); } m.nx = 128;
  }

  // ------------------------------------------------------------ le détail animé de chaque lieu (ANIM, clé `anim` de LIEUX) — ne pas les décrire au joueur
  const ANIM = {
    pigeons(m, t, still, c, P, L, OX) {
      if (c.sun0 < 0.2) return; const vol = !still && t % 23 > 20.5 ? (t % 23 - 20.5) / 2.5 : 0;
      for (let i = 0; i < 6; i++) {
        const bx = (P.pig || 150) + i * 9 + Math.round(h01(i * 3.3) * 6), by = SW + 5 + (i % 3), up = vol ? Math.sin(vol * Math.PI) * (40 + i * 6) : 0, dx = vol ? Math.sin(vol * Math.PI) * (i - 2.5) * 14 : 0, pk = !still && !vol && Math.floor(t * 2.3 + i * 1.7) % 4 === 0 ? 1 : 0;
        m.set({ E: 0, S: 0, D: FAC - 6, n: [0, -0.4] }); const x = Math.round(bx + dx), y = Math.round(by - up);
        m.r(x, y - 2, 4, 2, i % 3 ? "#7d8490" : "#a9aeb6"); m.px(x + (i % 2 ? 4 : -1), y - 3 + pk, "#565c68");
        if (vol) { const f = Math.floor(t * 12 + i) % 2; m.r(x - 1, y - 3 - f * 2, 6, 1, "#c9cdd4"); } else m.px(x + 1, y, "#c8323a");
      }
      m.set({ n: [0, 0] });
    },
    tram(m, t, still, c, P, L, OX, W) {
      if (still) return; const X0 = -m.ox, cyc = 31, ph = (t + 9) % cyc, dir = Math.floor((t + 9) / cyc) % 2 ? -1 : 1; if (ph > 7) return;
      const len = 150, x0 = Math.round(dir > 0 ? X0 - len - 10 + ph / 7 * (W + len + 20) : X0 + W + 10 - ph / 7 * (W + len + 20)), y = RD + 34, nuit = c.sun0 < 0.6;
      m.set({ E: 0, S: 0, D: 80 });
      for (let j = 0; j < 22; j++) { m.set({ n: [0, j < 2 ? -0.7 : 0], E: 0 }); m.r(x0, y - 24 + j, len, 1, j < 2 ? "#eef1f0" : j > 15 ? (j === 21 ? "#3a3f44" : "#2f8f5a") : "#eef1f0"); }
      for (let q = 6; q < len - 12; q += 18) { m.set({ E: nuit ? 120 : 10, S: 0, n: [0, 0] }); m.r(x0 + q, y - 20, 14, 9, nuit ? "#e8cf9a" : "#3a4a5a"); if (nuit && h01(q) < 0.6) { m.set({ E: 60 }); m.r(x0 + q + 4, y - 16, 4, 5, "#3a3440"); } }
      for (const q of [30, 74, 118]) { m.set({ E: 0, S: 0 }); m.r(x0 + q, y - 20, 1, 18, "#9aa0a4"); }
      m.set({ E: 0, S: 0 }); m.r(x0 + len / 2 - 1, y - 30, 2, 6, "#3a3f44"); m.hl(x0 + len / 2 - 8, y - 31, 16, "#3a3f44");
      m.set({ E: 255, S: 0 }); m.r(dir > 0 ? x0 + len - 2 : x0, y - 8, 2, 3, "#fff6d0"); m.set({ E: 0 });
      if (nuit) L.push({ x: OX + x0 + len / 2, y: y - 12, d: 70, r: 120, c: [1, 0.9, 0.7], i: 1.1, wrap: 0.7 }, { x: OX + (dir > 0 ? x0 + len + 16 : x0 - 16), y: y - 6, d: 76, r: 70, c: [1, 0.95, 0.8], i: 1.4, wrap: 0.6, haze: 0.1, hr: 24 });
    },
    ambulance(m, t, still, c, P, L, OX) {
      const x = 318, y = RD + 13;
      m.set({ E: 0, S: 0, D: FAC - 30 }); for (let j = 0; j < 17; j++) { m.set({ n: [0, j < 2 ? -0.7 : 0] }); m.r(x - 22, y - 18 + j, j < 8 ? 34 : 46, 1, j === 9 || j === 10 ? "#d8322e" : j === 16 ? "#9da2a8" : "#f2f3f1"); }
      m.set({ n: [0, 0], S: 0 }); m.r(x + 13, y - 9, 9, 5, "#1c2630"); m.r(x - 8, y - 15, 2, 6, "#2f6fd0"); m.r(x - 10, y - 13, 6, 2, "#2f6fd0");
      for (const wx of [x - 13, x + 15]) { m.r(wx - 2, y - 3, 5, 5, "#111316"); m.r(wx - 3, y - 2, 7, 3, "#111316"); m.px(wx, y - 1, "#8d949c"); }
      const b = still ? 0.3 : Math.pow(Math.max(0, Math.sin(t * 6.2)), 2);
      m.set({ E: Math.round(70 + b * 185) }); m.r(x - 16, y - 20, 4, 2, "#3a6aff"); m.set({ E: 0 });
      if (b > 0.02) L.push({ x: OX + x - 14, y: y - 20, d: FAC - 34, r: 150, c: [0.2, 0.42, 1], i: 2 * b, wrap: 0.6, haze: 0.26 * b, hr: 40 });
    },
    peniche(m, t, still, c, P, L, OX, W) {
      const X0 = -m.ox;
      // rides de la rivière
      m.set({ E: Math.round(30 + c.sun0 * 60), n: [0, -1], S: 245, D: 60 });
      for (let i = 0; i < 70; i++) { const y = RD + 12 + Math.floor(h01(i * 3.7) * (H - RD - 14)), x = X0 + ((h01(i * 9.3) * W + (still ? 0 : t * (5 + h01(i) * 6))) % W), w = 2 + Math.floor(h01(i * 5.1) * 6 * (y - RD) / 60); m.hl(Math.round(x), y, w, [190, 214, 222], 0.16 + h01(i * 2.2) * 0.2); }
      const cyc = 58, ph = still ? 20 : t % cyc; if (ph > 40) return;
      const len = 120, x0 = Math.round(X0 - len - 10 + ph / 40 * (W + len + 20)), y = RD + 46, nuit = c.sun0 < 0.6;
      m.set({ E: 0, S: 0, D: 70, n: [0, 0] }); for (let j = 0; j < 9; j++) m.r(x0 + (j > 6 ? (j - 6) * 2 : 0), y - 9 + j, len - (j > 6 ? (j - 6) * 4 : 0), 1, j === 0 ? "#8a2a2a" : j < 2 ? "#3a3f48" : "#20242a");
      m.r(x0 + 8, y - 20, 30, 11, "#d9d5c8"); m.set({ n: [0, -0.7] }); m.r(x0 + 6, y - 22, 34, 2, "#3a3f48"); m.set({ n: [0, 0] });
      for (const q of [12, 22, 31]) { m.set({ E: nuit ? 210 : 0, S: 0 }); m.r(x0 + q, y - 17, 5, 5, nuit ? "#ffe2a6" : "#2a3440"); }
      m.set({ E: 0, S: 0 }); for (let q = 46; q < len - 8; q += 16) m.r(x0 + q, y - 12, 13, 3, "#4a4640");
      if (nuit) L.push({ x: OX + x0 + 22, y: y - 14, d: 66, r: 70, c: [1, 0.82, 0.55], i: 1.2, wrap: 0.7, haze: 0.1, hr: 22 });
    },
    velo(m, t, still, c, P, L, OX, W) {
      if (still) return; const X0 = -m.ox, cyc = 19, ph = (t + 4) % cyc; if (ph > 5) return;
      const x = Math.round(X0 + W + 20 - ph / 5 * (W + 40)), y = RD + 12, pd = Math.floor(t * 6) % 2;
      m.set({ E: 0, S: 0, D: FAC - 28, n: [0, 0] });
      for (const wx of [x - 8, x + 8]) { for (let a = 0; a < 12; a++) m.px(Math.round(wx + Math.cos(a * 0.524) * 4), Math.round(y - 4 + Math.sin(a * 0.524) * 4), "#15181d"); m.px(wx, y - 4, "#8d949c"); }
      m.line(x - 8, y - 4, x - 2, y - 10, "#c8323a"); m.line(x - 2, y - 10, x + 6, y - 10, "#c8323a"); m.line(x + 6, y - 10, x + 8, y - 4, "#c8323a"); m.line(x - 2, y - 10, x + 1, y - 4, "#c8323a"); m.line(x - 8, y - 13, x - 8, y - 4, "#2c3038");
      m.set({ S: 0 }); m.line(x + 1, y - 4, x + 1 + (pd ? 2 : -2), y - 7, "#22252c"); m.line(x + 1 + (pd ? 2 : -2), y - 7, x + 4, y - 12, "#22252c");
      for (let yy = y - 21; yy < y - 12; yy++) m.r(x - 1 - Math.round((y - 12 - yy) * 0.5), yy, 5, 1, "#3f6a8a"); m.line(x - 4, y - 19, x - 8, y - 13, "#3f6a8a");
      m.orb(x - 6, y - 24, 2.6, 2.8, "#d9a887", 0.7); m.r(x - 9, y - 27, 6, 2, "#e8c66a");
      m.set({ E: 255 }); m.px(x - 10, y - 12, "#fff6d0"); m.px(x + 10, y - 9, "#ff3a2a"); m.set({ E: 0 });
    },
    file(m, t, still, c, P) {
      if (c.hr < 8 || c.hr > 17.5) return;
      for (let i = 0; i < 4; i++) bonhomme(m, 284 - i * 11, SW + 5, { coat: COATS[(i * 2 + P.seed) % COATS.length], skin: SKINS[(i + P.seed) % 4], hair: i % 2 ? "#2a2220" : "#5a4030", scarf: SCARF[(i + 1) % SCARF.length], dir: 1, step: -1, bag: i % 2 === 0, parapluie: c.rain ? ["#2c3038", "#7a2a2f"][i % 2] : null, D: FAC - 8 });
    },
  };

  // ------------------------------------------------------------ éclairage commun
  function lumieres(c, OX, W) {
    const day = mix([0.075, 0.085, 0.135], [0.5, 0.5, 0.5], c.sun), amb = [day[0] + c.dusk * 0.15, day[1] + c.dusk * 0.08, day[2] + c.dusk * 0.05];
    return { amb, L: [
      { x: OX + 40, y: -90, d: 40, r: 900, c: c.skyc, i: c.sun * 0.8 + c.dusk * 0.6, wrap: 0.5 },
      { x: OX + 300, y: -70, d: 60, r: 800, c: [0.5, 0.62, 1], i: 0.2 * (1 - c.sun0), wrap: 0.6 },
    ] };
  }

  // ============================================================ les six familles
  // chaque famille : fixe(m, W, c, o, P, L, OX) dessine le bâtiment et pose ses lumières fixes ; vif(m, t, still, c, o, P, L, OX) ce qui bouge
  const FAM = {};

  // ---- rue haussmannienne (lieu des faits, rue, étude)
  FAM.rue = {
    fixe(m, W, c, o, P, L, OX) {
      const X0 = -m.ox, nom = P.enseigne === "nom" ? o.nom : null; let x = X0 - 6, i = 0;
      while (x < X0 + W) { const w = 96 + Math.floor(h01(i * 3.3 + P.seed) * 40), top = 26 + Math.floor(h01(i * 5.7 + P.seed) * 12); haussmann(m, x, w, top, c, P.seed + i * 7, { stone: ["#cbbd9f", "#d4c8ac", "#c2b294"][i % 3], enseigne: x < 150 && x + w > 150 ? nom : null, enseigneK: 1 }); lueurs(L, OX, x, w, c); m.set({ E: 0, S: 0, D: FAC }); m.vl(x + w - 1, top + 11, SW - top - 11, "#8f8468"); x += w; i++; }
      if (P.plaque) { m.set({ S: 170, E: 0, D: FAC - 1 }); m.r(196, SW - 15, 14, 9, "#c9a24a"); m.hl(198, SW - 12, 10, "#5a4318"); m.hl(198, SW - 10, 8, "#5a4318"); }
    },
    vif() {},
  };

  // ---- commissariat, gendarmerie
  FAM.poste = {
    fixe(m, W, c, o, P, L, OX) {
      const X0 = -m.ox, g = P.gend, x0 = g ? 84 : 92, w = g ? 192 : 176, top = g ? 52 : 30, mur = g ? "#d9d2bd" : "#8e5a48", nuit = c.sun0 < 0.5;
      haussmann(m, X0 - 8, x0 - X0 + 8, 36, c, P.seed, {}); haussmann(m, x0 + w, X0 + W - x0 - w + 8, 30, c, P.seed + 5, {}); lueurs(L, OX, X0, x0 - X0, c); lueurs(L, OX, x0 + w, X0 + W - x0 - w, c);
      m.set({ E: 0, n: [0, 0], S: 0, D: FAC - 2 });
      m.r(x0, top, w, SW - top, mur); if (!g) for (let y = top + 2; y < SW - 26; y += 3) for (let x = x0 + ((y / 3) % 2 ? 0 : 4); x < x0 + w; x += 8) m.px(x, y, "#7a4a3a"); else m.noise(x0, top, w, SW - top, "#cfc8b2", 0.15, 3);
      m.r(x0, SW - 26, w, 26, "#b9b2a2"); for (let y = SW - 24; y < SW; y += 6) m.hl(x0, y, w, "#a39c8c");
      m.set({ n: [0, -0.7] }); m.r(x0 - 2, top - 3, w + 4, 3, "#d6d0c0"); m.hl(x0, SW - 27, w, "#d6d0c0"); m.set({ n: [0, 0] }); m.hl(x0 - 2, top, w + 4, "#6f685a");
      m.r(x0 + w - 30, top - 14, 2, 12, "#3a3f48"); m.r(x0 + w - 34, top - 13, 10, 1, "#3a3f48"); m.r(x0 + 20, top - 8, 14, 6, "#8d949c");
      // fenêtres de bureaux : néon froid la nuit
      const nf = Math.floor((SW - 30 - top) / 19);
      for (let f = 0; f < nf; f++) for (let x = x0 + 9; x < x0 + w - 12; x += 16) {
        const y = top + 7 + f * 19, al = nuit && h01(x * 1.3 + f * 7.7 + P.seed) < 0.55;
        m.set({ E: 0, S: 0 }); m.r(x - 2, y - 2, 13, 15, "#d6d0c0"); m.set({ n: [0, -0.6] }); m.hl(x - 2, y + 13, 13, "#eee9dc"); m.set({ n: [0, 0] });
        m.set({ E: al ? 210 : 0, S: al ? 0 : 210 }); m.r(x, y, 9, 12, al ? "#d6ecff" : "#27303d"); m.set({ E: al ? 110 : 0, S: 0 }); m.vl(x + 4, y, 12, al ? "#8fa6c0" : "#3a4452"); m.hl(x, y + 5, 9, al ? "#8fa6c0" : "#3a4452");
        if (al && h01(x + f * 3.1) < 0.5) { m.set({ E: 70 }); m.r(x + 1, y + 7, 3, 5, "#2a3440"); }
      }
      // rez-de-chaussée : fenêtres barreaudées, porte vitrée, marches
      for (let x = x0 + 10; x < x0 + w - 14; x += 22) if (Math.abs(x + 6 - (x0 + w / 2)) > 22) { m.set({ E: nuit ? 150 : 0, S: nuit ? 0 : 200 }); m.r(x, SW - 21, 12, 13, nuit ? "#bcd6f0" : "#27303d"); m.set({ E: 0, S: 100 }); for (let q = x + 1; q < x + 12; q += 3) m.vl(q, SW - 21, 13, "#1d2026"); m.hl(x, SW - 15, 12, "#1d2026"); }
      const cx = Math.round(x0 + w / 2);
      m.set({ E: 0, S: 0 }); m.r(cx - 16, SW - 24, 32, 24, "#3a4654"); m.set({ E: 225 }); m.r(cx - 14, SW - 22, 13, 22, "#e9f6ff"); m.r(cx + 1, SW - 22, 13, 22, "#e9f6ff"); m.set({ E: 120 }); m.r(cx - 9, SW - 12, 5, 12, "#5d7a96"); m.r(cx - 14, SW - 10, 28, 1, "#9fb6d0");
      m.set({ E: 0, n: [0, -0.8], S: 60 }); m.r(cx - 20, SW - 2, 40, 2, "#d6d0c0"); m.set({ n: [0, 0] });
      const e = g ? plaque(m, "GENDARMERIE", cx, SW - 44, "#ffffff", "#1f3f9a", true, true) : (() => { m.set({ E: 170, S: 0 }); m.r(cx - 26, SW - 41, 52, 13, "#1f4fd0"); m.set({ E: 255 }); m.big("POLICE", cx - 17, SW - 38, "#ffffff"); m.set({ E: 0 }); return 0; })();
      K.paper(m, cx + 24, SW - 20, 10, 12); m.set({ S: 150, D: FAC - 3 }); m.r(cx - 32, SW - 18, 5, 7, "#1b2a55"); m.px(cx - 30, SW - 16, "#e8e8e8");
      L.push({ x: OX + cx, y: SW - 34, d: FAC - 22, r: 96, c: [0.3, 0.5, 1], i: 1.7, wrap: 0.6, haze: 0.26, hr: 34 }, { x: OX + cx, y: SW - 8, d: FAC - 26, r: 74, c: [0.85, 0.95, 1], i: 1.5, wrap: 0.6, haze: 0.14, hr: 26 });
      // voiture de patrouille au bord du trottoir
      const vx = cx + 62, vy = RD + 12;
      m.set({ E: 0, S: 0, D: FAC - 30 }); for (let j = 0; j < 7; j++) { m.set({ n: [0, j < 2 ? -0.7 : 0] }); m.r(vx - 22, vy - 8 + j, 44, 1, j === 3 ? "#1f4fd0" : j === 6 ? "#9da2a8" : "#eef0f2"); }
      for (let j = 0; j < 6; j++) { m.set({ n: [0, j === 0 ? -0.7 : 0] }); m.r(vx - 12 + Math.round((5 - j) * 0.6), vy - 14 + j, 25 - (5 - j), 1, j === 0 ? "#eef0f2" : "#1c2630"); }
      m.set({ n: [0, 0], S: 0 }); for (const wx of [vx - 13, vx + 13]) { m.r(wx - 2, vy - 4, 5, 5, "#111316"); m.r(wx - 3, vy - 3, 7, 3, "#111316"); m.px(wx, vy - 2, "#8d949c"); } m.r(vx - 5, vy - 16, 10, 2, "#2c3038");
      P.gyro = [vx, vy - 17];
    },
    vif(m, t, still, c, o, P, L, OX) {
      drapeau(m, (P.gend ? 84 : 92) + 28, SW - 62, t, still);
      const b = still ? 0 : (t % 17 > 11 ? Math.pow(Math.max(0, Math.sin(t * 7.5)), 2) : 0), [gx, gy] = P.gyro;
      m.set({ E: Math.round(60 + b * 195), S: 0, D: FAC - 30, n: [0, 0] }); m.r(gx - 4, gy, 4, 2, "#3a6aff"); m.set({ E: Math.round(60 + (still ? 0 : (t % 17 > 11 ? Math.pow(Math.max(0, Math.sin(t * 7.5 + 1.6)), 2) : 0)) * 195) }); m.r(gx + 1, gy, 4, 2, "#3a6aff"); m.set({ E: 0 });
      if (b > 0.02) L.push({ x: OX + gx, y: gy, d: FAC - 34, r: 190, c: [0.2, 0.42, 1], i: 2.4 * b, wrap: 0.6, haze: 0.3 * b, hr: 46 });
    },
  };

  // ---- maison d'arrêt, centrale : le mur, la porte, le mirador
  FAM.prison = {
    fixe(m, W, c, o, P, L, OX) {
      const X0 = -m.ox, mur = P.mur || "#a39880", md = darker(mur, 0.22), ml = lighter(mur, 0.18), top = 62, nuit = c.sun0 < 0.5;
      // bâtiments de détention derrière le mur : petites fenêtres barreaudées
      m.set({ E: 0, n: [0, 0], S: 0, D: FAC + 30 });
      for (const [bx, bw, bt] of [[X0 + 20, 120, 30], [170, 150, 24]]) {
        m.r(bx, bt, bw, top - bt + 4, darker(mur, 0.1)); m.set({ n: [0, -0.6] }); m.r(bx - 2, bt - 4, bw + 4, 4, "#5d6068"); m.set({ n: [0, 0] });
        for (let y = bt + 5; y < top - 4; y += 9) for (let x = bx + 5; x < bx + bw - 6; x += 9) { const al = nuit && h01(x * 2.1 + y * 3.7 + P.seed) < 0.28; m.set({ E: al ? 200 : 0 }); m.r(x, y, 4, 5, al ? "#ffd98a" : "#20242b"); m.set({ E: al ? 90 : 0 }); m.vl(x + 1, y, 5, "#15181d"); m.vl(x + 3, y, 5, "#15181d"); } m.set({ E: 0 });
      }
      // le mur d'enceinte : assises de pierre, chaperon, concertina
      m.set({ D: FAC }); m.r(X0, top, W, SW - top, mur);
      for (let y = top + 4; y < SW; y += 7) { m.hl(X0, y, W, md); for (let x = X0 + ((y / 7) % 2 ? 0 : 9); x < X0 + W; x += 18) m.vl(x, y, 7, md); }
      m.noise(X0, top, W, SW - top, ml, 0.07, P.seed); for (let i = 0; i < 14; i++) m.vl(X0 + Math.floor(h01(i * 5.3 + P.seed) * W), top + 3, 10 + Math.floor(h01(i * 2.1) * 30), md, 0.5);
      m.set({ n: [0, -0.7] }); m.r(X0, top - 3, W, 3, ml); m.set({ n: [0, 0] }); m.hl(X0, top, W, md);
      m.set({ S: 200 }); for (let x = X0; x < X0 + W; x += 3) { m.px(x, top - 5 - (x % 6 ? 0 : 1), "#aab0b4"); m.px(x + 1, top - 4, "#7d8488"); }
      // la porte : grand vantail d'acier, guichet, plaque
      const cx = 186; m.set({ S: 0 }); m.r(cx - 34, top - 12, 68, SW - top + 12, lighter(mur, 0.1)); m.set({ n: [0, -0.7] }); m.r(cx - 37, top - 15, 74, 4, ml); m.set({ n: [0, 0] });
      m.set({ S: 70 }); m.r(cx - 24, SW - 38, 48, 38, "#33485e"); for (let x = cx - 24; x < cx + 24; x += 8) { m.set({ n: [-0.4, 0] }); m.vl(x, SW - 38, 38, "#46607a"); m.set({ n: [0, 0] }); } m.hl(cx - 24, SW - 38, 48, "#46607a"); m.hl(cx - 24, SW - 19, 48, "#263849");
      m.r(cx + 6, SW - 20, 12, 20, "#2a3d50"); m.set({ S: 160 }); m.px(cx + 8, SW - 10, "#c9cdd0"); m.set({ E: nuit ? 150 : 0, S: 0 }); m.r(cx + 9, SW - 17, 6, 4, nuit ? "#ffe2a6" : "#1c2630"); m.set({ E: 0 });
      plaque(m, o.plaque || P.nom || "MAISON D'ARRÊT", cx, SW - 50, "#f1ede2", "#1f3f9a", false, false);
      if (nuit) L.push({ x: OX + cx, y: SW - 40, d: FAC - 18, r: 66, c: [1, 0.86, 0.6], i: 1.2, wrap: 0.6 });
      m.set({ S: 0, D: FAC - 1 }); m.r(cx - 32, SW - 20, 5, 8, "#8f9697"); m.set({ E: 255 }); m.px(cx - 30, SW - 18, "#ff4a36"); m.set({ E: 0 }); m.set({ S: 120 }); m.orb(cx + 31, top - 8, 3, 2, "#23272e", 0.6);
      if (P.parloirs) { m.r(300, SW - 24, 16, 24, "#3a4654"); m.set({ E: nuit ? 170 : 0 }); m.r(302, SW - 22, 12, 12, nuit ? "#e9f6ff" : "#27303d"); m.set({ E: 0 }); plaque(m, "PARLOIRS", 308, SW - 35, "#ffffff", "#1f3f9a", false, false); if (nuit) L.push({ x: OX + 308, y: SW - 14, d: FAC - 16, r: 46, c: [0.85, 0.95, 1], i: 1, wrap: 0.6 }); }
      // projecteurs du mur
      for (const x of [70, 128, 250, 330]) { m.set({ S: 120 }); m.r(x, top - 8, 3, 6, "#2c3038"); m.set({ E: nuit ? 255 : 20, S: 0 }); m.r(x - 1, top - 3, 5, 2, nuit ? "#ffe9b0" : "#c9c6b6"); m.set({ E: 0 }); if (nuit) L.push({ x: OX + x + 1, y: top + 2, d: FAC - 14, r: 78, c: [1, 0.7, 0.36], i: 1.5, wrap: 0.5, haze: 0.14, hr: 22 }); }
      // mirador
      if (P.mirador !== false) { const mx = 96; m.set({ S: 0, D: FAC + 2 }); m.r(mx, 28, 22, top - 28, darker(mur, 0.05)); m.set({ n: [0, -0.7] }); m.r(mx - 4, 14, 30, 3, "#5d6068"); m.set({ n: [0, 0] }); m.r(mx - 3, 17, 28, 12, "#3a4654"); m.set({ E: nuit ? 150 : 0, S: nuit ? 0 : 200 }); m.r(mx - 1, 18, 24, 8, nuit ? "#cfe4d8" : "#56616e"); m.set({ E: 0, S: 0 }); for (let x = mx + 5; x < mx + 22; x += 6) m.vl(x, 18, 8, "#3a4654"); P.mir = [mx + 11, 22]; if (nuit) { m.set({ E: 40 }); m.orb(mx + 8, 24, 2, 3, "#20262c", 0.4); m.set({ E: 0 }); } }
    },
    vif(m, t, still, c, o, P, L, OX) {
      if (P.mir && c.sun0 < 0.5) { const a = still ? 0.9 : 1.2 + Math.sin(t * 0.35) * 0.9, dx = Math.cos(a), dy = Math.sin(a); L.push({ x: OX + P.mir[0], y: P.mir[1] + 6, d: FAC - 30, r: 230, c: [1, 0.96, 0.84], i: 1.6, wrap: 0.6, dir: [dx, dy], cone: 0.9, soft: 0.07 }); }
    },
  };

  // ---- tribunal de Paris : la tour de verre en gradins
  FAM.tour = {
    fixe(m, W, c, o, P, L, OX) {
      const X0 = -m.ox, nuit = c.sun0 < 0.5, verre = mix([44, 58, 82], mix(c.top, c.bot, 0.5), 0.5 + c.sun0 * 0.25);
      haussmann(m, X0 - 8, 66 - X0 + 8, 60, c, P.seed, { stone: "#bdb7aa" }); haussmann(m, 298, X0 + W - 298 + 8, 56, c, P.seed + 3, { stone: "#bdb7aa" });
      const bloc = (x0, x1, y0, y1, d) => {
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
          const gx = (x - x0) % 7, gy = (y - y0) % 6, cell = Math.floor((x - x0) / 7) * 13.7 + Math.floor((y - y0) / 6) * 7.3, al = nuit && h01(cell + P.seed) < (c.hr < 23 ? 0.2 : 0.06);
          if (gx === 0 || gy === 0) { m.set({ E: 0, S: 60, D: d, n: [gx === 0 ? -0.4 : 0, gy === 0 ? -0.5 : 0] }); m.px(x, y, gy === 0 ? "#dfe4ea" : "#b9c2cc"); }
          else { m.set({ E: al ? 115 : Math.round(c.sun0 * 46), S: al ? 0 : 230, D: d, n: [0, 0] }); m.px(x, y, al ? (h01(cell) < 0.7 ? "#b9cbe2" : "#e6cf9c") : mix(verre, [255, 255, 255], h01(cell * 1.3) * 0.1 + (1 - (y - y0) / (y1 - y0)) * 0.16 * c.sun0 + (Math.abs(((x - x0) + (y - y0) * 2) % 46 - 6) < 4 ? 0.1 * c.sun0 : 0))); }
        }
        m.set({ E: 0, S: 60, n: [0, -0.7], D: d }); m.r(x0 - 2, y0 - 2, x1 - x0 + 4, 2, "#eef1f4"); m.set({ n: [0, 0] });
      };
      bloc(124, 240, 0, 28, FAC + 24); bloc(100, 264, 32, 58, FAC + 12); bloc(74, 290, 62, 88, FAC);
      // terrasses plantées entre les blocs
      for (const [y, x0, x1] of [[30, 100, 124], [30, 240, 264], [60, 74, 100], [60, 264, 290]]) for (let x = x0 + 3; x < x1 - 2; x += 6) { m.set({ E: 0, S: 0, D: FAC + 6 }); m.orb(x, y - 2, 4, 4, ["#3f6a3a", "#a8622a", "#4f7d45"][Math.floor(h01(x + y) * 3)], 0.8); }
      // le socle : hall vitré, auvent, plaque
      m.set({ E: 0, S: 60, D: FAC - 2, n: [0, -0.7] }); m.r(66, 88, 232, 3, "#eef1f4"); m.set({ n: [0, 0] });
      m.set({ E: nuit ? 105 : 30, S: nuit ? 0 : 220 }); m.r(70, 91, 224, 27, nuit ? "#e2c088" : "#6d8096"); m.set({ E: nuit ? 60 : 0, S: 0 }); for (let x = 70; x < 294; x += 14) m.vl(x, 91, 27, nuit ? "#8a6a3a" : "#dfe4ea"); m.hl(70, 100, 224, nuit ? "#8a6a3a" : "#dfe4ea");
      if (nuit) { m.set({ E: 40 }); for (let x = 80; x < 290; x += 23) if (Math.abs(x - 182) > 20) m.r(x, 106, 4, 12, "#3a3020"); }
      m.set({ E: 0, n: [0, -0.7] }); m.r(160, 95, 44, 2, "#eef1f4"); m.set({ n: [0, 0] }); m.r(166, 97, 32, 21, "#2c3440"); m.set({ E: 170 }); m.r(168, 99, 13, 19, "#fff2d0"); m.r(183, 99, 13, 19, "#fff2d0"); m.set({ E: 0 });
      plaque(m, o.plaque || "TRIBUNAL DE PARIS", 182, 76, "#f1ede2", "#23262e", true, false);
      L.push({ x: OX + 182, y: 108, d: FAC - 24, r: 120, c: [1, 0.86, 0.6], i: nuit ? 0.9 : 0.2, wrap: 0.6, haze: nuit ? 0.1 : 0, hr: 36 }, { x: OX + 100, y: 110, d: FAC - 20, r: 70, c: [1, 0.86, 0.6], i: nuit ? 0.6 : 0, wrap: 0.6 }, { x: OX + 264, y: 110, d: FAC - 20, r: 70, c: [1, 0.86, 0.6], i: nuit ? 0.6 : 0, wrap: 0.6 });
    },
    vif(m, t, still, c, o, P) { drapeau(m, 112, SW - 56, t, still); },
  };

  // ---- pierre de taille : palais de la Cité, maison du barreau, Hôtel-Dieu
  FAM.pierre = {
    fixe(m, W, c, o, P, L, OX) {
      const X0 = -m.ox, st = "#d2c7aa", sd = darker(st, 0.2), sl = lighter(st, 0.22), nuit = c.sun0 < 0.5, top = P.fronton ? 46 : 40;
      haussmann(m, X0 - 8, 70 - X0 + 8, 44, c, P.seed, {}); haussmann(m, 294, X0 + W - 294 + 8, 40, c, P.seed + 4, {}); lueurs(L, OX, X0, 70 - X0, c); lueurs(L, OX, 294, X0 + W - 294, c);
      if (P.fleche) { m.set({ E: 0, n: [0.4, 0], S: 60, D: FAC + 40 }); for (let y = 0; y < 60; y++) { const half = Math.round(y / 12); m.hl(270 - half, y, half * 2 + 1, y % 9 === 0 ? "#3a4452" : "#2a323e"); } m.set({ S: 220 }); m.vl(270, 0, 6, "#e8c66a"); m.set({ n: [0, 0] }); }
      // corps de bâtiment, ailes aux hautes baies cintrées
      m.set({ E: 0, n: [0, 0], S: 0, D: FAC }); m.r(70, top, 224, SW - top, st); m.noise(70, top, 224, SW - top, sd, 0.08, P.seed);
      for (let y = top + 9; y < SW - 12; y += 8) m.hl(70, y, 224, sd, 0.5);
      for (const x0 of [78, 94, 256, 272]) { m.set({ E: nuit ? 120 : 0, S: nuit ? 0 : 210 }); m.r(x0, top + 20, 9, 38, nuit ? "#f0c070" : "#2a323e"); m.orb(x0 + 4, top + 20, 4.5, 5, nuit ? "#f0c070" : "#2a323e", 0.2); m.set({ E: nuit ? 100 : 0, S: 0 }); m.vl(x0 + 4, top + 16, 42, nuit ? "#a8864a" : "#4a5462"); for (let y = top + 26; y < top + 58; y += 8) m.hl(x0, y, 9, nuit ? "#a8864a" : "#4a5462"); }
      m.set({ E: 0, n: [0, -0.7] }); m.r(66, top - 4, 232, 4, sl); m.hl(70, SW - 13, 224, sl); m.set({ n: [0, 0] }); m.hl(66, top, 232, sd);
      for (let x = 72; x < 292; x += 6) { m.r(x, top - 8, 3, 4, st); m.set({ n: [0, -0.7] }); m.hl(x - 1, top - 9, 5, sl); m.set({ n: [0, 0] }); }
      // avant-corps : colonnes, entablement, fronton ; derrière, les portes
      const a = 118, b = 250, cols = P.cols || 6, pas = (b - a - 6) / (cols - 1);
      m.set({ D: FAC + 4 }); m.r(a, top + 12, b - a, SW - top - 24, darker(st, 0.45));
      for (let i = 0; i < cols - 1; i++) { const x = Math.round(a + 3 + pas * (i + 0.5)) - 5; m.set({ E: nuit ? 125 : 0, S: 0 }); m.r(x, SW - 40, 10, 28, nuit ? "#eeb866" : "#3a2e26"); m.orb(x + 5, SW - 40, 5, 4, nuit ? "#eeb866" : "#3a2e26", 0.2); m.set({ E: nuit ? 90 : 0 }); m.vl(x + 5, SW - 42, 30, "#5a4318"); }
      m.set({ E: 0, D: FAC - 6 });
      for (let i = 0; i < cols; i++) { const x = Math.round(a + 3 + pas * i) - 3; for (let q = 0; q < 6; q++) { m.nx = Math.round((q - 2.5) / 3 * 0.75 * 127 + 128); m.vl(x + q, top + 14, SW - top - 28, q === 0 || q === 5 ? sd : q === 2 ? sl : st); } m.nx = 128; m.set({ n: [0, -0.6] }); m.r(x - 1, top + 11, 8, 3, sl); m.r(x - 1, SW - 14, 8, 2, sl); m.set({ n: [0, 0] }); }
      m.set({ n: [0, -0.7] }); m.r(a - 4, top + 3, b - a + 8, 3, sl); m.set({ n: [0, 0] }); m.r(a - 2, top + 6, b - a + 4, 6, st); m.hl(a - 2, top + 11, b - a + 4, sd);
      if (P.fronton) { for (let y = top - 22; y < top + 3; y++) { const half = Math.round((y - (top - 22)) * (b - a + 8) / 2 / 25); m.set({ n: [0, -0.3] }); m.hl(184 - half, y, half * 2, st); m.set({ n: [0, -0.8] }); m.px(184 - half, y, sl); m.px(184 + half - 1, y, sl); } m.set({ n: [0, 0] }); for (let y = top - 14; y < top; y++) { const half = Math.round((y - (top - 16)) * 3.6); m.hl(184 - half, y, half * 2, sd, 0.55); } m.set({ S: 160 }); m.orb(184, top - 6, 4, 4, "#c9a24a", 0.6); m.set({ S: 0 }); }
      if (P.enseigne) plaque(m, P.enseigne, 184, top + 6 - (P.fronton ? 0 : 0), P.fg || "#e8c66a", P.bg || "#23262e", !!P.lit, false);
      if (P.urgences) { const e = plaque(m, "URGENCES", 274, SW - 34, "#ffffff", "#c8242a", true, false); L.push({ x: OX + 274, y: SW - 28, d: FAC - 14, r: 60, c: [1, 0.25, 0.2], i: 0.8, wrap: 0.6, haze: 0.08, hr: 22 }); m.set({ E: 85 }); m.r(262, SW - 22, 24, 22, "#b4c8dc"); m.set({ E: 90 }); m.vl(274, SW - 22, 22, "#6d8096"); m.set({ E: 0 }); L.push({ x: OX + 274, y: SW - 10, d: FAC - 16, r: 50, c: [0.85, 0.95, 1], i: 0.35, wrap: 0.6 }); plaque(m, "UMJ", 246, SW - 18, "#ffffff", "#1f3f9a", false, false); }
      // grand degré, grille dorée
      for (let j = 0; j < 6; j++) { m.set({ n: [0, -0.8], S: 30, D: FAC - 6 - j * 2 }); m.r(a - 6 - j * 3, SW - 12 + j * 2, b - a + 12 + j * 6, 1, sl); m.set({ n: [0, 0] }); m.r(a - 6 - j * 3, SW - 11 + j * 2, b - a + 12 + j * 6, 1, sd); }
      if (P.grille) for (const [g0, g1] of [[72, a - 22], [b + 22, 292]]) { m.set({ S: 230, D: FAC - 18, n: [0.4, 0] }); for (let x = g0; x < g1; x += 3) { m.vl(x, SW - 20, 20, x % 9 === 0 ? "#e8c66a" : "#1d2026"); if (x % 9 === 0) m.px(x, SW - 22, "#ffe9a0"); } m.set({ n: [0, 0] }); m.hl(g0, SW - 17, g1 - g0, "#c9a24a"); m.hl(g0, SW - 3, g1 - g0, "#1d2026"); }
      // projecteurs au pied des colonnes : la pierre s'allume par en dessous
      if (c.sun0 < 0.7) for (let i = 0; i < cols; i += 1) L.push({ x: OX + Math.round(a + 3 + pas * i), y: SW - 12, d: FAC - 20, r: 58, c: [1, 0.84, 0.56], i: 0.55 * (1 - c.sun0), wrap: 0.35 });
      if (c.sun0 < 0.7) L.push({ x: OX + 184, y: SW - 26, d: FAC - 2, r: 80, c: [1, 0.8, 0.5], i: 0.6 * (1 - c.sun0), wrap: 0.7, haze: 0.08, hr: 36 });
    },
    vif(m, t, still, c, o, P) { if (P.drapeau) drapeau(m, P.drapeau, SW - 70, t, still); },
  };

  // ---- administration moderne (SPIP) : bandeaux de béton et fenêtres en longueur
  FAM.moderne = {
    fixe(m, W, c, o, P, L, OX) {
      const X0 = -m.ox, nuit = c.sun0 < 0.5, bet = "#b9b5aa", bd = darker(bet, 0.22), bl = lighter(bet, 0.2);
      haussmann(m, X0 - 8, 84 - X0 + 8, 40, c, P.seed, {}); haussmann(m, 280, X0 + W - 280 + 8, 34, c, P.seed + 6, {}); lueurs(L, OX, X0, 84 - X0, c); lueurs(L, OX, 280, X0 + W - 280, c);
      m.set({ E: 0, n: [0, 0], S: 0, D: FAC - 2 }); m.r(84, 24, 196, SW - 24, bet); m.noise(84, 24, 196, SW - 24, bd, 0.1, P.seed);
      for (let i = 0; i < 9; i++) m.vl(84 + Math.floor(h01(i * 4.7 + P.seed) * 196), 32, 8 + Math.floor(h01(i * 2.3) * 24), bd, 0.45);
      for (let f = 0; f < 4; f++) { const y = 37 + f * 16;
        for (let x = 88; x < 276; x += 13) { const al = nuit && h01(x * 1.9 + f * 5.3 + P.seed) < 0.45; m.set({ E: al ? 205 : 0, S: al ? 0 : 215 }); m.r(x, y, 12, 8, al ? "#dcecff" : "#28313e"); m.set({ E: 0, S: 0 }); m.vl(x + 12, y, 8, "#4a5058"); if (al && h01(x + f) < 0.5) { m.set({ E: 80 }); m.r(x + 2, y + 4, 4, 4, "#2a3440"); m.set({ E: 0 }); } }
        m.set({ n: [0, -0.7] }); m.r(84, y + 8, 196, 2, bl); m.set({ n: [0, 0] }); m.hl(84, y - 1, 196, bd);
      }
      m.set({ n: [0, -0.7] }); m.r(82, 21, 200, 3, bl); m.set({ n: [0, 0] });
      // rez-de-chaussée vitré, auvent, enseigne, drapeau
      m.set({ E: nuit ? 170 : 20, S: nuit ? 0 : 215 }); m.r(88, SW - 20, 188, 20, nuit ? "#e6f1ff" : "#4f5d6e"); m.set({ E: nuit ? 100 : 0, S: 0 }); for (let x = 88; x < 276; x += 16) m.vl(x, SW - 20, 20, nuit ? "#8fa6c0" : "#c9cdd0");
      m.set({ E: 0, n: [0, -0.7], S: 60 }); m.r(150, SW - 26, 64, 3, "#eef1f4"); m.set({ n: [0, 0] }); m.r(152, SW - 23, 2, 23, "#8d949c"); m.r(210, SW - 23, 2, 23, "#8d949c");
      m.r(168, SW - 20, 28, 20, "#2c3440"); m.set({ E: 220 }); m.r(170, SW - 18, 11, 18, "#f2f8ff"); m.r(183, SW - 18, 11, 18, "#f2f8ff"); m.set({ E: 0 });
      plaque(m, P.enseigne || "JUSTICE", 182, SW - 38, "#ffffff", "#1f3f9a", false, false);
      m.set({ E: 0, S: 0 }); m.r(132, 30, 100, 9, bet); ecrire(m, "MINISTÈRE DE LA JUSTICE", 136, 33, "#5a564c", 1);
      L.push({ x: OX + 182, y: SW - 10, d: FAC - 24, r: 110, c: [0.86, 0.94, 1], i: nuit ? 1.5 : 0.2, wrap: 0.6, haze: nuit ? 0.14 : 0, hr: 30 });
    },
    vif(m, t, still) { drapeau(m, 122, SW - 52, t, still); },
  };

  // ============================================================ fabrique et table des lieux
  function fabrique(P) {
    const F = FAM[P.fam];
    return {
      H, REF,
      make(W) {
        const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
        stat.ox = work.ox = OX;
        let key = "", fixes = [], c = null; const Q = Object.assign({}, P);
        return {
          W, H, mat: work,
          frame(t, o) {
            o = o || {}; const still = !!o.reduce, min = o.min == null ? 600 : o.min;
            const k2 = [Math.floor(min / 10), o.rain ? 1 : 0, o.season || "", o.nom || "", o.plaque || ""].join("|");
            if (k2 !== key) {
              key = k2; c = K.heure(o); fixes = [];
              ciel(stat, W, c, P.seed); rue(stat, W, c, P); F.fixe(stat, W, c, o, Q, fixes, OX);
              for (const x of P.arbres || [58, 304]) arbre(stat, x, c, o.season, P.seed + x);
              for (const x of P.lampes || [30, 238, 336]) reverbere(stat, x, c, fixes, OX);
            }
            const m = work; m.copy(stat);
            const lum = lumieres(c, OX, W), L = lum.L.concat(fixes);
            F.vif(m, t, still, c, o, Q, L, OX);
            if (P.anim && ANIM[P.anim]) ANIM[P.anim](m, t, still, c, Q, L, OX, W);
            passants(m, W, t, still, c, P.seed); if (!P.eau) voiture(m, W, t, still, c, L, OX, P.seed); pluie(m, W, t, still, c);
            return { t, floorY: P.eau ? RD + 9 : RD, reflK: P.eau ? 0.8 : 1.15, wet: P.eau ? 0.8 : c.rain ? 0.85 : 0.3, grain: 0.03, vig: 0.42, bloom: 0.55 + (1 - c.sun) * 0.6, tint: c.sun > 0.5 ? [1, 1, 1] : [0.94, 0.98, 1.08], amb: lum.amb, lights: L };
          },
        };
      },
    };
  }
  const LIEUX = {
    commissariat: { fam: "poste", seed: 3, lampes: [34, 304] },
    gendarmerie: { fam: "poste", seed: 11, gend: true, arbres: [52, 318], lampes: [30, 300] },
    palais: { fam: "tour", seed: 5, anim: "tram", arbres: [40, 322], lampes: [20, 112, 252, 340] },
    cite: { fam: "pierre", seed: 7, anim: "pigeons", pig: 140, fronton: true, fleche: true, grille: true, arbres: [], lampes: [84, 280] },
    ordre: { fam: "pierre", seed: 13, anim: "pigeons", pig: 210, cols: 4, enseigne: "MAISON DU BARREAU", drapeau: 96, arbres: [44, 320] },
    umj: { fam: "pierre", seed: 17, anim: "ambulance", cols: 5, enseigne: "HÔTEL-DIEU", bg: "#3a2e26", urgences: true, arbres: [48], lampes: [30, 336] },
    spip: { fam: "moderne", seed: 19, anim: "velo", enseigne: "SPIP DE PARIS" },
    cj: { fam: "rue", seed: 23, anim: "velo", plaque: true },
    sante: { fam: "prison", seed: 29, anim: "file", mur: "#a39880", nom: "MAISON D'ARRÊT", arbres: [330], lampes: [40, 244], parloirs: true, zebra: false },
    fresnes: { fam: "prison", seed: 31, anim: "file", mur: "#b08a6e", nom: "CENTRE PÉNITENTIAIRE", arbres: [], lampes: [36, 250], parloirs: true, zebra: false },
    fleury: { fam: "prison", seed: 37, anim: "file", mur: "#b4b1a8", nom: "FLEURY-MÉROGIS", arbres: [], lampes: [36, 250], parloirs: true, zebra: false },
    melun: { fam: "prison", seed: 41, anim: "peniche", eau: true, mur: "#c2b594", nom: "CENTRE DE DÉTENTION", arbres: [326, 344], lampes: [40, 246], mirador: false, zebra: false },
    poissy: { fam: "prison", seed: 43, mur: "#9c8f7a", nom: "MAISON CENTRALE", arbres: [334], lampes: [38, 248], zebra: false },
    faits: { fam: "rue", seed: 47, anim: "pigeons", pig: 96, enseigne: "nom" },
    rue: { fam: "rue", seed: 53, anim: "pigeons", pig: 250 },
  };
  for (const k in LIEUX) PLANS[k] = fabrique(LIEUX[k]);
  CR.planExt = { LIEUX, FAM, ANIM };
})();
