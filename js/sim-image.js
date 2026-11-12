// La Permanence — refonte du gameplay, lot 1 : le metteur en scène des images de pièces (CR.SIMIMG)
// Quatre éléments indépendants : le lieu (décor vu d'en haut et de biais), les acteurs (emplacements où se branche
// n'importe quelle fiche de personne), le geste (squelette articulé, bibliothèque de poses), la caméra (basse
// résolution, grain, déformation, horodatage incrusté, infrarouge la nuit).
// L'image montre ce que la simulation sait, pas plus : capuche, distance, personne en bordure du champ.
// Limites de contenu : la violence se lit dans la position des corps ; ni gros plan, ni blessure.
(function () {
  "use strict";
  const CR = window.CR, SIM = CR.SIMV;
  const IMG = (CR.SIMIMG = {});
  const W = 320, H = 240;
  const rad = (d) => (d * Math.PI) / 180;

  // ------------------------------------------------------------------ Le geste : poses du squelette
  // angles en degrés ; bras et jambes mesurés depuis la verticale basse, positifs vers l'avant (le sens du regard)
  // [inclinaison du tronc, bras avant (haut, coude), bras arrière (haut, coude), jambe avant, jambe arrière]
  IMG.POSES = {
    debout: { tronc: 0, ba: [6, 4], br: [-6, -2], ja: 5, jr: -5 },
    marche: { tronc: 4, ba: [-16, 8], br: [18, 14], ja: 20, jr: -18 },
    frappe: { tronc: 14, ba: [84, 6], br: [-30, 70], ja: 24, jr: -22 },
    gifle: { tronc: 8, ba: [70, 28], br: [-12, 20], ja: 16, jr: -14 },
    pousse: { tronc: 12, ba: [78, 4], br: [74, 6], ja: 22, jr: -20 },
    tete: { tronc: 30, ba: [-24, 30], br: [-34, 24], ja: 18, jr: -20 },
    arme: { tronc: 6, ba: [138, -20], br: [-10, 24], ja: 18, jr: -16, objet: true },
    encaisse: { tronc: -20, ba: [52, 60], br: [-48, -30], ja: 8, jr: -26 },
    tient: { tronc: 6, ba: [66, 38], br: [60, 44], ja: 10, jr: -10 },
    regarde: { tronc: 0, ba: [10, 80], br: [-4, 0], ja: 4, jr: -4 },
    telephone: { tronc: 0, ba: [30, 140], br: [-4, 0], ja: 4, jr: -6 },
  };
  const GESTE = { poing: "frappe", gifle: "gifle", poussee: "pousse", tete: "tete", arme: "arme", pied: "frappe" };

  // ------------------------------------------------------------------ La mise en scène : de la simulation à la scène
  IMG.scene = function (S) {
    if (!S || !S.cam) return null;
    const v = S.verite, P = S.P, r = SIM.fil(S.sig + ":image");
    const prof = CR.clamp(S.cam.dist * 0.36, 3, 8); // profondeur de l'action dans le champ
    const acteurs = [];
    const fiche = (X, role, x, y, pose, dir, o) => acteurs.push(Object.assign({ role, x, y, pose, dir, taille: (X.sig.taille || 172) / 100, haut: X.sig.hautHex, bas: X.sig.basHex, capuche: !!X.sig.capuche, cheveux: X.sig.cheveux, corp: X.sig.corp }, o || {}));
    const Fr = P[v.frappeur];
    fiche(Fr, "auteur", -0.42, prof, GESTE[v.coups[0]] || "frappe", 1);
    fiche(P.V, "victime", 0.42, prof, "encaisse", -1);
    if (v.role2 === "tient" && P.C) fiche(P.C, "second", 0.92, prof + 0.15, "tient", -1);
    if (v.innocent && !S.t.f.agg.includes("reunion")) fiche(P.A, "present", -3.3 - r.next() * 0.8, prof + 0.9, "regarde", 1);
    if (v.innocent && S.t.f.agg.includes("reunion")) fiche(P.A, "present", -1.6, prof + 0.7, "debout", 1);
    // le témoin, s'il est dans le champ ; quelques passants sans rôle
    if (S.t.preuves.includes("temoin") && P.T.dist < 9) fiche(P.T, "temoin", 2.4 + P.T.dist * 0.25, prof - 1.2, "regarde", -1);
    const n = r.int(0, 2);
    for (let i = 0; i < n; i++) acteurs.push({ role: "passant", x: (r.next() < 0.5 ? -1 : 1) * (2.6 + r.next() * 2), y: prof + (r.next() - 0.3) * 3.4, pose: r.pk(["marche", "debout", "telephone"]), dir: r.next() < 0.5 ? 1 : -1, taille: 1.6 + r.next() * 0.25, haut: r.pk(["#33363d", "#6d5a47", "#8a8f97", "#2b3a55", "#5c2f33"]), bas: r.pk(["#22242a", "#3b4e6b", "#6d6f73"]), capuche: false, cheveux: "bruns courts", corp: "moyenne" });
    acteurs.sort((a, b) => b.y - a.y); // du fond vers l'avant
    const [hh, mn] = SIM.hm(S.T0), d = CR.ymd(SIM.jour(S, S.T0));
    const p2 = (x) => String(x).padStart(2, "0");
    return {
      type: "camera", kind: S.lieu.kind, sc: S.lieu.sc, enseigne: S.lieu.enseigne || "", nuit: S.cam.nuit, ir: S.cam.ir, dist: S.cam.dist, prof,
      label: S.cam.label, stamp: `${p2(d.d)}-${p2(d.m)}-${d.y} ${p2(hh)}:${p2(mn)}:${p2(S.cam.sec)}`, acteurs, graine: CR.hash(S.sig + ":grain"),
    };
  };

  // ------------------------------------------------------------------ Projection : le sol vu d'en haut et de biais
  const ech = (y) => 31 * (1 - 0.034 * y);                    // pixels par mètre à la profondeur y
  const sy = (y) => H * 0.97 - y * 17.5 * (1 - 0.016 * y);    // rangée d'écran du sol à la profondeur y
  const sx = (x, y) => W / 2 + x * ech(y);
  const VERT = 0.8;                                            // un corps debout, écrasé par la plongée

  // ------------------------------------------------------------------ Le lieu
  function quad(c, pts, col) { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); }
  const bande = (c, y0, y1, col) => quad(c, [[0, sy(y0)], [W, sy(y0)], [W, sy(y1)], [0, sy(y1)]], col);
  function ligne(c, x0, y0, x1, y1, col, w) { c.strokeStyle = col; c.lineWidth = w || 1; c.beginPath(); c.moveTo(sx(x0, y0), sy(y0)); c.lineTo(sx(x1, y1), sy(y1)); c.stroke(); }
  function boite(c, x, y, l, p, h, col, dessus) { // un volume posé au sol : largeur l, profondeur p, hauteur h (mètres)
    const hp = h * ech(y) * VERT;
    quad(c, [[sx(x, y), sy(y)], [sx(x + l, y), sy(y)], [sx(x + l, y), sy(y) - hp], [sx(x, y), sy(y) - hp]], col);
    quad(c, [[sx(x, y), sy(y) - hp], [sx(x + l, y), sy(y) - hp], [sx(x + l, y + p), sy(y + p) - h * ech(y + p) * VERT], [sx(x, y + p), sy(y + p) - h * ech(y + p) * VERT]], dessus || col);
  }
  const LIEUX = {
    trottoir(c, sp, r) {
      bande(c, -1, 2.2, "#3d3f44");                       // chaussée, au premier plan
      bande(c, 2.2, 2.5, "#8d8f90");                      // bordure
      bande(c, 2.5, 13, "#77797a");                       // trottoir
      for (let y = 3; y < 13; y += 1.1) ligne(c, -8, y, 8, y, "rgba(0,0,0,0.13)");
      for (let x = -7; x <= 7; x += 1.6) ligne(c, x, 2.5, x, 13, "rgba(0,0,0,0.1)");
      for (let x = -6; x < 6; x += 2.4) quad(c, [[sx(x, 0.9), sy(0.9)], [sx(x + 1.2, 0.9), sy(0.9)], [sx(x + 1.2, 1.1), sy(1.1)], [sx(x, 1.1), sy(1.1)]], "#b9b9b2"); // ligne discontinue
      // façade au fond : soubassement, porte, vitrine
      const yf = 12.2, top = sy(yf) - 46;
      quad(c, [[0, sy(yf)], [W, sy(yf)], [W, 0], [0, 0]], "#5b5550");
      quad(c, [[0, top + 30], [W, top + 30], [W, sy(yf)], [0, sy(yf)]], "#4a4541");
      const vit = sp.sc === "bar" || sp.sc === "file";
      if (vit) { quad(c, [[sx(-3.4, yf), top + 4], [sx(1.2, yf), top + 4], [sx(1.2, yf), sy(yf)], [sx(-3.4, yf), sy(yf)]], sp.nuit ? "#c9b071" : "#5f6d72"); quad(c, [[sx(1.6, yf), top + 2], [sx(2.8, yf), top + 2], [sx(2.8, yf), sy(yf)], [sx(1.6, yf), sy(yf)]], "#2d2a28"); quad(c, [[sx(-3.8, yf), top - 4], [sx(3.2, yf), top - 4], [sx(3.4, yf - 0.9), top + 8], [sx(-4, yf - 0.9), top + 8]], sp.sc === "bar" ? "#6b2a2a" : "#2f4d46"); }
      else for (let x = -6; x < 6; x += 3) quad(c, [[sx(x, yf), top + 6], [sx(x + 1.5, yf), top + 6], [sx(x + 1.5, yf), sy(yf) - 8], [sx(x, yf), sy(yf) - 8]], "#2e3338");
      if (sp.sc === "bar") for (const [x, y] of [[-4.6, 9.4], [-3, 10.2], [3.6, 9.6], [4.8, 10.6]]) { boite(c, x, y, 0.7, 0.7, 0.72, "#3a2f28", "#5b4a3c"); boite(c, x - 0.6, y + 0.1, 0.4, 0.4, 0.45, "#2c2c30", "#3d3d42"); boite(c, x + 0.9, y + 0.1, 0.4, 0.4, 0.45, "#2c2c30", "#3d3d42"); }
      if (sp.sc === "file") for (const x of [-1.4, -0.7, 0.1]) boite(c, x - 2.6, 11.2, 0.1, 0.1, 0.9, "#8a8a8a");
      for (const x of [-6.3, 6.1]) { boite(c, x, 2.9, 0.16, 0.16, 5.4, "#2a2c2f"); }             // candélabres
      boite(c, 3.4, 0.2, 3.9, 1.7, 1.25, "#2b3e52", "#3a516a"); boite(c, 4, 0.5, 2.2, 1.2, 1.7, "#22303f", "#2f4459"); // voiture garée
      for (let x = -5.5; x < 2.5; x += 1.5) boite(c, x, 2.7, 0.12, 0.12, 0.8, "#54575b");         // potelets
    },
    quai(c, sp) {
      bande(c, -1, 1.6, "#17171a");                        // voie
      ligne(c, -9, 0.3, 9, 0.3, "#6a6a6e", 2); ligne(c, -9, 1.2, 9, 1.2, "#6a6a6e", 2);
      bande(c, 1.6, 1.9, "#d9d6c8"); bande(c, 1.9, 2.5, "#c9a227");                              // nez de quai, bande d'éveil
      bande(c, 2.5, 12, "#8b8e91");
      for (let y = 3; y < 12; y += 0.9) ligne(c, -9, y, 9, y, "rgba(0,0,0,0.1)");
      const yf = 11.4, top = sy(yf) - 52;
      quad(c, [[0, 0], [W, 0], [W, sy(yf)], [0, sy(yf)]], "#d5d2c6");
      for (let x = 0; x < W; x += 7) { c.fillStyle = "rgba(0,0,0,0.06)"; c.fillRect(x, 0, 1, sy(yf)); }
      for (let y = 0; y < sy(yf); y += 5) { c.fillStyle = "rgba(0,0,0,0.05)"; c.fillRect(0, y, W, 1); }
      quad(c, [[sx(-2.6, yf), top + 10], [sx(2.6, yf), top + 10], [sx(2.6, yf), top + 26], [sx(-2.6, yf), top + 26]], "#1c2f6b");
      c.fillStyle = "#e9e9e4"; c.fillRect(sx(-2.2, yf), top + 16, sx(2.2, yf) - sx(-2.2, yf), 3);
      boite(c, -5.6, 10.4, 2.2, 0.5, 0.45, "#3f5b4a", "#557a63"); boite(c, 4.2, 10.3, 0.9, 0.7, 1.8, "#2b2d33", "#3a3d45");
    },
    hall(c, sp) {
      bande(c, -1, 13, "#9c9488");
      for (let y = 0; y < 13; y += 0.8) ligne(c, -8, y, 8, y, "rgba(0,0,0,0.12)");
      for (let x = -8; x <= 8; x += 0.8) ligne(c, x, -1, x, 13, "rgba(0,0,0,0.1)");
      const yf = 10.6, top = sy(yf) - 58;
      quad(c, [[0, 0], [W, 0], [W, sy(yf)], [0, sy(yf)]], "#c7bfae");
      quad(c, [[0, sy(yf) - 12], [W, sy(yf) - 12], [W, sy(yf)], [0, sy(yf)]], "#6d5f4f");
      if (sp.sc === "travail") { for (let x = -5.5; x < 5; x += 2.1) { boite(c, x, 9.4, 1.8, 0.6, 2, "#6f7378", "#8b9095"); for (let k = 0; k < 3; k++) boite(c, x + 0.1, 9.2 - 0.01, 1.6, 0.5, 0.5 + k * 0.6, "#a2845c", "#b89868"); } boite(c, -6.5, 4.2, 1.2, 1, 0.9, "#a2845c", "#b89868"); }
      else { quad(c, [[sx(-1.1, yf), top + 8], [sx(1.1, yf), top + 8], [sx(1.1, yf), sy(yf)], [sx(-1.1, yf), sy(yf)]], "#3a3f45"); for (let k = 0; k < 6; k++) quad(c, [[sx(3 + k * 0.55, yf), top + 22], [sx(3.45 + k * 0.55, yf), top + 22], [sx(3.45 + k * 0.55, yf), top + 40], [sx(3 + k * 0.55, yf), top + 40]], "#7b6a52"); quad(c, [[sx(-1.2, 8.6), sy(8.6)], [sx(1.2, 8.6), sy(8.6)], [sx(1.2, 9.6), sy(9.6)], [sx(-1.2, 9.6), sy(9.6)]], "#4d3b30"); for (let k = 0; k < 4; k++) boite(c, -7, 6.5 + k * 0.5, 2.2, 0.5, 0.2 + k * 0.2, "#8a8377", "#a59d8f"); }
    },
    terrain(c, sp) {
      bande(c, -1, 14, "#3f6b45");
      for (let x = -9; x < 9; x += 2) quad(c, [[sx(x, -1), sy(-1)], [sx(x + 1, -1), sy(-1)], [sx(x + 1, 14), sy(14)], [sx(x, 14), sy(14)]], "rgba(255,255,255,0.035)");
      ligne(c, -8, 1.4, 8, 1.4, "#e4e6de", 2); ligne(c, 0, 1.4, 0, 13, "#e4e6de", 2);
      c.strokeStyle = "#e4e6de"; c.lineWidth = 1.5; c.beginPath(); c.ellipse(sx(0, 7), sy(7), 2.6 * ech(7), 2.6 * 17.5 * 0.86, 0, 0, Math.PI * 2); c.stroke();
      const yf = 13, top = sy(yf) - 30;
      for (let x = 0; x < W; x += 6) { c.fillStyle = "rgba(20,24,22,0.55)"; c.fillRect(x, top, 1, 30); } c.fillStyle = "rgba(20,24,22,0.45)"; for (let y = top; y < top + 30; y += 5) c.fillRect(0, y, W, 1);
      quad(c, [[0, 0], [W, 0], [W, top], [0, top]], sp.nuit ? "#16181c" : "#7d8a8e");
      boite(c, -7.6, 5.6, 0.12, 2.6, 2, "#dedede"); boite(c, -7.6, 5.6, 0.12, 0.12, 2, "#dedede");
    },
  };

  // ------------------------------------------------------------------ Les acteurs : un squelette habillé
  function acteur(c, a, sp) {
    const e = ech(a.y), gy = sy(a.y), gx = sx(a.x, a.y), d = a.dir;
    const P = IMG.POSES[a.pose] || IMG.POSES.debout;
    const u = a.taille * e * VERT;                       // hauteur à l'écran
    const jambe = u * 0.48, tronc = u * 0.33, tete = u * 0.085, bras = u * 0.19;
    const ep = Math.max(1.6, e * 0.2 * (a.corp === "forte" ? 1.3 : a.corp === "mince" ? 0.85 : 1));
    // ombre portée
    c.fillStyle = sp.nuit ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.28)";
    c.beginPath(); c.ellipse(gx + u * 0.12, gy + 1, u * 0.24, Math.max(1.5, u * 0.07), 0, 0, Math.PI * 2); c.fill();
    const hx = gx, hy = gy - jambe * Math.cos(rad(Math.max(Math.abs(P.ja), Math.abs(P.jr))));
    const seg = (x0, y0, x1, y1, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
    const membre = (x0, y0, a1, a2, l, col, w) => { const x1 = x0 + Math.sin(rad(a1)) * l * d, y1 = y0 + Math.cos(rad(a1)) * l; seg(x0, y0, x1, y1, col, w); const x2 = x1 + Math.sin(rad(a1 + a2)) * l * 0.92 * d, y2 = y1 + Math.cos(rad(a1 + a2)) * l * 0.92; seg(x1, y1, x2, y2, col, w * 0.88); return [x2, y2]; };
    const ex = hx + Math.sin(rad(P.tronc)) * tronc * d, ey = hy - Math.cos(rad(P.tronc)) * tronc; // épaules
    // bras arrière, jambes, tronc, bras avant, tête : du fond vers l'avant
    membre(ex, ey, P.br[0], P.br[1], bras, ombre(a.haut, 0.72), ep * 0.8);
    membre(hx, hy, P.jr, 6, jambe / 2, ombre(a.bas, 0.8), ep);
    membre(hx, hy, P.ja, -6, jambe / 2, a.bas, ep);
    seg(hx, hy, ex, ey, a.haut, ep * 1.9);
    const main = membre(ex, ey, P.ba[0], P.ba[1], bras, a.haut, ep * 0.85);
    if (P.objet) seg(main[0], main[1], main[0] + 2 * d, main[1] - u * 0.11, "#b9b9b9", Math.max(1, ep * 0.4));
    const tx = ex + Math.sin(rad(P.tronc)) * tete * 1.5 * d, ty = ey - Math.cos(rad(P.tronc)) * tete * 1.5;
    if (a.capuche) { c.fillStyle = a.haut; c.beginPath(); c.arc(tx - d * tete * 0.15, ty, tete * 1.22, 0, Math.PI * 2); c.fill(); c.fillStyle = "rgba(0,0,0,0.55)"; c.beginPath(); c.arc(tx + d * tete * 0.35, ty + tete * 0.1, tete * 0.62, 0, Math.PI * 2); c.fill(); }
    else { c.fillStyle = "#b08a6c"; c.beginPath(); c.arc(tx, ty, tete, 0, Math.PI * 2); c.fill(); c.fillStyle = /blond/.test(a.cheveux) ? "#b89b5e" : /gris/.test(a.cheveux) ? "#8d8d8d" : /rasés/.test(a.cheveux) ? "#7a604c" : "#2a211c"; c.beginPath(); c.arc(tx - d * tete * 0.25, ty - tete * 0.3, tete * 0.92, Math.PI * 0.95, Math.PI * 2.05); c.fill(); }
  }
  function ombre(hex, k) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.round(v * k); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }

  // ------------------------------------------------------------------ La caméra : ce que le capteur en fait
  function capteur(c, sp) {
    let img; try { img = c.getImageData(0, 0, W, H); } catch (e) { return; }
    const src = img.data; if (!src || src.length < W * H * 4) return;
    const out = new Uint8ClampedArray(src.length);
    let g = sp.graine >>> 0 || 1;
    const bruit = () => { g = (Math.imul(g, 1664525) + 1013904223) >>> 0; return (g >>> 8) / 16777216 - 0.5; };
    const k = 0.13, flou = sp.dist > 14, n = sp.nuit ? (sp.ir ? 46 : 58) : 22;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // déformation en barillet de l'objectif grand angle
      const u = (x - W / 2) / (W / 2), v = (y - H / 2) / (H / 2), f = (1 + k * (u * u + v * v)) / (1 + k * 0.9);
      let X = Math.round(W / 2 + u * f * (W / 2)), Y = Math.round(H / 2 + v * f * (H / 2));
      if (flou) { X &= ~1; Y &= ~1; }
      const o = (y * W + x) * 4;
      if (X < 0 || Y < 0 || X >= W || Y >= H) { out[o] = out[o + 1] = out[o + 2] = 8; out[o + 3] = 255; continue; }
      const i = (Y * W + X) * 4;
      let R = src[i], G = src[i + 1], B = src[i + 2];
      const lum = 0.3 * R + 0.59 * G + 0.11 * B, vig = 1 - 0.34 * (u * u + v * v);
      if (sp.nuit && sp.ir) { const l = CR.clamp((lum - 30) * 1.45 + 34, 0, 255); R = l * 0.96; G = l; B = l * 0.97; }  // infrarouge : noir et blanc
      else if (sp.nuit) { R = lum * 0.62 + R * 0.2 + 14; G = lum * 0.5 + G * 0.16 + 8; B = lum * 0.3 + B * 0.1; }       // éclairage public
      else { R = R * 0.72 + lum * 0.28; G = G * 0.74 + lum * 0.28; B = B * 0.78 + lum * 0.3 + 4; }                        // couleurs lavées
      const b = bruit() * n, tr = y & 1 ? 0.93 : 1;
      out[o] = (R + b) * vig * tr; out[o + 1] = (G + b) * vig * tr; out[o + 2] = (B + b * 0.9) * vig * tr; out[o + 3] = 255;
    }
    img.data.set(out); c.putImageData(img, 0, 0);
  }
  function incruste(c, sp) {
    c.font = "bold 9px 'Courier Prime', 'Courier New', monospace"; c.textBaseline = "top";
    const txt = (t, x, y) => { c.fillStyle = "rgba(0,0,0,0.75)"; c.fillText(t, x + 1, y + 1); c.fillStyle = "#f2f2ee"; c.fillText(t, x, y); };
    txt(sp.stamp, 8, 7); txt(sp.label, 8, H - 17);
  }

  // dessine la scène dans un canevas (basse résolution, agrandie sans lissage)
  IMG.dessiner = function (canvas, sp) {
    if (!canvas || !sp) return;
    const doc = canvas.ownerDocument || document;
    const buf = doc.createElement("canvas"); buf.width = W; buf.height = H;
    const c = buf.getContext("2d"); if (!c) return;
    c.fillStyle = "#555"; c.fillRect(0, 0, W, H);
    const r = SIM.fil("decor:" + sp.graine);
    (LIEUX[sp.kind] || LIEUX.trottoir)(c, sp, r);
    if (sp.nuit) { // la nuit : tout tombe, sauf sous les lampes
      c.fillStyle = "rgba(6,8,16,0.5)"; c.fillRect(0, 0, W, H);
      const hal = (x, y, R) => { const gr = c.createRadialGradient && c.createRadialGradient(x, y, 2, x, y, R); if (!gr || !gr.addColorStop) return; gr.addColorStop(0, "rgba(255,226,170,0.34)"); gr.addColorStop(1, "rgba(255,226,170,0)"); c.fillStyle = gr; c.fillRect(x - R, y - R, R * 2, R * 2); };
      hal(sx(-1, sp.prof), sy(sp.prof) - 10, 95); hal(sx(5, 10), sy(10), 60);
    }
    for (const a of sp.acteurs) acteur(c, a, sp);
    capteur(c, sp); incruste(c, sp);
    const k = canvas.getContext("2d"); if (!k) return;
    k.imageSmoothingEnabled = false; k.drawImage(buf, 0, 0, canvas.width, canvas.height);
  };

  // ------------------------------------------------------------------ Schéma corporel du certificat
  // [mot du siège, x, y] sur une silhouette de face (0..100 × 0..200) ; la gauche de la personne est à droite du dessin
  const SIEGES = [[/arcade sourcilière droite/, 45, 17], [/péri-orbitaire gauche/, 55, 19], [/pommette gauche|malaire gauche/, 56, 23], [/pommette droite/, 44, 23], [/nez|nasale/, 50, 22], [/lèvre/, 50, 27], [/cuir chevelu/, 50, 9], [/cou/, 54, 36], [/épaule gauche/, 68, 46], [/basithoracique gauche|côte gauche/, 60, 74], [/coude droit/, 24, 80], [/avant-bras gauche/, 78, 92], [/poignet droit|paume droite/, 19, 104], [/genou droit/, 42, 150]];
  IMG.sieges = (lesions) => { const pts = []; for (const l of lesions) for (const [re, x, y] of SIEGES) if (re.test(l) && !pts.some((p) => p.x === x && p.y === y)) pts.push({ x, y }); return pts; };
  IMG.schema = function (canvas, lesions) {
    const c = canvas && canvas.getContext("2d"); if (!c) return;
    const k = canvas.height / 200, ox = (canvas.width - 100 * k) / 2;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save(); c.translate(ox, 0); c.scale(k, k);
    c.strokeStyle = "#3a3a3a"; c.lineWidth = 0.9; c.lineJoin = "round";
    c.beginPath(); c.ellipse(50, 20, 10, 13, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath();
    c.moveTo(46, 32); c.lineTo(46, 38); c.lineTo(30, 42); c.lineTo(24, 60); c.lineTo(18, 100); c.lineTo(15, 112); c.lineTo(21, 113); c.lineTo(24, 101); c.lineTo(32, 66); c.lineTo(34, 100);
    c.lineTo(33, 118); c.lineTo(37, 160); c.lineTo(36, 190); c.lineTo(32, 196); c.lineTo(46, 196); c.lineTo(46, 160); c.lineTo(50, 122);
    c.lineTo(54, 160); c.lineTo(54, 196); c.lineTo(68, 196); c.lineTo(64, 190); c.lineTo(63, 160); c.lineTo(67, 118); c.lineTo(66, 100); c.lineTo(68, 66);
    c.lineTo(76, 101); c.lineTo(79, 113); c.lineTo(85, 112); c.lineTo(82, 100); c.lineTo(76, 60); c.lineTo(70, 42); c.lineTo(54, 38); c.lineTo(54, 32);
    c.stroke();
    c.font = "bold 11px 'Source Sans 3', sans-serif"; c.fillStyle = "#3a3a3a"; c.fillText("D", 8, 16); c.fillText("G", 84, 16);
    c.strokeStyle = "#8a1c1c"; c.fillStyle = "#8a1c1c"; c.lineWidth = 1.1;
    IMG.sieges(lesions).forEach((p, i) => { c.beginPath(); c.moveTo(p.x - 3, p.y - 3); c.lineTo(p.x + 3, p.y + 3); c.moveTo(p.x + 3, p.y - 3); c.lineTo(p.x - 3, p.y + 3); c.stroke(); c.fillText(String(i + 1), p.x + 4.5, p.y + 2); });
    c.restore();
  };

  // Contrôle (tests) : la scène ne montre que ce que la simulation sait
  IMG.verifier = function (S, sp) {
    const pb = [], v = S.verite, au = sp.acteurs.find((a) => a.role === "auteur");
    if (!au) pb.push("pas d'auteur à l'image");
    else { const Fr = S.P[v.frappeur]; if (au.haut !== Fr.sig.hautHex || au.capuche !== !!Fr.sig.capuche) pb.push("l'auteur à l'image n'est pas celui de la simulation"); }
    if (!sp.acteurs.some((a) => a.role === "victime")) pb.push("pas de victime à l'image");
    if (v.innocent && !sp.acteurs.some((a) => a.role === "present")) pb.push("le mis en cause innocent n'est pas à l'image");
    if ((v.role2 === "tient") !== sp.acteurs.some((a) => a.role === "second")) pb.push("second individu");
    if (!/^\d\d-\d\d-\d{4} \d\d:\d\d:\d\d$/.test(sp.stamp)) pb.push("horodatage");
    for (const a of sp.acteurs) if (!IMG.POSES[a.pose]) pb.push("pose inconnue " + a.pose);
    return pb;
  };
})();
