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

  // Fond plein cadre du lieu où l'on est : le plan de la refonte s'il existe, sinon le décor éclairé agrandi à la même échelle
  UI.Backdrop = ({ s, onHot }) => {
    const name = CR.dec.sceneFor(s), o = CR.dec.stageOpts(s);
    if (CR.plans[name]) return html`<${UI.PlanHub} key=${name} name=${name} opts=${o} onHot=${onHot} />`;
    return html`<div className="plan-hub plan-legacy" key=${name}><${UI.Panorama} name=${name} opts=${o} fill=${true} /><div className="plan-veil"></div></div>`;
  };

  UI.Plan = ({ name, opts, className }) => {
    const ref = useRef(null), optsRef = useRef(opts);
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
      if (reduce) { try { paint(t0 + 1000); } catch (e) { console.error(e); } } else raf = requestAnimationFrame(loop);
      UI._planPaint = (ms) => paint(t0 + ms);
      return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); UI._planPaint = null; R.dispose(); };
    }, [name]);
    return html`<canvas ref=${ref} className=${UI.cx("plan-canvas", className)} aria-hidden="true" />`;
  };
})();
