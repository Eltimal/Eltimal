/* La Permanence — affichage d'un plan en plein cadre (UI.Plan), tranche pilote de la refonte.
   Le plan (CR.plans[name]) est peint à sa définition propre, puis agrandi à la taille du cadre par CR.gpu.
   Matière redessinée 30 fois par seconde, lumière et grain à chaque image. UI.planOk() : faux sans WebGL 2
   (tests jsdom), l'appelant garde alors l'ancienne mise en page. */
(function () {
  const CR = window.CR, UI = CR.UI, { html } = UI;
  const { useEffect, useRef, useState } = React;
  UI.planOk = (name) => !!(CR.gpu && CR.gpu.ok() && CR.plans && CR.plans[name]);

  // largeur du plan, en pixels du plan, pour un cadre donné
  UI.planW = (plan, cw, ch) => Math.max(plan.REF - 80, Math.min(640, Math.ceil(plan.H * cw / ch / 2) * 2));

  // Plan dont les objets se cliquent (le cabinet) : onHot(id) ; l'objet survolé est signalé au plan (opts.hover)
  UI.PlanHub = ({ name, opts, onHot }) => {
    const plan = CR.plans[name], ref = useRef(null);
    const [dim, setDim] = useState({ w: 1440, h: 900 }), [hover, setHover] = useState(null);
    useEffect(() => {
      const upd = () => { const el = ref.current; if (el) setDim({ w: el.clientWidth || 1440, h: el.clientHeight || 900 }); };
      upd(); window.addEventListener("resize", upd);
      return () => window.removeEventListener("resize", upd);
    }, []);
    const W = UI.planW(plan, dim.w, dim.h), OX = Math.floor((W - plan.REF) / 2), hot = plan.HOT || [];
    return html`<div className="plan-hub" ref=${ref}>
      <${UI.Plan} name=${name} opts=${Object.assign({}, opts, { hover })} />
      ${hot.map((h) => html`<button key=${h.id} type="button" className="plan-hot" aria-label=${h.label} style=${{ left: (OX + h.x) / W * 100 + "%", top: h.y / plan.H * 100 + "%", width: h.w / W * 100 + "%", height: h.h / plan.H * 100 + "%" }}
        onMouseEnter=${() => setHover(h.id)} onMouseLeave=${() => setHover((x) => (x === h.id ? null : x))} onFocus=${() => setHover(h.id)} onBlur=${() => setHover(null)} onClick=${() => onHot && onHot(h.id)}><span className="pano-tip">${h.label}</span></button>`)}
    </div>`;
  };

  // Extérieurs : le décor éclairé (CR.dec.LIT, 150 rangées, dessiné et éclairé par l'ancien moteur) est repris tel quel
  // comme matière lumineuse du nouveau moteur : même agrandissement, même grain, même vignette, même fondu que les plans.
  // Les 75 rangées du bas prolongent la chaussée dans l'ombre (elles passent sous le panneau du jour).
  function planExterieur(name) {
    const lit = CR.dec.LIT[name], H = 225;
    return {
      H, REF: 360, legacy: true,
      make(W) {
        const inst = lit.make(W), mat = new CR.gpu.Mat(W, H), cv = document.createElement("canvas");
        cv.width = W; cv.height = lit.H;
        const ctx = cv.getContext("2d", { willReadFrequently: true });
        let key = "", last = -1;
        return {
          W, H, mat,
          frame(t, o) {
            o = o || {};
            if (last < 0 || t - last > 0.045 || o.reduce) {
              last = t;
              const ph = CR.mapPhase(o.min == null ? 600 : o.min), kk = [ph, o.rain ? "p" : "s", o.season || "", o.nom || "", o.plaque || "", name === "cite" ? Math.floor((o.min || 0) / 5) : ""].join("|");
              if (kk !== key) { key = kk; inst.set(ph, !!o.rain, o); }
              inst.opts = o; inst.hover = null;
              inst.frame(o.reduce ? 40 : t + 40, null); inst.present(ctx, W, lit.H);
              const d = ctx.getImageData(0, 0, W, lit.H).data, C = mat.c, n = W * lit.H;
              for (let i = 0, j = 0; i < n; i++, j += 4) { C[j] = d[j]; C[j + 1] = d[j + 1]; C[j + 2] = d[j + 2]; C[j + 3] = 255; }
              const base = (lit.H - 1) * W * 4;
              for (let y = lit.H; y < H; y++) { const k = Math.max(0, 0.55 - (y - lit.H) / (H - lit.H) * 0.5), row = y * W * 4; for (let x = 0; x < W * 4; x += 4) { C[row + x] = C[base + x] * k; C[row + x + 1] = C[base + x + 1] * k; C[row + x + 2] = C[base + x + 2] * k; C[row + x + 3] = 255; } }
            }
            return { t, amb: [0, 0, 0], lights: [], em: 1, floorY: H, grain: 0.03, vig: 0.42, bloom: 0.25, tint: [1, 1, 1] };
          },
        };
      },
    };
  }
  // secours : un décor éclairé sans plan dessiné (plan-ext.js les couvre tous aujourd'hui)
  if (CR.dec && CR.dec.LIT && CR.gpu) { CR.plans = CR.plans || {}; for (const k in CR.dec.LIT) if (!CR.plans[k]) CR.plans[k] = planExterieur(k); }

  // Fond plein cadre du lieu où l'on est : son plan (pièce de la refonte ou extérieur repris de CR.dec.LIT)
  UI.Backdrop = ({ s, onHot }) => {
    const name = CR.dec.sceneFor(s), o = CR.dec.stageOpts(s);
    if (CR.plans[name]) return html`<${UI.PlanHub} key=${name} name=${name} opts=${o} onHot=${onHot} />`;
    return html`<div className="plan-hub plan-legacy" key=${name}><${UI.Panorama} name=${name} opts=${o} fill=${true} /><div className="plan-veil"></div></div>`;
  };

  UI.Plan = ({ name, opts, className }) => {
    const ref = useRef(null), optsRef = useRef(opts), still = useRef(null);
    optsRef.current = opts;
    useEffect(() => {
      const c = ref.current, plan = CR.plans && CR.plans[name];
      if (!c || !plan || !CR.gpu.ok()) return;
      let R = null;
      try { R = CR.gpu.Renderer(c); } catch (e) { console.error(e); }
      if (!R) return;
      const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      let inst = null, raf = 0, alive = true, lastMat = -1, params = null;
      const t0 = performance.now(), born = t0;
      const fit = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1), cw = c.clientWidth || window.innerWidth || 1280, ch = c.clientHeight || window.innerHeight || 800;
        const pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
        if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph; }
        const W = UI.planW(plan, cw, ch);
        if (!inst || inst.W !== W) { inst = plan.make(W); lastMat = -1; }
      };
      const paint = (now) => {
        fit();
        const t = (now - t0) / 1000, o = Object.assign({}, optsRef.current, { reduce });
        if (now - lastMat > 32 || !params) { lastMat = now; params = inst.frame(t, o); }
        params.t = t; params.fade = reduce ? 0 : Math.max(0, 1 - (now - born) / 700);
        R.draw(inst.mat, params);
      };
      const loop = (now) => { if (!alive) return; try { paint(now); } catch (e) { console.error(e); alive = false; return; } raf = requestAnimationFrame(loop); };
      const onResize = () => { try { paint(performance.now()); } catch (e) { /* rien */ } };
      window.addEventListener("resize", onResize);
      if (reduce) { still.current = () => { try { lastMat = -1; paint(t0 + 1000); } catch (e) { console.error(e); } }; still.current(); } else raf = requestAnimationFrame(loop);
      UI._planPaint = (ms) => paint(t0 + ms);
      return () => { alive = false; still.current = null; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); UI._planPaint = null; R.dispose(); };
    }, [name]);
    // animations réduites : image fixe, refaite quand l'état montré change (heure, sonnerie, survol, étape)
    const o = opts || {}, sig = [o.min, o.rain, o.unread, o.ringing, o.voicemail, o.files, o.hover, o.expr, o.dehors, o.print, o.speaker, o.court, o.jures, o.room].join("|");
    useEffect(() => { if (still.current) still.current(); }, [sig]);
    return html`<canvas ref=${ref} className=${UI.cx("plan-canvas", className)} aria-hidden="true" />`;
  };
})();
