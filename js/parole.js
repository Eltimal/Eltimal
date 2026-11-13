// La Permanence — refonte du gameplay, lot 3 : la parole en garde à vue (CR.PAROLE)
// Le client est modélisé : il répond selon ce qu'il sait, ce qu'il cache, son humeur et la manière dont on l'interroge.
// La question se compose en trois gestes : un sujet, un angle, une forme. La plupart des combinaisons n'apprennent rien ;
// celles qui portent sur ce qui compte font parler le client. Rien n'est signalé : un fait se gagne en notant la phrase.
// Le conseil se donne sujet par sujet, pendant les trente minutes ; le client le suit plus ou moins à l'audition.
// L'audition est intégrale : des dizaines de questions, tirées de ce que l'enquêteur sait (les pièces de la procédure).
// Le procès-verbal relu est écrit depuis ce qui a été dit.
// Tout est déterministe : la graine de l'affaire et l'ordre des questions suffisent.
(function () {
  "use strict";
  const CR = window.CR;
  const P = (CR.PAROLE = {});
  const PR = () => CR.GEN2.PR;

  const fil = (graine) => {
    const f = CR.seeded(graine);
    return { next: f, int: (a, b) => a + Math.floor(f() * (b - a + 1)), ch: (p) => f() < p, pk: (a) => a[Math.floor(f() * a.length)] };
  };
  const segT = (x) => (typeof x === "string" ? x : (x && x.t) || "");
  const phrases = (t) => String(t).split(/(?<=[.!?…»])\s+(?=[A-ZÀÂÉÈÊÎÔÛÇ«(])/).filter(Boolean);
  const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

  // ------------------------------------------------------------------ Les gestes d'une question
  P.ANGLES = [["recit", "Ce qui s'est passé"], ["quand", "Quand"], ["ou", "Où"], ["comment", "Comment"], ["pourquoi", "Pourquoi"], ["confirme", "Qui peut le confirmer"]];
  P.FORMES = [["ouverte", "Ouverte"], ["fermee", "Fermée"], ["relance", "Relance"], ["confrontation", "Confrontation"]];
  P.DUREE = { ouverte: 3, fermee: 1, relance: 2, confrontation: 3 };
  P.LIMITE = 30; // minutes de l'entretien (art. 63-4)

  // Les sujets d'un entretien de garde à vue. key : angles qui ouvrent la réponse utile (le sujet du tirage, s'il existe).
  // nom : le sujet dans une question ; topic : l'entrée de l'entretien de l'affaire qui porte les faits.
  const SUJETS = [
    { id: "faits", label: "Les faits", nom: "ce qui s'est passé", topic: "g_faits", key: ["recit", "comment"] },
    { id: "droits", label: "Vos droits", nom: "la notification de vos droits", topic: "g_heure", key: ["quand"] },
    { id: "interpellation", label: "L'interpellation", nom: "votre interpellation", topic: null, key: ["quand", "ou", "comment"] },
    { id: "police", label: "Ce que vous avez dit", nom: "ce que vous avez déjà dit aux policiers", topic: null, key: ["recit"] },
    { id: "logement", label: "Le logement", nom: "votre logement", topic: "g_logement", key: ["ou", "confirme"] },
    { id: "travail", label: "Le travail", nom: "votre travail", topic: "g_travail", key: ["recit", "comment", "confirme"] },
    { id: "famille", label: "La famille", nom: "votre famille", topic: null, key: ["recit", "confirme"] },
    { id: "casier", label: "Le casier", nom: "vos antécédents judiciaires", topic: "g_casier", key: ["recit", "quand"] },
    { id: "victime", label: "La victime", nom: "la personne qui se plaint", topic: null, key: ["recit", "pourquoi"] },
    { id: "temoins", label: "Les témoins", nom: "les personnes présentes", topic: null, key: ["confirme", "recit"] },
    { id: "sante", label: "La santé", nom: "votre santé", topic: null, key: ["recit", "comment"] },
  ];
  // le sujet d'une entrée d'entretien, d'après son identifiant (entretiens des affaires générées), sinon d'après ses mots
  P.IDS = { c_faits: "faits", v_quoi: "faits", g_faits: "faits", c_casier: "casier", g_casier: "casier", c_vie: "logement", g_logement: "logement", g_travail: "travail", c_convoc: "convocation", c_mesure: "gardeavue", c_enjeu: "inquietude", v_suite: "procedure", v_prejudice: "prejudice", v_temoin: "temoins", v_blesse: "blessures", v_depuis: "depuis", g_heure: "droits", p_info: "faits" };
  // reconnaître le sujet d'une entrée d'entretien d'après sa question : [mots, sujet, intitulé, nom, angles clés]
  P.REGLES = [
    [/convocation/i, "convocation", "La convocation", "votre convocation", ["quand", "recit"]],
    [/garde à vue|comment s'est passée la mesure/i, "gardeavue", "La garde à vue", "la garde à vue", ["recit", "comment"]],
    [/droits/i, "droits", "Vos droits", "la notification de vos droits", ["quand"]],
    [/passé|racontez|vos mots|version/i, "faits", "Les faits", "ce qui s'est passé", ["recit", "comment"]],
    [/condamn|justice|casier/i, "casier", "Le casier", "vos antécédents judiciaires", ["recit", "quand"]],
    [/habitez|vivez|logement|parlez-moi un peu de vous/i, "logement", "Le logement", "votre logement", ["ou", "confirme", "recit"]],
    [/travail/i, "travail", "Le travail", "votre travail", ["recit", "comment", "confirme"]],
    [/coûté|préjudice|frais/i, "prejudice", "Le préjudice", "ce que les faits vous ont coûté", ["recit", "comment"]],
    [/blessé|blessure|médecin/i, "blessures", "Les blessures", "vos blessures", ["recit", "comment"]],
    [/témoin/i, "temoins", "Les témoins", "les personnes présentes", ["confirme", "recit"]],
    [/procédure|où en est/i, "procedure", "La procédure", "où en est la procédure", ["recit", "quand"]],
    [/dormir|inquiète|peur/i, "inquietude", "Ce qui vous inquiète", "ce qui vous inquiète", ["recit", "pourquoi"]],
    [/depuis/i, "depuis", "Depuis les faits", "comment vous allez depuis", ["recit", "comment"]],
  ];
  // les questions du catalogue de l'infraction (qA) deviennent des sujets, nommés d'après leurs mots
  const MOTS = [[/récupéré|votre bien|objet volé/i, "Le bien volé", "le bien volé"], [/message|capture|écrit/i, "Les messages", "les messages"], [/assurance|assureur/i, "L'assurance", "votre assurance"], [/plainte/i, "La plainte", "votre plainte"], [/bu|alcool|verre/i, "L'alcool", "ce que vous aviez bu"], [/provoqu|insult|cherch/i, "La provocation", "ce qui vous a provoqué"], [/arme|couteau|objet/i, "L'objet", "l'objet dont on parle"], [/argent|euros|compte|payé|prix/i, "L'argent", "l'argent"], [/téléphone|message|appel/i, "Le téléphone", "votre téléphone"], [/voiture|permis|conduis|volant|scooter/i, "Le véhicule", "le véhicule"], [/produit|cannabis|drogue|résine|cocaïne/i, "Les produits", "les produits retrouvés"], [/enfant|garde|pension/i, "Les enfants", "les enfants"]];

  // ------------------------------------------------------------------ Le client
  // M = { t, G, hum, reg, topics, sujets, confiance (cachée), dit[sujet] : segments déjà dits }
  P.client = function (s, cs, g) {
    const ctx = g && g.parole;
    if (!ctx || !ctx.t) return null;
    const t = ctx.t, A = t.A;
    const V = PR().voix(t, A, "garde");
    const topics = {};
    for (const tp of (g.entretien && g.entretien.topics) || []) topics[tp.id] = tp;
    const victime = t.client === "V" || (cs && cs.camp === "pc");
    const sujets = SUJETS.map((x) => Object.assign({}, x)).filter((x) => (!x.topic || topics[x.topic]) && !(victime && ["interpellation", "police", "victime", "droits"].includes(x.id)));
    if (victime) sujets.push({ id: "auteur", label: "L'auteur", nom: "la personne mise en cause", topic: null, key: ["recit", "pourquoi"] });
    const pris = new Set(sujets.map((x) => x.topic).filter(Boolean));
    for (const tp of Object.values(topics)) {
      if (pris.has(tp.id)) continue;
      // un entretien d'une autre scène (cabinet, dépôt, victime) : le sujet se reconnaît aux mots de la question
      const parId = P.IDS[tp.id] || P.IDS[String(tp.id).replace(/^[a-z]+_/, "")];
      const regle = parId ? P.REGLES.find((x) => x[1] === parId) || [null, parId, parId, parId, ["recit"]] : P.REGLES.find(([re]) => re.test(tp.q || ""));
      const id0 = regle ? regle[1] : null;
      const exist = id0 && sujets.find((x) => x.id === id0);
      if (exist && !exist.topic) { exist.topic = tp.id; pris.add(tp.id); continue; }
      if (regle && !exist) { const S0 = SUJETS.find((x) => x.id === id0); sujets.push(Object.assign({}, S0 || { id: id0, label: regle[2], nom: regle[3], key: regle[4] }, { topic: tp.id })); pris.add(tp.id); continue; }
      const m = MOTS.find(([re]) => re.test(tp.q));
      const n = sujets.filter((x) => /^Un autre point/.test(x.label)).length;
      sujets.push({ id: "x:" + tp.id, label: m && !sujets.some((x) => x.label === m[1]) ? m[1] : `Un autre point${n ? " (" + (n + 1) + ")" : ""}`, nom: m ? m[2] : "ce point", topic: tp.id, key: ["recit", "pourquoi", "comment"] });
      pris.add(tp.id);
    }
    const hum = V.hum || "calme";
    return {
      t, sig: t.sig || CR.GEN2.signature(t), A, G: V.G, hum, reg: V.reg, voix: V, topics, sujets, ctx,
      confiance: { mefiant: 30, colere: 38, anxieux: 50, abattu: 45, bavard: 60, calme: 55 }[hum] || 50,
      dit: {}, poses: [], questionsClient: [], repondues: 0, ignorees: 0,
      ment: t.vie && t.vie.ment && t.client === "A" ? t.vie.ment : null, avoue: false,
    };
  };
  P.sujet = (M, id) => M.sujets.find((x) => x.id === id) || null;

  // ------------------------------------------------------------------ La question composée
  const Q = {
    ouverte: { recit: (n) => `Parlez-moi ${de(n)}.`, quand: (n) => `Et ${n}, c'était à quel moment, exactement ?`, ou: (n) => `Et ${n}, où est-ce que ça se passait ?`, comment: (n) => `Comment ça s'est passé, ${n} ?`, pourquoi: (n) => `Et ${n}, comment l'expliquez-vous ?`, confirme: (n) => `Et ${n}, qui pourrait le confirmer ?` },
    fermee: { recit: (n) => `${cap(n)}, c'est bien ce qui est écrit dans la procédure ?`, quand: (n) => `${cap(n)}, c'était tout de suite, oui ou non ?`, ou: (n) => `${cap(n)}, c'était sur place ?`, comment: (n) => `${cap(n)}, ça s'est passé normalement ?`, pourquoi: (n) => `${cap(n)}, vous avez une raison ?`, confirme: (n) => `${cap(n)}, quelqu'un peut le dire ?` },
    relance: { recit: (n) => `Revenons sur ${n}. Vous disiez… ?`, quand: (n) => `Sur ${n} : vous êtes sûr de l'heure ?`, ou: (n) => `Sur ${n} : où, précisément ?`, comment: (n) => `Sur ${n} : et ensuite ?`, pourquoi: (n) => `Sur ${n} : pourquoi, vraiment ?`, confirme: (n) => `Sur ${n} : qui d'autre ?` },
  };
  const SPEC = { "faits|ouverte|quand": "À quelle heure ça s'est passé, à peu près ?", "faits|ouverte|ou": "Où étiez-vous, exactement, à ce moment-là ?", "faits|ouverte|pourquoi": "Pourquoi ça s'est passé comme ça, d'après vous ?", "faits|ouverte|confirme": "Quelqu'un peut-il confirmer votre version ?", "faits|fermee|recit": "Vous avez fait ce qu'on vous reproche, oui ou non ?", "faits|fermee|quand": "Vous vous rappelez l'heure ?", "faits|fermee|ou": "Vous étiez sur place, oui ou non ?", "faits|fermee|comment": "Vous avez eu un geste, oui ou non ?", "faits|fermee|pourquoi": "Vous aviez une raison ?", "faits|fermee|confirme": "Quelqu'un était avec vous ?", "faits|ouverte|recit": "Racontez-moi ce qui s'est passé, avec vos mots.", "faits|ouverte|comment": "Comment ça s'est passé, exactement ?", "droits|ouverte|quand": "À quel moment vous a-t-on notifié vos droits ? Vous vous rappelez l'heure ?", "droits|fermee|quand": "On vous a lu vos droits tout de suite, dès l'arrivée ?", "logement|ouverte|ou": "Où habitez-vous, et avec qui ?", "travail|ouverte|recit": "Vous travaillez ? Parlez-moi de votre travail.", "casier|ouverte|recit": "Avez-vous déjà été condamné ? Racontez-moi.", "casier|fermee|recit": "Vous avez déjà été condamné, oui ou non ?" };
  const de = (n) => ("de " + n).replace(/^de les /, "des ").replace(/^de le /, "du ").replace(/^de ([aeiouyéèê])/i, "d'$1");
  P.texteQuestion = function (M, q) {
    const S0 = P.sujet(M, q.sujet);
    if (!S0) return "";
    if (q.forme === "confrontation") return q.extrait ? `Pourtant, dans la procédure (${q.extrait.cote || "une pièce"}), on lit : « ${q.extrait.t.length > 160 ? q.extrait.t.slice(0, 157) + "…" : q.extrait.t} » Qu'en dites-vous ?` : "";
    // un sujet peut porter ses propres formulations (témoin d'une confrontation) : « forme|angle », ou l'angle seul pour l'ouverte
    if (S0.q) { const x = S0.q[q.forme + "|" + q.angle] || (q.forme === "ouverte" && S0.q[q.angle]); if (x) return x; }
    const k = `${q.sujet}|${q.forme}|${q.angle}`;
    if (SPEC[k]) return SPEC[k].replace("condamné", "condamné" + M.G.e);
    const tp = S0.topic && M.topics[S0.topic];
    if (tp && /^x:/.test(S0.id) && q.forme === "ouverte" && S0.key.includes(q.angle)) return CR.cap(tp.q);
    return Q[q.forme][q.angle](S0.nom);
  };
  // une question est-elle posable ? (relance : il faut que le sujet ait été abordé ; confrontation : il faut un extrait)
  P.possible = (M, q) => !!P.sujet(M, q.sujet) && (q.forme !== "relance" || !!M.dit[q.sujet]) && (q.forme !== "confrontation" || !!q.extrait);

  // ------------------------------------------------------------------ Les réponses
  const familier = (M, s) => (M.reg === "familier" ? s.replace(/\b([Jj])e n'/g, "$1'").replace(/\b(je|il|elle|on|ça|ils|elles|c') n(e |')/gi, (m, a) => a + (/'$/.test(a) ? "" : " ")) : s);
  const VAGUE = {
    mefiant: ["Pourquoi vous me demandez ça ?", "Je sais pas. Ça change quoi ?", "(Il hausse les épaules.) Rien de spécial.", "Je vous ai déjà répondu, non ?"],
    colere: ["J'en sais rien, moi ! Demandez-leur, à eux.", "Qu'est-ce que ça peut faire ?", "Je sais pas. Franchement, je sais pas."],
    anxieux: ["Euh… je sais plus. Attendez. Non, je sais plus.", "Je me rappelle pas bien. C'est grave ?", "Je… j'ai pas fait attention. Pardon."],
    abattu: ["(Un temps.) Je sais pas.", "Je me rappelle plus. Tout se mélange.", "…Je sais pas, maître."],
    bavard: ["Alors ça, c'est une bonne question. Je dirais… non, je sais pas, en fait.", "Attendez, je réfléchis… Non. Honnêtement, aucune idée."],
    calme: ["Je ne sais pas.", "Rien de particulier, je crois.", "Je ne m'en souviens pas."],
  };
  const DIGRESSIONS = ["Vous savez, ici, on n'a même pas d'horloge. On perd la notion du temps.", "Le policier, là, le grand, il m'a parlé mal. Ça, je l'oublie pas.", "J'ai pas mangé depuis ce matin. Ils m'ont donné un truc sous plastique.", "Ma mère, si elle apprend ça… elle va pas s'en remettre.", "Le pire, c'est la cellule. Ça sent l'urine, vous imaginez pas.", "Normalement à cette heure-là, je suis chez moi. C'est fou, quand même."];
  // la réponse d'un sujet sans entrée dans l'affaire : tirée de la fiche de la personne
  function libre(M, S0, angle, r) {
    const A = M.A, G = M.G, t = M.t, pk = r.pk;
    const prox = PR().proche(A);
    const vers = (m) => { const x = Math.round((((m % 1440) + 1440) % 1440) / 15) * 15; return `${Math.floor(x / 60) % 24} heures${x % 60 ? " " + (x % 60) : ""}`; };
    switch (S0.id) {
      case "faits": return angle === "quand" ? [t.d && t.d.h != null ? `Vers ${vers(t.d.h)}, je dirais. Je regardais pas l'heure.` : "Je sais plus le jour exact."] : angle === "ou" ? [t.rue ? `${cap(t.rue)}. Enfin, à côté.` : "Je sais plus exactement."] : angle === "confirme" ? [t.preuves && t.preuves.includes("temoin") ? "Il y avait des gens. Ils vous diront que c'est pas comme ça que ça s'est passé." : "Personne. J'étais " + (t.f && (t.f.agg || []).includes("reunion") ? "avec un ami, mais je donnerai pas son nom." : "seul" + G.e + ".")] : [phrases(N0(M))[0] || pk(VAGUE[M.hum] || VAGUE.calme)];
      case "famille": return angle === "confirme" ? [`${cap(prox.ma)}. Vous pouvez l'appeler, ${PR().gram({ g: prox.g }).il} répond toujours.`] : [A.enfants ? `J'ai ${PR().enfants(A.enfants) || "des enfants"}. C'est pour eux que je m'inquiète.` : "J'ai pas d'enfant.", `${cap(prox.ma)}, c'est la seule personne qui compte, en ce moment.`];
      case "sante": return [pk(["Ça va. J'ai mal au dos, à cause du banc.", "Je prends rien, pas de traitement.", "Je suis fatigué" + G.e + ", c'est tout."])];
      case "interpellation": return angle === "quand" ? [`Je sais plus l'heure. C'était ${t.flagrance ? "juste après" : "le matin, ils sont venus chez moi"}.`] : angle === "ou" ? [t.flagrance ? "Pas loin, dans la rue. Ils m'ont attrapé" + G.e + " d'un coup." : "Chez moi. Ils ont sonné, ils étaient trois."] : [pk(["Ils m'ont plaqué" + G.e + " contre le mur. Les menottes, serrées.", "Ça s'est passé vite. Ils m'ont mis dans la voiture, c'est tout.", "Ils étaient nerveux. Moi j'ai rien dit."])];
      case "police": return [M.t.stance === "reconnait" ? "J'ai dit que c'était moi. Dans la voiture, déjà." : M.t.stance === "minimise" ? "J'ai dit que c'était pas grave, que c'était un malentendu." : "J'ai rien dit. Juste que j'avais rien fait."];
      case "victime": return angle === "pourquoi" ? [pk(["Je sais pas ce qu'" + (t.V ? PR().gram(t.V).il : "il") + " a contre moi.", "Pour l'argent, sûrement. Les gens portent plainte pour l'argent."])] : [t.V ? (["voisinage", "travail", "couple", "conjoint"].some((k) => String(t.f && t.f.sc).includes(k)) ? `Je ${PR().gram(t.V).le} connais, oui. Ça fait longtemps que ça dure, entre nous.` : `Je ${PR().gram(t.V).le} connais pas. Jamais vu${PR().gram(t.V).e} avant.`) : "Il n'y a pas de victime, dans cette histoire."];
      case "temoins": return [t.preuves && t.preuves.includes("temoin") ? pk(["Il y avait du monde. Une femme a crié, je crois.", "Des gens regardaient, oui. Ils ont rien vu de ce qui s'est vraiment passé."]) : "Personne. Il y avait personne."];
      default: return [pk(VAGUE[M.hum] || VAGUE.calme)];
    }
  }
  const N0 = (M) => (M.ctx.N && M.ctx.N.version && M.ctx.N.version[M.t.stance]) || "";
  // répondre à une question composée. Rend { lignes: [{ t, f }], min, client: question du client ou null }
  P.repondre = function (M, q) {
    const S0 = P.sujet(M, q.sujet);
    const r = fil(M.sig + ":parole:" + M.poses.length + ":" + q.sujet + q.angle + q.forme);
    const tp = S0 && S0.topic ? M.topics[S0.topic] : null;
    const cle = S0 && S0.key.includes(q.angle);
    if (tp && cle && q.forme !== "confrontation") M.utilises = (M.utilises || new Set()).add(tp.id);
    const deja = M.dit[q.sujet] || [];
    let segs = [];
    const quests = [];
    const prendre = (arr) => { for (const x of arr) { const tx = segT(x); if (/\?\s*$/.test(tx) && !(x && x.f)) quests.push(tx); else segs.push(x); } };
    if (q.forme === "confrontation") {
      const ex = q.extrait, doc = String(ex.key || "").replace(/^gav:/, "");
      const preuve = M.ment && CR.GEN2.VIE && CR.GEN2.VIE.DOC ? CR.GEN2.VIE.DOC[M.ment.preuve] : null;
      if (q.sujet === "faits" && M.ment && preuve && doc === preuve && !M.avoue) {
        M.avoue = true;
        if (M.ment.issue === "aveu") { segs = [{ t: "(Un long silence. Il regarde ses mains.)" }, { t: "Bon. C'est vrai. Je vous ai pas dit la vérité, tout à l'heure. Je voulais pas que vous me lâchiez.", f: "G_vie_aveu" }]; M.confiance += 6; }
        else { segs = [{ t: "Ils écrivent ce qu'ils veulent, dans leurs papiers. Moi, je vous ai dit la vérité." }, { t: "Je maintiens. C'est tout.", f: "G_vie_maintient" }]; M.confiance -= 4; }
      } else {
        segs = [{ t: r.pk(["Ça, c'est ce qu'ils disent, eux.", "Je l'ai jamais dit comme ça.", "(Il relit dans sa tête.) Je vois pas le problème.", "C'est faux. Enfin… c'est pas exactement ça."]) }];
        M.confiance -= 6;
      }
    } else if (tp && cle && q.forme !== "relance") {
      const neufs = tp.a.filter((x) => !deja.includes(segT(x)));
      if (q.forme === "fermee") {
        // une question fermée n'obtient que le début ; un client méfiant s'en tient à oui ou non
        const f0 = neufs.find((x) => x && x.f) || neufs[0];
        if (M.hum === "mefiant" && r.ch(0.55)) segs = [{ t: r.pk(["Oui.", "Non.", "Si vous le dites.", "Ouais."]) }];
        else if (f0) segs = [typeof f0 === "string" ? f0 : Object.assign({}, f0, { t: phrases(segT(f0))[0] })];
        else segs = [{ t: r.pk(["Je vous l'ai dit.", "Oui. Comme je vous ai dit."]) }];
        M.confiance -= 2;
      } else { prendre(neufs.length ? neufs : [r.pk(["Je vous l'ai déjà dit.", "Comme je vous ai dit."])]); if (!segs.length) segs = [{ t: r.pk(["Je vous l'ai déjà dit.", "C'est tout."]) }]; }
    } else if (q.forme === "relance" && tp) {
      const neufs = tp.a.filter((x) => !deja.includes(segT(x)) && segT(x) !== "");
      if (neufs.length) prendre(neufs);
      if (neufs.length && !segs.length) segs = [{ t: r.pk(["Je vous ai tout dit.", "C'est tout, pour ça."]) }];
      else if (neufs.length) { /* dit */ }
      else if (q.sujet === "faits" && M.ment && !M.avoue) segs = [{ t: r.pk(["Je vous dis que c'est comme ça.", "Pourquoi vous me croyez pas ?", "C'est la vérité. Je vous jure."]) }];
      else segs = [{ t: r.pk(["Je vous ai tout dit.", "C'est tout. Il y a rien d'autre.", "Je sais pas quoi vous dire de plus."]) }];
      M.confiance += 1;
    } else {
      segs = libre(M, S0 || { id: "?" }, q.angle, r).map((t) => ({ t }));
      if (q.forme === "fermee") segs = [{ t: phrases(segs[0].t)[0] }];
    }
    // le tempérament : l'humeur colore l'entrée ; le bavard digresse
    if (M.hum === "bavard" && r.ch(0.4) && q.forme !== "fermee") segs.push({ t: r.pk(DIGRESSIONS) });
    if (M.hum === "anxieux" && r.ch(0.25) && !quests.length) quests.push(r.pk(["Je vais aller en prison ?", "Combien de temps je vais rester ici ?", "Ma famille sait que je suis là ?"]));
    const lignes = segs.map((x) => ({ t: familier(M, segT(x)), f: (x && x.f) || null })).filter((x) => x.t);
    // ce qui a été dit (texte d'origine, avant le registre) ne se redit pas
    for (const x of segs) (M.dit[q.sujet] = M.dit[q.sujet] || []).push(segT(x));
    const mots = lignes.reduce((n, l) => n + l.t.split(/\s+/).length, 0);
    const min = P.DUREE[q.forme] + (M.hum === "bavard" ? 1 : 0) + Math.floor(mots / 90);
    M.poses.push(Object.assign({}, q, { texte: P.texteQuestion(M, q), min, rep: lignes.map((l) => l.t) }));
    const client = quests.find((x) => !M.questionsClient.includes(x)) || null;
    if (client) M.questionsClient.push(client);
    return { lignes, min, client };
  };
  // le client pose sa question ; l'avocat répond (cela prend du temps et rassure) ou passe
  P.REPONSES_CLIENT = [
    [/prison/i, "Personne ne peut vous le promettre. Ce soir, le procureur décide : vous ressortez avec une convocation, ou vous êtes présenté au tribunal. La prison, ce n'est pas aujourd'hui que ça se joue."],
    [/combien de temps|rester ici|dormir ici/i, "Vingt-quatre heures au plus, sauf prolongation par le procureur. Le plus souvent, moins."],
    [/famille/i, "Vous avez le droit de faire prévenir un proche. Si ce n'est pas fait, je le demande à l'officier."],
    [/.*/, "Je comprends. On va y aller étape par étape ; je vous explique ce qui va se passer."],
  ];
  P.repondreClient = function (M, q, repondre) {
    if (repondre) { M.repondues++; M.confiance += 7; return { t: (P.REPONSES_CLIENT.find(([re]) => re.test(q)) || P.REPONSES_CLIENT[3])[1], min: 2 }; }
    M.ignorees++; M.confiance -= 5; return { t: null, min: 0 };
  };

  // ------------------------------------------------------------------ Le conseil, sujet par sujet
  // Les sujets de l'audition. L'identité se décline toujours (le droit de se taire vient après, art. 63-1, 3°).
  P.SUJETS_AUDITION = [
    ["personnalite", "Votre situation", "famille, logement, travail, ressources, santé"],
    ["antecedents", "Vos antécédents", "condamnations, autres procédures"],
    ["faits", "Votre version des faits", "ce qui s'est passé, selon vous"],
    ["details", "Les détails des faits", "les questions précises de l'enquêteur"],
    ["preuves", "Les éléments du dossier", "plainte, témoin, images, objets saisis"],
    ["interpellation", "L'interpellation", "la fuite, l'arrestation, ce que vous avez dit aux policiers"],
  ];
  P.CONSEILS = [["parler", "Répondre"], ["taire", "Se taire"]];
  // conseil : { sujet: "parler" | "taire" } ; chaque sujet expliqué prend une minute
  P.conseiller = (M, sujet, choix) => { M.conseil = M.conseil || {}; const nouveau = M.conseil[sujet] !== choix; M.conseil[sujet] = choix; return nouveau ? 1 : 0; };
  // ce que le client fera vraiment, sujet par sujet : il suit le conseil selon son humeur, la confiance et la pression
  P.suit = function (M, sujet, aveux) {
    const c = (M.conseil || {})[sujet] || null;
    const r = fil(M.sig + ":suit:" + sujet);
    const pente = M.t.stance === "reconnait" ? "parler" : sujet === "faits" && M.hum === "mefiant" && r.ch(0.4) ? "taire" : "parler";
    if (!c) return pente;
    let p = { calme: 0.88, mefiant: 0.9, anxieux: 0.7, abattu: 0.78, bavard: 0.55, colere: 0.68 }[M.hum] || 0.75;
    p += (M.confiance - 50) / 180;
    if (c === "taire") p -= (aveux || 0.3) * 0.25;
    return r.next() < CR.clamp(p, 0.15, 0.97) ? c : c === "taire" ? "parler" : "taire";
  };

  // ------------------------------------------------------------------ L'audition intégrale
  // ce que l'enquêteur sait : les pièces de la procédure ; il pose ses questions dans l'ordre d'une audition réelle
  P.audition = function (M, o) {
    const t = M.t, A = M.A, G = M.G, ctx = M.ctx, N = ctx.N || {};
    const r = fil(t.sig + ":audition");
    const pk = r.pk;
    const preuves = t.preuves || [];
    const vict = t.V ? PR().gram(t.V) : null;
    const Q = [];
    const q = (sujet, texte, rep, plus) => Q.push(Object.assign({ sujet, q: texte, rep }, plus || {}));
    const lieu = t.rue ? `${t.rue}` : "sur les lieux";
    const prox = PR().proche(A);
    // une formule par affaire, tirée de sa signature : deux auditions ne se ressemblent pas mot pour mot
    const V = (k, arr) => arr[CR.hash(M.sig + ":v:" + k) % arr.length];
    // personnalité
    q("identite", V("id", ["Déclinez vos nom, prénoms, date et lieu de naissance, filiation, adresse.", "Veuillez décliner votre identité complète : nom, prénoms, date et lieu de naissance, adresse.", "Pour le procès-verbal, déclinez votre identité, votre date et votre lieu de naissance, votre adresse."]), `${A.nom.toUpperCase()} ${A.prenom}, né${G.e} ${A.naissance || ""}. J'habite ${A.adresse || "chez " + prox.ma}.`.replace(/\s+\./, "."));
    q("personnalite", V("fam", ["Quelle est votre situation familiale ?", "Êtes-vous marié" + G.e + ", en couple, avez-vous des enfants ?", "Parlez-nous de votre situation de famille."]), A.enfants ? `J'ai ${PR().enfants(A.enfants) || "des enfants"}.` : "Je n'ai pas d'enfant.");
    q("personnalite", V("dem", ["Où et avec qui demeurez-vous ?", "Quelle est votre adresse, et avec qui y vivez-vous ?", "Où habitez-vous, et depuis quand ?"]), A.heberg ? `Chez ${prox.ma}, ${A.rue || ""}.`.replace(", .", ".") : "Je n'ai pas d'adresse fixe. Chez des amis.");
    q("personnalite", V("res", ["Quelle est votre profession, quelles sont vos ressources ?", "De quoi vivez-vous ? Quel est votre emploi ?", "Travaillez-vous ? Quels sont vos revenus mensuels ?"]), A.emploi ? `Je suis ${A.metier}. Je gagne environ ${CR.num(Math.round((A.revenu || 1500) / 100) * 100)} euros par mois.` : `Je ne travaille pas.${A.revenu ? ` Je touche environ ${CR.num(Math.round(A.revenu / 100) * 100)} euros.` : ""}`);
    q("personnalite", V("sante", ["Êtes-vous suivi" + G.e + " pour un problème de santé, prenez-vous un traitement ?", "Avez-vous des problèmes de santé, un traitement en cours ?", "Consommez-vous habituellement de l'alcool ou des produits stupéfiants ? Êtes-vous soigné" + G.e + " pour quelque chose ?"]), "Non.");
    q("antecedents", V("cond", ["Avez-vous déjà été condamné" + G.e + " ?", "Avez-vous déjà eu affaire à la justice ?", "Votre casier judiciaire porte-t-il des condamnations ?"]), A.casier ? (t.rec ? "Oui. Pour le même genre de chose." : "Une fois. Il y a longtemps.") : "Non, jamais.");
    q("antecedents", V("connu", ["Êtes-vous connu" + G.e + " des services de police pour d'autres faits ?", "Avez-vous déjà été entendu" + G.e + " par nos services ?", "Avez-vous déjà fait l'objet d'une garde à vue ?"]), A.casier ? "Je sais pas ce que vous avez dans vos fichiers." : "Non.");
    // les faits
    const version = (N.version && N.version[t.stance]) || "Je n'ai rien fait.";
    q("faits", V("intro", ["Vous êtes entendu" + G.e + " sur des faits commis " + (t.flagrance ? "ce jour" : "il y a quelques jours") + ". Qu'avez-vous à dire ?", "Expliquez-nous ce qui s'est passé.", "Donnez-nous votre version des faits qui vous sont reprochés.", "Nous vous écoutons sur les faits : que s'est-il passé ?"]), version, { cle: true });
    if (t.d && t.d.h != null) q("faits", V("ou", ["Où vous trouviez-vous au moment des faits, et que faisiez-vous ?", "Que faisiez-vous à l'heure des faits ?", "Où étiez-vous, à ce moment-là ?"]), t.stance === "nie" && t.vie && t.vie.ment && t.vie.ment.k === "absent" ? "J'étais pas là. J'étais chez moi." : t.rue ? `${cap(t.rue)}. J'étais là, oui.` : "J'étais là, oui.");
    if (vict) q("faits", `Connaissez-vous ${vict.civ} ${t.V.nom.toUpperCase()} ?`, libre(M, { id: "victime" }, "recit", r)[0]);
    q("faits", V("pq", ["Pourquoi les choses se sont-elles passées ainsi ?", "Comment en est-on arrivé là ?", "Qu'est-ce qui vous a poussé" + G.e + " à agir ainsi ?"]), t.stance === "reconnait" ? "Je sais pas. J'ai perdu les pédales." : phrases(version).slice(-1)[0] || "Je sais pas.");
    q("faits", V("rec", ["Reconnaissez-vous les faits qui vous sont reprochés ?", "Reconnaissez-vous les faits ?", "Admettez-vous ce qui vous est reproché ?"]), { reconnait: "Oui.", minimise: "En partie. Pas comme ils le disent.", nie: "Non." }[t.stance]);
    for (const a of N.audition || []) q("details", a.q, a.a.expliquer || a.a.partiel || "", { fq: a.fq || null, silence: a.a.silence, partiel: a.a.partiel });
    // ce que l'enquêteur a en main
    if (preuves.includes("plainte") && vict) q("preuves", `${vict.civ} ${t.V.nom.toUpperCase()} a déposé plainte contre vous. Que répondez-vous à ses déclarations ?`, { reconnait: "Ce qu'" + vict.il + " dit est vrai.", minimise: vict.Il + " exagère. Ça s'est pas passé comme ça.", nie: vict.Il + " ment." }[t.stance]);
    if (preuves.includes("temoin")) q("preuves", "Un témoin déclare vous avoir vu" + G.e + " commettre les faits. Comment l'expliquez-vous ?", { reconnait: "Il a bien vu.", minimise: "Il a vu une partie, pas tout.", nie: "Il se trompe de personne." }[t.stance]);
    if (preuves.includes("video")) q("preuves", "Les images de vidéoprotection montrent une personne portant vos vêtements. Est-ce vous ?", { reconnait: "Oui, c'est moi.", minimise: "C'est moi, mais on voit pas tout.", nie: "On voit pas de visage. C'est pas moi." }[t.stance]);
    if (preuves.includes("saisie")) q("preuves", "Comment expliquez-vous ce qui a été retrouvé sur vous ?", { reconnait: "C'est à moi.", minimise: "Je l'avais trouvé. Je savais pas.", nie: "On me l'a mis dans la poche. C'est pas à moi." }[t.stance]);
    if (preuves.includes("certificat") && vict) q("preuves", `Le médecin a constaté des blessures sur ${vict.civ} ${t.V.nom.toUpperCase()}. D'où viennent-elles ?`, { reconnait: "C'est moi. Je regrette.", minimise: "Pas de moi. Ou alors en tombant.", nie: "Je sais pas. Pas de moi." }[t.stance]);
    // l'interpellation
    if (t.flagrance) q("interpellation", "Pourquoi avez-vous quitté les lieux ?", { reconnait: "J'ai paniqué.", minimise: "Je voulais pas d'histoires.", nie: "Je suis pas parti, je rentrais chez moi." }[t.stance]);
    q("interpellation", V("interp", ["Comment s'est passée votre interpellation ? Avez-vous des observations ?", "Avez-vous des observations sur les conditions de votre interpellation ?", "Votre interpellation s'est-elle passée sans incident ?"]), pk(["Ça s'est passé. Les menottes étaient serrées.", "Rien à dire.", "Ils m'ont un peu bousculé" + G.e + ". C'est tout."]));
    if (/ivresse|alcool/.test(JSON.stringify((t.f && t.f.agg) || [])) || ["alcool", "stups_volant"].includes(t.inf)) q("details", "Aviez-vous consommé de l'alcool ou des stupéfiants ?", t.stance === "reconnait" ? "Oui, j'avais bu." : "Un verre, pas plus.");
    for (const x of (N.qA || []).slice(0, 3)) if (x && x.q) q("details", CR.cap(x.q.replace(/^(Vous|Tu) /, "Vous ")), segT((x.a || [])[0]) || "Je sais pas.");
    q("faits", V("apres", ["Qu'avez-vous fait juste après les faits ?", "Et ensuite, qu'avez-vous fait ?", "Où êtes-vous allé" + G.e + " après ?"]), t.flagrance ? (t.stance === "reconnait" ? "Je suis parti. J'ai eu peur." : "Je rentrais chez moi. C'est là qu'ils m'ont arrêté" + G.e + ".") : "Rien de spécial. J'ai continué ma vie normalement.");
    q("personnalite", V("tel", ["Avez-vous un téléphone portable ? Quel est votre numéro ?", "Quel est votre numéro de téléphone ?", "Possédez-vous un téléphone ? Lequel, à quel numéro ?"]), A.tel ? `Oui. Le ${A.tel}.` : "Oui. Ils l'ont pris, il est dans la fouille.");
    q("interpellation", V("repos", ["Avez-vous pu vous alimenter et vous reposer depuis le début de la mesure ?", "Vous a-t-on proposé à manger, avez-vous pu dormir ?", "Comment s'est passée la mesure jusqu'ici : repas, repos ?"]), pk(["On m'a donné un plat. J'ai pas dormi.", "Oui. Enfin, sur le banc.", "J'ai pas faim."]));
    q("interpellation", V("sign", ["Acceptez-vous de vous soumettre aux relevés signalétiques : photographies, empreintes ?", "Vous serez photographié" + G.e + " et vos empreintes relevées. Vous ne vous y opposez pas ?", "Acceptez-vous la prise de vos empreintes et de photographies ?"]), "Oui.");
    q("antecedents", V("autre", ["Faites-vous l'objet d'une autre procédure, d'un contrôle judiciaire, d'un sursis en cours ?", "Êtes-vous sous contrôle judiciaire ou sous le coup d'un sursis ?", "Une autre affaire est-elle en cours vous concernant ?"]), A.casier && t.rec ? "Un sursis, oui." : "Non.");
    q("fin", V("fin", ["Avez-vous quelque chose à ajouter ?", "Voulez-vous ajouter quelque chose ?", "Souhaitez-vous faire une dernière déclaration ?"]), { reconnait: "Je regrette. Je voudrais m'excuser.", minimise: "Je regrette que ça ait dégénéré.", nie: "Non. J'ai rien fait." }[t.stance]);
    return Q;
  };
  // déroule l'audition : la réponse de chaque question suit ce que le client fait du conseil
  const SILENCES = ["Je ne souhaite pas répondre.", "Sur les conseils de mon avocat, je ne réponds pas.", "Je garde le silence.", "Je n'ai rien à déclarer."];
  P.derouler = function (M, aveux, pressant) {
    const Q = P.audition(M);
    const r = fil(M.sig + ":deroule");
    const suivi = {};
    for (const [k] of P.SUJETS_AUDITION) suivi[k] = P.suit(M, k, aveux);
    const out = [];
    for (const x of Q) {
      const g = ["identite", "fin"].includes(x.sujet) ? "parler" : suivi[x.sujet];
      let a = x.rep;
      if (g === "taire") a = x.silence && x.sujet === "details" ? x.silence : r.pk(SILENCES);
      out.push({ sujet: x.sujet, q: x.q, a: familier(M, a), fq: x.fq || null, silence: g === "taire" });
      // l'enquêteur qui pousse revient à la charge sur les faits ; le client craque parfois
      if (g === "taire" && pressant && x.sujet === "faits" && x.cle) {
        out.push({ sujet: "faits", q: "Votre silence ne vous aide pas, vous savez. Le magistrat lira ce procès-verbal. Vous ne voulez pas donner votre version ?", a: "", relance: true });
        if (r.next() < aveux * 0.6) { out[out.length - 1].a = familier(M, x.rep); out[out.length - 1].cede = true; suivi.faits = "parler"; }
        else out[out.length - 1].a = r.pk(SILENCES);
      }
    }
    // ce que le client a fait, résumé pour la suite de l'affaire (orientation du parquet)
    const f = suivi.faits === "taire" && !out.some((x) => x.cede), d = suivi.details === "taire", p = suivi.preuves === "taire";
    const conseilGav = f && d && p ? "silence" : !f && !d && !p ? "expliquer" : "partiel";
    return { lignes: out, suivi, conseilGav };
  };
  // le procès-verbal relu : les déclarations telles qu'écrites, avec l'erreur de retranscription du tirage
  P.relecture = function (M, aud) {
    const segs = [{ t: "La personne déclare :" }];
    let fautif = M.t.erreurPV;
    for (const l of aud.lignes) {
      if (l.sujet === "identite" || !l.a) continue;
      const x = { t: `Question : ${l.q} Réponse : ${l.a}` };
      if (fautif && l.sujet === "faits" && !l.silence) { fautif = false; l.erreur = true; l.fausse = `${l.a.replace(/\.$/, "")}, je savais ce que je faisais.`; segs.push({ t: `Question : ${l.q} Réponse : ${l.a.replace(/\.$/, "")}, je savais ce que je faisais.`, erreur: true, correct: `Réponse : ${l.a}` }); continue; }
      segs.push(x);
    }
    return { segs };
  };

  // ------------------------------------------------------------------ Le corrigé de l'entretien (lot 6, débrief)
  // les sujets dont la bonne question aurait livré un fait, jamais ouverts ; gardé dans cs.vars.corrige[scène]
  P.corriger = function (s, cs, M, scene) {
    const def = CR.caseDef(cs) || {};
    const out = [];
    for (const S0 of M.sujets) {
      if (!S0.topic || (M.utilises && M.utilises.has(S0.topic))) continue;
      const tp = M.topics[S0.topic];
      const f = tp && (tp.a || []).map((x) => x && x.f).find(Boolean);
      if (!f) continue;
      const lib = (def.facts && def.facts[f] && def.facts[f].label) || "";
      out.push({ sujet: S0.label, angle: (P.ANGLES.find((x) => x[0] === S0.key[0]) || [null, ""])[1], fait: lib });
    }
    cs.vars.corrige = Object.assign({}, cs.vars.corrige || {}, { [scene]: out });
  };
  // ------------------------------------------------------------------ Le procès-verbal d'audition du dossier (lot 3, A3)
  // La pièce versée au dossier reprend l'audition jouée, mot pour mot ; une erreur de retranscription non rectifiée
  // à la relecture y reste. L'en-tête, l'identité, la présence de l'avocat et la clôture de la pièce d'origine sont gardés.
  P.pvAudition = function (s, cs, doc) {
    const L = cs.vars.auditionGav;
    if (!L || !L.length || !doc || !doc.paras) return doc;
    const st = doc.pstyle || [];
    const i0 = st.indexOf("titre");
    let i1 = -1; for (let i = st.length - 1; i >= 0; i--) if (st[i] === "r") { i1 = i; break; }
    const tete = i0 > 0 ? doc.paras.slice(0, i0) : [], tSt = i0 > 0 ? st.slice(0, i0) : [];
    const pied = i1 >= 0 ? doc.paras.slice(i1 + 1) : doc.paras.slice(-1), pSt = i1 >= 0 ? st.slice(i1 + 1) : ["mention"];
    // les faits que portait la pièce d'origine (aveu…) passent sur la première réponse aux faits qui n'est pas un silence
    const faits = []; for (let i = i0; i >= 0 && i <= i1; i++) for (const g of doc.paras[i] || []) if (g && typeof g === "object" && g.f) faits.push(g.f);
    const corps = [], cSt = [];
    let titreFaits = false, posee = false;
    corps.push(["SUR LA PERSONNALITÉ"]); cSt.push("titre");
    for (const l of L) {
      if (l.sujet === "identite") continue;
      if (!titreFaits && !["personnalite", "antecedents"].includes(l.sujet)) { corps.push(["SUR LES FAITS"]); cSt.push("titre"); titreFaits = true; }
      corps.push([`Question : ${l.q}`]); cSt.push("q");
      if (!l.a) { corps.push(["Réponse : (La personne ne répond pas.)"]); cSt.push("r"); continue; }
      const txt = `Réponse : ${l.erreur && !cs.flags.pvRectifie ? l.fausse || l.a : l.a}`;
      const f = !posee && titreFaits && !l.silence && faits.length && l.sujet === "faits" && !/^(Non|Je n'ai rien)/.test(l.a) ? faits.shift() : null;
      if (f) posee = true;
      corps.push([f ? { t: txt, f } : txt]); cSt.push("r");
    }
    // les questions de l'avocat à l'issue de l'audition (art. 63-4-3) et leurs refus
    const QA = cs.vars.questionsAvocat || [];
    if (QA.length) for (const x of QA) { corps.push([x.refus ? `L'avocat pose la question suivante : « ${x.q} » L'officier de police judiciaire s'y oppose, la question étant de nature à nuire au bon déroulement de l'enquête.` : `Question de l'avocat : ${x.q} Réponse : ${x.a}`]); cSt.push("p"); }
    const paras = tete.concat(corps, QA.length ? pied.filter((p, k) => !(pSt[k] === "p" && /question à poser|demande que soit précis/.test(JSON.stringify(p)))) : pied);
    const pstyle = tSt.concat(cSt, QA.length ? pSt.filter((x, k) => !(x === "p" && /question à poser|demande que soit précis/.test(JSON.stringify(pied[k])))) : pSt);
    const mots = paras.reduce((n, p) => n + p.map((g) => (typeof g === "string" ? g : g.t || "")).join(" ").split(/\s+/).length, 0);
    return Object.assign({}, doc, { paras, pstyle, mots, feuillets: Math.max(1, Math.ceil(mots / 350)) });
  };
  if (CR.renderDoc && !CR.renderDoc.parole) {
    const r0 = CR.renderDoc;
    CR.renderDoc = function (s, cs, doc) {
      const d = r0(s, cs, doc);
      return doc && doc.key === "pv_audition" && cs && cs.vars && cs.vars.auditionGav ? P.pvAudition(s, cs, d) : d;
    };
    CR.renderDoc.parole = true;
  }

  // ------------------------------------------------------------------ Quand la refonte joue la scène
  // Une affaire générée qui porte son tirage (g.parole) et que la simulation prend en charge ; le mode assisté garde les listes.
  // le jeu sans guidage (refonte) ; le mode assisté (et le mode liste des parties automatiques) garde listes et signaux
  CR.libre = (s) => !!(s && s.settings && s.settings.parole !== "assiste" && (CR.saisieMode ? CR.saisieMode(s) !== "liste" : true));
  P.actif = (s, g) => !!(g && g.parole && g.parole.t && CR.SIM && CR.SIM.supporte(g.parole.t) && CR.libre(s));
})();
