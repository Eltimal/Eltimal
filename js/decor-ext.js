/* La Permanence — les décors extérieurs : un décor propre à chaque lieu.
   Tribunal de Paris (Batignolles), Palais de la Cité, Maison du barreau, commissariat du 18e, gendarmerie de Montlhéry,
   Hôtel-Dieu (UMJ), SPIP, étude de commissaires de justice, cinq prisons (la Santé, Fresnes, Fleury-Mérogis, Melun, Poissy),
   lieux des faits et rue. Le monument reste au centre, la ville se prolonge de chaque côté selon la largeur de l'écran. */
(function () {
  const CR = window.CR;
  const D = CR.dec;
  const SC = D.SC;
  const { shade, pick } = D;
  const WARM = ["#ffe2a0", "#ffd27a", "#ffeab8", "#f6c866"];

  // ---------------------------------------------------------------- éléments communs
  const hill = (S, base, amp, f, ph, col, bottom) => { for (let x = 0; x < S.W; x++) { const h = Math.round(amp * (0.6 * Math.sin(x * f + ph) + 0.4 * Math.sin(x * f * 2.3 + ph * 1.7)) + amp); S.r(x, base - h, 1, bottom - (base - h), col); } };
  const roof = (S, x, w, base, h, col, hi) => { for (let k = 0; k < h; k++) { const rw = Math.max(2, Math.round(w * (k + 1) / h)); S.r(x + Math.round((w - rw) / 2), base - h + k, rw, 1, k === 0 && hi ? hi : col); } };
  const barbed = (S, x, y, w) => { S.dith(x, y, w, 2, "#8a8e96", 2, 0); S.hl(x, y + 2, w, "#3a3a40"); for (let i = 0; i < w; i += 4) S.p(x + i, y - 1, "#6a6e76"); };
  const mast = (S, x, gy, h) => {
    S.vl(x, gy - h, h, "#5a5e66"); S.r(x - 3, gy - h - 2, 7, 2, "#3a3d44");
    if (S.dark) { S.er(x - 3, gy - h, 7, 1, "#fff0c0"); S.glow(x, gy - h, 14, "255,240,190", 0.5); for (let k = 0; k < 7; k++) S.er(x - 5 - k * 2, gy - h + 3 + k * 3, 11 + k * 4, 1, `rgba(255,240,190,${(0.12 - k * 0.014).toFixed(3)})`); }
    else S.er(x - 3, gy - h, 7, 1, "#9a9ea6");
  };
  const trees = (S, gy, from, step, h) => { for (let dx = from, i = 0; dx < S.cx + 14; dx += step, i++) for (const sg of [-1, 1]) { const x = S.cx + sg * dx; if (x > -8 && x < S.W + 8) D.tree(S, x, gy + 3, h + (i % 3) * 2); } };
  const lamps = (S, gy, from, step, h) => { for (let dx = from, i = 0; dx < S.cx + 14; dx += step, i++) for (const sg of [-1, 1]) { const x = S.cx + sg * dx; if (x > -4 && x < S.W + 4) D.lamp(S, x, gy + 4, h); } };
  const rainAll = (S) => D.rain(S, 0, 0, S.W, 80, { splashTop: 58 });
  const lowSide = (S, gy, fl) => (x, w, R) => D.modern(S, x, w, gy, R, { floors: fl + Math.floor(R() * 2), band: R() < 0.5 });
  const maison = (S, x, w, gy, R) => {
    const h = 16 + Math.floor(R() * 4), wall = pick(R, ["#e8dcc4", "#d9c8a8", "#e0d4c0", "#cfc2a8", "#e6d8b8"]), rc = R() < 0.6 ? "#9a4a36" : "#4a5468";
    S.r(x, gy - h, w, h, wall); S.vl(x + w - 1, gy - h, h, shade(wall, -22));
    roof(S, x - 1, w + 2, gy - h, 8, rc, shade(rc, 20));
    if (R() < 0.7) { S.r(x + 2, gy - h - 10, 3, 5, "#a87a5e"); }
    const lit = (q) => S.lit && R() < S.lit * 1.4;
    for (const wx of [x + 3, x + w - 6]) { if (lit()) S.er(wx, gy - h + 4, 3, 4, pick(R, WARM)); else { S.r(wx, gy - h + 4, 3, 4, "#8ea6bf"); S.hl(wx, gy - h + 4, 3, "#c8d8e6"); } S.hl(wx - 1, gy - h + 8, 5, shade(wall, -26)); }
    S.r(x + (w >> 1) - 2, gy - 8, 4, 8, "#5a3a28"); S.dith(x - 1, gy - 3, w + 2, 3, "#4a7a3a", 2, 0);
  };
  const sacre = (S, x, base) => {
    S.r(x - 13, base - 9, 26, 9, "#e6e1d2"); S.vl(x + 12, base - 9, 9, "#bdb8a8");
    for (const [dx, r, dy] of [[-9, 4, 10], [9, 4, 10], [0, 7, 15]]) { S.circ(x + dx, base - dy, r, "#f0ece0"); S.dith(x + dx - r, base - dy - r, r, r, "#cfcab8", 3, 1); }
    S.vl(x, base - 24, 3, "#d6b25a"); S.r(x - 2, base - 17, 5, 4, "#d8d3c2"); S.r(x + 15, base - 20, 4, 20, "#dedacb"); S.r(x + 15, base - 22, 4, 2, "#c4bfae");
    if (S.lit) S.er(x - 1, base - 6, 2, 3, "#ffd98a");
  };
  const notre = (S, x, base) => {
    const st = "#b9b3a1", st2 = "#a39d8b";
    for (const dx of [0, 15]) { S.r(x + dx, base - 28, 9, 28, st); S.vl(x + dx + 8, base - 28, 28, st2); S.r(x + dx + 2, base - 22, 2, 8, "#5f6672"); S.r(x + dx + 5, base - 22, 2, 8, "#5f6672"); S.hl(x + dx - 1, base - 28, 11, "#cfc9b6"); S.dith(x + dx, base - 30, 9, 2, st2, 2, 0); }
    S.r(x + 9, base - 20, 6, 20, "#c4beac"); for (let q = 0; q < 3; q++) S.r(x + 10 + q * 2, base - 18, 1, 6, "#5f6672");
    for (let k = 0; k < 18; k++) S.r(x + 11 - Math.floor(k / 9), base - 46 + k, 1 + Math.floor(k / 9) * 2, 1, "#4a5468");
    S.p(x + 12, base - 47, "#d6b25a");
  };

  // ---------------------------------------------------------------- Tribunal de Paris, aux Batignolles
  SC.palais = (S) => {
    const { cx } = S, gy = 50;
    D.sky(S, gy);
    D.far(S, gy - 2, { hz: 18, seed: "p" });
    D.sides(S, gy, 80, 74, { wmin: 18, fn: (x, w, R) => D.modern(S, x, w, gy, R, {}) });
    D.tourT(S, cx - 2, gy - 12, 0.8);
    S.r(cx - 74, gy - 14, 126, 14, "#d6d1c4"); S.hl(cx - 74, gy - 14, 126, "#eeeae0"); S.hl(cx - 74, gy - 13, 126, "#a8a396");
    S.dith(cx - 74, gy - 17, 126, 3, "#5f8a4e", 2, 0);
    S.r(cx - 72, gy - 11, 122, 7, "#6f93b8");
    for (let x = cx - 72; x < cx + 50; x += 6) S.vl(x, gy - 11, 7, "#eeeae0");
    S.dith(cx - 72, gy - 11, 122, 3, "#9dbbd6", 3, 0);
    if (S.lit) for (let x = cx - 70; x < cx + 48; x += 6) if (D.h01(x + 3) < S.lit * 1.6) S.er(x, gy - 10, 5, 5, "#ffe0a0");
    S.hl(cx - 74, gy - 4, 126, "#9e998c");
    S.r(cx - 32, gy - 13, 38, 3, "#23262e"); S.r(cx - 28, gy - 10, 30, 10, "#1c2330");
    if (S.dark || S.rain) S.er(cx - 26, gy - 9, 26, 9, "#d8b36a"); else S.r(cx - 26, gy - 9, 26, 9, "#4a6a88");
    for (let x = cx - 26; x < cx; x += 6) S.vl(x, gy - 9, 9, "#1c2330");
    D.plate(S, cx - 34, gy - 22, 71, 7, (S.o && S.o.plaque) || "TRIBUNAL DE PARIS", "#23262e", "#f1ede2");
    D.flag(S, cx + 40, gy - 36, 9, 6, "fr"); D.flag(S, cx + 54, gy - 36, 9, 6, "ue");
    D.street(S, { walk: "#cfc8b8" });
    trees(S, gy, 100, 64, 22); lamps(S, gy, 62, 96, 19);
    D.queue(S, { x: cx - 24, y: S.Y.far, sz: 0, n: 4, gap: 6, kinds: ["avocat", "civil", "civil", "visiteur"] });
    D.crowd(S, { y: S.Y.far, sz: 0, n: 6, speed: 7, kinds: ["avocat", "civil", "agent"] });
    D.traffic(S, { n: 3, kinds: ["tram", "voiture", "taxi", "bus", "voiture"] });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 5, speed: 11, kinds: ["avocat", "avocat", "civil", "civil"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 3, speed: 15, kinds: ["avocat", "civil", "civil"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Palais de justice de l'Île de la Cité
  SC.cite = (S) => {
    const { cx } = S, gy = 50, gold = "#d6b25a";
    D.sky(S, gy);
    D.far(S, gy - 4, { hz: 14, seed: "c" });
    D.sides(S, gy, 104, 100, {});
    const sc = cx - 68;
    S.r(sc - 6, 24, 13, gy - 24, "#cfc3a6"); S.vl(sc - 6, 24, gy - 24, "#e0d6bc"); S.vl(sc + 6, 24, gy - 24, "#a89d82");
    for (let y = 28; y < 46; y += 9) { S.r(sc - 3, y, 2, 7, "#4a5a78"); S.r(sc + 1, y, 2, 7, "#4a5a78"); }
    for (let k = 0; k < 10; k++) S.r(sc - 7 + Math.floor(k * 0.4), 14 + k, 15 - Math.floor(k * 0.8), 1, "#4a5468");
    for (let k = 0; k < 13; k++) { const w = 1 + Math.floor(k / 4) * 2; S.r(sc - Math.floor(w / 2), 1 + k, w, 1, "#4a5468"); }
    S.p(sc, 0, gold); S.p(sc, 1, gold);
    const px = cx - 46, pw = 82;
    S.r(px, 24, pw, gy - 24, "#d8cdb2"); S.vl(px, 24, gy - 24, "#e8dfc6"); S.vl(px + pw - 1, 24, gy - 24, "#b3a88e");
    for (let k = 0; k < 6; k++) { const ins = k < 2 ? 2 - k : 0; S.r(px + ins, 18 + k, pw - ins * 2, 1, k === 0 ? "#7c8696" : "#5a6577"); }
    for (let wx = px + 3; wx < px + pw - 4; wx += 7) for (const wy of [28, 38]) { if (S.lit && D.h01(wx * 3 + wy) < S.lit * 1.5) S.er(wx, wy, 3, 6, "#ffd98a"); else { S.r(wx, wy, 3, 6, "#8ea6bf"); S.hl(wx, wy, 3, "#c8d8e6"); } S.hl(wx - 1, wy + 6, 5, "#b3a88e"); }
    S.r(cx - 18, 10, 28, 14, "#e2d8be");
    for (let k = 0; k < 6; k++) S.r(cx - 18 + (5 - k) * 2, 4 + k, 28 - (5 - k) * 4, 1, "#e9e0c8");
    for (let i = 0; i < 4; i++) { S.r(cx - 16 + i * 8, 10, 2, 14, "#f0e8d2"); S.vl(cx - 15 + i * 8, 10, 14, "#bfb59a"); }
    S.circ(cx - 4, 7, 2, gold);
    const tx = cx + 38;
    S.r(tx, 10, 12, gy - 10, "#cfc3a8"); S.vl(tx + 11, 10, gy - 10, "#a89d82"); S.r(tx - 1, 8, 14, 2, "#3a4254"); S.r(tx + 3, 4, 6, 4, "#3a4254"); S.p(tx + 6, 3, gold);
    S.circ(tx + 6, 19, 4, gold); S.circ(tx + 6, 19, 3, "#efe6c4"); S.p(tx + 6, 17, "#222"); S.p(tx + 6, 19, "#222"); S.p(tx + 7, 19, "#222");
    for (const [x0, top] of [[cx + 56, 24], [cx + 71, 20]]) {
      S.r(x0, top, 11, gy - top, "#bdb299"); S.vl(x0 + 9, top, gy - top, "#9a9078"); S.vl(x0, top, gy - top, "#cfc5ac");
      for (let k = 0; k < 10; k++) { const w = Math.max(1, Math.round(1 + k * 1.2)); S.r(x0 + 5 - Math.floor(w / 2), top - 10 + k, w, 1, "#3a4254"); }
      S.r(x0 + 4, top + 6, 1, 3, "#2a2c33"); S.r(x0 + 4, top + 14, 1, 3, "#2a2c33");
    }
    const g0 = cx - 80, g1 = cx + 54;
    for (let x = g0; x <= g1; x += 3) { S.vl(x, gy - 13, 13, "#16161a"); S.p(x, gy - 14, gold); }
    S.hl(g0, gy - 5, g1 - g0, "#16161a");
    for (let x = g0; x <= g1; x += 22) { S.r(x - 1, gy - 17, 4, 17, "#d0c5a8"); S.r(x - 2, gy - 18, 6, 2, gold); }
    S.r(cx - 12, gy - 15, 24, 15, "#16161a"); S.dith(cx - 12, gy - 15, 24, 15, gold, 3, 0); S.r(cx - 6, gy - 20, 12, 4, gold); S.dith(cx - 6, gy - 20, 12, 4, "#8a6a2a", 2, 0);
    D.street(S, { walk: "#b8b0a0" });
    trees(S, gy, 96, 60, 22); lamps(S, gy, 38, 76, 19);
    D.crowd(S, { y: S.Y.far, sz: 0, n: 7, speed: 7, kinds: ["avocat", "avocat", "civil", "agent", "civil"] });
    D.traffic(S, { n: 4, kinds: ["voiture", "taxi", "fourgon", "bus", "moto", "voiture"] });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 5, speed: 11, kinds: ["avocat", "civil", "avocat", "visiteur"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 3, speed: 15, kinds: ["avocat", "civil"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Maison du barreau, avec les bouquinistes du quai
  SC.ordre = (S) => {
    const { cx } = S, gy = 50;
    D.sky(S, gy - 10);
    D.far(S, gy - 12, { hz: 12, seed: "o", col: "#a4aebe" });
    const lw = cx - 34;
    S.r(0, gy - 12, lw, 2, "#b7ad96"); S.r(0, gy - 10, lw, 6, "#5b86b0"); S.dith(0, gy - 10, lw, 6, "#7aa3c8", 3, 0);
    S.r(0, gy - 4, lw, 4, "#c9bfa6"); S.hl(0, gy - 4, lw, "#e0d6bc"); S.hl(0, gy - 1, lw, "#a89d82");
    S.dyn.push((d, t) => { for (let i = 0; i < Math.round(lw / 10); i++) { const x = Math.round(D.mod(D.h01(i * 3.1) * lw + t * 2 * (1 + D.h01(i) ), lw)); d.ep(x, gy - 9 + (i % 4), "#d8e8f6"); } });
    for (let x = lw - 26; x > -20; x -= 26) {
      S.r(x, gy - 11, 18, 7, "#2f5a3a"); S.hl(x, gy - 11, 18, "#4a7a52"); S.r(x - 1, gy - 14, 20, 3, "#254630");
      S.r(x + 2, gy - 9, 14, 3, "#d9c8a0"); S.dith(x + 2, gy - 9, 14, 3, "#8a2f2f", 3, 0); S.dith(x + 2, gy - 9, 14, 3, "#27407a", 4, 1);
    }
    D.haus(S, cx - 34, 70, gy, CR.seeded("ordre"), { stone: "#d8ccb0", rez: "porte" });
    S.r(cx - 6, gy - 14, 12, 14, "#2a1e16"); S.r(cx - 4, gy - 15, 8, 1, "#2a1e16"); S.vl(cx, gy - 14, 14, "#4f3a28"); S.p(cx - 2, gy - 6, "#d6b25a"); S.p(cx + 2, gy - 6, "#d6b25a");
    if (S.dark) for (const x of [cx - 9, cx + 8]) { S.er(x, gy - 13, 2, 3, "#ffe3a0"); S.glow(x + 1, gy - 12, 8, "255,205,120", 0.5); }
    D.sign(S, { x: cx - 38, y: gy - 25, w: 78, h: 9 }, "MAISON DU BARREAU", { bg: "#1f3f86", fg: "#f4f3ee", frame: "#d6b25a", alt: ["ORDRE DES AVOCATS"] });
    D.flag(S, cx - 30, gy - 34, 8, 5, "fr"); D.flag(S, cx + 26, gy - 34, 8, 5, "ue");
    D.sides(S, gy, 9999, 36, {});
    D.street(S, { walk: "#b4ac9c" });
    D.tree(S, 18 + (cx % 40), gy + 3, 22); trees(S, gy, 120, 90, 22); lamps(S, gy, 48, 90, 19);
    D.crowd(S, { y: S.Y.far, sz: 0, n: 6, speed: 7, kinds: ["avocat", "avocat", "civil", "civil"] });
    D.traffic(S, { n: 3, kinds: ["moto", "taxi", "voiture", "moto"] });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 4, speed: 11, kinds: ["avocat", "civil", "avocat"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 3, speed: 15, kinds: ["civil", "avocat"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Commissariat central du 18e, Sacré-Cœur au loin
  SC.commissariat = (S) => {
    const { cx } = S, gy = 50;
    D.sky(S, gy);
    hill(S, gy - 16, 5, 0.04, 2, "#7f9a78", gy); hill(S, gy - 14, 3, 0.07, 5, "#6f8a68", gy);
    sacre(S, cx - 96, gy - 26);
    D.sides(S, gy, 62, 62, { fn: lowSide(S, gy, 2) });
    D.modern(S, cx - 60, 120, gy, CR.seeded("comm"), { floors: 5, fh: 6, band: true, col: "#cfc9b8" });
    S.r(cx - 60, gy - 12, 120, 12, "#e8e6e0"); S.hl(cx - 60, gy - 12, 120, "#9a978c");
    S.r(cx - 10, gy - 11, 20, 11, "#2a3342");
    if (S.dark || S.rain) S.er(cx - 9, gy - 10, 18, 10, "#d8c88a"); else S.r(cx - 9, gy - 10, 18, 10, "#5a7894");
    S.vl(cx, gy - 10, 10, "#2a3342"); S.r(cx - 14, gy - 13, 28, 2, "#2a58b8");
    D.plate(S, cx - 34, gy - 28, 68, 9, "POLICE NATIONALE", "#1f4aa8", "#f4f3ee");
    S.r(cx - 34, gy - 19, 23, 1, "#27407a"); S.r(cx - 11, gy - 19, 22, 1, "#f4f3ee"); S.r(cx + 11, gy - 19, 23, 1, "#c4352c");
    D.plate(S, cx - 61, gy - 10, 51, 7, "COMMISSARIAT", "#1f4aa8", "#f4f3ee"); D.plate(S, cx + 10, gy - 10, 51, 7, "CENTRAL 18E", "#1f4aa8", "#f4f3ee", { alt: ["18E ARR."] });
    for (const x of [cx - 13, cx + 11]) { if (S.dark || S.rain) { S.er(x, gy - 15, 3, 3, "#4a9cff"); S.glow(x + 1, gy - 14, 9, "70,150,255", 0.5); } else S.r(x, gy - 15, 3, 3, "#3a6ac0"); }
    D.flag(S, cx + 50, 6, 9, 6, "fr"); D.flag(S, cx + 38, 6, 9, 6, "ue"); S.vl(cx - 34, 8, 10, "#555"); S.circ(cx - 34, 9, 2, "#c9c6c0");
    D.street(S, { walk: "#b0aa9c" });
    S.dyn.push((d, t) => { D.veh(d, cx - 78, S.Y.road2, 1, "police", null, S.dark, t); D.veh(d, cx + 40, S.Y.road, -1, "police", null, S.dark, t + 0.5); });
    trees(S, gy, 90, 70, 20); lamps(S, gy, 70, 100, 19);
    D.crowd(S, { y: S.Y.far, sz: 0, n: 6, speed: 7, kinds: ["agent", "civil", "civil", "agent"] });
    D.traffic(S, { n: 2, kinds: ["voiture", "taxi", "van"] });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 4, speed: 10, kinds: ["civil", "agent", "civil"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 14, kinds: ["civil", "avocat"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Brigade de gendarmerie de Montlhéry (Essonne)
  SC.gendarmerie = (S) => {
    const { cx, W } = S, gy = 52;
    S.gy = gy;
    D.sky(S, gy - 6);
    hill(S, gy - 14, 6, 0.035, 1, "#8aa48a", gy); hill(S, gy - 6, 5, 0.05, 4, "#6f9a5e", gy);
    for (let y = gy - 10; y < gy; y += 3) S.dith(0, y, W, 1, "#8fb26e", 3, y);
    const tx = cx + 78, tb = gy - 14;
    S.r(tx, tb - 30, 10, 30, "#b9ad92"); S.vl(tx + 9, tb - 30, 30, "#9a8f78"); S.vl(tx, tb - 30, 30, "#cfc5ac");
    for (const q of [0, 3, 6, 9]) S.r(tx + q, tb - 33 + (q % 6 ? 0 : 1), 2, 3, "#b9ad92");
    S.r(tx + 4, tb - 22, 1, 4, "#3a3a40"); S.r(tx + 4, tb - 12, 1, 4, "#3a3a40"); S.dith(tx, tb - 30, 10, 30, "#7a8a5a", 7, 2);
    S.r(tx - 16, tb - 12, 15, 12, "#b0a58a"); S.r(tx - 16, tb - 14, 6, 3, "#b0a58a"); S.dith(tx - 16, tb - 12, 15, 12, "#7a8a5a", 5, 1);
    for (const dx of [-70, -34, 46]) { const x = cx + dx; roof(S, x, 10, gy - 6, 4, "#9a4a36"); S.r(x, gy - 8, 10, 4, "#e0d4bc"); }
    const x0 = cx - 40, w = 74;
    S.r(x0, gy - 17, w, 17, "#e8e2d4"); S.vl(x0 + w - 1, gy - 17, 17, "#b8b2a2");
    for (let k = 0; k < 9; k++) S.r(x0 - 2 + Math.floor(k * 0.5), gy - 26 + k, w + 4 - Math.floor(k * 1), 1, k === 0 ? "#b5614a" : "#8a4a3a");
    S.dith(x0 - 1, gy - 24, w + 2, 6, "#6a3a2e", 3, 0);
    for (let x = x0 + 5; x < x0 + w - 6; x += 12) { if (x > cx - 8 && x < cx + 8) continue; if (S.lit && D.h01(x) < S.lit * 1.8) S.er(x, gy - 13, 4, 6, "#ffd98a"); else { S.r(x, gy - 13, 4, 6, "#8ea6bf"); S.hl(x, gy - 13, 4, "#c8d8e6"); } S.r(x - 1, gy - 13, 1, 6, "#2f5a8a"); S.r(x + 4, gy - 13, 1, 6, "#2f5a8a"); }
    S.r(cx - 5, gy - 13, 10, 13, "#2f4f86"); if (S.dark) S.er(cx - 3, gy - 11, 6, 9, "#d8c88a"); else S.r(cx - 3, gy - 11, 6, 9, "#5a7894");
    D.sign(S, { x: cx - 27, y: gy - 25, w: 54, h: 12 }, ["GENDARMERIE", "NATIONALE"], { bg: "#1f3f86", fg: "#f4f3ee", fixed: true, padY: 0 });
    D.flag(S, cx - 46, gy - 36, 9, 6, "fr");
    S.r(0, gy, W, 12, "#a39d8e"); S.dith(0, gy, W, 12, "#928c7e", 3, 1); S.hl(0, gy, W, "#bdb7a8");
    S.dith(cx - 44, gy - 4, 82, 4, "#4a7a3a", 2, 0);
    for (let x = cx - 44; x < cx + 40; x += 6) S.vl(x, gy + 2, 2, "#6a6e76"); S.hl(cx - 44, gy + 2, 82, "#8a8e96");
    S.r(0, gy + 12, W, D.H - gy - 12, "#55565c"); S.dith(0, gy + 12, W, D.H - gy - 12, "#4a4b51", 3, 0); S.hl(0, gy + 12, W, "#8a8b90");
    for (let x = 6; x < W; x += 18) S.r(x, gy + 20, 9, 1, "#d8d6ce");
    for (const dx of [-110, 98, 130]) { const x = cx + dx; if (x > -4 && x < W + 4) { S.r(x - 1, gy - 28, 3, 28, "#4f6f3a"); S.dith(x - 2, gy - 28, 5, 28, "#6f8f4a", 2, 0); S.vl(x, gy - 30, 2, "#4f6f3a"); } }
    S.dyn.push((d, t) => { D.veh(d, cx - 30, gy + 8, 1, "gend", null, S.dark, t); D.veh(d, cx + 8, gy + 8, -1, "gend", null, S.dark, t + 1); });
    D.crowd(S, { y: gy + 6, sz: 0, n: 2, speed: 6, kinds: ["gend", "civil"] });
    D.traffic(S, { n: 1, kinds: ["voiture", "van"], speed: 30 });
    D.crowd(S, { y: S.Y.near - 4, sz: 2, n: 1, speed: 12, kinds: ["gend", "visiteur"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Hôtel-Dieu (UMJ), les tours de Notre-Dame
  SC.umj = (S) => {
    const { cx } = S, gy = 50;
    D.sky(S, gy);
    D.far(S, gy - 2, { hz: 14, seed: "u" });
    notre(S, cx + 78, gy - 4);
    D.sides(S, gy, 52, 62, {});
    D.haus(S, cx - 50, 108, gy, CR.seeded("umj"), { stone: "#e0d6bb", floors: 3, rez: "porte" });
    S.r(cx - 14, 8, 28, 22, "#e6dcc2"); for (let k = 0; k < 5; k++) S.r(cx - 14 + (4 - k) * 2, 3 + k, 28 - (4 - k) * 4, 1, "#efe7d0");
    S.circ(cx, 15, 3, "#d6b25a"); S.circ(cx, 15, 2, "#f0ead8"); S.p(cx, 14, "#222"); S.p(cx, 15, "#222"); S.p(cx + 1, 15, "#222");
    for (let i = 0; i < 4; i++) { S.r(cx - 13 + i * 8, 20, 2, gy - 28, "#efe7d0"); S.vl(cx - 12 + i * 8, 20, gy - 28, "#bfb59a"); }
    S.r(cx - 6, gy - 14, 12, 14, "#2a2d37"); if (S.dark || S.rain) S.er(cx - 5, gy - 13, 10, 13, "#d8c88a"); else S.r(cx - 5, gy - 13, 10, 13, "#5a7894");
    S.r(cx - 40, gy - 18, 9, 9, "#1f5fa8"); S.etxt("H", cx - 37, gy - 16, "#f4f3ee");
    S.vl(cx + 22, gy - 8, 8, "#2a2c33"); S.vl(cx + 44, gy - 8, 8, "#2a2c33");
    D.sign(S, { x: cx + 10, y: gy - 24, w: 56, h: 16 }, "UNITÉ MÉDICO-JUDICIAIRE", { bg: "#1f4aa8", fg: "#f4f3ee", alt: ["UMJ HÔTEL-DIEU", "UMJ"], ay: "b" });
    for (let x = cx - 50; x < cx + 58; x += 3) if (x < cx - 8 || x > cx + 8) { S.vl(x, gy - 5, 5, "#1c1d22"); S.p(x, gy - 6, "#d6b25a"); }
    D.street(S, { walk: "#bdb6a6" });
    trees(S, gy, 112, 80, 20); lamps(S, gy, 68, 100, 19);
    D.crowd(S, { y: S.Y.far, sz: 0, n: 6, speed: 7, kinds: ["blouse", "civil", "agent", "civil"] });
    D.traffic(S, { n: 3, kinds: ["ambu", "voiture", "taxi", "bus"] });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 4, speed: 10, kinds: ["blouse", "civil", "visiteur"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 14, kinds: ["civil", "blouse"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- SPIP de Paris
  SC.spip = (S) => {
    const { cx } = S, gy = 50;
    D.sky(S, gy);
    D.far(S, gy - 2, { hz: 16, seed: "s" });
    for (const [dx, w, h] of [[92, 11, 40], [108, 11, 36]]) {
      const x = cx + dx; S.r(x, gy - h, w, h, "#c9c6c0"); S.vl(x, gy - h, h, "#eeeae4"); S.vl(x + w - 1, gy - h, h, "#9a978f"); S.dith(x + 1, gy - h + 2, w - 2, h - 4, "#7a8294", 2, 0);
      if (S.lit) for (let k = 0; k < 8; k++) S.er(x + 2 + Math.floor(D.h01(k + dx) * 6), gy - h + 4 + k * 4, 2, 1, "#ffd98a");
    }
    D.sides(S, gy, 58, 58, { fn: lowSide(S, gy, 3) });
    const x0 = cx - 54, w = 108, top = gy - 32;
    S.r(x0, top, w, gy - top, "#e4e1d8"); S.vl(x0, top, gy - top, "#f4f2ea"); S.vl(x0 + w - 1, top, gy - top, "#b8b4a8"); S.hl(x0 - 1, top, w + 2, "#8a8780");
    const by = top + 2 + 3 * 6 - 1;
    S.r(x0, by, w, gy - by, "#a85a3e"); S.dith(x0, by, w, gy - by, "#8a4a32", 3, 1); S.hl(x0, by, w, "#c8c4b8");
    for (let f = 0; f < 5; f++) for (let x = x0 + 3; x < x0 + w - 6; x += 8) { const y0 = top + 2 + f * 6; if (S.lit && D.h01(x * 7 + f) < S.lit * 1.4) S.er(x, y0, 6, 3, "#ffd98a"); else { S.r(x, y0, 6, 3, "#7f98b4"); S.dith(x, y0, 6, 3, "#5d7898", 3, 0); } S.hl(x, y0 + 3, 6, "#b8b4a8"); }
    S.r(cx - 8, gy - 12, 16, 12, "#2a3342"); if (S.dark || S.rain) S.er(cx - 7, gy - 11, 14, 11, "#d8c88a"); else S.r(cx - 7, gy - 11, 14, 11, "#5a7894");
    S.vl(cx, gy - 11, 11, "#2a3342"); S.r(cx - 12, gy - 13, 24, 2, "#3a3d44");
    D.sign(S, { x: cx - 50, y: gy - 40, w: 100, h: 10 }, "MINISTÈRE DE LA JUSTICE", { bg: "#27407a", fg: "#f4f3ee", alt: ["MINISTÈRE DE LA JUSTICE".replace("MINISTÈRE", "MIN.")] }); D.plate(S, cx - 30, gy - 26, 60, 9, "SPIP DE PARIS", "#1f3f86", "#f4f3ee");
    S.vl(cx - 30, top - 8, 8, "#555"); S.circ(cx + 20, top - 4, 3, "#c9c6c0"); S.vl(cx + 20, top - 2, 3, "#777");
    D.street(S, { walk: "#bfb9aa" });
    const sx = cx + 62;
    S.r(sx, gy - 3, 26, 2, "#3a3d44"); S.vl(sx, gy - 3, 8, "#3a3d44"); S.vl(sx + 25, gy - 3, 8, "#3a3d44"); S.dith(sx + 1, gy - 1, 24, 6, "#9bb4cc", 4, 0);
    S.vl(sx + 29, gy - 14, 18, "#444"); S.r(sx + 26, gy - 16, 7, 4, "#1f8a4a");
    for (let i = 0; i < 3; i++) { S.vl(cx - 62 + i * 3, gy + 1, 3, "#6a6e76"); S.hl(cx - 62, gy + 1, 7, "#6a6e76"); }
    D.queue(S, { x: sx + 4, y: S.Y.far, sz: 0, n: 3, gap: 7, kinds: ["visiteur", "civil", "civil"] });
    D.tree(S, cx - 80, gy + 3, 20); trees(S, gy, 130, 90, 20); lamps(S, gy, 56, 104, 19);
    D.crowd(S, { y: S.Y.far, sz: 0, n: 5, speed: 7, kinds: ["visiteur", "civil", "civil"] });
    D.traffic(S, { n: 3, kinds: ["bus", "voiture", "van", "taxi"] });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 4, speed: 10, kinds: ["visiteur", "civil", "civil"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 14, kinds: ["civil", "visiteur"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Étude de commissaires de justice (8e)
  SC.cj = (S) => {
    const { cx } = S, gy = 50, gold = "#e6c070";
    D.sky(S, gy);
    D.far(S, gy - 2, { hz: 20, seed: "j" });
    D.sides(S, gy, 50, 50, {});
    D.haus(S, cx - 50, 100, gy, CR.seeded("cjx"), { stone: "#e8dec6", floors: 4, rez: "porte" });
    S.dith(cx - 50, 27, 100, 2, "#4a8a4a", 2, 0);
    for (let x = cx - 47; x < cx + 50; x += 9) S.p(x, 27, "#c4352c");
    // rez-de-chaussée sombre : portes vertes, plaque de laiton
    S.r(cx - 50, gy - 9, 100, 9, "#17181c"); S.hl(cx - 50, gy - 1, 100, "#d6b25a");
    S.r(cx - 46, gy - 8, 6, 8, "#1f3a2a"); S.r(cx + 40, gy - 8, 6, 8, "#1f3a2a");
    S.r(cx - 6, gy - 8, 12, 8, "#1f3a2a"); S.vl(cx, gy - 8, 8, "#0e1f16"); S.p(cx - 2, gy - 4, gold); S.p(cx + 2, gy - 4, gold);
    S.r(cx + 9, gy - 7, 3, 5, "#d6b25a"); S.dith(cx + 9, gy - 7, 3, 5, "#8a6a2a", 2, 0);
    if (S.dark) S.glow(cx, gy - 14, 26, "230,190,110", 0.2);
    // le panneau de l'étude, noir et or, sur deux lignes
    D.sign(S, { x: cx - 50, y: gy - 23, w: 100, h: 14 }, ["MARCHAL & RIVES", "COMMISSAIRES DE JUSTICE"], { bg: "#17181c", frame: "#d6b25a", fg: gold, fg2: "#c8a050", fixed: true, padY: 1, emit: S.dark, alt: [["MARCHAL & RIVES", "COMMISSAIRES DE JUST."]] });
    D.flag(S, cx + 40, gy - 44, 8, 5, "fr");
    D.street(S, { walk: "#c4bcac" });
    D.tree(S, cx + 74, gy + 3, 30); D.tree(S, cx - 76, gy + 3, 26); trees(S, gy, 120, 80, 22); lamps(S, gy, 48, 96, 19);
    S.dyn.push((d, t) => { D.veh(d, cx - 100, S.Y.road2, 1, "moto", "#c4352c", S.dark, t); });
    D.crowd(S, { y: S.Y.far, sz: 0, n: 5, speed: 7, kinds: ["civil", "avocat", "civil"] });
    D.traffic(S, { n: 2, kinds: ["voiture", "taxi", "voiture"], speed: 20 });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 4, speed: 10, kinds: ["civil", "avocat", "civil"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 14, kinds: ["civil", "civil"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Lieux des faits (bar, carrefour, boutique, rue)
  // Le nom du lieu tiré par le générateur devient l'enseigne (« Le Soleil de Montmartre », « Optique Clignancourt »),
  // la rue sa plaque émaillée ; les noms longs passent sur deux lignes ou s'abrègent comme un vrai fronton.
  D.enseigneDe = (nom, v) => {
    let n = String(nom || "");
    const q = n.match(/«\s*([^»]+?)\s*»/);
    n = (q ? q[1] : n.split(",")[0]).trim().replace(/^(devant|dans|à) (le |la |l'|les )?/i, "");
    if (v === "bar") n = n.replace(/^(le |la )?(bar|café|brasserie|tabac|pmu)\s+(?=\S)/i, "");
    const sans = n.replace(/^(le |la |les |l')/i, ""), mots = sans.split(" ");
    const alt = [sans].concat(mots.length > 2 ? [mots.slice(0, 2).join(" "), mots[0]] : mots.length > 1 ? [mots[0]] : []);
    return { t: n || (v === "bar" ? "Bar" : "Boutique"), alt };
  };
  D.plaqueRue = (nom) => {
    const m = String(nom || "").match(/\b(rue|boulevard|avenue|place|passage|impasse|square|quai|cité|villa) [^,«»]+/i);
    if (!m) return null;
    const t = m[0].trim().replace(/\s+(à hauteur|au niveau|devant|près).*$/i, "");
    const ab = t.replace(/^rue /i, "R. ").replace(/^boulevard /i, "BD ").replace(/^avenue /i, "AV. ").replace(/^passage /i, "PASS. ").replace(/^impasse /i, "IMP. ");
    return { t, alt: [ab, ab.replace(/ (de la|du|des|de l'|de) /i, " ")] };
  };
  SC.faits = (S) => {
    const { cx } = S, gy = 50, nom0 = String((S.o && S.o.nom) || ""), nom = nom0.toLowerCase();
    const v = /bar|caf|comptoir|brasserie|tabac|pmu/.test(nom) ? "bar" : /carrefour|feu|croisement|rond|avenue|boulevard|passage|pont/.test(nom) ? "carrefour" : /bijou|magasin|boutique|commerce|supermarch|banque|agence/.test(nom) ? "boutique" : "rue";
    D.sky(S, gy);
    D.far(S, gy - 2, { hz: 20, seed: "f" + v });
    if (v === "carrefour") {
      D.sides(S, gy, 16, 16, {});
      D.haus(S, cx - 16, 32, gy - 9, CR.seeded("carref"), { floors: 3 });
      S.r(cx - 16, gy - 9, 32, 9, "#5f6068"); S.dith(cx - 16, gy - 9, 32, 9, "#53545c", 3, 0);
    } else if (v === "bar") {
      D.sides(S, gy, 40, 40, {});
      D.haus(S, cx - 40, 80, gy, CR.seeded("bar"), { awning: "#8a2f2f" });
      const e = D.enseigneDe(nom0, "bar");
      D.sign(S, { x: cx - 40, y: gy - 24, w: 80, h: 15 }, e.t, { bg: "#b3261e", fg: "#ffe0e0", emit: S.dark, frame: "#e8c070", alt: e.alt, ay: "b" });
      if (S.dark) S.dyn.push((d, t) => d.glow(cx, gy - 10, 20, "255,80,70", 0.2 + 0.08 * Math.sin(t * 5)));
    } else if (v === "boutique") {
      D.sides(S, gy, 36, 36, {});
      D.haus(S, cx - 36, 72, gy, CR.seeded("boutique"), { awning: "#17181c", stone: "#e4dac2" });
      const e = D.enseigneDe(nom0, "boutique");
      D.sign(S, { x: cx - 36, y: gy - 24, w: 72, h: 15 }, e.t, { bg: "#17181c", fg: "#e6c070", alt: e.alt, ay: "b" });
    } else D.sides(S, gy, 0, 0, {});
    D.street(S, { walk: "#b4ac9c", cross: v === "carrefour" ? cx - 10 : 0 });
    // plaque de rue émaillée, bleu et vert, à l'angle d'un immeuble voisin
    const pr = D.plaqueRue(nom0);
    if (pr) D.sign(S, { x: Math.max(3, Math.min(S.W - 64, cx + (v === "rue" ? -30 : 44))), y: gy - 41, w: 60, h: 16 }, pr.t, { bg: "#1f3f86", frame: "#3e7a52", fg: "#f4f3ee", alt: pr.alt, ay: "b" });
    if (v === "carrefour") for (const sg of [-1, 1]) {
      const x = cx + sg * 26; S.vl(x, gy - 12, 20, "#2a2a30"); S.r(x - 1, gy - 16, 3, 6, "#1a1a1e");
      S.dyn.push((d, t) => { const g = Math.floor(t / 6) % 2; d.er(x, gy - 15, 1, 1, g ? "#4a1a16" : "#e0483a"); d.er(x, gy - 12, 1, 1, g ? "#3ad06a" : "#14301e"); });
    }
    if (v === "bar") { for (let i = 0; i < 3; i++) { const x = cx - 32 + i * 18; S.r(x, gy + 3, 7, 1, "#d8d2c4"); S.vl(x + 3, gy + 4, 2, "#555"); S.r(x - 2, gy + 2, 1, 4, "#3a2a1e"); S.r(x + 8, gy + 2, 1, 4, "#3a2a1e"); } D.queue(S, { x: cx - 30, y: S.Y.far - 1, sz: 0, n: 2, gap: 18, kinds: ["civil"] }); }
    trees(S, gy, 70, 70, 20); lamps(S, gy, 52, 90, 19);
    D.crowd(S, { y: S.Y.far, sz: 0, n: 4, speed: 7, kinds: ["civil", "civil", "agent"] });
    D.traffic(S, { n: v === "carrefour" ? 4 : 2, kinds: ["voiture", "taxi", "van", "moto", "voiture"] });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 3, speed: 10, kinds: ["civil"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 14, kinds: ["civil"] });
    rainAll(S);
  };
  SC.rue = (S) => {
    const gy = 50;
    D.sky(S, gy); D.far(S, gy - 2, { hz: 20, seed: "r" });
    D.sides(S, gy, 0, 0, {}); D.street(S, {});
    trees(S, gy, 60, 70, 20); lamps(S, gy, 40, 90, 19);
    D.crowd(S, { y: S.Y.far, sz: 0, n: 5, speed: 7, kinds: ["civil", "avocat", "civil"] });
    D.traffic(S, { n: 3, kinds: ["voiture", "taxi", "bus", "van"] });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 4, speed: 10, kinds: ["civil", "avocat"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 14, kinds: ["civil"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Institut médico-légal de Paris (place Mazas, 12e)
  // Brique et pierre au bord du quai, le viaduc du métro qui franchit la Seine, le fourgon funéraire devant la grille.
  SC.iml = (S) => {
    const { cx, W } = S, gy = 50;
    D.sky(S, gy);
    D.far(S, gy - 2, { hz: 14, seed: "iml", col: "#9aa6b8" });
    D.sides(S, gy, 66, 92, { fn: lowSide(S, gy, 3) });
    // le viaduc du métro (ligne 5) : arche de fer vert, tablier, piles de pierre
    const vx = cx + 92, vy = 18;
    S.r(vx - 4, vy, W - vx + 8, 4, "#3e5c4a"); S.hl(vx - 4, vy, W - vx + 8, "#5a7a64"); S.hl(vx - 4, vy + 4, W - vx + 8, "#2a3e32");
    for (let k = 0; k < 26; k++) { const a = k / 25, x = Math.round(vx + a * 70), y = Math.round(vy + 4 + Math.sin(a * Math.PI) * -0 + (1 - Math.sin(a * Math.PI)) * 24); S.r(x, y, 2, 2, "#3e5c4a"); }
    for (let x = vx + 4; x < vx + 70; x += 6) S.vl(x, vy + 4, Math.round((1 - Math.sin(((x - vx) / 70) * Math.PI)) * 24) + 1, "#4f6f5a");
    for (const px of [vx - 6, vx + 70]) { S.r(px, vy + 4, 8, gy - vy - 4, "#c8bb9e"); S.vl(px + 7, vy + 4, gy - vy - 4, "#a89d82"); }
    S.dyn.push((d, t) => { const tx = Math.round(D.mod(t * 18, W + 120) - 80); if (tx > vx - 70) { d.r(tx, vy - 7, 52, 7, "#e9edf0"); d.hl(tx, vy - 3, 52, "#e2a13a"); for (let q = tx + 3; q < tx + 50; q += 6) d.r(q, vy - 6, 4, 2, S.dark ? "#ffe0a0" : "#5a7894"); } });
    // le bâtiment : brique rouge, chaînages et bandeaux de pierre, toit d'ardoise
    const x0 = cx - 60, w = 120, top = gy - 40;
    S.r(x0, top, w, gy - top, "#a85a3e"); S.dith(x0, top, w, gy - top, "#8a4a32", 3, 1);
    for (let k = 0; k < 7; k++) S.r(x0 + 2 - Math.min(2, k), top - 7 + k, w - 4 + Math.min(2, k) * 2, 1, k === 0 ? "#6a7488" : "#4a5468");
    for (const q of [x0, x0 + w - 6, cx - 16, cx + 10]) { S.r(q, top, 6, gy - top, "#d8ccb0"); for (let y = top + 2; y < gy; y += 4) S.hl(q, y, 6, "#c4b896"); }
    for (const y of [top + 12, top + 24]) { S.r(x0, y, w, 2, "#d8ccb0"); S.hl(x0, y + 2, w, "#8a4a32"); }
    for (let f = 0; f < 3; f++) for (let x = x0 + 9; x < x0 + w - 8; x += 11) {
      if (x > cx - 20 && x < cx + 18) continue;
      const y = top + 3 + f * 12;
      S.r(x, y, 5, 7, "#d8ccb0"); if (S.lit && D.h01(x * 3 + f) < S.lit * 1.3) S.er(x + 1, y + 1, 3, 5, "#ffd98a"); else { S.r(x + 1, y + 1, 3, 5, "#7f98b4"); S.hl(x + 1, y + 1, 3, "#c8d8e6"); }
    }
    // le portail sous son arc, la grille
    S.r(cx - 12, gy - 22, 24, 22, "#d8ccb0"); for (let k = 0; k < 5; k++) S.r(cx - 10 + k, gy - 20 - (k < 3 ? k : 2), 20 - k * 2, 1, "#d8ccb0");
    S.r(cx - 8, gy - 17, 16, 17, "#2a2d37"); for (let x = cx - 7; x < cx + 8; x += 3) S.vl(x, gy - 16, 16, "#4a5058");
    if (S.dark) { S.er(cx - 1, gy - 19, 3, 1, "#ffe3a0"); S.glow(cx, gy - 18, 10, "255,205,120", 0.45); }
    D.flag(S, cx + 40, top - 20, 9, 6, "fr");
    D.sign(S, { x: cx - 48, y: top + 13, w: 96, h: 11 }, "INSTITUT MÉDICO-LÉGAL", { bg: "#e4dac4", fg: "#2a2c33", alt: ["IML DE PARIS", "IML"] });
    D.street(S, { walk: "#b8b0a0" });
    trees(S, gy, 104, 72, 22); lamps(S, gy, 70, 96, 19);
    S.dyn.push((d, t) => { D.veh(d, cx - 46, S.Y.road2, 1, "van", "#1c1c22", S.dark, t); D.veh(d, cx + 30, S.Y.road, -1, "police", null, S.dark, t + 0.4); });
    D.crowd(S, { y: S.Y.far, sz: 0, n: 4, speed: 6, kinds: ["blouse", "civil", "agent"] });
    D.traffic(S, { n: 2, kinds: ["voiture", "bus", "taxi"], speed: 22 });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 3, speed: 9, kinds: ["blouse", "civil", "agent"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 13, kinds: ["civil", "blouse"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Scène de crime : transport sur les lieux
  // Une rue de Paris bouclée : rubalise rouge et blanc, cavaliers numérotés, techniciens en combinaison blanche,
  // projecteurs la nuit, voitures sérigraphiées aux gyrophares ; la plaque de la rue si le lieu est connu.
  SC.scene_crime = (S) => {
    const { cx, W } = S, gy = 50, nom0 = String((S.o && S.o.nom) || "");
    D.sky(S, gy);
    D.far(S, gy - 2, { hz: 18, seed: "crime" });
    D.sides(S, gy, 34, 34, {});
    D.haus(S, cx - 34, 68, gy, CR.seeded("crime"), { awning: "#3a3a40", floors: 4 });
    S.r(cx - 32, gy - 7, 64, 7, "#6a6e76"); for (let y = gy - 6; y < gy; y += 2) S.hl(cx - 32, y, 64, "#585c64"); // rideau de fer baissé
    const pr = D.plaqueRue(nom0);
    if (pr) D.sign(S, { x: Math.max(3, Math.min(S.W - 64, cx + 36)), y: gy - 41, w: 60, h: 16 }, pr.t, { bg: "#1f3f86", frame: "#3e7a52", fg: "#f4f3ee", alt: pr.alt, ay: "b" });
    D.street(S, { walk: "#b0a898" });
    // la tente blanche des techniciens, la rubalise tendue entre les poteaux
    const tx = cx - 20;
    S.r(tx, S.Y.far - 14, 22, 14, "#eceee8"); for (let k = 0; k < 5; k++) S.r(tx - 1 + k, S.Y.far - 19 + k, 24 - k * 2, 1, "#f6f6f2"); S.vl(tx + 11, S.Y.far - 14, 14, "#c8ccc8"); S.r(tx + 8, S.Y.far - 9, 7, 9, "#3a3d44");
    const tape = (x1, x2, y) => { for (let x = x1; x < x2; x++) S.er(x, y + Math.round(Math.sin(x * 0.4) * 0.4), 1, 2, Math.floor(x / 3) % 2 ? "#d33a2c" : "#f4f3ee"); };
    for (const px of [cx - 70, cx - 30, cx + 30, cx + 70]) { S.r(px, S.Y.mid - 12, 1, 12, "#2a2c33"); S.r(px - 1, S.Y.mid - 1, 3, 1, "#2a2c33"); }
    tape(cx - 70, cx + 70, S.Y.mid - 11);
    // cavaliers numérotés sur le trottoir
    [-44, -24, 6, 22, 48].forEach((dx, i) => { const x = cx + dx, y = S.Y.far + 2 + (i % 2); S.er(x, y - 6, 5, 6, "#f2c53a"); S.er(x, y - 6, 5, 1, "#ffe08a"); S.etxt(String(i + 1), x + 1, y - 5, "#1a1a1f"); });
    // une silhouette tracée à la craie et une flaque sombre
    S.er(cx - 2, S.Y.far + 1, 14, 1, "#f4f3ee"); S.er(cx - 2, S.Y.far - 2, 1, 3, "#f4f3ee"); S.er(cx + 12, S.Y.far - 2, 1, 3, "#f4f3ee"); S.er(cx - 2, S.Y.far - 3, 5, 1, "#f4f3ee"); S.dith(cx + 4, S.Y.far - 1, 6, 2, "#4a1a1a", 2, 0);
    // projecteurs sur pied, allumés la nuit
    for (const px of [cx - 56, cx + 56]) { S.vl(px, S.Y.far - 12, 12, "#2a2c33"); S.r(px - 2, S.Y.far - 15, 5, 3, "#3a3d44"); if (S.dark) { S.er(px - 1, S.Y.far - 14, 3, 1, "#ffffff"); S.glow(px, S.Y.far - 12, 22, "235,245,255", 0.55); for (let k = 0; k < 6; k++) S.er(px - 4 - k * 3, S.Y.far - 10 + k * 2, 9 + k * 6, 1, `rgba(235,245,255,${(0.16 - k * 0.022).toFixed(3)})`); } }
    trees(S, gy, 92, 70, 20); lamps(S, gy, 80, 96, 19);
    D.queue(S, { x: cx - 40, y: S.Y.far, sz: 1, n: 2, gap: 34, kinds: ["blouse"] });
    D.queue(S, { x: cx + 12, y: S.Y.far, sz: 1, n: 1, kinds: ["blouse"] });
    D.queue(S, { x: cx + 84, y: S.Y.mid, sz: 1, n: 3, gap: 8, kinds: ["agent", "agent", "civil"] });
    S.dyn.push((d, t) => { D.veh(d, cx - 104, S.Y.road2, 1, "police", null, true, t); D.veh(d, cx + 96, S.Y.road, -1, "fourgon", null, S.dark, t + 0.5); });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 9, kinds: ["civil", "agent"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Maison d'arrêt de Paris-la Santé (14e)
  SC.sante = (S) => {
    const { cx, W } = S, gy = 50;
    D.sky(S, gy);
    D.far(S, gy - 22, { hz: 24, seed: "sa", col: "#8c8f98" });
    S.r(0, gy - 24, W, 24, "#cbbf9f");
    for (let j = gy - 21; j < gy; j += 4) { S.hl(0, j, W, "#b3a784"); for (let x = (j % 8 ? 0 : 6); x < W; x += 12) S.vl(x, j - 3, 3, "#b3a784"); }
    S.hl(0, gy - 24, W, "#e0d6bc"); S.r(0, gy - 26, W, 2, "#a89d82"); barbed(S, 0, gy - 29, W);
    S.r(cx - 20, gy - 34, 40, 34, "#d4c8a8"); S.vl(cx - 20, gy - 34, 34, "#e8dfc6"); S.vl(cx + 19, gy - 34, 34, "#a89d82");
    for (const dx of [-24, 24]) { S.r(cx + dx - 6, gy - 40, 12, 40, "#c8bc9c"); S.vl(cx + dx + 5, gy - 40, 40, "#a89d82"); for (let k = 0; k < 6; k++) { const w = 4 + k * 2; S.r(cx + dx - (w >> 1), gy - 46 + k, w, 1, "#4a5468"); } S.r(cx + dx - 1, gy - 34, 2, 5, "#3a3d44"); }
    S.r(cx - 8, gy - 20, 16, 20, "#3a4048"); S.r(cx - 6, gy - 22, 12, 2, "#3a4048"); S.r(cx - 4, gy - 23, 8, 1, "#3a4048");
    for (let x = cx - 7; x < cx + 8; x += 3) S.vl(x, gy - 21, 21, "#4a5058"); S.vl(cx, gy - 22, 22, "#1c2026");
    D.sign(S, { x: cx - 31, y: gy - 35, w: 62, h: 10 }, "MAISON D'ARRÊT", { bg: "#23262e", fg: "#e8e2d4", alt: ["M. D'ARRÊT"] });
    if (S.dark) { S.er(cx - 2, gy - 25, 4, 1, "#ffe3a0"); S.glow(cx, gy - 24, 10, "255,205,120", 0.5); }
    for (const dx of [-96, 96, -230, 230, -360, 360]) {
      const x = cx + dx; if (x < -10 || x > W + 10) continue;
      S.r(x - 2, gy - 40, 5, 40, "#a8a39a"); S.vl(x + 2, gy - 40, 40, "#8a857c"); S.r(x - 7, gy - 48, 15, 8, "#8a8f96");
      if (S.dark) { S.er(x - 6, gy - 46, 13, 4, "#ffe0a0"); S.glow(x, gy - 44, 14, "255,225,160", 0.4); } else S.r(x - 6, gy - 46, 13, 4, "#4a5a6a");
      S.r(x - 1, gy - 46, 3, 4, "#1a1a1f"); S.r(x - 8, gy - 50, 17, 2, "#3a3d44");
    }
    for (let x = cx - 70; x < W; x += 70) mast(S, x, gy - 24, 8);
    D.street(S, { walk: "#b4ac9c" });
    trees(S, gy, 56, 64, 26); lamps(S, gy, 34, 92, 19);
    D.queue(S, { x: cx + 26, y: S.Y.far, sz: 0, n: 6, gap: 6, kinds: ["visiteur", "visiteur", "civil"] });
    S.dyn.push((d, t) => D.veh(d, cx - 74, S.Y.road2, 1, "fourgon", null, S.dark, t));
    D.crowd(S, { y: S.Y.far, sz: 0, n: 4, speed: 7, kinds: ["visiteur", "civil", "agent"] });
    D.traffic(S, { n: 2, kinds: ["voiture", "taxi", "bus"], speed: 22 });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 4, speed: 10, kinds: ["visiteur", "civil", "avocat"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 14, kinds: ["visiteur", "avocat"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Centre pénitentiaire de Fresnes (Val-de-Marne)
  SC.fresnes = (S) => {
    const { cx } = S, gy = 50;
    D.sky(S, gy);
    D.far(S, gy - 4, { hz: 10, seed: "fr", col: "#a8b0b6" });
    D.sides(S, gy, 92, 92, { wmin: 14, fn: (x, w, R) => maison(S, x, w, gy, R) });
    S.r(cx + 38, 8, 9, 38, "#c2bfb4"); S.vl(cx + 46, 8, 38, "#a29f94"); S.r(cx + 34, 4, 17, 9, "#b0ada2"); S.dith(cx + 34, 4, 17, 9, "#9a978c", 2, 0); S.hl(cx + 34, 3, 17, "#d8d5ca"); S.vl(cx + 42, 0, 3, "#666");
    for (const sg of [-1, 1]) {
      const x = sg < 0 ? cx - 90 : cx + 34, w = 56;
      S.r(x, gy - 32, w, 32, "#a85a3e"); S.dith(x, gy - 32, w, 32, "#8a4a32", 3, 1); S.vl(x, gy - 32, 32, "#c0705a");
      for (let k = 0; k < 6; k++) S.r(x + k, gy - 38 + k, w - 2 * k, 1, k === 0 ? "#b86a52" : "#8a4a36");
      for (let yy = gy - 28; yy < gy - 8; yy += 8) for (let xx = x + 4; xx < x + w - 4; xx += 6) { if (S.lit && D.h01(xx * 5 + yy) < S.lit * 1.2) S.er(xx, yy, 2, 4, "#ffd98a"); else { S.r(xx, yy, 2, 4, "#2a2c33"); S.vl(xx, yy, 4, "#5a5e66"); } }
    }
    S.r(cx - 34, 12, 68, gy - 12, "#d8d0b8"); S.vl(cx - 34, 12, gy - 12, "#ece4cc"); S.vl(cx + 33, 12, gy - 12, "#a89f88");
    for (let k = 0; k < 6; k++) S.r(cx - 34 + (5 - k) * 3, 6 + k, 68 - (5 - k) * 6, 1, "#e6dec6");
    S.circ(cx, 17, 4, "#c9b48a"); S.circ(cx, 17, 3, "#efe6c4"); S.p(cx, 15, "#222"); S.p(cx, 17, "#222"); S.p(cx + 1, 17, "#222");
    for (let yy = 26; yy < gy - 20; yy += 8) for (let xx = cx - 30; xx < cx + 30; xx += 7) { if (Math.abs(xx - cx) < 8) continue; if (S.lit && D.h01(xx + yy * 3) < S.lit) S.er(xx, yy, 2, 4, "#ffd98a"); else { S.r(xx, yy, 2, 4, "#2a2c33"); S.vl(xx, yy, 4, "#5a5e66"); } }
    S.r(cx - 9, gy - 26, 18, 26, "#2a2d37"); S.r(cx - 7, gy - 28, 14, 2, "#2a2d37"); S.r(cx - 5, gy - 29, 10, 1, "#2a2d37");
    for (let x = cx - 8; x < cx + 9; x += 3) S.vl(x, gy - 27, 27, "#4a5058");
    D.sign(S, { x: cx - 32, y: gy - 29, w: 64, h: 10 }, "MAISON D'ARRÊT", { bg: "#23262e", fg: "#e8e2d4", alt: ["CENTRE PÉNITENTIAIRE"] });
    S.r(cx - 90, gy - 12, 56, 12, "#b4b0a4"); S.r(cx + 34, gy - 12, 56, 12, "#b4b0a4"); S.hl(cx - 90, gy - 12, 56, "#d0ccc0"); S.hl(cx + 34, gy - 12, 56, "#d0ccc0"); barbed(S, cx - 90, gy - 15, 56); barbed(S, cx + 34, gy - 15, 56);
    for (const dx of [-98, 98]) { const x = cx + dx; S.r(x - 3, gy - 24, 6, 24, "#a8a39a"); S.r(x - 6, gy - 30, 12, 6, "#8a8f96"); if (S.dark) S.er(x - 5, gy - 29, 10, 3, "#ffe0a0"); else S.r(x - 5, gy - 29, 10, 3, "#4a5a6a"); S.r(x - 7, gy - 32, 14, 2, "#3a3d44"); }
    D.street(S, { walk: "#bdb7a8", near: "#5f6168" });
    for (let x = 4; x < S.W; x += 22) S.vl(x, S.Y.mid - 8, 8, "#d8d6ce");
    S.dyn.push((d, t) => { for (let i = 0; i < 5; i++) { const x = cx - 100 + i * 46; if (x > -22 && x < S.W) D.veh(d, x, S.Y.mid + 3, i % 2 ? -1 : 1, "voiture", ["#c9c3b4", "#2f4b6e", "#8a2f2f", "#3a3a40", "#e0ddd4"][i], S.dark, t); } });
    trees(S, gy, 70, 80, 18); lamps(S, gy, 52, 92, 19);
    D.queue(S, { x: cx + 14, y: S.Y.far, sz: 0, n: 5, gap: 6, kinds: ["visiteur", "visiteur", "civil"] });
    D.crowd(S, { y: S.Y.far, sz: 0, n: 3, speed: 7, kinds: ["visiteur", "civil", "agent"] });
    D.traffic(S, { n: 2, kinds: ["bus", "voiture", "van"], speed: 22 });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 14, kinds: ["visiteur", "civil"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Maison d'arrêt de Fleury-Mérogis (Essonne)
  const tourF = (S, x, w, gy, R) => {
    const h = 34 + Math.floor(R() * 12), top = gy - h;
    S.r(x, top, w, h, "#d6d3cc"); S.vl(x, top, h, "#ecebe6"); S.vl(x + w - 1, top, h, "#a8a69f"); S.hl(x - 1, top, w + 2, "#8a8780");
    for (let yy = top + 3; yy < gy - 3; yy += 3) for (let xx = x + 2; xx < x + w - 2; xx += 3) { if (S.lit && R() < S.lit) S.er(xx, yy, 2, 1, pick(R, WARM)); else S.r(xx, yy, 2, 1, "#4a4e58"); }
    const acc = pick(R, ["#d9803a", "#4a8aa0", "#7a8a4a", "#b0503a"]);
    for (let xx = x + 5; xx < x + w - 3; xx += 12) S.r(xx, top + 2, 2, h - 4, acc);
    S.r(x + 3, top - 3, 6, 3, "#9a9a94"); if (R() < 0.5) S.vl(x + w - 5, top - 7, 7, "#666");
    S.r(x + w, gy - 14, 4, 5, "#bdbab2");
  };
  SC.fleury = (S) => {
    const { cx, W } = S, gy = 50;
    D.sky(S, gy);
    S.dith(0, gy - 8, W, 8, "#4f6f4a", 2, 0); S.r(0, gy - 4, W, 4, "#587a52");
    D.sides(S, gy, 0, 0, { wmin: 38, fn: (x, w, R) => tourF(S, x, w - 4, gy, R) });
    S.r(0, gy - 8, W, 8, "#b8b6b0"); S.hl(0, gy - 8, W, "#d6d4ce"); S.dith(0, gy - 13, W, 5, "#6a6e76", 2, 0); S.hl(0, gy - 13, W, "#8a8e96");
    for (let x = cx - 138; x < W; x += 46) if (x > -10) mast(S, x, gy - 8, 34);
    S.r(cx - 30, gy - 14, 60, 14, "#c9c6c0"); S.hl(cx - 30, gy - 14, 60, "#e4e2dc"); S.r(cx - 6, gy - 9, 12, 9, "#3a4048");
    for (const px of [cx - 24, cx + 23]) S.r(px, gy - 17, 2, 4, "#3a3d44");
    D.sign(S, { x: cx - 34, y: gy - 34, w: 68, h: 18 }, (S.o && S.o.plaque) ? ["MAISON D'ARRÊT", S.o.plaque] : ["MAISON D'ARRÊT", "FLEURY-MÉROGIS"], { bg: "#23262e", fg: "#e8e2d4", fg2: "#d6b25a", alt: [[(S.o && S.o.plaque) || "FLEURY-MÉROGIS"]] });
    D.street(S, { walk: "#b8b4a8", near: "#5c5e64" });
    for (let x = 6; x < W; x += 18) S.vl(x, S.Y.mid - 7, 7, "#d8d6ce");
    S.dyn.push((d, t) => { for (let i = 0; i < 12; i++) { const x = cx - 120 + i * 24; if (x > -22 && x < W) D.veh(d, x, S.Y.mid + 2 + (i % 2) * 6, i % 2 ? -1 : 1, "voiture", ["#c9c3b4", "#2f4b6e", "#8a2f2f", "#3a3a40", "#e0ddd4", "#3e5c3a"][i % 6], S.dark, t); } });
    lamps(S, gy, 60, 110, 18);
    D.queue(S, { x: cx + 36, y: S.Y.far, sz: 0, n: 6, gap: 6, kinds: ["visiteur", "civil", "visiteur"] });
    D.crowd(S, { y: S.Y.far, sz: 0, n: 3, speed: 7, kinds: ["visiteur", "civil", "agent"] });
    D.traffic(S, { n: 2, kinds: ["bus", "voiture", "fourgon"], speed: 24 });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 14, kinds: ["visiteur", "civil"] });
    rainAll(S);
  };

  // ---------------------------------------------------------------- Centre de détention de Melun, au bord de la Seine
  SC.melun = (S) => {
    const { cx, W } = S, gy = 46;
    S.gy = gy;
    D.sky(S, gy);
    hill(S, gy - 2, 3, 0.05, 3, "#6f8a68", gy);
    const wx = cx - 84, ww = 168;
    S.r(wx, gy - 20, ww, 20, "#a85a3e"); S.dith(wx, gy - 20, ww, 20, "#8a4a32", 3, 1); S.vl(wx, gy - 20, 20, "#c0705a");
    for (let q = 0; q < ww; q += 14) S.r(wx + q, gy - 20, 2, 20, "#cfc5ac");
    for (let yy = gy - 16; yy < gy - 4; yy += 7) for (let xx = wx + 4; xx < wx + ww - 4; xx += 7) { if (xx > cx - 14 && xx < cx + 14) continue; if (S.lit && D.h01(xx * 3 + yy) < S.lit) S.er(xx, yy, 2, 4, "#ffd98a"); else { S.r(xx, yy, 2, 4, "#2a2c33"); S.vl(xx, yy, 4, "#5a5e66"); } }
    for (let k = 0; k < 6; k++) S.r(wx + k, gy - 26 + k, ww - 2 * k, 1, k === 0 ? "#6a7488" : "#4a5468");
    S.r(cx - 12, gy - 40, 24, 22, "#b9ad92"); S.vl(cx + 11, gy - 40, 22, "#9a8f78"); S.hl(cx - 13, gy - 40, 26, "#d6cbb0");
    S.circ(cx, gy - 32, 4, "#d6b25a"); S.circ(cx, gy - 32, 3, "#efe6c4"); S.p(cx, gy - 34, "#222"); S.p(cx, gy - 32, "#222"); S.p(cx + 1, gy - 32, "#222");
    for (let k = 0; k < 14; k++) { const w = Math.max(2, Math.round(2 + k * 1.8)); S.r(cx - (w >> 1), gy - 54 + k, w, 1, "#3a4254"); }
    S.p(cx, gy - 55, "#d6b25a"); S.r(cx - 3, gy - 22, 6, 6, "#4a3a2a");
    D.sign(S, { x: cx - 42, y: gy - 14, w: 84, h: 10 }, "CENTRE DE DÉTENTION", { bg: "#23262e", fg: "#e8e2d4" });
    for (const sg of [-1, 1]) { const x = cx + sg * 92; S.r(x - 4, gy - 28, 8, 28, "#b9ad92"); roof(S, x - 5, 10, gy - 28, 6, "#3a4254"); barbed(S, x - 14 * sg - (sg < 0 ? 0 : 6), gy - 6, 8); }
    S.r(0, gy - 6, wx, 6, "#b3a784"); S.r(wx + ww, gy - 6, W - wx - ww, 6, "#b3a784"); barbed(S, 0, gy - 9, wx); barbed(S, wx + ww, gy - 9, W - wx - ww);
    const ex = cx + 120; S.r(ex, gy - 20, 10, 20, "#b9b3a1"); roof(S, ex - 1, 12, gy - 20, 8, "#4a5468"); S.r(ex + 12, gy - 12, 18, 12, "#c4beac"); roof(S, ex + 11, 20, gy - 12, 5, "#4a5468");
    S.r(0, gy, W, 24, "#5b86b0"); S.dith(0, gy, W, 24, "#7aa3c8", 3, 0);
    for (let k = 0; k < 4; k++) S.dith(0, gy + 1 + k * 5, W, 1, "#3f6a94", 2, k);
    if (S.lit) for (let x = cx - 70; x < cx + 70; x += 9) S.er(x, gy + 3 + ((x >> 3) % 3) * 4, 3, 1, "rgba(255,217,138,0.5)");
    S.dyn.push((d, t) => {
      for (let i = 0; i < Math.round(W / 12); i++) { const x = Math.round(D.mod(D.h01(i * 4.3) * W + t * 3 * (1 + D.h01(i * 2)), W)); d.ep(x, gy + 2 + ((i * 7) % 20), S.dark ? "#9db8e0" : "#d8e8f6"); }
      const bx = Math.round(D.mod(t * 5, W + 90) - 60), by = gy + 12;
      d.r(bx, by - 4, 46, 4, "#2a2c33"); d.hl(bx, by - 4, 46, "#5a5e66"); d.r(bx + 30, by - 9, 12, 5, "#d9c8a0"); d.r(bx + 31, by - 8, 10, 2, S.dark ? "#ffd98a" : "#8ea6bf"); d.r(bx + 4, by - 6, 8, 2, "#8a2f2f");
    });
    S.r(0, gy + 24, W, 3, "#8a8478"); S.hl(0, gy + 24, W, "#bdb7a8");
    S.r(0, gy + 27, W, D.H - gy - 27, "#b4ac9c"); S.dith(0, gy + 27, W, D.H - gy - 27, "#a39c8c", 4, 1); S.hl(0, gy + 27, W, "#d4cdbd");
    const wl = 22;
    S.vl(wl, gy + 8, 20, "#4a3a2a"); S.dith(wl - 14, gy + 4, 30, 6, "#7a8f4a", 2, 0);
    for (let i = 0; i < 9; i++) { const x = wl - 14 + i * 3.5; S.vl(Math.round(x), gy + 10, 14 + (i % 3) * 3, i % 2 ? "#6a7f3e" : "#8a9f50"); }
    lamps(S, gy + 24, 60, 100, 14);
    D.crowd(S, { y: S.Y.mid + 6, sz: 1, n: 3, speed: 9, kinds: ["civil", "visiteur", "civil"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 2, speed: 13, kinds: ["civil", "visiteur"] });
    D.rain(S, 0, 0, W, 80, { splashTop: gy + 6 });
  };

  // ---------------------------------------------------------------- Maison centrale de Poissy (Yvelines)
  SC.poissy = (S) => {
    const { cx, W } = S, gy = 50;
    D.sky(S, gy);
    S.PB.r(0, 0, W, gy, S.dark ? "rgba(20,24,34,0.35)" : "rgba(90,96,108,0.38)");
    hill(S, gy - 14, 4, 0.045, 2, "#4f6a4a", gy);
    const ex = cx + 100; S.r(ex, gy - 26, 10, 26, "#b0aa98"); roof(S, ex - 1, 12, gy - 26, 12, "#4a5468"); S.r(ex + 10, gy - 14, 22, 14, "#bab4a2"); roof(S, ex + 9, 24, gy - 14, 5, "#4a5468");
    D.far(S, gy - 22, { hz: 20, seed: "po", col: "#7f838c" });
    for (let x = 0; x < W; x += 26) { const R = CR.seeded("po" + x); const h = 14 + Math.floor(R() * 10); S.r(x, gy - 22 - h + 10, 24, h + 12, "#8c8f98"); S.hl(x, gy - 22 - h + 10, 24, "#a4a7b0"); for (let yy = gy - 22 - h + 14; yy < gy - 24; yy += 4) for (let xx = x + 2; xx < x + 22; xx += 4) { if (S.lit && R() < S.lit) S.er(xx, yy, 2, 1, "#ffd98a"); else S.r(xx, yy, 2, 1, "#4a4e58"); } }
    S.r(0, gy - 20, W, 20, "#9a9a96"); for (let x = 0; x < W; x += 8) S.vl(x, gy - 20, 20, "#8a8a86"); S.hl(0, gy - 20, W, "#b4b4b0"); S.r(0, gy - 22, W, 2, "#7a7a76");
    for (let x = 0; x < W; x += 4) S.circ(x, gy - 25, 1, "#7a7e86"); S.hl(0, gy - 26, W, "#4a4e56"); S.hl(0, gy - 24, W, "#3a3a40");
    for (const dx of [-76, 76, -216, 216, -356, 356]) {
      const x = cx + dx; if (x < -10 || x > W + 10) continue;
      S.r(x - 3, gy - 42, 6, 42, "#8a8a86"); S.vl(x + 2, gy - 42, 42, "#6a6a66"); S.r(x - 8, gy - 52, 17, 10, "#7a7e86"); S.hl(x - 8, gy - 52, 17, "#9a9ea6");
      if (S.dark) { S.er(x - 7, gy - 49, 15, 3, "#ffe0a0"); S.glow(x, gy - 47, 16, "255,225,160", 0.4); } else S.r(x - 7, gy - 49, 15, 3, "#3a4a5a");
      S.r(x - 1, gy - 49, 3, 3, "#1a1a1f"); S.r(x - 10, gy - 54, 21, 2, "#3a3d44");
    }
    S.r(cx - 18, gy - 18, 36, 18, "#7a7e86"); S.hl(cx - 18, gy - 18, 36, "#9a9ea6");
    for (let x = cx - 16; x < cx + 16; x += 4) S.vl(x, gy - 17, 17, "#6a6e76");
    for (let x = cx - 18; x < cx + 18; x += 4) { S.r(x, gy - 3, 2, 3, "#e0b82a"); S.r(x + 2, gy - 3, 2, 3, "#1a1a1f"); }
    D.plate(S, cx - 32, gy - 30, 64, 7, "MAISON CENTRALE", "#23262e", "#e8e2d4");
    for (let x = cx - 100; x < W; x += 60) if (x > -10 && Math.abs(x - cx) > 30) mast(S, x, gy - 20, 8);
    D.street(S, { walk: "#a8a498", near: "#74756e" });
    S.er(0, gy - 6, W, 14, S.dark ? "rgba(120,130,160,0.06)" : "rgba(210,215,222,0.14)");
    lamps(S, gy, 40, 110, 19);
    S.dyn.push((d, t) => D.veh(d, cx - 70, S.Y.road2, 1, "fourgon", null, S.dark, t));
    D.crowd(S, { y: S.Y.far, sz: 0, n: 2, speed: 6, kinds: ["agent", "civil"] });
    D.traffic(S, { n: 1, kinds: ["voiture", "van"], speed: 22 });
    D.crowd(S, { y: S.Y.mid, sz: 1, n: 2, speed: 9, kinds: ["agent", "visiteur"] });
    D.crowd(S, { y: S.Y.near, sz: 2, n: 1, speed: 13, kinds: ["civil"] });
    rainAll(S);
  };
})();
