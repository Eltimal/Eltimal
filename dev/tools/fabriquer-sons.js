// Fabrique les sons du jeu à partir d'enregistrements CC0 (voir dev/tools/sons-catalogue.json).
// Sortie : js/sons/<nom>.js, chacun définit CR.SONS_DATA[nom] = [base64 Opus…] (une ou plusieurs variantes),
// chargé à la demande par js/son.js ; js/sons/CREDITS.md. Les sources téléchargées restent dans dev/tools/sons-src/ (non commité).
// Nappes : compression douce (plus de camion qui surgit), normalisation à -23 LUFS, Opus stéréo 40 kb/s.
// Ponctuels : découpés aux silences, chaque coup normalisé, Opus mono 48 kb/s (UI : 32 kb/s).
// Prérequis : ffmpeg. Lancer depuis la racine : node dev/tools/fabriquer-sons.js [nom…]
const fs = require("fs"), path = require("path"), { execFileSync, spawnSync } = require("child_process");
const racine = path.join(__dirname, "..", "..");
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, "sons-catalogue.json"), "utf8"));
const SRC = path.join(__dirname, "sons-src"), OUT = path.join(racine, "js", "sons"), TMP = path.join(SRC, "tmp");
fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-nostats", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });
const ffErr = (args) => String(spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8" }).stderr || ""); // ffmpeg écrit ses mesures sur la sortie d'erreur

function source(ref) {
  const [banque, id, debut, duree] = ref.split(":");
  let f;
  if (banque === "bsb") {
    f = path.join(SRC, "bsb-" + id + ".mp3");
    if (!fs.existsSync(f) || fs.statSync(f).size < 10000) execFileSync("curl", ["-sSL", "--max-time", "120", "-A", "Mozilla/5.0", "-o", f, `https://bigsoundbank.com/UPLOAD/mp3/${id}.mp3`]);
    if (fs.statSync(f).size < 10000) throw new Error("source introuvable : " + ref);
  } else if (banque === "kenney") {
    f = path.join(SRC, "kenney", id + ".wav");
    if (!fs.existsSync(f)) throw new Error("source Kenney absente : " + f + " (cloner github.com/Calinou/kenney-interface-sounds dans dev/tools/sons-src/kenney-depot, puis copier addons/kenney_interface_sounds/*.wav dans dev/tools/sons-src/kenney/)");
  } else throw new Error("banque inconnue : " + ref);
  return { f, debut: debut ? Number(debut) : null, duree: duree ? Number(duree) : null };
}
const coupe = (s) => (s.debut != null ? ["-ss", String(s.debut)] : []).concat(s.duree != null ? ["-t", String(s.duree)] : []);
const b64 = (f) => fs.readFileSync(f).toString("base64");

function nappe(nom, d) {
  const variantes = d.src.map((ref, i) => {
    const s = source(ref), o = path.join(TMP, `${nom}-${i}.opus`);
    const af = "highpass=f=35,acompressor=threshold=-28dB:ratio=3:attack=40:release=600:makeup=1,loudnorm=I=-23:TP=-3:LRA=7,afade=t=in:d=0.05";
    ff([...coupe(s), "-i", s.f, "-af", af, "-ac", d.mono ? "1" : "2", "-ar", "48000", "-c:a", "libopus", "-b:a", d.mono ? "32k" : "40k", "-vbr", "on", o]);
    return b64(o);
  });
  return variantes;
}

function ponctuel(nom, d) {
  const out = [];
  for (const ref of d.src) {
    const s = source(ref), base = path.join(TMP, nom + "-src.wav");
    ff([...coupe(s), "-i", s.f, "-ac", d.stereo ? "2" : "1", "-ar", "48000", base]);
    let morceaux = [];
    if (d.entier) morceaux = [[0, null]];
    else {
      // repère les coups : silences de plus de 0,18 s sous -38 dB
      const log = ffErr(["-i", base, "-af", "silencedetect=noise=-38dB:d=0.18", "-f", "null", "-"]);
      const debuts = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
      const fins = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
      let t0 = 0;
      const coups = [];
      for (const fin of fins) { if (fin - t0 > 0.06) coups.push([Math.max(0, t0 - 0.02), fin - t0 + 0.06]); const suite = debuts.find((x) => x > fin); if (suite == null) { t0 = null; break; } t0 = suite; }
      if (t0 != null) coups.push([Math.max(0, t0 - 0.02), null]);
      morceaux = coups.filter(([, l]) => l == null || (l > 0.08 && l < 6));
    }
    for (const [a, l] of morceaux) {
      if (out.length >= (d.max || 99)) break;
      const o = path.join(TMP, `${nom}-${out.length}.opus`);
      const af = (nom.startsWith("ui_") ? "" : "highpass=f=60,") + "loudnorm=I=-18:TP=-2,afade=t=in:d=0.004,areverse,afade=t=in:d=0.03,areverse";
      ff(["-ss", String(a), ...(l != null ? ["-t", String(l)] : []), "-i", base, "-af", af, "-ac", d.stereo ? "2" : "1", "-ar", "48000", "-c:a", "libopus", "-b:a", nom.startsWith("ui_") ? "32k" : d.stereo ? "64k" : "48k", o]);
      if (fs.statSync(o).size > 120) out.push(b64(o));
    }
  }
  if (!out.length) throw new Error("aucun coup trouvé pour " + nom);
  return out;
}

const voulus = process.argv.slice(2);
const credits = [];
let total = 0;
for (const [genre, liste] of [["nappe", cat.nappes], ["ponctuel", cat.ponctuels]]) {
  for (const [nom, d] of Object.entries(liste)) {
    credits.push(`| ${nom} | ${d.titre || "Kenney Interface Sounds"} | ${d.src.join(", ")} |`);
    if (voulus.length && !voulus.includes(nom)) continue;
    const v = genre === "nappe" ? nappe(nom, d) : ponctuel(nom, d);
    const js = `(window.CR.SONS_DATA = window.CR.SONS_DATA || {})[${JSON.stringify(nom)}] = ${JSON.stringify(v)};\n`;
    fs.writeFileSync(path.join(OUT, nom + ".js"), js);
    total += js.length;
    console.log(`${genre.padEnd(8)} ${nom.padEnd(14)} ${String(v.length).padStart(2)} variante(s) ${(js.length / 1024).toFixed(0).padStart(6)} Ko`);
  }
}
fs.writeFileSync(path.join(OUT, "CREDITS.md"), `# Sons du jeu\n\nTous sous licence CC0 (domaine public). Merci à Joseph Sardin, [BigSoundBank.com](https://bigsoundbank.com), et à [Kenney](https://www.kenney.nl).\n\n| Nom | Enregistrement | Source (banque:numéro[:début:durée]) |\n|---|---|---|\n${credits.join("\n")}\n`);
console.log("total écrit : " + (total / 1048576).toFixed(1) + " Mo");
