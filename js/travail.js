/* La Permanence — le dossier de travail (refonte du gameplay, lot 2).
   Le surlignage par phrase et le bloc-notes à cinq catégories cèdent la place aux outils d'un cabinet. Ce que le joueur
   construit ici est sa seule main à l'audience ; le jeu ne signale rien.
   - Annotation : une sélection libre, au mot près, dans une pièce ; un sens (à charge, à décharge, procédure, à vérifier),
     une note en marge, la cote et le feuillet (« D12, f. 3 »). En coulisse, une annotation qui couvre un passage porteur
     d'un fait (f) le met en main ; un drapeau d'irrégularité (flag, paire) reste attaché à l'annotation.
   - Onglets sur les pièces ; liens entre deux passages, en disant ce qui se contredit (heure, lieu, personne, version).
   - Chronologie : événements datés et horodatés placés par le joueur, à partir d'une annotation ; les écarts se lisent.
   - Tableau des versions : qui dit quoi, point par point.
   - Plan de défense : moyens en trois colonnes (procédure, fond, peine), chacun appuyé sur des annotations cotées.
   - Irrégularité relevée en quatre éléments : le passage, le texte violé, le régime de nullité, le grief. Elle ouvre le
     moyen de nullité comme avant (cs.issues, drapeau reconnu en coulisse) ; les quatre éléments sont gardés pour le
     débrief et l'audience (lot 4), jamais jugés à l'écran.
   Tout est rangé dans cs.travail ; une ancienne sauvegarde n'en a pas et l'obtient à la première annotation.
   Position d'un passage : { p, s, o } = paragraphe, segment (après UI.segmentize) et caractère dans le segment. */
