/* La Permanence — portraits en 64 × 64 pixels : le moteur de visages.
   Chaque visage est modelé comme un volume éclairé (lumière principale en haut à gauche, liseré coloré à droite),
   puis ramené à une rampe de six tons de peau. Tout part du « look » (PX.lookFrom) : sexe, âge, peau, cheveux, tenue.
   PX.extra en déduit, de façon stable, la forme du visage, les yeux, le nez, la bouche, la coupe exacte, la tenue
   et un trait marquant (cicatrice, mèche blanche, taches de rousseur, tatouage…) : deux looks proches donnent deux
   personnes qu'on distingue. Les personnages récurrents ont une fiche écrite à la main (PX.HAND, clé = id de l'acteur,
   « mentor ») qui remplace ces tirages.
   Dix expressions : neutral, talk, talk2, smile, worried, angry, cry, soulage, defi, honte. Clignement, respiration.
   UI.Portrait : à partir de 56 px, le buste entier à un multiple entier de 64 ; en dessous, le visage seul, recadré
   à l'échelle 1 (pixels nets à toutes les tailles). */
(function () {
  const CR = window.CR, PX = CR.px, UI = CR.UI, { html } = UI;
  const { useState, useEffect, useRef } = React;
  const N = 64, CX = 32;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const hc = new Map();
  const rgb = (h) => { if (typeof h !== "string") return h; let v = hc.get(h); if (!v) { const n = parseInt(h.slice(1), 16); v = [n >> 16, (n >> 8) & 255, n & 255]; hc.set(h, v); } return v; };
  const h2 = (x, y) => { const r = Math.sin(x * 37.761 + y * 66.265 + 1.37) * 43758.5453; return r - Math.floor(r); };
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], bayer = (x, y) => (BAY[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function toHsl(c) { const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function fromHsl(h, s, l) { h = ((h % 360) + 360) % 360; s = cl(s, 0, 1); l = cl(l, 0, 1); const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; }
  // rampe : les ombres glissent vers le rouge et se saturent un peu, les lumières vers le jaune
  function ramp(hex, n, mid, step, hue) { const [h, s, l] = toHsl(rgb(hex)), out = []; for (let k = 0; k < n; k++) { const d = k - mid; out.push(fromHsl(h + d * (hue == null ? 3.5 : hue) - (d < 0 ? d * d * 1.2 : 0), s * (d < 0 ? 1 + d * 0.03 : 1 - d * 0.1), l + d * step * (d < 0 ? 1.25 : 0.85))); } return out; }

  const SKIN = ["#e6b698", "#d8a17e", "#c48a64", "#a66e49", "#855536", "#754c33"];
  const HAIR = { black: "#2a2526", dkbrown: "#472e20", brown: "#6e4830", auburn: "#99441f", blonde: "#c9a558", gray: "#8f8e8c", white: "#cfcdc6", salt: "#5c5a5c", red: "#b5391f" };
  const EYES = { brun: "#4a2e1e", noir: "#2a1c14", noisette: "#6a4a26", bleu: "#3d6290", vert: "#4a6e4a", gris: "#5f6a74" };
  const BGS = ["#243240", "#2a2f3e", "#22343a", "#33303c", "#2c3442", "#34302c"];
  const RIMS = ["#86b8dc", "#86b8dc", "#7fd0e0", "#e0a878", "#9ab4e8", "#f0b070"];
  const LIGHT = (() => { const v = [-0.42, -0.46, 0.78], m = Math.hypot(...v); return v.map((x) => x / m); })();

  // ---------------------------------------------------------------- traits déduits du look (stables)
  const CUTS = { short: ["crew", "quiff", "undercut", "crew"], buzz: ["buzz"], side: ["side", "slick", "side"], bald: ["bald", "crown"], receding: ["receding"], curly: ["curls", "curls", "bigcurls"], afro: ["afro", "afro", "locks", "bigafro"], long: ["long", "wavy", "fringe"], bun: ["bun"], bob: ["bob", "lob", "bob"], ponytail: ["ponytail"], braids: ["braids"], hijab: ["hijab"] };
  const TRAITS = ["scar_brow", "scar_cheek", "mole", "mole2", "freckles", "streak", "tattoo", "bags", "pierce_nose", "pierce_brow", "dimples", "birthmark", "ear1", "unibrow", "plaster", "rosy", "bigears", "gap", "chinDimple", "lazy"];
  PX.extra = function (L) {
    const h = CR.hash(JSON.stringify([L.g, L.age, L.skin, L.hc, L.hair, L.glasses, L.beard, L.shirt, L.outfit]));
    const r = (k, n) => Math.floor((((h >>> (k % 13)) ^ (h * (k * 2 + 7))) >>> 0) % 9973 / 9973 * n);
    const f = L.g === "f", age = L.age || 40, light = (L.skin || 0) <= 1, pick = (k, a) => a[r(k, a.length)];
    const cut0 = pick(11, CUTS[L.hair] || ["crew"]);
    const cut = cut0 === "crown" && age < 45 ? "bald" : cut0 === "bigafro" && age > 45 ? "afro" : cut0 === "undercut" && age > 50 ? "crew" : cut0;
    let trait = r(12, 100) < 62 ? pick(13, TRAITS) : null;
    if (trait === "freckles" && !light) trait = "mole"; if (trait === "rosy" && (!light || age < 45)) trait = "dimples"; if (trait === "streak" && (cut === "bald" || cut === "buzz" || cut === "hijab" || age < 28)) trait = "scar_brow"; if (trait === "ear1" && f) trait = "pierce_nose"; if (trait === "bags" && age < 30) trait = "chinDimple"; if ((trait === "tattoo" || trait === "pierce_brow" || trait === "plaster") && age > 55) trait = "bags";
    const wearOf = () => { const o = L.outfit || "shirt"; if (o !== "shirt") return o; const a = age < 32 ? ["hoodie", "tee", "jacket", "sweater", "hoodie", "shirtc", "tee"] : age < 58 ? ["shirtc", "sweater", "jacket", "blazer", "shirtc", "tee", "sweater"] : ["shirtc", "sweater", "cardigan", "blazer", "shirtc"]; return pick(14, a); };
    return {
      eye: light ? pick(1, ["brun", "bleu", "noisette", "vert", "gris", "brun"]) : pick(1, ["brun", "noir", "brun", "noisette"]),
      face: f ? pick(2, ["round", "round", "heart", "long", "square", "wide", "heart"]) : pick(2, ["square", "square", "round", "long", "wide", "heart", "square"]),
      weight: r(3, 100) < (age > 45 ? 22 : 10) ? 1 : 0,
      eyes: pick(4, ["open", "open", "open", "narrow", "droopy", "round", "open"]), gap: r(5, 3) === 0 ? 6 : 7,
      brow: f ? pick(6, ["thin", "normal", "arched", "arched", "thin"]) : pick(6, ["thick", "normal", "normal", "straight", "thick"]),
      nose: (L.skin || 0) >= 4 ? pick(7, ["wide", "wide", "small", "button", "long"]) : pick(7, ["small", "small", "long", "wide", "hook", "button", "long"]),
      mw: (f ? 3 : 4) + (r(8, 4) === 0 ? 1 : 0), lips: f ? 1 + r(9, 2) : r(9, 3) === 0 ? 1 : 0,
      cut, beard: L.beard === 1 ? pick(10, ["stubble", "stubble", "moustache", "goatee"]) : L.beard === 2 ? pick(10, ["full", "full", "fullshort", "goatee"]) : null,
      glasses: L.glasses ? (typeof L.glasses === "string" ? L.glasses : pick(15, f ? ["rect", "round", "cat", "thin", "round"] : ["rect", "round", "rect", "thin"])) : null,
      gcol: pick(16, ["#1e1e22", "#1e1e22", "#5a3a22", "#8a2a3a", "#2a3a5a", "#b08a3a"]),
      wear: wearOf(), trait,
      ear: L.earring ? pick(17, ["studs", "hoops", "studs", "drops"]) : null, necklace: f && r(18, 5) === 0, scarf: r(19, 22) === 0, scarfC: pick(24, ["#c8443a", "#2f6b6b", "#d9a03a", "#5b4a7a", "#3e5c3a", "#b05a7a"]), scarfC2: pick(25, ["#f0e0b0", "#f0e0b0", "#1e1e22", "#e8c66a"]), bonnet: age < 40 && r(20, 16) === 0 && cut !== "hijab" && !f,
      lipstick: f && r(21, 3) === 0, mood: pick(22, ["neutral", "neutral", "neutral", "thin", "smile", "down", "smirk", "neutral"]), bg: r(23, BGS.length),
    };
  };

  // ---------------------------------------------------------------- fiches des personnages récurrents
  // Chaque fiche part de l'histoire du personnage : ce qu'on retient de lui à l'audience ou au commissariat.
  PX.HAND = {
    // Présidente formaliste, ancienne juge d'instruction : chignon serré, demi-lunes au bout d'une chaînette, perles
    pr_aubriot: { face: "long", cut: "bun", glasses: "half", gcol: "#b08a3a", chain: true, brow: "thin", mood: "thin", wear: "robe", pearls: true, ear: "studs", lines: 2, eyes: "narrow", nose: "long", bg: 1 },
    // Président des comparutions immédiates, épuisé : cernes, barbe de la veille, bajoues, col défait
    pr_lacassagne: { face: "wide", weight: 1, cut: "receding", beard: "stubble", trait: "bags", brow: "thick", mood: "down", wear: "robe", eyes: "droopy", lids: 1, lines: 2, loose: true, nose: "wide", bg: 4 },
    // Présidente curieuse : boucles noires, mèche blanche, grandes lunettes d'écaille, un sourcil toujours levé
    pr_benkirane: { face: "heart", cut: "wavy", trait: "streak", glasses: "round", gcol: "#7a4a22", brow: "arched", browUp: 1, mood: "smirk", wear: "robe", ear: "hoops", lipstick: true, eyes: "round", bg: 3 },
    // Président sévère : raie blanche au cordeau, lunettes d'acier, joues creuses, ride du lion
    pr_dessaint: { face: "long", cut: "side", glasses: "thin", gcol: "#9aa0a8", brow: "frown", frownLine: true, hollow: true, mood: "thin", wear: "robe", lines: 2, eyes: "narrow", nose: "hook", bg: 1 },
    // Présidente du tribunal de police, patiente : carré à frange, fossettes, sourire
    pr_roquebert: { face: "round", cut: "fringe", cutLen: "bob", trait: "dimples", brow: "normal", mood: "smile", wear: "robe", ear: "studs", eyes: "round", nose: "button", bg: 5 },
    // Président de chambre à la cour d'appel : cheveux gris peignés, lunettes d'or, moustache soignée
    pr_cour: { face: "square", cut: "side", glasses: "thin", gcol: "#c9a24a", beard: "moustache", brow: "normal", mood: "thin", wear: "robe", lines: 1, nose: "long", bg: 1 },
    // Présidente de la cour d'assises : coupe courte, rouge à lèvres, robe rouge
    pr_assises: { face: "square", cut: "pixie", brow: "thick", lipstick: true, mood: "neutral", wear: "robeR", ear: "studs", eyes: "open", lines: 1, bg: 3 },
    // Président de la cour criminelle : crâne ras, bouc poivre et sel, lunettes noires, regard bienveillant
    pr_ccd: { face: "round", cut: "buzz", beard: "goatee", beardC: "salt", glasses: "rect", gcol: "#16161a", brow: "thick", mood: "smile", wear: "robe", nose: "wide", bg: 2 },
    // Présidente de la chambre de l'instruction : carré gris net, lunettes papillon bleu nuit, perles
    pr_chins: { face: "heart", cut: "bob", glasses: "cat", gcol: "#2a2a5a", brow: "thin", lipstick: true, mood: "thin", wear: "robe", pearls: true, lines: 1, eyes: "narrow", bg: 0 },
    // Jeune juge d'instruction débordé : épi, cernes, cravate desserrée
    ji_vauclair: { face: "long", cut: "quiff", glasses: "rect", gcol: "#3a3a40", trait: "bags", beard: "stubble", brow: "normal", mood: "neutral", wear: "suit", tie: "#2f4b6e", loose: true, cloth: "#3a4250", bg: 4 },
    // Juge d'instruction curieuse : queue de cheval, foulard de soie, grain de beauté
    ji_ferraud: { face: "heart", cut: "ponytail", trait: "mole", brow: "arched", mood: "smile", wear: "blazer", cloth: "#5a3a5e", scarf: true, scarfC: "#d9843a", ear: "studs", eyes: "round", bg: 5 },
    // JLD sévère : chauve, sourcils en broussaille, paupières lourdes, bajoues
    jld_pimentel: { face: "square", weight: 1, cut: "bald", brow: "bushy", lids: 1, mood: "down", wear: "suit", tie: "#6a2a2a", cloth: "#2e3038", lines: 2, nose: "wide", eyes: "narrow", bg: 1 },
    // JLD attentive : longs cheveux noirs, lunettes rouges relevées sur la tête, créoles
    jld_cherkaoui: { face: "round", cut: "long", headGlasses: true, gcol: "#a8283a", brow: "arched", mood: "smile", wear: "blazer", cloth: "#6a2a3a", ear: "hoops", lipstick: true, eyes: "open", bg: 3 },
    // Substitute de permanence : chignon fait à la hâte, cernes, oreillette du téléphone
    pq_delahaye: { face: "heart", cut: "bun", messy: true, trait: "bags", earpiece: true, brow: "thin", mood: "neutral", wear: "robe", eyes: "open", bg: 4 },
    // Substitut sévère : raie gominée, lunettes noires, mâchoire serrée
    pq_riboulet: { face: "square", cut: "slick", glasses: "rect", gcol: "#16161a", brow: "frown", frownLine: true, mood: "thin", wear: "robe", hollow: true, eyes: "narrow", bg: 1 },
    // Substitute ouverte : chignon haut, créoles, fossettes
    pq_haddou: { face: "round", cut: "bun", high: true, trait: "dimples", brow: "arched", mood: "smile", wear: "robe", ear: "hoops", eyes: "round", lipstick: true, bg: 5 },
    // Avocat général : couronne de cheveux blancs, demi-lunes d'or, sourcils blancs épais, robe rouge
    pq_ag: { face: "wide", weight: 1, cut: "crown", glasses: "half", gcol: "#c9a24a", brow: "bushy", mood: "thin", wear: "robeR", lines: 2, nose: "hook", bg: 3 },
    // Capitaine procédurière : queue de cheval tirée, lèvres pincées, brassard
    opj_marchetti: { face: "long", cut: "ponytail", tight: true, brow: "straight", mood: "thin", wear: "opj", cloth: "#27324a", eyes: "narrow", nose: "long", bg: 2 },
    // Lieutenant bavard : sourire en coin, barbe de trois jours, blouson et carte autour du cou
    opj_rocher: { face: "square", cut: "quiff", beard: "stubble", brow: "normal", mood: "smirk", wear: "jacket", cloth: "#4a3226", inner: "#7d848c", lanyard: true, trait: "chinDimple", eyes: "open", bg: 2 },
    // Brigadier-chef pressant : crâne ras, barbe courte, cicatrice au sourcil, uniforme
    opj_benali: { face: "square", cut: "buzz", beard: "fullshort", trait: "scar_brow", brow: "frown", mood: "down", wear: "uniform", eyes: "narrow", bg: 2 },
    // Adjudant de gendarmerie : brosse grise, moustache, teint hâlé
    opj_gaudin: { face: "square", cut: "crew", beard: "moustache", brow: "thick", mood: "neutral", wear: "gend", lines: 1, tan: true, nose: "wide", bg: 0 },
    // Ténor du barreau : crinière argentée rejetée en arrière, hâle, sourire sûr de lui
    av_villeneuve: { face: "square", cut: "mane", brow: "thick", mood: "smirk", wear: "robe", epi: true, tan: true, lines: 1, eyes: "open", nose: "hook", trait: "chinDimple", bg: 5 },
    // Jeune avocate : grandes lunettes rondes, taches de rousseur, l'air de réviser son dossier
    av_tessier: { face: "heart", cut: "long", glasses: "round", gcol: "#3a3a40", trait: "freckles", brow: "worried", mood: "neutral", wear: "robe", eyes: "round", nose: "button", bg: 0 },
    // Avocat des renvois : front dégarni, moustache, double menton, petit sourire
    av_pernot: { face: "round", weight: 1, cut: "receding", glasses: "rect", gcol: "#5a3a22", beard: "moustache", brow: "normal", mood: "smirk", wear: "robe", loose: true, bg: 4 },
    // Juge d'instruction du pôle criminel, vingt ans de métier : carré auburn strict, écaille, ride du lion
    ji_kessler: { face: "long", cut: "bob", glasses: "rect", gcol: "#5a3a22", brow: "frown", frownLine: true, lipstick: "#8a2a34", mood: "thin", wear: "blazer", cloth: "#26262c", inner: "#e9e6de", ear: "studs", lines: 1, eyes: "narrow", bg: 1 },
    // Juge d'instruction des mineurs : barbe courte, sourire, pull sous la veste
    ji_mineurs: { face: "round", cut: "crew", beard: "fullshort", brow: "normal", mood: "smile", wear: "jacket", cloth: "#3a4a5a", inner: "#b8a888", eyes: "open", trait: "dimples", bg: 2 },
    // Juge de la criminalité organisée : cheveux gris tirés, lunettes fines, cernes de quarante tomes
    ji_jirs: { face: "heart", cut: "ponytail", tight: true, glasses: "thin", gcol: "#9aa0a8", trait: "bags", brow: "thin", mood: "neutral", wear: "blazer", cloth: "#4a4e58", lines: 2, eyes: "narrow", bg: 0 },
    // Juge des enfants : coupe courte, lunettes rondes turquoise, cardigan, sourire
    je_morin: { face: "round", cut: "pixie", glasses: "round", gcol: "#1f8a94", brow: "arched", mood: "smile", wear: "cardigan", cloth: "#b05a3a", inner: "#e9e2d0", necklace: true, eyes: "round", bg: 5 },
    // Président de la cour d'assises des mineurs : front dégarni, barbe grise courte, robe rouge
    pr_cam: { face: "long", cut: "receding", glasses: "rect", gcol: "#3a3a40", beard: "fullshort", brow: "normal", mood: "neutral", wear: "robeR", lines: 1, bg: 3 },
    // Présidente de la cour d'assises spécialement composée : chignon gris, lunettes papillon noires, perles
    pr_assises_spe: { face: "square", cut: "bun", glasses: "cat", gcol: "#16161a", brow: "thin", mood: "thin", wear: "robeR", pearls: true, lines: 2, eyes: "narrow", bg: 3 },
    // Président des assises d'appel, sévère : raie blanche, sourcils en broussaille, joues creuses
    pr_assises_appel: { face: "long", cut: "side", brow: "bushy", hollow: true, frownLine: true, mood: "down", wear: "robeR", lines: 2, nose: "hook", eyes: "narrow", bg: 3 },
    // Substitute de la section criminelle : frange brune, rouge à lèvres, regard qui ne lâche pas
    pq_criminel: { face: "heart", cut: "fringe", brow: "straight", lipstick: true, mood: "thin", wear: "robe", eyes: "narrow", ear: "studs", bg: 1 },
    // La mentore, trente-huit ans de barre, extravagante : cheveux blancs en brosse, énormes lunettes rouges,
    // rouge à lèvres vif, boucles turquoise, foulard de soie sur la robe
    mentor: { face: "heart", cut: "spiky", glasses: "biground", gcol: "#d8282e", brow: "arched", browUp: 1, lipstick: "#d02030", mood: "smile", wear: "robe", scarf: true, scarfC: "#e8892a", scarfC2: "#1f9aa8", ear: "bigdrops", earC: "#1fa8b4", lines: 2, eyes: "round", trait: "mole", bg: 5, rim: "#f0b070" },
  };

  // ---------------------------------------------------------------- coupes de cheveux
  // v : volume au sommet ; line(dx) : ligne du front par rapport au centre du visage ; side : jusqu'où descendent les côtés
  const ST = {
    crew: { v: 1.8, line: (dx) => -10.5 + (dx * dx) / 70 - (Math.abs(dx) > 9 ? 1.5 : 0), side: 1, tex: "short", fade: 1 },
    quiff: { v: 3.4, line: (dx) => -11 + (dx * dx) / 60 + (dx < -2 ? 0.6 : 0), side: 0, tex: "sweep", fade: 1, top: 1.5 },
    undercut: { v: 2.8, line: (dx) => -10.5 + (dx * dx) / 90, side: -6, tex: "sweep", fade: 0, shaved: 3 },
    buzz: { v: 0.9, line: (dx) => -11 + (dx * dx) / 80, side: 1, tex: "stub", fade: 1, thin: 1 },
    side: { v: 2.2, line: (dx) => -10 + (dx > -5 ? (dx + 5) * 0.14 : (-5 - dx) * 0.5), side: 1, tex: "part", fade: 1 },
    slick: { v: 1.7, line: (dx) => -11.6 + (dx * dx) / 46, side: 2, tex: "back", fade: 1 },
    mane: { v: 3.2, line: (dx) => -11.4 + (dx * dx) / 50, side: 9, tex: "back", wide: 1.5 },
    spiky: { v: 3, line: (dx) => -10.5 + (dx * dx) / 80, side: 0, tex: "spike", fade: 1 },
    bald: null,
    crown: { v: 1.6, line: () => -99, side: 3, tex: "short", crown: 1 },
    receding: { v: 1.5, line: (dx) => -11.5 - 4.2 * Math.exp(-Math.pow(Math.abs(dx) - 8, 2) / 9), side: 2, tex: "short", fade: 1 },
    curls: { v: 2.6, line: (dx) => -10.5 + (dx * dx) / 90, side: 0, tex: "curl", bumpy: 1 },
    bigcurls: { v: 4.2, line: (dx) => -9.5 + (dx * dx) / 110, side: 12, tex: "curl", bumpy: 1, wide: 2.5 },
    afro: { v: 3.6, line: (dx) => -10.5 + (dx * dx) / 90, side: -1, tex: "coil", bumpy: 1, fade: 1 },
    bigafro: { v: 7, line: (dx) => -10 + (dx * dx) / 110, side: 5, tex: "coil", bumpy: 1, wide: 4 },
    locks: { v: 3, line: (dx) => -10 + (dx * dx) / 100, side: 8, tex: "lock", wide: 1.4 },
    pixie: { v: 2.4, line: (dx) => -8.5 + dx * 0.22 + (dx > 5 ? (dx - 5) * 0.8 : 0), side: 0, tex: "part", fade: 1 },
    long: { v: 3.6, line: (dx) => -12.5 + Math.abs(dx - 1.5) * 0.62, side: 63, tex: "long", back: 1 },
    wavy: { v: 4, line: (dx) => -11.5 + (dx > -4 ? (dx + 4) * 0.3 : (-4 - dx) * 0.9), side: 63, tex: "wave", back: 1, wide: 1.2 },
    fringe: { v: 3.6, line: (dx) => -6.5 + ((Math.round(dx) & 3) === 0 ? 0.8 : 0), side: 63, tex: "long", back: 1 },
    bob: { v: 3.2, line: (dx) => -7.5 + dx * 0.16 + (dx > 6 ? (dx - 6) * 0.7 : 0), side: 14, tex: "bob", back: 1 },
    lob: { v: 3.2, line: (dx) => -12 + Math.abs(dx + 2) * 0.6, side: 21, tex: "bob", back: 1 },
    bun: { v: 1.6, line: (dx) => -11.2 + (dx * dx) / 70, side: 0, tex: "back", fade: 1, bun: 1 },
    ponytail: { v: 1.8, line: (dx) => -11.2 + (dx * dx) / 70, side: 0, tex: "back", fade: 1, tail: 1 },
    braids: { v: 2.2, line: (dx) => -10.8 + (dx * dx) / 90, side: 63, tex: "braid", back: 1, strands: 1 },
    hijab: { v: 3, line: () => -99, side: 63, tex: "cloth", veil: 1 },
  };

  // ---------------------------------------------------------------- la fiche complète d'un visage
  function specOf(L) {
    const X = PX.extra(L), Hd = (L.hand && PX.HAND[L.hand]) || {};
    const S = Object.assign({ g: L.g || "m", age: L.age || 40, skin: cl(L.skin == null ? 1 : L.skin, 0, 5), hc: L.hc || "brown", shirt: L.shirt || "#2f4b6e" }, X, Hd);
    if (L.hand && !Hd.trait) S.trait = Hd.trait || null;
    if (L.hand && PX.HAND[L.hand]) { for (const k of ["glasses", "beard", "ear", "scarf", "necklace", "bonnet", "lipstick"]) if (!(k in Hd)) S[k] = k === "glasses" || k === "beard" || k === "ear" ? null : false; S.weight = Hd.weight || 0; }
    if (Hd.cutLen === "bob") S.cutSide = 14;
    if (S.wear === "shirt") S.wear = "shirtc";
    return S;
  }

  // ---------------------------------------------------------------- dessin
  function draw(L, expr, blink, breath) {
    const S = specOf(L);
    const cv = document.createElement("canvas"); cv.width = cv.height = N;
    const ctx = cv.getContext("2d"), img = ctx.createImageData(N, N), D = img.data;
    const kind = new Uint8Array(N * N), tone = new Int8Array(N * N); // 0 fond, 1 peau, 2 cheveux, 3 tissu, 4 détail
    const set = (x, y, c, k) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= N || y >= N) return; const i = (y * N + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255; if (k != null) kind[y * N + x] = k; };
    const get = (x, y) => { const i = (y * N + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };
    const blend = (x, y, c, a, k) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= N || y >= N) return; set(x, y, mixc(get(x, y), c, a), k); };
    const K = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : kind[y * N + x]);

    const fem = S.g === "f", age = S.age, E = expr || "neutral";
    const CY = 28 + (E === "honte" ? 1 : E === "defi" ? -1 : 0), BR = breath ? -1 : 0;
    const skBase = S.tan ? mixc(rgb(SKIN[S.skin]), [176, 110, 70], 0.4) : rgb(SKIN[S.skin]);
    const sk = ramp(skBase, 6, 3, 0.082 - S.skin * 0.003, 2.6);
    const hcol = HAIR[S.hc] || S.hc, hr = ramp(hcol, 5, 2, S.hc === "black" ? 0.06 : 0.085, 2);
    const lineCol = mixc(sk[0], [40, 14, 18], 0.45);

    // ---- fond
    const bg = ramp(typeof S.bg === "string" ? S.bg : BGS[S.bg || 0], 5, 2, 0.045, -2), rim = rgb(S.rim || RIMS[typeof S.bg === "number" ? S.bg : 0]);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const d = Math.hypot(x - 14, y - 16) / 60 + bayer(x, y) * 0.1; set(x, y, bg[cl(4 - Math.floor(d * 5.2), 0, 4)], 0); }

    // ---- géométrie de la tête
    const F = { round: [0.4, 0, 0.22, 2.1], square: [0.2, 0.3, 0.12, 2.7], long: [-0.9, 1.3, 0.3, 2.2], heart: [0, 0, 0.42, 2.0], wide: [1.2, -0.7, 0.2, 2.3] }[S.face] || [0, 0, 0.22, 2.2];
    const RX = (fem ? 13.4 : 14.2) + F[0] + (S.weight ? 0.9 : 0), RYT = 19, RYB = (fem ? 18.6 : 19.4) + F[1], jk = Math.max(0.06, F[2] - (S.weight ? 0.1 : 0)), jp = F[3] + (S.weight ? 0.2 : 0);
    const inHead = (x, y) => { const dx = x - CX + 0.5, dy = y - CY; if (dy < 0) return (dx * dx) / (RX * RX) + (dy * dy) / (RYT * RYT) <= 1; const rx = RX * (1 - jk * Math.pow(dy / RYB, 2)); return Math.pow(Math.abs(dx) / rx, jp) + Math.pow(dy / RYB, jp) <= 1; };
    const GAP = S.gap || 7, EY = CY, EXL = CX - GAP, EXR = CX + GAP - 1, NY = CY + 7 + (S.nose === "long" || S.nose === "hook" ? 1 : S.nose === "button" ? -1 : 0), MY = CY + 12;
    const shadeHead = (x, y) => {
      const dx = x - CX + 0.5, dy = y - CY, nx = dx / 17, ny = dy / 23, nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny));
      let d = 0.2 + 0.8 * (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const g = (cx, cy, r) => Math.exp(-((x - cx) * (x - cx) + (y - cy) * (y - cy)) / (r * r));
      d -= 0.2 * g(EXL + 0.5, EY - 0.5, 3.6) + 0.22 * g(EXR + 0.5, EY - 0.5, 3.6);
      d += 0.12 * g(CX - 3, CY - 9, 5);
      d += 0.16 * g(CX - 8.5, CY + 5.5, 3.2) + 0.08 * g(CX + 8, CY + 5.5, 2.8);
      if (Math.abs(x - (CX - 1)) <= 0.6 && y > EY + 1 && y < NY) d += 0.1;
      d -= 0.2 * g(CX + 2.6, NY - 2, 2.2) + 0.22 * g(CX, NY + 2.2, 1.9) + 0.16 * g(CX, MY + 3.4, 2.3);
      d += 0.1 * g(CX - 1, MY + 6.5, 2.4);
      if (S.hollow) d -= 0.12 * g(CX - 8, CY + 9, 3) + 0.14 * g(CX + 8, CY + 9, 3);
      if (S.weight) d -= 0.1 * g(CX - 9, CY + 13, 3) + 0.12 * g(CX + 9, CY + 13, 3) - 0.08 * g(CX, CY + 17, 3);
      if (E === "smile" || E === "soulage") d += 0.08 * g(CX - 8, CY + 6, 2.6) + 0.05 * g(CX + 8, CY + 6, 2.4);
      return d;
    };
    const toneOf = (d) => (d < 0.2 ? 0 : d < 0.4 ? 1 : d < 0.58 ? 2 : d < 0.8 ? 3 : d < 1.0 ? 4 : 5);
    const skinPx = (x, y, t) => { if (x < 0 || y < 0 || x >= N || y >= N) return; t = cl(t, 0, 5); tone[y * N + x] = t; set(x, y, sk[t], 1); };
    const adj = (x, y, dt) => { x = Math.round(x); y = Math.round(y); if (K(x, y) === 1) skinPx(x, y, tone[y * N + x] + dt); };

    // ---- cheveux : où ils poussent, comment ils prennent la lumière
    const NW = (fem ? 6 : 7.8) + (S.weight ? 1.2 : 0);
    const st = S.cut, H0 = ST[st] || null, HV = H0 ? H0.v : 0, wide = (H0 && H0.wide) || 0;
    const sideEnd = H0 ? (S.cutSide != null ? CY + S.cutSide : H0.side >= 60 ? 63 : CY + H0.side) : 0;
    const hairline = (x) => CY + H0.line(x - CX + 0.5);
    const inVol = (x, y) => { const dx = x - CX + 0.5, dy = y - (CY - 1), rx = RX + HV * 0.9 + wide, ry = dy < 0 ? RYT + HV + (H0.top || 0) : RYB; let e = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry); if (H0.bumpy) e -= (h2(x >> 1, y >> 1) - 0.5) * 0.13; if (H0.tex === "spike" && dy < 0) e -= ((x + (y >> 1)) % 3 === 0 ? 0.1 : -0.02); return e <= 1; };
    const isHair = (x, y) => {
      if (!H0) return false;
      const dx = x - CX + 0.5, head = inHead(x, y);
      if (H0.crown) return inVol(x, y) && y > CY - 9 && y <= sideEnd && (!head || Math.abs(dx) > RX - 3.2) && y > CY - 10 + (RX - Math.abs(dx)) * 0.2;
      if (H0.veil) { const inner = (dx * dx) / Math.pow(RX - 2.6, 2) + Math.pow((y - CY - 1) / (RYB - 1.5), 2) <= 1 && y > CY - 11; if (inner) return false; if (y < CY + 14) return inVol(x, y) || (Math.abs(dx) < RX + 3.5 && y >= CY); return Math.abs(dx) < RX + 4 + (y - CY - 14) * 0.5; }
      if (head) return y < hairline(x);
      if (S.cutSide == null && H0.side >= 60) { if (y < CY + 12) return inVol(x, y) || (Math.abs(dx) < RX + HV + wide + Math.sin(y * 0.55) * 1.1 && y >= CY); const w = RX + HV + wide + 1.4 + Math.sin(y * 0.5 + (dx > 0 ? 1 : 0)) * (H0.tex === "wave" ? 2.2 : 1.3) + (y - CY - 12) * 0.05; return Math.abs(dx) < w && Math.abs(dx) > NW - 0.6 - (y > 50 ? 1 : 0); }
      if (H0.tex === "bob" || (S.cutSide != null)) { if (y > sideEnd) return false; const w = RX + HV - (y > sideEnd - 5 ? (y - sideEnd + 5) * 0.55 : 0); return y < CY ? inVol(x, y) : Math.abs(dx) < w; }
      if (H0.tex === "lock" || st === "mane" || st === "bigcurls" || st === "bigafro") { if (y > sideEnd) return false; return y < CY ? inVol(x, y) : Math.abs(dx) < RX + HV * 0.8 + wide - (y - CY) * 0.12 && (inVol(x, y) || y >= CY); }
      if (H0.shaved && y > CY - 7) return false;
      return y <= sideEnd && inVol(x, y);
    };
    const shadeHair = (x, y) => {
      const dx = x - CX + 0.5, dy = y - (CY - 2), nx = dx / (RX + HV + wide + 3), ny = dy / (RYT + HV + 5), nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - Math.min(1, ny * ny)));
      let d = 0.22 + 0.78 * (nx * LIGHT[0] + Math.max(-1, ny) * LIGHT[1] + nz * LIGHT[2]);
      const t = H0.tex;
      if (t === "coil" || t === "curl") d += (h2(x, y) - 0.5) * 0.34 + (h2(x >> 1, (y >> 1) + 9) - 0.5) * (t === "curl" ? 0.34 : 0.22);
      else if (t === "short" || t === "stub") d += (h2(x, y) - 0.5) * 0.2;
      else if (t === "lock") d += Math.sin(dx * 2.1) * 0.22 + ((y + Math.round(dx)) % 4 === 0 ? -0.12 : 0);
      else if (t === "braid") d += Math.sin(dx * 2.4) * 0.16 + ((y + (Math.round(dx / 2.6) & 1) * 2) % 4 < 2 ? 0.1 : -0.1);
      else if (t === "spike") d += ((x * 3 + y) % 4 === 0 ? 0.18 : -0.04) + (h2(x, y) - 0.5) * 0.12;
      else if (t === "cloth") d += Math.sin(dx * 0.5 + y * 0.35) * 0.08;
      else { const flow = t === "long" ? dx * 0.9 + Math.sin(y * 0.33) * 2.2 : t === "wave" ? dx * 0.8 + Math.sin(y * 0.42) * 3.4 : t === "bob" ? dx * 1.1 - y * 0.25 : t === "back" ? dx * 0.5 + y * 1.3 : t === "sweep" ? dx * 0.9 - y * 0.9 : dx * 1.0 + y * 0.5; d += Math.sin(flow * 1.25) * 0.2; if (y > CY + 6) d -= 0.1; }
      return d;
    };
    const hairTone = (d) => (d < 0.22 ? 0 : d < 0.44 ? 1 : d < 0.66 ? 2 : d < 0.9 ? 3 : 4);
    const veil = H0 && H0.veil ? ramp(S.veilC || S.shirt, 5, 2, 0.07, 2) : null;
    const hairCol = (x, y, t) => {
      if (veil) return veil[cl(t, 0, 4)];
      let c = hr[cl(t, 0, 4)];
      if (S.trait === "streak" && Math.abs(x - (CX + 4 + (y - CY + 12) * 0.25)) < 1.3 && y < CY + 6) c = mixc(c, [228, 226, 218], 0.75);
      if (age > 46 && S.hc !== "gray" && S.hc !== "white" && Math.abs(x - CX + 0.5) > RX - 4 && y > CY - 9 && y < CY + 3 && h2(x, y) < 0.55) c = mixc(c, [176, 174, 170], 0.5);
      return c;
    };

    // ---- 1. cheveux de derrière
    if (H0 && (H0.back || st === "mane" || st === "bigcurls" || st === "bigafro" || st === "locks")) for (let y = 2; y < N; y++) for (let x = 2; x < 62; x++) if (!inHead(x, y) && isHair(x, y)) set(x, y, hairCol(x, y, hairTone(shadeHair(x, y) - 0.16)), 2);
    if (H0 && H0.tail) for (let y = CY - 6; y < CY + 26; y++) for (let x = CX + 9; x < CX + 22; x++) { const cx0 = CX + 15 + Math.sin((y - CY) * 0.22) * 2.2 + (S.tight ? 1 : 0), w = (S.tight ? 2.6 : 3.6) - Math.max(0, y - CY - 16) * 0.3; if (Math.abs(x - cx0) < w) set(x, y, hairCol(x, y, hairTone(0.5 - (x - cx0) / w * 0.3 + Math.sin(y * 0.9) * 0.1)), 2); }

    // ---- 2. cou
    for (let y = CY + 12; y < 57; y++) for (let x = 16; x < 48; x++) { const dx = x - CX + 0.5; if (Math.abs(dx) > NW + (y > 49 ? (y - 49) * 0.7 : 0)) continue; let d = 0.66 - (dx / NW) * 0.3; if (y < CY + 23) d -= 0.34 - (y - CY - 12) * 0.014; skinPx(x, y, toneOf(d)); }
    if (S.trait === "tattoo") { for (const [a, b] of [[5, 46], [6, 47], [5, 48], [4, 47], [6, 49], [7, 48], [4, 49]]) if (K(CX + a, b + (CY - 28)) === 1) blend(CX + a, b + (CY - 28), [30, 50, 70], 0.7, 1); }

    // ---- 3. buste et tenue
    const SW = (fem ? 28 : 31) + (S.weight ? 1 : 0), TY = 49 + BR, topY = (dx) => TY + Math.min(Math.abs(dx), 9) * 0.2 + Math.pow(Math.max(0, Math.abs(dx) - 16), 2) * 0.07;
    const W = S.wear, shirtC = S.cloth || S.shirt;
    const CL = { robe: ramp("#2b2b34", 5, 2, 0.05, -3), robeR: ramp("#a02630", 5, 2, 0.065, -3), jacket: ramp(S.cloth || "#4a3a30", 5, 2, 0.07, 3), hoodie: ramp(shirtC, 5, 2, 0.07, 2), sweater: ramp(shirtC, 5, 2, 0.06, 3), cardigan: ramp(shirtC, 5, 2, 0.06, 3), tee: ramp(shirtC, 5, 2, 0.07, 2), shirtc: ramp(shirtC, 5, 2, 0.07, 2), suit: ramp(S.cloth || "#39404e", 5, 2, 0.06, -2), blazer: ramp(S.cloth || "#3f3a48", 5, 2, 0.06, -2), uniform: ramp("#1f2c4c", 5, 2, 0.06, -2), opj: ramp(S.cloth || "#27324a", 5, 2, 0.06, -2), gend: ramp("#7fa6d0", 5, 2, 0.06, -2), scrubs: ramp("#3f9a94", 5, 2, 0.07, 2) }[W] || ramp(shirtC, 5, 2, 0.07, 2);
    const inner = ramp(S.inner || (W === "suit" ? "#e9e6de" : W === "blazer" ? "#d9d2c4" : "#8a8f98"), 5, 2, 0.07, 2), white = ramp("#eeeae0", 4, 2, 0.07, 2);
    const q = (d) => CL[cl(Math.floor(d * 5), 0, 4)];
    for (let y = 44; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = x - CX + 0.5, ax = Math.abs(dx), ty = topY(dx);
      if (ax > SW || y < ty) continue;
      let d = 0.58 - (dx / SW) * 0.36 - (y - 52) * 0.006, c, yy = y - BR;
      const skinV = (hw, depth) => { if (ax < hw - (yy - 49) * (hw / depth) && yy < 49 + depth) { skinPx(x, y, toneOf(0.5 - (dx / 8) * 0.3 - 0.1)); return true; } return false; };
      if (W === "robe" || W === "robeR") {
        d += Math.sin(dx * 0.9 + (yy - 50) * 0.12) * 0.1; if (ax > 19) d -= 0.08;
        c = q(d);
        if (W === "robeR" && ax > 5 && ax < 9.5) c = ramp("#1e1e24", 5, 2, 0.05, 0)[cl(Math.floor(d * 5), 0, 4)];
        if (ax < 4.6 && yy >= 50) c = white[cl((dx < -1.2 ? 3 : dx < 1.6 ? 2 : 1) - (Math.abs(dx) < 0.6 ? 1 : 0) - ((yy - 49) % 5 === 4 ? 1 : 0), 0, 3)];
        else if (y - ty < 2.2 && ax < 11) c = mixc([238, 234, 224], [150, 150, 160], dx > 2 ? 0.45 : 0.1);
        if (S.loose && dx > 3 && dx < 9 && y - ty < 3.4 && y - ty >= 2.2) c = mixc([238, 234, 224], [150, 150, 160], 0.4);
        if (S.epi && dx < -10 && dx > -16) { c = ramp("#22222a", 5, 2, 0.05, 0)[cl(Math.floor(d * 5) + 1, 0, 4)]; if ((yy - 50) % 9 > 6) c = [236, 232, 222]; }
      } else if (W === "jacket" || W === "opj" || W === "cardigan") {
        const open = (yy - 47) * (W === "cardigan" ? 0.38 : 0.5) + 1.5;
        if (ax < open) { c = inner[cl(Math.floor((d + 0.05 + Math.sin(dx * 1.4) * 0.05) * 5), 0, 4)]; if (W !== "cardigan" && Math.abs(dx) < 0.6) c = inner[1]; if (W === "cardigan" && skinV(5, 7)) continue; }
        else { d += Math.sin(dx * 0.7 + yy * 0.3) * 0.06 + (W === "jacket" ? (h2(x, y) - 0.5) * 0.08 : 0); if (ax - open < 1.4) d += dx < 0 ? 0.2 : 0.04; if (ax - open > 4 && ax - open < 5.2 && W !== "cardigan") d -= 0.16; c = q(d); if (W === "cardigan" && ((x + (y & 1)) & 1)) c = mixc(c, [0, 0, 0], 0.06); if (W === "opj" && dx < -19 && dx > -29 && yy > 56 && yy < 61) c = yy === 58 ? [40, 30, 20] : [240, 120, 30]; }
      } else if (W === "hoodie") {
        d += Math.sin(dx * 0.6 + yy * 0.25) * 0.05; const ring = Math.hypot(dx * 0.82, (yy - 50) * 1.25);
        if (ring > 8.2 && ring < 12.5) d += dx < 2 ? 0.14 : -0.02; if (ring > 12.5 && ring < 13.8) d -= 0.2; if (ring < 8.2) d -= 0.24;
        c = q(d);
        if ((x === CX - 3 || x === CX + 2) && yy > 55 && yy < 63) c = [226, 222, 212]; if ((x === CX - 3 || x === CX + 2) && yy === 63) c = [150, 150, 150];
      } else if (W === "suit" || W === "blazer") {
        const open = (yy - 48) * 0.42 + 1;
        if (ax < open) {
          if (W === "blazer" && skinV(5, 6)) continue;
          c = inner[cl(Math.floor((d + 0.2) * 5), 0, 4)];
          if (W === "suit" && S.tie !== false) { const tie = rgb(S.tie || "#6a2a2a"), drop = S.loose ? 2 : 0; if (ax < 1.8 + (yy - 52) * 0.06 && yy > 52 + drop) c = mixc(tie, [0, 0, 0], dx > 0 ? 0.25 : 0); if (yy >= 51 + drop && yy <= 53 + drop && ax < 2.4) c = mixc(tie, [255, 255, 255], 0.12); if (S.loose && yy < 52 && ax < 2.5 && skinV(3, 3)) continue; }
        } else { if (ax - open < 1.3) d += dx < 0 ? 0.18 : 0.02; if (ax - open > 5 && ax - open < 6.1 && yy < 60) d -= 0.15; c = q(d); }
      } else if (W === "shirtc") {
        d += Math.sin(dx * 0.7 + yy * 0.2) * 0.05;
        if (skinV(4.5, 6)) continue;
        c = q(d);
        const col = Math.abs(ax - (4.5 - (yy - 49) * 0.3)); if (yy < 56 && ax < 9 && ax > 4.2 - (yy - 49) * 0.75 && yy - 49 < 6 - (ax - 4) * 0.9) c = q(d + (dx < 0 ? 0.22 : 0.08));
        if (Math.abs(dx) < 0.6 && yy > 55) c = q(d - 0.14); if (Math.abs(dx) < 0.6 && yy > 56 && (yy & 3) === 0) c = [226, 222, 212];
      } else if (W === "uniform") {
        d += Math.sin(dx * 0.7 + yy * 0.2) * 0.04; c = q(d);
        if (ax < 3 && yy < 55) c = q(d - 0.2); if (Math.abs(dx) < 0.6) c = [150, 156, 170];
        if (ax > 15 && ax < 25 && y - ty < 3.2 && y - ty > 0.8) c = (Math.round(ax) & 1) ? [150, 190, 230] : [28, 40, 70];
        if (dx > 6 && dx < 20 && yy > 56 && yy < 60) c = [232, 236, 244]; if (dx > 7 && dx < 19 && yy === 58 && (x & 1)) c = [28, 40, 70];
        if (dx < -8 && dx > -13 && yy > 55 && yy < 60) c = yy === 57 ? [220, 60, 50] : dx < -10 ? [50, 80, 180] : [240, 240, 240];
      } else if (W === "gend") {
        d += Math.sin(dx * 0.7 + yy * 0.2) * 0.04; c = q(d);
        if (y - ty < 5 - ax * 0.05 && ax > 6) c = ramp("#1c2a4a", 5, 2, 0.06, 0)[cl(Math.floor(d * 5), 0, 4)]; if (Math.abs(y - ty - 5 + ax * 0.05) < 0.6 && ax > 6) c = [240, 240, 244];
        if (skinV(4, 5)) continue; if (yy < 56 && ax < 7 && ax > 3.4 - (yy - 49) * 0.6) c = ramp("#1c2a4a", 5, 2, 0.06, 0)[cl(Math.floor(d * 5) + 1, 0, 4)];
      } else if (W === "scrubs") {
        if (skinV(7, 9)) continue; d += Math.sin(dx * 0.6 + yy * 0.2) * 0.04; c = q(d); if (Math.abs(ax - (7 - (yy - 49) * 0.78)) < 1.1 && yy < 59) c = q(d + 0.16);
        if (dx > 9 && dx < 16 && yy > 56 && yy < 61) c = yy === 57 ? q(d - 0.2) : c;
      } else {
        d += ((x + (y & 1)) % 2 ? 0.03 : -0.03) * (W === "sweater" ? 1 : 0); const ring = Math.hypot(dx * 0.8, (yy - 49) * 1.5);
        if (ring > 7 && ring < 9.6) d += 0.13; if (ring >= 9.6 && ring < 10.6) d -= 0.14; if (ring <= 7) { skinPx(x, y, toneOf(0.5 - (dx / 8) * 0.3 - 0.12)); continue; }
        c = q(d);
      }
      set(x, y, c, 3); tone[y * N + x] = 0;
    }
    if (S.necklace) for (let dx = -6; dx <= 6; dx++) { const y = Math.round(52 + BR + 4.2 * (1 - (dx * dx) / 36)); if ((dx % 2 === 0 || Math.abs(dx) < 2) && K(CX + dx, y) === 1) set(CX + dx, y, dx < -1 ? [246, 214, 130] : [200, 160, 80], 4); }
    if (S.pearls) for (let dx = -7; dx <= 7; dx += 2) { const y = Math.round(50 + BR + 3.6 * (1 - (dx * dx) / 49)); set(CX + dx, y, dx < 0 ? [250, 246, 236] : [206, 200, 192], 4); }
    if (S.lanyard) for (let k = 0; k < 9; k++) { set(CX - 5 + (k >> 1), 52 + k + BR, [40, 70, 160], 4); set(CX + 4 - (k >> 1), 52 + k + BR, [30, 54, 130], 4); }
    if (S.scarf) { const c1 = ramp(S.scarfC || "#c8443a", 4, 2, 0.08, 3), c2 = rgb(S.scarfC2 || "#f0e0b0"); for (let y = 46 + BR; y < 56 + BR; y++) for (let x = 18; x < 46; x++) { const dx = x - CX + 0.5, ring = Math.hypot(dx * 0.78, (y - 47 - BR) * 1.25); if (ring > NW - 1.6 && ring < NW + 4.2 && y > 46 + BR) { let c = c1[cl(2 - Math.round(dx / 6) + ((y & 1) ? 0 : 0), 0, 3)]; if (((x + y * 2) % 5) === 0) c = c2; set(x, y, c, 3); } } for (let k = 0; k < 7; k++) { set(CX - 4 - (k >> 2), 55 + k + BR, c1[2], 3); set(CX - 3 - (k >> 2), 55 + k + BR, k % 3 === 0 ? c2 : c1[1], 3); set(CX - 2 - (k >> 2), 55 + k + BR, c1[1], 3); } }

    // ---- 4. oreilles
    const big = S.trait === "bigears" ? 1 : 0;
    if (!(H0 && H0.veil)) for (const s of [-1, 1]) for (let y = CY - big; y <= CY + 6; y++) for (let k = 0; k < 2 + big; k++) { if (k >= 1 && (y === CY - big || y === CY + 6)) continue; const px = Math.round(CX - 0.5 + s * (RX + k + 0.3)); if (!inHead(px, y) && K(px, y) !== 2) skinPx(px, y, s < 0 ? (k === 0 ? 2 : 3) : (k === 0 ? 0 : 1)); }

    // ---- 5. visage modelé
    for (let y = 4; y < 52; y++) for (let x = 12; x < 52; x++) if (inHead(x, y)) skinPx(x, y, toneOf(shadeHead(x, y)));

    // ---- 6. traits
    const eyeC = rgb(EYES[S.eye] || S.eye || EYES.brun), eyeW = E === "cry" ? [226, 226, 232] : [236, 230, 222], eyeWs = [196, 188, 184], lash = mixc(hr[0], [20, 14, 14], 0.6);
    const lashC = fem ? lash : mixc(sk[0], [30, 18, 18], 0.5), iris = mixc(eyeC, [255, 255, 255], 0.16), irisHi = mixc(eyeC, [255, 255, 255], 0.42), irisDk = mixc(eyeC, [0, 0, 0], 0.3);
    const shape = S.eyes || "open";
    // état des yeux selon l'expression
    let state = blink ? "closed" : E === "soulage" ? "happy" : E === "angry" || E === "defi" || E === "honte" || E === "cry" ? "low" : E === "worried" ? "wide" : shape === "narrow" || S.lids ? "low" : shape === "round" ? "wide" : "open";
    for (const [ex, side] of [[EXL, -1], [EXR, 1]]) {
      const lazy = S.trait === "lazy" && side > 0 && state === "open";
      for (let i = -2; i <= 2; i++) adj(ex + i, EY - 2, -1);
      if (state === "closed") { for (let i = -2; i <= 2; i++) { set(ex + i, EY + 1, lashC, 4); adj(ex + i, EY, 0); } if (fem) set(ex + side * 3, EY + 1, lash, 4); }
      else if (state === "happy") { for (let i = -2; i <= 2; i++) set(ex + i, EY + (Math.abs(i) === 2 ? 1 : 0), lashC, 4); }
      else {
        const low = state === "low" || lazy, ly = low ? EY : EY - 1;
        for (let i = -2; i <= 2; i++) set(ex + i, ly, lashC, 4);
        if (fem) { set(ex + side * 3, ly, lash, 4); set(ex + side * 3, ly - 1, lash, 4); } else set(ex + side * 3, ly + 1, sk[1], 4);
        if (shape === "droopy") { set(ex + side * 2, ly + 1, lashC, 4); }
        const gz = E === "honte" ? 0 : (S.gaze || 0), ix = ex + gz;
        if (!low) { for (let i = -2; i <= 2; i++) set(ex + i, EY, eyeW, 4); set(ix - 1, EY, irisHi, 4); set(ix, EY, [16, 11, 12], 4); set(ix + 1, EY, iris, 4); }
        for (let i = -2; i <= 2; i++) set(ex + i, EY + 1, Math.abs(i) === 2 ? (state === "wide" ? eyeW : sk[2]) : low ? eyeW : eyeWs, 4);
        if (low) { set(ix - 1, EY + 1, irisHi, 4); set(ix, EY + 1, [16, 11, 12], 4); set(ix + 1, EY + 1, iris, 4); } else { set(ix - 1, EY + 1, iris, 4); set(ix, EY + 1, irisDk, 4); set(ix + 1, EY + 1, irisDk, 4); }
        if (state === "wide") { for (let i = -1; i <= 1; i++) set(ex + i, EY + 2, eyeWs, 4); }
        if (shape === "droopy" && side * (ex - ex) === 0) set(ex + side * 2, EY + 1, sk[2], 4);
      }
      for (let i = -1; i <= 1; i++) adj(ex + i, EY + (state === "wide" ? 3 : 2), -1);
      if (age > 44 || S.trait === "bags") { const b = S.trait === "bags" ? 1 : 0; for (let i = -2; i <= 1; i++) adj(ex + i, EY + 3 + b, -1); if (b) for (let i = -1; i <= 1; i++) adj(ex + i, EY + 3, 1); }
      if (age > 50) { adj(ex + side * 4, EY + 1, -1); adj(ex + side * 5, EY, -1); }
      if (E === "cry") { for (let k = 0; k < (side < 0 ? 7 : 5); k++) set(ex + side * (k > 3 ? 2 : 1), EY + 3 + k, k % 3 === 1 ? [220, 240, 255] : [150, 205, 240], 4); set(ex + side, EY + 2, [220, 240, 255], 4); }
      // sourcils
      const gray = S.hc === "white" || S.hc === "gray";
      const bw = S.brow || "normal", bc = S.skin >= 4 ? [34, 24, 22] : mixc(hr[gray ? 1 : 0], [30, 22, 20], gray ? 0.4 : 0.3);
      for (let i = -3; i <= 3; i++) {
        const inr = -i * side; // > 0 vers le nez
        let by = EY - 6 + (state === "wide" ? -1 : 0) + (i * side === 3 ? 1 : 0);
        if (bw === "arched") by += Math.round(Math.abs(i) * 0.4);
        if (bw === "frown" && inr > 1) by += 1;
        if (bw === "worried") by += inr > 1 ? -1 : inr < -1 ? 1 : 0;
        if (E === "angry") by += inr > 1 ? 2 : inr > -1 ? 1 : 0;
        if (E === "worried" || E === "cry" || E === "honte") by += inr > 1 ? -1 : inr < -1 ? 1 : 0;
        if (E === "soulage" || E === "smile") by -= 1;
        if (E === "defi") by += side > 0 ? -2 + (inr > 1 ? 1 : 0) : inr > 0 ? 1 : 0;
        if (S.browUp && side > 0 && E === "neutral") by -= 1;
        set(ex + i, by, bc, 4);
        if (bw === "thick" || bw === "bushy" || (bw === "frown" && inr > -2)) set(ex + i, by + 1, mixc(bc, sk[1], 0.25), 4); else if (bw !== "thin") blend(ex + i, by + 1, bc, 0.35, 4);
        if (bw === "bushy") { set(ex + i, by - 1, mixc(bc, sk[2], 0.4), 4); if (i * side === 3) set(ex + i + side, by, bc, 4); }
        if (S.trait === "unibrow" && inr >= 3) { set(ex + i - side, by + 1, mixc(bc, sk[2], 0.3), 4); set(ex + i - side * 2, by + 1, mixc(bc, sk[2], 0.5), 4); }
      }
      if (S.trait === "scar_brow" && side > 0) { for (let k = 0; k < 4; k++) skinPx(ex + 2, EY - 8 + k, 5); set(ex + 2, EY - 6, sk[5], 4); set(ex + 2, EY - 5, sk[5], 4); }
      if (S.trait === "pierce_brow" && side < 0) { set(ex - 3, EY - 7, [230, 230, 236], 4); set(ex - 3, EY - 4, [180, 180, 190], 4); }
      if (S.trait === "plaster" && side > 0) { for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) set(ex - 1 + i, EY - 9 + j, i === 0 || i === 4 ? [226, 196, 160] : [240, 216, 184], 4); }
    }
    if (E === "angry" || S.frownLine) { adj(CX - 1, EY - 5, -1); adj(CX - 1, EY - 6, -1); adj(CX, EY - 5, -1); }
    // nez
    for (let y = EY + 1; y < NY; y++) adj(CX + 2, y, -1);
    const nw = S.nose === "wide" ? 3 : 2;
    set(CX - nw, NY + 1, lineCol, 4); set(CX + nw, NY + 1, lineCol, 4); adj(CX - nw - 1, NY, -1); adj(CX + nw + 1, NY, -1);
    skinPx(CX - 1, NY - 1, 5); skinPx(CX, NY - 1, 4); for (let i = -1; i <= 1; i++) adj(CX + i, NY + 1, -1);
    if (S.nose === "wide") { adj(CX - 4, NY, -1); skinPx(CX - 2, NY, 4); }
    if (S.nose === "hook") { skinPx(CX - 1, EY + 3, 5); skinPx(CX - 1, EY + 4, 5); adj(CX + 1, EY + 4, -1); adj(CX, NY + 1, -1); }
    if (S.nose === "button") { skinPx(CX - 1, NY - 2, 5); skinPx(CX, NY - 2, 5); }
    if (S.trait === "pierce_nose") set(CX - nw, NY, [236, 236, 244], 4);
    // joues
    if (E === "honte" || E === "cry" || S.trait === "rosy") for (const s of [-1, 1]) for (let i = -3; i <= 3; i++) for (let j = -1; j <= 1; j++) if (bayer(i + 9, j + 5) < 0.55 && K(CX + s * 8 + i, EY + 6 + j) === 1) blend(CX + s * 8 + i, EY + 6 + j, [214, 96, 90], S.skin >= 4 ? 0.22 : 0.4, 1);
    if (S.trait === "freckles") for (let k = 0; k < 14; k++) { const fx = CX + Math.round((h2(k, 3) - 0.5) * 20), fy = EY + 3 + Math.round(h2(k, 7) * 5); if (K(fx, fy) === 1 && Math.abs(fx - CX) > 1) blend(fx, fy, [150, 84, 50], 0.5, 1); }
    if (S.trait === "mole") set(CX + 6, MY - 2, lineCol, 4);
    if (S.trait === "mole2") { set(CX - 7, EY + 5, lineCol, 4); }
    if (S.trait === "birthmark") for (const [a, b] of [[8, 7], [9, 7], [9, 8], [8, 8], [10, 8], [9, 9]]) if (K(CX + a, EY + b) === 1) blend(CX + a, EY + b, [130, 50, 50], 0.4, 1);
    if (S.trait === "scar_cheek") { for (let k = 0; k < 5; k++) { skinPx(CX - 10 + k, EY + 6 + (k >> 1), 5); } adj(CX - 9, EY + 8, -1); }
    if (S.trait === "dimples" || E === "smile") { adj(CX - (S.mw || 4) - 3, MY, -1); adj(CX + (S.mw || 4) + 3, MY, -1); }
    if (S.trait === "chinDimple") { adj(CX, MY + 6, -1); adj(CX, MY + 7, -1); }
    // bouche
    const lipBase = typeof S.lipstick === "string" ? rgb(S.lipstick) : fem ? [176, 60, 70] : [150, 70, 66];
    const lip = mixc(sk[2], lipBase, typeof S.lipstick === "string" ? 0.95 : fem ? (S.lipstick ? 0.78 : 0.45) : 0.3), lipD = mixc(lip, [60, 20, 24], 0.55), dark = [58, 20, 24], teeth = [244, 240, 232];
    const mw = S.mw || (fem ? 3 : 4), full = (S.lips || 0) + (fem ? 0 : 0);
    const mood = E === "neutral" ? (S.mood || "neutral") : E;
    const M = (i, y, c) => set(CX + i, y, c, 4);
    const lower = (y, a) => { for (let i = -mw + 1 + (a || 0); i <= mw - 1 - (a || 0); i++) M(i, y, i < 0 ? mixc(lip, [255, 235, 225], 0.18) : lip); };
    const upper = (y) => { if (full >= 1 || fem) for (let i = -mw + 2; i <= mw - 2; i++) M(i, y, mixc(lip, sk[1], 0.3)); };
    if (mood === "talk") { for (let i = -mw; i <= mw; i++) M(i, MY, lipD); for (let i = -mw + 1; i <= mw - 1; i++) { M(i, MY + 1, Math.abs(i) < mw - 1 ? teeth : dark); M(i, MY + 2, Math.abs(i) < mw - 1 ? (Math.abs(i) < 2 ? [190, 90, 96] : dark) : lipD); } lower(MY + 3, 1); upper(MY - 1); }
    else if (mood === "talk2") { for (let i = -mw + 1; i <= mw - 1; i++) M(i, MY, lipD); for (let i = -mw + 2; i <= mw - 2; i++) M(i, MY + 1, dark); lower(MY + 2, 1); upper(MY - 1); }
    else if (mood === "smile") { for (let i = -mw; i <= mw; i++) M(i, Math.abs(i) === mw ? MY - 1 : MY, lipD); M(-mw - 1, MY - 1, lipD); M(mw + 1, MY - 1, lipD); if (E === "smile") { for (let i = -mw + 1; i <= mw - 1; i++) M(i, MY, teeth); for (let i = -mw + 1; i <= mw - 1; i++) M(i, MY - 1, lipD); M(-mw, MY, lipD); M(mw, MY, lipD); if (S.trait === "gap") M(0, MY, dark); lower(MY + 1, 0); } else lower(MY + 1, 1); }
    else if (mood === "soulage") { for (let i = -mw + 1; i <= mw - 1; i++) M(i, Math.abs(i) === mw - 1 ? MY - 1 : MY, lipD); lower(MY + 1, 1); }
    else if (mood === "smirk" || mood === "defi") { for (let i = -mw; i <= mw; i++) M(i, i >= mw - 1 ? MY - 1 : MY, lipD); M(mw + 1, MY - 2, lipD); lower(MY + 1, 1); adj(CX + mw + 2, MY - 1, -1); }
    else if (mood === "down" || mood === "worried") { for (let i = -mw + (mood === "worried" ? 1 : 0); i <= mw - (mood === "worried" ? 1 : 0); i++) M(i, Math.abs(i) >= mw - 1 ? MY + 1 : MY, lipD); lower(MY + 1, 2); }
    else if (mood === "angry") { for (let i = -mw; i <= mw; i++) M(i, Math.abs(i) === mw ? MY + 1 : MY, lipD); for (let i = -mw + 1; i <= mw - 1; i++) M(i, MY + 1, mixc(lip, sk[1], 0.4)); adj(CX - mw - 1, MY + 2, -1); adj(CX + mw + 1, MY + 2, -1); }
    else if (mood === "cry") { for (let i = -mw + 1; i <= mw - 1; i++) M(i, Math.abs(i) === mw - 1 ? MY + 1 : MY, lipD); for (let i = -mw + 2; i <= mw - 2; i++) M(i, MY + 1, dark); lower(MY + 2, 1); }
    else if (mood === "honte") { for (let i = -mw + 1; i <= mw - 1; i++) M(i, MY, lipD); lower(MY + 1, 2); }
    else if (mood === "thin") { for (let i = -mw; i <= mw; i++) M(i, MY, lipD); if (fem) lower(MY + 1, 2); }
    else { for (let i = -mw; i <= mw; i++) M(i, MY, lipD); lower(MY + 1, 0); if (full >= 2) { lower(MY + 2, 2); } upper(MY - 1); }
    // rides
    const lines = S.lines != null ? S.lines : age > 62 ? 2 : age > 48 ? 1 : 0;
    if (lines) { for (const s of [-1, 1]) { adj(CX + s * 5, NY + 1, -1); adj(CX + s * 6, NY + 2, -1); adj(CX + s * 6, NY + 3, -1); if (lines > 1) adj(CX + s * 7, NY + 4, -1); } for (let i = -4; i <= 3; i++) { if (i !== -1 && i !== 2) adj(CX + i, CY - 10, -1); if (lines > 1 && Math.abs(i) < 3 && i !== 0) adj(CX + i + 1, CY - 13, -1); } }

    // ---- 7. barbe
    const B = S.beard, bcol = S.beardC ? ramp(HAIR[S.beardC] || S.beardC, 5, 2, 0.08, 2) : hr;
    if (B) for (let y = NY; y < CY + 21; y++) for (let x = 14; x < 50; x++) {
      if (K(x, y) !== 1 || !inHead(x, y)) continue; const dx = x - CX + 0.5, ax = Math.abs(dx), dy = y - CY;
      const mou = y >= NY + 2 && y <= MY - 1 && ax < mw + 2.6, chin = dy > 14.5 && ax < 5.5, jawz = dy > 9.5 + Math.max(0, 5 - ax) * 0.9 || (ax > 8.5 && dy > 3), link = ax > mw && ax < mw + 2.6 && y >= MY - 1 && dy <= 15;
      const zone = B === "moustache" ? mou : B === "goatee" ? mou || chin || link : jawz || mou;
      if (!zone || (y >= MY && y <= MY + 2 && ax < mw + 0.6)) continue;
      if (B === "stubble") { if (h2(x, y) < 0.62) blend(x, y, bcol[1], 0.34, 1); }
      else { const d = shadeHead(x, y) + (h2(x, y) - 0.5) * 0.3; const c = bcol[hairTone(d - 0.1)]; if (B === "fullshort") blend(x, y, c, 0.78, 2); else set(x, y, c, 2); }
    }

    // ---- 8. cheveux
    if (H0) for (let y = 0; y < N; y++) for (let x = 2; x < 62; x++) {
      if (!isHair(x, y)) continue; const head = inHead(x, y);
      if (!head && K(x, y) === 2) continue;
      if (!head && H0.side >= 60 && !H0.veil && y > CY + 14 && K(x, y) === 0) continue;
      const fade = H0.fade && !head && y > sideEnd - 4 ? (sideEnd - y + 1) / 5 : 1;
      if (fade < 1 && bayer(x, y) > fade) continue;
      const t = hairTone(shadeHair(x, y));
      if (H0.thin && head) { set(x, y, mixc(sk[cl(tone[y * N + x], 0, 5)], hr[1], 0.5 + (h2(x, y) - 0.5) * 0.25), 2); continue; }
      set(x, y, hairCol(x, y, t), 2);
    }
    if (H0 && H0.shaved) for (let y = CY - 8; y <= CY + 2; y++) for (let x = 12; x < 52; x++) { const ax = Math.abs(x - CX + 0.5); if (ax > RX - 3 && ax < RX + 1 && (inHead(x, y) ? K(x, y) === 1 : false) && bayer(x, y) < 0.6) blend(x, y, hr[1], 0.5, 1); }
    if (H0 && H0.bun) { const by = S.high ? CY - 22 : CY - 20, br = S.messy ? 5.2 : 4.6; for (let y = by - 6; y <= by + 6; y++) for (let x = CX - 8; x <= CX + 8; x++) { const u = (x - CX + 0.5) / br, v = (y - by) / (br * 0.85); let e = u * u + v * v; if (S.messy) e -= (h2(x, y) - 0.5) * 0.5; if (e <= 1) set(x, y, hairCol(x, 0, hairTone(0.55 - u * 0.3 - v * 0.3 + Math.sin((x + y) * 1.2) * 0.14)), 2); } if (S.messy) for (const [a, b] of [[-12, -4], [-13, -2], [-13, 0], [12, -5], [13, -3], [-11, 2]]) set(CX + a, CY + b, hr[2], 2); }
    if (H0 && H0.strands) for (let y = CY + 2; y < 62; y++) for (const off of [-RX - 1.5, -RX + 1.5, RX - 1.5, RX + 1.5]) { const x = Math.round(CX - 0.5 + off + Math.sin(y * 0.2 + off) * 0.6); if (K(x, y) === 0 || K(x, y) === 3 || K(x, y) === 2) { set(x, y, hr[(y % 4 < 2) ? 3 : 1], 2); set(x + 1, y, hr[(y % 4 < 2) ? 1 : 2], 2); if (y % 9 === 8 && y > CY + 20) set(x, y, [226, 190, 90], 4); } }
    // ombre des cheveux sur le front
    for (let x = 14; x < 50; x++) for (let y = 6; y < 32; y++) if (K(x, y) === 1 && K(x, y - 1) === 2 && inHead(x, y)) { adj(x, y, -1); if (H0 && (H0.tex === "bob" || H0.side >= 60)) adj(x, y + 1, -1); }
    if (!H0 || st === "crown") { skinPx(CX - 5, CY - 14, 5); skinPx(CX - 4, CY - 14, 5); skinPx(CX - 5, CY - 13, 5); skinPx(CX - 6, CY - 13, 5); }
    if (S.bonnet) { const bc = ramp(S.shirt, 5, 2, 0.07, 2); for (let y = 0; y < CY - 6; y++) for (let x = 8; x < 56; x++) { const dx = x - CX + 0.5, e = (dx * dx) / Math.pow(RX + 2.4, 2) + Math.pow((y - CY + 1) / (RYT + 3.2), 2); if (e > 1) continue; const band = y > CY - 11; set(x, y, bc[cl(Math.floor((0.6 - dx / 30 - (band ? 0.12 : 0) + ((x & 1) && band ? 0.1 : 0) + (y < CY - 16 ? 0.05 : 0)) * 5), 0, 4)], 3); } for (let x = CX - 2; x <= CX + 1; x++) for (let y = CY - 24; y < CY - 21; y++) set(x, y, bc[3], 3); }

    // ---- 9. lunettes
    const G = S.glasses;
    if (G) {
      const gc = rgb(S.gcol || "#1e1e22"), half = G === "half", bigr = G === "biground", r4 = bigr ? 5 : 4, gy0 = half ? EY + 1 : EY - (bigr ? 4 : 3), gy1 = EY + (bigr ? 4 : 3), gyb = half ? EY + 1 : EY - 2, thin = G === "thin";
      for (const [ex, side] of [[EXL, -1], [EXR, 1]]) {
        for (let y = gy0; y <= gy1; y++) for (let x = ex - r4; x <= ex + r4; x++) {
          const edge = x === ex - r4 || x === ex + r4 || y === gy1 || (y === gy0 && !half), corner = (x === ex - r4 || x === ex + r4) && (y === gy1 || (y === gy0 && !half));
          if (corner && G !== "cat") continue; if (corner && G === "cat" && !(y === gy0 && x === ex + side * r4)) continue;
          if ((G === "round" || bigr) && ((x === ex - r4 + 1 || x === ex + r4 - 1) && (y === gy0 || y === gy1))) { set(x, y + (y === gy0 ? 1 : -1), gc, 4); continue; }
          if (edge) { if ((half && y < gy1 && y > gy0) || (thin && y !== gy0)) blend(x, y, gc, 0.75, 4); else set(x, y, gc, 4); } else if (!half) blend(x, y, G === "tinted" ? [40, 40, 50] : [200, 222, 240], G === "tinted" ? 0.55 : 0.07);
        }
        if (G === "cat") set(ex + side * (r4 + 1), gy0 - 1, gc, 4);
        if (!half) { blend(ex - 2, EY - 2, [255, 255, 255], 0.5, 4); blend(ex - 3, EY - 1, [255, 255, 255], 0.3, 4); }
      }
      for (let x = EXL + r4 + 1; x < EXR - r4; x++) set(x, gyb + 1, gc, 4);
      for (let x = EXL - r4 - 1; x > CX - RX - 3; x--) if (K(x, gyb) === 1) set(x, gyb, gc, 4);
      for (let x = EXR + r4 + 1; x < CX + RX + 2; x++) if (K(x, gyb) === 1) set(x, gyb, mixc(gc, [0, 0, 0], 0.3), 4);
      if (S.chain) for (const s of [-1, 1]) for (let k = 0; k < 14; k++) { const x = Math.round(CX - 0.5 + s * (RX + 0.5 - k * 0.12)), y = gyb + 2 + k; if (k % 2 === 0 && K(x, y) !== 2) set(x, y, [226, 196, 110], 4); }
    }
    if (S.headGlasses) { const gc = rgb(S.gcol || "#1e1e22"), y0 = CY - 15; for (const ex of [EXL, EXR]) { for (let x = ex - 3; x <= ex + 3; x++) { set(x, y0, gc, 4); set(x, y0 + 3, gc, 4); } for (let y = y0; y <= y0 + 3; y++) { set(ex - 3, y, gc, 4); set(ex + 3, y, gc, 4); } blend(ex - 1, y0 + 1, [220, 235, 250], 0.5, 4); blend(ex, y0 + 2, [160, 190, 220], 0.4, 4); } for (let x = EXL + 4; x < EXR - 3; x++) set(x, y0 + 1, gc, 4); }
    // boucles d'oreilles, oreillette
    const ear = S.ear;
    if (ear && !(H0 && H0.veil)) for (const s of [-1, 1]) {
      const ex = Math.round(CX - 0.5 + s * (RX + 1.3)), gold = s < 0 ? [240, 204, 110] : [170, 130, 60];
      if (ear === "hoops") for (const [a, b] of [[0, 0], [-1, 1], [-1, 2], [0, 3], [1, 2], [1, 1]]) set(ex + a, CY + 7 + b, gold, 4);
      else if (ear === "drops") { set(ex, CY + 7, gold, 4); set(ex, CY + 8, gold, 4); set(ex, CY + 9, [236, 240, 250], 4); }
      else if (ear === "bigdrops") { const c = rgb(S.earC || "#1fa8b4"); set(ex, CY + 7, gold, 4); for (const [a, b] of [[0, 1], [-1, 2], [0, 2], [1, 2], [-1, 3], [0, 3], [1, 3], [0, 4]]) set(ex + a, CY + 7 + b, a < 0 || b === 1 ? mixc(c, [255, 255, 255], 0.35) : c, 4); }
      else set(Math.round(CX - 0.5 + s * (RX + 0.8)), CY + 6, [248, 244, 232], 4);
    }
    if (S.trait === "ear1") set(Math.round(CX - 0.5 - (RX + 0.8)), CY + 6, [236, 236, 244], 4);
    if (S.earpiece) { const ex = Math.round(CX - 0.5 + RX + 1); set(ex, CY + 2, [20, 20, 24], 4); set(ex, CY + 3, [20, 20, 24], 4); for (let k = 0; k < 9; k++) set(ex - (k > 5 ? 1 : 0), CY + 4 + k, [200, 200, 206], 4); }

    // ---- 10. contour et liseré
    const snap = new Uint8ClampedArray(D), k0 = kind.slice();
    const isBg = (x, y) => x < 0 || x >= N || y < 0 || (y < N && k0[y * N + x] === 0);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (k0[y * N + x] === 0) continue;
      const i = (y * N + x) * 4, c = [snap[i], snap[i + 1], snap[i + 2]];
      if (isBg(x + 1, y) || (isBg(x + 2, y) && y < 48)) { const a = (isBg(x + 1, y) ? 0.6 : 0.28) * (k0[y * N + x] === 3 ? 0.45 : 1); set(x, y, mixc(c, rim, a)); }
      else if (isBg(x - 1, y) || isBg(x, y - 1)) set(x, y, mixc(c, [18, 12, 16], 0.5));
    }
    ctx.putImageData(img, 0, 0);
    cv.kind = k0; // 0 = fond : les plans (CR.plans) détourent le buste avec ce masque
    return cv;
  }

  const cache = new Map();
  PX.portrait = function (look, expr, blink, breath) {
    const L = look || {}, key = JSON.stringify(L) + "|" + (expr || "neutral") + (blink ? "b" : "") + (breath ? "r" : "");
    let c = cache.get(key);
    if (!c) { if (cache.size > 900) cache.clear(); c = draw(L, expr || "neutral", !!blink, !!breath); cache.set(key, c); }
    return c;
  };
  PX.PORTRAIT_N = N;
  PX.faceSpec = specOf;

  // Les personnages récurrents portent le nom de leur fiche dans leur look
  const acteurLook0 = PX.acteurLook;
  PX.acteurLook = (a) => (a ? Object.assign(acteurLook0(a), { hand: a.id }) : acteurLook0(a));
  if (CR.MENTOR && CR.MENTOR.look) CR.MENTOR.look.hand = "mentor";

  // ---------------------------------------------------------------- composant
  UI.Portrait = ({ look, expr, size = 64, blink = true, className }) => {
    const ref = useRef(null);
    const [b, setB] = useState(false);
    const [br, setBr] = useState(false);
    const [tk, setTk] = useState(0);
    const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    useEffect(() => {
      if (!blink || reduce) return;
      let alive = true; const ts = [];
      const loop = () => { if (!alive) return; setB(true); ts.push(setTimeout(() => alive && setB(false), 140)); ts.push(setTimeout(loop, 2500 + Math.random() * 3500)); };
      const breathe = () => { if (!alive) return; setBr(true); ts.push(setTimeout(() => alive && setBr(false), 1300)); ts.push(setTimeout(breathe, 3600 + Math.random() * 900)); };
      ts.push(setTimeout(loop, 1000 + Math.random() * 2000)); ts.push(setTimeout(breathe, 600 + Math.random() * 2400));
      return () => { alive = false; ts.forEach(clearTimeout); };
    }, [blink]);
    useEffect(() => {
      if (expr !== "talk" || reduce) return;
      const t = setInterval(() => setTk((x) => x + 1), 130);
      return () => clearInterval(t);
    }, [expr]);
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    // grand : buste entier, facteur entier ; petit : le visage seul, à l'échelle 1
    const crop = size < 56, side = crop ? Math.max(24, Math.min(N, Math.round(size))) : N;
    const k = crop ? Math.max(1, Math.round(dpr)) : Math.max(1, Math.round(size * dpr / N)), css = (k * side) / dpr;
    const sx = crop ? Math.round((N - side) / 2) : 0, sy = crop ? cl(Math.round(29 - side / 2), 0, N - side) : 0;
    useEffect(() => {
      const c = ref.current;
      if (!c || !look) return;
      const e = expr === "talk" ? (tk % 3 === 1 ? "talk2" : tk % 3 === 2 ? "neutral" : "talk") : expr || "neutral";
      const img = CR.px.portrait(look, e, b, br && !crop);
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, side * k, side * k);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, side * k, side * k);
    }, [look && JSON.stringify(look), expr, b, br, tk, k, side]);
    return html`<canvas ref=${ref} width=${side * k} height=${side * k} className=${UI.cx("portrait", className)} style=${{ width: css + "px", height: css + "px" }} />`;
  };
})();
