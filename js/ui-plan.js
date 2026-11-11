/* La Permanence — affichage d'un plan en plein cadre (UI.Plan), tranche pilote de la refonte.
   Le plan (CR.plans[name]) est peint à sa définition propre, puis agrandi à la taille du cadre par CR.gpu.
   Matière redessinée 30 fois par seconde, lumière et grain à chaque image. UI.planOk() : faux sans WebGL 2
   (tests jsdom), l'appelant garde alors l'ancienne mise en page. */
(function () {
  const CR = window.CR, UI = CR.UI, { html } = UI;
  const { useEffect, useRef } = React;
  UI.planOk = (name) => !!(CR.gpu && CR.gpu.ok() && CR.plans && CR.plans[name]);

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
        const W = Math.max(plan.REF - 80, Math.min(640, Math.ceil(plan.H * cw / ch / 2) * 2));
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
