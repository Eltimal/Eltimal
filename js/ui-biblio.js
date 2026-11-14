/* La Permanence — la bibliothèque en code annoté (9 novembre 2026).
   Remplace UI.LibraryPanel de ui-desk.js. Onglets : Plan des codes, Index, Jurisprudence, Code du jeu (actes,
   irrégularités). Les données sont dans code-annote.js. Lire un article ou un arrêt prend du temps et l'enregistre
   dans le dossier ouvert, comme avant ; feuilleter le plan et l'index est gratuit. */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html, Btn, Tag, cx } = UI;
  const { useState, useMemo, useEffect } = React;
  const bump = () => CR.store.bump();

  CR.COACH = CR.COACH || {};
  CR.COACH.bibliotheque = "La bibliothèque est rangée comme un code annoté : le plan officiel de chaque code, les articles à leur place et, sous chaque article, les arrêts qui l'appliquent, numérotés par thème. L'index renvoie d'un mot-clé à l'article et à la note ; le recueil classe tous les arrêts. Feuilleter est gratuit ; lire un texte ou un arrêt prend du temps et l'enregistre dans le dossier ouvert. Un arrêt peut avoir été abandonné depuis : lisez les plus récents.";

  // Où chercher pour une irrégularité relevée dans une pièce : la grande division, jamais l'article (CR.planFocus)
  CR.planFocus = function (cs) {
    const txt = ((cs && cs.issues) || []).map((i) => `${i.text} ${(i.ref && i.ref.titre) || ""}`).join(" ").toLowerCase();
    const cpp = (path) => { const n = CR.CODES_PLAN.find((c) => c.id === "CPP").parties[0].noeuds; let cur = null, arr = n; for (const i of path) { cur = arr[i]; arr = cur.c; } return cur && cur.key; };
    if (/géolocalisation|bornage|téléphon|réquisition|opérateur/.test(txt)) return cpp([1, 3]);
    if (/citation|convocation|audience/.test(txt)) return cpp([2, 3]);
    if (/éthylo|alcool|souffl/.test(txt)) { const r = CR.CODES_PLAN.find((c) => c.id === "CR"); return r.parties[0].noeuds[0].c[2].key; }
    if (/interrogatoire|juge d'instruction|mise en examen|jld/.test(txt)) return cpp([1, 2]);
    return cpp([1, 1]);
  };

  const fmtTemps = (m) => CR.fmtDuration(m);
  const jpTags = (s, j) => html`${j.pub ? html`<${Tag} tone="ok">${CR.PUB_LABEL[j.pub] || j.pub}</${Tag}>` : html`<${Tag} title="Publication non vérifiée">Publication ?</${Tag}>`}${j.solution ? html` <${Tag}>${j.solution}</${Tag}>` : null}${CR.jpDepasseConnu(s, j.id) ? html` <${Tag} tone="bad" title=${"Solution dépassée : " + j.depasse.sur}>Solution dépassée</${Tag}>` : null}`;

  // Enregistrement dans un dossier (lu → enregistrer, retirer, ou choisir un dossier)
  function Pin({ s, here, id, openCases, pin }) {
    return html`<div className="lib-pin">
      ${here && (here.cards.includes(id) ? html`<${Tag} tone="ok">Dans ce dossier</${Tag}> <button className="link small" onClick=${() => { CR.unpinText(s, here, id); bump(); }}>retirer</button>` : html`<${Btn} small icon="plus" onClick=${() => pin(here.id, id)}>Enregistrer dans ce dossier</${Btn}>`)}
      ${!here && openCases.some((c) => !c.cards.includes(id)) && html`<select aria-label="Enregistrer dans un dossier" value="" onChange=${(ev) => ev.target.value && pin(ev.target.value, id)}><option value="">Enregistrer dans un dossier…</option>${openCases.filter((c) => !c.cards.includes(id)).map((c) => html`<option key=${c.id} value=${c.id}>${CR.caseTitle(s, c)}</option>`)}</select>`}
      ${openCases.filter((c) => c.cards.includes(id) && c !== here).map((c) => html`<${Tag} key=${c.id} title="Enregistré dans ce dossier">${CR.clientName(c) || CR.caseTitle(s, c)}</${Tag}>`)}
    </div>`;
  }

  // Une note sous un article, ou la fiche d'un arrêt dans le recueil
  function NoteJP({ s, id, n, read, here, openCases, pin, hl, goArt, full }) {
    const j = CR.JP[id];
    const l = CR.lib(id);
    if (!j || !l) return null;
    const known = s.researched.includes(id);
    return html`<li className=${cx("jp-note", known && "known", hl === id && "hl")} id=${"jp-" + id}>
      <div className="jp-head">${n != null ? html`<span className="jp-n">${n}.</span>` : null}<strong>${CR.jpCite(id)}</strong></div>
      <div className="jp-tags">${jpTags(s, j)}</div>
      <div className="jp-titrage small">${j.titrage.join(" — ")}</div>
      ${known ? html`<div className="jp-body">
        <p className="lib-text">${j.sommaire}</p>
        ${j.visas && j.visas.length ? html`<p className="small muted">Visas : ${j.visas.join(" ; ")}</p>` : null}
        ${j.portee ? html`<p className="small"><strong>Portée.</strong> ${j.portee}</p>` : null}
        ${CR.jpDepasseConnu(s, id) ? html`<p className="small jp-warn"><strong>Attention.</strong> Solution dépassée sur ${j.depasse.sur}${j.depasse.par ? ` (${CR.jpCite(j.depasse.par)})` : j.depasse.loi ? ` (${j.depasse.loi})` : ""}. La citer à l'audience sans le dire vous coûtera votre crédit.</p>` : null}
        ${full && j.articles.length ? html`<p className="small">Annoté sous : ${j.articles.filter((a) => CR.lib(a)).map((a, i) => html`${i ? ", " : ""}<button className="link small" onClick=${() => goArt(a, id)}>${CR.lib(a).cite}${CR.noteNum(a, id) ? `, note ${CR.noteNum(a, id)}` : ""}</button>`)}</p>` : null}
        <p className="small muted jp-verif">${CR.VERIF_LABEL[j.verif.niveau] || ""} le ${j.verif.le} : ${j.verif.src}. Texte intégral à lire sur Judilibre avant tout usage réel.</p>
        <${Pin} s=${s} here=${here} id=${id} openCases=${openCases} pin=${pin} />
      </div>` : html`<${Btn} small icon="library" onClick=${() => read(l)}>Lire l'arrêt · ${fmtTemps(l.temps)}${here ? " · dans ce dossier" : ""}</${Btn}>`}
    </li>`;
  }

  // Un article : texte, enregistrement, notes de jurisprudence groupées par thème
  function Article({ s, id, read, here, openCases, pin, hl, goArt, back }) {
    useEffect(() => { if (hl) { const el = document.getElementById("jp-" + hl); if (el && el.scrollIntoView) el.scrollIntoView({ block: "center" }); } }, [hl, id]);
    const e = CR.lib(id);
    if (!e) return null;
    const known = s.researched.includes(id);
    const r = CR.planOf(id);
    const notes = CR.notesOf(id);
    const themes = [];
    for (const x of notes) if (!themes.includes(x.theme)) themes.push(x.theme);
    return html`<div className="ca-art">
      <button className="link small" onClick=${back}>← Retour au plan</button>
      ${r ? html`<p className="ca-chemin small muted">${[r.code.nom].concat(r.partie && r.partie.nom ? [r.partie.nom] : [], (r.node ? r.node.path : []).map((n) => (n.t ? n.t + " : " : "") + n.h)).join(" › ")}</p>` : null}
      <div className=${cx("lib-item", known && "known")}>
        <div className="lib-cite"><strong>${e.cite}</strong> ${CR.article(id) && CR.article(id).officiel ? html`<${Tag} title="Texte intégral généré depuis Légifrance (codes.droit.org)">Texte officiel</${Tag}>` : e.etat === "resume" ? html`<${Tag} tone="warn" title="Texte récemment modifié : seule la règle est résumée">Résumé</${Tag}>` : html`<${Tag} title="Reproduction faite hors ligne">À revérifier sur Légifrance</${Tag}>`}</div>
        <div className="lib-title">${e.titre}</div>
        ${known ? (() => { const a = CR.article(id); return a && a.officiel ? html`<div className="lib-text">${a.alineas.map((x, i) => html`<p key=${i} className="lib-al">${x}</p>`)}<p className="small muted">Texte officiel en vigueur au ${CR.dateCode(a.maj)}.${e.etat === "resume" ? html` <b>En bref :</b> ${e.texte}` : ""}</p></div>` : html`<p className="lib-text">${e.texte}</p>`; })() : html`<${Btn} small icon="library" onClick=${() => read(e)}>Lire et extraire · ${fmtTemps(e.temps)}${here ? " · dans ce dossier" : ""}</${Btn}>`}
        ${known && html`<${Pin} s=${s} here=${here} id=${id} openCases=${openCases} pin=${pin} />`}
      </div>
      <div className="sub-head">Jurisprudence sous l'article${notes.length ? ` (${notes.length})` : ""}</div>
      ${notes.length === 0 ? html`<p className="small muted">Aucun arrêt n'est annoté sous cet article dans la bibliothèque du jeu.</p>` : themes.map((th, i) => html`<div key=${th} className="ca-theme">
        <div className="ca-theme-h">${["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][i] || i + 1}. ${th}</div>
        <ul className="lib-list">${notes.filter((x) => x.theme === th).map((x) => html`<${NoteJP} key=${x.jp} s=${s} id=${x.jp} n=${x.n} read=${read} here=${here} openCases=${openCases} pin=${pin} hl=${hl} goArt=${goArt} />`)}</ul>
      </div>`)}
    </div>`;
  }

  // Une division du plan : intitulé officiel, plage d'articles, textes rangés là, divisions inférieures
  function Noeud({ s, n, open, toggle, goArt, depth }) {
    const vide = !n.nTextes;
    const isOpen = open.has(n.key);
    const r = CR.planRange(n);
    return html`<li className=${cx("pl-node", vide && "pl-vide", "pl-d" + Math.min(depth, 4))}>
      <button type="button" className="pl-row" aria-expanded=${isOpen} onClick=${() => toggle(n.key)}>
        <span className="pl-caret">${n.c.length || n.arts.length ? (isOpen ? "▾" : "▸") : "·"}</span>
        <span className="pl-h">${n.t ? html`<strong>${n.t}</strong> : ` : null}${n.h}</span>
        <span className="pl-meta small">${r}${n.nTextes ? ` · ${CR.plural(n.nTextes, "texte")}` : ""}${n.nArrets ? ` · ${CR.plural(n.nArrets, "arrêt")}` : ""}</span>
      </button>
      ${isOpen && html`<div className="pl-in">
        ${n.arts.length > 0 && html`<ul className="pl-arts">${n.arts.map((id) => { const e = CR.lib(id); const nj = CR.notesOf(id).length; return html`<li key=${id}><button type="button" className=${cx("pl-art", s.researched.includes(id) && "known")} onClick=${() => goArt(id)}><strong>${e.cite.replace(/ du code.*| de la loi.*| du décret.*| du règlement.*/, "")}</strong> ${e.titre}${nj ? html` <span className="pl-jp" title="Arrêts annotés sous l'article">${nj} ${nj > 1 ? "notes" : "note"}</span>` : null}</button></li>`; })}</ul>`}
        ${n.c.length > 0 && html`<ul className="pl-list">${n.c.filter((c) => !(c.tous && !c.nTextes)).map((c) => html`<${Noeud} key=${c.key} s=${s} n=${c} open=${open} toggle=${toggle} goArt=${goArt} depth=${depth + 1} />`)}</ul>`}
        ${vide && html`<p className="small muted pl-none">Aucun texte dans la bibliothèque.</p>`}
      </div>`}
    </li>`;
  }

  UI.LibraryPanel = ({ s, go, area, caseId, focus }) => {
    const [tab, setTab] = useState("plan");
    const [sel, setSel] = useState(null);
    const [hl, setHl] = useState(null);
    const [q, setQ] = useState("");
    const [iq, setIq] = useState("");
    const [rq, setRq] = useState("");
    const [f, setF] = useState({ jur: "all", per: "all", sol: "all", pub: "all" });
    const [open, setOpen] = useState(() => {
      const o = new Set();
      const n = focus && CR.planNode(focus);
      if (n) { o.add(n.code + "-code"); for (const p of n.path) o.add(p.key); }
      return o;
    });
    const toggle = (k) => { const o = new Set(open); if (o.has(k)) o.delete(k); else o.add(k); setOpen(o); };
    const openCases = s.order.map((id) => s.cases[id]).filter((c) => c && ["active", "prospect"].includes(c.status));
    const here = caseId && s.cases[caseId] ? s.cases[caseId] : null;
    const read = (e) => {
      CR.spend(s, e.temps, "research");
      if (!s.researched.includes(e.id)) s.researched.push(e.id);
      if (here) CR.pinText(s, here, e.id);
      bump();
    };
    const pin = (cid, id) => { const c = s.cases[cid]; if (!c) return; CR.pinText(s, c, id); CR.spend(s, 1, "desk", { fixed: true, caseId: cid }); CR.toast(s, `Enregistré dans le dossier ${CR.caseTitle(s, c)}.`, "info"); bump(); };
    const goArt = (id, jp) => { setTab("plan"); setSel(id); setHl(jp || null); };
    const index = useMemo(() => CR.indexAnalytique(), []);

    const recherche = q.trim() ? CR.LIB.filter((e) => !CR.estJP(e.id)).map((e) => CR.lib(e.id)).filter((e) => (e.cite + " " + e.titre + " " + (s.researched.includes(e.id) ? e.texte : "")).toLowerCase().includes(q.trim().toLowerCase())) : null;

    const planTab = html`<div className="ca-plan">
      ${sel ? html`<${Article} s=${s} id=${sel} read=${read} here=${here} openCases=${openCases} pin=${pin} hl=${hl} goArt=${goArt} back=${() => { setSel(null); setHl(null); }} />` : html`<div>
        <div className="lib-head"><input type="search" id="lib-q" placeholder="Chercher un article par son numéro ou un mot de son titre (63-1, perquisition…)" value=${q} onChange=${(e) => setQ(e.target.value)} aria-label="Chercher dans les codes" /></div>
        ${recherche ? html`<ul className="lib-list">${recherche.length === 0 && html`<li className="small muted">Rien trouvé. Essayez l'index, ou un autre mot.</li>`}${recherche.map((e) => html`<li key=${e.id}><button type="button" className=${cx("pl-art", s.researched.includes(e.id) && "known")} onClick=${() => goArt(e.id)}><strong>${e.cite}</strong> ${e.titre}<span className="small muted pl-path">${CR.planChemin(e.id, true)}</span></button></li>`)}</ul>` : html`<ul className="pl-list pl-codes">
          ${CR.CODES_PLAN.filter((c) => c.nTextes || !c.hors).map((c) => { const k = c.id + "-code"; const isOpen = open.has(k); return html`<li key=${c.id} className=${cx("pl-code", !c.nTextes && "pl-vide")}>
            <button type="button" className="pl-row pl-coderow" aria-expanded=${isOpen} onClick=${() => toggle(k)}><span className="pl-caret">${isOpen ? "▾" : "▸"}</span><span className="pl-h"><strong>${c.nom}</strong></span><span className="pl-meta small">${CR.plural(c.nTextes, "texte")}</span></button>
            ${isOpen && html`<div className="pl-in">${c.note ? html`<p className="small muted">${c.note}</p>` : null}${c.parties.filter((p) => !c.integral || p.nTextes).map((p, i) => html`<div key=${i}>${c.parties.length > 1 && p.nom ? html`<div className="pl-partie">${p.nom}</div>` : null}
              ${p.arts.length > 0 && html`<ul className="pl-arts">${p.arts.map((id) => html`<li key=${id}><button type="button" className="pl-art" onClick=${() => goArt(id)}><strong>${CR.lib(id).cite}</strong> ${CR.lib(id).titre}</button></li>`)}</ul>`}
              <ul className="pl-list">${p.noeuds.filter((n) => !c.integral || n.nTextes).map((n) => html`<${Noeud} key=${n.key} s=${s} n=${n} open=${open} toggle=${toggle} goArt=${goArt} depth=${0} />`)}</ul></div>`)}</div>`}
          </li>`; })}
        </ul>`}
        <p className="small muted ca-source">${CR.PLAN_SOURCE} Le mode liste ne montre que les divisions qui portent des fiches du jeu (le texte intégral se lit dans les codes reliés) ; ailleurs, les divisions grisées n'ont aucun texte dans la bibliothèque du jeu.</p>
      </div>`}
    </div>`;

    const lettres = [...new Set(index.map((x) => x.lettre))];
    const iqf = iq.trim().toLowerCase();
    const idx = iqf ? index.filter((x) => (x.mot + " " + x.refs.map((r) => r.sous).join(" ")).toLowerCase().includes(iqf)) : index;
    const refLabel = (r) => { const l = CR.lib(r.art); return `${l ? l.cite.replace(/^Art\. /, "art. ") : r.art}${r.note ? `, note ${r.note}` : ""}`; };
    const indexTab = html`<div className="ca-index">
      <div className="lib-head"><input type="search" placeholder="Chercher un mot-clé (garde à vue, prescription, nullités…)" value=${iq} onChange=${(e) => setIq(e.target.value)} aria-label="Chercher dans l'index" /></div>
      ${!iqf && html`<div className="ca-lettres">${lettres.map((l) => html`<a key=${l} href=${"#idx-" + l} onClick=${(ev) => { ev.preventDefault(); const el = document.getElementById("idx-" + l); if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" }); }}>${l}</a>`)}</div>`}
      <div className="ca-idx-list">${lettres.map((L) => { const rows = idx.filter((x) => x.lettre === L); return rows.length ? html`<div key=${L}><div className="ca-lettre" id=${"idx-" + L}>${L}</div><ul className="lib-list">${rows.map((x) => html`<li key=${x.mot} className="ca-entree"><strong>${x.mot}</strong>${x.refs.map((r, i) => html`<div key=${i} className="small ca-sous">${r.sous ? r.sous + " → " : "→ "}<button className="link small" onClick=${() => goArt(r.cible.art, r.cible.jp)}>${refLabel(r.cible)}</button></div>`)}</li>`)}</ul></div>` : null; })}</div>
    </div>`;

    const annee = (j) => +j.date.slice(0, 4);
    const PER = { all: "Toutes périodes", a: "Avant 2000", b: "2000 à 2014", c: "Depuis 2015" };
    const per = (j) => (annee(j) < 2000 ? "a" : annee(j) < 2015 ? "b" : "c");
    const sol = (j) => (!j.solution ? "nv" : /^Cassation/.test(j.solution) ? "cass" : /^Rejet/.test(j.solution) ? "rejet" : "autre");
    const pubOf = (j) => (j.pub ? "pub" : "nv");
    const rqf = rq.trim().toLowerCase();
    const arrets = Object.values(CR.JP).filter((j) => CR.lib(j.id)).filter((j) => (f.jur === "all" || j.jur === f.jur) && (f.per === "all" || per(j) === f.per) && (f.sol === "all" || sol(j) === f.sol) && (f.pub === "all" || pubOf(j) === f.pub)
      && (!rqf || `${CR.jpCite(j.id)} ${j.titre} ${j.titrage.join(" ")} ${s.researched.includes(j.id) ? j.sommaire : ""}`.toLowerCase().includes(rqf))).sort((a, b) => (a.date < b.date ? 1 : -1));
    const chips = (k, opts) => html`<div className="chips">${opts.map(([v, l]) => html`<button key=${v} className=${cx("chip", f[k] === v && "on")} onClick=${() => setF(Object.assign({}, f, { [k]: v }))}>${l}</button>`)}</div>`;
    const recueilTab = html`<div className="ca-recueil">
      <div className="lib-head"><input type="search" placeholder="Chercher un arrêt : n° de pourvoi, date, mot-clé…" value=${rq} onChange=${(e) => setRq(e.target.value)} aria-label="Chercher un arrêt" />
        ${chips("jur", [["all", "Toutes juridictions"], ["Cass. crim.", "Chambre criminelle"], ["Cass. ass. plén.", "Assemblée plénière"], ["Cons. const.", "Conseil constitutionnel"]])}
        ${chips("per", Object.entries(PER))}
        ${chips("sol", [["all", "Toutes solutions"], ["cass", "Cassation"], ["rejet", "Rejet"], ["autre", "Autre"], ["nv", "Non vérifiée"]])}
        ${chips("pub", [["all", "Publiés ou non"], ["pub", "Publiés"], ["nv", "Publication non vérifiée"]])}
      </div>
      <p className="small muted">${CR.plural(arrets.length, "arrêt")} · les plus récents d'abord.</p>
      <ul className="lib-list">${arrets.map((j) => html`<${NoteJP} key=${j.id} s=${s} id=${j.id} read=${read} here=${here} openCases=${openCases} pin=${pin} goArt=${goArt} full=${true} />`)}</ul>
    </div>`;

    const FicheActe = ({ a }) => html`<div className="fiche"><h4>${a.acte}</h4><table className="tbl"><tbody>
      ${[["Qui", a.qui], ["Où", a.ou], ["Conditions", a.conditions], ["Délai", a.delai], ["Suite", a.suite], ["Sanction", a.sanction], ["Qui l'invoque", a.invoque], ["Régularisation", a.regul], ["Article actuel", a.art], ["Article 2029", a.art2029 || "À remplir avec les tables de concordance"], ["Source et date", a.source]].map(([k, v]) => html`<tr key=${k}><td className="muted">${k}</td><td>${v}</td></tr>`)}
    </tbody></table></div>`;

    return html`<div className="panel library">
      <${UI.Coach} k="bibliotheque" s=${s} />
      <div className="tabs">${[["plan", "Plan des codes"], ["index", "Index"], ["recueil", "Jurisprudence"], ["actes", "Code du jeu : actes"], ["irreg", "Code du jeu : irrégularités"]].map(([k, l]) => html`<button key=${k} className=${cx("tab", tab === k && "on")} onClick=${() => setTab(k)}>${l}</button>`)}</div>
      ${["plan", "index", "recueil"].includes(tab) && html`<p className="small muted">La recherche prend du temps et de l'énergie. Un texte ou un arrêt lu s'enregistre dans un dossier${here ? ` (ici : ${CR.caseTitle(s, here)})` : ""} : il ne sert dans les actes et à l'audience que dans les dossiers où vous l'avez enregistré.</p>`}
      ${tab === "plan" && planTab}
      ${tab === "index" && indexTab}
      ${tab === "recueil" && recueilTab}
      ${tab === "actes" && html`<div className="fiches">${Object.values(CR.ACTES).map((a) => html`<${FicheActe} key=${a.id} a=${a} />`)}</div>`}
      ${tab === "irreg" && html`<div className="fiches">${Object.values(CR.IRREG).map((i) => html`<div key=${i.id} className="fiche"><h4>${i.label}</h4><p>${i.regle}</p><table className="tbl"><tbody>
        <tr><td className="muted">Sanction</td><td>${{ nullite: "Nullité" }[i.sanction] || i.sanction}</td></tr>
        <tr><td className="muted">Grief</td><td>${i.grief === "presume" ? "Présumé : l'irrégularité fait nécessairement grief" : i.grief === "prouver" ? "À démontrer (art. 802)" : "D'ordre public"}</td></tr>
        <tr><td className="muted">Effet</td><td>${i.effet}</td></tr>
        <tr><td className="muted">Régularisation</td><td>${i.regul ? "Possible" : "Non"}</td></tr>
        <tr><td className="muted">Textes</td><td>${i.textes.map((t, k) => html`${k ? " ; " : ""}${CR.lib(t) ? html`<button className="link small" onClick=${() => goArt(t)}>${(CR.TEXTES[t] || {}).cite || t}</button>` : (CR.TEXTES[t] || {}).cite || t}`)}</td></tr>
        <tr><td className="muted">Source et date</td><td className="small">${i.source}${i.aVerifier ? " — effet exact à vérifier avant saisie" : ""}</td></tr>
      </tbody></table></div>`)}</div>`}
    </div>`;
  };

  // ------------------------------------------------------------------ Saisie d'un arrêt à l'audience (mode saisie)
  UI.JPInput = ({ s, attendu, onDone, onSkip, label }) => {
    const mode = CR.saisieMode(s);
    const [txt, setTxt] = useState("");
    const [tries, setTries] = useState(0);
    const [msg, setMsg] = useState(null);
    const p = txt.trim() ? CR.parseJP(txt) : null;
    const valider = () => {
      if (!p || p.vide || p.illisible) { setMsg({ tone: "warn", t: "Tapez le numéro de pourvoi (22-80.895) ou la formation et la date (Crim. 6 mars 2024)." }); return; }
      if (p.ambigu) { setMsg({ tone: "warn", t: "Plusieurs arrêts ce jour-là : ajoutez le numéro de pourvoi." }); return; }
      if (p.inconnu) { setMsg({ tone: "warn", t: "Aucun arrêt de la bibliothèque ne correspond : faute de frappe ? Corrigez, sans pénalité." }); return; }
      const r = CR.gradeJP(p, attendu);
      if (mode === "examen" || r.g === "ok") { onDone({ id: p.id, g: r.g }); return; }
      const n = tries + 1;
      setTries(n); setTxt("");
      if (mode === "assiste") {
        if (n >= 2) { onDone({ id: attendu, tape: p.id, g: "aide" }); return; }
        setMsg({ tone: "bad", t: `Ce n'est pas cet arrêt. Indice : ${CR.JP[attendu].jur}, ${CR.jpDate(CR.JP[attendu]).replace(/^\S+ /, "")}.` });
      } else {
        if (n >= 3) { onDone({ id: p.id, g: r.g }); return; }
        setMsg({ tone: "bad", t: `Ce n'est pas cet arrêt. Essai ${n + 1} sur 3.` });
      }
    };
    return html`<div className="cite-in">
      ${label && html`<span className="pix">${label}</span>`}
      <div className="cite-row">
        <input type="text" className="cite-jp" aria-label="Référence de l'arrêt" placeholder="Crim. 6 mars 2024, n° 22-80.895" value=${txt} autoComplete="off" spellCheck=${false} onChange=${(e) => { setTxt(e.target.value); setMsg(null); }} onKeyDown=${(e) => { if (e.key === "Enter") { e.preventDefault(); valider(); } }} />
        <${Btn} small kind="primary" onClick=${valider}>Citer</${Btn}>
      </div>
      <p className="cite-compris small">${p && p.id ? html`Compris : <strong>${CR.jpCite(p.id)}</strong>` : "Formation, date et numéro de pourvoi, comme dans des conclusions."}</p>
      ${msg && html`<p className=${"small cite-msg cite-" + msg.tone}>${msg.t}</p>`}
      <span className="cite-foot small muted">${{ assiste: "Mode assisté", libre: "Mode libre", examen: "Mode examen : une seule réponse" }[mode]}${onSkip ? html` · <button type="button" className="link small" onClick=${onSkip}>ne pas citer</button>` : ""}</span>
    </div>`;
  };
})();
