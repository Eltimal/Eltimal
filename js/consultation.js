// La Permanence — la consultation (CR.CONSULT) : le rendez-vous au cabinet avec le futur client, et les autres
// entretiens hors garde à vue (téléphone, dépôt, parloir, victime).
// Le moteur de la garde à vue (parole.js) compose une question en croisant un sujet, un angle et une forme : au cabinet,
// cela donnait des questions sans objet, des réponses sans rapport et des « je vous l'ai déjà dit ». Ici :
//   - une question est écrite en entier : on lit ce qu'on demande avant de le demander ;
//   - chaque question a sa réponse, et seulement la sienne ;
//   - une question posée ne se repose pas : rien n'est jamais « déjà dit » ;
//   - une réponse peut ouvrir des questions de suite (l'heure, le lieu, le déroulé, les raisons, les témoins), tirées du
//     souvenir des faits (recit.js) et de la fiche de la personne ;
//   - les questions sont rangées par thème, dans l'ordre où un avocat les aborde ;
//   - une question ne se propose que si la discussion l'a ouverte : la garde à vue quand le client en a parlé, les
//     preuves et les précisions quand il a raconté les faits ; ce qu'il nie ne lui est pas demandé comme acquis.
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
    // une phrase commence par une majuscule (« Du sursis. huit mois. » : un nombre mis en lettres après coup)
    return x.replace(/(?<!\bM)(?<!\bart)(?<!etc)(?<!\.)([.!?] )([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());
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
    [/^Vous voulez vraiment savoir \?$/, ["faits"]],
  ];
  // « Pardon, je parle trop. » ne suit qu'une réponse longue ; « Oui. » n'ouvre que la réponse à une question fermée
  const TROP = /^(Pardon, je parle trop\.|Enfin, bref\. Je m'égare\.|Excusez-moi, je parle trop\. On me le dit souvent\.|Je ne sais pas si c'est important, mais je vous le dis quand même\.)$/;
  const OUI = /^(Oui\.|Oui, oui\.|Bien sûr\.)$/;
  const FERMEE = /(^|[.:] )(Avez|Aviez|Êtes|Étiez|Est-ce|A-t-|Y a-t-|Vous |Il |Elle |Ils |Elles |Quelqu'un|On |Les voisins|Ça )[^.?]*\?\s*$/;
  const admise = (x, theme, i, arr, question) => {
    const tx = segT(x).trim();
    if (TROP.test(tx)) return arr.length >= 5;
    if (OUI.test(tx) && i === 0) return FERMEE.test(question || "");
    const r = REACTIONS.find(([re]) => re.test(tx));
    if (!r) return true;
    // une seule réaction par réponse : la première
    if (arr.slice(0, i).some((y) => REACTIONS.some(([re]) => re.test(segT(y).trim())))) return false;
    return r[1].includes(theme);
  };

  // les questions du catalogue qui tiennent les faits pour acquis (« Pourquoi avez-vous fait ça ? », « Il vous a provoqué ? »)
  const SUPPOSE = /^Pourquoi (avez-vous fait|autant|avoir|le contrôle)|sérieusement|dit d'arrêter|provoqu/i;
  const INQUIET = /inquiète|peur|compte le plus|empêche de dormir/i;

  // ------------------------------------------------------------------ Les questions de suite
  // Sur les faits : le client a raconté (le cadre, le geste, la police) ; chaque question de suite va chercher une autre
  // partie de son souvenir. Une suite n'existe que si elle apporte une phrase qu'il n'a pas dite.
  // la version que le client raconte dans cet entretien : après une rétractation, celle de celui qui nie (recit.js)
  C.version = function (t, a) {
    const R = CR.RECIT;
    if (!R || !t) return null;
    const scene = (a || []).some((x) => x && typeof x === "object" && x.recit === "retracte") ? "cabinet" : "gav";
    try { return { scene, mode: R.mode(t, { scene }) }; } catch (e) { return null; }
  };
  function suitesFaits(K, parent, t, ailleurs, ver) {
    const R = CR.RECIT, G2 = CR.GEN2;
    if (!R || !G2 || !t || !ver) return [];
    let N = null, E = null; const mode = ver.mode;
    try { N = G2.recit(t); E = R.episodes(t, N, { scene: ver.scene }); } catch (e) { return []; }
    if (!E) return [];
    // ce qu'il a dit en racontant, et ce que d'autres questions de l'entretien lui feront dire, ne revient pas dans une suite
    const dits = new Set(E.cadre.concat(E.geste, E.police).map(norme).concat(ailleurs || []));
    const neuf = (arr) => (arr || []).filter((x) => { const k = norme(x); if (!k || dits.has(k)) return false; dits.add(k); return true; });
    // celui qui dit n'avoir pas été là n'a ni heure, ni lieu, ni témoin à donner de plus
    const absent = mode.k === "ment" && mode.ment && mode.ment.k === "absent";
    const oral = (x) => { const o = CR.GEN2.PR.oral; return typeof x === "string" ? o(x, "sout") : Object.assign({}, x, { t: o(x.t, "sout") }); };
    const st = mode.stance;
    // une suite n'existe que si le client a quelque chose à y répondre : les phrases d'attente n'en font pas une
    const defaut = /^Il y a (pas de pourquoi|rien à raconter de plus)|^Je vous ai dit l'essentiel|^Il y a pas grand-chose de plus|^Ça a duré quelques secondes|^Tout est allé très vite|^Je sais pas\. C'est parti tout seul|^J'ai pas pensé que c'était si grave|^J'ai pas réfléchi\. Sur le moment|^J'étais pas bien, à ce moment-là/;
    // l'heure des faits, pas la suite de l'enquête (déjà racontée) ; un lieu, pas « par téléphone » ou « à distance »
    const quand = (E.quand || []).filter((x, i) => i === 0 || /arrêté|déjà là|arrivée/.test(segT(x)));
    // chez lui, chez elle, chez eux : il l'a dit en racontant, et il connaît l'endroit
    const chez = /^chez /i.test(segT((E.ou || [])[0]));
    // le lieu : il l'a donné en racontant ; la suite ne vaut que s'il en dit davantage (c'est près de chez lui, où on l'a arrêté)
    const ouNeuf = (E.ou || []).slice(1).filter((x) => !/^Je connais (un peu le coin|pas trop ce quartier)/.test(segT(x)));
    let cat = null; try { cat = CR.GEN2.PR.categorie(t, N); } catch (e) { cat = null; }
    const sansLieu = ["msg", "num"].includes(cat) || (E.ou || []).some((x) => /téléphone|distance|en ligne|internet|réseau|messagerie|courrier/i.test(segT(x)));
    const LISTE = [
      ["quand", "À quelle heure était-ce, précisément ?", absent ? [] : quand],
      ["ou", "Cet endroit, vous le connaissez ?", absent || sansLieu || chez ? [] : ouNeuf],
      ["comment", "Reprenons dans le détail : comment cela s'est-il déroulé ?", (E.comment || []).filter((x) => !defaut.test(segT(x)))],
      ["pourquoi", st === "reconnait" ? "Pourquoi l'avez-vous fait ?" : "Comment expliquez-vous ce qui s'est passé ?", st === "nie" ? [] : (E.pourquoi || []).filter((x) => !defaut.test(segT(x)))],
      ["confirme", "Qui était présent ? Quelqu'un peut-il confirmer ce que vous dites ?", absent ? [] : sansLieu ? (E.confirme || []).filter((x) => !/^Personne\. J'étais seule?\.$|^Non\. Il y avait que moi\.$|^Personne que je connaisse\.$/.test(segT(x))) : E.confirme],
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
    const r = CR.seeded((t.sig || "") + ":consult:situation"), pk = (a) => a[Math.floor(r() * a.length)];
    const situ = CR.MONDE.situ(A);
    const chezEmployeur = /travail|employeur|vestiaire|caisse|entreprise/.test(String((t.f && t.f.sc) || "")) || t.inf === "abus_confiance";
    if (["salarie", "independant"].includes(situ) && !chezEmployeur) out.push({ id: parent.id + ":justif", theme: parent.theme, q: "Votre travail, pouvez-vous en justifier ?", cout: 2, parent: parent.id, a: [situ === "salarie" ? pk(["Oui. J'ai mon contrat, mes fiches de paie. Mon patron peut faire une attestation.", "Oui, j'ai un contrat. Je peux vous apporter mes trois dernières fiches de paie.", "J'ai mes fiches de paie, oui. Et mon patron me connaît, il fera une attestation."]) : pk(["Oui. Je suis à mon compte : j'ai mes factures et mes déclarations.", "J'ai mon numéro d'entreprise, mes factures. Je peux vous apporter tout ça."])] });
    if (A.proche) { const p = PR.proche(A), g = PR.gram({ g: p.g }); out.push({ id: parent.id + ":proche", theme: parent.theme, q: "Qui pourrait attester pour vous, ou venir à l'audience ?", cout: 2, parent: parent.id, a: [pk([`${cap(p.ma)}. ${g.Il} me connaît mieux que personne, ${g.il} viendra.`, `${cap(p.ma)}, je pense. ${g.Il} est au courant de tout.`, `${cap(p.ma)}. Je peux ${g.lui || "lui"} demander d'écrire quelque chose.`])] }); }
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
    // une entrée en matière qui finit par une virgule (« Pour être tout à fait honnête, ») se dit d'un trait avec la suite
    const lier = (arr) => arr.reduce((out, x) => { const d = out[out.length - 1]; if (d && /,$/.test(segT(d))) out[out.length - 1] = typeof x === "string" ? segT(d) + " " + x : Object.assign({}, x, { t: segT(d) + " " + x.t }); else out.push(x); return out; }, []);
    const toutes = (call.topics || []).filter(C.estQuestion).map((tp) => { const theme = C.themeDe(tp), q = cap(fmt(tp.q)); return { tp, theme, q, a: lier(reponse(tp).filter((x, i, arr) => admise(x, theme, i, arr, q))) }; });
    // un mensonge qui ne porte pas sur les faits se dit à la question qu'il concerne, pas dans le récit : celui qui cache
    // son casier le cache quand on l'interroge sur ses antécédents (et ne l'avoue pas) ; le préjudice gonflé vient avec le préjudice
    const mk = t && t.vie && t.vie.ment ? t.vie.ment.k : null, ou = { pas_casier: "antecedents", prejudice: "prejudice" }[mk];
    if (ou) {
      const estM = (x) => x && typeof x === "object" && x.f === "G_vie_ment";
      const src = toutes.find((y) => y.theme !== ou && y.a.some(estM)), dst = toutes.find((y) => y.theme === ou);
      if (src && !dst && mk === "pas_casier") {
        // l'entretien n'interroge pas sur les antécédents (ordonnance pénale) : la question s'ajoute, il y ment
        const m = src.a.find(estM);
        src.a = src.a.filter((x) => !estM(x));
        const G0 = CR.GEN2.PR.gram(t.A);
        toutes.push({ tp: { id: "consult_casier", q: "Avez-vous déjà été condamné" + (G0.e || "") + " ?", cost: 2 }, theme: "antecedents", q: "Avez-vous déjà été condamné" + (G0.e || "") + " ?", a: [m], ajoutee: true });
      } else if (src && dst) {
        const m = src.a.find(estM);
        src.a = src.a.filter((x) => !estM(x));
        dst.a = mk === "pas_casier" ? dst.a.filter((x) => !(x && typeof x === "object" && x.f)).filter((x) => /^[(…]|…$/.test(segT(x))).concat([m]) : dst.a.concat([m]);
      }
    }
    // ce qui a été dit dans l'entretien (l'ouverture, puis chaque réponse) : une question peut en dépendre
    K.entendu = (call.opening || []).map((x) => fmt(segT(x))).join(" ").toLowerCase();
    const cabinet = call.scene === "conference";
    const catalogue = (tp) => /_x\d+$/.test(String(tp.id));
    // la question qui fait raconter les faits : la première du thème qui ne vient pas du catalogue de l'infraction
    const recit = toutes.find((y) => y.theme === "faits" && !catalogue(y.tp)) || null;
    const ver = luiMeme && recit && recit.a.some((x) => x && typeof x === "object" && x.recit) ? C.version(t, recit.a) : null;
    let inquietude = null;
    for (const { tp, theme, q: texte0, a, ajoutee } of toutes) {
      let texte = texte0;
      // deux questions sur ce qui l'inquiète : la seconde ne répète pas la première
      if (theme === "vecu" && INQUIET.test(texte) && inquietude) texte = "Et à part cela, qu'avez-vous peur de perdre ?";
      const q = { id: tp.id, theme, q: texte, cout: tp.cost || 3, tp: ajoutee ? null : tp, a, parent: null, si: null };
      // --- ce qui se découvre dans la discussion
      // une question du catalogue de l'infraction, les preuves, le préjudice : après le récit des faits seulement
      if (recit && tp !== recit.tp && (catalogue(tp) || theme === "preuves" || theme === "prejudice")) q.parent = recit.tp.id;
      // une question qui suppose que le client a fait ce qu'on lui reproche ne se pose pas à celui qui vient de le nier
      if (ver && catalogue(tp) && ver.mode.stance === "nie" && SUPPOSE.test(texte)) continue;
      // « Pourquoi avez-vous fait ça ? » suppose davantage : qu'il le reconnaisse (celui qui minimise dit autre chose)
      if (ver && catalogue(tp) && ver.mode.stance !== "reconnait" && /^Pourquoi avez-vous fait/i.test(texte)) continue;
      // au cabinet, la garde à vue ou l'audition ne s'aborde que si le client en a parlé
      if (cabinet && theme === "enquete") q.si = (K0) => /garde à vue|commissariat|polic|audition|gendarm|interpell/.test(K0.entendu);
      // deux questions sur ce qui l'inquiète : la seconde prolonge la première
      if (theme === "vecu" && INQUIET.test(texte)) { if (inquietude) q.parent = inquietude; else inquietude = tp.id; }
      // « travail, logement, famille » : s'il n'a rien dit de sa famille, il en dit un mot
      if (luiMeme && /famille/i.test(texte) && t.A && t.A.proche && !a.some((x) => /enfant|femme|mari|compagn|mère|père|frère|sœur|cousin|oncle|tante|seul/i.test(segT(x)))) { let i = a.length; while (i > 0 && !(a[i - 1] && a[i - 1].f)) i--; q.a = a.slice(0, i || a.length).concat([`Pour la famille, il y a surtout ${CR.GEN2.PR.proche(t.A).ma}.`], i ? a.slice(i) : []); }
      ajouter(q);
      // les suites : sur les faits quand le client les a racontés lui-même, sur la situation quand il parle de lui
      if (ver && recit.tp === tp) for (const x of suitesFaits(K, q, t, [].concat(...toutes.filter((y) => y.tp !== tp).map((y) => y.a.map(norme))), ver)) ajouter(x);
      if (luiMeme && q.theme === "situation" && /_vie$/.test(String(tp.id))) for (const x of suitesSituation(K, q, t)) ajouter(x);
    }
    K.themesDebut = C.themesVisibles(K, null).map((th) => th.id);
    return K;
  };
  C.posee = (K, id) => K.poses.some((x) => x.id === id);
  // les questions d'un thème, telles qu'on peut les poser : dispo = les entrées de l'entretien ouvertes à ce moment
  // une question se propose si la discussion l'a ouverte : sa question d'origine est posée, ce dont elle dépend a été dit
  C.visible = (K, q, dispo) => C.posee(K, q.id) || ((!q.parent || C.posee(K, q.parent)) && (!q.tp || !dispo || dispo.has(q.id)) && (!q.si || q.si(K)));
  C.questions = function (K, theme, dispo) {
    return K.ordre.map((id) => K.Q[id]).filter((q) => q.theme === theme && C.visible(K, q, dispo));
  };
  C.themesVisibles = (K, dispo) => K.themes.filter((th) => C.questions(K, th.id, dispo).length > 0);
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
    K.entendu += " " + lignes.map((l) => l.t).join(" ").toLowerCase();
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
    [/Je dois venir|devoir (le|la|les) voir/i, "Rien ne vous y oblige : je peux vous représenter. Et si vous venez, je serai à côté de vous."],
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
      if (C.posee(K, id) || !C.visible(K, q, null)) continue;
      const f = q.a.map((x) => x && typeof x === "object" && x.f).find(Boolean);
      if (!f) continue;
      out.push({ sujet: C.THEMES[q.theme] || "", question: q.q, fait: (def.facts && def.facts[f] && def.facts[f].label) || "" });
    }
    cs.vars.corrige = Object.assign({}, cs.vars.corrige || {}, { [K.scene]: out });
    return out;
  };
})();
