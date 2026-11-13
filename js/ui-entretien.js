// La Permanence — refonte du gameplay, lot 3 : l'entretien, l'audition et les questions de l'avocat (UI.*Parole)
// L'oral s'efface : chaque réplique s'écrit au rythme de la voix près de celui qui parle, reste un instant, puis disparaît.
// Ce qui n'est pas noté est perdu (un clic sur la réplique la note ; on peut aussi taper sa propre note).
// La question se compose : sujet, angle, forme. Clavier : 1 à 6 pour l'angle ; O, F, R, C pour la forme ; Entrée pour poser.
(function () {
  "use strict";
  const CR = window.CR, UI = CR.UI, { html, cx, Btn } = UI;
  const { useState, useEffect, useRef, useMemo } = React;
  const P = CR.PAROLE;
  const bump = () => CR.store.bump();

  // ------------------------------------------------------------------ L'oral
  const VITESSE = 32;  // caractères par seconde : une voix posée
  const TENUE = 2600;  // une réplique entière reste lisible un instant…
  const PAR_CAR = 28;  // …un peu plus longtemps si elle est longue
  function useOral(rapide) {
    const [lignes, setLignes] = useState([]);
    const [now, setNow] = useState(Date.now());
    const fin = useRef(Date.now());
    useEffect(() => { const h = setInterval(() => setNow(Date.now()), 90); return () => clearInterval(h); }, []);
    const k = (rapide ? 3 : 1) * (P.ACCEL || 1); // P.ACCEL : les tests accélèrent la voix
    const dire = (who, t, f, o) => {
      const born = Math.max(Date.now(), fin.current) + 250 / k;
      const dur = (t.length / VITESSE) * 1000 / k;
      fin.current = born + dur;
      const L = Object.assign({ id: CR.uid("l"), who, t, f: f || null, born, dur, hold: (TENUE + t.length * PAR_CAR) / k }, o || {});
      setLignes((x) => x.concat([L]));
      return L;
    };
    const vivantes = lignes.filter((L) => now < L.born + L.dur + L.hold + 1400);
    const occupe = now < fin.current + 200;
    return { lignes: vivantes, now, dire, occupe, finit: () => fin.current };
  }
  function Replique({ L, now, nom, onNote, notee }) {
    if (now < L.born) return null;
    const n = Math.min(L.t.length, Math.ceil(((now - L.born) / L.dur) * L.t.length));
    const passe = now > L.born + L.dur + L.hold;
    const peutNoter = !!onNote && n > 0;
    return html`<div className=${cx("oral-l", "who-" + L.who, passe && "oral-efface", notee && "oral-notee")}>
      <span className="oral-who">${nom}</span>
      <button type="button" className="oral-t" disabled=${!peutNoter} onClick=${() => peutNoter && onNote(L)} title=${peutNoter ? "Noter cette phrase" : ""}>${L.t.slice(0, n)}${n < L.t.length ? html`<span className="oral-caret"></span>` : null}</button>
    </div>`;
  }
  function Oral({ oral, noms, onNote, notees, vide }) {
    return html`<div className="oral" aria-live="polite">
      ${oral.lignes.length === 0 && html`<p className="oral-vide">${vide || ""}</p>`}
      ${oral.lignes.map((L) => html`<${Replique} key=${L.id} L=${L} now=${oral.now} nom=${noms[L.who] || ""} onNote=${L.who !== "you" ? onNote : null} notee=${notees.has(L.id)} />`)}
    </div>`;
  }
  function useNoter(s, cs) {
    const [notees, setNotees] = useState(new Set());
    const noter = (L) => { CR.addNote(s, cs, { text: L.t.trim(), fact: L.f || null, src: "gav" }); setNotees((x) => new Set(x).add(L.id)); bump(); };
    return { notees, noter };
  }
  function Notes({ s, cs }) {
    const [txt, setTxt] = useState("");
    const mes = cs.notes.filter((n) => (n.src === "gav" || n.own) && n.day === s.day).slice(-12);
    const ajouter = () => { if (!txt.trim()) return; CR.addOwnNote(s, cs, { text: txt }); setTxt(""); bump(); };
    return html`<div className="ent-notes">
      <ol>${mes.map((n) => html`<li key=${n.id} className=${n.own ? "own" : ""}>${n.text}</li>`)}</ol>
      ${mes.length === 0 && html`<p className="small muted">Cliquez une phrase pendant qu'elle est dite pour la noter, ou écrivez la vôtre.</p>`}
      <div className="ent-note-in"><input type="text" value=${txt} placeholder="Votre note…" aria-label="Votre note" onInput=${(e) => setTxt(e.target.value)} onKeyDown=${(e) => { if (e.key === "Enter") { e.stopPropagation(); ajouter(); } }} /><${Btn} small onClick=${ajouter}>Noter</${Btn}></div>
    </div>`;
  }

  // ------------------------------------------------------------------ Le compositeur de questions
  function Composer({ M, cs, onPoser, desactive, cout }) {
    const recents = [...new Set(M.poses.slice().reverse().map((q) => q.sujet))];
    const ordre = recents.map((id) => P.sujet(M, id)).filter(Boolean).concat(M.sujets.filter((x) => !recents.includes(x.id)));
    const [sujet, setSujet] = useState(null);
    const [angle, setAngle] = useState(null);
    const [forme, setForme] = useState("ouverte");
    const [extrait, setExtrait] = useState(null);
    const extraits = (CR.TRAV ? CR.TRAV.annots(cs) : []).slice(-20).reverse();
    const q = { sujet, angle: angle || "recit", forme, extrait: forme === "confrontation" ? extraits.find((a) => a.id === extrait) || null : null };
    const pret = sujet && (angle || forme === "confrontation") && P.possible(M, q) && !desactive;
    const texte = sujet && (angle || forme === "confrontation") ? P.texteQuestion(M, q) : "";
    const poser = () => { if (!pret) return; onPoser(q); setAngle(null); if (forme !== "ouverte") setForme("ouverte"); };
    useEffect(() => {
      const kd = (e) => {
        if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
        const i = "123456".indexOf(e.key);
        if (i >= 0) { setAngle(P.ANGLES[i][0]); e.preventDefault(); }
        const f = { o: "ouverte", f: "fermee", r: "relance", c: "confrontation" }[e.key.toLowerCase()];
        if (f) { setForme(f); e.preventDefault(); }
        if (e.key === "Enter") { poser(); e.preventDefault(); }
      };
      window.addEventListener("keydown", kd);
      return () => window.removeEventListener("keydown", kd);
    });
    return html`<div className="compo">
      <div className="compo-l"><span className="compo-h">Sujet</span><div className="compo-sujets">${ordre.map((x) => html`<button type="button" key=${x.id} className=${cx("compo-b", sujet === x.id && "on")} onClick=${() => setSujet(x.id)}>${x.label}</button>`)}</div></div>
      <div className="compo-l"><span className="compo-h">Angle</span><div>${P.ANGLES.map(([k, l], i) => html`<button type="button" key=${k} className=${cx("compo-b", angle === k && "on")} disabled=${forme === "confrontation"} onClick=${() => setAngle(k)}><kbd>${i + 1}</kbd>${l}</button>`)}</div></div>
      <div className="compo-l"><span className="compo-h">Forme</span><div>${P.FORMES.map(([k, l]) => html`<button type="button" key=${k} className=${cx("compo-b", forme === k && "on")} disabled=${k === "relance" && sujet && !M.dit[sujet]} onClick=${() => setForme(k)}><kbd>${l[0]}</kbd>${l}</button>`)}</div></div>
      ${forme === "confrontation" && html`<div className="compo-l"><span className="compo-h">Passage</span>${extraits.length ? html`<select value=${extrait || ""} onChange=${(e) => setExtrait(e.target.value || null)} aria-label="Passage de la procédure"><option value="">Choisir un passage annoté…</option>${extraits.map((a) => html`<option key=${a.id} value=${a.id}>${a.cote ? a.cote + " — " : ""}${a.t.slice(0, 90)}</option>`)}</select>` : html`<span className="small muted">Annotez d'abord un passage d'une pièce : c'est lui qu'on oppose.</span>`}</div>`}
      <div className="compo-go">
        <p className="compo-q">${texte || html`<span className="muted">Choisissez un sujet, un angle, une forme.</span>`}</p>
        <${Btn} kind="primary" disabled=${!pret} onClick=${poser}>Poser la question${pret ? html` <small>≈ ${cout != null ? cout : P.DUREE[forme]} min</small>` : null}</${Btn}>
      </div>
    </div>`;
  }

  // ------------------------------------------------------------------ L'entretien confidentiel (art. 63-4)
  UI.EntretienParole = function EntretienParole({ s, cs, G, ctx, next }) {
    const M = useMemo(() => (ctx.M = ctx.M || P.client(s, cs, G)), []);
    const oral = useOral(false);
    const { notees, noter } = useNoter(s, cs);
    const [min, setMin] = useState(0);
    const [over, setOver] = useState(false);
    const [onglet, setOnglet] = useState("questions");
    const [qClient, setQClient] = useState(null);
    const nom = (M.A.prenom || "").toUpperCase();
    const parle = (L) => { ctx.who = "client"; ctx.talkFrom = L.born; ctx.talkUntil = L.born + L.dur; };
    useEffect(() => { for (const x of G.entretien.opening || []) oral.dire("sys", CR.fmt(typeof x === "string" ? x : x.t, CR.caseVars(s, cs))); }, []);
    const temps = (m) => { const n = Math.min(P.LIMITE, min + m); setMin(n); if (n >= P.LIMITE && !over) { setOver(true); oral.dire("sys", "On frappe à la porte. « C'est l'heure, maître : trente minutes. »"); } return n; };
    const poser = (q) => {
      if (qClient) { P.repondreClient(M, qClient, false); setQClient(null); }
      const res = P.repondre(M, q);
      oral.dire("you", P.texteQuestion(M, q) || M.poses[M.poses.length - 1].texte);
      for (const l of res.lignes) parle(oral.dire("client", l.t, l.f));
      if (res.client) { parle(oral.dire("client", res.client)); setQClient(res.client); }
      temps(res.min);
    };
    const repondreClient = (oui) => { const r = P.repondreClient(M, qClient, oui); if (oui) { oral.dire("you", r.t); temps(r.min); } setQClient(null); };
    const conseiller = (k, c) => { const m = P.conseiller(M, k, c); if (m) temps(m); bump(); };
    const finir = () => { ctx.entretien = min; cs.vars.conseilParole = Object.assign({}, M.conseil || {}); CR.spend(s, Math.max(5, min), "gav", { busy: true }); bump(); next(); };
    return html`<div className="gav-card ent-card ent-parole">
      <div className="entretien-head"><span className="pix">Entretien confidentiel</span><span className="ent-tete-d"><span className=${cx("chrono", min >= 25 && "urgent")} title="Minutes écoulées sur trente">${min} / ${P.LIMITE} min</span><${Btn} small kind="primary" onClick=${finir}>${over ? "Sortir de l'entretien" : "Terminer l'entretien"}</${Btn}></span></div>
      <${Oral} oral=${oral} noms=${{ client: nom, you: "VOUS", sys: "" }} onNote=${noter} notees=${notees} vide="Le local est silencieux." />
      ${qClient && !over && html`<div className="ent-qclient"><span>« ${qClient} »</span><${Btn} small onClick=${() => repondreClient(true)}>Lui répondre <small>2 min</small></${Btn}><${Btn} small onClick=${() => repondreClient(false)}>Passer</${Btn}></div>`}
      <div className="ent-cote">
      <div className="ent-onglets" role="tablist">${[["questions", "Questions"], ["conseil", "Conseil"], ["notes", "Vos notes"]].map(([k, l]) => html`<button type="button" role="tab" key=${k} aria-selected=${onglet === k} className=${cx("ent-onglet", onglet === k && "on")} onClick=${() => setOnglet(k)}>${l}</button>`)}</div>
      ${onglet === "questions" && html`<${Composer} M=${M} cs=${cs} onPoser=${poser} desactive=${over || oral.occupe} />`}
      ${onglet === "conseil" && html`<div className="ent-conseil">
        <p className="small muted">L'audition suivra. ${M.G.Il} déclinera son identité ; pour le reste, dites-${M.G.lui} sujet par sujet s'${M.G.il} répond ou se tait. Expliquer un sujet prend une minute.</p>
        ${P.SUJETS_AUDITION.map(([k, l, sub]) => html`<div key=${k} className="cons-l"><span><b>${l}</b><small>${sub}</small></span><span className="cons-b">${P.CONSEILS.map(([c, cl]) => html`<button type="button" key=${c} className=${cx("compo-b", (M.conseil || {})[k] === c && "on")} disabled=${over} onClick=${() => conseiller(k, c)}>${cl}</button>`)}</span></div>`)}
      </div>`}
      ${onglet === "notes" && html`<${Notes} s=${s} cs=${cs} />`}
      </div>
    </div>`;
  };

  // ------------------------------------------------------------------ L'audition intégrale
  UI.AuditionParole = function AuditionParole({ s, cs, G, ctx, opj, next }) {
    const M = useMemo(() => (ctx.M = ctx.M || P.client(s, cs, G)), []);
    const api = CR.api(s, cs);
    const prof = (CR.ACT && CR.ACT.profil && CR.ACT.profil(api, "opj")) || CR.PROFILS.opj_formaliste;
    const aud = useMemo(() => {
      const a = P.derouler(M, prof.aveux, prof === CR.PROFILS.opj_pressant);
      ctx.aud = a; ctx.conseil = a.conseilGav; cs.vars.conseilGav = a.conseilGav; ctx.relecture = P.relecture(M, a);
      cs.vars.auditionGav = a.lignes.map((l) => ({ sujet: l.sujet, q: l.q, a: l.a, silence: !!l.silence, erreur: !!l.erreur, fausse: l.fausse || null }));
      return a;
    }, []);
    const [rapide, setRapide] = useState(false);
    const oral = useOral(rapide);
    const { notees, noter } = useNoter(s, cs);
    const [i, setI] = useState(0);
    const nom = (M.A.prenom || "").toUpperCase();
    // l'enquêteur pose, le client répond, puis la question suivante : l'audition se déroule sans attendre l'avocat
    useEffect(() => {
      if (i >= aud.lignes.length || oral.occupe) return;
      const l = aud.lignes[i];
      const Lq = oral.dire("opj", l.q, l.fq); CR.dec && CR.dec.cue && CR.dec.cue("opj", Math.round(Lq.dur));
      if (l.a) { const La = oral.dire("client", l.a); ctx.who = "client"; ctx.talkFrom = La.born; ctx.talkUntil = La.born + La.dur; }
      setI(i + 1);
    }, [i, oral.occupe]);
    const fini = i >= aud.lignes.length && !oral.occupe;
    const terminer = () => { CR.spend(s, Math.max(10, Math.round(aud.lignes.length * 1.5)), "gav"); bump(); next(); };
    return html`<div className="gav-card ent-parole">
      <p className="small muted">L'officier mène l'audition. Vous ne l'interrompez pas : vous écoutez, vous notez. Vos questions viendront à la fin (art. 63-4-3).</p>
      <${Oral} oral=${oral} noms=${{ opj: "OPJ", client: nom }} onNote=${noter} notees=${notees} />
      <div className="ent-fin">
        <span className="small muted">${fini ? "L'officier pose son stylo." : `Question ${Math.min(i, aud.lignes.length)} sur ${aud.lignes.length}`}</span>
        ${!fini && html`<${Btn} small onClick=${() => setRapide(!rapide)}>${rapide ? "Vitesse normale" : "Accélérer"}</${Btn}>`}
        <${Btn} kind="primary" disabled=${!fini} onClick=${terminer}>Fin de l'audition</${Btn}>
      </div>
    </div>`;
  };

  // ------------------------------------------------------------------ Les questions de l'avocat à l'issue de l'audition
  UI.QuestionsParole = function QuestionsParole({ s, cs, G, ctx, opj, next, rerender }) {
    const M = useMemo(() => (ctx.M = ctx.M || P.client(s, cs, G)), []);
    const oral = useOral(false);
    const { notees, noter } = useNoter(s, cs);
    const nom = (M.A.prenom || "").toUpperCase();
    const poser = (q) => {
      const api = CR.api(s, cs);
      const texte = P.texteQuestion(M, q);
      const sensible = ["droits", "interpellation", "police"].includes(q.sujet) || q.forme === "confrontation";
      const refus = CR.ACT.opjRefuse(api, { sensible, anodine: ["logement", "travail", "famille", "sante"].includes(q.sujet) });
      ctx.questions.push(q.sujet + ":" + q.angle);
      CR.spend(s, 4, "gav");
      oral.dire("you", texte);
      const QA = (cs.vars.questionsAvocat = cs.vars.questionsAvocat || []);
      if (refus) { QA.push({ q: texte, refus: true }); ctx.refus.push({ id: "p" + ctx.questions.length, q: texte }); oral.dire("opj", "Je refuse cette question, maître : elle nuit au bon déroulement de l'enquête. Je le mentionne au procès-verbal."); }
      else { const res = P.repondre(M, q); for (const l of res.lignes) oral.dire("client", l.t, l.f); QA.push({ q: texte, a: res.lignes.map((l) => l.t).join(" ") }); }
      bump(); rerender && rerender();
    };
    return html`<div className="gav-card ent-parole">
      <p className="small muted">L'audition est terminée. Vous pouvez poser vos questions ; l'officier ne s'y oppose que si elles nuisent au bon déroulement de l'enquête, et le refus est mentionné au procès-verbal. Chaque question prend quelques minutes.</p>
      <${Oral} oral=${oral} noms=${{ client: nom, you: "VOUS", opj: "OPJ" }} onNote=${noter} notees=${notees} />
      <${Composer} M=${M} cs=${cs} onPoser=${poser} desactive=${oral.occupe} cout=${4} />
      <div className="ent-fin"><${Btn} kind="primary" onClick=${next}>Ne plus poser de questions</${Btn}></div>
    </div>`;
  };

  // ------------------------------------------------------------------ Les entretiens hors garde à vue (cabinet, dépôt, victime, téléphone)
  // Les entrées d'information de l'entretien deviennent des sujets du compositeur ; les gestes (prendre le dossier, refuser,
  // promettre, rassurer, renvoyer…) restent des déclarations explicites : ce sont des décisions, pas des questions.
  P.estGeste = (tp) => !!(tp.ends || tp.fx || (tp.unlock && tp.unlock.length) || tp.flag);
  P.appelLibre = (s, cs, call) => !!(CR.libre(s) && call && call.topics && call.topics.some((tp) => !P.estGeste(tp)) && CR.GEN && CR.GEN.paramsOf && (CR.GEN.paramsOf(s, cs.id) || {}).t);
  UI.CallLibre = function CallLibre({ s, cs, call, nom, api, fmt, topics, onGeste, onTemps, onPatience, onAsked, closing, onClose, onConseil, adviceOn }) {
    const M = useMemo(() => {
      const t = CR.GEN.paramsOf(s, cs.id).t;
      const info = (call.topics || []).filter((tp) => !P.estGeste(tp)).map((tp) => Object.assign({}, tp, { q: fmt(tp.q), a: (typeof tp.a === "function" ? tp.a(api) : tp.a || []).map((x) => (typeof x === "string" ? fmt(x) : Object.assign({}, x, { t: fmt(x.t) }))) }));
      return P.client(s, cs, { parole: { t }, entretien: { topics: info } });
    }, [cs.id]);
    const oral = useOral(false);
    const { notees, noter } = useNoter(s, cs);
    const [qClient, setQClient] = useState(null);
    useEffect(() => { for (const x of call.opening || []) oral.dire("client", fmt(typeof x === "string" ? x : x.t)); }, []);
    const poser = (q) => {
      if (qClient) { P.repondreClient(M, qClient, false); setQClient(null); onPatience(-3); }
      const res = P.repondre(M, q);
      oral.dire("you", P.texteQuestion(M, q));
      for (const l of res.lignes) oral.dire("client", l.t, l.f);
      if (res.client) { oral.dire("client", res.client); setQClient(res.client); }
      onTemps(res.min); onPatience(-({ ouverte: 3, fermee: 2, relance: 4, confrontation: 9 }[q.forme] || 3));
      for (const id of M.utilises || []) onAsked(id);
    };
    const repondreClient = (oui) => { const r = P.repondreClient(M, qClient, oui); if (oui) { oral.dire("you", r.t); onTemps(r.min); onPatience(4); } else onPatience(-3); setQClient(null); };
    const gestes = topics.filter((tp) => P.estGeste(tp));
    return html`<div className="call-libre ent-parole">
      <${Oral} oral=${oral} noms=${{ client: nom.toUpperCase(), you: "VOUS" }} onNote=${noter} notees=${notees} />
      ${qClient && !closing && html`<div className="ent-qclient"><span>« ${qClient} »</span><${Btn} small onClick=${() => repondreClient(true)}>Lui répondre <small>2 min</small></${Btn}><${Btn} small onClick=${() => repondreClient(false)}>Passer</${Btn}></div>`}
      ${!closing && html`<${Composer} M=${M} cs=${cs} onPoser=${poser} desactive=${oral.occupe} />`}
      ${!closing && gestes.length > 0 && html`<div className="gestes"><span className="compo-h">Ce que vous dites</span><div>${gestes.map((tp) => html`<button type="button" key=${tp.id} className="compo-b geste" disabled=${oral.occupe} onClick=${() => { oral.dire("you", fmt(tp.q)); const a = onGeste(tp); for (const x of a || []) oral.dire("client", typeof x === "string" ? x : x.t, x && x.f); }}>${fmt(tp.q)}</button>`)}</div></div>`}
      ${!closing && html`<div className="ent-fin">${adviceOn && html`<${Btn} onClick=${onConseil} disabled=${oral.occupe}>Conclure par des conseils</${Btn}>`}<${Btn} onClick=${onClose} disabled=${oral.occupe}>Terminer l'entretien</${Btn}></div>`}
    </div>`;
  };
})();
