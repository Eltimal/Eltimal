/* La Permanence — plan « l'audience » (CR.plans.audience), refonte.
   Vue depuis le banc de l'avocat : le tribunal sur son estrade, le ministère public à droite, le greffe ou le box
   à gauche, la personne que vous assistez de dos à côté de vous. Trois habillages : tribunal (bois clair),
   cour (boiseries sombres, tenture rouge), cabinet (bureau du juge).
   360 × 225 ; l'interface couvre le bas (rangées 128 et plus).
   o : room (salle, tpe, chins, ccd, assises, cabinet_ji), juges (1, 3, 5), jures (0, 6, 9 : un rang derrière la cour),
   box, camp, looks { president, parquet, greffier, client, you, adverse, jures [] }, speaker, court (retire, attente : le tribunal délibère), min, reduce. */
(function () {
  const CR = window.CR, G = CR.gpu, PL = CR.lum, K = CR.planKit;
  const PLANS = (CR.plans = CR.plans || {});
  const H = 225, REF = 360, h01 = PL.h01, mix = PL.mix;
  const SKIN = {
    tribunal: { wall: "#d6cfbd", wallA: "#cdc6b4", wallB: "#dfd8c7", pan: "#b4925f", panD: "#96774a", panL: "#c9a873", desk: "#a5834f", deskD: "#7d6038", deskL: "#c4a36b", chair: "#3a4654", floor: ["#6d6a66", "#7b7874", "#8a8783"], amb: [0.3, 0.3, 0.3], key: [1, 0.97, 0.9], ki: 1.5 },
    cour: { wall: "#4f3423", wallA: "#472d1e", wallB: "#583b28", pan: "#5d3d28", panD: "#3f2818", panL: "#7a5236", desk: "#5a3722", deskD: "#3a2214", deskL: "#7d5133", chair: "#6e1a20", floor: ["#3d2a1e", "#4a3425", "#573e2c"], amb: [0.17, 0.14, 0.13], key: [1, 0.86, 0.66], ki: 1.7 },
    cabinet: { wall: "#c9c4b6", wallA: "#c0bbad", wallB: "#d2cdbf", pan: "#9aa39c", panD: "#7f8881", panL: "#b1bab3", desk: "#8d7a62", deskD: "#62543f", deskL: "#ab9879", chair: "#22262c", floor: ["#5a5148", "#695f54", "#786d61"], amb: [0.26, 0.26, 0.27], key: [1, 0.95, 0.84], ki: 1.6 },
  };
  const skinOf = (o) => (o.room === "cabinet_ji" ? "cabinet" : o.room === "assises" || o.room === "ccd" || o.room === "chins" ? "cour" : "tribunal");
  const seats = (n) => (n >= 5 ? [36, 260, 92, 204, 148] : n >= 3 ? [84, 212, 148] : [148]);

  function decor(m, W, o, S) {
    const X0 = -m.ox, FY = 128, cab = S === SKIN.cabinet;
    K.room(m, W, { H, floorY: FY, wallD: 170, wall: S.wall, wallA: S.wallA, wallB: S.wallB, plinth: S.panD, floor: S.floor, gloss: 90, ceil: cab ? "#6e7374" : mix(PL.rgb(S.wall), [0, 0, 0], 0.35) });
    // boiseries
    const py = cab ? 84 : S === SKIN.cour ? 8 : 34;
    m.set({ E: 0, n: [0, 0], S: 30, D: 170 }); m.r(X0, py, W, FY - py - 4, S.pan);
    for (let x = Math.ceil(X0 / 12) * 12; x < X0 + W; x += 12) { m.vl(x, py + 1, FY - py - 5, S.panD); m.vl(x + 1, py + 1, FY - py - 5, S.panL); }
    m.hl(X0, py, W, S.panL); m.hl(X0, py - 1, W, S.panD);
    if (S === SKIN.cour) { // tenture rouge derrière la cour
      for (let x = 58; x < 302; x++) { const f = Math.sin(x * 0.9); m.nx = Math.round(f * 0.5 * 127 + 128); m.vl(x, 10, 92, f > 0.4 ? "#8a2029" : f < -0.4 ? "#5a1219" : "#74181f"); } m.nx = 128;
      m.set({ S: 140 }); m.r(54, 8, 252, 3, "#b08a3c"); m.set({ S: 30 });
      for (const x of [22, 334]) { m.set({ S: 120 }); m.r(x, 44, 4, 10, "#b08a3c"); m.set({ E: 255 }); m.orb(x + 2, 40, 4, 5, "#ffe2a6", 0.5); m.set({ E: 0, S: 30 }); }
    } else if (!cab) { K.neon(m, 40, 2, 80); K.neon(m, 240, 2, 80); K.neon(m, 140, 2, 80); }
    else { K.neon(m, 130, 3, 76); m.r(236, 14, 86, 62, "#4d5356"); m.set({ n: [0, -0.6] }); m.r(236, 74, 86, 3, "#9aa09c"); m.set({ n: [0, 0] }); K.paper(m, 24, 26, 26, 34); m.r(60, 22, 40, 30, "#4a3322"); m.r(62, 24, 36, 26, "#2d4a5e"); m.ell(80, 40, 12, 6, "#c9b88a", 0.8); }
    // médaillon à la balance, drapeau, horloge
    if (!cab) {
      m.set({ S: 150, D: 168 }); m.orb(180, 21, 9, 9, "#b08a3c", 0.7); m.ell(180, 21, 7, 7, S === SKIN.cour ? "#5a1219" : "#efe9d8");
      m.vl(180, 16, 10, "#8d6e2a"); m.hl(175, 18, 11, "#8d6e2a"); m.hl(174, 22, 3, "#8d6e2a"); m.hl(184, 22, 3, "#8d6e2a");
      m.set({ S: 0, D: 160 }); m.vl(66, 40, 60, "#c9a24a"); for (let y = 42; y < 78; y++) { const w = Math.round(Math.sin(y * 0.45) * 1.2); m.r(56 + w, y, 3, 1, "#27407a"); m.r(59 + w, y, 3, 1, "#ecebe0"); m.r(62 + w, y, 4, 1, "#b33a32"); }
    }
    m.set({ S: 0, D: 169 }); K.clockFace(m, 318, cab ? 30 : 24);
  }

  PLANS.audience = {
    H, REF,
    make(W) {
      const stat = new G.Mat(W, H), work = new G.Mat(W, H), OX = Math.floor((W - REF) / 2);
      stat.ox = work.ox = OX;
      let key = "", S = SKIN.tribunal;
      const acts = {}; const act = (k, seed) => acts[k] || (acts[k] = K.actor(seed));
      return {
        W, H, mat: work,
        frame(t, o) {
          o = o || {};
          const m = work, still = !!o.reduce, L = o.looks || {}, n = o.juges || 3, cab = o.room === "cabinet_ji";
          const k2 = skinOf(o);
          if (k2 !== key) { key = k2; S = SKIN[k2]; decor(stat, W, o, S); }
          m.copy(stat);
          const nj = Math.min(9, o.jures || 0);
          if (!nj) K.clockHands(m, 318, cab ? 30 : 24, o.min == null ? 840 : o.min, t, still);
          if (cab) { const hr = ((o.min || 840) % 1440) / 60, day = hr > 8 && hr < 18; for (let y = 17; y < 74; y++) { const k = (y - 17) / 57; m.set({ E: day ? 140 : 60, D: 170, n: [0, 0], S: 0 }); m.hl(239, y, 80, day ? mix([150, 190, 230], [222, 230, 238], k) : mix([14, 20, 40], [70, 46, 40], k * k)); } m.set({ E: 0, S: 30, D: 168 }); m.vl(278, 17, 57, "#e2e5df"); m.hl(239, 44, 80, "#e2e5df"); }
          const sp = o.speaker || K.speaker(), parti = o.court === "retire" || o.court === "attente";
          const lights = [];
          const spot = (x, y, d) => lights.push({ x: OX + x, y, d, r: 90, c: [1, 0.96, 0.86], i: 0.9, wrap: 0.6 });
          // les jurés : un rang surélevé derrière la cour, de part et d'autre du président
          const xs = seats(n);
          if (nj) {
            // l'horloge et le médaillon passeraient derrière les têtes : on les efface
            m.set({ E: 0, n: [0, 0], S: 30, D: 170 }); m.r(305, 11, 26, 26, S.pan); for (let x = 300; x < 336; x += 12) { m.vl(x, 11, 26, S.panD); m.vl(x + 1, 11, 26, S.panL); }
            for (let x = 169; x < 192; x++) { const f = Math.sin(x * 0.9); m.vl(x, 11, 22, f > 0.4 ? "#8a2029" : f < -0.4 ? "#5a1219" : "#74181f"); }
            const pas = Math.min(60, 352 / nj), jx0 = Math.round(180 - pas * (nj - 1) / 2 - 32);
            if (!parti) for (let i = 0; i < nj; i++) {
              const lk = (L.jures && L.jures[i]) || CR.px.lookFrom("jure" + i, { age: 28 + (i * 11) % 40 });
              act("ju" + i, 11.3 + i * 1.9)(m, t, { look: lk, expr: "neutral", talk: false, still, x: Math.round(jx0 + i * pas), y: 7, D: 162 });
            }
            m.set({ E: 0, n: [0, -0.8], S: 100, D: 156 }); m.r(-OX, 53, W, 4, S.deskL); m.hl(-OX, 53, W, mix(PL.rgb(S.deskL), [255, 255, 255], 0.2));
            m.set({ n: [0, 0], S: 40, D: 154 }); m.r(-OX, 57, W, 47, S.desk); m.hl(-OX, 57, W, S.deskD);
            for (let x = -OX + 6; x < W - OX - 30; x += 40) { m.r(x, 62, 32, 26, S.deskD); m.hl(x, 87, 32, S.deskL); m.vl(x + 31, 62, 26, S.deskL); }
            lights.push({ x: OX + 180, y: 10, d: 120, r: 300, c: S.key, i: 0.8, wrap: 0.6 });
          }
          // fauteuils, puis magistrats (les côtés d'abord, le président en dernier)
          for (const x of xs) { if (nj) { m.set({ E: 0, n: [0, 0], S: 30, D: 150 }); m.r(x + 11, 64, 42, 38, S.chair); m.set({ n: [0, -0.6] }); m.hl(x + 11, 63, 42, mix(PL.rgb(S.chair), [255, 255, 255], 0.25)); m.set({ n: [0, 0] }); continue; } m.set({ E: 0, n: [0, 0], S: 30, D: 150 }); m.r(x + 9, 30, 46, 72, S.chair); m.r(x + 13, 26, 38, 4, S.chair); m.set({ n: [0, -0.6] }); m.hl(x + 13, 25, 38, mix(PL.rgb(S.chair), [255, 255, 255], 0.25)); m.set({ n: [0, 0] }); for (const [a, b] of [[x + 12, 30], [x + 51, 30]]) { m.set({ S: 140 }); m.px(a, b, "#c9a24a"); } }
          if (!parti) xs.forEach((x, i) => {
            const pres = i === xs.length - 1, lk = pres ? (L.president || CR.px.lookFrom("presidence", { outfit: "robe", age: 56 })) : CR.px.lookFrom("assesseur" + i + (L.president ? L.president.hand || L.president.hc : ""), { outfit: (L.president && L.president.outfit) || "robe", age: 46 + i * 7 });
            act("j" + i, 1.7 + i * 2.3)(m, t, { look: lk, expr: "neutral", talk: pres && (sp === "president" || sp === "juge" || sp === "ji" || sp === "jld"), still, x, y: cab ? 44 : 36, D: 140 });
            if (pres && (sp === "president" || sp === "ji" || sp === "jld")) spot(x + 32, 60, 100);
          });
          // la table du tribunal
          const x0 = cab ? 70 : xs[0] - 16, x1 = cab ? 290 : Math.max(...xs) + 80, ty = cab ? 106 : 98;
          m.set({ E: 0, n: [0, -0.8], S: 100, D: 134 }); m.r(x0, ty, x1 - x0, 5, S.deskL); m.hl(x0, ty, x1 - x0, mix(PL.rgb(S.deskL), [255, 255, 255], 0.2));
          m.set({ n: [0, 0], S: 40, D: 132 }); m.r(x0 + 2, ty + 5, x1 - x0 - 4, H - ty - 5, S.desk); m.hl(x0 + 2, ty + 5, x1 - x0 - 4, S.deskD);
          for (let x = x0 + 8; x < x1 - 30; x += 36) { m.r(x, ty + 9, 30, 15, S.deskD); m.hl(x, ty + 23, 30, S.deskL); m.vl(x + 29, ty + 9, 15, S.deskL); }
          m.set({ n: [0, -0.8], S: 20, D: 136 }); m.r(170, ty - 2, 22, 3, "#e3d3a2"); m.r(196, ty - 1, 12, 2, "#f1ecdc"); m.set({ S: 150 }); m.r(150, ty - 3, 3, 3, "#c9a24a");
          // ministère public, à droite
          if (L.parquet) {
            const px = n >= 5 ? 300 : 292;
            act("pq", 5.9)(m, t, { look: L.parquet, expr: "neutral", talk: sp === "parquet", still, x: px, y: sp === "parquet" ? 40 : 46, D: 128 });
            m.set({ E: 0, n: [0, -0.8], S: 100, D: 122 }); m.r(px - 8, 108, 80, 4, S.deskL); m.set({ n: [0, 0], S: 40, D: 120 }); m.r(px - 6, 112, 78, H - 112, S.desk); m.hl(px - 6, 112, 78, S.deskD); m.r(px, 116, 60, 10, S.deskD);
            m.set({ n: [0, -0.8], S: 20 }); m.r(px + 6, 105, 18, 3, "#b33a32");
            if (sp === "parquet") spot(px + 32, 64, 96);
          }
          // à gauche : le box vitré (personne détenue) ou le greffe
          if (o.box && o.camp !== "pc") {
            act("cl", 8.4)(m, t, { look: L.client, expr: "worried", talk: sp === "client", still, x: 8, y: 48, D: 128 });
            m.set({ E: 0, n: [0, 0], S: 60, D: 122 }); m.r(2, 108, 78, H - 108, S.deskD); m.hl(2, 108, 78, S.deskL);
            m.set({ S: 220, D: 120 }); for (const x of [2, 40, 78]) m.r(x, 34, 2, 74, "#8fa3ad"); m.hl(2, 34, 78, "#8fa3ad"); m.set({ E: 20 }); m.line(10, 96, 30, 44, [200, 220, 235], 0.16); m.line(50, 100, 70, 48, [200, 220, 235], 0.14); m.set({ E: 0 });
            if (sp === "client") spot(40, 70, 96);
          } else if (L.greffier && !cab) {
            act("gr", 3.3)(m, t, { look: L.greffier, expr: "neutral", talk: sp === "greffier", still, x: 6, y: 50, D: 128 });
            m.set({ E: 0, n: [0, -0.8], S: 100, D: 122 }); m.r(0, 110, 78, 4, S.deskL); m.set({ n: [0, 0], S: 40, D: 120 }); m.r(0, 114, 76, H - 114, S.desk); m.hl(0, 114, 76, S.deskD);
            m.set({ S: 50, D: 124 }); m.r(52, 92, 22, 16, "#15181d"); m.r(61, 108, 4, 2, "#2c3038"); m.set({ E: 120 }); m.vl(52, 93, 14, "#9fb6dc"); m.set({ E: 0 });
          }
          // la barre
          if (!cab) { m.set({ E: 0, n: [0, 0], S: 150, D: 70 }); m.r(150, 120, 60, 3, "#c9a24a"); m.r(152, 123, 3, H - 123, "#8d6e2a"); m.r(205, 123, 3, H - 123, "#8d6e2a"); }
          // la personne que vous assistez, de dos à côté de vous (sauf si elle est dans le box)
          if (!(o.box && o.camp !== "pc") && L.client) {
            const ci = K.bustImg(L.client, "neutral", false, false);
            K.back(m, 104, 100, { hc: L.client.hc, g: L.client.g, coat: ci ? PL.hexOf(mix(K.sample(ci, 10, 61), [0, 0, 0], 0.35)) : "#3a4048", skin: ci ? PL.hexOf(mix(K.sample(ci, 32, 34), [0, 0, 0], 0.2)) : null, D: 28 });
          }
          const cour = S === SKIN.cour;
          lights.push(
            { x: OX + 180, y: -10, d: 80, r: 460, c: S.key, i: S.ki, wrap: 0.5, haze: cour ? 0 : 0.1, hr: 70 },
            { x: OX + 60, y: 6, d: 110, r: 260, c: S.key, i: cour ? 0.5 : 0.9, wrap: 0.5 },
            { x: OX + 300, y: 6, d: 110, r: 260, c: S.key, i: cour ? 0.5 : 0.9, wrap: 0.5 },
            { x: OX + 180, y: 70, d: 60, r: 220, c: [1, 0.95, 0.86], i: 0.55, wrap: 0.7 },
            { x: OX + 104, y: 66, d: 24, r: 150, c: [1, 0.95, 0.85], i: 1.5, wrap: 0.02 });
          if (cour) lights.push({ x: OX + 24, y: 40, d: 160, r: 90, c: [1, 0.8, 0.5], i: 1.2, haze: 0.14, hr: 26 }, { x: OX + 336, y: 40, d: 160, r: 90, c: [1, 0.8, 0.5], i: 1.2, haze: 0.14, hr: 26 });
          return { t, floorY: 128, reflK: 1.2, wet: 0.25, grain: 0.03, vig: cour ? 0.5 : 0.36, bloom: cour ? 1.1 : 0.8, tint: cour ? [1.04, 0.98, 0.94] : [0.98, 0.99, 1.03], amb: S.amb, lights };
        },
      };
    },
  };
})();
