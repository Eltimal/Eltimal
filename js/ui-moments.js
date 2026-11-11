/* La Permanence — les moments forts : le trajet, le verdict, le débrief, le papier des actes et des décisions.
   Trajet : chaque déplacement joue une courte animation en pixel (rame de métro dans le tunnel jusqu'au quai, ou taxi
   dans les rues de Paris, de jour, de nuit, sous la pluie), par-dessus l'écran ; un clic la passe. Le choix du moyen de
   transport se fait sur une vignette animée : la bouche de métro d'un côté, le taxi qui attend de l'autre.
   Verdict : une vignette (relaxe, acquittement, condamnation) au-dessus de la décision, avec la scène qui va avec.
   Décisions sur papier à en-tête « République française — Au nom du peuple français », signatures et sceau du greffe ;
   actes de l'avocat avec son cachet. Débrief en fiche cartonnée. */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html, Btn, cx } = UI;
  const { useState, useEffect, useRef } = React;
  const D = CR.dec, H = D.H;
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  const reduced = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const flat = { c: (h) => h };
  const DW = (ctx) => D.wrap(CR.px.painter(ctx), flat);

  // =================================================================== Trajet
  CR.fx = CR.fx || { travel: null };
  const STATIONS = { palais: "Porte de Clichy", cite: "Cité", umj: "Cité", ordre: "Cité" };
  const travel0 = CR.travel;
  CR.travel = function (s, to, mode) {
    const from = s.at, min0 = s.min;
    const r = travel0.apply(this, arguments);
    if (from !== to && mode) {
      const pl = CR.placeOf ? CR.placeOf(s, to) : null;
      CR.fx.travel = { id: Math.random(), from, to, mode, min0, min1: s.min, rain: D.rainy(s), season: D.seasonOf(s), nom: pl ? pl.nom : to, zone: pl ? pl.zone : "paris", minutes: r, dur: 2700 / Math.min(4, Math.max(1, (s.settings && s.settings.textSpeed) || 1)) };
    }
    return r;
  };

  // un canvas en basse résolution, agrandi d'un facteur entier, animé tant que le composant vit
  function useLowCanvas(draw, deps, o = {}) {
    const ref = useRef(null), drawRef = useRef(draw);
    drawRef.current = draw;
    useEffect(() => {
      const c = ref.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1, host = c.parentElement;
      const cw = (host && host.clientWidth) || 640, hh = o.h || H;
      const k = Math.max(1, Math.round((o.css || (cw < 640 ? 150 : 200)) * dpr / hh)), W = Math.max(o.minW || 120, Math.ceil(cw * dpr / k));
      c.width = W * k; c.height = hh * k; c.style.width = (W * k / dpr) + "px"; c.style.height = (hh * k / dpr) + "px";
      const low = D.mk(W, hh), lctx = low.getContext("2d"), ctx = c.getContext("2d");
      let raf = 0, alive = true, last = 0;
      const t0 = now();
      const paint = (t) => { lctx.clearRect(0, 0, W, hh); try { drawRef.current(lctx, W, hh, t); } catch (e) { console.error(e); alive = false; } ctx.imageSmoothingEnabled = false; ctx.drawImage(low, 0, 0, W * k, hh * k); };
      paint(0);
      if (o.still || reduced()) return () => { alive = false; };
      const loop = (n) => { if (!alive) return; if (n - last > 40) { last = n; paint((n - t0) / 1000); } raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      return () => { alive = false; cancelAnimationFrame(raf); };
    }, deps);
    return ref;
  }

  // ---------------------------------------------------------------- la rame de métro, du tunnel au quai
  function drawMetro(ctx, W, Hh, t, fx, p) {
    const P = CR.px.painter(ctx), d = DW(ctx), night = CR.mapPhase(fx.min0) === "nuit";
    const rer = fx.zone !== "paris", sign = rer ? "RER" : STATIONS[fx.to] || "";
    const dist = W * 6, ease = 1 - Math.pow(1 - p, 2.2), camX = dist * ease, stationX = dist - W * 0.2;
    // fond : tunnel puis quai carrelé
    P.r(0, 0, W, Hh, "#101217");
    for (let x = 0; x < W; x++) {
      const wx = camX + x;
      if (wx > stationX) { const ty = (wx >> 3) & 1; P.r(x, 4, 1, 60, ((wx % 8) === 0) ? "#b9b4a6" : "#e9e5d9"); for (let y = 4; y < 64; y += 6) P.p(x, y + ty * 3, "#c9c4b6"); }
      else if (wx % 48 < 3) P.r(x, 0, 1, Hh, "#1c1f27");
    }
    if (camX + W > stationX) {
      const sx = Math.round(stationX - camX + W * 0.55), txt = sign ? sign.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase() : "M", tw = txt.length * 4 + 9;
      P.r(sx - (tw >> 1) - 1, 7, tw + 2, 13, "#e9e5d9"); P.r(sx - (tw >> 1), 8, tw, 11, "#1d3f8f"); P.r(sx - (tw >> 1) + 1, 9, tw - 2, 9, "#24499e"); CR.px.text(P, txt, sx - (tw >> 1) + 5, 11, "#ffffff");
      P.r(0, 64, W, Hh - 64, "#8a8478"); P.r(0, 64, W, 2, "#d8b84a");
    } else {
      for (let x = (-(camX * 1) % 48 + 48) % 48 - 48; x < W; x += 48) { P.r(Math.round(x) + 20, 12, 3, 2, "#ffcf7a"); P.r(Math.round(x) + 14, 13, 16, 1, "rgba(255,207,122,0.25)"); }
      P.r(0, 20, W, 1, "#07080b"); P.r(0, 23, W, 1, "#07080b");
      if (p < 0.85) for (let i = 0; i < 6; i++) { const y = 8 + ((i * 37) % 50), len = 10 + (i * 13) % 20, x = W - ((camX * 1.6 + i * 97) % (W + len)); P.r(Math.round(x), y, len, 1, "rgba(200,210,230,0.18)"); }
    }
    // la rame, immobile dans le cadre ; un léger roulis
    const jig = p < 0.97 && Math.floor(t * 12) % 5 === 0 ? 1 : 0, y0 = 26 + jig, body = rer ? "#e3e7ea" : "#e8ecee", band = rer ? "#2f6db3" : "#1f8a7a";
    P.r(0, y0, W, 32, body); P.r(0, y0 + 2, W, 1, "#ffffff"); P.r(0, y0 + 24, W, 3, band); P.r(0, y0 + 27, W, 5, "#4a4f58");
    for (let x = -6; x < W; x += 22) {
      const door = Math.floor((x + 6) / 22) % 3 === 1;
      if (door) { P.r(x, y0 + 4, 14, 22, "#c9cfd3"); P.r(x + 6, y0 + 4, 1, 22, "#7d838a"); P.r(x + 1, y0 + 6, 4, 9, night ? "#f6e7b8" : "#cfe0ea"); P.r(x + 8, y0 + 6, 4, 9, night ? "#f6e7b8" : "#cfe0ea"); P.r(x + 4, y0 + 17, 2, 1, "#d33a2c"); }
      else {
        P.r(x, y0 + 6, 16, 11, "#2a2f3a"); P.r(x + 1, y0 + 7, 14, 9, "#f2e2a8");
        const seed = Math.floor(x + camX * 0) * 7 + 3, R = CR.seeded("rame" + Math.floor((x + 600) / 22));
        for (let k = 0; k < 2; k++) if (R() < 0.6) { const hx = x + 3 + k * 7, sk = (D.SKIN[Math.floor(R() * 6)] || D.SKIN[1])[0]; P.r(hx, y0 + 11, 3, 3, sk); P.r(hx, y0 + 10, 3, 1, ["#1e1b1c", "#5a3b26", "#8f8e8c", "#d7b45f"][Math.floor(R() * 4)]); P.r(hx - 1, y0 + 14, 5, 2, ["#2f4b6e", "#7a2f2f", "#3e5c3a", "#2e2e33"][Math.floor(R() * 4)]); }
      }
    }
    if (rer) { P.r(0, y0 - 6, W, 6, body); P.r(0, y0 - 6, W, 1, "#ffffff"); for (let x = 2; x < W; x += 11) P.r(x, y0 - 4, 8, 3, "#2a2f3a"); }
    P.r(0, y0 + 32, W, 6, "#1a1b20"); for (let x = (-(camX) % 30 + 30) % 30 - 30; x < W; x += 30) { P.r(Math.round(x), y0 + 33, 8, 4, "#0b0b0e"); P.p(Math.round(x) + 3, y0 + 34, "#5a5c64"); }
    P.r(0, Hh - 6, W, 6, "#0b0c10");
    if (night) P.r(0, 0, W, Hh, "rgba(10,14,40,0.12)");
  }

  // ---------------------------------------------------------------- le taxi dans les rues de Paris
  const streetCache = new Map();
  function drawTaxi(ctx, W, Hh, t, fx, p) {
    const key = [W, CR.mapPhase(fx.min0), fx.rain ? 1 : 0, fx.season].join("|");
    let S = streetCache.get(key);
    if (!S) { if (streetCache.size > 6) streetCache.clear(); S = D.layout("rue", W * 2, { min: fx.min0, rain: fx.rain, season: fx.season }); streetCache.set(key, S); }
    const P = CR.px.painter(ctx), d = DW(ctx);
    const dist = W * 5, camX = dist * (1 - Math.pow(1 - p, 2)), off = Math.round(camX % (W * 2));
    ctx.drawImage(S.skyC, 0, 0);
    ctx.drawImage(S.fgC, -off, 0); ctx.drawImage(S.fgC, W * 2 - off, 0);
    const x = Math.round(W / 2 - 10), y = S.Y.road, dark = S.dark;
    D.veh(d, x, y, 1, "taxi", "#f2efe6", dark, t);
    P.r(x + 6, y - 8, 2, 2, (D.SKIN[2] || ["#d9a273"])[0]); P.r(x + 6, y - 9, 2, 1, "#1e1b1c");
    P.p(x + 8, y - 11, "#d33a2c"); P.p(x + 9, y - 11, "#d33a2c");
    if (p < 0.92) for (let i = 0; i < 5; i++) P.r(x - 6 - i * 5 - (Math.floor(t * 20) % 5), y - 4 + (i % 2), 3, 1, "rgba(220,220,220,0.25)");
    if (S.rain) for (let i = 0; i < W / 4; i++) { const a = D.h01(i * 3.1), b = D.h01(i * 7.7), rx = (a * W + t * 30) % W, ry = (b * Hh + t * 140) % Hh; P.r(Math.round(rx), Math.round(ry), 1, 2, S.dark ? "rgba(170,190,235,0.4)" : "rgba(215,228,246,0.55)"); }
  }

  UI.TravelFX = ({ s }) => {
    const fx = CR.fx.travel;
    const [, force] = useState(0);
    const skip = () => { if (CR.fx.travel === fx) CR.fx.travel = null; force((x) => x + 1); };
    useEffect(() => {
      if (!fx) return;
      if (reduced()) { skip(); return; }
      const tm = setTimeout(skip, fx.dur);
      return () => clearTimeout(tm);
    }, [fx && fx.id]);
    const ref = useLowCanvas((ctx, W, Hh, t) => {
      if (!fx) return;
      const p = Math.min(1, (t * 1000) / (fx.dur * 0.9));
      if (fx.mode === "taxi") drawTaxi(ctx, W, Hh, t, fx, p); else drawMetro(ctx, W, Hh, t, fx, p);
    }, [fx && fx.id], { css: 210, minW: 160 });
    if (!fx) return null;
    const via = fx.mode === "taxi" ? "Taxi" : fx.zone !== "paris" ? "RER" : "Métro";
    return html`<div className="travel-fx" onClick=${skip} role="status" aria-label=${`${via} vers ${fx.nom}`}>
      <div className="tfx-panel">
        <canvas ref=${ref} className="tfx-canvas" />
        <div className="tfx-cap"><span className="pix">${via} · ${fx.minutes} min</span><strong>${fx.nom}</strong><span className="pix tfx-time">${CR.fmtTime(fx.min0)} → ${CR.fmtTime(fx.min1)}</span></div>
        <span className="tfx-skip pix">Cliquer pour passer</span>
      </div>
    </div>`;
  };

  // ---------------------------------------------------------------- le choix : bouche de métro ou taxi
  function drawChoice(ctx, W, Hh, t, o) {
    const key = ["choix", W, CR.mapPhase(o.min), o.rain ? 1 : 0, o.season].join("|");
    let S = streetCache.get(key);
    if (!S) { S = D.layout("rue", W, { min: o.min, rain: o.rain, season: o.season }); streetCache.set(key, S); }
    D.frame(S, ctx, t, { min: o.min, rain: o.rain, season: o.season });
    const P = CR.px.painter(ctx), d = DW(ctx), gy = S.gy, mx = Math.round(W * 0.27), tx = Math.round(W * 0.7);
    // bouche de métro Guimard : rambarde verte, arc, enseigne, lampes orangées
    P.r(mx - 22, gy - 2, 44, 3, "#2f5a3a"); for (let x = mx - 22; x < mx + 22; x += 4) P.r(x, gy - 8, 1, 6, "#2f5a3a");
    P.r(mx - 18, gy - 34, 2, 32, "#2f5a3a"); P.r(mx + 16, gy - 34, 2, 32, "#2f5a3a");
    for (let i = 0; i <= 34; i++) { const a = i / 34, x = mx - 17 + Math.round(a * 34), y = gy - 34 - Math.round(Math.sin(a * Math.PI) * 4); P.p(x, y, "#2f5a3a"); }
    P.r(mx - 15, gy - 34, 30, 7, "#e8dfb8"); P.r(mx - 15, gy - 34, 30, 1, "#2f5a3a"); P.r(mx - 15, gy - 28, 30, 1, "#2f5a3a"); CR.px.text(P, "METRO", mx - 9, gy - 33, "#2f5a3a");
    for (const lx of [mx - 18, mx + 17]) { P.r(lx - 1, gy - 40, 3, 5, "#e2702a"); if (S.dark) d.glow(lx, gy - 38, 8, "255,150,60", 0.5); }
    P.r(mx - 12, gy - 6, 24, 6, "#1a1b20"); for (let k = 0; k < 3; k++) P.r(mx - 12 + k * 2, gy - 6 + k * 2, 24 - k * 4, 1, "#4a4f58");
    // la station de taxis : panneau bleu, la voiture au bord du trottoir, lumineux vert (libre)
    P.r(tx + 16, gy - 26, 1, 26, "#3a3c44"); P.r(tx + 8, gy - 34, 26, 9, "#f4f3ee"); P.r(tx + 9, gy - 33, 24, 7, "#27407a"); CR.px.text(P, "TAXIS", tx + 11, gy - 32, "#f4f3ee");
    P.r(tx - 14, S.Y.road - 1, 30, 1, "rgba(0,0,0,0.25)");
    D.veh(d, tx - 10, S.Y.road, -1, "taxi", "#f2efe6", S.dark, t);
    P.r(tx - 6, S.Y.road - 10, 4, 1, Math.floor(t * 2) % 2 ? "#3aff6a" : "#2acf52");
    // la sélection
    if (o.hover) D.hotMark(ctx, o.hover === "metro" ? { x: mx - 22, y: gy - 42, w: 44, h: 42 } : { x: tx - 12, y: S.Y.road - 14, w: 24, h: 14 }, t);
  }

  UI.TravelDialog = ({ s, to, onGo, onClose, then }) => {
    const pl = CR.placeOf(s, to);
    const tm = CR.travelTime(s, s.at, to, "metro"), tt = CR.travelTime(s, s.at, to, "taxi");
    const arrive = (m) => s.min + Math.round(m * CR.fatigueMult(s));
    const openM = CR.isOpen(pl, s.day, arrive(tm)), openT = CR.isOpen(pl, s.day, arrive(tt));
    const [hover, setHover] = useState(null);
    const hovRef = useRef(null); hovRef.current = hover;
    const o = { min: s.min, rain: D.rainy(s), season: D.seasonOf(s) };
    const ref = useLowCanvas((ctx, W, Hh, t) => drawChoice(ctx, W, Hh, t, Object.assign({ hover: hovRef.current }, o)), [to], { css: 168, minW: 170 });
    const pick = (e) => { const r = e.currentTarget.getBoundingClientRect(); onGo((e.clientX - r.left) / r.width < 0.5 ? "metro" : "taxi"); };
    const via = pl && pl.zone !== "paris" ? "En RER" : "En métro";
    return html`<${UI.Modal} title=${`Aller : ${pl.nom}`} onClose=${onClose}>
      <div className="travel-pick"><canvas ref=${ref} onClick=${pick} onMouseMove=${(e) => { const r = e.currentTarget.getBoundingClientRect(); setHover((e.clientX - r.left) / r.width < 0.5 ? "metro" : "taxi"); }} onMouseLeave=${() => setHover(null)} aria-hidden="true" /></div>
      <p className="muted small">${pl.sous}${pl.horaires ? ` · ${CR.HORAIRES[pl.horaires].label}` : ""}</p>
      ${then && html`<p>Pour : ${then}</p>`}
      <div className="decide decide-travel">
        <button className="decide-opt" onMouseEnter=${() => setHover("metro")} onMouseLeave=${() => setHover(null)} onClick=${() => onGo("metro")}><strong>${via} · ${tm} min</strong><span className="small muted">Arrivée vers ${CR.fmtTime(arrive(tm))}${pl.horaires ? (openM ? " — ouvert" : " — fermé à votre arrivée") : ""}</span></button>
        <button className="decide-opt" onMouseEnter=${() => setHover("taxi")} onMouseLeave=${() => setHover(null)} onClick=${() => onGo("taxi")}><strong>En taxi · ${tt} min · ${CR.money(CR.taxiCost(s, s.at, to))}</strong><span className="small muted">Arrivée vers ${CR.fmtTime(arrive(tt))}${pl.horaires ? (openT ? " — ouvert" : " — fermé à votre arrivée") : ""}</span></button>
      </div>
    </${UI.Modal}>`;
  };

  // =================================================================== Verdict
  // { mot, ton, sous, scene } d'après la décision ; null si la décision n'est pas un jugement sur la culpabilité
  CR.verdictOf = function (cs, dec) {
    if (!dec || typeof dec.coupable !== "boolean") return null;
    const cour = /assises|criminelle/i.test(dec.entete || "");
    const pc = cs.camp === "pc";
    if (!dec.coupable) return { mot: cour ? "Acquittement" : "Relaxe", ton: pc ? "bad" : "ok", sous: pc ? "La partie civile n'obtient rien au pénal." : cour ? "La cour et les jurés écartent la culpabilité." : "Le tribunal écarte la culpabilité.", scene: "libre" };
    const peine = dec.peine && dec.peine.texte || "";
    const ferme = /emprisonnement|réclusion/i.test(peine) && !/sursis/i.test(peine);
    const civil = dec.civil && !dec.civil.renvoi ? `Indemnisation : ${CR.money((dec.civil.total || 0) + (dec.civil.art475 || 0))}` : "";
    return { mot: "Condamnation", ton: pc ? "ok" : "bad", sous: [peine, civil].filter(Boolean).join(" · ") || "Culpabilité retenue.", scene: ferme ? "depot" : "barre" };
  };
  function drawVerdict(ctx, W, Hh, t, o) {
    const P = CR.px.painter(ctx), d = DW(ctx), v = o.v, cx = W >> 1;
    const L = o.look || CR.px.lookFrom("prev"), you = o.you || CR.px.lookFrom("vous", { outfit: "robe" });
    if (v.scene === "libre") {
      // les portes de la salle ouvertes sur le jour
      P.r(0, 0, W, Hh, "#3a2a1c"); for (let x = 0; x < W; x += 6) P.r(x, 0, 1, Hh, "#33251a");
      P.r(cx - 22, 6, 44, 52, "#fff4d6"); P.r(cx - 20, 8, 40, 50, "#ffe8a8");
      for (let k = 0; k < 6; k++) P.r(cx - 18 + k * 7, 8, 2, 50, "rgba(255,255,255,0.35)");
      P.r(cx - 30, 6, 8, 52, "#6e4a2a"); P.r(cx + 22, 6, 8, 52, "#6e4a2a"); P.r(cx - 30, 4, 60, 3, "#4a3020");
      for (let k = 0; k < 4; k++) P.r(cx - 40 - k * 6, 58 + k * 2, 80 + k * 12, 2, `rgba(255,232,168,${0.22 - k * 0.05})`);
      P.r(0, 58, W, Hh - 58, "#5a4630");
      const bob = Math.floor(t * 4) % 2;
      D.fig(d, cx - 8, 70, { look: L, expr: o.vic ? "cry" : "soulage", breath: bob === 1, blink: (t % 4) < 0.15, dir: 0, t });
      D.fig(d, cx + 10, 70, { look: you, wear: "robe", dir: -1, arm: Math.floor(t * 1.2) % 2 ? 1 : 0, breath: bob === 0 });
    } else if (v.scene === "depot") {
      // l'escorte emmène le condamné vers le dépôt
      P.r(0, 0, W, Hh, "#3d4248"); for (let y = 4; y < 58; y += 6) P.r(0, y, W, 1, "#373c42");
      P.r(cx + 18, 10, 26, 48, "#1c1f24"); P.r(cx + 20, 12, 22, 46, "#2a2e35"); P.r(cx + 17, 4, 28, 6, "#27407a"); CR.px.text(P, "DEPOT", cx + 21, 5, "#f4f3ee");
      P.r(0, 58, W, Hh - 58, "#5c6066");
      const k = Math.min(18, Math.floor(t * 6));
      D.fig(d, cx - 22 + k, 72, { look: CR.px.lookFrom("escorte-a", { age: 33 }), wear: "uniform", step: Math.floor(t * 6) % 4, back: true, dir: 1 });
      D.fig(d, cx - 10 + k, 72, { look: L, back: true, dir: 1, step: Math.floor(t * 6 + 1) % 4 });
      D.fig(d, cx + 2 + k, 72, { look: CR.px.lookFrom("escorte-b", { age: 45, g: "f" }), wear: "uniform", step: Math.floor(t * 6 + 2) % 4, back: true, dir: 1 });
    } else {
      // seul à la barre, la feuille de la décision à la main
      P.r(0, 0, W, Hh, "#bfa984"); for (let x = 0; x < W; x += 3) P.r(x, 0, 1, 50, "#b39d78"); P.r(0, 50, W, Hh - 50, "#8b847a");
      P.r(cx - 14, 52, 29, 3, "#c8b28a"); P.r(cx - 13, 55, 2, 14, "#a8916b"); P.r(cx + 11, 55, 2, 14, "#a8916b");
      D.fig(d, cx, 74, { look: L, expr: o.vic ? "soulage" : "honte", arm: 3, blink: (t % 4) < 0.15, breath: Math.floor(t * 0.6) % 2 === 0, t });
      P.r(cx - 3, 54, 7, 4, "#f4f2ea");
    }
  }
  UI.VerdictCard = ({ s, cs, dec }) => {
    const v = CR.verdictOf(cs, dec);
    const look = cs ? CR.px.clientLook(CR.client(cs), cs.def) : null;
    const ref = useLowCanvas((ctx, W, Hh, t) => v && drawVerdict(ctx, W, Hh, t, { v, look, you: CR.youLook(s), vic: cs && cs.camp === "pc" }), [v && v.mot], { css: 132, minW: 110, h: 80 });
    if (!v) return null;
    return html`<div className=${cx("verdict", "v-" + v.ton)}>
      <div className="verdict-art"><canvas ref=${ref} /></div>
      <div className="verdict-txt"><span className="pix">${cs && cs.camp === "pc" ? "Pour votre client, partie civile" : "Pour votre client"}</span><strong className="verdict-mot">${v.mot}</strong><span className="small">${v.sous}</span></div>
    </div>`;
  };

  // =================================================================== Papier : décisions et actes
  // La décision prononcée : en-tête de la République, dispositif, signatures, sceau du greffe
  const sceauOf = CR.sceauOf;
  const RF = () => html`<div className="rf-head"><span className="rf-flag"><i></i><i></i><i></i></span><span className="rf-1">République française</span><span className="rf-2">Au nom du peuple français</span></div>`;
  UI.DecisionPaper = ({ s, cs, dec }) => {
    const sc = sceauOf(dec.entete);
    return html`<article className="paper decision paper-arret">
      <${RF} />
      <h3 className="paper-title">${dec.titre || "Jugement"}</h3>
      ${dec.entete && html`<p className="small arret-entete">${dec.entete}</p>`}
      ${(dec.questions || []).map((q, i) => html`<div key=${i} className="dq"><p className="dq-q"><strong>${q.q}</strong></p><p>${q.r}</p>${q.motif && html`<p className="small dq-m">${q.motif}</p>`}</div>`)}
      ${dec.dispositif && html`<p className="dispositif"><strong>PAR CES MOTIFS</strong> — ${dec.dispositif}</p>`}
      <div className="arret-sign"><span>Le greffier</span><span>${/cour/i.test(sc[0]) ? "Le président" : "Le président"}</span></div>
      <div className="sceau" aria-hidden="true"><span>${sc[0]}</span><b>★</b><span>${sc[1]}</span><small>GREFFE</small></div>
    </article>`;
  };
  // =================================================================== Débrief : la fiche du dossier
  UI.DebriefModal = ({ s, cs, onClose }) => {
    const o = cs.outcome || {};
    const bon = ["relaxe", "acquittement", "requalification_favorable", "classement", "alternative", "non_lieu", "indemnise", "crpc"].includes(o.type), mauvais = ["condamnation", "deboute", "irrecevable", "prescrit", "lost", "fired", "incompetence"].includes(o.type);
    const num = String(1 + (s.order || []).indexOf(cs.id)).padStart(3, "0");
    return html`<${UI.Modal} title=${`Dossier clos — ${CR.caseTitle(s, cs)}`} onClose=${onClose} wide footer=${html`<${Btn} kind="primary" onClick=${onClose}>Ranger la fiche au classeur</${Btn}>`}>
      <div className="deb-card">
        <div className="deb-card-head">
          <span className="deb-tab pix">Fiche n° ${num}</span>
          <div className="deb-id"><strong>${CR.caseTitle(s, cs)}</strong><span>${CR.clientName(cs)} · ${cs.camp === "pc" ? "partie civile" : "défense"}${o.day != null ? ` · clos le ${CR.fmtDate(o.day, "long")}` : ""}</span></div>
          <span className=${cx("deb-stamp", bon && "ok", mauvais && "bad")}>${CR.OUTCOMES[o.type] || "Clos"}</span>
        </div>
        <${UI.DebriefBody} s=${s} cs=${cs} />
      </div>
      ${UI.CasPratique && (s.classeur || []).find((x) => x.caseId === cs.id) && html`<${UI.CasPratique} key=${cs.id} s=${s} f=${s.classeur.find((x) => x.caseId === cs.id)} />`}
    </${UI.Modal}>`;
  };
})();
