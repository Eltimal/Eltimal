/* La Permanence — plan « entretien de garde à vue » (CR.plans.entretien), tranche pilote de la refonte.
   Plan rapproché par-dessus l'épaule : le local avocat du commissariat, la table, la personne gardée à vue en face,
   l'avocat de dos au premier plan. 360 × 225 pixels au centre, prolongé sur les côtés selon l'écran.
   Le plan rend sa matière (CR.gpu.Mat) et ses lumières ; CR.gpu.Renderer fait l'image.
   make(W) → { W, H, mat, frame(t, o) } ; o : min (heure du jeu), rain, look (client), expr, talk, you (look), reduce. */
(function () {
  const CR = window.CR, G = CR.gpu, PL = CR.lum;
  const PLANS = (CR.plans = CR.plans || {});
  const H = 225, REF = 360, FLOOR = 120;
  const HAIR = { black: "#1e1b1c", dkbrown: "#3c271a", brown: "#6b4329", auburn: "#8e3d1f", blonde: "#c9a654", gray: "#8f8e8c", white: "#d4d2cc" };
  const h01 = PL.h01;

  function decor(m, W) {
    const X0 = -m.ox, WALL = 160;
    // mur : peinture claire en haut, faïence en bas, plinthe
    m.set({ E: 0, n: [0, 0], S: 0, D: WALL });
    m.r(X0, 0, W, 70, "#b3b8ae");
    m.noise(X0, 8, W, 62, "#a9aea5", 0.22, 3); m.noise(X0, 8, W, 62, "#bcc1b6", 0.1, 9);
    for (let i = 0; i < 26; i++) { const x = X0 + Math.floor(h01(i * 7.3) * W), y = 40 + Math.floor(h01(i * 3.1) * 28); m.vl(x, y, 2 + Math.floor(h01(i) * 5), "#a2a79f", 0.7); }
    m.r(X0, 70, W, 50, "#6d8781");
    for (let x = Math.ceil(X0 / 14) * 14; x < X0 + W; x += 14) m.vl(x, 71, 45, "#5d7670");
    for (const y of [83, 96, 109]) m.hl(X0, y, W, "#5d7670");
    for (let x = Math.ceil(X0 / 14) * 14; x < X0 + W; x += 14) for (const y of [71, 84, 97, 110]) if (h01(x * 0.37 + y) < 0.16) m.r(x + 1, y, 13, 12, "#67807a");
    m.hl(X0, 69, W, "#c9cec3"); m.hl(X0, 70, W, "#4f6660");
    m.r(X0, 116, W, 4, "#39474a"); m.hl(X0, 116, W, "#4c5c5e");
    // plafond, gaine électrique, tube fluorescent
    m.r(X0, 0, W, 7, "#6e7374"); m.hl(X0, 7, W, "#555a5c");
    m.hl(X0, 10, W, "#c3c8be"); m.hl(X0, 11, W, "#8f958d");
    m.r(144, 4, 72, 5, "#8d9293"); m.hl(144, 9, 72, "#5f6466");
    m.set({ E: 255 }); m.r(149, 6, 62, 2, "#e9fff3"); m.set({ E: 0 });
    // porte blindée, oculus sur le couloir
    m.r(19, 13, 54, 107, "#2f383f");
    m.set({ n: [0, 0], S: 30 }); m.r(22, 16, 48, 104, "#5c6e7c");
    m.set({ n: [-0.5, 0] }); m.vl(22, 16, 104, "#73879a"); m.set({ n: [0.5, 0] }); m.vl(69, 16, 104, "#44525e");
    m.set({ n: [0, -0.5] }); m.hl(22, 16, 48, "#73879a"); m.set({ n: [0, 0] });
    m.r(26, 62, 40, 1, "#4b5a66"); m.r(26, 63, 40, 1, "#6c8090");
    for (const [x, y] of [[25, 19], [66, 19], [25, 59], [66, 59], [25, 114], [66, 114]]) m.px(x, y, "#8298aa");
    m.r(33, 24, 26, 32, "#2a3239");
    m.set({ E: 150, S: 0 }); m.r(35, 26, 22, 28, "#d7b56c");
    m.set({ E: 90 }); for (let x = 38; x < 57; x += 4) m.vl(x, 26, 28, "#a88a4c"); for (let y = 29; y < 54; y += 4) m.hl(35, y, 22, "#a88a4c");
    m.set({ E: 0, S: 60 }); m.r(62, 72, 5, 3, "#aeb6bb"); m.r(60, 73, 3, 8, "#8e979c"); m.r(37, 88, 20, 7, "#46535e"); m.hl(37, 88, 20, "#6c8090");
    m.set({ S: 0 });
    // plaque, interphone
    m.r(78, 15, 50, 9, "#1b2430"); m.set({ E: 26 }); m.txt("LOCAL AVOCAT", 80, 17, "#e6dfc6"); m.set({ E: 0 });
    m.r(78, 50, 8, 12, "#8f9697"); m.r(79, 51, 6, 5, "#4c5355"); m.px(80, 59, "#30363a"); m.px(82, 59, "#30363a");
    // affiche des droits
    m.r(99, 30, 30, 37, "#8f948c"); m.r(98, 29, 30, 37, "#ecebe0");
    m.r(100, 31, 26, 6, "#27407a"); m.txt("DROITS", 102, 32, "#f2f0e6");
    for (let i = 0; i < 8; i++) m.hl(101, 40 + i * 3, 14 + Math.floor(h01(i * 5.7) * 11), "#8e9499");
    m.px(112, 29, "#b33a32"); m.px(113, 29, "#b33a32");
    // horloge
    m.orb(238, 34, 11, 11, "#2b3136", 0.5); m.set({ E: 12 }); m.ell(238, 34, 9, 9, "#eeeade"); m.set({ E: 0 });
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; m.px(Math.round(238 + Math.sin(a) * 8), Math.round(34 - Math.cos(a) * 8), "#55595c"); }
    // fenêtre haute, barreaux
    m.r(277, 15, 58, 47, "#454f52"); m.set({ n: [0, -0.6] }); m.r(277, 59, 58, 3, "#8c9694"); m.set({ n: [0, 0] });
    // radiateur
    m.set({ S: 40 }); m.r(280, 76, 52, 3, "#d3d6d0");
    for (let x = 281; x < 331; x += 5) { m.set({ n: [-0.5, 0] }); m.vl(x, 79, 34, "#d6d9d3"); m.set({ n: [0, 0] }); m.r(x + 1, 79, 2, 34, "#bfc3bd"); m.set({ n: [0.5, 0] }); m.vl(x + 3, 79, 34, "#989d99"); m.set({ n: [0, 0] }); m.vl(x + 4, 79, 34, "#4d625d"); }
    m.r(280, 113, 52, 2, "#a9ada8"); m.vl(336, 92, 24, "#9aa09c"); m.r(333, 90, 5, 3, "#7d8482");
    // banc scellé (visible sur écran large)
    m.set({ S: 30, n: [0, -0.6] }); m.r(-92, 96, 78, 3, "#7d8a8e"); m.set({ n: [0, 0] }); m.r(-92, 99, 78, 3, "#4b575b"); m.r(-86, 102, 3, 18, "#3b464a"); m.r(-22, 102, 3, 18, "#3b464a");
    m.set({ S: 0 });
    // sol : lino, de plus en plus proche vers le bas
    for (let y = FLOOR; y < H; y++) {
      const k = (y - FLOOR) / (H - FLOOR);
      m.set({ n: [0, -1], S: 120, D: Math.round(WALL * (1 - k)) });
      for (let x = X0; x < X0 + W; x++) { const r = PL.h2(x, y); m.px(x, y, r < 0.1 ? "#49535b" : r > 0.9 ? "#67717a" : "#57616a"); }
    }
    m.set({ n: [0, -1], S: 60, D: WALL - 4 }); m.dith(X0, FLOOR, W, 3, "#333c42", 0.6);
    for (const y of [142, 170, 204]) { m.set({ D: Math.round(WALL * (1 - (y - FLOOR) / (H - FLOOR))) }); m.hl(X0, y, W, "#4d575f"); }
    // chaise de la personne gardée à vue (dossier)
    m.set({ n: [0, 0], S: 20, D: 112 }); m.r(160, 92, 40, 30, "#39454d"); m.r(162, 90, 36, 2, "#39454d"); m.set({ n: [0, -0.6] }); m.hl(162, 89, 36, "#566671"); m.set({ n: [0, 0] });
    // table scellée : pieds, plateau en perspective, chant
    m.set({ n: [0, 0], S: 50, D: 108 }); m.r(120, 136, 3, 28, "#2c3135"); m.r(238, 136, 3, 28, "#2c3135");
    for (let y = 122; y < 136; y++) {
      const k = (y - 122) / 14, x0 = Math.round(112 - 16 * k), x1 = Math.round(248 + 16 * k);
      m.set({ n: [0, -0.86], S: 110, D: Math.round(110 - k * 28) });
      for (let x = x0; x <= x1; x++) m.px(x, y, PL.h2(x, y * 3) < 0.12 ? "#8a8e87" : "#959990");
    }
    m.set({ n: [0, -0.4], S: 60, D: 82 }); m.hl(96, 136, 169, "#c0c4ba");
    m.set({ n: [0, 0], S: 40 }); m.r(96, 137, 169, 3, "#6b706c"); m.r(98, 140, 165, 5, "#464b4b");
    m.set({ n: [0.3, 0], D: 80 }); m.r(100, 145, 5, 52, "#3a4044"); m.r(256, 145, 5, 52, "#3a4044"); m.vl(100, 145, 52, "#525a5f"); m.vl(256, 145, 52, "#525a5f");
    m.set({ n: [0, -1], S: 40, D: 78 }); m.dith(96, 197, 14, 2, "#2e363c", 0.7); m.dith(252, 197, 14, 2, "#2e363c", 0.7);
    // sur la table : gobelet, dossier, stylo
    m.set({ n: [0, 0], S: 30, D: 104 }); m.r(128, 118, 6, 8, "#e6e8e2"); m.set({ n: [0.5, 0] }); m.vl(133, 118, 8, "#b9bcb6"); m.set({ n: [0, 0] }); m.hl(128, 118, 6, "#f6f7f2");
    m.set({ n: [0, -0.8], S: 30, D: 90 });
    for (let y = 127; y < 135; y++) { const sh = Math.round((y - 127) * 0.9); for (let x = 204 + sh; x < 246 + sh; x++) m.px(x, y, y === 127 ? "#e8d9ac" : "#d6c592"); }
    m.r(214, 129, 14, 3, "#f0ede0"); m.hl(216, 130, 9, "#7d8087"); m.hl(205, 135, 50, "#a8975f");
    m.line(232, 125, 244, 122, "#1f2a52"); m.px(245, 122, "#c8ccd0");
  }

  // l'avocat, de dos, au premier plan
  function avocat(m, you) {
    const hair = PL.hexOf(PL.mix(PL.rgb(HAIR[(you && you.hc) || "dkbrown"] || HAIR.dkbrown), [18, 16, 20], 0.64)), // à contre-jour : la couleur s'assombrit
       long = you && you.g === "f";
    m.set({ E: 0, S: 0, D: 12 });
    // épaules : manteau sombre, col relevé, liseré de chemise
    for (let y = 158; y < 225; y++) {
      const k = Math.min(1, (y - 158) / 33), half = Math.round(34 + 58 * Math.sqrt(k) + 6 * k);
      for (let x = 84 - half; x <= 84 + half; x++) {
        const u = (x - 84) / (half + 1), edge = Math.pow(Math.abs(u), 3);
        m.nx = Math.round(u * edge * 110 + 128); m.ny = Math.round(128 - (1 - k) * (0.35 + 0.6 * edge) * 127);
        m.px(x, y, PL.h2(x, y) < 0.08 ? "#343b49" : "#2b313d");
      }
    }
    m.set({ n: [0, -0.7] }); m.r(66, 153, 36, 6, "#262c37"); m.hl(67, 152, 34, "#333a47"); m.set({ n: [0, 0] });
    m.orb(84, 154, 10, 6, "#8a6a58", 0.7); m.hl(76, 157, 17, "#d9dbd6");
    if (long) m.orb(84, 139, 23, 33, hair, 0.92); else m.orb(84, 130, 21, 25, hair, 0.92);
    m.orb(62, 135, 3, 6, "#9a7663", 0.6); m.orb(106, 135, 3, 6, "#9a7663", 0.6);
    const hi = PL.mix(PL.rgb(hair), [255, 255, 255], 0.16);
    for (let i = 0; i < 46; i++) { const x = 66 + Math.floor(h01(i * 3.7) * 36), y = 108 + Math.floor(h01(i * 9.1) * 34); if ((x - 84) * (x - 84) / 441 + (y - 130) * (y - 130) / 625 < 0.8) m.vl(x, y, 3, hi, 0.5); }
  }

  PLANS.entretien = {
    H, REF,
    make(W) {
      const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
      stat.ox = work.ox = OX;
      decor(stat, W);
      let blinkAt = 2, blinkEnd = 0, bust = null, bustKey = "";
      const drops = []; for (let i = 0; i < 16; i++) drops.push({ x: 280 + Math.floor(h01(i * 4.4) * 52), y: h01(i * 2.9) * 40, v: 22 + h01(i * 8.2) * 30 });
      const sample = (img, x, y) => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
      return {
        W, H, mat: work,
        frame(t, o) {
          o = o || {};
          const m = work, still = !!o.reduce;
          m.copy(stat);
          // horloge à l'heure du jeu
          const min = o.min == null ? 135 : o.min, ah = (min % 720) / 720 * Math.PI * 2, am = (min % 60) / 60 * Math.PI * 2;
          m.set({ E: 12, n: [0, 0], S: 0, D: 159 });
          m.line(238, 34, 238 + Math.sin(ah) * 4.5, 34 - Math.cos(ah) * 4.5, "#1d2023"); m.line(238, 34, 238 + Math.sin(am) * 7, 34 - Math.cos(am) * 7, "#1d2023");
          if (!still) { const as = Math.floor(t) % 60 / 60 * Math.PI * 2; m.line(238, 34, 238 + Math.sin(as) * 7, 34 - Math.cos(as) * 7, "#b33a32"); }
          // la vitre : ciel de nuit, lueur de la rue, pluie, barreaux
          const beacon = still ? 0 : (t % 23 > 16 ? Math.pow(Math.max(0, Math.sin(t * 7.5)), 2) : 0);
          for (let y = 18; y < 59; y++) { const k = (y - 18) / 41; m.set({ E: Math.round(70 + k * 80 + beacon * 60), D: 160 }); m.hl(280, y, 52, PL.mix(PL.mix([14, 20, 40], [70, 46, 40], k * k), [40, 90, 255], beacon * 0.5)); }
          m.set({ E: 200 }); m.r(322, 45, 2, 2, "#ffc46a"); m.px(291, 51, "#ffd9a0"); m.px(304, 53, "#e8eeff");
          if (o.rain !== false) { m.set({ E: 150 }); for (const d of drops) { const y = 18 + (d.y + (still ? 0 : t * d.v)) % 39; m.vl(d.x, y, 2, "#9fb2d6", 0.55); } }
          m.set({ E: 0, D: 158, n: [0, 0] }); for (let x = 286; x < 332; x += 8) { m.vl(x, 18, 41, "#1c2124"); m.vl(x + 1, 18, 41, "#3a4347"); }
          m.hl(280, 38, 52, "#22282b");
          // voyant de l'interphone
          m.set({ E: still || t % 2.4 < 1.2 ? 255 : 30, D: 159 }); m.px(84, 52, "#ff4a36");
          // quelqu'un passe dans le couloir
          const pass = still ? -1 : (t % 31) - 12;
          if (pass > 0 && pass < 2.2) { m.set({ E: 20, D: 160 }); const px = 33 + Math.round(pass / 2.2 * 22); m.r(Math.max(35, px), 31, Math.min(57, px + 9) - Math.max(35, px), 23, "#2a2116"); m.ell(Math.min(52, Math.max(39, px + 4)), 31, 4, 4, "#2a2116"); }
          // la personne gardée à vue
          if (o.look && CR.px && CR.px.portrait) {
            if (!still && t > blinkAt) { blinkEnd = t + 0.14; blinkAt = t + 2.4 + h01(Math.floor(t) * 1.7) * 3.6; }
            const blink = t < blinkEnd, breath = !still && t % 4.4 > 2.2;
            const now = Date.now(), talk = o.talk || (o.live && o.live.talkUntil && now > o.live.talkFrom && now < o.live.talkUntil);
            const expr = talk && !still ? (Math.floor(t * 7) % 3 === 0 ? (o.expr || "neutral") : Math.floor(t * 7) % 3 === 1 ? "talk" : "talk2") : (o.expr || "neutral");
            const key = JSON.stringify(o.look) + expr + blink + breath;
            if (key !== bustKey) { const cv = CR.px.portrait(o.look, expr, blink, breath); try { bust = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height); } catch (e) { bust = null; } if (bust && (bust.width !== 64 || !cv.kind)) bust = null; if (bust) for (let i = 0; i < 4096; i++) if (!cv.kind[i]) bust.data[i * 4 + 3] = 0; bustKey = key; }
            if (bust) {
              m.set({ E: 0, S: 0, D: 100 });
              m.blit(bust, 148, 58);
              const sleeve = sample(bust, 10, 61), skin = sample(bust, 32, 34), cuff = PL.mix(sleeve, [0, 0, 0], 0.25);
              m.set({ D: 96 });
              m.tube(153, 120, 172, 128, 7, sleeve); m.tube(207, 120, 188, 128, 7, sleeve);
              m.tube(171, 127, 174, 128, 7, cuff); m.tube(189, 127, 186, 128, 7, cuff);
              m.orb(180, 128, 7, 4, skin, 0.7); m.hl(176, 128, 9, PL.mix(skin, [0, 0, 0], 0.3), 0.6);
            }
          }
          avocat(m, o.you);
          // lumières : tube du plafond (qui tressaute parfois), couloir, rue, gyrophare, léger contre-jour froid
          const fl = still ? 1 : (t % 19 > 18.2 ? 0.55 + 0.45 * h01(Math.floor(t * 30)) : 1) * (0.985 + 0.015 * Math.sin(t * 50));
          const cor = pass > 0 && pass < 2.2 ? 0.45 : 1;
          return {
            t, floorY: FLOOR, reflK: 1.25, wet: 0.5, grain: 0.035, vig: 0.42, bloom: 1.1, tint: [0.9, 0.98, 1.08],
            amb: [0.1, 0.115, 0.15],
            lights: [
              { x: OX + 180, y: 10, d: 46, r: 430, c: [0.84, 1, 0.9], i: 2.0 * fl, wrap: 0.45, haze: 0.2 * fl, hr: 64 },
              { x: OX + 180, y: 132, d: 84, r: 80, c: [0.95, 1, 0.92], i: 0.75 * fl, wrap: 0.8 },
              { x: OX + 46, y: 40, d: 148, r: 80, c: [1, 0.74, 0.38], i: 1.1 * cor, haze: 0.14 * cor, hr: 30 },
              { x: OX + 104, y: 80, d: 8, r: 175, c: [0.8, 0.95, 1], i: 2.3 * fl, wrap: 0.02 },
              { x: OX + 306, y: 40, d: 150, r: 90, c: [1, 0.55, 0.22], i: 0.55, haze: 0.05, hr: 34 },
              { x: OX + 306, y: 38, d: 140, r: 260, c: [0.2, 0.42, 1], i: 2.2 * beacon, haze: 0.3 * beacon, hr: 60 },
              { x: OX + 330, y: 120, d: -120, r: 520, c: [0.5, 0.62, 1], i: 0.3, wrap: 0.6 },
            ],
          };
        },
      };
    },
  };
})();
