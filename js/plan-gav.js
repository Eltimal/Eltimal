/* La Permanence — plans de la garde à vue (refonte) : CR.plans.geoles (le couloir des geôles et le poste, pour
   l'arrivée et l'issue) et CR.plans.audition (le bureau de l'officier, pour les pièces, l'audition, les questions,
   les observations, la relecture). 360 × 225 ; l'interface couvre le bas (rangées 128 et plus) ou la droite
   (colonnes 165 et plus) : ce qui compte est en haut à gauche.
   o : min, rain, look (client), opj (look), you, expr, live ({ who, talkFrom, talkUntil }), dehors (issue : le client
   est sorti de cellule), print, gend (gendarmerie), reduce. */
(function () {
  const CR = window.CR, G = CR.gpu, PL = CR.lum, K = CR.planKit;
  const PLANS = (CR.plans = CR.plans || {});
  const H = 225, REF = 360, h01 = PL.h01, mix = PL.mix;

  // ------------------------------------------------------------ geôles
  function geoles(m, W) {
    const FY = 118;
    K.room(m, W, { H, floorY: FY, wall: "#c2c6c0", wallA: "#b8bcb6", wallB: "#cbcfc8", dadoY: 14, dado: "#c2c6c0", dadoLine: "#a9aea8", tile: true, plinth: "#4a5456", floor: ["#4f575c", "#5d666b", "#6c757a"], gloss: 150 });
    K.neon(m, 60, 3, 70); K.neon(m, 230, 3, 70);
    // trois cellules vitrées
    for (let i = 0; i < 3; i++) {
      const x = 18 + i * 60;
      m.set({ E: 0, n: [0, 0], S: 40, D: 158 }); m.r(x, 22, 52, FY - 22, "#49545e"); m.set({ n: [-0.5, 0] }); m.vl(x, 22, FY - 22, "#66737e"); m.set({ n: [0, -0.5] }); m.hl(x, 22, 52, "#66737e"); m.set({ n: [0, 0] });
      m.set({ E: 26, S: 200, D: 160 }); m.r(x + 4, 26, 44, FY - 30, "#1b2630");
      m.set({ E: 18 }); m.r(x + 4, 92, 44, 5, "#2c3944"); m.r(x + 4, 97, 44, FY - 101, "#18222b");
      m.set({ E: 0, S: 40, D: 158 }); m.r(x + 25, 26, 2, FY - 30, "#49545e"); m.r(x + 20, 66, 5, 8, "#8a949c");
      m.r(x + 21, 12, 10, 9, "#1b2430"); m.set({ E: 40 }); m.txt(String(i + 1), x + 25, 14, "#e6dfc6"); m.set({ E: 0 });
    }
    // quelqu'un dort dans la deuxième
    m.set({ E: 14, S: 0, D: 160 }); m.orb(110, 89, 16, 4, "#39424a", 0.5); m.orb(92, 88, 4, 3, "#5a4a40", 0.5);
    // le poste : comptoir, plaque, tableau des clés, écran
    m.set({ E: 0, n: [0, 0], S: 0, D: 160 }); m.r(262, 11, 44, 11, "#1b2430"); m.set({ E: 60 }); m.big("POSTE", 270, 13, "#d8c9ff"); m.set({ E: 0 });
    m.r(206, 40, 22, 28, "#6b5a42"); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { m.px(209 + c * 5, 44 + r * 6, "#c9a24a"); m.px(209 + c * 5, 45 + r * 6, "#8d949c"); }
    K.paper(m, 322, 34, 24, 30);
    // caméra et issue de secours
    m.set({ S: 120 }); m.orb(196, 11, 4, 3, "#23272e", 0.7); m.set({ E: 255, S: 0 }); m.px(196, 13, "#ff3b30");
    m.set({ E: 170 }); m.r(4, 12, 12, 6, "#2fa35a"); m.set({ E: 0 });
  }
  function comptoir(m) {
    m.set({ E: 0, n: [0, -0.8], S: 90, D: 120 }); m.r(214, 90, 140, 5, "#aeb4b8"); m.hl(214, 90, 140, "#cfd4d6");
    m.set({ n: [0, 0], S: 40, D: 118 }); m.r(216, 95, 138, 23, "#2b3a55"); m.hl(216, 96, 138, "#3d5078"); m.r(216, 110, 138, 2, "#1f2b40");
    for (let x = 222; x < 352; x += 22) m.vl(x, 97, 21, "#24314a");
    m.set({ S: 50, D: 124 }); m.r(232, 72, 24, 17, "#15181d"); m.r(242, 89, 4, 2, "#2c3038"); m.set({ E: 150 }); m.r(234, 74, 20, 13, "#8fa6c8"); m.set({ E: 120 }); for (let i = 0; i < 3; i++) m.hl(236, 77 + i * 3, 10 + i * 2, "#3a4a6a"); m.set({ E: 0 });
    m.set({ S: 60 }); m.r(324, 84, 14, 6, "#23272e"); m.r(326, 82, 10, 2, "#3a3f48");
  }
  PLANS.geoles = {
    H, REF,
    make(W) {
      const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
      stat.ox = work.ox = OX; geoles(stat, W);
      const opjA = K.actor(1.3), cliA = K.actor(4.1);
      return {
        W, H, mat: work,
        frame(t, o) {
          o = o || {}; const m = work, still = !!o.reduce; m.copy(stat);
          // l'officier derrière le comptoir
          opjA(m, t, { look: o.opj, expr: "neutral", talk: K.talks(o.live, "opj"), still, x: 262, y: 30, D: 140 });
          comptoir(m);
          const cimg = K.bustImg(o.look, "neutral", false, false);
          if (o.dehors) { const img = cliA(m, t, { look: o.look, expr: o.expr || "neutral", talk: K.talks(o.live, "client"), still, x: 120, y: 44, D: 90 }); if (img) K.torso(m, img, 120, 44, H, 90); }
          else if (cimg) { // dans la troisième cellule, assis sur le banc, derrière la vitre
            const sl = mix(K.sample(cimg, 10, 61), [20, 28, 36], 0.55), sk = mix(K.sample(cimg, 32, 34), [20, 28, 36], 0.5), sway = still ? 0 : Math.round(Math.sin(t * 0.5));
            m.set({ E: 16, S: 0, D: 160 }); m.orb(164 + sway, 84, 9, 9, sl, 0.6); m.orb(164 + sway, 72, 5, 6, sk, 0.6); m.r(156, 88, 17, 5, sl);
            m.set({ E: 0, S: 40, D: 158 }); m.r(163, 26, 2, 92, "#49545e");
          }
          // reflets de vitre
          m.set({ E: 30, S: 0, D: 159 }); for (let i = 0; i < 3; i++) { const x = 18 + i * 60; m.line(x + 8, 60, x + 20, 30, [150, 170, 190], 0.18); m.line(x + 32, 70, x + 44, 40, [150, 170, 190], 0.14); }
          const fl = still ? 1 : (t % 23 > 22.3 ? 0.5 + 0.5 * h01(Math.floor(t * 30)) : 1), rec = still || t % 2 < 1;
          m.set({ E: rec ? 255 : 40 }); m.px(OX ? 196 : 196, 13, "#ff3b30");
          return {
            t, floorY: 118, reflK: 1.2, wet: 0.32, grain: 0.035, vig: 0.42, bloom: 1.05, tint: [0.92, 0.98, 1.08], amb: [0.13, 0.15, 0.19],
            lights: [
              { x: OX + 95, y: 8, d: 60, r: 330, c: [0.84, 1, 0.92], i: 1.7 * fl, wrap: 0.45, haze: 0.18 * fl, hr: 60 },
              { x: OX + 265, y: 8, d: 70, r: 330, c: [0.84, 1, 0.92], i: 1.8, wrap: 0.45, haze: 0.18, hr: 60 },
              { x: OX + 244, y: 80, d: 128, r: 70, c: [0.6, 0.75, 1], i: 0.9, wrap: 0.6 },
              { x: OX + 282, y: 16, d: 150, r: 110, c: [0.72, 0.6, 1], i: 0.7, haze: 0.1, hr: 40 },
              { x: OX + 10, y: 15, d: 150, r: 70, c: [0.3, 1, 0.5], i: 0.8, haze: 0.14, hr: 24 },
              { x: OX + 150, y: 110, d: -60, r: 420, c: [0.6, 0.7, 1], i: 0.25, wrap: 0.7 },
            ],
          };
        },
      };
    },
  };

  // ------------------------------------------------------------ bureau d'audition
  function bureau(m, W) {
    const FY = 126;
    K.room(m, W, { H, floorY: FY, wall: "#bdb8a8", wallA: "#b3ae9e", wallB: "#c7c2b2", dadoY: 84, dado: "#8d9790", dadoLine: "#778179", plinth: "#4a4f4a", floor: ["#5a5148", "#695f54", "#786d61"], gloss: 70 });
    K.neon(m, 96, 3, 76);
    // panneau de liège
    m.set({ E: 0, n: [0, 0], S: 0, D: 159 }); m.r(22, 20, 62, 40, "#5a4630"); m.r(24, 22, 58, 36, "#b08552"); m.noise(24, 22, 58, 36, "#9c7444", 0.25, 4);
    K.paper(m, 27, 25, 16, 20); K.paper(m, 46, 24, 14, 14); m.r(63, 27, 16, 12, "#e8d77a"); m.hl(65, 30, 11, "#9a8c4a"); m.hl(65, 33, 8, "#9a8c4a"); m.r(47, 41, 20, 14, "#dfe6ee"); m.r(49, 43, 7, 9, "#55606e"); m.hl(58, 45, 7, "#8e9499"); m.hl(58, 48, 6, "#8e9499");
    for (const [x, y, c] of [[34, 25, "#b33a32"], [52, 24, "#2f6fbf"], [70, 27, "#2f9c5a"], [56, 41, "#b33a32"]]) m.px(x, y, c);
    K.clockFace(m, 172, 30);
    K.paper(m, 190, 22, 31, 38, "CHARTE", "#7a2a2a");
    // fenêtre et store vénitien
    m.r(226, 16, 78, 58, "#4d5356"); m.set({ n: [0, -0.6] }); m.r(226, 72, 78, 3, "#9aa09c"); m.set({ n: [0, 0] });
    // armoire à dossiers
    m.set({ S: 60, D: 150 }); m.r(314, 44, 42, 82, "#7d868a"); m.set({ n: [-0.5, 0] }); m.vl(314, 44, 82, "#a0a9ad"); m.set({ n: [0, 0] });
    for (let i = 0; i < 4; i++) { const y = 47 + i * 20; m.r(317, y, 36, 17, "#8b9498"); m.hl(317, y, 36, "#a7b0b4"); m.hl(317, y + 16, 36, "#636c70"); m.r(330, y + 7, 10, 2, "#cfd4d6"); m.r(331, y + 3, 8, 3, "#ecebe0"); }
    // chaise de l'officier
    m.set({ S: 20, D: 132 }); m.r(104, 62, 48, 50, "#22262c"); m.r(108, 58, 40, 4, "#22262c"); m.set({ n: [0, -0.6] }); m.hl(108, 57, 40, "#3a4048"); m.set({ n: [0, 0] });
  }
  function table(m, o, t, still) {
    // plateau, face avant
    for (let y = 110; y < 124; y++) { const k = (y - 110) / 14, x0 = Math.round(30 - 10 * k), x1 = Math.round(250 + 10 * k); m.set({ E: 0, n: [0, -0.86], S: 90, D: Math.round(112 - k * 26) }); for (let x = x0; x <= x1; x++) m.px(x, y, PL.h2(x >> 1, y * 3) < 0.14 ? "#8f7f6a" : "#9c8b74"); }
    m.set({ n: [0, -0.4], S: 60, D: 84 }); m.hl(20, 124, 241, "#c2b199"); m.set({ n: [0, 0], S: 30 }); m.r(20, 125, 241, 3, "#6d5f4e"); m.r(22, 128, 237, 97, "#54493c"); for (let x = 60; x < 250; x += 62) m.vl(x, 129, 96, "#463c31");
    // écran (de trois quarts, on en voit le dos), clavier, pile de procédures, tasse, lampe
    m.set({ S: 60, D: 100 }); m.orb(62, 112, 10, 3, "#23272e", 0.5); m.r(60, 100, 4, 12, "#2c3038");
    for (let y = 72; y < 102; y++) { const k = (y - 72) / 30; m.set({ n: [-0.3, 0] }); m.r(40, y, 38 + Math.round(k), 1, "#2a2e35"); } m.set({ n: [0, 0] }); m.hl(40, 72, 38, "#4a505a"); m.r(52, 82, 14, 8, "#343941"); m.set({ E: 255 }); m.px(76, 100, "#4de07a"); m.set({ E: 110 }); m.vl(79, 73, 28, "#9fb6dc"); m.set({ E: 0 });
    m.set({ n: [0, -0.8], S: 30, D: 96 }); for (let i = 0; i < 4; i++) { m.r(196 - i, 106 - i * 3, 36, 3, ["#d6c592", "#9db6d6", "#e2a9a0", "#d6c592"][i]); m.hl(196 - i, 106 - i * 3, 36, "#f0ede0", 0.35); }
    m.set({ n: [0, 0], S: 100, D: 94 }); m.r(172, 104, 8, 8, "#23486e"); m.hl(172, 104, 8, "#3a2416"); m.r(180, 106, 2, 4, "#23486e");
    if (o.print) { m.set({ n: [0, -0.8], S: 20, D: 90 }); for (let y = 114; y < 121; y++) m.r(120 + (y - 114), y, 40, 1, "#f1ecdc"); m.hl(126, 116, 26, "#8e9499"); m.hl(127, 118, 22, "#8e9499"); }
  }
  PLANS.audition = {
    H, REF,
    make(W) {
      const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
      stat.ox = work.ox = OX; bureau(stat, W);
      const opjA = K.actor(2.2);
      return {
        W, H, mat: work,
        frame(t, o) {
          o = o || {}; const m = work, still = !!o.reduce; m.copy(stat);
          K.clockHands(m, 172, 30, o.min == null ? 200 : o.min, t, still);
          // la vitre derrière le store : nuit, réverbère, lames
          const hr = ((o.min == null ? 200 : o.min) % 1440) / 60, day = hr > 8 && hr < 18 ? 1 : 0;
          for (let y = 19; y < 72; y++) { const k = (y - 19) / 53; m.set({ E: day ? 150 : Math.round(50 + k * 70), D: 160, n: [0, 0], S: 0 }); m.hl(229, y, 72, day ? mix([150, 190, 230], [220, 228, 236], k) : mix([14, 20, 40], [86, 50, 36], k * k)); }
          if (!day) { m.set({ E: 220 }); m.r(286, 50, 3, 3, "#ffc46a"); }
          m.set({ E: 0, D: 158, S: 30 }); for (let y = 20; y < 72; y += 4) { m.hl(229, y, 72, "#cfd3cc"); m.hl(229, y + 1, 72, "#8f958d"); } m.vl(240, 19, 53, "#e2e5df"); m.vl(290, 19, 53, "#e2e5df");
          const img = opjA(m, t, { look: o.opj, expr: "neutral", talk: K.talks(o.live, "opj"), still, x: 96, y: 48, D: 118 });
          table(m, o, t, still);
          if (img) { // avant-bras sur le clavier
            const sl = K.sample(img, 10, 61), sk = K.sample(img, 32, 34), ty = !still && K.talks(o.live, "opj") ? 0 : (still ? 0 : Math.round(Math.sin(t * 9)));
            m.set({ E: 0, S: 0, D: 104 }); m.tube(101, 110, 116, 116, 7, sl); m.tube(155, 110, 140, 116, 7, sl); m.orb(119, 117 + (ty > 0 ? 1 : 0), 4, 3, sk, 0.7); m.orb(137, 117 + (ty < 0 ? 1 : 0), 4, 3, sk, 0.7);
            m.set({ n: [0, -0.8], S: 30, D: 100 }); m.r(108, 119, 40, 3, "#2c3038"); for (let x = 109; x < 147; x += 3) m.px(x, 120, "#565c66");
          }
          // la personne entendue, de dos, à côté de vous
          const cimg = K.bustImg(o.look, "neutral", false, false);
          K.back(m, 250, 96, { hc: o.look && o.look.hc, g: o.look && o.look.g, coat: cimg ? PL.hexOf(mix(K.sample(cimg, 10, 61), [0, 0, 0], 0.35)) : "#3a4048", skin: cimg ? PL.hexOf(mix(K.sample(cimg, 32, 34), [0, 0, 0], 0.2)) : null, D: 30 });
          const fl = still ? 1 : 0.985 + 0.015 * Math.sin(t * 50);
          return {
            t, floorY: 126, reflK: 1.2, wet: 0.3, grain: 0.035, vig: 0.42, bloom: 1, tint: [0.96, 0.98, 1.04], amb: day ? [0.3, 0.31, 0.33] : [0.15, 0.16, 0.19],
            lights: [
              { x: OX + 134, y: 8, d: 70, r: 400, c: [1, 0.96, 0.84], i: 1.9 * fl, wrap: 0.45, haze: 0.16, hr: 60 },
              { x: OX + 92, y: 88, d: 106, r: 80, c: [0.6, 0.76, 1], i: 0.8, wrap: 0.7 },
              { x: OX + 150, y: 70, d: 60, r: 150, c: [1, 0.94, 0.82], i: 0.7, wrap: 0.6 },
              { x: OX + 265, y: 46, d: 150, r: 150, c: day ? [0.9, 0.95, 1] : [1, 0.6, 0.26], i: day ? 1.2 : 0.6, haze: 0.06, hr: 40 },
              { x: OX + 250, y: 70, d: 20, r: 150, c: [1, 0.95, 0.85], i: 1.6, wrap: 0.02 },
            ],
          };
        },
      };
    },
  };
})();
