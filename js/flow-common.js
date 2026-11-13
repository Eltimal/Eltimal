/* La Permanence — gabarits d'actes, contrôle des conflits, convention d'honoraires, refus, déport, tâches génériques */
(function () {
  const CR = (window.CR = window.CR || {});
  const R = CR.R;
  CR.SHARED_DOCS = CR.SHARED_DOCS || {};
  CR.SHARED_TPL = CR.SHARED_TPL || {};
  CR.FLOW_HOOKS = CR.FLOW_HOOKS || {};

  // =================================================================== Gabarits
  // tpl.slots : { id: {type:'fact', accept:[...]} | {type:'choice', options:[{v,t,ok,defect}]} | {type:'auto', value} }
  // tpl.checks : [{ id, label, options:[{id,t,ok,needs,defect,flag}] }]
  CR.getTpl = function (s, cs, key) {
    const def = CR.caseDef(cs);
    const src = (def.tpls && def.tpls[key]) || CR.SHARED_TPL[key];
    if (!src) return null;
    const t = typeof src === "function" ? src(CR.api(s, cs)) : src;
    t.key = key;
    return t;
  };
  // Citations à saisir dans un gabarit (feuille de route, n° 11) : « ck:<case à cocher>:<option> » ou « sl:<blanc>:<choix> »
  CR.tplCites = function (tpl) {
    const out = {};
    if (!tpl) return out;
    for (const ch of tpl.checks || []) for (const o of ch.options || []) { const sp = CR.citeSpec(o.t, o.needs); if (sp) out[`ck:${ch.id}:${o.id}`] = sp; }
    for (const [id, sl] of Object.entries(tpl.slots || {})) if (sl.type === "choice") for (const o of sl.options) { const sp = CR.citeSpec(o.t, o.needs); if (sp) out[`sl:${id}:${o.v}`] = sp; }
    return out;
  };
  // cites : null en mode liste ; sinon { clé: { ref, g, attendu } } pour chaque citation tapée
  CR.evalDraft = function (s, cs, tpl, filled, checks, cites) {
    const defects = [];
    const detail = {};
    const specs = cites ? CR.tplCites(tpl) : {};
    const citeRes = {};
    const gradeOf = (k) => { const c = cites[k]; const g = c ? c.g : "absent"; citeRes[k] = { g, attendu: c && c.attendu ? c.attendu : specs[k].expect[0], tape: c ? c.ref || null : null }; return g; };
    let total = 0, good = 0;
    for (const [id, slot] of Object.entries(tpl.slots || {})) {
      if (slot.type === "auto") continue;
      total++;
      const val = filled[id];
      if (slot.type === "fact") {
        if (!val) { if (!slot.optional) { defects.push(id + ":blank"); detail[id] = "blank"; } else { good++; detail[id] = "skip"; } continue; }
        const note = cs.notes.find((n) => n.id === val);
        const ok = note && note.fact && slot.accept.includes(note.fact);
        if (ok) { good++; detail[id] = "ok"; } else { defects.push(id + ":wrong"); detail[id] = "wrong"; }
      } else if (slot.type === "choice") {
        const opt = slot.options.find((o) => o.v === val);
        if (!opt) { defects.push(id + ":blank"); detail[id] = "blank"; continue; }
        const ck = `sl:${id}:${opt.v}`;
        const g = cites && specs[ck] ? gradeOf(ck) : "ok";
        if (g !== "ok") defects.push(`cite:${id}:${g}`);
        if (opt.ok && (g === "faux" || g === "absent")) { defects.push(id + ":cite"); detail[id] = "wrong"; continue; }
        if (opt.ok) { good++; detail[id] = "ok"; } else { defects.push(opt.defect || id + ":wrong"); detail[id] = "wrong"; }
      }
    }
    const picks = {}, ecrits = {};
    for (const ch of tpl.checks || []) {
      let sel = (checks && checks[ch.id]) || [];
      ecrits[ch.id] = sel;
      // un point appuyé sur un article faux ou absent perd son appui : il ne compte plus
      if (cites) sel = sel.filter((oid) => { const k = `ck:${ch.id}:${oid}`; if (!specs[k]) return true; const g = gradeOf(k); if (g !== "ok") defects.push(`cite:${ch.id}:${oid}:${g}`); const o = ch.options.find((x) => x.id === oid); return (g !== "faux" && g !== "absent") || (o && o.ok === false); });
      picks[ch.id] = sel;
      for (const o of ch.options) {
        const on = sel.includes(o.id);
        if (o.ok === true) { total++; if (on) good++; else defects.push(ch.id + ":missing:" + o.id); }
        if (o.ok === false && on) { total++; defects.push(o.defect || ch.id + ":bad:" + o.id); }
      }
    }
    return { defects, detail, picks, ecrits, cites: citeRes, score: total ? good / total : 1, filled: Object.assign({}, filled) };
  };
  CR.fileDraft = function (s, cs, key, filled, checks, opts = {}) {
    const tpl = CR.getTpl(s, cs, key);
    const res = CR.evalDraft(s, cs, tpl, filled, checks, opts.cites || null);
    // les articles ratés : erreur au débrief, fiche de révision, crédit auprès du siège
    for (const [k, c] of Object.entries(res.cites || {})) {
      if (c.g === "ok") continue;
      CR.citeMiss(s, cs, { attendu: c.attendu, tape: c.tape, g: c.g, ctx: tpl.title });
      const att = c.attendu ? CR.citeLabel(c.attendu) : "l'article attendu";
      const typed = c.tape ? CR.citeLabel(c.tape) : null;
      if (c.g === "faux" || c.g === "absent") CR.erreur(s, cs, { id: `cite_${key}_${k}`, texte: `${tpl.title} : ${typed ? `${typed} cité au lieu de l'${att}` : `point écrit sans citer l'${att}`}.`, sanction: "Le point perd son appui textuel : il ne compte pas.", regul: "Un nouvel acte, s'il est encore temps." });
      else if (c.g === "voisin") CR.erreur(s, cs, { id: `cite_${key}_${k}`, texte: `${tpl.title} : ${typed} cité au lieu de l'${att}, article voisin.`, sanction: "Le point tient, mais l'erreur se voit." });
      CR.rep(s, "siege", -CR.CITE_POIDS[c.g]);
    }
    const time = tpl.time || 60;
    CR.spend(s, time, "desk");
    if (tpl.cost) CR.api(s, cs).cost(tpl.cost, tpl.costLabel || tpl.title);
    const typed = opts.cites ? Object.fromEntries(Object.entries(opts.cites).map(([k, c]) => [k, c.ref || null])) : null;
    const doc = CR.fileDoc(s, cs, { key: "_drafted", title: tpl.title, dir: "out", vars: { tplKey: key, filled: res.filled, picks: res.picks, ecrits: res.ecrits, cites: typed } });
    cs.drafted[key] = cs.drafted[key] || [];
    // refonte (lot 5) : en mode libre, tout acte de la table des canaux attend sa transmission, même celui qui n'a pas de lieu de dépôt
    const attend = !!tpl.depot || !!(CR.CANAUX && CR.CANAUX.gere(s, key));
    cs.drafted[key].push({ day: s.day, min: s.min, defects: res.defects, score: res.score, picks: res.picks, filled: res.filled, docId: doc.id, depose: !attend });
    CR.timeline(s, cs, `${tpl.dirLabel || "Rédigé"} : ${tpl.title}`);
    cs.lastWork = s.day;
    // un acte qui doit être déposé au greffe attend son dépôt ; les autres produisent leurs effets tout de suite
    if (!attend) CR.runHook(s, cs, tpl.onFile || ("filed_" + key), { res, tpl, key });
    return res;
  };
  CR.drafted = (cs, key) => (cs.drafted[key] && cs.drafted[key].length ? cs.drafted[key][cs.drafted[key].length - 1] : null);
  CR.hasDefect = (cs, key, code) => { const d = CR.drafted(cs, key); return !!(d && d.defects.some((x) => x === code || x.startsWith(code))); };
  // Dépôt d'un acte rédigé (au greffe, à l'étude, au cabinet du juge) : l'acte prend date ici
  // o.sansTemps : l'acte prend effet sans qu'on se déplace (canal électronique, courrier arrivé) ; o.deja : transmis, effet différé
  CR.deposer = function (s, cs, key, o = {}) {
    const d = CR.drafted(cs, key);
    if (!d || (d.depose && !o.deja) || d.effet) return null;
    const tpl = CR.getTpl(s, cs, key);
    if (!o.sansTemps) CR.spend(s, tpl.depotTime || 15, "admin");
    d.effet = true;
    d.depose = true;
    d.deposeDay = s.day;
    d.deposeMin = s.min;
    CR.timeline(s, cs, `Déposé : ${tpl.title}`);
    CR.runHook(s, cs, tpl.onFile || ("filed_" + key), { res: d, tpl, key, depot: true });
    return d;
  };
  CR.aDeposer = (cs) => Object.entries(cs.drafted).map(([k, arr]) => ({ k, d: arr[arr.length - 1] })).filter((x) => x.d && !x.d.depose);

  CR.SHARED_DOCS._drafted = function (ctx) {
    const { s, cs } = ctx;
    const tpl = CR.getTpl(s, cs, ctx.tplKey);
    if (!tpl) return { title: "Projet", paras: [["(gabarit introuvable)"]] };
    const specs = ctx.cites ? CR.tplCites(tpl) : {};
    const written = (k, txt) => (ctx.cites && specs[k] ? CR.citeWritten(specs[k], ctx.cites[k]) : txt);
    const paras = (tpl.body || []).map((p) => p.map((part) => {
      if (typeof part === "string") return part;
      const slot = tpl.slots[part.s];
      if (!slot) return "";
      if (slot.type === "auto") return slot.value;
      const v = ctx.filled[part.s];
      if (slot.type === "fact") { const n = cs.notes.find((x) => x.id === v); return n ? n.text : "[blanc]"; }
      const o = slot.options.find((x) => x.v === v);
      return o ? written(`sl:${part.s}:${o.v}`, o.t) : "[blanc]";
    }));
    for (const ch of tpl.checks || []) {
      const sel = ((ctx.ecrits || ctx.picks) && (ctx.ecrits || ctx.picks)[ch.id]) || [];
      const items = ch.options.filter((o) => sel.includes(o.id)).map((o) => "— " + written(`ck:${ch.id}:${o.id}`, o.t));
      if (items.length) { paras.push([ch.heading || ch.label]); items.forEach((i) => paras.push([i])); }
    }
    return { title: tpl.title, caption: tpl.caption, to: tpl.to, paras, signed: `Me ${s.player.prenom} ${s.player.nom}, avocat au barreau de Paris` };
  };
  CR.factSlot = (label, accept, opt) => Object.assign({ type: "fact", label, accept: [].concat(accept) }, opt || {});
  CR.choiceSlot = (label, options) => ({ type: "choice", label, options: options.map((o, i) => (typeof o === "string" ? { v: "o" + i, t: o, ok: i === 0 } : Object.assign({ v: o.v || "o" + i }, o))) });
  CR.autoSlot = (value) => ({ type: "auto", value });

  // =================================================================== Tâches génériques
  CR.caseTasks = function (s, cs) {
    const def = CR.caseDef(cs);
    const api = CR.api(s, cs);
    const tasks = [];
    const T = (t) => tasks.push(Object.assign({ enabled: true }, t));
    if (cs.status === "closed") return tasks;
    if (cs.status === "lead") {
      if (def.leadTask) def.leadTask(api, T);
      else T({ id: "callback", label: "Rappeler", sub: "Écouter ce qui s'est passé.", kind: "call", time: 30, run: () => ({ scene: "call", call: "intake" }) });
      // phase 3 : choisir ses dossiers (accepter, c'est la tâche ci-dessus ; refuser ; transmettre à un confrère)
      if (CR.choixDossierTasks) CR.choixDossierTasks(s, cs, T);
      return tasks;
    }
    if (cs.status === "prospect") {
      T({ id: "conflict", label: cs.conflictChecked ? "Conflits vérifiés" : "Vérifier les conflits d'intérêts", sub: "Chercher dans vos dossiers les personnes notées dans votre carnet.", kind: "admin", time: 10, enabled: !cs.conflictChecked, run: () => ({ scene: "conflict" }) });
      const aj = def.honoraires && def.honoraires.aj;
      if (aj) T({ id: "aj", label: "Accepter au titre de l'aide juridictionnelle", sub: "Pas de négociation : l'État rétribue la mission au forfait.", kind: "admin", time: 10, run: () => { CR.acceptAJ(s, cs); return null; } });
      else {
        if (!cs.fee) T({ id: "fees", label: "Discuter des honoraires", sub: "Proposer un forfait ou un taux horaire. Le client a un budget et un caractère.", kind: "meet", time: 30, enabled: !cs.flags.negFailed, why: cs.flags.negFailed ? "Le client est parti pendant la discussion." : "", run: () => ({ scene: "neg" }) });
        if (cs.fee) T({ id: "engage", label: "Rédiger la convention d'honoraires", sub: "Obligatoire (art. 10 de la loi de 1971), sauf urgence et aide juridictionnelle.", kind: "draft", time: 30, run: () => ({ scene: "draft", tpl: "convention" }) });
        if (def.urgence && !cs.fee) T({ id: "urgence", label: "Intervenir en urgence, convention plus tard", sub: "L'urgence dispense de convention écrite préalable.", kind: "admin", time: 5, run: () => { CR.engageUrgence(s, cs); return null; } });
      }
      T({ id: "followup", label: "Rappeler le client", sub: "Demander ce que vous avez oublié. Il risque de ne pas décrocher.", kind: "call", time: 20, run: () => ({ scene: "call", call: "followup" }) });
      T({ id: "decline", label: "Refuser le dossier", sub: "Par une lettre qui protège le client et vous.", kind: "draft", time: 25, run: () => ({ scene: "draft", tpl: "refus" }) });
      return tasks;
    }
    const h = CR.hearingToday(s, cs);
    if (h && !h.attended) T({ id: "court", label: `Aller : ${h.title}`, sub: `${CR.fmtTime(h.min)} — ${h.where || ""}`, kind: "court", time: 0, urgent: true, where: h.lieu || "palais", run: () => ({ scene: h.scene || "court", hid: h.id }) });
    if (CR.chevauchementTasks) CR.chevauchementTasks(s, cs, T);
    for (const x of CR.aDeposer(cs)) {
      const tpl = CR.getTpl(s, cs, x.k);
      // refonte (lot 5) : en mode libre, l'acte se transmet par un canal choisi ; le greffe demande de s'y rendre
      if (tpl && CR.CANAUX && CR.CANAUX.gere(s, x.k)) {
        const ch = cs.vars.canalChoisi && cs.vars.canalChoisi[x.k];
        if (!ch) T({ id: "canal_" + x.k, label: `Transmettre : ${tpl.title}`, sub: "Choisir la voie : greffe, e-Barreau, recommandé, télécopie…", kind: "admin", time: 0, urgent: true, run: () => ({ scene: "canal", tpl: x.k }) });
        else T({ id: "depot_" + x.k, label: `${ch === "cj" ? "Faire délivrer" : "Déposer au greffe"} : ${tpl.title}`, sub: `${tpl.depotLabel || "Au greffe"} — l'acte prend date au dépôt.`, kind: "admin", time: tpl.depotTime || 15, urgent: true, where: tpl.depot, run: () => { CR.CANAUX.deposerSurPlace(s, cs, x.k); return null; } });
        continue;
      }
      if (tpl && tpl.depot) T({ id: "depot_" + x.k, label: `Déposer : ${tpl.title}`, sub: `${tpl.depotLabel || "Au greffe"} — l'acte prend date au dépôt.`, kind: "admin", time: tpl.depotTime || 15, urgent: true, where: tpl.depot, run: () => { CR.deposer(s, cs, x.k); return null; } });
    }
    if (def.flow && def.flow.tasks) def.flow.tasks(api, T);
    if (def.tasks) def.tasks(api, T);
    if (!def.noUpdate) T({ id: "update", label: "Appeler le client pour faire le point", sub: `Dernier point ${cs.lastUpdate === s.day ? "aujourd'hui" : "il y a " + CR.plural(s.day - cs.lastUpdate, "jour")}.`, kind: "call", time: 15, enabled: cs.lastUpdate !== s.day, run: () => ({ scene: "call", call: "update" }) });
    T({ id: "research", label: "Recherche juridique", sub: "Lire les textes ; un passage utile devient une carte jouable.", kind: "research", time: 0, run: () => ({ scene: "library", area: def.domaineLib }) });
    if (!cs.flags.deport && !def.noWithdraw) T({ id: "withdraw", label: "Se décharger du dossier", sub: "Sans compromettre la défense : jamais à la veille d'une audience.", kind: "draft", time: 30, danger: true, run: () => ({ scene: "withdraw" }) });
    return tasks;
  };

  // =================================================================== Conflits d'intérêts
  // def.parties : [{ nom, role }] ; le client d'un autre dossier ne doit pas être votre adversaire ici
  CR.conflictCheck = function (s, cs) {
    CR.spend(s, 10, "admin");
    cs.conflictChecked = true;
    const def = CR.caseDef(cs);
    const partyNotes = cs.notes.filter((n) => n.fact && def.facts && def.facts[n.fact] && def.facts[n.fact].cat === "party");
    const names = partyNotes.map((n) => def.facts[n.fact].party).filter(Boolean);
    const hits = [];
    for (const id of s.order) {
      const other = s.cases[id];
      if (!other || other === cs || !["active", "prospect"].includes(other.status)) continue;
      const oc = CR.client(other);
      const full = `${oc.prenom} ${oc.nom}`.toLowerCase();
      for (const nm of names) if (nm && full.includes(nm.toLowerCase())) hits.push({ name: nm, caseId: other.id, title: CR.caseTitle(s, other) });
    }
    cs.conflictResult = { day: s.day, searched: names, hits };
    if (hits.length) cs.flags.conflictFound = true;
    return cs.conflictResult;
  };
  CR.FLOW_HOOKS._conflictSurfaces = (api) => {
    const { s, cs } = api;
    api.mail({ from: "Le confrère adverse", subject: "Conflit d'intérêts", kind: "courrier", important: true,
      body: [["Mon cher confrère,"], ["J'apprends que vous assistez à la fois la victime et l'auteur dans la même affaire, ou deux personnes aux intérêts opposés. Je saisis le bâtonnier."]] });
    api.disc("conflit", 5, "Un confrère signale que vous intervenez pour deux parties aux intérêts opposés dans la même affaire (art. 4.1 du RIN).");
    api.rep("confreres", -6, "un conflit d'intérêts");
    CR.closeCase(s, cs, { type: "withdrawn", note: "Contraint de vous déporter pour conflit d'intérêts." });
  };

  // =================================================================== Engagement
  CR.acceptAJ = function (s, cs) {
    const api = CR.api(s, cs);
    CR.spend(s, 10, "admin");
    cs.status = "active";
    cs.aj = true;
    cs.engaged = s.day;
    cs.lastUpdate = s.day;
    api.log(`Dossier accepté au titre de l'aide juridictionnelle : ${CR.clientName(cs)}.`);
    afterEngage(api);
  };
  CR.engageUrgence = function (s, cs) {
    const api = CR.api(s, cs);
    cs.status = "active";
    cs.engaged = s.day;
    cs.lastUpdate = s.day;
    cs.flags.urgence = true;
    api.log("Intervention en urgence : la convention d'honoraires sera signée ensuite.");
    afterEngage(api);
  };
  function afterEngage(api) {
    const { s, cs, def } = api;
    if (cs.flags.conflictFound && !cs.flags.conflictWaived) api.schedule(R.int(s, 10, 40), "_conflictSurfaces");
    else if (!cs.conflictChecked && def.conflict && s.cases[def.conflict] && ["active", "prospect"].includes(s.cases[def.conflict].status)) api.schedule(R.int(s, 10, 40), "_conflictSurfaces");
    if (CR.hookExists(cs, "engaged")) CR.runHook(s, cs, "engaged", {});
  }
  CR.afterEngage = afterEngage;

  CR.SHARED_TPL.convention = (api) => {
    const { s, cs, def } = api;
    const f = cs.fee || {};
    const c = api.c;
    const slots = {
      client: CR.autoSlot(`${c.prenom} ${c.nom}`),
      mission: CR.choiceSlot("Mission", [
        { t: def.mission || "Assistance et défense dans la procédure décrite, jusqu'à la décision de première instance. Les voies de recours feront l'objet d'une convention distincte.", ok: true },
        { t: "Toutes les affaires du client, présentes et à venir.", ok: false, defect: "mission:vague" },
        { t: "La procédure jusqu'à la Cour de cassation incluse, sans supplément.", ok: false, defect: "mission:illimitee" },
      ]),
      honoraires: CR.autoSlot(CR.offerText(f)),
      resultat: CR.choiceSlot("Honoraire de résultat", [
        { t: f.complement ? `En complément du forfait, un honoraire de résultat de ${CR.money(f.complement)} HT sera dû en cas de ${f.resultat || "succès"}.` : "Aucun honoraire de résultat n'est prévu.", ok: true },
        { t: "Les honoraires seront fixés uniquement en fonction du résultat obtenu.", ok: false, defect: "resultat:quota" },
      ]),
      frais: CR.choiceSlot("Frais et débours", [
        { t: "Les frais de déplacement hors Île-de-France, les frais de commissaire de justice et les copies de dossier sont facturés en sus, sur justificatifs.", ok: true },
        { t: "Les frais exposés pour le dossier restent à la charge du cabinet : ils sont compris dans l'honoraire convenu, sans facturation distincte.", ok: false, defect: "frais:silence" },
      ]),
      litige: CR.choiceSlot("Contestation", [
        { t: "En cas de contestation, le bâtonnier de l'Ordre des avocats de Paris peut être saisi (art. 174 et suivants du décret du 27 novembre 1991).", ok: true },
        { t: "Toute contestation relève exclusivement du tribunal de commerce.", ok: false, defect: "litige:faux" },
      ]),
    };
    const body = [["Entre ", { s: "client" }, ", ci-après le client, et ", `Me ${s.player.prenom} ${s.player.nom}`, ", avocat au barreau de Paris, il est convenu ce qui suit (art. 10 de la loi n° 71-1130 du 31 décembre 1971) :"],
      ["1. Mission. ", { s: "mission" }], ["2. Honoraires. ", { s: "honoraires" }], ["3. ", { s: "resultat" }], ["4. ", { s: "frais" }], ["5. ", { s: "litige" }], ["Fait à Paris, en deux exemplaires."]];
    return { title: "Convention d'honoraires", kind: "courrier", time: 30, to: `${c.prenom} ${c.nom}`, slots, body, dirLabel: "Signée" };
  };
  CR.FLOW_HOOKS.filed_convention = (api, { res }) => {
    const { s, cs } = api;
    cs.status = "active";
    cs.engaged = s.day;
    cs.lastUpdate = s.day;
    cs.flags.convention = true;
    if (res.defects.includes("resultat:quota")) { cs.flags.quotaLitis = true; api.schedule(R.int(s, 30, 120), "_quotaLitis"); }
    if (res.defects.some((d) => d.startsWith("mission"))) cs.flags.missionFloue = true;
    api.log(`Convention d'honoraires signée avec ${CR.clientName(cs)}.`);
    if (cs.fee) {
      const first = cs.fee.type === "temps" ? cs.fee.provision || 0 : cs.fee.plan ? Math.round(cs.fee.amount / 3) : Math.round(cs.fee.amount / 2);
      if (first > 0) { api.pay(first, `Provision sur honoraires — ${CR.clientName(cs)}`); cs.collected += first; s.stats.honoraires += first; }
    }
    afterEngage(api);
  };
  CR.FLOW_HOOKS._quotaLitis = (api) => {
    api.disc("honoraires", 5, `${CR.clientName(api.cs)} conteste une convention qui fixe les honoraires uniquement en fonction du résultat : un pacte de quota litis, interdit par l'article 10 de la loi de 1971.`);
    api.trust(-15);
  };

  CR.SHARED_TPL.refus = (api) => {
    const c = api.c;
    return {
      title: "Lettre de refus de dossier", kind: "courrier", time: 25, to: `${c.prenom} ${c.nom}`, dirLabel: "Envoyée",
      slots: {
        client: CR.autoSlot(`${c.prenom} ${c.nom}`),
        decision: CR.choiceSlot("La décision", [
          { t: "Après examen, je ne suis pas en mesure d'assurer votre défense dans ce dossier. Je n'ai accompli aucun acte en votre nom.", ok: true },
          { t: "Je réserve ma décision sur la suite à donner à votre dossier ; je reviendrai vers vous dès que j'aurai pu en examiner l'ensemble des pièces.", ok: false, defect: "decision:ambigu" },
        ]),
        delai: CR.choiceSlot("Les délais", [
          { t: "Je vous rappelle que la procédure pénale enferme les actes dans des délais stricts. Consultez sans tarder un autre avocat ; vous pouvez aussi demander un avocat commis d'office au bâtonnier.", ok: true },
          { t: "Rien ne presse : les délais de la procédure pénale ne courent qu'à compter de la décision définitive, et vous aurez tout le temps nécessaire pour consulter un confrère de votre choix.", ok: false, defect: "delai:faux" },
        ]),
      },
      body: [["Madame, Monsieur, ", { s: "client" }, ","], [{ s: "decision" }], [{ s: "delai" }], ["Je vous prie d'agréer l'expression de mes salutations distinguées."]],
    };
  };
  CR.FLOW_HOOKS.filed_refus = (api, { res }) => {
    const good = !res.defects.length;
    CR.closeCase(api.s, api.cs, { type: "declined", letterOk: good });
  };

  // =================================================================== Se décharger du dossier
  CR.withdraw = function (s, cs) {
    const api = CR.api(s, cs);
    CR.spend(s, 30, "desk");
    cs.flags.deport = true;
    const next = cs.hearings.find((h) => !h.attended && !h.missed && !h.canceled && h.day >= s.day);
    const veille = next && next.day - s.day <= 7;
    api.trust(-30);
    if (veille) api.disc("deport", 4, `${CR.clientName(cs)} se plaint que son avocat s'est déchargé du dossier ${next.day - s.day <= 1 ? "la veille" : "quelques jours avant"} de l'audience, sans lui laisser le temps de trouver un remplaçant.`);
    api.log(veille ? "Vous vous êtes déchargé du dossier à quelques jours de l'audience." : "Vous vous êtes déchargé du dossier, par lettre, en rappelant au client ses échéances.", veille ? "bad" : "info");
    CR.closeCase(s, cs, { type: "withdrawn" });
  };
})();
