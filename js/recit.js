/* La Permanence — le récit des faits par le client (refonte du gameplay, lot 3).
   Jusqu'ici, à « Racontez-moi ce qui s'est passé », le client ne disait qu'une phrase du catalogue (sa version selon
   qu'il reconnaît, minimise ou nie), souvent la réponse à une autre question. Il a désormais un souvenir des faits,
   construit depuis l'affaire (moment, lieu, ce qu'il faisait, le geste, l'objet, ce que la police a trouvé, la suite,
   ses raisons, qui était là), découpé en épisodes que l'entretien livre selon la question posée :
     cadre (quand, où, ce qu'il faisait), geste (ce qui s'est passé, comment), police (ce qu'on a trouvé, l'interpellation
     ou la convocation), pourquoi, confirme (témoin, complice, caméra).
   Le récit suit l'attitude (reconnaît, minimise, nie) et la vie du dossier : un client qui ment (t.vie.ment) raconte sa
   version mensongère, sans détail qui la trahirait ; un client qui revient sur ses aveux (t.vie.retracte) raconte la
   version de celui qui nie, après sa rétractation. La phrase de la version porte le fait du bloc-notes (G_version) ;
   le mensonge porte G_vie_ment, comme avant. Tout est tiré de la graine de l'affaire : le récit se redit à l'identique.
   RECIT.episodes(t, N) → { cadre, geste, police, pourquoi, confirme } (listes de segments) ;
   RECIT.complet(t, N) → le récit d'un trait, pour les entretiens à liste. */
