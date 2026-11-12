/* La Permanence — plan « le cabinet » (CR.plans.cabinet), refonte.
   Vue depuis le fauteuil de l'avocat : le bureau au premier plan (lampe, écran, téléphone, dossiers, agenda),
   la pièce derrière (bibliothèque de codes, plan du métro, fenêtre sur les toits, robe, porte).
   360 × 225 pixels au centre, prolongé sur les côtés selon l'écran. La lumière suit l'heure du jeu.
   Le haut (rangées 0 à 18) est prévu pour passer sous l'en-tête, la gauche (0 à 46) sous la navigation,
   le bas (rangées 152 et plus) sous le panneau du jour.
   make(W) → { W, H, mat, hot, frame(t, o) } ; o : min, rain, unread, ringing, voicemail, files, hover, reduce. */
(function () {
  const CR = window.CR, G = CR.gpu, PL = CR.lum;
  const PLANS = (CR.plans = CR.plans || {});
  const H = 225, REF = 360, WALL = 200, DESK = 112;
  const h01 = PL.h01, mix = PL.mix;
  const HOT = [
    { id: "bibliotheque", label: "Bibliothèque", x: 52, y: 18, w: 72, h: 90 },
    { id: "carte", label: "Carte de Paris", x: 130, y: 31, w: 32, h: 33 },
    { id: "messagerie", label: "Messagerie", x: 110, y: 70, w: 62, h: 50 },
    { id: "telephone", label: "Téléphone", x: 192, y: 100, w: 42, h: 24 },
    { id: "dossiers", label: "Dossiers", x: 244, y: 92, w: 52, h: 32 },
    { id: "agenda", label: "Agenda", x: 146, y: 127, w: 72, h: 23 },
  ];
  const BOOKS = ["#a8262b", "#a8262b", "#8f1f26", "#27407a", "#a8262b", "#1f3566", "#d9cfb4", "#2f6b4a", "#a8262b", "#7a1b20", "#c9a24a", "#27407a"];
  const CHEMISES = ["#e3d3a2", "#9db6d6", "#e2a9a0", "#a9cfa6", "#ead27a", "#d8c4e6", "#e3d3a2", "#f0b98a"];

  const deskX = (y) => { const k = (y - DESK) * 0.9; return [Math.round(24 - k), Math.round(336 + k)]; };
  const deskD = (y) => Math.round(112 - Math.min(1, (y - DESK) / 100) * 96);

  function decor(m, W) {
    const X0 = -m.ox;
    // mur crème, moulures, soubassement
    m.set({ E: 0, n: [0, 0], S: 0, D: WALL });
    m.r(X0, 0, W, 108, "#cfc6b0");
    m.noise(X0, 6, W, 72, "#c7bea8", 0.2, 5); m.noise(X0, 6, W, 72, "#d6cdb8", 0.1, 11);
    m.r(X0, 0, W, 5, "#e3dccb"); m.hl(X0, 5, W, "#a69d87"); m.hl(X0, 6, W, "#ded6c2");
    m.r(X0, 78, W, 30, "#beb49b"); m.hl(X0, 77, W, "#e3dccb"); m.hl(X0, 78, W, "#9d947d");
    for (let x = Math.ceil((X0 + 6) / 44) * 44; x < X0 + W; x += 44) { m.r(x, 83, 36, 19, "#b5ab92"); m.hl(x, 83, 36, "#9d947d"); m.vl(x, 83, 19, "#9d947d"); m.hl(x, 101, 36, "#d2c9b2"); m.vl(x + 35, 83, 19, "#d2c9b2"); }
    m.r(X0, 104, W, 4, "#8d846e"); m.hl(X0, 104, W, "#a69d87");
    // parquet (visible de part et d'autre du bureau)
    for (let y = 108; y < H; y++) { m.set({ n: [0, -1], S: 70, D: Math.round(WALL * (1 - (y - 108) / (H - 108))) }); for (let x = X0; x < X0 + W; x++) m.px(x, y, ((x + (y >> 3) * 9) % 22 === 0 || y % 8 === 0) ? "#5c4029" : PL.h2(x >> 2, y >> 3) < 0.3 ? "#7d5b3b" : "#866342"); }
    // bibliothèque de codes
    m.set({ n: [0, 0], S: 20, D: 192 });
    m.r(52, 18, 72, 90, "#3a271a"); m.r(54, 20, 68, 86, "#22160f");
    m.set({ n: [-0.5, 0] }); m.vl(52, 18, 90, "#5a3e29"); m.set({ n: [0, -0.5] }); m.hl(52, 18, 72, "#5a3e29"); m.set({ n: [0, 0] });
    for (let r = 0; r < 5; r++) {
      const base = 36 + r * 17;
      m.set({ D: 192, S: 20 }); m.r(54, base, 68, 2, "#4a3322"); m.hl(54, base, 68, "#63452e");
      let x = 55;
      while (x < 119) {
        const k = h01(x * 3.3 + r * 17.7), w = 2 + Math.floor(h01(x * 1.9 + r) * 3), hh = 10 + Math.floor(h01(x * 5.1 + r * 3) * 5);
        if (k < 0.07) { x += 3; continue; }
        const col = BOOKS[Math.floor(h01(x * 7.7 + r * 2.3) * BOOKS.length)];
        m.set({ D: 190, S: 30 }); m.r(x, base - hh, w, hh, col);
        m.set({ n: [-0.5, 0] }); m.vl(x, base - hh, hh, mix(PL.rgb(col), [255, 255, 255], 0.22)); m.set({ n: [0, 0] });
        if (w > 2) { m.hl(x + 1, base - hh + 2, w - 1, "#e8d9a0", 0.8); m.hl(x + 1, base - 3, w - 1, "#e8d9a0", 0.5); }
        x += w + (h01(x * 2.1) < 0.12 ? 1 : 0);
      }
    }
    // plan du métro encadré, diplôme
    m.set({ D: 198, S: 40 }); m.r(131, 32, 30, 30, "#b08a3c"); m.r(133, 34, 26, 26, "#efe9d8");
    for (const [x0, y0, x1, y1, c] of [[134, 40, 158, 52, "#f2c230"], [135, 56, 157, 38, "#d2432f"], [134, 47, 158, 44, "#2f6fbf"], [140, 35, 152, 59, "#2f9c5a"], [134, 54, 158, 57, "#8d4fa8"], [146, 35, 157, 50, "#e58a2f"]]) m.line(x0, y0, x1, y1, c);
    m.px(146, 46, "#1b1f26"); m.px(147, 46, "#1b1f26");
    m.r(134, 68, 24, 9, "#4a3322"); m.r(135, 69, 22, 7, "#f1ecdc"); m.hl(138, 71, 16, "#8a8f98"); m.hl(140, 73, 12, "#8a8f98"); m.px(154, 74, "#b33a32");
    // porte-manteau et robe
    m.set({ D: 180, S: 30 }); m.r(281, 26, 2, 82, "#3a271a"); m.r(274, 104, 16, 3, "#3a271a"); m.r(276, 27, 12, 2, "#5a3e29");
    m.set({ D: 178, S: 10 });
    for (let y = 31; y < 100; y++) { const half = Math.round(5 + Math.min(1, (y - 31) / 30) * 6); for (let x = 282 - half; x <= 282 + half; x++) { m.nx = Math.round((x - 282) / (half + 1) * 0.7 * 127 + 128); m.px(x, y, (x + y) % 7 === 0 ? "#1c1f27" : "#13151b"); } }
    m.nx = 128; m.r(280, 33, 4, 12, "#e9e6dc"); m.vl(282, 33, 12, "#c9c6bc");
    // porte
    m.set({ D: WALL, S: 30, n: [0, 0] }); m.r(303, 12, 46, 96, "#e3dccb"); m.r(306, 15, 40, 93, "#7a5536");
    for (const [y, hh] of [[19, 34], [58, 44]]) { m.r(310, y, 32, hh, "#6b4a2f"); m.hl(310, y, 32, "#553a24"); m.vl(310, y, hh, "#553a24"); m.hl(310, y + hh - 1, 32, "#8d6542"); m.vl(341, y, hh, "#8d6542"); }
    m.set({ S: 120 }); m.r(309, 60, 3, 2, "#d9b55a"); m.px(310, 63, "#a8862f");
    // le bureau : plateau de bois en perspective, sous-main de cuir
    for (let y = DESK; y < H; y++) {
      const [x0, x1] = deskX(y);
      m.set({ n: [0, -0.86], S: 80, D: deskD(y) });
      for (let x = Math.max(X0, x0); x <= Math.min(X0 + W - 1, x1); x++) { const g = PL.h2((x + y * 2) >> 3, y); m.px(x, y, g < 0.14 ? "#5f3f27" : g > 0.9 ? "#7c5536" : "#6d4a2e"); }
    }
    m.set({ n: [0, -0.5], S: 90, D: 113 }); m.hl(24, DESK - 1, 313, "#94694a"); m.set({ D: 112 }); m.hl(24, DESK, 313, "#825a3c");
    for (let y = 124; y < 152; y++) { const k = (y - 124) / 28, x0 = Math.round(118 - 10 * k), x1 = Math.round(246 + 10 * k); m.set({ n: [0, -0.86], S: 40, D: deskD(y) }); for (let x = x0; x <= x1; x++) m.px(x, y, y === 124 || x === x0 || x === x1 ? "#b08a3c" : PL.h2(x, y) < 0.1 ? "#1d4a35" : "#1f533b"); }
    // lampe de banquier (corps)
    m.set({ n: [0, 0], S: 140, D: 98 }); m.orb(88, 119, 10, 3, "#b08a3c", 0.6); m.r(87, 101, 2, 18, "#c9a24a"); m.px(87, 101, "#e9cf7a");
    // écran : pied, dalle
    m.set({ n: [0, 0], S: 50, D: 102 }); m.orb(141, 119, 12, 3, "#23272e", 0.5); m.r(139, 108, 4, 11, "#2c3038");
    m.r(111, 72, 60, 37, "#15181d"); m.set({ n: [0, -0.5] }); m.hl(111, 72, 60, "#3a404a"); m.set({ n: [0, 0] });
    // clavier
    for (let y = 121; y < 125; y++) { const sh = (y - 121); m.set({ n: [0, -0.8], S: 30, D: deskD(y) }); for (let x = 118 - sh; x < 166 + sh; x++) m.px(x, y, (x % 3 === 0 || y === 121) ? "#2c3038" : "#484e59"); }
    // téléphone (socle)
    for (let y = 108; y < 122; y++) { const k = (y - 108) / 14; m.set({ n: [0, -0.6], S: 60, D: deskD(y) + 4 }); for (let x = Math.round(198 - 2 * k); x <= Math.round(230 + 2 * k); x++) m.px(x, y, y < 110 ? "#3a3f48" : "#22252b"); }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) m.px(213 + c * 4, 112 + r * 3, "#8d94a0");
    m.r(212, 109, 12, 2, "#5d7a66");
    // tasse
    m.set({ n: [0, 0], S: 100, D: 70 }); m.r(232, 128, 9, 8, "#eeeae0"); m.set({ n: [0.6, 0] }); m.vl(240, 128, 8, "#bdb9af"); m.r(241, 130, 2, 4, "#d9d5cb"); m.set({ n: [0, -0.8] }); m.hl(233, 128, 7, "#3a2416"); m.hl(232, 127, 9, "#fbf8f0"); m.set({ n: [0, 0] });
    // stylo, balance de laiton
    m.set({ S: 120, D: 60 }); m.line(226, 142, 240, 139, "#1f2a52"); m.px(241, 139, "#d9b55a");
    m.set({ S: 150, D: 100 }); m.r(60, 112, 10, 2, "#b08a3c"); m.r(64, 96, 2, 16, "#c9a24a"); m.hl(54, 97, 22, "#d9b55a"); m.px(65, 95, "#e9cf7a");
    for (const x of [55, 74]) { m.vl(x, 98, 6, "#8d7333"); m.hl(x - 3, 104, 7, "#c9a24a"); m.hl(x - 2, 105, 5, "#a8862f"); }
  }

  PLANS.cabinet = {
    H, REF, HOT,
    make(W) {
      const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
      stat.ox = work.ox = OX;
      decor(stat, W);
      const drops = []; for (let i = 0; i < 26; i++) drops.push({ x: 172 + Math.floor(h01(i * 4.4) * 76), y: h01(i * 2.9) * 72, v: 30 + h01(i * 8.2) * 40 });
      const roofs = []; { let x = 170; while (x < 252) { const w = 9 + Math.floor(h01(x * 1.3) * 12); roofs.push({ x, w, top: 80 + Math.floor(h01(x * 2.7) * 9) }); x += w; } }
      return {
        W, H, mat: work, hot: HOT, ox: OX,
        frame(t, o) {
          o = o || {};
          const m = work, still = !!o.reduce;
          m.copy(stat);
          const hr = ((o.min == null ? 600 : o.min) % 1440) / 60;
          const sun0 = hr < 6.5 || hr > 20 ? 0 : hr < 8 ? (hr - 6.5) / 1.5 : hr < 17 ? 1 : 1 - (hr - 17) / 3, rain = o.rain ? 1 : 0;
          const sun = sun0 * (1 - 0.4 * rain), dusk = Math.max(0, 1 - Math.abs(hr - 18.7) / 1.7, (1 - Math.abs(hr - 7.2) / 1.2) * 0.6) * (1 - 0.6 * rain);
          const lampOn = sun < 0.8;
          // la fenêtre : ciel, toits, lumières de la ville, pluie, menuiserie, rideaux
          let top = mix([9, 13, 32], [92, 148, 214], sun0), bot = mix([40, 34, 60], [196, 218, 236], sun0);
          top = mix(top, [74, 70, 124], dusk * 0.8); bot = mix(bot, [244, 150, 88], dusk);
          if (rain) { top = mix(top, mix([18, 22, 34], [128, 136, 148], sun0), 0.75); bot = mix(bot, mix([36, 38, 50], [160, 168, 178], sun0), 0.75); }
          const skyE = 40 + sun0 * 78 + dusk * 50;
          for (let y = 22; y < 100; y++) { m.set({ E: Math.round(skyE), n: [0, 0], S: 0, D: 255 }); m.hl(171, y, 78, mix(top, bot, Math.pow((y - 22) / 78, 1.4))); }
          if (sun0 > 0.3 && !rain) { m.set({ E: Math.round(skyE) }); for (const [cx, cy, rx] of [[190, 38, 12], [200, 41, 9], [232, 52, 10], [224, 55, 13]]) m.ell(cx + (still ? 0 : (t * 0.12) % 6), cy, rx, 3, [250, 250, 252], 0.5 * sun0); }
          // tour Eiffel au loin, toits de zinc, fenêtres allumées
          const far = mix([24, 26, 46], [128, 142, 168], sun0), zinc = mix([20, 22, 36], [96, 106, 126], sun0 * 0.9 + dusk * 0.15);
          m.set({ E: Math.round(20 + sun0 * 70 + (sun0 < 0.3 ? 120 : 0)) });
          const eif = sun0 < 0.3 ? [232, 176, 84] : far;
          for (let y = 52; y < 84; y++) { const k = (y - 52) / 32, half = Math.round(k * k * 5); if (half > 1) m.hl(236 - half, y, half * 2 + 1, eif, y < 74 ? 0.55 : 0.22); m.hl(236 - half, y, 1, eif); if (half) m.hl(236 + half, y, 1, eif); if (y === 62 || y === 72) m.hl(236 - half - 1, y, half * 2 + 3, eif); }
          m.vl(236, 46, 6, eif);
          for (const r of roofs) {
            m.set({ E: Math.round(14 + sun0 * 70) }); m.r(r.x, r.top, r.w, 100 - r.top, zinc); m.hl(r.x, r.top, r.w, mix(zinc, [255, 255, 255], 0.18));
            m.r(r.x + 2, r.top - 4, 2, 4, mix(zinc, [120, 60, 40], 0.5));
            if (sun0 < 0.55) for (let k = 0; k < 3; k++) { const wx = r.x + 2 + k * 4, wy = r.top + 4 + Math.floor(h01(r.x + k * 3.1) * 6); if (wx < r.x + r.w - 2 && h01(r.x * 1.7 + k * 9.3 + Math.floor(hr)) < 0.5 - sun0 * 0.5) { m.set({ E: 230 }); m.r(wx, wy, 2, 3, "#ffd27a"); } }
          }
          if (rain) { m.set({ E: Math.round(skyE * 0.8 + 40) }); for (const d of drops) { const y = 22 + (d.y + (still ? 0 : t * d.v)) % 76; m.vl(d.x, y, 3, [190, 204, 228], 0.5); } }
          m.set({ E: 0, n: [0, 0], S: 60, D: 198 });
          m.r(168, 19, 84, 3, "#ebe6d8"); m.r(168, 100, 84, 4, "#ebe6d8"); m.r(168, 19, 3, 84, "#ebe6d8"); m.r(249, 19, 3, 84, "#ebe6d8"); m.r(208, 22, 4, 78, "#ebe6d8"); m.hl(171, 48, 78, "#ded9cb"); m.hl(171, 74, 78, "#ded9cb");
          m.vl(209, 22, 78, "#bdb7a6"); m.r(207, 60, 2, 5, "#b08a3c"); m.set({ n: [0, -0.6] }); m.hl(166, 104, 88, "#f4f0e4"); m.set({ n: [0, 0] });
          m.set({ S: 0, D: 194 });
          for (const [x0, dir] of [[156, 1], [252, -1]]) for (let y = 15; y < 106; y++) for (let x = 0; x < 13; x++) { const f = Math.sin((x + (dir > 0 ? 0 : 3)) * 1.25); m.nx = Math.round(f * 0.6 * 127 + 128); m.px(x0 + x, y, f > 0.3 ? "#8d2630" : f < -0.4 ? "#5c151d" : "#761c26"); }
          m.nx = 128; m.set({ S: 100 }); m.r(152, 13, 116, 2, "#b08a3c");
          // l'écran : la messagerie
          const un = o.unread || 0;
          m.set({ E: 150, n: [0, 0], S: 0, D: 101 }); m.r(113, 74, 56, 31, "#b4bccb"); m.r(113, 74, 56, 5, "#1f3566"); m.r(113, 79, 14, 26, "#8f9bb2");
          m.set({ E: 150 }); for (let i = 0; i < 6; i++) { const y = 82 + i * 4, neuf = i < Math.min(6, un); m.hl(129, y, 22 + Math.floor(h01(i * 3.3) * 14), neuf ? "#141b33" : "#7c879c"); if (neuf) { m.set({ E: 255 }); m.r(165, y - 1, 2, 2, "#e0503a"); m.set({ E: 150 }); } }
          for (let i = 0; i < 4; i++) m.hl(115, 82 + i * 5, 9, "#66738c");
          if (un) { m.set({ E: 255 }); m.r(160, 75, 8, 3, "#e0503a"); }
          // la lampe : abat-jour vert, allumée dès que le jour baisse
          m.set({ E: lampOn ? 120 : 0, S: 150, D: 97 }); m.orb(88, 99, 15, 5, "#1f7a4f", 0.8); m.set({ n: [0, -0.7] }); m.hl(77, 95, 22, "#3fa373"); m.set({ n: [0, 0] });
          if (lampOn) { m.set({ E: 255, S: 0 }); m.hl(76, 104, 25, "#fff0c0"); }
          // le combiné : il tressaute quand ça sonne ; voyant de messagerie
          const ring = !!o.ringing, jig = ring && !still ? Math.round(Math.sin(t * 46)) : 0;
          m.set({ E: 0, S: 90, D: 86 }); m.tube(200 + jig, 111, 208 + jig, 120, 5, "#2e323a"); m.orb(200 + jig, 110, 4, 3, "#3a3f48", 0.7); m.orb(208 + jig, 120, 4, 3, "#3a3f48", 0.7);
          const led = ring ? (still || Math.floor(t * 6) % 2 === 0) : o.voicemail ? (still || t % 2 < 1) : false;
          m.set({ E: led ? 255 : 0, S: 0 }); m.r(226, 110, 2, 2, led ? "#ff4a36" : "#5a2a26");
          // la pile de dossiers : autant de chemises que de dossiers ouverts
          const nf = Math.max(1, Math.min(9, 1 + (o.files || 0)));
          for (let i = 0; i < nf; i++) {
            const y = 119 - i * 3, sh = Math.round((h01(i * 5.3) - 0.5) * 6), col = CHEMISES[i % CHEMISES.length];
            m.set({ E: 0, n: [0, 0], S: 20, D: 84 }); m.r(250 + sh, y, 40, 3, mix(PL.rgb(col), [0, 0, 0], 0.22)); m.hl(250 + sh, y, 40, col);
            if (i === nf - 1) { m.set({ n: [0, -0.86] }); for (let q = 0; q < 5; q++) m.hl(250 + sh - q + 4, y - 5 + q, 40, col); m.r(262 + sh, y - 4, 14, 3, "#f4f0e4"); m.hl(264 + sh, y - 3, 9, "#7d8087"); }
          }
          // l'agenda ouvert sur le sous-main
          for (let y = 130; y < 147; y++) { const k = (y - 130) / 17, x0 = Math.round(152 - 5 * k), x1 = Math.round(212 + 5 * k), mid = 182; m.set({ E: 0, n: [0, -0.86], S: 20, D: deskD(y) - 2 }); for (let x = x0; x <= x1; x++) m.px(x, y, x === mid ? "#b9b29c" : x === x0 || x === x1 || y === 146 ? "#3a271a" : (y % 3 === 1 && Math.abs(x - mid) > 3 && x > x0 + 3 && x < x1 - 3 && h01(x * 0.7 + y * 3.1) < 0.72) ? "#8e97a8" : "#f1ecdc"); }
          m.r(186, 131, 10, 2, "#b33a32"); m.vl(196, 130, 19, "#b33a32");
          // vapeur du café
          if (!still) { m.set({ E: 0, S: 0, D: 68 }); for (let i = 0; i < 5; i++) { const p = (t * 0.35 + i * 0.2) % 1; m.px(236 + Math.round(Math.sin(p * 7 + i) * 2), 126 - Math.round(p * 12), [240, 240, 240], 0.3 * (1 - p)); } }
          // objet survolé : coins dorés
          const hv = o.hover && HOT.find((h) => h.id === o.hover);
          if (hv) { m.set({ E: 255, S: 0 }); const c = "#ffd27a", a = hv.x - 2, b = hv.y - 2, c2 = hv.x + hv.w + 1, d2 = hv.y + hv.h + 1; for (const [x, y, sx, sy] of [[a, b, 1, 1], [c2, b, -1, 1], [a, d2, 1, -1], [c2, d2, -1, -1]]) { m.hl(sx > 0 ? x : x - 5, y, 6, c); m.vl(x, sy > 0 ? y : y - 5, 6, c); } }
          // lumières
          const day = mix([0.1, 0.115, 0.17], [0.5, 0.5, 0.49], sun), amb = [day[0] + dusk * 0.16, day[1] + dusk * 0.08, day[2] + dusk * 0.05];
          const skyc = mix(mix([0.35, 0.45, 0.9], [1, 0.98, 0.92], sun0), [1, 0.62, 0.34], dusk);
          const lights = [
            { x: OX + 210, y: 56, d: 188, r: 400, c: skyc, i: 0.2 + sun * 0.62 + dusk * 0.7, wrap: 0.7, haze: 0.04 + sun0 * 0.05 + dusk * 0.08, hr: 70 },
            { x: OX + 210, y: 30, d: 120, r: 300, c: skyc, i: sun * 0.42 + dusk * 0.4, wrap: 0.2 },
            { x: OX + 180, y: -30, d: 90, r: 440, c: [1, 0.86, 0.66], i: (1 - sun) * 0.85, wrap: 0.6 },
            { x: OX + 141, y: 96, d: 84, r: 96, c: [0.62, 0.76, 1], i: 0.5 + (1 - sun) * 0.6, wrap: 0.5 },
          ];
          if (lampOn) lights.push({ x: OX + 88, y: 106, d: 92, r: 190, c: [1, 0.78, 0.44], i: 2.3 * (1 - sun * 0.7), wrap: 0.4, haze: 0.22 * (1 - sun * 0.7), hr: 46 });
          if (ring) lights.push({ x: OX + 226, y: 108, d: 80, r: 70, c: [1, 0.25, 0.15], i: led ? 1.6 : 0.2, wrap: 0.6, haze: led ? 0.2 : 0, hr: 22 });
          return { t, floorY: DESK, reflK: 0.9, wet: 0.3, grain: 0.03, vig: 0.4, bloom: 0.55 + (1 - sun) * 0.6, tint: sun > 0.5 ? [1, 1, 1] : [0.94, 0.98, 1.08], amb, lights };
        },
      };
    },
  };
})();
