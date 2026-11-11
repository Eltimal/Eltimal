const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  const { w, CR, doc, errors } = boot();
  await sleep(300);
  console.log("title:", texts(doc.querySelector("h1") || doc.body).slice(0, 60));
  await click(w, findBtn(doc, "Nouvelle partie"));
  await click(w, findBtn(doc, /^Tutoriel/));
  await sleep(200);
  const s = CR.store.s;
  console.log("mode", s.mode, "day", s.day, "min", s.min, "inbox", s.inbox.length, "pending", s.pending.map(e=>e.type+":"+e.key+"@"+e.day+"/"+e.min).join(","));
  for (const p of ["Messagerie", "Téléphone", "Dossiers", "Agenda", "Carte", "Bibliothèque", "Cabinet", "Classeur", "Journal", "Bureau"]) {
    const b = [...doc.querySelectorAll(".rail-btn")].find((x) => texts(x).startsWith(p));
    await click(w, b);
    await sleep(60);
  }
  // lire les mails
  await click(w, [...doc.querySelectorAll(".rail-btn")].find((x) => texts(x).startsWith("Messagerie")));
  for (const m of [...doc.querySelectorAll(".mail")]) { await click(w, m); }
  console.log("after reading min", CR.fmtTime(s.min), "ring", s.ring && s.ring.from);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})();
