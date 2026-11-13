// La Permanence — refonte du gameplay, lot 7 : la confrontation jouée devant le juge d'instruction (CR.CONF)
// Après les questions du juge, l'avocat interroge le témoin (art. 120 : les avocats des parties peuvent poser des questions ;
// le juge dirige et met un terme quand il s'estime suffisamment informé). La question se compose comme à l'entretien :
// sujet, angle, forme ; la forme « confrontation » oppose au témoin un passage annoté d'une pièce.
// Le témoin répond d'après ce qu'il sait (CR.CRIMD.temoin : l'heure, corrigée ou non ; l'éclairage ; la distance ; la
// reconnaissance, franche, hésitante ou à la silhouette), de bonne foi : il concède ce qui est fragile si on le lui
// demande bien, et il raffermit l'accusation si on lui demande s'il est certain alors qu'il l'est. Ce qu'il concède entre au
// procès-verbal de confrontation (une pièce du dossier) et appuie le moyen tiré de l'identification.
(function () {
  "use strict";
  const CR = window.CR, UI = CR.UI, { html, Btn } = UI;
  const { useState } = React;
  const P = CR.PAROLE;
  const K = (CR.CONF = {});
  K.MAX = 4; // au-delà, le juge s'estime suffisamment informé (art. 120, al. 2)
  K.CONCESSIONS = {
    G_conf_heure: { label: "À la confrontation, le témoin n'est plus sûr de l'heure des faits", key: true, why: "Il a corrigé l'heure entre ses deux auditions ; devant le juge, il ne la tient plus à dix minutes près." },
    G_conf_nuit: { label: "À la confrontation, le témoin dit n'avoir pas vu le visage", key: true, why: "Presque sans éclairage, il ne distinguait qu'une silhouette : l'identification repose sur peu." },
    G_conf_loin: { label: "À la confrontation, le témoin dit ne pas avoir distingué les traits", key: true, why: "À cette distance, il voyait la tenue, pas le visage." },
    G_conf_reco: { label: "À la confrontation, le témoin n'est pas certain de reconnaître la personne mise en examen", key: true, why: "Une reconnaissance incertaine, maintenue devant le juge, ne vaut pas identification." },
  };
  K.CERTAIN = { label: "À la confrontation, le témoin se dit certain de reconnaître la personne mise en examen", why: "Une question fermée posée à un témoin sûr de lui raffermit l'accusation." };
  const hm = (m) => (CR.DOCS && CR.DOCS.hm ? CR.DOCS.hm(m) : `${Math.floor((((m % 1440) + 1440) % 1440) / 60)} h ${String((((m % 1440) + 1440) % 1440) % 60).padStart(2, "0")}`);

  // ------------------------------------------------------------------ Le témoin
  K.modele = function (s, cs, t, N, W) {
    const A = t.A, T = W.T;
    const e = T.g === "f" ? "e" : "";
    const nA = `${A.g === "f" ? "Mme" : "M."} ${A.nom}`;
    const sujets = [
      { id: "w_vu", label: "Ce que vous avez vu", nom: "ce que vous avez vu", key: ["recit", "comment"], q: { recit: "Dites-nous ce que vous avez vu, avec vos mots.", comment: "Comment les choses se sont-elles passées, sous vos yeux ?", "fermee|recit": "Vous maintenez votre déclaration ?" } },
      { id: "w_heure", label: "L'heure", nom: "l'heure des faits", key: ["quand", "pourquoi"], q: { quand: "Quelle heure était-il, d'après vous ?", pourquoi: "Comment pouvez-vous être sûr de l'heure ?", "fermee|quand": `C'était bien vers ${hm(W.hDit)} ?`, "fermee|pourquoi": "Vous êtes sûr de l'heure ?" } },
      { id: "w_lumiere", label: "L'éclairage", nom: "l'éclairage des lieux", key: ["comment", "ou"], q: { comment: "Comment les lieux étaient-ils éclairés ?", ou: "D'où venait la lumière ?", "fermee|comment": "Vous voyiez bien son visage ?", "fermee|ou": "Il faisait clair ?" } },
      { id: "w_distance", label: "La distance", nom: "la distance", key: ["ou", "comment"], q: { ou: "Où vous trouviez-vous exactement ?", comment: "Qu'est-ce que vous distinguiez, de là où vous étiez ?", "fermee|ou": "Vous étiez tout près ?" } },
      { id: "w_reco", label: "La reconnaissance", nom: `la reconnaissance de ${nA}`, key: ["recit", "comment", "confirme"], q: { recit: `Comment avez-vous reconnu ${nA} ?`, comment: `À quoi reconnaissez-vous ${nA} ?`, confirme: "Quelqu'un d'autre l'a-t-il vu ?", "fermee|recit": `Vous êtes certain${e} que c'est ${nA} ?`, "fermee|comment": `Vous êtes certain${e} que c'est ${nA} ?` } },
      { id: "w_accuse", label: nA, nom: nA, key: ["recit", "pourquoi"], q: { recit: `Connaissiez-vous ${nA} avant les faits ?`, pourquoi: `Avez-vous une raison d'en vouloir à ${nA} ?` } },
      { id: "w_decl", label: "Vos déclarations", nom: "vos déclarations aux policiers", key: ["recit", "quand"], q: { recit: "Vous avez été entendu" + e + " deux fois par les policiers. Avez-vous dit la même chose ?", quand: "Quand avez-vous été entendu" + e + " ?" } },
    ];
    const M = { t, W, A, T, nA, G: { e }, sujets, topics: {}, dit: {}, poses: [], concessions: [], certain: false };
    // la scène recalcule son script à chaque rendu, et l'état du jeu peut être recopié : l'enregistrement du jour se
    // retrouve dans le dossier à chaque question, sans garder de référence
    const jour = s.day;
    M.vers = (c) => (c.vars.confront && c.vars.confront.jour === jour ? c.vars.confront : (c.vars.confront = { jour, temoin: `${T.prenom} ${T.nom}`, qa: [] }));
    M.vers(cs);
    return M;
  };

  // répondre à une question composée : { lignes: [{ t, f }], refus }
  K.repondre = function (M, q) {
    const W = M.W, e = M.G.e;
    const marks = q.extrait ? (q.extrait.marks || []).map((m) => m.id) : [];
    const oppose = (ids) => q.forme === "confrontation" && ids.some((x) => marks.includes(x));
    const insiste = q.forme === "fermee" || q.forme === "relance";
    const cle = `${q.sujet}|${q.angle}|${q.forme}`;
    if (M.poses.some((x) => `${x.sujet}|${x.angle}|${x.forme}` === cle && x.forme !== "confrontation")) return { refus: "La question a été posée, maître, et le témoin y a répondu.", lignes: [] };
    const L = (t, f) => ({ t, f: f || null });
    const conc = (f, t) => { if (!M.concessions.includes(f)) M.concessions.push(f); return L(t, f); };
    let out;
    switch (q.sujet) {
      case "w_vu":
        out = q.forme === "confrontation" ? [L("J'ai dit ce que j'ai vu. Je n'ai rien à changer.")] : q.forme === "fermee" ? [L("Oui, je maintiens.")] : [L(W.premiere || "Je maintiens ce que j'ai dit aux policiers."), L("C'est ce que j'ai vu.")];
        break;
      case "w_heure":
        if (W.corrige && (oppose(["G_temoin_varie"]) || (q.angle === "pourquoi" && q.forme !== "ouverte") || (q.angle === "pourquoi" && M.dit.w_heure))) out = [L("Le premier jour, j'ai donné une autre heure, c'est vrai."), conc("G_conf_heure", `Je me suis repéré${e} au journal télévisé, après coup. À dix minutes près, je ne peux pas vous dire. Je ne suis plus sûr${e}, pour l'heure.`)];
        else if (W.corrige) out = q.angle === "pourquoi" ? [L("J'ai repensé à ma soirée. J'étais rentré" + e + " après le journal télévisé.")] : q.forme === "fermee" ? [L("Oui. Vers là.")] : [L(`Vers ${hm(W.hDit)}. C'est ce que j'ai dit la seconde fois.`)];
        else out = q.forme === "confrontation" ? [L("C'est ce que j'ai toujours dit.")] : q.angle === "pourquoi" ? [L("Je venais de regarder l'heure : je rentrais, je regarde toujours ma montre en arrivant.")] : [L(`Vers ${hm(W.hDit)}. J'en suis sûr${e}.`)];
        break;
      case "w_lumiere":
        if (W.nuit) out = insiste || oppose(["G_temoin_nuit"]) ? [conc("G_conf_nuit", "Son visage, non, pas vraiment. Il faisait nuit. Je voyais surtout une silhouette.")] : [L("Presque rien. Il faisait nuit, le réverbère ne marchait pas.")];
        else out = q.forme === "fermee" ? [L("Oui, assez bien.")] : [L(`Il y avait ${W.lum}. On voyait correctement.`)];
        break;
      case "w_distance":
        if (W.loin) out = q.angle === "comment" || insiste ? [L(`J'étais à ${W.dist}.`), conc("G_conf_loin", "De là où j'étais, je voyais surtout la tenue, la veste. Les traits, c'est difficile à cette distance.")] : [L(`À ${W.dist}, à peu près.`)];
        else out = q.forme === "fermee" ? [L("Oui. Tout près.")] : [L(`J'étais à ${W.dist}. Je l'ai bien vu.`)];
        break;
      case "w_reco":
        if (q.angle === "confirme") { out = [L("Je ne sais pas. Il y avait peut-être d'autres gens, plus loin.")]; break; }
        if (W.hesite) out = insiste || oppose(["G_temoin_hesite"]) ? [conc("G_conf_reco", `Certain${e}… non. Il lui ressemble. Mais certain${e}, non.`)] : [L("Sur la photo, je crois que c'est lui. Je l'ai dit aux policiers : je ne pourrais pas le jurer.")];
        else if (W.silhouette) out = q.angle === "comment" || insiste ? [conc("G_conf_reco", "À sa silhouette, sa façon de se tenir. Le visage, je ne l'ai pas vraiment vu.")] : [L("Je l'ai reconnu à sa silhouette.")];
        else if (q.forme === "fermee") { M.certain = true; out = [L(`Certain${e}. Je ne l'oublierai jamais.`, "G_conf_certain")]; }
        else out = [L("Je l'ai reconnu tout de suite, sur la photographie. Et aujourd'hui aussi.")];
        break;
      case "w_accuse":
        out = q.angle === "pourquoi" ? [L("Aucune. Je ne le connais pas.")] : [L("Non. Je ne l'avais jamais vu.")];
        break;
      case "w_decl":
        out = q.angle === "quand" ? [L(`Le jour des faits, puis le ${CR.DOCS && CR.DOCS.date ? CR.DOCS.date(W.jR) : "jour suivant"}.`)] : W.corrige ? [L("La même chose. Sauf l'heure : la seconde fois, j'ai rectifié.")] : [L("La même chose, les deux fois.")];
        break;
      default: out = [L("Je ne vois pas ce que vous voulez dire.")];
    }
    if (q.forme === "confrontation" && !out.some((x) => x.f)) out = [L(`(${M.T.prenom} ${M.T.nom} relit le passage.) Je ne vois pas la contradiction. J'ai dit ce que j'ai vu.`)];
    (M.dit[q.sujet] = M.dit[q.sujet] || []).push(...out.map((x) => x.t));
    return { lignes: out };
  };

  // ------------------------------------------------------------------ L'interrogatoire au fond : les questions à son client
  // Ce que le client peut dire lui-même de chaque enjeu du dossier (CAT.ENJEUX) : sa version quand le dossier la confirme
  // (fort), sa version quand le dossier la contredit (faible). L'angle attendu est celui qui le fait s'expliquer.
  // « nie » : un enjeu qui suppose le geste (intention, légitime défense…) ne s'explique pas par qui dit n'y être pour rien.
  K.ENJ = {
    intention: { label: "Le geste", angle: "comment", q: "Racontez au juge le geste lui-même : combien de coups, comment ?", fort: "Un seul coup. Je ne voulais pas tuer, je voulais que ça s'arrête. Tout s'est passé en une seconde.", faible: "Je ne me souviens que d'un coup. Je ne voulais pas tuer.", geste: true },
    premeditation: { label: "L'arme", angle: "quand", q: "Depuis quand aviez-vous l'arme ? D'où venait-elle ?", fort: "Elle était sur place. Je ne l'avais pas apportée. Je ne savais même pas qu'on allait se voir ce soir-là.", faible: "Je n'avais rien préparé. Je n'étais pas allé là-bas exprès.", geste: true },
    ld: { label: "L'attaque", angle: "comment", q: "Qui a frappé le premier ? Qu'avez-vous fait ensuite ?", fort: "La victime s'est jetée sur moi, la main levée. J'ai répondu une fois, pour me dégager, et je suis parti.", faible: "C'est la victime qui a commencé. Je me suis défendu" + "{e}" + ".", geste: true },
    aboli: { label: "Votre état ce soir-là", angle: "comment", q: "Dans quel état étiez-vous, ce soir-là ?", fort: "J'entendais des voix depuis des jours. Elles me disaient qu'il fallait le faire. Je ne me reconnais pas dans ce que j'ai fait.", faible: "Je n'étais pas bien. Mais je savais ce que je faisais, je crois." },
    altere: { label: "Votre état ce soir-là", angle: "comment", q: "Dans quel état étiez-vous, ce soir-là ?", fort: "Je ne dormais plus. J'avais arrêté mon traitement depuis un mois. J'étais à bout.", faible: "J'allais bien. J'étais juste en colère." },
    identification: { label: "Votre emploi du temps", angle: "ou", q: "Où étiez-vous au moment des faits ?", fort: "J'étais ailleurs. Je l'ai dit dès le premier jour et je n'ai jamais changé de version.", faible: "J'étais chez moi. Seul" + "{e}" + ". Personne ne peut le dire." },
    consentement: { label: "Ce soir-là, entre vous", angle: "recit", q: "Racontez au juge comment les choses se sont passées entre vous, ce soir-là.", fort: "Nous étions d'accord, tous les deux. On s'était écrit toute la soirée ; c'est moi qu'on a invité" + "{e}" + " à monter. Je n'ai jamais forcé.", faible: "Je pensais que c'était d'accord. Rien n'a été dit.", geste: true },
    penetration: { label: "Les gestes", angle: "comment", q: "Quels gestes, exactement ?", fort: "Des gestes par-dessus les vêtements. Je le reconnais, c'est grave. Il n'y a rien eu d'autre.", faible: "Je ne me souviens pas exactement.", geste: true },
    desistement: { label: "Pourquoi vous être arrêté" + "{e}", angle: "pourquoi", q: "Pourquoi vous êtes-vous arrêté" + "{e}" + " ?", fort: "De moi-même. J'ai vu ce que j'étais en train de faire et je suis parti" + "{e}" + ". Personne ne m'en a empêché" + "{e}" + ".", faible: "Quand j'ai entendu les voisins, je suis parti" + "{e}" + ".", geste: true },
    causalite: { label: "Quand vous êtes parti" + "{e}", angle: "comment", q: "Dans quel état était la victime quand vous êtes parti" + "{e}" + " ?", fort: "Debout. Elle m'insultait encore quand j'ai fermé la porte.", faible: "Par terre. Elle ne bougeait plus.", geste: true },
    arme: { label: "L'arme", angle: "recit", q: "Aviez-vous une arme ?", fort: "Je n'avais rien dans les mains. On ne l'a jamais retrouvée parce qu'il n'y en avait pas.", faible: "Ce n'était pas une vraie arme. Un objet, juste pour faire peur.", geste: true },
    bo: { label: "Les autres", angle: "quand", q: "Depuis quand connaissiez-vous les autres ?", fort: "Je les ai rencontrés ce jour-là. Je ne savais rien de leur organisation.", faible: "On se connaissait, oui. On se voyait souvent.", geste: true },
    liberation: { label: "La libération", angle: "quand", q: "Quand avez-vous laissé partir la personne ?", fort: "Le lendemain matin. C'est moi qui ai ouvert la porte. Personne ne m'y a obligé" + "{e}" + ".", faible: "Quand la police est arrivée.", geste: true },
    role: { label: "Votre rôle", angle: "recit", q: "Quel était votre rôle, exactement ? Qui donnait les ordres ?", fort: "Je faisais ce qu'on me disait. On me payait à la journée. Je n'ai jamais rien décidé.", faible: "Je disais aux autres quoi faire, parfois. Mais je n'étais pas le chef.", geste: true },
    contrainte: { label: "Les menaces", angle: "pourquoi", q: "Pourquoi avez-vous accepté ?", fort: "Ils avaient l'adresse de ma mère. Ils m'ont montré des photos d'elle devant chez elle. Je n'avais pas le choix.", faible: "J'avais des dettes. Je voulais rembourser.", geste: true },
    danger: { label: "Le feu", angle: "ou", q: "Où avez-vous mis le feu ? Y avait-il quelqu'un ?", fort: "Dans le local à poubelles, au fond de la cour. Il n'y avait personne, j'avais regardé.", faible: "Devant la porte. Je ne savais pas s'il y avait quelqu'un.", geste: true },
    provocation: { label: "Ce que vous avez vécu avant", angle: "recit", q: "Racontez au juge ce que vous avez vécu avant ce soir-là.", fort: "Ça durait depuis des années. Les coups, les insultes, devant les enfants. Ce soir-là, je n'en pouvais plus.", faible: "On se disputait souvent. Comme tout le monde.", geste: true },
    force_legitime: { label: "L'intervention", angle: "comment", q: "Comment l'intervention s'est-elle déroulée ?", fort: "La personne refusait de lâcher le couteau. J'ai fait le geste qu'on nous apprend, une fois, et c'est tout.", faible: "La personne ne voulait pas obéir. J'ai fait usage de mon arme.", geste: true },
    connaissance: { label: "Le chargement", angle: "recit", q: "Saviez-vous ce que vous transportiez ?", fort: "Non. On m'a demandé de conduire la voiture d'un ami. Je n'ai jamais ouvert le coffre.", faible: "Je me doutais que ce n'était pas net. Mais je n'ai pas demandé." },
    geste_medical: { label: "L'examen", angle: "pourquoi", q: "Pourquoi avez-vous pratiqué cet examen ?", fort: "Parce que les symptômes le demandaient. Je l'ai expliqué à la patiente et je l'ai noté dans le dossier.", faible: "C'est un examen que je fais souvent. Je ne l'ai pas noté." },
  };
  K.factEnjeu = (id) => "C_" + id;
  K.modeleClient = function (s, cs, t, N, enjeux, o) {
    const A = t.A, e = A.g === "f" ? "e" : "";
    const f = (x) => String(x || "").replace(/\{e\}/g, e);
    const sujets = [{ id: "c_faits", label: "Les faits", nom: "les faits", key: ["recit"], q: { recit: "Redites au juge, avec vos mots, ce qui s'est passé." } }];
    const ens = [];
    for (const en of enjeux) {
      const E = K.ENJ[en.id]; if (!E || ens.some((x) => x.E.label === E.label)) continue;
      ens.push({ en, E });
      sujets.push({ id: "e_" + en.id, label: f(E.label), nom: f(E.label).toLowerCase(), key: [E.angle], q: { [E.angle]: f(E.q) } });
    }
    sujets.push({ id: "c_vie", label: "Depuis la mise en examen", nom: "votre vie depuis", key: ["recit", "comment"], q: { recit: "Que faites-vous depuis votre mise en examen ?", comment: "Comment se passent vos journées, en ce moment ?" } });
    if (t.stance !== "nie") sujets.push({ id: "c_regrets", label: "Ce que vous pensez aujourd'hui", nom: "ce que vous pensez aujourd'hui", key: ["recit", "pourquoi"], q: { recit: "Qu'avez-vous à dire aujourd'hui, à la victime et à sa famille ?", pourquoi: "Avec le recul, comment l'expliquez-vous ?" } });
    const idx = (o && o.idx) || 0;
    const jour = s.day;
    const vers = (c) => { let x = (c.vars.interroQA || []).find((y) => y.idx === idx && y.jour === jour); if (!x) { x = { idx, jour, qa: [] }; c.vars.interroQA = (c.vars.interroQA || []).filter((y) => y.idx !== idx).concat([x]); } return x; };
    vers(cs);
    return { t, N, A, G: { e }, f, ens, sujets, topics: {}, dit: {}, poses: [], prep: !!(o && o.prep), detenu: !!(o && o.detenu), vers, contredit: 0, appuis: [] };
  };
  K.repondreClient = function (M, q) {
    const L = (t, f) => ({ t, f: f || null });
    const cle = `${q.sujet}|${q.angle}|${q.forme}`;
    if (M.poses.some((x) => `${x.sujet}|${x.angle}|${x.forme}` === cle)) return { refus: "Votre client a répondu à cette question, maître.", lignes: [] };
    if (q.forme === "confrontation") return { lignes: [L("(Il vous regarde, interdit.) Je ne comprends pas, maître. C'est vous qui me demandez ça ?")] };
    const dejaSujet = !!M.dit[q.sujet];
    const dire = (out, juge) => { (M.dit[q.sujet] = M.dit[q.sujet] || []).push(...out.map((x) => x.t)); return { lignes: out, juge }; };
    if (q.sujet === "c_faits") return dire([L(q.forme === "fermee" ? "Oui, maître." : (M.N.version && M.N.version[M.t.stance]) || "Je maintiens ce que j'ai dit.")]);
    if (q.sujet === "c_vie") {
      if (q.forme === "fermee") return dire([L("Oui. Ça va.")]);
      return dire(M.detenu ? [L("Je travaille aux ateliers. Je suis une formation, je vois la psychologue tous les quinze jours."), L("Je n'ai eu aucun incident en détention.", "C_detention")] : [L("Je respecte toutes mes obligations. Je pointe chaque semaine, je n'ai jamais manqué.", "C_controle"), L(CR.MONDE && CR.MONDE.travaille && CR.MONDE.travaille(M.A) ? "Et je travaille, comme avant." : "Je cherche du travail.")]);
    }
    if (q.sujet === "c_regrets") return dire([L(q.forme === "fermee" ? "Oui." : M.t.stance === "reconnait" ? "Je pense à cette famille tous les jours. Je sais que rien de ce que je dirai ne répare." : "Je regrette ce qui s'est passé. Je n'ai jamais voulu ça.", q.forme === "fermee" ? null : "C_regrets")]);
    const x = M.ens.find((y) => "e_" + y.en.id === q.sujet);
    if (!x) return dire([L("Je ne vois pas ce que vous voulez dire, maître.")]);
    const { en, E } = x;
    if (M.t.stance === "nie" && E.geste) return dire([L("Je n'y étais pas, maître. Je ne peux pas expliquer ce que je n'ai pas fait.")]);
    if (q.forme === "fermee") return dire([L(M.f(E.fort && en.fort ? "Oui." : "Oui… enfin, oui."))]);
    if (q.angle !== E.angle && q.angle !== "recit") return dire([L("Je ne comprends pas la question, maître.")]);
    // un client que personne n'a préparé cherche ses mots : il faut le relancer
    if (!M.prep && !dejaSujet && q.forme !== "relance") return dire([L("Je… je ne sais plus par où commencer. Je l'ai déjà dit aux policiers.")]);
    if (en.fort) { M.appuis.push(K.factEnjeu(en.id)); return dire([L(M.f(E.fort), K.factEnjeu(en.id))]); }
    M.contredit++;
    return dire([L(M.f(E.faible))], [`Ce n'est pas ce que dit le dossier, maître : ${String(en.faible || "").replace(/^« |»$/g, "")}`]);
  };
  K.FAITS_CLIENT = (enjeux) => Object.assign({
    C_detention: { label: "Aucun incident en détention, une formation suivie", key: true, why: "Dit devant le juge, consigné au procès-verbal : à produire au débat sur la détention." },
    C_controle: { label: "Le contrôle judiciaire respecté", key: true, why: "Le client pointe chaque semaine et respecte ses obligations." },
    C_regrets: { label: "Les regrets exprimés devant le juge", key: false },
  }, Object.fromEntries((enjeux || []).filter((en) => K.ENJ[en.id]).map((en) => [K.factEnjeu(en.id), { label: `Les explications de la personne mise en examen : ${String(en.label || "").toLowerCase()}`, key: true, why: "Une explication donnée devant le juge, que le dossier confirme : elle soutient le moyen." }])));

  // ------------------------------------------------------------------ La scène : le compositeur dans le cabinet du juge
  UI.ConfrontParole = function ConfrontParole({ s, cs, addLog, next, cur }) {
    const C = cur.parole, M = C.M, max = C.max || K.MAX;
    const [n, setN] = useState(0);
    const [fin, setFin] = useState(false);
    const poser = (q) => {
      const texte = P.texteQuestion(M, q);
      addLog({ who: "you", t: texte });
      const r = (C.repondre || K.repondre)(M, q);
      M.poses.push(Object.assign({}, q, { texte, rep: r.lignes.map((l) => l.t) }));
      const V = M.vers(cs);
      if (r.refus) { addLog({ who: C.juge || "ji", t: r.refus }); V.qa.push({ q: texte, refus: true }); }
      else {
        for (const l of r.lignes) { addLog({ who: C.who || "temoin", name: C.nom, t: l.t }); if (l.f) CR.addNote(s, cs, { text: l.t, fact: l.f, src: "court" }); }
        for (const j of r.juge || []) addLog({ who: C.juge || "ji", t: j });
        V.qa.push({ q: texte, a: r.lignes.map((l) => ({ t: l.t, f: l.f })), juge: r.juge || null });
      }
      if (M.concessions) { V.concessions = M.concessions.slice(); V.certain = M.certain; }
      if (M.contredit != null) V.contredit = M.contredit;
      CR.spend(s, 3, "court", { busy: true });
      const k = n + 1; setN(k);
      if (k >= max) { setFin(true); addLog({ who: C.juge || "ji", t: "Je m'estime suffisamment informé, maître. Nous allons clore la confrontation." }); }
      CR.store.bump();
    };
    return html`<div className="choices court-choices conf-parole">
      <span className="pix">${C.prompt || "Vos questions (art. 120)"} — ${fin ? "le juge clôt" : `${max - n} question${max - n > 1 ? "s" : ""} au plus`}</span>
      ${!fin && html`<${UI.Composer} M=${M} cs=${cs} onPoser=${poser} desactive=${false} cout=${3} />`}
      <${Btn} kind="primary" small onClick=${next}>${fin ? "Continuer" : n ? "Je n'ai plus de questions" : "Pas de question"}</${Btn}>
    </div>`;
  };

  // ------------------------------------------------------------------ Le procès-verbal de confrontation, tiré de la scène jouée
  K.pv = function (cs, o) {
    const V = cs.vars.confront || { qa: [] };
    const paras = [
      [`Le ${V.jour != null && CR.fmtDate ? CR.fmtDate(V.jour) : "jour de la confrontation"}, en notre cabinet, sont mis en présence ${o.nomA}, personne mise en examen, assisté${o.eA} de Me ${o.avocat}, et ${V.temoin || o.nomT || "le témoin"}, témoin, après prestation de serment.`],
      [`Sur interpellation, le témoin déclare maintenir ses déclarations antérieures${o.premiere ? ` : « ${o.premiere.replace(/\s+$/, "")} »` : "."}`],
      [`Sur interpellation, ${o.nomA} déclare : « ${o.version || "Je maintiens mes déclarations."} »`],
    ];
    if (!V.qa.length) paras.push([`Me ${o.avocat} indique ne pas avoir de question.`]);
    else {
      paras.push([`Questions posées par Me ${o.avocat}, avocat de ${o.nomA} (art. 120 du code de procédure pénale) :`]);
      for (const x of V.qa) paras.push(x.refus ? [`Question : ${x.q} — Le juge d'instruction s'oppose à la question, qui a déjà été posée ; mention en est faite au présent procès-verbal.`] : [`Question : ${x.q} — Réponse : `].concat(x.a.map((l) => (l.f ? { t: l.t + " ", f: l.f } : l.t + " "))));
    }
    paras.push(["Lecture faite par elles-mêmes, les personnes entendues persistent et signent avec nous et le greffier."]);
    return { title: "Procès-verbal de confrontation", kind: "pv", entete: [`Cabinet de ${o.jiNom}, juge d'instruction`, `Information n° ${o.ninfo}`], paras };
  };
})();
