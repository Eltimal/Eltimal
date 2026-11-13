// Refonte, lot 7 : le délibéré criminel élément par élément. node tests/tcrimes.js   « échecs: 0 » attendu.
// Sur des affaires criminelles générées : le raisonnement est tenu (élément par élément, débrief en corrigé) ; rien plaidé,
// presque toujours la condamnation ; les moyens d'acquittement forts plaidés, nettement moins ; les faibles n'acquittent pas.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 11 }); CR.store.s = s; s.settings.saisie = "liste";
  const AQ = ["identification", "consentement", "connaissance", "geste_medical", "ld", "contrainte", "force_legitime"];
  let n = 0, rien = [0, 0], tout = [0, 0], forts = [0, 0], faibles = [0, 0], raisonne = 0;
  for (let i = 0; i < 400 && n < 120; i++) {
    let cs; try { cs = CR.GEN.open(s, "info", { min: s.min }); } catch (e) { continue; }
    const t = CR.GEN.paramsOf(s, cs.id).t; if (!t || !t.enjeux) continue;
    cs.vars.jurProces = t.jur; cs.vars.reglement = { qual: "q" };
    let d0, d1;
    try { d0 = CR.runHook(s, cs, "decider", { st: { played: new Set(), dernierMot: "regrets" } }); } catch (e) { ok(false, `${cs.id} : décision : ${e.message}`); continue; }
    if (cs.vars.raisonnement) raisonne++;
    const deb = (cs.vars.debriefJugement || []).filter((x) => x.kind === "calc").map((x) => x.text).join(" ");
    { const tx = deb + JSON.stringify(d0.questions || []); const m = /.{80}(undefined|NaN).{40}/.exec(tx); ok(!m, `${cs.id} : raisonnement incomplet`, m && m[0]); }
    n++;
    rien[0] += d0.coupable ? 1 : 0; rien[1]++;
    if (t.enjeux.some((e) => AQ.includes(e))) {
      try { d1 = CR.runHook(s, cs, "decider", { st: { played: new Set(t.enjeux.flatMap((e) => ["arg:" + e, "E_" + e])), dernierMot: "regrets" } }); } catch (e) { continue; }
      tout[0] += d1.coupable ? 1 : 0; tout[1]++;
      const fortAq = t.enjeux.some((e) => AQ.includes(e) && (t.f.forts || []).includes(e)); const g = fortAq ? forts : faibles; g[0] += d1.coupable ? 1 : 0; g[1]++;
    }
  }
  const pc = (x) => Math.round((100 * x[0]) / Math.max(1, x[1]));
  console.log(`moyens plaidés : forts ${pc(forts)} % de condamnations (n=${forts[1]}) · faibles ${pc(faibles)} % (n=${faibles[1]})`);
  ok(n >= 80, "trop peu d'affaires criminelles", n);
  ok(raisonne >= n * 0.9, "le délibéré criminel ne raisonne pas élément par élément", `${raisonne}/${n}`);
  ok(pc(rien) >= 95, "sans rien plaider, trop d'acquittements", pc(rien));
  // un moyen fort (le dossier le soutient) fait douter ; un moyen faible, plaidé, n'acquitte pas (D-68)
  ok(pc(forts) <= 85 && pc(forts) >= 40, "les moyens forts plaidés ne pèsent pas, ou trop", pc(forts));
  ok(pc(faibles) >= 90, "des moyens faibles acquittent", pc(faibles));
  ok(pc(faibles) - pc(forts) >= 10, "un moyen fort ne pèse pas plus qu'un faible", `${pc(forts)} / ${pc(faibles)}`);
  console.log(`crimes : ${n} · raisonnés ${raisonne} · condamnations sans plaidoirie ${pc(rien)} % · moyens d'acquittement plaidés ${pc(tout)} % (n=${tout[1]})`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
