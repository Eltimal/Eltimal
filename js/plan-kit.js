/* La Permanence — boîte à outils des plans de la refonte (CR.planKit) : pièce (mur, soubassement, sol), tube
   fluorescent, horloge, personnage de face (buste du moteur de portraits, détouré, qui cligne et parle),
   personnage de dos au premier plan. Chargé après gpu.js, avant les plans qui s'en servent. */
(function () {
  const CR = window.CR, PL = CR.lum, K = (CR.planKit = {});
  const h01 = PL.h01, mix = PL.mix;
  K.HAIR = { black: "#1e1b1c", dkbrown: "#3c271a", brown: "#6b4329", auburn: "#8e3d1f", blonde: "#c9a654", gray: "#8f8e8c", white: "#d4d2cc" };

  // pièce : o = { H, floorY, wallD, wall, wallA, wallB, dadoY, dado, dadoLine, tile, plinth, floor [sombre, moyen, clair], gloss }
  K.room = function (m, W, o) {
    const X0 = -m.ox, FY = o.floorY, WD = o.wallD || 160;
    m.set({ E: 0, n: [0, 0], S: 0, D: WD });
    m.r(X0, 0, W, FY, o.wall);
    if (o.wallA) m.noise(X0, 8, W, (o.dadoY || FY) - 8, o.wallA, 0.22, 3);
    if (o.wallB) m.noise(X0, 8, W, (o.dadoY || FY) - 8, o.wallB, 0.1, 9);
    if (o.dadoY) {
      m.r(X0, o.dadoY, W, FY - o.dadoY, o.dado);
      if (o.tile) { for (let x = Math.ceil(X0 / 14) * 14; x < X0 + W; x += 14) m.vl(x, o.dadoY + 1, FY - o.dadoY - 5, o.dadoLine); for (let y = o.dadoY + 13; y < FY - 6; y += 13) m.hl(X0, y, W, o.dadoLine); }
      m.hl(X0, o.dadoY - 1, W, mix(PL.rgb(o.wall), [255, 255, 255], 0.3)); m.hl(X0, o.dadoY, W, o.dadoLine);
    }
    m.r(X0, FY - 4, W, 4, o.plinth || "#39474a");
    m.r(X0, 0, W, 7, o.ceil || "#6e7374"); m.hl(X0, 7, W, "#555a5c");
    const f = o.floor;
    for (let y = FY; y < o.H; y++) {
      const k = (y - FY) / (o.H - FY);
      m.set({ n: [0, -1], S: o.gloss == null ? 120 : o.gloss, D: Math.round(WD * (1 - k)) });
      for (let x = X0; x < X0 + W; x++) { const r = PL.h2(x, y); m.px(x, y, r < 0.1 ? f[0] : r > 0.9 ? f[2] : f[1]); }
    }
    m.set({ n: [0, -1], S: 60, D: WD - 4 }); m.dith(X0, FY, W, 3, mix(PL.rgb(f[0]), [0, 0, 0], 0.35), 0.6);
    m.set({ n: [0, 0], S: 0, D: WD });
  };
  K.neon = function (m, x, y, w) { m.set({ E: 0, n: [0, 0], S: 0 }); m.r(x, y, w, 5, "#8d9293"); m.hl(x, y + 5, w, "#5f6466"); m.set({ E: 255 }); m.r(x + 5, y + 2, w - 10, 2, "#e9fff3"); m.set({ E: 0 }); };
  K.clockFace = function (m, cx, cy) { m.orb(cx, cy, 11, 11, "#2b3136", 0.5); m.set({ E: 12 }); m.ell(cx, cy, 9, 9, "#eeeade"); m.set({ E: 0 }); for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; m.px(Math.round(cx + Math.sin(a) * 8), Math.round(cy - Math.cos(a) * 8), "#55595c"); } };
  K.clockHands = function (m, cx, cy, min, t, still) {
    const ah = (min % 720) / 720 * Math.PI * 2, am = (min % 60) / 60 * Math.PI * 2;
    m.set({ E: 12, n: [0, 0], S: 0 });
    m.line(cx, cy, cx + Math.sin(ah) * 4.5, cy - Math.cos(ah) * 4.5, "#1d2023"); m.line(cx, cy, cx + Math.sin(am) * 7, cy - Math.cos(am) * 7, "#1d2023");
    if (!still) { const as = Math.floor(t) % 60 / 60 * Math.PI * 2; m.line(cx, cy, cx + Math.sin(as) * 7, cy - Math.cos(as) * 7, "#b33a32"); }
  };
  K.paper = function (m, x, y, w, h, title, tcol) { m.r(x + 1, y + 1, w, h, "#8f948c"); m.r(x, y, w, h, "#ecebe0"); if (title) { m.r(x + 2, y + 2, w - 4, 6, tcol || "#27407a"); m.txt(title, x + 4, y + 3, "#f2f0e6"); } for (let i = 0; i < Math.floor((h - (title ? 13 : 5)) / 3); i++) m.hl(x + 3, y + (title ? 11 : 3) + i * 3, Math.floor((w - 8) * (0.5 + h01(i * 5.7 + x) * 0.5)), "#8e9499"); };

  // buste détouré (cache par canvas de portrait)
  const busts = new WeakMap();
  K.bustImg = function (look, expr, blink, breath) {
    if (!look || !CR.px || !CR.px.portrait) return null;
    const cv = CR.px.portrait(look, expr, blink, breath);
    let img = busts.get(cv);
    if (img === undefined) {
      img = null;
      try { if (cv.kind && cv.width === 64) { img = cv.getContext("2d").getImageData(0, 0, 64, 64); for (let i = 0; i < 4096; i++) if (!cv.kind[i]) img.data[i * 4 + 3] = 0; } } catch (e) { img = null; }
      busts.set(cv, img);
    }
    return img;
  };
  K.sample = (img, x, y) => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
  // personnage de face : renvoie une fonction (m, t, { look, expr, talk, still, x, y, D }) → image du buste
  K.actor = function (seed) {
    let blinkAt = 1.5 + h01(seed) * 3, blinkEnd = 0;
    return function (m, t, o) {
      if (!o.look) return null;
      if (!o.still && t > blinkAt) { blinkEnd = t + 0.14; blinkAt = t + 2.4 + h01(Math.floor(t) * 1.7 + seed) * 3.6; }
      const blink = t < blinkEnd, breath = !o.still && (t + seed) % 4.4 > 2.2, ph = Math.floor(t * 7) % 3;
      const expr = o.talk && !o.still ? (ph === 0 ? (o.expr || "neutral") : ph === 1 ? "talk" : "talk2") : (o.expr || "neutral");
      const img = K.bustImg(o.look, expr, blink, breath);
      if (!img) return null;
      m.set({ E: 0, S: 0, D: o.D }); m.blit(img, o.x, o.y);
      return img;
    };
  };
  // qui parle en ce moment ? (live : { who, talkFrom, talkUntil }, posé par l'interface)
  // … ou signalé par les scènes existantes (CR.dec.cue : opj, client, president, parquet, you…)
  K.talks = (live, who) => {
    const now = Date.now();
    if (live && live.talkUntil && now > live.talkFrom && now < live.talkUntil && (!live.who || live.who === who)) return true;
    const c = CR.dec && CR.dec.cueState, pn = typeof performance !== "undefined" ? performance.now() : now;
    return !!(c && c.who === who && c.until > pn);
  };
  K.speaker = () => { const c = CR.dec && CR.dec.cueState, pn = typeof performance !== "undefined" ? performance.now() : Date.now(); return c && c.until > pn ? c.who : null; };
  // corps sous un buste debout : torse jusqu'à y1, de la couleur de la manche
  K.torso = function (m, img, x, y, y1, D) {
    const sl = K.sample(img, 10, 61), dk = mix(sl, [0, 0, 0], 0.25);
    m.set({ E: 0, S: 0, D });
    for (let yy = y + 64; yy < y1; yy++) for (let xx = x + 3; xx < x + 61; xx++) { const u = (xx - x - 32) / 29; m.nx = Math.round(u * Math.abs(u) * 100 + 128); m.px(xx, yy, Math.abs(u) > 0.72 || (xx + yy) % 9 === 0 ? dk : sl); }
    m.nx = 128;
  };
  // personnage de dos au premier plan : tête (centre cx, haut top), épaules jusqu'en bas ; o = { hc, g, coat, skin, D, H }
  K.back = function (m, cx, top, o) {
    const hair = PL.hexOf(mix(PL.rgb(K.HAIR[o.hc || "dkbrown"] || K.HAIR.dkbrown), [18, 16, 20], 0.58)), // à contre-jour
       long = o.g === "f", coat = o.coat || "#2b313d", skin = o.skin || "#8a6a58";
    const cA = PL.rgb(coat), cB = mix(cA, [255, 255, 255], 0.07), sy = top + 53;
    m.set({ E: 0, S: 0, D: o.D == null ? 12 : o.D });
    for (let y = sy; y < (o.H || 225); y++) {
      const k = Math.min(1, (y - sy) / 33), half = Math.round(34 + 58 * Math.sqrt(k) + 6 * k);
      for (let x = cx - half; x <= cx + half; x++) { const u = (x - cx) / (half + 1), e = Math.pow(Math.abs(u), 3); m.nx = Math.round(u * e * 110 + 128); m.ny = Math.round(128 - (1 - k) * (0.35 + 0.6 * e) * 127); m.px(x, y, PL.h2(x, y) < 0.08 ? cB : cA); }
    }
    m.set({ n: [0, -0.7] }); m.r(cx - 18, sy - 5, 36, 6, mix(cA, [0, 0, 0], 0.12)); m.hl(cx - 17, sy - 6, 34, mix(cA, [255, 255, 255], 0.1)); m.set({ n: [0, 0] });
    m.orb(cx, sy - 4, 10, 6, skin, 0.7);
    if (long) m.orb(cx, top + 34, 23, 33, hair, 0.92); else m.orb(cx, top + 25, 21, 25, hair, 0.92);
    m.orb(cx - 22, top + 30, 3, 6, skin, 0.6); m.orb(cx + 22, top + 30, 3, 6, skin, 0.6);
    const hi = mix(PL.rgb(hair), [255, 255, 255], 0.16);
    for (let i = 0; i < 46; i++) { const x = cx - 18 + Math.floor(h01(i * 3.7) * 36), y = top + 3 + Math.floor(h01(i * 9.1) * 34); if ((x - cx) * (x - cx) / 441 + (y - top - 25) * (y - top - 25) / 625 < 0.8) m.vl(x, y, 3, hi, 0.5); }
  };
})();
