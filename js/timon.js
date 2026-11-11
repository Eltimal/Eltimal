/* La Permanence — Timon, le Maine Coon du cabinet (CR.timon).
   Roux tigré, plastron, museau et pattes blancs, yeux ambrés, plumets aux oreilles, queue en panache plus claire.
   Le corps est un squelette animé (échine, quatre pattes à deux segments, queue à sept nœuds) habillé de fourrure :
   la marche est une vraie allure à quatre temps, la queue suit avec retard. La tête est dessinée pixel par pixel,
   de trois quarts, avec ses états (yeux, oreilles, gueule). Le chat vit sa vie : il se promène, s'assoit, se lave,
   saute sur sa chaise pour dormir en miche, monte sur l'appui de fenêtre, regarde la souris, se laisse caresser,
   se roule sur le dos, chasse le point lumineux et la boulette de papier.
   Dessin : dans un petit tampon de palette (84 × 64), contour ajouté, puis posé dans le tampon de matière de la scène. */
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

  const spr = new Uint8Array(SW * SH), far = new Uint8Array(SW * SH);
  const put = (x, y, k) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < SW && y < SH) spr[y * SW + x] = IDX[k]; };
  const at = (x, y) => (x >= 0 && y >= 0 && x < SW && y < SH ? spr[y * SW + x] : 0);

  // ---------------------------------------------------------------- fourrure le long d'un axe
  // pts : [[x, y, rayon], …] ; shade(v, s, px, py) → clé de palette ; fuzz : poils du contour
  function fur(pts, shade, fuzz) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0] - p[2] - 2); x1 = Math.max(x1, p[0] + p[2] + 2); y0 = Math.min(y0, p[1] - p[2] - 2); y1 = Math.max(y1, p[1] + p[2] + 2); }
    let tot = 0; const seg = [];
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) || 0.001; seg.push([tot, l]); tot += l; }
    for (let py = Math.floor(y0); py <= Math.ceil(y1); py++) for (let px = Math.floor(x0); px <= Math.ceil(x1); px++) {
      let best = 1e9, bs = 0, br = 1, bv = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 0.001;
        const u = cl(((px - a[0]) * dx + (py - a[1]) * dy) / l2, 0, 1), cx = a[0] + dx * u, cy = a[1] + dy * u, r = lerp(a[2], b[2], u), d = Math.hypot(px - cx, py - cy) / r;
        if (d < best) { best = d; bs = (seg[i][0] + seg[i][1] * u); br = r; bv = (py - cy) / r; }
      }
      if (pts.length === 1) { const a = pts[0]; best = Math.hypot(px - a[0], py - a[1]) / a[2]; br = a[2]; bv = (py - a[1]) / a[2]; }
      const lim = 1 + (fuzz ? (h2(px, py) - 0.5) * fuzz / br : 0);
      if (best <= lim) put(px, py, shade(bv, bs, px, py));
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

  // ---------------------------------------------------------------- la tête, pixel par pixel (15 × 13)
  const HEAD = [
    "..d.........d..",
    ".dOd.......dOd.",
    ".OpOd.....dOpO.",
    ".OpOOoOdOoOOpO.",
    ".OOoOdOoOdOoOO.",
    "OOxxxOOwOOxxxOO",
    "OO...OOwOO...OO",
    "OO...OwwwO...OO",
    "OoOOOwwnwwOOOoO",
    "ooOOwwwkwwwOOoo",
    "oyyOwwkwkwwOyyo",
    ".yyywwwwwwwyyy.",
    "..oyyWWWWWyyo..",
  ];
  function head(cx, cy, o) {
    const x0 = Math.round(cx) - 7, y0 = Math.round(cy) - 6, ears = o.ears || "up";
    for (let j = 0; j < 13; j++) for (let i = 0; i < 15; i++) {
      let ch = HEAD[j][i];
      if (j < 3 && ears === "back") { ch = "."; }
      if (ch !== ".") put(x0 + i, y0 + j, ch);
    }
    if (ears === "back") { for (const s of [0, 1]) { const ex = s ? x0 + 12 : x0; put(ex, y0 + 2, "d"); put(ex + 1, y0 + 2, "O"); put(ex + 2, y0 + 2, "d"); put(ex + (s ? 2 : 0), y0 + 1, "d"); put(ex + (s ? 3 : -1), y0 + 1, "d"); put(ex + (s ? 3 : -1), y0 + 2, "O"); } }
    else { // plumets
      put(x0 + 2 + (o.twitch === 1 ? -1 : 0), y0 - 1, "o"); put(x0 + 12 + (o.twitch === 2 ? 1 : 0), y0 - 1, "o");
      if (o.twitch === 1) { put(x0 + 1, y0, "d"); } if (o.twitch === 2) { put(x0 + 13, y0, "d"); }
    }
    // yeux (3 × 2), aux colonnes 2-4 et 10-12, rangées 6 et 7
    const st = o.eyes || "open", lk = cl(Math.round(o.look || 0), -1, 1), lky = o.lookUp ? 0 : 0;
    for (const ex of [x0 + 2, x0 + 10]) {
      const ey = y0 + 6;
      if (st === "closed") { for (let i = 0; i < 3; i++) { put(ex + i, ey, "O"); put(ex + i, ey + 1, "x"); } }
      else if (st === "happy") { put(ex, ey + 1, "x"); put(ex + 1, ey, "x"); put(ex + 2, ey + 1, "x"); put(ex, ey, "O"); put(ex + 2, ey, "O"); put(ex + 1, ey + 1, "O"); }
      else if (st === "half") { for (let i = 0; i < 3; i++) { put(ex + i, ey, "x"); put(ex + i, ey + 1, i === 1 + lk ? "k" : "e"); } }
      else {
        const wide = st === "wide", pc = 1 + lk;
        for (let i = 0; i < 3; i++) { const pup = i === pc || (wide && i === pc + (pc === 2 ? -1 : 1)); put(ex + i, ey, pup ? "k" : "e"); put(ex + i, ey + 1, pup ? "k" : "E"); }
        if (wide) put(ex + (pc === 2 ? 1 : pc), ey, "h");
      }
    }
    if (o.mouth === "open") { put(x0 + 7, y0 + 10, "n"); put(x0 + 6, y0 + 10, "k"); put(x0 + 8, y0 + 10, "k"); put(x0 + 7, y0 + 11, "n"); put(x0 + 6, y0 + 11, "k"); put(x0 + 8, y0 + 11, "k"); }
    if (o.mouth === "chatter") { put(x0 + 7, y0 + 10, "k"); put(x0 + 6, y0 + 10, "w"); put(x0 + 8, y0 + 10, "w"); }
    if (o.tongue) { put(x0 + 7, y0 + 10, "p"); put(x0 + 7, y0 + 11, "p"); }
  }
  function whiskers(cx, cy) { const x0 = Math.round(cx) - 7, y0 = Math.round(cy) - 6; for (const [a, b] of [[-2, 9], [-3, 11]]) { if (!at(x0 + a, y0 + b)) put(x0 + a, y0 + b, "w"); if (!at(x0 + 14 - a, y0 + b)) put(x0 + 14 - a, y0 + b, "w"); } }

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
    for (const fx of [X + 9, X + 13]) for (let i = 0; i < 3; i++) { put(fx + i, Y, i === 2 ? "W" : "w"); put(fx + i, Y - 1, "w"); }
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
  T.POSES = Object.keys(POSE);

  // ---------------------------------------------------------------- rendu d'une pose dans le tampon de la scène
  // B : tampon de matière (CR.lum.Buf) ; (x, y) : appui au sol ; dir : 1 droite, -1 gauche
  T.render = function (B, x, y, dir, pose, p, t, z) {
    spr.fill(0);
    (POSE[pose] || POSE.stand)(p || {}, t || 0);
    // contour : brun sombre, plus léger au-dessus
    far.set(spr);
    for (let j = 1; j < SH - 1; j++) for (let i = 1; i < SW - 1; i++) { if (far[j * SW + i]) continue; const below = far[(j - 1) * SW + i], side = far[j * SW + i - 1] || far[j * SW + i + 1], above = far[(j + 1) * SW + i]; if (below || side) spr[j * SW + i] = IDX.x; else if (above) spr[j * SW + i] = IDX.D; }
    B.mat(z == null ? 40 : z, 255, 0);
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) { const k = spr[j * SW + i]; if (!k) continue; B.px(x + (dir >= 0 ? i - OX : OX - i), y + j - OY, RGB[k]); }
    // les yeux accrochent la lumière
    if (!p || !p.head || !p.head.eyes || p.head.eyes === "open" || p.head.eyes === "wide") { B.mat(z == null ? 40 : z, 255, 70); for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) { const k = spr[j * SW + i]; if (k === IDX.e || k === IDX.h) B.px(x + (dir >= 0 ? i - OX : OX - i), y + j - OY, RGB[k]); } B.mat(z == null ? 40 : z, 255, 0); }
  };

  // ---------------------------------------------------------------- comportement
  // monde : { x0, x1, sol, chaise: {x, y}, appui: {x0, x1, y}, plante: {x} }
  T.create = function (w) { return { x: w.chaise ? w.chaise.x + 3 : (w.x0 + w.x1) / 2, y: w.chaise ? w.chaise.y : w.sol, dir: -1, st: "dodo", until: 6 + Math.random() * 6, phase: 0, on: w.chaise ? "chaise" : "sol", pet: 0, purr: 0, fx: [], prises: 0, t: 0, jump: null, look: 0, blink: 0, twitch: 0, next: [] }; };
  const say = (c, txt, x, y) => c.fx.push({ k: "mot", txt, x, y, t: 0 });
  function goto(c, st, dur) { c.st = st; c.until = c.t + dur; }
  function jumpTo(c, x, y, on, then) { c.jump = { x0: c.x, y0: c.y, x1: x, y1: y, t: 0, d: 0.55 + Math.abs(y - c.y) / 160 + Math.abs(x - c.x) / 400, on, then }; c.dir = x >= c.x ? 1 : -1; c.st = "saut"; c.prep = 0.28; }
  T.update = function (c, dt, w, inp) {
    c.t += dt; const t = c.t, m = inp.mouse, near = m ? Math.hypot(m.x - c.x, m.y - (c.y - 12)) : 999;
    c.blink = (t % 4.3) < 0.14 || ((t + 1.7) % 7.1) < 0.12; c.twitch = (t % 5.7) < 0.18 ? 1 : ((t + 2) % 8.3) < 0.16 ? 2 : 0;
    if (m) c.look = cl(Math.round((m.x - c.x) * c.dir / 40), -1, 1);
    for (const f of c.fx) f.t += dt; c.fx = c.fx.filter((f) => f.t < (f.k === "mot" ? 1.6 : 1.4));
    // caresses : la souris qui bouge sur lui
    const over = m && near < 15 && c.st !== "saut" && c.st !== "bond";
    if (over && inp.moved) { c.pet += dt * 2.2; if (Math.random() < dt * 3) c.fx.push({ k: "coeur", x: c.x + (Math.random() - 0.5) * 12, y: c.y - 26, t: 0 }); } else c.pet = Math.max(0, c.pet - dt * 0.5);
    if (inp.click && near < 16 && c.st !== "saut") { say(c, ["MIAOU", "MRRP", "MIAOU ?", "PRRT"][Math.floor(Math.random() * 4)], c.x, c.y - 34); c.miaou = t + 0.5; if (c.st === "dodo") goto(c, c.on === "sol" ? "assis" : "miche", 4); inp.used = true; }
    if (c.pet > 2.6 && c.on === "sol" && c.st !== "dos" && c.st !== "saut" && c.st !== "bond") goto(c, "dos", 5);
    // saut en cours
    if (c.st === "saut") { const j = c.jump; if (c.prep > 0) { c.prep -= dt; return; } j.t += dt / j.d; const u = Math.min(1, j.t), h = Math.max(18, (j.y0 - j.y1) * 0.35 + 22); c.x = lerp(j.x0, j.x1, u); c.y = lerp(j.y0, j.y1, u) - Math.sin(u * Math.PI) * h; c.pitch = Math.cos(u * Math.PI) * (j.y1 < j.y0 ? 0.9 : 0.6) + (j.y1 > j.y0 ? -0.4 * u : 0); if (u >= 1) { c.x = j.x1; c.y = j.y1; c.on = j.on; c.jump = null; goto(c, j.then || "assis", 3 + Math.random() * 3); } return; }
    // la chasse : point lumineux ou boulette
    const prey = inp.laser && m && m.y > w.sol - 30 ? { x: cl(m.x, w.x0, w.x1), y: w.sol + 12 } : inp.ball && inp.ball.rest && inp.ball.y > w.sol - 4 ? { x: inp.ball.x, y: inp.ball.y, ball: true } : null;
    if (prey && c.on !== "sol" && c.st !== "saut") { jumpTo(c, cl(c.x + (prey.x < c.x ? -26 : 26), w.x0, w.x1), w.sol + 12, "sol", "guet"); return; }
    if (prey && c.on === "sol") {
      const dx = prey.x - c.x, ad = Math.abs(dx);
      if (c.st === "bond") { const j = c.bond; j.t += dt / 0.36; const u = Math.min(1, j.t); c.x = lerp(j.x0, j.x1, u); c.y = w.sol + 12 - Math.sin(u * Math.PI) * 11; c.pitch = Math.cos(u * Math.PI) * 0.6; if (u >= 1) { c.y = w.sol + 12; if (Math.abs(prey.x - c.x) < 12) { c.prises++; inp.caught = prey.ball ? "ball" : "laser"; say(c, prey.ball ? "TOC" : "ATTRAPE", c.x, c.y - 30); } goto(c, "guet", 0.5); c.cool = t + 0.5; } return; }
      c.dir = dx >= 0 ? 1 : -1;
      if (ad > 44) { c.st = "course"; c.x += c.dir * 62 * dt; c.phase += dt * 3.2; }
      else if (ad > 9 && t > (c.cool || 0)) { if (c.st !== "affut") { c.st = "affut"; c.aff = t + 0.55 + Math.random() * 0.5; } else if (t > c.aff) { c.st = "bond"; c.bond = { x0: c.x, x1: cl(prey.x + c.dir * 2, w.x0, w.x1), t: 0 }; } }
      else c.st = "guet";
      return;
    }
    if (c.st === "course" || c.st === "affut" || c.st === "bond" || c.st === "guet") goto(c, "assis", 2.5);
    // le quotidien
    if (c.st === "marche") { const dx = c.tx - c.x; c.dir = dx >= 0 ? 1 : -1; c.x += c.dir * 21 * dt; c.phase += dt * 1.55; if (Math.abs(dx) < 2) { c.x = c.tx; const n = c.next.shift(); if (n) n(); else goto(c, Math.random() < 0.5 ? "assis" : "debout", 2 + Math.random() * 3); } return; }
    if (t < c.until) return;
    const R = Math.random();
    if (c.on === "chaise") { if (c.st === "dodo" && R < 0.5) goto(c, "miche", 3 + Math.random() * 4); else if (R < 0.4) goto(c, "dodo", 9 + Math.random() * 10); else jumpTo(c, w.chaise.x - 26, w.sol + 12, "sol", "etire"); return; }
    if (c.on === "appui") { if (R < 0.55) goto(c, "guetteur", 5 + Math.random() * 6); else jumpTo(c, cl(c.x - 30, w.x0, w.x1), w.sol + 12, "sol", "assis"); return; }
    const walk = (x, then) => { c.tx = cl(x, w.x0, w.x1); c.st = "marche"; c.next = then ? [then] : []; };
    if (c.st === "etire" || c.st === "dos") { goto(c, "assis", 2 + Math.random() * 2); return; }
    if (R < 0.26) walk(w.x0 + Math.random() * (w.x1 - w.x0));
    else if (R < 0.42) goto(c, "toilette", 3.5 + Math.random() * 2);
    else if (R < 0.56 && w.chaise) walk(w.chaise.x - 26, () => jumpTo(c, w.chaise.x + 3, w.chaise.y, "chaise", "miche"));
    else if (R < 0.72 && w.appui) walk((w.appui.x0 + w.appui.x1) / 2 - 20, () => jumpTo(c, (w.appui.x0 + w.appui.x1) / 2 + (Math.random() - 0.5) * 30, w.appui.y, "appui", "guetteur"));
    else if (R < 0.82 && w.plante) walk(w.plante.x - 11, () => { c.dir = 1; goto(c, "renifle", 4); });
    else if (R < 0.9) goto(c, "etire", 1.8);
    else goto(c, "assis", 3 + Math.random() * 3);
  };
  T.draw = function (B, c, z) {
    const t = c.t, miaou = t < (c.miaou || 0), eyes = c.pet > 0.8 ? "happy" : c.blink ? "closed" : "open";
    const H = (o) => Object.assign({ eyes, look: c.look, twitch: c.twitch, mouth: miaou ? "open" : null }, o || {});
    let pose = "stand", p = { head: H() };
    switch (c.st) {
      case "marche": pose = "walk"; p = { phase: c.phase, head: H() }; break;
      case "course": pose = "walk"; p = { phase: c.phase, run: 1, tailUp: 0.1, head: H({ eyes: "wide", look: 1 }) }; break;
      case "affut": pose = "crouch"; p = { wiggle: 1, head: H({ eyes: "wide", look: 1 }) }; break;
      case "guet": pose = "crouch"; p = { head: H({ eyes: "wide", look: 1 }) }; break;
      case "bond": case "saut": pose = c.st === "saut" && c.prep > 0 ? "crouch" : "leap"; p = { pitch: c.pitch || 0, wiggle: c.st === "saut", head: H({ eyes: "wide", look: 1, ears: c.st === "bond" ? "back" : "up" }) }; break;
      case "assis": pose = "sit"; p = { head: H() }; break;
      case "guetteur": pose = "sit"; p = { tailTwitch: 1, head: H({ mouth: (t % 6) < 1.2 && Math.floor(t * 12) % 2 ? "chatter" : null, eyes: c.blink ? "closed" : "open" }) }; break;
      case "toilette": { const k = Math.sin(t * 5); pose = "sit"; p = { paw: 1 + (k > 0 ? 1 : 0), headDown: 2 + (k > 0 ? 1 : 0), headX: 1, head: H({ eyes: "closed", tongue: k > 0 }) }; break; }
      case "miche": pose = "loaf"; p = { hang: c.on === "chaise", head: H({ eyes: c.pet > 0.8 ? "happy" : c.blink ? "closed" : "half" }) }; break;
      case "dodo": pose = "loaf"; p = { hang: c.on === "chaise", asleep: 1, head: H({ eyes: "closed", twitch: 0 }) }; break;
      case "dos": pose = "back"; p = { head: H({ eyes: "happy" }) }; break;
      case "renifle": pose = "rear"; p = { head: H({ eyes: (t % 2) < 1 ? "half" : "open", look: 1 }) }; break;
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
    if (c.st === "dodo") { const k = Math.floor(t * 0.8) % 3; B.txt("Z", c.x + c.dir * 16 + k * 3, c.y - 22 - k * 4, "#cfe0ff"); }
    B.mat(z == null ? 40 : z, 255, 0);
  };
})();
