/* La Permanence — les décors intérieurs : le cabinet et le domicile.
   Pièce en panorama : le bureau et la fenêtre restent au centre, la pièce se prolonge de chaque côté (bibliothèques,
   cadres, fenêtres, plantes). Les éléments qui dépendent de la partie sont redessinés à chaque image : heure de
   l'horloge, messages non lus, téléphone qui sonne ou messagerie, pile de dossiers, vapeur du café. */
(function () {
  const CR = window.CR;
  const D = CR.dec;
  const SC = D.SC;
  const { shade } = D;

  // La fenêtre : cadre blanc, croisillons, appui
  const fenetre = (S, x, y, w, h, opts) => {
    D.view(S, x, y, w, h, opts);
    S.r(x - 2, y - 2, w + 4, 2, "#ece7da"); S.r(x - 2, y + h, w + 4, 3, "#ece7da"); S.r(x - 2, y - 2, 2, h + 5, "#ece7da"); S.r(x + w, y - 2, 2, h + 5, "#ece7da");
    S.r(x + (w >> 1) - 1, y, 2, h, "#ece7da"); S.hl(x, y + Math.round(h * 0.42), w, "#ece7da"); S.hl(x - 3, y + h + 3, w + 6, "#b8b2a2");
    S.p(x + (w >> 1) - 3, y + Math.round(h * 0.62), "#d6b25a"); S.p(x + (w >> 1) + 2, y + Math.round(h * 0.62), "#d6b25a");
    S.er(x, y, w, 1, "rgba(255,255,255,0.18)");
  };
  const livres = (S, x, w) => {
    const R = CR.seeded("liv" + x + S.name);
    S.r(x, 5, w, 54, "#2a2016"); S.r(x + 2, 7, w - 4, 52, "#17110b");
    for (let row = 0; row < 4; row++) {
      let bx = x + 3; const by = 8 + row * 11;
      while (bx < x + w - 5) {
        const red = R() < 0.5, bw = 2 + Math.floor(R() * 2), bh = 7 + Math.floor(R() * 3);
        const col = red ? (R() < 0.5 ? "#b3261e" : "#9e1f19") : R() < 0.6 ? "#27407a" : R() < 0.5 ? "#d9cfb8" : "#3d5a3a";
        S.r(bx, by + (10 - bh), bw, bh, col); if (red) S.p(bx, by + (10 - bh) + 2, "#e2c06a");
        bx += bw + (R() < 0.08 ? 2 : 0);
      }
      S.hl(x + 2, by + 10, w - 4, "#2a2016");
    }
  };
  const cadres = (S, x, robe) => {
    if (robe) {
      S.vl(x + 22, 12, 46, "#2a2016"); S.r(x + 17, 11, 11, 2, "#2a2016"); S.r(x + 18, 57, 9, 2, "#2a2016");
      S.r(x + 14, 14, 17, 32, "#0e0e12"); S.vl(x + 22, 20, 26, "#1c1c22"); S.r(x + 20, 14, 5, 3, "#f4f3ee"); S.r(x + 21, 17, 3, 4, "#f4f3ee"); S.r(x + 8, 20, 6, 14, "#0e0e12"); S.r(x + 31, 20, 4, 14, "#0e0e12");
    } else {
      for (const [dx, dy, w, h] of [[4, 10, 16, 20], [24, 14, 16, 14], [10, 36, 22, 14]]) { S.r(x + dx, dy, w, h, "#c9a85a"); S.r(x + dx + 1, dy + 1, w - 2, h - 2, "#efe9d6"); for (let k = 3; k < h - 3; k += 3) S.hl(x + dx + 3, dy + k, w - 6 - (k % 2) * 3, "#8a8678"); S.p(x + dx + (w >> 1), dy + h - 4, "#b3261e"); }
    }
  };
  const horloge = (S, x) => {
    S.circ(x + 22, 18, 8, "#2a2016"); S.circ(x + 22, 18, 7, "#f0ede4");
    for (const [dx, dy] of [[0, -6], [6, 0], [0, 6], [-6, 0]]) S.p(x + 22 + dx, 18 + dy, "#16110c");
    S.dyn.push((d) => { const m = (S.o && S.o.min) || 0, hh = (m / 60) % 12, mm = m % 60, ha = hh / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2; d.line(x + 22, 18, x + 22 + Math.sin(ha) * 3, 18 - Math.cos(ha) * 3, "#16110c"); d.line(x + 22, 18, x + 22 + Math.sin(ma) * 5, 18 - Math.cos(ma) * 5, "#16110c"); d.p(x + 22, 18, "#b3261e"); });
    S.r(x + 6, 32, 30, 22, "#3a4152"); S.hl(x + 6, 32, 30, "#6b7488");
  };
  const plante = (S, x) => {
    S.r(x + 18, 48, 11, 11, "#8a5a3a"); S.hl(x + 17, 48, 13, "#a8704a");
    for (const [dx, dy, r] of [[23, 40, 6], [17, 44, 4], [29, 44, 4], [23, 34, 4]]) S.circ(x + dx, dy, r, "#3e6a3a");
    S.dith(x + 14, 30, 20, 18, "#5a8a50", 3, 0);
  };

  SC.cabinet = (S) => {
    const { cx, W } = S;
    S.r(0, 0, W, 61, "#5b6578"); S.dith(0, 0, W, 58, "#525b6d", 2, 0);
    S.r(0, 0, W, 3, "#6b7488"); S.hl(0, 3, W, "#3d4455");
    S.r(0, 46, W, 12, "#4a5163"); S.hl(0, 46, W, "#6b7488"); for (let x = 3; x < W; x += 14) S.vl(x, 47, 11, "#3d4455");
    S.r(0, 58, W, 3, "#2a2e3a");
    S.r(0, 61, W, 19, "#7a5a3a");
    for (let y = 63; y < 80; y += 4) { S.hl(0, y, W, "#6a4a2c"); for (let x = ((y >> 2) % 2) * 9; x < W; x += 18) S.vl(x, y - 3, 3, "#6a4a2c"); }
    S.dith(0, 62, W, 18, "#866440", 5, 1);
    S.r(cx - 100, 66, 200, 14, "#3a2f55"); S.hl(cx - 100, 66, 200, "#4d4070"); S.dith(cx - 100, 67, 200, 13, "#2f2548", 4, 0);
    // la pièce se prolonge de chaque côté du bureau
    const left = ["livres", "cadres", "livres", "fenetre", "livres"], right = ["horloge", "livres", "plante", "fenetre", "livres"];
    left.forEach((t, i) => { const x = cx - 62 - 44 * (i + 1); if (x < -44) return; if (t === "livres") livres(S, x, 44); else if (t === "cadres") cadres(S, x, true); else fenetre(S, x + 6, 10, 32, 34, { seed: "cl" + i }); });
    right.forEach((t, i) => { const x = cx + 62 + 44 * i; if (x > W) return; if (t === "livres") livres(S, x, 44); else if (t === "horloge") horloge(S, x); else if (t === "plante") plante(S, x); else fenetre(S, x + 6, 10, 32, 34, { seed: "cr" + i }); });
    // fenêtre sur les toits des Batignolles et la tour du tribunal
    fenetre(S, cx - 48, 9, 96, 36, { tour: 0.18, eiffel: 0.8, seed: "cab" });
    S.r(cx - 58, 5, 8, 54, "#7a2f3a"); S.r(cx + 50, 5, 8, 54, "#7a2f3a"); S.dith(cx - 58, 5, 8, 54, "#5a2028", 3, 0); S.dith(cx + 50, 5, 8, 54, "#5a2028", 3, 1);
    S.hl(cx - 58, 5, 8, "#b8a05a"); S.hl(cx + 50, 5, 8, "#b8a05a");
    if (!S.dark && !S.rain) for (let k = 0; k < 9; k++) S.er(cx - 90 + k * 4, 62 + k, 40, 1, "rgba(255,244,210,0.10)");
    // bureau
    const dx0 = cx - 78, dw = 156;
    S.r(dx0, 57, dw, 4, "#6b4a2e"); S.hl(dx0, 57, dw, "#8a6440"); S.hl(dx0, 60, dw, "#4b3220");
    S.r(dx0 + 4, 61, dw - 8, 19, "#4b3220"); S.dith(dx0 + 4, 61, dw - 8, 19, "#432c1c", 4, 0);
    for (const q of [dx0 + 12, cx - 10, cx + 40]) { S.r(q, 64, 34, 12, "#3b2616"); S.hl(q, 64, 34, "#5a3d26"); S.r(q + 15, 69, 4, 2, "#d6b25a"); }
    S.r(dx0, 61, 4, 19, "#3b2616"); S.r(dx0 + dw - 4, 61, 4, 19, "#3b2616");
    // ordinateur portable
    S.r(cx - 37, 57, 44, 2, "#2a2c33"); S.r(cx - 32, 38, 34, 19, "#1a1c22");
    S.er(cx - 30, 40, 30, 15, S.dark ? "#4a78b0" : "#345882");
    S.er(cx - 27, 43, 20, 1, "#d4e1ef"); S.er(cx - 27, 46, 26, 1, "#9fb6cf"); S.er(cx - 27, 49, 16, 1, "#9fb6cf"); S.er(cx - 27, 52, 22, 1, "#9fb6cf");
    if (S.dark) S.glow(cx - 15, 48, 26, "120,170,240", 0.2);
    // lampe de bureau
    S.vl(cx - 64, 38, 20, "#202226"); S.r(cx - 68, 57, 9, 2, "#202226"); S.r(cx - 74, 31, 18, 6, "#2b4a3a"); S.hl(cx - 74, 31, 18, "#3e6a52");
    if (S.dark) { S.er(cx - 72, 37, 14, 1, "#ffe3a0"); S.glow(cx - 64, 40, 30, "255,206,130", 0.5); S.er(cx - 90, 57, 50, 4, "rgba(255,206,130,0.14)"); for (let k = 0; k < 6; k++) S.er(cx - 76 - k * 2, 38 + k * 3, 20 + k * 4, 1, `rgba(255,206,130,${(0.1 - k * 0.014).toFixed(3)})`); }
    // téléphone, café, carnet Seyès
    S.r(cx + 22, 47, 9, 13, "#15161b");
    S.r(cx + 44, 50, 8, 8, "#ece8df"); S.r(cx + 52, 52, 2, 4, "#ece8df"); S.r(cx + 45, 51, 6, 2, "#3e2414");
    S.r(cx + 4, 58, 18, 3, "#fbfbf6"); S.hl(cx + 5, 59, 16, "#9a8fd0"); S.vl(cx + 8, 58, 3, "#d46a5a");
    // objets cliquables (le bandeau du bureau est une scène) : id = panneau ouvert
    S.hot = [
      { id: "bibliotheque", label: "Bibliothèque", x: cx - 106, y: 5, w: 44, h: 54 },
      { id: "carte", label: "Carte de Paris", x: cx - 48, y: 9, w: 96, h: 27 },
      { id: "agenda", label: "Agenda", x: cx + 74, y: 8, w: 20, h: 20 },
      { id: "dossiers", label: "Dossiers", x: cx - 77, y: 38, w: 33, h: 20 },
      { id: "messagerie", label: "Messagerie", x: cx - 34, y: 37, w: 38, h: 22 },
      { id: "telephone", label: "Téléphone", x: cx + 20, y: 45, w: 13, h: 16 },
    ];
    // éléments animés : liés à la partie
    S.dyn.push((d, t) => {
      const o = S.o || {};
      if (o.unread > 0) { d.er(cx - 8, 41, 8, 6, "#d64b3c"); d.etxt(String(Math.min(9, o.unread)), cx - 5, 42, "#ffffff"); }
      const ring = o.ringing && Math.floor(t * 4) % 2 === 0;
      d.er(cx + 23, 48, 7, 10, ring ? "#7fd0ff" : o.voicemail ? "#e8b23a" : "#2b3140");
      if (ring) for (const [a, b] of [[19, 50], [33, 50], [17, 54], [35, 54]]) d.ep(cx + a, b, "#7fd0ff");
      const n = Math.min(8, o.files || 0);
      for (let i = 0; i < n; i++) { d.r(cx - 74 + (i % 3), 56 - i * 2, 28, 2, i % 2 ? "#d99aa8" : "#9ab4d9"); d.hl(cx - 74 + (i % 3), 56 - i * 2, 28, i % 2 ? "#ecbcc6" : "#bfd1ea"); }
      if (Math.floor(t * 3) % 3 !== 0) { d.ep(cx + 47, 47 - (Math.floor(t * 3) % 2), "rgba(255,255,255,0.5)"); d.ep(cx + 49, 45 + (Math.floor(t * 3) % 2), "rgba(255,255,255,0.4)"); }
    });
  };
  SC.conference = SC.cabinet;

  SC.domicile = (S) => {
    const { cx, W } = S;
    S.r(0, 0, W, 61, "#8a7a6a"); S.dith(0, 0, W, 58, "#82725f", 2, 0);
    S.r(0, 0, W, 3, "#a89a88"); S.hl(0, 3, W, "#5a4e42"); S.r(0, 58, W, 3, "#4a3e34");
    S.r(0, 61, W, 19, "#8a6a4a");
    for (let y = 63; y < 80; y += 4) { S.hl(0, y, W, "#7a5a3a"); for (let x = ((y >> 2) % 2) * 11; x < W; x += 22) S.vl(x, y - 3, 3, "#7a5a3a"); }
    S.r(cx - 70, 66, 140, 14, "#6a4a52"); S.hl(cx - 70, 66, 140, "#8a6a72"); S.dith(cx - 70, 67, 140, 13, "#5a3a42", 4, 0);
    // pièces décoratives vers les bords
    for (let i = 1; i < 8; i++) for (const sg of [-1, 1]) {
      const x = cx + sg * (86 + (i - 1) * 46) - 18; if (x < -40 || x > W) continue;
      const R = CR.seeded("dom" + i + sg), k = Math.floor(R() * 3);
      if (k === 0) { S.r(x, 14, 24, 18, "#c9a85a"); S.r(x + 1, 15, 22, 16, ["#d9cfb8", "#8aa0b4", "#c88a7a"][Math.floor(R() * 3)]); S.dith(x + 4, 20, 14, 8, "#5a6a7a", 3, 0); }
      else if (k === 1) { S.hl(x, 28, 30, "#4a3a2a"); for (let q = 0; q < 8; q++) S.r(x + 1 + q * 3, 21 + (q % 3), 2, 7 - (q % 3), ["#b3261e", "#27407a", "#d9cfb8", "#3d5a3a"][q % 4]); S.hl(x, 40, 30, "#4a3a2a"); S.r(x + 4, 33, 5, 7, "#d6b25a"); }
      else plante(S, x - 6);
    }
    // fenêtre et balcon
    fenetre(S, cx - 40, 8, 80, 38, { eiffel: 0.7, seed: "dom" });
    for (let x = cx - 40; x < cx + 40; x += 4) S.vl(x, 34, 12, "#14171f"); S.hl(cx - 40, 34, 80, "#14171f"); S.hl(cx - 40, 40, 80, "#14171f");
    S.r(cx - 52, 5, 10, 54, "#d8cfc0"); S.r(cx + 42, 5, 10, 54, "#d8cfc0"); S.dith(cx - 52, 5, 10, 54, "#c4baa8", 3, 0); S.dith(cx + 42, 5, 10, 54, "#c4baa8", 3, 1);
    S.r(cx - 12, 40, 10, 6, "#8a5a3a"); S.circ(cx - 7, 36, 4, "#3e6a3a");
    // canapé, lampadaire, table d'appoint
    const sx = cx - 118;
    S.r(sx, 42, 62, 19, "#47536e"); S.r(sx - 4, 46, 8, 15, "#3a4560"); S.r(sx + 58, 46, 8, 15, "#3a4560"); S.hl(sx, 42, 62, "#5d6c8c"); S.dith(sx + 4, 44, 54, 15, "#3f4a64", 5, 0);
    S.r(sx + 8, 46, 14, 9, "#c8553d"); S.r(sx + 40, 46, 14, 9, "#d8b86a"); S.hl(sx + 8, 46, 14, "#e0705a");
    S.r(sx, 59, 62, 2, "#2a2330");
    S.vl(sx + 76, 24, 34, "#202226"); S.r(sx + 70, 56, 13, 3, "#202226"); S.r(sx + 68, 18, 17, 8, "#e6d8b8"); S.hl(sx + 68, 18, 17, "#f4ead0");
    if (S.dark) { S.er(sx + 70, 26, 13, 1, "#ffe3a0"); S.glow(sx + 76, 24, 32, "255,206,130", 0.5); S.er(sx + 50, 57, 50, 4, "rgba(255,206,130,0.12)"); }
    S.r(cx - 48, 50, 18, 11, "#5a3a28"); S.hl(cx - 48, 50, 18, "#7a5438"); S.r(cx - 46, 61, 2, 5, "#3a2418"); S.r(cx - 34, 61, 2, 5, "#3a2418");
    S.r(cx - 47, 47, 9, 3, "#15161b");
    // coin cuisine
    const kx = cx + 54;
    S.r(kx, 44, 76, 17, "#c9c3b4"); S.hl(kx, 44, 76, "#e4dece"); S.r(kx, 22, 76, 12, "#a89d88"); S.hl(kx, 22, 76, "#c4b8a0");
    for (let q = kx + 2; q < kx + 76; q += 19) { S.r(q, 24, 16, 8, "#9a8f78"); S.p(q + 12, 28, "#d6b25a"); S.r(q, 47, 16, 11, "#b3ad9e"); S.p(q + 12, 50, "#6a6e76"); }
    S.r(kx + 8, 36, 10, 8, "#c4352c"); S.hl(kx + 8, 36, 10, "#e0483a"); S.r(kx + 18, 38, 3, 4, "#c4352c"); S.r(kx + 10, 34, 6, 2, "#202226");
    S.r(kx + 40, 38, 7, 6, "#ece8df"); S.r(kx + 47, 39, 2, 3, "#ece8df");
    S.dyn.push((d, t) => {
      const o = S.o || {};
      const ring = o.ringing && Math.floor(t * 4) % 2 === 0;
      d.er(cx - 46, 48, 7, 2, ring ? "#7fd0ff" : o.voicemail ? "#e8b23a" : "#2b3140");
      if (ring) { d.er(cx - 56, 36, 28, 20, "rgba(127,208,255,0.10)"); for (const [a, b] of [[-50, 47], [-37, 47], [-52, 44], [-35, 44]]) d.ep(cx + a, b, "#7fd0ff"); }
      const f = Math.floor(t * 3) % 3;
      if (f !== 0) { d.ep(kx + 13, 31 - (f % 2), "rgba(255,255,255,0.5)"); d.ep(kx + 15, 29 + (f % 2), "rgba(255,255,255,0.4)"); }
      if (Math.floor(t * 3) % 3 !== 1) d.ep(kx + 43, 36 - (f % 2), "rgba(255,255,255,0.4)");
    });
  };
})();
