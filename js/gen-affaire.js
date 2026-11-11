/* La Permanence — affaires générées, première partie : briques communes, garde à vue, comparution immédiate, ordonnance pénale.
   Une affaire générée = un tirage (p.t, gen-moteur.js) + son récit (catalogue) + ses pièces (gen-pieces.js) ; la définition
   est reconstruite au chargement d'une sauvegarde (CR.restoreGenerated). Les audiences et le jugement passent par les briques
   communes (AUD.*, PEN.juger) : la qualification, la peine encourue et le tribunal viennent du catalogue. */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const CAT = CR.CAT;
  const GEN2 = CR.GEN2;
  const hm = (m) => CR.fmtTime(((Math.round(m) % 1440) + 1440) % 1440);
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const B = (GEN2.B = {});

  // ------------------------------------------------------------------ Contexte commun d'une affaire générée
  B.ctx = function (p) {
    const t = p.t;
    const N = GEN2.recit(t, p.niveau);
    const PZ = GEN2.pieces(t, N);
    const I = CAT.INF[t.inf];
    const A = t.A, V = t.V;
    const C = t[t.client] || A;
    const e = (x) => GEN2.PR.e(x);
    const nom = (x) => (x ? `${x.prenom} ${x.nom}` : "");
    const civ = (x) => GEN2.PR.civ(x);
    const prevAgg = (t.f.agg || []).filter((a) => !/^r_/.test(a) || t.inf === "homicide_routier" ? false : true).map(CAT.aggPrev).filter(Boolean);
    const concPrev = (N.conc || []).map((c) => ` ; et d'avoir, dans les mêmes circonstances, ${c.prevention}`).join("");
    const pmClient = t.client === "R" && !!t.PM;
    const prevention = (q, ff) => `${N.prevention}${(ff || t.f).agg && t.inf !== "blessures_routieres" && t.inf !== "homicide_routier" ? (ff || t.f).agg.map(CAT.aggPrev).filter(Boolean).map((x) => ", " + x).join("") : ""}${t.rec && !pmClient ? ", en état de récidive légale" : ""}${concPrev}`;
    const IV = CAT.ficheDe(I, t.f);
    const vt = IV.victimeDe ? IV.victimeDe(t.f) : IV.victime;
    // phase 3 : le lieu des faits (SF), son commissariat et son tribunal (TJ)
    const LZ = CR.MONDE.lieuxDe(t);
    return { t, N, PZ, I: IV, A, V, C, e, nom, civ, prevAgg, prevention, vt, q: t.q, q0: CAT.qualifier(t.inf, t.f), conc: t.conc || [], PM: t.PM || null, pmClient, r: CR.seeded(t.sig + ":def"), TJ: LZ.TJ, SF: LZ.F };
  };
  // Le client, au format des définitions d'affaires
  // « Faits prévus et réprimés par… » : l'infraction principale et celles qui l'accompagnent
  B.reprime = (x) => [(x.pmClient ? x.q0 : x.q).court].concat(x.conc.map((c) => c.q.court)).map(CAT.courtLong).join(" ; ");
  B.clientDef = (x, P) => ({ prenom: P.prenom, nom: P.nom, g: P.g, age: P.age, metier: P.metier, tel: P.tel, trust: P.trust || 45, naissance: P.naissance, adresse: P.adresse });

  // ------------------------------------------------------------------ Les preuves, au calcul du délibéré
  B.FORCE = { constat: 0.35, plainte: 0.2, certificat: 0.1, temoin: 0.2, video: 0.3, telephonie: 0.2, adn: 0.35, expertise: 0.15, saisie: 0.35, labo: 0.25, ecrits: 0.35, releve: 0.35, ethylo: 0.5, fichier: 0.5, autopsie: 0.1 };
  B.LABEL = { constat: "Les constatations des policiers", plainte: "Les déclarations de la victime", certificat: "Le certificat médical", temoin: "Le témoignage recueilli", video: "Les images de vidéoprotection", telephonie: "Les données téléphoniques", adn: "La trace ADN", expertise: "L'expertise", saisie: "La perquisition et la saisie", labo: "L'analyse du laboratoire", ecrits: "Les messages", releve: "Les relevés bancaires", ethylo: "La mesure de l'éthylomètre", fichier: "Le fichier des permis de conduire", autopsie: "Le rapport d'autopsie", aveux: "Les déclarations du prévenu aux enquêteurs" };
  B.DOUTE = {
    doute_ident: { label: "L'identification de l'auteur est incertaine", force: 0.25, need: ["G_doute_ident", "arg:doute"] },
    temoin_contra: { label: "Le témoin contredit l'accusation", force: 0.15, need: ["G_temoin_contra", "arg:temoin"] },
    legitime_defense: { label: "La riposte à une agression (légitime défense)", force: 0.35, need: ["G_ld", "arg:ld"] },
    alibi_tel: { label: "Le téléphone du prévenu était ailleurs", force: 0.3, need: ["G_alibi", "arg:alibi"] },
    notif_permis: { label: "La décision de suspension n'a pas été notifiée", force: 0.35, need: ["G_notif_permis", "arg:notif"] },
  };
  B.spec = function (x, aveuxForce) {
    const { t } = x;
    const pieces = {};
    for (const k of t.preuves) {
      if (k === "aveux") { pieces.aveux = { label: B.LABEL.aveux, sens: "charge", force: aveuxForce != null ? aveuxForce : { reconnait: 0.25, minimise: 0.12, nie: 0.03 }[t.stance] }; continue; }
      if (B.FORCE[k] != null) pieces[k] = { label: B.LABEL[k], sens: "charge", force: B.FORCE[k] };
    }
    for (const dd of t.doutes) if (B.DOUTE[dd]) pieces["d_" + dd] = Object.assign({ sens: "decharge" }, B.DOUTE[dd]);
    if (t.videoDoute) pieces.d_video = { label: "Les images de la caméra ne montrent pas le geste reproché", sens: "decharge", force: 0.2, need: ["G_victime_doute", "arg:video"] };
    // n° 12 : le dirigeant qui avait délégué ses pouvoirs à une personne compétente, pourvue d'autorité et de moyens
    if (t.deleg && t.client === "A" && CAT.delegationValide(t.deleg)) pieces.d_deleg = { label: "La délégation de pouvoirs valable (compétence, autorité, moyens)", sens: "decharge", force: 1.2, need: ["arg:delegation"] };
    return { seuil: 0.5, pieces };
  };
  // La requalification plaidée : le fait clé et le texte
  B.REQ = {
    itt: { fact: "G_itt_umj", say: (q2, t) => `L'unité médico-judiciaire fixe l'ITT à ${q2.itt != null ? q2.itt : t && t.f2 && t.f2.itt != null ? t.f2.itt : "moins de huit"} jours : l'arrêt de travail des urgences n'est pas l'ITT pénale. La qualification doit suivre.` },
    reunion: { fact: "G_seul", say: (q2, t) => `Le témoin le dit : ${GEN2.PR.il(t && t.A)} était seul${GEN2.PR.e(t && t.A)}. La réunion n'est pas établie.` },
    violence: { fact: "G_sans_violence", say: () => "Aucune violence : les images et le témoin le montrent. La circonstance tombe." },
    marge: { fact: "G_marge", say: (q2) => "La mesure, marge d'erreur de l'appareil appliquée, est sous le seuil du délit : c'est la contravention de l'article R. 234-1 du code de la route." },
    mort: { fact: "G_mots", say: () => "Le seul témoin n'a pas entendu de menace de mort : la menace de mort n'est pas établie." },
    usage: { fact: "G_conso", say: () => "Aucun matériel de revente, une consommation ancienne et quotidienne : c'est l'usage, de l'article L. 3421-1 du code de la santé publique." },
    leger: { fact: "G_devis", say: () => "Le devis le montre : un dommage léger. C'est la contravention de l'article R. 635-1 du code pénal." },
    vulnerable: { fact: "G_autonome", say: () => "La victime vit sans aide, gère ses comptes : sa vulnérabilité n'était ni apparente ni connue." },
    r_stups: { fact: "G_sans_analyse", say: () => "Aucune analyse sanguine : l'usage de stupéfiants n'est pas établi. Reste l'homicide involontaire de l'article 221-6 du code pénal." },
  };
  B.reqDe = (t) => (t.q2 ? B.REQ[t.quoi] || { fact: "G_circ_doute", say: () => `La circonstance « ${CAT.aggLabel(t.quoi)} » n'est pas établie.` } : null);
  // Arguments de la défense, selon le dossier
  B.argsDefense = function (x, o = {}) {
    const { t, A, q } = x;
    const out = [];
    const GA = GEN2.PR.gram(A);
    if (o.garanties) out.push({ id: "garanties", label: "Un hébergement et des attaches", say: `${GA.Il} a une adresse, une famille qui l'attend, des garanties écrites au dossier.`, cards: ["G_attest", "G_heberg", "G_esr"] });
    out.push({ id: "emploi", label: "Un emploi qu'une peine ferme lui ferait perdre", say: `${GA.Il} travaille ; une peine ferme lui ferait perdre son emploi.`, cards: ["G_attest_emploi", "G_emploi"] });
    if (q.prison > 0) out.push({ id: "amenagement", label: "Une peine aménageable (art. 132-19 et 132-25)", say: "Jusqu'à un an, la peine ferme doit être aménagée si la personnalité le permet.", cards: ["CP_132-19", "CP_132-25"] });
    if (t.doutes.includes("doute_ident")) out.push({ id: "doute", label: "L'identification de l'auteur est incertaine", say: `La victime ne sait pas ${GA.le} reconnaître, l'image ne montre pas son visage : le doute doit lui profiter.`, cards: ["G_doute_ident"] });
    if (t.doutes.includes("temoin_contra")) out.push({ id: "temoin", label: "Le témoin ne confirme pas l'accusation", say: "Le seul témoin neutre ne dit pas ce que dit l'accusation.", cards: ["G_temoin_contra"] });
    if (t.doutes.includes("legitime_defense")) out.push({ id: "ld", label: "La légitime défense (art. 122-5)", say: `${GA.Il} a été attaqué${GA.e} le premier, une bouteille à la main ; ${GA.il} a riposté une fois, dans le même temps : c'est la légitime défense de l'article 122-5 du code pénal.`, cards: ["G_ld", "CP_122-5"] });
    if (t.doutes.includes("alibi_tel")) out.push({ id: "alibi", label: "Son téléphone était ailleurs", say: "La téléphonie le place ailleurs au moment des faits.", cards: ["G_alibi"] });
    if (t.doutes.includes("notif_permis")) out.push({ id: "notif", label: `${GA.Il} ignorait la suspension`, say: `La lettre n'a jamais été retirée : ${GA.il} ne savait pas que son permis était suspendu.`, cards: ["G_notif_permis"] });
    if (t.videoDoute) out.push({ id: "video", label: "Les images de la caméra", say: "Le constat des images le montre : rien de ce qu'on lui reproche n'est visible.", cards: ["G_victime_doute"] });
    const rq = B.reqDe(t);
    if (rq) out.push({ id: "requalif", label: `Requalifier : ${t.q2.label}`, say: rq.say(t.q2, t), cards: [rq.fact].concat(t.q2.textes ? t.q2.textes.slice(0, 1) : []) });
    // n° 12 : un même fait sous deux qualifications ; la confusion avec une peine prononcée ailleurs ; le sursis antérieur ; la délégation
    if (x.conc && x.conc.length) {
      const mf = x.conc.find((c) => c.memeFait);
      const Cu = mf ? CAT.CUMUL[mf.quoi] : null;
      out.push({ id: "cumul", label: "Un même fait, deux qualifications", say: Cu ? `${Cu.motif} Le tribunal doit écarter ${Cu.ecarte}.` : "Ces qualifications visent le même geste : une seule peut être retenue.", cards: mf ? ["G_meme_fait", "JP_CRIM_2021_12_15"] : ["JP_CRIM_2021_12_15"], pertinent: () => !!mf });
    }
    if (t.ant && !t.ant.mineur) out.push({ id: "confusion", label: "La confusion avec la peine déjà prononcée (art. 132-4)", say: `Les faits ont été commis avant que la condamnation du ${CR.fmtDate(t.ant.jug, "long")} soit définitive : les deux poursuites portent sur des infractions en concours. Je vous demande d'ordonner la confusion des peines.`, cards: ["G_ant", "CP_132-4"], pertinent: () => !!t.recid && t.recid.etat === "concours" });
    if (t.recid && t.recid.revocable) out.push({ id: "revocation", label: "Pas de révocation du sursis antérieur (art. 132-36)", say: "La révocation du sursis n'est plus automatique : le tribunal doit la décider spécialement, et rien ne la justifie ici.", cards: ["G_ant", "CP_132-36"] });
    if (t.deleg && t.deleg.existe && t.dirigeantPoursuivi !== false) out.push({ id: "delegation", label: "La délégation de pouvoirs en matière de sécurité", say: `${x.pmClient ? "La société avait" : GA.Il + " avait"} délégué la sécurité à ${t.deleg.qui.prenom} ${t.deleg.qui.nom}, ${t.deleg.qui.poste} : compétence, autorité, moyens.${x.pmClient ? "" : " La responsabilité pénale du dirigeant est écartée."}`, cards: ["G_deleg", "JP_CRIM_1993_03_11"], pertinent: () => !x.pmClient && CAT.delegationValide(t.deleg) });
    out.push({ id: "casier", label: "Un casier vierge", say: "C'est sa première fois devant un tribunal.", pertinent: () => A.casier === 0 });
    out.push({ id: "attenuantes", label: "Les circonstances atténuantes", say: "Je vous demande de lui accorder les circonstances atténuantes.", pertinent: () => false });
    return out;
  };
  // La qualification retenue au jugement : celle de la prévention, ou la requalification plaidée et établie.
  // n° 12 : sans la récidive si la défense l'a fait tomber ; avec les infractions en concours (maximum par nature, art. 132-3),
  // moins la qualification en surnombre que le tribunal écarte (cumul pour un même fait) ; pour la société, l'amende quintuplée.
  B.qPrincipale = (x, api) => (x.pmClient || (api && api.cs.vars.recEcartee) ? x.q0 : x.q);
  B.qualif = function (x) {
    const { t } = x;
    return (api, ctx) => {
      const { cs } = api;
      const rq = B.reqDe(t);
      const played = (ctx && ctx.played) || new Set();
      const recOk = t.rec && !cs.vars.recEcartee && !x.pmClient;
      let q = B.qPrincipale(x, api);
      let favorable = false, motif = "Les éléments de la procédure établissent les faits.";
      let requis = cs.vars.requis;
      if (rq && played.has("arg:requalif") && (played.has(rq.fact) || CR.hasFact(cs, rq.fact))) {
        q = recOk ? t.q2 : CAT.qualifier(t.inf2 || t.inf, t.f2);
        cs.vars.requalifie = true;
        favorable = true;
        motif = `Le tribunal requalifie : ${q.label} (${q.court}).`;
        requis = x.pmClient ? CAT.requisPM(CAT.pourPersonneMorale(q), { ca: x.PM.ca }) : CAT.requisBase(q, B.ctxRequis(x, { recidive: recOk }));
      }
      // concours : les infractions ajoutées, sauf celle que le tribunal écarte (même fait sous deux qualifications)
      const ecarte = B.cumulEcarte(x, api, played);
      const kept = x.conc.filter((c) => !(c.memeFait && ecarte && !(CAT.CUMUL[c.quoi] || {}).reste));
      let qs = [q].concat(kept.map((c) => c.q));
      if (x.pmClient) qs = qs.map(CAT.pourPersonneMorale);
      const enc = qs.length > 1 ? CAT.concours(qs) : { prison: qs[0].prison, amende: qs[0].amende };
      const labs = [q.label].concat(kept.map((c) => (c.memeFait && ecarte && CAT.CUMUL[c.quoi] && CAT.CUMUL[c.quoi].reste ? CAT.CUMUL[c.quoi].reste : c.q.label)));
      const label = labs.length > 1 ? labs.slice(0, -1).join(", ") + " et " + labs[labs.length - 1] : labs[0];
      if (qs.length > 1) motif += " " + CAT.concoursTexte(enc);
      return { id: favorable ? t.inf2 || t.inf : t.inf, label, court: [q.court].concat(kept.map((c) => c.q.court)).join(" ; "), contravention: q.nature === "contravention" && !kept.length, favorable, encourue: { prison: enc.prison, amende: enc.amende }, requis, motif };
    };
  };
  // Le cumul de qualifications pour un même fait : écarté si la défense le plaide, parfois d'office (décidé une fois)
  B.cumulEcarte = function (x, api, played) {
    const { cs, s } = api;
    if (!x.conc.some((c) => c.memeFait)) return false;
    if (cs.vars.cumulDecide == null) {
      const plaide = played && played.has("arg:cumul");
      cs.vars.cumulPlaide = !!plaide;
      cs.vars.cumulDecide = plaide ? R.chance(s, 0.85) : R.chance(s, 0.3);
    }
    return cs.vars.cumulDecide;
  };
  // Réquisitions : calculées au moment où le parquet parle (la récidive a pu tomber, le concours alourdit, la société paie l'amende)
  B.requisDyn = function (x, api) {
    const { t } = x;
    const recOk = t.rec && !api.cs.vars.recEcartee;
    const q = B.qPrincipale(x, api);
    if (x.pmClient) return CAT.requisPM(CAT.pourPersonneMorale(q), { ca: x.PM.ca });
    const b = CAT.requisBase(q, B.ctxRequis(x, { recidive: recOk }));
    if (x.conc.length && b.sursis) { const k = 1 + 0.2 * x.conc.length; b.ferme = Math.round((b.ferme || 0) * k); b.sursis = Math.round(b.sursis * k); }
    return b;
  };
  // phase 3 : les ressources du prévenu (amende) et le lieu des faits (interdiction de paraître)
  B.ctxRequis = (x, o) => { const L = CR.MONDE.lieuxDe(x.t); return Object.assign({ casier: x.A.casier, revenus: x.A.revenu != null ? Math.max(3000, x.A.revenu * 12) : undefined, zone: L.ancien ? undefined : L.F.arr ? `dans le ${L.F.arr} arrondissement` : `à ${L.F.nom}` }, o || {}); };
  B.requis = (x) => CAT.requisBase(x.q, B.ctxRequis(x, { recidive: x.t.rec }));
  // Le parquet demande la révocation du sursis antérieur (sans automaticité, art. 132-36) quand il requiert de la prison ferme
  B.requisApres = (x) => (api) => (x.t.recid && x.t.recid.revocable && (api.cs.vars.requis || {}).ferme > 0 ? `Je requiers en outre la révocation du sursis de ${CR.fmtMois(x.t.ant.peine.sursis)} prononcé le ${CR.fmtDate(x.t.ant.jug, "long")}.` : null);
  B.civil = (x) => (x.V && x.vt === "personne" ? { postes: (x.N.prejudice || []).map((po) => ({ id: po.id, label: po.label, demande: po.demande, base: po.base != null ? po.base : po.demande, justif: po.piece ? ["P_" + po.id] : null, sansJustif: 0.6 })), art475: 800 } : null);
  B.irrDebrief = function (x, cs) {
    const items = [];
    for (const id of x.t.irr) {
      const an = x.PZ.anomalies[id];
      if (!an) continue;
      const ir = CR.IRREG[an.irreg];
      const vu = cs.proc.moyens.some((m) => m.flag === id) || cs.flags["obs_" + id] || cs.issues.some((i) => i.flag === id);
      items.push(vu ? { kind: "good", text: `Vous avez relevé : ${ir.label.toLowerCase()}.` } : { kind: "surprise", text: `Personne n'a relevé ce que contenait ${(x.PZ.titres[an.piece] || "une pièce").replace(/ \(D\d+\)$/, "").toLowerCase()} : ${ir.label.toLowerCase()} (${ir.textes.map((k) => CR.keyLabel ? CR.keyLabel(k) : k).join(", ")}).` });
    }
    const rq = B.reqDe(x.t);
    if (rq) items.push(cs.vars.requalifie ? { kind: "good", text: `Vous avez obtenu la requalification : ${x.t.q2.label} (${x.t.q2.court}).` } : { kind: "surprise", text: `Une requalification était possible : ${x.t.q2.label} (${x.t.q2.court}). Le fait qui la portait : « ${(x.PZ.facts[rq.fact] || {}).label || rq.fact} ».` });
    return items;
  };
  B.notions = (x) => [{ titre: x.I.nom, regle: `${x.I.elements.materiel} ${x.I.elements.moral}`, art: x.q.court, prog: "dps" }];
  B.corrige = (x) => {
    const { t, q, I } = x;
    const out = [{ probleme: "Quelle infraction, quelle peine ?", regle: `${CR.cap(q.label)} : ${CAT.encourueTexte(q)} (${q.court})${t.rec ? ", maximum doublé en récidive légale (art. 132-10)" : ""}. Prescription : ${q.prescAns} an${q.prescAns > 1 ? "s" : ""}.`, application: x.N.resume }];
    if (t.q2) out.push({ probleme: "Une autre qualification ?", regle: `${CR.cap(t.q2.label)} (${t.q2.court}) : ${CAT.encourueTexte(t.q2)}.`, application: B.reqDe(t).say(t.q2, t) });
    for (const id of t.irr) { const an = x.PZ.anomalies[id]; if (an) { const ir = CR.IRREG[an.irreg]; out.push({ probleme: ir.label, regle: ir.regle, application: `${x.PZ.titres[an.piece] || "Pièce"} : ${ir.effet}.` }); } }
    return out.concat(B.corrigeN12 ? B.corrigeN12(x) : []);
  };

  // =================================================================== N° 12 : récidive, exceptions, jugement, débrief, fiche
  const D = (d) => CR.fmtDate(d, "long");
  const cap = (s0) => (s0 ? s0[0].toUpperCase() + s0.slice(1) : s0);
  // Ce que le président lit du casier
  B.casierLigne = function (x) {
    const { t, A } = x;
    if (!A.casier || !t.ant) return A.casier === 0 ? "Votre casier est vierge." : t.rec ? "Votre casier : une condamnation récente pour des faits similaires. Vous êtes en récidive légale." : "Votre casier porte une ancienne condamnation.";
    const an = t.ant;
    const quoi = `${an.juridiction}, ${D(an.jug)} : ${an.label}`;
    return `Votre casier : ${quoi}.${t.rec ? " Le parquet vous poursuit en état de récidive légale." : ""}`;
  };
  // La défense peut discuter la récidive (art. 132-16-5 : le prévenu est informé et présente ses observations)
  B.stepsRecidive = function (x) {
    const { t } = x;
    if (!t.rec || !t.recid) return [];
    const opts = Object.keys(GEN2.VICES).map((k) => ({ t: `« La récidive n'est pas constituée : ${GEN2.VICES[k].replace(/^./, (c) => c.toLowerCase())}. »`, need: "G_ant", then: [{ do: (a) => a.run("_contesterRecidive", { motif: k }) }] }));
    return [
      { who: "president", t: "Maître, des observations sur l'état de récidive ?" },
      { choose: opts.concat([{ t: "« Pas d'observation sur la récidive. »", then: [{ do: (a) => a.run("_contesterRecidive", { motif: null }) }] }]) },
    ];
  };
  B.contesterRecidive = function (x, api, motif) {
    const { t, q } = x;
    const { cs } = api;
    const an = t.ant;
    if (!motif) { cs.vars.recSilence = true; return [{ who: "president", t: "Bien." }]; }
    cs.vars.recContestee = motif;
    if (t.recid.vice && motif === t.recid.vice) {
      cs.vars.recEcartee = true;
      const pourquoi = { non_definitive: `le jugement du ${D(an.jug)} n'est devenu définitif que le ${D(an.def)}, après les faits du ${D(t.d.faits)}`, delai: `la précédente peine a pris fin le ${D(an.fin)}, plus de cinq ans avant les faits`, non_assimilee: `${an.label} et ${CAT.INF[t.inf].nom.toLowerCase()} ne sont ni identiques ni assimilés` }[motif];
      return [{ who: "parquet", t: `(Le substitut relit le bulletin n° 1.) En effet : ${pourquoi}. Le ministère public ne retient pas la récidive.` }, { who: "president", t: "Le tribunal en prend acte : l'état de récidive légale est écarté des débats.", fx: { cred: 3 }, signal: "bon" }];
    }
    const EL = CAT.etatLegal(an, { inf: t.inf, q: x.q0, faits: t.d.faits });
    const reponse = t.recid.valide
      ? { non_definitive: `La condamnation du ${D(an.jug)} est devenue définitive le ${D(an.def)}, avant les faits.`, delai: `La précédente peine a pris fin le ${D(an.fin)} : les faits sont dans le délai${EL.delai ? ` de ${EL.delai === 1 ? "un an" : EL.delai === 10 ? "dix ans" : "cinq ans"}` : ""}.`, non_assimilee: EL.assimilation && EL.assimilation.art !== "132-10" ? `Les deux délits sont assimilés au regard de la récidive (art. ${EL.assimilation.art}).` : EL.art === "132-9" ? "Le premier terme est un délit puni de dix ans : l'article 132-9 n'exige pas l'identité des délits." : "C'est le même délit." }[motif]
      : `Ce n'est pas la question : ${{ non_definitive: `la condamnation est devenue définitive le ${D(an.def)}, avant les faits`, delai: "les faits sont dans le délai", non_assimilee: "les délits sont assimilés" }[motif]}.`;
    return [{ who: "parquet", t: `${reponse} La récidive est constituée${t.recid.valide ? ` (art. ${t.recid.art})` : ""}.` }, { who: "president", t: "Le tribunal appréciera.", fx: { cred: -2 }, signal: "mauvais" }];
  };
  // Avant le fond : la plainte préalable de l'administration fiscale, la prescription des infractions dissimulées
  B.stepsAvantFond = function (x) {
    const { t } = x;
    const out = [];
    if (t.inf === "fraude_fiscale" && t.f.plainte) out.push({ choose: [
      { t: "« Les poursuites pour fraude fiscale sont irrecevables : ni plainte ni dénonciation de l'administration (art. L. 228 LPF). »", need: "G_fisc_origine", then: [{ do: (a) => a.run("_exceptionN12", { quoi: "fisc" }) }] },
      { t: "« Rien sur la recevabilité des poursuites. »" },
    ] });
    if (t.presc) out.push({ choose: [
      { t: "« L'action publique est prescrite : les dépenses figuraient dans les comptes approuvés il y a plus de six ans (art. 8 et 9-1 CPP). »", need: "G_comptes", then: [{ do: (a) => a.run("_exceptionN12", { quoi: "presc" }) }] },
      { t: "« Rien sur la prescription. »" },
    ] });
    return out;
  };
  B.exceptionN12 = function (x, api, quoi) {
    const { t } = x;
    const { cs } = api;
    if (quoi === "fisc") {
      cs.vars.fiscSouleve = true;
      if (t.f.plainte === "aucune") { cs.vars.fiscIrrecevable = true; return [{ who: "parquet", t: "(Un silence.) La procédure part d'un signalement de Tracfin ; l'administration n'a ni déposé plainte ni dénoncé les faits. Je m'en rapporte." }, { who: "president", t: "Le tribunal joint l'incident au fond.", fx: { cred: 3 }, signal: "bon" }]; }
      return [{ who: "parquet", t: t.f.plainte === "ciff" ? "La plainte de l'administration, déposée après avis conforme de la commission des infractions fiscales, est à la procédure." : "La dénonciation obligatoire de l'administration au procureur est à la procédure (art. L. 228 LPF)." }, { who: "president", t: "L'exception est rejetée.", fx: { cred: -2 }, signal: "mauvais" }];
    }
    cs.vars.prescSoulevee = true;
    const P = CAT.prescriptionOcculte(t.presc, x.q0.prescAns);
    if (P.acquise) { cs.vars.prescriptionAcquise = true; return [{ who: "parquet", t: `Les dépenses figuraient dans les comptes approuvés le ${D(t.presc.comptes)}, sans manœuvre pour les cacher. Je ne peux que constater le délai.` }, { who: "president", t: "Le tribunal joint l'incident au fond.", fx: { cred: 3 }, signal: "bon" }]; }
    return [{ who: "parquet", t: `Les dépenses ont été dissimulées sous de fausses factures : la prescription n'a couru qu'à compter de leur découverte, le ${D(t.presc.decouverte)} (art. 9-1). L'action n'est pas prescrite.` }, { who: "president", t: "L'exception est rejetée.", fx: { cred: -2 }, signal: "mauvais" }];
  };
  // Le jugement : l'irrecevabilité ou la prescription d'abord ; puis, après PEN.juger, la récidive, le cumul, la confusion,
  // la révocation du sursis — chaque fois la règle et ses articles
  B.juger = function (x, api, st, juger) {
    const { t } = x;
    const { cs, s } = api;
    const nomP = x.pmClient ? x.PM.nom : x.nom(x.A);
    if (cs.vars.prescriptionAcquise || (cs.vars.fiscIrrecevable && !x.conc.length)) {
      const presc = !!cs.vars.prescriptionAcquise;
      const q0 = { q: presc ? "Sur la prescription de l'action publique" : "Sur la recevabilité des poursuites", r: presc ? `Le tribunal constate l'extinction de l'action publique par la prescription et renvoie ${nomP} des fins de la poursuite.` : `Le tribunal déclare irrecevables les poursuites engagées du chef de fraude fiscale.`, motif: presc ? `Les dépenses figuraient, sans dissimulation, dans les comptes approuvés le ${D(t.presc.comptes)} : la prescription de six ans a couru de cette date (art. 8 et 9-1 CPP ; Crim. 5 mai 1997).` : "Les poursuites pour fraude fiscale supposent une plainte de l'administration ou sa dénonciation obligatoire (art. L. 228 LPF) ; aucune ne figure à la procédure." };
      cs.vars.jugementDay = s.day;
      cs.vars.decision = { coupable: false, qualif: null, peine: null, civil: null };
      cs.proc.decisions.push({ day: s.day, type: "jugement", coupable: false });
      CR.PROC.event(api, `Jugement : ${presc ? "action publique prescrite" : "poursuites irrecevables"}.`);
      cs.vars.debriefJugement = [];
      return { titre: "Jugement correctionnel", entete: `${x.TJ.tc} — audience du ${D(s.day)}. Jugement contradictoire.`, questions: [q0], dispositif: presc ? `Constate la prescription de l'action publique ; renvoie ${nomP} des fins de la poursuite.` : "Déclare irrecevables les poursuites.", coupable: false, qualif: null, peine: null, civil: null };
    }
    const played = st && st.played instanceof Set ? st.played : new Set((st && st.played) || []);
    cs.vars.argsJoues = [...played].filter((k) => /^arg:/.test(k)).map((k) => k.slice(4));
    const dec = juger();
    return B.apresJugement(x, api, dec, st);
  };
  B.apresJugement = function (x, api, dec, st) {
    const { t } = x;
    const { cs, s } = api;
    if (!dec) return dec;
    const played = st && st.played instanceof Set ? st.played : new Set((st && st.played) || []);
    const Q = dec.questions;
    const addQ = (q, r, motif, apres) => { const j = Q.findIndex((y) => y.q === (apres === "peine" ? "Sur la peine" : "Sur la culpabilité")); const i = Q.findIndex((y) => /^Sur l'action civile/.test(y.q)); Q.splice(j >= 0 ? j + 1 + Q.slice(j + 1).filter((y) => y._n12 && y._ap === apres).length : i >= 0 ? i : Q.length, 0, { q, r, motif, _n12: true, _ap: apres }); };
    if (!dec.coupable) return dec;
    const casierOk = !x.pmClient;
    // récidive
    if (casierOk && t.recid && t.rec) {
      if (cs.vars.recEcartee) addQ("Sur la récidive", "Le tribunal ne retient pas l'état de récidive légale visé à la prévention.", `${GEN2.VICES[t.recid.vice]} : ${CAT.etatLegal(t.ant, { inf: t.inf, q: x.q0, faits: t.d.faits }).regle}`);
      else addQ("Sur la récidive", "Le tribunal retient l'état de récidive légale visé à la prévention.", t.recid.valide ? CAT.etatLegal(t.ant, { inf: t.inf, q: x.q0, faits: t.d.faits }).regle : "La défense n'a présenté aucune observation sur la récidive (art. 132-16-5).");
    }
    // cumul de qualifications
    const mf = x.conc.find((c) => c.memeFait);
    if (mf) {
      const Cu = CAT.CUMUL[mf.quoi];
      addQ("Sur le cumul de qualifications", cs.vars.cumulDecide ? `Le tribunal écarte ${Cu.ecarte}${Cu.reste ? " et ne retient que le faux" : ""}.` : "Le tribunal retient l'ensemble des qualifications de la prévention.", cs.vars.cumulDecide ? `${Cu.motif} (Crim. 15 déc. 2021, n° 21-81.864).` : "Aucune observation de la défense sur le cumul.");
    }
    const pn = dec.peine;
    // confusion des peines (art. 132-4) ou réitération (art. 132-16-7)
    if (casierOk && played.has("arg:confusion") && t.ant && pn) {
      if (t.recid && t.recid.etat === "concours" && R.chance(s, 0.75)) {
        pn.confusion = true; cs.vars.confusion = true;
        addQ("Sur la confusion des peines", `Le tribunal ordonne la confusion totale de la présente peine avec celle prononcée le ${D(t.ant.jug)} par le ${t.ant.juridiction.replace(/^Tribunal/, "tribunal")}.`, "Les faits ont été commis avant que cette condamnation soit définitive : les infractions sont en concours (art. 132-2) ; la dernière juridiction appelée à statuer peut confondre les peines de même nature (art. 132-4).", "peine");
      } else addQ("Sur la confusion des peines", "Le tribunal rejette la demande de confusion.", t.recid && t.recid.etat === "reiteration" ? "Les faits ont été commis après une condamnation définitive : en réitération, les peines se cumulent sans confusion possible avec la précédente (art. 132-16-7)." : t.recid && t.recid.etat === "recidive" ? "En récidive, la confusion avec la peine du premier terme est exclue : les infractions ne sont pas en concours (art. 132-2)." : "Le tribunal use de son pouvoir d'appréciation (art. 132-4).", "peine");
    }
    // révocation du sursis antérieur : par décision spéciale, et seulement avec une peine ferme (art. 132-36)
    if (casierOk && t.recid && t.recid.revocable && pn) {
      if (pn.ferme > 0) {
        const p = played.has("arg:revocation") ? 0.3 : 0.65;
        const rev = R.chance(s, p);
        if (rev) { const m = R.chance(s, 0.5) ? t.ant.peine.sursis : Math.max(1, Math.round(t.ant.peine.sursis / 2)); pn.revocation = m; cs.vars.revocation = m; }
        addQ("Sur le sursis antérieur", rev ? `Par décision spéciale, le tribunal révoque ${pn.revocation === t.ant.peine.sursis ? "totalement" : "partiellement, à hauteur de " + CR.fmtMois(pn.revocation) + ","} le sursis accordé le ${D(t.ant.jug)}.` : `Le tribunal ne révoque pas le sursis accordé le ${D(t.ant.jug)}.`, "La révocation n'est plus automatique : elle suppose une décision spéciale et une nouvelle peine d'emprisonnement sans sursis, pour des faits commis dans le délai d'épreuve de cinq ans (art. 132-35 et 132-36).", "peine");
      } else { cs.vars.revocation = 0; addQ("Sur le sursis antérieur", "Le sursis antérieur n'est pas révoqué.", "Sans peine d'emprisonnement ferme, la révocation est impossible (art. 132-36).", "peine"); }
    }
    // la société : une amende arrondie au millier d'euros, motivée par sa taille et sa réaction
    if (pn && x.pmClient) {
      const ancien = pn.texte.replace(/^./, (c) => c.toLowerCase());
      if (pn.amende) pn.amende = Math.max(1000, Math.round(pn.amende / 1000) * 1000);
      pn.texte = CR.PROC.peineTexte(pn);
      const iq = Q.findIndex((q) => q.q === "Sur la peine");
      if (iq >= 0) { Q[iq].r = pn.texte + "."; Q[iq].motif = `Personne morale : amende encourue de ${CR.money(dec.qualif && dec.qualif.encourue ? dec.qualif.encourue.amende : 0)}, le quintuple de celle des personnes physiques (art. 131-38) ; le tribunal tient compte de la taille de la société et des mesures qu'elle a prises.`; }
      dec.dispositif = dec.dispositif.replace(ancien, pn.texte.replace(/^./, (c) => c.toLowerCase()));
      cs.vars.peine = pn;
    }
    if (pn && (pn.confusion || pn.revocation)) {
      const plus = (pn.confusion ? `, confondue avec la peine prononcée le ${D(t.ant.jug)}` : "") + (pn.revocation ? ` ; révocation du sursis antérieur à hauteur de ${CR.fmtMois(pn.revocation)}` : "");
      const ancien = pn.texte.replace(/^./, (c) => c.toLowerCase());
      pn.texte = CR.PROC.peineTexte(pn) + plus;
      const iq = Q.findIndex((q) => q.q === "Sur la peine");
      if (iq >= 0) Q[iq].r = pn.texte + ".";
      cs.vars.peine = pn;
      dec.dispositif = dec.dispositif.includes(ancien) ? dec.dispositif.replace(ancien, pn.texte.replace(/^./, (c) => c.toLowerCase())) : dec.dispositif.replace(/\.$/, "") + plus.replace(/^, /, " ; ") + ".";
    }
    return dec;
  };
  // Débrief : la règle appliquée, avec ses articles, chaque fois
  B.debriefN12 = function (x, cs) {
    const { t } = x;
    const out = [];
    if (x.conc.length) {
      const qs = [x.q].concat(x.conc.map((c) => c.q)).map(x.pmClient ? CAT.pourPersonneMorale : (q) => q);
      out.push({ kind: "rule", text: CAT.concoursTexte(CAT.concours(qs)) });
      const mf = x.conc.find((c) => c.memeFait);
      if (mf) { const Cu = CAT.CUMUL[mf.quoi]; out.push(cs.vars.cumulPlaide && cs.vars.cumulDecide ? { kind: "good", text: `Vous avez fait écarter ${Cu.ecarte} : ${Cu.motif}` } : cs.vars.cumulDecide ? { kind: "info", text: `Le tribunal a écarté d'office ${Cu.ecarte} : ${Cu.motif}` } : { kind: "surprise", text: `Un même fait était poursuivi deux fois : ${Cu.motif} Il fallait plaider le cumul (Crim. 15 déc. 2021, n° 21-81.864).` }); }
    }
    if (t.recid && t.ant && !t.ant.mineur && !x.pmClient) {
      const EL = CAT.etatLegal(t.ant, { inf: t.inf, q: x.q0, faits: t.d.faits });
      if (t.recid.vice) out.push(cs.vars.recEcartee ? { kind: "good", text: `Vous avez fait tomber une récidive retenue à tort : ${GEN2.VICES[t.recid.vice].toLowerCase()}. ${EL.regle}` } : { kind: "surprise", text: `La récidive n'était pas constituée — ${GEN2.VICES[t.recid.vice].toLowerCase()} (casier : ${t.ant.label}, jugement du ${D(t.ant.jug)}, définitif le ${D(t.ant.def)}). ${EL.regle} Sans observation de la défense, le jugement l'a retenue et le maximum a été doublé à tort ; l'appel permettait encore de la discuter.` });
      else if (t.recid.valide) out.push(Object.assign({ kind: cs.vars.recContestee ? "bad" : "rule", text: `${cs.vars.recContestee ? "Vous avez contesté une récidive constituée. " : ""}${EL.regle}` }));
      else if (EL.etat === "reiteration") out.push({ kind: "rule", text: EL.regle });
      else if (EL.etat === "concours") out.push({ kind: "rule", text: EL.regle });
      else if (EL.regle) out.push({ kind: "rule", text: EL.regle });
      if (t.recid.etat === "concours") out.push(cs.vars.confusion ? { kind: "good", text: "Vous avez obtenu la confusion des peines (art. 132-4) : les faits étaient en concours avec la condamnation antérieure." } : { kind: "surprise", text: `La condamnation du ${D(t.ant.jug)} n'était pas définitive au jour des faits : concours d'infractions (art. 132-2), la confusion pouvait être demandée au tribunal (art. 132-4).` });
      if (t.recid.revocable) out.push({ kind: cs.vars.revocation ? "info" : "rule", text: `Sursis antérieur (${CR.fmtMois(t.ant.peine.sursis)}, ${D(t.ant.jug)}) : la révocation n'est plus automatique ; le tribunal la prononce par décision spéciale, avec une peine ferme, pour des faits commis dans les cinq ans (art. 132-35 et 132-36)${cs.vars.revocation ? ` — ici ${CR.fmtMois(cs.vars.revocation)} révoqués` : cs.vars.revocation === 0 ? " — ici, pas de révocation" : ""}.` });
    }
    out.push(...B.debriefAffaires(x, cs));
    return out;
  };
  // Pénal des affaires : personne morale, amende quintuplée, délégation, parquet national financier, CJIP, plainte fiscale, prescription
  B.debriefAffaires = function (x, cs) {
    const { t } = x;
    const out = [];
    if (t.PM) {
      const qpm = CAT.pourPersonneMorale(x.q0);
      out.push({ kind: "rule", text: `${t.PM.nom} répond des infractions commises pour son compte par ses organes ou représentants (art. 121-2), sans que cela efface la responsabilité des personnes physiques. Son amende encourue est le quintuple de celle des personnes physiques : ${CR.money(qpm.amende)} au lieu de ${CR.money(x.q0.amende)} (art. 131-38) ; d'autres peines sont possibles (art. 131-39).` });
      if (t.dirigeantPoursuivi === false) out.push({ kind: "info", text: `Le dirigeant, ${x.nom(x.A)}, n'a pas été poursuivi : la délégation de pouvoirs valable déplaçait la responsabilité ; la société, elle, répondait de la faute de son délégataire, qui est son représentant.` });
    }
    if (t.deleg) {
      const ok = CAT.delegationValide(t.deleg);
      const def = CAT.delegationDefaut(t.deleg);
      const vu = cs.vars.argsJoues && cs.vars.argsJoues.includes("delegation");
      out.push({ kind: ok && !x.pmClient && vu ? "good" : "rule", text: `Délégation de pouvoirs : le dirigeant qui n'a pas pris part à l'infraction s'exonère s'il a délégué ses pouvoirs à une personne pourvue de la compétence, de l'autorité et des moyens nécessaires (Crim. 11 mars 1993). ${!t.deleg.existe ? "Ici, aucune délégation n'avait été consentie." : ok ? `Celle de ${t.deleg.qui.prenom} ${t.deleg.qui.nom} était valable.` : `Celle de ${t.deleg.qui.prenom} ${t.deleg.qui.nom} ne l'était pas : il lui manquait ${CAT.DELEG_LABEL[def]}.`}${x.pmClient ? " Elle ne protège jamais la société : le délégataire est son représentant (art. 121-2)." : ""}` });
    }
    if (t.pnf) out.push({ kind: "rule", text: "Dossier complexe d'atteinte à la probité ou de fraude fiscale : le parquet national financier exerce une compétence concurrente sur tout le territoire, devant le tribunal correctionnel de Paris (art. 705 CPP)." });
    if (t.cjip) out.push({ kind: cs.vars.cjip === "accepte" ? "good" : "rule", text: `Convention judiciaire d'intérêt public (art. 41-1-2 CPP) : proposée à la société avant toute poursuite, amende d'intérêt public plafonnée à 30 % du chiffre d'affaires moyen (${CR.money(CAT.cjipPlafond(t.PM.ca))} ici), validée en audience publique, sans déclaration de culpabilité ni inscription au casier ; les dirigeants restent poursuivables.${cs.vars.cjip === "accepte" ? ` La société l'a signée : ${CR.money(t.cjip.amende)}.` : cs.vars.cjip === "refuse" ? " La société l'a refusée : elle s'exposait au procès et à l'amende quintuplée." : ""}` });
    if (t.inf === "fraude_fiscale" && t.f.plainte) out.push(t.f.plainte === "aucune" ? (cs.vars.fiscIrrecevable ? { kind: "good", text: "Vous avez soulevé l'irrecevabilité : sans plainte de l'administration ni dénonciation obligatoire, le parquet ne peut poursuivre la fraude fiscale (art. L. 228 LPF) ; le blanchiment de fraude fiscale, lui, n'exige pas de plainte (Crim. 20 févr. 2008)." } : { kind: "surprise", text: "La procédure partait d'un signalement de Tracfin : aucune plainte de l'administration, aucune dénonciation. Les poursuites pour fraude fiscale étaient irrecevables (art. L. 228 LPF)." }) : { kind: "rule", text: `Fraude fiscale : poursuites recevables, sur ${t.f.plainte === "ciff" ? "plainte de l'administration après avis conforme de la commission des infractions fiscales" : "dénonciation obligatoire de l'administration"} (art. L. 228 LPF).` });
    if (t.presc) { const P = CAT.prescriptionOcculte(t.presc, x.q0.prescAns); out.push(P.acquise ? (cs.vars.prescriptionAcquise ? { kind: "good", text: `Vous avez plaidé la prescription : sans dissimulation, elle court de la présentation des comptes (${D(t.presc.comptes)}) ; six ans plus tard, l'action était éteinte (art. 8 et 9-1 CPP ; Crim. 5 mai 1997).` } : { kind: "surprise", text: `L'action publique était prescrite : les dépenses figuraient sans dissimulation dans les comptes approuvés le ${D(t.presc.comptes)} ; le délai de six ans courait de là (art. 8 et 9-1 CPP).` }) : { kind: cs.vars.prescSoulevee ? "bad" : "rule", text: `Infraction dissimulée (fausses factures) : la prescription n'a couru qu'à compter de la découverte, le ${D(t.presc.decouverte)}, dans la limite de douze ans après les faits (art. 9-1 CPP).${cs.vars.prescSoulevee ? " L'exception était vouée à l'échec." : ""}` }); }
    return out;
  };
  // Fiche de révision : les notions du n° 12 présentes dans l'affaire
  B.notionsN12 = function (x) {
    const { t } = x;
    const out = [];
    if (x.conc.length) out.push({ titre: "Le concours d'infractions", regle: "Plusieurs infractions jugées ensemble : une seule peine de chaque nature, dans la limite du maximum le plus élevé ; les amendes contraventionnelles se cumulent ; un même fait ne peut fonder deux déclarations de culpabilité si l'une des qualifications est un élément ou une circonstance de l'autre.", art: "art. 132-2 à 132-7 CP ; Crim. 15 déc. 2021", prog: "dpg" });
    if (t.recid && t.ant && !t.ant.mineur && !x.pmClient) {
      const EL = CAT.etatLegal(t.ant, { inf: t.inf, q: x.q0, faits: t.d.faits });
      if (EL.etat === "recidive" || t.recid.vice) out.push({ titre: "La récidive légale", regle: "Un premier terme définitif avant les nouveaux faits ; un second terme dans le délai (5 ans pour les délits, 10 ans après un délit puni de dix ans, un an pour les contraventions, sans délai pour les crimes) ; le même délit ou un délit assimilé. Effet : maximum doublé (ou relevé pour les crimes).", art: "art. 132-8 à 132-11 et 132-16 à 132-16-5 CP", prog: "dpg" });
      if (EL.etat === "reiteration") out.push({ titre: "La réitération", regle: "Une nouvelle infraction après une condamnation définitive, sans les conditions de la récidive : pas d'aggravation du maximum, mais pas de confusion avec la peine précédente.", art: "art. 132-16-7 CP", prog: "dpg" });
      if (EL.etat === "concours") out.push({ titre: "La confusion des peines", regle: "Des infractions en concours jugées séparément : les peines s'exécutent cumulativement dans la limite du maximum le plus élevé, mais la dernière juridiction peut en ordonner la confusion.", art: "art. 132-4 CP", prog: "dpg" });
      if (t.recid.revocable) out.push({ titre: "Le sursis antérieur", regle: "La révocation du sursis simple n'est plus automatique : décision spéciale, avec une nouvelle peine d'emprisonnement sans sursis, pour des faits commis dans le délai d'épreuve.", art: "art. 132-35 et 132-36 CP", prog: "dpg" });
    }
    if (t.PM) out.push({ titre: "La responsabilité des personnes morales", regle: "Infraction commise pour son compte par un organe ou un représentant ; amende quintuplée ; peines propres (dissolution, exclusion des marchés publics, affichage…).", art: "art. 121-2, 131-38 et 131-39 CP", prog: "dps" });
    if (t.deleg) out.push({ titre: "La délégation de pouvoirs", regle: "Le dirigeant s'exonère s'il a délégué à une personne pourvue de la compétence, de l'autorité et des moyens nécessaires ; la société reste responsable du fait de son délégataire.", art: "Crim. 11 mars 1993 ; art. 121-2 et 121-3 CP", prog: "dps" });
    if (t.cjip) out.push({ titre: "La convention judiciaire d'intérêt public", regle: "Personne morale, probité ou fraude fiscale ; amende jusqu'à 30 % du chiffre d'affaires moyen, programme de conformité ; validation en audience publique ; ni culpabilité ni casier.", art: "art. 41-1-2 CPP", prog: "dps" });
    if (t.pnf) out.push({ titre: "Le parquet national financier", regle: "Compétence concurrente nationale pour les affaires complexes de probité, de fraude fiscale et de blanchiment.", art: "art. 705 CPP", prog: "dps" });
    if (t.inf === "fraude_fiscale" && t.f.plainte) out.push({ titre: "La plainte préalable de l'administration", regle: "La fraude fiscale ne se poursuit que sur plainte de l'administration (avis conforme de la commission des infractions fiscales) ou sur sa dénonciation obligatoire ; pas le blanchiment de fraude fiscale.", art: "art. L. 228 LPF ; art. 1741 CGI", prog: "dps" });
    if (t.presc) out.push({ titre: "Les infractions occultes ou dissimulées", regle: "La prescription court du jour où l'infraction est apparue, dans la limite de douze ans pour un délit ; pour l'abus de biens sociaux, de la présentation des comptes, sauf dissimulation.", art: "art. 9-1 CPP ; Crim. 5 mai 1997", prog: "dps" });
    return out;
  };
  B.corrigeN12 = function (x) {
    const { t } = x;
    const out = [];
    if (x.conc.length) { const mf = x.conc.find((c) => c.memeFait); out.push({ probleme: "Plusieurs infractions : quel maximum ?", regle: CAT.concoursTexte(CAT.concours([x.q].concat(x.conc.map((c) => c.q)))), application: mf ? CAT.CUMUL[mf.quoi].motif : "Des faits distincts : chaque qualification peut être retenue, mais une seule peine d'emprisonnement." }); }
    if (t.recid && t.ant && !t.ant.mineur && !x.pmClient) { const EL = CAT.etatLegal(t.ant, { inf: t.inf, q: x.q0, faits: t.d.faits }); out.push({ probleme: "La récidive est-elle constituée ?", regle: "Premier terme définitif avant les faits, délai, même délit ou délit assimilé (art. 132-8 à 132-11, 132-16 à 132-16-4) ; sinon réitération (art. 132-16-7) ou concours (art. 132-2).", application: `Casier : ${t.ant.label}, ${t.ant.juridiction}, ${D(t.ant.jug)}, définitif le ${D(t.ant.def)}. ${EL.regle || "Pas d'état légal particulier."}` }); }
    if (t.PM) out.push({ probleme: "Qui est poursuivi, et pour quelle amende ?", regle: "La personne morale (art. 121-2), à côté ou à la place du dirigeant ; amende quintuplée (art. 131-38).", application: `${t.PM.nom} : ${CR.money(CAT.pourPersonneMorale(x.q0).amende)} au plus.` });
    return out;
  };

  // =================================================================== GARDE À VUE (permanence) et COMPARUTION IMMÉDIATE
  B.penal = function (p) {
    const x = B.ctx(p);
    const { t, N, PZ, I, A, V, e, nom, q } = x;
    const nomc = nom(A);
    const il = A.g === "f" ? "elle" : "il";
    const Il = A.g === "f" ? "Elle" : "Il";
    const rec = t.rec;
    const ci = p.kind === "ci";
    const C0 = PZ.C;
    const facts = Object.assign({}, PZ.facts);
    const pcV = !!V && x.vt === "personne";
    const docs = PZ.docs, docTitles = PZ.titres;
    const dossierCI = PZ.listes.dossier;
    const anomalies = PZ.anomalies;
    const enquete = t.camera ? [{ id: "video", type: "video", titre: "La caméra privée des lieux", desc: "Une caméra privée, à l'endroit des faits. Le gérant dit que les images sont écrasées au bout de sept jours.", piste: ["G_camera"],
      limite: () => C0.jg + 7,
      modes: [{ id: "lettre", label: "Écrire au gérant et au parquet", sub: "Demande de conservation, copie au parquet. Gratuit, mais il faut le temps que la demande arrive.", temps: 25, delai: 8, saisie: 3 }, { id: "constat", label: "Mandater un commissaire de justice pour un constat", sub: "Il visionne les images sur place dès le lendemain.", argent: 380, frais: "Constat de commissaire de justice", delai: 3, saisie: 1 }],
      doc: "enq_video", titrePiece: "Constat : les images de la caméra",
      envoi: (api, st) => ({ from: st.mode === "constat" ? "Me Laure Dumas, commissaire de justice" : x.TJ.parquet, subject: "Images de la caméra", body: [["Maître, vous trouverez ci-joint le procès-verbal de constat des images."]] }),
      perdu: (api, st, lim) => ({ from: "Le gérant", subject: "Les images", body: [[`Maître, les images du ${CR.fmtDate(C0.jg, "long")} ont été écrasées le ${CR.fmtDate(lim + 1, "long")}.`]] }) }] : [];
    const notifMin = C0.notif;
    const EG = GEN2.PR.gav(x, { hm, notif: notifMin, interp: C0.interp });
    const entretien = { opening: EG.opening, topics: EG.topics };
    entretien.start = entretien.topics.map((tp) => tp.id);
    const observations = [];
    const OBS = {
      gav_notif: { t: `Les droits ont été notifiés à ${hm(notifMin)}, pour une mesure ayant débuté à ${hm(C0.debut)}, sans circonstance insurmontable mentionnée (art. 63-1).`, need: "G_notif" },
      interprete: { t: "La personne, qui comprend mal le français, s'est vu notifier ses droits sans interprète (art. 63-1).", need: "G_langue" },
      avis_parquet: { t: `Le procureur n'a été avisé qu'à ${hm(C0.avisPq)}, pour une mesure ayant débuté à ${hm(C0.debut)} (art. 63).`, need: null },
      heures: { t: `L'interpellation a eu lieu à ${hm(C0.interp)} ; la mesure n'a pris effet qu'à ${hm(C0.debut)} et les droits n'ont été notifiés qu'ensuite (art. 63-1).`, need: "G_interp_client" },
      controle_identite: { t: "Le contrôle d'identité ne repose sur aucune raison plausible de soupçonner une infraction ni sur des réquisitions du procureur (art. 78-2).", need: null },
      fouille: { t: "La fouille des poches a été réalisée par un agent, hors la présence et le contrôle d'un officier de police judiciaire (art. 56).", need: null },
    };
    for (const id of t.irr) if (OBS[id] && (PZ.listes.gav.includes(PZ.anomalies[id] && PZ.anomalies[id].piece) || id === "gav_notif" || id === "interprete")) observations.push(Object.assign({ id: "obs_" + id, flag: id }, OBS[id]));
    const GA = GEN2.PR.gram(A);
    observations.push({ id: "obs_garanties", t: `${GA.Client} dispose d'un hébergement et d'attaches stables.`, need: "G_heberg" });

    function orientation(api) {
      const { cs } = api;
      const c = cs.vars.conseilGav || "expliquer";
      const obsNull = t.irr.some((id) => cs.flags["obs_" + id]) ? 1 : 0;
      const w = GEN2.voiesPossibles(t.inf, q, t.flagrance);
      const opts = [];
      if (w.classement != null || obsNull) opts.push({ voie: "classement", poids: (w.classement || 0.05) + obsNull * 0.6 + (c === "silence" ? 0.1 : 0) });
      if (w.alternative != null && !rec) opts.push({ voie: "alternative", poids: A.casier === 0 ? w.alternative * 2.2 + (c !== "silence" ? 0.15 : 0) : w.alternative * 0.4 });
      if (w.copj != null) opts.push({ voie: "copj", poids: w.copj });
      if (w.crpc != null) opts.push({ voie: "crpc", poids: w.crpc * (c === "expliquer" ? 1.4 : 0.8) });
      if (w.op != null) opts.push({ voie: "op", poids: w.op });
      if (w.ci != null) opts.push({ voie: "ci", poids: w.ci * (rec ? 2.2 : A.casier ? 1.1 : 0.5) + (!A.heberg ? 0.25 : 0) - obsNull * 0.3 });
      if (!opts.length) opts.push({ voie: "copj", poids: 1 });
      return CR.ACT.parquetChoix(api, opts.map((o) => Object.assign(o, { poids: Math.max(0.02, o.poids) }))).voie;
    }
    const prisonMax = q.prison;
    const def = {
      id: p.id, camp: "defense", domaine: ci ? "ci" : "gav", domaineLib: ci ? "pp_jugement" : "pp_enquete", generated: true, gen2: true,
      title: `${A.nom} — ${N.titre}`,
      client: B.clientDef(x, A),
      caller: ci ? "Permanence des comparutions immédiates" : "Permanence pénale de l'Ordre", leadKind: "permanence", silent: true,
      profile: { wealth: 0, sens: 0.6, urgency: 1, temper: pk(x.r, ["anxieux", "anxieux", "presse"]) },
      honoraires: { aj: true },
      actors: { opj: t.opj, parquet: t.parquet, president: "pr_lacassagne" },
      proc: { stade: ci ? "ci" : "gav", nature: "delit", faits: 0, infractions: q.textes.filter((k) => CR.TEXTES[k]).slice(0, 3), pcConstituee: pcV },
      init(api, cs) { cs.proc.faitsDay = t.d.faits; cs.proc.prescStart = t.d.faits; },
      facts, docs, docTitles, anomalies, enquete,
      penal: { no: ["nullite", "prep", "actes", "copie", "requete"] },
      calls: {
        intake: Object.assign({
          label: ci ? "Permanence des comparutions immédiates" : "Permanence pénale",
          start: ["p_info", "p_oui", "p_non"], patience: 50, advice: false,
          onEnd: (api) => {
            const { s, cs } = api;
            if (cs.flags.accepte) {
              cs.status = "active"; cs.aj = true; cs.engaged = s.day; cs.lastUpdate = s.day;
              CR.unschedule(s, (ev) => ev.caseId === cs.id && (ev.key === "_permanenceExpire" || ev.key === "_leadExpire"));
              if (ci) api.run("_fixerCI", {});
              else { api.schedule(0, "_tropTard", {}, Math.min(23 * 60 + 20, s.min + 150)); CR.PROC.stade(api, "gav", `Garde à vue au ${x.SF.comm.replace(/^Commissariat/, "commissariat")} ; avocat commis d'office désigné.`); }
              api.log(ci ? `Commission d'office : comparution immédiate de ${nomc}.` : `Commission d'office : garde à vue de ${nomc}.`);
            } else {
              CR.unschedule(s, (ev) => ev.caseId === cs.id);
              CR.closeCase(s, cs, { type: "declined", note: "Permanence refusée ; un confrère a pris le dossier." });
              if (GEN2.VIE) GEN2.VIE.refusCommission(api);
            }
          },
        }, GEN2.PR.permanence(x, { mode: ci ? "ci" : "gav", nuit: p.night })),
        depot: {
          scene: "parloir", kind: "meet", label: "Entretien au dépôt", baseCost: 20,
          opening: [EG.depot.opening],
          topics: entretien.topics.concat([EG.depot.renvoi]),
          start: entretien.start.concat(["g_renvoi"]), patience: 60, advice: false, close: EG.depot.close,
          onEnd: (api) => { api.cs.flags.depotVu = api.s.day; api.cs.flags.prepClient = api.s.day; },
        },
      },
      on: {
        arrive(api) {
          const { s, cs } = api;
          const vm = ci ? "Maître, la permanence des comparutions immédiates. Un dossier vous est attribué pour cet après-midi. Rappelez-nous vite." : `Maître, la permanence pénale. Une garde à vue au ${x.SF.commCourt}. Rappelez-nous vite, sinon nous appelons le confrère suivant.`;
          CR.ringNow(s, { from: def.caller, caseId: cs.id, kind: "permanence", data: { call: "intake" }, vmText: vm }, false);
          api.schedule(0, "_permanenceExpire", {}, Math.min(23 * 60 + 25, s.min + 45));
        },
        _permanenceExpire(api) {
          const { s, cs } = api;
          if (cs.status !== "lead") return;
          CR.rep(s, "confreres", -1, "permanence sans réponse");
          CR.closeCase(s, cs, { type: "lost-lead", note: "La permanence n'a pas pu vous joindre et a désigné un confrère." });
          s.voicemails = s.voicemails.filter((v) => v.caseId !== cs.id);
        },
        _tropTard(api) {
          const { s, cs } = api;
          if (cs.flags.gavStarted || cs.status !== "active") return;
          api.rep("confreres", -2, "commission d'office acceptée, jamais honorée");
          CR.erreur(s, cs, { id: "gav_absent", texte: "Vous avez accepté la commission d'office sans vous rendre au commissariat.", sanction: "Un autre avocat a été désigné ; la personne a attendu seule.", regul: "Aucune." });
          CR.closeCase(s, cs, { type: "transferred", note: "Un autre avocat commis d'office a assisté la personne." });
        },
        gavFin(api) { api.aj("gav", "Garde à vue"); const voie = orientation(api); api.cs.vars.voie = voie; return voie; },
        _fermer(api, { voie }) {
          const { s, cs } = api;
          const out = { classement: { type: "classement" }, alternative: { type: "alternative", detail: pk(CR.seeded(t.sig + ":alt"), ["avertissement pénal probatoire", "stage de citoyenneté", "composition pénale"]) }, copj: { type: "done", detail: "convocation devant le tribunal correctionnel (COPJ)" }, crpc: { type: "done", detail: "convocation en vue d'une comparution sur reconnaissance préalable de culpabilité" }, op: { type: "done", detail: "procédure transmise pour une ordonnance pénale" } }[voie];
          if (voie === "copj") api.mail({ from: x.TJ.parquet, subject: `Convocation de ${nomc}`, kind: "greffe", body: [[`${nomc} a reçu une convocation par officier de police judiciaire pour comparaître devant le tribunal correctionnel dans quelques mois (art. 390-1). Un avocat sera désigné au titre de l'aide juridictionnelle s'il le demande.`]] });
          if (voie === "crpc") api.mail({ from: x.TJ.parquet, subject: `Convocation en CRPC — ${nomc}`, kind: "greffe", body: [[`${nomc} est convoqué${e(A)} devant le procureur de la République en vue d'une comparution sur reconnaissance préalable de culpabilité (art. 495-7). L'assistance d'un avocat y est obligatoire.`]] });
          CR.closeCase(s, cs, out);
        },
        _fixerCI(api) {
          const { s, cs } = api;
          const day = ci ? s.day : s.day + 1;
          const min = ci ? Math.max(15 * 60, Math.min(18 * 60, s.min + 150)) : 14 * 60 + 30;
          CR.PROC.fixAudience(api, { day, min, juridiction: "ci", mode: "ci", convocDay: s.day, president: "pr_lacassagne", script: "ci", done: "apresCI", onMiss: "_absentCI", title: "Comparution immédiate — 23e chambre", duree: 40, lieu: "palais" });
          CR.PROC.stade(api, "ci", "Déferrement au parquet et comparution immédiate (art. 395).");
          if (ci) for (const k of dossierCI) if (!CR.hasDoc(cs, k)) api.doc(k, docTitles[k]);
        },
        _absentCI(api) {
          const { s, cs } = api;
          CR.erreur(s, cs, { id: "ci_absent", texte: "Vous n'étiez pas à la comparution immédiate.", sanction: "L'avocat de permanence a découvert le dossier à la barre.", regul: "Aucune." });
          CR.closeCase(s, cs, { type: "transferred", note: "Jugé avec l'avocat de permanence de la 23e chambre." });
        },
        renvoiDetention(api, { st }) {
          const { s, cs } = api;
          const g = ["G_attest", "G_attest_emploi", "G_heberg"].filter((f) => CR.hasFact(cs, f) || st.played.has(f)).length + (st.played.has("arg:garanties") ? 1 : 0);
          const prof = api.profil("president") || CR.PROFILS.presse;
          const score = 0.4 + (rec ? 0.2 : 0) + (A.heberg ? 0 : 0.25) + ((I.gravite || 0.4) - 0.4) * 0.4 + (prof.severite - 0.5) * 0.3 - g * 0.13 + (R.next(s) - 0.5) * 0.1;
          const dp = score > 0.35;
          cs.vars.renvoi = true;
          const sept = prisonMax > 84;
          const day = CR.rollForward(s.day + (sept ? R.int(s, 62, 100) : R.int(s, 15, 40)));
          cs.vars.renvoiDay = day;
          if (dp) { CR.PROC.detention(api, "dp", { etab: "sante" }); return [{ who: "president", t: `Le tribunal renvoie l'affaire au ${CR.fmtDate(day, "long")} et place le prévenu en détention provisoire jusqu'à l'audience (art. 397-3).` }]; }
          CR.PROC.detention(api, "cj", {});
          return [{ who: "president", t: `Le tribunal renvoie l'affaire au ${CR.fmtDate(day, "long")} et place le prévenu sous contrôle judiciaire.` }];
        },
        decider(api, { st }) {
          const { s, cs } = api;
          const c = cs.vars.conseilGav;
          const perso = ["G_attest", "G_attest_emploi", "G_heberg", "G_emploi"].filter((f) => CR.hasFact(cs, f)).length * 0.7 + (st.dernierMot === "regrets" ? 1 : 0);
          const spec = B.spec(x, c ? (c === "silence" ? 0.03 : c === "partiel" ? 0.1 : 0.18) : null);
          return B.juger(x, api, st, () => PEN.juger(api, {
            st, juridiction: "ci", titre: "Jugement — comparution immédiate", prevenuNom: nomc, pcNom: V ? nom(V) : "", pcF: V && V.g === "f",
            spec, qualif: B.qualif(x),
            personnalite: Math.round(perso), detenu: true, sansDomicile: !A.heberg && !CR.hasFact(cs, "G_attest"),
            civil: pcV ? B.civil(x) : null,
          }));
        },
        _contesterRecidive(api, { motif }) { return B.contesterRecidive(x, api, motif); },
        _exceptionN12(api, { quoi }) { return B.exceptionN12(x, api, quoi); },
        apresCI(api, res) {
          const { s, cs } = api;
          if (cs.vars.renvoi && !res.decision) {
            if (!cs.vars.renvoiFixe) {
              cs.vars.renvoiFixe = true;
              CR.PROC.fixAudience(api, { day: cs.vars.renvoiDay, min: 14 * 60, juridiction: "ci", mode: "ci_renvoi", convocDay: s.day, president: "pr_lacassagne", script: "ci_fond", done: "apresCI", onMiss: "_absentCI", title: "Comparution immédiate (renvoi) — 23e chambre", duree: 40, lieu: "palais" });
              CR.PROC.stade(api, "ci_renvoi", "Renvoi à la demande du prévenu (art. 397-1).");
            }
            return;
          }
          const dec = res.decision || {};
          api.aj("ci", "Comparution immédiate");
          const pn = dec.peine;
          if (dec.coupable && pn && pn.mandatDepot && pn.ferme > 0) CR.condamneDetenu(s, cs, pn.ferme, "sante", cs.proc.detention.statut === "dp" ? cs.proc.detention.since : s.day);
          else if (cs.proc.detention.statut === "dp") CR.PROC.detention(api, "libre", {});
          CR.closeCase(s, cs, PEN.issue(api, dec));
        },
      },
      gav: (api) => ({
        mode: "gav", attente: p.night ? 35 : 20,
        arrivee: [p.night ? `${x.SF.comm}, ${CR.fmtTime(api.s.min)}. Les néons, une odeur de café froid. L'officier de quart : « Désolé de vous avoir réveillé, maître. Trente minutes. »` : `${x.SF.comm}, ${CR.fmtTime(api.s.min)}. L'officier vous tend la procédure : « Trente minutes, maître. »`],
        pieces: PZ.listes.gav,
        entretien,
        audition: () => N.audition.map((a) => ({ q: a.q, fq: a.fq, a: { silence: a.a.silence, expliquer: a.a.expliquer, partiel: a.a.partiel } })).concat([{ q: "Avez-vous quelque chose à ajouter ?", a: { silence: "Non.", expliquer: "Je regrette.", partiel: "Non." } }]),
        questions: [
          { id: "q_heure", q: `À quelle heure les droits de ${GA.client} lui ont-ils été notifiés ?`, a: t.irr.includes("gav_notif") ? `(L'officier, agacé) : C'est au procès-verbal, maître. ${hm(notifMin)}.` : "(L'officier) : Dès le placement, maître, c'est au procès-verbal.", f: t.irr.includes("gav_notif") ? "G_q_heure" : null, sensible: true },
          { id: "q_logement", q: "Avez-vous vérifié son adresse ?", a: A.heberg ? "Oui, sa famille a confirmé par téléphone." : `${GA.Il} n'a pas d'adresse vérifiable.`, anodine: true },
          t.flagrance ? { id: "q_motif", q: `Pourquoi ${GA.client} a-t-${GA.il} été contrôlé${GA.e} ?`, a: t.irr.includes("controle_identite") ? `(L'officier) : ${GA.Il} avait un comportement suspect, maître. C'est au procès-verbal.` : "(L'officier) : C'est au procès-verbal, maître.", sensible: true } : { id: "q_plainte", q: "Une plainte a-t-elle été déposée ?", a: "(L'officier) : Je ne peux pas vous répondre, maître.", sensible: true },
        ],
        observations,
        get relecture() {
          const c = api.cs.vars.conseilGav;
          if (c === "silence") return { segs: [{ t: "La personne déclare : Je ne souhaite pas répondre aux questions." }] };
          return { segs: [{ t: "La personne déclare :" }, { t: N.version[t.stance].split(/(?<=[.!?])\s/)[0] }, t.erreurPV ? { t: "Je savais ce que je faisais, je l'ai fait exprès.", erreur: true, correct: "Je n'ai pas réfléchi." } : { t: "Je n'ai pas réfléchi." }, { t: "Je regrette." }] };
        },
        issue: (a) => {
          const voie = a.run("gavFin");
          if (voie === "ci") {
            a.run("_fixerCI", {});
            return { texte: ["Le parquet décide un déferrement : comparution immédiate demain après-midi, 23e chambre.", "La nuit au dépôt. Demain, quelques heures pour réunir les garanties de représentation."] };
          }
          a.schedule(0, "_fermer", { voie }, Math.min(23 * 60 + 25, a.s.min + 30));
          return { texte: [{ classement: "Le parquet ordonne la levée de la garde à vue et classe la procédure sans suite.", alternative: "Le parquet opte pour une alternative aux poursuites, notifiée par un délégué du procureur (art. 41-1). Pas de procès.", copj: "Levée de la garde à vue : convocation devant le tribunal correctionnel dans quelques mois (art. 390-1).", crpc: "Levée de la garde à vue : convocation devant le procureur pour une comparution sur reconnaissance préalable de culpabilité (art. 495-7).", op: "Levée de la garde à vue : le parquet requerra une ordonnance pénale (art. 495)." }[voie], "Vous signez le registre et repartez."] };
        },
      }),
      flow: { tasks: PEN.tasks },
      tasks(api, T) {
        const { s, cs } = api;
        if (cs.proc.stade === "gav" && !cs.flags.gavStarted) T({ id: "gav", label: `Assister ${A.prenom} en garde à vue`, sub: `${x.SF.comm}. L'entretien dure trente minutes au plus.`, kind: "meet", time: 0, where: CR.MONDE.placeComm(api.s, x.SF), urgent: true, run: () => ({ scene: "gav" }) });
        const a = cs.proc.audience;
        if (a && a.day === s.day && ["ci", "ci_renvoi"].includes(a.mode)) {
          if (!cs.flags.dossierCI) T({ id: "dossier", label: "Lire le dossier au bureau des avocats", sub: "Procès-verbaux, certificats, casier, enquête sociale rapide.", kind: "admin", time: 20, where: "palais", urgent: true, run: () => {
            CR.spend(s, 20, "admin"); cs.flags.dossierCI = s.day;
            for (const k of dossierCI) if (!CR.hasDoc(cs, k)) api.doc(k, docTitles[k]);
            return null; } });
          if (!cs.flags.depotVu) T({ id: "depot", label: `Voir ${A.prenom} au dépôt`, sub: "Un entretien bref, avant l'audience.", kind: "meet", time: 0, where: "palais", urgent: true, run: () => ({ scene: "call", call: "depot" }) });
          PEN.persoTasks(api, T, [
            { id: "proche", label: "Appeler un proche pour l'hébergement", sub: "Une attestation écrite, envoyée au greffe avant l'audience.", fact: "G_attest", text: `Attestation d'hébergement de ${A.proche} et justificatif de domicile envoyés au greffe.`, time: 15, cond: () => CR.hasFact(cs, "G_heberg") && A.heberg },
            { id: "employeur", label: "Appeler l'employeur", sub: "Une attestation d'emploi.", fact: "G_attest_emploi", text: `Attestation de l'employeur : ${A.metier}, en poste, attendu au travail.`, time: 15, cond: () => CR.hasFact(cs, "G_emploi"), fail: (y) => !y.cs.flags.empRappel && (y.cs.flags.empRappel = true) && R.chance(y.s, 0.4), failText: "Personne ne répond. Réessayez." },
          ]);
        }
      },
      audiences: { ci: (api) => ciScript(api, true), ci_fond: (api) => ciScript(api, false) },
      debrief(api, o) {
        const { cs } = api;
        const items = B.irrDebrief(x, cs);
        if (cs.vars.voie) items.push({ kind: "info", text: `Orientation du parquet : ${{ classement: "classement sans suite", alternative: "alternative aux poursuites", copj: "convocation devant le tribunal", ci: "comparution immédiate", crpc: "comparution sur reconnaissance préalable de culpabilité", op: "ordonnance pénale" }[cs.vars.voie]}.` });
        return items.concat(B.debriefN12(x, cs), cs.vars.debriefJugement || []);
      },
      epilogue(api, o) {
        const pn = api.cs.vars.peine;
        if (o.type === "classement") return `${nomc} est ressorti${e(A)} libre du commissariat.`;
        if (o.type === "alternative") return `${nomc} a fait l'objet d'une alternative aux poursuites. Pas de casier.`;
        if (o.type === "relaxe") return `${nomc} a été relaxé${e(A)}.`;
        if (pn && pn.mandatDepot) return `${pn.texte}. ${nomc} a été écroué${e(A)} à la Santé.`;
        return pn ? `${pn.texte}.` : o.detail ? CR.cap(o.detail) + "." : "Dossier terminé.";
      },
      fiche(api, o) {
        return {
          phrase: `${CR.cap(q.label)}, ${ci ? "comparution immédiate" : "garde à vue"}, avocat commis d'office.`,
          notions: B.notions(x).concat([
            { titre: "Les droits du gardé à vue", regle: "Notification immédiate des droits, dans une langue comprise ; entretien de trente minutes avec l'avocat ; audition en sa présence s'il a été demandé.", art: "art. 63-1, 63-4 et 63-4-2 CPP", prog: "pp_enquete" },
            { titre: "La comparution immédiate", regle: "Le prévenu peut refuser d'être jugé le jour même ; le tribunal statue alors sur la détention ; les nullités se soulèvent avant toute défense au fond.", art: "art. 395, 397-1 et 385 CPP", prog: "pp_jugement" },
          ], B.notionsN12(x)),
          piege: t.irr.length ? "Lire chaque heure, chaque mention et chaque signature des procès-verbaux : c'est là que se cachent les nullités." : t.q2 ? "Comparer les pièces entre elles : la qualification de la prévention n'est pas toujours celle que les faits établissent." : "Les garanties de représentation se rassemblent par téléphone, avant l'audience.",
          devenir: api.def.epilogue(api, o),
        };
      },
      corrige: () => B.corrige(x),
    };

    function ciScript(api, premier) {
      const { cs } = api;
      const sept = prisonMax > 84;
      const base = B.requis(x);
      const fond = [
        { limine: { joindre: true } },
        { who: "president", t: `Je résume. ${N.resume}` },
        { who: "president", t: `${A.g === "f" ? "Madame" : "Monsieur"} ${A.nom}, vous reconnaissez les faits ?` },
        { if: () => !!cs.flags.depotVu, then: [{ who: "client", t: N.version[t.stance], signal: t.stance === "nie" ? undefined : "bon" }], else: [{ who: "client", t: "Je sais pas… C'est pas comme ils disent.", fx: { cred: -2 }, signal: "mauvais" }] },
        { who: "president", t: B.casierLigne(x) },
        ...B.stepsRecidive(x),
        { card: { prompt: "Le président : « Maître, des garanties de représentation ? »", accept: ["G_attest", "G_attest_emploi", "G_esr", "G_heberg"], window: 12000, ok: { then: [{ who: "president", t: "Je les verse au dossier." }] }, miss: { then: [{ who: "president", t: "Rien, donc." }] } } },
      ].concat(pcV ? [{ who: "president", t: "La parole est à la partie civile." }, { who: "adverse", name: "Avocat de la victime", t: `${x.civ(V)} ${V.nom} se constitue partie civile et demande réparation de son préjudice.` }] : []).concat([
        AUD.requisitions((a) => { const b = B.requisDyn(x, a); return rec && !a.cs.vars.recEcartee ? Object.assign({ mandatDepot: b.ferme > 0 }, b) : b; }, { avant: (a) => [rec && !a.cs.vars.recEcartee ? "Une récidive : le premier avertissement n'a pas suffi." : t.stance === "reconnait" ? "Des faits reconnus pour l'essentiel." : "Des faits établis par la procédure, malgré les dénégations."].concat(x.conc.length ? ["Plusieurs infractions dans la même scène : le tribunal prononcera une peine unique, dans la limite du maximum le plus élevé."] : []), apres: B.requisApres(x) }),
        { who: "president", t: "La parole est à la défense." },
        { plaidoirie: { role: "defense", max: 3, angles: [{ id: "peine", t: "La peine", sub: "Ne pas contester ; une peine aménageable." }, { id: "relaxe", t: "La relaxe", sub: "Contester les faits." }].concat(t.q2 ? [{ id: "requalif", t: "La requalification", sub: "Une infraction moins grave." }] : []), args: B.argsDefense(x, { garanties: true }) } },
        { dernierMot: { prepare: [{ id: "regrets", label: "Des regrets sobres", t: "Je regrette. Je ne recommencerai pas." }, { id: "rien", label: "Rien de plus", t: "Je n'ai rien à ajouter." }], spontane: { id: "spontane", t: "Je… pardon." } } },
        { delibere: { texte: "Le tribunal se retire. Cinq minutes, entre deux dossiers : « Le tribunal ! »", duree: 10 } },
      ]);
      const ouv = AUD.ouverture(api, { prevenu: def.client, prevenuWho: "client", prevention: `Vous êtes prévenu${e(A)} d'avoir, à ${x.SF.nom}, le ${CR.fmtDate(cs.proc.faitsDay, "long")}, ${x.prevention(q)}. Faits prévus et réprimés par ${B.reprime(x)}.` });
      const steps = premier ? ouv.concat([
        { who: "president", t: `Vous pouvez être jugé${e(A)} aujourd'hui, ou demander un délai pour préparer votre défense : ${sept ? "deux à quatre mois" : "deux à six semaines"} (art. 397-1).` },
        { choose: [
          { t: `« ${GA.Client} accepte d'être jugé${GA.e} aujourd'hui. »`, reply: "Nous retenons l'affaire.", then: fond },
          { t: `« ${GA.Client} demande un délai pour préparer sa défense (art. 397-1). »`, reply: "Le tribunal entend le parquet sur la détention.", then: [
            { who: "parquet", t: rec ? "La récidive impose la détention jusqu'à l'audience." : "Je requiers un contrôle judiciaire." },
            { plaidoirie: { role: "jld", max: 2, args: [
              { id: "garanties", label: "Les garanties de représentation", say: `${GA.Il} a une adresse et une famille ; un contrôle judiciaire suffit.`, cards: ["G_attest", "G_heberg"] },
              { id: "emploi", label: "Son emploi", say: `${GA.Il} travaille ; la détention le lui ferait perdre.`, cards: ["G_attest_emploi", "G_emploi"] },
            ] } },
            { do: (a, st) => a.run("renvoiDetention", { st }) },
            { end: true },
          ] },
        ] },
      ]) : ouv.concat([{ who: "president", t: "L'affaire a été renvoyée à la demande du prévenu. Nous la retenons au fond." }], fond);
      return { title: "23e chambre — comparutions immédiates", sub: "Tribunal judiciaire de Paris · Batignolles", decor: { scene: "salle", box: true }, steps };
    }
    return def;
  };

  // =================================================================== ORDONNANCE PÉNALE (client payant)
  B.op = function (p) {
    const x = B.ctx(p);
    const { t, N, PZ, A, e, nom, q, I } = x;
    const nomc = nom(A);
    const rq = B.requis(x);
    const amende = Math.max(150, Math.round((Math.min(q.amende, 4500) * 0.12) / 50) * 50);
    const comp = (rq.complementaires || []).filter((c) => !/stage/.test(c)).slice(0, 1);
    // l'enjeu du permis : pas pour qui n'en a jamais eu (conduite sans permis, art. L. 221-2)
    const route = I.fam === "route" && !(x.t.inf === "defaut_permis" && x.t.f.sc === "jamais");
    const op = { amende, comp: comp.join(", "), texte: `${CR.money(amende)} d'amende${comp.length ? " et " + comp[0] : ""}` };
    const facts = Object.assign({}, PZ.facts, {
      O_notif: { label: "La date de notification de l'ordonnance pénale", key: true, why: "L'opposition se forme dans les quarante-cinq jours de la notification (art. 495-3)." },
      O_peine: { label: `L'ordonnance : ${op.texte}`, key: true },
      O_enjeu: { label: route ? CR.MONDE.enjeuPermis(A).label : "Une inscription au casier qui l'inquiète" },
    });
    const docs = Object.assign({}, PZ.docs, {
      ordonnance: () => ({ title: "Ordonnance pénale", kind: "greffe", entete: [`${x.TJ.tj} · Président du tribunal`, "Articles 495 à 495-6 du code de procédure pénale"], paras: [[`Vu les réquisitions du ministère public, condamnons ${nomc} pour ${q.label} (${q.court}) à ${op.texte}.`], [{ t: `Notifiée par lettre recommandée, avis signé le ${CR.fmtDate(t.d.notif, "long")}. Opposition possible dans les quarante-cinq jours (art. 495-3).`, f: "O_notif" }]] }),
    });
    const docTitles = Object.assign({}, PZ.titres, { ordonnance: "Ordonnance pénale" });
    const procDocs = PZ.listes.copie;
    const def = {
      id: p.id, camp: "defense", domaine: "tc", domaineLib: "pp_jugement", generated: true, gen2: true,
      title: `${A.nom} — l'ordonnance pénale`,
      client: Object.assign(B.clientDef(x, A), { trust: 55 }),
      leadTask: PEN.rdvTask(`Recevoir ${x.civ(A)} ${A.nom} au cabinet`), leadPatience: 4,
      profile: { wealth: 3, sens: 0.5, urgency: 0.6, temper: pk(x.r, ["anxieux", "marchandeur", "presse"]) },
      honoraires: { forfait: 900, heures: 6, types: ["forfait", "temps"], resultat: "relaxe ou peine réduite" },
      mission: `Conseil de ${nomc} sur l'ordonnance pénale reçue, opposition le cas échéant et défense devant le tribunal correctionnel jusqu'au jugement.`,
      actors: { parquet: t.parquet, president: t.pres },
      proc: { stade: "jugement", nature: "delit", faits: t.d.faits - p.day, infractions: q.textes.filter((k) => CR.TEXTES[k]).slice(0, 3) },
      init(api, cs) { cs.vars.opNotifDay = t.d.notif; cs.proc.faitsDay = t.d.faits; cs.proc.prescStart = t.d.notif; },
      vars: () => ({ notifDate: CR.fmtDate(t.d.notif, "long") }),
      facts,
      calls: { intake: Object.assign({ scene: "conference", kind: "meet", label: "Rendez-vous au cabinet", start: null, patience: 80 }, GEN2.PR.prevenu(x, { mode: "op", day: p.day, opTexte: op.texte, qLabel: q.label, route })) },
      advice: [
        { id: "o_delai", t: "Vous avez quarante-cinq jours à compter de la notification pour faire opposition." },
        { id: "o_risque", t: "Si nous faisons opposition, le tribunal pourra prononcer une peine plus lourde." },
        { id: "o_payer", t: "Payez tout de suite, c'est plus simple." },
      ],
      docs, docTitles, anomalies: PZ.anomalies,
      tpls: {
        opposition: (api) => ({
          title: "Déclaration d'opposition à l'ordonnance pénale", kind: "acte", time: 20, dirLabel: "Rédigée",
          depot: "palais", depotLabel: "Greffe du tribunal correctionnel (déclaration d'opposition)", depotTime: 15,
          slots: { fondement: CR.choiceSlot("Fondement", [{ t: "en application de l'article 495-3 du code de procédure pénale.", ok: true }]) },
          body: [[`${nomc}, assisté${e(A)} de `, `Me ${api.s.player.nom}`, `, déclare former opposition à l'ordonnance pénale notifiée le ${CR.fmtDate(t.d.notif, "long")}, `, { s: "fondement" }]],
        }),
      },
      penal: { no: ["actes", "copie", "requete", "constitution"] },
      flow: { tasks: PEN.tasks },
      tasks(api, T) {
        const { s, cs } = api;
        if (!cs.flags.procVue) T({ id: "procedure", label: "Consulter la procédure au greffe", sub: "Les procès-verbaux sur lesquels repose l'ordonnance.", kind: "admin", time: 30, where: "palais", run: () => { CR.spend(s, 30, "admin"); cs.flags.procVue = s.day; api.doc("ordonnance", "Ordonnance pénale"); for (const k of procDocs) if (!CR.hasDoc(cs, k)) api.doc(k, docTitles[k]); return null; } });
        if (!CR.drafted(cs, "opposition") && !cs.vars.accepte) {
          T({ id: "opposition", label: "Former opposition", sub: "Déclaration au greffe. Comptez le délai vous-même.", kind: "draft", time: 20, run: () => ({ scene: "draft", tpl: "opposition" }) });
          T({ id: "accepter", label: "Conseiller de ne pas faire opposition", sub: "L'ordonnance deviendra définitive.", kind: "meet", time: 15, run: () => { CR.spend(s, 15, "meet"); cs.vars.accepte = s.day; api.run("_accepte"); return null; } });
        }
      },
      on: {
        arrive(api) {
          const { cs } = api;
          cs.status = "lead";
          api.mail({ from: nomc, subject: "Une ordonnance pénale", kind: "email", body: [[`Maître, j'ai reçu une ordonnance pénale : ${op.texte}. Je voudrais savoir si je peux la contester. Pourriez-vous me recevoir ?`]] });
          api.schedule(def.leadPatience, "_leadExpire");
        },
        engaged(api) { api.oblig({ id: "op495", label: "Opposition (art. 495-3)", due: CR.rollForward(t.d.notif + 45), silent: true, onMiss: "_noop" }); },
        _accepte(api) { CR.closeCase(api.s, api.cs, { type: "done", detail: "ordonnance pénale définitive" }); },
        filed_opposition(api, { depot }) {
          const { s, cs } = api;
          if (!depot) return;
          api.satisfy("op495");
          const ctrl = CR.PROC.controle(api, "opposition_op", { day: s.day });
          if (!ctrl.ok) {
            CR.erreur(s, cs, { id: "op_tardive", texte: ctrl.motif, sanction: "Opposition irrecevable : l'ordonnance est définitive.", regul: "Aucune." });
            api.schedule(R.int(s, 20, 35), "_irrecevable");
            return;
          }
          let day = CR.rollForward(s.day + R.int(s, 35, 60));
          while (CR.dow(day) !== 2 || !CR.isBusinessDay(day)) day++;
          CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "opposition", convocDay: s.day, president: t.pres, script: "tc", done: "apresTC", onMiss: "_absent", title: `Audience sur opposition — ${GEN2.CHAMBRE[t.pres] || "tribunal correctionnel"}`, duree: 40 });
          CR.PROC.event(api, "Opposition formée : l'ordonnance est non avenue, le tribunal jugera.");
        },
        _irrecevable(api) { CR.closeCase(api.s, api.cs, { type: "irrecevable", detail: "opposition tardive" }); },
        _absent(api) { CR.erreur(api.s, api.cs, { id: "absent", texte: "Vous n'étiez pas à l'audience.", sanction: "Jugé sans avocat.", regul: "Appel dans les dix jours." }); CR.closeCase(api.s, api.cs, { type: "condamnation", detail: "jugé sans avocat" }); },
        decider(api, { st }) {
          const { cs } = api;
          return PEN.juger(api, {
            st, juridiction: "tc", titre: "Jugement sur opposition", prevenuNom: nomc,
            spec: B.spec(x), qualif: B.qualif(x),
            personnalite: (CR.hasFact(cs, "O_enjeu") ? 1 : 0) + (st.dernierMot === "regrets" ? 1 : 0) + 1,
          });
        },
        apresTC(api, res) { CR.closeCase(api.s, api.cs, PEN.issue(api, res.decision || {})); },
      },
      audiences: {
        tc(api) {
          return {
            title: GEN2.CHAMBRE[t.pres] || "Tribunal correctionnel", sub: "Audience sur opposition", decor: { scene: "salle" },
            steps: AUD.jugement(api, {
              prevenu: def.client,
              prevention: `Vous avez formé opposition à l'ordonnance pénale. Vous êtes prévenu${e(A)} d'avoir, à ${x.SF.nom}, ${x.prevention(q)}. Faits prévus et réprimés par ${CAT.courtLong(q.court)}.`,
              instruction: [{ who: "president", t: "Vous reconnaissez les faits ?" }, { who: "client", t: N.version[t.stance] }],
              requis: { base: Object.assign({}, rq, { amende: Math.round(amende * 1.2 / 50) * 50 }), avant: ["L'opposition remet tout en jeu : le tribunal n'est pas tenu par l'ordonnance."] },
              defense: { max: 3, angles: [{ id: "peine", t: "La peine", sub: route ? (CR.MONDE.travaille(A) ? "Le permis, l'emploi." : "Le permis.") : "Une peine proportionnée." }, { id: "relaxe", t: "La relaxe", sub: "La procédure ne tient pas." }], args: [
                { id: "enjeu", label: route ? CR.MONDE.enjeuPermis(A).label : A.casier ? "Une seule mention au casier, ancienne" : "Une première fois, sans antécédent", say: route ? CR.MONDE.enjeuPermis(A).say : A.casier ? "Une seule mention au casier, ancienne et sans rapport. Une inscription de plus lui fermerait des portes." : "Une première fois : rien au casier. Une inscription lui fermerait des portes.", cards: ["O_enjeu"] },
                { id: "amenagement", label: "Une peine proportionnée", say: "Une amende proportionnée à ses revenus suffit.", cards: ["CP_132-19"] },
              ].concat(B.argsDefense(x).filter((a) => !["emploi", "amenagement", "casier"].includes(a.id))) },
            }),
          };
        },
      },
      debrief(api, o) {
        const { cs } = api;
        const items = [{ kind: "rule", text: `Opposition à l'ordonnance pénale délictuelle : quarante-cinq jours à compter de la notification (art. 495-3) — ici jusqu'au ${CR.fmtDate(CR.rollForward(t.d.notif + 45), "long")}. L'opposition remet l'affaire au tribunal, qui n'est pas tenu par l'ordonnance.` }];
        const moyen = t.irr.length > 0 || !!t.q2;
        items.push(...B.irrDebrief(x, cs));
        if (cs.vars.accepte && moyen) items.push({ kind: "bad", text: "Vous avez laissé l'ordonnance devenir définitive alors que la procédure était discutable." });
        if (cs.vars.accepte && !moyen) items.push({ kind: "good", text: "Sans moyen sérieux, l'opposition exposait à une peine plus lourde : laisser l'ordonnance devenir définitive était défendable." });
        return items.concat(cs.vars.debriefJugement || []);
      },
      epilogue(api, o) {
        if (o.type === "relaxe") return `${nomc} a été relaxé${e(A)}.`;
        if (o.type === "done") return `L'ordonnance pénale est définitive : ${op.texte}.`;
        const pn = api.cs.vars.peine;
        return pn ? `${pn.texte}.` : "Dossier terminé.";
      },
      fiche(api, o) {
        return {
          phrase: `${CR.cap(q.label)}, ordonnance pénale, avocat de ${nomc}.`,
          notions: B.notions(x).concat([{ titre: "L'ordonnance pénale délictuelle", regle: "Procédure écrite et sans débat ; le prévenu peut former opposition dans les quarante-cinq jours de la notification, l'affaire étant alors jugée par le tribunal, qui peut prononcer une peine plus lourde.", art: "art. 495 à 495-6 CPP", prog: "pp_jugement" }]),
          piege: "Compter le délai depuis la notification, lire la procédure, et peser le risque d'une peine plus lourde avant de faire opposition.",
          devenir: api.def.epilogue(api, o),
        };
      },
      corrige: () => [{ probleme: "Faut-il faire opposition ?", regle: "Opposition dans les quarante-cinq jours de la notification (art. 495-3) ; le tribunal juge alors l'affaire sans être tenu par l'ordonnance.", application: t.irr.length || t.q2 ? "La procédure contient un moyen sérieux : l'opposition se justifiait, avec des conclusions déposées à temps." : "Sans moyen sérieux, l'opposition expose à une peine plus lourde." }].concat(B.corrige(x)),
    };
    def.calls.intake.start = def.calls.intake.topics.map((tp) => tp.id);
    return def;
  };
})();
