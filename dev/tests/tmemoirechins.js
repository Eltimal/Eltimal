// Refonte, lot 7 : le mémoire devant la chambre de l'instruction. node tests/tmemoirechins.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 21 }); CR.store.s = s; s.settings.saisie = "liste";
  const prep = (type) => {
    for (let i = 0; i < 40; i++) {
      let cs; try { cs = CR.GEN.open(s, "info", {}); } catch (e) { continue; }
      const t = CR.GEN.paramsOf(s, cs.id).t; if (t.camp === "pc" || !t.enjeux) continue;
      cs.status = "active"; cs.vars.reglement = cs.vars.reglement || { qual: "q", type: "oma" };
      cs.vars.appelOuvert = { type, jusque: s.day + 10, label: "l'ordonnance", labelCourt: "ordonnance" };
      cs.drafted.appel_ordo = [{ day: s.day, min: s.min, defects: [], picks: {}, filled: {}, depose: false }];
      CR.runHook(s, cs, "filed_appel_ordo", { depot: true });
      const h = cs.hearings.find((x) => x.script === "chins");
      if (h) return { cs, h };
    }
    return null;
  };
  const deposer = (cs, defects, points) => { cs.drafted.memoire_chins = [{ day: s.day, min: s.min, defects, picks: { points }, filled: {}, depose: false }]; CR.deposer(s, cs, "memoire_chins"); };
  // 1. à temps : recevable
  const a = prep("dp");
  ok(a, "pas d'audience de la chambre de l'instruction");
  if (a) {
    ok(CR.caseTasks(s, a.cs).some((x) => /mémoire pour la chambre/.test(x.label)), "pas de tâche de mémoire");
    deposer(a.cs, [], ["garanties", "144"]);
    ok(a.cs.vars.memoire && a.cs.vars.memoire.recevable, "le mémoire déposé à temps n'est pas recevable", JSON.stringify(a.cs.vars.memoire));
  }
  // 2. hors délai (hors détention : trois jours avant)
  const b = prep("oma");
  if (b) {
    s.day = b.h.day - 1;
    deposer(b.cs, [], []);
    ok(b.cs.vars.memoire && !b.cs.vars.memoire.recevable && b.cs.erreurs.some((e) => e.id === "memoire_tardif"), "le mémoire déposé la veille n'est pas irrecevable", JSON.stringify(b.cs.vars.memoire));
    s.day = b.h.day - 20;
  }
  // 3. non récapitulatif : le motif de la déclaration d'appel tombe
  const c = prep("oma");
  if (c) {
    deposer(c.cs, ["recap:absent"], []);
    ok(c.cs.vars.appelForme && c.cs.vars.appelForme.motif === false && c.cs.erreurs.some((e) => e.id === "memoire_recap"), "le mémoire non récapitulatif n'abandonne pas les moyens");
  }
  // 4. l'effet : en détention, un mémoire aux garanties améliore les chances de sortie (sans avocat à l'audience)
  let sans = 0, avec = 0, n = 0;
  for (let k = 0; k < 40; k++) {
    const x = prep("dp"); if (!x) continue; n++;
    const api = CR.api(s, x.cs);
    const r1 = JSON.stringify(CR.runHook(s, x.cs, "chinsDecider", { played: new Set() }));
    if (!/confirme/.test(r1)) sans++;
    x.cs.proc.detention.statut = "dp";
    x.cs.vars.memoire = { recevable: true, recap: true, points: ["garanties", "144"] };
    const r2 = JSON.stringify(CR.runHook(s, x.cs, "chinsDecider", { played: new Set() }));
    if (!/confirme/.test(r2)) avec++;
  }
  ok(n >= 15 && avec >= sans, "le mémoire ne change rien à la décision", `${sans} → ${avec} sur ${n}`);
  console.log(`chambre de l'instruction : sorties sans mémoire ${sans}, avec mémoire ${avec} (sur ${n})`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
