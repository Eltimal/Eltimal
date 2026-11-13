// Refonte, B2 (premier jet) : les blancs d'actes reçoivent des clauses d'un fonds commun en mode libre.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const F = CR.CLAUSES.fonds();
  const libs = Object.keys(F);
  ok(libs.length >= 5, "fonds commun trop pauvre", libs.length);
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); s.settings.saisie = "assiste";
  let enrichis = 0, blancs = 0, premierLong = 0, n = 0;
  for (const id of Object.keys(CR.CASES)) {
    let cs; try { cs = CR.openCase(s, id); } catch (e) { continue; }
    cs.proc.audience = cs.proc.audience || { day: s.day + 30, juridiction: "tc", convocDay: s.day };
    for (const k of new Set([...Object.keys(CR.SHARED_TPL), ...Object.keys(CR.CASES[id].tpls || {})])) {
      let t, t0, t2; try { t = CR.getTpl(s, cs, k); t2 = CR.getTpl(s, cs, k); t0 = CR.getTpl0(s, cs, k); } catch (e) { continue; }
      ok(JSON.stringify(t.slots || {}) === JSON.stringify(t2.slots || {}), "enrichissement non déterministe : " + k);
      for (const [sid, sl] of Object.entries(t.slots || {})) {
        if (sl.type !== "choice") continue;
        blancs++;
        const sl0 = (t0.slots || {})[sid];
        ok(sl0 && sl.options.slice(0, sl0.options.length).every((o, i) => o.v === sl0.options[i].v && o.ok === sl0.options[i].ok), "les options d'origine ont changé : " + k + "/" + sid);
        const add = sl.options.filter((o) => o.fonds);
        if (add.length) { enrichis++; ok(add.every((o) => o.ok === false), "une clause du fonds est juste"); }
        if (add.length && !sl0.options.every((o) => /^o\d+$/.test(o.v))) ok(false, "un blanc à valeur propre a été enrichi : " + k + "/" + sid);
        const bon = sl.options.filter((o) => o.ok).length === 1 ? sl.options.find((o) => o.ok) : null; if (bon) { n++; if (sl.options.every((o) => o === bon || o.t.length < bon.t.length)) premierLong++; }
      }
    }
  }
  ok(enrichis >= 10, "trop peu de blancs enrichis", `${enrichis}/${blancs}`);
  // l'évaluation : une clause du fonds choisie est un défaut
  const cs = Object.values(s.cases)[0];
  console.log(`fonds : ${libs.length} intitulés · blancs enrichis : ${enrichis}/${blancs} · bonne option la plus longue : ${Math.round(premierLong / Math.max(1, n) * 100)} %`);
  s.settings.saisie = "liste";
  const csL = CR.openCase(s, Object.keys(CR.CASES)[1]);
  let tL; try { tL = CR.getTpl(s, csL, Object.keys(CR.SHARED_TPL)[0]); } catch (e) { tL = null; }
  ok(!tL || Object.values(tL.slots || {}).every((sl) => !(sl.options || []).some((o) => o.fonds)), "le mode liste reçoit des clauses du fonds");
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
