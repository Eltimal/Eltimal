// La Permanence — refonte du gameplay, lot B2 (premier jet) : les actes par clauses prises dans un fonds commun (CR.CLAUSES)
// Un blanc d'acte ne propose plus deux formules taillées pour l'affaire : en mode libre, il reçoit aussi des clauses du
// même intitulé venues des autres actes du jeu — justes ailleurs, fausses ici. La bonne n'est plus la première (ordre
// mélangé, ui-scenes.js) ni, le plus souvent, la plus longue. Seuls les blancs à formules libres sont concernés : un blanc
// dont la valeur commande une suite de procédure (étendue de l'appel, voie…) garde ses options.
(function () {
  "use strict";
  const CR = window.CR;
  const K = (CR.CLAUSES = {});
  K.MAX = 2; // clauses ajoutées par blanc
  const norm = (t) => String(t || "").toLowerCase().replace(/\s+/g, " ").trim();
  const libre = (o) => /^o\d+$/.test(o.v); // options sans valeur propre (CR.choiceSlot)
  let fonds = null;
  // le fonds commun : les formules de chaque intitulé de blanc, dans les gabarits des affaires écrites
  K.fonds = function () {
    if (fonds) return fonds;
    fonds = {};
    if (!CR.CASES || !CR.newGame || !CR.getTpl0) return fonds;
    // une partie de travail, le temps de lire les modèles d'actes : CR.newGame la place dans CR.store.s ; la partie du joueur
    // est remise en place à la fin (sinon, au premier acte ouvert en mode libre, la partie en cours était remplacée)
    const partieDuJoueur = CR.store && CR.store.s;
    try { return construire(); } finally { if (CR.store) CR.store.s = partieDuJoueur; }
  };
  function construire() {
    let s0;
    try { s0 = CR.newGame({ prenom: "Fonds", nom: "Commun", mode: "carriere", seed: 99 }); s0.settings.saisie = "liste"; } catch (e) { return fonds; }
    // les affaires du fonds : celles déjà définies, et des affaires générées de chaque genre (il n'y a plus d'affaire écrite)
    const dossiers = [];
    for (const id of Object.keys(CR.CASES)) { try { dossiers.push(CR.openCase(s0, id)); } catch (e) { /* définition incomplète */ } }
    // numérotées à part (g_<genre>_<n> se compte par partie : elles écraseraient les affaires du joueur), retirées ensuite
    const deTravail = [];
    s0.genCount = 1e6;
    if (CR.GEN && CR.GEN.open) for (const g of ["gav", "ci", "copj", "op", "pc", "info", "al"]) for (let i = 0; i < 3; i++) { try { const c = CR.GEN.open(s0, g, {}); if (c) { dossiers.push(c); deTravail.push(c.def); } } catch (e) { /* genre indisponible */ } }
    for (const cs of dossiers) {
      if (!cs || !CR.CASES[cs.def]) continue;
      const keys = new Set([...Object.keys(CR.SHARED_TPL || {}), ...Object.keys(CR.CASES[cs.def].tpls || {})]);
      for (const k of keys) {
        let t; try { t = CR.getTpl0(s0, cs, k); } catch (e) { continue; }
        for (const sl of Object.values((t && t.slots) || {})) {
          if (!sl || sl.type !== "choice" || !sl.label || !(sl.options || []).every(libre)) continue;
          const L = (fonds[norm(sl.label)] = fonds[norm(sl.label)] || []);
          for (const o of sl.options) if (o.t && !L.some((x) => norm(x) === norm(o.t))) L.push(o.t);
        }
      }
    }
    for (const id of deTravail) delete CR.CASES[id];
    return fonds;
  };
  // la clause voisine : la bonne formule, faussée sur ce qui fait sa justesse (un numéro d'article, un délai, une
  // juridiction). Même longueur, même ton : seule la connaissance de la règle la distingue.
  const DELAIS = [["vingt-quatre heures", "quarante-huit heures"], ["quarante-huit heures", "vingt-quatre heures"], ["dix jours", "quinze jours"],
    ["cinq jours", "trois jours"], ["trois jours", "cinq jours"], ["quinze jours", "dix jours"], ["huit jours", "quinze jours"], ["vingt jours", "dix jours"],
    ["un mois", "deux mois"], ["deux mois", "un mois"], ["trois mois", "six mois"], ["six mois", "trois mois"], ["un an", "trois ans"], ["trois ans", "un an"], ["six ans", "trois ans"]];
  const JURI = [["chambre des appels correctionnels", "chambre de l'instruction"], ["chambre de l'instruction", "chambre des appels correctionnels"],
    ["tribunal de police", "tribunal correctionnel"], ["tribunal correctionnel", "tribunal de police"], ["juge des libertés et de la détention", "juge d'instruction"],
    ["juge d'instruction", "juge des libertés et de la détention"], ["procureur de la République", "procureur général"], ["procureur général", "procureur de la République"]];
  K.voisine = function (t, r) {
    const muts = [];
    const art = /\b(articles?|art\.)\s+((?:[LRD]\.?\s?)?\d+(?:-\d+)*)/g;
    let m;
    while ((m = art.exec(t))) {
      const num = m[2], parts = num.split("-"), last = +parts[parts.length - 1];
      const d = 1 + Math.floor(r() * 3), nv = last > d + 1 && r() < 0.5 ? last - d : last + d;
      parts[parts.length - 1] = String(nv);
      const i = m.index + m[0].length - num.length;
      muts.push(t.slice(0, i) + parts.join("-") + t.slice(i + num.length));
    }
    for (const [a, b] of DELAIS.concat(JURI)) {
      const mm = new RegExp("(^|[^a-zà-ÿ])" + a.replace(/[.']/g, "\\$&") + "(?![a-zà-ÿ])").exec(t);
      if (mm) { const i = mm.index + mm[1].length; if (!t.slice(i).startsWith(b)) muts.push(t.slice(0, i) + b + t.slice(i + a.length)); }
    }
    const ch = /(\d+) (jours|heures|mois)/.exec(t);
    if (ch) { const n = +ch[1], nv = n >= 2 ? (r() < 0.5 ? Math.round(n / 2) : n * 2) : 3; if (nv !== n) muts.push(t.slice(0, ch.index) + nv + " " + ch[2] + t.slice(ch.index + ch[0].length)); }
    return muts.length ? muts[Math.floor(r() * muts.length)] : null;
  };
  K.enrichir = function (s, cs, key, tpl) {
    if (!tpl || !tpl.slots || !(CR.libre && CR.libre(s))) return tpl;
    const F = K.fonds();
    const slots = {};
    let change = false;
    for (const [id, sl] of Object.entries(tpl.slots)) {
      slots[id] = sl;
      if (!sl || sl.type !== "choice" || !(sl.options || []).every(libre)) continue;
      const deja = new Set(sl.options.map((o) => norm(o.t)));
      const r = CR.seeded(cs.id + ":clause:" + key + ":" + id);
      const bonO = sl.options.find((o) => o.ok);
      const vois = bonO ? K.voisine(bonO.t, r) : null;
      const ajout = vois && !deja.has(norm(vois)) ? [{ v: "fv", t: vois, ok: false, fonds: true, voisine: true }] : [];
      if (ajout.length) deja.add(norm(vois));
      const cand = (F[norm(sl.label)] || []).filter((t) => !deja.has(norm(t)));
      if (!cand.length && !ajout.length) continue;
      // d'abord des clauses plus longues que la bonne : la longueur ne doit plus désigner la réponse
      const bon = (sl.options.find((o) => o.ok) || { t: "" }).t.length;
      const pris = cand.map((t) => ({ t, k: r() + (t.length > bon ? 0 : 1) })).sort((a, b) => a.k - b.k).slice(0, K.MAX - ajout.length);
      slots[id] = Object.assign({}, sl, { options: sl.options.concat(ajout, pris.map((x, i) => ({ v: "fc" + i, t: x.t, ok: false, fonds: true }))) });
      change = true;
    }
    return change ? Object.assign({}, tpl, { slots }) : tpl;
  };
  if (CR.getTpl && !CR.getTpl0) {
    CR.getTpl0 = CR.getTpl;
    CR.getTpl = function (s, cs, key) { return K.enrichir(s, cs, key, CR.getTpl0(s, cs, key)); };
  }
})();
