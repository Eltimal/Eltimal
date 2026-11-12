/* La Permanence — interface : outils React/htm et composants partagés */
(function () {
  const CR = (window.CR = window.CR || {});
  const { useState, useEffect, useRef, useSyncExternalStore } = React;
  const html = htm.bind(React.createElement);
  const UI = (CR.UI = {});
  UI.html = html;

  UI.useGame = () => { useSyncExternalStore((f) => CR.store.sub(f), () => CR.store.v); return CR.store.s; };
  UI.bump = () => CR.store.bump();
  UI.cx = (...a) => a.filter(Boolean).join(" ");

  // ------------------------------------------------------------------ Icônes (SVG, grille 16)
  const ICONS = {
    desk: "M2 9h12v5H2zM4 3h8v5H4z", inbox: "M2 3h12v10H2zM2 9h3l1 2h4l1-2h3",
    phone: "M5 1h6v14H5zM7 12h2", cases: "M2 4h4l1 1h7v8H2z", calendar: "M2 4h12v10H2zM2 7h12M5 2v3M11 2v3",
    library: "M3 2h3v12H3zM7 2h3v12H7zM11 3l2-.5 2 11-2 .5z", firm: "M2 14V6l6-4 6 4v8zM6 14v-4h4v4",
    journal: "M3 2h9v12H3zM5 5h5M5 8h5M5 11h3", menu: "M2 4h12M2 8h12M2 12h12", bolt: "M9 1L3 9h4l-1 6 6-8H8z",
    close: "M3 3l10 10M13 3L3 13", back: "M10 3L5 8l5 5", plus: "M8 3v10M3 8h10", flag: "M3 14V2M3 2h9l-2 3 2 3H3",
    pen: "M2 14l1-4 8-8 3 3-8 8z", clock: "M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3l2 2", gavel: "M2 14l5-5M6 4l4-2 4 4-2 4zM5 7l4 4",
    skip: "M3 3l6 5-6 5zM9 3l6 5-6 5z", moon: "M11 2a6 6 0 105 9A5 5 0 0111 2z", check: "M3 8l3 3 7-7",
    warn: "M8 2l7 12H1zM8 6v4M8 12v1", user: "M8 2a3 3 0 100 6 3 3 0 000-6zM2 14c1-3 3-4 6-4s5 1 6 4",
    coin: "M8 2a6 6 0 100 12A6 6 0 008 2zM10 6H7.5a1.5 1.5 0 000 3h1a1.5 1.5 0 010 3H6",
    scale: "M8 2v12M4 14h8M3 4h10M3 4l-2 5h4zM13 4l-2 5h4z", map: "M1 3l4.5-1.5 5 2L15 2v11l-4.5 1.5-5-2L1 14zM5.5 1.5v11M10.5 3.5v11",
    pin: "M8 15s5-5 5-8.5a5 5 0 00-10 0C3 10 8 15 8 15zM8 4.5a2 2 0 100 4 2 2 0 000-4z", binder: "M3 2h10v12H3zM6 2v12M8 5h3M8 8h3",
    walk: "M8 2a1 1 0 100 2 1 1 0 000-2zM6 15l2-5 2 2v3M10 7L8 5 5 8M8 10l2-3 2 1",
  };
  UI.Icon = ({ n, size = 16 }) => html`<svg className="ico" width=${size} height=${size} viewBox="0 0 16 16" aria-hidden="true"><path d=${ICONS[n] || ICONS.desk} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" /></svg>`;

  // ------------------------------------------------------------------ Portrait
  UI.Portrait = ({ look, expr, size = 64, blink = true, className }) => {
    const ref = useRef(null);
    const [b, setB] = useState(false);
    useEffect(() => {
      if (!blink) return;
      let alive = true;
      const loop = () => { if (!alive) return; setB(true); setTimeout(() => alive && setB(false), 140); setTimeout(loop, 2500 + Math.random() * 3500); };
      const t = setTimeout(loop, 1000 + Math.random() * 2000);
      return () => { alive = false; clearTimeout(t); };
    }, [blink]);
    useEffect(() => {
      const c = ref.current;
      if (!c || !look) return;
      const img = CR.px.portrait(look, expr || "neutral", b);
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 32, 32);
      ctx.drawImage(img, 0, 0);
    }, [look && JSON.stringify(look), expr, b]);
    return html`<canvas ref=${ref} width="32" height="32" className=${UI.cx("portrait", className)} style=${{ width: size, height: size }} />`;
  };

  // ------------------------------------------------------------------ Décor en pixel art
  UI.SceneCanvas = ({ name, opts, className }) => {
    const ref = useRef(null);
    const optsRef = useRef(opts);
    optsRef.current = opts;
    useEffect(() => {
      const c = ref.current;
      if (!c) return;
      let raf, last = 0, alive = true;
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const draw = (now) => {
        if (!alive) return;
        if (now - last > 160) { last = now; try { CR.px.drawScene(c, name, Object.assign({}, optsRef.current, { t: reduce ? 0 : now / 1000 })); } catch (e) { console.error(e); } }
        if (!reduce) raf = requestAnimationFrame(draw);
      };
      draw(1000);
      if (!reduce) raf = requestAnimationFrame(draw);
      return () => { alive = false; cancelAnimationFrame(raf); };
    }, [name]);
    useEffect(() => { const c = ref.current; if (c) try { CR.px.drawScene(c, name, Object.assign({}, opts, { t: performance.now() / 1000 })); } catch (e) {} }, [JSON.stringify(opts || {})]);
    return html`<canvas ref=${ref} width="256" height="96" className=${UI.cx("scene-canvas", className)} />`;
  };

  // ------------------------------------------------------------------ Jauges, argent
  UI.Meter = ({ value, max = 100, tone, label, small }) => {
    const pct = CR.clamp(value / max, 0, 1) * 100;
    return html`<div className=${UI.cx("meter", small && "meter-sm", tone && "tone-" + tone)} title=${label || ""}><div className="meter-fill" style=${{ width: pct + "%" }}></div></div>`;
  };
  UI.Money = ({ v, className }) => html`<span className=${UI.cx("num", v < 0 && "neg", className)}>${CR.money(v)}</span>`;

  // ------------------------------------------------------------------ Fenêtre modale
  UI.Modal = ({ title, onClose, children, wide, className, footer }) => {
    useEffect(() => {
      const k = (e) => { if (e.key === "Escape" && onClose) onClose(); };
      window.addEventListener("keydown", k);
      return () => window.removeEventListener("keydown", k);
    }, [onClose]);
    return html`<div className="modal-wrap" role="dialog" aria-modal="true">
      <div className=${UI.cx("modal", wide && "modal-wide", className)}>
        <div className="modal-head"><h2>${title}</h2>${onClose && html`<button className="icon-btn" onClick=${onClose} aria-label="Fermer"><${UI.Icon} n="close" /></button>`}</div>
        <div className="modal-body">${children}</div>
        ${footer && html`<div className="modal-foot">${footer}</div>`}
      </div>
    </div>`;
  };

  // ------------------------------------------------------------------ Pièce (document sur papier)
  // doc : { title, caption:{court,left,right}, to, paras:[[seg…]], sigs:[{qui,t,flag}], signed, kind } ; seg : string | {t, f, flag, paire}
  // Rien ne trahit un drapeau : seuls les passages notés, surlignés ou relevés par le joueur sont marqués.
  UI.Paper = ({ doc, cs, interactive, onSeg, kind, compact }) => {
    if (!doc) return null;
    const caption = doc.caption;
    const noted = cs ? new Set(cs.notes.map((n) => n.text)) : new Set();
    const flagged = cs ? new Set(cs.issues.map((n) => n.text)) : new Set();
    const surl = cs ? new Set((cs.surl || []).map((h) => h.t)) : new Set();
    const k = doc.kind || kind;
    const segEl = (seg, j, inner) => {
      const t = typeof seg === "string" ? seg : seg.t;
      if (!t) return null;
      if (!interactive) return html`<span key=${j}>${inner || t}</span>`;
      const tt = t.trim();
      return html`<span key=${j} className=${UI.cx("seg", noted.has(tt) && "seg-noted", surl.has(tt) && "seg-surl", flagged.has(tt) && "seg-flagged")} onClick=${(e) => onSeg && onSeg(seg, e)} tabIndex="0" onKeyDown=${(e) => { if (e.key === "Enter") onSeg && onSeg(seg, e); }}>${inner || t}</span>`;
    };
    // pièce composée par le moteur de documents (docs.js) : bandeau du service, styles de paragraphe, feuillets signés
    const B = doc.bandeau, PS = doc.pstyle;
    const signes = doc.numerique ? [] : (doc.sigs || []).map((g) => g.qui); // en numérique, une signature unique en fin d'acte
    const pied = (txt, key) => html`<div key=${key} className="pv-feuillet"><span className="pv-f-n">${txt}</span>${signes.map((q, i) => html`<span key=${i} className="pv-f-sig">${q}</span>`)}</div>`;
    return html`<article className=${UI.cx("paper", k && "paper-" + k, compact && "paper-compact", doc.trame && "paper-trame")}>
      ${B && html`<div className="pv-bandeau">
        <div className="pv-b-service">${B.service}${B.unite && html`<br />${B.unite}`}</div>
        <div className="pv-b-cadre">${B.cadre}</div>
        <div className="pv-b-titre">${B.titre}${B.qualite && html`<div className="pv-b-qualite">${B.qualite}</div>`}</div>
        <div className="pv-b-grille">${B.grille.map(([l, v], i) => html`<span key=${i}><em>${l}</em>${v}</span>`)}</div>
      </div>`}
      ${doc.entete && !B && html`<div className="paper-entete">${doc.entete.map((l, i) => html`<div key=${i}>${l}</div>`)}</div>`}
      ${caption && (caption.court || caption.left || caption.right) && html`<div className="caption">
        ${caption.court && html`<div className="cap-court">${caption.court}</div>`}
        ${(caption.left || caption.right) && html`<div className="cap-box"><div className="cap-left">${caption.left}</div><div className="cap-right">${caption.right}</div></div>`}
      </div>`}
      ${doc.title && !B && html`<h3 className="paper-title">${doc.title}</h3>`}
      ${doc.video && !compact && UI.VideoExtrait && html`<${UI.VideoExtrait} spec=${doc.video} />`}
      ${doc.capture && !compact && UI.CaptureSim && html`<${UI.CaptureSim} sig=${doc.capture.sig} />`}
      ${doc.to && html`<p className="paper-to">À : ${doc.to}</p>`}
      ${(doc.paras || []).map((p, i) => (PS && PS[i] === "saut" ? pied(p.map((x) => (typeof x === "string" ? x : x.t)).join(""), i) : html`<p key=${i} className=${PS && PS[i] ? "pp-" + PS[i] : null}>${p.map((seg, j) => segEl(seg, j))}</p>`))}
      ${doc.schema && doc.schema.length && !compact && UI.SchemaCorporel && html`<${UI.SchemaCorporel} lesions=${doc.schema} />`}
      ${B && doc.feuillets > 1 && pied(`Feuillet ${doc.feuillets} / ${doc.feuillets}`, "fin")}
      ${doc.sigs && doc.sigs.length > 0 && html`<div className="paper-sigs">${doc.sigs.map((g, i) => {
        const shown = g.t === "signé" ? "(signature)" : g.t || "—";
        const seg = { t: `Signature — ${g.qui} : ${g.t === "signé" ? "signée" : g.t || "aucune"}`, flag: g.flag, f: g.f };
        return html`<div key=${"g" + i} className="psig"><span className="psig-qui">${g.qui}</span>${segEl(seg, "s" + i, html`<span className=${g.t === "signé" ? "psig-ok" : g.t ? "psig-txt" : "psig-vide"}>${shown}</span>`)}</div>`;
      })}</div>`}
      ${doc.signed && html`<p className="paper-sign">${doc.signed}</p>`}
      ${doc.tampon && html`<div className="tampon">${doc.tampon}</div>`}
    </article>`;
  };
  // Découpe les paragraphes en phrases cliquables
  UI.segmentize = function (paras) {
    return (paras || []).map((p) => {
      const out = [];
      for (const seg of p) {
        if (typeof seg !== "string") { out.push(seg); continue; }
        const parts = seg.match(/[^.!?;]+[.!?;…]*\s*/g) || [seg];
        for (const pt of parts) if (pt.trim()) out.push(pt);
      }
      return out;
    });
  };

  // ------------------------------------------------------------------ Carnet (grands carreaux Seyès) : le bloc-notes du dossier
  // Notes cliquées dans les pièces et les entretiens, et notes écrites par le joueur : classées (charge, décharge,
  // à vérifier, délai, question au client), reliées à une pièce ou à un texte, datées pour la frise des faits.
  const SRC_GLYPH = { call: "☎", doc: "§", court: "⚖", gav: "⌂", perso: "✎" };
  const SRC_LABEL = { call: "Entretien ou appel", doc: "Pièce", court: "Audience", gav: "Garde à vue", perso: "Note écrite" };
  const fmtQuand = (n) => (n.quand != null ? CR.fmtDate(n.quand, "short") + (n.heure != null ? " · " + CR.fmtTime(n.heure) : "") : "");
  const linkLabel = (s, cs, l, hide) => {
    if (!l) return "";
    if (l.k === "doc") { const d = cs.docs.find((x) => x.id === l.id); return d ? "§ " + d.title : ""; }
    const x = CR.lib(l.id);
    return x ? (hide && CR.refOfId(l.id) && CR.saisieOn(s) ? "Texte : " + x.titre : x.cite.replace(/^Art\./, "art.")) : "";
  };
  UI.noteLink = linkLabel;
  UI.Carnet = ({ s: sP, cs, onPick, pickable, selected, filter, title, full, hide, onOpenLink }) => {
    const s = sP || CR.store.s;
    const [cat, setCat] = useState("all");
    const [sort, setSort] = useState("ajout");
    const [view, setView] = useState("liste");
    const [withProc, setWithProc] = useState(false);
    const [adding, setAdding] = useState(false);
    const [classing, setClassing] = useState(null);
    const [form, setForm] = useState({ text: "", cat: "", link: "", date: "", heure: "" });
    const base = cs.notes.filter((n) => !filter || filter(n));
    let notes = cat === "all" ? base : base.filter((n) => (cat === "none" ? !n.cat : n.cat === cat));
    const ci = (k) => { const i = CR.NOTE_CATS.findIndex((c) => c[0] === k); return i < 0 ? 99 : i; };
    if (sort === "faits") notes = notes.slice().sort((a, b) => (a.quand == null) - (b.quand == null) || (a.quand || 0) - (b.quand || 0) || (a.heure || 0) - (b.heure || 0));
    else if (sort === "cat") notes = notes.slice().sort((a, b) => ci(a.cat) - ci(b.cat));
    else if (sort === "src") notes = notes.slice().sort((a, b) => String(a.src).localeCompare(String(b.src)));
    else if (sort === "recent") notes = notes.slice().reverse();
    const pinned = CR.pinnedTexts && s ? CR.pinnedTexts(s, cs) : [];
    const add = () => {
      if (!form.text.trim()) return;
      const link = form.link ? { k: form.link.split(":")[0], id: form.link.slice(form.link.indexOf(":") + 1) } : null;
      const quand = form.date ? CR.parseISO(form.date) : null;
      let heure = null;
      if (form.heure) { const [h, m] = form.heure.split(":").map(Number); heure = h * 60 + m; }
      CR.addOwnNote(s, cs, { text: form.text, cat: form.cat || null, link, quand, heure });
      setForm({ text: "", cat: form.cat, link: "", date: "", heure: "" });
      setAdding(false);
      UI.bump();
    };
    const counts = {};
    for (const n of base) counts[n.cat || "none"] = (counts[n.cat || "none"] || 0) + 1;
    const frise = view === "frise" ? base.filter((n) => n.quand != null).map((n) => ({ day: n.quand, min: n.heure, text: n.text, cat: n.cat, id: n.id }))
      .concat(withProc && cs.proc ? (cs.proc.events || []).map((e, i) => ({ day: e.day, text: e.text, proc: true, id: "p" + i })) : [])
      .sort((a, b) => a.day - b.day || (a.min || 0) - (b.min || 0)) : [];
    return html`<div className=${UI.cx("carnet", full && "carnet-full")}>
      <div className="carnet-top"><span>${title || "Carnet"}</span><span className="carnet-count">${notes.length}${notes.length !== cs.notes.length ? " / " + cs.notes.length : ""}</span></div>
      <div className="carnet-tools">
        <div className="ncat-filter">
          ${[["all", "Toutes"]].concat(CR.NOTE_CATS, [["none", "Non classées"]]).map(([k, l]) => (k === "all" || counts[k] || cat === k) && html`<button key=${k} type="button" className=${UI.cx("nchip", "ncat-" + k, cat === k && "on")} onClick=${() => setCat(k)}>${l}${k !== "all" ? ` ${counts[k] || 0}` : ""}</button>`)}
        </div>
        <div className="carnet-tools-row">
          <select aria-label="Trier les notes" value=${sort} onChange=${(e) => setSort(e.target.value)}>
            <option value="ajout">Ordre de prise</option><option value="recent">Plus récentes d'abord</option><option value="faits">Date des faits</option><option value="cat">Catégorie</option><option value="src">Source</option>
          </select>
          <button type="button" className=${UI.cx("nchip", view === "frise" && "on")} onClick=${() => setView(view === "frise" ? "liste" : "frise")}>${view === "frise" ? "Liste" : "Frise des faits"}</button>
          <button type="button" className="nchip nadd" onClick=${() => setAdding(!adding)}>${adding ? "Fermer" : "✎ Écrire une note"}</button>
        </div>
      </div>
      ${adding && html`<div className="nform">
        <textarea rows="2" aria-label="Votre note" placeholder="Ce que vous retenez, ce qu'il faut vérifier, la question à poser…" value=${form.text} onChange=${(e) => setForm(Object.assign({}, form, { text: e.target.value }))}></textarea>
        <div className="nform-row">
          <select aria-label="Catégorie" value=${form.cat} onChange=${(e) => setForm(Object.assign({}, form, { cat: e.target.value }))}><option value="">Sans catégorie</option>${CR.NOTE_CATS.map(([k, l]) => html`<option key=${k} value=${k}>${l}</option>`)}</select>
          <select aria-label="Relier à une pièce ou un texte" value=${form.link} onChange=${(e) => setForm(Object.assign({}, form, { link: e.target.value }))}>
            <option value="">Reliée à… (rien)</option>
            ${cs.docs.length > 0 && html`<optgroup label="Pièces">${cs.docs.map((d) => html`<option key=${d.id} value=${"doc:" + d.id}>${d.title}</option>`)}</optgroup>`}
            ${pinned.length > 0 && html`<optgroup label="Textes du dossier">${pinned.map((id) => { const l = CR.lib(id); return html`<option key=${id} value=${"texte:" + id}>${hide && CR.saisieOn(s) && CR.refOfId(id) ? l.titre : l.cite}</option>`; })}</optgroup>`}
          </select>
        </div>
        <div className="nform-row">
          <label className="small">Date des faits <input type="date" value=${form.date} onChange=${(e) => setForm(Object.assign({}, form, { date: e.target.value }))} /></label>
          <label className="small">Heure <input type="time" value=${form.heure} onChange=${(e) => setForm(Object.assign({}, form, { heure: e.target.value }))} /></label>
          <${UI.Btn} small kind="primary" onClick=${add} disabled=${!form.text.trim()}>Ajouter</${UI.Btn}>
        </div>
      </div>`}
      ${view === "frise" ? html`<div className="frise-wrap">
          <label className="check small frise-proc"><input type="checkbox" checked=${withProc} onChange=${(e) => setWithProc(e.target.checked)} /> Avec les actes de procédure</label>
          ${frise.length === 0 ? html`<p className="carnet-empty small">Aucune note datée. Donnez une date des faits à vos notes (« Écrire une note », ou « dater » sur une ligne).</p>` : html`<ol className="frise">${frise.map((f) => html`<li key=${f.id} className=${UI.cx("frise-item", f.proc && "frise-proc-item", f.cat && "ncat-" + f.cat)}><span className="frise-date">${CR.fmtDate(f.day, "short")}${f.min != null ? html`<br />${CR.fmtTime(f.min)}` : ""}</span><span className="frise-txt">${f.text}</span></li>`)}</ol>`}
        </div>` : html`<ul className="carnet-lines">
        ${notes.length === 0 && html`<li className="carnet-empty">${cs.notes.length ? "Aucune note dans ce classement." : "Rien de noté pour l'instant."}</li>`}
        ${notes.map((n) => html`<li key=${n.id} className=${UI.cx("carnet-line", pickable && "carnet-pick", selected === n.id && "carnet-sel")} onClick=${() => pickable && onPick && onPick(n)} tabIndex=${pickable ? 0 : -1} onKeyDown=${(e) => { if (pickable && e.key === "Enter") onPick && onPick(n); }}>
          <span className="carnet-src" title=${SRC_LABEL[n.src] || "Note"}>${SRC_GLYPH[n.src] || "•"}</span>${n.cat && html`<span className=${"ncat ncat-" + n.cat}>${CR.noteCatLabel(n.cat)}</span>`}${n.text}
          ${(n.quand != null || n.link) && html`<span className="nmeta">${fmtQuand(n)}${n.quand != null && n.link ? " · " : ""}${n.link && html`<button type="button" className="nlink" onClick=${(e) => { e.stopPropagation(); onOpenLink && onOpenLink(n.link); }}>${linkLabel(s, cs, n.link, hide)}</button>`}</span>`}
          <span className="nactions"><button type="button" className="nact" onClick=${(e) => { e.stopPropagation(); setClassing(classing === n.id ? null : n.id); }}>${classing === n.id ? "fermer" : "classer"}</button>${full && n.own && html`<button type="button" className="nact" onClick=${(e) => { e.stopPropagation(); CR.removeNote(cs, n.id); UI.bump(); }}>effacer</button>`}</span>
          ${classing === n.id && html`<span className="nclass" onClick=${(e) => e.stopPropagation()}>
            ${CR.NOTE_CATS.map(([k, l]) => html`<button type="button" key=${k} className=${UI.cx("nchip", "ncat-" + k, n.cat === k && "on")} onClick=${() => { CR.setNote(cs, n.id, { cat: n.cat === k ? null : k }); UI.bump(); }}>${l}</button>`)}
            <label className="small">Date des faits <input type="date" value=${n.quand != null ? CR.fmtDate(n.quand, "iso") : ""} onChange=${(e) => { CR.setNote(cs, n.id, { quand: e.target.value ? CR.parseISO(e.target.value) : null }); UI.bump(); }} /></label>
            <select aria-label="Relier" value=${n.link ? n.link.k + ":" + n.link.id : ""} onChange=${(e) => { const v = e.target.value; CR.setNote(cs, n.id, { link: v ? { k: v.split(":")[0], id: v.slice(v.indexOf(":") + 1) } : null }); UI.bump(); }}>
              <option value="">Reliée à… (rien)</option>
              ${cs.docs.map((d) => html`<option key=${d.id} value=${"doc:" + d.id}>§ ${d.title}</option>`)}
              ${pinned.map((id) => { const l = CR.lib(id); return html`<option key=${id} value=${"texte:" + id}>${hide && CR.saisieOn(s) && CR.refOfId(id) ? l.titre : l.cite}</option>`; })}
            </select>
          </span>`}
        </li>`)}
      </ul>`}
    </div>`;
  };

  // ------------------------------------------------------------------ Textes enregistrés dans le dossier (n° 8)
  // hide : pendant la rédaction et l'audience, en saisie, le numéro de l'article est caché (on le tape de mémoire)
  UI.TextesList = ({ s, cs, ids, hide, onRemove }) => html`<ul className="tx-list">
    ${ids.length === 0 && html`<li className="tx-empty small muted">Aucun texte enregistré dans ce dossier. Bibliothèque : « Enregistrer dans ce dossier ». Au procès, seuls ces textes sont à portée de main.</li>`}
    ${ids.map((id) => { const l = CR.lib(id); if (!l) return null; const h = hide && CR.saisieOn(s) && CR.refOfId(id); return html`<li key=${id} className="tx">
      <details><summary><strong>${h ? l.titre : l.cite}</strong>${h ? html` <span className="small muted">— numéro à citer de mémoire</span>` : html` <span className="small muted">— ${l.titre}</span>`}</summary>
        <p className="tx-body">${l.texte}</p>
        <p className="small muted">${l.etat === "resume" ? "Règle résumée : texte récemment modifié." : "À revérifier sur Légifrance."}${cs.pinDays && cs.pinDays[id] != null ? ` Enregistré le ${CR.fmtDate(cs.pinDays[id], "short")}.` : ""}</p>
        ${onRemove && html`<button type="button" className="link small" onClick=${() => onRemove(id)}>Retirer du dossier</button>`}
      </details></li>`; })}
  </ul>`;
  // Le dossier à portée de main pendant les entretiens, la rédaction et l'audience : carnet et textes
  // Écran étroit (téléphone en vertical) : suit la largeur de la fenêtre
  const NARROW = "(max-width: 760px)";
  UI.useNarrow = () => {
    const mq = () => !!(window.matchMedia && window.matchMedia(NARROW).matches);
    const [n, setN] = useState(mq);
    useEffect(() => {
      if (!window.matchMedia) return;
      const m = window.matchMedia(NARROW), on = () => setN(m.matches);
      if (m.addEventListener) m.addEventListener("change", on); else if (m.addListener) m.addListener(on);
      return () => { if (m.removeEventListener) m.removeEventListener("change", on); else if (m.removeListener) m.removeListener(on); };
    }, []);
    return n;
  };
  UI.DossierSide = ({ s, cs, ctx, title }) => {
    const [tab, setTab] = useState("carnet");
    const [open, setOpen] = useState(false);
    const narrow = UI.useNarrow();
    const ids = CR.pinnedTexts(s, cs);
    const hide = ctx === "redaction" || ctx === "audience";
    const body = html`<div className="dside">
      <div className="dside-tabs" role="tablist">
        <button type="button" role="tab" aria-selected=${tab === "carnet"} className=${UI.cx("dtab", tab === "carnet" && "on")} onClick=${() => setTab("carnet")}>Carnet · ${cs.notes.length}</button>
        <button type="button" role="tab" aria-selected=${tab === "textes"} className=${UI.cx("dtab", tab === "textes" && "on")} onClick=${() => setTab("textes")}>Textes · ${ids.length}</button>
      </div>
      ${tab === "carnet" ? html`<${UI.Carnet} s=${s} cs=${cs} title=${title || "Carnet"} hide=${hide} />` : html`<${UI.TextesList} s=${s} cs=${cs} ids=${ids} hide=${hide} />`}
    </div>`;
    if (!narrow) return body;
    // téléphone : le carnet se range dans un panneau qui monte du bas de l'écran, ouvert par un bouton flottant
    return html`<div className="dside-mobile">
      <button type="button" className="dside-fab pix" aria-expanded=${open} onClick=${() => setOpen(!open)}>${UI.Icon ? html`<${UI.Icon} n="binder" />` : null}Carnet · ${cs.notes.length}</button>
      ${open && html`<div className="dside-backdrop" onClick=${() => setOpen(false)}></div>
        <div className="dside-sheet" role="dialog" aria-label="Carnet et textes du dossier">
          <div className="dside-sheet-head"><span className="pix">Votre dossier</span><button type="button" className="btn dside-close" onClick=${() => setOpen(false)}>Fermer</button></div>
          ${body}
        </div>`}
    </div>`;
  };

  // ------------------------------------------------------------------ Saisie d'un article (n° 11)
  // expect : références attendues ; onDone({ ref, g, attendu, tape? }) ; le mode (libre, assisté, examen) règle les secondes chances
  UI.CiteInput = ({ s, expect, onDone, onSkip, label }) => {
    const mode = CR.saisieMode(s);
    const ex = (expect || []).filter(Boolean);
    const [code, setCode] = useState((ex[0] && ex[0].code) || "CPP");
    const [txt, setTxt] = useState("");
    const [tries, setTries] = useState(0);
    const [msg, setMsg] = useState(null);
    const p = txt.trim() ? CR.parseCite(txt, code) : null;
    const ref = p && p.num ? { code: p.code, num: p.num } : null;
    const known = ref && (CR.articleConnu(ref) || ex.some((e) => CR.sameRef(e, ref)));
    const valider = () => {
      if (!ref) { setMsg({ tone: "warn", t: "Tapez un seul numéro d'article : 63-1, R. 625-1, 434-15 bis…" }); return; }
      if (!known) { setMsg({ tone: "warn", t: `L'${CR.citeLabel(ref)} n'existe pas dans la base du jeu : faute de frappe ? Corrigez, sans pénalité.` }); return; }
      const r = CR.gradeCite(ref, ex);
      if (mode === "examen" || r.g === "ok") { onDone({ ref, g: r.g, attendu: r.attendu }); return; }
      const n = tries + 1;
      setTries(n);
      setTxt("");
      if (mode === "assiste") {
        if (n >= 2) { onDone({ ref: ex[0], tape: ref, g: "aide", attendu: ex[0] }); return; }
        setMsg({ tone: "bad", t: `Ce n'est pas le bon article (${CR.CITE_LABEL[r.g].toLowerCase()}). ${CR.citeIndice(ex[0])}` });
      } else {
        if (n >= 3) { onDone({ ref, g: r.g, attendu: r.attendu }); return; }
        setMsg({ tone: "bad", t: `Ce n'est pas le bon article. Essai ${n + 1} sur 3.` });
      }
    };
    return html`<div className="cite-in">
      ${label && html`<span className="pix">${label}</span>`}
      <div className="cite-row">
        <select aria-label="Code" value=${code} onChange=${(e) => setCode(e.target.value)}>${CR.CODES.map((c) => html`<option key=${c.id} value=${c.id}>${c.court}</option>`)}</select>
        <span className="cite-art">art.</span>
        <input type="text" className="cite-num" aria-label="Numéro d'article" placeholder="n°" value=${txt} autoComplete="off" spellCheck=${false} onChange=${(e) => { setTxt(e.target.value); setMsg(null); }} onKeyDown=${(e) => { if (e.key === "Enter") { e.preventDefault(); valider(); } }} />
        <${UI.Btn} small kind="primary" onClick=${valider}>Citer</${UI.Btn}>
      </div>
      <p className="cite-compris small">${ref ? html`Compris : <strong>${CR.citeLabel(ref)}</strong>${p.codeTape && p.code !== code ? " (code tapé)" : ""}` : p && p.illisible ? "Illisible : un seul numéro, par exemple 63-1 ou R. 625-1." : "Le code se choisit dans le menu ; seul le numéro se tape."}</p>
      ${msg && html`<p className=${"small cite-msg cite-" + msg.tone}>${msg.t}</p>`}
      <span className="cite-foot small muted">${{ assiste: "Mode assisté", libre: "Mode libre", examen: "Mode examen : une seule réponse" }[mode]}${onSkip ? html` · <button type="button" className="link small" onClick=${onSkip}>ne pas citer de texte</button>` : ""}</span>
    </div>`;
  };
  // Ce que le joueur a saisi, et le verdict quand le mode le montre
  UI.CiteDone = ({ s, r, onReset }) => {
    if (!r) return null;
    const exam = CR.saisieMode(s) === "examen";
    const shown = r.g === "aide" ? r.ref : r.ref;
    return html`<span className=${UI.cx("cite-done", !exam && "cite-g-" + r.g)}>${shown ? CR.citeLabel(shown, true) : "aucun article"}${!exam && r.g !== "ok" ? html` <span className="small">— ${CR.CITE_LABEL[r.g]}${r.g === "aide" && r.tape ? ` (vous aviez tapé ${CR.citeLabel(r.tape, true)})` : ""}</span>` : ""}${onReset && html` <button type="button" className="link small" onClick=${onReset}>changer</button>`}</span>`;
  };

  // ------------------------------------------------------------------ Petits composants
  UI.Btn = ({ children, onClick, kind, disabled, title, small, icon, type }) => html`<button type=${type || "button"} className=${UI.cx("btn", kind && "btn-" + kind, small && "btn-sm")} onClick=${onClick} disabled=${disabled} title=${title || ""}>${icon && html`<${UI.Icon} n=${icon} />`}${children}</button>`;
  UI.Tag = ({ children, tone, title }) => html`<span className=${UI.cx("tag", tone && "tag-" + tone)} title=${title || ""}>${children}</span>`;
  UI.Empty = ({ children }) => html`<div className="empty">${children}</div>`;
  UI.Section = ({ title, children, right }) => html`<section className="sec"><div className="sec-head"><h3>${title}</h3>${right}</div>${children}</section>`;

  // ------------------------------------------------------------------ Le mentor explique, à la première rencontre
  UI.Coach = ({ k, s }) => {
    const st = s || CR.store.s;
    const txt = CR.COACH && CR.COACH[k];
    if (!st || !txt || !st.settings.coach || (st.seen && st.seen[k])) return null;
    return html`<div className="coach" role="note">
      <${UI.Portrait} look=${Object.assign({}, CR.px.lookFrom("mentor", CR.MENTOR.look), CR.MENTOR.look)} size=${44} blink=${false} />
      <div className="coach-body"><span className="pix">${CR.MENTOR.nom}</span><p>${txt}</p>
        <div className="coach-btns"><${UI.Btn} small onClick=${() => { st.seen[k] = true; UI.bump(); }}>Compris</${UI.Btn}><button className="link small" onClick=${() => { st.settings.coach = false; UI.bump(); }}>Ne plus afficher les conseils</button></div>
      </div>
    </div>`;
  };

  UI.timeOfDay = (min) => (min < 6 * 60 ? "Nuit" : min < 12 * 60 ? "Matin" : min < 18 * 60 ? "Après-midi" : min < 21 * 60 ? "Soir" : "Nuit");
  UI.relDay = (s, d) => (d === s.day ? "Aujourd'hui" : d === s.day + 1 ? "Demain" : d === s.day - 1 ? "Hier" : CR.fmtDate(d, "short"));
})();
