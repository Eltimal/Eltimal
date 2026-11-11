/* La Permanence — écran titre : un nocturne parisien en pixel art animé.
   Vue depuis le quai de la Mégisserie, une nuit de pluie : la Conciergerie et ses tours rondes, la tour de l'Horloge
   (son cadran donne l'heure réelle), la flèche de la Sainte-Chapelle, le Pont au Change et le Pont Neuf, le saule du
   Vert-Galant ; au loin le Panthéon, Notre-Dame et la tour Montparnasse. La Seine reflète tout, une péniche passe,
   une voiture de police longe le quai de l'Horloge. Au premier plan : les boîtes des bouquinistes, un chat, un réverbère,
   et un avocat qui rentre sous son parapluie. Résolution basse, mise à l'échelle par un facteur entier. */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html } = UI;
  const { useEffect, useRef } = React;

  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function P(ctx) {
    return {
      ctx,
      r(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
      p(x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); },
      line(x0, y0, x1, y1, c) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); ctx.fillStyle = c; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0); const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy; for (let i = 0; i < 600; i++) { ctx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } } },
      disc(cx, cy, rad, c) { ctx.fillStyle = c; for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad + rad * 0.5) ctx.fillRect(cx + x, cy + y, 1, 1); },
      dith(x, y, w, h, c, lvl) { ctx.fillStyle = c; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (BAYER[(y + j) & 3][(x + i) & 3] < lvl) ctx.fillRect(x + i, y + j, 1, 1); },
    };
  }

  // =================================================================== Construction de la scène (couches fixes)
  function build(W, H, cx) {
    const rnd = CR.seeded("titre-nocturne");
    const L = { W, H, cx, windows: [], lights: [], stars: [], clouds: [], drops: [], splashes: [] };
    const gy = (L.gy = H - 34);          // haut du parapet, quai de la Mégisserie
    const wy = (L.wy = gy - 44);         // la Seine
    const qy = (L.qy = wy - 7);          // le quai de l'Horloge, pied des bâtiments
    L.moon = { x: W - Math.max(40, Math.round(W * 0.14)), y: H > W ? 30 : Math.max(26, Math.round(qy - 150)), r: 9 };

    // ---------------------------------------------------- ciel (dégradé tramé, au pixel)
    const sky = mk(W, H), sctx = sky.getContext("2d");
    const STOPS = [[0, "#05081a"], [0.3, "#0a0f2e"], [0.56, "#151840"], [0.76, "#251f4c"], [0.89, "#40284c"], [0.96, "#5e3346"], [1, "#7a4140"]];
    const img = sctx.createImageData(W, H);
    const top = Math.min(0, qy - 330);
    for (let y = 0; y < wy + 2; y++) {
      const f = Math.max(0, Math.min(1, (y - top) / (qy + 6 - top)));
      let k = 0; while (k < STOPS.length - 2 && f > STOPS[k + 1][0]) k++;
      const [f0, c0] = STOPS[k], [f1, c1] = STOPS[k + 1];
      const tt = (f - f0) / (f1 - f0);
      const A = hex(c0), B = hex(c1);
      for (let x = 0; x < W; x++) {
        const c = tt * 16 > BAYER[y & 3][x & 3] + 0.5 ? B : A;
        const i = (y * W + x) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
      }
    }
    sctx.putImageData(img, 0, 0);
    const sp = P(sctx);
    // halo de la lune, puis la lune gibbeuse
    const M = L.moon;
    for (const [rad, lvl] of [[30, 2], [23, 3], [17, 5]]) for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad && BAYER[(M.y + y) & 3][(M.x + x) & 3] < lvl) sp.p(M.x + x, M.y + y, "#2a2d5e");
    for (let y = -M.r; y <= M.r; y++) for (let x = -M.r; x <= M.r; x++) {
      if (x * x + y * y > M.r * M.r + 4) continue;
      const sh = (x + 6) * (x + 6) + (y + 1) * (y + 1) <= M.r * M.r - 6;
      const edge = x * x + y * y > (M.r - 1) * (M.r - 1);
      sp.p(M.x + x, M.y + y, sh ? (edge ? "#2c3064" : "#232756") : edge ? "#e9dfbd" : "#f6efd6");
    }
    for (const [x, y] of [[2, -3], [4, 1], [1, 4], [5, -1], [3, 3]]) sp.p(M.x + x, M.y + y, "#d9cfac");
    L.sky = sky;

    // étoiles (dessinées à chaque image)
    for (let i = 0; i < Math.round(W * 0.2); i++) {
      const x = Math.floor(rnd() * W), y = Math.floor(rnd() * Math.max(10, qy - 92));
      if (Math.abs(x - M.x) < 34 && Math.abs(y - M.y) < 30) continue;
      const k = rnd();
      L.stars.push({ x, y, c: k < 0.6 ? "#5c6496" : k < 0.9 ? "#aeb6e4" : "#fff4d6", big: k >= 0.93, f: 0.6 + rnd() * 2.4, ph: rnd() * 7 });
    }
    // nuages : bandes basses éclairées par la lune
    for (let i = 0; i < 5; i++) {
      const w = 70 + Math.floor(rnd() * 120), h = 9 + Math.floor(rnd() * 8), c = mk(w, h), p = P(c.getContext("2d"));
      const prof = []; for (let x = 0; x < w; x++) { const e = Math.min(x, w - 1 - x) / (w / 2); prof.push(Math.round(h * (0.25 + 0.75 * (1 - Math.pow(1 - e, 2))) * (0.75 + 0.25 * Math.sin(x * 0.21 + i) * Math.sin(x * 0.07 + i * 2)))); }
      for (let x = 0; x < w; x++) { const hh = Math.max(1, Math.min(h, prof[x])); for (let y = h - hh; y < h; y++) { const fromTop = y - (h - hh); const lvl = fromTop === 0 ? 16 : y > h - 3 ? 8 : 16; if (BAYER[y & 3][x & 3] < lvl) p.p(x, y, fromTop === 0 ? "#3a3f73" : fromTop === 1 ? "#272b55" : "#191c3e"); } }
      L.clouds.push({ c, x0: rnd() * (W + 200), y: 8 + Math.floor(rnd() * Math.max(20, qy - 120)), v: 1.2 + rnd() * 3.5 });
    }

    // ---------------------------------------------------- lointain : rive gauche, Panthéon, Notre-Dame, Montparnasse
    const far = mk(W, H), fp = P(far.getContext("2d"));
    let x = 0;
    while (x < W) {
      const w = 7 + Math.floor(rnd() * 16), h = 8 + Math.floor(rnd() * 26);
      fp.r(x, qy - h, w, h + 8, "#111430");
      fp.r(x + 2, qy - h - 3, w - 4, 3, "#0e1129");
      fp.r(x + w - 1, qy - h, 1, h, "#191d42");
      if (rnd() < 0.7) fp.r(x + 3 + Math.floor(rnd() * Math.max(1, w - 6)), qy - h - 5, 1, 2, "#0e1129");
      for (let k = 0; k < 3; k++) if (rnd() < 0.5) fp.p(x + 1 + Math.floor(rnd() * (w - 2)), qy - h + 3 + Math.floor(rnd() * Math.max(1, h - 5)), "#6b5532");
      x += w + (rnd() < 0.3 ? 2 : 0);
    }
    { // Panthéon
      const px = cx - 178, b = qy;
      fp.r(px - 16, b - 24, 32, 24, "#15193a"); fp.r(px - 10, b - 34, 20, 10, "#181c40");
      for (let k = px - 9; k < px + 10; k += 2) fp.r(k, b - 33, 1, 8, "#101333");
      for (let y = 0; y <= 10; y++) { const half = Math.round(Math.sqrt(100 - y * y)); fp.r(px - half, b - 34 - y, half * 2, 1, "#1b2047"); fp.p(px + half - 1, b - 34 - y, "#2e3567"); }
      fp.r(px - 2, b - 49, 4, 5, "#1b2047"); fp.r(px, b - 53, 1, 4, "#2e3567");
    }
    { // Notre-Dame : deux tours carrées et la flèche
      const nx = cx - 128, b = qy;
      fp.r(nx - 15, b - 22, 30, 22, "#161a3c"); fp.r(nx - 15, b - 34, 10, 12, "#191d42"); fp.r(nx + 5, b - 34, 10, 12, "#191d42");
      for (const tx of [nx - 13, nx + 7]) { fp.r(tx, b - 31, 2, 6, "#0c0f27"); fp.r(tx + 4, b - 31, 2, 6, "#0c0f27"); }
      fp.p(nx + 14, b - 34, "#2e3567"); fp.r(nx + 28, b - 20, 18, 20, "#14183a");
      fp.line(nx + 37, b - 20, nx + 37, b - 46, "#1b2047"); fp.r(nx + 36, b - 26, 3, 6, "#1b2047");
    }
    { // tour Montparnasse
      const mx = cx + 182, b = qy, h = 96;
      fp.r(mx, b - h, 16, h, "#0d1027"); fp.r(mx + 15, b - h, 1, h, "#1d2246");
      for (let y = b - h + 3; y < b - 30; y += 2) for (let k = mx + 1; k < mx + 15; k += 2) if (rnd() < 0.09) fp.p(k, y, "#5a4a30"); else if (rnd() < 0.3) fp.p(k, y, "#141838");
      L.aviation = [[mx, b - h - 1], [mx + 15, b - h - 1]];
    }
    L.far = far;

    // ---------------------------------------------------- l'île de la Cité
    const mid = mk(W, H), mp = P(mid.getContext("2d"));
    const stone = "#2b3047", stoneLit = "#363d5a", stoneDk = "#20243a", slate = "#161a2a", slateRim = "#2c3456", winOff = "#0e111e";
    const hx = cx - 94, fx0 = hx + 14, fx1 = cx + 140;
    // la Sainte-Chapelle, derrière
    { const sx = cx - 48;
      mp.r(sx - 22, qy - 64, 44, 24, "#191d30");
      for (let y = 0; y < 12; y++) mp.r(sx - 22 + y, qy - 64 - y, 44 - y * 2, 1, "#151929");
      mp.r(sx + 21, qy - 64, 1, 24, "#2a3150");
      for (let y = 0; y < 64; y++) { const w = Math.max(1, Math.round(7 - y / 10)); mp.r(sx - Math.floor(w / 2), qy - 76 - y, w, 1, y % 4 === 0 ? "#22273f" : "#1a1e33"); if (w > 1) mp.p(sx + Math.ceil(w / 2) - 1, qy - 76 - y, "#3a4370"); if (y % 6 === 3 && w > 2) { mp.p(sx - Math.floor(w / 2) - 1, qy - 76 - y, "#1a1e33"); mp.p(sx + Math.ceil(w / 2), qy - 76 - y, "#3a4370"); } }
      mp.r(sx, qy - 143, 1, 4, "#c9a54e"); mp.r(sx - 1, qy - 142, 3, 1, "#c9a54e");
      L.chapelle = sx;
    }
    // le Palais, toitures arrière
    mp.r(cx + 60, qy - 62, 96, 24, "#191d30"); for (let y = 0; y < 6; y++) mp.r(cx + 60 + y, qy - 62 - y, 96 - y * 2, 1, "#161a2b");
    for (const k of [cx + 72, cx + 96, cx + 128]) { mp.r(k, qy - 74, 3, 8, "#191d30"); mp.p(k + 2, qy - 74, "#2c3456"); }
    // façade de la Conciergerie
    mp.r(fx0, qy - 40, fx1 - fx0, 40, stone);
    mp.dith(fx0, qy - 40, fx1 - fx0, 16, stoneLit, 6);
    mp.r(fx0, qy - 40, fx1 - fx0, 1, "#40476a");
    for (let k = fx0 + 3; k < fx1 - 3; k += 9) {
      for (const wyy of [qy - 34, qy - 24]) { mp.r(k, wyy, 3, 5, winOff); mp.p(k + 1, wyy - 1, winOff); L.windows.push({ x: k, y: wyy, w: 3, h: 5, f: 0.01 + rnd() * 0.05, ph: rnd() * 9, th: rnd() < 0.18 ? -2 : 0.35 + rnd() * 0.5 }); }
      mp.r(k - 1, qy - 13, 5, 13, "#141726"); mp.p(k - 1, qy - 13, stone); mp.p(k + 3, qy - 13, stone);
      if (rnd() < 0.3) L.windows.push({ x: k, y: qy - 9, w: 3, h: 6, f: 0.02 + rnd() * 0.03, ph: rnd() * 9, th: 0.4, c: "#d8a24a" });
    }
    L.ronde = L.windows.filter((w) => w.y === qy - 24 && w.x > cx - 2 && w.x < cx + 50).sort((u, v) => u.x - v.x);
    // toiture d'ardoise et lucarnes
    for (let y = 0; y < 12; y++) mp.r(fx0 + 2 + y * 0.6, qy - 41 - y, fx1 - fx0 - 4 - y * 1.2, 1, y === 11 ? slateRim : slate);
    for (let k = fx0 + 8; k < fx1 - 10; k += 14) { mp.r(k, qy - 47, 5, 6, "#1d2236"); mp.p(k + 2, qy - 48, "#1d2236"); mp.r(k + 1, qy - 45, 3, 3, winOff); L.windows.push({ x: k + 1, y: qy - 45, w: 3, h: 3, f: 0.02 + rnd() * 0.05, ph: rnd() * 9, th: 0.55 + rnd() * 0.3 }); }
    for (const k of [fx0 + 30, fx0 + 104, fx0 + 160]) { mp.r(k, qy - 58, 3, 7, "#1a1e30"); mp.p(k + 2, qy - 58, slateRim); }
    // les tours rondes : César, d'Argent, Bonbec
    const tower = (tx, hgt, cone) => {
      for (let i = 0; i < 14; i++) mp.r(tx + i, qy - hgt, 1, hgt, i < 3 ? stoneDk : i > 10 ? "#3f4768" : i > 7 ? stoneLit : stone);
      mp.r(tx - 1, qy - hgt, 16, 2, "#2f3550");
      for (let i = 0; i < 16; i += 2) mp.p(tx - 1 + i, qy - hgt - 1, "#2f3550");
      for (let y = 0; y < cone; y++) { const half = Math.max(0, Math.round(8 - (y * 8) / cone)); mp.r(tx + 7 - half, qy - hgt - 2 - y, half * 2, 1, "#141829"); if (half > 0) mp.p(tx + 6 + half, qy - hgt - 2 - y, slateRim); }
      mp.r(tx + 7, qy - hgt - cone - 5, 1, 4, "#3a4370");
      for (const wyy of [qy - hgt + 10, qy - hgt + 22]) { mp.r(tx + 6, wyy, 2, 4, winOff); L.windows.push({ x: tx + 6, y: wyy, w: 2, h: 4, f: 0.015 + rnd() * 0.04, ph: rnd() * 9, th: 0.3 + rnd() * 0.5 }); }
    };
    tower(cx - 36, 58, 22); tower(cx - 18, 60, 23); tower(cx + 56, 52, 19);
    // la tour de l'Horloge et son cadran
    mp.r(hx, qy - 70, 18, 70, stone); for (let i = 12; i < 18; i++) mp.r(hx + i, qy - 70, 1, 70, i > 15 ? "#3f4768" : stoneLit);
    mp.r(hx, qy - 70, 1, 70, stoneDk); mp.r(hx - 1, qy - 72, 20, 2, "#323955");
    for (let y = 0; y < 13; y++) { const half = Math.max(0, Math.round(10 - y * 0.8)); mp.r(hx + 9 - half, qy - 72 - y, half * 2, 1, "#151929"); if (half) mp.p(hx + 8 + half, qy - 72 - y, slateRim); }
    mp.r(hx + 8, qy - 89, 2, 5, "#151929"); mp.p(hx + 9, qy - 92, "#c9a54e");
    for (const wyy of [qy - 64, qy - 20, qy - 10]) { mp.r(hx + 7, wyy, 4, 5, winOff); L.windows.push({ x: hx + 7, y: wyy, w: 4, h: 5, f: 0.02, ph: rnd() * 9, th: 0.2 }); }
    L.clock = { x: hx + 9, y: qy - 44, r: 6 };
    mp.r(hx + 2, qy - 52, 15, 16, "#2a2f45"); mp.r(hx + 1, qy - 53, 17, 1, "#c9a54e"); mp.r(hx + 1, qy - 36, 17, 1, "#c9a54e");
    mp.disc(L.clock.x, L.clock.y, 6, "#c9a54e"); mp.disc(L.clock.x, L.clock.y, 5, "#1f3b78");
    for (let h = 0; h < 12; h++) { const a = (h / 12) * Math.PI * 2; mp.p(L.clock.x + Math.round(Math.sin(a) * 4), L.clock.y - Math.round(Math.cos(a) * 4), "#e8c56a"); }
    // le quai de l'Horloge, mur et réverbères
    mp.r(0, qy, W, wy - qy, "#232739"); mp.r(0, qy, W, 1, "#3a4060");
    for (let k = 0; k < W; k += 7) mp.p(k, qy + 3 + (k % 2), "#1a1d2c");
    for (let k = fx0 + 6; k < fx1; k += 26) { mp.r(k, qy - 7, 1, 7, "#14172a"); mp.r(k - 1, qy - 9, 3, 2, "#f2c46a"); L.lights.push({ x: k, c: "#f2c46a", len: 22, a: 0.55 }); }
    // le Pont au Change (à gauche)
    { const x1 = hx + 1, dy = wy - 6;
      if (x1 > 0) {
        mp.r(0, dy, x1, 3, "#2f3450"); mp.r(0, dy, x1, 1, "#4a5276"); mp.r(0, dy + 3, x1, 7, "#262a40");
        for (let k = x1 - 30; k > -30; k -= 32) { for (let y = 0; y < 9; y++) { const half = Math.round(13 * Math.sqrt(1 - Math.pow((9 - y) / 9, 2))); mp.r(k - half, dy + 4 + y, half * 2, 1, "#060914"); } }
        for (let k = x1 - 10; k > 0; k -= 22) { mp.r(k, dy - 6, 1, 6, "#151829"); mp.r(k - 1, dy - 8, 3, 2, "#f6d27a"); L.lights.push({ x: k, c: "#f6d27a", len: 30, a: 0.7 }); }
      }
    }
    // le Pont Neuf et le saule du Vert-Galant (à droite)
    { const x0 = cx + 152, dy = wy - 8;
      if (x0 < W) {
        mp.r(x0 - 18, qy - 2, 22, wy - qy + 2, "#1e2234");
        for (let k = 0; k < 26; k++) { const tx = x0 - 8 + Math.round(Math.sin(k * 1.7) * 9), len = 6 + Math.floor(rnd() * 10); mp.r(tx, qy - 18 + Math.floor(rnd() * 6), 1, len, k % 3 ? "#13261f" : "#1d3a2e"); }
        for (let y = 0; y < 12; y++) { const half = Math.round(11 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 7) / 7.5, 2)))); if (!half) continue; mp.r(x0 - 9 - half, qy - 28 + y, half * 2, 1, y < 3 ? "#24463a" : "#173028"); mp.p(x0 - 10 + half, qy - 28 + y, "#2f5a4a"); }
        for (let k = -10; k <= 10; k += 2) mp.r(x0 - 9 + k, qy - 17, 1, 4 + ((k + 10) % 5), "#173028");
        mp.r(x0 - 9, qy - 10, 2, 10, "#151715");
        mp.r(x0, dy, W - x0, 3, "#30354f"); mp.r(x0, dy, W - x0, 1, "#4d567c"); mp.r(x0, dy + 3, W - x0, 11, "#272b41");
        for (let k = x0 + 22; k < W + 20; k += 30) {
          for (let y = 0; y < 11; y++) { const half = Math.round(11 * Math.sqrt(1 - Math.pow((11 - y) / 11, 2))); mp.r(k - half, dy + 4 + y, half * 2, 1, "#060914"); }
          mp.r(k + 13, dy - 3, 4, 3, "#30354f"); mp.r(k + 14, dy - 9, 1, 6, "#151829"); mp.r(k + 12, dy - 11, 2, 2, "#f6d27a"); mp.r(k + 16, dy - 11, 2, 2, "#f6d27a");
          L.lights.push({ x: k + 13, c: "#f6d27a", len: 34, a: 0.7 }, { x: k + 17, c: "#f6d27a", len: 30, a: 0.6 });
        }
      }
    }
    L.mid = mid;

    // reflet : ciel bas, lointain et île, figés
    const refl = mk(W, H), rctx = refl.getContext("2d");
    rctx.drawImage(sky, 0, 0); rctx.drawImage(far, 0, 0); rctx.drawImage(mid, 0, 0);
    L.refl = refl;
    // l'eau
    const water = mk(W, H), wp = P(water.getContext("2d"));
    for (let y = wy; y < gy; y++) { const f = (y - wy) / (gy - wy); wp.r(0, y, W, 1, f < 0.35 ? "#0b1328" : f < 0.7 ? "#081022" : "#060b19"); }
    for (let y = wy + 2; y < gy; y += 3) wp.dith(0, y, W, 1, "#121c38", 3);
    L.water = water;
    L.lights.push({ x: M.x, moon: true, len: gy - wy, a: 0.45 });

    // ---------------------------------------------------- premier plan : parapet, bouquinistes, pavés, réverbère
    const fg = mk(W, H), gp = P(fg.getContext("2d"));
    const lampX = (L.lampX = Math.min(W - 26, Math.round(W >= 360 ? cx + 86 : W * 0.8)));
    gp.r(0, gy, W, 7, "#30313d"); gp.r(0, gy, W, 2, "#474857"); gp.r(0, gy + 7, W, 1, "#121219");
    for (let k = 0; k < W; k += 13) gp.r(k, gy + 2, 1, 5, "#232430");
    for (let k = 0; k < W; k += 1) if (Math.abs(k - lampX) < 46) { const f = 1 - Math.abs(k - lampX) / 46; if (BAYER[gy & 3][k & 3] < f * 14) { gp.p(k, gy, "#a08460"); gp.p(k, gy + 1, "#6e5b45"); } }
    // pavés mouillés
    gp.r(0, gy + 8, W, H - gy - 8, "#14151c");
    for (let y = gy + 9; y < H; y += 3) { const off = ((y / 3) | 0) % 2 ? 2 : 0; for (let k = off; k < W; k += 5) { gp.r(k, y, 3, 1, "#1d1f28"); if (Math.abs(k - lampX) < 34 && rnd() < 0.7) gp.p(k + 1, y, Math.abs(k - lampX) < 14 ? "#5a4b38" : "#33302f"); } }
    // flaques : elles reflètent le ciel, et l'or du réverbère près de lui
    L.puddles = [];
    for (let i = 0; i < Math.max(3, Math.round(W / 70)); i++) {
      const pw = 10 + Math.floor(rnd() * 22), px0 = Math.floor(rnd() * (W - pw)), py0 = gy + 12 + Math.floor(rnd() * Math.max(1, H - gy - 18));
      const warm = Math.abs(px0 + pw / 2 - lampX) < 40;
      for (let y = 0; y < 3; y++) { const inset = y === 1 ? 0 : 2; gp.r(px0 + inset, py0 + y, pw - inset * 2, 1, warm ? (y === 1 ? "#4a3d30" : "#3a3229") : y === 1 ? "#232845" : "#1c2037"); }
      if (warm) gp.r(px0 + Math.floor(pw / 2), py0 + 1, 2, 1, "#c9a26a");
      L.puddles.push({ x: px0, y: py0, w: pw });
    }
    // les boîtes vertes des bouquinistes
    L.boxes = [];
    let bx = 6;
    while (bx < W - 20) {
      if (Math.abs(bx + 10 - lampX) < 22) { bx += 30; continue; }
      const n = 2 + Math.floor(rnd() * 2);
      for (let i = 0; i < n && bx < W - 20; i++) {
        gp.r(bx, gy - 8, 20, 8, "#1c4433"); gp.r(bx, gy - 8, 20, 1, "#2f6a50"); gp.r(bx, gy - 1, 20, 1, "#10281e"); gp.r(bx + 19, gy - 8, 1, 8, "#143425");
        gp.p(bx + 9, gy - 4, "#c9a94a"); gp.p(bx + 10, gy - 4, "#8a7231");
        if (Math.abs(bx + 10 - lampX) < 50) gp.r(bx, gy - 8, 20, 1, "#4f8a68");
        L.boxes.push(bx); bx += 21;
      }
      bx += 14 + Math.floor(rnd() * 22);
    }
    L.cat = L.boxes.length > 3 ? { x: L.boxes[L.boxes.length > 6 ? 5 : 2] + 12, y: gy - 9 } : null;
    // le réverbère
    const lt = (L.lampTop = gy - 52);
    gp.r(lampX - 3, H - 8, 7, 4, "#0d0e13"); gp.r(lampX - 2, H - 12, 5, 4, "#121319");
    gp.r(lampX - 1, lt + 10, 3, H - 12 - lt - 10, "#121319"); gp.r(lampX + 1, lt + 10, 1, H - 22 - lt, "#2e2a2a");
    for (const yy of [lt + 18, lt + 34, H - 30]) gp.r(lampX - 2, yy, 5, 2, "#17181f");
    gp.r(lampX - 4, lt - 1, 9, 2, "#101116"); gp.r(lampX - 3, lt + 1, 7, 8, "#fff0c2"); gp.r(lampX - 3, lt + 1, 1, 8, "#e9c06e"); gp.r(lampX + 3, lt + 1, 1, 8, "#e9c06e");
    gp.r(lampX - 4, lt + 9, 9, 1, "#101116"); gp.r(lampX - 2, lt - 3, 5, 2, "#101116"); gp.p(lampX, lt - 4, "#101116");
    L.fg = fg;

    // cadre : feuillage d'un platane en haut à gauche, vignette
    const frame = mk(W, H), fr = P(frame.getContext("2d"));
    // une branche de platane qui pend en haut à droite, feuilles en pixels
    { const fw = Math.round(Math.min(W * 0.3, 150)), ox = W - fw, by = (x) => Math.round(2 + Math.pow((x - ox) / fw, 2) * 10);
      for (let k = ox; k < W; k++) { fr.p(k, by(k), "#05060c"); if (k > ox + fw * 0.4) fr.p(k, by(k) + 1, "#05060c"); }
      for (let i = 0; i < 9; i++) {
        const tx = ox + Math.round(rnd() * fw), ty = by(tx), len = 6 + Math.floor(rnd() * 16);
        for (let j = 0; j < len; j++) fr.p(tx + Math.round(Math.sin(j * 0.3 + i) * 2), ty + j, "#05060c");
        for (let l = 0; l < 26; l++) { const lx = tx + Math.round((rnd() - 0.5) * 16), ly = ty + Math.round(rnd() * (len + 6)); const c = rnd() < 0.18 ? "#14211f" : rnd() < 0.5 ? "#070b10" : "#0a1012"; fr.r(lx, ly, 2, 1, c); fr.p(lx + (rnd() < 0.5 ? 0 : 1), ly + 1, c); }
      }
    }
    const vctx = frame.getContext("2d");
    const g = vctx.createRadialGradient(W * 0.55, H * 0.55, Math.min(W, H) * 0.35, W * 0.55, H * 0.55, Math.max(W, H) * 0.75);
    if (g && g.addColorStop) { g.addColorStop(0, "rgba(3,4,10,0)"); g.addColorStop(1, "rgba(3,4,10,0.55)"); vctx.fillStyle = g; vctx.fillRect(0, 0, W, H); }
    L.frame = frame;

    // pluie
    const n = Math.round((W * H) / 640);
    for (let i = 0; i < n; i++) L.drops.push(newDrop(L, rnd, true));
    L.rnd = rnd;
    return L;
  }
  function newDrop(L, rnd, anywhere) {
    const near = rnd() < 0.35;
    return { x: rnd() * (L.W + 60) - 40, y: anywhere ? rnd() * L.H : -4 - rnd() * 20, v: near ? 150 + rnd() * 60 : 90 + rnd() * 40, len: near ? 4 : 2, near, ground: rnd() < 0.5 ? L.gy + 8 + rnd() * (L.H - L.gy - 8) : L.wy + rnd() * (L.gy - L.wy) };
  }

  // =================================================================== Une image
  function frame(ctx, L, t, dt) {
    const { W, H, gy, wy, qy } = L;
    const p = P(ctx);
    ctx.globalAlpha = 1;
    ctx.drawImage(L.sky, 0, 0);
    for (const s of L.stars) { const v = Math.sin(t * s.f + s.ph); if (v < -0.2) continue; p.p(s.x, s.y, s.c); if (s.big && v > 0.85) { p.p(s.x - 1, s.y, "#7e86c0"); p.p(s.x + 1, s.y, "#7e86c0"); p.p(s.x, s.y - 1, "#7e86c0"); p.p(s.x, s.y + 1, "#7e86c0"); } }
    for (const c of L.clouds) { const x = ((c.x0 + t * c.v) % (W + c.c.width + 80)) - c.c.width - 40; ctx.drawImage(c.c, Math.round(x), c.y); }
    ctx.drawImage(L.far, 0, 0);
    if (L.aviation && Math.floor(t * 1.4) % 2 === 0) for (const [x, y] of L.aviation) { p.p(x, y, "#ff4636"); ctx.fillStyle = "rgba(255,70,54,0.25)"; ctx.fillRect(x - 1, y - 1, 3, 3); }
    ctx.drawImage(L.mid, 0, 0);
    // fenêtres allumées : la permanence ne dort jamais tout à fait
    for (const w of L.windows) { if (Math.sin(t * w.f + w.ph) > w.th) continue; p.r(w.x, w.y, w.w, w.h, w.c || "#f2c46a"); if (w.h >= 5) p.p(w.x + Math.floor(w.w / 2), w.y - 1, w.c || "#f2c46a"); }
    // la ronde de nuit : une lampe torche passe derrière les fenêtres du premier étage
    const rd = t % 27;
    if (rd < 9 && L.ronde.length) {
      const pos = L.ronde[0].x + (rd / 9) * (L.ronde[L.ronde.length - 1].x - L.ronde[0].x + 3);
      for (const w of L.ronde) if (pos >= w.x - 1 && pos <= w.x + w.w) { p.r(w.x, w.y, w.w, w.h, "#d9e4ff"); p.p(w.x + 1, w.y - 1, "#d9e4ff"); ctx.fillStyle = "rgba(217,228,255,0.25)"; ctx.fillRect(w.x - 2, w.y - 2, w.w + 4, w.h + 4); }
    }
    // le cadran : l'heure réelle
    const now = new Date();
    const hrs = (now.getHours() % 12) + now.getMinutes() / 60, mins = now.getMinutes() + now.getSeconds() / 60;
    const C = L.clock;
    p.line(C.x, C.y, C.x + Math.round(Math.sin((mins / 60) * Math.PI * 2) * 4), C.y - Math.round(Math.cos((mins / 60) * Math.PI * 2) * 4), "#f6dc8a");
    p.line(C.x, C.y, C.x + Math.round(Math.sin((hrs / 12) * Math.PI * 2) * 3), C.y - Math.round(Math.cos((hrs / 12) * Math.PI * 2) * 3), "#f6dc8a");
    p.p(C.x, C.y, "#fff3c4");
    // une voiture de police sur le quai de l'Horloge
    const pc = t % 38;
    let police = null;
    if (pc < 9) {
      const x = Math.round(W + 20 - (pc / 9) * (W + 60));
      police = x;
      p.r(x, qy - 5, 12, 3, "#d9dde6"); p.r(x + 2, qy - 7, 7, 2, "#1a2238"); p.r(x, qy - 4, 12, 1, "#2f5bd1"); p.r(x + 1, qy - 2, 2, 2, "#0c0d12"); p.r(x + 8, qy - 2, 2, 2, "#0c0d12");
      const on = Math.floor(t * 7) % 2 === 0;
      p.r(x + 4, qy - 8, 2, 1, on ? "#4d8dff" : "#16306e"); p.r(x + 6, qy - 8, 1, 1, on ? "#16306e" : "#4d8dff");
      if (on) { ctx.fillStyle = "rgba(77,141,255,0.18)"; ctx.fillRect(x - 6, qy - 14, 24, 12); }
      ctx.fillStyle = "rgba(255,244,210,0.25)"; ctx.fillRect(x - 9, qy - 4, 9, 2); p.p(x, qy - 4, "#fff4d2");
    }
    // la Seine
    ctx.drawImage(L.water, 0, wy, W, gy - wy, 0, wy, W, gy - wy);
    const depth = gy - wy;
    for (let y = wy; y < gy; y++) {
      const k = (y - wy) / depth;
      const src = wy - 1 - Math.floor((y - wy) * 1.45);
      if (src < 0) continue;
      const dx = Math.round(Math.sin(y * 0.55 + t * 2.1) * (0.5 + k * 1.8));
      ctx.globalAlpha = 0.5 - 0.32 * k;
      ctx.drawImage(L.refl, 0, src, W, 1, dx, y, W, 1);
    }
    ctx.globalAlpha = 1;
    // reflets des lumières : réverbères, ponts, lune
    for (const l of L.lights) {
      for (let y = wy + 1; y < Math.min(gy, wy + l.len); y++) {
        const k = (y - wy) / l.len;
        const xo = Math.round(Math.sin(y * 0.9 + t * 3 + l.x) * (1 + k * 2));
        if (l.moon) { if ((y + Math.floor(t * 6)) % 3 === 0) continue; const w = 2 + Math.round((Math.sin(y * 1.3 + t * 2.4) + 1) * 2.5); ctx.fillStyle = `rgba(214,220,250,${(0.32 * (1 - k * 0.7)).toFixed(3)})`; ctx.fillRect(l.x - Math.floor(w / 2) + xo, y, w, 1); continue; }
        if ((y * 7 + Math.floor(t * 9 + l.x)) % 5 > 2) continue;
        ctx.fillStyle = rgba(l.c, (l.a * (1 - k)).toFixed(3));
        ctx.fillRect(l.x + xo, y, 1 + (k < 0.3 ? 1 : 0), 1);
      }
    }
    if (police != null && Math.floor(t * 7) % 2 === 0) for (let y = wy + 1; y < wy + 18; y += 2) { ctx.fillStyle = `rgba(77,141,255,${0.35 - (y - wy) * 0.018})`; ctx.fillRect(police + 4 + Math.round(Math.sin(y + t * 4)), y, 2, 1); }
    // vaguelettes
    for (let i = 0; i < 26; i++) { const y = wy + 2 + ((i * 7) % (depth - 3)); const x = ((i * 53 + t * (6 + (i % 4) * 3)) % (W + 20)) - 10; p.r(x, y, 3 + (i % 3), 1, i % 2 ? "#1c2a4c" : "#16213f"); }
    // une péniche passe
    const bc = t % 52;
    if (bc < 34) {
      const bxp = Math.round(-110 + (bc / 34) * (W + 220)), by = wy + 17;
      for (let k = 1; k < 9; k++) { p.p(bxp - k * 4, by + 4 + (k % 2), "#26355e"); p.p(bxp - k * 4 - 2, by + 6 + (k % 2), "#1c2a4c"); }
      p.r(bxp, by, 66, 5, "#0b0e18"); p.r(bxp, by, 66, 1, "#2c3352"); p.r(bxp + 62, by + 1, 6, 3, "#0b0e18"); p.p(bxp + 67, by + 1, "#0b0e18");
      p.r(bxp + 10, by - 6, 46, 6, "#151a2c"); p.r(bxp + 10, by - 6, 46, 1, "#39406a");
      for (let k = bxp + 12; k < bxp + 55; k += 4) p.r(k, by - 4, 3, 3, "#f3cf86");
      p.r(bxp + 58, by - 3, 3, 3, "#151a2c"); p.p(bxp + 64, by - 2, "#43e08a"); p.r(bxp + 32, by - 11, 1, 5, "#151a2c"); p.p(bxp + 32, by - 12, "#ffffff");
      for (let y = by + 6; y < Math.min(gy, by + 20); y += 2) { ctx.fillStyle = `rgba(243,207,134,${0.28 - (y - by) * 0.012})`; ctx.fillRect(bxp + 12 + Math.round(Math.sin(y * 0.8 + t * 3) * 2), y, 42, 1); }
    }
    // brume au ras de l'eau
    for (let i = 0; i < 3; i++) { const x = ((t * (3 + i * 2) + i * 170) % (W + 240)) - 200; ctx.fillStyle = "rgba(120,130,190,0.05)"; ctx.fillRect(Math.round(x), wy - 2 + i * 5, 200, 3); }
    // premier plan
    ctx.drawImage(L.fg, 0, 0);
    // le chat des bouquinistes
    if (L.cat) {
      const { x, y } = L.cat;
      p.r(x, y - 5, 5, 5, "#07080c"); p.r(x + 1, y - 8, 3, 3, "#07080c"); p.p(x + 1, y - 9, "#07080c"); p.p(x + 3, y - 9, "#07080c");
      const sw = Math.round(Math.sin(t * 1.6) * 2);
      p.p(x + 5, y - 1, "#07080c"); p.p(x + 6, y - 2, "#07080c"); p.p(x + 7, y - 3 + (sw > 0 ? 0 : 1), "#07080c"); p.p(x + 7 + (sw > 1 ? 1 : 0), y - 4 + (sw > 0 ? 0 : 1), "#07080c");
      if (Math.floor(t * 0.7) % 6 !== 0) { p.p(x + 1, y - 7, "#d8e070"); p.p(x + 3, y - 7, "#d8e070"); }
    }
    // l'avocat rentre sous la pluie
    const lw = L.W + 70, ax = Math.round(((t * 11) % lw) - 30), ay = H - 9;
    const near = Math.max(0, 1 - Math.abs(ax - L.lampX) / 36);
    drawLawyer(p, ax, ay, Math.floor(t * 6) % 4, near);
    // son reflet sur les pavés mouillés
    ctx.globalAlpha = 0.22;
    for (let k = 1; k < 8 && ay + k < H; k++) ctx.drawImage(ctx.canvas, ax - 7, ay - k, 19, 1, ax - 7 + Math.round(Math.sin(k + t * 3) * 0.6), ay + k, 19, 1);
    ctx.globalAlpha = 1;
    // halo du réverbère et cône de lumière
    const lx = L.lampX, lt = L.lampTop;
    ctx.fillStyle = "rgba(255,214,140,0.10)"; ctx.beginPath(); ctx.moveTo(lx - 4, lt + 10); ctx.lineTo(lx + 5, lt + 10); ctx.lineTo(lx + 30, H); ctx.lineTo(lx - 29, H); ctx.closePath(); ctx.fill();
    const fl = 0.85 + Math.sin(t * 17) * 0.04 + (Math.sin(t * 0.7) > 0.995 ? -0.3 : 0);
    for (const [r, a] of [[16, 0.06], [10, 0.1], [6, 0.18]]) { ctx.fillStyle = `rgba(255,214,140,${(a * fl).toFixed(3)})`; ctx.fillRect(lx - r, lt + 5 - r, r * 2 + 1, r * 2); }
    for (let y = gy + 9; y < H; y += 2) { ctx.fillStyle = `rgba(255,214,140,${(0.16 * (1 - (y - gy) / (H - gy))).toFixed(3)})`; ctx.fillRect(lx - 2 + Math.round(Math.sin(y * 1.7 + t * 2)), y, 4, 1); }
    // la pluie
    const step = Math.min(0.1, dt);
    for (let i = 0; i < L.drops.length; i++) {
      const d = L.drops[i];
      d.y += d.v * step; d.x += d.v * step * 0.24;
      if (d.y >= d.ground) { L.splashes.push({ x: Math.round(d.x), y: Math.round(d.ground), t: 0, w: d.ground < gy }); L.drops[i] = newDrop(L, L.rnd, false); continue; }
      const lit = Math.abs(d.x - lx) < 6 + (d.y - lt) * 0.45 && d.y > lt;
      ctx.fillStyle = lit ? "rgba(255,228,170,0.75)" : d.near ? "rgba(170,186,230,0.42)" : "rgba(130,146,200,0.28)";
      for (let k = 0; k < d.len; k++) ctx.fillRect(Math.round(d.x - k * 0.24), Math.round(d.y - k), 1, 1);
    }
    for (let i = L.splashes.length - 1; i >= 0; i--) {
      const s = L.splashes[i]; s.t += step;
      if (s.t > 0.18) { L.splashes.splice(i, 1); continue; }
      ctx.fillStyle = s.w ? "rgba(160,176,230,0.45)" : "rgba(190,200,235,0.5)";
      if (s.w) { const r = 1 + Math.round(s.t * 14); ctx.fillRect(s.x - r, s.y, 1, 1); ctx.fillRect(s.x + r, s.y, 1, 1); }
      else { ctx.fillRect(s.x - 1, s.y - 1 - Math.round(s.t * 8), 1, 1); ctx.fillRect(s.x + 1, s.y - 1 - Math.round(s.t * 8), 1, 1); }
    }
    ctx.drawImage(L.frame, 0, 0);
    // un éclair lointain, de temps en temps
    const ec = t % 31;
    if (ec < 0.09 || (ec > 0.2 && ec < 0.26)) { ctx.fillStyle = "rgba(200,210,255,0.16)"; ctx.fillRect(0, 0, W, wy); ctx.fillStyle = "rgba(200,210,255,0.07)"; ctx.fillRect(0, wy, W, H - wy); }
  }

  // un avocat en imperméable, robe pliée sur le bras, écharpe ambre, parapluie
  function drawLawyer(p, x, y, f, near) {
    const coat = near > 0.4 ? "#4a3a2a" : "#2a2e3e", coatDk = "#13141c", rim = near > 0.1 ? "#e8b36a" : "#4a5280";
    const legA = [0, 1, 0, -1][f], legB = -legA;
    p.r(x + 1, y - 4, 1, 4 + (legA > 0 ? 0 : -1), coatDk); p.r(x + 3, y - 4, 1, 4 + (legB > 0 ? 0 : -1), coatDk);
    p.p(x + 1 + legA, y, "#08080b"); p.p(x + 3 + legB, y, "#08080b");
    p.r(x, y - 13, 5, 9, coat); p.r(x + 4, y - 13, 1, 9, rim); p.r(x, y - 5, 5, 1, coatDk);
    p.r(x, y - 14, 5, 2, "#e2a43b"); p.p(x + 4, y - 12, "#b8801f");
    p.r(x + 1, y - 17, 3, 3, near > 0.3 ? "#d4996a" : "#a87452"); p.r(x + 1, y - 18, 3, 1, "#1d1714");
    p.r(x - 2, y - 9, 3, 4, "#0a0a10"); p.p(x - 2, y - 6, "#f2f2f2");
    p.r(x + 5, y - 7, 1, 2, coatDk); p.r(x + 5, y - 5, 4, 3, "#4a2e1a"); p.r(x + 6, y - 6, 2, 1, "#4a2e1a");
    p.r(x + 2, y - 23, 1, 9, "#0b0b10");
    for (let i = 0; i < 6; i++) p.r(x + 2 - (8 - i), y - 22 - i, (8 - i) * 2 + 1, 1, "#0c0d14");
    p.r(x - 6, y - 22, 17, 1, "#0c0d14"); for (let k = -6; k <= 10; k += 4) p.p(x + k, y - 21, "#0c0d14");
    p.r(x - 2, y - 27, 9, 1, rim);
  }

  // =================================================================== Composant
  UI.TitleArt = ({ wide }) => {
    const ref = useRef(null);
    useEffect(() => {
      const c = ref.current;
      if (!c) return;
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let L = null, raf = 0, alive = true, last = 0, t0 = performance.now() - 14000;
      const ctx = c.getContext("2d");
      const layout = () => {
        const vw = Math.max(320, window.innerWidth || 1024), vh = Math.max(320, window.innerHeight || 768);
        const sc = Math.max(2, Math.round(Math.min(vw / 250, vh / 260)));
        const W = Math.min(900, Math.ceil(vw / sc)), H = Math.min(700, Math.ceil(vh / sc));
        const panel = vw >= 900 ? Math.min(520, vw * 0.42) : 0;
        const cx = panel ? Math.round((panel + (vw - panel) / 2) / sc) : Math.round(W / 2 + Math.min(28, W * 0.12));
        c.width = W; c.height = H; c.style.width = W * sc + "px"; c.style.height = H * sc + "px";
        ctx.imageSmoothingEnabled = false;
        try { L = build(W, H, cx); } catch (e) { console.error(e); L = null; }
        if (reduce && L) frame(ctx, L, 14, 0);
      };
      layout();
      let to = 0;
      const onResize = () => { clearTimeout(to); to = setTimeout(layout, 160); };
      window.addEventListener("resize", onResize);
      const loop = (now) => {
        if (!alive) return;
        if (L && now - last > 33) { const dt = (now - (last || now)) / 1000; last = now; try { frame(ctx, L, (now - t0) / 1000, dt || 0.033); } catch (e) { console.error(e); alive = false; } }
        raf = requestAnimationFrame(loop);
      };
      if (!reduce) raf = requestAnimationFrame(loop);
      return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); clearTimeout(to); };
    }, []);
    return html`<canvas ref=${ref} className="ts-canvas" aria-hidden="true" />`;
  };

  // l'emblème : une balance en pixels
  const BALANCE = [
    "........#........",
    ".......###.......",
    ".###############.",
    ".#......#......#.",
    "#.#.....#.....#.#",
    "#..#....#....#..#",
    "#...#...#...#...#",
    "#####...#...#####",
    ".###....#....###.",
    "........#........",
    "........#........",
    ".......###.......",
    ".....#######.....",
  ];
  UI.PixelBalance = ({ size = 4 }) => {
    const rects = [];
    BALANCE.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "#") rects.push(html`<rect key=${x + "-" + y} x=${x} y=${y} width="1" height="1" />`); }));
    return html`<svg className="ts-emblem" viewBox="0 0 17 13" width=${17 * size} height=${13 * size} shapeRendering="crispEdges" aria-hidden="true">
      <g fill="#5b3312" transform="translate(0.5,0.5)">${rects}</g><g fill="#f3c166">${rects}</g></svg>`;
  };
})();
