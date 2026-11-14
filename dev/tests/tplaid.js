// Plaidoirie 1.0 : genre des arguments, ordre (principal avant subsidiaire), ton selon le président et le jury,
// réplique du ministère public (art. 460 CPP), notes de débrief. Puis une audience jouée dans l'interface.
const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util");
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
(async () => {
  const { CR } = boot(); const PL = CR.PLAID;
  const A = (id, label, cards) => ({ id, label, cards: cards || [] });
  const nul = A("nullite", "La garde à vue est nulle : notification tardive des droits"), fond = A("doute", "Aucun témoin ne le reconnaît formellement"), fond2 = A("video", "La vidéo ne montre pas le geste"), peine = A("emploi", "Il travaille : un contrat depuis deux ans", ["F_emploi"]), prej = A("chiffrage", "Le préjudice moral se chiffre à 3 000 €");
  ok(PL.genre(nul) === "procedure" && PL.genre(fond) === "fond" && PL.genre(peine) === "peine" && PL.genre(prej, "pc") === "prejudice", "genres reconnus");
  ok(!PL.plan([nul, fond, peine]).inversion && PL.plan([nul, fond, peine]).subsidiaire === 2, "ordre logique, subsidiaire annoncé au 3e argument");
  ok(!!PL.plan([peine, fond]).inversion, "la peine avant la relaxe : inversion");
  ok(!!PL.plan([prej, fond], "pc").inversion && !PL.plan([fond, prej], "pc").inversion, "partie civile : la faute avant le chiffrage");
  const api = (profil, jures) => { const id = (CR.ACTEURS.find((a) => a.role === "president" && a.profil === profil) || {}).id; return { s: {}, cs: { actors: { president: id }, vars: jures ? { jures: [1, 2, 3, 4, 5, 6] } : {} } }; };
  const ev = (profil, ton, args, perts, role, jures) => PL.evaluer({ api: api(profil, jures), role, ton, res: args.map((a, i) => ({ a, pert: perts[i] })), plan: PL.plan(args, role) });
  for (const pr of ["formaliste", "presse", "curieux", "conciliant", "severe"]) ok(!!CR.ACTEURS.find((a) => a.role === "president" && a.profil === pr), "un président de profil " + pr);
  ok(ev("formaliste", "sobre", [fond, peine], [true, true]).delta > ev("formaliste", "humain", [fond, peine], [true, true]).delta, "formaliste : sobre mieux qu'humain");
  ok(ev("conciliant", "humain", [fond, peine], [true, true]).delta > ev("conciliant", "offensif", [fond, peine], [true, true]).delta, "conciliant : humain mieux qu'offensif");
  ok(ev("curieux", "offensif", [fond, fond2], [true, true]).delta > 0 && ev("curieux", "offensif", [fond, peine], [false, true]).delta < 0, "offensif : paie avec deux arguments de fond, coûte sans");
  ok(ev("severe", "humain", [peine], [true]).delta > ev("severe", "humain", [A("regret", "Il regrette sincèrement")], [true]).delta, "sévère : la personnalité documentée");
  ok(ev("formaliste", "humain", [fond], [true], undefined, true).delta > ev("formaliste", "humain", [fond], [true]).delta, "jurés : le ton humain porte davantage");
  ok(ev("curieux", "offensif", [fond, prej], [true, true], "pc").notes.some((n) => /partie civile/.test(n.text)), "partie civile offensive : recadrée");
  ok(ev("presse", "sobre", [peine, fond], [false, true]).lines.some((l) => /essentiel/.test(l.t)), "pressé : ouvrir sur un argument faible se paie");
  const R = PL.replique({ res: [{ a: fond, pert: true }, { a: peine, pert: false }] });
  ok(R && R.faible === "emploi" && R.options.length === 3 && /réplique/.test(R.line.t), "le parquet réplique sur l'argument faible");
  ok(!PL.replique({ res: [{ a: fond, pert: true }] }) && !PL.replique({ role: "pc", res: [{ a: fond, pert: false }] }), "pas de réplique sans argument faible, ni contre la partie civile");
  const cs = { vars: {} };
  ok(PL.repliqueFin(cs, R, "abandon").delta > 0 && PL.repliqueFin(cs, R, "maintien").delta < 0 && PL.repliqueFin(cs, R, "rien").delta === 0, "abandonner, maintenir, se taire");
  cs.vars.plaidNotes = [{ kind: "good", text: "x" }]; ok(PL.debrief({}, cs).some((d) => d.text === "x"), "notes reprises au débrief");
  // --- dans l'interface : une affaire générée où le client est convoqué, jouée jusqu'à la plaidoirie
  const env = await U.career(null, 7); const { w, doc, s, errors } = env;
  s.pending = s.pending.filter((e) => e.type !== "lead"); if (env.CR.GEN2.DIR) env.CR.GEN2.DIR.off = true;
  let c2 = null, h = null; const vu = { ton: false, plan: false, replique: false, plaide: false };
  { const c = env.CR.GEN.open(s, "copj", { min: s.min }); c.status = "open"; c2 = c; h = env.CR.scheduleHearing(s, c, { script: "tc", title: "Tribunal correctionnel", where: "palais", day: s.day + 1, min: 13 * 60 + 30 }); }
  if (h) {
    while (s.day < h.day) env.CR.endDay(s); env.CR.store.bump(); await sleep(30);
    env.CR.UI._setScene({ type: "court", caseId: c2.id, hid: h.id }); await sleep(80);
    for (let i = 0; i < 700; i++) {
      await sleep(25); const sc = doc.querySelector(".court-scene"); if (!sc) break;
      const pl = sc.querySelector(".plaidoirie");
      if (pl) {
        vu.ton = vu.ton || pl.querySelectorAll(".tonb").length === 3;
        const ch = pl.querySelector(".chip"); if (ch) await click(w, ch);
        for (const x of [...pl.querySelectorAll(".arg")].slice(0, 3)) if (!x.disabled) await click(w, x);
        vu.plan = vu.plan || !!sc.querySelector(".plan-ord"); const mv = sc.querySelectorAll(".plan-mv")[1]; if (mv && !mv.disabled) await click(w, mv);
        const tb = [...sc.querySelectorAll(".tonb")][1]; if (tb) await click(w, tb);
        await click(w, findBtn(doc, "Plaider")); vu.plaide = true; continue;
      }
      const rp = sc.querySelector(".replique"); if (rp) { vu.replique = true; await click(w, rp.querySelector(".choice")); continue; }
      const lim = sc.querySelector(".limine"); if (lim) { await click(w, [...lim.querySelectorAll("button.btn")].pop()); continue; }
      const hand = sc.querySelector(".hand"); if (hand) { await click(w, findBtn(doc, "Laisser passer", hand)); continue; }
      const del = sc.querySelector(".delibere"); if (del) { await click(w, findBtn(doc, "Continuer", del)); continue; }
      if (sc.querySelector(".court-done")) { await click(w, findBtn(doc, "Sortir de la salle")); break; }
      const cc = sc.querySelector(".court-choices"); if (cc) { const b = cc.querySelector("button.choice") || [...cc.querySelectorAll("button.btn")].pop(); if (b) await click(w, b); }
    }
  }
  c2 = c2 || { vars: {} };
  console.log("audience jouée :", JSON.stringify(vu), "| notes :", JSON.stringify((c2.vars.plaidNotes || []).map((n) => n.kind)));
  ok(h && vu.plaide && vu.ton, "une audience jouée : le ton se choisit dans l'interface");
  console.log("échecs:", fails); console.log("errors:", errors.length ? errors.slice(0, 4).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
