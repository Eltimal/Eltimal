// Refonte : les décisions criminelles au format réel. node tests/tarrets.js   « échecs: 0 » attendu.
// Arrêt de cour d'assises (premier ressort, appel), cour d'assises spécialement composée, cour criminelle départementale,
// cour d'assises des mineurs, jugement du tribunal pour enfants : composition, réponses aux questions et majorités,
// feuille de motivation, action civile sans le jury, voies de recours (règles relues sur le texte intégral).
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 30) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 400) : "")); } };
  const { CR, errors } = boot();
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 17 }); CR.store.s = s; s.settings.saisie = "liste";
  const vus = {};
  const texte = (D) => D.paras.map((p) => p.map((x) => (typeof x === "string" ? x : x.t)).join("")).join("\n");
  for (let i = 0; i < 2500; i++) {
    let cs; try { cs = CR.GEN.open(s, "info", {}); } catch (e) { continue; }
    const t = CR.GEN.paramsOf(s, cs.id).t;
    const appel = i % 3 === 0 && t.jur !== "tpe";
    const cle = t.jur + (appel ? ":appel" : "");
    if ((vus[cle] || 0) >= 6) continue;
    cs.vars.jurProces = t.jur; cs.vars.reglement = { qual: "q" }; if (appel) cs.vars.enAppel = true;
    let d; try { d = CR.runHook(s, cs, "decider", { st: { played: new Set(), dernierMot: "regrets" } }); } catch (e) { ok(false, `${cs.id} : ${e.message}`); continue; }
    if (!d || !cs.vars.jugementEcrit) continue;
    vus[cle] = (vus[cle] || 0) + 1;
    const D = CR.SHARED_DOCS._jugement({ s, cs });
    const T = texte(D), J = cs.vars.jugementEcrit;
    const id = `${cs.id} (${cle})`;
    if (t.jur === "tpe") {
      ok(/juge des enfants, présidente?, et de deux assesseurs/.test(T) && /L\. 513-2/.test(T) && /chambre spéciale des mineurs/.test(T), `${id} : jugement du tribunal pour enfants sans sa composition, sa publicité ou son appel`, T.slice(0, 500));
      continue;
    }
    if (t.jur === "tc") continue; // délit renvoyé au tribunal correctionnel : jugement ordinaire (ttribunal)
    ok(/^À l'audience publique/.test(T) && /statuant (en premier ressort|en appel)/.test(T) && /avocat général/.test(T), `${id} : en-tête d'arrêt`, T.slice(0, 300));
    ok(/accusé/.test(T) && !/prévenu/.test(T), `${id} : l'accusé appelé prévenu`, T.match(/.{40}prévenu.{40}/));
    ok(/RÉPONSES AUX QUESTIONS/.test(T) && /Question n° 1 : l'accusé/.test(T), `${id} : pas de réponses aux questions`);
    ok(/FEUILLE DE MOTIVATION \(art\. 365-1\)/.test(T), `${id} : pas de feuille de motivation`);
    ok(/art\. 366/.test(T), `${id} : lecture des textes de loi absente`);
    const spe = t.jur === "assises_spe", ccd = t.jur === "ccd" && !appel;
    if (spe) ok(/sans jury/.test(T) && new RegExp(`${appel ? "six" : "quatre"} assesseurs \\(art\\. 698-6\\)`).test(T), `${id} : composition de la cour spécialement composée`);
    else if (ccd) ok(/quatre assesseurs \(art\. 380-17\)/.test(T) && /sans jury/.test(T), `${id} : composition de la cour criminelle départementale`);
    else ok(new RegExp(`jury de jugement de ${appel ? "neuf" : "six"} jurés`).test(T) && /premier juré/.test(T), `${id} : jury absent ou mal compté`, T.slice(0, 400));
    if (J.coupable) {
      ok(spe || ccd ? /Oui, à la majorité\./.test(T) : new RegExp(`Oui, à la majorité de ${appel ? "huit" : "sept"} voix au moins`).test(T), `${id} : majorité de la culpabilité (art. 359)`);
      ok(/art\. 362/.test(T), `${id} : vote sur la peine absent`);
      ok(appel ? /art\. 568/.test(T) : /art\. 380-9/.test(T) && (ccd ? /380-21/.test(T) : /380-14/.test(T)), `${id} : voies de recours`, T.slice(-500));
    } else if (J.irresp) {
      ok(/Question n° 2 : .+ cause d'irresponsabilité pénale/.test(T) && /706-129/.test(T) && /706-132/.test(T), `${id} : irresponsabilité sans ses deux questions (art. 349-1)`);
    } else {
      ok(/— Non\./.test(T), `${id} : acquittement sans réponse négative`);
      ok(appel ? /art\. 568/.test(T) : /procureur général/.test(T), `${id} : voies de recours après acquittement`);
    }
    if ((J.dec.questions || []).some((q) => /civile/.test(q.q))) ok(/sans l'assistance du jury \(art\. 371\)/.test(T), `${id} : action civile non séparée`);
    const nAgg = ((J.qualif && J.qualif.aggs) || []).filter((a) => CR.CAT.AGG[a]).length;
    ok((T.match(/Question n° \d+ :/g) || []).length === (J.irresp ? 2 : 1 + nAgg), `${id} : une question par circonstance aggravante (art. 349)`, `${nAgg} circonstances ; ${(T.match(/Question n° [^\n]+/g) || []).join(" | ")}`);
    if (J.coupable && J.dec.peine && /^(\d|réclusion)/i.test(J.dec.peine.texte || "")) ok(/le condamne à/.test(T), `${id} : dispositif sans « le condamne à »`, J.dec.dispositif);
    if (/Aucune constitution/.test(T)) ok(!/, partie civile\./.test(T.split("\n")[1]), `${id} : victime non constituée nommée partie civile`);
    ok(!/\bart\. [\d-]+(?: et [\d-]+)* CP\b/.test(T), `${id} : visa abrégé « art. … CP »`, (T.match(/.{30}art\. [\d-]+.{20}/) || [])[0]);
    if (t.jur === "assises_mineurs") ok(/L\. 513-2/.test(T) && /juges des enfants/.test(T), `${id} : cour d'assises des mineurs sans ses règles`);
  }
  for (const k of ["assises", "assises:appel", "ccd", "ccd:appel", "tpe"]) ok((vus[k] || 0) >= 2, `trop peu d'arrêts : ${k}`, JSON.stringify(vus));
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("décisions rendues :", JSON.stringify(vus));
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
