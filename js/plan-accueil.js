/* La Permanence — l'écran d'accueil dans le nouveau moteur (refonte du 13 novembre 2026).
   Le cabinet, à l'heure réelle : la pièce de accueil.js (fenêtre sur Paris, bibliothèques, bureau, chaise de Timon,
   patère) repeinte en matière à relief pour CR.gpu — la lampe de banquier modèle le bois, les reliures et le pelage,
   le parquet reflète la fenêtre. Timon y vit (timon.js : envies, perchoirs chaise, appui, bureau).
   Tout ce que faisait l'ancien accueil est conservé, mêmes clés et mêmes records (lp-accueil) : objets réactifs,
   boulette et corbeille, tampon, quiz éclair, pointeur. Rien ici ne touche à une partie.
   Les surprises restent secrètes : ne pas les lister à Kevin.
   Scene2(W, H, panneau) → { W, H, mat, frame(t, souris) → réglages de CR.gpu, cursorAt, start, key, down, up, click, quiz }.
   UI.TitleArt est remplacé quand WebGL 2 répond ; sinon l'ancien (tests jsdom) reste. */
(function () {
  const CR = window.CR, UI = CR.UI, { html } = UI, PL = CR.lum, G = CR.gpu, TM = CR.timon, A0 = CR.accueil;
  if (!G || !A0 || !TM) return;
  const { useEffect, useRef, useState } = React;
  const { rgb, h01, h2, mix, hexOf, rng } = PL;
  const sh = (hex, d) => { const c = rgb(hex); return hexOf([c[0] + d, c[1] + d, c[2] + d]); };
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const son = (n) => { try { if (CR.SON && CR.SON.jouer) CR.SON.jouer(n); } catch (e) { /* muet */ } };
  const mem = A0.mem;
  const D = { WALL: 200, GLASS: 204, FURN: 190, CHAIR: 132, DESK: 120, OBJ: 112, FG: 10 };
  const AMB = { nuit: [0.085, 0.095, 0.155], soir: [0.2, 0.165, 0.2], jour: [0.46, 0.47, 0.5] };

  // ------------------------------------------------------------------ la pièce (décor fixe)
  function piece(m, g, ph, st) {
    const { W, H, ax, FY, wx0, wx1, wy0, wy1, dx0, dx1, dy } = g, on = ph !== "jour";
    const M = (d, e, s, n) => m.set({ D: d, E: e || 0, S: s || 0, n: n || [0, 0] });
    // mur : papier peint à motif, corniche, lambris à panneaux
    M(D.WALL); m.r(0, 0, W, FY, "#3f4c49");
    for (let y = 12; y < FY - 36; y += 7) for (let x = (y % 14 ? 4 : 0); x < W; x += 8) { m.px(x, y, "#4a5a56"); m.px(x + 1, y + 1, "#36423f"); }
    m.noise(0, 10, W, FY - 46, "#374340", 0.1, 4, 0.7);
    M(D.WALL, 0, 0, [0, 0.5]); m.r(0, 0, W, 6, "#5a6862"); M(D.WALL, 0, 0, [0, -0.6]); m.r(0, 6, W, 2, "#73827a"); M(D.WALL); m.hl(0, 8, W, "#2a3432");
    m.r(0, FY - 34, W, 34, "#4f3828"); M(D.WALL, 0, 30, [0, -0.7]); m.r(0, FY - 36, W, 2, "#7a5a42"); M(D.WALL); m.hl(0, FY - 34, W, "#2c1e16");
    for (let x = 4; x < W; x += 34) { M(D.WALL, 0, 20); m.r(x, FY - 28, 28, 20, "#463221"); M(D.WALL, 0, 20, [0, 0.6]); m.hl(x, FY - 28, 28, "#2c1e16"); M(D.WALL, 0, 20, [0.6, 0]); m.vl(x, FY - 28, 20, "#2c1e16"); M(D.WALL, 0, 20, [-0.6, 0]); m.vl(x + 27, FY - 28, 20, "#6a4c36"); M(D.WALL, 0, 20, [0, -0.6]); m.hl(x, FY - 9, 28, "#6a4c36"); }
    M(D.WALL, 0, 0, [0, -0.5]); m.hl(0, FY - 5, W, "#6a4c36"); M(D.WALL); m.r(0, FY - 4, W, 4, "#33241a");
    // parquet à l'anglaise : il brille et s'approche vers le bas
    for (let y = FY, k = 0; y < H; k++) { const hgt = 4 + (k >> 1), off = (k * 23) % 40, d = Math.round(D.WALL * (1 - (y - FY) / (H - FY)));
      m.set({ D: d, E: 0, S: 150, n: [0, -1] }); m.r(0, y, W, hgt + 1, "#6e4c31"); m.hl(0, y, W, "#4a3220");
      for (let x = -off; x < W; x += 40 + k * 4) { m.vl(x, y + 1, hgt, "#523822"); if (h01(x + k * 7) < 0.5) m.r(x + 2, y + 1, 36 + k * 4 - 3, hgt - 1, h01(x * 3 + k) < 0.5 ? "#7a573c" : "#63452b", 0.8); }
      y += hgt + 1; }
    // tapis
    const rx0 = ax - 96, rx1 = Math.min(W - 6, ax + 104), ry0 = FY + 6, ry1 = Math.min(H - 10, FY + 42);
    for (let y = ry0; y < ry1; y++) { m.set({ D: Math.round(D.WALL * (1 - (y - FY) / (H - FY))), E: 0, S: 0, n: [0, -1] }); for (let x = rx0; x < rx1; x++) { const b = x - rx0 < 3 || rx1 - x <= 3 || y - ry0 < 2 || ry1 - y <= 2; m.px(x, y, b ? "#6a2430" : (y === ry0 + 4 || y === ry1 - 5) && x > rx0 + 5 && x < rx1 - 6 ? "#c8a260" : (x - rx0) % 12 > 9 && y > ry0 + 6 && y < ry1 - 7 ? "#4a3a6a" : h2(x, y) < 0.12 ? "#742a34" : "#7c2e38"); } }
    for (let y = ry0 + 1; y < ry1; y += 2) { m.px(rx0 - 1, y, "#d8c8a0"); m.px(rx1, y, "#d8c8a0"); }

    // ---- fenêtre : tringle, dormant, vitres (remplies à chaque image), croisillons, appui, rideaux
    M(D.WALL, 0, 140, [0, -0.6]); m.r(wx0 - 22, wy0 - 9, wx1 - wx0 + 44, 2, "#c9a24a"); M(D.WALL, 0, 140); m.r(wx0 - 24, wy0 - 10, 3, 4, "#e6c47a"); m.r(wx1 + 21, wy0 - 10, 3, 4, "#e6c47a");
    M(D.WALL - 1, 0, 30); m.r(wx0 - 4, wy0 - 4, wx1 - wx0 + 8, wy1 - wy0 + 8, "#d9d2c0"); M(D.WALL - 1, 0, 30, [0, -0.6]); m.hl(wx0 - 4, wy0 - 4, wx1 - wx0 + 8, "#f6f0e0"); M(D.WALL - 1, 0, 30, [-0.6, 0]); m.vl(wx0 - 4, wy0 - 4, wy1 - wy0 + 8, "#f6f0e0"); M(D.WALL - 1, 0, 30, [0.6, 0]); m.vl(wx1 + 3, wy0 - 4, wy1 - wy0 + 8, "#9a9484");
    g.glass.fill(0); M(D.GLASS, 255); for (let y = wy0; y < wy1; y++) for (let x = wx0; x < wx1; x++) { g.glass[y * W + x] = 1; m.px(x, y, "#000000"); }
    const pw = Math.round((wx1 - wx0) / 3), tr = wy0 + Math.round((wy1 - wy0) * 0.28), bar = (x, y, w, h) => { M(D.WALL - 1, 0, 30); m.r(x, y, w, h, "#d9d2c0"); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.glass[(y + j) * W + x + i] = 0; };
    for (const x of [wx0 + pw, wx0 + 2 * pw]) { bar(x - 1, wy0, 3, wy1 - wy0); M(D.WALL - 1, 0, 30, [-0.6, 0]); m.vl(x - 1, wy0, wy1 - wy0, "#f6f0e0"); M(D.WALL - 1, 0, 30, [0.6, 0]); m.vl(x + 1, wy0, wy1 - wy0, "#9a9484"); }
    bar(wx0, tr - 1, wx1 - wx0, 3); M(D.WALL - 1, 0, 30, [0, 0.6]); m.hl(wx0, tr + 1, wx1 - wx0, "#9a9484");
    M(D.WALL - 1, 0, 160); m.r(wx0 + pw, ((tr + wy1) >> 1) - 4, 1, 9, "#8a7a4a"); m.px(wx0 + pw + 1, (tr + wy1) >> 1, "#e6c47a");
    M(D.WALL - 3, 0, 40, [0, -0.8]); m.r(wx0 - 8, wy1 + 4, wx1 - wx0 + 16, 3, "#ece5d2"); M(D.WALL - 3); m.hl(wx0 - 8, wy1 + 7, wx1 - wx0 + 16, "#8a8474");
    for (const [cx0, dir] of [[wx0 - 20, 1], [wx1 + 2, -1]]) for (let y = wy0 - 7; y < FY - 38; y++) { const tie = y > wy1 - 34 && y < wy1 - 30, w = tie ? 9 : 18 - (y > wy1 - 34 ? 3 : 0); for (let i = 0; i < w; i++) { const x = dir > 0 ? cx0 + i : cx0 + 17 - i, f = Math.sin(i * 1.3 + (y > wy1 - 32 ? 1.2 : 0)); m.set({ D: D.WALL - 4, E: 0, S: 0, n: [Math.cos(i * 1.3) * 0.6 * dir, 0] }); m.px(x, y, tie ? "#c8a260" : f > 0.5 ? "#8a2f3a" : f < -0.5 ? "#4a161e" : "#6a222c"); } }

    // ---- bibliothèques : reliures bombées, filets dorés ; la radio sur un rayon
    const bookcase = (x0, x1, y0, seed, radio) => {
      const Rb = rng(seed); M(D.FURN, 0, 30); m.r(x0, y0, x1 - x0, FY + 8 - y0, "#3e2a1b"); M(D.FURN, 0, 30, [0, -0.6]); m.r(x0, y0, x1 - x0, 2, "#6a4a30"); M(D.FURN, 0, 30, [-0.6, 0]); m.vl(x0, y0, FY + 8 - y0, "#6a4a30"); M(D.FURN, 0, 30, [0.6, 0]); m.vl(x1 - 1, y0, FY + 8 - y0, "#241710");
      for (let y = y0 + 3; y < FY - 6; y += 24) { M(D.FURN + 6); m.r(x0 + 2, y, x1 - x0 - 4, 21, "#19110d"); M(D.FURN, 0, 30, [0, -0.7]); m.r(x0 + 2, y + 21, x1 - x0 - 4, 2, "#5a3e2a");
        if (radio && y === y0 + 3 + 48) { g.radio = { x: x0 + 6, y: y + 9, w: 24, h: 12 }; continue; }
        for (let x = x0 + 3; x < x1 - 4;) { const w = 2 + (Rb() * 3 | 0), h = 13 + (Rb() * 7 | 0), t = Rb(); const c = t < 0.34 ? "#b3261e" : t < 0.52 ? "#27407a" : ["#3e5c3a", "#8a6a2a", "#5b4a7a", "#2e2e33", "#a2553a", "#d8ccb4"][(Rb() * 6) | 0]; if (Rb() < 0.08) { x += 3; continue; }
          const lean = Rb() < 0.06 ? 1 : 0;
          for (let i = 0; i < w; i++) { m.set({ D: D.FURN + 2, E: 0, S: 60, n: [w > 1 ? (i / (w - 1) - 0.5) * 1.3 : 0, 0] }); m.vl(x + i, y + 21 - h + (lean && i ? 1 : 0), h - (lean && i ? 1 : 0), i === 0 ? sh(c, 22) : c); }
          if (t < 0.52 && w > 2) { M(D.FURN + 2, 0, 120); m.r(x, y + 21 - h + 3, w, 2, t < 0.34 ? "#f2ecdc" : "#d9b46a"); m.hl(x, y + 17, w, "#d9b46a", 0.6); }
          x += w + (Rb() < 0.15 ? 1 : 0); } }
      M(D.FURN); m.r(x0 - 1, FY + 6, x1 - x0 + 2, 3, "#241710");
    };
    bookcase(ax - 150, ax - 80, Math.max(14, wy0 - 8), 5, true);
    if (ax - 158 > 30) { bookcase(Math.max(4, ax - 232), ax - 158, Math.max(26, wy0 + 6), 9, false); if (ax - 250 > 8) { M(D.WALL - 1, 0, 60); m.r(Math.max(8, ax - 290), wy0 + 10, 30, 22, "#8a6a2a"); m.r(Math.max(10, ax - 288), wy0 + 12, 26, 18, "#243044"); m.ell(Math.max(10, ax - 288) + 13, wy0 + 24, 9, 3, "#3a5a6a"); } }

    // ---- horloge, diplôme, patère : repères (dessinés à chaque image)
    g.horloge = { x: Math.min(W - 14, ax + 86), y: wy0 + 8, r: 9 };
    g.cadre = { x: Math.min(W - 32, ax + 72), y: wy0 + 30, w: 28, h: 20 };
    g.patere = { x: Math.min(W - 10, ax + 114), y: FY - 96 };

    // ---- chaise de Timon : rotin, coussin vert
    const chx = g.chaise.x, chy = g.chaise.y;
    for (const lx of [chx - 12, chx + 11]) { M(D.CHAIR, 0, 60, [-0.5, 0]); m.r(lx, chy + 2, 1, FY + 10 - chy - 2, "#f0eee6"); M(D.CHAIR, 0, 60, [0.5, 0]); m.r(lx + 1, chy + 2, 1, FY + 10 - chy - 2, "#a8a69e"); } M(D.CHAIR); m.hl(chx - 11, chy + 16, 23, "#c8c6be");
    M(D.CHAIR, 0, 40, [-0.4, 0]); m.r(chx + 9, chy - 30, 3, 32, "#c4923f"); M(D.CHAIR, 0, 40, [0, -0.6]); m.r(chx - 13, chy - 1, 27, 3, "#c4923f"); M(D.CHAIR); m.dith(chx - 13, chy - 1, 27, 3, "#8a5e24", 0.5);
    for (let y = chy - 28; y < chy - 6; y += 3) { M(D.CHAIR, 0, 40, [0, -0.5]); m.r(chx + 6, y, 6, 2, "#d0a04c"); } M(D.CHAIR); m.dith(chx + 6, chy - 28, 6, 22, "#8a5e24", 0.4);
    M(D.CHAIR, 0, 0, [0, -0.8]); m.r(chx - 12, chy - 4, 22, 2, "#74863a"); M(D.CHAIR, 0, 0, [0, -0.2]); m.r(chx - 12, chy - 2, 22, 2, "#5a6a2c"); M(D.CHAIR); m.hl(chx - 12, chy - 1, 22, "#3e4a1e");

    // ---- bureau : plateau ciré, caisson à tiroirs
    M(D.DESK, 0, 40, [-0.4, 0]); m.r(dx0 + 3, dy + 4, 3, FY + 10 - dy - 4, "#4a2e1a"); m.vl(dx0 + 3, dy + 4, FY + 10 - dy - 4, "#7a5030");
    M(D.DESK, 0, 40); m.r(dx1 - 44, dy + 4, 42, FY + 8 - dy - 4, "#5e3a21"); M(D.DESK, 0, 40, [-0.6, 0]); m.vl(dx1 - 44, dy + 4, FY + 8 - dy - 4, "#8a5c38"); M(D.DESK, 0, 40, [0.6, 0]); m.vl(dx1 - 3, dy + 4, FY + 8 - dy - 4, "#3a2414");
    for (const y of [dy + 7, dy + 22]) { M(D.DESK, 0, 60); m.r(dx1 - 41, y, 36, 13, "#6e482a"); M(D.DESK, 0, 60, [0, -0.6]); m.hl(dx1 - 41, y, 36, "#96683f"); M(D.DESK, 0, 60, [0, 0.6]); m.hl(dx1 - 41, y + 12, 36, "#3a2414"); M(D.DESK, 0, 200); m.r(dx1 - 25, y + 5, 4, 2, "#e6c47a"); }
    M(D.DESK, 0, 170, [0, -0.85]); m.r(dx0, dy, dx1 - dx0, 2, "#a87a4a"); M(D.DESK, 0, 90, [0, -0.3]); m.r(dx0, dy + 2, dx1 - dx0, 2, "#7a5030"); M(D.DESK); m.hl(dx0, dy + 3, dx1 - dx0, "#3a2414"); m.r(dx0 + 6, dy + 4, dx1 - dx0 - 50, 3, "#4a2e1a");
    // objets du bureau
    const O = g.obj;
    M(D.OBJ, 0, 120, [-0.3, 0]); m.r(O.plante.x - 4, dy - 8, 8, 8, "#dedad2"); M(D.OBJ, 0, 120, [0, -0.6]); m.hl(O.plante.x - 4, dy - 8, 8, "#f6f3ec"); M(D.OBJ, 0, 120, [0.6, 0]); m.vl(O.plante.x + 3, dy - 7, 7, "#a8a49c"); M(D.OBJ); m.hl(O.plante.x - 3, dy - 9, 6, "#3a2a1c");
    M(D.OBJ, 0, 30, [0, -0.5]); m.ell(O.plante.x - 4, dy - 11, 4, 1.6, "#3f7a3f"); m.ell(O.plante.x + 4, dy - 12, 4, 1.6, "#4f9a4f"); M(D.OBJ); m.line(O.plante.x, dy - 9, O.plante.x + 1, dy - 34, "#3a5a2c");
    M(D.OBJ, 0, 160, [0, -0.4]); m.r(O.tel.x, dy - 5, 13, 5, "#1e1e22"); m.hl(O.tel.x, dy - 5, 13, "#44444c"); m.r(O.tel.x + 1, dy - 8, 11, 3, "#26262c"); m.r(O.tel.x, dy - 9, 3, 3, "#33333a"); m.r(O.tel.x + 10, dy - 9, 3, 3, "#33333a"); M(D.OBJ); for (let i = 0; i < 3; i++) m.px(O.tel.x + 4 + i * 2, dy - 3, "#7a7a82");
    for (let k = 0; k < 4; k++) { const c = ["#d8ccb4", "#c8443a", "#e6dcc6", "#5a86b0"][k]; M(D.OBJ, 0, 20, [0, -0.7]); m.r(O.pile.x - (k & 1), dy - 2 - k * 2, 20, 1, c); M(D.OBJ); m.r(O.pile.x - (k & 1), dy - 1 - k * 2, 20, 1, sh(c, -30)); }
    M(D.OBJ, 0, 60); m.r(O.tampon.x - 2, dy - 2, 9, 2, "#2a2a30"); m.r(O.tampon.x - 1, dy - 2, 7, 1, "#a02630");
    for (let i = 0; i < 6; i++) { m.set({ D: D.OBJ, E: 0, S: 70, n: [(i / 5 - 0.5) * 1.2, 0] }); m.vl(O.code.x + i, dy - 15, 15, i === 0 ? "#d8443a" : i === 5 ? "#7a1612" : "#b3261e"); } M(D.OBJ, 0, 120); m.r(O.code.x, dy - 11, 6, 3, "#f2ecdc"); m.hl(O.code.x + 1, dy - 10, 4, "#b3261e");
    for (let i = 0; i < 6; i++) { m.set({ D: D.OBJ, E: 0, S: 190, n: [(i / 5 - 0.5) * 1.4, 0] }); m.vl(O.tasse.x + i, dy - 6, 6, i > 4 ? "#b8b2a4" : "#efeade"); } M(D.OBJ, 0, 190); m.hl(O.tasse.x, dy - 6, 6, "#3a2414"); m.px(O.tasse.x + 6, dy - 4, "#e9e4d8"); m.px(O.tasse.x + 7, dy - 3, "#e9e4d8"); m.px(O.tasse.x + 6, dy - 2, "#e9e4d8"); m.r(O.tasse.x + 1, dy - 3, 3, 1, "#27407a");
    M(D.OBJ, 0, 220, [0, -0.6]); m.r(O.laser.x, dy - 2, 8, 2, "#8a8d94"); m.hl(O.laser.x, dy - 2, 8, "#d8dce4"); M(D.OBJ); m.px(O.laser.x + 8, dy - 2, "#d8343a"); m.px(O.laser.x + 3, dy - 3, "#3a3d42");
    const lx = O.lampe.x; M(D.OBJ, 0, 230, [0, -0.6]); m.r(lx - 5, dy - 2, 11, 2, "#c9a24a"); m.hl(lx - 5, dy - 2, 11, "#f0d68a"); M(D.OBJ, 0, 230, [-0.5, 0]); m.r(lx, dy - 14, 1, 12, "#c9a24a"); M(D.OBJ, 0, 230); m.r(lx - 1, dy - 15, 3, 1, "#f0d68a");
    for (let j = 0; j < 6; j++) { const hw = 6 + j; for (let x = -hw; x <= hw; x++) { m.set({ D: D.OBJ, E: st.lampe ? 150 : 0, S: 200, n: [x / (hw + 1) * 0.9, -0.3] }); m.px(lx + x, dy - 21 + j, st.lampe ? (j < 2 ? "#3fae7a" : j < 4 ? "#2f9a66" : "#57c890") : j < 2 ? "#2a6a4a" : "#1f5a3e"); } }
    if (st.lampe) { M(D.OBJ, 255); m.r(lx - 9, dy - 15, 19, 1, "#fff2c4"); }
    // corbeille
    const bn = g.bin; for (let y = 0; y < bn.h; y++) { const ins = Math.round(y / bn.h * 2); for (let x = ins; x < bn.w - ins; x++) { m.set({ D: D.DESK + 4, E: 0, S: 90, n: [(x / bn.w - 0.5) * 1.4, 0] }); m.px(bn.x + x, bn.y + y, (x + y) % 2 ? "#3f424a" : "#23262c"); } } M(D.DESK + 4, 0, 160, [0, -0.6]); m.r(bn.x - 1, bn.y, bn.w + 2, 1, "#7a7d86");
    // premier plan : fougère, en bas à droite
    const fr = rng(12); for (let k = 0; k < 9; k++) { const a = -2.6 + k * 0.26, len = 26 + fr() * 20; for (let i = 0; i < len; i++) { const x = W - 8 + Math.cos(a) * i, y = H + 4 + Math.sin(a) * i + i * i * 0.008; M(D.FG, 0, 0, [0, -0.4]); m.px(x, y, "#16302a"); if (i % 3 === 0 && i > 5) { m.px(x - 1, y - 1, "#1e3e34"); m.px(x + 1, y + 1, "#1e3e34"); m.px(x - 2, y - 1, "#102420"); } } }
  }

  function lights(g, ph, st, OXL) {
    const L = [], O = g.obj, n = ph === "nuit" ? 1 : ph === "soir" ? 0.8 : 0.3, mid = (g.wx0 + g.wx1) / 2;
    const cw = ph === "jour" ? [1, 0.97, 0.9] : ph === "soir" ? [1, 0.62, 0.48] : [0.36, 0.5, 0.9];
    if (st.lampe) L.push({ x: O.lampe.x, y: g.dy - 12, d: D.OBJ - 8, r: 200, c: [1, 0.74, 0.4], i: 2.6 * (0.45 + n * 0.55), wrap: 0.35, haze: 0.3 * n, hr: 34 }, { x: O.lampe.x - 6, y: g.dy - 34, d: D.WALL - 26, r: 150, c: [1, 0.76, 0.44], i: 1.25 * n, wrap: 0.6 }, { x: O.lampe.x + 10, y: g.FY + 6, d: 90, r: 110, c: [1, 0.78, 0.5], i: 0.7 * n, wrap: 0.5 }, { x: O.lampe.x - 28, y: g.dy - 46, d: 40, r: 320, c: [1, 0.78, 0.5], i: 0.42 * n, wrap: 0.7 });
    L.push({ x: mid, y: g.wy1 - 34, d: D.WALL - 14, r: 260, c: cw, i: ph === "jour" ? 1.1 : 0.62, wrap: 0.7, haze: ph === "jour" ? 0.03 : 0.05, hr: 60 }, { x: mid, y: g.FY + 22, d: 110, r: 150, c: cw, i: ph === "jour" ? 0.55 : 0.36, wrap: 0.5 }, { x: g.W + 30, y: 50, d: -60, r: 520, c: [0.5, 0.6, 1], i: 0.2 + (ph === "jour" ? 0.25 : 0), wrap: 0.7 });
    if (st.radio && g.radio) L.push({ x: g.radio.x + 16, y: g.radio.y + 6, d: D.FURN - 8, r: 34, c: [1, 0.7, 0.3], i: 1.1, wrap: 0.7, haze: 0.14, hr: 10 });
    return L;
  }

  // ------------------------------------------------------------------ la scène
  function Scene2(W, H, panel) {
    const ax = panel ? Math.round(panel + (W - panel) / 2) : Math.round(W / 2), FY = H - 62;
    const wy1 = FY - 70, wy0 = Math.max(18, wy1 - 92), wx0 = ax - 64, wx1 = ax + 60, dy = FY - 38, dx0 = ax - 58, dx1 = ax + 62;
    const g = { W, H, ax, FY, wx0, wx1, wy0, wy1, dx0, dx1, dy, glass: new Uint8Array(W * H), chaise: { x: Math.min(W - 16, ax + 92), y: FY - 23 }, bin: { x: ax - 80, y: FY - 4, w: 13, h: 15 },
      obj: { plante: { x: ax - 48 }, tel: { x: ax - 37 }, pile: { x: ax - 18 }, tampon: { x: ax + 8 }, code: { x: ax + 20 }, tasse: { x: ax + 30 }, laser: { x: ax + 40 }, lampe: { x: ax + 52 } } };
    const stat = new G.Mat(W, H), m = new G.Mat(W, H), now = new Date(), S = { W, H, mat: m, G: g };
    const st = { lampe: true, radio: false, laser: false, cadre: 0, livres: [], sips: 0, flash: 0, sparkle: 0, robe: 0, spin: 0, petals: [], notes: [], steam: 0, ring: 0, nextRing: 14 + Math.random() * 20, bulle: null, score: null, typed: "" };
    let ph = A0.phaseOf(now), saison = A0.seasonOf(now), pluie = (now.getDate() * 7 + now.getMonth() * 3) % 5 < 3 || ph === "nuit", V = null, fixes = [];
    const EW = wx1 - wx0 + 14, EH = wy1 - wy0;
    const monde = { x0: Math.max(panel ? panel - 30 : 12, 12), x1: W - 14, sol: FY + 10, chaise: g.chaise, appui: { x0: wx0 + 12, x1: wx1 - 12, y: wy1 + 4 }, plante: { x: g.obj.plante.x }, perches: [{ id: "bureau", x: g.obj.pile.x + 34, y: dy, app: dx0 - 14 }], pluie };
    const cat = TM.create(monde);
    const birds = [0, 1, 2].map((i) => ({ hx: wx0 + 18 + i * 38 + (i === 1 ? 12 : 0), x: 0, y: 0, fly: 0, vx: 0, vy: 0, back: 0, i }));
    for (const b of birds) { b.x = b.hx; b.y = wy1 - 1; }
    const ball = { x: 0, y: 0, vx: 0, vy: 0, rest: true, home: true, held: false, t: 0 };
    const homeBall = () => { ball.x = g.obj.pile.x + 24; ball.y = dy - 2; ball.vx = ball.vy = 0; ball.rest = true; ball.home = true; ball.held = false; };
    homeBall();
    const jeu = { on: false, t: 0, feuilles: [], n: 0, slam: 0, next: 0, serie: 0 };
    const best = mem.get();
    const rebuild = () => { stat.c.fill(0); stat.a.fill(0); stat.G = 0; piece(stat, g, ph, st); fixes = lights(g, ph, st); };
    V = A0.ville(EW, EH, ph, pluie); rebuild();
    const inp = { mouse: null, moved: false, click: false, down: false, used: false, laser: false, ball: null, caught: null, orage: false };
    let lastT = 0, lastMin = -1;
    const pop = (txt, x, y) => { st.score = { txt, x, y, t: 0 }; };
    const hit = (o, x, y) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h;
    const zones = () => { const O = g.obj; return [
      ["laser", { x: O.laser.x - 1, y: dy - 5, w: 11, h: 5 }], ["lampe", { x: O.lampe.x - 11, y: dy - 22, w: 23, h: 22 }], ["tel", { x: O.tel.x - 1, y: dy - 10, w: 15, h: 10 }], ["tampon", { x: O.tampon.x - 3, y: dy - 12, w: 11, h: 12 }], ["code", { x: O.code.x - 1, y: dy - 16, w: 8, h: 16 }],
      ["tasse", { x: O.tasse.x - 1, y: dy - 8, w: 9, h: 8 }], ["plante", { x: O.plante.x - 6, y: dy - 36, w: 14, h: 28 }],
      ["radio", g.radio], ["horloge", { x: g.horloge.x - 10, y: g.horloge.y - 10, w: 20, h: 20 }], ["cadre", { x: g.cadre.x - 2, y: g.cadre.y - 2, w: g.cadre.w + 4, h: g.cadre.h + 4 }], ["robe", { x: g.patere.x - 12, y: g.patere.y, w: 24, h: 80 }],
      ["tour", { x: wx0 + V.tx - 7 - 12, y: wy0 + V.ty - 4, w: 26, h: V.th + 6 }], ["ciel", { x: wx0, y: wy0, w: wx1 - wx0, h: Math.round((wy1 - wy0) * 0.5) }], ["livres", { x: ax - 150, y: wy0, w: 70, h: FY - wy0 - 40 }],
    ].filter((z) => z[1]); };
    S.cursorAt = (x, y) => { if (jeu.on) return "crosshair"; if (st.laser) return "none"; if (Math.hypot(x - ball.x, y - ball.y) < 6) return "grab"; if (Math.hypot(x - cat.x, y - (cat.y - 12)) < 15) return "pointer"; for (const [k, z] of zones()) if (k !== "ciel" && k !== "livres" && hit(z, x, y)) return "pointer"; return "default"; };
    S.quiz = null;
    S.start = (k) => { if (jeu.on) return; if (k === "boulette") { st.laser = false; homeBall(); pop("TIREZ LA BOULETTE PUIS LACHEZ", ball.x, ball.y - 22); } else if (k === "laser") { if (!st.laser) act("laser"); } else { st.laser = false; act(k); } };
    S.key = (ch) => { st.typed = (st.typed + ch).slice(-5); if (st.typed === "miaou") { for (let i = 0; i < 14; i++) cat.fx.push({ k: "coeur", x: cat.x + (Math.random() - 0.5) * 40, y: cat.y - 14 - Math.random() * 20, t: -Math.random() }); cat.fx.push({ k: "mot", txt: "MIAOU !", x: cat.x, y: cat.y - 36, t: 0 }); cat.miaou = cat.t + 1; st.typed = ""; } };
    S.down = (x, y) => { inp.down = true; if (!jeu.on && Math.hypot(x - ball.x, y - ball.y) < 7 && ball.rest) { ball.held = true; ball.gx = ball.x; ball.gy = ball.y; ball.home = false; } };
    S.up = (x, y) => { inp.down = false; if (ball.held) { ball.held = false; const dx = ball.gx - x, dyy = ball.gy - y; if (Math.hypot(dx, dyy) > 4) { ball.vx = cl(dx * 6, -260, 260); ball.vy = cl(dyy * 6, -300, 200); ball.rest = false; ball.t = 0; ball.justThrown = true; } else homeBall(); } };
    S.click = (x, y) => {
      if (ball.justThrown) { ball.justThrown = false; return; }
      if (jeu.on) { jeu.slam = 0.16; son("tampon"); const xs = g.obj.tampon.x + 2; const f = jeu.feuilles.find((q) => !q.ok && Math.abs(q.x + 5 - xs) < 6); if (f) { f.ok = true; jeu.n++; jeu.serie++; pop(jeu.serie > 2 ? "SERIE " + jeu.serie : "VISE", xs, dy - 22); } else { jeu.serie = 0; pop("RATE", xs, dy - 22); } return; }
      inp.click = true; inp.cx = x; inp.cy = y;
    };
    const act = (k) => {
      const O = g.obj;
      if (k === "lampe") { st.lampe = !st.lampe; son("clic"); rebuild(); }
      else if (k === "tel") { if (st.ring > 0) { st.ring = 0; son("decroche"); const L = [["PERMANENCE GARDE A VUE", "COMMISSARIAT DU 18E"], ["MAITRE ? C'EST POUR", "UNE COMPARUTION IMMEDIATE"], ["C'EST MAMAN.", "TU MANGES BIEN ?"], ["LE GREFFE : RENVOI", "A QUINZAINE"], ["ERREUR DE NUMERO", "DESOLE"], ["LE BATONNIER VOUS", "FELICITE. OU PAS."]]; st.bulle = { l: L[Math.floor(Math.random() * L.length)], x: O.tel.x + 6, y: dy - 16, t: 0 }; } else { st.bulle = { l: ["TUUUT... TUUUT..."], x: O.tel.x + 6, y: dy - 16, t: 2.2 }; son("raccroche"); } }
      else if (k === "radio") { st.radio = !st.radio; son("radio"); rebuild(); }
      else if (k === "tasse") { st.sips++; st.steam = 1.2; pop(st.sips % 6 === 0 ? "VIDE. ENCORE UN." : "GLOU", O.tasse.x + 3, dy - 16); }
      else if (k === "horloge") { st.spin = 1.2; son("horloge"); }
      else if (k === "cadre") { st.cadre = st.cadre ? 0 : (Math.random() < 0.5 ? 1 : -1); son("clic"); }
      else if (k === "robe") { st.robe = 1.6; }
      else if (k === "tour") { st.sparkle = 8; }
      else if (k === "ciel") { st.flash = 0.5; son("lointain"); inp.orage = true; }
      else if (k === "livres") { if (st.livres.length < 4) { st.livres.push({ x: ax - 144 + Math.random() * 54, y: wy0 + 30 + Math.random() * 40, vy: 0, c: ["#b3261e", "#27407a", "#3e5c3a"][st.livres.length % 3], rest: false, r: 0 }); son("papier"); } }
      else if (k === "plante") { st.petals.push({ x: O.plante.x + 2, y: dy - 30, t: 0 }); }
      else if (k === "laser") { st.laser = !st.laser; son("clic"); if (st.laser) pop("POINTEUR ALLUME", O.laser.x + 4, dy - 14); }
      else if (k === "tampon") { jeu.on = true; jeu.t = 24; jeu.feuilles = []; jeu.n = 0; jeu.next = 0.4; jeu.serie = 0; pop("TAMPONNEZ !", O.tampon.x, dy - 26); }
      else if (k === "code") { S.quiz && S.quiz(A0.question()); son("page"); }
    };
    const SET = (d, e, s, n) => m.set({ D: d, E: e || 0, S: s || 0, n: n || [0, 0] });

    S.frame = function (t, mouse, reduce) {
      const dt = reduce ? 0 : Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
      const d = new Date(); if (d.getMinutes() !== lastMin) { lastMin = d.getMinutes(); const p2 = A0.phaseOf(d); if (p2 !== ph) { ph = p2; V = A0.ville(EW, EH, ph, pluie); rebuild(); } }
      m.copy(stat); m.G = 0;
      const dyn = [], O = g.obj, on = ph !== "jour", Mo = mouse;
      inp.moved = !!(Mo && inp.mouse && (Math.abs(Mo.x - inp.mouse.x) + Math.abs(Mo.y - inp.mouse.y)) > 0.4); inp.mouse = Mo;
      // ---- la ville derrière les vitres : parallaxe selon la souris, puis ce qui bouge dehors
      const par = Mo ? Math.round((Mo.x - W / 2) / W * -6) : 0, ex0 = 7 + par, EV = ph === "jour" ? 92 : ph === "soir" ? 135 : 185;
      const flash = st.flash > 0 ? (st.flash > 0.42 || (st.flash < 0.3 && st.flash > 0.24) ? 1 : 0.15) : 0; st.flash = Math.max(0, st.flash - dt);
      for (let y = 0; y < EH; y++) for (let x = 0; x < wx1 - wx0; x++) { const q = (wy0 + y) * W + wx0 + x; if (!g.glass[q]) continue; const e = (y * EW + cl(x + ex0, 0, EW - 1)) * 3, j = q * 4; m.c[j] = Math.min(255, V.E.c[e] + flash * 150); m.c[j + 1] = Math.min(255, V.E.c[e + 1] + flash * 160); m.c[j + 2] = Math.min(255, V.E.c[e + 2] + flash * 190); m.c[j + 3] = EV; }
      const gl = (x, y, c, a, e) => { x = Math.round(x); y = Math.round(y); if (x < wx0 || x >= wx1 || y < wy0 || y >= wy1) return; const q = y * W + x; if (!g.glass[q]) return; const cc = typeof c === "string" ? rgb(c) : c, k = a == null ? 1 : a, j = q * 4; m.c[j] += (cc[0] - m.c[j]) * k; m.c[j + 1] += (cc[1] - m.c[j + 1]) * k; m.c[j + 2] += (cc[2] - m.c[j + 2]) * k; if (e) m.c[j + 3] = Math.max(m.c[j + 3], e * k); };
      const tX = wx0 + V.tx - ex0, tY = wy0 + V.ty;
      if (on) {
        const heure = d.getMinutes() < 5 && ph === "nuit"; st.sparkle = Math.max(0, st.sparkle - dt);
        if (heure || st.sparkle > 0) for (let i = 0; i < 26; i++) { const u = h01(i * 3.3 + Math.floor(t * 9) * 1.7), yy = Math.round(u * V.th), hw = 0.6 + Math.pow(u, 2.3) * 9.5; gl(tX + (h01(i * 7.1 + Math.floor(t * 9)) - 0.5) * 2 * hw, tY + yy, "#ffffff", 1, 255); }
        const a = t * 0.9, bx2 = Math.cos(a), len = 46; if (Math.abs(bx2) > 0.15) for (let i = 2; i < len; i++) gl(tX + bx2 * i, tY - 4 - Math.abs(Math.sin(a)) * i * 0.12, "#fff6d0", 0.34 * (1 - i / len), 230);
        if ((t % 2.2) < 1.1) gl(tX, tY - 6, "#ff4a3a", 1, 255);
        const px = wx0 + ((t * 7) % (wx1 - wx0 + 60)) - 30; if (Math.floor(t * 2) % 2) gl(px, wy0 + 16 + Math.sin(t * 0.2) * 4, "#ff5a4a", 1, 255); gl(px + 2, wy0 + 16 + Math.sin(t * 0.2) * 4, "#e8eeff", 0.8, 255);
        if (Math.floor(t * 1.4) % 3) for (let i = 0; i < 12; i++) gl(wx0 + Math.round(EW * 0.5) - ex0 - 1 + i, wy0 + V.HZ - 3 + 2, "#ff5a4a", 0.25, 220);
      }
      for (const b of birds) {
        if (!b.fly && Mo && Math.hypot(Mo.x - b.x, Mo.y - b.y) < 20) { b.fly = 1; b.vx = (b.x < Mo.x ? -1 : 1) * (36 + b.i * 6); b.vy = -40 - b.i * 5; b.back = t + 12 + b.i * 3; }
        if (b.fly === 1) { b.x += b.vx * dt; b.y += b.vy * dt; if (t > b.back) { b.fly = 2; b.x = b.hx + (b.i % 2 ? 60 : -60); b.y = wy0 - 4; } }
        else if (b.fly === 2) { const ddx = b.hx - b.x, ddy = wy1 - 1 - b.y, dd = Math.hypot(ddx, ddy); if (dd < 2) { b.fly = 0; b.x = b.hx; b.y = wy1 - 1; } else { b.x += ddx / dd * 50 * dt; b.y += ddy / dd * 50 * dt; } }
        const c = ["#8a8f9a", "#6f7480", "#a8a2a0"][b.i], x = Math.round(b.x), y = Math.round(b.y);
        if (!b.fly) { const peck = Math.sin(t * 1.7 + b.i * 2.1 + Math.sin(t * 0.37 + b.i) * 2) > 0.86; for (let i = -2; i < 2; i++) { gl(x + i, y - 1, c); gl(x + i, y - 2, c); } gl(x + (peck ? 2 : 1), y - (peck ? 1 : 3), sh(c, 24)); gl(x + (peck ? 3 : 2), y - (peck ? 1 : 3), "#d98a3a"); gl(x - 3, y - 1, sh(c, -24)); }
        else { const up = Math.floor(t * 9 + b.i) % 2; for (let i = -1; i < 2; i++) gl(x + i, y, c); gl(x + 2, y, sh(c, 24)); if (up) { gl(x - 1, y - 1, sh(c, 30)); gl(x, y - 2, sh(c, 30)); gl(x + 1, y - 1, sh(c, 30)); } else { gl(x - 1, y + 1, sh(c, -20)); gl(x + 1, y + 1, sh(c, -20)); } }
      }
      if (pluie) {
        const neige = saison === "hiver";
        for (let i = 0; i < 70; i++) { const sp = neige ? 14 + h01(i) * 10 : 120 + h01(i * 1.3) * 50, x0 = wx0 + h01(i * 7.7) * (wx1 - wx0 + 30), y = wy0 + ((h01(i * 3.1) * EH + t * sp) % EH), x = x0 - (y - wy0) * (neige ? Math.sin(t + i) * 0.1 : 0.22); if (neige) gl(x, y, "#ffffff", 0.85); else for (let k = 0; k < 3; k++) gl(x - k * 0.22, y + k, "#b8c8e0", 0.32); }
        if (!neige) for (let i = 0; i < 9; i++) { const T0 = 5 + h01(i * 2.7) * 6, u = ((t + h01(i * 5.1) * T0) % T0) / T0, x = wx0 + 6 + h01(i * 9.9) * (wx1 - wx0 - 12) + Math.sin(u * 14 + i) * 1.2, y = wy0 + u * u * EH; gl(x, y, "#dfeaff", 0.7); gl(x, y - 1, "#b8c8e0", 0.35); gl(x, y - 2, "#b8c8e0", 0.2); }
      }
      if (st.lampe && on) for (let i = -6; i <= 6; i++) for (let j = 0; j < 4; j++) gl(O.lampe.x + i - par, wy1 - 20 + j, j < 2 ? "#57c890" : "#fff2c4", 0.14);

      // ---- le mur : horloge à l'heure, cadre, patère et robe, radio
      const hg = g.horloge; SET(D.WALL - 2, 0, 200); m.orb(hg.x, hg.y, hg.r, hg.r, "#c9a24a", 0.8); SET(D.WALL - 2, 20, 60); m.ell(hg.x, hg.y, hg.r - 1.6, hg.r - 1.6, "#efe8d6"); for (let k = 0; k < 12; k++) m.px(hg.x + Math.sin(k * Math.PI / 6) * (hg.r - 3), hg.y - Math.cos(k * Math.PI / 6) * (hg.r - 3), "#5a4a3a");
      st.spin = Math.max(0, st.spin - dt); const spin = st.spin > 0 ? (1.2 - st.spin) * 10 : 0, am = (d.getMinutes() + d.getSeconds() / 60) / 60 * 6.283 + spin * 6, ah = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * 6.283 + spin;
      m.line(hg.x, hg.y, hg.x + Math.sin(ah) * (hg.r - 5), hg.y - Math.cos(ah) * (hg.r - 5), "#1d1d22"); m.line(hg.x, hg.y, hg.x + Math.sin(am) * (hg.r - 3), hg.y - Math.cos(am) * (hg.r - 3), "#1d1d22"); const as = d.getSeconds() / 60 * 6.283; m.px(hg.x + Math.sin(as) * (hg.r - 3), hg.y - Math.cos(as) * (hg.r - 3), "#c8323a"); m.px(hg.x, hg.y, "#c8323a");
      const cd = g.cadre; SET(D.WALL - 2, 0, 90); for (let y = 0; y < cd.h; y++) for (let x = 0; x < cd.w; x++) { const yy = cd.y + y + Math.round((x - cd.w / 2) * 0.12 * st.cadre), bord = x < 2 || y < 2 || x >= cd.w - 2 || y >= cd.h - 2; m.px(cd.x + x, yy, bord ? (x < 1 || y < 1 ? "#f0d68a" : "#b8924a") : y === 5 && x > 6 && x < cd.w - 7 ? "#3a3a44" : (y === 9 || y === 12 || y === 15) && x > 4 && x < cd.w - 5 - (y === 15 ? 8 : 0) ? "#a8a290" : "#efe8d6"); } m.ell(cd.x + cd.w - 7, cd.y + cd.h - 6 + Math.round((cd.w / 2 - 7) * 0.12 * st.cadre), 2, 2, "#b3261e");
      st.robe = Math.max(0, st.robe - dt); const pt = g.patere, sw = Math.sin(t * 7) * st.robe * 1.6;
      SET(D.CHAIR + 8, 0, 40, [-0.4, 0]); m.r(pt.x, pt.y, 2, FY + 10 - pt.y, "#3a2618"); m.vl(pt.x, pt.y, FY + 10 - pt.y, "#6a4a30"); SET(D.CHAIR + 8); m.r(pt.x - 6, FY + 8, 14, 2, "#241710"); m.r(pt.x - 5, pt.y + 2, 12, 1, "#6a4a30"); m.px(pt.x - 6, pt.y + 1, "#6a4a30"); m.px(pt.x + 7, pt.y + 1, "#6a4a30");
      for (let y = 0; y < 62; y++) { const w = 5 + Math.min(6, y * 0.3) + (y > 40 ? (y - 40) * 0.08 : 0), ox = Math.round(sw * (y / 62)); for (let x = -Math.round(w); x <= Math.round(w); x++) { const f = Math.sin(x * 1.1 + y * 0.08); m.set({ D: D.CHAIR + 6, E: 0, S: 20, n: [Math.cos(x * 1.1 + y * 0.08) * 0.55, 0] }); m.px(pt.x + x + ox, pt.y + 4 + y, f > 0.6 ? "#3a3a46" : f < -0.6 ? "#16161c" : "#26262e"); } SET(D.CHAIR + 6); if (y > 3 && y < 22) { m.px(pt.x - 1 + ox, pt.y + 4 + y, "#efe8d6"); m.px(pt.x + ox, pt.y + 4 + y, "#efe8d6"); m.px(pt.x + 1 + ox, pt.y + 4 + y, "#c8c2b2"); } if (y > 8 && y < 44) { m.px(pt.x - 5 + ox, pt.y + 4 + y, "#1a1a20"); if (y > 36) m.px(pt.x - 5 + ox, pt.y + 4 + y, "#efe8d6"); } }
      if (g.radio) { const r = g.radio; SET(D.FURN - 2, 0, 60); m.r(r.x, r.y, r.w, r.h, "#7a4a2a"); SET(D.FURN - 2, 0, 60, [0, -0.6]); m.hl(r.x, r.y, r.w, "#b07a48"); SET(D.FURN - 2); m.r(r.x + 2, r.y + 3, 10, 7, "#3a2a1c"); m.dith(r.x + 2, r.y + 3, 10, 7, "#5a4028", 0.5); SET(D.FURN - 2, st.radio ? 255 : 0); m.r(r.x + 14, r.y + 3, 8, 4, st.radio ? "#ffd27a" : "#a89a70"); SET(D.FURN - 2); m.px(r.x + 15 + Math.round((Math.sin(t * 0.3) + 1) * 3), r.y + 4, "#c8323a"); m.px(r.x + 16, r.y + 9, "#d8d0c0"); m.px(r.x + 20, r.y + 9, "#d8d0c0"); SET(D.FURN - 2, 0, 200); m.r(r.x + r.w - 2, r.y - 9, 1, 9, "#9a9aa2");
        if (st.radio && Math.random() < dt * 2.2) st.notes.push({ x: r.x + 6 + Math.random() * 10, y: r.y - 2, t: 0, k: Math.random() < 0.5 }); }
      for (const n of st.notes) { n.t += dt; const x = Math.round(n.x + Math.sin(n.t * 3) * 3), y = Math.round(n.y - n.t * 9), a = 1 - n.t / 2.4, c = n.k ? "#ffd27a" : "#9fd0ff"; SET(60, 255); m.px(x, y, c, a); m.px(x, y - 1, c, a); m.px(x, y - 2, c, a); m.px(x + 1, y - 2, c, a); m.px(x - 1, y + 1, c, a); m.px(x, y + 1, c, a); } st.notes = st.notes.filter((n) => n.t < 2.4);
      for (const b of st.livres) { if (!b.rest) { b.vy += 300 * dt; b.y += b.vy * dt; b.r += dt * 6; if (b.y > FY + 12) { b.y = FY + 12; b.rest = true; son("papier"); } } SET(D.DESK + 20, 0, 40, [0, -0.5]); if (b.rest) { m.r(b.x - 4, b.y - 2, 9, 3, b.c); m.hl(b.x - 4, b.y - 2, 9, sh(b.c, 30)); m.hl(b.x - 3, b.y, 7, "#efe8d6"); } else m.r(b.x - 2, b.y - 5, 4, 9, b.c); }

      // ---- Timon sur l'appui : il passe derrière le bureau et ses objets
      if (reduce) { /* image fixe : le chat ne bouge pas */ } else { monde.pluie = pluie; TM.update(cat, dt, monde, inp); }
      inp.orage = false;
      const catD = cat.on === "appui" ? D.WALL - 6 : cat.on === "chaise" ? D.CHAIR - 3 : cat.on === "bureau" ? D.OBJ - 6 : Math.round(D.WALL * (1 - cl((cat.y - FY) / (H - FY), 0, 1))) - 4;
      const drawCat = () => { m.set({ D: Math.max(D.FG + 6, catD), E: 0, S: 0, n: [0, 0] }); m.G = cat.on === "appui" && cat.st !== "saut" ? D.DESK + 6 : D.FG + 2; TM.draw(m, cat, 40); m.G = 0; };
      if (cat.on === "appui" && cat.st !== "saut") drawCat();

      // ---- le bureau : orchidée, téléphone, vapeur, tampon
      SET(D.OBJ, 0, 20);
      const fl = [[0, -34], [2, -31], [-2, -29], [2, -26], [-1, -23]]; for (let i = 0; i < fl.length; i++) { const fx = O.plante.x + 1 + fl[i][0] + Math.round(Math.sin(t * 0.8 + i) * 0.3), fy = dy + fl[i][1]; m.px(fx, fy, "#f6d8ea"); m.px(fx - 1, fy, "#e8a8d0"); m.px(fx + 1, fy, "#f6d8ea"); m.px(fx, fy - 1, "#f6d8ea"); m.px(fx, fy + 1, "#e8a8d0"); m.px(fx, fy, "#c8327a"); }
      for (const p of st.petals) { p.t += dt; m.px(p.x + Math.sin(p.t * 4) * 3, Math.min(dy - 1, p.y + p.t * 14), "#f6d8ea"); } st.petals = st.petals.filter((p) => p.t < 6);
      st.nextRing -= dt; if (st.nextRing < 0 && st.ring <= 0) { st.ring = 6; st.nextRing = 40 + Math.random() * 40; }
      if (st.ring > 0) { st.ring -= dt; const k = Math.floor(t * 14) % 2, burst = (st.ring % 2) > 0.8; if (burst) { if (Math.floor(t * 3) !== st.lastDring) { st.lastDring = Math.floor(t * 3); son("dring"); } SET(D.OBJ, 255); m.r(O.tel.x + 4, dy - 4, 5, 2, k ? "#9fe0ff" : "#4a9ad8"); for (const s of [-1, 1]) { m.px(O.tel.x + 6 + s * 9, dy - 10 - k, "#fff2c4"); m.px(O.tel.x + 6 + s * 11, dy - 12 + k, "#fff2c4"); m.px(O.tel.x + 6 + s * 10, dy - 7, "#fff2c4"); } dyn.push({ x: O.tel.x + 6, y: dy - 6, d: D.OBJ - 10, r: 44, c: [0.5, 0.8, 1], i: 1.3, wrap: 0.6, haze: 0.2, hr: 12 }); if (cat.st === "dodo" || cat.st === "boule" || cat.st === "flanc") { cat.plan = []; cat.st = cat.on === "sol" ? "assis" : "miche"; cat.fl = {}; cat.until = cat.t + 5; } } }
      st.steam = Math.max(0, st.steam - dt); SET(D.OBJ - 2, 60); for (let i = 0; i < 3; i++) { const u = ((t * 0.5 + i * 0.33) % 1), x = O.tasse.x + 2 + Math.sin(u * 6 + i * 2) * 1.4, y = dy - 8 - u * (9 + st.steam * 6); m.px(x, y, "#e8eef8", (1 - u) * (0.3 + st.steam * 0.4)); }
      const tsx = O.tampon.x + 2;
      if (jeu.on) {
        jeu.t -= dt; jeu.next -= dt; jeu.slam = Math.max(0, jeu.slam - dt);
        if (jeu.next < 0) { jeu.feuilles.push({ x: dx0 + 4, ok: false, v: 34 + Math.min(26, jeu.n * 2) }); jeu.next = Math.max(0.55, 1.15 - jeu.n * 0.03); }
        SET(D.OBJ - 1, 0, 20, [0, -0.7]);
        for (const f of jeu.feuilles) { f.x += f.v * dt; m.r(f.x, dy - 1, 11, 2, "#f6f2e7"); m.r(f.x + 1, dy - 2, 11, 1, "#fffdf6"); m.r(f.x + 2, dy - 2, 5, 1, "#b8b2a4"); if (f.ok) m.r(f.x + 6, dy - 2, 4, 2, "#c8323a"); }
        jeu.feuilles = jeu.feuilles.filter((f) => f.x < dx1 - 12);
        const up = jeu.slam > 0 ? 0 : 7; SET(D.OBJ - 2, 0, 60); m.r(tsx - 2, dy - 4 - up, 5, 3, "#6a4428"); m.r(tsx - 1, dy - 8 - up, 3, 4, "#8a5c38"); m.r(tsx - 2, dy - 10 - up, 5, 2, "#a87a4a"); m.r(tsx - 2, dy - 1 - up, 5, 1, "#a02630");
        SET(40, 255); m.r(dx0, dy + 6, Math.round((dx1 - dx0 - 48) * Math.max(0, jeu.t) / 24), 1, "#f2b45a"); m.txt(String(jeu.n), tsx - 2, dy - 30, "#f6c96d");
        if (jeu.t <= 0) { jeu.on = false; pop(jeu.n + " DOSSIERS VISES", ax, dy - 30); if (jeu.n > (best.tampon || 0)) { best.tampon = jeu.n; mem.set(best); st.record = 3; } }
      } else { SET(D.OBJ, 0, 60); m.r(tsx - 2, dy - 5, 5, 3, "#6a4428"); m.r(tsx - 1, dy - 9, 3, 4, "#8a5c38"); SET(D.OBJ, 0, 60, [0, -0.6]); m.r(tsx - 2, dy - 11, 5, 2, "#b88a58"); }

      // ---- la boulette, les clics
      inp.used = false; inp.laser = st.laser; inp.ball = !ball.home && !ball.held ? ball : null; inp.caught = null;
      if (ball.held && Mo) { const dx = Mo.x - ball.gx, dyy = Mo.y - ball.gy, dd = Math.hypot(dx, dyy), k = dd > 24 ? 24 / dd : 1; ball.x = ball.gx + dx * k; ball.y = ball.gy + dyy * k; SET(30, 255); for (let i = 1; i < 6; i++) m.px(ball.gx - dx * k * i * 0.5, ball.gy - dyy * k * i * 0.5 + i * i * 0.9, "#f6c96d", 0.9 - i * 0.12); }
      else if (!ball.rest) {
        ball.t += dt; ball.vy += 300 * dt; const py = ball.y; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        const bn = g.bin; if (ball.vy > 0 && py <= bn.y && ball.y >= bn.y && ball.x > bn.x && ball.x < bn.x + bn.w) { best.paniers = (best.paniers || 0) + 1; mem.set(best); pop("PANIER ! " + best.paniers, bn.x + 6, bn.y - 12); son("bien"); homeBall(); }
        else { if (ball.x < monde.x0 - 20) { ball.x = monde.x0 - 20; ball.vx *= -0.5; } if (ball.x > W - 4) { ball.x = W - 4; ball.vx *= -0.5; } const fy = FY + 14 + ((ball.x * 7) % 5); if (ball.y > fy) { ball.y = fy; ball.vy *= -0.42; ball.vx *= 0.7; if (Math.abs(ball.vy) < 26) { ball.vy = 0; ball.vx = 0; ball.rest = true; ball.t = 0; } } }
      } else if (!ball.home) { ball.t += dt; if (ball.t > 9) homeBall(); }
      if (inp.caught === "ball") { ball.vx = (Math.random() < 0.5 ? -1 : 1) * (70 + Math.random() * 60); ball.vy = -90; ball.rest = false; ball.t = 0; }
      if (inp.caught === "laser") { best.prises = (best.prises || 0) + 1; mem.set(best); }
      if (inp.click && !inp.used) { for (const [k, z] of zones()) if (hit(z, inp.cx, inp.cy)) { act(k); break; } }
      inp.click = false;
      if (!(cat.on === "appui" && cat.st !== "saut")) drawCat();
      SET(Math.max(20, Math.round(D.WALL * (1 - cl((ball.y - FY) / (H - FY), 0, 1))) - 6), 0, 0, [0, -0.4]); { const x = Math.round(ball.x), y = Math.round(ball.y); m.orb(x, y - 1, 2.4, 2.2, "#efe9da", 0.8); m.px(x + 1, y, "#b8b2a4"); m.px(x, y - 1, "#b8b2a4"); }
      if (st.laser && Mo) { SET(8, 255); m.px(Mo.x, Mo.y, "#ff3a3a"); m.px(Mo.x + 1, Mo.y, "#ff8a7a", 0.7); m.px(Mo.x - 1, Mo.y, "#ff8a7a", 0.7); m.px(Mo.x, Mo.y - 1, "#ff8a7a", 0.7); m.px(Mo.x, Mo.y + 1, "#ff8a7a", 0.7); dyn.push({ x: Mo.x, y: Mo.y, d: 60, r: 20, c: [1, 0.15, 0.1], i: 1.6, wrap: 0.8, haze: 0.4, hr: 6 }); }
      // bulles et annonces
      SET(6, 235);
      const bulle = (lines, x, y, a) => { const w = Math.max(...lines.map((l) => l.length)) * 4 + 5, h = lines.length * 7 + 4, x0 = cl(Math.round(x - w / 2), 2, W - w - 2), y0 = Math.max(2, Math.round(y - h)); m.r(x0, y0, w, h, "#fbf3e6", a); m.r(x0 + 1, y0 - 1, w - 2, 1, "#fbf3e6", a); m.r(x0 + 1, y0 + h, w - 2, 1, "#fbf3e6", a); m.px(cl(Math.round(x), x0 + 2, x0 + w - 3), y0 + h + 1, "#fbf3e6", a); lines.forEach((l, i) => m.txt(l, x0 + 3, y0 + 3 + i * 7, "#1d1d22", a)); };
      if (st.bulle) { st.bulle.t += dt; if (st.bulle.t > 4.5) st.bulle = null; else bulle(st.bulle.l, st.bulle.x, st.bulle.y, 1); }
      if (st.score) { st.score.t += dt; if (st.score.t > 1.8) st.score = null; else { const s = st.score, w = s.txt.length * 4; SET(6, 255); m.txt(s.txt, cl(Math.round(s.x - w / 2), 2, W - w - 2), Math.round(s.y - s.t * 6), "#f6c96d", 1 - Math.max(0, s.t - 1.2) / 0.6); } }
      // repères des mini-jeux : flèche dorée, halo, nom au survol
      if (!jeu.on && !st.laser && !reduce) {
        const reps = [["tampon", O.tampon.x + 2, dy - 15, "TAMPON"], ["code", O.code.x + 3, dy - 19, "QUIZ"], ["laser", O.laser.x + 4, dy - 8, "TIMON"]];
        if (ball.rest && !ball.held) reps.push(["boulette", ball.x, ball.y - 7, "BOULETTE"]);
        reps.forEach(([k, x, y, nom], i) => {
          const b = Math.round(Math.abs(Math.sin(t * 3 + i * 0.9)) * 3), yy = y - 3 - b, c = Math.floor(t * 4 + i) % 2 ? "#ffd97a" : "#f3b23c";
          SET(5, 255); m.r(x - 2, yy - 3, 5, 1, c); m.r(x - 1, yy - 2, 3, 1, c); m.px(x, yy - 1, c); m.px(x, yy - 5, c); m.px(x, yy - 4, c);
          dyn.push({ x, y: y + 4, d: D.OBJ - 10, r: 22, c: [1, 0.8, 0.4], i: 0.5 + 0.3 * Math.sin(t * 3 + i * 0.9), wrap: 0.7 });
          if (Mo && Math.hypot(Mo.x - x, Mo.y - (y + 4)) < 10) { const w = nom.length * 4 + 3; SET(5, 200); m.r(x - (w >> 1), yy - 14, w, 7, "#0b0f1e"); SET(5, 255); m.txt(nom, x - (w >> 1) + 2, yy - 13, "#ffd97a"); }
        });
      }
      const amb = AMB[ph].map((v) => v + flash * 0.5);
      return { t, amb, lights: fixes.concat(dyn), floorY: FY, reflK: 1.1, wet: 0.5, grain: 0.03, vig: 0.45, bloom: on ? 1 : 0.3, tint: ph === "jour" ? [1, 1, 1] : [0.95, 0.98, 1.07], em: 1.7 };
    };
    S.cat = cat; S.etat = st;
    return S;
  }
  CR.accueil2 = { Scene2 };

  // ------------------------------------------------------------------ composant
  const TitleArt0 = UI.TitleArt;
  UI.TitleArt = () => {
    const okGpu = G.ok();
    const ref = useRef(null), sref = useRef(null);
    const [quiz, setQuiz] = useState(null), [rep, setRep] = useState(null), [serie, setSerie] = useState(0);
    useEffect(() => {
      const c = ref.current; if (!c || !okGpu) return;
      let R = null; try { R = G.Renderer(c); } catch (e) { console.error(e); } if (!R) return;
      const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      let S = null, raf = 0, alive = true, to = 0, lastMat = -1, params = null; const t0 = performance.now(), mouse = { v: null };
      const layout = () => {
        const vw = Math.max(320, window.innerWidth || 1024), vh = Math.max(320, window.innerHeight || 768), dpr = Math.min(2, window.devicePixelRatio || 1), H = 240, W = Math.max(300, Math.min(640, Math.ceil(H * vw / vh / 2) * 2));
        c.width = Math.round(vw * dpr); c.height = Math.round(vh * dpr); c.style.width = vw + "px"; c.style.height = vh + "px";
        const panel = vw >= 900 ? (56 + Math.min(470, vw * 0.4)) * W / vw : 0;
        try { S = Scene2(W, H, panel); } catch (e) { console.error(e); S = null; return; }
        sref.current = S; S.quiz = (q) => { if (q) { setRep(null); setQuiz(q); } }; params = null; lastMat = -1;
      };
      const paint = (now) => { if (!S) return; const t = (now - t0) / 1000; if (now - lastMat > 40 || !params) { lastMat = now; params = S.frame(t, mouse.v, reduce); } params.t = t; params.fade = reduce ? 0 : Math.max(0, 1 - (now - t0) / 1400); R.draw(S.mat, params); };
      layout();
      const pos = (e) => { const r = c.getBoundingClientRect(); return r.width && S ? { x: (e.clientX - r.left) / r.width * S.W, y: (e.clientY - r.top) / r.height * S.H } : null; };
      const onMove = (e) => { if (!S) return; mouse.v = pos(e); if (mouse.v) c.style.cursor = S.cursorAt(mouse.v.x, mouse.v.y); };
      const onOut = () => { mouse.v = null; };
      const onDown = (e) => { const p = S && pos(e); if (p) S.down(p.x, p.y); };
      const onUp = (e) => { const p = S && pos(e); if (p) S.up(p.x, p.y); };
      const onClick = (e) => { const p = S && pos(e); if (p) S.click(p.x, p.y); if (reduce) paint(performance.now()); };
      const onKey = (e) => { if (S && e.key && e.key.length === 1 && !/input|textarea|select/i.test((e.target && e.target.tagName) || "")) S.key(e.key.toLowerCase()); };
      const onResize = () => { clearTimeout(to); to = setTimeout(() => { layout(); try { paint(performance.now()); } catch (e) { /* rien */ } }, 180); };
      c.addEventListener("mousemove", onMove); c.addEventListener("mouseleave", onOut); c.addEventListener("mousedown", onDown); window.addEventListener("mouseup", onUp); c.addEventListener("click", onClick); window.addEventListener("keydown", onKey); window.addEventListener("resize", onResize);
      const loop = (now) => { if (!alive) return; if (!document.hidden) { try { paint(now); } catch (e) { console.error(e); alive = false; return; } } raf = requestAnimationFrame(loop); };
      try { paint(t0 + 50); } catch (e) { console.error(e); }
      if (!reduce) raf = requestAnimationFrame(loop);
      UI._accueil = () => S;
      return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(to); UI._accueil = null; c.removeEventListener("mousemove", onMove); c.removeEventListener("mouseleave", onOut); c.removeEventListener("mousedown", onDown); window.removeEventListener("mouseup", onUp); c.removeEventListener("click", onClick); window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); R.dispose(); };
    }, []);
    if (!okGpu) return html`<${TitleArt0} />`;
    const answer = (id) => { if (rep) return; const ok = id === quiz.id; setRep({ id, ok }); setSerie(ok ? serie + 1 : 0); son(ok ? "bien" : "erreur"); };
    return html`<${React.Fragment}>
      <canvas ref=${ref} className="ts-canvas acc-canvas acc-gpu" aria-hidden="true" />
      ${!quiz && html`<div className="acc-jeux" role="group" aria-label="Mini-jeux de l'accueil">
        <span className="acc-jeux-t">Mini-jeux</span>
        ${[["boulette", "Boulette", "Attrapez la boulette sur le bureau, tirez, lâchez : visez la corbeille"], ["tampon", "Tampon", "24 secondes : cliquez quand une feuille passe sous le tampon"], ["code", "Quiz éclair", "Retrouvez l'article du code"], ["laser", "Timon", "Le point lumineux suit la souris : Timon le chasse. Recliquez sur le pointeur du bureau pour l'éteindre"]].map(([k, nom, aide]) => html`<button key=${k} type="button" className="ts-btn ts-btn-sm" title=${aide} onClick=${() => sref.current && sref.current.start(k)}>${nom}</button>`)}
      </div>`}
      ${quiz && html`<div className="acc-quiz" role="dialog" aria-label="Quiz éclair du code pénal">
        <p className="acc-quiz-top"><span>Quiz éclair</span>${serie > 1 && html`<b>Série de ${serie}</b>`}</p>
        <p className="acc-quiz-q">« ${quiz.extrait} »</p>
        <p className="acc-quiz-ask">Quel article ?</p>
        <div className="acc-quiz-ch">${quiz.choix.map((ch) => html`<button key=${ch.id} type="button" disabled=${!!rep} className=${UI.cx("acc-quiz-btn", rep && ch.id === quiz.id && "ok", rep && rep.id === ch.id && !rep.ok && "bad")} onClick=${() => answer(ch.id)}>${ch.cite}</button>`)}</div>
        <div className="acc-quiz-foot">${rep && html`<span className=${rep.ok ? "ok" : "bad"}>${rep.ok ? "Exact." : "Raté."}</span>`}${rep && html`<button type="button" className="ts-btn ts-btn-sm" onClick=${() => { setRep(null); setQuiz(A0.question()); }}>Encore</button>`}<button type="button" className="ts-btn ts-btn-sm" onClick=${() => { setQuiz(null); setRep(null); }}>Fermer</button></div>
      </div>`}
    </${React.Fragment}>`;
  };
})();
