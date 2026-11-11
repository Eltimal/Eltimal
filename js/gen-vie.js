/* La Permanence — moteur génératif, phase 3 : les personnages autonomes.
   Le tirage (GEN2.tirerVie, gen-moteur.js) fixe qui ment, qui ne vient pas, qui ne paie pas, la famille qui s'en mêle,
   le parquet qui négocie ou fait appel, le confrère d'en face, la presse. Ce fichier les fait vivre dans une affaire
   générée : il enveloppe la définition construite par GEN2.def (tâches, hooks, appels, audiences, débrief) sans rien
   changer au droit de l'affaire. Toutes les répliques viennent de gen-parole.js (GEN2.PR.vie). */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const CAT = CR.CAT;
  const GEN2 = CR.GEN2;
  const PR = GEN2.PR;
  const M = CR.MONDE;
  const VIE = (GEN2.VIE = {});
  const D = (d) => CR.fmtDate(d, "long");
  // La pièce qui porte chaque preuve (gen-pieces.js)
  VIE.DOC = { video: "pv_video", temoin: "pv_temoin", telephonie: "pv_telephonie", adn: "rapport_adn", saisie: "pv_saisie", labo: "rapport_labo", ethylo: "pv_alcoolemie", releve: "releve", ecrits: "captures", fichier: "fichier_permis", casier: "casier", certificat: "certificat" };
  const nomDe = (P) => (P ? `${P.prenom} ${P.nom}` : "");

  // Le client est-il injoignable aujourd'hui ?
  VIE.silence = (s, cs) => { const x = cs && cs.vars && cs.vars.vieSilence; return !!(x && s.day >= x.from && s.day <= x.to); };
  // Une décision trop douce aux yeux du parquet : relaxe, ou bien moins que ce qu'il a requis
  VIE.tropDoux = function (cs, dec) {
    if (!dec) return false;
    if (!dec.coupable) return true;
    const req = cs.vars.requis || {};
    const pn = dec.peine || {};
    if ((req.ferme || 0) > 0 && !(pn.ferme > 0)) return true;
    if ((req.ferme || 0) > 0 && pn.ferme < req.ferme * 0.5) return true;
    if (!(req.ferme > 0) && (req.sursis || 0) > 0 && !(pn.sursis > 0) && !(pn.ferme > 0)) return true;
    return false;
  };
  // L'audience du jour d'un script donné
  const audienceDuJour = (s, cs, script) => cs.hearings.find((h) => h.day === s.day && (!script || h.script === script) && !h.canceled);
  // Renvoyer une audience : une nouvelle date, la même salle (le hook de fin de l'audience du jour ne clôt rien)
  VIE.renvoyer = function (api, h, jours, motif) {
    const { s, cs } = api;
    let nd = CR.rollForward(s.day + jours);
    while (!CR.isBusinessDay(nd) || CR.dow(nd) !== CR.dow(h.day)) nd++;
    const h2 = Object.assign({}, h);
    delete h2.id; delete h2.attended; delete h2.missed; delete h2.canceled; delete h2.conflit;
    h2.day = nd;
    const nh = CR.scheduleHearing(s, cs, h2);
    if (cs.proc && cs.proc.audience) { cs.proc.audience.day = nd; cs.proc.audience.hid = nh.id; }
    cs.vars.vieRenvoiJour = s.day;
    CR.timeline(s, cs, `Audience renvoyée au ${D(nd)}${motif ? ` (${motif})` : ""}.`);
    return nd;
  };

  // ================================================================== Installation dans une définition d'affaire générée
  VIE.installer = function (def, p) {
    const t = p.t;
    const v = t.vie;
    if (!v || def.vieInstalle) return def;
    def.vieInstalle = true;
    const C = t[t.client] || t.A;
    const nomC = nomDe(C);
    const defense = def.camp !== "pc";
    const TJ = M.lieuxDe(t).TJ;
    const on = (def.on = def.on || {});
    def.calls = def.calls || {};
    def.facts = def.facts || {};
    def.facts.G_vie_ment = { label: "Ce que le client affirme, à vérifier contre les pièces", key: false, why: "Un client peut mentir à son avocat : la version se confronte au dossier avant l'audience." };
    def.facts.G_vie_aveu = { label: "Le client reconnaît ce que la pièce établit", key: false, why: "Mieux vaut l'apprendre au cabinet qu'à l'audience : la défense se construit sur ce qui est vrai." };
    def.facts.G_vie_maintient = { label: "Le client maintient une version que le dossier contredit", key: false, why: "L'avocat plaide le doute, jamais un fait qu'il sait faux (devoir de probité et de loyauté)." };
    // la famille qui s'en mêle : la même personne que celle de l'entretien d'une information, sinon celle du tirage
    if (v.fam) {
      if (def.famille) { const F = def.famille; v.fam = Object.assign({}, v.fam, { g: F.g, prenom: F.prenom, nom: F.nom, age: F.age, rel: F.rel || PR.proche(t.A).nu || v.fam.rel }); Object.assign(F, { rel: v.fam.rel, paie: v.fam.paie, pousse: v.fam.pousse, secret: v.fam.secret }); }
      if (v.fam.prenom === C.prenom) v.fam = Object.assign({}, v.fam, { prenom: (v.fam.g === "f" ? M.PF : M.PM).find((x) => x !== C.prenom && x[0] !== C.prenom[0]) });
      if (!def.famille) def.famille = Object.assign({ metier: "", casier: 0 }, v.fam);
      PR.id(def.famille, "F");
    }
    const docPreuve = v.ment ? VIE.DOC[v.ment.preuve] : null;
    const ment = v.ment && docPreuve && (def.docs || {})[docPreuve] ? v.ment : null;

    // 1. La version du premier entretien : un mensonge, ou des aveux de garde à vue rétractés
    const patchVersion = (call) => {
      if (!call || !call.topics) return call;
      // un proche reçu à la place du client rapporte ses mots, entre guillemets (anti-répétition, lot 1 : défaut révélé par le directeur)
      const GA = PR.gram(t.A);
      const rapporte = (x) => (def.famille && call.who ? `${GA.Il} m'a dit : « ${x} »` : x);
      for (const tp of call.topics) {
        if (!Array.isArray(tp.a)) continue;
        const i = tp.a.findIndex((sg) => sg && typeof sg === "object" && sg.f === "G_version");
        if (i >= 0 && ment && defense) tp.a = tp.a.slice(0, i + 1).concat([{ t: rapporte(PR.vie.mensonge(t, ment)), f: "G_vie_ment" }], tp.a.slice(i + 1));
        else if (i >= 0 && v.retracte && defense) tp.a = tp.a.slice(0, i).concat([{ t: rapporte(PR.vie.retractation(t)), f: "G_version" }], tp.a.slice(i + 1));
        if (tp.id === "v_quoi" && ment && !defense) tp.a = tp.a.concat([{ t: PR.vie.mensonge(t, ment), f: "G_vie_ment" }]);
      }
      return call;
    };
    if (def.calls.intake && typeof def.calls.intake === "object") patchVersion(def.calls.intake);
    // la personne qui revient le dit d'emblée
    const revQ = t.revenant && t[t.revenant.role];
    if (revQ && def.calls.intake && typeof def.calls.intake === "object" && ((t.revenant.role === "A" && t.client === "A") || (t.revenant.role === "V" && t.client === "V"))) {
      const kind = t.revenant.role === "V" ? "a2v" : t.ant && t.ant.jug && revQ.casier === 2 && t.recid ? "recidive" : "v2a";
      def.calls.intake.opening = [PR.vie.revenant(t, kind)].concat(def.calls.intake.opening || []);
    }
    if (def.gav) { const g0 = def.gav; def.gav = (api, o) => { const g = g0(api, o); if (g && g.entretien) patchVersion(g.entretien); return g; }; }

    // 2. Le premier rendez-vous manqué
    if (v.absent === "rdv" && def.leadTask) {
      const lt = def.leadTask;
      def.leadTask = (api, T) => lt(api, (task) => {
        if (api.cs.vars.vieRdvManque == null && task && typeof task.run === "function" && task.kind === "meet") {
          T(Object.assign({}, task, { run: () => {
            const { s, cs } = api;
            cs.vars.vieRdvManque = s.day;
            CR.spend(s, 30, "idle", { busy: true });
            api.log(`${nomC} ne s'est pas présenté${PR.e(C)} au rendez-vous.`, "bad");
            CR.toast(s, `${nomC} n'est pas venu${PR.e(C)}. Vous attendez une demi-heure pour rien.`, "warn");
            for (const e of s.pending) if (e.caseId === cs.id && e.key === "_leadExpire") e.day += 3;
            api.ringOn(CR.nextBusinessDay(s.day), 9 * 60 + 40 + R.int(s, 0, 120), { from: nomC, kind: "client", vmText: PR.vie.absentRdv(t) });
            return null;
          } }));
        } else T(task);
      });
    }

    // 3. Les appels propres aux personnages (fonctions de l'affaire en cours)
    if (ment) def.calls.vie_confront = (api) => Object.assign(PR.vie.confrontation(t, ment || { k: "absent", preuve: "video", issue: "maintient" }), {
      onEnd(a, r) {
        const { s, cs } = a;
        cs.flags.vieConfronte = s.day;
        if (ment && ment.issue === "aveu") { cs.vars.vieAveu = s.day; a.tl("Le client revient sur sa version."); }
        if (cs.flags.vieCouvre) CR.erreur(s, cs, { id: "vie_couvre", texte: "Vous avez promis au client de « couvrir » une version que le dossier contredit.", sanction: "L'avocat ne peut présenter au tribunal un fait qu'il sait faux (probité, loyauté) ; plaider le doute reste permis.", regul: "Lui expliquer qu'on plaide le doute, pas un mensonge." });
      },
    });
    if (v.fam) def.calls.vie_famille = () => Object.assign(PR.vie.famille(t, def.famille), {
      onEnd(a) {
        const { s, cs } = a;
        cs.vars.vieFamilleVue = s.day;
        if (cs.flags.vieSecretViole && cs.vars.vieSecretSanction == null) {
          cs.vars.vieSecretSanction = s.day;
          CR.erreur(s, cs, { id: "vie_secret", texte: "Vous avez révélé à la famille ce que le client vous a confié.", sanction: "Le secret professionnel est général et absolu, même envers la famille qui paie (art. 66-5 de la loi de 1971 ; art. 226-13 CP).", regul: "Ne rien dire sans l'accord du client ; expliquer la procédure en termes généraux." });
          a.disc("secret", 6, `${CR.clientName(cs)} apprend que son avocat a répété à sa famille ce qu'il lui avait confié en entretien.`);
          a.trust(-20);
        }
        if (cs.flags.vieSecretTenu && v.fam && v.fam.paie && !v.fam.secret) { cs.vars.vieMauvaisPayeur = true; a.log(`${v.fam.prenom} ${v.fam.nom}, qui réglait les honoraires, n'accepte pas le secret : ${PR.il(v.fam)} cesse de payer.`, "bad"); }
        if (cs.flags.vieStrategieTenue) a.trust(3);
      },
    });
    if (v.presse) def.calls.vie_presse = () => Object.assign(PR.vie.presse(t, VIE.journaliste(t)), {
      onEnd(a) { const { s, cs } = a; cs.vars.viePresseVu = s.day; a.schedule(R.int(s, 1, 3), "_vie", { k: "article" }); },
    });
    if (v.menace) def.calls.vie_menace = () => Object.assign(PR.vie.menace(t), { onEnd(a) { a.cs.vars.vieMenaceVue = a.s.day; } });
    if (v.second) def.calls.vie_second = () => Object.assign(PR.vie.secondClient(t), {
      onEnd(a) {
        const { s, cs } = a;
        cs.vars.vieSecondVu = s.day;
        if (cs.flags.vieSecondRupture) { a.log("Vous vous retirez du dossier : le client garde l'autre avocat.", "info"); CR.closeCase(s, cs, { type: "withdrawn", detail: "le client a pris un autre avocat" }); }
      },
    });
    if (v.pq && (v.pq.crpc || v.pq.compo)) def.calls.vie_parquet = (api) => Object.assign(PR.vie.parquet(t, { compo: (api.cs.vars.vieProp || {}).type === "compo" }), {
      onEnd(a, r) {
        const { s, cs } = a;
        const P0 = cs.vars.vieProp;
        if (!P0 || P0.nego) return;
        const asked = (r && r.asked) || [];
        let gain = 0;
        if (asked.includes("vq_garanties")) gain += (CR.hasFact(cs, "G_emploi") || CR.hasFact(cs, "G_heberg") || CR.hasFact(cs, "G_attest_emploi")) ? 1 : 0.5;
        if (asked.includes("vq_casier") && !(t.rec && C.casier)) gain += 1;
        if (asked.includes("vq_indemn") && t.V && !t.V.agent) gain += 0.7;
        if (asked.includes("vq_menace")) gain -= 1.5;
        const pr = (CR.profil(t.parquet) || {}).alternative != null ? CR.profil(t.parquet).alternative : 0.4;
        const k = Math.max(0, Math.min(0.4, gain * 0.1 * (0.6 + pr)));
        P0.nego = s.day;
        if (k > 0.02) {
          const pn = P0.peine;
          for (const f of ["ferme", "sursis"]) if (pn[f]) pn[f] = Math.max(1, Math.round(pn[f] * (1 - k)));
          if (pn.amende) pn.amende = Math.max(50, Math.round((pn.amende * (1 - k)) / 50) * 50);
          P0.texte = VIE.texteProposition(P0);
          a.log(`Le parquet revoit sa proposition : ${P0.texte}.`, "good");
        } else if (gain < 0) a.log("Le parquet maintient sa proposition, agacé par le ton de la négociation.", "bad");
        else a.log("Le parquet maintient sa proposition.", "info");
      },
    });

    // 4. Les événements de la vie du dossier, une fois le client engagé
    const eng = on.engaged;
    on.engaged = function (api, d) {
      const r = eng ? eng.call(this, api, d) : undefined;
      VIE.planifier(api, t, v);
      return r;
    };
    on._vie = (api, d) => VIE.evenement(api, t, v, d && d.k, d);
    on._vieRing = (api, d) => ({ scene: "call", call: "vie_" + d.k });
    on._vieRingMissed = (api, d) => { api.cs.vars["vieManque_" + d.k] = api.s.day; };

    // 5. Les tâches : confronter, rappeler la famille, répondre au journaliste, au parquet, au confrère
    const tasks0 = def.tasks;
    def.tasks = function (api, T) {
      if (tasks0) tasks0.call(this, api, T);
      VIE.taches(api, T, t, v, ment, docPreuve);
    };
    // pendant le silence du client, l'appel « faire le point » sonne dans le vide
    const nu0 = !!def.noUpdate;
    Object.defineProperty(def, "noUpdate", { configurable: true, enumerable: true, get() { const s = CR.store && CR.store.s; const cs = s && s.cases && s.cases[def.id]; return nu0 || !!(cs && VIE.silence(s, cs)); } });

    // 6. Fin d'audience : un renvoi obtenu, ou un jugement que le parquet juge trop doux (appel)
    for (const k of Object.keys(on)) {
      if (!/^apres/.test(k) || k === "apresCJIP") continue;
      const orig = on[k];
      on[k] = function (api, res) {
        const { s, cs } = api;
        if (cs.vars.vieRenvoiJour === s.day) { cs.vars.vieRenvoiJour = null; return undefined; }
        if (defense && v.pq && v.pq.appel && !cs.vars.vieAppel && res && res.decision && ["apresTC", "apresCI"].includes(k) && VIE.tropDoux(cs, res.decision)) {
          cs.vars.vieAppel = { hook: k, res: JSON.parse(JSON.stringify(res)), day: s.day, etat: "delai" };
          CR.PROC.stade(api, "jugement", "Jugement rendu ; le délai d'appel de dix jours court (art. 498).");
          api.schedule(R.int(s, 3, 9), "_vie", { k: "appelPq" });
          return undefined;
        }
        return orig.call(this, api, res);
      };
    }
    on._vieApresAppel = (api) => VIE.apresAppel(api, t);
    on._vieAppelSansVous = (api) => { CR.erreur(api.s, api.cs, { id: "vie_appel_absent", texte: "Vous n'étiez pas à l'audience de la cour d'appel.", sanction: "La cour a statué sur l'appel du parquet sans entendre la défense.", regul: "Aucune." }); api.cs.vars.vieArret = "infirme"; VIE.apresAppel(api, t); };
    on._vieApresCRPC = (api) => { const P0 = api.cs.vars.vieProp; CR.closeCase(api.s, api.cs, { type: "condamnation", detail: `CRPC homologuée : ${P0 ? P0.texte : "peine acceptée"}` }); };
    on._vieCRPCSansVous = (api) => { CR.erreur(api.s, api.cs, { id: "vie_crpc_absent", texte: "Vous n'étiez pas à l'audience d'homologation.", sanction: "L'avocat est obligatoire en CRPC (art. 495-8) : l'homologation a été reportée, puis refusée.", regul: "Aucune." }); CR.closeCase(api.s, api.cs, { type: "condamnation", detail: "jugé après l'échec de la CRPC" }); };

    // 7. Les audiences : le prévenu absent, la pièce opposée à l'audience, le témoin cité, le confrère d'en face, la presse
    def.audiences = def.audiences || {};
    for (const k of Object.keys(def.audiences)) {
      const a0 = def.audiences[k];
      if (typeof a0 !== "function") continue;
      def.audiences[k] = function (api) {
        const a = a0.call(this, api);
        if (a && Array.isArray(a.steps) && ["tc", "ci", "ci_fond", "pc", "op", "proces", "citation"].includes(k)) a.steps = VIE.etapes(api, t, v, ment, a.steps, k);
        return a;
      };
    }
    def.audiences.vie_appel = (api) => VIE.audienceAppel(api, t);
    def.audiences.vie_crpc = (api) => VIE.audienceCRPC(api, t);

    // 8. Le débrief
    const deb0 = def.debrief;
    def.debrief = function (api, o) {
      const items = deb0 ? deb0.call(this, api, o) || [] : [];
      return items.concat(VIE.debrief(api, t, v, ment));
    };
    // 9. Un mauvais payeur : la facture de clôture reste impayée
    if (v.paie === "jamais") def.profile = Object.assign({}, def.profile || {}, { payeur: "mauvais" });
    return def;
  };

  // ------------------------------------------------------------------ Les personnes qui reviennent dans une partie ultérieure de la carrière
  // Un ancien client condamné (récidive : le premier jugement devient l'antécédent), une ancienne victime poursuivie,
  // un ancien prévenu devenu victime. Une fois chacun.
  const definitive = (jug) => CR.rollForward(jug + 10) + 1;
  VIE.candidats = function (s) {
    const deja = new Set(s.revenus || []);
    const out = [];
    for (const p of s.generated || []) {
      if (p.gen !== 2 || p.code || !p.t || p.t.genre === "info" || p.t.R || p.t.PM) continue;
      const cs = s.cases[p.id];
      if (!cs || cs.status !== "closed" || !cs.outcome || s.day - cs.outcome.day < 45) continue;
      const t = p.t;
      const ty = cs.outcome.type;
      if (["lost-lead", "declined", "transferred"].includes(ty)) continue;
      if (t.client === "A" && ty === "condamnation" && !deja.has(p.id + ":recidive")) out.push({ p, cs, kind: "recidive" });
      if (t.V && !t.V.agent && t.V.age >= 18 && !deja.has(p.id + ":v2a")) out.push({ p, cs, kind: "v2a" });
      if (t.A && !t.A.agent && !deja.has(p.id + ":a2v")) out.push({ p, cs, kind: "a2v" });
    }
    return out;
  };
  VIE.revenantPour = function (s) {
    const cands = VIE.candidats(s);
    if (!cands.length) return null;
    const x = cands[Math.floor(CR.R.next(s) * cands.length)];
    const t = x.p.t;
    const P = x.kind === "v2a" ? t.V : t.A;
    const personne = JSON.parse(JSON.stringify(P));
    let ant = null;
    if (x.kind === "recidive") {
      const pn = x.cs.vars.peine || {};
      const q = t.q || CAT.qualifier(t.inf, t.f);
      const jug = x.cs.outcome.day;
      const def = definitive(jug);
      const ferme = pn.ferme || 0;
      ant = { inf: t.inf, label: q.label, art: q.art, prison: q.prison || 0, nature: q.nature || "delit", classe: q.classe, violence: CAT.avecViolences ? !!CAT.avecViolences(t.inf, q) : false, juridiction: M.lieuxDe(t).TJ.tc, jug, def, fin: ferme ? def + ferme * 30 : def, peine: { ferme, sursis: pn.sursis || 0, amende: pn.amende || 0 } };
    }
    return { kind: x.kind === "a2v" ? "pc" : null, revenant: { personne, role: x.kind === "a2v" ? "V" : "A", from: x.p.id, day: x.cs.outcome.day, ant, kind: x.kind }, cle: x.p.id + ":" + x.kind };
  };

  // ------------------------------------------------------------------ Commission d'office déclinée : un motif d'excuse ou d'empêchement
  VIE.MOTIFS_CO = { empechement: "autre audience ou garde à vue en cours", conflit: "conflit d'intérêts", maladie: "maladie", aucun: "sans motif" };
  VIE.refusCommission = function (api) {
    const { s, cs } = api;
    const m = cs.flags.refusMotif || "aucun";
    s.refusCO = (s.refusCO || []).filter((d) => s.day - d < 60).concat([s.day]);
    cs.vars.refusMotif = m;
    if (m === "aucun") {
      api.disc("commission d'office", 3, "Le service de la permanence pénale signale qu'un avocat inscrit a refusé une commission d'office sans motif d'excuse ni d'empêchement.");
      CR.rep(s, "confreres", -2, "commission d'office refusée sans motif");
    } else if (s.refusCO.length > 2) CR.rep(s, "confreres", -2, "refus répétés de commissions d'office");
    else CR.log(s, `Commission d'office déclinée (${VIE.MOTIFS_CO[m]}) : le dossier part au confrère suivant.`, "info", cs.id);
  };

  // ------------------------------------------------------------------ Le journaliste (tiré une fois pour l'affaire)
  VIE.journaliste = function (t) {
    const r = CR.seeded(t.sig + ":presse");
    const g = r() < 0.5 ? "f" : "m";
    const pk = (a) => a[Math.floor(r() * a.length)];
    return { g, prenom: pk(g === "f" ? ["Claire", "Inès", "Margaux", "Sonia", "Léa"] : ["Hugo", "Karim", "Julien", "Thomas", "Romain"]), nom: pk(["Lemercier", "Benhamou", "Ravier", "Ollivier", "Tessier", "Mbaye"]), journal: (t.vie && t.vie.journal) || "Paris Matin" };
  };
  VIE.texteProposition = (P0) => (P0.type === "compo" ? `une amende de composition de ${CR.money(P0.peine.amende || 300)}${P0.peine.stage ? " et un stage de citoyenneté" : ""} (art. 41-2 CPP)` : CR.ACT.requisTexte(P0.peine).replace(/^./, (c) => c.toLowerCase()));

  // ------------------------------------------------------------------ Calendrier des événements, posé à l'engagement
  VIE.planifier = function (api, t, v) {
    const { s, cs } = api;
    if (cs.vars.viePlan != null) return;
    cs.vars.viePlan = s.day;
    const r = CR.seeded(t.sig + ":vie:" + s.seed);
    const j = (a, b) => a + Math.floor(r() * (b - a + 1));
    const aud = () => (cs.proc && cs.proc.audience ? cs.proc.audience.day : null);
    const avant = (d) => { const A = aud(); return A == null || s.day + d < A - 2; };
    if (v.injoignable) { const d = j(4, 18); if (avant(d + 6)) api.schedule(d, "_vie", { k: "silence" }); }
    if (v.paie !== "ok" && cs.collected > 0) api.schedule(j(3, 8), "_vie", { k: "cheque" });
    if (v.fam) api.schedule(j(2, 10), "_vie", { k: "famille" });
    if (v.presse) api.schedule(j(4, 25), "_vie", { k: "presse" });
    if (v.second) api.schedule(j(8, 30), "_vie", { k: "second" });
    if (v.menace) api.schedule(j(10, 40), "_vie", { k: "menace" });
    if (v.pq && (v.pq.crpc || v.pq.compo)) { const d = j(4, 12); if (avant(d + 14)) api.schedule(d, "_vie", { k: "proposition" }); }
    if (v.adv && aud() != null) { const d = Math.max(1, aud() - s.day - j(4, 12)); api.schedule(d, "_vie", { k: "adverse" }); }
    const A = aud();
    if (A != null && A - s.day > 3) {
      if (v.pq && v.pq.temoin) api.schedule(A - s.day - j(1, 3), "_vie", { k: "temoin" });
      if (v.absent === "audience") api.schedule(A - s.day - 1, "_vie", { k: "absence" });
    }
  };

  // ------------------------------------------------------------------ Les événements
  VIE.evenement = function (api, t, v, k, d) {
    const { s, cs } = api;
    if (cs.status === "closed") return;
    const C = t[t.client] || t.A;
    const nomC = nomDe(C);
    const TJ = M.lieuxDe(t).TJ;
    switch (k) {
      case "silence": {
        cs.vars.vieSilence = { from: s.day, to: s.day + R.int(s, 5, 11) };
        api.log(PR.vie.injoignable(t), "bad");
        api.schedule(cs.vars.vieSilence.to - s.day + 1, "_vie", { k: "silenceFin" });
        return;
      }
      case "silenceFin": api.ringOn(s.day, 10 * 60 + R.int(s, 0, 300), { from: nomC, kind: "client", vmText: PR.vie.retourSilence(t) }); api.trust(-4); return;
      case "cheque": {
        const m = Math.min(cs.collected, Math.max(0, Math.round(cs.collected)));
        if (!m) return;
        CR.payOut(s, m, `Chèque de provision rejeté — ${nomC}`, cs.id);
        cs.collected -= m; s.stats.honoraires -= m;
        cs.vars.vieImpaye = m;
        api.mail({ from: "Banque du Palais", subject: `Chèque impayé — ${nomC}`, kind: "courrier", important: true, body: [[`Le chèque de ${CR.money(m)} remis en provision par ${v.fam && v.fam.paie ? `${v.fam.prenom} ${v.fam.nom}` : nomC} est revenu impayé (défaut de provision).`]] });
        if (v.paie === "retard") api.schedule(R.int(s, 12, 35), "_vie", { k: "regle" });
        return;
      }
      case "regle": { const m = cs.vars.vieImpaye || 0; if (!m) return; api.pay(m, `Provision réglée avec retard — ${nomC}`); cs.collected += m; s.stats.honoraires += m; cs.vars.vieImpaye = 0; api.log(`${nomC} a fini par régler la provision.`, "good"); return; }
      case "famille": {
        const F = v.fam;
        api.ringOn(s.day, Math.max(s.min + 20, 11 * 60 + R.int(s, 0, 360)), { from: `${F.prenom} ${F.nom} (${F.rel} de ${C.prenom})`, kind: "client", onAnswer: "_vieRing", onMissed: "_vieRingMissed", data: { k: "famille" }, vmText: `Maître, ${F.prenom} ${F.nom}, ${/^(mère|sœur|tante|épouse)$/.test(F.rel) ? "la" : "le"} ${F.rel} de ${C.prenom}. Rappelez-moi, c'est important.` });
        return;
      }
      case "presse": {
        const J = VIE.journaliste(t);
        api.ringOn(s.day, Math.max(s.min + 20, 10 * 60 + R.int(s, 0, 420)), { from: `${J.prenom} ${J.nom}, ${J.journal}`, kind: "client", onAnswer: "_vieRing", onMissed: "_vieRingMissed", data: { k: "presse" }, vmText: `Bonjour maître, ${J.prenom} ${J.nom}, de ${J.journal}. Je travaille sur l'affaire ${C.nom}. Rappelez-moi si vous voulez donner votre version.` });
        api.schedule(5, "_vie", { k: "article", sans: true });
        return;
      }
      case "article": {
        if (cs.vars.vieArticle) return;
        const choix = cs.flags.viePresse || "aucun";
        const A = PR.vie.article(t, { choix });
        cs.vars.vieArticle = { day: s.day, choix };
        api.mail({ from: VIE.journaliste(t).journal, subject: A.titre, kind: "email", body: [[A.corps]] });
        if (choix === "details") {
          CR.erreur(s, cs, { id: "vie_presse", texte: "Vous avez livré à un journaliste le contenu du dossier.", sanction: "Le secret de l'enquête et de l'instruction (art. 11 CPP) et le secret professionnel interdisent de communiquer les pièces ; l'avocat ne peut parler que dans le respect de la présomption d'innocence et des droits de la défense.", regul: "Une déclaration mesurée, ou rien." });
          api.disc("secret", 6, `Le parquet signale au bâtonnier qu'un article reprend des pièces couvertes par le secret, après un échange avec l'avocat de ${CR.clientName(cs)}.`);
          api.trust(-10);
        } else if (choix === "mesure") { api.trust(3); api.rep("clients", 1, "une déclaration mesurée dans la presse"); }
        else if (choix === "aucun") api.trust(-2);
        return;
      }
      case "second": {
        const conf = CR.ACTEURS.filter((a) => a.role === "confrere" && !(t.vie.adv && t.vie.adv.id === a.id));
        const c = conf[R.int(s, 0, conf.length - 1)];
        cs.vars.vieSecond = { id: c.id, day: s.day };
        api.mail({ from: c.nom, subject: `${nomC} — intervention à vos côtés`, kind: "email", important: true, body: PR.vie.second(t, c.nom, c.look && c.look.g).map((x) => [x]) });
        api.schedule(12, "_vie", { k: "secondFin" });
        return;
      }
      case "secondFin": {
        if (cs.flags.vieSecondRegle || cs.vars.vieSecondVu != null) return;
        api.log(`${nomC} a choisi de garder l'autre avocat : faute de réponse, le dossier part chez votre confrère.`, "bad");
        api.rep("clients", -1);
        CR.closeCase(s, cs, { type: "withdrawn", detail: "le client a gardé l'autre avocat" });
        return;
      }
      case "menace": {
        cs.vars.vieMenace = s.day;
        api.ringOn(s.day, Math.max(s.min + 20, 9 * 60 + 50 + R.int(s, 0, 400)), { from: nomC, kind: "client", onAnswer: "_vieRing", onMissed: "_vieRingMissed", data: { k: "menace" }, vmText: "Maître, c'est moi. Il faut qu'on parle. Je me demande si je ne vais pas prendre un autre avocat." });
        api.schedule(7, "_vie", { k: "menaceFin" });
        return;
      }
      case "menaceFin": {
        if (cs.flags.vieRassure) return;
        if (cs.trust >= 62 && cs.vars.vieMenaceVue != null) return;
        api.log(`${nomC} ne vous a pas attendu${PR.e(C)} : ${PR.il(C)} a pris un autre avocat.`, "bad");
        api.rep("clients", -1, "un client parti chez un confrère");
        CR.closeCase(s, cs, { type: "withdrawn", detail: "le client a changé d'avocat" });
        return;
      }
      case "proposition": {
        const q = t.q;
        const compo = !!(t.vie.pq && t.vie.pq.compo);
        if (cs.vars.vieProp) return;
        let peine;
        if (compo) peine = { amende: Math.max(150, Math.min(q.amende || 3750, Math.round(((C.revenu || 1500) * 0.4) / 50) * 50)), stage: true };
        else {
          const b = CAT.requisBase(q, { casier: C.casier, recidive: t.rec, revenus: C.revenu != null ? C.revenu * 12 : undefined });
          peine = CR.ACT.requis(api, b);
          // la CRPC : trois ans au plus, et jamais plus de la moitié de l'emprisonnement encouru (art. 495-8) ; une remise sur les
          // réquisitions habituelles
          const plafond = Math.max(1, Math.min(36, Math.floor((q.prison || 24) / 2)));
          for (const f of ["ferme", "sursis"]) if (peine[f]) peine[f] = Math.max(1, Math.min(plafond, Math.round(peine[f] * 0.8)));
          delete peine.mandatDepot;
        }
        cs.vars.vieProp = { type: compo ? "compo" : "crpc", peine, limite: s.day + 10, etat: "ouverte" };
        cs.vars.vieProp.texte = VIE.texteProposition(cs.vars.vieProp);
        api.mail({ from: compo ? `${TJ.parquet} — délégué du procureur` : TJ.parquet, subject: compo ? `Proposition de composition pénale — ${nomC}` : `Proposition de CRPC — ${nomC}`, kind: "greffe", important: true, body: [[compo ? `Maître, le procureur de la République propose à votre client${PR.gram(C).f ? "e" : ""} une composition pénale (art. 41-2) : ${cs.vars.vieProp.texte}. Exécutée, elle éteint l'action publique.` : `Maître, le parquet propose à votre client${PR.gram(C).f ? "e" : ""} une comparution sur reconnaissance préalable de culpabilité (art. 495-7) : ${cs.vars.vieProp.texte}.`], [`Réponse attendue avant le ${D(cs.vars.vieProp.limite)}. À défaut, l'affaire sera jugée à la date prévue.`]] });
        api.schedule(11, "_vie", { k: "propositionFin" });
        return;
      }
      case "propositionFin": { const P0 = cs.vars.vieProp; if (P0 && P0.etat === "ouverte") { P0.etat = "caduque"; api.log("Sans réponse, la proposition du parquet est caduque : l'affaire sera jugée.", "info"); } return; }
      case "adverse": {
        const adv = t.vie.adv;
        const L = PR.vie.adverse(t, adv, "mail");
        const a = CR.acteur(adv.id) || { nom: "Le confrère" };
        cs.vars.vieAdverse = s.day;
        if (L) api.mail({ from: a.nom, subject: { conciliant: "Proposition d'accord", agressif: "Votre client", procedurier: "Communication de conclusions", absent: "Demande de renvoi" }[adv.style], kind: "email", body: L.map((x) => [x]) });
        return;
      }
      case "temoin": {
        if (!t.T) return;
        cs.vars.vieTemoin = s.day;
        api.mail({ from: TJ.parquet, subject: `Citation d'un témoin — audience ${CR.clientName(cs)}`, kind: "greffe", important: true, body: [[`Le ministère public fait citer pour l'audience ${PR.civ(t.T)} ${t.T.prenom} ${t.T.nom}, témoin des faits (art. 435 et suivants).`]] });
        return;
      }
      case "absence": {
        if (cs.vars.vieAbsentFait != null) return;
        cs.vars.vieAbsenceAnnoncee = s.day;
        if (R.chance(s, 0.6)) api.ringOn(s.day, Math.max(s.min + 10, 17 * 60 + R.int(s, 0, 90)), { from: nomC, kind: "client", vmText: PR.vie.absentAudience(t) });
        return;
      }
      case "appelPq": {
        const A0 = cs.vars.vieAppel;
        if (!A0 || A0.etat !== "delai") return;
        const pr = CR.profil(t.parquet) || {};
        const p = Math.min(0.9, 0.55 + (pr.appel || 0.2));
        if (R.chance(s, p)) {
          A0.etat = "appel";
          let day = CR.rollForward(s.day + R.int(s, 35, 70));
          while (!CR.isBusinessDay(day)) day++;
          api.mail({ from: TJ.parquet, subject: `Appel du ministère public — ${CR.clientName(cs)}`, kind: "greffe", important: true, body: [[`Le procureur de la République a interjeté appel du jugement du ${D(A0.day)} (art. 497 CPP). L'affaire sera appelée devant la chambre des appels correctionnels de la ${TJ.ca.replace(/^Cour/, "cour")} le ${D(day)}.`]] });
          api.setActor("president", "pr_cour");
          api.hearing({ day, min: 13 * 60 + 30, title: `${TJ.ca} — appel du parquet`, where: `${TJ.ca}, chambre des appels correctionnels`, lieu: TJ.caLieu, script: "vie_appel", done: "_vieApresAppel", onMiss: "_vieAppelSansVous", duree: 60 });
          CR.PROC.stade(api, "appel", "Appel du parquet : la cour rejugera l'affaire.");
          api.trust(-3);
        } else {
          A0.etat = "definitif";
          const def = CR.caseDef(cs);
          const orig = def.on && def.on[A0.hook];
          api.log("Le parquet n'a pas fait appel : le jugement est définitif.", "good");
          cs.vars.vieAppel = Object.assign({}, A0, { fini: true });
          if (orig) { cs.vars.vieRenvoiJour = null; VIE.terminer(api, A0); }
        }
        return;
      }
      default: return;
    }
  };
  // Clôturer après le délai d'appel (le hook d'origine de l'audience, appelé avec la décision gardée)
  VIE.terminer = function (api, A0) {
    const { cs } = api;
    cs.vars.vieAppel = Object.assign({}, A0, { etat: "definitif", fini: true });
    CR.closeCase(api.s, cs, CR.PEN.issue(api, A0.res.decision || {}));
  };

  // ------------------------------------------------------------------ Les tâches des personnages
  VIE.taches = function (api, T, t, v, ment, docPreuve) {
    const { s, cs } = api;
    if (cs.status !== "active") return;
    const C = t[t.client] || t.A;
    const nomC = nomDe(C);
    const det = cs.proc && cs.proc.detention && cs.proc.detention.statut === "dp";
    if (ment && cs.flags.vieConfronte == null && CR.hasDoc(cs, docPreuve)) T({ id: "vie_confront", label: `Confronter ${C.prenom} à ${PR.vie.PIECE[ment.preuve] || "la pièce"}`, sub: "Sa version ne tient pas face à cette pièce. Mieux vaut l'apprendre avant l'audience.", kind: "meet", time: 0, where: det ? (cs.proc.detention.etab || "cabinet") : "cabinet", enabled: !VIE.silence(s, cs), why: VIE.silence(s, cs) ? "Le client ne répond plus." : "", run: () => ({ scene: "call", call: "vie_confront" }) });
    if (VIE.silence(s, cs)) T({ id: "vie_silence", label: `${C.prenom} ne répond plus`, sub: "Messagerie pleine. Une lettre simple, pour garder la trace de vos relances.", kind: "draft", time: 10, enabled: cs.vars.vieRelance !== s.day, run: () => { CR.spend(s, 10, "desk"); cs.vars.vieRelance = s.day; api.tl("Lettre de relance au client."); return null; } });
    if (v.fam && cs.vars.vieManque_famille != null && cs.vars.vieFamilleVue == null) T({ id: "vie_famille", label: `Rappeler ${v.fam.prenom} ${v.fam.nom} (${v.fam.rel} de ${C.prenom})`, sub: "La famille veut des nouvelles. Attention au secret professionnel.", kind: "call", time: 0, run: () => ({ scene: "call", call: "vie_famille" }) });
    if (v.presse && cs.vars.vieManque_presse != null && cs.vars.viePresseVu == null && !cs.vars.vieArticle) T({ id: "vie_presse", label: `Rappeler ${VIE.journaliste(t).journal}`, sub: "Un journaliste prépare un article. Rien n'oblige à répondre.", kind: "call", time: 0, run: () => ({ scene: "call", call: "vie_presse" }) });
    if (cs.vars.vieMenace != null && cs.vars.vieMenaceVue == null) T({ id: "vie_menace", label: `Rappeler ${C.prenom}, qui hésite à changer d'avocat`, sub: "Sans nouvelles de vous, le client partira.", kind: "call", time: 0, urgent: true, run: () => ({ scene: "call", call: "vie_menace" }) });
    if (cs.vars.vieSecond && cs.vars.vieSecondVu == null) T({ id: "vie_second", label: `Clarifier avec ${C.prenom} : un second avocat`, sub: `${(CR.acteur(cs.vars.vieSecond.id) || {}).nom || "Un confrère"} dit intervenir à vos côtés.`, kind: "call", time: 0, run: () => ({ scene: "call", call: "vie_second" }) });
    if (cs.vars.vieImpaye && cs.vars.vieRelancePaie == null) T({ id: "vie_paie", label: "Relancer pour la provision impayée", sub: `${CR.money(cs.vars.vieImpaye)} : le chèque est revenu impayé.`, kind: "call", time: 10, run: () => { CR.spend(s, 10, "call"); cs.vars.vieRelancePaie = s.day; api.log(`${nomC} : « ${PR.vie.impaye(t)} »`, "info"); return null; } });
    if (cs.vars.vieAbsenceAnnoncee === s.day && cs.vars.vieConvaincu == null) T({ id: "vie_venir", label: `Convaincre ${C.prenom} de venir à l'audience`, sub: "Un prévenu présent est entendu ; absent, il est jugé sans pouvoir s'expliquer.", kind: "call", time: 15, urgent: true, run: () => { CR.spend(s, 15, "call"); cs.vars.vieConvaincu = s.day; if (R.chance(s, 0.65)) { cs.vars.vieAbsentEvite = true; api.log(`${nomC} viendra à l'audience.`, "good"); } else api.log(`${nomC} ne viendra pas. Vous le représenterez.`, "bad"); return null; } });
    const P0 = cs.vars.vieProp;
    if (P0 && P0.etat === "ouverte" && s.day <= P0.limite) {
      if (!P0.nego) T({ id: "vie_nego", label: "Négocier la proposition du parquet", sub: P0.texte, kind: "call", time: 0, run: () => ({ scene: "call", call: "vie_parquet" }) });
      T({ id: "vie_accepte", label: P0.type === "compo" ? "Accepter la composition pénale" : "Accepter la CRPC", sub: P0.type === "compo" ? "Exécutée, elle éteint l'action publique ; elle figure au bulletin n° 1." : "Une audience d'homologation ; une condamnation, inscrite au casier.", kind: "admin", time: 15, run: () => { CR.spend(s, 15, "admin"); VIE.accepter(api, t); return null; } });
      T({ id: "vie_refuse", label: "Refuser : aller au procès", sub: "L'audience prévue est maintenue.", kind: "admin", time: 5, run: () => { CR.spend(s, 5, "admin"); P0.etat = "refusee"; api.log("Proposition du parquet refusée : l'affaire sera jugée.", "info"); return null; } });
    }
  };
  VIE.accepter = function (api, t) {
    const { s, cs } = api;
    const P0 = cs.vars.vieProp;
    P0.etat = "acceptee";
    for (const h of cs.hearings) if (!h.attended && !h.missed && !h.canceled && h.script !== "vie_crpc") h.canceled = true;
    if (P0.type === "compo") {
      api.log(`Composition pénale acceptée et validée : ${P0.texte}.`, "good");
      CR.closeCase(s, cs, { type: "alternative", detail: `composition pénale : ${P0.texte}` });
      return;
    }
    const TJ = M.lieuxDe(t).TJ;
    let day = CR.rollForward(s.day + R.int(s, 7, 16));
    while (!CR.isBusinessDay(day)) day++;
    api.hearing({ day, min: 11 * 60, title: "Homologation de la CRPC", where: `${TJ.tj}, président (CRPC)`, lieu: TJ.lieu, script: "vie_crpc", done: "_vieApresCRPC", onMiss: "_vieCRPCSansVous", duree: 30 });
    CR.PROC.stade(api, "jugement", `CRPC acceptée : audience d'homologation le ${D(day)}.`);
  };

  // ------------------------------------------------------------------ Les audiences : ce que les personnages y changent
  const indexApresDeclaration = (steps) => {
    for (let i = 0; i < steps.length; i++) {
      const x = steps[i];
      if (!x) continue;
      if (x.who === "client" && i > 1) return i + 1;
      if (x.if && Array.isArray(x.then) && x.then[0] && x.then[0].who === "client") return i + 1;
    }
    const j = steps.findIndex((x) => x && (x.plaidoirie || x.requis || x.card));
    return j > 0 ? j : Math.min(2, steps.length);
  };
  const sansClient = (list, G) => (list || []).map((x) => {
    if (!x || typeof x !== "object") return x;
    if (x.who === "client") return { who: "sys", t: `(${CR.cap(G.prevenu)} est absent${G.e} : sa chaise reste vide.)` };
    if (x.dernierMot) return { who: "president", t: `${CR.cap(G.prevenu)} n'étant pas là, ${G.il} n'aura pas la parole en dernier.` };
    const y = Object.assign({}, x);
    if (y.then) y.then = sansClient(y.then, G);
    if (y.else) y.else = sansClient(y.else, G);
    if (Array.isArray(y.choose)) y.choose = y.choose.map((o) => Object.assign({}, o, o.then ? { then: sansClient(o.then, G) } : {}));
    return y;
  });
  VIE.etapes = function (api, t, v, ment, steps, k) {
    const { s, cs } = api;
    const C = t[t.client] || t.A;
    const G = PR.gram(C);
    const defense = cs.camp !== "pc";
    const pres = (k === "proces" && cs.actors.president) || t.pres;
    let out = steps.slice();
    // la presse au fond de la salle
    if (cs.vars.vieArticle) out.splice(1, 0, { who: "sys", t: "(Deux journalistes ont pris place au premier rang. Le président les regarde un instant.)" });
    // le prévenu absent (convocation devant le tribunal) : représenté, ou renvoi demandé
    const absent = defense && v.absent === "audience" && cs.vars.vieAbsentFait == null && !cs.vars.vieAbsentEvite && k === "tc";
    if (absent) {
      const h = audienceDuJour(s, cs, k);
      return [out[0],
        { who: "president", t: `${G.Civ} ${C.nom} ? (Silence.) Maître, votre client${G.e} n'est pas là ?` },
        { choose: [
          { t: `« ${G.Client} m'a demandé de ${G.le} représenter. Je demande à être entendu en son absence (art. 411). »`, then: [{ do: (a) => { a.cs.vars.vieAbsentFait = a.s.day; return []; } }, { who: "president", t: "Le tribunal vous entendra. La décision sera contradictoire.", fx: { cred: -1 } }] },
          { t: `« ${G.Client} est empêché${G.e}. Je sollicite un renvoi. »`, then: [{ do: (a) => { a.cs.vars.vieAbsentFait = a.s.day; if (a.cs.vars.vieRenvoiDemande) return [{ who: "president", t: "Un renvoi a déjà été accordé. L'affaire est retenue." }]; a.cs.vars.vieRenvoiDemande = true; const nd = h ? VIE.renvoyer(a, h, R.int(a.s, 21, 42), "prévenu absent") : null; return [{ who: "president", t: nd ? `Pour cette fois. L'affaire est renvoyée au ${D(nd)} ; ${G.prevenu} devra comparaître.` : "Renvoi accordé." }, { end: true }]; } }] },
        ] },
      ].concat(sansClient(out.slice(1), G));
    }
    const ins = [];
    // la pièce opposée au prévenu qui n'a pas été confronté, ou l'aveu tardif
    if (ment && defense) {
      if (cs.flags.vieConfronte == null) ins.push({ who: "president", t: PR.vie.presidentConfronte(t, ment, pres) }, { who: "client", t: PR.vie.reponseAudience(t, ment, pres), fx: { cred: -3 }, signal: "mauvais" }, { do: (a) => { a.cs.vars.vieMensongeAudience = a.s.day; return []; } });
      else if (cs.vars.vieAveu != null) ins.push({ who: "client", t: PR.vie.aveuAudience(t, ment), fx: { cred: 2 }, signal: "bon" });
      else ins.push({ who: "president", t: PR.vie.presidentConfronte(t, ment, pres) }, { who: "client", t: PR.vie.reponseAudience(t, ment, pres), fx: { cred: cs.flags.vieRegle ? -1 : -2 } });
    }
    if (v.retracte && defense && t.mesure === "gav") ins.push({ who: "client", t: PR.vie.retractation(t) }, { who: "president", t: `Vous avez pourtant reconnu les faits en garde à vue${t.irr && t.irr.length ? "" : ", assisté" + G.e + " d'un avocat"}.`, fx: { cred: t.irr && t.irr.length ? 0 : -1 } });
    // le témoin cité au dernier moment
    if (cs.vars.vieTemoin != null && t.T) {
      const Gt = PR.gram(t.T);
      ins.push({ who: "parquet", t: `Le ministère public a fait citer ${Gt.civ} ${t.T.prenom} ${t.T.nom}, ${Gt.w("témoin", "témoin")} des faits.` },
        { who: "temoin", name: `${t.T.prenom} ${t.T.nom}`, t: PR.vie.temoin(t) },
        { choose: [
          { t: "« Une question au témoin : à quelle distance étiez-vous, et voyiez-vous bien ? »", then: [{ who: "temoin", name: `${t.T.prenom} ${t.T.nom}`, t: PR.vie.temoinReponse(t), fx: { cred: defense ? 2 : -1 }, signal: defense ? "bon" : "mauvais" }] },
          { t: "« La défense n'a eu connaissance de ce témoin qu'avant-hier. Je demande que ses déclarations soient appréciées avec prudence. »", then: [{ who: "president", t: "Le tribunal appréciera.", fx: { cred: 1 } }] },
          { t: "« Pas de question. »" },
        ] });
    }
    // le confrère d'en face
    if (v.adv && cs.vars.vieAdverse != null) {
      const line = PR.vie.adverse(t, v.adv, "audience");
      const a = CR.acteur(v.adv.id) || { nom: "Le confrère" };
      if (v.adv.style === "procedurier") ins.push({ who: "adverse", name: a.nom, t: line }, { choose: [
        { t: "« Ces conclusions et ces pièces m'arrivent à l'audience : je demande qu'elles soient écartées des débats, faute de contradictoire. »", then: [{ who: "president", t: "Le tribunal les écarte : elles n'ont pas été communiquées à temps.", fx: { cred: 2, memo: { id: v.adv.id, d: -1, r: "vous avez fait écarter ses pièces communiquées à la barre" } }, signal: "bon" }] },
        { t: "« Je demande un temps pour en prendre connaissance. »", then: [{ who: "president", t: "Suspension de dix minutes.", fx: { cred: 1 } }] },
        { t: "« Je ne m'y oppose pas. »", then: [{ who: "sys", t: "(Les pièces entrent aux débats sans que vous les ayez lues.)", fx: { cred: -1, memo: { id: v.adv.id, d: 1, r: "vous avez laissé entrer ses pièces sans les lire" } } }] },
      ] });
      else if (v.adv.style === "agressif") ins.push({ who: "adverse", name: a.nom, t: line }, { choose: [
        { t: "« Mon confrère réserve sans doute ces effets pour sa plaidoirie. Revenons au dossier. »", then: [{ who: "president", t: "Revenons au dossier, en effet.", fx: { cred: 2, memo: { id: v.adv.id, d: 1, r: "vous ne vous êtes pas laissé entraîner sur son terrain" } }, signal: "bon" }] },
        { t: "« C'est inadmissible ! »", then: [{ who: "president", t: "Maîtres, je vous en prie. Le tribunal n'est pas une arène.", fx: { cred: -1, memo: { id: v.adv.id, d: -1, r: "vous vous êtes emporté à la barre" } } }] },
        { t: "(Laisser passer.)" },
      ] });
      else if (line) ins.push({ who: v.adv.style === "absent" ? "sys" : "adverse", name: a.nom, t: line });
    }
    if (ins.length) { const i = indexApresDeclaration(out); out = out.slice(0, i).concat(ins, out.slice(i)); }
    return out;
  };
  // L'appel du parquet devant la cour : la cour confirme ou aggrave
  VIE.audienceAppel = function (api, t) {
    const { cs } = api;
    const A0 = cs.vars.vieAppel || {};
    const TJ = M.lieuxDe(t).TJ;
    const C = t[t.client] || t.A;
    const G = PR.gram(C);
    const dec = (A0.res && A0.res.decision) || {};
    const persos = ["G_attest", "G_attest_emploi", "G_heberg", "G_emploi", "G_indemn"].filter((f) => CR.hasFact(cs, f)).length;
    return { title: `${TJ.ca} — chambre des appels correctionnels`, sub: TJ.caSub, decor: { scene: "salle" }, steps: [
      { who: "huissier", t: "La cour !" },
      { who: "president", t: `Affaire ${C.prenom} ${C.nom}, sur l'appel du ministère public. Le tribunal a ${dec.coupable ? `prononcé : ${(dec.peine && dec.peine.texte ? dec.peine.texte : "une peine").replace(/^./, (c) => c.toLowerCase())}` : "relaxé le prévenu"}.` },
      { who: "parquet", t: dec.coupable ? "Le parquet fait appel d'une peine qui ne tient pas compte de la gravité des faits. Je demande à la cour de l'aggraver." : "La relaxe ne résiste pas à la lecture du dossier. Je demande à la cour d'infirmer et d'entrer en voie de condamnation." },
      { who: "president", t: "La parole est à la défense." },
      { choose: [
        { t: `« Le tribunal a statué en connaissance de cause : il a vu ${G.prevenu}, sa situation, ses garanties. Rien n'a changé, sinon que la peine est en cours d'exécution. Je demande la confirmation. »`, then: [{ do: (a) => { a.cs.vars.vieArgAppel = persos >= 2 ? 2 : 1; return []; } }] },
        { t: "« La cour pourrait aggraver ; je lui demande de ne pas le faire sans raison nouvelle : le parquet n'en apporte aucune. »", then: [{ do: (a) => { a.cs.vars.vieArgAppel = 1; return []; } }] },
        { t: "« Je m'en rapporte. »", then: [{ do: (a) => { a.cs.vars.vieArgAppel = 0; return []; } }] },
      ] },
      { who: "president", t: "La cour se retire pour délibérer." },
      { do: (a) => {
        const sc = (a.cs.vars.vieArgAppel || 0) + (a.cs.flags.prepClient ? 1 : 0) + (a.cs.trust > 60 ? 0.5 : 0);
        const confirme = sc >= 2 || (sc >= 1 && R.chance(a.s, 0.5));
        a.cs.vars.vieArret = confirme ? "confirme" : "infirme";
        const req = a.cs.vars.requis || {};
        const txt = confirme ? "La cour confirme le jugement en toutes ses dispositions." : `La cour infirme le jugement et ${dec.coupable ? "aggrave la peine" : "déclare le prévenu coupable"} : ${(CR.ACT.requisTexte(Object.assign({ ferme: 0, sursis: 0 }, req)) || "une peine plus lourde").replace(/^./, (c) => c.toLowerCase())}.`;
        a.cs.vars.vieArretTexte = txt;
        return [{ who: "president", t: txt }];
      } },
    ] };
  };
  VIE.apresAppel = function (api, t) {
    const { s, cs } = api;
    const A0 = cs.vars.vieAppel || {};
    const base = CR.PEN.issue(api, (A0.res && A0.res.decision) || {});
    if (cs.vars.vieArret === "confirme") CR.closeCase(s, cs, Object.assign({}, base, { detail: `${base.detail ? base.detail + " — " : ""}confirmé en appel` }));
    else CR.closeCase(s, cs, { type: "condamnation", detail: cs.vars.vieArretTexte || "peine aggravée en appel" });
  };
  VIE.audienceCRPC = function (api, t) {
    const { cs } = api;
    const P0 = cs.vars.vieProp || {};
    const C = t[t.client] || t.A;
    const G = PR.gram(C);
    return { title: "Homologation de la CRPC", sub: M.lieuxDe(t).TJ.tj, decor: { scene: "salle" }, steps: [
      { who: "president", t: `${G.Civ} ${C.nom}, vous reconnaissez les faits et vous acceptez la peine proposée par le procureur : ${P0.texte || "la peine proposée"} ?` },
      { who: "client", t: PR.voix(t, C, "prevenu").oral("Oui, je reconnais. J'accepte.") },
      { who: "president", t: "Votre avocat vous a assisté. La reconnaissance est sincère, la peine justifiée au regard des circonstances : j'homologue la proposition (art. 495-9)." },
    ] };
  };

  // ------------------------------------------------------------------ Débrief : ce que les personnages ont appris au joueur
  VIE.debrief = function (api, t, v, ment) {
    const { cs } = api;
    const out = [];
    if (ment) {
      if (cs.vars.vieMensongeAudience != null) out.push({ kind: "bad", text: `${t[t.client].prenom} mentait, et ${PR.vie.PIECE[ment.preuve] || "une pièce"} le montrait : vous l'avez découvert à l'audience, devant le tribunal.` });
      else if (cs.flags.vieConfronte != null) out.push({ kind: "good", text: `Vous avez confronté le client à ${PR.vie.PIECE[ment.preuve] || "la pièce"} avant l'audience${cs.vars.vieAveu != null ? " : il a fini par dire la vérité" : ""}.` });
    }
    if (cs.flags.vieSecretViole) out.push({ kind: "bad", text: "Vous avez parlé à la famille de ce que le client vous avait confié : le secret professionnel vaut aussi envers ceux qui paient." });
    else if (cs.flags.vieSecretTenu) out.push({ kind: "good", text: "Vous avez opposé le secret professionnel à la famille, tout en expliquant la procédure." });
    if (cs.vars.vieArticle && cs.vars.vieArticle.choix === "details") out.push({ kind: "bad", text: "Le contenu du dossier est sorti dans la presse par votre faute." });
    if (cs.vars.vieProp) out.push({ kind: "rule", text: cs.vars.vieProp.type === "compo" ? "La composition pénale (art. 41-2) : proposée par le procureur, validée par un juge, elle éteint l'action publique une fois exécutée." : "La CRPC (art. 495-7 et s.) : le prévenu reconnaît les faits, accepte la peine proposée ; l'avocat est obligatoire ; un juge homologue." });
    if (cs.vars.vieAppel && cs.vars.vieAppel.etat === "appel") out.push({ kind: "rule", text: `Le parquet peut faire appel d'une décision qu'il juge trop douce (art. 497) : la cour ${cs.vars.vieArret === "confirme" ? "a confirmé" : "a aggravé"}.` });
    if (cs.vars.vieAbsentFait != null) out.push({ kind: "rule", text: "Prévenu absent : l'avocat peut le représenter (art. 411) ; le jugement est contradictoire. Un renvoi n'est jamais de droit." });
    return out;
  };
  // ------------------------------------------------------------------ Jouer une affaire par son code, hors carrière
  // Une partie à part (mode « affaire », emplacement de sauvegarde « affaire ») : la carrière en cours n'est pas touchée,
  // l'historique des signatures non plus. La partie commence le jour et à l'heure encodés dans le code.
  VIE.apercu = function (code, camp) {
    const L = GEN2.lireCode(code);
    if (!L.ok) return L;
    let t;
    try { t = GEN2.tirerCode(L.c); } catch (e) { return { ok: false, msg: "Ce code ne désigne aucune affaire que le générateur sache produire." }; }
    const LZ = M.lieuxDe(t);
    const camps = GEN2.campsDe(t);
    return Object.assign({}, L, { t, camps, genreLib: GEN2.CODE_LIB[GEN2.CODE_GENRES[L.c.genre]], infraction: t.q.label, lieu: LZ.F.nom, tribunal: LZ.TJ.tj, difficulte: GEN2.difficulte(t), crime: t.q.nature === "crime", fam: CAT.FAMILLES[CAT.INF[t.inf].fam] });
  };
  CR.newAffaire = function (o) {
    const A = VIE.apercu(o.code);
    if (!A.ok) return A;
    const c = A.c;
    const camp = o.camp && A.camps.includes(o.camp) ? o.camp : A.camps[0];
    const s = CR.newGame({ prenom: o.prenom || "Camille", nom: o.nom || "Durand", cabinet: o.cabinet || `Cabinet ${o.nom || "Durand"}`, look: o.look, mode: "affaire" });
    s.pending = [];
    s.day = c.day;
    s.min = Math.max(c.genre === "gav" ? 0 : 8 * 60, Math.min(19 * 60, c.slot * 10));
    s.affaire = { code: A.c.code, camp, avert: A.avert || null };
    const p = GEN2.paramsCode(s, c, { camp: camp !== A.camps[0] ? camp : undefined });
    CR.GEN.build(p);
    const cs = CR.openCase(s, p.id);
    CR.runHook(s, cs, "arrive", {});
    CR.log(s, `Affaire jouée par son code : ${A.c.code}${camp === "pc" ? ", côté partie civile" : ", côté défense"}.`, "info", cs.id);
    if (A.avert) CR.toast(s, A.avert, "info");
    return { ok: true, s, cs };
  };
  VIE.affaireFinie = (s) => s && s.mode === "affaire" && s.order.length > 0 && s.order.every((id) => !s.cases[id] || s.cases[id].status === "closed");

  // les magistrats, procureurs et policiers des autres tribunaux existent dès le chargement (anciennes sauvegardes comprises)
  if (GEN2.creerActeurs) GEN2.creerActeurs();
})();
