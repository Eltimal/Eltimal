// Socle 1.0 : réglages de l'appareil (taille du texte, son), version affichée, ambiance qui suit le lieu et la scène,
// jeu sans aucune adresse internet. Dans jsdom il n'y a pas de Web Audio : on vérifie les appels (CR.SON.log, CR.SON.voulu).
const fs = require("fs"), path = require("path");
const { boot, sleep, texts, findBtn, click } = require("./harness");
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
(async () => {
  const ROOT = path.resolve(__dirname, "..", "..");
  const page = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  ok(!/https?:\/\/(?!www\.w3\.org)/.test(page.replace(/claude\.ai\/artifact\/[A-Za-z0-9]+/g, "")), "la page ne cite plus aucune adresse internet");
  for (const m of page.matchAll(/(?:src="|url\()((?:lib|fonts|js)\/[^")]+)/g)) ok(fs.existsSync(path.join(ROOT, m[1])), "fichier embarqué présent : " + m[1]);
  const { w, CR, doc, errors } = boot();
  await sleep(300);
  ok(CR.JEU && CR.JEU.version === "1.0", "version 1.0");
  ok(/Version 1\.0/.test(texts(doc.body)), "version affichée à l'écran titre");
  ok(CR.SON.voulu && CR.SON.voulu.nom === "titre", "ambiance de l'écran titre");
  // réglages depuis l'écran titre
  await click(w, findBtn(doc, /^Réglages$/));
  const grand = [...doc.querySelectorAll(".rg-t")].find((b) => /Très grand/.test(texts(b)));
  await click(w, grand);
  ok(doc.documentElement.style.getPropertyValue("--tz") === "1.25", "taille du texte appliquée");
  ok(JSON.parse(w.localStorage.getItem("la-permanence-reglages-v1")).taille === 1.25, "réglage gardé sur l'appareil");
  await click(w, [...doc.querySelectorAll(".rg-t")].find((b) => /Normal/.test(texts(b))));
  const son = doc.querySelector("#rg-son"); await click(w, son);
  ok(CR.prefs.son === false, "son coupé"); await click(w, doc.querySelector("#rg-son")); ok(CR.prefs.son === true, "son remis");
  await click(w, findBtn(doc, /^Retour$/));
  await click(w, findBtn(doc, "Nouvelle partie")); await click(w, findBtn(doc, /^Carrière/)); await sleep(200);
  const s = CR.store.s;
  ok(CR.SON.voulu.nom === "cabinet", "ambiance du cabinet : " + CR.SON.voulu.nom);
  const amb = (at, min) => { s.at = at; if (min != null) s.min = min; CR.SON.sync(s, null); return CR.SON.voulu.cle; };
  ok(/^palais/.test(amb("palais", 600)), "ambiance du palais"); ok(/^commissariat/.test(amb("commissariat")), "ambiance du commissariat");
  ok(/^prison/.test(amb("sante")), "ambiance de la prison"); ok(/^rue/.test(amb("umj")), "ambiance de la rue");
  ok(/^cabinet:n/.test(amb("cabinet", 23 * 60)), "le cabinet la nuit"); amb("cabinet", 600);
  CR.SON.log.length = 0; CR.SON.sync(s, { type: "court", caseId: "x", hid: "h" });
  ok(CR.SON.voulu.nom === "salle" && CR.SON.log.includes("cloche"), "audience : la salle et la sonnette");
  CR.SON.sync(s, { type: "gav", caseId: "x" }); ok(CR.SON.voulu.nom === "commissariat" && CR.SON.log.includes("porte"), "garde à vue : commissariat et porte");
  CR.SON.sync(s, { type: "call", caseId: "x" }); CR.SON.sync(s, null); ok(CR.SON.log.includes("decroche") && CR.SON.log.includes("raccroche"), "téléphone décroché, raccroché");
  CR.SON.log.length = 0; CR.SON.pret = true; CR.mail(s, { from: "Test", subj: "Test", body: "Test", kind: "courriel" }); ok(CR.SON.log.includes("mail"), "un courriel s'entend");
  CR.toast(s, "erreur", "bad"); ok(CR.SON.log.includes("erreur"), "une erreur s'entend");
  await click(w, [...doc.querySelectorAll(".rail-btn")].find((x) => /Dossiers/.test(texts(x)))); ok(CR.SON.log.includes("onglet"), "navigation sonore");
  console.log("ambiances vérifiées, sons joués :", [...new Set(CR.SON.log)].join(", "));
  console.log("échecs:", fails); console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
