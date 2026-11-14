// Moteur génératif, phase 3 (feuille de route, n° 5, 6, 7 et 15) : le Paris des affaires, les personnages autonomes, choisir
// ses dossiers, l'anti-répétition entre les parties, le code d'affaire.
// 1. 1 000 affaires sur cinq graines : lieux répartis dans Paris et la petite couronne, tribunal du lieu des faits (Paris,
//    Bobigny, Créteil, Nanterre), acteurs du bon tribunal, montants et revenus cohérents ; aucune signature de type en double ;
//    refus et transmission sans erreur.
// 2. Une carrière d'un an jouée par le moteur : des clients qui mentent, ne viennent pas, ne répondent plus, ne paient pas ;
//    la famille, la presse, le parquet (CRPC, composition, appel), les confrères d'en face ; chaque appel et chaque audience se
//    construit ; les personnes qui reviennent.
// 3. L'historique des signatures conservé d'une partie à l'autre (même navigateur, autre navigateur via la sauvegarde).
// 4. 200 codes générés puis rejoués : mêmes faits, pièces, personnages, dialogues ; l'autre camp ; codes par critères.
// 5. Codes mal saisis refusés avec un message clair ; ancienne version signalée.
// Usage : node tests/tp3.js [affaires par graine, défaut 200] [codes rejoués, défaut 200]
const { boot, sleep } = require("./harness");
const D = require("./dial");
let fails = 0;
const shown = new Map();
const ok = (c, m, k) => { if (c) return; fails++; const key = k || m; const n = (shown.get(key) || 0) + 1; shown.set(key, n); if (n <= 3) console.log("ÉCHEC", m); };

