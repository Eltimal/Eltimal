/* La Permanence — les pièces : salles d'audience (Tribunal de Paris aux Batignolles, cour d'assises au Palais de la
   Cité), cabinet du juge, garde à vue (geôles, bureau d'audition, local avocat), parloir de prison, rendez-vous au cabinet.
   Chaque pièce est composée autour du centre et se prolonge sur les côtés ; les personnages sont ceux de l'affaire.
   Audience : le tribunal sur l'estrade (jurés de part et d'autre de la cour aux assises), le greffier, le ministère
   public sur son estrade, la défense et le box, la partie civile, la barre, le public de dos. Celui qui parle bouge les
   lèvres et les mains ; l'avocat et le procureur se lèvent pour parler. Délibéré : le tribunal se lève et sort par la
   porte du fond, la salle attend et murmure, l'huissier annonce « Le tribunal ! », tout le monde se lève, prononcé. */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html } = UI;
  const D = CR.dec, SC = D.SC, H = D.H;
  const { shade, h01 } = D;
  const lk = (seed, o) => CR.px.lookFrom(seed, o || {});
  const MOODS = ["worried", "angry", "smile", "cry", "soulage", "defi", "honte"];

  D.ROOM_MIN = Object.assign(D.ROOM_MIN || {}, { salle: 368, assises: 388, ccd: 388, chins: 312, tpe: 332, cabinet_ji: 244, gav: 220, parloir: 196, rdv: 240 });
  Object.assign(D.LABEL, {
    salle: "Une salle d'audience du Tribunal de Paris : le tribunal sur l'estrade, le ministère public, la défense, la barre et le public",
    assises: "La salle de la cour d'assises au Palais de la Cité : boiseries, velours rouge, la cour et les jurés",
    cabinet_ji: "Le cabinet d'un magistrat dans la tour du tribunal : le bureau, la greffière, les chemises de dossiers",
    gav: "Le commissariat : zone de garde à vue",
    parloir: "Le parloir avocat de la prison : une table, deux chaises, la porte à œilleton",
    rdv: "Votre cabinet : le client dans le fauteuil face au bureau",
    ccd: "La cour criminelle départementale au Palais de la Cité : cinq magistrats professionnels, sans jury, boiseries claires",
    chins: "La chambre de l'instruction, en chambre du conseil : trois conseillers autour d'une table, l'avocat général, sans public",
    tpe: "La salle du tribunal pour enfants : le juge des enfants et ses deux assesseurs, le mineur à la barre avec ses parents, sans public",
  });

  // Signature des éléments fixes d'une pièce (le décor n'est redessiné que si elle change)
  D.sigOf = (o) => String(CR.hash(JSON.stringify([o.juges, o.jures, o.box, o.camp, o.adverse, o.victime, o.rouge, o.gav, o.looks || {}])));

  // ---------------------------------------------------------------- outils de mobilier
  const desk = (w, x, y, wd, h, top, face, o = {}) => {
    w.r(x, y, wd, 2, top); w.hl(x, y, wd, shade(top, 18));
    w.r(x, y + 2, wd, h, face); w.hl(x, y + 2, wd, shade(face, -24));
    if (o.panels) for (let px = x + 3; px + o.panels <= x + wd - 2; px += o.panels + 3) { w.r(px, y + 4, o.panels, h - 4, shade(face, -9)); w.hl(px, y + 4, o.panels, shade(face, -20)); w.vl(px, y + 4, h - 4, shade(face, 8)); }
    if (o.gold) { w.hl(x, y + 2, wd, o.gold); w.hl(x, y + h + 1, wd, o.gold); }
  };
  const radiateur = (S, x, y, w) => { S.r(x, y, w, 12, "#e4e4dc"); for (let q = x + 1; q < x + w - 1; q += 3) S.vl(q, y + 1, 10, "#bfc0b6"); S.hl(x, y, w, "#f4f4ee"); S.r(x + 1, y + 12, 1, 2, "#9a9a92"); S.r(x + w - 2, y + 12, 1, 2, "#9a9a92"); };
  const avis = (S, x, y, t, n) => { const w = Math.max(16, (t ? CR.px.measure(t).w : 0) + 5); S.r(x, y, w, 13 + n * 2, "#f4f2ea"); S.hl(x, y + 12 + n * 2, w, "#c8c4b6"); if (t) S.txt(t, x + 2, y + 3, "#27407a"); for (let k = 0; k < n; k++) S.hl(x + 2, y + (t ? 10 : 3) + k * 2, w - 4 - (k % 2) * 4, "#9a9a9a"); S.p(x + (w >> 1), y, "#c4352c"); };
  const papers = (w, x, y, n, R) => { for (let i = 0; i < n; i++) w.r(x + i * 2, y - (i % 2), 4, 1, i % 3 === 2 ? "#e6a7b4" : "#f2efe6"); if (R && R() < 0.5) w.r(x + n * 2 + 2, y - 1, 3, 2, "#b3261e"); };
  const sky = (S, x, y, w, h) => { const pal = S.skyPal, P = S.P; for (let j = 0; j < h; j++) P.r(x, y + j, w, 1, pal[Math.min(5, 1 + Math.floor(j * 4 / h))]); if (S.ph === "nuit" && !S.rain) for (let i = 0; i < w / 9; i++) P.p(x + Math.floor(h01(x + i * 7) * w), y + Math.floor(h01(i + y) * h), "#aab6d8"); };

  // ================================================================= Salles d'audience
  // Palettes : salle des Batignolles, assises (Cité), cour criminelle départementale (chêne clair, moquette bleue),
  // chambre de l'instruction (chambre du conseil : vert sombre, bibliothèques), tribunal pour enfants (clair, sans estrade haute)
  const PAL = {
    assises: { wall: "#5c3b24", wall2: "#6c462b", line: "#b8913c", ceil: "#2e1c10", chair: "#6e1c1e", chairHi: "#8c2a2a", top: "#4a2c18", face: "#3a2214", riser: "#2a170c", floor: "#4a3020", floor2: "#563823", aisle: "#7a1f24", bar: "#c9a24a", gold: "#b8913c", bench: "#4a2c18" },
    salle: { wall: "#cdb894", wall2: "#bfa984", line: "#a8946f", ceil: "#ece6da", chair: "#2f3644", chairHi: "#48526a", top: "#dcc7a0", face: "#a88d63", riser: "#7d6748", floor: "#8b847a", floor2: "#958e83", aisle: "#a59d90", bar: "#c8b28a", gold: null, bench: "#9c8560" },
    ccd: { wall: "#a8845a", wall2: "#b99468", line: "#6e5030", ceil: "#e4dccb", chair: "#26364e", chairHi: "#3a5070", top: "#c9a678", face: "#9a764a", riser: "#5e452c", floor: "#3e485a", floor2: "#465266", aisle: "#56627a", bar: "#c49c6a", gold: "#d6b25a", bench: "#8a6a44" },
    chins: { wall: "#3c5646", wall2: "#466452", line: "#b8913c", ceil: "#26342c", chair: "#5a2a1e", chairHi: "#7a3a2a", top: "#2f5a3c", face: "#4a2c18", riser: "#2a170c", floor: "#553a26", floor2: "#61432c", aisle: "#6e2a2a", bar: "#8a6a3a", gold: "#b8913c", bench: "#4a2c18" },
    tpe: { wall: "#e4dabd", wall2: "#d8ceb0", line: "#b8a888", ceil: "#f2ece0", chair: "#3e6a8a", chairHi: "#5a88aa", top: "#e2d0aa", face: "#b89c70", riser: "#a08660", floor: "#949e8e", floor2: "#9ea898", aisle: "#aab4a2", bar: "#c8b28a", gold: null, bench: "#b89c70" },
  };
  function courtroom(S, variant) {
    if (variant === true) variant = "assises"; else if (variant === false || !variant) variant = "salle";
    const cite = variant === "assises" || variant === "ccd" || variant === "chins", huis = variant === "chins" || variant === "tpe";
    D.room(S, { tint: variant === "assises" || variant === "chins" ? 0.75 : variant === "ccd" ? 0.9 : 1 });
    const o = S.o || {}, L = o.looks || {}, cx = S.cx, W = S.W;
    const nJ = Math.max(1, Math.min(5, o.juges || 3)), nJu = Math.max(0, Math.min(9, o.jures || 0)), rouge = !!o.rouge;
    const camp = o.camp === "pc" ? "pc" : "defense";
    // les sièges : jurés de part et d'autre de la cour
    const seats = [], left = Math.floor(nJu / 2);
    for (let i = 0; i < left; i++) seats.push({ kind: "jure", j: i });
    for (let i = 0; i < nJ; i++) seats.push({ kind: "mag", m: i });
    for (let i = left; i < nJu; i++) seats.push({ kind: "jure", j: i });
    const sp = 14, total = seats.length * sp;
    seats.forEach((st, i) => { st.x = Math.round(cx - total / 2 + sp / 2 + i * sp); st.i = i; });
    const bx0 = Math.round(cx - total / 2 - 5), bx1 = Math.round(cx + total / 2 + 5);
    const pres = seats.find((st) => st.kind === "mag" && st.m === Math.floor(nJ / 2));
    const gx0 = bx0 - 40, doorX = gx0 + 8, px0 = bx1 + 10;
    const C = PAL[variant];

    // ---------------------------------------------------- murs, plafond, lumière
    if (variant === "assises") {
      S.r(0, 0, W, 44, C.wall); S.dith(0, 9, W, 31, shade(C.wall, -8), 4, 1);
      for (let x = (cx % 26) - 26; x < W; x += 26) { S.r(x + 3, 11, 20, 26, C.wall2); S.hl(x + 3, 11, 20, C.line); S.vl(x + 3, 11, 26, shade(C.line, -30)); S.hl(x + 3, 36, 20, shade(C.wall, -26)); S.vl(x + 22, 11, 26, shade(C.wall, -22)); }
      S.r(0, 0, W, 9, C.ceil); for (let x = (cx % 12) - 12; x < W; x += 12) { S.r(x + 2, 1, 8, 5, shade(C.ceil, 10)); S.p(x + 6, 7, C.line); }
      S.hl(0, 9, W, C.line); S.hl(0, 10, W, shade(C.wall, -30));
      // hautes fenêtres sur les côtés, rideaux rouges, appliques
      for (const k of [-1, 1]) for (let i = 0; ; i++) {
        const x = cx + k * (bx1 - cx + 70 + i * 64) - (k < 0 ? 22 : 0);
        if (x < -24 || x > W) break;
        sky(S, x, 12, 22, 24); for (let j = 12; j < 36; j += 6) S.hl(x, j, 22, "#2a1a10"); S.vl(x + 11, 12, 24, "#2a1a10");
        S.r(x - 4, 11, 4, 29, "#7a1f24"); S.r(x + 22, 11, 4, 29, "#7a1f24"); S.dith(x - 4, 11, 4, 29, "#5e171b", 3, 0); S.dith(x + 22, 11, 4, 29, "#5e171b", 3, 1); S.hl(x - 5, 11, 32, C.line);
        if (S.rain) S.er(x, 12, 22, 24, "rgba(150,165,195,0.14)");
      }
      for (let x = (cx % 52) - 26; x < W; x += 52) { S.r(x, 14, 2, 4, C.line); S.er(x - 1, 12, 4, 2, "#ffe0a0"); S.glow(x, 13, 12, "255,200,120", 0.38); }
      // la cour : velours rouge et frange dorée
      S.r(bx0 - 8, 11, bx1 - bx0 + 16, 27, "#7a1f24"); for (let x = bx0 - 6; x < bx1 + 8; x += 4) S.vl(x, 11, 27, "#5e171b"); S.dith(bx0 - 8, 11, bx1 - bx0 + 16, 27, "#8e2a2e", 5, 1);
      S.hl(bx0 - 9, 11, bx1 - bx0 + 18, C.line); for (let x = bx0 - 8; x < bx1 + 8; x += 2) S.p(x, 38, C.line);
      D.sign(S, { x: cx - 46, y: 0, w: 92, h: 9 }, "RÉPUBLIQUE FRANÇAISE", { bg: shade(C.ceil, -8), fg: "#e2c06a", fixed: true, padY: 0, alt: ["RÉP. FRANÇAISE"] });
    } else if (variant === "ccd") {
      // chêne clair à lattes verticales, plafond à caissons, la cour sous son fronton ; ni jurés ni bancs de jury
      S.r(0, 0, W, 44, C.wall); for (let x = 0; x < W; x += 3) S.vl(x, 16, 24, x % 6 ? C.wall2 : shade(C.wall, -10)); S.hl(0, 16, W, C.line); S.hl(0, 39, W, C.line);
      S.r(0, 0, W, 16, C.ceil); for (let x = (cx % 16) - 16; x < W; x += 16) { S.r(x + 2, 2, 12, 5, shade(C.ceil, -8)); S.hl(x + 2, 7, 12, shade(C.ceil, -18)); S.r(x + 7, 9, 2, 1, "#fff6dc"); S.glow(x + 8, 10, 7, "255,240,205", 0.18); }
      S.r(0, 12, W, 4, shade(C.wall, -18));
      for (const k of [-1, 1]) for (let i = 0; ; i++) {
        const x = cx + k * (bx1 - cx + 74 + i * 70) - (k < 0 ? 18 : 0);
        if (x < -20 || x > W) break;
        sky(S, x, 18, 18, 20); S.vl(x + 9, 18, 20, "#5e452c"); S.hl(x, 28, 18, "#5e452c"); S.r(x - 2, 17, 22, 1, C.line); S.r(x - 2, 38, 22, 1, C.line);
        if (S.rain) S.er(x, 18, 18, 20, "rgba(150,165,195,0.14)");
      }
      S.r(bx0 - 10, 17, bx1 - bx0 + 20, 22, shade(C.wall, -14)); for (let x = bx0 - 8; x < bx1 + 10; x += 5) S.vl(x, 17, 22, shade(C.wall, -22));
      S.r(cx - 6, 18, 12, 9, "#ece6d8"); S.r(cx - 4, 19, 3, 2, "#27407a"); S.r(cx - 1, 19, 3, 2, "#f4f3ee"); S.r(cx + 2, 19, 3, 2, "#b3261e"); S.txt("RF", cx - 3, 22, "#2a2c33");
      D.sign(S, { x: bx0 - 26, y: 1, w: bx1 - bx0 + 52, h: 15 }, "COUR CRIMINELLE DÉPARTEMENTALE", { bg: "#2a2016", fg: "#e2c06a", frame: C.gold, alt: ["COUR CRIMINELLE"] });
    } else if (variant === "chins") {
      // chambre du conseil : boiseries vertes, bibliothèques de recueils, lustre ; la cour à une longue table tendue de drap vert
      S.r(0, 0, W, 44, C.wall); S.dith(0, 10, W, 30, shade(C.wall, -6), 5, 1);
      S.r(0, 0, W, 10, C.ceil); S.hl(0, 10, W, C.line); S.hl(0, 11, W, shade(C.wall, -26));
      for (let x = (cx % 30) - 30; x < W; x += 30) { S.r(x + 4, 14, 22, 24, C.wall2); S.hl(x + 4, 14, 22, C.line); S.hl(x + 4, 37, 22, shade(C.wall, -24)); }
      const R2 = CR.seeded("chins" + S.name);
      for (const x0 of [bx0 - 112, bx1 + 50, bx0 - 188, bx1 + 126]) if (x0 > -64 && x0 < W) {
        S.r(x0, 12, 58, 30, "#3a2414"); S.hl(x0, 12, 58, C.line);
        for (let y = 14; y < 40; y += 7) { S.hl(x0 + 1, y + 6, 56, "#22140a"); for (let x = x0 + 2; x < x0 + 56; x += 2 + (R2() < 0.25 ? 1 : 0)) S.r(x, y + (R2() < 0.2 ? 1 : 0), 2, 6, ["#6e1c1e", "#1f3a5a", "#2f5a3a", "#8a6a2a", "#4a2c18"][Math.floor(R2() * 5)]); }
      }
      // tableau ancien au-dessus de la cour
      S.r(cx - 16, 14, 32, 13, "#8a6a2a"); S.r(cx - 14, 15, 28, 11, "#4a5a48"); S.r(cx - 14, 21, 28, 5, "#5a4a2e"); S.circ(cx + 6, 18, 2, "#d8c890"); S.dith(cx - 14, 15, 28, 11, "#3a4a3a", 4, 1);
      // lustre
      S.vl(cx, 10, 3, "#8a6a2a"); S.r(cx - 6, 13, 13, 1, "#b8913c"); for (const q of [-6, -2, 2, 6]) { S.er(cx + q, 12, 1, 1, "#ffe0a0"); } S.glow(cx, 13, 16, "255,210,140", 0.3);
      D.sign(S, { x: cx - 56, y: 0, w: 112, h: 10 }, "CHAMBRE DE L'INSTRUCTION", { bg: shade(C.ceil, -6), fg: "#e2c06a", fixed: true, padY: 0, alt: ["CHAMBRE DE L'INSTR."] });
    } else if (variant === "tpe") {
      // salle claire et basse : grandes fenêtres, plantes ; une estrade à peine marquée
      S.r(0, 0, W, 44, C.wall); S.dith(0, 6, W, 34, shade(C.wall, 6), 7, 2);
      S.r(0, 0, W, 5, C.ceil); S.hl(0, 5, W, C.line); for (let x = (cx % 36) - 18; x < W; x += 36) { S.r(x, 5, 8, 1, "#d8d2c4"); S.glow(x + 4, 7, 10, "255,244,214", 0.22); }
      for (const k of [-1, 1]) for (let i = 0; ; i++) {
        const x = cx + k * (bx1 - cx + 66 + i * 58) - (k < 0 ? 28 : 0);
        if (x < -30 || x > W) break;
        sky(S, x, 9, 28, 26); S.vl(x + 14, 9, 26, "#e8e2d6"); S.hl(x, 22, 28, "#e8e2d6"); S.r(x - 1, 8, 30, 1, "#bfb39a"); S.r(x - 2, 35, 32, 2, "#d8ceb0");
        if (S.rain) S.er(x, 9, 28, 26, "rgba(150,165,195,0.12)");
        // plante en pot sous la fenêtre
        const px2 = x + 22; S.r(px2 - 2, 38, 5, 5, "#b0603a"); for (const [dx, dy] of [[0, -4], [-2, -2], [2, -3], [-1, -6], [1, -5]]) S.r(px2 + dx - 1, 38 + dy, 3, 3, "#4a7438"); S.dith(px2 - 3, 31, 7, 6, "#628c48", 2, 0);
      }
      S.r(bx0 - 8, 12, bx1 - bx0 + 16, 27, shade(C.wall, -12)); S.hl(bx0 - 8, 12, bx1 - bx0 + 16, C.line);
      S.r(cx - 6, 16, 12, 9, "#ece6d8"); S.r(cx - 4, 17, 3, 2, "#27407a"); S.r(cx - 1, 17, 3, 2, "#f4f3ee"); S.r(cx + 2, 17, 3, 2, "#b3261e"); S.txt("RF", cx - 3, 20, "#2a2c33");
      D.sign(S, { x: bx0 - 20, y: 0, w: bx1 - bx0 + 40, h: 11 }, "TRIBUNAL POUR ENFANTS", { bg: "#3e6a8a", fg: "#f4f3ee", alt: ["TRIB. POUR ENFANTS"], ay: "b" });
    } else {
      S.r(0, 0, W, 44, C.wall); for (let x = 0; x < W; x += 3) S.vl(x, 5, 35, C.wall2); S.dith(0, 5, W, 35, shade(C.wall, 6), 7, 2);
      S.r(0, 0, W, 4, C.ceil); S.hl(0, 4, W, C.line); S.er(0, 2, W, 1, "#fff6dc");
      // puits de jour : bandeau vitré en haut des murs (le ciel suit l'heure)
      for (let x = (cx % 46) - 46; x < W; x += 46) { sky(S, x + 4, 6, 36, 4); S.hl(x + 4, 6, 36, "#e8e2d6"); S.hl(x + 4, 10, 36, "#e8e2d6"); for (let q = x + 4; q <= x + 40; q += 9) S.vl(q, 6, 5, "#e8e2d6"); }
      S.r(0, 39, W, 5, "#8d7757"); S.hl(0, 39, W, "#a8916b");
      // le panneau derrière le tribunal, la plaque
      S.r(bx0 - 10, 12, bx1 - bx0 + 20, 27, "#b59c75"); for (let x = bx0 - 8; x < bx1 + 10; x += 6) S.vl(x, 13, 26, "#a68e69"); S.hl(bx0 - 10, 12, bx1 - bx0 + 20, "#d9c7a2");
      S.r(cx - 8, 14, 17, 9, "#ece6d8"); S.hl(cx - 8, 22, 17, "#bfb39a"); S.r(cx - 4, 15, 3, 2, "#27407a"); S.r(cx - 1, 15, 3, 2, "#f4f3ee"); S.r(cx + 2, 15, 3, 2, "#b3261e"); S.txt("RF", cx - 3, 18, "#2a2c33");
      // spots
      for (let x = (cx % 40) - 20; x < W; x += 40) { S.r(x, 4, 3, 1, "#d8d2c4"); S.glow(x + 1, 6, 9, "255,240,205", 0.25); }
    }
    // la porte des magistrats
    S.r(doorX - 6, 14, 13, 30, cite ? "#2a170c" : "#8a7455"); S.r(doorX - 5, 15, 11, 28, cite ? "#4a2a16" : "#6e5536"); S.r(doorX - 4, 17, 4, 10, cite ? "#5a361e" : "#7d6242"); S.r(doorX + 1, 17, 4, 10, cite ? "#5a361e" : "#7d6242"); S.r(doorX - 4, 29, 4, 12, cite ? "#5a361e" : "#7d6242"); S.r(doorX + 1, 29, 4, 12, cite ? "#5a361e" : "#7d6242"); S.p(doorX + 3, 28, "#d6b25a");
    D.clock(S, px0 + 24, 20, 5, { rim: cite ? "#c9a24a" : "#2a2016" });
    if (!cite) { // sorties
      for (const x of [bx0 - 128, bx1 + 112]) if (x > 4 && x < W - 16) { S.r(x, 18, 14, 26, "#6e5a3e"); S.r(x + 1, 19, 12, 25, "#8a7455"); S.vl(x + 7, 19, 25, "#6e5a3e"); S.er(x + 2, 13, 10, 3, "#2f8a4a"); S.er(x + 4, 14, 2, 1, "#e8ffe8"); }
    }

    // ---------------------------------------------------- sol
    S.r(0, 44, W, H - 44, C.floor); S.dith(0, 45, W, H - 45, C.floor2, cite ? 3 : 5, 1);
    if (variant === "ccd") { for (let y = 48; y < H; y += 5) S.dith(0, y, W, 1, shade(C.floor, -8), 2, y); }
    if (variant === "assises" || variant === "chins") { for (let y = 47; y < H; y += 4) S.hl(0, y, W, shade(C.floor, -10)); S.r(cx - 16, 62, 32, H - 62, C.aisle); S.dith(cx - 16, 62, 32, H - 62, shade(C.aisle, -14), 4, 0); S.vl(cx - 16, 62, H, C.line); S.vl(cx + 15, 62, H, C.line); }
    else { S.r(cx - 18, 62, 36, H - 62, C.aisle); S.hl(0, 44, W, shade(C.floor, -18)); }
    // estrade
    if (variant === "tpe") { S.r(bx0 - 8, 43, bx1 - bx0 + 16, 2, C.riser); S.hl(bx0 - 8, 43, bx1 - bx0 + 16, shade(C.riser, 20)); }
    else { S.r(bx0 - 8, 41, bx1 - bx0 + 16, 4, C.riser); S.hl(bx0 - 8, 41, bx1 - bx0 + 16, shade(C.riser, 20)); }
    // fauteuils des magistrats et des jurés
    for (const st of seats) { const ch = st.kind === "jure" ? shade(C.chair, 10) : C.chair; S.r(st.x - 5, 16, 11, 19, ch); S.r(st.x - 4, 15, 9, 1, ch); S.vl(st.x - 5, 17, 17, cite ? C.chairHi : shade(ch, 22)); if (cite) for (let k = 0; k < 9; k += 2) S.p(st.x - 4 + k, 16, C.line); }

    // ---------------------------------------------------- les personnages
    const robe = rouge ? "robeR" : "robe";
    const stood = (c) => c.mode === "retire" || c.mode === "retour";
    const standTalk = (c, a) => (stood(c) || ((c.mode === "" || c.mode === "prononce") && D.isWho(a, c.speaker))) ? { dy: -6 } : {};
    // porte qui s'ouvre au passage du tribunal
    D.actor(S, { z: 0, draw: (d, c) => { const near = S.cast.some((a) => a.bench && !a._hide && Math.abs(a._hx - doorX) < 8 && (c.mode === "retire" || c.mode === "retour")); if (near) { d.r(doorX - 5, 15, 11, 28, "#120c08"); d.r(doorX - 5, 15, 2, 28, cite ? "#5a361e" : "#7d6242"); } } });
    for (const st of seats) {
      const isPres = st === pres, order = seats.length - 1 - st.i;
      const look = st.kind === "jure" ? ((L.jures && L.jures[st.j]) || lk("jure" + st.j + S.name, { age: 25 + st.j * 7 })) : isPres ? (L.president || lk("pres" + S.name, { age: 56 })) : ((L.assesseurs && L.assesseurs[st.m]) || lk("ass" + st.m + S.name, { age: 34 + st.m * 9 }));
      D.actor(S, {
        z: 1, bench: true, x: st.x, y: 46, clip: 43, look, wear: st.kind === "jure" || (variant === "tpe" && !isPres) ? null : robe, who: isPres ? ["president", "jld", "ji"] : st.kind === "mag" && st.m === 0 && nJ > 1 ? "assesseur" : null,
        gesture: isPres, noBubble: !isPres && st.kind === "jure",
        state: (c) => {
          const m = c.mode, mt = c.mt, dist = Math.max(1, Math.abs(st.x - doorX));
          if (m === "attente") return { hide: true };
          if (m === "retire") { const go = mt - 0.45 - st.i * 0.16; if (go <= 0) return { dy: -6 * Math.min(1, mt / 0.35) }; const p = Math.min(1, go * 34 / dist); return p >= 1 ? { hide: true } : { dy: -6, x: st.x + (doorX - st.x) * p, walk: true, dir: -1 }; }
          if (m === "retour") { const go = mt - 0.55 - order * 0.32; if (go <= 0) return { hide: true }; const p = Math.min(1, go * 34 / dist); return { dy: -6, x: doorX + (st.x - doorX) * p, walk: p < 1, dir: p < 1 ? 1 : 0 }; }
          return { dir: isPres ? 0 : st.x < cx ? 1 : -1 };
        },
      });
    }
    // greffier et huissier
    D.actor(S, { z: 2, x: gx0 + 11, y: 52, clip: 48, look: L.greffier || lk("greffiere" + S.name, { g: "f", age: 44 }), wear: "robe", who: "greffier", dir: 1, state: (c) => ({ arm: c.speaker && c.speaker !== "greffier" && c.mode === "" ? 3 : 0 }) });
    D.actor(S, { z: 2, x: gx0 - 12, y: 50, look: L.huissier || lk("huissier" + S.name, { g: "m", age: 58 }), wear: "robe", who: "huissier", dir: 1, gesture: false,
      state: (c) => c.mode === "retour" ? { talk: c.mt < 1.6, bubble: "!", arm: 2 } : c.mode === "retire" ? { talk: c.mt < 0.5, bubble: "!" } : {} });
    // ministère public
    D.actor(S, { z: 2, x: px0 + 17, y: 50, clip: 48, look: L.parquet || lk("parquet" + S.name, { age: 45 }), wear: robe, who: "parquet", dir: -1, state: standTalk });
    // le box : prévenu détenu et escorte
    const bxx = cx - 180;
    const prevWho = camp === "defense" ? ["client", "prevenu"] : ["prevenu"];
    if (o.box) {
      D.actor(S, { z: 3, x: bxx + 9, y: 59, clip: 52, wear: "uniform", look: lk("escorte1" + S.name, { age: 34 }), dir: 1, noBubble: true });
      D.actor(S, { z: 3, x: bxx + 27, y: 62, clip: 52, look: L.client || L.prevenu || lk("prev" + S.name), who: prevWho, dir: 1, state: (c) => (stood(c) || c.mode === "prononce" || (c.mode === "" && D.isWho({ who: prevWho }, c.speaker))) ? { dy: -6, expr: c.mode === "prononce" ? ((c.o.verdict && c.o.verdict.prev) || "worried") : c.o.moodPrev || null } : { expr: c.o.moodPrev || null } });
      D.actor(S, { z: 3, x: bxx + 39, y: 59, clip: 52, wear: "uniform", look: lk("escorte2" + S.name, { age: 41, g: "f" }), dir: -1, noBubble: true });
    }
    // défense
    const youL = L.you || lk("vous"), advL = L.adverse || lk("adverse" + S.name, { outfit: "robe" });
    const defX = cx - 104, pcX = cx + 88;
    D.actor(S, { z: 3, x: defX, y: 64, clip: 60, look: camp === "defense" ? youL : advL, wear: "robe", who: camp === "defense" ? "you" : "adverse", you: camp === "defense", dir: 1, state: standTalk });
    if (!o.box && camp === "defense" && o.coDef) D.actor(S, { z: 3, x: defX + 22, y: 64, clip: 60, look: o.coDef, wear: "robe", dir: 1 });
    // partie civile
    if (camp === "pc" || o.adverse) D.actor(S, { z: 3, x: pcX, y: 64, clip: 60, look: camp === "pc" ? youL : advL, wear: "robe", who: camp === "pc" ? "you" : "adverse", you: camp === "pc", dir: -1, state: standTalk });
    const vicWho = camp === "pc" ? ["client", "victime"] : ["victime"];
    if (camp === "pc" || o.victime) D.actor(S, { z: 3, x: pcX + 22, y: 64, clip: 60, look: camp === "pc" ? (L.client || lk("victime" + S.name)) : (L.victime || lk("victime" + S.name)), who: vicWho, dir: -1, state: (c) => Object.assign((stood(c) || (c.mode === "" && D.isWho({ who: vicWho }, c.speaker))) ? { dy: -6 } : {}, { expr: c.mode === "prononce" && c.o.verdict ? c.o.verdict.vic : null }) });
    // à la barre : le prévenu libre, de dos, face au tribunal ; un témoin s'y présente quand il parle
    if (!o.box) D.actor(S, { z: 5, x: cx - 3, y: 72, back: true, look: L.client || L.prevenu || lk("prev" + S.name), who: prevWho, state: (c) => ({ dir: D.isWho({ who: prevWho }, c.speaker) ? 1 : 0, dy: c.mode === "prononce" && c.o.verdict && c.o.verdict.prev === "honte" ? 1 : 0 }) });
    D.actor(S, { z: 5, x: cx + 12, y: 72, back: true, dir: -1, look: L.temoin || lk("temoin" + S.name), who: ["temoin"], state: (c) => ({ hide: c.speaker !== "temoin" }) });
    if (variant === "tpe") {
      // les parents à côté du mineur, l'éducatrice de la protection judiciaire de la jeunesse en retrait
      D.actor(S, { z: 5, x: cx - 22, y: 72, back: true, look: lk("mere" + S.name, { g: "f", age: 42 }), who: ["famille", "mere"], state: (c) => ({ dir: c.speaker === "famille" || c.speaker === "mere" ? 1 : 0 }) });
      D.actor(S, { z: 5, x: cx + 24, y: 72, back: true, look: lk("pere" + S.name, { g: "m", age: 46 }), who: ["pere"], state: (c) => ({ dir: c.speaker === "pere" ? -1 : 0 }) });
      D.actor(S, { z: 4, x: cx + 58, y: 66, pose: "sit", look: L.educ || lk("educ" + S.name, { g: "f", age: 33 }), who: ["educ", "educateur"], dir: -1 });
    }
    // le public, de dos (huis clos : chambre du conseil, tribunal pour enfants)
    let k = 0;
    if (!huis) for (const sgn of [-1, 1]) for (let x = cx + sgn * 32; sgn < 0 ? x > -8 : x < W + 8; x += sgn * 15, k++) {
      const a = D.actor(S, { z: 6, kind: "public", x: x + (k % 3) - 1, y: 64 + (k % 2) * 2, look: lk("public" + k + S.name, { age: 20 + (k * 13) % 50 }), phone: k % 5 === 3,
        state: (c) => ({ up: stood(c) ? -2 : 0, turn: c.mode === "attente" ? (Math.floor(c.t * 0.8 + k) % 3) - 1 : undefined }) });
      a.seed = k * 1.91 + 0.3;
    }
    // murmures pendant le délibéré
    S.after.push((d, t, c) => {
      if (c.mode !== "attente") return;
      const pub = S.cast.filter((a) => a.kind === "public");
      const a = pub[Math.floor(t * 0.7) % Math.max(1, pub.length)];
      if (a) D.bubble(d, a._hx + 2, a._hy - 1, t, "murmure");
    });
    // micros qui s'allument
    S.after.push((d, t, c) => {
      if (c.mode !== "" && c.mode !== "prononce") return;
      if (["president", "jld", "ji"].includes(c.speaker)) d.ep(pres.x + 3, 29, "#ff4a3a");
      if (c.speaker === "parquet") d.ep(px0 + 21, 34, "#ff4a3a");
    });
    S.focusFn = (c) => (c.mode === "retire" || c.mode === "attente" || c.mode === "retour") ? cx - 20 : null;

    // ---------------------------------------------------- mobilier de premier plan (par profondeur)
    const R = CR.seeded("salle" + S.name);
    D.front(S, 1, (w) => {
      desk(w, bx0, 33, bx1 - bx0, 8, C.top, C.face, { panels: 9, gold: C.gold });
      for (const st of seats) { w.vl(st.x + 3, 30, 3, "#202024"); w.p(st.x + 3, 29, "#2a2a30"); papers(w, st.x - 5, 33, 2, null); }
      w.r(bx0 - 2, 43, bx1 - bx0 + 4, 1, shade(C.riser, -10));
    });
    D.front(S, 2, (w) => {
      desk(w, gx0, 39, 30, 7, C.top, C.face, { gold: C.gold }); w.r(gx0 + 18, 33, 10, 6, "#1d1f25"); w.er(gx0 + 19, 34, 8, 4, S.dark ? "#4a78b0" : "#3a6290"); w.r(gx0 + 22, 39, 2, 1, "#1d1f25"); papers(w, gx0 + 3, 39, 3, R);
      w.r(px0 - 2, 47, 38, 3, C.riser);
      desk(w, px0, 37, 34, 9, C.top, C.face, { panels: 8, gold: C.gold }); w.vl(px0 + 21, 34, 3, "#202024"); w.p(px0 + 21, 33, "#2a2a30"); papers(w, px0 + 4, 37, 3, R);
    });
    D.front(S, 3, (w) => {
      if (o.box) {
        w.r(bxx, 50, 48, 10, cite ? "#3a2214" : "#9c8560"); w.hl(bxx, 50, 48, cite ? C.line : "#c4ae86"); w.hl(bxx, 51, 48, shade(cite ? "#3a2214" : "#9c8560", -20));
        for (let q = bxx + 4; q < bxx + 46; q += 10) w.r(q, 52, 6, 6, shade(cite ? "#3a2214" : "#9c8560", -10));
        w.er(bxx + 1, 29, 46, 21, "rgba(200,225,240,0.13)"); w.hl(bxx, 28, 48, "#c9d6dc"); for (let q = bxx; q <= bxx + 47; q += 12) w.vl(q, 28, 22, "#b8c6cc");
        w.er(bxx + 3, 31, 1, 6, "rgba(255,255,255,0.45)"); w.er(bxx + 27, 31, 1, 4, "rgba(255,255,255,0.35)");
      }
      desk(w, defX - 20, 51, 66, 7, C.top, C.face, { panels: 10, gold: C.gold }); papers(w, defX - 14, 51, 4, R); w.r(defX + 14, 50, 6, 1, "#b3261e");
      if (camp === "pc" || o.adverse || o.victime) { desk(w, pcX - 22, 51, 66, 7, C.top, C.face, { panels: 10, gold: C.gold }); papers(w, pcX - 16, 51, 3, R); }
    });
    D.front(S, 4, (w) => {
      w.r(cx - 12, 53, 25, 2, C.bar); w.hl(cx - 12, 53, 25, shade(C.bar, 24)); w.hl(cx - 12, 55, 25, shade(C.bar, -30));
      for (const q of [cx - 11, cx + 11]) { w.r(q, 55, 2, 12, shade(C.bar, -14)); w.r(q - 1, 66, 4, 1, shade(C.bar, -36)); }
      w.r(cx - 4, 51, 9, 2, shade(C.bar, -8)); // pupitre
    });
    if (!huis) D.front(S, 6, (w) => {
      for (const y of [75, 79]) { w.r(0, y, cx - 22, 2, C.bench); w.r(cx + 22, y, W - cx - 22, 2, C.bench); w.hl(0, y, cx - 22, shade(C.bench, 20)); w.hl(cx + 22, y, W - cx - 22, shade(C.bench, 20)); }
    });
  }
  SC.salle = (S) => courtroom(S, "salle");
  SC.assises = (S) => courtroom(S, "assises");
  SC.ccd = (S) => courtroom(S, "ccd");
  SC.chins = (S) => courtroom(S, "chins");
  SC.tpe = (S) => courtroom(S, "tpe");

  // ================================================================= Cabinet d'un magistrat (juge d'instruction, JLD, parquet)
  SC.cabinet_ji = (S) => {
    D.room(S);
    const o = S.o || {}, L = o.looks || {}, cx = S.cx, W = S.W, R = CR.seeded("cji" + S.name);
    S.r(0, 0, W, 50, "#d9d4c6"); S.dith(0, 0, W, 48, "#d0cabb", 4, 1); S.hl(0, 0, W, "#bdb7a8"); S.r(0, 47, W, 3, "#b8b0a0");
    // grande baie sur Paris, store à moitié baissé
    D.view(S, cx - 40, 5, 80, 34, { eiffel: 0.78, seed: "cji" });
    for (let y = 5; y < 13; y += 2) S.hl(cx - 40, y, 80, "#e8e4d8");
    S.r(cx - 42, 3, 84, 2, "#9aa0a6"); S.r(cx - 42, 39, 84, 3, "#9aa0a6"); S.vl(cx - 42, 3, 39, "#9aa0a6"); S.vl(cx + 41, 3, 39, "#9aa0a6"); S.vl(cx, 5, 34, "#9aa0a6");
    // étagères de chemises roses et bleues
    for (const x0 of [cx - 112, cx + 132]) if (x0 > -60 && x0 < W) { S.r(x0, 8, 58, 40, "#8a7d68"); for (let y = 11; y < 46; y += 9) { S.hl(x0 + 1, y + 7, 56, "#5a5040"); for (let x = x0 + 2; x < x0 + 56; x += 3 + (R() < 0.2 ? 1 : 0)) S.r(x, y + (R() < 0.3 ? 1 : 0), 2, 7, R() < 0.6 ? "#e6a7b4" : R() < 0.5 ? "#b8c9e6" : "#efe2a0"); } }
    // porte
    S.r(cx - 62, 12, 14, 38, "#7f8b94"); S.r(cx - 61, 13, 12, 37, "#9aa5ad"); S.p(cx - 51, 32, "#d6b25a");
    D.clock(S, cx + 56, 16, 5);
    S.r(0, 50, W, H - 50, "#8b8478"); S.dith(0, 51, W, H - 51, "#938c80", 3, 0);
    // personnages
    const jl = L.president || L.judge || lk("juge" + S.name, { age: 50 });
    D.actor(S, { z: 1, x: cx - 2, y: 58, clip: 55, look: jl, wear: o.judgeWear || null, who: ["ji", "jld", "president", "parquet"], gesture: true, dir: 0 });
    D.actor(S, { z: 1, x: cx + 66, y: 60, clip: 57, look: L.greffier || lk("greffiere" + S.name, { g: "f", age: 44 }), who: "greffier", dir: -1, state: (c) => ({ arm: c.speaker && c.speaker !== "greffier" ? 3 : 0 }) });
    const prevWho = o.camp === "pc" ? ["prevenu"] : ["client", "prevenu"];
    if (o.box) D.actor(S, { z: 2, x: cx - 74, y: 76, wear: "uniform", look: lk("escorteji" + S.name, { age: 36 }), dir: 1, noBubble: true });
    D.actor(S, { z: 3, x: cx - 26, y: 80, pose: "sit", back: true, look: L.client || lk("client" + S.name), who: prevWho, state: (c) => ({ dir: D.isWho({ who: prevWho }, c.speaker) ? 1 : 0 }) });
    D.actor(S, { z: 3, x: cx + 2, y: 80, pose: "sit", back: true, look: L.you || lk("vous"), wear: "robe", who: "you", you: true, state: (c) => ({ dir: c.speaker === "you" ? -1 : 0 }) });
    if (o.adverse) D.actor(S, { z: 3, x: cx + 30, y: 80, pose: "sit", back: true, look: L.adverse || lk("adv" + S.name), wear: "robe", who: "adverse" });
    if (o.adverse || o.victime) D.actor(S, { z: 3, x: cx + 52, y: 80, pose: "sit", back: true, look: L.victime || lk("vic" + S.name), who: ["victime", "temoin"] });
    S.focusDefault = cx;
    D.front(S, 1, (w) => {
      desk(w, cx - 46, 44, 92, 9, "#7a6650", "#6b5a45"); papers(w, cx - 40, 44, 5, R); papers(w, cx + 20, 44, 4, R);
      for (let i = 0; i < 6; i++) w.r(cx + 30 + (i % 2), 43 - i, 12, 1, i % 2 ? "#e6a7b4" : "#b8c9e6");
      w.vl(cx - 32, 34, 9, "#202226"); w.r(cx - 37, 31, 10, 3, "#2b4a3a"); if (S.dark) { w.er(cx - 36, 34, 8, 1, "#ffe3a0"); w.glow(cx - 32, 36, 16, "255,206,130", 0.4); }
      desk(w, cx + 50, 49, 40, 6, "#7a6650", "#6b5a45"); w.r(cx + 72, 42, 11, 7, "#1d1f25"); w.er(cx + 73, 43, 9, 5, S.dark ? "#4a78b0" : "#3a6290"); w.r(cx + 76, 49, 3, 1, "#1d1f25");
    });
    D.front(S, 3, (w) => { for (const x of [cx - 26, cx + 2].concat(o.adverse ? [cx + 30] : []).concat(o.adverse || o.victime ? [cx + 52] : [])) { w.r(x - 5, 68, 11, 7, "#2a2c33"); w.hl(x - 5, 68, 11, "#454852"); w.r(x - 4, 75, 1, 5, "#1a1b20"); w.r(x + 4, 75, 1, 5, "#1a1b20"); } });
  };

  // ================================================================= Garde à vue
  // o.gav : "geole" (couloir des cellules), "bureau" (bureau d'audition), "entretien" (local avocat), "issue"
  SC.gav = (S) => {
    D.room(S, { tint: 1.25 });
    const o = S.o || {}, L = o.looks || {}, cx = S.cx, W = S.W, mode = o.gav || "bureau";
    const opjL = L.opj || lk("opj" + S.name, { outfit: "uniform" }), cliL = L.client || lk("client" + S.name), youL = L.you || lk("vous");
    const opjWear = opjL.outfit === "uniform" ? (o.gend ? "gend" : "uniform") : "opj";
    if (mode === "geole" || mode === "issue") {
      // couloir carrelé, cellules vitrées, poste de garde
      S.r(0, 0, W, 52, "#d2d8d4"); for (let y = 6; y < 52; y += 4) S.hl(0, y, W, "#c2c9c5"); for (let x = 0; x < W; x += 6) S.vl(x, 6, 46, "#c8cfcb");
      S.r(0, 0, W, 5, "#9aa2a2"); D.neon(S, cx - 50, 3, 24, { flicker: true }); D.neon(S, cx + 34, 3, 24, {});
      S.r(0, 52, W, H - 52, "#7d8380"); S.dith(0, 53, W, H - 53, "#868c89", 4, 0); for (let x = 2; x < W; x += 13) S.er(x, 60 + (x % 9), 5, 1, "rgba(255,255,255,0.10)");
      const cells = [cx - 92, cx - 46, cx];
      cells.forEach((x0, i) => {
        S.r(x0, 9, 42, 43, "#5f666b"); S.r(x0 + 2, 11, 38, 41, "#7c8580"); S.dith(x0 + 2, 11, 38, 41, "#727a76", 3, 0);
        S.r(x0 + 4, 38, 34, 4, "#9aa09c"); S.hl(x0 + 4, 38, 34, "#b6bcb8"); S.r(x0 + 4, 42, 34, 10, "#8a908c");
        if (i === 0) { S.r(x0 + 6, 35, 26, 3, "#5a4a3a"); S.r(x0 + 8, 33, 6, 3, SKIN(lk("dormeur").skin)); S.r(x0 + 7, 32, 7, 1, "#2a2420"); S.r(x0 + 14, 34, 16, 4, "#3a4a6a"); }
        S.txt(String(i + 1), x0 + 19, 13, "#e8eae6");
      });
      D.sign(S, { x: cx + 50, y: 5, w: 60, h: 9 }, "GARDE À VUE", { bg: "#27407a", fg: "#f4f3ee", fixed: true, padY: 0 });
      // poste de garde
      S.r(cx + 56, 24, 46, 4, "#4a5258"); S.r(cx + 64, 16, 12, 8, "#1d1f25"); S.er(cx + 65, 17, 10, 6, "#3a6a8a"); S.r(cx + 80, 16, 12, 8, "#1d1f25"); S.er(cx + 81, 17, 10, 6, "#2f5a7a");
      for (let q = 0; q < 4; q++) S.er(cx + 66 + (q % 2) * 5, 18 + Math.floor(q / 2) * 2, 3, 1, "#9fd0e8");
      S.r(cx + 120, 12, 14, 40, "#6a7278"); S.r(cx + 122, 14, 10, 8, "#2a3338"); S.er(cx + 123, 15, 8, 6, "rgba(160,200,230,0.3)");
      S.dyn.push((d, t) => { if (Math.floor(t * 1.5) % 2) d.ep(cx - 2, 6, "#ff3a2a"); });
      S.r(cx - 4, 5, 5, 2, "#2a2c33"); S.p(cx - 2, 7, "#3a3c44");
      // cellule 2 : le client sur le banc (ou dehors à l'issue) ; cellule 3 : un voisin debout à la vitre
      if (mode === "geole") D.actor(S, { z: 1, x: cells[1] + 21, y: 52, pose: "sit", look: cliL, who: ["client"], dir: 0, expr: "worried" });
      D.actor(S, { z: 1, x: cells[2] + 14, y: 51, look: lk("voisin" + S.name, { age: 22, outfit: "hoodie" }), dir: -1, noBubble: true, state: (c) => ({ dir: Math.floor(c.t * 0.3) % 3 - 1 }) });
      D.actor(S, { z: 1, x: cx + 76, y: 46, look: L.garde || lk("garde" + S.name, { age: 38 }), wear: o.gend ? "gend" : "uniform", noBubble: true, state: (c) => ({ arm: Math.floor(c.t * 0.5) % 4 === 0 ? 3 : 0, dir: -1 }) });
      D.front(S, 1, (w) => { cells.forEach((x0) => { w.er(x0 + 2, 11, 38, 41, "rgba(205,228,240,0.16)"); w.vl(x0 + 21, 11, 41, "#5f666b"); w.hl(x0 + 2, 30, 38, "#5f666b"); w.er(x0 + 5, 13, 1, 12, "rgba(255,255,255,0.5)"); w.er(x0 + 24, 14, 1, 8, "rgba(255,255,255,0.35)"); w.r(x0 + 17, 28, 2, 4, "#c9cfd2"); }); w.r(cx + 50, 28, 56, 24, "#5a636a"); w.hl(cx + 50, 28, 56, "#7c868e"); });
      D.actor(S, { z: 2, x: cx - 120 < 6 ? cx - 22 : cx - 14, y: 76, look: youL, wear: o.robe ? "robe" : "suit", who: "you", you: true, dir: -1 });
      if (mode === "issue") D.actor(S, { z: 2, x: cx - 32, y: 76, look: cliL, who: ["client"], dir: 1, expr: "soulage" });
      S.focusDefault = cells[1] + 21;
      return;
    }
    if (mode === "entretien") {
      // local avocat : murs nus, une table, deux chaises, la porte à hublot
      S.r(0, 0, W, 54, "#dcdcd2"); S.r(0, 32, W, 22, "#b9bab0"); S.hl(0, 32, W, "#a4a59a"); S.dith(0, 0, W, 32, "#d2d2c8", 5, 1);
      S.r(0, 0, W, 4, "#a8aaa2"); D.neon(S, cx - 14, 2, 28, { flicker: true });
      S.r(cx - 70, 10, 22, 44, "#6c7a84"); S.r(cx - 68, 12, 18, 42, "#84929c"); S.r(cx - 63, 16, 8, 6, "#2a3338"); S.r(cx - 52, 34, 2, 4, "#c9cfd2");
      S.dyn.push((d, t) => { const p = (t * 0.18) % 3; if (p < 1) { const hx = cx - 64 + Math.round(p * 8); d.r(hx, 18, 3, 3, "#1a2a50"); d.r(hx, 17, 3, 1, "#0e1430"); } });
      D.sign(S, { x: cx + 30, y: 11, w: 30, h: 14 }, "LOCAL AVOCAT", { bg: "#27407a", fg: "#f4f3ee", fixed: true });
      S.r(cx + 66, 26, 4, 6, "#c9cfd2"); S.er(cx + 67, 27, 2, 2, "#d33a2c");
      S.r(0, 54, W, H - 54, "#8a8e86"); S.dith(0, 55, W, H - 55, "#92968e", 4, 0); for (let y = 58; y < H; y += 6) S.hl(0, y, W, "#7e827a"); for (let x = (cx % 10); x < W; x += 10) S.vl(x, 55, H, "#7e827a");
      radiateur(S, cx + 40, 40, 22); avis(S, cx - 40, 14, "ENTRETIEN", 2); avis(S, cx + 76, 16, "", 3);
      S.r(cx - 46, 46, 7, 8, "#3a3f48"); S.hl(cx - 46, 46, 7, "#565c66");
      D.actor(S, { z: 1, x: cx + 10, y: 66, clip: 62, look: cliL, who: ["client"], dir: -1, gesture: true, state: (c) => ({ expr: MOODS.includes(c.o.clientExpr) ? c.o.clientExpr : null }) });
      D.actor(S, { z: 3, x: cx - 16, y: 80, pose: "sit", back: true, look: youL, wear: o.robe ? "robe" : "suit", who: "you", you: true, dir: 1 });
      D.front(S, 1, (w) => { desk(w, cx - 30, 54, 62, 6, "#9a9c96", "#7e817b"); w.r(cx - 24, 53, 9, 1, "#fbfaf6"); w.hl(cx - 23, 53, 7, "#9a8fd0"); w.r(cx + 18, 53, 3, 1, "#2a2c33"); });
      D.front(S, 3, (w) => { w.r(cx - 22, 68, 13, 6, "#2a2c33"); w.hl(cx - 22, 68, 13, "#454852"); });
      S.focusDefault = cx;
      return;
    }
    // bureau d'audition
    S.r(0, 0, W, 54, "#cfd3c9"); S.r(0, 30, W, 24, "#aab0a5"); S.hl(0, 30, W, "#959b90"); S.dith(0, 0, W, 30, "#c6cac0", 5, 1);
    S.r(0, 0, W, 4, "#a8aaa2"); D.neon(S, cx - 40, 2, 26, { flicker: true }); D.neon(S, cx + 24, 2, 26, {});
    // fenêtre à store
    D.view(S, cx + 46, 7, 40, 26, { seed: "gav" }); for (let y = 7; y < 33; y += 2) S.hl(cx + 46, y, 40, S.dark ? "#3a4048" : "#c8ccc4");
    S.r(cx + 44, 5, 44, 2, "#8a9094"); S.r(cx + 44, 33, 44, 3, "#8a9094"); S.vl(cx + 44, 5, 30, "#8a9094"); S.vl(cx + 87, 5, 30, "#8a9094");
    // tableau de liège, affiche, armoire, imprimante
    S.r(cx - 56, 8, 34, 20, "#b8946a"); S.dith(cx - 56, 8, 34, 20, "#a8845a", 3, 0); for (const [x, y, c] of [[-53, 10, "#f4f2ea"], [-44, 11, "#f2e7a8"], [-34, 9, "#f4f2ea"], [-50, 18, "#cfe0f0"], [-38, 19, "#f4f2ea"]]) { S.r(cx + x, y, 8, 7, c); S.p(cx + x + 3, y, "#c4352c"); }
    S.r(cx - 18, 8, 28, 22, "#f4f2ea"); S.r(cx - 18, 8, 28, 7, "#27407a"); S.txt("DROITS", cx - 16, 9, "#f4f3ee"); for (let y = 17; y < 28; y += 2) S.hl(cx - 15, y, 16 + (y % 5), "#9a9a9a");
    S.r(cx - 100, 18, 26, 36, "#7a8088"); for (let y = 21; y < 52; y += 8) { S.r(cx - 98, y, 22, 7, "#8a9098"); S.r(cx - 89, y + 3, 4, 1, "#c9cfd2"); }
    S.r(cx + 96, 36, 22, 18, "#6a7076"); S.r(cx + 98, 30, 18, 6, "#d8dcdc"); S.r(cx + 100, 33, 14, 1, "#3a3c44");
    S.dyn.push((d, t) => { const o2 = S.o || {}; d.ep(cx + 113, 31, o2.print ? (Math.floor(t * 3) % 2 ? "#3aff6a" : "#1a6a2a") : "#1a6a2a"); if (o2.print) { const k = Math.floor(t * 4) % 6; d.r(cx + 101, 27 - k, 12, k + 3, "#fbfbf6"); d.hl(cx + 103, 28 - k, 8, "#9a9a9a"); } });
    D.clock(S, cx + 30, 15, 5);
    S.r(0, 54, W, H - 54, "#6e7270"); S.dith(0, 55, W, H - 55, "#767a78", 3, 0);
    // l'OPJ derrière son bureau, le client face à lui, l'avocat en retrait
    D.actor(S, { z: 1, x: cx + 10, y: 66, clip: 62, look: opjL, wear: opjWear, who: ["opj"], dir: -1, gesture: true, state: (c) => ({ arm: !D.isWho({ who: ["opj"] }, c.speaker) && mode !== "pieces" ? 3 : 0 }) });
    if (mode !== "pieces") D.actor(S, { z: 3, x: cx - 22, y: 80, pose: "sit", back: true, look: cliL, who: ["client"], state: (c) => ({ dir: D.isWho({ who: ["client"] }, c.speaker) ? 1 : 0 }) });
    D.actor(S, { z: 3, x: mode === "pieces" ? cx - 22 : cx - 48, y: 80, pose: "sit", back: true, look: youL, wear: o.robe ? "robe" : "suit", who: "you", you: true, state: (c) => ({ dir: c.speaker === "you" ? 1 : 0 }) });
    S.focusDefault = cx - 8;
    D.front(S, 1, (w) => {
      desk(w, cx - 28, 52, 70, 8, "#9aa0a4", "#7d8288"); w.vl(cx - 28, 54, 14, "#5e6368"); w.vl(cx + 41, 54, 14, "#5e6368");
      w.r(cx + 14, 41, 16, 10, "#1d1f25"); w.er(cx + 15, 42, 14, 8, S.dark ? "#4a78b0" : "#3a6290"); w.er(cx + 16, 44, 9, 1, "#d4e1ef"); w.er(cx + 16, 46, 11, 1, "#9fb6cf"); w.r(cx + 20, 51, 4, 1, "#1d1f25");
      if (S.dark) w.glow(cx + 22, 46, 16, "120,170,240", 0.3);
      w.r(cx - 20, 51, 14, 1, "#fbfbf6"); w.r(cx - 18, 50, 12, 1, "#f2efe6"); w.r(cx + 32, 49, 4, 3, "#ece8df"); w.p(cx + 36, 50, "#ece8df");
      if (mode === "pieces") for (let i = 0; i < 5; i++) w.r(cx - 26 + i * 3, 51 - (i % 2), 6, 1, i % 2 ? "#f2efe6" : "#e6e2d4");
    });
    D.front(S, 3, (w) => { for (const x of mode === "pieces" ? [cx - 22] : [cx - 22, cx - 48]) { w.r(x - 6, 69, 13, 5, "#3a3f48"); w.hl(x - 6, 69, 13, "#565c66"); } });
  };

  // ================================================================= Parloir avocat
  SC.parloir = (S) => {
    D.room(S, { tint: 1.2 });
    const o = S.o || {}, L = o.looks || {}, cx = S.cx, W = S.W;
    S.r(0, 0, W, 54, "#c4ccb4"); S.r(0, 30, W, 24, "#7f8f72"); S.hl(0, 30, W, "#6a7a5e"); S.dith(0, 0, W, 30, "#bac2aa", 5, 1); S.dith(0, 31, W, 23, "#788a6a", 4, 0);
    S.r(0, 0, W, 4, "#9aa290"); D.neon(S, cx - 12, 2, 24, { flicker: true });
    // fenêtre haute à barreaux
    D.view(S, cx + 34, 8, 28, 14, { seed: "parloir" }); for (let x = cx + 36; x < cx + 62; x += 4) S.vl(x, 8, 14, "#3a3e36"); S.r(cx + 32, 6, 32, 2, "#9aa290"); S.r(cx + 32, 22, 32, 2, "#9aa290");
    // porte à œilleton, interphone
    S.r(cx - 74, 10, 22, 44, "#4a5a48"); S.r(cx - 72, 12, 18, 42, "#5f725c"); S.r(cx - 66, 16, 6, 6, "#1d2a22"); S.p(cx - 63, 30, "#9aa290"); S.r(cx - 56, 32, 2, 5, "#c9cfd2");
    S.dyn.push((d, t) => { const p = (t * 0.15) % 4; if (p < 1) { d.r(cx - 65 + Math.round(p * 4), 18, 3, 3, "#5a7aa8"); d.r(cx - 65 + Math.round(p * 4), 17, 3, 1, "#1a2a40"); } });
    S.r(cx + 72, 26, 5, 7, "#c9cfd2"); S.er(cx + 73, 28, 3, 2, "#d33a2c");
    D.sign(S, { x: cx + 22, y: 36, w: 38, h: 7 }, "PARLOIR", { bg: "#27407a", fg: "#f4f3ee", fixed: true });
    S.r(0, 54, W, H - 54, "#6b685c"); S.dith(0, 55, W, H - 55, "#73705f", 3, 0); for (let y = 59; y < H; y += 7) S.hl(0, y, W, "#605d52");
    radiateur(S, cx - 44, 40, 18); avis(S, cx + 72, 9, "RÈGLEMENT", 3); S.dith(cx - 30, 8, 30, 18, "#aab296", 7, 3);
    D.actor(S, { z: 1, x: cx + 8, y: 66, clip: 62, look: L.client || lk("client" + S.name), who: ["client"], dir: -1, gesture: true, state: (c) => ({ expr: MOODS.includes(c.o.clientExpr) ? c.o.clientExpr : null }) });
    D.actor(S, { z: 3, x: cx - 18, y: 80, pose: "sit", back: true, look: L.you || lk("vous"), wear: "suit", who: "you", you: true, dir: 1 });
    D.front(S, 1, (w) => { desk(w, cx - 30, 54, 60, 6, "#8a7a5e", "#6e604a"); w.r(cx - 24, 53, 10, 1, "#fbfaf6"); w.hl(cx - 23, 53, 8, "#9a8fd0"); });
    D.front(S, 3, (w) => { w.r(cx - 24, 68, 13, 6, "#3a3a34"); w.hl(cx - 24, 68, 13, "#55554a"); });
    S.focusDefault = cx;
  };

  // ================================================================= Rendez-vous au cabinet : le client dans le fauteuil
  SC.rdv = (S) => {
    SC.cabinet(S);
    D.room(S, { keepTint: true });
    const o = S.o || {}, L = o.looks || {}, cx = S.cx, x = cx + 96;
    S.r(x - 8, 50, 17, 14, "#6a2f2a"); S.hl(x - 8, 50, 17, "#8a4038"); S.r(x - 7, 49, 15, 1, "#6a2f2a");
    D.actor(S, { z: 1, x, y: 76, pose: "sit", look: L.client || lk("client" + S.name), who: ["client"], dir: -1, gesture: true, state: (c) => ({ expr: MOODS.includes(c.o.clientExpr) ? c.o.clientExpr : null }) });
    D.front(S, 1, (w) => { w.r(x - 10, 62, 4, 10, "#5a2622"); w.r(x + 7, 62, 4, 10, "#5a2622"); w.hl(x - 10, 62, 4, "#7a3a32"); w.hl(x + 7, 62, 4, "#7a3a32"); w.r(x - 8, 72, 17, 3, "#4a1e1a"); });
    S.focusDefault = x - 30;
  };

  // ================================================================= Remplacement de l'ancien encart (256 × 96)
  // Les écrans qui affichaient UI.SceneCanvas passent par le nouveau moteur ; « commissariat » (vue intérieure)
  // devient la garde à vue, « conference » le rendez-vous, « cite » le bandeau extérieur.
  const MAP = { commissariat: ["gav", { gav: "entretien" }], conference: ["rdv", {}], parloir: ["parloir", {}], cabinet_ji: ["cabinet_ji", {}], salle: ["salle", {}], assises: ["assises", { rouge: true }], gav: ["gav", {}], rdv: ["rdv", {}] };
  const SKINCOL = (k) => (D.SKIN[k] || D.SKIN[1])[0];
  function SKIN(k) { return SKINCOL(k); }
  UI.SceneCanvas = ({ name, opts, className }) => {
    const m = MAP[name];
    if (!m) return html`<${UI.Panorama} name=${D.SC[name] ? name : "rue"} opts=${opts || {}} className=${className} />`;
    const o = Object.assign({}, m[1], opts || {});
    const looks = Object.assign({}, o.looks || {});
    if (o.client && !looks.client) looks.client = o.client;
    if (o.judge && !looks.president) looks.president = o.judge;
    if (o.opj && !looks.opj) looks.opj = o.opj;
    if (o.parquet && !looks.parquet) looks.parquet = o.parquet;
    if (o.greffier && !looks.greffier) looks.greffier = o.greffier;
    if (!looks.you && CR.store && CR.store.s && CR.store.s.player) looks.you = CR.youLook(CR.store.s);
    o.looks = looks;
    if (o.clientExpr === "talk" && !o.speaker) o.speaker = "client";
    const sig = D.sigOf(o);
    return html`<${UI.Room} name=${m[0]} mini=${true} opts=${Object.assign(o, { sig, rain: o.rain != null ? o.rain : CR.store && CR.store.s ? D.rainy(CR.store.s) : false })} className=${className} />`;
  };
  CR.youLook = (s) => Object.assign({}, s.player.look || CR.px.lookFrom(s.player.nom || "vous"), { outfit: "robe" });
})();
