// Chantier anti-répétition (feuille de route) : la mesure, avec des seuils à tenir.
// 1. Arguments de plaidoirie : part des arguments communs entre deux affaires générées (main pleine), avant et après le
//    module de plaidoirie ; arguments piégés présents, jamais pertinents, débrief.
// 2. Directeur de partie : sur des carrières simulées, part des fenêtres de 5 affaires qui contiennent deux fois la même
//    infraction dans la même scène (toutes affaires, puis comparutions immédiates seules), avec et sans directeur ;
//    une affaire nouvelle ou oubliée chaque semaine ; codes rejoués à l'identique.
// 3. Phrases : part des phrases identiques (noms, lieux et chiffres masqués) entre deux gardes à vue d'infractions
//    différentes (seuil 25 %, lot 2) ; tempéraments, incidents d'audience, audiences reconstruites à l'identique.
// Usage : node tests/trepetition.js [affaires par genre, défaut 120]   VOIR=1 affiche des exemples
const { boot, sleep } = require("./harness");
const D = require("./dial");
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
const SEUILS = { argsCommuns: 0.2, doublons5: 0.05, doublonsCI5: 0.05, phrases: 0.25 };
const pc = (x) => (100 * x).toFixed(1) + " %";
const segT = (x) => (typeof x === "string" ? x : x && typeof x.t === "string" ? x.t : "");
const norm = (text) => String(text).split(/(?<=[.!?…»])\s+|\n+/).map((s) => s.replace(/\d+([ ,.]\d+)*/g, "#").replace(/\b\p{Lu}[\p{L}'’-]*/gu, "X").replace(/\s+/g, " ").trim().toLowerCase()).filter((s) => s.split(" ").length >= 4);
const recouvre = (A, B) => { if (!A.size || !B.size) return null; let n = 0, m = 0; for (const x of B) if (A.has(x)) n++; for (const x of A) if (B.has(x)) m++; return (n / B.size + m / A.size) / 2; };
const moyennePaires = (items, f) => { let t = 0, n = 0; for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const v = f(items[i], items[j]); if (v != null) { t += v; n++; } } return n ? t / n : 0; };

(async () => {
  const env = boot();
  const { CR, errors } = env;
  await sleep(150);
  const G = CR.GEN2;
  const N = +(process.argv[2] || 120);
  ok(CR.PLAID && G.DIR, "modules plaidoirie et directeur chargés");

  // Les plaidoiries d'une affaire (fond : défense ou partie civile)
  const plaidoiries = (s, cs) => {
    const def = CR.caseDef(cs), api = CR.api(s, cs), out = [];
    for (const k of Object.keys(def.audiences || {})) {
      let a; try { a = def.audiences[k](api); } catch (e) { continue; }
      const seen = new Set();
      const walk = (o, d) => { if (!o || d > 14 || typeof o !== "object" || seen.has(o)) return; seen.add(o); if (Array.isArray(o)) { o.forEach((x) => walk(x, d + 1)); return; } if (o.plaidoirie && ["defense", "pc"].includes(o.plaidoirie.role)) out.push(o.plaidoirie); for (const v of Object.values(o)) if (v && typeof v === "object") walk(v, d + 1); };
      walk(a && a.steps, 0);
    }
    return out;
  };

  // ------------------------------------------------------------------ 1. Arguments
  {
    G.DIR.off = true;
    const avant = [], apres = [];
    let nPieges = 0, piegesPertinents = 0, nPlaid = 0, cachesSansMain = 0, exemples = 0;
    for (const g of ["ci", "copj", "pc", "al", "op"]) {
      const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 41 }));
      for (let i = 0; i < N; i++) {
        s.day = 20 + i; s.min = 600;
        let cs; try { cs = CR.GEN.open(s, g, { min: 600, night: false }); } catch (e) { continue; }
        const Ps = plaidoiries(s, cs);
        if (!Ps.length) continue;
        const a0 = new Set(), a1 = new Set();
        for (const P of Ps) {
          nPlaid++;
          for (const a of P.args || []) for (const x of norm(a.say || a.label)) a0.add(x);
          const Q = CR.PLAID.preparer(s, cs, P, { toutVoir: true });
          for (const a of Q.args) {
            for (const x of norm(a.say || a.label)) a1.add(x);
            if (a.piege) { nPieges++; if (a.pertinent && a.pertinent()) piegesPertinents++; ok(a.rebut && a.regle, `${cs.id} : argument piégé sans réplique ni règle (${a.id})`); }
            ok(!/undefined|\$\{|NaN|\[object/.test(a.say + a.label), `${cs.id} : texte technique dans un argument (${a.id}) : ${a.say}`);
          }
          const Q0 = CR.PLAID.preparer(s, cs, P);
          if (Q0.args.some((a) => (a.cards || []).length && !a.cards.some((c) => CR.inHand(s, cs, c)))) cachesSansMain++;
          if (process.env.VOIR && exemples < 4) { exemples++; console.log(`\n${cs.id} ${g} ${CR.GEN.paramsOf(s, cs.id).t.inf}`); for (const a of Q.args) console.log(`  ${a.piege ? "[piège] " : ""}${a.label} — ${a.say}`); }
        }
        avant.push(a0); apres.push(a1);
      }
    }
    const rAvant = moyennePaires(avant, recouvre), rApres = moyennePaires(apres, recouvre);
    console.log(`Arguments communs entre deux affaires : ${pc(rAvant)} avant, ${pc(rApres)} après (seuil ${pc(SEUILS.argsCommuns)}) ; ${nPlaid} plaidoiries, ${nPieges} arguments piégés`);
    ok(rApres < SEUILS.argsCommuns, `arguments communs ${pc(rApres)} ≥ ${pc(SEUILS.argsCommuns)}`);
    ok(nPieges >= nPlaid * 1.5, `trop peu d'arguments piégés (${nPieges} pour ${nPlaid} plaidoiries)`);
    ok(piegesPertinents === 0, `${piegesPertinents} argument(s) piégé(s) jugé(s) pertinent(s)`);
    ok(cachesSansMain === 0, `${cachesSansMain} plaidoirie(s) affichent un argument que rien n'appuie en main`);
    // débrief : un piège plaidé, un piège évité
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 42 }));
    s.day = 20; s.min = 600;
    const cs = CR.GEN.open(s, "ci", { min: 600 });
    const P = plaidoiries(s, cs)[0];
    const Q = CR.PLAID.preparer(s, cs, P, { toutVoir: true });
    const pieges = Q.args.filter((a) => a.piege);
    CR.PLAID.vus(cs, Q); CR.PLAID.joue(cs, pieges[0]);
    const deb = CR.PLAID.debrief(s, cs);
    ok(deb.length === pieges.length && deb.filter((d) => d.kind === "bad").length === 1 && deb.filter((d) => d.kind === "good").length === pieges.length - 1, "débrief des arguments piégés");
  }

  // ------------------------------------------------------------------ 2. Directeur de partie
  {
    const carriere = (seed, off) => {
      G.DIR.off = off;
      G.histVider();
      const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed }));
      const r = CR.seeded("rep" + seed);
      const seq = [];
      for (let i = 0; i < 160; i++) {
        s.day = 5 + Math.floor(i / 2); s.min = 600 + (i % 2) * 240;
        const x = r();
        const kind = x < 0.3 ? "gav" : x < 0.45 ? "ci" : x < 0.5 ? "info" : G.leadKind(s);
        let cs; try { cs = CR.GEN.open(s, kind, { min: s.min, night: false }); } catch (e) { continue; }
        const t = CR.GEN.paramsOf(s, cs.id).t;
        seq.push({ g: kind, k: `${t.inf}/${t.f.sc || t.f.ctx || "-"}`, inf: t.inf, d: G.difficulte(t), day: s.day, code: t.code, sig: t.sig });
      }
      return { s, seq };
    };
    const fen = (seq, n) => { let w = 0, d = 0; for (let i = 0; i + n <= seq.length; i++) { w++; const ks = seq.slice(i, i + n).map((x) => x.k); if (new Set(ks).size < ks.length) d++; } return w ? d / w : 0; };
    const res = { off: { m: 0, ci: 0, ser: 0 }, on: { m: 0, ci: 0, ser: 0 } };
    const SEEDS = [11, 22, 33, 44, 55];
    let semainesSansNeuf = 0, semaines = 0, codesOk = 0, codesTotal = 0;
    for (const mode of ["off", "on"]) for (const sd of SEEDS) {
      const { s, seq } = carriere(sd, mode === "off");
      res[mode].m += fen(seq, 5) / SEEDS.length;
      res[mode].ci += fen(seq.filter((x) => x.g === "ci"), 5) / SEEDS.length;
      let tri = 0, nt = 0; for (let i = 0; i + 3 <= seq.length; i++) { nt++; if (seq[i].d === seq[i + 1].d && seq[i + 1].d === seq[i + 2].d) tri++; }
      res[mode].ser += tri / nt / SEEDS.length;
      if (mode === "on") {
        // nouveauté : chaque semaine pleine compte une infraction jamais vue ou absente des 25 affaires précédentes
        const vus = new Map();
        const parSemaine = new Map();
        seq.forEach((x, i) => { const last = vus.get(x.inf); const neuf = last == null || i - last > 25; vus.set(x.inf, i); const w = Math.floor(x.day / 7); parSemaine.set(w, (parSemaine.get(w) || false) || neuf); });
        for (const [w, v] of parSemaine) if (w > 0 && w < Math.max(...parSemaine.keys())) { semaines++; if (!v) semainesSansNeuf++; }
        // les affaires choisies par le directeur se rejouent par leur code
        for (const x of seq.filter((_, i) => i % 9 === 0)) {
          codesTotal++;
          const L = G.lireCode(x.code);
          if (!L.ok) continue;
          try { const t2 = G.tirerCode(L.c); if (t2.sig === x.sig) codesOk++; } catch (e) { /* compté comme échec */ }
        }
        ok(s.dir && s.dir.recent.length > 0, "mémoire du directeur dans la partie");
      }
    }
    console.log(`Même infraction et même scène dans 5 affaires de suite : ${pc(res.off.m)} sans directeur, ${pc(res.on.m)} avec (seuil ${pc(SEUILS.doublons5)})`);
    console.log(`… sur 5 comparutions immédiates de suite : ${pc(res.off.ci)} sans, ${pc(res.on.ci)} avec (seuil ${pc(SEUILS.doublonsCI5)})`);
    console.log(`Trois affaires de même difficulté d'affilée : ${pc(res.off.ser)} sans, ${pc(res.on.ser)} avec ; semaines sans affaire nouvelle : ${semainesSansNeuf}/${semaines} ; codes rejoués : ${codesOk}/${codesTotal}`);
    ok(res.on.m < SEUILS.doublons5, `doublons sur 5 affaires ${pc(res.on.m)}`);
    ok(res.on.ci < SEUILS.doublonsCI5, `doublons sur 5 comparutions immédiates ${pc(res.on.ci)}`);
    ok(res.on.ser < res.off.ser, "le directeur fait alterner les difficultés");
    ok(semainesSansNeuf === 0, `${semainesSansNeuf} semaine(s) sans affaire nouvelle`);
    ok(codesOk === codesTotal && codesTotal > 0, `codes rejoués à l'identique : ${codesOk}/${codesTotal}`);
    // hors carrière, rien ne change
    G.DIR.off = false; G.histVider();
    const sA = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 9 }));
    sA.mode = "affaire"; sA.day = 30; sA.min = 600;
    const pA = G.params(sA, "copj", { min: 600 });
    G.DIR.off = true; G.histVider();
    const sB = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 9 }));
    sB.mode = "affaire"; sB.day = 30; sB.min = 600;
    const pB = G.params(sB, "copj", { min: 600 });
    ok(pA.t.sig === pB.t.sig, "hors carrière, le directeur ne choisit rien");
    G.DIR.off = false;
  }

  // ------------------------------------------------------------------ 3. Phrases (gardes à vue)
  {
    G.DIR.off = true;
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 11 }));
    const items = [];
    for (let i = 0; i < N; i++) {
      s.day = 20 + i; s.min = 600;
      let cs; try { cs = CR.GEN.open(s, "gav", { min: 600, night: false }); } catch (e) { continue; }
      const p = CR.GEN.paramsOf(s, cs.id), def = CR.caseDef(cs), d = D.collect(CR, s, cs, p);
      const set = new Set();
      for (const c of d.calls) for (const l of c.lines) norm(l).forEach((x) => set.add(x));
      for (const a of d.audience) norm(a.t).forEach((x) => set.add(x));
      for (const k of Object.keys(def.docs || {})) { try { const r = CR.renderDoc(s, cs, { key: k }); for (const pa of r.paras || []) norm(pa.map(segT).join(" ")).forEach((x) => set.add(x)); } catch (e) { /* pièce absente */ } }
      items.push({ inf: p.t.inf, set });
    }
    const r = moyennePaires(items, (a, b) => (a.inf === b.inf ? null : recouvre(a.set, b.set)));
    console.log(`Phrases identiques entre deux gardes à vue d'infractions différentes : ${pc(r)} (seuil ${pc(SEUILS.phrases)} ; 53,7 % avant le chantier)`);
    ok(r < SEUILS.phrases, `phrases communes ${pc(r)} ≥ ${pc(SEUILS.phrases)}`);
    // lot 2 : tempérament du client, incidents d'audience, une affaire se relit à l'identique
    const temps = {}; let avecIncident = 0, audiences = 0, stable = 0, nStable = 0;
    const s2 = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 12 }));
    for (let i = 0; i < 60; i++) {
      s2.day = 20 + i; s2.min = 600;
      let cs; try { cs = CR.GEN.open(s2, ["ci", "copj", "pc", "al"][i % 4], { min: 600 }); } catch (e) { continue; }
      const def = CR.caseDef(cs), api = CR.api(s2, cs);
      temps[def.temperament] = (temps[def.temperament] || 0) + 1;
      for (const k of Object.keys(def.audiences || {})) {
        let a; try { a = def.audiences[k](api); } catch (e) { ok(false, `${cs.id} : audience ${k} en erreur ${e.message}`); continue; }
        const aReq = (o, d = 0) => !!o && typeof o === "object" && d < 12 && (o.requisitions != null || Object.values(o).some((v) => aReq(v, d + 1)));
        if (!aReq(a.steps)) continue;
        audiences++;
        if (JSON.stringify(a.steps, (kk, v) => (typeof v === "function" ? undefined : v)).match(/éclate en sanglots|rapport complémentaire|interprète n'est pas encore|Il est tard|J'étais là ce jour-là|C'est faux !/)) avecIncident++;
        const b = def.audiences[k](api);
        nStable++; if (JSON.stringify(a.steps, (kk, v) => (typeof v === "function" ? undefined : v)) === JSON.stringify(b.steps, (kk, v) => (typeof v === "function" ? undefined : v))) stable++;
      }
    }
    console.log(`Tempéraments : ${JSON.stringify(temps)} ; audiences au fond avec incident : ${avecIncident}/${audiences} ; audiences relues à l'identique : ${stable}/${nStable}`);
    ok(Object.keys(temps).length >= 4, "au moins quatre tempéraments tirés");
    ok(avecIncident > audiences * 0.25 && avecIncident < audiences * 0.8, `part d'audiences avec incident hors de 25-80 % (${avecIncident}/${audiences})`);
    ok(stable === nStable, "une audience se reconstruit à l'identique");
    const csI = { vars: { incidents: ["piece_barre"] } };
    ok(CR.PHRASIER.debrief(s2, csI).length === 1, "débrief des incidents");
    G.DIR.off = false;
  }

  // ------------------------------------------------------------------ 4. Lot 3 : matière, retournements, enjeu du client
  {
    G.DIR.off = true;
    const scenes = (id) => { const set = new Set(); for (let i = 0; i < 3000; i++) { const f = CR.CAT.INF[id].tirer(CR.seeded(id + ":" + i)); set.add(f.sc); } return set.size; };
    const sc = { refus_obtemperer: scenes("refus_obtemperer"), stups_volant: scenes("stups_volant"), delit_fuite: scenes("delit_fuite") };
    const opInf = new Set();
    for (let i = 0; i < 1500; i++) { try { opInf.add(G.tirer(`op3:${i}`, "op", { day: 30 }).inf); } catch (e) { /* rien */ } }
    console.log(`Scènes : ${JSON.stringify(sc)} ; ordonnances pénales : ${opInf.size} infractions (${[...opInf].join(", ")})`);
    ok(sc.refus_obtemperer >= 3 && sc.stups_volant >= 3 && sc.delit_fuite >= 4, "scènes nouvelles des fiches pauvres");
    ok(opInf.size >= 8, `ordonnances pénales : ${opInf.size} infractions seulement`);
    // retournements et enjeux, sur des clients convoqués
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 77 }));
    s.pending = s.pending.filter((e) => e.type !== "lead");
    const cases = [];
    for (let i = 0; i < 40; i++) { CR.GEN.lead(s, s.day, ["copj", "al", "pc"][i % 3]); cases.push(s.cases[s.order[0]]); }
    const enAttente = s.pending.filter((e) => e.key === "_retournement").length;
    for (const cs of cases) cs.status = "active"; // dossiers acceptés
    for (let d = 0; d < 12; d++) CR.endDay(s);
    const prevus = cases.filter((cs) => CR.caseDef(cs).retournement).length;
    const arrives = cases.filter((cs) => cs.vars.retournement).length;
    const enjeux = cases.filter((cs) => CR.caseDef(cs).enjeuClient);
    console.log(`Retournements : ${enAttente} programmés, ${arrives} arrivés sur ${prevus} prévus (${cases.length} dossiers) ; enjeux du client : ${enjeux.length}`);
    ok(prevus >= 8 && arrives >= prevus * 0.6, "retournements prévus et arrivés en cours de dossier");
    ok(cases.filter((cs) => cs.vars.retournement).every((cs) => s.inbox.some((m) => m.caseId === cs.id && m.doc === "retournement") || s.inbox.some((m) => m.doc === "retournement")), "la pièce du retournement arrive au courrier");
    const csR = cases.find((cs) => cs.vars.retournement && CR.RETOURNEMENT.TYPES[cs.vars.retournement].sens === "decharge");
    if (csR) {
      const api = CR.api(s, csR), R = CR.RETOURNEMENT.TYPES[csR.vars.retournement];
      const d0 = CR.PROC.deliberer(api, { seuil: 0.5, pieces: {} }, { played: [] }), d1 = CR.PROC.deliberer(api, { seuil: 0.5, pieces: {} }, { played: [R.fact, "arg:retournement"] });
      ok(d1.score < d0.score, "l'élément nouveau à décharge compte s'il est plaidé");
    }
    const csE = enjeux.find((cs) => CR.caseDef(cs).calls.intake);
    ok(enjeux.length >= 8, `trop peu d'enjeux (${enjeux.length})`);
    if (csE) {
      const intake = CR.caseDef(csE).calls.intake;
      ok(typeof intake === "function" || intake.topics.some((tp) => tp.id === "c_enjeu"), "l'enjeu se dit au premier entretien");
      ok(CR.RETOURNEMENT.argsPour(s, csE, "defense").some((a) => a.id === "enjeu"), "l'enjeu se plaide");
      csE.vars.decision = { coupable: false }; ok(CR.RETOURNEMENT.debrief(s, csE).some((d) => /enjeu/.test(d.text)), "débrief de l'enjeu");
    }
    G.DIR.off = false;
  }

  // ------------------------------------------------------------------ 5. Lot 4 : compositions, rituels résumés, moments des incidents
  {
    const PH = CR.PHRASIER;
    const grosses = PH.ENTREES.filter((e) => e.vs.length >= 9).length;
    ok(grosses >= 8, `répliques composées trop rares (${grosses})`);
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 5 }));
    let resumes = 0, completes = 0;
    for (let i = 0; i < 8; i++) {
      s.day = 20 + i; s.min = 600;
      const cs = CR.GEN.open(s, "copj", { min: 600 }); const api = CR.api(s, cs);
      const st = JSON.stringify(CR.caseDef(cs).audiences.tc(api).steps, (k, v) => (typeof v === "function" ? undefined : v));
      if (/"t":"Le tribunal !"/.test(st)) completes++; else resumes++;
    }
    console.log(`Répliques composées (9 versions ou plus) : ${grosses} ; rituels complets puis résumés : ${completes} / ${resumes}`);
    ok(completes === PH.RITUEL_SEUIL && resumes === 8 - PH.RITUEL_SEUIL, "les trois premiers rituels complets, puis résumés");
    ok(new Set(Array.from({ length: 40 }, (_, i) => PH.MOMENTS[CR.hash("k" + i + ":moment:tc") % PH.MOMENTS.length])).size >= 3, "l'incident change de moment");
  }

  for (const e of errors) { fails++; console.log("ERREUR", e.slice(0, 300)); }
  console.log(`échecs: ${fails}`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
