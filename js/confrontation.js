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
    cs.vars.confront = { jour: s.day, temoin: `${T.prenom} ${T.nom}`, qa: [] };
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

  // ------------------------------------------------------------------ La scène : le compositeur dans le cabinet du juge
  UI.ConfrontParole = function ConfrontParole({ s, cs, addLog, next, cur }) {
    const C = cur.parole, M = C.M, max = C.max || K.MAX;
    const [n, setN] = useState(0);
    const [fin, setFin] = useState(false);
    const poser = (q) => {
      const texte = P.texteQuestion(M, q);
      addLog({ who: "you", t: texte });
      const r = K.repondre(M, q);
      M.poses.push(Object.assign({}, q, { texte, rep: r.lignes.map((l) => l.t) }));
      const V = cs.vars.confront || (cs.vars.confront = { jour: s.day, temoin: C.nom, qa: [] });
      if (r.refus) { addLog({ who: C.juge || "ji", t: r.refus }); V.qa.push({ q: texte, refus: true }); }
      else {
        for (const l of r.lignes) { addLog({ who: C.who || "temoin", name: C.nom, t: l.t }); if (l.f) CR.addNote(s, cs, { text: l.t, fact: l.f, src: "court" }); }
        V.qa.push({ q: texte, a: r.lignes.map((l) => ({ t: l.t, f: l.f })) });
      }
      V.concessions = M.concessions.slice(); V.certain = M.certain;
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
