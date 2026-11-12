// Vérifie le son dans l'app : chaque lieu joue ses enregistrements (chargés depuis sons/), à un niveau raisonnable,
// sans saturation ; chaque bruit bref produit du signal. Lancer : npm run test:son (Linux sans écran : xvfb-run -a npm run test:son)
const { _electron: electron } = require("playwright");
const fs = require("fs"), os = require("os"), path = require("path");
const racine = path.join(__dirname, "..");
const res = []; const note = (nom, ok, detail) => { res.push(ok); console.log((ok ? "ok    " : "ÉCHEC ") + nom + (detail ? " — " + detail : "")); };

(async () => {
  const donnees = fs.mkdtempSync(path.join(os.tmpdir(), "lp-son-"));
  const opts = { executablePath: require("electron"), args: [racine], env: Object.assign({}, process.env, { LP_USER_DATA: donnees, LP_MAJ_OFF: "1" }) };
  if (process.platform === "linux") opts.args.push("--no-sandbox");
  const app = await electron.launch(opts); const page = await app.firstWindow(); const errs = [];
  page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.waitForFunction(() => window.CR && window.CR.SON && document.querySelector("#app").children.length > 0, null, { timeout: 30000 });
  await page.mouse.click(5, 5);
  await page.waitForTimeout(800);
  // coupe la musique pour mesurer l'ambiance seule
  await page.evaluate(() => { window.CR.prefsSet && window.CR.prefsSet("musique", false); window.CR.SON.regler(); });
  const mesurer = (ms) => page.evaluate(async (ms) => {
    const S = window.CR.SON, c = S.ctx;
    if (!S.an) { S.an = c.createAnalyser(); S.an.fftSize = 4096; S.master.connect(S.an); }
    const buf = new Float32Array(S.an.fftSize); let somme = 0, n = 0, crete = 0; const t0 = performance.now();
    while (performance.now() - t0 < ms) { S.an.getFloatTimeDomainData(buf); for (const x of buf) { somme += x * x; n++; crete = Math.max(crete, Math.abs(x)); } await new Promise((r) => setTimeout(r, 40)); }
    const db = (x) => (x > 0 ? 20 * Math.log10(x) : -120);
    return { rms: +db(Math.sqrt(somme / n)).toFixed(1), crete: +db(crete).toFixed(1) };
  }, ms);
  const lieux = [["titre", {}], ["cabinet", {}], ["cabinet", { nuit: true }], ["cabinet", { pluie: true }], ["domicile", {}], ["domicile", { nuit: true, pluie: true }], ["rue", {}], ["rue", { nuit: true }], ["rue", { pluie: true }], ["palais", {}], ["salle", {}], ["huis", {}], ["commissariat", {}], ["prison", {}]];
  for (const [nom, o] of lieux) {
    await page.evaluate(([nom, o]) => { window.CR.SON.ambNom = null; window.CR.SON.ambiance(nom, o); }, [nom, o]);
    await page.waitForTimeout(3500);
    const m = await mesurer(3000);
    const etiquette = nom + (o.nuit ? " (nuit)" : "") + (o.pluie ? " (pluie)" : "");
    note("ambiance " + etiquette, m.rms > -62 && m.rms < -18 && m.crete < -0.5, "RMS " + m.rms + " dBFS, crête " + m.crete + " dBFS");
  }
  await page.evaluate(() => { window.CR.SON.ambiance(null); });
  await page.waitForTimeout(2200);
  const silence = await mesurer(800);
  note("silence entre deux lieux", silence.rms < -70, "RMS " + silence.rms);
  for (const nom of ["clic", "onglet", "page", "note", "mail", "erreur", "bien", "dring", "chaises", "porte", "cles", "clavier", "metro", "taxi", "cloche", "verdict_bon"]) {
    await page.evaluate((nom) => { window.CR.SON.jouer(nom); }, nom);
    const m = await mesurer(nom === "metro" || nom === "taxi" ? 1500 : 700);
    note("bruit " + nom, m.crete > -45 && m.crete < -0.5, "crête " + m.crete + " dBFS");
    await page.waitForTimeout(nom === "metro" || nom === "taxi" ? 5000 : 300);
  }
  note("aucune erreur dans la page", errs.length === 0, errs.slice(0, 3).join(" | "));
  await app.close();
  console.log("échecs: " + res.filter((x) => !x).length);
  process.exit(res.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
