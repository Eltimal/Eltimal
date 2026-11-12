/* La Permanence — le dossier des violences en flagrance tiré du pilote de la session parallèle (lot 1, fusion).
   CR.SIMV (sim-violences.js) simule l'affaire de violences dans le détail (qui insulte, qui touche le premier, les coups,
   la chute, les lésions zone par zone, l'innocent éventuel, le second) et CR.DOCSV (docs-violences.js) compose ses
   23 trames. Ici, pour une comparution immédiate que CR.SIMV sait jouer :
   - la simulation suit la chronologie de la garde à vue du jeu (C : interpellation, notification, avis, audition) ;
   - chaque pièce est convertie au format du jeu (UI.Paper, bloc-notes) et garde sa forme d'origine pour le lecteur ;
   - les faits du bloc-notes (f), irrégularités (flag) et paires (paire) que portaient les anciennes pièces sont posés sur
     le passage qui les dit ; à défaut, le passage d'origine est ajouté avant la clôture. Rien ne se perd.
   SIM.piecesViolences(t, k, anciens) → { docs, titres, ordre, cotes } au format de SIM.pieces, ou null (moteur générique). */
(function () {
  const CR = window.CR;
  const SIM = CR.SIM;
  SIM.simvCache = {}; // simulation de chaque affaire, pour l'image de la caméra (UI.Paper, lecteur)

  // irrégularités dont le pilote et le jeu ont le même sens ; « heures » n'y est pas (deux lectures différentes)
  const IRR = ["gav_notif", "avis_parquet", "sans_avocat", "controle_identite", "interprete", "prolongation"];
  SIM.violencesOK = (t) => !!(CR.SIMV && CR.DOCSV && t && t.genre === "ci" && CR.SIMV.supporte(t) && (t.irr || []).every((i) => IRR.includes(i)));

  // trame du pilote → clé de pièce du jeu
  const CLE = {
    saisine: "pv_interpellation", notification: "pv_notification", droits: "declaration_droits", avis_parquet: "avis_parquet", diligences: "avis_avocat",
    fouille: "pv_fouille", scelle: "pv_scelle", req_medecin: "requisition_medecin", certificat_gav: "certificat_gav", plainte: "pv_victime",
    certificat_urg: "certificat_urgences", umj: "certificat", casier: "casier", esr: "esr", aud_temoin: "pv_temoin", req_video: "requisition_video", video: "pv_video",
    audition: "pv_audition", prolongation: "pv_prolongation", deroulement: "pv_fin_gav", synthese: "pv_synthese", comparution: "pv_comparution",
  };
  const COURT = { pv_interpellation: "Interpellation", pv_notification: "Notification des droits", declaration_droits: "Déclaration des droits", avis_parquet: "Avis au parquet", avis_avocat: "Diligences", pv_fouille: "Inventaire et saisie", pv_scelle: "Scellé", requisition_medecin: "Réquisition à médecin", certificat_gav: "Certificat de garde à vue", pv_victime: "Plainte", certificat_urgences: "Certificat des urgences", certificat: "Certificat de l'UMJ", pv_temoin: "Audition du témoin", requisition_video: "Réquisition vidéo", pv_video: "Exploitation vidéo", pv_audition: "Audition en garde à vue", pv_prolongation: "Prolongation de la garde à vue", pv_fin_gav: "Fin de garde à vue", pv_synthese: "Synthèse", pv_comparution: "Comparution devant le procureur", bordereau: "Bordereau" };
  // le casier et l'enquête sociale restent ceux du jeu (antécédents, récidive, garanties) : le pilote ne les compose pas ici
  const GARDER = ["casier", "esr"];

  // ---------------------------------------------------------------- une pièce du pilote → le format du jeu
  function convertir(d, S, num) {
    const paras = [], pstyle = [], sigs = [];
    let bandeau = null, entete = [], schema = null, capture = null;
    const push = (seg, st) => { paras.push(seg); pstyle.push(st); };
    d.feuillets.forEach((f, i) => {
      if (i > 0) push([`Feuillet ${i} / ${d.feuillets.length}`], "saut");
      for (const b of f) {
        switch (b.k) {
          case "bandeau": if (!bandeau) bandeau = { service: b.service, unite: "", cadre: b.cadre, titre: b.titre, qualite: b.qualite, grille: Object.entries(b.grille || {}) }; break;
          case "entete": entete = b.lignes.concat(b.droite || []); break;
          case "titre": case "stitre": push([b.t], "titre"); break;
          case "qr": push([`Question : ${b.q}`], "q"); push([`Réponse : ${b.r}`], "r"); break;
          case "grille": for (const r of b.rows) push([`${r[0]} : ${r[1]}`], "ligne"); break;
          case "table": for (const r of b.rows) push([r.join(" · ")], "ligne"); break;
          case "liste": for (const x of b.items) push([`– ${x}`], "p"); break;
          case "sig": for (const c of b.cases) sigs.push({ qui: c.nom ? `${c.role} : ${c.nom}` : c.role, t: c.etat === "signe" ? "signé" : c.etat === "refus" ? "refuse de signer" : "" }); break;
          case "image": if (b.spec && b.spec.type === "camera") capture = { sig: S.sig }; else if (b.spec) schema = b.spec.lesions || []; break;
          default: push([b.t], b.cls === "decl" ? "decl" : b.cls === "cloture" || b.cls === "mention" || b.cls === "petit" ? "mention" : "p");
        }
      }
    });
    // support du dossier (SIM.numerique) : en procédure numérique, une signature électronique unique (art. 801-1)
    if (num) { for (const g of sigs) if (g.t === "signé") g.t = "signature électronique"; if (bandeau) bandeau.grille.push(["Support", "procédure pénale numérique"]); }
    const doc = { title: d.titre, kind: d.forme === "pv" ? "pv" : "courrier", trame: d.forme === "pv" ? "pv" : "forme", cote: d.cote, bandeau, entete, paras, pstyle, sigs, feuillets: d.feuillets.length, lecteur: d, numerique: !!num };
    if (schema && schema.length) doc.schema = schema;
    if (capture) doc.capture = capture;
    return doc;
  }

  // ---------------------------------------------------------------- où poser chaque fait : le passage qui le dit
  // marque → [clé de pièce, styles admis, expression] ; le premier passage qui convient la porte
  const OU = {
    "f:G_interp": [["p"], /procédons à l'interpellation|à l'interpellation de|interpellons/i],
    "flag:controle_identite": [["p"], /contrôle d'identité|contrôler son identité|contrôlons/i],
    "f:G_camera": [["p"], /caméra/i],
    "f:G_langue": [["p"], /français|interprète|langue/i], "paire:interprete": [["p"], /français|interprète|langue/i],
    "f:G_debut": [["p"], /garde à vue à compter/i],
    "f:G_notif_pv": [["p"], /^Le .* à .*heures?/], "flag:gav_notif": [["p"], /^Le .* à .*heures?/],
    "f:G_notif_fr": [["p"], /langue qu'(il|elle) comprend/i], "flag:interprete": [["p"], /langue qu'(il|elle) comprend|interprète/i],
    "paire:sans_avocat": [["p", "ligne"], /avocat/i], "flag:sans_avocat": [["p", "mention"], /ne s'est pas présenté|hors la présence|sans avocat/i],
    "flag:prolongation": [["p"], /autoris/i],
    "f:G_plainte": [["decl"], /./],
    "f:G_itt": [["p"], /incapacité totale de travail/i], "f:G_itt_umj": [["p"], /incapacité totale de travail/i], "f:G_itt_urg": [["p", "decl"], /incapacité|arrêt de travail/i],
    "f:G_video": [["p"], /silhouette|vêtements|correspond/i], "f:G_doute_ident": [["r", "p", "decl"], /reconna|visage|pas sûr|identifi/i],
    "f:G_temoin_contra": [["r", "decl"], /ne peux pas l'affirmer|pas vu comment|ne suis pas sûr|ne pourrais pas/i],
    "f:G_ld": [["decl", "r"], /le premier|a commencé|col|lev[ée] le poing|s'est jeté/i],
    "f:G_seul": [["decl", "r"], /seul/i], "f:G_sans_violence": [["decl", "r"], /pas touch/i],
    "f:G_aveu": [["r"], /gifle|coup|frapp|mis|donné/i],
  };
  function poser(doc, m, seg) {
    const [type, id] = m.split(":"), regle = OU[m];
    const mettre = (i) => { const s0 = doc.paras[i][0]; const o = typeof s0 === "string" ? { t: s0 } : s0; o[type] = id; doc.paras[i] = [o]; };
    if (regle) for (let i = 0; i < doc.paras.length; i++) {
      if (!regle[0].includes(doc.pstyle[i])) continue;
      const tx = typeof doc.paras[i][0] === "string" ? doc.paras[i][0] : doc.paras[i][0].t;
      if (regle[1].test(tx)) { mettre(i); return true; }
    }
    // à défaut : le passage d'origine, avant la clôture
    let k = doc.pstyle.lastIndexOf("mention"); if (k < 0) k = doc.paras.length;
    const o = { t: seg.t }; o[type] = id;
    doc.paras.splice(k, 0, [o]); doc.pstyle.splice(k, 0, "p");
    return false;
  }

  SIM.piecesViolences = function (t, k, anciens) {
    if (!SIM.violencesOK(t)) return null;
    anciens = Object.assign({}, anciens); // les anciennes pièces, avant leur remplacement (sinon chaque pièce se relirait elle-même)
    let S;
    try { S = CR.SIMV.simuler(t, { C: k.C }); } catch (e) { return null; }
    if (!S) return null;
    SIM.simvCache[t.sig] = S;
    const liste = CR.DOCSV.liste(S);
    const docs = {}, titres = {}, ordre = [], cotes = {};
    const vus = new Set();
    for (const e of liste) {
      const key = CLE[e.id];
      if (!key || vus.has(key)) continue;
      vus.add(key);
      ordre.push({ key, m: e.m, court: COURT[key] || e.titre, cote: e.cote, id: e.id });
    }
    // les pièces anciennes que le pilote ne compose pas (téléphonie, ADN, constat de la défense…) restent, cotées à la suite
    const derniere = ordre.reduce((a, o) => Math.max(a, +String(o.cote || "D0").replace(/^D(\d+).*/, "$1")), 0);
    let n = derniere;
    for (const x of k.reste || []) if (!vus.has(x.key) && !GARDER.includes(x.key)) ordre.push({ key: x.key, m: x.m, court: x.court, cote: "D" + ++n, ancien: true });
    ordre.push({ key: "bordereau", m: 1e9, court: "Bordereau d'envoi", cote: null, id: "bordereau" });
    for (const o of ordre) { cotes[o.key] = o.cote; titres[o.key] = o.cote ? `${o.court} (${o.cote})` : o.court; }
    // les marques des anciennes pièces, par clé
    const marquesDe = (key) => {
      const fn = anciens[key]; if (!fn) return [];
      let r; try { r = fn({ s: CR.store && CR.store.s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {}, docs: [] }, def: {}, c: t.A, api: {} }); } catch (e) { return []; }
      const out = [];
      for (const g of [].concat(...(r.paras || []), r.sigs || [])) if (g && typeof g === "object") for (const ty of ["f", "flag", "paire"]) if (g[ty]) out.push({ m: `${ty}:${g[ty]}`, seg: g });
      return out;
    };
    for (const o of ordre) {
      if (o.ancien || GARDER.includes(o.key)) continue; // casier et enquête sociale du jeu, à la cote du pilote
      const key = o.key;
      docs[key] = () => {
        const d = key === "bordereau" ? CR.DOCSV.bordereau(S) : CR.DOCSV.composer(S, o.id);
        const doc = convertir(d, S, SIM.numerique(t, k.TJ));
        doc.cote = cotes[key] || doc.cote;
        for (const { m, seg } of marquesDe(key)) poser(doc, m, seg);
        return doc;
      };
    }
    return { docs, titres, ordre, cotes, S };
  };
})();
