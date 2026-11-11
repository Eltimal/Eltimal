/* La Permanence — les gens dans les pièces : personnages en pixel, cadre des pièces, caméra.
   Même moteur que le bandeau des lieux (decor-core.js) : dessin à 80 pixels de haut, agrandi d'un facteur entier.
   Chaque personnage est tiré de son « look » (le même que pour les portraits : peau, cheveux, lunettes, barbe, tenue)
   et dessiné à la main au pixel : robe et rabat, robe rouge et hermine, uniforme et casquette, brassard d'OPJ.
   Il respire, cligne des yeux, parle (bouche, geste, bulle), se lève, marche. La pièce est composée autour du centre
   et se prolonge sur les côtés ; si l'écran est plus étroit que la pièce, la caméra glisse vers celui qui parle.
   Les éléments qui changent pendant la scène (qui parle, délibéré, tour du joueur) sont lus à chaque image dans
   les options ; le reste est dessiné une fois et mis en cache. Aucun dégradé, aucune lecture de pixels (tests). */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html } = UI;
  const { useEffect, useRef } = React;
  const D = CR.dec, H = D.H;
  const { shade, mk, hexRGB, toHex } = D;

  // ---------------------------------------------------------------- palettes (identiques aux portraits)
  const SKIN = [
    ["#f7d7b8", "#e2b48f", "#c98f6b"], ["#ecbd96", "#d29a72", "#b37650"], ["#d9a273", "#bd8457", "#9b6541"],
    ["#b98257", "#9c6640", "#7c4c2d"], ["#8f5e3c", "#744828", "#57341b"], ["#65412a", "#4f301d", "#3a2213"],
  ];
  const HAIR = { black: ["#1e1b1c", "#3a3436"], dkbrown: ["#3c271a", "#5a3b26"], brown: ["#6b4329", "#8a5a38"], auburn: ["#8e3d1f", "#b2552c"], blonde: ["#d7b45f", "#efd38c"], gray: ["#8f8e8c", "#b5b3af"], white: ["#dcdad4", "#f4f2ec"] };
  const SCARF = ["#3e5c3a", "#5b4a7a", "#7a2f2f", "#2f4b6e", "#a8843a", "#2e2e33"];
  const PANTS = ["#23262f", "#2e3a52", "#3a3a40", "#4b4034", "#1c1c22", "#55575f"];
  const GENERIC = { g: "m", age: 40, skin: 1, hc: "brown", hair: "short", shirt: "#2f4b6e", outfit: "shirt" };
  D.SKIN = SKIN; D.HAIR = HAIR;

  // ---------------------------------------------------------------- tenues
  const WEAR = {
    robe: { b: "#18181e", hi: "#2f2f3a", lo: "#0b0b0e", robe: 1, rabat: 1 },
    robeR: { b: "#a3241e", hi: "#c63a2f", lo: "#6e1511", robe: 1, rabat: 1, hermine: 1 },
    uniform: { b: "#22335f", hi: "#35497f", lo: "#16234a", cap: "#17224a", col: "#a9bde0", belt: 1, badge: "#e2b645", pants: "#18213e" },
    gend: { b: "#26345a", hi: "#384a78", lo: "#182444", cap: "#121c38", col: "#c9d3e3", belt: 1, badge: "#d8dce4", pants: "#1a2340" },
    opj: { b: "#3b404c", hi: "#565d6b", lo: "#262a32", brassard: 1 },
    surv: { b: "#c4c7c2", hi: "#dadcd8", lo: "#9ea29e", belt: 1, pants: "#2a2e3a" },
    blouse: { b: "#e6e6e0", hi: "#f6f6f2", lo: "#c4c8c8" },
    suit: { b: "#2a2d36", hi: "#3e4250", lo: "#1a1c23", shirt: 1 },
  };
  function wearOf(w, L) {
    if (w && WEAR[w]) return WEAR[w];
    const o = L.outfit;
    if (o === "robe") return WEAR.robe;
    if (o === "uniform") return WEAR.uniform;
    if (o === "suit") return WEAR.suit;
    const b = L.shirt || "#2f4b6e";
    return { b, hi: shade(b, 20), lo: shade(b, -24), hood: o === "hoodie", scrubs: o === "scrubs" };
  }
  const seedOf = (L) => ((L.skin || 0) * 7 + (L.age || 30) * 3 + String(L.hair || "").length * 11 + (L.glasses ? 5 : 0)) % 97;

  // ---------------------------------------------------------------- cheveux (vue de face ou de dos), tête de 5 × 6
  function hair(d, x, top, L, hc, back, dir) {
    const c0 = hc[0], c1 = hc[1], st = L.hair || "short";
    const R = (xx, yy, w, h, c) => d.r(xx, yy, w, h, c || c0);
    if (st === "hijab") {
      const sc = (L.scarf || "#5b3a5e"), sl = shade(sc, 18);
      R(x - 2, top - 1, 5, 1, sc); R(x - 3, top, 7, 2, sc); R(x - 3, top + 2, 2, 4, sc); R(x + 2, top + 2, 2, 4, sc); R(x - 3, top + 6, 7, 2, sc);
      d.p(x - 2, top, sl); d.p(x - 1, top - 1, sl);
      if (back) R(x - 1, top + 2, 3, 4, sc);
      return;
    }
    if (back) {
      if (st === "bald") { R(x - 2, top + 3, 5, 2, c0); d.p(x - 1, top + 1, shade(c1, 30)); return; }
      R(x - 1, top, 3, 1); R(x - 2, top + 1, 5, 4); d.p(x - 1, top + 1, c1); d.p(x + 1, top + 2, c1);
      if (["long", "braids", "bob", "ponytail"].includes(st)) { R(x - 2, top + 5, 5, st === "bob" ? 1 : 4); if (st === "braids") for (let k = 0; k < 4; k++) d.p(x - 2 + (k % 2) * 4, top + 5 + k, c1); if (st === "ponytail") R(x, top + 5, 1, 4); }
      if (st === "bun") R(x - 1, top - 1, 3, 1, c1);
      if (st === "afro" || st === "curly") { R(x - 3, top, 1, 4); R(x + 3, top, 1, 4); R(x - 2, top - 1, 5, 1); if (st === "afro") R(x - 1, top - 2, 3, 1); }
      return;
    }
    switch (st) {
      case "bald": R(x - 2, top + 2, 1, 2); R(x + 2, top + 2, 1, 2); break;
      case "buzz": R(x - 1, top, 3, 1); d.p(x - 2, top + 1, c0); d.p(x + 2, top + 1, c0); break;
      case "receding": d.p(x - 1, top, c0); d.p(x + 1, top, c0); R(x - 2, top + 1, 1, 2); R(x + 2, top + 1, 1, 2); break;
      case "side": R(x - 1, top, 3, 1); R(x - 2, top + 1, 4, 1); R(x - 2, top + 2, 1, 1); d.p(x - 1, top, c1); break;
      case "curly": R(x - 1, top - 1, 3, 1); R(x - 2, top, 5, 1); R(x - 3, top + 1, 7, 1); R(x - 3, top + 2, 1, 2); R(x + 3, top + 2, 1, 2); d.p(x - 1, top, c1); d.p(x + 2, top + 1, c1); break;
      case "afro": R(x - 1, top - 2, 3, 1); R(x - 3, top - 1, 7, 2); R(x - 3, top + 1, 7, 1); R(x - 3, top + 2, 1, 3); R(x + 3, top + 2, 1, 3); d.p(x - 2, top - 1, c1); d.p(x + 1, top - 2, c1); break;
      case "long": case "braids":
        R(x - 1, top, 3, 1); R(x - 2, top + 1, 5, 1); R(x - 2, top + 2, 1, 3); R(x + 2, top + 2, 1, 3); R(x - 3, top + 1, 1, 8); R(x + 3, top + 1, 1, 8); d.p(x - 1, top, c1);
        if (st === "braids") for (let k = 0; k < 8; k += 2) { d.p(x - 3, top + 1 + k, c1); d.p(x + 3, top + 2 + k, c1); }
        break;
      case "bob": R(x - 1, top, 3, 1); R(x - 2, top + 1, 5, 1); R(x - 3, top + 1, 1, 5); R(x + 3, top + 1, 1, 5); R(x - 2, top + 2, 1, 2); R(x + 2, top + 2, 1, 2); d.p(x, top, c1); break;
      case "bun": R(x - 1, top, 3, 1); R(x - 2, top + 1, 5, 1); R(x - 2, top + 2, 1, 1); R(x + 2, top + 2, 1, 1); R(x - 1, top - 2, 3, 2); d.p(x, top - 2, c1); break;
      case "ponytail": R(x - 1, top, 3, 1); R(x - 2, top + 1, 5, 1); R(x - 2, top + 2, 1, 1); R(x + 2, top + 2, 1, 1); R(dir < 0 ? x - 3 : x + 3, top + 1, 1, 5); d.p(x, top, c1); break;
      default: R(x - 1, top, 3, 1); R(x - 2, top + 1, 5, 1); R(x - 2, top + 2, 1, 1); R(x + 2, top + 2, 1, 1); d.p(x + 1, top, c1);
    }
  }

  // ---------------------------------------------------------------- un personnage entier
  // x = colonne du milieu, y = ligne des pieds. o : look, wear, pose ("stand" | "sit"), back, dir (-1, 0, 1), dy (se lever),
  // breath, blink, mouth (0 fermée, 1 entrouverte, 2 ouverte), arm (0 bas, 1 tendu, 2 levé, 3 écrit), step (marche), expr.
  function fig(d, x, y, o) {
    const L = o.look || GENERIC, sk = SKIN[L.skin] || SKIN[1], hc = HAIR[L.hc] || HAIR.black, W = wearOf(o.wear, L);
    const seated = o.pose === "sit", back = !!o.back, dir = o.dir || 0;
    x = Math.round(x);
    const base = y - (seated ? 22 : 24) + Math.round(o.dy || 0), top = base - (o.breath ? 1 : 0);
    const pants = W.pants || (W.robe ? "#15151a" : PANTS[seedOf(L) % PANTS.length]), shoe = "#0b0b0e";
    const tt = top + 6, tb = base + 14;
    // jambes
    if (seated) {
      const lap = W.robe ? W.b : pants;
      d.r(x - 3, tb + 1, 7, 2, lap); d.hl(x - 3, tb + 1, 7, shade(lap, 16));
      d.r(x - 2, tb + 3, 2, 5, pants); d.r(x + 1, tb + 3, 2, 5, pants);
      d.r(x - 3, tb + 8, 3, 1, shoe); d.r(x + 1, tb + 8, 3, 1, shoe);
    } else {
      const sw = o.step >= 0 ? [0, 1, 0, -1][o.step & 3] : 0;
      const lt = W.robe ? tb + 7 : tb + 1, n = y - lt;
      d.r(x - 2 + sw, lt, 2, n - (sw > 0 ? 1 : 0), pants); d.r(x + 1 - sw, lt, 2, n - (sw < 0 ? 1 : 0), pants);
      d.r(x - 2 + sw - (dir < 0 ? 1 : 0), y, dir < 0 ? 3 : 2, 1, shoe); d.r(x + 1 - sw, y, dir > 0 ? 3 : 2, 1, shoe);
    }
    // buste
    d.r(x - 2, tt, 5, 1, W.b); d.r(x - 3, tt + 1, 7, tb - tt, W.b);
    d.vl(x - 3, tt + 1, tb - tt, back ? W.lo : W.hi); d.vl(x + 3, tt + 1, tb - tt, back ? W.hi : W.lo);
    if (W.robe && !seated) { d.r(x - 3, tb + 1, 7, 3, W.b); d.r(x - 4, tb + 4, 9, 3, W.b); d.vl(x - 1, tb + 2, 5, W.lo); d.vl(x + 2, tb + 3, 4, W.lo); d.vl(x - 4, tb + 4, 3, W.hi); }
    if (!back) {
      if (W.robe) {
        d.r(x - 1, tt, 3, 1, "#f2efe6"); d.r(x, tt + 1, 1, 2, "#f2efe6");
        if (W.hermine) { d.r(x - 3, tt, 2, 4, "#f4f2ea"); d.p(x - 3, tt + 1, "#1a1a1e"); d.p(x - 2, tt + 3, "#1a1a1e"); }
      } else if (W.shirt) { d.p(x - 1, tt, "#ecebe6"); d.p(x + 1, tt, "#ecebe6"); d.r(x, tt, 1, 2, "#ecebe6"); d.r(x, tt + 2, 1, 3, L.tie || "#8a2a2a"); }
      else if (W.cap) { d.r(x - 1, tt, 3, 1, W.col); d.p(x - 2, tt + 2, W.badge); }
      else if (W.hood) { d.r(x - 2, tt, 5, 1, shade(W.b, -18)); d.p(x - 1, tt + 3, "#d8d4ca"); d.p(x + 1, tt + 3, "#d8d4ca"); }
      else d.p(x, tt, sk[1]);
    } else if (W.hood) d.r(x - 2, tt, 5, 2, shade(W.b, -18));
    if (W.belt) { d.hl(x - 3, tb - 1, 7, "#0e0e12"); d.p(x, tb - 1, "#c9b26a"); }
    // bras
    const sl = W.b, arm = back ? 0 : o.arm || 0;
    const sleeve = (sx, side) => {
      d.vl(sx, tt + 1, tb - tt - 1, sl);
      if (W.robe) d.vl(sx + side, tt + 5, tb - tt - 5, sl);
      d.p(sx, tb, sk[1]);
    };
    sleeve(x - 4, -1);
    if (arm === 1) { d.vl(x + 4, tt + 1, 4, sl); d.r(x + 4, tt + 5, 3, 1, sl); d.p(x + 7, tt + 5, sk[1]); if (W.robe) d.r(x + 4, tt + 6, 2, 1, sl); }
    else if (arm === 2) { d.vl(x + 4, tt + 1, 3, sl); d.vl(x + 5, tt - 2, 4, sl); d.p(x + 5, tt - 3, sk[1]); if (W.robe) d.vl(x + 6, tt - 1, 3, sl); }
    else if (arm === 3) { const k = o.wr ? 1 : 0; d.vl(x + 4, tt + 1, 5, sl); d.p(x + 3, tt + 6, sl); d.p(x + 2, tb - 2 - k, sk[1]); d.vl(x - 4, tt + 1, 5, sl); d.p(x - 3, tt + 6, sl); d.p(x - 2, tb - 2 + k - 1, sk[1]); }
    else sleeve(x + 4, 1);
    if (W.brassard) { d.r(x - 4, tt + 3, 1, 2, "#e8702a"); if (W.robe) d.r(x - 5, tt + 3, 1, 2, "#e8702a"); }
    // tête
    d.r(x - 1, top, 3, 1, sk[0]); d.r(x - 2, top + 1, 5, 4, sk[0]); d.r(x - 1, top + 5, 3, 1, sk[0]);
    if (!back) d.vl(dir > 0 ? x - 2 : x + 2, top + 2, 3, sk[1]);
    hair(d, x, top, L, hc, back, dir);
    if (W.cap) { d.r(x - 2, top - 1, 5, 1, W.cap); d.r(x - 2, top, 5, 1, W.cap); if (!back) d.r(x - 2 + (dir > 0 ? 1 : dir < 0 ? -1 : 0), top + 1, 5, 1, "#0d1124"); d.p(x, top - 1, W.badge); }
    if (back) { if ((L.hair || "") !== "hijab" && !W.cap) { d.p(x - 2, top + 3, sk[1]); d.p(x + 2, top + 3, sk[1]); } if (dir) d.vl(dir > 0 ? x + 2 : x - 2, top + 3, 2, sk[0]); return; }
    // visage
    const ey = top + 2, e1 = x - 1 + dir, e2 = x + 1 + dir;
    if (L.glasses) { d.r(x - 2, ey, 5, 1, "#2a2a30"); d.p(e1, ey, o.blink ? "#2a2a30" : "#9db3c8"); d.p(e2, ey, o.blink ? "#2a2a30" : "#9db3c8"); }
    else { d.p(e1, ey, o.blink ? sk[1] : "#241a16"); d.p(e2, ey, o.blink ? sk[1] : "#241a16"); }
    if (o.expr === "angry" || o.expr === "defi") { d.p(e1 - 1, ey - 1, hc[0]); d.p(e2 + 1, ey - 1, hc[0]); }
    if (o.expr === "worried" || o.expr === "cry" || o.expr === "honte") { d.p(e1, ey - 1, hc[0]); d.p(e2, ey - 1, hc[0]); }
    const mx = x + dir, my = top + 4;
    if (L.beard === 1) { d.r(x - 2, my, 1, 2, hc[0]); d.r(x + 2, my, 1, 2, hc[0]); d.r(x - 1, top + 5, 3, 1, hc[0]); }
    if (L.beard === 2) d.r(x - 1, my - 1 + 1, 3, 1, hc[0]);
    if (o.mouth === 2) { d.p(mx, my, "#4a1c18"); d.p(mx, my + 1, "#7a3b33"); }
    else if (o.mouth === 1) d.p(mx, my, "#5e2a24");
    else if (o.expr === "smile" || o.expr === "soulage") d.r(mx - 1, my, 3, 1, sk[2]);
    else if (L.beard !== 2) d.p(mx, my, sk[2]);
    if (o.expr === "cry" && o.t != null) { const k = Math.floor(o.t * 3) % 3; d.ep(e1, ey + 1 + k, "#8ec8f0"); }
  }
  D.fig = fig;

  // ---------------------------------------------------------------- tête de spectateur, vue de dos, au premier plan (7 × 8)
  function backHead(d, x, y, L, o) {
    const sk = SKIN[L.skin] || SKIN[1], hc = HAIR[L.hc] || HAIR.black, c0 = hc[0], c1 = hc[1], st = L.hair || "short";
    const W = wearOf(null, L), turn = o.turn || 0, yy = y + (o.up || 0);
    d.r(x - 6, yy + 8, 13, H - yy - 8, W.b); d.hl(x - 5, yy + 8, 11, W.hi); d.vl(x - 6, yy + 9, H, W.lo);
    if (W.hood) d.r(x - 4, yy + 7, 9, 3, shade(W.b, -18));
    if (st === "hijab") { const sc = (L.scarf || "#5b3a5e"); d.r(x - 3, yy, 7, 9, sc); d.r(x - 4, yy + 2, 9, 7, sc); d.p(x - 2, yy + 1, shade(sc, 18)); if (turn) d.r(turn > 0 ? x + 3 : x - 4, yy + 3, 1, 3, sk[0]); return; }
    d.r(x - 3, yy, 7, 8, sk[0]); d.r(x - 4, yy + 2, 9, 4, sk[0]);
    if (st === "bald") { d.r(x - 4, yy + 4, 9, 3, c0); d.p(x - 1, yy + 1, shade(sk[0], 24)); }
    else {
      d.r(x - 3, yy, 7, 6, c0); d.r(x - 4, yy + 1, 9, 4, c0); d.p(x - 1, yy + 1, c1); d.p(x + 1, yy + 2, c1);
      if (["long", "braids", "bob", "ponytail"].includes(st)) d.r(x - 3, yy + 6, 7, st === "bob" ? 2 : 6, c0);
      if (st === "afro" || st === "curly") { d.r(x - 4, yy - 1, 9, 2, c0); d.r(x - 5, yy + 1, 11, 4, c0); }
      if (st === "bun") d.r(x - 1, yy - 2, 3, 2, c0);
      if (!["long", "braids", "afro", "curly"].includes(st)) { d.p(x - 4, yy + 4, sk[1]); d.p(x + 4, yy + 4, sk[1]); }
    }
    if (turn) { const ex = turn > 0 ? x + 4 : x - 4; d.r(ex, yy + 3, 1, 4, sk[0]); d.p(ex + turn, yy + 4, sk[1]); d.p(ex, yy + 3, "#241a16"); }
    if (o.phone) { d.er(x - 2, yy + 9, 4, 2, "#bfe0ff"); d.er(x - 3, yy + 7, 7, 2, "rgba(150,200,255,0.18)"); }
  }
  D.backHead = backHead;

  // ---------------------------------------------------------------- bulle de parole, marque du joueur
  function bubble(d, x, y, t, kind) {
    const P = d.P, ink = "#15151b", fill = kind === "murmure" ? "#c9c6bd" : "#f6f1e4";
    x = Math.round(x); y = Math.round(y);
    P.r(x - 3, y - 6, 7, 1, ink); P.r(x - 4, y - 5, 1, 3, ink); P.r(x + 4, y - 5, 1, 3, ink); P.r(x - 3, y - 2, 7, 1, ink);
    P.r(x - 3, y - 5, 7, 3, fill); P.p(x - 2, y - 1, ink); P.p(x - 3, y, ink);
    if (kind === "!") { P.r(x, y - 5, 1, 2, "#b3261e"); }
    else { const n = 1 + (Math.floor(t * 3) % 3); for (let i = 0; i < n; i++) P.p(x - 2 + i * 2, y - 4, ink); }
  }
  D.bubble = bubble;
  function youMark(d, x, y, t) {
    const P = d.P, b = Math.floor(t * 3) % 2;
    y = Math.round(y) - b;
    P.r(x - 2, y - 3, 5, 1, "#f3c166"); P.r(x - 1, y - 2, 3, 1, "#f3c166"); P.p(x, y - 1, "#e2a43b");
    P.p(x - 3, y - 3, "#1d1406"); P.p(x + 3, y - 3, "#1d1406");
  }

  // ---------------------------------------------------------------- teinte des pièces éclairées
  // Une salle est éclairée : la nuit ne l'assombrit pas comme une rue, elle la refroidit un peu et la rend plus sourde.
  function roomTint(S, k) {
    const cache = new Map(), ph = S.ph, f = k == null ? 1 : k;
    S.c = (h) => {
      if (!h || h[0] !== "#") return h;
      let v = cache.get(h);
      if (v) return v;
      let [r, g, b] = hexRGB(h);
      if (ph === "soir") { r = r * (1 - 0.06 * f) + 4 * f; g = g * (1 - 0.1 * f); b = b * (1 - 0.14 * f); }
      else if (ph === "nuit") { r = r * (1 - 0.24 * f) + 3 * f; g = g * (1 - 0.22 * f) + 4 * f; b = b * (1 - 0.16 * f) + 10 * f; }
      v = toHex(r, g, b);
      cache.set(h, v);
      return v;
    };
  }

  // ---------------------------------------------------------------- cadre d'une pièce
  // S.cast : les personnages ; S.layers : le mobilier de premier plan, mis en cache, dessiné après les personnages
  // de même profondeur (z). Les personnages se déclarent avec actor() ; leur état peut dépendre du moment (state()).
  D.room = function (S, o = {}) {
    S.room = true; S.cast = []; S.layers = []; S.after = [];
    if (CR.lum) { S.emS = new Uint8Array(S.W * H); S.emD = new Uint8Array(S.W * H); S.lits = []; S.litD = []; S.c = (h) => h; }
    else if (!o.keepTint) roomTint(S, o.tint);
    S._t0 = null;
    S.dyn.push((d, t) => roomFrame(S, d, t));
    return S;
  };
  D.front = function (S, z, fn) {
    const c = mk(S.W, H), P = CR.px.painter(c.getContext("2d")), w = D.wrap(P, S);
    fn(w);
    S.layers.push({ z, c });
  };
  D.actor = function (S, a) {
    a.z = a.z || 0; a.seed = a.seed != null ? a.seed : (S.cast.length * 1.37 + 0.4);
    a.look = a.look || CR.px.lookFrom(S.name + S.cast.length);
    S.cast.push(a);
    return a;
  };
  const isWho = (a, who) => !!who && (a.who === who || (Array.isArray(a.who) && a.who.includes(who)));
  D.isWho = isWho;

  function roomFrame(S, d, t) {
    const o = S.o || {};
    if (S._t0 == null) S._t0 = t;
    const cueOn = D.cueState && D.cueState.until > now();
    const speaker = o.speaker || (cueOn ? D.cueState.who : null);
    const mode = o.court || "";
    if (mode !== S._mode) { S._mode = mode; S._modeT = t; }
    const c = { o, t, speaker, mode, mt: t - (S._modeT != null ? S._modeT : t), since: t - S._t0, S };
    const zs = [...new Set(S.cast.map((a) => a.z).concat(S.layers.map((l) => l.z)))].sort((a, b) => a - b);
    for (const z of zs) {
      for (const a of S.cast) if (a.z === z) drawActor(S, d, a, c);
      for (const l of S.layers) if (l.z === z) d.P.ctx.drawImage(l.c, 0, 0);
    }
    for (const f of S.after) f(d, t, c);
    // bulles, marque du joueur
    for (const a of S.cast) {
      if (a._hide) continue;
      if (a._talk && !a.noBubble) bubble(d, a._hx + (a.bx || 0), a._hy - 1, t, a._bk);
      else if (a.you && (c.since < 4.5 || o.turn) && !a._talk) youMark(d, a._hx, a._hy - 1, t);
    }
    S.focusNow = focusOf(S, c);
  }
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  function drawActor(S, d, a, c) {
    const st = a.state ? a.state(c, a) || {} : {};
    a._hide = !!(st.hide || a.hide);
    if (a._hide) return;
    if (a.draw) { a.draw(d, c, st); return; }
    const t = c.t, sd = a.seed;
    const talking = st.talk != null ? st.talk : (c.mode === "" || c.mode === "prononce") && isWho(a, c.speaker);
    a._talk = talking; a._bk = st.bubble || null;
    const x = Math.round(st.x != null ? st.x : a.x);
    if (a.kind === "public") {
      const turn = st.turn != null ? st.turn : (Math.floor(t * 0.35 + sd * 3.1) % 7 === 0 ? (sd * 10 % 2 < 1 ? 1 : -1) : 0);
      backHead(d, x, a.y, a.look, { turn, up: st.up || 0, phone: a.phone && Math.floor(t * 0.2 + sd) % 3 !== 0 });
      a._hx = x; a._hy = a.y + (st.up || 0) - 1;
      return;
    }
    const walk = !!st.walk;
    const gest = talking && a.gesture !== false && !a.back ? [0, 1, 0, 2, 1, 0, 0, 1][Math.floor(t * 1.5 + sd * 3) % 8] : null;
    const o = {
      look: a.look, wear: a.wear, pose: st.pose || a.pose || "stand", back: st.back != null ? st.back : a.back, dir: st.dir != null ? st.dir : a.dir || 0,
      dy: st.dy || 0, breath: !walk && (t + sd * 1.7) % 3.4 < 1.15, blink: !a.back && (t * 0.93 + sd * 2.3) % 4.3 < 0.14,
      mouth: talking ? [2, 1, 0, 2, 2, 1][Math.floor(t * 9 + sd * 5) % 6] : 0,
      arm: gest != null ? gest : st.arm != null ? st.arm : a.arm || 0, wr: Math.floor(t * 6 + sd) % 2 === 0,
      step: walk ? Math.floor(t * 8) % 4 : -1, expr: st.expr || a.expr, t,
    };
    if (a.wearFn) o.wear = a.wearFn(c);
    // derrière un bureau : on ne dessine pas ce qui passe sous le plateau
    const cl = st.clip != null ? st.clip : a.clip, cx2 = d.P.ctx;
    if (cl != null) { cx2.save(); cx2.beginPath(); cx2.rect(0, 0, S.W, cl); cx2.clip(); }
    fig(d, x, a.y, o);
    if (cl != null) cx2.restore();
    a._hx = x; a._hy = a.y - (o.pose === "sit" ? 22 : 24) + Math.round(o.dy) - (o.look.hair === "afro" ? 3 : 1);
  }
  D.drawActor = drawActor;

  function focusOf(S, c) {
    if (c.o.focus != null) return c.o.focus;
    if (S.focusFn) { const f = S.focusFn(c); if (f != null) return f; }
    const a = S.cast.find((q) => !q._hide && isWho(q, c.speaker));
    return a ? a._hx : S.focusDefault != null ? S.focusDefault : S.cx;
  }

  // Petit signal pour animer quelqu'un qui parle hors d'un script d'audience (garde à vue, entretien)
  D.cueState = { who: null, until: 0 };
  D.cue = (who, ms) => { D.cueState = { who, until: now() + (ms || 1600) }; };

  // ---------------------------------------------------------------- l'horloge murale
  D.clock = function (S, x, y, r, o = {}) {
    S.circ(x, y, r + 1, o.rim || "#2a2016"); S.circ(x, y, r, o.face || "#f0ede4");
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) S.p(x + dx * (r - 1), y + dy * (r - 1), "#16110c");
    S.dyn.push((d) => { const m = (S.o && S.o.min) || 0, hh = (m / 60) % 12, mm = m % 60, ha = hh / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2; d.line(x, y, x + Math.sin(ha) * (r - 3), y - Math.cos(ha) * (r - 3), "#16110c"); d.line(x, y, x + Math.sin(ma) * (r - 1), y - Math.cos(ma) * (r - 1), "#16110c"); d.p(x, y, "#b3261e"); });
  };
  // Néon au plafond (grésille parfois)
  D.neon = function (S, x, y, w, o = {}) {
    S.r(x - 1, y - 1, w + 2, 3, "#8a9094"); S.er(x, y, w, 1, o.col || "#f2fbff");
    S.dynBack.push((d, t) => { const off = o.flicker && Math.floor(t * 9 + x) % 37 === 0; d.P.r(x, y, w, 1, off ? "#7c8a94" : o.col || "#f2fbff"); });
    S.glow(x + (w >> 1), y + 2, Math.min(26, w), o.rgb || "235,248,255", o.a || 0.18);
  };

  // ---------------------------------------------------------------- composant : une pièce, sa caméra
  // mode "band" : hauteur visée (comme le bandeau) ; mode "mini" : facteur choisi d'après la largeur (encart).
  D.ROOM_MIN = {};
  UI.Room = ({ name, opts, label, mini, className }) => {
    const ref = useRef(null), optsRef = useRef(opts), api = useRef({});
    optsRef.current = opts;
    useEffect(() => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      let S = null, key = "", K = 0, W = 0, WD = 0, low = null, lctx = null, raf = 0, alive = true, last = 0, lastT = 30, cam = null;
      const t0 = now() - 30000;
      const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      const fit = () => {
        const o = optsRef.current || {}, dpr = window.devicePixelRatio || 1;
        const cw = (c.parentElement && c.parentElement.clientWidth) || (window.innerWidth || 960);
        const k = mini ? Math.max(1, Math.round(cw * dpr / (o.prefW || 200))) : Math.max(1, Math.round((cw < 640 ? 168 : 216) * dpr / H));
        const w = Math.max(96, Math.ceil(cw * dpr / k)), wd = Math.max(w, D.ROOM_MIN[name] || 0);
        const ph = CR.mapPhase(o.min == null ? 600 : o.min);
        const kk = [name, wd, ph, ph === "soir" && o.min % 1440 < 720 ? "a" : "c", o.rain ? "p" : "s", o.season, o.sig || ""].join("|");
        if (k !== K || w !== W || wd !== WD) { K = k; W = w; WD = wd; c.width = W * K; c.height = H * K; c.style.width = (W * K / dpr) + "px"; c.style.height = (H * K / dpr) + "px"; low = mk(WD, H); lctx = low.getContext("2d"); key = ""; cam = null; }
        if (kk !== key) { key = kk; S = D.layout(name, WD, o); }
      };
      const paint = (t, snap) => {
        fit(); lastT = t;
        const o = optsRef.current || {};
        D.frame(S, lctx, t, o);
        const span = WD - W, f = S.focusNow != null ? S.focusNow : WD >> 1;
        const target = Math.max(0, Math.min(span, Math.round(f - W / 2)));
        cam = cam == null || snap || reduce ? target : cam + (target - cam) * 0.14;
        const cx0 = Math.round(cam);
        if (D.relight && D.relight(S, lctx, t, o)) { ctx.save(); ctx.setTransform(1, 0, 0, 1, -cx0 * K, 0); S._R.present(ctx, WD * K, H * K); ctx.restore(); return; }
        // vignette aux bords de la vue
        const P = CR.px.painter(lctx);
        for (let k = 0; k < 5; k++) { const a = (0.3 * (1 - k / 5)).toFixed(3); P.r(cx0 + k, 0, 1, H, `rgba(4,6,14,${a})`); P.r(cx0 + W - 1 - k, 0, 1, H, `rgba(4,6,14,${a})`); }
        P.r(cx0, 0, W, 1, "rgba(4,6,14,0.3)"); P.r(cx0, H - 1, W, 1, "rgba(4,6,14,0.25)");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(low, cx0, 0, W, H, 0, 0, W * K, H * K);
      };
      const loop = (n) => {
        if (!alive) return;
        if (n - last > 66) { last = n; try { paint((n - t0) / 1000); } catch (e) { console.error(e); alive = false; return; } }
        raf = requestAnimationFrame(loop);
      };
      try { paint(30, true); } catch (e) { console.error(e); return; }
      api.current.paint = () => paint(lastT + 0.07, true);
      const onResize = () => { try { paint(lastT, true); } catch (e) { /* rien */ } };
      window.addEventListener("resize", onResize);
      if (!reduce) raf = requestAnimationFrame(loop);
      return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); api.current.paint = null; };
    }, [name]);
    useEffect(() => { if (api.current.paint && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) try { api.current.paint(); } catch (e) { /* rien */ } }, [JSON.stringify(opts || {})]);
    return html`<canvas ref=${ref} width="480" height=${H * 3} className=${UI.cx("pano room", className)} role="img" aria-label=${label || D.LABEL[name] || ""}></canvas>`;
  };
})();
