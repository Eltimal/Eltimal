/* La Permanence — Timon, le Maine Coon du cabinet (CR.timon). Refonte du 13 novembre 2026.
   Roux tigré, plastron, museau et pattes blancs, yeux ambrés, plumets aux oreilles, queue en panache plus claire.
   Dessin : un squelette animé (échine, pattes à deux segments, queue à sept nœuds) habillé de fourrure dans un petit
   tampon de palette (96 × 72) ; chaque pixel garde aussi son relief (sprN), que le nouveau moteur (CR.gpu.Mat) éclaire :
   la lampe modèle le pelage. Tête de face 17 × 15 : grands yeux (pupille ronde la nuit, en fente le jour), M tigré,
   collerette, plumets ; elle se penche (tilt), bâille, miaule, claque des dents.
   Poses : walk, stand, sit, loaf, back, rear, crouch, leap, stretch, curl (en boule), side (sur le flanc),
   sitBack (assis de dos). Options de sit : paw, scratch, headDown, headX ; de loaf : knead, asleep, hang.
   Comportement (T.update) : plus de boucle. Cinq envies évoluent (sommeil, jeu, curiosité, soin, câlin) selon l'heure,
   la pluie et le joueur ; chaque activité est un petit scénario tiré avec des variantes (ACT) ; les six dernières
   activités sont retenues et pénalisées ; clignements, oreilles, regard et queue sont tirés au hasard, jamais cadencés.
   monde : { x0, x1, sol, chaise {x, y}, appui {x0, x1, y}, plante {x}, perches [{ id, x, y, app }], sansSol,
   heure() → 0..24, pluie }. Les états lus de l'extérieur gardent leur nom : dodo, assis, miche, saut. */
