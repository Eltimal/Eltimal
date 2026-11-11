/* La Permanence — chantier anti-répétition, lot 3 : des dossiers qui bougent, des clients qui n'attendent pas la même chose.
   Pour les affaires générées convoquées plus tard (copj, al, pc), sans toucher au tirage :
   1. Un retournement en cours de dossier (une affaire sur deux), quelques jours après l'arrivée : images retrouvées, victime
      qui revient sur sa plainte, nouveau témoin entendu par le parquet, alibi horodaté. La pièce arrive par courrier ; ce
      qu'elle établit entre dans le délibéré (CR.PROC.deliberer) : à décharge, seulement si l'avocat la plaide.
   2. L'enjeu propre au client (défense) : garder son métier (bulletin n° 2), rester auprès de ses enfants, garder son emploi.
      Il le dit au premier entretien ; un argument le porte à l'audience ; le débrief dit si l'enjeu est sauvé, au-delà du
      verdict.
   Droit : à revérifier sur Légifrance (art. 6, 427 et 775-1 CPP). */
(function () {
  const CR = window.CR;
  const GEN2 = CR.GEN2;
  const RT = (CR.RETOURNEMENT = {});
  const h = (k) => CR.hash(String(k));
  const civ = (P) => (P ? `${P.g === "f" ? "Mme" : "M."} ${P.prenom || ""} ${P.nom}`.replace(/\s+/g, " ") : "");

  // =================================================================== 1. Retournements
  const VIOL = ["violences", "violences_conj", "violences_pdap", "rebellion", "outrage", "menaces", "degradations", "vol", "extorsion"];
  const ALIBI = ["vol", "cambriolage", "degradations", "incendie", "escroquerie", "acces_frauduleux", "usurpation_identite", "recel"];
  RT.TYPES = {
    images: { sens: "decharge", force: 0.25, when: (t) => VIOL.includes(t.inf) && !(CR.CAT.estVariante(t.inf, t.f) && !["embuscade", "agent_public"].includes(t.f.sc)), fact: "R_images",
      label: "Les images d'une caméra privée, retrouvées après l'enquête",
      piece: (t) => ({ from: "Cabinet — courrier reçu", subject: "Des images retrouvées", texte: [`Un commerçant voisin des faits nous adresse, à la demande de la famille de ${civ(t.A)}, l'enregistrement de sa caméra de surveillance.`, { t: "Les images, prises sous un autre angle que les constatations, ne montrent pas le geste reproché au moment indiqué par la procédure.", f: "R_images" }, "Le fichier sera conservé trente jours."] }),
      arg: { label: "Les images retrouvées après l'enquête", say: "Des images nouvelles, versées aux débats, ne montrent pas le geste reproché : elles contredisent la procédure." } },
    retractation: { sens: "decharge", force: 0.15, when: (t) => t.client === "A" && t.V && !t.V.agent && !t.V.morale, fact: "R_retract",
      label: "La lettre de la victime qui revient sur sa plainte",
      piece: (t) => ({ from: civ(t.V), subject: "Ma plainte", texte: [`Maître, je vous écris parce que je ne sais pas à qui m'adresser.`, { t: "Dans ma plainte, j'ai exagéré certaines choses, sous le coup de la colère. Je ne veux plus de poursuites.", f: "R_retract" }, `Je suis prêt${t.V.g === "f" ? "e" : ""} à le redire devant le tribunal.`] }),
      arg: { label: "La victime revient sur sa plainte", say: "La victime l'a écrit : elle a exagéré. Sa plainte, seul pilier de l'accusation, en sort fragilisée. Le retrait ne met pas fin aux poursuites, mais il pèse sur la preuve." },
      regle: "Le retrait de la plainte n'éteint pas l'action publique (art. 6 CPP) : il affaiblit seulement la force probante de la plainte, et ne compte que s'il est plaidé." },
    temoin: { sens: "charge", force: 0.2, when: (t) => !!t.T && !!t.V, fact: "R_temoin",
      label: "Un nouveau témoin, entendu à la demande du parquet",
      piece: (t) => ({ from: "Parquet — complément d'enquête", subject: "Procès-verbal d'audition complémentaire", texte: ["Sur instructions du parquet, audition d'un témoin non entendu lors de l'enquête initiale.", { t: "Le témoin, qui se trouvait sur les lieux, confirme la version de la plainte et décrit la personne mise en cause.", f: "R_temoin" }, "Procès-verbal versé au dossier de la procédure."] }),
      regle: "Une pièce nouvelle peut entrer au dossier jusqu'à l'audience ; elle doit être communiquée et discutée contradictoirement (art. 427 CPP)." },
    alibi: { sens: "decharge", force: 0.3, when: (t) => t.client === "A" && ALIBI.includes(t.inf) && !["filouterie", "ressources"].includes(t.f.sc), fact: "R_alibi",
      label: "Un relevé horodaté qui situe le client ailleurs",
      piece: (t) => ({ from: civ(t.A), subject: "J'ai retrouvé quelque chose", texte: ["Maître, en cherchant dans mes relevés, j'ai retrouvé ceci.", { t: "Le relevé de validation de mon passe de transport montre un passage aux portiques d'une station éloignée, à l'heure des faits.", f: "R_alibi" }, "Est-ce que ça peut servir ?"] }),
      arg: { label: "Le relevé horodaté qui le situe ailleurs", say: "À l'heure des faits, son passe de transport était validé à une station éloignée : le relevé est au dossier." } },
  };
  RT.typeDe = function (t, key) {
    if (!["copj", "al", "pc"].includes(t.genre)) return null;
    if (h(key + ":retournement") % 10 >= 5) return null;
    const ok = Object.keys(RT.TYPES).filter((k) => { try { return RT.TYPES[k].when(t); } catch (e) { return false; } });
    return ok.length ? ok[h(key + ":retournementType") % ok.length] : null;
  };
  CR.FLOW_HOOKS._retournement = function (api, d) {
    const { cs } = api;
    const def = CR.caseDef(cs);
    const R = def.retournement && RT.TYPES[def.retournement];
    if (!R || cs.vars.retournement) return;
    // dossier pas encore accepté : l'élément arrivera quelques jours après
    if (cs.status === "prospect") { if (((d && d.n) || 0) < 6) api.at(api.s.day + 3, "_retournement", { n: ((d && d.n) || 0) + 1 }); return; }
    if (cs.status !== "active") return;
    if (cs.proc && cs.proc.audience && cs.proc.audience.day <= api.s.day) return;
    cs.vars.retournement = def.retournement;
    const p = CR.GEN.paramsOf(api.s, cs.id);
    const m = R.piece(p.t);
    api.mail({ kind: "courrier", important: true, from: m.from, subject: m.subject, doc: "retournement", title: m.subject, body: [m.texte.map((x) => (typeof x === "string" ? x : x.t))] });
    api.log ? api.log(`Élément nouveau au dossier : ${R.label.toLowerCase()}.`, R.sens === "decharge" ? "good" : "bad") : null;
  };
  // Le délibéré : la pièce nouvelle s'ajoute au calcul
  const delib0 = CR.PROC.deliberer;
  CR.PROC.deliberer = function (api, spec, ctx) {
    const R = api.cs && api.cs.vars && api.cs.vars.retournement && RT.TYPES[api.cs.vars.retournement];
    if (R && spec && spec.pieces) {
      const pc = R.sens === "decharge" ? { label: R.label, sens: "decharge", force: R.force, need: [R.fact, "arg:retournement"] } : { label: R.label, sens: "charge", force: R.force };
      spec = Object.assign({}, spec, { pieces: Object.assign({}, spec.pieces, { r_nouveau: pc }) });
    }
    return delib0.call(this, api, spec, ctx);
  };

  // =================================================================== 2. L'enjeu du client
  const SENSIBLE = /infirm|aide-soignant|soignant|professeur|enseignant|instituteur|éducat|animat|agent de sécurité|sécurité|chauffeur|ambulanc|pompier|fonctionnaire|agent|banque|guichet|comptable|assistante maternelle|auxiliaire/i;
  RT.enjeuDe = function (t, key) {
    const A = t.A;
    if (!A || t.client !== "A" || t.genre === "info" || A.morale || t.R) return null;
    const M = CR.MONDE;
    const opts = [];
    if (M.travaille(A) && SENSIBLE.test(A.metier || "")) opts.push("b2", "b2");
    if (A.enfants > 0) opts.push("enfants");
    if (M.travaille(A)) opts.push("emploi");
    if (!opts.length) return null;
    return opts[h(key + ":enjeu") % opts.length];
  };
  RT.ENJEUX = {
    b2: { label: "Garder son métier (bulletin n° 2)",
      dit: (A, met) => [`Mon métier. Je suis ${met} : avec une condamnation au bulletin n° 2, je ne peux plus l'exercer.`, `Mon travail, surtout. ${CR.cap(met)}, on me demande un casier propre, le bulletin n° 2.`],
      arg: (G, met) => ({ label: "Exclure la mention au bulletin n° 2 (art. 775-1 CPP)", say: `S'il devait y avoir condamnation, je vous demande d'en exclure la mention au bulletin n° 2 : sans cela, ${G.il} perd son métier de ${met}.` }),
      sauve: (cs, dec, joue) => !dec.coupable || joue },
    enfants: { label: "Rester auprès de ses enfants",
      dit: () => ["Mes enfants. Si je vais en prison, qui s'en occupe ?", "Ce qui me fait peur, c'est les enfants. Je ne peux pas les laisser."],
      arg: (G) => ({ label: "Ses enfants : une peine qui ne l'en sépare pas", say: `${G.Il} élève ses enfants. Si une peine doit être prononcée, qu'elle ne ${G.le} sépare pas d'eux : sursis, ou peine aménagée.` }),
      sauve: (cs, dec) => !dec.coupable || !(cs.vars.peine && cs.vars.peine.ferme > 0 && !cs.vars.peine.amenagement) },
    emploi: { label: "Garder son emploi",
      dit: (A, met) => [`Mon boulot. Je suis ${met} ; si je rate des jours, je perds ma place.`, `Mon travail. Je ne peux pas me permettre de le perdre.`],
      arg: (G, met) => ({ label: `Son poste de ${met}`, say: `Une peine ferme exécutée lui coûterait son poste de ${met}. Tout le reste en dépend.` }),
      sauve: (cs, dec) => !dec.coupable || !(cs.vars.peine && cs.vars.peine.ferme > 0 && !cs.vars.peine.amenagement) },
  };

  // =================================================================== Installation (après le phrasier)
  const def0 = GEN2.def;
  GEN2.def = function (p) {
    const def = def0.call(this, p);
    if (!def || !def.generated || !p || !p.t) return def;
    const t = p.t, key = t.sig || p.seed || p.id;
    // retournement
    const ty = RT.typeDe(t, key);
    if (ty) {
      const R = RT.TYPES[ty];
      def.retournement = ty;
      def.facts = Object.assign({}, def.facts, { [R.fact]: { label: R.label } });
      def.docs = def.docs || {};
      def.docs.retournement = () => { const m = R.piece(t); return { title: m.subject, paras: [m.texte] }; };
      def.on = Object.assign({}, def.on);
      const arrive0 = def.on.arrive || (CR.FLOW_HOOKS && CR.FLOW_HOOKS.arrive);
      def.on.arrive = function (api, d) {
        const r = arrive0 ? arrive0.call(this, api, d) : undefined;
        api.at(api.s.day + 4 + (h(key + ":rtJour") % 6), "_retournement", {});
        return r;
      };
    }
    // enjeu
    const en = RT.enjeuDe(t, key);
    if (en) {
      const E = RT.ENJEUX[en], A = t.A, met = GEN2.PR.metier(A) || "salarié";
      def.enjeuClient = en;
      def.facts = Object.assign({}, def.facts, { E_enjeu: { label: `Ce qui compte pour le client : ${E.label.toLowerCase()}`, key: true, why: "Gagner, pour ce client, c'est d'abord préserver cela." } });
      if (def.calls) for (const k of ["intake", "depot"]) {
        const c = def.calls[k];
        if (!c || typeof c !== "object" || !Array.isArray(c.topics) || /Permanence/.test(c.label || "") || (k === "intake" && def.famille && c.who)) continue;
        if (c.topics.some((tp) => tp && tp.id === "c_enjeu")) continue;
        def.calls[k] = Object.assign({}, c, { topics: c.topics.concat([{ id: "c_enjeu", q: ["Qu'est-ce qui vous inquiète le plus ?", "Dans tout ça, qu'est-ce qui compte le plus pour vous ?", "Qu'est-ce que vous avez peur de perdre ?", "Au fond, qu'est-ce qui vous empêche de dormir ?"][h(key + ":enjeuQ") % 4], a: [{ t: E.dit(A, met)[h(key + ":enjeuDit") % 2], f: "E_enjeu" }], cost: 3, tag: "good" }]) });
      }
    }
    return def;
  };
  // Arguments ajoutés à la plaidoirie (via CR.PLAID.preparer)
  RT.argsPour = function (s, cs, role) {
    const def = CR.caseDef(cs);
    const out = [];
    if (!def) return out;
    const R = cs.vars && cs.vars.retournement && RT.TYPES[cs.vars.retournement];
    if (R && R.arg && R.sens === "decharge" && ((role === "defense" && cs.camp !== "pc") || false)) out.push(Object.assign({ id: "retournement", cards: [R.fact] }, R.arg));
    if (def.enjeuClient && role === "defense") {
      const p = CR.GEN.paramsOf(s, cs.id), A = p.t.A, G = GEN2.PR.gram(A);
      out.push(Object.assign({ id: "enjeu", cards: ["E_enjeu"], play: ["arg:enjeu"] }, RT.ENJEUX[def.enjeuClient].arg(G, GEN2.PR.metier(A) || "salarié")));
    }
    return out;
  };
  RT.debrief = function (s, cs) {
    const def = CR.caseDef(cs);
    const out = [];
    if (!def) return out;
    const R = cs.vars.retournement && RT.TYPES[cs.vars.retournement];
    const joues = (cs.vars.plaidArgs || []);
    if (R) {
      if (R.sens === "decharge") out.push(joues.includes("retournement") ? { kind: "good", text: `Vous avez plaidé l'élément nouveau : ${R.label.toLowerCase()}.${R.regle ? " " + R.regle : ""}` } : { kind: "surprise", text: `Un élément nouveau est arrivé en cours de dossier (${R.label.toLowerCase()}) et n'a pas été plaidé : à décharge, il ne compte que s'il est invoqué.${R.regle ? " " + R.regle : ""}` });
      else out.push({ kind: "rule", text: `Élément nouveau à charge : ${R.label.toLowerCase()}. ${R.regle}` });
    }
    const dec = cs.vars.decision;
    if (def.enjeuClient && dec) {
      const E = RT.ENJEUX[def.enjeuClient];
      const sauve = E.sauve(cs, dec, joues.includes("enjeu"));
      out.push(sauve ? { kind: "good", text: `L'enjeu du client est préservé : ${E.label.toLowerCase()}.` } : { kind: "bad", text: `L'enjeu du client n'est pas préservé : ${E.label.toLowerCase()}. ${CR.hasFact(cs, "E_enjeu") ? "Vous le connaissiez : il fallait le porter à l'audience." : "Il l'aurait dit si on le lui avait demandé au premier entretien."}` });
    }
    return out;
  };
})();
