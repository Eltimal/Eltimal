/* La Permanence — l'écran d'accueil : le cabinet, la nuit (remplace l'ancien nocturne de title.js).
   Une pièce éclairée par la lampe de bureau et par la ville : fenêtre sur Paris (tribunal des Batignolles, tour Eiffel,
   toits de zinc, pluie ou neige selon la saison, heure réelle), bibliothèque, bureau, chaise, patère. Timon y vit (timon.js).
   Tout réagit à la souris. Quatre jeux sont cachés dans le décor : la boulette de papier et la corbeille, le tampon,
   le quiz éclair du code pénal (questions tirées de CR.TEXTES, donc du droit déjà vérifié du jeu) et le chat.
   Rien ici ne touche à une partie : pas d'horloge de jeu, pas d'effet sur les mécaniques.
   Repères : ax = milieu de la zone libre (à droite du menu), FY = haut du sol. Plans : voir Z. */
(function () {
  const CR = window.CR, UI = CR.UI, { html } = UI, PL = CR.lum, TM = CR.timon;
  const { useEffect, useRef, useState } = React;
  const { rgb, h01, h2, mix, hexOf, rng } = PL;
  const Z = { GLASS: 201, WALL: 90, FURN: 70, OBJ: 55, FLOOR: 30, RUG: 31, ACT: 40, FG: 10 };
  const sh = (hex, d) => { const c = rgb(hex); return hexOf([c[0] + d, c[1] + d, c[2] + d]); };
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const son = (n) => { try { if (CR.son && CR.son.jouer) CR.son.jouer(n); } catch (e) { /* muet */ } };
  const mem = { get() { try { return JSON.parse(localStorage.getItem("lp-accueil") || "{}"); } catch (e) { return {}; } }, set(o) { try { localStorage.setItem("lp-accueil", JSON.stringify(o)); } catch (e) { /* tant pis */ } } };

  const phaseOf = (d) => { const h = d.getHours() + d.getMinutes() / 60; return h >= 8.5 && h < 17.5 ? "jour" : (h >= 7 && h < 8.5) || (h >= 17.5 && h < 21) ? "soir" : "nuit"; };
  const seasonOf = (d) => { const m = d.getMonth() + 1; return m === 12 || m <= 2 ? "hiver" : m >= 10 ? "automne" : m >= 6 && m <= 8 ? "ete" : "printemps"; };
  const AMB = { nuit: [0.2, 0.22, 0.36], soir: [0.4, 0.33, 0.4], jour: [0.74, 0.76, 0.8] };

  // ------------------------------------------------------------------ la ville derrière la vitre (déjà éclairée)
  function ville(EW, EH, ph, pluie) {
    const E = new PL.Buf(EW, EH), on = ph !== "jour", R = rng(77);
    const sky = { nuit: ["#060a18", "#0b1330", "#152046", "#24305c", "#3c3c66", "#5a4a68"], soir: ["#252a5e", "#473f7e", "#7d4b86", "#c26872", "#ea8f66", "#f4bf80"], jour: pluie ? ["#6f7a86", "#808b96", "#939ea8", "#a6b0b8", "#b8c0c6", "#c8ced2"] : ["#5b8fc4", "#74a3d0", "#8fb6da", "#abc8e2", "#c6d9e8", "#dfe6e6"] }[ph].map(rgb);
    const HZ = Math.round(EH * 0.74);
    for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) { const t = Math.min(4.999, (y / HZ) * 5), k = t | 0; E.px(x, y, (t - k) > PL.bayer(x, y) ? sky[k + 1] : sky[k]); }
    if (ph === "nuit" && !pluie) for (let i = 0; i < 40; i++) E.px((h01(i * 3.1) * EW) | 0, (h01(i * 5.7) * HZ * 0.6) | 0, i % 7 ? "#8f9ac0" : "#e8eeff", 0.8);
    const cc = { nuit: ["#2c3050", "#1c2240"], soir: ["#f0a888", "#8a587e"], jour: pluie ? ["#a4adb6", "#8a949e"] : ["#ffffff", "#d2dce6"] }[ph];
    for (let i = 0; i < (pluie ? 12 : 5); i++) { const cx = h01(i * 9.3) * EW, cy = 6 + h01(i * 4.1) * HZ * 0.5; for (let k = 0; k < 4; k++) { E.ell(cx + k * 8 - 12, cy + 1, 9, 2.6, cc[1], 0.7); E.ell(cx + k * 8 - 13, cy - 1, 7, 2, cc[0], ph === "nuit" ? 0.4 : 0.8); } }
    const hz = sky[5], tone = (hex, k) => { const c = rgb(hex), a = ph === "nuit" ? 0.3 : ph === "soir" ? 0.62 : 1; return mix([c[0] * a, c[1] * a, c[2] * (a + (ph === "nuit" ? 0.14 : 0))], hz, k); };
    // lointain : une ligne de toits
    for (let x = 0; x < EW;) { const w = 5 + (R() * 9 | 0), h = 4 + (R() * 9 | 0); E.r(x, HZ - h, w, h + 2, tone("#55606e", 0.55)); if (on && R() < 0.7) E.px(x + 1 + (R() * (w - 2) | 0), HZ - h + 2 + (R() * (h - 2) | 0), "#f2c878"); x += w; }
    // la tour Eiffel, dorée la nuit
    const tx = Math.round(EW * 0.76), th = Math.round(EH * 0.5), ty = HZ - th, gold = on ? rgb("#e2a04a") : tone("#5a4a3e", 0.3), goldD = on ? rgb("#a86a2a") : tone("#3e342c", 0.3);
    for (let y = 0; y < th; y++) { const u = y / th, hw = 0.6 + Math.pow(u, 2.3) * 9.5; for (let x = -Math.ceil(hw); x <= Math.ceil(hw); x++) { if (Math.abs(x) > hw) continue; const inner = Math.abs(x) < hw - 1.6 && u > 0.5; if (inner && u > 0.78 && Math.abs(x) < hw * 0.55) continue; E.px(tx + x, ty + y, (x + y) % 2 && inner ? goldD : gold); } }
    for (const u of [0.42, 0.68]) { const hw = 1.5 + Math.pow(u, 2.3) * 9.5; E.r(tx - hw - 1, ty + th * u, hw * 2 + 3, 1, on ? rgb("#ffd88a") : gold); }
    E.r(tx, ty - 5, 1, 5, gold);
    // le tribunal des Batignolles : trois blocs de verre en gradins
    const bx = Math.round(EW * 0.2), glass = tone("#7f9ab0", 0.35), glassD = tone("#4f6880", 0.35);
    let by = HZ;
    for (const [w, h] of [[26, 9], [19, 15], [15, 15], [11, 14]]) { by -= h; E.r(bx - (w >> 1), by, w, h, glass); for (let y = by + 1; y < by + h; y += 2) for (let x = bx - (w >> 1) + 1; x < bx + (w >> 1); x += 2) E.px(x, y, on && h2(x, y) < 0.42 ? (h2(x + 3, y) < 0.5 ? "#dff0ff" : "#f6dc9a") : glassD); E.r(bx - (w >> 1), by, w, 1, tone("#b8c8d4", 0.3)); if (w < 26) { E.px(bx - (w >> 1) - 1, by + h - 1, tone("#3f6a44", 0.3)); E.px(bx + (w >> 1) + 1, by + h - 1, tone("#3f6a44", 0.3)); } }
    E.r(bx + 2, by - 6, 1, 6, glassD);
    // les toits de zinc, tout près
    const zinc = tone("#66707c", 0.12), zincD = tone("#4a535e", 0.12), stone = tone("#b5a68a", 0.12);
    for (let x = -4; x < EW;) { const w = 22 + (R() * 20 | 0), top = HZ + 4 + (R() * 9 | 0); E.r(x, top, w, EH - top, zinc); E.r(x, top, w, 1, tone("#9aa4ae", 0.1)); for (let k = x + 3; k < x + w; k += 5) E.r(k, top + 1, 1, EH - top, zincD); E.r(x + w - 1, top, 1, EH - top, zincD);
      for (let k = x + 4; k < x + w - 6; k += 9) { E.r(k, top + 5, 6, 8, stone); const lit = on && R() < 0.5; E.r(k + 1, top + 6, 4, 6, lit ? rgb(R() < 0.3 ? "#cfe4f2" : "#f6c878") : tone("#26303c", 0)); E.r(k + 3, top + 6, 1, 6, lit ? rgb("#8a5a2a") : stone); }
      const cx = x + 3 + (R() * (w - 12) | 0); E.r(cx, top - 7, 7, 8, tone("#8c6a58", 0.12)); for (let p = 0; p < 3; p++) E.r(cx + 1 + p * 2, top - 10, 1, 3, tone("#b5653f", 0.1)); if (R() < 0.4) { E.r(cx + 12, top - 12, 1, 12, zincD); E.r(cx + 10, top - 11, 5, 1, zincD); E.r(cx + 11, top - 9, 3, 1, zincD); }
      x += w; }
    if (on) { E.r(Math.round(EW * 0.5), HZ + 2, 9, 3, "#3a1418"); E.txt("BAR", Math.round(EW * 0.5) - 1, HZ - 3, "#ff5a4a"); }
    return { E, HZ, tx, ty, th, bx, top: by };
  }

  // ------------------------------------------------------------------ la pièce
  function piece(B, G, ph, st) {
    const { W, H, ax, FY, wx0, wx1, wy0, wy1, dx0, dx1, dy } = G, R = rng(31), on = ph !== "jour";
    // mur, corniche, lambris
    B.mat(Z.WALL, 255, 0);
    B.r(0, 0, W, FY, "#3d4a48"); for (let y = 10; y < FY - 34; y += 6) for (let x = (y % 12 ? 3 : 0); x < W; x += 6) B.px(x, y, "#465654", 0.8);
    B.noise(0, 10, W, FY - 44, "#354140", 0.1, 4, 0.7);
    B.r(0, 0, W, 6, "#55625e"); B.r(0, 6, W, 1, "#2a3432"); B.r(0, 7, W, 2, "#49564f");
    B.r(0, FY - 34, W, 34, "#4a3426"); B.r(0, FY - 35, W, 2, "#6a4c38"); B.r(0, FY - 33, W, 1, "#2c1e16");
    for (let x = 4; x < W; x += 34) { B.r(x, FY - 28, 28, 20, "#42301f"); B.r(x, FY - 28, 28, 1, "#2c1e16"); B.r(x, FY - 28, 1, 20, "#2c1e16"); B.r(x + 27, FY - 28, 1, 20, "#5e4430"); B.r(x, FY - 9, 28, 1, "#5e4430"); }
    B.r(0, FY - 4, W, 4, "#33241a"); B.r(0, FY - 5, W, 1, "#5e4430");
    // parquet
    B.mat(Z.FLOOR, 255, 0);
    B.r(0, FY, W, H - FY, "#6a4a30");
    for (let y = FY, k = 0; y < H; k++) { const hgt = 4 + (k >> 1), off = (k * 23) % 40; B.r(0, y, W, 1, "#4a3220"); for (let x = -off; x < W; x += 40 + k * 4) { B.r(x, y + 1, 1, hgt, "#523822"); if (h01(x + k * 7) < 0.5) B.r(x + 2, y + 1, 36 + k * 4 - 3, hgt - 1, h01(x * 3 + k) < 0.5 ? "#73523a" : "#614329", 0.8); } y += hgt + 1; }
    B.noise(0, FY, W, H - FY, "#7c5a40", 0.07, 6, 0.6);
    for (let x = 0; x < W; x++) for (let y = FY; y < H; y++) G.wet[y * W + x] = 0.35 + h2(x >> 3, y) * 0.3;
    // tapis
    B.mat(Z.RUG, 255, 0);
    const rx0 = ax - 96, rx1 = Math.min(W - 6, ax + 118), ry0 = FY + 5, ry1 = Math.min(H - 8, FY + 40);
    B.r(rx0, ry0, rx1 - rx0, ry1 - ry0, "#6a2430"); B.r(rx0 + 3, ry0 + 2, rx1 - rx0 - 6, ry1 - ry0 - 4, "#7c2e38"); B.r(rx0 + 6, ry0 + 4, rx1 - rx0 - 12, 1, "#c8a260"); B.r(rx0 + 6, ry1 - 5, rx1 - rx0 - 12, 1, "#c8a260");
    for (let x = rx0 + 10; x < rx1 - 10; x += 12) { B.r(x, ry0 + 7, 5, Math.max(2, ry1 - ry0 - 14), "#27407a", 0.55); B.px(x + 2, ((ry0 + ry1) >> 1), "#c8a260"); }
    for (let y = ry0 + 1; y < ry1; y += 2) { B.px(rx0 - 1, y, "#d8c8a0"); B.px(rx1, y, "#d8c8a0"); }
    for (let y = ry0; y < ry1; y++) for (let x = rx0; x < rx1; x++) G.wet[y * W + x] = 0;

    // ---- fenêtre : tringle, rideaux, dormant, vitres (plan GLASS, remplies à chaque image)
    B.mat(Z.WALL, 255, 0);
    B.r(wx0 - 22, wy0 - 9, wx1 - wx0 + 44, 2, "#b8924a"); B.r(wx0 - 24, wy0 - 10, 3, 4, "#d9b46a"); B.r(wx1 + 21, wy0 - 10, 3, 4, "#d9b46a");
    B.r(wx0 - 4, wy0 - 4, wx1 - wx0 + 8, wy1 - wy0 + 8, "#d9d2c0"); B.r(wx0 - 4, wy0 - 4, wx1 - wx0 + 8, 1, "#f2ecdc"); B.r(wx0 - 4, wy0 - 4, 1, wy1 - wy0 + 8, "#f2ecdc"); B.r(wx1 + 3, wy0 - 4, 1, wy1 - wy0 + 8, "#9a9484");
    B.mat(Z.GLASS, 0, 255); B.r(wx0, wy0, wx1 - wx0, wy1 - wy0, "#000000");
    B.mat(Z.WALL, 255, 0);
    const pw = Math.round((wx1 - wx0) / 3), tr = wy0 + Math.round((wy1 - wy0) * 0.28);
    for (const x of [wx0 + pw, wx0 + 2 * pw]) { B.r(x - 1, wy0, 3, wy1 - wy0, "#d9d2c0"); B.r(x - 1, wy0, 1, wy1 - wy0, "#f2ecdc"); B.r(x + 1, wy0, 1, wy1 - wy0, "#9a9484"); }
    B.r(wx0, tr - 1, wx1 - wx0, 3, "#d9d2c0"); B.r(wx0, tr + 1, wx1 - wx0, 1, "#9a9484");
    B.r(wx0 + pw, ((tr + wy1) >> 1) - 4, 1, 9, "#8a7a4a"); B.px(wx0 + pw + 1, (tr + wy1) >> 1, "#d9b46a");
    B.r(wx0 - 8, wy1 + 4, wx1 - wx0 + 16, 3, "#e6dfcc"); B.r(wx0 - 8, wy1 + 7, wx1 - wx0 + 16, 1, "#8a8474");
    for (const [cx0, dir] of [[wx0 - 20, 1], [wx1 + 2, -1]]) for (let y = wy0 - 7; y < FY - 38; y++) { const tie = y > wy1 - 34 && y < wy1 - 30, w = tie ? 9 : 18 - Math.max(0, (wy1 - 32 - y)) * 0 - (y > wy1 - 34 ? 3 : 0); for (let i = 0; i < w; i++) { const x = dir > 0 ? cx0 + i : cx0 + 17 - i, f = Math.sin(i * 1.3 + (y > wy1 - 32 ? 1.2 : 0)); B.px(x, y, tie ? "#c8a260" : f > 0.5 ? "#7a2a34" : f < -0.5 ? "#43141c" : "#5e1e28"); } }

    // ---- bibliothèque (et un meuble sous le menu)
    const bookcase = (x0, x1, y0, seed, radio) => {
      const Rb = rng(seed); B.mat(Z.FURN, 255, 0);
      B.r(x0, y0, x1 - x0, FY + 8 - y0, "#3a2618"); B.r(x0, y0, x1 - x0, 2, "#5a3e28"); B.r(x0, y0, 1, FY + 8 - y0, "#5a3e28"); B.r(x1 - 1, y0, 1, FY + 8 - y0, "#241710");
      for (let y = y0 + 3; y < FY - 6; y += 24) { B.r(x0 + 2, y, x1 - x0 - 4, 21, "#1e1410"); B.r(x0 + 2, y + 21, x1 - x0 - 4, 2, "#4a3222");
        if (radio && y === y0 + 3 + 48) { G.radio = { x: x0 + 6, y: y + 9, w: 24, h: 12 }; continue; }
        for (let x = x0 + 3; x < x1 - 4;) { const w = 2 + (Rb() * 3 | 0), h = 13 + (Rb() * 7 | 0), t = Rb(); const c = t < 0.34 ? "#b3261e" : t < 0.52 ? "#27407a" : ["#3e5c3a", "#8a6a2a", "#5b4a7a", "#2e2e33", "#a2553a", "#d8ccb4"][(Rb() * 6) | 0]; if (Rb() < 0.08) { x += 3; continue; } B.r(x, y + 21 - h, w, h, c); B.r(x, y + 21 - h, 1, h, sh(c, 26)); if (t < 0.52 && w > 2) { B.r(x, y + 21 - h + 3, w, 2, t < 0.34 ? "#f2ecdc" : "#c8a260"); } x += w + (Rb() < 0.15 ? 1 : 0); } }
      B.r(x0 - 1, FY + 6, x1 - x0 + 2, 3, "#241710");
    };
    bookcase(ax - 152, ax - 88, Math.max(14, wy0 - 8), 5, true);
    if (ax - 160 > 40) { bookcase(Math.max(4, ax - 232), ax - 160, Math.max(30, wy0 + 14), 9, false); B.mat(Z.WALL, 255, 0); B.r(Math.max(10, ax - 290), wy0 + 10, 30, 22, "#8a6a2a"); B.r(Math.max(12, ax - 288), wy0 + 12, 26, 18, "#243044"); }

    // ---- horloge, diplôme (à droite de la fenêtre)
    G.horloge = { x: Math.min(W - 16, ax + 116), y: wy0 + 14, r: 9 };
    G.cadre = { x: Math.min(W - 30, ax + 100), y: wy0 + 36, w: 30, h: 22 };
    // patère et robe
    G.patere = { x: Math.min(W - 12, ax + 146), y: FY - 96 };

    // ---- chaise de Timon : rotin, coussin vert
    const chx = G.chaise.x, chy = G.chaise.y;
    B.mat(Z.FURN, 255, 0);
    for (const lx of [chx - 12, chx + 11]) { B.r(lx, chy + 2, 2, FY + 10 - chy - 2, "#e6e4dc"); B.r(lx + 1, chy + 2, 1, FY + 10 - chy - 2, "#a8a69e"); } B.r(chx - 11, chy + 16, 23, 1, "#c8c6be");
    B.r(chx + 9, chy - 30, 3, 32, "#b8863c"); B.r(chx + 9, chy - 30, 1, 32, "#d8a650"); B.r(chx - 13, chy - 1, 27, 3, "#b8863c"); B.dith(chx - 13, chy - 1, 27, 3, "#8a5e24", 0.5);
    for (let y = chy - 28; y < chy - 6; y += 3) B.r(chx + 6, y, 6, 2, "#c4923f"); B.dith(chx + 6, chy - 28, 6, 22, "#8a5e24", 0.4);
    B.r(chx - 12, chy - 4, 22, 4, "#5a6a2c"); B.r(chx - 12, chy - 4, 22, 1, "#74863a"); B.r(chx - 12, chy - 1, 22, 1, "#3e4a1e");

    // ---- bureau
    B.mat(Z.FURN, 255, 0);
    B.r(dx0 + 3, dy + 4, 3, FY + 10 - dy - 4, "#4a2e1a"); B.r(dx0 + 3, dy + 4, 1, FY + 10 - dy - 4, "#6a4428");
    B.r(dx1 - 44, dy + 4, 42, FY + 8 - dy - 4, "#5a3820"); B.r(dx1 - 44, dy + 4, 1, FY + 8 - dy - 4, "#7a5030"); B.r(dx1 - 3, dy + 4, 1, FY + 8 - dy - 4, "#3a2414");
    for (const y of [dy + 7, dy + 22]) { B.r(dx1 - 41, y, 36, 13, "#6a4428"); B.r(dx1 - 41, y, 36, 1, "#8a5c38"); B.r(dx1 - 41, y + 12, 36, 1, "#3a2414"); B.r(dx1 - 25, y + 5, 4, 2, "#d9b46a"); }
    B.r(dx0, dy, dx1 - dx0, 4, "#7a5030"); B.r(dx0, dy, dx1 - dx0, 1, "#a87a4a"); B.r(dx0, dy + 3, dx1 - dx0, 1, "#3a2414"); B.r(dx0 + 6, dy + 4, dx1 - dx0 - 50, 3, "#4a2e1a");
    // objets du bureau
    B.mat(Z.OBJ, 255, 0);
    const O = G.obj;
    // orchidée (comme chez Timon)
    B.r(O.plante.x - 4, dy - 8, 8, 8, "#d8d4cc"); B.r(O.plante.x - 4, dy - 8, 8, 1, "#f2efe8"); B.r(O.plante.x + 3, dy - 7, 1, 7, "#a8a49c"); B.r(O.plante.x - 3, dy - 9, 6, 1, "#3a2a1c");
    B.ell(O.plante.x - 4, dy - 11, 4, 1.6, "#3f7a3f"); B.ell(O.plante.x + 4, dy - 12, 4, 1.6, "#4f9a4f");
    B.line(O.plante.x, dy - 9, O.plante.x + 1, dy - 34, "#3a5a2c");
    // téléphone
    B.r(O.tel.x, dy - 5, 13, 5, "#1e1e22"); B.r(O.tel.x, dy - 5, 13, 1, "#3a3a40"); B.r(O.tel.x + 1, dy - 8, 11, 3, "#26262c"); B.r(O.tel.x, dy - 9, 3, 3, "#2e2e34"); B.r(O.tel.x + 10, dy - 9, 3, 3, "#2e2e34"); for (let i = 0; i < 3; i++) B.px(O.tel.x + 4 + i * 2, dy - 3, "#6a6a70");
    // pile de dossiers
    for (let k = 0; k < 4; k++) { const c = ["#d8ccb4", "#c8443a", "#e6dcc6", "#5a86b0"][k]; B.r(O.pile.x - (k & 1), dy - 2 - k * 2, 20, 2, c); B.r(O.pile.x - (k & 1), dy - 1 - k * 2, 20, 1, sh(c, -30)); }
    // tampon et son encrier
    B.r(O.tampon.x - 2, dy - 2, 9, 2, "#2a2a30"); B.r(O.tampon.x - 1, dy - 2, 7, 1, "#a02630");
    // code pénal
    B.r(O.code.x, dy - 15, 6, 15, "#b3261e"); B.r(O.code.x, dy - 15, 1, 15, "#d8443a"); B.r(O.code.x + 5, dy - 15, 1, 15, "#7a1612"); B.r(O.code.x, dy - 11, 6, 3, "#f2ecdc"); B.r(O.code.x + 1, dy - 10, 4, 1, "#b3261e");
    // tasse
    B.r(O.tasse.x, dy - 6, 6, 6, "#e9e4d8"); B.r(O.tasse.x, dy - 6, 6, 1, "#3a2414"); B.r(O.tasse.x + 5, dy - 5, 1, 5, "#b8b2a4"); B.px(O.tasse.x + 6, dy - 4, "#e9e4d8"); B.px(O.tasse.x + 7, dy - 3, "#e9e4d8"); B.px(O.tasse.x + 6, dy - 2, "#e9e4d8"); B.r(O.tasse.x + 1, dy - 3, 3, 1, "#27407a");
    // pointeur
    B.r(O.laser.x, dy - 2, 8, 2, "#8a8d94"); B.r(O.laser.x, dy - 2, 8, 1, "#c8ccd4"); B.px(O.laser.x + 8, dy - 2, "#d8343a"); B.px(O.laser.x + 3, dy - 3, "#3a3d42");
    // lampe de banquier
    const lx = O.lampe.x; B.r(lx - 5, dy - 2, 11, 2, "#b8924a"); B.r(lx - 5, dy - 2, 11, 1, "#e6c47a"); B.r(lx, dy - 14, 1, 12, "#b8924a"); B.r(lx - 1, dy - 15, 3, 1, "#e6c47a");
    B.mat(Z.OBJ, st.lampe ? 40 : 255, st.lampe ? 230 : 0);
    for (let j = 0; j < 6; j++) { const hw = 6 + j; B.r(lx - hw, dy - 21 + j, hw * 2 + 1, 1, st.lampe ? (j < 2 ? "#3fae7a" : j < 4 ? "#2f9a66" : "#57c890") : j < 2 ? "#2a6a4a" : "#1f5a3e"); }
    if (st.lampe) { B.mat(Z.OBJ, 0, 255); B.r(lx - 9, dy - 15, 19, 1, "#fff2c4"); }
    // corbeille
    B.mat(Z.FURN, 255, 0);
    const bn = G.bin; for (let y = 0; y < bn.h; y++) { const ins = Math.round(y / bn.h * 2); for (let x = ins; x < bn.w - ins; x++) B.px(bn.x + x, bn.y + y, (x + y) % 2 ? "#3a3d44" : "#23262c"); } B.r(bn.x - 1, bn.y, bn.w + 2, 1, "#6a6d75");
    // premier plan : fougère, en bas à droite
    B.mat(Z.FG, 70, 0);
    const fr = rng(12); for (let k = 0; k < 9; k++) { const a = -2.6 + k * 0.26, len = 26 + fr() * 20; for (let i = 0; i < len; i++) { const x = W - 8 + Math.cos(a) * i, y = H + 4 + Math.sin(a) * i - (i * i) * -0.008; B.px(x, y, "#10201a"); if (i % 3 === 0 && i > 5) { B.px(x - 1, y - 1, "#162a22"); B.px(x + 1, y + 1, "#162a22"); B.px(x - 2, y - 1, "#0c1814"); } } }
  }

  function lights(G, ph, st) {
    const L = [], O = G.obj, n = ph === "nuit" ? 1 : ph === "soir" ? 0.8 : 0.25;
    if (st.lampe) { L.push({ x: O.lampe.x, y: G.dy - 14, r: 120, c: [1, 0.74, 0.4], i: 1.5 * (0.5 + n * 0.5), down: true, up: 46, haze: 0.5 * n, hr: 34 }); L.push({ x: O.lampe.x, y: G.dy - 2, r: 46, c: [1, 0.8, 0.5], i: 0.9 * n }); L.push({ x: O.lampe.x - 30, y: G.dy - 50, r: 260, c: [1, 0.78, 0.5], i: 0.42 * n }); }
    const cw = ph === "jour" ? [1, 0.96, 0.86] : ph === "soir" ? [1, 0.6, 0.5] : [0.36, 0.5, 0.86];
    L.push({ x: (G.wx0 + G.wx1) / 2, y: G.wy1 - 30, r: 220, c: cw, i: ph === "jour" ? 0.5 : 0.5 }); L.push({ x: (G.wx0 + G.wx1) / 2, y: G.FY + 24, r: 130, c: cw, i: ph === "jour" ? 0.3 : 0.4 });
    if (st.radio && G.radio) L.push({ x: G.radio.x + 16, y: G.radio.y + 6, r: 22, c: [1, 0.7, 0.3], i: 0.7, haze: 0.12, hr: 10 });
    return L;
  }

  // ------------------------------------------------------------------ quiz éclair
  function question() {
    const T = CR.TEXTES || {}, ids = Object.keys(T).filter((id) => { const t = T[id]; return /^(CP|CPP)_/.test(id) && t && typeof t.texte === "string" && t.texte.length > 70 && t.cite; });
    if (ids.length < 6) return null;
    const id = ids[Math.floor(Math.random() * ids.length)], pre = id.split("_")[0], autres = ids.filter((x) => x !== id && x.split("_")[0] === pre).sort(() => Math.random() - 0.5).slice(0, 2);
    let ex = T[id].texte.replace(/\s+/g, " ").trim(); if (ex.length > 230) ex = ex.slice(0, ex.lastIndexOf(" ", 228)) + "…";
    const choix = [id].concat(autres).sort(() => Math.random() - 0.5).map((x) => ({ id: x, cite: T[x].cite }));
    return { id, extrait: ex, choix };
  }

  // ------------------------------------------------------------------ la scène
  function Scene(vw, vh) {
    const sc = Math.max(2, Math.ceil(Math.max(vw / 600, vh / 340))), W = Math.ceil(vw / sc), H = Math.ceil(vh / sc);
    const panel = vw >= 900 ? (56 + Math.min(470, vw * 0.4)) / sc : 0;
    const ax = panel ? Math.round(panel + (W - panel) / 2) : Math.round(W / 2), FY = H - Math.round(Math.min(70, H * 0.24));
    const wy1 = FY - 66, wy0 = Math.max(12, wy1 - Math.min(138, wy1 - 16)), wx0 = ax - 74, wx1 = ax + 78, dy = FY - 40, dx0 = ax - 60, dx1 = ax + 68;
    const G = { W, H, sc, ax, FY, wx0, wx1, wy0, wy1, dx0, dx1, dy, wet: null, chaise: { x: Math.min(W - 18, ax + 94), y: FY - 23 }, bin: { x: ax - 82, y: FY - 4, w: 13, h: 15 },
      obj: { plante: { x: ax - 50 }, tel: { x: ax - 38 }, pile: { x: ax - 18 }, tampon: { x: ax + 10 }, code: { x: ax + 22 }, tasse: { x: ax + 32 }, laser: { x: ax + 42 }, lampe: { x: ax + 58 } } };
    const R = PL.Renderer(W, H); G.wet = R.wet;
    const now = new Date(), S = { W, H, sc, G };
    const st = { lampe: true, radio: false, laser: false, cadre: 0, livres: [], sips: 0, flash: 0, sparkle: 0, robe: 0, spin: 0, petals: [], notes: [], steam: 0, ring: 0, nextRing: 14 + Math.random() * 20, bulle: null, score: null, typed: "" };
    let ph = phaseOf(now), saison = seasonOf(now), pluie = (now.getDate() * 7 + now.getMonth() * 3) % 5 < 3 || ph === "nuit", V = null;
    const EW = wx1 - wx0 + 14, EH = wy1 - wy0;
    const monde = { x0: Math.max(panel ? panel - 30 : 12, 12), x1: W - 14, sol: FY + 10, chaise: G.chaise, appui: { x0: wx0 + 10, x1: wx1 - 10, y: wy1 + 4 }, plante: { x: G.obj.plante.x } };
    const cat = TM.create(monde);
    const birds = [0, 1, 2].map((i) => ({ hx: wx0 + 22 + i * 46 + (i === 1 ? 14 : 0), x: 0, y: 0, fly: 0, vx: 0, vy: 0, back: 0, i }));
    for (const b of birds) { b.x = b.hx; b.y = wy1 - 1; }
    const ball = { x: 0, y: 0, vx: 0, vy: 0, rest: true, home: true, held: false, t: 0 };
    const homeBall = () => { ball.x = G.obj.pile.x + 24; ball.y = dy - 2; ball.vx = ball.vy = 0; ball.rest = true; ball.home = true; ball.held = false; };
    homeBall();
    const jeu = { on: false, t: 0, feuilles: [], n: 0, slam: 0, next: 0, serie: 0 };
    const best = mem.get();
    const rebuild = () => { const B = R.stat; B.c.fill(0); B.e.fill(0); B.l.fill(0); B.z.fill(0); B.G = 0; B.ox = 0; piece(B, G, ph, st); R.bake(lights(G, ph, st)); };
    V = ville(EW, EH, ph, pluie); rebuild();
    const inp = { mouse: null, moved: false, click: false, down: false, used: false, laser: false, ball: null, caught: null };
    let lastT = 0, lastMin = -1;
    const pop = (txt, x, y) => { st.score = { txt, x, y, t: 0 }; };
    const hit = (o, x, y) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h;
    const zones = () => { const O = G.obj; return [
      ["lampe", { x: O.lampe.x - 11, y: dy - 22, w: 23, h: 22 }], ["tel", { x: O.tel.x - 1, y: dy - 10, w: 15, h: 10 }], ["tampon", { x: O.tampon.x - 3, y: dy - 12, w: 11, h: 12 }], ["code", { x: O.code.x - 1, y: dy - 16, w: 8, h: 16 }],
      ["tasse", { x: O.tasse.x - 1, y: dy - 8, w: 9, h: 8 }], ["laser", { x: O.laser.x - 1, y: dy - 5, w: 11, h: 5 }], ["plante", { x: O.plante.x - 6, y: dy - 36, w: 14, h: 28 }],
      ["radio", G.radio], ["horloge", { x: G.horloge.x - 10, y: G.horloge.y - 10, w: 20, h: 20 }], ["cadre", { x: G.cadre.x - 2, y: G.cadre.y - 2, w: G.cadre.w + 4, h: G.cadre.h + 4 }], ["robe", { x: G.patere.x - 12, y: G.patere.y, w: 24, h: 80 }],
      ["tour", { x: wx0 + V.tx - 7 - 12, y: wy0 + V.ty - 4, w: 26, h: V.th + 6 }], ["ciel", { x: wx0, y: wy0, w: wx1 - wx0, h: Math.round((wy1 - wy0) * 0.5) }], ["livres", { x: ax - 152, y: wy0, w: 64, h: FY - wy0 - 40 }],
    ].filter((z) => z[1]); };
    S.cursorAt = (x, y) => { if (jeu.on) return "crosshair"; if (st.laser) return "none"; if (Math.hypot(x - ball.x, y - ball.y) < 6) return "grab"; if (Math.hypot(x - cat.x, y - (cat.y - 12)) < 15) return "pointer"; for (const [k, z] of zones()) if (k !== "ciel" && k !== "livres" && hit(z, x, y)) return "pointer"; return "default"; };
    S.quiz = null; // posé par le composant
    // lancement direct depuis la barre « Mini-jeux »
    S.start = (k) => { if (jeu.on) return; if (k === "boulette") { st.laser = false; homeBall(); pop("TIREZ LA BOULETTE PUIS LACHEZ", ball.x, ball.y - 22); } else if (k === "laser") { if (!st.laser) act("laser"); } else { st.laser = false; act(k); } };
    S.key = (ch) => { st.typed = (st.typed + ch).slice(-5); if (st.typed === "miaou") { for (let i = 0; i < 14; i++) cat.fx.push({ k: "coeur", x: cat.x + (Math.random() - 0.5) * 40, y: cat.y - 14 - Math.random() * 20, t: -Math.random() }); cat.fx.push({ k: "mot", txt: "MIAOU !", x: cat.x, y: cat.y - 36, t: 0 }); cat.miaou = cat.t + 1; st.typed = ""; } };
    S.down = (x, y) => { inp.down = true; if (!jeu.on && Math.hypot(x - ball.x, y - ball.y) < 7 && ball.rest) { ball.held = true; ball.gx = ball.x; ball.gy = ball.y; ball.home = false; } };
    S.up = (x, y) => { inp.down = false; if (ball.held) { ball.held = false; const dx = ball.gx - x, dyy = ball.gy - y; if (Math.hypot(dx, dyy) > 4) { ball.vx = cl(dx * 6, -260, 260); ball.vy = cl(dyy * 6, -300, 200); ball.rest = false; ball.t = 0; ball.justThrown = true; } else homeBall(); } };
    S.click = (x, y) => {
      if (ball.justThrown) { ball.justThrown = false; return; }
      if (jeu.on) { jeu.slam = 0.16; son("tampon"); const xs = G.obj.tampon.x + 2; const f = jeu.feuilles.find((q) => !q.ok && Math.abs(q.x + 5 - xs) < 6); if (f) { f.ok = true; jeu.n++; jeu.serie++; pop(jeu.serie > 2 ? "SERIE " + jeu.serie : "VISE", xs, dy - 22); } else { jeu.serie = 0; pop("RATE", xs, dy - 22); } return; }
      inp.click = true; inp.cx = x; inp.cy = y;
    };
    const act = (k) => {
      const O = G.obj;
      if (k === "lampe") { st.lampe = !st.lampe; son("clic"); rebuild(); }
      else if (k === "tel") { if (st.ring > 0) { st.ring = 0; son("decroche"); const L = [["PERMANENCE GARDE A VUE", "COMMISSARIAT DU 18E"], ["MAITRE ? C'EST POUR", "UNE COMPARUTION IMMEDIATE"], ["C'EST MAMAN.", "TU MANGES BIEN ?"], ["LE GREFFE : RENVOI", "A QUINZAINE"], ["ERREUR DE NUMERO", "DESOLE"], ["LE BATONNIER VOUS", "FELICITE. OU PAS."]]; st.bulle = { l: L[Math.floor(Math.random() * L.length)], x: O.tel.x + 6, y: dy - 16, t: 0 }; } else { st.bulle = { l: ["TUUUT... TUUUT..."], x: O.tel.x + 6, y: dy - 16, t: 2.2 }; son("raccroche"); } }
      else if (k === "radio") { st.radio = !st.radio; son("radio"); rebuild(); }
      else if (k === "tasse") { st.sips++; st.steam = 1.2; pop(st.sips % 6 === 0 ? "VIDE. ENCORE UN." : "GLOU", O.tasse.x + 3, dy - 16); }
      else if (k === "horloge") { st.spin = 1.2; son("horloge"); }
      else if (k === "cadre") { st.cadre = st.cadre ? 0 : (Math.random() < 0.5 ? 1 : -1); son("clic"); }
      else if (k === "robe") { st.robe = 1.6; }
      else if (k === "tour") { st.sparkle = 8; }
      else if (k === "ciel") { st.flash = 0.5; son("lointain"); if (cat.st !== "saut" && cat.on === "sol") { cat.st = "saut"; cat.prep = 0; cat.jump = { x0: cat.x, y0: cat.y, x1: cat.x, y1: cat.y, t: 0, d: 0.45, on: "sol", then: "assis" }; cat.fx.push({ k: "mot", txt: "!", x: cat.x, y: cat.y - 34, t: 0 }); } }
      else if (k === "livres") { if (st.livres.length < 4) { st.livres.push({ x: ax - 146 + Math.random() * 50, y: wy0 + 30 + Math.random() * 40, vy: 0, c: ["#b3261e", "#27407a", "#3e5c3a"][st.livres.length % 3], rest: false, r: 0 }); son("papier"); } }
      else if (k === "plante") { st.petals.push({ x: O.plante.x + 2, y: dy - 30, t: 0 }); }
      else if (k === "laser") { st.laser = !st.laser; son("clic"); if (st.laser) pop("POINTEUR ALLUME", O.laser.x + 4, dy - 14); }
      else if (k === "tampon") { jeu.on = true; jeu.t = 24; jeu.feuilles = []; jeu.n = 0; jeu.next = 0.4; jeu.serie = 0; pop("TAMPONNEZ !", O.tampon.x, dy - 26); }
      else if (k === "code") { S.quiz && S.quiz(question()); son("page"); }
    };

    S.frame = function (t, mouse) {
      const dt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
      const d = new Date(); if (d.getMinutes() !== lastMin) { lastMin = d.getMinutes(); const p2 = phaseOf(d); if (p2 !== ph) { ph = p2; V = ville(EW, EH, ph, pluie); rebuild(); } }
      const B = R.work; B.copy(R.stat); B.G = 0; B.ox = 0;
      const dyn = [], O = G.obj, on = ph !== "jour", M = mouse;
      inp.moved = !!(M && inp.mouse && (Math.abs(M.x - inp.mouse.x) + Math.abs(M.y - inp.mouse.y)) > 0.4); inp.mouse = M;
      // ---- la ville : parallaxe selon la souris, puis ce qui bouge dehors
      const par = M ? Math.round((M.x - W / 2) / W * -6) : 0, ex0 = 7 + par;
      const flash = st.flash > 0 ? (st.flash > 0.42 || (st.flash < 0.3 && st.flash > 0.24) ? 1 : 0.15) : 0; st.flash = Math.max(0, st.flash - dt);
      for (let y = 0; y < EH; y++) for (let x = 0; x < wx1 - wx0; x++) { const q = (wy0 + y) * W + wx0 + x; if (B.z[q] !== Z.GLASS) continue; const e = (y * EW + cl(x + ex0, 0, EW - 1)) * 3; B.c[q * 3] = V.E.c[e] + flash * 150; B.c[q * 3 + 1] = V.E.c[e + 1] + flash * 160; B.c[q * 3 + 2] = V.E.c[e + 2] + flash * 190; }
      const gl = (x, y, c, a) => { x = Math.round(x); y = Math.round(y); if (x < wx0 || x >= wx1 || y < wy0 || y >= wy1) return; const q = y * W + x; if (B.z[q] !== Z.GLASS) return; const cc = rgb(c), k = a == null ? 1 : a; B.c[q * 3] += (cc[0] - B.c[q * 3]) * k; B.c[q * 3 + 1] += (cc[1] - B.c[q * 3 + 1]) * k; B.c[q * 3 + 2] += (cc[2] - B.c[q * 3 + 2]) * k; };
      const tX = wx0 + V.tx - ex0, tY = wy0 + V.ty;
      if (on) {
        const heure = d.getMinutes() < 5 && ph === "nuit"; st.sparkle = Math.max(0, st.sparkle - dt);
        if (heure || st.sparkle > 0) for (let i = 0; i < 26; i++) { const u = h01(i * 3.3 + Math.floor(t * 9) * 1.7), yy = Math.round(u * V.th), hw = 0.6 + Math.pow(u, 2.3) * 9.5; gl(tX + (h01(i * 7.1 + Math.floor(t * 9)) - 0.5) * 2 * hw, tY + yy, "#ffffff"); }
        const a = t * 0.9, bx2 = Math.cos(a), len = 46; if (Math.abs(bx2) > 0.15) for (let i = 2; i < len; i++) gl(tX + bx2 * i, tY - 4 - Math.abs(Math.sin(a)) * i * 0.12, "#fff6d0", 0.34 * (1 - i / len));
        if ((t % 2.2) < 1.1) gl(tX, tY - 6, "#ff4a3a");
        const px = wx0 + ((t * 7) % (wx1 - wx0 + 60)) - 30; if (Math.floor(t * 2) % 2) gl(px, wy0 + 16 + Math.sin(t * 0.2) * 4, "#ff5a4a"); gl(px + 2, wy0 + 16 + Math.sin(t * 0.2) * 4, "#e8eeff", 0.8);
        if (Math.floor(t * 1.4) % 3) for (let i = 0; i < 12; i++) gl(wx0 + Math.round(EW * 0.5) - ex0 - 1 + i, wy0 + V.HZ - 3 + 2, "#ff5a4a", 0.25);
      }
      // pigeons sur l'appui, dehors
      for (const b of birds) {
        if (!b.fly && M && Math.hypot(M.x - b.x, M.y - b.y) < 20) { b.fly = 1; b.vx = (b.x < M.x ? -1 : 1) * (36 + b.i * 6); b.vy = -40 - b.i * 5; b.back = t + 12 + b.i * 3; }
        if (b.fly === 1) { b.x += b.vx * dt; b.y += b.vy * dt; if (t > b.back) { b.fly = 2; b.x = b.hx + (b.i % 2 ? 60 : -60); b.y = wy0 - 4; } }
        else if (b.fly === 2) { const ddx = b.hx - b.x, ddy = wy1 - 1 - b.y, dd = Math.hypot(ddx, ddy); if (dd < 2) { b.fly = 0; b.x = b.hx; b.y = wy1 - 1; } else { b.x += ddx / dd * 50 * dt; b.y += ddy / dd * 50 * dt; } }
        const c = ["#8a8f9a", "#6f7480", "#a8a2a0"][b.i], x = Math.round(b.x), y = Math.round(b.y);
        if (!b.fly) { const peck = Math.sin(t * 1.7 + b.i * 2.1) > 0.86; for (let i = -2; i < 2; i++) { gl(x + i, y - 1, c); gl(x + i, y - 2, c); } gl(x + (peck ? 2 : 1), y - (peck ? 1 : 3), sh(c, 24)); gl(x + (peck ? 3 : 2), y - (peck ? 1 : 3), "#d98a3a"); gl(x - 3, y - 1, sh(c, -24)); }
        else { const up = Math.floor(t * 9 + b.i) % 2; for (let i = -1; i < 2; i++) gl(x + i, y, c); gl(x + 2, y, sh(c, 24)); if (up) { gl(x - 1, y - 1, sh(c, 30)); gl(x, y - 2, sh(c, 30)); gl(x + 1, y - 1, sh(c, 30)); } else { gl(x - 1, y + 1, sh(c, -20)); gl(x + 1, y + 1, sh(c, -20)); } }
      }
      // pluie ou neige sur la vitre, gouttes qui glissent
      if (pluie) {
        const neige = saison === "hiver";
        for (let i = 0; i < 70; i++) { const sp = neige ? 14 + h01(i) * 10 : 120 + h01(i * 1.3) * 50, x0 = wx0 + h01(i * 7.7) * (wx1 - wx0 + 30), y = wy0 + ((h01(i * 3.1) * EH + t * sp) % EH), x = x0 - (y - wy0) * (neige ? Math.sin(t + i) * 0.1 : 0.22); if (neige) gl(x, y, "#ffffff", 0.85); else for (let k = 0; k < 3; k++) gl(x - k * 0.22, y + k, "#b8c8e0", 0.32); }
        if (!neige) for (let i = 0; i < 9; i++) { const T0 = 5 + h01(i * 2.7) * 6, u = ((t + h01(i * 5.1) * T0) % T0) / T0, x = wx0 + 6 + h01(i * 9.9) * (wx1 - wx0 - 12) + Math.sin(u * 14 + i) * 1.2, y = wy0 + u * u * EH; gl(x, y, "#dfeaff", 0.7); gl(x, y - 1, "#b8c8e0", 0.35); gl(x, y - 2, "#b8c8e0", 0.2); }
      }
      // reflet de la lampe dans la vitre
      if (st.lampe && on) for (let i = -6; i <= 6; i++) for (let j = 0; j < 4; j++) gl(O.lampe.x + i - par, wy1 - 20 + j, j < 2 ? "#57c890" : "#fff2c4", 0.14);

      // ---- le mur : horloge à l'heure, cadre, robe
      B.mat(Z.WALL, 255, 0);
      const hg = G.horloge; B.ell(hg.x, hg.y, hg.r, hg.r, "#b8924a"); B.ell(hg.x, hg.y, hg.r - 1.6, hg.r - 1.6, "#efe8d6"); for (let k = 0; k < 12; k++) B.px(hg.x + Math.sin(k * Math.PI / 6) * (hg.r - 3), hg.y - Math.cos(k * Math.PI / 6) * (hg.r - 3), "#5a4a3a");
      st.spin = Math.max(0, st.spin - dt); const spin = st.spin > 0 ? (1.2 - st.spin) * 10 : 0, am = (d.getMinutes() + d.getSeconds() / 60) / 60 * 6.283 + spin * 6, ah = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * 6.283 + spin;
      B.line(hg.x, hg.y, hg.x + Math.sin(ah) * (hg.r - 5), hg.y - Math.cos(ah) * (hg.r - 5), "#1d1d22"); B.line(hg.x, hg.y, hg.x + Math.sin(am) * (hg.r - 3), hg.y - Math.cos(am) * (hg.r - 3), "#1d1d22"); const as = d.getSeconds() / 60 * 6.283; B.px(hg.x + Math.sin(as) * (hg.r - 3), hg.y - Math.cos(as) * (hg.r - 3), "#c8323a"); B.px(hg.x, hg.y, "#c8323a");
      const cd = G.cadre; for (let y = 0; y < cd.h; y++) for (let x = 0; x < cd.w; x++) { const yy = cd.y + y + Math.round((x - cd.w / 2) * 0.12 * st.cadre), bord = x < 2 || y < 2 || x >= cd.w - 2 || y >= cd.h - 2; B.px(cd.x + x, yy, bord ? (x < 1 || y < 1 ? "#e6c47a" : "#b8924a") : y === 5 && x > 6 && x < cd.w - 7 ? "#3a3a44" : (y === 9 || y === 12 || y === 15) && x > 4 && x < cd.w - 5 - (y === 15 ? 8 : 0) ? "#a8a290" : "#efe8d6"); } B.ell(cd.x + cd.w - 7, cd.y + cd.h - 6 + Math.round((cd.w / 2 - 7) * 0.12 * st.cadre), 2, 2, "#b3261e");
      st.robe = Math.max(0, st.robe - dt); const pt = G.patere, sw = Math.sin(t * 7) * st.robe * 1.6;
      B.mat(Z.FURN, 255, 0); B.r(pt.x, pt.y, 2, FY + 10 - pt.y, "#3a2618"); B.r(pt.x, pt.y, 1, FY + 10 - pt.y, "#5a3e28"); B.r(pt.x - 6, FY + 8, 14, 2, "#241710"); B.r(pt.x - 5, pt.y + 2, 12, 1, "#5a3e28"); B.px(pt.x - 6, pt.y + 1, "#5a3e28"); B.px(pt.x + 7, pt.y + 1, "#5a3e28");
      for (let y = 0; y < 62; y++) { const w = 5 + Math.min(6, y * 0.3) + (y > 40 ? (y - 40) * 0.08 : 0), ox = Math.round(sw * (y / 62)); for (let x = -Math.round(w); x <= Math.round(w); x++) { const f = Math.sin(x * 1.1 + y * 0.08); B.px(pt.x + x + ox, pt.y + 4 + y, f > 0.6 ? "#34343e" : f < -0.6 ? "#16161c" : "#24242c"); } if (y > 3 && y < 22) { B.px(pt.x - 1 + ox, pt.y + 4 + y, "#efe8d6"); B.px(pt.x + ox, pt.y + 4 + y, "#efe8d6"); B.px(pt.x + 1 + ox, pt.y + 4 + y, "#c8c2b2"); } if (y > 8 && y < 44) { B.px(pt.x - 5 + ox, pt.y + 4 + y, "#1a1a20"); if (y > 36) B.px(pt.x - 5 + ox, pt.y + 4 + y, "#efe8d6"); } }
      // radio
      if (G.radio) { const r = G.radio; B.mat(Z.FURN, 255, 0); B.r(r.x, r.y, r.w, r.h, "#7a4a2a"); B.r(r.x, r.y, r.w, 1, "#a8703f"); B.r(r.x + 2, r.y + 3, 10, 7, "#3a2a1c"); B.dith(r.x + 2, r.y + 3, 10, 7, "#5a4028", 0.5); B.mat(Z.FURN, st.radio ? 0 : 255, st.radio ? 255 : 0); B.r(r.x + 14, r.y + 3, 8, 4, st.radio ? "#ffd27a" : "#a89a70"); B.mat(Z.FURN, 255, 0); B.px(r.x + 15 + Math.round((Math.sin(t * 0.3) + 1) * 3), r.y + 4, "#c8323a"); B.px(r.x + 16, r.y + 9, "#d8d0c0"); B.px(r.x + 20, r.y + 9, "#d8d0c0"); B.r(r.x + r.w - 2, r.y - 9, 1, 9, "#9a9aa2");
        if (st.radio) { if (Math.random() < dt * 2.2) st.notes.push({ x: r.x + 6 + Math.random() * 10, y: r.y - 2, t: 0, k: Math.random() < 0.5 }); } }
      for (const n of st.notes) { n.t += dt; const x = Math.round(n.x + Math.sin(n.t * 3) * 3), y = Math.round(n.y - n.t * 9); B.mat(Z.ACT, 0, 255); const c = n.k ? "#ffd27a" : "#9fd0ff"; B.px(x, y, c, 1 - n.t / 2.4); B.px(x, y - 1, c, 1 - n.t / 2.4); B.px(x, y - 2, c, 1 - n.t / 2.4); B.px(x + 1, y - 2, c, 1 - n.t / 2.4); B.px(x - 1, y + 1, c, 1 - n.t / 2.4); B.px(x, y + 1, c, 1 - n.t / 2.4); } st.notes = st.notes.filter((n) => n.t < 2.4);
      // livres tombés
      for (const b of st.livres) { if (!b.rest) { b.vy += 300 * dt; b.y += b.vy * dt; b.r += dt * 6; if (b.y > FY + 12) { b.y = FY + 12; b.rest = true; son("papier"); } } B.mat(Z.OBJ, 255, 0); if (b.rest) { B.r(b.x - 4, b.y - 2, 9, 3, b.c); B.r(b.x - 4, b.y - 2, 9, 1, sh(b.c, 30)); B.r(b.x - 3, b.y, 7, 1, "#efe8d6"); } else B.r(b.x - 2, b.y - 5, 4, 9, b.c); }

      // ---- le bureau : orchidée, téléphone, vapeur, tampon
      B.mat(Z.OBJ, 255, 0);
      const fl = [[0, -34], [2, -31], [-2, -29], [2, -26], [-1, -23]]; for (let i = 0; i < fl.length; i++) { const fx = O.plante.x + 1 + fl[i][0] + Math.round(Math.sin(t * 0.8 + i) * 0.3), fy = dy + fl[i][1]; B.px(fx, fy, "#f6d8ea"); B.px(fx - 1, fy, "#e8a8d0"); B.px(fx + 1, fy, "#f6d8ea"); B.px(fx, fy - 1, "#f6d8ea"); B.px(fx, fy + 1, "#e8a8d0"); B.px(fx, fy, "#c8327a"); }
      for (const p of st.petals) { p.t += dt; B.px(p.x + Math.sin(p.t * 4) * 3, Math.min(dy - 1, p.y + p.t * 14), "#f6d8ea"); } st.petals = st.petals.filter((p) => p.t < 6);
      st.nextRing -= dt; if (st.nextRing < 0 && st.ring <= 0) { st.ring = 6; st.nextRing = 40 + Math.random() * 40; }
      if (st.ring > 0) { st.ring -= dt; const k = Math.floor(t * 14) % 2, burst = (st.ring % 2) > 0.8; if (burst) { if (Math.floor(t * 3) !== st.lastDring) { st.lastDring = Math.floor(t * 3); son("dring"); } B.mat(Z.OBJ, 0, 255); B.r(O.tel.x + 4, dy - 4, 5, 2, k ? "#9fe0ff" : "#4a9ad8"); for (const s of [-1, 1]) { B.px(O.tel.x + 6 + s * 9, dy - 10 - k, "#fff2c4"); B.px(O.tel.x + 6 + s * 11, dy - 12 + k, "#fff2c4"); B.px(O.tel.x + 6 + s * 10, dy - 7, "#fff2c4"); } dyn.push({ x: O.tel.x + 6, y: dy - 6, r: 30, c: [0.5, 0.8, 1], i: 0.8, haze: 0.2, hr: 12 }); if (cat.st === "dodo") { cat.st = cat.on === "sol" ? "assis" : "miche"; cat.until = cat.t + 5; } } }
      B.mat(Z.ACT, 0, 200); st.steam = Math.max(0, st.steam - dt); for (let i = 0; i < 3; i++) { const u = ((t * 0.5 + i * 0.33) % 1), x = O.tasse.x + 2 + Math.sin(u * 6 + i * 2) * 1.4, y = dy - 8 - u * (9 + st.steam * 6); B.px(x, y, "#e8eef8", (1 - u) * (0.3 + st.steam * 0.4)); }
      // tampon : au repos ou en plein jeu
      const tsx = O.tampon.x + 2;
      if (jeu.on) {
        jeu.t -= dt; jeu.next -= dt; jeu.slam = Math.max(0, jeu.slam - dt);
        if (jeu.next < 0) { jeu.feuilles.push({ x: dx0 + 4, ok: false, v: 34 + Math.min(26, jeu.n * 2) }); jeu.next = Math.max(0.55, 1.15 - jeu.n * 0.03); }
        B.mat(Z.OBJ - 1, 255, 0);
        for (const f of jeu.feuilles) { f.x += f.v * dt; B.r(f.x, dy - 1, 11, 2, "#f6f2e7"); B.r(f.x + 1, dy - 2, 11, 1, "#fffdf6"); B.r(f.x + 2, dy - 2, 5, 1, "#b8b2a4"); if (f.ok) { B.r(f.x + 6, dy - 2, 4, 2, "#c8323a"); } }
        jeu.feuilles = jeu.feuilles.filter((f) => f.x < dx1 - 12);
        const up = jeu.slam > 0 ? 0 : 7; B.r(tsx - 2, dy - 4 - up, 5, 3, "#6a4428"); B.r(tsx - 1, dy - 8 - up, 3, 4, "#8a5c38"); B.r(tsx - 2, dy - 10 - up, 5, 2, "#a87a4a"); B.r(tsx - 2, dy - 1 - up, 5, 1, "#a02630");
        B.mat(Z.ACT, 0, 255); B.r(dx0, dy + 6, Math.round((dx1 - dx0 - 48) * Math.max(0, jeu.t) / 24), 1, "#f2b45a"); B.txt(String(jeu.n), tsx - 2, dy - 30, "#f6c96d");
        if (jeu.t <= 0) { jeu.on = false; pop(jeu.n + " DOSSIERS VISES", ax, dy - 30); if (jeu.n > (best.tampon || 0)) { best.tampon = jeu.n; mem.set(best); st.record = 3; } }
      } else { B.mat(Z.OBJ, 255, 0); B.r(tsx - 2, dy - 5, 5, 3, "#6a4428"); B.r(tsx - 1, dy - 9, 3, 4, "#8a5c38"); B.r(tsx - 2, dy - 11, 5, 2, "#a87a4a"); }

      // ---- clics sur les objets
      inp.used = false; inp.laser = st.laser; inp.ball = !ball.home && !ball.held ? ball : null; inp.caught = null;
      // ---- la boulette
      if (ball.held && M) { const dx = M.x - ball.gx, dyy = M.y - ball.gy, dd = Math.hypot(dx, dyy), k = dd > 24 ? 24 / dd : 1; ball.x = ball.gx + dx * k; ball.y = ball.gy + dyy * k; B.mat(Z.ACT, 0, 255); for (let i = 1; i < 6; i++) B.px(ball.gx - dx * k * i * 0.5, ball.gy - dyy * k * i * 0.5 + i * i * 0.9, "#f6c96d", 0.9 - i * 0.12); }
      else if (!ball.rest) {
        ball.t += dt; ball.vy += 300 * dt; const py = ball.y; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        const bn = G.bin; if (ball.vy > 0 && py <= bn.y && ball.y >= bn.y && ball.x > bn.x && ball.x < bn.x + bn.w) { best.paniers = (best.paniers || 0) + 1; mem.set(best); pop("PANIER ! " + best.paniers, bn.x + 6, bn.y - 12); son("bien"); homeBall(); }
        else { if (ball.x < monde.x0 - 20) { ball.x = monde.x0 - 20; ball.vx *= -0.5; } if (ball.x > W - 4) { ball.x = W - 4; ball.vx *= -0.5; } const fy = FY + 14 + ((ball.x * 7) % 5); if (ball.y > fy) { ball.y = fy; ball.vy *= -0.42; ball.vx *= 0.7; if (Math.abs(ball.vy) < 26) { ball.vy = 0; ball.vx = 0; ball.rest = true; ball.t = 0; } } }
      } else if (!ball.home) { ball.t += dt; if (ball.t > 9) homeBall(); }
      TM.update(cat, dt, monde, inp);
      if (inp.caught === "ball") { ball.vx = (Math.random() < 0.5 ? -1 : 1) * (70 + Math.random() * 60); ball.vy = -90; ball.rest = false; ball.t = 0; }
      if (inp.caught === "laser") { best.prises = (best.prises || 0) + 1; mem.set(best); }
      if (inp.click && !inp.used) { for (const [k, z] of zones()) if (hit(z, inp.cx, inp.cy)) { act(k); break; } }
      inp.click = false;
      // le chat : derrière les objets du bureau quand il est sur l'appui
      B.G = cat.on === "appui" && cat.st !== "saut" ? Z.FURN : Z.FG; TM.draw(B, cat, Z.ACT); B.G = Z.FG;
      // boulette
      B.mat(Z.ACT, 255, 0); { const x = Math.round(ball.x), y = Math.round(ball.y); B.r(x - 1, y - 2, 3, 3, "#efe9da"); B.px(x - 2, y - 1, "#efe9da"); B.px(x + 2, y - 1, "#cfc8b6"); B.px(x, y - 3, "#efe9da"); B.px(x + 1, y, "#b8b2a4"); B.px(x, y - 1, "#b8b2a4"); }
      // point lumineux
      if (st.laser && M) { B.mat(Z.ACT, 0, 255); B.px(M.x, M.y, "#ff3a3a"); B.px(M.x + 1, M.y, "#ff8a7a", 0.7); B.px(M.x - 1, M.y, "#ff8a7a", 0.7); B.px(M.x, M.y - 1, "#ff8a7a", 0.7); B.px(M.x, M.y + 1, "#ff8a7a", 0.7); dyn.push({ x: M.x, y: M.y, r: 12, c: [1, 0.15, 0.1], i: 1.2, haze: 0.5, hr: 6 }); }
      // bulles et annonces
      B.mat(Z.ACT, 0, 255); B.G = 0;
      const bulle = (lines, x, y, a) => { const w = Math.max(...lines.map((l) => l.length)) * 4 + 5, h = lines.length * 7 + 4, x0 = cl(Math.round(x - w / 2), 2, W - w - 2), y0 = Math.max(2, Math.round(y - h)); B.r(x0, y0, w, h, "#fbf3e6", a); B.r(x0 + 1, y0 - 1, w - 2, 1, "#fbf3e6", a); B.r(x0 + 1, y0 + h, w - 2, 1, "#fbf3e6", a); B.px(cl(Math.round(x), x0 + 2, x0 + w - 3), y0 + h + 1, "#fbf3e6", a); lines.forEach((l, i) => B.txt(l, x0 + 3, y0 + 3 + i * 7, "#1d1d22", a)); };
      if (st.bulle) { st.bulle.t += dt; if (st.bulle.t > 4.5) st.bulle = null; else bulle(st.bulle.l, st.bulle.x, st.bulle.y, 1); }
      if (st.score) { st.score.t += dt; if (st.score.t > 1.8) st.score = null; else { const s = st.score, w = s.txt.length * 4; B.txt(s.txt, cl(Math.round(s.x - w / 2), 2, W - w - 2), Math.round(s.y - s.t * 6), "#f6c96d", 1 - Math.max(0, s.t - 1.2) / 0.6); } }
      // repères des mini-jeux : flèche dorée qui sautille, halo, nom au survol
      if (!jeu.on && !st.laser) {
        const reps = [["tampon", O.tampon.x + 2, dy - 15, "TAMPON"], ["code", O.code.x + 3, dy - 19, "QUIZ"], ["laser", O.laser.x + 4, dy - 8, "TIMON"]];
        if (ball.rest && !ball.held) reps.push(["boulette", ball.x, ball.y - 7, "BOULETTE"]);
        reps.forEach(([k, x, y, nom], i) => {
          const b = Math.round(Math.abs(Math.sin(t * 3 + i * 0.9)) * 3), yy = y - 3 - b, c = Math.floor(t * 4 + i) % 2 ? "#ffd97a" : "#f3b23c";
          B.mat(5, 0, 255); B.r(x - 2, yy - 3, 5, 1, c); B.r(x - 1, yy - 2, 3, 1, c); B.px(x, yy - 1, c); B.px(x, yy - 5, c); B.px(x, yy - 4, c);
          dyn.push({ x, y: y + 4, r: 20, c: [1, 0.8, 0.4], i: 0.35 + 0.2 * Math.sin(t * 3 + i * 0.9) });
          if (M && Math.hypot(M.x - x, M.y - (y + 4)) < 10) { const w = nom.length * 4 + 3; B.r(x - (w >> 1), yy - 14, w, 7, "#0b0f1e"); B.txt(nom, x - (w >> 1) + 2, yy - 13, "#ffd97a"); }
        });
      }
      R.frame({ amb: AMB[ph].map((v) => v + flash * 0.5), dyn, wet: 0.5, t, YR: FY, YB: FY, mist: null, glow: on ? 1 : 0.3 });
    };
    S.present = (ctx) => R.present(ctx, W * sc, H * sc);
    return S;
  }
  CR.accueil = { Scene, question, ville, phaseOf, seasonOf, mem }; // ville, phaseOf, seasonOf, mem : repris par plan-accueil.js

  // ------------------------------------------------------------------ composant (remplace UI.TitleArt de title.js)
  UI.TitleArt = () => {
    const ref = useRef(null), sref = useRef(null);
    const [quiz, setQuiz] = useState(null);
    const [rep, setRep] = useState(null);
    const [serie, setSerie] = useState(0);
    useEffect(() => {
      const c = ref.current; if (!c) return;
      const ctx = c.getContext("2d"), reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      let S = null, raf = 0, alive = true, last = 0, to = 0; const t0 = performance.now(), mouse = { v: null };
      const layout = () => { const vw = Math.max(320, window.innerWidth || 1024), vh = Math.max(320, window.innerHeight || 768); try { S = Scene(vw, vh); } catch (e) { console.error(e); S = null; return; } sref.current = S; S.quiz = (q) => { if (q) { setRep(null); setQuiz(q); } }; c.width = S.W * S.sc; c.height = S.H * S.sc; c.style.width = c.width + "px"; c.style.height = c.height + "px"; try { S.frame(0.05, null); S.present(ctx); } catch (e) { console.error(e); } };
      layout();
      const pos = (e) => { const r = c.getBoundingClientRect(); return r.width ? { x: (e.clientX - r.left) / r.width * S.W, y: (e.clientY - r.top) / r.height * S.H } : null; };
      const onMove = (e) => { if (!S) return; mouse.v = pos(e); if (mouse.v) c.style.cursor = S.cursorAt(mouse.v.x, mouse.v.y); };
      const onOut = () => { mouse.v = null; };
      const onDown = (e) => { const p = S && pos(e); if (p) S.down(p.x, p.y); };
      const onUp = (e) => { const p = S && pos(e); if (p) S.up(p.x, p.y); };
      const onClick = (e) => { const p = S && pos(e); if (p) S.click(p.x, p.y); };
      const onKey = (e) => { if (S && e.key && e.key.length === 1 && !/input|textarea|select/i.test((e.target && e.target.tagName) || "")) S.key(e.key.toLowerCase()); };
      const onResize = () => { clearTimeout(to); to = setTimeout(layout, 180); };
      c.addEventListener("mousemove", onMove); c.addEventListener("mouseleave", onOut); c.addEventListener("mousedown", onDown); window.addEventListener("mouseup", onUp); c.addEventListener("click", onClick); window.addEventListener("keydown", onKey); window.addEventListener("resize", onResize);
      const loop = (now) => { if (!alive) return; if (S && now - last > 48 && !document.hidden) { last = now; try { S.frame((now - t0) / 1000, mouse.v); S.present(ctx); } catch (e) { console.error(e); alive = false; return; } } raf = requestAnimationFrame(loop); };
      if (!reduce) raf = requestAnimationFrame(loop);
      return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(to); c.removeEventListener("mousemove", onMove); c.removeEventListener("mouseleave", onOut); c.removeEventListener("mousedown", onDown); window.removeEventListener("mouseup", onUp); c.removeEventListener("click", onClick); window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };
    }, []);
    const answer = (id) => { if (rep) return; const ok = id === quiz.id; setRep({ id, ok }); setSerie(ok ? serie + 1 : 0); try { CR.son && CR.son.jouer(ok ? "bien" : "erreur"); } catch (e) { /* muet */ } };
    return html`<${React.Fragment}>
      <canvas ref=${ref} className="ts-canvas acc-canvas" aria-hidden="true" />
      ${!quiz && html`<div className="acc-jeux" role="group" aria-label="Mini-jeux de l'accueil">
        <span className="acc-jeux-t">Mini-jeux</span>
        ${[["boulette", "Boulette", "Attrapez la boulette sur le bureau, tirez, lâchez : visez la corbeille"], ["tampon", "Tampon", "24 secondes : cliquez quand une feuille passe sous le tampon"], ["code", "Quiz éclair", "Retrouvez l'article du code"], ["laser", "Timon", "Le point lumineux suit la souris : Timon le chasse. Recliquez sur le pointeur du bureau pour l'éteindre"]].map(([k, nom, aide]) => html`<button key=${k} type="button" className="ts-btn ts-btn-sm" title=${aide} onClick=${() => sref.current && sref.current.start(k)}>${nom}</button>`)}
      </div>`}
      ${quiz && html`<div className="acc-quiz" role="dialog" aria-label="Quiz éclair du code pénal">
        <p className="acc-quiz-top"><span>Quiz éclair</span>${serie > 1 && html`<b>Série de ${serie}</b>`}</p>
        <p className="acc-quiz-q">« ${quiz.extrait} »</p>
        <p className="acc-quiz-ask">Quel article ?</p>
        <div className="acc-quiz-ch">${quiz.choix.map((ch) => html`<button key=${ch.id} type="button" disabled=${!!rep} className=${UI.cx("acc-quiz-btn", rep && ch.id === quiz.id && "ok", rep && rep.id === ch.id && !rep.ok && "bad")} onClick=${() => answer(ch.id)}>${ch.cite}</button>`)}</div>
        <div className="acc-quiz-foot">${rep && html`<span className=${rep.ok ? "ok" : "bad"}>${rep.ok ? "Exact." : "Raté."}</span>`}${rep && html`<button type="button" className="ts-btn ts-btn-sm" onClick=${() => { setRep(null); setQuiz(question()); }}>Encore</button>`}<button type="button" className="ts-btn ts-btn-sm" onClick=${() => { setQuiz(null); setRep(null); }}>Fermer</button></div>
      </div>`}
    </${React.Fragment}>`;
  };
})();
