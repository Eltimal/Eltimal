// Assises 1.0 : témoins et experts à la barre — serment, déposition, une question au plus à chacun,
// enjeux posés à celui qui sait, conséquence de la liste arrêtée à la réunion préparatoire.
const { boot } = require("./harness");
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
(async () => {
  const { CR, errors } = boot();
  if (CR.GEN2.DIR) CR.GEN2.DIR.off = true;
  let n = 0, avecQ = 0, perdus = 0, sermT = 0, sermE = 0, sans335 = 0; const ids = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed })); s.day = 20;
    const cs = CR.GEN.open(s, "info", { min: 600 }); const def = CR.caseDef(cs); const api = CR.api(s, cs);
    if (!def.audiences || !def.audiences.proces) continue;
    for (const liste of [null, ["enqueteur"], ["enqueteur", "psy", "perso"], ["legiste", "temoin", "temoin2"]]) {
      cs.vars.liste = liste || undefined;
      let a; try { a = def.audiences.proces(api); } catch (e) { ok(false, `seed ${seed} : ${String(e.stack || e).slice(0, 300)}`); continue; }
      n++;
      const st = a.steps, qs = st.filter((x) => x.questions);
      ok(qs.every((x) => x.questions.max === 1 && x.questions.options.length >= 1), `seed ${seed} : une question au plus par personne`);
      const all = qs.flatMap((x) => x.questions.options.map((o) => o.id));
      ok(new Set(all).size === all.length, `seed ${seed} : pas deux fois la même question (${all.join(",")})`);
      all.forEach((i) => ids.add(i.replace(/^q_(?!hors|enq|leg|psy|tem).*/, "q_enjeu")));
      for (const q of qs) { const i = st.indexOf(q); ok(st[i - 1].who === "temoin" && st[i - 2].who === "sys" && /serment/.test(st[i - 2].t), `seed ${seed} : serment, déposition, question`); }
      sermT += st.filter((x) => x.who === "sys" && /sans haine et sans crainte/.test(x.t || "")).length; sermE += st.filter((x) => x.who === "sys" && /en son honneur et en sa conscience/.test(x.t || "")).length;
      sans335 += st.filter((x) => x.who === "sys" && /art\. 335/.test(x.t || "")).length;
      if (qs.some((x) => x.questions.options.some((o) => o.f))) avecQ++;
      if (st.some((x) => x.who === "sys" && /La liste a été arrêtée/.test(x.t || ""))) perdus++;
      if (liste && liste.length === 1) ok(qs.length <= 1, `seed ${seed} : un seul témoin cité, une seule série de questions`);
      ok(st.some((x) => x.plaidoirie || x.who === "adverse") && st.some((x) => x.delibere), `seed ${seed} : le procès va jusqu'au délibéré`);
    }
  }
  ok(n >= 40, "procès construits : " + n); ok(avecQ > n / 3, "questions tirées des enjeux du dossier : " + avecQ); ok(perdus > 0, "une liste trop courte prive d'une question : " + perdus);
  ok(sermT > 0 && sermE > 0, `serments : ${sermT} témoins, ${sermE} experts`);
  console.log("procès", n, "| avec question d'enjeu", avecQ, "| enjeu sans témoin", perdus, "| sans serment (art. 335)", sans335, "| types de questions", [...ids].sort().join(", "));
  console.log("échecs:", fails); console.log("errors:", errors.length ? errors.slice(0, 4).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
