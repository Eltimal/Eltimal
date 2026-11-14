// Batterie de tests en parallèle, chronométrée.
//   node tools/batterie.js            → batterie rapide (le cœur du jeu et les tests des lots, sans les longs)
//   node tools/batterie.js complete   → tout, y compris les tests longs (tgen, tsim, trepetition, tboucle)
//   node tools/batterie.js t1 tsim …  → ces tests seulement
// Les tests tournent sur tous les cœurs (variable JOBS pour en choisir le nombre) ; à la fin : échecs, puis durées.
const { spawn } = require("child_process");
const os = require("os");
const path = require("path");
const RAPIDE = ["t1", "t20", "tgenjeu", "tparole", "ttribunal", "tplaidoirie", "tappel", "tcanaux", "tebarreau", "tplex", "tlibre", "tclauses", "tpeines", "tcomp", "tdossier", "tbill", "tcarriere", "tcoherence",
  "tmagasin", "ttransport", "ttire", "t2roues", "tdeal", "tdetention", "toutrage", "trebellion", "tconjugal", "tappels", "tcambriolage", "tobtemperer", "tfuite", "trecel", "tlabo", "timages", "ttelephonie", "tcaptures", "treleve", "tadn", "tpermis", "texpertise", "tdegradations", "tviolation", "tabus", "tvestiaire", "tharcelement", "tcatalogue", "tcrimes", "tpeinescrime", "tmemoirechins", "tcrimdossier", "tconfront", "tinterro", "tethylo", "tautopsie", "turgences", "tidempotence", "tjap", "tvictimes", "tb2", "tic", "tbiblio", "tlivre", "tintegral", "tarrets", "tjld", "tchins", "tirresp", "tvideomag", "tdebats", "tincidents"];
const LONGS = ["tgen", "tsim", "trepetition", "tecono", "tcite", "tplaid", "tassises", "t15", "t16", "tp3", "tcassation", "tmemoire", ["tboucle", "7"], ["tboucle", "9"], ["tboucle", "5"]];
const arg = process.argv.slice(2);
const liste = arg[0] === "complete" ? LONGS.concat(RAPIDE) : arg.length ? arg.map((a) => (a.includes(":") ? a.split(":") : a)) : RAPIDE;
const jobs = +(process.env.JOBS || Math.max(2, os.cpus().length));
const dir = path.join(__dirname, "..");
const res = [];
let i = 0, actifs = 0;
const t0 = Date.now();
function lancer() {
  while (actifs < jobs && i < liste.length) {
    const it = liste[i++], [nom, ...a] = [].concat(it), d = Date.now();
    actifs++;
    const p = spawn(process.execPath, [path.join("tests", nom + ".js"), ...a], { cwd: dir });
    let out = "";
    p.stdout.on("data", (x) => (out += x)); p.stderr.on("data", (x) => (out += x));
    const tm = setTimeout(() => p.kill("SIGKILL"), 30 * 60 * 1000);
    p.on("close", (code) => {
      clearTimeout(tm); actifs--;
      const ech = [...out.matchAll(/échecs:\s*(\d+)/g)].map((m) => +m[1]).pop();
      const err = /errors: (?!none)/.test(out) || /FATAL|Error:/.test(out) && code !== 0;
      const ok = code === 0 && !ech && !err && (/échecs:\s*0|errors: none|bad 0/.test(out));
      res.push({ nom: [nom, ...a].join(" "), ok, s: (Date.now() - d) / 1000, detail: ok ? "" : out.split("\n").filter((l) => /✗|ÉCHEC|FAIL|Error|échecs/.test(l)).slice(0, 6).join("\n    ") });
      process.stdout.write(ok ? "." : "✗");
      if (i >= liste.length && actifs === 0) fin(); else lancer();
    });
  }
}
function fin() {
  const ko = res.filter((r) => !r.ok);
  console.log(`\n${res.length} tests en ${Math.round((Date.now() - t0) / 1000)} s sur ${jobs} cœurs — ${ko.length ? ko.length + " en échec" : "tous verts"}`);
  for (const r of ko) console.log(`  ✗ ${r.nom}\n    ${r.detail}`);
  console.log("plus longs : " + res.slice().sort((a, b) => b.s - a.s).slice(0, 8).map((r) => `${r.nom} ${Math.round(r.s)} s`).join(", "));
  process.exit(ko.length ? 1 : 0);
}
lancer();
