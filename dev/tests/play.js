// Outils de partie automatisée
const { sleep, texts, findBtn, click } = require("./harness");
async function waitFor(fn, ms = 8000, step = 40) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const r = fn(); if (r) return r; await sleep(step); } return null; }
function rail(doc, name) { return [...doc.querySelectorAll(".rail-btn")].find((x) => texts(x).startsWith(name)); }
// Mène un appel : note tout, pose toutes les questions (sauf celles marquées "bad" si skipBad), choisit des conseils
async function runCall(w, doc, CR, o = {}) {
  await waitFor(() => doc.querySelector(".call-scene"));
  for (let guard = 0; guard < 40; guard++) {
    const skip = [...doc.querySelectorAll("button.link")].find((b) => texts(b).includes("Afficher toute la réponse"));
    if (skip) { await click(w, skip); await sleep(60); }
    for (const seg of [...doc.querySelectorAll(".call-scene .noteable")]) if (!seg.classList.contains("seg-noted") && texts(seg).length > 3) { await click(w, seg); }
    const qs = [...doc.querySelectorAll(".q-btn")].filter((b) => !(o.avoid || []).some((r) => r.test(texts(b))));
    if (!qs.length) break;
    await click(w, qs[0]);
    await sleep(80);
  }
  const skip = [...doc.querySelectorAll("button.link")].find((b) => texts(b).includes("Afficher toute la réponse"));
  if (skip) { await click(w, skip); await sleep(60); }
  for (const seg of [...doc.querySelectorAll(".call-scene .noteable")]) if (!seg.classList.contains("seg-noted") && texts(seg).length > 3) await click(w, seg);
  const adv = findBtn(doc, "Conclure par des conseils");
  if (adv && o.advice) {
    await click(w, adv);
    for (const lab of [...doc.querySelectorAll(".advice label")]) if (o.advice.some((r) => r.test(texts(lab)))) await click(w, lab.querySelector("input"));
    await click(w, findBtn(doc, "Le dire et terminer"));
  } else {
    const end = findBtn(doc, /^(Terminer|Raccrocher)$/);
    await click(w, end);
  }
  await waitFor(() => findBtn(doc, /^Terminer$/, doc.querySelector(".closing")));
  await click(w, findBtn(doc, /^Terminer$/, doc.querySelector(".closing")));
  await sleep(100);
}
async function openCase(w, doc, title) {
  await click(w, rail(doc, "Dossiers"));
  let c = [...doc.querySelectorAll(".case-card")].find((x) => texts(x).includes(title));
  // Un dossier déjà ouvert (souvent un dossier clos) masque la liste : on revient à la liste.
  const back = doc.querySelector('button[aria-label="Retour"]');
  if (!c && back) { await click(w, back); c = [...doc.querySelectorAll(".case-card")].find((x) => texts(x).includes(title)); }
  if (c) await click(w, c);
}
function taskBtn(doc, re) { return [...doc.querySelectorAll(".task")].find((b) => re.test(texts(b)) && !b.disabled); }
async function runTask(w, doc, re, mode = "metro") {
  const t = taskBtn(doc, re);
  if (!t) throw new Error("tâche introuvable " + re);
  await click(w, t);
  await sleep(60);
  const wt = [...doc.querySelectorAll(".modal-foot button")].find((b) => /^Attendre jusqu/.test(texts(b)));
  if (wt) { await click(w, wt); await sleep(60); }
  const tr = doc.querySelector(".modal .decide-opt");
  if (tr && doc.querySelector(".modal-head h2") && /^Aller/.test(texts(doc.querySelector(".modal-head h2")))) { await click(w, [...doc.querySelectorAll(".modal .decide-opt")][mode === "taxi" ? 1 : 0]); await sleep(80); }
  const wt2 = [...doc.querySelectorAll(".modal-foot button")].find((b) => /^Attendre jusqu/.test(texts(b)));
  if (wt2) { await click(w, wt2); await sleep(60); }
}
// Remplit un gabarit : pour chaque blanc, la note dont le fait est accepté, sinon la 1re option correcte ; coche les cases demandées
async function fillDraft(w, doc, CR, cs, o = {}) {
  await waitFor(() => doc.querySelector(".draft-scene"));
  const tplKey = o.key;
  const tpl = CR.getTpl(CR.store.s, cs, tplKey);
  for (const [id, sl] of Object.entries(tpl.slots || {})) {
    if (sl.type === "auto") continue;
    const btn = [...doc.querySelectorAll(".slot")].find((b) => texts(b) === `[${sl.label}]`);
    if (!btn) continue;
    await click(w, btn);
    if (sl.type === "fact") {
      const note = cs.notes.find((n) => n.fact && sl.accept.includes(n.fact));
      if (!note) continue;
      const li = [...doc.querySelectorAll(".carnet-pick")].find((l) => texts(l).includes(note.text.slice(0, 30)));
      if (li) await click(w, li);
    } else {
      const want = (o.choose && o.choose[id]) || sl.options.find((x) => x.ok).t;
      const ch = [...doc.querySelectorAll(".slot-panel .choice")].find((b) => texts(b).startsWith(want.slice(0, 40)));
      if (ch) await click(w, ch);
    }
  }
  for (const box of [...doc.querySelectorAll(".draft-checks input[type=checkbox]")]) {
    const lab = texts(box.closest("label"));
    if (!box.disabled && (o.check || []).some((r) => r.test(lab))) await click(w, box);
  }
  const fin = findBtn(doc, /^(Terminer la rédaction|Envoyer|Faire signer)$/);
  await click(w, fin);
  const v = findBtn(doc, "Valider avec des blancs");
  if (v) await click(w, v);
  await sleep(80);
}
// Relève une irrégularité comme le joueur : cliquer le passage, « Relever une irrégularité », qualifier, envoyer au bloc-notes
async function releve(w, doc, seg, type) {
  if (!seg) throw new Error("passage introuvable");
  await click(w, seg);
  await click(w, findBtn(doc, "Relever une irrégularité"));
  if (type) { const chip = [...doc.querySelectorAll(".pop-types .nchip")].find((b) => texts(b).startsWith(type)); if (chip) await click(w, chip); }
  await click(w, findBtn(doc, "Envoyer au bloc-notes"));
}
module.exports = { waitFor, rail, runCall, openCase, taskBtn, runTask, fillDraft, releve };
