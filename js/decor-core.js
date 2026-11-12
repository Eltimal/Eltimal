/* La Permanence — le bandeau des lieux : moteur commun.
   Panorama sur toute la largeur, dessiné en basse résolution (80 pixels de haut) puis agrandi d'un facteur entier,
   sans lissage, comme l'écran titre et la carte. La largeur logique s'adapte à l'écran : le monument reste au centre,
   la ville se prolonge de chaque côté. Trois ambiances selon l'heure (CR.mapPhase : jour, crépuscule, nuit), pluie
   les jours de pluie, saison des arbres. Couches : ciel (nuages), décor fixe mis en cache, acteurs animés (passants,
   véhicules, drapeaux, enseignes), pluie. Image fixe si l'utilisateur demande moins d'animations.
   Les scènes de chaque lieu sont dans decor-ext.js (extérieurs) et decor-int.js (cabinet, domicile).
   Le code tolère le faux canvas des tests : aucun dégradé, aucune lecture de pixels. */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html } = UI;
  const { useEffect, useRef, useState } = React;
  const D = (CR.dec = { SC: {}, H: 80 });
  const H = D.H;

  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const mod = (a, n) => ((a % n) + n) % n;
  const h01 = (i) => { const r = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return r - Math.floor(r); };
  const pick = (R, a) => a[Math.floor(R() * a.length)];
  const cl255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const hexRGB = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const toHex = (r, g, b) => "#" + ((1 << 24) | (cl255(r) << 16) | (cl255(g) << 8) | cl255(b)).toString(16).slice(1);
  const shade = (hex, a) => { const [r, g, b] = hexRGB(hex); return toHex(r + a, g + a, b + a); };
  D.shade = shade; D.mod = mod; D.h01 = h01; D.pick = pick; D.mk = mk; D.hexRGB = hexRGB; D.toHex = toHex;

  // ---------------------------------------------------------------- teinte selon l'heure et le temps
  // Les scènes sont dessinées en couleurs « plein jour » ; S.c() les teinte pour le crépuscule, la nuit, la pluie.
  const tcache = new Map();
  function tint(c, ph, rain) {
    if (c[0] !== "#") return c;
    const k = c + ph + (rain ? 1 : 0);
    let v = tcache.get(k);
    if (v) return v;
    let [r, g, b] = hexRGB(c);
    if (rain) { const l = r * 0.3 + g * 0.59 + b * 0.11; r = (r * 0.62 + l * 0.38) * 0.92; g = (g * 0.62 + l * 0.38) * 0.93; b = (b * 0.62 + l * 0.38) * 0.95; }
    if (ph === "soir") { r = r * 0.82 + 30; g = g * 0.66 + 10; b = b * 0.74 + 28; }
    else if (ph === "nuit") { r = r * 0.26 + 6; g = g * 0.32 + 10; b = b * 0.5 + 28; }
    v = toHex(r, g, b);
    tcache.set(k, v);
    return v;
  }

  const SKY = {
    jour: ["#4a82c2", "#6699cf", "#82b0dc", "#a0c5e6", "#bfd8ec", "#dbe7ee"],
    jourR: ["#6f7a86", "#808b96", "#939ea8", "#a6b0b8", "#b8c0c6", "#c8ced2"],
    aube: ["#34497f", "#566a9c", "#8a86ad", "#cf8f9a", "#efb394", "#f8d8a4"],
    crep: ["#26295c", "#463b78", "#85497f", "#c96a68", "#ee9168", "#f6bf7c"],
    nuit: ["#040712", "#080e20", "#0e1730", "#152340", "#1c2d52", "#27395f"],
    soirR: ["#3a3a52", "#4c4a62", "#665c70", "#867a82", "#a08c8c", "#b89e94"],
    nuitR: ["#0c1018", "#121722", "#1a202c", "#232a37", "#2c3441", "#363e4b"],
  };
  const CLOUD = {
    jour: ["#ffffff", "#e4edf5", "#c4d2e0"], jourR: ["#a4adb6", "#929ca6", "#808a94"],
    soir: ["#ffd2a8", "#f0a090", "#b66a80"], soirR: ["#a8949a", "#938087", "#7c6a74"],
    nuit: ["#2a3858", "#1e2a46", "#141d36"], nuitR: ["#2a303c", "#212733", "#181d28"],
  };

  // ---------------------------------------------------------------- pinceaux
  function wrap(P, S) {
    const c = (x) => S.c(x);
    // pièces rééclairées (D.relight) : les aplats « e » sont des surfaces lumineuses, les halos deviennent des lumières
    const em = (x, y, w, h, col) => {
      if (!S.emS || typeof col !== "string" || col[0] !== "#") return;
      const m = S._dynOn ? S.emD : S.emS, W = S.W; x = Math.round(x); y = Math.round(y);
      for (let j = Math.max(0, y); j < Math.min(H, y + h); j++) for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) m[j * W + i] = 1;
    };
    return {
      P,
      r: (x, y, w, h, col) => P.r(x, y, w, h, c(col)),
      er: (x, y, w, h, col) => { P.r(x, y, w, h, col); em(x, y, w, h, col); },
      p: (x, y, col) => P.p(Math.round(x), Math.round(y), c(col)),
      ep: (x, y, col) => { P.p(Math.round(x), Math.round(y), col); em(x, y, 1, 1, col); },
      hl: (x, y, w, col) => P.r(x, y, w, 1, c(col)),
      vl: (x, y, h, col) => P.r(x, y, 1, h, c(col)),
      dith: (x, y, w, h, col, m, o) => P.dither(Math.round(x), Math.round(y), Math.round(w), Math.round(h), c(col), m || 2, o || 0),
      circ: (x, y, r, col) => P.circle(Math.round(x), Math.round(y), Math.round(r), c(col)),
      line: (a, b, e, f, col) => P.line(Math.round(a), Math.round(b), Math.round(e), Math.round(f), c(col)),
      eline: (a, b, e, f, col) => P.line(Math.round(a), Math.round(b), Math.round(e), Math.round(f), col),
      txt: (s, x, y, col) => CR.px.text(P, s, Math.round(x), Math.round(y), c(col)),
      etxt: (s, x, y, col) => CR.px.text(P, s, Math.round(x), Math.round(y), col),
      // halo lumineux : cercles translucides empilés
      glow: (x, y, r, rgb, a) => { if (S.emS) { (S._dynOn ? S.litD : S.lits).push({ x, y, r: r * 2.6, c: String(rgb).split(",").map((v) => v / 255), i: Math.min(1.1, a * 2.3), haze: Math.min(0.4, a * 0.8), hr: r }); return; } for (let k = 3; k >= 1; k--) P.circle(Math.round(x), Math.round(y), Math.round(r * k / 3), `rgba(${rgb},${(a * (4 - k) / 6).toFixed(3)})`); },
    };
  }

  D.wrap = wrap;

  // ---------------------------------------------------------------- mise en place d'une scène
  function layout(name, W, o) {
    const min = o.min == null ? 600 : o.min;
    const ph = CR.mapPhase(min);
    const S = { name, W, H, cx: W >> 1, ph, dawn: ph === "soir" && mod(min, 1440) < 720, dark: ph !== "jour", rain: !!o.rain, season: o.season || "automne", o, gy: 50, hy: 50, dyn: [], dynBack: [], dynFront: [], signs: [] };
    S.lit = ph === "nuit" ? 0.5 : ph === "soir" ? 0.3 : S.rain ? 0.1 : 0;
    S.lampOn = ph !== "jour";
    S.c = (h) => tint(h, ph, S.rain);
    S.skyC = mk(W, H); S.fgC = mk(W, H);
    S.PB = CR.px.painter(S.skyC.getContext("2d"));
    S.P = CR.px.painter(S.fgC.getContext("2d"));
    Object.assign(S, wrap(S.P, S));
    S.skyPal = ph === "jour" ? (S.rain ? SKY.jourR : SKY.jour) : ph === "nuit" ? (S.rain ? SKY.nuitR : SKY.nuit) : S.rain ? SKY.soirR : S.dawn ? SKY.aube : SKY.crep;
    S.R = CR.seeded("dec" + name + W);
    S.Y = { far: 55, road2: 61, road: 65, mid: 72, near: H - 1 };
    (D.SC[name] || D.SC.rue)(S);
    D.flushSigns(S);
    D.vignette(S);
    return S;
  }
  D.layout = layout;

  D.vignette = (S) => { if (S.room) return; S.dynFront.push((d) => { const P = d.P; for (let k = 0; k < 6; k++) { const a = (0.34 * (1 - k / 6)).toFixed(3); P.r(k, 0, 1, H, `rgba(4,6,14,${a})`); P.r(S.W - 1 - k, 0, 1, H, `rgba(4,6,14,${a})`); } P.r(0, 0, S.W, 1, "rgba(4,6,14,0.3)"); P.r(0, H - 1, S.W, 1, "rgba(4,6,14,0.25)"); }); };

  // Une image du bandeau, dessinée sur le contexte basse résolution
  D.frame = function (S, ctx, t, o) {
    S.o = o || S.o;
    if (!S.d || S.d.P.ctx !== ctx) S.d = wrap(CR.px.painter(ctx), S);
    ctx.clearRect(0, 0, S.W, H);
    ctx.drawImage(S.skyC, 0, 0);
    S._dynOn = true;
    for (const f of S.dynBack) f(S.d, t);
    ctx.drawImage(S.fgC, 0, 0);
    for (const f of S.dyn) f(S.d, t);
    for (const f of S.dynFront) f(S.d, t);
    S._dynOn = false;
  };

  // ---------------------------------------------------------------- pièces rééclairées par CR.lum
  // L'image de la pièce (aplats, personnages) est relue puis éclairée : pénombre, plafonniers, lampes, celui qui parle.
  D.MOOD = { gav: { k: 0.62, c: [0.74, 0.95, 1], pas: 96 }, parloir: { k: 0.7, c: [0.8, 0.95, 1], pas: 80 }, cabinet_ji: { k: 0.8, c: [1, 0.86, 0.62], pas: 110 }, rdv: { k: 0.8, c: [1, 0.86, 0.62], pas: 110 }, assises: { k: 0.78, c: [1, 0.88, 0.66], pas: 84 } };
  D.relight = function (S, lctx, t, o) {
    const PL = CR.lum;
    if (!PL || !S.emS) return false;
    const W = S.W, n = W * H;
    let d = null; try { d = lctx.getImageData(0, 0, W, H).data; } catch (e) { return false; }
    if (!d || d.length < n * 4) return false;
    const mood = D.MOOD[S.name] || { k: 0.86, c: [1, 0.9, 0.72], pas: 76 };
    if (!S._R) {
      S._R = PL.Renderer(W, H);
      const L = S.lits.slice();
      for (let x = (W >> 1) % mood.pas; x < W; x += mood.pas) L.push({ x, y: -26, r: 118, c: mood.c, i: 0.46, down: true });
      S._R.bake(L);
    }
    const R = S._R, B = R.work, c = B.c, e = B.e, a = S.emS, b = S.emD;
    for (let i = 0, j = 0, q = 0; i < n; i++, j += 3, q += 4) { c[j] = d[q]; c[j + 1] = d[q + 1]; c[j + 2] = d[q + 2]; e[i] = a[i] || b[i] ? 215 : 0; }
    if (!S._lz) { B.l.fill(255); B.z.fill(80); S._lz = 1; }
    const k = mood.k, amb = S.ph === "jour" ? [0.66 * k, 0.66 * k, 0.7 * k] : S.ph === "soir" ? [0.56 * k, 0.48 * k, 0.5 * k] : [0.45 * k, 0.45 * k, 0.54 * k];
    const dyn = S.litD.slice();
    for (const p of S.cast || []) { if (p._hide || p._hx == null) continue; if (p._talk) dyn.push({ x: p._hx, y: p._hy + 8, r: 30, c: [1, 0.94, 0.78], i: 0.62, haze: 0.06, hr: 14 }); else if (p.you && o && o.turn) dyn.push({ x: p._hx, y: p._hy + 8, r: 22, c: [1, 0.82, 0.5], i: 0.34 + 0.08 * Math.sin(t * 3) }); }
    R.frame({ amb, dyn, wet: 0, t, YR: H + 2, YB: H + 2, mist: null, glow: 0.8 });
    b.fill(0); S.litD.length = 0;
    return true;
  };

  // ---------------------------------------------------------------- ciel : dégradé tramé, astres, nuages
  D.sky = function (S, hy, o = {}) {
    S.hy = hy;
    const P = S.PB, pal = S.skyPal, W = S.W;
    for (let y = 0; y < hy; y++) {
      const f = Math.min(5, (y / Math.max(1, hy - 1)) * 5), i = Math.min(4, Math.floor(f)), fr = f - i;
      P.r(0, y, W, 1, pal[fr > 0.5 ? i + 1 : i]);
      if (fr > 0.25 && fr < 0.75) P.dither(0, y, W, 1, pal[fr > 0.5 ? i : i + 1], 2, y);
    }
    P.r(0, hy, W, H - hy, pal[5]);
    const R = CR.seeded("ciel" + S.name + (o.seed || ""));
    const halo = (x, y, r, rgb, a) => { for (let k = 3; k >= 1; k--) P.circle(Math.round(x), Math.round(y), Math.round(r * k / 3), `rgba(${rgb},${(a * (4 - k) / 6).toFixed(3)})`); };
    if (S.ph === "jour" && !S.rain) { const x = S.cx - Math.round(S.W * 0.23), y = 11; halo(x, y, 20, "255,244,200", 0.5); P.circle(x, y, 4, "#fff6cc"); P.circle(x, y, 3, "#fffbe6"); }
    else if (S.ph === "soir" && !S.rain) { const x = S.cx + Math.round(S.W * (S.dawn ? -0.3 : 0.28)), y = hy - 5; halo(x, y, 34, "255,170,100", 0.6); P.circle(x, y, 6, "#ffcf8a"); P.circle(x, y, 5, "#ffe2a8"); }
    else if (S.ph === "nuit") {
      const x = S.cx + Math.round(S.W * 0.2), y = 12;
      if (!S.rain) {
        halo(x, y, 18, "200,215,255", 0.4); P.circle(x, y, 4, "#f3efe0"); P.circle(x + 2, y - 1, 3, pal[1]);
        for (let i = 0; i < Math.round(S.W / 9); i++) { const sx = Math.floor(R() * W), sy = Math.floor(R() * (hy - 16)); P.p(sx, sy, R() < 0.25 ? "#ffffff" : "#aab6d8"); }
      } else halo(x, y, 18, "180,190,220", 0.16);
    }
    if (o.noclouds) return;
    const cc = CLOUD[S.ph + (S.rain ? "R" : "")] || CLOUD.jour;
    const n = S.rain ? 10 : S.ph === "nuit" ? 4 : 6, list = [];
    for (let i = 0; i < n; i++) list.push({ x: R() * (W + 80), y: 2 + R() * Math.max(6, hy - 18), w: 22 + R() * 30, sp: 0.8 + R() * 1.8 });
    S.dynBack.push((d, t) => {
      for (const c of list) {
        const w = Math.round(c.w), x = Math.round(mod(c.x + c.sp * t, W + w * 2) - w), y = Math.round(c.y), P2 = d.P;
        P2.r(x + w * 0.25, y, w * 0.45, 1, cc[0]); P2.r(x + w * 0.1, y + 1, w * 0.8, 1, cc[0]); P2.r(x, y + 2, w, 2, cc[1]); P2.r(x + w * 0.05, y + 4, w * 0.9, 1, cc[2]);
      }
    });
    if (S.ph === "nuit" && !S.rain) {
      const st = []; for (let i = 0; i < 7; i++) st.push([Math.floor(R() * W), Math.floor(R() * (hy - 14))]);
      S.dynBack.push((d, t) => { st.forEach((q, i) => { if (Math.floor(t * 1.6 + i * 1.7) % 4 === 0) d.P.p(q[0], q[1], "#ffffff"); }); });
    }
  };

  // ---------------------------------------------------------------- arbres (feuillage selon la saison)
  D.tree = function (S, x, gy, h, kind) {
    const R = CR.seeded("arbre" + S.name + x), bark = "#5a4634";
    S.r(x - 1, gy - Math.round(h * 0.5), 2, Math.round(h * 0.5), bark);
    S.vl(x, gy - Math.round(h * 0.5), Math.round(h * 0.5), shade(bark, 18));
    const top = gy - Math.round(h * 0.72), rr = Math.max(3, Math.round(h * 0.26));
    if (S.season === "hiver") {
      for (const [dx, dy] of [[-5, -7], [5, -7], [-3, -11], [3, -12], [0, -14]]) { const e = [Math.round(x + dx * h / 22), Math.round(gy - h * 0.5 + dy * h / 22)]; S.line(x, gy - Math.round(h * 0.45), e[0], e[1], bark); }
      S.dith(x - rr, top - rr, rr * 2, rr * 2, bark, 5, 1);
      return;
    }
    const pal = S.season === "automne" ? ["#a8642a", "#cf8a38", "#e6b04c"] : ["#4a7438", "#628c48", "#7ea85c"];
    if (kind === "pin") { for (let k = 0; k < 4; k++) S.r(x - 2 - k, gy - Math.round(h * 0.5) - k * 3 - 2, 5 + k * 2, 3, "#2f5a3a"); return; }
    for (const [dx, dy, r] of [[0, 0, rr], [-rr + 1, 2, rr - 1], [rr - 1, 2, rr - 1], [0, -rr + 2, rr - 1]]) S.circ(x + dx, top + dy, r, pal[0]);
    S.dith(x - rr, top - rr, rr * 2, rr * 2, pal[1], 2, 0);
    S.circ(x - 1, top - 2, Math.max(2, rr - 2), pal[1]); S.dith(x - rr, top - rr, rr, rr, pal[2], 3, 1);
    if (S.season === "automne") for (let i = 0; i < 6; i++) S.p(x - 8 + Math.floor(R() * 16), gy + Math.floor(R() * 3), "#d9902f");
  };

  // ---------------------------------------------------------------- réverbère et flaque de lumière
  D.lamp = function (S, x, gy, h, o = {}) {
    h = h || 18;
    S.r(x - 1, gy - 2, 3, 2, "#1c1d22"); S.r(x, gy - h, 1, h - 2, "#1c1d22");
    S.r(x - 2, gy - h - 3, 5, 3, "#26272d"); S.hl(x - 3, gy - h - 4, 7, "#1c1d22");
    if (S.lampOn) {
      S.er(x - 1, gy - h - 2, 3, 2, "#ffe3a0");
      S.glow(x, gy - h - 1, 13, "255,205,120", 0.55);
      for (let k = 0; k < 5; k++) S.er(x - 3 - k * 2, gy - 1 + k, 7 + k * 4, 1, `rgba(255,205,120,${(0.14 - k * 0.02).toFixed(3)})`);
    } else S.r(x - 1, gy - h - 2, 3, 2, "#4a4b52");
  };

  // ---------------------------------------------------------------- enseignes et inscriptions
  // Chaque enseigne mesure son texte (police 3 × 5 avec accents) et s'adapte à son cadre : une ligne, deux lignes,
  // un abrégé réaliste fourni par le décor (o.alt), puis un abrégé automatique des mots longs. Elle se dessine à la
  // fin de la composition du décor (D.flushSigns), donc toujours devant les arbres et les réverbères.
  const LINE_GAP = 1;
  const linesBox = (lines) => {
    const m = lines.map((t) => CR.px.measure(t));
    return { m, w: Math.max(0, ...m.map((q) => q.w)), h: m.reduce((a, q) => a + q.h, 0) + LINE_GAP * (lines.length - 1) };
  };
  // Coupures possibles en deux lignes (aux espaces et après un trait d'union), de la plus équilibrée à la moins
  const splits2 = (t) => {
    const out = [];
    for (let i = 1; i < t.length - 1; i++) {
      if (t[i] === " ") out.push([t.slice(0, i).trim(), t.slice(i + 1).trim()]);
      else if (t[i - 1] === "-" && t[i] !== " ") out.push([t.slice(0, i), t.slice(i)]);
    }
    return out.filter((p) => p[0] && p[1]).sort((a, b) => Math.max(CR.px.measure(a[0]).w, CR.px.measure(a[1]).w) - Math.max(CR.px.measure(b[0]).w, CR.px.measure(b[1]).w));
  };
  // Abrégé automatique : le mot le plus long perd ses dernières lettres (« COMMISSAIRES » → « COMMISS. »)
  const abbrev = (t) => {
    const out = [];
    let words = t.split(" ");
    for (let k = 0; k < 8; k++) {
      let i = -1, best = 5;
      words.forEach((w, j) => { const n = w.replace(/\.$/, "").length; if (n > best) { best = n; i = j; } });
      if (i < 0) break;
      const base = words[i].replace(/\.$/, "");
      words = words.slice(); words[i] = base.slice(0, Math.max(3, Math.ceil(base.length * 0.6) - 1)).replace(/[-']$/, "") + ".";
      out.push(words.join(" "));
    }
    return out;
  };
  D.fitSign = function (txt, maxW, maxH, o = {}) {
    const px = o.pad == null ? 2 : o.pad, py = o.padY == null ? 1 : o.padY, maxLines = o.lines || 2;
    const fits = (lines) => { const b = linesBox(lines); return b.w + px * 2 <= maxW && b.h + py * 2 <= maxH ? b : null; };
    if (Array.isArray(txt)) {
      // lignes imposées par le décor (ex. nom de l'étude, puis sa profession) ; abrégés fournis, puis automatiques
      const cl = [txt].concat(o.alt || []);
      for (let k = 0; k < cl.length; k++) { const b = fits(cl[k]); if (b) return { lines: cl[k], level: k ? "abrege" : "lignes", b }; }
      const last = cl[cl.length - 1].slice(), ab = last.map((t) => [t].concat(abbrev(t)));
      for (let r = 1; r < 9; r++) { const ls = ab.map((a) => a[Math.min(r, a.length - 1)]); const b = fits(ls); if (b) return { lines: ls, level: "auto", b }; }
      return D.fitSign(last.join(" "), maxW, maxH, Object.assign({}, o, { alt: null }));
    }
    const cands = [String(txt)].concat(o.alt || []);
    const levels = [];
    cands.forEach((t, k) => { levels.push([[t], k ? "abrege" : "ligne"]); if (maxLines > 1) for (const sp of splits2(t).slice(0, 4)) levels.push([sp, k ? "abrege" : "deux"]); });
    for (const [lines, level] of levels) { const b = fits(lines); if (b) return { lines, level, b }; }
    for (const t of abbrev(cands[cands.length - 1])) {
      const b1 = fits([t]); if (b1) return { lines: [t], level: "auto", b: b1 };
      if (maxLines > 1) for (const sp of splits2(t).slice(0, 2)) { const b2 = fits(sp); if (b2) return { lines: sp, level: "auto", b: b2 }; }
    }
    // dernier recours : couper des lettres entières, jamais une lettre à moitié
    let t = cands[cands.length - 1];
    while (t.length > 1 && !fits([t + "."])) t = t.slice(0, -1).trimEnd();
    return { lines: [t + "."], level: "tronque", b: linesBox([t + "."]) };
  };
  D.signLog = null; // tableau pendant les tests : chaque enseigne dessinée y laisse sa mise en page
  // Enseigne : f = cadre disponible { x, y, w, h } ; o.bg, o.fg, o.alt, o.fixed (la plaque prend tout le cadre),
  // o.ax / o.ay (« c », « l », « r » / « c », « t », « b ») pour placer une plaque plus petite que son cadre,
  // o.emit (lumineuse : non teintée la nuit), o.frame (liseré), o.fg2 (couleur de la 2e ligne).
  D.sign = function (S, f, txt, o = {}) {
    const fit = D.fitSign(txt, f.w, f.h, o);
    const px = o.pad == null ? 2 : o.pad, py = o.padY == null ? 1 : o.padY;
    const pw = o.fixed || !o.bg ? f.w : Math.min(f.w, fit.b.w + px * 2), ph = o.fixed || !o.bg ? f.h : Math.min(f.h, fit.b.h + py * 2);
    const x = o.ax === "l" ? f.x : o.ax === "r" ? f.x + f.w - pw : f.x + Math.floor((f.w - pw) / 2);
    const y = o.ay === "t" ? f.y : o.ay === "b" ? f.y + f.h - ph : f.y + Math.floor((f.h - ph) / 2);
    const rec = { scene: S.name, W: S.W, txt: String(txt), lines: fit.lines, level: fit.level, frame: { x: f.x, y: f.y, w: f.w, h: f.h }, plate: { x, y, w: pw, h: ph }, text: { w: fit.b.w, h: fit.b.h } };
    if (D.signLog) D.signLog.push(rec);
    // la nuit, une enseigne reste lisible : éclairée par la rue, elle n'est teintée que comme au crépuscule
    const lit = !o.emit && S.ph === "nuit" && o.lit !== false;
    const LC = (col) => (lit && col && col[0] === "#" ? tint(col, "soir", S.rain) : col);
    const draw = () => {
      if (o.bg) {
        const R = o.emit || lit ? (a, b, c, d, col) => S.er(a, b, c, d, LC(col)) : S.r, L = o.emit || lit ? (a, b, c, col) => S.er(a, b, c, 1, LC(col)) : S.hl;
        R(x, y, pw, ph, o.bg); L(x, y, pw, shade(o.bg, 25)); L(x, y + ph - 1, pw, shade(o.bg, -25));
        if (o.frame) { L(x, y, pw, o.frame); L(x, y + ph - 1, pw, o.frame); R(x, y, 1, ph, o.frame); R(x + pw - 1, y, 1, ph, o.frame); }
      }
      let ty = y + Math.floor((ph - fit.b.h) / 2);
      fit.lines.forEach((ln, i) => {
        const m = fit.b.m[i], tx = x + Math.floor((pw - m.w) / 2), col = i && o.fg2 ? o.fg2 : o.fg || "#f4f3ee";
        ty += m.up;
        if (o.emit || lit) S.etxt(ln, tx, ty, LC(col)); else S.txt(ln, tx, ty, col);
        ty += 5 + m.down + LINE_GAP;
      });
    };
    if (S.signs) S.signs.push(draw); else draw();
    return rec;
  };
  D.flushSigns = (S) => { const l = S.signs || []; S.signs = null; for (const f of l) f(); };
  // Ancienne plaque (x, y, w, h) : la plaque garde sa place, le texte s'y adapte
  D.plate = function (S, x, y, w, h, txt, bg, fg, o = {}) { return D.sign(S, { x, y, w, h }, txt, Object.assign({ bg, fg, fixed: true }, o)); };
  // Drapeaux
  D.flag = function (S, x, y, w, h, kind) {
    S.vl(x, y - 1, h + 7, "#2a2b31"); S.er(x, y - 2, 1, 1, "#d6b25a");
    const cols = kind === "ue" ? ["#27407a", "#27407a", "#27407a"] : ["#27407a", "#f4f3ee", "#c4352c"];
    S.dyn.push((d, t) => {
      for (let i = 0; i < w; i++) {
        const yo = Math.round(Math.sin(t * 2.6 + i * 0.6) * (0.4 + i * 0.1)), c = kind === "ue" ? (i === (w >> 1) ? "#e8c84a" : "#27407a") : cols[Math.min(2, Math.floor(i * 3 / w))];
        d.r(x + 1 + i, y + yo, 1, h, c);
      }
    });
  };

  // ---------------------------------------------------------------- façades
  const STONES = ["#d9ccb0", "#cfc2a5", "#e0d4ba", "#c8bb9e", "#d6c8a8", "#ddd2b8"];
  const AWN = ["#8a2f2f", "#2f4b6e", "#3e5c3a", "#b08a3a", "#5b4a7a", "#c8553d"];
  const WARM = ["#ffe2a0", "#ffd27a", "#ffeab8", "#f6c866"];
  // Immeuble haussmannien : mansarde de zinc, balcons filants aux 2e et dernier étages, boutique en rez-de-chaussée
  D.haus = function (S, x, w, gy, R, o = {}) {
    const fl = o.floors || 4, fh = 7, rez = 8, mans = 8, top = gy - rez - fl * fh - mans;
    const stone = o.stone || pick(R, STONES), hi = shade(stone, 14), lo = shade(stone, -20);
    S.r(x, top + mans, w, gy - top - mans, stone);
    S.vl(x, top + mans, gy - top - mans, hi); S.vl(x + w - 1, top + mans, gy - top - mans, lo);
    S.dith(x + 1, top + mans + 2, w - 2, gy - top - mans - 2, shade(stone, -6), 7, 2);
    for (let k = 0; k < mans; k++) { const ins = k < 2 ? 2 - k : 0; S.r(x + ins, top + k, w - ins * 2, 1, k === 0 ? "#9aa4b4" : "#7c8696"); }
    S.dith(x + 1, top + 2, w - 2, mans - 2, "#6a7486", 2, 0);
    for (let dx = x + 3; dx < x + w - 5; dx += 8) {
      S.r(dx, top + 3, 3, 4, shade(stone, 6)); S.hl(dx, top + 2, 3, "#9aa4b4");
      if (S.lit && R() < S.lit) S.er(dx + 1, top + 4, 1, 3, pick(R, WARM)); else S.r(dx + 1, top + 4, 1, 3, "#7f93a8");
    }
    S.hl(x - 1, top + mans, w + 2, hi); S.hl(x - 1, top + mans + 1, w + 2, lo);
    for (let f = 0; f < fl; f++) {
      const y0 = top + mans + 2 + f * fh;
      for (let wx = x + 2; wx + 3 <= x + w - 2; wx += 6) {
        S.hl(wx - 1, y0, 5, hi);
        if (S.lit && R() < S.lit) { S.er(wx, y0 + 1, 3, 4, pick(R, WARM)); S.vl(wx + 1, y0 + 1, 4, "#c89a4a"); }
        else { S.r(wx, y0 + 1, 3, 4, "#8ea6bf"); S.hl(wx, y0 + 1, 3, "#c8d8e6"); S.vl(wx + 1, y0 + 1, 4, "#566478"); }
        S.hl(wx - 1, y0 + 5, 5, lo);
      }
      if (f === 1 || f === fl - 1) { S.hl(x, y0 + 5, w, "#2a2c33"); S.dith(x, y0 + 4, w, 1, "#2a2c33", 2, 0); }
    }
    const ry = gy - rez;
    S.r(x, ry, w, rez, shade(stone, -10)); S.hl(x, ry, w, lo);
    if (o.rez === "porte") {
      const px = x + (w >> 1) - 3; S.r(px, ry + 1, 7, rez - 1, "#3a2a1e"); S.r(px + 1, ry + 2, 5, rez - 2, "#4f3a28"); S.hl(px, ry, 7, hi); S.p(px + 5, ry + 5, "#d6b25a");
    } else {
      const aw = o.awning || pick(R, AWN);
      S.r(x + 1, ry + 2, w - 2, rez - 2, "#2a2d37");
      if (S.lit > 0.2 || S.rain) S.er(x + 2, ry + 3, w - 4, rez - 4, R() < 0.5 ? "#e8c070" : "#cfe0ea"); else S.r(x + 2, ry + 3, w - 4, rez - 4, "#6e8296");
      S.r(x, ry, w, 2, aw); S.dith(x, ry, w, 2, "#f1ede2", 2, 0); S.hl(x, ry + 2, w, shade(aw, -30));
    }
    if (R() < 0.8) { const cx2 = x + 2 + Math.floor(R() * Math.max(1, w - 8)); S.r(cx2, top - 4, 4, 5, "#a87a5e"); S.hl(cx2, top - 4, 4, "#c4906e"); for (let m = 0; m < 2; m++) S.r(cx2 + m * 2, top - 6, 1, 2, "#d9703a"); }
  };
  // Immeuble moderne (Batignolles, administration) : bandeaux de fenêtres ou grille, toit-terrasse
  D.modern = function (S, x, w, gy, R, o = {}) {
    const fl = o.floors || 4 + Math.floor(R() * 4), fh = o.fh || 5, top = gy - fl * fh - 2;
    const col = o.col || pick(R, ["#e8e2d6", "#d8d2c6", "#c9c0aa", "#e2d8c4", "#bfc6ce", "#d9b9a0", "#aeb9a8"]);
    S.r(x, top, w, gy - top, col); S.vl(x, top, gy - top, shade(col, 16)); S.vl(x + w - 1, top, gy - top, shade(col, -22));
    S.hl(x - 1, top, w + 2, shade(col, -30)); S.dith(x, top - 1, w, 1, "#5f8a4e", 2, 0);
    for (let f = 0; f < fl; f++) {
      const y0 = top + 2 + f * fh;
      if (o.band) {
        const lit = S.lit && R() < S.lit * 1.4;
        if (lit) S.er(x + 2, y0, w - 4, 3, pick(R, WARM)); else S.r(x + 2, y0, w - 4, 3, "#7f98b4");
        S.dith(x + 2, y0, w - 4, 3, "#5d7898", 4, 0); S.hl(x + 2, y0 + 3, w - 4, shade(col, -28));
      } else {
        for (let wx = x + 2; wx + 3 <= x + w - 1; wx += 5) {
          if (S.lit && R() < S.lit) S.er(wx, y0, 3, 3, pick(R, WARM)); else { S.r(wx, y0, 3, 3, "#85a0bd"); S.hl(wx, y0, 3, "#bcd0e2"); }
          if (f % 2 === 1) S.hl(wx - 1, y0 + 3, 5, "#4a4e58");
        }
      }
    }
    if (R() < 0.5) S.r(x + 2 + Math.floor(R() * (w - 6)), top - 3, 3, 3, "#7d838c");
  };
  // Rangée de façades qui s'étend du centre vers les bords (le centre ne change pas avec la largeur)
  D.sides = function (S, gy, gapL, gapR, o = {}) {
    const mk1 = o.fn || ((x, w, R) => D.haus(S, x, w, gy, R, o));
    let cur = S.cx - gapL, i = 0, R;
    while (cur > -30) { R = CR.seeded(S.name + "L" + i++); const w = (o.wmin || 20) + Math.floor(R() * 13), x = cur - w; mk1(x, w, R); cur = x; }
    cur = S.cx + gapR; i = 0;
    while (cur < S.W + 30) { R = CR.seeded(S.name + "R" + i++); const w = (o.wmin || 20) + Math.floor(R() * 13); mk1(cur, w, R); cur += w; }
  };
  // Toits lointains dans la brume
  D.far = function (S, base, o = {}) {
    const R = CR.seeded("far" + S.name + (o.seed || "")), hz = o.hz || 22, col = o.col || "#9aa6ba";
    let x = -6;
    while (x < S.W) {
      const w = 9 + Math.floor(R() * 10), h = 8 + Math.floor(R() * hz);
      S.r(x, base - h, w, h + 2, col); S.hl(x, base - h, w, shade(col, 14));
      if (R() < 0.5) S.r(x + 2, base - h - 2, 2, 2, shade(col, -14));
      if (S.lit && R() < 0.4) S.er(x + 2 + Math.floor(R() * Math.max(1, w - 4)), base - h + 3 + Math.floor(R() * Math.max(1, h - 5)), 1, 1, "#ffd98a");
      x += w;
    }
  };

  // ---------------------------------------------------------------- repères lointains
  D.eiffel = function (S, x, base, h) {
    const col = "#7d7066";
    for (let yy = 0; yy < h; yy++) {
      const f = 1 - yy / h, w = Math.max(1, Math.round(h * 0.2 * Math.pow(f, 2.2) + 0.5)), y = base - yy;
      if (yy < h * 0.13) { S.r(x - w, y, 2, 1, col); S.r(x + w - 1, y, 2, 1, col); } else S.r(x - w, y, w * 2, 1, col);
    }
    S.hl(x - Math.round(h * 0.17), base - Math.round(h * 0.13), Math.round(h * 0.34), shade(col, 20)); S.hl(x - Math.round(h * 0.09), base - Math.round(h * 0.4), Math.round(h * 0.18), shade(col, 20));
    S.vl(x, base - h - 2, 3, col);
    if (S.dark) { S.glow(x, base - Math.round(h * 0.45), Math.round(h * 0.3), "255,190,90", 0.3); S.dyn.push((d, t) => { if (Math.floor(t * 2) % 7 === 0) d.ep(x, base - h - 2, "#ffffff"); }); }
  };
  // La tour du Tribunal de Paris : trois volumes empilés en retrait, verre et dalles blanches
  D.tourT = function (S, x, base, sc) {
    const vols = [[0, 44, 18], [6, 32, 14], [12, 20, 12]];
    let y = base;
    vols.forEach(([dx, w, h], i) => {
      w = Math.round(w * sc); h = Math.round(h * sc); const vx = x + Math.round(dx * sc), top = y - h;
      for (let r = 0; r < h; r++) S.r(vx, top + r, w, 1, r % 3 === 0 ? "#eef2f5" : r % 3 === 1 ? "#7fa6c8" : "#6890b6");
      S.r(vx + w - Math.max(2, Math.round(3 * sc)), top, Math.max(2, Math.round(3 * sc)), h, "#4f6f94");
      for (let q = vx + 3; q < vx + w - 2; q += 4) S.dith(q, top, 1, h, "#9dbbd6", 2, 0);
      if (S.lit) for (let r = 1; r < h; r += 3) { const a = Math.floor(h01(r * 7 + i * 31 + x) * (w - 8)); S.er(vx + 2 + a, top + r, 3 + Math.floor(h01(r + i) * 8), 1, "#ffe0a0"); }
      y = top;
    });
    S.vl(x + Math.round(22 * sc), y - 5, 5, "#c8ccd0");
    if (S.dark) S.dyn.push((d, t) => { if (Math.floor(t * 1.5) % 2 === 0) d.ep(x + Math.round(22 * sc), y - 5, "#ff4a3a"); });
  };

  // ---------------------------------------------------------------- chaussée, trottoirs
  D.street = function (S, o = {}) {
    const gy = S.gy, W = S.W, walk = o.walk || "#b4ac9c", road = o.road || "#5f6068";
    S.r(0, gy, W, 6, walk); S.hl(0, gy + 5, W, "#cfc8b8"); S.dith(0, gy, W, 5, shade(walk, -8), 4, 1);
    S.r(0, gy + 6, W, 11, road); S.dith(0, gy + 6, W, 11, shade(road, -10), 3, 0);
    for (let x = 4; x < W; x += 15) S.r(x, gy + 11, 7, 1, "#d8d6ce");
    if (o.rails) { S.hl(0, gy + 8, W, "#8a8d94"); S.hl(0, gy + 9, W, "#3a3c44"); }
    if (o.cross) { for (let k = 0; k < 7; k++) S.r(o.cross + k * 3, gy + 6, 2, 11, "#d8d6ce"); }
    S.r(0, gy + 17, W, H - gy - 17, o.near || shade(walk, -6)); S.hl(0, gy + 17, W, "#d4cdbd"); S.hl(0, gy + 18, W, shade(walk, -30));
    for (let y = gy + 22; y < H; y += 6) S.hl(0, y, W, shade(walk, -22));
    for (let x = 0; x < W; x += 12) for (let y = gy + 19; y < H; y += 6) S.vl(x + ((y / 6) & 1) * 6, y, 6, shade(walk, -22));
    S.dith(0, gy + 18, W, H - gy - 18, shade(walk, 8), 6, 2);
    if (S.rain) { S.er(0, gy + 6, W, 11, "rgba(150,165,195,0.20)"); S.er(0, gy + 18, W, H - gy - 18, "rgba(150,165,195,0.14)"); for (let x = 3; x < W; x += 17) S.er(x, gy + 8 + ((x * 7) % 8), 6, 1, "rgba(215,225,245,0.35)"); }
  };

  // ---------------------------------------------------------------- passants
  const SKINS = ["#f1caa6", "#e0b088", "#c98f64", "#a8704a", "#7d4e30", "#5a3822"];
  const HAIRS = ["#1b1618", "#33241a", "#5a3a22", "#8a5a30", "#c8a456", "#8f8e8c", "#e8e4dc"];
  const COATS = ["#2f4b6e", "#7a2f2f", "#3e5c3a", "#5b4a7a", "#8a6a2a", "#2e2e33", "#6d7b8a", "#a2553a", "#2f6b6b", "#b08a5a", "#d8d2c4", "#c8553d"];
  const PANTS = ["#23262f", "#2e3a52", "#3a3a40", "#4b4034", "#1c1c22", "#55575f"];
  const UMB = ["#1d1d24", "#2f4b6e", "#7a2f2f", "#3e5c3a", "#c8553d", "#5b4a7a"];
  function mkLook(R, kind, S) {
    const L = { kind, coat: pick(R, COATS), pants: pick(R, PANTS), skin: pick(R, SKINS), hair: pick(R, HAIRS), bag: R() < 0.3, bagC: pick(R, ["#4a2e1a", "#1c1c22", "#a2553a", "#d8d2c4"]), umb: S.rain && R() < 0.85, umbC: pick(R, UMB) };
    if (kind === "avocat") { L.coat = "#15151a"; L.pants = "#15151a"; L.bag = true; L.bagC = "#0b0b0e"; L.rabat = true; }
    else if (kind === "agent") { L.coat = "#1f2f5c"; L.pants = "#1a2340"; L.cap = "#1a2340"; L.bag = false; }
    else if (kind === "gend") { L.coat = "#2a3a62"; L.pants = "#1a2340"; L.cap = "#1f2c4e"; L.bag = false; }
    else if (kind === "blouse") { L.coat = "#ecece8"; L.pants = "#cfd6da"; L.bag = false; }
    else if (kind === "visiteur") { L.bag = true; L.bagC = "#d8d2c4"; }
    else if (kind === "detenu") { L.coat = "#6d7b8a"; }
    return L;
  }
  function walker(d, x, fy, sz, f, dir, L) {
    x = Math.round(x);
    const sw = [0, 1, 0, -1][f & 3];
    if (sz === 0) {
      d.r(x, fy - 3, 1, 3 - (sw > 0 ? 1 : 0), L.pants); d.r(x + 2, fy - 3, 1, 3 - (sw < 0 ? 1 : 0), L.pants);
      d.r(x, fy - 6, 3, 3, L.coat);
      const hx = dir > 0 ? x + 1 : x; d.r(hx, fy - 8, 2, 2, L.skin); d.r(hx, fy - 8, 2, 1, L.cap || L.hair);
      if (L.bag) d.p(dir > 0 ? x - 1 : x + 3, fy - 5, L.bagC);
      if (L.rabat) d.p(hx, fy - 6, "#f4f3ee");
      if (L.umb) { d.r(x - 2, fy - 11, 7, 1, L.umbC); d.r(x - 1, fy - 10, 5, 1, L.umbC); d.p(x + 1, fy - 9, "#222"); }
    } else if (sz === 1) {
      d.r(x + 1 + sw, fy - 4, 1, 4 - (sw > 0 ? 1 : 0), L.pants); d.r(x + 3 - sw, fy - 4, 1, 4 - (sw < 0 ? 1 : 0), L.pants);
      d.r(x, fy - 10, 5, 6, L.coat); d.vl(x + (dir > 0 ? 4 : 0), fy - 10, 5, shade(L.coat, -22));
      d.r(x + 1, fy - 13, 3, 3, L.skin); d.r(x + 1, fy - 13, 3, 1, L.hair); if (L.cap) d.r(x, fy - 14, 5, 2, L.cap);
      if (L.bag) d.r(dir > 0 ? x - 2 : x + 5, fy - 8, 2, 4, L.bagC);
      if (L.rabat) d.r(x + 2, fy - 10, 1, 2, "#f4f3ee");
      if (L.umb) { d.r(x - 3, fy - 17, 11, 1, L.umbC); d.r(x - 2, fy - 16, 9, 1, L.umbC); d.r(x - 1, fy - 15, 7, 1, shade(L.umbC, -25)); d.vl(x + 2, fy - 14, 2, "#222"); }
    } else {
      d.r(x + 1 + sw * 2, fy - 7, 2, 7, L.pants); d.r(x + 4 - sw * 2, fy - 7, 2, 7, L.pants);
      d.r(x + 1 + sw * 2, fy - 1, 2, 1, "#0c0c10"); d.r(x + 4 - sw * 2, fy - 1, 2, 1, "#0c0c10");
      d.r(x, fy - 14, 7, 8, L.coat); d.hl(x, fy - 14, 7, shade(L.coat, 16)); d.vl(x - 1, fy - 13, 6, shade(L.coat, -14)); d.vl(x + 7, fy - 13, 6, shade(L.coat, -14));
      d.r(x + 2, fy - 15, 3, 1, L.skin); d.r(x + 1, fy - 19, 5, 4, L.skin); d.r(x + 1, fy - 19, 5, 2, L.hair); d.p(x + (dir > 0 ? 4 : 2), fy - 17, "#26201c");
      if (L.cap) d.r(x, fy - 20, 7, 2, L.cap);
      if (L.bag) d.r(dir > 0 ? x - 3 : x + 8, fy - 11, 3, 6, L.bagC);
      if (L.rabat) { d.r(x + 3, fy - 14, 1, 3, "#f4f3ee"); d.r(x + 4, fy - 14, 1, 2, "#f4f3ee"); }
      if (L.umb) { d.r(x - 4, fy - 25, 15, 1, L.umbC); d.r(x - 3, fy - 24, 13, 1, L.umbC); d.r(x - 2, fy - 23, 11, 2, shade(L.umbC, -25)); d.vl(x + 3, fy - 21, 3, "#222"); }
    }
  }
  D.walker = walker;
  // Foule qui marche : y = ligne des pieds, sz = taille (0 loin, 1 moyen, 2 proche)
  D.crowd = function (S, o) {
    const R = CR.seeded("foule" + S.name + o.y + (o.seed || "")), n = Math.max(1, Math.round(o.n * S.W / 320)), span = S.W + 40, list = [];
    for (let i = 0; i < n; i++) list.push({ x0: R() * span, dir: R() < 0.5 ? 1 : -1, sp: (o.speed || 8) * (0.7 + R() * 0.6), L: mkLook(R, pick(R, o.kinds || ["civil"]), S), ph: Math.floor(R() * 4) });
    S.dyn.push((d, t) => { for (const q of list) walker(d, mod(q.x0 + q.dir * q.sp * t, span) - 20, o.y, o.sz, Math.floor(t * q.sp * 0.55) + q.ph, q.dir, q.L); });
  };
  // Personnes à l'arrêt (file d'attente, groupes)
  D.queue = function (S, o) {
    const R = CR.seeded("file" + S.name + o.x + o.y);
    for (let i = 0; i < o.n; i++) { const L = mkLook(R, pick(R, o.kinds || ["civil"]), S); walker(S, o.x + i * (o.gap || 7), o.y, o.sz, 0, o.dir || 1, L); }
  };

  // ---------------------------------------------------------------- véhicules
  const VEH = {
    voiture: { w: 20, cab: 1, col: "#8a2f2f" }, taxi: { w: 20, cab: 1, col: "#f2efe6", taxi: 1 }, police: { w: 20, cab: 1, col: "#eef2f6", stripe: "#2a58b8", gyro: 1 },
    bus: { w: 40, h: 12, col: "#2f7a4b", stripe: "#e8e4d4" }, tram: { w: 58, h: 12, col: "#e9edf0", stripe: "#2a8a6a" },
    fourgon: { w: 26, h: 10, col: "#eef0f2", stripe: "#2a58b8", gyro: 1 }, gend: { w: 26, h: 10, col: "#eef0f2", stripe: "#1f3f86", gyro: 1 },
    ambu: { w: 26, h: 10, col: "#f4f4f2", stripe: "#d33a2c", gyro: 1 }, van: { w: 24, h: 10, col: "#c9c3b4" }, moto: { w: 9, cab: 2, col: "#2a2c33" },
  };
  const CAR_COLS = ["#8a2f2f", "#2f4b6e", "#c9c3b4", "#3a3a40", "#e0ddd4", "#3e5c3a", "#b08a3a", "#6d7b8a", "#1c1c22"];
  function veh(d, x, fy, dir, kind, col, dark, t) {
    const K = VEH[kind], w = K.w, c = col || K.col;
    if (K.cab === 2) {
      d.r(x + 1, fy - 2, 2, 2, "#111"); d.r(x + 6, fy - 2, 2, 2, "#111"); d.r(x + 2, fy - 4, 6, 2, c); d.r(x + (dir > 0 ? 6 : 1), fy - 7, 2, 3, "#2a2c33"); d.r(x + (dir > 0 ? 5 : 2), fy - 8, 2, 1, "#c9a27a");
      if (dark) d.er(x + (dir > 0 ? 8 : 0), fy - 4, 1, 1, "#ffe9b0"); return;
    }
    if (K.cab) {
      d.r(x, fy - 5, w, 4, c); d.hl(x + 1, fy - 6, w - 2, shade(c, 18));
      const cx = dir > 0 ? x + 4 : x + w - 15;
      d.r(cx, fy - 8, 11, 3, c); d.hl(cx + 1, fy - 9, 9, shade(c, 12));
      d.r(cx + 1, fy - 8, 4, 2, dark ? "#26324a" : "#9bb4cc"); d.r(cx + 6, fy - 8, 4, 2, dark ? "#26324a" : "#9bb4cc");
      if (K.stripe) { d.r(x, fy - 4, w, 1, K.stripe); }
      if (K.taxi) { d.er(cx + 4, fy - 10, 4, 1, "#ffe08a"); }
      for (const wx of [x + 3, x + w - 7]) { d.r(wx, fy - 3, 4, 3, "#0e0e12"); d.p(wx + 1, fy - 2, "#6a6c74"); }
      if (K.gyro) { d.er(cx + 3, fy - 10, 2, 1, Math.floor(t * 4) % 2 ? "#3a86ff" : "#2a2c33"); d.er(cx + 6, fy - 10, 2, 1, Math.floor(t * 4) % 2 ? "#2a2c33" : "#3a86ff"); }
    } else {
      const h = K.h;
      d.r(x, fy - h + 1, w, h - 3, c); d.hl(x, fy - h + 1, w, shade(c, 20));
      d.r(x + 2, fy - h + 3, w - 4, 3, dark ? "#26324a" : "#9bb4cc"); for (let q = x + 8; q < x + w - 3; q += 8) d.r(q, fy - h + 3, 1, 3, shade(c, -20));
      if (K.stripe) d.r(x, fy - 4, w, 1, K.stripe);
      d.r(dir > 0 ? x + w - 8 : x + 2, fy - h + 3, 4, h - 5, shade(c, -30));
      for (const wx of [x + 4, x + w - 9]) { d.r(wx, fy - 3, 5, 3, "#0e0e12"); d.p(wx + 2, fy - 2, "#6a6c74"); }
      if (K.gyro) { d.er(x + (w >> 1) - 2, fy - h, 2, 1, Math.floor(t * 4) % 2 ? "#3a86ff" : "#2a2c33"); d.er(x + (w >> 1) + 1, fy - h, 2, 1, Math.floor(t * 4) % 2 ? "#2a2c33" : "#3a86ff"); }
    }
    if (dark) {
      const fx = dir > 0 ? x + w - 1 : x, bx = dir > 0 ? x : x + w - 1;
      d.er(fx, fy - 4, 1, 2, "#fff2b8"); d.er(bx, fy - 4, 1, 2, "#e0483a");
      for (let k = 1; k <= 6; k++) d.er(dir > 0 ? fx + k * 2 : fx - k * 2 - 1, fy - 3 - (k >> 2), 2, 2 + (k >> 1), `rgba(255,240,180,${(0.2 - k * 0.025).toFixed(3)})`);
    }
  }
  D.veh = veh;
  // Circulation : deux sens, deux files
  D.traffic = function (S, o) {
    const R = CR.seeded("circ" + S.name + (o.seed || "")), n = Math.max(1, Math.round(o.n * S.W / 320)), kinds = o.kinds || ["voiture", "voiture", "taxi", "van"], list = [];
    const span = S.W + 100;
    for (let i = 0; i < n; i++) { const kind = pick(R, kinds), dir = o.dir || (R() < 0.5 ? 1 : -1); list.push({ x0: R() * span, dir, sp: (o.speed || 24) * (0.8 + R() * 0.5) * (VEH[kind].w > 30 ? 0.7 : 1), kind, col: pick(R, CAR_COLS) }); }
    list.sort((a, b) => a.dir - b.dir);
    S.dyn.push((d, t) => { for (const v of list) { const K = VEH[v.kind], x = mod(v.x0 + v.dir * v.sp * t, span + K.w) - K.w; veh(d, Math.round(x), v.dir > 0 ? S.Y.road : S.Y.road2, v.dir, v.kind, v.col, S.dark, t); } });
  };

  // ---------------------------------------------------------------- pluie
  D.rain = function (S, x0, y0, x1, y1, o = {}) {
    if (!S.rain) return;
    const n = Math.round((x1 - x0) * (y1 - y0) / (o.dens || 380)), w = x1 - x0, h = y1 - y0, hz = o.ground || y1;
    const col = S.dark ? "rgba(170,190,235,0.38)" : "rgba(215,228,246,0.55)", far = S.dark ? "rgba(140,160,210,0.24)" : "rgba(200,214,236,0.34)";
    S.dynFront.push((d, t) => {
      const P = d.P;
      for (let i = 0; i < n; i++) {
        const a = h01(i * 2.17 + 1), b = h01(i * 7.31 + 2), v = 60 + b * 55, x = x0 + mod(a * w + t * v * 0.26, w), y = y0 + mod(b * h + t * v, h), c = b > 0.55 ? col : far;
        P.r(Math.round(x), Math.round(y), 1, 1, c); P.r(Math.round(x - 0.26), Math.round(y - 1), 1, 1, c); if (b > 0.55) P.r(Math.round(x - 0.5), Math.round(y - 2), 1, 1, c);
      }
      if (!o.nosplash) for (let i = 0; i < Math.round(w / 9); i++) {
        const a = h01(i * 3.7 + 9), b = h01(i * 5.1 + 4), ph = mod(t * 2.4 + b * 9, 1);
        if (ph < 0.22) { const sx = Math.round(x0 + a * w), sy = Math.round(hz - 1 - Math.floor(b * (hz - (o.splashTop || 60)))); P.r(sx - 1, sy, 1, 1, far); P.r(sx + 1, sy, 1, 1, far); P.r(sx, sy - 1, 1, 1, col); }
      }
    });
  };

  // ---------------------------------------------------------------- vue par la fenêtre (intérieurs)
  D.view = function (S, x, y, w, h, o = {}) {
    const P = S.P, pal = S.skyPal, hz = y + Math.round(h * 0.68), R = CR.seeded("vue" + S.name + (o.seed || ""));
    for (let j = y; j < hz; j++) {
      const f = Math.min(5, ((j - y) / Math.max(1, hz - y - 1)) * 5), i = Math.min(4, Math.floor(f)), fr = f - i;
      P.r(x, j, w, 1, pal[fr > 0.5 ? i + 1 : i]); if (fr > 0.25 && fr < 0.75) P.dither(x, j, w, 1, pal[fr > 0.5 ? i : i + 1], 2, j);
    }
    if (!S.rain) {
      if (S.ph === "nuit") { P.circle(x + Math.round(w * 0.78), y + 6, 3, "#f3efe0"); P.circle(x + Math.round(w * 0.78) + 2, y + 5, 2, pal[1]); for (let i = 0; i < 9; i++) P.p(x + Math.floor(R() * w), y + Math.floor(R() * (hz - y - 8)), "#aab6d8"); }
      else if (S.ph === "jour") { P.circle(x + Math.round(w * 0.2), y + 7, 3, "#fff6cc"); }
      else P.circle(x + Math.round(w * (S.dawn ? 0.15 : 0.82)), hz - 3, 4, "#ffcf8a");
    }
    for (let k = 0; k < 4; k++) { const cx = x + Math.floor(R() * w), cy = y + 3 + Math.floor(R() * Math.max(2, hz - y - 12)); P.r(cx, cy, 12, 1, S.rain ? "#9aa4ae" : S.ph === "nuit" ? "#27324e" : S.ph === "soir" ? "#f0a090" : "#ffffff"); P.r(cx + 2, cy + 1, 8, 1, S.rain ? "#808a94" : S.ph === "nuit" ? "#1c2640" : S.ph === "soir" ? "#b66a80" : "#e0e9f2"); }
    if (o.eiffel) D.eiffel(S, x + Math.round(w * o.eiffel), hz - 1, Math.round(h * 0.55));
    if (o.tour) D.tourT(S, x + Math.round(w * o.tour), hz - 1, Math.min(0.8, (hz - y - 3) / 44));
    let bx = x - 4;
    while (bx < x + w) {
      const bw = 10 + Math.floor(R() * 10), bh = 5 + Math.floor(R() * 12), top = hz - bh + 3;
      const l = Math.max(bx, x), rr = Math.min(bx + bw, x + w);
      if (rr > l) {
        S.r(l, top + 3, rr - l, y + h - top - 3, "#8d97a8");
        for (let k = 0; k < 4; k++) { const ins = Math.max(0, 3 - k); const a = Math.max(l, bx + ins), b = Math.min(rr, bx + bw - ins); if (b > a) S.r(a, top + k, b - a, 1, k === 0 ? "#b2bac6" : "#6f7a8c"); }
        if (S.lit && R() < 0.7 && rr - l > 4) S.er(l + 2 + Math.floor(R() * Math.max(1, rr - l - 5)), top + 5 + Math.floor(R() * 3), 1, 2, "#ffd98a");
        if (R() < 0.5 && rr - l > 5) { S.r(l + 2, top - 3, 3, 4, "#a87a5e"); S.r(l + 2, top - 4, 1, 1, "#d9703a"); }
      }
      bx += bw;
    }
    S.r(x, hz + 3, w, y + h - hz - 3, "#6f7a8c");
    if (S.rain) S.er(x, y, w, h, "rgba(150,165,195,0.12)");
    D.rain(S, x, y, x + w, y + h, { dens: 130, nosplash: true });
  };

  // ---------------------------------------------------------------- météo et saison du jeu
  D.rainy = (s) => (CR.hash("pluie" + (s.seed || 0) + ":" + s.day) % 100) < 28;
  D.seasonOf = (s) => { const m = CR.ymd(s.day).m; return m === 11 || m === 10 ? "automne" : m >= 4 && m <= 9 ? "ete" : "hiver"; };
  D.PLACE_SCENE = { cabinet: "cabinet", domicile: "domicile", palais: "palais", cite: "cite", ordre: "ordre", commissariat: "commissariat", gendarmerie: "gendarmerie", umj: "umj", spip: "spip", cj: "cj", sante: "sante", fresnes: "fresnes", fleury: "fleury", melun: "melun", poissy: "poissy" };
  D.sceneFor = (s) => {
    if (D.PLACE_SCENE[s.at]) return D.PLACE_SCENE[s.at];
    const pl = CR.placeOf ? CR.placeOf(s, s.at) : null;
    if (pl && pl.scene && D.SC[pl.scene]) return pl.scene;
    return pl && pl.type === "faits" ? "faits" : "rue";
  };
  D.LABEL = {
    cabinet: "Votre cabinet, au 17e arrondissement : bibliothèque de codes, bureau et fenêtre sur les toits des Batignolles",
    domicile: "Votre domicile : le salon, la fenêtre sur les toits de Paris",
    palais: "Le Tribunal de Paris aux Batignolles : la tour de verre, le parvis et les avocats en robe",
    cite: "Le Palais de justice de l'Île de la Cité : la grille dorée, la Sainte-Chapelle et la Conciergerie",
    ordre: "La Maison du barreau, près du Palais, et les boîtes des bouquinistes sur le quai",
    commissariat: "Le commissariat central du 18e arrondissement : l'enseigne bleue, la brasserie voisine, la pharmacie et le Sacré-Cœur au loin",
    gendarmerie: "La brigade de gendarmerie de Montlhéry et sa tour en ruine sur la colline",
    umj: "L'Hôtel-Dieu, qui abrite l'unité médico-judiciaire, et les tours de Notre-Dame",
    spip: "Le service pénitentiaire d'insertion et de probation de Paris et l'arrêt de bus devant l'entrée",
    cj: "L'étude de commissaires de justice Marchal & Rives, dans une rue huppée du 8e",
    sante: "La maison d'arrêt de la Santé : le haut mur, le mirador et la file des visiteurs",
    fresnes: "Le centre pénitentiaire de Fresnes : la porte monumentale, le mur d'enceinte et les pavillons voisins",
    fleury: "La maison d'arrêt de Fleury-Mérogis : les bâtiments de béton, les mâts d'éclairage et le parking",
    melun: "Le centre de détention de Melun, au bord de la Seine",
    poissy: "La maison centrale de Poissy : le mur, les miradors et le fil de rasoir sous un ciel bas",
    faits: "Le lieu des faits, une rue de Paris",
    iml: "L'Institut médico-légal de Paris, place Mazas : la brique au bord du quai et le viaduc du métro",
    scene_crime: "La scène de crime : la rue bouclée, la rubalise, les techniciens en combinaison et les cavaliers numérotés",
    rue: "Une rue de Paris près du tribunal",
  };
  // Vignette d'une pièce du dossier : l'IML pour une autopsie, la scène de crime pour un transport sur les lieux
  D.docScene = (doc) => {
    if (!doc) return null;
    const t = [doc.title || "", ...(Array.isArray(doc.entete) ? doc.entete : [])].join(" ");
    if (/institut médico-légal|autopsie/i.test(t)) return "iml";
    if (/transport|constatations|planche photographique|reconstitution/i.test(t)) return "scene_crime";
    return null;
  };
  D.stageOpts = (s) => ({ min: s.min, rain: D.rainy(s), season: D.seasonOf(s), unread: CR.unreadCount ? CR.unreadCount(s) : 0, ringing: !!s.ring, voicemail: (s.voicemails || []).some((v) => !v.heard), files: CR.activeCases ? CR.activeCases(s).length : 0, nom: (CR.placeOf && CR.placeOf(s, s.at) || {}).nom || "", plaque: (CR.placeOf && CR.placeOf(s, s.at) || {}).plaque || null });

  // ---------------------------------------------------------------- composant
  // Dessin en basse résolution (80 pixels de haut), agrandi d'un facteur entier de pixels d'écran : pixels nets, réguliers.
  // La largeur logique couvre toute la largeur disponible ; le surplus est rogné à égalité de chaque côté.
  // Coins de visée autour d'un objet cliquable du décor, et une flèche qui sautille au-dessus
  D.hotMark = function (ctx, h, t) {
    const P = CR.px.painter(ctx), c = Math.floor(t * 3) % 2 ? "#f6c96d" : "#e2a43b", k = "#1d1406";
    const x0 = h.x - 2, y0 = h.y - 2, x1 = h.x + h.w + 1, y1 = h.y + h.h + 1;
    for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { P.r(Math.min(x, x + dx * 3), y, 4, 1, c); P.r(x, Math.min(y, y + dy * 3), 1, 4, c); }
    const ax = Math.round(h.x + h.w / 2), ay = Math.max(4, h.y - 4) - (Math.floor(t * 3) % 2);
    P.r(ax - 2, ay - 2, 5, 1, k); P.r(ax - 2, ay - 3, 5, 1, c); P.r(ax - 1, ay - 2, 3, 1, c); P.p(ax, ay - 1, c); P.p(ax, ay, k);
  };

  UI.Panorama = ({ name, opts, label, className, onHot, fill }) => {
    const ref = useRef(null), optsRef = useRef(opts), api = useRef({}), hotRef = useRef(onHot), hovRef = useRef(null);
    const [hot, setHot] = useState([]);
    optsRef.current = opts; hotRef.current = onHot;
    useEffect(() => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      let S = null, key = "", K = 0, W = 0, low = null, lctx = null, raf = 0, alive = true, last = 0, lastT = 40;
      const t0 = performance.now() - 40000;
      const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      // Décor éclairé (CR.dec.LIT) : 150 pixels de haut, lumière calculée à chaque image, la souris est transmise à la scène
      const lit = D.LIT && D.LIT[name];
      if (lit) {
        let inst = null, hkL = ""; const mouse = { v: null };
        const fitL = () => {
          // fill : le décor sert de fond plein cadre, à l'échelle des plans de la refonte (225 rangées pour la hauteur de l'écran)
          const o = optsRef.current || {}, dpr = fill ? 1 : window.devicePixelRatio || 1;
          const host = c.parentElement && c.parentElement.classList.contains("pano-wrap") ? c.parentElement.parentElement : c.parentElement;
          const cw = (host && host.clientWidth) || (window.innerWidth || 960), vh = window.innerHeight || 800;
          const k = fill ? Math.max(2, Math.round(vh / 225)) : Math.max(1, Math.round((cw < 640 ? 170 : vh >= 1150 ? 450 : 300) * dpr / lit.H)), w = Math.ceil(cw * dpr / k);
          const ph = CR.mapPhase(o.min == null ? 600 : o.min), kk = [ph, o.rain ? "p" : "s", o.season || "", o.nom || "", o.plaque || "", name === "cite" ? Math.floor((o.min || 0) / 5) : ""].join("|");
          if (k !== K || w !== W || !inst) { K = k; W = w; inst = lit.make(w); c.width = inst.W * K; c.height = lit.H * K; c.style.width = (inst.W * K / dpr) + "px"; c.style.height = (lit.H * K / dpr) + "px"; key = ""; }
          if (kk !== key) { key = kk; inst.set(ph, !!o.rain, o); }
          inst.opts = o; inst.hover = hotRef.current ? hovRef.current : null;
          if (inst.hot && hotRef.current) { const boxes = inst.hot.map((h) => ({ id: h.id, label: h.label, l: h.x * K / dpr, t: h.y * K / dpr, w: h.w * K / dpr, h: h.h * K / dpr })), bk = JSON.stringify(boxes); if (bk !== hkL) { hkL = bk; setHot(boxes); } }
        };
        const paintL = (t) => { fitL(); lastT = t; inst.frame(t, mouse.v); inst.present(ctx, c.width, c.height); };
        const loopL = (now) => { if (!alive) return; if (now - last > 66) { last = now; try { paintL((now - t0) / 1000); } catch (e) { console.error(e); alive = false; return; } } raf = requestAnimationFrame(loopL); };
        const onMove = (e) => { const r = c.getBoundingClientRect(); if (r.width) mouse.v = { x: (e.clientX - r.left) / r.width * inst.W, y: (e.clientY - r.top) / r.height * lit.H }; };
        const onOut = () => { mouse.v = null; };
        try { paintL(40); } catch (e) { console.error(e); return; }
        api.current.paint = () => paintL(40);
        const onResizeL = () => { try { paintL(lastT); } catch (e) { /* rien */ } };
        window.addEventListener("resize", onResizeL); c.addEventListener("mousemove", onMove); c.addEventListener("mouseleave", onOut);
        if (!reduce) raf = requestAnimationFrame(loopL);
        return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", onResizeL); c.removeEventListener("mousemove", onMove); c.removeEventListener("mouseleave", onOut); api.current.paint = null; };
      }
      const fit = () => {
        const o = optsRef.current || {}, dpr = window.devicePixelRatio || 1;
        const host = c.parentElement && c.parentElement.classList.contains("pano-wrap") ? c.parentElement.parentElement : c.parentElement;
        const cw = (host && host.clientWidth) || (window.innerWidth || 960);
        const k = Math.max(1, Math.round((cw < 640 ? 168 : 232) * dpr / H)), w = Math.max(160, Math.ceil(cw * dpr / k));
        const ph = CR.mapPhase(o.min == null ? 600 : o.min), kk = [name, w, ph, ph === "soir" && o.min % 1440 < 720 ? "a" : "c", o.rain ? "p" : "s", o.season, name === "faits" ? o.nom : ""].join("|");
        if (k !== K || w !== W) { K = k; W = w; c.width = W * K; c.height = H * K; c.style.width = (W * K / dpr) + "px"; c.style.height = (H * K / dpr) + "px"; low = mk(W, H); lctx = low.getContext("2d"); key = ""; }
        if (kk !== key) { key = kk; S = layout(name, W, o); hk = ""; }
        // objets cliquables du décor (positions en pixels d'écran)
        const boxes = (S.hot || []).filter((h) => h.x + h.w > 0 && h.x < W).map((h) => ({ id: h.id, label: h.label, l: h.x * K / dpr, t: h.y * K / dpr, w: h.w * K / dpr, h: h.h * K / dpr }));
        const bk = JSON.stringify(boxes);
        if (bk !== hk) { hk = bk; setHot(boxes); }
      };
      let hk = "";
      const paint = (t) => {
        fit(); lastT = t; D.frame(S, lctx, t, optsRef.current || {});
        if (hovRef.current && hotRef.current && S.hot) { const h = S.hot.find((q) => q.id === hovRef.current); if (h) D.hotMark(lctx, h, t); }
        ctx.imageSmoothingEnabled = false; ctx.drawImage(low, 0, 0, W * K, H * K);
      };
      const loop = (now) => {
        if (!alive) return;
        if (now - last > 66) { last = now; try { paint((now - t0) / 1000); } catch (e) { console.error(e); alive = false; return; } }
        raf = requestAnimationFrame(loop);
      };
      try { paint(40); } catch (e) { console.error(e); return; }
      api.current.paint = () => paint(40);
      const onResize = () => { try { paint(lastT); } catch (e) { /* rien */ } };
      window.addEventListener("resize", onResize);
      if (!reduce) raf = requestAnimationFrame(loop);
      return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); api.current.paint = null; };
    }, [name]);
    // mouvement réduit : image fixe, redessinée quand l'état change
    useEffect(() => { if (api.current.paint && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) try { api.current.paint(); } catch (e) { /* rien */ } }, [JSON.stringify(opts || {})]);
    const hov = (id) => { hovRef.current = id; if (api.current.paint && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) try { api.current.paint(); } catch (e) { /* rien */ } };
    const canvas = html`<canvas ref=${ref} width="480" height=${H * 3} className=${UI.cx("pano", className)} role="img" aria-label=${label || D.LABEL[name] || ""}></canvas>`;
    if (!onHot) return canvas;
    return html`<div className="pano-wrap">${canvas}${hot.map((h) => html`<button key=${h.id} type="button" className="pano-hot" style=${{ left: h.l + "px", top: h.t + "px", width: h.w + "px", height: h.h + "px" }} aria-label=${h.label}
      onMouseEnter=${() => hov(h.id)} onMouseLeave=${() => hov(null)} onFocus=${() => hov(h.id)} onBlur=${() => hov(null)} onClick=${() => hotRef.current && hotRef.current(h.id)}><span className="pano-tip">${h.label}</span></button>`)}</div>`;
  };
})();