(function () {
  const CR = window.CR;
  const T = (CR.timon = {});
  const SW = 96, SH = 72, OX = 48, OY = 60; // tampon local ; (OX, OY) = milieu des appuis, au sol
  const PAL = { O: "#d9843a", o: "#eda65a", d: "#b3621f", D: "#8f4a16", w: "#fbf3e6", W: "#dcc8b2", p: "#e8a09c", n: "#d9737a", e: "#ffc83a", E: "#c47e16", k: "#2a1608", h: "#ffffff", c: "#f3cd98", C: "#dba86c", x: "#6e3a14", y: "#f7dcae" };
  const KEYS = Object.keys(PAL), IDX = {}; KEYS.forEach((k, i) => { IDX[k] = i + 1; });
  const RGB = [null].concat(KEYS.map((k) => { const n = parseInt(PAL[k].slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }));
  const h2 = (x, y) => { const r = Math.sin(x * 37.761 + y * 66.265 + 1.37) * 43758.5453; return r - Math.floor(r); };
  const lerp = (a, b, t) => a + (b - a) * t, cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => t * t * (3 - 2 * t);

  const spr = new Uint8Array(SW * SH), far = new Uint8Array(SW * SH), sprN = new Int8Array(SW * SH * 2);
  const put = (x, y, k, nx, ny) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < SW && y < SH) { const q = y * SW + x; spr[q] = IDX[k]; sprN[q * 2] = cl((nx || 0) * 100, -110, 110); sprN[q * 2 + 1] = cl((ny || 0) * 100, -110, 110); } };
  const at = (x, y) => (x >= 0 && y >= 0 && x < SW && y < SH ? spr[y * SW + x] : 0);

  // ---------------------------------------------------------------- fourrure le long d'un axe
  // pts : [[x, y, rayon], …] ; shade(v, s, px, py) → clé de palette ; fuzz : poils du contour
  function fur(pts, shade, fuzz) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0] - p[2] - 2); x1 = Math.max(x1, p[0] + p[2] + 2); y0 = Math.min(y0, p[1] - p[2] - 2); y1 = Math.max(y1, p[1] + p[2] + 2); }
    let tot = 0; const seg = [];
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) || 0.001; seg.push([tot, l]); tot += l; }
    for (let py = Math.floor(y0); py <= Math.ceil(y1); py++) for (let px = Math.floor(x0); px <= Math.ceil(x1); px++) {
      let best = 1e9, bs = 0, br = 1, bv = 0, bu = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 0.001;
        const u = cl(((px - a[0]) * dx + (py - a[1]) * dy) / l2, 0, 1), cx = a[0] + dx * u, cy = a[1] + dy * u, r = lerp(a[2], b[2], u), d = Math.hypot(px - cx, py - cy) / r;
        if (d < best) { best = d; bs = (seg[i][0] + seg[i][1] * u); br = r; bv = (py - cy) / r; bu = (px - cx) / r; }
      }
      if (pts.length === 1) { const a = pts[0]; best = Math.hypot(px - a[0], py - a[1]) / a[2]; br = a[2]; bv = (py - a[1]) / a[2]; bu = (px - a[0]) / a[2]; }
      const lim = 1 + (fuzz ? (h2(px, py) - 0.5) * fuzz / br : 0);
      if (best <= lim) put(px, py, shade(bv, bs, px, py), bu * 0.85, bv * 0.85);
    }
  }
  const tabby = (v, s, px, py) => (v > 0.62 ? "D" : Math.sin(s * 1.05 + v * 1.1) > 0.5 && v < 0.45 ? "d" : v < -0.5 ? "o" : "O");
  const plain = (v) => (v > 0.6 ? "D" : v < -0.45 ? "o" : "O");
  const cream = (v, s) => (v > 0.5 ? "C" : Math.sin(s * 1.2) > 0.72 ? "C" : v < -0.4 ? "y" : "c");
  const white = (v) => (v > 0.45 ? "W" : "w");

  function seg2(x0, y0, x1, y1, w0, w1, sh) { fur([[x0, y0, w0], [x1, y1, w1]], sh, 0); }
  // une patte : épaule ou hanche → pied, avec un coude ; le bout est blanc
  function leg(jx, jy, fx, fy, bend, front, farSide, sock) {
    const mx = (jx + fx) / 2 + bend, my = (jy + fy) / 2;
    const sh = farSide ? () => "D" : (v, s) => (Math.sin(s * 1.4) > 0.6 ? "d" : v < -0.3 ? "o" : "O");
    seg2(jx, jy, mx, my, front ? 2.3 : 2.9, 1.9, sh);
    seg2(mx, my, fx, fy - 1, 1.9, 1.6, sh);
    const L = Math.hypot(fx - mx, fy - my) || 1, n = sock || (front ? 3 : 4);
    for (let k = 0; k < n; k++) { const u = 1 - k / (L + 1), x = lerp(mx, fx, u), y = lerp(my, fy - 1, u); for (let i = -1; i <= 1; i++) put(x + i, y, farSide ? "W" : i > 0 ? "W" : "w"); }
    for (let i = -1; i <= 2; i++) put(fx + i, fy, farSide ? "W" : "w"); put(fx + 2, fy, "W");
  }

  // ---------------------------------------------------------------- la tête, pixel par pixel (17 × 15)
  const HEAD = [
    "..d...........d..",
    ".dOd.........dOd.",
    ".OpOd.......dOpO.",
    ".OppOoOdOdOoOppO.",
    ".OOpOdOoOoOdOpOO.",
    "OOoOOdOOoOOdOOoOO",
    "OOxxxxOOoOOxxxxOO",
    "OO....OOwOO....OO",
    "OO....OwwwO....OO",
    "Oo....wwwww....oO",
    "ooOOOwwwnwwwOOOoo",
    "oyyOwwwwkwwwwOyyo",
    "yyyywwwkwkwwwyyyy",
    ".yyyywwwwwwwyyyy.",
    "..yyyyWWWWWyyyy..",
  ];
  function head(cx, cy, o) {
    o = o || {};
    const x0 = Math.round(cx) - 8, y0 = Math.round(cy) - 7, ears = o.ears || "up", tilt = o.tilt || 0, yawn = o.mouth === "yawn";
    const P = (i, j, k) => put(x0 + i + Math.round(tilt * (7 - j) / 4), y0 + j, k, (i - 8) / 11, (j - 7) / 10);
    for (let j = 0; j < 15; j++) for (let i = 0; i < 17; i++) { const ch = HEAD[j][i]; if (ch === "." || (j < 3 && ears === "back")) continue; P(i, j, ch); }
    if (ears === "back") { for (const [i, j, k] of [[0, 2, "d"], [1, 2, "O"], [2, 2, "d"], [-1, 3, "d"], [16, 2, "d"], [15, 2, "O"], [14, 2, "d"], [17, 3, "d"]]) P(i, j, k); }
    else { P(2 + (o.twitch === 1 ? -1 : 0), -1, "y"); P(14 + (o.twitch === 2 ? 1 : 0), -1, "y"); if (o.twitch === 1) P(1, 0, "d"); if (o.twitch === 2) P(15, 0, "d"); }
    // yeux : 4 × 3, colonnes 2-5 et 11-14, rangées 7 à 9
    const st = yawn ? "closed" : o.eyes || "open", lk = cl(Math.round(o.look || 0), -1, 1), pc = 1 + lk, wide = st === "wide", slit = o.pupil === "slit" && !wide;
    for (const ex of [2, 11]) for (let i = 0; i < 4; i++) {
      if (st === "closed") { P(ex + i, 7, "O"); P(ex + i, 8, "x"); P(ex + i, 9, ex + i > 5 && ex + i < 11 ? "w" : "O"); }
      else if (st === "happy") { P(ex + i, 7, i === 1 || i === 2 ? "x" : "O"); P(ex + i, 8, i === 0 || i === 3 ? "x" : "O"); P(ex + i, 9, "O"); }
      else if (st === "half") { P(ex + i, 7, "x"); P(ex + i, 8, i === pc || i === pc + 1 ? "k" : "e"); P(ex + i, 9, i === 0 || i === 3 ? "O" : "E"); }
      else {
        const pup = slit ? i === pc + (lk < 0 ? 0 : 1) : i === pc || i === pc + 1;
        P(ex + i, 7, pup ? "k" : "e"); P(ex + i, 8, pup ? "k" : i === 3 ? "E" : "e"); P(ex + i, 9, wide ? (pup ? "k" : "E") : i === 0 || i === 3 ? "O" : pup && !slit ? "k" : "E");
        if (i === pc) P(ex + i, 7, "h");
      }
    }
    if (o.mouth === "open") { for (const [i, j, k] of [[8, 12, "n"], [7, 12, "k"], [9, 12, "k"], [8, 13, "n"], [7, 13, "k"], [9, 13, "k"]]) P(i, j, k); }
    if (yawn) { for (let j = 11; j < 15; j++) for (let i = 6; i <= 10; i++) P(i, j, i === 6 || i === 10 || j === 11 || j === 14 ? "k" : j === 13 ? "p" : "n"); P(7, 12, "w"); P(9, 12, "w"); }
    if (o.mouth === "chatter") { P(8, 12, "k"); P(7, 12, "w"); P(9, 12, "w"); P(8, 13, "k"); }
    if (o.tongue) { P(8, 12, "p"); P(8, 13, "p"); }
  }
  // moustaches : posées après le contour, pour rester de fins traits clairs
  const wsk = [];
  function whiskers(cx, cy) { const x0 = Math.round(cx) - 8, y0 = Math.round(cy) - 7; for (const [a, b] of [[-1, 11], [-2, 11], [-3, 10], [-1, 13], [-2, 13]]) wsk.push([x0 + a, y0 + b], [x0 + 16 - a, y0 + b]); }

  // ---------------------------------------------------------------- les poses
  // Chaque pose dessine le chat tourné vers la droite ; p : paramètres d'animation
  function tail(base, nodes, light) {
    const R = [2.4, 3.0, 3.7, 4.2, 4.3, 3.8, 2.8], pts = [[base[0], base[1], R[0]]];
    for (let i = 0; i < nodes.length; i++) pts.push([nodes[i][0], nodes[i][1], R[Math.min(6, i + 1)]]);
    fur(pts, light ? cream : cream, 2.2);
  }
  function tailCurve(bx, by, a0, bendPer, len, sway, t) { const pts = []; let x = bx, y = by, a = a0; for (let i = 0; i < 6; i++) { a += bendPer + Math.sin(t * 2.1 - i * 0.7) * sway * (0.3 + i * 0.14); x += Math.cos(a) * len; y += Math.sin(a) * len; pts.push([x, y]); } return pts; }

  const POSE = {};
  POSE.walk = function (p, t) {
    const ph = p.phase || 0, run = p.run ? 1 : 0, bob = Math.sin(ph * 2 * Math.PI * 2) * (run ? 1 : 0.5), X = OX, Y = OY;
    const hip = [X - 11, Y - 14 + bob * 0.5], sho = [X + 9, Y - 15 - bob * 0.5], st = run ? 9 : 6;
    const foot = (off, jx) => { const u = ((ph + off) % 1 + 1) % 1; if (u < 0.6) return [jx + st * (0.5 - u / 0.6), Y, 0]; const v = (u - 0.6) / 0.4; return [jx + st * (-0.5 + v), Y - Math.sin(v * Math.PI) * (run ? 4 : 2.5), 1]; };
    const fLH = foot(0, hip[0] - 1), fLF = foot(0.25, sho[0] + 1), fRH = foot(0.5, hip[0] + 1), fRF = foot(0.75, sho[0] + 3);
    leg(hip[0] + 1, hip[1] + 3, fLH[0], fLH[1], -2.2, false, true); leg(sho[0], sho[1] + 4, fLF[0], fLF[1], 1.2, true, true);
    tail([hip[0] - 5, hip[1] - 2], tailCurve(hip[0] - 5, hip[1] - 2, -2.2, p.tailUp == null ? 0.34 : p.tailUp, 4.6, 0.12, t), true);
    fur([[hip[0], hip[1], 6.4], [(hip[0] + sho[0]) / 2, hip[1] + 0.6, 6.0], [sho[0], sho[1], 6.6]], (v, s, px, py) => (v > 0.74 && px > X - 4 && px < X + 6 ? "W" : tabby(v, s)), 0.9);
    fur([[hip[0] - 1, hip[1] + 2, 5.2]], (v, s) => tabby(v, s + 3), 0.8);
    leg(hip[0], hip[1] + 4, fRH[0], fRH[1], -2.4, false, false); leg(sho[0] + 2, sho[1] + 5, fRF[0], fRF[1], 1.2, true, false);
    fur([[sho[0] + 3, sho[1] + 4, 5]], white, 2.6);
    const hx = sho[0] + 8, hy = sho[1] - 6 + (p.headDown || 0) - bob * 0.3;
    fur([[sho[0] + 3, sho[1] - 2, 5.6], [hx - 1, hy + 2, 5.4]], plain, 2.4);
    head(hx, hy, p.head || {}); whiskers(hx, hy);
  };
  POSE.stand = function (p, t) { POSE.walk(Object.assign({}, p, { phase: 0.3, tailUp: p.tailUp == null ? 0.2 : p.tailUp }), t); };
  POSE.sit = function (p, t) {
    const X = OX, Y = OY, br = Math.sin(t * 1.6) * 0.3;
    const tl = []; for (let i = 0; i < 6; i++) tl.push([X - 9 + i * 3.6 + Math.sin(t * 1.3 + i) * (p.tailTwitch ? 0.8 : 0.2), Y - 3 + (i > 3 ? -(i - 3) * (1 + Math.max(0, Math.sin(t * 2.4)) * (p.tailTwitch ? 1.6 : 0.3)) : 0)]);
    tail([X - 10, Y - 5], tl, true);
    fur([[X - 6, Y - 7, 7.2]], (v, s) => tabby(v, s + 2), 1.6);
    fur([[X - 5, Y - 8, 6.6], [X + 1, Y - 15, 6.2], [X + 4, Y - 19 - br, 5.6]], (v, s, px, py) => tabby(v * 0.6, s), 1.6);
    for (let i = -2; i <= 3; i++) put(X - 1 + i, Y, i > 1 ? "W" : "w"); for (let i = -1; i <= 2; i++) put(X - 1 + i, Y - 1, "w");
    seg2(X + 5, Y - 15, X + 5, Y - 2, 2.3, 1.8, () => "D"); seg2(X + 8, Y - 15, X + 8, Y - 2, 2.4, 1.9, (v, s) => (Math.sin(s * 1.4) > 0.6 ? "d" : "O"));
    for (const fx of [X + 5, X + 8]) { for (let k = 0; k < 4; k++) for (let i = -1; i <= 1; i++) put(fx + i, Y - k, i > 0 || fx === X + 5 ? "W" : "w"); put(fx + 2, Y, "W"); }
    fur([[X + 6, Y - 13, 4.6], [X + 6, Y - 8, 3.4]], white, 2.6);
    if (p.scratch) { const k = Math.sin(t * 22) * 1.5; seg2(X - 3, Y - 7, X + 5 + k, Y - 20, 2.8, 1.8, plain); for (let i = -1; i <= 1; i++) put(X + 5 + k + i, Y - 21, "w"); }
    const paw = p.paw || 0; if (paw) { seg2(X + 8, Y - 15, X + 10, Y - 20 - paw, 2.2, 1.8, plain); for (let i = -1; i <= 1; i++) { put(X + 10 + i, Y - 21 - paw, "w"); put(X + 10 + i, Y - 22 - paw, "w"); } }
    const hx = X + 7 + (p.headX || 0), hy = Y - 25 - br + (p.headDown || 0);
    fur([[X + 4, Y - 19, 5.8], [hx - 1, hy + 3, 5.6]], plain, 2.6);
    head(hx, hy, p.head || {}); whiskers(hx, hy);
  };
  POSE.loaf = function (p, t) {
    const X = OX, Y = OY, br = Math.sin(t * 1.2) * 0.45, hang = p.hang;
    if (hang) { const tl = []; for (let i = 0; i < 6; i++) tl.push([X - 14 - Math.sin(t * 0.9 + i * 0.5) * 0.7 * (i / 5), Y - 3 + (i + 1) * 4.2]); tail([X - 13, Y - 6], tl, true); }
    else { const tl = []; for (let i = 0; i < 6; i++) tl.push([X - 13 + i * 4.4, Y - 2 - (i > 4 ? 1 : 0)]); tail([X - 14, Y - 5], tl, true); }
    fur([[X - 9, Y - 8, 7.6 + br], [X + 1, Y - 8.5, 7.8 + br], [X + 8, Y - 8, 6.8]], (v, s, px) => (v > 0.55 && px > X + 2 ? white(v - 0.4) : tabby(v, s)), 1.8);
    [X + 9, X + 13].forEach((fx, q) => { const up = p.knead && (Math.floor(t * 2.6) % 2 === q) ? 1 : 0; for (let i = 0; i < 3; i++) { put(fx + i, Y - up, i === 2 ? "W" : "w"); put(fx + i, Y - 1 - up, "w"); } });
    fur([[X + 10, Y - 6, 4.4]], white, 2.6);
    const asleep = p.asleep, hx = X + (asleep ? 10 : 12), hy = Y - (asleep ? 10 : 14) + (asleep ? br * 0.5 : 0);
    fur([[X + 8, Y - 10, 5.6], [hx - 1, hy + 2, 5.4]], plain, 2.4);
    head(hx, hy, p.head || {}); whiskers(hx, hy);
  };
  POSE.back = function (p, t) {
    const X = OX, Y = OY, w = Math.sin(t * 3) * 1.2;
    const tl = []; for (let i = 0; i < 6; i++) tl.push([X - 14 - i * 3.6, Y - 3 - Math.max(0, Math.sin(t * 3.2 - i * 0.6)) * i * 0.8]); tail([X - 12, Y - 4], tl, true);
    fur([[X - 9, Y - 7, 7], [X + 1, Y - 7.5, 7.4], [X + 8, Y - 7, 6.4]], (v, s, px, py) => (v < 0.15 ? white(v + 0.2) : tabby(-v, s)), 2);
    for (const [jx, k] of [[X - 9, 0], [X - 4, 1], [X + 5, 2], [X + 9, 3]]) { const a = Math.sin(t * 3.4 + k * 1.7) * 2; seg2(jx, Y - 11, jx + a, Y - 17, 2.2, 1.8, plain); for (let i = -1; i <= 1; i++) { put(jx + a + i, Y - 18, "w"); put(jx + a + i, Y - 19, i ? "W" : "w"); } }
    const hx = X + 14, hy = Y - 8 + w * 0.3;
    fur([[X + 9, Y - 7, 5.6], [hx - 1, hy + 1, 5.4]], plain, 2.4);
    head(hx, hy, p.head || { eyes: "happy" }); whiskers(hx, hy);
  };
  POSE.rear = function (p, t) { // debout sur les pattes arrière
    const X = OX, Y = OY, s = Math.sin(t * 1.4) * 0.5;
    const tl = []; for (let i = 0; i < 6; i++) tl.push([X - 8 - i * 3.4, Y - 2 - (i > 3 ? (i - 3) * 1.4 : 0) + Math.sin(t * 2 + i) * 0.3]); tail([X - 6, Y - 6], tl, true);
    seg2(X - 4, Y - 9, X - 3, Y - 1, 3, 2, () => "D"); seg2(X - 1, Y - 9, X + 1, Y - 1, 3.2, 2.2, plain);
    for (const fx of [X - 3, X + 1]) for (let i = -1; i <= 2; i++) { put(fx + i, Y, "w"); put(fx + i, Y - 1, "w"); }
    fur([[X - 3, Y - 10, 6.4], [X + 1, Y - 20, 6], [X + 3, Y - 29 + s, 5.6]], (v, s2, px) => (px > X + 2 ? white(v) : tabby(v * 0.5, s2)), 1.8);
    fur([[X + 5, Y - 22, 4.2], [X + 5, Y - 14, 3.4]], white, 2.4);
    seg2(X + 4, Y - 27, X + 10, Y - 29, 2.2, 1.8, plain); for (let i = 0; i < 3; i++) { put(X + 10 + i, Y - 30, "w"); put(X + 10 + i, Y - 29, "W"); }
    const hx = X + 6, hy = Y - 36 + s;
    fur([[X + 3, Y - 29, 5.6], [hx - 1, hy + 3, 5.4]], plain, 2.4);
    head(hx, hy, p.head || {}); whiskers(hx, hy);
  };
  POSE.crouch = function (p, t) {
    const X = OX, Y = OY, wig = p.wiggle ? Math.round(Math.sin(t * 16) * 1) : 0;
    const tl = []; for (let i = 0; i < 6; i++) tl.push([X - 15 - i * 3.6, Y - 6 + (i > 3 ? Math.sin(t * 9) * 1.5 * (i - 3) : 0)]); tail([X - 13, Y - 8], tl, true);
    leg(X - 9 + wig, Y - 7, X - 11 + wig, Y, -2.5, false, true, 3); leg(X + 8, Y - 5, X + 12, Y, 1, true, true, 2);
    fur([[X - 9 + wig, Y - 9, 6.4], [X, Y - 7, 5.6], [X + 8, Y - 6.5, 5.6]], tabby, 1.6);
    leg(X - 8 + wig, Y - 6, X - 7 + wig, Y, -2.5, false, false, 3); leg(X + 10, Y - 4, X + 15, Y, 1, true, false, 2);
    const hx = X + 16, hy = Y - 9;
    fur([[X + 10, Y - 7, 5.4], [hx - 1, hy + 2, 5.2]], plain, 2.2);
    head(hx, hy, p.head || { eyes: "wide" }); whiskers(hx, hy);
  };
  POSE.leap = function (p, t) {
    const X = OX, Y = OY - 6, a = p.pitch || 0;
    const hip = [X - 11, Y - 8 + a * 4], sho = [X + 10, Y - 9 - a * 4];
    const tl = []; for (let i = 0; i < 6; i++) tl.push([hip[0] - 5 - i * 3.8, hip[1] - 1 + a * i * 1.2]); tail([hip[0] - 4, hip[1] - 1], tl, true);
    leg(hip[0], hip[1] + 3, hip[0] - 9, hip[1] + 7 + a * 2, 1.5, false, true); leg(sho[0], sho[1] + 3, sho[0] + 9, sho[1] + 5 - a * 3, -1, true, true);
    fur([[hip[0], hip[1], 6], [X, Y - 8.5, 5.4], [sho[0], sho[1], 6.2]], (v, s, px) => (v > 0.74 && px > X - 4 && px < X + 6 ? "W" : tabby(v, s)), 0.9);
    leg(hip[0] + 1, hip[1] + 4, hip[0] - 7, hip[1] + 9 + a * 2, 1.5, false, false); leg(sho[0] + 2, sho[1] + 4, sho[0] + 11, sho[1] + 7 - a * 3, -1, true, false);
    const hx = sho[0] + 8, hy = sho[1] - 4 - a * 2;
    fur([[sho[0] + 3, sho[1] - 1, 5.4], [hx - 1, hy + 2, 5.2]], plain, 2.2);
    head(hx, hy, p.head || { eyes: "wide" }); whiskers(hx, hy);
  };
  POSE.stretch = function (p, t) {
    const X = OX, Y = OY, k = p.k == null ? 1 : p.k;
    const hip = [X - 9, Y - 14 - k * 2], sho = [X + 9, Y - 14 + k * 7];
    tail([hip[0] - 5, hip[1] - 2], tailCurve(hip[0] - 5, hip[1] - 2, -1.9, 0.2, 4.6, 0.05, t), true);
    leg(hip[0] + 1, hip[1] + 3, hip[0] - 1, Y, -2.2, false, true); leg(sho[0], sho[1] + 3, sho[0] + 9 * k + 2, Y, 1.2 - k, true, true);
    fur([[hip[0], hip[1], 6.4], [X, (hip[1] + sho[1]) / 2 + 0.6, 5.8], [sho[0], sho[1], 6.2]], tabby, 1.6);
    leg(hip[0], hip[1] + 4, hip[0] + 1, Y, -2.4, false, false); leg(sho[0] + 2, sho[1] + 4, sho[0] + 10 * k + 4, Y, 1.2 - k, true, false);
    const hx = sho[0] + 8, hy = sho[1] - 5 + k;
    fur([[sho[0] + 3, sho[1] - 1, 5.4], [hx - 1, hy + 2, 5.2]], plain, 2.2);
    head(hx, hy, p.head || { eyes: "happy" }); whiskers(hx, hy);
  };
  POSE.curl = function (p, t) { // en boule : la queue ramenée devant le nez
    const X = OX, Y = OY, br = Math.sin(t * 1.1) * 0.5;
    fur([[X - 7, Y - 8, 7.8 + br], [X + 3, Y - 8.5, 8 + br], [X + 9, Y - 7, 6.4]], (v, s) => tabby(v * 0.8, s), 1.8);
    const hx = X + 9, hy = Y - 6;
    fur([[X + 6, Y - 8, 5.6], [hx - 1, hy + 1, 5.6]], plain, 2.2);
    head(hx, hy, p.head || { eyes: "closed" });
    const tl = []; for (let i = 0; i < 6; i++) { const a = Math.PI * (1.02 - i * 0.2); tl.push([X + 1 + Math.cos(a) * 15, Y - 3 - Math.max(0, Math.sin(a)) * 1.5 + (i > 4 ? -1 : 0)]); }
    tail([X - 14, Y - 5], tl, true);
    if (p.pawNose) { for (let i = 0; i < 4; i++) { put(hx - 3 + i, hy + 4, "w"); put(hx - 3 + i, hy + 5, i > 2 ? "W" : "w"); } }
  };
  POSE.side = function (p, t) { // allongé sur le flanc, pattes étirées
    const X = OX, Y = OY, br = Math.sin(t * 1.1) * 0.5;
    const tl = []; for (let i = 0; i < 6; i++) tl.push([X - 17 - i * 3.6, Y - 3 - (p.flick ? Math.max(0, Math.sin(t * 5 - i * 0.7)) * i * 0.7 : 0)]); tail([X - 14, Y - 4], tl, true);
    fur([[X - 11, Y - 6.5, 6.2 + br], [X - 1, Y - 7, 6.8 + br], [X + 8, Y - 6, 5.8]], (v, s, px) => (v > 0.35 ? white(v - 0.3) : tabby(v, s)), 1.8);
    seg2(X - 9, Y - 3, X - 1, Y - 1, 2.6, 1.8, plain); seg2(X + 6, Y - 3, X + 15, Y - 1, 2.2, 1.7, plain);
    for (const fx of [X, X + 16]) for (let i = 0; i < 3; i++) { put(fx + i, Y - 1, "w"); put(fx + i, Y, i === 2 ? "W" : "w"); }
    const hx = X + 14, hy = Y - 8;
    fur([[X + 9, Y - 7, 5.4], [hx - 1, hy + 1, 5.4]], plain, 2.2);
    head(hx, hy, Object.assign({ tilt: 1 }, p.head || { eyes: "closed" })); whiskers(hx + 1, hy);
  };
  POSE.sitBack = function (p, t) { // assis de dos : il regarde ailleurs
    const X = OX, Y = OY, br = Math.sin(t * 1.5) * 0.3, turn = p.turn || 0;
    if (p.hang) { const tl = []; for (let i = 0; i < 6; i++) tl.push([X + 6 + Math.sin(t * 0.8 + i * 0.5) * (p.flick ? 1.6 : 0.5) * (i / 5), Y + (i + 1) * 4]); tail([X + 5, Y - 4], tl, true); }
    else { const tl = []; for (let i = 0; i < 6; i++) tl.push([X + 9 + i * 3.4, Y - 2 - (i > 3 ? (i - 3) * (p.flick ? 1.8 : 0.4) * Math.max(0, Math.sin(t * 3)) : 0)]); tail([X + 7, Y - 4], tl, true); }
    fur([[X, Y - 7.5, 8.6], [X, Y - 15, 7], [X, Y - 21 - br, 5.8]], (v, s, px) => (Math.abs(px - X) < 1.2 ? "D" : Math.sin(s * 1.1 + Math.abs(px - X) * 0.5) > 0.55 ? "d" : px < X - 4 ? "o" : "O"), 1.8);
    const hx = X + turn * 2, hy = Y - 27 - br;
    fur([[hx, hy, 6.6]], (v, s, px) => (Math.abs(px - hx) < 1 ? "d" : v < -0.4 ? "o" : "O"), 1.6);
    for (const sgn of [-1, 1]) { const ex = hx + sgn * 5; for (let k = 0; k < 4; k++) for (let i = -(3 - k) / 2; i <= (3 - k) / 2 + 0.5; i++) put(ex + i * 1.2, hy - 5 - k, k === 3 ? "d" : i * sgn > 0.4 ? "d" : "O", sgn * 0.4, -0.5); put(ex + sgn * (p.twitch ? 1 : 0), hy - 9, "y"); }
    if (turn) { put(hx + turn * 6, hy + 1, "w"); put(hx + turn * 7, hy + 2, "w"); put(hx + turn * 6, hy - 1, "e"); }
  };
  T.POSES = Object.keys(POSE);

  // ---------------------------------------------------------------- rendu d'une pose dans le tampon de la scène
  // B : tampon de matière (CR.lum.Buf) ; (x, y) : appui au sol ; dir : 1 droite, -1 gauche
  T.render = function (B, x, y, dir, pose, p, t, z) {
    spr.fill(0); sprN.fill(0); wsk.length = 0;
    (POSE[pose] || POSE.stand)(p || {}, t || 0);
    // contour : brun sombre, plus léger au-dessus
    far.set(spr);
    for (let j = 1; j < SH - 1; j++) for (let i = 1; i < SW - 1; i++) { if (far[j * SW + i]) continue; const below = far[(j - 1) * SW + i], side = far[j * SW + i - 1] || far[j * SW + i + 1], above = far[(j + 1) * SW + i]; if (below || side) spr[j * SW + i] = IDX.x; else if (above) spr[j * SW + i] = IDX.D; }
    for (const [wx, wy] of wsk) if (wx >= 0 && wy >= 0 && wx < SW && wy < SH && (!spr[wy * SW + wx] || spr[wy * SW + wx] === IDX.x) && !far[wy * SW + wx]) spr[wy * SW + wx] = IDX.W;
    B.mat(z == null ? 40 : z, 255, 0);
    x = Math.round(x); y = Math.round(y);
    const relief = !!B.a; // tampon du nouveau moteur : chaque pixel porte sa normale
    for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) { const q = j * SW + i, k = spr[q]; if (!k) continue; if (relief) { B.nx = 128 + sprN[q * 2] * (dir >= 0 ? 1 : -1); B.ny = 128 + sprN[q * 2 + 1]; } B.px(x + (dir >= 0 ? i - OX : OX - i), y + j - OY, RGB[k]); }
    if (relief) { B.nx = 128; B.ny = 128; }
    // les yeux accrochent la lumière
    if (!p || !p.head || !p.head.eyes || p.head.eyes === "open" || p.head.eyes === "wide") { B.mat(z == null ? 40 : z, 255, 70); for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) { const k = spr[j * SW + i]; if (k === IDX.e || k === IDX.h) B.px(x + (dir >= 0 ? i - OX : OX - i), y + j - OY, RGB[k]); } B.mat(z == null ? 40 : z, 255, 0); }
  };

  // ---------------------------------------------------------------- comportement
  const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)], chance = (p) => Math.random() < p;
  const heureDe = (w) => { try { if (w && w.heure) return w.heure(); } catch (e) { /* horloge du jeu absente */ } const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  function perches(w) {
    const P = [];
    if (w.chaise) P.push({ id: "chaise", x: w.chaise.x + 3, y: w.chaise.y, app: w.chaise.x - 26, hang: true });
    if (w.appui) P.push({ id: "appui", x: (w.appui.x0 + w.appui.x1) / 2 + rnd(-0.4, 0.4) * (w.appui.x1 - w.appui.x0), y: w.appui.y, app: (w.appui.x0 + w.appui.x1) / 2 - 20, hang: true });
    for (const q of w.perches || []) P.push(q);
    return P;
  }
  T.create = function (w) {
    const P = perches(w), dep = P.find((q) => q.id === "chaise") || (w.sansSol ? P[0] : null), h = heureDe(w), nuit = h >= 22 || h < 7;
    return { x: dep ? dep.x : (w.x0 + w.x1) / 2, y: dep ? dep.y : w.sol + 12, dir: -1, st: dep ? (nuit ? "dodo" : "miche") : "assis", until: rnd(4, 9), phase: 0, on: dep ? dep.id : "sol", pet: 0, fx: [], prises: 0, t: 0, jump: null, look: 0, blink: 0, twitch: 0, next: [],
      envie: { sommeil: nuit ? 0.8 : 0.3, jeu: rnd(0.2, 0.6), curio: rnd(0.2, 0.6), soin: rnd(0.1, 0.5), calin: rnd(0.2, 0.5) }, hist: [], plan: [], fl: {}, nBlink: rnd(1, 4), nTw: rnd(2, 6), nGaze: rnd(1, 3), gaze: 0, flick: 0, nFlick: rnd(3, 8), calme: 0, vu: 0 };
  };
  const say = (c, txt, x, y) => c.fx.push({ k: "mot", txt, x, y, t: 0 });
  function goto(c, st, dur, fl) { c.st = st; c.until = c.t + dur; c.fl = fl || {}; }
  function jumpTo(c, x, y, on, then, fl) { c.jump = { x0: c.x, y0: c.y, x1: x, y1: y, t: 0, d: 0.55 + Math.abs(y - c.y) / 160 + Math.abs(x - c.x) / 400, on, then, fl }; c.dir = x >= c.x ? 1 : -1; c.st = "saut"; c.prep = 0.28; }

  // Les activités : poids(c, k) selon les envies et le moment ; plan(c, w, k) → suite d'étapes.
  // Étape : { st, d, fl } (tenir une pose), { va: x } (marcher), { saut: perche | "sol" , then, fl }, { dit: mot }, { fx: envie → variation }.
  const toilette = () => { const e = [{ st: "toilette", d: rnd(1.6, 3), fl: { mode: "patte" } }, { st: "toilette", d: rnd(1.4, 2.6), fl: { mode: "visage" } }, { st: "toilette", d: rnd(1.5, 2.5), fl: { mode: "flanc" } }, { st: "assis", d: rnd(0.8, 1.6), fl: { gratte: 1 } }].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3)); if (chance(0.4)) e.push({ st: "assis", d: 1.3, fl: { baille: 1 } }); return e.concat([{ fx: { soin: -0.7 } }]); };
  const somme = (perche) => { const e = []; if (chance(0.6)) e.push({ st: "miche", d: rnd(2, 4), fl: { petrit: 1 } }); if (chance(0.5)) e.push({ st: "miche", d: 1.4, fl: { baille: 1 } }); e.push(chance(0.5) ? { st: "dodo", d: rnd(14, 30) } : { st: "boule", d: rnd(14, 30), fl: { nez: chance(0.5) } }); e.push({ fx: { sommeil: -0.8 } }); if (chance(0.7)) e.push({ st: perche ? "miche" : "assis", d: 1.4, fl: { baille: 1 } }); return e; };
  const ACT = {
    balade: { sol: 1, poids: (c) => 0.6 + c.envie.curio * 0.6, plan: (c, w) => [{ va: rnd(w.x0, w.x1) }, chance(0.5) ? { st: "assis", d: rnd(1.5, 4), fl: { tilt: chance(0.4) ? pick([-1, 1]) : 0 } } : { st: "debout", d: rnd(1, 2.5) }] },
    toilette: { sol: 1, perche: 1, poids: (c) => 0.2 + c.envie.soin * 1.6, plan: toilette },
    etire: { sol: 1, poids: (c) => 0.35, plan: () => [{ st: "etire", d: 1.8 }, chance(0.5) ? { st: "assis", d: 1.3, fl: { baille: 1 } } : { st: "assis", d: rnd(1, 2) }] },
    folie: { sol: 1, poids: (c, k) => c.envie.jeu * (k.crepuscule ? 2.2 : k.nuit ? 1.3 : 0.7) - c.envie.sommeil * 0.6, plan: (c, w) => { const e = []; let x = c.x; for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) { x = x < (w.x0 + w.x1) / 2 ? rnd((w.x0 + w.x1) / 2, w.x1) : rnd(w.x0, (w.x0 + w.x1) / 2); e.push({ cours: x }); if (chance(0.5)) e.push({ st: "affut", d: rnd(0.4, 0.9) }); } e.push({ st: "assis", d: rnd(1.5, 3), fl: { tilt: pick([-1, 0, 1]) } }, { fx: { jeu: -0.7 } }); return e; } },
    mouche: { sol: 1, perche: 1, poids: (c, k) => (c.envie.jeu + c.envie.curio) * (k.jour ? 0.8 : 0.4), plan: () => { const e = []; for (let i = 0, n = 3 + Math.floor(Math.random() * 4); i < n; i++) e.push({ st: "assis", d: rnd(0.5, 1.3), fl: { vise: pick([-1, 0, 1]), haut: chance(0.6) ? -2 : 0, claque: chance(0.3) } }); e.push({ st: "assis", d: 0.5, fl: { patte: 2, haut: -2 } }, { st: "assis", d: rnd(1, 2), fl: { tilt: pick([-1, 1]) } }, { fx: { curio: -0.4, jeu: -0.2 } }); return e; } },
    plante: { sol: 1, poids: (c, k, w) => (w.plante ? 0.25 + c.envie.curio * 0.6 : 0), plan: (c, w) => [{ va: w.plante.x - 11 }, { face: 1 }, { st: "renifle", d: rnd(2.5, 4.5) }, { fx: { curio: -0.3 } }] },
    joueur: { sol: 1, poids: (c, k) => (k.souris ? c.envie.calin * 1.8 : 0), plan: (c, w, k) => [{ va: cl(k.souris.x - 10, w.x0, w.x1) }, { st: "assis", d: rnd(1.4, 2.4), fl: { haut: -2, suis: 1 } }, { dit: pick(["MIAOU", "MRRP ?", "PRRT", "MIAOU ?"]) }, { st: "assis", d: rnd(1.6, 3), fl: { haut: -2, suis: 1, doux: 1 } }, { fx: { calin: -0.35 } }] },
    tapis: { sol: 1, poids: (c, k) => c.envie.sommeil * (k.nuit ? 0.9 : 0.6), plan: () => [chance(0.5) ? { st: "flanc", d: rnd(8, 18), fl: { queue: chance(0.5) } } : { st: "boule", d: rnd(10, 22), fl: { nez: chance(0.4) } }, { fx: { sommeil: -0.5 } }, { st: "etire", d: 1.8 }] },
    boude: { sol: 1, poids: (c) => 0.18 + (c.calme > 40 ? 0.3 : 0), plan: () => [{ st: "dosTourne", d: rnd(3, 6), fl: { queue: 1 } }, { st: "dosTourne", d: rnd(1, 2), fl: { coup: pick([-1, 1]) } }] },
    chaise: { sol: 1, poids: (c, k, w, P) => (P.some((q) => q.id === "chaise") ? 0.2 + c.envie.sommeil * 1.5 : 0), plan: (c, w, k, P) => { const q = P.find((z) => z.id === "chaise"); return [{ va: q.app }, { saut: q, then: "miche" }].concat(somme(true)); } },
    appui: { sol: 1, poids: (c, k, w, P) => (P.some((q) => q.id === "appui") ? 0.25 + c.envie.curio * (k.pluie ? 1.6 : k.jour ? 1.3 : 0.7) : 0), plan: (c, w, k, P) => { const q = P.find((z) => z.id === "appui"); return [{ va: q.app }, { saut: q, then: "assis" }]; } },
    bureau: { sol: 1, poids: (c, k, w, P) => (P.some((q) => q.id === "bureau") ? 0.2 + (k.nuit ? 0.5 : 0.15) + c.envie.calin * 0.5 : 0), plan: (c, w, k, P) => { const q = P.find((z) => z.id === "bureau"); return [{ va: q.app }, { saut: q, then: "assis" }]; } },
    // sur un perchoir
    guet: { perche: 1, poids: (c, k) => (c.on === "appui" ? 0.5 + c.envie.curio : 0.1), plan: (c, w, k) => { const e = []; for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) e.push(chance(0.5) ? { st: "dosTourne", d: rnd(3, 7), fl: { queue: chance(0.5), coup: chance(0.3) ? pick([-1, 1]) : 0, pend: 1 } } : { st: "guetteur", d: rnd(2.5, 6), fl: { claque: !k.nuit && chance(0.5), vise: pick([-1, 0, 1]) } }); e.push({ fx: { curio: -0.5 } }); return e; } },
    miche: { perche: 1, poids: (c) => 0.4 + c.envie.sommeil * 0.4, plan: () => [{ st: "miche", d: rnd(4, 9), fl: { petrit: chance(0.3) } }] },
    sieste: { perche: 1, poids: (c, k) => c.envie.sommeil * (k.nuit ? 2.4 : 1.5), plan: () => somme(true) },
    lampe: { perche: 1, poids: (c, k) => (c.on === "bureau" ? 0.5 + (k.nuit ? 0.6 : 0) : 0), plan: () => [{ st: "assis", d: rnd(1.5, 3), fl: { tilt: pick([-1, 1]) } }, { st: "assis", d: 0.5, fl: { patte: 2 } }, { st: "assis", d: 0.4, fl: { patte: 1 } }, { st: "assis", d: 0.5, fl: { patte: 2 } }, { st: "miche", d: rnd(5, 10), fl: { doux: 1 } }] },
    descend: { perche: 1, poids: (c, k, w) => (w.sansSol ? 0 : 0.25 + c.envie.jeu * 0.7 + (k.souris ? c.envie.calin * 0.6 : 0)), plan: (c, w) => [{ saut: "sol", then: chance(0.5) ? "etire" : "assis" }] },
    change: { perche: 1, poids: (c, k, w, P) => (w.sansSol && P.length > 1 ? 0.35 : 0), plan: (c, w, k, P) => [{ saut: pick(P.filter((q) => q.id !== c.on)), then: "assis" }] },
  };
  T.ACT = ACT;
  function choisir(c, w, k) {
    const P = perches(w), surSol = c.on === "sol", cand = [];
    let tot = 0;
    for (const id in ACT) { const a = ACT[id]; if (surSol ? !a.sol : !a.perche) continue; let p = Math.max(0, a.poids(c, k, w, P)); const r = c.hist.lastIndexOf(id); if (r >= 0) p *= c.hist.length - r <= 2 ? 0.12 : 0.5; if (p > 0.001) { cand.push([id, p]); tot += p; } }
    if (!cand.length) return [{ st: surSol ? "assis" : "miche", d: rnd(2, 4) }];
    let u = Math.random() * tot, id = cand[0][0]; for (const [i, p] of cand) { u -= p; if (u <= 0) { id = i; break; } }
    c.hist.push(id); if (c.hist.length > 6) c.hist.shift(); c.act = id;
    return ACT[id].plan(c, w, k, P) || [];
  }
  function avancer(c, w) { // lance l'étape suivante du scénario ; renvoie false s'il est fini
    for (;;) {
      const e = c.plan.shift(); if (!e) return false;
      if (e.fx) { for (const n in e.fx) c.envie[n] = cl(c.envie[n] + e.fx[n], 0, 1); continue; }
      if (e.dit) { say(c, e.dit, c.x, c.y - 36); c.miaou = c.t + 0.6; continue; }
      if (e.face) { c.dir = e.face; continue; }
      if (e.va != null) { if (c.on !== "sol") continue; c.tx = cl(e.va, w.x0, w.x1); c.st = "marche"; c.fl = {}; return true; }
      if (e.cours != null) { if (c.on !== "sol") continue; c.tx = cl(e.cours, w.x0, w.x1); c.st = "course"; c.fl = { libre: 1 }; return true; }
      if (e.saut) { if (e.saut === "sol") jumpTo(c, cl(c.x + (chance(0.5) ? -28 : 28), w.x0, w.x1), w.sol + 12, "sol", e.then, e.fl); else jumpTo(c, e.saut.x, e.saut.y, e.saut.id, e.then, e.fl); return true; }
      goto(c, e.st, e.d, e.fl); return true;
    }
  }
  T.update = function (c, dt, w, inp) {
    inp = inp || {}; c.t += dt; const t = c.t, m = inp.mouse, near = m ? Math.hypot(m.x - c.x, m.y - (c.y - 12)) : 999, E = c.envie;
    const h = heureDe(w), k = { nuit: h >= 22 || h < 6.5, jour: h >= 9 && h < 18, crepuscule: (h >= 6.5 && h < 8.5) || (h >= 18 && h < 21), pluie: !!w.pluie, souris: m && inp.moved ? m : c.vu > t ? m : null };
    if (m && inp.moved) { c.vu = t + 6; c.calme = 0; } else c.calme += dt;
    // les envies montent toutes seules, à leur rythme
    const dort = c.st === "dodo" || c.st === "boule" || c.st === "flanc";
    E.sommeil = cl(E.sommeil + dt * (dort ? -0.012 : k.nuit ? 0.0085 : h > 13 && h < 16 ? 0.006 : 0.0035), 0, 1);
    E.jeu = cl(E.jeu + dt * (dort ? 0.004 : k.crepuscule ? 0.008 : 0.0035), 0, 1); E.soin = cl(E.soin + dt * 0.0045, 0, 1);
    E.curio = cl(E.curio + dt * (k.pluie ? 0.006 : 0.004), 0, 1); E.calin = cl(E.calin + dt * (m ? 0.006 : 0.002), 0, 1);
    // petits gestes, tirés au hasard
    c.nBlink -= dt; if (c.nBlink < 0) { c.blink = 1; c.nBlink = chance(0.2) ? 0.3 : rnd(1.6, 6.5); c.blinkEnd = t + 0.13; } if (t > (c.blinkEnd || 0)) c.blink = 0;
    c.nTw -= dt; if (c.nTw < 0) { c.twitch = pick([1, 2]); c.nTw = rnd(2.5, 11); c.twEnd = t + rnd(0.12, 0.3); } if (t > (c.twEnd || 0)) c.twitch = 0;
    c.nFlick -= dt; if (c.nFlick < 0) { c.flick = t + rnd(0.6, 2.2); c.nFlick = rnd(4, 16); }
    c.nGaze -= dt; if (c.nGaze < 0) { c.gaze = pick([-1, 0, 0, 1]); c.nGaze = rnd(1.2, 5); }
    c.look = m && near < 150 ? cl(Math.round((m.x - c.x) * c.dir / 40), -1, 1) : c.fl.vise != null ? c.fl.vise : c.gaze;
    for (const f of c.fx) f.t += dt; c.fx = c.fx.filter((f) => f.t < (f.k === "mot" ? 1.6 : 1.4));
    // caresses : la souris qui bouge sur lui ; immobile tout près, il cligne lentement
    const over = m && near < 15 && c.st !== "saut" && c.st !== "bond";
    if (over && inp.moved) { c.pet += dt * 2.2; E.calin = cl(E.calin - dt * 0.2, 0, 1); if (chance(dt * 3)) c.fx.push({ k: "coeur", x: c.x + (Math.random() - 0.5) * 12, y: c.y - 26, t: 0 }); if (dort && c.pet > 1.2) goto(c, c.on === "sol" ? "assis" : "miche", 4, { doux: 1 }); } else c.pet = Math.max(0, c.pet - dt * 0.5);
    if (over && !inp.moved && !dort) { c.fixe = (c.fixe || 0) + dt; if (c.fixe > 2.5) { c.fixe = -4; c.doux = t + 1.1; c.fx.push({ k: "coeur", x: c.x, y: c.y - 28, t: 0 }); } } else if ((c.fixe || 0) > 0) c.fixe = 0; else if (c.fixe < 0) c.fixe += dt;
    if (inp.click && near < 16 && c.st !== "saut") { say(c, pick(["MIAOU", "MRRP", "MIAOU ?", "PRRT", "MRRRAOU"]), c.x, c.y - 34); c.miaou = t + 0.5; if (dort) { c.plan = []; goto(c, c.on === "sol" ? "assis" : "miche", 4, { baille: chance(0.5) }); } inp.used = true; }
    if (c.pet > 2.6 && c.on === "sol" && c.st !== "dos" && c.st !== "saut" && c.st !== "bond") { c.plan = []; goto(c, "dos", 5); }
    // l'orage : il sursaute, oreilles couchées
    if (inp.orage && c.st !== "saut" && c.st !== "bond") { c.plan = [{ st: c.on === "sol" ? "guet" : "miche", d: rnd(1.5, 3), fl: { peur: 1 } }, { st: c.on === "sol" ? "assis" : "miche", d: rnd(2, 4), fl: { vise: 0, haut: -1 } }]; c.fx.push({ k: "mot", txt: "!", x: c.x, y: c.y - 34, t: 0 }); avancer(c, w); }
    // saut en cours
    if (c.st === "saut") { const j = c.jump; if (!j) { goto(c, "assis", 2); return; } if (c.prep > 0) { c.prep -= dt; return; } j.t += dt / j.d; const u = Math.min(1, j.t), hh = Math.max(18, (j.y0 - j.y1) * 0.35 + 22); c.x = lerp(j.x0, j.x1, u); c.y = lerp(j.y0, j.y1, u) - Math.sin(u * Math.PI) * hh; c.pitch = Math.cos(u * Math.PI) * (j.y1 < j.y0 ? 0.9 : 0.6) + (j.y1 > j.y0 ? -0.4 * u : 0); if (u >= 1) { c.x = j.x1; c.y = j.y1; c.on = j.on; c.jump = null; goto(c, j.then || "assis", rnd(1.5, 3.5), j.fl); } return; }
    // la chasse : point lumineux ou boulette
    const prey = w.sansSol ? null : inp.laser && m && m.y > w.sol - 30 ? { x: cl(m.x, w.x0, w.x1), y: w.sol + 12 } : inp.ball && inp.ball.rest && inp.ball.y > w.sol - 4 ? { x: inp.ball.x, y: inp.ball.y, ball: true } : null;
    if (prey && c.on !== "sol") { c.plan = []; jumpTo(c, cl(c.x + (prey.x < c.x ? -26 : 26), w.x0, w.x1), w.sol + 12, "sol", "guet"); return; }
    if (prey && c.on === "sol") {
      c.plan = []; E.jeu = cl(E.jeu - dt * 0.05, 0, 1);
      const dx = prey.x - c.x, ad = Math.abs(dx);
      if (c.st === "bond") { const j = c.bond; j.t += dt / 0.36; const u = Math.min(1, j.t); c.x = lerp(j.x0, j.x1, u); c.y = w.sol + 12 - Math.sin(u * Math.PI) * 11; c.pitch = Math.cos(u * Math.PI) * 0.6; if (u >= 1) { c.y = w.sol + 12; if (Math.abs(prey.x - c.x) < 12) { c.prises++; inp.caught = prey.ball ? "ball" : "laser"; say(c, prey.ball ? "TOC" : "ATTRAPE", c.x, c.y - 30); } goto(c, "guet", 0.5); c.cool = t + rnd(0.3, 0.8); } return; }
      c.dir = dx >= 0 ? 1 : -1; c.fl = {};
      if (ad > 44) { c.st = "course"; c.x += c.dir * 62 * dt; c.phase += dt * 3.2; }
      else if (ad > 9 && t > (c.cool || 0)) { if (c.st !== "affut") { c.st = "affut"; c.aff = t + rnd(0.45, 1.1); } else if (t > c.aff) { c.st = "bond"; c.bond = { x0: c.x, x1: cl(prey.x + c.dir * 2, w.x0, w.x1), t: 0 }; } }
      else c.st = "guet";
      return;
    }
    if ((c.st === "course" && !c.fl.libre) || c.st === "bond" || ((c.st === "affut" || c.st === "guet") && c.until < t && !c.plan.length && !c.fl.peur && c.aff)) { c.aff = 0; goto(c, "assis", rnd(1.5, 3), { tilt: pick([-1, 0, 1]) }); }
    // le quotidien : marcher, courir, tenir la pose, puis l'étape suivante
    if (c.st === "marche" || (c.st === "course" && c.fl.libre)) { const run = c.st === "course", dx = c.tx - c.x; c.dir = dx >= 0 ? 1 : -1; c.x += c.dir * (run ? 66 : 21) * dt; c.phase += dt * (run ? 3.2 : 1.55); if (Math.abs(dx) < (run ? 4 : 2)) { c.x = c.tx; const n = c.next.shift(); if (n) n(); else if (!avancer(c, w)) goto(c, "assis", rnd(1, 2.5)); } return; }
    if (t < c.until) return;
    if (avancer(c, w)) return;
    c.plan = choisir(c, w, k);
    if (!avancer(c, w)) goto(c, c.on === "sol" ? "assis" : "miche", rnd(1.5, 3));
  };
  T.draw = function (B, c, z) {
    const t = c.t, fl = c.fl || {}, h = heureDe(null), jour = h >= 9 && h < 18;
    const miaou = t < (c.miaou || 0), doux = t < (c.doux || 0) || fl.doux, eyes = c.pet > 0.8 || doux ? "happy" : c.blink ? "closed" : "open", fk = t < c.flick || fl.queue;
    const H = (o) => Object.assign({ eyes, look: c.look, twitch: c.twitch, mouth: fl.baille ? "yawn" : miaou ? "open" : fl.claque && Math.floor(t * 12) % 2 ? "chatter" : null, tilt: fl.tilt || 0, ears: fl.peur ? "back" : "up", pupil: jour ? "slit" : "round" }, o || {});
    let pose = "stand", p = { head: H() };
    switch (c.st) {
      case "marche": pose = "walk"; p = { phase: c.phase, head: H() }; break;
      case "course": pose = "walk"; p = { phase: c.phase, run: 1, tailUp: 0.1, head: H({ eyes: "wide", look: 1 }) }; break;
      case "affut": pose = "crouch"; p = { wiggle: 1, head: H({ eyes: "wide", look: 1 }) }; break;
      case "guet": pose = "crouch"; p = { head: H({ eyes: "wide", look: fl.peur ? 0 : 1 }) }; break;
      case "bond": case "saut": pose = c.st === "saut" && c.prep > 0 ? "crouch" : "leap"; p = { pitch: c.pitch || 0, wiggle: c.st === "saut", head: H({ eyes: "wide", look: 1, ears: c.st === "bond" ? "back" : "up" }) }; break;
      case "assis": pose = "sit"; p = { tailTwitch: fk, paw: fl.patte || 0, scratch: fl.gratte, headDown: fl.haut || (fl.gratte ? 1 : 0), headX: fl.gratte ? -1 : 0, head: H(fl.gratte ? { eyes: "closed", tilt: 1 } : null) }; break;
      case "guetteur": pose = "sit"; p = { tailTwitch: 1, head: H({ eyes: c.blink ? "closed" : "open" }) }; break;
      case "toilette": { const q = Math.sin(t * 5 + Math.sin(t * 1.3) * 1.5) > 0, mode = fl.mode || "patte"; pose = "sit"; p = mode === "patte" ? { paw: 1 + (q ? 1 : 0), headDown: 2 + (q ? 1 : 0), headX: 1, head: H({ eyes: "closed", tongue: q }) } : mode === "visage" ? { paw: 3 + (q ? 1 : 0), headDown: 1, headX: 1, head: H({ eyes: "closed", tilt: q ? 1 : 0 }) } : { headDown: 4 + (q ? 1 : 0), headX: -3, head: H({ eyes: "closed", tongue: q, tilt: -1 }) }; break; }
      case "miche": pose = "loaf"; p = { hang: c.on === "chaise" || c.on === "appui", knead: fl.petrit, head: H({ eyes: c.pet > 0.8 || doux ? "happy" : c.blink ? "closed" : fl.peur ? "wide" : "half" }) }; break;
      case "dodo": pose = "loaf"; p = { hang: c.on === "chaise" || c.on === "appui", asleep: 1, head: H({ eyes: "closed", twitch: c.twitch, mouth: null, tilt: 0 }) }; break;
      case "boule": pose = "curl"; p = { pawNose: fl.nez, head: H({ eyes: "closed", mouth: null, tilt: 0 }) }; break;
      case "flanc": pose = "side"; p = { flick: fk, head: H({ eyes: "closed", mouth: null }) }; break;
      case "dosTourne": pose = "sitBack"; p = { hang: fl.pend || (c.on !== "sol" && c.on !== "bureau"), flick: fk, turn: fl.coup || 0, twitch: c.twitch }; break;
      case "dos": pose = "back"; p = { head: H({ eyes: "happy" }) }; break;
      case "renifle": pose = "rear"; p = { head: H({ eyes: c.blink ? "closed" : Math.sin(t * 0.9) > 0.3 ? "half" : "open", look: 1 }) }; break;
      case "etire": { const u = 1 - (c.until - t) / 1.8; pose = "stretch"; p = { k: Math.sin(cl(u, 0, 1) * Math.PI), head: H({ eyes: "happy" }) }; break; }
      default: pose = "stand"; p = { head: H() };
    }
    T.render(B, c.x, c.y, c.dir, pose, p, t, z);
    // ronron, mots, sommeil
    B.mat(z == null ? 40 : z, 0, 255);
    for (const f of c.fx) {
      if (f.k === "coeur") { const y = f.y - f.t * 9, x = f.x + Math.sin(f.t * 5) * 2; for (const [a, b] of [[-1, 0], [1, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [-1, 2], [0, 2], [1, 2], [0, 3]]) B.px(x + a, y + b, "#ff7a8a", 1 - f.t / 1.4); }
      else if (f.k === "mot") { const w0 = f.txt.length * 4 + 3, x = Math.round(f.x - w0 / 2), y = Math.round(f.y - f.t * 4); B.r(x - 1, y - 2, w0 + 1, 9, "#fbf3e6"); B.r(x, y - 3, w0 - 1, 1, "#fbf3e6"); B.r(x, y + 7, w0 - 1, 1, "#fbf3e6"); B.px(x + (w0 >> 1), y + 8, "#fbf3e6"); B.txt(f.txt, x + 1, y, "#2a1608"); }
    }
    if (c.st === "dodo" || c.st === "boule" || c.st === "flanc") { const q = Math.floor(t * 0.8) % 3; B.txt("Z", c.x + c.dir * 16 + q * 3, c.y - 22 - q * 4, "#cfe0ff"); }
    B.mat(z == null ? 40 : z, 255, 0);
  };
})();
