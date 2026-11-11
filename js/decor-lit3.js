/* La Permanence — décors éclairés, intérieurs : le cabinet et le domicile (CR.dec.LIT).
   Même contrat que les extérieurs (make(W) → set, frame, present), plus :
   - inst.hot : objets cliquables du cabinet (repère de l'image), lus par UI.Panorama ;
   - inst.opts : options de la partie relues à chaque image (messages non lus, téléphone, dossiers, heure) ;
   - inst.hover : identifiant de l'objet survolé, qui s'éclaire.
   Repère 0..480 au centre, la pièce se prolonge de chaque côté. Mur jusqu'à YW, sol à partir de YS. */
(function () {
  const CR = window.CR, PL = CR.lum, D = CR.dec, K = D.litKit;
  const { rgb, h01, h2, mix, rng } = PL;
  const { H, CW, Z, sh } = K;
  const YW = 112, YS = 116;
  const WARM = [1, 0.74, 0.42], COLD = [0.55, 0.72, 1];
  const AMB = { jour: [0.8, 0.8, 0.82], soir: [0.5, 0.42, 0.44], nuit: [0.2, 0.21, 0.31] };
  const farC = (P, hex, k) => { const c = rgb(hex), a = P.amb.map((v) => Math.min(1, v)); return mix([c[0] * a[0], c[1] * a[1], c[2] * a[2]], P.far, k); };

  // ------------------------------------------------------------------ pinceaux
  // mur plein, percé par les fenêtres (trous : [x, y, w, h])
  function murs(B, x0, x1, trous, col, bas) {
    B.mat(Z.FAC, 255, 0);
    const seg = (a, b, ya, yb) => { if (b > a && yb > ya) { B.r(a, ya, b - a, yb - ya, col); B.noise(a, ya, b - a, yb - ya, sh(col, 8), 0.06, a + ya, 0.6); B.noise(a, ya, b - a, yb - ya, sh(col, -8), 0.06, a + ya + 5, 0.6); } };
    const ts = trous.slice().sort((a, b) => a[0] - b[0]); let x = x0;
    for (const [tx, ty, tw, th] of ts) { seg(x, tx, 0, YW); seg(tx, tx + tw, 0, ty); seg(tx, tx + tw, ty + th, YW); x = tx + tw; }
    seg(x, x1, 0, YW);
    // corniche, soubassement mouluré, plinthe
    B.r(x0, 0, x1 - x0, 4, sh(col, 26)); B.hl(x0, 4, x1 - x0, sh(col, -30)); B.hl(x0, 6, x1 - x0, sh(col, 14));
    for (const [tx, ty, tw, th] of ts) if (ty < 6) B.r(tx, ty, tw, 6 - ty, sh(col, 26));
    const inT = (x, y) => ts.some(([tx, ty, tw, th]) => x >= tx && x < tx + tw && y >= ty && y < ty + th);
    for (let x = x0; x < x1; x++) for (let y = 86; y < YW; y++) if (!inT(x, y)) B.px(x, y, y === 86 ? sh(bas, 30) : y === 87 ? sh(bas, -26) : bas);
    for (let x = Math.ceil(x0 / 40) * 40 + 4; x < x1 - 30; x += 40) { if (inT(x + 16, 100)) continue; B.hl(x, 91, 32, sh(bas, -22)); B.vl(x, 91, 17, sh(bas, -22)); B.hl(x, 107, 32, sh(bas, 22)); B.vl(x + 31, 91, 17, sh(bas, 22)); }
    B.r(x0, YW, x1 - x0, YS - YW, sh(bas, -34)); B.hl(x0, YW, x1 - x0, sh(bas, 10));
  }
  function parquet(B, x0, x1, col, wet) {
    B.mat(Z.WALK, 255, 0); const W = B.W;
    B.r(x0, YS, x1 - x0, H - YS, col);
    for (let y = YS; y < H; y += 5) { B.hl(x0, y + 4, x1 - x0, sh(col, -16)); for (let x = Math.floor(x0 / 58) * 58 + ((y / 5 | 0) % 4) * 17; x < x1; x += 58) { B.vl(x, y, 4, sh(col, -14)); if (h2(x, y) < 0.5) B.r(x + 1, y, 57, 4, sh(col, h2(x, y + 1) < 0.5 ? 7 : -7), 0.4); } }
    B.noise(x0, YS, x1 - x0, H - YS, sh(col, 16), 0.05, 3, 0.6);
    for (let y = YS; y < H; y++) for (let x = 0; x < W; x++) wet[y * W + x] = 0.42;
  }
  function tapis(B, x, y, w, h, col, bord) { B.mat(Z.WALK, 255, 0); B.r(x, y, w, h, col); B.r(x, y, w, 1, bord); B.r(x, y + h - 1, w, 1, bord); for (let i = x + 3; i < x + w - 3; i += 6) { B.px(i, y + 2, bord); B.px(i + 3, y + h - 3, bord); } B.noise(x, y + 1, w, h - 2, sh(col, -16), 0.2, x, 0.6); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const X = i + B.ox; if (X >= 0 && X < B.W) B._wet[j * B.W + X] = 0; } }
  // ce qu'on voit par la fenêtre : ciel déjà peint, on ajoute les toits et un repère
  function vue(B, P, x, y, w, h, o) {
    const on = P.on > 0, R = rng((o.seed || 1) * 77), yb = y + h;
    B.mat(Z.FAR, 0, 255);
    const far2 = farC(P, "#7c8794", 0.6), near = farC(P, "#59616e", 0.35), zinc = farC(P, "#8f9aa8", 0.35);
    for (let bx = x; bx < x + w;) { const bw = Math.min(x + w - bx, 9 + (R() * 12 | 0)), bh = 10 + (R() * 14 | 0); B.r(bx, yb - bh - 12, bw, bh + 12, far2); bx += bw; }
    if (o.tour != null) { const tx = x + Math.round(w * o.tour), g = farC(P, "#7f9cb4", 0.2), gd = farC(P, "#4f6a84", 0.2); for (const [dx, tw, ty] of [[0, 22, yb - 34], [3, 16, yb - 48], [6, 10, yb - 60]]) { B.r(tx + dx, ty, tw, yb - ty, g); B.vl(tx + dx + tw - 1, ty, yb - ty, gd); for (let yy = ty + 2; yy < yb - 20; yy += 3) for (let xx = tx + dx + 1; xx < tx + dx + tw - 1; xx += 2) if (on && h2(xx, yy) < 0.4) B.px(xx, yy, h2(xx, yy + 1) < 0.7 ? "#dff0ff" : "#f6dc9a"); else if (h2(xx + 3, yy) < 0.3) B.px(xx, yy, gd); } }
    if (o.eiffel != null) { const ex = x + Math.round(w * o.eiffel), c = on ? rgb("#e8a848") : farC(P, "#5a5048", 0.45), top = yb - 62; for (let yy = top; yy < yb - 8; yy++) { const u = (yy - top) / (yb - 8 - top), hw = Math.pow(u, 2.2) * 9; if (hw < 1) B.px(ex, yy, c); else { B.px(ex - hw, yy, c); B.px(ex + hw, yy, c); if ((yy & 1) === 0 && hw < 6) for (let i = -hw + 1; i < hw; i++) B.px(ex + i, yy, c, 0.5); } } for (const u of [0.42, 0.68]) { const yy = Math.round(top + u * (yb - 8 - top)), hw = Math.round(Math.pow(u, 2.2) * 9) + 1; B.hl(ex - hw, yy, hw * 2 + 1, c); } o.ex = ex; o.etop = top; }
    for (let bx = x; bx < x + w;) { const bw = Math.min(x + w - bx, 14 + (R() * 18 | 0)), bh = 8 + (R() * 12 | 0); B.r(bx, yb - bh, bw, bh, near); B.r(bx, yb - bh - 3, bw, 3, zinc); for (let k = 0; k < 3; k++) { const wx = bx + 2 + (R() * Math.max(1, bw - 4) | 0), wy = yb - bh + 2 + (R() * Math.max(1, bh - 4) | 0); B.px(wx, wy, on && R() < 0.6 ? "#f0c070" : farC(P, "#2c3340", 0.3)); } if (R() < 0.7 && bw > 8) { const cx = bx + 2 + (R() * (bw - 6) | 0); B.r(cx, yb - bh - 7, 4, 4, farC(P, "#a87a5e", 0.4)); B.px(cx + 1, yb - bh - 9, farC(P, "#d9703a", 0.4)); B.px(cx + 3, yb - bh - 8, farC(P, "#d9703a", 0.4)); } bx += bw; }
  }
  function croisee(B, x, y, w, h, col, o) {
    B.mat(Z.FAC, 255, 0); o = o || {};
    B.r(x - 2, y - 2, w + 4, 2, col); B.r(x - 2, y + h, w + 4, 2, col); B.r(x - 2, y - 2, 2, h + 4, col); B.r(x + w, y - 2, 2, h + 4, col);
    B.vl(x + (w >> 1), y, h, col); B.vl(x + (w >> 1) - 1, y, h, sh(col, -30)); for (const f of o.trav || [0.3]) B.hl(x, y + Math.round(h * f), w, col);
    B.vl(x - 2, y - 2, h + 4, sh(col, 18)); B.hl(x - 2, y + h + 1, w + 4, sh(col, -40));
    if (o.appui !== false) { B.r(x - 5, y + h + 2, w + 10, 2, sh(col, -12)); B.hl(x - 5, y + h + 2, w + 10, sh(col, 16)); }
    // vitres : un reflet en biais
    B.mat(Z.FAC, 255, 255); for (const [a, b] of [[0.14, 0.2], [0.66, 0.5]]) for (let k = 0; k < 9; k++) B.px(x + w * a + k, y + h * b + 9 - k, "#ffffff", 0.1);
    B.mat(Z.FAC, 255, 0);
  }
  function rideau(B, x, y, w, h, col, embrasse) { B.mat(Z.ST, 255, 0); for (let i = 0; i < w; i++) { const c = sh(col, [12, 0, -14, -4, 8, -18][i % 6]); B.vl(x + i, y, h, c); } B.hl(x - 1, y - 1, w + 2, "#b8a05a"); B.hl(x - 1, y, w + 2, "#8a7438"); if (embrasse) { B.r(x, y + Math.round(h * 0.62), w, 2, "#b8a05a"); } }
  function livres(B, x, y, w, h, o) {
    o = o || {}; const R = rng(x * 13 + y), bois = o.bois || "#3b2616";
    B.mat(Z.ST, 255, 0); B.r(x, y, w, h, bois); B.r(x + 2, y + 2, w - 4, h - 2, sh(bois, -18)); B.vl(x, y, h, sh(bois, 24)); B.vl(x + w - 1, y, h, sh(bois, -24)); B.r(x - 1, y - 2, w + 2, 2, sh(bois, 16));
    const n = Math.max(1, Math.round((h - 4) / 19)), rh = (h - 2) / n;
    for (let r = 0; r < n; r++) {
      const by = Math.round(y + 2 + (r + 1) * rh) - 2; B.r(x + 2, by, w - 4, 2, sh(bois, 8)); B.hl(x + 2, by + 2 > y + h - 1 ? by + 1 : by + 2, w - 4, sh(bois, -34), 0.6);
      for (let bx = x + 3; bx < x + w - 5;) {
        const u = R(); if (u < 0.06) { bx += 3; continue; }
        if (u > 0.95 && bx < x + w - 14) { for (let k = 0; k < 3; k++) B.r(bx, by - 3 - k * 3, 9, 3, ["#d9cfb8", "#27407a", "#b3261e"][k]); bx += 11; continue; }
        const bw = 2 + (R() * 3 | 0), bh = Math.min(rh - 5, 11 + (R() * 5 | 0)), rouge = R() < (o.rouge == null ? 0.55 : o.rouge);
        const c = rouge ? (R() < 0.5 ? "#b3261e" : "#9e1f19") : ["#27407a", "#d9cfb8", "#3d5a3a", "#1e2a4a", "#7a5a2a", "#5b4a7a"][(R() * 6) | 0];
        B.r(bx, by - bh, bw, bh, c); B.vl(bx, by - bh, bh, sh(c, 26)); if (bw > 2) { B.px(bx + 1, by - bh + 2, rouge ? "#e2c06a" : sh(c, 50)); B.px(bx + 1, by - 3, rouge ? "#e2c06a" : sh(c, 50)); }
        bx += bw;
      }
    }
  }
  function cadre(B, x, y, w, h, kind, seed) {
    B.mat(Z.ST, 255, 0); B.r(x, y, w, h, kind === "diplome" ? "#2a2016" : "#b8963e"); B.hl(x, y, w, kind === "diplome" ? "#4a3a28" : "#e2c06a"); B.r(x + 2, y + 2, w - 4, h - 4, "#ece6d6");
    if (kind === "diplome") { for (let j = y + 4; j < y + h - 5; j += 2) B.hl(x + 4, j, w - 8 - ((j * 3) % 5), "#8a8478"); B.px(x + w - 6, y + h - 5, "#b3261e"); B.px(x + w - 5, y + h - 5, "#b3261e"); B.px(x + w - 6, y + h - 4, "#b3261e"); }
    else if (kind === "mer") { B.r(x + 2, y + 2, w - 4, (h - 4) >> 1, "#f2c88a"); B.r(x + 2, y + 2 + ((h - 4) >> 1), w - 4, h - 4 - ((h - 4) >> 1), "#2f6a8a"); B.ell(x + w / 2, y + 2 + ((h - 4) >> 1), 4, 4, "#e8703a"); B.r(x + 2, y + 2 + ((h - 4) >> 1), w - 4, h - 4 - ((h - 4) >> 1), "#2f6a8a"); for (let i = x + 4; i < x + w - 4; i += 3) B.px(i, y + h - 5 - (i % 2), "#7ab0c8"); B.r(x + 4, y + h - 9, 3, 1, "#1e3a2a"); B.line(x + 5, y + h - 9, x + 3, y + 5, "#1e3a2a"); for (const [a, b] of [[-3, 0], [3, 0], [-2, -1], [2, -1], [0, -2]]) B.px(x + 3 + a, y + 5 + b, "#2f6a3a"); }
    else { const c = ["#c8443a", "#27407a", "#3e6a4a", "#e8c66a"]; for (let k = 0; k < 4; k++) B.r(x + 3 + ((h01(seed + k) * (w - 10)) | 0), y + 3 + ((h01(seed * 3 + k) * (h - 10)) | 0), 4 + (k % 2) * 2, 4, c[k]); }
  }
  function plante(B, x, y, seed, grand) {
    B.mat(Z.ST, 255, 0); B.r(x - 4, y - 8, 9, 8, "#b9683e"); B.hl(x - 5, y - 8, 11, "#d08050"); B.vl(x + 4, y - 7, 7, "#8a4a2a");
    const n = grand ? 9 : 6; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.36, len = (grand ? 22 : 13) + h01(seed + i) * 8; for (let k = 0; k < len; k++) { const px = x + Math.cos(a) * k * 0.9 + Math.sin(k * 0.2) * (i % 2 ? 2 : -2), py = y - 8 + Math.sin(a) * k + (k * k) / (grand ? 70 : 40); B.px(px, py, k > len * 0.5 ? "#4f8a4a" : "#2f5a32"); if (k > len * 0.4) { B.px(px + 1, py, "#3f6a3a"); B.px(px, py + 1, "#2f5a32"); } } }
  }
  function radiateur(B, x, y, w) { B.mat(Z.ST, 255, 0); B.r(x, y, w, YW - y, "#d8d4ca"); for (let i = x; i < x + w; i += 3) B.vl(i, y, YW - y, "#a8a498"); B.hl(x, y, w, "#f2efe6"); }

  // ------------------------------------------------------------------ une pièce : la fabrique
  function piece(def) {
    return function Scene(W) {
      const d = K.dims(W), R = PL.Renderer(d.FW, H);
      let P = null, ctx = null, lastT = 0, bird = null;
      const S = { W: d.FW, H, R, hot: [], opts: {}, hover: null };
      S.set = function (ph, rain, o) {
        K.use(d); P = PL.conf(ph, rain); P.o = o || {}; P.saison = P.o.season || "automne"; S.opts = P.o;
        const B = R.stat; B.c.fill(0); B.e.fill(0); B.l.fill(0); B.z.fill(0); R.wet.fill(0); B.G = 0; B.ox = 0; B._wet = R.wet;
        ctx = { d, L: [], hot: [], trous: [], pluie: [] };
        B.ox = d.OX; K.ciel(B, P);
        def.build(B, P, ctx);
        for (const l of ctx.L) l.x += d.OX;
        R.bake(ctx.L);
        S.hot = ctx.hot.map((h) => Object.assign({}, h, { x: h.x + d.OX }));
        bird = ctx.oiseau ? { hx: ctx.oiseau[0], hy: ctx.oiseau[1], x: ctx.oiseau[0], y: ctx.oiseau[1], fly: 0, vx: 0, vy: 0, back: 0 } : null;
      };
      S.frame = function (t, mouse) {
        K.use(d);
        const B = R.work, dyn = [], o = S.opts || {}, dt = Math.min(0.2, Math.max(0, t - lastT)); lastT = t;
        B.copy(R.stat); B.G = 0; B.ox = d.OX; B._wet = R.wet;
        const m = mouse ? { x: mouse.x - d.OX, y: mouse.y } : null;
        // l'oiseau du rebord (dehors, derrière la vitre)
        if (bird && !(P.ph === "nuit")) {
          if (!bird.fly && m && Math.hypot(m.x - bird.x, m.y - bird.y) < 22) { bird.fly = 1; bird.vx = m.x > bird.x ? -34 : 34; bird.vy = -40; bird.back = t + 12; }
          if (bird.fly === 1) { bird.x += bird.vx * dt; bird.y += bird.vy * dt; if (t > bird.back) { bird.fly = 2; bird.x = bird.hx - 50; bird.y = bird.hy - 40; } }
          else if (bird.fly === 2) { const dx = bird.hx - bird.x, dy = bird.hy - bird.y, dd = Math.hypot(dx, dy); if (dd < 2) { bird.fly = 0; bird.x = bird.hx; bird.y = bird.hy; } else { bird.x += dx / dd * 44 * dt; bird.y += dy / dd * 44 * dt; } }
          const tr = ctx.trous[0]; if (tr && bird.x > tr[0] + 3 && bird.x < tr[0] + tr[2] - 3 && bird.y > tr[1] + 3) { B.G = 0; K.pigeon(B, Math.round(bird.x), Math.round(bird.y), bird.fly, t, 1); }
        }
        // pluie sur les vitres
        if (P.rain) { B.mat(Z.FAR, 0, 255); for (const [x, y, w, h] of ctx.trous) for (let i = 0; i < w * 0.5; i++) { const xx = x + 1 + ((h01(i * 7.3) * (w - 2)) | 0), sp = 22 + h01(i * 1.7) * 30, yy = y + ((h01(i * 3.1) * h + t * sp) % h), len = 2 + (i % 3); if ((xx - x) === (w >> 1) || (xx - x) === (w >> 1) - 1) continue; for (let k = 0; k < len && yy + k < y + h; k++) B.px(xx, yy + k, "#c8d8ea", 0.34); } }
        B.mat(Z.ACT, 255, 0);
        if (def.anim) def.anim(B, P, t, ctx, dyn, o, m);
        // objet survolé : il s'éclaire, quatre coins dorés
        const hv = S.hover && ctx.hot.find((q) => q.id === S.hover);
        if (hv) { const c = Math.floor(t * 3) % 2 ? "#f6c96d" : "#e2a43b", x0 = hv.x - 2, y0 = hv.y - 2, x1 = hv.x + hv.w + 1, y1 = hv.y + hv.h + 1; B.mat(Z.FG, 0, 255); for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { B.hl(Math.min(x, x + dx * 4), y, 5, c); B.vl(x, Math.min(y, y + dy * 4), 5, c); } dyn.push({ x: hv.x + hv.w / 2 + d.OX, y: hv.y + hv.h / 2, r: Math.max(hv.w, hv.h) * 0.9 + 14, c: [1, 0.86, 0.55], i: 0.5 + 0.08 * Math.sin(t * 5) }); }
        R.frame({ amb: AMB[P.ph].map((v) => v * (P.rain && P.ph === "jour" ? 0.86 : 1)), dyn, wet: 0.5, t, YR: H + 2, YB: YS, mist: null, glow: P.ph === "jour" ? 0.45 : 1 });
      };
      S.present = (c, w, h) => R.present(c, w, h);
      return S;
    };
  }
  // lumière qui entre par une fenêtre, selon l'heure
  function jourFenetre(P, ctx, x, y, w, h) {
    const c = P.ph === "jour" ? (P.rain ? [0.8, 0.86, 0.95] : [1, 0.96, 0.84]) : P.ph === "soir" ? [1, 0.6, 0.38] : [0.42, 0.52, 0.95];
    const i = P.ph === "jour" ? (P.rain ? 0.26 : 0.42) : P.ph === "soir" ? 0.5 : 0.22;
    ctx.L.push({ x: x + w / 2, y: y + h * 0.6, r: w + 90, c, i }, { x: x + w / 2 - 26, y: YS + 16, r: 70, c, i: i * 0.8 });
  }
  function horloge(B, x, y, min) { B.mat(Z.ST, 255, 0); B.ell(x, y, 7, 7, "#2a2016"); B.ell(x, y, 5.6, 5.6, "#f2ecd8"); const ah = ((min / 60) % 12) / 12 * 6.283, am = (min % 60) / 60 * 6.283; B.line(x, y, x + Math.sin(ah) * 2.6, y - Math.cos(ah) * 2.6, "#1d1d22"); B.line(x, y, x + Math.sin(am) * 4.4, y - Math.cos(am) * 4.4, "#1d1d22"); B.px(x, y, "#b3261e"); }

  // ------------------------------------------------------------------ le cabinet
  const CAB = {
    build(B, P, ctx) {
      const on = P.on > 0, d = ctx.d, mur = "#56627a", bas = "#465068";
      const F = [178, 14, 124, 78]; ctx.trous = [F];
      // fenêtres secondaires sur les côtés (écran large)
      const mods = []; for (let k = 1; k * 96 < d.OX + 96; k++) { mods.push([-96 * k, k], [CW + 96 * (k - 1), -k]); }
      for (const [mx, k] of mods) if (Math.abs(k) % 2 === 0) ctx.trous.push([mx + 26, 18, 44, 60]);
      const vo = { tour: 0.1, eiffel: 0.82, seed: 3 }; vue(B, P, F[0], F[1], F[2], F[3], vo); ctx.eiffel = [vo.ex, vo.etop, F[1] + F[3] - 8];
      for (const t of ctx.trous.slice(1)) vue(B, P, t[0], t[1], t[2], t[3], { seed: t[0] });
      murs(B, d.X0, d.X1, ctx.trous, mur, bas);
      parquet(B, d.X0, d.X1, "#8a6642", R_wet(B)); tapis(B, 120, 124, 240, 22, "#3a2f55", "#c9a24a");
      for (const t of ctx.trous) { croisee(B, t[0], t[1], t[2], t[3], "#e9e4d8", { trav: [0.28] }); jourFenetre(P, ctx, t[0], t[1], t[2], t[3]); }
      rideau(B, F[0] - 16, 8, 14, 96, "#7a2f3a", true); rideau(B, F[0] + F[2] + 2, 8, 14, 96, "#7a2f3a", true);
      radiateur(B, 206, 98, 68);
      // modules latéraux
      for (const [mx, k] of mods) { if (Math.abs(k) % 2 === 0) { rideau(B, mx + 14, 12, 9, 72, "#7a2f3a", true); rideau(B, mx + 73, 12, 9, 72, "#7a2f3a", true); plante(B, mx + 48, YS + 2, mx, true); } else { livres(B, mx + 8, 12, 80, 100); if (on) ctx.L.push({ x: mx + 48, y: 10, r: 60, c: WARM, i: 0.5, down: true }); } }
      // bibliothèque des codes
      livres(B, 34, 10, 96, 102, { rouge: 0.62 }); B.mat(Z.ST, 255, 0); B.r(98, 56, 9, 10, "#c9b26a"); B.r(101, 50, 3, 6, "#c9b26a"); B.hl(95, 50, 15, "#e2c06a"); B.px(95, 51, "#e2c06a"); B.px(95, 52, "#c9b26a"); B.px(109, 51, "#e2c06a"); B.px(109, 53, "#c9b26a"); B.hl(93, 53, 5, "#c9b26a"); B.hl(107, 54, 5, "#c9b26a");
      B.mat(Z.ST, on ? 0 : 255, on ? 255 : 0); B.r(40, 11, 84, 1, on ? "#ffe2a0" : "#c8c0a8"); B.mat(Z.ST, 255, 0); if (on) ctx.L.push({ x: 82, y: 14, r: 78, c: WARM, i: 0.8, down: true, up: 4 });
      ctx.hot.push({ id: "bibliotheque", label: "Bibliothèque", x: 34, y: 10, w: 96, h: 102 });
      // diplômes, plante
      cadre(B, 2, 26, 22, 17, "diplome", 1); cadre(B, 6, 50, 18, 14, "diplome", 2); plante(B, 14, YS + 3, 5, true);
      cadre(B, 140, 30, 20, 16, "diplome", 3);
      // plan de Paris encadré, sous sa rampe
      const mx = 330, my = 22; B.mat(Z.ST, 255, 0); B.r(mx, my, 58, 42, "#b8963e"); B.hl(mx, my, 58, "#e2c06a"); B.r(mx + 2, my + 2, 54, 38, "#ece6d6");
      for (let i = 0; i < 54; i++) { const yy = my + 20 + Math.round(Math.sin(i / 54 * 3.6 + 0.4) * 7); B.px(mx + 2 + i, yy, "#6aa0c8"); B.px(mx + 2 + i, yy + 1, "#8ab8d8"); }
      for (const [a, b, c2, e, col] of [[4, 10, 52, 30, "#ffcd00"], [6, 30, 50, 8, "#c9910d"], [10, 4, 30, 38, "#62259d"], [4, 22, 54, 18, "#007852"], [28, 4, 44, 38, "#f28e42"], [16, 36, 52, 12, "#6ec4e8"]]) B.line(mx + a, my + b, mx + c2, my + e, col, 0.85);
      for (const [a, b] of [[18, 16], [30, 22], [40, 14], [24, 30], [44, 26]]) B.px(mx + a, my + b, "#1d1d22"); B.px(mx + 30, my + 21, "#c8323a"); B.px(mx + 31, my + 21, "#c8323a");
      B.r(mx + 14, my - 5, 30, 2, "#8a7438"); B.mat(Z.ST, on ? 0 : 255, on ? 255 : 0); B.r(mx + 16, my - 3, 26, 1, on ? "#ffe2a0" : "#c8c0a8"); B.mat(Z.ST, 255, 0); if (on) ctx.L.push({ x: mx + 29, y: my - 1, r: 56, c: WARM, i: 0.85, down: true, up: 2 });
      ctx.hot.push({ id: "carte", label: "Carte de Paris", x: mx, y: my, w: 58, h: 42 });
      // agenda mural et horloge
      const ax = 400, ay = 34; B.r(ax, ay, 22, 28, "#f2efe6"); B.r(ax, ay, 22, 6, "#b3261e"); B.px(ax + 5, ay - 1, "#8d9099"); B.px(ax + 16, ay - 1, "#8d9099"); for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) B.px(ax + 3 + i * 4, ay + 10 + j * 4, (i + j * 5) === 7 ? "#b3261e" : "#8a8478"); B.vl(ax + 21, ay, 28, "#c8c4b8");
      ctx.hot.push({ id: "agenda", label: "Agenda", x: ax - 2, y: 8, w: 26, h: 56 }); ctx.clock = [ax + 11, 18];
      // portemanteau : la robe et son rabat
      const px = 448; B.vl(px, 30, 86, "#3b2616"); B.vl(px + 1, 30, 86, "#5a3d26"); B.hl(px - 5, 32, 12, "#3b2616"); B.px(px - 6, 31, "#3b2616"); B.px(px + 7, 31, "#3b2616"); B.r(px - 5, YS - 1, 12, 2, "#3b2616");
      B.r(px - 9, 36, 14, 58, "#18181e"); B.vl(px - 9, 36, 58, "#2f2f3a"); B.vl(px - 4, 44, 50, "#0b0b0e"); B.vl(px + 1, 40, 54, "#0b0b0e"); B.r(px - 4, 36, 4, 9, "#f2efe6"); B.vl(px - 2, 37, 8, "#d8d4ca"); B.r(px + 5, 40, 3, 26, "#18181e"); B.r(px + 5, 62, 3, 5, "#f4f2ea"); B.px(px + 6, 64, "#1a1a1e");
      plante(B, 472, YS + 2, 9, false);
      // fauteuil derrière le bureau
      B.mat(Z.ST, 255, 0); B.r(224, 74, 34, 32, "#2c2420"); B.hl(224, 74, 34, "#4a3c34"); B.vl(224, 74, 32, "#3c302a"); B.vl(257, 74, 32, "#1c1612"); for (let j = 80; j < 100; j += 7) for (let i = 230; i < 254; i += 8) B.px(i, j, "#4a3c34");
      // bureau
      const dx = 140, dw = 200, dy = 104; B.r(dx, dy, dw, 4, "#6b4a2e"); B.hl(dx, dy, dw, "#8a6440"); B.hl(dx, dy + 3, dw, "#4b3220"); B.r(dx + 4, dy + 4, dw - 8, 32, "#4b3220"); B.noise(dx + 4, dy + 4, dw - 8, 32, "#432c1c", 0.2, 5, 0.6);
      for (const q of [dx + 10, dx + 144]) { for (const yy of [dy + 7, dy + 20]) { B.r(q, yy, 46, 11, "#3b2616"); B.hl(q, yy, 46, "#5a3d26"); B.hl(q, yy + 10, 46, "#2a1a0e"); B.r(q + 20, yy + 5, 6, 2, "#d6b25a"); } }
      B.r(dx + 62, dy + 7, 76, 24, "#3b2616"); B.hl(dx + 62, dy + 7, 76, "#5a3d26"); B.r(dx + 4, dy + 36, 5, 4, "#2a1a0e"); B.r(dx + dw - 9, dy + 36, 5, 4, "#2a1a0e");
      // lampe de banquier
      const lx = 156; B.r(lx - 6, dy - 2, 13, 2, "#8a7438"); B.hl(lx - 6, dy - 2, 13, "#c9b26a"); B.vl(lx, dy - 16, 14, "#c9b26a"); B.vl(lx + 1, dy - 16, 14, "#8a7438"); B.mat(Z.ST, 200, 70); B.r(lx - 11, dy - 22, 23, 6, "#2b6a4a"); B.hl(lx - 10, dy - 22, 21, "#4a9a6e"); B.px(lx - 11, dy - 22, "#56627a"); B.px(lx + 11, dy - 22, "#56627a"); B.mat(Z.ST, 0, 255); B.hl(lx - 9, dy - 16, 19, "#ffe9b0"); B.mat(Z.ST, 255, 0);
      ctx.L.push({ x: lx, y: dy - 14, r: on ? 86 : 44, c: WARM, i: on ? 1.25 : 0.4, down: true, up: 3, haze: on ? 0.34 : 0.1, hr: 22 });
      // carnet, stylo
      B.r(184, dy - 2, 20, 2, "#fbfbf6"); B.hl(185, dy - 1, 18, "#9a8fd0"); B.vl(188, dy - 2, 2, "#d46a5a"); B.hl(196, dy - 3, 7, "#1e2a4a");
      // ordinateur portable
      const ox = 212; B.r(ox - 3, dy - 2, 44, 2, "#2a2c33"); B.hl(ox - 3, dy - 2, 44, "#4a4c55"); B.r(ox, dy - 26, 38, 24, "#1a1c22"); B.mat(Z.ST, 60, 215); B.r(ox + 2, dy - 24, 34, 20, on ? "#3c66a0" : "#345882"); B.hl(ox + 4, dy - 21, 22, "#d4e1ef"); B.hl(ox + 4, dy - 17, 28, "#9fb6cf"); B.hl(ox + 4, dy - 14, 18, "#9fb6cf"); B.hl(ox + 4, dy - 11, 24, "#9fb6cf"); B.hl(ox + 4, dy - 8, 14, "#9fb6cf"); B.mat(Z.ST, 255, 0);
      ctx.L.push({ x: ox + 19, y: dy - 12, r: 40, c: COLD, i: on ? 0.5 : 0.2 }); ctx.lap = [ox, dy];
      ctx.hot.push({ id: "messagerie", label: "Messagerie", x: ox - 2, y: dy - 27, w: 42, h: 28 });
      // téléphone sur son socle
      const tx = 266; B.r(tx - 2, dy - 3, 14, 3, "#2a2c33"); B.r(tx, dy - 19, 10, 17, "#15161b"); B.hl(tx, dy - 19, 10, "#3a3c44"); ctx.tel = [tx, dy];
      ctx.hot.push({ id: "telephone", label: "Téléphone", x: tx - 3, y: dy - 21, w: 16, h: 22 });
      // tasse
      const cx = 288; B.r(cx, dy - 8, 8, 8, "#ece8df"); B.vl(cx, dy - 8, 8, "#ffffff"); B.r(cx + 8, dy - 6, 2, 4, "#ece8df"); B.hl(cx + 1, dy - 8, 6, "#3e2414"); ctx.tasse = [cx + 4, dy - 9];
      // dossiers : la pile se dessine à chaque image
      ctx.dos = [302, dy]; ctx.hot.push({ id: "dossiers", label: "Dossiers", x: 300, y: dy - 26, w: 38, h: 27 });
      ctx.oiseau = [F[0] + 94, F[1] + F[3] - 2];
    },
    anim(B, P, t, ctx, dyn, o, m) {
      const on = P.on > 0, OX = ctx.d.OX;
      horloge(B, ctx.clock[0], ctx.clock[1], o.min == null ? 600 : o.min);
      // pile de dossiers
      const [dx, dy] = ctx.dos, n = Math.min(9, o.files || 0); B.mat(Z.ST, 255, 0);
      for (let i = 0; i < n; i++) { const c = ["#d99aa8", "#9ab4d9", "#e2cf8a", "#a8c9a0"][i % 4], xx = dx + [0, 2, 1, 3, 0, 2, 1, 0, 2][i], yy = dy - 3 - i * 3; B.r(xx, yy, 30, 3, c); B.hl(xx, yy, 30, sh(c, 30)); B.px(xx + 27, yy + 1, "#f2efe6"); B.px(xx + 3, yy + 2, sh(c, -40)); }
      if (!n) { B.r(dx + 2, dy - 2, 28, 2, "#5a3d26"); B.hl(dx + 2, dy - 2, 28, "#7a5a3a"); }
      // écran : curseur, pastille des messages non lus
      const [lx, ly] = ctx.lap; if (Math.floor(t * 2) % 2) { B.mat(Z.ST, 60, 215); B.px(lx + 19, ly - 8, "#ffffff"); B.px(lx + 19, ly - 7, "#ffffff"); }
      if (o.unread > 0) { B.mat(Z.ST, 0, 255); B.r(lx + 28, ly - 25, 9, 8, "#e04a3a"); B.txt(String(Math.min(9, o.unread)), lx + 31, ly - 24, "#ffffff"); dyn.push({ x: lx + 32 + OX, y: ly - 21, r: 16, c: [1, 0.3, 0.2], i: 0.5 + 0.2 * Math.sin(t * 4) }); }
      // téléphone : sonne, ou message en attente
      const [tx, ty] = ctx.tel, ring = o.ringing && Math.floor(t * 4) % 2 === 0;
      B.mat(Z.ST, ring || o.voicemail ? 0 : 200, ring ? 255 : o.voicemail ? 200 : 40); B.r(tx + 1, ty - 17, 8, 13, ring ? "#7fd0ff" : o.voicemail ? "#e8b23a" : "#2b3140");
      if (ring) { B.mat(Z.ST, 0, 255); for (const [a, b] of [[-4, -16], [13, -16], [-6, -11], [15, -11], [-4, -6], [13, -6]]) B.px(tx + a, ty + b, "#7fd0ff"); dyn.push({ x: tx + 5 + OX, y: ty - 10, r: 46, c: [0.4, 0.75, 1], i: 0.9 }); }
      else if (o.voicemail) dyn.push({ x: tx + 5 + OX, y: ty - 10, r: 18, c: [1, 0.7, 0.2], i: 0.4 });
      // vapeur du café
      B.mat(Z.ST, 255, 40); for (let k = 0; k < 5; k++) { const u = (t * 0.5 + k * 0.2) % 1; B.px(ctx.tasse[0] + Math.round(Math.sin(u * 7 + k) * 1.6), ctx.tasse[1] - u * 12, "#ffffff", 0.34 * (1 - u)); }
      // la lampe vacille à peine ; au loin, la tour s'illumine à l'heure pile
      if (on) dyn.push({ x: 156 + OX, y: 92, r: 30, c: WARM, i: 0.06 * Math.sin(t * 9) + 0.06 });
      etincelles(B, P, t, ctx, o);
    },
  };
  // la tour Eiffel scintille pendant les cinq premières minutes de chaque heure, la nuit
  function etincelles(B, P, t, ctx, o) {
    const e = ctx.eiffel; if (!e || !P.on) return; const min = o.min == null ? 600 : o.min;
    B.mat(Z.FAR, 0, 255); if (Math.floor(t * 0.5) % 2) B.px(e[0], e[1] - 1, "#fff6d0");
    if (((min % 60) + 60) % 60 < 5) for (let k = 0; k < 9; k++) { const u = h01(k * 3.3 + Math.floor(t * 9) * 1.7), yy = e[1] + u * (e[2] - e[1]), hw = Math.pow(u, 2.2) * 9; B.px(e[0] + (h01(k + Math.floor(t * 9)) - 0.5) * 2 * hw, yy, "#ffffff"); }
  }
  const R_wet = (B) => B._wet;

  // ------------------------------------------------------------------ le domicile
  const DOM = {
    build(B, P, ctx) {
      const on = P.on > 0, d = ctx.d, mur = "#b39f86", bas = "#a08c74";
      const F = [150, 10, 100, 100]; ctx.trous = [F];
      const mods = []; for (let k = 1; k * 96 < d.OX + 96; k++) mods.push([-96 * k, k], [CW + 96 * (k - 1), -k]);
      for (const [mx, k] of mods) if (Math.abs(k) % 2 === 1) ctx.trous.push([mx + 26, 18, 44, 62]);
      const vo = { eiffel: 0.7, seed: 11 }; vue(B, P, F[0], F[1], F[2], F[3] - 10, vo); ctx.eiffel = [vo.ex, vo.etop, F[1] + F[3] - 18];
      for (const t of ctx.trous.slice(1)) vue(B, P, t[0], t[1], t[2], t[3], { seed: t[0] + 9 });
      // balcon : la dalle et le garde-corps en fer forgé, dehors
      B.mat(Z.FAR, 0, 255); const fer = farC(P, "#14171f", 0.1); B.r(F[0], F[1] + F[3] - 10, F[2], 10, farC(P, "#8a8478", 0.3)); B.hl(F[0], 78, F[2], fer); B.hl(F[0], 79, F[2], fer); B.hl(F[0], 96, F[2], fer); for (let x = F[0] + 2; x < F[0] + F[2]; x += 4) { B.vl(x, 79, 21, fer); if ((x - F[0]) % 8 === 2) { B.px(x + 1, 86, fer); B.px(x + 2, 87, fer); B.px(x + 1, 88, fer); } }
      B.r(F[0] + 70, 86, 12, 10, farC(P, "#b9683e", 0.2)); for (const [a, b] of [[72, 82], [76, 79], [80, 82], [74, 84], [78, 84], [76, 76]]) B.ell(F[0] + a, b, 2.5, 2.5, farC(P, b % 3 ? "#3f6a3a" : "#c8443a", 0.15));
      murs(B, d.X0, d.X1, ctx.trous, mur, bas);
      parquet(B, d.X0, d.X1, "#a8845a", B._wet); tapis(B, 256, 122, 130, 24, "#7a4a52", "#e2cf8a");
      croisee(B, F[0], F[1], F[2], F[3], "#f2efe6", { trav: [0.2], appui: false }); jourFenetre(P, ctx, F[0], F[1], F[2], F[3]);
      for (const t of ctx.trous.slice(1)) { croisee(B, t[0], t[1], t[2], t[3], "#f2efe6"); jourFenetre(P, ctx, t[0], t[1], t[2], t[3]); rideau(B, t[0] - 12, 12, 9, 76, "#d8cfc0", true); rideau(B, t[0] + t[2] + 3, 12, 9, 76, "#d8cfc0", true); }
      rideau(B, F[0] - 16, 6, 14, 108, "#d8cfc0", true); rideau(B, F[0] + F[2] + 2, 6, 14, 108, "#d8cfc0", true);
      for (const [mx, k] of mods) if (Math.abs(k) % 2 === 0) { livres(B, mx + 14, 40, 68, 72, { rouge: 0.2, bois: "#6a4a2c" }); cadre(B, mx + 30, 12, 30, 20, "abstrait", mx); } else plante(B, mx + 84, YS + 2, mx, true);
      // buffet, platine, affiche
      B.mat(Z.ST, 255, 0); B.r(36, 88, 92, 24, "#6a4a2c"); B.hl(36, 88, 92, "#8a6642"); B.hl(36, 111, 92, "#3b2616"); for (const x of [40, 70, 100]) { B.r(x, 92, 26, 17, "#5a3d24"); B.hl(x, 92, 26, "#7a5a3a"); B.px(x + 12, 100, "#d6b25a"); B.px(x + 13, 100, "#d6b25a"); } B.r(40, 112, 3, 5, "#3b2616"); B.r(122, 112, 3, 5, "#3b2616");
      B.r(44, 82, 26, 6, "#2a2c33"); B.hl(44, 82, 26, "#4a4c55"); B.ell(55, 84, 6, 2, "#101014"); B.px(55, 84, "#c8443a"); ctx.disque = [55, 84]; B.line(64, 83, 60, 85, "#c8ccd4");
      for (let k = 0; k < 9; k++) B.r(76 + k * 3, 74 + (k % 2), 2, 14 - (k % 2), ["#c8443a", "#27407a", "#e8c66a", "#1e1e24", "#3e6a4a", "#f2efe6", "#5b4a7a", "#d9703a", "#2a9a94"][k]);
      cadre(B, 44, 22, 44, 34, "mer", 4); cadre(B, 96, 28, 22, 26, "abstrait", 7); cadre(B, 96, 60, 22, 14, "diplome", 2);
      B.r(108, 76, 9, 12, "#ece8df"); B.ell(112, 70, 5, 6, "#3f6a3a"); B.ell(109, 66, 3, 4, "#4f8a4a"); B.ell(115, 68, 3, 3, "#2f5a32");
      plante(B, 14, YS + 3, 21, true);
      // canapé
      const sx = 270; B.r(sx, 82, 104, 30, "#47536e"); B.hl(sx, 82, 104, "#5d6c8c"); B.noise(sx, 83, 104, 14, "#3f4a64", 0.14, 3, 0.6); B.r(sx - 6, 90, 9, 24, "#3a4560"); B.hl(sx - 6, 90, 9, "#5d6c8c"); B.r(sx + 101, 90, 9, 24, "#3a4560"); B.hl(sx + 101, 90, 9, "#5d6c8c");
      B.r(sx + 3, 98, 98, 10, "#525f7c"); B.hl(sx + 3, 98, 98, "#6a7a9a"); B.vl(sx + 52, 98, 10, "#3a4560"); B.r(sx + 3, 108, 98, 6, "#3a4560"); B.r(sx - 2, 114, 3, 3, "#2a1a0e"); B.r(sx + 103, 114, 3, 3, "#2a1a0e");
      B.r(sx + 6, 86, 16, 12, "#d9a03a"); B.hl(sx + 6, 86, 16, "#f0c060"); B.vl(sx + 21, 87, 11, "#a87a2a"); B.r(sx + 82, 87, 15, 11, "#b9583e"); B.hl(sx + 82, 87, 15, "#d87858");
      B.r(sx + 56, 96, 22, 4, "#e6dcc6"); B.hl(sx + 56, 96, 22, "#f6f0e0"); for (let i = sx + 57; i < sx + 78; i += 3) B.px(i, 100, "#e6dcc6");
      ctx.chat = [sx + 38, 98];
      // lampadaire
      const lx = 392; B.vl(lx, 44, 72, "#2a2c33"); B.r(lx - 5, YS - 1, 11, 2, "#2a2c33"); B.mat(Z.ST, on ? 80 : 255, on ? 200 : 0); for (let j = 0; j < 12; j++) B.hl(lx - 5 - (j >> 1), 34 + j, 11 + (j >> 1) * 2, on ? "#ffe6b0" : "#e8dcc0"); B.mat(Z.ST, 255, 0);
      if (on) ctx.L.push({ x: lx, y: 50, r: 96, c: WARM, i: 1.2, down: true, up: 30, haze: 0.4, hr: 26 });
      // table basse, livre, tasse, télécommande
      B.mat(Z.ST, 255, 0); const tx = 296; B.r(tx, 126, 56, 3, "#8a6642"); B.hl(tx, 126, 56, "#a8845a"); B.r(tx + 3, 129, 3, 9, "#5a3d24"); B.r(tx + 50, 129, 3, 9, "#5a3d24"); B.hl(tx + 6, 134, 44, "#5a3d24");
      B.r(tx + 8, 123, 14, 3, "#b3261e"); B.hl(tx + 8, 123, 14, "#d8443a"); B.px(tx + 10, 124, "#e2c06a"); B.r(tx + 9, 121, 12, 2, "#27407a"); B.r(tx + 30, 120, 6, 6, "#ece8df"); B.r(tx + 36, 122, 2, 3, "#ece8df"); ctx.tasse = [tx + 33, 119]; B.r(tx + 42, 124, 8, 2, "#1e1e24");
      // alcôve : le lit, la table de nuit et sa lampe
      const bx = 408; B.r(bx, 76, 72, 36, "#8a6642"); B.hl(bx, 76, 72, "#a8845a"); B.r(bx + 3, 79, 66, 14, "#7a5a3a"); B.r(bx - 2, 96, 76, 20, "#f2efe6"); B.hl(bx - 2, 96, 76, "#ffffff"); for (let i = bx + 6; i < bx + 70; i += 11) B.line(i, 99, i + 4, 113, "#d8d4ca"); B.r(bx - 2, 110, 76, 6, "#c8c0b0"); B.r(bx + 6, 88, 24, 9, "#ffffff"); B.hl(bx + 6, 96, 24, "#d8d4ca"); B.r(bx + 40, 88, 24, 9, "#e6eaf2"); B.hl(bx + 40, 96, 24, "#c8ccd4"); B.r(bx - 2, 116, 76, 2, "#5a3d24");
      const nx = 488; B.r(nx, 96, 18, 20, "#6a4a2c"); B.hl(nx, 96, 18, "#8a6642"); B.px(nx + 9, 104, "#d6b25a"); B.vl(nx + 9, 86, 10, "#c9b26a"); B.mat(Z.ST, on ? 80 : 255, on ? 200 : 0); B.r(nx + 4, 78, 11, 8, on ? "#ffd9a0" : "#e8dcc0"); B.mat(Z.ST, 255, 0); if (on) ctx.L.push({ x: nx + 9, y: 86, r: 50, c: WARM, i: 0.8, haze: 0.2, hr: 16 });
      cadre(B, 430, 36, 28, 22, "abstrait", 13);
      ctx.clock = [396, 14]; ctx.oiseau = [F[0] + 24, 77];
    },
    anim(B, P, t, ctx, dyn, o, m) {
      horloge(B, 262, 22, o.min == null ? 600 : o.min);
      // Timon dort sur le canapé ; il lève la tête quand on approche
      const T = CR.timon, [cx, cy] = ctx.chat;
      if (T) { const pres = m && Math.hypot(m.x - cx, m.y - (cy - 8)) < 34; try { T.render(B, cx, cy, -1, "loaf", { head: { eyes: pres ? "open" : Math.floor(t * 0.13) % 5 === 4 ? "happy" : "closed" }, breath: Math.sin(t * 1.6) }, t, Z.ACT); } catch (e) { /* le chat boude */ } if (!pres && Math.floor(t * 0.4) % 3 === 0) { B.mat(Z.ACT, 255, 60); const u = (t * 0.4) % 1; B.txt("Z", cx - 14 + u * 3, cy - 24 - u * 6, "#f2efe6", 0.6 * (1 - u)); } }
      // le disque tourne, le soir
      if (P.on) { B.mat(Z.ST, 255, 0); const a = t * 3.3; B.px(ctx.disque[0] + Math.cos(a) * 4, ctx.disque[1] + Math.sin(a) * 1.4, "#5a5c66"); const u = (t * 0.6) % 1; B.mat(Z.ST, 255, 80); B.px(66 + u * 8, 78 - u * 10 + Math.sin(u * 9) * 2, "#f2efe6", 0.5 * (1 - u)); B.px(67 + u * 8, 77 - u * 10 + Math.sin(u * 9) * 2, "#f2efe6", 0.5 * (1 - u)); B.px(66 + u * 8, 79 - u * 10 + Math.sin(u * 9) * 2, "#f2efe6", 0.5 * (1 - u)); }
      B.mat(Z.ST, 255, 40); for (let k = 0; k < 4; k++) { const u = (t * 0.5 + k * 0.25) % 1; B.px(ctx.tasse[0] + Math.round(Math.sin(u * 7 + k) * 1.4), ctx.tasse[1] - u * 10, "#ffffff", 0.3 * (1 - u)); }
      etincelles(B, P, t, ctx, o);
    },
  };

  D.LIT.cabinet = { H, make: piece(CAB) };
  D.LIT.domicile = { H, make: piece(DOM) };
})();
