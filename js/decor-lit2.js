/* La Permanence — décors éclairés, suite : les quatorze autres extérieurs (CR.dec.LIT).
   Chaque lieu est une fiche : loin (ce qui dépasse à l'horizon), centre (le bâtiment, repère 0..480), devant (mobilier,
   personnages fixes), anim (ce qui bouge), cotes (ce qui prolonge la rue : haussmann, moderne, pavillons, mur, champs).
   La fabrique (fabrique) fait le reste : ciel, sol, lumières, ombres portées de jour, passants, véhicule, oiseaux, pluie.
   Les oiseaux s'envolent quand la souris approche ; chaque lieu cache un détail qui bouge. */
(function () {
  const CR = window.CR, PL = CR.lum, D = CR.dec, K = D.litKit;
  const { rgb, h01, h2, mix, hexOf, rng } = PL;
  const { H, CW, YF, YB, YK, YR, Z, sh } = K;
  const S1 = ["#e3d6bc", "#cfc0a3", "#b5a68a", "#8f8169"], S2 = ["#ddd3c4", "#c7bcab", "#ab9f8e", "#877c6c"], S3 = ["#d9cdb8", "#c2b59e", "#a69a84", "#837864"];
  const WARM = [1, 0.72, 0.38], COLD = [0.62, 0.92, 0.95], WHITE = [1, 0.96, 0.86];
  const strip = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9 '.-]/g, " ").replace(/\s+/g, " ").trim();
  const farC = (P, hex, k) => { const c = rgb(hex), a = P.amb.map((v) => Math.min(1, v)); return mix([c[0] * a[0], c[1] * a[1], c[2] * a[2]], P.far, k); };
  const ROBE = { coat: "#1e1e24", pants: "#16161a", skin: "#d9a273", hair: "#3c271a", long: true, shirt: "#f2efe6", bag: "#6a4226" };
  const ROBE2 = { coat: "#1e1e24", pants: "#16161a", skin: "#8f5e3c", hair: "#1e1b1c", long: true, shirt: "#f2efe6", hairLong: true };
  const GARDE = { coat: "#22335a", pants: "#1c2644", skin: "#e2b48f", hair: "#5a3b26", kepi: true };

  // ------------------------------------------------------------------ pinceaux
  function mur(B, x0, y0, w, h, kind, seed) {
    B.mat(Z.FAC, 255, 0);
    const pal = { pierre: ["#a89878", "#8f7f62", "#75664c", "#5a4e3a"], beton: ["#b4b2ac", "#9d9b95", "#85837e", "#6a6864"], brique: ["#a9644e", "#93523f", "#7a4132", "#5c3026"], enduit: ["#e2d6bc", "#d2c5a8", "#b8ab8e", "#948870"] }[kind];
    B.r(x0, y0, w, h, pal[1]);
    if (kind === "pierre") { for (let y = y0; y < y0 + h; y += 4) for (let x = x0 + ((y >> 2) % 2 ? 3 : 0); x < x0 + w; x += 5 + ((h2(x, y) * 4) | 0)) { B.px(x, y + 1, pal[3]); B.px(x, y + 2, pal[3]); if (h2(x + seed, y) < 0.3) B.r(x + 1, y, 3, 3, pal[0], 0.8); else if (h2(x, y + seed) > 0.75) B.r(x + 1, y, 3, 3, pal[2], 0.8); } for (let y = y0 + 3; y < y0 + h; y += 4) B.hl(x0, y, w, pal[3], 0.45); }
    else if (kind === "brique") { for (let y = y0; y < y0 + h; y += 2) { B.hl(x0, y + 1, w, pal[2], 0.4); for (let x = x0 + ((y >> 1) % 2 ? 2 : 0); x < x0 + w; x += 4) { B.px(x, y, pal[2]); if (h2(x, y + seed) < 0.12) B.r(x + 1, y, 3, 1, pal[0]); } } }
    else if (kind === "beton") { for (let x = x0; x < x0 + w; x += 24) B.vl(x, y0, h, pal[2], 0.7); for (let y = y0 + 12; y < y0 + h; y += 14) B.hl(x0, y, w, pal[2], 0.5); B.noise(x0, y0, w, h, pal[0], 0.07, seed, 0.6); B.noise(x0, y0, w, h, pal[2], 0.08, seed + 4, 0.6); for (let x = x0 + 9; x < x0 + w; x += 31) B.vl(x, y0 + 2, 6 + ((h2(x, seed) * 14) | 0), pal[3], 0.3); }
    else { B.noise(x0, y0, w, h, pal[0], 0.08, seed, 0.6); B.noise(x0, y0, w, h, pal[2], 0.07, seed + 3, 0.6); }
    B.hl(x0, y0, w, pal[0]); B.hl(x0, y0 + h - 1, w, pal[3]);
    return pal;
  }
  // grille de fenêtres : o = { cw, ch, gx, gy, p (part allumée), cold, seed, cadre, vitre }
  function grille(B, P, x, y, cols, rows, o) {
    const on = P.on > 0, cw = o.cw || 5, ch = o.ch || 7, gx = o.gx || 9, gy = o.gy || 12;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const wx = x + c * gx, wy = y + r * gy, lit = on && h01((o.seed || 1) * 31 + r * 7 + c * 1.3) < (o.p == null ? 0.25 : o.p) * (P.ph === "nuit" ? 1 : 0.7);
      B.mat(Z.FAC, 255, 0); if (o.cadre) B.r(wx - 1, wy - 1, cw + 2, ch + 2, o.cadre);
      if (lit) { B.mat(Z.FAC, 40, 255); const c2 = o.cold ? "#cfe9ee" : ["#ffd98c", "#f6cc80", "#f2b06a"][(r + c) % 3]; B.r(wx, wy, cw, ch, c2); B.r(wx, wy + ch - 2, cw, 2, sh(c2, -40)); }
      else { B.r(wx, wy, cw, ch, on ? "#1c2430" : o.vitre || "#3d4b58"); if (!on) B.r(wx, wy, cw, 2, sh(o.vitre || "#3d4b58", 34)); }
      if (o.bar) { B.mat(Z.FAC, 255, 0); for (let i = 1; i < cw; i += 2) B.vl(wx + i, wy, ch, "#22262c"); }
    }
    B.mat(Z.FAC, 255, 0);
  }
  function enseigne(B, P, txt, cx, y, fg, bg, lit) {
    const t = strip(txt), w = t.length * 4 + 5, x = Math.round(cx - w / 2);
    B.mat(Z.FAC, 255, 0); B.r(x - 1, y - 1, w + 2, 9, sh(bg, -40));
    B.mat(Z.FAC, lit && P.on ? 30 : 255, lit && P.on ? 255 : 0); B.r(x, y, w, 7, bg); B.txt(t, x + 3, y + 1, fg);
    B.mat(Z.FAC, 255, 0); return w;
  }
  function gravure(B, txt, cx, y, col) { const t = strip(txt); B.mat(Z.FAC, 255, 0); B.txt(t, Math.round(cx - (t.length * 4 - 1) / 2), y, col); }
  function drapeau(B, x, y, t) { B.mat(Z.FAC, 255, 0); B.r(x, y, 1, 16, "#8d9099"); for (let j = 0; j < 7; j++) for (let i = 0; i < 11; i++) { const w = Math.round(Math.sin((t || 0) * 3 - i * 0.7) * 0.8 * (i / 10)); B.px(x + 1 + i, y + 1 + j + w, i < 4 ? "#2a4aa8" : i < 7 ? "#ececec" : "#cf2c34"); } }
  function lampe(B, P, ctx, x) { K.reverbere(B, P, x); ctx.ombres.push([x, 46, 1]); if (P.on) ctx.L.push({ x: x + 1, y: 77, r: 74, c: WARM, i: 1.25, down: true, up: 26, haze: 0.5, hr: 30 }); }
  function mat(B, P, ctx, x, h) { // mât d'éclairage moderne
    B.mat(Z.ST, 255, 0); B.r(x, YK - h, 1, h, "#6a6f78"); B.r(x - 4, YK - h, 9, 1, "#6a6f78"); B.mat(Z.ST, P.on ? 0 : 255, P.on ? 255 : 0); B.r(x - 4, YK - h + 1, 3, 1, P.on ? "#f4f8ff" : "#c8ccd4"); B.r(x + 2, YK - h + 1, 3, 1, P.on ? "#f4f8ff" : "#c8ccd4"); B.mat(Z.ST, 255, 0);
    ctx.ombres.push([x, h, 1]); if (P.on) ctx.L.push({ x, y: YK - h + 2, r: h + 40, c: [0.9, 0.95, 1], i: 1.1, down: true, up: 10, haze: 0.4, hr: 22 });
  }
  function arbre(B, P, ctx, x, seed) { K.arbre(B, P, x, seed); ctx.ombres.push([x, 60, 12]); ctx.arbres.push(x); }
  function toit(B, x0, x1, yb, h, c) { B.mat(Z.FAC, 255, 0); for (let j = 0; j < h; j++) { const ins = Math.round((h - j) * 1.2); B.hl(x0 + ins, yb - h + j, x1 - x0 - ins * 2, j === 0 ? sh(c, 20) : (j & 1) ? c : sh(c, -10)); } }
  function plot(B, x) { B.mat(Z.ST, 255, 0); B.vl(x, 115, 7, "#4a3426"); B.px(x, 114, "#6a4c38"); B.px(x, 116, "#e6e2d8"); }
  function banc(B, x) { B.mat(Z.ST, 255, 0); B.r(x, 115, 16, 2, "#3f6a44"); B.r(x, 111, 16, 1, "#3f6a44"); B.vl(x + 1, 111, 10, "#24302b"); B.vl(x + 14, 111, 10, "#24302b"); }

  // ------------------------------------------------------------------ ce qui prolonge la rue
  const COTE = {
    haussmann(B, P, ctx, a, b, k0) {
      for (let x = a, k = k0 || 1; x < b; x += 150, k++) { const x1 = Math.min(b, x + 150); if (x1 - x < 40) { K.haussmann(B, P, x, x1, { n: 5, seed: 40 + k, stone: S2, zinc: "#5f6976" }); mur(B, x, YF, x1 - x, YB - YF, "enduit", k); continue; } K.haussmann(B, P, x, x1, { n: k % 2 ? 5 : 6, seed: 50 + k, stone: [S3, S1, S2][k % 3], zinc: k % 2 ? "#5f6976" : "#6c7683" }); K.boutiques(B, P, x, x1, k); if (P.on) { const w = (x1 - x - 6) >> 1; for (let j = 0; j < 2; j++) ctx.L.push({ x: x + 3 + j * w + (w >> 1) - 6, y: 102, r: 34, c: WARM, i: 0.55, haze: 0.08, hr: 22 }); } }
    },
    moderne(B, P, ctx, a, b, k0) {
      const R = rng(90 + (k0 || 0));
      for (let x = a; x < b;) { const w = Math.min(b - x, 70 + (R() * 50 | 0)), top = 20 + (R() * 36 | 0), c = ["#e8e4dc", "#c8cdd2", "#d8c8b0", "#b8c4c8"][(R() * 4) | 0]; B.mat(Z.FAC, 255, 0); B.r(x, top, w, YB - top, c); B.vl(x, top, YB - top, sh(c, 20)); B.vl(x + w - 1, top, YB - top, sh(c, -50)); B.r(x, top, w, 2, sh(c, -30)); for (let y = top + 6; y < YF; y += 11) { B.r(x + 3, y + 7, w - 6, 1, sh(c, -40)); B.r(x + 3, y + 4, w - 6, 3, sh(c, -18), 0.5); } grille(B, P, x + 5, top + 6, Math.floor((w - 8) / 9), Math.floor((YF - top - 6) / 11), { cw: 6, ch: 6, gx: 9, gy: 11, p: 0.28, seed: x }); B.r(x + 2, YF, w - 4, YB - YF, "#3a4048"); if (P.on) { B.mat(Z.FAC, 40, 220); B.r(x + 6, YF + 6, w - 12, YB - YF - 8, "#cfe0e6"); B.mat(Z.FAC, 255, 0); ctx.L.push({ x: x + w / 2, y: 104, r: 30, c: COLD, i: 0.5 }); } else B.r(x + 6, YF + 6, w - 12, YB - YF - 8, "#4a5a66"); for (let k = x + 6; k < x + w - 6; k += 12) B.vl(k, YF + 6, YB - YF - 8, "#2a3038"); x += w; }
    },
    pavillons(B, P, ctx, a, b, k0) {
      const R = rng(120 + (k0 || 0));
      B.mat(Z.FAR, 0, 255); for (let x = a; x < b; x += 7) { const hh = 12 + (h2(x, k0 || 1) * 16 | 0); B.ell(x, 78 - hh / 2, 6, hh / 2, farC(P, "#3c5a40", 0.3)); }
      for (let x = a; x < b;) { const w = Math.min(b - x, 46 + (R() * 30 | 0)), top = 66 + (R() * 10 | 0), c = ["#e6dcc6", "#d8cbb0", "#e9e2d2", "#d2c0a4"][(R() * 4) | 0]; if (w < 30) { x += w; continue; } B.mat(Z.FAC, 255, 0); B.r(x + 4, top, w - 8, YB - top, c); B.noise(x + 4, top, w - 8, YB - top, sh(c, -14), 0.08, x, 0.6); toit(B, x + 1, x + w - 1, top, 12, ["#9a4a34", "#7a5a4a", "#5a606a"][(R() * 3) | 0]); B.r(x + w - 14, top - 16, 4, 8, "#8c6a58"); grille(B, P, x + 9, top + 5, Math.max(1, Math.floor((w - 16) / 13)), 2, { cw: 6, ch: 8, gx: 13, gy: 14, p: 0.35, seed: x, cadre: "#f2ecdc" }); B.r(x + (w >> 1) - 3, YB - 14, 7, 14, ["#3a5a8a", "#6a2a2a", "#2f5a3a"][(R() * 3) | 0]); B.mat(Z.ST, 255, 0); for (let k = x; k < x + w; k++) { const hh = 6 + (h2(k, 3) * 4 | 0); B.vl(k, YB + 3 - hh, hh, h2(k, 9) < 0.5 ? "#2f5630" : "#3f6a3a"); } x += w; }
    },
    mur(B, P, ctx, a, b, k0, o) {
      const kind = (o && o.kind) || "pierre", top = (o && o.top) || 44; mur(B, a, top, b - a, YB - top, kind, a); B.mat(Z.FAC, 255, 0); B.r(a, top - 2, b - a, 2, "#c8c0ae"); B.hl(a, top, b - a, "#5a5346");
      if (o && o.fil) for (let x = a; x < b; x++) { B.px(x, top - 4 + Math.round(Math.sin(x * 0.9) * 1.5), "#b8bcc4"); if (x % 7 === 0) B.px(x, top - 5, "#f4f6fa"); }
      for (let x = Math.ceil(a / 110) * 110 + 40; x < b; x += 110) { B.r(x, top + 6, 3, 2, "#3a3d42"); B.mat(Z.FAC, P.on ? 0 : 255, P.on ? 255 : 0); B.r(x, top + 8, 3, 2, P.on ? "#ffd27a" : "#c8c4b8"); B.mat(Z.FAC, 255, 0); if (P.on) ctx.L.push({ x: x + 1, y: top + 10, r: 56, c: [1, 0.62, 0.25], i: 0.95, down: true, up: 6, haze: 0.3, hr: 18 }); }
    },
    champs(B, P, ctx, a, b, k0) {
      B.mat(Z.FAR, 0, 255); for (let x = a; x < b; x += 5) { const hh = 14 + (h2(x, 7 + (k0 || 0)) * 22 | 0); B.ell(x, 96 - hh / 2, 5, hh / 2, farC(P, "#35523a", 0.28)); if (h2(x, 2) < 0.2) B.r(x, 60, 2, 40, farC(P, "#2c4630", 0.3)); }
      B.mat(Z.FAC, 255, 0); B.r(a, 98, b - a, YB - 98, "#4a6a3c"); B.noise(a, 98, b - a, YB - 98, "#5c7c48", 0.2, 3, 0.7); for (let x = a; x < b; x += 9) { B.vl(x, 100, 12, "#8a8d90"); } B.hl(a, 102, b - a, "#8a8d90", 0.6); B.hl(a, 107, b - a, "#8a8d90", 0.6);
    },
  };

  // ------------------------------------------------------------------ véhicules longs
  function tram(B, x, lit) { B.mat(Z.CAR - 1, 255, 0); for (let k = 0; k < 3; k++) { const x0 = x + k * 46; B.r(x0, 128, 44, 19, "#f2f4f2"); B.r(x0, 128, 44, 2, "#d8dcd8"); B.r(x0, 143, 44, 4, "#2f9a6a"); B.mat(Z.CAR - 1, lit ? 60 : 255, lit ? 200 : 0); B.r(x0 + 2, 131, 40, 8, lit ? "#e9f4d8" : "#3d4b58"); B.mat(Z.CAR - 1, 255, 0); for (let i = x0 + 9; i < x0 + 42; i += 10) B.vl(i, 131, 8, "#c8ccc8"); if (lit) for (let i = x0 + 4; i < x0 + 40; i += 10) { B.r(i, 134, 3, 3, "#3a2a22"); B.r(i - 1, 137, 5, 2, "#4a3a44"); } B.r(x0 + 43, 132, 2, 12, "#3a3d42"); } B.r(x + 60, 124, 1, 4, "#3a3d42"); B.r(x + 52, 123, 18, 1, "#3a3d42"); B.r(x, 147, 136, 1, "#1c1d21"); }
  function bus(B, x, lit) { B.mat(Z.CAR - 1, 255, 0); B.r(x, 127, 92, 20, "#f4f4f0"); B.r(x, 127, 92, 3, "#2a9a94"); B.r(x, 141, 92, 4, "#2a9a94"); B.mat(Z.CAR - 1, lit ? 60 : 255, lit ? 200 : 0); B.r(x + 3, 131, 78, 8, lit ? "#e6f2e8" : "#3d4b58"); B.r(x + 83, 131, 8, 9, lit ? "#e6f2e8" : "#3d4b58"); B.mat(Z.CAR - 1, 255, 0); for (let i = x + 14; i < x + 80; i += 13) B.vl(i, 131, 8, "#c8ccc8"); B.r(x + 30, 131, 9, 14, "#d8dcd8"); B.r(x + 60, 131, 9, 14, "#d8dcd8"); if (lit) for (let i = x + 6; i < x + 78; i += 13) { B.r(i, 134, 3, 3, "#3a2a22"); B.r(i - 1, 137, 5, 2, "#3a4458"); } for (const wx of [x + 16, x + 74]) { B.ell(wx, 146, 4, 4, "#17181b"); B.ell(wx, 146, 1.6, 1.6, "#8c9096"); } B.mat(Z.CAR - 1, 255, lit ? 255 : 0); B.r(x + 91, 142, 2, 2, lit ? "#fff6d0" : "#d8d8cc"); B.r(x + 70, 128, 20, 2, lit ? "#ffb030" : "#a87a2a"); B.mat(Z.CAR - 1, 255, 0); }

  // ------------------------------------------------------------------ les lieux
  const LIEUX = {};

  // Tribunal de Paris (Batignolles) : la tour de verre en gradins, le parvis, le tramway
  LIEUX.palais = { span: [60, 420], cotes: "moderne", vehicule: "tram", passants: 5, looks: [ROBE, K.LOOKS[1], ROBE2, K.LOOKS[3], K.LOOKS[0]], sol: { trottoir: "#8a8890" },
    centre(B, P, ctx) {
      const on = P.on > 0, gl = ["#a8c0d0", "#86a2b8", "#64809a", "#46607a"];
      const blocs = [[92, 388, 62, 88], [122, 358, 40, 62], [150, 330, 20, 40], [178, 302, 2, 20]];
      blocs.forEach(([x0, x1, y0, y1], bi) => { B.mat(Z.FAC, 255, 0); B.r(x0, y0, x1 - x0, y1 - y0, gl[1]); for (let x = x0; x < x1; x += 6) B.vl(x, y0, y1 - y0, gl[2]); for (let y = y0; y < y1; y += 5) B.hl(x0, y, x1 - x0, gl[3], 0.6); B.hl(x0, y0, x1 - x0, "#dfeaf2"); B.vl(x0, y0, y1 - y0, gl[0]); B.vl(x1 - 1, y0, y1 - y0, gl[3]);
        for (let y = y0 + 1; y < y1 - 1; y += 5) for (let x = x0 + 1; x < x1 - 1; x += 6) { if (on && h2(x + bi * 9, y) < (P.ph === "nuit" ? 0.3 : 0.2)) { B.mat(Z.FAC, 30, 255); B.r(x, y, 5, 4, h2(x, y + 3) < 0.7 ? "#dff0ff" : "#f6dc9a"); B.mat(Z.FAC, 255, 0); } else if (!on && h2(x, y + bi) < 0.3) B.r(x, y, 5, 2, "#c8dcec", 0.6); }
        if (bi) { B.mat(Z.FAC, 255, 0); for (let x = blocs[bi - 1][0] + 3; x < blocs[bi - 1][1] - 3; x += 7) { if (x > x0 - 4 && x < x1 + 2) continue; B.ell(x, y1 - 3, 3, 3, h2(x, bi) < 0.5 ? "#3f6a3a" : P.saison === "automne" ? "#b8682a" : "#4f7a44"); } } });
      B.mat(Z.FAC, 255, 0); B.r(240, -6, 1, 8, gl[3]);
      // socle : hall vitré, colonnes blanches, auvent
      B.r(62, 88, 356, 24, "#2a3a48"); if (on) { B.mat(Z.FAC, 60, 150); B.r(64, 92, 352, 20, "#e2cf9c"); B.r(64, 92, 352, 3, "#f6e8c0"); B.mat(Z.FAC, 255, 0); for (let x = 80; x < 400; x += 26) { B.r(x, 100, 3, 4, "#3a2a22"); B.r(x - 1, 104, 5, 8, ["#2c3440", "#4a2a2a", "#1e1e24"][x % 3]); } } else { B.r(64, 92, 352, 20, "#4a6274"); for (let x = 70; x < 410; x += 30) B.line(x, 110, x + 14, 93, "#6f8a9c"); }
      for (let x = 64; x < 418; x += 16) B.r(x, 90, 2, 22, "#eef0ee"); B.r(56, 86, 368, 3, "#f4f6f4"); B.hl(56, 89, 368, "#8a9098");
      if (on) B.mat(Z.FAC, 40, 210); B.r(214, 92, 52, 20, on ? "#f6e6b4" : "#3a5262"); B.mat(Z.FAC, 255, 0); B.vl(240, 92, 20, "#2a3a48"); B.vl(214, 92, 20, "#2a3a48"); B.vl(265, 92, 20, "#2a3a48");
      const pl = strip(P.o.plaque || "TRIBUNAL DE PARIS"); { const w = pl.length * 4 + 7, x = Math.round(240 - w / 2); B.mat(Z.FAC, 255, 0); B.r(x, 77, w, 9, "#23262e"); B.mat(Z.FAC, 200, on ? 90 : 0); B.txt(pl, x + 4, 79, "#f1ede2"); B.mat(Z.FAC, 255, 0); }
      ctx.flags = [[330, 70], [342, 70]];
      if (on) { ctx.L.push({ x: 240, y: 100, r: 90, c: WHITE, i: 1.1, haze: 0.2, hr: 40 }, { x: 120, y: 100, r: 60, c: WHITE, i: 0.8 }, { x: 360, y: 100, r: 60, c: WHITE, i: 0.8 }); }
      ctx.perches.push([150, 121], [330, 121], [200, 121], [282, 121], [100, 85], [380, 85]);
    },
    devant(B, P, ctx) { mat(B, P, ctx, 76, 46); mat(B, P, ctx, 404, 46); for (let x = 150; x < 340; x += 38) plot(B, x); ctx.figs.push([228, 116, Object.assign({ dir: 1 }, ROBE)], [252, 115, Object.assign({ dir: -1 }, ROBE2)], [196, 114, Object.assign({ dir: 1 }, GARDE)]); } };

  // Palais de justice de la Cité : la grille dorée, la Sainte-Chapelle, les tours de la Conciergerie
  LIEUX.cite = { span: [30, 480], cotes: "haussmann", passants: 4, looks: [ROBE, K.LOOKS[2], K.LOOKS[4], ROBE2],
    loin(B, P, ctx) { const on = P.on > 0; B.mat(Z.FAR, 0, 255); const st = farC(P, "#d9d2c0", on ? 0.45 : 0.3), sl = farC(P, "#4a5460", 0.3); B.r(96, 30, 44, 26, st); for (let j = 0; j < 14; j++) B.hl(96 + (13 - j) * 0.6, 16 + j, 44 - (13 - j) * 1.2, sl); for (let x = 98; x < 140; x += 7) { B.r(x, 22, 2, 34, st); B.px(x, 20, st); } for (let y = -8; y < 18; y++) B.r(118 - (y > 8 ? 1 : 0), y, y > 8 ? 3 : 1, 1, sl); B.px(117, -2, sl); B.px(119, -2, sl); for (let x = 101; x < 138; x += 7) B.r(x + 1, 30, 4, 22, on ? rgb(["#4a6ad8", "#b84a8a", "#3a9ad0"][x % 3]) : farC(P, "#2c3a5a", 0.2)); if (on) ctx.L.push({ x: 118, y: 40, r: 30, c: [0.5, 0.5, 1], i: 0, haze: 0.2, hr: 22 }); },
    centre(B, P, ctx) {
      const on = P.on > 0, st = ["#e6dcc4", "#d2c6aa", "#b6aa8e", "#8f8368"];
      // aile gauche, façade de la cour du Mai
      B.mat(Z.FAC, 255, 0); B.r(30, 44, 100, 68, st[1]); B.noise(30, 44, 100, 68, st[0], 0.08, 2, 0.6); B.r(30, 42, 100, 3, st[0]); toit(B, 28, 132, 42, 10, "#5a6470"); grille(B, P, 38, 52, 7, 3, { cw: 6, ch: 11, gx: 13, gy: 19, p: 0.3, seed: 4, cadre: st[0] });
      B.r(130, 36, 228, 76, st[1]); B.noise(130, 36, 228, 76, st[0], 0.08, 3, 0.6); B.noise(130, 36, 228, 76, st[2], 0.06, 8, 0.6); toit(B, 128, 360, 36, 12, "#5a6470"); B.r(130, 34, 228, 3, st[0]);
      for (let x = 142; x < 350; x += 22) { if (x > 190 && x < 290) continue; B.r(x, 46, 9, 20, st[0]); if (on && h01(x) < 0.5) B.mat(Z.FAC, 40, 255); B.r(x + 1, 47, 7, 18, on ? (h01(x) < 0.5 ? "#f6cc80" : "#1c2430") : "#3d4b58"); B.mat(Z.FAC, 255, 0); B.ell(x + 4.5, 47, 3.5, 2.5, st[0]); }
      // perron, colonnes, fronton
      for (let j = 0; j < 12; j++) B.hl(196 - j * 2.2, 100 + j, 96 + j * 4.4, j % 2 ? st[2] : st[0]);
      B.r(190, 46, 108, 5, st[0]); B.hl(190, 51, 108, st[3]); for (let j = 0; j < 12; j++) B.hl(194 + j * 4, 45 - j, 100 - j * 8, j === 11 ? st[0] : st[1]); B.px(244, 30, "#d9b34a");
      for (let x = 198; x < 294; x += 13) { B.r(x, 52, 5, 48, st[0]); B.vl(x + 4, 52, 48, st[2]); B.r(x - 1, 52, 7, 2, st[0]); B.r(x - 1, 98, 7, 2, st[2]); if (x < 286) { if (on) B.mat(Z.FAC, 40, 255); B.r(x + 6, 58, 6, 40, on ? "#f2b45a" : "#2c3440"); B.mat(Z.FAC, 255, 0); B.ell(x + 9, 58, 3, 3, st[2]); } }
      gravure(B, "LIBERTE EGALITE FRATERNITE", 244, 46, st[3]);
      // la grille dorée
      const gold = on ? "#f2c860" : "#d9b34a";
      for (let x = 112; x < 372; x += 3) { const portal = x > 214 && x < 268, top = portal ? 66 - Math.round(Math.sin((x - 214) / 54 * Math.PI) * 8) : 80; B.mat(Z.ST, 255, 0); B.vl(x, top, YB - top, "#16181c"); B.mat(Z.ST, 160, on ? 150 : 0); B.px(x, top - 1, gold); if (portal || x % 9 === 0) B.px(x, top - 2, gold); }
      B.mat(Z.ST, 255, 0); B.hl(112, 84, 260, "#16181c"); B.hl(112, 106, 260, "#16181c"); B.mat(Z.ST, 160, on ? 150 : 0); B.hl(112, 85, 260, gold, 0.6); for (let x = 228; x < 256; x += 2) B.px(x, 54 + (x % 4), gold); B.r(238, 50, 6, 5, gold); B.px(240, 48, gold); B.px(241, 47, gold);
      for (const x of [108, 210, 268, 370]) { B.mat(Z.ST, 255, 0); B.r(x, 72, 6, 40, st[1]); B.r(x - 1, 70, 8, 3, st[0]); B.vl(x + 5, 72, 40, st[3]); B.mat(Z.ST, on ? 0 : 255, on ? 255 : 0); B.r(x + 1, 64, 4, 6, on ? "#ffe6a8" : "#c9cbc4"); B.mat(Z.ST, 255, 0); B.r(x, 63, 6, 1, "#16181c"); if (on) ctx.L.push({ x: x + 3, y: 68, r: 52, c: WARM, i: 1.05, haze: 0.4, hr: 22 }); }
      // Conciergerie : deux tours rondes, la tour de l'Horloge
      for (const x of [382, 412]) { mur(B, x, 44, 24, 68, "pierre", x); for (let j = 0; j < 26; j++) B.hl(x + 12 - j * 0.5, 18 + j, j + 1, j % 3 ? "#4a5460" : "#5a6470"); B.px(x + 12, 14, "#d9b34a"); B.vl(x, 44, 68, "#c8b898", 0.5); B.vl(x + 23, 44, 68, "#4a4030", 0.6); grille(B, P, x + 9, 56, 1, 3, { cw: 4, ch: 7, gx: 1, gy: 16, p: 0.4, seed: x }); }
      mur(B, 444, 28, 36, 84, "pierre", 6); toit(B, 442, 482, 28, 10, "#4a5460"); B.r(458, 8, 6, 12, "#4a5460"); B.px(460, 5, "#d9b34a");
      B.mat(Z.FAC, 200, on ? 120 : 0); B.ell(462, 52, 9, 9, "#27407a"); B.ell(462, 52, 7, 7, "#f2ecd8"); B.mat(Z.FAC, 255, 0); const m = P.o.min == null ? 600 : P.o.min, ah = ((m / 60) % 12) / 12 * 6.283, am = (m % 60) / 60 * 6.283; B.line(462, 52, 462 + Math.sin(ah) * 4, 52 - Math.cos(ah) * 4, "#1d1d22"); B.line(462, 52, 462 + Math.sin(am) * 6, 52 - Math.cos(am) * 6, "#1d1d22"); for (let k = 0; k < 12; k++) B.px(462 + Math.sin(k * 0.5236) * 8.4, 52 - Math.cos(k * 0.5236) * 8.4, "#d9b34a");
      if (on) ctx.L.push({ x: 244, y: 96, r: 90, c: WARM, i: 0.7, haze: 0.14, hr: 40 }, { x: 462, y: 52, r: 26, c: WHITE, i: 0.5, haze: 0.2, hr: 14 });
      ctx.perches.push([150, 79], [330, 79], [240, 49], [300, 121], [420, 121]); ctx.flags = [[236, 16]];
    },
    devant(B, P, ctx) { arbre(B, P, ctx, 60, 21); for (let x = 90; x < 400; x += 26) plot(B, x); ctx.figs.push([206, 114, Object.assign({ dir: 1 }, GARDE)], [284, 116, Object.assign({ dir: -1 }, ROBE)]); } };

  // Maison du barreau : la façade classique, le quai et les boîtes des bouquinistes
  LIEUX.ordre = { span: [120, 360], cotes: "haussmann", passants: 4, looks: [ROBE2, K.LOOKS[0], K.LOOKS[2], ROBE],
    centre(B, P, ctx) {
      const on = P.on > 0, st = S1;
      K.haussmann(B, P, 120, 360, { n: 4, seed: 61, stone: st, zinc: "#5f6976" });
      B.mat(Z.FAC, 255, 0); B.r(120, YF, 240, YB - YF, "#c2b59c"); for (let y = YF + 3; y < YB; y += 4) B.hl(120, y, 240, "#9c9078"); B.hl(120, YF, 240, st[0]);
      B.r(214, 84, 52, 28, st[0]); B.ell(240, 90, 20, 8, st[0]); if (on) B.mat(Z.FAC, 40, 230); B.ell(240, 92, 15, 5, on ? "#f6cc80" : "#2c3440"); B.mat(Z.FAC, 255, 0); B.r(222, 92, 36, 20, "#4a2e1a"); B.vl(240, 92, 20, "#2c1a0e"); B.vl(222, 92, 20, "#6a4428"); for (const x of [228, 246]) B.r(x, 96, 8, 12, "#3a2414"); B.px(238, 102, "#d9b34a"); B.px(242, 102, "#d9b34a");
      enseigne(B, P, "MAISON DU BARREAU", 240, YF - 10, "#e8c66a", "#23262e", false); B.r(200, 96, 9, 7, "#2a2620"); B.mat(Z.FAC, 200, on ? 100 : 0); B.r(201, 97, 7, 5, "#d9b34a"); B.mat(Z.FAC, 255, 0); B.hl(202, 99, 5, "#2a2620");
      for (const x of [150, 178, 290, 318]) { B.r(x - 1, 91, 15, 17, st[0]); if (on && x % 3) B.mat(Z.FAC, 40, 255); B.r(x, 92, 13, 15, on ? (x % 3 ? "#f6cc80" : "#1c2430") : "#3d4b58"); B.mat(Z.FAC, 255, 0); B.vl(x + 6, 92, 15, "#d8d2c4"); }
      ctx.flags = [[196, 60], [272, 60]];
      if (on) ctx.L.push({ x: 240, y: 96, r: 54, c: WARM, i: 1.0, haze: 0.2, hr: 26 });
      ctx.perches.push([150, 121], [330, 121], [70, 131], [410, 131]);
    },
    devant(B, P, ctx) { lampe(B, P, ctx, 132); lampe(B, P, ctx, 346); arbre(B, P, ctx, 64, 33); arbre(B, P, ctx, 420, 37);
      // parapet du quai et boîtes des bouquinistes, au premier plan
      B.ox = 0; const FW = ctx.d.FW; B.mat(Z.FG, 110, 0); B.r(0, 138, FW, 12, "#8a8474"); B.r(0, 136, FW, 2, "#b8b2a0"); for (let x = 0; x < FW; x += 22) B.vl(x, 138, 12, "#6a6456");
      for (let x = 30; x < FW - 40; x += 78) { const open = !P.on && !P.rain; B.mat(Z.FG, 120, 0); B.r(x, 126, 46, 10, "#2f5a3e"); B.r(x, 126, 46, 1, "#4a7a58"); B.vl(x + 45, 126, 10, "#1f3e2a"); if (open) { B.r(x, 112, 46, 13, "#2a4e36"); B.mat(Z.FG, 200, 0); for (let k = 0; k < 7; k++) B.r(x + 2 + k * 6, 114, 5, 9, ["#e8d9a0", "#c8443a", "#5a86b0", "#f2efe6", "#d9a03a", "#8a5a7a", "#e6dcc6"][k]); for (let k = 0; k < 11; k++) B.vl(x + 2 + k * 4, 127, 7, ["#b3261e", "#27407a", "#e8d9a0", "#3e5c3a"][k % 4]); } else { B.px(x + 22, 131, "#d9b34a"); B.hl(x + 2, 130, 42, "#1f3e2a"); } }
      B.ox = ctx.d.OX; } };

  // Brigade de gendarmerie de Montlhéry : la brigade, le drapeau, la tour en ruine sur la colline
  LIEUX.gendarmerie = { span: [130, 350], cotes: "pavillons", passants: 2,
    loin(B, P, ctx) { B.mat(Z.FAR, 0, 255); for (let x = ctx.d.X0; x < ctx.d.X1; x++) { const hh = 26 * Math.exp(-Math.pow((x - 150) / 150, 2)) + 10; for (let y = Math.round(84 - hh); y < 90; y++) B.px(x, y, farC(P, h2(x >> 1, y >> 1) < 0.5 ? "#35523a" : "#2c4630", 0.36)); } const st = farC(P, "#a89878", 0.3), sd = farC(P, "#6a5e48", 0.3); B.r(144, 22, 9, 28, st); B.vl(152, 22, 28, sd); B.r(143, 20, 3, 3, st); B.r(148, 19, 3, 4, st); B.px(153, 21, st); B.r(147, 30, 2, 4, sd); B.r(128, 44, 16, 6, st); B.r(153, 46, 10, 4, st); ctx.tour = [148, 19]; },
    centre(B, P, ctx) {
      const on = P.on > 0;
      mur(B, 140, 62, 200, 50, "enduit", 4); toit(B, 136, 344, 62, 12, "#9a4a34"); B.r(300, 44, 5, 9, "#8c6a58");
      grille(B, P, 150, 68, 6, 1, { cw: 8, ch: 10, gx: 33, gy: 1, p: 0.5, seed: 8, cadre: "#f2ecdc", cold: true }); for (let c = 0; c < 6; c++) { B.r(147 + c * 33, 67, 2, 12, "#3a5a8a"); B.r(159 + c * 33, 67, 2, 12, "#3a5a8a"); }
      grille(B, P, 150, 90, 2, 1, { cw: 9, ch: 12, gx: 33, gy: 1, p: 0.8, seed: 9, cadre: "#f2ecdc", cold: true, bar: true }); grille(B, P, 282, 90, 2, 1, { cw: 9, ch: 12, gx: 33, gy: 1, p: 0.4, seed: 5, cadre: "#f2ecdc", cold: true, bar: true });
      B.mat(Z.FAC, 255, 0); B.r(226, 88, 28, 24, "#f2ecdc"); if (on) B.mat(Z.FAC, 40, 240); B.r(229, 91, 22, 21, on ? "#cfe6ea" : "#3a5a8a"); B.mat(Z.FAC, 255, 0); B.vl(240, 91, 21, "#27407a"); B.r(229, 91, 22, 1, "#27407a");
      enseigne(B, P, "GENDARMERIE", 240, 79, "#ffffff", "#1f3f9a", true); B.r(214, 92, 7, 9, "#1b2a55"); B.vl(216, 93, 6, "#2b4bb0"); B.vl(217, 93, 6, "#e8e8e8"); B.vl(218, 93, 6, "#c8323a");
      ctx.flags = [[262, 58]];
      if (on) ctx.L.push({ x: 240, y: 84, r: 44, c: [0.4, 0.6, 1], i: 1.0, haze: 0.36, hr: 24 }, { x: 240, y: 102, r: 40, c: COLD, i: 1.0, haze: 0.16, hr: 22 });
      ctx.perches.push([180, 49], [312, 43], [150, 121]);
    },
    devant(B, P, ctx) { mat(B, P, ctx, 116, 44); B.mat(Z.ST, 255, 0); for (let x = 132; x < 350; x += 2) { if (x > 222 && x < 258) continue; B.vl(x, 106, 8, "#3f6a44", 0.8); } B.hl(132, 106, 90, "#2f5630"); B.hl(258, 106, 92, "#2f5630"); K.voiture(B, 270, 136, { body: "#2a4a9a", shade: "#1c3470", police: false }, Z.CAR); B.mat(Z.CAR, 255, 0); B.r(284, 129, 30, 2, "#f2f2f2"); B.txt("GENDARMERIE", 276, 130, "#f2f2f2"); ctx.ombres.push([299, 20, 30]); ctx.figs.push([206, 114, Object.assign({ dir: 1 }, GARDE, { coat: "#2a4a9a", pants: "#1c2644" })]); },
    anim(B, P, t, ctx) { // un lapin traverse la pelouse, le soir et la nuit
      if (!P.on) return; const T = 26, u = (t % T) / 7; if (u > 1) return; const x = 360 - u * 250, hop = Math.abs(Math.sin(u * 40)) * 3; B.mat(Z.ACT, 255, 0); B.r(x, 119 - hop, 4, 2, "#b8a890"); B.px(x - 1, 119 - hop, "#f2efe6"); B.px(x + 4, 118 - hop, "#b8a890"); B.px(x + 4, 116 - hop, "#b8a890"); B.px(x + 3, 117 - hop, "#b8a890"); } };

  // Hôtel-Dieu (unité médico-judiciaire) : les arcades, les urgences, l'ambulance, Notre-Dame
  LIEUX.umj = { span: [0, 480], cotes: "haussmann", passants: 4,
    centre(B, P, ctx) {
      const on = P.on > 0, st = S2;
      B.mat(Z.FAC, 255, 0); B.r(0, 40, 390, 72, st[1]); B.noise(0, 40, 390, 72, st[0], 0.08, 2, 0.6); B.noise(0, 40, 390, 72, st[2], 0.07, 6, 0.6); B.r(0, 28, 390, 12, "#5f6976"); for (let x = 3; x < 390; x += 6) B.vl(x, 29, 11, "#4f5966"); B.r(0, 39, 390, 2, st[0]); B.hl(0, 41, 390, st[3]); B.hl(0, 62, 390, st[0]); B.hl(0, 63, 390, st[2]); B.hl(0, 84, 390, st[0]); B.hl(0, 85, 390, st[3]);
      grille(B, P, 8, 45, 30, 2, { cw: 6, ch: 12, gx: 12.7, gy: 22, p: 0.3, seed: 3, cadre: st[0], cold: true });
      for (let x = 6; x < 384; x += 24) { if (x > 160 && x < 215) continue; B.mat(Z.FAC, 255, 0); B.ell(x + 9, 96, 8, 8, "#2a2c34"); B.r(x + 1, 96, 17, 16, "#2a2c34"); if (on) { B.mat(Z.FAC, 0, 255); B.r(x + 8, 92, 3, 3, "#ffe2a0"); B.mat(Z.FAC, 255, 0); ctx.L.push({ x: x + 9, y: 96, r: 22, c: WARM, i: 0.75 }); } B.r(x + 19, 88, 5, 24, st[0]); B.vl(x + 23, 88, 24, st[2]); }
      B.r(150, 30, 80, 82, st[1]); B.vl(150, 30, 82, st[0]); B.vl(229, 30, 82, st[3]); for (let j = 0; j < 12; j++) B.hl(152 + j * 3.2, 30 - j, 76 - j * 6.4, j > 9 ? st[0] : st[1]); B.ell(190, 26, 5, 5, "#f2ecd8"); B.line(190, 26, 190, 22, "#1d1d22"); B.line(190, 26, 193, 27, "#1d1d22");
      gravure(B, "HOTEL-DIEU", 190, 44, st[3]); grille(B, P, 160, 56, 3, 1, { cw: 14, ch: 22, gx: 23, gy: 1, p: 0.7, seed: 5, cadre: st[0] });
      B.ell(190, 94, 16, 12, "#1e2028"); B.r(174, 94, 33, 18, "#1e2028"); if (on) { B.mat(Z.FAC, 30, 240); B.r(178, 96, 25, 16, "#f2ecd0"); B.mat(Z.FAC, 255, 0); B.vl(190, 96, 16, "#5a4a3a"); }
      enseigne(B, P, "URGENCES", 282, 88, "#ffffff", "#c8242a", true); B.r(240, 96, 12, 7, "#1f3f9a"); B.txt("UMJ", 241, 97, "#ffffff");
      if (on) ctx.L.push({ x: 282, y: 92, r: 36, c: [1, 0.25, 0.2], i: 0.9, haze: 0.3, hr: 20 }, { x: 190, y: 102, r: 50, c: WHITE, i: 1.0, haze: 0.16, hr: 26 });
      // Notre-Dame, derrière : les deux tours, la flèche
      const nd = on ? ["#d9c8a0", "#b8a67e", "#8f8060"] : ["#ddd3bc", "#c2b89e", "#9a9078"];
      B.mat(Z.FAC, 255, 0); B.r(398, 18, 82, 94, nd[1]); B.noise(398, 18, 82, 94, nd[0], 0.1, 4, 0.6); B.r(426, 18, 26, 30, P.sky ? hexOf(rgb(P.sky[2])) : "#000"); B.mat(Z.SKY, 0, 255); B.r(426, 0, 26, 48, P.sky[1]); B.mat(Z.FAC, 255, 0); B.r(438, -6, 2, 54, "#4a5460"); B.px(438, -8, "#d9b34a"); for (let j = 0; j < 10; j++) B.hl(434 + j * 0.2, 38 + j, 10, "#4a5460");
      for (const x of [398, 452]) { B.vl(x, 18, 94, nd[0]); B.vl(x + 27, 18, 94, nd[2]); B.r(x, 16, 28, 2, nd[0]); for (let k = 0; k < 2; k++) { B.r(x + 5 + k * 11, 24, 6, 22, "#2a2c34"); for (let y = 26; y < 46; y += 3) B.hl(x + 5 + k * 11, y, 6, nd[2]); } B.hl(x, 50, 28, nd[2]); for (let i = x + 1; i < x + 27; i += 3) B.vl(i, 52, 8, nd[2]); }
      B.hl(398, 62, 82, nd[0]); B.mat(Z.FAC, 255, on ? 90 : 0); B.ell(439, 76, 9, 9, "#3a4a7a"); B.ell(439, 76, 6, 6, on ? "#b86a9a" : "#5a6a9a"); B.ell(439, 76, 2, 2, nd[0]); B.mat(Z.FAC, 255, 0);
      for (const x of [406, 432, 458]) { B.ell(x + 7, 100, 7, 9, "#1e2028"); B.r(x, 100, 15, 12, "#1e2028"); B.r(x + 4, 102, 7, 10, "#5a3a22"); }
      if (on) ctx.L.push({ x: 439, y: 104, r: 80, c: WARM, i: 0.8, haze: 0.14, hr: 40 });
      ctx.perches.push([60, 27], [300, 27], [412, 15], [466, 15], [120, 121]);
    },
    devant(B, P, ctx) { lampe(B, P, ctx, 132); arbre(B, P, ctx, 372, 44); banc(B, 60);
      const x = 296, y = 136; B.mat(Z.CAR, 255, 0); B.r(x, y - 20, 42, 17, "#f4f4f0"); B.r(x + 42, y - 14, 12, 11, "#f4f4f0"); B.r(x + 42, y - 15, 9, 2, "#f4f4f0"); B.r(x + 44, y - 13, 7, 5, "#1e2a38"); B.r(x, y - 9, 54, 2, "#e8a020"); B.r(x, y - 7, 54, 1, "#d8343a"); B.r(x, y - 3, 54, 1, "#1c1d21"); for (const wx of [x + 10, x + 44]) { B.ell(wx, y - 3, 4, 4, "#17181b"); B.ell(wx, y - 3, 1.8, 1.8, "#8c9096"); } for (const [a, b] of [[20, -15], [19, -14], [21, -14], [20, -13], [20, -16], [18, -15], [22, -15]]) B.px(x + a, y + b, "#2a5ad0"); B.txt("SAMU", x + 26, y - 18, "#2a5ad0"); ctx.ombres.push([x + 27, 22, 30]); ctx.amb = [x + 16, y - 22]; ctx.figs.push([262, 114, { coat: "#f2f2ee", pants: "#3a8a94", skin: "#d9a273", hair: "#2a1e1a", dir: 1 }]); },
    anim(B, P, t, ctx, dyn) { const k = Math.floor(t * 4) % 2; B.mat(Z.CAR, 255, 255); B.r(ctx.amb[0], ctx.amb[1], 4, 2, k ? "#6aa8ff" : "#2a4ab0"); B.mat(Z.CAR, 255, 0); if (P.on && k) dyn.push({ x: ctx.amb[0] + 2 + ctx.d.OX, y: ctx.amb[1], r: 46, c: [0.3, 0.5, 1], i: 0.8, haze: 0.3, hr: 16 }); } };

  // SPIP de Paris : l'immeuble de bureaux, l'arrêt de bus et ceux qui attendent
  LIEUX.spip = { span: [110, 370], cotes: "haussmann", vehicule: "bus", passants: 4,
    centre(B, P, ctx) {
      const on = P.on > 0;
      mur(B, 110, 26, 260, 86, "beton", 3); B.r(110, 24, 260, 3, "#c8c6c0");
      for (let y = 32; y < 84; y += 13) { B.mat(Z.FAC, 255, 0); B.r(116, y, 248, 8, "#2a3a48"); grille(B, P, 117, y + 1, 27, 1, { cw: 8, ch: 6, gx: 9.15, gy: 1, p: 0.3, seed: y, cold: true, vitre: "#4a6274" }); B.r(116, y + 8, 248, 2, "#8a8882"); }
      B.mat(Z.FAC, 255, 0); B.r(116, 88, 248, 24, "#3a3f46"); for (let x = 116; x < 364; x += 31) B.r(x, 86, 4, 26, "#b4b2ac");
      if (on) B.mat(Z.FAC, 30, 240); B.r(216, 92, 48, 20, on ? "#cfe6ea" : "#3d4b58"); B.mat(Z.FAC, 255, 0); B.vl(240, 92, 20, "#2a3038"); B.vl(216, 92, 20, "#2a3038"); B.vl(263, 92, 20, "#2a3038"); if (on) { B.r(226, 100, 3, 4, "#3d5560"); B.r(225, 104, 5, 8, "#48606c"); }
      enseigne(B, P, "SPIP DE PARIS", 240, 80, "#ffffff", "#1f3f9a", false); B.r(196, 94, 14, 10, "#f2efe6"); B.r(197, 95, 4, 8, "#2b4bb0"); B.r(205, 95, 4, 8, "#c8323a"); gravure(B, "MINISTERE DE LA JUSTICE", 240, 27, "#6a6864");
      B.r(140, 96, 34, 12, on ? "#2a3440" : "#4a5a66"); B.r(300, 96, 40, 12, on ? "#2a3440" : "#4a5a66");
      if (on) ctx.L.push({ x: 240, y: 102, r: 48, c: COLD, i: 1.1, haze: 0.16, hr: 26 });
      ctx.perches.push([130, 23], [350, 23], [130, 121]);
    },
    devant(B, P, ctx) { lampe(B, P, ctx, 96); arbre(B, P, ctx, 396, 51);
      const on = P.on > 0, x = 262; B.mat(Z.ST, 255, 0); B.r(x, 96, 52, 2, "#3a3d42"); B.vl(x, 96, 25, "#3a3d42"); B.vl(x + 51, 96, 25, "#3a3d42"); B.r(x + 1, 98, 50, 20, "#9ab4c4", 0.22); B.r(x + 6, 113, 24, 2, "#6a6f78"); B.vl(x + 8, 115, 5, "#4a4f58"); B.vl(x + 27, 115, 5, "#4a4f58");
      B.mat(Z.ST, on ? 30 : 255, on ? 255 : 0); B.r(x + 38, 99, 12, 19, on ? "#f2f6ff" : "#c8ccd4"); B.r(x + 40, 101, 8, 8, "#d8443a"); B.hl(x + 40, 111, 8, "#3a3d42"); B.hl(x + 40, 113, 6, "#3a3d42"); B.mat(Z.ST, 255, 0);
      B.vl(x - 10, 92, 30, "#6a6f78"); B.r(x - 14, 90, 9, 7, "#2a9a94"); B.txt("62", x - 13, 91, "#ffffff");
      if (on) ctx.L.push({ x: x + 44, y: 106, r: 34, c: [0.9, 0.95, 1], i: 0.9, haze: 0.2, hr: 18 });
      ctx.ombres.push([x + 26, 26, 52]); ctx.figs.push([x + 12, 119, Object.assign({ dir: 1 }, K.LOOKS[1])], [x + 22, 119, Object.assign({ dir: -1 }, K.LOOKS[3])], [x - 4, 119, Object.assign({ dir: 1 }, K.LOOKS[4])]); for (let k = 130; k < 240; k += 22) plot(B, k); } };

  // Étude de commissaires de justice : la porte cochère laquée, la plaque de laiton, la galerie voisine
  LIEUX.cj = { span: [130, 350], cotes: "haussmann", passants: 4,
    centre(B, P, ctx) {
      const on = P.on > 0;
      K.haussmann(B, P, 130, 350, { n: 5, seed: 91, stone: S1, zinc: "#6c7683" });
      B.mat(Z.FAC, 255, 0); B.r(130, YF, 220, YB - YF, "#cfc0a3"); for (let y = YF + 3; y < YB; y += 4) B.hl(130, y, 220, "#a89878"); for (let y = YF; y < YB; y += 4) for (let x = 130 + ((y >> 2) % 2 ? 7 : 0); x < 350; x += 14) B.vl(x, y, 3, "#b5a68a"); B.hl(130, YF, 220, S1[0]);
      B.ell(240, 90, 17, 7, S1[0]); B.r(223, 90, 35, 22, S1[0]); B.ell(240, 92, 14, 5, "#1f4a3a"); B.r(226, 92, 29, 20, "#1f4a3a"); B.vl(240, 88, 24, "#123026"); B.vl(226, 92, 20, "#2f6a54"); for (const x of [229, 243]) { B.r(x, 95, 9, 7, "#17392e"); B.r(x, 104, 9, 6, "#17392e"); } B.mat(Z.FAC, 200, on ? 120 : 0); B.px(238, 101, "#f2c860"); B.px(242, 101, "#f2c860"); B.r(239, 86, 3, 2, "#f2c860");
      B.mat(Z.FAC, 255, 0); B.r(138, 93, 74, 15, "#2a2620"); B.mat(Z.FAC, 200, on ? 110 : 0); B.r(139, 94, 72, 13, "#c9a24a"); B.mat(Z.FAC, 255, 0); B.txt("MARCHAL ET RIVES", 143, 95, "#2a2620"); B.txt("COMMISSAIRES", 151, 101, "#3a3226");
      B.r(268, 86, 76, 7, "#1e1e22"); B.mat(Z.FAC, on ? 100 : 255, on ? 170 : 0); B.txt("GALERIE", 292, 87, "#e8c66a"); if (on) B.mat(Z.FAC, 30, 255); else B.mat(Z.FAC, 255, 0); B.r(272, 95, 68, 14, on ? "#f4ead0" : "#3a4450"); B.mat(Z.FAC, on ? 60 : 255, on ? 200 : 0); for (const [x, c] of [[277, "#c8443a"], [296, "#2c5a9a"], [315, "#e8c66a"], [328, "#3e6a4a"]]) { B.r(x, 97, 11, 10, "#3a2a1c"); B.r(x + 1, 98, 9, 8, c); B.r(x + 3, 100, 4, 3, sh(c, 50)); } B.mat(Z.FAC, 255, 0); B.r(272, 109, 68, 3, "#1e1e22");
      if (on) ctx.L.push({ x: 306, y: 102, r: 44, c: WHITE, i: 1.0, haze: 0.14, hr: 26 }, { x: 240, y: 86, r: 30, c: WARM, i: 0.7, haze: 0.2, hr: 14 });
      ctx.perches.push([180, 85], [300, 85], [160, 121]);
    },
    devant(B, P, ctx) { lampe(B, P, ctx, 118); lampe(B, P, ctx, 362); B.mat(Z.ST, 255, 0); for (const x of [217, 259]) { B.r(x, 108, 6, 6, "#3a3a3e"); B.hl(x, 108, 6, "#5a5a60"); B.ell(x + 3, 102, 3, 3, "#2f5a32"); B.ell(x + 3, 96, 2.4, 2.4, "#3f6a3a"); B.vl(x + 3, 98, 4, "#3a2a1c"); } K.voiture(B, 150, 136, { body: "#1a1a1e", shade: "#101014" }, Z.CAR); ctx.ombres.push([180, 20, 30]); ctx.figs.push([214, 119, { coat: "#1e1e22", pants: "#16161a", skin: "#e2b48f", hair: "#8f8e8c", dir: -1, shirt: "#f2efe6" }]); },
    anim(B, P, t, ctx) { // la dame au petit chien
      const span = ctx.d.FW + 80, x = ((t * 8) % span) - 40 + ctx.d.X0, w = t * 3.4; K.fig(B, x, 120, { coat: "#7a3440", pants: "#2a2c34", skin: "#f0c8a4", hair: "#dcdad4", hairLong: true, scarf: "#e8dcc0", dir: 1, walk: w, long: true }); B.mat(Z.ACT, 255, 0); const dx = x + 11, bob = Math.sin(w * 2) > 0 ? 0 : 1; B.r(dx, 117 + bob, 5, 3, "#f2efe6"); B.r(dx + 4, 115 + bob, 3, 3, "#f2efe6"); B.px(dx + 6, 116 + bob, "#1a1412"); B.px(dx + 5, 114 + bob, "#d8ccb4"); B.px(dx - 1, 116 + bob, "#f2efe6"); B.px(dx + (Math.sin(w * 2) > 0 ? 0 : 1), 120, "#d8ccb4"); B.px(dx + 4 - (Math.sin(w * 2) > 0 ? 0 : 1), 120, "#d8ccb4"); B.line(x + 4, 111, dx + 4, 116 + bob, "#c8323a"); } };

  // Maison d'arrêt de la Santé : le haut mur de meulière, la porte, le mirador, la file des visiteurs
  LIEUX.sante = { span: [0, 480], cotes: "mur", coteO: { kind: "pierre", top: 44 }, passants: 3,
    loin(B, P, ctx) { B.mat(Z.FAR, 0, 255); const R = rng(8); for (let x = ctx.d.X0; x < ctx.d.X1;) { const w = 18 + (R() * 26 | 0), h = 10 + (R() * 16 | 0); B.r(x, 44 - h, w, h, farC(P, "#59606a", 0.5)); B.r(x, 44 - h - 3, w, 3, farC(P, "#3c434e", 0.5)); if (P.on) for (let k = 0; k < 3; k++) if (R() < 0.5) B.px(x + 2 + (R() * (w - 4) | 0), 44 - h + 2 + (R() * (h - 3) | 0), "#f0c070"); x += w; } const tw = farC(P, "#3d4654", 0.55); B.r(60, 2, 15, 42, tw); for (let y = 5; y < 40; y += 2) for (let x = 62; x < 74; x += 2) if (P.on && h2(x, y) < 0.3) B.px(x, y, "#f4cf86"); },
    centre(B, P, ctx) {
      const on = P.on > 0;
      COTE.mur(B, P, ctx, 0, 480, 0, { kind: "pierre", top: 44 });
      const st = ["#d9d0bc", "#c2b8a2", "#a0967e", "#7a705c"]; B.mat(Z.FAC, 255, 0); B.r(196, 50, 88, 62, st[1]); B.noise(196, 50, 88, 62, st[0], 0.08, 5, 0.6); B.vl(196, 50, 62, st[0]); B.vl(283, 50, 62, st[3]); for (let j = 0; j < 10; j++) B.hl(198 + j * 4, 50 - j, 84 - j * 8, j > 7 ? st[0] : st[1]); B.r(192, 50, 96, 3, st[0]); B.hl(192, 53, 96, st[3]);
      gravure(B, "MAISON D'ARRET", 240, 57, st[3]); B.r(232, 44, 16, 6, "#1b2a55"); B.vl(236, 45, 4, "#2b4bb0"); B.r(238, 45, 4, 4, "#e8e8e8"); B.vl(243, 45, 4, "#c8323a");
      B.ell(240, 76, 22, 8, "#2a3442"); B.r(218, 76, 45, 36, "#3a4a62"); for (let x = 220; x < 262; x += 6) B.vl(x, 72, 40, "#2a3850"); B.hl(218, 90, 45, "#2a3850"); B.r(244, 92, 12, 20, "#32425a"); B.vl(244, 92, 20, "#22304a"); B.px(253, 102, "#c9c9c9"); B.r(246, 95, 6, 4, "#1a2028");
      B.mat(Z.FAC, on ? 0 : 255, on ? 255 : 0); B.r(238, 64, 5, 5, on ? "#ffe6a8" : "#c9cbc4"); B.mat(Z.FAC, 255, 0);
      enseigne(B, P, "PARLOIRS", 334, 74, "#ffffff", "#1f3f9a", false); B.r(296, 62, 4, 2, "#e2e2e2"); B.px(300, 63, "#1a1a1a");
      // mirador
      B.r(428, 22, 28, 22, "#8f7f62"); B.r(426, 20, 32, 3, "#3a4048"); B.r(430, 25, 24, 10, on ? "#1c2430" : "#4a5a66"); B.vl(442, 25, 10, "#3a4048"); B.r(424, 16, 36, 4, "#4a5460"); ctx.mir = [442, 30];
      if (on) ctx.L.push({ x: 240, y: 68, r: 60, c: WARM, i: 1.1, down: true, up: 10, haze: 0.36, hr: 24 });
      ctx.perches.push([120, 41], [330, 41], [380, 121], [90, 121]); ctx.muret = 41;
    },
    devant(B, P, ctx) { arbre(B, P, ctx, 100, 13); arbre(B, P, ctx, 388, 17); banc(B, 150); for (let x = 300; x < 372; x += 12) ctx.figs.push([x, 118 + (x % 24 ? 1 : 0), Object.assign({ dir: -1 }, K.LOOKS[(x / 12) % 5 | 0], { bag: "#3a5a8a" })]); for (let x = 20; x < 190; x += 24) plot(B, x); },
    anim(B, P, t, ctx, dyn) {
      // le projecteur du mirador balaie le trottoir ; un chat longe le haut du mur
      if (P.on) { const a = Math.sin(t * 0.5), x = ctx.mir[0] - 130 + a * 110; dyn.push({ x: x + ctx.d.OX, y: 118, r: 46, c: [1, 1, 0.9], i: 0.9, haze: 0.2, hr: 20 }); B.mat(Z.FAC, 0, 255); B.r(ctx.mir[0] - 2, ctx.mir[1], 3, 3, "#fffbe8"); }
      const T = 40, u = (t % T) / 16; if (u < 1) { const x = ctx.d.X0 + u * (ctx.d.FW + 20), k = Math.floor(t * 6) % 2; B.mat(Z.ACT, 150, 0); B.r(x, 38, 7, 3, "#1a1a1e"); B.r(x + 6, 36, 3, 3, "#1a1a1e"); B.px(x + 6, 35, "#1a1a1e"); B.px(x + 8, 35, "#1a1a1e"); B.px(x - 1, 37 - k, "#1a1a1e"); B.px(x - 2, 36 - k, "#1a1a1e"); B.px(x + 1 + k, 41, "#1a1a1e"); B.px(x + 5 - k, 41, "#1a1a1e"); if (P.on) { B.mat(Z.ACT, 0, 200); B.px(x + 8, 37, "#c8ff7a"); } } } };

  // Centre pénitentiaire de Fresnes : la porte monumentale de brique et de pierre, le mur, les pavillons
  LIEUX.fresnes = { span: [80, 400], cotes: "pavillons", passants: 2,
    loin(B, P, ctx) { B.mat(Z.FAR, 0, 255); for (const x of [100, 250]) { B.r(x, 34, 130, 26, farC(P, "#8a5a4a", 0.42)); for (let j = 0; j < 8; j++) B.hl(x + j, 26 + j, 130 - j * 2, farC(P, "#4a5460", 0.42)); for (let k = x + 10; k < x + 125; k += 9) B.r(k, 40, 3, 5, P.on && h2(k, 3) < 0.3 ? rgb("#f0c070") : farC(P, "#2c3340", 0.3)); B.r(x + 30, 18, 4, 9, farC(P, "#8c6a58", 0.4)); B.r(x + 90, 18, 4, 9, farC(P, "#8c6a58", 0.4)); } },
    centre(B, P, ctx) {
      const on = P.on > 0, st = ["#ddd5c4", "#c9c0ae", "#aaa190", "#857c6c"];
      mur(B, 80, 60, 320, 52, "brique", 3); B.mat(Z.FAC, 255, 0); B.r(80, 58, 320, 2, st[1]); for (let x = 96; x < 400; x += 38) { if (x > 150 && x < 330) continue; B.r(x, 60, 6, 52, "#7a4132"); B.vl(x, 60, 52, "#a9644e"); }
      mur(B, 160, 36, 160, 76, "brique", 9); B.mat(Z.FAC, 255, 0); for (const x of [160, 314]) { for (let y = 36; y < 112; y += 6) B.r(x, y, 6, 3, st[1]); } toit(B, 154, 326, 36, 16, "#4a5460"); B.r(236, 12, 8, 10, "#4a5460"); B.px(239, 9, "#d9b34a"); B.r(160, 58, 160, 9, st[1]); B.hl(160, 58, 160, st[0]); B.hl(160, 66, 160, st[3]);
      gravure(B, "PRISONS DE FRESNES", 240, 60, st[3]);
      grille(B, P, 174, 42, 2, 1, { cw: 8, ch: 12, gx: 22, gy: 1, p: 0.5, seed: 3, cadre: st[0], bar: true }); grille(B, P, 276, 42, 2, 1, { cw: 8, ch: 12, gx: 22, gy: 1, p: 0.5, seed: 4, cadre: st[0], bar: true }); grille(B, P, 174, 76, 2, 1, { cw: 8, ch: 14, gx: 22, gy: 1, p: 0.6, seed: 6, cadre: st[0], bar: true, cold: true }); grille(B, P, 276, 76, 2, 1, { cw: 8, ch: 14, gx: 22, gy: 1, p: 0.3, seed: 7, cadre: st[0], bar: true, cold: true });
      B.mat(Z.FAC, 255, 0); B.ell(240, 80, 24, 12, st[0]); B.r(216, 80, 49, 32, st[0]); B.ell(240, 82, 20, 9, "#1f3a2c"); B.r(220, 82, 41, 30, "#1f3a2c"); B.vl(240, 74, 38, "#122418"); for (let x = 224; x < 260; x += 6) B.vl(x, 76, 36, "#2a4a38", 0.6); B.r(244, 94, 11, 18, "#274636"); B.px(252, 103, "#c9c9c9"); B.ell(240, 44, 6, 6, "#f2ecd8"); B.line(240, 44, 240, 40, "#1d1d22"); B.line(240, 44, 243, 45, "#1d1d22");
      B.mat(Z.FAC, on ? 0 : 255, on ? 255 : 0); B.r(208, 78, 4, 5, on ? "#ffe6a8" : "#c9cbc4"); B.r(268, 78, 4, 5, on ? "#ffe6a8" : "#c9cbc4"); B.mat(Z.FAC, 255, 0);
      if (on) ctx.L.push({ x: 210, y: 82, r: 44, c: WARM, i: 1.0, haze: 0.3, hr: 20 }, { x: 270, y: 82, r: 44, c: WARM, i: 1.0, haze: 0.3, hr: 20 });
      ctx.flags = [[262, 20]]; ctx.perches.push([110, 57], [130, 57], [350, 57], [372, 57], [190, 19], [100, 121]);
    },
    devant(B, P, ctx) { mat(B, P, ctx, 60, 44); mat(B, P, ctx, 420, 44); banc(B, 330); B.mat(Z.ST, 255, 0); B.vl(318, 96, 26, "#6a6f78"); B.r(312, 92, 13, 7, "#2a9a94"); B.txt("187", 313, 93, "#ffffff"); ctx.figs.push([338, 119, Object.assign({ dir: -1 }, K.LOOKS[1], { bag: "#3a5a8a" })], [300, 119, Object.assign({ dir: 1 }, K.LOOKS[4])]); } };

  // Maison d'arrêt de Fleury-Mérogis : les barres de béton, les mâts d'éclairage, le parking
  LIEUX.fleury = { span: [0, 480], cotes: "champs", passants: 1,
    loin(B, P, ctx) { const on = P.on > 0; B.mat(Z.FAR, 0, 255); const c = farC(P, "#a8a6a0", 0.3), cd = farC(P, "#7c7a76", 0.3); for (const [x, w, y] of [[10, 150, 42], [170, 140, 34], [320, 150, 42]]) { B.r(x, y, w, 74 - y, c); B.r(x, y, w, 2, cd); for (let yy = y + 5; yy < 72; yy += 5) for (let xx = x + 3; xx < x + w - 3; xx += 4) B.r(xx, yy, 2, 2, on && h2(xx, yy) < 0.14 ? rgb("#f0c070") : cd); B.vl(x + w - 1, y, 74 - y, cd); } B.r(228, 18, 24, 56, c); B.r(224, 16, 32, 4, cd); B.r(230, 21, 20, 5, on ? rgb("#cfe6ea") : farC(P, "#3a4a5a", 0.2)); },
    centre(B, P, ctx) {
      const on = P.on > 0;
      // clôture et concertina
      B.mat(Z.FAC, 255, 0); B.r(0, 74, 480, 38, "#5a6a4c"); B.noise(0, 74, 480, 38, "#6a7a58", 0.2, 2, 0.6);
      for (let x = 0; x < 480; x += 2) for (let y = 78; y < 110; y += 2) B.px(x + ((y >> 1) & 1), y, "#9aa0a6", 0.55); for (let x = 0; x < 480; x += 20) B.r(x, 74, 2, 38, "#c8c6c0"); for (let x = 0; x < 480; x++) { B.px(x, 74 + Math.round(Math.sin(x * 0.9) * 1.5), "#c8ccd4"); if (x % 7 === 0) B.px(x, 72, "#f4f6fa"); }
      // pavillon d'entrée
      mur(B, 196, 78, 88, 34, "beton", 5); B.r(192, 76, 96, 3, "#8a8882"); if (on) B.mat(Z.FAC, 30, 240); B.r(226, 90, 28, 22, on ? "#cfe6ea" : "#3d4b58"); B.mat(Z.FAC, 255, 0); B.vl(240, 90, 22, "#2a3038"); B.r(200, 92, 20, 10, on ? "#1c2430" : "#4a5a66"); B.r(260, 92, 20, 10, on ? "#1c2430" : "#4a5a66");
      enseigne(B, P, P.o.plaque || "FLEURY-MEROGIS", 240, 80, "#ffffff", "#1f3f9a", true); gravure(B, "MAISON D'ARRET", 240, 70, "#e8e6e0");
      B.r(288, 104, 3, 8, "#c8c6c0"); for (let x = 291; x < 340; x += 6) B.r(x, 105, 3, 2, (x / 6 | 0) % 2 ? "#d8343a" : "#f2f2f2");
      if (on) ctx.L.push({ x: 240, y: 100, r: 50, c: COLD, i: 1.1, haze: 0.2, hr: 26 }, { x: 240, y: 84, r: 30, c: [0.4, 0.6, 1], i: 0.8, haze: 0.3, hr: 16 });
      ctx.perches.push([100, 73], [380, 73], [150, 121]);
    },
    devant(B, P, ctx) { for (const x of [60, 180, 300, 420]) { B.mat(Z.ST, 255, 0); B.r(x, 10, 2, 112, "#7a7f88"); B.r(x - 6, 10, 14, 2, "#7a7f88"); B.mat(Z.ST, P.on ? 0 : 255, P.on ? 255 : 0); for (const k of [-6, -2, 3, 7]) B.r(x + k, 12, 2, 2, P.on ? "#f4f8ff" : "#c8ccd4"); B.mat(Z.ST, 255, 0); ctx.ombres.push([x, 110, 1]); if (P.on) ctx.L.push({ x: x + 1, y: 14, r: 150, c: [0.92, 0.96, 1], i: 1.0, down: true, up: 4, haze: 0.5, hr: 26 }); }
      K.voiture(B, 80, 136, { body: "#8a2a2a", shade: "#5c1c1c" }, Z.CAR); K.voiture(B, 330, 136, { body: "#c8ccd0", shade: "#9a9ea4", dir: -1 }, Z.CAR); K.voiture(B, 396, 136, { body: "#2f4a3a", shade: "#1f3226" }, Z.CAR); ctx.ombres.push([110, 20, 30], [360, 20, 30], [426, 20, 30]); ctx.figs.push([272, 118, Object.assign({ dir: -1 }, K.LOOKS[3])]); },
    anim(B, P, t, ctx) { // un avion descend vers Orly
      const T = 34, u = (t % T) / 12; if (u > 1) return; const x = ctx.d.X1 + 10 - u * (ctx.d.FW + 30), y = 8 + u * 12; B.mat(Z.FAR, 0, 255); B.r(x, y, 9, 1, P.on ? "#3a4258" : "#e8ecf2"); B.r(x + 3, y - 1, 3, 3, P.on ? "#3a4258" : "#e8ecf2"); B.px(x + 8, y - 1, P.on ? "#3a4258" : "#e8ecf2"); if (Math.floor(t * 3) % 2) { B.px(x, y, "#ff4030"); B.px(x + 4, y + 1, "#ffffff"); } } };

  // Centre de détention de Melun : l'île, le vieux bâtiment d'ardoise, la Seine
  LIEUX.melun = { span: [0, 480], cotes: "champs", vehicule: "aucun", passants: 2, eau: true,
    centre(B, P, ctx) {
      const on = P.on > 0, st = ["#d9d0bc", "#c2b8a2", "#a0967e", "#7a705c"];
      B.mat(Z.FAR, 0, 255); for (let x = 0; x < 480; x += 6) B.ell(x, 62 - (h2(x, 4) * 10), 6, 9, farC(P, "#35523a", 0.3));
      B.mat(Z.FAC, 255, 0); B.r(110, 42, 260, 34, st[1]); B.noise(110, 42, 260, 34, st[0], 0.08, 2, 0.6); toit(B, 106, 374, 42, 14, "#4a5460"); for (const x of [150, 240, 330]) B.r(x, 20, 5, 10, "#8c6a58"); grille(B, P, 118, 48, 20, 2, { cw: 5, ch: 8, gx: 12.6, gy: 13, p: 0.2, seed: 3, cadre: st[0], bar: true });
      B.r(300, 22, 16, 54, st[1]); for (let j = 0; j < 16; j++) B.hl(308 - j * 0.5, 6 + j, j + 1, "#4a5460"); B.px(308, 3, "#d9b34a"); B.r(305, 30, 6, 9, "#2a2c34");
      mur(B, 36, 70, 444, 42, "pierre", 7); B.mat(Z.FAC, 255, 0); B.r(36, 68, 444, 2, "#c8c0ae");
      B.r(196, 62, 88, 50, st[1]); B.vl(196, 62, 50, st[0]); B.vl(283, 62, 50, st[3]); toit(B, 192, 288, 62, 10, "#4a5460"); gravure(B, "CENTRE DE DETENTION", 240, 70, st[3]); B.ell(240, 88, 14, 8, "#2a3442"); B.r(226, 88, 29, 24, "#3a4a62"); B.vl(240, 82, 30, "#2a3850");
      B.mat(Z.FAC, on ? 0 : 255, on ? 255 : 0); B.r(238, 78, 5, 4, on ? "#ffe6a8" : "#c9cbc4"); B.mat(Z.FAC, 255, 0);
      // le pont, à gauche
      B.r(0, 96, 40, 6, st[1]); for (const x of [8, 28]) { B.ell(x, 112, 9, 12, "#1a2a34"); } B.r(0, 94, 40, 2, st[0]);
      if (on) ctx.L.push({ x: 240, y: 82, r: 50, c: WARM, i: 1.0, down: true, up: 8, haze: 0.3, hr: 22 });
      ctx.flags = [[250, 46]]; ctx.perches.push([130, 27], [350, 27], [60, 67], [420, 67]);
    },
    devant(B, P, ctx) { lampe(B, P, ctx, 150); lampe(B, P, ctx, 330); arbre(B, P, ctx, 420, 9); banc(B, 180);
      // la Seine remplace la chaussée
      B.ox = 0; const FW = ctx.d.FW; B.mat(Z.KERB, 255, 0); B.r(0, YK, FW, 3, "#8a8474"); B.hl(0, YK, FW, "#b8b2a0"); for (let x = 0; x < FW; x += 14) B.vl(x, YK, 3, "#6a6456"); B.mat(Z.ROAD, 255, 0); B.r(0, YR + 1, FW, H - YR - 1, "#2c4854"); for (let y = YR + 1; y < H; y++) for (let x = 0; x < FW; x++) { ctx.wet[y * FW + x] = 1; if (h2(x >> 2, y) < 0.16) B.px(x, y, "#38586a"); }
      B.ox = ctx.d.OX; B.mat(Z.CAR, 255, 0); B.r(340, 132, 70, 6, "#3a2a22"); B.r(336, 130, 78, 2, "#6a2a2a"); B.r(380, 124, 22, 6, "#e6dcc6"); B.r(382, 126, 5, 3, P.on ? "#f6cc80" : "#3d4b58"); B.r(392, 126, 5, 3, "#3d4b58"); B.vl(350, 118, 12, "#3a2a22"); if (P.on) ctx.L.push({ x: 386, y: 128, r: 20, c: WARM, i: 0.6 }); },
    anim(B, P, t, ctx) { // les canards, et parfois un poisson qui saute
      B.mat(Z.ACT, 255, 0); for (let i = 0; i < 3; i++) { const x = ctx.d.X0 + ((t * (5 + i) + i * 90) % (ctx.d.FW + 20)) - 10, y = 138 + i * 3 + Math.round(Math.sin(t * 2 + i)); B.r(x, y, 4, 2, i ? "#6a4a2a" : "#e6e2d8"); B.r(x + 3, y - 2, 2, 2, i ? "#2f5a3a" : "#e6e2d8"); B.px(x + 5, y - 1, "#e8a020"); B.px(x - 2, y + 1, "#5a7a8a", 0.6); B.px(x - 4, y + 1, "#5a7a8a", 0.4); }
      const T = 17, u = (t % T) / 0.8; if (u < 1) { const x = 120 + Math.floor(t / T) % 3 * 80, y = 140 - Math.sin(u * Math.PI) * 7; B.r(x + u * 6, y, 3, 1, "#b8c8d4"); B.px(x + u * 6 + 3, y, "#8a9aa8"); } } };

  // Maison centrale de Poissy : le mur, les miradors, le fil de rasoir sous un ciel bas
  LIEUX.poissy = { span: [0, 480], cotes: "mur", coteO: { kind: "beton", top: 38, fil: true }, passants: 1,
    loin(B, P, ctx) { B.mat(Z.SKY, 0, 255); const cl = P.cloud.map(rgb); for (let i = 0; i < 26; i++) { const cx = ctx.d.X0 + h01(i * 5.1) * ctx.d.FW, cy = 4 + h01(i * 3.3) * 26; B.ell(cx, cy, 16 + h01(i) * 14, 3 + h01(i * 2) * 3, cl[i % 3], 0.7); } B.mat(Z.FAR, 0, 255); const st = farC(P, "#b8ac94", 0.4); B.r(96, 10, 12, 28, st); for (let j = 0; j < 12; j++) B.hl(102 - j * 0.5, -2 + j, j + 1, farC(P, "#4a5460", 0.4)); B.r(100, 18, 4, 6, farC(P, "#2a2c34", 0.3)); B.r(60, 26, 36, 12, st); },
    centre(B, P, ctx) {
      const on = P.on > 0;
      COTE.mur(B, P, ctx, 0, 480, 0, { kind: "beton", top: 38, fil: true });
      for (const x of [50, 410]) { B.mat(Z.FAC, 255, 0); B.r(x, 14, 24, 24, "#9d9b95"); B.r(x - 3, 10, 30, 4, "#4a5460"); B.r(x + 2, 17, 20, 9, on ? "#1c2430" : "#4a5a66"); B.vl(x + 8, 17, 9, "#6a6864"); B.vl(x + 15, 17, 9, "#6a6864"); B.r(x - 2, 28, 28, 2, "#6a6864"); B.mat(Z.FAC, on ? 0 : 255, on ? 255 : 0); B.r(x + 10, 30, 4, 3, on ? "#fffbe8" : "#c8ccd4"); B.mat(Z.FAC, 255, 0); if (on) ctx.L.push({ x: x + 12, y: 34, r: 100, c: [1, 1, 0.92], i: 0.9, down: true, up: 4, haze: 0.4, hr: 24 }); }
      B.r(194, 52, 92, 60, "#85837e"); B.r(190, 50, 100, 3, "#b4b2ac"); B.r(202, 62, 76, 50, "#4a5a70"); for (let x = 204; x < 278; x += 8) B.vl(x, 62, 50, "#3a4a60"); B.hl(202, 84, 76, "#3a4a60"); for (let x = 202; x < 278; x += 8) { B.r(x, 106, 4, 6, "#d8b62a"); B.r(x + 4, 106, 4, 6, "#22262c"); } B.r(256, 86, 14, 26, "#52627a"); B.vl(256, 86, 26, "#3a4a60"); B.px(267, 99, "#c9c9c9");
      gravure(B, "MAISON CENTRALE", 240, 54, "#3a3834"); B.r(182, 60, 4, 2, "#e2e2e2"); B.r(296, 60, 4, 2, "#e2e2e2");
      ctx.perches.push([130, 35], [300, 35], [340, 35], [200, 121]);
    },
    devant(B, P, ctx) { B.mat(Z.ST, 255, 0); for (let x = 150; x < 340; x += 18) { B.r(x, 114, 5, 7, "#9d9b95"); B.hl(x, 114, 5, "#c8c6c0"); } mat(B, P, ctx, 120, 40); mat(B, P, ctx, 360, 40); ctx.figs.push([300, 118, Object.assign({ dir: -1 }, K.LOOKS[0], { bag: "#3a5a8a" })], [312, 119, Object.assign({ dir: -1 }, K.LOOKS[2])]); } };

  // Le lieu des faits : l'enseigne porte le nom tiré par l'affaire
  LIEUX.faits = { span: [130, 350], cotes: "haussmann", passants: 5,
    centre(B, P, ctx) {
      const on = P.on > 0, nom = strip(String(P.o.nom || "").split(/,| - | \(/)[0]), bas = nom.toLowerCase(), seed = CR.hash ? CR.hash(nom) % 97 : 7;
      K.haussmann(B, P, 130, 350, { n: 5, seed: 30 + seed, stone: [S1, S2, S3][seed % 3], zinc: "#6c7683" });
      const type = /bar|cafe|comptoir|brasserie|bistro|tabac|zinc/.test(bas) ? "bar" : /bijou|joaill|horlog/.test(bas) ? "bijou" : /carrefour|angle|place|rue |avenue|boulevard|quai|pont|station|gare|parc|square/.test(bas) ? "rue" : "boutique";
      const col = { bar: ["#5a1c1b", "#e6bf5a", [1, 0.68, 0.34]], bijou: ["#16161a", "#e8c66a", [1, 0.92, 0.75]], boutique: [["#2c4a3a", "#27407a", "#5a3a5e"][seed % 3], "#f2ecdc", [1, 0.85, 0.6]], rue: ["#3a4048", "#f2ecdc", [1, 0.85, 0.6]] }[type];
      B.mat(Z.FAC, 255, 0); B.r(132, YF, 216, YB - YF, col[0]); B.r(132, YF, 216, 13, sh(col[0], 10)); B.hl(132, YF, 216, sh(col[0], 40)); B.hl(132, YF + 13, 216, sh(col[0], -40));
      if (type !== "rue") { const mots = nom.split(" "); let l1 = "", l2 = ""; for (const m of mots) { if ((l1 + " " + m).trim().length <= 26 && !l2) l1 = (l1 + " " + m).trim(); else l2 = (l2 + " " + m).trim(); } l2 = l2.slice(0, 26); B.mat(Z.FAC, on ? 100 : 255, on ? 170 : 0); B.txt(l1, Math.round(240 - (l1.length * 4 - 1) / 2), YF + (l2 ? 1 : 4), col[1]); if (l2) B.txt(l2, Math.round(240 - (l2.length * 4 - 1) / 2), YF + 7, col[1]); B.mat(Z.FAC, 255, 0); }
      const vit = (xa, xb) => { if (on) B.mat(Z.FAC, 30, 255); else B.mat(Z.FAC, 255, 0); for (let y = 101; y < 110; y++) B.hl(xa, y, xb - xa, on ? hexOf(mix([255 * col[2][0], 236 * col[2][1], 200 * col[2][2]], [150, 100, 50], (y - 101) / 16)) : "#33302c");
        if (type === "bar" && on) for (let x = xa + 4; x < xb - 5; x += 9) { B.r(x, 103, 3, 3, "#3a2016"); B.r(x - 1, 106, 5, 4, ["#3d2a22", "#2c3440", "#4a2a2a"][x % 3]); }
        if (type === "bijou") for (let x = xa + 3; x < xb - 4; x += 7) { B.r(x, 105, 5, 4, "#1e1e24"); B.mat(Z.FAC, 0, on ? 255 : 0); B.px(x + 2, 104, on ? "#ffffff" : "#c8ccd4"); B.px(x + 1, 106, "#e8c66a"); B.px(x + 3, 106, "#9fd0ff"); B.mat(Z.FAC, on ? 30 : 255, on ? 255 : 0); }
        if (type === "boutique" || type === "rue") for (let x = xa + 3; x < xb - 3; x += 4) B.r(x, 104 + (x % 3), 3, 5 - (x % 3), ["#e8443a", "#e8c66a", "#5a9a5a", "#f0f0e8", "#3a7ab0"][(x + seed) % 5]);
        B.mat(Z.FAC, 255, 0); if (!on) { B.line(xa + 2, 108, xa + 9, 102, "#5a6470"); } };
      vit(137, 205); vit(275, 343); vit(214, 266); B.r(208, 100, 4, 12, sh(col[0], 14)); B.r(268, 100, 4, 12, sh(col[0], 14)); B.vl(240, 101, 11, sh(col[0], -20)); B.r(137, 110, 68, 2, sh(col[0], -20)); B.r(275, 110, 68, 2, sh(col[0], -20));
      if (type === "bar") { for (let y = 0; y < 3; y++) B.hl(134 - y, 99 + y, 212 + y * 2, y ? "#8f2224" : "#c9403a"); for (let x = 132; x < 348; x++) B.px(x, 102, (x >> 2) % 2 ? "#e9dcc0" : "#8f2224"); B.mat(Z.ST, 255, 0); for (const tx of [150, 180, 300, 328]) { B.hl(tx - 2, 108, 5, "#e2ded4"); B.vl(tx, 109, 5, "#2a2a2c"); B.hl(tx - 1, 114, 3, "#2a2a2c"); for (const s of [-1, 1]) { B.r(tx + s * 5 - 1, 104, 3, 5, "#b8863c"); B.hl(tx + s * 5 - 2, 109, 5, "#c4923f"); B.vl(tx + s * 5 - 2, 110, 4, "#6a4a22"); } } }
      if (type === "bijou") { B.mat(Z.FAC, 255, 0); for (let x = 137; x < 344; x += 3) { if (x > 206 && x < 274) continue; B.vl(x, 101, 9, "#3a3a40", 0.35); } }
      // plaque de rue émaillée, au coin
      const rue = /(rue|avenue|boulevard|place|quai|carrefour|passage|square|pont)[a-z' -]*/.exec(bas); const pl = rue ? strip(rue[0]).slice(0, 15) : null; if (pl) { B.mat(Z.FAC, 255, 0); B.r(134, 70, pl.length * 4 + 5, 9, "#2f6a4a"); B.r(135, 71, pl.length * 4 + 3, 7, "#1f3f9a"); B.txt(pl, 137, 72, "#ffffff"); }
      if (on) for (const x of [171, 240, 309]) ctx.L.push({ x, y: 104, r: 38, c: col[2], i: 0.95, haze: 0.12, hr: 24 });
      ctx.perches.push([160, 85], [320, 85], [200, 121], [290, 121]); ctx.feu = /carrefour|angle|place/.test(bas) ? 366 : null;
    },
    devant(B, P, ctx) { lampe(B, P, ctx, 118); lampe(B, P, ctx, 372); arbre(B, P, ctx, 60, 5); for (let x = 150; x < 340; x += 24) plot(B, x); if (ctx.feu) { B.mat(Z.ST, 255, 0); B.r(ctx.feu, 92, 2, 30, "#2a2c30"); B.r(ctx.feu - 1, 84, 4, 10, "#1a1a1e"); } },
    anim(B, P, t, ctx) { if (!ctx.feu) return; const k = Math.floor(t / 4) % 3; B.mat(Z.ST, 0, 255); B.r(ctx.feu, 85 + [6, 3, 0][k], 2, 2, ["#3aff7a", "#ffb030", "#ff3a2a"][k]); B.mat(Z.ST, 255, 0); } };

  // Une rue de Paris près du tribunal : la fontaine Wallace, le kiosque
  LIEUX.rue = { span: [150, 330], cotes: "haussmann", passants: 5,
    centre(B, P, ctx) { K.haussmann(B, P, 150, 330, { n: 6, seed: 23, stone: S1, zinc: "#6c7683" }); K.boutiques(B, P, 150, 330, 3); if (P.on) ctx.L.push({ x: 190, y: 102, r: 38, c: WARM, i: 0.9, haze: 0.12, hr: 24 }, { x: 280, y: 102, r: 38, c: [1, 0.9, 0.7], i: 0.9, haze: 0.12, hr: 24 }); ctx.perches.push([180, 85], [300, 85], [216, 121]); },
    devant(B, P, ctx) { lampe(B, P, ctx, 132); lampe(B, P, ctx, 348); arbre(B, P, ctx, 80, 3); arbre(B, P, ctx, 404, 4);
      // fontaine Wallace
      B.mat(Z.ST, 255, 0); const fx = 236; B.r(fx - 3, 116, 9, 5, "#1f4a34"); B.hl(fx - 3, 116, 9, "#2f6a4a"); B.r(fx - 1, 110, 5, 6, "#24553c"); for (const k of [-2, 4]) B.vl(fx + k, 101, 9, "#1f4a34"); B.vl(fx + 1, 102, 8, "#2f6a4a"); B.r(fx - 3, 98, 9, 3, "#24553c"); B.r(fx - 2, 95, 7, 3, "#2f6a4a"); B.r(fx, 92, 3, 3, "#24553c"); B.px(fx + 1, 90, "#2f6a4a"); ctx.wallace = [fx + 1, 104];
      // kiosque à journaux
      const kx = 286; B.r(kx, 98, 26, 23, "#1f4a34"); B.r(kx - 2, 94, 30, 4, "#24553c"); B.hl(kx - 2, 94, 30, "#3a7a58"); B.r(kx + 8, 88, 10, 6, "#24553c"); B.r(kx + 11, 85, 4, 3, "#2f6a4a"); B.mat(Z.ST, P.on ? 60 : 255, P.on ? 220 : 0); B.r(kx + 2, 101, 22, 10, P.on ? "#f4ead0" : "#c8c2b0"); for (let i = 0; i < 5; i++) B.r(kx + 3 + i * 4, 102, 3, 4, ["#c8443a", "#27407a", "#e8c66a", "#f2f2ee", "#3e6a4a"][i]); for (let i = 0; i < 5; i++) B.r(kx + 3 + i * 4, 107, 3, 3, ["#f2f2ee", "#c8443a", "#2a9a94", "#e8c66a", "#5b4a7a"][i]); B.mat(Z.ST, 255, 0); if (P.on) ctx.L.push({ x: kx + 13, y: 106, r: 28, c: WHITE, i: 0.8, haze: 0.14, hr: 16 }); ctx.ombres.push([kx + 13, 34, 26]); ctx.figs.push([kx - 6, 119, Object.assign({ dir: 1 }, K.LOOKS[3])]); },
    anim(B, P, t, ctx) { // l'eau de la fontaine ; un cycliste passe
      B.mat(Z.ST, 255, 0); for (let k = 0; k < 6; k++) if ((Math.floor(t * 9) + k) % 3) B.px(ctx.wallace[0], ctx.wallace[1] + k, "#bfe0ff", 0.8);
      const span = ctx.d.FW + 60, x = ctx.d.X1 + 20 - ((t * 46) % (span + 500)); if (x < ctx.d.X0 - 30) return; B.mat(Z.CAR - 1, 255, 0); const y = 146, w = Math.floor(t * 10) % 2; for (const wx of [x, x + 14]) { for (let a = 0; a < 8; a++) B.px(wx + Math.cos(a * 0.785) * 4, y - 4 + Math.sin(a * 0.785) * 4, "#1c1d21"); } B.line(x, y - 4, x + 7, y - 4, "#c8323a"); B.line(x + 7, y - 4, x + 12, y - 11, "#c8323a"); B.line(x + 5, y - 11, x + 14, y - 4, "#c8323a"); B.line(x, y - 4, x + 5, y - 11, "#c8323a"); B.r(x + 4, y - 12, 4, 1, "#1c1d21"); B.r(x + 4, y - 20, 5, 8, "#3a7ab0"); B.r(x + 5, y - 24, 4, 4, "#d9a273"); B.r(x + 5, y - 25, 4, 2, "#e8c020"); B.line(x + 6, y - 12, x + 7 + (w ? 2 : -1), y - 5, "#2c2f3a"); B.line(x + 7, y - 18, x + 12, y - 12, "#3a7ab0"); if (P.on) { B.mat(Z.CAR - 1, 0, 255); B.px(x - 1, y - 9, "#fff6d0"); B.px(x + 16, y - 8, "#ff3a2a"); } } };

  // ------------------------------------------------------------------ la fabrique
  function fabrique(def) {
    return function Scene(W) {
      const d = K.dims(W), R = PL.Renderer(d.FW, H);
      let P = null, ctx = null, lastT = 0, birds = [];
      const S = { W: d.FW, H, R };
      S.set = function (ph, rain, o) {
        K.use(d); P = PL.conf(ph, rain); P.o = o || {}; P.saison = P.o.season || "automne";
        const B = R.stat; B.c.fill(0); B.e.fill(0); B.l.fill(0); B.z.fill(0); B.G = 0; B.ox = d.OX;
        ctx = { d, L: [], ombres: [], perches: [], figs: [], arbres: [], flags: [], wet: R.wet };
        K.ciel(B, P);
        if (def.loin) def.loin(B, P, ctx);
        const span = def.span || [0, CW], cote = COTE[def.cotes || "haussmann"];
        if (d.X0 < span[0]) cote(B, P, ctx, d.X0, span[0], 1, def.coteO); if (d.X1 > span[1]) cote(B, P, ctx, span[1], d.X1, 5, def.coteO);
        def.centre(B, P, ctx);
        K.sol(B, P, R.wet, def.sol || {});
        if (def.devant) def.devant(B, P, ctx);
        B.ox = d.OX;
        // ombres portées de jour : le soleil vient d'en haut à droite
        if (!P.on && !P.rain) { const dark = (x, y) => { x = Math.round(x) + d.OX; if (x < 0 || x >= d.FW || y < YB || y >= H) return; const q = y * d.FW + x, z = B.z[q]; if (z !== Z.WALK && z !== Z.KERB && z !== Z.ROAD) return; B.c[q * 3] *= 0.7; B.c[q * 3 + 1] *= 0.7; B.c[q * 3 + 2] *= 0.76; }; for (const [x, h, w] of ctx.ombres) { const len = Math.min(26, Math.round(h * 0.34)); for (let k = 0; k < len; k++) { const y = YK - 1 + k, hw = Math.max(1, Math.round(w * (0.5 + 0.5 * k / len))); for (let i = -hw; i <= hw; i++) dark(x - k * 1.5 + i, y); } } for (let x = d.X0; x < d.X1; x++) for (let k = 0; k < 4; k++) dark(x, YB + k); }
        for (const l of ctx.L) { l.x += d.OX; l.i *= P.on; if (l.haze) l.haze *= P.on; }
        R.bake(P.on ? ctx.L : P.rain ? [] : [{ x: d.FW + 80, y: -60, r: d.FW + 160, c: [1, 0.86, 0.62], i: 0.85 }]);
        birds = ctx.perches.map(([x, y], i) => ({ hx: x, hy: y, x, y, fly: 0, vx: 0, vy: 0, back: 0, i }));
      };
      S.frame = function (t, mouse) {
        K.use(d);
        const B = R.work, on = P.on > 0, dyn = [], dt = Math.min(0.2, Math.max(0, t - lastT)); lastT = t;
        B.copy(R.stat); B.G = 0; B.ox = d.OX;
        for (const [x, y] of ctx.flags) drapeau(B, x, y, t);
        B.G = Z.CAR; B.mat(Z.ACT, 255, 0);
        if (def.anim) def.anim(B, P, t, ctx, dyn);
        // oiseaux : ils s'envolent quand la souris approche, puis reviennent
        B.G = Z.CAR;
        for (const b of birds) {
          if (P.ph === "nuit" && b.i > 1) continue; if (P.rain && b.i > 2) continue;
          if (!b.fly && mouse && Math.hypot(mouse.x - d.OX - b.x, mouse.y - b.y) < 26) { b.fly = 1; b.vx = (b.x < mouse.x - d.OX ? -1 : 1) * (38 + b.i * 5); b.vy = -46 - b.i * 4; b.back = t + 14 + b.i * 2; }
          if (b.fly === 1) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 6 * dt; if (t > b.back) { b.fly = 2; b.x = b.hx + (b.i % 2 ? 120 : -120); b.y = -10; } }
          else if (b.fly === 2) { const dx = b.hx - b.x, dy = b.hy - b.y, dd = Math.hypot(dx, dy); if (dd < 2) { b.fly = 0; b.x = b.hx; b.y = b.hy; } else { b.x += dx / dd * 60 * dt; b.y += dy / dd * 60 * dt; } }
          if (b.y > -8) K.pigeon(B, Math.round(b.x), Math.round(b.y), b.fly, t, b.i);
        }
        B.mat(Z.ACT, 255, 0);
        for (const [x, y, o] of ctx.figs) K.fig(B, x, y, Object.assign({}, o, { umb: P.rain && !o.kepi ? (o.umb || "#2c2c30") : null }));
        const looks = def.looks || K.LOOKS, nw = Math.round((def.passants == null ? 4 : def.passants) * d.FW / 480);
        for (let i = 0; i < nw; i++) { const sp = [13, -17, 9, -11, 15, -14, 11, -9][i % 8], span = d.FW + 80, x0 = h01(i * 5.3 + 1) * span, x = ((x0 + sp * t) % span + span) % span - 40 + d.X0, lane = [119, 121, 118, 120, 121][i % 5], lk = looks[i % looks.length]; K.fig(B, x, lane, Object.assign({}, lk, { dir: sp > 0 ? 1 : -1, walk: t * Math.abs(sp) * 0.42 + i, umb: P.rain && i % 4 !== 3 ? (lk.umb || "#2c2c30") : null, bag: lk.bag })); }
        // véhicule
        B.G = Z.FG; const veh = def.vehicule || "auto";
        if (veh === "auto") { const per = (d.FW + 160) / 82 + 13, cyc = t % per; if (cyc < (d.FW + 160) / 82) { const cx = d.X0 - 70 + cyc * 82; K.voiture(B, Math.round(cx), 148, { body: ["#3a3f4c", "#6a2a2a", "#c8ccd0"][Math.floor(t / per) % 3], shade: "#272b35", lights: on, dir: 1 }, Z.CAR - 1); if (on) { dyn.push({ x: cx + 66 + d.OX, y: 141, r: 62, c: [1, 0.93, 0.74], i: 1.3 * P.on, dir: 1, haze: 0.5, hr: 24 }); dyn.push({ x: cx - 2 + d.OX, y: 141, r: 18, c: [1, 0.2, 0.15], i: 0.8 * P.on, haze: 0.2, hr: 10 }); } } }
        else if (veh === "tram" || veh === "bus") { const len = veh === "tram" ? 136 : 92, v = 46, per = (d.FW + len + 40) / v + 16, cyc = t % per; if (cyc < (d.FW + len + 40) / v) { const cx = Math.round(d.X0 - len - 20 + cyc * v); if (veh === "tram") tram(B, cx, on); else bus(B, cx, on); if (on) dyn.push({ x: cx + len + 6 + d.OX, y: 140, r: 50, c: [1, 0.95, 0.8], i: 1.1 * P.on, dir: 1, haze: 0.4, hr: 20 }, { x: cx + len / 2 + d.OX, y: 136, r: 60, c: [1, 0.96, 0.84], i: 0.5 * P.on }); } }
        // feuilles d'automne
        B.mat(Z.ACT, 255, 0);
        if (P.saison === "automne") ctx.arbres.forEach((ax, ai) => { for (let i = 0; i < 3; i++) { const T = 9 + h01(i * 3.7 + ai) * 6, u = ((t + h01(i * 9.1 + ai) * T) % T) / T, x = ax + (h01(i * 2.3 + ai) - 0.5) * 30 + Math.sin(u * 9 + i) * 6 - u * 10, y = 40 + u * 80; B.px(x, y, i % 2 ? "#d9a03a" : "#c8782a"); } });
        // pluie
        if (P.rain) {
          B.G = 0; B.ox = 0; const FW = d.FW, nr = Math.round(230 * FW / 480);
          for (let i = 0; i < nr; i++) { const sp = 150 + h01(i * 1.3) * 60, x0 = h01(i * 7.7) * (FW + 60), y = ((h01(i * 3.1) * H + t * sp) % (H + 10)) - 6, x = x0 - y * 0.28, len = 3 + (i % 3); for (let k = 0; k < len; k++) { const xx = (x - k * 0.28) | 0, yy = (y + k) | 0; if (xx < 0 || yy < 0 || xx >= FW || yy >= H) continue; const q = yy * FW + xx; if (B.z[q] === Z.SKY) continue; const j = q * 3; B.c[j] += (215 - B.c[j]) * 0.3; B.c[j + 1] += (225 - B.c[j + 1]) * 0.3; B.c[j + 2] += (240 - B.c[j + 2]) * 0.3; B.l[q] = Math.max(B.l[q], 150); } }
          B.mat(Z.ACT, 255, 0);
          for (let i = 0; i < Math.round(46 * FW / 480); i++) { const u = t * 3 + h01(i * 4.4) * 5, ph = u % 1, sx = (h01(i * 2.9 + (u | 0) * 0.37) * FW) | 0, sy = YB + 1 + (h01(i * 6.1 + (u | 0) * 0.71) * (H - YB - 2) | 0); if (ph < 0.5) { const q = sy * FW + sx; if (B.z[q] === Z.ROAD || B.z[q] === Z.WALK) { B.px(sx - 1, sy, "#c8d4e4", 0.5); B.px(sx + 1, sy, "#c8d4e4", 0.5); } } }
          B.ox = d.OX;
        }
        R.frame({ amb: P.amb, dyn, wet: def.eau ? Math.max(0.75, P.wet) : P.wet, t, YR, YB, mist: P.mist || null, glow: P.glow });
      };
      S.present = (c, w, h) => R.present(c, w, h);
      return S;
    };
  }
  for (const k in LIEUX) D.LIT[k] = { H, make: fabrique(LIEUX[k]) };
})();
