/* La Permanence — l'audience à la française.
   Ordre de parole (art. 460), exceptions in limine litis (art. 385), questions en demandant la parole (art. 442-1),
   constitution avant les réquisitions (art. 421), plaidoirie, dernier mot, délibéré motivé, récusation des jurés (art. 298). */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html, Icon, Portrait, Meter, Paper, Btn, Tag, Empty, cx } = UI;
  const { useState, useEffect, useRef, useMemo } = React;
  const bump = () => CR.store.bump();
  const R = CR.R;

  // =================================================================== La main du joueur : notes, pièces, textes enregistrés dans le dossier
  // Seuls les textes enregistrés dans ce dossier pendant la préparation sont à portée de main (feuille de route, n° 8).
  // En saisie des articles, une carte de texte ne montre que son sujet : le numéro se cite de mémoire (n° 11).
  CR.handOf = function (s, cs) {
    const hand = [];
    for (const n of cs.notes) hand.push({ id: n.fact || "note:" + n.id, label: n.text, kind: "note" });
    const def = CR.caseDef(cs);
    for (const c of cs.cards) { if (CR.lib(c)) continue; const cd = def.cards && def.cards[c]; hand.push({ id: c, label: cd ? cd.label : c, kind: "piece" }); }
    const hide = CR.saisieOn(s);
    for (const id of CR.pinnedTexts(s, cs)) { const l = CR.lib(id); const jp = !!(CR.JP && CR.JP[id]); if (l) hand.push({ id, label: hide && (CR.refOfId(id) || jp) ? l.titre : `${l.cite} — ${l.titre}`, kind: "texte", ref: CR.refOfId(id), jp }); }
    return hand;
  };
  const POIDS_AUD = { ok: 0, code: 0.3, aide: 0.3, voisin: 0.6, faux: 1.5, absent: 1.5 };

  // =================================================================== Moteur de script
  function useScript(s, cs, steps) {
    const api = useMemo(() => CR.api(s, cs), [cs.id]);
    const [stack, setStack] = useState(() => [{ list: steps, i: 0 }]);
    const [cur, setCur] = useState(null);
    const [log, setLog] = useState([]);
    const st = useRef({ played: new Set(), angle: null, limine: [], questions: [], interjects: { ok: 0, miss: 0 }, cred: 0, flags: {}, plaidoirie: null, dernierMot: null, decision: null }).current;
    function advance(stk) {
      stk = stk.map((x) => Object.assign({}, x));
      while (stk.length) {
        const top = stk[stk.length - 1];
        if (top.i >= top.list.length) { stk.pop(); continue; }
        const step = top.list[top.i];
        top.i++;
        if (step == null) continue;
        if (step.if) { const ok = step.if(api, st); const br = ok ? step.then : step.else; if (br && br.length) stk.push({ list: br, i: 0 }); continue; }
        if (step.do) { const r = step.do(api, st); if (Array.isArray(r) && r.length) stk.push({ list: r, i: 0 }); continue; }
        if (step.fx && Object.keys(step).length === 1) { applyFx(s, cs, st, step.fx); continue; }
        if (step.end) { stk = []; break; }
        setCur(Object.assign({ _k: Math.random() }, step));
        return stk;
      }
      setCur({ _end: true });
      return stk;
    }
    useEffect(() => { setStack((stk) => advance(stk)); }, []);
    const next = () => setStack((stk) => advance(stk));
    const push = (list) => setStack((stk) => advance(stk.concat([{ list, i: 0 }])));
    // chaque réplique fait parler son auteur dans la salle (bouche, geste, bulle)
    const addLog = (e) => { if (e && e.who && e.who !== "sys" && CR.dec && CR.dec.cue) CR.dec.cue(e.who, 1200 + Math.min(2400, String(e.t || "").length * 14)); setLog((l) => l.concat([e]).slice(-160)); };
    return { api, cur, st, next, push, log, addLog };
  }
  // Les incidents que la défense soulève d'elle-même (refonte : la fin des choix d'incidents à options). Chaque affaire
  // inscrit, au fil des débats, ceux qu'elle permet (CR.AUD.incident) ; la liste offerte à l'avocat est la même partout.
  CR.AUD = CR.AUD || {};
  CR.AUD.incident = (st, id, reg) => { st.incidents = st.incidents || {}; if (!st.incidents[id]) st.incidents[id] = Object.assign({ used: false }, reg); };
  const INCIDENTS = [
    { id: "presc", label: "La prescription de l'action publique", say: () => "« Le tribunal ne peut juger ces faits : l'action publique est prescrite (art. 8 et 9-1 du code de procédure pénale). »", sans: "(Le substitut feuillette la procédure.) Les faits sont récents, monsieur le président : la question de la prescription ne se pose pas." },
    { id: "fisc", label: "L'irrecevabilité des poursuites : pas de plainte préalable de l'administration", say: () => "« Les poursuites sont irrecevables : elles exigent une plainte ou une dénonciation préalable de l'administration fiscale (art. L. 228 du livre des procédures fiscales). »", sans: "Il ne s'agit pas d'une infraction fiscale, maître. Les poursuites n'exigent aucune plainte préalable." },
    { id: "recidive", label: "L'état de récidive légale n'est pas constitué", motifs: true, say: (m) => `« La récidive n'est pas constituée : ${String((CR.GEN2 && CR.GEN2.VICES && CR.GEN2.VICES[m]) || "").replace(/^./, (c) => c.toLowerCase())}. »`, sans: "Le prévenu n'est pas poursuivi en état de récidive légale, maître." },
  ];
  CR.AUD.INCIDENTS = INCIDENTS;
  function applyFx(s, cs, st, fx) {
    if (!fx) return;
    if (fx.cred) st.cred += fx.cred;
    if (fx.flags) Object.assign(st.flags, fx.flags);
    if (fx.cards) fx.cards.forEach((c) => { CR.addCard(cs, c); st.played.add(c); });
    if (fx.play) [].concat(fx.play).forEach((c) => st.played.add(c));
    if (fx.note) CR.addNote(s, cs, { text: fx.note.t, fact: fx.note.f, src: "court" });
    if (fx.trust) CR.trust(s, cs, fx.trust);
    if (fx.rep) for (const [k, v] of Object.entries(fx.rep)) CR.rep(s, k, v);
    if (fx.csFlags) Object.assign(cs.flags, fx.csFlags);
    if (fx.memo && CR.MEM) [].concat(fx.memo).forEach((m) => CR.MEM.noter(s, m.id, m.d, m.r));
  }

  // Noms à l'audience
  const WHO = (s, cs, who, name) => {
    const a = (r) => { const x = CR.acteur(cs.actors[r]); return x ? x.nom : null; };
    if (name) return name;
    if (who === "president") { const x = CR.acteur(cs.actors.president); return x ? (x.nom.startsWith("Mme") ? "La présidente" : "Le président") : "Le président"; }
    if (who === "parquet") { const x = CR.acteur(cs.actors.parquet); return x ? (x.role === "parquet" && x.id === "pq_ag" ? "L'avocat général" : x.nom.startsWith("Mme") ? "La procureure" : "Le procureur") : "Le ministère public"; }
    if (who === "adverse") return a("adverse") || "Le confrère adverse";
    if (who === "client") return CR.clientName(cs);
    if (who === "you") return `Me ${s.player.nom}`;
    if (who === "greffier") return "La greffière";
    if (who === "huissier") return "L'huissier d'audience";
    if (who === "jld") { const x = CR.acteur(cs.actors.jld); return x ? (x.nom.startsWith("Mme") ? "La juge" : "Le juge") : "Le juge"; }
    if (who === "ji") { const x = CR.acteur(cs.actors.ji); return x ? (x.nom.startsWith("Mme") ? "La juge d'instruction" : "Le juge d'instruction") : "Le juge"; }
    if (who === "sys") return "";
    if (who === "prevenu") return "Le prévenu";
    if (who === "victime") return "La victime";
    if (who === "temoin") return "Le témoin";
    return who;
  };

  // Visages au prononcé : soulagement, honte ou larmes selon la décision
  CR.verdictMood = function (cs, dec) {
    if (!dec || dec.coupable == null) return null;
    const ferme = dec.peine && /emprisonnement|réclusion/i.test(dec.peine.texte || "") && !/sursis/i.test(dec.peine.texte || "");
    return { prev: !dec.coupable ? "soulage" : ferme ? "honte" : "worried", vic: !dec.coupable ? "cry" : dec.civil && !dec.civil.renvoi ? "soulage" : "worried" };
  };

  // La salle où se tient l'audience : décor, personnages de l'affaire (decor-salles.js)
  CR.courtRoom = function (s, cs, decor, title) {
    const sc = decor.scene || "salle", t = String(title || "");
    // la salle suit la juridiction : chambre du conseil de la chambre de l'instruction, cour criminelle départementale
    // (cinq magistrats, pas de jury), salle du tribunal pour enfants ; sinon le décor demandé par l'affaire
    let name = sc === "assises" ? "assises" : sc === "cabinet_ji" ? "cabinet_ji" : "salle";
    if (["chins", "ccd", "tpe"].includes(sc)) name = sc;
    else if (/chambre de l'instruction/i.test(t)) name = "chins";
    else if (/cour criminelle/i.test(t)) name = "ccd";
    else if (/tribunal pour enfants/i.test(t)) name = "tpe";
    const A = (r) => { const a = CR.acteur(cs.actors[r]); return a ? CR.px.acteurLook(a) : null; };
    const pres = CR.acteur(cs.actors.president) || CR.acteur(cs.actors.jld) || CR.acteur(cs.actors.ji);
    const jures = decor.jures || 0;
    const looks = { president: decor.judge || (pres ? CR.px.acteurLook(pres) : null), parquet: A("parquet"), greffier: CR.px.lookFrom("greffiere" + cs.id, { g: "f", age: 44 }), client: CR.px.clientLook(CR.client(cs), cs.def), you: CR.youLook(s), adverse: A("adverse"), jures: decor.jureLooks || null };
    if (decor.sansParquet) delete looks.parquet; // audience où le ministère public n'est pas représenté (intérêts civils, art. 464)
    Object.keys(looks).forEach((k) => { if (looks[k] == null) delete looks[k]; });
    const opts = { looks, camp: cs.camp === "pc" ? "pc" : "defense", box: !!decor.box, jures, juges: decor.juges || (name === "ccd" || (name === "assises" && /criminelle/i.test(t)) ? 5 : name === "cabinet_ji" ? 1 : 3), rouge: name === "assises" && jures > 0, adverse: !!cs.actors.adverse, victime: !!decor.victime };
    opts.sig = CR.dec.sigOf(opts);
    return { name, opts };
  };

  // =================================================================== Scène d'audience
  UI.AudienceScene = ({ s, cs, steps, title, sub, decor, onEnd }) => {
    const { api, cur, st, next, push, log, addLog } = useScript(s, cs, steps);
    const [typed, setTyped] = useState(0);
    const [phaseSt, setPhaseSt] = useState({ k: null, p: "init" });
    const phase = cur && phaseSt.k === cur._k ? phaseSt.p : "init";
    const setPhase = (p) => setPhaseSt({ k: cur ? cur._k : null, p });
    const [timer, setTimer] = useState(0);
    const [court, setCourt] = useState("");
    const [verdict, setVerdict] = useState(null);
    const [citeCard, setCiteCard] = useState(null);
    const [jpCard, setJpCard] = useState(null);
    const [mainOuverte, setMainOuverte] = useState(false);
    const [incOuvert, setIncOuvert] = useState(null); // null | "menu" | "recidive"
    const logRef = useRef(null);
    const cps = 36 * CR.textSpeedMult(s);
    const fatigue = CR.fatigueMult(s);
    const v = CR.caseVars(s, cs);
    const T = (x) => CR.fmt(typeof x === "function" ? x(api, st) : x || "", v);
    const pres = CR.acteur(cs.actors.president) || CR.acteur(cs.actors.jld) || CR.acteur(cs.actors.ji);
    const presProf = pres ? CR.PROFILS[pres.profil] : CR.PROFILS.formaliste;
    useEffect(() => { logRef.current && (logRef.current.scrollTop = logRef.current.scrollHeight); }, [log.length, typed]);

    useEffect(() => {
      if (!cur) return;
      setTyped(0);
      setCiteCard(null);
      if (cur._end) { setPhase("done"); return; }
      if (cur.choose) { setPhase("choose"); setTimer(cur.timer ? cur.timer * 1000 / fatigue : 0); if (cur.prompt) addLog({ who: "sys", t: T(cur.prompt) }); return; }
      if (cur.card) { if (!CR.libre(s)) addLog({ who: "sys", t: T(cur.card.prompt) }); setPhase("card"); setTimer((cur.card.window || 12000) / fatigue); return; }
      if (cur.limine) { setPhase("limine"); return; }
      if (cur.questions) { setPhase("questions"); return; }
      if (cur.parole) { setPhase("parole"); return; }
      if (cur.constitution) { setPhase("constitution"); return; }
      if (cur.plaidoirie) { setPhase("plaidoirie"); return; }
      if (cur.dernierMot) { setPhase("dernier"); return; }
      if (cur.delibere) { setPhase("delibere"); return; }
      if (cur.requisitions) { const q = cur.requisitions(api, st); cs.vars.requisitionsFond = true; for (const l of q) addLog(l); setPhase("pause"); setTimeout(next, 400); return; }
      setPhase("type");
      // (pas sur une didascalie ni sur une réplique de l'avocat, qui passent sans pause de frappe)
      if (st.incidentEnAttente && cur.who !== "you" && cur.who !== "sys" && cur.t != null) { const x = st.incidentEnAttente; st.incidentEnAttente = null; setTimeout(() => souleverRef.current && souleverRef.current(x.inc, x.motif, true), 0); }
    }, [cur && cur._k]);

    const lineText = cur && (cur.t != null) ? T(cur.t) : "";
    useEffect(() => {
      if (phase !== "type" || !cur || cur._end) return;
      if (cur.who === "you" || cur.who === "sys") { finishLine(); return; }
      if (typed >= lineText.length) { finishLine(); return; }
      const t = setTimeout(() => setTyped((n) => Math.min(lineText.length, n + Math.max(1, Math.round(cps / 30)))), 1000 / 30);
      return () => clearTimeout(t);
    }, [typed, phase, cur && cur._k]);
    function canInterject() { return !!(cur && cur.interject && (!cur.interject.need || [].concat(cur.interject.need).some((n) => CR.inHand(s, cs, n)))); }
    function finishLine() {
      if (canInterject()) { setPhase("window"); setTimer((cur.interject.window || 4500) / fatigue); return; }
      const pause = Math.min(2400, 500 + lineText.length * 13) / CR.textSpeedMult(s);
      setPhase("pause");
      setTimeout(() => { addLog({ who: cur.who, t: lineText, name: cur.name }); if (cur.fx) applyFx(s, cs, st, cur.fx); if (cur.signal) (CR.libre(s) || addLog({ who: "sys", t: CR.ACT.signal(api, cur.signal) })); next(); }, cur.who === "you" || cur.who === "sys" ? 250 : pause);
    }
    useEffect(() => {
      if (!["window", "card", "choose"].includes(phase) || timer <= 0 || citeCard || jpCard) return;
      const t = setTimeout(() => setTimer((x) => x - 100), 100);
      return () => clearTimeout(t);
    }, [timer, phase]);
    useEffect(() => {
      if (timer > 0) return;
      if (phase === "window") windowExpired();
      if (phase === "card" && cur && cur.card) cardResolve(null);
      if (phase === "choose" && cur && cur.timer) chooseTimeout();
    }, [timer]);

    function windowExpired() {
      addLog({ who: cur.who, t: lineText, name: cur.name });
      st.interjects.miss++;
      const m = cur.interject.miss;
      if (m && m.fx) applyFx(s, cs, st, m.fx);
      bump();
      if (m && m.then) { push(m.then); return; }
      next();
    }
    // Demander la parole
    function demanderParole() {
      if (!cur || !["type", "window", "pause"].includes(phase)) return;
      setTyped(lineText.length);
      if (canInterject()) {
        addLog({ who: cur.who, t: lineText, name: cur.name });
        addLog({ who: "you", t: T(cur.interject.label || `${CR.ACT.titre(api)}, si vous me permettez : ce n'est pas ce que dit le dossier.`) });
        st.interjects.ok++;
        const o = cur.interject.ok || {};
        applyFx(s, cs, st, Object.assign({ cred: 2 }, o.fx));
        (CR.libre(s) || addLog({ who: "sys", t: CR.ACT.signal(api, "bon") }));
        bump();
        if (o.then) { push(o.then); return; }
        next();
        return;
      }
      addLog({ who: cur.who || "sys", t: lineText.slice(0, Math.max(10, typed)) + "—", name: cur.name });
      addLog({ who: "you", t: `${CR.ACT.titre(api)}, si je puis me permettre—` });
      const tol = R.next(s) < (presProf.interrupt || 0.2);
      if (tol) { addLog({ who: "president", t: "Brièvement, maître." }); applyFx(s, cs, st, { cred: -1 }); }
      else { addLog({ who: "president", t: presProf === CR.PROFILS.formaliste ? "Maître. Vous aurez la parole en temps utile. On ne coupe pas dans cette salle." : "Vous aurez la parole, maître." }); applyFx(s, cs, st, { cred: -3 }); }
      bump();
      next();
    }
    function choose(opt) {
      setTimer(0);
      if (opt.say || opt.t) addLog({ who: "you", t: T(opt.say || opt.t) });
      applyFx(s, cs, st, opt.fx);
      if (opt.reply) addLog({ who: opt.replyWho || "president", t: T(opt.reply) });
      if (opt.signal) (CR.libre(s) || addLog({ who: "sys", t: CR.ACT.signal(api, opt.signal) }));
      bump();
      if (opt.then && opt.then.length) { push(opt.then); return; }
      next();
    }
    function chooseTimeout() {
      addLog({ who: "president", t: "Maître ? Nous vous attendons." });
      applyFx(s, cs, st, { cred: -2 });
      const opts = (cur.choose || []).filter((o) => !o.need || CR.inHand(s, cs, o.need));
      const fb = opts[opts.length - 1];
      if (fb) choose(fb); else next();
    }
    // refonte (A4 ter) : en mode libre, produire ou citer est un geste toujours disponible ; hors du moment où cela sert,
    // le président arrête l'avocat (rien n'annonce plus le moment)
    function geste(card) {
      setMainOuverte(false);
      if (phase === "card") { playCard(card); return; }
      addLog({ who: "you", t: card.kind === "texte" ? `(Vous citez : ${card.label})` : `(Vous produisez : ${card.label})` });
      addLog({ who: "president", t: presProf === CR.PROFILS.formaliste ? "Maître, ce n'est pas le moment. Le tribunal vous entendra en temps utile." : "Pas maintenant, maître. Nous y viendrons." });
      applyFx(s, cs, st, { cred: -1 });
      st.gestesHorsMoment = (st.gestesHorsMoment || 0) + 1;
      bump();
    }
    // Soulever un incident : l'avocat se lève pendant qu'un autre parle ; l'incident inscrit par l'affaire produit ses
    // effets ; sans fondement au dossier, le président demande sur quoi il repose ; sans objet, il est écarté
    function soulever(inc, motif, force) {
      setIncOuvert(null);
      if (!cur) return;
      // entre deux répliques (pause, fenêtre), l'incident attend la réplique suivante : le bouton ne clignote plus
      if (phase !== "type" && !force) { st.incidentEnAttente = { inc, motif }; return; }
      setTyped(lineText.length);
      addLog({ who: cur.who || "sys", t: lineText, name: cur.name });
      if (cur.fx) applyFx(s, cs, st, cur.fx);
      addLog({ who: "you", t: inc.say(motif) });
      const reg = (st.incidents || {})[inc.id];
      st.played.add("incident:" + inc.id);
      if (!reg || reg.used) {
        addLog({ who: inc.id === "recidive" || inc.id === "fisc" ? "president" : "parquet", t: reg && reg.used ? "Le tribunal a déjà entendu ce moyen, maître." : inc.sans });
        if (!reg) addLog({ who: "president", t: "L'incident est écarté." });
        applyFx(s, cs, st, { cred: -2 }); st.incidentsVains = (st.incidentsVains || 0) + 1; bump(); next(); return;
      }
      if (reg.need && !CR.inHand(s, cs, reg.need)) { addLog({ who: "president", t: "Qu'est-ce qui, dans le dossier, permet de le dire, maître ?" }); applyFx(s, cs, st, { cred: -2 }); bump(); next(); return; }
      reg.used = true;
      const then = inc.motifs ? reg.motifs && reg.motifs[motif] : reg.then;
      bump();
      if (then && then.length) push(then); else next();
    }
    const souleverRef = useRef(null);
    souleverRef.current = soulever;
    // Une carte de texte, en saisie : on tape son numéro (le temps est suspendu pendant la saisie)
    function playCard(card) {
      if (card.jp) { if (CR.saisieOn(s)) setJpCard(card); else jpResolve(card, { id: card.id, g: "ok" }); return; }
      if (card.kind === "texte" && card.ref && CR.saisieOn(s)) { setCiteCard(card); return; }
      cardResolve(card);
    }
    // Un arrêt cité (code annoté) : mal cité, il ne vaut rien ; dépassé, le président le relève
    function jpResolve(card, r) {
      setJpCard(null);
      if (r.g !== "ok") CR.citeMiss(s, cs, { attendu: { code: "JP", num: card.id.slice(3) }, tape: r.tape || r.id ? { code: "JP", num: String(r.tape || r.id).slice(3) } : null, g: r.g, ctx: "Audience" });
      if (r.g === "faux" || r.g === "absent" || r.g === "voisin") { cardResolve({ id: "cite:faux", kind: "texte", label: r.id ? CR.jpCite(r.id) : "un arrêt" }); return; }
      if (r.g === "aide") { st.cred -= POIDS_AUD.aide; addLog({ who: "sys", t: `(Correction : c'était ${CR.jpCite(card.id)}.)` }); }
      const j = CR.JP[card.id];
      if (j && j.depasse) {
        addLog({ who: "you", t: `(Vous citez : ${CR.jpCite(card.id)})` });
        addLog({ who: "president", t: j.depasse.par ? `Maître, cette solution a été abandonnée : ${CR.jpCite(j.depasse.par)}. Le tribunal ne peut pas vous suivre sur ce fondement.` : `Maître, le droit a changé depuis cet arrêt : ${j.depasse.loi}. Le tribunal ne peut pas vous suivre sur ce fondement.` });
        applyFx(s, cs, st, { cred: -3, flags: { jpDepassee: true } });
        st.played.add(card.id);
        cs.vars.jpDepasses = (cs.vars.jpDepasses || []).concat(card.id);
        const c = cur.card;
        applyFx(s, cs, st, c.miss && c.miss.fx);
        if (c.miss && c.miss.then) { push(c.miss.then); bump(); return; }
        bump(); next();
        return;
      }
      cardResolve(Object.assign({}, card, { label: CR.jpCite(card.id) }));
    }
    function citeCardDone(card, r) {
      setCiteCard(null);
      if (r.g !== "ok") CR.citeMiss(s, cs, { attendu: r.attendu || card.ref, tape: r.tape || r.ref, g: r.g, ctx: "Audience" });
      if (r.g === "faux" || r.g === "absent") { cardResolve({ id: "cite:faux", kind: "texte", label: r.ref ? CR.citeLabel(r.ref) : "un texte" }); return; }
      st.cred -= POIDS_AUD[r.g] || 0;
      if (r.g !== "ok") addLog({ who: "sys", t: `(Correction : c'était l'${CR.citeLabel(card.ref)}.)` });
      cardResolve(Object.assign({}, card, { label: CR.citeLabel(r.ref) }));
    }
    function cardResolve(card) {
      const c = cur.card;
      const ok = card && c.accept.includes(card.id);
      if (card) { addLog({ who: "you", t: card.kind === "texte" ? `(Vous citez : ${card.label})` : `(Vous produisez : ${card.label})` }); st.played.add(card.id); }
      if (ok) { applyFx(s, cs, st, Object.assign({ cred: 2 }, c.ok && c.ok.fx)); (CR.libre(s) || addLog({ who: "sys", t: CR.ACT.signal(api, "bon") })); if (c.ok && c.ok.then) { push(c.ok.then); bump(); return; } }
      else {
        if (card) { addLog({ who: "president", t: "Je ne vois pas le rapport, maître." }); applyFx(s, cs, st, { cred: -2 }); }
        applyFx(s, cs, st, c.miss && c.miss.fx);
        if (c.miss && c.miss.then) { push(c.miss.then); bump(); return; }
      }
      bump();
      next();
    }
    const finish = () => onEnd(Object.assign({ played: [...st.played] }, st));

    const hand = CR.handOf(s, cs);
    const speaker = cur && !cur._end ? cur.who : null;
    const room = useMemo(() => CR.courtRoom(s, cs, decor || {}, title), [cs.id, title, JSON.stringify(decor || {})]);
    const typing = ["type", "window", "pause"].includes(phase);
    const roomOpts = Object.assign({}, room.opts, { min: s.min, rain: CR.dec.rainy(s), season: CR.dec.seasonOf(s), speaker: typing && speaker !== "sys" ? speaker : null, court, verdict, turn: ["choose", "card", "limine", "questions", "constitution", "plaidoirie"].includes(phase) });
    // refonte : l'audience se joue dans le plan plein cadre (CR.plans.audience) ; sinon l'ancienne salle
    const staged = UI.planOk && UI.planOk("audience");
    return html`<div className=${cx("scene court-scene", staged && "staged")} data-phase=${phase}>
      ${staged ? html`<${UI.Plan} name="audience" opts=${Object.assign({}, roomOpts, { room: room.name })} />
      <div className="stg-top"><div className="stg-cap"><span className="pix">${title}</span><span className="stg-sub">${sub ? sub + " · " : ""}${CR.fmtTime(s.min)}</span></div></div>` : html`<div className="court-stage">
        <${UI.Room} name=${room.name} opts=${roomOpts} />
        <div className="court-title"><span className="pix">${title}</span>${sub && html`<span className="small">${sub}</span>`}</div>
      </div>`}
      <${UI.Coach} k="audience" s=${s} />
      <div className="court-body">
        <div className="court-left">
        <div className="transcript court-log" ref=${logRef} aria-live="polite">
          ${log.map((l, i) => html`<div key=${i} className=${cx("tline", "who-" + l.who)}><span className="tl-who pix">${l.who === "sys" ? "" : WHO(s, cs, l.who, l.name).toUpperCase()}</span><span className="tl-body">${l.t}</span></div>`)}
          ${cur && !cur._end && ["type", "window", "pause"].includes(phase) && cur.t != null && html`<div className=${cx("tline", "live", "who-" + (speaker || "sys"))}><span className="tl-who pix">${speaker && speaker !== "sys" ? WHO(s, cs, speaker, cur.name).toUpperCase() : ""}</span><span className="tl-body">${lineText.slice(0, typed)}${typed < lineText.length ? html`<span className="caret">▌</span>` : ""}</span></div>`}
        </div>
        <details className="court-dossier" open=${!staged}><summary className="pix">Votre dossier à la barre — carnet et textes enregistrés</summary><${UI.DossierSide} s=${s} cs=${cs} ctx="audience" /></details>
        </div>
        <div className="court-controls">
          ${phase === "window" && !CR.libre(s) && html`<div className="window-bar"><div className="wb-fill" style=${{ width: Math.max(0, timer / ((cur.interject.window || 4500) / fatigue)) * 100 + "%" }}></div></div>`}
          ${["type", "window", "pause"].includes(phase) && !CR.libre(s) && html`<div className="court-btns">
            <button className="parole" onClick=${demanderParole}>Demander la parole</button>
            <p className="small muted">Quand quelqu'un se trompe sur le dossier. Couper un magistrat sans raison vous coûtera.</p>
          </div>`}
          ${CR.libre(s) && ["type", "window", "pause", "card"].includes(phase) && html`<div className="court-btns gestes-audience">
            ${jpCard ? html`<${UI.JPInput} key=${jpCard.id} s=${s} attendu=${jpCard.id} label=${"Citez l'arrêt : " + jpCard.label} onDone=${(r) => jpResolve(jpCard, r)} onSkip=${() => setJpCard(null)} />` : citeCard ? html`<${UI.CiteInput} key=${citeCard.id} s=${s} expect=${[citeCard.ref]} label=${"Citez : " + citeCard.label} onDone=${(r) => citeCardDone(citeCard, r)} onSkip=${() => setCiteCard(null)} />` : html`
            <button className="parole" onClick=${phase === "card" ? () => setMainOuverte(true) : demanderParole}>Demander la parole</button>
            <button className="parole produire" onClick=${() => setMainOuverte((x) => !x)}>Produire une pièce ou citer un texte</button>
            ${phase !== "card" && html`<button className="parole incident" onClick=${() => setIncOuvert((x) => (x ? null : "menu"))}>Soulever un incident</button>`}
            ${incOuvert === "menu" && phase !== "card" && html`<div className="hand-cards incidents">${INCIDENTS.map((inc) => html`<button key=${inc.id} className="hcard hk-incident" onClick=${() => (inc.motifs ? setIncOuvert("recidive") : soulever(inc))}>${inc.label}</button>`)}</div>`}
            ${incOuvert === "recidive" && phase !== "card" && html`<div className="hand-cards incidents"><p className="small muted">Pourquoi la récidive n'est-elle pas constituée ?</p>${Object.entries((CR.GEN2 && CR.GEN2.VICES) || {}).map(([k, l]) => html`<button key=${k} className="hcard hk-incident" onClick=${() => soulever(INCIDENTS.find((x) => x.id === "recidive"), k)}>${l}</button>`)}</div>`}
            ${mainOuverte && html`<div className="hand-cards">${hand.length === 0 && html`<p className="small muted">Rien noté, aucun texte enregistré dans ce dossier.</p>`}${hand.map((c, i) => html`<button key=${i} className=${cx("hcard", "hk-" + c.kind)} onClick=${() => geste(c)}><span className="pix">${c.kind === "texte" ? "Texte" : c.kind === "piece" ? "Pièce" : "Note"}</span>${c.label}</button>`)}</div>`}`}
          </div>`}
          ${phase === "choose" && cur && html`<div className="choices court-choices">
            ${cur.timer ? html`<div className="window-bar"><div className="wb-fill" style=${{ width: Math.max(0, timer / (cur.timer * 1000 / fatigue)) * 100 + "%" }}></div></div>` : null}
            ${(() => {
              // refonte (lot 6) : en mode libre, toutes les options s'affichent, dans un ordre mélangé (fixe pour une audience) ;
              // une option que rien n'appuie dans le dossier reçoit une question du président et ne vaut rien
              if (!CR.libre(s)) return cur.choose.filter((o) => !o.need || CR.inHand(s, cs, o.need)).map((o, i) => html`<button key=${i} className="choice" onClick=${() => choose(o)}>${T(o.t)}</button>`);
              const r = CR.seeded(cs.id + ":choix:" + (cur.choose[0] && cur.choose[0].t));
              const opts = cur.choose.map((o) => ({ o, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.o);
              return opts.map((o, i) => html`<button key=${i} className="choice" onClick=${() => { if (o.need && !CR.inHand(s, cs, o.need)) { addLog({ who: "you", t: T(o.t) }); addLog({ who: "president", t: "Qu'est-ce qui, dans le dossier, permet de le dire, maître ? … Bien. Poursuivons." }); applyFx(s, cs, st, { cred: -2 }); const repli = cur.choose.find((x) => !x.need) || cur.choose[cur.choose.length - 1]; if (repli && repli !== o) choose(Object.assign({}, repli, { t: null, reply: null })); else next(); return; } choose(o); }}>${T(o.t)}</button>`);
            })()}
          </div>`}
          ${phase === "card" && !CR.libre(s) && html`<div className="hand">
            <div className="window-bar urgent"><div className="wb-fill" style=${{ width: Math.max(0, timer / ((cur.card.window || 12000) / fatigue)) * 100 + "%" }}></div></div>
            <span className="pix">Produire une pièce ou citer un texte — ou laisser passer</span>
            ${jpCard ? html`<${UI.JPInput} key=${jpCard.id} s=${s} attendu=${jpCard.id} label=${"Citez l'arrêt : " + jpCard.label} onDone=${(r) => jpResolve(jpCard, r)} onSkip=${() => setJpCard(null)} />` : citeCard ? html`<${UI.CiteInput} key=${citeCard.id} s=${s} expect=${[citeCard.ref]} label=${"Citez : " + citeCard.label} onDone=${(r) => citeCardDone(citeCard, r)} onSkip=${() => setCiteCard(null)} />` : html`<div className="hand-cards">${hand.length === 0 && html`<p className="small muted">Votre main est vide : rien noté, aucun texte enregistré dans ce dossier.</p>`}${hand.map((c, i) => html`<button key=${i} className=${cx("hcard", "hk-" + c.kind)} onClick=${() => playCard(c)}><span className="pix">${c.kind === "texte" ? "Texte" : c.kind === "piece" ? "Pièce" : "Note"}</span>${c.label}</button>`)}</div>`}
            <${Btn} kind="ghost" small onClick=${() => cardResolve(null)}>Laisser passer</${Btn}>
          </div>`}
          ${phase === "limine" && html`<${Limine} s=${s} cs=${cs} api=${api} st=${st} addLog=${addLog} next=${next} push=${push} cur=${cur} />`}
          ${phase === "questions" && html`<${Questions} s=${s} cs=${cs} api=${api} st=${st} addLog=${addLog} next=${next} cur=${cur} />`}
          ${phase === "parole" && UI.ConfrontParole && html`<${UI.ConfrontParole} s=${s} cs=${cs} api=${api} st=${st} addLog=${addLog} next=${next} cur=${cur} />`}
          ${phase === "constitution" && html`<${Constitution} s=${s} cs=${cs} api=${api} st=${st} addLog=${addLog} next=${next} cur=${cur} />`}
          ${phase === "plaidoirie" && html`<${Plaidoirie} s=${s} cs=${cs} api=${api} st=${st} addLog=${addLog} next=${next} cur=${cur} hand=${hand} />`}
          ${phase === "dernier" && html`<${DernierMot} s=${s} cs=${cs} api=${api} st=${st} addLog=${addLog} next=${next} cur=${cur} />`}
          ${phase === "delibere" && html`<${Delibere} s=${s} cs=${cs} api=${api} st=${st} addLog=${addLog} next=${next} cur=${cur} setCourt=${setCourt} setVerdict=${setVerdict} inRoom=${room.name !== "cabinet_ji"} cour=${["assises", "ccd", "chins"].includes(room.name)} />`}
          ${phase === "done" && html`<div className="court-done"><p className="muted">${(decor && decor.fin) || "L'huissier appelle l'affaire suivante."}</p><${Btn} kind="primary" onClick=${finish}>Sortir de la salle</${Btn}></div>`}
        </div>
      </div>
    </div>`;
  };

  // ------------------------------------------------------------------ In limine litis
  function Limine({ s, cs, api, st, addLog, next, push, cur }) {
    const L = cur.limine;
    const p = cs.proc;
    const deposes = p.moyens.filter((m) => m.vehicle === "conclusions");
    const dejaFlags = new Set(p.moyens.map((m) => m.flag));
    const oraux = cs.issues.filter((i) => !dejaFlags.has(i.flag || "faux_" + i.id));
    const [sel, setSel] = useState([]);
    const dispense = CR.PROC.dispense385(cs);
    // saisie : le fondement de chaque exception soulevée oralement se cite de mémoire (n° 11)
    const saisie = CR.saisieOn(s);
    const expectOf = (i) => { const irr = i.flag && CR.IRREG[i.flag]; return irr ? (irr.textes || []).filter((id) => id !== "CPP_802" && (CR.TEXTES || {})[id]).map(CR.refOfId).filter(Boolean) : []; };
    const [lcites, setLcites] = useState({});
    const [citing, setCiting] = useState(null);
    const valider = () => {
      if (saisie) for (const id of sel) {
        const i = cs.issues.find((x) => x.id === id);
        const ex = i ? expectOf(i) : [];
        if (!ex.length) continue;
        const r = lcites[id];
        const g = r ? r.g : "absent";
        if (r) addLog({ who: "you", t: `(Au visa de l'${CR.citeLabel(r.ref)}.)` });
        if (g !== "ok") CR.citeMiss(s, cs, { attendu: (r && r.attendu) || ex[0], tape: r ? r.tape || r.ref : null, g, ctx: "Exception de nullité" });
        if (g === "faux" || g === "absent") addLog({ who: "president", t: r ? "Cet article ne dit pas cela, maître. Sur quel fondement soulevez-vous cette nullité ?" : "Sur quel fondement, maître ?" });
        st.cred -= POIDS_AUD[g] || 0;
      }
      if (deposes.length) addLog({ who: "you", t: `${CR.ACT.titre(api)}, in limine litis, je soutiens les conclusions aux fins de nullité déposées au greffe le ${CR.fmtDate(deposes[0].day, "long")}.` });
      const flags = sel.map((id) => { const i = cs.issues.find((x) => x.id === id); return i ? i.flag || "faux_" + i.id : null; }).filter(Boolean);
      if (flags.length) {
        addLog({ who: "you", t: `${deposes.length ? "J'y ajoute, oralement," : `${CR.ACT.titre(api)}, in limine litis, je soulève`} ${CR.plural(flags.length, "exception")} de nullité.` });
        CR.PROC.soulever(api, { flags, vehicle: "oral", day: s.day, grief: true });
      }
      if (!deposes.length && !flags.length) addLog({ who: "you", t: "Pas d'exception, monsieur le président." });
      st.limine = p.moyens.slice();
      const recev = p.moyens.filter((m) => !m.decision);
      if (recev.length) {
        const irr = recev.filter((m) => !m.recevable);
        addLog({ who: "parquet", t: irr.length ? "Le ministère public soulève l'irrecevabilité de l'exception : elle n'a pas été déposée au greffe dans le délai de l'article 385. Sur le fond, il s'oppose à la nullité." : "Le ministère public s'oppose à la demande de nullité ; à tout le moins, qu'elle soit jointe au fond." });
        addLog({ who: "president", t: L.joindre === false ? "Le tribunal va statuer immédiatement." : "Le tribunal joint l'incident au fond. Nous statuerons sur le tout par une même décision." });
        if (L.joindre === false) {
          const res = CR.PROC.statuerNullites(api, CR.profil(cs.actors.president));
          for (const m of res) addLog({ who: "president", t: m.decision === "annule" ? "Le tribunal fait droit à l'exception. " + (m.motifDecision || "") : m.decision === "irrecevable" ? "L'exception est irrecevable. " + m.motif : "L'exception est rejetée." });
        }
      }
      if (L.then) push(L.then); else next();
      bump();
    };
    return html`<div className="limine">
      <${UI.Coach} k="limine" s=${s} />
      <span className="pix">In limine litis — avant toute défense au fond</span>
      ${deposes.length > 0 ? html`<p className="small">Conclusions déposées au greffe : ${CR.plural(deposes.length, "moyen")}, le ${CR.fmtDate(deposes[0].day, "long")}.</p>` : html`<p className="small muted">Aucune conclusion de nullité déposée au greffe.${dispense ? " Vous êtes dispensé du délai de trois jours (comparution immédiate ou convocation à moins de vingt jours)." : ""}</p>`}
      ${oraux.length > 0 && html`<p className="small">Soulever oralement :</p>${oraux.map((i) => { const ex = saisie ? expectOf(i) : []; return html`<div key=${i.id}><label className="check"><input type="checkbox" id=${"lim-" + i.id} checked=${sel.includes(i.id)} onChange=${(e) => { setSel(e.target.checked ? sel.concat(i.id) : sel.filter((x) => x !== i.id)); if (e.target.checked && ex.length && !lcites[i.id]) setCiting(i.id); }} /> ${i.text.length > 140 ? i.text.slice(0, 137) + "…" : i.text}</label>
        ${ex.length > 0 && sel.includes(i.id) && (lcites[i.id] ? html`<p className="small cite-line">Fondement : <${UI.CiteDone} s=${s} r=${lcites[i.id]} /></p>` : citing === i.id ? html`<${UI.CiteInput} s=${s} expect=${ex} label="Fondement de la nullité" onDone=${(r) => { setLcites(Object.assign({}, lcites, { [i.id]: r })); setCiting(null); }} onSkip=${() => setCiting(null)} />` : html`<button type="button" className="link small" onClick=${() => setCiting(i.id)}>Citer le fondement : art. …</button>`)}
      </div>`; })}`}
      <${Btn} kind="primary" onClick=${valider}>${sel.length || deposes.length ? "Soulever les exceptions" : "Aucune exception"}</${Btn}>
    </div>`;
  }

  // ------------------------------------------------------------------ Questions (art. 442-1)
  function Questions({ s, cs, api, st, addLog, next, cur }) {
    const Q = cur.questions;
    const [asked, setAsked] = useState([]);
    const max = Q.max || 2;
    const ask = (o) => {
      addLog({ who: "you", t: `${CR.ACT.titre(api)}, je souhaiterais poser une question${Q.to === "client" ? " à mon client" : ""}. — ${o.t}` });
      addLog({ who: Q.who || "client", t: o.a, name: Q.name });
      if (o.f) CR.addNote(s, cs, { text: o.a, fact: o.f, src: "court" });
      applyFx(s, cs, st, o.fx);
      if (o.signal) (CR.libre(s) || addLog({ who: "sys", t: CR.ACT.signal(api, o.signal) }));
      st.questions.push(o.id);
      setAsked(asked.concat(o.id));
      CR.spend(s, 3, "court", { busy: true });
      bump();
    };
    const left = max - asked.length;
    return html`<div className="choices court-choices">
      <span className="pix">${Q.prompt || "Vous pouvez poser des questions"} (${left} restante${left > 1 ? "s" : ""})</span>
      ${left > 0 && Q.options.filter((o) => !asked.includes(o.id) && (!o.need || CR.inHand(s, cs, o.need))).map((o) => html`<button key=${o.id} className="choice" onClick=${() => ask(o)}>${o.t}</button>`)}
      <${Btn} kind="primary" small onClick=${next}>${asked.length ? "Je n'ai plus de questions" : "Pas de question"}</${Btn}>
    </div>`;
  }

  // ------------------------------------------------------------------ Constitution de partie civile à la barre
  function Constitution({ s, cs, api, st, addLog, next }) {
    const deja = cs.proc.pcConstituee;
    const go = (yes) => {
      if (deja) addLog({ who: "you", t: `${CR.ACT.titre(api)}, je me suis constitué partie civile par lettre au nom de ${CR.clientName(cs)} ; je soutiendrai mes conclusions.` });
      else if (yes) { const ctrl = CR.PROC.controle(api, "constitution_pc", {}); if (ctrl.ok) { cs.proc.pcConstituee = true; addLog({ who: "you", t: `${CR.ACT.titre(api)}, je me constitue partie civile au nom de ${CR.clientName(cs)}.` }); addLog({ who: "president", t: "C'est noté." }); } }
      else addLog({ who: "sys", t: "(Vous ne dites rien.)" });
      bump();
      next();
    };
    return html`<div className="choices court-choices">
      <span className="pix">Avant les réquisitions du ministère public</span>
      ${deja ? html`<button className="choice" onClick=${() => go(true)}>Rappeler votre constitution par lettre</button>` : html`<button className="choice" onClick=${() => go(true)}>« Je me constitue partie civile au nom de ${CR.clientName(cs)}. »</button><button className="choice" onClick=${() => go(false)}>(Attendre la fin de l'audience)</button>`}
    </div>`;
  }

  // ------------------------------------------------------------------ Plaidoirie
  function Plaidoirie({ s, cs, api, st, addLog, next, cur, hand }) {
    const P0 = cur.plaidoirie;
    const P1 = Object.assign({}, P0, { args: (P0.args || []).filter((a) => a.id !== "nullite" || cs.issues.length > 0) });
    // anti-répétition (lot 1) : arguments tirés du dossier, variantes, arguments piégés (affaires générées)
    const P = CR.PLAID ? CR.PLAID.preparer(s, cs, P1) : P1;
    const [angle, setAngle] = useState(null);
    const [picked, setPicked] = useState([]);
    const max = P.max || 4;
    // refonte (lot 4b) : le catalogue universel des moyens, le même dans toutes les affaires ; le mode assisté garde la liste préparée
    const cat = CR.libre(s) && CR.PLAID && CR.PLAID.catalogue && ["defense", "pc"].includes(P.role || "defense") ? CR.PLAID.catalogue(P.role || "defense") : null;
    // la conversion voit tous les arguments que l'affaire permet, même ceux que la préparation a écartés faute de pièce en main
    const Ptous = cat ? Object.assign({}, P, { args: P.args.concat((P1.args || []).filter((a) => !P.args.some((b) => b.id === a.id))) }) : P;
    const argOf = (id) => (cat ? CR.PLAID.convertir(s, cs, Ptous, id, st) : P.args.find((a) => a.id === id));
    // version 1.0 : le ton et l'ordre comptent pour la défense et la partie civile à l'audience au fond ; le parquet peut répliquer
    const tonOn = !!(CR.PLAID && CR.PLAID.evaluer) && (!P.role || P.role === "defense" || P.role === "pc");
    const [ton, setTon] = useState("sobre");
    const [rep, setRep] = useState(null);
    const move = (id, d) => { const i = picked.indexOf(id), j = i + d; if (i < 0 || j < 0 || j >= picked.length) return; const p = picked.slice(); p[i] = p[j]; p[j] = id; setPicked(p); };
    const dispo = (a) => !a.cards || a.cards.length === 0 || a.cards.some((c) => CR.inHand(s, cs, c) || st.played.has(c));
    // saisie : un argument appuyé sur un texte demande son numéro d'article (n° 11)
    const saisie = CR.saisieOn(s);
    const libsOf = (a) => (a.cards || []).filter((id) => (CR.TEXTES || {})[id] && CR.refOfId(id));
    const specOf = (a) => { if (!saisie) return null; const l = libsOf(a); return l.length ? CR.citeSpec(a.label, l) || CR.citeSpecIds(l) : null; };
    const [acites, setAcites] = useState({});
    const [citing, setCiting] = useState(null);
    const toggle = (id) => {
      const on = picked.includes(id);
      setPicked(on ? picked.filter((x) => x !== id) : picked.length < max ? picked.concat(id) : picked);
      const a = argOf(id);
      if (!on && picked.length < max && a && (specOf(a) || (cat && saisie && /\(art/.test((cat.flatMap((x) => x[2]).find((u) => u.id === id) || {}).label || ""))) && !acites[id]) setCiting(id);
      if (on && citing === id) setCiting(null);
    };
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const plaider = () => {
      st.angle = angle;
      const args = picked.map((id) => { const a = argOf(id); return a && (cat ? Object.assign({}, a, { _uid: id }) : a); }).filter(Boolean);
      if (P.intro) addLog({ who: "you", t: T(P.intro) });
      let bons = 0, hors = 0;
      const retenus = [];
      const plan = tonOn ? CR.PLAID.plan(args, P.role) : null;
      const res = [];
      for (const a of args) {
        if (plan && plan.subsidiaire === args.indexOf(a)) addLog({ who: "you", t: P.role === "pc" ? "Sur les intérêts civils, maintenant." : "À titre subsidiaire, si le tribunal entrait néanmoins en voie de condamnation :" });
        const sp = specOf(a);
        const libs = libsOf(a);
        // un moyen du catalogue que le dossier ne permet pas, ou qu'aucune pièce n'appuie : le président recadre
        if (a.horsSujet || a.sansPiece) { addLog({ who: "you", t: a.say }); addLog({ who: "president", t: a.sansPiece ? "Qu'est-ce qui, dans le dossier, l'établit, maître ?" : "Je ne vois pas ce qui, dans ce dossier, permet de soutenir cela, maître." }); hors++; res.push({ a, pert: false }); continue; }
        let textOk = true;
        let say = a.say || a.label;
        if (sp) {
          const r = acites[a._uid || a.id];
          const g = r ? r.g : "absent";
          if (r && r.ref) for (const e of sp.expect) say = say.replace(new RegExp(`(art\\.|article)\\s+${esc(CR.numLabel(e))}(?![\\d-])`, "g"), `$1 ${CR.numLabel(r.ref)}`);
          addLog({ who: "you", t: say });
          addLog({ who: "sys", t: r ? `(Vous citez l'${CR.citeLabel(r.ref)}.)` : "(Vous ne citez aucun texte.)" });
          if (g !== "ok") CR.citeMiss(s, cs, { attendu: (r && r.attendu) || sp.expect[0], tape: r ? r.tape || r.ref : null, g, ctx: "Plaidoirie" });
          if (g === "faux" || g === "absent") { textOk = false; addLog({ who: "president", t: r ? "L'article que vous citez ne dit pas cela, maître." : "Sur quel texte, maître ?" }); }
          else if (g !== "ok") addLog({ who: "sys", t: `(Correction : l'${CR.citeLabel(r.attendu || sp.expect[0])}.)` });
          st.cred -= POIDS_AUD[g] || 0;
        } else addLog({ who: "you", t: say });
        const facts = (a.cards || []).filter((c) => !libs.includes(c));
        // un argument qui ne tient que par son texte tombe avec une citation fausse
        if (!textOk && facts.length === 0) { hors++; res.push({ a, pert: false }); (CR.libre(s) || addLog({ who: "sys", t: CR.ACT.signal(api, "mauvais") })); continue; }
        (a.cards || []).filter((c) => CR.inHand(s, cs, c) && (textOk || !libs.includes(c))).forEach((c) => st.played.add(c));
        if (a.play) [].concat(a.play).forEach((c) => st.played.add(c));
        st.played.add("arg:" + a.id);
        retenus.push(a.id);
        const pert = a.pertinent ? a.pertinent(api, st, angle) : a.ok !== false;
        if (pert) bons++; else hors++;
        res.push({ a, pert: !!pert && !a.piege });
        (CR.libre(s) || addLog({ who: "sys", t: CR.ACT.signal(api, pert ? "bon" : "mauvais") }));
        if (a.piege) { addLog({ who: a.qui || "president", t: a.rebut }); st.cred -= 1; CR.PLAID.joue(cs, a); }
      }
      if (CR.PLAID) CR.PLAID.vus(cs, P);
      cs.vars.plaidArgs = Array.from(new Set((cs.vars.plaidArgs || []).concat(retenus)));
      st.plaidoirie = { angle, args: retenus, bons, hors };
      st.cred += bons * 1.5 - hors * 2;
      if (plan) {
        const E = CR.PLAID.evaluer({ api, st, role: P.role, ton, res, plan });
        E.lines.filter((l) => !(CR.libre(s) && l.who === "sys")).forEach((l) => addLog(l)); // mode libre : pas de réaction-signal
        st.cred += E.delta;
        st.plaidoirie.ton = ton; st.plaidoirie.ordre = plan.inversion ? "inverse" : "ok";
        cs.vars.plaidNotes = (cs.vars.plaidNotes || []).concat(E.notes).slice(-8);
      }
      if (P.mixte && P.mixte(angle, picked)) st.angle = "mixte_maladroit";
      CR.spend(s, 15 + args.length * 4, "court", { busy: true });
      const R = plan ? CR.PLAID.replique({ api, st, role: P.role, res }) : null;
      if (R) { addLog(R.line); setRep(R); bump(); return; }
      bump();
      next();
    };
    const repondre = (id) => {
      const F = CR.PLAID.repliqueFin(cs, rep, id);
      F.lines.forEach((l) => addLog(l));
      st.cred += F.delta;
      st.plaidoirie.replique = id;
      cs.vars.plaidNotes = (cs.vars.plaidNotes || []).concat(F.notes).slice(-8);
      CR.spend(s, id === "rien" ? 1 : 4, "court", { busy: true });
      setRep(null); bump(); next();
    };
    const T = (x) => CR.fmt(typeof x === "function" ? x(api, st) : x || "", CR.caseVars(s, cs));
    if (rep) return html`<div className="court-choices replique">
      <span className="pix">Réplique du ministère public — vous avez la parole en dernier (art. 460 CPP)</span>
      <div className="choices">${rep.options.map((o) => html`<button key=${o.id} className="choice" onClick=${() => repondre(o.id)}><strong>${o.t}</strong><span className="small muted"> — ${o.sub}</span></button>`)}</div>
    </div>`;
    const libU = (id) => (cat ? (cat.flatMap((x) => x[2]).find((u) => u.id === id) || {}).label : null);
    const ordre = picked.map((id) => { const a = argOf(id); return a && Object.assign({}, a, { _uid: id, label: libU(id) || a.label }); }).filter(Boolean);
    return html`<div className="plaidoirie">
      <${UI.Coach} k="plaidoirie" s=${s} />
      <span className="pix">${P.titre ? P.titre : P.role === "pc" ? "Plaidoirie de la partie civile" : P.role === "jld" ? "Observations sur la détention" : P.role === "crpc" ? "Discussion avec le procureur" : P.role === "parquet" ? "Observations au parquet" : "Plaidoirie de la défense"}</span>
      ${P.angles && html`<div className="chips">${P.angles.map((a) => html`<button key=${a.id} className=${cx("chip", angle === a.id && "on")} onClick=${() => setAngle(a.id)} title=${a.sub || ""}>${a.t}</button>`)}</div>`}
      ${P.angles && angle && html`<p className="small muted">${(P.angles.find((a) => a.id === angle) || {}).sub || ""}</p>`}
      ${tonOn && html`<div className="ton-pick"><span className="small">Le ton :</span>${CR.PLAID.TONS.map((t) => html`<button key=${t.id} type="button" className=${cx("tonb", ton === t.id && "on")} aria-pressed=${ton === t.id} onClick=${() => setTon(t.id)} title=${t.sub}>${t.t}</button>`)}<span className="small muted">${(CR.PLAID.TONS.find((t) => t.id === ton) || {}).sub}</span></div>`}
      <p className="small">Vos arguments (${picked.length}/${max})${tonOn ? " — l'ordre compte : le principal d'abord, le subsidiaire ensuite" : ", dans l'ordre"} :</p>
      ${cat && CR.TRAV && (() => { const W = cs.travail; const cols = CR.TRAV.COLONNES.map(([k, l]) => [k, l, CR.TRAV.planDe(cs, k)]).filter((x) => x[2].length); return html`<details className="plan-barre" open=${cols.length > 0}>
        <summary>Votre plan de défense${cols.length ? "" : " — vide"}</summary>
        ${cols.length === 0 && html`<p className="small muted">Rien n'a été préparé dans le dossier de travail. Vous plaidez de mémoire.</p>`}
        ${cols.map(([k, l, L]) => html`<div key=${k} className="pb-col"><span className="cat-h">${l}</span>${L.map((m) => html`<div key=${m.id} className="pb-m"><b>${m.titre}</b>${m.annots.map((id) => { const an = CR.TRAV.annot(cs, id); return an && html`<span key=${id} className="pb-c">${an.cote ? an.cote + (an.f ? ", f. " + an.f : "") + " — " : ""}« ${an.t.length > 110 ? an.t.slice(0, 108) + "…" : an.t} »</span>`; })}</div>`)}</div>`)}
      </details>`; })()}
      ${cat && html`<div className="args args-cat">${cat.map(([k, titre, l]) => html`<div key=${k} className="cat-rub"><span className="cat-h">${titre}</span>${l.map((u) => { const kk = picked.indexOf(u.id); const ra = kk >= 0 ? argOf(u.id) : null; const sp = ra && !ra.horsSujet && !ra.sansPiece ? specOf(ra) : null; const lab = saisie ? u.label.replace(/\((art\.|articles?)[^)]*\)/, "(art. …)") : u.label; return html`<div key=${u.id} className="arg-wrap"><button type="button" className=${cx("arg", kk >= 0 && "on")} onClick=${() => toggle(u.id)}>${kk >= 0 && html`<span className="arg-n">${kk + 1}</span>`}<span>${lab}</span></button>
          ${kk >= 0 && /\(art/.test(u.label) && saisie && (acites[u.id] ? html`<p className="small cite-line">Article : <${UI.CiteDone} s=${s} r=${acites[u.id]} /></p>` : citing === u.id ? html`<${UI.CiteInput} s=${s} expect=${sp ? sp.expect : ["__aucun"]} label="Citez l'article" onDone=${(r) => { setAcites(Object.assign({}, acites, { [u.id]: r })); setCiting(null); }} onSkip=${() => setCiting(null)} />` : html`<button type="button" className="link small" onClick=${() => setCiting(u.id)}>Citer l'article : art. …</button>`)}
        </div>`; })}</div>`)}</div>`}
      <div className="args" hidden=${!!cat}>
        ${(cat ? [] : P.args).map((a) => { const ok = dispo(a); const k = picked.indexOf(a.id); const sp = specOf(a); return html`<div key=${a.id} className="arg-wrap"><button className=${cx("arg", k >= 0 && "on", !ok && "off")} disabled=${!ok} onClick=${() => toggle(a.id)}>
          ${k >= 0 && html`<span className="arg-n">${k + 1}</span>`}<span>${sp && sp.raw ? CR.citeMasked(sp) : a.label}</span>${!ok && html`<span className="small muted"> — rien dans votre main pour l'appuyer</span>`}
        </button>
        ${sp && k >= 0 && (acites[a.id] ? html`<p className="small cite-line">${sp.raw ? "Article" : "Fondement"} : <${UI.CiteDone} s=${s} r=${acites[a.id]} /></p>` : citing === a.id ? html`<${UI.CiteInput} s=${s} expect=${sp.expect} label=${sp.raw ? "Citez l'article" : "Fondement : citez l'article"} onDone=${(r) => { setAcites(Object.assign({}, acites, { [a.id]: r })); setCiting(null); }} onSkip=${() => setCiting(null)} />` : html`<button type="button" className="link small" onClick=${() => setCiting(a.id)}>Citer l'article : art. …</button>`)}
        </div>`; })}
      </div>
      ${tonOn && ordre.length > 1 && html`<ol className="plan-ord" aria-label="Votre plan">${ordre.map((a, i) => html`<li key=${a._uid || a.id}><span className="plan-t">${a.label.length > 90 ? a.label.slice(0, 88) + "…" : a.label}</span><span className="plan-b"><button type="button" className="plan-mv" disabled=${i === 0} aria-label="Monter" onClick=${() => move(a._uid || a.id, -1)}>▲</button><button type="button" className="plan-mv" disabled=${i === ordre.length - 1} aria-label="Descendre" onClick=${() => move(a._uid || a.id, 1)}>▼</button></span></li>`)}</ol>`}
      <${Btn} kind="primary" disabled=${(P.angles && !angle) || picked.length === 0} onClick=${plaider}>Plaider</${Btn}>
    </div>`;
  }

  // ------------------------------------------------------------------ Le prévenu a la parole en dernier
  function DernierMot({ s, cs, api, st, addLog, next, cur }) {
    const D = cur.dernierMot;
    const prep = !!cs.flags.prepClient;
    const opts = prep ? D.prepare : null;
    const say = (o) => {
      addLog({ who: "president", t: `${CR.client(cs).prenom ? (CR.client(cs).g === "f" ? "Madame" : "Monsieur") : ""} ${CR.client(cs).nom}, vous avez la parole en dernier.` });
      addLog({ who: "client", t: o.t });
      st.dernierMot = o.id;
      applyFx(s, cs, st, o.fx);
      if (o.signal) (CR.libre(s) || addLog({ who: "sys", t: CR.ACT.signal(api, o.signal) }));
      bump();
      next();
    };
    if (!prep) {
      const o = D.spontane;
      return html`<div className="choices court-choices"><span className="pix">Le dernier mot</span><p className="small muted">Vous n'avez pas préparé ${CR.client(cs).prenom} à ce moment.</p><button className="choice" onClick=${() => say(o)}>Écouter</button></div>`;
    }
    return html`<div className="choices court-choices"><span className="pix">Le dernier mot — vous l'avez préparé</span><p className="small muted">Ce que vous avez convenu ensemble :</p>${opts.map((o) => html`<button key=${o.id} className="choice" onClick=${() => say(o)}>${o.label}</button>`)}</div>`;
  }

  // ------------------------------------------------------------------ Délibéré et décision motivée
  // Mise en scène : le tribunal se retire, la salle attend, « Le tribunal ! », puis le prononcé
  function Delibere({ s, cs, api, st, addLog, next, cur, setCourt, setVerdict, inRoom, cour }) {
    const D = cur.delibere;
    const [dec] = useState(() => {
      const d = CR.runHook(s, cs, D.hook || "decider", { st, played: new Set(st.played) });
      st.decision = d;
      CR.spend(s, D.duree || 30, "court", { busy: true });
      bump();
      return d;
    });
    const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const [step, setStep] = useState(() => (reduce || !dec || !inRoom ? 3 : 0));
    useEffect(() => {
      if (setCourt) setCourt(["retire", "attente", "retour", "prononce"][step]);
      if (step >= 3 && setVerdict && dec) setVerdict(CR.verdictMood(cs, dec));
      if (step >= 3) return;
      const t = setTimeout(() => setStep(step + 1), [2700, 2100, 2900][step] / Math.max(1, CR.textSpeedMult(s)));
      return () => clearTimeout(t);
    }, [step]);
    useEffect(() => () => setCourt && setCourt(""), []);
    const qui = cour ? "La cour" : "Le tribunal";
    if (step < 3) return html`<div className="delibere-wait">
      <span className="pix">Délibéré</span>
      <p className="small">${[`${qui} se retire pour délibérer.`, "La salle attend. On murmure sur les bancs, l'horloge tourne.", `L'huissier : « ${qui} ! » Tout le monde se lève.`][step]}</p>
      <${Btn} kind="ghost" small onClick=${() => setStep(3)}>Passer</${Btn}>
    </div>`;
    if (!dec) return html`<div><${Btn} kind="primary" onClick=${next}>Continuer</${Btn}></div>`;
    return html`<div className="delibere">
      <p className="small muted">${D.texte || "Le tribunal se retire pour délibérer. Vingt minutes plus tard, l'huissier annonce : « Le tribunal ! »"}</p>
      <${UI.VerdictCard} s=${s} cs=${cs} dec=${dec} />
      <${UI.DecisionPaper} s=${s} cs=${cs} dec=${dec} />
      <${Btn} kind="primary" onClick=${next}>Continuer</${Btn}>
    </div>`;
  }
  UI.DecisionPaper = ({ s, cs, dec }) => html`<article className="paper decision">
    <h3 className="paper-title">${dec.titre || "Jugement"}</h3>
    ${dec.entete && html`<p className="small">${dec.entete}</p>`}
    ${(dec.questions || []).map((q, i) => html`<div key=${i} className="dq"><p className="dq-q"><strong>${q.q}</strong></p><p>${q.r}</p>${q.motif && html`<p className="small dq-m">${q.motif}</p>`}</div>`)}
    ${dec.dispositif && html`<p className="dispositif"><strong>PAR CES MOTIFS</strong> — ${dec.dispositif}</p>`}
  </article>`;

  // =================================================================== Tirage et récusation des jurés (art. 298)
  const PRENOMS_J = ["Martine", "Karim", "Sylvie", "Olivier", "Fatoumata", "Jean-Luc", "Nathalie", "Thomas", "Samia", "Patrick", "Élodie", "Bruno", "Hélène", "Mamadou", "Isabelle", "Franck", "Sophie", "Ahmed", "Céline", "Laurent"];
  const NOMS_J = ["Dupont", "Benali", "Lemoine", "Garnier", "Traoré", "Rousseau", "Fontaine", "Morel", "Chevalier", "Mercier", "Blanc", "Guerin", "Muller", "Henry", "Perrin", "Robin", "Masson", "Sanchez", "Nicolas", "Gauthier"];
  const METIERS_J = [["Infirmière", 0.1], ["Retraité de la RATP", -0.05], ["Commerçant", -0.15], ["Professeure des écoles", 0.15], ["Agent de sécurité", -0.2], ["Ingénieur", 0], ["Chauffeur VTC", 0.05], ["Cadre bancaire", -0.1], ["Étudiante", 0.15], ["Policier retraité", -0.35], ["Éducatrice spécialisée", 0.25], ["Artisan plombier", -0.05], ["Aide-soignante", 0.1], ["Gérant de bar", -0.1]];
  CR.tirerJures = function (s, cs, n = 14) {
    const out = [];
    const r = CR.seeded(cs.id + "jury" + s.seed);
    for (let i = 0; i < n; i++) {
      const [metier, lean] = METIERS_J[Math.floor(r() * METIERS_J.length)];
      const age = 23 + Math.floor(r() * 50);
      const g = r() < 0.5 ? "f" : "m";
      const nm = `${PRENOMS_J[Math.floor(r() * PRENOMS_J.length)]} ${NOMS_J[Math.floor(r() * NOMS_J.length)]}`;
      out.push({ id: "j" + i, nom: nm, age, metier, commune: ["Paris 11e", "Paris 19e", "Paris 15e", "Paris 18e", "Paris 7e", "Paris 20e", "Paris 13e"][Math.floor(r() * 7)], lean: lean + (r() - 0.5) * 0.3, look: CR.px.lookFrom("jure" + nm + s.seed, { age, g }) });
    }
    return out;
  };
  UI.JuryScene = ({ s, cs, onDone, defense = true, n = 6, titre = "cour d'assises de Paris" }) => {
    // neuf jurés en appel : cinq récusations pour la défense, quatre pour le ministère public (art. 298)
    const recD = n >= 9 ? 5 : 4, recM = n >= 9 ? 4 : 3;
    const [urne] = useState(() => CR.tirerJures(s, cs, n + recD + recM + 2));
    const [idx, setIdx] = useState(0);
    const [assis, setAssis] = useState([]);
    const [recuses, setRecuses] = useState([]);
    const [log, setLog] = useState(["Le président tire au sort les noms des jurés dans l'urne. La défense récuse d'abord, le ministère public ensuite, sans avoir à motiver (art. 298)."]);
    const mesR = recuses.filter((x) => x.par === "defense").length;
    const mpR = recuses.filter((x) => x.par === "mp").length;
    const j = urne[idx];
    const decider = (recuser) => {
      let L = log.slice();
      if (recuser && mesR < recD) { setRecuses(recuses.concat({ id: j.id, par: "defense" })); L.push(`${j.nom} : « Récusé. »`); }
      else {
        const mpVeut = j.lean > 0.2 && mpR < recM && R.next(s) < 0.75;
        if (mpVeut) { setRecuses(recuses.concat({ id: j.id, par: "mp" })); L.push(`${j.nom} : récusé par le ministère public.`); }
        else { const na = assis.concat(j); setAssis(na); L.push(`${j.nom} prend place parmi les jurés.`); if (na.length >= n) { setLog(L.concat([`${n >= 9 ? "Neuf" : "Six"} jurés sont désignés. Ils prêtent serment.`])); setTimeout(() => onDone(na), 600); return; } }
      }
      setLog(L);
      setIdx(idx + 1);
    };
    const roomOpts = { min: s.min, rain: CR.dec.rainy(s), season: CR.dec.seasonOf(s), rouge: true, jures: assis.length, camp: cs.camp === "pc" ? "pc" : "defense", box: true, looks: { president: CR.acteur(cs.actors.president) ? CR.px.acteurLook(CR.acteur(cs.actors.president)) : undefined, jures: assis.map((x) => x.look), you: CR.youLook(s), client: CR.px.clientLook(CR.client(cs), cs.def) }, speaker: "president" };
    roomOpts.sig = CR.dec.sigOf(roomOpts);
    const staged = UI.planOk && UI.planOk("audience");
    return html`<div className=${cx("scene jury-scene", staged && "staged")}>
      ${staged ? html`<${UI.Plan} name="audience" opts=${Object.assign({}, roomOpts, { room: "assises" })} /><div className="stg-shade"></div>` : html`<div className="court-stage jury-stage"><${UI.Room} name="assises" opts=${roomOpts} /></div>`}
      <div className="jury-head"><span className="pix">Formation du jury — ${titre}</span><p className="small">Récusations : défense ${mesR}/${recD} · ministère public ${mpR}/${recM} · jurés désignés ${assis.length}/${n}</p></div>
      <div className="jury-grid">
        ${j && assis.length < 6 && html`<div className="juror juror-big"><${Portrait} look=${j.look} size=${72} /><div className="juror-txt"><strong>${j.nom}</strong><span className="small">${j.age} ans · ${j.commune}</span><span className="small muted">${j.metier}</span></div>
          <div className="juror-btns"><${Btn} kind="danger" disabled=${!defense || mesR >= recD} onClick=${() => decider(true)}>Récuser</${Btn}><${Btn} onClick=${() => decider(false)}>Accepter</${Btn}></div></div>`}
        <div className="assis">${assis.map((x) => html`<div key=${x.id} className="juror"><${Portrait} look=${x.look} size=${40} blink=${false} /><div className="juror-txt"><strong>${x.nom}</strong><span className="small muted">${x.metier}</span></div></div>`)}</div>
      </div>
      <div className="jury-side"><div className="transcript small-log">${log.map((l, i) => html`<div key=${i} className="tline"><span className="tl-body">${l}</span></div>`)}</div></div>
    </div>`;
  };

  // =================================================================== Lancement d'une audience depuis un dossier
  UI.HearingScene = ({ s, cs, hid, onDone, setScene }) => {
    const def = CR.caseDef(cs);
    const h = CR.hearingById(cs, hid);
    const api = CR.api(s, cs);
    const [jury, setJury] = useState(null);
    const [souvenir] = useState(() => { try { return CR.MEM ? CR.MEM.ouverture(s, cs, h) : []; } catch (e) { return []; } });
    const [started] = useState(() => { h.attended = true; CR.spend(s, 10, "court", { busy: true }); bump(); return true; });
    const finish = (res) => {
      CR.spend(s, h.duree || 60, "court", { busy: true });
      try { if (CR.MEM) CR.MEM.apresAudience(s, cs, h, res); } catch (e) { console.error(e); }
      if (h.done) CR.runHook(s, cs, h.done, res);
      bump();
      onDone();
    };
    // lot 8 : les audiences communes à toutes les affaires (juge de l'application des peines…) viennent de CR.AUDIENCES
    const aud = (def.audiences && def.audiences[h.script]) || (CR.AUDIENCES && CR.AUDIENCES[h.script]);
    const cfg = aud ? aud(api, h) : { steps: [{ who: "president", t: "L'affaire est renvoyée." }] };
    if (cfg.jury && !jury) return html`<${UI.JuryScene} s=${s} cs=${cs} defense=${cfg.juryDefense !== false} n=${cfg.juryN || 6} titre=${cfg.juryTitre || "cour d'assises de Paris"} onDone=${(j) => { setJury(j); cs.vars.jures = j.map((x) => ({ nom: x.nom, lean: x.lean, metier: x.metier })); bump(); }} />`;
    const decor = Object.assign({}, cfg.decor || {}, jury ? { jures: jury.length, jureLooks: jury.map((x) => x.look) } : {});
    return html`<${UI.AudienceScene} key=${hid} s=${s} cs=${cs} steps=${souvenir.length ? souvenir.concat(cfg.steps) : cfg.steps} title=${cfg.title || h.title} sub=${cfg.sub || h.where} decor=${decor} onEnd=${finish} />`;
  };
})();
