/* La Permanence — moteur de procédure.
   Il suit chaque dossier de stade en stade, applique les délais du code du jeu, juge la recevabilité des actes,
   statue sur les nullités et calcule les décisions au fond à partir des preuves, des arguments joués et du profil du magistrat.
   Les conséquences ne sont jamais écrites affaire par affaire : elles sortent d'ici. */
(function () {
  const CR = (window.CR = window.CR || {});
  const R = CR.R;
  const P = (CR.PROC = {});

  P.STADES = {
    contact: "Premier contact", enquete: "Enquête", gav: "Garde à vue", audition: "Audition libre", parquet: "Décision du parquet",
    alternative: "Alternative aux poursuites", classement: "Classement sans suite", crpc: "CRPC", op: "Ordonnance pénale",
    convocation: "Convocation devant le tribunal", citation: "Citation directe", ci: "Comparution immédiate", ci_renvoi: "Comparution immédiate (renvoi)",
    information: "Information judiciaire", reglement: "Règlement de l'information", jugement: "Jugement", delibere: "Délibéré",
    appel: "Appel", criminel: "Procès criminel", definitif: "Décision définitive", prescrit: "Action prescrite", irrecevable: "Irrecevable", clos: "Dossier clos",
  };
  P.JURIDICTIONS = {
    tp: { label: "Tribunal de police de Paris", lieu: "palais" },
    tc: { label: "Tribunal correctionnel de Paris", lieu: "palais" },
    ci: { label: "Tribunal correctionnel de Paris, 23e chambre (comparutions immédiates)", lieu: "palais" },
    ji: { label: "Juge d'instruction, tribunal judiciaire de Paris", lieu: "palais" },
    jld: { label: "Juge des libertés et de la détention, tribunal judiciaire de Paris", lieu: "palais" },
    parquet: { label: "Parquet de Paris", lieu: "palais" },
    chins: { label: "Chambre de l'instruction, cour d'appel de Paris", lieu: "cite" },
    chapp: { label: "Chambre des appels correctionnels, cour d'appel de Paris", lieu: "cite" },
    assises: { label: "Cour d'assises de Paris", lieu: "cite" },
    ccd: { label: "Cour criminelle départementale de Paris", lieu: "cite" },
    crpc: { label: "Tribunal correctionnel de Paris, homologation de CRPC", lieu: "palais" },
  };
  P.NATURE_ANS = { contravention: 1, delit: 6, crime: 20 };

  // ------------------------------------------------------------------ Initialisation
  P.init = function (api, cfg) {
    const { s, cs } = api;
    const base = cs.vars.base != null ? cs.vars.base : s.day;
    const faits = cfg.faits != null ? base + cfg.faits : null;
    cs.proc = {
      stade: cfg.stade || "contact",
      voie: cfg.voie || null,
      juridiction: cfg.juridiction || null,
      nature: cfg.nature || "delit",
      faitsDay: faits,
      prescStart: faits,
      prescSuspendu: 0,
      infractions: cfg.infractions || [],
      detention: { statut: cfg.detention || "libre", since: cfg.detentionSince != null ? base + cfg.detentionSince : null, etab: cfg.etab || null },
      mex: cfg.mex != null ? base + cfg.mex : null,
      copieDemandee: null, copieDelivree: null,
      audience: null,
      moyens: [],
      annules: [],
      decisions: [],
      pcConstituee: !!cfg.pcConstituee,
      appel: null,
      events: [],
    };
    for (const ev of cfg.events || []) cs.proc.events.push({ day: base + ev.day, text: ev.text });
  };

  P.event = (api, text) => { api.cs.proc.events.push({ day: api.s.day, text }); CR.timeline(api.s, api.cs, text); };
  P.stade = function (api, st, text) {
    const p = api.cs.proc;
    p.stade = st;
    api.cs.stage = P.STADES[st] || st;
    if (text) P.event(api, text);
  };
  P.stadeLabel = (cs) => (cs.proc ? P.STADES[cs.proc.stade] || cs.proc.stade : "");

  // ------------------------------------------------------------------ Prescription de l'action publique
  P.prescription = function (cs) {
    const p = cs.proc;
    if (!p || p.prescStart == null) return null;
    const ans = P.NATURE_ANS[p.nature] || 6;
    const expire = CR.addYears(p.prescStart, ans) + (p.prescSuspendu || 0);
    return { ans, start: p.prescStart, expire };
  };
  // Un acte interruptif fait courir un nouveau délai de même durée (art. 9-2)
  P.interrompre = function (api, day, why) {
    const p = api.cs.proc;
    if (P.estPrescrit(api.cs, day)) return false;
    p.prescStart = day;
    p.prescSuspendu = 0;
    if (why) p.events.push({ day, text: `Prescription interrompue : ${why}` });
    return true;
  };
  P.suspendre = (api, jours) => { api.cs.proc.prescSuspendu = (api.cs.proc.prescSuspendu || 0) + jours; };
  // La prescription est acquise le lendemain du jour anniversaire, à zéro heure
  P.estPrescrit = (cs, day) => { const x = P.prescription(cs); return !!x && day > x.expire; };

  // ------------------------------------------------------------------ Audience
  // h = { day, min, juridiction, convocDay, mode: 'convocation'|'citation'|'ci'|'renvoi'|'ordonnance', title, type, script, president, lieu, onMiss }
  P.fixAudience = function (api, h) {
    const { s, cs } = api;
    const j0 = P.JURIDICTIONS[h.juridiction] || {};
    // phase 3 : une affaire générée hors de Paris est jugée au tribunal du lieu des faits (Bobigny, Créteil, Nanterre)
    const tj = api.def && api.def.tj;
    const j = tj && !tj.paris && j0.lieu === "palais" && j0.label ? Object.assign({}, j0, { label: j0.label.replace(/ de Paris\b/, ` de ${tj.ville}`).replace(/, 23e chambre \(comparutions immédiates\)/, `, ${tj.ci}`), lieu: tj.lieu }) : j0;
    const hr = api.hearing(Object.assign({ type: "audience", title: h.title || `Audience — ${j.label || "tribunal"}`, where: j.label, lieu: h.lieu || j.lieu || "palais" }, h));
    cs.proc.audience = { day: h.day, min: h.min, juridiction: h.juridiction, convocDay: h.convocDay != null ? h.convocDay : s.day, mode: h.mode || "convocation", hid: hr.id };
    if (h.president) cs.actors.president = h.president;
    // délai silencieux de l'art. 385 : conclusions de nullité au greffe trois jours avant (hors CI, hors dispense)
    if (cs.camp === "defense" && ["tc", "tp"].includes(h.juridiction) && h.mode !== "ci") {
      const dispense = h.day - cs.proc.audience.convocDay < 20;
      if (!dispense) api.oblig({ id: "art385_" + hr.id, label: "Conclusions de nullité au greffe (art. 385)", due: h.day - 3, silent: true, onMiss: "_noop" });
    }
    return hr;
  };
  CR.FLOW_HOOKS._noop = () => {};
  P.dispense385 = (cs) => {
    const a = cs.proc && cs.proc.audience;
    if (!a) return false;
    if (a.mode === "ci" || a.mode === "ci_renvoi") return true;
    return a.day - a.convocDay < 20;
  };

  // ------------------------------------------------------------------ Nullités
  // anomalies d'une affaire : def.anomalies = { flag: { irreg, piece, annule:[pieceIds], cachee } }
  P.anomalie = (cs, flag) => { const d = CR.caseDef(cs); return flag && d.anomalies ? d.anomalies[flag] || null : null; };
  // Délai de l'article 173-1 (loi du 23 juillet 2026)
  P.delai1731 = function (cs) {
    const p = cs.proc;
    if (p.mex == null) return null;
    let start = p.mex;
    if (p.copieDemandee != null && p.copieDemandee - p.mex <= 7 && p.copieDelivree != null) start = p.copieDelivree;
    return CR.rollForward(CR.addMonths(start, 4));
  };
  // Enregistre les moyens soulevés et dit s'ils sont recevables
  P.soulever = function (api, { flags, vehicle, day, grief }) {
    const { cs } = api;
    const p = cs.proc;
    const out = [];
    for (const flag of flags) {
      if (p.moyens.some((m) => m.flag === flag && m.recevable)) continue;
      const an = P.anomalie(cs, flag);
      let recevable = true, motif = "";
      if (vehicle === "conclusions") {
        const a = p.audience;
        if (a && day > a.day - 3 && !P.dispense385(cs) && !(an && an.cachee)) { recevable = false; motif = "Conclusions déposées moins de trois jours avant l'audience (art. 385)"; }
      } else if (vehicle === "oral") {
        if (!P.dispense385(cs) && !(an && an.cachee)) { recevable = false; motif = "Exception soulevée à la barre sans conclusions déposées au greffe trois jours avant l'audience (art. 385)"; }
      } else if (vehicle === "requete") {
        const due = P.delai1731(cs);
        if (due != null && day > due && !(an && an.cachee)) { recevable = false; motif = `Requête déposée après l'expiration du délai de quatre mois, le ${CR.fmtDate(due, "long")} (art. 173-1)`; }
      } else if (vehicle === "tardif") {
        recevable = false; motif = "Exception soulevée après une défense au fond (art. 385)";
      }
      const m = { id: CR.uid("mo"), flag, vehicle, day, recevable, motif, grief: !!grief, decision: null, reel: !!an };
      p.moyens.push(m);
      out.push(m);
    }
    return out;
  };
  // La juridiction statue sur les moyens recevables non encore jugés
  P.statuerNullites = function (api, jugeProfil) {
    const { s, cs } = api;
    const p = cs.proc;
    const prof = jugeProfil || { nullites: 0.9 };
    const res = [];
    for (const m of p.moyens) {
      if (m.decision) continue;
      if (!m.recevable) { m.decision = "irrecevable"; res.push(m); continue; }
      const an = P.anomalie(cs, m.flag);
      if (!an) { m.decision = "rejete"; m.motifDecision = "Le moyen ne correspond à aucune irrégularité au dossier."; res.push(m); continue; }
      const ir = CR.IRREG[an.irreg] || {};
      let prob = prof.nullites || 0.9;
      if (ir.grief === "prouver" && !m.grief) prob *= 0.45;
      if (an.force != null) prob *= an.force;
      // Un arrêt enregistré dans le dossier qui soutient ce moyen (code annoté) : le grief présumé est établi, la nullité plus sûre
      const jp = CR.jpAppui ? CR.jpAppui(s, cs, an.irreg) : null;
      if (jp) { if (ir.grief === "prouver" && !m.grief) prob /= 0.45; prob = Math.min(0.98, prob * 1.1); m.jp = jp.id; }
      const ok = R.chance(s, prob);
      m.decision = ok ? "annule" : "rejete";
      m.motifDecision = ok ? (ir.effet || "Acte annulé.") + (m.jp ? ` (le tribunal se réfère à l'arrêt cité en défense : ${CR.jpCite(m.jp)}.)` : "") : "Le tribunal estime que l'irrégularité n'a pas porté atteinte aux intérêts de la partie qu'elle concerne (art. 802).";
      if (ok) {
        for (const pid of an.annule || []) if (!p.annules.includes(pid)) p.annules.push(pid);
        s.stats.nullites += 1;
      }
      res.push(m);
    }
    return res;
  };
  P.annule = (cs, pieceId) => !!(cs.proc && cs.proc.annules.includes(pieceId));

  // ------------------------------------------------------------------ Délibéré : décision au fond
  // spec (def.fond) : { pieces, arguments, seuil, qualif(api,ctx), peine(api,ctx), civil(api,ctx) }
  // ctx : { played:[ids], angle, juge, contexte:{}, requis }
  P.deliberer = function (api, spec, ctx) {
    const { s, cs } = api;
    const juge = ctx.juge || { severite: 0.5 };
    const played = new Set(ctx.played || []);
    const known = (id) => played.has(id) || CR.hasFact(cs, id) && (ctx.notesComptent !== false);
    const calc = [];
    let charge = 0, decharge = 0;
    for (const [pid, pc] of Object.entries(spec.pieces || {})) {
      if (pc.sens === "charge") {
        if (P.annule(cs, pid)) { calc.push({ k: "annulee", t: `${pc.label} : annulée, écartée du calcul` }); continue; }
        charge += pc.force;
        calc.push({ k: "charge", t: `${pc.label} : charge (${Math.round(pc.force * 100)})` });
      } else {
        const mobilise = !pc.need || [].concat(pc.need).some((n) => played.has(n) || (pc.noteSuffit && CR.hasFact(cs, n)));
        if (mobilise) { decharge += pc.force; calc.push({ k: "decharge", t: `${pc.label} : à décharge, invoquée (${Math.round(pc.force * 100)})` }); }
        else calc.push({ k: "oubli", t: `${pc.label} : à décharge, jamais invoquée` });
      }
    }
    let args = 0;
    for (const [aid, a] of Object.entries(spec.arguments || {})) {
      if (a.type && a.type !== "culpabilite") continue;
      const joue = [].concat(a.cards || []).some((c) => played.has(c));
      if (!joue) continue;
      const pert = a.pertinent ? a.pertinent(api, ctx) : true;
      if (pert) { args += a.poids; calc.push({ k: "argument", t: `${a.label} : argument pertinent (${Math.round(a.poids * 100)})` }); }
      else { args -= 0.04; calc.push({ k: "hors", t: `${a.label} : argument hors sujet, crédibilité entamée` }); }
    }
    const severShift = ((juge.severite || 0.5) - 0.5) * 0.12;
    const S = charge - decharge - args + severShift;
    const seuil = spec.seuil || 0.55;
    const noise = (CR.seeded(cs.id + "delib" + s.seed)() - 0.5) * 0.12;
    let coupable;
    if (S >= seuil + 0.2) coupable = true;
    else if (S < seuil - 0.2) coupable = false;
    else coupable = S + noise >= seuil;
    calc.push({ k: "total", t: `Charges ${Math.round(charge * 100)} − décharges ${Math.round(decharge * 100)} − arguments ${Math.round(args * 100)} ${severShift >= 0 ? "+" : "−"} profil du magistrat ${Math.abs(Math.round(severShift * 100))} = ${Math.round(S * 100)} (seuil ${Math.round(seuil * 100)}, part de hasard ±6)` });
    const out = { coupable, score: S, calc, questions: [] };
    if (coupable && spec.qualif) out.qualif = spec.qualif(api, Object.assign({}, ctx, { played }));
    if (coupable && spec.peine) out.peine = spec.peine(api, Object.assign({}, ctx, { played, qualif: out.qualif }));
    if (spec.civil && cs.proc.pcConstituee !== false) out.civil = spec.civil(api, Object.assign({}, ctx, { played, coupable, qualif: out.qualif }));
    return out;
  };

  // ------------------------------------------------------------------ Peine
  // r = { encourue:{prison (mois), amende}, requis:{ferme, sursis, sursisType, amende, complementaires:[], ddse}, recidive }
  P.calculerPeine = function (api, r, ctx) {
    const { s, cs } = api;
    const juge = ctx.juge || { severite: 0.5 };
    const perso = Math.min(5, ctx.personnalite || 0);
    let f = 0.78 + (juge.severite || 0.5) * 0.44;
    f *= 1 - perso * 0.08;
    if (ctx.angle === "peine") f *= 0.93;
    if (ctx.angle === "mixte_maladroit") f *= 1.05;
    if (ctx.contexte && ctx.contexte.finJournee) f *= 1.05;
    const noise = 1 + (CR.seeded(cs.id + "peine" + s.seed)() - 0.5) * 0.12;
    f *= noise;
    const q = r.requis || {};
    const total = Math.max(0, (q.ferme || 0) + (q.sursis || 0));
    let ferme = Math.round((q.ferme || 0) * f);
    let sursis = Math.round((q.sursis || 0) * f);
    let sursisType = q.sursisType || "simple";
    if (perso >= 3 && ferme > 0 && ferme <= 6 && juge.severite < 0.6) { sursis += ferme; ferme = 0; sursisType = "probatoire"; }
    const amende = q.amende ? Math.round(q.amende * f / 50) * 50 : 0;
    const peine = { ferme, sursis, sursisType, amende, complementaires: (q.complementaires || []).slice(), amenagement: null, mandatDepot: false, regles: [] };
    const plafond = r.encourue && r.encourue.prison;
    if (plafond && ferme + sursis > plafond) { const k = plafond / (ferme + sursis); peine.ferme = Math.floor(ferme * k); peine.sursis = Math.floor(sursis * k); }
    // art. 132-19 : pas de ferme d'un mois ou moins
    if (peine.ferme > 0 && peine.ferme <= 1) { peine.sursis += peine.ferme; peine.ferme = 0; peine.regles.push("Une peine ferme d'un mois ou moins est interdite (art. 132-19 CP) : elle devient du sursis."); }
    // aménagement
    if (peine.ferme > 1 && peine.ferme <= 6) {
      if (perso >= 1 || !ctx.sansDomicile) { peine.amenagement = "DDSE"; peine.regles.push("Ferme de six mois au plus : aménagement obligatoire sauf impossibilité (art. 132-19 et 132-25 CP)."); }
      else { peine.mandatDepot = !!ctx.detenu; peine.regles.push("Ferme de six mois au plus, mais l'absence de domicile rend l'aménagement impossible."); }
    } else if (peine.ferme > 6 && peine.ferme <= 12) {
      if (perso >= 2) { peine.amenagement = "DDSE"; peine.regles.push("Ferme de six mois à un an : le tribunal choisit d'aménager, la personnalité le permet (art. 132-25 CP)."); }
      else { peine.mandatDepot = !!ctx.detenu || juge.severite > 0.7; peine.regles.push("Ferme de six mois à un an : aménagement possible mais non retenu, le dossier de personnalité est trop mince."); }
    } else if (peine.ferme > 12) {
      peine.mandatDepot = true;
      peine.regles.push("Ferme de plus d'un an : pas d'aménagement ab initio ; le tribunal peut décerner mandat de dépôt.");
    }
    peine.texte = P.peineTexte(peine);
    return peine;
  };
  P.peineTexte = function (pn) {
    const parts = [];
    const tot = (pn.ferme || 0) + (pn.sursis || 0);
    if (tot > 0) {
      if (pn.ferme && pn.sursis) parts.push(`${CR.fmtMois(tot)} d'emprisonnement dont ${CR.fmtMois(pn.sursis)} avec sursis${pn.sursisType === "probatoire" ? " probatoire" : ""}`);
      else if (pn.ferme) parts.push(`${CR.fmtMois(pn.ferme)} d'emprisonnement ferme`);
      else parts.push(`${CR.fmtMois(pn.sursis)} d'emprisonnement avec sursis${pn.sursisType === "probatoire" ? " probatoire" : ""}`);
    }
    if (pn.amenagement) parts.push(`partie ferme aménagée sous ${pn.amenagement === "DDSE" ? "détention à domicile sous surveillance électronique" : pn.amenagement}`);
    if (pn.mandatDepot) parts.push("avec mandat de dépôt");
    if (pn.amende) parts.push(`${CR.money(pn.amende)} d'amende`);
    for (const c of pn.complementaires || []) parts.push(c);
    return parts.length ? CR.cap(parts.join(", ")) : "Dispense de peine";
  };

  // ------------------------------------------------------------------ Indemnisation (intérêts civils)
  // postes : [{ id, label, demande, justif: factId|pieceId|null, base }]
  P.calculerCivil = function (api, postes, ctx) {
    const { s, cs } = api;
    const juge = ctx.juge || { severite: 0.5 };
    const lignes = [];
    let total = 0;
    for (const po of postes) {
      if (!po.demande) continue;
      const justifie = !po.justif || [].concat(po.justif).some((j) => CR.hasFact(cs, j) || (ctx.played && ctx.played.has && ctx.played.has(j)));
      let alloue = po.base != null ? Math.min(po.demande, po.base * (po.demande > po.base * 1.6 ? 0.9 : 1)) : po.demande;
      if (!justifie) alloue = Math.round(alloue * (po.sansJustif != null ? po.sansJustif : 0.3));
      alloue = Math.round(alloue * (0.92 + (0.5 - (juge.severite || 0.5)) * -0.1) / 10) * 10;
      lignes.push({ label: po.label, demande: po.demande, alloue, justifie });
      total += alloue;
    }
    return { lignes, total };
  };

  // ------------------------------------------------------------------ Détention
  P.detention = function (api, statut, opts) {
    const { s, cs } = api;
    const d = cs.proc.detention;
    if (d.statut === "dp" && ["libre", "cj", "arse"].includes(statut) && cs.status === "active") cs.flags.miseEnLiberte = s.day;
    d.statut = statut;
    d.since = s.day;
    if (opts && opts.etab) d.etab = opts.etab;
    if (opts && opts.until != null) d.until = opts.until;
    P.event(api, { libre: "Libre", cj: "Placé sous contrôle judiciaire", arse: "Assigné à résidence sous surveillance électronique", dp: "Placé en détention provisoire", condamne: "Écroué en exécution de sa peine" }[statut] || statut);
    if (CR.detenuSync) CR.detenuSync(s, cs);
  };

  // ------------------------------------------------------------------ Contrôles d'actes
  // Renvoie { ok, sanction, motif, regul } pour un acte du joueur, d'après la fiche et l'état du dossier
  P.controle = function (api, acte, ctx) {
    const { s, cs } = api;
    const p = cs.proc;
    const day = ctx.day != null ? ctx.day : s.day;
    const r = { ok: true, sanction: null, motif: "", regul: "" };
    const fail = (sanction, motif, regul) => { r.ok = false; r.sanction = sanction; r.motif = motif; r.regul = regul || ""; return r; };
    switch (acte) {
      case "pcpc": {
        if (P.estPrescrit(cs, day)) return fail("prescription", "L'action publique est prescrite.", "Aucune");
        if (p.nature === "contravention") return fail("irrecevabilite", "La plainte avec constitution de partie civile n'est ouverte que pour un crime ou un délit (art. 85).", "Citer directement devant le tribunal de police");
        if (p.nature === "delit") {
          const ps = cs.vars.plainteSimpleDay;
          const prop = ps != null && (cs.vars.plainteSimpleProcureur || cs.vars.plainteSimpleCopie);
          const classe = cs.flags.classement;
          if (!classe && !(prop && day - ps >= 0 && day >= CR.addMonths(ps, 3)))
            return fail("irrecevabilite", ps == null ? "Aucune plainte simple préalable au procureur (art. 85)." : !prop ? "La plainte simple n'a pas été adressée au procureur contre récépissé ou par lettre recommandée (art. 85)." : "Le délai de trois mois depuis la plainte simple n'est pas écoulé et le parquet n'a pas répondu (art. 85).", "Déposer la plainte simple au procureur et attendre trois mois ; la prescription est suspendue pendant ce temps (Crim. 23 juin 2026)");
        }
        return r;
      }
      case "citation": {
        if (P.estPrescrit(cs, day)) return fail("prescription", "L'action publique est prescrite au jour de la citation.", "Aucune");
        if (ctx.juridiction === "tc" && p.nature === "contravention") return fail("incompetence", "Le tribunal correctionnel ne juge que les délits ; une contravention relève du tribunal de police (art. 381 et 521 CPP).", "Citer à nouveau devant le tribunal de police");
        if (ctx.juridiction === "tp" && p.nature !== "contravention") return fail("incompetence", "Le tribunal de police ne juge que les contraventions.", "Citer devant le tribunal correctionnel");
        if (ctx.audienceDay != null && ctx.audienceDay - day < 15) return fail("citation_courte", "La citation a été délivrée moins de quinze jours avant l'audience (art. 552).", "Citer à nouveau en respectant le délai");
        return r;
      }
      case "appel_corr": {
        const j = cs.vars.jugementDay;
        if (j == null) return r;
        const due = CR.rollForward(j + 10);
        if (day > due) return fail("irrecevabilite", `Appel formé le ${CR.fmtDate(day, "long")}, après l'expiration du délai de dix jours le ${CR.fmtDate(due, "long")} (art. 498 et 801).`, "Aucune, sauf force majeure");
        return r;
      }
      case "opposition_op": {
        const n = cs.vars.opNotifDay;
        if (n == null) return r;
        const due = CR.rollForward(n + 45);
        if (day > due) return fail("irrecevabilite", `Opposition formée après le délai de quarante-cinq jours (art. 495-3).`, "Aucune");
        return r;
      }
      case "dml": {
        if (cs.vars.dmlPendante) return fail("irrecevabilite", "Une précédente demande de mise en liberté n'a pas encore été définitivement jugée (loi du 23 juillet 2026).", "Attendre la décision définitive sur la demande précédente");
        return r;
      }
      case "constitution_pc": {
        if (cs.vars.requisitionsFond) return fail("irrecevabilite", "Constitution de partie civile après les réquisitions du ministère public sur le fond (art. 421).", "Saisir le juge civil");
        return r;
      }
      default: return r;
    }
  };

  // ------------------------------------------------------------------ Résumé lisible pour l'onglet Procédure
  P.resume = function (s, cs) {
    const p = cs.proc;
    if (!p) return [];
    const lines = [];
    lines.push(["Stade", P.stadeLabel(cs)]);
    if (p.juridiction && P.JURIDICTIONS[p.juridiction]) lines.push(["Juridiction", P.JURIDICTIONS[p.juridiction].label]);
    if (p.faitsDay != null) lines.push(["Faits", CR.fmtDate(p.faitsDay, "long")]);
    if (p.mex != null) lines.push(["Mise en examen", CR.fmtDate(p.mex, "long")]);
    const d = p.detention;
    if (d && d.statut !== "libre") lines.push(["Situation", { cj: "Contrôle judiciaire", arse: "ARSE", dp: "Détention provisoire", condamne: "Détenu, condamné" }[d.statut] + (d.since != null ? ` depuis le ${CR.fmtDate(d.since, "long")}` : "") + (d.etab && CR.PLACES && CR.PLACES[d.etab] ? ` — ${CR.PLACES[d.etab].nom}` : "")]);
    if (p.audience && p.audience.day >= s.day) lines.push(["Prochaine audience", `${CR.fmtDate(p.audience.day, "dow")} à ${CR.fmtTime(p.audience.min)} — ${(P.JURIDICTIONS[p.audience.juridiction] || {}).label || ""}`]);
    if (p.pcConstituee && cs.camp === "pc") lines.push(["Partie civile", "Constituée"]);
    return lines;
  };
})();
