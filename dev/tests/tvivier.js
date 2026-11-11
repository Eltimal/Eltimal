// Vivier d'affaires (feuille de route, n° 5) : ordre et dates par graine, contraintes de calendrier,
// conditions et canaux d'arrivée, permanence, chevauchement d'audiences, anciennes sauvegardes.
const { boot, sleep } = require("./harness");
(async () => {
  const { CR, errors } = boot();
  await sleep(50);
  let fails = 0;
  const check = (ok, msg) => { if (!ok) { fails++; console.log("ÉCHEC :", msg); } };
  const game = (seed) => (CR.store.s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed }));
  const E = (id) => CR.vivierEntry(id);

  // 1. Trois graines : trois ordres différents ; même graine, même tirage
  const ordres = [1, 2, 3].map((seed) => { const s = game(seed); return s.vivier.ordre.map((k) => k + "@" + s.vivier.plan[k]); });
  ordres.forEach((o, i) => console.log("graine", i + 1, ":", o.join(" ")));
  check(new Set(ordres.map((o) => o.map((x) => x.split("@")[0]).join())).size === 3, "les trois graines donnent le même ordre");
  check(game(2).vivier.ordre.join() === game(2).vivier.ordre.join(), "même graine, tirage différent");

  // 2. Contraintes sur 300 graines : fenêtre, jours valides, ouverture, plafond des grosses affaires
  const stats = { absents: 0, n: 0 }, firsts = {};
  for (let seed = 100; seed < 400; seed++) {
    const s = game(seed), v = s.vivier;
    const plan = Object.entries(v.plan).filter(([, d]) => d != null);
    stats.n += plan.length; stats.absents += v.absents.length;
    const first = v.ordre[0];
    firsts[first] = (firsts[first] || 0) + 1;
    check(E(first).ouverture && v.plan[first] <= 4, `graine ${seed} : ouverture ${first} au jour ${v.plan[first]}`);
    for (const [k, d] of plan) {
      const e = E(k);
      check(d >= e.fen[0] && d <= e.fen[1], `graine ${seed} : ${k} hors fenêtre (${d})`);
      check(CR.isBusinessDay(d) && (!e.ok || e.ok(d)), `graine ${seed} : ${k} un jour impossible (${CR.fmtDate(d, "dow")})`);
    }
    const grosses = plan.filter(([k]) => E(k).poids === "grosse").map(([, d]) => d);
    const parSemaine = {};
    for (const d of grosses) parSemaine[Math.floor(d / 7)] = (parSemaine[Math.floor(d / 7)] || 0) + 1;
    check(Object.values(parSemaine).every((n) => n <= 2), `graine ${seed} : plus de deux grosses affaires la même semaine`);
    const leads = s.pending.filter((e) => e.type === "lead");
    check(leads.every((e) => e.data && e.data.vivier && e.min >= 9 * 60 && e.min < 19 * 60), `graine ${seed} : arrivée hors des heures de bureau`);
  }
  console.log("affaires par partie (moyenne)", (stats.n / 300).toFixed(1), "absentes", (stats.absents / 300).toFixed(1), "ouvertures", JSON.stringify(firsts));

  // 3. Carrière simulée : chaque affaire prévue arrive, et ses dates internes partent de son arrivée réelle
  for (const seed of [5, 6, 8]) {
    const s = game(seed);
    s.reps = { clients: 40, confreres: 30, siege: 40, parquet: 30 };
    s.cash = 900000;
    for (let i = 0; i < 135; i++) { if (s.night) CR.backToBed(s); while (s.min < 18 * 60) CR.spend(s, 30, "admin"); CR.endDay(s); }
    const v = s.vivier;
    const venues = Object.keys(v.arrived);
    const prevues = Object.keys(v.plan).filter((k) => v.plan[k] != null).flatMap((k) => E(k).ids);
    check(prevues.every((id) => venues.includes(id)), `graine ${seed} : affaires prévues non arrivées : ${prevues.filter((id) => !venues.includes(id)).join(",")}`);
    for (const id of venues) {
      const cs = s.cases[id];
      check(cs.vars.base === v.arrived[id] && cs.leadDay === v.arrived[id], `${id} : base ${cs.vars.base} ≠ arrivée ${v.arrived[id]}`);
    }
    const c10 = s.cases.a10_vendredi, c11 = s.cases.a11_president, c5 = s.cases.a05_placement, c12 = s.cases.a12_bijouterie, c7 = s.cases.a07_perquisition;
    if (c10) check(CR.dow(c10.vars.jugementDay) === 5 && CR.isBusinessDay(c10.vars.jugementDay) && CR.dow(c10.leadDay) === 4, "a10 : le jugement n'est pas un vendredi ouvré");
    if (c11) check(CR.dow(c11.vars.virementDay) === 1 && CR.isBusinessDay(c11.vars.virementDay), "a11 : le virement n'est pas un lundi ouvré");
    if (c7) check(c7.vars.ipcDay === c7.leadDay && CR.isBusinessDay(c7.leadDay), "a07 : interrogatoire hors du jour d'arrivée");
    if (c5) check(CR.ymd(c5.vars.base - 120).m === 7 && CR.ymd(c5.vars.base - 95).m === 8, "a05 : les virements ne sont plus en juillet et août");
    if (c12) check(CR.ymd(c12.vars.base - 335).m === 2 && CR.ymd(c12.vars.base - 340).m === 2, "a12 : l'écrou n'est plus en février");
    console.log("graine", seed, ":", venues.map((id) => `${id}@${v.arrived[id]}(${(s.cases[id].vars.arrivee || {}).canal})`).join(" "));
  }

  // 4. Conditions et canaux : un ancien client satisfait et un bon réseau ouvrent la recommandation et le confrère
  const canaux = {};
  for (let seed = 20; seed < 60; seed++) {
    const s = game(seed);
    s.reps.confreres = 26;
    const old = CR.openCase(s, "a03_crpc");
    old.status = "closed"; old.outcome = { type: "relaxe", day: 0 }; old.trust = 70;
    s.pending = s.pending.filter((e) => e.type !== "lead");
    s.vivier.plan.a03 = 0;
    CR.schedule(s, { day: 1, min: 10 * 60, type: "lead", key: "a06_messages", data: { vivier: 1 } });
    for (let i = 0; i < 3 && !s.cases.a06_messages; i++) { while (!s.cases.a06_messages && s.min < 19 * 60) CR.spend(s, 10, "admin"); if (!s.cases.a06_messages) CR.endDay(s); }
    const cs = s.cases.a06_messages;
    check(!!cs, `graine ${seed} : a06 n'est pas arrivée`);
    if (!cs) continue;
    const a = cs.vars.arrivee;
    canaux[a.canal] = (canaux[a.canal] || 0) + 1;
    if (a.canal === "recommandation") check(a.via === CR.clientName(old) && s.inbox.some((m) => m.kind === "sms" && m.from === a.via), "recommandation sans SMS de l'ancien client");
    if (a.canal === "confrere") check(s.inbox.some((m) => m.from === a.via && /Un dossier pour vous/.test(m.subject)), "dossier transmis sans courriel du confrère");
    if (a.canal === "mail") check(cs.status === "lead" && s.inbox.some((m) => m.caseId === cs.id), "premier contact par courriel absent");
  }
  console.log("canaux d'arrivée (a06, 40 graines)", JSON.stringify(canaux));
  check(Object.keys(canaux).length >= 3, "les canaux d'arrivée ne varient pas");
  // condition non remplie : report, puis abandon en fin de fenêtre
  {
    const s = game(9);
    s.reps = { clients: 0, confreres: 0, siege: 0, parquet: 0 };
    s.pending = s.pending.filter((e) => e.type !== "lead");
    s.vivier.plan = { a12: 70 };
    CR.schedule(s, { day: 70, min: 10 * 60, type: "lead", key: "a12_bijouterie", data: { vivier: 1 } });
    while (s.day < 95) { while (s.min < 18 * 60) CR.spend(s, 30, "admin"); CR.endDay(s); }
    check(!s.cases.a12_bijouterie && s.vivier.manques.includes("a12") && (s.vivier.reports || {}).a12 >= 1, "a12 sans spécialité ni réputation : devait être reportée puis abandonnée");
  }

  // 5. Permanence signée : la désignation (a02) tombe ce jour-là
  {
    let s, d2;
    for (let seed = 1; seed < 80; seed++) { s = game(seed); d2 = s.vivier.plan.a02; if (d2 != null && d2 > 12) break; }
    let duty = 3; while (!E("a02").ok(duty) || !CR.isBusinessDay(duty)) duty++;
    CR.signDuty(s, duty, "gav_jour");
    const ev = s.pending.find((e) => e.type === "lead" && e.key === "a02_sac");
    check(ev && ev.day === duty && ev.data.permanence, `a02 prévue au jour ${d2} : non ramenée au jour de permanence ${duty}`);
  }

  // 6. Chevauchement d'audiences : le premier se règle (substitution ou renvoi), les suivants sont arrangés
  {
    const s = game(4);
    s.pending = s.pending.filter((e) => e.type !== "lead");
    const open = (id) => { const cs = CR.openCase(s, id); cs.status = "active"; return cs; };
    const c1 = open("a03_crpc"), c2 = open("a06_messages"), c3 = open("a08_cycliste");
    let day = 30; while (!CR.isBusinessDay(day)) day++;
    const h1 = CR.PROC.fixAudience(CR.api(s, c1), { day, min: 13 * 60 + 30, juridiction: "tc", mode: "convocation", convocDay: 0, title: "Audience A", script: "tc" });
    const h2 = CR.PROC.fixAudience(CR.api(s, c2), { day, min: 14 * 60, juridiction: "tc", mode: "convocation", convocDay: 0, title: "Audience B", script: "tc" });
    check(h1.conflit && h2.conflit && s.vivier.chevauchement, "chevauchement non repéré");
    const ids = (cs) => CR.caseTasks(s, cs).map((t) => t.id);
    check(ids(c2).includes("substitut_" + h2.id) && ids(c2).includes("renvoi_" + h2.id), "solutions absentes du dossier : " + ids(c2).join(","));
    const call = s.pending.find((e) => e.type === "courtCall" && e.data.hid === h2.id);
    CR.demanderRenvoi(s, c2, h2);
    check(h2.day === day + 14 && c2.proc.audience.day === day + 14 && call.day === day + 14, `renvoi : audience au jour ${h2.day}, attendu ${day + 14}`);
    check(c2.obligs.find((o) => o.id === "art385_" + h2.id).due === day + 11, "renvoi : délai de l'art. 385 non recalé");
    check(s.vivier.chevauchement.solution === "renvoi" && !ids(c1).some((x) => /^substitut_|^renvoi_/.test(x)), "chevauchement non soldé après le renvoi");
    const h3 = CR.PROC.fixAudience(CR.api(s, c3), { day, min: 13 * 60 + 30, juridiction: "tc", mode: "ordonnance", convocDay: 0, title: "Audience C", script: "tc" });
    check(h3.finDeRole && !h3.conflit, "second chevauchement : devait être arrangé d'office (fin de rôle)");
    // substitution sur une autre partie
    const t = game(4);
    t.pending = t.pending.filter((e) => e.type !== "lead");
    const d1 = CR.openCase(t, "a03_crpc"), d2 = CR.openCase(t, "a12_bijouterie");
    d1.status = d2.status = "active";
    const k1 = CR.PROC.fixAudience(CR.api(t, d1), { day, min: 9 * 60 + 30, juridiction: "tc", mode: "convocation", convocDay: 0, title: "Audience D", script: "tc" });
    const k2 = CR.api(t, d2).hearing({ day, min: 10 * 60, title: "Réunion E", lieu: "cite" });
    check(k2.conflit && !CR.caseTasks(t, d2).some((x) => /^renvoi_/.test(x.id)), "audience non renvoyable : seule la substitution devait être proposée");
    CR.substituer(t, d2, k2);
    check(k2.substitue && t.vivier.chevauchement.solution === "substitution" && !k1.conflit, "substitution non enregistrée");
  }

  // 7. Ancienne sauvegarde : pas de vivier, calendrier fixe d'origine, rien de neuf ne s'y applique
  {
    const s = game(11);
    delete s.vivier;
    s.pending = s.pending.filter((e) => e.type !== "lead");
    for (const def of Object.values(CR.CASES)) if (!def.mode && !def.generated && def.arrive && def.arrive.day != null) CR.schedule(s, { day: def.arrive.day, min: def.arrive.min, type: "lead", key: def.id });
    const back = CR.deserialize(CR.serialize(s));
    CR.store.s = back;
    back.reps = { clients: 40, confreres: 30, siege: 40, parquet: 30 };
    for (let i = 0; i < 90; i++) { if (back.night) CR.backToBed(back); while (back.min < 18 * 60) CR.spend(back, 30, "admin"); CR.endDay(back); }
    const venues = back.order.map((id) => back.cases[id]).filter((c) => CR.CASES[c.def].arrive && !CR.CASES[c.def].generated);
    check(venues.length >= 10 && venues.every((c) => c.leadDay === CR.CASES[c.def].arrive.day), "ancienne sauvegarde : calendrier d'origine non respecté");
    check(!back.vivier && venues.every((c) => !c.vars.arrivee), "ancienne sauvegarde : le vivier s'y est appliqué");
    console.log("ancienne sauvegarde :", venues.map((c) => c.def + "@" + c.leadDay).join(" "));
  }

  console.log("échecs:", fails);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
