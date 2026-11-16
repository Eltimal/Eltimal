// 1.2.0 « Le carnet » : la refonte du carnet (le « mémo »).
// Chaque note porte son contexte (qui parle, dans quelle situation, quel jour et à quelle heure, en réponse à quelle
// question) ; le carnet se range et se cherche ; le joueur titre et classe. Le contexte ne trie rien à la place du
// joueur : deux notes qui ne diffèrent que par le fait qu'elles portent s'affichent exactement de la même façon.
// La prise de note en situation réelle est vérifiée dans tparole.js et tconsult.js.   « échecs: 0 » attendu.
const { boot, sleep, texts, click } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { w, doc, CR, errors } = boot(); await sleep(100);
  const s = (CR.store.s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 37 }));
  const cs = CR.GEN.open(s, "copj", {});
  cs.notes = [];
  const N = (text, src, cx, min, fact) => { s.min = min; return CR.addNote(s, cs, { text, src, fact: fact || null, cx }); };
  const a = N("J'étais chez ma sœur jusqu'à minuit.", "gav", { qui: "Bilal", ou: "Entretien confidentiel", q: "Où étiez-vous samedi soir ?", qqui: "Vous" }, 192, "G_alibi");
  const b = N("Je suis rentré à pied par le canal.", "gav", { qui: "Bilal", ou: "Entretien confidentiel", q: "Où étiez-vous samedi soir ?", qqui: "Vous" }, 192, null);
  N("Le tournevis, c'est pour mon travail.", "gav", { qui: "Bilal", ou: "Audition par l'officier", q: "Comment expliquez-vous le tournevis ?", qqui: "L'officier" }, 244);
  N("Il était là vers dix heures.", "call", { qui: "Mme Haddad", ou: "Au téléphone", q: "À quelle heure est-il parti ?", qqui: "Vous" }, 615);
  cs.notes.push({ id: "vieille", day: s.day, text: "Une note d'une sauvegarde ancienne.", fact: null, src: "call" }); // avant la 1.2.0 : ni heure ni contexte
  CR.addOwnNote(s, cs, { text: "Demander le contrat d'intérim." });
  ok(a.min === 192 && a.cx.q && !CR.addNote(s, cs, { text: a.text, src: "gav" }), "la note garde l'heure et le contexte, sans doublon");
  const host = doc.createElement("div"); doc.body.appendChild(host);
  const root = w.ReactDOM.createRoot(host);
  root.render(w.React.createElement(CR.UI.Carnet, { s, cs, full: true })); await sleep(60);
  const lignes = () => [...host.querySelectorAll(".carnet-line")], groupes = () => [...host.querySelectorAll(".carnet-groupe")].map(texts);
  const choisir = async (sel, v) => { const el = host.querySelector(sel); const set = Object.getOwnPropertyDescriptor(el.tagName === "SELECT" ? w.HTMLSelectElement.prototype : w.HTMLInputElement.prototype, "value").set; set.call(el, v); el.dispatchEvent(new w.Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true })); await sleep(40); };
  // rangé par situation : un en-tête par situation et par jour ; la ligne dit qui parle, l'heure, la question
  ok(lignes().length === 6 && groupes().length === 5, "six notes en cinq situations", groupes().join(" | "));
  ok(groupes().some((g) => /^Entretien confidentiel · .*2$/.test(g)) && groupes().some((g) => /^Au téléphone/.test(g)) && groupes().some((g) => /^Note écrite/.test(g)), "en-têtes de situation", groupes().join(" | "));
  const la = lignes().find((l) => /chez ma sœur/.test(texts(l)));
  ok(/Bilal · 3 h 12/.test(texts(la.querySelector(".nt-meta"))) && /Vous :.*Où étiez-vous samedi soir \?/.test(texts(la.querySelector(".nt-q"))), "la ligne donne l'interlocuteur, l'heure et la question", texts(la));
  ok(/L'officier :/.test(texts(lignes().find((l) => /tournevis/.test(texts(l))).querySelector(".nt-q"))), "une réponse à l'officier dit que la question est la sienne");
  // une note d'une ancienne sauvegarde : pas de question, la source pour situation, aucune erreur
  const vieille = lignes().find((l) => /sauvegarde ancienne/.test(texts(l)));
  ok(vieille && !vieille.querySelector(".nt-q") && groupes().some((g) => /^Entretien ou appel/.test(g)), "note sans contexte : repli sur la source");
  // le contexte ne choisit pas à la place du joueur : la note qui porte un fait et celle qui n'en porte pas ont le même habillage
  const forme = (l) => l.className + "|" + [...l.querySelectorAll("*")].map((x) => x.tagName + "." + x.className).join(",");
  const lb = lignes().find((l) => /par le canal/.test(texts(l)));
  ok(forme(la) === forme(lb), "une note utile et une note sans portée s'affichent de la même façon", forme(la) + " ≠ " + forme(lb));
  ok(!/G_alibi/.test(host.innerHTML), "le fait porté par une note n'apparaît nulle part");
  // chercher : dans la phrase, dans la question, dans le nom
  await choisir(".carnet-mot", "tournevis"); ok(lignes().length === 1, "chercher un mot de la phrase", lignes().length);
  await choisir(".carnet-mot", "a quelle heure"); ok(lignes().length === 1 && /dix heures/.test(texts(lignes()[0])), "chercher un mot de la question, sans les accents", lignes().length);
  await choisir(".carnet-mot", "haddad"); ok(lignes().length === 1, "chercher un nom", lignes().length);
  await choisir(".carnet-mot", "");
  // ranger par personne
  await choisir("select[aria-label='Ranger les notes']", "personne");
  ok(groupes().length === 4 && groupes().some((g) => /^Bilal3$/.test(g)) && groupes().some((g) => /^Vous1$/.test(g)), "rangé par personne", groupes().join(" | "));
  await choisir("select[aria-label='Ranger les notes']", "ajout"); ok(groupes().length === 0 && lignes().length === 6, "ordre de prise : sans en-tête");
  ok(/Entretien confidentiel/.test(texts(lignes()[0].querySelector(".nt-meta"))), "sans en-tête, la ligne porte aussi la situation et le jour", texts(lignes()[0]));
  // le joueur titre et classe : c'est lui qui trie
  await click(w, lignes()[0].querySelector(".nact")); await sleep(40);
  CR.setNote(cs, a.id, { titre: "Alibi : chez sa sœur", cat: "decharge" }); CR.UI.bump(); root.render(w.React.createElement(CR.UI.Carnet, { s, cs, full: true, key: 2 })); await sleep(60);
  const titree = lignes().find((l) => /chez ma sœur/.test(texts(l)));
  ok(titree && texts(titree.querySelector(".nt-titre")) === "Alibi : chez sa sœur" && /Décharge/.test(texts(titree.querySelector(".ncat"))), "le titre et la catégorie du joueur s'affichent", titree && texts(titree));
  await choisir(".carnet-mot", "alibi"); ok(lignes().length === 1, "le titre du joueur se cherche");
  // à la barre : la carte d'une note dit d'où elle vient, et porte le titre du joueur
  const main = CR.handOf(s, cs).filter((c) => c.kind === "note");
  ok(main.find((c) => c.titre === "Alibi : chez sa sœur" && /Bilal · Entretien confidentiel/.test(c.d)) && main.every((c) => c.label), "la main d'audience porte le contexte", JSON.stringify(main[0]));
  ok(errors.length === 0, "aucune erreur", errors.slice(0, 2).join(" | "));
  console.log("tcarnet — échecs: " + echecs);
  process.exit(echecs ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
