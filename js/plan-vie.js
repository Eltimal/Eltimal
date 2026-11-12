/* La Permanence — plans de la vie autour des dossiers (refonte) : CR.plans.domicile (le salon, le soir et le matin)
   et CR.plans.standard (un tiers au bout du fil : la permanence de l'Ordre, le greffe, un confrère, à son bureau).
   360 × 225 ; l'interface couvre le bas. La lumière suit l'heure du jeu (K.heure).
   domicile — o : min, rain, ringing, reduce.  standard — o : min, rain, look, expr, talk, reduce. */
(function () {
  const CR = window.CR, G = CR.gpu, PL = CR.lum, K = CR.planKit;
  const PLANS = (CR.plans = CR.plans || {});
  const H = 225, REF = 360, h01 = PL.h01, mix = PL.mix;

  // ------------------------------------------------------------ le salon
  const FY = 134;
  function salon(m, W) {
    const X0 = -m.ox, WALL = 190;
    m.set({ E: 0, n: [0, 0], S: 0, D: WALL });
    m.r(X0, 0, W, FY, "#4a6068"); m.noise(X0, 6, W, FY - 30, "#445a62", 0.22, 5); m.noise(X0, 6, W, FY - 30, "#52686f", 0.1, 12);
    m.r(X0, 0, W, 5, "#e3dccb"); m.hl(X0, 5, W, "#2f4047");
    m.r(X0, FY - 12, W, 12, "#e3dccb"); m.hl(X0, FY - 12, W, "#f4efe2"); m.hl(X0, FY - 1, W, "#9d947d");
    // parquet en chevrons, tapis
    for (let y = FY; y < H; y++) { m.set({ n: [0, -1], S: 80, D: Math.round(WALL * (1 - (y - FY) / (H - FY))) }); for (let x = X0; x < X0 + W; x++) { const u = ((x + 400) + (((y - FY) >> 3) % 2 ? (y - FY) % 8 : 7 - (y - FY) % 8)) % 16; m.px(x, y, u === 0 || (y - FY) % 8 === 0 ? "#5a3e28" : PL.h2(x >> 2, y >> 2) < 0.3 ? "#84603e" : "#8e6945"); } }
    for (let y = 150; y < 206; y++) { const k = (y - 150) / 56, a = Math.round(70 - 30 * k), b = Math.round(300 + 30 * k); m.set({ n: [0, -1], S: 10, D: Math.round(WALL * (1 - (y - FY) / (H - FY))) }); for (let x = a; x <= b; x++) { const e = x - a < 4 || b - x < 4 || y < 153 || y > 202; m.px(x, y, e ? "#c9a24a" : ((x >> 2) + (y >> 2)) % 5 === 0 ? "#7d2a2f" : "#963a3a"); } }
    // fenêtre (menuiserie), rideaux
    m.set({ n: [0, 0], S: 60, D: 188 }); m.r(40, 16, 96, 88, "#ece7da"); m.set({ n: [0, -0.6] }); m.hl(36, 104, 104, "#fbf8f0"); m.set({ n: [0, 0] }); m.r(36, 105, 104, 3, "#bdb7a6");
    // affiche encadrée, horloge
    m.set({ S: 60, D: 188 }); m.r(186, 22, 44, 50, "#2a2118"); m.r(189, 25, 38, 44, "#e9dfc6"); m.orb(208, 42, 11, 11, "#c9483a", 0.3); m.r(195, 56, 26, 3, "#27407a"); m.hl(198, 62, 20, "#6b6558");
    m.set({ S: 0 }); K.clockFace(m, 268, 34);
    // plante
    m.set({ S: 30, D: 176 }); m.r(12, 114, 16, 18, "#b5653e"); m.hl(12, 114, 16, "#cf7f55"); m.set({ S: 0 });
    for (const [a, b, c, d] of [[20, 114, 8, 78], [20, 114, 30, 84], [20, 114, 2, 92], [20, 114, 34, 100], [20, 114, 18, 70]]) { m.line(a, b, c, d, "#2f5a34"); m.orb(c, d, 6, 4, h01(c) < 0.5 ? "#3f7a45" : "#356a3c", 0.7); }
    // canapé
    m.set({ n: [0, 0], S: 10, D: 150 });
    for (let y = 80; y < 118; y++) for (let x = 150; x < 306; x++) { const top = y < 84 ? Math.abs(x - 228) < 74 - (84 - y) * 2 : true; if (top) { m.ny = y < 86 ? 70 : 128; m.px(x, y, (x + y * 3) % 11 === 0 ? "#8a4d3a" : "#9a5843"); } }
    m.ny = 128; for (const x of [200, 254]) m.vl(x, 84, 32, "#7d4433");
    m.set({ n: [0, -0.8], D: 140 }); m.r(146, 116, 164, 10, "#a8624b"); m.hl(146, 116, 164, "#bd7861"); m.set({ n: [0, 0] }); m.r(146, 126, 164, 8, "#7d4433");
    for (const x of [140, 304]) { m.set({ n: [0, -0.6], D: 138 }); m.r(x, 98, 12, 4, "#bd7861"); m.set({ n: [0, 0] }); m.r(x, 102, 12, 32, "#8a4d3a"); }
    m.set({ D: 139 }); m.orb(170, 108, 11, 9, "#d9b55a", 0.7); m.orb(286, 108, 10, 9, "#3f6a7a", 0.7);
    m.r(150, 134, 4, 5, "#3a271a"); m.r(302, 134, 4, 5, "#3a271a");
    // lampadaire (pied)
    m.set({ S: 140, D: 150 }); m.r(331, 52, 2, 80, "#2c3038"); m.orb(332, 133, 8, 2, "#2c3038", 0.5);
  }
  function tableBasse(m, o, t, still) {
    K.plateau(m, 112, 252, 160, 176, 10, 70, 50, "#6b4a2f", "#7a5536", 100);
    m.set({ n: [0, -0.5], S: 80, D: 71 }); m.hl(112, 159, 141, "#9a7250"); m.set({ n: [0, 0], S: 30, D: 49 }); m.r(102, 176, 161, 4, "#553a24"); m.r(106, 180, 4, 22, "#3a271a"); m.r(255, 180, 4, 22, "#3a271a");
    // tasse, livre ouvert, téléphone, cartable au pied de la table
    m.set({ n: [0, 0], S: 100, D: 60 }); m.r(132, 156, 9, 8, "#eeeae0"); m.set({ n: [0.6, 0] }); m.vl(140, 156, 8, "#bdb9af"); m.set({ n: [0, -0.8] }); m.hl(133, 156, 7, "#3a2416"); m.set({ n: [0, 0] });
    for (let y = 163; y < 172; y++) { const sh = Math.round((y - 163) * 0.7); m.set({ n: [0, -0.86], S: 20, D: 58 }); for (let x = 166 - sh; x < 206 + sh; x++) m.px(x, y, x === 186 ? "#b9b29c" : y === 163 ? "#fbf8f0" : (y % 3 === 0 && Math.abs(x - 186) > 3) ? "#8e97a8" : "#f1ecdc"); }
    const ring = !!o.ringing, lit = ring && (still || Math.floor(t * 6) % 2 === 0);
    m.set({ n: [0, -0.86], S: 160, D: 56, E: lit ? 230 : 0 }); m.r(222, 165, 12, 6, lit ? "#9fc0ff" : "#15181d"); m.set({ E: 0 });
    m.set({ n: [0, 0], S: 40, D: 40 }); m.r(60, 178, 34, 24, "#4a2e1c"); m.hl(60, 178, 34, "#6b4a2f"); m.r(72, 172, 10, 6, "#3a2416"); m.r(74, 174, 6, 4, "#8e6945"); m.set({ S: 150 }); m.r(75, 186, 4, 3, "#c9a24a");
    if (!still) { m.set({ E: 0, S: 0, D: 58 }); for (let i = 0; i < 5; i++) { const p = (t * 0.35 + i * 0.2) % 1; m.px(136 + Math.round(Math.sin(p * 7 + i) * 2), 154 - Math.round(p * 12), [240, 240, 240], 0.3 * (1 - p)); } }
  }
  PLANS.domicile = {
    H, REF,
    make(W) {
      const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
      stat.ox = work.ox = OX; salon(stat, W);
      const drops = K.gouttes(26, 88, 80, 3), roofs = K.toits(44, 132, 78, 5);
      // Timon vit ici aussi : canapé, appui de fenêtre, tapis (timon.js)
      const T = CR.timon, vie = { min: 1290, rain: false }, monde = { x0: 64, x1: 318, sol: 134, perches: [{ id: "chaise", x: 232, y: 117, app: 204 }, { id: "appui", x: 90, y: 104, app: 104 }], heure: () => (vie.min % 1440) / 60, pluie: false };
      let chat = null, tPrec = -1;
      return {
        W, H, mat: work,
        frame(t, o) {
          o = o || {}; const m = work, still = !!o.reduce, c = K.heure(o), lampOn = c.sun < 0.8; m.copy(stat);
          K.vitre(m, 44, 20, 88, 80, c, t, still, roofs, drops);
          m.set({ E: 0, n: [0, 0], S: 60, D: 188 }); m.r(86, 20, 4, 80, "#ece7da"); m.vl(87, 20, 80, "#c9c4b6"); m.hl(44, 46, 88, "#ded9cb"); m.hl(44, 72, 88, "#ded9cb");
          m.set({ S: 0, D: 184 }); for (const [x0, dir] of [[26, 1], [132, -1]]) for (let y = 12; y < 110; y++) for (let x = 0; x < 16; x++) { const f = Math.sin((x + (dir > 0 ? 0 : 3)) * 1.1); m.nx = Math.round(f * 0.6 * 127 + 128); m.px(x0 + x, y, f > 0.3 ? "#d9b55a" : f < -0.4 ? "#a8862f" : "#c39c44"); }
          m.nx = 128; m.set({ S: 100 }); m.r(22, 10, 130, 2, "#2c3038");
          K.clockHands(m, 268, 34, o.min == null ? 1290 : o.min, t, still);
          // Timon : il vit sa vie (au repos en animations réduites)
          if (T) {
            vie.min = o.min == null ? 1290 : o.min; monde.pluie = !!o.rain;
            if (!chat) { chat = T.create(monde); tPrec = t; }
            if (!still) { const dt = Math.min(0.1, Math.max(0, t - tPrec)); tPrec = t; try { T.update(chat, dt, monde, {}); } catch (e) { /* le chat boude */ } }
            m.set({ E: 0, S: 0, n: [0, 0], D: chat.on === "appui" ? 186 : chat.on === "chaise" ? 136 : 126 }); m.G = chat.on === "appui" && chat.st !== "saut" ? 150 : 0;
            try { T.draw(m, chat, 40); } catch (e) { /* le chat boude */ } m.G = 0;
          }
          // lampadaire : abat-jour
          m.set({ E: lampOn ? 140 : 0, S: 20, D: 150 }); for (let y = 38; y < 54; y++) { const half = 6 + Math.round((y - 38) * 0.5); m.set({ n: [0, -0.4] }); m.hl(332 - half, y, half * 2 + 1, y === 38 ? "#fbe9c4" : "#e9c98a"); } m.set({ n: [0, 0] });
          if (lampOn) { m.set({ E: 255, S: 0 }); m.hl(321, 54, 23, "#fff0c0"); }
          tableBasse(m, o, t, still);
          const day = mix([0.085, 0.09, 0.13], [0.46, 0.46, 0.45], c.sun), amb = [day[0] + c.dusk * 0.14, day[1] + c.dusk * 0.07, day[2] + c.dusk * 0.04];
          const lights = [
            { x: OX + 88, y: 58, d: 180, r: 380, c: c.skyc, i: 0.25 + c.sun * 0.9 + c.dusk * 0.9, wrap: 0.7, haze: 0.04 + c.sun0 * 0.07 + c.dusk * 0.1, hr: 70 },
            { x: OX + 110, y: 80, d: 100, r: 300, c: c.skyc, i: c.sun * 0.55 + c.dusk * 0.5, wrap: 0.25 },
            { x: OX + 200, y: 120, d: -80, r: 460, c: [0.6, 0.7, 1], i: 0.2, wrap: 0.7 },
          ];
          if (lampOn) lights.push({ x: OX + 332, y: 60, d: 140, r: 250, c: [1, 0.78, 0.46], i: 2.3 * (1 - c.sun * 0.7), wrap: 0.45, haze: 0.24 * (1 - c.sun * 0.7), hr: 56 }, { x: OX + 240, y: 100, d: 110, r: 150, c: [1, 0.8, 0.5], i: 0.7 * (1 - c.sun), wrap: 0.6 });
          if (o.ringing) lights.push({ x: OX + 228, y: 160, d: 52, r: 60, c: [0.6, 0.75, 1], i: 1.2, wrap: 0.6 });
          return { t, floorY: FY, reflK: 1.1, wet: 0.3, grain: 0.03, vig: 0.44, bloom: 0.6 + (1 - c.sun) * 0.55, tint: c.sun > 0.5 ? [1, 1, 0.99] : [1.02, 0.98, 0.96], amb, lights };
        },
      };
    },
  };

  // ------------------------------------------------------------ un tiers au bout du fil, à son bureau
  const TB = 124;
  function standard(m, W) {
    K.room(m, W, { H, floorY: 130, wallD: 180, wall: "#c5c9c4", wallA: "#bbbfba", wallB: "#cfd3ce", dadoY: 96, dado: "#8b98a3", dadoLine: "#74818c", plinth: "#48535c", floor: ["#535a60", "#61696f", "#70787e"], gloss: 80 });
    K.neon(m, 60, 3, 76); K.neon(m, 224, 3, 76);
    // armoire de classeurs
    m.set({ E: 0, n: [0, 0], S: 30, D: 176 }); m.r(14, 18, 92, 78, "#6d7880"); m.r(16, 20, 88, 74, "#2a3138");
    for (let r = 0; r < 3; r++) { const base = 44 + r * 25; m.r(16, base, 88, 2, "#56616a"); let x = 18; while (x < 100) { const w = 4 + Math.floor(h01(x * 2.3 + r * 7) * 3), hh = 18 + Math.floor(h01(x * 4.1 + r) * 4), col = ["#27407a", "#8f1f26", "#2f6b4a", "#3a3f48", "#c9a24a", "#27407a"][Math.floor(h01(x * 6.7 + r * 3) * 6)]; m.r(x, base - hh, w, hh, col); m.vl(x, base - hh, hh, mix(PL.rgb(col), [255, 255, 255], 0.2)); m.r(x + 1, base - hh + 4, w - 2, 5, "#ecebe0"); x += w + 1; } }
    // tableau de service, horloge
    m.set({ S: 0, D: 179 }); m.r(250, 20, 70, 46, "#5a6068"); m.r(252, 22, 66, 42, "#f1f1ec");
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) { m.r(255 + c * 9, 26 + r * 6, 7, 4, h01(r * 7.1 + c * 3.3) < 0.3 ? "#e0a9a0" : h01(r * 2.3 + c * 5.1) < 0.35 ? "#9db6d6" : "#dcdcd6"); }
    K.clockFace(m, 334, 84);
    // fauteuil
    m.set({ S: 20, D: 136 }); m.r(134, 66, 52, 60, "#22262c"); m.r(138, 62, 44, 4, "#22262c"); m.set({ n: [0, -0.6] }); m.hl(138, 61, 44, "#3a4048"); m.set({ n: [0, 0] });
  }
  PLANS.standard = {
    H, REF,
    make(W) {
      const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
      stat.ox = work.ox = OX; standard(stat, W);
      const act = K.actor(7.7);
      return {
        W, H, mat: work,
        frame(t, o) {
          o = o || {}; const m = work, still = !!o.reduce; m.copy(stat);
          K.clockHands(m, 334, 84, o.min == null ? 600 : o.min, t, still);
          const talk = !!o.talk || K.talks(o.live, "client"), img = act(m, t, { look: o.look, expr: o.expr || "neutral", talk, still, x: 128, y: 56, D: 122 });
          if (img) {
            const sl = K.sample(img, 10, 61), sk = K.sample(img, 32, 34), bob = !still && talk ? Math.round(Math.sin(t * 5) * 0.6) : 0;
            K.torso(m, img, 128, 56, TB, 122);
            m.set({ E: 0, S: 0, D: 112 }); m.tube(186, 120, 188, 97 + bob, 8, sl); m.tube(188, 98 + bob, 181, 89 + bob, 7, sl);
            m.set({ S: 90, D: 110 }); m.r(176, 80 + bob, 5, 14, "#23272e"); m.set({ S: 0 }); m.orb(181, 88 + bob, 4, 5, sk, 0.7); m.hl(178, 86 + bob, 5, mix(sk, [0, 0, 0], 0.25), 0.6); m.hl(178, 89 + bob, 5, mix(sk, [0, 0, 0], 0.25), 0.6);
            // le fil du combiné, l'autre main sur le registre
            for (let k = 0; k < 14; k++) m.px(180 + Math.round(Math.sin(k * 1.3) * 1.5) + k, 96 + bob + k * 2, "#15181d");
            m.set({ D: 108 }); m.tube(132, 120, 150, 127, 7, sl); m.orb(153, 127, 5, 3, sk, 0.7);
          }
          // bureau, écran de trois quarts, socle du téléphone, registre, tampon
          K.plateau(m, 50, 300, TB, H, 70, 114, 16, "#8f8a80", "#9c978c", 90);
          m.set({ n: [0, -0.5], S: 80, D: 115 }); m.hl(50, TB - 1, 251, "#c9c4b8");
          m.set({ n: [0, 0], S: 60, D: 104 }); m.orb(84, 126, 10, 3, "#23272e", 0.5); m.r(82, 114, 4, 12, "#2c3038"); for (let y = 86; y < 116; y++) { m.set({ n: [-0.3, 0] }); m.r(62, y, 38 + Math.round((y - 86) / 30), 1, "#2a2e35"); } m.set({ n: [0, 0] }); m.hl(62, 86, 38, "#4a505a"); m.set({ E: 110 }); m.vl(101, 87, 28, "#9fb6dc"); m.set({ E: 0 });
          m.set({ n: [0, -0.6], S: 60, D: 100 }); m.r(192, 126, 30, 9, "#22252b"); m.hl(192, 126, 30, "#3a3f48"); for (let r = 0; r < 2; r++) for (let q = 0; q < 4; q++) m.px(204 + q * 4, 129 + r * 3, "#8d94a0"); m.set({ E: 255, S: 0 }); m.px(196, 129, "#4de07a"); m.set({ E: 0 });
          for (let y = 132; y < 143; y++) { const sh = Math.round((y - 132) * 0.8); m.set({ n: [0, -0.86], S: 20, D: 92 }); for (let x = 122 - sh; x < 168 + sh; x++) m.px(x, y, x === 145 ? "#b9b29c" : (y % 3 === 0 && Math.abs(x - 145) > 3) ? "#8e97a8" : "#f1ecdc"); }
          m.set({ n: [0, 0], S: 60, D: 96 }); m.r(246, 124, 8, 6, "#7a2a2a"); m.r(248, 120, 4, 4, "#3a271a");
          const fl = still ? 1 : 0.985 + 0.015 * Math.sin(t * 50);
          return {
            t, floorY: TB, reflK: 0.9, wet: 0.3, grain: 0.03, vig: 0.4, bloom: 0.9, tint: [0.97, 0.99, 1.04], amb: [0.2, 0.21, 0.24],
            lights: [
              { x: OX + 160, y: 6, d: 80, r: 420, c: [0.92, 1, 0.94], i: 1.7 * fl, wrap: 0.45, haze: 0.14, hr: 60 },
              { x: OX + 106, y: 100, d: 112, r: 80, c: [0.6, 0.76, 1], i: 0.8, wrap: 0.7 },
              { x: OX + 170, y: 80, d: 60, r: 170, c: [1, 0.95, 0.85], i: 0.7, wrap: 0.6 },
            ],
          };
        },
      };
    },
  };
})();
