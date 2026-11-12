/* La Permanence — le dossier de travail à l'écran (refonte du gameplay, lot 2).
   UI.SegPop : la fenêtre ouverte sur un passage (phrase cliquée, sélection libre ou annotation existante) : sens en
   couleur, note en marge, lien, chronologie, versions, plan de défense, irrégularité en quatre éléments, onglet, agenda.
   UI.TravailPanel : l'onglet « Dossier de travail » (extraits, chronologie, versions, plan de défense, liens, onglets).
   Rien ne dit si un passage compte : le jeu ne juge que plus tard (débrief, audience). */
(function () {
  const CR = window.CR, UI = CR.UI, T = CR.TRAV;
  const { useState } = React;
  const { html } = UI;
  const cx = UI.cx, bump = UI.bump;
  const court = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
  const iso = (j) => (j != null ? CR.fmtDate(j, "iso") : "");
  const hhmm = (m) => (m != null ? `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}` : "");
  const minDe = (v) => { const m = /^(\d{1,2}):(\d{2})/.exec(v || ""); return m ? +m[1] * 60 + +m[2] : null; };
  const ecartTxt = (m) => (m == null ? "" : m < 0 ? "" : m >= 1440 ? `+ ${Math.floor(m / 1440)} j ${CR.fmtDuration(m % 1440)}` : `+ ${CR.fmtDuration(m)}`);
  UI.annotRef = (a) => `${a.cote ? a.cote + ", f. " + a.f : a.titre ? court(a.titre, 40) : ""}`;

  // ================================================================== la fenêtre d'un passage
  // props : s, cs, seg, doc (pièce segmentée), range { debut, fin }, annotId, refInfo, x, y, go, onClose
  UI.SegPop = ({ s, cs, seg, doc, range, annotId, refInfo, x, y, go, onClose }) => {
    // une ligne lue à voix haute (garde à vue) : une pièce d'une seule phrase
    if (!doc || !range) {
      const t = (typeof seg === "string" ? seg : (seg && seg.t)) || "";
      doc = { paras: [[seg]], ref: refInfo || null };
      range = { debut: { p: 0, s: 0, o: 0 }, fin: { p: 0, s: 0, o: t.length } };
    }
    const docA = UI.docAnnot ? UI.docAnnot(doc) : doc;
    const ref = refInfo || doc.ref || null;
    const [aid, setAid] = useState(() => {
      if (annotId && T.annot(cs, annotId)) return annotId;
      const k = T.refKey(ref), d = range.debut, f = range.fin;
      const a = T.annots(cs).find((z) => z.ref === k && z.debut.p === d.p && z.debut.s === d.s && z.debut.o === d.o && z.fin.p === f.p && z.fin.s === f.s && z.fin.o === f.o);
      return a ? a.id : null;
    });
    const [mode, setMode] = useState(null);
    const a = aid ? T.annot(cs, aid) : null;
    const texte = a ? a.t : T.couvert(docA, range.debut, range.fin).t;
    const W = cs ? T.etat(cs) : null;
    const style = { left: Math.max(0, Math.min(x || 0, 380)), top: y || 0 };
    // l'annotation naît au premier geste
    const assure = (coul) => {
      if (a) { if (coul) T.modifier(cs, a.id, { coul }); return a; }
      const n = T.annoter(s, cs, { doc: docA, ref, debut: range.debut, fin: range.fin, coul: coul || "verifier" });
      if (n) setAid(n.id);
      return n;
    };
    if (!cs) return null;
    const irr = a ? W.irregs.find((z) => z.annot === a.id) : null;
    const quote = html`<p className="pop-quote small">« ${court(texte, 160)} »${a ? html` <span className="muted">${UI.annotRef(a)}</span>` : null}</p>`;
    const couleurs = html`<div className="pop-coul">${T.COULEURS.map(([k, l]) => html`<button key=${k} type="button" className=${cx("nchip", "an-chip", "an-" + k, a && a.coul === k && "on")} onClick=${() => { assure(k); bump(); }}>${l}</button>`)}</div>`;
    const retour = html`<${UI.Btn} small onClick=${() => setMode(null)}>Retour</${UI.Btn}>`;
    let corps = null;
    if (mode === "note") corps = html`<${NoteForm} a=${assure()} onDone=${() => { bump(); setMode(null); }} retour=${retour} />`;
    else if (mode === "lien") corps = html`<${LienForm} s=${s} cs=${cs} a=${assure()} onDone=${() => { bump(); setMode(null); }} retour=${retour} />`;
    else if (mode === "chrono") corps = html`<${ChronoForm} s=${s} cs=${cs} a=${assure()} onDone=${() => { bump(); setMode(null); }} retour=${retour} />`;
    else if (mode === "version") corps = html`<${VersionForm} cs=${cs} a=${assure()} onDone=${() => { bump(); setMode(null); }} retour=${retour} />`;
    else if (mode === "plan") corps = html`<${PlanForm} s=${s} cs=${cs} a=${assure()} onDone=${() => { bump(); setMode(null); }} retour=${retour} />`;
    else if (mode === "irreg") corps = html`<${IrregForm} s=${s} cs=${cs} a=${assure("procedure")} onDone=${() => { bump(); onClose(); }} retour=${retour} />`;
    if (corps) return html`<div className="pop pop-form" style=${style}>${quote}${corps}</div>`;
    return html`<div className="pop pop-travail" style=${style}>
      ${quote}
      ${couleurs}
      <div className="pop-actions">
        <button onClick=${() => setMode("note")}><${UI.Icon} n="pen" /> ${a && a.note ? "Modifier la note en marge" : "Note en marge"}</button>
        <button onClick=${() => setMode("lien")}><${UI.Icon} n="cases" /> Relier à un autre passage</button>
        <button onClick=${() => setMode("chrono")}><${UI.Icon} n="calendar" /> Placer dans la chronologie</button>
        <button onClick=${() => setMode("version")}><${UI.Icon} n="cases" /> Tableau des versions</button>
        <button onClick=${() => setMode("plan")}><${UI.Icon} n="flag" /> Plan de défense</button>
        ${irr ? html`<span className="pop-info small">Irrégularité relevée.</span>` : html`<button onClick=${() => setMode("irreg")}><${UI.Icon} n="flag" /> Relever une irrégularité</button>`}
        ${ref && ref.doc && html`<button onClick=${() => { T.onglet(cs, ref.doc); bump(); }}><${UI.Icon} n="flag" /> ${T.aOnglet(cs, ref.doc) ? "Retirer l'onglet de la pièce" : "Mettre un onglet sur la pièce"}</button>`}
        ${go && html`<button onClick=${() => { go.agenda({ caseId: cs.id, title: court(texte, 80), ref: ref && ref.hid }); onClose(); }}><${UI.Icon} n="calendar" /> Inscrire à l'agenda…</button>`}
        ${a && html`<button onClick=${() => { if (irr) T.retirerIrreg(cs, irr.id); T.retirer(cs, a.id); bump(); onClose(); }}>Retirer l'annotation</button>`}
      </div>
    </div>`;
  };

  // ------------------------------------------------------------------ formulaires de la fenêtre
  const NoteForm = ({ a, onDone, retour }) => {
    const [v, setV] = useState(a ? a.note : "");
    return html`<div><span className="pix">Note en marge</span>
      <textarea rows="3" aria-label="Note en marge" value=${v} onChange=${(e) => setV(e.target.value)}></textarea>
      <div className="pop-row"><${UI.Btn} small kind="primary" onClick=${() => { if (a) a.note = v.trim(); onDone(); }}>Écrire en marge</${UI.Btn}>${retour}</div></div>`;
  };
  const autresAnnots = (cs, a) => T.annots(cs).filter((z) => z.id !== (a && a.id));
  const optAnnot = (z) => html`<option key=${z.id} value=${z.id}>${(UI.annotRef(z) ? UI.annotRef(z) + " : " : "") + court(z.t, 60)}</option>`;
  const LienForm = ({ s, cs, a, onDone, retour }) => {
    const [b, setB] = useState(""), [quoi, setQuoi] = useState("heure"), [note, setNote] = useState("");
    const L = autresAnnots(cs, a);
    return html`<div><span className="pix">Ce qui se contredit</span>
      ${L.length ? html`<select className="pop-lien" aria-label="Autre passage" value=${b} onChange=${(e) => setB(e.target.value)}><option value="">— un autre passage annoté —</option>${L.map(optAnnot)}</select>` : html`<p className="small muted">Annotez d'abord l'autre passage.</p>`}
      <div className="pop-types">${T.LIENS.map(([k, l]) => html`<button key=${k} type="button" className=${cx("nchip", quoi === k && "on")} onClick=${() => setQuoi(k)}>${l}</button>`)}</div>
      <textarea rows="2" aria-label="Ce qui ne colle pas" placeholder="Ce qui ne colle pas (facultatif)" value=${note} onChange=${(e) => setNote(e.target.value)}></textarea>
      <div className="pop-row"><${UI.Btn} small kind="primary" disabled=${!b} onClick=${() => { T.relier(s, cs, a.id, b, quoi, note); onDone(); }}>Relier</${UI.Btn}>${retour}</div></div>`;
  };
  const ChronoForm = ({ s, cs, a, onDone, retour }) => {
    const der = T.chronologie(cs).slice(-1)[0];
    const [jour, setJour] = useState(iso(T.dateDans(a.t) != null ? T.dateDans(a.t) : der ? der.jour : null));
    const [heure, setHeure] = useState(hhmm(T.heureDans(a.t)));
    const [lib, setLib] = useState(court(a.t, 90));
    const ok = jour && minDe(heure) != null;
    return html`<div><span className="pix">Chronologie</span>
      <div className="pop-row"><label className="small">Date <input type="date" aria-label="Date" value=${jour} onChange=${(e) => setJour(e.target.value)} /></label>
      <label className="small">Heure <input type="time" aria-label="Heure" value=${heure} onChange=${(e) => setHeure(e.target.value)} /></label></div>
      <input type="text" aria-label="Événement" value=${lib} onChange=${(e) => setLib(e.target.value)} />
      <div className="pop-row"><${UI.Btn} small kind="primary" disabled=${!ok} onClick=${() => { T.placer(s, cs, { annot: a.id, jour: CR.parseISO(jour), heure: minDe(heure), libelle: lib }); onDone(); }}>Placer</${UI.Btn}>${retour}</div></div>`;
  };
  const VersionForm = ({ cs, a, onDone, retour }) => {
    const W = T.etat(cs);
    const [pt, setPt] = useState(W.versions.points.length ? W.versions.points[W.versions.points.length - 1].id : ""), [neuf, setNeuf] = useState(""), [qui, setQui] = useState("");
    return html`<div><span className="pix">Qui dit quoi</span>
      <select aria-label="Point" value=${pt} onChange=${(e) => setPt(e.target.value)}><option value="">— nouveau point —</option>${W.versions.points.map((p) => html`<option key=${p.id} value=${p.id}>${p.label}</option>`)}</select>
      ${!pt && html`<input type="text" aria-label="Nouveau point" placeholder="Le point (qui a frappé le premier, l'heure, la tenue…)" value=${neuf} onChange=${(e) => setNeuf(e.target.value)} />`}
      <div className="pop-types">${T.QUI.map(([k, l]) => html`<button key=${k} type="button" className=${cx("nchip", qui === k && "on")} onClick=${() => setQui(k)}>${l}</button>`)}</div>
      <div className="pop-row"><${UI.Btn} small kind="primary" disabled=${!qui || (!pt && !neuf.trim())} onClick=${() => { const p = pt || (T.point(cs, neuf) || {}).id; T.version(cs, { point: p, qui, annot: a.id }); onDone(); }}>Ajouter au tableau</${UI.Btn}>${retour}</div></div>`;
  };
  const PlanForm = ({ s, cs, a, onDone, retour }) => {
    const [col, setCol] = useState(a.coul === "procedure" ? "procedure" : "fond"), [mo, setMo] = useState(""), [titre, setTitre] = useState("");
    const L = T.planDe(cs, col);
    return html`<div><span className="pix">Plan de défense</span>
      <div className="pop-types">${T.COLONNES.map(([k, l]) => html`<button key=${k} type="button" className=${cx("nchip", col === k && "on")} onClick=${() => { setCol(k); setMo(""); }}>${l}</button>`)}</div>
      <select aria-label="Moyen" value=${mo} onChange=${(e) => setMo(e.target.value)}><option value="">— nouveau moyen —</option>${L.map((m) => html`<option key=${m.id} value=${m.id}>${court(m.titre, 70)}</option>`)}</select>
      ${!mo && html`<input type="text" aria-label="Moyen" placeholder="Le moyen, en quelques mots" value=${titre} onChange=${(e) => setTitre(e.target.value)} />`}
      <div className="pop-row"><${UI.Btn} small kind="primary" disabled=${!mo && !titre.trim()} onClick=${() => { if (mo) T.appuyer(cs, mo, a.id); else T.moyen(s, cs, { col, titre, annots: [a.id] }); onDone(); }}>Appuyer le moyen sur ce passage</${UI.Btn}>${retour}</div></div>`;
  };
  // le passage, le texte violé, le régime de nullité, le grief
  const IrregForm = ({ s, cs, a, onDone, retour }) => {
    const [avec, setAvec] = useState(""), [article, setArticle] = useState(""), [regime, setRegime] = useState(""), [grief, setGrief] = useState(""), [note, setNote] = useState("");
    const L = autresAnnots(cs, a);
    return html`<div><span className="pix">Irrégularité</span>
      <label className="small pop-avec">À rapprocher d'un autre passage (facultatif) <select aria-label="Passage à comparer" value=${avec} onChange=${(e) => setAvec(e.target.value)}><option value="">— aucun —</option>${L.map(optAnnot)}</select></label>
      <label className="small">Texte violé : article <input type="text" className="pop-article" aria-label="Article" placeholder="63-1" value=${article} onChange=${(e) => setArticle(e.target.value)} /></label>
      <span className="small">Régime</span>
      <div className="pop-types pop-regimes">${T.REGIMES.map(([k, l]) => html`<button key=${k} type="button" className=${cx("nchip", regime === k && "on")} onClick=${() => setRegime(k)}>${l}</button>`)}</div>
      <span className="small">Grief</span>
      <div className="pop-types pop-griefs">${T.GRIEFS.map(([k, l]) => html`<button key=${k} type="button" className=${cx("nchip", grief === k && "on")} onClick=${() => setGrief(k)}>${l}</button>`)}</div>
      <textarea rows="2" aria-label="Votre remarque" placeholder="Votre remarque (facultatif)" value=${note} onChange=${(e) => setNote(e.target.value)}></textarea>
      <div className="pop-row"><${UI.Btn} small kind="primary" disabled=${!article.trim() || !regime} onClick=${() => { T.relever(s, cs, { annot: a.id, avec: avec || null, article, regime, grief, note }); onDone(); }}>Relever</${UI.Btn}>${retour}</div></div>`;
  };

  // ================================================================== l'onglet « Dossier de travail »
  const VUES = [["extraits", "Extraits"], ["chrono", "Chronologie"], ["versions", "Versions"], ["plan", "Plan de défense"], ["liens", "Liens"], ["onglets", "Onglets"]];
  const numCote = (a) => (a.cote ? +String(a.cote).replace(/^D(\d+).*/, "$1") : 1e6);
  UI.TravailPanel = ({ s, cs, openDoc }) => {
    const [vue, setVue] = useState("extraits");
    const [coul, setCoul] = useState("all");
    const W = T.etat(cs);
    const A = (id) => T.annot(cs, id);
    const voir = (a) => (a && a.doc && cs.docs.some((d) => d.id === a.doc) ? html` <button className="link small" onClick=${() => openDoc(a.doc)}>voir la pièce</button>` : null);
    const extrait = (a, n) => (a ? html`<span className=${cx("an-cite", "an-" + a.coul)}>« ${court(a.t, n || 120)} »</span> <span className="small muted">${UI.annotRef(a)}</span>` : html`<span className="muted small">(passage retiré)</span>`);
    const ferme = cs.status === "closed";
    return html`<div className="travail">
      <p className="small muted">Votre dossier de travail : ce que vous y construisez est tout ce que vous aurez en main à l'audience. Sélectionnez un passage dans une pièce, ou cliquez une phrase, pour l'annoter.</p>
      <div className="chips">${VUES.map(([k, l]) => html`<button key=${k} className=${cx("chip", vue === k && "on")} onClick=${() => setVue(k)}>${l}${k === "extraits" ? ` (${W.annots.length})` : k === "chrono" ? ` (${W.chrono.length})` : k === "plan" ? ` (${W.plan.length})` : k === "liens" ? ` (${W.liens.length})` : k === "onglets" ? ` (${W.onglets.length})` : ""}</button>`)}</div>
      ${vue === "extraits" && html`<div>
        <div className="chips">${[["all", "Tous"]].concat(T.COULEURS).map(([k, l]) => html`<button key=${k} className=${cx("nchip", k !== "all" && "an-chip an-" + k, coul === k && "on")} onClick=${() => setCoul(k)}>${l}</button>`)}</div>
        <ul className="an-list">
          ${W.annots.length === 0 && html`<li className="empty">Aucun passage annoté.</li>`}
          ${W.annots.filter((a) => coul === "all" || a.coul === coul).slice().sort((x, y) => numCote(x) - numCote(y) || x.debut.p - y.debut.p).map((a) => html`<li key=${a.id}>
            <${UI.Tag}>${T.label(T.COULEURS, a.coul)}</${UI.Tag}> ${extrait(a, 220)}${voir(a)}
            ${a.note && html`<div className="an-marge an-${a.coul}">${a.note}</div>`}
            ${!ferme && html`<div className="an-tools">${T.COULEURS.map(([k, l]) => html`<button key=${k} type="button" className=${cx("nchip", "an-chip", "an-" + k, a.coul === k && "on")} onClick=${() => { T.modifier(cs, a.id, { coul: k }); bump(); }}>${l}</button>`)}<button className="link small" onClick=${() => { const ir = W.irregs.find((z) => z.annot === a.id); if (ir) T.retirerIrreg(cs, ir.id); T.retirer(cs, a.id); bump(); }}>retirer</button></div>`}
          </li>`)}
        </ul></div>`}
      ${vue === "chrono" && html`<${ChronoVue} s=${s} cs=${cs} A=${A} extrait=${extrait} ferme=${ferme} />`}
      ${vue === "versions" && html`<${VersionsVue} cs=${cs} A=${A} ferme=${ferme} />`}
      ${vue === "plan" && html`<${PlanVue} s=${s} cs=${cs} A=${A} extrait=${extrait} ferme=${ferme} />`}
      ${vue === "liens" && html`<ul className="an-list">
        ${W.liens.length === 0 && html`<li className="empty">Aucun lien. Dans la fenêtre d'un passage : « Relier à un autre passage ».</li>`}
        ${W.liens.map((l) => html`<li key=${l.id}><${UI.Tag}>${T.label(T.LIENS, l.quoi)}</${UI.Tag}> ${extrait(A(l.a), 90)} <span className="an-vs">↔</span> ${extrait(A(l.b), 90)}${l.note ? html` <span className="small">— ${l.note}</span>` : null}${!ferme && html` <button className="link small" onClick=${() => { W.liens = W.liens.filter((x) => x.id !== l.id); bump(); }}>retirer</button>`}</li>`)}
      </ul>`}
      ${vue === "onglets" && html`<ul className="doc-list">
        ${W.onglets.length === 0 && html`<li className="empty">Aucun onglet. Dans la fenêtre d'un passage : « Mettre un onglet sur la pièce ».</li>`}
        ${W.onglets.map((id) => { const d = cs.docs.find((x) => x.id === id); return d && html`<li key=${id}><button className="doc-row" onClick=${() => openDoc(id)}><span className="onglet-mark" aria-hidden="true"></span><span>${d.title}</span></button></li>`; })}
      </ul>`}
    </div>`;
  };
  const ChronoVue = ({ s, cs, A, extrait, ferme }) => {
    const [jour, setJour] = useState(""), [heure, setHeure] = useState(""), [lib, setLib] = useState("");
    const L = T.chronologie(cs);
    return html`<div>
      <ol className="chrono-list">
        ${L.length === 0 && html`<li className="empty">Aucun événement placé. Dans la fenêtre d'un passage : « Placer dans la chronologie ».</li>`}
        ${L.map((e, i) => html`<li key=${e.id}>
          ${i > 0 && html`<div className="chrono-ecart small">${ecartTxt(e.ecart)}</div>`}
          <span className="chrono-quand">${CR.fmtDate(e.jour, "short")} · ${CR.fmtTime(e.heure)}</span> ${e.libelle}${e.annot && A(e.annot) ? html` <span className="small muted">${UI.annotRef(A(e.annot))}</span>` : null}
          ${!ferme && html` <button className="link small" onClick=${() => { T.deplacer(cs, e.id); bump(); }}>retirer</button>`}
        </li>`)}
      </ol>
      ${!ferme && html`<div className="chrono-ajout pop-row">
        <input type="date" aria-label="Date" value=${jour} onChange=${(e) => setJour(e.target.value)} />
        <input type="time" aria-label="Heure" value=${heure} onChange=${(e) => setHeure(e.target.value)} />
        <input type="text" aria-label="Événement" placeholder="Événement (sans pièce)" value=${lib} onChange=${(e) => setLib(e.target.value)} />
        <${UI.Btn} small disabled=${!jour || minDe(heure) == null || !lib.trim()} onClick=${() => { T.placer(s, cs, { jour: CR.parseISO(jour), heure: minDe(heure), libelle: lib }); setLib(""); bump(); }}>Placer</${UI.Btn}>
      </div>`}
    </div>`;
  };
  const VersionsVue = ({ cs, A, ferme }) => {
    const W = T.etat(cs);
    const [neuf, setNeuf] = useState("");
    const cols = T.QUI.filter(([k]) => W.versions.cells.some((c) => c.qui === k));
    return html`<div>
      ${W.versions.points.length === 0 ? html`<p className="empty">Aucun point. Ajoutez-en un ici, ou depuis la fenêtre d'un passage.</p>` : html`<div className="versions-wrap"><table className="tbl versions">
        <thead><tr><th>Point</th>${cols.map(([k, l]) => html`<th key=${k}>${l}</th>`)}</tr></thead>
        <tbody>${W.versions.points.map((p) => html`<tr key=${p.id}><th>${p.label}</th>${cols.map(([k]) => html`<td key=${k}>${W.versions.cells.filter((c) => c.point === p.id && c.qui === k).map((c) => { const a = A(c.annot); return html`<div key=${c.id} className=${cx("v-cell", a && "an-" + a.coul)}>${a ? `« ${court(a.t, 90)} »` : "—"} ${a && html`<span className="small muted">${UI.annotRef(a)}</span>`}${!ferme && html` <button className="link small" onClick=${() => { T.retirerVersion(cs, c.id); bump(); }}>×</button>`}</div>`; })}</td>`)}</tr>`)}</tbody>
      </table></div>`}
      ${!ferme && html`<div className="pop-row"><input type="text" aria-label="Nouveau point" placeholder="Nouveau point" value=${neuf} onChange=${(e) => setNeuf(e.target.value)} /><${UI.Btn} small disabled=${!neuf.trim()} onClick=${() => { T.point(cs, neuf); setNeuf(""); bump(); }}>Ajouter le point</${UI.Btn}></div>`}
    </div>`;
  };
  const PlanVue = ({ s, cs, A, extrait, ferme }) => {
    const W = T.etat(cs);
    const [col, setCol] = useState("fond"), [titre, setTitre] = useState("");
    return html`<div>
      <div className="plan-cols">${T.COLONNES.map(([k, l]) => html`<section key=${k} className="plan-col">
        <h4 className="pix">${l}</h4>
        ${T.planDe(cs, k).length === 0 && html`<p className="small muted">—</p>`}
        ${T.planDe(cs, k).map((m) => { const ir = m.irreg ? W.irregs.find((z) => z.id === m.irreg) : null; return html`<div key=${m.id} className="moyen">
          <strong>${m.titre}</strong>
          ${ir && html`<div className="small moyen-irr">Texte violé : art. ${ir.article || "—"} · ${T.label(T.REGIMES, ir.regime) || "régime non dit"}${ir.grief ? " · grief : " + T.label(T.GRIEFS, ir.grief).toLowerCase() : ""}</div>`}
          <ul className="moyen-cotes">${m.annots.map((id) => html`<li key=${id}>${extrait(A(id), 80)}</li>`)}</ul>
          ${!ferme && !ir && html`<button className="link small" onClick=${() => { T.retirerMoyen(cs, m.id); bump(); }}>retirer</button>`}
        </div>`; })}
      </section>`)}</div>
      ${!ferme && html`<div className="pop-row">
        <select aria-label="Colonne" value=${col} onChange=${(e) => setCol(e.target.value)}>${T.COLONNES.map(([k, l]) => html`<option key=${k} value=${k}>${l}</option>`)}</select>
        <input type="text" aria-label="Moyen" placeholder="Nouveau moyen" value=${titre} onChange=${(e) => setTitre(e.target.value)} />
        <${UI.Btn} small disabled=${!titre.trim()} onClick=${() => { T.moyen(s, cs, { col, titre }); setTitre(""); bump(); }}>Ajouter</${UI.Btn}>
      </div>`}
    </div>`;
  };
})();
