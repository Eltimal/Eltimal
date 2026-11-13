/* La Permanence — assister en garde à vue ou en audition libre.
   Pièces consultables (art. 63-4-1), entretien de trente minutes (art. 63-4), audition sans intervention,
   questions à l'issue (art. 63-4-3), observations écrites, relecture du PV, issue décidée par le parquet. */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html, Icon, Portrait, Meter, Paper, Carnet, Btn, Tag, Empty, cx } = UI;
  const { useState, useEffect, useRef, useMemo } = React;
  const bump = () => CR.store.bump();
  const segText = (seg) => (typeof seg === "string" ? seg : seg.t);

  CR.applyFx = CR.applyFx || function (api, fx) {
    if (!fx) return;
    const { s, cs } = api;
    if (fx.trust) CR.trust(s, cs, fx.trust);
    if (fx.flags) Object.assign(cs.flags, fx.flags);
    if (fx.vars) Object.assign(cs.vars, fx.vars);
    if (fx.cards) fx.cards.forEach((c) => CR.addCard(cs, c));
    if (fx.rep) for (const [k, v] of Object.entries(fx.rep)) CR.rep(s, k, v);
  };

  UI.GavScene = ({ s, cs, onDone }) => {
    const def = CR.caseDef(cs);
    const G = useMemo(() => (typeof def.gav === "function" ? def.gav(CR.api(s, cs)) : def.gav), [cs.id]);
    const mode = G.mode || "gav";
    const api = CR.api(s, cs);
    const opj = api.actor("opj");
    const opjLook = opj ? CR.px.acteurLook(opj) : CR.px.lookFrom("opj", { outfit: "uniform" });
    const c = CR.client(cs);
    const look = CR.px.clientLook(c, cs.def);
    const need = { pieces: "pieces", entretien: "entretien", droits: "droits", questions: "questions", relecture: "relecture", audition: "audition" };
    const phases = (G.phases || (mode === "gav" ? ["arrivee", "pieces", "entretien", "conseil", "audition", "questions", "observations", "relecture", "issue"] : ["arrivee", "droits", "conseil", "audition", "questions", "observations", "relecture", "issue"])).filter((p) => !need[p] || G[need[p]]);
    const [pi, setPi] = useState(0);
    const parole = CR.PAROLE && CR.PAROLE.actif(s, G);
    if (parole && phases.includes("conseil")) phases.splice(phases.indexOf("conseil"), 1); // le conseil se donne pendant l'entretien
    const phase = phases[pi];
    const next = () => setPi((x) => Math.min(phases.length - 1, x + 1));
    const ctx = useRef({ conseil: null, questions: [], refus: [], observations: [], rectif: false, entretien: 0 }).current;
    const [, force] = useState(0);
    const rerender = () => force((x) => x + 1);
    useEffect(() => { if (!cs.flags.gavStarted) { cs.flags.gavStarted = s.day; s.stats.gav += mode === "gav" ? 1 : 0; } }, []);

    // la pièce suit l'étape : geôles à l'arrivée, local avocat pour l'entretien, bureau d'audition ensuite
    const gavMode = phase === "arrivee" ? (mode === "gav" ? "geole" : "bureau") : phase === "pieces" ? "pieces" : phase === "entretien" || phase === "conseil" ? "entretien" : phase === "issue" ? (mode === "gav" ? "issue" : "bureau") : "bureau";
    const roomOpts = { min: s.min, rain: CR.dec.rainy(s), season: CR.dec.seasonOf(s), gav: gavMode, gend: s.at === "gendarmerie", print: phase === "relecture", prefW: 210, clientExpr: phase === "entretien" || phase === "conseil" ? "worried" : phase === "issue" ? "soulage" : null, looks: { opj: opjLook, client: look, you: CR.youLook(s) } };
    roomOpts.sig = CR.dec.sigOf(roomOpts);
    // refonte : chaque étape se joue dans un plan plein cadre (CR.plans) ; les pièces à lire s'ouvrent en feuille à droite
    const planName = mode !== "gav" ? "audition" : phase === "entretien" || phase === "conseil" ? "entretien" : phase === "arrivee" || phase === "issue" ? "geoles" : "audition";
    if (UI.planOk && UI.planOk(planName)) {
      const pl = CR.placeOf && CR.placeOf(s, s.at), side = phase === "pieces" || phase === "relecture" || phase === "droits";
      const planOpts = { min: s.min, rain: CR.dec.rainy(s), look, opj: opjLook, expr: roomOpts.clientExpr || (phase === "audition" || phase === "questions" ? "worried" : "neutral"), you: CR.youLook(s), live: ctx, dehors: phase === "issue", print: phase === "relecture", gend: s.at === "gendarmerie" };
      const cap = planName === "entretien" ? "local avocat" : planName === "geoles" ? "les geôles" : "bureau d'audition";
      return html`<div className=${cx("scene gav-scene staged", side && "stg-side")}>
        <${UI.Plan} key=${planName} name=${planName} opts=${planOpts} />
        <div className="stg-top">
          <div className="stg-cap"><span className="pix">${mode === "gav" ? "Garde à vue" : "Audition libre"} · ${cap}</span><span className="stg-sub">${pl ? pl.nom + " · " : ""}${CR.fmtTime(s.min)}</span></div>
          <div className="gav-steps">${phases.map((p, i) => html`<span key=${p} className=${cx("gav-step", i === pi && "on", i < pi && "done")}>${STEP_LABEL[p]}</span>`)}</div>
        </div>
        <div className="gav-body">
          <div className="gav-main">
            <${UI.Coach} k="gav" s=${s} />
            ${phase === "arrivee" && html`<${Arrivee} s=${s} cs=${cs} G=${G} opj=${opj} mode=${mode} next=${next} />`}
            ${phase === "pieces" && html`<${Pieces} s=${s} cs=${cs} G=${G} next=${next} />`}
            ${phase === "droits" && html`<${Droits} s=${s} cs=${cs} G=${G} next=${next} />`}
            ${phase === "entretien" && html`<${parole ? UI.EntretienParole : Entretien} s=${s} cs=${cs} G=${G} ctx=${ctx} next=${next} />`}
            ${phase === "conseil" && html`<${Conseil} s=${s} cs=${cs} G=${G} ctx=${ctx} next=${next} />`}
            ${phase === "audition" && html`<${parole ? UI.AuditionParole : Audition} s=${s} cs=${cs} G=${G} ctx=${ctx} opj=${opj} next=${next} />`}
            ${phase === "questions" && html`<${parole ? UI.QuestionsParole : Questions} s=${s} cs=${cs} G=${G} ctx=${ctx} opj=${opj} next=${next} rerender=${rerender} />`}
            ${phase === "observations" && html`<${Observations} s=${s} cs=${cs} G=${G} ctx=${ctx} next=${next} />`}
            ${phase === "relecture" && html`<${Relecture} s=${s} cs=${cs} G=${G} ctx=${ctx} next=${next} />`}
            ${phase === "issue" && html`<${Issue} s=${s} cs=${cs} G=${G} ctx=${ctx} onDone=${onDone} />`}
          </div>
          <div className="gav-side"><${Carnet} cs=${cs} /></div>
        </div>
      </div>`;
    }
    const header = html`<div className="gav-head">
      <div className="mini-stage"><${UI.Room} name="gav" mini=${true} opts=${roomOpts} /></div>
      <div className="gav-steps">${phases.map((p, i) => html`<span key=${p} className=${cx("gav-step", i === pi && "on", i < pi && "done")}>${STEP_LABEL[p]}</span>`)}</div>
    </div>`;
    return html`<div className="scene gav-scene">
      ${header}
      <${UI.Coach} k="gav" s=${s} />
      <div className="gav-body">
        <div className="gav-main">
          ${phase === "arrivee" && html`<${Arrivee} s=${s} cs=${cs} G=${G} opj=${opj} mode=${mode} next=${next} />`}
          ${phase === "pieces" && html`<${Pieces} s=${s} cs=${cs} G=${G} next=${next} />`}
          ${phase === "droits" && html`<${Droits} s=${s} cs=${cs} G=${G} next=${next} />`}
          ${phase === "entretien" && html`<${parole ? UI.EntretienParole : Entretien} s=${s} cs=${cs} G=${G} ctx=${ctx} next=${next} />`}
          ${phase === "conseil" && html`<${Conseil} s=${s} cs=${cs} G=${G} ctx=${ctx} next=${next} />`}
          ${phase === "audition" && html`<${parole ? UI.AuditionParole : Audition} s=${s} cs=${cs} G=${G} ctx=${ctx} opj=${opj} next=${next} />`}
          ${phase === "questions" && html`<${parole ? UI.QuestionsParole : Questions} s=${s} cs=${cs} G=${G} ctx=${ctx} opj=${opj} next=${next} rerender=${rerender} />`}
          ${phase === "observations" && html`<${Observations} s=${s} cs=${cs} G=${G} ctx=${ctx} next=${next} />`}
          ${phase === "relecture" && html`<${Relecture} s=${s} cs=${cs} G=${G} ctx=${ctx} next=${next} />`}
          ${phase === "issue" && html`<${Issue} s=${s} cs=${cs} G=${G} ctx=${ctx} onDone=${onDone} />`}
        </div>
        <div className="gav-side"><${Carnet} cs=${cs} /></div>
      </div>
    </div>`;
  };
  const STEP_LABEL = { arrivee: "Arrivée", pieces: "Pièces", droits: "Droits", entretien: "Entretien", conseil: "Conseil", audition: "Audition", questions: "Questions", observations: "Observations", relecture: "Relecture", issue: "Issue" };

  function Arrivee({ s, cs, G, opj, mode, next }) {
    const [done] = useState(() => { CR.spend(s, G.attente || 15, "gav"); bump(); return true; });
    return html`<div className="gav-card">
      <p className="pix">${CR.fmtTime(s.min)} · ${CR.placeOf(s, s.at) ? CR.placeOf(s, s.at).nom : "Commissariat"}</p>
      ${(G.arrivee || []).map((t, i) => html`<p key=${i}>${CR.fmt(t, CR.caseVars(s, cs))}</p>`)}
      ${opj && html`<p className="muted small">${opj.nom}${s.flags["connait_" + opj.id] ? ` — ${CR.PROFILS[opj.profil].label}` : ""}</p>`}
      <${Btn} kind="primary" onClick=${next}>${mode === "gav" ? "Demander à consulter les pièces" : "Entrer dans le bureau d'audition"}</${Btn}>
    </div>`;
  }

  function Pieces({ s, cs, G, next }) {
    const [sel, setSel] = useState(G.pieces[0]);
    const [pop, setPop] = useState(null);
    const def = CR.caseDef(cs);
    const raw = def.docs[sel];
    const doc = raw ? (typeof raw === "function" ? raw({ s, cs, def, api: CR.api(s, cs) }) : raw) : null;
    const titreP = (def.docTitles && def.docTitles[sel]) || (doc && doc.title) || sel;
    // lue au commissariat : la pièce n'est pas versée au dossier, elle se reconnaît à sa clé
    const d = doc ? Object.assign({}, doc, { paras: UI.segmentize(doc.paras), ref: { key: "gav:" + sel, titre: titreP } }) : null;
    const onSeg = (seg, e) => {
      const el = e.currentTarget, r = el.getBoundingClientRect();
      const host = el.closest(".docview").getBoundingClientRect();
      const p = +el.dataset.p, sI = +el.dataset.s, t = typeof seg === "string" ? seg : seg.t || "";
      const mk = e.target.closest && e.target.closest("[data-an]");
      setPop({ seg, range: isNaN(p) ? null : { debut: { p, s: sI, o: 0 }, fin: { p, s: sI, o: t.length } }, annot: mk ? mk.dataset.an : null, x: r.left - host.left, y: r.bottom - host.top + 4 });
    };
    const text = pop ? segText(pop.seg).trim() : "";
    return html`<div className="gav-card">
      <p>L'officier vous tend les pièces. Vous pouvez prendre des notes ; ni copie ni photographie (art. 63-4-1).</p>
      <div className="chips">${G.pieces.map((k) => html`<button key=${k} className=${cx("chip", sel === k && "on")} onClick=${() => { setSel(k); setPop(null); }}>${(def.docTitles && def.docTitles[k]) || k}</button>`)}</div>
      <div className="docview" onClick=${(e) => { if (!e.target.closest(".seg") && !e.target.closest(".pop")) setPop(null); }}>
        <${Paper} doc=${d} cs=${cs} interactive=${true} onSeg=${onSeg} kind="pv" />
        <${UI.IndiceBox} s=${s} cs=${cs} doc=${d} k=${"gav:" + sel} />
        ${pop && html`<${UI.SegPop} key=${text + JSON.stringify(pop.range) + (pop.annot || "")} s=${s} cs=${cs} seg=${pop.seg} doc=${d} range=${pop.range} annotId=${pop.annot} refInfo=${d.ref} x=${pop.x} y=${pop.y} src="gav" onClose=${() => setPop(null)} />`}
      </div>
      <${Btn} kind="primary" onClick=${() => { CR.spend(s, 12, "gav"); bump(); next(); }}>Rendre les pièces · 12 min</${Btn}>
    </div>`;
  }

  // Audition libre : l'OPJ lit les droits à voix haute
  function Droits({ s, cs, G, next }) {
    const lines = G.droits || [];
    const [pop, setPop] = useState(null);
    return html`<div className="gav-card">
      <p>${CR.fmt("L'officier lit à {prenom} la notification de ses droits.", CR.caseVars(s, cs))} Cliquez une phrase pour la noter ; « relever… » si quelque chose ne va pas, ou manque.</p>
      <div className="transcript docview" onClick=${(e) => { if (!e.target.closest(".tl-rel") && !e.target.closest(".pop")) setPop(null); }}>${lines.map((l, i) => { const t = segText(l); const noted = cs.notes.some((n) => n.text === t.trim()); return html`<div key=${i} className="tline who-client"><span className="tl-who pix">OPJ</span><span className=${cx("tl-body seg noteable", noted && "seg-noted", CR.isSurl(cs, t.trim()) && "seg-surl", cs.issues.some((x) => x.text === t.trim()) && "seg-flagged")} onClick=${() => { CR.addNote(s, cs, { text: t.trim(), fact: typeof l === "object" ? l.f : null, src: "gav" }); bump(); }}>${t}</span><button type="button" className="link small tl-rel" onClick=${(e) => { const r = e.currentTarget.getBoundingClientRect(); const host = e.currentTarget.closest(".docview").getBoundingClientRect(); setPop({ seg: typeof l === "object" ? Object.assign({}, l, { t: t.trim() }) : t.trim(), x: r.left - host.left - 200, y: r.bottom - host.top + 4 }); }}>relever…</button></div>`; })}
        ${pop && html`<${UI.SegPop} key=${segText(pop.seg)} s=${s} cs=${cs} seg=${pop.seg} refInfo=${{ key: "droits", titre: "Notification des droits (audition libre)" }} x=${Math.max(0, pop.x)} y=${pop.y} src="gav" onClose=${() => setPop(null)} />`}
      </div>
      <${Btn} kind="primary" onClick=${() => { CR.spend(s, 6, "gav"); bump(); next(); }}>Continuer</${Btn}>
    </div>`;
  }

  // Entretien confidentiel : trente minutes au plus
  function Entretien({ s, cs, G, ctx, next }) {
    const E = G.entretien;
    const v = CR.caseVars(s, cs);
    const [lines, setLines] = useState([{ who: "client", segs: (E.opening || []).map((x) => (typeof x === "string" ? CR.fmt(x, v) : Object.assign({}, x, { t: CR.fmt(x.t, v) }))) }]);
    const [asked, setAsked] = useState(new Set());
    const [unl, setUnl] = useState(new Set(E.start || []));
    const [min, setMin] = useState(0);
    const [over, setOver] = useState(false);
    const endRef = useRef(null);
    useEffect(() => { endRef.current && endRef.current.scrollIntoView && endRef.current.scrollIntoView({ block: "end" }); }, [lines.length]);
    const topics = (E.topics || []).filter((t) => unl.has(t.id) && !asked.has(t.id));
    const ask = (t) => {
      const m = min + (t.cost || 3);
      const na = new Set(asked); na.add(t.id); setAsked(na);
      const nu = new Set(unl); (t.unlock || []).forEach((u) => nu.add(u)); setUnl(nu);
      const ans = (t.a || []).map((x) => (typeof x === "string" ? CR.fmt(x, v) : Object.assign({}, x, { t: CR.fmt(x.t, v) })));
      let nl = lines.concat([{ who: "you", segs: [CR.fmt(t.q, v)] }, { who: "client", segs: ans }]);
      if (m >= 30) { nl = nl.concat([{ who: "sys", segs: ["On frappe à la porte. « C'est l'heure, maître : trente minutes. »"] }]); setOver(true); }
      if (t.fx) CR.applyFx(CR.api(s, cs), t.fx);
      ctx.who = "client"; ctx.talkFrom = Date.now() + 500; ctx.talkUntil = ctx.talkFrom + Math.min(4200, 900 + ans.map(segText).join(" ").length * 22);
      setLines(nl);
      setMin(Math.min(30, m));
    };
    const finish = () => { ctx.entretien = min; CR.spend(s, Math.max(5, min), "gav", { busy: true }); bump(); next(); };
    return html`<div className="gav-card ent-card">
      <div className="entretien-head"><span className="pix">Entretien confidentiel</span><span className=${cx("chrono", min >= 25 && "urgent")}>${min} / 30 min</span></div>
      <div className="transcript">
        ${lines.map((L, li) => html`<div key=${li} className=${cx("tline", "who-" + L.who)}><span className="tl-who pix">${L.who === "client" ? (CR.client(cs).prenom || "").toUpperCase() : L.who === "you" ? "VOUS" : ""}</span><span className="tl-body">${L.segs.map((seg, si) => { const t = segText(seg); const noted = cs.notes.some((n) => n.text === t.trim()); return html`<span key=${si} className=${cx("seg", L.who === "client" && "noteable", noted && "seg-noted")} onClick=${() => { if (L.who !== "client") return; CR.addNote(s, cs, { text: t.trim(), fact: typeof seg === "object" ? seg.f : null, src: "gav" }); bump(); }}>${t} </span>`; })}</span></div>`)}
        <div ref=${endRef}></div>
      </div>
      ${!over && html`<div className="questions">${topics.map((t) => html`<button key=${t.id} className="q-btn" onClick=${() => ask(t)}><span>${CR.fmt(t.q, v)}</span><span className="small muted">${t.cost || 3} min</span></button>`)}</div>`}
      <${Btn} kind="primary" onClick=${finish}>${over ? "Sortir de l'entretien" : "Terminer l'entretien"}</${Btn}>
    </div>`;
  }

  function Conseil({ s, cs, G, ctx, next }) {
    const opts = G.conseils || [
      { id: "silence", t: "Garder le silence", sub: "Il décline son identité, puis se tait. Rien ne peut être retenu de ce qu'il n'a pas dit." },
      { id: "expliquer", t: "S'expliquer complètement", sub: "Il donne sa version, entière. Utile si le dossier la confirme ; dangereux sinon." },
      { id: "partiel", t: "Répondre en partie", sub: "Il répond sur les faits qu'il ne conteste pas, se tait sur le reste." },
    ];
    return html`<div className="gav-card">
      <p>Avant l'audition, que conseillez-vous à ${CR.client(cs).prenom} ? Chaque choix changera ce que le parquet décidera.</p>
      <div className="decide">${opts.map((o) => html`<button key=${o.id} className="decide-opt" onClick=${() => { ctx.conseil = o.id; cs.vars.conseilGav = o.id; CR.spend(s, 2, "gav"); bump(); next(); }}><strong>${o.t}</strong><span className="small muted">${o.sub}</span></button>`)}</div>
    </div>`;
  }

  // Audition : vous écoutez et vous notez ; les questions de l'OPJ trahissent le dossier
  function Audition({ s, cs, G, ctx, opj, next }) {
    const steps = useMemo(() => (typeof G.audition === "function" ? G.audition(CR.api(s, cs), ctx) : G.audition) || [], []);
    const [i, setI] = useState(0);
    const shown = steps.slice(0, i + 1);
    const endRef = useRef(null);
    useEffect(() => { endRef.current && endRef.current.scrollIntoView && endRef.current.scrollIntoView({ block: "end" }); }, [i]);
    const ans = (st) => (typeof st.a === "object" && !Array.isArray(st.a) ? st.a[ctx.conseil] || st.a.expliquer || "" : st.a);
    const noteLine = (t, f) => { CR.addNote(s, cs, { text: t.trim(), fact: f || null, src: "gav" }); bump(); };
    const done = i >= steps.length - 1;
    // dans la pièce : l'officier pose la question, puis le client répond
    useEffect(() => { CR.dec.cue("opj", 1500); const st = steps[i]; if (!st || !ans(st)) return; const t = setTimeout(() => CR.dec.cue("client", 1200 + Math.min(2600, ans(st).length * 16)), 1500); return () => clearTimeout(t); }, [i]);
    return html`<div className="gav-card">
      <p className="small muted">L'audition est menée par l'officier. Vous ne l'interrompez pas : vous écoutez, vous notez. Vos questions viendront à la fin (art. 63-4-3).</p>
      <div className="transcript">
        ${shown.map((st, k) => html`<div key=${k}>
          <div className="tline who-opj"><span className="tl-who pix">OPJ</span><span className=${cx("tl-body seg noteable", cs.notes.some((n) => n.text === st.q.trim()) && "seg-noted")} onClick=${() => noteLine(st.q, st.fq)}>${st.q}</span></div>
          ${ans(st) && html`<div className="tline who-client"><span className="tl-who pix">${(CR.client(cs).prenom || "").toUpperCase()}</span><span className=${cx("tl-body seg noteable", cs.notes.some((n) => n.text === ans(st).trim()) && "seg-noted")} onClick=${() => noteLine(ans(st), st.fa)}>${ans(st)}</span></div>`}
        </div>`)}
        <div ref=${endRef}></div>
      </div>
      ${!done ? html`<${Btn} kind="primary" onClick=${() => { CR.spend(s, 6, "gav"); setI(i + 1); bump(); }}>Question suivante</${Btn}>` : html`<${Btn} kind="primary" onClick=${() => { CR.spend(s, 6, "gav"); bump(); next(); }}>Fin de l'audition</${Btn}>`}
    </div>`;
  }

  function Questions({ s, cs, G, ctx, opj, next, rerender }) {
    const qs = G.questions || [];
    const [log, setLog] = useState([]);
    const left = 3 - ctx.questions.length;
    const ask = (q) => {
      const api = CR.api(s, cs);
      const refuse = CR.ACT.opjRefuse(api, q);
      ctx.questions.push(q.id);
      CR.spend(s, 4, "gav");
      CR.dec.cue(refuse ? "opj" : "client", 2400);
      if (refuse) { ctx.refus.push(q); setLog(log.concat([{ who: "you", t: q.q }, { who: "opj", t: "Je refuse cette question, maître : elle nuit au bon déroulement de l'enquête. Je le mentionne au procès-verbal." }])); }
      else { setLog(log.concat([{ who: "you", t: q.q }, { who: "client", t: q.a, f: q.f }])); if (q.fx) CR.applyFx(api, q.fx); }
      bump(); rerender();
    };
    return html`<div className="gav-card">
      <p>L'audition est terminée. Vous pouvez poser vos questions. L'officier ne peut s'y opposer que si elles nuisent au bon déroulement de l'enquête ; le refus est mentionné au PV.</p>
      <div className="transcript">${log.map((l, k) => html`<div key=${k} className=${cx("tline", "who-" + l.who)}><span className="tl-who pix">${l.who === "you" ? "VOUS" : l.who === "opj" ? "OPJ" : (CR.client(cs).prenom || "").toUpperCase()}</span><span className=${cx("tl-body", l.who === "client" && "seg noteable")} onClick=${() => { if (l.who === "client") { CR.addNote(s, cs, { text: l.t, fact: l.f, src: "gav" }); bump(); } }}>${l.t}</span></div>`)}</div>
      ${left > 0 && html`<div className="questions">${qs.filter((q) => !ctx.questions.includes(q.id)).map((q) => html`<button key=${q.id} className="q-btn" onClick=${() => ask(q)}><span>${q.q}</span><span className="small muted">4 min</span></button>`)}</div>`}
      <${Btn} kind="primary" onClick=${next}>${left > 0 ? "Ne plus poser de questions" : "Continuer"}</${Btn}>
    </div>`;
  }

  function Observations({ s, cs, G, ctx, next }) {
    const flagged = cs.issues.map((i) => ({ id: i.id, t: i.text, flag: i.flag }));
    const extra = (G.observations || []).filter((o) => !o.flag && (!o.need || CR.hasFact(cs, o.need)));
    const opts = flagged.map((f) => ({ id: f.id, t: `Irrégularité relevée : « ${f.t.trim()} »`, flag: f.flag })).concat(extra).concat(ctx.refus.map((q) => ({ id: "ref_" + q.id, t: `Question refusée : « ${q.q} »`, refus: true })));
    const [sel, setSel] = useState([]);
    const write = () => {
      ctx.observations = sel;
      const picked = opts.filter((o) => sel.includes(o.id));
      cs.vars.observationsGav = picked.map((o) => o.t);
      for (const o of picked) if (o.flag) { cs.flags["obs_" + o.flag] = s.day; CR.bon(s, cs, { id: "obs_" + o.flag, texte: "Vous avez consigné l'irrégularité dans vos observations écrites : elle est figée au dossier." }); }
      if (picked.length) CR.fileDoc(s, cs, { key: "_observations", title: "Observations écrites de l'avocat (art. 63-4-3)", dir: "out", vars: { items: picked.map((o) => o.t) } });
      CR.spend(s, picked.length ? 10 + picked.length * 4 : 2, "gav");
      bump();
      next();
    };
    return html`<div className="gav-card">
      <p>Vous pouvez rédiger des observations écrites, jointes à la procédure. Y consigner une irrégularité la fige au dossier pour la nullité à venir.</p>
      ${opts.length === 0 && html`<p className="muted">Vous n'avez rien relevé.</p>`}
      ${opts.map((o) => html`<label key=${o.id} className="check"><input type="checkbox" id=${"obs-" + o.id} checked=${sel.includes(o.id)} onChange=${(e) => setSel(e.target.checked ? sel.concat(o.id) : sel.filter((x) => x !== o.id))} /> ${o.t}</label>`)}
      <${Btn} kind="primary" onClick=${write}>${sel.length ? "Rédiger et joindre les observations" : "Pas d'observations"}</${Btn}>
    </div>`;
  }

  function Relecture({ s, cs, G, ctx, next }) {
    const R0 = ctx.relecture || G.relecture;
    const [asked, setAsked] = useState(null);
    const segs = R0.segs;
    const demander = (seg) => {
      CR.spend(s, 3, "gav");
      if (seg.erreur) { ctx.rectif = true; cs.flags.pvRectifie = true; CR.bon(s, cs, { id: "rectif", texte: "À la relecture, vous avez fait rectifier une déclaration mal retranscrite avant la signature." }); setAsked({ ok: true, t: seg.correct }); }
      else setAsked({ ok: false, t: "L'officier relit : « C'est ce qu'il a dit, maître. » Il a raison." });
      bump();
    };
    return html`<div className="gav-card">
      <p>Relecture du procès-verbal avant signature. Les déclarations sont-elles fidèlement retranscrites ? Cliquez une phrase pour demander une rectification.</p>
      <article className="paper paper-pv">${segs.map((sg, i) => html`<span key=${i} className=${cx("seg", asked && sg.erreur && asked.ok && "seg-flagged")} onClick=${() => !asked && demander(sg)}>${sg.t} </span>`)}</article>
      ${asked && html`<div className=${cx("banner", asked.ok ? "ok" : "")}>${asked.ok ? `Rectifié : « ${asked.t} »` : asked.t}</div>`}
      <${Btn} kind="primary" onClick=${() => { CR.spend(s, 4, "gav"); bump(); next(); }}>${asked ? "Signer et continuer" : "Le PV est fidèle, continuer"}</${Btn}>
    </div>`;
  }

  function Issue({ s, cs, G, ctx, onDone }) {
    const [res] = useState(() => { const r = G.issue(CR.api(s, cs), ctx); bump(); return r || {}; });
    return html`<div className="gav-card">
      ${(res.texte || []).map((t, i) => html`<p key=${i}>${t}</p>`)}
      <${Btn} kind="primary" onClick=${() => { CR.spend(s, 5, "gav"); bump(); onDone(); }}>Quitter ${CR.placeOf(s, s.at) ? CR.placeOf(s, s.at).nom.toLowerCase().startsWith("brigade") ? "la brigade" : "le commissariat" : ""}</${Btn}>
    </div>`;
  }

  // Le document des observations écrites
  CR.SHARED_DOCS._observations = (x) => ({ title: "Observations écrites de l'avocat", kind: "courrier", paras: [[`Observations de Me ${x.s.player.prenom} ${x.s.player.nom}, avocat de ${CR.clientName(x.cs)}, jointes à la procédure (art. 63-4-3 CPP).`]].concat((x.items || []).map((t) => ["— " + t])) });
})();
