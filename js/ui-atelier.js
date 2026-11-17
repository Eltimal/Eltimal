/* La Permanence — l'atelier du visage (1.3.0 « Les visages et les noms »).
   Le joueur compose son avocat pièce par pièce : un portrait en grand, un onglet par famille de pièces, une rangée par
   menu, « Au hasard » pour un menu ou pour tout. Ouvert à la création de la carrière et depuis le menu de la partie
   (on change de coupe, on vieillit, sans toucher à la partie). Les pièces viennent de CR.px.BANQUE (portraits.js) :
   la même banque que celle des inconnus du jeu. Rien n'y est réservé à un sexe ni à une origine. */
(function () {
  const CR = window.CR, PX = CR.px, UI = CR.UI, { html } = UI;
  const { useState, useMemo } = React;
  const cx = UI.cx;
  // menus qui se montrent par une vignette du visage, par une pastille de couleur, ou par un simple bouton
  const VIGNETTE = new Set(["face", "cut", "brow", "eyes", "nose", "bouche", "mood", "beard", "glasses", "ear", "cou", "hat", "traits", "lines", "wear", "build", "weight", "gap", "lash", "lipf"]);
  const COULEUR = { peau: (v) => PX.SKIN2[v], hc: (v) => PX.HAIRHEX[v], eye: (v) => PX.EYESHEX[v], gcol: (v) => v, shirt: (v) => v, lipstick: (v) => v || "transparent", bg: (v) => PX.BGS[v] };
  const AGES = [23, 26, 29, 32, 36, 40, 45, 50, 55, 60, 66, 72];

  // un nouveau visage tiré au sort, en robe (comme à la prestation de serment)
  PX.lookJoueur = (seed, o = {}) => Object.assign(PX.lookFrom2("joueur" + seed, { age: o.age || 28, g: o.g }), { outfit: "robe" });

  function Option({ k, v, lab, on, look, onPick }) {
    const col = COULEUR[k];
    if (col) return html`<button type="button" className=${cx("at-sw", on && "on")} aria-pressed=${on} title=${lab} aria-label=${lab} onClick=${onPick} style=${{ background: col(v) }}>${k === "lipstick" && !v ? "∅" : ""}</button>`;
    if (VIGNETTE.has(k)) {
      const p = PX.poserPiece(look.p, k, k === "traits" ? (on ? look.p.traits.filter((x) => x !== v) : (look.p.traits || []).concat([v])) : v);
      const L = PX.lookDePieces(Object.assign({}, look, { outfit: k === "wear" ? "shirt" : look.outfit }), p);
      const crop = !["wear", "build", "weight", "cou", "cut"].includes(k);
      return html`<button type="button" className=${cx("at-opt", on && "on")} aria-pressed=${on} onClick=${onPick}>
        <${UI.Portrait} look=${L} size=${crop ? 44 : 64} blink=${false} /><span>${lab}</span></button>`;
    }
    return html`<button type="button" className=${cx("at-txt", on && "on")} aria-pressed=${on} onClick=${onPick}>${lab}</button>`;
  }

  // UI.Atelier : look (banque 2), onChange(look). Le parent garde le look.
  UI.Atelier = function ({ look, onChange }) {
    const [onglet, setOnglet] = useState(0);
    const [ville, setVille] = useState(false);
    const B = PX.BANQUE, T = PX.BANQUE_TITRES;
    const poser = (k, v) => onChange(PX.lookDePieces(look, PX.poserPiece(look.p, k, v)));
    const auHasard = (k) => { const vs = B[k].map((x) => x[0]); if (k === "traits") { const a = vs.slice().sort(() => Math.random() - 0.5); poser(k, a.slice(0, Math.floor(Math.random() * 3))); } else poser(k, vs[Math.floor(Math.random() * vs.length)]); };
    const toutHasard = () => { const n = PX.lookFrom2("atelier" + Math.random(), { age: look.age, g: look.g }); onChange(Object.assign(n, { outfit: look.outfit })); };
    const vu = Object.assign({}, look, { outfit: ville ? "shirt" : look.outfit === "shirt" ? "robe" : look.outfit });
    const [nom, menus] = PX.ATELIER[onglet];
    return html`<div className="atelier">
      <div className="at-portrait">
        <${UI.Portrait} look=${vu} size=${192} />
        <div className="at-vue" role="group" aria-label="Tenue de l'aperçu">
          <button type="button" className=${cx("at-txt", !ville && "on")} aria-pressed=${!ville} onClick=${() => setVille(false)}>En robe</button>
          <button type="button" className=${cx("at-txt", ville && "on")} aria-pressed=${ville} onClick=${() => setVille(true)}>En ville</button>
        </div>
        <label className="small" htmlFor="at-age">Âge : ${look.age} ans</label>
        <input id="at-age" type="range" min="0" max=${AGES.length - 1} step="1" value=${Math.max(0, AGES.findIndex((a) => a >= look.age))} onChange=${(e) => onChange(Object.assign({}, look, { age: AGES[+e.target.value] }))} />
        <button type="button" className="ts-btn ts-btn-sm" onClick=${toutHasard}>Tout au hasard</button>
        <p className="small muted">La robe à l'audience ; la tenue de ville au cabinet et en garde à vue.</p>
      </div>
      <div className="at-menus">
        <div className="tabs" role="tablist" aria-label="Pièces du visage">${PX.ATELIER.map(([n], i) => html`<button key=${n} type="button" role="tab" aria-selected=${i === onglet} className=${cx("tab", i === onglet && "on")} onClick=${() => setOnglet(i)}>${n}</button>`)}</div>
        <div role="tabpanel" aria-label=${nom}>
          ${menus.map((k) => { const cur = PX.pieceDe(look.p, k); return html`<section key=${k} className="at-menu">
            <div className="at-menu-head"><h4>${T[k] || k}${k === "traits" ? html` <span className="small muted">(jusqu'à six)</span>` : ""}</h4><button type="button" className="link small" onClick=${() => auHasard(k)}>Au hasard</button></div>
            <div className=${cx("at-opts", COULEUR[k] && "at-couleurs")}>${B[k].map(([v, lab]) => { const on = k === "traits" ? cur.includes(v) : String(cur) === String(v); return html`<${Option} key=${String(v)} k=${k} v=${v} lab=${lab} on=${on} look=${look} onPick=${() => (k === "traits" ? poser(k, on ? cur.filter((x) => x !== v) : cur.concat([v])) : poser(k, v))} />`; })}</div>
          </section>`; })}
        </div>
      </div>
    </div>`;
  };

  // La fenêtre de l'atelier : look de départ, onSave(look), onClose
  UI.AtelierModal = function ({ look, onSave, onClose, titre }) {
    const depart = useMemo(() => (look && look.b === 2 ? look : PX.versBanque2(look || PX.lookJoueur(Math.floor(Math.random() * 1e6)))), []);
    const [L, setL] = useState(depart);
    return html`<${UI.Modal} title=${titre || "Votre visage"} onClose=${onClose} wide className="atelier-modal" footer=${html`<${UI.Btn} onClick=${onClose}>Annuler</${UI.Btn}><${UI.Btn} kind="primary" onClick=${() => onSave(Object.assign({}, L, { outfit: "robe" }))}>Garder ce visage</${UI.Btn}>`}>
      ${look && look.b !== 2 && html`<p className="small muted">Votre visage entre dans le nouvel atelier : il peut changer un peu. Annulez pour garder l'ancien tel quel.</p>`}
      <${UI.Atelier} look=${L} onChange=${setL} />
    </${UI.Modal}>`;
  };
})();
