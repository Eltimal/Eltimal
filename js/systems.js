/* La Permanence — systèmes : honoraires, aide juridictionnelle, permanences, personnel, discipline,
   clients détenus, promotion de l'école d'avocats, monde, clôture des dossiers, débrief et fiches de révision */
(function () {
  const CR = (window.CR = window.CR || {});
  const R = CR.R;

  // =================================================================== HONORAIRES
  CR.fairTaux = (s) => Math.round((150 + s.reps.clients * 1.3) / 5) * 5;
  CR.fairForfait = (s, def) => {
    const base = (def.honoraires && def.honoraires.forfait) || 1500;
    return Math.round(base * (0.85 + s.reps.clients / 230) / 50) * 50;
  };
  CR.expectedFee = (s, def, offer) => {
    if (!offer) return 0;
    if (offer.type === "temps") return offer.rate * ((def.honoraires && def.honoraires.heures) || 10);
    return offer.amount + (offer.complement ? offer.complement * 0.4 : 0);
  };
  const TEMPER = {
    ferme: { patience: 1, label: "Ferme" },
    marchandeur: { patience: 5, label: "Marchandeur" },
    anxieux: { patience: 4, label: "Anxieux" },
    mefiant: { patience: 3, label: "Méfiant" },
    presse: { patience: 2, label: "Pressé" },
  };
  CR.TEMPER = TEMPER;
  CR.negStart = function (s, cs) {
    const def = CR.caseDef(cs);
    const p = def.profile;
    const fairT = CR.fairTaux(s), fairF = CR.fairForfait(s, def);
    const k = 0.8 + 0.09 * p.wealth - 0.22 * p.sens + 0.14 * p.urgency + R.range(s, -0.03, 0.03);
    const n = {
      round: 0, patience: TEMPER[p.temper].patience + (cs.trust > 65 ? 1 : 0), explained: false, history: [],
      fairTaux: fairT, fairForfait: fairF, resTaux: Math.round(fairT * k), resForfait: Math.round(fairF * k),
      maxProvision: [0, 400, 1000, 2500, 6000, 15000][p.wealth], first: null, lastCounter: null, done: false, result: null,
    };
    cs.neg = n;
    return n;
  };
  const offerValue = (o) => (o.type === "temps" ? o.rate : o.amount);
  function counterOf(offer, f) {
    const c = Object.assign({}, offer);
    if (offer.type === "temps") c.rate = Math.round(offer.rate * f / 5) * 5;
    else c.amount = Math.round(offer.amount * f / 50) * 50;
    return c;
  }
  CR.offerShort = (o) => (o.type === "temps" ? `${CR.money(o.rate)} HT de l'heure` : `${CR.money(o.amount)} HT`);
  CR.offerText = (o) => {
    if (o.type === "temps") return `Honoraires au temps passé, ${CR.money(o.rate)} HT de l'heure${o.provision ? `, provision de ${CR.money(o.provision)}` : ""}${o.plan ? ", règlement échelonné" : ""}.`;
    return `Forfait de ${CR.money(o.amount)} HT${o.plan ? ", payable en trois fois" : ", moitié à la signature"}${o.complement ? `, plus un honoraire de résultat complémentaire de ${CR.money(o.complement)} HT en cas de ${o.resultat || "succès"}` : ""}.`;
  };
  CR.negPropose = function (s, cs, offer, action) {
    const def = CR.caseDef(cs);
    const p = def.profile;
    const n = cs.neg;
    n.round++;
    if (action === "explain") {
      n.explained = true;
      n.patience -= p.temper === "mefiant" ? 0.5 : 1;
      CR.trust(s, cs, p.temper === "mefiant" ? 6 : 2);
      const line = p.temper === "mefiant" ? "D'accord. Là, je comprends ce que je paie. Personne ne me l'avait expliqué." : "Je vois. Merci.";
      n.history.push({ who: "you", text: "Vous détaillez ce que couvre l'honoraire : rendez-vous, lecture du dossier, actes, audiences, déplacements." }, { who: "client", text: line });
      return { verdict: "ask", line };
    }
    if (!n.first) n.first = offer;
    let resT = n.resTaux, resF = n.resForfait, boost = 1;
    if (p.temper === "anxieux" && offer.type === "forfait") boost *= 1.12;
    if (offer.plan && p.wealth <= 3) boost *= 1.07;
    if (p.temper === "mefiant" && n.explained) boost *= 1.08;
    if (offer.complement && p.urgency > 0.6) boost *= 1.04;
    if (p.temper === "mefiant" && !n.explained && n.round === 1) {
      n.patience -= 1;
      const line = "Avant de dire oui : qu'est-ce que je paie exactement ? Pourquoi ce chiffre ?";
      n.history.push({ who: "you", text: CR.offerText(offer) }, { who: "client", text: line });
      return { verdict: "ask", line, wantsExplain: true };
    }
    const prov = offer.type === "temps" ? offer.provision || 0 : offer.plan ? Math.round(offer.amount / 3) : Math.round(offer.amount / 2);
    if (prov > n.maxProvision && !offer.plan) {
      n.patience -= 1;
      const line = `Je ne peux pas avancer ${CR.money(prov)} tout de suite. Je ne les ai pas.`;
      n.history.push({ who: "you", text: CR.offerText(offer) }, { who: "client", text: line });
      if (n.patience <= 0) return leave(s, cs, "Je suis désolé. Je vais chercher quelqu'un de moins cher.");
      return { verdict: "counter", line, gesture: "plan" };
    }
    let ratio = offer.type === "temps" ? offer.rate / (resT * boost) : offer.amount / (resF * boost);
    const ok = ratio <= 1;
    n.history.push({ who: "you", text: CR.offerText(offer) });
    const T = p.temper;
    if (T === "ferme") return ok ? accept(s, cs, offer, "C'est correct. On fait comme ça.") : leave(s, cs, "Non. Ce n'est pas ce que j'avais prévu. Merci de votre temps.");
    if (T === "marchandeur") {
      const conceded = n.first ? offerValue(offer) <= offerValue(n.first) * 0.9 : false;
      if (ok && n.round >= 2 && conceded) return accept(s, cs, offer, n.round >= 4 ? "Bon. Vous êtes dur en affaires. Marché conclu." : "Allez. D'accord.");
      n.patience -= 1;
      if (n.patience <= 0) return ok ? accept(s, cs, offer, "D'accord. Mais je ne suis pas ravi.") : leave(s, cs, "Laissez tomber. Je vais voir l'avocat d'à côté.");
      const counter = counterOf(offer, n.round === 1 ? R.range(s, 0.7, 0.78) : R.range(s, 0.85, 0.92));
      n.lastCounter = counter;
      const line = n.round === 1 ? `Quand même. Un autre avocat m'a dit ${CR.offerShort(counter)}. Vous pouvez faire ${CR.offerShort(counter)} ?` : `Soyons raisonnables. ${CR.offerShort(counter)}.`;
      n.history.push({ who: "client", text: line });
      return { verdict: "counter", line, counter };
    }
    if (T === "anxieux") {
      if (ok) return accept(s, cs, offer, "D'accord… oui. Merci. J'avais juste besoin de savoir à quoi m'attendre.");
      n.patience -= 1;
      if (n.patience <= 0) return leave(s, cs, "Excusez-moi, c'est trop pour moi en ce moment. Je dois réfléchir.");
      const want = offer.type === "temps" ? "forfait" : !offer.plan ? "plan" : null;
      const line = want === "forfait" ? "Et si ça dure plus longtemps que prévu ? Vous ne pourriez pas me faire un forfait, que je sache le maximum ?" : want === "plan" ? "Je pourrais payer en plusieurs fois ?" : "C'est juste plus que ce que je peux.";
      n.history.push({ who: "client", text: line });
      return { verdict: "counter", line, gesture: want };
    }
    if (T === "mefiant") {
      if (ok) return accept(s, cs, offer, "Bien. Mettez-le par écrit et c'est d'accord.");
      n.patience -= 1;
      if (n.patience <= 0) return leave(s, cs, "Je ne crois pas que ça va marcher entre nous.");
      const counter = counterOf(offer, 0.9);
      n.lastCounter = counter;
      const line = `Ça me paraît cher pour ce que c'est. ${CR.offerShort(counter)} et je signe.`;
      n.history.push({ who: "client", text: line });
      return { verdict: "counter", line, counter };
    }
    if (ok || ratio <= 1.05) return accept(s, cs, offer, "Très bien, très bien. Commençons.");
    n.patience -= 1;
    if (n.patience <= 0) return leave(s, cs, "Je n'ai pas le temps pour ça. Merci.");
    const counter = counterOf(offer, Math.min(0.97, 1 / ratio));
    n.lastCounter = counter;
    const line = `J'ai cinq minutes. ${CR.offerShort(counter)}, oui ou non ?`;
    n.history.push({ who: "client", text: line });
    return { verdict: "counter", line, counter };
  };
  function accept(s, cs, offer, line) {
    const n = cs.neg;
    n.history.push({ who: "client", text: line });
    n.done = true;
    n.result = "accept";
    const def = CR.caseDef(cs);
    const fairRatio = offer.type === "temps" ? offer.rate / n.fairTaux : offer.amount / n.fairForfait;
    cs.fee = Object.assign({}, offer, { agreed: s.day, fairRatio, rounds: n.round, expected: CR.expectedFee(s, def, offer) });
    CR.trust(s, cs, fairRatio <= 1.05 ? 6 : fairRatio > 1.3 ? -4 : 2);
    return { verdict: "accept", line };
  }
  function leave(s, cs, line) {
    const n = cs.neg;
    n.history.push({ who: "client", text: line });
    n.done = true;
    n.result = "leave";
    cs.flags.negFailed = true;
    CR.closeCase(s, cs, { type: "lost-lead", note: "Le client est parti pendant la discussion des honoraires." });
    return { verdict: "leave", line };
  }
  // Honoraire de résultat : la clause de la convention nomme le résultat (« relaxe ou peine réduite »,
  // « condamnation et indemnisation »…) ; « et » exige chaque terme, « ou » l'un d'eux.
  // En défense, une issue au moins aussi favorable (relaxe, acquittement, non-lieu, classement) remplit toujours la clause.
  // Une affaire jugée sans vous, ou que vous avez quittée, ne donne jamais droit à l'honoraire de résultat.
  const FEE_CLEAN = ["relaxe", "acquittement", "non_lieu", "classement", "prescrit"];
  const FEE_NONE = ["declined", "fired", "lost-lead", "transferred", "withdrawn"];
  const peineScore = (p) => (p.ferme || 0) * 100 + (p.sursis || 0) * 10 + (p.amende || 0) / 100;
  const peineReduite = (cs) => {
    const p = cs.vars.peine, q = cs.vars.requisJuge || cs.vars.requis;
    return !!(p && q) && peineScore(p) < peineScore(q);
  };
  const civilIntegral = (cs) => { const c = cs.vars.civil; return !!(c && c.lignes && c.lignes.length && c.lignes.every((l) => l.justifie && l.alloue > 0)); };
  const RESULT_TERMS = [
    [/relaxe|acquittement/, (o) => ["relaxe", "acquittement"].includes(o.type)],
    [/requalification/, (o) => o.type === "requalification_favorable"],
    [/classement/, (o) => o.type === "classement"],
    [/alternative/, (o) => o.type === "alternative"],
    [/non-lieu/, (o) => o.type === "non_lieu"],
    [/infirmation|réformation/, (o) => o.type === "reformation"],
    [/mise en liberté/, (o, cs) => cs.flags.miseEnLiberte != null],
    [/correctionnalisation/, (o, cs) => cs.vars.ortcAcceptee != null],
    [/peine réduite/, (o, cs) => peineReduite(cs)],
    [/permis/, (o, cs) => o.type === "crpc" ? !/permis/i.test(o.detail || "") : ["condamnation", "requalification_favorable"].includes(o.type) && !!cs.vars.peine && !/permis/i.test(cs.vars.peine.texte || "")],
    [/indemnisation intégrale/, (o, cs) => o.type === "indemnise" && civilIntegral(cs)],
    [/indemnisation|récupération/, (o) => o.type === "indemnise"],
    [/condamnation/, (o, cs) => o.type === "indemnise" || (o.type === "done" && !!(cs.vars.decision && cs.vars.decision.coupable))],
  ];
  CR.resultatAtteint = function (s, cs, outcome) {
    const o = outcome || cs.outcome;
    if (!o || FEE_NONE.includes(o.type) || /sans (votre défense|avocat|l'avocat)/.test(o.detail || "")) return false;
    const def = CR.caseDef(cs);
    const h = def.honoraires || {};
    if (typeof h.succes === "function") return !!h.succes(CR.api(s, cs), o);
    if (cs.camp !== "pc" && FEE_CLEAN.includes(o.type)) return true;
    const clause = String((cs.fee && cs.fee.resultat) || h.resultat || "succès").toLowerCase();
    const generic = () => (cs.camp === "pc" ? o.type === "indemnise" : ["requalification_favorable", "reformation"].includes(o.type));
    return clause.split(/\s+et\s+/).every((grp) => grp.split(/\s+ou\s+|,\s*/).some((term) => {
      const rule = RESULT_TERMS.find(([re]) => re.test(term));
      return rule ? rule[1](o, cs) : generic();
    }));
  };

  // Facturation à la clôture : le forfait, ou le temps passé au taux convenu (la provision s'impute dessus),
  // plus l'honoraire de résultat si la clause est remplie. Le trop-perçu de provision est restitué au client.
  CR.factureCloture = function (s, cs) {
    const f = cs.fee;
    if (!f || cs.aj || cs.engaged == null) return null;
    const name = CR.clientName(cs);
    const lignes = [];
    if (f.type === "temps") {
      const minutes = cs.worked || 0;
      lignes.push({ label: `Temps passé : ${minutes ? CR.fmtDuration(minutes) : "aucun"} à ${CR.money(f.rate)} HT de l'heure`, amount: Math.round(f.rate * minutes / 60) });
    } else lignes.push({ label: "Forfait convenu", amount: f.amount });
    const resultat = f.complement > 0 ? CR.resultatAtteint(s, cs) : null;
    if (resultat) lignes.push({ label: `Honoraire de résultat (${f.resultat || "succès"})`, amount: f.complement });
    const total = lignes.reduce((t, l) => t + l.amount, 0);
    const deja = cs.collected;
    const rest = total - deja;
    cs.billed = total;
    cs.facture = { day: s.day, lignes, total, deja, reste: rest, resultat };
    const body = [[`Dossier clos : ${CR.caseTitle(s, cs)}.`], ...lignes.map((l) => [`• ${l.label} : ${CR.money(l.amount)} HT`]), [`Total : ${CR.money(total)} HT. Déjà encaissé : ${CR.money(deja)}.`]];
    if (resultat === false) body.push([`L'honoraire de résultat (${f.resultat || "succès"}) n'est pas dû : le résultat prévu par la convention n'est pas atteint.`]);
    if (rest > 0) {
      const p = CR.caseDef(cs).profile || {};
      const delay = R.int(s, 8, 25) + (f.fairRatio > 1.3 ? 20 : 0) + (p.wealth <= 1 ? 25 : 0) + (resultat ? 5 : 0);
      const impaye = p.payeur === "mauvais" || cs.vars.vieMauvaisPayeur || (cs.trust < 25 && R.chance(s, 0.4));
      CR.schedule(s, { day: s.day + delay, type: "fn", key: "solde", data: { caseId: cs.id, amount: rest, impaye, label: resultat ? "Solde d'honoraires et honoraire de résultat" : "Solde d'honoraires" } });
      body.push([`Facture envoyée : reste dû ${CR.money(rest)}.`]);
    } else if (rest < 0) {
      CR.payOut(s, -rest, `Restitution du trop-perçu de provision — ${name}`, cs.id);
      cs.collected += rest;
      s.stats.honoraires += rest;
      body.push([`La provision dépasse les honoraires dus : ${CR.money(-rest)} restitués au client.`]);
    } else body.push(["Rien à facturer en plus : la provision couvre les honoraires."]);
    CR.mail(s, { from: "Vous (note pour vous-même)", subject: `Facture de clôture — ${name}`, kind: "note", caseId: cs.id, body });
    return cs.facture;
  };
  CR.GLOBAL_FN.solde = (s, d) => {
    const cs = s.cases[d.caseId];
    if (d.impaye) {
      CR.mail(s, { from: "Votre expert-comptable", subject: `Facture impayée — ${cs ? CR.clientName(cs) : "client"}`, kind: "email", body: [[`Le solde de ${CR.money(d.amount)} n'est toujours pas réglé. Une relance s'impose ; en cas de contestation, c'est le bâtonnier qui fixe les honoraires.`]] });
      if (cs) cs.flags.impaye = true;
      return;
    }
    CR.payIn(s, d.amount, `${d.label || "Solde d'honoraires"} — ${cs ? CR.clientName(cs) : "client"}`, d.caseId);
    if (cs) cs.collected += d.amount;
    s.stats.honoraires += d.amount;
  };

  // =================================================================== AUDIENCES
  CR.scheduleHearing = function (s, cs, h) {
    const hr = Object.assign({ id: CR.uid("h"), attended: false, missed: false }, h);
    cs.hearings.push(hr);
    if (!h.noCall) CR.schedule(s, { day: hr.day, min: hr.min + 25, type: "courtCall", caseId: cs.id, data: { hid: hr.id } });
    CR.schedule(s, { day: hr.day + 1, type: "courtCheck", caseId: cs.id, data: { hid: hr.id }, prio: -1 });
    if (s.mode === "carriere") CR.noteChevauchement(s, cs, hr);
    return hr;
  };

  // Chevauchements (parties de carrière) : un seul par partie, que le joueur règle par un renvoi
  // ou une substitution ; les suivants sont arrangés d'office avec le greffe (affaire retenue en fin de rôle).
  const HDUR = (h) => h.duree || (["assises", "ccd"].includes(h.juridiction) ? 300 : 90);
  CR.hearingClash = function (s, cs, h) {
    for (const id of s.order) {
      const o = s.cases[id];
      if (!o || o.id === cs.id || o.status === "closed") continue;
      for (const x of o.hearings) {
        if (x.day !== h.day || x.attended || x.missed || x.canceled) continue;
        if (h.min < x.min + HDUR(x) + 30 && x.min < h.min + HDUR(h) + 30) return { cs: o, h: x };
      }
    }
    return null;
  };
  CR.noteChevauchement = function (s, cs, hr) {
    const clash = CR.hearingClash(s, cs, hr);
    if (!clash) return;
    if (!s.chevauchement) {
      s.chevauchement = { day: hr.day, a: { caseId: cs.id, hid: hr.id }, b: { caseId: clash.cs.id, hid: clash.h.id }, solution: null };
      hr.conflit = { caseId: clash.cs.id, hid: clash.h.id };
      clash.h.conflit = { caseId: cs.id, hid: hr.id };
      return;
    }
    hr.finDeRole = true;
    CR.timeline(s, cs, `${hr.title} (${CR.fmtDate(hr.day, "long")}) : prévenu de votre autre audience du même jour, le greffe retiendra l'affaire après elle.`);
  };
  CR.renvoyable = (cs, h) => {
    const a = cs.proc && cs.proc.audience;
    return !!(a && a.hid === h.id && ["tc", "chapp"].includes(a.juridiction) && ["convocation", "ordonnance", "appel", "opposition"].includes(a.mode) && !(cs.proc.detention && cs.proc.detention.statut === "dp"));
  };
  const finChevauchement = (CR.finChevauchement = (s, solution) => {
    const ch = s.chevauchement;
    if (!ch) return;
    ch.solution = solution;
    for (const k of ["a", "b"]) { const c = s.cases[ch[k].caseId]; const h = c && CR.hearingById(c, ch[k].hid); if (h) h.conflit = null; }
  });
  CR.chevauchementTasks = function (s, cs, T) {
    const ch = s.chevauchement;
    if (!ch || ch.solution) return;
    for (const h of cs.hearings) {
      if (!h.conflit || h.attended || h.missed || h.canceled || h.day < s.day) continue;
      const oc = s.cases[h.conflit.caseId];
      const oh = oc && CR.hearingById(oc, h.conflit.hid);
      if (!oh || oh.canceled || oh.attended || oc.status === "closed") continue;
      const autre = `${oh.title} (${CR.caseTitle(s, oc)}, ${CR.fmtTime(oh.min)})`;
      T({ id: "substitut_" + h.id, label: "Se faire substituer par un confrère", sub: `${h.title}, ${CR.fmtDate(h.day, "dowshort")} à ${CR.fmtTime(h.min)}, tombe en même temps que ${autre}. Un confrère répond à l'appel de l'affaire et la fait retenir jusqu'à votre arrivée (120 € HT).`, kind: "call", time: 15, urgent: h.day - s.day <= 3, run: () => { CR.substituer(s, cs, h); return null; } });
      if (CR.renvoyable(cs, h) && s.day < h.day && !h.renvoiRefuse) T({ id: "renvoi_" + h.id, label: "Demander le renvoi de l'audience", sub: `Écrire au président : vous plaidez au même moment dans un autre dossier — ${autre}. Le renvoi n'est pas de droit ; demandé la veille, il peut être refusé.`, kind: "draft", time: 20, run: () => { CR.demanderRenvoi(s, cs, h); return null; } });
    }
  };
  CR.substituer = function (s, cs, h) {
    CR.spend(s, 15, "call", { caseId: cs.id });
    const conf = s.reps.confreres >= 16 ? "Me Chloé Tessier" : "Me Mehdi Belkacem";
    h.substitue = conf;
    CR.payOut(s, 120, `Substitution à l'audience — ${conf}`, cs.id);
    CR.mail(s, { from: conf, subject: `Substitution — ${CR.clientName(cs)}`, kind: "email", caseId: cs.id,
      body: [["Mon cher confrère,"], [`C'est entendu : le ${CR.fmtDate(h.day, "long")}, je réponds pour vous à l'appel de l'affaire ${CR.clientName(cs)} et je la fais retenir jusqu'à votre arrivée. Venez dès que vous êtes libéré.`], ["Bien confraternellement."]] });
    CR.timeline(s, cs, `${conf} vous substituera à l'appel de l'affaire le ${CR.fmtDate(h.day, "long")}.`);
    finChevauchement(s, "substitution");
  };
  CR.demanderRenvoi = function (s, cs, h) {
    CR.spend(s, 20, "desk", { caseId: cs.id });
    const old = h.day;
    if (s.day >= old - 1 && !R.chance(s, 0.6)) {
      h.renvoiRefuse = true;
      CR.mail(s, { from: "Greffe correctionnel", subject: `Demande de renvoi — ${CR.clientName(cs)}`, kind: "greffe", caseId: cs.id, body: [[`Le président ne fait pas droit à votre demande de renvoi, présentée la veille de l'audience. L'affaire sera appelée le ${CR.fmtDate(old, "long")} à ${CR.fmtTime(h.min)}.`]] });
      CR.timeline(s, cs, "Renvoi refusé : demande trop tardive.");
      return false;
    }
    let nd = old + 14;
    while (!CR.isBusinessDay(nd) || CR.dow(nd) !== CR.dow(old) || CR.hearingClash(s, cs, Object.assign({}, h, { day: nd }))) nd += 7;
    const delta = nd - old;
    h.day = nd;
    h.conflit = null;
    if (cs.proc && cs.proc.audience && cs.proc.audience.hid === h.id) cs.proc.audience.day = nd;
    for (const o of cs.obligs) if (o.id === "art385_" + h.id && !o.done) o.due = nd - 3;
    for (const e of s.pending) if (e.caseId === cs.id && e.data && e.data.hid === h.id) e.day += delta;
    CR.mail(s, { from: "Greffe correctionnel", subject: `Renvoi accordé — ${CR.clientName(cs)}`, kind: "greffe", caseId: cs.id, important: true, body: [[`À votre demande, motivée par une autre audience au même moment, l'affaire ${CR.clientName(cs)} est renvoyée au ${CR.fmtDate(nd, "dow")} à ${CR.fmtTime(h.min)}.`]] });
    CR.timeline(s, cs, `Audience renvoyée au ${CR.fmtDate(nd, "long")} (autre audience le ${CR.fmtDate(old, "long")}).`);
    finChevauchement(s, "renvoi");
    return true;
  };
  CR.hearingToday = (s, cs) => (cs.status === "closed" ? null : cs.hearings.find((h) => h.day === s.day && !h.attended && !h.missed && !h.canceled));
  CR.hearingsToday = (s) => s.order.map((id) => s.cases[id]).filter((c) => c && c.status !== "closed").map((c) => ({ c, h: CR.hearingToday(s, c) })).filter((x) => x.h);
  CR.hearingById = (cs, id) => cs.hearings.find((h) => h.id === id);
  CR.EV.courtCall = (s, e, ctx) => {
    const cs = s.cases[e.caseId];
    if (!cs) return;
    const h = CR.hearingById(cs, e.data.hid);
    if (!h || h.attended || h.missed || h.canceled || cs.status === "closed") return;
    if (ctx.busy || s.burnout || h.finDeRole || h.substitue) return;
    CR.ringNow(s, { from: h.callerLabel || "Le greffe", caseId: cs.id, kind: "greffe", data: { hid: h.id },
      vmText: `Maître, ici le greffe. L'affaire ${CR.clientName(cs)} a été appelée ce matin et personne ne s'est présenté pour la défense.` }, false);
  };
  CR.EV.courtCheck = (s, e) => {
    const cs = s.cases[e.caseId];
    if (!cs) return;
    const h = CR.hearingById(cs, e.data.hid);
    if (!h || h.attended || h.canceled || cs.status === "closed") return;
    h.missed = true;
    CR.rep(s, "siege", -4, "absent à une audience");
    CR.timeline(s, cs, `Absent : ${h.title}.`);
    CR.erreur(s, cs, { id: "absent_" + h.id, texte: `Vous n'êtes pas venu à : ${h.title} (${CR.fmtDate(h.day, "long")}).`, sanction: "L'audience s'est tenue sans avocat, ou l'affaire a été renvoyée à vos dépens.", regul: "Aucune pour cette audience." });
    if (h.onMiss) CR.runHook(s, cs, h.onMiss, { hearing: h });
  };

  // =================================================================== CLIENTS
  CR.dailyClients = function (s, d) {
    for (const id of s.order) {
      const cs = s.cases[id];
      if (!cs || cs.status !== "active") continue;
      const def = CR.caseDef(cs);
      const p = def.profile || { temper: "anxieux" };
      const gap = { anxieux: 16, mefiant: 20, marchandeur: 26, presse: 32, ferme: 40 }[p.temper] || 26;
      const since = d - cs.lastUpdate;
      if (!def.silent && since > gap && !s.pending.some((e) => e.caseId === id && e.type === "ringcase") && R.chance(s, 0.25)) {
        const c = CR.client(cs);
        CR.schedule(s, { day: d, min: R.int(s, 10 * 60, 18 * 60), type: "ringcase", caseId: id, data: { kind: "update", from: def.caller || `${c.prenom} ${c.nom}`, vmText: def.vmUpdate || `Bonjour, c'est ${c.prenom} ${c.nom}. Je n'ai pas de nouvelles depuis un moment. Où en est mon dossier ? Rappelez-moi, s'il vous plaît.` } });
      }
      if (since > gap * 2.2) {
        CR.trust(s, cs, -1.2);
        if (cs.trust < 18 && !cs.flags.plainteNegligence && R.chance(s, 0.04)) {
          cs.flags.plainteNegligence = true;
          CR.plainteBatonnier(s, cs, "diligence", 4, `${CR.clientName(cs)} se plaint de ne plus avoir de nouvelles de son avocat et de ne pas être tenu informé de son dossier.`);
        }
      }
    }
  };
  CR.updatedClient = (s, cs, quality = 1) => { cs.lastUpdate = s.day; CR.trust(s, cs, 4 * quality); };

  // =================================================================== PERMANENCES ET NOUVEAUX DOSSIERS
  // s.duty : [{ day, type: 'gav_jour'|'gav_nuit'|'ci' }]
  CR.DUTY_LABEL = { gav_jour: "Permanence de garde à vue (jour)", gav_nuit: "Permanence de garde à vue (nuit)", ci: "Permanence de comparution immédiate" };
  CR.signDuty = function (s, day, type) {
    if (s.duty.some((d) => d.day === day && d.type === type)) return false;
    s.duty.push({ day, type, signed: s.day });
    s.duty.sort((a, b) => a.day - b.day);
    if (CR.planDuty) CR.planDuty(s, day, type);
    return true;
  };
  CR.dutyOn = (s, day) => s.duty.filter((d) => d.day === day);
  CR.dailyLeads = function (s, d) {
    if (s.mode !== "carriere") return;
    if (!CR.GEN || !CR.GEN.lead) return;
    // Phase 2 : cinq à quinze affaires criminelles par année de carrière, au milieu des délits
    if (CR.GEN2 && CR.GEN2.infoDue && CR.GEN2.infoDue(s, d)) { CR.GEN.lead(s, d, "info"); return; }
    // l'ouverture de la carrière : une petite affaire dans les premiers jours ouvrables, si rien n'est encore venu (le rôle
    // que tenait l'affaire écrite d'ouverture, retirée avec les autres le 14 novembre 2026)
    if (!s.flags.premiereAffaire && CR.isBusinessDay(d) && d >= 1) {
      const r0 = CR.seeded("ouverture:" + s.seed);
      if (s.order.length) s.flags.premiereAffaire = true;
      else if (d >= 3 || r0() < 0.45) { s.flags.premiereAffaire = true; CR.GEN.lead(s, d, ["copj", "op", "al"][Math.floor(r0() * 3)]); return; }
    }
    // Moteur génératif : les nouveaux clients viennent surtout du générateur (convocations, auditions libres, victimes, ordonnances)
    let p = (0.16 + s.reps.clients * 0.003) * (CR.CAR ? CR.CAR.apport(s) : 1);
    if (!CR.isBusinessDay(s.day)) p *= 0.3;
    if (!R.chance(s, p)) return;
    // phase 3 : parfois, une personne déjà rencontrée revient (récidiviste, victime devenue prévenue, et inversement)
    if (CR.GEN2 && CR.GEN2.VIE && R.chance(s, 0.14)) {
      const rv = CR.GEN2.VIE.revenantPour(s);
      if (rv) {
        try {
          const kind = rv.kind || ["copj", "al", "op"][R.int(s, 0, 2)];
          CR.GEN.lead(s, d, kind, { revenant: rv.revenant });
          s.revenus = (s.revenus || []).concat([rv.cle]);
          return;
        } catch (e) { /* aucune affaire compatible : un nouveau client ordinaire */ }
      }
    }
    CR.GEN.lead(s, d);
  };

  // =================================================================== CHOISIR SES DOSSIERS (phase 3)
  // Un nouveau dossier s'accepte (premier rendez-vous), se refuse ou se transmet à un confrère. Les commissions d'office
  // suivent leur propre règle (un motif d'excuse ou d'empêchement, gen-vie.js). Conséquences : réputation, réseau,
  // trésorerie (aucun honoraire), charge de travail, relation avec le confrère (s.reseau, de 0 à 100).
  CR.chargeTravail = (s) => s.order.map((id) => s.cases[id]).filter((c) => c && ["active", "prospect"].includes(c.status)).length;
  CR.relation = (s, id) => { s.reseau = s.reseau || {}; return s.reseau[id] != null ? s.reseau[id] : 50; };
  CR.choixDossierTasks = function (s, cs, T) {
    const def = CR.caseDef(cs);
    if (s.mode !== "carriere" || def.leadKind === "permanence" || def.noChoix || (def.honoraires && def.honoraires.aj && def.caller && /Permanence/.test(def.caller))) return;
    const charge = CR.chargeTravail(s);
    T({ id: "refuser", label: "Refuser le dossier", sub: `Répondre vite, en rappelant au client ses délais. ${charge >= 8 ? `Vous suivez déjà ${charge} dossiers.` : "Aucun honoraire, mais du temps libéré."}`, kind: "call", time: 10, danger: true, run: () => { CR.refuserDossier(s, cs); return null; } });
    T({ id: "transmettre", label: "Transmettre à un confrère", sub: "Orienter le client vers un confrère : il vous en saura gré, et le confrère aussi.", kind: "call", time: 15, run: () => ({ scene: "decide", key: "_transmettreChoix" }) });
  };
  CR.refuserDossier = function (s, cs) {
    const def = CR.caseDef(cs);
    CR.spend(s, 10, "call", { caseId: cs.id });
    const vite = s.day - (cs.leadDay != null ? cs.leadDay : s.day) <= 1;
    const pt = def.generated && CR.GEN && CR.GEN.paramsOf ? CR.GEN.paramsOf(s, cs.id).t : null;
    const reply = pt && CR.GEN2.PR.vie ? CR.GEN2.PR.vie.refus(pt) : null;
    CR.log(s, `Dossier refusé : ${CR.clientName(cs)}.${reply ? ` « ${reply} »` : ""}`, "info", cs.id);
    if (!vite) CR.rep(s, "clients", -0.5, "réponse tardive à un client");
    if (def.urgence) CR.rep(s, "clients", -1, "refus d'un dossier urgent");
    s.stats.refus = (s.stats.refus || 0) + 1;
    CR.closeCase(s, cs, { type: "declined", detail: "dossier refusé" });
  };
  CR.FLOW_HOOKS._transmettreChoix = (api) => {
    const { s, cs } = api;
    const def = CR.caseDef(cs);
    const crim = def.domaine === "criminel" || def.genre === "info";
    const conf = CR.ACTEURS.filter((a) => a.role === "confrere");
    return {
      title: "Transmettre le dossier à un confrère",
      text: [`Le client vous fait confiance : à qui l'adresser ? ${crim ? "Une affaire criminelle demande un confrère aguerri." : "Choisissez selon le dossier et selon vos liens."}`, "Pas de rémunération pour l'apport d'un client entre avocats (art. 11.3 du règlement intérieur national) ; le confrère s'en souviendra."],
      options: conf.map((a) => ({ t: a.nom, sub: `${(CR.PROFILS[a.profil] || {}).label || "Confrère"} · relation ${CR.relation(s, a.id)} / 100${a.blurb ? " · " + a.blurb : ""}`, hook: "_transmettreA", data: { id: a.id } })).concat([{ t: "Finalement, garder le dossier", hook: "_transmettreAnnule" }]),
    };
  };
  CR.FLOW_HOOKS._transmettreAnnule = () => null;
  CR.FLOW_HOOKS._transmettreA = (api, { id }) => { CR.transmettreDossier(api.s, api.cs, id); return null; };
  CR.transmettreDossier = function (s, cs, id) {
    const def = CR.caseDef(cs);
    const a = CR.acteur(id) || { nom: "un confrère", profil: "debutant" };
    CR.spend(s, 15, "call", { caseId: cs.id });
    s.reseau = s.reseau || {};
    const crim = def.domaine === "criminel" || def.genre === "info";
    const adapte = !(crim && a.profil === "debutant");
    s.reseau[id] = Math.max(0, Math.min(100, CR.relation(s, id) + (adapte ? 8 : 3)));
    CR.rep(s, "confreres", adapte ? 1.5 : 0.5, `dossier transmis à ${a.nom}`);
    if (!adapte) CR.rep(s, "clients", -1, "un dossier criminel confié à un confrère débutant");
    else CR.rep(s, "clients", 0.5, "un client bien orienté");
    const pt = def.generated && CR.GEN && CR.GEN.paramsOf ? CR.GEN.paramsOf(s, cs.id).t : null;
    const reply = pt && CR.GEN2.PR.vie ? CR.GEN2.PR.vie.transmis(pt, a.nom) : null;
    CR.log(s, `Dossier transmis à ${a.nom} : ${CR.clientName(cs)}.${reply ? ` « ${reply} »` : ""}`, "good", cs.id);
    s.stats.transmis = (s.stats.transmis || 0) + 1;
    CR.closeCase(s, cs, { type: "transferred", detail: `transmis à ${a.nom}` });
    // un confrère reconnaissant rend la pareille, plus tard, si la relation est bonne
    if (s.mode === "carriere" && s.reseau[id] >= 58 && R.chance(s, 0.6)) CR.schedule(s, { day: s.day + R.int(s, 20, 60), min: 10 * 60 + R.int(s, 0, 360), type: "fn", key: "ascenseur", data: { id } });
  };
  CR.GLOBAL_FN.ascenseur = (s, d) => {
    if (s.burnout || s.gameOver || !CR.GEN || !CR.GEN.lead) return;
    const a = CR.acteur(d.id) || { nom: "Un confrère" };
    CR.mail(s, { from: a.nom, subject: "Un dossier pour vous", kind: "email", body: [[`Mon cher confrère, en retour de votre confiance, je vous adresse un client que je ne peux pas suivre. Il va vous appeler. Bien confraternellement, ${a.nom}.`]] });
    try { CR.GEN.lead(s, { day: s.day }, CR.GEN2 ? CR.GEN2.leadKind(s) : undefined); } catch (e) { console.error(e); }
    s.reseau = s.reseau || {};
    s.reseau[d.id] = Math.min(100, CR.relation(s, d.id) + 2);
  };

  // =================================================================== PERSONNEL
  // L'équipe du cabinet vit dans equipe.js (feuille de route, n° 14) : postes, recrutement, tâches confiées,
  // assistante au téléphone, paie, moral, départs. Plus aucun revenu tiré au hasard.
  CR.staffOf = (s, role) => (s.staff || []).find((x) => x.role === role && !(x.depart && x.depart.fait));
  CR.dailyStaff = function (s, d) {
    if (CR.ymd(d).d <= 3 && CR.ymd(d).w === 1 && CR.refreshApplicants) CR.refreshApplicants(s);
    if (CR.equipeJour) CR.equipeJour(s, d);
  };

  // =================================================================== DISCIPLINE (bâtonnier, conseil de discipline)
  const ORDRE = "Ordre des avocats de Paris — Le bâtonnier";
  CR.plainteBatonnier = function (s, cs, kind, sev, text) {
    const g = { id: CR.uid("g"), day: s.day, kind, sev, text, caseId: cs ? cs.id : null, respondBy: CR.rollForward(s.day + 15), response: null };
    s.disc.open.push(g);
    CR.mail(s, { from: ORDRE, subject: "Réclamation — demande d'explications", kind: "ordre", important: true, grievance: g.id,
      body: [["Mon cher confrère,"], ["Je suis saisi d'une réclamation vous concernant, dont je vous communique la teneur :"], [text], ["Je vous remercie de bien vouloir me faire parvenir vos explications écrites dans un délai de quinze jours."], ["Veuillez croire, mon cher confrère, à l'assurance de mes sentiments confraternels."]] });
    CR.log(s, `Réclamation adressée au bâtonnier : ${kind}.`, "bad", g.caseId);
    return g;
  };
  CR.answerGrievance = function (s, gid, quality) {
    const g = s.disc.open.find((x) => x.id === gid);
    if (!g || g.response) return;
    g.response = quality;
    g.responseDay = s.day;
    g.late = s.day > g.respondBy;
    CR.spend(s, quality === "candide" ? 150 : 90, "desk");
    CR.schedule(s, { day: s.day + R.int(s, 40, 100), type: "fn", key: "grievanceOutcome", data: { gid } });
  };
  CR.dailyDiscipline = function (s, d) {
    for (const g of s.disc.open) {
      if (!g.response && !g.relance && d > g.respondBy + 20) {
        g.relance = true;
        g.sev += 3;
        CR.mail(s, { from: ORDRE, subject: "Relance — absence d'explications", kind: "ordre", important: true, body: [["Je n'ai pas reçu vos explications. Le défaut de réponse au bâtonnier constitue en lui-même un manquement à la délicatesse et à la confraternité."]] });
        CR.schedule(s, { day: d + 40, type: "fn", key: "grievanceOutcome", data: { gid: g.id } });
      }
    }
  };
  CR.SANCTIONS = ["Classement", "Rappel des règles par le bâtonnier", "Avertissement", "Blâme", "Interdiction temporaire", "Radiation"];
  CR.GLOBAL_FN.grievanceOutcome = (s, d) => {
    const g = s.disc.open.find((x) => x.id === d.gid);
    if (!g || g.decided) return;
    g.decided = true;
    let score = g.sev + s.disc.points * 0.6;
    if (g.response === "candide") score -= 2;
    if (g.response === "accuse") score += 2;
    if (!g.response) score += 4;
    if (g.late) score += 1;
    if (g.kind === "carpa") score += 4;
    const level = score < 3 ? 0 : score < 5 ? 1 : score < 7 ? 2 : score < 9.5 ? 3 : score < 12 ? 4 : 5;
    g.outcome = CR.SANCTIONS[level];
    s.disc.open = s.disc.open.filter((x) => x !== g);
    s.disc.record.push({ day: s.day, kind: g.kind, sanction: g.outcome, text: g.text });
    s.disc.points += level;
    const lines = {
      0: "Après examen de vos explications, je classe la réclamation.",
      1: "Je classe la réclamation, non sans vous rappeler les règles de notre profession. Ce rappel n'est pas une sanction, mais il est versé à votre dossier.",
      2: "Le conseil de discipline vous inflige un avertissement (art. 184 du décret du 27 novembre 1991).",
      3: "Le conseil de discipline vous inflige un blâme. La décision est inscrite à votre dossier.",
      4: "Le conseil de discipline prononce à votre encontre une interdiction temporaire d'exercer de six mois.",
      5: "Le conseil de discipline prononce votre radiation du tableau de l'Ordre.",
    };
    CR.mail(s, { from: level >= 2 ? "Conseil régional de discipline des avocats" : ORDRE, subject: `Décision : ${g.outcome}`, kind: "ordre", important: true, body: [[lines[level]], [g.text]] });
    CR.log(s, `Discipline : ${g.outcome}.`, level >= 2 ? "bad" : "info");
    if (level >= 3) { CR.rep(s, "clients", -10 * (level - 2), "sanction disciplinaire"); CR.rep(s, "confreres", -8 * (level - 2)); }
    if (level === 4) CR.suspend(s);
    if (level === 5) CR.endGame(s, "radie", "Le conseil de discipline a prononcé votre radiation du tableau de l'Ordre.");
  };
  CR.suspend = function (s) {
    for (const id of s.order) {
      const cs = s.cases[id];
      if (cs && (cs.status === "active" || cs.status === "prospect")) CR.closeCase(s, cs, { type: "transferred", note: "Dossier transmis à un confrère pendant votre interdiction temporaire." });
    }
    s.flags.suspendedUntil = s.day + 182;
    CR.log(s, "Interdit d'exercer pour six mois. Tous vos dossiers ont été transmis à des confrères.", "bad");
  };
  // Mise en cause de la responsabilité civile professionnelle
  CR.rcp = function (s, cs, why) {
    if (cs.flags.rcp) return;
    cs.flags.rcp = true;
    CR.mail(s, { from: "Me Sandrine Kerjean, avocate", subject: `Mise en cause de votre responsabilité civile professionnelle — ${CR.clientName(cs)}`, kind: "courrier", important: true,
      body: [[`Je représente votre ancien client, ${CR.clientName(cs)}, qui entend rechercher votre responsabilité civile professionnelle : ${why}.`], ["Je vous invite à déclarer ce sinistre à votre assureur sans délai."]] });
    CR.log(s, "Votre ancien client met en cause votre responsabilité civile professionnelle. L'assureur couvre ; la franchise et la réputation, non.", "bad", cs.id);
    CR.payOut(s, 1500, "Franchise de l'assurance RCP", cs.id);
    CR.rep(s, "clients", -6, "mise en cause de votre responsabilité");
    CR.rep(s, "confreres", -3);
  };

  // =================================================================== CLIENTS DÉTENUS (carte)
  // s.detenus : [{ caseId, nom, etab, statut: 'prevenu'|'condamne', since, sortie, humeur, permis }]
  CR.detenuSync = function (s, cs) {
    const d = cs.proc && cs.proc.detention;
    s.detenus = s.detenus.filter((x) => x.caseId !== cs.id || x.statut === "condamne" && d && d.statut === "condamne");
    if (!d || !["dp", "condamne"].includes(d.statut)) return;
    const prev = s.detenus.find((x) => x.caseId === cs.id);
    if (prev) { Object.assign(prev, { etab: d.etab || prev.etab, sortie: d.until != null ? d.until : prev.sortie }); return; }
    s.detenus.push({ caseId: cs.id, nom: CR.clientName(cs), etab: d.etab || "sante", statut: d.statut === "dp" ? "prevenu" : "condamne", since: d.since, sortie: d.until != null ? d.until : null, humeur: 50 });
  };
  // Date de sortie réaliste : détention provisoire déduite (art. 716-4), libération sous contrainte de droit pour les peines de 2 ans au plus quand le reliquat est de 3 mois au plus (art. 720)
  CR.dateSortie = function (s, debutDetention, fermeMois, opts = {}) {
    let fin = CR.addMonths(debutDetention, fermeMois);
    if (opts.reductionMois) fin = CR.addMonths(fin, -opts.reductionMois);
    if (fermeMois <= 24) fin = CR.addMonths(fin, -3);
    return Math.max(s.day, fin);
  };
  CR.condamneDetenu = function (s, cs, fermeMois, etab, debut) {
    const start = debut != null ? debut : s.day;
    const sortie = CR.dateSortie(s, start, fermeMois);
    cs.proc.detention = { statut: "condamne", since: start, etab, until: sortie };
    s.detenus = s.detenus.filter((x) => x.caseId !== cs.id);
    s.detenus.push({ caseId: cs.id, nom: CR.clientName(cs), etab, statut: "condamne", since: start, sortie, humeur: 40, peine: fermeMois });
    if (fermeMois > 24) CR.schedule(s, { day: s.day + R.int(s, 60, 120), type: "fn", key: "transfert", data: { caseId: cs.id, vers: fermeMois > 120 ? "poissy" : "melun" } });
  };
  CR.GLOBAL_FN.transfert = (s, d) => {
    const x = s.detenus.find((y) => y.caseId === d.caseId);
    if (!x) return;
    const from = x.etab;
    x.etab = d.vers;
    const cs = s.cases[d.caseId];
    if (cs && cs.proc) cs.proc.detention.etab = d.vers;
    CR.mail(s, { from: "Greffe pénitentiaire", subject: `Transfert — ${x.nom}`, kind: "courrier", body: [[`Nous vous informons que ${x.nom} a été transféré de ${CR.PLACES[from].nom} vers ${CR.PLACES[d.vers].nom}.`]] });
  };
  CR.dailyDetenus = function (s, d) {
    for (const x of s.detenus.slice()) {
      if (x.statut === "condamne" && x.sortie != null && d >= x.sortie) {
        s.detenus = s.detenus.filter((y) => y !== x);
        const cs = s.cases[x.caseId];
        CR.mail(s, { from: x.nom, subject: "Je suis sorti", kind: "sms", caseId: x.caseId, body: [[`Maître, c'est ${x.nom.split(" ")[0]}. Je suis sorti ce matin. Merci pour tout.`]] });
        if (cs) { CR.timeline(s, cs, `Libéré de ${CR.PLACES[x.etab] ? CR.PLACES[x.etab].nom : "détention"}.`); if (cs.proc) cs.proc.detention.statut = "libre"; }
        if (R.chance(s, 0.35)) CR.rep(s, "clients", 2, "un ancien client vous recommande");
      }
    }
  };

  // =================================================================== PROMOTION DE L'ÉCOLE D'AVOCATS
  CR.COHORT = [
    { id: "sarah", name: "Sarah Lévy-Duval", look: { skin: 0, hair: "long", hc: "dkbrown", g: "f", glasses: 0 }, start: "Collaboratrice, cabinet d'affaires anglo-saxon (8e)",
      events: [[40, "Sarah", "Sarah facture 2 400 heures par an. « Je n'ai pas vu la lumière du jour depuis la rentrée. »", "Collaboratrice senior en vue"], [380, "La Lettre des juristes", "Sarah Lévy-Duval rejoint l'équipe contentieux d'un cabinet américain.", "Contentieux des affaires"], [720, "Sarah", "Sarah est nommée counsel. « Associée dans trois ans. Si je tiens. »", "Counsel"]] },
    { id: "mehdi", name: "Mehdi Belkacem", look: { skin: 3, hair: "short", hc: "black", g: "m", glasses: 1 }, start: "Collaborateur d'un pénaliste réputé (6e)",
      events: [[55, "Mehdi", "Mehdi plaide sa première comparution immédiate. « Six mois ferme requis, sursis obtenu. Je n'ai pas dormi. »", "Collaborateur pénaliste"], [320, "Mehdi", "Mehdi est élu secrétaire de la Conférence. Il sera de toutes les permanences d'assises.", "Secrétaire de la Conférence"], [800, "Mehdi", "Mehdi s'installe à son compte, rue de Rennes.", "Installé, pénaliste"]] },
    { id: "pauline", name: "Pauline Garnier", look: { skin: 1, hair: "bun", hc: "auburn", g: "f", glasses: 1 }, start: "Avocate en droit des étrangers (association)",
      events: [[90, "Pauline", "Pauline enchaîne les audiences devant le juge des libertés au centre de rétention. « Quarante dossiers par semaine. »", "Droit des étrangers"], [400, "Pauline", "Pauline quitte le barreau : elle prépare le concours de l'École nationale de la magistrature.", "A quitté le barreau — prépare l'ENM"], [760, "Pauline", "Pauline est admise à l'ENM. « On se reverra à l'audience, de l'autre côté. »", "Auditrice de justice"]] },
    { id: "thibault", name: "Thibault Marchand", look: { skin: 0, hair: "side", hc: "brown", g: "m", glasses: 0 }, start: "Installé seul (Neuilly)",
      events: [[70, "Thibault", "Le cabinet de Thibault « décolle ». Il encaisse les indemnités de ses clients sur son compte : « la CARPA, c'est trop lent ».", "Installé seul"], [260, "Le Bulletin du barreau", "Un avocat parisien poursuivi devant le conseil de discipline pour maniement de fonds hors CARPA.", "Poursuivi devant le conseil de discipline"], [430, "Le Bulletin du barreau", "Thibault Marchand radié du tableau pour détournement de fonds clients.", "Radié"]] },
  ];
  CR.initCohort = function (s) {
    s.cohort = CR.COHORT.map((c) => ({ id: c.id, name: c.name, status: c.start }));
    for (const c of CR.COHORT) for (const [day, from, text, status] of c.events) CR.schedule(s, { day, type: "fn", key: "cohortNews", data: { id: c.id, from, text, status } });
  };
  CR.GLOBAL_FN.cohortNews = (s, d) => {
    const c = s.cohort.find((x) => x.id === d.id);
    if (c) c.status = d.status;
    const person = CR.COHORT.find((x) => x.id === d.id);
    const isPerson = d.from === person.name.split(" ")[0];
    CR.mail(s, { from: isPerson ? person.name : d.from, subject: isPerson ? "Des nouvelles" : "Le barreau : " + person.name, kind: isPerson ? "sms" : "presse", body: [[d.text]] });
  };

  // =================================================================== MONDE
  CR.initWorld = function (s) {
    const ev = (day, data) => CR.schedule(s, { day, type: "fn", key: "worldNews", data });
    ev(3, { from: "Le Bulletin du barreau de Paris", subject: "Loi SURE : les nouveaux délais sont en vigueur", body: [["Depuis le 23 octobre 2026, les conclusions de nullité devant le tribunal correctionnel doivent être déposées au greffe trois jours avant l'audience, hors comparution immédiate. Le délai de l'article 173-1 passe à quatre mois, le délai de citation à quinze jours."], ["La commission pénale de l'Ordre rappelle que l'exception doit toujours être soulevée avant toute défense au fond."]] });
    ev(45, { from: "Le Bulletin du barreau de Paris", subject: "1er janvier 2027 : l'avocat dès la plainte", body: [["À compter du 1er janvier 2027, les victimes de violences au sein du couple, ou de violences commises sur un mineur de moins de quinze ans par un ascendant ou une personne ayant autorité, auront droit à l'assistance d'un avocat dès le dépôt de plainte."], ["Les audiences sur intérêts civils suivront la procédure civile au plus tard à la même date."]] });
    ev(120, { from: "Dalloz actualité", subject: "Nouveau code de procédure pénale : rendez-vous en 2029", body: [["L'ordonnance du 19 novembre 2025 réécrit le code de procédure pénale à droit constant. Entrée en vigueur au 1er janvier 2029 : toute la numérotation change. Les praticiens préparent leurs tables de concordance."]] });
  };
  CR.GLOBAL_FN.worldNews = (s, d) => CR.mail(s, { from: d.from, subject: d.subject, kind: "presse", body: d.body });

  // =================================================================== INTRODUCTION
  CR.initIntro = function (s) {
    if (s.mode === "carriere") {
      CR.mail(s, { from: "Banque du Palais", subject: "Votre prêt d'installation et votre découvert", kind: "courrier",
        body: [["Nous vous confirmons votre prêt d'installation de 15 000 € au taux de 3,5 % sur 60 mois (273 € par mois) et une autorisation de découvert de 5 000 € au taux de 9 %."], ["Les fonds de vos clients ne transitent jamais par ce compte : ils passent par la CARPA."]] });
      CR.mail(s, { from: "Ordre des avocats de Paris", subject: "Inscription au tableau — permanences pénales", kind: "ordre",
        body: [["Mon cher confrère, vous êtes inscrit au tableau de l'Ordre depuis votre prestation de serment."], ["Vous pouvez vous inscrire aux permanences pénales (garde à vue de jour et de nuit, comparutions immédiates) auprès du service des permanences, à la Maison du barreau. Les missions sont rétribuées au titre de l'aide juridictionnelle."]] });
    }
    CR.mail(s, { from: CR.MENTOR.nom, subject: "Quelques conseils d'une vieille pénaliste", kind: "email",
      body: [["Mon cher confrère,"], ["Trente-huit ans de barre m'ont appris quelques choses :"], ["1. Personne ne vous rappellera un délai. Ni le greffe, ni le client, ni le confrère d'en face. Lisez chaque pièce deux fois : une fois pour ce qu'elle dit, une fois pour sa date. Et notez-le dans votre agenda."], ["2. Ce que le client vous dit au premier entretien est de l'or. Notez-le. Vous ne l'entendrez plus jamais de la même façon."], ["3. Lisez les procès-verbaux heure par heure. Les nullités se cachent dans les horaires."], ["4. Les fonds des clients passent par la CARPA. Toujours."], ["Appelez-moi quand vous voulez un conseil de méthode. Pour les réponses, il faudra chercher vous-même."]] });
    CR.mail(s, { from: "Vous (note pour vous-même)", subject: "Comment fonctionne le cabinet", kind: "note",
      body: [["• Pendant un appel ou un entretien, cliquez sur une phrase pour la noter dans votre carnet. Quand l'entretien se termine, il n'en reste que vos notes."], ["• Vos actes se rédigent à partir de gabarits ; les blancs se remplissent avec les lignes de votre carnet. Ce que vous n'avez pas noté ne peut pas y figurer."], ["• Dans une pièce, cliquez sur une phrase pour la noter, la relever comme irrégularité ou l'inscrire à l'agenda."], ["• L'agenda ne contient que ce que vous y mettez. Rien ne vous rappellera un délai."], ["• Chaque action coûte du temps et de l'énergie ; le soir et le week-end fatiguent davantage. Déposer un acte suppose d'aller au greffe, aux heures d'ouverture."], ["• Le loyer et les charges partent le 1er du mois. L'aide juridictionnelle est versée par la CARPA le mois suivant."]] });
    CR.refreshApplicants(s);
  };

  // =================================================================== CLÔTURE, DÉBRIEF, FICHE DE RÉVISION
  CR.closeCase = function (s, cs, outcome) {
    if (cs.status === "closed" && cs.outcome && cs.outcome.type !== "lead") return;
    const def = CR.caseDef(cs);
    cs.status = "closed";
    cs.outcome = Object.assign({ day: s.day }, outcome);
    cs.stage = "Clos";
    if (cs.proc && !["definitif", "prescrit", "irrecevable", "classement"].includes(cs.proc.stade)) cs.proc.stade = "clos";
    CR.unschedule(s, (e) => e.caseId === cs.id && e.type !== "fn" && !e.always);
    for (const h of cs.hearings) if (!h.attended && !h.missed) h.canceled = true;
    const api = CR.api(s, cs);
    let deb = [];
    try { if (def.debrief) deb = def.debrief(api, cs.outcome) || []; } catch (e) { console.error(e); }
    try { if (CR.PLAID) deb = deb.concat(CR.PLAID.debrief(s, cs)); } catch (e) { console.error(e); }
    try { if (CR.PHRASIER) deb = deb.concat(CR.PHRASIER.debrief(s, cs)); } catch (e) { console.error(e); }
    try { if (CR.RETOURNEMENT) deb = deb.concat(CR.RETOURNEMENT.debrief(s, cs)); } catch (e) { console.error(e); }
    if (def.facts) for (const [fid, f] of Object.entries(def.facts)) {
      if (!f.key) continue;
      deb.push({ kind: "clue", text: f.label, ok: CR.hasFact(cs, fid), why: f.why || "" });
    }
    let epi = null;
    try { if (def.epilogue) epi = def.epilogue(api, cs.outcome); } catch (e) { console.error(e); }
    cs.debrief = { items: deb, epilogue: epi, seen: false };
    s.pendingDebrief = s.pendingDebrief || [];
    if (!["lost-lead", "transferred"].includes(cs.outcome.type)) {
      s.pendingDebrief.push(cs.id);
      if (CR.makeFiche) CR.makeFiche(s, cs);
      s.stats.dossiers += 1;
    }
    const t = cs.outcome.type;
    if (["relaxe", "requalification_favorable"].includes(t)) s.stats.relaxes++;
    if (t === "acquittement") s.stats.acquittements++;
    if (t === "condamnation") s.stats.condamnations++;
    if (cs.outcome.indemnisation) s.stats.indemnisations += cs.outcome.indemnisation;
    if (def.domaine && !["lost-lead", "declined", "transferred"].includes(t)) s.competence[def.domaine] = (s.competence[def.domaine] || 0) + 1;
    if (cs.fee) CR.factureCloture(s, cs);
    CR.log(s, `Dossier clos : ${CR.caseTitle(s, cs)} — ${CR.outcomeLabel(cs.outcome)}`, "info", cs.id);
    return cs.outcome;
  };
  CR.OUTCOMES = {
    relaxe: "Relaxe", condamnation: "Condamnation", acquittement: "Acquittement", requalification_favorable: "Requalification",
    classement: "Classement sans suite", alternative: "Alternative aux poursuites", crpc: "CRPC homologuée", non_lieu: "Non-lieu",
    indemnise: "Victime indemnisée", deboute: "Partie civile déboutée", irrecevable: "Irrecevable", prescrit: "Action prescrite",
    declined: "Dossier refusé", fired: "Dessaisi par le client", "lost-lead": "Client perdu", done: "Terminé", transferred: "Transmis", withdrawn: "Déport",
    incompetence: "Incompétence", lost: "Perdu",
  };
  CR.outcomeLabel = (o) => (o ? (CR.OUTCOMES[o.type] || o.type) + (o.detail ? " — " + o.detail : "") : "");

  // La fiche de révision de fin d'affaire, rangée dans le classeur
  CR.makeFiche = function (s, cs) {
    const def = CR.caseDef(cs);
    const api = CR.api(s, cs);
    const f = def.fiche ? def.fiche(api, cs.outcome) : null;
    if (!f) return;
    const fiche = {
      id: CR.uid("f"), caseId: cs.id, day: s.day, titre: CR.caseTitle(s, cs),
      phrase: f.phrase, notions: f.notions || [], piege: f.piege, devenir: f.devenir, plusLoin: f.plusLoin || null,
      fait: { bons: cs.bons.map((b) => b.texte), erreurs: cs.erreurs.map((e) => ({ texte: e.texte, sanction: e.sanction, regul: e.regul })) },
      corrige: def.corrige ? def.corrige(api, cs.outcome) : [],
      articles: (cs.citeLog || []).map((r) => ({ attendu: r.attendu, tape: r.tape, g: r.g, ctx: r.ctx })),
      code: def.code || null,
    };
    s.classeur = s.classeur.filter((x) => x.caseId !== cs.id);
    s.classeur.unshift(fiche);
  };
  // L'épilogue peut évoluer : un sursis probatoire violé, une révocation, la fiche se met à jour
  CR.updateDevenir = function (s, caseId, text) {
    const f = s.classeur.find((x) => x.caseId === caseId);
    if (f) f.devenir = (f.devenir ? f.devenir + " " : "") + text;
    const cs = s.cases[caseId];
    if (cs && cs.debrief) cs.debrief.epilogue = (cs.debrief.epilogue ? cs.debrief.epilogue + " " : "") + text;
  };

  // =================================================================== FIN DE PARTIE
  CR.endGame = function (s, reason, text) {
    if (s.gameOver) return;
    s.gameOver = { reason, text, day: s.day };
    CR.log(s, text, "bad");
  };
  CR.checkGameOver = function (s) {
    if (s.gameOver || s.mode !== "carriere") return;
    if (s.overdraftMonths >= 2 && s.decouvert.used >= s.decouvert.limit - 1) CR.endGame(s, "faillite", "La banque a clôturé votre compte professionnel. Sans découvert et avec deux mois de charges impayées, le cabinet ne peut plus fonctionner.");
  };
})();
