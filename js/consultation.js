// La Permanence — la consultation (CR.CONSULT) : le rendez-vous au cabinet avec le futur client, et les autres
// entretiens hors garde à vue (téléphone, dépôt, parloir, victime).
// Le moteur de la garde à vue (parole.js) compose une question en croisant un sujet, un angle et une forme : au cabinet,
// cela donnait des questions sans objet, des réponses sans rapport et des « je vous l'ai déjà dit ». Ici :
//   - une question est écrite en entier : on lit ce qu'on demande avant de le demander ;
//   - chaque question a sa réponse, et seulement la sienne ;
//   - une question posée ne se repose pas : rien n'est jamais « déjà dit » ;
//   - une réponse peut ouvrir des questions de suite (l'heure, le lieu, le déroulé, les raisons, les témoins), tirées du
//     souvenir des faits (recit.js) et de la fiche de la personne ;
//   - les questions sont rangées par thème, dans l'ordre où un avocat les aborde.
// Les déclarations de l'avocat (prendre le dossier, refuser, promettre, expliquer) ne sont pas des questions : elles
// restent des gestes à part. Tout est déterministe : rien n'est tiré au hasard ici.
(function () {
  "use strict";
  const CR = window.CR;
  const C = (CR.CONSULT = {});
  const segT = (x) => (typeof x === "string" ? x : (x && x.t) || "");
  const cap = (x) => (x ? x[0].toUpperCase() + x.slice(1) : x);

  // ------------------------------------------------------------------ Les thèmes
  C.THEMES = { procedure: "La procédure", faits: "Les faits", enquete: "L'enquête", preuves: "Les preuves", antecedents: "Les antécédents", situation: "La situation", prejudice: "Le préjudice", vecu: "L'état d'esprit", autres: "Autres points" };
  const PAR_ID = { o_quoi: "procedure", k_quand: "procedure", o_proc: "procedure", v_quoi: "faits", p_info: "faits", v_detail: "faits" };
  const PAR_FIN = [
    [/^(faits|version)$/, "faits"], [/^(convoc|suite|proc|juge|det|cj)$/, "procedure"], [/^(mesure|gav|heure)$/, "enquete"], [/^casier$/, "antecedents"],
    [/^(vie|logement|travail|attest|societe|pouvoir|deleg)$/, "situation"], [/^(enjeu|peur|depuis|cond)$/, "vecu"], [/^(prejudice|blesse)$/, "prejudice"], [/^temoin$/, "preuves"],
  ];
  // une question du catalogue de l'infraction : le thème se lit dans ses mots
  const PAR_MOTS = [
    [/témoin|vu ou entendu|caméra|images|messages?|gardé|trace|preuve|papiers|devis|contrat|capture|relevé/i, "preuves"],
    [/médecin|blessé|perdu|coûté|préjudice|frais|assur|rendu|récupéré/i, "prejudice"],
    [/en sécurité|peur|inquiète|compte le plus/i, "vecu"],
    [/héberg|où irez|logement|domicile|travaill/i, "situation"],
    [/seconde mesure|souffl|garde à vue|vos droits|policiers?|contrôle/i, "enquete"],
  ];
  C.themeDe = function (tp) {
    const id = String(tp.id);
    if (PAR_ID[id]) return PAR_ID[id];
    const fin = id.replace(/^[a-z]+_/, "");
    const r = PAR_FIN.find(([re]) => re.test(fin));
    if (r) return r[1];
    const m = PAR_MOTS.find(([re]) => re.test(tp.q || ""));
    return m ? m[1] : /^x\d*$/.test(fin) ? "faits" : "autres";
  };

  // une entrée de l'entretien est une question si elle demande une information, ou si elle interroge sans mettre fin à
  // l'entretien ; sinon c'est un geste : une déclaration de l'avocat, qui engage
  // (« Racontez-moi ce qui s'est passé. » est une question ; « Ne vous inquiétez pas, il ira en prison. » n'en est pas une)
  C.estGeste = (tp) => !!(tp.ends || tp.fx || (tp.unlock && tp.unlock.length) || tp.flag);
  C.estQuestion = (tp) => !!tp && !tp.ends && (!C.estGeste(tp) || /\?\s*$/.test(String(tp.q || "")));

  // ------------------------------------------------------------------ Ce qui ne se dit jamais au cabinet
  // une réponse ne renvoie pas à une réponse précédente : ces tournures tombent, la phrase qui les portait reste
  const RENVOI = /\s*(Je vous l'ai (déjà )?dit|Je l'ai déjà dit( cent fois| aux policiers)?|Comme je vous (l')?ai dit|Je vous ai déjà répondu, non \?|Je vous ai tout dit)\s*[.,!]?/gi;
  const net = (t) => {
    const brut = String(t || "");
    let x = brut.replace(RENVOI, "").replace(/\s{2,}/g, " ").trim().replace(/^[,;]\s*/, "");
    // la phrase qui suivait la tournure retirée reprend sa majuscule
    if (x !== brut.trim()) x = x.replace(/(^|[.!?…] )([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());
    return x;
  };
  C.RENVOI = /déjà dit|déjà répondu|Comme je vous (l')?ai dit|Je vous l'ai dit|Je vous ai tout dit/i;
  // deux phrases sont la même si elles ne diffèrent que par le registre (« je n'ai pas » et « j'ai pas ») ou la ponctuation
  const norme = (x) => segT(x).toLowerCase().replace(/\bn(e |')/g, "").replace(/[^a-zà-ÿ0-9]+/g, "");

  // Les réactions de caractère (repliques.js : le tempérament ; gen-parole.js : l'humeur) s'ajoutent aux réponses sans
  // regarder la question. Ici, une réaction ne se dit que là où elle a un sens : [la phrase, les thèmes qui l'admettent].
  const REACTIONS = [
    [/^Pourquoi vous me demandez ça \?$/, ["antecedents", "situation"]],
    [/^Ça sert à quoi, tout ça \?$/, ["antecedents", "situation"]],
    [/^Vous me croyez(, au moins|, vous)? \?$/, ["faits"]],
    [/^Vous êtes avec moi ou avec eux \?$/, ["faits", "enquete"]],
    [/^Ça reste entre nous, hein \?$/, ["faits", "antecedents"]],
    [/^Je vais aller en prison \?$/, ["faits", "antecedents", "procedure", "vecu"]],
    [/^Je vous raconte tout, comme ça vous savez\.$/, ["faits"]],
    [/^Attendez, je reprends depuis le début\.$/, []],
  ];
  const admise = (x, theme) => { const tx = segT(x).trim(); const r = REACTIONS.find(([re]) => re.test(tx)); return !r || r[1].includes(theme); };

  // ------------------------------------------------------------------ Les questions de suite
  // Sur les faits : le client a raconté (le cadre, le geste, la police) ; chaque question de suite va chercher une autre
  // partie de son souvenir. Une suite n'existe que si elle apporte une phrase qu'il n'a pas dite.
  function suitesFaits(K, parent, t, ailleurs) {
    const R = CR.RECIT, G2 = CR.GEN2;
    if (!R || !G2 || !t) return [];
    let N = null, E = null, mode = null;
    try { N = G2.recit(t); E = R.episodes(t, N, { scene: "cabinet" }); mode = R.mode(t, { scene: "cabinet" }); } catch (e) { return []; }
    if (!E) return [];
    // ce qu'il a dit en racontant, et ce que d'autres questions de l'entretien lui feront dire, ne revient pas dans une suite
    const dits = new Set(E.cadre.concat(E.geste, E.police).map(norme).concat(ailleurs || []));
    const neuf = (arr) => (arr || []).filter((x) => { const k = norme(x); if (!k || dits.has(k)) return false; dits.add(k); return true; });
    // celui qui dit n'avoir pas été là n'a ni heure, ni lieu, ni témoin à donner de plus
    const absent = mode.k === "ment" && mode.ment && mode.ment.k === "absent";
    const oral = (x) => { const o = CR.GEN2.PR.oral; return typeof x === "string" ? o(x, "sout") : Object.assign({}, x, { t: o(x.t, "sout") }); };
    const st = mode.stance;
    const defaut = /^Il y a (pas de pourquoi|rien à raconter de plus)|^Je vous ai dit l'essentiel|^Il y a pas grand-chose de plus/;
    const LISTE = [
      ["quand", "À quelle heure était-ce, précisément ?", absent ? [] : E.quand],
      ["ou", "Où était-ce, exactement ? Vous connaissez l'endroit ?", absent ? [] : E.ou],
      ["comment", "Reprenons dans le détail : comment cela s'est-il déroulé ?", (E.comment || []).filter((x) => !defaut.test(segT(x)))],
      ["pourquoi", st === "reconnait" ? "Pourquoi l'avez-vous fait ?" : "Comment expliquez-vous ce qui s'est passé ?", st === "nie" ? [] : (E.pourquoi || []).filter((x) => !defaut.test(segT(x)))],
      ["confirme", "Qui était présent ? Quelqu'un peut-il confirmer ce que vous dites ?", absent ? [] : E.confirme],
    ];
    const out = [];
    for (const [k, q, arr] of LISTE) {
      const a = neuf(arr).map(oral);
      if (a.length) out.push({ id: parent.id + ":" + k, theme: parent.theme, q, cout: 2, parent: parent.id, a });
    }
    return out;
  }
  // Sur la situation : ce qui se prouve (le travail) et qui peut en parler (le proche), d'après la fiche
  function suitesSituation(K, parent, t) {
    const PR = CR.GEN2 && CR.GEN2.PR, A = t && t.A;
    if (!PR || !A || !CR.MONDE) return [];
    const out = [];
    const situ = CR.MONDE.situ(A);
    const chezEmployeur = /travail|employeur|vestiaire|caisse|entreprise/.test(String((t.f && t.f.sc) || "")) || t.inf === "abus_confiance";
    if (["salarie", "independant"].includes(situ) && !chezEmployeur) out.push({ id: parent.id + ":justif", theme: parent.theme, q: "Votre travail, pouvez-vous en justifier ?", cout: 2, parent: parent.id, a: [situ === "salarie" ? "Oui. J'ai mon contrat, mes fiches de paie. Mon patron peut faire une attestation." : "Oui. Je suis à mon compte : j'ai mes factures et mes déclarations."] });
    if (A.proche) { const p = PR.proche(A), g = PR.gram({ g: p.g }); out.push({ id: parent.id + ":proche", theme: parent.theme, q: "Qui pourrait attester pour vous, ou venir à l'audience ?", cout: 2, parent: parent.id, a: [`${cap(p.ma)}. ${g.Il} me connaît mieux que personne, ${g.il} viendra.`] }); }
    return out;
  }

  // ------------------------------------------------------------------ Ouvrir une consultation
  // call.topics : { id, q, a (segments ou fonction), cost, tag, fx, flag, unlock, need, ends }
  // o : { api, fmt } ; rend K = { themes, Q, ordre, poses, dit, scene }
  C.ouvrir = function (s, cs, call, o) {
    o = o || {};
    const fmt = o.fmt || ((x) => x);
    const p = CR.GEN && CR.GEN.paramsOf ? CR.GEN.paramsOf(s, cs.id) || {} : {};
    const t = p.t || null;
    const K = { Q: {}, ordre: [], themes: [], poses: [], dit: new Set(), scene: call.label || "Entretien", t, repondues: 0, ignorees: 0 };
    const ajouter = (q) => { if (K.Q[q.id]) return; K.Q[q.id] = q; K.ordre.push(q.id); if (!K.themes.some((x) => x.id === q.theme)) K.themes.push({ id: q.theme, label: C.THEMES[q.theme] || C.THEMES.autres }); };
    // le client parle-t-il de lui-même ? (la famille, la permanence et le représentant d'une société parlent d'un autre)
    const luiMeme = t && t.client === "A" && !call.who;
    const reponse = (tp) => (typeof tp.a === "function" ? tp.a(o.api) : tp.a || []).map((x) => (typeof x === "string" ? fmt(x) : x && typeof x === "object" ? Object.assign({}, x, { t: fmt(x.t) }) : x)).filter((x) => segT(x));
    const toutes = (call.topics || []).filter(C.estQuestion).map((tp) => { const theme = C.themeDe(tp); return { tp, a: reponse(tp).filter((x) => admise(x, theme)) }; });
    for (const { tp, a } of toutes) {
      const q = { id: tp.id, theme: C.themeDe(tp), q: cap(fmt(tp.q)), cout: tp.cost || 3, tp, a, parent: null };
      ajouter(q);
      // les suites : sur les faits quand le client les a racontés lui-même, sur la situation quand il parle de lui
      if (luiMeme && q.theme === "faits" && a.some((x) => x && typeof x === "object" && x.recit)) for (const x of suitesFaits(K, q, t, [].concat(...toutes.filter((y) => y.tp !== tp).map((y) => y.a.map(norme))))) ajouter(x);
      if (luiMeme && q.theme === "situation" && /_vie$/.test(String(tp.id))) for (const x of suitesSituation(K, q, t)) ajouter(x);
    }
    return K;
  };
  C.posee = (K, id) => K.poses.some((x) => x.id === id);
  // les questions d'un thème, telles qu'on peut les poser : dispo = les entrées de l'entretien ouvertes à ce moment
  C.questions = function (K, theme, dispo) {
    return K.ordre.map((id) => K.Q[id]).filter((q) => q.theme === theme && (C.posee(K, q.id) || (q.parent ? C.posee(K, q.parent) : !dispo || dispo.has(q.id))));
  };
  C.restantes = (K, theme, dispo) => C.questions(K, theme, dispo).filter((q) => !C.posee(K, q.id)).length;

  // ------------------------------------------------------------------ Poser une question
  // rep : la réponse déjà obtenue (une question qui porte un effet passe par le geste de la scène) ; sinon celle de la question.
  // Rend { texte, lignes: [{ t, f }], min, client } ; client : une question que le client vous pose, à laquelle répondre ou non.
  C.poser = function (K, id, rep) {
    const q = K.Q[id];
    if (!q || C.posee(K, id)) return null;
    const lignes = [];
    for (const x of rep || q.a) {
      const tx = net(segT(x));
      if (!tx) continue;
      // une phrase ne se redit pas dans le même entretien (un détail déjà donné dans une autre réponse)
      const cle = norme(tx);
      if (tx.length > 14 && K.dit.has(cle)) continue;
      K.dit.add(cle);
      lignes.push({ t: tx, f: (x && typeof x === "object" && x.f) || null });
    }
    if (!lignes.length) lignes.push({ t: "(Un temps.) Je ne sais pas quoi vous répondre.", f: null });
    const client = (lignes.filter((l) => !l.f).map((l) => l.t).filter((x) => (/\?\s*»?$/.test(x) || /^Dites-moi que/.test(x)) && C.REPONSES.some(([re]) => re.test(x))).pop()) || null;
    const neuve = client && !K.poses.some((x) => x.client === client) ? client : null;
    K.poses.push({ id, texte: q.q, rep: lignes.map((l) => l.t), min: q.cout, client: neuve });
    return { texte: q.q, lignes, min: q.cout, client: neuve };
  };

  // ------------------------------------------------------------------ Les questions du client
  // Le client n'attend une réponse que s'il demande vraiment quelque chose ; chaque réponse répond à sa question.
  C.REPONSES = [
    [/prison|je risque|risque quoi/i, "Je ne vous promettrai pas ce que je ne sais pas encore. Je vous dirai ce que vous risquez quand j'aurai lu le dossier, pas avant."],
    [/me croyez/i, "Je ne suis pas là pour vous juger. Je suis là pour vous défendre, et pour cela j'ai besoin de tout savoir."],
    [/avec moi ou avec eux/i, "Avec vous. Je suis votre avocat : ce que vous me dites, personne d'autre ne le saura."],
    [/Ça sert à quoi/i, "À montrer au tribunal qui vous êtes. On ne juge pas de la même façon quelqu'un dont on connaît la vie."],
    [/^Dites-moi que/i, "Je ne peux pas vous le promettre. Je vous promets de faire tout ce qui peut être fait."],
    [/entre nous/i, "Tout ce que vous me dites ici est couvert par le secret professionnel. Rien ne sort de ce bureau."],
    [/Pourquoi vous me demandez|ça se voit/i, "Parce que le juge l'aura sous les yeux. Je dois le savoir avant lui, pas le découvrir à l'audience."],
    [/C'est normal, ça|Ça veut dire quoi/i, "Je vous l'explique dans un instant. D'abord, j'ai besoin de comprendre ce qui s'est passé."],
  ];
  C.repondreClient = function (K, q, oui) {
    if (!oui) { K.ignorees++; return { t: null, min: 0 }; }
    K.repondues++;
    return { t: (C.REPONSES.find(([re]) => re.test(q)) || [null, ""])[1], min: 2 };
  };

  // ------------------------------------------------------------------ Le corrigé (débrief : « ce qu'il fallait demander »)
  // les questions jamais posées dont la réponse portait un fait du dossier
  C.corriger = function (s, cs, K) {
    const def = CR.caseDef(cs) || {};
    const out = [];
    for (const id of K.ordre) {
      const q = K.Q[id];
      if (C.posee(K, id)) continue;
      const f = q.a.map((x) => x && typeof x === "object" && x.f).find(Boolean);
      if (!f) continue;
      out.push({ sujet: C.THEMES[q.theme] || "", question: q.q, fait: (def.facts && def.facts[f] && def.facts[f].label) || "" });
    }
    cs.vars.corrige = Object.assign({}, cs.vars.corrige || {}, { [K.scene]: out });
    return out;
  };
})();
