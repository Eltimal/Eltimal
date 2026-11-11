/* La Permanence — décors éclairés (CR.dec.LIT) : le commissariat central du 18e, à toute heure.
   Largeur libre : le commissariat reste au centre (repère 0..480), la rue se prolonge de chaque côté.
   Plans : ciel, lointain (tour, toits), rue transversale, façades, mobilier urbain, personnages, chaussée, premier plan. */
(function () {
  const CR = window.CR, PL = CR.lum, D = CR.dec;
  const { rgb, h01, h2, mix, hexOf, rng } = PL;
  const CW = 480, H = 150, YF = 86, YB = 112, YK = 122, YR = 124;
  let FW = 480, OX = 0, X0 = 0, X1 = 480; // largeur réelle, décalage du repère, bords en coordonnées du repère
  const al = (x, m) => Math.floor(x / m) * m;
  const Z = { SKY: 255, FAR: 200, SIDE: 150, FAC: 80, ST: 50, WALK: 60, KERB: 61, ROAD: 30, CAR: 28, ACT: 40, FG: 10 };
  const sh = (hex, d) => { const c = rgb(hex); return hexOf([c[0] + d, c[1] + d, c[2] + d]); };

  const PH = {
    jour: { amb: [0.74, 0.78, 0.88], on: 0, sky: ["#5b8fc4", "#74a3d0", "#8fb6da", "#abc8e2", "#c6d9e8", "#dfe6e6"], cloud: ["#ffffff", "#e6edf3", "#c7d3df"], far: [190, 203, 216], glow: 0.2, wet: 0.06 },
    soir: { amb: [0.56, 0.44, 0.54], on: 0.9, sky: ["#232a5e", "#43407c", "#7a4b84", "#bf6672", "#e98d66", "#f4bd7e"], cloud: ["#f6b98e", "#c9788a", "#6f4a7c"], far: [128, 88, 112], glow: 0.85, wet: 0.14 },
    nuit: { amb: [0.1, 0.135, 0.26], on: 1, sky: ["#070b1a", "#0b1226", "#111b36", "#182645", "#213255", "#2d3f63"], cloud: ["#3b3a52", "#262c48", "#191f38"], far: [40, 52, 84], glow: 1, wet: 0.14 },
  };
  const RAIN = {
    jour: { amb: [0.74, 0.77, 0.82], sky: ["#6f7a86", "#808b96", "#939ea8", "#a6b0b8", "#b8c0c6", "#c8ced2"], cloud: ["#a4adb6", "#929ca6", "#808a94"], far: [168, 176, 184], mist: [176, 184, 192, 0.1] },
    soir: { amb: [0.46, 0.4, 0.5], sky: ["#2e3048", "#45435c", "#5f546c", "#80707e", "#9c8486", "#b3958c"], cloud: ["#a08a90", "#7c6a78", "#5a4e64"], far: [110, 96, 112], mist: [120, 104, 118, 0.08] },
    nuit: { amb: [0.1, 0.13, 0.24], sky: ["#0a0d16", "#0f1420", "#161c2a", "#1e2634", "#27303f", "#313b4a"], cloud: ["#2c3240", "#222836", "#191e2a"], far: [30, 37, 54], mist: [40, 52, 76, 0.07] },
  };
  PL.conf = (ph, rain) => Object.assign({ ph, rain }, PH[ph], rain ? RAIN[ph] : {}, rain ? { wet: 1 } : {});

  // ------------------------------------------------------------------ décor fixe
  function build(B, P, wetMap) {
    const on = P.on > 0, R = rng(4217);
    const ambc = P.amb.map((v) => Math.min(1, v));
    const far = (hex, k) => { const c = rgb(hex); return mix([c[0] * ambc[0], c[1] * ambc[1], c[2] * ambc[2]], P.far, k); };

    ciel(B, P);
    // ---- lointain : la tour, les toits
    B.mat(Z.FAR, 0, 255);
    // la butte et le Sacré-Cœur, éclairé la nuit
    const sc = on ? rgb(P.ph === "nuit" ? "#d9c9a0" : "#e0c8b0") : far("#e9e4d8", 0.35), scS = on ? rgb(P.ph === "nuit" ? "#a8946c" : "#b89a90") : far("#bdb8ac", 0.35), hill = far("#3c4a44", 0.55);
    for (let x = 150; x < 215; x++) { const hh = Math.round(4 + 3 * Math.sin((x - 150) / 65 * 3.14)); B.r(x, 22 - hh, 1, hh + 2, hill); }
    B.r(170, 12, 24, 8, sc); B.r(170, 12, 2, 8, scS); B.r(192, 12, 2, 8, scS);
    B.ell(182, 9, 5, 7, sc); B.ell(180.5, 8, 2.4, 5, on ? rgb("#f4e8c8") : far("#f6f2e8", 0.3)); B.r(181, 0, 2, 3, sc); B.px(181, -1, scS);
    B.ell(173, 12, 2.6, 3.4, sc); B.ell(191, 12, 2.6, 3.4, sc); B.px(173, 8, sc); B.px(191, 8, sc);
    B.r(198, 4, 5, 16, sc); B.r(202, 4, 1, 16, scS); B.ell(200.5, 4, 2.6, 3, sc); B.px(200, 0, sc);
    for (let x = 172; x < 192; x += 3) B.r(x, 15, 1, 3, scS);
    for (let x = 215; x < 320;) { const w = 14 + (R() * 22 | 0), h = 2 + (R() * 7 | 0), c = far("#59606a", 0.5), c2 = far("#3c434e", 0.5); B.r(x, 30 - h, w, h, c2); B.r(x, 30 - h - 4, w, 4, c); if (R() < 0.7) { const cx = x + 3 + (R() * (w - 8) | 0); B.r(cx, 30 - h - 9, 4, 5, c2); B.px(cx, 30 - h - 10, far("#a0603e", 0.4)); B.px(cx + 2, 30 - h - 10, far("#a0603e", 0.4)); } if (on) for (let k = 0; k < 3; k++) if (R() < 0.4) B.px(x + 2 + (R() * (w - 4) | 0), 30 - h + 2 + (R() * (h - 3) | 0), "#f0c070"); x += w; }

    // ---- rue transversale (318..344)
    B.mat(Z.SIDE, 0, 255);
    const sv = far("#6a5046", 0.42), sv2 = far("#b7ab98", 0.42), sroad = far("#3f4249", 0.35);
    for (let y = 38; y < YB; y++) { const k = (y - 38) / (YB - 38); B.r(318, y, 9 - k * 0, 1, sv); B.r(336, y, 8, 1, sv2); }
    B.r(327, 62, 9, 44, far("#8f8a84", 0.6)); B.r(327, 58, 9, 4, far("#59606a", 0.6));
    for (let y = 44; y < 100; y += 7) { B.r(320, y, 2, 4, on && h2(3, y) < 0.4 ? "#f6c878" : far("#2c3340", 0.3)); B.r(323, y, 2, 4, on && h2(5, y) < 0.3 ? "#f6c878" : far("#2c3340", 0.3)); B.r(338, y, 2, 4, on && h2(7, y) < 0.4 ? "#f0d090" : far("#2c3340", 0.3)); B.r(341, y, 2, 4, far("#2c3340", 0.3)); }
    for (let y = 66; y < 100; y += 6) for (let x = 328; x < 335; x += 3) B.r(x, y, 2, 3, on && h2(x, y) < 0.45 ? "#f2c46e" : far("#3a4250", 0.5));
    B.r(318, 106, 26, 6, sroad); B.hl(318, 105, 26, far("#8a8780", 0.4));
    B.vl(331, 92, 14, far("#1f2a26", 0.3)); if (on) { B.r(330, 90, 3, 2, "#ffe2a0"); }

    // ---- façades
    const ST1 = ["#e3d6bc", "#cfc0a3", "#b5a68a", "#8f8169"], ST2 = ["#ddd3c4", "#c7bcab", "#ab9f8e", "#877c6c"], ST3 = ["#d9cdb8", "#c2b59e", "#a69a84", "#837864"];
    for (let k = 1; X0 < -150 * (k - 1); k++) { haussmann(B, P, -150 * k, -150 * (k - 1), { n: k % 2 ? 5 : 6, seed: 50 + k, stone: k % 2 ? ST3 : ST2, zinc: k % 2 ? "#5f6976" : "#6c7683" }); boutiques(B, P, -150 * k, -150 * (k - 1), k); }
    for (let k = 1; X1 > 480 + 150 * (k - 1); k++) { haussmann(B, P, 480 + 150 * (k - 1), 480 + 150 * k, { n: k % 2 ? 6 : 5, seed: 70 + k, stone: k % 2 ? ST1 : ST3, zinc: k % 2 ? "#6c7683" : "#5f6976" }); boutiques(B, P, 480 + 150 * (k - 1), 480 + 150 * k, k + 4); }
    haussmann(B, P, 0, 150, { n: 5, seed: 11, stone: ST1, zinc: "#6c7683" });
    commissariat(B, P);
    haussmann(B, P, 344, 480, { n: 5, seed: 29, stone: ["#ddd3c4", "#c7bcab", "#ab9f8e", "#877c6c"], zinc: "#5f6976" });
    brasserie(B, P); droite(B, P);

    sol(B, P, wetMap, { zebra: 320, regard: 96 });
    // marches du commissariat (sur le trottoir)
    B.mat(Z.KERB, 255, 0); B.r(217, YB, 34, 2, "#d0c9b9"); B.hl(217, YB + 1, 34, "#a39c8d"); B.r(214, YB + 2, 40, 2, "#bdb6a6"); B.hl(214, YB + 3, 40, "#8f8879");

    // ombres au sol
    B.mat(Z.KERB, 255, 0); B.G = 0;
    for (const [cx, cy, rx] of [[187, 116, 13], [133, 121, 5], [375, 121, 5], [470, 121, 9]]) for (let x = -rx; x <= rx; x++) for (let y = -2; y <= 2; y++) if ((x * x) / (rx * rx) + (y * y) / 5 <= 1) { const q = (cy + y) * FW + cx + x + OX; B.c[q * 3] *= 0.72; B.c[q * 3 + 1] *= 0.72; B.c[q * 3 + 2] *= 0.76; }
    for (let x = 262; x < 322; x++) for (let y = 133; y < 139; y++) { const q = y * FW + x + OX; B.c[q * 3] *= 0.6; B.c[q * 3 + 1] *= 0.6; B.c[q * 3 + 2] *= 0.64; }
    for (let x = 0; x < FW; x++) { for (let y = YB; y < YB + 2; y++) { const q = y * FW + x; B.c[q * 3] *= 0.8; B.c[q * 3 + 1] *= 0.8; B.c[q * 3 + 2] *= 0.84; } }
    mobilier(B, P);
    premierPlan(B, P);
  }

  // ------------------------------------------------------------------ ciel et sol, communs à tous les décors éclairés
  function ciel(B, P) {
    const sky = P.sky.map(rgb);
    B.mat(Z.SKY, 0, 255);
    for (let y = 0; y < YB; y++) for (let x = X0; x < X1; x++) { const t = Math.min(4.999, (y / 96) * 5), k = t | 0; B.px(x, y, (t - k) > PL.bayer(x, y) ? sky[k + 1] : sky[k]); }
    if (P.ph === "nuit" && !P.rain) for (let i = 0; i < Math.round(70 * FW / 480); i++) { const x = X0 + ((h01(i * 3.1) * FW) | 0), y = (h01(i * 5.7) * 60) | 0; B.px(x, y, i % 9 === 0 ? "#dfe6ff" : "#8f9ac0", 0.75); }
    const cl = P.cloud.map(rgb);
    const clouds = Math.round((P.rain ? 22 : 9) * FW / 480);
    for (let i = 0; i < clouds; i++) {
      const cx = X0 + h01(i * 9.3 + 2) * (FW + 80) - 40, cy = 6 + h01(i * 4.1 + 7) * (P.rain ? 60 : 44), n = 4 + (h01(i * 2.2) * 5 | 0);
      for (let k = 0; k < n; k++) { const ox = (k - n / 2) * 9 + h01(i * 31 + k) * 6, rx = 9 + h01(i * 17 + k * 3) * 12, ry = 2.5 + h01(i * 13 + k) * 3.5; B.ell(cx + ox, cy + 2, rx, ry, cl[2], 0.75); B.ell(cx + ox, cy, rx, ry, cl[1], 0.8); B.ell(cx + ox - 1, cy - 1.5, rx * 0.7, ry * 0.6, cl[0], P.ph === "nuit" ? 0.35 : 0.8); }
    }

  }
  function sol(B, P, wetMap, o) {
    o = o || {};
    B.mat(Z.WALK, 255, 0);
    B.r(X0, YB, FW, YK - YB, o.trottoir || "#77757a");
    B.noise(X0, YB, FW, YK - YB, "#86848a", 0.16, 3); B.noise(X0, YB, FW, YK - YB, "#66646a", 0.14, 8);
    for (let x = al(X0, 13); x < X1; x += 13) B.vl(x + ((Math.abs(x) / 13) % 2 ? 4 : 0), YB + 1, YK - YB - 1, "#5f5d63", 0.6);
    B.hl(X0, YB + 5, FW, "#646268", 0.5); B.hl(X0, YB, FW, "#4f4d52");
    for (let i = 0; i < Math.round(46 * FW / 480); i++) { const x = X0 + ((h01(i * 7.7) * FW) | 0), y = YB + 1 + (h01(i * 3.3) * 9 | 0); B.px(x, y, ["#c8782a", "#d9a03a", "#a8521f"][i % 3]); }
    B.mat(Z.KERB, 255, 0);
    B.r(X0, YK, FW, 1, "#aaa69e"); B.r(X0, YK + 1, FW, 1, "#6e6b66");
    for (let x = al(X0, 17); x < X1; x += 17) B.px(x, YK, "#7c7972");
    B.mat(Z.ROAD, 255, 0);
    B.r(X0, YR, FW, H - YR, "#40434b");
    B.noise(X0, YR, FW, H - YR, "#4b4e57", 0.2, 5); B.noise(X0, YR, FW, H - YR, "#363940", 0.2, 9);
    B.r(X0, YR, FW, 1, "#2b2d33");
    for (let x = al(X0, 34) + 6; x < X1; x += 34) B.r(x, 138, 16, 1, "#b9b9b0", 0.8);
    if (o.zebra != null) for (let x = o.zebra; x < o.zebra + 24; x += 7) { B.r(x, YR + 1, 4, H - YR - 1, "#c9c9c0", 0.85); }
    if (o.regard != null) { B.ell(o.regard, 143, 6, 2, "#33363c"); B.hl(o.regard - 4, 143, 9, "#565962"); }
    for (let y = YB; y < H; y++) for (let x = 0; x < FW; x++) {
      const road = y >= YR, a = Math.sin(x * 0.05 + y * 0.35) + Math.sin(x * 0.021 - y * 0.22 + 2) + (h2(x >> 3, y >> 2) - 0.5) * 0.8;
      wetMap[y * FW + x] = road ? (a > 0.4 ? 1 : a > -0.3 ? 0.55 : 0.3) : (a > 0.9 ? 0.8 : 0.28);
    }
  }

  // ------------------------------------------------------------------ immeuble haussmannien
  function fenetre(B, P, wx, wy, ww, wh, S, lit, seed, cold) {
    B.mat(Z.FAC, 255, 0);
    B.r(wx - 1, wy - 1, ww + 2, wh + 2, S[0]); B.hl(wx - 1, wy + wh + 1, ww + 2, S[3]); B.hl(wx - 1, wy - 2, ww + 2, S[2]);
    if (lit) {
      const warm = cold ? ["#d9f0f2", "#b9dce2", "#8fc0cc"] : [["#ffd98c", "#f2b45a", "#d98a3a"], ["#ffe8b4", "#f6cc80", "#e0a050"], ["#f2b06a", "#d8884a", "#b0602e"]][(h01(seed) * 3) | 0];
      B.mat(Z.FAC, 40, 255); B.r(wx, wy, ww, wh, warm[1]); B.r(wx, wy, ww, 2, warm[0]); B.r(wx, wy + wh - 3, ww, 3, warm[2]);
      if (cold) { for (let y = wy + 1; y < wy + wh; y += 2) B.hl(wx, y, ww, "#a7ccd4", 0.7); }
      else { const k = h01(seed * 3.3); if (k < 0.4) { B.r(wx, wy, 1, wh, warm[2]); B.r(wx + ww - 1, wy, 1, wh, warm[2]); } else if (k < 0.6) B.r(wx + 1 + (k * 10 | 0) % (ww - 2), wy + 4, 2, wh - 4, "#5a3a26"); }
    } else {
      B.mat(Z.FAC, 255, 0); B.r(wx, wy, ww, wh, P.on ? "#1c2430" : "#34424f"); B.r(wx, wy, ww, 2, P.on ? "#27313f" : "#5c7286");
      if (!P.on) B.line(wx, wy + 4, wx + 2, wy + 2, "#7d93a6"); if (h01(seed * 2.1) < 0.45) B.r(wx, wy, ww, 3 + (h01(seed) * 3 | 0), P.on ? "#3a3c44" : "#d9d4c8", 0.7);
    }
    B.mat(Z.FAC, 255, 0);
    B.vl(wx + (ww >> 1), wy, wh, lit ? "#6a4a2e" : "#d8d2c4", lit ? 0.8 : 0.9); B.hl(wx, wy + 3, ww, lit ? "#6a4a2e" : "#d8d2c4", 0.7);
  }
  function haussmann(B, P, x0, x1, o) {
    const n = o.n, FH = 13, yT = YF - n * FH, w = x1 - x0, S = o.stone, R = rng(o.seed), on = P.on > 0;
    B.mat(Z.FAC, 255, 0);
    const ry = yT - 11;
    B.r(x0, ry, w, 11, o.zinc); for (let x = x0 + 3; x < x1; x += 6) B.vl(x, ry + 1, 10, sh(o.zinc, -14)); B.hl(x0, ry, w, sh(o.zinc, 26)); B.hl(x0, ry + 1, w, sh(o.zinc, 10));
    for (let k = 0; k < 3; k++) { const cx = x0 + 10 + k * ((w - 30) / 2) + (R() * 8 | 0); B.r(cx, ry - 7, 10, 8, "#8c6a58"); B.r(cx, ry - 7, 10, 1, "#a8846e"); B.vl(cx + 9, ry - 6, 7, "#6c5044"); for (let p = 0; p < 4; p++) { B.r(cx + 1 + p * 2, ry - 10, 1, 3, "#b5653f"); } }
    B.r(x0, yT, w, YF - yT, S[1]);
    B.noise(x0, yT, w, YF - yT, S[0], 0.1, o.seed, 0.6); B.noise(x0, yT, w, YF - yT, S[2], 0.09, o.seed + 5, 0.6);
    for (let y = yT + 6; y < YF; y += 4) B.hl(x0, y, w, S[2], 0.22);
    B.r(x0, yT - 1, w, 2, S[0]); B.hl(x0, yT + 1, w, S[3]); B.hl(x0, yT + 2, w, S[2]);
    B.vl(x0, ry, YF - ry, S[3], 0.7); B.vl(x1 - 1, ry, YF - ry, S[3]); B.vl(x0 + 1, yT, YF - yT, S[0], 0.5);
    const nb = Math.floor((w - 6) / 12), pad = Math.round((w - nb * 12) / 2);
    for (let f = 0; f < n; f++) {
      const fy = yT + f * FH, balc = f === 0 || f === n - 2;
      if (f > 0) { B.hl(x0 + 1, fy, w - 2, S[0], 0.8); B.hl(x0 + 1, fy + 1, w - 2, S[2], 0.8); }
      for (let b = 0; b < nb; b++) {
        const wx = x0 + pad + b * 12 + 3, wy = fy + 3, seed = o.seed * 100 + f * 17 + b;
        const lit = on && h01(seed * 1.7) < (P.ph === "nuit" ? 0.2 : 0.16);
        fenetre(B, P, wx, wy, 5, 9, S, lit, seed, false);
        B.px(wx + 2, wy - 2, S[0]);
        if (!balc) { B.mat(Z.FAC, 255, 0); B.hl(wx - 1, wy + 6, 7, "#2a2b2e"); for (let i = 0; i < 7; i += 2) B.vl(wx - 1 + i, wy + 6, 3, "#2a2b2e"); }
        else { B.mat(Z.FAC, 255, 0); B.r(wx - 2, fy + 13, 2, 2, S[2]); B.r(wx + 5, fy + 13, 2, 2, S[2]); }
        // traînée sous l'appui
        B.vl(wx + 1 + (h01(seed) * 3 | 0), wy + 11, 2 + (h01(seed * 4) * 3 | 0), S[2], 0.5);
      }
      if (balc) { B.mat(Z.FAC, 255, 0); B.hl(x0 + 2, fy + 12, w - 4, "#3b3a3c"); B.hl(x0 + 2, fy + 13, w - 4, S[3]); B.hl(x0 + 2, fy + 8, w - 4, "#26272a"); for (let x = x0 + 2; x < x1 - 2; x++) { if ((x - x0) % 2 === 0) B.vl(x, fy + 9, 3, "#2e2f33"); else if ((x - x0) % 6 === 1) B.px(x, fy + 10, "#2e2f33"); } }
    }
    // lucarnes
    for (let b = 0; b < nb; b += 2) { const wx = x0 + pad + b * 12 + 2; B.mat(Z.FAC, 255, 0); B.r(wx, ry + 2, 7, 8, S[1]); B.r(wx, ry + 1, 7, 1, S[0]); B.px(wx + 3, ry, S[0]); const lit = on && h01(o.seed * 7 + b) < 0.3; if (lit) B.mat(Z.FAC, 40, 255); B.r(wx + 1, ry + 3, 5, 6, lit ? "#f6c878" : on ? "#1c2430" : "#3d4b58"); B.mat(Z.FAC, 255, 0); B.vl(wx + 3, ry + 3, 6, lit ? "#7a5632" : "#d8d2c4", 0.8); }
  }

  // ------------------------------------------------------------------ commissariat (150..318)
  function commissariat(B, P) {
    const on = P.on > 0, x0 = 150, x1 = 318, yT = 30, FH = 14;
    const BR = ["#a9644e", "#93523f", "#7a4132", "#5c3026"], ST = ["#ddd5c4", "#c9c0ae", "#aaa190", "#857c6c"];
    B.mat(Z.FAC, 255, 0);
    B.r(x0, yT, x1 - x0, YF - yT, BR[1]);
    for (let y = yT; y < YF; y += 2) for (let x = x0 + ((y / 2) % 2 ? 2 : 0); x < x1; x += 4) { B.px(x, y + 1, BR[2]); if (h2(x, y) < 0.12) B.r(x + 1, y, 3, 1, BR[0]); else if (h2(x, y) > 0.9) B.r(x + 1, y, 3, 1, BR[2]); }
    for (let y = yT; y < YF; y += 2) B.hl(x0, y + 1, x1 - x0, BR[2], 0.35);
    // attique et corniche
    B.r(x0, 23, x1 - x0, 7, ST[1]); B.r(x0, 22, x1 - x0, 2, ST[0]); B.hl(x0, 29, x1 - x0, ST[3]); B.hl(x0, 24, x1 - x0, ST[2]);
    B.r(x0 - 0, 20, x1 - x0, 2, "#59626e"); B.hl(x0, 20, x1 - x0, "#7b8590");
    // avant-corps de pierre
    B.r(208, 23, 52, YF - 23, ST[1]); B.noise(208, 30, 52, YF - 30, ST[0], 0.1, 2, 0.6); B.noise(208, 30, 52, YF - 30, ST[2], 0.08, 6, 0.6);
    B.vl(208, 23, YF - 23, ST[0]); B.vl(259, 23, YF - 23, ST[3]); B.vl(207, 30, YF - 30, BR[3], 0.6);
    B.r(206, 17, 56, 6, ST[1]); B.r(206, 16, 56, 1, ST[0]); B.hl(206, 22, 56, ST[3]);
    B.txt("COMMISSARIAT", 211, 24, ST[3]);
    // bandeaux de pierre
    for (let f = 1; f < 4; f++) { const y = yT + f * FH; B.hl(x0, y, x1 - x0, ST[1]); B.hl(x0, y + 1, x1 - x0, BR[3], 0.6); }
    // fenêtres des ailes
    for (let f = 0; f < 4; f++) for (let b = 0; b < 8; b++) {
      const wx = b < 4 ? 156 + b * 13 : 264 + (b - 4) * 13, wy = yT + f * FH + 3, seed = 500 + f * 9 + b;
      const lit = on && [0.5, 0.2, 0.55, 0.15][f] > h01(seed * 2.3);
      fenetre(B, P, wx, wy, 7, 9, ST, lit, seed, true);
    }
    for (let f = 0; f < 4; f++) for (let b = 0; b < 3; b++) { const wx = 213 + b * 15, wy = yT + f * FH + 3, seed = 700 + f * 5 + b; fenetre(B, P, wx, wy, 9, f === 3 ? 7 : 9, ST, on && f !== 3 && h01(seed * 1.9) < 0.6, seed, true); }
    // mât et hampe
    B.mat(Z.FAC, 255, 0); B.line(256, 75, 269, 56, "#8d9099"); B.px(269, 55, "#d9b34a"); B.r(255, 74, 3, 3, "#6a6d75");
    // rez-de-chaussée en bossage
    B.r(x0, YF, x1 - x0, YB - YF, "#b9b1a1"); for (let y = YF + 3; y < YB; y += 4) B.hl(x0, y, x1 - x0, "#938b7c"); for (let y = YF; y < YB; y += 4) for (let x = x0 + ((y / 4) % 2 ? 6 : 0); x < x1; x += 12) B.vl(x, y, 3, "#9d9586");
    B.hl(x0, YF, x1 - x0, "#d9d2c2"); B.r(x0, YB - 3, x1 - x0, 3, "#8c8577"); B.hl(x0, YB - 3, x1 - x0, "#a59d8e");
    B.noise(x0, YF, x1 - x0, YB - YF, "#a8a091", 0.1, 4, 0.5);
    // fenêtres à barreaux
    for (let b = 0; b < 6; b++) {
      const wx = [157, 173, 189, 265, 0, 0][b]; if (!wx) continue;
      const lit = on && b !== 1;
      B.mat(Z.FAC, 255, 0); B.r(wx - 1, 91, 11, 15, "#d6cfbf"); B.hl(wx - 1, 105, 11, "#7d7668");
      if (lit) B.mat(Z.FAC, 40, 230); B.r(wx, 92, 9, 13, lit ? "#bfe0de" : on ? "#1b232e" : "#3a4855"); if (lit) { B.r(wx, 92, 9, 3, "#e6f6f2"); B.r(wx + 1 + b, 98, 3, 7, "#5c7a80"); }
      B.mat(Z.FAC, 255, 0); for (let i = 1; i < 9; i += 2) B.vl(wx + i, 92, 13, "#22262c"); B.hl(wx, 96, 9, "#22262c"); B.hl(wx, 101, 9, "#22262c");
    }
    // sortie de véhicules
    B.mat(Z.FAC, 255, 0); B.r(279, 89, 32, 23, "#d6cfbf"); B.r(281, 91, 28, 21, "#22355c"); for (let y = 93; y < 112; y += 3) B.hl(281, y, 28, "#182848"); B.hl(281, 91, 28, "#34508a"); B.vl(295, 91, 21, "#182848");
    B.r(283, 108, 24, 2, "#d8b62a"); for (let x = 283; x < 307; x += 4) B.r(x, 108, 2, 2, "#22262c");
    // porche et portes vitrées
    B.r(218, 87, 32, 25, "#ddd5c4"); B.vl(218, 87, 25, "#f0e9da"); B.vl(249, 87, 25, "#8f8778"); B.hl(218, 87, 32, "#f0e9da");
    if (on) B.mat(Z.FAC, 30, 255); else B.mat(Z.FAC, 255, 0);
    B.r(221, 90, 26, 22, on ? "#c6e6e0" : "#2f3d49");
    if (on) { B.r(221, 90, 26, 4, "#effaf4"); B.r(221, 104, 26, 8, "#9ac4c2"); B.r(224, 101, 9, 3, "#5d7c84"); B.r(237, 97, 3, 4, "#3d5560"); B.r(236, 100, 5, 6, "#48606c"); B.r(241, 93, 4, 5, "#e8f0d0"); }
    else { B.line(222, 100, 230, 91, "#62788a"); B.line(236, 108, 246, 96, "#4c6274"); }
    B.mat(Z.FAC, 255, 0);
    B.r(220, 89, 28, 1, "#1d2c4a"); B.vl(220, 89, 23, "#1d2c4a"); B.vl(247, 89, 23, "#1d2c4a"); B.r(233, 89, 2, 23, "#1d2c4a"); B.hl(221, 95, 26, "#1d2c4a"); B.px(232, 102, "#c9c9c9"); B.px(235, 102, "#c9c9c9"); B.r(221, 110, 26, 2, "#1d2c4a");
    // enseigne lumineuse
    B.r(214, 75, 40, 11, "#16223c"); B.mat(Z.FAC, on ? 20 : 255, on ? 255 : 0); B.r(215, 76, 38, 9, on ? "#2c62d6" : "#27458f"); B.big("POLICE", 218, 77, on ? "#ffffff" : "#e6e8ee");
    B.mat(Z.FAC, 255, 0);
    // plaque, cocarde, interphone, caméra, affichage
    B.r(210, 94, 6, 7, "#1b2a55"); B.vl(211, 95, 5, "#2b4bb0"); B.vl(212, 95, 5, "#e8e8e8"); B.vl(213, 95, 5, "#c8323a"); B.hl(211, 100, 4, "#c9b46a");
    B.r(252, 95, 5, 8, "#2a2d33"); B.px(254, 96, "#7fd08a"); B.r(253, 98, 3, 3, "#555b66");
    B.r(261, 88, 4, 2, "#e2e2e2"); B.px(265, 89, "#1a1a1a"); B.vl(262, 86, 2, "#9a9a9a");
    B.r(200, 93, 7, 9, "#e9e4d6"); B.r(201, 94, 5, 2, "#2b4bb0"); B.hl(201, 97, 5, "#8a8a8a"); B.hl(201, 99, 4, "#8a8a8a");
    if (on) { B.mat(Z.FAC, 0, 255); B.r(216, 90, 2, 3, "#bfe0ff"); B.r(250, 90, 2, 3, "#bfe0ff"); B.mat(Z.FAC, 255, 0); } else { B.r(216, 90, 2, 3, "#8fa6c0"); B.r(250, 90, 2, 3, "#8fa6c0"); }
  }

  // ------------------------------------------------------------------ brasserie (0..150)
  function brasserie(B, P) {
    const on = P.on > 0;
    B.mat(Z.FAC, 255, 0);
    B.r(2, YF, 146, YB - YF, "#5a1c1b"); B.r(2, YF, 146, 7, "#641f1d"); B.hl(2, YF, 146, "#8a312c"); B.hl(2, YF + 7, 146, "#3d1211");
    B.mat(Z.FAC, on ? 120 : 255, on ? 150 : 0); B.txt("BRASSERIE LE ZINC", 41, YF + 1, "#e6bf5a"); B.mat(Z.FAC, 255, 0);
    B.px(36, 89, "#e6bf5a"); B.px(112, 89, "#e6bf5a");
    // vitrines
    const wins = [[7, 37], [41, 71], [99, 142]];
    const interior = (xa, xb, door) => {
      if (on) B.mat(Z.FAC, 30, 255); else B.mat(Z.FAC, 255, 0);
      for (let y = 94; y < 109; y++) B.hl(xa, y, xb - xa, on ? hexOf(mix(rgb("#f4bc62"), rgb("#a86226"), (y - 94) / 15)) : hexOf(mix(rgb("#3c3630"), rgb("#28231f"), (y - 94) / 15)));
      if (on) {
        for (let x = xa + 2; x < xb - 2; x += 3) { B.r(x, 101, 1, 3, ["#7fae6a", "#c4572e", "#e9d9a0", "#5a86b0"][(x * 7) % 4]); } B.hl(xa, 104, xb - xa, "#6a3a18");
        for (let x = xa + 6; x < xb - 3; x += 12) { B.r(x, 99, 3, 2, "#fff4cc"); B.px(x + 1, 98, "#8a5a28"); }
        for (let x = xa + 4; x < xb - 5; x += 9 + (h01(x) * 5 | 0)) { if (h01(x * 3.1) < 0.75) { const hy = 103 + (h01(x * 1.7) * 2 | 0); B.r(x, hy, 3, 3, "#3a2016"); B.r(x - 1, hy + 3, 5, 6, ["#3d2a22", "#2c3440", "#4a2a2a"][x % 3]); } }
      } else { B.line(xa + 2, 106, xa + 10, 96, "#5a6470"); B.line(xa + 5, 108, xa + 14, 97, "#4a545f"); B.r(xa + 14, 104, 3, 3, "#1f1b18"); B.r(xa + 13, 107, 5, 2, "#1f1b18"); }
      B.mat(Z.FAC, 255, 0);
      if (door) { B.vl(xa, 94, 18, "#451514"); B.vl(xb - 1, 94, 18, "#451514"); B.vl((xa + xb) >> 1, 94, 18, "#451514"); B.px(((xa + xb) >> 1) - 1, 103, "#d9b34a"); B.px(((xa + xb) >> 1) + 1, 103, "#d9b34a"); }
      else { B.hl(xa, 97, xb - xa, "#451514", 0.6); }
    };
    for (const [a, b] of wins) interior(a, b, false);
    interior(75, 95, true);
    if (on) B.mat(Z.FAC, 30, 255); B.r(75, 109, 20, 3, on ? "#9a5a24" : "#28231f"); B.mat(Z.FAC, 255, 0);
    for (const [a, b] of wins) { B.r(a, 109, b - a, 3, "#4a1716"); B.hl(a, 109, b - a, "#6e2422"); }
    for (const x of [4, 38, 72, 96, 143]) { B.r(x, 93, 3, 19, "#6a2220"); B.vl(x, 93, 19, "#8a312c"); }
    // store banne
    for (let y = 0; y < 5; y++) { const x0 = 3 - (y > 1 ? 1 : 0), x1 = 147 + (y > 1 ? 1 : 0); B.hl(x0, 93 + y, x1 - x0, y === 0 ? "#c9403a" : y < 3 ? "#ae2c2c" : "#8f2224"); }
    for (let x = 2; x < 148; x++) { B.px(x, 98, (x >> 2) % 2 ? "#e9dcc0" : "#8f2224"); if ((x & 3) !== 3) B.px(x, 99, (x >> 2) % 2 ? "#d6c8a8" : "#7a1c1e"); }
    if (on) { B.mat(Z.FAC, 0, 255); for (let x = 6; x < 146; x += 7) B.px(x, 100, "#fff0c0"); B.mat(Z.FAC, 255, 0); } else for (let x = 6; x < 146; x += 7) B.px(x, 100, "#d8d0b8");
    // terrasse
    B.mat(Z.ST, 255, 0);
    for (const tx of [14, 30, 55, 110, 128]) {
      B.hl(tx - 2, 108, 5, "#e2ded4"); B.hl(tx - 2, 109, 5, "#8f8b84"); B.vl(tx, 110, 4, "#2a2a2c"); B.hl(tx - 1, 114, 3, "#2a2a2c");
      for (const s of [-1, 1]) { const cx = tx + s * 5; B.r(cx - 1, 104, 3, 5, "#b8863c"); B.dith(cx - 1, 104, 3, 5, "#8a5e24", 0.5); B.hl(cx - 1, 104, 3, "#d8a650"); B.hl(cx - 2, 109, 5, "#c4923f"); B.vl(cx - 2, 110, 4, "#6a4a22"); B.vl(cx + 2, 110, 4, "#6a4a22"); }
      if (on) { B.mat(Z.ST, 60, 255); B.px(tx, 107, "#ffd98a"); B.mat(Z.ST, 255, 0); B.px(tx, 106, "#f4f0e4"); }
    }
    // ardoise
    B.r(84, 104, 7, 11, "#6a4a22"); B.r(85, 105, 5, 8, "#1f2a2a"); B.hl(86, 106, 3, "#d8d8c8"); B.hl(86, 108, 2, "#c8c8b8"); B.hl(86, 110, 3, "#c8c8b8"); B.px(88, 108, "#d98a5a");
    // jardinières
    for (const x of [3, 66, 99, 138]) { B.r(x, 111, 9, 4, "#4a3a2c"); B.hl(x, 111, 9, "#6a543e"); for (let i = 0; i < 9; i++) { const hgt = 2 + (h01(x + i * 3) * 4 | 0); B.vl(x + i, 111 - hgt, hgt, ["#3f6a3a", "#2f5630", "#527a3e"][i % 3]); if (h01(x * 3 + i) < 0.3) B.px(x + i, 111 - hgt, "#c8443a"); } }
  }

  // ------------------------------------------------------------------ pharmacie, hôtel, rideau baissé (344..480)
  function droite(B, P) {
    const on = P.on > 0;
    B.mat(Z.FAC, 255, 0);
    // pharmacie
    B.r(347, YF, 63, YB - YF, "#e6ece4"); B.r(347, YF, 63, 7, "#f3f6f0"); B.hl(347, YF + 7, 63, "#9fb0a2"); B.hl(347, YF, 63, "#ffffff");
    B.mat(Z.FAC, on ? 120 : 255, on ? 140 : 0); B.txt("PHARMACIE", 361, YF + 1, "#1f8a4c"); B.mat(Z.FAC, 255, 0);
    B.r(353, YF + 1, 5, 5, "#1f8a4c"); B.r(355, YF + 1, 1, 5, "#f3f6f0"); B.r(353, YF + 3, 5, 1, "#f3f6f0");
    if (on) B.mat(Z.FAC, 30, 255); B.r(350, 94, 40, 15, on ? "#e2f6ea" : "#39474a"); B.r(393, 94, 14, 18, on ? "#d2efe0" : "#33403f");
    if (on) { B.r(350, 94, 40, 3, "#f6fff8"); for (let y = 99; y < 108; y += 4) { B.hl(351, y + 3, 38, "#8fb09a"); for (let x = 352; x < 388; x += 3) B.r(x, y, 2, 3, ["#e8f0f0", "#6ab0d8", "#e86a6a", "#f0d878", "#8fd0a0"][(x + y) % 5]); } B.r(396, 100, 3, 4, "#5a7a70"); B.r(395, 104, 5, 6, "#f4f8f4"); }
    else { B.line(352, 106, 362, 95, "#6a8088"); B.line(370, 107, 380, 96, "#586e76"); }
    B.mat(Z.FAC, 255, 0); B.r(350, 109, 40, 3, "#2c7a4a"); B.hl(350, 109, 40, "#3f9a60"); B.vl(390, 94, 18, "#2c7a4a"); B.r(391, 94, 2, 18, "#e6ece4"); B.vl(407, 94, 18, "#2c7a4a"); B.vl(370, 94, 15, "#cfd8cf", 0.8); B.px(404, 103, "#9aa0a0");
    B.r(408, 73, 3, 1, "#3a3d42"); B.r(410, 68, 11, 11, "#1a2420");
    // hôtel
    B.r(412, YF, 44, YB - YF, "#d8ccb4"); B.hl(412, YF, 44, "#efe4cc"); B.r(414, YF + 1, 40, 6, "#3a2a22"); B.mat(Z.FAC, on ? 100 : 255, on ? 170 : 0); B.txt("DU PARC", 421, YF + 1, "#e8c66a"); B.mat(Z.FAC, 255, 0);
    B.r(420, 92, 28, 3, "#2a1c18"); B.hl(420, 92, 28, "#5a3a2c"); B.r(419, 95, 30, 1, "#1a1210");
    if (on) { B.mat(Z.FAC, 0, 255); for (let x = 422; x < 447; x += 4) B.px(x, 96, "#ffe9b0"); }
    if (on) B.mat(Z.FAC, 30, 255); else B.mat(Z.FAC, 255, 0);
    B.r(425, 97, 18, 15, on ? "#f0c070" : "#3a3a36"); if (on) { B.r(425, 97, 18, 3, "#ffe2a0"); B.r(429, 103, 4, 4, "#8a4a2a"); B.r(437, 101, 3, 3, "#3a2218"); B.r(436, 104, 5, 8, "#5a2c2c"); B.r(425, 108, 18, 4, "#a8322e"); }
    B.mat(Z.FAC, 255, 0); B.vl(424, 97, 15, "#5a3a22"); B.vl(443, 97, 15, "#5a3a22"); B.vl(434, 97, 15, "#5a3a22"); B.px(433, 105, "#e8c66a"); B.px(435, 105, "#e8c66a");
    B.r(415, 97, 7, 11, on ? "#2a2620" : "#4a4f52"); B.r(446, 97, 7, 11, on ? "#2a2620" : "#4a4f52"); B.hl(415, 97, 7, "#efe4cc"); B.hl(446, 97, 7, "#efe4cc");
    B.mat(Z.ST, 255, 0); for (const x of [416, 447]) { B.r(x, 109, 5, 4, "#7a5a44"); B.ell(x + 2, 105, 3, 3.4, "#2f5a32"); B.ell(x + 1, 104, 1.6, 1.6, "#47783f"); }
    // enseigne verticale
    B.mat(Z.FAC, 255, 0); B.r(456, 33, 9, 49, "#1c1416"); B.vl(456, 33, 49, "#3a2a2c"); B.r(465, 40, 2, 1, "#3a3d42"); B.r(465, 74, 2, 1, "#3a3d42");
    B.mat(Z.FAC, on ? 0 : 255, on ? 255 : 0); "HOTEL".split("").forEach((ch, i) => B.big(ch, ch === "I" ? 459 : 458, 35 + i * 9, on ? "#ff6a52" : "#b8a8a0"));
    // rideau de fer
    B.mat(Z.FAC, 255, 0); B.r(459, YF, 21, YB - YF, "#8a8d90"); for (let y = YF + 1; y < YB; y += 2) B.hl(459, y, 21, "#6c6f73"); B.r(459, YF, 21, 5, "#4a4038"); B.line(462, 104, 468, 96, "#d84a8a"); B.line(468, 96, 472, 105, "#d84a8a"); B.line(471, 100, 477, 98, "#3ab0c8"); B.vl(458, YF, YB - YF, "#5a5d60");
  }

  // ------------------------------------------------------------------ mobilier urbain
  function reverbere(B, P, x) {
    B.mat(Z.ST, 255, 0);
    B.r(x, 82, 2, 34, "#2a3832"); B.vl(x, 82, 34, "#3f5248"); B.r(x - 1, 114, 4, 8, "#24302b"); B.hl(x - 1, 114, 4, "#3f5248"); B.r(x - 2, 120, 6, 2, "#1d2824");
    B.r(x - 1, 80, 4, 2, "#24302b"); B.px(x, 71, "#24302b"); B.px(x + 1, 71, "#24302b"); B.r(x - 2, 72, 6, 1, "#1d2824"); B.r(x - 1, 73, 4, 1, "#2f3f37");
    B.mat(Z.ST, P.on ? 0 : 255, P.on ? 255 : 0); B.r(x - 1, 74, 4, 6, P.on ? "#ffe6a8" : "#c9cbc4"); if (P.on) B.r(x, 75, 2, 3, "#fffbe8");
    B.mat(Z.ST, 255, 0); B.vl(x - 2, 74, 6, "#1d2824"); B.vl(x + 3, 74, 6, "#1d2824");
  }
  function arbre(B, P, x, seed) {
    const R = rng(seed);
    B.mat(Z.ST, 255, 0);
    for (let y = 70; y < YB + 4; y++) { const w = y > 106 ? 4 : 3; B.r(x - (w >> 1), y, w, 1, "#8f8a78"); B.px(x + (w >> 1), y, "#6a6658"); if (h2(x, y) < 0.3) B.px(x - 1 + (h2(y, x) * 2 | 0), y, "#b9b49e"); else if (h2(x, y) > 0.82) B.px(x, y, "#5c5a4a"); }
    B.line(x, 72, x - 9, 58, "#6a6658"); B.line(x, 70, x + 8, 54, "#6a6658"); B.line(x, 66, x - 2, 48, "#7a7566");
    B.r(x - 5, YB + 2, 11, 3, "#3a3632"); B.dith(x - 5, YB + 2, 11, 3, "#5a5650", 0.5);
    const cols = ["#7a3f1c", "#a85a22", "#c8782a", "#d9a03a", "#8a6a26", "#5f5a28"];
    for (let k = 0; k < 46; k++) { const a = R() * 6.283, d = Math.sqrt(R()), cx = x + Math.cos(a) * d * 22, cy = 50 + Math.sin(a) * d * 17, r = 2.5 + R() * 3.5; const dark = cy > 54; B.ell(cx, cy + 1, r, r * 0.8, cols[dark ? 0 : 1], 0.95); B.ell(cx - 0.6, cy - 0.6, r * 0.75, r * 0.6, cols[(dark ? 1 : 2) + (R() * 2 | 0)], 0.95); if (R() < 0.6) B.px(cx - 1 + R() * 2, cy - r * 0.5, cols[3 + (R() * 3 | 0)]); }
    for (let k = 0; k < 40; k++) { const a = R() * 6.283, d = R(), px = x + Math.cos(a) * d * 23, py = 50 + Math.sin(a) * d * 18; B.px(px, py, k % 3 ? "#3a2616" : "#e0b04a"); }
  }
  function mobilier(B, P) {
    const on = P.on > 0;
    arbre(B, P, 187, 77);
    for (const x of LAMPS()) reverbere(B, P, x);
    for (let k = 1; X0 < -90 - 240 * (k - 1); k++) arbre(B, P, -62 - 240 * (k - 1), 80 + k); for (let k = 1; X1 > 600 + 240 * (k - 1); k++) arbre(B, P, 566 + 240 * (k - 1), 90 + k);
    // potelets
    B.mat(Z.ST, 255, 0);
    for (let x = al(X0, 16) + 8; x < X1; x += 16) { if ((x > 205 && x < 262) || (x > 314 && x < 348) || LAMPS().some((l) => Math.abs(x - l) < 6)) continue; B.vl(x, 115, 7, "#4a3426"); B.px(x, 114, "#6a4c38"); B.px(x, 116, "#e6e2d8"); }
    // barrières
    for (const bx of [197, 258]) { B.hl(bx, 113, 13, "#9aa0a6"); B.hl(bx, 120, 13, "#7c8288"); B.vl(bx, 113, 9, "#9aa0a6"); B.vl(bx + 12, 113, 9, "#7c8288"); for (let i = 2; i < 12; i += 2) B.vl(bx + i, 114, 6, "#858b91"); }
    // colonne Morris
    const mx = 464;
    B.mat(Z.ST, 255, 0);
    B.r(mx, 96, 12, 24, "#2f4a3c"); B.vl(mx, 96, 24, "#42624f"); B.vl(mx + 11, 96, 24, "#1f3328"); B.r(mx - 1, 119, 14, 3, "#24382d");
    B.r(mx - 1, 93, 14, 3, "#2a4235"); B.hl(mx - 1, 93, 14, "#4a6e58"); B.r(mx + 1, 89, 10, 4, "#35523f"); B.r(mx + 3, 86, 6, 3, "#3f5f4a"); B.r(mx + 5, 83, 2, 3, "#2a4235"); B.px(mx + 5, 82, "#4a6e58");
    B.mat(Z.ST, on ? 90 : 255, on ? 200 : 0);
    B.r(mx + 1, 98, 5, 19, "#d8482e"); B.r(mx + 2, 100, 3, 6, "#f2d8a0"); B.hl(mx + 2, 109, 3, "#f6eed8"); B.hl(mx + 2, 111, 3, "#f6eed8"); B.r(mx + 6, 98, 5, 19, "#2c5a9a"); B.r(mx + 7, 101, 3, 4, "#f0e0b0"); B.hl(mx + 7, 108, 3, "#e8ecf4"); B.hl(mx + 7, 112, 2, "#e8ecf4");
    // voiture de police garée
    voiture(B, 262, 136, { body: "#e9ebee", shade: "#b8bcc4", police: true, lights: false }, Z.CAR);
    // poubelle
    B.mat(Z.ST, 255, 0); B.r(300, 113, 1, 8, "#5c6066"); B.r(302, 113, 4, 7, "#7fae7a"); B.dith(302, 113, 4, 7, "#5c8a5c", 0.5); B.hl(301, 112, 6, "#5c6066");
  }
  function voiture(B, x, y, o, z) {
    // x = bord gauche, y = bas des roues, longueur 58
    const d = o.dir || 1, X = (i) => (d > 0 ? x + i : x + 57 - i);
    B.mat(z, 255, 0);
    const seg = (i, yy, w, col, a) => B.r(d > 0 ? x + i : x + 58 - i - w, yy, w, 1, col, a);
    for (let j = 0; j < 9; j++) { const yy = y - 19 + j, a = 13 + Math.max(0, 4 - j) * 1.2, b = 45 - Math.max(0, 5 - j) * 0.9; seg(Math.round(a), yy, Math.round(b - a), j === 0 ? sh(o.body, 14) : o.body); }
    for (let j = 0; j < 9; j++) { const yy = y - 10 + j; seg(j < 2 ? 1 : 0, yy, j < 2 ? 56 : 58, j < 1 ? sh(o.body, 14) : j > 5 ? o.shade : o.body); }
    seg(0, y - 2, 58, sh(o.shade, -40)); seg(1, y - 1, 56, "#1c1d21");
    // vitres
    for (let j = 1; j < 8; j++) { const yy = y - 19 + j, a = 15 + Math.max(0, 4 - j) * 1.2, b = 43 - Math.max(0, 5 - j) * 0.9; seg(Math.round(a), yy, Math.round(b - a), "#1e2a38"); seg(Math.round(a), yy, 2, "#3d566e"); }
    for (let j = 1; j < 8; j++) seg(29, y - 19 + j, 1, o.body);
    seg(18, y - 17, 6, "#5a7690", 0.8); seg(32, y - 17, 5, "#5a7690", 0.8);
    // roues
    for (const wx of [11, 46]) { B.ell(X(wx), y - 3, 4.2, 4.2, "#17181b"); B.ell(X(wx), y - 3, 2, 2, "#8c9096"); B.px(X(wx), y - 3, "#3a3d42"); }
    seg(24, y - 9, 1, o.shade); seg(36, y - 9, 1, o.shade); seg(22, y - 7, 2, "#3a3d42"); seg(34, y - 7, 2, "#3a3d42");
    if (o.police) {
      seg(14, y - 7, 30, "#2a4fb0"); for (let i = 0; i < 6; i++) { B.px(X(4 + i), y - 9 + i, "#2a4fb0"); B.px(X(6 + i), y - 9 + i, "#d8343a"); B.px(X(48 + i), y - 9 + i, "#d8343a"); B.px(X(50 + i), y - 9 + i, "#2a4fb0"); }
      B.mat(z, 255, 0); B.txt("POLICE", d > 0 ? x + 18 : x + 17, y - 6, "#f4f6fa");
      B.mat(z, 255, o.flash ? 255 : 0); seg(24, y - 21, 10, o.flash ? "#5a9aff" : "#3058b0"); B.mat(z, 255, 0); seg(24, y - 20, 10, "#22262c");
    }
    // feux
    B.mat(z, 255, o.lights ? 255 : 0); B.r(X(57) - (d > 0 ? 1 : 0), y - 8, 2, 2, o.lights ? "#fff6d0" : "#d8d8cc"); B.r(X(0) - (d > 0 ? 0 : 1), y - 8, 2, 2, o.lights ? "#ff3a2a" : "#a82a24");
    B.mat(z, 255, 0);
  }
  PL.voiture = voiture;

  // ------------------------------------------------------------------ premier plan
  function premierPlan(B, P) {
    const on = P.on > 0;
    // bouche de métro : candélabre, plaque, entourage (collés au bord gauche de l'écran)
    B.ox = 0; B.mat(Z.FG, 70, 0);
    B.r(25, 58, 3, 92, "#16201c"); B.vl(25, 58, 92, "#2a3a32"); B.r(23, 140, 7, 10, "#121a17"); B.r(24, 60, 5, 2, "#121a17");
    B.r(9, 44, 35, 14, "#121a17"); B.r(8, 46, 37, 10, "#121a17"); B.px(26, 43, "#121a17"); B.px(27, 43, "#121a17");
    B.mat(Z.FG, on ? 60 : 255, on ? 200 : 0); B.r(10, 46, 33, 10, "#a8222a"); B.hl(10, 46, 33, "#c8383a"); B.mat(Z.FG, on ? 0 : 255, on ? 255 : 0); B.big("METRO", 12, 48, on ? "#fff2c8" : "#f0e6d0");
    B.mat(Z.FG, 70, 0); B.r(25, 40, 3, 4, "#121a17");
    B.mat(Z.FG, on ? 0 : 255, on ? 255 : 0); B.ell(26.5, 34, 5.4, 5.4, on ? "#fff0c4" : "#e4e2d8"); if (on) B.ell(26, 33.4, 3, 3, "#fffdf2"); else B.ell(25, 32.5, 2, 2, "#f6f4ea");
    B.mat(Z.FG, 70, 0); B.r(24, 39, 5, 1, "#121a17");
    B.r(0, 131, 70, 2, "#121a17"); B.hl(0, 131, 70, "#2a3a32"); for (let x = 2; x < 70; x += 4) B.vl(x, 133, 17, "#121a17"); for (let x = 0; x < 70; x += 16) { B.r(x, 128, 3, 22, "#0e1513"); B.px(x + 1, 127, "#2a3a32"); } B.r(0, 146, 70, 1, "#121a17");
    B.line(70, 131, 86, 150, "#121a17"); B.line(71, 131, 87, 150, "#121a17");
    // branches et feuilles, en haut à droite
    B.ox = FW - CW; B.mat(Z.FG, on ? 50 : 150, 0);
    B.line(480, 20, 430, 8, "#15100c"); B.line(480, 21, 432, 9, "#15100c"); B.line(450, 12, 428, 22, "#15100c"); B.line(462, 15, 446, 30, "#15100c"); B.line(440, 10, 414, 4, "#15100c");
    const R = rng(91), cols = on ? ["#1e150d", "#2c1c0e", "#4a2a10", "#7a4418"] : ["#5a3414", "#7a4418", "#a85a22", "#c8782a"];
    for (let k = 0; k < 90; k++) { const t = R(), bx = 404 + t * 78 + (R() - 0.5) * 12, by = 2 + (1 - t) * 6 + R() * 22 * (0.4 + t * 0.6); B.ell(bx, by, 1.5 + R() * 2.2, 1 + R() * 1.6, cols[(R() * R() * 4) | 0]); }
    B.mat(Z.FG, on ? 160 : 255, 0); for (let k = 0; k < 26; k++) { const t = R(); B.px(404 + t * 78 + (R() - 0.5) * 12, 3 + R() * 24, k % 2 ? "#c8782a" : "#d9a03a"); }
    B.ox = OX;
  }

  // ------------------------------------------------------------------ personnages
  function fig(B, x, yf, o) {
    x = Math.round(x);
    const d = o.dir || 1, wk = o.walk, s = wk != null ? Math.round(Math.sin(wk) * 3) : 0, bob = wk != null && Math.abs(Math.sin(wk)) < 0.4 ? 0 : wk != null ? 1 : 0, y = yf - (bob ? 0 : 0);
    const coatDk = sh(o.coat, -26), long = o.long ? 5 : 0;
    // jambes
    B.line(x - 1, y - 9, x - 1 - s, y - 1, sh(o.pants, -18)); B.line(x - 2, y - 9, x - 2 - s, y - 1, sh(o.pants, -18));
    B.line(x + 1, y - 9, x + 1 + s, y - 1, o.pants); B.line(x, y - 9, x + s, y - 1, o.pants);
    B.r(x - 2 - s + (d > 0 ? 0 : -1), y - 1, 3, 1, "#18181b"); B.r(x + s + (d > 0 ? 0 : -1), y - 1, 3, 1, "#222226");
    // buste
    B.r(x - 3, y - 18, 6, 10 + long, o.coat); B.r(x - 4, y - 18, 8, 2, o.coat); B.vl(d > 0 ? x - 3 : x + 2, y - 17, 9 + long, coatDk); B.hl(x - 4, y - 18, 8, sh(o.coat, 22));
    if (o.long) { B.vl(x, y - 9, 6, coatDk); }
    if (o.shirt) { B.r(x - 1 + (d > 0 ? 1 : 0), y - 18, 1, 4, o.shirt); }
    if (o.band) { B.r(d > 0 ? x + 2 : x - 4, y - 16, 2, 2, o.band); }
    // bras
    const as = wk != null ? -s * 0.7 : 0;
    B.line(d > 0 ? x + 3 : x - 4, y - 17, (d > 0 ? x + 3 : x - 4) + Math.round(as), y - 10, sh(o.coat, 8)); B.px((d > 0 ? x + 3 : x - 4) + Math.round(as), y - 9, o.skin);
    if (o.bag) { const bx = (d > 0 ? x + 3 : x - 7) + Math.round(as) - (d > 0 ? 1 : 0); B.r(bx, y - 8, 5, 4, o.bag); B.hl(bx, y - 8, 5, sh(o.bag, 26)); B.px(bx + 2, y - 9, sh(o.bag, -20)); B.px(bx + 2, y - 7, "#d9b34a"); }
    // tête
    if (o.scarf) B.r(x - 2, y - 19, 4, 2, o.scarf); else B.r(x - 1, y - 19, 2, 1, o.skin);
    B.r(x - 2, y - 24, 5, 5, o.skin); B.px(x + (d > 0 ? -2 : 2), y - 20, sh(o.skin, -30)); B.vl(d > 0 ? x - 2 : x + 2, y - 24, 4, o.hair); B.r(x - 2, y - 25, 5, 2, o.hair); if (o.hairLong) B.vl(d > 0 ? x - 3 : x + 3, y - 24, 6, o.hair);
    B.px(x + d, y - 22, "#1a1412"); B.px(x + d * 2, y - 21, sh(o.skin, -22));
    if (o.kepi) { B.r(x - 2, y - 26, 5, 2, "#1c2a4a"); B.r(d > 0 ? x : x - 2, y - 24, 3, 1, "#101828"); B.px(x, y - 26, "#d9d9e0"); }
    if (o.cig) { B.px(x + d * 3, y - 20, "#e8e8e0"); B.mat(Z.ACT, 0, o.cigOn ? 255 : 120); B.px(x + d * 4, y - 20, "#ff7a2a"); B.mat(Z.ACT, 255, 0); }
    if (o.umb) { B.vl(x + d * 2, y - 33, 20, "#2a2a2e"); for (let i = -8; i <= 8; i++) { const hh = Math.round(Math.sqrt(Math.max(0, 1 - (i * i) / 70)) * 5); B.vl(x + d * 2 + i, y - 33 - hh + 5, hh > 3 ? 2 : 1, i % 4 === 0 ? sh(o.umb, -20) : o.umb); B.px(x + d * 2 + i, y - 33 - hh + 4, sh(o.umb, 30)); } }
  }
  const LOOKS = [
    { coat: "#5a3e34", pants: "#2c2f3a", skin: "#d9a273", hair: "#2a1e1a", scarf: "#a8322e", umb: "#3a4a6a" },
    { coat: "#6a7a5a", pants: "#3a3432", skin: "#8f5e3c", hair: "#1e1b1c", hairLong: true, bag: "#7a4a2a", umb: "#8a2a3a" },
    { coat: "#c8b08a", pants: "#3c4660", skin: "#ecbd96", hair: "#8e3d1f", hairLong: true, long: true, umb: "#d8d2c0" },
    { coat: "#3c4a5c", pants: "#26282e", skin: "#b98257", hair: "#3c271a", shirt: "#e8e4dc", umb: "#2c2c30" },
    { coat: "#7a3440", pants: "#2a2c34", skin: "#f0c8a4", hair: "#d7b45f", hairLong: true, scarf: "#e8dcc0", umb: "#4a6a5a" },
  ];
  const AVOCAT = { coat: "#27334a", pants: "#1e222c", skin: "#b98257", hair: "#1e1b1c", long: true, scarf: "#8a8f9a", bag: "#6a4226", shirt: "#e8e4dc", dir: 1 };
  const AGENT = { coat: "#22335a", pants: "#1c2644", skin: "#e2b48f", hair: "#5a3b26", kepi: true, dir: -1, cig: true, band: "#e6e8ee" };

  // ------------------------------------------------------------------ prolongements de la rue
  const LAMPS = () => { const a = [132, 374]; for (let x = -108; x > X0 - 20; x -= 240) a.push(x); for (let x = 614; x < X1 + 20; x += 240) a.push(x); return a; };
  const SHOPS = [["boulangerie", "BOULANGERIE", "#e9d9b0", "#8a5a22", [1, 0.74, 0.4]], ["rideau"], ["laverie", "LAVERIE", "#dfe9f2", "#2a5a9a", [0.7, 0.86, 1]], ["librairie", "LIBRAIRIE", "#2c4a3a", "#e8d9a0", [1, 0.8, 0.5]], ["tabac", "TABAC", "#3a2a26", "#e8443a", [1, 0.6, 0.4]], ["fleurs", "FLEURS", "#3e6a4a", "#f0e6d0", [0.9, 1, 0.8]], ["rideau"], ["epicerie", "ALIMENTATION", "#e8e2d0", "#2a7a3a", [1, 0.9, 0.7]]];
  function boutiques(B, P, x0, x1, k) {
    const on = P.on > 0, w = (x1 - x0 - 6) >> 1;
    for (let j = 0; j < 2; j++) {
      const sx = x0 + 3 + j * w, def = SHOPS[(k * 2 + j) % SHOPS.length], kind = def[0];
      B.mat(Z.FAC, 255, 0);
      if (kind === "rideau") { B.r(sx, YF, w - 2, YB - YF, "#8a8d90"); for (let y = YF + 1; y < YB; y += 2) B.hl(sx, y, w - 2, "#6c6f73"); B.r(sx, YF, w - 2, 5, "#4a4038"); B.line(sx + 8, 104, sx + 16, 95, "#3ab0c8"); B.line(sx + 16, 95, sx + 22, 106, "#3ab0c8"); B.line(sx + 30, 100, sx + 44, 97, "#d8a03a"); continue; }
      const lit = on && !(kind === "librairie" && P.ph === "nuit") && !(kind === "fleurs" && P.ph === "nuit");
      B.r(sx, YF, w - 2, YB - YF, def[2]); B.r(sx, YF, w - 2, 7, sh(def[2], -10)); B.hl(sx, YF, w - 2, sh(def[2], 24)); B.hl(sx, YF + 7, w - 2, sh(def[2], -50));
      B.mat(Z.FAC, lit ? 120 : 255, lit ? 140 : 0); B.txt(def[1], sx + ((w - 2 - def[1].length * 4) >> 1), YF + 1, def[3]);
      if (lit) B.mat(Z.FAC, 30, 255); else B.mat(Z.FAC, 255, 0);
      const c = def[4], glass = lit ? hexOf([255 * c[0], 236 * c[1], 200 * c[2]]) : on ? "#1c232c" : "#3a4750";
      B.r(sx + 3, 94, w - 22, 15, glass); B.r(sx + w - 17, 94, 12, 18, lit ? sh(glass, -16) : glass);
      if (lit) {
        B.r(sx + 3, 94, w - 22, 3, sh(glass, 20));
        if (kind === "boulangerie") for (let x = sx + 5; x < sx + w - 21; x += 4) { B.r(x, 101, 3, 2, "#c88a3a"); B.r(x, 105, 3, 2, "#e0a850"); B.px(x + 1, 100, "#8a5a22"); }
        if (kind === "laverie") for (let x = sx + 6; x < sx + w - 24; x += 9) { B.r(x, 99, 7, 8, "#eef2f6"); B.ell(x + 3.5, 103, 2.4, 2.4, "#5a7a9a"); B.px(x + 3, 102, "#bfd4e8"); }
        if (kind === "tabac" || kind === "epicerie") for (let y = 99; y < 108; y += 4) for (let x = sx + 5; x < sx + w - 21; x += 3) B.r(x, y, 2, 3, ["#e8443a", "#e8c66a", "#5a9a5a", "#f0f0e8", "#3a7ab0"][(((x + y) % 5) + 5) % 5]);
        if (kind === "librairie") for (let y = 98; y < 108; y += 5) { B.hl(sx + 4, y + 4, w - 24, "#6a4a22"); for (let x = sx + 5; x < sx + w - 21; x += 2) B.vl(x, y, 4, ["#a8322e", "#2c5a9a", "#e8d9a0", "#3e6a4a", "#5b4a7a"][(((x * 3 + y) % 5) + 5) % 5]); }
        if (kind === "fleurs") for (let x = sx + 5; x < sx + w - 21; x += 3) { B.vl(x, 103, 5, "#3f7a3f"); B.px(x, 102, ["#e86a8a", "#f0d050", "#f0f0f0", "#e8443a"][((x % 4) + 4) % 4]); B.px(x + 1, 103, "#4f9a4f"); }
      } else if (!on) { B.line(sx + 5, 106, sx + 14, 96, "#62788a"); B.line(sx + 20, 107, sx + 28, 97, "#4c6274"); }
      B.mat(Z.FAC, 255, 0); B.r(sx + 3, 109, w - 22, 3, sh(def[2], -40)); B.vl(sx + w - 18, 94, 18, sh(def[2], -60)); B.vl(sx + w - 5, 94, 18, sh(def[2], -60)); B.px(sx + w - 8, 103, "#d9b34a");
      if (kind === "tabac") { B.r(sx + w - 3, 74, 2, 1, "#3a3d42"); B.mat(Z.FAC, lit ? 0 : 255, lit ? 255 : 0); for (let i = 0; i < 9; i++) B.r(sx + w - 3 + Math.abs(4 - i) * 0 - (4 - Math.abs(4 - i)), 76 + i, 1 + 2 * (4 - Math.abs(4 - i)), 1, lit ? "#ff5040" : "#b8322a"); B.mat(Z.FAC, 255, 0); }
      if (kind === "fleurs") { B.mat(Z.ST, 255, 0); for (let x = sx + 2; x < sx + w - 20; x += 5) { B.r(x, 113, 4, 4, "#5a4a3a"); B.px(x + 1, 111, ["#e86a8a", "#f0d050", "#f4f4f4"][((x % 3) + 3) % 3]); B.px(x + 2, 112, "#4f9a4f"); B.px(x, 112, "#3f7a3f"); } }
    }
  }
  function shopLights(P) {
    const L = [];
    const one = (x0, x1, k) => { const w = (x1 - x0 - 6) >> 1; for (let j = 0; j < 2; j++) { const def = SHOPS[(k * 2 + j) % SHOPS.length], kind = def[0]; if (kind === "rideau" || ((kind === "librairie" || kind === "fleurs") && P.ph === "nuit")) continue; L.push({ x: x0 + 3 + j * w + (w >> 1) - 6, y: 102, r: 38, c: def[4], i: 0.9 * P.on, haze: 0.14, hr: 26 }); if (kind === "tabac") L.push({ x: x0 + 3 + j * w + w - 3, y: 80, r: 22, c: [1, 0.25, 0.2], i: 0.8 * P.on, haze: 0.3, hr: 16 }); } };
    for (let k = 1; X0 < -150 * (k - 1); k++) one(-150 * k, -150 * (k - 1), k);
    for (let k = 1; X1 > 480 + 150 * (k - 1); k++) one(480 + 150 * (k - 1), 480 + 150 * k, k + 4);
    return L;
  }

  // ------------------------------------------------------------------ lumières (coordonnées du repère, décalées ensuite)
  function lights(P) {
    if (!P.on) return P.rain ? [] : [{ x: X1 + 80, y: -60, r: FW + 160, c: [1, 0.86, 0.62], i: 0.85 }];
    const k = P.on, L = [], warm = [1, 0.72, 0.38], cold = [0.62, 0.92, 0.95];
    const add = (x, y, r, c, i, o) => L.push(Object.assign({ x, y, r, c, i: i * k }, o || {}));
    for (const x of LAMPS()) add(x + 1, 77, 74, warm, 1.25, { down: true, up: 26, haze: 0.5, hr: 30 });
    for (const x of [22, 56, 85, 120]) add(x, 103, 36, [1, 0.68, 0.34], 0.95, { haze: 0.12, hr: 26 });
    for (let x = 6; x < 146; x += 14) add(x, 101, 13, [1, 0.8, 0.5], 0.5);
    add(234, 100, 46, cold, 1.25, { haze: 0.2, hr: 30 });
    add(234, 80, 40, [0.3, 0.52, 1], 1.05, { haze: 0.42, hr: 26 });
    for (const x of [161, 193, 269]) add(x, 99, 22, cold, 0.6, { haze: 0.06, hr: 14 });
    add(372, 102, 42, [0.75, 1, 0.84], 1.0, { haze: 0.16, hr: 30 });
    add(434, 102, 30, [1, 0.72, 0.4], 0.95, { haze: 0.12, hr: 20 });
    add(460, 57, 30, [1, 0.3, 0.22], 0.9, { haze: 0.34, hr: 22 });
    add(470, 108, 13, [1, 0.9, 0.75], 0.5);
    add(331, 91, 20, warm, 0.5, { haze: 0.25, hr: 12 });
    if (P.ph === "nuit") add(183, 10, 26, [1, 0.9, 0.7], 0.0, { haze: 0.16, hr: 18 });
    for (const l of shopLights(P)) L.push(l);
    for (const l of L) l.x += OX;
    L.push({ x: 26, y: 36, r: 44, c: [1, 0.88, 0.62], i: 0.9 * k, haze: 0.55, hr: 26 }, { x: 26, y: 50, r: 26, c: [1, 0.3, 0.26], i: 0.5 * k, haze: 0.2, hr: 20 });
    return L;
  }

  // ------------------------------------------------------------------ les pigeons du quartier
  const PERCH = [[218, 74], [246, 74], [100, 85], [356, 85], [300, 121], [150, 121], [44, 85]];
  function pigeon(B, x, y, fly, t, i) {
    const c = i % 3 === 0 ? "#8a8f9a" : i % 3 === 1 ? "#6f7480" : "#a8a2a0";
    if (!fly) { const peck = Math.sin(t * 1.7 + i * 2.1) > 0.86; B.r(x - 2, y - 2, 4, 2, c); B.px(x + 2, y - 2, sh(c, -30)); B.px(x + (peck ? 2 : 1), y - (peck ? 1 : 3), sh(c, 20)); B.px(x + (peck ? 3 : 2), y - (peck ? 1 : 3), "#d98a3a"); B.px(x - 3, y - 1, sh(c, -20)); B.px(x - 1, y, "#b05a4a"); B.px(x - 1, y - 2, "#5a8a7a"); }
    else { const up = Math.floor(t * 9 + i) % 2; B.r(x - 1, y - 1, 3, 1, c); B.px(x + 2, y - 1, sh(c, 20)); if (up) { B.px(x - 1, y - 2, sh(c, 30)); B.px(x, y - 3, sh(c, 30)); B.px(x + 1, y - 2, sh(c, 30)); } else { B.px(x - 2, y, sh(c, -20)); B.px(x, y, sh(c, -20)); B.px(x - 1, y + 1, sh(c, -20)); } }
  }

  // ------------------------------------------------------------------ la scène
  function Scene(W) {
    FW = Math.max(CW, Math.min(960, W)); OX = (FW - CW) >> 1; X0 = -OX; X1 = CW + OX;
    const dims = { FW, OX, X0, X1 };
    const R = PL.Renderer(FW, H);
    let P = null;
    const birds = PERCH.map(([x, y], i) => ({ hx: x, hy: y, x, y, fly: 0, vx: 0, vy: 0, back: 0, i }));
    const S = { W: FW, H, R };
    const use = () => { FW = dims.FW; OX = dims.OX; X0 = dims.X0; X1 = dims.X1; };
    S.set = function (ph, rain) { use(); P = PL.conf(ph, rain); const B = R.stat; B.c.fill(0); B.e.fill(0); B.l.fill(0); B.z.fill(0); B.G = 0; B.ox = OX; build(B, P, R.wet); B.ox = OX; R.bake(lights(P)); };
    let lastT = 0;
    S.frame = function (t, mouse) {
      use();
      const B = R.work, on = P.on > 0; B.copy(R.stat); B.G = 0; B.ox = OX;
      const dyn = [], dt = Math.min(0.2, Math.max(0, t - lastT)); lastT = t;
      // drapeau : hampe oblique, étoffe qui pend
      B.mat(Z.FAC, 255, 0);
      for (let i = 2; i < 15; i++) { const px = 257 + i * 0.8, py = 73 - i * 1.15, fold = Math.sin(i * 1.0 - t * 2.4); for (let j = 0; j < 13; j++) { const c = j < 4 ? "#2a4aa8" : j < 9 ? "#ececec" : "#cf2c34", wv = Math.round(Math.sin(t * 2.4 - j * 0.45 - i * 0.5) * 1.1 * (j / 12)); B.px(px + wv, py + 1 + j, fold > 0.45 ? sh(c, -40) : fold < -0.6 ? sh(c, 14) : c); } }
      // croix de pharmacie
      if (on) {
        const cyc = (t % 4.5), st = cyc < 2.6 ? 2 : cyc < 3.3 ? 1 : cyc < 3.7 ? 0 : 1;
        B.mat(Z.FAC, 0, 255);
        if (st > 0) { const c = st === 2 ? "#4aff8c" : "#1f9a50"; B.r(414, 69, 3, 9, c); B.r(411, 72, 9, 3, c); if (st === 2) { B.r(415, 70, 1, 7, "#d8ffe6"); B.r(412, 73, 7, 1, "#d8ffe6"); } }
        dyn.push({ x: 415 + OX, y: 74, r: 34, c: [0.25, 1, 0.5], i: st * 0.42 * P.on, haze: st * 0.18, hr: 22 });
      } else { B.mat(Z.FAC, 255, 0); B.r(414, 69, 3, 9, "#2c9a5a"); B.r(411, 72, 9, 3, "#2c9a5a"); }
      // pigeons : ils s'envolent quand la souris approche, puis reviennent
      B.G = Z.CAR; B.mat(Z.ACT, 255, 0);
      if (!P.rain || P.ph !== "nuit") for (const b of birds) {
        if (P.ph === "nuit" && b.i > 2) continue;
        if (!b.fly && mouse && Math.hypot(mouse.x - OX - b.x, mouse.y - b.y) < 26) { b.fly = 1; b.vx = (b.x < mouse.x - OX ? -1 : 1) * (38 + b.i * 5); b.vy = -46 - b.i * 4; b.back = t + 14 + b.i * 2; }
        if (b.fly === 1) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 6 * dt; if (t > b.back) { b.fly = 2; b.x = b.hx + (b.i % 2 ? 120 : -120); b.y = -10; } }
        else if (b.fly === 2) { const dx = b.hx - b.x, dy = b.hy - b.y, d = Math.hypot(dx, dy); if (d < 2) { b.fly = 0; b.x = b.hx; b.y = b.hy; } else { b.x += dx / d * 60 * dt; b.y += dy / d * 60 * dt; } }
        if (b.y > -8) pigeon(B, Math.round(b.x), Math.round(b.y), b.fly, t, b.i);
      }
      // personnages (derrière la voiture garée et le premier plan)
      fig(B, 254, 113, Object.assign({}, AGENT, { cigOn: (t % 3.4) < 0.9 }));
      fig(B, 225, 117, AVOCAT);
      const nw = Math.round(5 * FW / 480);
      for (let i = 0; i < nw; i++) {
        const sp = [13, -17, 9, -11, 15, -14, 11, -9][i % 8], span = FW + 80, x0 = h01(i * 5.3) * span, x = ((x0 + sp * t) % span + span) % span - 40 + X0, lane = [119, 121, 118, 120, 121][i % 5];
        fig(B, x, lane, Object.assign({}, LOOKS[i % 5], { dir: sp > 0 ? 1 : -1, walk: t * Math.abs(sp) * 0.42 + i, umb: P.rain && i % 4 !== 3 ? LOOKS[i % 5].umb : null }));
      }
      // voiture qui passe
      B.G = Z.FG;
      const per = (FW + 160) / 82 + 11, cyc = t % per;
      if (cyc < (FW + 160) / 82) {
        const cx = X0 - 70 + cyc * 82;
        voiture(B, Math.round(cx), 148, { body: "#3a3f4c", shade: "#272b35", lights: on, dir: 1 }, Z.CAR - 1);
        if (on) { dyn.push({ x: cx + 66 + OX, y: 141, r: 62, c: [1, 0.93, 0.74], i: 1.3 * P.on, dir: 1, haze: 0.5, hr: 24 }); dyn.push({ x: cx - 2 + OX, y: 141, r: 18, c: [1, 0.2, 0.15], i: 0.8 * P.on, haze: 0.2, hr: 10 }); }
        if (P.rain) { B.mat(Z.CAR - 1, 255, 0); for (let k = 0; k < 10; k++) B.px(cx + 4 - k * 2 - h01(k + (t * 20 | 0)) * 4, 147 - h01(k * 3 + (t * 20 | 0)) * 4, "#aab4c4", 0.5); }
      }
      // feuilles qui tombent
      B.mat(Z.ACT, 255, 0);
      for (let i = 0; i < 7; i++) { const T = 9 + h01(i * 3.7) * 6, u = ((t + h01(i * 9.1) * T) % T) / T, x = (i < 4 ? 160 + h01(i * 2.3) * 60 : 400 + h01(i * 2.9) * 70) + Math.sin(u * 9 + i) * 6 - u * 10, y = 34 + u * 86; B.px(x, y, i % 2 ? "#d9a03a" : "#c8782a"); if (Math.sin(u * 30 + i) > 0) B.px(x + 1, y, "#a85a22"); }
      // pluie (coordonnées d'écran)
      if (P.rain) {
        B.G = 0; B.ox = 0;
        const nr = Math.round(230 * FW / 480);
        for (let i = 0; i < nr; i++) { const sp = 150 + h01(i * 1.3) * 60, x0 = h01(i * 7.7) * (FW + 60), y = ((h01(i * 3.1) * H + t * sp) % (H + 10)) - 6, x = x0 - y * 0.28, len = 3 + (i % 3); for (let k = 0; k < len; k++) { const xx = (x - k * 0.28) | 0, yy = (y + k) | 0; if (xx < 0 || yy < 0 || xx >= FW || yy >= H) continue; const q = yy * FW + xx; if (B.z[q] === Z.SKY) continue; const j = q * 3, a = 0.3; B.c[j] += (215 - B.c[j]) * a; B.c[j + 1] += (225 - B.c[j + 1]) * a; B.c[j + 2] += (240 - B.c[j + 2]) * a; B.l[q] = Math.max(B.l[q], 150); } }
        B.mat(Z.ACT, 255, 0);
        for (let i = 0; i < Math.round(46 * FW / 480); i++) { const u = t * 3 + h01(i * 4.4) * 5, ph = u % 1, sx = (h01(i * 2.9 + (u | 0) * 0.37) * FW) | 0, sy = YB + 1 + (h01(i * 6.1 + (u | 0) * 0.71) * (H - YB - 2) | 0); if (ph < 0.5) { const q = sy * FW + sx; if (B.z[q] === Z.ROAD || B.z[q] === Z.WALK) { B.px(sx - 1, sy, "#c8d4e4", 0.5); B.px(sx + 1, sy, "#c8d4e4", 0.5); if (ph < 0.25) B.px(sx, sy - 1, "#dfe8f4", 0.6); } } }
        B.ox = OX;
      }
      R.frame({ amb: P.amb, dyn, wet: P.wet, t, YR, YB, mist: P.mist || null, glow: P.glow });
    };
    S.present = (ctx, w, h) => R.present(ctx, w, h);
    return S;
  }
  // La trousse des décors éclairés (decor-lit2.js) : mêmes pinceaux, même repère
  D.litKit = { H, CW, YF, YB, YK, YR, Z, sh, al, ciel, sol, fenetre, haussmann, boutiques, shopLights, reverbere, arbre, voiture, fig, pigeon, LOOKS,
    dims(W) { const fw = Math.max(CW, Math.min(960, W)), ox = (fw - CW) >> 1; return { FW: fw, OX: ox, X0: -ox, X1: CW + ox }; },
    use(d) { FW = d.FW; OX = d.OX; X0 = d.X0; X1 = d.X1; } };
  D.LIT = D.LIT || {};
  D.LIT.commissariat = { H, make: Scene };
})();
