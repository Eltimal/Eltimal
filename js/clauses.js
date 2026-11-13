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
    let s0;
    try { s0 = CR.newGame({ prenom: "Fonds", nom: "Commun", mode: "carriere", seed: 99 }); s0.settings.saisie = "liste"; } catch (e) { return fonds; }
    for (const id of Object.keys(CR.CASES)) {
      let cs; try { cs = CR.openCase(s0, id); } catch (e) { continue; }
      const keys = new Set([...Object.keys(CR.SHARED_TPL || {}), ...Object.keys(CR.CASES[id].tpls || {})]);
      for (const k of keys) {
        let t; try { t = CR.getTpl0(s0, cs, k); } catch (e) { continue; }
        for (const sl of Object.values((t && t.slots) || {})) {
          if (!sl || sl.type !== "choice" || !sl.label || !(sl.options || []).every(libre)) continue;
          const L = (fonds[norm(sl.label)] = fonds[norm(sl.label)] || []);
          for (const o of sl.options) if (o.t && !L.some((x) => norm(x) === norm(o.t))) L.push(o.t);
        }
      }
    }
    return fonds;
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
      const cand = (F[norm(sl.label)] || []).filter((t) => !deja.has(norm(t)));
      if (!cand.length) continue;
      const r = CR.seeded(cs.id + ":clause:" + key + ":" + id);
      // d'abord des clauses plus longues que la bonne : la longueur ne doit plus désigner la réponse
      const bon = (sl.options.find((o) => o.ok) || { t: "" }).t.length;
      const pris = cand.map((t) => ({ t, k: r() + (t.length > bon ? 0 : 1) })).sort((a, b) => a.k - b.k).slice(0, K.MAX);
      slots[id] = Object.assign({}, sl, { options: sl.options.concat(pris.map((x, i) => ({ v: "fc" + i, t: x.t, ok: false, fonds: true }))) });
      change = true;
    }
    return change ? Object.assign({}, tpl, { slots }) : tpl;
  };
  if (CR.getTpl && !CR.getTpl0) {
    CR.getTpl0 = CR.getTpl;
    CR.getTpl = function (s, cs, key) { return K.enrichir(s, cs, key, CR.getTpl0(s, cs, key)); };
  }
})();
