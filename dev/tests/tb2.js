// Refonte, lot 8 : l'exclusion de la mention au bulletin n° 2 (art. 775-1 CPP). node tests/tb2.js   « échecs: 0 » attendu.
// Demandée par la défense, le tribunal la retient ou la rejette, motifs à l'appui, et l'inscrit au dispositif ; jamais pour
// les infractions de l'article 706-47 ; non demandée, rien n'est dit ; l'argument se plaide appuyé sur l'emploi du client.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const AP = CR.AP;
  // la liste de l'article 706-47
  const api0 = { s: { cases: {} }, cs: { id: "x" } };
  ok(!AP.b2Possible(api0, { court: "art. 222-27 et 222-28 CP" }) && !AP.b2Possible(api0, { court: "art. 222-23 CP" }) && AP.b2Possible(api0, { court: "art. 222-13 CP" }) && AP.b2Possible(api0, { court: "art. 311-1 CP" }), "liste de l'article 706-47 mal lue");
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 5 }); CR.store.s = s; s.settings.saisie = "liste";
  let n = 0, exclus = 0, rejets = 0, sans = 0, interdits = 0;
  for (let i = 0; i < 1500 && n < 60; i++) {
    let cs; try { cs = CR.GEN.open(s, ["ci", "copj", "op"][i % 3], {}); } catch (e) { continue; }
    const p = CR.GEN.paramsOf(s, cs.id); if (!p || !p.t || cs.camp === "pc" || !CR.hookExists(cs, "decider")) continue;
    if (i % 4) CR.addNote(s, cs, { text: "Attestation de l'employeur.", fact: "G_emploi", src: "gav" }); // un dossier sur quatre sans justification
    let d; try { d = CR.runHook(s, cs, "decider", { st: { played: new Set(["arg:b2"]), dernierMot: "regrets" } }); } catch (e) { continue; }
    if (!d || !d.coupable) continue;
    n++;
    const q = (d.questions || []).find((x) => /bulletin n° 2/.test(x.q));
    const possible = AP.b2Possible(CR.api(s, cs), d.qualif);
    ok(q && q.motif, `${cs.id} : la demande d'exclusion n'a pas de réponse motivée`);
    if (!possible) { interdits++; ok(!cs.vars.b2Exclu && /706-47/.test(q && q.motif), `${cs.id} : exclusion accordée malgré l'article 706-47`, q && q.motif); }
    if (!CR.hasFact(cs, "G_emploi")) ok(!cs.vars.b2Exclu, `${cs.id} : exclusion accordée sans justification de l'emploi`);
    if (cs.vars.b2Exclu) { exclus++; ok(/bulletin n° 2/.test(d.dispositif), `${cs.id} : l'exclusion n'est pas au dispositif`, d.dispositif); } else rejets++;
    // non demandée : rien
  }
  for (let i = 0; i < 400 && sans < 10; i++) {
    let cs; try { cs = CR.GEN.open(s, ["ci", "copj"][i % 2], {}); } catch (e) { continue; }
    if (cs.camp === "pc" || !CR.hookExists(cs, "decider")) continue;
    let d; try { d = CR.runHook(s, cs, "decider", { st: { played: new Set(), dernierMot: "regrets" } }); } catch (e) { continue; }
    if (!d || !d.coupable) continue;
    sans++; ok(!(d.questions || []).some((x) => /bulletin n° 2/.test(x.q)), `${cs.id} : le tribunal statue sur le bulletin n° 2 sans demande`);
  }
  ok(n >= 30 && exclus > 0 && rejets > 0, "trop peu de décisions, ou jamais d'exclusion ou de rejet", JSON.stringify({ n, exclus, rejets }));
  // l'argument : présent si l'emploi est en main, absent sinon
  const C = CR.PLAID && CR.PLAID.ctx;
  for (let i = 0; i < 200; i++) {
    let cs; try { cs = CR.GEN.open(s, "ci", {}); } catch (e) { continue; }
    const t = CR.GEN.paramsOf(s, cs.id).t; if (!t.A || !t.A.emploi || cs.camp === "pc") continue;
    const P0 = { role: "defense", args: [] };
    const sansCarte = CR.PLAID.preparer(s, cs, P0);
    CR.addNote(s, cs, { text: "Il travaille.", fact: "G_emploi", src: "gav" });
    const avec = CR.PLAID.preparer(s, cs, P0);
    ok(!sansCarte.args.some((a) => a.id === "b2") && avec.args.some((a) => a.id === "b2"), "l'argument du bulletin n° 2 ne suit pas l'emploi en main");
    break;
  }
  void C;
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log(`bulletin n° 2 : ${n} condamnations demandées · exclusions ${exclus} · rejets ${rejets} (dont article 706-47 : ${interdits}) · sans demande ${sans}`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