(async () => {
  const env = boot();
  const { CR, errors, w } = env;
  await sleep(150);
  const G = CR.GEN2, M = CR.MONDE;
  const PAR = +(process.argv[2] || 200);
  const NCODES = +(process.argv[3] || 200);
  const SEEDS = [101, 202, 303, 404, 505];
  const GENRES = ["gav", "ci", "al", "op", "copj", "pc", "copj", "info", "pc", "al"];
  G.histVider();
  // le résumé des rituels déjà vus dépend du joueur, pas de l'affaire : hors de la garantie du code (anti-répétition, lot 4)
  if (CR.PHRASIER) CR.PHRASIER.RITUEL_SEUIL = Infinity;

  // ------------------------------------------------------------------ 1. 1 000 affaires
  const st = { dep: {}, arr: {}, tj: {}, genre: {}, mil: {}, vie: { ment: 0, retracte: 0, absent: 0, injoignable: 0, impaye: 0, fam: 0, presse: 0, crpc: 0, compo: 0, appel: 0, temoin: 0, adv: 0, menace: 0, second: 0 }, epuise: 0 };
  const types = new Map();
  const leads = [];
  let n = 0;
  for (const seed of SEEDS) {
    const s = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed });
    s.settings.saisie = "liste";
    for (let i = 0; i < PAR; i++) {
      const kind = GENRES[i % GENRES.length];
      s.day = 20 + Math.floor(i / 2);
      while (!CR.isBusinessDay(s.day)) s.day++;
      s.min = kind === "gav" && i % 3 === 0 ? 2 * 60 + 30 : 10 * 60 + (i % 7) * 40;
      let cs, p;
      try { cs = CR.GEN.open(s, kind, { min: s.min }); p = s.generated.find((x) => x.id === cs.id); }
      catch (e) { ok(false, `graine ${seed} n° ${i} (${kind}) : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "tirage"); continue; }
      n++;
      const t = p.t;
      const L = M.lieuxDe(t);
      st.dep[L.F.dep] = (st.dep[L.F.dep] || 0) + 1;
      if (L.F.paris) st.arr[L.F.arr] = (st.arr[L.F.arr] || 0) + 1;
      st.tj[L.TJ.id] = (st.tj[L.TJ.id] || 0) + 1;
      st.genre[kind] = (st.genre[kind] || 0) + 1;
      const C = t[t.client];
      if (C && C.mil) st.mil[C.mil] = (st.mil[C.mil] || 0) + 1;
      ok(t.lieu && M.SECTEURS[t.lieu.f], `${cs.id} : pas de lieu des faits`, "lieu");
      const pb = G.verifierP3(t);
      ok(!pb.length, `${cs.id} (${t.inf}, ${L.F.nom}) : ${pb.join(" ; ")}`, "p3:" + pb[0]);
      // le tribunal compétent : celui du lieu des faits (parquet national financier et JIRS : Paris)
      ok(L.TJ.id === (t.pnf || t.jirs ? "paris" : L.F.tj), `${cs.id} : ${L.F.nom} jugé à ${L.TJ.ville}`, "tj");
      // le code d'affaire et la signature de type
      ok(t.code && G.lireCode(t.code).ok, `${cs.id} : code absent ou illisible (${t.code})`, "code");
      const ts = CR.hash(G.typeSig(t));
      if (types.has(ts)) { ok(false, `${cs.id} : signature de type déjà tirée par ${types.get(ts)} (${G.typeSig(t)})`, "doublon"); }
      types.set(ts, cs.id);
      // les pièces disent le bon commissariat et le bon tribunal ; plus de « 18e » pour une affaire d'ailleurs
      const def = CR.caseDef(cs);
      const api = CR.api(s, cs);
      let txt = "";
      for (const k of Object.keys(def.docs || {})) { try { const d = typeof def.docs[k] === "function" ? def.docs[k](api) : def.docs[k]; txt += " " + JSON.stringify(d); } catch (e) { ok(false, `${cs.id} : pièce ${k} illisible : ${e.message}`, "piece"); } }
      if (L.F.id !== "p18" && t.genre !== "info") ok(!/commissariat central du 18e|Commissariat central du 18e arrondissement|à Paris 18e/.test(txt), `${cs.id} (${L.F.nom}) : pièce qui parle du 18e`, "18e");
      if (!L.TJ.paris) ok(!/tribunal correctionnel de Paris|Parquet de Paris/.test(txt), `${cs.id} (${L.TJ.ville}) : pièce du tribunal de Paris`, "tjparis");
      // revenus et métiers cohérents avec l'âge
      for (const k of ["A", "V"]) { const P = t[k]; if (P && !P.agent && !P.morale && P.revenu != null) ok(P.revenu >= 0 && P.revenu <= 20000, `${cs.id} : revenu ${P.revenu}`, "revenu"); }
      // personnages tirés
      const v = t.vie || {};
      if (v.ment) st.vie.ment++; if (v.retracte) st.vie.retracte++; if (v.absent) st.vie.absent++; if (v.injoignable) st.vie.injoignable++;
      if (v.paie && v.paie !== "ok") st.vie.impaye++; if (v.fam) st.vie.fam++; if (v.presse) st.vie.presse++; if (v.adv) st.vie.adv++;
      if (v.menace) st.vie.menace++; if (v.second) st.vie.second++;
      if (v.pq) { if (v.pq.crpc) st.vie.crpc++; if (v.pq.compo) st.vie.compo++; if (v.pq.appel) st.vie.appel++; if (v.pq.temoin) st.vie.temoin++; }
      if (cs.status === "lead" && def.leadKind !== "permanence") leads.push({ s, cs });
    }
    st.epuise += s.genEpuise || 0;
  }
  const deps = Object.keys(st.dep);
  ok(deps.length === 4, `départements : ${JSON.stringify(st.dep)}`, "deps");
  ok(Object.keys(st.arr).length >= 18, `arrondissements : ${Object.keys(st.arr).length}`, "arr");
  ok(st.dep["75"] < n * 0.85 && st.dep["75"] > n * 0.4, `part de Paris : ${st.dep["75"]} / ${n}`, "partParis");
  ok(Object.keys(st.tj).length === 4, `tribunaux : ${JSON.stringify(st.tj)}`, "tjs");
  for (const k of ["ment", "fam", "presse", "crpc", "appel", "adv", "impaye", "absent"]) ok(st.vie[k] > 0, `aucun personnage « ${k} » tiré`, "vie:" + k);
  // refuser, transmettre
  let refus = 0, trans = 0;
  for (let i = 0; i < leads.length && (refus < 30 || trans < 30); i++) {
    const { s, cs } = leads[i];
    CR.store.s = s;
    if (cs.status !== "lead") continue;
    const tasks = CR.caseTasks ? CR.caseTasks(s, cs) : null;
    const dd = CR.caseDef(cs);
    // une commission d'office (permanence, défèrement) ne se refuse que pour un motif légitime : pas de refus ordinaire
    if (dd.leadKind === "permanence" || dd.noChoix || (dd.honoraires && dd.honoraires.aj && dd.caller && /Permanence/.test(dd.caller))) continue;
    if (tasks) ok(tasks.some((x) => x.id === "refuser") && tasks.some((x) => x.id === "transmettre"), `${cs.id} : refuser ou transmettre absent des tâches`, "taches");
    const rep0 = Object.assign({}, s.reps);
    try {
      if (i % 2) { CR.refuserDossier(s, cs); refus++; ok(cs.status === "closed" && cs.outcome.type === "declined", `${cs.id} : refus non enregistré`, "refus"); }
      else {
        const id = ["av_marchal", "av_tessier", "av_villeneuve", "av_pernot"][i % 4];
        const r0 = CR.relation(s, id);
        CR.transmettreDossier(s, cs, id); trans++;
        ok(cs.status === "closed" && cs.outcome.type === "transferred", `${cs.id} : transmission non enregistrée`, "trans");
        ok(CR.relation(s, id) > r0 || r0 >= 95, `${cs.id} : relation avec le confrère inchangée`, "relation");
        ok(s.reps.confreres >= rep0.confreres, `${cs.id} : réputation auprès des confrères en baisse après une transmission`, "repconf");
      }
    } catch (e) { ok(false, `${cs.id} : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "choix"); }
  }
  ok(refus >= 10 && trans >= 10, `refus ${refus}, transmissions ${trans}`, "choixN");
  // commission d'office : un motif est demandé ; sans motif, signalement au bâtonnier
  {
    const s = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 77 });
    s.day = 30; s.min = 11 * 60;
    for (const motif of ["empechement", "aucun"]) {
      const cs = CR.GEN.open(s, "gav", { min: s.min });
      const def = CR.caseDef(cs);
      const c = def.calls.intake;
      ok(c.topics.some((x) => x.id === "p_m_aucun" || x.id === "p_m_charge") && c.topics.find((x) => x.id === "p_non").unlock, `${cs.id} : refus de commission d'office sans motif à donner`, "co:motif");
      const disc0 = s.disc.open.length;
      cs.flags.refuse = true; cs.flags.refusMotif = motif;
      try { c.onEnd(CR.api(s, cs)); } catch (e) { ok(false, `${cs.id} : ${e.message}`, "co:end"); }
      ok(cs.status === "closed", `${cs.id} : commission d'office refusée mais dossier ouvert`, "co:clos");
      ok(motif === "aucun" ? s.disc.open.length > disc0 : s.disc.open.length === disc0, `${cs.id} : refus ${motif}, réclamations ${disc0} → ${s.disc.open.length}`, "co:disc");
    }
  }
  console.log(`affaires : ${n} | départements ${JSON.stringify(st.dep)} | tribunaux ${JSON.stringify(st.tj)} | arrondissements ${Object.keys(st.arr).length} | milieux ${JSON.stringify(st.mil)}`);
  console.log(`personnages tirés : ${JSON.stringify(st.vie)} | familles épuisées : ${st.epuise} | refus ${refus}, transmissions ${trans}`);

  // ------------------------------------------------------------------ 2. Une carrière d'un an
  {
    const s = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 2027 });
    s.settings.saisie = "liste";
    const vu = { ment: 0, confront: 0, rdv: 0, silence: 0, cheque: 0, fam: 0, presse: 0, article: 0, prop: 0, accepte: 0, appel: 0, adv: 0, temoin: 0, absence: 0, menace: 0, second: 0, revenant: 0, audiences: 0, appels: 0 };
    const vus = new Set();
    let jours = 0;
    while (s.day < 365 && !s.gameOver && jours < 400) {
      jours++;
      s.burnout = null; s.energy = 100;
      // le robot répond au bâtonnier : la carrière ne s'arrête pas sur des réclamations restées sans réponse
      for (const g of (s.disc && s.disc.open) || []) if (!g.response && CR.answerGrievance) CR.answerGrievance(s, g.id, "bonne");
      // le robot ne plaide pas (ses audiences sont manquées) : on efface la discipline qui en découle pour aller au bout de l'année
      if (s.disc) s.disc.points = 0;
      if (s.cash < 2000) s.cash += 20000;
      for (const id of s.order) {
        const cs = s.cases[id];
        if (!cs) continue;
        const def = CR.caseDef(cs);
        if (!def || !def.generated) continue;
        const p = CR.GEN.paramsOf(s, id);
        const t = p.t;
        if (!t) continue;
        const api = CR.api(s, cs);
        // le joueur-robot engage les nouveaux clients, avec une provision
        // un client qui ne vient pas au premier rendez-vous : le robot tient le rendez-vous, puis engage le lendemain
        if (cs.status === "lead" && t.vie && t.vie.absent === "rdv" && cs.vars.vieRdvManque == null) {
          const lt = (CR.caseTasks(s, cs) || []).find((x) => x.kind === "meet");
          if (lt) { try { lt.run(); } catch (e) { ok(false, `${id} : rendez-vous manqué : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "an:rdv"); } continue; }
        }
        if (cs.status === "lead" && def.leadKind !== "permanence" && !vus.has(id)) {
          vus.add(id);
          if (t.revenant) vu.revenant++;
          try { cs.status = "active"; cs.engaged = s.day; cs.collected = 600; CR.runHook(s, cs, "engaged", {}); }
          catch (e) { ok(false, `${id} : engagement : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "an:eng"); }
        }
        if (cs.status !== "active") continue;
        // chaque appel des personnages se construit, chaque tâche se liste
        try { CR.caseTasks(s, cs); } catch (e) { ok(false, `${id} : tâches : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "an:taches"); }
        if (s.day % 7 === 0) for (const k of Object.keys(def.calls || {})) if (/^vie_/.test(k)) { try { const c = typeof def.calls[k] === "function" ? def.calls[k](api) : def.calls[k]; ok(c && c.topics && c.topics.length, `${id} : appel ${k} vide`, "an:call"); vu.appels++; } catch (e) { ok(false, `${id} : appel ${k} : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "an:call"); } }
        // la confrontation, dès que la pièce est au dossier (une fois sur deux)
        const V = cs.vars;
        if (t.vie && t.vie.ment && def.calls.vie_confront && !cs.flags.vieConfronte && s.day - cs.engaged > 5) {
          const doc = G.VIE.DOC[t.vie.ment.preuve];
          if (!CR.hasDoc(cs, doc) && def.docs && def.docs[doc]) api.doc(doc);
          if (CR.hasDoc(cs, doc)) { try { const c = def.calls.vie_confront(api); c.onEnd(api, { asked: ["vc_montrer", "vc_regle"] }); vu.confront++; } catch (e) { ok(false, `${id} : confrontation : ${e.message}`, "an:conf"); } }
        }
        // la proposition du parquet : acceptée une fois sur trois
        if (V.vieProp && V.vieProp.etat === "ouverte" && !V.vieProp.vu) { V.vieProp.vu = true; vu.prop++; if (s.day % 3 === 0) { try { G.VIE.accepter(api, t); vu.accepte++; } catch (e) { ok(false, `${id} : accepter : ${e.stack.split("\n").slice(0, 2).join(" | ")}`, "an:acc"); } } }
        // les audiences du jour : elles se construisent avec les personnages
        for (const h of cs.hearings) if (h.day === s.day && !h.attended && !h.canceled && def.audiences && def.audiences[h.script]) {
          try { const a = def.audiences[h.script](api); ok(a && a.steps && a.steps.length > 1, `${id} : audience ${h.script} vide`, "an:aud"); vu.audiences++; } catch (e) { ok(false, `${id} : audience ${h.script} : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "an:aud"); }
        }
      }
      try { CR.endDay(s); } catch (e) { ok(false, `jour ${s.day} : ${e.stack.split("\n").slice(0, 4).join(" | ")}`, "an:jour"); break; }
    }
    for (const id of s.order) {
      const cs = s.cases[id];
      if (!cs) continue;
      const V = cs.vars || {};
      if (CR.GEN.paramsOf(s, id).t && (CR.GEN.paramsOf(s, id).t.vie || {}).ment) vu.ment++;
      if (V.vieRdvManque != null) vu.rdv++; if (V.vieSilence) vu.silence++; if (V.vieImpaye != null) vu.cheque++; if (V.vieManque_famille != null || V.vieFamilleVue != null) vu.fam++;
      if (V.vieManque_presse != null || V.viePresseVu != null) vu.presse++; if (V.vieArticle) vu.article++; if (V.vieAppel) vu.appel++; if (V.vieAdverse != null) vu.adv++;
      if (V.vieTemoin != null) vu.temoin++; if (V.vieAbsenceAnnoncee != null || V.vieAbsentFait != null) vu.absence++; if (V.vieMenace != null) vu.menace++; if (V.vieSecond) vu.second++;
    }
    console.log(`carrière d'un an : ${s.order.length} dossiers, jour ${s.day}${s.gameOver ? " (fin : " + s.gameOver.reason + ")" : ""} | ${JSON.stringify(vu)}`);
    for (const k of ["ment", "rdv", "silence", "cheque", "fam", "prop", "audiences"]) ok(vu[k] > 0, `carrière d'un an : aucun événement « ${k} »`, "an:" + k);
    // la sauvegarde se recharge avec ses personnages
    try { const s2 = CR.deserialize(CR.serialize(s)); ok(s2.order.length === s.order.length && (s2.genTypes || []).length === (s.genTypes || []).length, "sauvegarde : dossiers ou signatures perdus", "an:save"); } catch (e) { ok(false, "sauvegarde illisible : " + e.message, "an:save"); }
  }

  // ------------------------------------------------------------------ 2 bis. Le parquet fait appel d'une relaxe ; la presse ; la famille et le secret
  {
    const s = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 61 });
    let fait = { appel: 0, cour: 0, presse: 0, secret: 0 };
    for (let i = 0; i < 400 && (fait.appel < 3 || fait.presse < 1 || fait.secret < 1); i++) {
      s.day = 40 + Math.floor(i / 4);
      while (!CR.isBusinessDay(s.day)) s.day++;
      const cs = CR.GEN.open(s, ["copj", "pc", "al"][i % 3], { min: 600 });
      const t = CR.GEN.paramsOf(s, cs.id).t;
      const v = t.vie || {};
      const def = CR.caseDef(cs);
      const api = CR.api(s, cs);
      cs.status = "active"; cs.engaged = s.day; cs.collected = 500;
      try { CR.runHook(s, cs, "engaged", {}); } catch (e) { ok(false, `${cs.id} : ${e.message}`, "2b:eng"); continue; }
      if (t.genre === "copj" && v.pq && v.pq.appel && fait.appel < 3 && def.on.apresTC) {
        cs.vars.requis = { ferme: 6, sursis: 0 };
        def.on.apresTC(api, { decision: { coupable: false, peine: {} } });
        ok(cs.vars.vieAppel && cs.vars.vieAppel.etat === "delai" && cs.status === "active", `${cs.id} : relaxe sans délai d'appel du parquet`, "2b:delai");
        for (let k = 0; k < 12 && cs.vars.vieAppel.etat === "delai"; k++) CR.endDay(s);
        ok(["appel", "definitif"].includes(cs.vars.vieAppel.etat), `${cs.id} : appel du parquet ni formé ni écarté (${cs.vars.vieAppel.etat})`, "2b:etat");
        if (cs.vars.vieAppel.etat === "appel") {
          const h = cs.hearings.find((x) => x.script === "vie_appel");
          ok(h, `${cs.id} : appel formé sans audience devant la cour`, "2b:h");
          try { const a = def.audiences.vie_appel(api); ok(a.steps.length > 4, `${cs.id} : audience d'appel vide`, "2b:aud"); cs.vars.vieArgAppel = 2; def.on._vieApresAppel(api); fait.cour++; } catch (e) { ok(false, `${cs.id} : cour d'appel : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "2b:cour"); }
          ok(cs.status === "closed", `${cs.id} : dossier ouvert après l'arrêt`, "2b:clos");
          // l'arrêt écrit : composition (art. 510), débats (513), saisine (509, 515), pourvoi (568)
          const AR = CR.hasDoc(cs, "_arretAppel") && CR.SHARED_DOCS._arretAppel({ s, cs });
          const TX = AR ? AR.paras.map((x) => x.join("")).join("\n") : "";
          if (process.env.VOIR && fait.cour === 1) console.log(TX);
          ok(/, et de deux conseillers \(art\. 510/.test(TX) && /art\. 513/.test(TX) && /art\. 515/.test(TX) && /dix jours francs .+ \(art\. 568/.test(TX) && /reçoit l'appel du ministère public/.test(TX), `${cs.id} : arrêt de la cour d'appel absent ou incomplet`, TX.slice(0, 600) || "2b:arret");
        } else ok(cs.status === "closed", `${cs.id} : jugement définitif mais dossier ouvert`, "2b:def");
        fait.appel++;
      }
      if (v.presse && fait.presse < 1 && def.calls.vie_presse) {
        cs.flags.viePresse = "details";
        G.VIE.evenement(api, t, v, "article", {});
        ok(cs.erreurs.some((e) => e.id === "vie_presse") && s.disc.open.length > 0, `${cs.id} : pièces livrées à la presse sans conséquence`, "2b:presse");
        fait.presse++;
      }
      if (v.fam && fait.secret < 1 && def.calls.vie_famille) {
        const c = def.calls.vie_famille(api);
        ok(c.topics.some((x) => x.id === "vf_secret") && c.topics.some((x) => x.id === "vf_confie"), `${cs.id} : la famille sans question de secret`, "2b:fam");
        cs.flags.vieSecretViole = true;
        c.onEnd(api, {});
        ok(cs.erreurs.some((e) => e.id === "vie_secret"), `${cs.id} : secret violé sans conséquence`, "2b:secret");
        fait.secret++;
      }
    }
    ok(fait.appel >= 1 && fait.presse && fait.secret, `parquet, presse, famille : ${JSON.stringify(fait)}`, "2b:n");
    console.log(`parquet qui fait appel, presse, secret : ${JSON.stringify(fait)}`);
  }

  // ------------------------------------------------------------------ 3. L'historique entre deux parties
  {
    G.histVider();
    const s1 = CR.store.s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 9001 });
    const t1 = new Set();
    for (let i = 0; i < 120; i++) { s1.day = 20 + Math.floor(i / 3); const cs = CR.GEN.open(s1, ["copj", "al", "op", "pc"][i % 4], { min: 600 }); t1.add(CR.hash(G.typeSig(CR.GEN.paramsOf(s1, cs.id).t))); }
    ok(G.histTaille() >= t1.size, `historique : ${G.histTaille()} signatures pour ${t1.size} affaires`, "hist:taille");
    const sauvegarde = CR.serialize(s1);
    // même navigateur, nouvelle partie
    const s2 = CR.store.s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 9002 });
    let dup = 0;
    for (let i = 0; i < 120; i++) { s2.day = 20 + Math.floor(i / 3); const cs = CR.GEN.open(s2, ["copj", "al", "op", "pc"][i % 4], { min: 600 }); if (t1.has(CR.hash(G.typeSig(CR.GEN.paramsOf(s2, cs.id).t)))) dup++; }
    ok(dup <= (s2.genEpuise || 0), `historique : ${dup} affaires de la partie précédente rejouées (familles épuisées : ${s2.genEpuise || 0})`, "hist:dup");
    // un autre navigateur : l'historique revient avec la sauvegarde
    const brut = w.localStorage.getItem(G.HIST_KEY);
    G.histVider();
    ok(G.histTaille() === 0, "historique non vidé", "hist:vide");
    CR.store.s = CR.deserialize(sauvegarde);
    ok(G.histTaille() >= t1.size, `historique non rapporté par la sauvegarde (${G.histTaille()} / ${t1.size})`, "hist:save");
    ok(brut && JSON.parse(brut).length >= t1.size, "historique absent du stockage du navigateur", "hist:local");
    console.log(`historique : ${G.histTaille()} signatures ; deuxième partie : ${dup} reprises (familles épuisées ${s2.genEpuise || 0})`);
  }

  // ------------------------------------------------------------------ 4. 200 codes rejoués
  {
    G.histVider();
    const s = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 4242 });
    s.settings.saisie = "liste";
    const orig = [];
    const textes = (d) => d.calls.flatMap((c) => c.lines).concat(d.audience.map((x) => (x.who || "") + ":" + x.t));
    const docsDe = (s0, cs0) => { const def = CR.caseDef(cs0); const api = CR.api(s0, cs0); const o = {}; for (const k of Object.keys(def.docs || {})) { try { o[k] = typeof def.docs[k] === "function" ? def.docs[k](api) : def.docs[k]; } catch (e) { o[k] = "ERREUR " + e.message; } } return JSON.stringify(o); };
    for (let i = 0; i < NCODES; i++) {
      const kind = ["gav", "ci", "al", "op", "copj", "pc", "info", "copj"][i % 8];
      s.day = 30 + Math.floor(i / 2);
      while (!CR.isBusinessDay(s.day)) s.day++;
      s.min = kind === "gav" && i % 4 === 0 ? 3 * 60 : 9 * 60 + (i % 9) * 50;
      const cs = CR.GEN.open(s, kind, { min: s.min });
      const p = CR.GEN.paramsOf(s, cs.id);
      orig.push({ code: p.t.code, t: JSON.stringify(p.t), sig: p.t.sig, docs: docsDe(s, cs), dial: JSON.stringify(textes(D.collect(CR, s, cs, p))), day: s.day, kind });
    }
    let rejoues = 0, autres = 0;
    for (const o of orig) {
      const A = G.VIE.apercu(o.code);
      ok(A.ok, `code ${o.code} illisible : ${A.msg}`, "code:lire");
      if (!A.ok) continue;
      const r = CR.newAffaire({ code: o.code, prenom: "Camille", nom: "Durand" });
      ok(r.ok, `code ${o.code} : ${r.msg}`, "code:jouer");
      if (!r.ok) continue;
      const s2 = r.s, cs2 = r.cs;
      CR.store.s = s2;
      s2.settings.saisie = "liste";
      const p2 = CR.GEN.paramsOf(s2, cs2.id);
      ok(s2.day === o.day && p2.kind === o.kind, `code ${o.code} : jour ${s2.day} / ${o.day}, genre ${p2.kind} / ${o.kind}`, "code:jour");
      ok(p2.t.sig === o.sig, `code ${o.code} : signature différente`, "code:sig");
      ok(JSON.stringify(p2.t) === o.t, `code ${o.code} : faits ou personnes différents`, "code:t");
      ok(docsDe(s2, cs2) === o.docs, `code ${o.code} : pièces différentes`, "code:docs");
      ok(JSON.stringify(textes(D.collect(CR, s2, cs2, p2))) === o.dial, `code ${o.code} : dialogues différents`, "code:dial");
      ok(s2.mode === "affaire" && !G.histA("zz"), `code ${o.code} : partie hors carrière mal créée`, "code:mode");
      rejoues++;
      // l'autre camp, quand il existe : mêmes faits, mêmes personnes
      if (A.camps.length > 1 && autres < 40) {
        const r2 = CR.newAffaire({ code: o.code, camp: A.camps[1] });
        ok(r2.ok, `code ${o.code} (autre camp) : ${r2.msg}`, "camp:jouer");
        if (r2.ok) {
          autres++;
          const p3 = CR.GEN.paramsOf(r2.s, r2.cs.id);
          const t0 = JSON.parse(o.t);
          ok(p3.t.A.nom === t0.A.nom && (!t0.V || p3.t.V.nom === t0.V.nom) && p3.t.inf === t0.inf && JSON.stringify(p3.t.f) === JSON.stringify(t0.f), `code ${o.code} (autre camp) : faits ou personnes différents`, "camp:faits");
          ok(r2.cs.camp === (A.camps[1] === "pc" ? "pc" : "defense") || CR.caseDef(r2.cs).camp === A.camps[1], `code ${o.code} : camp ${r2.cs.camp} au lieu de ${A.camps[1]}`, "camp:camp");
          try { const def = CR.caseDef(r2.cs); const api = CR.api(r2.s, r2.cs); D.collect(CR, r2.s, r2.cs, p3, def); for (const k of Object.keys(def.audiences || {})) def.audiences[k](api); } catch (e) { ok(false, `code ${o.code} (autre camp) : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "camp:def"); }
        }
      }
    }
    // codes par critères
    const crits = [{ fam: "personnes", camp: "defense" }, { nature: "crime" }, { nature: "crime", camp: "pc" }, { fam: "affaires" }, { fam: "route", irr: true }, { irr: false, niveau: 1 }, { niveau: 3 }, { fam: "stups", camp: "defense", irr: true }, { camp: "pc", fam: "biens" }];
    let crOk = 0;
    for (const c of crits) {
      const r = G.codeParCriteres(c);
      if (!r.ok) { ok(false, `critères ${JSON.stringify(c)} : ${r.msg}`, "crit:" + JSON.stringify(c)); continue; }
      const A = G.VIE.apercu(r.code);
      const t = A.t;
      const bon = (!c.fam || CR.CAT.INF[t.inf].fam === c.fam) && (!c.nature || (c.nature === "crime") === (t.q.nature === "crime")) && (c.irr == null || c.irr === (t.irr || []).length > 0) && (!c.niveau || G.difficulte(t) === c.niveau) && (!c.camp || A.camps.includes(c.camp));
      ok(bon, `critères ${JSON.stringify(c)} : ${r.code} ne les respecte pas (${t.inf}, ${t.q.nature})`, "crit:respect");
      if (bon) crOk++;
    }
    console.log(`codes : ${rejoues} rejoués à l'identique, ${autres} joués dans l'autre camp, ${crOk} / ${crits.length} codes par critères`);
  }

  // ------------------------------------------------------------------ 5. Codes mal saisis, ancienne version
  {
    const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    const s = CR.store.s = CR.newGame({ prenom: "C", nom: "D", mode: "carriere", seed: 31 });
    const codes = [];
    for (let i = 0; i < 40; i++) { s.day = 40 + i; while (!CR.isBusinessDay(s.day)) s.day++; codes.push(CR.GEN.paramsOf(s, CR.GEN.open(s, ["copj", "al", "pc", "info"][i % 4], { min: 600 }).id).t.code); }
    let subs = 0, subsOk = 0, trans = 0, transOk = 0;
    for (const code of codes) {
      const brut = code.replace(/-/g, "");
      for (let i = 3; i < brut.length; i++) {
        for (const ch of B32) {
          if (ch === brut[i]) continue;
          const x = brut.slice(0, i) + ch + brut.slice(i + 1);
          const L = G.lireCode(x);
          subs++;
          if (!L.ok && /faute de frappe|n'a pas été produit|n'existe pas|version/.test(L.msg)) subsOk++;
        }
        if (i < brut.length - 1 && brut[i] !== brut[i + 1]) { const x = brut.slice(0, i) + brut[i + 1] + brut[i] + brut.slice(i + 2); trans++; if (!G.lireCode(x).ok) transOk++; }
      }
      ok(G.lireCode(code.toLowerCase().replace(/-/g, " ")).ok, `${code} : saisie en minuscules avec espaces refusée`, "saisie:souple");
      ok(G.lireCode(code.replace(/0/g, "O")).ok, `${code} : O pour 0 refusé`, "saisie:O");
    }
    ok(subsOk === subs, `fautes de frappe d'un caractère détectées : ${subsOk} / ${subs}`, "typo:sub");
    ok(transOk >= trans * 0.9, `inversions de deux caractères détectées : ${transOk} / ${trans}`, "typo:trans");
    for (const [x, re] of [["", /Saisissez/], ["ABC-1234-5678", /trois lettres/], ["COP-12", /huit caractères/], ["COP-12U4-5678", /« U »/], [codes[0].slice(0, -1) + (codes[0].slice(-1) === "A" ? "B" : "A"), /faute de frappe/]]) {
      const L = G.lireCode(x);
      ok(!L.ok && re.test(L.msg), `« ${x} » : message attendu ${re}, reçu « ${L.msg} »`, "msg");
    }
    // une ancienne version : signalée ; non reproductible : refusée, jamais une autre affaire
    const V0 = G.VERSION, VL = G.VERSIONS_LISIBLES;
    G.VERSION = V0 + 1;
    G.VERSIONS_LISIBLES = { [V0]: true, [V0 + 1]: true };
    const L1 = G.lireCode(codes[0]);
    ok(L1.ok && L1.ancien && /version/.test(L1.avert || ""), `ancienne version lisible non signalée : ${JSON.stringify(L1).slice(0, 160)}`, "ver:ancien");
    G.VERSIONS_LISIBLES = { [V0 + 1]: true };
    const L2 = G.lireCode(codes[0]);
    ok(!L2.ok && /ne peut plus être reproduite/.test(L2.msg), `ancienne version non reproductible acceptée : ${L2.msg}`, "ver:refus");
    const r = CR.newAffaire({ code: codes[0] });
    ok(!r.ok, "une partie a été créée avec un code non reproductible", "ver:partie");
    G.VERSION = V0; G.VERSIONS_LISIBLES = VL;
    console.log(`fautes de frappe : ${subsOk} / ${subs} substitutions et ${transOk} / ${trans} inversions détectées`);
  }

  console.log("échecs:", fails);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
