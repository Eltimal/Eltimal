// Sortie 1.0 — viabilité de l'économie et carrières longues, par l'automate « joueur moyen » (tools/carriere-auto.js : ses
// hypothèses y sont écrites). Critères de la checklist : un joueur moyen est solvable à 12 mois dans au moins 70 % des
// graines ; aucun revenu sans activité (le cabinet passif fait faillite) ; une carrière de cinq ans se sérialise en moins de
// 100 ms, se recharge, et sa sauvegarde reste d'une taille que le rangement de l'appareil accepte (tnavigateur : 9 Mo écrits).
const { boot, sleep } = require("./harness");
const A = require("../tools/carriere-auto.js");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d !== undefined ? " — " + String(typeof d === "string" ? d : JSON.stringify(d)).slice(0, 400) : "")); } };
  const { CR, errors } = boot(); await sleep(150); A.installer(CR);
  const N = +(process.argv[2] || 20);
  const serie = (profil, mois) => { const out = []; for (let seed = 1; seed <= N; seed++) { const x = A.carriere(CR, seed, mois, profil); delete x.s; out.push(x); } return out; };
  const med = (l, k) => l.map((x) => x[k]).sort((a, b) => a - b)[Math.floor(l.length / 2)];
  const moyen = serie("moyen", 12), solv = moyen.filter((x) => x.fin === "en activité" && x.tresorerie >= 0).length;
  ok(solv >= N * 0.7, "moins de 70 % des joueurs moyens sont solvables à 12 mois", { solv, N });
  ok(med(moyen, "epuisements") <= 2, "le joueur moyen s'épuise plus de deux fois par an (médiane)", med(moyen, "epuisements"));
  ok(moyen.every((x) => !/Radiation|Interdiction/.test(x.discipline)), "un joueur moyen diligent est radié ou interdit", moyen.map((x) => x.discipline).filter((x) => /Radiation|Interdiction/.test(x)));
  ok(med(moyen, "missionsParMois") <= CR.DUTY_MAX_MOIS * 2 + 2, "plus de missions de permanence que le plafond d'inscriptions ne le permet", med(moyen, "missionsParMois"));
  const passif = serie("passif", 12);
  ok(passif.every((x) => /^faillite/.test(x.fin)), "un cabinet sans aucune activité ne fait pas faillite dans l'année", passif.filter((x) => !/^faillite/.test(x.fin)).map((x) => x.seed));
  const collab = serie("collab", 12);
  ok(collab.filter((x) => x.fin === "en activité" && x.tresorerie >= 0).length >= N * 0.7, "le collaborateur moyen n'est pas solvable à 12 mois");
  ok(med(collab, "tresorerie") < med(moyen, "tresorerie") * 1.35, "la collaboration rapporte nettement plus que l'installation, pour moins de travail", [med(collab, "tresorerie"), med(moyen, "tresorerie")]);
  // carrière de cinq ans
  const t0 = Date.now(); const long = A.carriere(CR, 3, 60, "moyen"); const s = long.s;
  ok(long.fin === "en activité" && long.jour >= 1820, "la carrière de cinq ans ne va pas au bout", long.fin);
  // la meilleure de trois mesures : la batterie tourne sur tous les cœurs, une mesure isolée dépend de la charge
  let t = Date.now(); const json = CR.serialize(s); let ser = Date.now() - t;
  for (let k = 0; k < 2; k++) { t = Date.now(); CR.serialize(s); ser = Math.min(ser, Date.now() - t); }
  ok(ser < 100, "sérialiser cinq ans de carrière prend plus de 100 ms", ser);
  ok(json.length < 30 * 1024 * 1024, "la sauvegarde de cinq ans dépasse 30 Mo", Math.round(json.length / 1048576));
  t = Date.now(); let relu = null; try { relu = CR.deserialize(json); } catch (e) { ok(false, "la carrière de cinq ans ne se recharge pas", e.message); }
  const lire = Date.now() - t;
  ok(lire < 8000, "recharger cinq ans de carrière prend plus de 8 s", lire);
  if (relu) { for (let i = 0; i < 30; i++) CR.endDay(relu); ok(relu.day === s.day + 30 && isFinite(relu.cash), "la carrière rechargée n'avance plus"); }
  for (const k of ["cash", "energy", "carpa"]) ok(isFinite(s[k]), "valeur non finie après cinq ans : " + k, s[k]);
  ok(s.carpa === 0 && Object.values(s.carpaBy).every((x) => Math.abs(x) < 1), "des fonds restent à la CARPA sans dossier vivant", s.carpa);
  ok(s.inbox.length <= 250 && s.log.length <= 400 && s.ledger.length <= 300 && s.voicemails.length <= 60, "une liste bornée a débordé");
  console.log(`viabilité — moyen : ${solv}/${N} solvables à 12 mois, trésorerie médiane ${med(moyen, "tresorerie")} €, ${med(moyen, "missionsParMois")} missions et ${med(moyen, "payantsParMois")} clients payants par mois · collaborateur : ${med(collab, "tresorerie")} € · passif : faillite au jour ${med(passif, "jour")} · cinq ans : ${long.dossiers} dossiers, ${Math.round(json.length / 1048576 * 10) / 10} Mo, sérialisation ${ser} ms, rechargement ${lire} ms, trésorerie ${long.tresorerie} € (simulé en ${Math.round((Date.now() - t0) / 1000)} s)`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 3).join(" | ").slice(0, 600)); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
