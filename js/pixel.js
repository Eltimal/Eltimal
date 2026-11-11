/* La Permanence — pixel art procédural : portraits, décors, carte de Paris */
(function () {
  const CR = (window.CR = window.CR || {});
  const PX = (CR.px = {});

  const SKIN = [
    ["#f7d7b8", "#e2b48f", "#c98f6b"], ["#ecbd96", "#d29a72", "#b37650"], ["#d9a273", "#bd8457", "#9b6541"],
    ["#b98257", "#9c6640", "#7c4c2d"], ["#8f5e3c", "#744828", "#57341b"], ["#65412a", "#4f301d", "#3a2213"],
  ];
  const HAIR = { black: ["#1e1b1c", "#3a3436"], dkbrown: ["#3c271a", "#5a3b26"], brown: ["#6b4329", "#8a5a38"], auburn: ["#8e3d1f", "#b2552c"], blonde: ["#d7b45f", "#efd38c"], gray: ["#8f8e8c", "#b5b3af"], white: ["#dcdad4", "#f4f2ec"] };
  const SHIRTS = ["#2f4b6e", "#7a2f2f", "#3e5c3a", "#5b4a7a", "#8a6a2a", "#2e2e33", "#6d7b8a", "#a2553a", "#2f6b6b", "#b08a5a"];

  function mk(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function P(ctx) {
    return {
      ctx,
      r(x, y, w, h, c) { if (!c) return; ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
      p(x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); },
      dither(x, y, w, h, c, mod = 2, off = 0) { ctx.fillStyle = c; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j + off) % mod === 0) ctx.fillRect(x + i, y + j, 1, 1); },
      hline(x, y, w, c) { this.r(x, y, w, 1, c); },
      vline(x, y, h, c) { this.r(x, y, 1, h, c); },
      circle(cx, cy, rad, c) { ctx.fillStyle = c; for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad + rad * 0.6) ctx.fillRect(cx + x, cy + y, 1, 1); },
      ring(cx, cy, rad, c) { ctx.fillStyle = c; for (let a = 0; a < 360; a += 4) { const t = a * Math.PI / 180; ctx.fillRect(Math.round(cx + Math.cos(t) * rad), Math.round(cy + Math.sin(t) * rad), 1, 1); } },
      line(x0, y0, x1, y1, c) { ctx.fillStyle = c; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0); const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy; for (let i = 0; i < 400; i++) { ctx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } } },
    };
  }
  PX.mk = mk;

  // ---------------------------------------------------------------- tiny font (3x5)
  const FONT = {
    A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011",
    H: "101101111101101", I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101",
    O: "010101101101010", P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101111",
    V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010", Z: "111001010100111", " ": "000000000000000",
    "0": "111101101101111", "1": "010110010010111", "2": "110001010100111", "3": "110001010001110", "4": "101101111001001", "5": "111100110001110", "6": "011100111101111", "7": "111001010010010", "8": "111101111101111", "9": "111101111001110", ".": "000000000000010", ",": "000000000010100", "&": "010101010101011", "-": "000000111000000",
    ":": "000010000010000", "/": "001001010100100", "!": "010010010000010", "?": "110001010000010", "(": "010100100100010", ")": "010001001001010", "+": "000010111010000", "°": "010101010000000", "«": "000000000000000", "»": "000000000000000",
  };
  // Signes diacritiques posés sur la lettre de base (décomposition NFD) : deux rangées au-dessus de la capitale
  // (aigu, grave, circonflexe, tréma) ou deux rangées en dessous (cédille). Décalages [x, y] dans la cellule 3 × 5.
  const MARKS = { "́": [[1, -1], [2, -2]], "̀": [[1, -1], [0, -2]], "̂": [[0, -1], [1, -2], [2, -1]], "̈": [[0, -1], [2, -1]], "̧": [[1, 5], [0, 6]] };
  // Glyphes étroits (avance propre) : l'apostrophe
  const NARROW = { "'": { px: [[0, 0], [0, 1]], adv: 2 } };
  const LIG = { "Œ": "OE", "Æ": "AE", "ß": "SS" };
  // Découpe une chaîne en cellules { base, marks } ; l'apostrophe typographique devient droite
  PX.cells = function (str) {
    const out = [];
    let s = String(str == null ? "" : str).replace(/[’‘ʼ`´]/g, "'").replace(/[«»"“”]/g, "").replace(/ | /g, " ").toUpperCase();
    s = s.replace(/[ŒÆß]/g, (m) => LIG[m]).normalize("NFD");
    for (const ch of s) {
      if (MARKS[ch] || /[̀-ͯ]/.test(ch)) { if (out.length && MARKS[ch]) out[out.length - 1].marks.push(ch); continue; }
      out.push({ base: ch, marks: [] });
    }
    return out;
  };
  const advOf = (c) => (NARROW[c.base] ? NARROW[c.base].adv : 4);
  // Mesure d'un texte : largeur en pixels, rangées utilisées au-dessus (accents) et au-dessous (cédille)
  PX.measure = function (str) {
    const cs = PX.cells(str);
    let w = 0, up = 0, down = 0;
    for (const c of cs) { w += advOf(c); for (const m of c.marks) { if (m === "̧") down = 2; else up = 2; } }
    return { w: Math.max(0, w - 1), up, down, h: 5 + up + down, n: cs.length };
  };
  PX.hasGlyph = (ch) => !!(FONT[ch] || NARROW[ch]);
  PX.text = function (p, str, x, y, c) {
    let cx = x;
    for (const cell of PX.cells(str)) {
      const nw = NARROW[cell.base];
      if (nw) { for (const [dx, dy] of nw.px) p.p(cx + dx, y + dy, c); cx += nw.adv; continue; }
      const g = FONT[cell.base] || FONT[" "];
      for (let i = 0; i < 15; i++) if (g[i] === "1") p.p(cx + (i % 3), y + Math.floor(i / 3), c);
      for (const m of cell.marks) for (const [dx, dy] of MARKS[m] || []) p.p(cx + dx, y + dy, c);
      cx += 4;
    }
    return cx - x - 1;
  };

  // ---------------------------------------------------------------- looks
  const STYLES_M = ["short", "buzz", "side", "bald", "receding", "curly", "afro", "short", "side"];
  const STYLES_F = ["long", "bun", "bob", "ponytail", "curly", "afro", "braids", "long", "hijab"];
  PX.lookFrom = function (seed, o = {}) {
    const rnd = CR.seeded("look" + seed);
    const g = o.g || (rnd() < 0.5 ? "m" : "f");
    const age = o.age || 40;
    const skin = o.skin != null ? o.skin : Math.floor(rnd() * 6);
    let hc = o.hc || (age > 62 ? (rnd() < 0.5 ? "gray" : "white") : age > 50 && rnd() < 0.4 ? "gray" : ["black", "dkbrown", "brown", "black", skin < 2 ? "blonde" : "dkbrown", skin < 2 ? "auburn" : "black"][Math.floor(rnd() * 6)]);
    const hair = o.hair || (g === "m" ? STYLES_M : STYLES_F)[Math.floor(rnd() * 9)];
    return Object.assign({
      g, age, skin, hc, hair,
      glasses: rnd() < (age > 50 ? 0.45 : 0.2) ? 1 : 0,
      beard: g === "m" && rnd() < 0.3 ? (rnd() < 0.5 ? 1 : 2) : 0,
      shirt: SHIRTS[Math.floor(rnd() * SHIRTS.length)],
      outfit: "shirt",
      earring: g === "f" && rnd() < 0.4,
      bg: null,
    }, o);
  };

  // ---------------------------------------------------------------- portrait 32x32
  const pcache = new Map();
  PX.portrait = function (look, expr = "neutral", blink = false) {
    const key = JSON.stringify(look) + expr + blink;
    if (pcache.has(key)) return pcache.get(key);
    const c = mk(32, 32);
    const p = P(c.getContext("2d"));
    const sk = SKIN[look.skin] || SKIN[1];
    const hc = HAIR[look.hc] || HAIR.black;
    // background
    p.r(0, 0, 32, 32, look.bg || "#3a3029");
    p.dither(0, 0, 32, 32, "rgba(255,255,255,0.05)", 2);
    // shoulders / outfit
    const out = look.outfit || "shirt";
    const body = out === "robe" ? "#16161a" : out === "suit" ? (look.suit || "#2a2d36") : out === "uniform" ? "#2d4f86" : out === "scrubs" ? "#3d8c8a" : out === "apron" ? "#e8e1d4" : look.shirt;
    for (let y = 24; y < 32; y++) { const w = 9 + (y - 24); p.r(16 - w, y, w * 2, 1, body); }
    p.r(13, 21, 6, 4, sk[1]);
    p.r(13, 21, 6, 1, sk[2]);
    if (out === "suit") {
      p.r(14, 24, 4, 8, "#e9e6df");
      p.r(15, 25, 2, 7, look.tie || "#8a2a2a");
      p.line(13, 24, 15, 31, "#1b1d24"); p.line(18, 24, 16, 31, "#1b1d24");
    } else if (out === "robe") {
      p.r(13, 24, 6, 2, "#e9e6df");
      p.r(14, 26, 4, 1, "#d8d4ca");
    } else if (out === "uniform") {
      p.r(14, 24, 4, 3, "#c9d3e3"); p.p(10, 27, "#e2b645"); p.p(11, 27, "#e2b645");
    } else if (out === "apron") {
      p.r(10, 26, 12, 6, "#f4f0e8"); p.r(8, 24, 3, 8, look.shirt); p.r(21, 24, 3, 8, look.shirt);
    } else if (out === "hoodie") {
      p.r(12, 24, 8, 2, shade(look.shirt, -20));
    } else {
      p.r(14, 24, 4, 2, shade(body, 25));
    }
    // head mask
    const head = [];
    for (let y = 6; y <= 22; y++) {
      const t = (y - 13.5) / 8.6;
      let w = 6.9 * Math.sqrt(Math.max(0, 1 - t * t));
      if (y > 15) w *= 1 - 0.11 * (y - 15) / 7;
      head.push([y, Math.round(16 - w), Math.round(16 + w)]);
    }
    // ears
    p.r(8, 13, 2, 3, sk[1]); p.r(22, 13, 2, 3, sk[1]);
    for (const [y, a, b] of head) p.r(a, y, b - a, 1, sk[0]);
    for (const [y, a, b] of head) { p.p(a, y, sk[1]); if (y > 15) p.p(b - 1, y, sk[1]); }
    // age lines
    if (look.age > 55) { p.p(11, 17, sk[1]); p.p(20, 17, sk[1]); p.hline(13, 9, 6, sk[1]); }
    // eyes
    const ey = 13;
    if (blink) { p.hline(11, ey, 3, sk[2]); p.hline(18, ey, 3, sk[2]); }
    else {
      p.r(11, ey, 3, 2, "#f4f1ea"); p.r(18, ey, 3, 2, "#f4f1ea");
      p.r(12, ey, 2, 2, "#2a1f1a"); p.r(18, ey, 2, 2, "#2a1f1a");
      p.p(12, ey, "#6a5040"); p.p(18, ey, "#6a5040");
    }
    // brows
    const browY = expr === "angry" ? 12 : 11;
    if (expr === "worried") { p.p(11, 12, hc[0]); p.hline(12, 11, 2, hc[0]); p.hline(18, 11, 2, hc[0]); p.p(20, 12, hc[0]); }
    else if (expr === "angry") { p.hline(11, 11, 2, hc[0]); p.p(13, 12, hc[0]); p.p(18, 12, hc[0]); p.hline(19, 11, 2, hc[0]); }
    else { p.hline(11, browY, 3, hc[0]); p.hline(18, browY, 3, hc[0]); }
    // nose
    p.p(16, 15, sk[1]); p.p(16, 16, sk[1]); p.p(15, 17, sk[2]);
    // mouth
    const my = 19;
    if (expr === "smile") { p.p(13, my - 1, "#7a3b33"); p.hline(14, my, 4, "#7a3b33"); p.p(18, my - 1, "#7a3b33"); }
    else if (expr === "worried") { p.hline(14, my, 4, "#7a3b33"); p.p(13, my + 1, "#7a3b33"); p.p(18, my + 1, "#7a3b33"); }
    else if (expr === "angry") { p.hline(13, my, 6, "#5e2a24"); }
    else if (expr === "talk") { p.r(14, my, 4, 2, "#5e2a24"); }
    else p.hline(14, my, 4, "#7a3b33");
    // beard
    if (look.beard === 1) { for (const [y, a, b] of head) if (y >= 17) p.r(a + 1, y, b - a - 2, 1, hc[0]); p.r(14, my, 4, 1, "#7a3b33"); }
    if (look.beard === 2) { p.hline(13, my - 1, 6, hc[0]); }
    // hair
    drawHair(p, look, hc, head);
    // glasses
    if (look.glasses) { const gc = "#1b1b1f"; p.r(10, ey - 1, 5, 1, gc); p.r(17, ey - 1, 5, 1, gc); p.r(10, ey + 2, 5, 1, gc); p.r(17, ey + 2, 5, 1, gc); p.vline(10, ey - 1, 4, gc); p.vline(14, ey - 1, 4, gc); p.vline(17, ey - 1, 4, gc); p.vline(21, ey - 1, 4, gc); p.hline(15, ey, 2, gc); }
    if (look.earring) { p.p(8, 16, "#e2c35a"); p.p(23, 16, "#e2c35a"); }
    pcache.set(key, c);
    return c;
  };
  function drawHair(p, look, hc, head) {
    const [d, l] = hc;
    const st = look.hair;
    if (st === "bald") { p.p(9, 12, d); p.p(22, 12, d); p.p(9, 13, d); p.p(22, 13, d); return; }
    if (st === "hijab") {
      const hj = look.scarf || "#5b3a5e";
      for (let y = 4; y <= 23; y++) { const t = (y - 13.5) / 10; const w = Math.round(9.5 * Math.sqrt(Math.max(0, 1 - t * t))); p.r(16 - w, y, w * 2, 1, hj); }
      for (const [y, a, b] of head) if (y >= 9 && y <= 21) p.r(a + 1, y, b - a - 2, 1, null);
      // re-draw face over hijab
      const sk = SKIN[look.skin];
      for (const [y, a, b] of head) if (y >= 9 && y <= 21) p.r(a + 1, y, b - a - 2, 1, sk[0]);
      p.r(11, 13, 3, 2, "#f4f1ea"); p.r(18, 13, 3, 2, "#f4f1ea"); p.r(12, 13, 2, 2, "#2a1f1a"); p.r(18, 13, 2, 2, "#2a1f1a");
      p.hline(11, 11, 3, "#2a1f1a"); p.hline(18, 11, 3, "#2a1f1a"); p.p(16, 15, sk[1]); p.p(16, 16, sk[1]); p.hline(14, 19, 4, "#7a3b33");
      p.r(9, 24, 14, 3, hj);
      return;
    }
    // top cap of hair
    const top = st === "buzz" ? 7 : st === "receding" ? 8 : 5;
    for (let y = top; y <= 10; y++) {
      const row = head.find((r) => r[0] === Math.max(6, y));
      if (!row) continue;
      let [, a, b] = row;
      const ext = st === "afro" ? 3 : st === "curly" ? 1 : 0;
      p.r(a - ext, y, b - a + ext * 2, 1, d);
    }
    if (st === "afro") { for (let y = 2; y < 13; y++) { const t = (y - 9) / 8; const w = Math.round(11 * Math.sqrt(Math.max(0, 1 - t * t))); p.r(16 - w, y, w * 2, 1, d); } p.dither(7, 3, 18, 8, l, 3); }
    if (st === "curly") { p.dither(9, 5, 14, 5, l, 2); p.r(8, 9, 2, 5, d); p.r(22, 9, 2, 5, d); }
    if (st === "side" || st === "short" || st === "receding") { p.hline(11, 7, 9, l); p.r(9, 9, 1, 4, d); p.r(22, 9, 1, 4, d); }
    if (st === "side") { p.r(17, 6, 5, 2, d); p.p(16, 7, l); }
    if (st === "buzz") { p.dither(10, 7, 12, 3, l, 2); }
    if (st === "receding") { p.r(14, 8, 4, 1, SKIN[look.skin][0]); }
    if (st === "long" || st === "braids") { p.r(8, 8, 3, 17, d); p.r(21, 8, 3, 17, d); p.r(10, 8, 1, 6, d); p.r(21, 8, 1, 6, d); if (st === "braids") { for (let y = 10; y < 25; y += 2) { p.p(9, y, l); p.p(22, y, l); } } else { p.vline(9, 10, 12, l); } }
    if (st === "bob") { p.r(8, 8, 3, 10, d); p.r(21, 8, 3, 10, d); p.hline(9, 17, 3, d); p.hline(20, 17, 3, d); }
    if (st === "bun") { p.r(13, 2, 6, 4, d); p.hline(14, 3, 3, l); p.r(9, 9, 1, 4, d); p.r(22, 9, 1, 4, d); }
    if (st === "ponytail") { p.r(22, 9, 3, 9, d); p.r(9, 9, 1, 4, d); p.r(22, 9, 1, 4, d); p.vline(23, 10, 7, l); }
    if (st === "cap") { p.r(9, 5, 14, 4, look.capColor || "#2b4a7a"); p.r(7, 8, 9, 1, look.capColor || "#2b4a7a"); }
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }
  PX.shade = shade;

  PX.painter = P;
  // (la petite police dessine désormais accents, cédille et apostrophe : plus de conversion sans accent)

  // ---------------------------------------------------------------- lumière selon l'heure
  PX.sky = function (min) {
    const h = ((min / 60) % 24 + 24) % 24;
    if (h < 6.5) return { top: "#0b1022", bot: "#1a2444", night: true };
    if (h < 8.5) return { top: "#4d6b9c", bot: "#e9b08f", night: false };
    if (h < 16.5) return { top: "#7fa6cf", bot: "#cfe0ee", night: false };
    if (h < 18) return { top: "#5a77a8", bot: "#f0c38a", night: false };
    if (h < 19.5) return { top: "#323766", bot: "#d9775e", night: false, dusk: true };
    return { top: "#0b1022", bot: "#1d2848", night: true };
  };
  PX.lightLevel = (min) => { const h = ((min / 60) % 24 + 24) % 24; return h < 7 ? 0.35 : h < 17.5 ? 1 : h < 19.5 ? 0.8 : 0.45; };

  // Toits de Paris : zinc, cheminées et mitrons orange
  function toits(p, x, y, w, h, sky, seed) {
    for (let j = 0; j < h; j++) p.r(x, y + j, w, 1, j < h * 0.55 ? sky.top : sky.bot);
    if (sky.night) { const r = CR.seeded("etoiles" + seed); for (let i = 0; i < 10; i++) p.p(x + Math.floor(r() * w), y + Math.floor(r() * h * 0.4), "#e8e6cf"); }
    const r = CR.seeded("toits" + seed);
    let bx = x - 4;
    while (bx < x + w) {
      const bw = 14 + Math.floor(r() * 14);
      const top = y + Math.floor(h * (0.38 + r() * 0.22));
      const zinc = sky.night ? "#2b3346" : "#7c8696";
      const pierre = sky.night ? "#3a3529" : "#d9cbb0";
      // façade
      p.r(bx, top + 7, bw, y + h - top - 7, pierre);
      for (let wy = top + 10; wy < y + h - 2; wy += 5) for (let wx = bx + 2; wx < bx + bw - 2; wx += 4) p.r(wx, wy, 2, 3, sky.night ? (r() < 0.4 ? "#f0cf7a" : "#1d2232") : "#8ea2b8");
      // toit mansardé en zinc
      for (let k = 0; k < 7; k++) p.r(bx + Math.max(0, 3 - k), top + k, bw - Math.max(0, 3 - k) * 2, 1, k === 0 ? (sky.night ? "#3b4458" : "#9aa4b2") : zinc);
      for (let lx = bx + 3; lx < bx + bw - 3; lx += 6) p.r(lx, top + 2, 2, 3, sky.night ? "#e2c171" : "#c7d4e2");
      // souches de cheminée et mitrons
      if (r() < 0.8) { const cx = bx + 2 + Math.floor(r() * (bw - 6)); p.r(cx, top - 4, 5, 5, sky.night ? "#4a3a30" : "#a87a5e"); for (let m = 0; m < 3; m++) p.r(cx + m * 2, top - 6, 1, 2, sky.night ? "#7a4a2a" : "#d9703a"); }
      bx += bw;
    }
  }
  PX.toits = toits;

  PX.W = 256; PX.H = 96;
  PX.drawScene = function (canvas, name, o = {}) {
    const ctx = canvas.getContext("2d");
    const p = P(ctx);
    const min = o.min != null ? o.min : 600;
    const sky = PX.sky(min);
    const t = o.t || 0;
    ctx.clearRect(0, 0, 256, 96);
    const fn = SCENES[name] || SCENES.cabinet;
    fn(p, sky, min, t, o);
    const L = PX.lightLevel(min);
    if (L < 1 && !["salle", "assises", "commissariat", "parloir", "greffe", "cabinet_ji"].includes(name)) { ctx.fillStyle = `rgba(8,12,30,${(1 - L) * 0.42})`; ctx.fillRect(0, 0, 256, 96); }
  };
  function portraitAt(p, look, expr, blink, sx, sy, sw, sh, dx, dy, dw, dh, bg) {
    if (!look) return;
    const img = PX.portrait(Object.assign({}, look, { bg: bg || look.bg || "#3a3029" }), expr || "neutral", blink);
    p.ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  const SCENES = {};

  // ---------------------------------------------------------------- Le cabinet
  SCENES.cabinet = function (p, sky, min, t, o) {
    const soir = min >= 19 * 60 || min < 7 * 60;
    p.r(0, 0, 256, 96, "#4a5163"); p.dither(0, 0, 256, 60, "#525a6d", 2);
    p.r(0, 54, 256, 10, "#383d4b"); p.hline(0, 54, 256, "#2a2e3a");
    // bibliothèque : codes rouges et bleus
    p.r(6, 6, 60, 50, "#2a2016"); p.r(8, 8, 56, 46, "#17110b");
    const r = CR.seeded("codes");
    for (let row = 0; row < 4; row++) {
      let bx = 9; const by = 9 + row * 11;
      while (bx < 62) {
        const red = r() < 0.55;
        const bw = 2 + Math.floor(r() * 2), bh = 8 + Math.floor(r() * 2);
        const col = red ? (r() < 0.5 ? "#b3261e" : "#9e1f19") : r() < 0.6 ? "#27407a" : r() < 0.5 ? "#d9cfb8" : "#3d5a3a";
        p.r(bx, by + (10 - bh), bw, bh, col); if (red) p.p(bx, by + (10 - bh) + 2, "#e2c06a");
        bx += bw + (r() < 0.08 ? 2 : 0);
      }
      p.r(8, by + 10, 56, 1, "#2a2016");
    }
    // portemanteau et robe d'avocat
    p.vline(78, 10, 46, "#2a2016"); p.r(74, 9, 9, 2, "#2a2016");
    p.r(73, 13, 11, 26, "#0e0e12"); p.r(76, 13, 5, 3, "#f4f3ee"); p.r(77, 16, 3, 4, "#f4f3ee"); p.vline(78, 20, 18, "#1c1c22");
    // horloge
    const cx = 104, cy = 22;
    p.circle(cx, cy, 8, "#2a2016"); p.circle(cx, cy, 7, "#f0ede4");
    const hh = (min / 60) % 12, mm = min % 60;
    const ha = hh / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2;
    p.line(cx, cy, Math.round(cx + Math.sin(ha) * 3), Math.round(cy - Math.cos(ha) * 3), "#16110c");
    p.line(cx, cy, Math.round(cx + Math.sin(ma) * 5), Math.round(cy - Math.cos(ma) * 5), "#16110c");
    p.p(cx, cy, "#b3261e");
    // fenêtre sur les toits
    p.r(140, 5, 108, 50, "#1d2230");
    toits(p, 143, 8, 102, 44, sky, 9);
    p.r(194, 8, 2, 44, "#1d2230"); p.r(143, 29, 102, 2, "#1d2230");
    // balcon en fer forgé
    for (let x = 143; x < 245; x += 4) { p.vline(x, 46, 6, "#14171f"); p.p(x + 2, 48, "#14171f"); }
    p.hline(143, 46, 102, "#14171f");
    // bureau
    p.r(0, 64, 256, 32, "#2f2419"); p.r(0, 64, 256, 2, "#4b3a28"); p.dither(0, 66, 256, 30, "#2a1f15", 3);
    // ordinateur portable
    p.r(98, 50, 40, 22, "#1a1c22"); p.r(100, 52, 36, 17, soir ? "#2b4566" : "#345882");
    p.hline(103, 55, 22, "#d4e1ef"); p.hline(103, 58, 28, "#9fb6cf"); p.hline(103, 61, 18, "#9fb6cf");
    if (o.unread) { p.r(126, 54, 7, 5, "#d64b3c"); PX.text(p, String(Math.min(9, o.unread)), 128, 54, "#fff"); }
    p.r(94, 72, 48, 3, "#2a2c33");
    // téléphone portable
    const ring = o.ringing && Math.floor(t * 4) % 2 === 0;
    p.r(152, 70, 9, 15, "#15161b"); p.r(153, 71, 7, 12, ring ? "#7fd0ff" : o.voicemail ? "#e8b23a" : "#2b3140");
    if (ring) { p.p(149, 72, "#7fd0ff"); p.p(163, 72, "#7fd0ff"); p.p(148, 75, "#7fd0ff"); p.p(164, 75, "#7fd0ff"); }
    // dossiers (chemises roses et bleues)
    const nFiles = Math.min(8, o.files || 0);
    for (let i = 0; i < nFiles; i++) { p.r(18 + i, 80 - i * 2, 42, 3, i % 2 ? "#d99aa8" : "#9ab4d9"); p.hline(18 + i, 80 - i * 2, 42, i % 2 ? "#ecbcc6" : "#bfd1ea"); }
    // carnet Seyès
    p.r(182, 73, 30, 20, "#fbfbf6"); for (let y = 75; y < 93; y += 2) p.hline(183, y, 28, y % 8 === 3 ? "#9a8fd0" : "#d2cdee"); p.vline(188, 73, 20, "#d46a5a");
    // café
    p.r(226, 72, 8, 9, "#ece8df"); p.r(234, 74, 2, 4, "#ece8df"); p.r(227, 73, 6, 2, "#3e2414");
    if (Math.floor(t * 3) % 3 !== 0) { p.p(229, 68 - (Math.floor(t * 3) % 2), "rgba(255,255,255,0.5)"); p.p(231, 66 + (Math.floor(t * 3) % 2), "rgba(255,255,255,0.4)"); }
    // lampe de bureau
    p.r(222, 50, 3, 20, "#202226"); p.r(214, 44, 16, 7, "#2b4a3a"); p.r(218, 68, 10, 3, "#202226");
    if (soir) { p.ctx.fillStyle = "rgba(255,206,130,0.18)"; p.ctx.beginPath(); p.ctx.moveTo(214, 51); p.ctx.lineTo(230, 51); p.ctx.lineTo(250, 96); p.ctx.lineTo(190, 96); p.ctx.fill(); }
    if (o.client) portraitAt(p, o.client, o.clientExpr, Math.floor(t * 2) % 13 === 0, 2, 0, 28, 28, 112, 26, 26, 26, "#4a5163");
  };
  SCENES.conference = (p, sky, min, t, o) => SCENES.cabinet(p, sky, min, t, o);

  // ---------------------------------------------------------------- Chez soi, la nuit
  SCENES.domicile = function (p, sky, min, t, o) {
    p.r(0, 0, 256, 96, "#1c2033"); p.dither(0, 0, 256, 70, "#20253a", 2);
    p.r(150, 8, 74, 46, "#10131f"); toits(p, 153, 11, 68, 40, PX.sky(min), 23); p.r(186, 11, 2, 40, "#10131f");
    p.r(0, 70, 256, 26, "#211a1a"); p.dither(0, 70, 256, 26, "#2a2020", 2);
    p.r(14, 56, 110, 22, "#d8d2c4"); p.r(14, 52, 28, 8, "#ebe6da"); p.r(10, 48, 6, 30, "#3a2a22"); p.r(40, 60, 84, 16, "#47536e");
    p.r(130, 62, 18, 14, "#3a2a22");
    const ring = o.ringing && Math.floor(t * 4) % 2 === 0;
    p.r(134, 58, 9, 5, "#15161b"); p.r(135, 59, 7, 3, ring ? "#7fd0ff" : "#2b3140");
    if (ring) { p.ctx.fillStyle = "rgba(127,208,255,0.12)"; p.ctx.fillRect(110, 36, 60, 40); }
  };

  // ---------------------------------------------------------------- La rue, la tour du tribunal
  SCENES.rue = function (p, sky, min, t, o) {
    for (let j = 0; j < 70; j++) p.r(0, j, 256, 1, j < 38 ? sky.top : sky.bot);
    if (sky.night) { const r = CR.seeded("ciel"); for (let i = 0; i < 18; i++) p.p(Math.floor(r() * 256), Math.floor(r() * 30), "#e8e6cf"); }
    // la tour du tribunal (trois blocs empilés, en retrait)
    const verre = sky.night ? "#1f2c44" : "#9fb9d4", acier = sky.night ? "#0f1626" : "#e9eef3";
    p.r(170, 8, 26, 20, verre); p.r(166, 26, 34, 18, verre); p.r(160, 42, 46, 28, verre);
    for (const [x, y, w] of [[170, 8, 26], [166, 26, 34], [160, 42, 46]]) { p.hline(x, y, w, acier); for (let k = y + 3; k < y + 18; k += 3) p.hline(x, k, w, sky.night ? "#2d3d5c" : "#c7d6e5"); }
    if (sky.night) { const r = CR.seeded("bureaux"); for (let i = 0; i < 26; i++) p.r(161 + Math.floor(r() * 44), 10 + Math.floor(r() * 58), 2, 1, "#f0d88a"); }
    p.r(178, 2, 1, 6, acier);
    // immeubles haussmanniens
    const pierre = sky.night ? "#4a4436" : "#ddd0b4";
    p.r(0, 24, 120, 50, pierre); p.r(214, 30, 42, 44, pierre);
    for (let y = 30; y < 70; y += 9) { p.hline(0, y + 6, 120, sky.night ? "#1b1d26" : "#2d2f38"); for (let x = 4; x < 118; x += 10) { p.r(x, y, 5, 6, sky.night ? (CR.seeded("f" + x + y)() < 0.45 ? "#f0cf7a" : "#232838") : "#8aa0b6"); } }
    for (let x = 0; x < 120; x += 2) p.p(x, 37, sky.night ? "#16181f" : "#3a3c44");
    p.r(0, 20, 120, 5, sky.night ? "#2b3346" : "#7c8696");
    // colonne Morris et bouche de métro
    p.r(132, 44, 10, 28, "#2f4a37"); p.r(130, 42, 14, 3, "#2f4a37"); p.r(133, 48, 8, 18, "#e6dcc4"); p.hline(134, 52, 6, "#b3261e"); p.hline(134, 57, 6, "#27407a");
    p.r(222, 60, 2, 12, "#2f5a3a"); p.r(244, 60, 2, 12, "#2f5a3a"); p.r(222, 56, 24, 3, "#2f5a3a"); PX.text(p, "METRO", 225, 51, sky.night ? "#e2c171" : "#2f5a3a");
    // réverbères
    for (const lx of [150, 210]) { p.vline(lx, 46, 26, "#1a1c22"); p.r(lx - 2, 43, 5, 4, sky.night ? "#f6d27a" : "#3a3d45"); if (sky.night) { p.ctx.fillStyle = "rgba(246,210,122,0.14)"; p.ctx.beginPath(); p.ctx.moveTo(lx - 2, 47); p.ctx.lineTo(lx + 3, 47); p.ctx.lineTo(lx + 14, 74); p.ctx.lineTo(lx - 13, 74); p.ctx.fill(); } }
    // chaussée
    p.r(0, 72, 256, 24, "#3a3c44"); p.r(0, 72, 256, 2, "#8b8d93"); for (let x = 6; x < 256; x += 18) p.r(x, 84, 9, 1, "#cfcfd2");
    // piétons : un avocat en robe sous le bras
    p.r(96, 62, 4, 10, "#1a1a1f"); p.r(96, 58, 4, 4, "#d9a273"); p.r(100, 64, 5, 3, "#0e0e12");
  };
  SCENES.tribunal = (p, sky, min, t, o) => SCENES.rue(p, sky, min, t, o);

  // ---------------------------------------------------------------- Salle d'audience (Batignolles : bois clair)
  SCENES.salle = function (p, sky, min, t, o) {
    const ancienne = o.ancienne;
    p.r(0, 0, 256, 96, ancienne ? "#3c2618" : "#c9b48f");
    if (ancienne) { for (let x = 0; x < 256; x += 16) { p.r(x, 0, 15, 58, "#4a2f1d"); p.vline(x + 15, 0, 58, "#2d1b10"); } p.r(0, 0, 256, 5, "#2d1b10"); p.r(70, 1, 116, 6, "#2d1b10"); PX.text(p, "RÉPUBLIQUE FRANÇAISE", 90, 3, "#d6b25a"); }
    else { for (let x = 0; x < 256; x += 8) p.vline(x, 0, 58, "#bda983"); p.r(0, 0, 256, 4, "#a6936e"); }
    // Marianne / devise
    if (!ancienne) { p.r(110, 6, 36, 10, "#e8e2d4"); p.r(112, 8, 4, 6, "#27407a"); p.r(116, 8, 4, 6, "#f4f3ee"); p.r(120, 8, 4, 6, "#b3261e"); PX.text(p, "RF", 128, 9, "#2a2c33"); }
    // estrade du tribunal
    p.r(60, 34, 136, 26, ancienne ? "#2d1b10" : "#9c8560"); p.r(60, 34, 136, 3, ancienne ? "#6a4428" : "#b9a37b");
    const juges = o.juges || (o.judge ? [o.judge] : []);
    const pos = juges.length === 3 ? [86, 114, 142] : juges.length === 1 ? [114] : juges.map((_, i) => 74 + i * 22);
    juges.forEach((j, i) => { if (j) portraitAt(p, Object.assign({ outfit: "robe" }, j), i === (juges.length === 3 ? 1 : 0) ? o.judgeExpr : "neutral", Math.floor(t * 2 + i) % 17 === 0, 0, 0, 32, 26, pos[i], 10, 28, 23, ancienne ? "#3c2618" : "#c9b48f"); p.r(pos[i], 32, 28, 3, "#16161a"); });
    // parquet (à gauche du tribunal, pour le public)
    p.r(14, 30, 36, 30, ancienne ? "#2d1b10" : "#9c8560"); p.r(14, 30, 36, 2, ancienne ? "#6a4428" : "#b9a37b");
    if (o.parquet) portraitAt(p, Object.assign({ outfit: "robe" }, o.parquet), "neutral", Math.floor(t * 2) % 19 === 0, 0, 0, 32, 26, 18, 9, 26, 21, ancienne ? "#3c2618" : "#c9b48f");
    // greffier
    p.r(204, 38, 36, 22, ancienne ? "#2d1b10" : "#9c8560"); if (o.greffier) portraitAt(p, o.greffier, "neutral", false, 0, 0, 32, 26, 210, 22, 20, 16, ancienne ? "#3c2618" : "#c9b48f");
    // box vitré des prévenus (comparution immédiate)
    if (o.box) { p.r(214, 60, 36, 24, "rgba(170,200,220,0.25)"); p.r(214, 60, 36, 1, "#dfe8ee"); p.vline(214, 60, 24, "#dfe8ee"); if (o.client) portraitAt(p, o.client, o.clientExpr, false, 2, 0, 28, 28, 220, 58, 22, 22, "#9fb2c0"); }
    // jurés (assises)
    if (o.jures) { for (let i = 0; i < o.jures; i++) { const jl = o.jureLooks && o.jureLooks[i]; const x = 202 + (i % 3) * 17, y = 6 + Math.floor(i / 3) * 14; if (jl) portraitAt(p, jl, "neutral", Math.floor(t * 3 + i) % 23 === 0, 6, 4, 20, 22, x, y, 14, 15, ancienne ? "#3c2618" : "#c9b48f"); } }
    // sol et barre
    p.r(0, 60, 256, 36, ancienne ? "#2a1a10" : "#7a6a52"); p.dither(0, 60, 256, 36, ancienne ? "#33221a" : "#837259", 2);
    p.r(118, 70, 20, 4, ancienne ? "#6a4428" : "#b9a37b"); p.r(126, 74, 4, 18, ancienne ? "#4a2f1d" : "#9c8560");
    p.r(20, 78, 80, 6, ancienne ? "#5a3a26" : "#a68f69"); p.r(160, 78, 50, 6, ancienne ? "#5a3a26" : "#a68f69");
    if (o.client && !o.box) portraitAt(p, o.client, o.clientExpr, Math.floor(t * 2) % 11 === 0, 2, 0, 28, 28, 112, 46, 30, 30, ancienne ? "#2a1a10" : "#7a6a52");
  };
  SCENES.assises = (p, sky, min, t, o) => SCENES.salle(p, sky, min, t, Object.assign({ ancienne: true }, o));

  // ---------------------------------------------------------------- Commissariat : bureau d'audition
  SCENES.commissariat = function (p, sky, min, t, o) {
    p.r(0, 0, 256, 96, "#9aa2a6"); p.dither(0, 0, 256, 62, "#a3abaf", 2);
    p.r(0, 2, 256, 3, "#e8f0f4"); for (let x = 20; x < 256; x += 60) { p.r(x, 4, 30, 2, "#f7fbff"); }
    p.r(0, 58, 256, 4, "#6e767a");
    // porte avec hublot
    p.r(12, 14, 34, 48, "#556066"); p.r(22, 20, 14, 10, "#2a3338"); p.r(23, 21, 12, 8, "#4c6a7a"); p.r(40, 38, 3, 4, "#c9cfd2");
    // tableau d'affichage, droits affichés
    p.r(64, 10, 46, 30, "#e7e2d2"); p.hline(68, 15, 30, "#6b6b6b"); p.hline(68, 19, 36, "#9a9a9a"); p.hline(68, 23, 34, "#9a9a9a"); p.hline(68, 27, 28, "#9a9a9a"); PX.text(p, "DROITS", 70, 31, "#27407a");
    // bureau, ordinateur
    p.r(120, 52, 120, 10, "#5b5f63"); p.r(150, 34, 32, 20, "#202226"); p.r(152, 36, 28, 15, "#3a5d7d"); p.hline(154, 39, 20, "#d5e3f0"); p.hline(154, 42, 16, "#9fbad4");
    if (o.opj) portraitAt(p, o.opj, o.opjExpr || "neutral", Math.floor(t * 2) % 15 === 0, 0, 0, 32, 30, 196, 24, 30, 28, "#9aa2a6");
    // sol
    p.r(0, 62, 256, 34, "#5d6266"); p.dither(0, 62, 256, 34, "#666b6f", 2);
    if (o.client) portraitAt(p, o.client, o.clientExpr, Math.floor(t * 2) % 13 === 0, 2, 0, 28, 28, 100, 46, 30, 30, "#5d6266");
    // néon qui grésille
    if (Math.floor(t * 7) % 23 === 0) { p.ctx.fillStyle = "rgba(255,255,255,0.08)"; p.ctx.fillRect(0, 0, 256, 96); }
  };

  // ---------------------------------------------------------------- Cabinet du juge d'instruction
  SCENES.cabinet_ji = function (p, sky, min, t, o) {
    p.r(0, 0, 256, 96, "#d6d1c4"); p.dither(0, 0, 256, 60, "#cdc8ba", 2);
    p.r(160, 6, 84, 44, "#9fa7ae"); toits(p, 162, 8, 80, 40, sky, 31); p.r(201, 8, 2, 40, "#9fa7ae");
    // armoire de dossiers (chemises roses)
    p.r(10, 10, 60, 50, "#8a7d68"); for (let y = 14; y < 58; y += 9) for (let x = 13; x < 68; x += 6) p.r(x, y, 5, 7, CR.seeded("ch" + x + y)() < 0.6 ? "#e6a7b4" : "#b8c9e6");
    // bureau du juge et poste du greffier
    p.r(80, 54, 90, 10, "#6b5a45"); p.r(184, 58, 56, 8, "#6b5a45"); p.r(196, 44, 24, 15, "#202226"); p.r(198, 46, 20, 11, "#3a5d7d");
    if (o.judge) portraitAt(p, Object.assign({}, o.judge), o.judgeExpr, Math.floor(t * 2) % 17 === 0, 0, 0, 32, 30, 112, 24, 30, 28, "#d6d1c4");
    if (o.greffier) portraitAt(p, o.greffier, "neutral", false, 0, 0, 32, 30, 222, 34, 20, 19, "#d6d1c4");
    p.r(0, 64, 256, 32, "#8b8478"); p.dither(0, 64, 256, 32, "#938c80", 2);
    if (o.client) portraitAt(p, o.client, o.clientExpr, false, 2, 0, 28, 28, 60, 52, 28, 28, "#8b8478");
  };

  // ---------------------------------------------------------------- Parloir avocat
  SCENES.parloir = function (p, sky, min, t, o) {
    p.r(0, 0, 256, 96, "#b7b39d"); p.dither(0, 0, 256, 96, "#aca893", 3);
    p.r(0, 0, 256, 4, "#8a8673");
    p.r(26, 12, 40, 30, "#6f7769"); for (let x = 28; x < 66; x += 5) p.vline(x, 12, 30, "#3a3e36"); for (let y = 14; y < 42; y += 6) p.hline(26, y, 40, "#3a3e36");
    p.r(196, 10, 36, 56, "#2f5a3a"); p.r(206, 18, 16, 10, "#1d2a22"); p.r(226, 40, 3, 5, "#c9cfd2");
    p.r(70, 62, 116, 8, "#7a6a52"); p.r(80, 70, 4, 22, "#5a4a36"); p.r(172, 70, 4, 22, "#5a4a36");
    if (o.client) portraitAt(p, o.client, o.clientExpr, Math.floor(t * 2) % 13 === 0, 2, 0, 28, 28, 114, 30, 30, 30, "#b7b39d");
    p.r(0, 88, 256, 8, "#6b685c");
  };

  // ---------------------------------------------------------------- Greffe
  SCENES.greffe = function (p, sky, min, t, o) {
    p.r(0, 0, 256, 96, "#d9dde0"); p.dither(0, 0, 256, 60, "#d1d5d8", 2);
    p.r(40, 6, 176, 12, "#27407a"); PX.text(p, o.label || "GREFFE CORRECTIONNEL", 128 - ((o.label || "GREFFE CORRECTIONNEL").length * 2), 10, "#f4f3ee");
    p.r(20, 44, 216, 20, "#9c8560"); p.r(20, 44, 216, 3, "#b9a37b");
    for (let x = 30; x < 230; x += 52) { p.r(x, 22, 40, 22, "rgba(190,215,230,0.55)"); p.r(x, 22, 40, 1, "#eef4f7"); }
    if (o.greffier) portraitAt(p, o.greffier, "neutral", Math.floor(t * 2) % 15 === 0, 0, 0, 32, 26, 92, 20, 26, 22, "#d9dde0");
    p.r(200, 24, 26, 12, "#111"); PX.text(p, String(o.ticket || 47), 205, 28, "#ff6b4a");
    p.r(0, 64, 256, 32, "#b8bcbf"); p.dither(0, 64, 256, 32, "#c0c4c7", 2);
  };

  // ---------------------------------------------------------------- Île de la Cité (extérieur)
  SCENES.cite = function (p, sky, min, t, o) {
    for (let j = 0; j < 66; j++) p.r(0, j, 256, 1, j < 34 ? sky.top : sky.bot);
    const pierre = sky.night ? "#4d4638" : "#d8ccb0";
    p.r(30, 22, 196, 46, pierre);
    for (let x = 44; x < 220; x += 18) { p.r(x, 30, 6, 30, sky.night ? "#2a2c36" : "#b9ad92"); }
    p.r(26, 18, 204, 6, sky.night ? "#2b3346" : "#6f7b8c");
    p.r(118, 6, 20, 14, pierre); p.r(126, 0, 4, 8, sky.night ? "#2b3346" : "#6f7b8c");
    // grille dorée
    p.r(0, 60, 256, 4, "#1d1d22"); for (let x = 2; x < 256; x += 4) { p.vline(x, 54, 10, "#1d1d22"); p.p(x, 53, "#d6b25a"); }
    p.r(112, 50, 32, 14, "#1d1d22"); p.hline(112, 50, 32, "#d6b25a");
    p.r(0, 64, 256, 32, "#4b4d55"); for (let x = 0; x < 256; x += 8) p.r(x, 64 + ((x / 8) % 2) * 3, 7, 2, "#5a5c64");
  };

  // ---------------------------------------------------------------- Maison du barreau
  SCENES.ordre = function (p, sky, min, t, o) {
    p.r(0, 0, 256, 96, "#e6e0d2"); p.dither(0, 0, 256, 62, "#ddd6c6", 2);
    for (let x = 18; x < 240; x += 44) { p.r(x, 8, 22, 50, "#cfc6b2"); p.r(x + 2, 10, 18, 40, "#b8c9d9"); }
    p.r(90, 14, 76, 20, "#2a2c33"); PX.text(p, "ORDRE DES AVOCATS", 94, 20, "#e2c171"); PX.text(p, "PERMANENCES", 104, 27, "#f4f3ee");
    p.r(60, 54, 136, 10, "#7a6a52"); if (o.greffier) portraitAt(p, o.greffier, "neutral", false, 0, 0, 32, 26, 116, 30, 26, 22, "#e6e0d2");
    p.r(0, 64, 256, 32, "#9a8d74"); for (let x = 0; x < 256; x += 16) for (let y = 64; y < 96; y += 16) p.r(x + ((y / 16) % 2) * 8, y, 8, 8, "#a99c82");
  };

  // ---------------------------------------------------------------- La carte de Paris (320 x 200)
  PX.drawMap = function (canvas, o = {}) {
    const ctx = canvas.getContext("2d");
    const p = P(ctx);
    const W = 320, H = 200;
    ctx.clearRect(0, 0, W, H);
    p.r(0, 0, W, H, "#18202b");
    const r = CR.seeded("banlieue");
    for (let i = 0; i < 420; i++) p.p(Math.floor(r() * W), Math.floor(r() * H), "#222c3a");
    // routes vers les établissements lointains
    const cx = 160, cy = 92;
    const map = (x, y) => [Math.round(x * W), Math.round(y * H * 0.92)];
    for (const id of ["fleury", "melun", "poissy", "fresnes", "gendarmerie"]) { const pl = CR.PLACES[id]; const [x, y] = map(pl.x, pl.y); p.line(cx, cy, Math.min(W - 1, x), Math.min(H - 1, y), "#2c3a4c"); }
    // bois de Boulogne et de Vincennes
    p.circle(70, 98, 13, "#1f3a2a"); p.dither(58, 86, 26, 26, "#27482f", 2);
    p.circle(262, 112, 14, "#1f3a2a"); p.dither(250, 100, 26, 26, "#27482f", 2);
    // Paris intra-muros
    for (let y = -64; y <= 64; y++) for (let x = -92; x <= 92; x++) { if ((x * x) / (92 * 92) + (y * y) / (64 * 64) <= 1) p.p(cx + x, cy + y, ((x + y) & 3) === 0 ? "#2a3446" : "#263042"); }
    // périphérique
    for (let a = 0; a < 360; a += 1) { const tt = a * Math.PI / 180; p.p(Math.round(cx + Math.cos(tt) * 93), Math.round(cy + Math.sin(tt) * 65), "#56627a"); }
    // la Seine
    const pts = [[300, 70], [262, 96], [222, 104], [190, 100], [172, 99], [150, 92], [126, 76], [104, 74], [86, 90], [80, 120], [58, 136], [20, 120]];
    for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; p.line(x0, y0, x1, y1, "#3c6a96"); p.line(x0, y0 + 1, x1, y1 + 1, "#3c6a96"); p.line(x0, y0 + 2, x1, y1 + 2, "#2f5880"); }
    // Île de la Cité
    p.r(168, 97, 8, 3, "#8fa3b9");
    // quartiers
    PX.text(p, "PARIS", 146, 42, "#3d4a60");
    PX.text(p, "SEINE", 228, 112, "#3c6a96");
    if (o.night) { ctx.fillStyle = "rgba(5,8,20,0.35)"; ctx.fillRect(0, 0, W, H); }
  };
  PX.mapPos = (pl) => ({ left: (pl.x * 100).toFixed(2) + "%", top: (pl.y * 92).toFixed(2) + "%" });

  // ---------------------------------------------------------------- Apparence des personnages
  PX.clientLook = (c, id) => PX.lookFrom(id || (c.prenom + c.nom), Object.assign({ g: c.g, age: c.age }, c.look || {}));
  PX.acteurLook = (a) => (a ? Object.assign({}, PX.lookFrom(a.id, a.look), a.look) : PX.lookFrom("x"));
})();
