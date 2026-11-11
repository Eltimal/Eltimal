// Cohérence des dires avec la fiche de la personne qui parle : emploi, études, retraite, enfants, logement, casier, âge.
// Chaque entretien, appel, dépôt, parloir, audition et réplique d'audience des affaires générées est parcouru ; une phrase
// qui contredit la fiche (« Je suis sans emploi : sans permis, je perds mon travail ») est un échec.
// Usage : node tests/tcoherence.js [affaires par graine, défaut 200]   VOIR=1 affiche toutes les phrases fautives.
const { boot, sleep } = require("./harness");
const D = require("./dial");
let fails = 0;
const shown = new Map();
const ok = (c, m, k) => { if (c) return; fails++; const key = k || m; const n = (shown.get(key) || 0) + 1; shown.set(key, n); if (n <= 3 || process.env.VOIR) console.log("ÉCHEC", m); };

// Ce que la personne affirme d'elle-même
const TRAVAILLE = /\b(mon travail|mon boulot|mon patron|ma patronne|mon employeur|je travaille\b|j'ai toujours travaillé|je reprends le travail|reprendre le travail|rentrais du travail|en rentrant du travail|mes collègues|ma tournée|mon chantier|mes horaires de travail|je ne travaille plus|je perds mon travail)/i;
const CHOMAGE = /\b(je cherche du travail|je cherche\.|je n'ai pas de travail|pas de travail en ce moment|sans emploi|j'ai perdu mon travail|au chômage|rien, en ce moment)/i;
const ENFANTS = /\b(mes enfants|mon enfant|mon fils|ma fille|les enfants|les petits|mes gosses|mes trois|mes deux)\b/i;
const SANS_ADRESSE = /(pas d'adresse fixe|à droite à gauche|chez des potes)/i;
const ADRESSE = /\b(j'habite|ça fait des années que je suis là-bas)\b/i;
const JAMAIS_CONDAMNE = /\b(casier vierge|jamais été condamné|n'ai jamais été condamné|jamais eu de procès|première fois que je mets les pieds|jamais de ma vie)\b/i;
const DEJA_CONDAMNE = /\b(une fois, il y a longtemps|j'ai déjà été condamné|il y a un an et demi|bêtise de jeunesse|j'avais eu du sursis|une peine de prison)\b/i;
const SCOLAIRE = /\b(je vais au lycée|j'allais au lycée|au collège)\b/i;

(async () => {
  const env = boot();
  const { CR, errors } = env;
  await sleep(150);
  const PR = CR.GEN2.PR;
  const PAR = +(process.argv[2] || 200);
  const SEEDS = [13, 29, 31, 47, 53];
  const GENRES = ["gav", "ci", "al", "op", "copj", "pc", "info", "pc", "copj", "info", "op", "gav"];
  const st = { n: 0, lues: 0, genre: {} };
  for (const seed of SEEDS) {
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed }));
    for (let i = 0; i < PAR; i++) {
      const kind = GENRES[i % GENRES.length];
      s.day = 20 + i; s.min = 9 * 60 + (i % 9) * 50;
      let cs, p;
      try { cs = CR.GEN.open(s, kind, { min: s.min, night: kind === "gav" && i % 4 === 0 }); p = s.generated.find((x) => x.id === cs.id); }
      catch (e) { ok(false, `graine ${seed} n° ${i} (${kind}) : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "tirage"); continue; }
      st.n++; st.genre[kind] = (st.genre[kind] || 0) + 1;
      const t = p.t;
      const id = `${cs.id} (${kind}, ${t.inf}${t.f.sc ? "/" + t.f.sc : t.f.ctx ? "/" + t.f.ctx : ""})`;
      let d;
      try { d = D.collect(CR, s, cs, p); } catch (e) { ok(false, `${id} : ${e.stack.split("\n").slice(0, 2).join(" | ")}`, "collect"); continue; }
      const def = CR.caseDef(cs);
      const pers = { A: t.A, V: t.V, T: t.T, T2: t.T2, P: t.P, C2: t.C2, F: def.famille };
      const fiche = (P) => `${P.prenom} ${P.nom}, ${P.age} ans, ${P.metier}${P.emploi ? " (en emploi)" : ""}, ${P.enfants || 0} enfant(s), ${P.heberg ? "logé" : "sans adresse"}, casier ${P.casier}`;
      // les phrases prononcées par une personne de l'affaire, en son nom propre
      const dits = [];
      for (const c of d.calls) {
        const k = c.speaker;
        if (!k || !pers[k]) continue;
        for (const tp of c.topics) for (const g of tp.segs) dits.push({ k, t: g.t, f: g.f, w: c.key + ":" + tp.id, q: tp.q });
        if (c.close) dits.push({ k, t: c.close, w: c.key + ":clo" });
        if (c.key !== "gav") for (const x of c.extra || []) dits.push({ k, t: x, w: c.key + ":x" });
        for (const o of c.opening || []) for (const m of o.matchAll(/«([^«»]+)»/g)) dits.push({ k, t: m[1], w: c.key + ":ouv" });
      }
      for (const a of d.audience) if (a.who === "prevenu") dits.push({ k: "A", t: a.t, w: "aud" });
      for (const x of dits) {
        st.lues++;
        const P = pers[x.k];
        // phase 3 : le client qui ment contredit sa fiche exprès (testé à part, tests/tp3.js)
        if (x.f === "G_vie_ment" || x.f === "G_vie_maintient") continue;
        const txt = x.t.replace(/«[^«»]*»/g, " ");
        const voix = `${id} [${x.w}] ${x.k} — ${fiche(P)} : « ${PR.sansMarques ? PR.sansMarques(x.t) : x.t} »`;
        if (x.k === "F") {
          // la famille parle du client
          const A = t.A;
          if (/(cherchait|cherche) du travail/i.test(txt)) ok(!A.emploi && !/étudiant|lycéen|retraité/.test(A.metier), voix + " (contredit la fiche de " + fiche(A) + ")", "famille:emploi");
          continue;
        }
        // 1. le travail
        if (TRAVAILLE.test(txt.replace(/je travaille aux cuisines/i, "")) && !CHOMAGE.test(txt)) ok(CR.MONDE.travaille(P), voix, "travaille-sans-emploi:" + (TRAVAILLE.exec(txt) || [""])[0].toLowerCase());
        if (CHOMAGE.test(txt)) ok(!CR.MONDE.travaille(P), voix, "chomage-en-emploi:" + (CHOMAGE.exec(txt) || [""])[0].toLowerCase());
        if (/\b(je cherche du travail|rien, en ce moment|pas de travail)/i.test(txt)) ok(!/étudiant|lycéen|retraité|collégien/.test(P.metier), voix, "chomage-etudiant-retraite");
        if (/retraité/.test(P.metier)) ok(!/pour l'instant|depuis quelques années/i.test(txt) || !/retraité/i.test(txt), voix, "retraite-provisoire");
        const m = /\bje suis ([a-zà-ÿ' -]+?)(?:[.,:;]|$)/i.exec(txt);
        if (m && x.f === "G_emploi") ok(m[1].trim() === P.metier, voix, "metier-different");
        // 2. les enfants
        if (ENFANTS.test(txt) && !(P.rel === "parent") && !(x.k === "P")) ok((P.enfants || 0) > 0, voix, "enfants:" + ENFANTS.exec(txt)[0].toLowerCase());
        // 3. le logement
        if (SANS_ADRESSE.test(txt)) ok(!P.heberg, voix, "sans-adresse-loge");
        if (ADRESSE.test(txt) && x.f === "G_heberg") ok(P.heberg, voix, "adresse-sans-logement");
        // 4. le casier
        if (JAMAIS_CONDAMNE.test(txt)) ok(!P.casier, voix, "jamais-condamne:" + JAMAIS_CONDAMNE.exec(txt)[0].toLowerCase());
        if (DEJA_CONDAMNE.test(txt) && x.k === "A") ok(P.casier > 0, voix, "deja-condamne:" + DEJA_CONDAMNE.exec(txt)[0].toLowerCase());
        if (/bêtise de jeunesse|il y a longtemps|ça remonte à des années|il y a des années/i.test(txt) && x.k === "A" && P.casier) ok(P.age >= 24, voix, "casier-ancien-trop-jeune");
        // 5. l'âge
        if (SCOLAIRE.test(txt)) ok(P.age < 20 || t.mineur, voix, "lycee-adulte");
      }
      // le bulletin n° 1 : une ancienne condamnation date d'un âge où la personne était majeure, et ce qu'en dit la personne y correspond
      if (def.docs && def.docs.casier && t.A.casier) {
        let b1 = "";
        try { const doc = typeof def.docs.casier === "function" ? def.docs.casier(CR.api(s, cs)) : def.docs.casier; b1 = JSON.stringify(doc.paras || doc); } catch (e) { b1 = ""; }
        const m = /il y a (\d+) ans?/.exec(b1);
        if (m && !/réclusion/.test(b1)) {
          const ans = +m[1];
          ok(t.A.age - ans >= 18 || /pour enfants/.test(b1), `${id} : bulletin n° 1, condamnation il y a ${ans} ans pour ${fiche(t.A)}`, "b1-mineur");
          if (ans < 7) { const dd = dits.filter((x) => x.k === "A" && /(casier|condamn|justice)/i.test(x.q || "")).map((x) => x.t).join(" "); if (dd && /il y a \w+ ans|l'an dernier/.test(dd)) ok(new RegExp(ans <= 1 ? "l'an dernier|il y a un an" : "il y a " + ["", "un", "deux", "trois", "quatre", "cinq", "six"][ans] + " ans").test(dd), `${id} : bulletin à ${ans} an(s), la personne dit : « ${dd} »`, "b1-annees"); }
          const dit = dits.filter((x) => x.k === "A" && /\b(une fois|il y a)\b/i.test(x.t) && /(casier|condamn|justice)/i.test(x.q || "")).map((x) => x.t).join(" ");
          if (dit && ans < 5) ok(!/longtemps|des années|jeunesse/i.test(dit), `${id} : bulletin à ${ans} an(s), la personne dit : « ${dit} »`, "b1-dires");
        }
        st.b1 = (st.b1 || 0) + 1;
      }
    }
  }
  console.log(`affaires : ${st.n} (${Object.entries(st.genre).map(([k, v]) => k + " " + v).join(", ")}) | phrases des personnes lues : ${st.lues} | bulletins n° 1 relus : ${st.b1 || 0}`);
  console.log([...shown.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `  ${n}\t${k}`).join("\n"));
  console.log(`\néchecs: ${fails}`);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
