/* La Permanence — acteurs autonomes : OPJ, parquet, juges, JLD, confrères adverses.
   Chacun a un profil (rigueur, sévérité, charge) qui pèse sur ses décisions. Les acteurs se trompent aussi :
   leurs erreurs sont inscrites dans les pièces, jamais annoncées. */
(function () {
  const CR = (window.CR = window.CR || {});
  const R = CR.R;
  const A = (CR.ACT = {});

  // Attribue un acteur d'un rôle donné à l'affaire (fixé par l'affaire, sinon tiré au sort)
  A.assign = function (api, role, slot) {
    const key = slot || role;
    const { s, cs } = api;
    if (cs.actors[key]) return CR.acteur(cs.actors[key]);
    const pool = CR.ACTEURS.filter((a) => a.role === role);
    const a = pool[Math.floor(CR.seeded(cs.id + key + s.seed)() * pool.length)];
    cs.actors[key] = a.id;
    return a;
  };
  A.profil = (api, key) => { const id = api.cs.actors[key]; const a = id && CR.acteur(id); return a ? CR.PROFILS[a.profil] : null; };

  // ------------------------------------------------------------------ Parquet : choix de la voie
  // options : [{ voie, poids, why }] ; le profil favorise les alternatives ou les poursuites
  A.parquetChoix = function (api, options) {
    const { s } = api;
    const pr = A.profil(api, "parquet") || CR.PROFILS.deborde;
    const w = options.map((o) => {
      let p = o.poids;
      if (o.voie === "alternative" || o.voie === "classement") p *= 0.6 + pr.alternative;
      if (o.voie === "ci" || o.voie === "information") p *= 1.4 - pr.alternative;
      return Math.max(0.01, p);
    });
    const tot = CR.sum(w);
    let x = R.next(s) * tot;
    for (let i = 0; i < options.length; i++) { x -= w[i]; if (x <= 0) return options[i]; }
    return options[options.length - 1];
  };
  // Réquisitions : la base de l'affaire, modulée par le profil du parquet
  A.requis = function (api, base) {
    const pr = A.profil(api, "parquet") || CR.PROFILS.deborde;
    const f = pr.requis || 1;
    const q = Object.assign({}, base);
    if (q.ferme) q.ferme = Math.round(q.ferme * f);
    if (q.max && q.ferme > q.max) q.ferme = q.max;
    if (q.sursis) q.sursis = Math.round(q.sursis * f);
    if (q.amende) q.amende = Math.round(q.amende * f / 50) * 50;
    return q;
  };
  A.requisTexte = function (q) {
    // phase 2 : les réquisitions criminelles (réclusion, perpétuité)
    if (q.perpetuite) return "La réclusion criminelle à perpétuité" + (q.complementaires && q.complementaires.length ? ", " + q.complementaires.join(", ") : "");
    if (q.reclusion && q.ferme >= 120) return `${CR.fmtMois(q.ferme)} de réclusion criminelle` + (q.complementaires && q.complementaires.length ? ", " + q.complementaires.join(", ") : "");
    const pn = CR.PROC.peineTexte({ ferme: q.ferme || 0, sursis: q.sursis || 0, sursisType: q.sursisType, amende: q.amende, complementaires: q.complementaires || [], mandatDepot: q.mandatDepot });
    return pn;
  };
  A.appelIncident = function (api) {
    const pr = A.profil(api, "parquet") || CR.PROFILS.deborde;
    return R.chance(api.s, pr.appel || 0.2);
  };

  // ------------------------------------------------------------------ JLD
  // ctx : { garanties (0-5), criteres (objectifs de l'art. 144 réellement établis, 0-3), gravite (0-1), debatDiffere }
  A.jld = function (api, ctx) {
    const { s } = api;
    const pr = A.profil(api, "jld") || CR.PROFILS.severe;
    let score = (ctx.gravite || 0.5) * 0.5 + (ctx.criteres || 0) * 0.15 - (ctx.garanties || 0) * 0.12 + (pr.severite - 0.5) * 0.3;
    if (ctx.debatDiffere) score -= 0.08;
    if (ctx.argument144) score -= 0.08;
    const noise = (R.next(s) - 0.5) * 0.1;
    const v = score + noise;
    const decision = v > 0.42 ? "dp" : v > 0.22 ? (ctx.garanties >= 2 ? "arse" : "cj") : "cj";
    return { decision, score: v };
  };

  // ------------------------------------------------------------------ OPJ
  A.opjRefuse = function (api, q) {
    const pr = A.profil(api, "opj") || CR.PROFILS.opj_formaliste;
    let p = pr.refuse;
    if (q && q.sensible) p += 0.25;
    if (q && q.anodine) p -= 0.2;
    return R.chance(api.s, CR.clamp(p, 0.02, 0.95));
  };

  // ------------------------------------------------------------------ Confrère adverse
  A.adverse = (api) => A.profil(api, "adverse") || CR.PROFILS.debutant;
  A.demandeRenvoi = (api) => R.chance(api.s, (A.adverse(api).renvoi || 0.2) * 0.8);

  // ------------------------------------------------------------------ Signaux à l'audience
  // Pas de jauge : des indices, que le joueur apprend à lire.
  const SIGNAUX = {
    bon: {
      formaliste: ["(La présidente annote le procès-verbal, puis lève les yeux vers vous.)", "(Le président vérifie la cote que vous citez et la souligne.)"],
      presse: ["(Le président hoche la tête et cesse de regarder l'horloge.)", "(Le président écrit une ligne, brièvement.)"],
      curieux: ["(La présidente prend des notes, longuement.)", "(La présidente fait signe à l'assesseure de regarder la pièce.)"],
      conciliant: ["(La présidente prend des notes.)", "(La présidente regarde le prévenu, puis le dossier.)"],
      severe: ["(Le président relit la pièce sans rien dire.)", "(Le président pose son stylo et écoute.)"],
    },
    mauvais: {
      formaliste: ["(La présidente soupire et referme le dossier.)", "(« Maître, je connais le dossier. »)"],
      presse: ["(Le président regarde l'horloge.)", "(« Concluez, maître. »)"],
      curieux: ["(La présidente fronce les sourcils.)", "(« Je ne vois pas le rapport, maître. »)"],
      conciliant: ["(La présidente attend, patiente, que vous en veniez au fait.)"],
      severe: ["(Le président tapote la table du bout de son stylo.)", "(« Venons-en aux faits. »)"],
    },
    neutre: {
      formaliste: ["(La présidente tourne une page.)"], presse: ["(Le greffier appelle déjà l'affaire suivante du regard.)"], curieux: ["(La présidente écoute, la tête légèrement penchée.)"],
      conciliant: ["(La présidente acquiesce poliment.)"], severe: ["(Le président ne réagit pas.)"],
    },
  };
  A.SIGNAUX = SIGNAUX;
  A.signal = function (api, kind, who) {
    const a = CR.acteur(api.cs.actors[who || "president"]);
    const prof = a ? a.profil : "formaliste";
    const list = (SIGNAUX[kind] && (SIGNAUX[kind][prof] || SIGNAUX[kind].formaliste)) || ["…"];
    let txt = list[Math.floor(R.next(api.s) * list.length)];
    if (a && a.nom.startsWith("M.")) txt = txt.replace("La présidente", "Le président").replace("l'assesseure", "l'assesseur");
    if (a && a.nom.startsWith("Mme")) txt = txt.replace("Le président", "La présidente");
    return txt;
  };
  // Titre de civilité pour s'adresser au magistrat
  A.titre = function (api, who) {
    const a = CR.acteur(api.cs.actors[who || "president"]);
    if (!a) return "Monsieur le président";
    const f = a.nom.startsWith("Mme");
    if (a.role === "president") return f ? "Madame la présidente" : "Monsieur le président";
    if (a.role === "ji") return f ? "Madame la juge" : "Monsieur le juge";
    if (a.role === "jld") return f ? "Madame la juge" : "Monsieur le juge";
    if (a.role === "parquet") return f ? "Madame la procureure" : "Monsieur le procureur";
    return a.nom;
  };
})();
