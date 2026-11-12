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

  UI.VideoExtrait = ({ spec }) => {
    const ref = useRef(null), L = useRef(null);
    const [st, setSt] = useState({ t: 0, i: 0, lecture: false, v: 1, ok: true });
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
    const vitesse = (v) => { if (l) l.vitesse(v); setSt((x) => Object.assign({}, x, { v })); };
    const aller = (t) => { if (!l) return; l.pause(); l.aller(t); };
    const horo = S.horodatage(S.frames[st.i] || 0);
    return html`<figure className="vx" aria-label="Extrait de vidéosurveillance">
      <div className="vx-ecran"><canvas ref=${ref} width="960" height="540" onClick=${basculer}></canvas></div>
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
      <figcaption className="vx-planche">
        <span className="vx-pl-t">Planche de captures</span>
        <div className="vx-vigns">${S.moments.map((m, k) => html`<${Vignette} key=${k} S=${S} m=${m} onGo=${() => aller(m.t)} />`)}</div>
      </figcaption>
    </figure>`;
  };
})();
