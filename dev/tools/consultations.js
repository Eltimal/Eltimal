// Joue des consultations en entier et les affiche : ouverture, thèmes, chaque question et sa réponse, clôture.
// Usage : node tools/consultations.js <genre|all> [nombre] [graine] [appel]     ex. node tools/consultations.js copj 3 7 intake
const { boot, sleep } = require("../tests/harness");
(async () => {
  const { CR } = boot(); await sleep(150);
  const C = CR.CONSULT;
  const genre = process.argv[2] || "copj", n = +(process.argv[3] || 2), seed = +(process.argv[4] || 7), quel = process.argv[5] || "intake";
  const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed }));
  for (const g of genre === "all" ? ["copj", "al", "op", "pc", "info", "gav"] : [genre]) {
    for (let i = 0, vus = 0; i < 200 && vus < n; i++) {
      s.day = 20 + i; s.min = 600;
      let cs; try { cs = CR.GEN.open(s, g, { min: s.min, night: false }); } catch (e) { continue; }
      const def = CR.caseDef(cs), api = CR.api(s, cs), v = CR.caseVars(s, cs), fmt = (x) => CR.fmt(x || "", v);
      const call0 = (def.calls || {})[quel]; const call = typeof call0 === "function" ? call0(api) : call0;
      if (!call || !call.topics || !call.topics.some((tp) => !C.estGeste(tp))) continue;
      vus++;
      const p = s.generated.find((x) => x.id === cs.id), t = p.t;
      console.log(`\n================ ${g} · ${CR.caseTitle(s, cs)} · ${call.label || quel} · ${t.inf} · attitude ${t.stance} · patience ${call.patience || 100}`);
      for (const x of call.opening || []) console.log("  OUVERTURE : " + fmt(typeof x === "string" ? x : x.t));
      const K = C.ouvrir(s, cs, call, { api, fmt });
      console.log("  THÈMES : " + C.themesVisibles(K, null).map((th) => `${th.label} (${C.questions(K, th.id, null).length})`).join(" · "));
      let min = 0;
      for (let tour = 0; tour < 60; tour++) {
        const q = C.themesVisibles(K, null).map((th) => C.questions(K, th.id, null).find((x) => !C.posee(K, x.id))).find(Boolean);
        if (!q) break;
        const r = C.poser(K, q.id); min += r.min;
        console.log(`  [${C.THEMES[q.theme]}]${q.parent ? " ↳" : ""} ${q.q}  (${r.min} min)`);
        for (const l of r.lignes) console.log(`        ${l.f ? "●" : "–"} ${l.t}`);
        if (r.client) console.log(`        ? le client demande : « ${r.client} » → « ${C.repondreClient(K, r.client, true).t} »`);
        const neufs = C.themesVisibles(K, null).filter((th) => !(K._vus = K._vus || new Set()).has(th.id)); for (const th of neufs) K._vus.add(th.id);
      }
      console.log(`  CLÔTURE : ${fmt(call.close || "")}   — ${K.poses.length} questions, ${min} min`);
      console.log("  GESTES : " + call.topics.filter((tp) => !C.estQuestion(tp)).map((tp) => fmt(tp.q)).join(" | "));
    }
  }
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
