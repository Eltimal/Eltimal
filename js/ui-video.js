/* La Permanence — l'extrait de vidéosurveillance dans une pièce (UI.VideoExtrait).
   Une pièce qui porte `video` (réglages de CR.video.extrait : faits, graine, mode, date, heure, tenues…) montre l'extrait
   au-dessus de son texte : lecture, pause, image par image, vitesse, frise, puis la planche de captures du procès-verbal.
   Rien n'est enregistré : l'extrait est rejoué depuis ses réglages à chaque ouverture. Sans canvas utilisable (tests
   jsdom), le lecteur ne s'affiche pas et la pièce reste lisible. */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html } = UI;
  const { useEffect, useRef, useState, useMemo } = React;

  // l'extrait de chaque jeu de réglages est gardé le temps de la partie (le décor se calcule une fois)
  const cache = new Map();
  CR.videoExtrait = function (spec) {
    const k = JSON.stringify(spec);
    let S = cache.get(k);
    if (!S) { S = CR.video.extrait(spec); cache.set(k, S); if (cache.size > 6) cache.delete(cache.keys().next().value); }
    return S;
  };

  // 1.5.0 : le visage des personnes filmées est leur portrait (CR.px), plaqué sur la tête par le moteur. Sans portrait
  // connu (passant, témoin, agent), un visage tiré de la graine. On rend aussi la peau, les cheveux et la coupe, pour
  // que le cou, les mains et l'arrière du crâne aillent avec le visage.
  const texCache = new Map();
  CR.video.texturer = function (look, o) {
    const PX = CR.px;
    if (!PX || !PX.portrait || !PX.lookFrom2) return null;
    let L = look || PX.lookFrom2("video:" + o.graine, { g: o.g, age: o.age });
    if (L.p) L = Object.assign({}, L, { p: Object.assign({}, L.p, { hat: "none" }) }); // le couvre-chef est celui de la tenue
    const key = JSON.stringify(L);
    if (texCache.has(key)) return texCache.get(key);
    const cv = PX.portrait(L, "neutral", false, false), m = cv && cv.kind;
    const img = cv && cv.getContext && cv.getContext("2d").getImageData(0, 0, 64, 64);
    if (!m || !img || !img.data || img.data.length < 64 * 64 * 4) return null;
    const d = new Uint8ClampedArray(img.data);
    if (!d.some((x) => x)) return null; // canvas factice (tests)
    const moy = (kind, y0, y1, x0, x1) => {
      const s = [0, 0, 0]; let n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = y * 64 + x; if (m[k] !== kind) continue; for (let q = 0; q < 3; q++) s[q] += Math.pow(d[k * 4 + q] / 255, 2.2) * 0.85; n++; }
      return n ? s.map((v) => v / n) : null;
    };
    let long = 0; for (let y = 44; y < 60; y++) for (const x of [10, 13, 16, 48, 51, 54]) if (m[y * 64 + x] === 2) long++;
    const peau = moy(1, 30, 42, 20, 44), chev = moy(2, 4, 30, 8, 56), F = PX.faceSpec ? PX.faceSpec(L) : {};
    const v = { tex: { d, m }, peau, chev: chev || (peau ? peau.map((x) => x * 0.8) : null), coupe: !chev ? "chauve" : long > 6 ? "long" : "court", barbe: !!(F.beard && F.beard !== "none"), lunettes: !!F.glasses };
    if (texCache.size > 60) texCache.clear();
    texCache.set(key, v);
    return v;
  };

  function Vignette({ S, m, onGo }) {
    const ref = useRef(null);
    useEffect(() => {
      try {
        const c = ref.current, ctx = c.getContext("2d"), img = ctx.createImageData(CR.video.W, CR.video.H);
        S.image(S.indexA(m.t), img.data); ctx.putImageData(img, 0, 0);
      } catch (e) { /* canvas indisponible */ }
    }, [S, m.t]);
    return html`<button type="button" className="vx-vign" onClick=${onGo} title="Aller à cette image">
      <canvas ref=${ref} width=${CR.video.W} height=${CR.video.H} aria-hidden="true"></canvas>
      <span>${m.h.split(" ")[1]}</span>
    </button>`;
  }

  // 1.5.0 : l'agrandissement d'une personne, à l'arrêt sur image (ramené au grain réel du capteur)
  function Agrandi({ S, t, id, n, onClose }) {
    const ref = useRef(null);
    const [info, setInfo] = useState(null);
    useEffect(() => {
      try {
        const c = ref.current, ctx = c.getContext("2d"), img = ctx.createImageData(CR.video.W, CR.video.H);
        const z = CR.video.agrandir(S, t, id, img.data);
        if (z) { ctx.putImageData(img, 0, 0); setInfo(z); }
      } catch (e) { setInfo(null); }
    }, [S, t, id]);
    return html`<div className="vx-zoom" role="group" aria-label=${"Agrandissement, personne " + n}>
      <canvas ref=${ref} width=${CR.video.W} height=${CR.video.H} aria-hidden="true"></canvas>
      <div className="vx-zoom-l">
        <span>Agrandissement — personne ${n} — ${S.horodatage(S.frames[S.indexA(t)] || 0).split(" ")[1]}${info ? (info.tete >= 14 ? " · les traits du visage se distinguent" : info.tete >= 9 ? " · image floue, traits incertains" : " · trop loin : une silhouette") : ""}</span>
        <${UI.Btn} small onClick=${onClose}>Fermer</${UI.Btn}>
      </div>
    </div>`;
  }

  UI.VideoExtrait = ({ spec }) => {
    const ref = useRef(null), L = useRef(null);
    const [st, setSt] = useState({ t: 0, i: 0, lecture: false, v: 1, ok: true });
    const [zoom, setZoom] = useState(null); // { id, t, n }
    const S = useMemo(() => { try { return CR.video ? CR.videoExtrait(spec) : null; } catch (e) { return null; } }, [JSON.stringify(spec)]);
    useEffect(() => {
      if (!S || !ref.current) return undefined;
      let l = null;
      try {
        l = CR.video.lecteur(ref.current, S, {
          onTemps: (t, i) => setSt((x) => Object.assign({}, x, { t, i, lecture: !!(l && l.enLecture) })),
          onFin: () => setSt((x) => Object.assign({}, x, { lecture: false })),
        });
      } catch (e) { setSt((x) => Object.assign({}, x, { ok: false })); return undefined; }
      L.current = l;
      return () => { l.detruire(); L.current = null; };
    }, [S]);
    if (!S || !st.ok) return null;
    const l = L.current;
    const basculer = () => { if (!l) return; l.basculer(); setSt((x) => Object.assign({}, x, { lecture: l.enLecture })); };
    // à l'arrêt, les personnes visibles (numérotées de gauche à droite) ; un clic près d'une tête l'agrandit
    let gens = [];
    if (!st.lecture) { try { gens = CR.video.personnes(S, S.frames[st.i] || 0); } catch (e) { gens = []; } }
    const clic = (e) => {
      if (!st.lecture && gens.length) {
        const r = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * CR.video.W, y = ((e.clientY - r.top) / r.height) * CR.video.H;
        let best = null, bd = 1e9;
        gens.forEach((g, k) => { const d = Math.hypot(g.x - x, (g.y + Math.max(6, g.tete) - y) * 0.7); if (d < bd) { bd = d; best = k; } });
        if (best != null && bd < Math.max(28, gens[best].tete * 3)) { setZoom({ id: gens[best].id, t: S.frames[st.i] || 0, n: best + 1 }); return; }
      }
      basculer();
    };
    const vitesse = (v) => { if (l) l.vitesse(v); setSt((x) => Object.assign({}, x, { v })); };
    const aller = (t) => { if (!l) return; l.pause(); l.aller(t); };
    const horo = S.horodatage(S.frames[st.i] || 0);
    // 1.5.0 : la caméra-piéton enregistre le son ; les paroles de l'instant s'affichent sous l'image
    const QUI = { agent: "Agent", agent2: "Second agent", A: "Personne contrôlée" };
    const sous = S.sous ? S.sous(st.t) : [];
    return html`<figure className="vx" aria-label=${S.style === "pieton" ? "Enregistrement de caméra-piéton" : "Extrait de vidéosurveillance"}>
      <div className="vx-ecran"><canvas ref=${ref} width="960" height="540" onClick=${clic}></canvas></div>
      ${S.paroles && S.paroles.length > 0 && html`<div className="vx-sous">${sous.length ? sous.map((p, k) => html`<p key=${k}><b>${QUI[p.qui] || p.qui} :</b> ${p.texte}</p>`) : html`<p className="vx-sous-vide">—</p>`}</div>`}
      <div className="vx-frise">
        <input type="range" min="0" max="1000" step="1" value=${Math.round((st.t / S.duree) * 1000)} aria-label="Position dans l'extrait"
          onInput=${(e) => aller((e.target.value / 1000) * S.duree)} />
        <div className="vx-marques" aria-hidden="true">
          ${S.sauts.map(([a, b], k) => html`<b key=${"s" + k} style=${{ left: (a / S.duree) * 100 + "%", width: ((b - a) / S.duree) * 100 + "%" }}></b>`)}
        </div>
      </div>
      <div className="vx-bar">
        <${UI.Btn} small onClick=${() => aller(0)} title="Revenir au début">Début</${UI.Btn}>
        <${UI.Btn} small onClick=${() => l && l.image(-1)} title="Image précédente">− 1 image</${UI.Btn}>
        <${UI.Btn} small kind="primary" onClick=${basculer}>${st.lecture ? "Pause" : "Lecture"}</${UI.Btn}>
        <${UI.Btn} small onClick=${() => l && l.image(1)} title="Image suivante">+ 1 image</${UI.Btn}>
        <span className="vx-vit" role="group" aria-label="Vitesse">${[0.25, 0.5, 1].map((v) => html`<button key=${v} type="button" className=${UI.cx("vx-v", st.v === v && "on")} onClick=${() => vitesse(v)}>× ${v === 0.25 ? "¼" : v === 0.5 ? "½" : "1"}</button>`)}</span>
        <span className="vx-horo">${horo} · image ${st.i + 1} / ${S.frames.length} · ${S.fps} i/s</span>
      </div>
      ${!st.lecture && gens.length > 0 && html`<div className="vx-gens" role="group" aria-label="Agrandir une personne">
        <span>Agrandir :</span>
        ${gens.map((g, k) => html`<button key=${g.id} type="button" className=${UI.cx("vx-v", zoom && zoom.id === g.id && zoom.t === (S.frames[st.i] || 0) && "on")} onClick=${() => setZoom({ id: g.id, t: S.frames[st.i] || 0, n: k + 1 })}>personne ${k + 1}</button>`)}
        <span className="vx-gens-n">(de gauche à droite ; ou cliquez sur une tête)</span>
      </div>`}
      ${zoom && html`<${Agrandi} key=${zoom.id + ":" + zoom.t} S=${S} t=${zoom.t} id=${zoom.id} n=${zoom.n} onClose=${() => setZoom(null)} />`}
      <figcaption className="vx-planche">
        <span className="vx-pl-t">Planche de captures</span>
        <div className="vx-vigns">${S.moments.map((m, k) => html`<${Vignette} key=${k} S=${S} m=${m} onGo=${() => aller(m.t)} />`)}</div>
      </figcaption>
    </figure>`;
  };
})();