(function () {
  "use strict";
  const CR = window.CR;
  const R = (CR.RECIT = {});
  const PR = () => CR.GEN2.PR;
  const cap = (x) => (x ? x[0].toUpperCase() + x.slice(1) : x);
  const phrases = (x) => String(x || "").split(/(?<=[.!?…»])\s+(?=[A-ZÀÂÉÈÊÎÔÛÇ«(])/).filter(Boolean);
  const pkr = (r, a) => a[Math.floor(r() * a.length)];

  // l'heure comme on s'en souvient : au quart d'heure près, en mots
  R.heure = (m) => {
    const x = Math.round((((m % 1440) + 1440) % 1440) / 15) * 15, h = Math.floor(x / 60) % 24, mn = x % 60;
    return h === 0 && !mn ? "minuit" : h === 12 && !mn ? "midi" : `${h} heure${h > 1 ? "s" : ""}${mn === 15 ? " et quart" : mn === 30 ? " et demie" : mn === 45 ? " quarante-cinq" : ""}${h < 12 ? " du matin" : ""}`;
  };
  R.moment = (m) => { const h = (((m % 1440) + 1440) % 1440) / 60; return h < 6 ? "dans la nuit" : h < 12 ? "le matin" : h < 14 ? "à midi" : h < 18 ? "l'après-midi" : h < 22 ? "le soir" : "tard le soir"; };
  // depuis quand : le jour des faits vu du jour de l'entretien
  R.depuis = (t) => {
    const n = (t.day != null ? t.day : t.d.faits) - t.d.faits;
    if (n <= 0) return R.moment(t.d.h).replace(/^le /, "ce ").replace(/^l'après-midi/, "cet après-midi").replace(/^à midi/, "ce midi").replace(/^dans la nuit/, "cette nuit").replace(/^tard le soir/, "tard hier soir");
    if (n === 1) return "hier " + R.moment(t.d.h).replace(/^le |^l'/, "").replace(/^à /, "à ").replace("dans la nuit", "dans la nuit");
    if (n < 14) return `il y a ${n} jours`;
    if (n < 60) return `il y a ${Math.round(n / 7)} semaines`;
    return `il y a ${Math.round(n / 30)} mois`;
  };
  // le lieu dit par le client : « au domicile de M. X » devient « chez M. X »
  R.lieu = (N, t) => {
    let l = String((N && N.lieu) || t.rue || "").trim().replace(/, Paris \d+e$/, "");
    if (!l) return null;
    l = l.replace(/^au domicile du couple/, "chez nous").replace(/^dans l'appartement du /, "dans l'appartement, au ");
    // la victime proche (conjoint, famille) : « chez elle », pas son nom complet
    const V = t.V;
    if (V && /conj|famil|ordonnance|non_repr|habituelles|abandon/.test(t.inf + " " + ((t.f && t.f.sc) || "")) && new RegExp("^au domicile de (M\\.|Mme) [^,]*" + V.nom).test(l)) l = l.replace(/^au domicile de (M\.|Mme) [^,]+/, V.g === "f" ? "chez elle" : "chez lui");
    l = l.replace(/^au domicile de (M\.|Mme) /, "chez $1 ");
    if (/^(au|aux|à|dans|devant|sur|sous|chez|en|près|par|via|depuis|rue|avenue|boulevard|quai|place|impasse|allée)(?=[\s,']|$)/i.test(l)) return l;
    if (/^(square|parc|jardin|carrefour|marché|métro|parking|bar|café|magasin|supermarché)(?=[\s,]|$)/i.test(l)) return "au " + l;
    return "à " + l;
  };
  // ce que faisait le client juste avant, selon l'infraction et la scène
  const AVANT = {
    vol: { magasin: "J'étais dans le magasin, je faisais un tour dans les rayons.", transport: "J'étais dans le métro, il y avait du monde.", arrachage: "Je marchais dans la rue, je rentrais.", vehicule: "Je passais dans la rue, il y avait des voitures garées.", tire: "J'étais dans la foule, sur le quai.", vestiaire: "J'étais au travail, au vestiaire.", vulnerable: "Je l'aidais, comme d'habitude, pour ses courses." },
    violences: { bar: "J'étais au bar avec des amis. On avait bu quelques verres.", rue: "J'étais dans la rue, je rentrais avec un ami.", transport: "J'étais dans le bus, il y avait du monde.", file: "J'attendais dans la file, depuis longtemps.", travail: "J'étais au travail, ça faisait des semaines que ça n'allait pas.", voisinage: "J'étais chez moi, il y avait encore du bruit.", circulation: "J'étais en voiture, ça bouchonnait.", sport: "On jouait un match, le ton est monté." },
    stups_trafic: { guetteur: "J'étais en bas de l'immeuble, comme souvent.", point_deal: "J'étais en bas de l'immeuble, comme souvent.", livraison: "Je faisais une livraison, en scooter." },
    stups_detention: { "*": "J'étais dehors, avec des amis." },
    stups_usage: { "*": "J'étais dehors, je fumais avec un ami." },
    alcool: { "*": "Je rentrais chez moi en voiture, après une soirée." },
    stups_volant: { "*": "Je rentrais chez moi en voiture." },
    defaut_permis: { "*": "Je conduisais, j'avais une course à faire." },
    refus_obtemperer: { "*": "Je conduisais, j'ai vu le contrôle devant." },
    rebellion: { "*": "Il y avait du monde, ça criait de partout." },
    outrage: { "*": "Ils m'ont arrêté pour un contrôle." },
    violences_conj: { "*": "On était à la maison, on s'est disputés." },
    cambriolage: { "*": "J'étais dans le quartier." },
    degradations: { "*": "J'étais dehors avec des amis." },
  };
  const avantDe = (t) => { const T = AVANT[t.inf]; return T ? T[t.f && t.f.sc] || T["*"] || null : null; };

  // la vie du dossier : mensonge (défense seulement), rétractation, sinon l'attitude du tirage
  // o.scene === "gav" : l'entretien de garde à vue, avant l'audition ; il n'y a pas encore d'aveux sur lesquels revenir
  // les mensonges qui portent sur les faits changent le récit ; les autres (casier, préjudice) se disent à la fin
  R.MENT_FAITS = ["absent", "volant", "pas_bu", "jamais_touche", "pas_frappe", "provocation"];
  R.mode = (t, o) => {
    const v = t.vie || {};
    if (v.ment && t.client === "A" && R.MENT_FAITS.includes(v.ment.k)) return { k: "ment", ment: v.ment, stance: "nie" };
    if (v.retracte && !(o && o.scene === "gav")) return { k: "retracte", stance: "nie" };
    return { k: t.stance, stance: t.stance };
  };

  R.episodes = function (t, N, o) {
    if (!t || !N || !N.version) return null;
    const r = CR.seeded((t.sig || "") + ":recit");
    const M = R.mode(t, o), st = M.stance;
    const A = t.A, G = PR().gram(A), V = t.V, GV = V ? PR().gram(V) : null;
    const nomV = V ? (/(^|_)(conj|couple)/.test(t.inf + "_" + (t.f && t.f.sc)) ? (V.g === "f" ? "elle" : "lui") : V.agent || /pdap|rebellion|outrage/.test(t.inf) ? (V.g === "f" ? "la policière" : "le policier") : `${V.g === "f" ? "la dame" : "le monsieur"}`) : null;
    const E = { cadre: [], geste: [], police: [], pourquoi: [], confirme: [], quand: [], ou: [], comment: [] };
    const absent = M.k === "ment" && M.ment.k === "absent";
    // la police est là dès le début : contrôle routier, contrôle d'identité, rébellion, outrage, violences sur policier
    const controle = ["alcool", "stups_volant", "defaut_permis", "refus_obtemperer", "rebellion", "outrage", "violences_pdap"].includes(t.inf) || /controle|interpellation|barrage/.test((t.f && t.f.sc) || "");
    const resiste = ["rebellion", "violences_pdap", "refus_obtemperer"].includes(t.inf);
    const agent = V && (V.agent || /pdap|rebellion|outrage/.test(t.inf));
    // 1. le cadre : quand, où, ce que je faisais
    const dep0 = R.depuis(t), h0 = t.d && t.d.h != null ? R.heure(t.d.h) : null;
    const quand = h0 ? `${cap(dep0)}, vers ${/^il y a/.test(dep0) ? h0 : h0.replace(/ du matin$/, "")}` : cap(dep0);
    const lieu = R.lieu(N, t);
    if (absent) E.cadre.push(`${quand} ? J'étais chez moi. Je suis pas sorti${G.e}.`);
    else {
      // « ce matin, vers 7 heures 45 » : le moment dit déjà le matin
      const h = t.d && t.d.h != null ? R.heure(t.d.h) : null, dep = R.depuis(t);
      E.cadre.push(`C'était ${dep}${h ? ", vers " + (/^il y a/.test(dep) ? h : h.replace(/ du matin$/, "")) : ""}${lieu ? ", " + lieu : ""}.`);
      const av = avantDe(t);
      if (av) E.cadre.push(av);
    }
    // 2. le geste : la version (fait G_version), le mensonge, puis les explications qu'il a données ou qu'il donnera
    const vers = phrases(N.version[st] || N.version[t.stance]);
    if (M.k === "retracte") E.geste.push({ t: PR().vie.retractation(t), f: "G_version", recit: "retracte" });
    else if (vers.length) E.geste.push({ t: vers.join(" "), f: "G_version", recit: true });
    if (M.k === "ment") E.geste.push({ t: PR().vie.mensonge(t, M.ment), f: "G_vie_ment" });
    if (M.k === "retracte" && vers.length) E.geste.push(vers.join(" "));
    // les réponses que la personne donne aux questions de l'enquêteur, rangées par épisode (attitude du tirage seulement)
    const vus = new Set(E.geste.map((x) => (typeof x === "string" ? x : x.t)));
    // une réponse ne passe dans le récit que si elle se comprend sans la question (« Cinq ou six bières. » n'en dit rien)
    const seule = (x) => /^(Je |J'|On |Il |Elle |Ils |Elles |C'est |C'était |Ça |Mon |Ma |Mes |Le |La |Les )/.test(x) && x.split(/\s+/).length >= 6 && !/^Je (ne )?sais (pas|plus)/.test(x);
    if (M.k === t.stance) for (const a of N.audition || []) {
      const rep = a.a && a.a.expliquer, q = a.q || "";
      if (!rep || vus.has(rep) || [...vus].some((x) => x.includes(rep))) continue;
      if (!seule(rep) && !/donnerai pas de nom/i.test(rep)) continue;
      vus.add(rep);
      if (/première fois|déjà été|antécédent|condamn/i.test(q)) continue;
      if (/où étiez|où vous trouviez|que faisiez|l'après-midi|le soir des faits/i.test(q)) E.cadre.push(rep);
      else if (/pourquoi|raison|qu'est-ce qui vous a/i.test(q)) E.pourquoi.push(rep);
      else if (/pour qui|qui vous|nom|avec qui|qui était|complice|l'autre|second/i.test(q) || /donnerai pas de nom/i.test(rep)) E.confirme.push(rep);
      else E.geste.push(rep);
    }
    // l'objet pris, quand la version ne le nomme pas
    const objet = N.objet || (t.f && t.f.objet);
    const nu = (x) => String(x || "").replace(/^(un|une|des|le|la|les|deux|trois) /, "");
    if (objet && t.inf === "vol" && !absent && !vers.join(" ").includes(nu(objet)) && !(N.saisie && String(N.saisie).includes(nu(objet)))) {
      const pl = /^(des|les|deux|trois)\b| et /.test(objet), fem = !pl && /^(une|la) /.test(objet);
      const le = pl ? "les" : "l'", acc = pl ? "s" : fem ? "e" : "";
      E.geste.push({ reconnait: `J'ai pris ${objet}. Je ${le}${pl ? " " : ""}ai mis${pl ? "" : ""} dans ma poche, et je suis parti${G.e}.`, minimise: `${cap(objet)}, je ${le}${pl ? " " : ""}avais dans la main. Je sais même pas pourquoi.`, nie: `${cap(objet)} ? Je ${le}${pl ? " " : ""}ai jamais eu${acc} entre les mains.` }[st]);
    }
    // 3. la police : ce qu'on a trouvé, l'interpellation ou la convocation
    // ce qu'on a saisi : il le reconnaît, le relativise ou en conteste le sens (sans démentir sa propre version)
    if (N.saisie && !absent) E.police.push({ reconnait: `Ils ont trouvé ${N.saisie}. Oui, c'est à moi.`, minimise: `Ils ont trouvé ${N.saisie}. Ils en font toute une histoire, ça veut pas dire ce qu'ils croient.`, nie: `Ils ont saisi ${N.saisie}. Ils en font une affaire, mais ça prouve rien.` }[st]);
    if (t.flagrance && !absent && controle) E.police.push(st === "nie" ? "Ils m'ont emmené" + G.e + " au commissariat sans rien vouloir entendre." : resiste ? "Ils m'ont menotté" + G.e + " et ils m'ont emmené" + G.e + " au commissariat." : "Ils m'ont emmené" + G.e + " au commissariat. J'ai pas fait d'histoire.");
    else if (t.flagrance && !absent) E.police.push(pkr(r, st === "nie" ? ["Les policiers sont arrivés d'un coup, ils ont pris le premier qu'ils ont vu : moi.", "La police est arrivée, ils ont rien voulu entendre. Ils m'ont mis par terre."] : ["La police est arrivée quelques minutes après. J'ai pas cherché à partir.", "Les policiers sont arrivés très vite. Je suis resté" + G.e + " là, j'ai pas résisté."]));
    else if (!t.flagrance) E.police.push(pkr(r, ["Après, je suis rentré" + G.e + " chez moi. J'en ai plus entendu parler, jusqu'à ce que la police m'appelle.", "Après, rien. La vie normale. Et puis un jour, ils sont venus me chercher.", "J'ai pensé que c'était fini. Et puis il y a eu la convocation."]));
    // 4. pourquoi
    for (const x of N.qA || []) if (/pourquoi|raison/i.test(x.q) && x.a && x.a[0] && !vus.has(x.a[0])) { E.pourquoi.push(x.a[0]); vus.add(x.a[0]); }
    if (!E.pourquoi.length) E.pourquoi.push(st === "nie" ? "Il y a pas de pourquoi. J'ai rien fait, je vous dis." : st === "minimise" ? "Je sais pas. C'est parti tout seul. C'était pas prévu." : pkr(r, ["J'ai pas réfléchi. Sur le moment, j'ai pas réfléchi.", "J'étais pas bien, à ce moment-là. C'est pas une excuse."]));
    // 5. qui peut confirmer : témoin, complice, caméra
    const preuves = t.preuves || [];
    if (t.T && preuves.includes("temoin")) E.confirme.push(st === "reconnait" ? "Il y avait quelqu'un, une personne qui a tout vu. Elle dira la même chose que moi." : "Il y avait des gens autour. Qu'on leur demande, ils diront que c'est pas comme ça que ça s'est passé.");
    if (t.f && (t.f.agg || []).includes("reunion")) E.confirme.push(st === "nie" ? "J'étais avec personne." : "J'étais avec un ami. Son nom, je le donnerai pas.");
    if (t.camera || preuves.includes("video")) E.confirme.push(st === "reconnait" ? "Il y a une caméra. Elle a dû tout filmer, je sais." : "Il y a une caméra, là-bas. Qu'ils regardent : vous verrez que c'est pas comme ils disent.");
    // la victime : il ne l'invoque que s'il reconnaît, ou s'il nie et pense qu'elle le sait ; un policier, jamais
    if (nomV && !absent) {
      if (agent) { if (st !== "reconnait") E.confirme.push(`${cap(nomV)}, il raconte ce qu'il veut. C'est sa parole contre la mienne.`.replace(/^La policière, il /, "La policière, elle ")); }
      else if (st === "nie") E.confirme.push(`${cap(nomV)} ? Demandez-${GV.lui}, ${GV.il} sait très bien que j'ai rien fait.`);
      else if (st === "reconnait") E.confirme.push(`${cap(nomV)} pourra le dire.`);
    }
    if (!E.confirme.length) E.confirme.push("Personne. J'étais seul" + G.e + ".");
    // 6. les précisions, quand l'avocat y revient : l'heure, le lieu, le déroulé
    const hum = (PR().voix && PR().voix(t, A, "garde").hum) || "calme";
    const flou = ["anxieux", "abattu"].includes(hum);
    if (absent) E.quand.push("Toute la journée, j'étais chez moi. Je vous l'ai dit.");
    else if (t.d && t.d.h != null) {
      const m = Math.round(t.d.h / 5) * 5, pres = `${Math.floor(m / 60) % 24} h ${String(m % 60).padStart(2, "0")}`;
      E.quand.push(flou ? `Je sais plus exactement. Vers ${R.heure(t.d.h)}, peut-être un peu plus tard. Tout s'est mélangé.` : pkr(r, [`${pres}, à peu près. Je venais de regarder mon téléphone.`, `Vers ${pres}. Je m'en souviens parce que je devais être ailleurs à cette heure-là.`, `${pres}, pas loin. Je regardais pas l'heure, mais c'était ça.`]));
      E.quand.push(t.flagrance && controle ? "Les policiers, ils étaient déjà là. C'est eux qui m'ont arrêté" + G.e + "." : t.flagrance ? pkr(r, ["Et la police, quelques minutes après. Dix minutes, un quart d'heure, pas plus.", "La police est arrivée très vite après. Cinq minutes, je dirais."]) : "La police, c'est des jours après qu'elle s'est manifestée.");
    }
    if (!absent && lieu) {
      E.ou.push(`${cap(lieu.replace(/^(à|au|aux|dans|chez|devant|sur|sous|par|en) /, (x) => x))}${/\.$/.test(lieu) ? "" : "."}`);
      const chez = A && A.adresse && t.rue && A.adresse.includes(String(t.rue).replace(/^(rue|avenue|boulevard|place|quai) /, ""));
      E.ou.push(chez ? "C'est à côté de chez moi. Je connais tout le monde, là-bas." : pkr(r, ["Je connais un peu le coin. J'y passe souvent.", "Je connais pas trop ce quartier. J'étais de passage."]));
    } else if (absent) E.ou.push("Chez moi. Je vous l'ai dit, j'étais pas là-bas.");
    // le déroulé : les explications données à l'enquêteur que le récit n'a pas reprises, puis l'objet ou la saisie
    for (const a of N.audition || []) { const x = a.a && a.a.expliquer; if (M.k === t.stance && x && !vus.has(x) && ![...vus].some((y) => y.includes(x)) && !/première fois|déjà été|antécédent|condamn/i.test(a.q || "") && seule(x)) { E.comment.push(x); vus.add(x); } }
    const ROUTE = { alcool: "Ils m'ont arrêté" + G.e + " pour un contrôle, ils m'ont fait souffler. Après, l'appareil, au commissariat.", stups_volant: "Ils m'ont fait le test salivaire, sur le bord de la route. Il est sorti positif, d'après eux.", refus_obtemperer: st === "nie" ? "J'ai jamais vu de policier me faire signe. J'ai continué ma route, c'est tout." : "J'ai vu les gyrophares, j'ai paniqué. J'ai accéléré au lieu de m'arrêter.", defaut_permis: "Ils m'ont demandé mes papiers. Le permis, je l'avais pas." };
    if (!E.comment.length && ROUTE[t.inf] && !absent) E.comment.push(ROUTE[t.inf]);
    if (!E.comment.length) E.comment.push(st === "nie" ? "Il y a rien à raconter de plus. J'ai rien fait." : pkr(r, ["Ça a duré quelques secondes. Je saurais pas vous dire mieux.", "Tout est allé très vite. Je me rappelle pas de chaque geste."]));
    return E;
  };
  // le récit d'un trait (entretiens à liste) : le cadre, le geste, la police
  R.complet = function (t, N, o) {
    const E = R.episodes(t, N, o);
    if (!E) return [{ t: (N && N.version && N.version[t.stance]) || "", f: "G_version" }];
    const v = t.vie || {}, autre = v.ment && t.client === "A" && !R.MENT_FAITS.includes(v.ment.k) ? [{ t: PR().vie.mensonge(t, v.ment), f: "G_vie_ment" }] : [];
    return E.cadre.concat(E.geste, E.police, autre);
  };
  // le récit porte déjà le mensonge et la rétractation : la vie du dossier (gen-vie.js) ne les ajoute pas une seconde fois
  R.porteVie = (arr) => (arr || []).some((x) => x && typeof x === "object" && (x.f === "G_vie_ment" || x.recit === "retracte"));
})();
