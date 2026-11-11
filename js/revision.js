/* La Permanence — mode révision CRFPA : le mini cas pratique de fin d'affaire.
   Chaque fiche du classeur porte déjà ses notions (règle, article, rubrique du programme) et son corrigé (problème, règle,
   application). CR.casPratique(s, f) en tire deux à quatre questions : un problème dont il faut trouver la règle parmi
   d'autres règles exactes mais étrangères au problème (prises dans les autres fiches du classeur d'abord), puis une règle
   dont il faut retrouver le texte. Rien n'est inventé : toutes les propositions viennent des fiches du jeu.
   Le résultat est gardé dans la fiche (f.cas = { n, ok, day, rep }) et compté dans le classeur (CR.casBilan). */
(function () {
  const CR = window.CR, UI = CR.UI;
  const { html, Btn, cx } = UI;
  const { useState } = React;
  const nums = (t) => new Set(String(t || "").match(/\d{2,4}(?:-\d+)*/g) || []);
  const proche = (a, b) => { const A = nums(a), B = nums(b); for (const x of A) if (B.has(x)) return true; return false; };
  const melange = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

  CR.casPratique = function (s, f) {
    if (!f) return [];
    const r = CR.seeded("cas:" + (f.caseId || f.id) + ":" + (s.seed || 0));
    const autresFiches = (s.classeur || []).filter((x) => x.id !== f.id);
    const regles = (fi) => (fi.notions || []).map((n) => n.regle).concat((fi.corrige || []).map((c) => c.regle)).filter(Boolean);
    const loin = [...new Set(autresFiches.flatMap(regles))], pres = [...new Set(regles(f))];
    const qs = [];
    for (const c of (f.corrige || []).slice(0, 3)) {
      if (!c.probleme || !c.regle) continue;
      const cand = melange(loin.filter((x) => x !== c.regle && !proche(x, c.regle)), r).concat(melange(pres.filter((x) => x !== c.regle && !proche(x, c.regle)), r));
      const faux = [...new Set(cand)].slice(0, 3);
      if (faux.length < 2) continue;
      const options = melange([c.regle].concat(faux), r);
      qs.push({ type: "regle", titre: "Quelle règle résout ce problème ?", enonce: c.probleme, options, bonne: options.indexOf(c.regle), corrige: c.application || "" });
    }
    const arts = [...new Set((s.classeur || []).flatMap((fi) => (fi.notions || []).map((n) => n.art)).filter(Boolean))];
    for (const n of melange(f.notions || [], r)) {
      if (qs.length >= 4 || qs.filter((q) => q.type === "article").length >= 2) break;
      if (!n.art || !n.regle) continue;
      const faux = melange(arts.filter((a) => a !== n.art && !proche(a, n.art)), r).slice(0, 3);
      if (faux.length < 2) continue;
      const options = melange([n.art].concat(faux), r);
      // la règle ne doit pas donner elle-même le numéro
      const enonce = n.regle.replace(/\s*\((?:art\.|articles?)[^)]*\)/g, "");
      if (proche(enonce, n.art)) continue;
      qs.push({ type: "article", titre: "Quel texte fonde cette règle ?", enonce, options, bonne: options.indexOf(n.art), corrige: `${n.titre} : ${n.art}${n.prog && CR.PROGRAMME[n.prog] ? " (" + CR.PROGRAMME[n.prog] + ")" : ""}.` });
    }
    return qs.slice(0, 4);
  };
  CR.casBilan = (s) => { let n = 0, ok = 0, faits = 0; for (const f of s.classeur || []) if (f.cas) { faits++; n += f.cas.n; ok += f.cas.ok; } return { n, ok, faits, fiches: (s.classeur || []).length }; };

  UI.CasPratique = function CasPratique({ s, f }) {
    const [qs] = useState(() => CR.casPratique(s, f));
    const [rep, setRep] = useState(() => (f.cas && f.cas.rep) || []);
    const [ouvert, setOuvert] = useState(!f.cas);
    if (!qs.length) return null;
    const i = rep.length, fini = i >= qs.length;
    const ok = rep.filter((x, k) => qs[k] && x === qs[k].bonne).length;
    const choisir = (k) => {
      const next = rep.concat(k);
      setRep(next);
      if (CR.SON) CR.SON.jouer(k === qs[i].bonne ? "bien" : "erreur");
      if (next.length >= qs.length) { f.cas = { n: qs.length, ok: next.filter((x, j) => x === qs[j].bonne).length, day: s.day, rep: next }; if (CR.autosave) CR.autosave(); }
      CR.store.bump();
    };
    const refaire = () => { setRep([]); setOuvert(true); };
    const Q = (q, k, choisie) => html`<div key=${k} className="cas-q">
      <p className="cas-t"><span className="cas-n">${k + 1}</span>${q.titre}</p>
      <p className="cas-enonce">${q.enonce}</p>
      <div className="cas-opts">${q.options.map((o, j) => html`<button key=${j} type="button" disabled=${choisie != null} className=${cx("cas-opt", choisie != null && j === q.bonne && "bonne", choisie === j && j !== q.bonne && "fausse")} onClick=${() => choisir(j)}>${o}</button>`)}</div>
      ${choisie != null && html`<p className=${cx("cas-corr", choisie === q.bonne ? "ok" : "ko")}><strong>${choisie === q.bonne ? "Exact." : "Ce n'était pas cela."}</strong> ${q.corrige}</p>`}
    </div>`;
    return html`<section className="cas-pratique" aria-label="Mini cas pratique">
      <header className="cas-head"><span className="cas-titre">Mini cas pratique</span>${fini ? html`<span className=${cx("cas-score", ok === qs.length && "tout")}>${ok} / ${qs.length}</span>` : html`<span className="cas-score">${i + 1} / ${qs.length}</span>`}${fini && html`<button type="button" className="link small" onClick=${() => (ouvert ? refaire() : setOuvert(true))}>${ouvert ? "Refaire" : "Revoir"}</button>`}</header>
      ${ouvert && html`<p className="cas-rappel"><strong>${f.titre}.</strong> ${f.phrase || ""}</p>`}
      ${!ouvert ? null : fini ? qs.map((q, k) => Q(q, k, rep[k])) : html`${qs.slice(0, i).map((q, k) => Q(q, k, rep[k]))}${Q(qs[i], i, null)}`}
      ${fini && ouvert && html`<p className="cas-fin">${ok === qs.length ? "Sans faute. Cette fiche est acquise." : "Les règles manquées sont dans la fiche ci-dessous ; refaites le cas dans quelques jours."}</p>`}
    </section>`;
  };
})();
