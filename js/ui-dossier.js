// La Permanence — refonte du gameplay, lot 1 : lire le dossier (UI.DossierReel, UI.DossierPilote)
// Le dossier se lit comme un vrai : un bordereau, des cotes, des feuillets qu'on tourne. Aucune phrase prédécoupée,
// aucun passage signalé. Le temps de lecture se compte (200 mots par minute) : il nourrira l'horloge du plan.
// Clavier : ← → tournent les feuillets, ↑ ↓ changent de pièce, Début et Fin vont au premier et au dernier feuillet.
(function () {
  "use strict";
  const CR = window.CR, UI = CR.UI, { html, cx } = UI;
  const { useState, useEffect, useRef, useMemo } = React;
  const SIM = CR.SIM, DOCS = CR.DOCS;

  // deux feuillets côte à côte dès que l'écran le permet
  const LARGE = "(min-width: 1240px)";
  function useLarge() {
    const mq = () => !!(window.matchMedia && window.matchMedia(LARGE).matches);
    const [l, setL] = useState(mq);
    useEffect(() => { if (!window.matchMedia) return; const m = window.matchMedia(LARGE), on = () => setL(m.matches); if (m.addEventListener) m.addEventListener("change", on); return () => { if (m.removeEventListener) m.removeEventListener("change", on); }; }, []);
    return l;
  }

  // ------------------------------------------------------------------ Images de pièces
  function Toile({ S, spec }) {
    const ref = useRef(null);
    const cam = spec.type === "camera";
    useEffect(() => {
      const c = ref.current; if (!c || !CR.SIMIMG) return;
      try { if (cam) CR.SIMIMG.dessiner(c, CR.SIMIMG.scene(S)); else CR.SIMIMG.schema(c, spec.lesions || []); } catch (e) { /* canevas factice des tests */ }
    }, [S.sig, spec.type]);
    return html`<canvas ref=${ref} className=${cam ? "dr-cam" : "dr-schema"} width=${cam ? 640 : 220} height=${cam ? 480 : 440} role="img" aria-label=${cam ? "Capture de vidéoprotection" : "Schéma corporel"}></canvas>`;
  }

  // ------------------------------------------------------------------ Un bloc
  const paraphe = (nom) => (nom || "").split(/\s+/).filter(Boolean).map((x) => x[0]).join("");
  function Signature({ c }) {
    const g = CR.hash(c.nom + c.role) % 7;
    return html`<div className="dr-case">
      <span className="dr-case-role">${c.role}</span>
      ${c.etat === "signe" && html`<span className="dr-griffe" style=${{ transform: `rotate(${-7 + g * 2}deg)` }}>${c.nom ? c.nom.replace(/^(Dr|Me) /, "").replace(/^(\S)\S*\s+/, "$1. ") : "illisible"}</span>`}
      ${c.etat === "refus" && html`<span className="dr-manus">refuse de signer</span>`}
      ${c.tampon && html`<span className="dr-tampon">${c.tampon}</span>`}
      ${c.nom && c.etat !== "vide" && html`<span className="dr-case-nom">${c.nom}</span>`}
    </div>`;
  }
  function Bloc({ b, S, suite, n, N }) {
    switch (b.k) {
      case "bandeau":
        if (suite) return html`<div className="dr-bandeau dr-suite"><span>${b.titre}</span><span>N° PV ${b.grille["N° PV"]} — suite</span><span>Feuillet ${n}/${N}</span></div>`;
        return html`<div className="dr-bandeau">
          <div className="dr-b-serv"><b>RÉPUBLIQUE FRANÇAISE</b><span>MINISTÈRE DE L'INTÉRIEUR</span><span>${b.service}</span></div>
          <div className="dr-b-titre"><span className="dr-b-cadre">${b.cadre}</span><b>${b.titre}</b>${b.qualite && html`<span className="dr-b-qual">${b.qualite}</span>`}</div>
          <div className="dr-b-grille">${Object.entries(b.grille).map(([k, v]) => html`<div key=${k}><span>${k}</span><b>${v}</b></div>`)}<div><span>N° feuillet</span><b>${n}/${N}</b></div></div>
        </div>`;
      case "entete": return html`<div className="dr-entete"><div>${b.lignes.map((l, i) => html`<span key=${i} className=${i ? "" : "dr-e1"}>${l}</span>`)}</div><div className="dr-e-dr">${(b.droite || []).map((l, i) => html`<span key=${i}>${l}</span>`)}</div></div>`;
      case "titre": return html`<h3 className="dr-titre">${b.t}</h3>`;
      case "stitre": return html`<h4 className="dr-stitre">${b.t}</h4>`;
      case "qr": return html`<div className="dr-qr"><p><b>QUESTION :</b> ${b.q} <i className="dr-tirets">-----</i></p><p><b>RÉPONSE :</b> ${b.r} <i className="dr-tirets">-----</i></p></div>`;
      case "grille": return html`<table className="dr-grille"><tbody>${b.rows.map((r, i) => html`<tr key=${i}><th>${r[0]}</th><td>${r[1]}</td></tr>`)}</tbody></table>`;
      case "table": return html`<table className="dr-table"><thead><tr>${b.head.map((h, i) => html`<th key=${i}>${h}</th>`)}</tr></thead><tbody>${b.rows.map((r, i) => html`<tr key=${i}>${r.map((x, j) => html`<td key=${j}>${x}</td>`)}</tr>`)}</tbody></table>`;
      case "liste": return html`<ul className="dr-liste">${b.items.map((x, i) => html`<li key=${i}>${x}</li>`)}</ul>`;
      case "sig": return html`<div className="dr-sigs">${b.cases.map((c, i) => html`<${Signature} key=${i} c=${c} />`)}</div>`;
      case "image": return html`<figure className="dr-fig"><${Toile} S=${S} spec=${b.spec} /><figcaption>${b.legende}</figcaption></figure>`;
      default:
        if (b.cls === "decl") return html`<p className="dr-p dr-decl">« ${b.t} <i className="dr-tirets">----------</i></p>`;
        return html`<p className=${cx("dr-p", b.cls && "dr-" + b.cls)}>${b.t}</p>`;
    }
  }

  // ------------------------------------------------------------------ Un feuillet
  function Feuillet({ doc, S, i }) {
    const N = doc.feuillets.length, blocs = doc.feuillets[i] || [];
    const band = doc.blocs.find((b) => b.k === "bandeau");
    const sigFinale = blocs.some((b) => b.k === "sig");
    const sigs = (doc.blocs.find((b) => b.k === "sig") || { cases: [] }).cases;
    return html`<article className=${cx("dr-page", "dr-" + doc.forme)} aria-label=${`${doc.cote || "Bordereau"}, feuillet ${i + 1} sur ${N}`}>
      ${doc.cote && html`<span className="dr-cote">${doc.cote}${N > 1 ? html`<small>/${i + 1}</small>` : null}</span>`}
      <div className="dr-corps">
        ${i > 0 && band && html`<${Bloc} b=${band} S=${S} suite=${true} n=${i + 1} N=${N} />`}
        ${blocs.map((b, k) => html`<${Bloc} key=${k} b=${b} S=${S} n=${i + 1} N=${N} />`)}
      </div>
      ${doc.piedSig && !sigFinale && html`<div className="dr-pied-sig">${doc.piedSig.map((r, k) => { const c = sigs.find((x) => x.role === r) || {}; return html`<div key=${k}><span>${r}</span>${c.etat === "signe" && html`<i className="dr-griffe">${paraphe(c.nom)}</i>`}${c.etat === "refus" && html`<i className="dr-manus">refus</i>`}</div>`; })}</div>`}
      <footer className="dr-pied">${doc.forme === "pv" ? `Procédure n° ${S.proc}` : ""}<span>${i + 1} / ${N}</span></footer>
    </article>`;
  }
  UI.Feuillet = Feuillet;

  // ------------------------------------------------------------------ Le dossier
  // props : S (simulation), stade ("gav" : pièces de l'article 63-4-1 ; "copie" : dossier complet), onClose, pied (zone libre)
  UI.DossierReel = function DossierReel({ S, stade, onClose, entete }) {
    const docs = useMemo(() => (stade === "gav" ? DOCS.consultables(S, S.a.entretien.m) : DOCS.dossier(S)), [S.sig, stade]);
    const [id, setId] = useState(docs[0] && docs[0].id);
    const [f, setF] = useState(0);
    const [lus, setLus] = useState({});
    const large = useLarge();
    const doc = docs.find((d) => d.id === id) || docs[0];
    useEffect(() => { if (!docs.find((d) => d.id === id)) { setId(docs[0] && docs[0].id); setF(0); } }, [docs]);
    const pas = large ? 2 : 1, N = doc ? doc.feuillets.length : 0;
    const vus = doc ? [f, large && f + 1 < N ? f + 1 : null].filter((x) => x != null) : [];
    useEffect(() => { if (!doc) return; const k = vus.filter((x) => !lus[doc.id + ":" + x]); if (k.length) setLus((o) => { const n = Object.assign({}, o); for (const x of k) n[doc.id + ":" + x] = DOCS.motsBlocs(doc.feuillets[x]); return n; }); }, [doc && doc.id, f, large]);
    const minutes = Math.round(Object.values(lus).reduce((a, b) => a + b, 0) / 200);
    const aller = (d, k) => { setId(d.id); setF(k || 0); };
    const tourner = (s) => {
      if (!doc) return;
      const k = f + s * pas, ix = docs.indexOf(doc);
      if (k >= 0 && k < N) setF(k);
      else if (s > 0 && ix < docs.length - 1) aller(docs[ix + 1]);
      else if (s < 0 && ix > 0) { const p = docs[ix - 1]; aller(p, Math.floor((p.feuillets.length - 1) / pas) * pas); }
    };
    useEffect(() => {
      const kd = (e) => {
        if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
        const ix = docs.indexOf(doc);
        if (e.key === "ArrowRight" || e.key === "PageDown") { tourner(1); e.preventDefault(); }
        else if (e.key === "ArrowLeft" || e.key === "PageUp") { tourner(-1); e.preventDefault(); }
        else if (e.key === "ArrowDown" && ix < docs.length - 1) { aller(docs[ix + 1]); e.preventDefault(); }
        else if (e.key === "ArrowUp" && ix > 0) { aller(docs[ix - 1]); e.preventDefault(); }
        else if (e.key === "Home") { setF(0); e.preventDefault(); }
        else if (e.key === "End") { setF(Math.floor((N - 1) / pas) * pas); e.preventDefault(); }
        else if (e.key === "Escape" && onClose) onClose();
      };
      window.addEventListener("keydown", kd);
      return () => window.removeEventListener("keydown", kd);
    });
    if (!doc) return html`<div className="dr"><p className="dr-vide">Aucune pièce n'est encore consultable.</p></div>`;
    const luDoc = (d) => d.feuillets.every((_, k) => lus[d.id + ":" + k] != null);
    return html`<div className="dr">
      <aside className="dr-rail" aria-label="Pièces du dossier">
        <header>
          <b>${stade === "gav" ? "Pièces consultables" : "Copie de la procédure"}</b>
          <span>${stade === "gav" ? "article 63-4-1 du code de procédure pénale" : `n° ${S.proc} · ${docs.length - 1} pièces`}</span>
        </header>
        <ol>${docs.map((d) => html`<li key=${d.id}><button type="button" className=${cx("dr-piece", d.id === doc.id && "on", luDoc(d) && "lu")} onClick=${() => aller(d)} aria-current=${d.id === doc.id ? "true" : undefined}>
          <span className="dr-pc">${d.cote || "—"}</span><span className="dr-pt">${d.titre}</span><span className="dr-pd">${SIM.date(S, d.m, "num").slice(0, 5)} · ${d.feuillets.length} f.</span>
        </button></li>`)}</ol>
        ${entete}
      </aside>
      <section className="dr-table-lecture">
        <header className="dr-barre">
          <span className="dr-ou"><b>${doc.cote || "Bordereau"}</b> ${doc.titre}</span>
          <span className="dr-lecture" title="Temps de lecture compté">Lecture : ${minutes} min</span>
          ${onClose && html`<button type="button" className="dr-fermer" onClick=${onClose}>Refermer le dossier</button>`}
        </header>
        <div className=${cx("dr-pages", large && "double")}>
          <button type="button" className="dr-fleche" onClick=${() => tourner(-1)} disabled=${f === 0 && docs.indexOf(doc) === 0} aria-label="Feuillet précédent">‹</button>
          <${Feuillet} key=${doc.id + ":" + f} doc=${doc} S=${S} i=${f} />
          ${large && (f + 1 < N ? html`<${Feuillet} key=${doc.id + ":" + (f + 1)} doc=${doc} S=${S} i=${f + 1} />` : html`<div className="dr-page dr-blanche" aria-hidden="true"></div>`)}
          <button type="button" className="dr-fleche" onClick=${() => tourner(1)} disabled=${f + pas >= N && docs.indexOf(doc) === docs.length - 1} aria-label="Feuillet suivant">›</button>
        </div>
      </section>
    </div>`;
  };

  // ------------------------------------------------------------------ Le pilote : une affaire de flagrance à graine fixe
  // Première affaire prise en charge par la simulation qui réunit plainte, témoin, images, et une irrégularité à trouver.
  const pilotes = {};
  UI.dossierPilote = function (n) {
    if (pilotes[n]) return pilotes[n];
    let k = 0;
    for (let i = 0; i < 6000; i++) {
      const t = CR.GEN2.tirer("pilote-gameplay:" + i, "gav", {});
      if (!t || !SIM.supporte(t)) continue;
      const riche = t.preuves.includes("video") && t.preuves.includes("temoin") && t.preuves.includes("plainte") && (t.voie === "copj" || t.voie === "ci");
      if (n === 0 && !(riche && t.irr.length === 1 && t.doutes.length)) continue;
      if (k++ < n && n > 0) continue;
      return (pilotes[n] = SIM.simuler(t));
    }
    return null;
  };
  UI.DossierPilote = function DossierPilote({ onClose }) {
    const [n, setN] = useState(0);
    const [stade, setStade] = useState("copie");
    const S = useMemo(() => UI.dossierPilote(n), [n]);
    if (!S) return html`<div className="dr"><p className="dr-vide">Aucune affaire à montrer.</p><button type="button" className="dr-fermer" onClick=${onClose}>Retour</button></div>`;
    const outils = html`<div className="dr-pilote">
      <p>Pilote de la refonte du gameplay, lot 1. Tout ce dossier sort d'une même simulation de l'affaire : rien n'y est signalé, rien n'est enregistré.</p>
      <div className="dr-pil-btns">
        <button type="button" className=${cx(stade === "gav" && "on")} onClick=${() => setStade("gav")}>En garde à vue</button>
        <button type="button" className=${cx(stade === "copie" && "on")} onClick=${() => setStade("copie")}>Copie du dossier</button>
      </div>
      <button type="button" onClick=${() => setN(n + 1)}>Une autre affaire</button>
    </div>`;
    return html`<${UI.DossierReel} key=${S.sig + stade} S=${S} stade=${stade} onClose=${onClose} entete=${outils} />`;
  };
})();
