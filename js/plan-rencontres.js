/* La Permanence — plans des rencontres avec le client (refonte) : CR.plans.rdv (le rendez-vous au cabinet, vu de
   votre fauteuil : sert aussi à la discussion des honoraires), CR.plans.parloir (le parloir avocat d'une prison,
   par-dessus l'épaule) et CR.plans.appel (la personne qui vous appelle, chez elle, le téléphone à l'oreille).
   360 × 225 ; l'interface couvre le bas (rangées 128 et plus) : ce qui compte est en haut.
   o : min, rain, look (la personne), expr, talk (elle parle), live, you (look de l'avocat), reduce. */
(function () {
  const CR = window.CR, G = CR.gpu, PL = CR.lum, K = CR.planKit;
  const PLANS = (CR.plans = CR.plans || {});
  const H = 225, REF = 360, h01 = PL.h01, mix = PL.mix;
  const BOOKS = ["#a8262b", "#8f1f26", "#27407a", "#a8262b", "#1f3566", "#d9cfb4", "#2f6b4a", "#7a1b20", "#c9a24a", "#27407a", "#a8262b"];

  // heure → jour (0 nuit, 1 plein jour), crépuscule, couleurs du ciel
  function heure(o) {
    const hr = ((o.min == null ? 600 : o.min) % 1440) / 60, rain = o.rain ? 1 : 0;
    const sun0 = hr < 6.5 || hr > 20 ? 0 : hr < 8 ? (hr - 6.5) / 1.5 : hr < 17 ? 1 : 1 - (hr - 17) / 3;
    const dusk = Math.max(0, 1 - Math.abs(hr - 18.7) / 1.7, (1 - Math.abs(hr - 7.2) / 1.2) * 0.6) * (1 - 0.6 * rain);
    let top = mix([9, 13, 32], [92, 148, 214], sun0), bot = mix([40, 34, 60], [196, 218, 236], sun0);
    top = mix(top, [74, 70, 124], dusk * 0.8); bot = mix(bot, [244, 150, 88], dusk);
    if (rain) { top = mix(top, mix([18, 22, 34], [128, 136, 148], sun0), 0.75); bot = mix(bot, mix([36, 38, 50], [160, 168, 178], sun0), 0.75); }
    const skyc = mix(mix([0.35, 0.45, 0.9], [1, 0.98, 0.92], sun0), [1, 0.62, 0.34], dusk);
    return { hr, rain, sun0, sun: sun0 * (1 - 0.4 * rain), dusk, top, bot, skyE: 40 + sun0 * 78 + dusk * 50, skyc };
  }
  const parle = (o) => !!o.talk || K.talks(o.live, "client");
  // vitre : ciel en dégradé, toits et fenêtres allumées, pluie
  function vitre(m, x, y, w, h, c, t, still, roofs, drops) {
    for (let yy = y; yy < y + h; yy++) { m.set({ E: Math.round(c.skyE), n: [0, 0], S: 0, D: 255 }); m.hl(x, yy, w, mix(c.top, c.bot, Math.pow((yy - y) / h, 1.4))); }
    if (c.sun0 > 0.3 && !c.rain) for (const [u, v, rx] of [[0.2, 0.2, 12], [0.34, 0.26, 8], [0.76, 0.4, 11]]) m.ell(x + u * w + (still ? 0 : (t * 0.1) % 5), y + v * h, rx, 3, [250, 250, 252], 0.5 * c.sun0);
    const zinc = mix([20, 22, 36], [96, 106, 126], c.sun0 * 0.9 + c.dusk * 0.15);
    for (const r of roofs || []) {
      m.set({ E: Math.round(14 + c.sun0 * 70) }); m.r(r.x, r.top, r.w, y + h - r.top, zinc); m.hl(r.x, r.top, r.w, mix(zinc, [255, 255, 255], 0.18)); m.r(r.x + 2, r.top - 4, 2, 4, mix(zinc, [120, 60, 40], 0.5));
      if (c.sun0 < 0.55) for (let k = 0; k < 3; k++) { const wx = r.x + 2 + k * 4, wy = r.top + 4 + Math.floor(h01(r.x + k * 3.1) * 6); if (wx < r.x + r.w - 2 && wy < y + h - 3 && h01(r.x * 1.7 + k * 9.3 + Math.floor(c.hr)) < 0.5 - c.sun0 * 0.5) { m.set({ E: 230 }); m.r(wx, wy, 2, 3, "#ffd27a"); } }
    }
    if (c.rain && drops) { m.set({ E: Math.round(c.skyE * 0.8 + 40) }); for (const d of drops) m.vl(x + d.x, y + (d.y + (still ? 0 : t * d.v)) % (h - 3), 3, [190, 204, 228], 0.5); }
    m.set({ E: 0 });
  }
  const gouttes = (n, w, h, s) => { const a = []; for (let i = 0; i < n; i++) a.push({ x: Math.floor(h01(i * 4.4 + s) * w), y: h01(i * 2.9 + s) * h, v: 28 + h01(i * 8.2 + s) * 40 }); return a; };
  const toits = (x0, x1, base, s) => { const a = []; let x = x0; while (x < x1) { const w = Math.min(x1 - x, 9 + Math.floor(h01(x * 1.3 + s) * 12)); a.push({ x, w, top: base + Math.floor(h01(x * 2.7 + s) * 9) }); x += w; } return a; };
  // avant-bras posés sur une table, mains jointes
  function bras(m, img, x, y, D) {
    const sl = K.sample(img, 10, 61), sk = K.sample(img, 32, 34), cuff = mix(sl, [0, 0, 0], 0.25);
    m.set({ E: 0, S: 0, D });
    m.tube(x + 5, y + 62, x + 24, y + 70, 7, sl); m.tube(x + 59, y + 62, x + 40, y + 70, 7, sl);
    m.tube(x + 23, y + 69, x + 26, y + 70, 7, cuff); m.tube(x + 41, y + 69, x + 38, y + 70, 7, cuff);
    m.orb(x + 32, y + 70, 7, 4, sk, 0.7); m.hl(x + 28, y + 70, 9, mix(sk, [0, 0, 0], 0.3), 0.6);
  }
  // plateau en perspective : bord lointain y0 de x0 à x1, s'élargit de e pixels jusqu'à y1
  function plateau(m, x0, x1, y0, y1, e, d0, d1, colA, colB, S) {
    for (let y = y0; y < y1; y++) { const k = (y - y0) / (y1 - y0), a = Math.round(x0 - e * k), b = Math.round(x1 + e * k); m.set({ E: 0, n: [0, -0.86], S: S == null ? 90 : S, D: Math.round(d0 + (d1 - d0) * k) }); for (let x = a; x <= b; x++) m.px(x, y, PL.h2((x + y * 2) >> 3, y) < 0.16 ? colA : colB); }
  }

  // ------------------------------------------------------------ rendez-vous au cabinet
  const DESK = 120;
  function cabinet(m, W) {
    const X0 = -m.ox, WALL = 200;
    m.set({ E: 0, n: [0, 0], S: 0, D: WALL });
    m.r(X0, 0, W, 108, "#cfc6b0"); m.noise(X0, 6, W, 70, "#c7bea8", 0.2, 5); m.noise(X0, 6, W, 70, "#d6cdb8", 0.1, 11);
    m.r(X0, 0, W, 5, "#e3dccb"); m.hl(X0, 5, W, "#a69d87"); m.hl(X0, 6, W, "#ded6c2");
    m.r(X0, 78, W, 30, "#beb49b"); m.hl(X0, 77, W, "#e3dccb"); m.hl(X0, 78, W, "#9d947d");
    for (let x = Math.ceil((X0 + 6) / 44) * 44; x < X0 + W; x += 44) { m.r(x, 83, 36, 19, "#b5ab92"); m.hl(x, 83, 36, "#9d947d"); m.vl(x, 83, 19, "#9d947d"); m.hl(x, 101, 36, "#d2c9b2"); m.vl(x + 35, 83, 19, "#d2c9b2"); }
    m.r(X0, 104, W, 4, "#8d846e"); m.hl(X0, 104, W, "#a69d87");
    for (let y = 108; y < H; y++) { m.set({ n: [0, -1], S: 70, D: Math.round(WALL * (1 - (y - 108) / (H - 108))) }); for (let x = X0; x < X0 + W; x++) m.px(x, y, ((x + (y >> 3) * 9) % 22 === 0 || y % 8 === 0) ? "#5c4029" : PL.h2(x >> 2, y >> 3) < 0.3 ? "#7d5b3b" : "#866342"); }
    // bibliothèque de codes
    m.set({ n: [0, 0], S: 20, D: 192 }); m.r(10, 12, 86, 96, "#3a271a"); m.r(12, 14, 82, 92, "#22160f");
    m.set({ n: [-0.5, 0] }); m.vl(10, 12, 96, "#5a3e29"); m.set({ n: [0, -0.5] }); m.hl(10, 12, 86, "#5a3e29"); m.set({ n: [0, 0] });
    for (let r = 0; r < 5; r++) {
      const base = 32 + r * 18; m.set({ D: 192, S: 20 }); m.r(12, base, 82, 2, "#4a3322"); m.hl(12, base, 82, "#63452e");
      let x = 13;
      while (x < 91) {
        const w = 2 + Math.floor(h01(x * 1.9 + r) * 3), hh = 10 + Math.floor(h01(x * 5.1 + r * 3) * 6);
        if (h01(x * 3.3 + r * 17.7) < 0.07) { x += 3; continue; }
        const col = BOOKS[Math.floor(h01(x * 7.7 + r * 2.3) * BOOKS.length)];
        m.set({ D: 190, S: 30 }); m.r(x, base - hh, w, hh, col); m.set({ n: [-0.5, 0] }); m.vl(x, base - hh, hh, mix(PL.rgb(col), [255, 255, 255], 0.22)); m.set({ n: [0, 0] });
        if (w > 2) { m.hl(x + 1, base - hh + 2, w - 1, "#e8d9a0", 0.8); m.hl(x + 1, base - 3, w - 1, "#e8d9a0", 0.5); }
        x += w + (h01(x * 2.1) < 0.12 ? 1 : 0);
      }
    }
    // diplôme, serment encadré, horloge
    m.set({ D: 198, S: 40 }); m.r(106, 26, 30, 22, "#b08a3c"); m.r(108, 28, 26, 18, "#f1ecdc"); m.hl(112, 32, 18, "#8a8f98"); m.hl(114, 35, 14, "#8a8f98"); m.hl(113, 38, 16, "#8a8f98"); m.orb(128, 42, 2, 2, "#b33a32", 0.6);
    m.r(108, 54, 20, 15, "#4a3322"); m.r(109, 55, 18, 13, "#e9e4d2"); m.hl(111, 58, 13, "#9aa0a8"); m.hl(111, 61, 11, "#9aa0a8"); m.hl(111, 64, 12, "#9aa0a8");
    K.clockFace(m, 214, 28);
    // fenêtre (menuiserie ; la vitre est peinte à chaque image)
    m.set({ E: 0, n: [0, 0], S: 60, D: 198 }); m.r(240, 12, 88, 88, "#ebe6d8");
    // lampadaire
    m.set({ S: 120, D: 170 }); m.r(346, 44, 2, 64, "#b08a3c"); m.orb(347, 108, 8, 2, "#8d7333", 0.6);
    // fauteuil du visiteur : dossier de cuir capitonné, accoudoirs
    m.set({ S: 70, D: 128, n: [0, 0] });
    for (let y = 60; y < DESK; y++) { const half = y < 66 ? 24 + (y - 60) : 30; for (let x = 180 - half; x <= 180 + half; x++) { const u = (x - 180) / (half + 1); m.nx = Math.round(u * Math.abs(u) * 90 + 128); m.px(x, y, ((x - 150) % 12 === 0 && y > 66) || PL.h2(x, y) < 0.06 ? "#4a1a1c" : "#63242a"); } }
    m.nx = 128; m.set({ n: [0, -0.6] }); m.hl(157, 59, 47, "#8a3a40"); m.set({ n: [0, 0] });
    for (let y = 72; y < 112; y += 12) for (let x = 156; x < 208; x += 12) m.px(x, y, "#2e0e10");
    m.set({ D: 124 }); m.orb(146, 106, 6, 5, "#5a2026", 0.8); m.orb(214, 106, 6, 5, "#5a2026", 0.8); m.r(142, 108, 9, 12, "#4a1a1c"); m.r(210, 108, 9, 12, "#4a1a1c");
  }
  function bureauRdv(m, o, t, still) {
    // votre bureau : plateau de noyer, chant éclairé
    plateau(m, 14, 346, DESK, H, 96, 112, 14, "#5f3f27", "#6d4a2e", 80);
    m.set({ n: [0, -0.5], S: 90, D: 113 }); m.hl(14, DESK - 1, 333, "#94694a"); m.set({ D: 112 }); m.hl(14, DESK, 333, "#825a3c");
    // le dossier du client, ouvert devant vous ; le stylo
    for (let y = 132; y < 150; y++) { const k = (y - 132) / 18, x0 = Math.round(132 - 6 * k), x1 = Math.round(214 + 6 * k); m.set({ E: 0, n: [0, -0.86], S: 20, D: 86 - Math.round(k * 20) }); for (let x = x0; x <= x1; x++) m.px(x, y, x < x0 + 3 || x > x1 - 3 || y === 132 ? "#d6c592" : (y % 3 === 0 && x > x0 + 8 && x < x1 - 8 && h01(x * 0.7 + y * 3.1) < 0.7) ? "#8e97a8" : "#f1ecdc"); }
    m.set({ S: 120, D: 60 }); m.line(222, 140, 238, 136, "#1f2a52"); m.px(239, 136, "#d9b55a");
    // boîte de mouchoirs, cartes de visite, verre d'eau du visiteur
    m.set({ n: [0, 0], S: 20, D: 106 }); m.r(252, 115, 18, 8, "#8fb0c9"); m.hl(252, 115, 18, "#b4d0e4"); m.r(258, 111, 6, 4, "#f6f6f2"); m.px(260, 110, "#f6f6f2");
    m.set({ S: 60 }); m.r(104, 119, 12, 4, "#3a271a"); m.r(105, 117, 10, 2, "#f1ecdc");
    m.set({ S: 220, D: 108 }); m.r(226, 114, 6, 9, [196, 214, 226], 0.55); m.hl(226, 117, 6, [230, 240, 248], 0.8); m.vl(226, 114, 9, [240, 246, 250], 0.7);
    // lampe de banquier
    m.set({ n: [0, 0], S: 140, D: 100 }); m.orb(58, 127, 10, 3, "#b08a3c", 0.6); m.r(57, 109, 2, 18, "#c9a24a"); m.px(57, 109, "#e9cf7a");
  }
  PLANS.rdv = {
    H, REF,
    make(W) {
      const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
      stat.ox = work.ox = OX; cabinet(stat, W);
      const act = K.actor(3.7), drops = gouttes(26, 80, 80, 1), roofs = toits(244, 324, 78, 3);
      return {
        W, H, mat: work,
        frame(t, o) {
          o = o || {}; const m = work, still = !!o.reduce, c = heure(o), lampOn = c.sun < 0.8; m.copy(stat);
          K.clockHands(m, 214, 28, o.min == null ? 600 : o.min, t, still);
          vitre(m, 244, 16, 80, 80, c, t, still, roofs, drops);
          m.set({ E: 0, n: [0, 0], S: 60, D: 198 }); m.r(282, 16, 4, 80, "#ebe6d8"); m.vl(283, 16, 80, "#bdb7a6"); m.hl(244, 42, 80, "#ded9cb"); m.hl(244, 68, 80, "#ded9cb"); m.set({ n: [0, -0.6] }); m.hl(238, 100, 92, "#f4f0e4"); m.set({ n: [0, 0] });
          m.set({ S: 0, D: 194 }); for (const [x0, dir] of [[228, 1], [327, -1]]) for (let y = 9, x; y < 106; y++) for (x = 0; x < 13; x++) { const f = Math.sin((x + (dir > 0 ? 0 : 3)) * 1.25); m.nx = Math.round(f * 0.6 * 127 + 128); m.px(x0 + x, y, f > 0.3 ? "#8d2630" : f < -0.4 ? "#5c151d" : "#761c26"); }
          m.nx = 128; m.set({ S: 100 }); m.r(224, 7, 120, 2, "#b08a3c");
          // lampadaire : abat-jour
          m.set({ E: lampOn ? 150 : 0, S: 0, D: 168 }); for (let y = 30; y < 46; y++) { const half = 5 + Math.round((y - 30) * 0.45); m.hl(347 - half, y, half * 2 + 1, lampOn ? "#f3ddb0" : "#cdbf9e"); }
          // la personne reçue
          const img = act(m, t, { look: o.look, expr: o.expr || "neutral", talk: parle(o), still, x: 148, y: 55, D: 118 });
          if (img) K.torso(m, img, 148, 55, DESK, 118);
          bureauRdv(m, o, t, still);
          m.set({ E: lampOn ? 120 : 0, S: 150, D: 99, n: [0, 0] }); m.orb(58, 107, 15, 5, "#1f7a4f", 0.8); m.set({ n: [0, -0.7] }); m.hl(47, 103, 22, "#3fa373"); m.set({ n: [0, 0] });
          if (lampOn) { m.set({ E: 255, S: 0 }); m.hl(46, 112, 25, "#fff0c0"); }
          const day = mix([0.11, 0.12, 0.17], [0.5, 0.5, 0.49], c.sun), amb = [day[0] + c.dusk * 0.16, day[1] + c.dusk * 0.08, day[2] + c.dusk * 0.05];
          const lights = [
            { x: OX + 284, y: 54, d: 188, r: 400, c: c.skyc, i: 0.2 + c.sun * 0.66 + c.dusk * 0.7, wrap: 0.7, haze: 0.04 + c.sun0 * 0.05 + c.dusk * 0.08, hr: 70 },
            { x: OX + 290, y: 40, d: 110, r: 260, c: c.skyc, i: c.sun * 0.5 + c.dusk * 0.5, wrap: 0.2 },
            { x: OX + 180, y: -30, d: 90, r: 440, c: [1, 0.86, 0.66], i: (1 - c.sun) * 0.8, wrap: 0.6 },
            { x: OX + 150, y: 70, d: 40, r: 170, c: [1, 0.93, 0.82], i: 0.5 + (1 - c.sun) * 0.5, wrap: 0.5 },
          ];
          if (lampOn) lights.push({ x: OX + 58, y: 114, d: 94, r: 200, c: [1, 0.78, 0.44], i: 2.3 * (1 - c.sun * 0.7), wrap: 0.4, haze: 0.22 * (1 - c.sun * 0.7), hr: 46 }, { x: OX + 347, y: 40, d: 160, r: 150, c: [1, 0.82, 0.55], i: 1.5 * (1 - c.sun * 0.7), wrap: 0.5, haze: 0.16, hr: 40 });
          return { t, floorY: DESK, reflK: 0.9, wet: 0.3, grain: 0.03, vig: 0.4, bloom: 0.55 + (1 - c.sun) * 0.6, tint: c.sun > 0.5 ? [1, 1, 1] : [0.96, 0.98, 1.06], amb, lights };
        },
      };
    },
  };

  // ------------------------------------------------------------ parloir avocat
  function parloir(m, W) {
    const FY = 120;
    K.room(m, W, { H, floorY: FY, wall: "#c9c4a4", wallA: "#bfba9a", wallB: "#d3ceae", dadoY: 72, dado: "#7c9082", dadoLine: "#687c6e", plinth: "#3d4a44", floor: ["#585c58", "#666a65", "#747872"], gloss: 110 });
    for (let i = 0; i < 30; i++) { const x = -m.ox + Math.floor(h01(i * 7.3) * W), y = 40 + Math.floor(h01(i * 3.1) * 30); m.vl(x, y, 2 + Math.floor(h01(i) * 4), "#b9b494", 0.7); }
    K.neon(m, 140, 3, 80);
    // fenêtre haute à barreaux (vitre peinte à chaque image)
    m.set({ E: 0, n: [0, 0], S: 0, D: 160 }); m.r(22, 14, 66, 44, "#4b5450"); m.set({ n: [0, -0.6] }); m.r(22, 56, 66, 3, "#8f9990"); m.set({ n: [0, 0] });
    // plaque, règlement, bouton d'alarme, œil de caméra
    m.r(104, 16, 44, 9, "#1b2430"); m.set({ E: 26 }); m.txt("PARLOIR 4", 107, 18, "#e6dfc6"); m.set({ E: 0 });
    K.paper(m, 106, 32, 30, 34, "INFOS", "#7a2a2a");
    m.r(226, 46, 9, 12, "#8f9697"); m.orb(230, 52, 3, 3, "#b3282a", 0.8);
    m.set({ S: 120 }); m.orb(250, 12, 5, 4, "#23272e", 0.7); m.set({ S: 0 });
    K.clockFace(m, 192, 32);
    // porte pleine, oculus sur la coursive
    m.r(271, 12, 58, 108, "#2c3632"); m.set({ S: 30 }); m.r(274, 15, 52, 105, "#56705f");
    m.set({ n: [-0.5, 0] }); m.vl(274, 15, 105, "#6f8a78"); m.set({ n: [0.5, 0] }); m.vl(325, 15, 105, "#3f5446"); m.set({ n: [0, -0.5] }); m.hl(274, 15, 52, "#6f8a78"); m.set({ n: [0, 0] });
    for (const [x, y] of [[277, 18], [322, 18], [277, 114], [322, 114]]) m.px(x, y, "#8aa392");
    m.r(288, 24, 24, 30, "#27302c"); m.set({ S: 60 }); m.r(277, 72, 5, 3, "#aeb6bb"); m.r(279, 73, 3, 8, "#8e979c"); m.r(290, 86, 20, 6, "#40564a"); m.hl(290, 86, 20, "#6f8a78"); m.set({ S: 0 });
    // chaise, table de formica scellée
    m.set({ n: [0, 0], S: 20, D: 112 }); m.r(160, 92, 40, 30, "#3d4944"); m.r(162, 90, 36, 2, "#3d4944"); m.set({ n: [0, -0.6] }); m.hl(162, 89, 36, "#5a6a62"); m.set({ n: [0, 0] });
    m.set({ S: 50, D: 108 }); m.r(120, 136, 3, 28, "#2c3135"); m.r(238, 136, 3, 28, "#2c3135");
    plateau(m, 112, 248, 122, 136, 16, 110, 82, "#b9ad8c", "#c7bb99", 100);
    m.set({ n: [0, -0.4], S: 60, D: 82 }); m.hl(96, 136, 169, "#ddd2b2"); m.set({ n: [0, 0], S: 40 }); m.r(96, 137, 169, 3, "#7d7560"); m.r(98, 140, 165, 5, "#4c4a42");
    m.set({ n: [0.3, 0], D: 80 }); m.r(100, 145, 5, 52, "#3a4044"); m.r(256, 145, 5, 52, "#3a4044"); m.vl(100, 145, 52, "#525a5f"); m.vl(256, 145, 52, "#525a5f");
    // votre dossier, le permis de communiquer
    m.set({ n: [0, -0.8], S: 30, D: 90 }); for (let y = 127; y < 135; y++) { const sh = Math.round((y - 127) * 0.9); for (let x = 204 + sh; x < 246 + sh; x++) m.px(x, y, y === 127 ? "#b9cbe2" : "#9db6d6"); }
    m.r(214, 129, 14, 3, "#f0ede0"); m.hl(216, 130, 9, "#7d8087"); m.r(120, 126, 16, 6, "#f1ecdc"); m.hl(122, 128, 11, "#8e9499"); m.px(133, 130, "#27407a");
  }
  PLANS.parloir = {
    H, REF,
    make(W) {
      const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
      stat.ox = work.ox = OX; parloir(stat, W);
      const act = K.actor(5.3), drops = gouttes(14, 60, 38, 2);
      return {
        W, H, mat: work,
        frame(t, o) {
          o = o || {}; const m = work, still = !!o.reduce, c = heure(o); m.copy(stat);
          K.clockHands(m, 192, 32, o.min == null ? 600 : o.min, t, still);
          vitre(m, 25, 17, 60, 39, c, t, still, null, drops);
          // mur d'enceinte et mirador au loin, barreaux
          const beton = mix([22, 24, 34], [150, 152, 150], c.sun0); m.set({ E: Math.round(16 + c.sun0 * 70), D: 255 }); m.r(25, 44, 60, 12, beton); m.hl(25, 44, 60, mix(beton, [255, 255, 255], 0.2)); m.r(66, 32, 9, 12, beton); m.r(64, 30, 13, 3, mix(beton, [0, 0, 0], 0.3));
          if (c.sun0 < 0.5) { m.set({ E: 240 }); m.r(69, 35, 3, 3, "#ffe7a8"); }
          m.set({ E: 0, D: 158, n: [0, 0], S: 30 }); for (let x = 31; x < 85; x += 8) { m.vl(x, 17, 39, "#1c2124"); m.vl(x + 1, 17, 39, "#3a4347"); } m.hl(25, 36, 60, "#22282b");
          // l'oculus : la coursive, un surveillant passe
          m.set({ E: 140, S: 0, D: 160 }); m.r(290, 26, 20, 26, "#cfc59a"); m.set({ E: 80 }); for (let x = 293; x < 310; x += 4) m.vl(x, 26, 26, "#a39a72");
          const pass = still ? -1 : (t % 37) - 9;
          if (pass > 0 && pass < 2.6) { m.set({ E: 20 }); const px = 288 + Math.round(pass / 2.6 * 22), a = Math.max(290, px), b = Math.min(310, px + 9); if (b > a) { m.r(a, 32, b - a, 20, "#1d2a3c"); m.ell(Math.min(306, Math.max(294, px + 4)), 32, 4, 4, "#1d2a3c"); } }
          m.set({ E: still || t % 3 < 1.5 ? 255 : 30, D: 159 }); m.px(250, 14, "#ff3b30");
          const img = act(m, t, { look: o.look, expr: o.expr || "neutral", talk: parle(o), still, x: 148, y: 58, D: 100 });
          if (img) bras(m, img, 148, 58, 96);
          const you = o.you || {}; K.back(m, 84, 105, { hc: you.hc, g: you.g, coat: "#1d1f26", D: 12, H });
          const fl = still ? 1 : (t % 29 > 28.3 ? 0.6 + 0.4 * h01(Math.floor(t * 30)) : 1) * (0.985 + 0.015 * Math.sin(t * 50)), cor = pass > 0 && pass < 2.6 ? 0.5 : 1;
          return {
            t, floorY: 120, reflK: 1.2, wet: 0.3, grain: 0.035, vig: 0.42, bloom: 1, tint: [0.98, 1, 0.98], amb: mix([0.11, 0.12, 0.13], [0.24, 0.25, 0.25], c.sun),
            lights: [
              { x: OX + 180, y: 10, d: 46, r: 430, c: [0.94, 1, 0.84], i: 1.8 * fl, wrap: 0.45, haze: 0.18 * fl, hr: 64 },
              { x: OX + 180, y: 132, d: 84, r: 80, c: [1, 0.98, 0.86], i: 0.7 * fl, wrap: 0.8 },
              { x: OX + 300, y: 40, d: 148, r: 80, c: [1, 0.86, 0.5], i: 1.0 * cor, haze: 0.12 * cor, hr: 30 },
              { x: OX + 104, y: 80, d: 8, r: 175, c: [0.9, 1, 0.92], i: 2.1 * fl, wrap: 0.02 },
              { x: OX + 55, y: 36, d: 150, r: 150, c: c.skyc, i: 0.3 + c.sun * 1.1 + c.dusk * 0.8, haze: 0.05 + c.sun0 * 0.08, hr: 44 },
              { x: OX + 20, y: 120, d: -120, r: 520, c: [0.6, 0.7, 0.9], i: 0.28, wrap: 0.6 },
            ],
          };
        },
      };
    },
  };

  // ------------------------------------------------------------ au bout du fil
  const TBL = 126;
  function cuisine(m, W) {
    const X0 = -m.ox, WALL = 180;
    m.set({ E: 0, n: [0, 0], S: 0, D: WALL });
    m.r(X0, 0, W, 122, "#d8cdb6"); m.noise(X0, 6, W, 60, "#cfc4ad", 0.2, 7); m.noise(X0, 6, W, 60, "#e0d6c0", 0.1, 13);
    m.r(X0, 0, W, 5, "#ece4d2"); m.hl(X0, 5, W, "#b3a88f");
    // crédence de faïence, plan de travail, meubles bas
    m.set({ S: 120 }); m.r(X0, 66, W, 26, "#e9e6dc"); for (let x = Math.ceil(X0 / 10) * 10; x < X0 + W; x += 10) m.vl(x, 66, 26, "#cfccc0"); m.hl(X0, 79, W, "#cfccc0"); m.hl(X0, 66, W, "#f6f4ec");
    for (let x = Math.ceil(X0 / 10) * 10; x < X0 + W; x += 10) for (const y of [67, 80]) if (h01(x * 0.61 + y) < 0.13) m.r(x + 1, y, 9, 12, "#7fa6b5");
    m.set({ n: [0, -0.8], S: 90, D: 170 }); m.r(X0, 92, W, 4, "#8a6a48"); m.hl(X0, 92, W, "#b08a62"); m.set({ n: [0, 0], S: 30, D: 172 }); m.r(X0, 96, W, 30, "#5d7f86");
    for (let x = Math.ceil((X0 + 4) / 40) * 40; x < X0 + W; x += 40) { m.r(x, 99, 34, 24, "#557780"); m.hl(x, 99, 34, "#48666e"); m.vl(x, 99, 24, "#48666e"); m.hl(x, 122, 34, "#6d919a"); m.set({ S: 140 }); m.r(x + 14, 102, 6, 2, "#c9cdd0"); m.set({ S: 30 }); }
    // meubles hauts à gauche, étagère de bocaux
    m.set({ D: 174 }); for (const x of [14, 52]) { m.r(x, 12, 36, 40, "#5d7f86"); m.r(x + 3, 15, 30, 34, "#557780"); m.hl(x + 3, 15, 30, "#48666e"); m.vl(x + 3, 15, 34, "#48666e"); m.hl(x, 51, 36, "#3e5960"); m.set({ S: 140 }); m.r(x + 15, 45, 6, 2, "#c9cdd0"); m.set({ S: 30 }); }
    m.r(98, 44, 60, 2, "#8a6a48"); m.hl(98, 44, 60, "#b08a62");
    for (const [x, c1, hh] of [[102, "#c9a24a", 10], [112, "#a8524a", 8], [121, "#e9e2cc", 11], [132, "#6b8f5a", 9], [143, "#d9cfb4", 7]]) { m.set({ S: 200 }); m.r(x, 44 - hh, 7, hh, c1); m.vl(x, 44 - hh, hh, mix(PL.rgb(c1), [255, 255, 255], 0.3)); m.r(x, 43 - hh, 7, 2, "#4a4a48"); }
    // bouilloire, grille-pain, torchon
    m.set({ S: 220, D: 166 }); m.orb(118, 85, 7, 7, "#b9bec2", 0.8); m.r(111, 85, 14, 7, "#aab0b4"); m.r(124, 80, 3, 2, "#aab0b4"); m.set({ S: 30 }); m.r(113, 76, 10, 2, "#23272e");
    m.set({ S: 160 }); m.r(134, 81, 18, 11, "#c9cdd0"); m.hl(134, 81, 18, "#eef0f2"); m.r(137, 80, 12, 1, "#3a3f48");
    // réfrigérateur à droite : aimants, dessin d'enfant
    m.set({ S: 110, D: 168, n: [0, 0] }); m.r(296, 18, 52, 108, "#dcdfe0"); m.set({ n: [-0.5, 0] }); m.vl(296, 18, 108, "#f4f6f6"); m.set({ n: [0, 0] }); m.hl(296, 54, 52, "#a9aeb0"); m.r(299, 40, 2, 10, "#8f9697"); m.r(299, 60, 2, 16, "#8f9697");
    m.set({ S: 0 }); m.r(314, 64, 22, 18, "#f6f3e6"); m.line(317, 78, 322, 70, "#e0503a"); m.line(322, 70, 327, 78, "#e0503a"); m.hl(317, 78, 11, "#e0503a"); m.orb(331, 68, 2, 2, "#f2c230", 0.5); m.hl(315, 80, 20, "#3f9c5a");
    for (const [x, y, c1] of [[318, 62, "#b33a32"], [332, 62, "#2f6fbf"], [310, 30, "#f2c230"], [322, 34, "#2f9c5a"]]) m.r(x, y, 3, 3, c1);
    m.r(326, 24, 14, 18, "#f1ecdc"); for (let i = 0; i < 4; i++) m.hl(328, 27 + i * 3, 9, "#8e9499");
    // fenêtre au-dessus de l'évier (menuiserie)
    m.set({ S: 60, D: 178 }); m.r(196, 12, 80, 54, "#f1ede2"); m.set({ n: [0, -0.6] }); m.hl(194, 66, 84, "#fbf8f0"); m.set({ n: [0, 0] });
    m.set({ S: 220, D: 164 }); m.r(232, 78, 3, 14, "#b9bec2"); m.r(232, 77, 12, 3, "#c9cdd0"); m.r(242, 80, 2, 4, "#aab0b4");
    // carrelage
    for (let y = 126; y < H; y++) { const k = (y - 126) / (H - 126); m.set({ n: [0, -1], S: 110, D: Math.round(WALL * (1 - k)) }); for (let x = X0; x < X0 + W; x++) m.px(x, y, (y - 126) % 14 === 0 || (x + 400) % 22 === 0 ? "#8f8672" : PL.h2(x >> 1, y >> 1) < 0.2 ? "#b3a98f" : "#bdb399"); }
    m.set({ n: [0, 0], S: 0, D: 171 }); m.r(X0, 124, W, 2, "#2c3a3e");
    // dossier de la chaise
    m.set({ S: 30, D: 128 }); m.r(128, 76, 4, 52, "#6b4a2f"); m.r(188, 76, 4, 52, "#6b4a2f"); m.r(128, 78, 64, 5, "#7a5536"); m.r(128, 96, 64, 4, "#7a5536"); m.set({ n: [0, -0.6] }); m.hl(128, 78, 64, "#9a7250"); m.set({ n: [0, 0] });
  }
  function tableCuisine(m, t, still) {
    plateau(m, 40, 320, TBL, H, 80, 110, 14, "#b79a70", "#c4a87e", 60);
    m.set({ n: [0, -0.5], S: 80, D: 111 }); m.hl(40, TBL - 1, 281, "#dcc39b");
    // toile cirée : carreaux
    for (let y = TBL + 1; y < H; y++) { const k = (y - TBL) / (H - TBL), a = Math.round(40 - 80 * k), b = Math.round(320 + 80 * k); m.set({ n: [0, -0.86], S: 130, D: Math.round(110 - 96 * k) }); const row = Math.floor(Math.pow(k, 0.7) * 16) % 2; for (let x = a + 2; x < b - 1; x++) { const u = (x - a) / (b - a), col = Math.floor(u * 30) % 2; m.px(x, y, row && col ? "#b9483a" : row || col ? "#dba596" : "#ece5d3"); } }
    // tasse, courrier (une convocation), trousseau de clés
    m.set({ E: 0, n: [0, 0], S: 100, D: 96 }); m.r(232, 122, 10, 9, "#f2efe6"); m.set({ n: [0.6, 0] }); m.vl(241, 122, 9, "#bdb9af"); m.r(242, 124, 2, 4, "#d9d5cb"); m.set({ n: [0, -0.8] }); m.hl(233, 122, 8, "#4a2e1c"); m.hl(232, 121, 10, "#fbf8f0"); m.set({ n: [0, 0] });
    for (let y = 132; y < 142; y++) { const sh = Math.round((y - 132) * 0.8); m.set({ n: [0, -0.86], S: 20, D: 84 }); for (let x = 84 - sh; x < 122 + sh; x++) m.px(x, y, y === 132 ? "#fbf8f0" : (y % 3 === 0 && x > 90 - sh && x < 114 + sh) ? "#8e97a8" : "#f1ecdc"); }
    m.r(86, 133, 8, 3, "#27407a");
    m.set({ S: 200, D: 90 }); m.orb(266, 131, 3, 2, "#c9a24a", 0.7); m.line(268, 131, 276, 133, "#b9bec2"); m.line(268, 132, 275, 129, "#aab0b4");
    if (!still) { m.set({ E: 0, S: 0, D: 94 }); for (let i = 0; i < 5; i++) { const p = (t * 0.35 + i * 0.2) % 1; m.px(237 + Math.round(Math.sin(p * 7 + i) * 2), 120 - Math.round(p * 12), [240, 240, 240], 0.3 * (1 - p)); } }
  }
  PLANS.appel = {
    H, REF,
    make(W) {
      const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
      stat.ox = work.ox = OX; cuisine(stat, W);
      const act = K.actor(6.1), drops = gouttes(20, 72, 46, 4), roofs = toits(200, 272, 48, 8);
      return {
        W, H, mat: work,
        frame(t, o) {
          o = o || {}; const m = work, still = !!o.reduce, c = heure(o), lampOn = c.sun < 0.85; m.copy(stat);
          vitre(m, 200, 16, 72, 46, c, t, still, roofs, drops);
          m.set({ E: 0, n: [0, 0], S: 60, D: 178 }); m.r(234, 16, 4, 46, "#f1ede2"); m.vl(235, 16, 46, "#c9c4b6"); m.hl(200, 38, 72, "#e2ddd0");
          // suspension au-dessus de la table
          m.set({ E: 0, S: 0, D: 120 }); m.vl(160, 0, 22, "#2c3038");
          m.set({ E: lampOn ? 130 : 0, S: 120 }); for (let y = 22; y < 34; y++) { const half = 4 + Math.round((y - 22) * 1.3); m.set({ n: [0, -0.5] }); m.hl(160 - half, y, half * 2 + 1, y === 22 ? "#f2c9a0" : "#d9764a"); } m.set({ n: [0, 0] });
          if (lampOn) { m.set({ E: 255, S: 0 }); m.hl(144, 34, 33, "#fff0c0"); }
          // la personne, le téléphone à l'oreille
          const talk = parle(o), img = act(m, t, { look: o.look, expr: o.expr || "neutral", talk, still, x: 128, y: 60, D: 116 });
          if (img) {
            const sl = K.sample(img, 10, 61), sk = K.sample(img, 32, 34), bob = !still && talk ? Math.round(Math.sin(t * 5) * 0.6) : 0;
            K.torso(m, img, 128, 60, TBL, 116);
            m.set({ E: 0, S: 0, D: 108 }); m.tube(186, 122, 188, 100 + bob, 8, sl); m.tube(188, 101 + bob, 181, 92 + bob, 7, sl);
            m.set({ S: 90, D: 106 }); m.r(176, 84 + bob, 5, 13, "#15181d"); m.set({ E: 170 }); m.vl(176, 86 + bob, 9, "#9fc0ff"); m.set({ E: 0, S: 0 });
            m.orb(181, 91 + bob, 4, 5, sk, 0.7); m.hl(178, 89 + bob, 5, mix(sk, [0, 0, 0], 0.25), 0.6); m.hl(178, 92 + bob, 5, mix(sk, [0, 0, 0], 0.25), 0.6);
            // l'autre main, autour de la tasse ou à plat
            m.set({ D: 104 }); m.tube(132, 122, 150, 130, 7, sl); m.orb(153, 130, 5, 3, sk, 0.7);
          }
          tableCuisine(m, t, still);
          const day = mix([0.1, 0.105, 0.14], [0.48, 0.48, 0.47], c.sun), amb = [day[0] + c.dusk * 0.14, day[1] + c.dusk * 0.07, day[2] + c.dusk * 0.04];
          const lights = [
            { x: OX + 236, y: 38, d: 170, r: 340, c: c.skyc, i: 0.2 + c.sun * 0.75 + c.dusk * 0.8, wrap: 0.7, haze: 0.04 + c.sun0 * 0.06 + c.dusk * 0.08, hr: 60 },
            { x: OX + 240, y: 60, d: 100, r: 220, c: c.skyc, i: c.sun * 0.5 + c.dusk * 0.4, wrap: 0.2 },
            { x: OX + 172, y: 86, d: 100, r: 46, c: [0.6, 0.76, 1], i: 0.9, wrap: 0.7 },
            { x: OX + 60, y: 110, d: -80, r: 460, c: [0.6, 0.7, 1], i: 0.22, wrap: 0.7 },
          ];
          if (lampOn) lights.push({ x: OX + 160, y: 38, d: 112, r: 260, c: [1, 0.8, 0.5], i: 2.2 * (1 - c.sun * 0.7), wrap: 0.45, haze: 0.2 * (1 - c.sun * 0.7), hr: 54 });
          return { t, floorY: TBL, reflK: 0.9, wet: 0.35, grain: 0.03, vig: 0.42, bloom: 0.6 + (1 - c.sun) * 0.5, tint: c.sun > 0.5 ? [1, 1, 0.99] : [1, 0.98, 0.98], amb, lights };
        },
      };
    },
  };
})();
