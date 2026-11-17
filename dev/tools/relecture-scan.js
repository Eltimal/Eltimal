// Relecture automatique : compte, sur des affaires générées, les incohérences relevées à la lecture.
// node tools/relecture-scan.js [affaires par genre, défaut 60] [graine]
const { boot, sleep } = require("../tests/harness");
const D = require("../tests/dial");
(async () => {
  const { CR } = boot(); await sleep(150);
  const N = +(process.argv[2] || 60), seed = +(process.argv[3] || 31);
  const flat = (x, out, d = 0) => { if (d > 8 || x == null) return out; if (typeof x === "string") { if (x.trim()) out.push(x.trim()); } else if (Array.isArray(x)) x.forEach((y) => flat(y, out, d + 1)); else if (typeof x === "object") for (const k of Object.keys(x)) flat(x[k], out, d + 1); return out; };
  const C = {}, EX = {}, TOT = {};
  const hit = (k, id, ex) => { C[k] = (C[k] || 0) + 1; (EX[k] = EX[k] || []).length < 2 && EX[k].push(id + " : " + String(ex).replace(/\s+/g, " ").slice(0, 170)); };
  const base = (k) => { TOT[k] = (TOT[k] || 0) + 1; };
  const INDEP = /auto-entrepreneu|commerçant|consultant|gérant|chef d'entreprise|artisan|à mon compte|coiffeu|taxi|VTC|agricult|médecin|avocat|notaire|retraité|étudiant|sans emploi/i;
  for (const g of ["gav", "ci", "al", "op", "copj", "pc", "info"]) {
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed }));
    for (let i = 0; i < N; i++) {
      s.day = 20 + i; s.min = 600;
      let cs, p, def, d, api, v; try { cs = CR.GEN.open(s, g, { min: s.min, night: false }); p = s.generated.find((x) => x.id === cs.id); def = CR.caseDef(cs); d = D.collect(CR, s, cs, p); api = CR.api(s, cs); v = CR.caseVars(s, cs); } catch (e) { hit("00 tirage en erreur", g, e.message); continue; }
      const t = p.t, id = `${g}/${t.inf}/${t.f.sc || t.f.ctx || ""}`, A = t.A || {}, V = t.V, cl = t[t.client] || A;
      const docs = {}; for (const [k, d0] of Object.entries(def.docs || {})) { try { const x = typeof d0 === "function" ? d0(api) : d0; docs[k] = flat(x, []).map((y) => CR.fmt(y, v)).join(" ¶ ").replace(/<[^>]+>/g, ""); } catch (e) { hit("00 pièce en erreur", id, k + " " + e.message); } }
      const tout = Object.values(docs).join(" ");
      base("affaires"); base(g);
      for (const c of d.calls) {
        const txt = c.lines.join(" "), rep = c.topics.map((x) => x.segs.map((y) => y.t).join(" ")).join(" ");
        if (c.error) hit("00 dialogue en erreur", id, c.key + " " + c.error);
        if (c.key === "depot") { base("dépôt"); if (/(nuit|garde à vue)/.test(c.opening.join(" ")) && /C'était ce matin/.test(rep)) hit("01 au dépôt après une nuit de garde à vue, les faits sont « ce matin »", id, rep.match(/C'était ce matin[^.]*\./)[0]); }
        if (c.key === "gav" && /contrôle d'identité|a-t-il été contrôlé|motivé le contrôle/.test(txt)) { base("question sur le contrôle"); if (!/contrôl/i.test(docs.pv_interpellation || docs.pv_saisine || "") && !["alcool", "stups_volant", "defaut_permis", "refus_obtemperer", "rebellion", "outrage", "violences_pdap", "stups_usage", "stups_detention"].includes(t.inf) && !(t.irr || []).includes("controle_identite")) hit("02 l'avocat interroge sur un contrôle d'identité que le dossier ne contient pas", id, (txt.match(/AVOCAT : [^—]*contrôl[^—]*/) || [""])[0]); }
        if (/jamais eu affaire à la justice\. Jamais|Casier vierge|jamais de ma vie/i.test(rep) && /(Une fois, il y a|Il y a un an|il y a longtemps\. Une amende|J'ai fait \w+ mois de prison|pour le même genre)/i.test(rep)) hit("03 dans le même entretien : « jamais eu affaire à la justice », puis une condamnation avouée", id, c.key);
        if ((g === "al" || g === "op") && c.key === "intake") { base("récit hors flagrance"); const m = rep.match(/(Ils m'ont arrêtée? [^.]*\.|La police est arrivée [^.]*\.|Ils m'ont emmenée? au commissariat[^.]*\.)/); if (m && g === "al") hit("04 convoqué des mois après, le client raconte une arrestation sur le fait", id, m[0]); }
        if (/si je rate des jours, je perds ma place/.test(rep)) { base("« je perds ma place »"); if (INDEP.test(cl.metier || "")) hit("05 « si je rate des jours, je perds ma place » dit par un indépendant, un retraité ou un sans-emploi", id, cl.metier); }
        if (/^Appel/.test(c.label || "") && /\((Il|Elle) fixe ses mains|\(Les yeux baissés|\(Un haussement d'épaules/.test(txt)) hit("06 geste visible (« Elle fixe ses mains ») dans un appel téléphonique", id, c.label);
        if ((c.key === "depot" || c.key === "parloir" || (c.key === "vie_confront" && (g === "ci" || t.entree === "detenu"))) && /téléphone sonner|je reprends le travail|chercher les enfants|On se rappelle/.test(c.extra.join(" "))) hit("07 client détenu qui s'impatiente : « j'ai laissé mon téléphone sonner », « on se rappelle ? »", id, c.extra.join(" | "));
        if (c.key === "gav" && /Capitaine,/.test(txt)) { base("« Capitaine »"); const arr = (c.extra || []).map((x) => typeof x === "string" ? x : (x && (x.t || x.q)) || "").join(" "); if (/(Lieutenant|Brigadier|Commandant|Major)/.test(arr) && !/Capitaine/.test(arr)) hit("08 l'avocat dit « Capitaine » à un lieutenant ou à un brigadier-chef", id, (arr.match(/(Lieutenant|Brigadier-chef|Commandant|Major) [^,]*/) || [""])[0]); }
        if (/\d+ heures? (quarante-cinq|et quart|et demie)/.test(rep)) hit("09 heure écrite à moitié en chiffres (« 15 heures quarante-cinq »)", id, rep.match(/\d+ heures? (quarante-cinq|et quart|et demie)/)[0]);
        if (/je fumais/.test(rep) && /(MDMA|cocaïne|ecstasy|héroïne)/i.test(rep)) hit("10 « je fumais avec un ami » pour de la MDMA ou de la cocaïne", id, rep.match(/\d+ g de [^.]*/) || "");
        if (/Je faisais une livraison[^.]*\. Je faisais que guetter/.test(rep)) hit("11 livreur et guetteur dans la même phrase", id, "");
        if (/Les aveux \? On m'a dit que si je reconnaissais/.test(rep) && c.key === "gav") hit("12 le client parle de ses aveux avant toute audition (premier entretien de garde à vue)", id, "");
        const enj = c.topics.filter((x) => /inquiète le plus|peur de perdre|empêche de dormir|compte le plus|fait le plus peur/.test(x.q)); if (enj.length >= 2 && !enj.some((x) => /^Et à part cela/.test(x.q))) hit("13 la même question sur ses craintes posée deux fois, deux réponses différentes", id, enj.map((x) => x.q).join(" / "));
      }
      if (cl.prenom && cl.prenom === cl.nom) hit("14 prénom identique au nom", id, cl.prenom + " " + cl.nom);
      for (const [k, x] of Object.entries(docs)) {
        if (/^pv_temoin/.test(k)) { base("auditions de témoin"); if (/qui nous déclare : ¶ QUESTIONS/.test(x)) hit("15 témoin entendu sans aucune déclaration (« juste à côté », « non »)", id, k); if (/Prénom : (Nadia|Samia|Marine|Jessica|Émilie|Pauline|Assia|Inès|Nora|Élodie|Sarah|Léa|Julie|Fatima|Aïcha)[^¶]*¶.*Je suis prêt à revenir/.test(x)) hit("16 accord : une femme « prêt à revenir »", id, k); }
        const m = x.match(/Je soussignée, Dr (Hugo|Karim|Thomas|Julien|Nicolas|Mehdi|Antoine|Pierre|Paul|Marc|Yanis|Damien|Stéphane|Cédric|Olivier)(?![a-zà-ÿ-])/); // pas « Paule », « Pauline » if (m) hit("17 accord : « Je soussignée, Dr " + "<prénom masculin> »", id, m[0]);
      }
      // l'enquête sociale rapide n'est remise qu'avec le dossier de comparution immédiate : rien à vérifier ici
      if (V && V.g === "m" && /la plaignante|de la plaignante/.test(tout)) hit("19 « la plaignante » pour une victime masculine", id, (tout.match(/[^¶]*la plaignante[^¶]*/) || [""])[0]);
      if (t.inf === "violences_conj" && A.g === "m" && V && V.g === "f" && /Je vis avec mon compagnon|chez son compagnon/.test(tout)) hit("20 un homme dit vivre « avec mon compagnon » alors que la victime est sa compagne", id, "");
      { const m = (docs.pv_notification || "").match(/Née? : (\d+)(?:er)? (\w+) (\d{4})/); if (m && A.age) { base("âges vérifiés"); const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"].indexOf(m[2]); const now = CR.ymd(s.day); const age = now.y - +m[3] - ((now.m - 1 < mois || (now.m - 1 === mois && now.d < +m[1])) ? 1 : 0); if (age !== A.age) hit("21 âge annoncé différent de l'âge calculé d'après la date de naissance", id, `${A.age} ans annoncés, né le ${m[1]} ${m[2]} ${m[3]} (${age} ans)`); } }
      if (/récidive légale/.test(tout) && /Il y a (six|sept|huit|neuf|dix) ans/.test(d.calls.map((c) => c.lines.join(" ")).join(" "))) hit("22 récidive légale retenue pour une condamnation de plus de cinq ans", id, "");
      if (/relais[^¶]*¶ (\d+) h (\d+)[^¶]*¶ (\d+) h (\d+)/.test(docs.pv_telephonie || "")) { base("téléphonie"); const hs = [...(docs.pv_telephonie.match(/¶ (\d+) h (\d+) — /g) || [])].map((y) => { const q = y.match(/(\d+) h (\d+)/); return +q[1] * 60 + +q[2]; }); if (hs.some((h, j) => j && h < hs[j - 1])) hit("23 téléphonie : activations hors de l'ordre des heures", id, ""); }
      if (/par carte/.test(docs.pv_victime || "") && /virement reçu/.test(docs.releve || "")) hit("24 la victime dit avoir payé par carte, le relevé montre des virements", id, "");
      if (docs.pv_victime && /pendant une semaine/.test(docs.pv_victime)) { const f = (docs.pv_notification || "").match(/le (\d+ \w+ \d{4}) vers/), pl = docs.pv_victime.match(/Fait et clos à [^,]*, le (\d+) (\w+) (\d{4})/); if (f && pl && Math.abs(+pl[1] - parseInt(f[1])) <= 3 && f[1].includes(pl[2])) hit("25 « je n'en ai parlé à personne pendant une semaine », plainte du lendemain", id, `faits ${f[1]}, plainte ${pl[1]} ${pl[2]}`); }
    }
  }
  console.log("BASES " + JSON.stringify(TOT));
  // défauts ponctuels corrigés en 1.0.1 : ils ne doivent plus revenir (les autres attendent les étapes 1.3 et 1.4)
  const CORRIGES = ["00", "01", "02", "05", "06", "07", "08", "09", "10", "13", "14", "15", "16", "17", "19", "20", "21", "25"];
  console.log("échecs: " + Object.keys(C).filter((k) => CORRIGES.includes(k.slice(0, 2))).reduce((n, k) => n + C[k], 0));
  for (const k of Object.keys(C).sort()) { console.log(`${String(C[k]).padStart(4)}  ${k}`); for (const e of EX[k]) console.log("        ex. " + e); }
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