(function () {
  const CR = window.CR;
  const T = (CR.TRAV = {});

  T.COULEURS = [["charge", "À charge"], ["decharge", "À décharge"], ["procedure", "Procédure"], ["verifier", "À vérifier"]];
  T.LIENS = [["heure", "Heure"], ["lieu", "Lieu"], ["personne", "Personne"], ["version", "Version"]];
  T.COLONNES = [["procedure", "Procédure"], ["fond", "Fond"], ["peine", "Peine"]];
  T.QUI = [["client", "Le client"], ["victime", "La victime"], ["temoin", "Le témoin"], ["policiers", "Les policiers"], ["autre", "Autre"]];
  // régime de nullité : celui que le joueur retient (CR.IRREG : grief « presume » ou « prouver »)
  T.REGIMES = [["presume", "Nullité d'ordre public : grief présumé"], ["prouver", "Nullité d'intérêt privé : grief à démontrer (art. 171 et 802)"], ["aucune", "Simple irrégularité, sans nullité"]];
  T.GRIEFS = [["defense", "Atteinte aux droits de la défense"], ["aveux", "Déclarations recueillies sans les garanties de la loi"], ["preuve", "Preuve obtenue grâce à l'acte irrégulier"], ["domicile", "Atteinte au domicile ou à la vie privée"], ["liberte", "Privation de liberté sans base légale"], ["presume", "Grief présumé, rien à démontrer"]];
  T.label = (liste, k) => (liste.find((x) => x[0] === k) || [null, ""])[1];

  T.etat = (cs) => {
    if (!cs.travail) cs.travail = { annots: [], onglets: [], liens: [], chrono: [], versions: { points: [], cells: [] }, plan: [], irregs: [] };
    return cs.travail;
  };
  T.annots = (cs) => (cs && cs.travail ? cs.travail.annots : []);
  T.annot = (cs, id) => T.annots(cs).find((a) => a.id === id) || null;
  // une pièce se reconnaît à sa référence : la pièce versée au dossier (doc), sinon sa clé (pièces lues en garde à vue)
  T.refKey = (ref) => (ref ? (ref.doc ? "d:" + ref.doc : ref.mail ? "m:" + ref.mail : ref.key ? "k:" + ref.key : null) : null);
  T.annotsDe = (cs, ref) => { const k = T.refKey(ref); return k ? T.annots(cs).filter((a) => a.ref === k) : []; };
  const avant = (x, y) => x.p < y.p || (x.p === y.p && (x.s < y.s || (x.s === y.s && x.o <= y.o)));

  // texte, marques et feuillet couverts par une plage de la pièce (doc segmenté par UI.segmentize)
  const segT = (seg) => (typeof seg === "string" ? seg : (seg && seg.t) || "");
  T.couvert = function (doc, debut, fin) {
    const out = [], marks = [];
    const paras = doc.paras || [];
    for (let p = debut.p; p <= fin.p && p < paras.length; p++) {
      const segs = paras[p] || [];
      for (let s = p === debut.p ? debut.s : 0; s < segs.length; s++) {
        if (p === fin.p && s > fin.s) break;
        const t = segT(segs[s]);
        const a = p === debut.p && s === debut.s ? debut.o : 0, b = p === fin.p && s === fin.s ? fin.o : t.length;
        out.push(t.slice(a, b));
        const g = segs[s];
        if (g && typeof g === "object" && b > a) for (const ty of ["f", "flag", "paire"]) if (g[ty]) marks.push({ ty, id: g[ty] });
      }
      if (p < fin.p) out.push(" ");
    }
    return { t: out.join("").replace(/\s+/g, " ").trim(), marks };
  };
  // feuillet d'un paragraphe : 1 + les sauts de feuillet qui le précèdent (pièces du moteur de documents)
  T.feuillet = (doc, p) => { let f = 1; for (let i = 0; i < p && i < (doc.paras || []).length; i++) if (doc.pstyle && doc.pstyle[i] === "saut") f++; return f; };
  T.coteDe = (doc, titre) => (doc && doc.cote) || ((/\((D\d+(?:\/\d+)?)\)$/.exec(titre || "") || [])[1]) || null;
  T.refTexte = (a) => [a.cote, a.f > 1 || a.cote ? `f. ${a.f}` : null].filter(Boolean).join(", ") || a.titre || "";

  // ------------------------------------------------------------------ annoter
  // o : { doc (pièce segmentée), ref ({ doc, key, titre }), debut, fin, coul, note }
  T.annoter = function (s, cs, o) {
    if (!cs || !o.doc || !o.debut || !o.fin) return null;
    let debut = o.debut, fin = o.fin;
    if (!avant(debut, fin)) [debut, fin] = [fin, debut];
    const cv = T.couvert(o.doc, debut, fin);
    if (!cv.t) return null;
    const W = T.etat(cs), ref = T.refKey(o.ref);
    // la même plage annotée deux fois : on reprend l'annotation
    const deja = W.annots.find((a) => a.ref === ref && a.debut.p === debut.p && a.debut.s === debut.s && a.debut.o === debut.o && a.fin.p === fin.p && a.fin.s === fin.s && a.fin.o === fin.o);
    if (deja) { if (o.coul) deja.coul = o.coul; if (o.note != null) deja.note = o.note; return deja; }
    const a = {
      id: CR.uid("an"), ref, doc: (o.ref && o.ref.doc) || null, key: (o.ref && o.ref.key) || null, titre: (o.ref && o.ref.titre) || "",
      cote: T.coteDe(o.doc, o.ref && o.ref.titre), f: T.feuillet(o.doc, debut.p), debut, fin, t: cv.t, coul: o.coul || "verifier", note: o.note || "",
      marks: cv.marks, day: s.day,
    };
    W.annots.push(a);
    // en coulisse : un fait couvert passe en main (comme une note d'avant), sans rien signaler
    for (const m of cv.marks) if (m.ty === "f" && !CR.hasFact(cs, m.id)) { const n = CR.addNote(s, cs, { text: cv.t, fact: m.id, src: "annot" }); if (n) n.annot = a.id; }
    return a;
  };
  T.modifier = (cs, id, patch) => { const a = T.annot(cs, id); if (a) Object.assign(a, patch); return a; };
  T.retirer = function (cs, id) {
    const W = T.etat(cs);
    W.annots = W.annots.filter((a) => a.id !== id);
    W.liens = W.liens.filter((l) => l.a !== id && l.b !== id);
    W.chrono = W.chrono.filter((e) => e.annot !== id);
    W.versions.cells = W.versions.cells.filter((c) => c.annot !== id);
    for (const m of W.plan) m.annots = m.annots.filter((x) => x !== id);
  };

  // ------------------------------------------------------------------ onglets
  T.onglet = (cs, docId) => { const W = T.etat(cs); if (W.onglets.includes(docId)) W.onglets = W.onglets.filter((x) => x !== docId); else W.onglets.push(docId); return W.onglets.includes(docId); };
  T.aOnglet = (cs, docId) => !!(cs && cs.travail && cs.travail.onglets.includes(docId));

  // ------------------------------------------------------------------ liens : deux passages qui se contredisent
  T.relier = function (s, cs, a, b, quoi, note) {
    if (!a || !b || a === b || !T.annot(cs, a) || !T.annot(cs, b)) return null;
    const W = T.etat(cs);
    const deja = W.liens.find((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
    if (deja) { deja.quoi = quoi || deja.quoi; if (note != null) deja.note = note; return deja; }
    const l = { id: CR.uid("li"), a, b, quoi: quoi || "version", note: note || "", day: s.day };
    W.liens.push(l);
    return l;
  };
  T.lienDe = (cs, id) => (cs && cs.travail ? cs.travail.liens.filter((l) => l.a === id || l.b === id) : []);

  // ------------------------------------------------------------------ chronologie : le joueur date et heure lui-même
  // jour : numéro de jour du jeu ; heure : minutes depuis minuit
  T.placer = function (s, cs, o) {
    if (o.jour == null || o.heure == null || isNaN(o.jour) || isNaN(o.heure)) return null;
    const W = T.etat(cs);
    const e = { id: CR.uid("ch"), annot: o.annot || null, jour: +o.jour, heure: +o.heure, libelle: String(o.libelle || (o.annot && T.annot(cs, o.annot) ? T.annot(cs, o.annot).t.slice(0, 90) : "")).trim(), day: s.day };
    W.chrono.push(e);
    return e;
  };
  T.chronologie = function (cs) {
    const L = (cs && cs.travail ? cs.travail.chrono : []).slice().sort((x, y) => x.jour - y.jour || x.heure - y.heure);
    // écart avec l'événement précédent, en minutes
    return L.map((e, i) => Object.assign({}, e, { ecart: i ? (e.jour - L[i - 1].jour) * 1440 + e.heure - L[i - 1].heure : null }));
  };
  T.deplacer = (cs, id) => { const W = T.etat(cs); W.chrono = W.chrono.filter((e) => e.id !== id); };
  // « 9 h 45 », « 9h45 », « 9 heures 45 » dans une annotation : la seule heure qu'elle contient, pour pré-remplir
  T.heureDans = function (txt) {
    const re = /\b(\d{1,2})\s*(?:h|heures?)\s*(\d{2})?\b/g;
    const L = [...String(txt || "").matchAll(re)].map((m) => +m[1] * 60 + +(m[2] || 0)).filter((m) => m < 1440);
    return L.length === 1 ? L[0] : null;
  };
  // « 12 novembre 2026 » ou « 12/11/2026 » : la seule date qu'elle contient
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  T.dateDans = function (txt) {
    const L = [];
    for (const m of String(txt || "").matchAll(/\b(\d{1,2})(?:er)?\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})\b/gi)) L.push(CR.dayOf(+m[3], MOIS.indexOf(m[2].toLowerCase()) + 1, +m[1]));
    for (const m of String(txt || "").matchAll(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g)) L.push(CR.dayOf(+m[3], +m[2], +m[1]));
    return new Set(L).size === 1 ? L[0] : null;
  };

  // ------------------------------------------------------------------ tableau des versions
  T.point = function (cs, label) {
    label = String(label || "").trim(); if (!label) return null;
    const W = T.etat(cs);
    const deja = W.versions.points.find((x) => x.label.toLowerCase() === label.toLowerCase());
    if (deja) return deja;
    const pt = { id: CR.uid("pt"), label };
    W.versions.points.push(pt);
    return pt;
  };
  T.version = function (cs, o) {
    const W = T.etat(cs);
    if (!o.point || !o.qui || !o.annot || !W.versions.points.some((p) => p.id === o.point)) return null;
    const c = { id: CR.uid("vc"), point: o.point, qui: o.qui, annot: o.annot };
    W.versions.cells.push(c);
    return c;
  };
  T.retirerVersion = (cs, id) => { const W = T.etat(cs); W.versions.cells = W.versions.cells.filter((c) => c.id !== id); };

  // ------------------------------------------------------------------ plan de défense
  T.moyen = function (s, cs, o) {
    const W = T.etat(cs);
    const titre = String(o.titre || "").trim();
    if (!titre || !T.COLONNES.some((c) => c[0] === o.col)) return null;
    const m = { id: CR.uid("mo"), col: o.col, titre, annots: (o.annots || []).filter((x) => T.annot(cs, x)), irreg: o.irreg || null, day: s.day };
    W.plan.push(m);
    return m;
  };
  T.appuyer = (cs, moyenId, annotId) => { const m = T.etat(cs).plan.find((x) => x.id === moyenId); if (m && T.annot(cs, annotId) && !m.annots.includes(annotId)) m.annots.push(annotId); return m; };
  T.retirerMoyen = (cs, id) => { const W = T.etat(cs); W.plan = W.plan.filter((m) => m.id !== id); };
  T.planDe = (cs, col) => (cs && cs.travail ? cs.travail.plan.filter((m) => m.col === col) : []);

  // ------------------------------------------------------------------ irrégularité en quatre éléments
  // o : { annot, avec (autre annotation, pour une incohérence entre deux pièces), article ("63-1"), regime, grief, note }
  T.articleNorm = (x) => String(x || "").trim().replace(/^(art(icle)?\.?\s*)/i, "").replace(/\s+/g, "").replace(/^([LRD])\.?(\d)/i, (m, l, d) => l.toUpperCase() + d);
  T.relever = function (s, cs, o) {
    const a = T.annot(cs, o.annot);
    if (!a) return null;
    const b = o.avec ? T.annot(cs, o.avec) : null;
    const W = T.etat(cs);
    if (W.irregs.some((x) => x.annot === a.id)) return W.irregs.find((x) => x.annot === a.id);
    // le drapeau de l'anomalie, reconnu en coulisse : sur le passage, ou par la paire des deux passages rapprochés
    const fl = (x) => (x ? (x.marks.find((m) => m.ty === "flag") || {}).id || null : null);
    const pr = (x) => (x ? x.marks.filter((m) => m.ty === "paire").map((m) => m.id) : []);
    const flag = fl(a) || fl(b) || (b ? pr(a).find((id) => pr(b).includes(id)) || null : null);
    const article = T.articleNorm(o.article);
    const issue = CR.addIssue(s, cs, {
      text: a.t, flag: flag || null, type: b ? "incoherence" : "autre", avec: b ? b.t : null,
      ref: a.doc ? { doc: a.doc, key: a.key, titre: a.titre } : { key: a.key, titre: a.titre }, comment: String(o.note || "").trim() || null,
      article, regime: o.regime || null, grief: o.grief || null, annot: a.id,
    });
    if (!issue) return null;
    const ir = { id: CR.uid("ir"), annot: a.id, avec: b ? b.id : null, article, regime: o.regime || null, grief: o.grief || null, note: String(o.note || "").trim(), issue: issue.id, day: s.day };
    W.irregs.push(ir);
    if (a.coul !== "procedure") a.coul = "procedure";
    if (b) T.relier(s, cs, a.id, b.id, o.quoi || "heure");
    // le moyen de nullité rejoint la colonne « procédure » du plan de défense
    T.moyen(s, cs, { col: "procedure", titre: `Nullité : ${a.t.length > 70 ? a.t.slice(0, 67) + "…" : a.t}`, annots: [a.id].concat(b ? [b.id] : []), irreg: ir.id });
    return ir;
  };
  T.retirerIrreg = function (cs, id) {
    const W = T.etat(cs), ir = W.irregs.find((x) => x.id === id);
    if (!ir) return;
    W.irregs = W.irregs.filter((x) => x.id !== id);
    W.plan = W.plan.filter((m) => m.irreg !== id);
    cs.issues = cs.issues.filter((i) => i.id !== ir.issue);
  };
  // les quatre éléments au regard de l'anomalie réelle (débrief, audience) : jamais montré pendant la partie
  T.evaluer = function (cs, ir) {
    const iss = cs.issues.find((i) => i.id === ir.issue);
    const an = iss && iss.flag && CR.PROC && CR.PROC.anomalie ? CR.PROC.anomalie(cs, iss.flag) : null;
    const reg = an ? CR.IRREG[an.irreg] : null;
    if (!reg) return { passage: false, texte: false, regime: false, grief: false };
    const textes = (reg.textes || []).map((x) => x.replace(/^[A-Z]+_/, ""));
    return {
      passage: true,
      texte: textes.includes(ir.article) && ir.article !== "802",
      regime: ir.regime === reg.grief,
      grief: reg.grief === "presume" ? true : !!ir.grief && ir.grief !== "presume",
      regle: reg,
    };
  };
})();
