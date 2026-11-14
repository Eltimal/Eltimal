// Texte intégral des codes (lot 9) : convertit les codes publiés par codes.droit.org (fichiers XML générés depuis
// Légifrance, base LEGI, Licence Ouverte) en fichiers de données du jeu, js/codes/<code>.js.
//   node tools/codes.js <dossier des XML>
// Les XML se téléchargent ainsi (une fois, hors dépôt) :
//   curl -o <dossier>/cp.xml   "https://codes.droit.org/payloads/Code%20p%C3%A9nal.xml"
//   curl -o <dossier>/cpp.xml  "https://codes.droit.org/payloads/Code%20de%20proc%C3%A9dure%20p%C3%A9nale.xml"
//   curl -o <dossier>/route.xml "https://codes.droit.org/payloads/Code%20de%20la%20route.xml"
//   curl -o <dossier>/cjpm.xml "https://codes.droit.org/payloads/Code%20de%20la%20justice%20p%C3%A9nale%20des%20mineurs.xml"
// Seuls les articles et les divisions en vigueur sont gardés : le texte alinéa par alinéa, et le plan officiel (livres,
// titres, chapitres, sections) avec les articles de chaque division dans l'ordre du code.
const fs = require("fs"), path = require("path");
const dir = process.argv[2];
if (!dir) { console.error("usage : node tools/codes.js <dossier des XML>"); process.exit(1); }
const OUT = path.join(__dirname, "..", "..", "js", "codes");
fs.mkdirSync(OUT, { recursive: true });
const CODES = [["CP", "cp.xml", "penal.xml"], ["CPP", "cpp.xml"], ["CR", "route.xml"], ["CJPM", "cjpm.xml"]];
const ENT = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&#39;": "'", "&nbsp;": " " };
const net = (x) => x.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/&(?:amp|lt|gt|quot|apos|#39|nbsp);/g, (m) => ENT[m]).replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/[ \t\r\n]+/g, " ").trim();
const bilan = [];
for (const [id, ...noms] of CODES) {
  const f = noms.map((n) => path.join(dir, n)).find((p) => fs.existsSync(p));
  if (!f) { console.warn(`${id} : fichier absent (${noms.join(" ou ")})`); continue; }
  const xml = fs.readFileSync(f, "utf8");
  const tete = /<code nom="([^"]+)" id="([^"]+)" lastup="([^"]+)"/.exec(xml);
  const arts = {};
  let n = 0, octets = 0;
  // Plan officiel : les divisions en vigueur (<t niveau title etat>), avec leurs articles dans l'ordre du code.
  // Nœud : { t: intitulé, c: [sous-divisions], a: [numéros] } ; le premier niveau donne les parties du code.
  const racine = { t: "", c: [], a: [], ok: true };
  const pile = [racine];
  for (const m of xml.matchAll(/<t\s([^>]*)>|<\/t>|<article ([^>]*)>([\s\S]*?)<\/article>/g)) {
    const haut = pile[pile.length - 1];
    if (m[0] === "</t>") { pile.pop(); continue; }
    if (m[1] != null) {
      const at = (k) => { const x = new RegExp(k + '="([^"]*)"').exec(m[1]); return x ? x[1] : ""; };
      const nd = { t: net(at("title").replace(/&#1[03];/g, " ")).replace(/\s*\.$/, ""), c: [], a: [], ok: haut.ok && at("etat") === "VIGUEUR" };
      haut.c.push(nd); pile.push(nd);
      continue;
    }
    if (!/etat="VIGUEUR"/.test(m[2])) continue;
    const num = (/num="([^"]+)"/.exec(m[2]) || [])[1];
    if (!num) continue;
    const k = num.trim();
    const alineas = [...m[3].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((p) => net(p[1])).filter(Boolean);
    if (!alineas.length) { const t = net(m[3]); if (t) alineas.push(t); }
    if (!alineas.length || arts[k] || !haut.ok) continue;
    arts[k] = alineas; n++; octets += alineas.join(" ").length;
    haut.a.push(k);
  }
  // On ne garde que les divisions en vigueur qui portent au moins un article
  const elaguer = (nd) => { nd.c = nd.c.filter((x) => x.ok).map(elaguer).filter((x) => x.a.length || x.c.length); return nd; };
  const tri = (nd) => { const o = { t: nd.t }; if (nd.a.length) o.a = nd.a; if (nd.c.length) o.c = nd.c.map(tri); return o; };
  const plan = elaguer(racine).c.map(tri);
  const data = { nom: tete ? tete[1] : id, legi: tete ? tete[2] : null, maj: tete ? tete[3] : null, source: "codes.droit.org, généré depuis Légifrance (base LEGI, Licence Ouverte)", plan, arts };
  const js = `// ${data.nom} — texte intégral des articles en vigueur, version du ${data.maj} (${data.source}).\n// Fichier généré par dev/tools/codes.js : ne pas modifier à la main.\n(window.CR = window.CR || {}).INTEGRAL = window.CR.INTEGRAL || {};\nwindow.CR.INTEGRAL[${JSON.stringify(id)}] = ${JSON.stringify(data)};\n`;
  fs.writeFileSync(path.join(OUT, id.toLowerCase() + ".js"), js);
  bilan.push(`${id} : ${n} articles, ${Math.round(octets / 1024)} Ko de texte, version du ${data.maj}`);
}
console.log(bilan.join("\n"));
