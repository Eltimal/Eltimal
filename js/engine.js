/* La Permanence — moteur : état de partie, horloge, énergie, nuits de permanence, événements, messagerie,
   téléphone, agenda, délais silencieux, argent (compte professionnel et CARPA), réputations */
(function () {
  const CR = (window.CR = window.CR || {});
  const R = CR.R;

  CR.VERSION = 1;
  CR.CASES = {};
  CR.defineCase = (def) => { CR.CASES[def.id] = def; return def; };
  CR.EV = {};

  const DAY_START = 9 * 60;
  const EVENING = 19 * 60;
  const HARD_STOP = 23 * 60 + 30;
  CR.DAY_START = DAY_START;
  CR.EVENING = EVENING;
  CR.HARD_STOP = HARD_STOP;

  // Rétributions de l'aide juridictionnelle (lot C1). Source : Références statistiques Justice 2026, fiche 2.3 (données Unca) :
  // l'UV valait 36 € en 2025 ; dépense moyenne par mission en 2025 : garde à vue 359 €, audition libre 175 €, déferrement 53 €,
  // affaire pénale (AJ) 474 €. Vérifié le 13 novembre 2026. Les montants marqués « estimation » sont exprimés en UV à 36 € et
  // calés pour que la moyenne pénale du jeu reste proche de 474 € ; le barème par mission (décret 2020-1717) n'a pas été lu.
  CR.AJ_UV = 36;
  CR.AJ = {
    gav: { label: "Assistance en garde à vue", montant: 359, source: "vérifié" },
    audition: { label: "Assistance en audition libre", montant: 175, source: "vérifié" },
    ci: { label: "Comparution immédiate", montant: 8 * 36 + 53, source: "estimation (8 UV + déferrement)" },
    tc: { label: "Tribunal correctionnel", montant: 8 * 36, source: "estimation" },
    tp: { label: "Tribunal de police", montant: 3 * 36, source: "estimation" },
    crpc: { label: "Comparution sur reconnaissance préalable de culpabilité", montant: 6 * 36, source: "estimation" },
    jld: { label: "Débat devant le juge des libertés et de la détention", montant: 4 * 36, source: "estimation" },
    instruction: { label: "Instruction correctionnelle", montant: 20 * 36, source: "estimation" },
    instruction_crim: { label: "Instruction criminelle", montant: 40 * 36, source: "estimation" },
    criminel: { label: "Cour d'assises ou cour criminelle départementale", montant: 50 * 36, source: "estimation" },
    pc: { label: "Assistance de la partie civile", montant: 8 * 36, source: "estimation" },
  };


  // ------------------------------------------------------------------ Nouvelle partie
  CR.newGame = function (opts) {
    const seed = (opts.seed != null ? opts.seed : Math.floor(Math.random() * 2 ** 31)) | 0;
    const prenom = (opts.prenom || "Camille").trim();
    const nom = (opts.nom || "Durand").trim();
    const s = {
      v: CR.VERSION,
      created: Date.now(),
      mode: opts.mode || "carriere",
      seed,
      rng: seed,
      player: { prenom, nom, cabinet: (opts.cabinet || `Cabinet ${nom}`).trim(), look: opts.look || null },
      day: 0,
      min: DAY_START,
      at: "cabinet",
      night: false,
      nightRec: 0,
      workedToday: 0,
      energy: 90,
      burnout: null,
      cash: 6200,
      carpa: 0,
      carpaBy: {},
      earnedBy: {},
      decouvert: { used: 0, limit: 5000, rate: 0.09 },
      pret: { balance: 15000, rate: 0.035, payment: 273 },
      // charges fixes mensuelles d'un collaborateur installé seul à Paris : estimations du jeu (aucune source lue ; les honoraires sont libres, art. 10 de la loi du 31 décembre 1971)
      fixed: { loyer: 850, urssaf: 750, ordre: 95, logiciels: 140, telephone: 55, prelevement: 1700 },
      ledger: [],
      reps: { clients: 15, confreres: 15, siege: 25, parquet: 25 },
      competence: { gav: 0, ci: 0, tc: 0, instruction: 0, pc: 0, criminel: 0 },
      inbox: [],
      voicemails: [],
      ring: null,
      callLog: [],
      agenda: [],
      cases: {},
      order: [],
      pending: [],
      invoices: [],
      ajDue: [],
      staff: [],
      applicants: [],
      disc: { open: [], record: [], points: 0 },
      cohort: [],
      log: [],
      stats: { honoraires: 0, aj: 0, relaxes: 0, condamnations: 0, nullites: 0, acquittements: 0, indemnisations: 0, dossiers: 0, gav: 0 },
      flags: {},
      researched: [],
      revision: [],
      duty: [],
      detenus: [],
      classeur: [],
      seen: {},
      world: {},
      settings: { textSpeed: 1, coach: true },
      toasts: [],
      overdraftMonths: 0,
      gameOver: null,
      lastDayStats: null,
    };
    CR.store.s = s;
    // Carrière : vivier d'affaires tirées au sort à partir de la graine (systems.js, CR.initVivier).
    // Tutoriel : calendrier fixe, inchangé.
    const vivier = s.mode === "carriere" && CR.initVivier ? CR.initVivier(s) : null;
    for (const def of Object.values(CR.CASES)) {
      if (def.mode && def.mode !== s.mode) continue;
      if (!def.mode && s.mode !== "carriere") continue;
      if (vivier && vivier.has(def.id)) continue;
      if (def.arrive && def.arrive.day != null) CR.schedule(s, { day: def.arrive.day, min: def.arrive.min, type: "lead", key: def.id, prio: def.arrive.prio || 0 });
    }
    if (s.mode === "carriere") {
      if (CR.initCohort) CR.initCohort(s);
      if (CR.initWorld) CR.initWorld(s);
    }
    if (CR.initIntro) CR.initIntro(s);
    CR.processDay(s, 0, true);
    return s;
  };

  // ------------------------------------------------------------------ Journal, notifications
  CR.log = (s, text, kind = "info", caseId = null) => {
    s.log.push({ day: s.day, text, kind, caseId });
    if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
  };
  CR.toast = (s, text, kind = "info") => {
    s.toasts.push({ id: CR.uid("t"), text, kind, at: Date.now() });
    if (s.toasts.length > 6) s.toasts.splice(0, s.toasts.length - 6);
  };

  // ------------------------------------------------------------------ Événements programmés
  CR.schedule = (s, ev) => { const e = Object.assign({ id: CR.uid("e") }, ev); s.pending.push(e); return e; };
  CR.unschedule = (s, pred) => { s.pending = s.pending.filter((e) => !pred(e)); };

  // ------------------------------------------------------------------ Énergie et temps
  CR.fatigueMult = (s) => (s.energy >= 50 ? 1 : s.energy >= 35 ? 1.15 : s.energy >= 20 ? 1.3 : 1.5);
  CR.textSpeedMult = (s) => (s.energy >= 50 ? 1 : s.energy >= 35 ? 1.2 : s.energy >= 20 ? 1.4 : 1.65) * (s.settings.textSpeed || 1);
  CR.energyLabel = (e) => (e >= 75 ? "Alerte" : e >= 50 ? "En forme" : e >= 35 ? "Fatigué" : e >= 20 ? "Épuisé" : "À bout");
  const DRAIN = { desk: 0.1, call: 0.12, meet: 0.13, court: 0.17, research: 0.11, travel: 0.05, admin: 0.07, gav: 0.16, idle: 0.02 };

  // Dépense du temps du joueur. Renvoie les minutes réellement passées (la fatigue allonge tout).
  CR.spend = function (s, minutes, kind = "desk", opts = {}) {
    const mult = opts.fixed ? 1 : CR.fatigueMult(s);
    const total = Math.max(1, Math.round(minutes * mult));
    const from = s.min;
    const to = Math.min(s.min + total, HARD_STOP);
    let drain = 0;
    for (let m = from; m < to; m += 5) {
      let r = DRAIN[kind] || 0.1;
      if (m >= EVENING || m < 7 * 60) r *= 1.6;
      if (!CR.isBusinessDay(s.day)) r *= 1.2;
      drain += r * Math.min(5, to - m);
    }
    s.min = to;
    if (s.night && s.min >= DAY_START) { s.night = false; s.nightRec = 0; }
    if (kind !== "idle") s.workedToday += to - from;
    // Temps imputé au dossier en cours (facturation au temps passé) : la durée normale de la tâche,
    // jamais l'allongement dû à la fatigue, ni l'attente.
    if (kind !== "idle" && !opts.nobill) {
      const wid = opts.caseId || s.workCase;
      const wc = wid && s.cases[wid];
      if (wc && wc.status === "active") wc.worked = (wc.worked || 0) + Math.min(to - from, Math.max(1, Math.round(minutes)));
    }
    CR.energy(s, -drain);
    CR.fireTimed(s, from, to, opts.busy);
    return to - from;
  };
  CR.energy = (s, d) => {
    s.energy = CR.clamp(s.energy + d, 0, 100);
    if (s.energy <= 0 && !s.burnout) CR.triggerBurnout(s);
  };
  CR.triggerBurnout = (s) => {
    s.burnout = { until: s.day + 4 };
    CR.log(s, "Malaise d'épuisement. Le médecin vous arrête quatre jours. Les délais, eux, continuent de courir.", "bad");
    CR.toast(s, "Épuisement : quatre jours d'arrêt", "bad");
  };
  CR.tooLate = (s) => s.min >= HARD_STOP - 10;
  CR.isEvening = (s) => s.min >= EVENING;

  CR.fireTimed = function (s, from, to, busy) {
    const due = s.pending.filter((e) => e.day === s.day && e.min != null && e.min >= from && e.min < to);
    due.sort((a, b) => a.min - b.min);
    for (const e of due) {
      s.pending = s.pending.filter((x) => x !== e);
      CR.fire(s, e, { busy: busy || to - e.min > 20 });
    }
  };

  // ------------------------------------------------------------------ Fin de journée, nuits
  CR.recoveryFor = (s) => {
    const bedtime = s.min;
    let rec = bedtime <= 20 * 60 ? 46 : bedtime <= 21 * 60 + 30 ? 42 : bedtime <= 22 * 60 + 30 ? 36 : 28;
    if (s.workedToday < 20) rec += !CR.isBusinessDay(s.day) ? 22 : 10;
    return rec;
  };
  CR.endDay = function (s) {
    if (s.gameOver) return;
    const rec = CR.recoveryFor(s);
    const prevEnergy = s.energy;
    if (s.ring) CR.missRing(s);
    s.day += 1;
    s.min = DAY_START;
    s.at = "cabinet";
    s.workedToday = 0;
    s.night = false;
    if (s.burnout && s.day >= s.burnout.until) { s.burnout = null; s.energy = Math.max(s.energy, 70); CR.log(s, "Retour au cabinet après l'arrêt forcé.", "info"); }
    // un appel de nuit (permanence de garde à vue) réveille le joueur
    const night = !s.burnout && s.pending.filter((e) => e.day === s.day && e.min != null && e.min < DAY_START).sort((a, b) => a.min - b.min)[0];
    if (night) {
      s.energy = CR.clamp(s.energy + rec * 0.35, 0, 100);
      s.nightRec = rec * 0.65;
      s.night = true;
      s.min = night.min;
      s.at = "domicile";
      s.lastDayStats = { prevEnergy, rec: rec * 0.35, night: true };
      CR.processDay(s, s.day);
      CR.fireTimed(s, night.min, night.min + 1, false);
    } else {
      s.energy = CR.clamp(s.energy + rec, 0, 100);
      s.lastDayStats = { prevEnergy, rec };
      CR.processDay(s, s.day);
    }
    if (s.burnout) s.energy = Math.min(100, s.energy + 12);
  };
  // Après une intervention de nuit : finir sa nuit
  CR.backToBed = function (s) {
    if (!s.night) return;
    const left = Math.max(0, DAY_START - s.min);
    const got = s.nightRec * CR.clamp(left / 300, 0, 1);
    s.energy = CR.clamp(s.energy + got, 0, 100);
    if (s.ring) CR.missRing(s);
    const from = s.min;
    s.min = DAY_START;
    s.night = false;
    s.nightRec = 0;
    s.at = "cabinet";
    s.workedToday = 0;
    CR.fireTimed(s, from, DAY_START, true);
    return got;
  };

  // Avancer jusqu'à ce que quelque chose réclame votre attention
  CR.skipAhead = function (s, maxDays = 30) {
    const startInbox = CR.unreadCount(s);
    const startVm = s.voicemails.filter((v) => !v.heard).length;
    let n = 0;
    while (n < maxDays && !s.gameOver) {
      CR.endDay(s);
      n++;
      if (s.night) break;
      if (CR.unreadCount(s) > startInbox || s.voicemails.filter((v) => !v.heard).length > startVm) break;
      if (s.agenda.some((a) => a.day === s.day || (a.day - s.day <= 3 && a.day >= s.day && a.created < s.day))) break;
      if (CR.pendingToday(s)) break;
      if (CR.hearingsToday && CR.hearingsToday(s).length) break;
      if (CR.ymd(s.day).d === 1) break;
    }
    return n;
  };
  CR.pendingToday = (s) => s.pending.some((e) => e.day === s.day && e.min != null && (e.type === "lead" || e.type === "ringcase"));

  CR.processDay = function (s, d, first) {
    if (!first && CR.ymd(d).d === 1) CR.monthly(s, d);
    const due = s.pending.filter((e) => e.day <= d && (e.min == null || e.day < d));
    due.sort((a, b) => a.day - b.day || (a.prio || 0) - (b.prio || 0));
    for (const e of due) {
      s.pending = s.pending.filter((x) => x !== e);
      CR.fire(s, e, { busy: e.day < d || s.burnout != null });
    }
    // délais réels, suivis en silence
    for (const id of s.order) {
      const cs = s.cases[id];
      if (!cs || !cs.obligs) continue;
      for (const o of cs.obligs) {
        if (!o.done && !o.missed && d > o.due) {
          o.missed = true;
          o.missedDay = d;
          CR.runHook(s, cs, o.onMiss, { oblig: o });
        }
      }
    }
    if (!first && CR.isBusinessDay(d)) {
      if (CR.dailyClients) CR.dailyClients(s, d);
      if (CR.dailyLeads) CR.dailyLeads(s, d);
      if (CR.dailyStaff) CR.dailyStaff(s, d);
    }
    if (CR.dailyDetenus) CR.dailyDetenus(s, d);
    if (CR.dailyDiscipline) CR.dailyDiscipline(s, d);
    if (CR.checkGameOver) CR.checkGameOver(s);
  };

  // ------------------------------------------------------------------ Dispatch
  CR.fire = function (s, e, ctx = {}) {
    const h = CR.EV[e.type];
    if (!h) { console.warn("Événement sans gestionnaire", e); return; }
    try { h(s, e, ctx); } catch (err) { console.error("Événement en échec", e, err); }
  };
  CR.FLOW_HOOKS = CR.FLOW_HOOKS || {};
  CR.hookExists = function (cs, key) {
    const def = CR.caseDef(cs);
    return !!((def.on && def.on[key]) || (CR.FLOW_HOOKS && CR.FLOW_HOOKS[key]));
  };
  CR.runHook = function (s, cs, key, data) {
    if (!key) return;
    const def = CR.CASES[cs.def];
    const api = CR.api(s, cs);
    if (typeof key === "function") return key(api, data || {});
    const fn = (def.on && def.on[key]) || (CR.FLOW_HOOKS && CR.FLOW_HOOKS[key]);
    if (!fn) { console.warn("Crochet manquant", cs.def, key); return; }
    return fn(api, data || {});
  };
  CR.EV.case = (s, e, ctx) => {
    const cs = s.cases[e.caseId];
    if (!cs || (cs.status === "closed" && !e.always)) return;
    CR.runHook(s, cs, e.key, Object.assign({}, e.data, { _ctx: ctx }));
  };
  CR.EV.mail = (s, e) => { CR.mail(s, e.data); };
  CR.GLOBAL_FN = CR.GLOBAL_FN || {};
  CR.EV.fn = (s, e) => { const f = CR.GLOBAL_FN[e.key]; if (f) f(s, e.data || {}); };

  // ------------------------------------------------------------------ Messagerie
  // kinds : greffe, courrier, email, sms, presse, ordre, note, pv
  CR.mail = function (s, item) {
    const m = Object.assign({ id: CR.uid("m"), day: s.day, min: s.min, read: false, kind: "email" }, item);
    s.inbox.unshift(m);
    if (s.inbox.length > 250) s.inbox.length = 250;
    return m;
  };
  CR.unreadCount = (s) => s.inbox.filter((m) => !m.read).length;
  CR.readMail = function (s, id) {
    const m = s.inbox.find((x) => x.id === id);
    if (!m || m.read) return m;
    m.read = true;
    const pages = m.pages || 1;
    CR.spend(s, Math.min(45, 2 + pages * 4), "desk", { caseId: m.caseId });
    if (m.onRead && m.caseId) { const cs = s.cases[m.caseId]; if (cs) CR.runHook(s, cs, m.onRead, m.onReadData); }
    return m;
  };

  // ------------------------------------------------------------------ Téléphone (portable : il sonne partout)
  CR.ringNow = function (s, r, busy) {
    const ring = Object.assign({ id: CR.uid("r"), at: s.min }, r);
    if (busy || s.ring || s.burnout || CR.tooLate(s)) { CR.voicemail(s, ring); return null; }
    s.ring = ring;
    return ring;
  };
  CR.missRing = function (s) {
    if (!s.ring) return;
    const r = s.ring;
    s.ring = null;
    CR.voicemail(s, r);
  };
  CR.voicemail = function (s, r) {
    const vm = Object.assign({ id: CR.uid("v"), day: s.day, min: r.at || s.min, heard: false }, r);
    vm.text = r.vmText || (r.kind === "lead" ? `Bonjour, ${r.from} à l'appareil. On m'a donné votre numéro… J'ai besoin d'un avocat. Rappelez-moi, s'il vous plaît.` : `Bonjour, c'est ${r.from}. Pouvez-vous me rappeler ?`);
    s.voicemails.unshift(vm);
    if (s.voicemails.length > 60) s.voicemails.length = 60;
    if (r.onMissed && r.caseId && s.cases[r.caseId]) CR.runHook(s, s.cases[r.caseId], r.onMissed, r.data);
    return vm;
  };

  // ------------------------------------------------------------------ Agenda (manuel uniquement)
  CR.addAgenda = function (s, entry) {
    const a = Object.assign({ id: CR.uid("a"), created: s.day }, entry);
    s.agenda.push(a);
    s.agenda.sort((x, y) => x.day - y.day || (x.min || 0) - (y.min || 0));
    CR.spend(s, 2, "admin", { fixed: true });
    return a;
  };
  CR.removeAgenda = (s, id) => { s.agenda = s.agenda.filter((a) => a.id !== id); };
  CR.agendaOn = (s, day) => s.agenda.filter((a) => a.day === day);

  // ------------------------------------------------------------------ Dossiers
  CR.openCase = function (s, defId) {
    const def = CR.CASES[defId];
    if (!def) throw new Error("Affaire inconnue " + defId);
    const id = defId;
    if (s.cases[id]) return s.cases[id];
    const cs = {
      id, def: defId, status: "lead", opened: s.day, stage: "contact",
      camp: def.camp || "defense",
      notes: [], issues: [], docs: [], drafted: {}, flags: {}, vars: {}, obligs: [], hearings: [],
      trust: def.client && def.client.trust != null ? def.client.trust : 55, lastUpdate: s.day,
      fee: null, costs: 0, billed: 0, collected: 0, worked: 0,
      cards: [], advice: [], conflictChecked: false, outcome: null, debrief: null,
      timeline: [], factsSeen: [], erreurs: [], bons: [], citeLog: [],
      textesParDossier: true,
      proc: null, actors: Object.assign({}, def.actors || {}),
    };
    s.cases[id] = cs;
    s.order.unshift(id);
    cs.vars.base = s.day;
    if (CR.PROC && CR.PROC.init) CR.PROC.init(CR.api(s, cs), def.proc || {});
    if (def.init) def.init(CR.api(s, cs), cs);
    return cs;
  };
  CR.caseDef = (cs) => CR.CASES[cs.def];
  CR.caseTitle = (s, cs) => { const def = CR.caseDef(cs); return (def.titleFn ? def.titleFn(cs) : def.title) || def.id; };
  CR.clientName = (cs) => { const c = CR.caseDef(cs).client || cs.vars.client || {}; return `${c.prenom || ""} ${c.nom || ""}`.trim(); };
  CR.client = (cs) => CR.caseDef(cs).client || cs.vars.client || {};
  CR.activeCases = (s) => s.order.map((id) => s.cases[id]).filter((c) => c && (c.status === "active" || c.status === "prospect"));

  CR.addNote = function (s, cs, note) {
    if (cs.notes.some((n) => n.text === note.text)) return null;
    const n = Object.assign({ id: CR.uid("n"), day: s.day }, note);
    cs.notes.push(n);
    return n;
  };
  CR.hasFact = (cs, fid) => cs.notes.some((n) => n.fact === fid) || cs.cards.includes(fid);
  // Bloc-notes (feuille de route, n° 10) : notes écrites par le joueur, classées, reliées à une pièce ou à un texte, datées
  CR.NOTE_CATS = [["charge", "Charge"], ["decharge", "Décharge"], ["verifier", "À vérifier"], ["delai", "Délai"], ["question", "Question au client"]];
  CR.noteCatLabel = (k) => (CR.NOTE_CATS.find((c) => c[0] === k) || [null, "Non classée"])[1];
  CR.addOwnNote = function (s, cs, o) {
    const text = String(o.text || "").trim();
    if (!text) return null;
    const n = { id: CR.uid("n"), day: s.day, min: s.min, text, fact: null, src: "perso", own: true, cat: o.cat || null, link: o.link || null, quand: o.quand != null ? o.quand : null, heure: o.heure != null ? o.heure : null };
    cs.notes.push(n);
    return n;
  };
  CR.setNote = (cs, id, patch) => { const n = cs.notes.find((x) => x.id === id); if (n) Object.assign(n, patch); return n; };
  CR.removeNote = (cs, id) => { cs.notes = cs.notes.filter((x) => x.id !== id || !x.own); };

  // Textes enregistrés dans un dossier (feuille de route, n° 8) : seuls ceux-là servent au procès.
  // Les dossiers ouverts avant cette règle (sauvegardes anciennes) gardent tous les textes lus.
  CR.isLibId = (id) => !!((CR.lib && CR.lib(id)) || (CR.TEXTES || {})[id]);
  CR.pinnedTexts = (s, cs) => {
    const ids = cs.cards.filter(CR.isLibId);
    if (!cs.textesParDossier) for (const id of s.researched || []) if (!ids.includes(id) && CR.isLibId(id)) ids.push(id);
    return ids;
  };
  CR.textInCase = (s, cs, id) => cs.cards.includes(id) || (!cs.textesParDossier && (s.researched || []).includes(id));
  CR.pinText = (s, cs, id) => { if (!CR.isLibId(id)) return false; if (!s.researched.includes(id)) s.researched.push(id); CR.addCard(cs, id); cs.pinDays = cs.pinDays || {}; if (cs.pinDays[id] == null) cs.pinDays[id] = s.day; return true; };
  CR.unpinText = (s, cs, id) => {
    if (!cs.textesParDossier) { for (const x of CR.pinnedTexts(s, cs)) CR.addCard(cs, x); cs.textesParDossier = true; }
    cs.cards = cs.cards.filter((c) => c !== id);
  };
  CR.pinTexts = (s, cs, ids) => { for (const id of ids) CR.pinText(s, cs, id); };
  CR.inHand = (s, cs, id) => CR.hasFact(cs, id) || CR.textInCase(s, cs, id);
  CR.addIssue = function (s, cs, issue) {
    if (cs.issues.some((i) => i.text === issue.text)) return null;
    const i = Object.assign({ id: CR.uid("i"), day: s.day }, issue);
    cs.issues.push(i);
    return i;
  };
  CR.hasIssue = (cs, flag) => cs.issues.some((i) => i.flag === flag);
  CR.addCard = (cs, id) => { if (!cs.cards.includes(id)) cs.cards.push(id); };
  CR.timeline = (s, cs, text) => { cs.timeline.push({ day: s.day, min: s.min, text }); };

  CR.fileDoc = function (s, cs, d) {
    const doc = Object.assign({ id: CR.uid("d"), day: s.day, dir: "in" }, d);
    cs.docs.push(doc);
    return doc;
  };
  CR.hasDoc = (cs, key) => cs.docs.some((d) => d.key === key);
  CR.renderDoc = function (s, cs, doc) {
    const def = CR.caseDef(cs);
    const src = (def.docs && def.docs[doc.key]) || (CR.SHARED_DOCS && CR.SHARED_DOCS[doc.key]);
    if (!src) return { title: doc.title || "Document", paras: [["(document indisponible)"]] };
    return typeof src === "function" ? src(Object.assign({ s, cs, def, c: CR.client(cs), api: CR.api(s, cs) }, doc.vars || {})) : src;
  };

  // Délais réels suivis en silence par le moteur : rien ne les affiche au joueur
  CR.oblig = function (s, cs, o) {
    const existing = cs.obligs.find((x) => x.id === o.id);
    if (existing) { Object.assign(existing, o); return existing; }
    const ob = Object.assign({ done: false, missed: false, created: s.day }, o);
    cs.obligs.push(ob);
    return ob;
  };
  CR.satisfy = function (s, cs, id) {
    const o = cs.obligs.find((x) => x.id === id);
    if (!o) return null;
    if (!o.done) { o.done = true; o.doneDay = s.day; o.late = s.day > o.due; }
    return o;
  };
  CR.obligOf = (cs, id) => cs.obligs.find((x) => x.id === id);

  // Erreurs et bons réflexes du joueur, pour le débrief
  CR.erreur = (s, cs, e) => { if (!cs.erreurs.some((x) => x.id === e.id)) cs.erreurs.push(Object.assign({ day: s.day }, e)); };
  CR.bon = (s, cs, e) => { if (!cs.bons.some((x) => x.id === e.id)) cs.bons.push(Object.assign({ day: s.day }, e)); };

  // ------------------------------------------------------------------ Argent
  CR.ledgerAdd = (s, e) => { s.ledger.unshift(Object.assign({ day: s.day }, e)); if (s.ledger.length > 300) s.ledger.length = 300; };
  CR.payIn = function (s, amount, label, caseId) {
    s.cash += amount;
    CR.ledgerAdd(s, { label, amount, acct: "op", caseId });
    CR.settleDecouvert(s);
  };
  CR.payOut = function (s, amount, label, caseId) {
    s.cash -= amount;
    CR.ledgerAdd(s, { label, amount: -amount, acct: "op", caseId });
    CR.coverOverdraft(s);
  };
  CR.coverOverdraft = function (s) {
    if (s.cash >= 0) return;
    const need = -s.cash;
    const room = s.decouvert.limit - s.decouvert.used;
    const draw = Math.min(need, room);
    if (draw > 0) {
      s.decouvert.used += draw;
      s.cash += draw;
      CR.ledgerAdd(s, { label: "Découvert autorisé (tirage automatique)", amount: draw, acct: "op" });
    }
  };
  CR.settleDecouvert = function (s) {
    if (s.decouvert.used > 0 && s.cash > 4000) {
      const pay = Math.min(s.decouvert.used, s.cash - 4000);
      if (pay > 0) { s.decouvert.used -= pay; s.cash -= pay; CR.ledgerAdd(s, { label: "Remboursement du découvert", amount: -pay, acct: "op" }); }
    }
  };
  // CARPA : les fonds des clients ne transitent que par elle
  CR.carpaDeposit = function (s, caseId, amount, label) {
    s.carpa += amount;
    s.carpaBy[caseId] = (s.carpaBy[caseId] || 0) + amount;
    CR.ledgerAdd(s, { label, amount, acct: "carpa", caseId });
  };
  CR.carpaWithdraw = function (s, caseId, amount, label, proper = true) {
    s.carpa -= amount;
    s.carpaBy[caseId] = (s.carpaBy[caseId] || 0) - amount;
    CR.ledgerAdd(s, { label, amount: -amount, acct: "carpa", caseId, improper: !proper });
  };
  CR.carpaToOperating = function (s, caseId, amount, label) {
    const avail = Math.max(0, s.earnedBy[caseId] || 0);
    const proper = amount <= avail + 0.5;
    CR.carpaWithdraw(s, caseId, amount, label, proper);
    s.cash += amount;
    CR.ledgerAdd(s, { label, amount, acct: "op", caseId });
    if (proper) s.earnedBy[caseId] = avail - amount;
    else CR.detournement(s, caseId, amount - avail);
    CR.settleDecouvert(s);
    return proper;
  };
  CR.detournement = function (s, caseId, amount) {
    s.flags.detourne = (s.flags.detourne || 0) + amount;
    CR.log(s, `Vous avez fait passer ${CR.money(amount)} de fonds clients sur votre compte professionnel.`, "bad", caseId);
    CR.schedule(s, { day: s.day + R.int(s, 25, 70), type: "fn", key: "carpaControle", data: { caseId, amount } });
  };
  CR.GLOBAL_FN.carpaControle = (s, d) => {
    if (!s.flags.detourne) return;
    const short = s.carpa < 0 || Object.values(s.carpaBy).some((x) => x < -1);
    if (R.chance(s, short ? 0.85 : 0.25) && CR.plainteBatonnier) CR.plainteBatonnier(s, s.cases[d.caseId] || null, "carpa", 10, "Le contrôle de la CARPA relève un maniement de fonds clients sans justification : des sommes destinées à un client ont transité vers votre compte professionnel.");
  };

  CR.monthly = function (s, d) {
    const f = s.fixed;
    const decInt = Math.round(s.decouvert.used * s.decouvert.rate / 12);
    const pretInt = Math.round(s.pret.balance * s.pret.rate / 12);
    const pretPay = s.pret.balance > 0 ? Math.min(s.pret.payment, s.pret.balance + pretInt) : 0;
    s.pret.balance = Math.max(0, s.pret.balance + pretInt - pretPay);
    const items = [
      ["Loyer du bureau (sous-location, 17e)", f.loyer], ["Cotisations sociales URSSAF et CNBF (provision)", f.urssaf], ["Cotisation ordinale et assurance RCP", f.ordre],
      ["Logiciels et bases juridiques", f.logiciels], ["Téléphone et internet", f.telephone], ["Prélèvement personnel (loyer, courses)", f.prelevement],
      ["Échéance du prêt d'installation", pretPay],
    ];
    if (decInt) items.push(["Intérêts du découvert", decInt]);
    let total = 0;
    for (const [label, amt] of items) if (amt > 0) { s.cash -= amt; total += amt; CR.ledgerAdd(s, { day: d, label, amount: -amt, acct: "op" }); }
    CR.coverOverdraft(s);
    // la CARPA verse les rétributions d'aide juridictionnelle du mois écoulé
    const aj = s.ajDue.filter((x) => !x.paid && x.day < d);
    if (aj.length) {
      const tot = CR.sum(aj, (x) => x.montant);
      aj.forEach((x) => { x.paid = d; });
      s.cash += tot;
      s.stats.aj += tot;
      CR.ledgerAdd(s, { day: d, label: `Aide juridictionnelle — ${CR.plural(aj.length, "mission")} (versement CARPA)`, amount: tot, acct: "op" });
      CR.settleDecouvert(s);
    }
    // l'équipe : salaires et charges, rétrocessions, gratifications (equipe.js) ; puis le point déontologique du mois
    if (CR.equipePaie && s.staff && s.staff.length) total += CR.equipePaie(s, d);
    if (CR.equipeMois) CR.equipeMois(s, d);
    if (s.cash < 0) {
      s.overdraftMonths += 1;
      CR.log(s, `Prélèvements rejetés : il manque ${CR.money(-s.cash)} ce mois-ci.`, "bad");
      CR.mail(s, { from: "Banque du Palais", subject: "Rejets de prélèvements", kind: "courrier", important: true,
        body: [["Plusieurs prélèvements sur votre compte professionnel ont été rejetés faute de provision. Votre compte est débiteur de " + CR.money(-s.cash) + "."], ["Nous vous remercions de régulariser la situation. À défaut, nous serons contraints de clôturer le compte et de prononcer la déchéance du terme de votre prêt."]] });
    } else s.overdraftMonths = 0;
    s.lastMonthly = { day: d, total };
  };

  // Mission d'aide juridictionnelle : attestation de fin de mission, payée par la CARPA le mois suivant
  CR.ajMission = function (s, cs, key, note) {
    const b = CR.AJ[key];
    if (!b) return;
    s.ajDue.push({ id: CR.uid("aj"), day: s.day, caseId: cs ? cs.id : null, key, label: b.label, montant: b.montant, paid: null, note: note || "" });
    CR.log(s, `Attestation de fin de mission (AJ) : ${b.label}${cs ? " — " + CR.clientName(cs) : ""}, ${CR.money(b.montant)}.`, "info", cs ? cs.id : null);
  };

  // ------------------------------------------------------------------ Réputations
  CR.REP_LABEL = { clients: "Clients", confreres: "Confrères", siege: "Siège", parquet: "Parquet" };
  CR.rep = function (s, k, d, why) {
    const old = s.reps[k];
    if (d > 0) d *= Math.max(0.15, 1 - old / 110);
    s.reps[k] = CR.clamp(old + d, 0, 100);
    if (why && Math.abs(d) >= 2) CR.log(s, `Réputation (${CR.REP_LABEL[k].toLowerCase()}) ${d > 0 ? "+" : ""}${Math.round(d)} : ${why}`, d > 0 ? "good" : "bad");
  };
  CR.trust = function (s, cs, d) { cs.trust = CR.clamp(cs.trust + d, 0, 100); };

  // ------------------------------------------------------------------ API des affaires
  CR.api = function (s, cs) {
    const def = CR.caseDef(cs);
    const api = {
      s, cs, def, R,
      get today() { return s.day; },
      c: CR.client(cs),
      flag(k, v) { if (v === undefined) return cs.flags[k]; cs.flags[k] = v; return v; },
      vars(k, v) { if (v === undefined) return cs.vars[k]; cs.vars[k] = v; return v; },
      has(fid) { return CR.hasFact(cs, fid); },
      issue(flag) { return CR.hasIssue(cs, flag); },
      card(id) { CR.addCard(cs, id); },
      hasCard(id) { return CR.textInCase(s, cs, id); },
      note(text, fact, src) { return CR.addNote(s, cs, { text, fact, src: src || "file" }); },
      schedule(days, key, data, min, extra) { return CR.schedule(s, Object.assign({ day: s.day + days, min, type: "case", caseId: cs.id, key, data }, extra || {})); },
      at(day, key, data, min, extra) { return CR.schedule(s, Object.assign({ day, min, type: "case", caseId: cs.id, key, data }, extra || {})); },
      cancel(key) { CR.unschedule(s, (e) => e.caseId === cs.id && e.key === key); },
      oblig(o) { return CR.oblig(s, cs, o); },
      satisfy(id) { return CR.satisfy(s, cs, id); },
      obl(id) { return CR.obligOf(cs, id); },
      mail(m) {
        const item = Object.assign({ caseId: cs.id }, m);
        if (m.doc) {
          const d = CR.fileDoc(s, cs, { key: m.doc, title: m.title || m.subject, vars: m.vars || {}, dir: "in" });
          item.docId = d.id;
        }
        return CR.mail(s, item);
      },
      doc(key, title, vars, dir) { return CR.fileDoc(s, cs, { key, title, vars: vars || {}, dir: dir || "in" }); },
      ring(r, minOffset) { return CR.schedule(s, { day: s.day, min: Math.min(19 * 60, Math.max(s.min + (minOffset || 30), 9 * 60 + 10)), type: "ringcase", caseId: cs.id, data: r }); },
      ringOn(day, min, r) { return CR.schedule(s, { day, min, type: "ringcase", caseId: cs.id, data: r }); },
      trust(d) { CR.trust(s, cs, d); },
      rep(k, d, why) { CR.rep(s, k, d, why); },
      log(t, kind) { CR.log(s, t, kind || "info", cs.id); CR.timeline(s, cs, t); },
      tl(t) { CR.timeline(s, cs, t); },
      cost(amount, label) { cs.costs += amount; CR.payOut(s, amount, label + " — " + CR.caseTitle(s, cs), cs.id); },
      pay(amount, label) { CR.payIn(s, amount, label, cs.id); },
      stage(st) { if (st === undefined) return cs.stage; cs.stage = st; },
      status(st) { if (st === undefined) return cs.status; cs.status = st; },
      hearing(h) { return CR.scheduleHearing && CR.scheduleHearing(s, cs, h); },
      disc(kind, sev, text) { return CR.plainteBatonnier && CR.plainteBatonnier(s, cs, kind, sev, text); },
      close(outcome) { return CR.closeCase && CR.closeCase(s, cs, outcome); },
      actor(role) { return cs.actors[role] ? CR.acteur(cs.actors[role]) : null; },
      profil(role) { const a = cs.actors[role] ? CR.acteur(cs.actors[role]) : null; return a ? CR.PROFILS[a.profil] : null; },
      setActor(role, id) { cs.actors[role] = id; },
      date(day, style) { return CR.fmtDate(day, style || "long"); },
      fmt(t, v) { return CR.fmt(t, Object.assign({}, api.v(), v || {})); },
      v() { return CR.caseVars(s, cs); },
      toast(t, k) { CR.toast(s, t, k); },
      run(key, data) { return CR.runHook(s, cs, key, data); },
      erreur(e) { CR.erreur(s, cs, e); },
      bon(e) { CR.bon(s, cs, e); },
      aj(key, note) { CR.ajMission(s, cs, key, note); },
      get proc() { return cs.proc; },
    };
    return api;
  };

  CR.caseVars = function (s, cs) {
    const def = CR.caseDef(cs);
    const c = CR.client(cs);
    const v = Object.assign({}, cs.vars, {
      avocat: `${s.player.prenom} ${s.player.nom}`, maitre: `Me ${s.player.nom}`, cabinet: s.player.cabinet,
      client: `${c.prenom || ""} ${c.nom || ""}`.trim(), prenom: c.prenom, nom: c.nom,
      today: CR.fmtDate(s.day, "long"),
    });
    for (const [role, id] of Object.entries(cs.actors || {})) { const a = CR.acteur(id); if (a) v[role] = a.nom; }
    if (def.dates) for (const [k, off] of Object.entries(def.dates)) {
      const day = (cs.vars.base != null ? cs.vars.base : cs.opened) + off;
      v[k] = CR.fmtDate(day, "long");
      v[k + "Day"] = day;
      v[k + "Short"] = CR.fmtDate(day, "short");
      v[k + "Dow"] = CR.fmtDate(day, "dow");
    }
    if (def.vars) Object.assign(v, typeof def.vars === "function" ? def.vars(s, cs, v) : def.vars);
    return v;
  };
  CR.caseDay = (s, cs, k) => { const def = CR.caseDef(cs); return (cs.vars.base != null ? cs.vars.base : cs.opened) + ((def.dates && def.dates[k]) || 0); };

  // ------------------------------------------------------------------ Nouveaux dossiers et appels entrants
  // Arrivée d'une affaire. Un événement du vivier (data.vivier) passe d'abord par CR.vivierCheck
  // (conditions de déclenchement, canal) ; les canaux « recommandation », « confrère » et « mail »
  // envoient d'abord un message, puis le client se manifeste un peu plus tard (data.annonce).
  // Un événement sans data (ancienne sauvegarde, tutoriel) suit le chemin d'origine.
  CR.EV.lead = (s, e, ctx) => {
    const def = CR.CASES[e.key];
    if (!def) return;
    const d = e.data || {};
    if (d.vivier && s.cases[def.id]) return;
    if (d.vivier && !d.annonce && CR.vivierCheck) {
      const r = CR.vivierCheck(s, def, e);
      if (!r.go) return;
      d.canal = r.canal;
      d.via = r.via || null;
      if (r.annonce) {
        CR.vivierAnnonce(s, def, d);
        let nd = s.day, nm = s.min + R.int(s, 25, 70);
        if (nm > 18 * 60 + 30) { nd = CR.nextBusinessDay(s.day); nm = 9 * 60 + 30 + R.int(s, 0, 90); }
        CR.schedule(s, Object.assign({}, e, { id: CR.uid("e"), day: nd, min: nm, data: Object.assign({}, d, { annonce: true }) }));
        return;
      }
    }
    if (def.arrive && def.arrive.cond && !def.arrive.cond(s)) {
      CR.schedule(s, Object.assign({}, e, { id: CR.uid("e"), day: s.day + 5 }));
      return;
    }
    const cs = CR.openCase(s, def.id);
    cs.vars.base = cs.vars.base != null ? cs.vars.base : s.day;
    const c = CR.client(cs);
    const how = (def.arrive && def.arrive.how) || "appel";
    cs.leadDay = s.day;
    const canal = d.vivier ? d.canal : null;
    if (d.vivier && CR.vivierArrivee) CR.vivierArrivee(s, cs, d);
    if (def.on && def.on.arrive) { CR.runHook(s, cs, "arrive", { _ctx: ctx }); return; }
    const caller = def.caller || `${c.prenom} ${c.nom}`;
    const viaPhrase = d.via ? (d.via.type === "confrere" ? `${d.via.nom} m'a donné vos coordonnées.` : `C'est ${d.via.nom} qui m'a conseillé de m'adresser à vous.`) : null;
    if (how === "courrier" || how === "rdv") {
      cs.status = "lead";
      const m = def.arrive.mail;
      if (canal === "appel" && m) {
        // message laissé sur le répondeur : la demande de rendez-vous, dite au téléphone
        CR.voicemail(s, { from: m.from || caller, kind: "client", at: s.min, vmText: [].concat(...(m.body || [])).map((x) => (typeof x === "string" ? x : x.t || "")).join(" ") + " Je peux passer à votre cabinet quand vous voulez." });
      } else if (m) CR.api(s, cs).mail(viaPhrase ? Object.assign({}, m, { body: [[viaPhrase]].concat(m.body || []) }) : m);
      CR.schedule(s, { day: s.day + (def.leadPatience || 6), type: "case", caseId: cs.id, key: "_leadExpire" });
      return;
    }
    const vm = def.voicemail ? CR.fmt(def.voicemail, CR.caseVars(s, cs)) : null;
    if (canal === "mail") {
      // le client écrit d'abord et demande qu'on le rappelle : tâche « Rappeler » dans le dossier
      CR.api(s, cs).mail({ from: caller, subject: "Besoin d'un avocat — merci de me rappeler", kind: "email", important: !!def.urgence,
        body: [["Maître,"], [vm ? vm.replace(/^Maître,\s*/, "") : `Je m'appelle ${c.prenom} ${c.nom}. J'ai besoin d'un avocat pénaliste, assez vite. Pouvez-vous me rappeler ?`]].concat(c.tel ? [[`Je suis joignable au ${c.tel}.`]] : []) });
      CR.schedule(s, { day: s.day + (def.leadPatience || 3) + 1, type: "case", caseId: cs.id, key: "_leadExpire" });
      return;
    }
    const vmText = viaPhrase ? (vm || `Bonjour, ${caller} à l'appareil. J'ai besoin d'un avocat.`) + " " + viaPhrase + " Rappelez-moi, s'il vous plaît." : vm;
    CR.ringNow(s, { from: caller, caseId: cs.id, kind: def.leadKind || "lead", vmText }, ctx.busy || e.min == null);
    CR.schedule(s, { day: s.day + (def.leadPatience || 3), type: "case", caseId: cs.id, key: "_leadExpire" });
  };
  CR.FLOW_HOOKS._leadExpire = (api) => {
    const cs = api.cs;
    if (cs.status !== "lead") return;
    cs.status = "closed";
    cs.outcome = { type: "lost-lead", day: api.today };
    api.log(`${CR.clientName(cs)} n'a jamais eu de réponse et a pris un autre avocat.`, "bad");
    api.rep("clients", -1);
    api.s.voicemails = api.s.voicemails.filter((v) => v.caseId !== cs.id);
  };
  CR.EV.ringcase = (s, e, ctx) => {
    const cs = s.cases[e.caseId];
    if (!cs || (cs.status === "closed" && !e.always)) return;
    const c = CR.client(cs);
    CR.ringNow(s, Object.assign({ from: `${c.prenom} ${c.nom}`, caseId: cs.id, kind: "client" }, e.data), ctx.busy);
  };

  // ------------------------------------------------------------------ Sauvegarde
  CR.SAVE_KEY = "la-permanence-saves-v2"; // v2 : refonte graphique (novembre 2026), les parties d'avant ne sont plus lues
  CR.serialize = (s) => JSON.stringify(Object.assign({}, s, { toasts: [] }));
  CR.deserialize = (json) => {
    const s = typeof json === "string" ? JSON.parse(json) : json;
    if (!s || !s.player || s.player.prenom == null) throw new Error("Ce fichier n'est pas une sauvegarde de La Permanence");
    s.toasts = [];
    s.ring = s.ring || null;
    s.workCase = null;
    s.revision = s.revision || [];
    if (CR.restoreGenerated) CR.restoreGenerated(s);
    return s;
  };
  CR.saveMeta = (s) => ({
    nom: `${s.player.prenom} ${s.player.nom}`, cabinet: s.player.cabinet, day: s.day, date: CR.fmtDate(s.day), cash: Math.round(s.cash), mode: s.mode,
    dossiers: s.order.filter((id) => s.cases[id] && s.cases[id].status === "active").length, over: !!s.gameOver, savedAt: Date.now(),
  });
})();
