// Sortie 1.0 — essai d'endurance : un « singe » clique au hasard dans le jeu, dans un vrai navigateur, saisit des valeurs
// hostiles, et s'arrête à la première erreur de page, au premier écran vide ou d'erreur, au premier état corrompu.
//   CHROME=<chrome> node tools/singe.js [graine] [clics, défaut 25000] [minutes au plus, défaut 30]
// Pour qu'il aille au fond du jeu et pas seulement dans les rubriques du bureau, il s'inscrit aux permanences (le téléphone
// sonne) et, de temps en temps, se voit fixer une audience le jour même, où il entre comme le ferait « Y aller ».
// Sortie : une ligne « singe <graine> : N clics … » ; code de retour 1 si une anomalie a été vue.
const path = require("path");
const { chromium } = require("playwright");
const seed = +(process.argv[2] || 1), STEPS = +(process.argv[3] || 25000), MINUTES = +(process.argv[4] || 30);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  p.on("console", (m) => { if (m.type() === "error") logs.push("console: " + m.text().slice(0, 500)); });
  p.on("pageerror", (e) => logs.push("pageerror: " + (e.stack || e.message).slice(0, 700)));
  p.on("dialog", (d) => d.dismiss().catch(() => {}));
  await p.goto("file://" + path.resolve(__dirname, "..", "..", "index.html"));
  await p.waitForSelector(".ts-title", { timeout: 60000 });
  await p.evaluate((seed) => {
    const CR = window.CR;
    const s = CR.newGame({ prenom: "Singe", nom: "N" + seed, mode: "carriere", seed });
    s.settings.textSpeed = 60; if (CR.PAROLE) CR.PAROLE.ACCEL = 60; s.settings.coach = seed % 2 === 0; if (seed % 3 === 0) { s.settings.parole = "assiste"; s.settings.indices = true; }
    CR.poserPartie(s);
    let a = (seed * 2654435761) >>> 0; window.__rnd = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.__trail = []; window.__n = 0; window.__audiences = 0; window.__scenes = {};
  }, seed);
  await p.waitForTimeout(500);
  let stop = null, vus = 0; const t0 = Date.now();
  while (!stop && Date.now() - t0 < MINUTES * 60000) {
    const r = await p.evaluate(async (STEPS) => {
      const CR = window.CR, rnd = window.__rnd, T = (e) => (e.textContent || "").replace(/\s+/g, " ").trim();
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let k = 0; k < 40; k++) {
        if (window.__n >= STEPS) return { fin: true };
        let s = CR.store.s;
        if (!s || s.gameOver) { // retour au titre ou fin de carrière : une carrière neuve, l'essai continue
          const g = CR.newGame({ prenom: "Singe", nom: "Suite", mode: "carriere", seed: Math.floor(rnd() * 1e6) }); g.settings.textSpeed = 60; CR.poserPartie(g); await sleep(200); s = CR.store.s;
        }
        const app = document.getElementById("app");
        if (!app || !app.firstChild) return { stop: "ÉCRAN VIDE" };
        if (document.querySelector(".panne")) return { stop: "ÉCRAN D'ERREUR : " + ((document.querySelector(".panne pre") || {}).textContent || "").slice(0, 600) };
        const enScene = !!document.querySelector(".scene-host"), fenetre = !!document.querySelector(".modal-wrap");
        if (enScene) { const c = (document.querySelector(".scene-host > :nth-child(3)") || {}).className || "scène"; window.__scenes[String(c).split(" ").slice(0, 2).join(".")] = 1; }
        // le fond du jeu : permanences, audience du jour
        if (!enScene && !fenetre && rnd() < 0.03) {
          for (let d = s.day + 1; d < s.day + 6; d++) for (const t of ["gav_jour", "ci", "gav_nuit"]) if (rnd() < 0.3 && CR.peutSinscrire(s, d, t).ok) CR.signDuty(s, d, t);
          if (rnd() < 0.4 && !s.burnout && !s.night && s.min < 17 * 60 && CR.isBusinessDay(s.day)) {
            try {
              const cs = CR.GEN.open(s, "copj", {}); cs.status = "active"; cs.engaged = s.day;
              const t = s.generated.find((x) => x.id === cs.id).t;
              CR.PROC.fixAudience(CR.api(s, cs), { day: s.day, min: s.min + 10, juridiction: "tc", mode: "convocation", convocDay: s.day, president: t.pres, script: "tc", done: "apresTC", onMiss: "_absent", title: "Audience — essai", duree: 60 });
              s.at = "palais"; const h = cs.hearings[cs.hearings.length - 1];
              CR.UI._setScene({ type: "court", caseId: cs.id, hid: h.id }); window.__audiences++;
            } catch (e) { return { stop: "PRÉPARATION D'AUDIENCE : " + e.message }; }
          }
          CR.store.bump(); await sleep(60); continue;
        }
        let els = [...document.querySelectorAll("button, [role=button], .noteable, .seg, .case-card, .task, input[type=checkbox], input[type=radio], .decide-opt, a, select, .hcard, [tabindex], canvas, li, .mail, tr")].filter((e) => !e.disabled && e.offsetParent !== null);
        els = els.filter((e) => !/Quitter \(partie|rendre la robe|Quitter la profession|Retour à l'écran titre|Confirmer : rendre|^Charger$|Exporter/.test(T(e)));
        if (!els.length) return { stop: "AUCUN ÉLÉMENT CLIQUABLE : " + T(app).slice(0, 300) };
        const haut = els.filter((e) => e.closest(".modal, .scene-host, .closing, .chez-card"));
        const pool = haut.length && rnd() < 0.92 ? haut : els;
        const el = pool[Math.floor(rnd() * pool.length)];
        window.__trail.push((el.tagName + ":" + (T(el) || el.className || "")).slice(0, 44)); if (window.__trail.length > 10) window.__trail.shift();
        window.__n++;
        try {
          if (el.tagName === "SELECT") { const o = el.options[Math.floor(rnd() * el.options.length)]; if (o) { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(el, o.value); el.dispatchEvent(new Event("change", { bubbles: true })); } }
          else if (el.tagName === "CANVAS") { const r = el.getBoundingClientRect(); const x = r.left + rnd() * r.width, y = r.top + rnd() * r.height; for (const t of ["mousemove", "mousedown", "mouseup", "click"]) el.dispatchEvent(new MouseEvent(t, { bubbles: true, clientX: x, clientY: y })); }
          else el.click();
          for (const inp of [...document.querySelectorAll("input[type=text], input[type=number], textarea, input:not([type])")].slice(0, 3)) if (rnd() < 0.35) {
            const v = ["", "0", "-1", "999999999", "<img src=x onerror=window.__xss=1>", "122-5", "abc", "1e9", " ", "💥", "NaN", "63-1", "222-13", "x".repeat(3000)][Math.floor(rnd() * 14)];
            Object.getOwnPropertyDescriptor(inp.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value").set.call(inp, v); inp.dispatchEvent(new Event("input", { bubbles: true }));
            if (rnd() < 0.5) inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
          }
          if (rnd() < 0.04) window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        } catch (e) { return { stop: "EXCEPTION " + e.stack.slice(0, 500) }; }
        await sleep(rnd() < 0.08 ? 150 : 8);
        const st = CR.store.s;
        if (st) {
          const bad = [];
          for (const key of ["cash", "energy", "min", "day", "carpa"]) if (typeof st[key] !== "number" || !isFinite(st[key])) bad.push(key + "=" + st[key]);
          for (const key of Object.keys(st.reps)) if (!isFinite(st.reps[key]) || st.reps[key] < 0 || st.reps[key] > 100) bad.push("rep." + key + "=" + st.reps[key]);
          if (st.min > 24 * 60 || st.min < 0) bad.push("min " + st.min);
          if (st.energy < 0 || st.energy > 100) bad.push("energy " + st.energy);
          for (const id of st.order) { const c = st.cases[id]; if (!c) bad.push("order sans dossier " + id); else if (!isFinite(c.trust)) bad.push("trust " + id); }
          if (st.inbox.some((m) => typeof m.subject !== "string" || !m.subject)) bad.push("courriel sans objet");
          if (window.__xss) bad.push("code injecté exécuté");
          if (bad.length) return { stop: "ÉTAT CORROMPU " + bad.join(", ") };
        }
      }
      return {};
    }, STEPS).catch((e) => ({ stop: "ÉVALUATION : " + e.message.slice(0, 300) }));
    if (logs.length > vus) { stop = "ERREUR DE PAGE : " + logs.slice(vus).join(" || ").slice(0, 1200); vus = logs.length; }
    if (r.stop) stop = r.stop;
    if (r.fin) break;
  }
  const fin = await p.evaluate(async () => { const CR = window.CR, s = CR.store.s; let ok = null, relu = null; try { ok = await CR.Saves.save("singe", s); relu = !!(await CR.Saves.load("singe")); } catch (e) { relu = "erreur " + e.message; } const st = {}; if (s) for (const id of s.order) { const c = s.cases[id]; const k = (c.outcome && c.outcome.type) || c.status; st[k] = (st[k] || 0) + 1; } return { n: window.__n, jour: s && s.day, audiences: window.__audiences, scenes: Object.keys(window.__scenes), issues: st, enregistre: ok, relu, tas: performance.memory && Math.round(performance.memory.usedJSHeapSize / 1048576), piste: window.__trail.join(" > ") }; }).catch((e) => ({ erreur: e.message }));
  console.log(`singe ${seed} : ${fin.n} clics en ${Math.round((Date.now() - t0) / 1000)} s, jour ${fin.jour}, ${fin.audiences} audiences ouvertes, scènes vues : ${(fin.scenes || []).join(", ")} ; issues ${JSON.stringify(fin.issues)} ; sauvegarde finale ${fin.enregistre && fin.relu === true ? "écrite et relue" : "EN ÉCHEC " + fin.relu} ; tas ${fin.tas} Mo`);
  if (stop) console.log(`singe ${seed} : ANOMALIE — ${stop}\n  derniers clics : ${fin.piste}`);
  await b.close();
  process.exit(stop || !(fin.enregistre && fin.relu === true) ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
