/* La Permanence — scènes : entretiens et appels, parloir, honoraires, rédaction, décisions, mentor, bâtonnier */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html, Icon, Portrait, Meter, Paper, Carnet, Btn, Tag, Empty, cx } = UI;
  const { useState, useEffect, useRef, useMemo } = React;
  const bump = () => CR.store.bump();
  const segText = (seg) => (typeof seg === "string" ? seg : seg.t);
  const segFact = (seg) => (typeof seg === "string" ? null : seg.f || null);

  // =================================================================== ENTRETIEN / APPEL / PARLOIR
  // def.calls[key] = { opening:[seg], topics:[{id,q,a:[seg],cost,tag,unlock,need,fx,ends,flag}], start:[ids], patience, close, advice, scene, who }
  // refonte : plan plein cadre d'une rencontre (rendez-vous, parloir, local avocat) ou de l'appel téléphonique
  const PLAN_OF = { conference: "rdv", parloir: "parloir", commissariat: "entretien" };
  const callPlan = (s, call) => {
    const n = call.scene || (s.at === "commissariat" || (CR.placeOf(s, s.at) || {}).type === "commissariat" ? "commissariat" : null);
    const p = n ? PLAN_OF[n] : call.who ? "standard" : "appel"; // un tiers au bout du fil (permanence, greffe, confrère) : à son bureau
    return p && UI.planOk && UI.planOk(p) ? p : null;
  };
  // main.js demande si la scène se joue en plein cadre (le fond du lieu n'est alors pas monté)
  const stagedMemo = new WeakMap();
  UI.sceneStaged = (s, scene) => {
    if (!scene || !UI.planOk) return false;
    if (scene.type === "neg") return UI.planOk("rdv");
    if (scene.type !== "call") return false;
    let v = stagedMemo.get(scene);
    if (v === undefined) { const cs = s.cases[scene.caseId]; try { v = !!(cs && callPlan(s, buildCall(s, cs, scene.call))); } catch (e) { v = false; } stagedMemo.set(scene, v); }
    return v;
  };
  UI.CallScene = ({ s, cs, callKey, onDone }) => {
    const def = CR.caseDef(cs);
    const c = CR.client(cs);
    const call = useMemo(() => buildCall(s, cs, callKey), [cs.id, callKey]);
    const who = call.who || { nom: def.caller || `${c.prenom}`, look: CR.px.clientLook(c, cs.def) };
    const look = who.look || CR.px.clientLook(c, cs.def);
    const v = CR.caseVars(s, cs);
    const fmtSeg = (seg) => (typeof seg === "string" ? CR.fmt(seg, v) : Object.assign({}, seg, { t: CR.fmt(seg.t, v) }));
    const [lines, setLines] = useState(() => [{ who: "client", segs: (call.opening || []).map(fmtSeg), id: 0 }]);
    const [typing, setTyping] = useState({ line: 0, seg: 0, ch: 0 });
    const [asked, setAsked] = useState(() => new Set(callKey === "intake" || callKey === "followup" ? cs.vars.asked || [] : []));
    const [unlocked, setUnlocked] = useState(() => new Set([...(call.start || []), ...(callKey === "intake" || callKey === "followup" ? cs.vars.unlocked || [] : [])]));
    const [patience, setPatience] = useState(call.patience || 100);
    const [lastTag, setLastTag] = useState(null);
    const [elapsed, setElapsed] = useState(call.baseCost || 3);
    const [phase, setPhase] = useState("talk");
    const [advice, setAdvice] = useState([]);
    const [, force] = useState(0);
    const endRef = useRef(null);
    const cps = 30 * CR.textSpeedMult(s);
    useEffect(() => {
      const L = lines[typing.line];
      if (!L || typing.seg >= L.segs.length) return;
      const txt = segText(L.segs[typing.seg]);
      const t = setTimeout(() => {
        if (typing.ch + 2 >= txt.length) setTyping({ line: typing.line, seg: typing.seg + 1, ch: 0 });
        else setTyping({ line: typing.line, seg: typing.seg, ch: typing.ch + Math.max(1, Math.round(cps / 30)) });
      }, typing.ch === 0 && typing.seg > 0 ? 220 : 1000 / 30);
      return () => clearTimeout(t);
    }, [typing, lines]);
    useEffect(() => { endRef.current && endRef.current.scrollIntoView && endRef.current.scrollIntoView({ block: "end", behavior: "smooth" }); }, [typing.seg, lines.length]);
    const talking = typing.seg < (lines[typing.line] ? lines[typing.line].segs.length : 0);
    const api = CR.api(s, cs);
    const topics = (call.topics || []).filter((t) => unlocked.has(t.id) && !asked.has(t.id) && (!t.need || t.need(api)));
    const note = (seg) => {
      const t = segText(seg).trim();
      if (!t || phase === "ended") return;
      CR.addNote(s, cs, { text: t, fact: segFact(seg), src: call.src || "call" });
      if (segFact(seg) && !cs.factsSeen.includes(segFact(seg))) cs.factsSeen.push(segFact(seg));
      force((x) => x + 1);
    };
    const skip = () => { const L = lines[typing.line]; if (L) setTyping({ line: typing.line, seg: L.segs.length, ch: 0 }); };
    const ask = (t) => {
      const lost = talking ? 1 : 0;
      const cost = t.cost || 3;
      const pDrop = (t.tag === "bad" ? 13 : t.tag === "neutral" ? 6 : 3) + (lost ? 4 : 0);
      const np = patience - pDrop;
      setPatience(np);
      setLastTag(t.tag || null);
      setElapsed(elapsed + cost);
      const na = new Set(asked); na.add(t.id); setAsked(na);
      const nu = new Set(unlocked); (t.unlock || []).forEach((u) => nu.add(u)); setUnlocked(nu);
      if (t.fx) CR.applyFx(api, t.fx);
      if (t.flag) cs.flags[t.flag] = s.day;
      const base = lines.slice();
      if (lost) { const L = base[typing.line]; base[typing.line] = Object.assign({}, L, { segs: L.segs.slice(0, typing.seg + (typing.ch > 3 ? 1 : 0)), cut: true }); }
      let answer = (typeof t.a === "function" ? t.a(api) : t.a || []).map(fmtSeg);
      if (np <= 0) answer = [CR.fmt(call.hangup || "Écoutez, excusez-moi, je dois vraiment y aller. On se rappelle ?", v)];
      else if (np < 22 && !t.ends) answer = answer.concat([CR.fmt(call.impatient || "…Pardon, ça va être encore long ? Je dois aller chercher ma fille.", v)]);
      const nl = base.concat([{ who: "you", segs: [CR.fmt(t.q, v)], id: base.length }, { who: "client", segs: answer, id: base.length + 1 }]);
      setLines(nl);
      setTyping({ line: nl.length - 1, seg: 0, ch: 0 });
      if (np <= 0 || t.ends) setTimeout(() => setPhase("closing"), 50);
    };
    const finish = () => {
      setPhase("ended");
      if (callKey === "intake" || callKey === "followup") { cs.vars.asked = [...asked]; cs.vars.unlocked = [...unlocked]; }
      for (const a of advice) if (!cs.advice.includes(a)) cs.advice.push(a);
      const minutes = Math.round(elapsed + 2);
      CR.spend(s, minutes, call.kind || "call", { busy: true });
      CR.updatedClient(s, cs, callKey === "update" ? 1 : 0.5);
      s.callLog.unshift({ day: s.day, text: `${call.label || (callKey === "intake" ? "Premier entretien" : "Appel")} — ${who.nom || c.prenom + " " + c.nom} (${minutes} min)` });
      if (call.onEnd) call.onEnd(api, { asked: [...asked], advice, patience });
      if (cs.status === "lead" && callKey === "intake") {
        cs.status = "prospect";
        CR.timeline(s, cs, "Premier entretien.");
        CR.unschedule(s, (e) => e.caseId === cs.id && e.key === "_leadExpire");
        CR.schedule(s, { day: s.day + (def.prospectPatience || 7), type: "case", caseId: cs.id, key: "_prospectExpire" });
        if (def.on && def.on.afterIntake) CR.runHook(s, cs, "afterIntake", { asked: [...asked], advice });
      }
      bump();
      onDone();
    };
    const adviceOpts = call.advice ? (call.adviceList || def.advice || []) : [];
    // refonte (lot 3) : un entretien d'affaire générée se joue au compositeur, la parole s'efface, la patience ne s'affiche plus
    const libreCall = CR.PAROLE && CR.PAROLE.appelLibre && CR.PAROLE.appelLibre(s, cs, call);
    const askedRef = useRef(asked); askedRef.current = asked;
    const geste = (t) => {
      const np = patience - (t.tag === "bad" ? 13 : t.tag === "neutral" ? 6 : 3);
      setPatience(np); setLastTag(t.tag || null); setElapsed((e) => e + (t.cost || 3));
      const na = new Set(askedRef.current); na.add(t.id); setAsked(na);
      const nu = new Set(unlocked); (t.unlock || []).forEach((u) => nu.add(u)); setUnlocked(nu);
      if (t.fx) CR.applyFx(api, t.fx);
      if (t.flag) cs.flags[t.flag] = s.day;
      let answer = (typeof t.a === "function" ? t.a(api) : t.a || []).map(fmtSeg);
      if (np <= 0) answer = [CR.fmt(call.hangup || "Écoutez, excusez-moi, je dois vraiment y aller. On se rappelle ?", v)];
      for (const x of answer) if (x && x.f) { CR.addNote(s, cs, { text: segText(x).trim(), fact: x.f, src: call.src || "call" }); }
      if (np <= 0 || t.ends) setTimeout(() => setPhase("closing"), 1500);
      return answer;
    };
    const patienceLibre = (d) => setPatience((p) => { const np = p + d; if (np <= 0) setTimeout(() => setPhase("closing"), 1200); return Math.min(call.patience || 100, np); });
    const p = patience;
    const sceneName = call.scene || (s.at === "commissariat" || (CR.placeOf(s, s.at) || {}).type === "commissariat" ? "commissariat" : null);
    // le visage suit l'échange : défi ou larmes après une question qui blesse, soulagement quand on le rassure
    const mood = phase !== "talk" && advice.length ? "soulage" : lastTag === "bad" ? (cs.camp === "pc" ? "cry" : "defi") : patience < 30 ? "worried" : null;
    const faceExpr = talking ? (mood === "cry" ? "cry" : "talk") : mood || "neutral";
    const plan = callPlan(s, call);
    const cap = plan === "appel" || plan === "standard" ? "Au téléphone" : plan === "parloir" ? "Parloir avocat" : plan === "entretien" ? "Local avocat" : "Rendez-vous au cabinet";
    return html`<div className=${cx("scene call-scene", plan && "staged")}>
      ${plan && html`<${UI.Plan} key=${plan} name=${plan} opts=${{ min: s.min, rain: CR.dec.rainy(s), look: plan === "standard" ? who.look || CR.px.lookFrom("tiers" + (who.nom || ""), { age: 44 }) : look, expr: mood || "neutral", talk: talking, you: CR.youLook(s) }} />
      <div className="stg-shade"></div>
      <div className="stg-top"><div className="stg-cap"><span className="pix">${cap}</span><span className="stg-sub">${who.nom || c.prenom + " " + c.nom} · ${CR.fmtTime(s.min)}</span></div></div>`}
      <div className="call-side">
        ${plan ? null : sceneName ? html`<div className="mini-stage"><${UI.SceneCanvas} name=${sceneName} opts=${{ min: s.min, client: look, clientExpr: faceExpr }} /></div>` : html`<${Portrait} look=${look} size=${176} expr=${faceExpr} />`}
        <strong>${who.nom || c.prenom + " " + c.nom}</strong>
        <span className="small muted">${call.label || (callKey === "intake" ? "Premier entretien" : callKey === "update" ? "Point sur le dossier" : "Appel")} · ${CR.fmtDuration(elapsed)}</span>
        ${!libreCall && html`<div className="patience"><span className="pix">Patience</span><${Meter} value=${Math.max(0, p)} tone=${p < 30 ? "bad" : p < 55 ? "warn" : "ok"} /></div>`}
        <${UI.Coach} k="entretien" s=${s} />
        <${UI.DossierSide} s=${s} cs=${cs} ctx="entretien" />
      </div>
      <div className="call-main">
        ${libreCall && phase !== "advice" && html`<${UI.CallLibre} s=${s} cs=${cs} call=${call} nom=${who.nom || c.prenom} api=${api} fmt=${(x) => CR.fmt(x || "", v)} topics=${topics} onGeste=${geste} onTemps=${(m) => setElapsed((e) => e + m)} onPatience=${patienceLibre} onAsked=${(id) => { setAsked((a) => (a.has(id) ? a : new Set(a).add(id))); const tp = (call.topics || []).find((x) => x.id === id); if (tp && tp.unlock && tp.unlock.length) setUnlocked((u0) => { const n = new Set(u0); tp.unlock.forEach((x) => n.add(x)); return n; }); }} closing=${phase === "closing"} onClose=${() => setPhase("closing")} onConseil=${() => setPhase("advice")} adviceOn=${adviceOpts.length > 0} />`}
        <div className="transcript" aria-live="polite" hidden=${!!libreCall}>
          ${lines.map((L, li) => html`<div key=${li} className=${cx("tline", "who-" + L.who)}>
            <span className="tl-who pix">${L.who === "client" ? (who.nom || c.prenom).toUpperCase() : L.who === "you" ? "VOUS" : ""}</span>
            <span className="tl-body">${L.segs.map((seg, si) => {
              if (L.who === "client" && li === typing.line && si > typing.seg) return null;
              const txt = segText(seg);
              const partial = L.who === "client" && li === typing.line && si === typing.seg;
              const shown = partial ? txt.slice(0, typing.ch) : txt;
              const isNoted = cs.notes.some((n) => n.text === txt.trim());
              return html`<span key=${si} className=${cx("seg", L.who === "client" && "noteable", isNoted && "seg-noted")} onClick=${() => L.who === "client" && note(seg)} tabIndex=${L.who === "client" ? 0 : -1} onKeyDown=${(e) => { if (e.key === "Enter" && L.who === "client") note(seg); }}>${shown}${" "}</span>`;
            })}${L.cut ? html`<span className="cut">— vous coupez la parole</span>` : null}</span>
          </div>`)}
          <div ref=${endRef}></div>
        </div>
        ${talking && !libreCall && html`<button className="link small" onClick=${skip}>Afficher toute la réponse</button>`}
        ${phase === "talk" && !libreCall && html`<div className="questions">
          ${topics.map((t) => html`<button key=${t.id} className="q-btn" onClick=${() => ask(t)}><span>${CR.fmt(t.q, v)}</span><span className="small muted">${t.cost || 3} min</span></button>`)}
          <div className="q-end">
            ${adviceOpts.length > 0 && html`<${Btn} onClick=${() => setPhase("advice")} disabled=${talking}>Conclure par des conseils</${Btn}>`}
            <${Btn} kind=${topics.length === 0 ? "primary" : ""} onClick=${() => setPhase("closing")} disabled=${talking}>${topics.length === 0 ? "Terminer" : "Raccrocher"}</${Btn}>
          </div>
        </div>`}
        ${phase === "advice" && html`<div className="advice">
          <p className="small">Que dites-vous à ${c.prenom} avant de terminer ? (quatre conseils au plus)</p>
          ${adviceOpts.map((a) => html`<label key=${a.id} className="check"><input type="checkbox" id=${"adv-" + a.id} checked=${advice.includes(a.id)} disabled=${!advice.includes(a.id) && advice.length >= 4} onChange=${(e) => setAdvice(e.target.checked ? advice.concat(a.id) : advice.filter((x) => x !== a.id))} /> ${a.t}</label>`)}
          <${Btn} kind="primary" onClick=${() => { setElapsed(elapsed + 2 + advice.length); setPhase("closing"); }}>Le dire et terminer</${Btn}>
        </div>`}
        ${phase === "closing" && html`<div className="closing">
          ${!talking || libreCall ? html`<p className="muted">${CR.fmt(call.close || "D'accord. Merci. J'attends de vos nouvelles.", v)}</p><${Btn} kind="primary" onClick=${finish}>Terminer</${Btn}>` : html`<p className="muted small">…</p>`}
        </div>`}
      </div>
    </div>`;
  };
  CR.FLOW_HOOKS._prospectExpire = (api) => {
    const cs = api.cs;
    if (cs.status !== "prospect") return;
    CR.closeCase(api.s, cs, { type: "lost-lead" });
    api.log(`${CR.clientName(cs)} a pris un autre avocat en attendant votre réponse.`, "bad");
  };
  function buildCall(s, cs, key) {
    const def = CR.caseDef(cs);
    const calls = def.calls || {};
    if (key === "intake") return Object.assign({ advice: true }, typeof calls.intake === "function" ? calls.intake(CR.api(s, cs)) : calls.intake);
    if (key === "followup") {
      const base = (typeof calls.intake === "function" ? calls.intake(CR.api(s, cs)) : calls.intake) || {};
      const fu = calls.followup || {};
      return { opening: fu.opening || ["Allô ? Ah, maître. Vous avez oublié quelque chose ?"], topics: (base.topics || []).concat(fu.topics || []), start: (base.start || []).concat(fu.start || []), patience: Math.max(30, (base.patience || 100) * 0.55), advice: true, close: fu.close || "D'accord. Appelez-moi si besoin.", adviceList: base.adviceList };
    }
    if (calls[key]) return typeof calls[key] === "function" ? calls[key](CR.api(s, cs)) : calls[key];
    if (key === "parloir") return genericParloir(s, cs);
    return genericUpdateCall(s, cs);
  }
  function genericUpdateCall(s, cs) {
    const worried = cs.trust < 45;
    const def = CR.caseDef(cs);
    return {
      opening: [worried ? "Enfin. J'attendais votre appel. Où en est mon dossier ?" : "Bonjour maître ! Des nouvelles ?"],
      topics: [
        { id: "u_explain", q: "Je vous explique où en est la procédure et ce qui va se passer maintenant.", a: ["D'accord. Ça m'aide, merci de m'expliquer.", "Donc j'attends la prochaine étape ?"], cost: 8, tag: "good", fx: { trust: 6 }, unlock: ["u_question"] },
        { id: "u_reassure", q: "Tout se passe bien. Ne vous inquiétez pas.", a: ["Bon… si vous le dites."], cost: 2, tag: "neutral", fx: { trust: 1 } },
        { id: "u_promise", q: "Entre nous, je suis certain qu'on va gagner.", a: ["C'est vrai ? Ça me soulage énormément."], cost: 2, tag: "neutral", fx: { trust: 3, flags: { promesse: true } } },
        { id: "u_question", q: "Du nouveau de votre côté ? Travail, logement, quelqu'un vous a contacté ?", a: def.updateNews ? def.updateNews(CR.api(s, cs)) : ["Non, rien de nouveau."], cost: 4, tag: "good" },
      ],
      start: ["u_explain", "u_reassure", "u_promise"], patience: 80, advice: true, close: "Merci de votre appel. À bientôt.", label: "Point sur le dossier",
    };
  }
  function genericParloir(s, cs) {
    const c = CR.client(cs);
    return {
      scene: "parloir", kind: "meet", label: "Parloir", baseCost: 45,
      opening: [`${c.prenom} s'assoit en face de vous. « Maître. Enfin. Ici, les journées sont longues. »`],
      topics: [
        { id: "p_proc", q: "Je vous explique où en est la procédure.", a: ["D'accord. Merci de venir jusqu'ici."], cost: 10, tag: "good", fx: { trust: 6 } },
        { id: "p_cond", q: "Comment se passe la détention ?", a: ["Cellule à trois. On tient. Je travaille pas, je m'ennuie."], cost: 5, tag: "good", fx: { trust: 3 } },
        { id: "p_famille", q: "Votre famille vous rend visite ?", a: ["Ma mère vient le samedi. Elle vous appelle souvent, je sais."], cost: 4, tag: "good" },
      ],
      start: ["p_proc", "p_cond", "p_famille"], patience: 90, advice: true, close: "« Revenez vite, maître. »",
      onEnd: (api) => { const x = api.s.detenus.find((d) => d.caseId === api.cs.id); if (x) x.humeur = CR.clamp(x.humeur + 12, 0, 100); },
    };
  }

  // =================================================================== CONTRÔLE DES CONFLITS
  UI.ConflictScene = ({ s, cs, onDone }) => {
    const [res] = useState(() => { const r = CR.conflictCheck(s, cs); bump(); return r; });
    return html`<${UI.Modal} title="Contrôle des conflits d'intérêts" onClose=${onDone} footer=${html`<${Btn} kind="primary" onClick=${onDone}>Terminé</${Btn}>`}>
      ${res.searched.length === 0 ? html`<div className="banner warn">Vous avez cherché… personne. Aucune partie adverse n'est notée dans votre carnet. Sans nom, le contrôle ne prouve rien.</div>` : html`<p>Recherche dans vos dossiers : ${res.searched.map((n, i) => html`<${Tag} key=${i}>${n}</${Tag}>`)}</p>`}
      ${res.searched.length > 0 && (res.hits.length ? html`<div className="banner bad"><strong>Conflit d'intérêts.</strong> ${res.hits.map((h) => html`<div key=${h.caseId}>${h.name} — votre client dans <em>${h.title}</em>.</div>`)}<p className="small">Vous ne pouvez pas assister la victime et défendre l'auteur dans la même affaire, ni deux personnes aux intérêts opposés.</p></div>` : html`<div className="banner ok">Aucun conflit parmi vos clients actuels et en attente.</div>`)}
    </${UI.Modal}>`;
  };

  // =================================================================== HONORAIRES
  UI.NegScene = ({ s, cs, onDone }) => {
    const def = CR.caseDef(cs);
    const c = CR.client(cs);
    const types = (def.honoraires && def.honoraires.types) || ["forfait", "temps"];
    const [n] = useState(() => { const x = cs.neg && !cs.neg.done ? cs.neg : CR.negStart(s, cs); CR.spend(s, 10, "meet", { busy: true }); bump(); return x; });
    const [type, setType] = useState(types[0]);
    const [rate, setRate] = useState(Math.round(n.fairTaux * 1.15 / 5) * 5);
    const [provision, setProvision] = useState(1500);
    const [amount, setAmount] = useState(Math.round(n.fairForfait * 1.15 / 50) * 50);
    const [plan, setPlan] = useState(false);
    const [complement, setComplement] = useState(0);
    const [last, setLast] = useState(null);
    const [, force] = useState(0);
    const resultat = (def.honoraires && def.honoraires.resultat) || "relaxe";
    const offer = () => type === "temps" ? { type, rate, provision, plan } : { type, amount, plan, complement: complement || 0, resultat };
    const propose = (action) => { const r = CR.negPropose(s, cs, offer(), action); setLast(r); CR.spend(s, 5, "meet", { busy: true }); bump(); force((x) => x + 1); };
    const split = () => {
      if (!n.lastCounter) return;
      if (type === "temps") setRate(Math.round((rate + n.lastCounter.rate) / 2 / 5) * 5);
      else setAmount(Math.round((amount + n.lastCounter.amount) / 2 / 50) * 50);
    };
    const look = CR.px.clientLook(c, cs.def);
    const negExpr = last && last.verdict === "leave" ? "angry" : last && last.verdict === "accept" ? "smile" : "neutral";
    const staged = UI.planOk && UI.planOk("rdv");
    return html`<div className=${cx("scene neg-scene", staged && "staged")}>
      ${staged ? html`<${UI.Plan} name="rdv" opts=${{ min: s.min, rain: CR.dec.rainy(s), look, expr: negExpr, you: CR.youLook(s) }} />
      <div className="stg-shade"></div>
      <div className="stg-top"><div className="stg-cap"><span className="pix">Honoraires · rendez-vous au cabinet</span><span className="stg-sub">${c.prenom} ${c.nom} · ${CR.fmtTime(s.min)}</span></div></div>` : html`<div className="neg-stage"><${UI.SceneCanvas} name="conference" opts=${{ min: s.min, client: look, clientExpr: negExpr }} /></div>`}
      <${UI.Coach} k="honoraires" s=${s} />
      <div className="neg-body">
        <div className="neg-talk">
          <h3>Honoraires — ${c.prenom} ${c.nom}</h3>
          <div className="neg-hist">
            <p className="muted small">${c.prenom} s'installe en face de vous. ${def.honoraires && def.honoraires.intro ? def.honoraires.intro : ""}</p>
            ${n.history.map((h, i) => html`<p key=${i} className=${"nh-" + h.who}><span className="pix">${h.who === "you" ? "VOUS" : c.prenom.toUpperCase()}</span> ${h.text}</p>`)}
          </div>
          <div className="patience"><span className="pix">Patience</span><${Meter} value=${Math.max(0, n.patience)} max=${5} tone=${n.patience <= 1 ? "bad" : "ok"} /></div>
          <${Carnet} cs=${cs} title="Vos notes sur le client" />
        </div>
        <div className="neg-form">
          ${n.done ? html`<div className=${cx("banner", n.result === "accept" ? "ok" : "bad")}>${n.result === "accept" ? html`<strong>Accord :</strong> ${CR.offerText(cs.fee)} Prochaine étape : la convention d'honoraires.` : "Le client est parti."}</div><${Btn} kind="primary" onClick=${onDone}>Fermer</${Btn}>` : html`
          ${types.length > 1 && html`<div className="chips">${types.map((t) => html`<button key=${t} className=${cx("chip", type === t && "on")} onClick=${() => setType(t)}>${{ forfait: "Forfait", temps: "Temps passé" }[t]}</button>`)}</div>`}
          <p className="small muted">Pour un avocat de votre réputation, à Paris : environ ${CR.money(n.fairTaux * 0.9)} à ${CR.money(n.fairTaux * 1.1)} HT de l'heure ; ${CR.money(n.fairForfait * 0.9)} à ${CR.money(n.fairForfait * 1.1)} HT au forfait pour ce type de dossier.</p>
          ${type === "temps" && html`<div className="form">
            <label htmlFor="ng-rate">Taux horaire : <strong>${CR.money(rate)} HT</strong></label><input id="ng-rate" type="range" min="100" max="450" step="5" value=${rate} onChange=${(e) => setRate(+e.target.value)} />
            <label htmlFor="ng-prov">Provision : <strong>${CR.money(provision)}</strong></label><input id="ng-prov" type="range" min="0" max="10000" step="250" value=${provision} onChange=${(e) => setProvision(+e.target.value)} />
            <label className="check"><input type="checkbox" id="ng-plan1" checked=${plan} onChange=${(e) => setPlan(e.target.checked)} /> Règlement échelonné</label>
          </div>`}
          ${type === "forfait" && html`<div className="form">
            <label htmlFor="ng-amt">Forfait : <strong>${CR.money(amount)} HT</strong></label><input id="ng-amt" type="range" min="300" max="20000" step="50" value=${amount} onChange=${(e) => setAmount(+e.target.value)} />
            <label className="check"><input type="checkbox" id="ng-plan2" checked=${plan} onChange=${(e) => setPlan(e.target.checked)} /> Payable en trois fois plutôt que moitié à la signature</label>
            <label htmlFor="ng-comp">Honoraire de résultat complémentaire (en cas de ${resultat}) : <strong>${complement ? CR.money(complement) + " HT" : "aucun"}</strong></label><input id="ng-comp" type="range" min="0" max="5000" step="250" value=${complement} onChange=${(e) => setComplement(+e.target.value)} />
            <p className="small muted">Un honoraire fixé uniquement selon le résultat est interdit (pacte de quota litis) ; en complément d'un forfait, il est licite.</p>
          </div>`}
          <div className="neg-btns">
            <${Btn} kind="primary" onClick=${() => propose()}>Proposer</${Btn}>
            <${Btn} onClick=${() => propose("explain")} disabled=${n.explained}>Expliquer les honoraires</${Btn}>
            ${n.lastCounter && html`<${Btn} onClick=${split}>Couper la poire en deux</${Btn}>`}
            <${Btn} kind="ghost" onClick=${() => { n.done = true; n.result = "leave"; cs.flags.negFailed = true; bump(); onDone(); }}>Renoncer</${Btn}>
          </div>
          ${last && last.gesture && html`<p className="small warn-txt">${last.gesture === "forfait" ? "Il voudrait un forfait." : last.gesture === "plan" ? "Il voudrait payer en plusieurs fois." : ""}</p>`}
          `}
        </div>
      </div>
    </div>`;
  };

  // =================================================================== RÉDACTION
  UI.DraftScene = ({ s, cs, tplKey, onDone }) => {
    const tpl = useMemo(() => CR.getTpl(s, cs, tplKey), [cs.id, tplKey]);
    const [filled, setFilled] = useState({});
    const [checks, setChecks] = useState({});
    const [active, setActive] = useState(null);
    const [confirm, setConfirm] = useState(false);
    // saisie des articles : les citations des choix et des points cochés se tapent (feuille de route, n° 11)
    const saisie = CR.saisieOn(s);
    const specs = useMemo(() => (saisie && tpl ? CR.tplCites(tpl) : {}), [cs.id, tplKey, saisie]);
    const [cites, setCites] = useState({});
    const [activeCite, setActiveCite] = useState(null);
    if (!tpl) return html`<div className="scene"><${Empty}>Gabarit indisponible.</${Empty}><${Btn} onClick=${onDone}>Fermer</${Btn}></div>`;
    const slots = tpl.slots || {};
    const slotIds = Object.keys(slots).filter((k) => slots[k].type !== "auto");
    const nextBlank = (from, f) => slotIds.slice(slotIds.indexOf(from) + 1).find((k) => !f[k]) || null;
    const pickNote = (n) => { if (!active || slots[active].type !== "fact") return; const f = Object.assign({}, filled, { [active]: n.id }); setFilled(f); setActive(nextBlank(active, f)); };
    // citations en attente : celles des choix retenus et des points cochés
    const wanted = Object.keys(specs).filter((k) => { const [kind, a, b] = k.split(":"); return kind === "sl" ? filled[a] === b : (checks[a] || []).includes(b); });
    const citeBlanks = wanted.filter((k) => !cites[k]).length;
    const blanks = slotIds.filter((k) => !filled[k] && !slots[k].optional).length + citeBlanks;
    const file = () => {
      const used = saisie ? Object.fromEntries(wanted.map((k) => [k, cites[k] || null]).filter(([, v]) => v)) : null;
      const res = CR.fileDraft(s, cs, tplKey, filled, checks, { cites: used });
      const attend = tpl.depot || (CR.CANAUX && CR.CANAUX.gere(s, tplKey));
      CR.toast(s, attend ? (CR.CANAUX && CR.CANAUX.gere(s, tplKey) ? `Rédigé : ${tpl.title}. Il reste à le transmettre.` : `Rédigé : ${tpl.title}. Il reste à le déposer (${tpl.depotLabel || "au greffe"}).`) : `${tpl.dirLabel || "Envoyé"} : ${tpl.title}`, attend ? "warn" : "info");
      // la correction des articles ratés, montrée après
      for (const c of Object.values(res.cites || {})) if (c.g !== "ok" && c.attendu) CR.toast(s, `Article : ${c.tape ? CR.citeLabel(c.tape) + " — " : ""}l'${CR.citeLabel(c.attendu)} était attendu (${CR.CITE_LABEL[c.g].toLowerCase()}).`, c.g === "voisin" || c.g === "code" || c.g === "aide" ? "warn" : "bad");
      bump();
      onDone();
    };
    const citeBtn = (k, sp, on) => html`<button key=${k} className=${cx("slot", "cite-slot", activeCite === k && "on", cites[k] && "filled")} disabled=${!on} onClick=${(e) => { e.preventDefault(); e.stopPropagation(); if (!cites[k]) setActiveCite(k); }}>${cites[k] ? CR.citeWritten(Object.assign({}, sp, { before: "", after: "" }), cites[k].ref) : `${sp.raw ? sp.mot : "fondement : art."} …${sp.phrase ? " " + sp.phrase : ""}`}</button>`;
    const optText = (k, txt, on) => { const sp = specs[k]; if (!sp) return txt; return html`<span>${sp.before}${citeBtn(k, sp, on)}${sp.after}</span>`; };
    const renderPart = (part, i) => {
      if (typeof part === "string") return html`<span key=${i}>${part}</span>`;
      const sl = slots[part.s];
      if (!sl) return null;
      if (sl.type === "auto") return html`<span key=${i} className="auto">${sl.value}</span>`;
      const val = filled[part.s];
      let txt = null;
      if (sl.type === "fact" && val) { const n = cs.notes.find((x) => x.id === val); txt = n ? n.text : null; }
      if (sl.type === "choice" && val) {
        const o = sl.options.find((x) => x.v === val);
        const k = `sl:${part.s}:${val}`;
        if (o && specs[k]) { const sp = specs[k]; return html`<span key=${i}>${sp.before && html`<button className=${cx("slot", "filled", active === part.s && "on")} onClick=${() => setActive(part.s)}>${sp.before}</button>`}${citeBtn(k, sp, true)}${sp.after && html`<button className=${cx("slot", "filled", active === part.s && "on")} onClick=${() => setActive(part.s)}>${sp.after}</button>`}</span>`; }
        txt = o ? o.t : null;
      }
      return html`<button key=${i} className=${cx("slot", active === part.s && "on", txt && "filled")} onClick=${() => { setActive(part.s); setActiveCite(null); }}>${txt || `[${sl.label}]`}</button>`;
    };
    const act = active ? slots[active] : null;
    const ac = activeCite && specs[activeCite];
    return html`<div className="scene draft-scene">
      <div className="draft-doc">
        <${UI.Coach} k="redaction" s=${s} />
        <div className="draft-bar"><strong>${tpl.title}</strong><span className="small muted">${CR.fmtDuration(Math.round((tpl.time || 60) * CR.fatigueMult(s)))}${tpl.cost ? ` · ${CR.money(tpl.cost)}` : ""}</span></div>
        <article className="paper paper-draft">
          ${tpl.caption && (tpl.caption.court || tpl.caption.left) && html`<div className="caption"><div className="cap-court">${tpl.caption.court}</div>${(tpl.caption.left || tpl.caption.right) && html`<div className="cap-box"><div className="cap-left">${tpl.caption.left}</div><div className="cap-right">${tpl.caption.right}</div></div>`}</div>`}
          <h3 className="paper-title">${tpl.title}</h3>
          ${tpl.to && html`<p className="paper-to">À : ${tpl.to}</p>`}
          ${(tpl.body || []).map((p, i) => html`<p key=${i}>${p.map(renderPart)}</p>`)}
          ${(tpl.checks || []).map((ch) => html`<div key=${ch.id} className="draft-checks">
            <p><strong>${ch.heading || ch.label}</strong></p>
            ${ch.options.length === 0 && html`<p className="small muted">(Rien à proposer : ${ch.id === "moyens" ? "relevez d'abord des irrégularités dans les pièces" : "aucune option disponible"}.)</p>`}
            ${ch.options.map((o) => {
              const can = !o.needs || [].concat(o.needs).some((nd) => CR.inHand(s, cs, nd));
              const on = (checks[ch.id] || []).includes(o.id);
              const k = `ck:${ch.id}:${o.id}`;
              return html`<label key=${o.id} className=${cx("check", !can && "off")}><input type="checkbox" id=${"ck-" + ch.id + "-" + o.id} disabled=${!can} checked=${on} onChange=${(e) => { const cur = checks[ch.id] || []; setChecks(Object.assign({}, checks, { [ch.id]: e.target.checked ? cur.concat(o.id) : cur.filter((x) => x !== o.id) })); if (e.target.checked && specs[k] && !cites[k]) { setActiveCite(k); setActive(null); } }} /> ${optText(k, o.t, on)}${!can ? html` <span className="small muted">(absent de votre carnet)</span>` : null}</label>`;
            })}
          </div>`)}
          <p className="paper-sign">Me ${s.player.prenom} ${s.player.nom}</p>
        </article>
      </div>
      <div className="draft-side">
        ${ac ? html`<div className="slot-panel">
          <${UI.Coach} k="saisie" s=${s} />
          <${UI.CiteInput} key=${activeCite} s=${s} expect=${ac.expect} label=${ac.fondement ? "Fondement : citez l'article" : "Citez l'article"} onDone=${(r) => { setCites(Object.assign({}, cites, { [activeCite]: r })); setActiveCite(null); }} onSkip=${() => setActiveCite(null)} />
          <p className="small muted">${CR.citeMasked(ac)}</p>
        </div>` : act ? html`<div className="slot-panel">
          <span className="pix">Remplir : ${act.label}</span>
          ${act.type === "fact" ? html`<p className="small muted">Choisissez la ligne de votre carnet qui va ici.</p>
            <${Carnet} s=${s} cs=${cs} pickable=${true} selected=${filled[active]} onPick=${pickNote} hide=${true} />
            ${filled[active] && html`<button className="link small" onClick=${() => setFilled(Object.assign({}, filled, { [active]: null }))}>Effacer ce blanc</button>`}`
          : html`<div className="choices">${(CR.libre(s) ? (() => { const r = CR.seeded(cs.id + ":blanc:" + active + ":" + act.label); return act.options.map((o) => ({ o, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.o); })() : act.options).map((o) => { const sp = specs[`sl:${active}:${o.v}`]; return html`<button key=${o.v} className=${cx("choice", filled[active] === o.v && "on")} onClick=${() => { const f = Object.assign({}, filled, { [active]: o.v }); setFilled(f); const k = `sl:${active}:${o.v}`; if (specs[k] && !cites[k]) { setActive(null); setActiveCite(k); } else setActive(nextBlank(active, f)); }}>${sp ? CR.citeMasked(sp) : o.t}</button>`; })}</div>`}
        </div>` : html`<div className="slot-panel"><p className="muted">Cliquez un blanc dans le document pour le remplir.${saisie && Object.keys(specs).length ? " Les articles se tapent : cliquez « art. … »." : ""}</p><${UI.DossierSide} s=${s} cs=${cs} ctx="redaction" /></div>`}
        ${wanted.some((k) => cites[k]) && html`<div className="cite-recap small"><span className="pix">Articles cités</span>${wanted.filter((k) => cites[k]).map((k) => html`<div key=${k}><${UI.CiteDone} s=${s} r=${cites[k]} /></div>`)}</div>`}
        <div className="draft-actions">
          ${blanks > 0 && html`<p className="small warn-txt">${CR.plural(blanks, "blanc")} non rempli${blanks > 1 ? "s" : ""}${citeBlanks ? ` (dont ${CR.plural(citeBlanks, "article")} à citer)` : ""}.</p>`}
          ${!confirm ? html`<${Btn} kind="primary" onClick=${() => (blanks > 0 ? setConfirm(true) : file())}>${tpl.depot ? "Terminer la rédaction" : tpl.dirLabel === "Signée" ? "Faire signer" : "Envoyer"}</${Btn}>` : html`<${Btn} kind="danger" onClick=${file}>Valider avec des blancs</${Btn}>`}
          ${tpl.depot && html`<p className="small muted">Ensuite : dépôt ${tpl.depotLabel ? "— " + tpl.depotLabel : "au greffe"}. L'acte prend date au dépôt.</p>`}
          <${Btn} kind="ghost" onClick=${onDone}>Plus tard</${Btn}>
        </div>
      </div>
    </div>`;
  };

  // =================================================================== DÉCISION (options génériques)
  UI.DecideScene = ({ s, cs, hookKey, onDone, onScene }) => {
    const spec = CR.runHook(s, cs, hookKey, {}) || { title: "Décider", options: [] };
    return html`<${UI.Modal} title=${spec.title} onClose=${onDone}>
      ${spec.text && (Array.isArray(spec.text) ? spec.text.map((t, i) => html`<p key=${i}>${t}</p>`) : html`<p>${spec.text}</p>`)}
      <div className="decide">${spec.options.map((o, i) => html`<button key=${i} className=${cx("decide-opt", o.danger && "danger")} disabled=${o.disabled} onClick=${() => { const r = CR.runHook(s, cs, o.hook, o.data || {}); bump(); if (r && r.scene && onScene) onScene(Object.assign({ caseId: cs.id, type: r.scene }, r)); else onDone(); }}><strong>${o.t}</strong>${o.sub && html`<span className="small muted">${o.sub}</span>`}</button>`)}</div>
    </${UI.Modal}>`;
  };

  // =================================================================== SE DÉCHARGER
  UI.WithdrawScene = ({ s, cs, onDone }) => {
    const next = cs.hearings.find((h) => !h.attended && !h.missed && !h.canceled && h.day >= s.day);
    return html`<${UI.Modal} title="Se décharger du dossier" onClose=${onDone} footer=${html`<${Btn} onClick=${onDone}>Garder le dossier</${Btn}><${Btn} kind="danger" onClick=${() => { CR.withdraw(s, cs); bump(); onDone(); }}>Se décharger</${Btn}>`}>
      <p>Vous écrivez au client pour mettre fin à votre intervention, lui rappeler ses échéances et lui remettre son dossier.</p>
      ${next && html`<p className="warn-txt">Prochaine audience : ${CR.fmtDate(next.day, "dow")}. Se décharger à la veille d'une audience compromet la défense.</p>`}
      <p className="small muted">Le client ne sera pas content. Les honoraires des diligences accomplies restent dus.</p>
    </${UI.Modal}>`;
  };

  // =================================================================== MENTOR
  UI.MentorScene = ({ s, onDone }) => {
    const [said, setSaid] = useState(null);
    const acteurs = [...new Set(CR.activeCases(s).flatMap((c) => Object.values(c.actors || {})))].map((id) => CR.acteur(id)).filter((a) => a && a.role !== "opj");
    const ask = (a) => {
      CR.spend(s, 15, "call");
      const p = CR.PROFILS[a.profil];
      s.flags["connait_" + a.id] = true;
      setSaid(s.reps.confreres >= 18 ? `${a.nom} ? ${a.blurb} ${p.tip}` : `${a.nom}… je ne connais pas bien. Demandez à la salle des avocats.`);
      bump();
    };
    const tips = [
      "Lisez les procès-verbaux de garde à vue avec une montre à côté : heure de l'interpellation, heure du placement, heure de la notification des droits, heure de l'avis à l'avocat.",
      "Un délai d'appel se compte en jours, pas en jours ouvrables. Seul le dernier jour glisse s'il tombe un week-end ou un jour férié.",
      "En comparution immédiate, le dossier de personnalité se constitue en une heure. Un contrat de travail et une attestation d'hébergement valent toutes les plaidoiries.",
      "La partie civile demande réparation. Si vous réclamez de la prison, le président vous le fera remarquer.",
      "Une nullité se soulève avant de parler du fond. Après, c'est trop tard.",
      "Ce que vous voyez en garde à vue est couvert par le secret. Même la famille qui paie n'a pas à le savoir.",
      "Ne promettez jamais un résultat à un client. Promettez du travail.",
      "Les fonds des clients passent par la CARPA. J'ai vu de très bons confrères perdre leur robe pour un mois de loyer.",
    ];
    return html`<${UI.Modal} title=${CR.MENTOR.nom} onClose=${onDone}>
      <div className="mentor">
        <${Portrait} look=${Object.assign({}, CR.px.lookFrom("mentor", CR.MENTOR.look), CR.MENTOR.look)} size=${72} />
        <div>
          <p className="quote">« ${said || "Mon cher confrère ! Que puis-je pour vous ?"} »</p>
          <div className="decide">
            ${acteurs.map((a) => html`<button key=${a.id} className="decide-opt" onClick=${() => ask(a)}><strong>Que savez-vous de ${a.nom} ?</strong><span className="small muted">${CR.ROLE_LABEL[a.role]} · ${a.lieu}</span></button>`)}
            <button className="decide-opt" onClick=${() => { CR.spend(s, 10, "call"); setSaid(CR.R.pick(s, tips)); if (s.flags.varenneMois !== CR.monthIndex(s.day)) { s.flags.varenneMois = CR.monthIndex(s.day); CR.rep(s, "confreres", 1); } bump(); }}><strong>Demander un conseil de méthode</strong><span className="small muted">Elle ne vous donnera jamais la réponse.</span></button>
          </div>
        </div>
      </div>
    </${UI.Modal}>`;
  };

  // =================================================================== BÂTONNIER
  UI.GrievanceScene = ({ s, gid, onDone }) => {
    const g = s.disc.open.find((x) => x.id === gid);
    if (!g) return null;
    const pick = (q) => { CR.answerGrievance(s, gid, q); bump(); onDone(); };
    return html`<${UI.Modal} title="Explications au bâtonnier" onClose=${onDone}>
      <p className="quote">${g.text}</p>
      <p className="small muted">Explications attendues pour le ${CR.fmtDate(g.respondBy, "long")}.</p>
      <div className="decide">
        <button className="decide-opt" onClick=${() => pick("candide")}><strong>Des explications complètes, pièces à l'appui</strong><span className="small muted">Ce qui s'est passé, ce que vous avez changé. Un après-midi de travail.</span></button>
        <button className="decide-opt" onClick=${() => pick("defensive")}><strong>Une contestation brève</strong><span className="small muted">Vous contestez, sans plus.</span></button>
        <button className="decide-opt danger" onClick=${() => pick("accuse")}><strong>Mettre en cause le client</strong><span className="small muted">Expliquer que le client était difficile et peu fiable.</span></button>
      </div>
    </${UI.Modal}>`;
  };

  // =================================================================== TRAJET
  UI.TravelDialog = ({ s, to, onGo, onClose, then }) => {
    const pl = CR.placeOf(s, to);
    const tm = CR.travelTime(s, s.at, to, "metro"), tt = CR.travelTime(s, s.at, to, "taxi");
    const arrive = (m) => s.min + Math.round(m * CR.fatigueMult(s));
    const openM = CR.isOpen(pl, s.day, arrive(tm)), openT = CR.isOpen(pl, s.day, arrive(tt));
    return html`<${UI.Modal} title=${`Aller : ${pl.nom}`} onClose=${onClose}>
      <p className="muted small">${pl.sous}${pl.horaires ? ` · ${CR.HORAIRES[pl.horaires].label}` : ""}</p>
      ${then && html`<p>Pour : ${then}</p>`}
      <div className="decide">
        <button className="decide-opt" onClick=${() => onGo("metro")}><strong>En métro · ${tm} min</strong><span className="small muted">Arrivée vers ${CR.fmtTime(arrive(tm))}${pl.horaires ? (openM ? " — ouvert" : " — fermé à votre arrivée") : ""}</span></button>
        <button className="decide-opt" onClick=${() => onGo("taxi")}><strong>En taxi · ${tt} min · ${CR.money(CR.taxiCost(s, s.at, to))}</strong><span className="small muted">Arrivée vers ${CR.fmtTime(arrive(tt))}${pl.horaires ? (openT ? " — ouvert" : " — fermé à votre arrivée") : ""}</span></button>
      </div>
    </${UI.Modal}>`;
  };

  // =================================================================== DÉBRIEF
  UI.DebriefModal = ({ s, cs, onClose }) => html`<${UI.Modal} title=${`Dossier clos — ${CR.caseTitle(s, cs)}`} onClose=${onClose} wide footer=${html`<${Btn} kind="primary" onClick=${onClose}>Ranger la fiche au classeur</${Btn}>`}>
    <${UI.DebriefBody} s=${s} cs=${cs} />
  </${UI.Modal}>`;
})();
