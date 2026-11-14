// Refonte : les incidents d'audience soulevés par la défense, en geste (fin des choix d'incidents à options). node tests/tincidents.js
// « échecs: 0 » attendu. En mode libre, aucune invite n'annonce la récidive, la prescription ou la plainte fiscale ; le
// geste « Soulever un incident » est offert partout ; fondé, il produit ses effets ; sans pièce, le président demande sur
// quoi il repose ; sans objet, il est écarté. En mode assisté, le choix guidé reste.
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 500) : "")); } };
  const { w, doc, CR, errors } = boot(); await sleep(50);
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 37 }); CR.store.s = s; s.settings.saisie = "libre"; s.settings.parole = "libre"; s.settings.textSpeed = 6;
  const attendre = async (f, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const x = f(); if (x) return x; await sleep(120); } return null; };
  const trouver = (pred, genres = ["copj"]) => { for (let i = 0; i < 2500; i++) { let cs; try { cs = CR.GEN.open(s, genres[i % genres.length], {}); } catch (e) { continue; } if (cs.camp === "pc") continue; const p = CR.GEN.paramsOf(s, cs.id); if (p && p.t && pred(p.t)) return { cs, t: p.t }; } return null; };
  // joue l'audience jusqu'à la première réplique, soulève l'incident, rend le texte de la salle
  const jouer = async (x, choix, attendu) => {
    const def = CR.caseDef(x.cs), api = CR.api(s, x.cs);
    const nom = Object.keys(def.audiences).find((k) => !/^vie_|ci$/.test(k)) || Object.keys(def.audiences)[0];
    const sc = def.audiences[nom](api, {});
    const host = doc.createElement("div"); doc.body.appendChild(host);
    const root = w.ReactDOM.createRoot(host); root.render(w.React.createElement(CR.UI.AudienceScene, { s, cs: x.cs, steps: sc.steps, title: sc.title, sub: sc.sub, decor: sc.decor, onEnd: () => {} }));
    const b = await attendre(() => findBtn(host, /Soulever un incident/));
    ok(b, `${x.cs.id} : pas de geste « Soulever un incident »`, texts(host).slice(0, 300));
    const avant = texts(host);
    ok(!/des observations sur l'état de récidive|Rien sur la prescription|Rien sur la recevabilité/.test(avant), `${x.cs.id} : une invite annonce l'incident`);
    if (b) {
      await click(w, b);
      for (const c of choix) { const bb = await attendre(() => findBtn(host, c)); ok(bb, `${x.cs.id} : choix ${c} introuvable`, texts(host).slice(-300)); if (bb) await click(w, bb); }
      if (attendu) await attendre(() => attendu.test(texts(host)), 25000);
      await sleep(300);
    }
    const tx = texts(host); root.unmount(); host.remove();
    return tx;
  };
  // 1. récidive viciée, bien soulevée : écartée
  const a = trouver((t) => t.rec && t.recid && t.recid.vice && !t.PM);
  ok(a, "pas d'affaire en récidive viciée");
  if (a) {
    CR.addNote(s, a.cs, { text: "Bulletin n° 1 : dates de la condamnation.", fact: "G_ant", src: "dossier" });
    const tx = await jouer(a, [/L'état de récidive légale n'est pas constitué/, new RegExp(CR.GEN2.VICES[a.t.recid.vice].slice(0, 25))], /état de récidive légale est écarté/);
    ok(a.cs.vars.recEcartee && /écarté des débats/.test(tx), `${a.cs.id} : la récidive viciée n'est pas écartée`, tx.slice(-500));
  }
  // 2. le même incident sans pièce au dossier : sur quoi repose-t-il ?
  const b = trouver((t) => t.rec && t.recid && t.recid.vice && !t.PM);
  if (b) { const tx = await jouer(b, [/L'état de récidive légale n'est pas constitué/, new RegExp(CR.GEN2.VICES[b.t.recid.vice].slice(0, 25))], /permet de le dire/); ok(!b.cs.vars.recEcartee && /permet de le dire/.test(tx), `${b.cs.id} : incident sans pièce accueilli`, tx.slice(-400)); }
  // 3. sans objet : pas de récidive dans l'affaire
  const c = trouver((t) => !t.rec);
  if (c) { const tx = await jouer(c, [/L'état de récidive légale n'est pas constitué/, /délai de la récidive/], /L'incident est écarté/); ok(/n'est pas poursuivi en état de récidive légale/.test(tx) && /L'incident est écarté/.test(tx), `${c.cs.id} : incident sans objet non écarté`, tx.slice(-400)); }
  // 4. la prescription, quand l'affaire la permet
  const d = trouver((t) => !!t.presc, ["copj", "ci"]);
  if (d) {
    CR.addNote(s, d.cs, { text: "Comptes approuvés.", fact: "G_comptes", src: "dossier" });
    const tx = await jouer(d, [/La prescription de l'action publique/], /joint l'incident|exception est rejetée/);
    ok(d.cs.vars.prescSoulevee, `${d.cs.id} : la prescription soulevée n'est pas examinée`, tx.slice(-400));
  } else console.log("  (aucune affaire à prescription tirée)");
  // 5. en mode assisté, le choix guidé reste
  s.settings.parole = "assiste";
  const e = trouver((t) => t.rec && t.recid && !t.PM);
  if (e) {
    const def = CR.caseDef(e.cs), api = CR.api(s, e.cs), nom = Object.keys(def.audiences).find((k) => !/^vie_|ci$/.test(k)) || Object.keys(def.audiences)[0];
    const sc = def.audiences[nom](api, {});
    const chercher = (L) => { for (const st of L || []) { if (!st) continue; if (st.do) { let r = null; try { r = st.do(api, { incidents: {}, played: new Set() }); } catch (e) { r = null; } if (Array.isArray(r) && r.some((z) => z && z.choose)) return true; } } return false; };
    if (process.env.DBG) console.log("DBG", CR.libre(s), nom, sc.steps.map((z) => Object.keys(z || {}).join("+")).join("|"));
    ok(chercher(sc.steps), `${e.cs.id} : le mode assisté a perdu le choix guidé`);
  }
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
